// Centralized client monitoring.
// Sentry is optional: it only boots when VITE_SENTRY_DSN is provided.
// The in-house logger (public.client_errors) stays the source of truth and
// mirrors every captured event, so monitoring never depends on a 3rd party.
import * as Sentry from '@sentry/react';

let enabled = false;

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || enabled) return;
  try {
    Sentry.init({
      dsn,
      environment: (import.meta.env.MODE as string) || 'production',
      release: (import.meta.env.VITE_APP_VERSION as string) || 'dev',
      tracesSampleRate: 0.1,
      replaysOnErrorSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      sendDefaultPii: false,
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications.',
        'Non-Error promise rejection captured',
      ],
    });
    enabled = true;
  } catch {
    // Monitoring must never break the app.
  }
}

export function isSentryEnabled() {
  return enabled;
}

export function setSentryUser(user: { id: string; email?: string | null } | null) {
  if (!enabled) return;
  try {
    Sentry.setUser(user ? { id: user.id, email: user.email ?? undefined } : null);
  } catch {
    /* noop */
  }
}

export function setSentryContext(key: string, value: Record<string, unknown> | null) {
  if (!enabled) return;
  try {
    Sentry.setContext(key, value);
  } catch {
    /* noop */
  }
}

export function captureToSentry(
  err: unknown,
  level: 'info' | 'warning' | 'error' | 'fatal',
  context?: Record<string, unknown>,
) {
  if (!enabled) return;
  try {
    if (level === 'info' || level === 'warning') {
      Sentry.captureMessage(err instanceof Error ? err.message : String(err), {
        level,
        extra: context,
      });
      return;
    }
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      level,
      extra: context,
    });
  } catch {
    /* noop */
  }
}
