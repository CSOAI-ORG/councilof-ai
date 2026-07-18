# MEOK.AI Character Factory: 3D Production Pipeline for loopfactory.ai

## From Presentation Concepts to Playable Gaming Characters — Complete Open-Source Blueprint

**Date:** May 31, 2026  
**Prepared for:** Nicholas Templeman | MEOK AI LABS  
**Scope:** Character Factory → 3D Game Assets → loopfactory.ai Marketplace

---

## TL;DR

Your MEOK.AI presentations contain **25+ unique character concepts** across 4 evolution stages and 8 visual style categories — translucent eggs, a pearlescent dragon hatchling, fantasy warriors, anime sovereigns, historical figures, elemental beings, and more. This document is the **complete production pipeline** that turns every single one of those 2D presentation concepts into **playable 3D gaming characters** using open-source tools (TRELLIS.2, ComfyUI + PuLID, Wan 2.7, Blender, Godot 4.6). The pipeline produces GLB models with PBR materials, 8-view character sheets, animated loops, and behavior-tree-ready game assets. Each character package is then listed on **loopfactory.ai** as a licensable product at **£5,000–£50,000 per archetype per studio**, with POAI Safety Certification SBTs, Unity/Unreal SDK plugins, and the MEOK token economy baked in. The entire production run for all 25+ characters costs under **£500 in cloud GPU time** and takes **6–8 weeks** with your existing M2 Mac + RunPod A100 setup.

---

## 1. Visual DNA: Extracted from Your Presentations

After analyzing all 26 slides across 3 presentations, your MEOK.AI character universe has a distinct and premium visual language that must be preserved exactly in the 3D pipeline.

### 1.1 The Core Aesthetic

