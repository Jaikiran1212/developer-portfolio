import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../api/_lib/rate-limiter.js';

test('checkRateLimit enforces limits and blocks excess requests', () => {
  const testKey = 'test-ip-rate-limit';
  const limit = 3;
  const windowMs = 5000;

  // First 3 requests must be allowed
  const r1 = checkRateLimit(testKey, limit, windowMs);
  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);

  const r2 = checkRateLimit(testKey, limit, windowMs);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);

  const r3 = checkRateLimit(testKey, limit, windowMs);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);

  // 4th request must be blocked
  const r4 = checkRateLimit(testKey, limit, windowMs);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);
  assert.equal(r4.retryAfterSec > 0, true);
});
