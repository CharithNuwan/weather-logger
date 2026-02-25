# ESP32 Weather Logger — Vercel + Turso

## Files
```
weather-app/
├── api/
│   ├── save.js      ← ESP32 sends data here
│   ├── data.js      ← chart data API
│   ├── config.js    ← settings API
│   └── page.js      ← all dashboard pages
├── lib/
│   └── db.js        ← Turso database
├── package.json
├── vercel.json
└── esp32_weather.ino ← upload to ESP32
```

## Setup Steps

### Step 1 — Turso Database (free)
1. Go to https://turso.tech → Sign up free
2. Create database: `weather-logger`
3. Copy: Database URL (starts with libsql://)
4. Create token: Settings → API Tokens → Create
5. Copy the auth token

### Step 2 — GitHub
1. Create new repository: `weather-logger`
2. Upload all files from weather-app folder
3. Push to GitHub

### Step 3 — Vercel
1. Go to https://vercel.com → Sign in with GitHub
2. New Project → Import your `weather-logger` repo
3. Add Environment Variables:
   - TURSO_DATABASE_URL = libsql://your-db.turso.io
   - TURSO_AUTH_TOKEN   = your-token-here
4. Click Deploy!
5. Copy your URL: https://weather-logger-xxx.vercel.app

### Step 4 — ESP32
1. Open esp32_weather.ino in Arduino IDE
2. Change serverURL to your Vercel URL
3. Change WiFi ssid and password
4. Install libraries:
   - Adafruit BME280
   - Adafruit Unified Sensor
   - ArduinoJson
   - ArduinoOTA (built in)
5. Upload via USB
6. Open Serial Monitor 115200 baud
7. Watch data sending!

## Pages
- /          → Live dashboard
- /patterns  → Pattern charts
- /summary   → Daily summary
- /predict   → Weather predictions
- /settings  → Remote ESP32 settings + restart

## Remote Restart
1. Open /settings from anywhere in world
2. Change send interval or device name
3. Click Save — ESP32 gets new settings on next send!
4. Click Restart — ESP32 restarts on next send!

## OTA Update
```
Arduino IDE → Sketch → Upload via OTA
Port: ESP32-Weather (appears in network ports)
Password: esp32ota
```
Works from anywhere on same WiFi network!

## BME280 Wiring
```
BME280    ESP32
──────────────────
VCC   →   3.3V
GND   →   GND
SDA   →   GPIO21
SCL   →   GPIO22
```
