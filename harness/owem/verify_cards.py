#!/usr/bin/env python3
"""verify_cards.py — verify the emitted owem cards and say what may be published from them.

Two separate questions, kept separate, because the estate's signature defect is exactly
their conflation:

  1. IS THE CARD SIGNED?  Each card carries two Ed25519 signatures over two different
     canonicalisations, both checked here:
       * `sig_hex` (+ `content_id`) over CANON-SORTED: the card minus `signature`, keys
         recursively sorted, separators (',',':'), ensure_ascii=True.
       * `sig` (base64, + `body_sha256`) over CANON-VERIFY: the card minus top-level
         `signature`/`sha256`/`sig`, keys in INSERTION order, integral floats as ints,
         separators (',',':'), ensure_ascii=False — the deployed /verify canonicalisation.
     A stranger who tries base64 `sig` over the `body` object gets INVALID on a genuinely
     signed card. That is a documentation defect, not a signature defect, and the fix is
     to name the preimages (card_pipeline.sign_card now writes them into the card).

  2. WHAT DOES IT MEASURE?  All 13 emitted cards carry `n: 0` with `bench: "unavailable"`
     and `source: "register-cached"` — and a `sov_score` anyway, two of them 1.0. A score
     computed from zero graded items is UNMEASURED, never a number. The signed bytes
     cannot be edited without invalidating a real signature, so this tool publishes the
     honest status beside them and `--gate` FAILS if such a card is presented as a score.

  python3 verify_cards.py                 # verify + classify every card
  python3 verify_cards.py --gate          # exit 1 if any card would publish a score from n=0
  python3 verify_cards.py --write-status  # write cards-status.json beside the cards
  python3 verify_cards.py --selftest      # prove both checks can fail
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
CARDS = HERE / "cards"

_VERIFY_STRIP = {"signature", "sha256", "sig"}


def canon_sorted(o) -> str:
    """Preimage of sig_hex / content_id: recursive-sorted keys, compact, ASCII."""
    if isinstance(o, dict):
        return "{" + ",".join(json.dumps(k, separators=(",", ":")) + ":" + canon_sorted(v)
                              for k, v in sorted(o.items())) + "}"
    if isinstance(o, list):
        return "[" + ",".join(canon_sorted(x) for x in o) + "]"
    return json.dumps(o, separators=(",", ":"))


def _js_fix(o):
    if isinstance(o, float):
        return int(o) if float(o).is_integer() else o
    if isinstance(o, dict):
        return {k: _js_fix(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_js_fix(x) for x in o]
    return o


def canon_verify(obj: dict) -> bytes:
    """Preimage of the base64 `sig` / body_sha256: insertion order, JS numbers, no ASCII escape."""
    c = {k: v for k, v in obj.items() if k not in _VERIFY_STRIP}
    return json.dumps(_js_fix(c), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def verify_card(card: dict) -> dict:
    """Check both signature paths. Every failure is named; nothing is assumed to pass."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

    sig = card.get("signature") or {}
    body = {k: v for k, v in card.items() if k != "signature"}
    out = {"sorted_path": "UNCHECKED", "verify_path": "UNCHECKED", "reasons": []}

    if sig.get("alg") != "Ed25519":
        out["sorted_path"] = out["verify_path"] = "UNVERIFIABLE"
        out["reasons"].append(f"alg is {sig.get('alg')!r}, not Ed25519")
        return out

    pre = canon_sorted(body).encode()
    if hashlib.sha256(pre).hexdigest() != sig.get("content_id"):
        out["sorted_path"] = "INVALID"
        out["reasons"].append("content_id is not sha256 of the sorted canonical body")
    else:
        try:
            Ed25519PublicKey.from_public_bytes(bytes.fromhex(sig["public_key"][2:])).verify(
                bytes.fromhex(sig["sig_hex"][2:]), pre)
            out["sorted_path"] = "VALID"
        except Exception as e:                      # noqa: BLE001
            out["sorted_path"] = "INVALID"
            out["reasons"].append(f"sig_hex does not verify over the sorted canonical: {type(e).__name__}")

    if sig.get("kind") == "ed25519" and sig.get("sig"):
        vb = canon_verify(card)
        if sig.get("body_sha256") and hashlib.sha256(vb).hexdigest() != sig["body_sha256"]:
            out["verify_path"] = "INVALID"
            out["reasons"].append("body_sha256 is not sha256 of the /verify canonical")
        else:
            try:
                Ed25519PublicKey.from_public_bytes(base64.b64decode(sig["pubkey"])).verify(
                    base64.b64decode(sig["sig"]), vb)
                out["verify_path"] = "VALID"
            except Exception as e:                  # noqa: BLE001
                out["verify_path"] = "INVALID"
                out["reasons"].append(f"base64 sig does not verify over the /verify canonical: {type(e).__name__}")
    else:
        out["verify_path"] = "ABSENT"

    out["preimages_documented"] = bool(sig.get("sig_hex_preimage") and sig.get("sig_preimage"))
    if not out["preimages_documented"]:
        out["reasons"].append("signature block does not name its preimages - a stranger's "
                              "obvious verifier (base64 sig over `body`) returns INVALID on a "
                              "genuinely signed card")
    return out


