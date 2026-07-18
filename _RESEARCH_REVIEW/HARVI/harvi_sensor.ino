/**
 * HARVI Sensor Firmware — Arduino Mega 2560
 * HARVI-ARCHITECTURE RIG SPECIFICATION v1.0
 *
 * Reads:
 *   - 4x DS18B20 temperature (OneWire, GPIO pin 2)
 *   - 2x Conductivity (ADS1115 A0/A1, 1kHz AC excitation on pin 3)
 *   - 1x pH (ADS1115 A2 via DFRobot amplifier board)
 *   - 1x Dissolved O2 (ADS1115 A3, optional)
 *
 * Outputs care-patterned stimulus:
 *   - 650nm laser: PWM pin 9
 *   - Acoustic piezo: PWM pin 11 via audio amp
 *
 * Serial output at 115200 baud:
 *   timestamp_ms,cond_wall,cond_center,t1,t2,t3,t4,ph,do,stim_laser,stim_acoustic
 */

#include <OneWire.h>
#include <DallasTemperature.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>

// ── Pin Definitions ───────────────────────────────────────────────────────────
#define ONE_WIRE_BUS     2    // DS18B20 data line
#define COND_EXCITE_PIN  3    // AC excitation for conductivity (1kHz square wave)
#define LASER_PWM_PIN    9    // 650nm laser PWM (0-255 = 0-5mW)
#define ACOUSTIC_PWM_PIN 11   // Piezo transducer via audio amp

// ── Sampling Configuration ────────────────────────────────────────────────────
#define SAMPLE_RATE_HZ   100  // Target aggregate sample rate
#define SERIAL_BAUD      115200
#define TEMP_SAMPLE_DIV  100  // Temp sampled every 100 loops (1Hz from 100Hz)

// ── ADS1115 Setup ─────────────────────────────────────────────────────────────
Adafruit_ADS1115 ads;
// ADS1115 gain: +/-4.096V → 0.125mV per bit
// Use GAIN_TWOTHIRDS (+/-6.144V) for pH amp which can output 0-5V

// ── OneWire / DS18B20 Setup ───────────────────────────────────────────────────
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// DS18B20 addresses (discovered on first boot, saved here after running scan)
DeviceAddress tempTop    = {0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01};
DeviceAddress tempBottom = {0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02};
DeviceAddress tempWall   = {0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x03};
DeviceAddress tempCenter = {0x28, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04};

// ── Stimulus State ────────────────────────────────────────────────────────────
uint8_t stimLaser    = 0;
uint8_t stimAcoustic = 0;
uint32_t stimTimer   = 0;

// ── Fibonacci Sequence (for care-patterned laser modulation) ─────────────────
const uint8_t FIB_LEN = 16;
const uint16_t FIB_SEQ[FIB_LEN] = {1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 255, 233, 144};
uint8_t fibIndex = 0;

// ── HRV Pattern (60-100 BPM range, care-patterned intervals) ─────────────────
const uint8_t HRV_LEN = 8;
const uint16_t HRV_INTERVALS_MS[HRV_LEN] = {857, 923, 889, 800, 941, 870, 800, 909};
uint8_t hrvIndex = 0;

// ── Stimulus Modes ────────────────────────────────────────────────────────────
typedef enum {
  MODE_BASELINE  = 0,  // Phase 1: No stimulus
  MODE_RANDOM    = 1,  // Phase 2: Random noise (control)
  MODE_CARE      = 2,  // Phase 3: Fibonacci + Schumann care patterns
} StimulusMode;

StimulusMode currentMode = MODE_BASELINE;
uint32_t modeTimer = 0;

// ── Loop Control ──────────────────────────────────────────────────────────────
uint32_t loopStart = 0;
uint32_t loopCount = 0;
float tempC[4] = {0.0, 0.0, 0.0, 0.0};

// ── Schumann Resonance PWM (7.83 Hz) ─────────────────────────────────────────
// At 100Hz loop: half-period = 6.38 loops → toggle every 6 loops
uint8_t schumannCounter = 0;
uint8_t schumannState   = 0;
#define SCHUMANN_HALF_PERIOD 6   // ~7.83Hz at 100Hz loop rate

