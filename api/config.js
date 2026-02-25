// api/config.js — get and update ESP32 settings
const { getDB, initDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initDB();
    const db = getDB();

    if (req.method === 'GET') {
      const rows = await db.execute('SELECT key, value FROM config');
      const config = {};
      rows.rows.forEach(r => { config[r[0] || r.key] = r[1] || r.value; });
      return res.status(200).json({ status: 'ok', config });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) { body = {}; }
      }
      body = body || {};

      const allowed = ['send_interval','device_name','location','ota_available','firmware_ver'];

      for (const [key, value] of Object.entries(body)) {
        if (!allowed.includes(key)) continue;
        await db.execute({
          sql:  'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: [key, String(value)]
        });
      }

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

      return res.status(200).json({ status: 'ok', updated: true });
    }

    return res.status(405).json({ status: 'error', msg: 'Method not allowed' });

  } catch (err) {
    console.error('[config] Error:', err.message);
    return res.status(500).json({ status: 'error', msg: err.message });
  }
};
