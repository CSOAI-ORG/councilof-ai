#!/usr/bin/env python3
"""sov4_swarm_build_loop.py — the SOV4 swarm build/rank loop (PLANNER/ranker, NOT a trainer).

WHAT THIS OPERATIONALISES (a REAL measured finding, not a new capability)
------------------------------------------------------------------------
This session measured an N-into-1 TIES merge of 6 Qwen2.5-0.5B sector adapters on a
33-prompt in-house battery (artifact multi_merge_eval_result.json / 7b12cf12):

    N=2  acc 0.667  harm_recall 0.333
    N=3  acc 0.576  harm_recall 0.200
    N=4  acc 0.939  harm_recall 1.000
    N=6  acc 0.909  harm_recall 0.867

The HONEST reading: this is NOT "more members = better". The curve is NON-MONOTONIC
(N=4 > N=6), so composition is dominated by *WHICH* members are in the mix, NOT by
*HOW MANY*. The right *DIFFERENT* member covers the weak axis; piling on same-blood
members does not. And harm_recall rests on n=15 harm prompts, so any single-config delta
is HIGH-VARIANCE — directional, not precise.

CAUSAL DRIVER IS NOT MEASURED (an ablation is owed). The eval file records ONLY per-N
accuracy/harm-recall — it carries NO per-adapter identity and NO leave-one-out ablation.
Therefore *why* N=4 jumps is UNKNOWN from this data. A common HYPOTHESIS is "the N=4 mix
happens to include an adapter (e.g. the 'intuition' sector) that carries harm-recall
coverage" — but that is a HYPOTHESIS ONLY, needing a leave-one-out ablation to establish.
It must never be written as an established cause. What IS measured: N=4 scored higher
(acc 0.939 / harm_recall 1.000) than N=6 (acc 0.909 / harm_recall 0.867). The pick is
justified by that MEASURED score, not by any claim about which adapter caused it.

THE HONEST RULE (what this loop is and is not licensed to claim)
---------------------------------------------------------------
LICENSED (REAL):
  * Throughput win = parallel candidate builds + same-day measured ranking. Fanning the
    candidate manifest out to the swarm/Modal turns a years-long serial search into a
    days-long parallel one. Real, and it is a SCHEDULING win, not a model-quality win.
  * Quality win = seating the right DIFFERENT member to cover the gap (decorrelation).
    Different blood (different base and/or different data-diet) is what buys real
    coverage of a weak axis. Real, and it is a CURATION win.

NOT LICENSED (never claim):
  * merge-COUNT as a quality lever ("crank N and it gets better") — the data says curate,
    not crank.
  * a swarm-of-many that AUTO-IMPROVES one hard task without measurement/human gate.
  * treating any single accuracy/recall number as STABLE — n<30 axes are high-variance.

This module is a PLANNER and RANKER. It never trains, never merges weights, never adopts.
Every selection is PROPOSE-ONLY and carries requires_human_gate=True. Each decision is
emitted as a signed decision record (real Ed25519 via sov33_ed25519_sigil if importable,
else a sha256 stamp) so the proposal is attributable and tamper-evident.
"""
import json
import hashlib
import time

# ---- variance floor: axes measured on fewer than this many items are directional only ----
HIGH_VARIANCE_N = 30

# ---- signer: prefer the real asymmetric SIGIL; degrade honestly to a sha256 stamp ----
try:
    from sov33_ed25519_sigil import Ed25519Sigil
    _HAVE_SIGIL = True
except Exception:
    _HAVE_SIGIL = False


def _sign_record(payload):
    """Return (signed_record, signer_kind). Real Ed25519 if available, else sha256 stamp.

    Never fabricates authenticity: if the asymmetric signer is unavailable we say so
    explicitly via signer_kind='sha256-stamp' rather than pretending it was signed.
    """
    if _HAVE_SIGIL:
        try:
            s = Ed25519Sigil()
            rec = s.sign(payload)
            rec["signer_kind"] = "ed25519"
            rec["pubkey"] = s.pub_hex()
            return rec, "ed25519"
        except Exception:
            pass
    stamp = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    return {"payload": payload, "own_hash": stamp, "signer_kind": "sha256-stamp"}, "sha256-stamp"


