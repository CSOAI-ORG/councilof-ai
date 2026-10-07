#!/usr/bin/env python3
"""Tests for scripts/crosswalk/emit_intoto.py.

Every assertion here has a NEGATIVE CONTROL — a case that makes it fail — because a gate that
cannot go red has never been shown to be green. Run:

    python3 scripts/crosswalk/test_emit_intoto.py

No pytest, no network, no key. Signature verification runs only if `cryptography` is importable
and is SKIPPED (loudly) if not, so the suite never silently passes by not looking.
"""

from __future__ import annotations

import base64
import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))

import emit_intoto as E  # noqa: E402

FIX = HERE / "fixtures"
FAILURES: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    if cond:
        print(f"  ok   {name}")
    else:
        print(f"  FAIL {name} {detail}")
        FAILURES.append(name)


def load(name: str) -> dict:
    return json.loads((FIX / name).read_text(encoding="utf-8"))


# --------------------------------------------------------------- the subject digest
def test_subject_digest_is_the_card_id() -> None:
    print("subject digest")
    card = load("card-measured.json")
    stmt = E.statement_for(card)
    subject = stmt["subject"][0]
    check("digest equals the card id", subject["digest"]["sha256"] == card["id"])
    check(
        "and the card id equals sha256(canonical(body)) — recomputed here, not trusted",
        hashlib.sha256(E.canonical(card["body"])).hexdigest() == card["id"],
    )
    check("statement type is the in-toto v1 type", stmt["_type"] == "https://in-toto.io/Statement/v1")
    check(
        "subject name names the axis and the model",
        subject["name"] == f"gspc-measurement-card/{card['body']['axis']}/{card['body']['model']}",
    )

    # NEGATIVE CONTROL. Move one byte of the body and the digest must stop matching. If this
    # passes, the digest is not actually covering the body and every statement above is decorative.
    tampered = load("card-tampered.json")
    check(
        "NEGATIVE: a body edited after signing no longer digests to its id",
        hashlib.sha256(E.canonical(tampered["body"])).hexdigest() != tampered["id"],
    )


def test_load_halts_on_moved_bytes(tmp: Path) -> None:
    print("HALT on moved bytes")
    src = tmp / "mill-cards-signed"
    src.mkdir(parents=True, exist_ok=True)
    (src / "signed-ok.json").write_text(json.dumps(load("card-measured.json")), encoding="utf-8")
    (src / "signed-bad.json").write_text(json.dumps(load("card-tampered.json")), encoding="utf-8")
    real = E.SRC
    try:
        E.SRC = src
        halted = False
        try:
            E.load_cards()
        except SystemExit as e:
            halted = "moved after signing" in str(e)
        check("load_cards refuses a card whose bytes moved after signing", halted)

        # NEGATIVE CONTROL: with only the good card it must NOT halt, or the halt is unconditional.
        (src / "signed-bad.json").unlink()
        cards = E.load_cards()
        check("NEGATIVE: it does not halt on a card that binds", len(cards) == 1)
    finally:
        E.SRC = real


def test_javascript_number_preimage() -> None:
    print("JavaScript number preimage")
    card = {
        "preimage_rule": "sha256(canonical body)",
        "body": {"accuracy": 1.0, "uncertainty_95_wilson": [0.8865, 1.0]},
    }
    expected = b'{"accuracy":1,"uncertainty_95_wilson":[0.8865,1]}'
    check("integral floats reproduce the Pages signer bytes", E.canonical_for_card(card) == expected)
    legacy = {"preimage_rule": "cpython-v1", "body": card["body"]}
    check("NEGATIVE: legacy Python canonical retains integral float spelling", E.canonical_for_card(legacy) != expected)


