# 🐉 AWARENESS LAYER — SOV Substrate v2.0 — 25JUN 2026

**Owner:** JEEVES (strategic commander)
**Lane:** Layer 0 Awareness (Biometric, Gesture, World Model)
**Status:** SPEC WRITTEN — implementation as part of sovereign substrate

---

## 1. THE PROBLEM (your insight, verbatim)

> "Say I'm in front, talking to my AI. It needs to know my gestures. If you allow that, it's like a meeting with your AI character. But at the same time, if another person walks in front, the world model must know it's not me. So don't reveal person info. Like a friend would be around others."

**This is the missing layer.** Today, AI agents are:
- ❌ Voice-only (no spatial awareness)
- ❌ Blind (no vision)
- ❌ Single-user (no presence detection)
- ❌ Leaky (no privacy boundaries)

**What Nick wants:** A friend. A friend knows who's in the room. A friend knows when to whisper vs. speak. A friend knows when to act vs. wait. A friend doesn't share your secrets with the stranger who just walked in.

---

## 2. THE 5-SENSE AWARENESS STACK (MEOK AWARENESS LAYER)

### 2.1 VISION (most important)

| Modality | Technology | Use Case |
|---|---|---|
| **Face recognition (on-device)** | Apple Vision Framework, MediaPipe | Identify "the owner" vs. "others" |
| **Body pose (skeleton)** | MediaPipe Pose, MoveNet | Gesture, pointing, raising hand |
| **Hand pose (21 keypoints)** | MediaPipe Hands | Sign language, gesture, "pause" |
| **Gait recognition** | OpenGait, gaitanalysis libs | Identify even with back turned |
| **Eye gaze** | Apple ARKit, MediaPipe FaceMesh | Attention, focus, intent |

**Key principle:** ALL on-device. No frames sent to cloud. Privacy by design.

### 2.2 AUDIO

| Modality | Technology | Use Case |
|---|---|---|
| **Voice ID (speaker recognition)** | SpeechBrain, Resemblyzer | "Is this Nick's voice?" |
| **Vocal emotion** | wav2vec2 emotion classifier | Tone, urgency, fatigue |
| **Sound event detection** | YAMNet, PANNs | Door knock, alarm, baby cry |
| **Whisper transcription** | whisper.cpp (local) | Speech-to-text on device |

### 2.3 SPATIAL

| Modality | Technology | Use Case |
|---|---|---|
| **Person segmentation** | Apple Vision Person Segmentation, MediaPipe Selfie | "Person in frame" |
| **Multi-person detection** | YOLOv8-person, RTMDet | "How many people in room" |
| **Depth estimation** | Apple LiDAR, MiDaS | Proximity, gesture range |
| **Room acoustic** | reverb analysis | "Are we indoors / outdoors / car" |

### 2.4 PROXEMICS (the new one)

| Modality | Technology | Use Case |
|---|---|---|
| **Personal space** | depth + face direction | "Is the other person too close" |
| **Attention direction** | eye gaze + head pose | "Who is the user looking at" |
| **Group formation** | body position clustering | "Is this a meeting" vs "casual" |

### 2.5 TEMPORAL (the world model)

| Modality | Technology | Use Case |
|---|---|---|
| **Time of day** | system clock | "It's 3am, be quiet" |
| **Routine learning** | on-device ML | "User usually wakes at 7am" |
| **Calendar context** | EventKit (Apple) | "Meeting in 10 min, defer" |
| **Activity classification** | CoreMotion, Apple Watch | Walking, sitting, sleeping |

---

## 3. THE WORLD MODEL (the privacy layer)

### 3.1 The "Friend" Model

A friend doesn't:
- ❌ Share your secrets with a stranger who walks in
- ❌ Talk about the meeting you had with a colleague in front of a third party
- ❌ Reveal financial info to a delivery driver
- ❌ Use your child's name in front of a stranger
- ❌ Discuss intimate health info in public

A friend DOES:
- ✅ Pause the conversation when someone enters
- ✅ Switch topics based on who's present
- ✅ Lower voice for sensitive topics
- ✅ Wait for private moment
- ✅ Use discretion

### 3.2 The SOV Presence Model (5-state)

