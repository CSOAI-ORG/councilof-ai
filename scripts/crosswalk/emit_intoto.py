#!/usr/bin/env python3
"""
emit_intoto.py — turn signed GSPC measurement cards into in-toto Statement v1 attestations.

WHY THIS EXISTS
---------------
`functions/api/intoto.ts` already mints in-toto Statements at request time for /api/detect and
/api/detector-interop, and it already owns the predicate type
`https://councilof.ai/attestations/measurement/v1`. Nothing has ever run it over the corpus that
actually carries measurements — the 973 Ed25519-signed cards in
`public/interop/mill-cards-signed/`. So the estate speaks in-toto in two API responses and in no
committed artefact. A supply-chain tool that reads in-toto cannot fetch anything of ours.

This is the half of that work that needs NO key, NO account, and NO owner action: the exact bytes a
holder of the board key would sign, derived from cards that are already signed.

WHAT IT IS NOT
--------------
It is NOT a DSSE envelope. DSSE signing is a separate layer and needs
`did:web:csoai.org#board-attestation-1`, which this process does not hold. An unsigned in-toto
Statement is still a valid Statement; a DSSE envelope with a fabricated signature is not.

It is NOT a new claim. Every value in `predicate.figure` is copied verbatim from the signed card
body. Where an input needed to RECOMPUTE the figure is absent from the card, the predicate says so
in `unreproducible[]` and sets `reproducible: false` — it never smooths a gap over. That mirrors
`measurementPredicate()` in functions/api/intoto.ts, deliberately, so the two agree.

It is NOT a certificate, a grade, a rank, or a conformity assessment. `MEASURED` is our own word and
it means exactly one thing: n>=30 items of a frozen, published bank were scored by a deterministic
grader (scripts/sign_mill_cards.py:107). It is weaker than every certification word in every
vocabulary this maps onto. See docs/interop/VOCABULARY-CROSSWALK.md.

DETERMINISM
-----------
No clock, no network, no randomness, no signing key. Byte-identical on every run, which is why it
can be gated in CI (`--check`). The mill-card bodies carry no timestamp, so nothing here can drift
with the wall clock.

SELECTION
---------
One statement per axis: the lexicographically smallest card id whose body says MEASURED. That is a
representative handful (13-14 files) rather than 973, chosen by a rule a stranger can re-apply.

USAGE
-----
    python3 scripts/crosswalk/emit_intoto.py            # write
    python3 scripts/crosswalk/emit_intoto.py --check    # exit 1 if committed bytes differ
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public" / "interop" / "mill-cards-signed"
DST = ROOT / "public" / "interop" / "crosswalk" / "intoto"

# Byte-for-byte the constants in functions/api/intoto.ts. If either side moves, they must move
# together; scripts/crosswalk/test_emit_intoto.py asserts they still agree.
IN_TOTO_STATEMENT_TYPE = "https://in-toto.io/Statement/v1"
DSSE_PAYLOAD_TYPE = "application/vnd.in-toto+json"
MEASUREMENT_PREDICATE = "https://councilof.ai/attestations/measurement/v1"

# The four inputs measurementPredicate() requires before it will call a figure reproducible.
REQUIRED_INPUTS = ("bank_sha256", "items_sha256", "grader", "n")

# Fields of a mill-card body that are FACTS ABOUT THE RUN. Everything else in the body is house
# copy (brand, public_framing, verify) and is carried in `source`, not in `figure` — a figure is
# what was measured, not what we say about ourselves.
FIGURE_FIELDS = ("axis", "model", "accuracy", "n", "status", "unmeasured", "issuer", "route", "kind")


def canonical(obj) -> bytes:
    """The estate's canonical form: sorted keys, no whitespace, UTF-8, ensure_ascii=False.

    This is the rule in public/schema/card-v0.json and the one sign_mill_cards.py signs under.
    Getting it wrong changes the digest, so it is written once and used everywhere here.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def measurement_predicate(figure: dict, inputs: dict) -> dict:
    """Port of measurementPredicate() from functions/api/intoto.ts.

    Kept as a straight port rather than an improvement: two engines that disagree about what
    'reproducible' means would be worse than one engine in one language.
    """
    missing = [k for k in REQUIRED_INPUTS if inputs.get(k) in (None, "")]
    return {
        "figure": figure,
        "inputs": {k: inputs.get(k) for k in REQUIRED_INPUTS} | {"rerun": inputs.get("rerun")},
        "reproducible": not missing,
        "unreproducible": missing,
        "note": (
            "every input needed to recompute this figure is named above; the signature attests WHEN, "
            "the bank attests WHAT"
            if not missing
            else "cannot be recomputed from this attestation: "
            + ", ".join(missing)
            + " absent. The signature attests only that we published this figure at this time."
        ),
        "never": [
            "a certificate",
            "a grade",
            "a rank",
            "a claim that the signature makes the figure true",
        ],
    }


