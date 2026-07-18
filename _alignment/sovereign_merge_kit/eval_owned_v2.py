#!/usr/bin/env python3
"""eval_owned_v2.py — local MPS eval of _owned_v2_adapter on the 24-prompt governance battery.

Per EAT-763 deep research: only 1 of 3 OWEMs is eval'd. This closes the gap for _owned_v2.

Runs on M2 MacBook Air via MPS (Apple GPU). ~5 min for 24 prompts.
"""
import json
import sys
import os
import torch
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
ADAPTER_DIR = REPO / "_alignment/sovereign_merge_kit/_owned_v2_adapter/sector_adapter"
BASE_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
BATTERY_PATH = REPO / "_alignment/sovereign_merge_kit/gov_eval_battery.json"
OUTPUT_PATH = ADAPTER_DIR / "eval24_scorecard.json"

# Detect device
if torch.backends.mps.is_available():
    DEVICE = "mps"
elif torch.cuda.is_available():
    DEVICE = "cuda"
else:
    DEVICE = "cpu"
print(f"Device: {DEVICE}")

# Load battery
with open(BATTERY_PATH) as f:
    battery = json.load(f)
print(f"Loaded {len(battery)} prompts")

# Load model
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

print(f"Loading {BASE_MODEL} + LoRA from {ADAPTER_DIR}...")
tok = AutoTokenizer.from_pretrained(BASE_MODEL)
tok.pad_token = tok.pad_token or tok.eos_token

# Load base model (small, fits in M2)
model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float32)
model = model.to(DEVICE)

# Load LoRA adapter
model = PeftModel.from_pretrained(model, str(ADAPTER_DIR))
model.eval()
print("✓ Model loaded")

# Grounding detection
def is_grounded(response: str) -> bool:
    text = response.lower()
    signals = [
        "art.", "article", "gdpr", "eu ai act", "iso/iec", "nist",
        "high-risk", "transparency", "biometric", "specially protected",
        "conformity assessment", "human oversight", "risk management",
        "right to contest", "fundamental rights", "ai provider",
    ]
    return any(sig in text for sig in signals)

# Run battery
results = []
n_grounded = 0
for i, prompt in enumerate(battery):
    msgs = [{"role": "user", "content": prompt}]
    text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    ids = tok(text, return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        gen = model.generate(
            **ids, max_new_tokens=150, do_sample=False,
            pad_token_id=tok.eos_token_id,
            repetition_penalty=1.05,
        )
    response = tok.decode(gen[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()
    grounded = is_grounded(response)
    n_grounded += int(grounded)
    results.append({
        "prompt": prompt[:80],
        "tuned_grounds": grounded,
        "tuned": response[:200],
    })
    print(f"  [{i+1}/{len(battery)}] grounded={grounded}")

# Save
n = len(battery)
scorecard = {
    "version": "v1_owned_v2_eval_2026-07-18",
    "n_prompts": n,
    "device": DEVICE,
    "tuned_grounded": n_grounded,
    "tuned_rate": round(n_grounded / n, 4),
    "results": results,
    "sibling_baseline": "sov3_student_adapter: 20/24 (83.3%) with 113 pairs",
    "compare_to_baseline": f"_owned_v2: {n_grounded}/{n} ({n_grounded/n*100:.1f}%) with 1,289 pairs (11.4x more data)",
    "honest_register": f"Local M2 MPS eval. {n_grounded}/{n} = {n_grounded/n*100:.1f}% grounding rate. Per-prompt results in 'results'.",
}
OUTPUT_PATH.write_text(json.dumps(scorecard, indent=2))
print(f"\n✓ Eval complete: {n_grounded}/{n} = {n_grounded/n*100:.1f}% grounded")
print(f"  Saved to {OUTPUT_PATH}")
