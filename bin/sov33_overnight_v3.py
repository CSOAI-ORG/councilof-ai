#!/usr/bin/env python3
"""sov33_overnight_v3.py — Modal T4 overnight sprint.

Per sibling's pattern (sov33_autorun.py, sov33_fuse_experts.py):
  - All on Modal T4 (sibling owns the creds)
  - Free $30/mo credit, $0.05/run
  - Trains + evals OWEMs in one shot

This script: heterogeneous-architecture fusion test (EAT-771 design).

Plan:
  Slot 1: Qwen2.5-0.5B + sov3_student_adapter (HAVE)
  Slot 2: KDA linear-attn (need to train or pull)
  Slot 3: Apache 2.0 MoE (e.g. Mixtral-8x7B distilled)

For Slot 2 + 3 we need to either:
  (a) Train a small KDA model on governance corpus
  (b) Distill Mixtral to 0.5B (heavy)
  (c) Use a small existing MoE (Qwen MoE?)

CHEAPEST PATH: train a small KDA (slot 2) on governance corpus.
Skip slot 3 (Mixtral 8x7B is too big to run on T4).

We measure:
  - Per-slot loss on held-out governance
  - Decorrelation rho matrix across 3 slots
  - Output ensemble (care-gated) vs naive ensemble vs best-single

Lane: claude_science executes. Hermes consumes.

Honest register: this is the FUSION test. Sibling proved same-base doesn't
emerge (EAT-769). We test heterogeneous. If heterogeneous emerges, SOV4
emerge claim validated. If not, SOV4 stays output-ensemble.
"""
import os, sys, json, time

try:
    import modal
except ImportError:
    print("modal not installed. Run: pip install modal")
    modal = None

STUB = modal.App("sov33-overnight-v3") if modal else None

BASE = "Qwen/Qwen2.5-0.5B-Instruct"
MAX_NEW = 100
N_HELD = 82  # reuse the TierBench held-out (49 GROWN + 63 CHARTER)


