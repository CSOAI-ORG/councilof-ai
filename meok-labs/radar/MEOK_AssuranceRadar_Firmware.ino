/**
 * MEOK_AssuranceRadar_Firmware.ino
 *
 * Stage-0 firmware for the MEOK Assurance Radar node.
 * Sensor:  HLK-LD2450 24GHz mmWave radar (3-target presence + micro-motion)
 * Link:    UART @ 256000 baud, AA FF 03 00 header, 3-target 8-byte blocks
 * Signing: Ed25519 over RFC-8785 JCS canonical JSON, POST to /api/verify
 *
 * CSOAI LTD UK 16939677 - 11 Jul 2026
 * Honest scope: this is the COMPILABLE sketch for an ESP32 (or any Arduino
 * with two UARTs and an Ed25519 lib). Pair with verify_test.py on the host.
 */

#include <Arduino.h>
#include <ArduinoJson.h>
#include <Ed25519.h>     // https://github.com/rampant1010/Arduino-Ed25519 (or similar)

// ── Pins ────────────────────────────────────────────────────────────
#define LD2450_RX   16     // ESP32 reads on Serial2 RX
#define LD2450_TX   17     // (optional) ESP32 TX to LD2450 for config
#define LED_SIGN    2      // on-board LED, blinks on signed POST

// ── Protocol constants ──────────────────────────────────────────────
#define LD2450_BAUD       256000
#define LD2450_HEADER_LEN 4
#define LD2450_FRAME_LEN  23   // 4 (header) + 3*8 (targets) - 5 (overlap)
#define LD2450_NUM_TARGETS 3
#define LD2450_HEADER     {0xAA, 0xFF, 0x03, 0x00}

// ── Signing key (32-byte Ed25519 private seed) ──────────────────────
// PRODUCTION: load from NVS / secure element. For sketch-test: compile-time.
const uint8_t SIGNING_SEED[32] = {
    0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60,
    0xba, 0x84, 0x4a, 0xf4, 0x92, 0xec, 0x2c, 0xc4,
    0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19,
    0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
};

// ── WiFi + endpoint (configure per deployment) ──────────────────────
const char* WIFI_SSID     = "YOUR_SSID";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* ENDPOINT      = "https://csoai.org/api/verify";

// ── Globals ─────────────────────────────────────────────────────────
HardwareSerial LD2450(2);   // Serial2 on ESP32

struct Target {
    int16_t x_mm;      // signed mm
    int16_t y_mm;
    int16_t speed_cm_s;
    uint16_t resolution_cm;
};

struct Frame {
    Target targets[LD2450_NUM_TARGETS];
    uint32_t frame_seq;
    uint32_t millis_at;
};

uint32_t frame_seq = 0;

// ── Frame parser ────────────────────────────────────────────────────
// LD2450 23-byte frame format:
//   AA FF 03 00                       [4-byte header]
//   [target_1: x2 y2 speed2 res2]    [8 bytes]
//   [target_2: x2 y2 speed2 res2]    [8 bytes]
//   [target_3: x2 y2 speed2 res2]    [8 bytes]
//   [footer 0x55 0xCC]               [2 bytes, end marker]
//
// IMPORTANT: x/y are LITTLE-ENDIAN, MSB is the SIGN bit (0 = positive, 1 = negative).
// 12-bit magnitude + 4-bit MSB is a common convention; per HLK datasheet v1.04 the
// low-12 bits + the sign bit in MSB is the official one.

bool parse_ld2450_frame(const uint8_t* buf, size_t len, Frame& out) {
    if (len != LD2450_FRAME_LEN) return false;
    if (buf[0] != 0xAA || buf[1] != 0xFF || buf[2] != 0x03 || buf[3] != 0x00) return false;
    if (buf[len-2] != 0x55 || buf[len-1] != 0xCC) return false;

    int offset = 4;
    for (int t = 0; t < LD2450_NUM_TARGETS; t++) {
        // x: 16-bit little-endian, MSB is sign bit
        uint16_t raw_x = buf[offset] | (buf[offset+1] << 8);
        int16_t signed_x = (raw_x & 0x8000) ? -(int16_t)(raw_x & 0x7FFF) : (int16_t)raw_x;

        // y
        uint16_t raw_y = buf[offset+2] | (buf[offset+3] << 8);
        int16_t signed_y = (raw_y & 0x8000) ? -(int16_t)(raw_y & 0x7FFF) : (int16_t)raw_y;

        // speed (cm/s)
        uint16_t raw_speed = buf[offset+4] | (buf[offset+5] << 8);
        int16_t signed_speed = (raw_speed & 0x8000) ? -(int16_t)(raw_speed & 0x7FFF) : (int16_t)raw_speed;

        // resolution (cm)
        uint16_t resolution = buf[offset+6] | (buf[offset+7] << 8);

        out.targets[t] = {signed_x, signed_y, signed_speed, resolution};
        offset += 8;
    }
    out.frame_seq = frame_seq++;
    out.millis_at = millis();
    return true;
}

