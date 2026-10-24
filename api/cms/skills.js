// ==============================================================================
// CMS SKILLS ENDPOINT (api/cms/skills.js)
// Protected: Admin authorization required
// ==============================================================================
import { verifyAdmin, logAuditEvent } from '../_lib/auth.js';
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import { cleanString, sanitizeText } from '../_lib/validator.js';

export default async function handler(req, res) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  const { method } = req;

  // 1. GET
  if (method === 'GET') {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('skills').select('*').order('display_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ skills: data || [] });
    }
    return res.status(200).json({ skills: memoryStore.skills });
  }

  // 2. POST
  if (method === 'POST') {
    const body = req.body || {};
    const name = cleanString(body.name);
    const tier = cleanString(body.tier) || 'now';
    const icon_value = cleanString(body.icon_value || body.icon || name.toLowerCase());

    if (!name) return res.status(400).json({ error: 'Skill name is required.' });

    let icon_type = 'slug';
    if (icon_value.startsWith('<svg')) icon_type = 'svg';
    else if (/^(https?:|data:)/.test(icon_value)) icon_type = 'url';

    const newSkill = {
      tier,
      name: sanitizeText(name),
      icon_type,
      icon_value,
      proficiency_label: cleanString(body.proficiency_label || 'Proficient'),
      display_order: Number(body.display_order) || 99,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('skills').insert([newSkill]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'SKILL_CREATED', 'skills', { name, tier });
      return res.status(201).json({ success: true, skill: data });
    }

    newSkill.id = Date.now();
    memoryStore.skills.push(newSkill);
    await logAuditEvent(auth.user.email, 'SKILL_CREATED', 'skills', { name, tier });
    return res.status(201).json({ success: true, skill: newSkill });
  }

  // 3. PUT
  if (method === 'PUT') {
    const body = req.body || {};
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: 'Skill ID is required.' });

    const name = cleanString(body.name);
    const icon_value = cleanString(body.icon_value || body.icon || '');
    let icon_type = 'slug';
    if (icon_value.startsWith('<svg')) icon_type = 'svg';
    else if (/^(https?:|data:)/.test(icon_value)) icon_type = 'url';

    const updates = {
      tier: cleanString(body.tier || 'now'),
      name: sanitizeText(name),
      icon_type,
      icon_value,
      proficiency_label: cleanString(body.proficiency_label || 'Proficient'),
      updated_at: new Date().toISOString(),
    };
    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('skills').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'SKILL_UPDATED', 'skills', { id, name });
      return res.status(200).json({ success: true, skill: data });
    }

    const idx = memoryStore.skills.findIndex((s) => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Skill not found.' });
    memoryStore.skills[idx] = { ...memoryStore.skills[idx], ...updates };
    await logAuditEvent(auth.user.email, 'SKILL_UPDATED', 'skills', { id, name });
    return res.status(200).json({ success: true, skill: memoryStore.skills[idx] });
  }

  // 4. DELETE
  if (method === 'DELETE') {
    const id = Number(req.query?.id || req.body?.id);
    if (!id) return res.status(400).json({ error: 'Skill ID is required.' });

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('skills').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'SKILL_DELETED', 'skills', { id });
      return res.status(200).json({ success: true, message: 'Skill deleted.' });
    }

    memoryStore.skills = memoryStore.skills.filter((s) => s.id !== id);
    await logAuditEvent(auth.user.email, 'SKILL_DELETED', 'skills', { id });
    return res.status(200).json({ success: true, message: 'Skill deleted.' });
  }

  // 5. PATCH (reorder)
  if (method === 'PATCH') {
    const { reorder } = req.body || {};
    if (Array.isArray(reorder)) {
      if (hasSupabaseConfig && supabase) {
        for (const item of reorder) {
          await supabase.from('skills').update({ display_order: item.display_order }).eq('id', item.id);
        }
      } else {
        for (const item of reorder) {
          const s = memoryStore.skills.find((x) => x.id === item.id);
          if (s) s.display_order = item.display_order;
        }
      }
      return res.status(200).json({ success: true });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
