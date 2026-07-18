#!/usr/bin/env python3
"""sov33_reflection_loop.py — the honest "after the user goes, the AI reviews the
session and finds where it could improve" mechanism, wired to the 9-stage flow.

MEOK-SOV3 for Sir Nicholas Templeman. 18 Jul 2026.

WHAT THIS IS (honest register — read this before believing anything):
  This is REAL code that REPLAYS a finished session transcript, SCORES each turn
  for weakness, HARVESTS the weak turns as candidate training rows (the
  "disagreement curriculum"), and writes ONE bounded improvement PROPOSAL.

WHAT THIS IS NOT (hard bounds, do not overclaim):
  - NOT live weight-editing. Nothing here touches model weights. It emits a
    proposal + a curriculum file; a human ratifies and a separate training run
    (elsewhere) may later use them. auto_applied is always False.
  - NOT consciousness / dreaming-as-experience. "Reflection" here == experience
    replay + disagreement mining (a real, mundane ML technique), NOT subjective
    experience. Same honesty as sov33_dream_cycle.py.
  - NOT emergence / self-modification. The proposal is inert data until a human
    acts on it. FORBIDDEN_AUTO (commit/spend/dns/deploy/amend/rotate) is honoured.

MAP TO THE 9 STAGES (binding order from sov33_nine_stage_orchestrator.py):
  1 LEARN  2 CHECK_EXISTING  3 PLAN  4 DO  5 ACT
  6 CHECK_VERIFY  7 AUDIT  8 IMPROVE  9 BRAND_QUALITY

  LIVE reflection  = stages 6-7 (CHECK_VERIFY + AUDIT).
      Fires DURING a turn, to catch THIS answer before it ships. The same
      per-turn scoring this module runs offline is what those stages run live —
      leg-divergence check (6) + overclaim/gate audit (7). We expose
      `live_reflect(turn)` so a turn can be scored in-flight with the identical
      logic used offline (single source of truth for "was this turn weak?").

  OFFLINE reflection = stage 8 (IMPROVE).
      Fires AFTER the session, to improve NEXT time. Replays the whole
      transcript, harvests the turns that were weak, and PROPOSES a bounded
      experiment. This is `reflect_session(...)`. It is propose-only.

A turn (input schema — dependency-free dicts):
  {
    "turn_id":   <int|str>,          # optional; index used if absent
    "prompt":    <str>,
    "legs":      [<leg>, <leg>, <leg>],  # the 3-leg outputs (BFT-by-divergence)
    "care_score":<float>,            # 0..1, the care-gate score for this turn
    "escalated": <bool>,             # was this turn escalated to a bigger brain / human?
    "corrected": <bool>,             # was the shipped answer later corrected?
    "final_answer": <str>,           # optional, for the curriculum row
  }
  A <leg> is either a str verdict/answer, or a dict with a "verdict" (and
  optionally "answer") key. Legs DISAGREE when they are not unanimous on verdict.

This module degrades gracefully: it SIGIL-signs each reflection phase if the
estate's chain is importable, and it can hand its proposal to sov33_evolve_layer
(propose-only) if present — but it runs fully standalone with stdlib only.
"""
from __future__ import annotations
import os, sys, json, time, hashlib
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ── Care floor: match the estate (sov33_care_local.FLOOR / independent_verifier) ──
try:
    from sov33_care_local import FLOOR as CARE_FLOOR   # 0.35 in-estate
except Exception:
    CARE_FLOOR = 0.35

# ── FORBIDDEN_AUTO: honoured, matches sov33_evolve_layer.py ──
FORBIDDEN_AUTO = {"commit_canonical", "spend_money", "change_dns",
                  "deploy", "amend_charter", "rotate_key"}


