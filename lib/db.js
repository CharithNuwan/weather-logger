const libsql = require('@libsql/client');

// Singleton — create once, reuse! (required for Vercel serverless)
let client;

function getDB() {
  if (!client) {
    // Try all possible env variable names
    const url = process.env.TURSO_DATABASE_URL
             || process.env.STORAGE_URL
             || process.env.DATABASE_URL;

    const authToken = process.env.TURSO_AUTH_TOKEN
                   || process.env.STORAGE_AUTH_TOKEN
                   || process.env.DATABASE_AUTH_TOKEN;

    if (!url) {
      throw new Error(
        'No DB URL found! Add TURSO_DATABASE_URL to Vercel Environment Variables!'
      );
    }

    client = libsql.createClient({ url, authToken: authToken || undefined });
  }
  return client;
}

async function initDB() {
  const db = getDB();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS weather_data (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      temp        REAL,
      humidity    REAL,
      pressure    REAL,
      altitude    REAL,
      recorded_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  const defaults = [
    ['send_interval', '60'],
    ['device_name',   'ESP32-Weather'],
    ['location',      'Home'],
    ['ota_available', '0'],
    ['last_restart',  ''],
    ['firmware_ver',  '1.0.0']
  ];

  for (const [key, value] of defaults) {
    await db.execute({
      sql:  'INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)',
      args: [key, value]
    });
  }
}

module.exports = { getDB, initDB };
