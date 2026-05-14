// Per-IP token bucket. Module-level Map — resets on cold Edge starts and
// is per-instance (so N warm instances effectively multiply the budget).
// Acceptable trade-off vs. KV-backed limiter at current traffic.
//
// OWASP API4:2023 Unrestricted Resource Consumption / CWE-770.

const RATE_LIMIT = 30;            // requests per window
const RATE_WINDOW_MS = 60_000;    // 1 minute
const MAX_BUCKETS = 2000;          // prevent unbounded growth on cold instance

type Bucket = { tokens: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function gc(now: number) {
  if (buckets.size <= MAX_BUCKETS) return;
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
    if (buckets.size <= MAX_BUCKETS / 2) break;
  }
}

function clientKey(req: Request): string {
  // Vercel sets x-forwarded-for; left-most is the original client.
  // Fall back to x-real-ip, then a constant so abusive serverless callers
  // still get bucketed (rather than each appearing as a unique unknown).
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number };

export function checkRateLimit(req: Request, scope = "api"): RateLimitResult {
  const id = `${scope}:${clientKey(req)}`;
  const now = Date.now();
  gc(now);

  const hit = buckets.get(id);
  if (!hit || hit.resetAt < now) {
    const resetAt = now + RATE_WINDOW_MS;
    buckets.set(id, { tokens: RATE_LIMIT - 1, resetAt });
    return { ok: true, remaining: RATE_LIMIT - 1, resetAt };
  }
  if (hit.tokens <= 0) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((hit.resetAt - now) / 1000)) };
  }
  hit.tokens--;
  return { ok: true, remaining: hit.tokens, resetAt: hit.resetAt };
}

export function rateLimitResponse(retryAfterSec: number) {
  return new Response(
    JSON.stringify({ ok: false, error: "rate_limited" }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfterSec),
      },
    },
  );
}
