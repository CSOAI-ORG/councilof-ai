# EMBODIED PREDICTIVE SIMULATION — SovSpace for Humanoids & Drones
## One imagination engine, two bodies: agentic + physical, governed from layer zero
### CSOAI Ltd · Authored 2026-07-08 · Status: ARCHITECTURE (DESIGNED / ASPIRATIONAL, not running)

> Extends SOV3_SOVSPACE_INTERNAL_WORLDMODEL. **Honesty register (read first):** NONE of this is
> running. SOV3 has no embodied world-model, no physical sensing, no drones/humanoids. This is a
> designed architecture grounded in real robotics research. The human-sensing components carry
> HARD legal constraints (below) that are load-bearing, not optional.

---

## 1. THE INSIGHT: agentic and physical are the SAME architecture

A humanoid or drone arriving at a scene, simulating "what's the best thing to do here" before
acting, is the SovSpace imagination loop with a physical body:

```
perceive → build world-model state → imagine + score candidate actions → act on best
```

- **Agentic body:** action space = software calls; sensors = data/mesh. (What SOV3 is now.)
- **Physical body:** action space = motor commands; sensors = cameras, WiFi-sensing, lidar, mics.
- **Same engine.** One world-model, one Care-Floor-gated rollout, two action spaces. This is the
  real unification — not two systems, one imagination engine wearing different bodies.

This is established robotics research (model-predictive control + learned world-models):
DreamerV3-on-robots, Google world-model robotics, RT-2/RT-X, visual foresight. A drone that
"imagines approach paths before landing" is imagination-augmented planning on a physical action
space. Real, citable, not speculative.

## 2. THE SENSOR REALITY (what's actually possible)

| Sensor | What it genuinely does | Maturity |
|---|---|---|
| Onboard cameras + depth | scene reconstruction, obstacle map, object pose | mature |
| LiDAR / radar | precise geometry, works in dark/smoke | mature |
| WiFi CSI sensing | presence, motion, coarse pose — even through walls | research→emerging |
| Microphone array | sound-source localization, event detection | mature |
| **Public camera feeds** | third-party video of public space | **legally gated (below)** |

WiFi sensing (channel-state-information human sensing, DensePose-from-WiFi) is real perception.
The physics works. That is exactly why the governance below is non-negotiable.

## 3. THE ARCHITECTURE (embodied SovSpace)

```
   PHYSICAL SENSORS ──► WORLD-MODEL (SovSpace, now spatially grounded) ── "the inner scene"
   (own cameras,          continuous latent sim of the real environment
    lidar, wifi,          fed by CONSENTED/lawful perception only
    mic array)                        │
                                      ▼
                          IMAGINE candidate physical + agentic actions
                                      │
                          SCORE each against: Care-Floor, threat, dependency,
                                      │        AND a new PHYSICAL-SAFETY gate
                                      ▼
                          CONSENT + LEGALITY GATE  ◄── (before any human-sensing use)
                                      │
                                      ▼
                          act on best-scored, gated plan  → SIGIL-signed
```

**New gate vs the software architecture:** a **Physical-Safety + Consent-Legality gate** sits
between imagination and action. No physical action, and no use of human-sensing data, proceeds
without passing it. This is not optional polish — it is the reason the system is lawful.

## 4. THE HARD LINE (this is the moat, not the brake)

Sensing humans via WiFi-through-walls or third-party public cameras is **surveillance of
non-consenting people.** Depending on jurisdiction it engages:

- **EU AI Act Art. 5** — PROHIBITED practices (real-time remote biometric identification in
  public spaces is banned/tightly restricted). Untargeted human-sensing can fall here.
- **GDPR** — biometric/special-category data; lawful basis, DPIA, minimisation all required.
- **UK DPA / surveillance law**; sector rules for drones (aviation authority) and public-space
  monitoring.

**CSOAI's unique position:** you are the compliance authority. Every competitor who builds
embodied sensing will trip the prohibited-practices wire by default. The GOVERNED version —
consent-gated, minimised, Care-Floor-bounded, guardian-covenanted, SIGIL-audited — is a product
only CSOAI can credibly certify. **The governance is the differentiator.** Cross-walks:

| Capability | Governance binding | Framework |
|---|---|---|
| WiFi/camera human-sensing | consent-legality gate; no untargeted biometric ID | EU AI Act Art.5, GDPR Art.9 |
| Physical action near people | physical-safety gate; imagine-then-gate | ISO 10218/robot-safety, EU AI Act Art.9 |
| Environment mapping | data-minimisation; drop human data by default | GDPR Art.5 |
| Any human affected | Natal Guardian covenant + Care-Floor over IMAGINED outcome | Charter 45, GuardianOf Art.II |

## 5. WHY THIS FITS SOVEREIGN EXACTLY

- **Anticipatory protection becomes physical.** The drone/humanoid imagines the outcome and the
  Care-Floor gates the *imagined* physical action before it happens — GuardianOf Principle 2
  (anticipation) in the physical world. Protection is designed in, not regulated on afterward.
- **One engine, audited.** Every imagined-then-taken action, software or physical, is SIGIL-
  signed — the same audit spine the whole estate already uses.
- **Governed embodiment is a category only the compliance-authority can own.**

## 6. BUILD PATH (honest)
1. **Software rollout+scoring loop** (from the SovSpace doc) — buildable now with current models.
2. **Physical-safety + consent-legality gate** — designable now as a spec; it is the core IP.
3. **Simulated embodiment** — test the loop in a simulator (Isaac/MuJoCo) before any hardware.
4. **Real sensors, consented only** — start with onboard cameras/lidar; human-sensing ONLY under
   the consent-legality gate and a DPIA. GPU + hardware + legal review required.
5. **Public-camera / WiFi-human-sensing** — LAST, and only where lawful, gated, and certified.

## 7. HONESTY REGISTER
- RUNNING: nothing. No robot, no drone, no physical sensing exists in the estate.
- DESIGNED: the unified imagination engine, the physical-safety and consent-legality gates.
- ASPIRATIONAL: real humanoids/drones, WiFi human-sensing, public-camera integration.
- The human-sensing capabilities are LEGALLY CONSTRAINED — the constraints are part of the
  architecture, not caveats to it. Building them ungoverned would breach EU AI Act Art.5.
- No claim that any of this senses, imagines, or acts today. Grounding robotics research is real
  and citable; the deployment is far-future and governance-gated.

*Authored for Sir Nicholas Templeman. One imagination engine, two bodies — and the governance
that lets CSOAI be the one company that can build embodied predictive AI lawfully. DESIGNED.*
