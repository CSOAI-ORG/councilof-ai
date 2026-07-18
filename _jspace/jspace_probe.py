#!/usr/bin/env python3
"""
J-SPACE PROBE — the weights-access interpretability instrument for the OWEM L4 bench.
Two canonical techniques on a REAL open-weights transformer (gpt2, 124M), run locally
on the Mac. NO hosted API can do this — interpretability needs activation/logit access.

1. LOGIT LENS (nostalgebraist) — project every layer's residual stream through the
   unembedding (ln_f + lm_head) to watch the model's in-progress prediction crystallise
   with depth. Tests the J-space claim: "long-range, late-layer, integrative dynamics".

2. LINEAR PROBING CLASSIFIER (Alain & Bengio / Dehaene-style) — train a linear probe on
   each layer's mean-pooled hidden state to decode an abstract property (sentiment). Where
   accuracy rises tells us WHERE a concept becomes linearly decodable. Tests the J-space
   claim: "plan-based, abstract representations in late layers".

Honest register (two-sentence rule): this measures the model's internal REPRESENTATIONAL
structure — where predictions form and where concepts become decodable across depth. It
says nothing about felt experience; it is an engineering probe of a small model.
"""
import json, warnings
warnings.filterwarnings("ignore")
import numpy as np
import torch
from transformers import GPT2LMHeadModel, GPT2TokenizerFast
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score

torch.manual_seed(0); np.random.seed(0)
DEV = "mps" if torch.backends.mps.is_available() else "cpu"
MODEL = "gpt2"
print(f"[jspace] loading {MODEL} on {DEV} ...")
tok = GPT2TokenizerFast.from_pretrained(MODEL)
model = GPT2LMHeadModel.from_pretrained(MODEL, output_hidden_states=True).to(DEV).eval()
NL = model.config.n_layer  # 12
lm_head, ln_f = model.lm_head, model.transformer.ln_f

# ---------- 1. LOGIT LENS ----------
def logit_lens(prompt, answer_tok):
    ids = tok(prompt, return_tensors="pt").to(DEV)
    with torch.no_grad():
        hs = model(**ids).hidden_states          # tuple: embeddings + NL layers
    ans_id = tok(answer_tok)["input_ids"][0]
    traj = []
    for L, h in enumerate(hs):
        last = h[0, -1]                          # residual stream at final token
        with torch.no_grad():
            logits = lm_head(ln_f(last))
        probs = torch.softmax(logits, -1)
        top = tok.decode(int(logits.argmax()))
        rank = int((logits > logits[ans_id]).sum())  # 0 = top-1
        traj.append({"layer": L, "top_token": top.strip(),
                     "answer_rank": rank, "answer_prob": round(float(probs[ans_id]), 4)})
    return ans_id, traj

LENS_CASES = [
    ("The capital of France is", " Paris"),
    ("The opposite of hot is", " cold"),
    ("Two plus two equals", " four"),
    ("The sky is", " blue"),
]
print("[jspace] running logit lens ...")
lens_out = []
for prompt, ans in LENS_CASES:
    _, traj = logit_lens(prompt, ans)
    # first layer where the answer enters top-1 and top-5
    enter1 = next((t["layer"] for t in traj if t["answer_rank"] == 0), None)
    enter5 = next((t["layer"] for t in traj if t["answer_rank"] < 5), None)
    lens_out.append({"prompt": prompt, "answer": ans.strip(),
                     "top1_layer": enter1, "top5_layer": enter5,
                     "final_top": traj[-1]["top_token"], "traj": traj})
    print(f"  '{prompt}' -> answer '{ans.strip()}' enters top-1 @L{enter1}, top-5 @L{enter5} "
          f"(final: '{traj[-1]['top_token']}')")

# ---------- 2. LINEAR PROBING CLASSIFIER (sentiment) ----------
POS = ["I love this","what a wonderful day","this is fantastic","she is so kind",
       "a brilliant and joyful film","the food was delicious","everyone felt happy",
       "an inspiring success","warm and generous people","the best gift ever",
       "pure delight and wonder","a beautiful sunny morning","he smiled with pure joy",
       "the team celebrated their win","such a heartwarming story","a triumphant victory",
       "gratitude filled the room","a gorgeous peaceful garden","kindness makes life sweet",
       "the music was uplifting"]
