'use strict';
const { supabase } = require('../_lib/supabase');
const { requireAdmin } = require('../_lib/auth');
module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = supabase();
  const { data } = await db.from('devices').select('*').order('last_active_at', { ascending: false }).limit(100);
  return res.status(200).json({ users: data });
};
