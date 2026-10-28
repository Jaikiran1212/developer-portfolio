// ==============================================================================
// SERVER-SIDE INPUT VALIDATION UTILITIES
// IMPORTANT: text is stored RAW (trimmed, control characters removed).
// HTML escaping happens ONLY when rendering (client esc() / escapeHtml() for e-mails).
// Escaping on save as well caused "&amp;#x27;" double-encoding.
// ==============================================================================

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Escape for output contexts (e-mail HTML, etc.). NEVER use before saving to the DB. */
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Trim + strip control characters. Keeps newlines/tabs. */
export function cleanString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(CONTROL_CHARS, '').trim();
}

/** Plain-text normalisation for stored fields (no HTML escaping, see header note). */
export function sanitizeText(str) {
  return cleanString(str);
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return email.length >= 5 && email.length <= 255 && re.test(email);
}

/**
 * URL validation. Only http(s), mailto and tel are accepted (never javascript:, data:, vbscript:).
 * opts.allowRelative lets "/images/x.png" through (for images hosted with the site).
 */
export function isValidUrl(url, allowEmpty = true, opts = {}) {
  if (!url) return allowEmpty;
  if (typeof url !== 'string' || url.length > 2048) return false;
  if (/[\u0000-\u001F\u007F\s]/.test(url)) return false;
  if (opts.allowRelative && /^\/(?!\/)[\w\-./%]+$/.test(url)) return true;
  if (/^(mailto|tel):/i.test(url)) return opts.noMailto ? false : true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Conservative SVG check for admin-supplied icons. */
export function isSafeSvg(svg) {
  if (typeof svg !== 'string') return false;
  const s = svg.trim();
  if (s.length > 20000 || !/^<svg[\s>]/i.test(s) || !/<\/svg>\s*$/i.test(s)) return false;
  const banned = [
    /<\s*script/i,
    /<\s*foreignObject/i,
    /<\s*iframe/i,
    /<\s*object/i,
    /<\s*embed/i,
    /<\s*link/i,
    /<\s*meta/i,
    /<\s*style/i,
    /<\s*animate/i,
    /<\s*set[\s>]/i,
    /\son[a-z]+\s*=/i,
    /javascript\s*:/i,
    /data\s*:\s*text\/html/i,
    /(?:xlink:)?href\s*=\s*(?!["']?\s*#)/i,
  ];
  return !banned.some((re) => re.test(s));
}

const DATA_IMAGE = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/** Validates a skill icon value; returns { ok, type, value, error }. */
export function validateIconValue(raw) {
  const v = cleanString(raw);
  if (!v) return { ok: false, error: 'Icon value is required.' };
  if (/^<svg/i.test(v)) {
    return isSafeSvg(v) ? { ok: true, type: 'svg', value: v } : { ok: false, error: 'SVG icon contains unsafe content or is too large (max 20 KB, no scripts/event handlers).' };
  }
  if (/^data:/i.test(v)) {
    return v.length <= 80000 && DATA_IMAGE.test(v)
      ? { ok: true, type: 'url', value: v }
      : { ok: false, error: 'Uploaded icon must be a PNG/JPEG/WebP/GIF under about 60 KB.' };
  }
  if (/^https?:|^\//i.test(v)) {
    return isValidUrl(v, false, { allowRelative: true, noMailto: true }) ? { ok: true, type: 'url', value: v } : { ok: false, error: 'Icon URL is invalid.' };
  }
  return /^[a-z0-9+_.-]{1,40}$/i.test(v) ? { ok: true, type: 'slug', value: v.toLowerCase() } : { ok: false, error: 'Icon must be a slug (e.g. "react"), an https URL, an uploaded image, or a safe SVG.' };
}

const clamp = (n, lo, hi, d) => {
  const x = Number(n);
  return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : d;
};

export const PHOTO_FRAMES = ['cutout', 'arch', 'circle', 'squircle'];
export const PHOTO_BACKDROPS = ['Dark Cyber Glow', 'Transparent / None', 'Frosted Glass', 'Light Slate'];

/** Allow-list + clamp for photo_config. Rejects oversized inline images. */
export function validatePhotoConfig(c) {
  if (typeof c !== 'object' || c === null || Array.isArray(c)) return { ok: false, error: 'photo_config must be an object.' };
  const src = typeof c.src === 'string' ? c.src.trim() : '';
  if (src) {
    const okData = src.startsWith('data:') && src.length <= 200000 && DATA_IMAGE.test(src);
    const okUrl = !src.startsWith('data:') && isValidUrl(src, false, { allowRelative: true, noMailto: true });
    if (!okData && !okUrl) return { ok: false, error: 'Photo must be an https/relative URL or a small (<150 KB) inline image. Prefer hosting the file and pasting its URL.' };
  }
  return {
    ok: true,
    value: {
      src,
      width: clamp(c.width, 200, 800, 400),
      height: clamp(c.height, 240, 900, 480),
      scale: clamp(c.scale, 0.5, 2.5, 1),
      x: clamp(c.x, -300, 300, 0),
      y: clamp(c.y, -300, 300, 0),
      feather: clamp(c.feather, 0, 50, 10),
      bgMode: PHOTO_BACKDROPS.includes(c.bgMode) ? c.bgMode : 'Transparent / None',
      frame: PHOTO_FRAMES.includes(c.frame) ? c.frame : 'cutout',
      autoCutout: Boolean(c.autoCutout),
      cutoutTolerance: clamp(c.cutoutTolerance, 0, 85, 38),
    },
  };
}

/** Allow-list for logo_config. */
export function validateLogoConfig(c) {
  if (typeof c !== 'object' || c === null || Array.isArray(c)) return { ok: false, error: 'logo_config must be an object.' };
  const preset = typeof c.preset === 'string' && /^[a-z0-9-]{1,40}$/.test(c.preset) ? c.preset : 'hex-ribbon';
  const color = (v, d) => (typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : d);
  const custom = typeof c.custom_url === 'string' ? c.custom_url.trim() : '';
  if (custom && !isValidUrl(custom, false, { allowRelative: true, noMailto: true }) && !(custom.startsWith('data:') && custom.length <= 120000 && DATA_IMAGE.test(custom))) {
    return { ok: false, error: 'Custom logo must be an https/relative URL or a small inline image.' };
  }
  return { ok: true, value: { preset, custom_url: custom, primary_color: color(c.primary_color, '#22d3ee'), secondary_color: color(c.secondary_color, '#8b5cf6') } };
}

export function validateContactForm(body) {
  const errors = [];

  if (body.website_trap || body._hp) {
    errors.push('Spam detection triggered');
    return { isValid: false, errors, isSpam: true };
  }

  const name = cleanString(body.name);
  const email = cleanString(body.email);
  const subject = cleanString(body.subject);
  const message = cleanString(body.message || body.msg);

  if (!name || name.length < 2 || name.length > 120) errors.push('Name must be between 2 and 120 characters.');
  if (!isValidEmail(email)) errors.push('A valid email address is required.');
  if (!subject || subject.length < 2 || subject.length > 200) errors.push('Subject must be between 2 and 200 characters.');
  if (!message || message.length < 5 || message.length > 4000) errors.push('Message must be between 5 and 4000 characters.');

  return {
    isValid: errors.length === 0,
    errors,
    data: { name, email: email.toLowerCase(), subject, message },
  };
}
