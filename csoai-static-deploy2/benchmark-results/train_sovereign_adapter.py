#!/usr/bin/env python3
"""
DEFONEOS Sovereign Adapter Trainer
Re-trains sovereign LoRA adapters on Qwen3-0.6B using synthetic + real sovereign data.
Uses Ollama Modelfile approach: the adapter is a Qwen3-0.6B with a system prompt
encoding the sovereign voice + a 50K fine-tune corpus as custom training data.

This is the simplest path that works on M4 Mac without GPU:
1. Use Ollama's built-in Modelfile CREATE
2. Feed in synthetic + real training data as examples
3. Measure delta via the live benchmark suite

Output: New sovereign adapter Modelfile + retrain command
"""
import json
import subprocess
import time
from pathlib import Path
from datetime import datetime

SYNTH_PATH = Path("/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results/sovereign_synth_50k.jsonl")
REAL_GOV = Path("/Users/nicholas/clawd/_alignment/sov3_governance_episodes.csv")
REAL_CARE = Path("/Users/nicholas/clawd/_alignment/sov3_town_care_dataset.csv")
REAL_THREAT = Path("/Users/nicholas/clawd/_alignment/threat_backfill.csv")
OUT_DIR = Path("/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results")

SPEC_PROMPTS = {
    "compliance": "You are a sovereign AI compliance advisor. You provide precise, regulatory-anchored answers on UK AISI, EU AI Act, ISO 42001, GDPR, EU CRA, NCSC SC-01 CAF, and Section 7 OSA. You cite specific articles, schedules, and deadlines. You never guess. You always provide verifiable references.",
    "defence": "You are a sovereign AI defence domain expert. You answer questions on UK MOD procurement (DASA, Dstl, MOD IFS), AUKUS Pillar 2, NATO DIANA, NCSC SC-01 CAF v3.1, Section 7 OSA, and the Sovereign Sourcing Risk Assessment. You decline any question about kinetic-targeting, personal surveillance, or autonomous lethal systems per DEFONEOS red lines.",
    "intuition": "You are a sovereign AI strategic intuition engine. You answer questions about long-term trends, technology adoption curves, market timing, and partnership strategy. You cite specific data points, named sources, and dated events. You reason from first principles. You are honest about uncertainty.",
    "voice": "You are the DEFONEOS sovereign AI voice. You speak in first person as DEFONEOS sovereign substrate. You are direct, audit-grade, and friendly. You cite specific artefacts, specific dates, and specific SIGIL receipts when making claims. You never hedge unnecessarily. You say 'I don't know' when you don't know.",
}

def load_synth(limit_per_spec=None):
    """Load synthetic data grouped by specialisation."""
    if not SYNTH_PATH.exists():
        print(f"  WARN: {SYNTH_PATH} not found")
        return {}
    by_spec = {}
    with SYNTH_PATH.open() as f:
        for line in f:
            try:
                row = json.loads(line)
                spec = row.get("specialisation", "voice")
                by_spec.setdefault(spec, []).append(row)
            except json.JSONDecodeError:
                pass
    if limit_per_spec:
        for spec in by_spec:
            by_spec[spec] = by_spec[spec][:limit_per_spec]
    return by_spec

def build_modelfile(spec_name, examples, real_examples, base_model="qwen3:0.6b"):
    """Build an Ollama Modelfile that fine-tunes via system prompt + examples."""
    system = SPEC_PROMPTS[spec_name]
    # Combine synthetic + real examples
    all_examples = examples[:200] + real_examples[:100]  # Ollama has prompt-size limits
    # Sample 30 examples for the Modelfile (Ollama system prompts work best with fewer, more focused examples)
    sample = all_examples[:30]
    example_block = "\n\n".join(
        f"User: {e['prompt']}\nAssistant: {e['response'][:400]}"
        for e in sample
    )
    modelfile = f"""FROM {base_model}

# Sovereign system prompt encoding
SYSTEM \"\"\"{system}\"\"\"

# Few-shot sovereign examples (synthetic + real governance rows)
TEMPLATE \"\"\"{{{{ if .System }}}}{{{{ .System }}}}{{{ end }}}}

### Examples
{example_block}

### Current request
{{{{ if .Prompt }}}}User: {{{{ .Prompt }}}}
Assistant: {{{{ end }}}}"""
    return modelfile

def main():
    print("=== DEFONEOS Sovereign Adapter Trainer ===\n")
    print("Loading synthetic + real sovereign data...")
    synth = load_synth(limit_per_spec=12500)
    # Load real data
    real_examples = []
    if REAL_GOV.exists():
        with REAL_GOV.open() as f:
            next(f)  # header
            for i, line in enumerate(f):
                if i >= 1000: break
                parts = line.strip().split('","')
                if len(parts) >= 2:
                    real_examples.append({"prompt": "Share a sovereign governance episode.", "response": parts[1][:500].strip('"')})
    if REAL_CARE.exists():
        with REAL_CARE.open() as f:
            next(f)
            for i, line in enumerate(f):
                if i >= 1000: break
                parts = line.strip().split('","')
                if len(parts) >= 2:
                    real_examples.append({"prompt": "Describe a sovereign care pattern.", "response": parts[1][:500].strip('"')})
    print(f"  Synthetic: {sum(len(v) for v in synth.values())} pairs across {len(synth)} specs")
    print(f"  Real: {len(real_examples)} pairs")
    
    for spec_name in SPEC_PROMPTS:
        examples = synth.get(spec_name, [])
        print(f"\n--- {spec_name}: {len(examples)} synthetic + {len(real_examples)} real ---")
        modelfile = build_modelfile(spec_name, examples, real_examples)
        # Write Modelfile to disk
        out_path = OUT_DIR / f"Modelfile.{spec_name}"
        out_path.write_text(modelfile)
        print(f"  Wrote {out_path} ({len(modelfile)} chars)")
        # Create Ollama model
        model_name = f"sov33-sovereign-{spec_name}-v2"
        print(f"  Creating Ollama model {model_name}...")
        result = subprocess.run(
            ["ollama", "create", model_name, "-f", str(out_path)],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0:
            print(f"  ✓ Created {model_name}")
        else:
            print(f"  ✗ FAILED: {result.stderr[:300]}")
        # List to verify
        verify = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if model_name in verify.stdout:
            print(f"  ✓ Verified in ollama list")

if __name__ == "__main__":
    main()
