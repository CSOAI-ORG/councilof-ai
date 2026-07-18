# PRIVACY-PRESERVING PERCEPTION — Awareness Without Identity
## Giving humanoids & drones "intuition" that senses geometry, not people
### CSOAI Ltd · Authored 2026-07-08 · Extends SOV3_EMBODIED_PREDICTIVE_SIM · Status: DESIGNED

> The governance answer to embodied sensing: **sense geometry and events, not identity.** A
> machine can be fully spatially aware — know a person is 2m ahead moving left — without capturing
> a face, biometric, or any personal data. This is what keeps embodied Sovereign OUTSIDE EU AI
> Act Art.5 (prohibited biometric ID) and GDPR Art.9 (special-category data) BY DESIGN, not by
> policy. Honesty: none of this is running; it is the designed sensing layer.

## THE CORE PRINCIPLE
Identity and awareness are separable. You do NOT need to know *who* to know *where, moving how,
avoid how*. Sensing the second without the first is lawful, ethical, and sufficient for the
imagination/planning loop. This is the design rule that makes embodied Sovereign a governed
category only CSOAI can own.

## THE PRIVACY-CLEAN SENSOR MENU (awareness, zero personal data)

| Sensor | What it senses | Personal data? | Maturity |
|---|---|---|---|
| **LiDAR / depth / ToF** | 3D geometry, body as moving shape | NO — no face/identity | mature |
| **Radar / mmWave** | presence, motion, coarse pose, vitals as vectors | NO — point-cloud blip, no imagery | emerging |
| **Ultrasonic / sonar** | proximity, obstacle map | NO | mature |
| **Thermal (low-res)** | heat sources, presence | NO if below ID resolution | mature |
| **IMU / odometry / SLAM** | machine's own motion + geometric map | NO — maps space, not people | mature |
| **Event cameras (neuromorphic)** | brightness *changes* only — motion/structure | NO — no storable frame | emerging |
| **Ambient (air/sound-level/light)** | situational context | NO — level not content | mature |

**Contrast with the gated sensors** (from the embodiment doc): RGB cameras with faces, WiFi human
pose-ID, public camera feeds — those DO capture personal data and stay behind the consent-legality
gate. The menu above needs no such gate: it is clean by physics.

## THE "INTUITION" DESIGN (why this = a sensing intuition, not surveillance)

Intuition here = **on-device, ephemeral, geometry-only world-modeling:**
1. **Sense** only geometry/events from the clean menu.
2. **Model** the scene into the SovSpace internal world-model — "obstacle", "person-shaped moving
   object", "clear path" — abstractions, never identities.
3. **Imagine** candidate actions and score them (Care-Floor, physical-safety gate).
4. **Discard** raw data immediately — keep only the abstraction. Nothing that identifies a human
   is ever stored or transmitted.
5. **Edge-only** — processing stays on the device; no raw perception leaves it.

The machine is fully aware, can simulate outcomes before acting (the imagination loop), and holds
NOTHING personal. That is spatial intuition without surveillance — the humanoid/drone "knows the
best thing to do when it arrives" purely from geometry.

## GOVERNANCE CROSS-WALK (this REPLACES the risky row)

| Capability | Governance binding | Framework |
|---|---|---|
| **Geometry-only sensing** (LiDAR/radar/event-cam/SLAM) | none needed — no personal data by design | GDPR N/A (no personal data) |
| Person-as-shape avoidance | physical-safety gate; abstraction-only, discard raw | ISO 10218 robot-safety, EU AI Act Art.9 risk-mgmt |
| On-device ephemeral processing | data-minimisation by construction | GDPR Art.5 (minimisation), Art.25 (privacy by design) |
| RGB-face / WiFi-ID / public cameras | consent-legality gate — LAST RESORT, lawful only | EU AI Act Art.5, GDPR Art.9 |

**Design default: the machine runs on the privacy-clean menu.** Identity-capturing sensors are
OFF by default and only enabled behind the consent-legality gate where lawful. This inverts the
industry norm (surveil first) into governed-by-default.

## WHY THIS IS THE MOAT
Every competitor building embodied AI reaches for cameras — and trips Art.5. Sovereign's embodied
layer is architected to be **aware without identifying**, on the clean sensor menu, edge-only,
ephemeral. That's not a limitation — it's the ONLY version that ships lawfully in the EU/UK, and
CSOAI is the authority that can certify it. Privacy-by-physics is the differentiator.

## HONESTY REGISTER
- RUNNING: nothing — no sensors, no embodiment in the estate today.
- DESIGNED: the geometry-only sensing layer + on-device ephemeral world-modeling.
- ASPIRATIONAL: actual humanoid/drone hardware.
- The privacy-clean claim is architectural: it holds ONLY IF raw data is discarded on-device and
  identity sensors stay gated. Break that and the guarantee is void — the discipline is the point.

*Authored for Sir Nicholas Templeman. Awareness without identity — spatial intuition for embodied
Sovereign that senses the world, not the person.*


---

## APPENDIX — REUSE OPEN-SOURCE AUTONOMOUS-VEHICLE SOFTWARE (do not rebuild)

The self-driving field already solved "sense geometry, not identity" — much of it Apache/MIT.
OOWM should REUSE the perception stack and BUILD the governance on top.

| Component | License | Role in OOWM |
|---|---|---|
| **Autoware** | Apache 2.0 | full AV perception: LiDAR, sensor fusion, SLAM localization, object detection as GEOMETRY (boxes, not identities), prediction, planning |
| **ROS 2** | Apache 2.0 | robotics middleware — sensor drivers, transforms, the nervous system |
| **CARLA** | MIT | driving SIMULATOR — test the imagination/rollout loop before any hardware (the "simulator first" step) |
| **Open3D / PCL** | MIT / BSD | point-cloud processing — the privacy-clean perception primitives |
| **nav2** | Apache 2.0 | ROS 2 navigation/path-planning |
| **PX4 / ArduPilot** | BSD / GPL | drone autopilot (GPL needs care in a commercial edition) |

**Division of labour:**
- **REUSE (eyes + spatial map):** Autoware/ROS2 perception+SLAM, CARLA sim, Open3D point clouds.
  Already built on privacy-clean geometry — inherits privacy-by-design for EU/UK.
- **BUILD (the IP):** the governance layer — Care-Floor gate over imagined actions, consent-
  legality gate, guardian covenant, SIGIL audit, OOWM reasoning/intuition brains.

**The thesis:** OOWM does not compete with Autoware — it GOVERNS it. The AV stack is the embodied
perception layer; CSOAI's frameworks make it lawful and certifiable. That is the reuse-not-rebuild
move that makes embodied Sovereign feasible.

**Honest caveats:** ROS2+Autoware are heavyweight (real compute + integration engineering, not a
weekend). Licenses vary — Apache/MIT are clean for a paid product; GPL components (some drone
autopilots) need legal care in a commercial edition. Manageable engineering/legal task, not a blocker.
