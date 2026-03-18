'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Send,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Rocket,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sotally.com/api';

type GenerationStatus =
  | 'queued'
  | 'parsing'
  | 'generating'
  | 'building'
  | 'deploying'
  | 'succeeded'
  | 'failed';

const STATUS_STEPS: { key: GenerationStatus; label: string }[] = [
  { key: 'queued', label: 'Queued' },
  { key: 'parsing', label: 'Parsing prompt' },
  { key: 'generating', label: 'Generating code' },
  { key: 'building', label: 'Building app' },
  { key: 'deploying', label: 'Deploying' },
  { key: 'succeeded', label: 'Done' },
];

interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  timestamp: Date;
}

interface AppData {
  id: string;
  name: string;
  slug: string;
  prompt: string;
  status: GenerationStatus;
  published: boolean;
  errorMessage?: string;
}

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;
  const { isAuthenticated, token } = useAuthStore();
  const { addToast } = useToast();

  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [iterationInput, setIterationInput] = useState('');
  const [iterating, setIterating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.push('/login?redirect=/studio/' + appId);
    }
  }, [isAuthenticated, token, router, appId]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/apps/${appId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 404) setError('App not found');
        return;
      }
      const data = await res.json();
      const appData = data.data || data;
      setApp((prev) => {
        if (prev?.status !== appData.status) {
          if (appData.status === 'succeeded') {
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'system',
                content: 'Your app is ready! Preview it on the right, or publish it to your storefront.',
                timestamp: new Date(),
              },
            ]);
            setIframeKey((k) => k + 1);
          } else if (appData.status === 'failed') {
            setMessages((msgs) => [
              ...msgs,
              {
                role: 'system',
                content: `Generation failed: ${appData.errorMessage || 'Unknown error'}. Try iterating with a different prompt.`,
                timestamp: new Date(),
              },
            ]);
          }
        }
        return appData;
      });
    } catch {
      // Non-critical polling error
    }
  }, [token, appId]);

  // Initial load
  useEffect(() => {
    async function loadApp() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/apps/${appId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError(res.status === 404 ? 'App not found' : 'Failed to load app');
          return;
        }
        const data = await res.json();
        const appData = data.data || data;
        setApp(appData);
        setMessages([
          {
            role: 'user',
            content: appData.prompt || 'Original prompt not available',
            timestamp: new Date(),
          },
          {
            role: 'system',
            content:
              appData.status === 'succeeded'
                ? 'Your app is ready! Preview it on the right.'
                : appData.status === 'failed'
                  ? `Generation failed: ${appData.errorMessage || 'Unknown error'}`
                  : 'Generating your app...',
            timestamp: new Date(),
          },
        ]);
      } catch {
        setError('Failed to load app');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [token, appId]);

  // Poll while in progress
  useEffect(() => {
    if (
      !app ||
      app.status === 'succeeded' ||
      app.status === 'failed'
    ) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [app?.status, fetchStatus]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleIterate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iterationInput.trim() || !token || !app) return;

    const userMessage = iterationInput.trim();
    setIterationInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);
    setIterating(true);

    try {
      const res = await fetch(`${API_URL}/apps/${app.id}/iterate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: userMessage }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: { message: 'Iteration failed' } }));
        throw new Error(errData.error?.message || 'Iteration failed');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'Regenerating your app with the new changes...', timestamp: new Date() },
      ]);

      // Re-fetch status to start polling again
      setApp((prev) => prev ? { ...prev, status: 'queued' } : prev);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Error: ${err instanceof Error ? err.message : 'Iteration failed'}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIterating(false);
    }
  };

  const handlePublish = async () => {
    if (!token || !app) return;
    setPublishing(true);
    try {
      const res = await fetch(`${API_URL}/apps/${app.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: { message: 'Publish failed' } }));
        throw new Error(errData.error?.message || 'Failed to publish');
      }
      setApp((prev) => prev ? { ...prev, published: true } : prev);
      addToast('App published to your storefront!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to publish', 'error');
    } finally {
      setPublishing(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
          {error}
        </div>
        <Link
          href="/dashboard"
          className="mt-4 text-sm text-accent hover:text-accent/80"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!app) return null;

  const isInProgress =
    app.status !== 'succeeded' && app.status !== 'failed';
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === app.status);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-primary"
          >
            Sotally
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {app.name || 'Untitled App'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {app.status === 'succeeded' && !app.published && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              Publish
            </button>
          )}
          {app.published && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Published
            </span>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Chat */}
        <div className="flex w-full flex-col border-r border-border lg:w-[40%]">
          {/* Status indicator */}
          {isInProgress && (
            <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                {STATUS_STEPS.map((step, idx) => {
                  const isActive = step.key === app.status;
                  const isDone = idx < currentStepIndex;
                  const isFailed = app.status === 'failed' && idx === currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full',
                          isFailed
                            ? 'bg-destructive'
                            : isDone
                              ? 'bg-emerald-500'
                              : isActive
                                ? 'bg-accent animate-pulse'
                                : 'bg-muted-foreground/30'
                        )}
                      />
                      <span
                        className={cn(
                          'hidden text-xs sm:inline',
                          isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'max-w-[90%] rounded-xl px-4 py-3 text-sm',
                  msg.role === 'user'
                    ? 'ml-auto bg-accent text-accent-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {msg.content}
              </div>
            ))}
            {iterating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Iteration input */}
          <form
            onSubmit={handleIterate}
            className="shrink-0 border-t border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={iterationInput}
                onChange={(e) => setIterationInput(e.target.value)}
                placeholder={
                  isInProgress
                    ? 'Wait for generation to complete...'
                    : 'Make changes...'
                }
                disabled={isInProgress || iterating}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isInProgress || iterating || !iterationInput.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right panel — Preview */}
        <div className="hidden flex-1 flex-col lg:flex">
          {/* Preview toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIframeKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
              <a
                href={`${API_URL}/apps/${app.id}/bundle`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in new tab
              </a>
            </div>
          </div>

          {/* Iframe */}
          <div className="flex-1 bg-white">
            {app.status === 'succeeded' ? (
              <iframe
                key={iframeKey}
                src={`${API_URL}/apps/${app.id}/bundle`}
                sandbox="allow-scripts allow-forms allow-popups"
                className="h-full w-full border-0"
                title="App Preview"
              />
            ) : app.status === 'failed' ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <XCircle className="mx-auto h-12 w-12 text-destructive/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Generation failed. Try iterating with a different prompt.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-accent/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Generating your app...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