def statement_for(card: dict) -> dict:
    """One in-toto Statement v1 over one signed measurement card.

    subject[].digest.sha256 is the card's own id, which IS sha256(canonical(body)). The subject
    artefact is therefore the canonical card body — a stranger can fetch the card, re-canonicalise
    its body, and land on the same digest without trusting us for it.
    """
    body = card["body"]
    figure = {k: body[k] for k in FIGURE_FIELDS if k in body}

    inputs = {
        # The card carries n and nothing else of what a recomputation needs. Read from the body;
        # never defaulted, never guessed.
        "bank_sha256": body.get("bank_sha256"),
        "items_sha256": body.get("items_sha256"),
        "grader": body.get("grader"),
        "n": body.get("n"),
        "rerun": body.get("rerun"),
    }

    predicate = measurement_predicate(figure, inputs)
    predicate["source"] = {
        "card_id": card["id"],
        "card_kind": body.get("kind"),
        "preimage_rule": card.get("preimage_rule"),
        "canonical_rule": "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=False)",
        "signature_alg": card.get("alg"),
        "signature_present": bool(card.get("signature")),
        "signed_under_did": card.get("did"),
        # NOT a claim that the signature verified. This producer uses the standard library only and
        # checks the digest binding, which needs no key. Verifying Ed25519 needs the DID document's
        # public key; the command that does it is printed instead of asserted.
        "signature_state_here": "NOT_VERIFIED_BY_THIS_PRODUCER",
        "verify_yourself": [
            "curl -s https://councilof.ai/.well-known/did.json  # take verificationMethod #board-attestation-1",
            "python3 -c \"import json,hashlib;c=json.load(open(CARD));"
            "print(hashlib.sha256(json.dumps(c['body'],sort_keys=True,separators=(',',':'),ensure_ascii=False)"
            ".encode()).hexdigest()==c['id'])\"",
        ],
    }
    predicate["status_vocabulary"] = {
        "MEASURED": "n>=30 items of a frozen published bank scored by a deterministic grader "
        "(scripts/sign_mill_cards.py). Weaker than every certification, accreditation and "
        "conformity term in every vocabulary this maps onto.",
        "UNMEASURED": "n<30, or no run. Absence of a field means UNMEASURED. Empty is never zero.",
        "authority": "https://councilof.ai/api/gspc",
        "crosswalk": "https://councilof.ai/interop/crosswalk/intoto/index.json",
    }
    predicate["not_a_certification"] = True
    predicate["not_a_conformity_assessment"] = True

    return {
        "_type": IN_TOTO_STATEMENT_TYPE,
        "subject": [
            {
                "name": f"gspc-measurement-card/{body.get('axis')}/{body.get('model')}",
                "digest": {"sha256": card["id"]},
            }
        ],
        "predicateType": MEASUREMENT_PREDICATE,
        "predicate": predicate,
    }


def load_cards() -> list[dict]:
    """Every signed mill card, with the digest binding checked in stdlib. HALT on a mismatch.

    A card whose id is not sha256(canonical(body)) is a card whose bytes moved after signing. There
    is no honest statement to emit over one, so this refuses rather than emitting a subject digest
    that names bytes nobody can reproduce.
    """
    cards = []
    for path in sorted(SRC.glob("signed-*.json")):
        card = json.loads(path.read_text(encoding="utf-8"))
        body = card.get("body")
        if not isinstance(body, dict):
            raise SystemExit(f"HALT {path.name}: no body")
        digest = hashlib.sha256(canonical(body)).hexdigest()
        if digest != card.get("id"):
            raise SystemExit(
                f"HALT {path.name}: id {str(card.get('id'))[:16]} != sha256(canonical(body)) "
                f"{digest[:16]} — the bytes moved after signing"
            )
        cards.append(card)
    return cards


def select(cards: list[dict]) -> list[dict]:
    """One MEASURED card per axis: the smallest card id. A rule, not a hand-picked list."""
    best: dict[str, dict] = {}
    for card in cards:
        body = card["body"]
        if body.get("status") != "MEASURED":
            continue
        axis = str(body.get("axis") or "")
        if axis and (axis not in best or card["id"] < best[axis]["id"]):
            best[axis] = card
    return [best[a] for a in sorted(best)]


