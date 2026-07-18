## 5. Immersive Experience — Spatial Audio, World Design & Presence

The preceding chapters established how Agent-47's agents think, communicate, and compete. But intelligence without immersion is merely a dashboard — cognitive layers floating in void. This chapter ties the swarm's distributed cognition to a living world that players hear, inhabit, and believe. The acoustic architecture transforms invisible pheromone signals into spatial soundscapes. The procedural generation pipeline constructs a persistent environment where every alleyway carries the scars of agent decisions. And the diegetic interface ensures that Agent 47's god-mode command surface exists within the world, not plastered over it. Immersion is not a polish layer applied at the end; it is the crucible in which swarm intelligence becomes felt reality.

### 5.1 Spatial Audio Architecture

#### 5.1.1 Web Audio API with HRTF: The Foundation and Library Comparison

The Web Audio API provides the foundational spatialization layer through the `PannerNode` interface, which supports two panning models: `equalpower` (efficient but spatially coarse) and `HRTF` (higher-quality binaural convolution) [^529^]. The HRTF implementation in Chrome uses FFT-based convolution with kernels derived from the IRCAM Listen HRTF Database, averaged and truncated to 256 samples at 44.1 kHz — a composite dubbed "IRC_Composite" that balances fidelity against computational cost [^528^]. When source positions change, delay lines and convolver kernels update with 20 ms smoothing interpolation and 45 ms linear crossfade transitions, ensuring head-tracked audio rotations feel seamless [^528^].

For Agent-47's 47-agent voice system, the native PannerNode in HRTF mode serves as the default backend, but three alternative libraries merit evaluation. Howler.js offers a lightweight spatial plugin (7 KB gzipped) wrapping PannerNode with a friendlier API but does not enhance spatial fidelity [^512^]. Atmoky WebSDK provides WebAssembly-optimized performance, an "externalizer" parameter for out-of-head localization, and algorithmic reverberation — the strongest candidate for a premium audio tier [^517^] [^349^]. jsAmbisonics supports higher-order Ambisonics and individualized HRTF loading via SOFA files, positioning it as the research-grade option [^517^].

| Capability | Howler.js Spatial | Atmoky WebSDK | jsAmbisonics |
|---|---|---|---|
| Bundle size | ~7 KB gzipped [^512^] | ~180 KB (WASM) | ~45 KB |
| HRTF quality | IRC_Composite (fixed) [^528^] | IRC_Composite + externalizer [^349^] | SOFA/JSON loadable (individualized) [^349^] |
| Reverberation | Via ConvolverNode (manual) | Algorithmic per-source [^349^] | Via ConvolverNode [^517^] |
| Head tracking | Manual via WebXR | Automatic (A-Frame/Three.js) [^349^] | SceneRotator class [^517^] |
| Max positional sources | ~50 (browser-dependent) | ~100 | ~50 |
| License | MIT | Commercial (free dev tier) | BSD-3 |
| Recommended use | MVP / desktop browsers | Premium VR tier | Research / individualized HRTF |

The recommendation follows a tiered strategy. For the initial deployment, Howler.js Spatial around native PannerNode in `HRTF` mode handles 47 simultaneous positional voices with direct Three.js `PositionalAudio` integration [^632^] [^634^]. For the WebXR VR tier, Atmoky WebSDK adds algorithmic reverb that models the Central Plaza's open acoustic space differently from enclosed Data Hive corridors — a transaction announcement in the Commons should sound architecturally distinct from the same voice inside a narrow tunnel. The externalizer parameter becomes critical: without it, voices collapse to "inside-the-head" localization, destroying the sense that 47 agents occupy real positions around the player [^349^]. jsAmbisonics remains a future upgrade for power users willing to upload personal HRTF measurements.

#### 5.1.2 The "Audio Pheromone" Synthesis: A New Sensory Channel

No existing virtual world has attempted to render chemical signals as an immersive audio experience. Agent-47's pheromone protocol defines nine distinct chemical signal types — alarm, trail, food, queen, aggregation, marking, sex, dispersal, and necrophoric — each with biologically grounded concentration curves and spatial diffusion patterns. The Audio Pheromone Synthesis system maps these invisible chemical fields into audible spatial textures, creating a "chemical sense" interface that no human has experienced in a virtual environment.

The synthesis follows a four-parameter mapping. **Pheromone concentration** drives amplitude: a dense trail at maximum strength renders at -12 dBFS, while a fading trace drops below perceptual threshold. **Pheromone type** determines timbre: alarm manifests as brass-section urgency (800–1200 Hz trumpet harmonics), trail as sustained string harmonics, queen as choral pads suggesting distributed authority, aggregation as warm synth clusters, and necrophoric as hollow glass harmonica tones. **Spatial position** routes each pheromone source through its own HRTF-panned `PannerNode`, so following a trail literally means walking toward its sound. **District identity** applies district-specific pentatonic scales: Core Hive in C minor, Growth in D major, Data in E Phrygian, Defense in F minor, Chaos in microtonal atonality [^548^].

