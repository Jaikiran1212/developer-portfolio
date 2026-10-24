// ==============================================================================
// CMS EXPERIENCE & CERTIFICATIONS ENDPOINT (api/cms/experience.js)
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

  // 1. GET: Fetch all experience items
  if (method === 'GET') {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('experience').select('*').order('display_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ experience: data || [] });
    }
    return res.status(200).json({ experience: memoryStore.experience });
  }

  // 2. POST: Add item
  if (method === 'POST') {
    const body = req.body || {};
    const org = cleanString(body.organization || body.company);
    const role = cleanString(body.role_title || body.role);
    const duration = cleanString(body.duration || body.date);

    if (!org || !role) {
      return res.status(400).json({ error: 'Organization and role title are required.' });
    }
    if (body.credential_url && !isValidUrl(body.credential_url)) {
      return res.status(400).json({ error: 'Credential URL must be a valid URL.' });
    }

    const newItem = {
      category: cleanString(body.category) || 'experience',
      organization: sanitizeText(org),
      role_title: sanitizeText(role),
      duration: sanitizeText(duration),
      points: Array.isArray(body.points)
        ? body.points.map(cleanString).filter(Boolean)
        : (body.points_text || '').split('\n').map(cleanString).filter(Boolean),
      tags: Array.isArray(body.tags)
        ? body.tags.map(cleanString).filter(Boolean)
        : (body.tags_text || '').split(',').map(cleanString).filter(Boolean),
      credential_url: cleanString(body.credential_url || body.url || ''),
      published: body.published !== false,
      display_order: Number(body.display_order) || 99,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('experience').insert([newItem]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'EXPERIENCE_CREATED', 'experience', { org, role });
      return res.status(201).json({ success: true, experience: data });
    }

    newItem.id = Date.now();
    memoryStore.experience.push(newItem);
    await logAuditEvent(auth.user.email, 'EXPERIENCE_CREATED', 'experience', { org, role });
    return res.status(201).json({ success: true, experience: newItem });
  }

  // 3. PUT: Update item
  if (method === 'PUT') {
    const body = req.body || {};
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: 'Item ID is required.' });

    const org = cleanString(body.organization || body.company);
    const role = cleanString(body.role_title || body.role);

    const updates = {
      organization: sanitizeText(org),
      role_title: sanitizeText(role),
      duration: sanitizeText(body.duration || body.date || ''),
      category: cleanString(body.category || 'experience'),
      points: Array.isArray(body.points)
        ? body.points.map(cleanString).filter(Boolean)
        : (body.points_text || '').split('\n').map(cleanString).filter(Boolean),
      tags: Array.isArray(body.tags)
        ? body.tags.map(cleanString).filter(Boolean)
        : (body.tags_text || '').split(',').map(cleanString).filter(Boolean),
      credential_url: cleanString(body.credential_url || body.url || ''),
      published: body.published !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('experience').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'EXPERIENCE_UPDATED', 'experience', { id, org, role });
      return res.status(200).json({ success: true, experience: data });
    }

    const idx = memoryStore.experience.findIndex((x) => x.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Item not found.' });
    memoryStore.experience[idx] = { ...memoryStore.experience[idx], ...updates };
    await logAuditEvent(auth.user.email, 'EXPERIENCE_UPDATED', 'experience', { id, org, role });
    return res.status(200).json({ success: true, experience: memoryStore.experience[idx] });
  }

  // 4. DELETE: Remove item
  if (method === 'DELETE') {
    const id = Number(req.query?.id || req.body?.id);
    if (!id) return res.status(400).json({ error: 'Item ID is required.' });

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('experience').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'EXPERIENCE_DELETED', 'experience', { id });
      return res.status(200).json({ success: true, message: 'Item deleted.' });
    }

    memoryStore.experience = memoryStore.experience.filter((x) => x.id !== id);
    await logAuditEvent(auth.user.email, 'EXPERIENCE_DELETED', 'experience', { id });
    return res.status(200).json({ success: true, message: 'Item deleted.' });
  }

  // 5. PATCH: Reorder
  if (method === 'PATCH') {
    const { reorder } = req.body || {};
    if (Array.isArray(reorder)) {
      if (hasSupabaseConfig && supabase) {
        for (const item of reorder) {
          await supabase.from('experience').update({ display_order: item.display_order }).eq('id', item.id);
        }
      } else {
        for (const item of reorder) {
          const e = memoryStore.experience.find((x) => x.id === item.id);
          if (e) e.display_order = item.display_order;
        }
      }
      return res.status(200).json({ success: true });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
