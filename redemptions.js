'use strict';
const { supabase } = require('../_lib/supabase');
const { requireAdmin } = require('../_lib/auth');
module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = supabase();
  if (req.method === 'GET') {
    const { data } = await db.from('redemptions').select('*').order('created_at', { ascending: false });
    return res.status(200).json({ redemptions: data });
  }
  if (req.method === 'POST') {
    const { id, action, code } = req.body || {};
    const status = action === 'approve' ? 'approved' : action === 'paid' ? 'paid' : 'rejected';
    await db.from('redemptions').update({ status, decided_at: new Date().toISOString(), code }).eq('id', id);
    return res.status(200).json({ success: true });
  }
};
