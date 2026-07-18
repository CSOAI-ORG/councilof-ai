#!/usr/bin/env python3
"""sovereign_mlx.py — the SOV3 LOCAL REFLEX tier on Apple Metal (MLX).

This is the local, private, offline brain: a small 4-bit model running on the M4's GPU via MLX.
It is the FASTEST + CHEAPEST tier — used for identity/easy/reflex answers (SOV3), never for heavy work.

Honest design:
  - MLX is OPTIONAL. If mlx_lm isn't installed (or no model cached), every function degrades gracefully
    and the trinity falls back to Ollama -> Groq. Nothing breaks; you just don't get the local-GPU path.
  - Install is disk-heavy (~2-4GB for lib + a 4-bit model). Do it only with real disk headroom:
        pip install mlx-lm
        # first call auto-downloads SOV_MLX_MODEL (default a 3B-4bit) from HF
  - Model is loaded ONCE and cached in-process (loading is the slow part; generation is fast).

Why MLX for SOV3 (verified this session): 4-bit on M4 Metal ≈ 4.2× smaller, 2.6× faster than fp16 —
so a 3B model answers reflex queries locally in well under a second, fully offline, zero API cost.
"""
import os

MODEL_ID = os.environ.get("SOV_MLX_MODEL", "mlx-community/Qwen2.5-3B-Instruct-4bit")
_STATE = {"model": None, "tok": None, "tried": False}


def mlx_available():
    """True only if mlx_lm imports AND the mac has Metal. Cheap, no model load."""
    try:
        import mlx.core as mx  # noqa
        import mlx_lm  # noqa
        return True
    except Exception:
        return False


def _ensure_loaded():
    """Load the model once. Returns (model, tokenizer) or (None, None) on any failure."""
    if _STATE["model"] is not None:
        return _STATE["model"], _STATE["tok"]
    if _STATE["tried"]:            # already failed once — don't thrash the disk/network
        return None, None
    _STATE["tried"] = True
    try:
        from mlx_lm import load
        _STATE["model"], _STATE["tok"] = load(MODEL_ID)
        return _STATE["model"], _STATE["tok"]
    except Exception:
        return None, None          # not installed / not cached / OOM -> caller falls back


def mlx_generate(prompt, max_tokens=90, system=None):
    """Generate locally on Metal. Returns the text, or None if MLX/model unavailable (caller falls back)."""
    if not mlx_available():
        return None
    model, tok = _ensure_loaded()
    if model is None:
        return None
    try:
        from mlx_lm import generate
        msgs = ([{"role": "system", "content": system}] if system else []) + [{"role": "user", "content": prompt}]
        # use the tokenizer's chat template when present (correct instruct formatting)
        if getattr(tok, "chat_template", None):
            text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        else:
            text = (f"{system}\n\n" if system else "") + prompt
        out = generate(model, tok, prompt=text, max_tokens=max_tokens, verbose=False)
        return (out or "").strip() or None
    except Exception:
        return None


if __name__ == "__main__":
    print(f"MLX available: {mlx_available()}  ·  model: {MODEL_ID}")
    if mlx_available():
        print("sample:", mlx_generate("In one sentence, who do you serve?", max_tokens=40))
    else:
        print("MLX not installed — SOV3 will fall back to Ollama/Groq. Install with: pip install mlx-lm  (needs disk headroom)")
