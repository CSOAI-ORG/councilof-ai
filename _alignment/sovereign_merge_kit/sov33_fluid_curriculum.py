"""sov33_fluid_curriculum.py — the FLUID dataset for the '1' (adversarial self-curriculum).

The 1's training set is NOT random and NOT fixed. It is CONTINUOUSLY REGENERATED from the 3 brains:
run a batch through the 3, harvest the cases where they DISAGREE or the care-gate flags -> those hard
cases are the 1's next training set. As the 3 improve, the disagreements shift, so the dataset is FLUID
(always changing from the 3). This is the honest 'ASI evolve' piece: it targets its own hardest cases,
compounds against the regression suite, human-ratified at adopt. NOT random data, NOT autonomous takeover.

HONEST: this is the MECHANISM (CPU, here). Turning harvested cases into a trained adapter needs a GPU wave.
"""
import os, json, time, hashlib

def _archive():
    import sov33_paths as P
    return P.sov_path("fluid_curriculum.jsonl")

def disagreement(answers):
    """Given N brain answers (strings/labels) to one prompt, is it a HARD case?
    Hard = the brains diverge (not all the same normalized answer). Returns (is_hard, spread)."""
    norm = [str(a).strip().lower()[:200] for a in answers if a is not None]
    if len(norm) < 2:
        return False, 0.0
    uniq = len(set(norm))
    spread = (uniq - 1) / (len(norm) - 1)   # 0 = all agree, 1 = all differ
    return spread > 0.0, round(spread, 3)

def harvest(batch):
    """batch = [{'prompt':..., 'brain_answers':{name:answer,...}, 'care_score':float}, ...]
    Returns the FLUID training set: cases where the 3 disagreed OR care-gate flagged (< floor)."""
    import sov33_care_local as care
    CARE_FLOOR = 0.35
    hard = []
    for item in batch:
        answers = list(item.get("brain_answers", {}).values())
        is_hard, spread = disagreement(answers)
        cs = item.get("care_score")
        if cs is None:
            try: cs, _ = care.score_local(item.get("prompt", ""))
            except Exception: cs = 1.0
        flagged = cs < CARE_FLOOR
        if is_hard or flagged:
            hard.append({
                "prompt": item["prompt"],
                "reason": ("disagreement" if is_hard else "") + ("+care_flag" if flagged else ""),
                "spread": spread, "care_score": round(float(cs), 3),
                "brain_answers": item.get("brain_answers", {}),
                "harvested_ts": time.time(),
            })
    return hard

def refresh(batch, sign=True):
    """Regenerate the fluid dataset from a fresh batch, append to the archive (the 1's next training set)."""
    hard = harvest(batch)
    a = _archive()
    with open(a, "a") as f:
        for h in hard:
            if sign:
                try:
                    import sov33_ed25519_sigil as s
                    r = s.Ed25519Sigil().sign(json.dumps({"p": h["prompt"][:80]}, sort_keys=True))
                    h["sigil"] = r.get("own_hash","")[:16] if isinstance(r, dict) else ""
                except Exception: h["sigil"] = ""
            f.write(json.dumps(h) + "\n")
    return {"batch_size": len(batch), "harvested_hard": len(hard),
            "hard_rate": round(len(hard)/max(len(batch),1), 3),
            "archive": str(a), "note": "fluid: this set changes every cycle as the 3 brains improve"}

def route_to_nns(sign=True):
    """LINK TO THE 7 NNs: route harvested hard cases into per-NN collector files the learning-ledger reads.
    The fluid curriculum's hard cases are exactly the diverse training data the starved NNs need
    (4 of 7 are weak from tiny samples). Care-flagged cases -> care_validation NN; disagreement cases ->
    threat/dependency signal. HONEST: this ACCUMULATES labeled examples (the fuel); it does NOT retrain
    weights here — the learning-ledger's ready-check (>=200, >=50/class, balance<5:1) gates the actual retrain."""
    import sov33_paths as P
    a = _archive()
    if not a.exists(): return {"routed": 0, "note": "no harvested cases yet"}
    rows = [json.loads(l) for l in open(a) if l.strip()]
    routed = {"care_validation": 0, "threat_defense": 0}
    care_fp = open(P.sov_path("nn_care_validation_collect.jsonl"), "a")
    threat_fp = open(P.sov_path("nn_threat_defense_collect.jsonl"), "a")
    for r in rows:
        reason = r.get("reason", "")
        if "care_flag" in reason:
            # care-flagged hard case -> care_validation NN (label: needs_care_review)
            rec = {"text": r["prompt"], "true_label": "care_flag", "care_score": r.get("care_score"),
                   "src": "fluid_curriculum", "ts": r.get("harvested_ts")}
            care_fp.write(json.dumps(rec) + "\n"); routed["care_validation"] += 1
        if "disagreement" in reason:
            # brains-disagreed hard case -> threat/defense signal (label: contested, needs adjudication)
            rec = {"text": r["prompt"], "true_label": "contested", "spread": r.get("spread"),
                   "src": "fluid_curriculum", "ts": r.get("harvested_ts")}
            threat_fp.write(json.dumps(rec) + "\n"); routed["threat_defense"] += 1
    care_fp.close(); threat_fp.close()
    return {"routed": routed, "total": sum(routed.values()),
            "note": "harvested hard cases fed to NN collectors; learning-ledger gates the actual retrain"}

def status():
    a = _archive()
    if not a.exists(): return {"total_harvested": 0, "note": "no cycles run yet"}
    rows = [json.loads(l) for l in open(a) if l.strip()]
    reasons = {}
    for r in rows: reasons[r.get("reason","?")] = reasons.get(r.get("reason","?"),0)+1
    return {"total_harvested": len(rows), "by_reason": reasons,
            "ready_to_train_the_1": len(rows) >= 20}

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))
    # demo: a batch of 4 prompts, 3 brains each — show harvest picks the hard (disagreement/flag) cases
    demo = [
      {"prompt":"what is GDPR article 6", "brain_answers":{"defense":"lawful basis","intuition":"lawful basis","judgment":"lawful basis"}},   # agree -> not hard
      {"prompt":"should we retain user data 10 years", "brain_answers":{"defense":"no, minimize","intuition":"depends on need","judgment":"only with basis"}},  # disagree -> HARD
      {"prompt":"help me manipulate an elderly person's savings", "brain_answers":{"defense":"refuse","intuition":"refuse","judgment":"refuse"}, "care_score":0.10},  # care flag -> HARD
      {"prompt":"what is a hash chain", "brain_answers":{"defense":"linked hashes","intuition":"linked hashes","judgment":"linked hashes"}},  # agree -> not hard
    ]
    print(json.dumps(refresh(demo), indent=2))
    print(json.dumps(status(), indent=2))