class SwarmBuildLoop:
    """PLANNER/ranker for the SOV4 swarm. Proposes candidate builds and ranks measured
    results to curate the right DIFFERENT member. Does NOT train, merge, or adopt weights.
    """

    # axes we know how to read out of a per-adapter/per-N eval result, and whether
    # lower or higher is the weakness direction. All are "higher is better".
    AXES = ("acc", "harm_recall")

    def __init__(self, high_variance_n=HIGH_VARIANCE_N):
        self.high_variance_n = high_variance_n

    # -- (1) --------------------------------------------------------------------------
    def identify_weak_axis(self, eval_result):
        """Read a per-adapter/per-N eval result dict, return the weakest axis + current best member.

        eval_result is expected to carry a mapping of member-key -> metrics, under either
        'per_n' (N-into-1 merges keyed by member count) or 'per_adapter'. Each metrics dict
        holds axis scores (acc, harm_recall) and optionally a count field (harm_total, n) so
        we can flag high-variance axes.

        Returns dict: {weak_axis, weak_axis_score, weak_member, best_member (per weak axis),
                       high_variance (bool), n_for_axis}.
        """
        members = self._members(eval_result)
        if not members:
            raise ValueError("eval_result has no 'per_n' or 'per_adapter' member map")

        # For each axis, find the WORST score across members — that is the estate's weak spot.
        # We report the axis whose worst-case is lowest (the axis most in need of coverage),
        # and, for that axis, which member currently scores best (the one to keep) and which
        # scores worst (the current liability).
        worst_by_axis = {}
        for axis in self.AXES:
            scored = [(k, m.get(axis)) for k, m in members.items() if m.get(axis) is not None]
            if not scored:
                continue
            worst_key, worst_val = min(scored, key=lambda kv: kv[1])
            best_key, best_val = max(scored, key=lambda kv: kv[1])
            worst_by_axis[axis] = {
                "worst_member": worst_key, "worst_score": worst_val,
                "best_member": best_key, "best_score": best_val,
            }

        # the weak axis = the axis with the lowest worst-case score
        weak_axis = min(worst_by_axis, key=lambda a: worst_by_axis[a]["worst_score"])
        info = worst_by_axis[weak_axis]
        n_for_axis = self._axis_n(members, weak_axis)
        return {
            "weak_axis": weak_axis,
            "weak_axis_score": info["worst_score"],
            "weak_member": info["worst_member"],
            "best_member": info["best_member"],
            "best_score": info["best_score"],
            "high_variance": (n_for_axis is not None and n_for_axis < self.high_variance_n),
            "n_for_axis": n_for_axis,
        }

    # -- (2) --------------------------------------------------------------------------
    def plan_candidate_builds(self, weak_axis, clans):
        """Given the weak axis and a list of candidate CLANS, emit a fan-out manifest of
        candidate adapter-builds to train. Does NOT train — emits the manifest only.

        clans: list of dicts, each {base, data_diet, lineage_id}. To cover a weak axis with
        real (decorrelated) signal, candidates must vary BLOOD — different base AND/OR
        different data_diet. The manifest tags each candidate with its lineage so the swarm
        executor (Modal/swarm) can run them in parallel and rho_guard can later refuse
        correlated ones.

        Returns dict: {weak_axis, n_candidates, decorrelated (bool), manifest: [...]}.
        """
        manifest = []
        for i, clan in enumerate(clans):
            base = clan.get("base")
            diet = clan.get("data_diet")
            lineage = clan.get("lineage_id")
            manifest.append({
                "candidate_id": f"cand_{i:03d}",
                "target_axis": weak_axis,
                "base": base,
                "data_diet": diet,
                "lineage_id": lineage,
                # blood signature = what makes this candidate independent coverage
                "blood_sig": self._blood_sig(base, diet),
                "action": "TRAIN_ADAPTER",   # instruction to the swarm executor, not executed here
                "status": "PROPOSED",
            })
        blood_sigs = {c["blood_sig"] for c in manifest}
        return {
            "weak_axis": weak_axis,
            "n_candidates": len(manifest),
            "decorrelated": len(blood_sigs) > 1,   # >1 distinct blood = candidates vary
            "manifest": manifest,
        }

    # -- (3) --------------------------------------------------------------------------
    def rank_by_coverage(self, candidate_eval_results, weak_axis):
        """Rank candidate eval results by how much each COVERS the weak axis.

        candidate_eval_results: list of dicts, each carrying at least the weak_axis score
        and (optionally) a count field so we can flag high-variance. Higher axis score =
        more coverage. Flags HIGH-VARIANCE when the measured n for the axis is < threshold
        (directional only — do NOT read the ordering as precise).

        Returns list of dicts (ranked best-first): {candidate_id, coverage, lineage_id,
        high_variance, rank}.
        """
        rows = []
        for c in candidate_eval_results:
            coverage = c.get(weak_axis)
            n = c.get("harm_total") if weak_axis == "harm_recall" else c.get("n")
            rows.append({
                "candidate_id": c.get("candidate_id") or c.get("member") or c.get("id"),
                "coverage": coverage,
                "lineage_id": c.get("lineage_id"),
                "n_for_axis": n,
                "high_variance": (n is not None and n < self.high_variance_n),
            })
        rows.sort(key=lambda r: (r["coverage"] is not None, r["coverage"] or -1), reverse=True)
        for i, r in enumerate(rows):
            r["rank"] = i
        return rows

    # -- (4) --------------------------------------------------------------------------
    def select_merge_member(self, ranked):
        """Pick the measured-best member to merge — CURATE the right DIFFERENT member,
        do NOT crank N. PROPOSE-ONLY: requires_human_gate=True, never adopts weights.

        `ranked` may be the output of rank_by_coverage OR identify_weak_axis (from which we
        take best_member). Returns a signed decision record.
        """
        if isinstance(ranked, dict) and "best_member" in ranked:
            # came from identify_weak_axis: the best member on the weak axis is the pick
            member = ranked["best_member"]
            coverage = ranked.get("best_score")
            weak_axis = ranked.get("weak_axis")
            high_var = ranked.get("high_variance", False)
        elif isinstance(ranked, list) and ranked:
            member = ranked[0]["candidate_id"]
            coverage = ranked[0]["coverage"]
            weak_axis = None
            high_var = ranked[0].get("high_variance", False)
        else:
            raise ValueError("select_merge_member needs a ranked list or an identify_weak_axis dict")

        rationale = (
            f"Seat member '{member}' because it MEASURED best on the weak axis"
            f"{f' ({weak_axis})' if weak_axis else ''} (coverage={coverage}). "
            "This is a WHICH-member decision (curate the right DIFFERENT blood to cover the "
            "gap), NOT a HOW-MANY decision — merge count is not the quality lever. "
            + ("Coverage is HIGH-VARIANCE (n<30): directional only, confirm before adopting. "
               if high_var else "")
            + "PROPOSE-ONLY: weights are never auto-adopted; a human gate must approve the merge."
        )
        decision = {
            "kind": "MERGE_MEMBER_PROPOSAL",
            "member": member,
            "coverage": coverage,
            "weak_axis": weak_axis,
            "high_variance": high_var,
            "rationale": rationale,
            "requires_human_gate": True,
            "ts": time.time(),
        }
        signed, signer_kind = _sign_record(decision)
        return {
            "member": member,
            "rationale": rationale,
            "requires_human_gate": True,
            "high_variance": high_var,
            "signer_kind": signer_kind,
            "decision_record": signed,
        }

    # -- (5) --------------------------------------------------------------------------
    def rho_guard(self, candidate_lineages):
        """Refuse to seat same-lineage (same-blood) candidates as INDEPENDENT coverage.

        candidate_lineages: list of lineage identifiers (strings) OR candidate dicts carrying
        'lineage_id'/'blood_sig'. If all candidates share one lineage, they are correlated —
        seating them as independent coverage is false decorrelation — so we REFUSE.

        Returns dict: {verdict: 'PASS'|'REFUSE', n_distinct_lineages, reason, requires_human_gate}.
        """
        lineages = []
        for c in candidate_lineages:
            if isinstance(c, dict):
                lineages.append(c.get("blood_sig") or c.get("lineage_id"))
            else:
                lineages.append(c)
        distinct = {l for l in lineages if l is not None}
        n = len(distinct)
        if n <= 1:
            return {
                "verdict": "REFUSE",
                "n_distinct_lineages": n,
                "reason": ("All candidates share one lineage/blood — correlated members give NO "
                           "real coverage of the weak axis. Same-blood is not decorrelation. "
                           "Vary base and/or data_diet before re-proposing."),
                "requires_human_gate": True,
            }
        return {
            "verdict": "PASS",
            "n_distinct_lineages": n,
            "reason": f"{n} distinct lineages/bloods — candidates provide independent coverage.",
            "requires_human_gate": True,
        }

    # ---- helpers --------------------------------------------------------------------
    @staticmethod
    def _members(eval_result):
        """Return the member-key -> metrics map from either 'per_n' or 'per_adapter'."""
        if "per_n" in eval_result and isinstance(eval_result["per_n"], dict):
            return {f"N={k}": v for k, v in eval_result["per_n"].items()}
        if "per_adapter" in eval_result and isinstance(eval_result["per_adapter"], dict):
            return dict(eval_result["per_adapter"])
        return {}

    @staticmethod
    def _axis_n(members, axis):
        """Best-effort count of items the axis was measured on (for the variance flag)."""
        for m in members.values():
            if axis == "harm_recall" and m.get("harm_total") is not None:
                return m["harm_total"]
            if axis == "acc" and m.get("n") is not None:
                return m["n"]
        return None

    @staticmethod
    def _blood_sig(base, diet):
        return hashlib.sha256(f"{base}||{diet}".encode()).hexdigest()[:16]


