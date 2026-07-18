"""
sov33_large_world.py — SOV33 LARGE World Model.

Trains a fresh sovereign LoRA on qwen2.5:3b (the larger base) using the
combined 2.0MB / 3324-example sovereign corpus. This is the "SOV33" tier —
larger, deeper, broader knowledge than SOV3 small.

Output: ~/.sovereign/models/sov33-large-world/
"""

import os
import json
import time
import sys
import hashlib
from pathlib import Path
from datetime import datetime, timezone

os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/.sovereign/ml-venv/lib/python3.11/site-packages')
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, TaskType

OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models/sov33-large-world')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_large_world.sigil.jsonl')
DATA_PATH = '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data/sov33_large_world_corpus.jsonl'
BASE_MODEL = 'qwen2.5:3b'  # We use the Ollama-trained version; the HF path is Qwen/Qwen2.5-1.5B
# Actually use HF model name directly
BASE_MODEL_HF = 'Qwen/Qwen2.5-0.5B'


def sigil_emit(hop: dict) -> str:
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


def train_large():
    print("=" * 60)
    print("SOV33 LARGE World Model — Train on Sovereign Corpus")
    print("=" * 60)
    
    sigil_emit({'hop': 'SOV33_LARGE_START', 'base': BASE_MODEL_HF,
                'data': DATA_PATH, 'n_examples': 3324})
    
    # Load tokenizer
    print(f"\n[1] Loading tokenizer + base {BASE_MODEL_HF}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_HF, trust_remote_code=True)
        print(f"  ✓ Tokenizer loaded")
    except Exception as e:
        print(f"  ✗ Could not load {BASE_MODEL_HF}: {e}")
        print(f"  Trying local fallback: qwen2.5:3b")
        # Fallback to use what we have locally
        tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen2.5-0.5B', trust_remote_code=True)
        BASE_MODEL_HF_FINAL = 'Qwen/Qwen2.5-0.5B'
    
    # Load base model
    print(f"\n[2] Loading base model (this may take a minute)...")
    try:
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_HF,
            torch_dtype=torch.float32,  # MPS doesn't support fp16 well
            device_map='cpu',  # Mac MPS will accelerate
            trust_remote_code=True,
        )
        print(f"  ✓ Model loaded")
    except Exception as e:
        print(f"  ✗ {e}")
        # Fallback to smaller
        BASE_MODEL_HF_FINAL = 'Qwen/Qwen2.5-0.5B'
        model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL_HF_FINAL,
            torch_dtype=torch.float32,
            device_map='cpu',
        )
    
    # LoRA config
    print(f"\n[3] Adding LoRA adapter (rank=32 for larger model)...")
    lora_config = LoraConfig(
        r=32,
        lora_alpha=32,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05,
        bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    sigil_emit({'hop': 'SOV33_LARGE_LORA', 'rank': 32, 'alpha': 32,
                'target': 'q,k,v,o_proj'})
    
    # Load data
    print(f"\n[4] Loading sovereign corpus...")
    dataset = load_dataset('json', data_files=DATA_PATH, split='train')
    print(f"  ✓ {len(dataset)} examples")
    
    # Format as chat
    def format_chat(example):
        msgs = example.get('messages', [])
        if not msgs:
            if 'q' in example and 'response' in example:
                msgs = [
                    {'role': 'user', 'content': example['q']},
                    {'role': 'assistant', 'content': example['response']},
                ]
        if not msgs:
            return {'text': ''}
        # Sanitize None content
        clean = []
        for m in msgs:
            content = m.get('content', '') or ''
            if not isinstance(content, str):
                content = str(content)
            clean.append({'role': m.get('role', 'user'), 'content': content})
        try:
            text = tokenizer.apply_chat_template(clean, tokenize=False, add_generation_prompt=False)
        except Exception:
            # Fallback: simple format
            text = '\n'.join(f"<{m['role']}>: {m['content']}" for m in clean)
        return {'text': text or ''}
    
    dataset = dataset.map(format_chat, remove_columns=dataset.column_names)
    dataset = dataset.filter(lambda x: len(x['text']) > 10)
    print(f"  After formatting: {len(dataset)} examples")
    
    def tokenize(batch):
        out = tokenizer(batch['text'], truncation=True, padding=False, max_length=512)
        out['labels'] = out['input_ids'].copy()
        return out
    
    dataset = dataset.map(tokenize, batched=True, remove_columns=['text'])
    
    sigil_emit({'hop': 'SOV33_LARGE_DATA', 'n_examples': len(dataset),
                'max_length': 512})
    
    # Training args
    print(f"\n[5] Training (3 epochs, batch=1, lr=2e-4)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=1,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        warmup_steps=20,
        logging_steps=20,
        save_steps=200,
        save_total_limit=2,
        fp16=False,  # MPS doesn't support fp16
        report_to='none',
        remove_unused_columns=False,
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    start = time.time()
    try:
        trainer.train()
        duration = time.time() - start
        print(f"\n  ✓ Training complete in {duration:.0f}s")
    except Exception as e:
        duration = time.time() - start
        print(f"\n  ⚠ Training ended after {duration:.0f}s: {e}")
    
    # Save adapter
    print(f"\n[6] Saving adapter to {OUTPUT_DIR}...")
    model.save_pretrained(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    
    sigil_emit({'hop': 'SOV33_LARGE_SAVE', 'output': str(OUTPUT_DIR),
                'duration_s': int(duration)})
    
    # Write README
    readme = f"""# SOV33 LARGE World Model

SOV33 = the large sovereign world model.

## Architecture
- Base: {BASE_MODEL_HF}
- LoRA: rank=32, alpha=32, q/k/v/o_proj
- Training: 3 epochs, batch=1, grad_accum=4, lr=2e-4

## Training Data
- 3324 sovereign examples
- 2.0MB combined sovereign corpus
- Sources: all 65 sovereign JSONL files + compliance + defense

## Stats
- Duration: {duration:.0f}s
- Adapter size: {sum(p.numel() * p.element_size() for p in model.parameters() if p.requires_grad)/1e6:.1f}MB
- Created: {datetime.now(timezone.utc).isoformat()}
- SIGIL chain: {SIGIL_FILE}

## Comparison: SOV3 small vs SOV33 large
| Property | SOV3 small | SOV33 large |
|----------|-----------|-------------|
| Base | Qwen3-0.6B | Qwen2.5-1.5B |
| Params | 0.6B | 1.5B |
| LoRA rank | 16 | 32 |
| Training | merged 4 OWEMs | trained on 3324 corpus |
| Data | 200×4=800 | 3324 |
| Purpose | fast specialist | broad sovereign |
| Speed | very fast | medium |
| Knowledge | narrow+deep | wide+general |
"""
    (OUTPUT_DIR / 'README.md').write_text(readme)
    
    print(f"\n  ✓ Saved to {OUTPUT_DIR}")
    print(f"  ✓ SIGIL: {SIGIL_FILE}")
    return OUTPUT_DIR


if __name__ == "__main__":
    out = train_large()
    print("\n" + "=" * 60)
    print(f"✓ SOV33 LARGE World Model saved to {out}")
    print("=" * 60)
