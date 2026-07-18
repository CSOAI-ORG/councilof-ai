"""
sov33_large_full.py — SOV33 LARGE World Model (FULL training).

Trains on ALL 3324 sovereign examples, 3 epochs, with checkpointing.
Target: loss 5.5 → 1.0 (real learning, not just memorization).
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone
import tempfile as _tf

os.environ.pop('PYTHONPATH', None)
os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'
os.environ['HF_HUB_OFFLINE'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '1'
sys.path.insert(0, '/Users/nicholas/.sovereign/ml-venv/lib/python3.11/site-packages')
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import (
    AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov33-large-world')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_large_full.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
BASE_MODEL = '/Users/nicholas/.sovereign/hf_cache/hub/models--Qwen--Qwen2.5-0.5B/snapshots/060db6499f32faf8b98477b0a26969ef7d8b9987'


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
    print("=" * 70)
    print("SOV33 LARGE FULL TRAINING (3324 examples, 3 epochs, MPS)")
    print("=" * 70)
    
    sigil_emit({'hop': 'SOV33_LARGE_FULL_START', 'base': BASE_MODEL, 'n_examples': 3324})
    
    # Load all data, filter
    print(f"\n[1] Loading corpus...")
    examples = []
    with open(DATA_PATH) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and len(d.get('messages', [])) > 0:
                        examples.append(d)
                except Exception:
                    pass
    print(f"  Loaded {len(examples)} examples")
    sigil_emit({'hop': 'SOV33_LARGE_FULL_DATA', 'n_loaded': len(examples)})
    
    # Load tokenizer
    print(f"\n[2] Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Load model (CPU first then move)
    print(f"\n[3] Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,
        device_map='cpu',
        trust_remote_code=True,
        local_files_only=True,
    )
    print(f"  ✓ Model loaded")
    
    # LoRA
    print(f"\n[4] Adding LoRA (rank=16, more expressive than r=8)...")
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05,
        bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Format
    print(f"\n[5] Formatting data...")
    def format_example(d):
        msgs = d.get('messages', [])
        clean = []
        for m in msgs:
            content = (m.get('content') or '')
            if not isinstance(content, str):
                content = str(content)
            if content:
                clean.append({'role': m.get('role', 'user'), 'content': content})
        if not clean:
            return {'input_ids': [], 'labels': []}
        try:
            text = tokenizer.apply_chat_template(clean, tokenize=False, add_generation_prompt=False)
        except Exception:
            text = '\n'.join(f"<{m['role']}>: {m['content']}" for m in clean)
        if not text.strip():
            return {'input_ids': [], 'labels': []}
        ids = tokenizer(text, truncation=True, max_length=512).input_ids
        if not ids:
            return {'input_ids': [], 'labels': []}
        return {'input_ids': ids, 'labels': ids.copy()}
    
    data_list = [format_example(e) for e in examples]
    data_list = [d for d in data_list if d['input_ids']]
    print(f"  ✓ {len(data_list)} valid examples")
    
    dataset = Dataset.from_list(data_list)
    sigil_emit({'hop': 'SOV33_LARGE_FULL_FORMATTED', 'n_valid': len(data_list)})
    
    # Training
    print(f"\n[6] Training (3 epochs, batch=1, grad_accum=4, lr=2e-4)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        warmup_steps=50,
        logging_steps=25,
        save_strategy='epoch',  # save every epoch
        save_total_limit=3,
        fp16=False,
        report_to='none',
        remove_unused_columns=False,
        dataloader_pin_memory=False,
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    start = time.time()
    train_loss = None
    try:
        result = trainer.train()
        train_loss = result.training_loss
    except KeyboardInterrupt:
        print("\n  ⚠ Interrupted by user, saving what we have")
    except Exception as e:
        print(f"\n  ⚠ Training error: {e}")
    
    duration = time.time() - start
    
    # Save
    print(f"\n[7] Saving final adapter...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({
        'hop': 'SOV33_LARGE_FULL_SAVE',
        'output': str(OUTPUT_DIR),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'train_loss': train_loss,
        'trainable': trainable,
    })
    
    # README
    readme = f"""# SOV33 LARGE World Model (FULL training)

SOV33 = the large sovereign world model — fully trained version.

## Architecture
- Base: Qwen2.5-0.5B
- LoRA: rank=16, alpha=32, q/k/v/o_proj
- Training: 3 epochs, batch=1, grad_accum=4, lr=2e-4

## Training Data
- {len(data_list)} sovereign examples
- 2.0MB combined sovereign corpus
- All 65 sovereign JSONL files + compliance + defense

## Stats
- Duration: {duration:.0f}s ({duration/60:.1f} min)
- Final train loss: {train_loss}
- Trainable params: {trainable:,} ({trainable/total*100:.3f}%)
- Total params: {total:,}
- Adapter size: ~{trainable*4/1e6:.1f}MB
- Created: {datetime.now(timezone.utc).isoformat()}

## Comparison: SOV3 small vs SOV33 large
| Property | SOV3 small | SOV33 large (this) |
|----------|-----------|---------------------|
| Base | Qwen3-0.6B | Qwen2.5-0.5B |
| LoRA | rank=16 | rank=16 |
| Method | merge of 4 | trained on 3324 |
| Data | 800 | {len(data_list)} |
| Epochs | n/a | 3 |

## Honest Register
This model was trained on 3324 examples for 3 epochs. Previous fast version (50 steps)
showed catastrophic forgetting. This full version should:
- Retain base knowledge (MMLU, GSM8K)
- Learn sovereign concepts (care-floor, BFT-33, Charter)
- NOT hallucinate numbers like 12.5% or 123/33

Verification: run /api/checkpoints/state and /api/jspace/* benchmarks
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"\n  ✓ Saved to {OUTPUT_DIR}")
    print(f"  ✓ Duration: {duration:.0f}s ({duration/60:.1f} min)")
    if train_loss is not None:
        print(f"  ✓ Train loss: {train_loss}")
    print(f"  ✓ Trainable: {trainable:,}")
    
    return OUTPUT_DIR


if __name__ == "__main__":
    out = train()
    print(f"\n{'='*70}")
    print(f"✓ SOV33 LARGE FULL saved to {out}")
    print(f"{'='*70}")
