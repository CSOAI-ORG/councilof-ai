# 🌏 Bleeding-edge Chinese world models — SovSpace scout (M4, 2026-07-11)

Web-grounded (not memory). These are the models that could power the **SovSpace body** — the
sovereign's navigable 3D world, the Hatch character, the walkable interactive space. Mapped to what
SOV33 actually needs, with the honest GPU reality (our free tier is a 16 GB M4 + Colab T4).

## The category ladder (world model ≠ LLM ≠ video clip)
| Layer | What it does | SOTA Chinese model (open) | SovSpace use |
|---|---|---|---|
| **3D WORLD generation** | text/image/video → **persistent editable 3D world** (mesh + 3D-Gaussian-Splat) you import into Unreal/Unity/Isaac | **Tencent HY-World 2.0** (16 Apr 2026) ⭐ | THE SovSpace world — replaces/augments the Cesium globe with generated sovereign worlds, first-person navigation + physics collision |
| **Interactive / PLAYABLE world** | action-conditioned, real-time streaming next-frame world you *walk* | **Skywork Matrix-Game 3.0** (27 Mar 2026) ⭐ — 720p real-time, long-horizon memory, built on Alibaba **WanX** | the sovereign/Hatch inhabits + walks a live-generated world (the "agentic inside the window" you asked for) |
| **3D ASSET / character** | image/text → textured 3D mesh in seconds | **Hunyuan3D-2.1** + **StepFun Step1X-3D** | generate the Hatch characters + world props/buildings |
| **Image / texture** | native multimodal image gen with reasoning | **Tencent HunyuanImage-3.0** (Jan 2026) | Hatch skins, world textures, brand art |
| **Video world sim** | text/image → long coherent video (physics-plausible) | Alibaba **Wan 2.x**, Zhipu **CogVideoX**, Kuaishou **Kling**, Shengshu **Vidu**, ByteDance **Seedance** | cinematics / trailers (not the interactive body) |

## The two that matter most for SovSpace
1. **HY-World 2.0** (github.com/Tencent-Hunyuan/HY-World-2.0, HF `tencent/HY-World-2.0`) — multi-modal
   (text/image/multi-view/video → mesh or 3DGS). Crucially it outputs **editable persistent assets** you
   load into Unreal/Isaac Sim — "building a playable game," not recording a clip. 3M+ downloads for the
   Hunyuan-3D series; adopted into Cinema 4D. **This is the honest answer to "make Cesium cinema-quality" —
   generate real 3D sovereign worlds instead of hand-building tiles.**
2. **Matrix-Game 3.0** (github.com/SkyworkAI/Matrix-Game) — real-time streaming **interactive** world with
   action modules (predicts next frames from visuals + actions). This is the "sovereign is inside the
   window and drives it, agentic" layer — a walkable world the Hatch acts in.

## 🔴 Honest GPU reality (the real gate — same as before)
All of the above are **open-weights** — but they are **not runnable on our free tier for the heavy modes**:
- **HY-World 2.0 / Matrix-Game 3.0 (720p real-time)** → need A100/H100-class GPU (24–80 GB VRAM). Our
  Colab T4 (16 GB) can do **offline / low-res** passes and **Hunyuan3D-2.1 asset generation**, not
  real-time world streaming. The Mac (16 GB, MPS) can't run any of them at useful size.
- **Realistic path for SOV33 today:**
  1. **Hunyuan3D-2.1 asset gen on Colab T4** — image→3D Hatch characters + world props, offline, FREE. ✅ do-able now.
  2. **HY-World 2.0 world gen** → run on a rented A100 (Vast/RunPod, ~$1–2/hr) for a batch of sovereign
     worlds, export the meshes/3DGS, serve them statically in the WebGL/Cesium body (client-GPU, free forever). ✅ the sovereign pattern: generate on paid GPU once, serve free.
  3. **Matrix-Game real-time** → premium/aspirational (needs sustained GPU) — a paid body, not free-forever.
- HF Spaces host demos of most of these (ZeroGPU) — usable for one-off generation without renting.

## What SOV33 needs (ranked)
1. **Wire Hunyuan3D-2.1 on Colab T4** → generate real Hatch character meshes (closes the "no real 3D
   character" gap; GPU-work, no new key). Highest-value, do-able now.
2. **Batch HY-World 2.0 on a rented A100** → a handful of signed sovereign worlds, export 3DGS, serve in
   the free WebGL body. The "generate-once-on-paid-GPU, serve-free" sovereign pattern.
3. **Matrix-Game 3.0** → hold as the premium interactive body (needs sustained GPU $$$) — aspirational, honest.
- **Don't** claim we "have" these running — we have *access to the open weights*; running the heavy modes
  is GPU-gated (Colab for assets, rented A100 for worlds).

Sources: [HY-World 2.0 (GitHub)](https://github.com/Tencent-Hunyuan/HY-World-2.0) · [HY-World 2.0 (HF)](https://huggingface.co/tencent/HY-World-2.0) · [HunyuanWorld 1.0](https://github.com/Tencent-Hunyuan/HunyuanWorld-1.0) · [Matrix-Game (Skywork)](https://github.com/SkyworkAI/Matrix-Game) · [Matrix-Game 3.0](https://matrix-game-v3.github.io/) · [Hunyuan3D-2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) · [Step1X-3D](https://stepfun-ai.github.io/Step1X-3D/) · [HunyuanImage-3.0](https://github.com/Tencent-Hunyuan/HunyuanImage-3.0)
