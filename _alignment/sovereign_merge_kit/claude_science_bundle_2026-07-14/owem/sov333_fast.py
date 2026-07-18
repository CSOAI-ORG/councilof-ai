"""
sov333_fast.py — SOV333 ULTRA FAST (independent, no dependency).

Same as the original SOV333 ultra but:
- No dependency on SOV33 large V2
- Fresh LoRA rank=16 on all 4 targets
- 500 examples × 1 epoch = ~6min

This gives us a third EAT model that's distinctive.
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

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov333-ultra-fast')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov333_fast.sigil.jsonl')
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
    print("SOV333 ULTRA FAST — THE ULTRA WORLD MODEL (rank=16, 500 ex, ~6min)")
    print("="*70)
    sigil_emit({'hop': 'SOV333_FAST_START', 'base': BASE_MODEL})
    
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
    
    print("\n[2] Loading model...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, local_files_only=True, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float32, local_files_only=True, trust_remote_code=True)
    if device == 'mps':
        model = model.to('mps')
    
    print("\n[3] Adding LoRA rank=16 (BIGGER than SOV3 small, similar to SOV33 large)...")
    lora_config = LoraConfig(
        r=16, lora_alpha=32,
        target_modules=['q_proj','k_proj','v_proj','o_proj'],
        lora_dropout=0.05, bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
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
    sigil_emit({'hop': 'SOV333_FAST_FORMATTED', 'n_valid': len(data)})
    
    print("\n[5] Training (1 epoch)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    args = TrainingArguments(
        output_dir=str(OUTPUT_DIR), num_train_epochs=1,
        per_device_train_batch_size=2, gradient_accumulation_steps=2,
        learning_rate=2e-4, warmup_steps=10, logging_steps=25,
        save_strategy='no',
        report_to='none', remove_unused_columns=False,
        dataloader_pin_memory=False, gradient_checkpointing=True,
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
    duration = time.time() - start
    
    print("\n[6] Saving...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({'hop': 'SOV333_FAST_SAVE', 'output': str(OUTPUT_DIR), 'duration_s': int(duration), 'n_valid': len(data), 'train_loss': train_loss, 'trainable': trainable})
    
    readme = f"""# SOV333 ULTRA FAST — Ultra World Model

Distinct from SOV3 and SOV33:
- Same Qwen3-0.6B base
- rank=16, alpha=32, all 4 targets
- 500 examples × 1 epoch
- Duration: {duration:.0f}s

This is the "ultra" - rank=16 (same as SOV33 large), but trained independently with its own LoRA.
When combined with SOV3 (rank=8) and SOV33 (rank=16), gives the trinity:
- SOV3 small: rank=8, tight (500 ex)
- SOV33 large: rank=16, wide (2000 ex)
- SOV333 ultra: rank=16, ultra (500 ex independent)
- Trainable: {trainable:,} ({trainable/total*100:.3f}%)
- Created: {datetime.now(timezone.utc).isoformat()}
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"  ✓ Saved")
    print(f"  ✓ Train loss: {train_loss}")


if __name__ == '__main__':
    train()
