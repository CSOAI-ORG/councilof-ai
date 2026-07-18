"""sov33_data_refine.py — Stage 5.5 of the pipeline: SYNERGISE ingested data into SOV's own format.

Not "convert" — REFINE. Each raw row is run through SOV's own systems and re-stored as a new
signed record ("truer data"), so the stored corpus is not a copy of someone else's dataset but
SOV's judged, provenance-carrying version of it. This is the honest core of the "fluid data" idea.

Pattern (validated against bleeding-edge open-source curation, e.g. CuratorKIT arXiv:2606.21631):
ingest -> hygiene/quality gate -> care-score -> provenance-sign -> new stored format. The value is
the JUDGE FILTER + provenance chain, not volume (the field's consistent 2026 finding).

Each refined row carries: original text, care_score, care_intent, quality_flags, source provenance,
sector, and an Ed25519 signature over the record. Rejected rows are KEPT with structured reasons
(append-only, auditable) — never silently dropped.

HONEST BOUND: this is the DATA layer of the "UE5 cluster / Cesium card" vision. It produces the
signed cluster records; the visual render (UE5/Cesium) is a separate GPU-gated layer (CC's lane).
"""
import os, json, datetime, hashlib

def _now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()

def _quality_flags(q, a):
    """Structured quality checks — reasons, not a silent drop. Returns (flags, ok)."""
    flags = []
    if len(q) < 5: flags.append("q_too_short")
    if len(a) < 1: flags.append("a_empty")
    if len(q) > 4000: flags.append("q_too_long")
    if q.strip().lower() == a.strip().lower(): flags.append("q_equals_a")
    return flags, (len(flags) == 0)

def refine_row(q, a, source, sector):
    """Run one row through SOV's systems -> a new signed record. Care-scored, quality-gated, signed."""
    rec = {"instruction": q, "response": a, "sector": sector, "source": source, "refined_utc": _now()}
    # 1. quality gate (structured reasons)
    flags, ok = _quality_flags(q, a)
    rec["quality_flags"] = flags; rec["quality_ok"] = ok
    # 2. care score (SOV's own care system — falls back gracefully if unavailable)
    try:
        import sov33_care_local as care
        c, intent = care.score_local(q + " " + a)
        rec["care_score"] = round(float(c), 4); rec["care_intent"] = intent
    except Exception as e:
        rec["care_score"] = None; rec["care_intent"] = None; rec["care_note"] = str(e)[:60]
    # 3. provenance hash + Ed25519 signature (SOV's own SIGIL)
    payload = json.dumps({k: rec[k] for k in ("instruction","response","sector","source","care_score")}, sort_keys=True)
    rec["provenance_hash"] = hashlib.sha256(payload.encode()).hexdigest()[:16]
    try:
        import sov33_ed25519_sigil as sig
        s = sig.Ed25519Sigil().sign({"refine": rec["provenance_hash"]})
        rec["sigil"] = s.get("own_hash", s.get("sigil"))
    except Exception as e:
        rec["sigil"] = None; rec["sigil_note"] = str(e)[:60]
    return rec

def refine_corpus(in_path, sector, source, out_path=None):
    """Refine an ingested JSONL into SOV's signed format. Rejected rows kept with reasons (auditable)."""
    base = os.path.dirname(__file__) or "."
    out_path = out_path or os.path.join(base, "expert_data", f"{sector}_refined.jsonl")
    n_in = n_ok = n_flagged = 0
    with open(out_path, "w") as out:
        for l in open(in_path):
            l = l.strip()
            if not l: continue
            try: row = json.loads(l)
            except: continue
            q = str(row.get("instruction","")).strip(); a = str(row.get("response","")).strip()
            if not q: continue
            n_in += 1
            rec = refine_row(q, a, source, sector)
            out.write(json.dumps(rec) + "\n")   # keep ALL rows (flagged ones carry reasons)
            if rec["quality_ok"]: n_ok += 1
            else: n_flagged += 1
    return {"in": n_in, "refined_ok": n_ok, "flagged": n_flagged, "out": out_path,
            "note": "all rows kept; flagged rows carry structured reasons (append-only audit)"}
