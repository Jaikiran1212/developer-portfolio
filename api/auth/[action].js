// ==============================================================================
// CONSOLIDATED AUTH ROUTER (api/auth/[action].js)
// Handles: /api/auth/login, /api/auth/session, /api/auth/logout,
//          /api/auth/forgot-password, /api/auth/verify-otp
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

  // ============================================================================
  // 1. ACTION: LOGIN (POST /api/auth/login)
  // ============================================================================
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
          await logAuditEvent(cleanedEmail, 'LOGIN_FAILED', 'auth', { reason: authError?.message || 'bad_credentials' });
          const userFriendlyError = authError?.message?.includes('Email not confirmed')
            ? 'Email not confirmed in Supabase. Check your inbox or click "Forgot Password" to verify with OTP and reset your password.'
            : (authError?.message || 'Invalid email or password.');
          return res.status(401).json({ error: userFriendlyError });
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
      if (memoryStore.devAdminPassword && rawPassword !== memoryStore.devAdminPassword) {
        return res.status(401).json({ error: 'Invalid password. If you reset your password, please use the new password.' });
      }
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

  // ============================================================================
  // 2. ACTION: FORGOT PASSWORD (POST /api/auth/forgot-password)
  // ============================================================================
  if (action === 'forgot-password') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`forgot-pass:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many password reset requests. Please wait ${rateLimit.retryAfterSec} seconds.`,
      });
    }

    const { email } = req.body || {};
    const cleanedEmail = cleanString(email).toLowerCase();

    if (!cleanedEmail || !isValidEmail(cleanedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid administrator email address.' });
    }

    const isConfigAdmin = ADMIN_EMAILS.includes(cleanedEmail);
    let isDbAdmin = false;

    if (hasSupabaseConfig && supabase) {
      try {
        const { data } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', cleanedEmail)
          .maybeSingle();
        if (data) isDbAdmin = true;
      } catch (_) {}
    }

    if (!isConfigAdmin && !isDbAdmin) {
      await logAuditEvent(cleanedEmail, 'FORGOT_PASSWORD_UNAUTHORIZED', 'auth', { ip: clientIp });
      return res.status(200).json({
        success: true,
        message: 'If the email is registered as an administrator, a verification code has been dispatched.',
      });
    }

    // Generate secure 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    memoryStore.recoveryOtps = memoryStore.recoveryOtps || {};
    memoryStore.recoveryOtps[cleanedEmail] = {
      otp: generatedOtp,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };

    let emailSent = false;
    if (hasSupabaseConfig && supabase) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanedEmail);
        if (!resetErr) {
          emailSent = true;
        } else {
          const { error: otpErr } = await supabase.auth.signInWithOtp({
            email: cleanedEmail,
            options: { shouldCreateUser: false },
          });
          if (!otpErr) emailSent = true;
        }
      } catch (err) {
        console.warn('Supabase password reset notice:', err.message);
      }
    }

    await logAuditEvent(cleanedEmail, 'PASSWORD_RESET_OTP_GENERATED', 'auth');

    const resPayload = {
      success: true,
      message: 'A 6-digit verification code has been sent to your administrator email inbox.',
    };

    if (!hasSupabaseConfig || !emailSent) {
      resPayload.devOtp = generatedOtp;
      resPayload.message += ` [Offline/Dev Code: ${generatedOtp}]`;
    }

    return res.status(200).json(resPayload);
  }

  // ============================================================================
  // 3. ACTION: VERIFY OTP & RESET PASSWORD (POST /api/auth/verify-otp)
  // ============================================================================
  if (action === 'verify-otp') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`verify-otp:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: `Too many attempts. Please try again in ${rateLimit.retryAfterSec} seconds.`,
      });
    }

    const { email, otp, newPassword } = req.body || {};
    const cleanedEmail = cleanString(email).toLowerCase();
    const cleanedOtp = cleanString(otp);
    const cleanedPassword = cleanString(newPassword);

    if (!cleanedEmail || !isValidEmail(cleanedEmail)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!cleanedOtp || cleanedOtp.length < 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit verification code.' });
    }
    if (!cleanedPassword || cleanedPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const storedRecord = memoryStore.recoveryOtps?.[cleanedEmail];
    let isOtpValid = false;

    if (storedRecord && storedRecord.otp === cleanedOtp && storedRecord.expiresAt > Date.now()) {
      isOtpValid = true;
    }

    let supabaseUserId = null;
    if (hasSupabaseConfig && supabase) {
      try {
        const { data: vData, error: vErr } = await supabase.auth.verifyOtp({
          email: cleanedEmail,
          token: cleanedOtp,
          type: 'recovery',
        });
        if (!vErr && vData?.user) {
          isOtpValid = true;
          supabaseUserId = vData.user.id;
        } else {
          const { data: evData, error: evErr } = await supabase.auth.verifyOtp({
            email: cleanedEmail,
            token: cleanedOtp,
            type: 'email',
          });
          if (!evErr && evData?.user) {
            isOtpValid = true;
            supabaseUserId = evData.user.id;
          }
        }
      } catch (err) {
        console.warn('Supabase verifyOtp notice:', err.message);
      }
    }

    if (!isOtpValid) {
      await logAuditEvent(cleanedEmail, 'OTP_VERIFY_FAILED', 'auth', { ip: clientIp });
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new code.' });
    }

    // Update password in Supabase
    if (hasSupabaseConfig && supabase) {
      try {
        if (!supabaseUserId && supabase.auth.admin) {
          const { data: userList } = await supabase.auth.admin.listUsers();
          const target = userList?.users?.find((u) => u.email?.toLowerCase() === cleanedEmail);
          if (target) supabaseUserId = target.id;
        }

        if (supabaseUserId && supabase.auth.admin) {
          const { error: updateErr } = await supabase.auth.admin.updateUserById(supabaseUserId, {
            password: cleanedPassword,
            email_confirm: true, // Auto-confirm email so subsequent logins immediately succeed!
          });
          if (updateErr) {
            return res.status(500).json({ error: `Could not update password: ${updateErr.message}` });
          }
        } else {
          const { error: selfUpdateErr } = await supabase.auth.updateUser({
            password: cleanedPassword,
          });
          if (selfUpdateErr) {
            return res.status(500).json({ error: selfUpdateErr.message });
          }
        }
      } catch (err) {
        console.error('Password reset update exception:', err);
        return res.status(500).json({ error: 'Failed to update password with authentication provider.' });
      }
    }

    memoryStore.devAdminPassword = cleanedPassword;
    if (memoryStore.recoveryOtps) delete memoryStore.recoveryOtps[cleanedEmail];

    await logAuditEvent(cleanedEmail, 'PASSWORD_RESET_SUCCESS', 'auth');

    return res.status(200).json({
      success: true,
      message: 'Password successfully updated! You can now sign in with your new password.',
    });
  }

  // ============================================================================
  // 4. ACTION: SESSION (GET /api/auth/session)
  // ============================================================================
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

  // ============================================================================
  // 5. ACTION: LOGOUT (POST /api/auth/logout)
  // ============================================================================
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
