# SOV4_ALLLINEAR_COLAB.py — paste into a Colab/Kaggle GPU cell. Tests ONE thing, honestly.
# ============================================================================================
# THE QUESTION: we train LoRA on attention only (q_proj,k_proj,v_proj,o_proj). Thinking Machines'
# "LoRA Without Regret" reports that **attention-only at r=256 UNDERPERFORMS MLP-only at r=128**, and
# recommends applying LoRA to ALL linear layers, especially the MLPs. If true for us, every adapter
# Science has trained (governance, defense, intuition, voice, judgment, openworld) has been leaving
# measurable quality on the table — for free.
#
# WHY THIS AND NOT "MORE DATA" (the thing we were about to do with the free GPU):
#   - Gekhman et al. EMNLP'24: fine-tuning on knowledge the base LACKS **linearly increases hallucination**.
#     Growing a thin corpus with external data is the ONE intervention that makes our core problem WORSE.
#   - AbstentionBench (Meta FAIR, 20 datasets, >35k questions): **reasoning fine-tuning makes abstention 24% WORSE**,
#     and scaling has "negligible or inconsistent impact" on abstention recall.
#   - "Which LoRA?" (Jun 2026, Qwen/Llama, 5,000 samples): LoRA vs DoRA vs VeRA vs AdaLoRA vs PiSSA ->
#     **ANOVA p=0.89. No significant difference.** The variant zoo is paper-churn; skip it.
#   So: don't chase variants, don't scale data. Test the one thing with real evidence behind it.
#
# METHOD — the discipline this session was built on:
#   * ONE variable changes: target_modules. Everything else is pinned (seed, data, LR, steps, rank).
#   * temperature is irrelevant here (we score held-out LOSS, not generations) — deliberately, because
#     today's A/B failed precisely because generation-scoring at temp=0.2 with n=10 was noise-dominated.
#   * 3 seeds per arm. A single-seed delta is not a result. If the arms overlap across seeds, THE ANSWER
#     IS "NO DIFFERENCE" — report that, do not pick the flattering seed.
#
# HONEST PREDICTION (write it down BEFORE running, so the result can surprise you):
#   all-linear should win modestly. If it wins HUGELY, suspect the harness. If it loses, believe it.
# ============================================================================================

!pip -q install "transformers>=4.44" "peft>=0.13" "datasets>=2.20" "accelerate>=0.34" torch --upgrade 2>/dev/null

import torch, json, numpy as np, random
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import LoraConfig, get_peft_model
from torch.utils.data import DataLoader

BASE = "Qwen/Qwen2.5-0.5B"          # same family/size as SOV3. Small = fast = many seeds.
SEEDS = [0, 1, 2]
STEPS = 120
LR = 2e-4                            # NOTE: Thinking Machines say LoRA LR ~10-15x full-FT for short runs.
RANK = 16                            # matches Science's adapters. At 1.3k rows we are NOT capacity-bound.

ARMS = {
    "attention_only": ["q_proj", "k_proj", "v_proj", "o_proj"],   # what we do TODAY
    "all_linear":     "all-linear",                                # what the evidence recommends
}

# ---- data: use YOUR governance pairs. Falls back to a synthetic set so the cell runs anywhere. ----
def load_pairs():
    try:
        rows = [json.loads(l) for l in open("/kaggle/input/sov33/sector_governance.jsonl")]
    except Exception:
        try:
            rows = [json.loads(l) for l in open("sector_governance.jsonl")]
        except Exception:
            print("⚠️  No sector_governance.jsonl found — using a SYNTHETIC set. The DELTA is still")
            print("    meaningful (same data both arms), but do not read the absolute loss as real.")
            rows = [{"instruction": f"Explain obligation {i} under the EU AI Act.",
                     "output": f"Article {i%113+1} imposes obligation {i} on providers."} for i in range(400)]
    return rows

def fmt(r):
    return f"### Q: {r.get('instruction') or r.get('input','')}\n### A: {r.get('output') or r.get('response','')}"

def run(arm_name, targets, seed):
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    tok = AutoTokenizer.from_pretrained(BASE); tok.pad_token = tok.pad_token or tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.bfloat16, device_map="auto")
    cfg = LoraConfig(r=RANK, lora_alpha=32, lora_dropout=0.05, bias="none",
                     task_type="CAUSAL_LM", target_modules=targets)
    model = get_peft_model(model, cfg)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)

    rows = load_pairs(); random.Random(seed).shuffle(rows)
    split = int(len(rows) * 0.85); train, held = rows[:split], rows[split:]
    def batchify(rs, bs=4):
        for i in range(0, len(rs), bs):
            b = tok([fmt(r) for r in rs[i:i+bs]], return_tensors="pt", padding=True,
                    truncation=True, max_length=256).to(model.device)
            b["labels"] = b["input_ids"].clone(); yield b

    opt = torch.optim.AdamW([p for p in model.parameters() if p.requires_grad], lr=LR)
    model.train(); step = 0
    while step < STEPS:
        for b in batchify(train):
            loss = model(**b).loss; loss.backward(); opt.step(); opt.zero_grad(); step += 1
            if step >= STEPS: break

    model.eval(); losses = []
    with torch.no_grad():
        for b in batchify(held):
            losses.append(model(**b).loss.item())
    del model; torch.cuda.empty_cache()
    return {"arm": arm_name, "seed": seed, "held_loss": float(np.mean(losses)), "trainable": trainable}

print("=" * 76)
print(" ALL-LINEAR vs ATTENTION-ONLY — one variable, 3 seeds, held-out loss")
print(" Prediction (written before the run): all-linear wins MODESTLY. Huge win => suspect the harness.")
print("=" * 76)
results = []
for arm, targets in ARMS.items():
    for s in SEEDS:
        r = run(arm, targets, s); results.append(r)
        print(f"  {r['arm']:<16} seed{r['seed']}  held_loss={r['held_loss']:.4f}  trainable={r['trainable']:,}")

a = [r["held_loss"] for r in results if r["arm"] == "attention_only"]
b = [r["held_loss"] for r in results if r["arm"] == "all_linear"]
print("\n" + "=" * 76)
print(f"  attention_only  mean {np.mean(a):.4f}  sd {np.std(a):.4f}   (what we do today)")
print(f"  all_linear      mean {np.mean(b):.4f}  sd {np.std(b):.4f}   (what the evidence says)")
print(f"  delta {np.mean(a)-np.mean(b):+.4f}  (POSITIVE = all-linear better; lower loss wins)")
overlap = (np.mean(a) - np.std(a)) < (np.mean(b) + np.std(b)) and (np.mean(b) - np.std(b)) < (np.mean(a) + np.std(a))
print("\n  VERDICT: " + ("⚠️  ARMS OVERLAP within 1 sd across seeds -> NO DEMONSTRATED DIFFERENCE."
                         "\n           Report that. Do NOT pick the flattering seed. n=3 is small."
                         if overlap else
                         ("✅ all_linear separates cleanly -> switch target_modules on every future train."
                          if np.mean(b) < np.mean(a) else
                          "❌ attention_only WINS -> the Thinking Machines finding does NOT transport to our"
                          "\n           setup. Keep what we have and record the null. A null is a real result.")))
json.dump(results, open("alllinear_ab.json", "w"), indent=1)
print("\n  -> alllinear_ab.json   (bring this back to _alignment/sovbench/)")