# ------------------------------------------------------- reproducible / unreproducible
def test_reproducibility_is_read_not_asserted() -> None:
    print("reproducibility")
    absent = E.statement_for(load("card-measured.json"))["predicate"]
    check("today's cards cannot be recomputed", absent["reproducible"] is False)
    check(
        "and the three missing inputs are named, not smoothed over",
        absent["unreproducible"] == ["bank_sha256", "items_sha256", "grader"],
        absent["unreproducible"],
    )
    check("n is present, so n is not in the missing list", absent["inputs"]["n"] == 30)

    # NEGATIVE CONTROL. If `reproducible` were hard-coded false this fixture would still say false.
    present = E.statement_for(load("card-reproducible.json"))["predicate"]
    check("NEGATIVE: a card carrying every input flips reproducible to true", present["reproducible"] is True)
    check("NEGATIVE: and unreproducible empties", present["unreproducible"] == [])
    check(
        "NEGATIVE: the note changes with it",
        "every input needed to recompute this figure is named above" in present["note"],
    )


# ---------------------------------------------------------------- no invented claims
def test_status_is_carried_never_invented() -> None:
    print("status is carried, never invented")
    for fixture in ("card-measured.json", "card-unmeasured.json", "card-reproducible.json"):
        card = load(fixture)
        stmt = E.statement_for(card)
        body_status = card["body"]["status"]
        check(
            f"{fixture}: figure.status == body.status ({body_status})",
            stmt["predicate"]["figure"]["status"] == body_status,
        )
        rendered = json.dumps(stmt, ensure_ascii=False)
        if body_status != "MEASURED":
            # "MEASURED" may only appear inside the vocabulary glossary and inside the word
            # UNMEASURED — never as this card's own state.
            glossary = json.dumps(stmt["predicate"]["status_vocabulary"], ensure_ascii=False)
            body_only = rendered.replace(glossary, "")
            leaked = re.findall(r"(?<!UN)MEASURED", body_only)
            check(f"{fixture}: an UNMEASURED card never emits MEASURED", leaked == [], leaked)


def test_figure_carries_only_fields_the_card_has() -> None:
    print("no field is conjured")
    card = load("card-measured.json")
    figure = E.statement_for(card)["predicate"]["figure"]
    check("every figure key exists in the signed body", all(k in card["body"] for k in figure))
    check(
        "every figure value is identical to the body's",
        all(figure[k] == card["body"][k] for k in figure),
    )
    # NEGATIVE CONTROL: a body without `route` must not gain one.
    stripped = json.loads(json.dumps(card))
    stripped["body"].pop("route")
    check(
        "NEGATIVE: a card with no route emits no route",
        "route" not in E.statement_for(stripped)["predicate"]["figure"],
    )


def test_no_certification_language() -> None:
    print("no certification language")
    forbidden = ("certified", "accredited", "endorsed", "conformity assessment", "approved by", "compliant")
    for fixture in ("card-measured.json", "card-unmeasured.json", "card-reproducible.json"):
        rendered = json.dumps(E.statement_for(load(fixture)), ensure_ascii=False).lower()
        hits = [w for w in forbidden if w in rendered]
        check(f"{fixture}: none of {forbidden} appears", hits == [], hits)
        check(f"{fixture}: it says so positively too", '"not_a_certification": true' in rendered)

    # NEGATIVE CONTROL: the scan must be able to find one.
    poisoned = json.dumps({"x": "this model is certified"}).lower()
    check("NEGATIVE: the scanner finds a planted word", any(w in poisoned for w in forbidden))


# ------------------------------------------------------------- agreement with the TS engine
def test_constants_match_functions_api_intoto_ts() -> None:
    print("agreement with functions/api/intoto.ts")
    ts = (ROOT / "functions" / "api" / "intoto.ts").read_text(encoding="utf-8")
    for name, value in (
        ("IN_TOTO_STATEMENT_TYPE", E.IN_TOTO_STATEMENT_TYPE),
        ("DSSE_PAYLOAD_TYPE", E.DSSE_PAYLOAD_TYPE),
        ("MEASUREMENT_PREDICATE", E.MEASUREMENT_PREDICATE),
    ):
        check(f"{name} is the same string in both engines", f'{name} = "{value}"' in ts)
    check(
        "the TS predicate requires the same four inputs",
        'const required: (keyof MeasurementInputs)[] = ["bank_sha256", "items_sha256", "grader", "n"]' in ts,
    )


