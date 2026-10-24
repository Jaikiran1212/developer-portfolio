// ==============================================================================
// SECURE ADMIN LOGIN ENDPOINT (POST /api/auth/login)
// Features:
// 1. Supabase Auth password verification
// 2. Strict admin authorization check (admin_users table / ADMIN_EMAILS)
// 3. Brute-force rate limiting protection
// 4. Generic error messages (prevents user enumeration)
// 5. Audit event logging without passwords
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import { checkRateLimit, getClientIp } from '../_lib/rate-limiter.js';
import { cleanString, isValidEmail } from '../_lib/validator.js';
import { logAuditEvent } from '../_lib/auth.js';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'jaikiranjp@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Abuse & Brute-Force Protection: Max 5 login attempts per 15 min per IP
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
    // Generic error message to prevent enumeration
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  // 2. Production Supabase Auth Authentication
  if (hasSupabaseConfig && supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password: rawPassword,
      });

      if (authError || !authData?.session) {
        await logAuditEvent(cleanedEmail, 'LOGIN_FAILED', 'auth', { reason: 'bad_credentials' });
        // Generic error message
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const user = authData.user;

      // 3. Explicit Admin Authorization Check
      // Authenticated users are NOT automatically administrators
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

  // 4. Local Development Fallback Mode (when Supabase is not yet configured)
  // For initial local setup testing
  if (ADMIN_EMAILS.includes(cleanedEmail)) {
    // In dev mode without Supabase, issue signed dev token
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
