"""
train_owem_specialist.py — Train individual OWEM specialist models.

Each OWEM (compliance, defense, intuition, voice) gets its own LoRA adapter
trained on domain-specific data. Then they're merged into the master SOV33.

Architecture:
  Base: Qwen3-0.6B (522MB)
  + Compliance LoRA (EU AI Act, Article 0, care-floor)
  + Defense LoRA (DORADO, kill-switch, intrusion)
  + Intuition LoRA (OOD, world model, emergence)
  + Voice LoRA (Charter voice, care style)
  = SOV33 MASTER (all 4 combined)
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

DATA_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')
OUTPUT_DIR = Path('/Users/nicholas/.sovereign/models')

OWEM_CONFIGS = {
    'compliance': {
        'data_files': ['compliance_1000_fixed.jsonl', 'compliance_200_fixed.jsonl', 'compliance_teacher_gen.jsonl'],
        'system_prompt': 'You are SOV33 compliance. Apply Article 0, 12 Pillars, care-floor 0.95.',
        'epochs': 3,
        'rank': 32,
    },
    'defense': {
        'data_files': ['defense_1000_fixed.jsonl', 'defense_200_fixed.jsonl'],
        'system_prompt': 'You are SOV33 defense. Apply DORADO hard-stops. Kill-switch protocol.',
        'epochs': 3,
        'rank': 32,
    },
    'intuition': {
        'data_files': ['intuition_200_fixed.jsonl'],
        'system_prompt': 'You are SOV33 intuition. Detect OOD. Predict emergence. Apply BFT-33 quorum logic.',
        'epochs': 3,
        'rank': 16,
    },
    'voice': {
        'data_files': ['voice_200_fixed.jsonl'],
        'system_prompt': 'You are SOV33 voice. Speak with Charter authority. Article 0 binding. Care-floor 0.95.',
        'epochs': 3,
        'rank': 16,
    },
}


def load_owem_data(owem_name):
    """Load all data files for an OWEM."""
    config = OWEM_CONFIGS[owem_name]
    examples = []
    
    for data_file in config['data_files']:
        filepath = DATA_DIR / data_file
        if filepath.exists():
            with open(filepath) as f:
                for line in f:
                    if line.strip():
                        try:
                            d = json.loads(line)
                            if 'messages' in d and len(d['messages']) > 0:
                                examples.append(d)
                        except: pass
    
    # Also add self-play data
    self_play_file = DATA_DIR / 'self_play_corpus.jsonl'
    if self_play_file.exists():
        with open(self_play_file) as f:
            for line in f:
                if line.strip():
                    try:
                        d = json.loads(line)
                        if d.get('owem') == owem_name and 'messages' in d:
                            examples.append(d)
                    except: pass
    
    return examples


def train_owem(owem_name):
    """Train a single OWEM specialist."""
    config = OWEM_CONFIGS[owem_name]
    
    print(f"\n{'='*60}")
    print(f"Training {owem_name} specialist")
    print(f"{'='*60}")
    
    # Load data
    examples = load_owem_data(owem_name)
    print(f"  Loaded {len(examples)} examples")
    
    if len(examples) < 10:
        print(f"  SKIP: not enough examples")
        return None
    
    # Load model
    print("  Loading Qwen3-0.6B...")
    tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    model = AutoModelForCausalLM.from_pretrained(
        'Qwen/Qwen3-0.6B',
        torch_dtype=torch.float32,
        device_map='cpu',
        trust_remote_code=True,
    )
    
    # Add LoRA
    lora_config = LoraConfig(
        r=config['rank'],
        lora_alpha=config['rank'] * 2,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj'],
        lora_dropout=0.05,
        bias='none',
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Format data
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
    
    # Train
    output_dir = OUTPUT_DIR / f'qwen3-sov-{owem_name}-0.6b'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(output_dir),
        num_train_epochs=config['epochs'],
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        warmup_steps=10,
        logging_steps=10,
        save_strategy='epoch',
        save_total_limit=2,
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
    try:
        result = trainer.train()
        train_loss = result.training_loss
    except Exception as e:
        print(f"  ERROR: {e}")
        return None
    
    duration = time.time() - start
    
    # Save
    model.save_pretrained(str(output_dir))
    tokenizer.save_pretrained(str(output_dir))
    
    print(f"  Done in {duration:.0f}s ({duration/60:.1f}min)")
    print(f"  Loss: {train_loss}")
    print(f"  Saved to {output_dir}")
    
    return {
        'owem': owem_name,
        'examples': len(data_list),
        'loss': train_loss,
        'duration_s': int(duration),
        'output_dir': str(output_dir),
    }


def train_all():
    """Train all 4 OWEM specialists."""
    print("="*60)
    print("OWEM SPECIALIST TRAINING")
    print("="*60)
    
    results = {}
    for owem_name in OWEM_CONFIGS:
        result = train_owem(owem_name)
        if result:
            results[owem_name] = result
    
    print(f"\n{'='*60}")
    print("TRAINING COMPLETE")
    print(f"{'='*60}")
    for owem, r in results.items():
        print(f"  {owem}: {r['examples']} examples, loss={r['loss']:.4f}, {r['duration_s']}s")
    
    return results


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Train OWEM specialists")
    p.add_argument("--owem", type=str, help="Train specific OWEM")
    p.add_argument("--all", action="store_true", help="Train all OWEMs")
    args = p.parse_args()
    
    if args.owem:
        train_owem(args.owem)
    elif args.all:
        train_all()
