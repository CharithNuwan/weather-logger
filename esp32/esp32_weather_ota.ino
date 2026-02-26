// ============================================================
// ESP32 BME280 Weather Logger — WITH REMOTE OTA UPDATE!
// 
// New features:
//   - Checks Vercel every 15min for new firmware
//   - Downloads + installs automatically!
//   - Enable/disable from web settings page
//   - Works without BME280 (sends zeros)
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>       // ← OTA pull update!
#include <ArduinoOTA.h>       // ← OTA push (same network)
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>
#include <Preferences.h>

// ==========================================
// CHANGE THESE ONLY!
// ==========================================
const char* ssid      = "Home_SLink2.4G";
const char* password  = "Cha@7550_CCV";
const char* otaName   = "ESP32-Weather";
const char* otaPass   = "esp32ota";
const char* serverURL = "https://weather-logger-c1.vercel.app";

// Current firmware version — INCREASE when you update!
// Must match what you set in Settings page!
const char* FIRMWARE_VERSION = "1.0.0";
// ==========================================

#define SEA_LEVEL_HPA 1004.8
#define LED_PIN       2

Adafruit_BME280 bme;
Preferences     prefs;

// ── STATE ─────────────────────────────────
bool bmeConnected = false;

// ── SETTINGS ──────────────────────────────
int  sendInterval    = 60;    // data send interval (seconds)
int  otaCheckMinutes = 15;    // OTA check interval (minutes)
bool otaEnabled      = false; // from server settings

// ── TIMING ────────────────────────────────
unsigned long lastSend     = 0;
unsigned long lastOTACheck = 0;
unsigned long lastBMERetry = 0;

// ── STATS ─────────────────────────────────
int   totalSends  = 0;
int   failedSends = 0;
float lastTemp     = 0;
float lastHumidity = 0;
float lastPressure = 0;
float lastAltitude = 0;

// ==========================================
// FLASH SETTINGS
// ==========================================
void saveSettings() {
  prefs.begin("weather", false);
  prefs.putInt("interval",    sendInterval);
  prefs.putInt("otaMinutes",  otaCheckMinutes);
  prefs.putBool("otaEnabled", otaEnabled);
  prefs.end();
}

void loadSettings() {
  prefs.begin("weather", true);
  sendInterval    = prefs.getInt("interval",    60);
  otaCheckMinutes = prefs.getInt("otaMinutes",  15);
  otaEnabled      = prefs.getBool("otaEnabled", false);
  prefs.end();
  Serial.printf("[PREFS] interval=%ds otaCheck=%dmin otaEnabled=%s\n",
    sendInterval, otaCheckMinutes, otaEnabled ? "YES" : "NO");
}

// ==========================================
// WIFI
// ==========================================
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
    if (++attempts > 40) { Serial.println("\n[WiFi] Failed!"); ESP.restart(); }
  }
  Serial.println("\n[WiFi] Connected! IP: " + WiFi.localIP().toString());
}

// ==========================================
// LOCAL OTA (same network — Arduino IDE)
// ==========================================
void setupLocalOTA() {
  ArduinoOTA.setHostname(otaName);
  ArduinoOTA.setPassword(otaPass);
  ArduinoOTA.onStart([]()   { Serial.println("[OTA-Local] Starting..."); });
  ArduinoOTA.onEnd([]()     { Serial.println("[OTA-Local] Done!"); });
  ArduinoOTA.onProgress([](unsigned int p, unsigned int t) {
    Serial.printf("[OTA-Local] %u%%\r", p / (t / 100));
  });
  ArduinoOTA.onError([](ota_error_t e) {
    Serial.printf("[OTA-Local] Error %u\n", e);
  });
  ArduinoOTA.begin();
  Serial.println("[OTA-Local] Ready! Use Arduino IDE on same WiFi");
}

