'use strict';
const { supabase } = require('./_lib/supabase');
const { requireAppKey } = require('./_lib/auth');
const { applyStreak } = require('./_lib/points');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!requireAppKey(req, res)) return;
  const { device_id } = req.body || {};
  const db = supabase();
  const { data: device } = await db.from('devices').select('*').eq('device_id', device_id).maybeSingle();
  if (!device) return res.status(404).json({ error: 'unknown device' });
  const { streak, multiplier } = applyStreak(device);
  const { data, error } = await db.from('devices').update({ streak, multiplier, last_active_at: new Date().toISOString() }).eq('device_id', device_id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ device: data });
};
