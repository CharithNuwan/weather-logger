// lib/db.js — Turso database connection
import { createClient } from '@libsql/client';

let client = null;

export function getDB() {
  if (!client) {
    const hasUrl = Boolean(process.env.TURSO_DATABASE_URL);
    const hasToken = Boolean(process.env.TURSO_AUTH_TOKEN);
    console.log('[db] createClient: TURSO_DATABASE_URL present:', hasUrl, 'TURSO_AUTH_TOKEN present:', hasToken);
    if (!hasUrl || !hasToken) {
      console.error('[db] missing env: TURSO_DATABASE_URL=', hasUrl, 'TURSO_AUTH_TOKEN=', hasToken);
    }
    client = createClient({
      url:       process.env.TURSO_DATABASE_URL,       // set by Turso + Vercel integration
      authToken: process.env.TURSO_AUTH_TOKEN, // set by Turso + Vercel integration
    });
    console.log('[db] createClient done');
  }
  return client;
}

// Initialize tables if not exist
export async function initDB() {
  try {
    console.log('[db] initDB start');
    const db = getDB();

    // Weather data table
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

    // Config table — stores settings changeable from web!
    await db.execute(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `);

    // Default config values
    await db.execute(`
    INSERT OR IGNORE INTO config (key, value) VALUES
      ('send_interval', '60'),
      ('device_name',   'ESP32-Weather'),
      ('location',      'Home'),
      ('ota_available', '0'),
      ('last_restart',  ''),
      ('firmware_ver',  '1.0.0')
  `);
    console.log('[db] initDB done');
  } catch (err) {
    console.error('[db] initDB error:', err?.message || err);
    console.error('[db] stack:', err?.stack);
    throw err;
  }
}
