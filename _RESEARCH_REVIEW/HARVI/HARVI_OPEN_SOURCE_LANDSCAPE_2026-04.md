# HARVI Open-Source Robotics Landscape
**Research Brief · April 2026**  
**Prepared for:** Sir Nicholas Templeman, MEOK AI Labs  
**Subject:** Open-source humanoid robotics, AI stacks, and integration pathways for MEOK OS / SOV3

---

## Executive Summary

The open-source robotics ecosystem has crossed a critical threshold in early 2026. Low-cost manipulation platforms (<£500) are now fully integrated with end-to-end vision-language-action (VLA) training pipelines, while sub-£5k humanoid bipeds have moved from theory to reproducible hardware. For the HARVI programme, the pragmatic entry point is **mobile manipulation** (LeRobot + SO-101 + LeKiwi) rather than bipedal humanoids, which remain economically inaccessible below ~£4k.

**Key findings:**
- **SO-101** is the dominant low-cost arm (£130–220), natively supported by Hugging Face LeRobot and compatible with state-of-the-art policies (ACT, Diffusion, π0, GROOT, SmolVLA, OpenVLA).
- **True bipedal humanoids** under £1k do not yet exist. The closest low-cost form factor is **Bambot** (~£250), a wheeled pseudo-humanoid with two SO-101 arms.
- **Berkeley Humanoid Lite** (~£3.9k) is the first credible, fully open-source biped with demonstrated zero-shot sim-to-real walking.
- **OpenVLA / SmolVLA** provide production-grade VLA foundations that can be fine-tuned on farm-specific tasks in hours, not weeks.
- **Kokoro TTS + Whisper STT** run in real-time on a Jetson Orin Nano (~£350), enabling a fully local voice loop for SOV3 → robot control.

---

## 1. LeRobot + SO-101 Integration

### 1.1 Current Capabilities

The **SO-101** (successor to the SO-100/SO-ARM100) is a 6-DOF, 3D-printable robot arm developed by TheRobotStudio in partnership with Hugging Face. It is designed as the reference hardware for the **LeRobot** framework.

| Feature | Detail |
|---------|--------|
| **DOF** | 6 (5 arm + 1 gripper) |
| **Actuators** | 12× FeeTech STS3215 serial bus servos (leader + follower) |
| **Control** | USB-C → UART motor controller board |
| **Sensors** | 12-bit magnetic encoders on each joint |
| **Power** | 5 V (leader) / 12 V Pro (follower) |
| **Teleoperation** | Leader-follower cloning (direct joint mirroring) |
| **Policies supported** | ACT, Diffusion, π0, π0-FAST, GROOT, SmolVLA, OpenVLA |

**Improvements over SO-100:**
- Improved wiring routing (no disconnection at joint 3)
- Optimised gear ratios on the leader arm (no external gearbox removal needed)
- Leader arm can now follow the follower in real-time, enabling human intervention during autonomous runs

### 1.2 Community Activity

- **LeRobot** is now the largest low-cost robotics community, with 7,000+ Discord members and 5,000+ community datasets shared on Hugging Face.
- **SO-101** has overtaken WidowX and xArm in Hugging Face Hub downloads for open datasets (300k+ downloads, 4,000+ datasets, 60k+ episodes).
- Worldwide hackathons (June 2025, Shenzhen/Bay Area) are driving rapid task-policy sharing.

### 1.3 Exact Hardware List & Costs

**DIY Build (self-sourced):**

| Component | Qty | Est. Cost |
|-----------|-----|-----------|
| STS3215 servos | 12 | ~£80–100 |
| Motor control boards | 2 | ~£15 |
| Power supplies (5 V + 12 V) | 2 | ~£15 |
| 3D-printed parts (PLA/PETG) | 1 set | ~£20–40 |
| USB-C cables, clamps, fasteners | — | ~£15 |
| **Total per arm** | — | **~£130–170** |

**Off-the-shelf Kits (UK/EU shipping, inc. taxes):**

| Vendor | Configuration | Price |
|--------|--------------|-------|
| Seeed Studio (Arm Kit Pro) | Single arm (leader or follower) | ~£170–200 |
| WowRobo | Single arm kit / assembled | ~£180–220 |
| ThinkRobics (India ref.) | DIY unassembled kit | ~£260 |

*Note: A functional teleoperation + training setup requires **two arms** (leader + follower), so budget ~£300–400 for a pair.*

