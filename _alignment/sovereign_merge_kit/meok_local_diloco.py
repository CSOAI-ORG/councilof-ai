"""meok_local_diloco.py — runnable LOCAL governed-DiLoCo harness (de-risk step 2).

Runs the full DiLoCo shape on ONE machine with N in-process "nodes" (no cluster, no GPU, no download) and the
SOV33 governed aggregator wired into the outer loop. This is the zero-cost proof that the 6-line patch integrates
with a real inner/outer DiLoCo loop before any GPU spend. Pure numpy + the two SOV33 modules.

DiLoCo shape: each node keeps a LOCAL copy of the params, runs H inner SGD steps on its own data shard, then the
outer loop merges the deltas (θ_global − θ_local_i). We REPLACE DiLoCo's plain-mean merge with the governed
aggregate so poisoned nodes are down-weighted and excluded.

Run:  python meok_local_diloco.py            # honest nodes only
      python meok_local_diloco.py --byz 1    # 1 of 4 nodes poisons its gradient
"""
import argparse, os, sys, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # find sibling sov33_*.py from anywhere
from sov33_governed_training import GovernedTrainingRound
from sov33_stateless_mcp import LineageReputationLedger


def make_task(dim, n_per_node, n_nodes, seed=0):
    """A shared linear-regression truth; each node gets its own data shard (non-IID-ish)."""
    rng = np.random.default_rng(seed)
    w_true = rng.normal(0, 1, dim)
    shards = {}
    for i in range(n_nodes):
        X = rng.normal(0, 1, (n_per_node, dim)) + 0.2 * i   # slight shard shift = realistic non-IID
        y = X @ w_true + rng.normal(0, 0.1, n_per_node)
        shards[f"node{i}"] = (X, y)
    return w_true, shards


def local_steps(theta, X, y, H, lr):
    """H inner SGD steps on one node's shard (the DiLoCo inner loop)."""
    th = theta.copy(); n = len(y)
    for _ in range(H):
        g = (X.T @ (X @ th - y)) / n
        th = th - lr * g
    return th


def run(dim=32, n_nodes=4, n_byz=0, rounds=25, H=15, inner_lr=0.02, outer_lr=1.0, seed=0, governed=True):
    w_true, shards = make_task(dim, 200, n_nodes, seed)
    ids = list(shards); byz = set(ids[:n_byz])
    ledger = LineageReputationLedger(decay=0.85, flag_below=0.5)
    gov = GovernedTrainingRound(ledger, mad_k=3.0, min_trust=0.5)
    theta = np.zeros(dim)                       # global params
    rng = np.random.default_rng(seed + 1)
    hist = []
    for r in range(rounds):
        deltas = {}
        for n in ids:
            X, y = shards[n]
            th_local = local_steps(theta, X, y, H, inner_lr)
            delta = theta - th_local            # DiLoCo outer "gradient"
            if n in byz:
                delta = rng.normal(0, 5.0, dim)  # poisoned node: junk delta
            deltas[n] = delta
        if governed:
            upd, report = gov.aggregate(deltas, trust_weighted=True)
        else:
            upd = np.mean(list(deltas.values()), axis=0); report = None   # plain DiLoCo mean
        theta = theta - outer_lr * upd
        err = float(np.linalg.norm(theta - w_true) / np.linalg.norm(w_true))
        hist.append((r, err, report))
    return w_true, theta, hist, byz, ledger


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--byz", type=int, default=0, help="number of Byzantine nodes (of 4)")
    ap.add_argument("--nodes", type=int, default=4)
    ap.add_argument("--rounds", type=int, default=25)
    args = ap.parse_args()
    for gv in ([True, False] if args.byz else [True]):
        w, th, hist, byz, ledger = run(n_nodes=args.nodes, n_byz=args.byz, rounds=args.rounds, governed=gv)
        tag = "GOVERNED" if gv else "plain-DiLoCo-mean"
        print(f"\n=== {tag} | {args.nodes} nodes, {args.byz} Byzantine, {args.rounds} rounds ===")
        for r, err, rep in hist[::5]:
            print(f"  round {r:2d}: rel-err to truth = {err:.4f}")
        print(f"  FINAL rel-err = {hist[-1][1]:.4f}")
        if hist[-1][2] is not None and byz:
            fr = hist[-1][2]
            print(f"  Byzantine flagged: {sum(fr[n]['flagged'] for n in byz)}/{len(byz)}; "
                  f"honest flagged: {sum(fr[n]['flagged'] for n in fr if n not in byz)}/{len(fr)-len(byz)}")
