#!/usr/bin/env python3
"""KDA 3:1 hybrid-attention ratio — CPU micro-experiment.

Tests the DIRECTIONAL effect of a 3-linear:1-full attention ratio (Kimi Linear,
arXiv 2510.26692) on our SSM-leg family, at toy scale. NOT a reproduction of
Moonshot's 75%/6.3x @1M/5.7T — those are theirs at their scale. Honest test:
does 1 full layer in 4 rescue associative recall vs pure-linear, at a fraction
of the KV-cache memory of all-full attention, at matched param budget?

Author: MEOK SOV3. Env: sov33ft. CPU-only, deterministic seed. Free.
"""
import json, math, time, argparse
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.manual_seed(0); np.random.seed(0)
DEV = "cpu"; DT = torch.float32; BYTES = 4  # fp32

# ---------------- synthetic associative-recall (MQAR-style) task ----------------
# Vocab: keys [0..NK), values [NK..NK+NV), plus QUERY marker and PAD.
NK, NV = 64, 8    # keys: must exceed max eval n_pairs (distinct, no replace). values: 8 classes (chance=1/8)
QUERY = NK + NV          # marker token placed before the queried key
PAD   = NK + NV + 1
VOCAB = NK + NV + 2

def make_batch(bsz, n_pairs, gen):
    """Sequence: k0 v0 k1 v1 ... k{n-1} v{n-1} QUERY kq  -> predict vq.
    Keys within a sequence are distinct so the binding is unambiguous."""
    L = 2 * n_pairs + 2
    x = torch.full((bsz, L), PAD, dtype=torch.long)
    y = torch.full((bsz, L), -100, dtype=torch.long)  # -100 = ignore in CE
    for b in range(bsz):
        keys = gen.choice(NK, size=n_pairs, replace=False)
        vals = gen.integers(0, NV, size=n_pairs) + NK
        for i in range(n_pairs):
            x[b, 2*i]   = int(keys[i])
            x[b, 2*i+1] = int(vals[i])
        qi = int(gen.integers(0, n_pairs))
        x[b, 2*n_pairs]   = QUERY
        x[b, 2*n_pairs+1] = int(keys[qi])
        y[b, 2*n_pairs+1] = int(vals[qi])   # supervise only the answer position
    return x, y

# ---------------- attention mixers (matched projection params) ----------------
class LinearAttn(nn.Module):
    """Causal linear attention (Katharopoulos et al.), vectorized via cumsum —
    NO Python-over-time loop. elu+1 feature map, non-negative, numerically stable.
    Keeps a FIXED-size recurrent state S=(nh,hd,hd) + z=(nh,hd), L-independent —
    the property that gives the KV-cache saving. Stand-in for the LINEAR leg of a
    KDA hybrid: it shares KDA's fixed-state property but NOT its gated-delta (DPLR)
    rule or channel-wise gating (documented gap in the spec). Non-gated linear
    attention is deliberately weak at long-range recall — the effect we test."""
    def __init__(self, d, nh):
        super().__init__(); self.nh, self.hd = nh, d // nh
        self.q = nn.Linear(d, d); self.k = nn.Linear(d, d)
        self.v = nn.Linear(d, d); self.o = nn.Linear(d, d)
    def phi(self, x): return F.elu(x) + 1.0
    def forward(self, x):
        B, L, D = x.shape; nh, hd = self.nh, self.hd
        q = self.phi(self.q(x)).view(B, L, nh, hd)
        k = self.phi(self.k(x)).view(B, L, nh, hd)
        v = self.v(x).view(B, L, nh, hd)
        KV = torch.einsum('blhd,blhe->blhde', k, v)   # (B,L,nh,hd,hd)
        S  = torch.cumsum(KV, dim=1)                   # prefix state at each t
        Z  = torch.cumsum(k,  dim=1)                   # (B,L,nh,hd) normalizer prefix
        num = torch.einsum('blhd,blhde->blhe', q, S)
        den = torch.einsum('blhd,blhd->blh', q, Z).clamp_min(1e-6).unsqueeze(-1)
        out = (num / den).reshape(B, L, D)
        return self.o(out)
    def kv_cache_bytes(self, L):  # fixed recurrent state, independent of L
        return self.nh * self.hd * self.hd * BYTES + self.nh * self.hd * BYTES

