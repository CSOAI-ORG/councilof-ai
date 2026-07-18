"""
sov3_small_v2.py — Build SOV3 small v2 (merged world model).

Strategy: train a fresh LoRA on ALL 4 target modules (q,k,v,o) on Qwen3-0.6B
with 2000 sovereign examples. Smaller rank (r=8) to keep file small.
This becomes the SOV3-small v2 world model.
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
from transformers import (
    AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov3-small-v2')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov3_small_v2.sigil.jsonl')
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
    print("SOV3 SMALL V2 — WORLD MODEL (EAT current SOV3 small weaknesses)")
    print("="*70)
    
    sigil_emit({'hop': 'SOV3_SMALL_V2_START', 'base': BASE_MODEL})
    
    # Load data
    print(f"\n[1] Loading corpus...")
    examples = []
    with open(DATA_PATH) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and len(d.get('messages', [])) > 0:
                        examples.append(d)
                        if len(examples) >= 2000:
                            break
                except Exception:
                    pass
    print(f"  Loaded {len(examples)} examples")
    
    # Load model
    print(f"\n[2] Loading model...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, local_files_only=True, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, torch_dtype=torch.float32,
        local_files_only=True, trust_remote_code=True,
    )
    if device == 'mps':
        model = model.to('mps')
    
    # LoRA - rank 8 (smaller than large v2) for small model
    print(f"\n[3] Adding LoRA (rank=8, all 4 target modules)...")
    lora_config = LoraConfig(
        r=8, lora_alpha=16,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05, bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Format
    print(f"\n[4] Formatting data...")
    def format_example(d):
        msgs = d.get('messages', [])
        clean = []
        for m in msgs:
            content = (m.get('content') or '')
            if isinstance(content, str) and content:
                clean.append({'role': m.get('role', 'user'), 'content': content})
        if not clean:
            return {'input_ids': [], 'attention_mask': []}
        try:
            text = tokenizer.apply_chat_template(clean, tokenize=False, add_generation_prompt=False)
        except Exception:
            text = '\n'.join(f"<{m['role']}>: {m['content']}" for m in clean)
        if not text.strip():
            return {'input_ids': [], 'attention_mask': []}
        ids = tokenizer(text, truncation=True, max_length=512).input_ids
        if not ids:
            return {'input_ids': [], 'attention_mask': []}
        return {'input_ids': ids, 'attention_mask': [1] * len(ids)}
    
    data_list = [format_example(e) for e in examples]
    data_list = [d for d in data_list if d.get('input_ids')]
    print(f"  {len(data_list)} valid examples")
    
    dataset = Dataset.from_list(data_list)
    sigil_emit({'hop': 'SOV3_SMALL_V2_FORMATTED', 'n_valid': len(data_list)})
    
    # Training
    print(f"\n[5] Training (2 epochs, batch=2, grad_accum=2)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=2,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=2,
        learning_rate=2e-4,
        warmup_steps=20,
        logging_steps=25,
        save_strategy='epoch',
        save_total_limit=2,
        fp16=False,
        report_to='none',
        remove_unused_columns=False,
        dataloader_pin_memory=False,
        gradient_checkpointing=True,
    )
    
    trainer = Trainer(
        model=model, args=training_args,
        train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    start = time.time()
    try:
        result = trainer.train()
        train_loss = result.training_loss
    except KeyboardInterrupt:
        print("\n  ⚠ Interrupted")
        train_loss = None
    except Exception as e:
        print(f"\n  ⚠ Error: {e}")
        train_loss = None
    duration = time.time() - start
    
    print(f"\n[6] Saving final...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({
        'hop': 'SOV3_SMALL_V2_SAVE',
        'output': str(OUTPUT_DIR),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'train_loss': train_loss,
        'trainable': trainable,
    })
    
    readme = f"""# SOV3 SMALL v2 — World Model

SOV3 small v2 = the SMALL world model (rank=8, all 4 target modules, more modules than v1).

## Architecture
- Base: Qwen3-0.6B
- LoRA: rank=8, alpha=16, q/k/v/o_proj (ALL 4 target modules)
- Training: 2 epochs, batch=2, grad_accum=2, lr=2e-4
- Examples: {len(data_list)} (from sov33_merged_corpus.jsonl)

## Stats
- Duration: {duration:.0f}s ({duration/60:.1f} min)
- Final train loss: {train_loss}
- Trainable params: {trainable:,} ({trainable/total*100:.3f}%)
- Total params: {total:,}
- Adapter size: ~{trainable*4/1e6:.1f}MB (smaller than v2)

## vs SOV3 small v1
- v1: rank=16, target=[v_proj, q_proj], 9.2MB
- v2: rank=8, target=[q_proj, k_proj, v_proj, o_proj], more modules but smaller rank
- This gives a tighter "all-attention" world model

## Comparison with SOV33 large v2
- SOV33 large v2: rank=16, target=[q,k,v,o], 18.4MB, 2000 examples
- SOV3 small v2: rank=8, target=[q,k,v,o], tighter model
- Both are Qwen3-0.6B based
- v2 trains longer on same data

## Created: {datetime.now(timezone.utc).isoformat()}
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"\n  ✓ Saved to {OUTPUT_DIR}")
    print(f"  ✓ Duration: {duration:.0f}s ({duration/60:.1f} min)")
    print(f"  ✓ Train loss: {train_loss}")
    return OUTPUT_DIR


if __name__ == "__main__":
    out = train()
    print(f"\n{'='*70}")
    print(f"✓ SOV3 SMALL v2 saved to {out}")
    print(f"{'='*70}")