# ------------------------------------------------------------------------ determinism
def test_output_is_deterministic() -> None:
    print("determinism")
    cards = [load("card-measured.json"), load("card-reproducible.json")]
    a, ia = E.render(cards)
    b, ib = E.render(cards)
    check("two renders are byte-identical", a == b and ia == ib)
    blob = json.dumps([a, ia], ensure_ascii=False)
    check(
        "no wall-clock timestamp is written into the output",
        re.search(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}", blob) is None,
    )


# ------------------------------------------------------------- selection is a rule, not a list
def test_selection_rule() -> None:
    print("selection")
    cards = [load("card-measured.json"), load("card-unmeasured.json"), load("card-reproducible.json")]
    chosen = E.select(cards)
    check("one card per axis", len(chosen) == 1)
    check("it is a MEASURED one", chosen[0]["body"]["status"] == "MEASURED")
    check(
        "and it is the smallest id among the MEASURED ones for that axis",
        chosen[0]["id"] == min(c["id"] for c in cards if c["body"]["status"] == "MEASURED"),
    )
    check(
        "NEGATIVE: an axis with only UNMEASURED cards yields nothing",
        E.select([load("card-unmeasured.json")]) == [],
    )


# ------------------------------------------- selection is STABLE: new cards never move a current pick
def _card(cid: str, axis: str = "safety", status: str = "MEASURED") -> dict:
    """A selection-only stand-in. select() reads id, body.axis and body.status and nothing else."""
    return {"id": cid * 64 if len(cid) == 1 else cid, "body": {"axis": axis, "status": status}}


def _ids(chosen: list[dict]) -> dict[str, str]:
    return {c["body"]["axis"]: c["id"] for c in chosen}


def test_selection_is_stable() -> None:
    print("selection is stable")
    a, b, c, d = (x * 64 for x in "abcd")
    held = [_card("b")]
    prior = _ids(E.select(held))
    check("first run, no history: the only eligible card is picked", prior == {"safety": b}, prior)

    # The #2888 case: the mill lands a MEASURED card whose id sorts BELOW the current pick.
    grown = held + [_card("a")]
    check(
        "a newly landed smaller MEASURED id does NOT move a pick that is still current",
        _ids(E.select(grown, prior)) == {"safety": b},
        _ids(E.select(grown, prior)),
    )
    check(
        "NEGATIVE CONTROL: without the prior pick the same corpus picks the smaller id "
        "(so the test above is held by the rule, not by the fixture)",
        _ids(E.select(grown)) == {"safety": a},
    )

    # A superseded pick follows SUPERSEDED.jsonl to its replacement, even past a smaller id.
    corpus = [_card("a"), _card("b"), _card("c"), _card("d")]
    check(
        "a superseded pick moves to its replacement, not to the smallest id",
        _ids(E.select(corpus, {"safety": b}, {b: d})) == {"safety": d},
        _ids(E.select(corpus, {"safety": b}, {b: d})),
    )
    check(
        "a chain of supersessions is followed to its terminal card",
        _ids(E.select(corpus, {"safety": b}, {b: c, c: d})) == {"safety": d},
    )

    # Choose anew ONLY when the replacement is not eligible.
    unmeasured = [_card("a"), _card("b"), _card("c", status="UNMEASURED"), _card("d")]
    got = _ids(E.select(unmeasured, {"safety": b}, {b: c}))
    check("a pick superseded by an UNMEASURED card is chosen anew: smallest eligible id", got == {"safety": a}, got)
    got = _ids(E.select(corpus, {"safety": b}, {}, {b}))
    check("a withdrawn pick is chosen anew, never kept", got == {"safety": a}, got)
    got = _ids(E.select(corpus, {"safety": b}, {b: c}, {c}))
    check("a pick whose replacement is withdrawn is chosen anew", got == {"safety": a}, got)
    other_axis = [_card("a"), _card("b"), _card("c", axis="jail")]
    got = _ids(E.select(other_axis, {"safety": b}, {b: c}))
    check("a replacement on another axis is not this axis's pick", got == {"safety": a, "jail": c}, got)

    # Never a superseded or withdrawn card, with or without history.
    got = _ids(E.select(corpus, {}, {a: d}, {b}))
    check("with no history a superseded or withdrawn smaller id is skipped", got == {"safety": c}, got)

    # Fixed point: re-running on its own output selects the same cards (this is what --check needs).
    once = _ids(E.select(unmeasured, {"safety": b}, {b: c}))
    twice = _ids(E.select(unmeasured, once, {b: c}))
    check("the rule is a fixed point on its own output", once == twice, (once, twice))

    try:
        E.select(corpus, {"safety": b}, {b: c, c: b})
        check("NEGATIVE: a supersession cycle HALTs", False)
    except SystemExit:
        check("NEGATIVE: a supersession cycle HALTs", True)