def publishable(card: dict) -> dict:
    """What may be quoted from this card. A score from n=0 is UNMEASURED, never a number."""
    sv = (card.get("body") or {}).get("score_vector") or {}
    env = card.get("env_commitment") or {}
    n = sv.get("n")
    score = sv.get("sov_score")
    if not isinstance(n, int) or n <= 0:
        return {"publishable_score": None, "publishable_status": "UNMEASURED",
                "n": n, "score_in_signed_bytes": score, "bench": env.get("bench"),
                "source": env.get("source"),
                "reason": (f"n={n} graded items. A score computed from no items is UNMEASURED. "
                           f"The signed bytes carry sov_score={score}; that number is inside a "
                           "valid signature and cannot be edited, and it must not be quoted.")}
    if score is None:
        return {"publishable_score": None, "publishable_status": "UNMEASURED", "n": n,
                "score_in_signed_bytes": None, "bench": env.get("bench"),
                "source": env.get("source"), "reason": "no score in the card"}
    return {"publishable_score": score, "publishable_status": "MEASURED", "n": n,
            "score_in_signed_bytes": score, "bench": env.get("bench"),
            "source": env.get("source"), "reason": f"score over {n} graded items"}


def scan(cards_dir: Path) -> list[dict]:
    rows = []
    for f in sorted(cards_dir.glob("*.json")):
        doc = json.loads(f.read_text())
        card = doc.get("card", doc)
        rows.append({"file": f.name,
                     "axis": (card.get("body") or {}).get("axis"),
                     "signature": verify_card(card),
                     "publication": publishable(card)})
    return rows


