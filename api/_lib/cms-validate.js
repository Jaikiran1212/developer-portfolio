// ==============================================================================
// CMS REQUEST VALIDATION (runs before any create/update)
// Rejects unsafe URLs (javascript:, data:), unsafe SVG, out-of-range photo settings
// and unknown enum values. Normalises validated values back onto the body.
// ==============================================================================
import { cleanString, isValidUrl, validateIconValue, validatePhotoConfig, validateLogoConfig } from './validator.js';

export const PROJECT_CATEGORIES = ['Frontend', 'Full-Stack', 'Cybersecurity', 'DSA', 'Systems'];
export const EXPERIENCE_CATEGORIES = ['experience', 'simulation', 'education', 'certification'];
export const SKILL_TIERS = ['now', 'learn', 'cyber'];
export const THEME_NAMES = ['Alternating Contrast', 'Full Cyber Dark', 'Full Clean Light'];

const badUrl = (v, label, opts = {}) => {
  const s = cleanString(String(v ?? ''));
  return s && !isValidUrl(s, true, { noMailto: true, ...opts }) ? `${label} must be a valid http(s) link.` : null;
};

/** @returns {string|null} an error message, or null when the body is acceptable */
export function validateCmsBody(resource, method, body) {
  if (!['POST', 'PUT'].includes(method)) return null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'A JSON request body is required.';

  switch (resource) {
    case 'projects': {
      if (body.category !== undefined && !PROJECT_CATEGORIES.includes(cleanString(body.category))) return 'Invalid project category.';
      return (
        badUrl(body.repo_url ?? body.github, 'Repository URL') ||
        badUrl(body.live_url ?? body.live, 'Live demo URL') ||
        badUrl(body.image_url ?? body.image, 'Image URL', { allowRelative: true })
      );
    }
    case 'experience': {
      if (body.category !== undefined && !EXPERIENCE_CATEGORIES.includes(cleanString(body.category))) return 'Invalid category.';
      return badUrl(body.credential_url ?? body.url, 'Certificate link');
    }
    case 'skills': {
      if (body.tier !== undefined && !SKILL_TIERS.includes(cleanString(body.tier))) return 'Invalid skill tier.';
      const raw = body.icon_value ?? body.icon;
      if (raw !== undefined && String(raw).trim() !== '') {
        const v = validateIconValue(raw);
        if (!v.ok) return v.error;
        body.icon_value = v.value;
      }
      return null;
    }
    case 'socials': {
      const url = cleanString(String(body.url ?? ''));
      if (!url || !isValidUrl(url, false)) return 'A valid link (https://, mailto: or tel:) is required.';
      if (body.icon !== undefined && !/^[a-z0-9_-]{1,40}$/i.test(String(body.icon))) return 'Invalid icon name.';
      return null;
    }
    case 'profile': {
      const bad = badUrl(body.resume_url ?? body.resume, 'Resume link');
      if (bad) return bad;
      if (body.theme !== undefined && !THEME_NAMES.includes(cleanString(body.theme))) return 'Invalid theme.';
      const font = body.font_preset ?? body.font;
      if (font !== undefined && !/^[A-Za-z ]{1,40}$/.test(String(font))) return 'Invalid font preset.';
      if (body.photo_config !== undefined) {
        const v = validatePhotoConfig(body.photo_config);
        if (!v.ok) return v.error;
        body.photo_config = v.value;
      }
      if (body.logo_config !== undefined) {
        const v = validateLogoConfig(body.logo_config);
        if (!v.ok) return v.error;
        body.logo_config = v.value;
      }
      return null;
    }
    default:
      return null;
  }
}
