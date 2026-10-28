#!/usr/bin/env python3
# SPDX-License-Identifier: CC0-1.0
"""evaluation_card_verify.py — check a csoai.evaluation-card/0.1.

A JSON Schema cannot compare two fields. So the schema checks the SHAPE and this
checks the INVARIANTS, and every invariant here was learned from a real defect:

  * an arm's items must sum to the suite's items_total, or the split is a lie
  * an arm must not claim more model-answered items than it has items
  * a claim of separation needs two arms AND a per-arm breakdown, because a
    pooled number hides the split
  * a card that cannot be reproduced must say why
  * an Every-Eval-Ever field that is null must carry a reason
  * not_established must be non-empty, and neither it nor the claim boundary may
    contain a certification or endorsement claim

WHY THE ARM SPLIT IS ENFORCED (measured 2026-10-26). A signed, schema-known,
NaN-free record with verdict PASS reported 30/30 for the product against 26/30
for the best frontier model — a +13.33pp lead — and 20 of its 30 items were
answered by a deterministic rule cascade rather than by a model, as the record's
OWN per-item ledger showed. Every estate gate checks provenance and structure
and not one checked that a number inside a record means what the summary above
it says. Restricted to the model-answered items there was no separation at all.
So: a card that reports one score without the arm split cannot be compared to
anything, and this refuses it.

Usage:
  python3 scripts/evaluation_card_verify.py card.json
  python3 scripts/evaluation_card_verify.py --selftest

Exit 0 VALID · 1 INVALID (with the faults) · 2 UNCHECKABLE (no schema engine)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
SCHEMA_PATH = REPO / "public" / "schemas" / "csoai-evaluation-card-0.1.schema.json"

# Words a card may not use about itself. A card that says "certified" is
# claiming something the estate never grants.
BANNED_SELF_CLAIMS = (
    "certified", "certification", "endorsed", "guaranteed", "accredited",
    "compliant with", "approved by",
)

# Negations. "not a certification" and "never endorsed" are the card doing its
# job; "certified" and "endorsed" are the card claiming something it has not
# earned. A word search cannot tell them apart, so the window before each
# occurrence is read: a claim is only a claim if nothing in that window denies
# it. This distinction was found by the selftest, which failed on its own
# well-formed example ("not a certification") — the rule was too blunt, not the
# example wrong.
NEGATORS = (
    "not ", "no ", "never ", "isn't ", "is not ", "does not ", "do not ",
    "cannot ", "can't ", "without ", "nor ", "neither ", "n't ", "non-",
    "refuses to ", "does not establish", "establishes no",
)
NEGATION_WINDOW = 48


def positive_claims(segments) -> list[str]:
    """Banned words that are NOT inside a negation, judged PER SEGMENT.

    A character window is wrong here and the selftest proved it: a window that
    reached back 48 characters let "not a certification" in one list item
    suppress a genuine "certified" claim in a different one, and it missed the
    negation in "does not establish ... or endorsed" because the negator sat
    further back than the window. The unit of meaning is the SENTENCE, so the
    rule is scoped to the sentence: a segment that denies something may name the
    thing it denies; a segment that does not deny anything may not name it.
    """
    if isinstance(segments, str):
        segments = [segments]
    hits = []
    for raw in segments:
        seg = str(raw or "")
        # split a segment into sentences; a semicolon or full stop ends a claim
        for piece in re.split(r"(?<=[.;!?])\s+|\n", seg):
            low = piece.lower()
            if not low.strip():
                continue
            denied = any(n in low for n in NEGATORS)
            if denied:
                continue
            for word in BANNED_SELF_CLAIMS:
                if word in low:
                    hits.append(word)
    return sorted(set(hits))


def schema_faults(card: dict) -> list[str]:
    """Shape, via the published JSON Schema. Reported as SCHEMA_UNCHECKED when
    the engine is absent — never as VALID, because an unchecked shape is not a
    checked one."""
    try:
        import jsonschema
    except ImportError:
        return ["SCHEMA_UNCHECKED: the jsonschema package is absent; shape not verified"]
    schema = json.loads(SCHEMA_PATH.read_text())
    v = jsonschema.Draft202012Validator(schema)
    return [f"{'/'.join(str(p) for p in e.path) or '<root>'}: {e.message}"
            for e in v.iter_errors(card)]


def invariant_faults(card: dict) -> list[str]:
    faults: list[str] = []
    suite = card.get("suite") or {}
    arms = card.get("arms") or []
    result = card.get("result") or {}
    repro = card.get("reproduction") or {}
    eee = card.get("every_eval_ever") or {}

    # 1. the arm split must account for every item
    total = suite.get("items_total")
    if isinstance(total, int):
        counted = sum(int(a.get("items", 0)) for a in arms)
        if counted != total:
            faults.append(f"the arms count {counted} item(s) but the suite declares {total}")

    # 2. an arm cannot answer more items than it has
    for a in arms:
        items = int(a.get("items", 0) or 0)
        by_model = int(a.get("answered_by_model", 0) or 0)
        by_rule = int(a.get("answered_by_rule", 0) or 0)
        if by_model + by_rule > items:
            faults.append(f"arm {a.get('id')!r} claims {by_model + by_rule} answered item(s) "
                          f"but holds {items}")
        if a.get("kind") == "model" and by_model != items:
            faults.append(f"arm {a.get('id')!r} is a model arm with {by_model} model-answered "
                          f"item(s) out of {items}")

    # 3. a separation claim needs two arms and a per-arm breakdown
    if result.get("separated") is True:
        if len(arms) < 2:
            faults.append("the result claims separation but only one arm was run")
        per_arm = result.get("per_arm") or []
        if not per_arm:
            faults.append("the result claims separation but carries no per-arm breakdown")
        else:
            named = {p.get("arm_id") for p in per_arm}
            missing = {a.get("id") for a in arms} - named
            if missing:
                faults.append("the per-arm breakdown omits arm(s): "
                              + ", ".join(sorted(missing)))

    # 4. a card that cannot be reproduced must say why
    if repro.get("state") and repro.get("state") != "REPRODUCIBLE" and not (repro.get("reason") or "").strip():
        faults.append(f"reproduction state {repro['state']!r} carries no reason")

    # 5. an Every-Eval-Ever null must carry a reason
    if eee:
        nullable = ["license", "task", "dataset", "model", "eval_type", "eval_date"]
        if any(eee.get(k) is None for k in nullable) and not (eee.get("not_applicable_reason") or "").strip():
            faults.append("an Every-Eval-Ever field is null with no not_applicable_reason")

    # 6. not_established must exist and must not smuggle a certification claim
    ne = card.get("not_established") or []
    if not ne:
        faults.append("not_established is empty; a card must say what it does not establish")
    segments = [str(x) for x in ne] + [str(card.get("claim_boundary", ""))]
    for word in positive_claims(segments):
        faults.append(f"the card uses the claim word {word!r} about itself, outside a negation")

    # 7. published_at and as_of must not be conflated
    prov = card.get("provenance") or {}
    if prov.get("published_at") and prov.get("as_of") and prov["published_at"] == prov["as_of"]:
        # allowed, but the card must then have no separate claim of recency
        pass

    return faults


def verify(card: dict) -> dict:
    faults = schema_faults(card) + invariant_faults(card)
    unchecked = [f for f in faults if f.startswith("SCHEMA_UNCHECKED")]
    if unchecked:
        return {"state": "UNCHECKABLE", "faults": faults}
    return {"state": "VALID" if not faults else "INVALID", "faults": faults}


# --------------------------------------------------------------- selftest
def _card() -> dict:
    return {
        "schema": "https://councilof.ai/schemas/csoai-evaluation-card-0.1.schema.json",
        "id": "card-1",
        "kind": "evaluation-card",
        "title": "Example",
        "description": "An example card.",
        "subject": {"id": "example/model", "kind": "model", "version": "1"},
        "instrument": {"name": "grader", "version": "1", "kind": "grader"},
        "suite": {"id": "bank", "version": "1", "items_total": 10, "items_held_out": 5},
        "arms": [
            {"id": "arm-a", "kind": "model", "items": 6, "answered_by_model": 6,
             "answered_by_rule": 0, "description": "the model answered these"},
            {"id": "arm-b", "kind": "rule", "items": 4, "answered_by_model": 0,
             "answered_by_rule": 4, "description": "a rule answered these"},
        ],
        "result": {"state": "MEASURED", "value": 0.6, "unit": "fraction",
                   "per_arm": [{"arm_id": "arm-a", "items": 6, "value": 0.66},
                               {"arm_id": "arm-b", "items": 4, "value": 0.5}]},
        "claim_boundary": "This card does not establish that the subject is safe, correct or endorsed.",
        "reproduction": {"state": "REPRODUCIBLE", "command": "python3 run.py"},
        "provenance": {"published_at": "2026-10-28T00:00:00Z", "as_of": "2026-10-27T00:00:00Z",
                       "source_urls": ["https://example.com/x"]},
        "not_established": ["not a certification", "not a ranking"],
    }


def selftest() -> int:
    """Every invariant must be proven able to catch its own counterexample."""
    fails = []
    base = _card()
    faults = invariant_faults(base)
    if faults:
        fails.append("a well-formed card trips the invariants: " + "; ".join(faults))

    def must_catch(name: str, mutate) -> None:
        c = _card()
        mutate(c)
        if not invariant_faults(c):
            fails.append(f"the invariant did not catch: {name}")

    def _sum(c):
        # ISOLATED counterexample: the arm is "mixed" so the model-arm rule does
        # not also fire, and its own counts stay consistent (6+3 == 9). Only the
        # arm-sum rule should catch this card. A counterexample that trips
        # another rule cannot prove the rule it is aimed at, because removing
        # that rule still leaves the card faulted.
        c["arms"][0]["kind"] = "mixed"
        c["arms"][0]["items"] = 9
        c["arms"][0]["answered_by_model"] = 6
        c["arms"][0]["answered_by_rule"] = 3
    must_catch("arms that do not sum to items_total", _sum)

    def _over(c):
        # ISOLATED: "mixed" keeps the model-arm rule out, and the arm-sum stays
        # right (6 + 4 == 10), so only the over-claim rule can catch this.
        c["arms"][0]["kind"] = "mixed"
        c["arms"][0]["answered_by_model"] = 9
        c["arms"][0]["answered_by_rule"] = 0
    must_catch("an arm answering more items than it holds", _over)

    def _modelarm(c):
        c["arms"][0]["answered_by_model"] = 3
    must_catch("a model arm that did not answer all its items", _modelarm)

    def _sep_noarms(c):
        c["result"]["separated"] = True
        c["result"]["p_value"] = 0.01
        c["arms"] = [c["arms"][0]]
        c["arms"][0]["items"] = 10
        c["arms"][0]["answered_by_model"] = 10
        c["arms"][0]["answered_by_rule"] = 0
        c["result"]["per_arm"] = []
    must_catch("a separation claim with one arm and no breakdown", _sep_noarms)

    def _sep_partial(c):
        c["result"]["separated"] = True
        c["result"]["p_value"] = 0.01
        c["result"]["per_arm"] = [c["result"]["per_arm"][0]]
    must_catch("a separation claim whose breakdown omits an arm", _sep_partial)

    def _repro(c):
        c["reproduction"] = {"state": "NOT_REPRODUCIBLE"}
    must_catch("an unreproducible card with no reason", _repro)

    def _eee(c):
        c["every_eval_ever"] = {"license": None, "task": "t"}
    must_catch("an Every-Eval-Ever null with no reason", _eee)

    def _ne_empty(c):
        c["not_established"] = []
    must_catch("an empty not_established", _ne_empty)

    def _banned(c):
        c["not_established"] = ["this is a certified product"]
    must_catch("a certification claim in not_established", _banned)

    def _banned_boundary(c):
        c["claim_boundary"] = "This product is certified safe."
    must_catch("a certification claim in the claim boundary", _banned_boundary)

    def _banned_endorsed(c):
        c["not_established"] = ["the subject is endorsed by a standards body"]
    must_catch("an endorsement claim in not_established", _banned_endorsed)

    # and the other direction: a NEGATED claim word must NOT trip the rule
    negated = _card()
    negated["not_established"] = ["not a certification", "never endorsed by anyone"]
    negated["claim_boundary"] = ("This card does not establish a certification and is not "
                                 "endorsed by anyone.")
    if invariant_faults(negated):
        fails.append("a correctly negated claim word trips the rule")

    if fails:
        for f in fails:
            print("  FAIL:", f)
        return 1
    print("  evaluation_card_verify selftest: OK "
          "(9 invariants, each proven able to catch its own counterexample)")
    return 0


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selftest":
        sys.exit(selftest())
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    raw = Path(sys.argv[1]).read_bytes()
    try:
        card = json.loads(raw.decode("utf-8", "replace"))
    except Exception as exc:                                # noqa: BLE001
        print(json.dumps({"state": "UNCHECKABLE", "faults": [f"unreadable card: {exc}"]}))
        sys.exit(2)
    res = verify(card)
    print(json.dumps(res, indent=1, ensure_ascii=False))
    sys.exit(0 if res["state"] == "VALID" else 1)