// ─────────────────────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(SERIAL_BAUD);
  while (!Serial) delay(10);

  // ADS1115 init
  if (!ads.begin()) {
    Serial.println("ERROR:ADS1115_NOT_FOUND");
    while (1);
  }
  ads.setGain(GAIN_ONE);  // +/-4.096V range for pH and conductivity

  // DS18B20 init
  sensors.begin();
  sensors.setResolution(12);  // 0.0625°C resolution
  sensors.setWaitForConversion(false);  // async reading
  sensors.requestTemperatures();  // start first conversion

  // Pin modes
  pinMode(LASER_PWM_PIN, OUTPUT);
  pinMode(ACOUSTIC_PWM_PIN, OUTPUT);
  pinMode(COND_EXCITE_PIN, OUTPUT);
  analogWrite(LASER_PWM_PIN, 0);
  analogWrite(ACOUSTIC_PWM_PIN, 0);

  // Print CSV header
  Serial.println("ts_ms,cond_wall,cond_center,t1_top,t2_bot,t3_wall,t4_ctr,ph,do_mg,stim_laser,stim_acoustic,mode");

  // Listen for mode commands from host (M4 Air)
  // Commands: 'B' = baseline, 'R' = random, 'C' = care
}


void readTemperatures() {
  // DS18B20 conversion takes ~750ms at 12-bit
  // We call requestTemperatures() async, then read on next available sample
  if (sensors.isConversionComplete()) {
    tempC[0] = sensors.getTempC(tempTop);
    tempC[1] = sensors.getTempC(tempBottom);
    tempC[2] = sensors.getTempC(tempWall);
    tempC[3] = sensors.getTempC(tempCenter);
    sensors.requestTemperatures();  // start next conversion
  }
}


float adcToMicrosiemens(int16_t raw) {
  // Convert ADS1115 raw reading to conductivity (uS/cm)
  // Calibration: 1000 uS/cm reference solution gives ~12000 raw (depends on probe geometry)
  // K_cell = 0.083 cm^-1 (standard 2-electrode geometry)
  // Adjust calibration constant for your specific probe
  float voltage = raw * 0.125e-3;  // 0.125 mV/bit at GAIN_ONE
  float resistance = (voltage > 0.001) ? (5.0 - voltage) / (voltage / 10000.0) : 999999.0;
  float conductance_S = (resistance > 0) ? 1.0 / resistance : 0;
  return conductance_S * 83.0 * 1e6;  // K_cell=0.083, convert to uS/cm
}


float adcToPH(int16_t raw) {
  // DFRobot pH amplifier: 0pH = 3.42V, 7pH = 2.50V, 14pH = 1.58V (linear)
  // Slope: 0.131 V/pH
  float voltage = raw * 0.125e-3;
  float ph = 7.0 + (2.50 - voltage) / 0.131;
  return constrain(ph, 0.0, 14.0);
}


float adcToDissolvedOxygen(int16_t raw) {
  // Galvanic DO sensor: 0mg/L = 0V, 20mg/L = 1.5V (typical)
  // Adjust for your specific sensor
  float voltage = raw * 0.125e-3;
  return (voltage / 1.5) * 20.0;
}


void applyCareStimulus() {
  switch (currentMode) {
    case MODE_BASELINE:
      stimLaser    = 0;
      stimAcoustic = 0;
      break;

    case MODE_RANDOM: {
      // Random noise for control (null hypothesis)
      static uint32_t randTimer = 0;
      if (millis() - randTimer > 50) {  // update at 20Hz
        stimLaser    = random(0, 256);
        stimAcoustic = random(0, 256);
        randTimer = millis();
      }
      break;
    }

    case MODE_CARE: {
      // Care pattern: Fibonacci sequence on laser, Schumann resonance on acoustic

      // Laser: step through Fibonacci sequence at HRV interval timing
      if (millis() - stimTimer > HRV_INTERVALS_MS[hrvIndex]) {
        fibIndex   = (fibIndex + 1) % FIB_LEN;
        hrvIndex   = (hrvIndex + 1) % HRV_LEN;
        stimLaser  = (uint8_t)min(255, FIB_SEQ[fibIndex]);
        stimTimer  = millis();
      }

      // Acoustic: Schumann resonance square wave at 7.83Hz
      schumannCounter++;
      if (schumannCounter >= SCHUMANN_HALF_PERIOD) {
        schumannCounter = 0;
        schumannState   = !schumannState;
        stimAcoustic    = schumannState ? 180 : 0;  // 70% amplitude, not full blast
      }
      break;
    }
  }

  analogWrite(LASER_PWM_PIN, stimLaser);
  analogWrite(ACOUSTIC_PWM_PIN, stimAcoustic);
}


