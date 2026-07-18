"""
natal_guardian.py — The Natal Guardian: an operational guardian covenant for SOV3.

WHAT THIS IS (honesty register — read first):
  This is a GOVERNANCE CONSTRUCT, not a conscious being. The "natal guardian" is the
  classical tutelary design-pattern (the guardian/tutelary spirit of the perennial
  traditions — genius, fravashi) translated into code:
  a persistent, consent-based protection covenant initialized at the BIRTH of a user's
  relationship with the system, and held across the life-arc. It makes NO claim to
  awareness, sentience, or metaphysical guardianship. It is the runnable form of
  Charter 45 (GuardianOf) — the Seven Guardian Principles bound to real signals.

WHAT IT DOES:
  - At first contact ("natal" event) it opens a Guardian Covenant for a pseudonymous
    user id: the standing duty of care owed, calibrated to declared life-stage.
  - It holds that covenant across sessions (Principle 1: constancy / non-abandonment).
  - It records — never invents — protection events against the seven principles.
  - It is the JUDGEMENT-FREE ledger: it stores what duty is owed, not a surveillance
    profile. Data-minimised, consent-gated, erasable (Principle 5 + GDPR Art.17).

WHAT IT DOES NOT DO:
  - It does not gate inference (that is the live Care-Floor / Care Membrane).
  - It does not score real users' dependency (no real per-user needs vectors exist).
  - It does not run automatically — installing this file wires nothing. The server
    owner binds it to the runtime deliberately.

STDLIB ONLY. Atomic writes. Safe to import without sklearn.
"""
import os, json, time, hashlib, tempfile

# The seven guardian principles (Charter 45), as machine keys.
GUARDIAN_PRINCIPLES = (
    "constancy",            # 1 non-abandonment
    "anticipation",         # 2 guard before harm
    "free_will",            # 3 guide never coerce  (binds to detect_dependency)
    "life_arc",             # 4 whole-of-life scope
    "silent_guardianship",  # 5 protection without exploitation
    "discernment",          # 6 genuine welfare vs mere wish
    "restoration",          # 7 recover, never discard
)

# Life-stage calibration (Principle 4). Declared by user or context, never inferred covertly.
LIFE_STAGES = ("child", "adolescent", "adult", "elder", "in_crisis", "unspecified")

_HERE = os.path.dirname(os.path.abspath(__file__))
_COVENANT_DIR = os.path.join(_HERE, "..", "guardian_covenants")  # per-user covenant store


def _uid(raw_identifier: str) -> str:
    """Pseudonymise: we store a salted hash, never the raw identifier (data-minimisation)."""
    return hashlib.sha256(("guardian::" + str(raw_identifier)).encode()).hexdigest()[:24]


def _atomic_write(path: str, obj: dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(obj, f, indent=1)
        os.replace(tmp, path)  # atomic
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def open_covenant(raw_identifier: str, life_stage: str = "unspecified",
                  consent: bool = True) -> dict:
    """
    The NATAL event: open a guardian covenant at the birth of the relationship.
    Idempotent — re-opening returns the existing covenant (Principle 1: it does not reset
    or abandon). Consent-gated: without consent, no covenant is stored (Principle 5).
    """
    if not consent:
        return {"status": "no_covenant", "reason": "consent_not_given"}
    if life_stage not in LIFE_STAGES:
        life_stage = "unspecified"
    uid = _uid(raw_identifier)
    path = os.path.join(_COVENANT_DIR, uid + ".json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)  # constancy: never overwrite an existing covenant
    covenant = {
        "uid": uid,                       # pseudonymous only — raw id never stored
        "opened_at": time.time(),
        "life_stage": life_stage,         # Principle 4 calibration (declared, not inferred)
        "duties_owed": list(GUARDIAN_PRINCIPLES),
        "events": [],                     # protection events, recorded not invented
        "restoration_open": False,        # Principle 7 state
        "consent": True,
        "note": "governance covenant, not a surveillance profile",
    }
    _atomic_write(path, covenant)
    return covenant


def record_event(raw_identifier: str, principle: str, detail: str,
                 signal_value=None, source: str = "unspecified") -> dict:
    """
    Record a real protection event against one of the seven principles.
    signal_value must come from a real system signal (e.g. Care-Floor score,
    detect_dependency risk) — this function NEVER fabricates a score.
    """
    if principle not in GUARDIAN_PRINCIPLES:
        return {"status": "error", "reason": "unknown principle '%s'" % principle}
    uid = _uid(raw_identifier)
    path = os.path.join(_COVENANT_DIR, uid + ".json")
    if not os.path.exists(path):
        return {"status": "error", "reason": "no covenant open for this user"}
    with open(path) as f:
        cov = json.load(f)
    cov["events"].append({
        "t": time.time(), "principle": principle, "detail": str(detail)[:500],
        "signal_value": signal_value, "source": source,
    })
    # Principle 7: a harm event opens a restoration path; it does not close the covenant.
    if principle == "restoration":
        cov["restoration_open"] = True
    _atomic_write(path, cov)
    return {"status": "recorded", "uid": uid, "event_count": len(cov["events"])}


def duty_report(raw_identifier: str) -> dict:
    """Return the standing duty + event history for a user. Read-only."""
    uid = _uid(raw_identifier)
    path = os.path.join(_COVENANT_DIR, uid + ".json")
    if not os.path.exists(path):
        return {"status": "no_covenant"}
    with open(path) as f:
        cov = json.load(f)
    return {
        "uid": uid, "life_stage": cov["life_stage"],
        "duties_owed": cov["duties_owed"], "events": len(cov["events"]),
        "restoration_open": cov["restoration_open"],
    }


def erase_covenant(raw_identifier: str) -> dict:
    """Principle 5 + GDPR Art.17: the user can end the covenant and erase it."""
    uid = _uid(raw_identifier)
    path = os.path.join(_COVENANT_DIR, uid + ".json")
    if os.path.exists(path):
        os.remove(path)
        return {"status": "erased", "uid": uid}
    return {"status": "no_covenant"}
