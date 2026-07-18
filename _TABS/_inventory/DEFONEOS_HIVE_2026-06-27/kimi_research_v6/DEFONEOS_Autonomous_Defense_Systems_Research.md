# OPERATION DEFONEOS — Autonomous Defense Systems Deep Research Report
## MEOK.AI DEFONEOS Hive: Open-Source Crown Jewels for Autonomous Defense Systems

**Classification:** Open-Source Intelligence (OSINT)
**Date:** 2025
**Objective:** Identify 25+ open-source "crown jewels" across 7 autonomous defense domains
**Mission Status:** COMPLETE — 30 Crown Jewels Identified

---

## TABLE OF CONTENTS
1. [Open-Source Drone/UAV AI (6 jewels)](#1-open-source-droneuav-ai)
2. [Unmanned Ground Vehicles (5 jewels)](#2-unmanned-ground-vehicles-ugvs)
3. [Maritime/UUV Autonomous Systems (4 jewels)](#3-maritimeuuv-autonomous-systems)
4. [Swarm Intelligence for Defense (5 jewels)](#4-swarm-intelligence-for-defense)
5. [Counter-Autonomy Systems (4 jewels)](#5-counter-autonomy-systems)
6. [Simulation & Digital Twins (4 jewels)](#6-simulation--digital-twins-for-defense)
7. [AI for Electronic Warfare (2 jewels)](#7-ai-for-electronic-warfare)

---

# 1. OPEN-SOURCE DRONE/UAV AI

---

## CROWN JEWEL #1: PX4 Autopilot
**GitHub/Source:** https://github.com/PX4/PX4-Autopilot | https://px4.io
**License:** BSD 3-clause

### What It Does
PX4 is the world's premier open-source autopilot system, deployed on 250+ vehicle configurations including multirotors, fixed-wing, VTOL, ground rovers, and marine vehicles. It runs on the NuttX RTOS for real-time performance, with a modular uORB messaging architecture. PX4 1.15+ brings enhanced autonomous navigation, improved sensor fusion, ROS 2 integration, and experimental AI features like throw-mode launch.

### Why It's a Crown Jewel for DEFONEOS
- **AI-Ready Platform:** Native ROS2 integration via uXRCE-DDS enables seamless AI/ML pipeline integration
- **GPS-Denied Navigation:** Visual-Inertial Odometry (VIO) and collision avoidance for indoor/tunnel operations
- **Military-Grade Hardware:** Pixhawk FMUv6X-RT with NXP processor, secure element, triple-redundant IMUs
- **Simulation Ecosystem:** Full SITL/HITL support with Gazebo, AirSim, and jMavSim

### Integration with MEOK Physical AI + UE5 SOV SPACE
- PX4 SITL can feed telemetry into UE5 SOV SPACE via MAVLink → Cesium 3D visualization
- VIO data can be fused with MEOK ESP32 sensor network for enhanced positioning
- PX4 companion computer mode runs on MEOK's onboard compute platforms

---

## CROWN JEWEL #2: ArduPilot
**GitHub/Source:** https://github.com/ArduPilot/ardupilot | https://ardupilot.org
**License:** GPLv3

### What It Does
ArduPilot is the oldest and most feature-rich open-source autopilot, supporting planes, copters, rovers, submarines, and blimps. It includes Lua scripting for custom behaviors without firmware rebuild, EKF3 state estimation, autonomous mission planning, and support for 85+ flight controller boards. ArduSub variant is the industry standard for ROVs.

### Why It's a Crown Jewel for DEFONEOS
- **Unified Binary:** Single codebase for ALL vehicle types — aerial, ground, and maritime
- **Lua Scripting:** Custom autonomous behaviors without C++ rebuild — rapid mission adaptation
- **ArduSub Marine:** Industry-leading underwater autopilot (see BlueROV2 integration)
- **Deep Parameter Tuning:** 1000+ tuneable parameters for mission-specific optimization
- **Extensive Sensor Support:** EKF3 fuses GPS, optical flow, lidar, sonar, ADS-B, and radar

### Integration with MEOK Physical AI + UE5 SOV SPACE
- ArduPilot's SITL integrates with UE5 AirSim for high-fidelity visual simulation
- Lua scripting can interface with MEOK ESP32 IoT sensor network
- Unified codebase allows DEFONEOS to share code across drone/UGV/maritime platforms

---

## CROWN JEWEL #3: AeroStack2
**GitHub/Source:** https://github.com/aerostack2/aerostack2
**License:** BSD 3-clause (inferred from academic ROS2 project)
**Source Paper:** https://github.com/aerostack2/aerostack2 (Roscon 2023)

### What It Does
AeroStack2 is a comprehensive ROS2-based framework for multi-robot aerial systems, developed by the CVAR Group at UPM Madrid. It provides a modular plugin architecture, behavior-based mission control, heterogeneous swarm support, and standardized sensor interfaces. Supports Crazyflie, DJI Matrice, PX4, and Flightmare simulator.

### Why It's a Crown Jewel for DEFONEOS
- **Multi-Drone Orchestration:** Designed from ground up for heterogeneous aerial swarms
- **Behavior-Based Missions:** Composable mission primitives (follow, survey, search, patrol)
- **Platform Agnostic:** Same mission code runs on Crazyflie nano-drones and DJI Matrice 300
- **Indoor/Outdoor:** Full support for GPS-denied indoor operations via VIO

### Integration with MEOK Physical AI + UE5 SOV SPACE
- ROS2-native: Direct integration with MEOK's existing ROS2 infrastructure
- Behavior trees can trigger UE5 SOV SPACE visualization events
- Supports Flightmare simulator for AI training before real deployment

---

## CROWN JEWEL #4: MAVSDK (MAVLink SDK)
**GitHub/Source:** https://github.com/mavlink/mavsdk | https://mavsdk.mavlink.io
**License:** BSD 3-clause

### What It Does
MAVSDK is a C++ 20 library (with Python, Swift, Java, Go wrappers) for programmatic MAVLink communication with drones, cameras, and ground systems. Supports mission upload, real-time telemetry, offboard control, and multi-vehicle management. Cross-platform: Linux, macOS, Windows, Android, iOS.

### Why It's a Crown Jewel for DEFONEOS
- **Fleet Operations:** Manage one or hundreds of vehicles simultaneously
- **Language Bindings:** Python for AI prototyping, C++ for production deployment
- **Offboard Control:** Enable AI agents to command drone velocity/position/attitude
- **Production-Ready:** Used in commercial drone operations worldwide
- **Companion Computer:** Runs onboard for edge AI-to-drone control

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Python API enables direct AI agent control of PX4/ArduPilot drones
- Telemetry streaming feeds into UE5 SOV SPACE for real-time 3D visualization
- Can be deployed on MEOK ESP32 companion compute modules

---

## CROWN JEWEL #5: MAVSDK Drone Show (MDS)
**GitHub/Source:** https://github.com/alireza787b/mavsdk_drone_show
**License:** PolyForm Noncommercial / PolyForm Small Business / Commercial

### What It Does
MDS is a full-stack open-source fleet operations system built on MAVSDK for PX4 drones. Features include: SITL simulation, drone show choreography, search & rescue mission planning (QuickScout), cooperative autonomy (Smart Swarm), swarm trajectory design, and a React-based Ground Control Station dashboard.

### Why It's a Crown Jewel for DEFONEOS
- **Smart Swarm:** Formation flying, cluster operations, and leader-follower behaviors
- **QuickScout SAR:** Pre-built search patterns for reconnaissance/surveillance missions
- **Dashboard GCS:** React-based fleet monitoring with Mapbox/Leaflet integration
- **SITL Pipeline:** Docker-based simulation for rapid AI training iteration
- **MCP-Compatible:** Future AI-agent workflow integration planned

### Integration with MEOK Physical AI + UE5 SOV SPACE
- React dashboard can embed UE5 SOV SPACE WebGL exports for 3D mission preview
- SITL pipeline can be integrated with Cesium for georeferenced simulation
- Swarm data feeds directly into MEOK's data infrastructure

---

## CROWN JEWEL #6: Flightmare Quadrotor Simulator
**GitHub/Source:** https://github.com/uzh-rpg/flightmare
**License:** MIT
**Paper:** https://arxiv.org/abs/2009.00550

### What It Does
Flightmare is a flexible modular quadrotor simulator from the University of Zurich Robotics and Perception Group. Features include: Unity-based rendering engine, high-fidelity physics, multi-modal sensor suite (camera, lidar, IMU), point-cloud extraction, parallel RL environment (100s of drones), and VR headset integration.

### Why It's a Crown Jewel for DEFONEOS
- **Parallel RL Training:** Simulate hundreds of drones simultaneously for swarm AI training
- **3D Point Cloud:** Extract full scene geometry for SLAM/navigation algorithms
- **High-Fidelity Rendering:** Unity photorealism for computer vision algorithm training
- **Sensor Suite:** Camera, depth, semantic segmentation, lidar — all for free in simulation
- **Sim-to-Real:** Validated on real Crazyflie drones

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Unity rendering can be replaced with UE5 SOV SPACE for higher fidelity
- Parallel RL training enables rapid DEFONEOS AI agent development
- Point cloud data feeds into MEOK's 3D mapping pipeline

---

# 2. UNMANNED GROUND VEHICLES (UGVs)

---

## CROWN JEWEL #7: NASA JPL Open Source Rover
**GitHub/Source:** https://github.com/nasa-jpl/open-source-rover
**License:** Apache 2.0

### What It Does
A full-scale, buildable replica of the Mars rovers used by NASA JPL. Features rocker-bogie suspension system, 6-wheel drive, articulated steering, Arduino + Raspberry Pi control stack, and full mechanical/electrical/software documentation. Costs ~$2,500 to build.

### Why It's a Crown Jewel for DEFONEOS
- **Proven Design:** Based on actual Mars rover engineering — extreme terrain capability
- **Complete Open Hardware:** All CAD files, PCB designs, and BOMs provided
- **Modular Electronics:** Arduino for low-level control, Raspberry Pi for autonomy
- **Educational to Tactical:** Scales from classroom project to field-deployable UGV
- **Active Community:** Hundreds of builders worldwide sharing modifications

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Can be enhanced with MEOK ESP32 sensor network for IoT telemetry
- ROS2 integration enables full autonomy stack deployment
- UE5 SOV SPACE can visualize rover telemetry in 3D terrain models

---

## CROWN JEWEL #8: Clearpath Husky UGV + ROS2
**GitHub/Source:** https://github.com/husky/husky | https://clearpathrobotics.com/husky/
**License:** BSD (various packages)

### What It Does
The Husky is a medium-sized rugged UGV platform used by military and research organizations worldwide. Features high-torque drivetrain, IP54-rated chassis, 20kg payload capacity, and full ROS2 support. Used by the US Army, NATO, and 500+ research institutions.

### Why It's a Crown Jewel for DEFONEOS
- **Military-Proven:** Deployed by US DoD, NATO, and defense contractors
- **Ruggedized:** Operates in mud, snow, rain, and rough terrain
- **Massive Payload:** Accommodates LiDAR, cameras, manipulators, radios
- **Nav2 Ready:** Full ROS2 Navigation 2 support for autonomous waypoint navigation
- **SLAM Capable:** Integrated with lidarslam_ros2 for GPS-denied mapping

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Nav2 path visualization directly in UE5 SOV SPACE via Cesium
- SLAM point clouds can be rendered as 3D terrain in UE5
- Unitree R1 humanoid coordination via ROS2 message passing

---

## CROWN JEWEL #9: UGV Nav4D (DFKI)
**GitHub/Source:** https://github.com/dfki-ric/ugv_nav4d
**License:** BSD (inferred from DFKI RIC)

### What It Does
A 4D (X, Y, Z, Theta) motion planner for UGVs developed by the German Research Center for AI (DFKI). Integrates with ROS2, SLAM, and Gazebo for 3D terrain-aware navigation. Plans paths considering terrain elevation, slope, and obstacle geometry.

### Why It's a Crown Jewel for DEFONEOS
- **3D Terrain Navigation:** Plans paths over uneven terrain, not just flat ground
- **DFKI Provenance:** Germany's premier AI research center for defense applications
- **Gazebo Integration:** Full simulation pipeline for validation
- **SLAM Compatible:** Works with lidarslam_ros2 for GPS-denied operation

### Integration with MEOK Physical AI + UE5 SOV SPACE
- 4D planning data can be visualized in UE5 SOV SPACE terrain models
- Integrates with MEOK's farm automation SLAM for shared navigation stack

---

## CROWN JEWEL #10: Autoware
**GitHub/Source:** https://github.com/autowarefoundation/autoware | https://www.autoware.org
**License:** Apache 2.0

### What It Does
The world's leading open-source autonomous driving framework, built on ROS2. Provides a complete self-driving pipeline: sensing (LiDAR, camera, radar, GNSS/IMU), perception (YOLO, PointPillars), localization (NDT), prediction, planning (A*, lattice), and control (Pure Pursuit, MPC). Used across 30+ countries.

### Why It's a Crown Jewel for DEFONEOS
- **Production-Ready Full Stack:** Complete autonomy from sensor to actuator
- **Military-Grade Sensors:** Supports Velodyne, Ouster, Hesai LiDARs; FLIR cameras
- **Open Architecture:** Modular design allows swapping AI/ML models
- **HD Map Support:** Lanelet2 maps for structured environment navigation
- **20+ Vehicle Platforms:** Proven on 20+ real vehicle platforms

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Full autonomy stack deployable on Husky/JPL Rover UGVs
- HD maps can be rendered in UE5 SOV SPACE via Cesium
- Point cloud and detection outputs feed 3D visualization pipeline

---

## CROWN JEWEL #11: Unitree Go2 / B2 + ROS2 SDK
**GitHub/Source:** https://github.com/unitreerobotics/unitree_ros2 | https://github.com/unitreerobotics/unitree_sdk2
**License:** BSD (inferred)

### What It Does
Unitree provides official ROS2 packages and SDKs for their Go2 (quadruped) and B2 robot dogs. Includes URDF models, gait controllers, LIDAR integration (Point-LIO SLAM), and teleoperation interfaces. The Go2 features built-in 4D LiDAR-L1 and Intel RealSense.

### Why It's a Crown Jewel for DEFONEOS
- **Already in MEOK Inventory:** Unitree R1 is part of MEOK physical AI capabilities
- **Quadruped Mobility:** Traverses stairs, rubble, and terrain impossible for wheeled UGVs
- **Built-in LiDAR:** 4D LiDAR-L1 with Point-LIO SLAM for autonomous navigation
- **ROS2 Native:** Direct integration with full autonomy stack (Nav2, Autoware)
- **SDK Available:** C++ and Python APIs for custom AI development

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Go2 SLAM point clouds feed UE5 SOV SPACE terrain visualization
- ROS2 enables coordination between Go2, drones, and humanoid R1
- UE5 can render Go2 gait telemetry in real-time 3D

---

# 3. MARITIME/UUV AUTONOMOUS SYSTEMS

---

## CROWN JEWEL #12: MOOS-IvP (MIT/Oxford)
**GitHub/Source:** https://github.com/moos-ivp/moos-ivp | https://oceanai.mit.edu/moos-ivp/
**License:** GPLv3 / LGPLv3 / Commercial (dual)

### What It Does
MOOS-IvP is the gold-standard open-source autonomy framework for marine vehicles. 120,000+ lines of C++, 30+ applications, and 12+ vehicle behaviors. Developed by MIT and Oxford, funded by the Office of Naval Research. Deployed on Bluefin UUVs, REMUS UUVs, NATO USVs, and autonomous kayaks.

### Why It's a Crown Jewel for DEFONEOS
- **ONR-Funded:** Directly developed for US Navy autonomous operations
- **Platform Independence:** "Backseat Driver" paradigm — autonomy on payload computer
- **IvP Helm:** Interval Programming multi-objective optimization for behavior arbitration
- **Nested Autonomy:** Swarm coordination with heterogeneous communications
- **Battle-Proven:** Tested in thousands of hours of simulation and hundreds of water-hours

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Marine autonomy behaviors can be visualized in UE5 SOV SPACE ocean models
- MOOSDB publish-subscribe integrates with ROS2 via bridge
- UUV positions rendered in Cesium-based maritime 3D environments

---

## CROWN JEWEL #13: BlueOS + ArduSub
**GitHub/Source:** https://github.com/bluerobotics/blueos | https://www.ardusub.com
**License:** GPLv3 (ArduSub), Various (BlueOS)

### What It Does
BlueOS is an open-source browser-based operating system for ROVs, USVs, and robotic systems. ArduSub is the open-source autopilot for underwater vehicles. Together they power the BlueROV2 (world's most popular open-source ROV) with 6-DOF control, depth/heading hold, position hold, autonomous mission execution, and DVL/GPS integration.

### Why It's a Crown Jewel for DEFONEOS
- **Underwater Autonomy:** Depth hold, heading hold, position hold, and waypoint missions
- **DVL Integration:** Doppler Velocity Log for GPS-denied underwater navigation
- **Sonar Suite:** Ping360 scanning sonar, Ping sonar altimeter — all open protocol
- **Extension Marketplace:** Install custom extensions for mapping, AI, mission planning
- **Open Protocols:** Ping Protocol for all underwater sensors

### Integration with MEOK Physical AI + UE5 SOV SPACE
- BlueOS extensions can integrate MEOK ESP32 IoT sensors
- Underwater missions visualized in UE5 SOV SPACE bathymetric models
- Ping360 sonar data can render 3D underwater point clouds

---

## CROWN JEWEL #14: DH200 ASV (Open-Source Autonomous Surface Vehicle)
**GitHub/Source:** https://github.com/mrsonandrade/dh200_asv
**License:** MIT / CC (full open hardware + software)
**Paper:** https://www.mdpi.com/2077-1312/13/12/2380

### What It Does
A low-cost ($1,900), fully open-source autonomous surface vehicle with 2m hull, Python-based control software (SPIRE), Raspberry Pi + Arduino electronics, and graphical mission planning UI. Complete naval architecture treatment including hydrostatics, stability, and resistance analysis.

### Why It's a Crown Jewel for DEFONEOS
- **Ultra-Low Cost:** $1,900 vs $100,000+ for commercial ASVs
- **Full Open Hardware:** Design files, source code, and documentation on GitHub
- **Mission Planning GUI:** SPIRE interface for waypoint planning and real-time monitoring
- **Modular Hull:** Reconfigurable for surveillance, environmental monitoring, object deployment
- **Naval Engineering:** Complete hydrodynamic analysis included

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Python codebase integrates with MEOK's existing Python AI infrastructure
- Position data streams to UE5 SOV SPACE for maritime 3D visualization
- Raspberry Pi can host MEOK ESP32 mesh network gateway

---

## CROWN JEWEL #15: VRX / UUV Simulator
**GitHub/Source:** https://github.com/osrf/vrx | https://github.com/uuvsimulator/uuv_simulator
**License:** Apache 2.0

### What It Does
VRX (Virtual RobotX) is an open-source simulation environment for USV autonomy challenges, developed by Open Robotics. UUV Simulator provides underwater dynamics, sensor modeling, and environmental simulation. Supports WAM-V, BlueBoat, REXROV2, LAUV, and custom maritime vehicles.

### Why It's a Crown Jewel for DEFONEOS
- **Maritime Autonomy Testing:** Safe simulation of harbor navigation, obstacle avoidance
- **Hydrodynamic Simulation:** Realistic water physics and wave dynamics
- **Sensor Modeling:** Sonar, lidar, camera, GPS, and IMU simulation
- **Competition-Tested:** Validated in RobotX Maritime Challenge
- **Gazebo/ROS2 Native:** Full integration with robotics stack

### Integration with MEOK Physical AI + UE5 SOV SPACE
- VRX scenarios can be enhanced with UE5 SOV SPACE ocean rendering
- Gazebo simulation provides physics-accurate testing for maritime AI
- Cesium integration for georeferenced maritime mission visualization

---

# 4. SWARM INTELLIGENCE FOR DEFENSE

---

## CROWN JEWEL #16: Crazyswarm2
**GitHub/Source:** https://github.com/IMRCLab/Crazyswarm2 | https://imrclab.github.io/crazyswarm2/
**License:** MIT
**Paper:** https://doi.org/10.1109/ICRA.2017.7989376

### What It Does
Crazyswarm2 is a ROS2 stack for operating aerial robot teams using Bitcraze Crazyflie 2.1/2.1+ drones. Supports indoor swarm flight with LPS/VICON positioning, trajectory planning, and decentralized control. Can operate 50+ drones simultaneously.

### Why It's a Crown Jewel for DEFONEOS
- **Large Swarms:** Test swarm algorithms with 50+ physical nano-drones
- **Indoor Operations:** GPS-denied flight using UWB/VICON — ideal for urban defense
- **ROS2 Native:** Direct integration with MEOK's ROS2 infrastructure
- **Affordable:** Crazyflie 2.1 costs ~$300 each vs thousands for military drones
- **Active Ecosystem:** Related packages: Aerostack2, CrazyChoir, Skybrush

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Swarm positions stream to UE5 SOV SPACE for real-time 3D formation visualization
- Indoor positioning data fused with MEOK ESP32 UWB mesh
- Crazyflie can act as IoT sensor carrier for distributed sensing

---

## CROWN JEWEL #17: DARPA OFFSET Swarm Program Ecosystem
**GitHub/Source:** https://www.darpa.mil/research/programs/offensive-swarm-enabled-tactics
**License:** Various (government-funded, open architecture)

### What It Does
DARPA's OFFSET (OFFensive Swarm-Enabled Tactics) program developed the open architecture for deploying 250+ aerial and ground robots in urban combat. Two Swarm Systems Integrators (Northrop Grumman, Raytheon BBN) built: game-based swarm tactics architecture, immersive human-swarm interfaces (VR/AR), swarm tactics exchange, and physical testbeds with 300+ platforms.

### Why It's a Crown Jewel for DEFONEOS
- **DoD-Validated:** Swarm tactics validated in 6 field experiments at Fort Campbell
- **300+ Combined Platforms:** Demonstrated combined air/ground swarm operations
- **Human-Swarm Interface:** VR/AR command interfaces for operators
- **Virtual Swarm Agents:** Physical + virtual agents operated simultaneously
- **Open Architecture:** Extensible game-based framework for swarm tactics

### Integration with MEOK Physical AI + UE5 SOV SPACE
- UE5 SOV SPACE is the ideal platform to implement OFFSET-style immersive interfaces
- Cesium geospatial data enables urban swarm tactical planning
- 300+ agent simulation feasible with UE5 Nanite instancing

---

## CROWN JEWEL #18: MARLlib + PettingZoo
**GitHub/Source:** https://github.com/Replicable-MARL/MARLlib | https://github.com/Farama-Foundation/PettingZoo
**License:** MIT

### What It Does
MARLlib is a comprehensive Multi-Agent Reinforcement Learning library built on Ray RLlib. Supports 18 environments, 10 algorithms (MADDPG, MAPPO, QMIX, VDN, etc.), and both cooperative and competitive scenarios. PettingZoo is the Gymnasium-equivalent API standard for MARL environments.

### Why It's a Crown Jewel for DEFONEOS
- **Swarm AI Training:** Train hundreds of agents simultaneously using distributed RL
- **Battle Scenarios:** Environments model pursuit-evasion, resource gathering, territory control
- **18+ Environments:** MPE, MAMuJoCo, Google Football, and custom defense scenarios
- **Scalable:** Ray framework enables training on GPU clusters
- **Algorithm Zoo:** MADDPG, MAPPO, QMIX — state-of-the-art MARL algorithms

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Trained MARL policies deployed on physical MEOK drones/UGVs
- UE5 SOV SPACE can serve as a MARL environment with Cesium terrain
- Reward functions incorporate geospatial objectives from Cesium data

---

## CROWN JEWEL #19: BlueSwarm (NATO Swarm Defense System)
**GitHub/Source:** NATO STO paper: https://publications.sto.nato.int (MP-SET-315)
**License:** Government research (open publication)

### What It Does
BlueSwarm is a NATO-validated counter-drone swarm defense system using multi-agent deep reinforcement learning. Features: ground radar (1000m detection), PTZ camera EO, defending drone fleet with gimbal sensors and net payloads, multi-agent RL for navigation/targeting, and optimal target allocation algorithms.

### Why It's a Crown Jewel for DEFONEOS
- **NATO-Validated:** Tested in simulated and real-flight operations
- **MARL Navigation:** Multi-Agent RL for coordinated approach/tracking
- **Optimal Targeting:** Hungarian algorithm for target-to-drone assignment
- **Sensor Fusion:** Radar + EO + inter-drone communication for situational awareness
- **End-to-End:** Detection → Classification → Targeting → Neutralization

### Integration with MEOK Physical AI + UE5 SOV SPACE
- UE5 SOV SPACE can render the complete BlueSwarm engagement in 3D
- Sensor fusion data visualized in real-time on Cesium globe
- MARL policies trainable in UE5 environment before real deployment

---

## CROWN JEWEL #20: S-drone Open-Source Swarm Platform
**GitHub/Source:** https://osf.io/nipet/ (Open Science Framework)
**License:** MIT
**Paper:** https://iridia.ulb.ac.be/~mdorigo/Published_papers/2024/OguHeiAll-etal2024ieeeaccess.pdf

### What It Does
The S-drone (Swarm-drone) is a fully open-source UAV platform for swarm robotics research. Features: quad-camera configuration for onboard vision-based navigation, robot-to-robot coordination, decentralized operation (no GPS/mocap/GCS needed), ARGoS simulator plugin, and PX4 flight controller. Cost: ~EUR 2,250 per drone.

### Why It's a Crown Jewel for DEFONEOS
- **True Decentralization:** No external infrastructure required — self-contained swarm
- **Vision-Based SLAM:** Onboard localization using cameras only
- **Simulation-to-Reality:** ARGoS plugin enables same code in sim and real
- **Bio-Inspired:** Developed by IRIDIA lab (ant-colony optimization pioneers)
- **Fully Open:** Hardware, software, and mechanical designs all MIT licensed

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Decentralized architecture matches MEOK's distributed IoT philosophy
- UE5 SOV SPACE can render decentralized swarm decision-making in 3D
- PX4-based: direct integration with MEOK's drone autopilot infrastructure

---

# 5. COUNTER-AUTONOMY SYSTEMS

---

## CROWN JEWEL #21: Batear Acoustic Drone Detector
**GitHub/Source:** https://github.com/batear-io/batear | https://batear.io
**License:** Open Source (OSI-approved, specific license on repo)

### What It Does
Batear is an ultra-low-cost, edge-only acoustic drone detector running on ESP32-S3 with MEMS microphone. Uses FFT harmonic detection to identify drone rotor signatures. Supports three modes: Detector (mic + LoRa), Gateway (LoRa + MQTT), and Wired Detector (Ethernet/PoE + MQTT). Integrates with Home Assistant via MQTT.

### Why It's a Crown Jewel for DEFONEOS
- **$10 Hardware:** ESP32-S3 + MEMS microphone — deployable at scale
- **Edge Computing:** All processing on-device — no cloud, no subscription
- **Acoustic Detection:** Works when radar/RF fails (stealth drones, terrain masking)
- **LoRa Mesh:** Distributed detection network over long-range radio
- **Field-Tested:** Partnered for testing in Ukraine EW environments

### Integration with MEOK Physical AI + UE5 SOV SPACE
- ESP32-S3 is MEOK's core IoT platform — direct hardware integration
- LoRa mesh feeds into MEOK's existing ESP32 sensor network
- Detection alerts trigger UE5 SOV SPACE 3D alert visualization

---

## CROWN JEWEL #22: RF-Based Drone Detection Ecosystem
**GitHub/Source:** https://github.com/topics/drone-detection (78+ repositories)
**Key Projects:**
- ESP32 RF Scanner: https://github.com/topics/drone-detection (multi-band)
- Drone-vs-Bird: https://github.com/topics/drone-detection (hard negative dataset)
- Anti-UAV: https://github.com/topics/drone-detection (official challenge repo)

### What It Does
A rapidly growing ecosystem of open-source counter-drone tools: ESP32-based RF scanners for 900MHz/2.4GHz/5.8GHz detection, YOLO-based computer vision detection (YOLOv8/YOLOv12), acoustic classification using log-mel spectrograms, and trajectory prediction using ML. GPU-accelerated RF signal processing with XGBoost classification.

### Why It's a Crown Jewel for DEFONEOS
- **Multi-Modal:** RF + acoustic + visual + thermal detection fusion
- **Low-Cost Hardware:** ESP32 for RF scanning, $5 MEMS mics for acoustic
- **AI-Powered:** YOLO for visual, XGBoost for RF, EfficientNet for audio
- **Datasets Available:** Anti-UAV, VisDrone, Drone-vs-Bird, DroneAudioDataset
- **Scalable:** Deploy sensor networks at $10-50 per node

### Integration with MEOK Physical AI + UE5 SOV SPACE
- ESP32 sensor network = MEOK's existing IoT infrastructure
- Multi-modal fusion runs on MEOK edge compute
- Alert locations displayed on UE5 SOV SPACE Cesium globe in real-time

---

## CROWN JEWEL #23: MELISSA Counter-Drone Swarm
**GitHub/Source:** NATO STO publications (see BlueSwarm, Crown Jewel #19)
**Paper:** https://publications.sto.nato.int/publications/STO%20Meeting%20Proceedings/STO-MP-SET-315/MP-SET-315-26.pdf

### What It Does
MELISSA (Multi-drone system for Evasion, Identification, Localization, and Swarm-based Subduing of Air threats) is a NATO-developed counter-drone swarm system. Uses defending drones with net payloads and multi-agent reinforcement learning to autonomously detect, track, and neutralize intruding UAVs.

### Why It's a Crown Jewel for DEFONEOS
- **Autonomous Neutralization:** Net-capture of hostile drones without operator
- **Swarm-on-Swarm:** AI-coordinated defense against multiple attackers
- **Sensor Fusion:** Ground radar + EO gimbal + inter-drone data sharing
- **MARL Navigation:** Deep RL for coordinated approach and tracking
- **Explainable AI:** Rule-based algorithms for final neutralization phase

### Integration with MEOK Physical AI + UE5 SOV SPACE
- UE5 SOV SPACE renders full counter-drone engagement in 3D
- Cesium terrain used for radar line-of-sight analysis
- MARL training within UE5 before physical deployment

---

## CROWN JEWEL #24: Drone RFML + WarDragon Ecosystem
**GitHub/Source:** https://github.com/topics/drone-detection
**License:** Various open source

### What It Does
Machine learning-based RF signal processing for drone detection, classification, and tracking. Uses Mixture-of-Experts architectures on raw IQ recordings. WarDragon provides distributed counter-surveillance sensor network over LoRa mesh with a local web console. Multi-band passive detection on ESP32 covering 900MHz/2.4GHz/5.8GHz.

### Why It's a Crown Jewel for DEFONEOS
- **RF Machine Learning:** MoE architectures classify drone vs. non-drone RF signatures
- **Passive Detection:** No emissions — undetectable by adversary
- **LoRa Mesh Network:** Distributed sensor network over kilometers
- **IQ Signal Processing:** Raw RF data transformed into ML features
- **SwarmTally:** AI-powered drone counting and classification

### Integration with MEOK Physical AI + UE5 SOV SPACE
- ESP32 mesh = direct MEOK IoT platform integration
- RF detection data streams to UE5 for 3D electromagnetic situational awareness
- ML models deployable on MEOK edge compute (Jetson/Orange Pi)

---

# 6. SIMULATION & DIGITAL TWINS FOR DEFENSE

---

## CROWN JEWEL #25: Project AirSim (UE5-Based)
**GitHub/Source:** https://github.com/iamaisim/ProjectAirSim | https://iamaisim.com
**License:** MIT (based on original Microsoft AirSim)

### What It Does
Project AirSim is the community continuation of Microsoft's AirSim, rebuilt on Unreal Engine 5. Provides high-fidelity drone/robot simulation with photorealistic rendering, physics-accurate flight dynamics, PX4 SITL/HITL integration, multi-modal sensor simulation (camera, depth, lidar, IMU), and APIs for Python/C++/C#/Java.

### Why It's a Crown Jewel for DEFONEOS
- **UE5 Photorealism:** Photorealistic environments for AI training data generation
- **PX4 SITL/HITL:** Same autopilot code in sim and real — seamless transfer
- **Custom Sensors:** Add radar, thermal, EO/IR sensors as needed
- **Multi-Vehicle:** Simulate drone swarms and UGV teams simultaneously
- **Synthetic Data:** Generate millions of labeled training images for free

### Integration with MEOK Physical AI + UE5 SOV SPACE
- **NATIVE UE5 INTEGRATION:** Project AirSim IS an UE5 plugin — direct SOV SPACE integration
- Cesium for georeferenced environments with accurate terrain
- Synthetic data generated from SOV SPACE terrain for AI training

---

## CROWN JEWEL #26: NVIDIA Isaac Sim + Isaac Lab
**GitHub/Source:** https://github.com/isaac-sim/IsaacSim | https://github.com/isaac-sim/IsaacLab
**License:** NVIDIA Omniverse License (free for individuals/research)

### What It Does
NVIDIA Isaac Sim is a GPU-accelerated robot simulation platform built on Omniverse. Features RTX real-time rendering, GPU physics (PhysX), multi-sensor simulation, synthetic data generation, and ROS2 bridge. Isaac Lab provides GPU-accelerated RL training. Now open-source (Isaac Sim 5.0).

### Why It's a Crown Jewel for DEFONEOS
- **GPU-Accelerated:** Thousands of robots simulated in parallel on single GPU
- **Photorealistic RTX:** Ray-traced rendering for vision-based AI training
- **Synthetic Data:** Domain-randomized training data at scale
- **Digital Twin:** Create exact digital replicas of physical MEOK robots
- **RL Training:** Isaac Lab enables GPU-accelerated policy training

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Isaac Sim creates digital twins of MEOK Unitree Go2, drones, and R1
- USD format enables asset transfer between Isaac Sim and UE5
- RL policies trained in Isaac Lab deployed to physical MEOK robots

---

## CROWN JEWEL #27: Panopticon AI (Military Wargaming)
**GitHub/Source:** https://github.com/Panopticon-AI-team/panopticon | https://panopticon-ai.com
**License:** Apache 2.0

### What It Does
Panopticon AI is an open-source, web-based military simulation platform compatible with OpenAI Gymnasium. Enables reinforcement learning in realistic wargaming scenarios. Features: web-based interface, custom wargame creation, RL agent training backend, and Gymnasium API for custom AI agents.

### Why It's a Crown Jewel for DEFONEOS
- **Military-First:** Specifically designed for defense wargaming applications
- **RL-Compatible:** Train AI agents on strategic military scenarios
- **Web-Based:** Deployable anywhere, accessible to distributed teams
- **Custom Scenarios:** Create any operational scenario needed
- **JHU SAIS:** Developed by Johns Hopkins School of Advanced International Studies

### Integration with MEOK Physical AI + UE5 SOV SPACE
- UE5 SOV SPACE can render Panopticon scenarios in immersive 3D
- Cesium provides georeferenced terrain for realistic wargaming
- RL agents from Panopticon can control real MEOK drone/UGV assets

---

## CROWN JEWEL #28: OmniDrones (NVIDIA Isaac Sim Drone RL)
**GitHub/Source:** https://github.com/btx0424/OmniDrones
**License:** MIT
**Paper:** https://arxiv.org/abs/2309.12825

### What It Does
OmniDrones is a GPU-accelerated platform for RL research on multi-rotor drones, built on NVIDIA Isaac Sim. Features: parallel environment simulation (100s of drones), benchmark tasks (hover, track, navigate, swarm), algorithm baselines (PPO, MAPPO, SAC), and sim-to-real deployment on Crazyflie 2.1.

### Why It's a Crown Jewel for DEFONEOS
- **Massively Parallel:** Train swarm policies on 4096 environments simultaneously
- **Multi-Agent:** Support for cooperative/competitive drone teams
- **Sim-to-Real:** Validated transfer from Isaac Sim to real Crazyflie
- **Downwash Modeling:** Realistic aerodynamic interaction between close drones
- **Benchmark Suite:** Standardized tasks for comparing algorithms

### Integration with MEOK Physical AI + UE5 SOV SPACE
- Train DEFONEOS swarm AI at scale before real deployment
- USD assets transfer to UE5 SOV SPACE for visualization
- Crazyflie validation path extends to larger PX4-based drones

---

# 7. AI FOR ELECTRONIC WARFARE

---

## CROWN JEWEL #29: GNU Radio + jamRF (SDR Electronic Warfare)
**GitHub/Source:** https://github.com/gnuradio/gnuradio | https://github.com/tiiuae/jamrf
**License:** GPLv3 (GNU Radio)

### What It Does
GNU Radio is the open-source signal processing framework for software-defined radio. jamRF implements SDR-based jamming (proactive and reactive) using HackRF hardware with single-tone, swept-sine, QPSK-modulated, and Gaussian noise waveforms. Supports energy-saving duty cycling and memory-enhanced reactive jamming.

### Why It's a Crown Jewel for DEFONEOS
- **Full Signal Processing:** Implement any EW technique in Python/C++
- **Hardware Flexible:** Works with HackRF, USRP, RTL-SDR, LimeSDR
- **Cognitive EW:** AI-driven spectrum sensing and adaptive jamming
- **Jamming Toolkit:** Proactive, reactive, sweeping, and noise jamming
- **Anti-Jamming:** Frequency-hopping communication defense

### Integration with MEOK Physical AI + UE5 SOV SPACE
- GNU Radio flowgraphs integrate with MEOK ESP32-S3 + LoRa mesh
- Spectrum data visualized in UE5 SOV SPACE as electromagnetic heatmaps
- AI agents control jamming parameters via Python API

---

## CROWN JEWEL #30: GRaTe-BED (GNU Radio Testbed for EW)
**GitHub/Source:** Referenced in academic papers; GNU Radio ecosystem
**License:** GPLv3

### What It Does
GRaTe-BED (GNU Radio Based Testbed) is an open-source framework for evaluating UAS communication systems using SDR. Supports RF test and evaluation, protocol analysis (MAVLink), jamming simulation, and spectrum monitoring. Designed to migrate physical RF measurements to simulation for cost-effective testing.

### Why It's a Crown Jewel for DEFONEOS
- **UAS Communication Analysis:** Analyze MAVLink and other drone protocols
- **SDR-Based T&E:** Cost-effective RF testing without expensive lab equipment
- **Simulation-to-Real:** Validate EW techniques in sim before field deployment
- **Protocol Reverse Engineering:** Understand adversary drone communication

### Integration with MEOK Physical AI + UE5 SOV SPACE
- RF spectrum data feeds into UE5 SOV SPACE for electromagnetic situational awareness
- SDR hardware connects to MEOK ESP32 mesh for distributed sensing
- MAVLink analysis informs counter-drone electronic attack strategies

---

# INTEGRATION ROADMAP: DEFONEOS HIVE ARCHITECTURE

```
+--------------------------------------------------------------------------+
|                           DEFONEOS HIVE ARCHITECTURE                      |
+--------------------------------------------------------------------------+
|                                                                          |
|  LAYER 7: COMMAND & CONTROL (UE5 SOV SPACE + Cesium)                     |
|  +------------------------------------------------------------------+    |
|  | Panopticon AI | Cesium 3D Globe | Mission Planning | Dashboard |    |
|  +------------------------------------------------------------------+    |
|                                                                          |
|  LAYER 6: AI/ML ORCHESTRATION                                           |
|  +------------------------------------------------------------------+    |
|  | MARLlib/PettingZoo | Autoware AI | YOLO/Ultralytics | Custom RL |   |
|  +------------------------------------------------------------------+    |
|                                                                          |
|  LAYER 5: SIMULATION & DIGITAL TWINS                                    |
|  +------------------------------------------------------------------+    |
|  | Project AirSim(UE5) | Isaac Sim/OmniDrones | Gazebo | CARLA     |   |
|  +------------------------------------------------------------------+    |
|                                                                          |
|  LAYER 4: FLEET OPERATING SYSTEM                                        |
|  +------------------------------------------------------------------+    |
|  | MAVSDK Drone Show | AeroStack2 | Crazyswarm2 | MOOS-IvP          |   |
|  +------------------------------------------------------------------+    |
|                                                                          |
|  LAYER 3: AUTOPILOT & NAVIGATION                                        |
|  +------------------------------------------------------------------+    |
|  | PX4 Autopilot | ArduPilot | ArduSub | Nav2 | ugv_nav4d           |   |
|  +------------------------------------------------------------------+    |
|                                                                          |
|  LAYER 2: PHYSICAL PLATFORMS                                            |
|  +------------------+  +---------------+  +-------------------------+    |
|  | AERIAL           |  | GROUND        |  | MARITIME               |    |
|  | PX4/ArduPilot    |  | Husky/JPL/    |  | BlueROV2/MOOS-IvP/     |    |
|  | Drones + Swarm   |  | Unitree Go2/  |  | DH200 ASV              |    |
|  | Crazyflie        |  | Unitree R1    |  |                        |    |
|  +------------------+  +---------------+  +-------------------------+    |
|                                                                          |
|  LAYER 1: SENSOR & IoT INFRASTRUCTURE                                   |
|  +------------------------------------------------------------------+    |
|  | ESP32 Mesh Network | Batear Acoustic | RF Detection | LiDAR/    |   |
|  | LoRaWAN           | Drone Detector  | (GNU Radio)   | Cameras   |   |
|  +------------------------------------------------------------------+    |
+--------------------------------------------------------------------------+
```

---

# PRIORITY RECOMMENDATIONS FOR MEOK.AI

## IMMEDIATE (Week 1-2)
1. **Deploy PX4 SITL** with Project AirSim on UE5 SOV SPACE for drone simulation
2. **Set up Crazyswarm2** with Crazyflie 2.1 for indoor swarm testing
3. **Install MAVSDK Drone Show** for fleet operations control panel
4. **Deploy Batear** on MEOK ESP32 hardware for acoustic counter-drone detection

## SHORT-TERM (Month 1-3)
5. **Integrate NASA JPL Rover** with ROS2 Nav2 and MEOK ESP32 sensors
6. **Deploy MOOS-IvP** on Raspberry Pi for maritime autonomy testing
7. **Set up MARLlib** on MEOK compute cluster for swarm AI training
8. **Build CARLA/Autoware** pipeline for UGV autonomy development

## MEDIUM-TERM (Month 3-6)
9. **Full TENA integration** for DoD test range interoperability
10. **OmniDrones/Isaac Lab** for GPU-accelerated swarm RL training
11. **Panopticon AI** wargaming scenarios integrated with UE5 SOV SPACE
12. **Counter-drone fusion** system: Batear + RF + Visual via ESP32 mesh

## STRATEGIC (Month 6-12)
13. **OFFSET-inspired** 50+ agent swarm demonstrations
14. **Digital twin** of all MEOK physical assets in Isaac Sim
15. **Autonomous EW** capability with GNU Radio + AI spectrum sensing
16. **NATO STANAG** compliance testing for interoperability

---

# LICENSE & COST SUMMARY

| Crown Jewel | License | Est. Cost |
|-------------|---------|-----------|
| PX4 Autopilot | BSD | Free |
| ArduPilot | GPLv3 | Free |
| AeroStack2 | BSD | Free |
| MAVSDK | BSD | Free |
| MAVSDK Drone Show | PolyForm/Commercial | Free (noncommercial) |
| Flightmare | MIT | Free |
| NASA JPL Rover | Apache 2.0 | ~$2,500 hardware |
| Clearpath Husky | BSD | ~$20,000 hardware |
| UGV Nav4D | BSD | Free |
| Autoware | Apache 2.0 | Free |
| Unitree Go2 SDK | BSD | Free (SDK) |
| MOOS-IvP | GPLv3/LGPLv3 | Free |
| BlueOS + ArduSub | GPLv3 | Free (software) |
| DH200 ASV | MIT | ~$1,900 hardware |
| VRX/UUV Simulator | Apache 2.0 | Free |
| Crazyswarm2 | MIT | Free (software) |
| DARPA OFFSET | Government | Free (architecture) |
| MARLlib | MIT | Free |
| BlueSwarm/MELISSA | NATO publication | Free (papers) |
| S-drone | MIT | ~$2,250/drone |
| Batear | Open Source | ~$10/unit |
| RF Drone Detection | Various | Free-Open |
| Project AirSim | MIT | Free |
| NVIDIA Isaac Sim | NVIDIA (free) | Free (research) |
| Panopticon AI | Apache 2.0 | Free |
| OmniDrones | MIT | Free |
| GNU Radio + jamRF | GPLv3 | Free (software) |
| GRaTe-BED | GPLv3 | Free |
| **TOTAL SOFTWARE COST** | | **$0 (ALL FREE)** |

---

**Report Compiled:** 2025
**Sources:** 30+ GitHub repositories, DARPA publications, NATO STO papers, academic papers, vendor documentation
**Methodology:** Systematic web search across 7 autonomous defense domains with cross-reference validation

*This intelligence report is designed for MEOK.AI's DEFONEOS Hive autonomous defense systems development. All sources are open-source and publicly available.*
