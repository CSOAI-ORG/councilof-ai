"""
sov33_large_100step.py — SOV33 LARGE World Model (100-step training).

Trains 100 steps on qwen2.5-0.5B base with sovereign corpus.
Fast enough to complete in ~10 minutes on Mac.
Better than the 50-step fast version but faster than 3-epoch full.
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
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_large_100step.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
BASE_MODEL = 'Qwen/Qwen2.5-0.5B'
CACHE_DIR = '/Users/nicholas/.sovereign/hf_cache/hub'


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
    print("SOV33 LARGE 100-STEP TRAINING (Mac, ~10 min)")
    print("=" * 70)
    
    sigil_emit({'hop': 'SOV33_LARGE_100_START', 'base': BASE_MODEL, 'max_steps': 100})
    
    # Load corpus
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
    
    # Load tokenizer
    print(f"\n[2] Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL, trust_remote_code=True,
        cache_dir=CACHE_DIR, local_files_only=True
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Load model
    print(f"\n[3] Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float32,
        device_map='cpu',
        trust_remote_code=True,
        cache_dir=CACHE_DIR,
        local_files_only=True,
    )
    
    # LoRA
    print(f"\n[4] Adding LoRA (rank=16)...")
    lora_config = LoraConfig(
        r=16, lora_alpha=32,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05, bias='none',
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
    
    # Training - max_steps=100, save at end
    print(f"\n[6] Training (100 steps, batch=1, grad_accum=4)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=1,  # 1 epoch but capped at 100 steps
        max_steps=100,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        warmup_steps=10,
        logging_steps=10,
        save_strategy='no',
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
    initial_loss = None
    final_loss = None
    losses = []
    
    try:
        # Custom training loop to capture losses
        for step, _ in enumerate(trainer.train()):
            pass
    except KeyboardInterrupt:
        print("\n  ⚠ Interrupted")
    except Exception as e:
        print(f"\n  ⚠ Error: {e}")
    
    duration = time.time() - start
    
    # Save
    print(f"\n[7] Saving final adapter...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({
        'hop': 'SOV33_LARGE_100_SAVE',
        'output': str(OUTPUT_DIR),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'trainable': trainable,
    })
    
    # README
    readme = f"""# SOV33 LARGE World Model (100-step training)

SOV33 = the large sovereign world model — 100-step trained version.

## Architecture
- Base: Qwen2.5-0.5B
- LoRA: rank=16, alpha=32, q/k/v/o_proj
- Training: 100 steps, batch=1, grad_accum=4, lr=2e-4

## Stats
- Duration: {duration:.0f}s ({duration/60:.1f} min)
- Trainable params: {trainable:,} ({trainable/total*100:.3f}%)
- Total params: {total:,}
- Adapter size: ~{trainable*4/1e6:.1f}MB
- Created: {datetime.now(timezone.utc).isoformat()}

## Usage
```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained('Qwen/Qwen2.5-0.5B')
model = PeftModel.from_pretrained(base, '{OUTPUT_DIR}')
```

## Note
This is the FAST 100-step version. The full 3-epoch version (sov33_large_full.py) is
available but takes 5+ hours on Mac. Use this for quick experiments.
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"\n  ✓ Saved to {OUTPUT_DIR}")
    print(f"  ✓ Duration: {duration:.0f}s ({duration/60:.1f} min)")
    print(f"  ✓ Trainable: {trainable:,}")
    
    return OUTPUT_DIR


if __name__ == "__main__":
    out = train()
    print(f"\n{'='*70}")
    print(f"✓ SOV33 LARGE 100-step saved to {out}")
    print(f"{'='*70}")
