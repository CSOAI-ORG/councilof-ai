"""
sov3_small_fast.py — SOV3 small FAST world model training.

500 examples, 1 epoch, 125 steps, ~5min on MPS.
Trains a TIGHT world model (rank=8, all 4 targets) on the sovereign corpus.
"""
import os
import sys
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone

os.environ.pop('PYTHONPATH', None)
os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov3-small-fast')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov3_small_fast.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_merged_corpus.jsonl'
BASE_MODEL = '/Users/nicholas/.sovereign/hf_cache/hub/models--Qwen--Qwen3-0.6B/snapshots/c1899de289a04d12100db370d81485cdf75e47ca'


def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try:
                    chain.append(json.loads(line))
                except Exception:
                    pass
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


def train():
    print("="*70)
    print("SOV3 SMALL FAST — TIGHT WORLD MODEL (rank=8, 500 ex, 5min)")
    print("="*70)
    sigil_emit({'hop': 'SOV3_SMALL_FAST_START', 'base': BASE_MODEL})
    
    # Load data - only 500 examples
    print("\n[1] Loading 500 examples...")
    examples = []
    with open(DATA_PATH) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d:
                        examples.append(d)
                        if len(examples) >= 500:
                            break
                except Exception:
                    pass
    print(f"  Loaded {len(examples)}")
    
    # Load model
    print("\n[2] Loading model...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, local_files_only=True, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float32, local_files_only=True, trust_remote_code=True)
    if device == 'mps':
        model = model.to('mps')
    
    # LoRA - rank 8 (tighter than SOV33 large)
    print("\n[3] Adding LoRA (rank=8)...")
    lora_config = LoraConfig(r=8, lora_alpha=16, target_modules=['q_proj','k_proj','v_proj','o_proj'], lora_dropout=0.05, bias='none', task_type=TaskType.CAUSAL_LM)
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Format
    print("\n[4] Formatting...")
    def fmt(d):
        msgs = d.get('messages', [])
        text = ''
        for m in msgs:
            content = m.get('content') or ''
            if isinstance(content, str) and content:
                role = m.get('role', 'user')
                text += f'<{role}>: {content}\n'
        if not text.strip():
            return {'input_ids': []}
        ids = tokenizer(text, truncation=True, max_length=512).input_ids
        return {'input_ids': ids, 'attention_mask': [1]*len(ids)} if ids else {'input_ids': []}
    
    data = [fmt(e) for e in examples]
    data = [d for d in data if d.get('input_ids')]
    print(f"  {len(data)} valid")
    
    dataset = Dataset.from_list(data)
    sigil_emit({'hop': 'SOV3_SMALL_FAST_FORMATTED', 'n_valid': len(data)})
    
    # Training - 1 epoch only
    print("\n[5] Training (1 epoch, batch=2, grad_accum=2)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=1,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=2,
        learning_rate=2e-4,
        warmup_steps=10,
        logging_steps=25,
        save_strategy='no',  # save at end only to avoid disk pressure
        report_to='none',
        remove_unused_columns=False,
        dataloader_pin_memory=False,
        gradient_checkpointing=True,
    )
    trainer = Trainer(model=model, args=args, train_dataset=dataset, data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False))
    
    start = time.time()
    try:
        result = trainer.train()
        train_loss = result.training_loss
    except KeyboardInterrupt:
        train_loss = None
    except Exception as e:
        train_loss = None
        print(f"  Error: {e}")
    duration = time.time() - start
    
    print(f"\n[6] Saving...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({'hop': 'SOV3_SMALL_FAST_SAVE', 'output': str(OUTPUT_DIR), 'duration_s': int(duration), 'n_valid': len(data), 'train_loss': train_loss, 'trainable': trainable})
    
    readme = f"""# SOV3 SMALL FAST — Tight World Model
- Base: Qwen3-0.6B
- LoRA: rank=8, alpha=16, q/k/v/o (all 4 targets)
- Training: 500 examples × 1 epoch, batch=2
- Duration: {duration:.0f}s ({duration/60:.1f} min)
- Train loss: {train_loss}
- Trainable: {trainable:,} ({trainable/total*100:.3f}%)
- vs SOV33 large V2: rank=16 vs rank=8 (sovereign-tight)
- vs SOV3 small v1: rank=16 target=[v,q] vs rank=8 target=[q,k,v,o]
- Created: {datetime.now(timezone.utc).isoformat()}
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"  ✓ Saved to {OUTPUT_DIR}")
    print(f"  ✓ Duration: {duration:.0f}s")
    print(f"  ✓ Train loss: {train_loss}")
    return OUTPUT_DIR


if __name__ == '__main__':
    train()
