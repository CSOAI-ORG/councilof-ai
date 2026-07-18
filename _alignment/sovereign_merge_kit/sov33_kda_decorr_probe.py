#!/usr/bin/env python3
"""
sov33_kda_decorr_probe.py  —  KDA-leg DECORRELATION probe (CPU, free, real)

MEOK SOV3 / SOV3-cubed fusion track.

QUESTION (the honest one):
  Our fusion's ONLY proven lever is DECORRELATION — diverse lineages beat
  identical ones; rho (pairwise error-correlation) is the metric; escalate,
  don't average. We already have a TRANSFORMER leg (softmax attention) and an
  SSM leg (diagonal linear recurrence, Mamba/Bamba family). KDA (Kimi Delta
  Attention — gated-delta linear attention, per Kimi Team, "Kimi Linear",
  arXiv 2510.26692, LEAD) is a THIRD architecture family.

  We are NOT asking "is KDA faster" (answered NO at our scale). We ask:
  does a KDA leg DECORRELATE from the transformer and SSM legs — i.e. make
  DIFFERENT mistakes — so it earns a seat as a 3rd proposer?

METHOD:
  Three tiny CPU proposers over the SAME held-out associative-recall task at
  MATCHED param budget. Identical embeddings + output head; ONLY the token-
  mixing family differs:
    (a) TRANSFORMER : causal multi-head softmax attention (exact pairwise).
    (b) SSM         : diagonal gated linear recurrence, elementwise vector
                      state h_t = a(-)h_{t-1} + x_t  (Mamba/Bamba family).
    (c) KDA-style   : gated-DELTA linear attention with a matrix-valued state
                      and delta-rule outer-product updates + channel gate
                      (simplified Gated DeltaNet / KDA mechanism; LEAD =
                      Kimi Linear 2510.26692). NOTE: simplified — no DPLR
                      chunkwise algorithm; shares KDA's fixed-matrix-state +
                      delta-rule + gating properties only.
  Same task, same data stream, same seed/optimizer/steps per leg.

  Then evaluate all three on a large held-out set, take per-example
  correctness, and compute pairwise error-correlation rho (phi coefficient =
  Pearson correlation of binary wrong/right indicators).

VERDICT:
  If rho(KDA, others) is LOWER than rho(T, SSM) -> KDA leg decorrelates from
  the existing pair -> it EARNS a seat as a 3rd proposer.
  If rho is high/similar -> redundant -> honest DROP.
  If accuracies sit near chance or near 1 (no error variance) OR the three
  rho values are within noise of each other -> INCONCLUSIVE at toy scale.

HONESTY: toy scale (~0.5M params, ctx<=~60). Any absolute Kimi numbers
(75% / 6.3x) belong to Moonshot at 1M ctx / 5.7T tokens — NOT ours.
"""
import json, math, time, argparse, os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

torch.set_num_threads(max(1, os.cpu_count() or 1))

# ----------------------------- task -----------------------------------------
class MQAR:
    """Multi-Query Associative Recall (single query per sequence).
    Vocab layout:
      0                          : PAD
      1                          : QUERY marker
      2 .. 1+K                   : K distinct KEY tokens
      2+K .. 1+K+V               : V distinct VALUE tokens
    Sequence: [ (k1,v1),(k2,v2),...,(kp,vp), QUERY, k_probe ] ; supervise the
    single position AFTER k_probe -> predict the value bound to k_probe.
    Target is a value-class index in [0, V).
    """
    def __init__(self, n_keys=32, n_values=8, n_pairs=6, seed=0):
        self.K, self.V, self.P = n_keys, n_values, n_pairs
        self.PAD, self.QUERY = 0, 1
        self.key_base = 2
        self.val_base = 2 + n_keys
        self.vocab = 2 + n_keys + n_values
        self.rng = np.random.default_rng(seed)

    def seq_len(self):
        return 2 * self.P + 2  # p (key,value) pairs + QUERY + probe key

    def batch(self, bsz):
        P, K, V = self.P, self.K, self.V
        L = self.seq_len()
        x = np.full((bsz, L), self.PAD, dtype=np.int64)
        y = np.zeros((bsz,), dtype=np.int64)
        for b in range(bsz):
            keys = self.rng.choice(K, size=P, replace=False)      # distinct keys
            vals = self.rng.integers(0, V, size=P)                # value classes
            pos = 0
            for i in range(P):
                x[b, pos] = self.key_base + keys[i]; pos += 1
                x[b, pos] = self.val_base + vals[i]; pos += 1
            x[b, pos] = self.QUERY; pos += 1
            probe = self.rng.integers(0, P)                       # which pair to query
            x[b, pos] = self.key_base + keys[probe]               # probe key
            y[b] = vals[probe]                                    # answer value class
        return torch.from_numpy(x), torch.from_numpy(y)

