# 🛒 HARVI PARTS SHOPPING LIST
## MEOK AI Labs - Robotics Project
**Date:** 2026-04-05
**Budget:** $247 AUD

---

## Amazon AU Orders

### 1. Jetson Nano Developer Kit
- **Price:** $149 AUD
- **URL:** https://www.amazon.com.au/dp/B084DSDDLT
- **Purpose:** Main compute unit for HARVI brain

### 2. SG90 Micro Servo 10-pack
- **Price:** $18 AUD
- **URL:** https://www.amazon.com.au/dp/B07MLR1498
- **Purpose:** Servo motors for joint movement

### 3. 5V 4A Power Supply (barrel jack)
- **Price:** $15 AUD
- **URL:** https://www.amazon.com.au/dp/B0852HL336
- **Purpose:** Power supply for Jetson + servos

---

## eBay AU Orders

### 4. PCA9685 16-Channel PWM Driver
- **Price:** $12 AUD
- **Purpose:** Control up to 16 servos simultaneously

### 5. Jumper Wire Kit (M-M, M-F, F-F)
- **Price:** $8 AUD
- **Purpose:** Wiring connections

### 6. MicroSD 64GB (for Jetson)
- **Price:** $15 AUD
- **Purpose:** Storage for Jetson Nano OS

### 7. USB Webcam 1080p
- **Price:** $30 AUD
- **Purpose:** Vision input for face tracking

---

## ORDER SUMMARY

| Item | Source | Price (AUD) |
|------|--------|-------------|
| Jetson Nano 4GB | Amazon AU | $149 |
| SG90 Servos (10x) | Amazon AU | $18 |
| 5V 4A PSU | Amazon AU | $15 |
| PCA9685 PWM | eBay AU | $12 |
| Jumper wires | eBay AU | $8 |
| MicroSD 64GB | eBay AU | $15 |
| USB Webcam | eBay AU | $30 |
| **TOTAL** | | **$247** |

---

## QUICK COPY/PASTE

### Amazon AU Links:
- Jetson Nano: https://www.amazon.com.au/dp/B084DSDDLT
- SG90 Servos: https://www.amazon.com.au/dp/B07MLR1498
- 5V 4A PSU: https://www.amazon.com.au/dp/B0852HL336

### eBay AU Search Terms:
- "PCA9685 16-channel PWM"
- "jumper wire kit breadboard"
- "microSD card 64GB class 10"
- "USB webcam 1080p"

---

## AFTER ORDERING

1. **Flash Jetson Nano image** (balenaEtcher)
2. **Boot and configure** (WiFi, SSH)
3. **Install dependencies:**
   ```bash
   sudo apt update
   sudo apt install -y python3-pip i2c-tools
   pip3 install adafruit-circuitpython-pca9685 adafruit-circuitpython-servokit
   ```
4. **Wire PCA9685** to Jetson (GPIO pins 3,5 for I2C)
5. **Test single servo**
6. **Build HARVI body**

---

*Order placed: ☐ (tick when done)*