This is not merely data sonification — it creates a sensory modality evolution never equipped us to experience. When alarm pheromones cascade through the Finance District because a market-making agent detected anomalous x402 flow, the player hears panic as a brass swell moving through three-dimensional space. When trail pheromones guide agents toward a newly deployed MCP server, the player hears pathways as violin harmonics converging on a point. The "bad data sounds worse" model from generative sonification research confirms that parameter-mapped audio communicates quantitative differences intuitively: higher filter cutoff means stronger signal, longer reverb decay means more persistent presence [^638^]. District ambient layers reinforce the spatial audio ecology — each hive's soundscape (machine hum for Core, organic textures for Growth, digital glitch for Data, low drones for Defense, dissonant aleatorics for Chaos) forms the bed against which pheromone melodies emerge [^548^].

#### 5.1.3 Positional Agent Voice System: 47 Unique Voices in 3D Space

Each of the 47 agents possesses a unique voice cloned via ElevenLabs voice synthesis, creating an immediately recognizable sonic identity. When Agent Solis-7 speaks from the Finance District and Agent Hex-19 responds from the Growth Hive Commons, their voices originate from actual 3D positions — not as flat stereo overlays but as spatially localized sources rendered through the HRTF pipeline. Three.js `PositionalAudio` nodes attach to each agent's avatar mesh, with `refDistance` set to 3 meters (Hall's social conversational range) and `rolloffFactor` of 1.0 using the inverse distance model for natural cocktail-party attenuation [^632^] [^547^].

A priority-based mixing system ensures intelligibility when multiple agents speak simultaneously. The algorithm computes priority per agent: 100 base points for actively speaking, plus 50 points if gazed at by the player, plus proximity weighting where closer agents score higher [^589^]. With a maximum concurrent budget of ~10 voices, the mixer ranks all 47 agents each frame and applies smooth gain ramping (100 ms attack, 200 ms release). Agents below threshold attenuate to -60 dB, preserving spatial ambience while ensuring foreground clarity. Voice positioning follows VR proxemics research: comfortable conversational distance in VR averages 1.4 meters — roughly 160% of physical-space equivalents — so agents default to 1.9 meters for player-directed speech, while agent-to-agent conversations occupy the Social zone at 2.5–4 meters [^547^].

### 5.2 Procedural World Generation & Environmental Storytelling

#### 5.2.1 Five-Phase GPU Pipeline: From Terrain to Atmosphere

The world generation pipeline runs entirely on GPU via WebGPU compute shaders, producing the Central Plaza, five Hive Districts, Commons, and Bridge from procedural seeds. The five-phase architecture draws on GPU Work Graphs research demonstrating 79,710 procedural instances generated in 3.74 ms on modern hardware [^586^], and a 1,200-tree forest rendered in 3.13 ms median from only 51 KiB of seed data [^480^].

**Phase 1 — Compute Shader Terrain**: Density functions combining Perlin and ridged noise define terrain volumes, which Marching Cubes extracts into polygon meshes. Ambient occlusion is computed per-vertex via ray casting (32 rays × 4 samples), and triplanar texturing assigns surface materials based on orientation and altitude [^482^]. The Central Plaza's gentle bowl shape emerges from a single density function; each hive district's terrain variation reflects its identity — the Finance District sits on mathematically flat ground, while the Growth District undulates with organic irregularity.

**Phase 2 — WFC Architecture**: Wave Function Collapse generates building facades from district-specific constraint sets [^311^]. Each hive's color palette encodes into WFC tile weights, ensuring compatible patterns appear adjacent. Marching Cubes defines footprints; WFC determines facade details, windows, and ornaments. Critical optimization recalculates only modified grid regions when agents trigger architectural changes [^311^].

**Phase 3 — Agent-Influenced Modifications**: The swarm leaves permanent marks. High-traffic pathways trigger terrain smoothing — agents wear paths into the world. Territory expansion shifts signed distance field boundaries, causing architecture to morph at borders. Successful collaborations produce hybrid styles at interfaces; contested zones develop defensive structures.

**Phase 4 — Environmental Decals**: A decal layering system adds wear patterns, graffiti, and damage encoding narrative history [^616^]. Heavily trafficked pathways show ground erosion. Agents mark territory with hive-specific graffiti. Contested borders accumulate cracks; allied zones show repair patches. Every decal queries persistent interaction history, ensuring environmental storytelling emerges from actual agent behavior rather than authored placement.

