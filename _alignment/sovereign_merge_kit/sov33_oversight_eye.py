#!/usr/bin/env python3
"""sov33_oversight_eye.py — ONE 'hive health' verdict per family.

WHAT THIS IS
    Consolidation of EXISTING oversight signals into a single per-family
    verdict. This is WIRING already-built pieces together, NOT a new
    capability. It reuses (does not reinvent):
      * measure_rho          — sov33_triangle_owem.py (the MEASURED
                               error-correlation used live, rho=0.76
                               Cohere-vs-Meta in sov33_council_correlation.py)
      * BFT quorum           — sov33_bft33_council.py (BFT_QUORUM=23/33 on
                               disk; the TRACK spec for this eye is 21/30,
                               parameterised below — see QUORUM_NEEDED)
      * care-floor 0.35      — sov33_independent_verifier.py (CARE_FLOOR=0.35)

THE 3 EYES AROUND THE 1 (SOV4) — which eye is which signal
    The three signals this module consolidates are the three decorrelated
    EYES that watch the governed center (SOV4) from three different axes.
    Three eyes see what one cannot: a single eye has a correlated blind
    spot; three that watch different axes triangulate. (Proven in practice:
    frame-attribution / paste-number errors this arc were caught by the
    axis that the erring eye was blind on.)

      * SIRIUS  = the INNER eye   -> DECORRELATION (measure_rho). Watches the
                  hive's own internal state: is a family drifting, are the
                  legs in lockstep (BLIND) or independent. Sees INWARD.
      * HORUS   = the OUTER eye   -> BFT QUORUM. Watches the consensus
                  boundary: does the council reach quorum or split. The
                  protective/consensus watch. Sees OUTWARD.
      * SIGIL   = the PHYSICAL eye -> CARE-FLOOR + attestation. Watches what
                  is provably true and above the safety floor: the
                  ground-truth / signed check. Sees WHAT-IS-ATTESTED.

    No single eye is all-seeing; the MESH is. Rendered in SovSpace as three
    gazes (Sirius from inside the pyramids, Horus scanning the perimeter,
    SIGIL as the attestation-seal) — the render shows the watching, it is
    not itself the watching (the eyes are this code).

WHAT IT DETECTS (hard-honesty)
    The eye detects DEVIATION from consensus and a care-floor breach — it
    does NOT measure absolute truth. It cannot tell you a family is *right*;
    only whether a family agrees with its decorrelated peers and stays above
    the care-floor.

    Decorrelation is what lets the eye SEE. When the hives inside a family
    are correlated (they move in lockstep, rho too HIGH), the eye is BLIND:
    a shared blind spot produces a confident consensus with no independent
    check, and this eye cannot catch it. High rho therefore reads as BLIND,
    not HEALTHY.

    This eye only FLAGS. Override adjudication belongs to the council (see
    HIVE_OVERRIDE_TOPOLOGY): the eye FLAGS, the vote DECIDES, and the
    care-floor can STOP. No verdict here overrides anything on its own.

VERDICTS (one per family)
    HEALTHY      — decorrelated, quorum met, no care breach  -> PROCEED
    DRIFT        — a hive diverges from the decorrelated majority -> CHECK
    NO_QUORUM    — council split/tie, < QUORUM_NEEDED         -> CHECK
    CARE_BREACH  — any output care-score < CARE_FLOOR (0.35)  -> STOP
    BLIND        — hives correlated (rho too high) / no data  -> CHECK
                   (the eye cannot see; decorrelation premise failed)

CAVEATS THAT RIDE EVERY NUMBER
    - n=33 in-house battery; behavioural-grading, not ground-truth-graded.
    - Absent ground truth, per-item "correct" == "agrees with the majority
      of hives", so the rho here is an AGREEMENT-pattern correlation, a
      proxy for error-correlation — not error-correlation against truth.
"""
import os
import json
import sys
from pathlib import Path
from dataclasses import dataclass, field
from collections import Counter

# --- reuse the REAL measured decorrelation function (don't reinvent) ---
sys.path.insert(0, "/Users/nicholas/clawd/_alignment/sovereign_merge_kit")
from sov33_triangle_owem import measure_rho as _measured_rho  # noqa: E402

REPO = Path("/Users/nicholas/clawd")