NEG = ["I hate this","what a miserable day","this is terrible","she is so cruel",
       "a dull and depressing film","the food was disgusting","everyone felt afraid",
       "a humiliating failure","cold and selfish people","the worst gift ever",
       "pure dread and despair","a grim and stormy night","he frowned with pure rage",
       "the team suffered a loss","such a heartbreaking story","a crushing defeat",
       "resentment filled the room","a filthy dreadful alley","cruelty poisons the soul",
       "the noise was unbearable"]
texts = POS + NEG
y = np.array([1]*len(POS) + [0]*len(NEG))

def layer_features(text):
    ids = tok(text, return_tensors="pt").to(DEV)
    with torch.no_grad():
        hs = model(**ids).hidden_states
    return [h[0].mean(0).cpu().numpy() for h in hs]   # mean-pool tokens, per layer

print("[jspace] extracting hidden states for probing ...")
feats = [layer_features(t) for t in texts]            # [N][NL+1][hidden]
probe_out = []
for L in range(NL + 1):
    X = np.stack([f[L] for f in feats])
    acc = cross_val_score(LogisticRegression(max_iter=2000, C=1.0),
                          X, y, cv=5).mean()
    probe_out.append({"layer": L, "probe_acc": round(float(acc), 3)})
peak = max(probe_out, key=lambda d: d["probe_acc"])
print(f"  probe accuracy rises from L0={probe_out[0]['probe_acc']} "
      f"to peak L{peak['layer']}={peak['probe_acc']}")

summary = {
    "model": MODEL, "n_layers": NL, "device": DEV,
    "logit_lens": lens_out,
    "probing_classifier": {"task": "sentiment (20 pos / 20 neg)", "cv": 5,
                           "per_layer": probe_out, "peak": peak,
                           "L0_acc": probe_out[0]["probe_acc"]},
    "honest_note": "Small open-weights model; principle instrument, not a production "
                   "benchmark. Measures representational structure (where predictions form / "
                   "concepts become decodable), NOT felt experience."
}
with open("/Users/nicholas/clawd/_jspace/jspace_results.json", "w") as f:
    json.dump(summary, f, indent=2)
print("[jspace] wrote jspace_results.json")

# ---------- figure ----------
try:
    import matplotlib; matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))
    # logit lens: answer rank trajectory (log) per case
    for c in lens_out:
        ranks = [max(t["answer_rank"], 0.5) for t in c["traj"]]
        ax1.plot(range(len(ranks)), ranks, marker="o", ms=3, label=c["answer"])
    ax1.set_yscale("log"); ax1.invert_yaxis()
    ax1.set_xlabel("layer (residual stream depth)"); ax1.set_ylabel("rank of correct answer (log, ↑=better)")
    ax1.set_title("Logit lens — predictions crystallise with depth"); ax1.legend(fontsize=8); ax1.grid(alpha=.3)
    # probe accuracy vs layer
    Ls = [d["layer"] for d in probe_out]; accs = [d["probe_acc"] for d in probe_out]
    ax2.plot(Ls, accs, marker="s", color="#c9a84c"); ax2.axhline(.5, ls="--", c="gray", label="chance")
    ax2.set_xlabel("layer"); ax2.set_ylabel("linear-probe accuracy (sentiment)")
    ax2.set_title("Where the concept becomes linearly decodable"); ax2.set_ylim(.4, 1.02); ax2.legend(fontsize=8); ax2.grid(alpha=.3)
    fig.suptitle("J-SPACE PROBE — gpt2 (124M), local Mac, real weights", fontweight="bold")
    fig.tight_layout(); fig.savefig("/Users/nicholas/clawd/_jspace/jspace_figure.png", dpi=130)
    print("[jspace] wrote jspace_figure.png")
except Exception as e:
    print(f"[jspace] figure skipped: {e}")
print("[jspace] DONE")
