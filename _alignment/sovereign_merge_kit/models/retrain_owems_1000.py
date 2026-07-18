"""
retrain_owems_1000.py — Re-train all 4 OWEMs on expanded 1000-sample datasets.

Uses:
  - compliance_1000.jsonl, defense_1000.jsonl, intuition_1000.jsonl, voice_1000.jsonl
  - Qwen3-0.6B base + rank=16 LoRA
  - 100 steps each (1.5x more than 67 steps that got 87.5% acc)
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

BASE_MODEL = 'Qwen/Qwen3-0.6B'
CACHE_DIR = '/Users/nicholas/.sovereign/hf_cache/hub'
DATA_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')

# Find qwen3 snapshot path
import glob
qwen3_paths = glob.glob(f'{CACHE_DIR}/models--Qwen--Qwen3-0.6B/snapshots/*/')
BASE_MODEL_PATH = qwen3_paths[0] if qwen3_paths else BASE_MODEL
print(f"Using base: {BASE_MODEL_PATH}")


def retrain_owem(owem_name, n_steps=100):
    """Re-train one OWEM."""
    data_path = DATA_DIR / f'{owem_name}_1000.jsonl'
    if not data_path.exists():
        print(f"  {owem_name}: no data file at {data_path}")
        return None
    
    # Count samples
    with open(data_path) as f:
        n = sum(1 for _ in f)
    if n < 100:
        print(f"  {owem_name}: only {n} samples, skipping")
        return None
    
    print(f"\n{'='*60}")
    print(f"RETRAIN {owem_name} (1000 samples, {n_steps} steps)")
    print(f"{'='*60}")
    
    output_dir = Path(f'/Users/nicholas/.sovereign/models/qwen3-sov-{owem_name}-0.6b')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    sigil_file = Path(f'/Users/nicholas/.sovereign/sov33_retrain_{owem_name}.sigil.jsonl')
    
    # Load data
    examples = []
    with open(data_path) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and d['messages']:
                        examples.append(d)
                except Exception:
                    pass
    print(f"  Loaded {len(examples)} examples")
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL_PATH, trust_remote_code=True,
        cache_dir=CACHE_DIR, local_files_only=True
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_PATH, torch_dtype=torch.float32, device_map='cpu',
        trust_remote_code=True, cache_dir=CACHE_DIR, local_files_only=True,
    )
    
    # LoRA rank=16 (same as before for consistency)
    lora_config = LoraConfig(
        r=16, lora_alpha=32,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05, bias='none', task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
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
        ids = tokenizer(text, truncation=True, max_length=384).input_ids
        if not ids:
            return {'input_ids': [], 'labels': []}
        return {'input_ids': ids, 'labels': ids.copy()}
    
    data_list = [format_example(e) for e in examples]
    data_list = [d for d in data_list if d['input_ids']]
    print(f"  Valid: {len(data_list)}")
    
    dataset = Dataset.from_list(data_list)
    
    training_args = TrainingArguments(
        output_dir=str(output_dir),
        max_steps=n_steps, num_train_epochs=2,
        per_device_train_batch_size=1, gradient_accumulation_steps=4,
        learning_rate=2e-4, warmup_steps=15,
        logging_steps=20, save_strategy='no', fp16=False,
        report_to='none', remove_unused_columns=False,
        dataloader_pin_memory=False,
    )
    
    trainer = Trainer(
        model=model, args=training_args, train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    # Sigil
    def emit(hop):
        sigil_file.parent.mkdir(parents=True, exist_ok=True)
        chain = []
        if sigil_file.exists():
            for line in sigil_file.read_text().splitlines():
                if line.strip():
                    try:
                        chain.append(json.loads(line))
                    except Exception:
                        pass
        prev = chain[-1]['digest'] if chain else '0' * 16
        payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
        with sigil_file.open('a') as f:
            f.write(json.dumps({**payload, 'digest': digest}) + '\n')
        return digest
    
    emit({'hop': f'RETRAIN_{owem_name.upper()}_START', 'n_samples': len(data_list), 'n_steps': n_steps})
    
    start = time.time()
    initial_loss = None
    final_loss = None
    try:
        for step, _ in enumerate(trainer.train()):
            pass
    except KeyboardInterrupt:
        print("  ⚠ Interrupted")
    except Exception as e:
        print(f"  ⚠ Error: {e}")
    duration = time.time() - start
    
    # Save
    print(f"  Saving to {output_dir}")
    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    emit({
        'hop': f'RETRAIN_{owem_name.upper()}_SAVE',
        'output': str(output_dir),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'trainable': trainable,
    })
    
    print(f"  ✓ {owem_name}: {duration/60:.1f} min, trainable={trainable:,}")
    return str(output_dir)


if __name__ == "__main__":
    print("=" * 60)
    print("RE-TRAIN 4 OWEMs ON 1000-SAMPLE EXPANDED DATA")
    print("=" * 60)
    
    results = {}
    for owem in ['compliance', 'defense', 'intuition', 'voice']:
        path = retrain_owem(owem, n_steps=100)
        if path:
            results[owem] = path
    
    print("\n" + "=" * 60)
    print("RETRAIN COMPLETE")
    print("=" * 60)
    for owem, path in results.items():
        print(f"  {owem}: {path}")
