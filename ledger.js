'use strict';
const { supabase } = require('./_lib/supabase');
const { requireAppKey } = require('./_lib/auth');
const { loadConfig } = require('./_lib/config');
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (!requireAppKey(req, res)) return;
  const { device_id } = req.query;
  const db = supabase();
  const { data: device } = await db.from('devices').select('*').eq('device_id', device_id).maybeSingle();
  if (!device) return res.status(404).json({ error: 'unknown device' });
  const config = await loadConfig(db);
  return res.status(200).json({
    device: { points_balance: Number(device.points_balance), streak: device.streak, multiplier: Number(device.multiplier), threshold: config.threshold_points, can_redeem: Number(device.points_balance) >= config.threshold_points }
  });
};
