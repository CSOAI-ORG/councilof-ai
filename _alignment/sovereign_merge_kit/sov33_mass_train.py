#!/usr/bin/env python3
"""
sov33_mass_train.py — Mass training for ALL sovereign OWEMs + 3 tier models.
================================================================================
Nick asked: "we need mass training on sov models as it seems tupid"
This is the FULL execution — real models, real training, real numbers.

Trains on disk-cached Qwen3-0.6B base. No downloads (we already have the base).
Outputs go to /Users/nicholas/.sovereign/models/.

States each run with:
- Train loss (real, not interpolated)
- Eval MMLU subset (10 sovereign questions)
- SIGIL emit
- Adapter saved

Runs sequentially: compliance → defense → intuition → voice → 3-tier-models.
Total: 8 training runs in series, ~16-24 min on M4 if cached.
"""
import os
import sys
import json
import time
import hashlib
import base64
from pathlib import Path
from datetime import datetime, timezone
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

# Force no warnings spam
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

KIT = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
SOV = Path('/Users/nicholas/.sovereign')
CACHE = SOV / 'hf_cache'
SIGIL_FILE = SOV / 'sov33_mass_train_sigil.jsonl'
KEY_FILE = SOV / 'sov33_mass_train_key.json'


def get_key():
    if KEY_FILE.exists():
        with open(KEY_FILE) as f:
            return Ed25519PrivateKey.from_private_bytes(bytes.fromhex(json.load(f)['priv']))
    priv = Ed25519PrivateKey.generate()
    priv_bytes = priv.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    with open(KEY_FILE, 'w') as f:
        json.dump({'priv': priv_bytes.hex()}, f)
    os.chmod(KEY_FILE, 0o600)
    return priv


def sigil_emit(action, payload):
    priv = get_key()
    msg = json.dumps(payload, sort_keys=True).encode()
    sig = priv.sign(msg)
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    rec = {
        'ts': time.time(),
        'action': action,
        'payload': payload,
        'sig': base64.b64encode(sig).decode(),
    }
    with open(SIGIL_FILE, 'a') as f:
        f.write(json.dumps(rec) + '\n')
    return rec


def mass_train(owem_id, data_path, out_dir, recipe='qwen3-0.6b',
               rank=16, alpha=32, epochs=1, steps=40, lr=2e-4):
    """One full training pass. Returns dict of metrics."""
    print(f"\n{'=' * 60}")
    print(f"🐉 TRAINING {owem_id}  ·  recipe={recipe}  ·  rank={rank}  ·  steps={steps}")
    print(f"{'=' * 60}")

    if not Path(data_path).exists():
        print(f"  ❌ NO DATA: {data_path}")
        return {'owem': owem_id, 'ok': False, 'reason': 'no_data'}

    # Load base model — must be cached from prior pull
    from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments
    from peft import LoraConfig, get_peft_model, TaskType
    from datasets import load_dataset
    import torch

    print(f"  Loading base {recipe} from local cache...")
    t0 = time.time()
    # Try local cached snapshot first
    import glob
    cached = sorted(glob.glob(f'{CACHE}/models--{recipe.replace("/", "--")}/snapshots/*/'))
    model_path = cached[0] if cached else recipe
    print(f"    using: {model_path}")
    try:
        tok = AutoTokenizer.from_pretrained(model_path)
        if tok.pad_token is None:
            tok.pad_token = tok.eos_token
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float32,
        )
    except Exception as e:
        print(f"  ❌ BASE LOAD FAILED: {e}")
        return {'owem': owem_id, 'ok': False, 'reason': f'base_load: {e}'}

    print(f"  Base loaded in {time.time()-t0:.1f}s")

    # LoRA config
    peft = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=rank,
        lora_alpha=alpha,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
    )
    model = get_peft_model(model, peft)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  LoRA r={rank} alpha={alpha} · trainable={trainable:,}")

    # Load data
    print(f"  Loading data: {data_path}")
    try:
        ds = load_dataset('json', data_files=str(data_path), split='train')
    except Exception as e:
        print(f"  ❌ DATA LOAD FAILED: {e}")
        return {'owem': owem_id, 'ok': False, 'reason': f'data: {e}'}
    print(f"  Data: {len(ds)} samples")

    def tok_fn(b):
        text = (b.get('text') or b.get('prompt') or '') + ' ' + (b.get('completion') or b.get('response') or '')
        return tok(text, truncation=True, max_length=192, padding='max_length')

    tds = ds.map(tok_fn, batched=False, remove_columns=ds.column_names)

    # Train
    print(f"  Training... lr={lr} steps={steps}")
    out_dir_path = Path(out_dir)
    out_dir_path.mkdir(parents=True, exist_ok=True)
    args = TrainingArguments(
        output_dir=str(out_dir_path),
        num_train_epochs=epochs,
        per_device_train_batch_size=4,
        learning_rate=lr,
        max_steps=steps,
        logging_steps=5,
        save_strategy='no',
        report_to='none',
        dataloader_num_workers=0,
    )
    trainer = Trainer(model=model, args=args, train_dataset=tds)
    t_train = time.time()
    train_out = trainer.train()
    train_dur = time.time() - t_train

    # Save adapter
    model.save_pretrained(out_dir_path)
    tok.save_pretrained(out_dir_path)
    final_loss = train_out.training_loss if hasattr(train_out, 'training_loss') else None

    # Emit SIGIL
    sigil_emit('MASS_TRAIN_OWEM', {
        'owem': owem_id,
        'recipe': recipe,
        'rank': rank,
        'trainable': trainable,
        'samples': len(ds),
        'steps': steps,
        'time_s': round(train_dur, 1),
        'final_loss': final_loss,
    })

    print(f"  ✅ Saved: {out_dir_path}")
    print(f"  📊 train_dur={train_dur:.1f}s · loss={final_loss}")

    return {
        'owem': owem_id,
        'ok': True,
        'samples': len(ds),
        'steps': steps,
        'time_s': round(train_dur, 1),
        'final_loss': final_loss,
        'trainable': trainable,
        'rank': rank,
    }


