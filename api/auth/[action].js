// ==============================================================================
// AUTH ENDPOINT  (/api/auth/:action)
// Actions: login | refresh | session | logout | forgot-password | verify-otp
//
// Security notes
//  * Sessions are HttpOnly cookies (access + refresh). Tokens are never returned in JSON.
//  * Password reset uses ONLY Supabase's own e-mailed OTP (verifyOtp). There is no local
//    code, no code in any response, and no dev fallback outside explicit local dev mode.
//  * Only administrators can reset the password; responses never reveal which e-mails exist.
//  * If Supabase is not configured the endpoint answers 503 (fail CLOSED).
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import {
  verifyAdmin, authorizeUser, isAdminEmail, logAuditEvent,
  setSessionCookies, clearSessionCookies, parseCookies, REFRESH_COOKIE,
} from '../_lib/auth.js';
import { checkRateLimitShared, getClientIp } from '../_lib/rate-limiter.js';
import { isValidEmail, cleanString } from '../_lib/validator.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { isDevAuthAllowed, isConfigAdminEmail } from '../_lib/env.js';

const MIN_PASSWORD_LENGTH = 12;
const GENERIC_LOGIN_ERROR = 'Invalid email or password.';
const GENERIC_RESET_NOTICE = 'If that address belongs to an administrator, a verification code has been sent. Check your inbox.';

const devOtps = new Map(); // local development only (never exposed in a response)

function tooMany(res, rl) {
  res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
  return res.status(429).json({ error: `Too many attempts. Please try again in ${Math.ceil((rl.retryAfterSec || 60) / 60)} minute(s).` });
}

