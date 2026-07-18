"""
sov33_large_250step.py — SOV33 LARGE 250-step training.

Between the 100-step fast and the 3-epoch full version.
Target: ~25-30 minutes on Mac.
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
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_large_250step.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
QWEN_PATHS = __import__('glob').glob(f'{CACHE_DIR}/models--Qwen--Qwen2.5-0.5B/snapshots/*/')
BASE_MODEL = QWEN_PATHS[0] if QWEN_PATHS else 'Qwen/Qwen2.5-0.5B'
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
    print("SOV33 LARGE 250-STEP TRAINING (Mac, ~30 min)")
    print("=" * 70)
    
    sigil_emit({'hop': 'SOV33_LARGE_250_START', 'max_steps': 250})
    
    examples = []
    with open(DATA_PATH) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and d['messages']:
                        examples.append(d)
                except Exception:
                    pass
    print(f"  Loaded {len(examples)} examples")
    
    tokenizer = AutoTokenizer.from_pretrained(
        BASE_MODEL, trust_remote_code=True,
        cache_dir=CACHE_DIR, local_files_only=True
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, torch_dtype=torch.float32, device_map='cpu',
        trust_remote_code=True, cache_dir=CACHE_DIR, local_files_only=True,
    )
    
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
        ids = tokenizer(text, truncation=True, max_length=512).input_ids
        if not ids:
            return {'input_ids': [], 'labels': []}
        return {'input_ids': ids, 'labels': ids.copy()}
    
    data_list = [format_example(e) for e in examples]
    data_list = [d for d in data_list if d['input_ids']]
    print(f"  Valid: {len(data_list)}")
    
    dataset = Dataset.from_list(data_list)
    
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        max_steps=250, num_train_epochs=1,
        per_device_train_batch_size=1, gradient_accumulation_steps=4,
        learning_rate=2e-4, warmup_steps=20,
        logging_steps=25, save_strategy='no', fp16=False,
        report_to='none', remove_unused_columns=False,
        dataloader_pin_memory=False,
    )
    
    trainer = Trainer(
        model=model, args=training_args, train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    start = time.time()
    try:
        for step, _ in enumerate(trainer.train()):
            pass
    except KeyboardInterrupt:
        print("  ⚠ Interrupted")
    except Exception as e:
        print(f"  ⚠ Error: {e}")
    duration = time.time() - start
    
    print(f"\n  Saving...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    
    sigil_emit({
        'hop': 'SOV33_LARGE_250_SAVE',
        'output': str(OUTPUT_DIR),
        'duration_s': int(duration),
        'n_valid': len(data_list),
        'trainable': trainable,
    })
    
    readme = f"""# SOV33 LARGE 250-STEP TRAINING

Duration: {duration:.0f}s ({duration/60:.1f} min)
Trainable: {trainable:,} ({trainable/total*100:.3f}%)
Total: {total:,}
Created: {datetime.now(timezone.utc).isoformat()}

Between the 100-step fast and the 3-epoch full versions.
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"  ✓ Saved. Duration: {duration/60:.1f} min. Trainable: {trainable:,}")
    return OUTPUT_DIR


if __name__ == "__main__":
    out = train()
    print(f"\n✓ SOV33 LARGE 250-step saved to {out}")