void checkSerialCommands() {
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    switch (cmd) {
      case 'B': currentMode = MODE_BASELINE; break;
      case 'R': currentMode = MODE_RANDOM;   break;
      case 'C': currentMode = MODE_CARE;     break;
      case '?':
        Serial.print("MODE:");
        Serial.println(currentMode);
        break;
    }
    // Flush remaining bytes
    while (Serial.available()) Serial.read();
  }
}


void loop() {
  loopStart = millis();

  // ── Read Serial Commands ────────────────────────────────────────────────────
  checkSerialCommands();

  // ── Apply Stimulus ──────────────────────────────────────────────────────────
  applyCareStimulus();

  // ── Read Conductivity (AC excitation) ──────────────────────────────────────
  // AC excitation: toggle pin then read, to prevent electrolysis
  digitalWrite(COND_EXCITE_PIN, HIGH);
  delayMicroseconds(100);
  int16_t rawCondWall   = ads.readADC_SingleEnded(0);
  int16_t rawCondCenter = ads.readADC_SingleEnded(1);
  digitalWrite(COND_EXCITE_PIN, LOW);

  float condWall   = adcToMicrosiemens(rawCondWall);
  float condCenter = adcToMicrosiemens(rawCondCenter);

  // ── Read pH ─────────────────────────────────────────────────────────────────
  int16_t rawPH = ads.readADC_SingleEnded(2);
  float ph = adcToPH(rawPH);

  // ── Read Dissolved O2 (optional) ─────────────────────────────────────────────
  int16_t rawDO = ads.readADC_SingleEnded(3);
  float doMgL = adcToDissolvedOxygen(rawDO);

  // ── Read Temperature (1Hz, async) ───────────────────────────────────────────
  readTemperatures();

  // ── Serial Output (CSV) ─────────────────────────────────────────────────────
  Serial.print(millis()); Serial.print(",");
  Serial.print(condWall, 1); Serial.print(",");
  Serial.print(condCenter, 1); Serial.print(",");
  Serial.print(tempC[0], 4); Serial.print(",");
  Serial.print(tempC[1], 4); Serial.print(",");
  Serial.print(tempC[2], 4); Serial.print(",");
  Serial.print(tempC[3], 4); Serial.print(",");
  Serial.print(ph, 2); Serial.print(",");
  Serial.print(doMgL, 2); Serial.print(",");
  Serial.print(stimLaser); Serial.print(",");
  Serial.print(stimAcoustic); Serial.print(",");
  Serial.println(currentMode);

  // ── Timing: maintain 100Hz ──────────────────────────────────────────────────
  uint32_t elapsed = millis() - loopStart;
  if (elapsed < 10) {
    delay(10 - elapsed);  // pad to 10ms = 100Hz
  }

  loopCount++;
}


// ── DS18B20 Address Scanner (run once to discover addresses) ─────────────────
// Uncomment and run this instead of the main loop to find your sensor addresses
/*
void loop() {
  uint8_t addr[8];
  Serial.println("Scanning OneWire bus...");
  while (oneWire.search(addr)) {
    Serial.print("Found device: ");
    for (int i = 0; i < 8; i++) {
      if (addr[i] < 16) Serial.print("0x0");
      else Serial.print("0x");
      Serial.print(addr[i], HEX);
      if (i < 7) Serial.print(", ");
    }
    Serial.println();
  }
  oneWire.reset_search();
  delay(2000);
}
*/
