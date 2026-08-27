#!/usr/bin/env python3
"""
publish-chain-manifest.py — publish the FULL chain skeleton, including withheld cards.

THE PROBLEM THIS SOLVES. Sumit Ahuja put it precisely on the Agentproto list: prior existence
is necessary and not sufficient, because a party can hold several candidates and present one
afterwards. Publishing a subset of a hash chain has the same shape — a withheld card is not
distinguishable from a card that never existed, so the publisher can silently select.

We publish 313 of 335 cards. The other 22 have an internal identifier inside their SIGNED
body, and the body is what the signature is over, so redacting is impossible without
invalidating the id. Withholding them was correct; leaving their POSITIONS invisible was not.

THE FIX. A card's id is sha256 of its canonical body, and each card names its parent by id in
`body.prev`. So the CHAIN is verifiable from ids alone — no bodies required. This publishes
every one of the 335 positions: id, prev, signature, pubkey, and whether the body is
published. A withheld card becomes a visible tombstone rather than an absence.

What that buys a reader, and it is the whole point:
  - Walk head -> genesis. All 335 links must resolve. A silently dropped card BREAKS THE WALK.
  - So we can no longer withhold anything without it being visible as a withheld position.
  - The bodies of the 22 stay private. Their existence, order and count do not.

Selection is now constrained rather than merely disclosed: we can still decline to publish a
body, but we cannot make a card disappear.

SIGNED SINCE 2026-08-27. The manifest used to carry no signature of its own: each LINK was
signed, but the LIST — the ordering, and the claim that nothing was dropped — rested on our
word (derive-chain-facts.mjs published exactly that gap as manifest_signed:false). As promised
on the IETF agentproto list: "Signing the manifest is the next step and would make the set
non-repudiable, which still would not prove we did not choose it." So the file is now
CARD-SHAPED — {body: <the manifest>, id, alg, preimage_rule, pubkey, signature} — signed by
the SAME pinned card-attestation key (did:web:csoai.org#card-attestation-1) under the SAME
canonical rule as every card. That shape was chosen over sibling fields deliberately: the
published verifier /signed/verify-card.mjs verifies it UNCHANGED —

    node public/signed/verify-card.mjs public/signed/chain.json   →  VALID

— so a stranger needs no second recipe, and no second implementation can drift.

THREE OUTCOMES, NEVER TWO: written (signed and self-verified), REFUSED (the signature failed
its own verification — nothing is written), or NO-KEY (the signing key is not on this
machine — nothing is written, and the exit says where signing must run). This script is
structurally unable to write an unsigned or unverified manifest.
"""
import json, hashlib, os, pathlib, sys

try:
    from nacl.signing import SigningKey, VerifyKey
    from nacl.exceptions import BadSignatureError
except ImportError:
    print("publish-chain-manifest: PyNaCl is required (pip install pynacl).", file=sys.stderr)
    sys.exit(2)

REPO = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = REPO / "harness/mine/cards/MANIFEST.json"
CARDS = REPO / "public/signed/cards"
OUT = REPO / "public/signed/chain.json"

# The pinned card-attestation key — the same one every card is signed with and the same one
# /signed/verify-card.mjs pins. The manifest MUST be signed by this exact key: a manifest
# signed by any other key would not verify under the published pinned-key rule.
PINNED_PUBKEY_HEX = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"

# Where the 32-byte raw Ed25519 seed lives (same key + location the estate's other signers
# use — see harness/arena/arena_scoreboard.py). Overridable for machines that keep it
# elsewhere; NEVER generated here — a fresh key would sign a manifest nobody can anchor.
KEY_PATH = pathlib.Path(
    os.environ.get("CSOAI_CARD_ATTESTATION_KEY",
                   str(pathlib.Path.home() / "clawd/sovereign-temple-public/data/sigil_ed25519.key"))
)

def canonical(body: dict) -> bytes:
    """The published preimage rule — identical to the cards' (HOW-TO-VERIFY.md §2)."""
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")

blob = json.load(open(MANIFEST))
entries = blob["cards"] if isinstance(blob, dict) and "cards" in blob else blob
by_id = {e["id"]: e for e in entries if isinstance(e, dict) and "id" in e}

published = {p.stem for p in CARDS.glob("*.json")}

# Locate head (nobody points at it) and genesis (its prev is not a card id).
prevs = {e["body"].get("prev") for e in by_id.values()}
tails = [i for i in by_id if i not in prevs]
if len(tails) != 1:
    raise SystemExit(f"expected exactly one chain head, found {len(tails)} — refusing to publish")
head = tails[0]

# Walk head -> genesis. Refuse to publish a chain we cannot ourselves traverse: a manifest
# asserting completeness it did not verify would be the defect this file exists to remove.
order, cur, seen = [], head, set()
while cur in by_id and cur not in seen:
    seen.add(cur)
    order.append(cur)
    cur = by_id[cur]["body"].get("prev")
