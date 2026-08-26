#!/usr/bin/env python3
"""card_emitter.py — the RECONSTRUCTED GSPC card-factory emitter.

Provenance of this file: the original emitter that produced the 150 published cards
under public/signed/cards/ does not exist in any repo on this estate. This file was
derived by inspecting the 150 published artifacts, not recovered from source.

What it reproduces (proven byte-identical by tools/prove_reproduction.py):
  - the card BODY (all 9 fields), byte-for-byte under the declared canonicalisation
  - the card ID  (= sha256 of those canonical bytes)
  - the prev-chain linkage, from the literal genesis "GSPC-CARD-FACTORY-GENESIS"

What it CANNOT reproduce, and does not pretend to:
  - the SIGNATURE. Signing requires the estate Ed25519 private key, which is held under
    ANVIL isolation and is never present on a workstation. emit() therefore takes the
    signature as an optional input and marks it UNRECONSTRUCTABLE when absent. A card
    emitted here is a body+id proposal, not a signed card.
  - the INPUTS themselves (axis, model, accuracy, created). These are arguments, not
    derivations. See the UNRECONSTRUCTABLE notes on `accuracy` and `created` below.

Usage:
    python3 card_emitter.py --selftest      # re-emit all published cards, compare bytes
"""
import argparse
import hashlib
import json
import os
import sys

# ---------------------------------------------------------------------------
# Constants — measured to be invariant across all 150 published cards.
# Each appears with exactly one distinct value in the published set.
# ---------------------------------------------------------------------------
KIND = "gspc.measurement-card"
ISSUER = "CSOAI Ltd (UK 16939677)"
VERIFY_URL = "https://councilof.ai/verify"
PUBLIC_FRAMING = "13 measured of 14 quotable"
GENESIS = "GSPC-CARD-FACTORY-GENESIS"
ALG = "Ed25519"

# The card declares its own preimage recipe in the `preimage` field. This string is
# reproduced verbatim so re-emitted cards carry the identical self-description.
PREIMAGE_DECL = "json.dumps(body, sort_keys=True, separators=(',',':')).encode('utf-8')"

# Body field order is irrelevant to the bytes (sort_keys=True) but is fixed here so
# the emitted dict reads the same as the published ones.
BODY_FIELDS = (
    "accuracy", "axis", "created", "issuer", "kind",
    "model", "prev", "public_framing", "verify",
)

UNRECONSTRUCTABLE = "UNRECONSTRUCTABLE"


def canonical(body: dict) -> bytes:
    """The signed preimage, exactly as the cards declare it.

    NOTE a latent ambiguity: the declared recipe omits ensure_ascii, so it takes
    Python's default ensure_ascii=True and escapes non-ASCII as \\uXXXX. All 150
    published bodies are pure ASCII, so the ambiguity does not bite them -- but a
    future card carrying a non-ASCII model name would canonicalise differently under
    a verifier that assumed ensure_ascii=False. This is precisely the class of
    ambiguity DSSE PAE removes; see the migration note in the report.
    """
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")


def make_body(axis: str, model: str, accuracy, created: str, prev: str) -> dict:
    """Build a card body from its inputs.

    accuracy: passed through VERBATIM. The emitter applies no rounding. Measured
      evidence: published accuracies carry 0, 1, 3 and 4 decimal places, and at least
      one value (0.148) matches no round(k/n, 4) for any n <= 63. The rounding
      therefore happened upstream, in whatever produced the measurement, and that
      upstream step is UNRECONSTRUCTABLE from the cards alone.

    created: an ISO-8601 UTC wall-clock stamp with microseconds and a literal
      "+00:00" offset. It is the CARD-MINTING instant, not the measurement instant:
      all 150 published stamps fall inside a single 10.1 ms window
      (09:24:39.152331 .. 09:24:39.162429 on 2026-08-19), which is a batch mint over
      pre-existing results, not 150 live measurement runs. The measurement time is
      not carried by the card and is UNRECONSTRUCTABLE from it.
    """
    return {
        "accuracy": accuracy,
        "axis": axis,
        "created": created,
        "issuer": ISSUER,
        "kind": KIND,
        "model": model,
        "prev": prev,
        "public_framing": PUBLIC_FRAMING,
        "verify": VERIFY_URL,
    }


def emit(axis, model, accuracy, created, prev, signature=None, pubkey=None) -> dict:
    """Emit one card. Returns body+id always; signature only if supplied.

    This function never signs. There is no code path here that touches a private key.
    """
    body = make_body(axis, model, accuracy, created, prev)
    card_id = hashlib.sha256(canonical(body)).hexdigest()
    return {
        "alg": ALG,
        "body": body,
        "id": card_id,
        "preimage": PREIMAGE_DECL,
        "pubkey": pubkey if pubkey is not None else UNRECONSTRUCTABLE,
        "signature": signature if signature is not None else UNRECONSTRUCTABLE,
    }


def emit_chain(measurements, prev=GENESIS):
    """Emit a linked chain. `measurements` is an ordered iterable of
    (axis, model, accuracy, created). Each card's prev is the previous card's id.

    The ORDER is an input, not a derivation. For the published 150 the order is
    recoverable after the fact by walking the prev links, but nothing in a card
    explains why that order was chosen.
    """
    out = []
    for axis, model, accuracy, created in measurements:
        card = emit(axis, model, accuracy, created, prev)
        out.append(card)
        prev = card["id"]
    return out


# ---------------------------------------------------------------------------
# self-test
# ---------------------------------------------------------------------------
def _selftest(cards_dir):
    cards = {}
    for fn in os.listdir(cards_dir):
        if not fn.endswith(".json"):
            continue
        with open(os.path.join(cards_dir, fn), "rb") as fh:
            raw = fh.read()
        d = json.loads(raw)
        cards[d["id"]] = (d, raw)

    by_prev = {d["body"]["prev"]: d for d, _ in cards.values()}
    order, cur = [], GENESIS
    while cur in by_prev:
        c = by_prev[cur]
        order.append(c)
        cur = c["id"]

    print(f"published cards      : {len(cards)}")
    print(f"chain walked from genesis: {len(order)}")
    if len(order) != len(cards):
        print("  !! chain does not cover every published card")

    measurements = [(c["body"]["axis"], c["body"]["model"],
                     c["body"]["accuracy"], c["body"]["created"]) for c in order]
    re_emitted = emit_chain(measurements)

    body_ok = id_ok = full_ok = 0
    for orig, new in zip(order, re_emitted):
        if canonical(orig["body"]) == canonical(new["body"]):
            body_ok += 1
        if orig["id"] == new["id"]:
            id_ok += 1
        # full card equality, substituting the two fields we cannot derive
        rebuilt = dict(new)
        rebuilt["pubkey"] = orig["pubkey"]
        rebuilt["signature"] = orig["signature"]
        if json.dumps(rebuilt, sort_keys=True) == json.dumps(orig, sort_keys=True):
            full_ok += 1

    n = len(order)
    print(f"canonical BODY bytes identical : {body_ok}/{n}")
    print(f"card ID identical              : {id_ok}/{n}")
    print(f"whole card identical           : {full_ok}/{n}  (signature+pubkey supplied, not derived)")
    print()
    print("NOT reproduced (by design, no key on this host):")
    print("  signature : UNRECONSTRUCTABLE without the estate private key")
    return 0 if (body_ok == id_ok == full_ok == n and n > 0) else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--cards-dir", default="public/signed/cards")
    a = ap.parse_args()
    if a.selftest:
        return _selftest(a.cards_dir)
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
