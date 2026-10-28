// ==============================================================================
// OPTIONAL CLOUDFLARE TURNSTILE WIDGET (active only when VITE_TURNSTILE_SITE_KEY is set)
// ==============================================================================
const SITE_KEY = import.meta.env?.VITE_TURNSTILE_SITE_KEY || '';
let scriptPromise = null;

export const turnstileEnabled = () => Boolean(SITE_KEY);

function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Renders the widget into `container`; returns { getToken, reset }. No-op when disabled. */
export async function mountTurnstile(container) {
  if (!SITE_KEY || !container) return { getToken: () => '', reset() {} };
  try {
    await loadScript();
    const id = window.turnstile.render(container, { sitekey: SITE_KEY, theme: 'dark' });
    return { getToken: () => window.turnstile.getResponse(id) || '', reset: () => window.turnstile.reset(id) };
  } catch {
    return { getToken: () => '', reset() {} };
  }
}
