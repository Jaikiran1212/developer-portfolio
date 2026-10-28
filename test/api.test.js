import test from 'node:test';
import assert from 'node:assert/strict';
import portfolioHandler from '../api/portfolio.js';
import contactHandler from '../api/contact.js';
import authHandler from '../api/auth/[action].js';
import cmsHandler from '../api/cms/[resource].js';
import { memoryStore } from '../api/_lib/supabase.js';

const ENV_KEYS = ['ALLOW_DEV_AUTH', 'ADMIN_EMAILS', 'DEV_ADMIN_PASSWORD', 'VERCEL_ENV', 'NODE_ENV'];
const saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
const resetEnv = () => ENV_KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
const devMode = () => {
  resetEnv();
  process.env.ALLOW_DEV_AUTH = '1';
  process.env.ADMIN_EMAILS = 'owner@example.com';
  process.env.DEV_ADMIN_PASSWORD = 'dev-only-Password-123';
};

let ipCounter = 0;
function mock({ method = 'GET', headers = {}, body = {}, query = {} } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    json(p) { this.data = p; return this; },
  };
  // unique IP per call so the in-memory rate limiter never interferes between tests
  const req = { method, headers: { 'x-forwarded-for': `10.1.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`, ...headers }, body, query };
  return { req, res };
}
const auth = (action, opts) => { const m = mock(opts); m.req.query = { action }; return authHandler(m.req, m.res).then(() => m.res); };
const cms = (resource, opts) => { const m = mock(opts); m.req.query = { resource }; return cmsHandler(m.req, m.res).then(() => m.res); };
const DEV_BEARER = { authorization: 'Bearer dev_admin_token_owner@example.com' };

test('GET /api/portfolio returns aggregated public data', async () => {
  resetEnv();
  const { req, res } = mock();
  await portfolioHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.data.profile, 'object');
  for (const k of ['projects', 'skills', 'experience', 'socials']) assert.equal(Array.isArray(res.data[k]), true);
  assert.equal(res.data.projects.every((p) => p.published), true);
});

test('contact: honeypot submissions get a silent success and are not stored', async () => {
  resetEnv();
  const before = memoryStore.messages.length;
  const { req, res } = mock({ method: 'POST', body: { name: 'Bot', email: 'bot@spam.com', subject: 'Spam', message: 'Spam message body', website_trap: 'http://spam.com' } });
  await contactHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(memoryStore.messages.length, before);
});

test('contact: message is stored RAW (no double HTML escaping)', async () => {
  resetEnv();
  const text = `Hi Jai — Q&A about "Knuth's" <DLX> project?`;
  const { req, res } = mock({ method: 'POST', body: { name: "Sarah O'Connor", email: 'sarah@resistance.org', subject: 'Q&A', message: text } });
  await contactHandler(req, res);
  assert.equal(res.statusCode, 201);
  const saved = memoryStore.messages[0];
  assert.equal(saved.message, text);
  assert.equal(saved.name, "Sarah O'Connor");
  assert.equal(saved.subject, 'Q&A');
});

test('contact: on production without a database it FAILS LOUDLY instead of pretending to save', async () => {
  resetEnv();
  process.env.VERCEL_ENV = 'production';
  const before = memoryStore.messages.length;
  const { req, res } = mock({ method: 'POST', body: { name: 'Real Person', email: 'real@person.com', subject: 'Hello', message: 'Please contact me about an internship.' } });
  await contactHandler(req, res);
  assert.equal(res.statusCode, 503);
  assert.equal(memoryStore.messages.length, before);
  resetEnv();
});

test('SECURITY: login fails CLOSED (503) when auth is not configured - any password, any environment', async () => {
  resetEnv();
  process.env.ADMIN_EMAILS = 'owner@example.com';
  const res = await auth('login', { method: 'POST', body: { email: 'owner@example.com', password: 'anything-at-all' } });
  assert.equal(res.statusCode, 503);
  assert.equal(res.data.accessToken, undefined);
  resetEnv();
});

