import test from 'node:test';
import assert from 'node:assert/strict';
import portfolioHandler from '../api/portfolio.js';
import contactHandler from '../api/contact.js';
import authHandler from '../api/auth/[action].js';
import cmsHandler from '../api/cms/[resource].js';

const loginHandler = (req, res) => {
  req.query = { action: 'login', ...req.query };
  return authHandler(req, res);
};
const forgotPasswordHandler = (req, res) => {
  req.query = { action: 'forgot-password', ...req.query };
  return authHandler(req, res);
};
const verifyOtpHandler = (req, res) => {
  req.query = { action: 'verify-otp', ...req.query };
  return authHandler(req, res);
};
const cmsProjectsHandler = (req, res) => {
  req.query = { resource: 'projects', ...req.query };
  return cmsHandler(req, res);
};
const cmsMessagesHandler = (req, res) => {
  req.query = { resource: 'messages', ...req.query };
  return cmsHandler(req, res);
};

// Helper to create mock req / res
function createMockReqRes({ method = 'GET', headers = {}, body = {}, query = {} } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  const req = { method, headers, body, query };
  return { req, res };
}

test('GET /api/portfolio returns aggregated public data', async () => {
  const { req, res } = createMockReqRes({ method: 'GET' });
  await portfolioHandler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.data.profile, 'object');
  assert.equal(Array.isArray(res.data.projects), true);
  assert.equal(Array.isArray(res.data.skills), true);
  assert.equal(Array.isArray(res.data.experience), true);
  assert.equal(Array.isArray(res.data.socials), true);
  // Verify projects are published
  assert.equal(res.data.projects.length >= 2, true);
  assert.equal(res.data.projects[0].published, true);
});

test('POST /api/contact blocks spam trap submission', async () => {
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: {
      name: 'Spam Bot',
      email: 'spam@bot.com',
      subject: 'Spam Subject',
      message: 'Spam Message text here',
      website_trap: 'http://spam.com',
    },
  });
  await contactHandler(req, res);
  // Returns generic 200 without saving spam
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.success, true);
});

test('POST /api/contact validates and stores message', async () => {
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: {
      name: 'Sarah Connor',
      email: 'sarah@resistance.org',
      subject: 'Interview with Cyber Systems',
      message: 'Hello Jai Kiran, we would like to schedule an interview with you regarding your portfolio.',
    },
  });
  await contactHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.success, true);
});

test('POST /api/auth/login rejects invalid credentials with generic message', async () => {
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: {
      email: 'hacker@target.com',
      password: 'wrong_password',
    },
  });
  await loginHandler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.data.error, 'Invalid email or password.');
});

test('POST /api/auth/login allows pre-configured admin in dev mode', async () => {
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: {
      email: 'jaikiranjp@gmail.com',
      password: 'SamplePassword123!',
    },
  });
  await loginHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.success, true);
  assert.equal(typeof res.data.accessToken, 'string');
});

test('CMS endpoints reject unauthorized requests without Bearer token', async () => {
  const { req, res } = createMockReqRes({ method: 'GET' });
  await cmsProjectsHandler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.data.error.includes('Authentication required'), true);
});

test('CMS endpoints allow authorized admin with valid token', async () => {
  const { req, res } = createMockReqRes({
    method: 'GET',
    headers: {
      authorization: 'Bearer dev_admin_token_jaikiranjp@gmail.com',
    },
  });
  await cmsProjectsHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.data.projects), true);
});

test('Admin can fetch private messages but public cannot', async () => {
  // Public request -> rejected
  const publicCall = createMockReqRes({ method: 'GET' });
  await cmsMessagesHandler(publicCall.req, publicCall.res);
  assert.equal(publicCall.res.statusCode, 401);

  // Admin request -> accepted
  const adminCall = createMockReqRes({
    method: 'GET',
    headers: {
      authorization: 'Bearer dev_admin_token_jaikiranjp@gmail.com',
    },
  });
  await cmsMessagesHandler(adminCall.req, adminCall.res);
  assert.equal(adminCall.res.statusCode, 200);
  assert.equal(Array.isArray(adminCall.res.data.messages), true);
});

test('POST /api/auth/forgot-password generates OTP and sends recovery code', async () => {
  const { req, res } = createMockReqRes({
    method: 'POST',
    body: { email: 'jaikiranjp@gmail.com' },
  });
  await forgotPasswordHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.data.success, true);
  assert.equal(typeof res.data.devOtp, 'string');
  assert.equal(res.data.devOtp.length, 6);
});

test('POST /api/auth/verify-otp validates code and resets password successfully', async () => {
  // 1. Request OTP
  const req1 = createMockReqRes({
    method: 'POST',
    body: { email: 'jaikiranjp@gmail.com' },
  });
  await forgotPasswordHandler(req1.req, req1.res);
  const code = req1.res.data.devOtp;

  // 2. Submit wrong OTP -> should fail
  const badReq = createMockReqRes({
    method: 'POST',
    body: {
      email: 'jaikiranjp@gmail.com',
      otp: '000000',
      newPassword: 'MyNewSecurePassword999!',
    },
  });
  await verifyOtpHandler(badReq.req, badReq.res);
  assert.equal(badReq.res.statusCode, 400);

  // 3. Submit valid OTP -> should succeed
  const goodReq = createMockReqRes({
    method: 'POST',
    body: {
      email: 'jaikiranjp@gmail.com',
      otp: code,
      newPassword: 'MyNewSecurePassword999!',
    },
  });
  await verifyOtpHandler(goodReq.req, goodReq.res);
  assert.equal(goodReq.res.statusCode, 200);
  assert.equal(goodReq.res.data.success, true);

  // 4. Login with newly set password -> should succeed
  const loginReq = createMockReqRes({
    method: 'POST',
    body: {
      email: 'jaikiranjp@gmail.com',
      password: 'MyNewSecurePassword999!',
    },
  });
  await loginHandler(loginReq.req, loginReq.res);
  assert.equal(loginReq.res.statusCode, 200);
  assert.equal(loginReq.res.data.success, true);
});

