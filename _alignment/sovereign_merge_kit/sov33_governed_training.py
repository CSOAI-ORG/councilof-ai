"""sov33_governed_training.py — governed distributed training over pooled/volunteer GPUs.

The idea (DiLoCo/Hivemind-shaped): many cheap, scattered, possibly-untrusted GPUs each run local steps
and submit a gradient/delta each sync round. A robust aggregator combines them; the SOV33 reputation layer
identifies nodes whose gradients keep diverging from the honest quorum (poisoned/random/lazy) and down-weights
then excludes them. This is the piece no training framework ships: Byzantine-robust aggregation + persistent,
un-sheddable reputation keyed by attested node identity.

This is a SIMULATION harness (numpy) to validate the governance mechanism honestly — it is NOT a real
distributed trainer. It plugs onto LineageReputationLedger.observe(weights_digest, agreed_with_quorum).
"""
import numpy as np
import hashlib


def _digest(node_id):
    return hashlib.sha256(f"node::{node_id}".encode()).hexdigest()


# --- Selectable Byzantine-robust aggregators (published FL algorithms, synthesized in) ---
def agg_mean(G):
    return np.mean(G, axis=0)

def agg_median(G):
    """Coordinate-wise median. Breakdown ~50%."""
    return np.median(G, axis=0)

def agg_trimmed(G, beta=0.2):
    """Coordinate-wise trimmed mean: drop the top/bottom beta fraction per coordinate."""
    n = len(G); k = int(np.floor(beta * n))
    Gs = np.sort(G, axis=0)
    return Gs[k:n - k].mean(axis=0) if n - 2 * k > 0 else np.median(G, axis=0)

def agg_geomedian(G, iters=64, eps=1e-8):
    """Geometric median via Weiszfeld (RFA). Higher robustness than coordinate-median in high dim."""
    y = np.mean(G, axis=0)
    for _ in range(iters):
        d = np.linalg.norm(G - y, axis=1) + eps
        w = 1.0 / d
        y_new = (w[:, None] * G).sum(axis=0) / w.sum()
        if np.linalg.norm(y_new - y) < eps:
            break
        y = y_new
    return y

def agg_krum(G, n_byz=1, multi=True):
    """(Multi-)Krum: pick the vector(s) closest to their n-f-2 nearest neighbours. Blank-Rota et al."""
    n = len(G); m = n - n_byz - 2
    if m < 1:
        return np.median(G, axis=0)
    D = np.array([[np.sum((G[i] - G[j]) ** 2) for j in range(n)] for i in range(n)])
    scores = np.array([np.sort(D[i])[1:m + 1].sum() for i in range(n)])
    if multi:
        keep = np.argsort(scores)[:max(1, n - n_byz)]
        return G[keep].mean(axis=0)
    return G[int(np.argmin(scores))]

AGGREGATORS = {"mean": agg_mean, "median": agg_median, "trimmed": agg_trimmed,
               "geomedian": agg_geomedian, "krum": agg_krum}


