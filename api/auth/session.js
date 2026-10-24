// ==============================================================================
// VERIFY ADMIN SESSION ENDPOINT (GET /api/auth/session)
// ==============================================================================
import { verifyAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAdmin(req);

  if (!auth.ok) {
    return res.status(auth.status || 401).json({
      authenticated: false,
      error: auth.error,
    });
  }

  return res.status(200).json({
    authenticated: true,
    user: auth.user,
  });
}
