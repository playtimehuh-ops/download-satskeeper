'use strict';
const crypto = require('crypto');
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
function requireAppKey(req, res) {
  const expected = process.env.APP_KEY;
  if (!expected) return res.status(500).json({ error: 'APP_KEY not configured' }), false;
  const provided = req.headers['x-app-key'];
  if (!provided || !safeEqual(provided, expected)) return res.status(401).json({ error: 'invalid app key' }), false;
  return true;
}
function requireAdmin(req, res) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) return res.status(500).json({ error: 'ADMIN not configured' }), false;
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.setHeader('WWW-Authenticate', 'Basic realm="SatsKeeper Admin", charset="UTF-8"');
    return res.status(401).json({ error: 'auth required' }), false;
  }
  const decoded = Buffer.from(encoded, 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (!safeEqual(decoded.slice(0, separator), user) || !safeEqual(decoded.slice(separator + 1), pass)) {
    res.setHeader('WWW-Authenticate', 'Basic realm="SatsKeeper Admin", charset="UTF-8"');
    return res.status(401).json({ error: 'invalid auth' }), false;
  }
  return true;
}
module.exports = { requireAppKey, requireAdmin };