# --------------------------- token mixers -----------------------------------
class SoftmaxAttn(nn.Module):
    """(a) TRANSFORMER family: causal multi-head softmax attention."""
    def __init__(self, d, nh, hd):
        super().__init__()
        self.nh, self.hd = nh, hd
        self.qkv = nn.Linear(d, 3 * nh * hd)
        self.o = nn.Linear(nh * hd, d)

    def forward(self, x):
        B, L, _ = x.shape
        qkv = self.qkv(x).view(B, L, 3, self.nh, self.hd).permute(2, 0, 3, 1, 4)
        q, k, v = qkv[0], qkv[1], qkv[2]                          # B,nh,L,hd
        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.hd)
        mask = torch.triu(torch.ones(L, L, device=x.device), 1).bool()
        att = att.masked_fill(mask, float("-inf"))
        att = att.softmax(-1)
        o = att @ v                                              # B,nh,L,hd
        return self.o(o.transpose(1, 2).reshape(B, L, self.nh * self.hd))

class DiagSSM(nn.Module):
    """(b) SSM family: diagonal gated linear recurrence, elementwise VECTOR
    state (Mamba/Bamba-style). h_t = a (-) h_{t-1} + b (-) x_t ; y_t = C h_t.
    Data-independent decay a per (head,channel); no key/value outer product."""
    def __init__(self, d, nh, hd):
        super().__init__()
        self.nh, self.hd = nh, hd
        self.inp = nn.Linear(d, nh * hd)          # x projection
        self.b = nn.Linear(d, nh * hd)            # input gate (data-dependent)
        self.log_neg_a = nn.Parameter(torch.rand(nh * hd) * 0.5 + 0.5)  # decay
        self.o = nn.Linear(nh * hd, d)

    def forward(self, x):
        B, L, _ = x.shape
        u = self.inp(x)                                          # B,L,nh*hd
        g = torch.sigmoid(self.b(x))                             # input gate
        a = torch.sigmoid(self.log_neg_a)                        # decay in (0,1)
        h = torch.zeros(B, u.shape[-1], device=x.device)
        outs = []
        for t in range(L):
            h = a * h + g[:, t] * u[:, t]
            outs.append(h)
        y = torch.stack(outs, dim=1)                             # B,L,nh*hd
        return self.o(y)

