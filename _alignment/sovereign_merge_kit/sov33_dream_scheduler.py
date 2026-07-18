"""P4: Dream-loop scheduler. Fires the dream cycle on a DRUM cadence (default nightly). Records each
run to the DRUM ledger. Designed to be driven by cron/launchd on the Mac OR called in-process.
This is the SCHEDULER; dream() itself (consolidate/prune/propose) was already built + proven."""
import os, json, time
from sov33_paths import SOV_DIR
_LAST = SOV_DIR / "dream_scheduler_state.json"
def _state():
    if os.path.exists(_LAST):
        try: return json.load(open(_LAST))
        except: pass
    return {"last_run": None, "runs": 0}
def due(interval_hours=24):
    st=_state()
    if st["last_run"] is None: return True
    return (time.time() - st["last_run"]) >= interval_hours*3600
def run_if_due(interval_hours=24, force=False):
    if not (force or due(interval_hours)):
        return {"ran": False, "reason": "not due", "next_in_h": round(interval_hours-((time.time()-_state()["last_run"])/3600),1)}
    # DRUM tick then dream
    try:
        import sov33_drum_clock as drum; drum.tick("dream_scheduler",{"cadence_h":interval_hours})
    except Exception: pass
    result={"ran":True}
    try:
        import sov33_dream_cycle as dc
        fn = getattr(dc,"dream",None) or getattr(dc,"run",None)
        result["dream"]= fn("scheduled") if fn else "dream() not found"
    except Exception as e:
        result["dream_error"]=str(e)[:80]
    st=_state(); st["last_run"]=time.time(); st["runs"]=st.get("runs",0)+1
    os.makedirs(SOV_DIR,exist_ok=True); json.dump(st, open(_LAST,"w"))
    result["total_runs"]=st["runs"]
    return result
if __name__=="__main__":
    print("due (fresh):", due())
    r=run_if_due(force=True); print("forced run:", {k:(str(v)[:60]) for k,v in r.items()})
    print("due immediately after:", due())  # should be False