genesis_prev = cur
if len(order) != len(by_id):
    raise SystemExit(f"chain walk reached {len(order)} of {len(by_id)} — gap or fork; refusing")

links = []
for cid in order:
    e = by_id[cid]
    is_pub = cid in published
    row = {
        "id": cid,
        "prev": e["body"].get("prev"),
        "alg": "Ed25519",
        "pubkey": e["pubkey"],
        "sig": e["signature"],
        "body_published": is_pub,
    }
    if is_pub:
        row["card_url"] = f"/signed/cards/{cid}.json"
    else:
        row["withheld_reason"] = (
            "The signed body contains an internal identifier we do not publish. The body is "
            "what the signature is over, so it cannot be redacted without invalidating this id. "
            "The position, order and signature are published so the chain remains complete."
        )
    links.append(row)

withheld = sum(1 for r in links if not r["body_published"])
doc = {
    "kind": "gspc.card-chain",
    "head": head,
    "genesis_prev": genesis_prev,
    "length": len(links),
    "bodies_published": len(links) - withheld,
    "bodies_withheld": withheld,
    "what_this_proves": (
        "Every position in the chain is listed, head to genesis, in order. Walk `prev` from "
        "`head`: all links resolve, so no card has been silently dropped. A card whose body we "
        "do not publish appears as a position with body_published:false — visible, counted and "
        "ordered — rather than as an absence indistinguishable from a card that never existed."
    ),
    "what_this_does_not_prove": (
        "That any measurement is correct. That the bodies we do not publish say what we say "
        "they say — for those, you have the id (a hash of the body) and the signature, and "
        "nothing else. A published body can be verified in full; a withheld one cannot. And "
        "not that this set was the only candidate: the envelope signature makes the published "
        "set non-repudiable — we cannot later disown it — but it cannot prove we did not "
        "choose which chain to publish."
    ),
    "verify": (
        "The manifest is card-shaped: check the envelope itself first with "
        "/signed/verify-card.mjs (id == sha256(canonical(body)), Ed25519 over the preimage "
        "under the pinned card-attestation key). Then walk prev from head to genesis_prev; "
        "every id must be present exactly once. For each body_published:true, fetch card_url "
        "and check sha256(canonical(body)) == id per /signed/HOW-TO-VERIFY.md"
    ),
    "links": links,
}

# ---- sign the manifest with the pinned card-attestation key --------------------------
# NO-KEY: refuse rather than fake. The signature must come from the one pinned key; if the
# seed is not on this machine, this script cannot produce the artifact, and says where to.
if not KEY_PATH.exists():
    print(
        f"publish-chain-manifest: NO-KEY — {KEY_PATH} not found.\n"
        "  The manifest must be signed by did:web:csoai.org#card-attestation-1. Run this on\n"
        "  the machine holding the 32-byte raw seed (or point CSOAI_CARD_ATTESTATION_KEY at\n"
        "  it). Do NOT generate a new key; do NOT publish an unsigned manifest.",
        file=sys.stderr,
    )
    sys.exit(2)

seed = KEY_PATH.read_bytes()
if len(seed) != 32:
    print(f"publish-chain-manifest: NO-KEY — {KEY_PATH} is {len(seed)} bytes, not a 32-byte raw Ed25519 seed.", file=sys.stderr)
    sys.exit(2)
sk = SigningKey(seed)
pub_hex = sk.verify_key.encode().hex()
if pub_hex != PINNED_PUBKEY_HEX:
    print(
        f"publish-chain-manifest: REFUSED — the key at {KEY_PATH} derives {pub_hex[:16]}…, "
        f"not the pinned card-attestation key. Refusing to sign under an unpublished key.",
        file=sys.stderr,
    )
    sys.exit(1)

preimage = canonical(doc)
manifest_id = hashlib.sha256(preimage).hexdigest()
signature = sk.sign(preimage).signature.hex()

# Self-verify before writing — the script may not report success on a path it did not
# complete. A signature that does not verify here would not verify for a stranger either.
try:
    VerifyKey(bytes.fromhex(PINNED_PUBKEY_HEX)).verify(preimage, bytes.fromhex(signature))
except (BadSignatureError, ValueError) as exc:
    print(f"publish-chain-manifest: REFUSED — the fresh signature failed verification ({type(exc).__name__}). Nothing written.", file=sys.stderr)
    sys.exit(1)

envelope = {
    "body": doc,
    "id": manifest_id,
    "alg": "Ed25519",
    "preimage_rule": "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
    "pubkey": PINNED_PUBKEY_HEX,
    "signature": signature,
}
OUT.write_text(json.dumps(envelope, indent=2, sort_keys=True) + "\n")
print(f"✓ chain.json: {len(links)} positions, head {head[:12]}…, "
      f"{len(links)-withheld} bodies published, {withheld} withheld")
print(f"  signed: id {manifest_id[:16]}… under {PINNED_PUBKEY_HEX[:16]}… — self-verified before write")
print("  check it yourself: node public/signed/verify-card.mjs public/signed/chain.json")
