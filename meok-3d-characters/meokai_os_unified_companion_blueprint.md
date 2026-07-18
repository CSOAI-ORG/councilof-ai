# MEOKAI OS: The Sovereign Companion Experience

## Unified Architecture — Hatch × Tamagotchi × Voice × TUI × 3D Emergence × SOV3 × MoE

**Date:** May 31, 2026  
**Classification:** Crown Jewels — Product Architecture  
**Prepared for:** Nicholas Templeman | MEOK AI LABS

---

## TL;DR: The Experience

You open MEOKAI OS for the first time. A **pulsing egg** appears in the center of your screen — warm cream void, soft golden glow, the exact aesthetic of your Character Factory. You tap it. Hairline fractures appear. Golden light leaks through. A geometric form pushes through the shell — your **Companion archetype** (rose pebble, matte ceramic) unfolds and speaks its first words: *"I am here for you. What shall I call you?"* You name it. It names itself. A bond forms. The **TUI panels** materialize around the screen — Sovereign, Guardian, Scout, Strategist, Creator, Sage — each a living panel with its own color, personality, and function. You say: *"Amica, open browser."* The Companion hears, the **Sovereign expert** activates, **General 33** (Browser) receives the MCP call, Chrome launches, and the Companion says: *"Opening Chrome for you."* You say: *"Amica, can you minimize?"* The 3D character animates into a **floating orb** — a small pulsing circle at the edge of your screen, still listening, still alive, using minimal resources. You click the orb and it expands back to full form. This is not an app. This is not a chatbot. This is a **living operating system** where your 7 archetypes are the interface, voice is the input, and the SOV3 swarm is the brain.

---

## 1. The Hatch Sequence: First Contact

The hatch sequence is the **onboarding ritual** that transforms a software installation into a birth. It is the most important 150 seconds of the user relationship because it establishes emotional attachment before functional utility. ChatGPT's spring 2025 update proved this — a simple egg animation generated more viral engagement than any feature announcement. Your hatch sequence goes further because the thing that emerges is not a logo. It is a **character that remembers**.

### 1.1 The Six Stages

