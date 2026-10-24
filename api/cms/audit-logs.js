// ==============================================================================
// CMS AUDIT LOGS ENDPOINT (api/cms/audit-logs.js)
// Protected: Admin authorization required
// ==============================================================================
import { verifyAdmin } from '../_lib/auth.js';
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

  return res.status(200).json({
    audit_logs: memoryStore.audit_logs.slice(0, limit),
  });
}
