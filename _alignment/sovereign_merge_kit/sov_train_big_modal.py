import modal, json, os
app = modal.App("sov-big-lora")
img = (modal.Image.debian_slim(python_version="3.11")
       .pip_install("torch","transformers>=4.44","peft","trl","datasets","accelerate","bitsandbytes","sentencepiece"))
vol = modal.Volume.from_name("sov-big-out", create_if_missing=True)

@app.function(image=img, gpu="A100-80GB:8", timeout=60*60*6, volumes={"/out": vol})
def train(rows):
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model
    from datasets import Dataset
    from trl import SFTConfig, SFTTrainer
    BASE="moonshotai/Kimi-K2.6"
    bnb=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                           bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True)
    tok=AutoTokenizer.from_pretrained(BASE, trust_remote_code=True)
    if tok.pad_token is None: tok.pad_token=tok.eos_token
    model=AutoModelForCausalLM.from_pretrained(BASE, quantization_config=bnb, device_map="auto",
                                               trust_remote_code=True, torch_dtype=torch.bfloat16)
    lora=LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
                    target_modules=["q_proj","k_proj","v_proj","o_proj"])
    model=get_peft_model(model, lora)
    def fmt(r): return {"text": f"<|user|>\n{r.get('instruction','')}\n<|assistant|>\n{r.get('response','')}"}
    ds=Dataset.from_list([fmt(r) for r in rows])
    cfg=SFTConfig(output_dir="/out/sov_big_adapter", num_train_epochs=2, per_device_train_batch_size=1,
                  gradient_accumulation_steps=8, learning_rate=2e-4, logging_steps=10, save_strategy="epoch",
                  bf16=True, max_length=1024, report_to="none")
    tr=SFTTrainer(model=model, args=cfg, train_dataset=ds)
    res=tr.train(); tr.save_model("/out/sov_big_adapter")
    vol.commit()
    return {"final_loss": float(res.training_loss), "rows": len(rows), "base": BASE}

@app.local_entrypoint()
def main():
    rows=[json.loads(l) for l in open("expert_data/merged_corpus.jsonl") if l.strip()]
    print(f"training on {len(rows)} rows")
    out=train.remote(rows)
    print(json.dumps(out))
