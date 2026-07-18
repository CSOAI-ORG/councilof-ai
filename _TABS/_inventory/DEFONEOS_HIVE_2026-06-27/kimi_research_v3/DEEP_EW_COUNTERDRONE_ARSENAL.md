# OPERATION DEEP EXECUTE — Electronic Warfare & Counter-Drone Open Source Arsenal

> **Classification:** DEFONEOS Technical Reference
> **Subject:** Open-source Electronic Warfare and Counter-UAS (c-UAS) tools, hardware, techniques, and legal framework
> **Scope:** Buildable, modifiable, deployable systems for defense applications
> **Date:** July 2025

---

## Table of Contents

1. [Software Defined Radio (SDR) for Defense](#1-software-defined-radio-sdr-for-defense)
2. [GNU Radio & EW Tools](#2-gnu-radio--ew-tools)
3. [Drone RF Detection & Analysis](#3-drone-rf-detection--analysis)
4. [Counter-Drone Systems (Open Source)](#4-counter-drone-systems-open-source)
5. [Electronic Warfare Techniques (Legal Framework)](#5-electronic-warfare-techniques-legal-framework)
6. [Signal Intelligence (SIGINT) Tools](#6-signal-intelligence-sigint-tools)
7. [The MEOK Labs EW Build List](#7-the-meok-labs-ew-build-list)
8. [DEFONEOS Integration Architecture](#8-defoneos-integration-architecture)

---

## 1. Software Defined Radio (SDR) for Defense

### 1.1 SDR Hardware Comparison Matrix

| Device | Frequency Range | ADC Bits | Max Bandwidth | TX/RX | MIMO | Duplex | Interface | FPGA | Price (USD) |
|--------|----------------|----------|---------------|-------|------|--------|-----------|------|-------------|
| **RTL-SDR V4** | 500 kHz – 1.766 GHz | 8-bit | 3.2 MHz | RX only | No | N/A | USB 2.0 | No | $30-40 |
| **HackRF One** | 1 MHz – 6 GHz | 8-bit | 20 MHz | TX/RX | No | Half | USB 2.0 | Xilinx Spartan-6 | $340 (official) / $90-150 (clones) |
| **LimeSDR Mini 2.0** | 10 MHz – 3.5 GHz | 12-bit | 40 MHz / 80 MSPS | TX/RX | No (1x1) | Full | USB 3.0 | Lattice ECP5 (44K) | $399 |
| **BladeRF 2.0 micro xA4** | 47 MHz – 6 GHz | 12-bit | 56 MHz / 61.44 MSPS | TX/RX | Yes (2x2) | Full | USB 3.0 | Intel Cyclone V (55K) | $540 |
| **BladeRF 2.0 micro xA9** | 47 MHz – 6 GHz | 12-bit | 56 MHz / 61.44 MSPS | TX/RX | Yes (2x2) | Full | USB 3.0 | Intel Cyclone V (301K) | $665 |
| **PlutoSDR (ADALM-Pluto)** | 325 MHz – 3.8 GHz* | 12-bit | 20 MHz / 61.44 MSPS | TX/RX | 2x2 | Full | USB 2.0 / Ethernet | Xilinx Zynq Z-7010 (28K) | $149-229 |
| **Ettus USRP B200** | 70 MHz – 6 GHz | 12-bit | 56 MHz / 61.44 MSPS | TX/RX | No (1x1) | Full | USB 3.0 | Xilinx Spartan-6 (75K) | ~$675 |
| **Ettus USRP B210** | 70 MHz – 6 GHz | 12-bit | 56 MHz / 61.44 MSPS | TX/RX | Yes (2x2) | Full | USB 3.0 | Xilinx Spartan-6 (100K) | ~$1,119 |
| **Ettus USRP B205mini** | 70 MHz – 6 GHz | 12-bit | 56 MHz / 61.44 MSPS | TX/RX | No (1x1) | Full | USB Micro | Xilinx Spartan-6 (150K) | ~$675 |
| **KrakenSDR** | 24 MHz – 1.766 GHz | 8-bit (5x RTL2832U) | 2.56 MHz per channel | RX only (5 coherent channels) | Yes (5x coherent) | N/A | USB 2.0 (via hub) | No | $349 |

*PlutoSDR can be unofficially extended down to ~70 MHz with software modifications.

### 1.2 SDR Device Deep Dive

#### RTL-SDR V4 ($30-40) — Entry-Level RX
- **Chipset:** RTL2832U + R828D tuner
- **Best for:** ADS-B, NOAA weather satellites, FM/DAB, basic spectrum scanning, starter projects
- **Dynamic range:** ~48 dB (8-bit limitation)
- **Key advantage:** Massive community, enormous tutorial base, works with virtually all SDR software
- **Limitations:** RX only, narrow bandwidth, no TX capability, poor HF performance without upconverter
- **Defense use:** ADS-B aircraft monitoring, basic drone detection, signal survey, training

#### HackRF One ($340) — Wideband TX/RX
- **Chipset:** MAX2837 + MAX5864 + SiGe PA
- **Best for:** Wideband signal exploration, protocol analysis, TX experimentation, security research
- **Dynamic range:** ~48 dB (8-bit limitation)
- **Key advantage:** Widest frequency coverage at the price point (1 MHz to 6 GHz), half-duplex TX/RX
- **Limitations:** 8-bit ADC/DAC means limited dynamic range, half-duplex only, PA susceptible to damage from antenna mismatch
- **Notable add-ons:** PortaPack H2 (portable standalone), Opera Cake (antenna switching)
- **Defense use:** Full-spectrum survey, protocol fuzzing, signal replay, jamming research (shielded environments only)

#### LimeSDR Mini 2.0 ($399) — Open Source FPGA
- **Chipset:** LMS7002M RF transceiver + Lattice ECP5 FPGA
- **Best for:** FPGA development, custom DSP, educational TX/RX projects
- **Dynamic range:** ~72 dB (12-bit)
- **Key advantage:** Fully open-source FPGA toolchain (nextpnr/yosys), full-duplex TX/RX
- **Limitations:** 10 MHz lower limit, some historical noise figure issues, price increase from v1
- **Defense use:** Custom signal processing, MIMO research, protocol development, educational platforms

#### BladeRF 2.0 micro ($540-665) — Full-Duplex MIMO
- **Chipset:** AD9361 (same as USRP B210) + Intel Cyclone V FPGA
- **Best for:** Professional research, cellular protocol work, MIMO applications
- **Dynamic range:** ~72 dB (12-bit AD9361)
- **Key advantage:** Best TX spectral purity in its class, 2x2 MIMO, full-duplex, GPSDO option
- **Limitations:** USB 3.0 host required, higher price point
- **Defense use:** Cellular base station research, multi-antenna direction finding, high-quality signal generation

#### PlutoSDR / ADALM-Pluto ($149-229) — Best Value TX/RX
- **Chipset:** AD9363 + Xilinx Zynq Z-7010 (ARM + FPGA)
- **Best for:** Python/MATLAB projects, educational TX/RX, rapid prototyping
- **Dynamic range:** ~72 dB (12-bit)
- **Key advantage:** Best Python ecosystem (pyadi-iio), standalone Linux on Zynq, Ethernet capable, MATLAB/Simulink support
- **Limitations:** Official freq range starts at 325 MHz (hackable to ~70 MHz), USB 2.0 limits streaming to ~4-5 MSPS, ~20 ppm oscillator
- **Defense use:** Rapid EW prototyping, Python-based signal processing, standalone embedded deployments

#### Ettus USRP B210 ($1,119) — Research Standard
- **Chipset:** AD9361 + Xilinx Spartan-6
- **Best for:** Professional research, cellular networks (srsRAN, OpenBTS), precision measurements
- **Dynamic range:** ~72-84 dB (best-in-class calibration)
- **Key advantage:** Gold standard for research, best driver support (UHD), GPSDO option, MIMO 2x2
- **Limitations:** Price, power consumption
- **Defense use:** Full-scale cellular EW research, precision SIGINT, academic-grade measurement, production systems

#### KrakenSDR ($349) — Direction Finding Specialist
- **Chipset:** 5x RTL2832U + R820T2 (common clock)
- **Best for:** Radio direction finding, passive radar, beamforming, transmitter geolocation
- **Dynamic range:** ~48 dB per channel (8-bit)
- **Key advantage:** 5-channel phase-coherent receiver with automatic calibration, internal noise source, MUSIC algorithm DOA
- **Applications:** Fox hunting, illegal broadcast location, wildlife beacon tracking, search & rescue, drone transmitter geolocation
- **Software:** KrakenDAQ (Raspberry Pi), Android DF app, GNU Radio block (gr-krakensdr)
- **Defense use:** Locating rogue drone operators, finding unauthorized transmitters, passive air surveillance

### 1.3 Frequency Bands for Defense & Drone Operations

| Band | Frequency | Drone Usage | Detection Relevance |
|------|-----------|-------------|---------------------|
| **HF** | 3-30 MHz | Long-range comms, ionospheric | General SIGINT |
| **VHF** | 30-300 MHz | FM radio, aviation (118-136 MHz), marine | ATC monitoring, general comms |
| **UHF** | 300 MHz-1 GHz | Military UHF, GSM, some drone control | Cellular analysis, some drone links |
| **L-band** | 1-2 GHz | GPS L1 (1575.42 MHz), GLONASS, Galileo | GNSS monitoring, GPS spoofing detection |
| **S-band** | 2-4 GHz | WiFi (2.4 GHz), Bluetooth, many drone controls | Primary drone detection band |
| **C-band** | 4-8 GHz | WiFi 5 GHz, drone video links, radar | Drone video downlink detection |
| **X-band** | 8-12 GHz | Military radar, some SATCOM | Radar monitoring |

### 1.4 UK Legality of SDR Hardware

Under UK law:

- **Receiving only (RTL-SDR, etc.):** Legal to own and use for "general reception" (broadcasting, hobby radio). Scanner receivers are legal. Unauthorised interception of communications not intended for you may be an offence under Section 48 of the Wireless Telegraphy Act 2006.
- **TX-capable SDRs (HackRF, LimeSDR, BladeRF, PlutoSDR, USRP):** Legal to own. Legal to use for reception. **Transmission requires a licence** or must be done under a licence exemption (e.g., ISM bands at permitted power levels). Transmitting without a licence is a criminal offence.
- **No licence required for:** WiFi band reception, ADS-B reception, NOAA satellite reception, general spectrum monitoring
- **Key rule:** The device itself is not illegal — how you use it determines legality.

---

## 2. GNU Radio & EW Tools

### 2.1 GNU Radio Companion

GNU Radio is the open-source signal processing framework at the heart of SDR. GNU Radio Companion (GRC) provides a visual drag-and-drop interface for building signal processing pipelines ("flowgraphs") without writing code.

**Key capabilities for EW:**
- Real-time spectrum analysis and visualization
- Custom demodulator/decoding pipeline construction
- Signal recording and playback
- Integration with virtually all SDR hardware via OsmoSDR/SoapySDR
- Python API for scripting and automation

**Installation:**
```bash
# Ubuntu/Debian
sudo apt install gnuradio gnuradio-dev

# Or use PyBOMBS for latest version
pip install pybombs
pybombs prefix init ~/gnuradio -a default
pybombs install gnuradio

# Or use DragonOS (preinstalled)
```

### 2.2 Key GNU Radio Out-of-Tree (OOT) Modules

| Module | Purpose | SDR Hardware | Status |
|--------|---------|-------------|--------|
| **gr-gsm** | GSM signal reception, decoding, sniffing | RTL-SDR, HackRF, USRP, LimeSDR | Active |
| **gr-limesdr** | Native LimeSDR device support | LimeSDR family | Active |
| **gr-iio** | Analog Devices IIO device support (PlutoSDR) | PlutoSDR, AD936x | Active |
| **gr-adsb** | ADS-B aircraft transponder decoding | All SDRs via OsmoSDR | Active (gr3.10) |
| **gr-air-modes** | ADS-B/Mode-S receiver | USRP | Stable |
| **gr-krakensdr** | KrakenSDR direction finding blocks | KrakenSDR | Beta |
| **gr-radar** | Radar signal processing toolbox | UHD | Active |
| **gr-nacl** | Crypto integration (NaCl library) | N/A | Niche |
| **gr-ldpc** | LDPC coding for satellite comms | N/A | Research |
| **gr-lte** | LTE signal processing (limited) | USRP, HackRF | Experimental |
| **gr-dvbt** | DVB-T transmitter | Various | Stable |
| **gr-iridium** | Iridium satellite decoding | RTL-SDR | Active |

### 2.3 gr-gsm — GSM Analysis Toolkit

The legendary gr-gsm provides tools for receiving GSM transmissions:

```bash
# Installation (Ubuntu 20.04+)
sudo apt install cmake autoconf libtool pkg-config build-essential \
  libcppunit-dev swig doxygen liblog4cpp5-dev gnuradio-dev gr-osmosdr \
  libosmogsm10 libosmosdr libosmocodec0 libosmocore-dev

git clone https://github.com/ptrkrysik/gr-gsm.git
cd gr-gsm && mkdir build && cd build
cmake .. && make && sudo make install && sudo ldconfig
```

**Included tools:**
- `grgsm_scanner` — Scan GSM bands, list nearby base stations (BTS)
- `grgsm_livemon` — Interactive monitor of a single GSM control channel
- `grgsm_decode` — Decode captured GSM signals (control + traffic channels)
- `grgsm_capture` — Record GSM signals to file for later analysis

**Defense applications:** GSM spectrum survey, identifying unauthorized base stations (IMSI catchers), cellular interference analysis.

### 2.4 gr-adsb — Aircraft Tracking

```bash
git clone -b maint-3.10 https://github.com/mhostetter/gr-adsb
cd gr-adsb && mkdir build && cd build
cmake .. && make && sudo make install && sudo ldconfig
```

Decodes ADS-B Extended Squitter messages (DF 17/18), displays aircraft positions on Google Maps via built-in web server. Essential for airspace situational awareness.

### 2.5 gr-limesdr / gr-iio — Hardware Support

Native device blocks for LimeSDR and PlutoSDR respectively. Required for TX operations and advanced features on these platforms.

### 2.6 DragonOS — Pre-Built EW Linux Distribution

**DragonOS** is a Lubuntu-based Linux distribution with virtually every SDR/EW tool preinstalled. This is the fastest way to get operational.

**Key pre-installed tools for EW:**
- GNU Radio 3.8+, GQRX, CubicSDR, SDRangel
- SDR++ (with server capability)
- Universal Radio Hacker (URH)
- gr-gsm, gr-adsb, gr-air-modes
- Inspectrum (signal analysis)
- Kismet (WiFi/Bluetooth detection)
- KrakenSDR DAQ + DF Aggregator
- LTE-Cell-Scanner, srsRAN
- OP25 (P25 digital radio decoder)
- Wireshark, Ubertooth (Bluetooth)
- RTL_433 (IoT/weather sensor decoder)
- SatDump (satellite decoding)
- fldigi, QSSTV, WSJT-X
- Airspy ADS-B decoder
- dump1090 (ADS-B)
- Multimon-ng (pager decoding)
- SDRTrunk (trunked radio)

**Download:** DragonOS FocalX (22.04-based) or DragonOS Focal (20.04-based)

---

## 3. Drone RF Detection & Analysis

### 3.1 DroneRF Dataset

The **DroneRF dataset** is the seminal open dataset for drone RF fingerprinting:

- **227 recorded segments** from 3 different drones (Bebop, AR Drone, Phantom)
- **6 flight modes:** OFF, ON/connected, hovering, flying, flying + video recording, background (no drone)
- **40+ GB** of raw RF signal data (I/Q samples)
- **2.4 GHz band** captured using dual NI-USRP-2943R receivers (80 MHz total bandwidth)
- **Format:** CSV files with metadata encoded in filenames (Binary Unique Identifier)

**Download:** https://doi.org/10.17632/f4c2b4n755.1 (Mendeley Data)
**Code:** https://github.com/al-sad/DroneRF (MATLAB + Python classification scripts)

**Classification approaches tested:**
- Binary GLM with ElasticNet: 95% balanced accuracy
- Random Forest (binary): 99% balanced accuracy
- Random Forest (multiclass): 88% mean balanced accuracy

### 3.2 Additional RF Datasets

| Dataset | Content | Size | Link |
|---------|---------|------|------|
| **Noisy Drone RF Signal Classification** | Synthetic drone RF with SNR variations | ~10K samples | Kaggle |
| **DroneRF-Extended** | Additional drone types and environments | Variable | Academic papers |
| **RFUAV** | Chinese academic drone RF dataset | Multi-GB | IEEE papers |

### 3.3 DJI Drone Protocol Analysis

DJI drones use proprietary protocols:
- **OcuSync 2.0/3.0/4.0** — DJI's proprietary HD video/control link
- **DJI DroneID / Aeroscope** — Broadcasts drone serial, position, pilot location (partially reverse engineered)
- **Remote ID (FAA/EU compliant)** — Standard WiFi/Bluetooth broadcasts

**Open source Remote ID detection tools:**
- **OpenDroneID Core C Library** (https://github.com/opendroneid/opendroneid-core-c) — Reference implementation
- **Wireshark Dissector** (https://github.com/opendroneid/wireshark-dissector) — Decode Remote ID in Wireshark
- **ESP32 Remote ID Scanner** — See Mesh-Mapper below
- **DroneScanner app** — Open source Android/iOS Remote ID receiver

### 3.4 RF-Based Drone Detection Approaches

| Technique | How It Works | Hardware | Effectiveness |
|-----------|-------------|----------|---------------|
| **Spectrum Energy Detection** | Detect energy spikes in known drone bands | RTL-SDR, any RX | Basic, many false positives |
| **Spectrogram + CNN** | Convert RF to spectrogram images, classify with CNN | RTL-SDR + GPU | Good with training data |
| **I/Q Signal Classification** | Direct ML on raw I/Q samples | SDR + computer | Best accuracy |
| **Protocol-Specific Detection** | Look for known drone control protocols | RTL-SDR, WiFi | High accuracy, protocol-dependent |
| **Remote ID Sniffing** | Decode FAA-mandated WiFi/BT broadcasts | ESP32, WiFi dongle | Excellent for compliant drones |
| **Direction Finding** | Triangulate drone transmitter location | KrakenSDR (5 coherent) | Excellent for geolocation |

### 3.5 Key Drone RF Signatures

| Drone System | Frequency | Signal Type | Detection Method |
|-------------|-----------|-------------|------------------|
| DJI OcuSync 2.0 | 2.4 GHz / 5.8 GHz | Proprietary FHSS | Energy detection, protocol analysis |
| DJI OcuSync 3.0 | 2.4 GHz / 5.8 GHz | Proprietary OFDM | WarDragon detection kit |
| DJI Lightbridge | 2.4 GHz | Proprietary | Energy detection |
| Standard WiFi drones | 2.4 GHz / 5 GHz | 802.11 | WiFi sniffer (Kismet) |
| FPV analog video | 5.8 GHz ( Raceband) | Analog FM | RSSI scanning |
| 900 MHz long-range | 915 MHz (US) / 868 MHz (EU) | Various | Sub-GHz scanning |
| GPS/GNSS | 1575.42 MHz (L1) | GPS signals | GNSS monitoring |
| Remote ID | 2.4 GHz (WiFi/BT) | ASTM F3411 | ESP32/WiFi decoder |

---

## 4. Counter-Drone Systems (Open Source)

### 4.1 Batear — $10 Acoustic Drone Detector

**Website:** https://batear.io
**GitHub:** https://github.com/batear-io/batear

Batear is an ultra-low-cost acoustic drone detector built on ESP32-S3:

- **Hardware:** ESP32-S3 + MEMS microphone (ICS-43434)
- **Detection:** Real-time spectral analysis at the edge — no cloud needed
- **Alerting:** AES-128-GCM encrypted LoRa packets, MQTT auto-discovery
- **Range:** Line-of-sight acoustic detection (hundreds of meters depending on drone)
- **Power:** Low enough for solar/battery operation
- **Field testing:** Currently being tested in Ukraine in active EW environments
- **Integration:** Home Assistant via MQTT, JSON output for custom systems

**Build cost:** ~$10-15 per node (ESP32-S3 + microphone module)

**3 build modes:**
1. **Detector:** Mic + LoRa TX (battery powered, remote)
2. **Gateway:** LoRa RX + OLED + MQTT bridge
3. **Wired Detector:** Mic + Ethernet/PoE + MQTT (permanent install)

```bash
git clone https://github.com/batear-io/batear.git
cd batear
# Build detector
idf.py -B build_detector -DSDKCONFIG=build_detector/sdkconfig \
  -DSDKCONFIG_DEFAULTS="sdkconfig.defaults;sdkconfig.detector" \
  set-target esp32s3
idf.py -B build_detector -DSDKCONFIG=build_detector/sdkconfig build
```

### 4.2 WarDragon — Field-Ready Drone Detection Kit

**Website:** https://cemaxecuter.com

WarDragon is a portable, field-ready drone detection system built on DragonOS:

**Components:**
- ARM/x86 processor (DragonOS preloaded)
- Custom SDR (DJI OcuSync 2/3/4 detection)
- Dual-band WiFi dongle (Remote ID via 2.4/5 GHz)
- Bluetooth 5 dongle (BT Remote ID)
- Hardened Pelican-style carry case
- External SMA antenna connections
- 12V/24V DC + 120V AC power

**Detection capabilities:**
- Remote ID via WiFi (2.4/5 GHz) and Bluetooth
- DJI OcuSync 2/3 activity detection
- DJI OcuSync 4 awareness (with DragonScope subscription)
- RF activity monitoring across supported bands

**Integration outputs:**
- ATAK/TAK compatible (CoT output)
- 4DV Analytics
- WarDragon Analytics (multi-node aggregation)
- Custom endpoint push

**Price range:** Contact for pricing (professional system, likely $2K-5K+)

### 4.3 Mesh-Mapper — ESP32 Remote ID Detector

**GitHub:** https://github.com/colonelpanichacks/drone-mesh-mapper

Open-source drone Remote ID detection and mapping system:

- **Hardware:** XIAO ESP32-S3 (dual-core)
- **Simultaneous WiFi + Bluetooth** Remote ID monitoring
- Core 0: WiFi promiscuous mode (channel 6 default)
- Core 1: Bluetooth LE scanning (BT 4.0 + 5.0)
- **Web interface:** Python Flask app with real-time map (localhost:5000)
- **Meshtastic integration:** Distributed detection via LoRa mesh
- **Data export:** CSV, KML, FAA registration lookup
- **Multi-device:** Supports up to 3 ESP32 devices simultaneously

```bash
git clone https://github.com/colonelpanichacks/drone-mesh-mapper
# Flash with PlatformIO (remoteid_mesh_dualcore environment)
pip install flask>=2.0 flask-socketio>=5.0 pyserial>=3.5
python mapper.py  # Starts web interface
```

### 4.4 ESP32 Multi-Band Passive Drone Detector

GitHub topic search reveals active projects implementing:

- **900 MHz / 2.4 GHz / 5.8 GHz** RF scanning on ESP32
- Passive detection (no radio emission — legal)
- RSSI-based signal strength monitoring
- Multi-protocol support (FR/ODID/DJI/Parrot/ADS-B)
- Some include trajectory prediction
- C++ implementations on M5Stack CoreS3 and similar ESP32-S3 boards

### 4.5 OpenDroneID Ecosystem

The **OpenDroneID** project provides the reference implementation for ASTM F3411 Remote ID:

| Component | Link | Purpose |
|-----------|------|---------|
| Core C Library | github.com/opendroneid/opendroneid-core-c | Encode/decode Remote ID messages |
| Android Receiver | github.com/opendroneid/receiver-android | Android Remote ID app |
| Wireshark Dissector | github.com/opendroneid/wireshark-dissector | Decode in Wireshark |
| ArduRemoteID | github.com/ArduPilot/ArduRemoteID | ESP32-S3/C3 transmitter for ArduPilot |
| DroneScanner | github.com/dronetag/drone-scanner | Cross-platform scanner app |
| Linux Scanner | In opendroneid-core-c | WiFi NaN/Beacon + BT scanner |

### 4.6 DragonSync / WarDragon Analytics

Distributed detection node management:
- Multi-node aggregation
- Central map and dashboard
- ATAK/CoT output for tactical displays
- Detection correlation across nodes

### 4.7 KrakenSDR for Drone Operator Geolocation

Using 5 coherent receivers to locate the drone's *transmitter*:
1. Deploy KrakenSDR with 5-element antenna array
2. Run KrakenDAQ on Raspberry Pi 4/5
3. Use Android DF app for mobile operations
4. Correlative interferometry + MUSIC algorithm for DOA
5. Triangulate from multiple positions
6. Export bearings to DF Aggregator for multi-receiver fusion

**Use case:** When you detect a drone, KrakenSDR tells you where the *operator* is standing.

### 4.8 Counter-Drone System Comparison

| System | Cost | Detection Method | Range | Output | Best For |
|--------|------|-----------------|-------|--------|----------|
| **Batear** | $10/node | Acoustic | ~200m | LoRa/MQTT | Perimeter, low-cost deployment |
| **Mesh-Mapper** | $15/node | Remote ID (WiFi/BT) | ~350m | Web/Mesh/CSV | Remote ID compliance monitoring |
| **ESP32 RF Scanner** | $20/node | Multi-band RSSI | ~100m | Serial/WiFi | Spectrum presence detection |
| **RTL-SDR + GQRX** | $40 | Spectrum energy | Variable | Visual | Manual spectrum monitoring |
| **WarDragon Pro** | $2K-5K | Multi-SDR fusion | 1km+ | ATAK/Analytics | Professional mobile deployment |
| **KrakenSDR + Pi** | $400 | Direction finding | Variable | Android/DF | Operator geolocation |
| **DragonOS + SDR** | $100-500 | Full SDR toolkit | Variable | Multiple | Comprehensive EW analysis |

---

## 5. Electronic Warfare Techniques (Legal Framework)

### 5.1 Jamming Techniques Overview

| Technique | Description | Target | Risk Level |
|-----------|-------------|--------|------------|
| **Barrage jamming** | Wideband noise across entire frequency band | All signals in band | Maximum collateral damage |
| **Spot jamming** | Narrow, focused noise on specific frequency | Single channel/link | Moderate collateral risk |
| **Sweep jamming** | Rapidly hopping narrowband noise across band | Frequency-hopping systems | Requires synchronization |
| **Deceptive jamming** | Fake signals mimicking real ones | Navigation/control systems | Sophisticated, hard to detect |
| **GPS jamming** | Noise on L1 (1575.42 MHz) | GNSS receivers | Illegal in virtually all contexts |
| **GPS spoofing** | Fake GPS signals overriding real ones | GNSS receivers | Highly illegal, dangerous |

### 5.2 Open-Source GPS Spoofing Research Tool

**gps-sdr-sim** (https://github.com/osqzss/gps-sdr-sim) is the primary open-source GPS signal simulator:

- Generates GPS baseband I/Q signal data streams
- Supports user-defined trajectory (CSV or NMEA GGA stream)
- Uses real broadcast ephemeris (RINEX navigation files from NASA)
- Compatible with: HackRF, BladeRF, LimeSDR, PlutoSDR, USRP

```bash
git clone https://github.com/osqzss/gps-sdr-sim.git
cd gps-sdr-sim && gcc gpssim.c -lm -O3 -o gps-sdr-sim

# Generate static location GPS signal
./gps-sdr-sim -e brdc3540.14n -l 35.681298,139.766247,10.0 -b 8 -d 300
# -e: ephemeris file, -l: lat,lon,alt, -b: 8-bit IQ, -d: duration 300s

# Transmit with HackRF
hackrf_transfer -t gpssim.bin -f 1575420000 -s 2600000 -a 1 -x 0
```

**Forks for real-time TX:**
- `bladeGPS` — Real-time for BladeRF
- `LimeGPS` — Real-time for LimeSDR
- `multi-sdr-gps-sim` — Multi-SDR real-time support

### 5.3 UK Legal Framework — CRITICAL READING

#### The Wireless Telegraphy Act 2006

The WTA 2006 is the primary legislation governing radio spectrum use in the UK. Key provisions:

**Section 8(1) — Licence Required:**
> "It is unlawful (a) to establish or use a wireless telegraphy station, or (b) to install or use wireless telegraphy apparatus, except under and in accordance with a licence granted under this section by Ofcom."

**Section 68(1) — Interference Offence:**
> It is illegal to use any apparatus for the purpose of interfering with wireless telegraphy without authority.

**Maximum penalty:** Up to 2 years imprisonment and/or an unlimited fine.

#### What Is LEGAL in the UK

| Activity | Legal Status | Notes |
|----------|-------------|-------|
| **Owning SDR hardware** | LEGAL | No restrictions on possession |
| **Receiving broadcast signals** | LEGAL | General reception exemption |
| **Receiving ADS-B** | LEGAL | Aircraft transponder signals |
| **Receiving Remote ID** | LEGAL | Drones broadcast for public reception |
| **Spectrum monitoring** | LEGAL | Passive observation |
| **Building/acquiring jammers** | LEGAL to own | But ILLEGAL to use (except authorised) |
| **Selling jammers** | ILLEGAL | EMC Regulations 2016 — criminal offence |
| **Using jammers** | ILLEGAL | Without specific Ofcom authorisation |
| **GPS spoofing (any use)** | ILLEGAL | Deliberate interference offence |
| **Protocol research in shielded room** | LEGAL | With innovation licence from Ofcom |
| **Jamming research (shielded)** | LEGAL | With Ofcom trial/innovation licence |
| **Drone detection (passive)** | LEGAL | No licence required for passive detection |

#### Ofcom Innovation & Trial Licences

Ofcom may issue **innovation and trial licences** that authorise:
- Research and testing
- Demonstration of technology
- Deliberate self-interference (including jamming) **within a controlled test environment**

**Requirements:**
- Tests must be remote, shielded, or low power
- No risk of interference outside the test area
- Cannot be used for commercial or operational use
- Application must demonstrate controlled conditions

Apply through Ofcom's Spectrum Management Centre.

#### Who CAN Lawfully Use Jammers in the UK

1. **Crown use** (Government)
2. **Intelligence agencies** (MI5, MI6, GCHQ)
3. **Defence use** (MoD, including defence contractors)
4. **Police and law enforcement** (with Home Office approval)
5. **Prisons** (Crown exemption)
6. **Critical national infrastructure** (airports, power stations — under specific Ofcom authorisation)

**Private individuals, security firms, and commercial operators CANNOT lawfully use jammers.**

#### Practical Implications for DEFONEOS

| What You CAN Do | What You CANNOT Do |
|-----------------|-------------------|
| Build and sell **passive detection** systems | Build and sell **jamming** systems to general public |
| Develop jamming algorithms in **shielded environments** | Deploy jammers at customer sites |
| Research GPS spoofing **detection** (receive only) | Transmit GPS spoofing signals (any context) |
| Provide **detection + alerting** systems | Provide **interdiction** (jamming, takeover) systems |
| Apply for **innovation licences** for R&D | Use jamming in demonstrations without licence |
| Build reference jamming hardware for **licensed users** | Operate as a "counter-drone service provider" using jamming |
| Train users on **detection-only** workflows | Train users on jamming techniques |

### 5.5 Research vs. Deployment Boundary

For DEFONEOS, the clear legal boundary:

```
+---------------------------------------------------------------+
|  RESEARCH & DEVELOPMENT (LEGAL with care)                     |
|  - Building detection systems                                 |
|  - RF analysis and classification algorithms                  |
|  - Jamming/spoofing simulation in shielded environments       |
|  - Hardware design and prototyping                            |
|  - Academic collaboration                                     |
+---------------------------------------------------------------+
                              |
                              | Ofcom licence required
                              v
+---------------------------------------------------------------+
|  DEPLOYMENT (RESTRICTED)                                      |
|  - Operational jamming: Crown/MoD/Police only                 |
|  - Detection systems: Legal for all (passive only)            |
|  - Spoofing: Illegal for all (no licence available)           |
+---------------------------------------------------------------+
```

### 5.6 Recommended DEFONEOS Legal Strategy

1. **Focus exclusively on detection, classification, and alerting** (no jamming/spoofing)
2. **Build modular architecture** that separates detection from effector control
3. **Partner with licensed defence contractors** for jamming effector integration
4. **Apply for Ofcom innovation licences** for any R&D involving active transmission
5. **Document all testing** in shielded environments with licence evidence
6. **Never demonstrate jamming** at public events or customer sites
7. **Position as "drone awareness platform"** rather than "counter-drone system"

---

## 6. Signal Intelligence (SIGINT) Tools

### 6.1 Tool Comparison Matrix

| Tool | Purpose | Platform | SDR Support | Cost |
|------|---------|----------|-------------|------|
| **Universal Radio Hacker (URH)** | Protocol reverse engineering, fuzzing, simulation | Win/Linux/Mac | RTL-SDR, HackRF, BladeRF, LimeSDR, Pluto, USRP | Free |
| **URH-NG** | Next-gen URH with 327-protocol auto-ID, automotive crypto | Win/Linux/Mac | All above + HydraSDR, Signal Hound | Free |
| **SDRangel** | Full SDR receiver/server with TX, multiple decoders | Win/Linux/Mac/Android | RTL-SDR, HackRF, BladeRF, LimeSDR, Pluto, USRP, Airspy, SDRplay | Free |
| **GQRX** | General-purpose SDR receiver with FFT | Win/Linux/Mac | RTL-SDR, HackRF, Airspy, SDRplay (via Soapy) | Free |
| **CubicSDR** | Cross-platform SDR receiver | Win/Linux/Mac | All via SoapySDR | Free |
| **Inspectrum** | Signal analysis, spectrogram, symbol extraction | Linux/Mac | File-based (any SDR recorder) | Free |
| **SigDigger** | Advanced signal analysis with built-in decoders | Linux | RTL-SDR, File | Free |
| **Baudline** | Time-frequency browser, signal analysis | Linux | File-based | Free (non-commercial) |
| **fldigi** | Digital modes decoder (PSK, RTTY, etc.) | Win/Linux/Mac | Audio interface | Free |
| **QSSTV** | SSTV (slow-scan TV) decoding/encoding | Linux | Audio interface | Free |
| **Kismet** | Wireless network detector (WiFi, Bluetooth, BLE) | Linux | WiFi adapters, BT dongles | Free |
| **Wireshark** | Protocol analyzer (can dissect many RF protocols) | Win/Linux/Mac | Via plugins | Free |
| **SatDump** | Satellite decoding (NOAA, MetOp, etc.) | Win/Linux | RTL-SDR, SDRplay | Free |

### 6.2 Universal Radio Hacker (URH) — Deep Dive

URH is the premier tool for reverse-engineering unknown wireless protocols:

**Four-phase workflow:**
1. **Interpretation** — Demodulate raw signals (auto-detects ASK, FSK, PSK)
2. **Analysis** — Decode bits, assign protocol fields, infer structure
3. **Generation** — Create modified messages, fuzz protocol fields
4. **Simulation** — Model stateful protocols, perform stateful attacks

**URH-NG enhancements:**
- Auto protocol identification against 327 known protocols
- Automotive RF crypto toolkit (23 ciphers)
- Support for HydraSDR, Harogic analyzers, Signal Hound BB60

```bash
# Install URH-NG
git clone https://github.com/PentHertz/urh-ng.git
cd urh-ng && pip install -e .

# Or install original URH
pip install urh
```

### 6.3 SDRangel — Multi-Device SDR Server

SDRangel is a professional-grade SDR application with unique features:

- **Multiple devices simultaneously** — Monitor multiple frequency bands
- **TX support** — Full transmit capability for HackRF, BladeRF, LimeSDR, PlutoSDR
- **Built-in decoders:** ADS-B, AIS, DMR, D-Star, LoRa, POCSAG, Packet, FT8, and 20+ more
- **REST API** — Remote control for integration with other systems
- **Server mode** — Headless operation for remote deployment
- **RF Heat Map** — Spectrum usage visualization
- **Frequency scanner** — Automated band scanning

**Hardware requirements:** Core i7 (2015+), 8GB+ RAM, USB 3.0, OpenGL 3.0+

```bash
# Ubuntu install
sudo snap install sdrangel

# Or build from source
git clone https://github.com/f4exb/sdrangel.git
cd sdrangel && mkdir build && cd build
 cmake .. && make -j$(nproc) && sudo make install
```

### 6.4 Inspectrum — Signal Analysis

Inspectrum is essential for visual signal analysis:
- High-resolution spectrogram display
- Symbol extraction and timing analysis
- Export of symbols for further processing
- Ideal for analyzing captured drone signals, unknown transmissions

```bash
sudo apt install inspectrum
# Or build from source
git clone https://github.com/miek/inspectrum.git
```

### 6.5 Kismet — Wireless Detection

Kismet is the gold standard for wireless network detection:
- Detects WiFi, Bluetooth, BLE, Zigbee, and more
- Passive monitoring (no transmission — legal)
- Can identify drone WiFi/BT signatures
- Web-based dashboard
- REST API for integration

```bash
sudo apt install kismet
# Or latest from kismetwireless.net
```

### 6.6 SigDigger — Advanced Signal Analysis

SigDigger provides deep signal inspection:
- Real-time FFT and spectrogram
- Constellation diagrams
- Symbol slicing and analysis
- Built-in decoders
- Native RTL-SDR support

```bash
# Install dependencies, then
git clone https://github.com/BatchDrake/SigDigger.git
cd SigDigger && ./configure && make && sudo make install
```



---

## 7. The MEOK Labs EW Build List

### 7.1 Phase 1: $100 Budget — Foundation RF Monitoring Station

**Purpose:** Get started with RF monitoring, ADS-B tracking, basic drone awareness, and signal exploration.

| Item | Component | Cost (USD) | Source |
|------|-----------|------------|--------|
| SDR | RTL-SDR Blog V4 + dipole antenna kit | $35 | rtl-sdr.com |
| Computer | Raspberry Pi 4 (4GB) + 32GB SD + case | $55 | raspberrypi.com |
| PSU | USB-C 5V/3A power supply | $10 | Amazon/electronics supplier |
| | **TOTAL** | **$100** | |

**Software Stack:**

```bash
# Install DragonOS Pi image (prebuilt SD card image)
# Or install manually:
sudo apt update && sudo apt install -y rtl-sdr gqrx-sdr dump1090-mutability \
  kismet wireless-tools

# ADS-B aircraft tracking
dump1090 --device-index 0 --interactive --net

# Basic spectrum monitoring
rtl_power -f 24M:1700M:1M -e 1h scan.csv  # Full band sweep

# WiFi drone detection
sudo kismet -c wlan0  # Detect WiFi-enabled drones
```

**Capabilities:**
- ADS-B aircraft tracking (local web map at localhost:8080)
- Full spectrum monitoring (24 MHz - 1.7 GHz)
- FM/AM radio reception
- NOAA weather satellite image reception
- Basic WiFi drone detection (Kismet)
- Signal recording for later analysis
- RF survey of local environment
- Foundation for future upgrades

**Limitations:**
- RX only (no TX capability)
- 8-bit dynamic range
- 3.2 MHz max bandwidth
- Single channel
- No direction finding

---

### 7.2 Phase 2: $500 Budget — Full-Spectrum EW Monitoring

**Purpose:** Add TX/RX capability, wider spectrum coverage, protocol analysis, and drone-specific detection.

| Item | Component | Cost (USD) | Source |
|------|-----------|------------|--------|
| SDR RX | RTL-SDR Blog V4 (keep from Phase 1) | $0 | Already owned |
| SDR TX/RX | HackRF One (official or quality clone) | $150-340 | Great Scott Gadgets |
| Computer | Raspberry Pi 4 (4GB) or used Intel NUC | $55-150 | Various |
| Antenna | Wideband discone (100 MHz - 1.3 GHz) | $40 | Amazon/Nooelec |
| Antenna | 2.4 GHz directional panel + 5.8 GHz antenna | $25 | AliExpress/Amazon |
| RF Cables | SMA cables + adapters kit | $20 | Various |
| LNA | Wideband LNA (bias-tee powered) | $15 | Nooelec/eBay |
| Attenuator | 30dB attenuator (for TX testing) | $10 | Amazon |
| Case | Plastic project box + standoffs | $15 | Hardware store |
| Storage | 128GB SD card (recording) | $15 | Amazon |
| PSU | Powered USB 3.0 hub | $15 | Amazon |
| | **TOTAL** | **~$500** | |

**Software Stack:**

```bash
# DragonOS (full install on NUC) or Raspberry Pi build:
sudo apt install -y gnuradio gnuradio-dev gqrx-sdr hackrf \
  gr-osmosdr soapy-sdr-all rtl-sdr kismet wireshark \
  inspectrum urh sdrangel

# GNU Radio with gr-gsm
git clone https://github.com/ptrkrysik/gr-gsm.git
cd gr-gsm && mkdir build && cd build && cmake .. && make && sudo make install

# GNU Radio with gr-adsb
git clone -b maint-3.10 https://github.com/mhostetter/gr-adsb
cd gr-adsb && mkdir build && cd build && cmake .. && make && sudo make install

# Install URH-NG for protocol analysis
git clone https://github.com/PentHertz/urh-ng.git
cd urh-ng && pip install -e .

# HackRF tools
hackrf_info           # Verify HackRF
hackrf_sweep -f 0:6000 -w 1000000 -l 32 -g 20  # Full spectrum sweep

# GSM scanning
grgsm_scanner --band=GSM900
grgsm_livemon --band=GSM900 --gain=30

# ADS-B decoding
gr-adsb web server: python3 -m gnuradio.adsb.webserver
```

**Capabilities:**
- Everything from Phase 1, PLUS:
- **Full 1 MHz - 6 GHz TX/RX coverage**
- GSM signal analysis and decoding
- ADS-B aircraft tracking with GNU Radio
- **Universal Radio Hacker protocol reverse engineering**
- Signal recording, replay, and analysis
- Basic signal generation (test signals, calibration)
- WiFi + Bluetooth drone detection
- **FPV drone video signal detection** (5.8 GHz)
- **Remote ID detection preparation**
- Wideband spectrum analysis with hackrf_sweep
- Inspectrum deep signal analysis
- SDRangel multi-mode decoding

**New capabilities unlocked:**
- Can transmit signals (under licence or in shielded environments)
- Can capture and analyze virtually any signal in the 0-6 GHz range
- Can reverse-engineer unknown drone control protocols
- Can build custom detection algorithms

---

### 7.3 Phase 3: $2,000 Budget — Full EW Monitoring Station

**Purpose:** Professional-grade multi-channel RF monitoring, direction finding, drone detection network, and real-time integration with DEFONEOS.

| Item | Component | Cost (USD) | Source |
|------|-----------|------------|--------|
| Primary SDR | Ettus USRP B210 (MIMO 2x2) OR BladeRF 2.0 xA4 | $540-1,119 | Ettus Research / Nuand |
| DF SDR | KrakenSDR (5 coherent RX) | $349 | krakenrf.com |
| RX SDRs | RTL-SDR V4 (x3 for multi-band monitoring) | $105 | rtl-sdr.com |
| Computer | Intel NUC i5/i7 (used) OR new Mini PC | $200-400 | Amazon/Intel |
| Router | 4G/5G router for remote access | $80 | Various |
| Directional | Log-periodic 400 MHz - 6 GHz directional | $60 | Amazon/Nooelec |
| Antennas | 5x Krakentenna (KrakenSDR dipole set) | $50 | krakenrf.com |
| Antennas | 2.4/5 GHz omnidirectional + directional set | $50 | Various |
| Cables | Quality SMA cables (LMR200/LMR400) + splitter | $80 | Various |
| GPS | GPSDO or GPS module for timing sync | $40 | Amazon/eBay |
| LNA | Low-noise amplifiers for each band | $60 | Nooelec |
| PSU | Quality 12V/5A PSU + distribution | $30 | Amazon |
| Enclosure | 19" rackmount case OR pelican-style field case | $100 | Amazon/Pelican |
| Cooling | Fans + heatsinks for continuous operation | $30 | Amazon |
| Storage | 1TB SSD for recording and OS | $50 | Amazon |
| Misc | Connectors, adapters, ferrites, power pole | $50 | Various |
| | **TOTAL** | **~$2,000** | |

**Software Stack:**

```bash
# Install DragonOS FocalX on Intel NUC for best compatibility
# Or Ubuntu 22.04 LTS with custom SDR stack:

# Full GNU Radio + UHD (USRP)
sudo apt install -y gnuradio gnuradio-dev uhd-host libuhd-dev

# All SDR libraries
sudo apt install -y librtlsdr-dev libhackrf-dev libbladerf-dev \
  limesuite libiio-dev libuhd-dev libairspy-dev soapysdr-tools \
  soapysdr-module-all

# GNU Radio OOT modules
git clone https://github.com/ptrkrysik/gr-gsm.git
cd gr-gsm && mkdir build && cd build && cmake .. && make && sudo make install

git clone -b maint-3.10 https://github.com/mhostetter/gr-adsb
cd gr-adsb && mkdir build && cd build && cmake .. && make && sudo make install

git clone https://github.com/krakenrf/gr-krakensdr.git
cd gr-krakensdr && mkdir build && cd build && cmake .. && make && sudo make install

# KrakenSDR software
git clone https://github.com/krakenrf/krakensdr_doa.git
pip install -r krakensdr_doa/requirements.txt

# SDRangel (server mode for remote access)
sudo snap install sdrangel

# URH-NG
git clone https://github.com/PentHertz/urh-ng.git
cd urh-ng && pip install -e .

# Kismet (WiFi/BT drone detection)
sudo apt install -y kismet kismet-capture-linux-wifi

# Detection pipeline dependencies
pip install numpy scipy matplotlib scikit-learn tensorflow \
  pyserial requests flask flask-socketio zmq pyzmq paho-mqtt
```

**Capabilities:**

| Capability | Hardware | Software |
|------------|----------|----------|
| **Multi-band simultaneous monitoring** | 3x RTL-SDR + USRP | GNU Radio multi-source |
| **Direction finding (operator geolocation)** | KrakenSDR + 5 antennas | KrakenSDR DAQ + DF Aggregator |
| **Full-spectrum TX/RX** | USRP B210 / BladeRF | GNU Radio TX/RX flowgraphs |
| **ADS-B aircraft tracking** | RTL-SDR | gr-adsb / dump1090 |
| **GSM signal analysis** | USRP / HackRF | gr-gsm suite |
| **WiFi/BT drone detection** | WiFi/BT dongles | Kismet + custom parser |
| **Remote ID decoding** | WiFi dongle | Wireshark dissector + Python |
| **Protocol reverse engineering** | USRP (best dynamic range) | URH-NG |
| **Signal recording (multi-channel)** | All SDRs | GNU Radio file sinks |
| **Real-time streaming to server** | 4G router + network | rtl_tcp / SDRangel server |
| **Multi-node correlation** | Networked setup | DF Aggregator + custom |

**Station Configuration:**

```
+----------------------------------------------------------+
|                  EW MONITORING STATION                    |
|                                                           |
|  +------------------+  +------------------+              |
|  |  RTL-SDR #1      |  |  RTL-SDR #2      |              |
|  |  ADS-B (1090MHz) |  |  General RX      |              |
|  +--------+---------+  +--------+---------+              |
|           |                     |                         |
|  +--------v---------+  +--------v---------+  +----------+|
|  |  USRP B210       |  |  RTL-SDR #3      |  |KrakenSDR ||
|  |  TX/RX + GSM/LTE |  |  Sub-GHz (433/   |  |5-Channel ||
|  |  + Wideband RX   |  |  868/915MHz)     |  |Direction ||
|  +--------+---------+  +--------+---------+  |Finding   ||
|           |                     |            +-----+----||
|           |     Intel NUC       |                  |    ||
|           +---------> +---------+------------------+    ||
|                      |                                   ||
|              +-------v--------+                          ||
|              |  4G Router     |                          ||
|              |  Remote Access |                          ||
|              +----------------+                          ||
|                                                           |
|  Antennas:                                                |
|  - 1090 MHz ADS-B (vertically polarized)                  |
|  - Discone / wideband omnidirectional                     |
|  - 2.4/5 GHz dual-band (WiFi/Remote ID)                   |
|  - 5-element dipole array (KrakenSDR DF)                  |
|  - Sub-GHz flexible whip                                  |
+----------------------------------------------------------+
```

---

## 8. DEFONEOS Integration Architecture

### 8.1 System Overview

The DEFONEOS EW integration connects RF detection systems to the DEFONEOS C2 platform, displaying RF detections on the Cesium globe and enabling real-time alerting.

```
+---------------------------------------------------------------------+
|                        RF DETECTION LAYER                           |
|  +----------+  +----------+  +----------+  +----------+            |
|  | RTL-SDR  |  | KrakenSDR|  | WiFi/BT  |  | Batear   |            |
|  | ADS-B    |  | Direction|  | RemoteID |  | Acoustic |            |
|  | Receiver |  | Finding  |  | Scanner  |  | Detector |            |
|  +----+-----+  +----+-----+  +----+-----+  +----+-----+            |
|       |             |             |             |                   |
+-------|-------------|-------------|-------------|-------------------+
        |             |             |             |
        v             v             v             v
+-------|-------------|-------------|-------------|-------------------+
|       |             |             |             |                   |
|  +----v-----+  +----v-----+  +----v-----+  +----v-----+            |
|  | ADS-B    |  | DF       |  | RemoteID |  | Acoustic |            |
|  | Parser   |  | Parser   |  | Parser   |  | Parser   |            |
|  | Python   |  | Python   |  | Python   |  | Python   |            |
|  +----+-----+  +----+-----+  +----+-----+  +----+-----+            |
|       |             |             |             |                   |
|  +----v-------------v-------------v-------------v-----+            |
|  |              EW MCP SERVER                          |            |
|  |  - Normalize detections to common schema            |            |
|  |  - Deduplicate signals                              |            |
|  |  - Classify threat level                            |            |
|  |  - Generate CoT (Cursor on Target) messages         |            |
|  |  - Publish to message bus                           |            |
|  +-----------------------+-----------------------------+            |
|                          |                                          |
|  +-----------------------v-----------------------------+            |
|  |              MESSAGE BUS (Redis/ZeroMQ/MQTT)        |            |
|  +-----------------------+-----------------------------+            |
|                          |                                          |
+--------------------------|------------------------------------------+
                           |
+--------------------------v------------------------------------------+
|                       DEFONEOS CORE                                |
|                                                                     |
|  +-----------------------v-----------------------------+            |
|  |              CoT INGESTION SERVICE                  |            |
|  |  - Receive CoT messages from EW MCP                 |            |
|  |  - Validate and enrich with metadata                |            |
|  |  - Store in detection database                      |            |
|  +-----------------------+-----------------------------+            |
|                          |                                          |
|  +-----------------------v-----------------------------+            |
|  |              CESIUM GLOBE DISPLAY                   |            |
|  |  - Real-time entity tracking                        |            |
|  |  - RF detection markers with classification         |            |
|  |  - Signal trail / heatmap overlay                   |            |
|  |  - Operator geolocation (from DF)                   |            |
|  +-----------------------+-----------------------------+            |
|                          |                                          |
|  +-----------------------v-----------------------------+            |
|  |              ALERTING PIPELINE                      |            |
|  |  - Threshold-based alerts                           |            |
|  |  - Anomaly detection                                |            |
|  |  - Multi-channel correlation                        |            |
|  |  - ATAK/FreeTAK CoT output                          |            |
|  +-----------------------------------------------------+            |
+---------------------------------------------------------------------+
```

### 8.2 EW MCP Server Design

The EW MCP (Mission Control Processor) Server is the central integration component.

**Architecture:**

```python
# ew_mcp_server.py — DEFONEOS EW MCP Server
"""
EW MCP Server: Normalizes RF detections and publishes CoT messages
"""

import asyncio
import json
import zmq
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
from typing import Optional

class DetectionType(Enum):
    ADSB_AIRCRAFT = "a-f-A-C"
    REMOTE_ID_DRONE = "a-f-G-U-H"
    WIFI_DRONE = "a-f-G-U-H-W"
    BLUETOOTH_DRONE = "a-f-G-U-H-B"
    ACOUSTIC_DRONE = "a-f-G-U-H-A"
    UNKNOWN_RF = "a-f-G-U-H-R"
    OPERATOR_SIGNAL = "a-f-G-U-H-O"

class ThreatLevel(Enum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class RFDetection:
    uid: str                    # Unique detection ID
    timestamp: datetime         # Detection time
    detection_type: DetectionType
    latitude: float
    longitude: float
    altitude: Optional[float]   # MSL altitude
    heading: Optional[float]    # Degrees
    speed: Optional[float]      # m/s
    frequency: Optional[float]  # MHz
    signal_strength: Optional[float]  # dBm
    source_sdr: str             # Which SDR detected
    confidence: float           # 0.0 - 1.0
    threat_level: ThreatLevel
    metadata: dict              # Protocol-specific data
    
    def to_cot(self) -> str:
        """Convert to Cursor on Target XML message"""
        return f"""<event version="2.0" uid="{self.uid}" type="{self.detection_type.value}" 
            time="{self.timestamp.isoformat()}" start="{self.timestamp.isoformat()}" 
            stale="{(self.timestamp + timedelta(minutes=5)).isoformat()}">
            <point lat="{self.latitude}" lon="{self.longitude}" 
                   hae="{self.altitude or 0}" ce="10" le="10"/>
            <detail>
                <contact callsign="{self.detection_type.name}"/>
                <status readiness="{self.threat_level.name}"/>
                <precisionlocation geopointsrc="GPS" altsrc="GPS"/>
                <color argb="-1"/>
                <usericon iconsetpath="COT_MAPPING_2525B/{self.threat_level.value}"/>
                <_RFDetection frequency="{self.frequency or ''}" 
                             signalStrength="{self.signal_strength or ''}"
                             source="{self.source_sdr}"
                             confidence="{self.confidence}"/>
            </detail>
        </event>"""

class EWMcpServer:
    """Central EW detection processor for DEFONEOS"""
    
    def __init__(self, config_path: str = "ew_config.json"):
        self.detections = {}          # uid -> RFDetection
        self.subscribers = set()      # WebSocket clients
        self.alert_handlers = []      # Alert callback functions
        
        # ZeroMQ messaging
        self.context = zmq.Context()
        self.publisher = self.context.socket(zmq.PUB)
        self.publisher.bind("tcp://*:5555")
        
        # Detection parsers
        self.parsers = {
            'adsb': self._parse_adsb,
            'remoteid': self._parse_remoteid,
            'kraken': self._parse_kraken_df,
            'batear': self._parse_batear,
            'kismet': self._parse_kismet,
        }
    
    async def ingest_detection(self, raw_data: dict, source: str):
        """Ingest a detection from any source SDR"""
        parser = self.parsers.get(source, self._parse_generic)
        detection = parser(raw_data)
        
        # Deduplication: merge if within 100m and 30s
        existing = self._find_duplicate(detection)
        if existing:
            self._merge_detection(existing, detection)
        else:
            self.detections[detection.uid] = detection
            await self._publish_detection(detection)
            await self._evaluate_alerts(detection)
    
    async def _publish_detection(self, detection: RFDetection):
        """Publish to all subscribers"""
        cot_msg = detection.to_cot()
        
        # ZeroMQ publish
        self.publisher.send_string(cot_msg)
        
        # WebSocket broadcast
        for ws in self.subscribers:
            await ws.send(json.dumps({
                'type': 'detection',
                'data': detection.__dict__
            }))
        
        # MQTT publish (for IoT integration)
        # mqtt_client.publish(f"defoneos/ew/{detection.detection_type.name}", 
        #                     json.dumps(detection.__dict__))
    
    def _evaluate_threat(self, detection: RFDetection) -> ThreatLevel:
        """Classify threat level based on detection parameters"""
        if detection.detection_type == DetectionType.ADSB_AIRCRAFT:
            return ThreatLevel.NONE  # Legitimate aircraft
        
        if detection.detection_type == DetectionType.REMOTE_ID_DRONE:
            # Check if in restricted airspace
            if self._in_restricted_zone(detection):
                return ThreatLevel.HIGH
            return ThreatLevel.LOW
        
        if detection.detection_type == DetectionType.UNKNOWN_RF:
            # Unknown RF in drone bands
            if detection.frequency and self._in_drone_band(detection.frequency):
                return ThreatLevel.MEDIUM
            return ThreatLevel.LOW
        
        return ThreatLevel.LOW
    
    async def _evaluate_alerts(self, detection: RFDetection):
        """Trigger alerts if thresholds exceeded"""
        if detection.threat_level.value >= ThreatLevel.HIGH.value:
            alert = {
                'type': 'HIGH_THREAT_DETECTED',
                'detection': detection.__dict__,
                'recommended_action': self._recommend_action(detection),
                'timestamp': datetime.utcnow().isoformat()
            }
            for handler in self.alert_handlers:
                await handler(alert)
```

### 8.3 Integration with FreeTAKServer

FreeTAKServer (FTS) is the open-source TAK server. DEFONEOS EW data flows into FTS as CoT messages.

```python
# freetak_ew_bridge.py
"""Bridge EW MCP Server output to FreeTAKServer"""

from FreeTAKServer.controllers.services import FTS as FTSServer
import zmq
import xml.etree.ElementTree as ET

class FreeTAKBridge:
    def __init__(self, fts_host: str = "127.0.0.1", fts_port: int = 8087):
        self.fts_host = fts_host
        self.fts_port = fts_port
        
        # Connect to EW MCP output
        self.context = zmq.Context()
        self.subscriber = self.context.socket(zmq.SUB)
        self.subscriber.connect("tcp://localhost:5555")
        self.subscriber.setsockopt_string(zmq.SUBSCRIBE, "")
    
    async def run(self):
        """Forward EW detections to FreeTAKServer"""
        while True:
            cot_message = self.subscriber.recv_string()
            
            # Parse CoT
            event = ET.fromstring(cot_message)
            uid = event.get('uid')
            event_type = event.get('type')
            
            # Send to FTS
            self._send_to_fts(cot_message)
            
            # Log for audit
            print(f"Forwarded detection {uid} type={event_type} to FTS")
    
    def _send_to_fts(self, cot_xml: str):
        """Send CoT message to FreeTAKServer"""
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((self.fts_host, self.fts_port))
        sock.sendall(cot_xml.encode())
        sock.close()
```

### 8.4 Cesium Globe Integration

Real-time RF detection display on the DEFONEOS Cesium globe:

```javascript
// cesium-ew-display.js — DEFONEOS Cesium EW Layer
/**
 * Displays EW RF detections on the Cesium globe
 */

class EWCesiumLayer {
    constructor(viewer) {
        this.viewer = viewer;
        this.detectionEntities = new Map();  // uid -> Entity
        this.ws = new WebSocket('ws://defoneos-server:8080/ew/stream');
        
        // WebSocket handlers
        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'detection') {
                this.updateDetection(msg.data);
            } else if (msg.type === 'remove') {
                this.removeDetection(msg.uid);
            }
        };
        
        // Heatmap primitive for signal density
        this.heatmapPrimitive = null;
        
        // Signal trail collections
        this.trailPolylines = new Map();
    }
    
    updateDetection(detection) {
        const uid = detection.uid;
        const type = detection.detection_type;
        const threat = detection.threat_level;
        const freq = detection.frequency;
        
        // Color by threat level
        const color = this._threatColor(threat);
        
        // Icon by detection type
        const billboard = this._typeIcon(type);
        
        if (this.detectionEntities.has(uid)) {
            // Update existing entity
            const entity = this.detectionEntities.get(uid);
            entity.position = Cesium.Cartesian3.fromDegrees(
                detection.longitude, 
                detection.latitude, 
                detection.altitude || 100
            );
            entity.billboard.color = color;
            entity.label.text = this._formatLabel(detection);
        } else {
            // Create new entity
            const entity = this.viewer.entities.add({
                id: uid,
                position: Cesium.Cartesian3.fromDegrees(
                    detection.longitude,
                    detection.latitude,
                    detection.altitude || 100
                ),
                billboard: {
                    image: billboard,
                    color: color,
                    scale: 0.5 + (detection.confidence * 0.5),
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                },
                label: {
                    text: this._formatLabel(detection),
                    font: '12px monospace',
                    fillColor: color,
                    pixelOffset: new Cesium.Cartesian2(0, -30)
                },
                ellipse: {
                    semiMinorAxis: detection.accuracy || 50,
                    semiMajorAxis: detection.accuracy || 50,
                    material: Cesium.Color.TRANSPARENT,
                    outline: true,
                    outlineColor: color.withAlpha(0.3),
                    outlineWidth: 1
                },
                description: this._buildDescription(detection)
            });
            
            // Add signal trail if movement detected
            if (detection.speed > 0) {
                this._addTrailPoint(uid, detection);
            }
            
            this.detectionEntities.set(uid, entity);
        }
        
        // Update heatmap
        this._updateHeatmap();
    }
    
    _threatColor(level) {
        const colors = {
            0: Cesium.Color.GREEN,
            1: Cesium.Color.BLUE,
            2: Cesium.Color.YELLOW,
            3: Cesium.Color.ORANGE,
            4: Cesium.Color.RED
        };
        return colors[level] || Cesium.Color.WHITE;
    }
    
    _formatLabel(detection) {
        let label = detection.detection_type;
        if (detection.frequency) {
            label += `\n${(detection.frequency / 1000).toFixed(3)} GHz`;
        }
        if (detection.signal_strength) {
            label += `\n${detection.signal_strength.toFixed(1)} dBm`;
        }
        return label;
    }
    
    _buildDescription(detection) {
        return `
        <h3>${detection.detection_type}</h3>
        <table>
            <tr><td>Time</td><td>${detection.timestamp}</td></tr>
            <tr><td>Position</td><td>${detection.latitude.toFixed(6)}, ${detection.longitude.toFixed(6)}</td></tr>
            <tr><td>Altitude</td><td>${detection.altitude || 'Unknown'} m</td></tr>
            <tr><td>Frequency</td><td>${detection.frequency || 'Unknown'} MHz</td></tr>
            <tr><td>Signal</td><td>${detection.signal_strength || 'Unknown'} dBm</td></tr>
            <tr><td>Confidence</td><td>${(detection.confidence * 100).toFixed(1)}%</td></tr>
            <tr><td>Threat</td><td>${detection.threat_level}</td></tr>
            <tr><td>Source</td><td>${detection.source_sdr}</td></tr>
        </table>
        `;
    }
    
    // Add signal density heatmap overlay
    _updateHeatmap() {
        const positions = [];
        const strengths = [];
        
        for (const [uid, detection] of this.detectionEntities) {
            positions.push(detection.longitude, detection.latitude);
            strengths.push(detection.signal_strength || -80);
        }
        
        // Update Cesium heatmap primitive
        if (this.heatmapPrimitive) {
            this.viewer.scene.primitives.remove(this.heatmapPrimitive);
        }
        
        this.heatmapPrimitive = this.viewer.scene.primitives.add(
            new Cesium.Primitive({
                // Custom heatmap shader material
                geometryInstances: new Cesium.GeometryInstance({
                    geometry: Cesium.RectangleGeometry({
                        rectangle: Cesium.Rectangle.fromDegrees(
                            ...this._boundingBox(positions)
                        )
                    })
                }),
                appearance: new Cesium.EllipsoidSurfaceAppearance({
                    material: this._createHeatmapMaterial(positions, strengths)
                })
            })
        );
    }
}
```

### 8.5 Real-Time Alerting Pipeline

```python
# alerting_pipeline.py
"""DEFONEOS EW Alerting Pipeline"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import asyncio

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

@dataclass
class Alert:
    id: str
    timestamp: datetime
    severity: AlertSeverity
    title: str
    description: str
    affected_area: dict  # geojson polygon
    recommended_action: str
    source_detections: list

class AlertingPipeline:
    """Multi-stage alerting for EW detections"""
    
    def __init__(self):
        self.rules = [
            self._rule_unknown_drone_band,
            self._rule_multiple_detections,
            self._rule_no_remote_id,
            self._rule_restricted_airspace,
            self._rule_correlated_threat,
        ]
        self.recent_detections = []  # Rolling window
        self.alert_history = []
        
    async def process(self, detection: RFDetection):
        """Evaluate detection against all alert rules"""
        self.recent_detections.append(detection)
        self._prune_old_detections()
        
        for rule in self.rules:
            alert = await rule(detection)
            if alert:
                await self._dispatch_alert(alert)
                self.alert_history.append(alert)
    
    async def _rule_unknown_drone_band(self, d: RFDetection) -> Optional[Alert]:
        """Alert on unknown signals in drone control bands"""
        drone_bands = [
            (2400, 2485),   # 2.4 GHz ISM
            (5150, 5875),   # 5 GHz
            (868, 869),     # EU SRD
            (902, 928),     # US ISM
            (5725, 5875),   # 5.8 GHz FPV
        ]
        
        if d.detection_type == DetectionType.UNKNOWN_RF and d.frequency:
            for low, high in drone_bands:
                if low <= d.frequency <= high:
                    return Alert(
                        id=f"unknown_drone_band_{d.uid}",
                        timestamp=datetime.utcnow(),
                        severity=AlertSeverity.WARNING,
                        title="Unknown signal in drone band",
                        description=f"Unknown RF signal detected at {d.frequency} MHz "
                                    f"(signal: {d.signal_strength} dBm)",
                        affected_area=self._point_buffer(d, 500),
                        recommended_action="Monitor signal. Attempt classification.",
                        source_detections=[d.uid]
                    )
        return None
    
    async def _rule_multiple_detections(self, d: RFDetection) -> Optional[Alert]:
        """Alert when multiple drones detected in short timeframe"""
        window = [x for x in self.recent_detections 
                  if x.timestamp > datetime.utcnow() - timedelta(minutes=5)]
        
        drone_detections = [x for x in window 
                           if x.detection_type in (DetectionType.REMOTE_ID_DRONE,
                                                   DetectionType.WIFI_DRONE,
                                                   DetectionType.BLUETOOTH_DRONE)]
        
        if len(drone_detections) >= 3:
            return Alert(
                id=f"multiple_drones_{datetime.utcnow().timestamp()}",
                timestamp=datetime.utcnow(),
                severity=AlertSeverity.CRITICAL,
                title=f"Multiple drone swarm detected ({len(drone_detections)} contacts)",
                description=f"{len(drone_detections)} drone contacts in 5-minute window. "
                           f"Possible coordinated UAS activity.",
                affected_area=self._convex_hull(drone_detections),
                recommended_action="Alert security. Activate enhanced monitoring. "
                                 "Consider physical countermeasures if authorized.",
                source_detections=[x.uid for x in drone_detections]
            )
        return None
    
    async def _rule_no_remote_id(self, d: RFDetection) -> Optional[Alert]:
        """Alert on drones without Remote ID (non-compliant / malicious)"""
        # If we detect a drone by WiFi/RF but NOT by Remote ID scanner
        wifi_drones = [x for x in self.recent_detections 
                      if x.detection_type == DetectionType.WIFI_DRONE]
        remote_ids = [x for x in self.recent_detections 
                     if x.detection_type == DetectionType.REMOTE_ID_DRONE]
        
        for wd in wifi_drones:
            # Check if any Remote ID within 200m and 60 seconds
            has_remote_id = any(
                self._distance(wd, rid) < 200 and 
                abs((wd.timestamp - rid.timestamp).total_seconds()) < 60
                for rid in remote_ids
            )
            if not has_remote_id:
                return Alert(
                    id=f"no_remote_id_{wd.uid}",
                    timestamp=datetime.utcnow(),
                    severity=AlertSeverity.CRITICAL,
                    title="Non-compliant drone (no Remote ID)",
                    description="Drone detected without FAA/EU Remote ID broadcast. "
                               "May be non-compliant or deliberately disabled.",
                    affected_area=self._point_buffer(wd, 300),
                    recommended_action="Flag as high priority. Track continuously. "
                                     "Attempt operator geolocation.",
                    source_detections=[wd.uid]
                )
        return None
    
    async def _dispatch_alert(self, alert: Alert):
        """Send alert to all configured channels"""
        
        # 1. WebSocket to Cesium frontend
        await self._ws_broadcast({
            'type': 'alert',
            'alert': {
                'id': alert.id,
                'severity': alert.severity.value,
                'title': alert.title,
                'description': alert.description,
                'timestamp': alert.timestamp.isoformat(),
                'recommended_action': alert.recommended_action,
                'affected_area': alert.affected_area
            }
        })
        
        # 2. CoT to FreeTAKServer
        cot = self._alert_to_cot(alert)
        await self._send_cot(cot)
        
        # 3. MQTT for IoT integration
        await self._mqtt_publish(f"defoneos/alerts/{alert.severity.value}", 
                                 json.dumps(alert.__dict__))
        
        # 4. Log to database
        await self._db_insert('alerts', alert.__dict__)
        
        # 5. Webhook for external systems
        if self.webhook_url:
            await self._webhook_post(alert)
```

### 8.6 Detection-to-Cesium Data Flow

```yaml
# ew-integration-config.yaml
ew_integration:
  # Input sources
  sources:
    - name: "adsb_primary"
      type: "dump1090"
      endpoint: "http://localhost:8080/data.json"
      parser: "adsb_json"
      poll_interval: 1
      
    - name: "kraken_df"
      type: "krakensdr"
      endpoint: "http://localhost:8081/doa"
      parser: "kraken_doa"
      websocket: true
      
    - name: "remoteid_scanner"
      type: "mesh_mapper"
      endpoint: "serial:///dev/ttyUSB0"
      parser: "remote_id"
      baud_rate: 115200
      
    - name: "batear_detector_1"
      type: "batear"
      endpoint: "mqtt://localhost:1883"
      topic: "batear/detector/+/alert"
      parser: "batear_mqtt"
      
    - name: "kismet_wifi"
      type: "kismet"
      endpoint: "http://localhost:2501"
      parser: "kismet_drone"
      api_key: "${KISMET_API_KEY}"

  # Processing
  processing:
    deduplication_radius: 100      # meters
    deduplication_window: 30       # seconds
    threat_classification: true
    operator_geolocation: true     # Use KrakenSDR for operator location
    swarm_detection: true
    remote_id_compliance_check: true
    
  # Output
  outputs:
    - type: "websocket"
      endpoint: "ws://0.0.0.0:8080/ew/stream"
      
    - type: "cot"
      endpoint: "tcp://freetakserver:8087"
      
    - type: "mqtt"
      broker: "mqtt://localhost:1883"
      topic_prefix: "defoneos/ew"
      
    - type: "database"
      connection: "postgresql://defoneos:password@localhost/ew_db"
      
  # Alerting
  alerting:
    rules:
      - name: "unknown_drone_band"
        enabled: true
        severity: "warning"
        
      - name: "multiple_drones"
        enabled: true
        threshold: 3
        window: 300  # seconds
        severity: "critical"
        
      - name: "no_remote_id"
        enabled: true
        severity: "critical"
        
      - name: "restricted_airspace"
        enabled: true
        geojson: "data/restricted_zones.geojson"
        severity: "critical"
        
    channels:
      - type: "websocket"
      - type: "cot"
      - type: "webhook"
        url: "${ALERT_WEBHOOK_URL}"
```

### 8.7 Deployment Architecture

```
+=======================================================================+
|                    DEFONEOS EW DEPLOYMENT                             |
|                                                                       |
|  TIER 1: FIELD SENSORS (Edge)                                        |
|  +----------------+  +----------------+  +----------------+           |
|  | Sensor Node 1  |  | Sensor Node 2  |  | Sensor Node N  |           |
|  | (Pi + RTL-SDR  |  | (Pi + SDR +    |  | (ESP32 + LoRa  |           |
|  |  + WiFi + BT)  |  |  KrakenSDR)    |  |  + Acoustic)   |           |
|  +-------+--------+  +-------+--------+  +-------+--------+           |
|          |                   |                   |                     |
|          |    MQTT/CoT/      |    LoRa/          |    LoRa/Mesh        |
|          |    ZeroMQ         |    Ethernet       |                     |
+----------|-------------------|-------------------|---------------------+
           |                   |                   |
+----------v-------------------v-------------------v---------------------+
|                                                                       |
|  TIER 2: EDGE PROCESSOR (On-site or Cloud)                           |
|  +---------------------------------------------------------------+   |
|  |  EW MCP Server                                                |   |
|  |  - Detection ingestion                                        |   |
|  |  - Deduplication & correlation                                |   |
|  |  - Threat classification                                      |   |
|  |  - CoT generation                                             |   |
|  +-----------------------+---------------------------------------+   |
|                          |                                           |
|  +-----------------------v---------------------------------------+   |
|  |  Message Bus (Redis/ZeroMQ/MQTT)                              |   |
|  +-----------------------+---------------------------------------+   |
|                          |                                           |
+----------+---------------+---------------+---------------------------+
           |                               |
+----------v---------------+   +-----------v---------------------------+
|                          |   |                                       |
|  TIER 3A: DEFONEOS CORE  |   |  TIER 3B: EXTERNAL INTEGRATION       |
|  +--------------------+  |   |  +------------------------------+    |
|  | Cesium Globe       |  |   |  | FreeTAKServer                |    |
|  | - Real-time tracks |  |   |  | - CoT distribution           |    |
|  | - Heatmaps         |  |   |  | - ATAK client push           |    |
|  | - Alert overlays   |  |   |  +------------------------------+    |
|  +--------------------+  |   |                                       |
|  | Alerting Dashboard |  |   |  +------------------------------+    |
|  | - Alert history    |  |   |  | External API                 |    |
|  | - Action log       |  |   |  | - Webhooks                   |    |
|  | - Operator UI      |  |   |  | - SIEM integration           |    |
|  +--------------------+  |   |  +------------------------------+    |
|                          |   |                                       |
+==========================+   +=======================================+
```

### 8.8 Hardware Recommendations by Use Case

| Use Case | Recommended Setup | Cost |
|----------|------------------|------|
| **Perimeter monitoring (facility)** | 4x Batear acoustic + 2x ESP32 Remote ID + 1x Pi hub | $100-200 |
| **Mobile patrol vehicle** | WarDragon kit OR Pi + HackRF + WiFi/BT | $500-1,500 |
| **Fixed site (airport/critical infra)** | Phase 3 station + multiple sensor nodes | $2,000-5,000 |
| **Research & development** | USRP B210 + KrakenSDR + full DragonOS | $2,000-3,000 |
| **Rapid deployment (tactical)** | KrakenSDR + Android tablet + directional antenna | $400 |
| **Large area coverage** | Multiple Phase 2 nodes + central Phase 3 server | $5,000-15,000 |

### 8.9 DEFONEOS EW API Endpoints

```
# REST API for EW integration

GET /api/v1/ew/detections           # List current detections
GET /api/v1/ew/detections/{uid}     # Get detection details
GET /api/v1/ew/alerts               # List active alerts
GET /api/v1/ew/alerts/{id}          # Get alert details
GET /api/v1/ew/spectrum/{band}      # Get spectrum data (RT or historical)
GET /api/v1/ew/stats                # Detection statistics

POST /api/v1/ew/detections          # Submit detection (from sensor)
POST /api/v1/ew/alerts/{id}/ack     # Acknowledge alert
POST /api/v1/ew/alerts/{id}/resolve # Resolve alert

WS   /ws/ew/stream                  # Real-time detection stream
WS   /ws/ew/alerts                  # Real-time alert stream
```

---

## Appendix A: Quick Reference Cards

### A.1 SDR Frequency Bands Quick Reference

```
 0 MHz    30       300       1 GHz     2 GHz     3 GHz     6 GHz
  |--------|---------|---------|---------|---------|---------|
  HF       VHF       UHF       L-band    S-band    C-band
                      |         |         |         |
           FM Radio  | GPS L1  | WiFi    | WiFi 5GHz|  
           Airband   | GSM     | 2.4GHz  | Drone   |
           Marine    | 900MHz  | Bluetooth| Video   |
                      | ISM     | Drone   | Radar   |
```

### A.2 UK Legal Quick Reference

```
LEGAL WITHOUT LICENCE:                  ILLEGAL WITHOUT AUTHORISATION:
- Owning SDR hardware                   - Using jammers (any context)
- Receiving signals (general)           - GPS spoofing (any context)
- ADS-B reception                       - Unauthorized interference
- Remote ID reception                   - Jamming sales to public
- Spectrum monitoring (passive)         - Using jammers in demos
- Protocol research (shielded)          - Commercial jamming services

REQUIRES OFCOM INNOVATION LICENCE:      AUTHORISED ONLY FOR:
- Jamming research (shielded)           - Crown/MoD
- Self-interference testing             - Intelligence agencies
- RF effector development               - Police (Home Office approved)
                                        - Prisons (Crown exemption)
                                        - Critical infrastructure
```

### A.3 Emergency Contacts & Resources

| Resource | Contact |
|----------|---------|
| Ofcom Spectrum Enquiries | spectrum.enquiries@ofcom.org.uk |
| Ofcom Innovation Licences | https://www.ofcom.org.uk/spectrum |
| CAA Drone Unit | drones@caa.co.uk |
| UK C-UAS Framework | https://www.gov.uk/government/collections/counter-drone-strategy |
| DragonOS | https://cemaxecuter.com |
| GNU Radio | https://www.gnuradio.org |
| RTL-SDR Blog | https://www.rtl-sdr.com |
| KrakenSDR | https://www.krakenrf.com |
| Batear | https://batear.io |
| OpenDroneID | https://github.com/opendroneid |

### A.4 Key GitHub Repositories

| Repository | URL | Purpose |
|------------|-----|---------|
| gr-gsm | github.com/ptrkrysik/gr-gsm | GSM signal analysis |
| gr-adsb | github.com/mhostetter/gr-adsb | ADS-B decoding |
| gr-krakensdr | github.com/krakenrf/gr-krakensdr | Direction finding |
| gps-sdr-sim | github.com/osqzss/gps-sdr-sim | GPS signal simulation |
| urh / urh-ng | github.com/jopohl/urh | Protocol reverse engineering |
| SDRangel | github.com/f4exb/sdrangel | Full SDR application |
| batear | github.com/batear-io/batear | Acoustic drone detection |
| drone-mesh-mapper | github.com/colonelpanichacks/drone-mesh-mapper | Remote ID scanner |
| opendroneid-core-c | github.com/opendroneid/opendroneid-core-c | Remote ID standard |
| DroneRF | github.com/al-sad/DroneRF | Drone RF dataset |
| dronerf_classifier | github.com/benhorvath/dronerf_classifier | RF classification |

---

> **END OF DOCUMENT**
> 
> This guide provides the foundation for building open-source electronic warfare and counter-drone capabilities. All activities must comply with UK law — specifically the Wireless Telegraphy Act 2006. The focus should remain on passive detection, classification, and alerting systems.
>
> For questions or updates, refer to the DEFONEOS technical team.