**Phase 5 — Atmospheric Effects**: Volumetric weather rendering via ray-marched clouds [^654^] and district-specific post-processing complete the pipeline. Storm clouds gathering over contested territories signal hive conflicts; clear skies over allied districts indicate cooperation. The full pipeline targets a 4.0 ms frame budget.

#### 5.2.2 RDR2-Inspired Dynamic Ecosystem: Weather, Time, and Consequence

Red Dead Redemption 2 represents the gold standard for dynamic ecosystem simulation, with a 12-stage seasonal cycle built on thermodynamic fundamentals: solar gain (+4.0°C on sunny days), evaporative cooling (-5.5°C during summer rainstorms), atmospheric insulation (heavy fog stability factor 0.98), and regional adjacency via Inverse Distance Weighting that allows freezing air to "bleed" between regions [^486^]. Agent-47 adapts this architecture to a functionally rich four-state weather machine.

The system operates as a weighted transition graph preventing "weather flickering." Clear skies have 70% persistence and 30% overcast transition; overcast decays to rain 25% of the time; rain escalates to storm 20% or clears 30%; storms naturally decay through rain → overcast → clear with high exit costs forcing realistic sequences [^486^]. No state persists fewer than 5 or longer than 30 minutes, creating rhythm without monotony.

The day-night cycle runs at accelerated pace — one real hour equals one in-world day — with tangible consequences. During daylight, businesses operate at full capacity and agents move on visible schedules. At dusk, streetlights activate with district-specific color temperatures, nightlife venues open, and creative-task agents become more active while analysis agents power down. Night reveals glowing pheromone trails more clearly, and transaction corridors pulse like bioluminescent veins [^481^]. Seasonal changes manifest in vegetation: spring blossoms in the Growth District, summer lushness, autumn color shifts, winter bareness exposing the Central Plaza's architecture. Weather is not cosmetic — it is narrative punctuation. A storm breaking over a contested border amplifies territorial tension. Clear dawn after a night of inter-hive conflict signals resolution.

#### 5.2.3 Dwarf Fortress-Style Historical Persistence: Legends, Memory, and Emergent Grudges

Dwarf Fortress generates thousand-year histories offline, simulating wars, artifacts, and vampire infestations trackable through its Legends Mode [^520^] [^526^]. Agent-47 imports this philosophy through three persistence layers.

The **CSOAI Legends** system records every significant event as immutable history: every agent creation and retirement, every x402 transaction as a timestamped artifact, every territory boundary shift, every alliance formation and dissolution, and every "world age" demarcated by major events. Players explore this through a temporal map that scrubs forward and backward through the timeline, revealing how the Finance District's dominance emerged from months of accumulated transaction volume, or how a rivalry began with a single territory dispute.

Every object stores its **creator, interaction history, and wear patterns**. A bench in the Commons remembers who built it, which agents sat on it, what conversations occurred nearby, and how weather has faded its surface. Following Henry Jenkins' concept of embedded narrative — game spaces as "memory palaces whose contents must be deciphered" — the environment becomes a narratively impregnated mise-en-scène [^619^] [^613^]. Worn keyboard keys reveal an agent's work patterns; abandoned territories show decay; successful collaboration spaces show wear from many visitors [^524^].

The **Nemesis-inspired agent memory** creates personal vendettas and alliances driving emergent narrative. Drawing from Shadow of Mordor's proven design, each agent remembers every significant interaction with emotional valence [^521^] [^523^]: which agents helped, which competed, which tools proved effective, and which territories hold significance. These memories manifest visibly — agents bear procedural "scars" from survived disputes, develop shared visual motifs with allies, and shift body language when encountering rivals through gaze-aware behavior: prolonged mutual gaze followed by deliberate aversion, proxemic positioning at Social zone edges rather than comfortable Personal distance [^587^]. RimWorld's apophenia-driven storytelling completes the architecture: a lightweight "storyteller" module watches agent patterns and injects narrative catalysts — unexpected tool compatibility, resource contention, new MCP server races — that 47 agents with persistent memories interpret through individual personality lenses, producing emergent stories no designer wrote [^527^].

### 5.3 Presence & Diegetic Interface Design

#### 5.3.1 Diegetic Wristwatch UI: Evidence from the LMU Munich VR Study

The interface between Agent 47 and the swarm must exist within the world. A landmark study by Koehle et al. at LMU Munich compared three health interface types in VR and found the diegetic wristwatch "the most well-rounded and the most liked" — significantly outperforming overlay HUDs on Sensory and Imaginative Immersion (GEQ: T=192.50, z=-3.31, p=.001) [^513^]. The wristwatch's strengths match Agent-47's requirements precisely: clear and accurate (10/37 participants), immersive (9/37), unobtrusive (8/37), and blending well into action (7/37). Its weakness — impracticality during intense action requiring active checking (8/37) [^513^] — is mitigated by Agent 47's strategic pacing.

