'use strict';
const { supabase } = require('./_lib/supabase');
const { requireAppKey } = require('./_lib/auth');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!requireAppKey(req, res)) return;
  const { device_id, opted_in, consent_version } = req.body || {};
  if (!device_id) return res.status(400).json({ error: 'device_id required' });
  const db = supabase();
  const now = new Date().toISOString();
  const row = { device_id, opted_in, consent_at: opted_in ? now : null, consent_version: opted_in ? (consent_version || 'v1') : null, last_active_at: now };
  const { data, error } = await db.from('devices').upsert(row, { onConflict: 'device_id' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ device: data });
};