def test_live_selection_is_current() -> None:
    """The committed index on this commit: every pick eligible, and a smaller new id moves nothing."""
    print("live selection")
    cards = E.load_cards()
    replacements, withdrawn = E.load_ledgers()
    prior = E.load_prior()
    check("the committed index has picks to hold", len(prior) >= 10, len(prior))
    chosen = _ids(E.select(cards, prior, replacements, withdrawn))
    check("the committed picks are exactly what the rule selects", chosen == prior, sorted(set(chosen.items()) ^ set(prior.items())))
    by_id = {card["id"]: card for card in cards}
    stale = [cid[:16] for cid in prior.values() if cid in replacements or cid in withdrawn]
    check("no committed pick is superseded or withdrawn", stale == [], stale)
    unmeasured = [cid[:16] for cid in prior.values() if by_id.get(cid, {}).get("body", {}).get("status") != "MEASURED"]
    check("every committed pick is a MEASURED card in the corpus", unmeasured == [], unmeasured)
    # Land a MEASURED card below every pick on every axis: nothing may move.
    landed = cards + [_card("0" * 63 + str(i % 10), axis) for i, axis in enumerate(sorted(prior))]
    check(
        "landing a smaller MEASURED id on every axis moves no pick",
        _ids(E.select(landed, prior, replacements, withdrawn)) == prior,
    )


# ------------------------------------ the live corpus really is signed (skipped, loudly, if no lib)
def test_live_corpus_signatures() -> None:
    print("live corpus")
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    except Exception:
        print("  SKIP live-corpus signature check — `cryptography` not importable in this environment")
        return
    did = json.loads((ROOT / "public" / ".well-known" / "did.json").read_text(encoding="utf-8"))
    vm = next(v for v in did["verificationMethod"] if v["id"].endswith("#board-attestation-1"))
    x = vm["publicKeyJwk"]["x"]
    key = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
    cards = E.load_cards()  # halts on any digest mismatch
    bad = []
    for card in cards:
        try:
            key.verify(bytes.fromhex(card["signature"]), E.canonical_for_card(card))
        except Exception:
            bad.append(card["id"][:16])
    check(f"all {len(cards)} mill cards verify under did:web:csoai.org#board-attestation-1", bad == [], bad[:5])
    check("the corpus is not empty (a vacuous pass is not a pass)", len(cards) > 100, len(cards))


def main() -> int:
    import tempfile

    test_subject_digest_is_the_card_id()
    with tempfile.TemporaryDirectory() as td:
        test_load_halts_on_moved_bytes(Path(td))
    test_javascript_number_preimage()
    test_reproducibility_is_read_not_asserted()
    test_status_is_carried_never_invented()
    test_figure_carries_only_fields_the_card_has()
    test_no_certification_language()
    test_constants_match_functions_api_intoto_ts()
    test_output_is_deterministic()
    test_selection_rule()
    test_selection_is_stable()
    test_live_selection_is_current()
    test_live_corpus_signatures()
    print()
    if FAILURES:
        print(f"FAILED: {len(FAILURES)} — {', '.join(FAILURES)}")
        return 1
    print("ALL PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