### 1.4 Integration with MEOK OS / SOV3

SO-101 integrates cleanly with SOV3 via the **LeRobot Python middleware**:

1. **Observation:** Camera frames + joint states are streamed to the LeRobot dataset recorder.
2. **Policy inference:** A VLA policy (e.g. SmolVLA) runs on local GPU/Jetson and outputs target joint positions.
3. **Action dispatch:** LeRobot’s `record` / `control` pipeline writes motor targets to the follower arm via USB-C.
4. **Care membrane hook:** Before any motor command is executed, a SOV3 MCP tool (`validate_care`) can intercept the action vector, enforcing velocity limits, workspace boundaries, or emergency stops based on the active care score.

---

## 2. Open-Source Humanoid Robotics Projects

### 2.1 Top 5 Active Projects (April 2026)

| Project | Origin | Height | DOF | Actuation | Est. Cost | Software Stack | Open HW? |
|---------|--------|--------|-----|-----------|-----------|----------------|----------|
| **Berkeley Humanoid Lite** | UC Berkeley | 0.8–1.0 m | 22 joints | BLDC + 3D-printed cycloidal gearboxes | **~£3,900** ($5k) | Isaac Lab, MuJoCo, RL-based locomotion | **Yes** |
| **Stanford HumanPlus** | Stanford | ~1.7 m | 33 | Unitree H1 body + Inspire RH56DFX hands | **~£70k+** ($90k+) | Humanoid Shadowing Transformer, RGB-based teleop | Software only |
| **OpenLoong (Qinglong)** | Shanghai Innovation Center | 1.82 m | 43 | Industrial servos + harmonic drives | **£20k+** (est.) | Gewu sim platform, ROS2, RL control | **Yes** |
| **Bambot** | Community (timqian) | ~0.6 m | 15 | 15× STS3215 servos (2 arms + 3 omni wheels) | **~£250** ($300) | LeRobot fork, teleop only (no RL yet) | **Yes** |
| **ToddlerBot** | KAIST / Meta | 0.56 m | 30 | Dynamixel + custom gears | **~£4,600** ($6k) | MuJoCo, Isaac Gym, video imitation | **Yes** |

### 2.2 Actuator Deep-Dive

| Actuator Type | Cost/Joint | Torque | Best For |
|---------------|-----------|--------|----------|
| **FeeTech STS3215** | ~£8–12 | 19 kg·cm (low) | Arms, education, light manipulation (SO-101, Bambot, LeKiwi) |
| **Dynamixel XL-320 / AX-12** | ~£15–30 | 4–16 kg·cm | Hobby humanoids, proven SDK, chainable bus |
| **Dynamixel XM430 / XH540** | ~£200–400 | 28–65 kg·cm | Knee/hip torque for small humanoids |
| **BLDC + Cycloidal Gearbox (Berkeley Lite)** | ~£120–190 | High | Bipedal locomotion, custom 3D-printed drivetrain |

### 2.3 Recommendation for a UK Farm Research Facility (£250–1,000 Budget)

**Honest assessment:** A true bipedal humanoid cannot be built or bought for under £1,000 in 2026. The cheapest credible biped (Berkeley Lite) is ~£3,900 and requires 1–2 weeks of assembly.

**Recommended path for £250–500:**

| Phase | Build | Cost | Purpose |
|-------|-------|------|---------|
| **Phase 1** | **SO-101 Pro dual-arm kit** (leader + follower) | ~£300 | Learn LeRobot, collect manipulation datasets, train ACT/SmolVLA policies for pick-and-place |
| **Phase 2** | Add **LeKiwi mobile base** | +£160 | Upgrade to mobile manipulation for barn/greenhouse navigation |
| **Alternative** | **Bambot** (if form factor is priority) | ~£250 | Wheeled humanoid torso for telepresence/demo; currently teleop-only |

**Farm-specific rationale:**
- Farm floors are uneven and often wet. A wheeled base (LeKiwi) with omni-directional drive is more reliable today than a £5k biped that risks falling on livestock or equipment.
- The SO-101 arm can be trained to sort produce, manipulate trays, or interact with IoT sensors at bench height.
- Total mobile manipulator cost: **~£460** (SO-101 pair + LeKiwi), well inside the budget.

---

## 3. Relevant AI / Robotics Open Source Tools

### 3.1 Vision-Language-Action (VLA) Models