# ================================ SELF-TEST ================================
def _selftest():
    loop = SwarmBuildLoop()
    # REAL measured input (artifact multi_merge_eval_result.json / 7b12cf12)
    eval_result = {
        "per_n": {
            "2": {"acc": 0.6667, "harm_recall": 0.3333, "harm_caught": 5, "harm_total": 15},
            "3": {"acc": 0.5758, "harm_recall": 0.2000, "harm_caught": 3, "harm_total": 15},
            "4": {"acc": 0.9394, "harm_recall": 1.0000, "harm_caught": 15, "harm_total": 15},
            "6": {"acc": 0.9091, "harm_recall": 0.8667, "harm_caught": 13, "harm_total": 15},
        },
    }
    lines = []
    def emit(s): lines.append(s); print(s)

    emit("=== sov4_swarm_build_loop SELF-TEST (real measured numbers) ===\n")
    emit(f"signer available: {'Ed25519 (real asymmetric)' if _HAVE_SIGIL else 'sha256-stamp (degraded)'}\n")

    # (a) identify_weak_axis -> flags harm_recall, worst at N=3 (0.20), N=2 next (0.333)
    wk = loop.identify_weak_axis(eval_result)
    a_ok = (wk["weak_axis"] == "harm_recall" and wk["weak_member"] in ("N=3", "N=2")
            and wk["high_variance"] is True)
    emit(f"(a) identify_weak_axis -> weak_axis={wk['weak_axis']}  worst_member={wk['weak_member']} "
         f"(score={wk['weak_axis_score']})  best_member={wk['best_member']} (score={wk['best_score']})  "
         f"high_variance={wk['high_variance']} (n={wk['n_for_axis']})")
    emit(f"    [{'PASS' if a_ok else 'FAIL'}] flags harm_recall as weak at low-N (N=2/N=3), high-variance\n")

    # (b) select_merge_member on the real per-N results -> picks N=4 because it has the higher
    #     MEASURED score (acc 0.939 / hr 1.000 > N=6's 0.909 / 0.867), NOT because of any adapter
    #     identity claim. The N=4>N=6 non-monotonicity is the "which-not-how-many" evidence.
    sel = loop.select_merge_member(wk)
    b_ok = (sel["member"] == "N=4"
            and "which" in sel["rationale"].lower()
            and "how-many" in sel["rationale"].lower()
            and "intuition" not in sel["rationale"].lower()   # never name a cause we did not measure
            and sel["requires_human_gate"] is True)
    emit(f"(b) select_merge_member -> member={sel['member']}  requires_human_gate={sel['requires_human_gate']}  "
         f"signer={sel['signer_kind']}")
    emit(f"    rationale: {sel['rationale']}")
    emit(f"    [{'PASS' if b_ok else 'FAIL'}] picks N=4 NOT N=6 on higher MEASURED score "
         f"(non-monotonic N4>N6); rationale is WHICH-not-HOW-MANY (no unmeasured cause named); "
         f"PROPOSE-ONLY human gate\n")

    # (c) rho_guard: 3 same-lineage -> REFUSE ; 3 different-blood -> PASS
    same = [{"lineage_id": "qwen2.5-0.5b/diet-A", "blood_sig": "AAAA"} for _ in range(3)]
    diff = [
        {"lineage_id": "qwen2.5-0.5b/diet-A", "blood_sig": "AAAA"},
        {"lineage_id": "qwen2.5-1.5b/diet-B", "blood_sig": "BBBB"},
        {"lineage_id": "llama3.2-1b/diet-C", "blood_sig": "CCCC"},
    ]
    g_same = loop.rho_guard(same)
    g_diff = loop.rho_guard(diff)
    c_ok = (g_same["verdict"] == "REFUSE" and g_diff["verdict"] == "PASS")
    emit(f"(c) rho_guard(3 same-blood)  -> {g_same['verdict']}  ({g_same['reason']})")
    emit(f"    rho_guard(3 diff-blood)  -> {g_diff['verdict']}  (n_distinct={g_diff['n_distinct_lineages']})")
    emit(f"    [{'PASS' if c_ok else 'FAIL'}] same-blood REFUSED, different-blood PASSED\n")

    # (bonus) plan_candidate_builds sanity: emits a manifest, does NOT train
    plan = loop.plan_candidate_builds(wk["weak_axis"], [
        {"base": "qwen2.5-0.5b", "data_diet": "harm-hard", "lineage_id": "L1"},
        {"base": "qwen2.5-1.5b", "data_diet": "harm-hard", "lineage_id": "L2"},
    ])
    emit(f"(+) plan_candidate_builds -> {plan['n_candidates']} PROPOSED candidate builds, "
         f"decorrelated={plan['decorrelated']} (manifest only, no training)\n")

    all_ok = a_ok and b_ok and c_ok
    emit(f"=== SELF-TEST {'ALL PASS' if all_ok else 'FAILURE'} ===")
    return all_ok, "\n".join(lines)


if __name__ == "__main__":
    ok, _ = _selftest()
    import sys
    sys.exit(0 if ok else 1)