def render(cards: list[dict]) -> dict[str, str]:
    """path -> exact file bytes. One place decides the bytes, so --check cannot disagree."""
    out: dict[str, str] = {}
    statements = []
    for card in cards:
        stmt = statement_for(card)
        axis = card["body"].get("axis")
        name = f"{axis}-{card['id'][:16]}.intoto.json"
        out[name] = json.dumps(stmt, indent=2, ensure_ascii=False, sort_keys=True) + "\n"
        statements.append(
            {
                "axis": axis,
                "model": card["body"].get("model"),
                "n": card["body"].get("n"),
                "status": card["body"].get("status"),
                "card_id": card["id"],
                "file": name,
                "url": f"https://councilof.ai/interop/crosswalk/intoto/{name}",
            }
        )

    index = {
        "schema": "csoai.intoto-crosswalk-index/0.1",
        "what_this_is": (
            "in-toto Statement v1 attestations DERIVED from Ed25519-signed GSPC measurement cards. "
            "One statement per axis, selected by rule: the lexicographically smallest card id whose "
            "body says MEASURED."
        ),
        "what_this_is_not": [
            "Not a DSSE envelope — these Statements are unsigned, because this producer holds no key.",
            "Not a certification, accreditation, endorsement or conformity assessment.",
            "Not a new claim: every value in predicate.figure is copied from the signed card body.",
            "Not a complete corpus: 973 signed cards exist; this is one representative card per axis.",
        ],
        "statement_type": IN_TOTO_STATEMENT_TYPE,
        "predicate_type": MEASUREMENT_PREDICATE,
        "dsse_payload_type_when_signed": DSSE_PAYLOAD_TYPE,
        "subject_digest_rule": (
            "subject[].digest.sha256 is the signed card's own id, which is "
            "sha256(canonical(body)) under the estate canonical rule."
        ),
        "source_corpus": {
            "path": "public/interop/mill-cards-signed/",
            "signed_cards_total": None,  # filled by caller — a count, never typed
            "measured": None,
            "note": (
                "Separate corpus from the public root (public/cards/, 0 identifier overlap) and from "
                "public/signed/cards/. See public/interop/root-witness-pointer.json."
            ),
        },
        "producer": "scripts/crosswalk/emit_intoto.py",
        "check": "python3 scripts/crosswalk/emit_intoto.py --check",
        # The crosswalk prose lives in the repository, not on the site: councilof.ai serves
        # no /docs/ path, so the councilof.ai URL was a 404 the moment it was published and
        # link-gate caught it. Point a consumer at bytes that exist.
        "crosswalk_doc": "https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/interop/VOCABULARY-CROSSWALK.md",
        "statements": statements,
    }
    return out, index


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true", help="exit 1 if committed bytes differ")
    args = ap.parse_args()

    if not SRC.is_dir():
        print(f"HALT: {SRC} does not exist", file=sys.stderr)
        return 1

    cards = load_cards()
    chosen = select(cards)
    if not chosen:
        print("HALT: no MEASURED card in the corpus", file=sys.stderr)
        return 1

    files, index = render(chosen)
    index["source_corpus"]["signed_cards_total"] = len(cards)
    index["source_corpus"]["measured"] = sum(1 for c in cards if c["body"].get("status") == "MEASURED")
    files["index.json"] = json.dumps(index, indent=2, ensure_ascii=False, sort_keys=True) + "\n"

    if args.check:
        drift = []
        for name, text in sorted(files.items()):
            path = DST / name
            if not path.is_file():
                drift.append(f"MISSING {name}")
            elif path.read_text(encoding="utf-8") != text:
                drift.append(f"DIFFERS {name}")
        extra = sorted(p.name for p in DST.glob("*.json")) if DST.is_dir() else []
        for name in extra:
            if name not in files:
                drift.append(f"ORPHAN  {name}")
        if drift:
            print("\n".join(drift), file=sys.stderr)
            print(f"CHECK FAILED — {len(drift)} file(s); re-run without --check", file=sys.stderr)
            return 1
        print(f"CHECK OK — {len(files)} files, {len(chosen)} axes, {index['source_corpus']['measured']} MEASURED in corpus")
        return 0

    DST.mkdir(parents=True, exist_ok=True)
    for name, text in sorted(files.items()):
        (DST / name).write_text(text, encoding="utf-8")
    print(f"WROTE {len(files)} files to {DST.relative_to(ROOT)} — {len(chosen)} axes")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
