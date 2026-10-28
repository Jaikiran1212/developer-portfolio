// ==============================================================================
// CONTACT FORM ENDPOINT (POST /api/contact)
// 1. Shared rate limiting (Upstash when configured)   2. Honeypot   3. Turnstile (optional)
// 4. Strict validation   5. Database persistence (NEVER silently dropped)
// 6. Instant notification to the owner (Resend e-mail and/or Telegram, both optional)
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore, SUPABASE_SERVICE_KEY } from './_lib/supabase.js';
import { checkRateLimitShared, getClientIp } from './_lib/rate-limiter.js';
import { validateContactForm, escapeHtml } from './_lib/validator.js';
import { logAuditEvent } from './_lib/auth.js';
import { verifyTurnstile } from './_lib/turnstile.js';
import { isProduction } from './_lib/env.js';
import crypto from 'crypto';

const FALLBACK_EMAIL = process.env.CONTACT_FALLBACK_EMAIL || process.env.CONTACT_NOTIFY_EMAIL || '';

async function postJson(url, payload, headers = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload), signal: ctrl.signal });
    return r.ok;
  } finally {
    clearTimeout(timer);
  }
}

/** Fire-and-forget style notifications; failures never fail the visitor's request. */
async function notifyOwner({ name, email, subject, message }) {
  const jobs = [];
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (process.env.RESEND_API_KEY && to) {
    jobs.push(
      postJson(
        'https://api.resend.com/emails',
        {
          from: process.env.RESEND_FROM || 'Portfolio <onboarding@resend.dev>',
          to: [to],
          reply_to: email,
          subject: `New portfolio message: ${subject}`.slice(0, 200),
          html: `<p><b>From:</b> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><b>Subject:</b> ${escapeHtml(subject)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        },
        { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
      )
    );
  }
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    jobs.push(
      postJson(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: `New portfolio message\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}`.slice(0, 3900),
      })
    );
  }
  if (jobs.length) await Promise.allSettled(jobs);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateLimit = await checkRateLimitShared(`contact:${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSec));
    return res.status(429).json({ error: `Too many submissions. Please wait ${rateLimit.retryAfterSec} seconds before trying again.` });
  }

  const body = typeof req.body === 'object' && req.body ? req.body : {};
  const validation = validateContactForm(body);

  if (validation.isSpam) {
    await logAuditEvent('anonymous', 'SPAM_BLOCKED', 'contact_form', {});
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  }
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.errors[0] || 'Invalid submission data.', details: validation.errors });
  }

  const human = await verifyTurnstile(body.turnstileToken, clientIp);
  if (!human.ok) return res.status(400).json({ error: human.error });

  const { name, email, subject, message } = validation.data;
  const salt = process.env.IP_HASH_SALT || SUPABASE_SERVICE_KEY || 'dev-only-salt';
  const ipHash = crypto.createHash('sha256').update(clientIp + salt).digest('hex').slice(0, 16);
  const record = { name, email, subject, message, status: 'unread', ip_hash: ipHash, created_at: new Date().toISOString() };

  const failure = () =>
    res.status(503).json({
      error: `Your message could not be saved right now.${FALLBACK_EMAIL ? ` Please email me directly at ${FALLBACK_EMAIL}.` : ' Please try again in a few minutes.'}`,
    });

  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase.from('messages').insert([record]).select('id').single();
    if (error) {
      console.error('Contact insert failed:', error.message);
      return failure(); // never pretend it worked
    }
    record.id = data?.id;
  } else if (isProduction()) {
    return failure();
  } else {
    record.id = Date.now();
    memoryStore.messages.unshift(record); // local development only
  }

  await notifyOwner(validation.data);
  await logAuditEvent('anonymous', 'CONTACT_MESSAGE_RECEIVED', 'messages', { id: record.id });
  return res.status(201).json({ success: true, message: 'Message sent successfully. I will get back to you soon!' });
}