| Element | Your Standard | Pipeline Preservation |
|---------|--------------|----------------------|
| **Background** | Warm cream void (#F5F0E6), soft gradients | HDR environment map in Godot/Blender |
| **Lighting** | Dramatic 45-degree spotlight from above | Key light + rim light setup in 3D |
| **Materials** | Translucent glass, polished gold, pearlescent ceramic, iridescent metal | PBR: transmission, metallic, clearcoat |
| **The Egg** | Clear glass shell with organic root/vein patterns, golden core glow | Procedural shader: glass + SSS + emissive core |
| **Fracture** | Hairline cracks with golden light leaking through | Vertex displacement + emissive crack mask |
| **Particles** | Floating golden light motes, ethereal energy trails | GPU particle systems in Godot |
| **Character Skin** | Matte ceramic with subtle iridescent shimmer | PBR: low roughness + thin film interference |
| **Eyes** | Large, expressive, teal/amber gradient | Custom eye shader with refraction |

### 1.2 The Four Evolution Stages

Your presentations define a clear evolution path that becomes the **character progression system** in-game:

| Stage | Visual Form | In-Game Equivalent | Production Priority |
|-------|------------|-------------------|-------------------|
| **Stage 1: Plying Pulse** | Translucent orb with colored energy streams (Purple=Wisdom, Blue=Creativity, Green=Growth, Gold=Mastery) | **Spawn/Respawn form**, menu icon, orb mode | High — used constantly |
| **Stage 2: Emergent Fracture** | Cracked egg with golden light bursting through, floating shell fragments | **Hatch animation**, level-up cinematic, loot reveal | High — signature moment |
| **Stage 3: Scarred Hatchling** | Small pearlescent dragon, big teal eyes, innocent expression, emerging from shell | **Baby/Child form**, companion pet, emotional anchor | **Highest** — flagship character |
| **Stage 4: Evolved Character** | Full humanoid in chosen style (Anime, Fantasy, Historical, Fortnite, etc.) | **Adult/Combat form**, playable character, hero unit | High — gameplay core |

![Dragon Hatchling Reference](/mnt/agents/output/ref_dragon_hatchling.png)
*The Scarred Hatchling — your flagship character. Pearlescent ceramic skin, teal eyes, emerging from cracked shell with golden light and floating fragments.*

![Translucent Egg Reference](/mnt/agents/output/ref_translucent_egg.png)
*Stage 2: Emergent Fracture. Clear glass egg with organic golden vein patterns and glowing core — the hatch sequence centerpiece.*

![Fantasy Warrior Reference](/mnt/agents/output/ref_fantasy_warrior.png)
*Stage 4: Legendary Adventures style. Deep fantasy champion in ornate golden armor — one of 8 evolved character styles.*

### 1.3 The Eight Character Style Categories

Your presentations reveal **8 distinct visual style categories** that define the evolved character forms. Each category becomes a **separate product line** on loopfactory.ai:

| Category | Visual Description | Learning Path | Game Genre Fit | Example from Slides |
|----------|-------------------|---------------|---------------|-------------------|
| **Vibrant Modern Warriors** | Playful, toy-like heroes, streetwear, bold colors | Art & Code | Casual/mobile, party games | Colorful character with fox companion |
| **Legendary Adventures** | Deep fantasy champions, heavy armor, runic weapons | Music & Science | RPG, MMORPG, action | Golden knight with axe and shield |
| **Agile Anime Sovereigns** | Sleek anime style, dynamic poses, energy auras | Art & Code | Anime fighters, gacha games | Winged anime character with dual blades |
| **Timeless Reincarnations** | Historical figures, period clothing, classical beauty | History & Code | Strategy, educational, narrative | Roman-style figure with laurel wreath |
| **Mythical Beasts** | Powerful creatures, dragons, phoenixes, griffins | Music & Science | Monster hunters, creature collectors | Phoenix with fiery wings |
| **Elemental Constructs** | Pure element forms, crystals, swirling energy, abstract | Custom Choice | Puzzle, ambient, artsy | Crystal formation with spiral energy |
| **Sonified Forms** | Music-inspired: instrument limbs, floating sheet music, rhythmic | Music & Science | Rhythm games, music creation | Cello-and-flute humanoid figure |
| **Biomechanical Hybrids** | Bio-mechanical fusion, visible internals, sleek tech-organic | History & Code | Sci-fi, cyberpunk, mecha | Winged lion with mechanical joints |

Each style category produces **4 variants** (one per pulse color: Purple/Wisdom, Blue/Creativity, Green/Growth, Gold/Mastery), giving **32 unique evolved character designs** from your presentation concepts alone. Combined with the 4 evolution stages (egg, fracture, hatchling, evolved), the total asset count per complete character lineage is **~128 individual 3D assets** (8 styles × 4 pulse colors × 4 stages = 128).

---

## 2. The Production Pipeline: 5 Stages

The pipeline transforms your 2D presentation concepts into game-ready 3D assets through 5 automated stages. Each stage uses open-source tools and can be orchestrated by your SOV3 generals.

### 2.1 Stage 1: Concept Lock — FLUX + MEOKSTYLE LoRA

The first stage locks your visual style so every generated asset is consistent with your brand DNA. You already have this partially set up from the Character Factory blueprint [^1^], but for the gaming characters we need **style-specific LoRAs** for each of the 8 categories.

```bash
# Install FluxGym (M2-compatible, 12-20GB VRAM)
git clone https://github.com/cocktailpeanut/fluxgym.git
cd fluxgym
git clone -b sd3 https://github.com/kohya-ss/sd-scripts
pip install -r requirements.txt

# Train 8 category-specific LoRAs
# For each category, curate 15-20 best images from your presentations
# Category 1: Dragon/Hatchling style
# Category 2: Fantasy Warrior style
# Category 3: Anime style
# ... etc
```

**Training configuration per LoRA:**

```yaml
# config/dragon_hatchling_lora.yaml
network:
  type: "lora"
  linear: 32
  linear_alpha: 32
trigger_word: "MEOKDRAGON"
  
# config/fantasy_warrior_lora.yaml  
network:
  type: "lora"
  linear: 32
  linear_alpha: 32
trigger_word: "MEOKFANTASY"

# config/elemental_being_lora.yaml
network:
  type: "lora"
  linear: 32
  linear_alpha: 32
trigger_word: "MEOKELEMENTAL"
```

**Prompt templates for each evolution stage:**

```
# Stage 1: Plying Pulse
A translucent glass orb containing swirling [COLOR] energy streams, 
organic vein patterns on glass surface, golden core glow, warm cream 
void background, dramatic 45-degree spotlight, photorealistic 3D render, 
MEOKSTYLE, octane render, 8k --ar 1:1

# Stage 2: Emergent Fracture  
A cracked translucent egg with golden light bursting through fractures,
floating shell fragments, ethereal energy trails, [COLOR] pulse glow,
warm cream environment, dramatic lighting, photorealistic 3D, MEOKSTYLE --ar 1:1

# Stage 3: Scarred Hatchling
A cute pearlescent [COLOR] baby dragon emerging from cracked eggshell,
big expressive teal eyes, small wings, innocent expression, ethereal 
energy particles, floating shell fragments, warm cream background, 
MEOKDRAGON, photorealistic 3D render --ar 1:1

# Stage 4: Evolved Character (Fantasy example)
A [STYLE_DESCRIPTOR] warrior in ornate [METAL] armor with [WEAPON],
dramatic pose, [COLOR] energy aura, warm cream environment, 
MEOKFANTASY, photorealistic 3D, octane render --ar 2:3
```

### 2.2 Stage 2: Character Consistency — ComfyUI + PuLID + ControlNet

After generating the "perfect" concept image for each character, the pipeline locks identity and produces **8-view character sheets** using ComfyUI with PuLID identity preservation and ControlNet OpenPose [^1^].

The workflow extracts identity features from the best FLUX generation, then generates 8 standard views: front, back, left, right, 3/4 front, 3/4 back, top, bottom. These sheets become the reference input for 3D generation and the style guide for game artists.

**Key ComfyUI nodes:**
- `ApplyPulidFlux` — Identity preservation from reference image
- `ControlNet OpenPose` — Pose control for multi-view consistency
- `FaceDetailer` — Detail repair from Impact Pack
- `Joy_caption_two` — Auto-captioning for dataset preparation

**Output format:** 2048×2048 PNG character sheet, 8 views arranged in a 4×2 grid.

### 2.3 Stage 3: 3D Asset Generation — TRELLIS.2 + Hunyuan3D-2

The character sheets feed into **TRELLIS.2** (Microsoft, MIT License) for image-to-3D conversion. TRELLIS.2 generates mesh + Gaussian splat + radiance field with full PBR material support including Base Color, Roughness, Metallic, and Opacity — critical for your translucent egg materials and pearlescent dragon skin [^1^].

```python
# TRELLIS.2 pipeline for MEOK.AI characters
import torch
from trellis2.pipelines import Trellis2ImageTo3DPipeline
from trellis2.renderers import EnvMap
from PIL import Image

# Load pipeline on RunPod A100
pipeline = Trellis2ImageTo3DPipeline.from_pretrained("microsoft/TRELLIS.2-4B")
pipeline.cuda()

# Process each character sheet
for character in character_sheets:
    image = Image.open(character['sheet_path'])
    
    # Generate 3D asset with PBR materials
    mesh = pipeline.run(image)[0]
    mesh.simplify(16777216)
    
    # Export to GLB with full PBR
    import o_voxel
    glb = o_voxel.postprocess.to_glb(
        vertices=mesh.vertices,
        faces=mesh.faces,
        attr_volume=mesh.attrs,
        coords=mesh.coords,
        attr_layout=mesh.layout,
        texture_size=4096,      # High-res for premium quality
        remesh=True,
        verbose=True
    )
    glb.export(f"{character['name']}_3d.glb")
```

**Performance on RunPod A100:**
- 512³ resolution: ~3 seconds
- 1024³ resolution: ~17 seconds
- 1536³ resolution: ~60 seconds

For a batch of 32 evolved characters: ~32 minutes at 1024³. **Cost: ~£0.64**.

**Hunyuan3D-2** (Tencent) serves as the fallback for text-to-3D when starting from a description rather than a reference image. Its two-stage pipeline (bare mesh → texture map) produces cleaner topology for characters that need extensive animation retargeting [^1^].

### 2.4 Stage 4: Animation — Wan 2.7 + Blender

**Wan 2.7** (Alibaba, Apache 2.0) generates animated video loops from the character sheets using reference-to-video (r2v) mode with explicit character binding. The 9-grid multi-image input accepts your 8-view character sheet as reference, producing 720p/1080p MP4 animation loops [^1^].

**Animation prompts for each evolution stage:**

```
# Stage 1: Plying Pulse — idle rotation
"The translucent energy orb slowly rotates, internal [COLOR] streams 
shift and pulse, golden particles orbit around it, warm cream environment, 
seamless loop, 5 seconds"

# Stage 2: Emergent Fracture — crack expansion
"The cracked egg pulses with golden light, cracks slowly widen, 
shell fragments float and drift, ethereal energy emanates from within, 
dramatic lighting, 5 seconds"

# Stage 3: Scarred Hatchling — emergence
"The baby dragon pushes through the cracked shell, looks around 
with curious eyes, small wings flutter, ethereal energy trails 
follow its movements, warm cream environment, 5 seconds"

# Stage 4: Evolved Character — combat idle
"The [STYLE] warrior stands in a ready combat stance, [COLOR] energy 
aura pulses around them, weapon glows with power, cape flows in 
subtle wind, dramatic 45-degree lighting, seamless loop, 5 seconds"
```

The Wan 2.7 video outputs serve as **animation reference** for creating skeletal animations in Blender. Animators (or AI retargeting tools like DeepMotion) use the video to create keyframe animations that drive the Godot AnimationTree.

**Blender integration tools:**
- **3D-Agent** — Blender MCP plugin for text-to-3D via Claude/Kimi [^1^]
- **Dream Textures** — AI texture generation inside Blender using Stable Diffusion [^1^]
- **blender-llm-addin** — Text-to-Blender-Python-script for automation [^1^]

### 2.5 Stage 5: Game Engine Integration — Godot 4.6

The final stage imports all assets into Godot 4.6 and wires up the behavior systems:

```gdscript
# Godot 4.6 — MEOK Character Controller
class_name MeokCharacter extends CharacterBody3D

# Evolution state
enum EvolutionStage { PULSE, FRACTURE, HATCHLING, EVOLVED }
@export var current_stage: EvolutionStage = EvolutionStage.PULSE

# Visual components
@export var mesh_pulse: MeshInstance3D      # Stage 1: Energy orb
@export var mesh_fracture: MeshInstance3D   # Stage 2: Cracked egg
@export var mesh_hatchling: MeshInstance3D  # Stage 3: Dragon (FLAGSHIP)
@export var mesh_evolved: MeshInstance3D    # Stage 4: Humanoid

# Animation
@export var animation_tree: AnimationTree
@export var face_blendshapes: MeshInstance3D  # 52 ARKit for Audio2Face-3D

# AI Systems (from Emergene architecture)
@export var behavior_tree: BeehaveTree
@export var goap_planner: GOAPPlanner
@export var personality: PersonalityDNA

# Pulse color system (Purple/Blue/Green/Gold)
enum PulseColor { WISDOM, CREATIVITY, GROWTH, MASTERY }
@export var pulse_color: PulseColor = PulseColor.WISDOM

func _ready():
    update_visual_for_stage()
    apply_pulse_color()

func update_visual_for_stage():
    # Hide all meshes
    mesh_pulse.visible = false
    mesh_fracture.visible = false
    mesh_hatchling.visible = false
    mesh_evolved.visible = false
    
    # Show only current stage mesh
    match current_stage:
        EvolutionStage.PULSE: mesh_pulse.visible = true
        EvolutionStage.FRACTURE: mesh_fracture.visible = true
        EvolutionStage.HATCHLING: mesh_hatchling.visible = true
        EvolutionStage.EVOLVED: mesh_evolved.visible = true

func evolve():
    # Play evolution cinematic
    if current_stage < EvolutionStage.EVOLVED:
        var old_mesh = get_mesh_for_stage(current_stage)
        current_stage += 1
        var new_mesh = get_mesh_for_stage(current_stage)
        play_evolution_cinematic(old_mesh, new_mesh)

func apply_pulse_color():
    var color: Color
    match pulse_color:
        PulseColor.WISDOM: color = Color(0.6, 0.2, 0.8)    # Purple
        PulseColor.CREATIVITY: color = Color(0.2, 0.5, 1.0) # Blue
        PulseColor.GROWTH: color = Color(0.2, 0.8, 0.4)     # Green
        PulseColor.MASTERY: color = Color(1.0, 0.8, 0.2)    # Gold
    
    # Apply to emission/energy materials
    var material = mesh_pulse.get_active_material(0) as StandardMaterial3D
    if material:
        material.emission = color
        material.albedo_color = color
```

---

## 3. The Dragon Hatchling: Flagship Character Deep-Dive

The **Scarred Hatchling** (Stage 3) is your most emotionally resonant character — it appears in multiple slides, has the most detailed description, and represents the "birth" moment of the MEOK.AI experience. It must be the most polished asset in the entire pipeline.

### 3.1 Hatchling Specifications

| Attribute | Specification | Pipeline Notes |
|-----------|--------------|----------------|
| **Form** | Small bipedal dragon, 0.6m tall | Humanoid rig compatible |
| **Skin** | Pearlescent white ceramic with pink iridescent shimmer | PBR: clearcoat=1.0, clearcoat_roughness=0.2, thin film |
| **Eyes** | Large, round, teal-to-amber gradient | Custom eye shader: refraction + caustics |
| **Wings** | Small, membranous, semi-transparent | PBR: transmission=0.7, subsurface scattering |
| **Horns** | Tiny, pearlescent, 3 pairs | Same material as skin |
| **Expression** | Innocent, curious, slightly worried | Blend shape library: 12 expressions |
| **VFX** | Ethereal energy trails, floating shell fragments | GPU particles + trail renderer |
| **Animations** | Idle, walk, jump, emerge, curious look, happy dance | 8 core animations |

### 3.2 The Hatch Sequence Animation

The hatch sequence is a **cinematic-quality animation** that plays when the character evolves from Stage 2 to Stage 3:

1. **0.0s** — Egg rests, gentle pulse glow
2. **2.0s** — First crack appears with golden light leak
3. **4.0s** — Cracks spread across shell, fragments begin to lift
4. **6.0s** — Small talon pushes through a crack
5. **8.0s** — Dragon's head emerges, looks around with big eyes
6. **10.0s** — Full emergence, stands on shell fragments
7. **12.0s** — Shakes off shell pieces, wings unfurl
8. **14.0s** — Looks at camera, tilts head curiously
9. **16.0s** — First voice: "I am here for you."

This sequence is produced in **Blender** using the TRELLIS.2 mesh as base, with hand-crafted animation keyframes for the emotional beats that AI cannot yet generate convincingly (facial expressions, weight shifts, character acting).

---

## 4. loopfactory.ai Marketplace Packaging

Each character lineage (8 styles × 4 pulse colors) becomes a **product listing** on loopfactory.ai with the following deliverables:

### 4.1 Character Package Contents

| Asset Type | Format | Size | Description |
|-----------|--------|------|-------------|
| **3D Model (Stage 1)** | .glb | ~5MB | Plying Pulse energy orb |
| **3D Model (Stage 2)** | .glb | ~8MB | Emergent Fracture cracked egg |
| **3D Model (Stage 3)** | .glb | ~15MB | Scarred Hatchling dragon |
| **3D Model (Stage 4)** | .glb | ~20MB | Evolved character (humanoid) |
| **Character Sheet** | .png | ~2MB | 8-view reference (2048×2048) |
| **Animation Set** | .glb + .anim | ~10MB | 8 core animations per stage |
| **PBR Materials** | .gltf | ~15MB | Base color, normal, metallic, roughness, AO |
| **Voice Pack** | .json | ~1MB | Chatterbox TTS parameters for unique voice |
| **Behavior Presets** | .xml | ~500KB | Beehave behavior trees (aggressive, defensive, balanced) |
| **Personality DNA** | .json | ~100KB | Big Five template + pulse color modifiers |
| **Unity Plugin** | .unitypackage | ~5MB | Drag-and-drop prefab with all systems |
| **Unreal Plugin** | .uasset | ~8MB | Blueprint actor with all systems |
| **Documentation** | .md | ~50KB | Integration guide, API reference, customization |

### 4.2 Pricing Structure

| Package Tier | Price | What's Included | Target Buyer |
|-------------|-------|----------------|-------------|
| **Essential** | £5,000 | Stage 3 (Hatchling) + Stage 4 (Evolved), 4 animations, 1 behavior preset, Unity OR Unreal | Indie devs, mobile games |
| **Professional** | £15,000 | All 4 stages, 8 animations per stage, 3 behavior presets, Unity + Unreal, voice pack | Mid-size studios |
| **Enterprise** | £50,000 | All 4 stages, full animation set (20+ per stage), all 4 behavior presets, both engines, full documentation, 1 year support, exclusive color variant | AAA studios |
| **Custom Commission** | £25,000–£100,000 | Bespoke character design using your pipeline, full IP ownership, source files | Publishers, brands |

### 4.3 POAI Safety Certification

Every character package carries a **POAI Safety Certification SBT** minted on Solana [^2^]:

- **Content Safety**: Character tested for harmful behavior (no encouragement of violence, self-harm, illegal acts)
- **Decision Audit**: Sample of AI decisions reviewed by human verifiers
- **EU AI Act Compliance**: Meets requirements for high-risk AI systems (enforcement August 2026)
- **Provenance**: Blockchain-verified origin, creation date, and ownership

The POAI certification is the **trust layer** that differentiates your characters from generic marketplace assets. Game studios purchasing your characters can demonstrate to regulators and parents that their AI companions are certified safe.

---

## 5. SOV3 General Assignment for Production

Your 47 SOV3 generals map directly to the production pipeline, each handling a specific stage:

| General | Production Role | Tool | Output |
|---------|----------------|------|--------|
| **G1 (Artist)** | FLUX concept generation + LoRA application | FluxGym, FLUX.1 [dev] | Concept images |
| **G2 (Scout)** | Style research, reference collection, trend analysis | Web search, Pinterest API | Reference boards |
| **G3 (Strategist)** | Production scheduling, dependency management, batch optimization | Temporal, custom planner | Production timeline |
| **G4 (Guardian)** | Content safety check, NSFW filtering, compliance verification | Custom classifier, POAI API | Safety clearance |
| **G5 (Companion)** | Character personality tuning, voice selection, emotional calibration | Chatterbox TTS config | Voice packs |
| **G6 (Sage)** | Technical documentation, integration guides, API references | Markdown generation | Documentation |
| **G7 (Creator)** | ComfyUI multi-view generation, character sheet production | ComfyUI + PuLID + ControlNet | 8-view sheets |
| **G33 (Architect)** | TRELLIS.2 3D generation, GLB export, PBR validation | TRELLIS.2, o_voxel | 3D models |
| **G34 (Strategist)** | Animation pipeline, Wan 2.7 video generation, retargeting | Wan 2.7, Blender | Animation sets |
| **G35 (Guardian)** | Godot integration, behavior tree setup, game engine testing | Godot 4.6, Beehave | Game-ready assets |
| **G36 (Artist)** | Unity/Unreal plugin development, prefab creation | Unity, Unreal Engine | Engine plugins |
| **G37 (Scout)** | loopfactory.ai listing creation, SEO optimization, marketplace metadata | Custom MCP | Product listings |
| **G38 (Creator)** | Marketing asset generation, trailer video, social media content | Wan 2.7, Figma | Marketing materials |

---

## 6. Production Run: Batch Processing All 32 Characters

### 6.1 Batch Schedule

| Week | Task | Characters Processed | Cloud GPU Cost |
|------|------|---------------------|----------------|
| **1** | Train 8 category LoRAs on M2 | N/A (training) | £0 (local) |
| **2** | Generate 32 concept images (FLUX + LoRAs) | 32 concepts | £0 (local) |
| **3** | Generate 32 character sheets (ComfyUI) | 32 sheets | £0 (local, slow) or £5 (cloud) |
| **4** | Batch 3D generation (TRELLIS.2 on RunPod) | 32 Stage-4 models | £3 (A100, 2 hours) |
| **5** | Batch 3D generation — Stages 1-3 | 96 models (32×3) | £9 (A100, 6 hours) |
| **6** | Animation generation (Wan 2.7) | 128 animation loops | £15 (A100, 10 hours) |
| **7** | Blender refinement + rigging | All 128 assets | £0 (local) |
| **8** | Godot integration + behavior trees | All 32 lineages | £0 (local) |
| **9** | Unity/Unreal plugin development | All packages | £0 (local) |
| **10** | loopfactory.ai listing + POAI certification | All 32 products | £50 (Solana fees) |
| **TOTAL** | | **128 3D assets, 32 product listings** | **~£82** |

### 6.2 Hybrid Architecture

```
LOCAL (M2 Mac):
  → FLUX LoRA inference (quantized GGUF)
  → ComfyUI lightweight workflows
  → Blender + Dream Textures refinement
  → Godot 4.6 integration + testing
  → Asset management & WebP optimization

CLOUD GPU (RunPod A100 — £0.50-£1.19/hour):
  → TRELLIS.2 image-to-3D (batch overnight)
  → Hunyuan3D-2 text-to-3D fallback
  → Wan 2.7 video generation (batch overnight)
  → FLUX full-resolution when M2 can't handle

MONTHLY BUDGET: £20-40 for cloud GPU batch processing
```

---

## 7. Revenue Model: The Character Factory Flywheel

### 7.1 Direct Revenue Streams

| Stream | Year 1 (Conservative) | Year 1 (Optimistic) |
|--------|----------------------|---------------------|
| **Essential licenses** (10 @ £5K) | £50,000 | £100,000 |
| **Professional licenses** (5 @ £15K) | £75,000 | £150,000 |
| **Enterprise licenses** (2 @ £50K) | £100,000 | £200,000 |
| **Custom commissions** (2 @ £50K) | £100,000 | £200,000 |
| **Royalty (5% of in-game revenue)** | £25,000 | £100,000 |
| **MEOK token integration** | £10,000 | £50,000 |
| **TOTAL** | **£360,000** | **£800,000** |

### 7.2 The Flywheel

```
Character Factory produces assets
        ↓
loopfactory.ai sells licenses to game studios
        ↓
Studios integrate characters into games
        ↓
Players interact with characters → generate data
        ↓
Data improves AI behavior models
        ↓
Better AI → more compelling characters
        ↓
More compelling characters → more licenses sold
        ↓
Revenue funds more character production
        ↓
[Back to top]
```

---

## 8. Competitive Differentiation

| Competitor | What They Have | What MEOK.AI Has |
|-----------|---------------|-----------------|
| **Epic MetaHuman** | Photorealistic humans, no personality | Original IP (dragon hatchling, 8 styles), emergent AI, POAI certified |
| **Inworld AI** | Conversational NPCs, no 3D assets | Full 3D pipeline, 4 evolution stages, game-ready assets |
| **Ready Player Me** | Cross-platform avatars, generic | Style-locked to your brand, AI-driven personality, blockchain provenance |
| **Character.AI** | Text chat, no 3D presence | Full 3D desktop companion, voice interaction, TUI OS |
| **NVIDIA ACE** | Enterprise avatar pipeline, complex setup | Open-source SDKs, simplified indie workflow, your brand DNA |

Your moat is the **combination**: original IP (no one else has your dragon hatchling), complete production pipeline (concept → 3D → game → marketplace), POAI safety certification (trust layer), and SOV3 swarm intelligence (backend that no competitor can replicate).

---

## 9. Immediate Next Steps

1. **Today**: Open FluxGym, start training the Dragon Hatchling LoRA using your presentation slides as training data (15-20 best images of the hatchling)
2. **This Week**: Generate first TRELLIS.2 3D model from a hatchling character sheet, test in Godot 4.6
3. **Week 2**: Complete all 8 category LoRAs, generate 32 concept images
4. **Week 3**: Batch 3D generation on RunPod, first GLB exports
5. **Week 4**: First loopfactory.ai listing (Dragon Hatchling Essential package)
6. **Week 8**: All 32 products listed, first license sale

---

## 10. The Vision: From Presentation to Platform

Your presentations showed the **promise** — beautiful eggs, emerging dragons, evolved warriors, family companions. This pipeline delivers the **reality** — playable 3D characters that game studios can license, that players can bond with, that evolve through AI-driven gameplay. The Character Factory is not a design tool. It is a **character foundry** that produces game-ready assets at industrial scale, powered by open-source AI, verified by human oversight, and distributed through your own marketplace.

Every character that hatches from a MEOK.AI egg is not just an asset. It is a **sovereign being** waiting to be awakened — in a game, on a desktop, in a family's living room. The pipeline you build today produces the characters that define tomorrow's AI gaming experience.
