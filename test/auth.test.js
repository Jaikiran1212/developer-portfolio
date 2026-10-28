import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAdmin, extractBearerToken, parseCookies } from '../api/_lib/auth.js';

const ENV_KEYS = ['ALLOW_DEV_AUTH', 'ADMIN_EMAILS', 'VERCEL_ENV', 'NODE_ENV'];
const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const reset = () => ENV_KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));

test('extractBearerToken extracts token correctly', () => {
  assert.equal(extractBearerToken({ headers: { authorization: 'Bearer token123' } }), 'token123');
  assert.equal(extractBearerToken({ headers: { Authorization: 'bearer token456' } }), 'token456');
  assert.equal(extractBearerToken({ headers: { authorization: 'Basic dXNlcjpwYXNz' } }), null);
  assert.equal(extractBearerToken({ headers: {} }), null);
  assert.equal(extractBearerToken({}), null);
});

test('parseCookies reads the session cookie', () => {
  assert.equal(parseCookies({ headers: { cookie: 'a=1; jk_session=abc%20def; b=2' } }).jk_session, 'abc def');
  assert.deepEqual(parseCookies({ headers: {} }), {});
});

test('verifyAdmin rejects unauthenticated requests', async () => {
  const res = await verifyAdmin({ headers: {}, method: 'GET' });
  assert.equal(res.ok, false);
  assert.equal(res.status, 401);
});

test('SECURITY: forged dev token is REJECTED when dev auth is not explicitly enabled', async () => {
  reset();
  process.env.ADMIN_EMAILS = 'owner@example.com';
  const res = await verifyAdmin({ method: 'GET', headers: { authorization: 'Bearer dev_admin_token_owner@example.com' } });
  assert.equal(res.ok, false);
  assert.equal(res.status, 503); // fail closed: auth is "not configured", never "open"
  reset();
});

test('SECURITY: dev token is rejected on Vercel production/preview even if ALLOW_DEV_AUTH=1', async () => {
  for (const env of ['production', 'preview']) {
    reset();
    process.env.ALLOW_DEV_AUTH = '1';
    process.env.ADMIN_EMAILS = 'owner@example.com';
    process.env.VERCEL_ENV = env;
    const res = await verifyAdmin({ method: 'GET', headers: { authorization: 'Bearer dev_admin_token_owner@example.com' } });
    assert.equal(res.ok, false, `dev token must not work on ${env}`);
  }
  reset();
});

test('dev token works only in explicit local dev mode and only for listed admin emails', async () => {
  reset();
  process.env.ALLOW_DEV_AUTH = '1';
  process.env.ADMIN_EMAILS = 'owner@example.com';
  const ok = await verifyAdmin({ method: 'GET', headers: { authorization: 'Bearer dev_admin_token_owner@example.com' } });
  assert.equal(ok.ok, true);
  const bad = await verifyAdmin({ method: 'GET', headers: { authorization: 'Bearer dev_admin_token_hacker@evil.com' } });
  assert.equal(bad.ok, false);
  reset();
});

test('cookie sessions need the CSRF header on unsafe methods', async () => {
  reset();
  process.env.ALLOW_DEV_AUTH = '1';
  process.env.ADMIN_EMAILS = 'owner@example.com';
  const cookie = 'jk_session=dev_admin_token_owner%40example.com';
  const get = await verifyAdmin({ method: 'GET', headers: { cookie } });
  assert.equal(get.ok, true);
  const post = await verifyAdmin({ method: 'POST', headers: { cookie } });
  assert.equal(post.ok, false);
  assert.equal(post.status, 403);
  const postOk = await verifyAdmin({ method: 'POST', headers: { cookie, 'x-requested-with': 'jk-admin' } });
  assert.equal(postOk.ok, true);
  reset();
});
