#!/usr/bin/env python3
"""sov33_learn_stage.py — Stage 1 LEARN + the DRUM(L0)->all-stages bridge.
Makes SOV33 TIME-AWARE at task start (real datetime, not abstract) and carries live L0 signal
(time, substrate health, memory-availability) UP into every stage so the sovereign can 'see'.
This is the runnable core of stage 1 (was NEW/stub) + the L0 bridge the charter now requires.
Honest: time + substrate-health are RUNNING (real reads); memory-availability is a probe that
reports whether a memory layer is wired (currently NOT), so LEARN degrades honestly when memory is absent.
"""
import os, time, json, socket
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


def drum_tick():
    """L0 heartbeat signal available to ALL stages (the bridge)."""
    return {"t_unix": time.time(), "phase": (time.time() % 1.0)}  # 1Hz firefly phase

def learn(task_hint=""):
    """Stage 1 LEARN — ground from real time/date + substrate state BEFORE any planning."""
    now = datetime.now(timezone.utc)
    local = datetime.now()
    # time-awareness (real, so Years->Days can reason about deadlines / 'it's late')
    hour = local.hour
    tod = ("early morning" if hour<6 else "morning" if hour<12 else
           "afternoon" if hour<18 else "evening" if hour<22 else "late night")
    # substrate health (real reads)
    try:
        import shutil; du = shutil.disk_usage("/")
        disk_free_gb = round(du.free/1e9, 1)
    except Exception: disk_free_gb = None
    # memory-availability probe: is a persistent memory layer wired? (honest: currently NO)
    mem_wired = os.path.isdir(os.path.expanduser("~/.sovereign")) and \
                os.path.exists(os.path.join(_SOVDIR, f'sovereign_memory.jsonl'))
    signal = {
        "stage": "LEARN",
        "utc": now.isoformat(timespec="seconds"),
        "local_time": local.strftime("%Y-%m-%d %H:%M"),
        "time_of_day": tod,
        "weekday": local.strftime("%A"),
        "drum": drum_tick(),
        "substrate": {"disk_free_gb": disk_free_gb, "host": socket.gethostname()[:20]},
        "memory_layer_wired": mem_wired,
        "learn_status": "grounded" if mem_wired else "grounded_no_memory (time+substrate only; memory layer NOT wired)",
        "task_hint": task_hint[:80],
    }
    return signal

# the L0->all-stages bridge: every stage receives the current DRUM+LEARN signal
def bridge_to_all_stages(learn_signal, stages):
    """Attach the L0 signal to each of the 9 stages so every stage can 'see' time+substrate."""
    return {st: {"l0_signal": learn_signal, "can_see": ["time","date","weekday","substrate","drum_phase"]}
            for st in stages}

if __name__ == "__main__":
    sig = learn("test: plan a parallel build across hives")
    print("STAGE 1 LEARN — time-aware grounding (runnable)\n")
    for k in ["utc","local_time","time_of_day","weekday","memory_layer_wired","learn_status"]:
        print(f"  {k:20}: {sig[k]}")
    print(f"  drum phase          : {sig['drum']['phase']:.3f} (1Hz firefly)")
    print(f"  substrate           : {sig['substrate']}")
    stages=["LEARN","CHECK_EXISTING","PLAN","DO","ACT","CHECK_VERIFY","AUDIT","IMPROVE","BRAND_QUALITY"]
    b=bridge_to_all_stages(sig, stages)
    print(f"\n  L0 bridge: DRUM+time signal delivered to all {len(b)} stages (every stage can see time+substrate)")
    print(f"  HONEST: LEARN is time/substrate-aware NOW; memory layer NOT wired -> {sig['learn_status']}")
    json.dump(sig, open("learn_stage_signal.json","w"), indent=2)
