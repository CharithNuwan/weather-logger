// api/save.js — ESP32 sends data here
const { getDB, initDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    await initDB();
    const db = getDB();

    const { temp, humidity, pressure, altitude } = req.query;

    if (!temp || !humidity || !pressure || !altitude) {
      return res.status(400).json({ status: 'error', msg: 'Missing fields' });
    }

    await db.execute({
      sql:  `INSERT INTO weather_data (temp, humidity, pressure, altitude) VALUES (?, ?, ?, ?)`,
      args: [parseFloat(temp), parseFloat(humidity), parseFloat(pressure), parseFloat(altitude)]
    });

    // Get config to send back to ESP32
    const configRows = await db.execute('SELECT key, value FROM config');
    const config = {};
    configRows.rows.forEach(r => { config[r[0] || r.key] = r[1] || r.value; });

    return res.status(200).json({
      status:        'ok',
      saved:         true,
      send_interval: parseInt(config.send_interval || 60),
      device_name:   config.device_name || 'ESP32-Weather',
      restart:       config.ota_available === '1',
      time:          new Date().toISOString()
    });

  } catch (err) {
    console.error('[save] Error:', err.message);
    return res.status(500).json({ status: 'error', msg: err.message });
  }
};