// ==========================================
// REMOTE OTA CHECK — from anywhere in world!
// Checks Vercel for new firmware version
// ==========================================
void checkRemoteOTA() {
  if (!otaEnabled) {
    Serial.println("[OTA-Remote] Disabled — skipping check");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) return;

  Serial.println("[OTA-Remote] Checking for updates...");
  Serial.printf("[OTA-Remote] Current version: %s\n", FIRMWARE_VERSION);

  // Ask server: is there a newer version?
  String url = String(serverURL) + "/api/firmware?version=" + FIRMWARE_VERSION;

  HTTPClient http;
  http.begin(url);
  http.setTimeout(8000);
  int code = http.GET();

  if (code != 200) {
    Serial.printf("[OTA-Remote] Check failed! Code: %d\n", code);
    http.end();
    return;
  }

  String response = http.getString();
  http.end();
  Serial.println("[OTA-Remote] Response: " + response);

  // Parse response
  StaticJsonDocument<400> doc;
  if (deserializeJson(doc, response)) {
    Serial.println("[OTA-Remote] JSON parse failed!");
    return;
  }

  bool   update  = doc["update"]  | false;
  String newVer  = doc["version"] | "";
  String binUrl  = doc["url"]     | "";

  // Tell server we checked
  notifyOTAChecked();

  if (!update) {
    Serial.printf("[OTA-Remote] Already up to date! v%s is latest.\n", FIRMWARE_VERSION);
    return;
  }

  // NEW VERSION AVAILABLE!
  Serial.printf("[OTA-Remote] NEW VERSION: v%s → v%s\n", FIRMWARE_VERSION, newVer.c_str());
  Serial.println("[OTA-Remote] URL: " + binUrl);
  Serial.println("[OTA-Remote] Downloading and installing...");

  // Blink fast to show update starting
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_PIN, HIGH); delay(100);
    digitalWrite(LED_PIN, LOW);  delay(100);
  }

  // ── DOWNLOAD AND INSTALL FIRMWARE ──
  // This replaces the firmware and restarts!
  WiFiClientSecure client;
  client.setInsecure(); // for HTTPS without cert verification

  t_httpUpdate_return ret = httpUpdate.update(client, binUrl);

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("[OTA-Remote] FAILED! Error %d: %s\n",
        httpUpdate.getLastError(),
        httpUpdate.getLastErrorString().c_str());
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("[OTA-Remote] No updates available");
      break;

    case HTTP_UPDATE_OK:
      // This line never reached — ESP32 restarts automatically!
      Serial.println("[OTA-Remote] SUCCESS! Restarting...");
      notifyOTAUpdated();
      break;
  }
}

// Tell server OTA check happened
void notifyOTAChecked() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(serverURL) + "/api/config");
  http.addHeader("Content-Type", "application/json");
  http.POST("{\"ota_checked\":true}");
  http.end();
}

// Tell server OTA update happened
void notifyOTAUpdated() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  http.begin(String(serverURL) + "/api/config");
  http.addHeader("Content-Type", "application/json");
  http.POST("{\"ota_updated\":true}");
  http.end();
}

// ==========================================
// BME280
// ==========================================
bool tryConnectBME() {
  Wire.begin();
  if (bme.begin(0x76)) { Serial.println("[BME] Found at 0x76 ✅"); bmeConnected = true; return true; }
  if (bme.begin(0x77)) { Serial.println("[BME] Found at 0x77 ✅"); bmeConnected = true; return true; }
  Serial.println("[BME] Not found — will retry. Sending zeros.");
  bmeConnected = false;
  return false;
}

bool readBME() {
  if (!bmeConnected) {
    lastTemp = lastHumidity = lastPressure = lastAltitude = 0.0;
    return true;
  }
  float t = bme.readTemperature();
  float h = bme.readHumidity();
  float p = bme.readPressure() / 100.0F;
  float a = bme.readAltitude(SEA_LEVEL_HPA);
  if (isnan(t) || isnan(h) || isnan(p)) {
    lastTemp = lastHumidity = lastPressure = lastAltitude = 0.0;
    return true;
  }
  lastTemp = t; lastHumidity = h; lastPressure = p; lastAltitude = a;
  return true;
}

// ==========================================
// SEND DATA
// ==========================================
bool sendData() {
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = String(serverURL) + "/api/save";
  url += "?temp="     + String(lastTemp, 2);
  url += "&humidity=" + String(lastHumidity, 2);
  url += "&pressure=" + String(lastPressure, 2);
  url += "&altitude=" + String(lastAltitude, 2);
  url += "&sensor="   + String(bmeConnected ? 1 : 0);
  url += "&version="  + String(FIRMWARE_VERSION);
  url += "&uptime="   + String(millis() / 1000);
  url += "&rssi="     + String(WiFi.RSSI());

  Serial.println("[HTTP] Sending data...");

  HTTPClient http;
  http.begin(url);
  http.setTimeout(8000);
  int code = http.GET();

  if (code == 200) {
    String resp = http.getString();
    http.end();
    totalSends++;

    StaticJsonDocument<300> doc;
    if (!deserializeJson(doc, resp)) {
      // Update interval if changed
      int newInterval = doc["send_interval"] | sendInterval;
      if (newInterval != sendInterval) {
        sendInterval = newInterval;
        saveSettings();
        Serial.printf("[CONFIG] Interval → %ds\n", sendInterval);
      }
      // Remote restart
      if (doc["restart"] | false) {
        Serial.println("[CONFIG] Restart command! Restarting...");
        delay(1000);
        ESP.restart();
      }
    }

    // Quick blink = success
    digitalWrite(LED_PIN, HIGH); delay(80); digitalWrite(LED_PIN, LOW);
    return true;

  } else {
    http.end();
    failedSends++;
    Serial.printf("[HTTP] Failed! Code: %d\n", code);
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH); delay(100);
      digitalWrite(LED_PIN, LOW);  delay(100);
    }
    return false;
  }
}

