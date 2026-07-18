"""
SOV33 Kaggle T4 Ultimate — All-in-one training notebook.

Upload this + the merged corpus to Kaggle. Run with T4 GPU.
Trains ALL 4 OWEMs + SOV33 large in one session.

GPU: T4 (16GB VRAM) | RAM: 13GB | Disk: 20GB
"""

# Cell 1: Install
# !pip install transformers datasets peft accelerate torch

# Cell 2: Upload data files:
# - sov33_merged_corpus.jsonl (6044 examples)
# - compliance_1000_fixed.jsonl, defense_1000_fixed.jsonl
# - intuition_200_fixed.jsonl, voice_200_fixed.jsonl
# - self_play_corpus.jsonl

import torch, json, os
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Device: {DEVICE}, VRAM: {torch.cuda.get_device_properties(0).total_mem/1e9:.1f}GB" if DEVICE=='cuda' else f"Device: {DEVICE}")

# Cell 3: Load base model
print("Loading Qwen3-0.6B...")
tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Cell 4: Training function
def train_owem(owem_name, data_file, epochs=3, rank=32, batch_size=4):
    print(f"\n{'='*60}")
    print(f"Training {owem_name}...")
    print(f"{'='*60}")
    
    # Load data
    examples = []
    with open(data_file) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and len(d['messages']) > 0:
                        examples.append(d)
                except: pass
    
    print(f"  {len(examples)} examples")
    
    # Format
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
    print(f"  {len(data_list)} valid")
    dataset = Dataset.from_list(data_list)
    
    # Fresh model
    model = AutoModelForCausalLM.from_pretrained('Qwen/Qwen3-0.6B', torch_dtype=torch.float16, device_map='auto', trust_remote_code=True)
    lora_config = LoraConfig(r=rank, lora_alpha=rank*2,
        target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
        lora_dropout=0.05, bias='none', task_type=TaskType.CAUSAL_LM)
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    # Train
    output_dir = f'/kaggle/working/sov33-{owem_name}'
    training_args = TrainingArguments(
        output_dir=output_dir, num_train_epochs=epochs,
        per_device_train_batch_size=batch_size, gradient_accumulation_steps=2,
        learning_rate=2e-4, warmup_steps=20, logging_steps=10,
        save_strategy='epoch', fp16=True, report_to='none',
        remove_unused_columns=False,
    )
    
    trainer = Trainer(model=model, args=training_args, train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False))
    
    result = trainer.train()
    print(f"  Loss: {result.training_loss:.4f}")
    
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"  Saved to {output_dir}")
    return result.training_loss

# Cell 5: Train all 4 OWEMs
OWEMS = {
    'compliance': '/kaggle/input/sov33-data/compliance_1000_fixed.jsonl',
    'defense': '/kaggle/input/sov33-data/defense_1000_fixed.jsonl',
    'intuition': '/kaggle/input/sov33-data/intuition_200_fixed.jsonl',
    'voice': '/kaggle/input/sov33-data/voice_200_fixed.jsonl',
}

losses = {}
for owem, data_file in OWEMS.items():
    losses[owem] = train_owem(owem, data_file, epochs=3, rank=32, batch_size=4)

# Cell 6: Train SOV33 LARGE (all data combined)
print(f"\n{'='*60}")
print("Training SOV33 LARGE (all data)...")
print(f"{'='*60}")
losses['sov33_large'] = train_owem('sov33-large', '/kaggle/input/sov33-data/sov33_merged_corpus.jsonl', epochs=3, rank=64, batch_size=2)

# Cell 7: Results
print(f"\n{'='*60}")
print("TRAINING COMPLETE")
print(f"{'='*60}")
for owem, loss in losses.items():
    print(f"  {owem}: loss={loss:.4f}")
print(f"\nDownload adapters from /kaggle/working/sov33-*/")