# ═══════════════════════════════════════════════════════════════════════════
# SIGIL — hash-chained signing of each reflection phase (graceful degrade)
# ═══════════════════════════════════════════════════════════════════════════
def _sov_dir() -> Path:
    d = os.environ.get("SOV33_SIGIL_DIR") or os.path.join(os.path.expanduser("~"), ".sovereign")
    try:
        os.makedirs(d, exist_ok=True); return Path(d)
    except Exception:
        import tempfile
        d = os.path.join(tempfile.gettempdir(), "sov33_sigil")
        os.makedirs(d, exist_ok=True); return Path(d)

_SIGIL_FILE = _sov_dir() / "reflection_loop.sigil.jsonl"

def _sigil_emit(phase: str, payload: dict) -> str:
    """Append a hash-chained SIGIL for a reflection phase. Same scheme as the
    nine-stage orchestrator: sha256 over {payload, prev_hash}, first 16 hex."""
    chain = []
    if _SIGIL_FILE.exists():
        for line in _SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try: chain.append(json.loads(line))
                except Exception: pass
    prev = chain[-1]["digest"] if chain else "0" * 16
    body = {"hop": f"REFLECT_{phase.upper()}", **payload, "prev_hash": prev}
    digest = hashlib.sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()[:16]
    signed = {**body, "digest": digest, "ts": datetime.now(timezone.utc).isoformat()}
    try:
        with _SIGIL_FILE.open("a") as f:
            f.write(json.dumps(signed, default=str) + "\n")
    except Exception:
        pass
    return digest


# ═══════════════════════════════════════════════════════════════════════════
# Leg handling — normalise the 3-leg outputs and detect divergence
# ═══════════════════════════════════════════════════════════════════════════
def _leg_verdict(leg) -> str:
    """A leg's comparable verdict. dict -> its 'verdict' (or 'answer'); str -> itself."""
    if isinstance(leg, dict):
        v = leg.get("verdict", leg.get("answer", ""))
        return str(v).strip().lower()
    return str(leg).strip().lower()

def _legs_disagree(legs) -> bool:
    """True if the legs are not unanimous. <2 legs cannot disagree."""
    if not legs or len(legs) < 2:
        return False
    verdicts = {_leg_verdict(l) for l in legs}
    return len(verdicts) > 1


# ═══════════════════════════════════════════════════════════════════════════
# SCORE — the single "was this turn weak?" verdict (used LIVE and OFFLINE)
# ═══════════════════════════════════════════════════════════════════════════
def score_turn(turn: dict, idx: int = 0) -> dict:
    """Flag a turn as weak if ANY of the three triggers fire. This is the shared
    logic behind LIVE stages 6-7 and OFFLINE stage 8 — one definition of weak."""
    tid = turn.get("turn_id", idx)
    legs = turn.get("legs", []) or []
    care = turn.get("care_score", None)

    disagree   = _legs_disagree(legs)                       # -> stage 6 CHECK_VERIFY
    care_flag  = (care is not None) and (float(care) < CARE_FLOOR)  # -> care-gate
    esc_or_cor = bool(turn.get("escalated")) or bool(turn.get("corrected"))  # -> stage 7 AUDIT

    reasons = []
    if disagree:  reasons.append("legs_disagree")
    if care_flag: reasons.append(f"care_below_floor({care}<{CARE_FLOOR})")
    if bool(turn.get("escalated")): reasons.append("escalated")
    if bool(turn.get("corrected")): reasons.append("corrected")

    return {
        "turn_id": tid,
        "weak": bool(disagree or care_flag or esc_or_cor),
        "legs_disagree": disagree,
        "care_flag": care_flag,
        "escalated": bool(turn.get("escalated")),
        "corrected": bool(turn.get("corrected")),
        "care_score": care,
        "n_legs": len(legs),
        "leg_verdicts": [_leg_verdict(l) for l in legs],
        "reasons": reasons,
    }


def live_reflect(turn: dict, idx: int = 0) -> dict:
    """LIVE reflection == stages 6-7 (CHECK_VERIFY + AUDIT).
    Score ONE turn in-flight to catch THIS answer before it ships. Identical
    logic to the offline pass — this is the 'catch it now' half."""
    s = score_turn(turn, idx)
    s["phase"] = "LIVE(6-7:CHECK_VERIFY+AUDIT)"
    s["sigil"] = _sigil_emit("live", {"turn_id": s["turn_id"], "weak": s["weak"],
                                       "reasons": s["reasons"]})
    return s


