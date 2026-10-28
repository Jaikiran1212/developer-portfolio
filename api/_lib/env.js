// ==============================================================================
// ENVIRONMENT HELPERS (single place that decides "is this production?")
// ==============================================================================
const vercelEnv = () => process.env.VERCEL_ENV;

/** True on Vercel Production (and any NODE_ENV=production host that is not `vercel dev`). */
export function isProduction() {
  const v = vercelEnv();
  return v === 'production' || (process.env.NODE_ENV === 'production' && v !== 'development');
}

/**
 * The offline "dev auth" mode is only available when ALL of these are true:
 *  - ALLOW_DEV_AUTH=1 is set explicitly
 *  - the code is NOT running on Vercel production/preview (VERCEL_ENV unset or "development")
 *  - NODE_ENV is not "production"
 * It can never be switched on by a public request.
 */
export function isDevAuthAllowed() {
  const v = vercelEnv();
  return process.env.ALLOW_DEV_AUTH === '1' && (!v || v === 'development') && process.env.NODE_ENV !== 'production';
}

/** Admin e-mails come ONLY from the environment (no hard-coded default). */
export function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfigAdminEmail(email) {
  return adminEmails().includes(String(email || '').toLowerCase());
}
