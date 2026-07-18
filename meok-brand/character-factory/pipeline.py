#!/usr/bin/env python3
"""
MEOK AI Labs — Character Factory 3D Asset Pipeline
Orchestrates: FLUX.1 [dev] + LoRA → TRELLIS.2 → ComfyUI multi-view → Wan 2.7 animation
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
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv
from PIL import Image

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

class Config:
    """Pipeline configuration sourced from environment variables."""
    FLUX_API_URL: str = os.getenv("FLUX_API_URL", "http://localhost:8080")
    FLUX_API_KEY: Optional[str] = os.getenv("FLUX_API_KEY")
    TRELLIS_API_URL: str = os.getenv("TRELLIS_API_URL", "http://localhost:8188")
    COMFYUI_URL: str = os.getenv("COMFYUI_URL", "http://localhost:8188")
    WAN_API_URL: str = os.getenv("WAN_API_URL", "http://localhost:8081")
    OUTPUT_DIR: Path = Path(os.getenv("OUTPUT_DIR", "./outputs"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    COMFY_WORKFLOW_PATH: Path = Path(__file__).with_name("comfyui-workflow.json")
    PROMPTS_PATH: Path = Path(__file__).with_name("prompts.json")
    LORA_NAME: str = os.getenv("LORA_NAME", "meokstyle_v1.safetensors")
    LORA_STRENGTH: float = float(os.getenv("LORA_STRENGTH", "0.85"))


# ---------------------------------------------------------------------------
# Logging & I/O helpers
# ---------------------------------------------------------------------------

def setup_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        datefmt="%H:%M:%S",
    )


def load_json(path: Path) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def api_post(
    url: str,
    payload: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
    files: Optional[Dict[str, Any]] = None,
    data: Optional[Dict[str, Any]] = None,
    timeout: int = 300,
) -> requests.Response:
    """POST with unified error handling."""
    try:
        if files:
            r = requests.post(url, data=data or payload, files=files, headers=headers or {}, timeout=timeout)
        else:
            r = requests.post(url, json=payload, headers=headers or {}, timeout=timeout)
        return r
    except requests.RequestException as exc:
        logging.error(f"POST to {url} failed: {exc}")
        raise


def api_get(url: str, headers: Optional[Dict[str, str]] = None, timeout: int = 60) -> requests.Response:
    """GET with unified error handling."""
    try:
        r = requests.get(url, headers=headers or {}, timeout=timeout)
        return r
    except requests.RequestException as exc:
        logging.error(f"GET to {url} failed: {exc}")
        raise


def _decode_image_from_response(result: Dict[str, Any]) -> bytes:
    """Extract raw image bytes from a JSON API response."""
    if "image" in result:
        return base64.b64decode(result["image"])
    if "images" in result and len(result["images"]) > 0:
        entry = result["images"][0]
        if isinstance(entry, str):
            return base64.b64decode(entry)
        if isinstance(entry, dict):
            if "url" in entry:
                return api_get(entry["url"]).content
            if "base64" in entry:
                return base64.b64decode(entry["base64"])
    if "image_url" in result:
        return api_get(result["image_url"]).content
    raise RuntimeError("API response did not contain a recognisable image field")


def _decode_video_from_response(result: Dict[str, Any]) -> bytes:
    """Extract raw video bytes from a JSON API response."""
    if "video" in result:
        return base64.b64decode(result["video"])
    if "frames" in result:
        return base64.b64decode(result["frames"])
    if "video_url" in result:
        return api_get(result["video_url"]).content
    raise RuntimeError("API response did not contain a recognisable video field")


# ---------------------------------------------------------------------------
# Stage 1 — Character Sheet (FLUX.1 [dev] + LoRA)
# ---------------------------------------------------------------------------

def generate_character_sheet(
    archetype_id: str,
    output_dir: Path,
    prompts: Dict[str, Any],
    config: Config,
) -> Path:
    archetype = prompts["archetypes"][archetype_id]
    template: str = prompts["templates"]["flux"]
    prompt_text = template.format(
        material=archetype["material"],
        color=archetype["color_name"],
        archetype=archetype["name"],
    )
    prompt_text = f"MEOKSTYLE, {prompt_text}"

    payload = {
        "prompt": prompt_text,
        "negative_prompt": "opaque, cartoon, realistic human, flesh, skin, low quality, blurry, distorted",
        "width": 1024,
        "height": 1024,
        "steps": 28,
        "cfg_scale": 3.5,
        "seed": -1,
        "lora": config.LORA_NAME,
        "lora_strength": config.LORA_STRENGTH,
    }

    headers: Dict[str, str] = {}
    if config.FLUX_API_KEY:
        headers["Authorization"] = f"Bearer {config.FLUX_API_KEY}"

    logging.info(f"[{archetype_id}] Stage 1/5 — Generating character sheet via FLUX...")
    r = api_post(f"{config.FLUX_API_URL}/generate", payload=payload, headers=headers, timeout=300)
    r.raise_for_status()

    image_data = _decode_image_from_response(r.json())
    sheet_path = output_dir / archetype_id / "sheet.png"
    sheet_path.parent.mkdir(parents=True, exist_ok=True)
    with open(sheet_path, "wb") as f:
        f.write(image_data)

    # Validate image integrity
    try:
        with Image.open(sheet_path) as img:
            img.verify()
    except Exception as exc:
        sheet_path.unlink(missing_ok=True)
        raise RuntimeError(f"Generated sheet is corrupt: {exc}")

    logging.info(f"[{archetype_id}] Character sheet saved → {sheet_path}")
    return sheet_path


# ---------------------------------------------------------------------------
# Stage 2 — 3D Model (TRELLIS.2 image-to-3D)
# ---------------------------------------------------------------------------

def generate_3d_model(
    character_sheet_path: Path,
    output_dir: Path,
    config: Config,
) -> Path:
    archetype_id = character_sheet_path.parent.name
    url = f"{config.TRELLIS_API_URL}/generate"
    data = {
        "seed": 42,
        "ss_sampling_steps": 12,
        "slat_sampling_steps": 12,
        "mesh_simplify": 0.95,
        "texture_size": 1024,
    }

    logging.info(f"[{archetype_id}] Stage 2/5 — Reconstructing 3D model via TRELLIS.2...")
    with open(character_sheet_path, "rb") as f:
        files = {"image": ("sheet.png", f, "image/png")}
        r = requests.post(url, data=data, files=files, timeout=600)
    r.raise_for_status()

    model_path = output_dir / archetype_id / "model_raw.glb"
    model_path.parent.mkdir(parents=True, exist_ok=True)

    content_type = r.headers.get("Content-Type", "")
    if "application/octet-stream" in content_type or r.content[:4] == b"glTF":
        with open(model_path, "wb") as f:
            f.write(r.content)
    else:
        result = r.json()
        mesh_b64 = result.get("mesh") or result.get("glb")
        if not mesh_b64:
            raise RuntimeError("TRELLIS response did not contain a mesh")
        with open(model_path, "wb") as f:
            f.write(base64.b64decode(mesh_b64))

    logging.info(f"[{archetype_id}] 3D model saved → {model_path}")
    return model_path


# ---------------------------------------------------------------------------
# Stage 3 — Multi-View (ComfyUI + PuLID + ControlNet)
# ---------------------------------------------------------------------------

def generate_multi_view(
    model_path: Path,
    archetype_id: str,
    output_dir: Path,
    config: Config,
) -> Path:
    workflow = load_json(config.COMFY_WORKFLOW_PATH)

    # Inject runtime values into the workflow graph
    for node in workflow.values():
        if node.get("class_type") == "Load3DModel":
            node["inputs"]["model_path"] = str(model_path.resolve())
        if node.get("class_type") == "SaveImage":
            node["inputs"]["filename_prefix"] = f"MEOK_{archetype_id}_multiview"

    payload = {"prompt": workflow, "client_id": f"meok-{archetype_id}"}
    logging.info(f"[{archetype_id}] Stage 3/5 — Submitting multi-view workflow to ComfyUI...")
    r = api_post(f"{config.COMFYUI_URL}/prompt", payload=payload, timeout=10)
    r.raise_for_status()
    prompt_id = r.json()["prompt_id"]

    # Poll ComfyUI history until completion
    output_filename: Optional[str] = None
    subfolder = ""
    for _ in range(600):  # up to 10 minutes
        time.sleep(1)
        r = api_get(f"{config.COMFYUI_URL}/history/{prompt_id}")
        history = r.json()
        if prompt_id in history:
            outputs = history[prompt_id].get("outputs", {})
            for node_output in outputs.values():
                if "images" in node_output:
                    img_meta = node_output["images"][0]
                    output_filename = img_meta["filename"]
                    subfolder = img_meta.get("subfolder", "")
                    break
            if output_filename:
                break
    else:
        raise RuntimeError("ComfyUI multi-view workflow timed out")

    if not output_filename:
        raise RuntimeError("ComfyUI multi-view workflow produced no images")

    # Download result
    view_url = f"{config.COMFYUI_URL}/view?filename={output_filename}"
    if subfolder:
        view_url += f"&subfolder={subfolder}"
    view_url += "&type=output"

    r = api_get(view_url, timeout=60)
    r.raise_for_status()

    sprite_path = output_dir / archetype_id / "sprite_sheet.png"
    sprite_path.parent.mkdir(parents=True, exist_ok=True)
    with open(sprite_path, "wb") as f:
        f.write(r.content)

    logging.info(f"[{archetype_id}] Multi-view sprite sheet saved → {sprite_path}")
    return sprite_path


# ---------------------------------------------------------------------------
# Stage 4 — Animation (Wan 2.7)
# ---------------------------------------------------------------------------

def generate_animation(
    model_path: Path,
    archetype_id: str,
    output_dir: Path,
    prompts: Dict[str, Any],
    config: Config,
) -> Path:
    template: str = prompts["templates"]["animation"]
    prompt_text = template.format(archetype=prompts["archetypes"][archetype_id]["name"])

    payload = {
        "prompt": prompt_text,
        "negative_prompt": "fast movement, jitter, flicker, distorted geometry, darkness",
        "width": 832,
        "height": 480,
        "num_frames": 60,
        "fps": 30,
        "steps": 30,
        "cfg_scale": 6.0,
        "seed": -1,
    }

    logging.info(f"[{archetype_id}] Stage 4/5 — Generating animation via Wan 2.7...")
    r = api_post(f"{config.WAN_API_URL}/generate", payload=payload, timeout=600)
    r.raise_for_status()

    video_data = _decode_video_from_response(r.json())
    video_path = output_dir / archetype_id / "animation.mp4"
    video_path.parent.mkdir(parents=True, exist_ok=True)
    with open(video_path, "wb") as f:
        f.write(video_data)

    logging.info(f"[{archetype_id}] Animation saved → {video_path}")
    return video_path


# ---------------------------------------------------------------------------
# Stage 5 — Packaging
# ---------------------------------------------------------------------------

def package_outputs(
    archetype_id: str,
    output_dir: Path,
    prompts: Dict[str, Any],
    config: Config,
) -> Path:
    archetype = prompts["archetypes"][archetype_id]
    src_dir = output_dir / archetype_id
    pkg_dir = src_dir / "package"
    pkg_dir.mkdir(parents=True, exist_ok=True)

    file_map = {
        "model.glb": src_dir / "model_raw.glb",
        "model.obj": src_dir / "model_raw.obj",
        "model.usdz": src_dir / "model_raw.usdz",
        "sprite_sheet.png": src_dir / "sprite_sheet.png",
        "animation.mp4": src_dir / "animation.mp4",
    }

    present_files: Dict[str, str] = {}
    for dest_name, src_path in file_map.items():
        if src_path.exists():
            shutil.copy2(src_path, pkg_dir / dest_name)
            present_files[dest_name] = dest_name
        else:
            logging.warning(f"[{archetype_id}] Missing {src_path.name}, omitting from package.")

    metadata = {
        "archetype_id": archetype_id,
        "name": archetype["name"],
        "symbol": archetype["symbol"],
        "color_hex": archetype["color_hex"],
        "material": archetype["material"],
        "pipeline_version": "1.0.0",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "files": present_files,
    }

    meta_path = pkg_dir / "metadata.json"
    save_json(meta_path, metadata)

    logging.info(f"[{archetype_id}] Stage 5/5 — Packaged outputs → {pkg_dir}")
    return pkg_dir


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def run_stage(
    stage: str,
    archetype_id: str,
    output_dir: Path,
    prompts: Dict[str, Any],
    config: Config,
) -> None:
    if stage in ("all", "sheet"):
        generate_character_sheet(archetype_id, output_dir, prompts, config)

    if stage in ("all", "3d"):
        sheet_path = output_dir / archetype_id / "sheet.png"
        if not sheet_path.exists():
            logging.error(f"Character sheet not found at {sheet_path}. Run --stage sheet first.")
            sys.exit(1)
        generate_3d_model(sheet_path, output_dir, config)

    if stage in ("all", "multiview"):
        model_path = output_dir / archetype_id / "model_raw.glb"
        if not model_path.exists():
            logging.error(f"3D model not found at {model_path}. Run --stage 3d first.")
            sys.exit(1)
        generate_multi_view(model_path, archetype_id, output_dir, config)

    if stage in ("all", "animation"):
        model_path = output_dir / archetype_id / "model_raw.glb"
        if not model_path.exists():
            logging.error(f"3D model not found at {model_path}. Run --stage 3d first.")
            sys.exit(1)
        generate_animation(model_path, archetype_id, output_dir, prompts, config)

    if stage in ("all", "package"):
        package_outputs(archetype_id, output_dir, prompts, config)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="MEOK Character Factory — generate translucent 3D character assets."
    )
    parser.add_argument(
        "--archetype",
        required=True,
        choices=["sovereign", "guardian", "scout", "strategist", "creator", "companion", "sage"],
        help="Archetype to generate",
    )
    parser.add_argument(
        "--stage",
        default="all",
        choices=["all", "sheet", "3d", "multiview", "animation", "package"],
        help="Pipeline stage to run",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("./outputs"),
        help="Base output directory",
    )
    args = parser.parse_args()

    config = Config()
    config.OUTPUT_DIR = args.output_dir
    setup_logging(config.LOG_LEVEL)

    if not config.PROMPTS_PATH.exists():
        logging.error(f"Prompts file not found: {config.PROMPTS_PATH}")
        sys.exit(1)

    prompts = load_json(config.PROMPTS_PATH)
    run_stage(args.stage, args.archetype, args.output_dir, prompts, config)


if __name__ == "__main__":
    main()
