// ==============================================================================
// CMS SOCIAL LINKS ENDPOINT (api/cms/socials.js)
// Protected: Admin authorization required
// ==============================================================================
import { verifyAdmin, logAuditEvent } from '../_lib/auth.js';
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import { cleanString, sanitizeText, isValidUrl } from '../_lib/validator.js';

export default async function handler(req, res) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  const { method } = req;

  // 1. GET
  if (method === 'GET') {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('social_links').select('*').order('display_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ socials: data || [] });
    }
    return res.status(200).json({ socials: memoryStore.socials });
  }

  // 2. POST
  if (method === 'POST') {
    const body = req.body || {};
    const name = cleanString(body.name);
    const url = cleanString(body.url);
    const icon = cleanString(body.icon || 'website');

    if (!name) return res.status(400).json({ error: 'Platform name is required.' });
    if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Valid URL is required.' });

    const newSocial = {
      name: sanitizeText(name),
      url,
      icon,
      show_hero: body.show_hero !== false && body.hero !== false,
      show_contact: body.show_contact !== false && body.contact !== false,
      display_order: Number(body.display_order) || 99,
      created_at: new Date().toISOString(),
    };

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('social_links').insert([newSocial]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'SOCIAL_LINK_CREATED', 'social_links', { name });
      return res.status(201).json({ success: true, social: data });
    }

    newSocial.id = Date.now();
    memoryStore.socials.push(newSocial);
    await logAuditEvent(auth.user.email, 'SOCIAL_LINK_CREATED', 'social_links', { name });
    return res.status(201).json({ success: true, social: newSocial });
  }

  // 3. PUT
  if (method === 'PUT') {
    const body = req.body || {};
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: 'Social link ID is required.' });

    const name = cleanString(body.name);
    const url = cleanString(body.url);
    if (!name) return res.status(400).json({ error: 'Platform name is required.' });
    if (!url || !isValidUrl(url)) return res.status(400).json({ error: 'Valid URL is required.' });

    const updates = {
      name: sanitizeText(name),
      url,
      icon: cleanString(body.icon || 'website'),
      show_hero: body.show_hero !== false && body.hero !== false,
      show_contact: body.show_contact !== false && body.contact !== false,
    };
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('social_links').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'SOCIAL_LINK_UPDATED', 'social_links', { id, name });
      return res.status(200).json({ success: true, social: data });
    }

    const idx = memoryStore.socials.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Social link not found.' });
    memoryStore.socials[idx] = { ...memoryStore.socials[idx], ...updates };
    await logAuditEvent(auth.user.email, 'SOCIAL_LINK_UPDATED', 'social_links', { id, name });
    return res.status(200).json({ success: true, social: memoryStore.socials[idx] });
  }

  // 4. DELETE
  if (method === 'DELETE') {
    const id = Number(req.query?.id || req.body?.id);
    if (!id) return res.status(400).json({ error: 'Social link ID is required.' });

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('social_links').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'SOCIAL_LINK_DELETED', 'social_links', { id });
      return res.status(200).json({ success: true, message: 'Social link deleted.' });
    }

    memoryStore.socials = memoryStore.socials.filter((s) => s.id !== id);
    await logAuditEvent(auth.user.email, 'SOCIAL_LINK_DELETED', 'social_links', { id });
    return res.status(200).json({ success: true, message: 'Social link deleted.' });
  }

  // 5. PATCH (reorder)
  if (method === 'PATCH') {
    const { reorder } = req.body || {};
    if (Array.isArray(reorder)) {
      if (hasSupabaseConfig && supabase) {
        for (const item of reorder) {
          await supabase.from('social_links').update({ display_order: item.display_order }).eq('id', item.id);
        }
      } else {
        for (const item of reorder) {
          const s = memoryStore.socials.find((x) => x.id === item.id);
          if (s) s.display_order = item.display_order;
        }
      }
      return res.status(200).json({ success: true });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