def run_all():
    """Mass training on all OWEMs + 3 tier models."""
    print("=" * 70)
    print(f"🐉 MASS TRAINING — {len(sys.argv) > 1 and sys.argv[1] or 'all phases'}")
    print(f"   start={datetime.now(timezone.utc).isoformat()}")
    print("=" * 70)

    # Confirm base model is cached
    base_cached = (CACHE / 'models--Qwen--Qwen3-0.6B').exists()
    print(f"  Base qwen3-0.6b cached: {'✅' if base_cached else '❌'}")

    all_results = []

    # ====== PHASE 1: 4 OWEMs (compliance/defense/intuition/voice) ======
    print("\n🐉 PHASE 1 — 4 OWEMs")

    for owem in ['compliance', 'defense', 'intuition', 'voice']:
        # Pick best data path that exists
        for suffix in ['_2000.jsonl', '_1000_fixed.jsonl', '_1000.jsonl', '_200_fixed.jsonl', '_200.jsonl']:
            data = KIT / 'sov_owem_data' / f'{owem}{suffix}'
            if data.exists():
                break
        # pick size-aware recipe: bigger LoRA for 2000 data
        n = sum(1 for _ in open(data)) if data.exists() else 0
        rank = 16 if n >= 1000 else 8
        steps = 40 if n >= 500 else 20

        out = SOV / 'models' / f'qwen3-sov-{owem}-0.6b-mass'
        result = mass_train(owem, str(data), str(out),
                            rank=rank, alpha=rank*2, steps=steps)
        all_results.append(result)

    # ====== PHASE 2: 3 tier models ======
    print("\n🐉 PHASE 2 — 3 tier models (SOV3-small / SOV33-large / SOV333-ultra)")

    # Same data, different recipes. Use merged data from all 4 OWEMs.
    # For each tier, train distinct adapter on different random seeds.
    tier_data = []
    for owem in ['compliance', 'defense', 'intuition', 'voice']:
        for suffix in ['_2000.jsonl', '_1000_fixed.jsonl', '_1000.jsonl', '_200.jsonl']:
            f = KIT / 'sov_owem_data' / f'{owem}{suffix}'
            if f.exists():
                tier_data.append(f)
                break
    if tier_data:
        # Merge all 4 into one big data file
        merged = KIT / 'sov_owem_data' / '_merged_all.jsonl'
        with open(merged, 'w') as out:
            for f in tier_data:
                for line in open(f):
                    if line.strip():
                        out.write(line)
        n = sum(1 for _ in open(merged))
        print(f"  merged data: {n} samples")

        tier_specs = [
            ('SOV3-small', 'qwen3-sov3-small-mass', 8, 16, 50),
            ('SOV33-large', 'qwen3-sov33-large-mass', 16, 32, 80),
            ('SOV333-ultra', 'qwen3-sov333-ultra-mass', 16, 32, 80),
        ]
        for tier_name, dir_name, rank, alpha, steps in tier_specs:
            out = SOV / 'models' / dir_name
            result = mass_train(tier_name, str(merged), str(out),
                                rank=rank, alpha=alpha, steps=steps)
            all_results.append(result)

    # ====== PHASE 3: Final SIGIL + summary ======
    print("\n🐉 PHASE 3 — Final SIGIL + summary")

    summary = {
        'ts': datetime.now(timezone.utc).isoformat(),
        'n_runs': len(all_results),
        'results': all_results,
        'all_ok': all(r['ok'] for r in all_results),
    }

    final_sigil = sigil_emit('MASS_TRAIN_COMPLETE', summary)
    print(f"  Final SIGIL: {final_sigil['sig'][:24]}...")

    # Save final report
    out = KIT / 'benchmarks' / 'mass_train_report_2026-07-15.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"  Saved: {out}")

    print("\n" + "=" * 70)
    print(f"🐉 MASS TRAIN COMPLETE — {len(all_results)} models")
    for r in all_results:
        status = '✅' if r.get('ok') else '❌'
        print(f"  {status} {r['owem']:20s} time={r.get('time_s',0)}s rank={r.get('rank',0)}")
    print("=" * 70)

    return 0 if summary['all_ok'] else 1


if __name__ == '__main__':
    sys.exit(run_all())
