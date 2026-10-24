// ==============================================================================
// ADMIN LOGOUT ENDPOINT (POST /api/auth/logout)
// ==============================================================================
import { supabase, hasSupabaseConfig } from '../_lib/supabase.js';
import { extractBearerToken, logAuditEvent } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = extractBearerToken(req);

  if (hasSupabaseConfig && supabase && token) {
    try {
      await supabase.auth.admin?.signOut(token);
    } catch {
      // Ignored
    }
  }

  await logAuditEvent('admin', 'LOGOUT', 'auth');

  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}
