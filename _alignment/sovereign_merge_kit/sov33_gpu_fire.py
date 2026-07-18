#!/usr/bin/env python3
"""sov33_gpu_fire.py — THE ONE-COMMAND REAL TRAINING PIPELINE. Fires the instant ANY GPU appears
(Kaggle T4 / Colab / Lightning A100). Self-contained: pip-installs, QLoRA-fine-tunes a Qwen3 expert on the
sovereign expert_data, grades GSM8K in solver-format, writes the real number. This is Science's "rung 4" made
runnable — the piece that turns the staged trinity into actual sovereign weights.

Usage on any GPU box:
    python sov33_gpu_fire.py                       # SOV3 base = Qwen3-0.6B (Apache), fits a T4
    SOV_BASE=Qwen/Qwen3-4B-Instruct python sov33_gpu_fire.py   # bigger expert (needs more VRAM)

HONEST: syntax-verified on the Mac; EXECUTION needs a GPU (not run here — no CUDA on 16GB). Standard QLoRA
(transformers+peft+trl+bitsandbytes). Config from the measured trinity: base=Qwen3 (Apache), solver-format
eval, care-floor still applies at serve time. Produces `sov_expert_adapter/` + `sov33_local_gsm8k.json`.
"""
import os, sys, json, subprocess, re, glob

def pip(*p): subprocess.run([sys.executable, "-m", "pip", "-q", "install", *p], check=False)

def main():
    pip("transformers>=4.44", "peft", "trl", "bitsandbytes", "accelerate", "datasets")
    import torch
    from datasets import load_dataset, Dataset
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import SFTTrainer, SFTConfig

    BASE = os.environ.get("SOV_BASE", "Qwen/Qwen3-0.6B")     # Apache-2.0, fits a T4; measured SOV3 base
    DATA_GLOB = os.environ.get("SOV_DATA", "expert_data/*.jsonl")
    OUT = os.environ.get("SOV_OUT", "sov_expert_adapter")
    print(f"[fire] base={BASE}  data={DATA_GLOB}  gpu={torch.cuda.is_available()}")

    # ---- 1. load the sovereign expert corpus (instruction/response or plain text jsonl) ----
    rows = []
    for f in glob.glob(DATA_GLOB):
        for line in open(f):
            line = line.strip()
            if not line: continue
            try: d = json.loads(line)
            except Exception: continue
            # accept {instruction,response} | {prompt,completion} | {text} | {messages}
            if "text" in d: rows.append({"text": d["text"]})
            elif "messages" in d: rows.append({"text": "\n".join(m.get("content","") for m in d["messages"])})
            elif "instruction" in d: rows.append({"text": d["instruction"] + "\n" + d.get("response", d.get("output",""))})
            elif "prompt" in d: rows.append({"text": d["prompt"] + "\n" + d.get("completion","")})
    print(f"[fire] corpus examples: {len(rows)}")
    ds = Dataset.from_list(rows)

    # ---- 2. QLoRA (4-bit) fine-tune ----
    bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                             bnb_4bit_compute_dtype=torch.float16, bnb_4bit_use_double_quant=True)
    tok = AutoTokenizer.from_pretrained(BASE); tok.pad_token = tok.pad_token or tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(BASE, quantization_config=bnb, device_map="auto")
    model = prepare_model_for_kbit_training(model)
    lora = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
                      target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"])
    model = get_peft_model(model, lora)
    cfg = SFTConfig(output_dir=OUT, per_device_train_batch_size=2, gradient_accumulation_steps=4,
                    num_train_epochs=1, learning_rate=2e-4, logging_steps=20, save_strategy="epoch",
                    max_seq_length=1024, bf16=False, fp16=True, report_to=[])
    SFTTrainer(model=model, train_dataset=ds, args=cfg).train()
    model.save_pretrained(OUT); tok.save_pretrained(OUT)
    print(f"[fire] adapter saved -> {OUT}")

    # ---- 3. grade GSM8K in SOLVER format (the honest measurable number) ----
    def num(t):
        m = re.findall(r"ANSWER:\s*\$?(-?[\d,]+(?:\.\d+)?)", t or "", re.I)
        if m: return m[-1].replace(",", "")
        xs = re.findall(r"-?\d[\d,]*\.?\d*", (t or "").replace(",", "")); return xs[-1] if xs else None
    gsm = load_dataset("gsm8k", "main", split="test")
    N = int(os.environ.get("SOV_N", "100")); c = 0
    model.eval()
    for i in range(min(N, len(gsm))):
        q = gsm[i]["question"] + "\nSolve step by step. On the final line write exactly 'ANSWER: <number>'."
        ids = tok(q, return_tensors="pt").to(model.device)
        out = model.generate(**ids, max_new_tokens=512, do_sample=False, pad_token_id=tok.eos_token_id)
        ans = tok.decode(out[0][ids["input_ids"].shape[1]:], skip_special_tokens=True)
        gold = re.search(r"####\s*(-?[\d,]+)", gsm[i]["answer"]); gold = gold.group(1).replace(",","") if gold else None
        c += (num(ans) == gold)
    res = {"gsm8k": round(c/min(N,len(gsm)), 4), "n": min(N,len(gsm)), "base": BASE,
           "corpus_examples": len(rows), "adapter": OUT, "method": "QLoRA on sovereign expert_data + solver-format GSM8K"}
    json.dump(res, open("sov33_local_gsm8k.json", "w"), indent=2)
    # also write the filename sov33_ingest_kaggle_result.py reads, so the result auto-wires into canonical
    json.dump(res, open("sov33_live_gsm8k.json", "w"), indent=2)
    print("[fire] REAL SOVEREIGN NUMBER:", json.dumps(res))

if __name__ == "__main__":
    main()
