'use strict';
const DEFAULTS = { payout_pct: 0.5, points_per_cent: 1, points_per_dollar: 100, threshold_points: 2500 };
function envNumber(name, fallback) { const raw = process.env[name]; return raw ? Number(raw) : fallback; }
async function loadConfig(db) {
  const cfg = {
    payout_pct: envNumber('PAYOUT_PCT', DEFAULTS.payout_pct),
    points_per_cent: envNumber('POINTS_PER_CENT', DEFAULTS.points_per_cent),
    points_per_dollar: envNumber('POINTS_PER_DOLLAR', DEFAULTS.points_per_dollar),
    threshold_points: envNumber('THRESHOLD_POINTS', DEFAULTS.threshold_points),
  };
  try {
    const { data } = await db.from('config').select('key,value');
    for (const row of data || []) {
      if (row.key in cfg) { const parsed = Number(row.value); if (Number.isFinite(parsed)) cfg[row.key] = parsed; }
    }
  } catch {}
  return cfg;
}
module.exports = { loadConfig, DEFAULTS };