class GovernedTrainingRound:
    """One DiLoCo-style sync round over N nodes' gradient deltas, with Byzantine-robust aggregation
    and reputation feedback. `trust_weighted=True` weights the aggregate by each node's running trust,
    so a node the ledger already distrusts contributes less even before it's fully excluded."""

    def __init__(self, ledger, mad_k=3.0, min_trust=0.5, rule="median", n_byz=1):
        self.ledger = ledger              # LineageReputationLedger (attested, un-sheddable)
        self.mad_k = mad_k                # a node disagrees if its dist-to-quorum > median + k·MAD (robust outlier)
        self.min_trust = min_trust        # nodes below this are EXCLUDED from the aggregate
        self.rule = rule                  # selectable robust quorum: median|trimmed|geomedian|krum|mean
        self.n_byz = n_byz                # assumed Byzantine count (for krum)

    def aggregate(self, node_grads, trust_weighted=True):
        """node_grads: dict node_id -> gradient vector (np.array). Returns (robust_update, report).
        Robust rule: coordinate-wise MEDIAN over non-excluded nodes = the honest quorum direction.
        Agreement is RELATIVE (robust outlier test on distance-to-quorum), so honest nodes near the
        optimum — where signal/noise is low — are NOT wrongly flagged; only true outliers are."""
        ids = list(node_grads)
        digs = {n: _digest(n) for n in ids}
        # 1. exclude already-distrusted nodes from the quorum entirely
        active = [n for n in ids if self.ledger.trust_of(digs[n]) >= self.min_trust]
        if not active:
            active = ids[:]  # never exclude everyone; fall back to all
        G = np.array([node_grads[n] for n in active])
        # 2. robust quorum via the SELECTED rule (median default; krum/geomedian/trimmed available)
        if self.rule == "krum":
            quorum = agg_krum(G, n_byz=self.n_byz)
        else:
            quorum = AGGREGATORS.get(self.rule, agg_median)(G)
        # 3. robust outlier gate: distance-to-quorum, thresholded at median + k·MAD of the ACTIVE set
        dists_active = np.array([np.linalg.norm(node_grads[n] - quorum) for n in active])
        d_med = np.median(dists_active)
        mad = np.median(np.abs(dists_active - d_med)) + 1e-9
        thresh = d_med + self.mad_k * mad
        # 4. score every node (incl. excluded) vs the threshold, update reputation
        report = {}
        for n in ids:
            d = float(np.linalg.norm(node_grads[n] - quorum))
            agreed = d <= thresh
            t = self.ledger.observe(digs[n], agreed)
            report[n] = {"dist_to_quorum": round(d, 3), "thresh": round(float(thresh), 3), "agreed": agreed,
                         "trust": round(t, 3), "flagged": self.ledger.is_flagged(digs[n]),
                         "in_quorum": n in active}
        # 4. final update = trust-weighted mean over active nodes (or plain median)
        if trust_weighted:
            w = np.array([self.ledger.trust_of(digs[n]) for n in active])
            w = w / (w.sum() + 1e-9)
            update = (w[:, None] * G).sum(axis=0)
        else:
            update = quorum
        return update, report


def run_governed_training(true_grad_fn, honest_nodes, byz_nodes, rounds=40, dim=64,
                          byz_kind="random", seed=0, mad_k=3.0):
    """Simulate `rounds` sync rounds. Honest nodes submit noisy estimates of the true gradient;
    Byzantine nodes submit poisoned gradients. Track how fast reputation isolates the Byzantines
    and whether the governed update still converges. Returns a history dict."""
    from sov33_stateless_mcp import LineageReputationLedger
    rng = np.random.default_rng(seed)
    ledger = LineageReputationLedger(decay=0.85, flag_below=0.5)
    gr = GovernedTrainingRound(ledger, mad_k=mad_k)
    theta = rng.normal(0, 1, dim)            # parameter we're optimizing (governed)
    theta_naive = theta.copy()               # baseline: plain mean, no governance
    hist = {"round": [], "err_governed": [], "err_naive": [],
            "byz_trust": [], "honest_trust": [], "byz_excluded": []}
    for r in range(rounds):
        g_true = true_grad_fn(theta)
        grads = {}
        for n in honest_nodes:
            grads[n] = g_true + rng.normal(0, 0.3, dim)             # honest: true + noise
        for n in byz_nodes:
            if byz_kind == "random":
                grads[n] = rng.normal(0, 3.0, dim)                 # random junk
            elif byz_kind == "reverse":
                grads[n] = -3.0 * g_true + rng.normal(0, 0.3, dim)  # gradient-ascent attack
            elif byz_kind == "collusive":
                grads[n] = np.ones(dim) * 2.0                       # all push same wrong way
        upd, report = gr.aggregate(grads, trust_weighted=True)
        theta = theta - 0.1 * upd
        # naive baseline: plain mean of ALL grads, no reputation
        theta_naive = theta_naive - 0.1 * np.mean(list(grads.values()), axis=0)
        hist["round"].append(r)
        hist["err_governed"].append(float(np.linalg.norm(theta)))    # target optimum = 0
        hist["err_naive"].append(float(np.linalg.norm(theta_naive)))
        hist["byz_trust"].append(float(np.mean([report[n]["trust"] for n in byz_nodes])) if byz_nodes else 1.0)
        hist["honest_trust"].append(float(np.mean([report[n]["trust"] for n in honest_nodes])))
        hist["byz_excluded"].append(int(sum(not report[n]["in_quorum"] for n in byz_nodes)))
    hist["final_report"] = report
    return hist
