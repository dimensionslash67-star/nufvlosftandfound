import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitFailMode = 'closed' | 'fallback';

type RateLimitFailure = 'limit' | 'redis-unavailable';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  failure?: RateLimitFailure;
};

export type RateLimitOptions = {
  failMode: RateLimitFailMode;
  fallbackLimit?: number;
  fallbackWindowMs?: number;
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const limiters = new Map<string, Ratelimit>();
const memoryBuckets = new Map<string, MemoryBucket>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) {
    return null;
  }

  const cacheKey = `${limit}:${windowMs}`;
  const existing = limiters.get(cacheKey);

  if (existing) {
    return existing;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: 'nufv:rate-limit',
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

function checkInMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryBuckets.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetMs: windowMs };
  }

  const resetMs = Math.max(0, existing.resetAt - now);

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetMs, failure: 'limit' };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetMs,
  };
}

function handleRedisUnavailable(
  key: string,
  limit: number,
  windowMs: number,
  options: RateLimitOptions,
): RateLimitResult {
  if (options.failMode === 'closed') {
    console.error('[rate-limit] Redis unavailable; rejecting request.');
    return { allowed: false, remaining: 0, resetMs: windowMs, failure: 'redis-unavailable' };
  }

  // In-memory limits are per-instance and only a stopgap when shared Redis is unavailable.
  console.error('[rate-limit] Redis unavailable; using per-instance in-memory fallback.');
  return checkInMemoryRateLimit(
    key,
    options.fallbackLimit ?? limit,
    options.fallbackWindowMs ?? windowMs,
  );
}

/**
 * Check and record a rate-limit hit for the given key.
 *
 * @param key      Unique identifier for the rate-limit bucket (e.g. "login:ip:<ip>")
 * @param limit    Maximum number of allowed requests in the window
 * @param windowMs Window duration in milliseconds
 * @param options  Behavior when shared Redis is unavailable
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  let limiter: Ratelimit | null = null;

  try {
    limiter = getLimiter(limit, windowMs);
  } catch {
    return handleRedisUnavailable(key, limit, windowMs, options);
  }

  if (!limiter) {
    return handleRedisUnavailable(key, limit, windowMs, options);
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
      ...(result.success ? {} : { failure: 'limit' as const }),
    };
  } catch {
    return handleRedisUnavailable(key, limit, windowMs, options);
  }
}

export function getRateLimitFailure(
  result: RateLimitResult,
  tooManyMessage: string,
): { message: string; status: 429 | 503; retryAfter: number } | null {
  if (result.allowed) {
    return null;
  }

  return {
    message:
      result.failure === 'redis-unavailable' ? 'Please try again later.' : tooManyMessage,
    status: result.failure === 'redis-unavailable' ? 503 : 429,
    retryAfter: Math.max(1, Math.ceil(result.resetMs / 1000)),
  };
}

export function normalizeRateLimitKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Extract the best available client IP from a request.
 * Trusted proxy headers take precedence over x-forwarded-for because that header can contain
 * caller-controlled values before the request reaches the trusted proxy.
 */
export function getClientIp(request: Request): string {
  const headers = [
    'x-real-ip',
    'x-vercel-forwarded-for',
    'cf-connecting-ip',
    'true-client-ip',
    'x-forwarded-for',
  ] as const;

  for (const header of headers) {
    const value = request.headers.get(header)?.trim();

    if (value) {
      return value.split(',')[0]!.trim() || 'unknown';
    }
  }

  return 'unknown';
}
