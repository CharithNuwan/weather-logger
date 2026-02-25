// ============================================================
// ESP32 BME280 Weather Logger
// Features:
//   - Sends temp/humidity/pressure/altitude to Vercel
//   - Receives settings from server (interval etc)
//   - Remote restart command from web dashboard
//   - OTA update from anywhere in world!
//   - No display needed — runs headless!
// ============================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>
#include <Preferences.h>  // save settings to flash!

// ==========================================
// CHANGE THESE ONLY!
// ==========================================
const char* ssid       = "Home_SLink2.4G";
const char* password   = "Cha@7550_CCV";
const char* otaName    = "ESP32-Weather";
const char* otaPass    = "esp32ota";
const char* serverURL  = "https://YOUR-APP.vercel.app"; // ← change after deploy!
// ==========================================

#define SEA_LEVEL_HPA 1004.8   // adjust for your area!
#define LED_PIN       2         // built-in LED

Adafruit_BME280 bme;
Preferences     prefs;

// Settings (loaded from flash + updated from server)
int  sendInterval = 60;        // seconds between sends
bool pendingRestart = false;

// Timing
unsigned long lastSend    = 0;
unsigned long lastOTACheck= 0;
unsigned long bootTime    = 0;

// Stats
int   totalSends   = 0;
int   failedSends  = 0;
float lastTemp     = 0;
float lastHumidity = 0;
float lastPressure = 0;
float lastAltitude = 0;

// ==========================================
// SAVE/LOAD SETTINGS FROM FLASH
// So settings survive restart!
// ==========================================
void saveSettings() {
  prefs.begin("weather", false);
  prefs.putInt("interval", sendInterval);
  prefs.end();
  Serial.println("[PREFS] Settings saved to flash!");
}

void loadSettings() {
  prefs.begin("weather", true);
  sendInterval = prefs.getInt("interval", 60); // default 60s
  prefs.end();
  Serial.printf("[PREFS] Loaded interval=%ds\n", sendInterval);
}

// ==========================================
// WIFI
// ==========================================
void connectWiFi() {
  Serial.print("\n[WiFi] Connecting to " + String(ssid));
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++attempts > 40) {
      Serial.println("\n[WiFi] Failed — restarting!");
      ESP.restart();
    }
  }

  Serial.println("\n[WiFi] Connected!");
  Serial.println("[WiFi] IP: " + WiFi.localIP().toString());
  Serial.println("[WiFi] RSSI: " + String(WiFi.RSSI()) + "dBm");
}

// ==========================================
// OTA SETUP
// ==========================================
void setupOTA() {
  ArduinoOTA.setHostname(otaName);
  ArduinoOTA.setPassword(otaPass);

  ArduinoOTA.onStart([]() {
    Serial.println("\n[OTA] Starting update...");
    // Turn LED on solid during OTA
    digitalWrite(LED_PIN, HIGH);
  });

  ArduinoOTA.onEnd([]() {
    Serial.println("\n[OTA] Update complete! Restarting...");
  });

  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    int pct = progress / (total / 100);
    Serial.printf("[OTA] Progress: %u%%\r", pct);
    // Blink LED during OTA
    digitalWrite(LED_PIN, pct % 2);
  });

  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("[OTA] Error[%u]: ", error);
    if      (error == OTA_AUTH_ERROR)    Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR)   Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR)     Serial.println("End Failed");
  });

  ArduinoOTA.begin();
  Serial.println("[OTA] Ready! Hostname: " + String(otaName));
  Serial.println("[OTA] Password: " + String(otaPass));
}

// ==========================================
// BME280 SETUP
// ==========================================
bool setupBME() {
  Wire.begin();

  // Try both I2C addresses
  if (bme.begin(0x76)) {
    Serial.println("[BME] Found at 0x76");
    return true;
  }
  if (bme.begin(0x77)) {
    Serial.println("[BME] Found at 0x77");
    return true;
  }

  Serial.println("[BME] ERROR — not found! Check wiring!");
  return false;
}

// ==========================================
// READ BME280
// ==========================================
bool readBME() {
  float t = bme.readTemperature();
  float h = bme.readHumidity();
  float p = bme.readPressure() / 100.0F;
  float a = bme.readAltitude(SEA_LEVEL_HPA);

  // Sanity check — BME sometimes returns bad values
  if (isnan(t) || isnan(h) || isnan(p)) {
    Serial.println("[BME] Bad reading — skipping!");
    return false;
  }
  if (t < -40 || t > 85) {
    Serial.println("[BME] Temperature out of range!");
    return false;
  }

  lastTemp     = t;
  lastHumidity = h;
  lastPressure = p;
  lastAltitude = a;
  return true;
}