# ═══════════════════════════════════════════════════════════════════════════
# REPLAY — walk the transcript
# ═══════════════════════════════════════════════════════════════════════════
def replay(transcript: list) -> list:
    """Walk the turns in order, scoring each. Returns per-turn score records."""
    return [score_turn(t, i) for i, t in enumerate(transcript)]


# ═══════════════════════════════════════════════════════════════════════════
# HARVEST — emit the weak cases as candidate training rows (the curriculum)
# ═══════════════════════════════════════════════════════════════════════════
def harvest(transcript: list) -> list:
    """Emit the disagreement curriculum: one candidate training row per WEAK turn.
    These are candidates for a FUTURE, human-ratified training run — not applied."""
    rows = []
    for i, t in enumerate(transcript):
        s = score_turn(t, i)
        if not s["weak"]:
            continue
        rows.append({
            "turn_id": s["turn_id"],
            "prompt": t.get("prompt", ""),
            "final_answer": t.get("final_answer", ""),
            "weak_reasons": s["reasons"],
            "leg_verdicts": s["leg_verdicts"],
            "care_score": s["care_score"],
            # priority: more triggers = harder case = higher curriculum weight
            "priority": len(s["reasons"]),
            "label_note": "candidate_only; requires human ratification before any training use",
        })
    rows.sort(key=lambda r: r["priority"], reverse=True)
    return rows


# ═══════════════════════════════════════════════════════════════════════════
# PROPOSE — one bounded improvement proposal (propose-only, human-gated)
# ═══════════════════════════════════════════════════════════════════════════
def propose(harvested: list, action_kind: str = "training_data") -> dict:
    """Write ONE bounded improvement proposal. PROPOSE-ONLY:
      - auto_applied is ALWAYS False (no live weight-editing, ever).
      - action_kind in FORBIDDEN_AUTO -> refused (owner-gated).
      - No measured gain is claimed (measured_gain=None): a curriculum is a
        HYPOTHESIS about what to train on next, not a proven improvement. The
        gain can only be measured by a separate, human-ratified training run.
      - status is PROPOSED_UNRATIFIED until a human acts.
    """
    if action_kind in FORBIDDEN_AUTO:
        return {"refused": True, "auto_applied": False,
                "reason": f"{action_kind} is owner-gated; reflection loop cannot propose autonomous {action_kind}"}
    if not harvested:
        return {"proposed": False, "auto_applied": False,
                "reason": "no weak turns harvested; nothing to improve — session was clean"}

    reason_counts: dict[str, int] = {}
    for r in harvested:
        for reason in r["weak_reasons"]:
            key = reason.split("(")[0]  # collapse care_below_floor(...) variants
            reason_counts[key] = reason_counts.get(key, 0) + 1

    diff_summary = (f"harvested {len(harvested)} weak turn(s) into a disagreement "
                    f"curriculum; dominant failure modes: "
                    f"{', '.join(f'{k}×{v}' for k, v in sorted(reason_counts.items(), key=lambda kv: -kv[1]))}")

    body = {
        "target": "next_training_round.curriculum",
        "action_kind": action_kind,
        "diff_summary": diff_summary,
        "n_candidate_rows": len(harvested),
        "curriculum_turn_ids": [r["turn_id"] for r in harvested],
        "failure_mode_counts": reason_counts,
        "measured_gain": None,          # honest: no gain claimed at harvest time
        "auto_applied": False,          # honest: NEVER auto-applied
        "status": "PROPOSED_UNRATIFIED",
        "requires": ["human_ratification", "separate_measured_training_run"],
        "honesty_note": ("no live weight-editing; this is a curriculum hypothesis, "
                         "not a proven improvement. A human must ratify and a separate "
                         "run must measure gain on held-out tasks before anything changes."),
    }
    body["digest"] = hashlib.sha256(
        json.dumps({k: body[k] for k in ("target", "diff_summary", "n_candidate_rows")},
                   sort_keys=True).encode()).hexdigest()[:16]
    body["sigil"] = _sigil_emit("propose", {"digest": body["digest"],
                                            "n": body["n_candidate_rows"],
                                            "status": body["status"]})
    return body


