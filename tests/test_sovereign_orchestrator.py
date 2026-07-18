"""Tests for the Sovereign Orchestrator + Memory — the governed watch/learn/propose loop."""
import os, sys, json, tempfile, importlib
from pathlib import Path

# isolate state into a temp HOME so tests never touch real ~/.sov3
_TMP = tempfile.mkdtemp()
os.environ["HOME"] = _TMP
os.environ["SIGIL_LOG"] = os.path.join(_TMP, ".sov3", "orch_sigil.log")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import sovereign_orchestrator as orch  # noqa: E402
import sovereign_memory as mem  # noqa: E402
importlib.reload(orch); importlib.reload(mem)


def _reset():
    orch._auto_times.clear()
    for p in (orch.SIGIL_LOG, os.path.expanduser("~/.sov3/orchestrator_escalations.jsonl"), mem.MEM):
        try: os.remove(p)
        except OSError: pass


# ---- classification (the safety core) ----

def test_routine_states_classify_routine():
    for s in ["Continue? (y/n)", "awaiting input", "press enter to go on"]:
        assert orch.classify(s) == "ROUTINE", s


def test_destructive_states_always_judgment():
    for s in ["Ready to PUBLISH to production", "deploy to vercel?", "rm -rf build?",
              "merge this PR?", "charge the card via Stripe?", "make repo public?"]:
        assert orch.classify(s) == "JUDGMENT", s


def test_unknown_state_defaults_to_judgment():
    # default-escalate: anything not whitelisted goes to the human
    assert orch.classify("some novel thing the agent said") == "JUDGMENT"


# ---- the governed tick ----

def test_tick_auto_continues_routine_and_escalates_judgment():
    _reset()
    os.environ["ORCH_WINDOWS"] = json.dumps([
        {"window": "w1", "text": "Continue? (y/n)"},
        {"window": "w2", "text": "Ready to PUBLISH to production — approve?"},
    ])
    r = orch.tick()
    assert len(r["acted"]) == 1 and r["acted"][0]["window"] == "w1"
    assert len(r["escalated"]) == 1 and r["escalated"][0]["window"] == "w2"
    # dry-run signs but does NOT type
    assert "DRY-RUN" in r["acted"][0]["mode"]
    del os.environ["ORCH_WINDOWS"]


def test_dry_run_never_types():
    _reset()
    assert orch.ACT_ENABLED is False  # default safety
    res = orch.act_continue("w", "Continue?")
    assert "DRY-RUN" in res["mode"] and res["sigil"]


def test_kill_switch_halts():
    _reset()
    Path(orch.STOP_FILE).parent.mkdir(parents=True, exist_ok=True)
    Path(orch.STOP_FILE).touch()
    try:
        assert orch.tick().get("halted") is True
    finally:
        os.remove(orch.STOP_FILE)


def test_rate_limit_escalates_when_exceeded():
    _reset()
    orch.MAX_AUTO_PER_HOUR = 2
    orch.act_continue("w", "Continue?"); orch.act_continue("w", "Continue?")
    third = orch.act_continue("w", "Continue?")  # over the limit
    assert third.get("reason", "").startswith("rate-limit") or "reason" in third
    orch.MAX_AUTO_PER_HOUR = 30


def test_sigil_is_hash_chained():
    _reset()
    orch.act_continue("w", "Continue?"); orch.act_continue("w", "Continue?")
    lines = [json.loads(l) for l in open(orch.SIGIL_LOG)]
    assert lines[1]["prev_digest"] == lines[0]["digest"]  # chained


# ---- memory: learn + proactively propose ----

def test_memory_learns_per_window_patterns():
    _reset()
    for _ in range(4):
        mem.remember("w1", "Continue? (y/n)", "ROUTINE")
    prof = mem.learn()
    assert prof["w1"]["observations"] == 4 and prof["w1"]["auto_rate"] == 1.0


def test_proactive_proposes_autopilot_for_learned_routine():
    _reset()
    for _ in range(4):
        mem.remember("w1", "Continue?", "ROUTINE")
    props = mem.propose_help([{"window": "w1", "text": "Continue?"}])
    assert any(p["kind"] == "offer-autopilot" for p in props)


def test_proactive_prestages_recurring_judgment():
    _reset()
    mem.remember("w3", "publish to production", "approved")
    mem.remember("w3", "publish to production", "approved")
    props = mem.propose_help([{"window": "w3", "text": "Ready to publish to production"}])
    assert any(p["kind"] == "pre-stage" for p in props)
