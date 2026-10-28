// ==============================================================================
// CLOUDFLARE TURNSTILE (optional bot protection)
// Enabled automatically when TURNSTILE_SECRET_KEY is set. Without it, requests pass.
// ==============================================================================
export const turnstileEnabled = () => Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token, ip) {
  if (!turnstileEnabled()) return { ok: true, skipped: true };
  if (!token || typeof token !== 'string') return { ok: false, error: 'Please complete the human verification.' };
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token });
    if (ip) body.set('remoteip', ip);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    return data.success ? { ok: true } : { ok: false, error: 'Human verification failed. Please try again.' };
  } catch {
    return { ok: false, error: 'Human verification is temporarily unavailable. Please try again.' };
  }
}
