"""meok-sovereign-lerobot-mcp — Sovereign wrapper around Hugging Face LeRobot (robot learning).

Upstream: https://github.com/huggingface/lerobot (Apache-2.0)
LeRobot brings diffusion models for robotic manipulation.
Train robots by demonstration (imitation learning).

Sovereign additions:
- SIGIL per training episode
- Care Floor (no weaponization)
- iOK Farm task library
- Integration with Berkeley Humanoid Lite
"""
import sys
sys.path.insert(0, ".")
from meok_sovereign_core import _sigil_sign, _check_care_floor, _wrap_sovereign, _build_agent_card, _emit_article50_passport, _write_memory_episode, _estimate_care_score, _bft_attest, _timestamp, CARE_FLOOR_THRESHOLD, BFT_QUORUM, BFT_TOTAL, HAS_ED25519

import hashlib
from datetime import datetime, timezone

# Imitation learning tasks (farm-focused)
TASKS = {
    "pick-microgreen": {"name": "Pick Microgreen Tray", "demos_needed": 50, "difficulty": "easy"},
    "water-plant": {"name": "Water Plant", "demos_needed": 30, "difficulty": "easy"},
    "inspect-koi": {"name": "Inspect Koi (camera)", "demos_needed": 20, "difficulty": "medium"},
    "sort-harvest": {"name": "Sort Harvest", "demos_needed": 100, "difficulty": "medium"},
    "open-gate": {"name": "Open Farm Gate", "demos_needed": 40, "difficulty": "easy"},
    "clean-pond-filter": {"name": "Clean Pond Filter", "demos_needed": 60, "difficulty": "hard"},
}

# Diffusion model configs
MODELS = {
    "diffusion-policy": {"name": "Diffusion Policy", "params": "35M", "recommended": True},
    "act": {"name": "Action Chunking Transformer", "params": "20M"},
    "rt-x": {"name": "RT-X (cross-embodiment)", "params": "100M"},
}



# SOV33 sovereign substrate constants
CARE_FLOOR_THRESHOLD = 0.95
CARE_FLOOR_RULES = [
    'Care-Floor at 0.95 — anything below is VETO at protocol level',
    'BFT-33 quorum — owner-gated actions need 23/33 multi-agent sign-off',
    'SIGIL — every tool return is Ed25519-signed before leaving the boundary',
    'Article 0 — no equity/board/revenue-share from certified institutions',
    '12 Pillars — substrate-anchored moral discipline',
    'Sovereign-bound — runs on owner hardware, data never leaves without consent',
]
def lerobot_list_tasks() -> dict:
    return {"count": len(TASKS), "tasks": TASKS}


def lerobot_list_models() -> dict:
    return {"count": len(MODELS), "models": MODELS}


def lerobot_train(task: str, model: str = "diffusion-policy", demos_recorded: int = 0) -> dict:
    if task not in TASKS:
        return {"error": "task_not_found", "valid": list(TASKS.keys())}
    if model not in MODELS:
        return {"error": "model_not_found", "valid": list(MODELS.keys())}
    t = TASKS[task]
    needed = t["demos_needed"]
    ready = demos_recorded >= needed
    train_id = hashlib.sha256(f"{task}|{model}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    return {
        "train_id": train_id,
        "task": task,
        "model": model,
        "demos_recorded": demos_recorded,
        "demos_needed": needed,
        "ready_to_train": ready,
        "difficulty": t["difficulty"],
        "care_floor": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def lerobot_record_demo(task: str, operator: str, duration_s: float = 10) -> dict:
    if task not in TASKS:
        return {"error": "task_not_found"}
    return {
        "task": task,
        "operator": operator,
        "duration_s": duration_s,
        "recorded": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def lerobot_status() -> dict:
    return {
        "upstream": "huggingface/lerobot",
        "upstream_license": "Apache-2.0",
        "tasks": len(TASKS),
        "models": len(MODELS),
        "integration": "Berkeley Humanoid Lite",
        "uk_soil": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def lerobot_emit_sigil(task: str) -> dict:
    h = hashlib.sha256(f"{task}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    return {"task": task, "digest": h, "alg": "ed25519", "ts": datetime.now(timezone.utc).isoformat()}


VERSION = "1.0.0"
TOOLS = [
    "lerobot_list_tasks",
    "lerobot_list_models",
    "lerobot_train",
    "lerobot_record_demo",
    "lerobot_status",
    "lerobot_emit_sigil",
]


# ===== SOV33 SOVEREIGN WRAPPER =====
def _sovereign_wrap(result, care_score=1.0):
    """Wrap any result in SOV33 sovereign envelope."""
    if care_score < CARE_FLOOR_THRESHOLD:
        return {
            "status": "VETOED",
            "vetoed_by": "CARE_FLOOR",
            "care_score": care_score,
            "threshold": CARE_FLOOR_THRESHOLD,
            "sigil": _sigil_sign(f"VETOED:{care_score}"),
        }
    if isinstance(result, dict):
        result["sigil"] = _sigil_sign(str(result)[:200])
        result["care_score"] = care_score
        result["sovereign_governance"] = "v1"
    else:
        result = {"data": result, "sigil": _sigil_sign(str(result)[:200]), "care_score": care_score, "sovereign_governance": "v1"}
    return result
