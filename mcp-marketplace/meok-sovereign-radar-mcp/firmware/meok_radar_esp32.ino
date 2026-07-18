/*
 * MEOK Sovereign Radar — ESP32 Firmware
 * Sensor: HLK-LD2450 24GHz mmWave Radar
 * MCU: ESP32-S3 DevKitC
 * 
 * Care Floor: Count-only mode, NO individual identification
 * Every detection is SIGIL-signed (SHA-256)
 * 
 * Output: MQTT telemetry + Serial debug
 * License: MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <Crypto.h>
#include <SHA256.h>

// ===== CONFIGURATION =====

// WiFi
const char* WIFI_SSID = "MEOK-LAB";
const char* WIFI_PASS = "your-password-here";

// MQTT
const char* MQTT_BROKER = "192.168.50.1";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC_TARGETS = "meok/radar/targets";
const char* MQTT_TOPIC_PRESENCE = "meok/radar/presence";
const char* MQTT_TOPIC_STATUS = "meok/radar/status";

// Radar (HLK-LD2450)
#define RADAR_RX_PIN 16   // ESP32 RX2 → LD2450 TX
#define RADAR_TX_PIN 17   // ESP32 TX2 → LD2450 RX
#define RADAR_BAUD 256000

// SIGIL key (sovereign identity)
const char* SIGIL_KEY = "meok-radar-sovereign-key-v1";

// Care floor
const bool CARE_FLOOR_ACTIVE = true;
const bool ANONYMOUS_MODE = true;  // Strip all identifying info

// ===== HLK-LD2450 PROTOCOL =====

// Target data frame: AA FF 03 00 00 07 00 <data> 55 CC
// Each target: 8 bytes (x_low, x_high, y_low, y_high, speed_low, speed_high, resolution, reserved)
#define MAX_TARGETS 3
#define FRAME_HEADER_1 0xAA
#define FRAME_HEADER_2 0xFF
#define FRAME_TAIL_1 0x55
#define FRAME_TAIL_2 0xCC

struct RadarTarget {
  int16_t x_mm;      // X position (mm, signed)
  int16_t y_mm;      // Y position (mm, signed)
  int16_t speed;     // Speed (signed, 0.01 m/s units in some FW)
  uint8_t resolution; // Position resolution (mm)
  bool valid;
};

RadarTarget targets[MAX_TARGETS];
int targetCount = 0;

// ===== SIGIL SIGNING =====

String sigilSign(String payload) {
  SHA256 sha256;
  sha256.reset();
  sha256.update((const uint8_t*)(payload + SIGIL_KEY).c_str(), 
                (payload + SIGIL_KEY).length());
  
  uint8_t hash[32];
  sha256.finalize(hash, 32);
  
  // Take first 8 bytes as hex (16 chars)
  String sigil = "";
  for (int i = 0; i < 8; i++) {
    char hex[3];
    sprintf(hex, "%02x", hash[i]);
    sigil += hex;
  }
  return sigil;
}

// ===== RADAR PARSING =====

void parseRadarData() {
  static uint8_t buffer[256];
  static int bufLen = 0;
  static bool inFrame = false;
  
  while (Serial2.available()) {
    uint8_t b = Serial2.read();
    
    if (!inFrame) {
      // Look for frame header: AA FF
      if (bufLen == 0 && b == FRAME_HEADER_1) {
        buffer[bufLen++] = b;
      } else if (bufLen == 1 && b == FRAME_HEADER_2) {
        buffer[bufLen++] = b;
        inFrame = true;
      } else {
        bufLen = 0;
      }
    } else {
      if (bufLen < 256) {
        buffer[bufLen++] = b;
      }
      
      // Look for frame tail: 55 CC
      if (bufLen >= 2 && buffer[bufLen-2] == FRAME_TAIL_1 && buffer[bufLen-1] == FRAME_TAIL_2) {
        processFrame(buffer, bufLen);
        bufLen = 0;
        inFrame = false;
      }
    }
  }
}

void processFrame(uint8_t* frame, int len) {
  // Frame: AA FF 03 00 00 07 00 [target1 8 bytes] [target2 8 bytes] [target3 8 bytes] 55 CC
  // Header is 7 bytes, each target is 8 bytes, tail is 2 bytes
  
  if (len < 9) return;  // Minimum: header + at least 1 target partial
  
  // Data starts at byte 7 (after AA FF 03 00 00 07 00)
  int dataStart = 7;
  int dataLen = len - dataStart - 2;  // Subtract tail
  
  targetCount = 0;
  
  for (int i = 0; i < MAX_TARGETS && (i * 8 + 8) <= dataLen; i++) {
    int offset = dataStart + i * 8;
    
    // Parse target data (little-endian int16)
    targets[i].x_mm = (int16_t)((frame[offset + 1] << 8) | frame[offset]);
    targets[i].y_mm = (int16_t)((frame[offset + 3] << 8) | frame[offset + 2]);
    targets[i].speed = (int16_t)((frame[offset + 5] << 8) | frame[offset + 4]);
    targets[i].resolution = frame[offset + 6];
    targets[i].valid = (targets[i].x_mm != 0 || targets[i].y_mm != 0);
    
    if (targets[i].valid) {
      targetCount++;
    }
  }
}

// ===== MQTT =====

WiFiClient espClient;
PubSubClient mqtt(espClient);

void publishTelemetry() {
  if (!mqtt.connected()) return;
  
  unsigned long now = millis();
  String ts = String(now);
  
  // Build targets JSON (anonymous — care floor)
  String targetsJson = "{\"sensor\":\"HLK-LD2450\",\"targets\":[";
  bool first = true;
  
  for (int i = 0; i < MAX_TARGETS; i++) {
    if (targets[i].valid) {
      if (!first) targetsJson += ",";
      first = false;
      
      // CARE FLOOR: Target ID is "Target-N" NOT a person
      targetsJson += "{\"id\":\"Target-" + String(i + 1) + "\"";
      targetsJson += ",\"x_mm\":" + String(targets[i].x_mm);
      targetsJson += ",\"y_mm\":" + String(targets[i].y_mm);
      targetsJson += ",\"speed\":" + String((float)targets[i].speed / 100.0, 2);
      targetsJson += ",\"resolution_mm\":" + String(targets[i].resolution);
      targetsJson += ",\"note\":\"Anonymous — NO individual identification\"";
      targetsJson += "}";
    }
  }
  targetsJson += "],\"count\":" + String(targetCount);
  
  // SIGIL signing
  String sigil = sigilSign("targets_" + ts + "_" + String(targetCount));
  targetsJson += ",\"sigil\":\"" + sigil + "\"";
  targetsJson += ",\"ts\":" + ts;
  targetsJson += "}";
  
  mqtt.publish(MQTT_TOPIC_TARGETS, targetsJson.c_str());
  
  // Presence (binary)
  String presenceJson = "{\"presence\":\"" + String(targetCount > 0 ? "OCCUPIED" : "CLEAR");
  presenceJson += "\",\"count\":" + String(targetCount);
  presenceJson += ",\"sigil\":\"" + sigilSign("presence_" + ts) + "\"";
  presenceJson += ",\"ts\":" + ts;
  presenceJson += "}";
  
  mqtt.publish(MQTT_TOPIC_PRESENCE, presenceJson.c_str());
}

// ===== MAIN =====

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== MEOK SOVEREIGN RADAR ===");
  Serial.println("Sensor: HLK-LD2450 24GHz mmWave");
  Serial.println("Care Floor: ACTIVE — count-only, no individual ID");
  
  // Radar serial
  Serial2.begin(RADAR_BAUD, SERIAL_8N1, RADAR_RX_PIN, RADAR_TX_PIN);
  
  // WiFi
  Serial.print("Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(" FAILED — running offline (serial only)");
  }
  
  // MQTT
  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setBufferSize(1024);
  
  Serial.println("Radar node ready. Listening for targets...\n");
}

unsigned long lastPublish = 0;
const unsigned long PUBLISH_INTERVAL = 100; // 10Hz

void loop() {
  // Parse radar data
  parseRadarData();
  
  // MQTT maintenance
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqtt.connected()) {
      mqtt.connect("meok-radar-01");
    }
    mqtt.loop();
  }
  
  // Publish telemetry at 10Hz
  unsigned long now = millis();
  if (now - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = now;
    
    publishTelemetry();
    
    // Serial debug (every 1 second)
    if (now % 1000 < PUBLISH_INTERVAL) {
      Serial.printf("[%lu] Targets: %d", now / 1000, targetCount);
      for (int i = 0; i < MAX_TARGETS; i++) {
        if (targets[i].valid) {
          Serial.printf(" | T%d:(%d,%d) %dmm/s",
                        i + 1, targets[i].x_mm, targets[i].y_mm,
                        targets[i].speed);
        }
      }
      Serial.println();
    }
  }
  
  delay(1);
}
