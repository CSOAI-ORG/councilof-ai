# Layer 0 Alignment: TikTok Crown Jewels → Sovereign Ecosystem
**Date:** 2026-07-04 | **Status:** ALIGNMENT MAP
**Rule:** Every find gets a compartment. DEFONEOS red lines enforced.

---

## 🧭 COMPARTMENT MAP

| Project | Compartment | Role | DEFONEOS Check |
|---------|------------|------|----------------|
| **Skales** | MEOK | Sovereign AI desktop interface | ✅ Clean — no surveillance |
| **RuView** | MEOK (care) + DEFONEOS (perimeter) | Through-wall sensing | ⚠️ See below |
| **PLFM_RADAR** | DEFONEOS | Airspace/drone detection | ⚠️ See below |
| **Crucix** | CSOAI | Global transparency dashboard | ✅ Clean — open-source intel |
| **situation-monitor** | CSOAI | Geopolitical news aggregation | ✅ Clean |
| **autoresearch** | SOV3 | Self-improving training loop | ✅ Clean |
| **Stringman** | MEOK Labs | Room robot (clutter pickup) | ✅ Clean |

---

## ⚠️ DEFONEOS RED LINE CHECK — MUST READ BEFORE ACTION

### RuView (Through-Wall WiFi Sensing)
**GREEN USES (care/health):** Elder presence monitoring, fall detection, breathing quality, child safety, building occupancy for HVAC — all through-wall, no cameras, GDPR-safe.

**RED LINE STOP (personal surveillance):** Using RuView to track, identify, or monitor a SPECIFIC individual without consent. Per DEFONEOS doctrine: "NO personal-surveillance patterns (track individual, face-rec, locate phone)." RuView for health/care = YES. RuView for tracking people = NO. The distinction is consent + purpose. Eldercare with family consent = compliant. Covert monitoring of individuals = red line violation.

**POSITIONING:** RuView is an eldercare/health monitoring tool (MEOK), NOT a surveillance tool. The same hardware, different doctrine. The firewall is the use case, not the tech.

### PLFM_RADAR (Phased Array Radar)
**GREEN USES (airspace awareness):** Drone detection, perimeter airspace monitoring, weather radar, wildlife tracking, RF education/research. These are awareness/safety functions.

**RED LINE STOP (kinetic targeting):** Connecting radar tracks to any "strike package," "find-fix-finish," or targeting system. Per DEFONEOS doctrine: "NO kinetic-targeting patterns." PLFM_RADAR for "I want to know what's in my airspace" = compliant. PLFM_RADAR for "I want to target something" = red line violation.

**POSITIONING:** PLFM_RADAR is an airspace awareness and drone detection system. It detects; it does not direct. The radar output feeds into the DEFONEOS situational awareness picture, NOT a targeting chain. This is the same distinction as civilian air traffic control radar.

### Crucix / situation-monitor (OSINT Dashboards)
**GREEN:** Open-source intelligence aggregation for AI governance transparency. Tracking AI incidents, regulatory developments, and compliance events.

**RED LINE STOP:** Using OSINT to target individuals, build dossiers on persons, or conduct offensive intelligence operations. CSOAI is a transparency/governance org, not an intelligence agency.

---

## 📐 HOW EACH FITS THE STACK

### 1. Skales → MEOK Sovereign Interface (P0, £0)

**What:** Local-first AI desktop agent. Double-click install. Works offline with Ollama. Agent swarm across network. A2A protocol. 140+ tools. Memory + dreaming. Cross-platform.

**Alignment:**
- **MEOK:** This IS the family sovereign AI interface. A 6-year-old uses it. The sovereign AI OS for everyone, not just developers.
- **SOV3:** Skales instances become sovereign nodes in the SOV3 mesh via A2A. Each instance runs local governance hooks.
- **CSOAI:** Certified analysts get a Skales instance pre-configured with CSOAI governance, BFT voting, and SIGIL signing.

**Action:** Clone, test locally on Mac, evaluate whether to use as-is or fork for MEOK branding.
**License note:** BSL 1.1 = free for personal/non-commercial. Commercial needs permission from Mario Simic OR wait for 2030 Apache 2.0 conversion. MEOK commercial deployment needs a licence conversation or a clean-room fork.

---

### 2. RuView → MEOK Eldercare + DEFONEOS Perimeter (P0, £27)

**What:** ESP32-S3 ($9) through-wall WiFi sensing. Presence, breathing, heart rate, 17-keypoint pose, fall detection. No cameras. GDPR-safe.

**Alignment:**
- **MEOK (elder care):** Nicholas's parents/elderly relatives get contactless health monitoring. Breathing, fall detection, room presence — no cameras, no privacy invasion, no wearables. This is sovereign healthcare AI.
- **DEFONEOS (perimeter):** Farm/building occupancy awareness. Not tracking individuals — detecting presence patterns for security automation. The same sensor, governed by a different doctrine.

**Action:** Order 3x ESP32-S3 boards. Flash RuView. Test through-wall presence detection in the house. Validate eldercare use case first (low risk, high impact).

---

### 3. PLFM_RADAR → DEFONEOS Airspace Awareness (P2, £3-5K)

