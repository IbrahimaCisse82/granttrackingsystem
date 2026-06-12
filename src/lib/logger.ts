// Lightweight client-side observability — flushes errors to public.client_errors.
// - Buffered (max 20) with 5s debounce to avoid request storms
// - De-duplicates identical messages within a 60s window
// - Truncates payloads to safe sizes
// - Best-effort: never throws, never blocks the UI
import { supabase } from '@/integrations/supabase/client';

export type Severity = 'info' | 'warning' | 'error' | 'fatal';

interface LogEntry {
  severity: Severity;
  message: string;
  stack?: string;
  url?: string;
  user_agent?: string;
  context?: Record<string, unknown>;
  app_version?: string;
}

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) || 'dev';
const MAX_MESSAGE = 2000;
const MAX_STACK = 6000;
const FLUSH_DELAY = 5000;
const MAX_BUFFER = 20;
const DEDUPE_WINDOW = 60_000;

const buffer: LogEntry[] = [];
const recent = new Map<string, number>(); // message → timestamp
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function trunc(s: string | undefined, n: number): string | undefined {
  if (!s) return s;
  return s.length > n ? s.slice(0, n) + '…[truncated]' : s;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(flush, FLUSH_DELAY);
}

async function flush() {
  flushTimer = null;
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const rows = batch.map((e) => ({
      user_id: user?.id ?? null,
      severity: e.severity,
      message: e.message,
      stack: e.stack ?? null,
      url: e.url ?? null,
      user_agent: e.user_agent ?? null,
      context: e.context ?? {},
      app_version: e.app_version ?? APP_VERSION,
    }));
    await supabase.from('client_errors').insert(rows as any);
  } catch {
    // Swallow — observability must never break the app.
  }
}

export function log(entry: LogEntry) {
  try {
    const key = `${entry.severity}:${entry.message}`;
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUPE_WINDOW) return;
    recent.set(key, now);
    // Trim dedupe map occasionally
    if (recent.size > 200) {
      for (const [k, t] of recent) if (now - t > DEDUPE_WINDOW) recent.delete(k);
    }

    buffer.push({
      ...entry,
      message: trunc(entry.message, MAX_MESSAGE) || '(empty)',
      stack: trunc(entry.stack, MAX_STACK),
      url: entry.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
      user_agent: entry.user_agent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
    });

    if (buffer.length >= MAX_BUFFER) {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      void flush();
    } else {
      scheduleFlush();
    }
  } catch {
    // never throw
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) =>
    log({ severity: 'info', message, context }),
  warn: (message: string, context?: Record<string, unknown>) =>
    log({ severity: 'warning', message, context }),
  error: (err: unknown, context?: Record<string, unknown>) => {
    const e = err instanceof Error ? err : new Error(String(err));
    log({ severity: 'error', message: e.message, stack: e.stack, context });
  },
  fatal: (err: unknown, context?: Record<string, unknown>) => {
    const e = err instanceof Error ? err : new Error(String(err));
    log({ severity: 'fatal', message: e.message, stack: e.stack, context });
  },
};

/** Attach global handlers — call once at app boot. */
export function initGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;
  if ((window as any).__loggerInitialized) return;
  (window as any).__loggerInitialized = true;

  window.addEventListener('error', (event) => {
    log({
      severity: 'error',
      message: event.message || 'Uncaught error',
      stack: event.error?.stack,
      context: {
        kind: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason));
    log({
      severity: 'error',
      message: err.message || 'Unhandled promise rejection',
      stack: err.stack,
      context: { kind: 'unhandledrejection' },
    });
  });

  // Flush on page hide (best effort)
  window.addEventListener('pagehide', () => { void flush(); });
}
