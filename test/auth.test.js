import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdmin, extractBearerToken } from '../api/_lib/auth.js';

test('extractBearerToken extracts token correctly', () => {
  assert.equal(extractBearerToken({ headers: { authorization: 'Bearer token123' } }), 'token123');
  assert.equal(extractBearerToken({ headers: { Authorization: 'bearer token456' } }), 'token456');
  assert.equal(extractBearerToken({ headers: { authorization: 'Basic dXNlcjpwYXNz' } }), null);
  assert.equal(extractBearerToken({ headers: {} }), null);
  assert.equal(extractBearerToken({}), null);
});

test('verifyAdmin rejects unauthenticated requests', async () => {
  const req = { headers: {} };
  const res = await verifyAdmin(req);
  assert.equal(res.ok, false);
  assert.equal(res.status, 401);
  assert.equal(res.error.includes('Authentication required'), true);
});

test('verifyAdmin rejects unauthorized tokens', async () => {
  const req = { headers: { authorization: 'Bearer invalid_random_token' } };
  const res = await verifyAdmin(req);
  assert.equal(res.ok, false);
  assert.equal(res.status, 401);
});

test('verifyAdmin accepts valid admin token', async () => {
  const req = { headers: { authorization: 'Bearer dev_admin_token_jaikiranjp@gmail.com' } };
  const res = await verifyAdmin(req);
  assert.equal(res.ok, true);
  assert.equal(res.user.email, 'jaikiranjp@gmail.com');
  assert.equal(res.user.role, 'admin');
});
