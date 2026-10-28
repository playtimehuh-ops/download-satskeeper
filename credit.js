'use strict';
const { supabase } = require('../_lib/supabase');
const { requireAdmin } = require('../_lib/auth');
const { loadConfig } = require('../_lib/config');
const { pointsForRevenue } = require('../_lib/points');
module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { device_id, period, revenue_cents } = req.body || {};
  const db = supabase();
  const config = await loadConfig(db);
  const { data: device } = await db.from('devices').select('multiplier').eq('device_id', device_id).maybeSingle();
  if (!device) return res.status(404).json({ error: 'device not found' });
  const points = pointsForRevenue({ revenueCents: revenue_cents, payoutPct: config.payout_pct, pointsPerCent: config.points_per_cent, multiplier: Number(device.multiplier) });
  await db.from('revenue_events').insert({ device_id, period, revenue_cents, points_awarded: points });
  await db.rpc('add_points', { p_device_id: device_id, p_delta: points });
  return res.status(200).json({ success: true, points_awarded: points });
};