// ==========================================
// CHECK OTA SETTINGS FROM SERVER
// Called less frequently to sync settings
// ==========================================
void syncOTASettings() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(String(serverURL) + "/api/config");
  http.setTimeout(5000);
  int code = http.GET();
  if (code != 200) { http.end(); return; }

  String resp = http.getString();
  http.end();

  StaticJsonDocument<600> doc;
  if (deserializeJson(doc, resp)) return;

  JsonObject config = doc["config"];
  if (config.isNull()) return;

  // Sync OTA settings
  const char* enabled  = config["ota_enabled"]        | "0";
  const char* interval = config["ota_check_interval"] | "15";
  const char* fwVer    = config["firmware_ver"]       | FIRMWARE_VERSION;

  bool newOtaEnabled = (String(enabled) == "1");
  int  newOtaMinutes = String(interval).toInt();

  if (newOtaEnabled != otaEnabled || newOtaMinutes != otaCheckMinutes) {
    otaEnabled      = newOtaEnabled;
    otaCheckMinutes = newOtaMinutes > 0 ? newOtaMinutes : 15;
    saveSettings();
    Serial.printf("[CONFIG] OTA enabled=%s checkEvery=%dmin\n",
      otaEnabled ? "YES" : "NO", otaCheckMinutes);
  }
}

// ==========================================
// PRINT STATUS
// ==========================================
void printStatus() {
  Serial.println("\n╔══════════════════════════════════╗");
  if (bmeConnected) {
    Serial.printf("║  Temp:     %.1f °C\n",  lastTemp);
    Serial.printf("║  Humidity: %.1f %%\n",  lastHumidity);
    Serial.printf("║  Pressure: %.1f hPa\n", lastPressure);
    Serial.printf("║  Altitude: %.1f m\n",   lastAltitude);
  } else {
    Serial.println("║  ⚠️  BME280 NOT CONNECTED");
  }
  Serial.println("║──────────────────────────────────║");
  Serial.printf("║  Version:  %s\n",          FIRMWARE_VERSION);
  Serial.printf("║  Sends:    %d ok %d fail\n", totalSends, failedSends);
  Serial.printf("║  Interval: %ds\n",           sendInterval);
  Serial.printf("║  OTA:      %s (%dmin)\n",    otaEnabled ? "ON" : "OFF", otaCheckMinutes);
  Serial.printf("║  Uptime:   %lus\n",           millis() / 1000);
  Serial.printf("║  RSSI:     %d dBm\n",         WiFi.RSSI());
  Serial.println("╚══════════════════════════════════╝\n");
}

// ==========================================
// SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH); delay(100);
    digitalWrite(LED_PIN, LOW);  delay(100);
  }

  Serial.println("\n╔══════════════════════════════════╗");
  Serial.println("║   ESP32 WEATHER LOGGER v" + String(FIRMWARE_VERSION) + "      ║");
  Serial.println("╚══════════════════════════════════╝");

  loadSettings();
  connectWiFi();
  setupLocalOTA();
  tryConnectBME();

  // Sync OTA settings from server on boot
  syncOTASettings();

  Serial.println("\n[READY] Server: " + String(serverURL));
  Serial.printf("[READY] Version: %s\n", FIRMWARE_VERSION);
  Serial.printf("[READY] Interval: %ds\n", sendInterval);
  Serial.printf("[READY] OTA: %s every %d min\n",
    otaEnabled ? "ON" : "OFF", otaCheckMinutes);

  delay(1000);
  readBME();
  printStatus();
  sendData();
  lastSend = millis();
  lastOTACheck = millis();
}

// ==========================================
// LOOP
// ==========================================
void loop() {
  // Always handle local OTA (Arduino IDE same network)
  ArduinoOTA.handle();

  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Reconnecting...");
    WiFi.begin(ssid, password);
    int t = 0;
    while (WiFi.status() != WL_CONNECTED && t < 30) { delay(500); t++; }
  }

  unsigned long now = millis();

  // Retry BME every 30s if not connected
  if (!bmeConnected && now - lastBMERetry > 30000) {
    lastBMERetry = now;
    tryConnectBME();
  }

  // Send weather data on interval
  if (now - lastSend >= (unsigned long)sendInterval * 1000) {
    lastSend = now;
    readBME();
    printStatus();
    sendData();
  }

  // Check for remote OTA update
  unsigned long otaInterval = (unsigned long)otaCheckMinutes * 60 * 1000;
  if (now - lastOTACheck >= otaInterval) {
    lastOTACheck = now;
    syncOTASettings(); // sync settings first
    checkRemoteOTA();  // then check for update
  }

  delay(10);
}
