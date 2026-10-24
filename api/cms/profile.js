// ==============================================================================
// CMS PROFILE ENDPOINT (api/cms/profile.js)
// Protected: Admin authorization required
// ==============================================================================
import { verifyAdmin, logAuditEvent } from '../_lib/auth.js';
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import { cleanString, sanitizeText, isValidEmail, isValidUrl } from '../_lib/validator.js';

export default async function handler(req, res) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  const { method } = req;

  // 1. GET
  if (method === 'GET') {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ profile: data || memoryStore.profile });
    }
    return res.status(200).json({ profile: memoryStore.profile });
  }

  // 2. PUT: Update profile
  if (method === 'PUT') {
    const body = req.body || {};
    const name = cleanString(body.name);
    const email = cleanString(body.email);

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required.' });
    }
    if (body.resume_url && !isValidUrl(body.resume_url)) {
      return res.status(400).json({ error: 'Resume URL must be a valid URL.' });
    }

    const updates = {
      greet: sanitizeText(body.greet || 'Hi, I am'),
      name: sanitizeText(name),
      subs: Array.isArray(body.subs)
        ? body.subs.map(cleanString).filter(Boolean)
        : (body.subs_text || '').split('\n').map(cleanString).filter(Boolean),
      lead_bio: sanitizeText(body.lead_bio || body.bio || ''),
      email: email.toLowerCase(),
      phone: cleanString(body.phone || ''),
      location: sanitizeText(body.location || body.loc || ''),
      resume_url: cleanString(body.resume_url || body.resume || ''),
      font_preset: cleanString(body.font_preset || body.font || 'Cyber Geometric'),
      theme: cleanString(body.theme || 'Alternating Contrast'),
      photo_config: typeof body.photo_config === 'object' && body.photo_config !== null
        ? body.photo_config
        : memoryStore.profile.photo_config,
      updated_at: new Date().toISOString(),
    };

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('profile').upsert({ id: 1, ...updates }).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'PROFILE_UPDATED', 'profile');
      return res.status(200).json({ success: true, profile: data });
    }

    memoryStore.profile = { ...memoryStore.profile, ...updates };
    await logAuditEvent(auth.user.email, 'PROFILE_UPDATED', 'profile');
    return res.status(200).json({ success: true, profile: memoryStore.profile });
  }

  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}
