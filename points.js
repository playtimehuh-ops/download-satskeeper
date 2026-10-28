'use strict';
const DAY_MS = 86400000;
function multiplierForStreak(streak) {
  if (streak >= 30) return 1.5;
  if (streak >= 7) return 1.25;
  return 1.0;
}
function applyStreak(device, now = Date.now()) {
  const last = device.last_active_at ? new Date(device.last_active_at).getTime() : null;
  let streak = Number(device.streak) || 0;
  if (last === null) streak = 1;
  else {
    const gap = now - last;
    if (gap >= 7 * DAY_MS) streak = 1;
    else if (gap >= DAY_MS) streak += 1;
  }
  return { streak, multiplier: multiplierForStreak(streak) };
}
function pointsForRevenue({ revenueCents, payoutPct, pointsPerCent, multiplier }) {
  return Math.round(revenueCents * payoutPct * pointsPerCent * multiplier * 100) / 100;
}
module.exports = { DAY_MS, multiplierForStreak, applyStreak, pointsForRevenue };