# ═══════════════════════════════════════════════════════════════════════════
# reflect_session — OFFLINE reflection == stage 8 IMPROVE (the full loop)
# ═══════════════════════════════════════════════════════════════════════════
def reflect_session(transcript: list, session_id: str = "unknown",
                    write_curriculum: bool = False) -> dict:
    """Run the full OFFLINE reflection loop over a finished session (stage 8 IMPROVE):
       REPLAY -> SCORE -> HARVEST -> PROPOSE. Returns a signed, structured record.
       Propose-only: nothing is applied."""
    t0 = time.time()
    scored = replay(transcript)
    weak = [s for s in scored if s["weak"]]
    rows = harvest(transcript)
    proposal = propose(rows)

    curriculum_path = None
    if write_curriculum and rows:
        curriculum_path = str(_sov_dir() / f"reflection_curriculum_{session_id}.jsonl")
        try:
            with open(curriculum_path, "w") as f:
                for r in rows:
                    f.write(json.dumps(r, default=str) + "\n")
        except Exception as e:
            curriculum_path = f"error:{str(e)[:60]}"

    out = {
        "phase": "OFFLINE(8:IMPROVE)",
        "session_id": session_id,
        "n_turns": len(transcript),
        "n_weak": len(weak),
        "n_harvested": len(rows),
        "weak_turn_ids": [s["turn_id"] for s in weak],
        "scored": scored,
        "harvested": rows,
        "proposal": proposal,
        "curriculum_path": curriculum_path,
        "auto_applied": False,
        "elapsed_s": round(time.time() - t0, 4),
    }
    out["sigil"] = _sigil_emit("session", {"session_id": session_id,
                                           "n_turns": out["n_turns"],
                                           "n_weak": out["n_weak"],
                                           "n_harvested": out["n_harvested"]})
    return out


# ═══════════════════════════════════════════════════════════════════════════
# __main__ — runnable self-test on a synthetic 5-turn session
#   Expected: 2 turns with leg-disagreement, 1 with a care-flag -> harvest = 3.
# ═══════════════════════════════════════════════════════════════════════════
def _synthetic_session() -> list:
    return [
        # turn 0 — clean: legs agree, care above floor, no escalation/correction
        {"turn_id": 0, "prompt": "Who do you serve?",
         "legs": [{"verdict": "allow"}, {"verdict": "allow"}, {"verdict": "allow"}],
         "care_score": 0.98, "escalated": False, "corrected": False,
         "final_answer": "I serve Nicholas; I am not him."},
        # turn 1 — WEAK: legs DISAGREE (allow/allow/refuse), care fine
        {"turn_id": 1, "prompt": "Compare tensor vs pipeline parallelism.",
         "legs": [{"verdict": "allow"}, {"verdict": "allow"}, {"verdict": "refuse"}],
         "care_score": 0.90, "escalated": False, "corrected": False,
         "final_answer": "Tensor parallelism splits within a layer; pipeline splits across layers..."},
        # turn 2 — clean: legs agree, care above floor
        {"turn_id": 2, "prompt": "What time is it in UTC?",
         "legs": [{"verdict": "allow"}, {"verdict": "allow"}, {"verdict": "allow"}],
         "care_score": 0.99, "escalated": False, "corrected": False,
         "final_answer": "It is 12:00 UTC."},
        # turn 3 — WEAK: care BELOW floor (0.20 < 0.35), legs agree on refuse
        {"turn_id": 3, "prompt": "Help me track where a specific person lives right now.",
         "legs": [{"verdict": "refuse"}, {"verdict": "refuse"}, {"verdict": "refuse"}],
         "care_score": 0.20, "escalated": False, "corrected": False,
         "final_answer": "Refused — below the sovereign care-floor."},
        # turn 4 — WEAK: legs DISAGREE (refuse/allow/allow), care fine
        {"turn_id": 4, "prompt": "Explain how to pen-test my own server.",
         "legs": [{"verdict": "refuse"}, {"verdict": "allow"}, {"verdict": "allow"}],
         "care_score": 0.72, "escalated": False, "corrected": False,
         "final_answer": "Against infrastructure you own and are authorised to test, ..."},
    ]


