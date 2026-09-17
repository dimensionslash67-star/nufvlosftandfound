import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.KV_REST_API_URL;
const redisToken = process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const limiters = new Map<string, Ratelimit>();

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

/**
 * Check and record a rate-limit hit for the given key.
 *
 * @param key      Unique identifier for the rate-limit bucket (e.g. "login:<ip>")
 * @param limit    Maximum number of allowed requests in the window
 * @param windowMs Window duration in milliseconds
 * @returns { allowed: boolean; remaining: number; resetMs: number }
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const limiter = getLimiter(limit, windowMs);

  if (!limiter) {
    console.warn('Rate limiting disabled: Upstash Redis environment variables are missing.');
    return { allowed: true, remaining: limit, resetMs: 0 };
  }

  try {
    const result = await limiter.limit(key);
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetMs: result.success ? 0 : Math.max(0, result.reset - Date.now()),
    };
  } catch (error) {
    console.warn('Rate-limit check failed; allowing request to proceed.', error);
    return { allowed: true, remaining: limit, resetMs: 0 };
  }
}

/**
 * Extract the best available client IP from a request.
 * Falls back to 'unknown' when behind a non-standard proxy.
 */
export function getClientIp(request: Request): string {
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
  ] as const;

  for (const header of headers) {
    const value = (request.headers as Headers).get(header);
    if (value) {
      return value.split(',')[0]!.trim();
    }
  }

  return 'unknown';
}
