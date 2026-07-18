"""
episode_logger.py — MEOK/SOV3³ governance-episode logger.

Captures partnership / threat / dependency / care episodes in the EXACT schema the
neural_core NNs train on, appending to training_data/<nn>_episodes.json. This is the
durable fix for the data-starved NNs: every real interaction SOV3 sees can be logged
here and picked up on the next `train_all()`.

Schema per episode (matches existing *_episodes.json):
    content          : str   — the text the NN featurizes
    care_weight      : float — 0..1 care/importance target (care & regression NNs)
    importance_score : float — 0..1 secondary weight
    memory_type      : str   — 'interaction' | 'insight'
    tags             : list[str]
    source_agent     : str
    timestamp        : float — epoch seconds
    label            : float|int|None — task target (threat_level, partnership prob, etc.)

Usage:
    from neural_core.episode_logger import log_episode
    log_episode("threat", content="user asked to bypass the care gate",
                care_weight=0.9, label=1, tags=["security","gate"], source_agent="sov3")
"""
from __future__ import annotations
import json, os, time, tempfile
from typing import Optional, List

_HERE = os.path.dirname(os.path.abspath(__file__))
# training_data lives beside neural_core's parent (sovereign-temple/training_data)
_TD = os.path.join(os.path.dirname(_HERE), "training_data")

VALID_NNS = {"care", "threat", "relationship", "creativity",
             "emotion", "intent", "partnership", "sentiment", "dependency"}


def _path(nn: str) -> str:
    return os.path.join(_TD, f"{nn}_episodes.json")


def _atomic_write(path: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp, path)          # atomic; never leaves a half-written file
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def log_episode(nn: str, content: str, care_weight: float = 0.5,
                importance_score: Optional[float] = None,
                memory_type: str = "interaction",
                tags: Optional[List[str]] = None,
                source_agent: str = "sov3",
                label=None) -> dict:
    """Append one episode to training_data/<nn>_episodes.json (creating it if absent)."""
    nn = nn.lower().strip()
    if nn not in VALID_NNS:
        raise ValueError(f"unknown nn {nn!r}; expected one of {sorted(VALID_NNS)}")
    if not content or not str(content).strip():
        raise ValueError("content is required and cannot be empty")
    cw = max(0.0, min(1.0, float(care_weight)))
    ep = {
        "content": str(content),
        "care_weight": cw,
        "importance_score": cw if importance_score is None else max(0.0, min(1.0, float(importance_score))),
        "memory_type": memory_type,
        "tags": list(tags or []),
        "source_agent": source_agent,
        "timestamp": time.time(),
    }
    if label is not None:
        ep["label"] = label
    path = _path(nn)
    data = []
    if os.path.exists(path):
        try:
            data = json.load(open(path))
            if not isinstance(data, list):
                data = []
        except (json.JSONDecodeError, OSError):
            data = []
    data.append(ep)
    _atomic_write(path, data)
    return ep


def episode_counts() -> dict:
    """Current episode count per NN — quick health check on the starved-NN problem."""
    out = {}
    for nn in sorted(VALID_NNS):
        p = _path(nn)
        try:
            out[nn] = len(json.load(open(p))) if os.path.exists(p) else 0
        except (json.JSONDecodeError, OSError):
            out[nn] = 0
    return out