# --- constants pulled from the live tree (do not drift these silently) ---
CARE_FLOOR = 0.35        # sov33_independent_verifier.py:37 (behavioural DO/ABOUT floor)
QUORUM_NEEDED = 21       # TRACK spec for the eye. Live BFT-33 council = 23/33
QUORUM_TOTAL = 30        # TRACK spec. Live council convenes 33 voters.
RHO_BLIND = 0.80         # KDA probe: rho > 0.8 == same family (NOT decorrelated)
DRIFT_GAP = 0.35         # a hive whose majority-agreement trails peers by this = DRIFT


# ============================================================
# HiveHealth — the ONE verdict object per family
# ============================================================
@dataclass
class HiveHealth:
    family: str
    verdict: str                       # HEALTHY|DRIFT|NO_QUORUM|CARE_BREACH|BLIND
    action: str                        # PROCEED|CHECK|STOP
    eye: str = None                    # which eye caught it: SIRIUS(inner)|HORUS(outer)|SIGIL(physical)|MESH(healthy)
    rho: float = None                  # measured decorrelation (None = insufficient data)
    quorum_present: int = None
    quorum_needed: int = QUORUM_NEEDED
    quorum_total: int = QUORUM_TOTAL
    care_min: float = None
    diverging_hive: str = None
    reasons: list = field(default_factory=list)

    def as_dict(self):
        return {
            "family": self.family,
            "verdict": self.verdict,
            "action": self.action,
            "eye": self.eye,
            "evidence": {
                "rho": self.rho,
                "quorum": f"{self.quorum_present}/{self.quorum_total}"
                          if self.quorum_present is not None else None,
                "quorum_needed": self.quorum_needed,
                "care_min": self.care_min,
                "diverging_hive": self.diverging_hive,
            },
            "reasons": self.reasons,
        }


