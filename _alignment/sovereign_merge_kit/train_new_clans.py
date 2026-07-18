#!/usr/bin/env python3
"""train_new_clans.py — Train 4 new clan adapters from refined honey.

Per EAT-790: breed new clans from our existing honey commons.

Each clan = a LoRA adapter trained on a different honey sector:
  governance clan -> governance_refined.jsonl (400 rows)
  defense clan -> defense_refined.jsonl (600 rows)
  reasoning clan -> reasoning_refined.jsonl (900 rows)
  judgment clan -> judgment_refined.jsonl (400 rows)

All on Qwen2.5-0.5B-Instruct (same base = Qwen family).
Different honey = different specialty = real coverage.

Per the water->honey emergence:
  The ESTATE gains abilities (new domains covered).
  The base MODEL stays 0.5B (does not grow).
  New clans from old honey = the forest grows new branches.

Honest: same base (same blood) — rho_guard would REFUSE these as
decorrelated voters. But for TRAINING PURPOSES (seating specialists),
same-base-different-data IS the legitimate way to build specialists.
The rho_guard applies when ENSEMBLING, not when training.
"""
import json
import os
import sys
import time
from pathlib import Path

REPO = Path("/Users/nicholas/clawd")
HONEY_DIR = REPO / "_alignment/sovereign_merge_kit/expert_data"
OUT_DIR = REPO / "_alignment/sovereign_merge_kit/models_new_clans"
OUT_DIR.mkdir(parents=True, exist_ok=True)
BASE_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"


def load_honey(sector):
    """Load refined honey for a sector."""
    path = HONEY_DIR / f"{sector}_refined.jsonl"
    if not path.exists():
        print(f"  [skip] {path} not found")
        return []
    rows = []
    with open(path) as f:
        for line in f:
            if line.strip():
                r = json.loads(line)
                q = r.get("instruction", "").strip()
                a = r.get("response", "").strip()
                if q and a and len(q) > 5 and len(a) > 1:
                    rows.append({"instruction": q, "response": a, "quality_ok": r.get("quality_ok", True)})
    return rows


def train_clan(sector, honey_rows, max_rows=200, epochs=2):
    """Train a LoRA adapter on a sector's honey."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
    from peft import LoraConfig, get_peft_model
    from datasets import Dataset

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    out_path = OUT_DIR / f"clan_{sector}"
    out_path.mkdir(parents=True, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"TRAINING CLAN: {sector}")
    print(f"  honey: {len(honey_rows)} rows (using max {max_rows})")
    print(f"  device: {device}")
    print(f"  base: {BASE_MODEL}")
    print(f"{'='*60}")

    # Load base
    tok = AutoTokenizer.from_pretrained(BASE_MODEL)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token

    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float32).to(device)

    # LoRA config (same as sibling's adapters: r=16, alpha=32)
    lora_config = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    # Prepare data
    train_rows = honey_rows[:max_rows]
    def format_example(row):
        return {
            "input_ids": tok.encode(row["instruction"], add_special_tokens=True)[:512],
            "labels": tok.encode(row["response"], add_special_tokens=True)[:256],
        }

    # Create dataset with proper formatting for causal LM
    formatted = []
    for row in train_rows:
        text = f"### Instruction: {row['instruction']}\n### Response: {row['response']}"
        ids = tok(text, return_tensors="pt", truncation=True, max_length=512, padding="max_length")
        formatted.append({"input_ids": ids["input_ids"][0].tolist(), "attention_mask": ids["attention_mask"][0].tolist()})

    ds = Dataset.from_list(formatted)

    # Training
    args = TrainingArguments(
        output_dir=str(out_path),
        num_train_epochs=epochs,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        save_steps=1000,
        logging_steps=20,
        report_to=[],
        save_strategy="no",
    )

    def collate(batch):
        input_ids = torch.stack([torch.tensor(x["input_ids"]) for x in batch])
        attention_mask = torch.stack([torch.tensor(x["attention_mask"]) for x in batch])
        labels = input_ids.clone()
        labels[labels == tok.pad_token_id] = -100
        return {"input_ids": input_ids, "attention_mask": attention_mask, "labels": labels}

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=ds,
        data_collator=collate,
    )

    t0 = time.time()
    trainer.train()
    elapsed = time.time() - t0

    # Save adapter
    model.save_pretrained(str(out_path))
    tok.save_pretrained(str(out_path))

    # Save metadata
    meta = {
        "sector": sector,
        "base": BASE_MODEL,
        "honey_rows": len(train_rows),
        "epochs": epochs,
        "elapsed_sec": round(elapsed, 1),
        "lora_r": 16,
        "lora_alpha": 32,
        "saved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    with open(out_path / "clan_meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"  OK clan_{sector} trained in {elapsed:.0f}s")
    print(f"  saved: {out_path}")

    # Free memory
    del model, trainer
    if device == "mps":
        torch.mps.empty_cache()

    return meta


def main():
    print("=" * 60)
    print("BREEDING NEW CLANS FROM HONEY")
    print("=" * 60)

    clans_to_breed = [
        ("governance", 200),  # 400 rows, use 200
        ("defense", 200),     # 600 rows, use 200
        ("reasoning", 200),   # 900 rows, use 200
        ("judgment", 200),    # 400 rows, use 200
    ]

    results = []
    for sector, max_rows in clans_to_breed:
        honey = load_honey(sector)
        if not honey:
            continue
        meta = train_clan(sector, honey, max_rows=max_rows, epochs=2)
        results.append(meta)

    # Summary
    print(f"\n{'='*60}")
    print("CLANS BRED")
    print(f"{'='*60}")
    for r in results:
        print(f"  clan_{r['sector']:15s} {r['honey_rows']:4d} rows  {r['elapsed_sec']:.0f}s")
    print(f"  total: {len(results)} new clans")

    # Save summary
    with open(OUT_DIR / "clan_breeding_summary.json", "w") as f:
        json.dump({
            "version": "v1_clan_breeding_2026-07-18",
            "base": BASE_MODEL,
            "n_clans": len(results),
            "clans": results,
            "honest_register": (
                "Same base (Qwen2.5-0.5B) + different honey = different specialists. "
                "Same blood = rho_guard would REFUSE as decorrelated voters. "
                "But for TRAINING specialists, same-base-different-data is legitimate. "
                "The ESTATE gains abilities; the base MODEL stays 0.5B."
            ),
        }, f, indent=2)


if __name__ == "__main__":
    main()