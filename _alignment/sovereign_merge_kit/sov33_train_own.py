#!/usr/bin/env python3
"""
sov33_train_own.py — Train the FIRST sovereign model.
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

This is STAGE 1 of the SOV-OWM plan: train a sovereign-owned model on
the sovereign corpus. NOT a wrapper. Our own weights.

What it does:
  1. Loads Qwen3-0.6B (smallest sovereign-friendly base)
  2. QLoRA-fine-tunes on sovereign compliance data (801 samples)
  3. Saves the model to ~/.sovereign/models/qwen3-sov-compliance-0.6b/
  4. Emits a SIGIL with the training metadata

Requirements:
  - peft, trl, bitsandbytes, accelerate, datasets (installed)
  - torch 2.13+ with MPS (Apple Silicon GPU)
  - ~3GB free disk
  - ~2 hours on M4 Air
"""
import sys
import os
import json
import time
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
def _skills_dir():
    d=_os.environ.get('SOV33_SKILLS_DIR') or _os.path.join(_os.path.expanduser('~'),'.hermes','skills')
    return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'sov_trained_model.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)


def sigil_emit(hop: dict) -> str:
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def main():
    parser = argparse.ArgumentParser(description='Train a sovereign model on the sovereign corpus')
    parser.add_argument('--base', default='Qwen/Qwen3-0.6B')
    parser.add_argument('--data', default='/Users/nicholas/clawd/_alignment/sovereign_merge_kit/expert_data/compliance.jsonl')
    parser.add_argument('--out', default=None)
    parser.add_argument('--epochs', type=float, default=2.0)
    parser.add_argument('--lr', type=float, default=2e-4)
    parser.add_argument('--rank', type=int, default=16, help='LoRA rank (16 is forgetting-optimal)')
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    out_dir = Path(args.out or os.path.expanduser(f'~/.sovereign/models/{args.base.split("/")[-1]}-sov'))
    out_dir.mkdir(parents=True, exist_ok=True)

    print()
    print("=" * 70)
    print(f"SOV33 TRAIN OWN — Stage 1 of SOV-OWM plan")
    print("=" * 70)
    print(f"  Base model: {args.base}")
    print(f"  Data: {args.data}")
    print(f"  Output: {out_dir}")
    print(f"  Epochs: {args.epochs}, LR: {args.lr}, LoRA rank: {args.rank}")
    print()

    t_start = time.time()
    sigil_emit({
        'hop': 'SOV_TRAIN_START',
        'base': args.base,
        'data': args.data,
        'out': str(out_dir),
        'epochs': args.epochs,
        'lr': args.lr,
        'rank': args.rank,
    })

    # Load deps
    from datasets import load_dataset
    from transformers import (
        AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig,
        TrainingArguments,
    )
    from peft import LoraConfig, get_peft_model
    from trl import SFTTrainer, SFTConfig

    # 4-bit quantization for M4 (no GPU = 4-bit is essential)
    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type='nf4',
        bnb_4bit_compute_dtype='bfloat16',
        bnb_4bit_use_double_quant=True,
    )

    # Load tokenizer
    print(f"[{time.time()-t_start:.0f}s] Loading tokenizer...")
    tok = AutoTokenizer.from_pretrained(args.base, trust_remote_code=True)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    tok.padding_side = 'right'

    # Load model (4-bit)
    print(f"[{time.time()-t_start:.0f}s] Loading model in 4-bit...")
    device = 'mps' if __import__('torch').backends.mps.is_available() else 'cpu'
    print(f"  Device: {device}")
    model = AutoModelForCausalLM.from_pretrained(
        args.base,
        quantization_config=bnb,
        device_map='auto' if device == 'cpu' else {'': device},
        trust_remote_code=True,
    )
    model.config.use_cache = False
    model.gradient_checkpointing_enable()

    # LoRA config
    print(f"[{time.time()-t_start:.0f}s] Setting up LoRA (rank={args.rank})...")
    lora = LoraConfig(
        r=args.rank,
        lora_alpha=args.rank * 2,
        lora_dropout=0.05,
        bias='none',
        task_type='CAUSAL_LM',
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
    )
    model = get_peft_model(model, lora)
    model.print_trainable_parameters()

    # Load + format data
    print(f"[{time.time()-t_start:.0f}s] Loading data...")
    ds = load_dataset('json', data_files=args.data, split='train')
    print(f"  Loaded {len(ds)} samples")

    def fmt(ex):
        text = tok.apply_chat_template(ex['messages'], tokenize=False, add_generation_prompt=False)
        return {'text': text}
    ds = ds.map(fmt)

    # SFT config
    print(f"[{time.time()-t_start:.0f}s] Setting up trainer...")
    cfg = SFTConfig(
        output_dir=str(out_dir),
        num_train_epochs=args.epochs,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=2,
        learning_rate=args.lr,
        bf16=True,
        logging_steps=10,
        save_strategy='epoch',
        max_length=1024,
        report_to='none',
        gradient_checkpointing=False,
    )

    trainer = SFTTrainer(
        model=model,
        args=cfg,
        train_dataset=ds,
        processing_class=tok,
    )

    print(f"[{time.time()-t_start:.0f}s] Training...")
    trainer.train()

    # Save the model
    print(f"[{time.time()-t_start:.0f}s] Saving to {out_dir}...")
    trainer.save_model(str(out_dir))
    tok.save_pretrained(str(out_dir))

    elapsed = time.time() - t_start
    print()
    print("=" * 70)
    print(f"SOV33 OWN MODEL TRAINED in {elapsed:.0f}s")
    print("=" * 70)
    print(f"  Model: {out_dir}")
    print(f"  Base: {args.base}")
    print(f"  Training data: {args.data} ({len(ds)} samples)")
    print(f"  LoRA rank: {args.rank}")
    print(f"  Epochs: {args.epochs}")
    print()

    # SIGIL
    sigil_emit({
        'hop': 'SOV_TRAINED_MODEL_V1',
        'base': args.base,
        'out': str(out_dir),
        'n_samples': len(ds),
        'epochs': args.epochs,
        'rank': args.rank,
        'elapsed_s': round(elapsed, 1),
        'care_floor': 0.95,
        'article_0_bound': True,
    })

    print(f"  SIGIL emitted.")
    print(f"  This is SOV33's first OWN model — not a wrapper.")


if __name__ == '__main__':
    main()
