// ==============================================================================
// SERVER-SIDE AUTHENTICATION & AUTHORIZATION
// - Session lives in an HttpOnly, SameSite=Strict cookie (not readable by page scripts).
// - "Authenticated" is NOT "admin": the user must be in admin_users or ADMIN_EMAILS
//   (and have a confirmed e-mail).
// - There is NO forgeable dev token in production (see env.js isDevAuthAllowed()).
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore } from './supabase.js';
import { isConfigAdminEmail, isDevAuthAllowed, isProduction } from './env.js';

export const SESSION_COOKIE = 'jk_session';
export const REFRESH_COOKIE = 'jk_refresh';
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'jk-admin';

export function parseCookies(req) {
  const out = {};
  const header = req?.headers?.cookie;
  if (!header || typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function extractBearerToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') return parts[1].trim();
  return null;
}

function extractSession(req) {
  const bearer = extractBearerToken(req);
  if (bearer) return { token: bearer, source: 'bearer' };
  const cookie = parseCookies(req)[SESSION_COOKIE];
  return cookie ? { token: cookie, source: 'cookie' } : null;
}

const isSecureRequest = (req) => req?.headers?.['x-forwarded-proto'] === 'https' || isProduction();

export function setSessionCookies(req, res, { accessToken, refreshToken, expiresIn = 3600 }) {
  const secure = isSecureRequest(req) ? '; Secure' : '';
  const cookies = [`${SESSION_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${Math.max(60, Math.floor(expiresIn))}`];
  if (refreshToken) {
    cookies.push(`${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}; Path=/api/auth; HttpOnly; SameSite=Strict${secure}; Max-Age=${60 * 60 * 24 * 7}`);
  }
  res.setHeader('Set-Cookie', cookies);
}

export function clearSessionCookies(req, res) {
  const secure = isSecureRequest(req) ? '; Secure' : '';
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=0`,
    `${REFRESH_COOKIE}=; Path=/api/auth; HttpOnly; SameSite=Strict${secure}; Max-Age=0`,
  ]);
}

/** Decides whether a Supabase user may act as admin. */
export async function authorizeUser(user) {
  const email = String(user?.email || '').toLowerCase();
  let role = null;
  try {
    const { data } = await supabase.from('admin_users').select('role').eq('id', user.id).maybeSingle();
    if (data && ['admin', 'superadmin'].includes(data.role)) role = data.role;
  } catch {
    /* treated as not listed */
  }
  const confirmed = Boolean(user?.email_confirmed_at || user?.confirmed_at);
  if (role) return { ok: true, role };
  if (isConfigAdminEmail(email) && confirmed) return { ok: true, role: 'admin' };
  return { ok: false };
}

/** Is this e-mail an administrator (used by the password reset flow)? */
export async function isAdminEmail(email) {
  const e = String(email || '').toLowerCase();
  if (isConfigAdminEmail(e)) return true;
  if (hasSupabaseConfig && supabase) {
    try {
      const { data } = await supabase.from('admin_users').select('id').eq('email', e).maybeSingle();
      return Boolean(data);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Verifies that the request is authenticated AND authorised as an admin.
 * @returns {Promise<{ ok: boolean, status?: number, error?: string, user?: object }>}
 */
export async function verifyAdmin(req) {
  const session = extractSession(req);
  if (!session) return { ok: false, status: 401, error: 'Authentication required. Please sign in.' };

  // CSRF defence for cookie sessions: unsafe methods must carry our custom header.
  const method = String(req.method || 'GET').toUpperCase();
  if (session.source === 'cookie' && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (req.headers?.[CSRF_HEADER] !== CSRF_VALUE) {
      return { ok: false, status: 403, error: 'Missing request verification header.' };
    }
  }

  if (hasSupabaseConfig && supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(session.token);
      if (authError || !authData?.user) return { ok: false, status: 401, error: 'Invalid or expired session. Please sign in again.' };

      const verdict = await authorizeUser(authData.user);
      if (!verdict.ok) return { ok: false, status: 403, error: 'Access denied. Your account is not authorized as an administrator.' };

      return { ok: true, user: { id: authData.user.id, email: String(authData.user.email || '').toLowerCase(), role: verdict.role } };
    } catch {
      return { ok: false, status: 500, error: 'Failed to verify administrative authorization.' };
    }
  }

  // Not configured: dev tokens work ONLY in explicit local-dev mode.
  if (isDevAuthAllowed()) {
    if (session.token.startsWith('dev_admin_token_')) {
      const email = session.token.replace('dev_admin_token_', '').toLowerCase();
      if (isConfigAdminEmail(email)) {
        return { ok: true, user: { id: '00000000-0000-0000-0000-000000000001', email, role: 'admin' } };
      }
    }
    return { ok: false, status: 401, error: 'Invalid authentication session.' };
  }

  return { ok: false, status: 503, error: 'Authentication service is not configured.' };
}

/** Records an administrative or security audit event without secrets. */
export async function logAuditEvent(actorEmail, action, resource, details = {}) {
  const safeDetails = { ...details };
  for (const k of ['password', 'token', 'pin', 'secret', 'key', 'otp']) delete safeDetails[k];

  const event = {
    actor_email: actorEmail || 'anonymous',
    action: String(action),
    resource: String(resource),
    details: safeDetails,
    created_at: new Date().toISOString(),
  };

  if (hasSupabaseConfig && supabase) {
    try {
      await supabase.from('audit_logs').insert([event]);
    } catch (err) {
      console.error('Failed to persist audit log:', err.message);
    }
  } else {
    event.id = memoryStore.audit_logs.length + 1;
    memoryStore.audit_logs.unshift(event);
    if (memoryStore.audit_logs.length > 500) memoryStore.audit_logs.pop();
  }
}