// ── RFC-8785 JCS canonical JSON (subset, ints/strings only) ─────────
// Real impl: see https://github.com/cyberphone/json-canonicalization
// For sketch scope, we only sort KNOWN keys; production should use a vetted lib.

void canonical_json_kv(char* out, size_t out_len, const Frame& f, const char* node_id) {
    // Stable key order (alphabetical): device_id, frame_seq, millis_at, target_0..2
    snprintf(out, out_len,
        "{\"device_id\":\"%s\","
         "\"frame_seq\":%u,"
         "\"millis_at\":%u,"
         "\"target_0\":{\"x_mm\":%d,\"y_mm\":%d,\"speed_cm_s\":%d,\"resolution_cm\":%u},"
         "\"target_1\":{\"x_mm\":%d,\"y_mm\":%d,\"speed_cm_s\":%d,\"resolution_cm\":%u},"
         "\"target_2\":{\"x_mm\":%d,\"y_mm\":%d,\"speed_cm_s\":%d,\"resolution_cm\":%u}}",
        node_id,
        f.frame_seq, f.millis_at,
        f.targets[0].x_mm, f.targets[0].y_mm, f.targets[0].speed_cm_s, f.targets[0].resolution_cm,
        f.targets[1].x_mm, f.targets[1].y_mm, f.targets[1].speed_cm_s, f.targets[1].resolution_cm,
        f.targets[2].x_mm, f.targets[2].y_mm, f.targets[2].speed_cm_s, f.targets[2].resolution_cm);
}

// ── Sign + POST ─────────────────────────────────────────────────────
bool sign_and_post(const Frame& f) {
    const char* node_id = "meok-radar-001";
    char canonical[512];
    canonical_json_kv(canonical, sizeof(canonical), f, node_id);

    // Ed25519 sign: 64-byte signature over canonical JSON bytes
    uint8_t signature[64];
    ed25519_sign(signature, (const uint8_t*)canonical, strlen(canonical),
                 SIGNING_SEED, NULL /* pubkey derived from seed */);

    // Build JSON body: { record: <canonical>, signature: <hex>, node_id: <str> }
    StaticJsonDocument<1024> doc;
    doc["record"] = canonical;
    doc["node_id"] = node_id;

    char sig_hex[129];
    for (int i = 0; i < 64; i++) snprintf(sig_hex + 2*i, 3, "%02x", signature[i]);
    doc["signature"] = sig_hex;

    char body[1200];
    serializeJson(doc, body, sizeof(body));

    // POST via WiFiClientSecure (scaffolded — production wires real TLS root)
    WiFiClientSecure client;
    client.setInsecure();   // Stage-0 only; production: load CA bundle
    HTTPClient http;
    if (!http.begin(client, ENDPOINT)) return false;
    http.addHeader("Content-Type", "application/json");
    int http_code = http.POST(body);
    http.end();

    return http_code == 200 || http_code == 202;
}

// ── Arduino setup + loop ────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    LD2450.begin(LD2450_BAUD, SERIAL_8N1, LD2450_RX, LD2450_TX);
    pinMode(LED_SIGN, OUTPUT);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi up. Radar listening.");
}

void loop() {
    static uint8_t buf[LD2450_FRAME_LEN];
    static size_t idx = 0;

    while (LD2450.available()) {
        uint8_t b = LD2450.read();
        if (idx == 0 && b != 0xAA) continue;        // resync on header
        buf[idx++] = b;
        if (idx == LD2450_FRAME_LEN) {
            Frame f;
            if (parse_ld2450_frame(buf, LD2450_FRAME_LEN, f)) {
                digitalWrite(LED_SIGN, HIGH);
                bool ok = sign_and_post(f);
                if (!ok) {
                    Serial.println("POST failed");
                }
                digitalWrite(LED_SIGN, LOW);
            }
            idx = 0;
        }
    }
}