'use strict';
const { supabase } = require('../_lib/supabase');
const { requireAdmin } = require('../_lib/auth');
module.exports = async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const db = supabase();
  const { data: devices } = await db.from('devices').select('opted_in');
  const { data: revenue } = await db.from('revenue_events').select('revenue_cents');
  const { data: redemptions } = await db.from('redemptions').select('value_cents').in('status', ['paid', 'approved']);
  const revTotal = (revenue || []).reduce((sum, r) => sum + r.revenue_cents, 0);
  const paidTotal = (redemptions || []).reduce((sum, r) => sum + r.value_cents, 0);
  return res.status(200).json({ total_devices: devices?.length || 0, opted_in: devices?.filter(d => d.opted_in).length || 0, revenue_cents: revTotal, paid_cents: paidTotal, profit_cents: revTotal - paidTotal });
};
