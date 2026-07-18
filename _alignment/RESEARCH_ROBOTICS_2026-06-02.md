# RESEARCH — Robotics + Open-Source Frontier (2026)
**Compiled:** 2026-06-02 · **Method:** live WebSearch/WebFetch of GitHub/HF/arXiv primary sources · SURE = verified this session, GUESS = inferred.
**For:** Asimov humanoid · WOLF actuators · aquaponic robotics. Companion to `ALIGNMENT_2026-06-02.md` §3.

## 1. Open-source humanoids (2025–26)
- **Berkeley Humanoid Lite** `HybridRobotics/Berkeley-Humanoid-Lite` — v1.1.0 (Sep 2025), 1.4k★, MIT+CC-BY-SA. Sub-$5K, **fully 3D-printed cycloidal actuators**, zero-shot RL sim2real. arXiv:2504.17249. Closest analogue to Asimov — cycloidal-vs-Wolfrom decision. [SURE]
- **K-Scale Labs K-Bot** `kscalelabs` — ~$8,999, CERN-OHL-S hw / GPLv3 sw, strong JAX sim (`ksim-kbot`). [SURE]
- **HF HopeJR** — ~$3,000, **66 DOF**, walks+arms (with The Robot Studio, SO-101 lineage). + Reachy Mini ~$250-300. Cheapest full-size open humanoid; undercuts Unitree G1. [SURE]
- **Booster T1** `BoosterRobotics` — 2025 RoboCup champ, 23 DOF, Jetson AGX Orin, ROS2+Isaac SDK open. [SURE]
- **Unitree** — `unitree_rl_gym` + newer `unitree_rl_lab` (IsaacLab, mimic/motion-tracking, G1-29dof). [SURE]

## 2. VLA / robot-learning models (2025–26)
- **NVIDIA GR00T N1.7** `NVIDIA/Isaac-GR00T` — **Apache-2.0**, Cosmos-Reason2/Qwen3-VL backbone. **N2 previewed** (DreamZero world-action-model). Big jump from N1.5. [SURE]
- **GR00T-WholeBodyControl** `NVlabs/...` (Nick cloned) — major 2026 expansion: **SONIC** behavior foundation model (walk→crawl→teleop from one policy), end-to-end VLA on G1. **Re-pull.** [SURE]
- **π0.5 / openpi** `Physical-Intelligence/openpi` — open weights π0, π0-FAST, π0.5. 10k+ hr pretrain, fine-tunable. [SURE]
- **SmolVLA** `lerobot/smolvla_base` — **450M, runs on consumer GPU/CPU, async inference, beats finetuned π0 on SO101.** ← realistic edge brain for RPi5+Hailo Asimov. [SURE]
- **RDT-1B** `thu-ml/...` — 1B diffusion, bimanual, HF weights, OpenVINO edge export. [SURE]
- **Gemini Robotics On-Device** — local on-robot, 50-100 demo adapt; SDK on GitHub, **not open weights**. [SURE]

## 3. LeRobot v0.5.0 (released 9 Mar 2026)
- **Adds RobStride + Damiao CAN-bus motors** ← Nick's exact CAN/AS5047P stack.
- Unitree G1 whole-body control; SO-100+SO-101 unified; OpenArm/OMX/Earth Rover.
- New policies: Pi0-FAST, Wall-X, X-VLA, SARM, Real-Time Chunking, **LoRA/PEFT** for big VLAs.
- 3rd-party policy plugins, EnvHub, IsaacLab-Arena. **Needs Python 3.12+, Transformers v5.** [SURE]

## 4. Actuators (2025–26)
- **Ironless-QDD-Actuator** `CKraft11/...` — **259★, MIT, full CAD+BOM**. **29.4 Nm for ~$40 (~$70 w/ controller)**, Halbach ironless rotor + printed cycloidal, zero backlash, ODrive/MKS. **Direct open competitor to WOLF/Encos. Already cloned to disk (186M, has FEA).** [SURE]
- **OpenQDD** (Aaed Musa) — printed planetary QDD, MIT Mini-Cheetah lineage. [SURE]
- **Cycloidal QDD + GRU torque est.** arXiv:2410.16591 — sensorless torque control for WOLF. [SURE]
- **SimpleFOC** Arduino-FOC-drivers v1.0.9 (Jul 2025) — AS5047P SPI driver included. [SURE]

## 5. Sim-to-real (2025–26)
- **MuJoCo Playground** — MJX, pip-installable, zero-shot sim2real from state+pixels, ships Berkeley/G1/H1/Booster T1 envs. [SURE]
- **Genesis** `Genesis-Embodied-AI/genesis-world` — **multi-physics incl. soft-body + FLUID**, 10-80× faster than Isaac Gym/MJX. **Only major sim that can model aquaponic/water tasks AND humanoid — bridges both theses.** [SURE on features; throughput=vendor claim/GUESS]
- **Isaac Lab / IsaacLab-Arena** — default for Unitree + LeRobot v0.5.0. [SURE]
- **unified-humanoid-getup** (cloned) — paper "Learning to Get Up Across Morphologies" arXiv:2512.12230 (Dec 2025). [SURE]

## 6. Farm / aquaponic robotics (2025–26)
- **FarmBot Genesis** — Jul 2025 sw update + **ROS2 port open-sourced**. [SURE]
- **RoMu4o** `mehradmrt/UCM-AgBot-ROS2` — 6-DOF arm + RGBD on crawler, ROS2+MoveIt2. **Closest open template for aquaponic inspection/pick arm.** [SURE]
- **Open-Weeding-Delta** `Agroecology-Lab/...` — ROS2 delta arm + AI weed detect, laser option. [SURE]
- **Aquaculture robotics is real but MARINE:** Remora Robotics (net-pen cleaning, raised NOK 164M/€13.9M, sold out), Aqua Robotics HALO, StealthCleaner ROV. [SURE]
- **No open-source INLAND aquaponic (fish+plant) robot exists** — greenfield. [SURE — the gap is the finding]

## 7. 3D printing (2025–26)
- **PA6-CF now dominant for functional robotics** (~140 MPa, 2× PA12-CF's ~71) BUT moisture-fatal (-44% wet) → dry-box mandatory. Use PA6-CF for high-load joints, PA12-CF for forgiving parts. [SURE]
- Annealing 80-100°C/4-6h; marginal once moisture re-enters — manage humidity first. [SURE]

## TOP 12 ACTIONABLE (ranked)
1. Benchmark Ironless-QDD (on disk) vs WOLF — cost/torque head-to-head.
2. Upgrade LeRobot → v0.5.0 (CAN-bus RobStride/Damiao = Nick's stack).
3. Try SmolVLA on RPi5+Hailo (edge brain).
4. Re-pull GR00T-WholeBodyControl + SONIC; note GR00T N1.7 Apache-2.0.
5. Study Berkeley Humanoid Lite v1.1.0 cycloidal gearbox.
6. Evaluate Genesis for unified aquaponic+humanoid sim.
7. Pilot PA6-CF for high-load joints (fix dry-box first).
8. Fork RoMu4o for aquaponic inspection/pick arm.
9. Read arXiv:2512.12230 (get-up across morphologies).
10. Read arXiv:2410.16591 (sensorless WOLF torque).
11. SimpleFOC drivers → v1.0.9.
12. Watch HopeJR (66 DOF $3K) + K-Scale ksim.

**3 gaps:** (1) no open inland-aquaponic robot = first-mover lane; (2) Asimov actuator out-competed on cost by ~$70 ironless cycloidals; (3) likely a LeRobot major version + GR00T two minor versions behind — resync.