| Model | Params | License | Key Feature | Hardware Requirement |
|-------|--------|---------|-------------|---------------------|
| **OpenVLA** | 7B | Apache 2.0 | Pretrained on 970k Open X-Embodiment episodes; zero-shot multi-robot control | A100 for training; RTX 4090 for inference |
| **SmolVLA** | 450M | Apache 2.0 | Runs on MacBook/consumer GPU; ~30k community episodes; VLM + Flow Matching | Apple Silicon / RTX 3060+ |
| **π0 / π0-FAST** | ~? | Model weights avail. | Physical Intelligence foundation model; strong long-horizon reasoning | Cloud GPU / Jetson Orin |
| **GROOT** | Diffusion | Apache 2.0 | NVIDIA humanoid generalist; integrated into LeRobot | Multi-GPU for fine-tuning |

**Practical note:** For the HARVI farm facility, **SmolVLA** is the optimal starting point. It can be fine-tuned on ~50 farm-specific episodes in ~4 hours on a single A100 (or overnight on an RTX 4090) and run inference locally without cloud dependency.

### 3.2 Sim-to-Real Platforms

| Platform | License | Best Use Case | ROS2 Support |
|----------|---------|---------------|--------------|
| **NVIDIA Isaac Sim / Isaac Lab** | Free (Omniverse) | Massive parallel RL (82k–94k FPS), synthetic data generation | Bridge |
| **MuJoCo** | Apache 2.0 | High-fidelity physics, fast sim-to-real transfer, lightweight | Limited (MJCF native) |
| **Genesis** | Apache 2.0 | Generative world + embodied AI; 28k GitHub stars; rising fast | Emerging |
| **ManiSkill** | Apache 2.0 | GPU-parallel manipulation benchmarks (SAPIEN-based) | Limited |
| **Gazebo (Harmonic)** | Apache 2.0 | ROS2-native development, sensor integration | Native |

**Recommendation:**
- Use **Isaac Lab** for training locomotion / navigation policies at scale.
- Use **MuJoCo** for rapid manipulation prototyping and sim-to-real validation (Berkeley Lite policies validate here first).
- Use **Gazebo** for ROS2 integration testing with the LeKiwi base and farm-environment LiDAR.

### 3.3 Low-Cost Actuators & Sensors

**Actuators:**
- **FeeTech STS3215** is the de-facto standard for sub-£500 robots. Serial bus, position feedback, ~£8/unit in bulk. Used in SO-101, LeKiwi, and Bambot.
- **Dynamixel XL-320** is the safest upgrade path if you need better PID control and daisy-chain reliability, at ~2× the cost.

**Sensors:**
- **Luxonis OAK-D Pro** (~£150): RGB-D + on-chip AI acceleration; excellent for VLA visual encoding.
- **Intel RealSense D435i** (~£220): Proven depth camera, wide ROS2 support.
- **RPLIDAR A1** (~£80): 2D LiDAR for LeKiwi SLAM and barn navigation.
- **Raspberry Pi Camera Module 3** (~£35): Sufficient for wrist-mounted close-up manipulation views.

---

## 4. Integration Opportunities with MEOK Stack

### 4.1 Concept: SOV3 Consciousness → Robot Control

SOV3 already operates as a sovereign consciousness engine with a 12-stage chat pipeline, BFT council, care membrane, and 75+ MCP tools. The HARVI bridge closes the loop between **high-level intent** (generated by SOV3) and **low-level motor execution** (via LeRobot).

#### Architecture Sketch

