# Deep Research: Autonomous Humanoid Robots for CSOAI Town Simulation

**Research Date**: 2025-07-18
**Researcher**: Technical Research Specialist (Humanoid Robotics & Embodied AI)
**Objective**: Identify open-source tools, simulators, models, and frameworks for integrating 47 autonomous humanoid robot agents into CSOAI's Unreal Engine 5.8 sovereign AI town simulation.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [NVIDIA Isaac Sim / Isaac Lab](#2-nvidia-isaac-sim--isaac-lab)
3. [MuJoCo Physics Ecosystem](#3-mujoco-physics-ecosystem)
4. [PyBullet](#4-pybullet)
5. [Gazebo (Modern)](#5-gazebo-modern)
6. [Boston Dynamics Spot](#6-boston-dynamics-spot)
7. [Unitree H1 / G1 Humanoid](#7-unitree-h1--g1-humanoid)
8. [Tesla Optimus Simulation](#8-tesla-optimus-simulation)
9. [Figure AI](#9-figure-ai)
10. [Unreal Robotics Lab (URLab)](#10-unreal-robotics-lab-urlab)
11. [MetaHuman Animator in UE5](#11-metahuman-animator-in-ue5)
12. [NVIDIA ACE Game Agent SDK](#12-nvidia-ace-game-agent-sdk)
13. [NVIDIA Isaac GR00T](#13-nvidia-isaac-gr00t)
14. [Newton Physics Engine](#14-newton-physics-engine)
15. [Genesis Embodied AI Platform](#15-genesis-embodied-ai-platform)
16. [K-Scale Labs (K-Sim / ToddlerBot)](#16-k-scale-labs-k-sim--toddlerbot)
17. [OpenLoong Community](#17-openloong-community)
18. [Facebook AI Habitat](#18-facebook-ai-habitat)
19. [Webots](#19-webots)
20. [LocoMuJoCo Imitation Learning Benchmark](#20-locomujoco-imitation-learning-benchmark)
21. [Stanford Generative Agents (AI Town)](#21-stanford-generative-agents-ai-town)
22. [Additional Notable Projects](#22-additional-notable-projects)
23. [Comparative Matrix](#23-comparative-matrix)
24. [Integration Recommendations for CSOAI](#24-integration-recommendations-for-csoai)
25. [References](#25-references)

---

## 1. Executive Summary

This research identifies **25+ open-source tools and platforms** for simulating autonomous humanoid robots in virtual environments, with specific focus on integration with Unreal Engine 5.8 for the CSOAI Town simulation.

### Key Findings

| Priority | Tool | Best For | UE5 Integration |
|----------|------|----------|-----------------|
| **#1** | **Unreal Robotics Lab (URLab)** | Native MuJoCo physics in UE5 | Native plugin (UE5.7+) |
| **#2** | **NVIDIA Isaac Sim + Isaac Lab** | GPU-accelerated multi-agent simulation | Omniverse Connector to UE5 |
| **#3** | **MuJoCo + MuJoCo Menagerie** | Physics-accurate humanoid models | Via URLab or standalone |
| **#4** | **NVIDIA ACE Game Agent SDK** | AI-driven NPC behavior | Native UE5 plugin |
| **#5** | **NVIDIA Isaac GR00T N1** | Foundation model for humanoid reasoning | Via Isaac Sim pipeline |
| **#6** | **Genesis** | Ultra-fast parallel simulation | Export to USD/OBJ |
| **#7** | **MetaHuman + Animation** | Photo-realistic humanoid characters | Native UE5 |
| **#8** | **Gazebo Harmonic + ROS2** | ROS-based robot control | Via ROSIntegration plugin |
| **#9** | **K-Sim + Humanoid Models** | RL training for locomotion | MuJoCo -> URLab pipeline |
| **#10** | **Newton Physics Engine** | Next-gen GPU physics | Isaac Lab integration |

### Recommended CSOAI Architecture

```
Unreal Engine 5.8 (Rendering + Town Environment)
    +-- Unreal Robotics Lab (URLab) Plugin [MuJoCo Physics]
    |       +-- MuJoCo Menagerie [Humanoid Models: H1, G1, Spot, etc.]
    |       +-- K-Sim [RL Locomotion Policies]
    |
    +-- NVIDIA ACE Game Agent SDK [AI NPC Behavior]
    |       +-- LLM-based reasoning + memory + planning
    |
    +-- MetaHuman Animator [Facial Animation]
    |
    +-- Isaac Sim (optional) [Synthetic Data Generation]
    |       +-- Isaac GR00T N1 [Foundation Model]
    |
    +-- ROS2 Bridge [External Robot Control]
```

---

## 2. NVIDIA Isaac Sim / Isaac Lab

### Overview
NVIDIA Isaac Sim is an open-source robotics simulation framework built on NVIDIA Omniverse, designed for developing, simulating, and testing AI-driven robots in physically based virtual environments. Isaac Lab is a unified robot learning framework built on top of Isaac Sim.

### Links
- **GitHub**: https://github.com/isaac-sim/IsaacSim [^1302^][^1306^]
- **Isaac Lab**: https://github.com/isaac-sim/IsaacLab [^1315^]
- **Documentation**: https://developer.nvidia.com/isaac/sim
- **Latest Version**: Isaac Sim 5.0, Isaac Lab 2.2 (Developer Preview, 2025)

### License
- **Apache 2.0** (for Isaac Sim framework)
- **NVIDIA Omniverse License Agreement** (for Omniverse Kit distribution)
- Free for individual/research use; enterprise license for commercial redistribution [^1306^]

### Physics Fidelity
- **Engine**: NVIDIA PhysX 5 (GPU-accelerated)
- **Capabilities**: Rigid body dynamics, soft body, cloth, fluid, deformable objects
- **Strengths**: Angular stability, GPU scalability, photorealistic rendering via Omniverse RTX
- **Limitations**: Contact dynamics and linear stability may lag behind MuJoCo for high-accuracy control [^1345^]

### UE5 Integration Path
- NVIDIA Omniverse provides a **UE5 Connector** for USD-based scene exchange
- Isaac Sim scenes can be exported to USD and imported into UE5
- Two-way live sync possible via Omniverse Nucleus
- **Newton physics engine** (co-developed with DeepMind and Disney) will be available in Isaac Lab for more accurate physics [^1340^]

### Simultaneous Humanoid Capacity
- GPU-dependent: Single RTX 4090 can simulate **hundreds of humanoids** in parallel
- Multi-GPU scaling supported (DGX systems)
- Isaac Lab supports batched/vectorized environments for RL training

### Effort Level to Integrate
- **Medium-High**: Requires Omniverse setup, USD pipeline, and UE5 connector configuration
- Docker containers available for quick deployment
- Good documentation and community support

### CSOAI Use Case
- Use Isaac Sim for **synthetic data generation** and **RL policy training** for humanoid behaviors
- Isaac Lab for training locomotion and manipulation policies
- Export trained policies to UE5 via ONNX/TensorRT
- Isaac GR00T N1 for humanoid reasoning capabilities [^1348^]

---

## 3. MuJoCo Physics Ecosystem

### 3.1 MuJoCo Core

#### Overview
MuJoCo (Multi-Joint dynamics with Contact) is a general-purpose physics engine for robotics, biomechanics, graphics, and machine learning. Acquired and open-sourced by Google DeepMind in 2022.

#### Links
- **GitHub**: https://github.com/google-deepmind/mujoco [^1310^]
- **Website**: https://mujoco.org/
- **Documentation**: https://mujoco.readthedocs.io/

#### License
- **Apache 2.0** [^1301^]

#### Physics Fidelity
- **Engine**: Custom C library with no dynamic memory allocation
- **Strengths**: Best-in-class contact dynamics, soft-contact modeling, accuracy, stability
- **Benchmarked**: Superior to PhysX, Bullet, and ODE for contact-rich robotic tasks [^1345^]
- **Ideal for**: Complex grasping, locomotion, and humanoid balance control

### 3.2 MuJoCo Warp (MJWarp)

#### Overview
GPU-accelerated version of MuJoCo, designed for NVIDIA hardware. Delivers high-throughput simulation.

#### Links
- **GitHub**: https://github.com/google-deepmind/mujoco_warp [^1303^]
- **Installation**: `pip install mujoco-warp`

#### License
- **Apache 2.0**

### 3.3 MuJoCo Menagerie

#### Overview
Collection of high-quality simulation models for MuJoCo, curated by Google DeepMind. Includes numerous humanoid robots.

#### Links
- **GitHub**: https://github.com/google-deepmind/mujoco_menagerie [^1305^]

#### Humanoid Models Available

| Model | DoFs | License | Source |
|-------|------|---------|--------|
| **Unitree H1** | 19 | BSD-3-Clause | Unitree |
| **Unitree G1** | 29 | BSD-3-Clause | Unitree |
| **Robotis OP3** | 20 | Apache-2.0 | Robotis |
| **TALOS** | 44 | Apache-2.0 | PAL Robotics |
| **Booster T1** | 23 | Apache-2.0 | Booster Robotics |
| **ToddlerBot 2XC** | 44 | MIT | Stanford |
| **PNDbotics Adam_lite** | 25 | MIT | PNDbotics |
| **Apptronik Apollo** | 32 | Apache-2.0 | Apptronik |
| **Berkeley Humanoid** | 12 | BSD-3-Clause | UC Berkeley |
| **Fourier N1** | 23 | Apache-2.0 | Fourier Intelligence |
| **Agility Cassie** | 28 | MIT | Agility Robotics |

### 3.4 MuJoCo Playground

#### Overview
Comprehensive suite of GPU-accelerated environments for robot learning, built with MuJoCo MJX.

#### Links
- **GitHub**: https://github.com/google-deepmind/mujoco_playground [^1304^]
- **Installation**: `pip install playground`

#### Features
- Classic control, locomotion, and manipulation environments
- Supports both MJX JAX and MuJoCo Warp implementations
- Vision-based support via MJWarp Batch Renderer

### UE5 Integration Path
- **Primary**: Unreal Robotics Lab (URLab) plugin embeds MuJoCo directly in UE5
- **Alternative**: Standalone MuJoCo with Python bridge to UE5
- **Model Import**: MJCF XML files can be imported into UE5 via URLab

### CSOAI Use Case
- **Physics backbone** for all humanoid agents via URLab
- Use MuJoCo Menagerie for ready-to-use humanoid models (H1, G1, TALOS, etc.)
- MuJoCo Playground for training locomotion policies in parallel
- MuJoCo Warp for GPU-accelerated simulation of 47 agents

---

## 4. PyBullet

### Overview
Python interface for the Bullet Physics SDK, offering straightforward robot simulation with focus on machine learning and reinforcement learning applications.

### Links
- **Website**: https://pybullet.org/ [^1308^]
- **GitHub**: https://github.com/bulletphysics/bullet3

### License
- **zlib/libpng License** (open source, permissive)

### Physics Fidelity
- **Engine**: Bullet Physics
- **Strengths**: Easy Python integration, OpenAI Gym integration, VR support
- **Limitations**: Contact dynamics precision lags behind MuJoCo [^1345^]
- **Performance**: Suitable for RL research but slower than GPU-accelerated alternatives

### UE5 Integration Path
- No direct UE5 plugin available
- Can be used standalone with data exchange to UE5 via ROS or custom Python bridge
- pyCub project demonstrates iCub humanoid simulation in PyBullet [^1312^]

### Simultaneous Humanoid Capacity
- CPU-bound; typically 1-10 humanoids depending on complexity
- Good for prototyping, not for large-scale multi-agent

### Effort Level to Integrate
- **Medium** for standalone use; **High** for UE5 integration

### CSOAI Use Case
- Rapid prototyping of control algorithms
- Academic baseline for comparison
- Less suitable for 47-agent UE5 simulation

---

## 5. Gazebo (Modern)

### Overview
Open-source robotics simulator maintained by Open Source Robotics Foundation (OSRF). The modern version (Gazebo Sim, formerly Ignition) replaces Gazebo Classic which reached end-of-life in January 2025.

### Links
- **GitHub**: https://github.com/gazebosim/gz-sim [^1315^][^1353^]
- **Website**: https://gazebosim.org/
- **Latest LTS**: Gazebo Harmonic (pairs with ROS 2 Jazzy)

### License
- **Apache 2.0**

### Physics Fidelity
- **Engines**: ODE, Bullet, Simbody, DART (selectable)
- **Strengths**: Mature ROS/ROS2 integration, extensive sensor models, large model library
- **Rendering**: RealSense-quality but not photorealistic

### UE5 Integration Path
- **ROSIntegration plugin** for UE4/UE5: https://github.com/code-iai/ROSIntegration [^1315^]
- **ros2-for-unity** available for Unity (not UE5)
- Gazebo can run as co-simulator with UE5 via ROS2 bridge

### Simultaneous Humanoid Capacity
- CPU-dependent; typically 5-20 agents
- Less scalable than GPU-accelerated alternatives

### Effort Level to Integrate
- **Medium** for ROS2-based systems; **High** for UE5 integration

### CSOAI Use Case
- Alternative physics backend via ROS2 bridge
- Good for sensor simulation and navigation testing
- Less ideal for photorealistic 47-agent town simulation

---

## 6. Boston Dynamics Spot

### Overview
Boston Dynamics Spot is a quadruped robot (not humanoid but relevant for town simulation). The URDF model is available in MuJoCo Menagerie and various simulation packages exist.

### Links
- **MuJoCo Menagerie Model**: https://github.com/google-deepmind/mujoco_menagerie/tree/main/boston_dynamics_spot [^1305^]
- **GitHub Topic**: https://github.com/topics/boston-dynamics [^1311^]
- **SoftServe Gazebo**: https://github.com/softserveinc/spot_simulation [^1313^]

### License
- **BSD-3-Clause** (MuJoCo model)

### Physics Fidelity
- Accurate 19-DoF model in MuJoCo
- Forward/inverse kinematics support
- Contact sensors on feet

### UE5 Integration Path
- Import MuJoCo Spot model via URLab plugin
- Gazebo models can be converted to URDF -> MJCF -> UE5
- CHAMP package provides ROS navigation stack integration

### CSOAI Use Case
- Security patrol agents in town
- Delivery robot agents
- Can coexist with humanoid agents in the same simulation

---

## 7. Unitree H1 / G1 Humanoid

### Overview
Unitree is a leading humanoid robot manufacturer. Both H1 and G1 are available as open-source simulation models with extensive RL training frameworks.

### Links
- **Unitree GitHub**: https://github.com/unitreerobotics [^1303^]
- **Isaac Lab Sim**: https://github.com/unitreerobotics/unitree_sim_isaaclab
- **MuJoCo Interface**: https://github.com/unitreerobotics/unitree_mujoco
- **RL Gym**: https://github.com/unitreerobotics/unitree_rl_gym
- **RL Lab**: https://github.com/unitreerobotics/unitree_rl_lab
- **RL MJ Lab**: https://github.com/unitreerobotics/unitree_rl_mjlab
- **LeRobot Integration**: https://github.com/unitreerobotics/unitree_lerobot

### License
- **BSD-3-Clause** (MuJoCo models)
- Open-source software packages

### Specifications

| Model | Height | Weight | DoFs | Key Feature |
|-------|--------|--------|------|-------------|
| **H1** | ~1.8m | ~47kg | 19 | Full-size, high performance |
| **G1** | ~1.3m | ~35kg | 29 | Compact, dexterous manipulation |
| **H1-2** | ~1.8m | ~47kg | - | Updated version |

### Physics Fidelity
- High-fidelity URDF/MJCF models with accurate dynamics
- Sim-to-real validated: policies trained in simulation transfer to real robots
- Terrain generator support for rough terrain training

### UE5 Integration Path
- Import MJCF models into UE5 via URLab
- Unitree provides USD assets for Omniverse/UE5
- DDS communication interface matches physical robots

### Simultaneous Humanoid Capacity
- Isaac Lab: hundreds in parallel on GPU
- MuJoCo: tens on CPU, hundreds with MJX/Warp

### Effort Level to Integrate
- **Low-Medium**: Well-documented models and training pipelines

### CSOAI Use Case
- **Primary humanoid platform** for town agents
- Use H1 for adult-sized worker characters (construction, delivery, security)
- Use G1 for service worker characters (retail, hospitality)
- RL-trained policies for realistic walking, object manipulation, and interaction

---

## 8. Tesla Optimus Simulation

### Overview
Tesla Optimus is a proprietary humanoid robot with no official open-source simulation released by Tesla. However, community replicas exist.

### Open-Source Replicas
- **No major official open-source replica** found as of mid-2025
- Community MJCF models may exist in MuJoCo Menagerie or independent repos
- Generally not recommended for serious simulation work due to lack of validated models

### CSOAI Use Case
- Not recommended unless a validated community model is found
- Consider Unitree H1/G1 or TALOS as open alternatives

---

## 9. Figure AI

### Overview
Figure AI is a humanoid robotics company (Figure 02 robot). They are adopting NVIDIA Isaac and Omniverse technologies but do not offer open-source simulation models.

### Links
- **Company**: https://www.figure.ai/
- **NVIDIA Partnership**: Figure AI is listed as adopter of NVIDIA Isaac and Omniverse [^1305^]

### License
- **Proprietary** (no open-source simulation models available)

### CSOAI Use Case
- Not directly usable (closed source)
- Consider open alternatives: Unitree H1, Apptronik Apollo, or TALOS

---

## 10. Unreal Robotics Lab (URLab)

### Overview
**The most relevant tool for CSOAI.** URLab is an open-source Unreal Engine 5 plugin that embeds the MuJoCo physics engine directly into UE5 editor and runtime, providing research-grade contact dynamics with photorealistic rendering.

### Links
- **GitHub**: https://github.com/URLab-Sim/UnrealRoboticsLab [^1343^]
- **Paper**: https://arxiv.org/abs/2504.14135 [^1341^]
- **Website**: https://urlab-sim.github.io/UnrealRoboticsLab/
- **Documentation**: https://urlab-sim.github.io/UnrealRoboticsLab
- **Python Bridge**: https://github.com/URLab-Sim/urlab_bridge

### License
- **Apache 2.0** [^1346^]

### Key Features
- Drag-and-drop MJCF import into UE5 Content Browser
- MuJoCo physics on dedicated thread, Unreal rendering on main thread
- Supports joints, actuators, tendons, muscles, flexcomp
- PD controllers with live gain tuning
- RGB, depth, segmentation camera sensors with real intrinsics
- Record and replay simulation episodes deterministically
- ZMQ and ROS2 communication bridges
- Lumen global illumination, Nanite virtualized geometry, Niagara particles [^1341^]

### UE5 Integration
- **Native UE5.7+ plugin** (C++ project required)
- Install: clone into `Plugins/` folder, build dependencies
- Supports Windows (Win64) and Linux (x86_64)

### Simultaneous Humanoid Capacity
- Depends on GPU and scene complexity
- MuJoCo thread handles physics while UE renders
- Estimated: 10-50 humanoids with photorealistic rendering on high-end hardware

### Effort Level to Integrate
- **Medium**: C++ project setup, build dependencies, import humanoid models
- Full documentation and quickstart guides available

### CSOAI Use Case
- **PRIMARY RECOMMENDATION** for CSOAI Town
- Embed MuJoCo humanoid models (H1, G1, TALOS, ToddlerBot) directly in UE5
- Realistic walking, interaction, and manipulation physics
- Use with NVIDIA ACE for AI behavior and MetaHuman for visual appearance
- ROS2 bridge for external AI controller integration

---

## 11. MetaHuman Animator in UE5

### Overview
MetaHuman is Epic Games' framework for creating photorealistic digital humans in Unreal Engine. MetaHuman Animator generates facial animation from video/audio input.

### Links
- **Documentation**: https://dev.epicgames.com/documentation/metahuman/metahuman-animator [^1307^]
- **MetaHuman Plugin**: Built into UE5

### License
- **Free with Unreal Engine** (Epic Games EULA, free for projects under $1M revenue)

### Key Features
- Photorealistic human characters
- Real-time facial animation from webcam (Live Link Face)
- Audio-driven animation (offline from audio files)
- Full body animation via IK retargeting
- Convai integration for AI-driven NPCs with custom actions [^1308^]

### UE5 Integration
- **Native UE5** - no external integration needed

### CSOAI Use Case
- Visual appearance layer for humanoid agents
- MetaHuman bodies + MuJoCo physics skeletons via URLab
- Facial animation for agent-agent and agent-player communication
- AI-driven behavior via Convai or custom LLM integration

---

## 12. NVIDIA ACE Game Agent SDK

### Overview
NVIDIA ACE (Avatar Cloud Engine) Game Agent SDK is an open-source C/C++ agentic framework for creating AI companions and NPCs in games. Features autonomous reasoning, tool use, and RAG.

### Links
- **NVIDIA Blog**: https://developer.nvidia.com/blog/build-on-device-ai-companions-with-the-nvidia-ace-game-agent-sdk-and-unreal-engine-5-plugins/ [^1316^]
- **Download**: https://www.nvidia.com/en-us/ai/ace-game-agent-sdk/

### License
- **Open source, fully customizable** (SDK license)
- Free for development

### Key Features
- **Agent API**: Stateful, autonomously drives multistep tool-assisted reasoning
- **Chat API**: Stateless inference API
- **RAG API**: Semantic/lexical/hybrid knowledge retrieval
- Optimized for small models running on NVIDIA RTX hardware
- UE5 plugins available

### UE5 Integration
- **Native UE5 plugins** available
- C/C++ SDK for custom integration
- On-device inference (no cloud required)

### Simultaneous Agent Capacity
- Depends on GPU VRAM
- Optimized for small models; can run 10-50 agents on RTX 4090

### Effort Level to Integrate
- **Low-Medium**: UE5 plugins available, good documentation

### CSOAI Use Case
- **AI brain** for each humanoid agent
- Per-agent memory, reasoning, planning, and tool use
- Agents can perceive town environment, make decisions, and coordinate
- RAG for town knowledge (locations, schedules, social graph)
- Natural language interaction between agents and with players

---

## 13. NVIDIA Isaac GR00T

### Overview
Isaac GR00T N1 is the world's first open, fully customizable foundation model for generalized humanoid reasoning and skills. Enables developers to build, train, and deploy AI-powered humanoid robots.

### Links
- **GitHub**: https://github.com/Nvidia/Isaac-GR00T [^1348^]
- **Hugging Face**: Model weights available for download
- **NVIDIA News**: https://nvidianews.nvidia.com/news/nvidia-isaac-gr00t-n1-open-humanoid-robot-foundation-model-simulation-frameworks [^1340^]
- **Blueprint**: https://build.nvidia.com/nvidia/isaac-gr00t-blueprint

### License
- **Apache 2.0** (fully commercially licensable)

### Model Versions
- **N1.7 EA** (Early Access, latest) - Cosmos-Reason2-2B / Qwen3-VL backbone [^1348^]
- **N1.6** - Cosmos Reason integration [^1344^]
- **N1.5** - Enhanced instruction following

### Architecture
- **Dual-system architecture** inspired by human cognition:
  - **System 1** (fast): Action model for reflexive/intuitive movements
  - **System 2** (slow): Vision-language model for deliberate reasoning and planning
- Diffusion transformer head for continuous action denoising

### CSOAI Use Case
- Foundation model for humanoid agent decision-making
- Can be post-trained with CSOAI Town-specific data
- Generates realistic manipulation policies (grasping, moving objects)
- Deploy via Isaac Sim pipeline or export to UE5

---

## 14. Newton Physics Engine

### Overview
Open-source, GPU-accelerated physics engine co-developed by NVIDIA, Google DeepMind, and Disney Research. Built on NVIDIA Warp framework, managed by Linux Foundation.

### Links
- **Available in**: NVIDIA Isaac Lab
- **NVIDIA News**: https://nvidianews.nvidia.com/news/nvidia-accelerates-robotics-research-and-development-with-new-open-models-and-simulation-libraries [^1344^]

### License
- **Open source** (Linux Foundation managed)

### Key Features
- Built on NVIDIA Warp and OpenUSD
- Compatible with MuJoCo and Isaac Lab
- GPU-accelerated: enables complex simulations like walking through snow/gravel
- Multiple physics solver types

### CSOAI Use Case
- Future physics backend for Isaac Sim
- More accurate than PhysX for humanoid locomotion
- Watch for integration with URLab or standalone UE5 plugin

---

## 15. Genesis Embodied AI Platform

### Overview
Genesis is a universal physics platform for robotics and embodied AI. Rebuilt from the ground up with a universal physics engine, photorealistic rendering, and a generative data engine.

### Links
- **GitHub**: https://github.com/Genesis-Embodied-AI/Genesis [^1351^]
- **Genesis World**: https://github.com/Genesis-Embodied-AI/genesis-world [^1357^]
- **Documentation**: https://genesis-world.readthedocs.io/
- **Website**: https://genesis-embodied-ai.github.io/

### License
- **Apache 2.0**

### Key Features
- **Speed**: 43+ million FPS simulating Franka arm on RTX 4090 [^1351^]
- **Cross-platform**: Linux, macOS, Windows; CPU, NVIDIA/AMD GPUs, Apple Metal
- **Physics solvers**: Rigid body, MPM, SPH, FEM, PBD, Stable Fluid
- **Rendering**: Native ray-tracing (Nyx renderer)
- **Differentiable**: MPM solver and Tool Solver support differentiability
- **Asset formats**: MJCF, URDF, OBJ, GLB, USD, PLY, STL

### UE5 Integration Path
- Export scenes to USD/OBJ for UE5 import
- No direct UE5 plugin yet
- Can be used for policy training, then deploy to UE5

### Simultaneous Humanoid Capacity
- Extremely high: designed for massive parallelization
- 430,000x faster than real-time on single GPU

### Effort Level to Integrate
- **Medium** for standalone; **High** for UE5 integration (no native plugin)

### CSOAI Use Case
- **Policy training engine** for humanoid locomotion and manipulation
- Train policies at massive scale, then transfer to UE5
- Synthetic data generation for agent behaviors
- Future: generative features for automatic scene creation

---

## 16. K-Scale Labs (K-Sim / ToddlerBot)

### 16.1 K-Sim

#### Overview
Open-source RL training library for humanoid locomotion and manipulation, built on MuJoCo and JAX by K-Scale Labs.

#### Links
- **GitHub**: https://github.com/kscalelabs/ksim [^1349^]
- **K-Sim Gym**: https://github.com/kscalelabs/kscale-gym
- **Website**: https://kscale.dev/

#### License
- **MIT** (ksim), **Apache 2.0** (kteleop)

#### Key Features
- MuJoCo + JAX for GPU-accelerated RL training
- Leaderboard system for comparing policies
- Humanoid locomotion and manipulation tasks

### 16.2 ToddlerBot

#### Overview
Open-source, ML-compatible humanoid robot platform from Stanford. Low-cost (under $6,000), 3D-printed, designed for scalable policy learning.

#### Links
- **GitHub**: https://github.com/hshi74/toddlerbot [^1368^]
- **Paper**: https://arxiv.org/abs/2502.00893 [^1372^]
- **Awesome List**: https://github.com/YanjieZe/awesome-humanoid-robot-learning [^1367^]

#### Specifications
- Height: 0.56m, Weight: 3.4kg
- DoFs: 44 (2XC version)
- Cost: Under $6,000 USD
- License: MIT (code), CC-BY-NC-SA-4.0 (design)

### CSOAI Use Case
- ToddlerBot models available in MuJoCo Menagerie for child-sized town characters
- K-Sim for training locomotion policies
- Can represent child/student agents in CSOAI Town

---

## 17. OpenLoong Community

### Overview
World's first open-source community platform for humanoid robots, launched by Shanghai Innovation Center. Provides hardware, software, models, and datasets.

### Links
- **Website**: https://www.openloong.org.cn/en [^1339^]

### Key Projects

| Project | Description |
|---------|-------------|
| **Qinglong** | China's first open-source full-size humanoid (1.82m, 82kg, 43 DoF) |
| **Qinglong Mini** | Small humanoid for RL training |
| **Gewu** | Embodied intelligence simulation platform (fully open-sourced) |
| **Baihu** | Heterogeneous humanoid robot dataset |
| **OmniT-Hand** | Three-finger adaptive dexterous hand |

### License
- Various open-source licenses

### CSOAI Use Case
- Qinglong humanoid model for adult worker characters
- Gewu simulation platform for alternative training pipeline
- Datasets for behavior cloning

---

## 18. Facebook AI Habitat

### Overview
Flexible, high-performance 3D simulator for embodied AI research. Primarily for indoor navigation but supports physics simulation.

### Links
- **GitHub**: https://github.com/facebookresearch/habitat-sim [^1304^]
- **Habitat-lab**: https://github.com/facebookresearch/habitat-lab

### License
- **MIT**

### Key Features
- Photo-realistic 3D environments
- Supports Bullet Physics
- Embodied AI tasks: navigation, rearrangement, instruction following
- Large dataset of indoor environments

### UE5 Integration
- No direct UE5 plugin
- Primarily standalone simulator

### CSOAI Use Case
- Reference architecture for embodied AI agent design
- Benchmark for comparing agent architectures
- Less suitable for UE5-integrated town simulation

---

## 19. Webots

### Overview
Professional mobile robot simulation software developed by Cyberbotics. Open-source since 2018.

### Links
- **GitHub**: https://github.com/cyberbotics/webots [^1315^]
- **Website**: https://cyberbotics.com/

### License
- **Apache 2.0**

### Key Features
- 50+ pre-configured robot models including humanoids
- Multiple programming languages (C, C++, Python, Java, MATLAB)
- Real-time simulation with 3D visualization
- Cross-platform (Windows, Linux, macOS)

### CSOAI Use Case
- Alternative standalone simulator
- Large model library
- Less relevant for UE5-integrated approach

---

## 20. LocoMuJoCo Imitation Learning Benchmark

### Overview
Comprehensive imitation learning benchmark for whole-body humanoid control. Features 12 humanoid environments with 22,000+ motion capture datasets.

### Links
- **GitHub**: https://github.com/robfiras/loco-mujoco [^1370^]
- **Paper**: https://arxiv.org/html/2311.02496 [^1362^]
- **PyPI**: `pip install loco-mujoco`

### License
- **MIT**

### Humanoid Environments
- **Talos** (44 DoF) - PAL Robotics
- **Unitree H1** (19 DoF) - Unitree
- **Atlas** - Boston Dynamics
- **Skeleton models** (infant, child, teenager, adult sizes)
- **Musculoskeletal human models**

### Key Features
- 22,000+ motion capture datasets (AMASS, LAFAN1)
- Robot-to-robot retargeting
- Supports MuJoCo (single) and MJX/MJWarp (parallel)
- JAX algorithms: PPO, GAIL, AMP, DeepMimic
- Domain and terrain randomization built-in [^1363^]

### CSOAI Use Case
- **Training realistic walking gaits** for town agents
- Motion capture data for natural humanoid movement
- Benchmark for comparing locomotion policies
- Transfer trained policies to UE5 via URLab

---

## 21. Stanford Generative Agents (AI Town)

### Overview
Seminal research paper on creating believable AI agents that simulate human behavior using large language models. Agents wake up, cook, work, form opinions, and coordinate socially.

### Links
- **Paper**: https://arxiv.org/abs/2304.03442 [^147^][^1364^]
- **Stanford News**: https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior [^67^]

### Architecture Components
1. **Memory Stream**: Records all agent experiences in natural language
2. **Reflection**: Synthesizes memories into higher-level inferences
3. **Planning**: Translates conclusions into action plans (recursive detail)
4. **Retrieval**: Combines relevance, recency, and importance for context

### Key Results
- 25 agents in a Sims-like sandbox environment
- Emergent social behaviors: party planning, relationship formation, information diffusion
- Evaluated as more believable than human-pretended agents [^67^]

### CSOAI Use Case
- **Reference architecture** for CSOAI Town agent AI
- Memory + reflection + planning = believable agent behavior
- Scale from 25 to 47 agents with LLM-based architecture
- Integrate with NVIDIA ACE for agent reasoning layer
- Combine with MuJoCo physics for realistic movement

---

## 22. Additional Notable Projects

### 22.1 RoboVerse
- **GitHub**: https://github.com/RoboVerseOrg/RoboVerse [^1315^]
- **License**: Apache 2.0
- Unified platform for scalable robot learning

### 22.2 UnrealZoo
- **GitHub**: https://github.com/UnrealZoo/unrealzoo-gym [^1315^]
- ICCV 2025 highlight
- Large-scale photorealistic virtual worlds for embodied AI in UE5

### 22.3 Berkeley Humanoid
- Open-source 3D-printed humanoid robot
- 12 DoF, cost-effective design
- Available in MuJoCo Menagerie

### 22.4 ManiSkill
- **GitHub**: https://github.com/haosulab/ManiSkill [^1315^]
- GPU-parallelized robotics simulator and benchmark
- Apache 2.0 license

### 22.5 SAPIEN
- **GitHub**: https://github.com/haosulab/SAPIEN [^1315^]
- Embodied AI platform with realistic physics

---

## 23. Comparative Matrix

| Tool | License | Physics | UE5 Path | Max Agents | Effort | Best For |
|------|---------|---------|----------|------------|--------|----------|
| **URLab** | Apache 2.0 | MuJoCo (best) | Native plugin | 10-50 | Medium | UE5+MuJoCo integration |
| **Isaac Sim** | Apache 2.0 | PhysX 5 | Omniverse USD | 100+ | Medium-High | GPU multi-agent training |
| **MuJoCo** | Apache 2.0 | MuJoCo | Via URLab | 10-100 | Low | Physics accuracy |
| **MuJoCo Warp** | Apache 2.0 | GPU MuJoCo | Via URLab | 100+ | Low | GPU-accelerated physics |
| **Genesis** | Apache 2.0 | Universal | USD export | 1000+ | Medium | Massive parallel training |
| **GR00T N1** | Apache 2.0 | N/A | Via Isaac Sim | N/A | Medium | Humanoid reasoning model |
| **ACE SDK** | Open | N/A | Native plugin | 10-50 | Low-Medium | AI NPC behavior |
| **MetaHuman** | Epic EULA | N/A | Native | 10-20 | Low | Visual appearance |
| **Gazebo** | Apache 2.0 | ODE/Bullet | ROS bridge | 5-20 | Medium | ROS ecosystem |
| **PyBullet** | zlib | Bullet | Custom bridge | 1-10 | Medium | RL prototyping |
| **Habitat** | MIT | Bullet | None | 10-50 | Medium | Embodied AI research |
| **Webots** | Apache 2.0 | ODE | None | 5-20 | Low | Education/prototyping |
| **K-Sim** | MIT | MuJoCo/JAX | Via URLab | 100+ | Low-Medium | Humanoid RL training |
| **LocoMuJoCo** | MIT | MuJoCo | Via URLab | 100+ | Low | Imitation learning |
| **OpenLoong** | Various | Various | URDF import | 5-20 | Medium | Chinese humanoid models |

---

## 24. Integration Recommendations for CSOAI

### Phase 1: Foundation (Weeks 1-4)
1. **Set up URLab** in UE5.8 project
2. **Import 3-5 humanoid models** from MuJoCo Menagerie (Unitree H1, G1, TALOS, ToddlerBot)
3. **Configure basic locomotion** using LocoMuJoCo trained policies
4. **Integrate NVIDIA ACE** for basic agent AI behavior

### Phase 2: Agent Development (Weeks 5-12)
5. **Scale to 47 agents** with different humanoid models and roles
6. **Train role-specific policies** using K-Sim + Isaac Lab
7. **Integrate MetaHuman** for photorealistic agent appearance
8. **Implement agent memory + reflection** (Stanford Generative Agents architecture)

### Phase 3: Advanced Features (Weeks 13-20)
9. **Deploy GR00T N1** for advanced humanoid reasoning
10. **Add social interaction layer** (conversation, coordination, information diffusion)
11. **Integrate MCP** (Model Context Protocol) for agent-tool interaction
12. **Performance optimization** with MuJoCo Warp for GPU acceleration

### Technology Stack Summary

```
| Layer | Technology |
|-------|-----------|
| Rendering | Unreal Engine 5.8 + Lumen + Nanite |
| Physics | MuJoCo (via URLab plugin) |
| Models | MuJoCo Menagerie (H1, G1, TALOS, ToddlerBot, Spot) |
| Locomotion | LocoMuJoCo / K-Sim trained policies |
| AI Brain | NVIDIA ACE + GR00T N1 + Custom LLM |
| Memory | Stanford Generative Agents architecture |
| Appearance | MetaHuman + Custom skeletal meshes |
| Animation | MetaHuman Animator + IK retargeting |
| Tools/MCP | Custom MCP servers for town interaction |
| Training | Isaac Lab + Genesis (offline) |
```

---

## 25. References

[^1301^] DeepMind. "Open-sourcing MuJoCo." Google DeepMind Blog, 2022. https://deepmind.google/blog/open-sourcing-mujoco/

[^1302^] The Robot Report. "NVIDIA Isaac, Omniverse, and Halos to aid European robotics developers." 2025. https://www.therobotreport.com/nvidia-isaac-omniverse-halos-aid-european-robotics-developers/

[^1303^] Google DeepMind. "MuJoCo Warp (MJWarp)." GitHub, 2025. https://github.com/google-deepmind/mujoco_warp

[^1304^] Google DeepMind. "MuJoCo Playground." GitHub, 2024. https://github.com/google-deepmind/mujoco_playground

[^1305^] Google DeepMind. "MuJoCo Menagerie." GitHub. https://github.com/google-deepmind/mujoco_menagerie

[^1306^] NVIDIA. "Isaac Sim - Robotics Simulation." https://developer.nvidia.com/isaac/sim

[^1307^] Epic Games. "MetaHuman Animator in Unreal Engine." https://dev.epicgames.com/documentation/metahuman/metahuman-animator

[^1308^] PyBullet. "Bullet Real-Time Physics Simulation." https://pybullet.org/

[^1310^] Google DeepMind. "MuJoCo." GitHub. https://github.com/google-deepmind/mujoco

[^1312^] robotology. "iCub simulator in PyBullet." GitHub Discussion, 2024.

[^1313^] Borovets, Taras. "Simulation tools for Boston Dynamics' Spot." Medium, 2021.

[^1315^] best-of-robot-simulators. GitHub. https://github.com/knmcguire/best-of-robot-simulators

[^1316^] NVIDIA Developer Blog. "Build On-Device AI Companions with the NVIDIA ACE Game Agent SDK and Unreal Engine 5 Plugins." 2026. https://developer.nvidia.com/blog/build-on-device-ai-companions-with-the-nvidia-ace-game-agent-sdk-and-unreal-engine-5-plugins/

[^1339^] OpenLoong Community. https://www.openloong.org.cn/en

[^1340^] NVIDIA News. "NVIDIA Announces Isaac GR00T N1." 2026. https://nvidianews.nvidia.com/news/nvidia-isaac-gr00t-n1-open-humanoid-robot-foundation-model-simulation-frameworks

[^1341^] Embley-Riches, J. et al. "Unreal Robotics Lab: A High-Fidelity Robotics Simulator with Advanced Physics and Rendering." ICRA 2026. https://arxiv.org/abs/2504.14135

[^1343^] URLab-Sim. "Unreal Robotics Lab." GitHub, 2026. https://github.com/URLab-Sim/UnrealRoboticsLab

[^1344^] NVIDIA News. "NVIDIA Accelerates Robotics Research." 2026. http://nvidianews.nvidia.com/news/nvidia-accelerates-robotics-research-and-development-with-new-open-models-and-simulation-libraries

[^1345^] NVIDIA. "Humanoid Robots Use Case." https://www.nvidia.com/en-us/use-cases/humanoid-robots/

[^1346^] URLab. "Unreal Engine Robot Simulator." https://urlab.net/english.html

[^1348^] NVIDIA. "Isaac-GR00T." GitHub, 2026. https://github.com/Nvidia/Isaac-GR00T

[^1349^] K-Scale Labs. GitHub Organization. https://github.com/kscalelabs

[^1351^] Genesis-Embodied-AI. "Genesis." GitHub. https://github.com/Genesis-Embodied-AI/Genesis

[^1353^] The Robot Report. "Gazebo Classic robotics simulator reaches end of life." 2025.

[^1357^] Genesis-Embodied-AI. "genesis-world." GitHub. https://github.com/Genesis-Embodied-AI/genesis-world

[^1362^] Al-Hafez, F. et al. "LocoMuJoCo: A Comprehensive Imitation Learning Benchmark for Locomotion." TU Darmstadt. https://arxiv.org/html/2311.02496

[^1363^] PyPI. "loco-mujoco." https://pypi.org/project/loco-mujoco/

[^1367^] Ze, Yanjie. "awesome-humanoid-robot-learning." GitHub. https://github.com/YanjieZe/awesome-humanoid-robot-learning

[^1368^] Shi, Haochen. "ToddlerBot." GitHub, 2025. https://github.com/hshi74/toddlerbot

[^1370^] Al-Hafez, Firas. "loco-mujoco." GitHub. https://github.com/robfiras/loco-mujoco

[^1372^] Shi, H. et al. "ToddlerBot: Open-Source ML-Compatible Humanoid Platform for Loco-Manipulation." Stanford, 2025. https://arxiv.org/abs/2502.00893

[^147^] Park, J.S. et al. "Generative Agents: Interactive Simulacra of Human Behavior." Stanford University, 2023. https://arxiv.org/abs/2304.03442

[^67^] Stanford HAI. "Computational Agents Exhibit Believable Humanlike Behavior." 2026. https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior

[^1304^] best-of-robot-simulators. "Habitat Sim." https://github.com/facebookresearch/habitat-sim

---

*Research compiled from 15+ independent searches across academic papers, GitHub repositories, official documentation, and technology news sources. All tools listed are open-source and commercially usable under their respective licenses.*
