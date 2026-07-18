# Facet: Immersive Experience, Presence & Spatial Design

## CSOAI Agent-47 Research Brief — Wide Scan 04

**Date:** July 2025
**Scope:** Spatial audio, VR/AR integration, presence techniques, haptic feedback, cross-platform design, environmental storytelling, diegetic UI, flow state design, and social presence for a browser-based 3D world simulation.
**Method:** 15+ independent web searches across coarse-to-fine progression, tracing claims to primary sources where possible.

---

## Table of Contents

1. [Spatial Audio Design](#1-spatial-audio-design)
2. [VR/AR Integration](#2-vrar-integration)
3. [Presence Techniques](#3-presence-techniques)
4. [Haptic Feedback](#4-haptic-feedback)
5. [Cross-Platform Experience](#5-cross-platform-experience)
6. [Environmental Storytelling](#6-environmental-storytelling)
7. [Interface Design](#7-interface-design-diegetic--non-diegetic-ui)
8. [Flow State Design](#8-flow-state-design)
9. [Social Presence](#9-social-presence)
10. [Key Recommendations for Agent-47](#10-key-recommendations-for-agent-47)
11. [References](#11-references)

---

## 1. Spatial Audio Design

### 1.1 Web Audio API + HRTF: The Foundation

The Web Audio API (WAA) provides a `PannerNode` that enables 3D spatial audio positioning directly in the browser. It supports two distinct panning techniques: equal-power panning (default) and HRTF (Head-Related Transfer Function), which simulates how sound interacts with the human head, torso, and pinnae to create convincing 3D audio over headphones [^345^].

Key properties of the PannerNode include:
- **Panning Model**: `"HRTF"` uses a convolution-based binaural model; `"equalpower"` uses simpler stereo panning [^345^]
- **Cone Parameters**: `coneInnerAngle` and `coneOuterAngle` define directional sound emission patterns (e.g., 60deg inner cone at max gain, 90deg outer cone with gain reduced to 0.3) [^345^]
- **Distance Models**: `linear`, `inverse`, and `exponential` algorithms for volume attenuation over distance [^345^]
- **Max Distance / Ref Distance**: Default 10,000 units; reference distance for distance model calculation [^345^]

However, the native PannerNode has known quality limitations. Researchers note it "is not of the best quality and provides no way of choosing the Head-Related Transfer Function to use, which results in an effect that may not sound realistic for everyone" [^356^]. The ability to select individualized HRTFs is important because "individualized HRTFs are preferred since they can significantly increase the sense of presence in virtual environments" [^349^].

### 1.2 Advanced Spatial Audio Libraries & Tools

Several specialized libraries extend beyond the native PannerNode:

**jsAmbisonics** — JavaScript modules extending WAA for first-order and Higher-Order Ambisonics (HOA). Supports binaural decoding, scene rotation (yaw/pitch/roll), and loading individualized HRTFs via SOFA files converted to JSON [^349^].

**Atmoky WebSDK** — A commercial SDK explicitly designed for spatial audio in 3D immersive environments, built in WebAssembly. Provides an `"externalizer"` parameter that produces "out-of-head" perceptual sensations — unique among web spatial audio tools [^349^]. Supports A-Frame and Three.js components, algorithmic reverberation, and automatic camera-listener integration [^349^].

**Superpowered** — A WebAssembly-based low-latency audio library with a `Spatializer` class supporting binaural audio, microphone input spatialization, global reverb with multiple parameters (room size, pre-delay, stereo width), and scene rotation [^349^].

**3DTIT JSW** — Supports individualized HRTF loading via JSON/SOFA files [^349^].

| Tool | Custom HRTF | Reverb | Head Tracking | A-Frame/Three.js | License |
|------|-------------|--------|---------------|------------------|---------|
| WAA PannerNode | No | No | Manual | Via frameworks | MIT |
| jsAmbisonics | Yes (SOFA) | Convolution | Yes | A-Frame | BSD-3 |
| Atmoky WebSDK | No | Algorithmic | Yes (A-Frame) | Both | Commercial |
| Superpowered | No | Yes | Manual | No | Commercial |
| 3DTIT JSW | Yes (SOFA) | Yes | No | No | Academic |

### 1.3 Positional Voice: Agents Speak from Their Location

For Agent-47, positional voice synthesis is achievable by connecting speech output (e.g., Web Speech API synthesis) through a PannerNode in the Web Audio graph. Each agent's speech would be:
1. Generated via TTS (Text-to-Speech)
2. Routed through a dedicated PannerNode positioned at the agent's 3D coordinates
3. Mixed with environmental reverb to simulate acoustic space

The WAA's `AudioListener` (camera/listener position) automatically computes relative positioning. Head-tracking data from WebXR can update the listener orientation in real-time [^349^].

### 1.4 Ambient Soundscapes & Procedural Audio

Reactive audio systems where "sound responds to gameplay and environment" are a key trend [^450^]. AI-driven adaptive audio systems "can dynamically adjust the soundscape based on the player's actions, in-game events, or even emotional states" rather than relying on pre-programmed triggers [^450^].

Procedural music generators exist for JavaScript/Web Audio API. One open-source implementation composes music procedurally in milliseconds using mood parameters as input: scale selection by mood, randomized melody/beat patterns, chord progression generation, and sample-based instrument playback with sequenced frequencies and amplitudes [^369^].

For Agent-47's ambient layer:
- **Per-region soundscapes**: Different biomes emit distinct ambient audio textures (wind, water, creature sounds)
- **Dynamic mixing**: Audio layers crossfade based on proximity to different environmental features
- **Procedural variation**: Generative algorithms create non-repeating ambient textures

### 1.5 Reactive Audio: Pheromones as Sounds

A novel concept for Agent-47 is encoding invisible pheromone trails as subtle audio cues. The Web Audio API can create inaudible or near-threshold frequency modulations that spatially represent chemical signals:
- Low-frequency pulses (40-80 Hz) to indicate food trails
- High-frequency shimmering (8-12 kHz) to mark danger/alarm pheromones
- Spatial gradients where intensity maps to proximity to the pheromone source
- Each pheromone type gets a unique spectral signature, creating a "sound aura" around agents

This approach leverages the human ability to localize sound sources while maintaining the informational structure of chemical communication.

---

## 2. VR/AR Integration

### 2.1 WebXR API Status (2025-2026)

WebXR is a W3C standard API for accessing VR/AR hardware from the browser. It supports three modes [^403^]:
- **inline sessions**: XR-responsive content within a normal web page ("Magic Window")
- **immersive-vr sessions**: Full VR presentation to a headset
- **immersive-ar sessions**: Overlay content on the real world (passthrough AR)

As of early 2026:
- **WebGPU Baseline status achieved January 2026** — Chrome, Edge, Firefox (Windows + macOS), Safari 26+ all ship stable WebGPU [^344^]
- **WebGPU + WebXR integration** — An experimental WebGPU-WebXR binding specification is under active development at W3C [^434^]. Chrome Canary 135+ enables it behind flags ("WebXR Projection Layers" + "WebXR/WebGPU Bindings") [^433^]
- Safari 26.2+ supports WebXR integration with WebGPU rendering on Vision Pro [^350^]
- **Interop 2026 includes WebXR as a focus area** [context from prompt]

The WebGPU-WebXR binding uses an `XRGPUBinding` interface [^434^]:
```javascript
const adapter = await navigator.gpu.requestAdapter({ xrCompatible: true });
const device = await adapter.requestDevice();
const binding = new XRGPUBinding(session, device);
const projectionLayer = binding.createProjectionLayer({...});
```

### 2.2 Apple Vision Pro

Vision Pro supports WebXR through Safari, currently behind experimental feature flags [^354^] [^457^]. To enable:
1. Settings > Apps > Safari > Advanced > Feature Flags
2. Enable "WebXR Device API" and "WebXR Hand Input Module"
3. Also enable "WebXR Augmented Reality Module" and "GPU Process: DOM Rendering" [^461^]

**Current limitations (2025)**:
- **VR sessions only** — `immersive-ar` (passthrough AR) sessions are not implemented on Vision Pro as of April 2026 [^344^]
- Uses a natural input model: eye gaze + finger/thumb pinch [^458^]
- Supports `transient-pointer` input mode for privacy-preserving interaction [^458^]
- Full hand tracking is supported when requested as a feature [^458^]
- Vision Pro does NOT ship with physical controllers; relies entirely on hand/eye input [^460^]

### 2.3 Meta Quest Browser

Meta Quest provides the most mature WebXR browser experience [^397^]:
- Supports both VR (`immersive-vr`) and AR (`immersive-ar`) sessions
- **Passthrough**: Color on Quest Pro, grayscale on Quest 2, full color on Quest 3
- **Plane Detection**: Flat surfaces exposed as `XRPlane` objects with world position and polygon data
- **Anchors**: Persistent anchors save/restore positions across sessions
- **Hand Tracking**: WebXR Hand Input Module supported natively
- **Depth API**: As of October 2025, Quest Browser uses depth sensing for instant hit testing in mixed reality [^404^]

### 2.4 Cross-Platform Reach

WebXR content runs on [^348^] [^403^]:
- **Standalone headsets**: Meta Quest family, Apple Vision Pro, Magic Leap, HoloLens 2
- **Desktop headsets** (via Chrome + SteamVR): Valve Index, HTC Vive, HP Reverb G2, Varjo
- **Smartphones**: Android Chrome (ARCore for AR sessions)
- **Future devices**: Automatically supported if they include a compatible browser

Key advantages: accessed by URL (no app store), updated in place, device-agnostic, hardware-independent [^403^].

### 2.5 Passthrough AR Implementation

For passthrough AR on Quest devices [^397^]:
```javascript
navigator.xr.requestSession("immersive-ar").then((session) => {
  xrSession = session;
});
```
Requirements: transparent WebGL background (`alpha: true`), transparent CSS canvas, and `immersive-ar` session mode [^407^]. On Quest 3, this enables full-color mixed reality with hand-tracked interaction directly in the browser — as demonstrated by particle systems controlled via hand gestures [^393^].

---

## 3. Presence Techniques

### 3.1 Proxemics: Personal Space in VR

Proxemics — the study of interpersonal distance and spatial behavior — transfers from the physical world to VR with remarkable fidelity. Research by Bailenson at Stanford's VHIL lab demonstrates that "participants exhibited patterns of interpersonal distance behavior with respect to virtual humans similar to that which decades of research using actual humans have demonstrated" [^459^].

Key findings:
- Participants maintain personal space bubbles around virtual humans similar in size and shape to those around real humans [^459^]
- Comfortableness is most sensitive to distances within personal distance (under 1.0m), with 1.4m being the most comfortable conversational distance in VR [^454^]
- People give avatars (controlled by humans) more personal space than agents (controlled by computers), even if the avatar does not behave realistically [^459^]
- Female participants kept more interpersonal distance with agents who engaged in eye contact; male participants did not show this effect [^454^]
- Being approached by or approaching avatars causes discomfort at similar distances [^453^]
- Group size (individuals vs. pairs vs. groups) does not significantly impact minimum approaching distance in VR [^453^]

Hall's proxemic zones translate to VR [^454^]:
| Zone | Distance | VR Behavior |
|------|----------|-------------|
| Intimate | 0-0.5m | High discomfort; invasion triggers aversion |
| Personal | 0.5-1.2m | Comfortable for close interactions; most sensitive range |
| Social | 1.2-3.7m | Default conversational distance; 1.4m optimal |
| Public | 3.7m+ | Formal/distant; reduced social engagement |

### 3.2 Eye Contact Simulation & Gaze Behavior

Eye contact is a critical social signal. In VR:
- Mutual gaze duration positively correlates with interpersonal distance (equilibrium theory) [^454^]
- More mutual gaze occurs when dyads are in conversation [^454^]
- Participants compensate for increased mutual gaze by adjusting interpersonal distance [^459^]
- Gaze behavior significantly impacts collaboration quality in VR [^371^]

For Agent-47 agents, implementing simulated eye contact involves:
1. **Gaze tracking**: Agents track the player (or other agents) with their head/eyes
2. **Mutual gaze detection**: When the player looks at an agent, the agent returns gaze
3. **Realistic timing**: Following human patterns (2-5 seconds of mutual gaze, then look away)
4. **Equilibrium response**: Agents should subtly adjust distance based on gaze intensity

### 3.3 Micro-Expressions & Facial Animation

Meta's avatar research emphasizes the importance of micro-expressions: "Our faces are constantly moving, whether it's the slight tightening around the eyes and cheeks, periodic twitches around the mouth and brow, or even just subtle asymmetry in the way we move. These micro-expressions are the base layer of what makes a face feel alive" [^400^].

Key implementation strategies:
- Add random subtle facial movements even when agents aren't speaking
- Procedural blinking (log-normal distribution for unconscious blinks)
- Non-negative linear regression for intentional blinks
- Head movement simulation based on speech input using Gaussian Mixture Models [^357^]

Research on avatar facial expressiveness shows:
- Facial expressions significantly increase social presence during face-to-face interaction in VR [^401^]
- Participants look more at avatars with facial expressions (behavioral change) [^401^]
- Stylized avatars can elicit stronger co-presence than realistic ones, especially in playful contexts [^402^]
- Exaggerated expressions on stylized avatars are more readable than subtle micro-expressions on realistic ones [^402^]

### 3.4 Body Language

Avatar embodiment research identifies nonverbal communication (NVC) as "central to enhancing collaboration in multi-user virtual environments" [^371^]. Effective implementations include:
- Gaze coordination enhancing task synchronization and social engagement [^371^]
- Expressive avatars conveying facial expressions contributing to social presence [^371^]
- Spontaneous nonverbal coordination among users improving real-time task execution [^371^]
- Head movement tracking (HMD users naturally turn to face active speakers) [^456^]

### 3.5 The Uncanny Valley Effect

The uncanny valley — where near-realistic but imperfect avatars trigger discomfort — is well-documented in VR:
- "Avatars with a high degree of realism often elicited lower levels of engagement and social presence due to perceived eeriness, particularly when their facial movements and expressions did not align with user expectations" [^432^]
- Temporal misalignment in voice and facial movements exacerbates the effect [^432^]
- Digital doubles (photorealistic avatars of real people) often fall into the uncanny valley when subtle facial expressions or voice inflections don't match perfectly [^432^]
- A systematic study found a mixed avatar (moderate realism) was rated as more uncanny than either stylized or life-like alternatives, confirming the valley shape [^437^]

**Recommendation for Agent-47**: Use stylized/cartoonish avatars with exaggerated expressions rather than attempting photorealism. This avoids uncanny valley effects while maintaining expressiveness and emotional readability.

---

## 4. Haptic Feedback

### 4.1 Vibration API (Web)

The Vibration API provides basic haptic feedback via `navigator.vibrate()` [^396^]:
```javascript
// Single vibration
navigator.vibrate(500);

// Pattern: vibrate 500ms, pause 200ms, vibrate 800ms
navigator.vibrate([500, 200, 800]);

// Cancel
navigator.vibrate(0);
```

**Browser support**: Android Chrome/Firefox/Edge, Mobile Safari (iOS 13+) [^395^]. Desktop browsers generally don't support it.

**Limitations**: The web Vibration API is coarse — on/off patterns only, no intensity control, no spatial resolution. For Agent-47, it's primarily useful for mobile touch feedback (button presses, notifications, simple events).

### 4.2 Gamepad Haptics (VR Controllers)

The Gamepad API's `GamepadHapticActuator` interface provides more nuanced haptic feedback for VR controllers [^353^]:
```javascript
const gamepad = navigator.getGamepads()[0];

// Simple pulse (intensity 0-1, duration ms)
gamepad.hapticActuators[0].pulse(1.0, 200);

// Dual-rumble effect
gamepad.vibrationActuator.playEffect("dual-rumble", {
  startDelay: 0,
  duration: 200,
  weakMagnitude: 1.0,
  strongMagnitude: 1.0
});
```

This is available on Meta Quest controllers and other WebXR-compatible gamepads, but not on Apple Vision Pro (which lacks controllers entirely).

### 4.3 Haptic Suits: Current Landscape

Haptic suits provide full-body tactile feedback for enhanced immersion:

**bHaptics TactSuit** (Consumer-grade):
- X40: 40 programmable vibrotactile motors, wireless (BLE), $249-$479 [^420^]
- SDKs for Unity and Unreal Engine; audio-to-haptic conversion algorithm [^417^]
- 250+ VR titles supported natively [^417^]
- 13.5 hours battery life [^417^]

**Teslasuit** (Enterprise-grade):
- Full-body electrostimulation (EMS/TENS) across 68 haptic points [^417^]
- Biometric sensors (ECG, EMG) for heart rate and muscle activity [^417^]
- Motion capture capability [^420^]
- $9,900-$12,999 [^420^]

**OWO Game Skin**:
- 20 electrodes, modular design, 399 EUR [^417^]
- Simulates sensations from gentle breeze to intense impact [^417^]

**Web Integration**: Haptic suits currently require native SDK integration (Unity/Unreal). Web-based haptic suit integration is not yet standardized. For Agent-47, this represents a **future pathway** — likely through WebHID or a WebSerial-like API, though these APIs face opposition from Mozilla/WebKit on security grounds [^344^].

### 4.4 Virtual Touch Sensation Design

Even without haptic hardware, effective "virtual touch" can be created through:
- **Visual feedback**: Hand deformation, particle effects on "touch"
- **Audio feedback**: Surface-appropriate sound (wood, metal, fabric)
- **Visual-haptic substitution**: Screen shake, object recoil
- **Temporal precision**: Sub-50ms feedback loops critical for touch illusion

Research on haptic feedback in shared VR spaces found that "the addition of haptic feedback to social VR has been found to consistently enhance perceived social presence" [^368^]. However, vibrotactile feedback must be carefully designed — poorly designed haptics can be perceived as intrusive or "random, like it was malfunctioning" [^368^].

---

## 5. Cross-Platform Experience

### 5.1 Interaction Paradigm Matrix

Agent-47 must support seamless interaction across device classes:

| Device | Input Method | Primary Interaction | Secondary |
|--------|-------------|---------------------|-----------|
| Mobile (touch) | Finger tap/drag/swipe | Tap to select, drag to move | Pinch zoom, gyroscope look |
| Desktop (mouse/KB) | Click + WASD/arrow keys | Click to interact, mouse look | Scroll wheel zoom |
| Tablet | Touch + stylus | Tap to select, drag to navigate | Stylus precision |
| VR Headset | Hand tracking / controllers | Point + pinch/select, 6DoF movement | Gesture shortcuts |
| AR (passthrough) | Hand tracking | Air tap, pinch to grab, spatial movement | Voice commands |

### 5.2 Unified Input Abstraction

The key to cross-platform design is a unified input abstraction layer:
- **Pointer/Ray abstraction**: All platforms produce a ray from the user's viewpoint
- **Select action**: Unified "activate" gesture (click, tap, pinch, trigger press)
- **Movement abstraction**: Teleport, smooth locomotion, or fly — configurable per platform
- **Contextual controls**: Show/hide control schemes based on detected capabilities

Research comparing HMD vs. desktop interaction found that HMD users with hand tracking have better articulation of social signals (head turning, hand gestures), while desktop users tend to crowd more closely (less awareness of intimate zone boundaries) [^456^].

### 5.3 Web Framework Considerations

Three.js and Babylon.js are the leading web 3D frameworks, both adopting WebGPU:

| Feature | Three.js | Babylon.js |
|---------|----------|------------|
| Core size | ~168 KB | ~1.4 MB |
| WebGPU support | Production-ready (r171+) | Since v5.0, native WGSL in v8.0 |
| WebXR integration | Via WebXRManager | Built-in WebXR support |
| Ease of use | Slightly easier (UMUX-LITE: 4.3 vs 3.9) | Better documentation |
| Mobile optimization | Manual | Built-in Havok physics |

Both frameworks support WebXR and are transitioning to WebGPU as the primary rendering backend [^302^] [^405^]. For Agent-47, **Three.js** offers a smaller bundle and streamlined DX, while **Babylon.js** provides more built-in XR features and better documentation.

### 5.4 Progressive Enhancement Strategy

1. **Core layer**: 3D world renders on all platforms with appropriate interaction
2. **Enhanced layer**: Spatial audio on platforms with headphone support
3. **XR layer**: Full VR/AR immersion on headset platforms
4. **Haptic layer**: Controller/suit haptics where available

---

## 6. Environmental Storytelling

### 6.1 Core Principles

Environmental storytelling embeds narrative into the world itself, allowing players to discover story through exploration rather than explicit exposition [^370^]:

- **Non-Linear Exploration**: Open or semi-open worlds encourage discovery of hidden areas with lore-rich content [^370^]
- **Environmental Affordances**: Objects or paths that invite interaction (readable notes, climbable ruins) embed story in gameplay [^370^]
- **Spatial Storytelling**: Layouts that reflect narrative themes (fortified bunkers signaling conflict, desolate fields evoking abandonment) [^370^]
- **Textural Details**: Weathered surfaces, overgrown vegetation convey the passage of time [^370^]
- **Absence and Silence**: Empty environments or quiet moments amplify unease [^370^]

### 6.2 Audio Logs & Discoverable Lore

Audio logs are a proven environmental storytelling technique. Best practices include:
- **Diegetic placement**: Audio logs exist as physical objects in the world (tape recorders, computer terminals, memory crystals)
- **Spatial playback**: Logs play from their source location, not omnipresent — the player must be nearby to hear clearly
- **Contextual discovery**: Logs relate to the immediate environment (a log about a garden found near overgrown plants)
- **Partial information**: Logs hint at larger narratives without fully explaining them
- **Emotional authenticity**: Voice acting should convey genuine emotion; flat narration breaks immersion

### 6.3 Every Object Tells a Story

Following the principle that "every location contributes to the narrative, rewarding curiosity with meaningful discoveries" [^370^]:
- Agent bodies could leave "death markers" showing how they died (battle scars, position)
- Food sources could show consumption patterns (partially eaten, scattered remains)
- Nest structures could encode colony history (expansion layers, repair marks)
- Pheromone trails could be made visible as glowing paths with associated emotional "scent memory" audio

### 6.4 Dynamic Systems

- **Weather and lighting shifts**: Fog, storms, time-of-day changes enhance mood [^370^]
- **Sound design**: Ambient sounds (wind, creature calls, creaking structures) make environments feel alive [^370^]
- **Player agency**: Allowing players to uncover story at their own pace fosters investment [^370^]

---

## 7. Interface Design (Diegetic & Non-Diegetic UI)

### 7.1 The Four-Type Framework

Game UI taxonomy from Fagerholt & Lorentzon (2009) organizes UI along two axes [^354^]:
- **Fiction axis**: Can characters in the game world see/interact with it?
- **Geometry axis**: Is it in 3D space or a 2D screen overlay?

| Type | Fiction | Geometry | Examples |
|------|---------|----------|----------|
| **Diegetic** | Yes | Yes (3D) | Wristwatch health display, holographic map, suit vitals |
| **Non-Diegetic** | No | No (2D overlay) | Health bars, minimaps, ammo counters |
| **Spatial** | No | Yes (3D) | Floating labels, world-space markers |
| **Meta** | Yes | No (2D) | Character thoughts, narrative text overlays |

### 7.2 Diegetic UI in VR: Research Findings

A study comparing three health UI approaches in VR shooters found [^357^]:

**Non-Diegetic Overlay**: Traditional health bar following head movement
- Pros: Clear health judgment (12/37 participants), always visible (11/37), immediately understandable (5/37)
- Cons: Intrusive/in the way (14/37), hurts immersion (5/37)
- Best for: Competitive multiplayer games

**Diegetic Wristwatch**: Health value on virtual wristwatch
- Pros: Clear and accurate (10/37), immersive (9/37), unobtrusive (8/37), blends well into action (7/37)
- Cons: Impractical during intense action (8/37), must actively check (8/37)
- Best for: Single-player and story-driven games
- "The most well-rounded and the most liked health interface in our study" [^357^]

**Diegetic Physical**: Movement trembling/slowing when hurt
- Pros: Direct impact on gameplay, highly immersive
- Cons: Frustrating for competitive play
- Best for: Story-driven games seeking maximum immersion

### 7.3 VR-Specific UI Considerations

**Critical finding**: "Stay away from strictly non-diegetic UIs when developing solutions for virtual reality" [^355^]. Traditional HUDs in VR cause:
- Eye strain from screens too close to face
- Need to re-focus between HUD and world
- Persistent distraction even when focusing on other tasks [^355^]

Research comparing 2D vs. 3D UI in VR found "a 3-dimensional user interface is more fun, immersive and generally satisfying in comparison to a 2-dimensional user interface" [^356^], though 2D interfaces remain better for "large quantities of objects that need to be interacted with at speed" [^356^].

### 7.4 Agent-47 Command Interface Recommendations

For Agent-47's command interface, a **hybrid diegetic approach** is optimal:

1. **Primary UI**: Diegetic holographic display (like a wrist-worn or floating terminal)
   - Shows agent status, colony metrics, environment data
   - Activated by raising wrist or looking at floating panel
   - Does not pause the world (enemies/agents continue acting)

2. **Contextual overlays**: Spatial UI elements
   - Agent selection rings on the ground
   - Task assignment via pointing at targets
   - Proximity-activated info labels

3. **Emergency HUD**: Minimal non-diegetic elements
   - Only for critical alerts (colony under attack, agent dying)
   - Fades in briefly, then returns to diegetic mode

---

## 8. Flow State Design

### 8.1 Csikszentmihalyi's Flow Theory Applied to Games

Flow is "a mental state and a feeling of energized focus, full immersion and success in the process of an activity" [^359^]. Eight major components [^361^]:

1. Challenging activity requiring skill
2. Merging of action & awareness
3. Clear goals
4. Direct, immediate feedback
5. Concentration on the task
6. Sense of control
7. Loss of self-consciousness
8. Altered sense of time

### 8.2 Challenge-Skill Balance

The core of flow is the balance between challenge and skill [^360^]:
- **Challenge > Skill**: Anxiety, frustration, disengagement
- **Challenge < Skill**: Boredom, loss of interest
- **Challenge ~ Skill**: Flow state — optimal engagement

Research using regression analysis confirms that "the quality of experience varies depending on the levels of challenges and skills, with the highest quality occurring in the 'flow channel' area" [^364^]. Modern models include interaction terms (challenge x skill cross-product) to capture the balancing effect [^364^].

### 8.3 Application to Agent-47

| Flow Element | Agent-47 Implementation |
|-------------|------------------------|
| Clear goals | Colony objectives (expand, defend, gather); agent task queues |
| Immediate feedback | Visual/audio confirmation of commands; agent status changes |
| Challenge-skill balance | Adaptive difficulty (AI director adjusts threat level); player-set pace |
| Sense of control | Direct agent control; colony management; undo/redo for actions |
| Concentration | Minimize UI distractions; focused interaction modes |
| Loss of self-consciousness | Immersive first-person or god-view; avatar embodiment |
| Altered time | Session-friendly loop (15-60 min); save/resume anytime |

### 8.4 Feedback Loop Design

Immediate feedback mechanisms for Agent-47:
- **Agent acknowledgment**: Visual nod, audio chirp, or gesture confirming received orders
- **Progress indicators**: Task completion percentage, path visualization
- **Consequence visibility**: Agent death leaves body; resource depletion shows empty stores
- **Audio feedback**: Different sounds for success/failure/partial completion
- **Haptic feedback** (where available): Pulse on mobile; controller rumble in VR

---

## 9. Social Presence

### 9.1 Dimensions of Presence

A comprehensive survey of 320 MR articles found the following presence dimensions measured [^426^]:

| Presence Type | Studies |
|--------------|---------|
| Social presence | 136 |
| Co-presence | 119 |
| Spatial presence | 103 |
| General presence | 99 |
| Object presence | 64 |
| Embodied presence | 15 |

### 9.2 Co-Presence: Feeling Others Are There

Co-presence is "the sense of being together with another in a virtual space." Key findings [^418^]:

- **Avatar realism enhances co-presence**: Realistic avatars produce higher co-presence ratings than abstract ones [^418^]
- **Communication methods substantially improve collaboration**: Voice + gesture > gesture alone > text [^418^]
- **Physiological synchrony as a measure**: Heart rate correlation between participants can indicate collaboration quality — higher synchrony observed in high co-presence, low-collaboration scenarios [^418^]
- **EDA (skin conductance) as proxy**: Higher skin conductivity correlates with lower presence scores, suggesting arousal/stress indicators [^418^]

The Igroup Presence Questionnaire (IPQ) is the standard for measuring spatial presence, while the Networked Minds Measure of Social Presence (NMSPI) is the validated instrument for co-presence and social presence [^418^].

### 9.3 Avatar Embodiment Research

Avatar embodiment research reveals that [^371^]:
- **Gaze behavior and body language significantly impact collaboration quality** [^371^]
- **Effective gaze coordination enhances task synchronization and social engagement** [^371^]
- **Expressive avatars conveying facial expressions contribute to social presence** [^371^]
- **Spontaneous nonverbal coordination improves real-time task execution** [^371^]
- **Shared control co-embodiment**: Weighted-average methods (blending two users' inputs) can create shared avatar experiences with enhanced agency and coordination [^368^]

### 9.4 Social VR Patterns for Agent-47

Multi-agent colony behavior can leverage social presence principles:
- **Agent observability**: Agents should be visually distinct and trackable (names, colors, roles)
- **Social signaling**: Agents express emotional state through body language and micro-expressions
- **Proximity-based interaction**: Agents respond to player proximity (approach, acknowledge, report)
- **Collective behavior patterns**: Swarm behavior visible at colony level creates emergent narrative
- **Voice/audio identity**: Each agent has a unique voice/sonic signature for identification

### 9.5 Behavioral vs. Self-Report Measures

Stanford research found that "nonverbal behavior may be a more sensitive measure of the copresence and general influence of embodied agents than self-report measures" [^422^]. Participants yielded more personal space to embodied tutors than to strangers, even when self-report questionnaires showed no differences [^422^].

**Implication for Agent-47**: Measure social presence through behavioral metrics (interpersonal distance, gaze duration, interaction frequency) rather than relying solely on post-session questionnaires.

---

## 10. Key Recommendations for Agent-47

### 10.1 Priority Implementation Roadmap

| Priority | Feature | Technical Approach | Timeline |
|----------|---------|-------------------|----------|
| **P0** | Positional spatial audio | Web Audio API PannerNode (HRTF mode) + per-agent speech | Phase 1 |
| **P0** | Cross-platform 3D rendering | Three.js/Babylon.js with WebGPU renderer, WebGL fallback | Phase 1 |
| **P0** | Diegetic UI | Wristwatch/floating holographic panel design | Phase 1 |
| **P1** | WebXR VR support | `immersive-vr` sessions, hand tracking on Quest/Vision Pro | Phase 2 |
| **P1** | Proxemic agent behavior | Distance-based comfort thresholds, equilibrium responses | Phase 2 |
| **P1** | Environmental storytelling | Audio logs, environmental narrative objects, discovery system | Phase 2 |
| **P2** | Passthrough AR | `immersive-ar` sessions on Quest (Vision Pro when supported) | Phase 3 |
| **P2** | Procedural ambient audio | Generative ambient soundscapes per biome | Phase 3 |
| **P3** | Haptic suit integration | WebHID/WebSerial pathway for bHaptics/Teslasuit | Future |
| **P3** | AI-driven adaptive audio | ML-based emotional state detection driving soundscapes | Future |

### 10.2 Technical Architecture

```
Agent-47 Audio Pipeline:
TTS Engine → PannerNode (per-agent, positioned) → Master Gain → AudioListener
                    ↓
              ReverbNode (environment) ← Room parameters
                    ↓
              Ambient Mixer ← Procedural ambient layers
                    ↓
              Spatial Bus → Headphones/VR headset

Agent-47 Input Abstraction:
Mobile Touch ──┐
Desktop M+KB ──┼→ Unified Pointer/Ray → Action Select → Game Logic
Tablet Stylus ─┤
VR Hands ──────┘
```

### 10.3 Immersion Checklist

- [ ] Audio sources have 3D positions; voices come from agent mouths
- [ ] HRTF panning mode for headphone users
- [ ] Agents maintain realistic interpersonal distances (proxemics)
- [ ] Agents make eye contact and exhibit micro-expressions
- [ ] UI exists within the game world (diegetic), not screen overlays
- [ ] Challenge adapts to player skill level
- [ ] Every interactive object has narrative context
- [ ] Feedback is immediate (< 100ms) for all actions
- [ ] Works on mobile, desktop, tablet, and headset without code changes
- [ ] VR mode enters via single button on compatible devices
- [ ] Passthrough AR layers agents onto real world (Quest 3+)
- [ ] Stylized avatars avoid uncanny valley
- [ ] Audio environment responds to gameplay state

---

## 11. References

[^302^] Rodriguez, A. et al. (2025). "A Cross-Platform, WebGPU-Based 3D Engine for Real-Time Rendering and XR Applications." Proceedings of the 30th International Conference on 3D Web Technology. ACM. https://dl.acm.org/doi/10.1145/3746237.3746305

[^306^] Interaction Design Foundation. (2023). "What is Agency in Virtual Reality / Extended Reality." https://ixdf.org/literature/topics/agency

[^344^] Utsubo. (2026, April). "Frontier Web APIs in 2026: WebGPU, WebTransport, WebCodecs & What's Production-Ready." https://www.utsubo.com/blog/frontier-web-apis-2026-production-ready

[^345^] MDN Web Docs. (2025). "Web audio spatialization basics." https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics

[^347^] Scitepress. (2025). "Real-Time Sound Mapping of Object Rotation and Position in AR." https://www.scitepress.org/Papers/2025/136728/136728.pdf

[^348^] Wonderland Engine. "WebXR." https://wonderlandengine.com/about/webxr/

[^349^] Turchet, L. "How to Spatial Audio with the WebXR API." https://www.lucaturchet.it/PUBLIC_DOWNLOADS/publications/conferences/How_to_Spatial_Audio_with_the_WebXR_API-_a_comparison_of_the_tools_and_techniques_for_creating_immersive_sonic_experiences_on_the_browser.pdf

[^350^] WebGPU.com. (2026, January). "WebGPU Hits Critical Mass: All Major Browsers Now Ship It." https://www.webgpu.com/news/webgpu-hits-critical-mass-all-major-browsers/

[^351^] Stack Overflow. (2022). "How can I use spatialization in Web Audio API?" https://stackoverflow.com/questions/71607929/how-can-i-use-spatialization-in-web-audio-api

[^352^] Han, X. "Investigating proxemics between avatars in virtual reality." KTH Royal Institute of Technology. https://www.diva-portal.org/smash/get/diva2:1377802/FULLTEXT01.pdf

[^353^] MDN Web Docs. (2025). "GamepadHapticActuator." https://developer.mozilla.org/en-US/docs/Web/API/GamepadHapticActuator

[^354^] Nasty Rodent. (2026, May). "Diegetic vs Non-Diegetic UI: The 4-Type Framework." https://nastyrodent.com/diegetic-and-non-diegetic-ui/

[^355^] Developer Nation. "A New Dimension for UI: Using Unity for Virtual Reality." https://www.developernation.net/blog/unity_virtual_reality/

[^356^] Staffs.ac.uk. "DESIGNING UI FOR A VR ENVIRONMENT: DIEGETIC..." https://eprints.staffs.ac.uk/9270/1/paper1015_CRC.pdf

[^357^] Koehle, K. et al. "Diegetic and Non-Diegetic Health Interfaces in VR Shooter Games." LMU Munich. https://www.medien.ifi.lmu.de/pubdb/publications/pub/koehle2021interact/koehle2021interact.pdf

[^358^] Learning Loop. (2024, October). "Flow Theory." https://learningloop.io/glossary/flow-theory-product-psychology

[^359^] TKDev. "Flow Theory – Game Design Toolkit." https://tkdev.dss.cloud/gamedesign/toolkit/flow-theory/

[^360^] Medium. (2023, November). "Mihaly Csikszentmihalyi's Flow theory — Game Design ideas." https://medium.com/@icodewithben/mihaly-csikszentmihalyis-flow-theory-game-design-ideas-9a06306b0fb8

[^361^] DiVA. "Designing for Flow in Video Games." https://www.diva-portal.org/smash/get/diva2:1985453/FULLTEXT01.pdf

[^362^] ISU Pressbooks. "Flow Theory." https://isu.pressbooks.pub/thuff/chapter/flow-theory-jennifer-uptmor/

[^363^] UX Design. (2018, November). "VR & diegetic Interfaces: don't break the experience!" https://uxdesign.cc/vr-diegetic-interfaces-dont-break-the-experience-554f210b6e46

[^364^] Springer. (2025, February). "Analyzing Skill-Challenge Interaction and Flow State." https://link.springer.com/article/10.1007/s10902-024-00846-4

[^368^] ACM CHI 2024. "ShareYourReality: Investigating Haptic Feedback and Agency in Virtual Avatar Co-embodiment." https://dl.acm.org/doi/10.1145/3613904.3642425

[^369^] Reddit r/gamedev. "Procedural Music Generator written in JavaScript using the WebAudio API." https://www.reddit.com/r/gamedev/comments/4afwah/procedural_music_generator_written_in_javascript/

[^370^] Ultimate Gaming. (2025, May). "Environmental Storytelling in Game Design." https://ultimategaming.substack.com/p/environmental-storytelling-in-game

[^371^] arXiv. (2025). "A Survey on Methodological Approaches to Collaborative Embodiment in Virtual Reality." https://arxiv.org/html/2507.18877v1

[^393^] Lina Lopes Blog. (2026, January). "WebXR Particles on Meta Quest 3 (Three.js)." https://blog.linalopes.info/webxr-mixed-reality-particles-meta-quest-3/

[^394^] Zap.works. "Rich and immersive WebXR experiences." https://zap.works/webxr/

[^395^] WebHaptics. (2026, March). "Introduction to WebHaptics." https://lochie-web-haptics-50.mintlify.app/introduction

[^396^] OpenReplay Blog. (2024, June). "Haptic Feedback for Web Apps with the Vibration API." https://blog.openreplay.com/haptic-feedback-for-web-apps-with-the-vibration-api/

[^397^] Meta Horizon OS Developers. "Mixed Reality Support in Browser." https://developers.meta.com/horizon/documentation/web/webxr-mixed-reality/

[^398^] DiVA. "Performance and Ease of Use in 3D on the Web." https://www.diva-portal.org/smash/get/diva2:1523176/FULLTEXT01.pdf

[^400^] Meta Blog. (2025, July). "Avatars: The Art and Science of Social Presence." https://www.meta.com/blog/avatars-the-art-and-science-of-social-presence/

[^401^] HAL Science. "Effect of Avatar Facial Expressiveness on Team Collaboration in VR." https://hal.science/hal-04403341v1/document

[^402^] Springer. (2025). "Effect of avatar stylization and facial expression intensity in virtual interactions." https://link.springer.com/article/10.1007/s10055-025-01238-6

[^403^] Immersive Web. "WebXR." https://immersiveweb.dev/

[^404^] UploadVR. (2025, October). "Quest Browser Gets Instant WebXR Hit Testing For Mixed Reality Placement." https://www.uploadvr.com/quest-browser-depth-api-webxr-hit-testing-instant-placement/

[^405^] Utsubo. (2026, January). "Three.js Alternatives: Babylon.js vs PlayCanvas." https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison

[^407^] Three.js Discourse. "How to enable webxr passthrough for quest2?" https://discourse.threejs.org/t/how-to-enable-webxr-passthrough-for-quest2/43897

[^417^] Grokipedia. (2026, January). "Haptic suit." https://grokipedia.com/page/Haptic_suit

[^418^] Frontiers. (2024, December). "Investigating co-presence and collaboration dynamics in realtime virtual reality user interactions." https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2024.1478481/full

[^420^] Anvio B2B. "Teslasuit vs bHaptics: Which Haptic Suit for VR Arenas 2025?" https://b2b.anvio.com/teslasuit-vs-bhaptics-2025

[^422^] Stanford VHIL. "Comparing behavioral and self-report measures of embodied agents' social presence." https://vhil.stanford.edu/publications/avatars-and-agents/comparing-behavioral-and-self-report-measures-embodied-agents

[^424^] Microsoft Research. (2025). "Avatars in mixed-reality meetings." https://www.microsoft.com/en-us/research/wp-content/uploads/2025/10/2025-IJHCS-RealVsCartoonAvatarFacesInMixedReality-Longitudinal.pdf

[^426^] ACM. (2024). "A Survey On Measuring Presence in Mixed Reality." https://dl.acm.org/doi/10.1145/3613904.3642383

[^431^] ACM. (2025). "A Cross-Platform, WebGPU-Based 3D Engine." https://dl.acm.org/doi/10.1145/3746237.3746305

[^432^] MIT. (2025). "An Empirical Study on Human Perceptions of AI-Generated Avatars." https://dspace.mit.edu/bitstream/handle/1721.1/159096/kishnani-deepalik-sm-sdm-2025-thesis.pdf

[^433^] Toji.dev. (2025, March). "Experimenting with WebGPU in WebXR." https://toji.dev/2025/03/03/experimenting-with-webgpu-in-webxr.html

[^434^] Immersive Web GitHub. "WebXR/WebGPU Binding Module - Level 1." https://immersive-web.github.io/WebXR-WebGPU-Binding/

[^437^] UPV. (2024). "A Systematic Approach to Quantify the Uncanny Valley." https://personales.upv.es/thinkmind/dl/journals/sysmea/sysmea_v17_n34_2024/sysmea_v17_n34_2024_6.pdf

[^438^] Eureka Alert. (2025, April). "No 'uncanny valley' effect in science-telling AI avatars." https://www.eurekalert.org/news-releases/1079762

[^450^] Pingle Studio. (2025, July). "The Role of Sound Design in Immersive Gaming Experiences." https://pinglestudio.com/blog/the-role-of-sound-design-in-immersive-gaming-experiences

[^451^] Digital Residency. (2025, August). "Game Sound Design: The Art of Video Game Sound." https://digitalresidency.com/game-sound-design-the-art-of-video-game-sound/

[^453^] Springer. (2025, March). "Investigating proxemics behaviors towards individuals, pairs, and groups in virtual reality." https://link.springer.com/article/10.1007/s10055-025-01127-y

[^454^] KTH Royal Institute of Technology. "Investigating proxemics between avatars in virtual reality." https://www.diva-portal.org/smash/get/diva2:1377802/FULLTEXT01.pdf

[^456^] CWI. "Digital Proxemics: Designing Social and Collaborative..." https://ir.cwi.nl/pub/31705/3491102.3517594.pdf

[^457^] krpano. "Enable WebXR support on the Apple Vision Pro." https://krpano.com/docu/applevision-enable-webxr/

[^458^] WebKit Blog. (2024, June). "Introducing Natural Input for WebXR in Apple Vision Pro." https://webkit.org/blog/15162/introducing-natural-input-for-webxr-in-apple-vision-pro/

[^459^] Stanford VHIL. "Interpersonal Distance in Immersive Virtual Environments." https://vhil.stanford.edu/sites/g/files/sbiybj29011/files/media/file/bailenson-interpersonal-distance.pdf

[^460^] Zappar. (2024, March). "How to create WebXR experiences on Vision Pro." https://www.zappar.com/insights/how-to-create-webxr-experiences-on-vision-pro-a-technical-deep-dive

---

*Research compiled from 15+ independent web searches across academic papers, industry documentation, technical specifications, and empirical studies. Sources include MDN Web Docs, W3C specifications, ACM publications, Springer journals, Stanford VHIL lab research, Meta engineering blogs, and Apple developer documentation.*