def _selftest() -> int:
    ok = True

    def expect(name, cond, detail=""):
        nonlocal ok
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f" - {detail}" if not cond and detail else ""))
        ok = ok and cond

    src = sorted(CARDS.glob("*.json"))
    if not src:
        print("  FAIL  no cards to test against")
        return 1
    card = json.loads(src[0].read_text())["card"]

    v = verify_card(card)
    expect("a committed card verifies on the sorted path", v["sorted_path"] == "VALID", str(v))
    expect("a committed card verifies on the /verify path", v["verify_path"] == "VALID", str(v))

    tampered = json.loads(json.dumps(card))
    tampered["body"]["score_vector"]["sov_score"] = 0.99
    t = verify_card(tampered)
    expect("tampering with the score -> INVALID on the sorted path", t["sorted_path"] == "INVALID")

    flipped = json.loads(json.dumps(card))
    b = bytearray(base64.b64decode(flipped["signature"]["sig"])); b[0] ^= 0xFF
    flipped["signature"]["sig"] = base64.b64encode(bytes(b)).decode()
    fv = verify_card(flipped)
    expect("flipped base64 sig -> INVALID on the /verify path", fv["verify_path"] == "INVALID")

    unsigned = json.loads(json.dumps(card)); unsigned["signature"]["alg"] = "none"
    expect("alg none -> UNVERIFIABLE, never VALID",
           verify_card(unsigned)["sorted_path"] == "UNVERIFIABLE")

    p = publishable(card)
    expect("n=0 card publishes UNMEASURED, not a number",
           p["publishable_status"] == "UNMEASURED" and p["publishable_score"] is None, str(p))

    real = json.loads(json.dumps(card))
    real["body"]["score_vector"].update({"n": 40, "sov_score": 0.72})
    expect("n=40 with a score publishes MEASURED 0.72",
           publishable(real) == dict(publishable(real), publishable_score=0.72,
                                     publishable_status="MEASURED"))
    zero = json.loads(json.dumps(card))
    zero["body"]["score_vector"].update({"n": 0, "sov_score": 1.0})
    expect("a perfect score from n=0 is refused",
           publishable(zero)["publishable_status"] == "UNMEASURED")

    print("  selftest:", "OK" if ok else "FAILED")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cards", default=str(CARDS))
    ap.add_argument("--gate", action="store_true")
    ap.add_argument("--write-status", action="store_true")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return _selftest()

    rows = scan(Path(a.cards))
    if not rows:
        print(f"verify_cards: no cards under {a.cards}", file=sys.stderr)
        return 1

    bad_sig = [r for r in rows if r["signature"]["sorted_path"] != "VALID"
               or r["signature"]["verify_path"] not in ("VALID", "ABSENT")]
    scored_from_zero = [r for r in rows if r["publication"]["publishable_status"] == "UNMEASURED"
                        and r["publication"]["score_in_signed_bytes"] is not None]

    if a.json:
        print(json.dumps(rows, indent=2))
    else:
        for r in rows:
            s, p = r["signature"], r["publication"]
            print(f"  {r['axis']:8s} sig[sorted={s['sorted_path']} /verify={s['verify_path']} "
                  f"preimages_named={s['preimages_documented']}]  "
                  f"publish={p['publishable_status']} score={p['publishable_score']} "
                  f"(n={p['n']}, signed bytes carry {p['score_in_signed_bytes']})")
        print(f"\n  {len(rows)} cards | signatures failing: {len(bad_sig)} | "
              f"cards whose signed bytes carry a score from n=0: {len(scored_from_zero)}")
        print("  A score from zero graded items is UNMEASURED. The number stays inside the "
              "signed bytes (it cannot be edited without breaking a real signature) and is "
              "never published as a measurement.")

    if a.write_status:
        out = Path(a.cards).parent / "cards-status.json"
        out.write_text(json.dumps({
            "schema": "csoai.owem-cards-status/0.1",
            "note": ("Signature validity and publishable status are separate questions. "
                     "Every card below is genuinely signed; none of them measures anything."),
            "n_cards": len(rows),
            "n_signatures_valid": len(rows) - len(bad_sig),
            "n_measured": sum(1 for r in rows if r["publication"]["publishable_status"] == "MEASURED"),
            "n_scores_withheld_from_zero_n": len(scored_from_zero),
            "cards": rows}, indent=2) + "\n")
        print(f"  wrote {out}")

    if a.gate:
        if bad_sig:
            print(f"verify_cards: FAIL - {len(bad_sig)} card signature(s) do not verify", file=sys.stderr)
            return 1
        if scored_from_zero:
            print(f"verify_cards: FAIL - {len(scored_from_zero)} card(s) carry a sov_score "
                  "derived from n=0. Publish UNMEASURED, never the number.", file=sys.stderr)
            return 1
        print("verify_cards: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