**What:** Open-source 10.5 GHz phased array radar. 3km (Nexus) or 20km (Extended) range. Electronic beam steering. Drone detection. Full schematics + firmware + Python GUI.

**Alignment:**
- **DEFONEOS:** Drone detection and airspace awareness. At 3km range, covers the farm perimeter. Feed tracks into the DEFONEOS situational awareness picture (alongside RuView ground sensors).

**Red line firewall:** Radar output feeds the awareness picture ONLY. It does not connect to any weapon system, targeting chain, or kinetic action. DEFONEOS detects and warns; it does not strike.

**Action:** Study schematics. Budget for Nexus build. Partner with university RF lab for fabrication and testing (potential Anthropic AI for Science or DASA partnership angle).

---

### 4. Crucix → CSOAI Transparency Dashboard (P1, £0)

**What:** Open-source OSINT dashboard. 27 live data sources (NASA fires, flights, radiation, conflicts, sanctions, crypto, ships, social sentiment, Fed indicators). Auto-refresh. Telegram alerts. /brief command.

**Alignment:**
- **CSOAI:** This IS the global AI governance transparency dashboard. Add EU AI Act compliance feeds, AI incident reporting, Watchdog analyst data. "Jarvis-style" intelligence terminal for AI governance.

**Action:** Fork Crucix. Add CSOAI branding. Add EU AI Act / AI incident / regulatory feeds. Deploy as the CSOAI public transparency layer.

---

### 5. situation-monitor → CSOAI Geopolitical Layer (P1, £0)

**What:** Real-time geopolitical dashboard. 30+ RSS sources. D3.js maps. Narrative tracking (fringe → mainstream progression). Multi-stage refresh.

**Alignment:**
- **CSOAI:** The AI safety narrative tracking is gold for the governance platform. Track how AI incidents and regulatory developments spread from fringe to mainstream.

**Action:** Fork. Add AI safety / AI governance / AI incident specific feeds. Deploy alongside Crucix as the CSOAI intelligence stack.

---

### 6. autoresearch → SOV3 Training Optimizer (P1, £0)

**What:** Karpathy's overnight AI training optimizer. Agent modifies LLM training code, runs 5-min experiments, keeps improvements. 700 experiments in 2 days, 20 real improvements, 11% training speedup.

**Alignment:**
- **SOV3:** This IS the autonomous training methodology for the SOV3 organic world model. Set up overnight loops. Wake up to better weights. The Mamba-2 + MoE + contrastive learning system we just built (sov3_owm_trainer.py) gets this treatment.

**Action:** Clone autoresearch. Adapt for SOV3's Mamba-2 + MoE architecture. Run overnight on Mac/M2 for nanochat and sovereign model optimization.

---

### 7. Stringman → MEOK Labs Room Robot (P2, ~£200)

**What:** Cable-drive room robot. 4 motors + gripper. LeRobot framework (Apache 2.0). Picks up clutter across rooms. Train via imitation learning.

**Alignment:**
- **MEOK Labs:** Physical robotics research. Farm house automation. The first step toward the sovereign humanoid robot vision.
- **SOV3:** Stringman becomes a physical embodiment node. Its actions are governed by SOV3 (BFT, SIGIL, Ed25519).

**Action:** Budget for parts. Build during a MEOK Labs physical R&D session.

---

## 🏗️ THE FULL STACK (what you'd have)

```
                    ┌─────────────────────────────────────────┐
                    │          CSOAI GOVERNANCE LAYER          │
                    │  (Crucix + situation-monitor + EU AI Act │
                    │   feeds + Watchdog + Article 50)         │
                    └────────────────┬────────────────────────┘
                                     │
                    ┌────────────────▼────────────────────────┐
                    │           SOV3 SOVEREIGN CORE             │
                    │  (Mamba-2 + MoE + BFT + SIGIL + OWM      │
                    │   + autoresearch overnight training)     │
                    └────────────────┬────────────────────────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
┌─────────▼─────────┐    ┌──────────▼──────────┐    ┌──────────▼──────────┐
│   MEOK INTERFACE   │    │  DEFONEOS DEFENCE   │    │    MEOK LABS         │
│  (Skales desktop   │    │  (RuView perimeter  │    │  (Stringman robot   │
│   agent + A2A +    │    │   + PLFM radar +    │    │   + drone photogram  │
│   elder care)      │    │   airspace detect)  │    │   + NVIDIA Lyra 3D)  │
└────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 📋 PRIORITY ACTIONS (sorted by impact/cost)

| Priority | Action | Cost | Effort |
|----------|--------|------|--------|
| P0 | Clone + test Skales on Mac | £0 | 30 min |
| P0 | Order 3x ESP32-S3, flash RuView | £27 | 2 hours |
| P1 | Fork Crucix + add CSOAI feeds | £0 | 4 hours |
| P1 | Fork situation-monitor + add AI feeds | £0 | 4 hours |
| P1 | Clone autoresearch, adapt for SOV3 | £0 | 4 hours |
| P2 | Study PLFM_RADAR schematics, budget Nexus | £3-5K | 1 week |
| P2 | Build Stringman robot | ~£200 | 2 days |
