'use client';

import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCreditStore } from '@/stores/credit.store';

interface ExecutionResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: unknown;
  creditsCost: number;
  duration: number;
}

interface ProgressEvent {
  status: string;
  message?: string;
  stepIndex?: number;
  totalSteps?: number;
  timestamp?: number;
}

interface UseToolExecutionReturn {
  execute: (slug: string, input: Record<string, unknown>, options?: { useOwnKey?: boolean }) => Promise<void>;
  isExecuting: boolean;
  result: ExecutionResult | null;
  error: string | null;
  progress: ProgressEvent | null;
  reset: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';
const POLL_INTERVAL = 2000;
const MAX_POLLS = 60;

/**
 * Attempts to stream execution updates via SSE.
 * Returns true if SSE connected and delivered a final result.
 * Returns false if SSE failed to connect (caller should fall back to polling).
 */
function trySSEStream(
  executionId: string,
  token: string,
  callbacks: {
    onProgress: (event: ProgressEvent) => void;
    onComplete: (result: ExecutionResult) => void;
    onError: (error: string) => void;
  }
): { connected: Promise<boolean>; cleanup: () => void } {
  let eventSource: EventSource | null = null;
  let resolved = false;

  const cleanup = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const connected = new Promise<boolean>((resolve) => {
    try {
      const url = `${API_URL}/stream/executions/${executionId}/stream?token=${encodeURIComponent(token)}`;
      eventSource = new EventSource(url);

      // Connection opened successfully
      eventSource.onopen = () => {
        resolved = true;
        resolve(true);
      };

      // Handle progress events
      eventSource.addEventListener('progress', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onProgress({
            status: data.status || 'running',
            message: data.message,
            stepIndex: data.stepIndex,
            totalSteps: data.totalSteps,
            timestamp: data.timestamp,
          });
        } catch {
          // Ignore malformed events
        }
      });

      // Handle running status
      eventSource.addEventListener('running', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onProgress({
            status: 'running',
            message: data.message || 'Executing...',
            timestamp: data.timestamp,
          });
        } catch {
          // Ignore
        }
      });

      // Handle completed
      eventSource.addEventListener('completed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onComplete({
            id: executionId,
            status: 'completed',
            output: data.output,
            creditsCost: data.creditsCharged ?? 0,
            duration: data.durationMs ?? 0,
          });
        } catch {
          callbacks.onError('Failed to parse completion event');
        }
        cleanup();
      });

      // Handle failed
      eventSource.addEventListener('failed', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          callbacks.onComplete({
            id: executionId,
            status: 'failed',
            output: null,
            creditsCost: 0,
            duration: data.durationMs ?? 0,
          });
        } catch {
          callbacks.onError('Execution failed');
        }
        cleanup();
      });

      // Handle timeout
      eventSource.addEventListener('timeout', () => {
        callbacks.onError('Execution timed out');
        cleanup();
      });

      // Handle error event
      eventSource.addEventListener('error', () => {
        callbacks.onError('Execution stream error');
        cleanup();
      });

      // Generic error (connection failure)
      eventSource.onerror = () => {
        if (!resolved) {
          resolved = true;
          resolve(false); // SSE failed to connect, fall back to polling
        }
        cleanup();
      };

      // Timeout: if no open event within 3 seconds, fall back
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
          cleanup();
        }
      }, 3000);
    } catch {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }
  });

  return { connected, cleanup };
}

export function useToolExecution(): UseToolExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const token = useAuthStore((s) => s.token);
  const fetchBalance = useCreditStore((s) => s.fetchBalance);
  const deductCredits = useCreditStore((s) => s.deductCredits);

  const pollExecution = useCallback(
    async (executionId: string, authToken: string): Promise<ExecutionResult> => {
      for (let i = 0; i < MAX_POLLS; i++) {
        const res = (await api.executions.get(authToken, executionId)) as {
          success: boolean;
          data: ExecutionResult;
        };
        const execution = res.data || res as unknown as ExecutionResult;
        if (execution.status === 'completed' || execution.status === 'failed') {
          return execution;
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
      throw new Error('Execution timed out. Check your history for results.');
    },
    []
  );

  const execute = useCallback(
    async (slug: string, input: Record<string, unknown>, options?: { useOwnKey?: boolean }) => {
      if (!token) {
        setError('You must be logged in to run tools.');
        return;
      }

      setIsExecuting(true);
      setError(null);
      setResult(null);
      setProgress(null);

      try {
        const executeBody: Record<string, unknown> = { input };
        if (options?.useOwnKey) {
          executeBody.useOwnKey = true;
        }

        const res = (await api.tools.execute(token, slug, input, options)) as {
          success: boolean;
          data: { executionId: string; creditsCost: number };
        };
        const response = res.data || res as unknown as { executionId: string; creditsCost: number };

        if (response.creditsCost) {
          deductCredits(response.creditsCost);
        }

        // Try SSE first
        const sse = trySSEStream(response.executionId, token, {
          onProgress: (evt) => setProgress(evt),
          onComplete: (executionResult) => {
            setResult(executionResult);
            setIsExecuting(false);
            fetchBalance(token);
          },
          onError: (errMsg) => {
            setError(errMsg);
            setIsExecuting(false);
            fetchBalance(token);
          },
        });

        cleanupRef.current = sse.cleanup;

        // Always poll in parallel — SSE may miss events due to race conditions
        // (execution can complete before SSE subscription is active)
        const pollPromise = pollExecution(response.executionId, token);

        const sseConnected = await sse.connected;

        if (!sseConnected) {
          // SSE failed to connect — rely entirely on polling
          setProgress({ status: 'running', message: 'Processing...' });
          const executionResult = await pollPromise;
          setResult(executionResult);
          setIsExecuting(false);
          fetchBalance(token);
        } else {
          // SSE connected — but also race with polling as a safety net
          // If SSE delivers the result first, the callbacks handle it
          // If polling finishes first (SSE missed the event), use polling result
          pollPromise.then((executionResult) => {
            if (executionResult.status === 'completed' || executionResult.status === 'failed') {
              setResult(executionResult);
              setIsExecuting(false);
              fetchBalance(token);
              if (cleanupRef.current) cleanupRef.current();
            }
          }).catch(() => {
            // Polling failed — SSE might still deliver
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Execution failed');
        setIsExecuting(false);
        // Refresh balance in case of failure (credits may be refunded)
        fetchBalance(token);
      }
    },
    [token, deductCredits, pollExecution, fetchBalance]
  );

  const reset = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setIsExecuting(false);
    setResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return { execute, isExecuting, result, error, progress, reset };
}
