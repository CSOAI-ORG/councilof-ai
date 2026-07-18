"""
SOV33 Kaggle T4 Notebook — Fast GPU Training.

Paste this into a Kaggle notebook with T4 GPU (free tier).
Trains all 4 OWEMs + SOV33 large in ~30 minutes total.

GPU: T4 (16GB VRAM)
RAM: 13GB
Disk: 20GB
"""

# Cell 1: Install dependencies
# !pip install transformers datasets peft accelerate bitsandbytes torch

# Cell 2: Upload data
# Upload sov33_large_world_corpus.jsonl + compliance/defense/intuition/voice .jsonl files

# Cell 3: Train all 4 OWEMs (fast, T4 GPU)
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import Dataset
from peft import LoraConfig, get_peft_model, TaskType
import json, os

DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"Device: {DEVICE}")

# Load base model
print("Loading Qwen3-0.6B...")
tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    'Qwen/Qwen3-0.6B',
    torch_dtype=torch.float16,  # FP16 for T4
    device_map='auto',
    trust_remote_code=True,
)
print(f"Model loaded: {model.num_parameters():,} params")

# LoRA config (more aggressive for GPU)
lora_config = LoraConfig(
    r=32,  # Higher rank for GPU
    lora_alpha=64,
    target_modules=['q_proj', 'k_proj', 'v_proj', 'o_proj', 'gate_proj', 'up_proj', 'down_proj'],
    lora_dropout=0.05,
    bias='none',
    task_type=TaskType.CAUSAL_LM,
)

# Train each OWEM
OWEM_NAMES = ['compliance', 'defense', 'intuition', 'voice']
OWEM_FILES = ['compliance_1000.jsonl', 'defense_1000.jsonl', 'intuition_1000.jsonl', 'voice_1000.jsonl']

for owem_name, owem_file in zip(OWEM_NAMES, OWEM_FILES):
    print(f"\n{'='*60}")
    print(f"Training {owem_name}...")
    print(f"{'='*60}")
    
    # Load data
    examples = []
    with open(owem_file) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if 'messages' in d and len(d['messages']) > 0:
                        examples.append(d)
                except:
                    pass
    
    print(f"  {len(examples)} examples")
    
    # Format
    def format_example(d):
        msgs = d.get('messages', [])
        clean = [{'role': m.get('role','user'), 'content': (m.get('content') or '')} for m in msgs if m.get('content')]
        if not clean:
            return {'input_ids': [], 'labels': []}
        try:
            text = tokenizer.apply_chat_template(clean, tokenize=False, add_generation_prompt=False)
        except:
            text = '\n'.join(f"<{m['role']}>: {m['content']}" for m in clean)
        if not text.strip():
            return {'input_ids': [], 'labels': []}
        ids = tokenizer(text, truncation=True, max_length=512).input_ids
        return {'input_ids': ids, 'labels': ids.copy()} if ids else {'input_ids': [], 'labels': []}
    
    data_list = [d for d in (format_example(e) for e in examples) if d['input_ids']]
    print(f"  {len(data_list)} valid")
    dataset = Dataset.from_list(data_list)
    
    # Fresh model for each OWEM
    model_owem = AutoModelForCausalLM.from_pretrained(
        'Qwen/Qwen3-0.6B', torch_dtype=torch.float16, device_map='auto', trust_remote_code=True
    )
    model_owem = get_peft_model(model_owem, lora_config)
    
    # Train
    output_dir = f'/kaggle/working/sov33-{owem_name}'
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=4,  # GPU allows larger batch
        gradient_accumulation_steps=2,
        learning_rate=2e-4,
        warmup_steps=20,
        logging_steps=10,
        save_strategy='epoch',
        fp16=True,  # FP16 for T4
        report_to='none',
        remove_unused_columns=False,
    )
    
    trainer = Trainer(
        model=model_owem,
        args=training_args,
        train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False),
    )
    
    result = trainer.train()
    print(f"  Loss: {result.training_loss:.4f}")
    
    # Save
    model_owem.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)
    print(f"  Saved to {output_dir}")

print("\n" + "="*60)
print("ALL 4 OWEMs TRAINED!")
print("="*60)
print("Download the adapters from /kaggle/working/sov33-{compliance,defense,intuition,voice}/")
