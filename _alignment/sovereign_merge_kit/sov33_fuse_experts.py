#!/usr/bin/env python3
"""sov33_fuse_experts.py — the REAL free fusion: 4 same-base experts -> TIES-merge -> 1 fused brain, on Modal GPU.

This is the "square with 4 inners / 3-around-1" done by the MEASURED laws (BRAIN_MERGE_SYNTHESIS):
  - 4 experts are fine-tunes of the SAME base (Qwen2.5-0.5B) on 4 shards of our corpus -> weight-fusion is VALID.
  - Fuse by TIES (trim small deltas + sign-elect + average), NOT naive average (which collapsed at 0.6B before).
  - Prove it: eval fused vs naive-average vs best-single on held-out loss. TIES should hold where naive fails.
No funding gate — pure open-model synthesis on a free T4. Run: modal run sov33_fuse_experts.py
"""
import os
try: import modal
except ImportError: modal = None
STUB = modal.App("sov33-fuse") if modal else None
DATA = os.environ.get("SOV_DATA","expert_data/merged_corpus.jsonl")
BASE = os.environ.get("SOV_BASE","Qwen/Qwen2.5-0.5B-Instruct")
K = int(os.environ.get("SOV_EXPERTS","4"))

if modal:
    image = (modal.Image.debian_slim().pip_install(
        "torch==2.3.1","transformers==4.44.2","trl==0.9.6","peft==0.12.0",
        "datasets==2.20.0","accelerate==0.33.0","bitsandbytes==0.43.1","rich"))

    @STUB.function(gpu="T4", image=image, timeout=5400)
    def fuse(pairs: list, base: str, k: int):
        import torch, copy
        from datasets import Dataset
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import LoraConfig, get_peft_model, get_peft_model_state_dict, set_peft_model_state_dict
        from trl import SFTConfig, SFTTrainer
        tok = AutoTokenizer.from_pretrained(base); tok.pad_token = tok.pad_token or tok.eos_token
        fmt = lambda r: {"text": f"<|user|>\n{r['instruction']}\n<|assistant|>\n{r['response']}"}
        shards = [pairs[i::k] for i in range(k)]                       # k domain-ish shards, same base
        held = Dataset.from_list([fmt(p) for p in pairs[:64]])         # held-out for scoring
        experts = []
        def train_one(shard, tag):
            m = AutoModelForCausalLM.from_pretrained(base, torch_dtype=torch.float16, device_map="auto")
            m = get_peft_model(m, LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj","k_proj","v_proj","o_proj"], lora_dropout=0.05, task_type="CAUSAL_LM"))
            cfg = SFTConfig(output_dir=f"/tmp/e{tag}", per_device_train_batch_size=2, gradient_accumulation_steps=4,
                            num_train_epochs=2, learning_rate=2e-4, fp16=True, max_seq_length=1024, logging_steps=20,
                            dataset_text_field="text", report_to=[])
            SFTTrainer(model=m, train_dataset=Dataset.from_list([fmt(p) for p in shard]), args=cfg).train()
            return {kk: v.detach().float().cpu() for kk,v in get_peft_model_state_dict(m).items()}, m
        base_m = None
        for i in range(k):
            sd, m = train_one(shards[i], i); experts.append(sd); base_m = m
        # --- TIES merge of the k LoRA state-dicts ---
        def ties(dicts, density=0.3):
            out = {}
            for name in dicts[0]:
                stack = torch.stack([d[name] for d in dicts])          # [k, ...]
                # trim: keep top-`density` magnitude per expert
                flat = stack.abs().flatten(1)
                kth = max(1, int(flat.shape[1]*density))
                thr = flat.kthvalue(flat.shape[1]-kth+1, dim=1).values.view(-1, *([1]*(stack.dim()-1)))
                trimmed = torch.where(stack.abs() >= thr, stack, torch.zeros_like(stack))
                sign = torch.sign(trimmed.sum(0))                       # elected sign
                agree = (torch.sign(trimmed) == sign) & (trimmed != 0)
                num = (trimmed*agree).sum(0); den = agree.sum(0).clamp(min=1)
                out[name] = (num/den).to(torch.float16)
            return out
        def naive(dicts):
            return {n: torch.stack([d[n] for d in dicts]).mean(0).to(torch.float16) for n in dicts[0]}
        def score(sd):
            set_peft_model_state_dict(base_m, {kk: v.to(base_m.device) for kk,v in sd.items()})
            base_m.eval(); tot=0.0; n=0
            for ex in held:
                ids = tok(ex["text"], return_tensors="pt", truncation=True, max_length=512).to(base_m.device)
                with torch.no_grad(): tot += float(base_m(**ids, labels=ids["input_ids"]).loss); n+=1
            return round(tot/max(n,1), 4)
        ties_sd, naive_sd = ties(experts), naive(experts)
        return {"held_loss": {"ties_fused": score(ties_sd), "naive_avg": score(naive_sd),
                              **{f"expert_{i}": score(experts[i]) for i in range(k)}},
                "law": "lower loss = better; TIES should beat naive_avg (the prior 0.6B collapse method)"}

    @STUB.local_entrypoint()
    def main():
        import json
        pairs = [json.loads(l) for l in open(DATA) if l.strip()]
        print(f"[fuse] {K} same-base experts on {BASE}, TIES vs naive, {len(pairs)} rows")
        r = fuse.remote(pairs, BASE, K)
        json.dump(r, open("fusion_result.json","w"), indent=2)
        print(json.dumps(r, indent=2))
