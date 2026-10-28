// ==============================================================================
// RATE LIMITER & ABUSE PROTECTION
// - checkRateLimitShared(): uses Upstash Redis (REST) when configured, so limits are
//   shared across ALL serverless instances. Falls back to per-instance memory.
// - checkRateLimit(): synchronous per-instance sliding window (used as fallback/tests).
// ==============================================================================

const hits = new Map();

export function checkRateLimit(key, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = hits.get(key) || { timestamps: [] };
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const resetTime = validTimestamps[0] + windowMs;
    return { allowed: false, remaining: 0, resetTime, retryAfterSec: Math.ceil((resetTime - now) / 1000) };
  }

  validTimestamps.push(now);
  hits.set(key, { timestamps: validTimestamps });

  if (hits.size > 5000) {
    for (const [k, v] of hits.entries()) {
      if (v.timestamps.length === 0 || now - v.timestamps[v.timestamps.length - 1] > windowMs) hits.delete(k);
    }
  }
  return { allowed: true, remaining: limit - validTimestamps.length, resetTime: now + windowMs, retryAfterSec: 0 };
}

/**
 * Shared limiter. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * (free tier is plenty) to make limits work across serverless instances.
 */
export async function checkRateLimitShared(key, limit = 5, windowMs = 15 * 60 * 1000) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return checkRateLimit(key, limit, windowMs);

  try {
    const redisKey = `rl:${key}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['PEXPIRE', redisKey, String(windowMs), 'NX'],
        ['PTTL', redisKey],
      ]),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`);
    const out = await res.json();
    const count = Number(out?.[0]?.result);
    const pttl = Math.max(0, Number(out?.[2]?.result) || windowMs);
    if (!Number.isFinite(count)) throw new Error('Bad Upstash response');
    if (count > limit) {
      return { allowed: false, remaining: 0, resetTime: Date.now() + pttl, retryAfterSec: Math.ceil(pttl / 1000) };
    }
    return { allowed: true, remaining: limit - count, resetTime: Date.now() + pttl, retryAfterSec: 0 };
  } catch (err) {
    console.warn('Shared rate limiter unavailable, using per-instance fallback:', err.message);
    return checkRateLimit(key, limit, windowMs);
  }
}

/** Client IP (Vercel sets x-vercel-forwarded-for / overwrites x-forwarded-for). */
export function getClientIp(req) {
  if (!req || !req.headers) return '127.0.0.1';
  const vercel = req.headers['x-vercel-forwarded-for'];
  if (vercel) return String(vercel).split(',')[0].trim();
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}
