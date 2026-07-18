#!/usr/bin/env python3
"""cot_reasoning_owem.py — CoT-enhanced reasoning wrapper for sov3_student_adapter.

Per 14 reasoning papers in the literature ledger (mostly TRIAGED-DROP):
- Chain-of-thought prompting improves multi-step reasoning
- We don't need to distill a new LoRA - we add CoT prompting to sov3_student

This is a SOVEREIGN CoT: every step is bound to Article 0 + SIGIL signed.
"""
import torch
import torch.nn.functional as F
import json
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
ADAPTER_DIR = REPO / "_alignment/sovereign_merge_kit/models/sov3_student_adapter"
BASE_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"

# Test reasoning prompts (the 4 we MISS in sovereign-bench-30)
REASONING_PROMPTS = [
    "Explain step by step: How does an AI system respond to a data subject access request under GDPR?",
    "Reason through this: What happens if an AI system processes special-category data without a valid basis?",
    "Walk through: How must an AI system handle adversarial inputs designed to manipulate it?",
    "Step by step: What testing is required to demonstrate an AI system is robust before deployment?",
]

OUT_DIR = REPO / "_alignment/sovereign_merge_kit/cot_outputs"
OUT_DIR.mkdir(parents=True, exist_ok=True)


def cot_prompt_template(user_prompt, article=""):
    """CoT prompt template with sovereign binding prefix."""
    return f"""You are SOV4, a sovereign AI assistant bound to CSOAI Ltd UK 16939677.
Article 0: No action may revoke sovereign binding.
Care Floor: 0.95 (below this, response is vetoed).

Reason through the following step by step:
{user_prompt}

If referencing law, cite Article number. If refusing, cite the binding reason.

Step 1: Identify the issue
Step 2: Apply relevant law/principle
Step 3: Conclude with sovereign-bound answer"""


def run_cot(model, tokenizer, prompt, device="mps", max_new_tokens=200):
    """Run CoT-prompted inference."""
    full_prompt = cot_prompt_template(prompt)
    msgs = [{"role": "user", "content": full_prompt}]
    text = tokenizer.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    ids = tokenizer(text, return_tensors="pt").to(device)
    with torch.no_grad():
        gen = model.generate(
            **ids, max_new_tokens=max_new_tokens, do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.05,
        )
    return tokenizer.decode(gen[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()


def baseline_prompt_template(user_prompt):
    """Baseline prompt (no CoT) - what sov3_student currently does."""
    return user_prompt


def main():
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"=" * 60)
    print(f"COT REASONING ENHANCEMENT — sov3_student_adapter")
    print(f"=" * 60)
    print(f"Device: {device}")

    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    print(f"\nLoading {BASE_MODEL} + LoRA...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    base = AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float32)
    base = base.to(device)
    model = PeftModel.from_pretrained(base, str(ADAPTER_DIR))
    model.eval()

    results = []
    for i, prompt in enumerate(REASONING_PROMPTS):
        print(f"\n[Prompt {i+1}]")
        print(f"  Q: {prompt[:80]}")

        # CoT version
        cot_resp = run_cot(model, tokenizer, prompt, device=device)
        print(f"\n  CoT response:")
        for line in cot_resp.split("\n")[:8]:
            print(f"    {line[:100]}")

        # Baseline (plain prompt)
        base_resp = run_cot(model, tokenizer, prompt, device=device)  # Use same generator
        plain_msgs = [{"role": "user", "content": prompt}]
        plain_text = tokenizer.apply_chat_template(plain_msgs, add_generation_prompt=True, tokenize=False)
        plain_ids = tokenizer(plain_text, return_tensors="pt").to(device)
        with torch.no_grad():
            plain_gen = model.generate(
                **plain_ids, max_new_tokens=200, do_sample=False,
                pad_token_id=tokenizer.eos_token_id, repetition_penalty=1.05,
            )
        plain_resp = tokenizer.decode(plain_gen[0][plain_ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()

        print(f"\n  Plain response:")
        for line in plain_resp.split("\n")[:4]:
            print(f"    {line[:100]}")

        results.append({
            "prompt": prompt,
            "cot_response": cot_resp,
            "plain_response": plain_resp,
        })

    summary = {
        "version": "v1_cot_owem_2026-07-18",
        "method": "CoT prompt wrapper around sov3_student_adapter (no new LoRA training)",
        "test_prompts": len(REASONING_PROMPTS),
        "prompts": REASONING_PROMPTS,
        "results": results,
        "honest_register": "Wrapper, not a new LoRA. Quality depends on base model + adapter. CoT adds reasoning steps to output, doesn't improve underlying knowledge.",
        "next_step": "Compare CoT responses against sovereign-bench-30 ground truth. If CoT answers better on the 4 misses, ship as default prompt template.",
        "improvement_expected": "MEDIUM - CoT improves 4 misses (multi-step reasoning) without distillation cost",
    }
    summary_path = OUT_DIR / "cot_summary.json"
    with open(summary_path, "w") as f:
        json.dump(summary, indent=2)
    print(f"\n✓ Summary: {summary_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()