// ==============================================================================
// SECURE CONTACT FORM ENDPOINT (POST /api/contact)
// Protected by:
// 1. Sliding window rate limiting per IP
// 2. Honeypot anti-spam trap field
// 3. Strict RFC email and character bounds validation
// 4. HTML sanitization against stored XSS
// 5. Database persistence with RLS & audit logging
// ==============================================================================
import { supabase, hasSupabaseConfig, memoryStore } from './_lib/supabase.js';
import { checkRateLimit, getClientIp } from './_lib/rate-limiter.js';
import { validateContactForm } from './_lib/validator.js';
import { logAuditEvent } from './_lib/auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Rate Limiting Check: Max 5 submissions per 15 minutes per IP
  const clientIp = getClientIp(req);
  const rateLimitKey = `contact:${clientIp}`;
  const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many submissions. Please wait ${rateLimit.retryAfterSec} seconds before trying again.`,
    });
  }

  // Parse body safely
  const body = req.body || {};

  // 2. Input Validation, Honeypot Check & Sanitization
  const validation = validateContactForm(body);

  if (validation.isSpam) {
    // Silently succeed to mislead spam bots without storing garbage
    await logAuditEvent('anonymous', 'SPAM_BLOCKED', 'contact_form', { ip: clientIp });
    return res.status(200).json({ success: true, message: 'Message sent successfully.' });
  }

  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.errors[0] || 'Invalid submission data.',
      details: validation.errors,
    });
  }

  const { name, email, subject, message } = validation.data;
  // Non-reversible IP hash for audit/privacy compliance
  const ipHash = crypto.createHash('sha256').update(clientIp + 'salt_jk_2026').digest('hex').slice(0, 16);

  const messageRecord = {
    name,
    email,
    subject,
    message,
    status: 'unread',
    ip_hash: ipHash,
    created_at: new Date().toISOString(),
  };

  // 3. Database Persistence
  if (hasSupabaseConfig && supabase) {
    try {
      const { data, error } = await supabase.from('messages').insert([messageRecord]).select('id').single();

      if (error) {
        console.error('Database insert error on contact message:', error);
        // Fall back to memoryStore so user submission is never dropped
        messageRecord.id = Date.now();
        memoryStore.messages.unshift(messageRecord);
      } else if (data?.id) {
        messageRecord.id = data.id;
      }
    } catch (err) {
      console.error('Contact handler database exception:', err);
      messageRecord.id = Date.now();
      memoryStore.messages.unshift(messageRecord);
    }
  } else {
    messageRecord.id = Date.now();
    memoryStore.messages.unshift(messageRecord);
  }

  // 4. Audit Log
  await logAuditEvent('anonymous', 'CONTACT_MESSAGE_RECEIVED', 'messages', {
    subject,
    emailDomain: email.split('@')[1],
  });

  return res.status(200).json({
    success: true,
    message: 'Thank you, your message has been sent. Jai Kiran will get back to you shortly!',
  });
}
