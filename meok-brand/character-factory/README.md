# MEOK AI Labs — Character Factory 3D Asset Pipeline

> Open-source pipeline for generating translucent 3D character assets from the seven MEOK archetypes.  
> **Pipeline:** FLUX.1 [dev] + LoRA → TRELLIS.2 image-to-3D → ComfyUI + PuLID + ControlNet multi-view → Wan 2.7 animation

---

## Table of Contents

1. [Overview](#overview)
2. [Archetype Specifications](#archetype-specifications)
3. [Hardware Requirements](#hardware-requirements)
4. [Software Stack](#software-stack)
5. [10-Day Rebuild Schedule](#10-day-rebuild-schedule)
6. [LoRA Training Spec — `MEOKSTYLE`](#lora-training-spec--meokstyle)
7. [Style Guide](#style-guide)
8. [Output Formats](#output-formats)
9. [Project Structure](#project-structure)
10. [Usage](#usage)
11. [Environment Variables](#environment-variables)
12. [Troubleshooting](#troubleshooting)
13. [License](#license)

---

## Overview

The Character Factory transforms a single text prompt into a production-ready 3D asset for the MEOK ecosystem. Every character is a **translucent geometric vessel**—not a cartoon figure, not a photorealistic human, but a sacred object rendered in ceramic, crystal, resin, stone, or metal.

The pipeline is fully automated via `pipeline.py` and can be run end-to-end or stage-by-stage.

### Stages

| Stage | Tool | Purpose |
|-------|------|---------|
| 1. Character Sheet | FLUX.1 [dev] + `MEOKSTYLE` LoRA | Generate a high-resolution concept image with consistent translucent aesthetic. |
| 2. 3D Model | TRELLIS.2 | Image-to-3D reconstruction into a clean, water-tight mesh. |
| 3. Multi-View | ComfyUI + PuLID + ControlNet | Render 8 canonical views with identity preservation and depth consistency. |
| 4. Animation | Wan 2.7 | Generate a 2-second seamless idle animation (gentle breathing / float). |
| 5. Packaging | `pipeline.py` | Bundle GLB + textures + MP4 + metadata JSON. |

---

## Archetype Specifications

| Archetype | Symbol | Color (Hex) | Material Description |
|-----------|--------|-------------|----------------------|
| **Sovereign** | ◆ | `#C8A05C` | Faceted gold crystal |
| **Guardian** | ◈ | `#00D4AA` | Teal ceramic lattice |
| **Scout** | ○ | `#E8A85A` | Amber-fired clay |
| **Strategist** | □ | `#A8B4C0` | Brushed silver alloy |
| **Creator** | ◇ | `#D4A050` | Golden resin |
| **Companion** | ● | `#C89898` | Rose quartz pebble |
| **Sage** | ◎ | `#7AA87A` | Moss-green stone |

All values are exact. Prompt templates and generation scripts reference these by `archetype_id` (lowercase).

---

## Hardware Requirements

### Local — M2 Mac (Development / Orchestration)

- **Machine:** Mac Studio or MacBook Pro with M2 Pro/Max/Ultra
- **RAM:** 32 GB unified memory (minimum)
- **Storage:** 50 GB free (models, checkpoints, caches)
- **Role:** Run the orchestration script, manage file I/O, host ComfyUI frontend, and run lightweight inference (FLUX schnell / LoRA merge). Heavy generation is offloaded to cloud.

### Cloud — RunPod A100 (Training & Heavy Inference)

- **GPU:** NVIDIA A100 80 GB (or A100 40 GB with gradient checkpointing)
- **VRAM:** 80 GB
- **System RAM:** 64 GB
- **Storage:** 200 GB NVMe persistent volume
- **Role:** LoRA training (Kohya_ss / AI-Toolkit), TRELLIS.2 image-to-3D, Wan 2.7 animation rendering, ComfyUI backend with ControlNet + PuLID.

### Network

- Stable SSH tunnel or WireGuard between local Mac and RunPod.
- `rsync` or `rclone` for asset sync.

---

## Software Stack

| Component | Version / Branch | Notes |
|-----------|------------------|-------|
| Python | 3.11+ | Managed via `uv` or `venv` |
| FLUX.1 [dev] | `black-forest-labs/FLUX.1-dev` | 12B parameter diffusion model |
| `MEOKSTYLE` LoRA | Custom (see training spec) | Trained on 150 curated translucent-geometric images |
| TRELLIS.2 | `microsoft/TRELLIS` (latest main) | Sparse-view large reconstruction model |
| ComfyUI | `comfyanonymous/ComfyUI` (latest) | Node-based inference UI & API |
| PuLID | `comfyanonymous/ComfyUI` custom node | Identity-preserving face/character adapter |
| ControlNet | `diffusers_xl_depth_full` | Depth consistency for multi-view grid |
| Wan 2.7 | `Wan-2.1` or community port | Video generation model for idle animation |
| diffusers | ≥ 0.30 | HuggingFace diffusers library |
| transformers | ≥ 4.40 | For FLUX & TRELLIS pipelines |

### ComfyUI Custom Nodes Required

- `ComfyUI-Manager`
- `ComfyUI-PuLID`
- `ComfyUI-3D-Pack` (or `ComfyUI-TRELLIS` wrapper node)
- `ComfyUI-ControlNet-Aux` (for depth preprocessing)
- `WAS Node Suite` (grid compositing utilities)

---

## 10-Day Rebuild Schedule

> Assumes a cold start: no checkpoints, no LoRA, no dataset.

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Day 1** | Environment & dataset curation | Set up RunPod A100, install ComfyUI + custom nodes, curate 150 reference images for LoRA (translucent ceramic, crystal, resin, stone). |
| **Day 2** | LoRA training | Train `MEOKSTYLE` LoRA (Kohya_ss, 1,000 steps, rank 32). Validate on 7 archetype prompts. |
| **Day 3** | FLUX integration | Build `generate_character_sheet()` in `pipeline.py`. Wire FLUX API (local `diffusers` pipeline or RunPod endpoint). Generate all 7 sheets. |
| **Day 4** | TRELLIS.2 setup | Install TRELLIS.2 on RunPod. Build `generate_3d_model()`. Batch-process 7 character sheets into GLB meshes. Review & flag bad topology. |
| **Day 5** | Multi-view workflow | Design ComfyUI workflow JSON. Build `generate_multi_view()`. Test on 1 archetype. Refine lighting & depth consistency. |
| **Day 6** | Multi-view batch | Run multi-view for all 7 archetypes. Manual QA: check alignment, subsurface glow consistency, grid spacing. |
| **Day 7** | Wan 2.7 animation | Set up Wan 2.7 on RunPod. Build `generate_animation()`. Generate 2-second idle loops. Verify seamless cycling. |
| **Day 8** | Animation batch & QA | Batch animate all 7. Review MP4s: no flicker, consistent lighting, geometry holds. |
| **Day 9** | Packaging & metadata | Implement `package_outputs()`. Generate final bundles: GLB + textures + MP4 + metadata JSON. Test import into Three.js / Unity. |
| **Day 10** | Documentation & release | Polish README, write integration guide, push to GitHub, tag `v1.0.0`. |

---

## LoRA Training Spec — `MEOKSTYLE`

### Concept
A style LoRA that forces FLUX.1 [dev] into a **translucent geometric ceramic** aesthetic. It should be archetype-agnostic: given any color + material token, the model outputs a consistent rendering style.

### Dataset
- **Size:** 150 images (minimum 120 for stable training)
- **Content:** High-quality 3D renders and photographs of translucent objects:
  - Faceted crystals, glass sculptures, glazed ceramics
  - Resin art, polished stone, brushed metal vases
  - Studio-lit, white or parchment backgrounds
- **Captions:** BLIP / WD14 tagger + manual cleanup. Every caption includes trigger word `MEOKSTYLE`.
  - Example: `MEOKSTYLE, translucent teal ceramic lattice character, subsurface glow, warm studio lighting, white background, 8k render`
- **Aspect ratio:** 1:1 (1024×1024)
- **Pre-processing:** Resize & center-crop to 1024×1024, face/anonymize any humans (dataset must be object-only).

### Training Parameters (Kohya_ss / AI-Toolkit)

| Parameter | Value |
|-----------|-------|
| Base model | `black-forest-labs/FLUX.1-dev` |
| LoRA rank | 32 |
| LoRA alpha | 16 |
| Learning rate | 1e-4 (constant with warmup) |
| Warmup steps | 100 |
| Training steps | 1,000 |
| Batch size | 4 |
| Optimizer | AdamW (8-bit) |
| Resolution | 1024×1024 |
| Caption dropout | 0.05 |
| Network module | `networks.lora_flux` |

### Validation
After training, run the 7 archetype prompts at CFG 3.5 (FLUX default). If any output diverges from the style (e.g., becomes realistic human or opaque plastic), increase dataset diversity and retrain.

---

## Style Guide

All pipeline outputs must adhere to the following visual rules:

1. **Translucency** — Every character is a vessel; light passes through edges and thinner surfaces. No opaque blocks.
2. **Subsurface Scattering (SSS)** — Warm internal glow that matches the archetype color. SSS color = base color at 80% saturation.
3. **Geometric Primitives** — Forms built from clearly readable primitives: prisms, shields, eyes, cubes, pebbles, stones. No organic flesh.
4. **Materials** — Ceramic, crystal, resin, stone, metal. Each has distinct specular highlights and micro-surface detail.
5. **Lighting** — Warm studio lighting (key light 45° above, fill light from below, soft shadows). Background: pure white `#FFFFFF` or parchment `#F5F0E6`.
6. **Tactile & Spiritual** — The final asset should feel like holding a sacred object: weight, temperature, history.

---

## Output Formats

Each archetype produces a single packaged bundle under `outputs/<archetype_id>/`:

| File | Format | Purpose |
|------|--------|---------|
| `model.glb` | GLB 2.0 | Primary 3D asset (Three.js, Unity, Godot) |
| `model.obj` | Wavefront OBJ | Legacy compatibility (with MTL + textures) |
| `model.usdz` | USDZ | Apple ecosystem (QuickLook, RealityKit) |
| `animation.mp4` | H.264, 1080p, 30fps | Web-ready idle loop |
| `sprite_sheet.png` | 4×2 grid, 4096×2048 | Multi-view reference for UI / 2D fallback |
| `metadata.json` | JSON | Archetype data, prompts, provenance, hashes |

---

## Project Structure

```
character-factory/
├── README.md
├── pipeline.py              # Orchestration script
├── prompts.json             # Archetype & stage prompt templates
├── comfyui-workflow.json    # ComfyUI API workflow for multi-view
├── requirements.txt         # Python dependencies
├── outputs/                 # Generated bundles (gitignored)
├── checkpoints/             # LoRA & diffusion checkpoints (gitignored)
└── logs/                    # Pipeline run logs (gitignored)
```

---

## Usage

### Install

```bash
cd /Users/nicholas/clawd/meok-brand/character-factory
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

### Run full pipeline for one archetype

```bash
python pipeline.py --archetype sovereign --stage all --output-dir ./outputs
```

### Run individual stages

```bash
python pipeline.py --archetype guardian --stage sheet
python pipeline.py --archetype guardian --stage 3d
python pipeline.py --archetype guardian --stage multiview
python pipeline.py --archetype guardian --stage animation
python pipeline.py --archetype guardian --stage package
```

### Run all archetypes

```bash
for a in sovereign guardian scout strategist creator companion sage; do
  python pipeline.py --archetype $a --stage all --output-dir ./outputs
done
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLUX_API_URL` | `http://localhost:8080` | FLUX inference endpoint (ComfyUI or `diffusers` server) |
| `FLUX_API_KEY` | — | API key if using hosted endpoint |
| `TRELLIS_API_URL` | `http://localhost:8188` | TRELLIS.2 inference endpoint |
| `COMFYUI_URL` | `http://localhost:8188` | ComfyUI server URL for multi-view stage |
| `WAN_API_URL` | `http://localhost:8081` | Wan 2.7 inference endpoint |
| `OUTPUT_DIR` | `./outputs` | Base output directory |
| `LOG_LEVEL` | `INFO` | Python logging level |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| FLUX outputs realistic humans | LoRA not loaded or trigger word missing | Verify `MEOKSTYLE` is in the prompt; check LoRA path in API call. |
| TRELLIS mesh has holes | Input image background not pure white | Pre-process sheet with rembg or ensure white background in FLUX prompt. |
| Multi-view grid misaligned | ComfyUI custom nodes out of date | Update `ComfyUI-3D-Pack` and `WAS Node Suite`. |
| Animation flickers | Wan 2.7 denoise too high | Lower denoise to 0.4 or increase seed consistency. |
| Out of memory on A100 | Batch size too large for multi-view | Reduce `num_views` to 4 or process views sequentially. |

---

## License

Released under the MIT License.  
MEOK AI Labs © 2026. Character archetypes and color specifications are proprietary to MEOK AI Labs; the pipeline code is open-source.
