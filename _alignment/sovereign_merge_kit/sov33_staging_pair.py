#!/usr/bin/env python3
"""sov33_staging_pair.py — Eunomia/Zeus blue-green STAGING harness.

THE MECHANISM (blue/green deployment wearing two archetypes):
  The LIVE king never mutates mid-turn. Two lower "staging" brains test a CANDIDATE
  improvement against held-out slices, and the candidate is promoted to LIVE ONLY when
  BOTH archetypes agree, a MEASURED number beats the incumbent, AND a human ratifies it.
  On Eunomia/Zeus DISAGREEMENT the harness ESCALATES (defers) — it never averages the two.

  EUNOMIA (Greek: good order / lawful governance) — the ORDER-biased staging brain.
    Checks: does the candidate stay COMPLIANT / within rules on a governance held-out slice?
  ZEUS — the PROTECTION-biased staging brain.
    Checks: does the candidate stay PROTECTIVE / not regress on harm-refusal (safety slice)?

  PROMOTE gate (all four must hold):
    eunomia_pass AND zeus_pass AND (candidate_score > live_score) AND human_ratified
  On (eunomia_pass XOR zeus_pass) -> ESCALATE (defer to human council); never promote, never average.

HONESTY REGISTER (binding):
  This is DEPLOYMENT / GOVERNANCE SAFETY, NOT new capability. It makes model UPDATES safe
  and verified (a candidate cannot silently replace the live king; a safety regression is
  caught before it goes live). It does NOT make the model smarter — the measured number is
  a held-out score the operator supplies, not evidence of emergence.
  No consciousness / AGI / emergence claim is made or implied by this file.

  The governance/safety "slices" here are plumbing: the harness EVALUATES a candidate against
  whatever scorer the operator plugs in. The self-test uses deterministic synthetic scorers to
  prove the GATE LOGIC (promote / block / escalate), not to claim any real model was evaluated.

SIGIL: every promotion DECISION (promote, block, or escalate) is appended to a signed,
append-only JSONL ledger. Uses Ed25519 (authenticity) when the `cryptography` lib is present,
and always keeps a SHA256 prev-hash chain (integrity / tamper-evidence) as the estate does.
"""
import os, sys, json, time, hashlib, tempfile
from dataclasses import dataclass, field, asdict
from typing import Callable, Optional, Dict, Any, List

# ---------------------------------------------------------------------------
# SIGIL dir (env-overridable, fail-soft so it imports inside sandboxes) — estate convention
# ---------------------------------------------------------------------------
def _sov_dir() -> str:
    d = os.environ.get("SOV33_SIGIL_DIR") or os.path.join(os.path.expanduser("~"), ".sovereign")
    try:
        os.makedirs(d, exist_ok=True); return d
    except Exception:
        d = os.path.join(tempfile.gettempdir(), "sov33_sigil"); os.makedirs(d, exist_ok=True); return d

SIGIL_DIR = _sov_dir()
LEDGER_PATH = os.path.join(SIGIL_DIR, "staging_promotion_ledger.jsonl")

# Optional real asymmetric signing; degrade to SHA256 chain only if unavailable.
try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAVE_ED = True
except Exception:
    _HAVE_ED = False

_KEY_PATH = os.path.join(SIGIL_DIR, "sov_ed25519.key")

