# Dimension 4: Spatial Audio, Immersion & XR Pathway

## Research Brief: Immersive Experience Layer for Agent-47

**Date**: July 2025
**Searches Conducted**: 18 independent queries across web search and academic sources
**Sources**: MDN Web Docs, W3C Specifications, Stanford VHIL, Springer Virtual Reality, ACM Digital Library, IEEE TVCG, Meta Developer Docs, Apple WebKit Blog, Immersive Web Working Group

---

## Executive Summary

This research brief designs the immersive experience layer for Agent-47, a browser-based 3D world featuring 47 voiced agents across 5 hive districts. The architecture covers: (1) **Spatial Audio** using Web Audio API with HRTF-based PannerNode, supporting positional agent voices and ambient soundscapes; (2) **WebXR Integration Pathway** with progressive enhancement from desktop to Meta Quest to Apple Vision Pro; (3) **Presence Techniques** grounded in VR proxemics research showing 160% larger interpersonal distances in VR and the critical importance of eye contact and two-step gaze behaviors; (4) **Diegetic UI Design** centered on the evidence-backed wristwatch interface pattern; (5) **Flow State Optimization** through focused immersion and curiosity-driven design; and (6) **Cross-Platform Interaction Paradigms** spanning controller-based, hand-tracking, and multimodal input across three evolutionary stages of XR interaction (2016-2024).

The WebGPU-WebXR binding became experimentally available in Chrome 135+ (March 2025) [^544^], enabling next-generation rendering. Spatial audio increases presence significantly -- the PannerNode uses IRCAM Listen HRTF database-derived convolution kernels at 256 samples, 44.1kHz [^528^]. The optimal conversational distance in VR follows Hall's proxemics: intimate (0-46cm), personal (46cm-1.2m), social (1.2-3.7m), public (3.7-7.6m) [^547^], but VR distances average ~160% of physical equivalents [^547^].

---

## Table of Contents

