#!/usr/bin/env python3
"""
publish-card-signatures — put the SIGNATURE BYTES on the public board.

WHY THIS EXISTS (2026-08-26). The published /signed/card_index.json carried 150 entries
whose only claim to integrity was a field reading `"signed": true`. A boolean is not a
signature. No stranger could verify a single card, which quietly voided the one promise the
whole product rests on:

    a reader must be able to check us WITHOUT TRUSTING US and WITHOUT ASKING US.

The signatures were never missing. harness/mine/cards/MANIFEST.json holds all 335 cards with
real Ed25519 signatures, and all 150 published ones verify. They were simply never published.
This closes that gap: it emits the signature, the public key, the exact preimage, and the
recipe to check them, so the board becomes independently verifiable rather than merely
self-asserted.

THE STRUCTURAL RULE THIS OBEYS. A card that does not verify here is not written at all — the
script cannot report success on a path it did not complete. Three outcomes, never two:
published, REFUSED (verification failed), or NO-SOURCE (manifest absent). It exits non-zero
on anything but a fully verified publish, so a broken run cannot masquerade as a clean one.

    python3 scripts/publish-card-signatures.py [--check]

--check verifies and reports without writing (for CI).
"""
import json
import hashlib
import sys
from pathlib import Path

try:
    from nacl.signing import VerifyKey
    from nacl.exceptions import BadSignatureError
except ImportError:
    print("publish-card-signatures: PyNaCl is required (pip install pynacl).", file=sys.stderr)
    sys.exit(2)

REPO = Path(__file__).resolve().parent.parent
MANIFEST = REPO / "harness/mine/cards/MANIFEST.json"
INDEX = REPO / "public/signed/card_index.json"
OUT_CARDS = REPO / "public/signed/cards"
OUT_RECIPE = REPO / "public/signed/HOW-TO-VERIFY.md"
CHECK_ONLY = "--check" in sys.argv

# The canonicalisation is part of the published contract: change it and every previously
# published card stops verifying. It is stated here and in HOW-TO-VERIFY.md, and it is the
# form the cards were actually signed under (confirmed against all 150: id == sha256 of this).
def canonical(body: dict) -> bytes:
    # ensure_ascii=True is stated EXPLICITLY even though it is Python's default. The cards
    # were signed under it, and a verifier in another language does not share that default:
    # JavaScript's JSON.stringify emits non-ASCII characters raw, so it would produce
    # different bytes — and therefore a failed verification — for any card containing one.
    # A canonicalisation rule that relies on one language's defaults is not a published rule.
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def load(p: Path):
    if not p.exists():
        print(f"publish-card-signatures: NO-SOURCE — {p} not found.", file=sys.stderr)
        sys.exit(2)
    return json.loads(p.read_text())


def entries(blob):
    if isinstance(blob, list):
        return blob
    for k in ("cards", "entries"):
        if isinstance(blob, dict) and k in blob:
            return blob[k]
    raise SystemExit("publish-card-signatures: unrecognised container shape.")


man = entries(load(MANIFEST))
idx_blob = load(INDEX)
idx = entries(idx_blob)

by_id = {e["id"]: e for e in man if isinstance(e, dict) and "id" in e}
published_ids = [e["card"] for e in idx]

verified, refused, missing = {}, [], []
for cid in published_ids:
    src = by_id.get(cid)
    if src is None:
        missing.append(cid)
        continue
    body = src["body"]
    pre = canonical(body)
    if hashlib.sha256(pre).hexdigest() != cid:
        refused.append((cid, "id != sha256(canonical body)"))
        continue
    try:
        VerifyKey(bytes.fromhex(src["pubkey"])).verify(pre, bytes.fromhex(src["signature"]))
    except (BadSignatureError, ValueError) as exc:
        refused.append((cid, f"signature did not verify ({type(exc).__name__})"))
        continue
    verified[cid] = src

print(f"  published index entries : {len(published_ids)}")
print(f"  verified                : {len(verified)}")
print(f"  refused                 : {len(refused)}")
print(f"  absent from manifest    : {len(missing)}")

