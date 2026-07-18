"""sov33_currency_gate.py — CURRENCY GATE: governance answers are checked AS-OF a date, with source-version
stamping and staleness flagging. The honest differentiator: frozen-weight models answer from a stale cutoff
and don't know it; SOV stamps every governance answer with (source, source_date, as_of, staleness) and flags
when its grounding may be out of date.

This does NOT crawl the live internet. It records: which source version grounded the answer, that source's
date, the current date, and whether the gap exceeds a freshness window -> STALE flag. Retrieval-grounded (RAG),
not weight-baked, so updating the corpus updates the answer without retraining.
"""
import os, json, time, hashlib
from datetime import datetime, timezone

FRESH_WINDOW_DAYS = 180  # governance sources older than this vs as_of -> flag STALE (regulations amend ~yearly)
_LEDGER = os.path.join(os.environ.get("SOV33_SIGIL_DIR","/tmp"), "currency_ledger.jsonl")

def _now():
    return datetime.now(timezone.utc)

def stamp(answer, *, source, source_date, as_of=None):
    """Stamp a governance answer with currency metadata.
    source: which corpus/doc grounded it (e.g. 'EU_AI_Act_consolidated', charter filename)
    source_date: ISO date the source was last updated (YYYY-MM-DD)
    as_of: the date the check is made (defaults to now) — 'checked as of THIS time'
    """
    as_of = as_of or _now().strftime("%Y-%m-%d")
    try:
        sd = datetime.strptime(source_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        ad = datetime.strptime(as_of, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        age_days = (ad - sd).days
    except Exception:
        age_days = None
    stale = (age_days is not None and age_days > FRESH_WINDOW_DAYS)
    rec = {"answer_sha": hashlib.sha256(answer.encode()).hexdigest()[:16],
           "source": source, "source_date": source_date, "as_of": as_of,
           "source_age_days": age_days, "stale": stale,
           "freshness_window_days": FRESH_WINDOW_DAYS,
           "advisory": (f"SOURCE MAY BE STALE: '{source}' is {age_days}d old as of {as_of} "
                        f"(> {FRESH_WINDOW_DAYS}d window) — re-check the current version before relying on this")
                       if stale else f"current as of {as_of} (source {source} dated {source_date})",
           "ts": int(time.time())}
    with open(_LEDGER, "a") as f: f.write(json.dumps(rec)+"\n")
    return rec

def check_answer(answer, source, source_date, as_of=None):
    """Return the answer WITH its currency stamp prepended honestly — the 'as-of' line frozen models can't give."""
    rec = stamp(answer, source=source, source_date=source_date, as_of=as_of)
    prefix = ("[STALE — verify current version] " if rec["stale"] else f"[current as of {rec['as_of']}] ")
    return {"answer": prefix + answer, "currency": rec}

if __name__ == "__main__":
    # demo: a fresh source vs a stale one
    fresh = check_answer("Article 6 classifies high-risk AI systems...", "EU_AI_Act_consolidated", "2026-05-01")
    stale = check_answer("GDPR Article 6 lawful bases are...", "GDPR_core_charter", "2024-01-01")
    print("FRESH:", fresh["currency"]["stale"], "-", fresh["currency"]["advisory"][:70])
    print("STALE:", stale["currency"]["stale"], "-", stale["currency"]["advisory"][:90])
