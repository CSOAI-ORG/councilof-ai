# OPERATION DEEP EXECUTE: OPEN-SOURCE ROBOTICS MODIFICATION PLATFORMS
## Complete Guide for MEOK Labs / DEFONEOS Defense Robotics Program

**Classification:** INTERNAL TECHNICAL REFERENCE
**Version:** 1.0
**Date:** July 2025
**Prepared for:** MEOK Labs DEFONEOS Program
**Author:** AI Research Agent

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Humanoid Robots (Open Source, Modifiable)](#2-humanoid-robots-open-source-modifiable)
   - 2.1 Berkeley Humanoid Lite (Sub-$5K)
   - 2.2 K-Scale Z-Bot / Zeroth Bot (Sub-$1K)
   - 2.3 Asimov v1 (~$15K, Full Stack)
   - 2.4 LeRobot HuggingFace Humanoid (~$2,500)
   - 2.5 Roboto Origin (~$7K self-sourced)
   - 2.6 Unitree R1 EDU ($4,900-$35,000)
   - 2.7 Noetix Bumi ($1,400)
   - 2.8 ToddlerBot ($6,000, Stanford)
   - 2.9 AgiBot X1 (Open Source, 34 DOF)
   - 2.10 Booster T1 / K1 (ROS2, Orin)
   - 2.11 EngineAI PM01 (Open Source)
   - 2.12 K-Scale K-Bot (~$9,000)
   - 2.13 Comparison Matrix
3. [Quadruped Robots (Open Source, Modifiable)](#3-quadruped-robots-open-source-modifiable)
   - 3.1 Unitree Go2 / B2
   - 3.2 Stanford Pupper v3 (~$1K)
   - 3.3 MIT Mini Cheetah Derivatives
   - 3.4 SpotMicro AI (3D Printed)
   - 3.5 PADWQ (3D Printed, ~$7,700)
   - 3.6 Comparison Matrix
4. [Modification Potential & Defense Integration](#4-modification-potential--defense-integration)
   - 4.1 3D Printable Components (FDM)
   - 4.2 Defense Sensor Payload Integration
   - 4.3 Software Stack & DEFONEOS Integration
   - 4.4 NVIDIA Jetson Edge AI Deployment
5. [The MEOK Labs Build List](#5-the-meok-labs-build-list)
   - 5.1 Phase 1: THIS MONTH (GBP 1K-2K)
   - 5.2 Phase 2: 3 MONTHS (GBP 5K-10K)
   - 5.3 Phase 3: 6 MONTHS (GBP 15K-30K)
6. [Appendices](#6-appendices)
   - A: Complete GitHub Repository Index
   - B: Defense Sensor Vendor List
   - C: UK Export Control Considerations

---

## 1. EXECUTIVE SUMMARY

### THE LANDSCAPE IN 2025

Open-source humanoid and quadruped robotics has reached an inflection point. We now have **14+ viable open-source humanoid platforms** and **6+ open-source quadruped platforms** that can be built or bought, modified, and deployed for defense applications. Costs range from **$350** (Z-Bot DIY) to **$15,000** (Asimov v1 DIY kit), with the majority of research-grade platforms falling in the **$1,400-$6,000** range.

### KEY FINDINGS FOR MEOK LABS

| Priority | Finding |
|----------|---------|
| **Cheapest viable humanoid** | Noetix Bumi at $1,400 (buy) or K-Scale Z-Bot at $350-1,000 (build) |
| **Best value for research** | Berkeley Humanoid Lite at ~$3,200-4,300 (self-sourced, full 3D-printable) |
| **Most complete open-source stack** | Asimov v1 (CAD -> Sim -> Policy -> Deploy, CERN OHL-S + GPL) |
| **Best sim-to-real transfer** | ToddlerBot (Stanford, zero-shot sim-to-real) and Berkeley Humanoid Lite |
| **Best for edge AI** | Any platform with NVIDIA Jetson Orin NX/Nano integration (Go2 EDU, ToddlerBot, Booster T1) |
| **Best quadruped platform** | Unitree Go2 EDU ($14,500, ROS2, Jetson Orin) or Stanford Pupper v3 (~$1,000) |
| **Most hackable** | K-Scale ecosystem (Z-Bot -> K-Bot, full Rust/Python stack, YC-backed) |

### DEFONEOS INTEGRATION STRATEGY

All platforms in this guide can be integrated with DEFONEOS through:
- **ROS2 Humble/Jazzy** middleware (all major platforms)
- **MCP (Model Context Protocol)** servers for AI agent control
- **A2A (Agent-to-Agent)** protocol for multi-robot coordination
- **OpenFang** for secure communication
- **NVIDIA Isaac Sim/Lab** for simulation-to-policy pipelines

---

## 2. HUMANOID ROBOTS (OPEN SOURCE, MODIFIABLE)

### 2.1 BERKELEY HUMANOID LITE -- THE RESEARCH WORKHORSE

**Status:** Active development (UC Berkeley Hybrid Robotics)  
**Price:** $3,200 (China-sourced) / $4,300 (US-sourced)  
**Height:** 0.85m | **Weight:** 16kg | **DOF:** 22 (12 legs + 6 arms + others)  
**License:** MIT (code) + CC BY-SA 4.0 (hardware)

#### Overview
Berkeley Humanoid Lite is the gold standard for accessible humanoid research. Every structural component can be FDM 3D printed. The core innovation is a **modular 3D-printed cycloidal gearbox** design that achieves ~90% mechanical efficiency despite being plastic. The platform demonstrated **zero-shot sim-to-real policy transfer** using Isaac Lab / RSL-RL.

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 0.85m |
| Weight | 16 kg |
| DOF | 22 total (6 per leg, 5 per arm, others) |
| Actuator types | 6512 (high-torque) + 5010 (standard) cycloidal |
| Peak leg torque | ~35 Nm (knee) |
| Max speed | Walking/running gait demonstrated |
| Battery | 6S LiPo |
| Compute | Mini PC (x86) + USB-CAN adapters |
| IMU | BNO085 |

#### Complete BOM (US/China Pricing)

| Item | Cost (US) | Cost (China) |
|------|-----------|--------------|
| Mini PC | $129 | $223 |
| USB-CAN Adapters (4x) | $68 | $43 |
| USB Hubs (2x) | $36 | $11 |
| BNO085 IMU | $13 | $12 |
| 6S LiPo Battery | $70 | $81 |
| **6512 Actuators (10x)** | **$1,880** | **$1,563** |
| **5010 Actuators (12x)** | **$1,632** | **$1,130** |
| Grippers (2x) | $72 | $44 |
| Aluminum Extrusions | $39 | $3 |
| **3D Printed Components** | **$200** | **$84** |
| Misc. Structural | $50 | $14 |
| Misc. Electronic | $123 | $28 |
| **TOTAL** | **$4,312** | **$3,236** |

#### 6512 Actuator BOM (per unit)
| Item | Cost (US) | Cost (China) |
|------|-----------|--------------|
| M6C12 BLDC Motor (MAD Components, 150KV) | $129 | $124 |
| B-G431B-ESC1 Motor Driver (STM32) | $19 | $23 |
| AS5600 Position Encoder | $3 | $1 |
| Bearings (6811ZZ) | $23 | $4 |
| Fasteners | $5 | $1 |
| 3D Printed Cycloidal Parts | $4 | $1 |
| Misc (cables, connectors) | $5 | $3 |
| **TOTAL** | **$188** | **$157** |

#### What Can Be 3D Printed (FDM)
- **ALL structural components** (body, leg links, arm brackets, torso frame)
- **ALL cycloidal gearbox parts** (gear disks, housings, eccentric bearings, output shafts)
- **Gripper finger mechanisms**
- **Battery and electronics mounts**
- **Camera/sensor mounts**
- **NOT:** Motors, motor drivers, bearings, fasteners, PCBs

#### Software Stack
| Layer | Technology |
|-------|------------|
| Simulation | NVIDIA Isaac Lab, MuJoCo |
| RL Training | RSL-RL (PPO) |
| Sim-to-Sim | MuJoCo validation |
| Real Robot | Python C++ (low-level) |
| Communication | CAN Bus (1 Mbps) |
| Policy Export | Direct JIT compilation |

#### GitHub & Resources
- **Main Repo:** https://github.com/hybridrobotics/berkeley-humanoid-lite
- **Documentation:** https://berkeley-humanoid-lite.gitbook.io/docs
- **CAD/3D Print Files:** Available via GitHub Releases
- **Paper:** arXiv:2504.17249 (RSS 2025)
- **Discord:** Community via GitHub

#### Defense Modifications
- **Add payload rails** (3D printable) for sensor mounting
- **Upgrade compute** to Intel NUC 13 Pro for onboard inference
- **Add LiDAR mount** compatible with Intel RealSense D435i or E1R
- **Add 4G/5G module** for remote operation
- **Gripper swap** for specialized end-effectors (tactile, thermal)

---

### 2.2 K-SCALE Z-BOT / ZEROTH BOT -- THE CHEAPEST ENTRY POINT

**Status:** Public Beta -> V1.0 (K-Scale Labs, YC-backed)  
**Price:** $350 (DIY kit) - $1,000 (fully featured)  
**Height:** 0.46m | **Weight:** ~2.3kg | **DOF:** 16-18 servos  
**License:** MIT (code + hardware)

#### Overview
The Z-Bot (formerly Zeroth-01) is the world's cheapest functional humanoid robot. Built by K-Scale Labs (Y Combinator backed), it's a desktop-scale platform designed for reinforcement learning research. Runs on the Milk-V DUO S RISC-V board with 0.5 TOPS AI TPU.

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 46 cm (1.5 feet) |
| Weight | ~2.3 kg |
| DOF | 16-18 metal gear servos |
| Processor | Milk-V DUO S (RISC-V + ARM, 0.5 TOPS) |
| Camera | 1080p wide-angle |
| IMU | 6-axis |
| Communication | Wi-Fi, rechargeable battery |
| Actuators | Feetech metal gear servos |

#### Software Stack
| Component | Technology |
|-----------|------------|
| Robot OS | KOS-ZBot (custom HAL) |
| RL Training | K-Sim Gym ZBot (MuJoCo-based) |
| Sim-to-Real | SysID-calibrated actuators |
| Simulation | MuJoCo, NVIDIA Isaac Sim, Genesis |
| APIs | Python & Rust |
| AI | Supports RL, CV, LLM-based conversational AI |

#### GitHub & Resources
- **Main Repo:** https://github.com/zeroth-robotics/zeroth-bot
- **Hardware:** https://github.com/zeroth-robotics/hardware
- **Simulation:** https://github.com/zeroth-robotics/sim
- **Documentation:** https://docs.kscale.dev/docs/zeroth-01
- **Discord:** 2,000+ active members
- **Parent Org:** https://github.com/kscalelabs

#### What Can Be 3D Printed (FDM)
- **ALL structural parts** (body panels, leg segments, arm brackets, head housing)
- **Camera mounts** and sensor brackets
- **NOT:** Servos, electronics, fasteners

#### K-SCALE ECOSYSTEM ROADMAP
Z-Bot is the entry point. K-Scale Labs also offers:
- **K-Bot:** Full-size ($9,000, 65 kg class, CERN OHL-S license) -- https://github.com/kscalelabs/kbot
- **K-Sim Gym:** RL training library (MuJoCo + JAX) -- https://github.com/kscalelabs/ksim
- **K-Scale Model Format:** Export and inference tools

#### Defense Modifications
- **Swap compute** to Raspberry Pi 5 + Hailo-8 AI accelerator (26 TOPS)
- **Add ESP32 module** for mesh networking
- **Upgrade servos** to higher-torque Feetech models
- **Add thermal camera** (FLIR Lepton 3.5, $200)

---

### 2.3 ASIMOV V1 -- THE MOST COMPLETE OPEN-SOURCE STACK

**Status:** Open-sourced April 2026 (Menlo Research)  
**Price:** $15,000 (DIY kit, ships Summer 2026) / Self-source via BOM  
**Height:** 1.2m | **Weight:** 35kg | **DOF:** 25 actuated + 2 passive  
**License:** CERN-OHL-S-2.0 (hardware) + GPL-2.0 (software)

#### Overview
Asimov v1 is the most comprehensively open-source humanoid ever released. It includes **mechanical CAD, electrical CAD, MuJoCo simulation model, onboard software, wiring harnesses, and PCB files**. The design uses CNC-machined 7075 aluminum + MJF-printed PA12 nylon. Features an innovative RSU (Revolute-Spherical-Universal) ankle mechanism.

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 1.2 m |
| Weight | 35 kg |
| DOF | 25 actuated + 2 passive toe joints |
| Legs | 6 DOF x 2 + toe x 2 |
| Arms | 5 DOF x 2 (shoulder P/R/Y, elbow, wrist yaw) |
| Torso | 1 DOF waist yaw, 10W speaker, 6-axis IMU |
| Head | 2 DOF neck, quad mic array, 2MP monocular camera |
| CAN Bus | 5 @ 1 Mbps + 1 @ 500 kbps |
| Peak Torque | 120 Nm |
| Squat Load | 5 kg |
| Bicep Curl | 15 kg per arm |
| Lateral Raise | 18 kg per arm |

#### Compute Architecture
| Role | Board |
|------|-------|
| Media + Network | Raspberry Pi 5 |
| Real-time Motion Control | Radxa CM5 |

#### Software Stack
| Layer | Technology |
|-------|------------|
| Simulation | MuJoCo (locomotion-ready out of box) |
| Training | RL with Processor-in-the-Loop (PIL) |
| Middleware | Custom (ROS2 compatible) |
| Motion | Joint-level control, gait policies |
| API | Asimov API (upcoming) |

#### GitHub & Resources
- **Main Repo (CAD + Sim + Software):** https://github.com/asimovinc/asimov-1
- **Website:** https://www.asimovinc.com
- **3D Model Viewer:** Available
- **Manual:** https://github.com/asimovinc/asimov-1/blob/main/README.md
- **Pre-order:** https://www.asimovinc.com (deposit: $499)
- **Discord:** Active community

#### What Can Be 3D Printed
- **NOT FDM-friendly for structural parts** -- Uses MJF PA12 nylon (professional) and CNC 7075 aluminum
- **FDM possible for:** prototyping brackets, sensor mounts, cable management, cosmetic covers
- **Self-sourcing:** Requires CNC machining capability or service bureau

#### Defense Modifications
- **Add LiDAR** via chest/head mounting points
- **Upgrade to Jetson AGX Orin** (275 TOPS) for onboard AI
- **Add thermal camera** (FLIR Boson 640)
- **Custom end-effectors** via documented arm interface
- **4G/5G + mesh radio** integration via USB/Ethernet

---

### 2.4 LEROBOT HUMANOID (HUGGINGFACE) -- THE PIP-INSTALLABLE ROBOT

**Status:** Released 2026 (HuggingFace, acquired Pollen Robotics)  
**Price:** ~$2,500 (self-sourced)  
**Form:** Bipedal legs (lower body focus, upper body in roadmap)  
**License:** Open Source

#### Overview
HuggingFace entered hardware by acquiring Pollen Robotics (Reachy 2 creators). LeRobot Humanoid is a **fully open-source bipedal platform** with 3D-printable frame, off-the-shelf actuators, and a complete ML stack. The focus is on control-oriented design: simplified models for evaluating mechanisms before committing to hardware.

#### Key Features
| Feature | Detail |
|---------|--------|
| Hardware | 3D-printable frame + off-the-shelf actuators |
| Software | PyTorch-based IL + RL |
| Simulation | MetaWorld, Libero, VLABench |
| Pretrained Models | Available via HuggingFace Hub |
| Control | End-to-end learning policies |
| Dataset | LeRobot format (Parquet + MP4) |

#### Software Stack (pip install lerobot)
```bash
pip install lerobot
```

| Component | Description |
|-----------|-------------|
| Robot Class | Hardware-agnostic Python interface |
| Dataset | LeRobotDataset format (streamable) |
| Policies | ACT, Diffusion, TD-MPC |
| Training | Cloud (HF Jobs) or local |
| Teleop | Multiple devices supported |

#### Supported Hardware in LeRobot Ecosystem
| Robot | Cost | Type |
|-------|------|------|
| SO-100/SO-101 | ~$100-200 | Arm (most popular: 5,161+ datasets) |
| Koch v1.1 | ~$300 | Arm |
| LeKiwi | ~$500 | Mobile manipulator |
| Reachy 2 | ~$70,000 | Full humanoid (HuggingFace) |
| Unitree G1 | $16,000 | Humanoid |
| reBot B601 | Varies | Humanoid |

#### GitHub & Resources
- **Main Repo:** https://github.com/huggingface/lerobot
- **Paper:** ICLR 2026 (arXiv:2602.22818)
- **Hardware Docs:** https://github.com/huggingface/lerobot/tree/main/docs
- **Tutorials:** YouTube channel by HuggingFace

#### Defense Modifications
- **LeRobot is a SOFTWARE FRAMEWORK** -- pair with any hardware
- **Best pairing:** SO-101 arms ($100) for manipulation + custom mobile base
- **Add Unitree G1** as the full humanoid platform ($16K) with LeRobot control
- **Dataset collection** via teleoperation for defense-specific tasks

---

### 2.5 ROBOTO ORIGIN -- THE FULL-STACK CHINESE PLATFORM

**Status:** Open-sourced January 2026 (RoboParty, Xiaomi-backed)  
**Price:** $6,800 (BOM self-source) / 35,000 RMB (~$4,800 kit)  
**Height:** 1.25m | **Weight:** 34kg | **DOF:** 23 (20 active + 3)  
**License:** GNU GPL v3

#### Overview
Developed in 120 days by 21-year-old founder Yi Huang (Harbin Institute of Technology), Roboto Origin claims to be the world's first "full-stack open-source bipedal humanoid." Xiaomi-backed with $10M seed. Complete BOM cost approximately $6,800 USD.

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 1.25 m |
| Weight | 34 kg |
| DOF | 23 total (6 per leg, 5 per arm, 1 waist, others) |
| Max Speed | 3 m/s (running) |
| Leg Torque | 120 Nm peak |
| Arm Torque | 27 Nm |
| Battery | 48V 15Ah Li-ion |
| Controller | RDK X5 compute module |
| Depth Camera | Intel D435i (optional) |
| LiDAR | E1R (optional) |

#### GitHub Repositories
| Module | Repo | Description |
|--------|------|-------------|
| Main | `roboto_origin` | 1.3k stars, 178 forks |
| Hardware | `atom01_hardware` | CAD, PCBs, BOM |
| Deploy | `atom01_deploy` | ROS2 drivers, middleware |
| Training | `atom01_train` | RL via Isaac Lab 2.1.1 |
| Description | `atom01_description` | URDF kinematic model |

#### Software Stack
- **ROS2 Humble** deployment
- **NVIDIA Isaac Sim 4.5** for simulation
- **IsaacLab 2.1.1** for RL training
- **AMP gait algorithm** (Adaptive Motion Planning)
- **SMPL-X human model** for motion generation

#### What Can Be 3D Printed (FDM)
- **Cosmetic shell** (sold version currently excludes shell)
- **Sensor mounts** for LiDAR/camera
- **NOT:** Structural frame (uses CNC aluminum + machined parts)
- **NOT:** Servo actuators (DM 4340P, DM 10010L)

---

### 2.6 UNITREE R1 EDU -- THE ACADEMIC WORKHORSE (SHIPPING NOW)

**Status:** In production, shipping April 2026  
**Price:** $4,900 (R1 Air) / $5,900 (R1 Standard) / $10,000-$35,000 (EDU)  
**Height:** 1.23m | **Weight:** 25-29kg | **DOF:** 20-40 (model dependent)  
**License:** Proprietary hardware + Open SDK (EDU)

#### Overview
The R1 is Unitree's push into consumer/education humanoid robotics. Unlike the legged G1 ($16K), the R1 uses a **wheeled base** for stability while maintaining full upper-body articulation. The EDU versions add full SDK access, ROS2, and optional Jetson Orin compute.

#### Model Lineup
| Model | Price | DOF | Weight | Compute | Best For |
|-------|-------|-----|--------|---------|----------|
| R1 Air | $4,900 | 20 | ~25kg | Basic | Budget entry |
| R1 Standard | $5,900 | 26 | ~29kg | 8-core CPU+GPU | Most buyers |
| R1 EDU Standard | $10,000-12,000 | 26 | ~29kg | + Full SDK | University labs |
| R1 EDU Smart | $15,000-19,000 | 26 | ~29kg | + Enhanced AI | Research |
| R1 EDU Pro | $20,000-35,000 | 38 | ~29kg | + Dexterous hands | Advanced research |

#### Specifications (R1 Standard)
| Parameter | Value |
|-----------|-------|
| Height | 1230 mm |
| Weight | 25 kg (Air) / 29 kg (Standard) |
| DOF | 26 (up to 38 on Pro) |
| Max Speed | 9 km/h (2.5 m/s) |
| Battery Life | ~1 hour |
| Arm Payload | 10 kg |
| Camera | Stereo binocular (220 deg FOV on SV1-25) |
| AI | Multimodal LLM (UnifoLM) |

#### EDU Version Adds
- Full Python/C++/ROS2 SDK
- NVIDIA Jetson Orin (40-100 TOPS, model dependent)
- Block coding via DroneBlocks
- Custom gait development
- SLAM and autonomy

#### Defense Modifications
- **Add LiDAR** via expansion ports (Go2 LiDAR compatible)
- **Upgrade to Jetson Orin NX** (100 TOPS) for onboard inference
- **Add thermal camera** via USB3 ports
- **Custom end-effectors** for manipulation tasks
- **4G/5G module** for remote deployment
- **ROS2 integration** with DEFONEOS middleware

---

### 2.7 NOETIX BUMI -- THE CHEAPEST HUMANOID EVER

**Status:** Shipping now (sold 500 units in 2 days)  
**Price:** $1,400 (9,998 RMB)  
**Height:** 0.94m | **Weight:** ~12kg | **DOF:** 21  
**License:** Proprietary (upper-level API open)

#### Overview
The world's cheapest functional bipedal humanoid. From Noetix Robotics (Beijing), the Bumi achieved a $1,400 price point through extreme cost optimization and Chinese domestic supply chain. Features Python SDK, voice interaction, and JD.com ecosystem integration.

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 94 cm |
| Weight | ~12 kg |
| DOF | 21 |
| Battery | 48V |
| Runtime | ~1.5 hours |
| Interface | Python SDK, drag-and-drop programming |

#### Important Notes
- **Compact size** makes it safe for environments with humans/pets
- **Upper-level API is open** (call functions like walk, run)
- **Low-level control is proprietary**
- **China-direct purchase** via JD.com; international rollout June 2026
- **NOT fully open source** -- closed actuators, limited modification

#### Defense Modifications (Limited)
- **Add external compute** (Jetson Orin Nano via USB)
- **Add sensors** via external mounting brackets
- **Limited due to closed firmware** -- recommend for education only

---

### 2.8 TODDLERBOT -- STANFORD'S ML-COMPATIBLE PLATFORM

**Status:** Active research (Stanford University)  
**Price:** ~$6,000 (self-sourced)  
**Height:** 0.56m | **Weight:** 3.4kg | **DOF:** 30 active  
**License:** Open Source (full CAD + software)

#### Overview
ToddlerBot from Stanford is designed specifically for **ML-compatible data collection and policy learning**. Its compact size (56cm, 3.4kg) makes it safe around humans and pets. Features plug-and-play zero-point calibration and transferable motor system ID for high-fidelity digital twin. Demonstrated zero-shot sim-to-real transfer.

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 0.56 m |
| Weight | 3.4 kg |
| DOF | 30 active (7 per arm, 6 per leg, 2 neck, 2 waist) |
| Compute | NVIDIA Jetson Orin NX 16GB |
| Cameras | 2x fisheye (stereo) |
| Audio | Speaker, 2x microphones |
| IMU | Integrated |
| End Effectors | Compliant palm + parallel-jaw gripper |

#### Capabilities (v2.0 Release)
- Walking (up to 0.25 m/s)
- Crawling
- Cartwheel (dynamic)
- Push-ups, pull-ups
- Wagon pushing
- Bimanual manipulation
- VR teleoperation (Meta Quest 2)
- Foundation Stereo Depth (10 Hz on Jetson)

#### What Can Be 3D Printed (FDM)
- **ENTIRE robot** -- All structural parts are 3D printed
- **End effectors** (compliant palm, parallel-jaw gripper)
- **Camera mounts**
- **NOT:** Motors (Dynamixel), electronics, Jetson Orin, cables

#### GitHub & Resources
- **Website:** https://toddlerbot.github.io
- **Paper:** CoRL 2025 (arXiv:2502.00893)
- **CAD + Code:** Released with paper
- **VR Teleop:** Meta Quest 2 compatible

#### Defense Modifications
- **Already runs Jetson Orin NX** -- ready for edge AI
- **Add LiDAR** via 3D printed mount
- **Add thermal camera** via USB/Jetson CSI
- **VR teleoperation** for remote operation
- **Stereo depth** onboard for obstacle avoidance
- **Safe around humans** -- ideal for indoor reconnaissance training

---

### 2.9 AGIBOT X1 -- THE FULLY OPEN-SOURCE RESEARCH PLATFORM

**Status:** Commercially available (AgiBot, Shanghai)  
**Price:** Contact for quote (academic pricing available)  
**Height:** 1.30m | **Weight:** 33kg | **DOF:** 34 active  
**License:** Full open source (AimRT middleware + hardware docs)

#### Overview
The AgiBot X1 is a fully open-source bipedal humanoid with **34 active DOF**, proprietary PowerFlow actuators, and the open-source AimRT middleware. Unlike competitors, AgiBot provides full hardware documentation, source code, AND training data (AgiBot World dataset with 1M+ trajectories).

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 130 cm |
| Weight | 33 kg |
| DOF | 34 active |
| Walking Speed | 1 m/s (3.6 km/h) |
| Runtime | ~2 hours |
| Arm Payload | 0.5 kg per arm |
| Communication | EtherCAT to 3x FDCAN (5 Mbps) |

#### Actuator Ecosystem (PowerFlow)
| Actuator | Peak Torque | Weight |
|----------|-------------|--------|
| PowerFlow R86-3 | 200 Nm | 1.28 kg |
| PowerFlow R86-2 | 80 Nm | 0.81 kg |
| PowerFlow R52 | 19 Nm | 0.45 kg |
| PowerFlow L28 | 110 N (linear) | -- |

#### Compute Architecture
| Role | Hardware |
|------|----------|
| Primary | External x86 PC (Ubuntu 22.04 RT) |
| Real-time | Onboard microcontrollers (actuator control) |
| DCU | Domain Controller (1 kHz, EtherCAT -> FDCAN) |

#### Software Stack
| Layer | Technology |
|-------|------------|
| Middleware | AimRT (ROS2-compatible, open source) |
| Training | Isaac Gym / Legged Gym |
| Sim-to-Real | Custom pipeline |
| CLI Tool | REF-CLI (actuator config/diagnostics) |
| Dataset | AgiBot World (1M+ trajectories) |

#### GitHub & Resources
- **Inference Code:** https://github.com/AGIBOTTech/AGIBOT_x1_infer
- **Training Code:** https://github.com/AGIBOTTech/AGIBOT_x1_train
- **AimRT Framework:** https://github.com/AGIBOTTech/AimRT (open source)
- **AgiBot World Dataset:** https://github.com/OpenDriveLab/Agibot-World
- **Foundation Model:** GO-1 (pre-trained checkpoints available)

#### Defense Modifications
- **Add onboard x86 compute** (Intel NUC / mini-ITX)
- **Integrate LiDAR** via expansion interfaces
- **Add 4G/5G** for remote operation
- **Custom grippers** via OmniPicker interface
- **Multi-DCU cascade** for additional sensor integration

---

### 2.10 BOOSTER T1 / K1 -- THE ROS2 COMPETITION CHAMPION

**Status:** Available (Booster Robotics, Beijing, founded 2023)  
**Price:** T1: ~$80,000-120,000 / K1 Geek: $5,999  
**Height:** T1: 1.18m / K1: 0.95m | **Weight:** T1: ~30kg / K1: 19.5kg  
**License:** Open SDK + documentation

#### Booster T1 Specifications
| Parameter | Value |
|-----------|-------|
| Height | 118 cm |
| Weight | ~30 kg |
| DOF | 23-41 (gripper/dexterous hand dependent) |
| Max Torque | 130 Nm (knee) |
| GPU | NVIDIA AGX Orin (200 TOPS) |
| CPU | Intel i7 1370p |
| Camera | Depth camera |
| IMU | 9-axis |
| Audio | Circular 6-mic array + speaker |
| Runtime | ~2h walking / ~4h standing |
| Simulation | Isaac Sim, MuJoCo, Webots |

#### Booster K1 Geek (The Affordable One)
| Parameter | Value |
|-----------|-------|
| Height | 95 cm |
| Weight | 19.5 kg |
| DOF | 22 |
| GPU Options | 48 / 117 / 200 TOPS tiers |
| Camera | Depth camera (stereo vision) |
| IMU | 9-axis |
| Runtime | ~40 minutes active |
| SDK | Python, C++, ROS2 |
| Price | $5,999 |

#### GitHub & Resources
- **Website:** https://www.booster.tech/robots/
- **T1 Specs:** https://www.booster.tech/booster-t1/
- **European Distributor:** Generation Robots
- **Competition:** 2025 RoboCup AdultSize Champion

---

### 2.11 ENGINEAI PM01 -- THE HIGH-DYNAMICS OPEN PLATFORM

**Status:** Available (EngineAI, Shenzhen, founded Oct 2023)  
**Price:** PM01: Contact for quote / SA01: ~$5,400  
**Height:** 1.38m | **Weight:** ~40kg | **DOF:** 23  
**License:** Open training/deployment code

#### Specifications
| Parameter | Value |
|-----------|-------|
| Height | 138 cm |
| Weight | ~40 kg |
| DOF | 23 (6 per leg, 5 per arm, waist rotation) |
| Waist Rotation | -230 to +90 degrees (320 degree range) |
| Max Joint Torque | 300 Nm |
| Torque Density | 203 Nm/kg |
| Walking Speed | Up to 2 m/s |
| Battery | 10,000 mAh quick-swap |
| Runtime | ~2 hours |
| Compute | Dual: Intel N97 (x86) + NVIDIA Jetson Orin |

#### Key Innovation
- **End-to-end neural network gait** -- "natural human walking" without shuffling
- **First humanoid to perform front flip** (CES 2025)
- **Self-developed joint modules** with harmonic/planetary/ball-screw designs
- Open training code: Isaac / MuJoCo / ROS / ONNX workflows

---

### 2.12 K-SCALE K-BOT -- THE FULL-SIZE OPEN HUMANOID

**Status:** Public Alpha (K-Scale Labs)  
**Price:** ~$9,000 (estimated)  
**License:** CERN-OHL-S (hardware) + GPL v3 (software)

#### Overview
K-Bot is K-Scale Labs' full-size humanoid, building on the Z-Bot ecosystem. Uses low-cost components (Raspberry Pi, CAN bus) for accessible full-size robotics research.

#### GitHub & Resources
- **Repo:** https://github.com/kscalelabs/kbot
- **RL Training:** https://github.com/kscalelabs/ksim
- **Documentation:** https://docs.kscale.dev/
- **Ecosystem:** 20+ repositories across firmware, sim, training, inference

---

### 2.13 HUMANOID COMPARISON MATRIX

| Platform | Price | Height | Weight | DOF | 3D Print | Open Source | Jetson | Sim2Real |
|----------|-------|--------|--------|-----|----------|-------------|--------|----------|
| **Z-Bot** | $350-1K | 0.46m | 2.3kg | 16-18 | Full | MIT | No | Yes |
| **Noetix Bumi** | $1,400 | 0.94m | 12kg | 21 | No | Partial | No | N/A |
| **LeRobot HF** | $2,500 | Varies | Varies | Varies | Frame | Open | Optional | Yes |
| **Berkeley Lite** | $3,200-4.3K | 0.85m | 16kg | 22 | Full | MIT+CC | No | Zero-shot |
| **Unitree R1 Air** | $4,900 | 1.23m | 25kg | 20 | No | SDK | Optional | N/A |
| **Unitree R1** | $5,900 | 1.23m | 29kg | 26 | No | SDK | Optional | N/A |
| **ToddlerBot** | $6,000 | 0.56m | 3.4kg | 30 | Full | Open | Orin NX | Zero-shot |
| **Roboto Origin** | $6,800 | 1.25m | 34kg | 23 | Partial | GPL | RDK X5 | Yes |
| **K-Scale K-Bot** | $9,000 | ~1.4m | ~65kg | TBD | Partial | CERN-OHL | Optional | Yes |
| **AgiBot X1** | Quote | 1.30m | 33kg | 34 | No | Full | External | Yes |
| **Asimov v1** | $15,000 | 1.20m | 35kg | 27 | No (MJF) | CERN+GPL | RPi5+CM5 | Yes |
| **Unitree R1 EDU** | $10-35K | 1.23m | 29kg | 38 | No | SDK+ROS2 | Orin | N/A |
| **Booster K1** | $5,999 | 0.95m | 19.5kg | 22 | No | SDK | 48-200T | Yes |
| **EngineAI PM01** | Quote | 1.38m | 40kg | 23 | No | Partial | Dual | Yes |

---

## 3. QUADRUPED ROBOTS (OPEN SOURCE, MODIFIABLE)

### 3.1 UNITREE GO2 -- THE BEST VALUE QUADRUPED

**Status:** In production (shipping now)  
**Price:** $1,600 (Air) / $2,800 (Pro) / $14,500+ (EDU)  
**Weight:** 15-16.5kg | **Speed:** 3.7-5 m/s | **DOF:** 12  
**License:** Proprietary + Open SDK (EDU)

#### Model Lineup
| Model | Price | Key Features |
|-------|-------|--------------|
| Go2 Air | $1,600 | No LiDAR, basic CPU, entry-level |
| Go2 Pro | $2,800 | 4D LiDAR L2, 8-core CPU, ChatGPT voice |
| Go2 X | $5,990 | Full SDK, no Jetson (dev-focused) |
| Go2 EDU Standard | $13,000 | Orin Nano 40 TOPS, ROS2, SDK |
| Go2 EDU Plus | $16,000+ | Orin NX 100 TOPS, D1 arm option |
| Go2 ENT | $14,500 | Enterprise patrol, dual comms |
| Go2-W | Varies | Wheel-leg hybrid |

#### Go2 EDU Plus Specifications
| Parameter | Value |
|-----------|-------|
| Weight | ~15 kg |
| Top Speed | 5 m/s (11 mph) |
| Joint Torque | 45 Nm peak (12 motors) |
| Battery | 15,000 mAh (2-4 hours) |
| Payload | 8 kg (12 kg limit) |
| AI Compute | 100 TOPS (Jetson Orin NX) |
| LiDAR | 4D L1 (360 x 90 deg) |
| Cameras | 5x fish-eye stereo depth + RealSense D435i |
| Foot Sensors | 4x force sensors |
| Connectivity | 4G / WiFi 6 / BT 5.2 |

#### Software Stack (EDU)
| Layer | Technology |
|-------|------------|
| OS | Ubuntu (custom Linux) |
| Middleware | ROS2 |
| SDK | Python, C++ |
| Training | Isaac Sim compatible |
| Education | DroneBlocks block coding |

#### Defense Sensor Integration
- **LiDAR:** 4D L1 included (upgradeable to Mid-360 / Hesai XT16)
- **Depth Camera:** RealSense D435i included
- **Add thermal:** FLIR Lepton 3.5 or Boson via USB3
- **Add 4G/5G:** Built-in eSIM + external module
- **Add arm:** D1 servo arm (6-DOF, 500g, 600mm reach)
- **Autonomy:** SLAM, autonomous patrol, 3D mapping out of box

---

### 3.2 STANFARD PUPPER V3 -- THE SUB-$1K RESEARCH PLATFORM

**Status:** V1 EOL, V3 in development (Stanford Robotics Club)  
**Price:** ~$1,000 (BOM)  
**Weight:** ~3 lbs | **DOF:** 12  
**License:** Open Source

#### Pupper v3 (Upcoming) Specifications
| Parameter | Value |
|-----------|-------|
| Motors | 400W GIM4305 brushless |
| Compute | Raspberry Pi 5 |
| Camera | Luxonis SR depth camera |
| RL Policy | Reinforcement learning locomotion out-of-box |
| Display | LCD screen (debug + expressions) |
| BOM | ~$1,000 |

#### V1 Specifications (Available Now)
| Parameter | Value |
|-----------|-------|
| Weight | ~3 lbs |
| DOF | 12 (3 per leg) |
| Controller | Raspberry Pi 4 |
| Servos | 12x JX-Servo CLS6336HV (or MG996R budget) |
| Battery | 2S LiPo 5200 mAh |
| Cost | $600-900 (self-sourced) |
| Control | PS4 controller via Bluetooth |

#### What Can Be 3D Printed (FDM)
- **Frame components** (carbon fiber alternative available)
- **Leg segments and joints**
- **Body panels and covers**
- **Camera/LiDAR mounts**
- **NOT:** Servos, Raspberry Pi, PCB, battery

#### GitHub & Resources
- **V1 Code:** https://github.com/stanfordroboticsclub/StanfordQuadruped
- **Docs:** https://pupper.readthedocs.io/
- **Project Page:** https://stanfordstudentrobotics.org/pupper

---

### 3.3 MIT MINI CHEETAH DERIVATIVES

#### CHAMP (ROS Controller Framework)
**Repo:** https://github.com/chvmp/champ

An open-source ROS-based controller framework implementing the MIT Cheetah hierarchical control. Features:
- Fully autonomous (ROS Navigation Stack)
- Setup assistant for new robots
- Pre-configured URDFs: Anymal, Mini Cheetah, Spot, LittleDog
- Gazebo simulation
- Compatible with SpotMicroAI and OpenQuadruped
- Demo apps: TOWR, chicken head stabilization

#### MIT Cheetah Software
**Repo:** https://github.com/mit-biomimetics/Cheetah-Software

The original MIT Cheetah control software:
- Custom simulator with LCM framework
- Position/velocity/torque control
- Run on Cheetah 3 or Mini Cheetah hardware
- Dependencies: Qt 5.10, LCM, Eigen, Java

#### Quadruped Ctrl (ROS + PyBullet)
**Repo:** https://github.com/Derek-TH-Wang/quadruped_ctrl

PyBullet-based MIT Mini Cheetah simulation using ROS:
- Gait switching (trot, bound, pronk, gallop, walk, etc.)
- Gamepad control
- Terrain support (plane, stairs, random)
- RViz visualization

---

### 3.4 SPOTMICRO AI -- THE 3D-PRINTED SPOT CLONE

**Status:** Mature community project  
**Price:** $200-500 (depending on servos)  
**DOF:** 12 | **License:** Open Source

#### Hardware Options
| Config | Servos | Cost | Performance |
|--------|--------|------|-------------|
| Budget | 12x MG996R | ~$200 | Basic |
| Standard | 12x PDI-HV5523MG | ~$350 | Good |
| High-Torque | 12x CLS6336HV | ~$500 | Best |

#### Electronics
| Component | Spec |
|-----------|------|
| Main | Raspberry Pi 3B/4/5 |
| Servo Controller | PCA9685 (I2C) |
| IMU | MPU-6050 |
| LiDAR (optional) | RPLidar A1 |
| Power | 2S LiPo + UBEC 5V |
| Communication | Bluetooth (HC-06) |

#### GitHub & Resources
- **Code:** https://github.com/mike4192/spotMicro
- **Thingiverse:** https://www.thingiverse.com/thing:3445283 (by KDY0523)

#### What Can Be 3D Printed (FDM)
- **EVERYTHING** -- Complete frame, legs, body, mounts
- **NOT:** Servos, electronics, bearings, fasteners

---

### 3.5 PADWQ -- THE FULLY 3D-PRINTED DYNAMIC QUADRUPED

**Status:** Open source (Korea research project)  
**Price:** ~$7,700 (BOM)  
**Weight:** 12.7 kg | **DOF:** 12  
**License:** Open Source

#### Specifications
| Parameter | Value |
|-----------|-------|
| Weight | 12.7 kg |
| Speed | 1.0 m/s (dynamic trot) |
| Runtime | ~1 hour |
| Actuators | RMD-X8 Pro (knee, 35 Nm) + RMD-X8 (hip, 21 Nm) |
| Compute | NVIDIA Jetson (perception) |
| Sensors | RGBD camera |
| Materials | 3D printed PLA + COTS components |
| Print Time | ~225 hours |
| Material Used | 3.2 kg PLA (~$100) |

#### Cost Breakdown
| Category | Cost | % of Total |
|----------|------|------------|
| Actuators | ~$6,100 | 79% |
| Electronics + 3D Print | ~$1,600 | 21% |
| **TOTAL** | **~$7,700** | |

#### What Can Be 3D Printed (FDM)
- **ALL structural components** (body, legs, linkage, mounts)
- **Foot pads** (squash balls as compliant feet)
- **NOT:** Actuators, bearings, compute, fasteners

#### Key Reference
- **Paper:** "Design and Control of a Open-Source, Low Cost, 3D Printed Dynamic Quadruped Robot" (Applied Sciences, 2021)
- **Repo:** https://github.com/SJ-YI/PADWQ_open-source

---

### 3.6 QUADRUPED COMPARISON MATRIX

| Platform | Price | Weight | Speed | 3D Print | Open Source | Jetson | Defense Ready |
|----------|-------|--------|-------|----------|-------------|--------|---------------|
| **SpotMicro** | $200-500 | ~2kg | Slow | Full | Yes | No | Limited |
| **Pupper v1** | $600-900 | ~3lb | Walk/trot | Frame | Yes | No | Limited |
| **Pupper v3** | ~$1,000 | TBD | TBD | Frame | Yes | No | TBD |
| **Go2 Air** | $1,600 | 15kg | 3.7 m/s | No | SDK | No | Basic |
| **Go2 Pro** | $2,800 | 16kg | 3.7 m/s | No | SDK | No | Good |
| **CHAMP/DIY** | Varies | Varies | Varies | Frame | Yes | Optional | Custom |
| **PADWQ** | $7,700 | 12.7kg | 1.0 m/s | Full | Yes | Yes | Research |
| **Go2 EDU Plus** | $16,000+ | 16.5kg | 5 m/s | No | Full SDK | Orin NX | Excellent |

---


## 4. MODIFICATION POTENTIAL & DEFENSE INTEGRATION

### 4.1 3D PRINTABLE COMPONENTS (FDM) BY PLATFORM

#### Full 3D-Printable (FDM-All) Platforms
These platforms can be built entirely from FDM-printed structural parts (plus purchased actuators/electronics):

| Platform | 3D Print Coverage | Estimated Print Time | Material Cost | Recommended Printer |
|----------|-------------------|---------------------|---------------|---------------------|
| **Berkeley Humanoid Lite** | 100% structural + cycloidal gears | 40-60 hours | $200 (US) / $84 (CN) | Prusa MK4, Bambu Lab X1 |
| **ToddlerBot** | 100% structural | 30-40 hours | ~$150 | Prusa MK4, Bambu Lab X1 |
| **SpotMicro AI** | 100% frame + body | 15-20 hours | ~$30-50 | Any FDM printer |
| **Z-Bot (K-Scale)** | 100% structural | 10-15 hours | ~$20-30 | Any FDM printer |
| **PADWQ** | 100% structural | 225 hours | ~$100 (3.2kg PLA) | QIDI X-Max, FlashForge |
| **LeRobot Humanoid** | 100% frame | 20-30 hours | ~$50-80 | Prusa MK4, Bambu Lab X1 |

#### Partial 3D-Printable Platforms
These require CNC machining or professional manufacturing for structural parts:

| Platform | 3D Printable | Requires Machining | Notes |
|----------|-------------|-------------------|-------|
| **Roboto Origin** | Cosmetic shell, sensor mounts | CNC aluminum frame | Self-source above $6,800 |
| **Asimov v1** | Prototyping brackets, mounts | CNC 7075 aluminum + MJF nylon | Professional manufacturing |
| **AgiBot X1** | Minor brackets, cable guides | Machined frame + PowerFlow actuators | Actuators are proprietary |
| **K-Bot** | Brackets, covers | Structural frame (varies) | Alpha stage |

#### Recommended FDM Settings for Robot Parts
| Parameter | Setting | Rationale |
|-----------|---------|-----------|
| Material | PETG or ABS | Impact resistance, layer adhesion |
| Layer Height | 0.2mm | Balance of speed and strength |
| Wall Thickness | 3-4 walls (1.2-1.6mm) | Structural integrity |
| Infill | 40-60% gyroid | Best strength-to-weight ratio |
| Print Orientation | Perpendicular to load | Maximum layer strength in load direction |
| Support | Tree supports | Easier removal, cleaner surfaces |

#### 3D Printable Defense Modifications (All Platforms)
1. **Universal LiDAR mount** -- Fits E1R, Mid-360, RPLidar A1
2. **Camera gimbal bracket** -- Adjustable pitch/yaw for surveillance cameras
3. **Thermal camera housing** -- FLIR Lepton 3.5 / Boson 640 mount
4. **4G/5G antenna mount** -- External antenna positioning
5. **Battery expansion bracket** -- Dual battery for extended runtime
6. **Payload rail system** -- Picatinny/M-LOK compatible mounting
7. **Protective bumper shell** -- Impact-absorbing body armor
8. **Cable management channels** -- Organized wiring for field use

---

### 4.2 DEFENSE SENSOR PAYLOAD INTEGRATION

#### Sensor Stack for Defense Robotics

| Sensor | Purpose | Cost | Weight | Integration Method | Best Platform |
|--------|---------|------|--------|-------------------|---------------|
| **Intel RealSense D435i** | RGB-D, depth, IMU | $300 | 72g | USB3 / ROS2 | All platforms |
| **RealSense D455** | Improved depth accuracy | $400 | 115g | USB3 / ROS2 | All platforms |
| **Unitree 4D LiDAR L1** | 360 x 90 deg, 0.05m min range | $500 | 230g | Ethernet | Go2 compatible |
| **Livox Mid-360** | 360 x 59 deg, solid-state | $1,000 | 265g | Ethernet | Go2 EDU upgrade |
| **Hesai XT16** | 360 x 16 deg, 16-line | $1,500 | 500g | Ethernet | Research platforms |
| **RPLidar A1** | 2D scan, SLAM | $100 | 190g | USB | SpotMicro, Pupper |
| **E1R LiDAR** | Low-cost 3D | $300 | 200g | USB/Ethernet | Roboto Origin |
| **FLIR Lepton 3.5** | Thermal (160x120) | $200 | 1g | SPI / I2C | All (via breakout) |
| **FLIR Boson 640** | Thermal (640x512) | $3,000 | 5g | USB/CSI | Jetson platforms |
| **Luxonis OAK-D** | RGB + Depth + AI (4 TOPS) | $200 | 53g | USB3 | All platforms |
| **Luxonis OAK-D Pro** | + Laser dot projector | $300 | 53g | USB3 | All platforms |
| **BNO085 IMU** | 9-axis + sensor fusion | $13 | 1g | I2C/UART | All platforms |
| **VectorNav VN-100** | Industrial IMU | $800 | 5g | UART/SPI | Research platforms |
| **u-blox ZED-F9P** | RTK GPS (cm accuracy) | $200 | 5g | UART/I2C | Outdoor platforms |
| **4G/5G Module** | Remote connectivity | $100-300 | 50-100g | USB/M.2 | All platforms |
| **ESP32 Mesh Radio** | Local mesh networking | $10 | 5g | UART/WiFi | All platforms |
| **NVIDIA Jetson Orin Nano** | Edge AI (40 TOPS) | $499 | 45g | M.2/custom | Upgrade all platforms |
| **NVIDIA Jetson Orin NX** | Edge AI (100 TOPS) | $700 | 45g | M.2/custom | Upgrade all platforms |

#### Sensor Fusion Stack for DEFONEOS Integration
```
[ LiDAR ] --- \
[ Camera ] --- \
[ Thermal ] --- --> [ NVIDIA Jetson Orin ] --> [ ROS2 ] --> [ DEFONEOS MCP Server ]
[ IMU ] ---     /    (Perception Pipeline)       (Humble)      (A2A Protocol)
[ GPS ] ---    /                                   |
[ Encoders ] --                                     v
                                              [ OpenFang ]
                                              (Secure Comms)
```

#### ROS2 Packages for Defense Sensors
| Package | Function | Install |
|---------|----------|---------|
| `realsense2_camera` | Intel RealSense driver | `sudo apt install ros-humble-realsense2-camera` |
| `rplidar_ros` | RPLidar driver | `sudo apt install ros-humble-rplidar-ros` |
| `livox_ros_driver2` | Livox LiDAR driver | GitHub clone |
| `depth_image_proc` | Depth processing | Built-in |
| `image_pipeline` | Camera calibration/processing | Built-in |
| `imu_tools` | IMU filter/complementary | `sudo apt install ros-humble-imu-tools` |
| `robot_localization` | EKF sensor fusion | `sudo apt install ros-humble-robot-localization` |
| `nav2` | Autonomous navigation | `sudo apt install ros-humble-nav2` |
| `slam_toolbox` | SLAM | `sudo apt install ros-humble-slam-toolbox` |
| `octomap_server` | 3D occupancy mapping | `sudo apt install ros-humble-octomap-server` |

---

### 4.3 SOFTWARE STACK & DEFONEOS INTEGRATION

#### DEFONEOS Integration Architecture
```
+---------------------------------------------------------------------+
|                        DEFONEOS CONTROL LAYER                        |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
|  | MCP Server  |  | A2A Agent   |  | OpenFang    |  | Task Planner| |
|  | (Robot Cmd) |  | (Coordination|  | (Security)  |  | (Mission)   | |
|  +------+------+  +------+------+  +------+------+  +------+------+ |
|         |                |                |                |         |
+---------|----------------|----------------|----------------|---------+
          |                |                |                |
+---------v----------------v----------------v----------------v---------+
|                        ROS2 HUMBLE MIDDLEWARE                        |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
|  | Navigation2 |  | SLAM Toolbox|  | Control     |  | Perception  | |
|  | (Nav2)      |  | (Mapping)   |  | (Gazebo/RL) |  | (YOLO/Depth)| |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
|                                                                     |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
|  | Sensor      |  | Robot       |  | Simulation  |  | Data        | |
|  | Drivers     |  | Description |  | (Isaac/MuJoCo|  | Recording   | |
|  | (RealSense, |  | (URDF/MJCF) |  | /Gazebo)    |  | (ROS Bags)  | |
|  |  LiDAR, IMU)|  |             |  |             |  |             | |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
+---------------------------------------------------------------------+
          |                |                |                |
+---------v----------------v----------------v----------------v---------+
|                      HARDWARE ABSTRACTION LAYER                      |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
|  | CAN Bus     |  | USB         |  | Ethernet    |  | GPIO/I2C    | |
|  | (Actuators) |  | (Cameras)   |  | (LiDAR/Jetson|  | (Sensors)   | |
|  +-------------+  +-------------+  +-------------+  +-------------+ |
+---------------------------------------------------------------------+
```

#### MCP Server Integration for DEFONEOS
The Model Context Protocol (MCP) enables AI agents to control robots via standardized tool interfaces.

**Example MCP Server (Robot Control):**
```python
# robot_mcp_server.py
from mcp.server import Server
from mcp.types import Tool, TextContent
import rclpy
from geometry_msgs.msg import Twist
from sensor_msgs.msg import Image

app = Server("defoneos-robot-server")

@app.list_tools()
async def list_tools():
    return [
        Tool(name="move_forward", description="Move robot forward N meters", ...),
        Tool(name="turn_to", description="Turn to heading in degrees", ...),
        Tool(name="scan_area", description="Perform 360 degree LiDAR scan", ...),
        Tool(name="detect_objects", description="Run YOLO detection on camera feed", ...),
        Tool(name="get_telemetry", description="Get robot state (battery, position, IMU)", ...),
        Tool(name="set_gait", description="Change locomotion gait (walk/trot/run)", ...),
        Tool(name="emergency_stop", description="Immediate emergency stop", ...),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    # ROS2 publisher integration
    # Execute robot commands
    # Return results to AI agent
    ...
```

#### A2A (Agent-to-Agent) Protocol for Multi-Robot
A2A enables coordination between multiple DEFONEOS-controlled robots:

```
[Humanoid Agent] <--> [DEFONEOS Orchestrator] <--> [Quadruped Agent]
       |                                              |
       v                                              v
[Berkeley Lite]                               [Go2 EDU Plus]
    (Indoor recon)                               (Outdoor patrol)
```

#### OpenFang Integration
OpenFang provides encrypted communication for defense robotics:
- End-to-end encrypted command channels
- Zero-trust network architecture
- Secure firmware signing
- Tamper-evident telemetry logging

---

### 4.4 NVIDIA JETSON EDGE AI DEPLOYMENT

#### Jetson Platform Selection by Robot

| Robot | Recommended Jetson | AI Performance | Use Case |
|-------|-------------------|----------------|----------|
| Z-Bot | Jetson Orin Nano 8GB | 40 TOPS | Object detection, voice commands |
| ToddlerBot | Jetson Orin NX 16GB | 100 TOPS | Stereo depth, navigation |
| Berkeley Lite | Jetson Orin Nano 8GB | 40 TOPS | Gait policy inference, sensing |
| Go2 EDU | Jetson Orin NX 16GB | 100 TOPS | SLAM, autonomy, multi-sensor fusion |
| Unitree R1 EDU | Jetson Orin NX 16GB | 100 TOPS | Manipulation AI, navigation |
| Booster T1 | Jetson AGX Orin 64GB | 275 TOPS | Full autonomy, LLM inference |

#### Jetson Software Stack
```bash
# Base: JetPack 6.0+
# OS: Ubuntu 22.04 (on Jetson)
# CUDA: 12.x
# TensorRT: 10.x
# ROS2: Humble (custom build for ARM64)

# Key packages:
sudo apt install ros-humble-desktop
sudo apt install ros-humble-nav2 ros-humble-slam-toolbox
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu122
pip install tensorrt ultralytics

# YOLOv8 on Jetson:
pip install ultralytics
# Run: yolo detect predict model=yolov8n.pt source=0 device=0

# Depth Anything V2 (monocular depth):
git clone https://github.com/DepthAnything/Depth-Anything-V2.git

# Foundation Stereo (ToddlerBot uses this):
git clone https://github.com/facebookresearch/foundation_stereo.git
```

#### AI Models for Defense Robotics
| Model | Function | Jetson Performance | Framework |
|-------|----------|-------------------|-----------|
| **YOLOv8n** | Object detection | 30+ FPS on Orin Nano | PyTorch/TensorRT |
| **YOLOv11** | Latest detection | 25+ FPS on Orin Nano | PyTorch/TensorRT |
| **RT-DETR** | Transformer detection | 15 FPS on Orin NX | PyTorch |
| **Segment Anything 2** | Instance segmentation | 5 FPS on Orin NX | PyTorch |
| **Depth Anything V2** | Monocular depth | 10 FPS on Orin Nano | PyTorch |
| **Foundation Stereo** | Stereo depth | 10 FPS on Orin NX | PyTorch |
| **Whisper** | Speech recognition | Real-time on Orin Nano | PyTorch/ONNX |
| **LLaMA 3.1 8B** | LLM inference | 15 tok/s on Orin NX | TensorRT-LLM |
| **Qwen2.5 7B** | Multilingual LLM | 12 tok/s on Orin NX | TensorRT-LLM |
| **CLIP** | Vision-language | 20 FPS on Orin Nano | PyTorch |

---

## 5. THE MEOK LABS BUILD LIST

### PHASE 1: BUILD THIS MONTH (GBP 1,000 - 2,000 / ~$1,300 - $2,600)

**Goal:** Get hands-on with open-source humanoid robotics. Build a functional platform, learn the software stack, and begin DEFONEOS integration.

#### Option 1A: K-Scale Z-Bot (Recommended -- Fastest Path)
| Item | Cost | Source |
|------|------|--------|
| Z-Bot DIY Kit (actuators, electronics, frame) | $350-500 | https://kscale.dev |
| Raspberry Pi 5 (8GB) | $80 | RaspberryPi.com |
| 3D Printer (if not owned -- Bambu Lab A1 Mini) | $300 | Bambu Lab |
| PLA/PETG filament (1kg) | $25 | Amazon |
| Intel RealSense D435i (used) | $200 | eBay/Mercari |
| NVIDIA Jetson Orin Nano Developer Kit | $499 | NVIDIA |
| FLIR Lepton 3.5 thermal module + breakout | $200 | GroupGets |
| ESP32-WROOM modules (5-pack, mesh radio) | $25 | Amazon |
| **TOTAL** | **~$1,680 - $1,830** | |

**Build Timeline:** 1-2 weeks (assembly) + 1 week (software)  
**What You Get:** Functional small humanoid with depth camera, thermal sensing, mesh radio, edge AI.  
**DEFONEOS Integration:** ROS2 Humble via Raspberry Pi, MCP server on Jetson, A2A via ESP32 mesh.

#### Option 1B: Stanford Pupper v1 (Best Quadruped Entry)
| Item | Cost | Source |
|------|------|--------|
| Pupper complete kit (from MangDang or Cypress) | $500-700 | MangDang / Cypress Software |
| Raspberry Pi 5 (8GB) | $80 | RaspberryPi.com |
| PS4 Controller (used) | $30 | eBay |
| RPLidar A1 | $100 | Slamattec |
| Luxonis OAK-D (AI camera) | $200 | Luxonis |
| 4G LTE USB modem | $50 | Amazon |
| **TOTAL** | **~$960 - $1,160** | |

**Build Timeline:** 1 week  
**What You Get:** Walking quadruped with SLAM capability, AI vision, 4G connectivity.  
**DEFONEOS Integration:** Full ROS2 stack, autonomous patrol capability, 3D mapping.

#### Option 1C: LeRobot SO-101 Arms (Best Manipulation Entry)
| Item | Cost | Source |
|------|------|--------|
| SO-101 Robot Arm Kit (2x for bimanual) | $200 | WaveShare / RobotShop |
| Raspberry Pi 5 (8GB) | $80 | RaspberryPi.com |
| Camera module (2x) | $50 | Amazon |
| Jetson Orin Nano | $499 | NVIDIA |
| 3D printed mount parts | $20 | Self-printed |
| **TOTAL** | **~$850** | |

**Build Timeline:** 3-5 days  
**What You Get:** Bimanual robotic arms with imitation learning, policy deployment.  
**DEFONEOS Integration:** LeRobot pip package, HuggingFace model hub, teleoperation data collection.

#### Option 1D: Berkeley Humanoid Lite -- Budget Build (Best Long-term Value)
| Item | Cost (China-sourced) | Source |
|------|---------------------|--------|
| 6512 Actuators (10x @ $157) | $1,570 | AliExpress / Taobao |
| 5010 Actuators (12x @ $130) | $1,560 | AliExpress / Taobao |
| M6C12 BLDC Motors (spares) | $200 | MAD Components |
| B-G431B-ESC1 drivers (22x) | $300 | STMicro |
| AS5600 encoders (22x) | $25 | AliExpress |
| Bearings (6811ZZ, 22 sets) | $80 | AliExpress |
| Mini PC (used Intel NUC) | $100 | eBay |
| 6S LiPo battery + charger | $100 | HobbyKing |
| USB-CAN adapters (4x) | $45 | AliExpress |
| BNO085 IMU | $12 | Adafruit |
| 3D Print filament (5kg PETG/ABS) | $80 | Amazon |
| Fasteners, cables, misc | $50 | McMaster-Carr |
| Grippers (2x) | $45 | AliExpress |
| **TOTAL** | **~$4,267** | |

> **Note:** Berkeley Lite exceeds Phase 1 budget if China-sourced. For Phase 1, consider printing ONE leg first as a test (~$400 in actuators), then scale to full build in Phase 2.

**Phase 1 BOM with single-leg prototype approach:**
| Item | Cost |
|------|------|
| 2x 6512 actuators (hip + knee) | $314 |
| 1x 5010 actuator (ankle) | $130 |
| Motor drivers (3x) | $60 |
| Encoder + bearings (3x) | $15 |
| 3D print (leg parts) | $15 |
| Mini PC + CAN adapter | $130 |
| Battery + misc | $100 |
| **TOTAL** | **~$764** |

---

### PHASE 2: BUILD IN 3 MONTHS (GBP 5,000 - 10,000 / ~$6,500 - $13,000)

**Goal:** Deploy a capable defense robot with full sensor suite, autonomous navigation, and DEFONEOS integration.

#### Option 2A: Berkeley Humanoid Lite (Complete Build) -- RECOMMENDED
**Total Cost:** ~$4,300 (US) / ~$3,200 (China)  
**Add Defense Payload:**

| Additional Item | Cost | Purpose |
|-----------------|------|---------|
| Intel RealSense D455 | $400 | Improved depth perception |
| NVIDIA Jetson Orin Nano | $499 | Edge AI inference |
| Livox Mid-360 LiDAR | $1,000 | 360-degree SLAM |
| FLIR Boson 640 thermal | $3,000 | Thermal surveillance |
| 4G/5G modem (Quectel RM520N) | $150 | Remote connectivity |
| GPS module (u-blox ZED-F9P) | $200 | RTK positioning |
| Protective shell (3D printed TPU) | $50 | Impact protection |
| Spare actuators (2x each type) | $600 | Field repair kit |
| **PAYLOAD TOTAL** | **~$5,900** | |
| **GRAND TOTAL** | **~$9,100-10,200** | |

**3-Month Timeline:**
- **Week 1-2:** 3D print all components, order actuators/electronics
- **Week 3-4:** Assemble actuators, test cycloidal gearboxes
- **Week 5-6:** Full robot assembly, wiring, power system
- **Week 7-8:** Software setup, Isaac Lab sim-to-real training
- **Week 9-10:** Walking gait deployment, basic locomotion
- **Week 11-12:** Sensor integration, DEFONEOS MCP server, field testing

**DEFONEOS Integration Points:**
- ROS2 Humble on Mini PC
- Jetson Orin handles perception (YOLO + depth + thermal fusion)
- MCP Server exposes: move, scan, detect, track, emergency_stop
- A2A for multi-robot coordination
- OpenFang for encrypted command channels

#### Option 2B: Unitree Go2 EDU Standard + Modifications
**Total Cost:** ~$18,000

| Item | Cost |
|------|------|
| Unitree Go2 EDU Standard | $13,000 |
| FLIR Boson 640 thermal camera | $3,000 |
| Protective case + mounts | $300 |
| Spare battery (15,000 mAh) | $500 |
| 4G/5G modem upgrade | $150 |
| Custom payload rails | $200 |
| Software development | (MEOK Labs labor) |
| **TOTAL** | **~$16,950** | |

**Advantages:** Ready-to-walk platform, full ROS2 SDK, proven reliability, 5 m/s speed, 4-hour battery with spare.

#### Option 2C: ToddlerBot + Scale-Up Program
**Total Cost:** ~$8,000-10,000

| Item | Cost |
|------|------|
| ToddlerBot self-source BOM | $6,000 |
| NVIDIA Jetson Orin NX 16GB | $700 |
| Livox Mid-360 LiDAR | $1,000 |
| FLIR Lepton 3.5 thermal | $200 |
| 4G/5G modem | $150 |
| Spare Dynamixel servos (set) | $500 |
| **TOTAL** | **~$8,550** | |

**Advantages:** Already has Jetson Orin NX, stereo depth, VR teleop. Safe for indoor testing. Proven zero-shot sim-to-real.

---

### PHASE 3: BUILD IN 6 MONTHS (GBP 15,000 - 30,000 / ~$19,500 - $39,000)

**Goal:** Deploy a defense-grade robot squad with full autonomy, multi-robot coordination, and operational capability.

#### Option 3A: Asimov v1 DIY Kit + Defense Suite -- FLAGSHIP
**Total Cost:** ~$25,000-30,000

| Item | Cost |
|------|------|
| Asimov v1 DIY Kit | $15,000 |
| NVIDIA Jetson AGX Orin 64GB | $1,500 |
| Hesai XT16 LiDAR | $1,500 |
| FLIR Boson 640 thermal | $3,000 |
| Intel RealSense D455 (2x) | $800 |
| 5G modem ( Quectel RG200 ) | $300 |
| Custom end-effectors (gripper, probe) | $500 |
| Protective armor panels | $400 |
| Spare parts kit (actuators, electronics) | $1,500 |
| Development/customization labor | (MEOK Labs) |
| **TOTAL** | **~$23,500** | |

**Advantages:**
- Most complete open-source stack (CAD -> Sim -> Policy -> Deploy)
- 1.2m human-scale, 120 Nm peak torque
- Full CERN-OHL-S + GPL licensing (no restrictions)
- RSU ankle mechanism for natural ground response
- Pre-trained MuJoCo locomotion policies
- 25 DOF + 2 passive -- full manipulation capability

**6-Month Timeline:**
- **Month 1:** Kit assembly, mechanical build, electrical integration
- **Month 2:** Software stack, simulation training, gait development
- **Month 3:** Sensor integration, perception pipeline, DEFONEOS MCP
- **Month 4:** Autonomous navigation, mission planning, field testing
- **Month 5:** Multi-robot A2A coordination, OpenFang secure comms
- **Month 6:** Operational deployment, documentation, squad scaling

#### Option 3B: Unitree Go2 EDU Plus + Swarm
**Total Cost:** ~$35,000-40,000 (for 2 units)

| Item | Cost |
|------|------|
| Go2 EDU Plus (2x @ $16,000) | $32,000 |
| D1 servo arm (2x) | $2,000 |
| Thermal cameras (2x) | $4,000 |
| 5G + mesh radio kits (2x) | $600 |
| Custom payload modules | $1,000 |
| **TOTAL** | **~$39,600** | |

**Advantages:**
- Swarm capability via A2A
- 5 m/s speed per unit
- 100 TOPS each (200 TOPS combined)
- Proven quadruped reliability
- Full ROS2 + SDK access

#### Option 3C: Multi-Platform Squad (BEST BANG FOR BUCK)
**Total Cost:** ~$30,000

| Platform | Qty | Cost Each | Purpose |
|----------|-----|-----------|---------|
| Berkeley Humanoid Lite (complete) | 1 | $4,300 | Indoor humanoid operations |
| Unitree Go2 EDU Standard | 1 | $13,000 | Outdoor quadruped patrol |
| ToddlerBot | 1 | $6,000 | Indoor reconnaissance (safe) |
| Z-Bot | 2 | $500 | Mesh network relay nodes |
| Sensor payload (shared) | -- | $3,000 | Thermal, LiDAR, 4G/5G |
| Development + integration | -- | $2,700 | Labor |
| **TOTAL** | **6 robots** | **~$29,300** | **Full squad capability** |

---

## 6. APPENDICES

### A: COMPLETE GITHUB REPOSITORY INDEX

#### Humanoid Platforms
| Platform | Organization | Repository | License |
|----------|-------------|------------|---------|
| Berkeley Humanoid Lite | hybridrobotics | https://github.com/hybridrobotics/berkeley-humanoid-lite | MIT |
| Z-Bot | zeroth-robotics | https://github.com/zeroth-robotics/zeroth-bot | MIT |
| Z-Bot Hardware | zeroth-robotics | https://github.com/zeroth-robotics/hardware | MIT |
| K-Bot | kscalelabs | https://github.com/kscalelabs/kbot | CERN-OHL-S |
| K-Sim Gym | kscalelabs | https://github.com/kscalelabs/ksim | MIT |
| Asimov v1 | asimovinc | https://github.com/asimovinc/asimov-1 | CERN-OHL-S + GPL |
| LeRobot | huggingface | https://github.com/huggingface/lerobot | Apache 2.0 |
| AgiBot X1 Inference | AGIBOTTech | https://github.com/AGIBOTTech/AGIBOT_x1_infer | Open |
| AgiBot X1 Training | AGIBOTTech | https://github.com/AGIBOTTech/AGIBOT_x1_train | Open |
| AgiBot World Dataset | OpenDriveLab | https://github.com/OpenDriveLab/Agibot-World | Open |
| Roboto Origin | roboparty | https://github.com/roboparty/roboto_origin | GPL v3 |
| Roboto Hardware | roboparty | https://github.com/roboparty/Atom01_hardware | GPL v3 |
| ToddlerBot | toddlerbot | https://toddlerbot.github.io | Open |
| AgiBot AimRT | AGIBOTTech | https://github.com/AGIBOTTech/AimRT | Open |

#### Quadruped Platforms
| Platform | Organization | Repository | License |
|----------|-------------|------------|---------|
| Pupper | stanfordroboticsclub | https://github.com/stanfordroboticsclub/StanfordQuadruped | Open |
| SpotMicro | mike4192 | https://github.com/mike4192/spotMicro | Open |
| CHAMP | chvmp | https://github.com/chvmp/champ | BSD |
| MIT Cheetah Software | mit-biomimetics | https://github.com/mit-biomimetics/Cheetah-Software | MIT |
| Quadruped Ctrl | Derek-TH-Wang | https://github.com/Derek-TH-Wang/quadruped_ctrl | Open |
| PADWQ | SJ-YI | https://github.com/SJ-YI/PADWQ_open-source | Open |

#### Simulation & Training
| Tool | Organization | Repository | License |
|------|-------------|------------|---------|
| NVIDIA Isaac Lab | NVIDIA | https://github.com/isaac-sim/IsaacLab | NVIDIA License |
| MuJoCo | Google DeepMind | https://github.com/google-deepmind/mujoco | Apache 2.0 |
| RSL-RL | leggedrobotics | https://github.com/leggedrobotics/rsl_rl | BSD |
| Legged Gym | leggedrobotics | https://github.com/leggedrobotics/legged_gym | BSD |
| Humanoid Gym | roboterax | https://github.com/roboterax/humanoid-gym | MIT |

---

### B: DEFENSE SENSOR VENDOR LIST

| Vendor | Products | Website | UK Shipping |
|--------|----------|---------|-------------|
| Intel | RealSense D435i/D455/D457 | intelrealsense.com | Yes |
| FLIR (Teledyne) | Boson, Lepton thermal | flir.com | Yes |
| Livox | Mid-360 LiDAR | livoxtech.com | Yes |
| Hesai | XT16, Pandar LiDAR | hesaitech.com | Yes |
| Slamattec | RPLidar A1/A2 | slamtec.com | Yes |
| Luxonis | OAK-D AI cameras | luxonis.com | Yes |
| u-blox | GPS/RTK modules | u-blox.com | Yes |
| Bosch | BNO085 IMU | bosch-sensortec.com | Yes |
| VectorNav | VN-100/VN-300 IMU | vectornav.com | Yes |
| Quectel | 4G/5G modems | quectel.com | Yes |
| NVIDIA | Jetson Orin series | nvidia.com | Yes |
| Waveshare | Sensor breakouts | waveshare.com | Yes |

---

### C: UK EXPORT CONTROL & REGULATORY CONSIDERATIONS

#### UK Strategic Export Control List Relevance
Building and modifying robots for defense purposes in the UK requires awareness of:

1. **Export Control Act 2002** -- Controls on technology transfer
2. **UK Military List (ML)** -- Covers autonomous systems, robotics
3. **Dual-Use Regulation (EU 2021/821 retained UK law)** -- Sensors, AI chips

#### Controlled Items to Watch
| Item | Control Category | Note |
|------|-----------------|------|
| NVIDIA Jetson AGX Orin | Dual-Use Category 6 | Check if export-controlled |
| FLIR Boson 640 | Military List ML15 | Thermal imaging restrictions |
| LiDAR systems (military-grade) | Dual-Use Category 6 | Range/accuracy thresholds |
| Encryption (OpenFang) | Dual-Use Category 5 | Cryptography controls |
| Autonomous navigation SW | Military List ML17 | Software controls |

#### Compliance Recommendations
1. **Register with DIT** (Department for International Trade) for export licensing
2. **Technology Control Plan** for defense-related development
3. **End-Use monitoring** for all exported components
4. **UK Strategic Export Control List** review before each component purchase
5. **Consider ITAR-free alternatives** where possible

#### MEOK Labs Advantage
As a UK-based sovereign AI OS developer:
- Source components from UK/EU suppliers where possible
- 3D print structural parts locally (no export issues)
- Use open-source software (no license restrictions)
- Document all component origins for compliance

---

### D: QUICK-REFERENCE COST SUMMARY

| Platform | Buy Price | Build Price | Defense-Ready Total | Timeline |
|----------|-----------|-------------|---------------------|----------|
| Z-Bot | N/A | $350-1,000 | $1,800 | 1 week |
| SpotMicro | N/A | $200-500 | $1,000 | 1 week |
| Pupper v1 | $500 (kit) | $600-900 | $1,500 | 1 week |
| Noetix Bumi | $1,400 | N/A | $2,000 (with sensors) | Buy now |
| LeRobot SO-101 | $100/arm | $100/arm | $850 (bimanual + AI) | 3 days |
| Berkeley Lite | N/A | $3,200-4,300 | $9,100 (full defense) | 3 months |
| ToddlerBot | N/A | $6,000 | $8,550 | 2 months |
| Roboto Origin | $4,800 (kit) | $6,800 (BOM) | $10,000 | 3 months |
| Unitree R1 | $4,900-5,900 | N/A | $7,000 (with sensors) | Buy now |
| Go2 EDU Standard | $13,000 | N/A | $16,000 | Buy now |
| K-Bot | N/A | $9,000 | $14,000 | 3 months |
| Go2 EDU Plus | $16,000 | N/A | $20,000 | Buy now |
| Asimov v1 | $15,000 (kit) | $15,000+ | $25,000 | 3 months |
| AgiBot X1 | Quote | Quote | Quote | Contact |
| Booster K1 | $5,999 | N/A | $8,000 | Buy now |

---

### E: RECOMMENDED READING ORDER FOR MEOK LABS TEAM

1. **Week 1:** Build Z-Bot or Pupper (get hands-on immediately)
2. **Week 2:** Install ROS2 Humble, run tutorials
3. **Week 3:** Set up DEFONEOS MCP server, connect to robot
4. **Week 4:** Begin Berkeley Humanoid Lite actuator printing
5. **Month 2:** Full Berkeley Lite build, Isaac Lab training
6. **Month 3:** Defense sensor integration, field testing
7. **Month 4-6:** Scale to Asimov v1 or Go2 EDU squad

---

**END OF DOCUMENT**

*This guide was compiled from public sources, manufacturer documentation, GitHub repositories, and academic papers as of July 2025. All prices are approximate and subject to change. Verify current pricing and availability before procurement.*

*MEOK Labs should prioritize platforms with the strongest open-source licenses (MIT, CERN-OHL-S, GPL) for sovereign defense applications. The Berkeley Humanoid Lite offers the best combination of open licensing, 3D printability, documented defense modification potential, and academic credibility for UK defense programs.*
