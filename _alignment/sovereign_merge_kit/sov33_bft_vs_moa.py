#!/usr/bin/env python3
"""sov33_bft_vs_moa.py — the PUBLISHABLE experiment: does a care-gated BFT aggregator beat a vanilla
Mixture-of-Agents (MoA) aggregator when some proposers turn adversarial?

Mixture-of-Agents (Wang et al., ICLR 2025) fuses N proposer models by feeding ALL their answers to one
aggregator that synthesizes a single reply — its defining property is that it TRUSTS EVERY PROPOSER (no
Byzantine down-weighting). We model that as trust-all fusion (the mean). Our care-gated BFT aggregator instead
weights each proposer by how much it AGREES with the robust consensus, and drops low-trust voters.

Claim under test: as the fraction of adversarial proposers rises, the MoA-style trust-all aggregator degrades
sharply while care-gated BFT stays near-flat. Reproducible, seeded, numpy-only, no GPU.

HONEST SCOPE: controlled numeric-answer ensemble (each proposer emits a vector estimate; error = MSE to truth),
NOT full-LLM MoA. It isolates the aggregation rule — the one variable that differs — which is the honest way to
show the mechanism. Real-LLM MoA-vs-BFT on text is the stated next step, not claimed here.
"""
import json, os, sys, hashlib
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from sov33_ed25519_sigil import Ed25519Sigil
    HAVE_SIG = True
except Exception:
    HAVE_SIG = False

DIM, N_PROP, TRIALS = 24, 9, 40          # 9 proposers, averaged over 40 random tasks

def truth(rng):
    return rng.normal(0, 1, DIM)

def honest_estimate(t, rng):
    return t + rng.normal(0, 0.30, DIM)   # unbiased, small noise

def adversarial_estimate(t, rng, kind):
    if kind == 0: return t + rng.normal(0, 3.0, DIM)     # loud noise
    if kind == 1: return -3.0 * t                        # sign-flip / inversion
    return np.full(DIM, rng.normal(0, 5))                # constant garbage injection

def moa_trustall(P):                      # vanilla MoA: fuse all equally
    return P.mean(0)

def median_vote(P):
    return np.median(P, 0)

def care_bft(P):                          # ours: trust ∝ agreement w/ robust consensus, drop low-trust
    med = np.median(P, 0)
    div = np.mean((P - med[None]) ** 2, axis=(1,))       # per-proposer divergence from consensus
    trust = 1.0 / (1.0 + div)
    keep = trust >= (np.median(trust) * 0.5)             # care-gate: drop the clearly-divergent
    surv = P[keep]
    if len(surv) < max(1, int(0.4 * len(P))): return med  # fail-safe to median if too few survive
    w = trust[keep] / trust[keep].sum()
    return (surv * w[:, None]).sum(0)                     # trust-weighted fuse

def run():
    board = {"moa_trustall": [], "median": [], "care_bft": []}
    Ks = list(range(0, N_PROP // 2 + 1))                 # 0..4 adversarial of 9
    for K in Ks:
        errs = {k: [] for k in board}
        for trial in range(TRIALS):
            rng = np.random.default_rng(1000 + trial)
            t = truth(rng)
            P = np.stack([honest_estimate(t, rng) for _ in range(N_PROP)])
            for j in range(K):
                P[j] = adversarial_estimate(t, rng, j % 3)
            errs["moa_trustall"].append(float(np.mean((moa_trustall(P) - t) ** 2)))
            errs["median"].append(float(np.mean((median_vote(P) - t) ** 2)))
            errs["care_bft"].append(float(np.mean((care_bft(P) - t) ** 2)))
        for k in board: board[k].append(round(float(np.mean(errs[k])), 4))
    return Ks, board

def main():
    Ks, board = run()
    base = {k: board[k][0] for k in board}
    degrade = {k: round(board[k][-1] / board[k][0], 2) for k in board}
    print("=== SOV33 — care-gated BFT vs vanilla MoA aggregator under adversarial proposers ===")
    print(f"{N_PROP} proposers · {TRIALS} trials/point · error = MSE to ground truth (lower=better)\n")
    print(f"{'adversarial (of 9)':>20} | {'MoA trust-all':>13} | {'median':>8} | {'care-BFT (ours)':>15}")
    for i, K in enumerate(Ks):
        print(f"{K:>20} | {board['moa_trustall'][i]:>13.4f} | {board['median'][i]:>8.4f} | {board['care_bft'][i]:>15.4f}")
    print(f"\n  degradation (worst/clean):  MoA {degrade['moa_trustall']}x  ·  median {degrade['median']}x  ·  care-BFT {degrade['care_bft']}x")
    headline = (f"At {Ks[-1]}/{N_PROP} adversarial proposers, the vanilla-MoA trust-all aggregator degrades "
                f"{degrade['moa_trustall']}x while care-gated BFT holds at {degrade['care_bft']}x.")
    print(f"\n  🜏 HEADLINE: {headline}")

    out = {"proposers": N_PROP, "trials_per_point": TRIALS, "adversarial_counts": Ks, "board": board,
           "degradation_x": degrade, "headline": headline,
           "moa_ref": "Wang et al., Mixture-of-Agents, ICLR 2025 (arXiv 2406.04692) — models MoA aggregator as trust-all fusion",
           "honest_scope": "controlled numeric-answer ensemble isolating the aggregation rule; not full-LLM MoA on text (stated next step).",
           "claim": "A care-gated BFT aggregator is Byzantine-robust where vanilla MoA is not — the defensible differentiator over the MoA paper."}
    if HAVE_SIG:
        s = Ed25519Sigil(); rec = s.sign(out)
        out["sigil_pubkey"] = s.pub_hex(); out["sigil"] = rec["ed25519"][:32]; out["sigil_verifies"] = s.verify(rec)
        print(f"  ✍ result signed (Ed25519) — verifies={out['sigil_verifies']}")
    os.makedirs("benchmarks", exist_ok=True)
    json.dump(out, open("benchmarks/bft_vs_moa_2026-07-14.json", "w"), indent=2)
    print("\n✅ result → benchmarks/bft_vs_moa_2026-07-14.json")

if __name__ == "__main__":
    main()
