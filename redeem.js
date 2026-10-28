'use strict';
const { supabase } = require('./_lib/supabase');
const { requireAppKey } = require('./_lib/auth');
const { loadConfig } = require('./_lib/config');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!requireAppKey(req, res)) return;
  const { device_id } = req.body || {};
  const db = supabase();
  const config = await loadConfig(db);
  const { data: success, error } = await db.rpc('spend_points', { p_device_id: device_id, p_points: config.threshold_points });
  if (error || !success) return res.status(400).json({ error: 'Insufficient points' });
  await db.from('redemptions').insert({ device_id, points_spent: config.threshold_points, value_cents: 2500 });
  return res.status(200).json({ status: 'pending' });
};
