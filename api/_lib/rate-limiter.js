// ==============================================================================
// IN-MEMORY SLIDING WINDOW RATE LIMITER & ABUSE PROTECTION
// Prevents brute-force authentication and spam form submissions
// ==============================================================================

const hits = new Map();

/**
 * Checks if a given key (e.g. IP address + route) has exceeded limit within window
 * @param {string} key - Unique identifier (e.g. ip + ':' + action)
 * @param {number} limit - Maximum allowed requests in window
 * @param {number} windowMs - Time window in milliseconds (default 15 minutes)
 * @returns {{ allowed: boolean, remaining: number, resetTime: number }}
 */
export function checkRateLimit(key, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const record = hits.get(key) || { timestamps: [] };

  // Evict timestamps outside current window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetTime = oldest + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      retryAfterSec: Math.ceil((resetTime - now) / 1000),
    };
  }

  validTimestamps.push(now);
  hits.set(key, { timestamps: validTimestamps });

  // Periodically clean stale records
  if (hits.size > 5000) {
    for (const [k, v] of hits.entries()) {
      if (v.timestamps.length === 0 || now - v.timestamps[v.timestamps.length - 1] > windowMs) {
        hits.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    resetTime: now + windowMs,
    retryAfterSec: 0,
  };
}

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(req) {
  if (!req || !req.headers) return '127.0.0.1';
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1';
}
