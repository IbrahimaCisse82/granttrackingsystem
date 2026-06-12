// Shared rate-limiter helper for edge functions.
// Uses the Postgres function `public.check_rate_limit` (atomic, race-safe).
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  max: number;
  reset_at: string;
}

let _admin: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
  return _admin;
}

/**
 * Atomically increments a counter for `identifier+action` in a rolling window
 * and returns whether the request is allowed.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  max: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const { data, error } = await getAdmin().rpc("check_rate_limit", {
    _identifier: identifier,
    _action: action,
    _max: max,
    _window_seconds: windowSeconds,
  });
  if (error) {
    // Fail-open on infra errors but log; tighten to fail-closed if preferred.
    console.error("[rate-limit] RPC error:", error.message);
    return { allowed: true, count: 0, max, reset_at: new Date().toISOString() };
  }
  return data as RateLimitResult;
}

/** Derive a stable identifier from the request (user id preferred, IP fallback). */
export function getIdentifier(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  return `ip:${ip}`;
}

/** Build a 429 Response with standard rate-limit headers. */
export function rateLimitResponse(
  result: RateLimitResult,
  corsHeaders: Record<string, string>,
): Response {
  const retryAfter = Math.max(
    1,
    Math.ceil((new Date(result.reset_at).getTime() - Date.now()) / 1000),
  );
  return new Response(
    JSON.stringify({
      error: "Trop de requêtes. Réessayez plus tard.",
      code: "RATE_LIMITED",
      reset_at: result.reset_at,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.max),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.reset_at,
      },
    },
  );
}
