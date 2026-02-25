// api/config.js — get and update ESP32 settings from web
import { getDB, initDB } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  console.log('[config] request method:', req.method);

  try {
    await initDB();
    const db = getDB();

    // GET — return all config
    if (req.method === 'GET') {
      const rows = await db.execute('SELECT key, value FROM config');
      const config = {};
      rows.rows.forEach(r => { config[r.key] = r.value; });
      return res.status(200).json({ status: 'ok', config });
    }

    // POST — update config from web dashboard
    if (req.method === 'POST') {
      const body = typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body;

      const allowed = [
        'send_interval','device_name','location',
        'ota_available','firmware_ver'
      ];

      for (const [key, value] of Object.entries(body)) {
        if (!allowed.includes(key)) continue;
        await db.execute({
          sql:  'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: [key, String(value)]
        });
      }

      // If OTA requested — mark for restart
      if (body.restart) {
        await db.execute({
          sql:  'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['ota_available', '1']
        });
        await db.execute({
          sql:  'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
          args: ['last_restart', new Date().toISOString()]
        });
      }

      return res.status(200).json({ status: 'ok', updated: true });
    }

    return res.status(405).json({ status: 'error', msg: 'Method not allowed' });

  } catch (err) {
    console.error('[config] error:', err?.message || err);
    console.error('[config] stack:', err?.stack);
    return res.status(500).json({ status: 'error', msg: err.message });
  }
}