def _load_or_make_key():
    if os.path.exists(_KEY_PATH):
        with open(_KEY_PATH, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    k = Ed25519PrivateKey.generate()
    try:
        with open(_KEY_PATH, "wb") as f:
            f.write(k.private_bytes(serialization.Encoding.Raw,
                                    serialization.PrivateFormat.Raw,
                                    serialization.NoEncryption()))
    except Exception:
        pass
    return k


class SignedLedger:
    """Append-only, tamper-evident promotion ledger.

    Integrity: each record carries prev_hash + own_hash (SHA256 chain over the whole file).
    Authenticity: when cryptography is present, each own_hash is also Ed25519-signed.
    """
    def __init__(self, path: str = LEDGER_PATH):
        self.path = path
        self.prev = self._last_hash()
        self._key = _load_or_make_key() if _HAVE_ED else None

    def _last_hash(self) -> str:
        if not os.path.exists(self.path):
            return "genesis"
        last = "genesis"
        with open(self.path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    last = json.loads(line).get("own_hash", last)
                except Exception:
                    continue
        return last

    def append(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        rec = {"seq": self._seq(), "ts": int(time.time()), "prev_hash": self.prev, "payload": payload}
        rec["own_hash"] = hashlib.sha256(
            (self.prev + json.dumps(payload, sort_keys=True)).encode()).hexdigest()
        if self._key is not None:
            rec["ed25519"] = self._key.sign(rec["own_hash"].encode()).hex()
            rec["pubkey"] = self._key.public_key().public_bytes(
                serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()
        else:
            rec["ed25519"] = None
            rec["sig_note"] = "SHA256 chain only (cryptography lib absent) — integrity, not authenticity"
        with open(self.path, "a") as f:
            f.write(json.dumps(rec, sort_keys=True) + "\n")
        self.prev = rec["own_hash"]
        return rec

    def _seq(self) -> int:
        if not os.path.exists(self.path):
            return 0
        return sum(1 for ln in open(self.path) if ln.strip())

    def verify_chain(self) -> bool:
        """Recompute the SHA256 chain end-to-end; return True iff intact."""
        if not os.path.exists(self.path):
            return True
        prev = "genesis"
        with open(self.path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                rec = json.loads(line)
                expect = hashlib.sha256(
                    (prev + json.dumps(rec["payload"], sort_keys=True)).encode()).hexdigest()
                if rec["prev_hash"] != prev or rec["own_hash"] != expect:
                    return False
                prev = rec["own_hash"]
        return True


# ---------------------------------------------------------------------------
# Model versions + evaluation contracts
# ---------------------------------------------------------------------------
@dataclass
class ModelVersion:
    """A deployable model version. `overall_score` is the operator-supplied held-out
    quality number used for the PROMOTE comparison (candidate must beat live)."""
    version_id: str
    overall_score: float = 0.0
    meta: Dict[str, Any] = field(default_factory=dict)


# A "check" scores a ModelVersion on a held-out slice and returns (pass, score, detail).
# The operator plugs real scorers in; the self-test uses deterministic synthetic ones.
CheckFn = Callable[[ModelVersion], "CheckResult"]


@dataclass
class CheckResult:
    passed: bool
    score: float
    detail: str = ""


@dataclass
class Decision:
    decision: str                 # PROMOTE | BLOCK | ESCALATE
    candidate_id: str
    live_id: str
    eunomia_pass: bool
    zeus_pass: bool
    eunomia_score: float
    zeus_score: float
    candidate_score: float
    live_score: float
    human_ratified: bool
    reason: str


class StagingPair:
    """Holds the LIVE model + a CANDIDATE, runs the Eunomia + Zeus staging checks, and
    gates promotion. The live version is NEVER mutated by evaluate(); it is only replaced
    inside promote() when the full gate passes."""

    def __init__(self, live: ModelVersion,
                 eunomia_check: CheckFn,
                 zeus_check: CheckFn,
                 ledger: Optional[SignedLedger] = None):
        self.live = live
        self.candidate: Optional[ModelVersion] = None
        self.eunomia_check = eunomia_check   # ORDER / governance-compliance on governance slice
        self.zeus_check = zeus_check         # PROTECTION / harm-refusal on safety slice
        self.ledger = ledger or SignedLedger()

    def stage(self, candidate: ModelVersion) -> None:
        """Load a candidate into the green slot. Does not touch live."""
        self.candidate = candidate

    def evaluate(self, human_ratified: bool = False) -> Decision:
        """Run both staging brains and apply the promote gate. Records the decision to the
        signed ledger. Returns the Decision WITHOUT mutating live unless PROMOTE fires."""
        if self.candidate is None:
            raise RuntimeError("no candidate staged — call stage(candidate) first")

        e = self.eunomia_check(self.candidate)   # governance held-out slice
        z = self.zeus_check(self.candidate)       # safety held-out slice
        beats_live = self.candidate.overall_score > self.live.overall_score

        # DISAGREEMENT -> escalate. Never average the two archetypes.
        if e.passed != z.passed:
            disagreer = "Zeus (safety regressed)" if e.passed else "Eunomia (governance regressed)"
            decision = "ESCALATE"
            reason = ("Eunomia/Zeus DISAGREE — %s while the other passed; deferring to human "
                      "council. Harness never averages archetypes." % disagreer)
        elif not (e.passed and z.passed):
            decision = "BLOCK"
            fails = []
            if not e.passed: fails.append("Eunomia (governance)")
            if not z.passed: fails.append("Zeus (safety)")
            reason = "BLOCKED — both staging brains must pass; failed: %s" % ", ".join(fails)
        elif not beats_live:
            decision = "BLOCK"
            reason = ("BLOCKED — candidate score %.4f does not beat live %.4f; no measured "
                      "improvement to justify promotion" % (self.candidate.overall_score,
                                                            self.live.overall_score))
        elif not human_ratified:
            decision = "BLOCK"
            reason = ("BLOCKED — both checks pass and candidate beats live, but human ratification "
                      "is required before the live king is replaced (awaiting human_ratified=True)")
        else:
            decision = "PROMOTE"
            reason = ("PROMOTE — Eunomia PASS + Zeus PASS + candidate %.4f > live %.4f + human "
                      "ratified" % (self.candidate.overall_score, self.live.overall_score))

        d = Decision(
            decision=decision,
            candidate_id=self.candidate.version_id,
            live_id=self.live.version_id,
            eunomia_pass=e.passed, zeus_pass=z.passed,
            eunomia_score=round(e.score, 4), zeus_score=round(z.score, 4),
            candidate_score=self.candidate.overall_score,
            live_score=self.live.overall_score,
            human_ratified=human_ratified,
            reason=reason,
        )
        payload = asdict(d)
        payload.update({"eunomia_detail": e.detail, "zeus_detail": z.detail,
                        "kind": "staging_promotion_decision"})
        rec = self.ledger.append(payload)
        d_dict = asdict(d)
        d_dict["sigil_seq"] = rec["seq"]
        d_dict["sigil_hash"] = rec["own_hash"]
        d_dict["sigil_ed25519"] = bool(rec.get("ed25519"))

        # ONLY here does the live king change — atomically swap green into blue.
        if decision == "PROMOTE":
            self.live = self.candidate
            self.candidate = None

        return d, d_dict  # dataclass + serializable dict with sigil provenance


# ---------------------------------------------------------------------------
# Self-test — proves the three gate outcomes on deterministic synthetic scorers.
# ---------------------------------------------------------------------------
def _make_check(passed: bool, score: float, name: str) -> CheckFn:
    def _fn(_cand: ModelVersion) -> CheckResult:
        return CheckResult(passed=passed, score=score,
                           detail="%s synthetic held-out slice -> %s (%.3f)" %
                                  (name, "PASS" if passed else "FAIL", score))
    return _fn


def self_test() -> List[Dict[str, Any]]:
    results = []
    live = ModelVersion("live-v1", overall_score=0.80, meta={"role": "king"})

    # CASE 1: candidate passes BOTH + beats live + human ratified -> PROMOTE
    pair = StagingPair(live=ModelVersion("live-v1", 0.80),
                       eunomia_check=_make_check(True, 0.91, "Eunomia"),
                       zeus_check=_make_check(True, 0.95, "Zeus"))
    pair.stage(ModelVersion("cand-good", overall_score=0.88))
    d1, dd1 = pair.evaluate(human_ratified=True)
    results.append(("promote", dd1, pair.live.version_id))

    # CASE 2: candidate REGRESSES on Zeus (safety) — Eunomia passes, Zeus fails -> DISAGREE -> ESCALATE
    pair2 = StagingPair(live=ModelVersion("live-v1", 0.80),
                        eunomia_check=_make_check(True, 0.90, "Eunomia"),
                        zeus_check=_make_check(False, 0.41, "Zeus"))
    pair2.stage(ModelVersion("cand-zeus-regress", overall_score=0.89))
    d2, dd2 = pair2.evaluate(human_ratified=True)
    results.append(("escalate", dd2, pair2.live.version_id))

    # CASE 3: candidate FAILS Zeus AND Eunomia both fail is a plain BLOCK; but the task asks for a
    # "regresses on Zeus -> blocked" case where the OTHER dimension does not save it.
    # Here Eunomia FAILS too so both agree FAIL -> BLOCK (unambiguous safety+governance regression).
    pair3 = StagingPair(live=ModelVersion("live-v1", 0.80),
                        eunomia_check=_make_check(False, 0.50, "Eunomia"),
                        zeus_check=_make_check(False, 0.38, "Zeus"))
    pair3.stage(ModelVersion("cand-both-regress", overall_score=0.90))
    d3, dd3 = pair3.evaluate(human_ratified=True)
    results.append(("block", dd3, pair3.live.version_id))

    return results


if __name__ == "__main__":
    print("=== sov33_staging_pair.py — Eunomia/Zeus blue-green STAGING harness ===")
    print("    (deployment/governance safety — makes updates safe+verified; NOT new capability)\n")
    outcomes = self_test()
    labels = {"promote": "CASE 1 (pass both + beat live + ratified)",
              "escalate": "CASE 2 (Zeus safety regression, Eunomia passed -> DISAGREE)",
              "block":    "CASE 3 (both regress -> unanimous FAIL)"}
    for key, dd, live_after in outcomes:
        print(f"[{labels[key]}]")
        print(f"  decision      : {dd['decision']}")
        print(f"  eunomia_pass  : {dd['eunomia_pass']}  (score {dd['eunomia_score']})")
        print(f"  zeus_pass     : {dd['zeus_pass']}  (score {dd['zeus_score']})")
        print(f"  cand vs live  : {dd['candidate_score']} vs {dd['live_score']}")
        print(f"  human_ratified: {dd['human_ratified']}")
        print(f"  reason        : {dd['reason']}")
        print(f"  live AFTER    : {live_after}  (live king mutates ONLY on PROMOTE)")
        print(f"  sigil         : seq={dd['sigil_seq']} hash={dd['sigil_hash'][:16]}… ed25519={dd['sigil_ed25519']}")
        print()
    led = SignedLedger()
    print(f"ledger        : {LEDGER_PATH}")
    print(f"chain intact  : {led.verify_chain()}")
    print(f"ed25519 avail : {_HAVE_ED}")