if refused or missing:
    for cid, why in refused[:5]:
        print(f"    REFUSED {cid[:16]}… — {why}", file=sys.stderr)
    for cid in missing[:5]:
        print(f"    NO SOURCE {cid[:16]}… — published but not in the manifest", file=sys.stderr)
    print(
        "\n✗ publish-card-signatures: refusing to publish. Every published card must carry a\n"
        "  signature that verifies here first. A card we cannot verify is one a reader cannot\n"
        "  verify either, and publishing it would repeat the defect this script exists to fix.",
        file=sys.stderr,
    )
    sys.exit(1)

if CHECK_ONLY:
    print("✓ publish-card-signatures --check: all published cards verify.")
    sys.exit(0)

# ---- write the verifiable artefacts -------------------------------------------------
OUT_CARDS.mkdir(parents=True, exist_ok=True)
for cid, src in verified.items():
    (OUT_CARDS / f"{cid}.json").write_text(
        json.dumps(
            {
                "id": cid,
                "alg": "Ed25519",
                "preimage": "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
                "pubkey": src["pubkey"],
                "signature": src["signature"],
                "body": src["body"],
            },
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )

# Enrich the index in place: keep every existing field so nothing downstream breaks, and add
# the bytes that make it checkable. `signed` stays, but it is now the least of the evidence.
for e in idx:
    src = verified[e["card"]]
    e["alg"] = "Ed25519"
    e["pubkey"] = src["pubkey"]
    e["sig"] = src["signature"]
    e["card_url"] = f"/signed/cards/{e['card']}.json"

if isinstance(idx_blob, dict):
    idx_blob["verification"] = {
        "alg": "Ed25519",
        "preimage": "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
        "id_rule": "id == sha256(preimage).hexdigest()",
        "howto": "/signed/HOW-TO-VERIFY.md",
    }
INDEX.write_text(json.dumps(idx_blob, indent=2, sort_keys=True) + "\n")

keys = {src["pubkey"] for src in verified.values()}
OUT_RECIPE.write_text(
    f"""# How to verify a Council of AI measurement card

You do not need our code, our permission, or our word for any of this. Everything below runs
against the published bytes.

**Cards published:** {len(verified)}
**Algorithm:** Ed25519
**Distinct signing keys:** {len(keys)}

## The rule

    id        == sha256(preimage).hexdigest()
    preimage  == json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
    signature == Ed25519(preimage) under the card's `pubkey`

## Check one card

```bash
curl -s https://councilof.ai/signed/cards/<card-id>.json -o card.json
python3 - <<'PY'
import json, hashlib
from nacl.signing import VerifyKey
c = json.load(open('card.json'))
pre = json.dumps(c['body'], sort_keys=True, separators=(',',':'), ensure_ascii=True).encode()
assert hashlib.sha256(pre).hexdigest() == c['id'], 'id does not match its body'
VerifyKey(bytes.fromhex(c['pubkey'])).verify(pre, bytes.fromhex(c['signature']))
print('VALID —', c['id'][:16], c['body'].get('axis'))
PY
```

If the body were altered by one character the hash would not match, and if the signature were
forged the verify would raise. Both failures are loud.

## Check every card

```bash
curl -s https://councilof.ai/signed/card_index.json -o index.json
# each entry carries `sig`, `pubkey` and `card_url`
```

## What this does and does not prove

It proves these exact measurement bodies were signed by the holder of that key and have not
been altered since. **It does not prove the measurement is correct** — that rests on the
published method, the gold labels and the rows, all of which are separately available. A
signature is an integrity claim, not a truth claim, and we do not want it mistaken for one.
""",
)

print(f"✓ wrote {len(verified)} card files, enriched the index, and published the recipe.")
print(f"  {OUT_CARDS.relative_to(REPO)}/ · {INDEX.relative_to(REPO)} · {OUT_RECIPE.relative_to(REPO)}")
