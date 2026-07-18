#!/usr/bin/env python3
"""
MEOK 3D Gaming Character Factory v2.0
Generates: Base archetypes + Dragon variants × 6 emergence stages
Outputs: 84 unique 3D assets per wave
Pipeline: FLUX.1 + LoRA → TRELLIS.2 → ComfyUI multi-view → Wan 2.7 → Package
"""

import argparse
import base64
import json
import logging
import os
import shutil
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

# ── Configuration ──────────────────────────────────────────────────────

class Config:
    FLUX_API_URL: str = os.getenv("FLUX_API_URL", "http://localhost:8080")
    FLUX_API_KEY: Optional[str] = os.getenv("FLUX_API_KEY")
    TRELLIS_API_URL: str = os.getenv("TRELLIS_API_URL", "http://localhost:8188")
    COMFYUI_URL: str = os.getenv("COMFYUI_URL", "http://localhost:8188")
    WAN_API_URL: str = os.getenv("WAN_API_URL", "http://localhost:8081")
    OUTPUT_DIR: Path = Path(os.getenv("OUTPUT_DIR", "./outputs_gaming"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    PROMPTS_PATH: Path = Path(__file__).with_name("prompts_gaming.json")
    LORA_NAME: str = os.getenv("LORA_NAME", "meokstyle_v1.safetensors")
    LORA_STRENGTH: float = float(os.getenv("LORA_STRENGTH", "0.85"))


# ── Stages ───────────────────────────────────────────────────────────────

STAGES = ["egg", "cracking", "hatching", "growing", "mature", "sovereign"]


# ── Prompt builders ──────────────────────────────────────────────────────

def build_prompt(stage: str, archetype_id: str, is_dragon: bool,
                 prompts: Dict[str, Any]) -> str:
    """Build FLUX prompt for any stage + archetype + dragon flag."""
    a = prompts["archetypes"][archetype_id]
    tpl = prompts["templates"]

    if is_dragon:
        dv = a["dragon_variant"]
        return tpl["flux_dragon"].format(
            dragon_material=dv["material"],
            dragon_shape=dv["shape"],
            dragon_color=dv["color_name"],
            archetype_features=f"{a['name']} archetype features: {a['material']}",
        )

    # Base archetype stages
    if stage == "egg":
        return tpl["flux_egg"].format(
            material=a["material"], shape="character", color=a["color_name"]
        )
    elif stage == "cracking":
        return tpl["flux_cracking"].format(
            material=a["material"], crack_pattern=a["egg_crack_pattern"],
            shape="character", color=a["color_name"]
        )
    elif stage == "hatching":
        return tpl["flux_hatching"].format(
            material=a["material"], shape="character", color=a["color_name"]
        )
    elif stage == "growing":
        return tpl["flux_growing"].format(
            material=a["material"], shape="character", features="features",
            color=a["color_name"]
        )
    elif stage == "mature":
        return tpl["flux_mature"].format(
            material=a["material"], shape="character", features="features",
            color=a["color_name"]
        )
    elif stage == "sovereign":
        return tpl["flux_sovereign"].format(
            material=a["material"], shape="character", color=a["color_name"]
        )
    return ""


# ── Stage generation ───────────────────────────────────────────────────

def generate_stage(
    archetype_id: str,
    stage: str,
    is_dragon: bool,
    output_dir: Path,
    prompts: Dict[str, Any],
    config: Config,
) -> Path:
    """Generate one stage asset: sheet → 3D → sprite → anim."""
    suffix = "_dragon" if is_dragon else ""
    variant_id = f"{archetype_id}{suffix}_{stage}"
    variant_dir = output_dir / variant_id
    variant_dir.mkdir(parents=True, exist_ok=True)

    # 1. Character sheet via FLUX
    prompt_text = build_prompt(stage, archetype_id, is_dragon, prompts)
    prompt_text = f"MEOKSTYLE, {prompt_text}"

    payload = {
        "prompt": prompt_text,
        "negative_prompt": "opaque, cartoon, realistic human, flesh, skin, low quality, blurry, distorted",
        "width": 1024, "height": 1024, "steps": 28, "cfg_scale": 3.5,
        "seed": -1, "lora": config.LORA_NAME, "lora_strength": config.LORA_STRENGTH,
    }
    headers = {"Authorization": f"Bearer {config.FLUX_API_KEY}"} if config.FLUX_API_KEY else {}

    logging.info(f"[{variant_id}] Stage 1/5 — FLUX sheet...")
    try:
        r = requests.post(f"{config.FLUX_API_URL}/generate", json=payload,
                          headers=headers, timeout=300)
        r.raise_for_status()
        result = r.json()
        image_data = base64.b64decode(result.get("image", result.get("images", [""])[0]))
    except Exception as e:
        logging.error(f"[{variant_id}] FLUX failed: {e}")
        raise

    sheet_path = variant_dir / "sheet.png"
    with open(sheet_path, "wb") as f:
        f.write(image_data)

    # Validate
    try:
        with Image.open(sheet_path) as img:
            img.verify()
    except Exception as e:
        sheet_path.unlink(missing_ok=True)
        raise RuntimeError(f"Generated sheet corrupt: {e}")

    logging.info(f"[{variant_id}] Sheet → {sheet_path}")

    # 2. 3D model via TRELLIS (skip for egg stages — egg is procedural)
    model_path = None
    if stage != "egg":
        logging.info(f"[{variant_id}] Stage 2/5 — TRELLIS 3D...")
        try:
            with open(sheet_path, "rb") as f:
                files = {"image": ("sheet.png", f, "image/png")}
                data = {
                    "seed": 42, "ss_sampling_steps": 12,
                    "slat_sampling_steps": 12, "mesh_simplify": 0.95,
                    "texture_size": 1024
                }
                r = requests.post(f"{config.TRELLIS_API_URL}/generate",
                                  data=data, files=files, timeout=600)
            r.raise_for_status()

            model_path = variant_dir / "model_raw.glb"
            with open(model_path, "wb") as f:
                f.write(r.content)
            logging.info(f"[{variant_id}] Model → {model_path}")
        except Exception as e:
            logging.error(f"[{variant_id}] TRELLIS failed: {e}")
            model_path = None
    else:
        logging.info(f"[{variant_id}] Egg stage — procedural sphere, skipping TRELLIS")
        # Placeholder: create a note for procedural egg generation
        note_path = variant_dir / "model_egg_procedural.txt"
        note_path.write_text("Procedural egg mesh: create sphere 1.2:1 ratio, apply translucent shell shader. See shader spec meok_egg_translucent.")
        model_path = note_path

    # 3. Multi-view sprite via ComfyUI
    sprite_path = variant_dir / "sprite_sheet.png"
    if stage != "egg" and model_path and model_path.exists() and isinstance(model_path, Path) and model_path.suffix == ".glb":
        logging.info(f"[{variant_id}] Stage 3/5 — ComfyUI multi-view...")
        # ComfyUI workflow: load 3D model, render 8 angles, composite sprite sheet
        try:
            workflow = {
                "1": {"inputs": {"model_path": str(model_path.resolve())}, "class_type": "Load3DModel"},
                "2": {"inputs": {"filename_prefix": f"MEOK_{variant_id}", "images": []}, "class_type": "SaveImage"},
            }
            payload = {"prompt": workflow, "client_id": f"meok-{variant_id}"}
            r = requests.post(f"{config.COMFYUI_URL}/prompt", json=payload, timeout=10)
            r.raise_for_status()
            prompt_id = r.json()["prompt_id"]

            # Poll for completion
            output_filename = None
            for _ in range(600):
                time.sleep(1)
                r = requests.get(f"{config.COMFYUI_URL}/history/{prompt_id}", timeout=60)
                history = r.json()
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_output in outputs.values():
                        if "images" in node_output:
                            img_meta = node_output["images"][0]
                            output_filename = img_meta["filename"]
                            break
                    if output_filename:
                        break

            if output_filename:
                view_url = f"{config.COMFYUI_URL}/view?filename={output_filename}&type=output"
                r = requests.get(view_url, timeout=60)
                r.raise_for_status()
                with open(sprite_path, "wb") as f:
                    f.write(r.content)
                logging.info(f"[{variant_id}] Sprite → {sprite_path}")
            else:
                logging.warning(f"[{variant_id}] ComfyUI produced no sprite")
        except Exception as e:
            logging.error(f"[{variant_id}] ComfyUI failed: {e}")

    # 4. Animation via Wan 2.7
    video_path = variant_dir / "animation.mp4"
    if stage != "egg":
        logging.info(f"[{variant_id}] Stage 4/5 — Wan 2.7 animation...")
        try:
            anim_prompt = prompts["templates"]["animation_idle"].format(
                archetype_behavior=f"{archetype_id} {stage} behavior"
            ) if stage != "egg" else prompts["templates"]["animation_egg"]
            payload = {
                "prompt": anim_prompt,
                "negative_prompt": "fast movement, jitter, flicker, distorted",
                "width": 832, "height": 480, "num_frames": 60, "fps": 30,
                "steps": 30, "cfg_scale": 6.0, "seed": -1,
            }
            r = requests.post(f"{config.WAN_API_URL}/generate", json=payload, timeout=600)
            r.raise_for_status()
            result = r.json()
            video_data = base64.b64decode(result.get("video", result.get("frames", "")))
            with open(video_path, "wb") as f:
                f.write(video_data)
            logging.info(f"[{variant_id}] Animation → {video_path}")
        except Exception as e:
            logging.error(f"[{variant_id}] Wan animation failed: {e}")
    else:
        # Egg stage animation: procedural
        logging.info(f"[{variant_id}] Egg stage — procedural rocking animation note")
        anim_note = variant_dir / "animation_egg_procedural.txt"
        anim_note.write_text("Procedural egg animation: gentle rocking ±3°, pulsing glow 0.3→1.0 over 3s, floating dust motes. See shader spec meok_egg_translucent.")

    # 5. Package with metadata
    logging.info(f"[{variant_id}] Stage 5/5 — Packaging...")
    pkg_dir = variant_dir / "package"
    pkg_dir.mkdir(exist_ok=True)

    # Copy files
    files_to_package = {
        "sheet.png": sheet_path,
    }
    if model_path and isinstance(model_path, Path) and model_path.suffix == ".glb":
        files_to_package["model.glb"] = model_path
    if sprite_path.exists():
        files_to_package["sprite_sheet.png"] = sprite_path
    if video_path.exists():
        files_to_package["animation.mp4"] = video_path

    present = {}
    for dest, src in files_to_package.items():
        if src and src.exists():
            shutil.copy2(src, pkg_dir / dest)
            present[dest] = dest

    # Build metadata
    a = prompts["archetypes"][archetype_id]
    dv = a.get("dragon_variant") if is_dragon else None
    metadata = {
        "archetype_id": archetype_id,
        "variant": "dragon" if is_dragon else "base",
        "stage": stage,
        "name": dv["name"] if dv else a["name"],
        "symbol": dv["symbol"] if dv else a["symbol"],
        "color_hex": dv["color_hex"] if dv else a["color_hex"],
        "material": dv["material"] if dv else a["material"],
        "stage_properties": {
            "translucency": prompts["stage_translucency"][stage],
            "emissive": prompts["stage_emissive"][stage],
        },
        "pipeline_version": "2.0.0-gaming",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "files": present,
        "sbt_ready": True,
        "sbt_type": "CharacterGenesis",
        "charter_reference": "Article 6 — Material Covenant Bond",
        "shader_recommended": f"meok_{stage}",
        "color_shift_enabled": True,
    }

    with open(pkg_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    logging.info(f"[{variant_id}] Package → {pkg_dir}")
    return pkg_dir


# ── Main orchestration ─────────────────────────────────────────────────

def run_wave(archetypes: List[str], stages: List[str], with_dragons: bool,
             output_dir: Path, prompts: Dict[str, Any], config: Config) -> None:
    """Generate a full wave of characters."""
    total = len(archetypes) * len(stages) * (2 if with_dragons else 1)
    logging.info(f"=" * 70)
    logging.info(f"MEOK 3D Gaming Character Factory v2.0")
    logging.info(f"=" * 70)
    logging.info(f"Wave: {total} assets total")
    logging.info(f"Archetypes: {archetypes}")
    logging.info(f"Stages: {stages}")
    logging.info(f"Dragon variants: {with_dragons}")
    logging.info(f"Output: {output_dir}")
    logging.info(f"=" * 70)

    completed = 0
    failed = 0
    for a_id in archetypes:
        for stage in stages:
            # Base variant
            try:
                generate_stage(a_id, stage, False, output_dir, prompts, config)
                completed += 1
                logging.info(f"✅ {a_id} base {stage} — done ({completed}/{total})")
            except Exception as e:
                failed += 1
                logging.error(f"❌ {a_id} base {stage} — FAILED: {e}")

            # Dragon variant
            if with_dragons:
                try:
                    generate_stage(a_id, stage, True, output_dir, prompts, config)
                    completed += 1
                    logging.info(f"✅ {a_id} dragon {stage} — done ({completed}/{total})")
                except Exception as e:
                    failed += 1
                    logging.error(f"❌ {a_id} dragon {stage} — FAILED: {e}")

    logging.info(f"=" * 70)
    logging.info(f"Wave complete: {completed} done, {failed} failed, {total} total")
    logging.info(f"Output directory: {output_dir}")
    logging.info(f"=" * 70)


# ── CLI ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="MEOK 3D Gaming Character Factory v2.0"
    )
    parser.add_argument("--archetype", default="all",
                        choices=["all", "sovereign", "guardian", "scout",
                                 "strategist", "creator", "companion", "sage"])
    parser.add_argument("--stage", default="all",
                        choices=["all"] + STAGES)
    parser.add_argument("--dragon", action="store_true",
                        help="Include dragon variants")
    parser.add_argument("--output-dir", type=Path,
                        default=Path("./outputs_gaming"))
    args = parser.parse_args()

    config = Config()
    config.OUTPUT_DIR = args.output_dir
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
    )

    if not config.PROMPTS_PATH.exists():
        logging.error(f"Prompts file not found: {config.PROMPTS_PATH}")
        sys.exit(1)

    prompts = json.loads(config.PROMPTS_PATH.read_text())

    archetypes = list(prompts["archetypes"].keys()) if args.archetype == "all" else [args.archetype]
    stages = STAGES if args.stage == "all" else [args.stage]

    run_wave(archetypes, stages, args.dragon, args.output_dir, prompts, config)


if __name__ == "__main__":
    main()