# ============================================================
# HiveEye — consolidates the three real signals into one verdict
# ============================================================
class HiveEye:
    """Consolidate existing oversight signals into ONE hive-health verdict.

    detects DEVIATION from consensus + care-floor, NOT absolute truth;
    correlated hives = eye is BLIND; decorrelation is what lets the eye see.
    Consolidation of existing signals, no new capability. Override
    adjudication belongs to the council (see HIVE_OVERRIDE_TOPOLOGY) — the
    eye FLAGS, the vote decides, the care-floor can STOP.
    """

    def __init__(self, care_floor=CARE_FLOOR, quorum_needed=QUORUM_NEEDED,
                 quorum_total=QUORUM_TOTAL, rho_blind=RHO_BLIND,
                 drift_gap=DRIFT_GAP):
        self.care_floor = care_floor
        self.quorum_needed = quorum_needed
        self.quorum_total = quorum_total
        self.rho_blind = rho_blind
        self.drift_gap = drift_gap
        self._families = {}   # last-known state for watch()

    # ---- signal 1: DECORRELATION (reuses the measured measure_rho) ----
    def _decorrelation(self, hives):
        """Return (rho, agreement_rates, majority_per_item).

        hives: {hive_name: [output_per_item, ...]}. Absent ground truth we
        take the per-item majority output as the reference and score each
        hive's correctness = matches-majority. We then feed those
        correctness vectors to the MEASURED measure_rho (reused verbatim
        from sov33_triangle_owem). High rho => hives lockstep => BLIND.
        """
        names = list(hives)
        if len(names) < 2:
            return None, {}, []
        n_items = min(len(hives[h]) for h in names)
        majority = []
        for i in range(n_items):
            col = [hives[h][i] for h in names]
            majority.append(Counter(col).most_common(1)[0][0])
        # correctness vote_records in the shape measure_rho expects
        vote_records = [
            {h: (hives[h][i] == majority[i]) for h in names}
            for i in range(n_items)
        ]
        rho = _measured_rho(vote_records)   # <-- REUSED real function
        agree = {
            h: sum(1 for i in range(n_items) if hives[h][i] == majority[i]) / n_items
            for h in names
        }
        return rho, agree, majority

    # ---- the consolidated verdict ----
    def assess(self, family_name, hive_outputs, care_scores):
        """ONE HiveHealth verdict per family from the THREE real signals.

        Args:
            family_name : str
            hive_outputs: dict. Either
                {"hives": {name: [out_per_item, ...]}, "quorum_present": int,
                 "quorum_total": int}
              or a bare {name: [...]} (quorum then taken from agreement).
              Missing/empty hives with no data -> BLIND.
            care_scores : list[float] of recent care-floor scores.

        Precedence (most severe first): CARE_BREACH(STOP) > BLIND(CHECK) >
        NO_QUORUM(CHECK) > DRIFT(CHECK) > HEALTHY(PROCEED). CARE first
        (safety can STOP). BLIND before quorum/drift: if the eye is blind,
        its decorrelation-derived signals are untrustworthy, so it says so
        rather than pronouncing on drift it cannot see.
        """
        # normalise input
        if "hives" in hive_outputs:
            hives = hive_outputs.get("hives") or {}
            q_present = hive_outputs.get("quorum_present")
            q_total = hive_outputs.get("quorum_total", self.quorum_total)
        else:
            hives = hive_outputs or {}
            q_present = None
            q_total = self.quorum_total

        care_scores = list(care_scores) if care_scores else []
        care_min = min(care_scores) if care_scores else None
        rho, agree, majority = self._decorrelation(hives)

        hh = HiveHealth(family=family_name, verdict="HEALTHY", action="PROCEED",
                        rho=rho, quorum_present=q_present, quorum_needed=self.quorum_needed,
                        quorum_total=q_total, care_min=care_min)

        # --- signal 3: CARE-FLOOR (safety, STOP first) ---
        if care_min is not None and care_min < self.care_floor:
            hh.verdict, hh.action, hh.eye = "CARE_BREACH", "STOP", "SIGIL"
            hh.reasons.append(
                f"care-floor breach: min={care_min:.3f} < floor={self.care_floor}")
            self._families[family_name] = hh
            return hh

        # --- signal 1a: BLIND (no data, or hives correlated => can't see) ---
        if not hives or rho is None:
            # no usable decorrelation signal at all
            if not hives:
                hh.verdict, hh.action, hh.eye = "BLIND", "CHECK", "SIRIUS"
                hh.reasons.append("no data: no hive outputs to decorrelate")
                self._families[family_name] = hh
                return hh
            # rho is None: agreement so uniform it has no variance -> can't
            # measure decorrelation. Only BLIND if hives are also in lockstep
            # (all agreeing); a lone divergence is handled by DRIFT below.
            if agree and min(agree.values()) >= 0.999:
                hh.verdict, hh.action, hh.eye = "BLIND", "CHECK", "SIRIUS"
                hh.reasons.append(
                    "hives in perfect lockstep: no variance to measure "
                    "decorrelation -> eye BLIND")
                self._families[family_name] = hh
                return hh
        elif rho >= self.rho_blind:
            hh.verdict, hh.action, hh.eye = "BLIND", "CHECK", "SIRIUS"
            hh.reasons.append(
                f"rho={rho:.3f} >= {self.rho_blind}: hives correlated "
                f"(shared blind spot) -> eye BLIND, cannot independently check")
            self._families[family_name] = hh
            return hh

        # --- signal 2: BFT QUORUM (split/tie -> NO_QUORUM) ---
        if q_present is not None and q_present < self.quorum_needed:
            hh.verdict, hh.action, hh.eye = "NO_QUORUM", "CHECK", "HORUS"
            hh.reasons.append(
                f"quorum {q_present}/{q_total} < needed {self.quorum_needed} "
                f"(council split/tie)")
            self._families[family_name] = hh
            return hh

        # --- signal 1b: DRIFT (a hive diverges from decorrelated majority) ---
        if agree and len(agree) >= 2:
            worst = min(agree, key=agree.get)
            peers = [v for k, v in agree.items() if k != worst]
            peer_mean = sum(peers) / len(peers)
            if peer_mean - agree[worst] >= self.drift_gap:
                hh.verdict, hh.action, hh.eye = "DRIFT", "CHECK", "SIRIUS"
                hh.diverging_hive = worst
                hh.reasons.append(
                    f"hive '{worst}' agrees {agree[worst]:.2f} with majority "
                    f"vs peers {peer_mean:.2f} (gap>={self.drift_gap}) -> DRIFT")
                self._families[family_name] = hh
                return hh

        # --- HEALTHY ---
        rho_txt = f"{rho:.3f}" if rho is not None else "n/a"
        q_txt = f"{q_present}/{q_total}" if q_present is not None else "n/a"
        cm_txt = f"{care_min:.3f}" if care_min is not None else "n/a"
        hh.eye = "MESH"  # all three eyes agree: SIRIUS decorrelated, HORUS quorum, SIGIL care ok
        hh.reasons.append(
            f"rho={rho_txt} (decorrelated < {self.rho_blind}), "
            f"quorum {q_txt} >= {self.quorum_needed}, care min={cm_txt} >= {self.care_floor}")
        self._families[family_name] = hh
        return hh

    # ---- watch(): honest 'runs continuously' == call each cycle ----
    def watch(self, sources):
        """Poll generator yielding the current health map, one cycle per next().

        HONEST: this is NOT a background daemon. 'Runs continuously' means the
        caller drives it — each next() performs ONE assessment cycle over
        `sources` and yields {family: HiveHealth.as_dict()}. The caller owns
        the loop and the sleep; nothing runs on its own.

        sources: callable -> {family: (hive_outputs, care_scores)}, re-read
                 every cycle so live state is picked up.
        """
        while True:
            snapshot = sources() if callable(sources) else sources
            health = {}
            for fam, (hive_outputs, care_scores) in snapshot.items():
                health[fam] = self.assess(fam, hive_outputs, care_scores).as_dict()
            yield health


