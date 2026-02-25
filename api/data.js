// api/data.js — fetch weather data for charts
const { getDB, initDB } = require('../lib/db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    await initDB();
    const db   = getDB();
    const type = req.query.type || 'latest';

    if (type === 'latest') {
      const row = await db.execute('SELECT * FROM weather_data ORDER BY id DESC LIMIT 1');
      return res.status(200).json({ status: 'ok', data: row.rows[0] || null });
    }

    if (type === 'recent') {
      const limit = parseInt(req.query.limit || 50);
      const rows  = await db.execute({ sql: 'SELECT * FROM weather_data ORDER BY id DESC LIMIT ?', args: [limit] });
      return res.status(200).json({ status: 'ok', data: [...rows.rows].reverse() });
    }

    if (type === 'today') {
      const rows = await db.execute(`
        SELECT
          MIN(temp) as min_temp, MAX(temp) as max_temp, AVG(temp) as avg_temp,
          MIN(humidity) as min_hum, MAX(humidity) as max_hum, AVG(humidity) as avg_hum,
          MIN(pressure) as min_pres, MAX(pressure) as max_pres, AVG(pressure) as avg_pres,
          AVG(altitude) as avg_alt, COUNT(*) as total_readings,
          MIN(recorded_at) as first_reading, MAX(recorded_at) as last_reading
        FROM weather_data WHERE DATE(recorded_at) = DATE('now')
      `);
      return res.status(200).json({ status: 'ok', data: rows.rows[0] || null });
    }

    if (type === 'hourly') {
      const rows = await db.execute(`
        SELECT strftime('%H', recorded_at) as hour,
          AVG(temp) as avg_temp, AVG(humidity) as avg_hum,
          AVG(pressure) as avg_pres, COUNT(*) as readings
        FROM weather_data WHERE DATE(recorded_at) = DATE('now')
        GROUP BY strftime('%H', recorded_at) ORDER BY hour ASC
      `);
      return res.status(200).json({ status: 'ok', data: rows.rows });
    }

    if (type === 'weekly') {
      const rows = await db.execute(`
        SELECT DATE(recorded_at) as date,
          AVG(temp) as avg_temp, MIN(temp) as min_temp, MAX(temp) as max_temp,
          AVG(humidity) as avg_hum, AVG(pressure) as avg_pres, COUNT(*) as readings
        FROM weather_data WHERE recorded_at >= DATE('now', '-7 days')
        GROUP BY DATE(recorded_at) ORDER BY date ASC
      `);
      return res.status(200).json({ status: 'ok', data: rows.rows });
    }

    if (type === 'pattern_hour') {
      const rows = await db.execute(`
        SELECT CAST(strftime('%H', recorded_at) AS INTEGER) as hour,
          AVG(temp) as avg_temp, AVG(humidity) as avg_hum,
          AVG(pressure) as avg_pres, COUNT(*) as readings
        FROM weather_data GROUP BY strftime('%H', recorded_at) ORDER BY hour ASC
      `);
      return res.status(200).json({ status: 'ok', data: rows.rows });
    }

    if (type === 'stats') {
      const rows = await db.execute(`
        SELECT COUNT(*) as total, MIN(recorded_at) as first, MAX(recorded_at) as last,
          MIN(temp) as all_min_temp, MAX(temp) as all_max_temp, AVG(temp) as all_avg_temp,
          MIN(humidity) as all_min_hum, MAX(humidity) as all_max_hum,
          MIN(pressure) as all_min_pres, MAX(pressure) as all_max_pres
        FROM weather_data
      `);
      return res.status(200).json({ status: 'ok', data: rows.rows[0] || null });
    }

    return res.status(400).json({ status: 'error', msg: 'Unknown type' });

  } catch (err) {
    console.error('[data] Error:', err.message);
    return res.status(500).json({ status: 'error', msg: err.message });
  }
};