class FullAttn(nn.Module):
    """Standard causal softmax attention. KV cache grows linearly with L."""
    def __init__(self, d, nh):
        super().__init__(); self.nh, self.hd = nh, d // nh
        self.q = nn.Linear(d, d); self.k = nn.Linear(d, d)
        self.v = nn.Linear(d, d); self.o = nn.Linear(d, d)
    def forward(self, x):
        B, L, D = x.shape; nh, hd = self.nh, self.hd
        q = self.q(x).view(B, L, nh, hd).transpose(1, 2)
        k = self.k(x).view(B, L, nh, hd).transpose(1, 2)
        v = self.v(x).view(B, L, nh, hd).transpose(1, 2)
        att = (q @ k.transpose(-2, -1)) / math.sqrt(hd)
        mask = torch.triu(torch.ones(L, L, dtype=torch.bool), 1)
        att = att.masked_fill(mask, float('-inf')).softmax(-1)
        out = (att @ v).transpose(1, 2).reshape(B, L, D)
        return self.o(out)
    def kv_cache_bytes(self, L):  # K and V for every position
        return 2 * L * self.nh * self.hd * BYTES

class Block(nn.Module):
    def __init__(self, d, nh, kind):
        super().__init__()
        self.mix = LinearAttn(d, nh) if kind == "linear" else FullAttn(d, nh)
        self.kind = kind
        self.n1 = nn.LayerNorm(d); self.n2 = nn.LayerNorm(d)
        self.ff = nn.Sequential(nn.Linear(d, 2*d), nn.GELU(), nn.Linear(2*d, d))
    def forward(self, x):
        x = x + self.mix(self.n1(x)); x = x + self.ff(self.n2(x)); return x

class TinyLM(nn.Module):
    def __init__(self, layer_kinds, d=96, nh=4, ctx=520):
        super().__init__()
        self.emb = nn.Embedding(VOCAB, d); self.pos = nn.Embedding(ctx, d)
        self.blocks = nn.ModuleList([Block(d, nh, k) for k in layer_kinds])
        self.nf = nn.LayerNorm(d); self.head = nn.Linear(d, VOCAB)
        self.kinds = layer_kinds
    def forward(self, x):
        B, L = x.shape
        h = self.emb(x) + self.pos(torch.arange(L))
        for b in self.blocks: h = b(h)
        return self.head(self.nf(h))
    def kv_cache_bytes(self, L):
        return sum(b.mix.kv_cache_bytes(L) for b in self.blocks)

def n_params(m): return sum(p.numel() for p in m.parameters())

# ---------------- train / eval ----------------
def train(model, steps, bsz, max_pairs, lr, gen, log_every=400, warmup=100):
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    def lr_at(s):  # linear warmup then cosine decay
        if s < warmup: return lr * (s + 1) / warmup
        p = (s - warmup) / max(1, steps - warmup)
        return 0.1*lr + 0.9*lr * 0.5*(1 + math.cos(math.pi * p))
    model.train()
    for s in range(steps):
        for g in opt.param_groups: g["lr"] = lr_at(s)
        # variable-length training (MQAR protocol): sample #pairs each step so the
        # model learns position-robust recall instead of one fixed length.
        n_pairs = int(gen.integers(4, max_pairs + 1))
        x, y = make_batch(bsz, n_pairs, gen)
        logits = model(x)
        loss = F.cross_entropy(logits.view(-1, VOCAB), y.view(-1), ignore_index=-100)
        opt.zero_grad(); loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0); opt.step()
        if (s+1) % log_every == 0:
            print(f"    step {s+1}/{steps} loss {loss.item():.4f}", flush=True)