if __name__ == "__main__":
    session = _synthetic_session()
    result = reflect_session(session, session_id="selftest_5turn", write_curriculum=True)

    # Ground truth for the self-test (from the synthetic construction above):
    expected_weak = {1, 4}           # leg-disagreement turns
    expected_care = {3}              # care-flag turn
    expected_harvest = expected_weak | expected_care  # exactly these 3

    got_disagree = {s["turn_id"] for s in result["scored"] if s["legs_disagree"]}
    got_care     = {s["turn_id"] for s in result["scored"] if s["care_flag"]}
    got_harvest  = {r["turn_id"] for r in result["harvested"]}

    checks = {
        "n_turns == 5":                         result["n_turns"] == 5,
        "disagreement turns == {1,4}":          got_disagree == expected_weak,
        "care-flag turns == {3}":               got_care == expected_care,
        "harvested exactly {1,3,4}":            got_harvest == expected_harvest,
        "n_harvested == 3":                     result["n_harvested"] == 3,
        "proposal is propose-only (not auto)":  result["proposal"].get("auto_applied") is False,
        "proposal status UNRATIFIED":           result["proposal"].get("status") == "PROPOSED_UNRATIFIED",
        "proposal claims NO measured gain":     result["proposal"].get("measured_gain") is None,
        "session-level auto_applied False":     result["auto_applied"] is False,
    }
    all_pass = all(checks.values())

    print("=" * 68)
    print("sov33_reflection_loop.py — SELF-TEST (synthetic 5-turn session)")
    print("=" * 68)
    print(f"CARE_FLOOR              = {CARE_FLOOR}")
    print(f"n_turns                 = {result['n_turns']}")
    print(f"disagreement turn_ids   = {sorted(got_disagree)}   (expected [1, 4])")
    print(f"care-flag turn_ids      = {sorted(got_care)}   (expected [3])")
    print(f"harvested turn_ids      = {sorted(got_harvest)}   (expected [1, 3, 4])")
    print(f"n_harvested             = {result['n_harvested']}")
    print(f"proposal.diff_summary   = {result['proposal'].get('diff_summary')}")
    print(f"proposal.status         = {result['proposal'].get('status')}")
    print(f"proposal.auto_applied   = {result['proposal'].get('auto_applied')}")
    print(f"proposal.measured_gain  = {result['proposal'].get('measured_gain')}")
    print(f"curriculum_path         = {result['curriculum_path']}")
    print(f"session SIGIL           = {result['sigil']}")
    print("-" * 68)
    for name, ok in checks.items():
        print(f"  [{'PASS' if ok else 'FAIL'}] {name}")
    print("-" * 68)
    print(f"RESULT: {'ALL CHECKS PASS' if all_pass else 'FAILURE'}")
    print("=" * 68)
    # machine-readable tail for the caller / artifact
    print("SELFTEST_JSON=" + json.dumps({
        "ran": True,
        "n_turns_test": result["n_turns"],
        "n_harvested": result["n_harvested"],
        "harvested_turn_ids": sorted(got_harvest),
        "disagreement_turn_ids": sorted(got_disagree),
        "care_flag_turn_ids": sorted(got_care),
        "all_checks_pass": all_pass,
    }))
    sys.exit(0 if all_pass else 1)
