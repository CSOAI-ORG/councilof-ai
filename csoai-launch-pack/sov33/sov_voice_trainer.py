"""
sov33/sov_voice_trainer.py
==========================
SOV VOICE TRAINER — wires the 50+ corpus to Qwen3-4B via QLoRA when base is pulled.

This is the FIRE-when-ready module. Until qwen3:4b is pulled, it stays staged.
The recipe is at sov33-training/RECIPE.md.
"""
import sys
import json
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA

CORPUS_DIR = ROOT / "sov33-training" / "corpus"
CORPUS_200 = ROOT / "sov33-training" / "corpus-200"

def count_corpus():
    """Count the examples available for training."""
    total = 0
    files = []
    for d in [CORPUS_DIR, CORPUS_200]:
        if d.exists():
            for f in sorted(d.glob("*.jsonl")):
                n = sum(1 for _ in open(f))
                total += n
                files.append((f.name, n))
    return total, files

def emit_receipts():
    digests = []
    total, files = count_corpus()

    rec = mint_op("SOV-VOICE-TRAINING", "TRAINER_STAGED", "sov-voice-trainer-2026-07-16",
                   {"module": "sov_voice_trainer.py",
                    "purpose": "wire 50+ example corpus to Qwen3-4B via QLoRA",
                    "corpus_total": total, "corpus_files": [{"name": n, "examples": c} for n, c in files],
                    "recipe": "RECIPE.md · 3 paths: A100 / Apple Silicon / sovereign_api",
                    "status": "STAGED · fires when qwen3:4b is pulled",
                    "blocked_by": "ollama pull qwen3:4b (2.5 GB · 5 min · Apache-2.0)"},
                   care_value=0.97)
    digests.append(("TRAINER_STAGED", rec["digest"]))

    return digests

if __name__ == "__main__":
    print("=== 🜏 SOV VOICE TRAINER · wire 50+ examples to Qwen3-4B · STAGED ===\n")
    print(f"  Charter: {CSOAI_CHARTER_SHA}\n")

    total, files = count_corpus()
    print(f"  CORPUS AVAILABLE: {total} examples across {len(files)} files")
    for name, n in files:
        print(f"    {name:35s} {n:3d} examples")
    print()

    print("  ── TRAINING READINESS ──")
    print("    □ qwen3:4b pulled      [STAGED · 5 min when you fire]")
    print("    □ qwen3:8b pulled      [STAGED · 10 min when you fire]")
    print("    □ QLoRA fine-tune       [STAGED · 2-3 hours on A100 or Apple Silicon]")
    print("    □ Test against hedge-bot failure  [STAGED · 30 min]")
    print("    □ Replace qwen2.5:3b as daily driver  [STAGED]")
    print()

    digests = emit_receipts()
    for k, d in digests:
        print(f"  Sigil: {d[:32]}  ({k})")
    print()
    print(f"  SOV-VOICE-TRAINING chain: {audit_brief('SOV-VOICE-TRAINING')}")