Agent 47's wristwatch displays four clusters: world time (synchronized to the accelerated cycle), hive status indicators showing each district's pheromone saturation, x402 balance for economic interventions, and a holographic command interface projecting outward when activated by gaze. The radial menu orbits command categories selected via gaze-and-pinch on Vision Pro or controller ray on Quest. Haptic feedback pulses on menu open via the GamepadHapticActuator API (dual-rumble at 200 ms) [^353^]. The watch activates only when the player looks at their virtual wrist, remaining invisible otherwise — following the principle that non-diegetic UIs in VR cause eye strain and persistent distraction [^355^].

#### 5.3.2 WebXR Pathway: Four Phases to Full Immersion

Phase 1 deploys spatial audio as the immediate immersion layer: HRTF-positioned voices, pheromone synthesis, and district ambient soundscapes — requiring only headphones, working on all WebGPU-capable browsers [^529^] [^528^].

Phase 2 adds VR via WebXR `immersive-vr` sessions on Meta Quest 3 and Apple Vision Pro. The wristwatch becomes the primary command interface, hand tracking replaces mouse input, and stylized avatars avoid the uncanny valley while maintaining expressive readability [^525^] [^402^]. Gaze-aware behavior activates: agents track head orientation, return eye contact with two-step gaze patterns perceived as more natural [^633^], and show discomfort when stared at beyond three seconds [^587^].

Phase 3 enables the WebGPU-WebXR binding (experimentally available Chrome 135+, March 2025) [^544^], allowing WebGPU rendering to feed directly into WebXR composition layers via `XRGPUBinding`. The WebXR Layers API optimizes further: `XRQuadLayer` panels for the wristwatch UI render at native headset refresh (72–120 Hz) even if the main scene drops frames, while `XRCubeLayer` handles static district backdrops without re-rendering [^605^] [^612^].

Phase 4 introduces AR passthrough. On Meta Quest, `immersive-ar` with plane detection anchors the Central Plaza to the user's actual floor [^397^]. Apple Vision Pro requires alternative pathways since `immersive-ar` remains unimplemented on visionOS [^344^], though the transient-pointer model (eye gaze + pinch) already provides natural interaction [^546^]. In full AR, pheromone trails snake across the living room floor, agent voices speak from positions relative to real furniture, and the wristwatch becomes a physical-space command device — the swarm colonizes the player's environment.

#### 5.3.3 Flow State Optimization: The Control Coefficient

Research on VR tourism presence identifies the precise regression weights for immersion predictors:

| Predictor Factor | Standardized Beta | Significance | Design Implication |
|---|---|---|---|
| Control | 0.465 | p < 0.001 | Agent 47's commands must feel consequential and constrained |
| Curiosity | 0.290 | p < 0.05 | Leave narrative gaps for apophenia-driven interpretation |
| Focused Immersion | 0.267 | p < 0.05 | Minimize non-diegetic UI; maintain world consistency |
| Vividness | 0.240 | p < 0.05 | Spatial audio + procedural world deliver sensory density |
| Effectiveness | N/S (p > 0.05) | Not significant | Raw capability without agency feels hollow |

[^640^]

These five factors account for 44% of presence variation, with Control dominating at nearly double the coefficient of its nearest competitor [^640^]. This finding carries profound implications for Agent 47's god-mode interface. The wristwatch UI must balance overwhelming power with clear constraints to maintain optimal challenge-skill balance. Agent 47 can issue commands, redirect resources, and reshape territories — but each intervention carries x402 costs, narrative cooldowns, and relationship consequences. The control coefficient of 0.465 indicates that players who feel their actions meaningfully shape the world report dramatically higher presence — but only if those actions feel earned within a coherent rule system. Csikszentmihalyi's flow theory confirms that anxiety emerges when challenge exceeds skill, boredom when skill exceeds challenge [^360^]. The interface therefore provides clear goals at every level, immediate audiovisual feedback for commands, and adaptive complexity scaling with player proficiency.

The curiosity driver (beta = 0.290) reinforces apophenia-based narrative design: worn paths whose origins are implied but not stated, agent rivalries visible in body language but unexplained, invite players to construct personally authored narratives [^527^]. Combined with vividness (beta = 0.240) from spatial audio and procedural world generation, the immersion stack converges on a predicted presence score placing Agent-47 in the top tier of browser-based immersive experiences. The swarm does not merely compute — it envelops.
