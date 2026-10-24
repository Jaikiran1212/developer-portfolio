// ==============================================================================
// CMS DASHBOARD STATS ENDPOINT (GET /api/cms/dashboard)
// Protected: Admin authorization required
// ==============================================================================
import { verifyAdmin, logAuditEvent } from '../_lib/auth.js';
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  if (req.method !== 'GET') {
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

  // Fallback memory counts
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
