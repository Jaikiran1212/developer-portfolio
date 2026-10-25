// ==============================================================================
// CONSOLIDATED CMS ROUTER (api/cms/[resource].js)
// Handles: /api/cms/dashboard, /api/cms/projects, /api/cms/experience,
//          /api/cms/skills, /api/cms/profile, /api/cms/socials,
//          /api/cms/messages, /api/cms/audit-logs
// Counts as 1 Serverless Function for Vercel Hobby plan
// ==============================================================================
import { verifyAdmin, logAuditEvent } from '../_lib/auth.js';
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';
import { cleanString, sanitizeText, isValidEmail, isValidUrl } from '../_lib/validator.js';

export default async function handler(req, res) {
  // Enforce admin authentication on all CMS endpoints
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  // Parse resource name and query params from dynamic route param or fallback URL
  if (req.url && req.url.includes('?')) {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      req.query = req.query || {};
      for (const [key, value] of urlObj.searchParams.entries()) {
        if (req.query[key] === undefined) {
          req.query[key] = value;
        }
      }
    } catch (_) {}
  }

  let resource = req.query?.resource;
  if (!resource && req.url) {
    const parts = req.url.split('?')[0].split('/');
    resource = parts[parts.length - 1];
  }

  const { method } = req;

  // ============================================================================
  // 1. DASHBOARD (/api/cms/dashboard)
  // ============================================================================
  if (resource === 'dashboard') {
    if (method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (hasSupabaseConfig && supabase) {
      try {
        const [
          { count: projectCount },
          { count: skillCount },
          { count: experienceCount },
          { count: unreadMsgCount },
          { count: totalMsgCount },
          { data: recentAudit },
        ] = await Promise.all([
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          supabase.from('skills').select('*', { count: 'exact', head: true }),
          supabase.from('experience').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(6),
        ]);

        return res.status(200).json({
          stats: {
            projects: projectCount || 0,
            skills: skillCount || 0,
            experience: experienceCount || 0,
            unreadMessages: unreadMsgCount || 0,
            totalMessages: totalMsgCount || 0,
          },
          recentActivity: recentAudit || [],
        });
      } catch (err) {
        console.error('CMS dashboard query error:', err);
      }
    }

    return res.status(200).json({
      stats: {
        projects: memoryStore.projects.length,
        skills: memoryStore.skills.length,
        experience: memoryStore.experience.length,
        unreadMessages: memoryStore.messages.filter((m) => m.status === 'unread').length,
        totalMessages: memoryStore.messages.length,
      },
      recentActivity: memoryStore.audit_logs.slice(0, 6),
    });
  }

  // ============================================================================
  // 2. PROJECTS (/api/cms/projects)
  // ============================================================================
  if (resource === 'projects') {
    if (method === 'GET') {
      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('projects').select('*').order('display_order', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ projects: data || [] });
      }
      return res.status(200).json({ projects: memoryStore.projects });
    }

    if (method === 'POST') {
      const body = req.body || {};
      const title = cleanString(body.title);
      const category = cleanString(body.category) || 'Frontend';
      const short_desc = cleanString(body.short_desc || body.desc);
      const slug = cleanString(body.slug) || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (!title || title.length < 2) return res.status(400).json({ error: 'Project title is required.' });
      if (!short_desc || short_desc.length < 5) return res.status(400).json({ error: 'Short description is required.' });
      if (body.repo_url && !isValidUrl(body.repo_url)) return res.status(400).json({ error: 'Invalid repo URL.' });
      if (body.live_url && !isValidUrl(body.live_url)) return res.status(400).json({ error: 'Invalid live demo URL.' });

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

    if (method === 'PUT') {
      const body = req.body || {};
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Project ID is required.' });

      const title = cleanString(body.title);
      if (!title || title.length < 2) return res.status(400).json({ error: 'Project title is required.' });

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

    if (method === 'PATCH') {
      const { id, published, display_order, reorder } = req.body || {};
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
  }

  // ============================================================================
  // 3. EXPERIENCE (/api/cms/experience)
  // ============================================================================
  if (resource === 'experience') {
    if (method === 'GET') {
      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('experience').select('*').order('display_order', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ experience: data || [] });
      }
      return res.status(200).json({ experience: memoryStore.experience });
    }

    if (method === 'POST') {
      const body = req.body || {};
      const org = cleanString(body.organization || body.company);
      const role = cleanString(body.role_title || body.role);
      const duration = cleanString(body.duration || body.date);

      if (!org || !role) return res.status(400).json({ error: 'Organization and role are required.' });

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

    if (method === 'PUT') {
      const body = req.body || {};
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Item ID required.' });

      const updates = {
        organization: sanitizeText(cleanString(body.organization || body.company)),
        role_title: sanitizeText(cleanString(body.role_title || body.role)),
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

      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('experience').update(updates).eq('id', id).select().single();
        if (error) return res.status(500).json({ error: error.message });
        await logAuditEvent(auth.user.email, 'EXPERIENCE_UPDATED', 'experience', { id });
        return res.status(200).json({ success: true, experience: data });
      }

      const idx = memoryStore.experience.findIndex((x) => x.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Item not found.' });
      memoryStore.experience[idx] = { ...memoryStore.experience[idx], ...updates };
      return res.status(200).json({ success: true, experience: memoryStore.experience[idx] });
    }

    if (method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!id) return res.status(400).json({ error: 'Item ID required.' });

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
  }

  // ============================================================================
  // 4. SKILLS (/api/cms/skills)
  // ============================================================================
  if (resource === 'skills') {
    if (method === 'GET') {
      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('skills').select('*').order('display_order', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ skills: data || [] });
      }
      return res.status(200).json({ skills: memoryStore.skills });
    }

    if (method === 'POST') {
      const body = req.body || {};
      const name = cleanString(body.name);
      if (!name) return res.status(400).json({ error: 'Skill name required.' });

      const icon_value = cleanString(body.icon_value || body.icon || name.toLowerCase());
      let icon_type = 'slug';
      if (icon_value.startsWith('<svg')) icon_type = 'svg';
      else if (/^(https?:|data:)/.test(icon_value)) icon_type = 'url';

      const newSkill = {
        tier: cleanString(body.tier) || 'now',
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
        await logAuditEvent(auth.user.email, 'SKILL_CREATED', 'skills', { name });
        return res.status(201).json({ success: true, skill: data });
      }

      newSkill.id = Date.now();
      memoryStore.skills.push(newSkill);
      await logAuditEvent(auth.user.email, 'SKILL_CREATED', 'skills', { name });
      return res.status(201).json({ success: true, skill: newSkill });
    }

    if (method === 'PUT') {
      const body = req.body || {};
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Skill ID required.' });

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

      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('skills').update(updates).eq('id', id).select().single();
        if (error) return res.status(500).json({ error: error.message });
        await logAuditEvent(auth.user.email, 'SKILL_UPDATED', 'skills', { id, name });
        return res.status(200).json({ success: true, skill: data });
      }

      const idx = memoryStore.skills.findIndex((s) => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Skill not found.' });
      memoryStore.skills[idx] = { ...memoryStore.skills[idx], ...updates };
      return res.status(200).json({ success: true, skill: memoryStore.skills[idx] });
    }

    if (method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!id) return res.status(400).json({ error: 'Skill ID required.' });

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
  }

  // ============================================================================
  // 5. PROFILE (/api/cms/profile)
  // ============================================================================
  if (resource === 'profile') {
    if (method === 'GET') {
      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('profile').select('*').eq('id', 1).maybeSingle();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ profile: data || memoryStore.profile });
      }
      return res.status(200).json({ profile: memoryStore.profile });
    }

    if (method === 'PUT') {
      const body = req.body || {};
      const name = cleanString(body.name);
      const email = cleanString(body.email);

      if (!name || name.length < 2) return res.status(400).json({ error: 'Name is required.' });
      if (!isValidEmail(email)) return res.status(400).json({ error: 'Valid email is required.' });

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
        logo_config: typeof body.logo_config === 'object' && body.logo_config !== null
          ? body.logo_config
          : (memoryStore.profile.logo_config || { preset: 'hex-ribbon' }),
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
  }

  // ============================================================================
  // 6. SOCIALS (/api/cms/socials)
  // ============================================================================
  if (resource === 'socials') {
    if (method === 'GET') {
      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('social_links').select('*').order('display_order', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ socials: data || [] });
      }
      return res.status(200).json({ socials: memoryStore.socials });
    }

    if (method === 'POST') {
      const body = req.body || {};
      const name = cleanString(body.name);
      const url = cleanString(body.url);
      if (!name || !url || !isValidUrl(url)) return res.status(400).json({ error: 'Valid platform name and URL required.' });

      const newSocial = {
        name: sanitizeText(name),
        url,
        icon: cleanString(body.icon || 'website'),
        show_hero: body.show_hero !== false && body.hero !== false,
        show_contact: body.show_contact !== false && body.contact !== false,
        display_order: Number(body.display_order) || 99,
        created_at: new Date().toISOString(),
      };

      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('social_links').insert([newSocial]).select().single();
        if (error) return res.status(500).json({ error: error.message });
        await logAuditEvent(auth.user.email, 'SOCIAL_CREATED', 'social_links', { name });
        return res.status(201).json({ success: true, social: data });
      }

      newSocial.id = Date.now();
      memoryStore.socials.push(newSocial);
      return res.status(201).json({ success: true, social: newSocial });
    }

    if (method === 'PUT') {
      const body = req.body || {};
      const id = Number(body.id);
      if (!id) return res.status(400).json({ error: 'Social ID required.' });

      const updates = {
        name: sanitizeText(cleanString(body.name)),
        url: cleanString(body.url),
        icon: cleanString(body.icon || 'website'),
        show_hero: body.show_hero !== false && body.hero !== false,
        show_contact: body.show_contact !== false && body.contact !== false,
      };

      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('social_links').update(updates).eq('id', id).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, social: data });
      }

      const idx = memoryStore.socials.findIndex((s) => s.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Social link not found.' });
      memoryStore.socials[idx] = { ...memoryStore.socials[idx], ...updates };
      return res.status(200).json({ success: true, social: memoryStore.socials[idx] });
    }

    if (method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!id) return res.status(400).json({ error: 'Social ID required.' });

      if (hasSupabaseConfig && supabase) {
        const { error } = await supabase.from('social_links').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true, message: 'Social deleted.' });
      }

      memoryStore.socials = memoryStore.socials.filter((s) => s.id !== id);
      return res.status(200).json({ success: true, message: 'Social deleted.' });
    }
  }

  // ============================================================================
  // 7. MESSAGES (/api/cms/messages)
  // ============================================================================
  if (resource === 'messages') {
    if (method === 'GET') {
      const statusFilter = req.query?.status;
      if (hasSupabaseConfig && supabase) {
        let query = supabase.from('messages').select('*').order('created_at', { ascending: false });
        if (statusFilter && ['unread', 'read', 'archived'].includes(statusFilter)) {
          query = query.eq('status', statusFilter);
        }
        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ messages: data || [] });
      }

      let list = memoryStore.messages;
      if (statusFilter && ['unread', 'read', 'archived'].includes(statusFilter)) {
        list = list.filter((m) => m.status === statusFilter);
      }
      return res.status(200).json({ messages: list });
    }

    if (method === 'PATCH') {
      const { id, status } = req.body || {};
      const messageId = Number(id);
      if (!messageId || !['unread', 'read', 'archived'].includes(status)) {
        return res.status(400).json({ error: 'Valid message ID and status required.' });
      }

      if (hasSupabaseConfig && supabase) {
        const { data, error } = await supabase.from('messages').update({ status }).eq('id', messageId).select().single();
        if (error) return res.status(500).json({ error: error.message });
        await logAuditEvent(auth.user.email, 'MESSAGE_STATUS_UPDATED', 'messages', { id: messageId, status });
        return res.status(200).json({ success: true, message: data });
      }

      const msg = memoryStore.messages.find((m) => m.id === messageId);
      if (!msg) return res.status(404).json({ error: 'Message not found.' });
      msg.status = status;
      return res.status(200).json({ success: true, message: msg });
    }

    if (method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!id) return res.status(400).json({ error: 'Message ID required.' });

      if (hasSupabaseConfig && supabase) {
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        await logAuditEvent(auth.user.email, 'MESSAGE_DELETED', 'messages', { id });
        return res.status(200).json({ success: true, message: 'Message deleted.' });
      }

      memoryStore.messages = memoryStore.messages.filter((m) => m.id !== id);
      return res.status(200).json({ success: true, message: 'Message deleted.' });
    }
  }

  // ============================================================================
  // 8. AUDIT LOGS (/api/cms/audit-logs)
  // ============================================================================
  if (resource === 'audit-logs') {
    if (method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const limit = Math.min(100, Math.max(1, Number(req.query?.limit) || 40));
    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ audit_logs: data || [] });
    }

    return res.status(200).json({ audit_logs: memoryStore.audit_logs.slice(0, limit) });
  }

  return res.status(404).json({ error: `Unknown CMS resource: ${resource}` });
}
