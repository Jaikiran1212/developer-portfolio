// ==============================================================================
// CONSOLIDATED AUTH ROUTER (api/auth/[action].js)
// Handles: /api/auth/login, /api/auth/session, /api/auth/logout
// Counts as 1 Serverless Function for Vercel Hobby plan
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import { checkRateLimit, getClientIp } from '../_lib/rate-limiter.js';
import { cleanString, isValidEmail } from '../_lib/validator.js';
import { logAuditEvent, verifyAdmin, extractBearerToken } from '../_lib/auth.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'jaikiranjp@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

export default async function handler(req, res) {
  // Parse action and query params from dynamic route param or fallback URL
  if (req.url && req.url.includes('?')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      req.query = req.query || {};
      for (const [key, value] of urlObj.searchParams.entries()) {
        if (req.query[key] === undefined) {
          req.query[key] = value;
        }
      }
    } catch (_) {}
  }

  let action = req.query?.action;
  if (!action && req.url) {
    const parts = req.url.split('?')[0].split('/');
    action = parts[parts.length - 1];
  }

  // 1. ACTION: LOGIN (POST /api/auth/login)
  if (action === 'login') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`login:${clientIp}`, 5, 15 * 60 * 1000);

    if (!rateLimit.allowed) {
      await logAuditEvent('anonymous', 'LOGIN_RATE_LIMITED', 'auth', { ip: clientIp });
      return res.status(429).json({
        error: `Too many login attempts. Please try again in ${rateLimit.retryAfterSec} seconds.`,
      });
    }

    const { email, password } = req.body || {};
    const cleanedEmail = cleanString(email).toLowerCase();
    const rawPassword = cleanString(password);

    if (!cleanedEmail || !rawPassword || !isValidEmail(cleanedEmail)) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    if (hasSupabaseConfig && supabase) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password: rawPassword,
        });

        if (authError || !authData?.session) {
          await logAuditEvent(cleanedEmail, 'LOGIN_FAILED', 'auth', { reason: 'bad_credentials' });
          return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = authData.user;
        const { data: adminRecord } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const isListedAdmin = adminRecord && ['admin', 'superadmin'].includes(adminRecord.role);
        const isConfigAdmin = ADMIN_EMAILS.includes(cleanedEmail);

        if (!isListedAdmin && !isConfigAdmin) {
          await logAuditEvent(cleanedEmail, 'UNAUTHORIZED_ADMIN_ATTEMPT', 'auth', { userId: user.id });
          return res.status(403).json({
            error: 'Access denied. This account does not possess administrative privileges.',
          });
        }

        await logAuditEvent(cleanedEmail, 'LOGIN_SUCCESS', 'auth', { userId: user.id, role: adminRecord?.role || 'admin' });

        return res.status(200).json({
          success: true,
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: authData.session.expires_at,
          user: {
            id: user.id,
            email: cleanedEmail,
            role: adminRecord?.role || 'admin',
          },
        });
      } catch (err) {
        console.error('Supabase login exception:', err);
        return res.status(500).json({ error: 'Authentication service temporarily unavailable.' });
      }
    }

    // Local Development Fallback Mode
    if (ADMIN_EMAILS.includes(cleanedEmail)) {
      const devToken = `dev_admin_token_${cleanedEmail}`;
      await logAuditEvent(cleanedEmail, 'DEV_LOGIN_SUCCESS', 'auth', { mode: 'fallback' });
      return res.status(200).json({
        success: true,
        accessToken: devToken,
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: cleanedEmail,
          role: 'admin',
        },
        warning: 'Running in local fallback mode. Connect your Supabase project in production.',
      });
    }

    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  // 2. ACTION: SESSION (GET /api/auth/session)
  if (action === 'session') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const auth = await verifyAdmin(req);
    if (!auth.ok) {
      return res.status(auth.status || 401).json({
        authenticated: false,
        error: auth.error,
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: auth.user,
    });
  }

  // 3. ACTION: LOGOUT (POST /api/auth/logout)
  if (action === 'logout') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = extractBearerToken(req);
    if (hasSupabaseConfig && supabase && token) {
      try {
        await supabase.auth.admin?.signOut(token);
      } catch {}
    }

    await logAuditEvent('admin', 'LOGOUT', 'auth');
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  return res.status(404).json({ error: `Unknown auth action: ${action}` });
}