1. [Spatial Audio Architecture](#1-spatial-audio-architecture)
2. [VR/AR Integration Pathway](#2-vrar-integration-pathway)
3. [Presence Techniques](#3-presence-techniques)
4. [Diegetic UI Design](#4-diegetic-ui-design)
5. [Flow State Optimization](#5-flow-state-optimization)
6. [Cross-Platform Interaction Paradigms](#6-cross-platform-interaction-paradigms)
7. [CSOAI-Specific Integration](#7-csoai-specific-integration)
8. [Implementation Recommendations](#8-implementation-recommendations)

---

## 1. Spatial Audio Architecture

### 1.1 Web Audio API Foundation

The Web Audio API (WAA) provides the foundational spatialization capabilities through the `PannerNode` interface. As specified in Web Audio API 1.1 (W3C, November 2024) [^529^]:

**Core Spatialization Features:**
- **Panning Models**: `equalpower` (default, efficient) and `HRTF` (higher quality, binaural convolution)
- **Distance Attenuation**: `linear`, `inverse`, or `exponential` distance models
- **Sound Cones**: Directional audio with `coneInnerAngle`, `coneOuterAngle`, `coneOuterGain`
- **Source/Listener Model**: `AudioListener` represents the user; `PannerNode` represents sound sources

**HRTF Implementation Details:**
The Chrome implementation uses FFT-based convolution with HRTF kernels derived from the IRCAM Listen HRTF Database through averaging and truncation to 256 samples at 44.1kHz sampling rate (dubbed "IRC_Composite") [^528^]. When source position changes, delay lines and convolver kernels update with 20ms smoothing interpolation and 45ms linear crossfade transitions [^528^].

**Code Pattern - Basic PannerNode Setup:**
```javascript
const audioCtx = new AudioContext();
const listener = audioCtx.listener;

// Set listener position and orientation
listener.positionX.value = x;
listener.positionY.value = y;
listener.positionZ.value = z;
listener.forwardX.value = 0;
listener.forwardY.value = 0;
listener.forwardZ.value = -1;
listener.upX.value = 0;
listener.upY.value = 1;
listener.upZ.value = 0;

// Create HRTF-based panner
const panner = new PannerNode(audioCtx, {
  panningModel: "HRTF",
  distanceModel: "inverse",
  positionX: sourceX,
  positionY: sourceY,
  positionZ: sourceZ,
  orientationX: 0,
  orientationY: 0,
  orientationZ: -1,
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0
});
```
[^524^]

### 1.2 Spatial Audio Libraries Comparison

A comprehensive comparison by Turchet et al. [^517^] evaluated six major tools for WebXR spatial audio:

| Feature | WAA PannerNode | GRAOAF | jsAmbisonics | 3DTIT JSW | Atmoky WebSDK | Superpowered |
|---------|---------------|--------|--------------|-----------|---------------|--------------|
| Real-time mic input | Yes | Yes | Yes | No | Yes | Yes |
| Reverberation | Via ConvolverNode | Yes (algorithmic) | Via ConvolverNode | No | Yes (algorithmic) | Yes |
| Sound scene rotation | Via WebXR | Via A-Frame | SceneRotator class | No | setRotation() | Yes |
| Individualized HRTFs | No | No | Yes (SOFA/JSON) | Yes (SOFA/JSON) | No | No |
| Externalizer | No | No | No | No | Yes | No |
| License | MIT | MIT | BSD-3 | Open | Commercial | Commercial |

[^517^]

**Recommended Stack for Agent-47:**

1. **Primary: Web Audio API PannerNode (native)**
   - Zero dependencies, universal browser support
   - HRTF panning built-in
   - Direct integration with Three.js `PositionalAudio`
   - Suitable for up to ~50 simultaneous positional sources (47 agents + ambient)

2. **Enhanced: Atmoky WebSDK** (for premium experience tier)
   - WebAssembly-optimized performance
   - "Externalizer" parameter for out-of-head localization
   - Algorithmic reverberation with per-source reverb send levels
   - A-Frame and Three.js components available
   - Free tier available for development [^586^]

3. **Alternative: jsAmbisonics** (for advanced spatial processing)
   - Supports higher-order Ambisonics (HOA)
   - Individualized HRTF loading via SOFA files
   - Best for research-grade spatial fidelity [^586^]

### 1.3 Three.js Positional Audio Integration

Three.js provides a clean abstraction over the Web Audio API:

```javascript
// Create listener (attached to camera)
const listener = new THREE.AudioListener();
camera.add(listener);

// Create positional audio for an agent
const agentSound = new THREE.PositionalAudio(listener);
agentSound.setBuffer(agentVoiceBuffer);
agentSound.setRefDistance(3);      // Volume reference distance
agentSound.setRolloffFactor(1);     // How fast volume drops off
agentSound.setDistanceModel('inverse');
agentSound.setLoop(false);

// Attach to agent mesh
agentMesh.add(agentSound);

// Tone.js integration for synthesized agent voices
Tone.setContext(agentSound.context);
const synth = new Tone.Oscillator(440, "sine");
agentSound.setNodeSource(synth);
```
[^632^] [^634^]

### 1.4 Howler.js Spatial Plugin

Howler.js provides a modular spatial audio plugin (7KB gzipped total) [^512^]:

```javascript
// Howler spatial setup
const sound = new Howl({
  src: ['voice.webm', 'voice.mp3'],
  stereo: 0,           // Stereo panning (-1.0 to 1.0)
  pos: [x, y, z],      // 3D position
  pannerAttr: {
    coneInnerAngle: 360,
    coneOuterAngle: 360,
    coneOuterGain: 0,
    distanceModel: 'inverse',
    maxDistance: 10000,
    refDistance: 1,
    rolloffFactor: 1,
    panningModel: 'HRTF'
  }
});

// Global listener position
Howler.pos(x, y, z);
Howler.orientation(frontX, frontY, frontZ, upX, upY, upZ);
```
[^512^] [^514^]

### 1.5 Procedural Audio & Ambient Soundscapes

**Generative Soundscape Architecture:**

| Layer | Purpose | Implementation |
|-------|---------|----------------|
| District ambience | Environmental identity | Looping samples + generative drones |
| Agent voice themes | Personality sonification | Tone.js synth per agent |
| Pheromone audio | Data sonification | Parameter-mapped generative audio |
| Interaction sounds | Feedback/affordance | Triggered one-shots with spatial position |
| Background music | Emotional framing | Procedural chord progressions |

**Data Sonification for Pheromone System:**
Following the "bad data sounds worse" model from generative sonification research [^638^], pheromone values can be mapped to audio parameters:
- **Pheromone concentration** -> Filter cutoff frequency (higher = brighter)
- **Pheromone decay rate** -> Reverb decay time
- **Pheromone type (5 districts)** -> Musical interval / chord quality
- **Multiple overlapping pheromones** -> Polyphonic texture density

The Birds Music project demonstrates WebGPU-powered procedural audio with Tone.js, featuring five selectable soundscapes with different chord progressions, tempos, and synth textures [^548^].

**Implementation Pattern:**
```javascript
// District ambient layer
const districtAmbience = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: "fatsawtooth" },
  envelope: { attack: 2, decay: 1, sustain: 0.5, release: 3 }
}).toDestination();

// Pheromone sonification mapping
function sonifyPheromone(pheromone) {
  const cutoff = map(pheromone.concentration, 0, 1, 200, 5000);
  const reverbTime = map(pheromone.decay, 0, 1, 0.5, 10);
  filter.frequency.rampTo(cutoff, 0.1);
  reverb.decay = reverbTime;
}
```

### 1.6 Performance Considerations

| Metric | Value | Source |
|--------|-------|--------|
| HRTF convolution latency | ~2.9ms (half of 256-sample FFT at 44.1kHz) | [^528^] |
| Position update smoothing | 20ms delay interpolation | [^528^] |
| Crossfade transition | 45ms | [^528^] |
| Max simultaneous voices | ~50-100 (platform dependent) | Industry estimate |
| AudioContext auto-suspend | 30s idle timeout (configurable in Howler) | [^515^] |

**Key Optimization**: Use a crossover filter (e.g., 200Hz cutoff) to avoid spatializing low frequencies, which are non-directional by nature [^535^].

---

## 2. VR/AR Integration Pathway

### 2.1 WebXR Device API Overview

WebXR is the W3C-standard JavaScript API for rendering VR/AR experiences in browsers. It replaces the deprecated WebVR API and uses WebGL or WebGPU as its rendering backend [^523^]. Frameworks like Three.js, Babylon.js, and A-Frame build directly on top of it.

### 2.2 Browser Support Matrix (2025)

| Browser | WebXR Support | Notes |
|---------|--------------|-------|
| Chrome 79+ | Full (desktop + Android) | Most complete feature set |
| Edge 79+ | Full | Mirrors Chrome via Chromium |
| Opera 66+ | Full | Chromium-based |
| Samsung Internet 12+ | Full | Galaxy optimizations |
| Meta Quest Browser | Full | Hand tracking, passthrough, depth sensing |
| Safari (visionOS 2.0+) | VR only | WebXR enabled by default; AR module not yet supported |
| Firefox | No support | Implementation paused after Firefox Reality discontinued |
| Safari (macOS/iOS) | No support | No public roadmap |

[^523^] [^530^] [^533^] [^531^]

### 2.3 Apple Vision Pro Integration

**Key Capabilities (visionOS 2.0+):**
- WebXR enabled by default (no feature flags required) [^545^]
- Supports `immersive-vr` sessions
- Transient-pointer input mode (eye gaze + pinch) [^546^]
- Hand tracking via `hand-tracking` feature descriptor
- Mac Virtual Display support for live development [^545^]

**Important Limitation:**
- WebXR Augmented Reality Module (`immersive-ar`) is **NOT** exposed on visionOS [^545^] [^541^]
- For passthrough/passthrough content on Vision Pro, alternative approaches (USDZ/QuickLook) are required [^541^]

**Transient Pointer Input Pattern:**
```javascript
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['hand-tracking'],
  optionalFeatures: ['transient-pointer']  // Vision Pro gaze+pinch
});

// Transient-pointer inputs appear in inputSources
// Hand joint inputs appear first (if hand-tracking granted)
// Transient-pointer inputs appear after hand inputs
```
[^546^]

### 2.4 Meta Quest Integration

**Supported WebXR Specifications:**
- WebXR Device API (VR sessions)
- WebXR Augmented Reality Module (passthrough via `immersive-ar`)
- WebXR Hand Input Module
- WebXR Plane Detection Module
- WebXR Anchors Module
- Passthrough: Color on Quest 3/Pro, grayscale on Quest 2 [^550^]

**Quest-Specific Capabilities:**
```javascript
// Detect passthrough support
navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
  if (supported) {
    // Enable AR passthrough
  }
});

// Request AR session with plane detection
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: ['plane-detection', 'anchors', 'hand-tracking']
});
```
[^550^] [^542^]

### 2.5 WebGPU-WebXR Binding (Experimental)

**Status**: Available in Chrome Canary 135+ (March 2025) [^544^]

This is a critical future capability for Agent-47's WebGPU-based rendering:

```javascript
// Enable in Chrome: 
// chrome://flags -> "WebXR Projection Layers" + "WebXR/WebGPU Bindings"

// Future WebGPU + WebXR usage
const xrGpuBinding = new XRGPUBinding(session, device);
const projectionLayer = xrGpuBinding.createProjectionLayer({
  colorFormat: 'rgba8unorm',
  depthFormat: 'depth24plus',
  scaleFactor: 1.0
});
```

**Current Limitations:**
- Only `XRProjectionLayer` implemented (no Quad/Cube/Equirect layers yet)
- At least one internal texture copy exists (optimization opportunity)
- Not necessarily an automatic performance win vs WebGL at this stage [^544^]

### 2.6 WebXR Layers API

The WebXR Layers API provides composition layers for improved performance and visual fidelity [^605^]:

| Layer Type | Purpose | Key Benefit |
|-----------|---------|-------------|
| `XRProjectionLayer` | Main scene rendering | Fixed foveated rendering support |
| `XRQuadLayer` | UI panels, 2D content | Compositor-managed, no judder |
| `XRCylinderLayer` | Curved UI, wraparound panels | Immersive large displays |
| `XRCubeLayer` | Static backgrounds (cubemaps) | Render once, display continuously |
| `XREquirectLayer` | 360-degree content | Optimized panoramic video |

**Benefits over traditional WebGL rendering:**
- **Performance**: Compositor renders at native refresh rate (72Hz/90Hz/120Hz) even if app drops frames [^612^]
- **Visual fidelity**: Single sampling vs double sampling in WebGL pipeline [^612^]
- **Battery life**: Reduced memory copies [^612^]
- **Latency**: Late HMD pose sampling with reprojection [^612^]

```javascript
// Create XRWebGLBinding
const xrGlBinding = new XRWebGLBinding(session, gl);

// Create quad layer for agent command UI
const quadLayer = xrGlBinding.createQuadLayer({
  space: xrReferenceSpace,
  viewPixelWidth: 1024,
  viewPixelHeight: 768,
  layout: "mono"
});
quadLayer.transform = new XRRigidTransform({z: -2});
quadLayer.width = 1.5;
quadLayer.height = 1.0;

// Update render state with layers
session.updateRenderState({ layers: [projectionLayer, quadLayer] });
```
[^611^] [^612^]

### 2.7 Progressive Enhancement Strategy

```
Desktop (WebGL/WebGPU) → Mobile (3D touch) → VR Headset (WebXR) → AR Headset (WebXR + passthrough)
     |                        |                      |                           |
  2D HUD                  Gyro look              Full immersion         Mixed reality
  Mouse/keyboard          Touch controls         Hand/controllers       Gaze+pinch / hands
  Stereo panning          Headphone spatial      Full HRTF spatial      Spatial + passthrough
```

---

## 3. Presence Techniques

### 3.1 Proxemics in VR

Hall's proxemic zones [^547^] provide the foundational framework for spatial design:

| Zone | Physical Distance | VR Equivalent (~160%) | Use Case for Agent-47 |
|------|------------------|----------------------|----------------------|
| Intimate | 0 - 46cm | 0 - 74cm | Direct agent command, close interaction |
| Personal | 46cm - 1.2m | 74cm - 1.9m | Default conversational distance |
| Social | 1.2m - 3.7m | 1.9m - 5.9m | Group observation, district overview |
| Public | 3.7m - 7.6m | 5.9m - 12.2m | Surveillance/overview mode |

[^547^]

**Key Research Findings:**
- VR proxemic distances average **160% larger** than physical space (145% for intimate, 205% for personal, 165% for social) [^547^]
- Direct contact occurs **260% more often** in VR than physical space [^547^]
- Desktop PC participants occupy intimate-to-personal distances, while HMD participants maintain personal-to-social distances [^549^]
- Teleportation leads to closer proximity to agents than natural walking [^551^]

**Implications for Agent-47:**
- Position agents at ~1.9m default distance for comfortable social interaction
- Allow users to approach to ~0.75m for intimate command interactions
- Audio attenuation should follow inverse model (natural cocktail party effect) [^549^]

### 3.2 Eye Contact and Gaze Behavior

**Critical Research Findings:**

1. **Two-step gaze is preferred**: A two-step looking behavior (e.g., face-first, then hand) was perceived as more human-like, more natural, and more likable than one-step [^633^]

2. **Eye contact is fundamental**: Face-looking behavior (eye contact) was preferred over hand-looking regardless of approach direction (within or outside field of view) [^633^]

3. **Social norms persist in VR**: Participants avoided direct contact with virtual agents and gave them personal space, respecting norms more for agents with realistic gaze behaviors (blinking, head-turning) [^587^]

4. **Gaze-aware agents increase immersion**: Virtual agents that respond to user gaze (showing discomfort when stared at, acknowledging attention) significantly outperformed HMD-direction-based models in rapport and story perception [^589^]

5. **Gaze pattern identification**: Individual gaze patterns during conversation can be identified with 95.5% accuracy, suggesting gaze is a deeply personal behavioral signature [^591^]

**Implementation for Agent-47:**
```javascript
// Agent gaze behavior system
class AgentGazeBehavior {
  update(userHeadPosition, userGazeDirection) {
    const toUser = userHeadPosition.clone().sub(this.agentPosition);
    const distance = toUser.length();
    const gazeDot = toUser.normalize().dot(userGazeDirection);
    
    // Detect if user is looking at agent
    const isUserLooking = gazeDot > 0.85 && distance < 5.0;
    
    if (isUserLooking) {
      this.lookAtUser(userHeadPosition);
      this.acknowledgeGaze();
      
      // Prolonged gaze -> agent shows mild discomfort (realistic social behavior)
      if (this.gazeDuration > 3000) {
        this.playAvertedGaze();
      }
    } else {
      // Return to idle gaze pattern
      this.idleGazeWander();
    }
  }
}
```

### 3.3 Avatar Design: Stylized vs. Realistic

**Research Consensus:**

| Factor | Stylized/Cartoon | Realistic | Recommendation |
|--------|-----------------|-----------|----------------|
| Uncanny valley risk | Low | High | Stylized for Agent-47 |
| Co-presence | Comparable or better | Risk of negative UV | Stylized preferred |
| Emotional safety | Higher | Lower | Critical for therapy/connection contexts |
| Embodiment | Good | Can be higher if perfect | Stylized sufficient |
| Social presence | Good | Can be higher if perfect | Stylized avoids risk |

[^525^] [^536^]

**Key Studies:**
- Stylized avatars reduce uncanny valley effects while fostering user connection [^525^]
- "I don't recommend realistic avatars as much. I think the more cartoonish appeal is better" - participant feedback [^525^]
- No significant difference in social presence between realistic and cartoon avatars in some studies, but stylized avoids the risk of falling into uncanny valley [^536^]
- Avatar-owner resemblance is important; stylized avatars with customization options perform well [^525^]

**Agent-47 Recommendation**: Use stylized, humanoid-but-not-photorealistic avatars with district-themed visual customization. Each agent should have distinct visual personality while maintaining a cohesive stylized aesthetic.

### 3.4 Micro-Expressions and Non-Verbal Cues

**Research on Avatar Responsiveness:**
- People respond more socially to visually responsive agents, even without verbal interaction [^587^]
- Aligning visual and behavioral realism is critical for communication quality [^587^]
- Agents with blinking + head-turning gaze behaviors elicited stronger social norm adherence than static or blinking-only agents [^587^]

**Recommended Non-Verbal Behavior Set:**
1. **Blinking**: Periodic, naturalistic (not mechanical)
2. **Head nod**: During user speech (acknowledgment)
3. **Saccadic eye movements**: Small, rapid eye movements during idle
4. **Gaze aversion**: When thinking or when user gazes too long
5. **Posture shifts**: Subtle weight transfer animation
6. **Micro-expressions**: Brief eyebrow raise on agent name mention

---

## 4. Diegetic UI Design

### 4.1 The Wristwatch Pattern (Evidence-Backed)

A landmark study by Koehle et al. (LMU Munich, 2021) compared three health interface types in VR [^513^]:

**Results:**
- **Overlay** (non-diegetic HUD): Median 7/10. Best for competitive multiplayer. Intrusive, hurts immersion.
- **Wristwatch** (diegetic): Median 7/10. Best for single-player and story-driven games. "Most well-rounded and most liked."
- **Physical** (movement-based): Median 6/10. Best for story-driven. Impractical during intense action.

**Key finding**: The wristwatch was rated significantly higher on "Sensory and Imaginative Immersion" than the overlay (GEQ: T=192.50, z=-3.31, p=.001) [^513^].

**Wristwatch Strengths:**
- Clear and accurate information display (10/37 participants)
- Immersive (9/37)
- Unobtrusive (8/37)
- Blends well into VR action (7/37)

**Weakness:** Impractical during intense action (8/37); must actively check (8/37) [^513^]

### 4.2 Diegetic UI for Agent-47

Based on the wristwatch evidence and CSOAI's 2D HUD plans, the recommended approach:

**Primary: Diegetic Wristwatch UI**
- Agent 47 command interface on virtual wristwatch
- Activated by looking at wrist + gesture
- Displays: active agent status, district pheromone levels, available commands
- Haptic feedback (controller vibration) on menu open

**Secondary: Diegetic Environment UI**
- Pheromone trails visible as glowing floor patterns
- Agent status shown via avatar posture/color changes
- District identity through ambient audio and environmental theming

**Tertiary: Contextual Projection**
- Non-diegetic elements only when necessary
- Semi-transparent overlay for critical alerts
- Fades out after acknowledgment

### 4.3 Diegetic Menu Design Patterns

From Boneworks and Half-Life: Alyx [^518^]:
- Physical wristwatch with digital display
- Holographic projected panels (diegetic to the world)
- Environment-integrated displays (e.g., wall-mounted status boards)
- Object-based interaction (picking up and manipulating physical UI objects)

---

## 5. Flow State Optimization

### 5.1 Flow in VR: Research Evidence

Research on VR tourism and well-being identified key factors affecting presence and flow [^640^]:

| Factor | Effect on Presence | Significance |
|--------|-------------------|--------------|
| **Control** | Strong positive (beta=0.465, p<0.001) | Most important factor |
| **Curiosity** | Positive (beta=0.290, p<0.05) | Drives exploration |
| **Focused immersion** | Positive (beta=0.267, p<0.05) | Deep engagement |
| **Vividness** | Positive (beta=0.240, p<0.05) | Visual/audio quality |
| **Effectiveness** | Not significant (p>0.05) | Functional quality alone insufficient |

[^640^]

**Combined factors account for 44% of presence variation** [^640^].

### 5.2 Flow Optimization Strategies for Agent-47

1. **Clear goals at every level**: Agent commands, district exploration objectives, hive-wide emergent behaviors
2. **Immediate feedback**: Audio-visual confirmation for every action
3. **Challenge-skill balance**: Adaptive agent complexity based on user proficiency
4. **Sense of control**: Full agency over agent commands, environment navigation
5. **Curiosity-driven discovery**: Hidden agent behaviors, emergent hive patterns
6. **Focused immersion**: Minimize non-diegetic distractions; everything in-world

---

## 6. Cross-Platform Interaction Paradigms

### 6.1 Three Stages of XR Interaction Evolution (2016-2024)

A comprehensive chronological review of 46 user studies revealed three distinct stages [^588^]:

**Stage 1: Controller-Dominant (2016-2018)**
- Devices: HTC Vive, Oculus Rift
- Primary: Raycasting, direct controller input, touch-based
- Characteristics: Point-and-select paradigm, discrete interaction

**Stage 2: Natural Input Transition (2019-2021)**
- Devices: Oculus Quest, HoloLens 2, Hand Tracking SDK
- Primary: Hand tracking, gaze-based, transitional
- Characteristics: Controller-free input, natural gestures

**Stage 3: Multimodal Expansion (2022-2024)**
- Devices: Meta Quest Pro, Apple Vision Pro
- Primary: Hand + eye + voice, wrist rotation, multimodal
- Characteristics: Sensor fusion, context-adaptive interaction

[^588^]

### 6.2 Device-Specific Input Modalities

| Device | Input Modalities | Best For |
|--------|-----------------|----------|
| Desktop | Mouse + keyboard | Development, 2D fallback |
| Mobile | Touch + gyro | On-the-go observation |
| Meta Quest 3 | Controllers + hand tracking + passthrough | Full immersion, mixed reality |
| Apple Vision Pro | Eye gaze + pinch + hand tracking | Natural input, premium UX |
| HoloLens 2 | Hand gestures + wrist rotation | Enterprise AR |

### 6.3 Input Frequency Analysis (Across 46 Studies)

| Input Modality | Frequency | Trend |
|---------------|-----------|-------|
| Hand tracking | Most frequent | Increasing |
| Raycasting | Very frequent | Stable |
| Direct controller | Very frequent | Decreasing |
| Touch-based | Moderate | Stable |
| Eye/gaze-based | Less common | Rapidly increasing |
| Multimodal | Emerging | Increasing |
| Wrist rotation | Least frequent | Niche |

[^588^]

### 6.4 Correspondence Analysis: Device-Input Associations

The statistical analysis (chi-square=38.73, df=24, p=0.029) confirms significant association between devices and input modalities [^588^]:

- **Vive/Rift** cluster near raycasting and direct controller input
- **Oculus Quest** near hand tracking and direct controller
- **HoloLens 2** near wrist rotation and spatial touch
- **Meta Quest Pro** near eye/gaze input, hand tracking, multimodal

### 6.5 Recommended Interaction Design for Agent-47

**Universal Design Principles:**
1. **Primary: Gaze-based selection** (all platforms)
2. **Secondary: Hand/controller confirmation** (platform-dependent)
3. **Voice commands** for agent control (accessibility + immersion)
4. **Progressive disclosure**: Simple interactions default, complex available

**Platform-Specific Mappings:**

```
Desktop:        Mouse hover + click, keyboard shortcuts
Mobile:         Touch to select, pinch to zoom, gyro to look
Quest (VR):     Hand tracking pinch to select, controller trigger
Quest (MR):     Hand + passthrough spatial anchors
Vision Pro:     Eye gaze to select, finger pinch to confirm
```

---

## 7. CSOAI-Specific Integration

### 7.1 Audio Architecture for 47 Agents

**Spatial Voice System:**
- Each agent has a `THREE.PositionalAudio` node attached to its avatar
- Voices positioned at agent head location
- Ref distance: 3m (social conversation range)
- Rolloff: inverse model for natural falloff
- Max concurrent voices: ~10 (priority-based mixing)

**Voice Priority Algorithm:**
```javascript
function calculateVoicePriority(agent, listener) {
  const distance = agent.position.distanceTo(listener.position);
  const isSpeaking = agent.isSpeaking;
  const isLookedAt = agent.isGazedAt;
  
  let priority = 0;
  if (isSpeaking) priority += 100;
  if (isLookedAt) priority += 50;
  priority += (100 - Math.min(distance, 100)); // Closer = higher
  
  return priority;
}
```

### 7.2 Pheromone Audio Representation

The pheromone system can be sonified as an ambient spatial layer:

| Pheromone Property | Audio Mapping | Perceptual Effect |
|-------------------|---------------|-------------------|
| Concentration (0-1) | Filter cutoff (200Hz-5kHz) | Brighter = stronger signal |
| Decay rate | Reverb decay time | Lingering presence |
| District ID (1-5) | Root note (pentatonic scale) | Musical identity per district |
| Overlap count | Polyphonic voices | Richer texture = more activity |
| Direction from user | Spatial pan position | Walk toward sound = follow trail |

### 7.3 5 Hive District Soundscape Design

| District | Ambient Character | Key | Rhythmic Texture |
|----------|------------------|-----|-----------------|
| District 1 (Core) | Machine hum, electrical | C minor | Steady 4/4 pulse |
| District 2 (Growth) | Organic, nature sounds | D major | Flowing, irregular |
| District 3 (Data) | Digital glitch, beeps | E phrygian | Staccato, quantized |
| District 4 (Defense) | Low drones, rumble | F minor | Slow, heavy |
| District 5 (Chaos) | Dissonant, unpredictable | Atonal | Random, aleatoric |

### 7.4 Agent 47 Command Interface in XR

**Diegetic Implementation:**
- Virtual wristwatch appears when user looks at wrist
- Displays: Agent 47 status, command history, available actions
- Spatial arrangement: Command options orbit the wristwatch
- Selection: Gaze + pinch (Vision Pro) or hand ray + pinch (Quest)

### 7.5 Transition from 2D HUD to Diegetic UI

| 2D HUD Element | Diegetic Replacement | Implementation |
|---------------|---------------------|----------------|
| Health/status bar | Avatar posture + color tint | Shader-based |
| Minimap | Environmental landmarks + audio cues | Spatial audio beacons |
| Action buttons | Hand gesture recognition | WebXR hand tracking |
| Text chat | Voice synthesis + spatial positioning | TTS + PositionalAudio |
| Notifications | Haptic pulse + audio chime | Controller/actuator API |

---

## 8. Implementation Recommendations

### 8.1 Phase 1: Spatial Audio Foundation (Immediate)

1. Implement Web Audio API PannerNode for all 47 agent voices
2. Create district ambient soundscape system
3. Add pheromone sonification layer
4. Integrate with Three.js PositionalAudio

**Dependencies**: None (native browser APIs)
**Effort**: 2-3 weeks
**Impact**: High (fundamental immersion improvement)

### 8.2 Phase 2: WebXR VR Support (Short-term)

1. Add WebXR session management (`immersive-vr`)
2. Implement hand tracking + controller support
3. Create diegetic wristwatch UI
4. Optimize performance for headset targets (72-90fps)

**Dependencies**: Phase 1, WebGPU rendering pipeline
**Effort**: 4-6 weeks
**Impact**: High (enables full VR immersion)

### 8.3 Phase 3: WebGPU-WebXR Integration (Medium-term)

1. Enable WebGPU-WebXR binding (Chrome 135+)
2. Migrate rendering pipeline to WebGPU in XR
3. Implement XR Layers for UI compositing
4. Enable multiview rendering for stereo optimization

**Dependencies**: Phase 2, WebGPU-WebXR browser support maturation
**Effort**: 3-4 weeks
**Impact**: Medium-High (performance + visual quality)

### 8.4 Phase 4: AR/MR Passthrough (Long-term)

1. Add `immersive-ar` session support (Quest first)
2. Implement plane detection for spatial anchors
3. Create passthrough-aware visual design
4. Apple Vision Pro passthrough via alternative path (USDZ)

**Dependencies**: Phase 2
**Effort**: 4-6 weeks
**Impact**: Medium (extends platform reach)

### 8.5 Technical Stack Summary

| Component | Recommended | Alternative |
|-----------|------------|-------------|
| Spatial audio | Web Audio API PannerNode | Atmoky WebSDK |
| Audio framework | Three.js PositionalAudio | Howler.js spatial |
| Procedural audio | Tone.js | Custom Web Audio graph |
| VR rendering | WebXR + WebGPU | WebXR + WebGL |
| XR framework | Three.js XR | A-Frame |
| UI compositing | WebXR Layers API | Inline WebGL rendering |
| Hand input | WebXR Hand Input | Controller emulation |

### 8.6 Browser Target Matrix

| Feature | Chrome/Edge | Quest Browser | Vision Pro | Firefox | Safari |
|---------|------------|---------------|------------|---------|--------|
| Spatial audio (WAA) | Full | Full | Full | Full | Full |
| WebXR VR | Full | Full | Full | No | visionOS only |
| WebXR AR | Full | Full | No | No | No |
| WebGPU | Full | Full | No | No | No |
| WebGPU-WebXR | Chrome 135+ | Future | No | No | No |
| Hand tracking | Full | Full | Full | No | visionOS only |
| XR Layers | Chrome + flag | Full | No | No | No |

---

## Source Index

| Citation | Source | Authority |
|----------|--------|-----------|
| [^512^] | Howler.js GitHub / Documentation | High |
| [^513^] | Koehle et al., Diegetic Health Interfaces in VR, LMU Munich | High (Peer-reviewed) |
| [^514^] | howlerjs.com | High |
| [^517^] | Turchet et al., WebXR Spatial Audio Comparison | High (Academic) |
| [^523^] | TestMu AI, WebXR Browser Support Guide 2026 | Medium |
| [^524^] | MDN Web Docs, Web Audio Spatialization Basics | High |
| [^525^] | JMIR Formative Research, Avatar Customization in VR Therapy | High (Peer-reviewed) |
| [^528^] | Carpentier, Binaural Synthesis with Web Audio API, WAC 2015 | High (Academic) |
| [^529^] | W3C Web Audio API 1.1 Specification | High (Spec) |
| [^531^] | Can I use, WebXR Device API | High |
| [^533^] | Web Platform Features Explorer, WebXR | High |
| [^535^] | Code and Sound, HRTF Panner Node Implementation | Medium |
| [^536^] | Microsoft Research, Avatars in Mixed-Reality Meetings | High (Peer-reviewed) |
| [^540^] | WebXR Device API, MDN | High |
| [^541^] | Needle Engine XR Documentation | Medium |
| [^542^] | Lina Lopes, WebXR on Meta Quest 3 | Medium |
| [^544^] | Brandon Jones (Google), WebGPU in WebXR | High (Spec author) |
| [^545^] | UploadVR, visionOS 2 WebXR Support | Medium |
| [^546^] | Apple WebKit Blog, Natural Input for WebXR | High (Apple official) |
| [^547^] | Springer Virtual Reality, Proxemics in VR | High (Peer-reviewed) |
| [^548^] | Sonicviz, Birds Music Procedural Audio | Medium |
| [^549^] | CWI Amsterdam, Digital Proxemics | High (Academic) |
| [^550^] | Meta Developer Docs, Mixed Reality in Browser | High (Official) |
| [^551^] | IEEE TVCG, Navigation on Proxemics in IVE | High (Peer-reviewed) |
| [^586^] | Turchet et al., WebXR Spatial Audio Tools Comparison | High (Academic) |
| [^587^] | Stanford VHIL, Social Interaction in VR | High (Academic) |
| [^588^] | PMC, From Controllers to Multimodal Input | High (Peer-reviewed) |
| [^589^] | Virtual Gaze in VR, Academic Paper | Medium |
| [^591^] | Springer, Identifying VR Users by Eye Gaze | High (Peer-reviewed) |
| [^593^] | ScienceDirect, Eye Contact in VR Psychophysiology | High (Peer-reviewed) |
| [^605^] | W3C WebXR Layers API Level 1 | High (Spec) |
| [^611^] | Immersive Web, WebXR Layers Explainer | High (Spec) |
| [^612^] | A-Frame, layer component | Medium |
| [^632^] | Bitsrc, Three.js Positional Audio Tutorial | Medium |
| [^633^] | PMC, Evaluating Gaze Behaviors for Virtual Agents | High (Peer-reviewed) |
| [^638^] | ACM, Bridging Sound Art and Sonification | High (Peer-reviewed) |
| [^640^] | PMC, VR Tourism Flow State Study | High (Peer-reviewed) |

---

## Counter-Arguments and Limitations

1. **Stylized vs. realistic avatars**: While most evidence favors stylized, some studies find no significant difference or prefer realistic under certain conditions [^536^]. The choice should be validated with user testing.

2. **Diegetic UI efficiency**: The wristwatch requires active checking, which may be impractical during intense gameplay [^513^]. A hybrid approach (diegetic default, non-diegetic option for competitive play) may be optimal.

3. **WebXR browser support**: iOS/macOS Safari does not support WebXR, cutting off a significant user base [^523^]. A WebGL fallback is essential.

4. **WebGPU-WebXR binding**: Still experimental with known performance limitations (extra texture copy). Not yet a clear win over WebGL [^544^].

5. **VR proxemics variability**: The 160% distance increase varies by context (145% intimate to 205% personal) [^547^]. Default distances should be adjustable per-interaction-type.

6. **Individualized HRTFs**: The native PannerNode uses averaged HRTFs which may not be optimal for all users. Individualized HRTFs significantly increase presence but require per-user calibration [^517^].

---

*End of Research Brief*
