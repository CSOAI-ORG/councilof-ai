"""
free_gpu_bridge.py — "always got power" for SOV33 TRAINING, honestly.

Nick: "10000s of free cpu/gpu companies — bridge all into sov333 so it's always got power."
Honest reality: there aren't 10000s of free-GPU providers — there are ~10-15 real ones, each with
real limits (time caps, weekly quotas, idle disconnects). But ROTATING across them genuinely gives
near-continuous free training capacity. This module is the registry + selector that does that.

Split, so we're precise:
  • INFERENCE is ALREADY bridged — `sov33_compute.infer()` routes Groq→OCI→Ollama→MPS (4 backends).
    SOV33 already "always has power" to ANSWER.
  • TRAINING (what grows L0→L1→…) is what this bridge adds: pick the next free GPU with quota and
    submit the same job (fetch kit → QLoRA → save adapters).

Each provider needs the OWNER's account/credential (I can't sign you up or hold your keys). This module
tracks quota locally and picks the next runnable provider; the `submit` for each is documented per
provider (some are one-command CLIs, some are notebook-drop, some need a token).
"""
import json, time, os
from pathlib import Path
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


_STATE = Path(_SOVDIR) / "free_gpu_quota.json"

# ── the real free-GPU training providers (honest limits, 2026) ──
PROVIDERS = [
    # name            gpu        free_window                 auth              submit
    {"name": "colab",     "gpu": "T4 16GB",  "weekly_hr": 30, "session_hr": 12, "auth": "google-login",
     "submit": "notebook: %run a kit URL (this session's method)", "persist": False},
    {"name": "kaggle",    "gpu": "T4x2/P100","weekly_hr": 30, "session_hr": 12, "auth": "kaggle-token",
     "submit": "kaggle kernels push (kernel-metadata.json + script)", "persist": True},
    {"name": "lightning", "gpu": "T4/L4",    "weekly_hr": 5, "session_hr": 24, "auth": "lightning-login",
     "submit": "lightning run app / Studio; ~22 GPU-hr/MONTH = ~5/wk (converted for honest weekly sum)", "persist": True},
    {"name": "paperspace","gpu": "free-GPU", "weekly_hr": 6,  "session_hr": 6,  "auth": "paperspace-apikey",
     "submit": "gradient notebooks (free-GPU tier, queued)", "persist": True},
    {"name": "modal",     "gpu": "A10/T4",   "weekly_hr": 2,  "session_hr": 24, "auth": "modal-token",
     "submit": "modal run (~$30/mo credit = ~2 GPU-hr/wk equiv, honest weekly)", "persist": True},
    {"name": "hf-zerogpu","gpu": "A100-slice","weekly_hr": 5, "session_hr": 1,  "auth": "hf-token",
     "submit": "HF Space w/ @spaces.GPU (ZeroGPU; time-sliced, Pro=more)", "persist": True},
    {"name": "sagemaker-studiolab","gpu": "T4","weekly_hr": 24,"session_hr": 4, "auth": "aws-studiolab",
     "submit": "Studio Lab notebook (4hr GPU sessions, free, no AWS acct)", "persist": True},
    # inference-only free tiers (NOT training) — already used by sov33_compute:
    # groq (free API), cerebras (free API), together ($ credit). Listed for completeness.
]


def _load():
    try:
        return json.loads(_STATE.read_text())
    except Exception:
        return {}


def _save(d):
    try:
        _STATE.parent.mkdir(parents=True, exist_ok=True)
        _STATE.write_text(json.dumps(d, indent=2))
    except Exception:
        pass


def _week():
    # ISO week key so quotas reset weekly
    return time.strftime("%Y-W%U")


def used_this_week(name):
    return _load().get(_week(), {}).get(name, 0.0)


def record_run(name, hours):
    d = _load(); wk = _week()
    d.setdefault(wk, {})[name] = round(d.get(wk, {}).get(name, 0.0) + hours, 2)
    _save(d)
    return d[wk][name]


def next_provider(need_hr=3.0, persist_only=False):
    """Pick the next free-GPU provider with remaining weekly quota for a ~need_hr job."""
    cands = []
    for p in PROVIDERS:
        if persist_only and not p["persist"]:
            continue
        remaining = p["weekly_hr"] - used_this_week(p["name"])
        if remaining >= min(need_hr, p["session_hr"]):
            cands.append((remaining, p))
    cands.sort(reverse=True, key=lambda x: x[0])   # most remaining quota first
    return cands[0][1] if cands else None


def plan(need_hr=3.0):
    """A rotation plan across providers — how many free GPU-hours are available this week + the order to use them."""
    total = 0.0; order = []
    for p in sorted(PROVIDERS, key=lambda p: -(p["weekly_hr"] - used_this_week(p["name"]))):
        rem = round(p["weekly_hr"] - used_this_week(p["name"]), 1)
        if rem <= 0:
            continue
        total += rem
        order.append({"provider": p["name"], "gpu": p["gpu"], "free_hr_left": rem,
                      "auth": p["auth"], "submit": p["submit"]})
    return {"total_free_gpu_hr_this_week": round(total, 1), "providers": len(order),
            "rotation": order,
            "note": "Honest: ~%d providers, not 10000s — but rotating them = %d free GPU-hr/week, "
                    "enough for continuous 3B-QLoRA growth. Each needs the owner's account." % (len(order), round(total))}


# ── SOV33 capability wrapper ──
def capability_free_gpu(mode: str = "plan", need_hr: float = 3.0, provider: str = None, hours: float = None) -> dict:
    """Free-GPU training bridge: 'plan' (weekly capacity + rotation), 'next' (pick a provider now),
    'record' (log a finished run's hours to the quota). Owner supplies each provider's account."""
    if mode == "next":
        p = next_provider(need_hr)
        return {"capability": "free-gpu", "picked": p, "reason": "most free quota left this week"}
    if mode == "record" and provider and hours is not None:
        return {"capability": "free-gpu", "provider": provider, "week_used_hr": record_run(provider, hours)}
    return {"capability": "free-gpu", **plan(need_hr)}


if __name__ == "__main__":
    import pprint
    print("── weekly free-GPU capacity + rotation ──")
    pprint.pp(plan())
    print("\n── pick the next provider for a 3-hour run ──")
    p = next_provider(3.0)
    print(p["name"], "→", p["gpu"], "| submit:", p["submit"])
    print("\n(record a run:)", capability_free_gpu("record", provider="colab", hours=4))