// ==========================================
// SEND DATA TO VERCEL
// Returns: true if success
// Also receives settings from server!
// ==========================================
bool sendData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected — skipping");
    return false;
  }

  // Build URL
  String url = String(serverURL) + "/api/save";
  url += "?temp="     + String(lastTemp, 2);
  url += "&humidity=" + String(lastHumidity, 2);
  url += "&pressure=" + String(lastPressure, 2);
  url += "&altitude=" + String(lastAltitude, 2);
  url += "&uptime="   + String(millis() / 1000);
  url += "&rssi="     + String(WiFi.RSSI());

  Serial.println("[HTTP] Sending to Vercel...");
  Serial.printf("[HTTP] Temp=%.1f Humid=%.1f Pres=%.1f Alt=%.1f\n",
                lastTemp, lastHumidity, lastPressure, lastAltitude);

  HTTPClient http;
  http.begin(url);
  http.setTimeout(8000); // 8s timeout for Vercel cold start

  int code = http.GET();

  if (code == 200) {
    String response = http.getString();
    Serial.println("[HTTP] Response: " + response);

    // Parse response — server sends back settings!
    StaticJsonDocument<300> doc;
    DeserializationError err = deserializeJson(doc, response);

    if (!err) {
      // Update send interval if changed from web!
      int newInterval = doc["send_interval"] | sendInterval;
      if (newInterval != sendInterval) {
        Serial.printf("[CONFIG] Interval changed: %ds → %ds\n",
                      sendInterval, newInterval);
        sendInterval = newInterval;
        saveSettings(); // save to flash!
      }

      // Restart command from web dashboard!
      bool shouldRestart = doc["restart"] | false;
      if (shouldRestart) {
        Serial.println("[CONFIG] RESTART command received from server!");
        Serial.println("[CONFIG] Restarting in 2 seconds...");
        http.end();
        delay(2000);
        ESP.restart();
      }
    }

    http.end();
    totalSends++;
    digitalWrite(LED_PIN, HIGH);
    delay(100);
    digitalWrite(LED_PIN, LOW);
    return true;

  } else {
    Serial.printf("[HTTP] Failed! Code: %d\n", code);
    http.end();
    failedSends++;
    // Blink LED 3 times on error
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_PIN, HIGH); delay(100);
      digitalWrite(LED_PIN, LOW);  delay(100);
    }
    return false;
  }
}

// ==========================================
// PRINT STATUS TO SERIAL
// ==========================================
void printStatus() {
  Serial.println("\n╔══════════════════════════════════╗");
  Serial.printf( "║  Temp:     %.1f °C              \n", lastTemp);
  Serial.printf( "║  Humidity: %.1f %%              \n", lastHumidity);
  Serial.printf( "║  Pressure: %.1f hPa             \n", lastPressure);
  Serial.printf( "║  Altitude: %.1f m               \n", lastAltitude);
  Serial.println("║──────────────────────────────────║");
  Serial.printf( "║  Sends OK:  %d                  \n", totalSends);
  Serial.printf( "║  Failed:    %d                  \n", failedSends);
  Serial.printf( "║  Interval:  %ds                 \n", sendInterval);
  Serial.printf( "║  Uptime:    %lus                \n", millis()/1000);
  Serial.printf( "║  WiFi RSSI: %d dBm              \n", WiFi.RSSI());
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

  // Fast blink on boot
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH); delay(100);
    digitalWrite(LED_PIN, LOW);  delay(100);
  }

  Serial.println("\n╔══════════════════════════════════╗");
  Serial.println("║   ESP32 WEATHER LOGGER           ║");
  Serial.println("║   BME280 → Vercel → Dashboard    ║");
  Serial.println("╚══════════════════════════════════╝");

  // Load saved settings
  loadSettings();

  // Connect WiFi
  connectWiFi();

  // Setup OTA
  setupOTA();

  // Setup BME280
  if (!setupBME()) {
    Serial.println("[ERROR] BME280 failed! Check wiring!");
    // Blink fast forever to show error
    while (true) {
      digitalWrite(LED_PIN, HIGH); delay(200);
      digitalWrite(LED_PIN, LOW);  delay(200);
    }
  }

  bootTime = millis();

  Serial.println("\n[READY] Starting in 2 seconds...");
  Serial.println("[INFO]  Server: " + String(serverURL));
  Serial.printf( "[INFO]  Send every: %ds\n", sendInterval);
  Serial.println("[INFO]  OTA: " + String(otaName));

  // First reading immediately!
  delay(2000);
  if (readBME()) {
    printStatus();
    sendData();
    lastSend = millis();
  }
}

// ==========================================
// MAIN LOOP
// ==========================================
void loop() {
  // Always handle OTA — so you can upload from anywhere!
  ArduinoOTA.handle();

  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WiFi] Disconnected — reconnecting...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    int t = 0;
    while (WiFi.status() != WL_CONNECTED && t < 30) {
      delay(500); t++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("[WiFi] Reconnected!");
    }
  }

  // Send data on interval
  unsigned long now = millis();
  if (now - lastSend >= (unsigned long)sendInterval * 1000) {
    lastSend = now;

    if (readBME()) {
      printStatus();
      sendData();
    }
  }

  delay(10);
}