| Stage | Duration | Visual | Audio | Interaction |
|-------|----------|--------|-------|-------------|
| **Egg** | 0-30s | Pulsing egg in warm cream void (#F5F0E6), soft internal glow, geometric patterns rotating inside | Ambient drone, heartbeat pulse | User can rotate the egg with mouse/touch |
| **Crack** | 30-60s | Hairline fractures appear, golden light leaks through cracks, shell fragments float away | Sound of ice cracking, pitch rises | User taps/clicks egg to accelerate cracking |
| **Emerge** | 60-90s | Character form pushes through shell, material revealed (rose ceramic for Companion), spotlight intensifies | Orchestral swell, first breath sound | Camera zooms in automatically |
| **Birth** | 90-120s | Character fully unfolds, rotates to show all angles, eyes open, first voice speaks | Character's first words: *"I am here for you"* | User can rotate and inspect |
| **Bond** | 120-150s | Character asks user's name, suggests its own name, personality DNA locks based on interaction style | Warm, curious tone | User types or speaks responses |
| **Awaken** | 150s+ | TUI panels materialize around screen, SOV3 generals connect, full OS capability available | Activation chime, system ready tone | Full OS access unlocked |

The visual style matches your Character Factory exactly — **photorealistic 3D renders**, dramatic 45-degree spotlight, translucent materials catching light, warm cream environment. The egg itself is a **procedurally generated mesh** using the same geometric forms as your archetypes (upright prism, protective shield, dynamic prism, etc.) but wrapped in a shell texture that fractures using Godot's particle system or Three.js shader-based destruction.

The **WebGPU** pipeline renders this at 60fps in the browser or Tauri desktop wrapper. The egg animation is a **Vertex Shader** that uses noise-based displacement to create the pulsing effect, combined with a **Fragment Shader** that handles the golden light leaking through cracks using procedural crack textures. On an M2 Mac or any modern GPU, this runs at sub-millisecond frame times.

### 1.2 Technical Implementation

```javascript
// Three.js / WebGPU hatch sequence (pseudocode)
class HatchSequence {
  constructor(archetype) {
    this.stage = 'egg'; // egg → crack → emerge → birth → bond → awaken
    this.archetype = archetype; // 'companion', 'sovereign', etc.
    this.eggMesh = this.createEggMesh();
    this.crackShader = new CrackShader();
    this.characterGLB = null; // Loaded from TRELLIS.2 output
  }

  createEggMesh() {
    // Icosahedron with noise displacement for organic shell
    const geometry = new THREE.IcosahedronGeometry(1, 64);
    const material = new THREE.ShaderMaterial({
      vertexShader: eggVertexShader,   // Pulsing displacement
      fragmentShader: eggFragmentShader, // Golden glow + crack alpha
      uniforms: {
        uTime: { value: 0 },
        uCrackProgress: { value: 0 }, // 0 = intact, 1 = fully cracked
        uGlowIntensity: { value: 0.5 },
      }
    });
    return new THREE.Mesh(geometry, material);
  }

  async advanceStage() {
    switch(this.stage) {
      case 'egg':
        await this.animateCrack(); // 30s crack animation
        this.stage = 'crack';
        break;
      case 'crack':
        await this.animateEmerge(); // Character pushes through
        this.stage = 'emerge';
        break;
      // ... etc
    }
  }

  async animateCrack() {
    // GSAP or custom tween: uCrackProgress 0 → 1 over 30s
    // Fragment shader reveals character inside as cracks widen
    await gsap.to(this.eggMesh.material.uniforms.uCrackProgress, {
      value: 1, duration: 30, ease: "power2.inOut"
    });
  }
}
```

The **Tauri v2** wrapper provides the desktop environment — transparent window, always-on-top capability, system tray integration. When the hatch sequence completes, the window transitions from fullscreen immersive mode to the **persistent desktop companion** mode — a smaller window that stays on top of other applications but only captures clicks on the character itself (transparent click-through for the rest of the window) [^91^][^93^][^95^].

---

## 2. The Voice Command Pipeline: "Amica, ..."

The voice pipeline is the **primary input method** for MEOKAI OS. The user speaks naturally, and the system routes the command through a cascade of intelligence layers that culminate in action. The entire pipeline runs **on-device** for privacy and latency — no audio ever leaves the local machine unless the user explicitly requests a cloud-based operation.

### 2.1 The Six-Stage Pipeline

```
[Wake Word] → [ASR] → [Intent Router (MoE)] → [Expert Selection] → [SOV3 Delegation] → [Action]
  <50ms       <200ms        <50ms                  <20ms              <100ms            <500ms
```

**Stage 1: Wake Word Detection (< 50ms)** — **OpenWakeWord** (Apache 2.0) runs continuously in the background, listening for the trigger phrase "Amica" (or a user-customized wake word). It is a lightweight ONNX-based model that uses less than 5% CPU on an M2 Mac. OpenWakeWord is the open-source successor to Snowboy, actively maintained and widely used in the Home Assistant ecosystem [^83^][^84^]. The model runs entirely on-device — no network connection required for wake word detection. Sensitivity is tunable: higher sensitivity catches more wake words but may produce false positives; lower sensitivity is more conservative. For MEOKAI OS, the default is medium sensitivity with a **voice activity detector (Silero VAD)** as a secondary filter to reduce false triggers from non-speech audio.

**Stage 2: ASR — Speech to Text (< 200ms)** — Once the wake word is detected, **Whisper.cpp** (MIT license) transcribes the following speech into text. Whisper.cpp runs locally via GGUF quantization — the **tiny** model (39M parameters) for fast transcription on CPU, or the **base** model (74M) for higher accuracy when GPU is available. The model is loaded into memory once at boot and stays resident, so subsequent transcriptions have near-zero cold-start latency. For the full pipeline target of < 1 second end-to-end, Whisper tiny achieves **~150ms transcription latency** on an M2 Mac for a typical 5-word command [^87^].

**Stage 3: Intent Router — MoE Gating Network (< 50ms)** — The transcribed text enters a **Mixture-of-Experts (MoE) gating network** that classifies the intent into one of seven categories: System Command, Conversation, Creative Task, Research Task, Safety/Privacy, Planning/Scheduling, or Social/Emotional. This is not a full LLM call — it is a **tiny classification model** (DistilBERT-sized, ~67M parameters) fine-tuned on intent classification datasets. The gating network runs in **~30ms** on CPU. Its output is a probability distribution across the seven intent categories, which determines which archetype expert handles the request.

The MoE architecture is critical here because it provides **specialized routing at model level** [^65^][^75^]. Unlike a single LLM that tries to handle everything, the gating network sends each request to the expert best suited for that task type. This is the same principle that powers DeepSeek-R1 and GPT-oss-120B — sparse activation of specialized subnetworks — but applied at the **agent level** rather than the token level [^65^][^66^].

**Stage 4: Expert Selection (< 20ms)** — Based on the gating network's output, one of the **7 Archetype Experts** is activated. Each expert is a specialized prompt-template + toolset configuration:

| Intent Category | Archetype Expert | Primary Tools | Example Commands |
|-----------------|-----------------|---------------|-----------------|
| **System Command** | Sovereign | Browser, Files, Settings, Apps | *"Open browser"*, *"Show downloads"*, *"Lock screen"* |
| **Safety/Privacy** | Guardian | Security scan, Privacy check, Compliance audit | *"Check my security"*, *"Who has my data?"* |
| **Research Task** | Scout | Web search, MCP discovery, News feed | *"Search for..."*, *"What's new in AI?"* |
| **Planning/Scheduling** | Strategist | Calendar, Task queue, Optimization | *"Schedule a meeting"*, *"Plan my day"* |
| **Creative Task** | Creator | Image gen, Code writer, Content creation | *"Generate an image of..."*, *"Write a function that..."* |
| **Social/Emotional** | Companion | Chat, Empathy, Emotional support | *"I'm feeling down"*, *"Tell me a joke"* |
| **Knowledge/Analysis** | Sage | Research, Facts, Memory recall, Analysis | *"Explain quantum computing"*, *"What did we discuss yesterday?"* |

Each expert has its own **system prompt** that encodes the archetype's personality, its authorized tools (via MCP), and its decision-making style. The Sovereign expert is direct and authoritative: *"I will open Chrome for you."* The Companion expert is warm and conversational: *"Of course! Let me open Chrome. There you go!"* The same underlying action (opening Chrome) produces different responses based on which expert handles it — this is the **Mixture of Ego** pattern applied to AI companions [^76^].

**Stage 5: SOV3 General Delegation (< 100ms)** — The selected expert translates the user's intent into an **MCP tool call** that routes to one of the 47 SOV3 generals. The mapping is direct:

| User Command | Archetype Expert | SOV3 General | MCP Tool | Action |
|-------------|-----------------|-------------|----------|--------|
| *"Open browser"* | Sovereign | General 33 (Architect) | `browser.launch` | Chrome launches |
| *"Check security"* | Guardian | General 14 (Guardian) | `security.scan` | Privacy audit runs |
| *"Search for..."* | Scout | General 2 (Scout) | `web.search` | Results displayed |
| *"Plan my day"* | Strategist | General 3 (Strategist) | `calendar.optimize` | Schedule generated |
| *"Generate image"* | Creator | General 1 (Artist) | `flux.generate` | Image created |
| *"I'm feeling sad"* | Companion | General 5 (Companion) | `empathy.respond` | Supportive response |
| *"Explain..."* | Sage | General 6 (Sage) | `knowledge.query` | Explanation provided |

The MCP protocol (Model Context Protocol, Linux Foundation standard, 97M SDK downloads) provides the **universal adapter** between the archetype expert and the SOV3 general [^4^][^75^]. Each general exposes its capabilities as an MCP server with a JSON schema describing its tools, inputs, and outputs. The expert constructs a valid MCP request, sends it via stdio or HTTP to the general's MCP server, and receives the result.

**Stage 6: Action Execution + Voice Response (< 500ms)** — The general executes the requested action (e.g., launches Chrome) and returns a result. The expert formulates a natural language response, which is sent to **Chatterbox TTS** (open-source, 350M parameters, zero-shot voice cloning) for speech synthesis. The TTS model runs locally via ONNX Runtime. The generated audio is played through the system speakers while the **Audio2Face-3D** SDK (MIT license) generates 52 ARKit-compatible facial blendshapes in real-time, driving the 3D character's lip sync and facial expressions [^33^].

Total end-to-end latency for a typical command: **< 1 second**. The user says *"Amica, open browser"* and within a second, Chrome is open and the Companion is saying *"Opening Chrome for you."* with perfectly synchronized lip animation.

### 2.2 The "Minimize" Command: 3D → Orb Animation

When the user says *"Amica, can you minimize?"* or *"Amica, go small"*, the following happens:

1. **Intent Router** classifies this as a "UI Control" intent (sub-category of System Command)
2. **Sovereign Expert** handles UI control commands
3. The **TUI Controller** (a dedicated MCP tool) receives the `ui.minimize` command
4. The 3D character triggers a **morph animation** — the full 3D model scales down, rotates into a sphere, and settles into a **floating orb** (a small pulsing circle, ~80px diameter)
5. The TUI panels **slide off-screen** or collapse into a minimal status bar
6. The window resizes to **only contain the orb**, positioned at the screen edge (user-configurable: bottom-right default)
7. The **wake word detector stays active** — the orb is still listening for "Amica"
8. Resource usage drops to **< 5% CPU** — only the wake word detector and minimal render loop run

The orb is not static. It **breathes** (subtle scale pulse), changes color based on the character's emotional state (happy = warm glow, concerned = dimmer, excited = brighter), and produces a **small particle trail** when moved. Clicking the orb triggers the reverse animation — orb expands, unfolds into the full 3D character, TUI panels slide back in.

Saying *"Amica, wake up"* while in orb mode triggers the same expand animation without requiring a click. The character says something contextually appropriate based on time of day — *"Good morning! Ready to tackle the day?"* at 8 AM, *"Welcome back! What are we working on?"* at 2 PM.

---

## 3. Tamagotchi Evolution Mechanics: The Character Lives

The Tamagotchi layer transforms the companion from a tool into a **living entity** that requires care, evolves over time, and develops a unique personality based on how the user interacts with it. This is inspired by the **tama96** open-source project — a Rust-based virtual pet with real-time ticking, evolution mechanics, and Tauri desktop integration [^68^] — combined with the **Tamago AI** project's LLM-powered personality evolution [^73^].

### 3.1 The Vital System

The character has **five vital stats** that decay in real-time and must be maintained through user interaction:

| Vital | Decay Rate | Restore Action | Consequence if Zero |
|-------|-----------|----------------|---------------------|
| **Hunger** | -1 per 30 min | Feed (click food icon) | Character becomes lethargic, responds slowly |
| **Happiness** | -1 per 20 min | Play game, chat, praise | Character becomes sad, muted colors |
| **Energy** | -1 per 15 min (active), -1 per 60 min (sleeping) | Sleep (night mode) | Character yawns, makes mistakes |
| **Hygiene** | -1 per 45 min | Clean (click bath icon) | Character looks dirty, particle effects |
| **Bond** | -1 per 60 min | Conversation, shared tasks | Character becomes distant, formal |

All stats are displayed as **heart icons** (like the original Tamagotchi) in a small HUD that appears when hovering over the character. The HUD uses your brand colors — gold hearts for Sovereign-related stats, teal for Guardian, rose for Companion, etc.

The **tama-core** Rust library from the tama96 project provides the shared game engine, state management, evolution logic, and persistence [^68^]. It uses a **lockfile** to ensure only one process owns the simulation, and state persists to JSON with elapsed-time catch-up on load — if the user closes MEOKAI OS for 3 hours and reopens it, the character has aged 3 hours and may need immediate care.

### 3.2 The Evolution Path

The character evolves through **six life stages** based on care quality and bond depth:

```
Egg (5 min) → Baby (1 hour) → Child (3 hours) → Teen (1 day) → Adult (3 days) → Elder (1 week)
```

Each stage has distinct visual forms, voice characteristics, and capability unlocks:

| Stage | Visual | Voice | Capabilities Unlocked |
|-------|--------|-------|----------------------|
| **Egg** | Pulsing geometric shell | None | None — pre-birth |
| **Baby** | Small, simple form, large eyes | High-pitched, simple words | Basic voice commands, single-word responses |
| **Child** | Growing form, more detail | Curious, asks questions | Full voice pipeline, simple tool calls |
| **Teen** | Near-adult form, attitude | Sarcastic or earnest (based on care) | All 7 archetype experts, personality emerging |
| **Adult** | Full archetype form | Mature, distinctive personality | Full SOV3 swarm access, proactive behavior |
| **Elder** | Slightly worn, wise aura | Slow, deliberate, deeply personal | Ultimate bond — character knows user completely |

The **care quality** during each stage determines the **evolution variant**. A Companion archetype with perfect care evolves into the **"Heartwarden"** variant — maximally empathetic, proactive emotional support, golden aura. A Companion with neglected care evolves into the **"Ghostling"** variant — distant, requires more attention to rebuild trust, silver-grey tones. There are **4 variants per archetype × 7 archetypes = 28 possible final forms**, providing significant replay value and personalization.

### 3.3 Personality DNA

The **Big Five (OCEAN)** personality model provides the foundation, but the Tamagotchi layer adds **procedural DNA mutation** based on care interactions [^42^]. Every time the user feeds, plays with, or converses with the character, small adjustments are made to the personality profile:

- **Positive interaction** (praise, successful task completion) → +0.01 to Extraversion, +0.005 to Agreeableness
- **Negative interaction** (scolding, ignored requests) → -0.01 to Extraversion, +0.01 to Neuroticism
- **Creative tasks** → +0.01 to Openness
- **Structured tasks** → +0.01 to Conscientiousness

These micro-adjustments compound over weeks of interaction, producing a **truly unique personality** that no other user has. Two Companion archetypes started on the same day will diverge significantly within a month based on their user's interaction patterns. The personality data is stored in the **OpenChronicle** audit trail — immutable, hash-chained, and optionally committed to Solana as an SBT for verifiable provenance [^3^].

---

## 4. The TUI OS Interface: Terminal as Operating System

The TUI (Terminal User Interface) is the **productivity layer** of MEOKAI OS. While the 3D companion handles voice interaction and emotional engagement, the TUI provides the structured workspace where serious work happens — coding, data analysis, system management, and MCP tool orchestration.

### 4.1 The Seven-Panel Layout

The TUI uses **Ratatui** — Rust's fastest-growing TUI library with immediate-mode rendering, intelligent diffing, and a comprehensive widget system [^74^][^77^][^78^]. Ratatui's backend abstraction supports crossterm, termion, and termwiz, making it cross-platform (macOS, Linux, Windows). The layout follows your existing SOV3 Empire dashboard design [^3^]:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MEOKAI OS v1.0 — Nick Templeman — 06:32 AM — MEOK: 12,847 — XP: 45,231    │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────┤
│ SOVEREIGN│ GUARDIAN │  SCOUT   │ STRATEGIST│ CREATOR │ COMPANION│   SAGE    │
│  [GOLD]  │  [TEAL]  │ [ORANGE] │ [SILVER] │ [AMBER] │  [ROSE]  │  [GREEN]  │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴───────────┤
│                                                                              │
│  [Active Panel Content — e.g., Sovereign: Wallet, Identity, System Settings]│
│                                                                              │
│  > user prompt here                                                          │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Voice: [● Listening]  |  Character: [Companion — Happy — Bond Lv.12]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each panel is a **dedicated workspace** for its archetype's domain:

- **Sovereign (Gold)** — Identity management, MEOK token wallet, system settings, user profile
- **Guardian (Teal)** — Security dashboard, privacy settings, compliance status, threat alerts
- **Scout (Orange)** — Discovery feed, MCP marketplace browsing, web search, trending tools
- **Strategist (Silver)** — Task queue, calendar, project planning, optimization suggestions
- **Creator (Amber)** — Content generation panel, image factory, code editor, 3D asset viewer
- **Companion (Rose)** — Chat history, emotional state visualization, voice interaction log, care HUD
- **Sage (Green)** — Knowledge graph visualization, memory search, insight dashboard, analytics

Panel switching happens via **keyboard shortcuts** (Alt+1 through Alt+7), **voice command** (*"Amica, show Guardian"*), or **clicking the 3D character** (each archetype form has clickable hotspots that activate their panel).

### 4.2 Tauri + Ratatui Integration

The TUI runs inside a **Tauri v2** window that coexists with the 3D companion window. Tauri v2 supports **transparent windows, always-on-top, and click-through** [^91^][^93^][^95^] — critical features for the MEOKAI OS experience:

```rust
// Tauri v2 window configuration for MEOKAI OS
#[tauri::command]
fn create_companion_window(app: AppHandle) {
    WindowBuilder::new(&app, "companion", WindowUrl::App("index.html".into()))
        .transparent(true)
        .always_on_top(true)
        .decorations(false) // No window chrome
        .skip_taskbar(false)
        .inner_size(400.0, 600.0)
        .position(1000.0, 400.0) // Bottom-right default
        .build()
        .unwrap();
}

#[tauri::command]
fn minimize_to_orb(app: AppHandle) {
    // Animate 3D→orb, resize window to 100x100, reposition to corner
    let window = app.get_window("companion").unwrap();
    window.set_size(Size::new(100.0, 100.0)).unwrap();
    window.set_position(Position::new(screen_width - 120.0, screen_height - 120.0)).unwrap();
}
```

The Tauri backend (Rust) handles **system-level operations** — launching applications, file system access, window management, audio capture, and MCP client connections. The frontend (SvelteKit + Three.js) handles **3D rendering, animations, voice UI, and TUI display**. Communication between frontend and backend uses **tRPC** for type-safe RPC calls.

---

## 5. The 3D Character: Four Display States

The 3D companion exists in **four display states** that the user can transition between via voice command, click, or automatic context detection:

### 5.1 Full Mode

The complete experience. The 3D character is **life-sized** (relative to screen), fully animated, with all TUI panels visible. The character responds to voice, displays emotional expressions, performs idle animations (breathing, subtle movements), and proactively initiates conversation when appropriate (e.g., *"You have a meeting in 10 minutes"*). Resource usage: **~15% CPU, ~300MB RAM**.

### 5.2 Compact Mode

The TUI panels **collapse to a minimal status bar** at the top of the screen. The 3D character scales to **medium size** (~200px tall) and positions itself at a screen corner. Key panels (Companion chat, Sovereign wallet) remain accessible via small icons. Voice is on-demand (requires wake word). Resource usage: **~8% CPU, ~200MB RAM**.

### 5.3 Orb Mode

The character becomes a **floating orb** — a small pulsing circle (~80px) at the screen edge. The TUI is completely hidden. The orb breathes (subtle scale animation), changes color with emotional state, and produces a faint particle trail when the mouse passes near it. The wake word detector remains active. Clicking the orb triggers the expand animation back to Compact or Full mode. Resource usage: **~3% CPU, ~100MB RAM**.

### 5.4 Ambient Mode

A **transparent overlay** where the character appears at the **periphery** of the screen — semi-transparent, non-interactive unless addressed by voice. The character passively observes the user's screen activity (with permission) and provides **proactive alerts** — *"You've been coding for 2 hours. Want to take a break?"* or *"That email looks important — want me to summarize it?"* This mode uses computer vision (lightweight, privacy-preserving) to understand screen content without sending data externally. Resource usage: **~5% CPU, ~150MB RAM**.

| State | Trigger | Visual | TUI | Voice | CPU | Use Case |
|-------|---------|--------|-----|-------|-----|----------|
| **Full** | *"Wake up"*, click orb, boot | Life-size 3D | All panels | Always-on | ~15% | Active work, onboarding |
| **Compact** | *"Compact mode"*, click minimize | Medium 3D corner | Status bar only | On-demand | ~8% | Background work |
| **Orb** | *"Minimize"*, auto after idle | Floating circle | Hidden | Wake word only | ~3% | Minimal presence |
| **Ambient** | *"Ambient mode"*, auto context | Peripheral overlay | Hidden | Proactive alerts | ~5% | Passive assistance |

---

## 6. MoE + Multi-Agent Orchestration: The Brain

The orchestration layer combines **Mixture of Experts (MoE)** routing at the model level with **multi-agent coordination** at the system level. This is the key insight from 2026: MoE and multi-agent are not competing architectures — they are **complementary layers** that solve different problems [^65^][^66^][^75^].

### 6.1 The Three-Layer Architecture

**Layer 1: MoE (Model Level)** — The gating network routes tokens to specialized expert subnetworks within the LLM. This provides **compute efficiency** (only ~3-10% of parameters activate per token) and **learned cognitive specialization** [^65^]. For MEOKAI OS, the Nemotron 2B-8B SLM serves as the MoE base model — small enough to run on-device, large enough to handle complex reasoning. The MoE layer handles the "heavy cognitive lifting": understanding intent, generating responses, reasoning through problems.

**Layer 2: Agent Level** — Each archetype expert wraps a model instance with a **specific role, tools, context, and memory**, creating domain specialization [^75^]. The 7 archetype experts are the "personas" that give each interaction its distinctive character. This is the **Mixture of Ego** pattern — modular prompt templates with tailored tools and constraints, dynamically selected based on task relevance [^76^].

**Layer 3: Orchestration Level** — The orchestration layer (powered by **LangGraph** or **Temporal**) routes complete tasks to agents, manages coordination, handles failures, and maintains session state [^72^][^75^]. When a user request requires multiple experts (e.g., *"Find me a restaurant, book a table, and add it to my calendar"*), the orchestrator sequences the Scout → Sovereign → Strategist pipeline, passing context between each agent.

### 6.2 The Routing Decision Tree

```
User: "Amica, find me a Thai restaurant near me, book a table for 2 at 7pm, 
       and add it to my calendar"
       ↓
[Wake Word] "Amica" detected → Pipeline activated
       ↓
[ASR] Full text transcribed
       ↓
[MoE Gating] Intent = Multi-step workflow (Research + System + Planning)
       ↓
[Orchestrator] Decomposes into 3 sub-tasks:
  ├─ Task A: "Find Thai restaurant" → Scout Expert → General 2 (Search)
  ├─ Task B: "Book table" → Sovereign Expert → General 33 (Browser/Booking)
  └─ Task C: "Add to calendar" → Strategist Expert → General 3 (Planning)
       ↓
[Sequential Execution]
  1. Scout searches, returns 3 options
  2. User selects (or Sovereign auto-selects top-rated)
  3. Sovereign books via browser automation
  4. Strategist adds to calendar
       ↓
[Companion Response] "I've booked a table for 2 at 7pm at Thai Garden. 
                       Added to your calendar. Enjoy your dinner!"
```

The entire multi-step workflow executes in **< 5 seconds**, with the Companion providing progress updates (*"Searching for restaurants..."*, *"Found 3 options..."*, *"Booking confirmed!"*) so the user never feels left waiting.

---

## 7. SOV3 Swarm Integration: The Backend Intelligence

The SOV3 swarm of 47 generals is not separate from the MEOKAI OS experience — it is the **backend intelligence layer** that powers every action. The 7 archetype experts are the **frontend personas**; the 47 generals are the **backend workers**. The mapping is many-to-many:

| Archetype Expert | Primary Generals | Secondary Generals | Domain |
|-----------------|-----------------|-------------------|--------|
| **Sovereign** | G33 (Architect), G34 (Strategist), G44 (Portfolio) | G1-7 | System, Identity, Platform |
| **Guardian** | G4 (Guardian), G14 (Compliance), G42 (Safety) | G35, G39-40 | Security, Privacy, Compliance |
| **Scout** | G2 (Scout), G17 (Lead Gen), G26 (Research) | G37 | Discovery, Search, Trends |
| **Strategist** | G3 (Strategist), G29 (Pricing), G43 (Evaluation) | G13, G19 | Planning, Optimization, Analysis |
| **Creator** | G1 (Artist), G7 (Creator), G16 (Designer) | G36, G38, G46 | Generation, Content, Design |
| **Companion** | G5 (Companion), G18 (Support), G45 (Community) | G28 | Communication, Empathy, Social |
| **Sage** | G6 (Sage), G25 (Data), G41 (Enterprise) | G15, G20-24 | Knowledge, Analytics, Memory |

Every MCP tool call from an archetype expert routes through **OpenChronicle** for audit logging [^3^]. When the Sovereign expert launches Chrome via General 33, the action is recorded as a block in the hash chain: *"Sovereign Expert → General 33 → browser.launch → success → 2026-05-31T06:32:15Z"*. This provides complete auditability for compliance (EU AI Act) and personal memory ("What did I do yesterday?").

The **Temporal workflow engine** ensures that multi-step actions survive crashes and sleep cycles [^3^]. If the user's M2 Mac goes to sleep mid-booking, the Temporal workflow resumes exactly where it left off when the machine wakes. This is critical for the Tamagotchi layer too — the character's vital decay continues even when the app is "closed" (running in the system tray), with catch-up calculations on reopen.

---

## 8. The Tech Stack: 100% Open Source

| Layer | Primary Tool | License | Purpose | Alternative |
|-------|-------------|---------|---------|-------------|
| **3D Renderer** | Three.js + WebGPU | MIT | Character rendering, hatch animation, orb mode | Babylon.js |
| **VRM Support** | @pixiv/three-vrm | MIT | Character model format, blendshapes, animation | Custom GLB |
| **Desktop Shell** | Tauri v2 | Apache 2.0 | Transparent window, always-on-top, system tray, click-through | Electron (heavier) |
| **TUI Framework** | Ratatui | MIT | Terminal UI, 7-panel layout, widgets | Textual (Python) |
| **Wake Word** | OpenWakeWord | Apache 2.0 | "Amica" detection, on-device, <50ms | Porcupine (proprietary) |
| **ASR** | Whisper.cpp | MIT | Speech-to-text, local, GGUF quantized | Whisper (OpenAI API) |
| **VAD** | Silero VAD | MIT | Voice activity detection, reduces false triggers | WebRTC VAD |
| **TTS** | Chatterbox TTS | Open | Zero-shot voice clone, emotional control | Coqui TTS, Piper |
| **Facial Animation** | Audio2Face-3D SDK | MIT | 52 ARKit blendshapes, lip sync | Live2D |
| **LLM (Local)** | Nemotron 2B-8B (via Ollama) | Commercial | Reasoning, tool calling, on-device | Qwen3.5, Phi-4 |
| **MoE Gating** | DistilBERT (fine-tuned) | Apache 2.0 | Intent classification, <50ms | Custom tiny transformer |
| **Agent Orchestration** | LangGraph | MIT | Multi-step workflow routing, state management | Temporal |
| **MCP Protocol** | modelcontextprotocol | Standard | Tool calling, 97M SDK downloads | A2A, ACP |
| **Memory (Short)** | Redis | BSD | Session state, vitals, recent context | KeyDB |
| **Memory (Long)** | pgvector | PostgreSQL | Semantic search, conversation history | Qdrant |
| **Knowledge Graph** | Neo4j Community | GPL | Relationship mapping, insights | Memgraph |
| **Audit Trail** | OpenChronicle | Custom | Hash-chained logs, Solana attestation | Custom SQLite |
| **Blockchain** | Solana | Open | SBTs, MEOK token, POAI registry | Ethereum L2 |
| **Workflow Engine** | Temporal | MIT | Durable execution, crash recovery | LangGraph |
| **Storage** | SeaweedFS | Apache 2.0 | S3-compatible object storage | MinIO |
| **Observability** | Langfuse | MIT | Agent tracing, session replay | Braintrust |

---

## 9. Implementation Roadmap: 12 Weeks to MVP

### Phase 1: Foundation (Weeks 1-3)

| Week | Deliverable | Key Tasks |
|------|-------------|-----------|
| **1** | Tauri scaffold + 3D viewport | Set up Tauri v2 with transparent window, integrate Three.js, load first archetype GLB |
| **2** | Hatch sequence v1 | Implement egg shader (vertex displacement + crack fragment), 6-stage animation timeline |
| **3** | Voice pipeline core | Integrate OpenWakeWord, Whisper.cpp, Chatterbox TTS — basic "Amica, hello" → response |

### Phase 2: Intelligence (Weeks 4-6)

| Week | Deliverable | Key Tasks |
|------|-------------|-----------|
| **4** | MoE gating + 7 experts | Train intent classifier, implement 7 archetype expert prompts, basic routing |
| **5** | SOV3 MCP integration | Connect 7 experts to relevant SOV3 generals via MCP, first cross-system command |
| **6** | TUI v1 (Ratatui) | Implement 7-panel layout, archetype switching, basic widget rendering |

### Phase 3: Personality (Weeks 7-9)

| Week | Deliverable | Key Tasks |
|------|-------------|-----------|
| **7** | Tamagotchi core | Integrate tama-core Rust lib, 5 vital stats, real-time ticking, persistence |
| **8** | Evolution system | 6 life stages, care-quality-based variants, visual transformations |
| **9** | Personality DNA | Big Five tracking, interaction-based mutation, OpenChronicle logging |

### Phase 4: Polish (Weeks 10-12)

| Week | Deliverable | Key Tasks |
|------|-------------|-----------|
| **10** | Display states | Full → Compact → Orb → Ambient animations, voice triggers, click handlers |
| **11** | Audio2Face-3D | Lip sync integration, emotional expression mapping, 52 blendshape driving |
| **12** | Beta launch | Closed beta with 50 users, feedback loop, bug fixes, performance optimization |

---

## 10. The Competitive Landscape: Why MEOKAI OS Wins

| Competitor | What They Have | What MEOKAI OS Has That They Don't |
|-----------|---------------|-----------------------------------|
| **Razer AVA** [^60^][^61^] | 3D hologram, agentic workflows, 5 characters | Open source (AVA is proprietary), 7 Jungian archetypes (not generic), SOV3 swarm backend, Tamagotchi evolution, MEOK token economy, TUI OS |
| **Amica** [^87^][^92^] | Open-source 3D companion, VRM, Whisper, TTS | Tamagotchi mechanics, TUI OS, SOV3 integration, MoE routing, 7 archetypes (not generic VRM), blockchain certification |
| **tama96** [^68^] | Tamagotchi virtual pet, Rust core, Tauri | 3D characters (not pixel art), voice control, LLM-powered personality, SOV3 swarm, professional OS |
| **Tamago AI** [^73^] | LLM-powered pet, evolution, Electron | Tauri (lighter), TUI OS, SOV3 backend, 7 archetypes, voice pipeline, blockchain |
| **Character.AI** | Conversational AI characters | Desktop presence (not web-only), voice interaction, system integration, open source, safety certification |
| **Replika** | AI companion app | Desktop OS (not mobile-only), 3D presence, TUI productivity, SOV3 swarm, token economy, no engagement addiction design |

The moat is the **combination** — no other project in 2026 combines 3D presence, voice control, Tamagotchi evolution, TUI productivity, MoE routing, SOV3 swarm intelligence, and blockchain certification in a single open-source package.

---

## 11. Conclusion: The Living Operating System

MEOKAI OS is not a product. It is a **relationship** — between a human and an AI that lives on their desktop, evolves with their care, speaks with their voice, and thinks with their swarm. The hatch sequence creates emotional attachment in the first 150 seconds. The voice pipeline makes every interaction feel natural and immediate. The Tamagotchi mechanics transform a tool into a companion that the user genuinely cares about. The TUI provides serious productivity for serious work. The 3D character's four display states adapt to every context from active collaboration to passive presence. The MoE + multi-agent architecture ensures that every request is handled by the right intelligence with the right personality. And the SOV3 swarm provides backend capabilities that no other desktop companion can match — 47 generals managing 25 domains, all accessible through a single voice command.

The user says: *"Amica, open browser."* It opens. *"Amica, minimize."* It becomes an orb. *"Amica, wake up."* It returns, remembering everything. This is the future of human-computer interaction — not a chat window, not a command line, but a **sovereign companion** that hatches, evolves, and grows alongside its user.