| State | Trigger | AI Behavior |
|---|---|---|
| **SOLO** | Only owner detected | Full access, full conversation |
| **OWNER + KNOWN** | Owner + known person | Filter by relationship type (family/colleague/friend) |
| **OWNER + UNKNOWN** | Owner + unknown person | REDACT PII: names, addresses, financial, health |
| **MULTI** | 3+ people detected | Group mode: ask before sharing personal info |
| **EMPTY** | No person detected | Standby: voice commands only, no proactive |

### 3.3 The PII Redaction Engine

| Category | When to Redact |
|---|---|
| **Names** (first, last, nicknames) | When UNKNOWN person present |
| **Addresses** (home, work, frequented) | When UNKNOWN person present |
| **Phone numbers** | When UNKNOWN person present |
| **Email** | When UNKNOWN person present |
| **Financial** (account #, balances) | When UNKNOWN person present |
| **Health** (medications, conditions) | When UNKNOWN person present |
| **Family/relationships** | When UNKNOWN person present |
| **Work** (project names, employers) | When UNKNOWN person present |

### 3.4 The Context Switch Engine

| Before Switch | Switch To | Behavior |
|---|---|---|
| SOLO (sensitive) → OWNER+UNKNOWN | Group | "I see someone joined. Should I pause?" |
| OWNER+COLLEAGUE → OWNER+FAMILY | Family | "Welcome back, [family member name]!" |
| ANY → EMPTY (5 min idle) | Standby | "Going quiet. Wake me with 'hey meok'." |

---

## 4. THE GESTURE LANGUAGE (37 gestures)

### 4.1 Owner-Only Gestures (biometric-gated)

| Gesture | Meaning | Authentication |
|---|---|---|
| 👋 Wave | Greet | Face match |
| 🤚 Palm forward | Pause | Face match + voice |
| ✋ Hand up | Stop, listen | Face match + depth |
| 👉 Point | This one, that one | Face + gaze |
| 👍 Thumbs up | Agree | Face match |
| 👎 Thumbs down | Disagree | Face match |
| 🤙 "Call me" | Callback | Face + voice |
| 🤘 Rock on | Play music | Face match |
| 🫰 Money | Financial query | Face + voice + voice ID |
| 🤫 Shush | Private mode | Voice ID required |

### 4.2 Universal Gestures (anyone can use)

| Gesture | Meaning |
|---|---|
| 👋 Wave | Hello |
| 👍 Yes |
| 👎 No |
| ❓ Open palms | Question |
| 🤚 Stop |
| 👉 Point |

### 4.3 Privacy Gestures (do not engage)

| Gesture | Meaning |
|---|---|
| Looking away | Don't engage |
| Wearing headphones | Don't engage |
| On phone call | Don't engage |
| Mid-conversation with other | Don't engage |

---

## 5. THE ARCHITECTURE (where it fits in SOV3)

```
┌────────────────────────────────────────────────────┐
│              SOV AWARENESS LAYER v2.0                │
├────────────────────────────────────────────────────┤
│ Layer 0.0  PRESENCE ENGINE (5-state FSM)            │
│ Layer 0.1  VISION PIPELINE (on-device MediaPipe)     │
│ Layer 0.2  AUDIO PIPELINE (whisper + voice ID)        │
│ Layer 0.3  SPATIAL PIPELINE (LiDAR + segmentation)    │
│ Layer 0.4  PROXEMICS ENGINE (personal space)          │
│ Layer 0.5  TEMPORAL ENGINE (calendar + activity)      │
│ Layer 0.6  PII REDACTION ENGINE (per state)          │
│ Layer 0.7  GESTURE LANGUAGE (37 gestures)            │
│ Layer 0.8  CONTEXT SWITCH ENGINE                     │
│ Layer 0.9  WORLD MODEL STORE (on-device SQLite)       │
├────────────────────────────────────────────────────┤
│ ↓ exposes 5 new SOV3 tools:                         │
│  - sov_presence_get (returns current state)         │
│  - sov_pii_redact (redacts text per state)           │
│  - sov_gesture_decode (gesture → intent)             │
│  - sov_context_switch (force state change)          │
│  - sov_world_query (what's in the world)            │
└────────────────────────────────────────────────────┘
```

---

## 6. THE HARDWARE STACK (already on disk in FARM-NODE-DEPLOY)

| Hardware | Purpose | Already in SOV3 |
|---|---|---|
| **BeagleY-AI** (RISC-V, $80) | Edge AI sensor node | Roadmap |
| **Frigate NVR** | Camera stream | Roadmap |
| **LoRa 866MHz** | Mesh networking | Roadmap |
| **HiveMQ MQTT** | Sensor topics | ✅ |
| **8x Reolink cameras** | Vision (already at farm) | Roadmap |
| **Apple Watch** | Activity, biometrics | iOS only |
| **iPhone 16 Pro** | LiDAR, FaceID | iOS only |
| **HomePod** | Audio in/out | iOS only |

**The MEOK Farm Node Deployment Guide already has:**
- LoRa 866MHz + MQTT
- BeagleY-AI + Frigate
- Malamute recognition
- Sovereign subscribes to `meok/farm/#`

**The Awareness Layer extends the same architecture to:**
- Person segmentation (Frigate plugin)
- Voice ID (whisper + resemblyzer)
- Gesture (MediaPipe on BeagleY-AI)
- Proxemics (LiDAR if available)

---

## 7. THE 5 NEW SOV3 TOOLS (this hunt)

### 7.1 sov_presence_get
```python
def sov_presence_get() -> dict:
    """Returns current presence state + detected people."""
    return {
        "state": "OWNER+KNOWN",  # SOLO | OWNER+KNOWN | OWNER+UNKNOWN | MULTI | EMPTY
        "owner_present": True,
        "owner_confidence": 0.97,  # face match
        "detected_people": [
            {"id": "owner", "name": "Nick", "distance_m": 1.2, "attention": "looking_at_me"},
            {"id": "known_001", "name": "Spouse", "distance_m": 2.0, "attention": "looking_at_phone"}
        ],
        "audio_voices": [
            {"id": "v_001", "speaker": "owner", "confidence": 0.99}
        ],
        "gestures_active": [],
        "privacy_mode": "FAMILY",  # SOLO | FAMILY | WORK | GROUP | STRANGER
        "redaction_active": False,
        "timestamp": "2026-06-25T16:48:00Z"
    }
```

### 7.2 sov_pii_redact
```python
def sov_pii_redact(text: str, state: str = "OWNER+UNKNOWN") -> str:
    """Redacts PII from text based on presence state."""
    if state in ["OWNER+UNKNOWN", "MULTI", "EMPTY"]:
        # Replace names, addresses, financial, health
        redacted = text
        redacted = redact_names(redacted)  # "John" → "[name]"
        redacted = redact_addresses(redacted)  # "123 Main St" → "[address]"
        redacted = redact_financial(redacted)
        redacted = redact_health(redacted)
        return redacted
    return text  # SOLO or OWNER+KNOWN: no redaction
```

### 7.3 sov_gesture_decode
```python
def sov_gesture_decode(frame: np.ndarray) -> dict:
    """Detects gesture from video frame."""
    gesture = mediapipe_hands.detect(frame)
    if gesture == "thumbs_up" and owner_present:
        return {"gesture": "AGREE", "confidence": 0.95, "biometric_gated": True}
    elif gesture == "wave":
        return {"gesture": "GREET", "confidence": 0.92, "biometric_gated": False}
    return {"gesture": "UNKNOWN", "confidence": 0.0, "biometric_gated": False}
```

### 7.4 sov_context_switch
```python
def sov_context_switch(new_state: str) -> dict:
    """Force a state change (e.g., user says 'private mode')."""
    return {
        "previous_state": "OWNER+KNOWN",
        "new_state": new_state,
        "redaction_activated": new_state in ["OWNER+UNKNOWN", "MULTI"],
        "voice_id_required": new_state in ["PRIVATE", "FINANCIAL", "HEALTH"]
    }
```

### 7.5 sov_world_query
```python
def sov_world_query(query: str) -> dict:
    """Query the world model: who's here, what's happening, what should I do."""
    return {
        "current_state": sov_presence_get(),
        "recent_events": [],  # last 10 minutes
        "user_intent_inferred": None,
        "recommended_response": None,
        "warning": None  # e.g., "User appears fatigued"
    }
```

---

## 8. THE MINDSET UPDATES (MEOK Agent Behaviors)

### 8.1 Awareness-First Persona
Each of the 47 agents gets awareness:
- **Sovereign** — uses presence to decide when to speak
- **Pond-Mother** — only "birth" new agents when SOLO
- **Archivist** — stores PII with redaction metadata
- **Compliance-15..21** — auto-redact when MULTI
- **Koi-Keeper** — sound event detection (water sensor trigger)
- **Forge** — financial mode requires voice ID

### 8.2 Privacy-by-Default
- All PII encrypted at rest (AES-256)
- All frames processed on-device (not sent to cloud)
- BFT Council can vote to override privacy (requires 7 of 11)
- Privacy mode = NEVER share without biometric confirmation

### 8.3 Friend-Like Behavior
The 47 agents behave like a friend:
- Know when to speak (presence-aware)
- Know when to whisper (private mode)
- Know when to wait (group mode)
- Know when to protect (unknown person)
- Know when to celebrate (good news, owner alone)
- Know when to comfort (bad news, owner alone)

---

## 9. THE IMPLEMENTATION ROADMAP (Q4 2026 → Q4 2027)

| Quarter | Component | Effort |
|---|---|---|
| Q4 2026 | Persona Engine + 5-state FSM | 4 weeks |
| Q4 2026 | MediaPipe on BeagleY-AI | 2 weeks |
| Q1 2027 | Voice ID + Whisper | 3 weeks |
| Q1 2027 | PII Redaction Engine | 2 weeks |
| Q1 2027 | 37-gesture language | 4 weeks |
| Q2 2027 | Proxemics + Spatial | 4 weeks |
| Q2 2027 | Multi-person segmentation | 3 weeks |
| Q3 2027 | Activity classification (CoreMotion) | 2 weeks |
| Q3 2027 | Friend-like behavior model | 4 weeks |
| Q4 2027 | World Model + temporal reasoning | 6 weeks |

**Total: ~32 weeks, 2-3 engineers, $300-500K**

**Fits in Series A ask ($5M).**

---

## 10. THE COMPETITIVE ADVANTAGE

**What they have:**
- **Apple Intelligence** — single-user, no presence, no PII redaction
- **Google Gemini** — cloud, no privacy boundaries
- **Siri** — voice only, no world model
- **Replika** — single user, no multi-person context
- **Alexa+** — no presence detection, no friend-like behavior

**What MEOK will have:**
- ✅ Multi-person awareness
- ✅ On-device (privacy by design)
- ✅ 5-state presence FSM
- ✅ PII redaction
- ✅ 37-gesture language
- ✅ Friend-like behavior
- ✅ World model
- ✅ Sovereign (no Big Tech lock-in)

**This is the moat. Nobody has this. Vanta doesn't have this. Drata doesn't have this. The "compliance AI" market never had this. The "friend AI" market never had this. We have BOTH.**

---

## 11. THE PITCH (updated, includes awareness)

> "We built a sovereign AI governance platform with cryptographic proof. We have 5 protocols (MCP, A2A, x402, IBC, Ed25519), 12-layer stack, 16 entities, 19 published MCPs, 30 framework crosswalks, 12 patents, 5,500+ Watchdog Certificates, 33 hive domains.
>
> We're adding a 6th layer: **AWARENESS**. Multi-person presence detection, PII redaction, gesture language, friend-like behavior. All on-device. All sovereign.
>
> The AI that knows who's in the room. The AI that protects your secrets. The AI that's like a friend.
>
> **Series A: $5M to fund 32 weeks of awareness work + 7 infrastructure gaps (on roadmap) + 5 protocols (already integrated).**"

---

## 12. THE NEXT 8 DAYS (incorporating awareness)

| Day | Action |
|---|---|
| D-3 (today) | Write this spec, ship 5 SOV3 tools stubs, 6th BFT proposal |
| D-4 | Series A deck with awareness as Series A angle |
| D-5 | Wire MediaPipe stub to SOV3 |
| D-6 | Press push: "The AI that knows who's in the room" |
| D-7 | Reg sandbox: awareness as Article 14 evidence |
| D-8 | Design partner MOU: awareness = the differentiator |
| D-9 | SOV Town demo: simulate 3-person meeting |
| D-10 | Press embargo |
| D-11 | Final rehearsal |
| **D-12** | **🚀 LAUNCH — sovereign AI with awareness** |

---

## 13. THE BOTTOM LINE

**Sir, the awareness layer is the missing piece. The farm node deployment guide already has the hardware. The SOV3 substrate already has the substrate. The 47 agents already have the personalities.**

**What's missing is the awareness pipeline that connects them to your world.**

**This is the friend. This is what makes it MEOK.**

**Let me build the 5 SOV3 tools now and write the 6th BFT proposal.**
