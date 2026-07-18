#!/usr/bin/env python3
"""02_finetune_expert.py — LoRA fine-tune ONE expert on its data. Run once per brain-config.
Usage: python 02_finetune_expert.py --expert compliance --base Qwen/Qwen3.6-4B --data expert_data/compliance.jsonl
Rented-GPU friendly (QLoRA 4-bit fits a 24GB card for <=8B; 30B needs 1-2x A100 80GB).
"""
import argparse, json
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer, SFTConfig
import torch

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--expert", required=True)
    ap.add_argument("--base", default="Qwen/Qwen3-4B")   # PROOF run small; PRIMARY base = Qwen/Qwen3.6-35B-A3B (Apache-2.0); STRETCH = GLM-5.x (MIT)
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default=None)
    ap.add_argument("--epochs", type=float, default=2.0)
    a = ap.parse_args()
    out = a.out or f"experts/{a.expert}"

    bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                             bnb_4bit_compute_dtype=torch.bfloat16)
    tok = AutoTokenizer.from_pretrained(a.base)
    model = AutoModelForCausalLM.from_pretrained(a.base, quantization_config=bnb, device_map="auto")
    lora = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, bias="none",
                      task_type="CAUSAL_LM",
                      target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"])
    model = get_peft_model(model, lora)
    ds = load_dataset("json", data_files=a.data, split="train")

    def fmt(ex):
        return {"text": tok.apply_chat_template(ex["messages"], tokenize=False, add_generation_prompt=False)}
    ds = ds.map(fmt)

    cfg = SFTConfig(output_dir=out, num_train_epochs=a.epochs, per_device_train_batch_size=2,
                    gradient_accumulation_steps=4, learning_rate=2e-4, bf16=True,
                    logging_steps=10, save_strategy="epoch", max_length=2048)
    SFTTrainer(model=model, args=cfg, train_dataset=ds).train()
    # merge LoRA into base weights so the expert is a standalone model mergekit can consume
    model = model.merge_and_unload()
    model.save_pretrained(out); tok.save_pretrained(out)
    print(f"expert '{a.expert}' saved to {out} (LoRA merged into base weights)")

if __name__ == "__main__":
    main()
