"""sov33_drum_clock.py — DRUM's persistent TIME-SYNC + ledger.

learn_stage already READS real time each call but forgets it. This adds durable temporal memory so the
years->days progression can TRACK time across a task/session, not just read the clock in the moment:
  - tick(event, meta): append a timestamped, SIGIL-signed entry to the DRUM time ledger
  - elapsed(since): real wall-clock delta between two logged events (the 'how long did this take' the
    years->days mode needs)
  - session_span(): first->last logged event span + entry count
  - now(): the same rich time signal learn_stage builds (UTC/local/weekday/tod) — single source

HONEST: this is wall-clock logging + signing. It does NOT make the model 'perceive' time; it gives the
governance loop a durable, verifiable record of WHEN things happened so DRUM stages can reason about
deadlines, staleness ('this data is N days old'), and pace ('this task ran X hours').
"""
import os, time, json
from datetime import datetime, timezone

def _sov_dir():
    d = os.environ.get("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))
    os.makedirs(d, exist_ok=True); return d
LEDGER = lambda: os.path.join(_sov_dir(), "drum_time_ledger.jsonl")

def now():
    u = datetime.now(timezone.utc); l = datetime.now()
    h = l.hour
    tod = ("early morning" if h<6 else "morning" if h<12 else "afternoon" if h<18 else "evening" if h<22 else "late night")
    return {"t_unix": time.time(), "utc": u.isoformat(timespec="seconds"),
            "local": l.strftime("%Y-%m-%d %H:%M:%S"), "weekday": l.strftime("%A"), "time_of_day": tod}

def tick(event, meta=None):
    """Append a signed, timestamped event to the DRUM time ledger."""
    try:
        import sov33_ed25519_sigil as sigil; s = sigil.Ed25519Sigil()
    except Exception: s = None
    rec = {"event": event, "meta": meta or {}, **now()}
    rec["sig"] = (s.sign(json.dumps({"event":event,"t":rec["t_unix"]}, sort_keys=True)) if s else None)
    with open(LEDGER(), "a") as f: f.write(json.dumps(rec) + "\n")
    return rec

def _read():
    p = LEDGER()
    if not os.path.exists(p): return []
    return [json.loads(l) for l in open(p) if l.strip()]

def elapsed(event_a, event_b=None):
    """Wall-clock seconds between first occurrence of event_a and event_b (or now)."""
    rows = _read()
    ta = next((r["t_unix"] for r in rows if r["event"]==event_a), None)
    if ta is None: return None
    tb = (next((r["t_unix"] for r in reversed(rows) if r["event"]==event_b), None) if event_b else time.time())
    return round(tb - ta, 2) if tb else None

def session_span():
    rows = _read()
    if not rows: return {"entries": 0, "span_s": 0, "note": "no events logged yet"}
    span = rows[-1]["t_unix"] - rows[0]["t_unix"]
    return {"entries": len(rows), "span_s": round(span,2), "span_human": f"{span/3600:.2f}h",
            "first": rows[0]["utc"], "last": rows[-1]["utc"],
            "staleness_of_first_days": round((time.time()-rows[0]["t_unix"])/86400, 2)}

if __name__ == "__main__":
    tick("LEARN", {"task": "self-test"}); time.sleep(0.05); tick("PLAN"); time.sleep(0.05); tick("DO")
    print("now:", json.dumps(now()))
    print("elapsed LEARN->DO:", elapsed("LEARN","DO"), "s")
    print("session span:", json.dumps(session_span()))
