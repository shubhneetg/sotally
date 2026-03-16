'use client';

import { useState, useCallback } from 'react';
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

interface UseToolExecutionReturn {
  execute: (slug: string, input: Record<string, unknown>) => Promise<void>;
  isExecuting: boolean;
  result: ExecutionResult | null;
  error: string | null;
  reset: () => void;
}

const POLL_INTERVAL = 1500;
const MAX_POLLS = 40;

export function useToolExecution(): UseToolExecutionReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);
  const fetchBalance = useCreditStore((s) => s.fetchBalance);
  const deductCredits = useCreditStore((s) => s.deductCredits);

  const pollExecution = useCallback(
    async (executionId: string, authToken: string): Promise<ExecutionResult> => {
      for (let i = 0; i < MAX_POLLS; i++) {
        const execution = (await api.executions.get(authToken, executionId)) as ExecutionResult;
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
    async (slug: string, input: Record<string, unknown>) => {
      if (!token) {
        setError('You must be logged in to run tools.');
        return;
      }

      setIsExecuting(true);
      setError(null);
      setResult(null);

      try {
        const response = (await api.tools.execute(token, slug, input)) as {
          executionId: string;
          creditsCost: number;
        };

        deductCredits(response.creditsCost);

        const executionResult = await pollExecution(response.executionId, token);
        setResult(executionResult);

        // Refresh balance from server after execution completes
        fetchBalance(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Execution failed');
      } finally {
        setIsExecuting(false);
      }
    },
    [token, deductCredits, pollExecution, fetchBalance]
  );

  const reset = useCallback(() => {
    setIsExecuting(false);
    setResult(null);
    setError(null);
  }, []);

  return { execute, isExecuting, result, error, reset };
}