class GatedDeltaKDA(nn.Module):
    """(c) KDA-style: gated-DELTA linear attention with matrix-valued state.
    Per head keep S (hd x hd). Delta rule w/ channel gate (Gated DeltaNet):
        S_t = diag(alpha_t) S_{t-1} + beta_t (v_t - S_{t-1} k_t) k_t^T
        o_t = S_t q_t
    alpha_t = channel-wise gate in (0,1); beta_t = per-step write strength.
    Simplified vs Kimi KDA (no DPLR chunkwise kernel); shares fixed-matrix-
    state + delta-rule + gating. LEAD: Kimi Linear 2510.26692."""
    def __init__(self, d, nh, hd):
        super().__init__()
        self.nh, self.hd = nh, hd
        self.q = nn.Linear(d, nh * hd)
        self.k = nn.Linear(d, nh * hd)
        self.v = nn.Linear(d, nh * hd)
        self.alpha = nn.Linear(d, nh * hd)   # channel-wise decay gate
        self.beta = nn.Linear(d, nh)         # per-head write strength
        self.o = nn.Linear(nh * hd, d)

    def forward(self, x):
        B, L, _ = x.shape
        nh, hd = self.nh, self.hd
        q = self.q(x).view(B, L, nh, hd)
        k = self.k(x).view(B, L, nh, hd)
        k = F.normalize(k, dim=-1)                               # stabilize delta rule
        v = self.v(x).view(B, L, nh, hd)
        alpha = torch.sigmoid(self.alpha(x)).view(B, L, nh, hd)  # channel gate
        beta = torch.sigmoid(self.beta(x)).view(B, L, nh, 1)     # write strength
        S = torch.zeros(B, nh, hd, hd, device=x.device)          # matrix state
        outs = []
        for t in range(L):
            kt = k[:, t]                                         # B,nh,hd
            vt = v[:, t]
            at = alpha[:, t]                                     # B,nh,hd
            bt = beta[:, t]                                      # B,nh,1
            # decay state channel-wise (diag(alpha) applied on state rows)
            S = S * at.unsqueeze(-1)
            # predicted value from current state: S k
            pred = torch.einsum("bnij,bnj->bni", S, kt)          # B,nh,hd
            delta = (vt - pred) * bt                             # delta correction
            S = S + torch.einsum("bni,bnj->bnij", delta, kt)     # outer-product write
            qt = q[:, t]
            ot = torch.einsum("bnij,bnj->bni", S, qt)            # B,nh,hd
            outs.append(ot.reshape(B, nh * hd))
        y = torch.stack(outs, dim=1)
        return self.o(y)

# ------------------------------ model ---------------------------------------
class Proposer(nn.Module):
    """Shared skeleton; only `mixer_cls` differs across legs."""
    def __init__(self, vocab, d, nh, hd, n_layers, mixer_cls, max_len=64):
        super().__init__()
        self.emb = nn.Embedding(vocab, d)
        self.pos = nn.Embedding(max_len, d)
        self.layers = nn.ModuleList()
        self.norms = nn.ModuleList()
        self.mlps = nn.ModuleList()
        self.mlp_norms = nn.ModuleList()
        for _ in range(n_layers):
            self.norms.append(nn.LayerNorm(d))
            self.layers.append(mixer_cls(d, nh, hd))
            self.mlp_norms.append(nn.LayerNorm(d))
            self.mlps.append(nn.Sequential(nn.Linear(d, 2 * d), nn.GELU(), nn.Linear(2 * d, d)))
        self.norm_f = nn.LayerNorm(d)
        self.head = nn.Linear(d, vocab)

    def forward(self, x):
        B, L = x.shape
        pos = torch.arange(L, device=x.device).unsqueeze(0)
        h = self.emb(x) + self.pos(pos)
        for norm, mix, mn, mlp in zip(self.norms, self.layers, self.mlp_norms, self.mlps):
            h = h + mix(norm(h))
            h = h + mlp(mn(h))
        h = self.norm_f(h)
        return self.head(h)                                     # B,L,vocab

def n_params(m):
    return sum(p.numel() for p in m.parameters())

