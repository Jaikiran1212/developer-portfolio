// ==============================================================================
// CMS CONTACT MESSAGES ENDPOINT (api/cms/messages.js)
// Protected: Admin authorization strictly required
// ==============================================================================
import { verifyAdmin, logAuditEvent } from '../_lib/auth.js';
import { supabase, hasSupabaseConfig, memoryStore } from '../_lib/supabase.js';

export default async function handler(req, res) {
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  const { method } = req;

  // 1. GET: Fetch messages
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

  // 2. PATCH: Update message status (read / unread / archived)
  if (method === 'PATCH') {
    const { id, status } = req.body || {};
    const messageId = Number(id);

    if (!messageId || !['unread', 'read', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Valid message ID and status (unread, read, archived) required.' });
    }

    if (hasSupabaseConfig && supabase) {
      const { data, error } = await supabase
        .from('messages')
        .update({ status })
        .eq('id', messageId)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'MESSAGE_STATUS_UPDATED', 'messages', { id: messageId, status });
      return res.status(200).json({ success: true, message: data });
    }

    const msg = memoryStore.messages.find((m) => m.id === messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    msg.status = status;
    await logAuditEvent(auth.user.email, 'MESSAGE_STATUS_UPDATED', 'messages', { id: messageId, status });
    return res.status(200).json({ success: true, message: msg });
  }

  // 3. DELETE: Delete message
  if (method === 'DELETE') {
    const id = Number(req.query?.id || req.body?.id);
    if (!id) return res.status(400).json({ error: 'Message ID is required.' });

    if (hasSupabaseConfig && supabase) {
      const { error } = await supabase.from('messages').delete().eq('id', id);
      if (error) return res.status(500).json({ error: error.message });
      await logAuditEvent(auth.user.email, 'MESSAGE_DELETED', 'messages', { id });
      return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
    }

    memoryStore.messages = memoryStore.messages.filter((m) => m.id !== id);
    await logAuditEvent(auth.user.email, 'MESSAGE_DELETED', 'messages', { id });
    return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