function notConfigured(res) {
  return res.status(503).json({ error: 'Authentication service is not configured on this deployment.' });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const action = String(req.query?.action || '').toLowerCase();
  const method = req.method;
  const ip = getClientIp(req);
  const devMode = !(hasSupabaseConfig && supabase) && isDevAuthAllowed();

  try {
    // ------------------------------------------------------------------ SESSION
    if (action === 'session' && method === 'GET') {
      const auth = await verifyAdmin(req);
      if (!auth.ok) return res.status(auth.status).json({ authenticated: false, error: auth.error });
      return res.status(200).json({ authenticated: true, user: auth.user });
    }

    // ------------------------------------------------------------------ LOGOUT
    if (action === 'logout' && method === 'POST') {
      const auth = await verifyAdmin(req);
      if (auth.ok) await logAuditEvent(auth.user.email, 'LOGOUT', 'auth', {});
      clearSessionCookies(req, res);
      return res.status(200).json({ success: true });
    }

    if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

    const body = typeof req.body === 'object' && req.body ? req.body : {};
    if (!hasSupabaseConfig && !devMode) return notConfigured(res);

    // ------------------------------------------------------------------ LOGIN
    if (action === 'login') {
      const email = cleanString(body.email).toLowerCase();
      const password = typeof body.password === 'string' ? body.password : '';
      if (!isValidEmail(email) || !password) return res.status(400).json({ error: 'Email and password are required.' });

      const rlIp = await checkRateLimitShared(`login:ip:${ip}`, 10, 15 * 60 * 1000);
      if (!rlIp.allowed) return tooMany(res, rlIp);
      const rlEmail = await checkRateLimitShared(`login:email:${email}`, 6, 15 * 60 * 1000);
      if (!rlEmail.allowed) return tooMany(res, rlEmail);

      const human = await verifyTurnstile(body.turnstileToken, ip);
      if (!human.ok) return res.status(400).json({ error: human.error });

      if (devMode) {
        const devPass = process.env.DEV_ADMIN_PASSWORD;
        if (!devPass || password !== devPass || !isConfigAdminEmail(email)) return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
        setSessionCookies(req, res, { accessToken: `dev_admin_token_${email}`, expiresIn: 3600 });
        return res.status(200).json({ success: true, user: { id: 'dev', email, role: 'admin' } });
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data?.session || !data?.user) {
        await logAuditEvent(email, 'LOGIN_FAILED', 'auth', { ip_hash: hashIp(ip) });
        return res.status(401).json({ error: GENERIC_LOGIN_ERROR });
      }

      const verdict = await authorizeUser(data.user);
      if (!verdict.ok) {
        await logAuditEvent(email, 'LOGIN_DENIED_NOT_ADMIN', 'auth', {});
        return res.status(403).json({ error: 'This account is not authorized as an administrator.' });
      }

      setSessionCookies(req, res, {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
      });
      await logAuditEvent(email, 'LOGIN_SUCCESS', 'auth', {});
      return res.status(200).json({ success: true, user: { id: data.user.id, email, role: verdict.role } });
    }

    // ------------------------------------------------------------------ REFRESH
    if (action === 'refresh') {
      if (devMode) return res.status(401).json({ error: 'No refresh in dev mode.' });
      const refreshToken = parseCookies(req)[REFRESH_COOKIE];
      if (!refreshToken) return res.status(401).json({ error: 'Session expired. Please sign in again.' });

      const rl = await checkRateLimitShared(`refresh:ip:${ip}`, 30, 15 * 60 * 1000);
      if (!rl.allowed) return tooMany(res, rl);

      const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
      if (error || !data?.session || !data?.user) {
        clearSessionCookies(req, res);
        return res.status(401).json({ error: 'Session expired. Please sign in again.' });
      }
      const verdict = await authorizeUser(data.user);
      if (!verdict.ok) {
        clearSessionCookies(req, res);
        return res.status(403).json({ error: 'Access denied.' });
      }
      setSessionCookies(req, res, {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600,
      });
      return res.status(200).json({ success: true, user: { id: data.user.id, email: String(data.user.email).toLowerCase(), role: verdict.role } });
    }

    // ------------------------------------------------------------------ FORGOT PASSWORD
    if (action === 'forgot-password') {
      const email = cleanString(body.email).toLowerCase();
      if (!isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required.' });

      const rlIp = await checkRateLimitShared(`forgot:ip:${ip}`, 5, 60 * 60 * 1000);
      if (!rlIp.allowed) return tooMany(res, rlIp);
      const rlEmail = await checkRateLimitShared(`forgot:email:${email}`, 3, 60 * 60 * 1000);
      if (!rlEmail.allowed) return tooMany(res, rlEmail);

      const human = await verifyTurnstile(body.turnstileToken, ip);
      if (!human.ok) return res.status(400).json({ error: human.error });

      if (devMode) {
        // Local development only: the code is printed to the SERVER console, never returned.
        if (isConfigAdminEmail(email)) {
          const code = String(Math.floor(100000 + Math.random() * 900000));
          devOtps.set(email, { code, exp: Date.now() + 10 * 60 * 1000 });
          console.info(`[dev-auth] password reset code for ${email}: ${code}`);
        }
        return res.status(200).json({ success: true, message: GENERIC_RESET_NOTICE });
      }

      if (await isAdminEmail(email)) {
        let sent = false;
        const rec = await supabase.auth.resetPasswordForEmail(email);
        if (!rec.error) sent = true;
        if (!sent) {
          const otp = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
          sent = !otp.error;
        }
        await logAuditEvent(email, sent ? 'PASSWORD_RESET_REQUESTED' : 'PASSWORD_RESET_EMAIL_FAILED', 'auth', {});
      }
      // Identical answer whether or not the e-mail exists / the mail was sent.
      return res.status(200).json({ success: true, message: GENERIC_RESET_NOTICE });
    }

    // ------------------------------------------------------------------ VERIFY OTP + NEW PASSWORD
    if (action === 'verify-otp') {
      const email = cleanString(body.email).toLowerCase();
      const otp = cleanString(String(body.otp || body.token || ''));
      const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

      if (!isValidEmail(email) || !/^\d{6,8}$/.test(otp)) return res.status(400).json({ error: 'Enter the numeric code from your email.' });
      if (newPassword.length < MIN_PASSWORD_LENGTH || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters and include letters and numbers.` });
      }

      const rlIp = await checkRateLimitShared(`otp:ip:${ip}`, 8, 15 * 60 * 1000);
      if (!rlIp.allowed) return tooMany(res, rlIp);
      const rlEmail = await checkRateLimitShared(`otp:email:${email}`, 5, 15 * 60 * 1000);
      if (!rlEmail.allowed) return tooMany(res, rlEmail);

      if (devMode) {
        const rec = devOtps.get(email);
        if (!rec || rec.exp < Date.now() || rec.code !== otp) return res.status(400).json({ error: 'Invalid or expired code.' });
        devOtps.delete(email);
        memoryStore.devPasswordNote = 'Dev password reset requested; set DEV_ADMIN_PASSWORD in your env to change it.';
        return res.status(200).json({ success: true, message: 'Dev mode: update DEV_ADMIN_PASSWORD in your local environment.' });
      }

      let verified = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
      if (verified.error || !verified.data?.user) verified = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (verified.error || !verified.data?.user) return res.status(400).json({ error: 'Invalid or expired code.' });

      const user = verified.data.user;
      const verdict = await authorizeUser(user);
      if (!verdict.ok) return res.status(403).json({ error: 'Access denied.' });

      const upd = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
      if (upd.error) return res.status(500).json({ error: 'Could not update the password. Please try again.' });

      await logAuditEvent(email, 'PASSWORD_RESET_COMPLETED', 'auth', {});
      const session = verified.data.session;
      if (session) {
        setSessionCookies(req, res, { accessToken: session.access_token, refreshToken: session.refresh_token, expiresIn: session.expires_in || 3600 });
      }
      return res.status(200).json({ success: true, user: { id: user.id, email, role: verdict.role }, message: 'Password updated.' });
    }

    return res.status(404).json({ error: 'Unknown auth action.' });
  } catch (err) {
    console.error('Auth error:', err?.message);
    return res.status(500).json({ error: 'Authentication request failed. Please try again.' });
  }
}

function hashIp(ip) {
  let h = 0;
  for (const c of String(ip)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return String(h >>> 0);
}
