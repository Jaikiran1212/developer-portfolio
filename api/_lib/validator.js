// ==============================================================================
// SERVER-SIDE INPUT VALIDATION & SANITIZATION UTILITIES
// Prevents XSS, SQL/NoSQL injection, and malformed inputs
// ==============================================================================

/**
 * Escapes HTML control characters to prevent stored XSS attacks
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Basic string sanitization that trims and strips null bytes
 */
export function cleanString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\0/g, '').trim();
}

/**
 * Validates email format according to RFC 5322 standard
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return email.length >= 5 && email.length <= 255 && re.test(email);
}

/**
 * Validates URLs (HTTP, HTTPS, mailto, tel)
 */
export function isValidUrl(url, allowEmpty = true) {
  if (!url) return allowEmpty;
  if (typeof url !== 'string') return false;
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates contact form submission
 */
export function validateContactForm(body) {
  const errors = [];

  // Honeypot check (field that should remain empty for humans)
  if (body.website_trap || body._hp) {
    errors.push('Spam detection triggered');
    return { isValid: false, errors, isSpam: true };
  }

  const name = cleanString(body.name);
  const email = cleanString(body.email);
  const subject = cleanString(body.subject);
  const message = cleanString(body.message || body.msg);

  if (!name || name.length < 2 || name.length > 120) {
    errors.push('Name must be between 2 and 120 characters.');
  }

  if (!isValidEmail(email)) {
    errors.push('A valid email address is required.');
  }

  if (!subject || subject.length < 2 || subject.length > 200) {
    errors.push('Subject must be between 2 and 200 characters.');
  }

  if (!message || message.length < 5 || message.length > 4000) {
    errors.push('Message must be between 5 and 4000 characters.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      name: sanitizeText(name),
      email: email.toLowerCase(),
      subject: sanitizeText(subject),
      message: sanitizeText(message),
    },
  };
}