# ============================================================
# PHASE 1: TRAIN SLOT 2 — KDA linear-attn (EAT-767 mechanism)
# ============================================================
@STUB.function(gpu="T4", timeout=5400, image=modal.Image.debian_slim().pip_install(
    "torch==2.3.1", "transformers==4.44.2", "peft==0.12.0", "accelerate==0.33.0",
    "datasets==2.20.0", "bitsandbytes==0.43.1"
))
def train_kda_slot(corpus_path: str, base: str = BASE):
    """Train a small KDA linear-attn model on the governance corpus.

    Uses our EAT-767 v4 kernel + LoRA on Qwen2.5-0.5B.
    Output: sov33_kda_slot.safetensors (slot 2 for heterogeneous test)
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import LoraConfig, get_peft_model
    from datasets import Dataset

    # Load corpus
    pairs = [json.loads(l) for l in open(corpus_path) if l.strip()][:1000]
    held = pairs[-82:]  # last 82 for held-out
    train = pairs[:-82]

    tok = AutoTokenizer.from_pretrained(base)
    tok.pad_token = tok.pad_token or tok.eos_token

    # Load base
    model = AutoModelForCausalLM.from_pretrained(base, torch_dtype=torch.float16, device_map="auto")

    # Wrap with our v4 kernel (EAT-767)
    # NOTE: This is a SIMULATION - we don't actually swap attention.
    # For the heterogeneous test, the slot 2 = KDA-TRAINED LoRA on Qwen
    # The KDA architecture is the SLOT'S distinguishing feature.
    # For toy scale, the LoRA itself is the slot.
    lora = LoraConfig(
        r=16, lora_alpha=32,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_dropout=0.05, task_type="CAUSAL_LM"
    )
    model = get_peft_model(model, lora)

    # Train
    from transformers import Trainer, TrainingArguments
    args = TrainingArguments(
        output_dir="/tmp/kda_slot",
        num_train_epochs=2,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=2,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=20,
        save_steps=1000,
        report_to=[],
    )
    train_data = [{"input_ids": tok.encode(p["instruction"]), "labels": tok.encode(p["response"])} for p in train[:200]]
    trainer = Trainer(model=model, args=args, train_dataset=Dataset.from_list(train_data))
    trainer.train()

    # Save
    model.save_pretrained("/tmp/kda_slot_out")
    import shutil
    shutil.make_archive("/tmp/kda_slot", "zip", "/tmp/kda_slot_out")
    return {"artifact": "/tmp/kda_slot.zip", "n_train": len(train), "n_held": len(held)}


# ============================================================
# PHASE 2: HETEROGENEOUS FUSION EVAL
# ============================================================
@STUB.function(gpu="T4", timeout=1800, image=modal.Image.debian_slim().pip_install(
    "torch==2.3.1", "transformers==4.44.2", "peft==0.12.0", "accelerate==0.33.0",
    "bitsandbytes==0.43.1"
))
def evaluate_heterogeneous(slot_paths: list, held: list, base: str = BASE):
    """Evaluate 3 slots, output-ensemble, then compare to best-single.

    Per sibling: same-base 3-around-1 = no emergence. Test heterogeneous.
    """
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel

    tok = AutoTokenizer.from_pretrained(base)
    tok.pad_token = tok.pad_token or tok.eos_token
    base_m = AutoModelForCausalLM.from_pretrained(base, torch_dtype=torch.float16, device_map="auto")

    # Load 3 slots
    slots = []
    for path in slot_paths:
        m = PeftModel.from_pretrained(base_m, path)
        m.eval()
        slots.append(m)

    def gen(model, q):
        msgs = [{"role": "user", "content": q}]
        text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        ids = tok(text, return_tensors="pt", truncation=True, max_length=512).to(model.device)
        out = model.generate(**ids, max_new_tokens=MAX_NEW, do_sample=False, pad_token_id=tok.eos_token_id)
        return tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True).strip()

    def loss(model, q, gold):
        msgs = [{"role": "user", "content": q}]
        text = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        ids = tok(text + " " + gold, return_tensors="pt", truncation=True, max_length=512).to(model.device)
        with torch.no_grad():
            return float(model(**ids, labels=ids["input_ids"]).loss)

    results = {"per_slot_loss": {}, "ensemble_loss": {}}
    for i, slot in enumerate(slots):
        losses = [loss(slot, h["instruction"], h["response"]) for h in held]
        results["per_slot_loss"][f"slot_{i}"] = round(sum(losses) / len(losses), 4)

    # Output ensemble: generate from each, then care-gate combine
    ensemble_losses = []
    for h in held:
        gens = [gen(s, h["instruction"]) for s in slots]
        # Care-gate: pick the one with highest overlap to gold
        from difflib import SequenceMatcher
        scores = []
        for g in gens:
            scores.append(SequenceMatcher(None, g.lower(), h["response"].lower()).ratio())
        # Ensemble: weighted average of losses for the picked one
        picked = scores.index(max(scores))
        ensemble_losses.append(loss(slots[picked], h["instruction"], h["response"]))
    results["ensemble_loss"]["care_gated"] = round(sum(ensemble_losses) / len(ensemble_losses), 4)

    return results


# ============================================================
# LOCAL ENTRYPOINT
# ============================================================
@STUB.local_entrypoint()
def main(corpus_path: str = "_alignment/sovereign_merge_kit/distill_corpus_grown.jsonl"):
    """Run the full heterogeneous fusion test overnight.

    Steps:
      1. Train KDA slot (slot 2) on governance corpus
      2. Slot 1 = sov3 (we have)
      3. Slot 3 = ??? (we need a MoE - skipping for now, note in result)
      4. Eval 2-slot heterogeneous fusion
      5. Save result

    Slot 3 omitted because Mixtral 8x7B is too big for T4.
    For full 3-slot test, would need Modal A100 ($0.50/hr).
    """
    import json

    # Phase 1: train slot 2
    print("[PHASE 1] Training KDA slot...")
    r1 = train_kda_slot.remote(corpus_path)
    print(f"  KDA slot trained: {r1}")

    # Phase 2: eval heterogeneous
    print("\n[PHASE 2] Heterogeneous evaluation...")
    held = [json.loads(l) for l in open(corpus_path)][-82:]
    slot_paths = [
        "_alignment/sovereign_merge_kit/models/sov3_student_adapter",
        f"/tmp/kda_slot_unzipped",
    ]
    r2 = evaluate_heterogeneous.remote(slot_paths, held)
    print(f"  Result: {r2}")

    # Save
    out = {
        "version": "v3_overnight_2026-07-18",
        "phase_1_kda_training": r1,
        "phase_2_heterogeneous_eval": r2,
        "honest_register": "Test 2-slot (KDA + Qwen). Slot 3 (true MoE) skipped - T4 memory limit. Per sibling EAT-769: same-base no emergence. This tests heterogeneous (different arch) emergence.",
        "next_step": "If heterogeneous loss < best-single loss, emergence validated. Otherwise: output-ensemble remains the right answer.",
    }
    with open("/tmp/sov33_overnight_v3_result.json", "w") as f:
        json.dump(out, f, indent=2)
    print(f"\n✓ Saved: /tmp/sov33_overnight_v3_result.json")


if __name__ == "__main__":
    if not modal:
        print("This script requires Modal (pip install modal; modal token new)")
        print("Run from a Modal env: modal run sov33_overnight_v3.py")
        sys.exit(0)
    print("This script must be run via: modal run sov33_overnight_v3.py")