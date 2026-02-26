// lib/db.js
const libsql = require('@libsql/client');

let client;

function getDB() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL
             || process.env.STORAGE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN
                   || process.env.STORAGE_AUTH_TOKEN;
    if (!url) throw new Error('TURSO_DATABASE_URL not set!');
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

  // All default config values including new OTA fields
  const defaults = [
    ['send_interval',   '60'],
    ['device_name',     'ESP32-Weather'],
    ['location',        'Home'],
    ['ota_available',   '0'],   // remote restart flag
    ['last_restart',    ''],
    ['firmware_ver',    '1.0.0'],
    ['ota_enabled',     '0'],   // NEW: enable/disable OTA update check
    ['firmware_latest', '1.0.0'], // NEW: latest firmware version number
    ['firmware_url',    ''],    // NEW: URL to download .bin file
    ['ota_check_interval', '15'], // NEW: check every N minutes
    ['last_ota_check',  ''],    // NEW: when ESP32 last checked
    ['last_ota_update', ''],    // NEW: when last update happened
  ];

  for (const [key, value] of defaults) {
    await db.execute({
      sql:  'INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)',
      args: [key, value]
    });
  }
}

module.exports = { getDB, initDB };
