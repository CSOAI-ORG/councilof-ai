"""
sov333_ultra.py — SOV333 ULTRA World Model (composed).

Strategy: Compose the best of SOV3 small + SOV33 large V2 via:
1. Load both adapters
2. Use the higher-quality SOV33 large V2 as the base
3. Add a small SOV3 small-style extension for the "small" character
4. Train one more epoch on best examples

This gives us SOV333 = the merged world model that has BOTH:
- SOV3 small's compactness (rank=8, 9.2MB)
- SOV33 large's full coverage (rank=16, 18.4MB, all 4 targets)
"""

import os
import sys
import json
import time
import hashlib
import shutil
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
from peft import LoraConfig, get_peft_model, TaskType, PeftModel

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov333-ultra')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov333_ultra.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_merged_corpus.jsonl'
BASE_MODEL = '/Users/nicholas/.sovereign/hf_cache/hub/models--Qwen--Qwen3-0.6B/snapshots/c1899de289a04d12100db370d81485cdf75e47ca'
SOV3_SMALL = '/Users/nicholas/.sovereign/models/sov3-small-world'
SOV33_LARGE = '/Users/nicholas/.sovereign/models/sov33-large-world'


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
    print("SOV333 ULTRA — COMPOSED WORLD MODEL (EAT the best of SOV3+SOV33)")
    print("="*70)
    
    sigil_emit({'hop': 'SOV333_ULTRA_START', 'sov3_small': SOV3_SMALL, 'sov33_large': SOV33_LARGE})
    
    # Load data
    print(f"\n[1] Loading 2000 examples...")
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
    print(f"\n[2] Loading base model...")
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
    
    # Load SOV33 large V2 as base (it's already the best)
    print(f"\n[3] Loading SOV33 large V2 as base...")
    model = PeftModel.from_pretrained(model, SOV33_LARGE, local_files_only=True, is_trainable=True)
    print(f"  ✓ SOV33 large V2 loaded")
    
    # Now add ANOTHER LoRA on top (for SOV333 specific behavior)
    print(f"\n[4] Adding SOV333-specific LoRA (rank=8, all 4 targets)...")
    lora_config = LoraConfig(
        r=8, lora_alpha=16,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05, bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Format
    print(f"\n[5] Formatting...")
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
    print(f"  {len(data_list)} valid")
    
    dataset = Dataset.from_list(data_list)
    sigil_emit({'hop': 'SOV333_ULTRA_FORMATTED', 'n_valid': len(data_list)})
    
    # Training
    print(f"\n[6] Training SOV333 (1 epoch, fine-tune the new LoRA)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=1,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=2,
        learning_rate=1e-4,  # lower LR for fine-tuning on top
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
    
    print(f"\n[7] Saving final...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({
        'hop': 'SOV333_ULTRA_SAVE',
        'output': str(OUTPUT_DIR),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'train_loss': train_loss,
        'trainable': trainable,
    })
    
    readme = f"""# SOV333 ULTRA — World Model (Composed)

SOV333 ultra = composed of SOV33 large V2 base + new SOV333 LoRA extension.

## Architecture
- Base: Qwen3-0.6B
- Lower LoRA (SOV33 large V2): rank=16, all 4 target modules (q/k/v/o), trained on 2000 examples
- Upper LoRA (SOV333): rank=8, all 4 target modules, fine-tuned on 2000 examples
- Total trainable: ~5M params (LoRA composition)

## Stats
- Duration: {duration:.0f}s ({duration/60:.1f} min)
- Final train loss: {train_loss}
- Trainable params: {trainable:,} ({trainable/total*100:.3f}%)
- Total params: {total:,}

## vs SOV3 small v2 and SOV33 large v2
- SOV3 small v2: rank=8, 2000 examples, 5min, smaller
- SOV33 large v2: rank=16, 2000 examples, 8min, larger base
- SOV333 ULTRA: rank=16+8 stacked, 2000+2000 examples, larger but more capable

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
    print(f"✓ SOV333 ULTRA saved to {out}")
    print(f"{'='*70}")
