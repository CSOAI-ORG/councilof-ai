"""
sov33_large_full_v3.py — SOV33 LARGE with CORRECT data (6044 examples, messages format).
"""

import os, sys, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone

os.environ.pop('PYTHONPATH', None)
os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'
sys.path.insert(0, '/Users/nicholas/.sovereign/ml-venv/lib/python3.11/site-packages')

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov33-large-world')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_large_v3.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_merged_corpus.jsonl'

def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try: chain.append(json.loads(line))
                except: pass
    prev = chain[-1]['digest'] if chain else '0'*16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f: f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest

def train():
    print("="*70)
    print("SOV33 LARGE V3 — 6044 CORRECT examples")
    print("="*70)
    sigil_emit({'hop': 'SOV33_LARGE_V3_START', 'data': DATA_PATH})
    
    print("\n[1] Loading merged corpus...")
    examples = []
    with open(DATA_PATH) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and len(d.get('messages', [])) > 0:
                        examples.append(d)
                except: pass
    print(f"  {len(examples)} examples loaded")
    
    print("\n[2] Loading Qwen2.5-0.5B...")
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen2.5-0.5B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen2.5-0.5B', torch_dtype=torch.float32, device_map='cpu', trust_remote_code=True)
    print("  Model loaded")
    
    print("\n[3] Adding LoRA (rank=32, more expressive)...")
    lora_config = LoraConfig(r=32, lora_alpha=64,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
        lora_dropout=0.05, bias='none', task_type=TaskType.CAUSAL_LM)
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    print("\n[4] Formatting data...")
    def format_example(d):
        msgs = d.get('messages', [])
        clean = [{'role': m.get('role','user'), 'content': (m.get('content') or '')} for m in msgs if m.get('content')]
        if not clean: return {'input_ids': [], 'labels': []}
        try: text = tokenizer.apply_chat_template(clean, tokenize=False, add_generation_prompt=False)
        except: text = '\n'.join(f"<{m['role']}>: {m['content']}" for m in clean)
        if not text.strip(): return {'input_ids': [], 'labels': []}
        ids = tokenizer(text, truncation=True, max_length=512).input_ids
        return {'input_ids': ids, 'labels': ids.copy()} if ids else {'input_ids': [], 'labels': []}
    
    data_list = [d for d in (format_example(e) for e in examples) if d['input_ids']]
    print(f"  {len(data_list)} valid examples")
    dataset = Dataset.from_list(data_list)
    
    print("\n[5] Training (3 epochs, rank=32, 7 target modules)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR), num_train_epochs=3,
        per_device_train_batch_size=1, gradient_accumulation_steps=4,
        learning_rate=2e-4, warmup_steps=100, logging_steps=50,
        save_strategy='epoch', save_total_limit=3, fp16=False,
        report_to='none', remove_unused_columns=False, dataloader_pin_memory=False,
    )
    trainer = Trainer(model=model, args=training_args, train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False))
    
    start = time.time()
    try:
        result = trainer.train()
        train_loss = result.training_loss
    except KeyboardInterrupt: print("\n  Interrupted"); train_loss = None
    except Exception as e: print(f"\n  Error: {e}"); train_loss = None
    duration = time.time() - start
    
    print("\n[6] Saving...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    sigil_emit({'hop': 'SOV33_LARGE_V3_SAVE', 'duration_s': int(duration), 'train_loss': train_loss, 'trainable': trainable, 'n_examples': len(data_list)})
    print(f"  Done in {duration:.0f}s ({duration/60:.1f}min)")
    print(f"  Loss: {train_loss}")
    print(f"  Trainable: {trainable:,}")

if __name__ == "__main__":
    train()
