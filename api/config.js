// api/config.js
const { getDB, initDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDB();
    const db = getDB();

    if (req.method === 'GET') {
      const rows = await db.execute('SELECT key, value FROM config');
      const config = {};
      rows.rows.forEach(r => { config[r.key || r[0]] = r.value || r[1]; });
      return res.status(200).json({ status: 'ok', config });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) { body = {}; }
      }
      body = body || {};

      const allowed = [
        'send_interval', 'device_name', 'location',
        'ota_available', 'firmware_ver',
        'ota_enabled', 'firmware_latest', 'firmware_url',
        'ota_check_interval'
      ];

      for (const [key, value] of Object.entries(body)) {
        if (!allowed.includes(key)) continue;
        await db.execute({
          sql:  'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: [key, String(value)]
        });
      }

      // Remote restart
      if (body.restart) {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['ota_available', '1']
        });
        await db.execute({
          sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['last_restart', new Date().toISOString()]
        });
      }

      if (body.clear_restart) {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['ota_available', '0']
        });
      }

      // Track when OTA check happened
      if (body.ota_checked) {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['last_ota_check', new Date().toISOString()]
        });
      }

      // Track when OTA update happened
      if (body.ota_updated) {
        await db.execute({
          sql: 'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['last_ota_update', new Date().toISOString()]
        });
      }

      return res.status(200).json({ status: 'ok', updated: true });
    }

    return res.status(405).json({ status: 'error', msg: 'Method not allowed' });

  } catch (err) {
    console.error('[config] Error:', err.message);
    return res.status(500).json({ status: 'error', msg: err.message });
  }
};