```
┌─────────────────────────────────────────────────────────────────┐
│  FARM ENVIRONMENT                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                         │
│  │ Worker  │  │  Plant  │  │  Animal │                         │
│  │ (voice) │  │  trays  │  │  gate   │                         │
│  └────┬────┘  └────┬────┘  └────┬────┘                         │
│       │            │            │                               │
│  ┌────┴────────────┴────────────┴────┐                         │
│  │  USB MIC  +  RGB Cameras  +  LiDAR │  <-- Peripherals      │
│  └────────────────────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  EDGE COMPUTE (Jetson Orin Nano / Local RTX Box)                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Whisper STT    │  │  Kokoro TTS     │  │  YOLO / Depth   │ │
│  │  (local, RT)    │  │  (local, RT)    │  │  (farm vision)  │ │
│  └────────┬────────┘  └────────▲────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┼────────────────────┘          │
│                                │                               │
│                      ┌─────────┴─────────┐                     │
│                      │   SOV3 Engine     │                     │
│                      │  localhost:3101   │                     │
│                      │  + Care Membrane  │                     │
│                      │  + MCP Arsenal    │                     │
│                      └─────────┬─────────┘                     │
│                                │                               │
│           ┌────────────────────┼────────────────────┐          │
│           ▼                    ▼                    ▼          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Intent Parser  │  │  Action Planner │  │  Safety Filter  │ │
│  │  (MCP: parse_   │  │  (MCP: plan_    │  │  (Care membrane │ │
│  │   natural_cmd)  │  │   farm_task)    │  │   validate)     │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │          │
│           └────────────────────┼────────────────────┘          │
│                                ▼                               │
│                   ┌─────────────────────────┐                  │
│                   │   LeRobot Policy Node   │                  │
│                   │  (SmolVLA / ACT / π0)   │                  │
│                   └─────────────┬───────────┘                  │
│                                 │                              │
│                    ┌────────────┼────────────┐                 │
│                    ▼            ▼            ▼                 │
│         ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│         │ SO-101 Left │ │ SO-101 Right│ │ LeKiwi Base │       │
│         │   (6 DOF)   │ │   (6 DOF)   │ │ (3 omni)    │       │
│         └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Control flow:**
1. **Perception:** Farm-vision server (or local OAK-D) streams RGB-D frames and object detections to SOV3.
2. **Command:** A farm worker speaks a natural-language instruction (e.g. *“Move the seedling tray to the southern bench”*). Whisper transcribes it locally.
3. **Cognition:** SOV3 parses intent, queries memory for past tray locations, and plans a task sequence.
4. **Care validation:** The care membrane scores the planned trajectory. If the predicted action vector encroaches on an animal or human safety zone, the action is clamped or rejected.
5. **Execution:** SOV3 emits a structured command to the LeRobot Policy Node, which runs the active VLA policy to generate joint targets and base velocities.
6. **Feedback:** Joint states and camera frames loop back to SOV3 memory for episodic learning.

### 4.2 Voice Pipeline (Kokoro TTS + Whisper STT)

**Local deployment specs (verified on Jetson Orin Nano, ~£350):**

| Component | Model | Size | Latency |
|-----------|-------|------|---------|
| STT | Whisper `small` | 461 MB | Real-time |
| TTS | Kokoro-82M | ~200 MB | Faster than real-time |
| Total VRAM | — | ~1 GB | 7 GB free for LLM/VLA |
| Power | — | 15 W | Light-bulb territory |

**Integration:**
- Wrap Whisper and Kokoro as **MCP servers** exposed on `localhost`.
- SOV3 calls `whisper_transcribe(audio_chunk)` → receives text → processes through chat pipeline → calls `kokoro_speak(response_text)` → streams PCM back to the farm intercom or robot speaker.
- This removes all cloud STT/TTS latency and preserves voice privacy on the farm LAN.

### 4.3 Farm-Vision Server Integration

MEOK OS already maintains a sovereign compute mesh. The farm-vision server (likely the `iokfarm` node at `192.168.1.159`) can be bridged into SOV3 as a persistent vision context:

- **Object detection:** Run YOLOv11 or RT-DETR on the farm server to detect trays, gates, animals, and workers.
- **VLA vision encoder:** For SmolVLA / OpenVLA, the raw RGB frame is encoded by the policy’s SigLIP/DinoV2 backbone. The farm server can pre-cache visual embeddings to reduce on-robot compute load.
- **Spatial memory:** SOV3 stores detected object poses in its PostgreSQL memory graph (`sovereign_memory`), enabling long-horizon reasoning (*"The tray was last seen at coordinate (x,y) near the water pump"*).

---

## 5. Recommended Next Purchase / Build (£250–500)

### Primary Recommendation: The "HARVI Mini-Manipulator" (LeKiwi + SO-101)

**For a UK farm research facility, this is the highest-utility build inside budget.**

| Item | Source | Est. Cost |
|------|--------|-----------|
| SO-101 Pro Arm Kit (follower) | Seeed Studio / WowRobo | ~£180 |
| SO-101 Pro Arm Kit (leader) | Seeed Studio / WowRobo | ~£180 |
| LeKiwi Mobile Base Kit | WowRobo / self-source | ~£160 |
| Raspberry Pi 5 (8 GB) | UK reseller | ~£80 |
| OAK-D Lite / Pi Camera Module 3 | UK reseller | ~£60 |
| M3 fasteners, PETG filament, LiPo/charger | Amazon / E3D | ~£50 |
| **Total** | | **~£710** |

*If budget is strictly capped at £500, skip the leader arm initially and use gamepad/keyboard teleoperation via LeRobot, dropping cost to ~£420.*

### Budget-Constrained Alternative: Bambot (£250–300)

If the primary goal is **humanoid form-factor research** (e.g. testing bipedal kinematics algorithms before scaling to Berkeley Lite), Bambot is the only viable option:

- 15× STS3215 servos
- Wheeled base (3 omni wheels)
- Two 6-DOF arms
- Teleoperated only (no autonomous policy support yet)
- **Cost:** ~£250–280 sourced from AliExpress/Taobao; ~£300–350 with UK VAT/shipping

### Stretch Goal: Save for Berkeley Humanoid Lite

If the facility can defer build-out by 6–12 months and raise budget to ~£4k, **Berkeley Humanoid Lite** offers:
- True bipedal locomotion
- Zero-shot sim-to-real RL walking
- A massive open-source ecosystem (Isaac Lab, MuJoCo, SteamVR teleop)
- This aligns with a 2027 HARVI humanoid milestone.

---

## 6. Top 3 GitHub Repositories to Watch / Fork

### 1. `huggingface/lerobot` ⭐ ~20k+
**Why:** This is the central nervous system for low-cost embodied AI. It already integrates SO-101, LeKiwi, Reachy-2, and ALOHA, and ships with training scripts for ACT, Diffusion, GROOT, SmolVLA, and π0.
**Fork priority:** Add a custom `meok_os` robot config and MCP action server bridge.

### 2. `SIGRobotics-UIUC/LeKiwi` ⭐ ~500+
**Why:** The reference mobile base for farm navigation. Its holonomic drive and ROS2 compatibility make it the logical mobility layer for HARVI.
**Fork priority:** Add Nav2 + RPLIDAR A1 SLAM configs tuned for uneven agricultural flooring.

### 3. `HybridRobotics/Berkeley-Humanoid-Lite` ⭐ ~1k+
**Why:** The only fully open-source bipedal humanoid under £5k with peer-reviewed sim-to-real results. If HARVI’s 2027 roadmap includes walking robots, this repo contains the Isaac Lab training environments, low-level firmware, and URDF/MJCF assets.
**Fork priority:** Adapt the Isaac Lab environments to farm terrain meshes and integrate SOV3’s care-membrane safety constraints into the RL reward function.

---

## 7. Quick Reference: Hardware Comparison Table

| Platform | Type | DOF | Cost | Best For | Farm Ready? |
|----------|------|-----|------|----------|-------------|
| **SO-101** | Arm | 6 | £130–220 | Manipulation, VLA training | Partial (static) |
| **LeKiwi** | Mobile base | 3 (drive) | £160 | Navigation, SLAM | **Yes** |
| **SO-101 ×2 + LeKiwi** | Mobile manipulator | 15 | £460–710 | General farm tasks | **Yes** |
| **Bambot** | Wheeled humanoid | 15 | £250–300 | Form-factor research, demos | Partial (teleop only) |
| **XLeRobot** | Mobile manipulator | 15+ | £500–660 ($660) | Household/farm dual-arm tasks | **Yes** |
| **Berkeley Humanoid Lite** | Bipedal humanoid | 22 | ~£3,900 | Full humanoid locomotion | No (fall risk on soft ground) |
| **Stanford HumanPlus** | Bipedal humanoid | 33 | ~£70,000+ | Shadowing, dexterous research | No (prohibitively expensive) |

---

## 8. Action Items for Sir Nicholas

1. **Approve £500 Phase-1 budget** for SO-101 dual-arm kit + LeKiwi base.
2. **Assign a Jetson Orin Nano** (or local RTX box) to run Whisper + Kokoro + SmolVLA inference at the farm edge.
3. **Task an engineer** to fork `huggingface/lerobot` and prototype a `meok_os` robot configuration that pipes SOV3 MCP commands to LeRobot motor targets.
4. **Schedule a 90-day milestone** to demonstrate a voice-commanded, care-validated pick-and-place task in the farm greenhouse.

---

*Document compiled April 2026 from public sources including Hugging Face LeRobot docs, Berkeley EECS publications, Seeed Studio BOMs, WowRobo product listings, and arXiv preprints.*