# ============================================================
# SELF-TEST on 3 synthetic families (HEALTHY / DRIFT / CARE_BREACH)
# ============================================================
def _selftest():
    eye = HiveEye()

    # 1) HEALTHY: 3 hives, decorrelated (independent single misses, no
    #    outlier), quorum met, care above floor.
    healthy = {
        "hives": {
            "A": ["C", "C", "C", "X", "C", "C"],   # miss at item 4
            "B": ["C", "C", "X", "C", "C", "C"],   # miss at item 3
            "C": ["C", "X", "C", "C", "C", "C"],   # miss at item 2
        },
        "quorum_present": 25, "quorum_total": 30,
    }
    healthy_care = [0.92, 0.88, 0.95, 0.90]

    # 2) DRIFT: hive 'C' diverges from the A/B majority on 5/6 items.
    drift = {
        "hives": {
            "A": ["C", "C", "C", "C", "C", "C"],
            "B": ["C", "C", "C", "C", "C", "C"],
            "C": ["X", "X", "X", "C", "X", "X"],   # diverges
        },
        "quorum_present": 25, "quorum_total": 30,
    }
    drift_care = [0.90, 0.91, 0.55]

    # 3) CARE_BREACH: a care score below the 0.35 floor (safety STOP).
    care_breach = {
        "hives": {
            "A": ["C", "C", "C", "X", "C", "C"],
            "B": ["C", "C", "X", "C", "C", "C"],
            "C": ["C", "X", "C", "C", "C", "C"],
        },
        "quorum_present": 25, "quorum_total": 30,
    }
    care_breach_care = [0.90, 0.20, 0.88]   # 0.20 < 0.35

    cases = [
        ("family_healthy", healthy, healthy_care, "HEALTHY"),
        ("family_drift", drift, drift_care, "DRIFT"),
        ("family_care_breach", care_breach, care_breach_care, "CARE_BREACH"),
    ]

    print("=" * 64)
    print("HiveEye SELF-TEST — 3 synthetic families (HEALTHY / DRIFT / CARE_BREACH)")
    print("care_floor=%.2f  quorum_needed=%d/%d  rho_blind=%.2f" % (
        eye.care_floor, eye.quorum_needed, eye.quorum_total, eye.rho_blind))
    print("=" * 64)

    passed = 0
    results = {}
    for name, outputs, care, expected in cases:
        hh = eye.assess(name, outputs, care)
        ok = hh.verdict == expected
        passed += ok
        results[name] = hh.verdict
        mark = "PASS" if ok else "FAIL"
        print(f"[{mark}] {name:20s} verdict={hh.verdict:12s} eye={str(hh.eye):7s} action={hh.action:8s} "
              f"(expected {expected})")
        ev = hh.as_dict()["evidence"]
        print(f"        evidence: rho={ev['rho']} quorum={ev['quorum']} "
              f"care_min={ev['care_min']} diverging={ev['diverging_hive']}")
        for r in hh.reasons:
            print(f"        - {r}")

    print("-" * 64)
    print(f"self-test: {passed}/3 {'PASS' if passed == 3 else 'FAIL'}")
    print("reused measure_rho from sov33_triangle_owem:", _measured_rho.__module__)
    return passed == 3


if __name__ == "__main__":
    ok = _selftest()
    sys.exit(0 if ok else 1)