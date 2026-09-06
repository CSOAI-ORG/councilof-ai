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
            key.verify(bytes.fromhex(card["signature"]), E.canonical(card["body"]))
        except Exception:
            bad.append(card["id"][:16])
    check(f"all {len(cards)} mill cards verify under did:web:csoai.org#board-attestation-1", bad == [], bad[:5])
    check("the corpus is not empty (a vacuous pass is not a pass)", len(cards) > 100, len(cards))


def main() -> int:
    import tempfile

    test_subject_digest_is_the_card_id()
    with tempfile.TemporaryDirectory() as td:
        test_load_halts_on_moved_bytes(Path(td))
    test_reproducibility_is_read_not_asserted()
    test_status_is_carried_never_invented()
    test_figure_carries_only_fields_the_card_has()
    test_no_certification_language()
    test_constants_match_functions_api_intoto_ts()
    test_output_is_deterministic()
    test_selection_rule()
    test_live_corpus_signatures()
    print()
    if FAILURES:
        print(f"FAILED: {len(FAILURES)} — {', '.join(FAILURES)}")
        return 1
    print("ALL PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