test('SECURITY: forgot-password never returns a code, and fails closed when unconfigured', async () => {
  resetEnv();
  process.env.ADMIN_EMAILS = 'owner@example.com';
  const closed = await auth('forgot-password', { method: 'POST', body: { email: 'owner@example.com' } });
  assert.equal(closed.statusCode, 503);
  assert.equal(JSON.stringify(closed.data).includes('devOtp'), false);

  devMode();
  const dev = await auth('forgot-password', { method: 'POST', body: { email: 'owner@example.com' } });
  assert.equal(dev.statusCode, 200);
  assert.equal(dev.data.devOtp, undefined);
  assert.equal(/\d{6}/.test(JSON.stringify(dev.data)), false);
  resetEnv();
});

test('dev login: wrong password -> 401; correct password -> HttpOnly cookie and NO token in the body', async () => {
  devMode();
  const bad = await auth('login', { method: 'POST', body: { email: 'owner@example.com', password: 'wrong-password' } });
  assert.equal(bad.statusCode, 401);
  assert.equal(bad.data.error, 'Invalid email or password.');

  const good = await auth('login', { method: 'POST', body: { email: 'owner@example.com', password: 'dev-only-Password-123' } });
  assert.equal(good.statusCode, 200);
  assert.equal(good.data.accessToken, undefined);
  const cookies = [].concat(good.headers['Set-Cookie'] || []).join(' | ');
  assert.match(cookies, /jk_session=/);
  assert.match(cookies, /HttpOnly/);
  assert.match(cookies, /SameSite=Strict/);
  resetEnv();
});

test('CMS rejects unauthenticated requests; accepts an authorised dev admin', async () => {
  devMode();
  assert.equal((await cms('projects', {})).statusCode, 401);
  const ok = await cms('projects', { headers: DEV_BEARER });
  assert.equal(ok.statusCode, 200);
  assert.equal(Array.isArray(ok.data.projects), true);
  assert.equal((await cms('messages', {})).statusCode, 401);
  assert.equal(Array.isArray((await cms('messages', { headers: DEV_BEARER })).data.messages), true);
  resetEnv();
});

test('CMS stores text raw and rejects unsafe URLs / SVG / oversized photo settings', async () => {
  devMode();
  const project = { title: "Knuth's DLX & Co", short_desc: 'Solves "exact cover" problems & more', category: 'DSA' };

  const created = await cms('projects', { method: 'POST', headers: DEV_BEARER, body: project });
  assert.equal(created.statusCode, 201);
  assert.equal(created.data.project.title, "Knuth's DLX & Co");
  assert.equal(created.data.project.short_desc, 'Solves "exact cover" problems & more');

  const jsUrl = await cms('projects', { method: 'POST', headers: DEV_BEARER, body: { ...project, repo_url: 'javascript:alert(1)' } });
  assert.equal(jsUrl.statusCode, 400);

  const badSvg = await cms('skills', { method: 'POST', headers: DEV_BEARER, body: { name: 'Evil', tier: 'now', icon_value: '<svg onload="alert(1)"><script>alert(2)</script></svg>' } });
  assert.equal(badSvg.statusCode, 400);

  const okSvg = await cms('skills', { method: 'POST', headers: DEV_BEARER, body: { name: 'Shape', tier: 'now', icon_value: '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>' } });
  assert.equal(okSvg.statusCode, 201);

  const hugePhoto = await cms('profile', { method: 'PUT', headers: DEV_BEARER, body: { photo_config: { src: 'data:image/png;base64,' + 'A'.repeat(300000) } } });
  assert.equal(hugePhoto.statusCode, 400);

  const jsResume = await cms('profile', { method: 'PUT', headers: DEV_BEARER, body: { resume_url: 'javascript:alert(1)' } });
  assert.equal(jsResume.statusCode, 400);
  resetEnv();
});