@torch.no_grad()
def eval_recall(model, n_pairs, gen, n_batches=20, bsz=64):
    model.eval(); correct = total = 0
    for _ in range(n_batches):
        x, y = make_batch(bsz, n_pairs, gen)
        pred = model(x).argmax(-1)
        m = y != -100
        correct += (pred[m] == y[m]).sum().item(); total += m.sum().item()
    return correct / total

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", type=int, default=2500)
    ap.add_argument("--bsz", type=int, default=64)
    ap.add_argument("--train_pairs", type=int, default=12)  # MAX train pairs (variable 4..max)
    ap.add_argument("--d", type=int, default=128)
    ap.add_argument("--nh", type=int, default=4)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--out", default="kda_hybrid_results.json")
    args = ap.parse_args()

    configs = {
        "pure_linear": ["linear"]*4,
        "hybrid_3to1": ["linear","linear","linear","full"],  # periodic full at 4th
        "all_full":    ["full"]*4,
    }
    # train on 4..12 pairs; eval AT and BEYOND training length (extrapolation test):
    # 8,12 = in-distribution; 24,48 = extrapolation where fixed-state should break.
    eval_pairs = [8, 12, 24, 48]     # -> seq len 18, 26, 50, 98
    cache_L    = [32, 64, 128, 256, 512]

    results = {"meta": {
        "source_lead": "arXiv 2510.26692 Kimi Linear (KDA 3:1 hybrid) — UNVERIFIED reproduction; toy scale",
        "honest_boundary": "Toy ~1e6 params, ctx<=258. Tests RATIO DIRECTION only, NOT Moonshot's 75%/6.3x @1M/5.7T.",
        "device": DEV, "dtype": "fp32", "torch": torch.__version__,
        "args": vars(args), "seed": 0,
        "kda_standin": "vectorized linear attn (elu+1, cumsum); fixed-state only, NOT DPLR/gated-delta",
    }, "configs": {}}

    t0 = time.time()
    for name, kinds in configs.items():
        print(f"[{name}] {kinds}", flush=True)
        gen = np.random.default_rng(0)                 # identical data stream per config
        torch.manual_seed(0)                           # identical init RNG per config
        model = TinyLM(kinds, d=args.d, nh=args.nh)
        npar = n_params(model)
        train(model, args.steps, args.bsz, args.train_pairs, args.lr, gen)
        recall = {str(p): round(eval_recall(model, p, np.random.default_rng(1234)), 4)
                  for p in eval_pairs}
        cache = {str(L): model.kv_cache_bytes(L) for L in cache_L}
        results["configs"][name] = {
            "layers": kinds, "n_params": npar, "recall_by_pairs": recall,
            "kv_cache_bytes_by_L": cache,
        }
        print(f"    params={npar:,}  recall={recall}", flush=True)

    # ---- derived comparisons (H1 memory, H2 quality) ----
    full = results["configs"]["all_full"]
    hyb  = results["configs"]["hybrid_3to1"]
    pure = results["configs"]["pure_linear"]
    mem_red = {L: round(100*(1 - hyb["kv_cache_bytes_by_L"][L]/full["kv_cache_bytes_by_L"][L]), 1)
               for L in hyb["kv_cache_bytes_by_L"]}
    longest = str(max(eval_pairs))
    r_full, r_hyb, r_pure = (full["recall_by_pairs"][longest],
                             hyb["recall_by_pairs"][longest],
                             pure["recall_by_pairs"][longest])
    # fraction of the pure->full recall gap that the hybrid recovers, at longest ctx
    gap = r_full - r_pure
    recovered = (r_hyb - r_pure)/gap if gap > 1e-6 else float('nan')
    param_spread = round(100*(max(c["n_params"] for c in results["configs"].values())
                              / min(c["n_params"] for c in results["configs"].values()) - 1), 2)

    # directional verdict — ALL must hold at the longest eval ctx:
    #  (i) memory: hybrid cuts KV cache >=40% vs full at L=512 (arithmetic, H1)
    #  (ii) a REAL learned gap exists: full clearly beats pure-linear (>=0.15 abs) AND
    #       full actually learned the task (>=0.5) — otherwise recall is uninformative
    #  (iii) hybrid recovers most of that gap (>=0.5) OR nearly matches full (within 0.05)
    learned = r_full >= 0.5
    real_gap = (r_full - r_pure) >= 0.15
    mem_ok  = mem_red[str(max(cache_L))] >= 40
    quality_ok = (recovered is not None and not math.isnan(recovered) and recovered >= 0.5) \
                 or (r_hyb >= r_full - 0.05)
    ratio_helps = bool(mem_ok and learned and real_gap and quality_ok)
    if not learned:
        verdict_note = ("INCONCLUSIVE on quality: full-attention did not learn the recall task "
                        "at this budget (r_full<0.5), so the linear-vs-full gap is uninformative. "
                        "Memory saving (H1) holds by construction; H2 needs more steps.")
    elif not real_gap:
        verdict_note = ("NO SEPARATION: pure-linear kept recall as well as full at this ctx, so "
                        "there is no gap for the hybrid to recover — the full layer is not needed "
                        "at this toy ctx (consistent with scale-gating of the benefit).")
    results["analysis"] = {
        "kv_cache_reduction_pct_hybrid_vs_full_by_L": mem_red,
        "recall_at_longest_ctx": {"pure_linear": r_pure, "hybrid_3to1": r_hyb, "all_full": r_full},
        "recall_gap_fraction_recovered_by_hybrid": None if math.isnan(recovered) else round(recovered, 3),
        "param_spread_pct_across_configs": param_spread,
        "ratio_helps_at_toy_scale": ratio_helps,
        "learned_task": learned, "real_pure_vs_full_gap": real_gap,
        "verdict": (
            "DIRECTIONAL BENEFIT PRESENT at toy scale: 3:1 hybrid cut KV-cache vs full "
            "and recovered most of the pure->full recall gap." if ratio_helps else
            (locals().get("verdict_note") or
             "SCALE-GATED / INCONCLUSIVE at toy scale: memory saving holds but hybrid did not "
             "clearly recover a recall gap. Mechanism may only pay off at long ctx / larger model.")),
        "elapsed_sec": round(time.time()-t0, 1),
    }
    with open(args.out, "w") as f: json.dump(results, f, indent=2)
    print("\n=== ANALYSIS ==="); print(json.dumps(results["analysis"], indent=2))
    print(f"\nwrote {args.out}")

if __name__ == "__main__":
    main()
