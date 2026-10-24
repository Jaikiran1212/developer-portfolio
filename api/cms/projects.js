// ==============================================================================
// CMS PROJECTS ENDPOINT (GET, POST, PUT, DELETE, PATCH /api/cms/projects)
// Protected: Admin authorization required for all operations
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

  // 1. GET: Fetch all projects (both published and drafts)
  if (method === 'GET') {
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('projects').select('*').order('display_order', { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ projects: data || [] });
    }
    return res.status(200).json({ projects: memoryStore.projects });
  }

  // 2. POST: Create a new project
  if (method === 'POST') {
    const body = req.body || {};
    const title = cleanString(body.title);
    const category = cleanString(body.category) || 'Frontend';
    const short_desc = cleanString(body.short_desc || body.desc);
    const slug = cleanString(body.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (!title || title.length < 2) {
      return res.status(400).json({ error: 'Project title is required (min 2 characters).' });
    }
    if (!short_desc || short_desc.length < 5) {
      return res.status(400).json({ error: 'Short description is required (min 5 characters).' });
    }
    if (body.repo_url && !isValidUrl(body.repo_url)) {
      return res.status(400).json({ error: 'Repository URL must be a valid URL.' });
    }
    if (body.live_url && !isValidUrl(body.live_url)) {
      return res.status(400).json({ error: 'Live Demo URL must be a valid URL.' });
    }

    const newProject = {
      slug,
      title: sanitizeText(title),
      category: sanitizeText(category),
      short_desc: sanitizeText(short_desc),
      problem_statement: sanitizeText(body.problem_statement || ''),
      solution: sanitizeText(body.solution || ''),
      architecture: sanitizeText(body.architecture || ''),
      my_contribution: sanitizeText(body.my_contribution || ''),
      challenges: sanitizeText(body.challenges || ''),
      measurable_results: sanitizeText(body.measurable_results || ''),
      notes_markdown: cleanString(body.notes_markdown || body.notes || ''),
      tech_stack: Array.isArray(body.tech_stack)
        ? body.tech_stack.map(cleanString).filter(Boolean)
        : (body.tech || '').split(',').map(cleanString).filter(Boolean),
      repo_url: cleanString(body.repo_url || body.github || ''),
      live_url: cleanString(body.live_url || body.live || ''),
      image_url: cleanString(body.image_url || body.image || ''),
      featured: Boolean(body.featured),
      published: body.published !== false,
      display_order: Number(body.display_order) || 99,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('projects').insert([newProject]).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'PROJECT_CREATED', 'projects', { title: newProject.title, slug });
      return res.status(201).json({ success: true, project: data });
    }

    newProject.id = Date.now();
    memoryStore.projects.push(newProject);
    await logAuditEvent(auth.user.email, 'PROJECT_CREATED', 'projects', { title: newProject.title, slug });
    return res.status(201).json({ success: true, project: newProject });
  }

  // 3. PUT: Update an existing project
  if (method === 'PUT') {
    const body = req.body || {};
    const id = Number(body.id);
    if (!id) return res.status(400).json({ error: 'Project ID is required.' });

    const title = cleanString(body.title);
    if (!title || title.length < 2) {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    const updates = {
      title: sanitizeText(title),
      category: sanitizeText(body.category || 'Frontend'),
      short_desc: sanitizeText(body.short_desc || body.desc || ''),
      problem_statement: sanitizeText(body.problem_statement || ''),
      solution: sanitizeText(body.solution || ''),
      architecture: sanitizeText(body.architecture || ''),
      my_contribution: sanitizeText(body.my_contribution || ''),
      challenges: sanitizeText(body.challenges || ''),
      measurable_results: sanitizeText(body.measurable_results || ''),
      notes_markdown: cleanString(body.notes_markdown || body.notes || ''),
      tech_stack: Array.isArray(body.tech_stack)
        ? body.tech_stack.map(cleanString).filter(Boolean)
        : (body.tech || '').split(',').map(cleanString).filter(Boolean),
      repo_url: cleanString(body.repo_url || body.github || ''),
      live_url: cleanString(body.live_url || body.live || ''),
      image_url: cleanString(body.image_url || body.image || ''),
      featured: Boolean(body.featured),
      published: body.published !== false,
      updated_at: new Date().toISOString(),
    };

    if (body.display_order !== undefined) updates.display_order = Number(body.display_order);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'PROJECT_UPDATED', 'projects', { id, title: updates.title });
      return res.status(200).json({ success: true, project: data });
    }

    const idx = memoryStore.projects.findIndex((p) => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found.' });
    memoryStore.projects[idx] = { ...memoryStore.projects[idx], ...updates };
    await logAuditEvent(auth.user.email, 'PROJECT_UPDATED', 'projects', { id, title: updates.title });
    return res.status(200).json({ success: true, project: memoryStore.projects[idx] });
  }

  // 4. DELETE: Remove a project
  if (method === 'DELETE') {
    const id = Number(req.query?.id || req.body?.id);
    if (!id) return res.status(400).json({ error: 'Project ID is required.' });

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'PROJECT_DELETED', 'projects', { id });
      return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
    }

    memoryStore.projects = memoryStore.projects.filter((p) => p.id !== id);
    await logAuditEvent(auth.user.email, 'PROJECT_DELETED', 'projects', { id });
    return res.status(200).json({ success: true, message: 'Project deleted successfully.' });
  }

  // 5. PATCH: Reorder or toggle publish
  if (method === 'PATCH') {
    const { id, published, display_order, reorder } = req.body || {};

    // Batch reorder
    if (Array.isArray(reorder)) {
      if (hasSupabaseConfig && supabase) {
        for (const item of reorder) {
          await supabase.from('projects').update({ display_order: item.display_order }).eq('id', item.id);
        }
      } else {
        for (const item of reorder) {
          const p = memoryStore.projects.find((x) => x.id === item.id);
          if (p) p.display_order = item.display_order;
        }
      }
      await logAuditEvent(auth.user.email, 'PROJECTS_REORDERED', 'projects');
      return res.status(200).json({ success: true });
    }

    // Toggle publish or update order for single item
    const updates = {};
    if (published !== undefined) updates.published = Boolean(published);
    if (display_order !== undefined) updates.display_order = Number(display_order);

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', id).select().single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, project: data });
    }

    const p = memoryStore.projects.find((x) => x.id === id);
    if (p) Object.assign(p, updates);
    return res.status(200).json({ success: true, project: p });
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}
