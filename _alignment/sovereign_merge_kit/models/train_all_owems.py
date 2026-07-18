"""
train_all_owems.py — Re-train all 4 OWEMs with the consolidated corpus.

Uses the merged 6044-example corpus to retrain each OWEM specialist
with Q+A format that produces real sovereign answers.
"""

import os
import sys
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ProcessPoolExecutor

os.environ.pop('PYTHONPATH', None)
os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'

import torch
from transformers import (
    AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_owems_trained.sigil.jsonl')
BASE_MODEL = '/Users/nicholas/.sovereign/hf_cache/hub/models--Qwen--Qwen3-0.6B/snapshots/c1899de289a04d12100db370d81485cdf75e47ca'

# 4 OWEM brains with their target file
OWEM_TRAINING = [
    ('compliance', 'sov_owem_data/compliance_200_fixed.jsonl'),
    ('defense', 'sov_owem_data/defense_200_fixed.jsonl'),
    ('intuition', 'sov_owem_data/intuition_200_fixed.jsonl'),
    ('voice', 'sov_owem_data/voice_200_fixed.jsonl'),
]


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


def train_owem(owem_name, source_file, max_examples=200):
    """Train one OWEM brain."""
    print(f"\n{'='*60}")
    print(f"TRAINING OWEM: {owem_name}")
    print(f"{'='*60}")
    
    src_path = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit') / source_file
    if not src_path.exists():
        print(f"  Source missing: {src_path}")
        return None
    
    out_path = OUTPUT_DIR / f'qwen3-sov-{owem_name}-0.6b'
    out_path.mkdir(parents=True, exist_ok=True)
    
    sigil_emit({'hop': 'OWEM_TRAIN_START', 'owem': owem_name, 'source': source_file})
    
    # Load data
    print(f"[1] Loading data...")
    examples = []
    with open(src_path) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and len(d.get('messages', [])) > 0:
                        examples.append(d)
                        if len(examples) >= max_examples:
                            break
                except Exception:
                    pass
    print(f"  Loaded {len(examples)} examples")
    
    # Load tokenizer + model
    print(f"[2] Loading model...")
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
    
    # LoRA
    print(f"[3] Adding LoRA (rank=16)...")
    lora_config = LoraConfig(
        r=16, lora_alpha=32,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05, bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    
    # Format
    print(f"[4] Formatting...")
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
    
    # Train
    print(f"[5] Training (1 epoch, batch=2, save_steps=50)...")
    training_args = TrainingArguments(
        output_dir=str(out_path),
        num_train_epochs=1,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=2,
        learning_rate=2e-4,
        warmup_steps=10,
        logging_steps=10,
        save_strategy='epoch',
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
    except Exception as e:
        print(f"  ⚠ Error: {e}")
        train_loss = None
    duration = time.time() - start
    
    # Save
    print(f"[6] Saving...")
    model.save_pretrained(str(out_path))
    tokenizer.save_pretrained(str(out_path))
    
    sigil_emit({
        'hop': 'OWEM_TRAIN_DONE',
        'owem': owem_name,
        'output': str(out_path),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'train_loss': train_loss,
    })
    
    print(f"  ✓ Saved: loss={train_loss}, duration={duration:.0f}s")
    return out_path


def main():
    print("=" * 60)
    print("TRAIN ALL 4 OWEMs (parallel process pool)")
    print("=" * 60)
    
    # Sequential (parallel would oversubsribe the GPU)
    results = []
    for owem, src in OWEM_TRAINING:
        r = train_owem(owem, src)
        results.append((owem, r))
    
    print("\n" + "=" * 60)
    print("ALL OWEMs TRAINED")
    print("=" * 60)
    for owem, r in results:
        print(f"  {owem}: {r}")


if __name__ == "__main__":
    main()