# ------------------------------ train/eval ----------------------------------
def train_leg(name, mixer_cls, task_cfg, d, nh, hd, n_layers, steps, bsz, lr, seed, val_base, log):
    torch.manual_seed(seed); np.random.seed(seed)
    task = MQAR(seed=seed, **task_cfg)
    model = Proposer(task.vocab, d, nh, hd, n_layers, mixer_cls, max_len=task.seq_len() + 2)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=steps)
    warmup = max(1, steps // 20)
    model.train()
    t0 = time.time()
    last = 0.0
    for step in range(steps):
        x, y = task.batch(bsz)
        logits = model(x)[:, -1, :]                              # answer at last pos
        # target is a value class -> map to vocab id of that value token
        tgt = y + val_base
        loss = F.cross_entropy(logits, tgt)
        opt.zero_grad(); loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        if step < warmup:
            for g in opt.param_groups:
                g["lr"] = lr * (step + 1) / warmup
        opt.step()
        if step >= warmup:
            sched.step()
        last = loss.item()
        if step % max(1, steps // 5) == 0 or step == steps - 1:
            log.append(f"  [{name}] step {step:4d}/{steps} loss {last:.4f}")
    dt = time.time() - t0
    return model, last, dt

def eval_leg(model, task, n_eval, val_base, bsz=256):
    model.eval()
    correct = []
    with torch.no_grad():
        done = 0
        while done < n_eval:
            b = min(bsz, n_eval - done)
            x, y = task.batch(b)
            logits = model(x)[:, -1, :]
            pred = logits.argmax(-1)                             # vocab id
            pred_cls = pred - val_base                           # back to value class
            correct.append((pred_cls == y).numpy().astype(np.int8))
            done += b
    return np.concatenate(correct)                              # 1=correct,0=wrong

def phi_corr(err_a, err_b):
    """Pearson correlation of binary ERROR indicators (1=wrong). phi coeff.
    Returns nan if either has zero variance."""
    a = err_a.astype(np.float64); b = err_b.astype(np.float64)
    if a.std() < 1e-12 or b.std() < 1e-12:
        return float("nan")
    return float(np.corrcoef(a, b)[0, 1])

# ------------------------------ main ----------------------------------------
def run_once(args, seed, log):
    """Train all three legs at matched budget on one seed; return per-leg error
    vectors on a SHARED held-out set + accuracies + param counts."""
    task_cfg = dict(n_keys=args.n_keys, n_values=args.n_values, n_pairs=args.n_pairs)
    ref_task = MQAR(seed=seed, **task_cfg)
    val_base = ref_task.val_base
    max_len = ref_task.seq_len() + 2
    legs = [("transformer", SoftmaxAttn), ("ssm", DiagSSM), ("kda", GatedDeltaKDA)]

    # --- MATCH PARAM BUDGET: tune per-leg head_dim so totals agree to <~2% ---
    def build(cls, hd):
        return Proposer(ref_task.vocab, args.d, args.nh, hd, args.layers, cls, max_len=max_len)
    target = n_params(build(SoftmaxAttn, args.hd))
    hd_for = {}
    for name, cls in legs:
        best_hd, best_gap = args.hd, float("inf")
        for hd in range(4, 64):
            gap = abs(n_params(build(cls, hd)) - target)
            if gap < best_gap:
                best_gap, best_hd = gap, hd
        hd_for[name] = best_hd

    models, accs, dts, pcounts, err = {}, {}, {}, {}, {}
    for name, cls in legs:
        m, last, dt = train_leg(name, cls, task_cfg, args.d, args.nh, hd_for[name],
                                args.layers, args.steps, args.bsz, args.lr,
                                seed, val_base, log)
        models[name] = m; dts[name] = dt; pcounts[name] = n_params(m)
        log.append(f"  [seed {seed}][{name}] {dt:.1f}s loss {last:.4f} "
                   f"params {pcounts[name]:,} hd={hd_for[name]}")
    for name, _ in legs:
        eval_task = MQAR(seed=seed + 777, **task_cfg)   # fixed held-out stream, shared across legs
        corr = eval_leg(models[name], eval_task, args.n_eval, val_base)
        accs[name] = float(corr.mean())
        err[name] = 1 - corr
    rho = {
        "rho_T_SSM": phi_corr(err["transformer"], err["ssm"]),
        "rho_T_KDA": phi_corr(err["transformer"], err["kda"]),
        "rho_SSM_KDA": phi_corr(err["ssm"], err["kda"]),
    }
    return dict(hd_for=hd_for, pcounts=pcounts, accs=accs, rho=rho, dts=dts,
                seq_len=ref_task.seq_len())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--steps", type=int, default=1600)
    ap.add_argument("--bsz", type=int, default=64)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--d", type=int, default=96)
    ap.add_argument("--nh", type=int, default=4)
    ap.add_argument("--hd", type=int, default=24)
    ap.add_argument("--layers", type=int, default=3)
    ap.add_argument("--n_pairs", type=int, default=10)
    ap.add_argument("--n_keys", type=int, default=48)
    ap.add_argument("--n_values", type=int, default=8)
    ap.add_argument("--n_eval", type=int, default=2000)
    ap.add_argument("--seeds", type=int, nargs="+", default=[1234])
    ap.add_argument("--out", type=str, default="kda_decorr_results.json")
    args = ap.parse_args()

    chance = 1.0 / args.n_values
    log = []
    runs = []
    for sd in args.seeds:
        log.append(f"[seed {sd}] start")
        runs.append(run_once(args, sd, log))

    # aggregate across seeds
    def agg(key_path):
        vals = []
        for r in runs:
            v = r
            for k in key_path:
                v = v[k]
            if not (isinstance(v, float) and math.isnan(v)):
                vals.append(v)
        return vals

    keys = ["rho_T_SSM", "rho_T_KDA", "rho_SSM_KDA"]
    rho_mean = {k: (float(np.mean(agg(["rho", k]))) if agg(["rho", k]) else float("nan")) for k in keys}
    rho_std = {k: (float(np.std(agg(["rho", k]))) if len(agg(["rho", k])) > 1 else 0.0) for k in keys}
    acc_mean = {n: float(np.mean([r["accs"][n] for r in runs])) for n in ["transformer", "ssm", "kda"]}
    pcounts = runs[0]["pcounts"]
    param_spread = (max(pcounts.values()) - min(pcounts.values())) / min(pcounts.values())
    seq_len = runs[0]["seq_len"]

    rT_SSM, rT_KDA, rSSM_KDA = rho_mean["rho_T_SSM"], rho_mean["rho_T_KDA"], rho_mean["rho_SSM_KDA"]
    min_acc, max_acc = min(acc_mean.values()), max(acc_mean.values())
    nan_present = any(math.isnan(v) for v in rho_mean.values())
    near_chance = max_acc < chance + 0.05
    near_ceiling = min_acc > 0.97

    # noise band: use the largest across-seed std among the three rho estimates
    noise = max(rho_std.values()) if len(args.seeds) > 1 else 0.05
    margin = max(0.05, 2 * noise)   # require KDA rhos to clear rho_T_SSM by 2 sigma (>=0.05)
    kda_rhos = [rT_KDA, rSSM_KDA]

    if nan_present or near_chance or near_ceiling:
        reason = ("a leg saturated (acc>0.97) -> zero error variance"
                  if near_ceiling else
                  "accuracies sit at chance -> no learned signal to correlate"
                  if near_chance else "rho undefined (zero error variance in a leg)")
        verdict = (f"INCONCLUSIVE at toy scale: {reason} "
                   f"(acc {min_acc:.3f}-{max_acc:.3f}, chance {chance:.3f}). "
                   f"Cannot estimate decorrelation reliably.")
        kda_decorrelates = False
    elif max(kda_rhos) < rT_SSM - margin:
        verdict = (f"KDA leg DECORRELATES: both KDA error-correlations "
                   f"(rho(T,KDA)={rT_KDA:.3f}, rho(SSM,KDA)={rSSM_KDA:.3f}) sit below the "
                   f"existing-pair baseline rho(T,SSM)={rT_SSM:.3f} by more than the "
                   f"{margin:.3f} noise margin. It makes different mistakes -> EARNS a seat "
                   f"as a 3rd proposer (decorrelation is our only proven fusion lever).")
        kda_decorrelates = True
    elif rSSM_KDA > rT_SSM + margin and rT_KDA < rT_SSM - margin:
        verdict = (f"PARTIAL/family-aligned: KDA decorrelates from the TRANSFORMER "
                   f"(rho(T,KDA)={rT_KDA:.3f} < rho(T,SSM)={rT_SSM:.3f}) but is TIGHTLY "
                   f"correlated with the SSM leg (rho(SSM,KDA)={rSSM_KDA:.3f}) — same "
                   f"linear-recurrence family. As a 3rd leg alongside the SSM it is largely "
                   f"redundant; it would only add diversity if it REPLACED the SSM leg. "
                   f"Not a clean seat.")
        kda_decorrelates = False
    elif min(kda_rhos) > rT_SSM - margin:
        verdict = (f"KDA leg REDUNDANT: its error-correlations "
                   f"(rho(T,KDA)={rT_KDA:.3f}, rho(SSM,KDA)={rSSM_KDA:.3f}) are within the "
                   f"{margin:.3f} noise band of rho(T,SSM)={rT_SSM:.3f} — not lower. "
                   f"It makes the same mistakes as the existing legs -> honest DROP.")
        kda_decorrelates = False
    else:
        verdict = (f"INCONCLUSIVE / MIXED at toy scale: rho(T,SSM)={rT_SSM:.3f}, "
                   f"rho(T,KDA)={rT_KDA:.3f}, rho(SSM,KDA)={rSSM_KDA:.3f} differ by less than "
                   f"the {margin:.3f} across-seed noise band. No defensible seat/drop call.")
        kda_decorrelates = False

    results = {
        "probe": "sov33_kda_decorr_probe",
        "question": ("Does a KDA-style (gated-delta linear attention) leg DECORRELATE "
                     "from the transformer + SSM legs (make different mistakes) at matched "
                     "param budget on a shared held-out task?"),
        "lead": ("Kimi Linear / Kimi Delta Attention, arXiv 2510.26692 (Kimi Team) — LEAD; "
                 "we implement KDA's mechanism (gated-delta linear attn, matrix state, "
                 "channel gate) in simplified form, NOT the DPLR chunkwise kernel, at toy scale."),
        "honesty": ("RUNNING at toy scale (~0.24M params/leg, ctx=%d). This measures our own "
                    "decorrelation lever; Kimi's 75%%/6.3x figures are THEIR scale (1M ctx, "
                    "5.7T tokens) and are NOT claimed here." % seq_len),
        "legs": {
            "transformer": "causal multi-head softmax attention (exact pairwise mixing)",
            "ssm": "diagonal gated linear recurrence, vector state (Mamba/Bamba family)",
            "kda": "gated-delta linear attention, matrix state + delta-rule + channel gate (KDA-style)",
        },
        "config": {
            "d_model": args.d, "n_heads": args.nh, "head_dim_base": args.hd,
            "head_dim_matched": runs[0]["hd_for"], "n_layers": args.layers,
            "steps": args.steps, "bsz": args.bsz, "lr": args.lr, "seeds": args.seeds,
            "task": {"n_keys": args.n_keys, "n_values": args.n_values, "n_pairs": args.n_pairs,
                     "seq_len": seq_len, "chance": chance, "n_eval": args.n_eval},
        },
        "param_counts": pcounts,
        "param_spread_frac": param_spread,
        "heldout_accuracy_mean": acc_mean,
        "per_seed": [{"seed": sd, "acc": r["accs"], "rho": r["rho"]} for sd, r in zip(args.seeds, runs)],
        "rho_matrix": rho_mean,
        "rho_std_across_seeds": rho_std,
        "noise_margin": margin,
        "metric": ("phi coefficient = Pearson correlation of binary error indicators (1=wrong) "
                   "on a shared held-out set; mean over seeds"),
        # top-level scalars for the output schema
        "rho_T_SSM": rT_SSM,
        "rho_T_KDA": rT_KDA,
        "rho_SSM_KDA": rSSM_KDA,
        "kda_decorrelates": kda_decorrelates,
        "verdict": verdict,
        "train_log": log,
    }
    with open(args.out, "w") as f:
        json.dump(results, f, indent=2)
    print(json.dumps({k: results[k] for k in
                      ["param_counts", "param_spread_frac", "heldout_accuracy_mean",
                       "rho_matrix", "rho_std_across_seeds", "noise_margin",
                       "kda_decorrelates", "verdict"]}, indent=2))

if __name__ == "__main__":
    main()
