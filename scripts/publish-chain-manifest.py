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
"""
import json, hashlib, pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = REPO / "harness/mine/cards/MANIFEST.json"
CARDS = REPO / "public/signed/cards"
OUT = REPO / "public/signed/chain.json"

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
        "nothing else. A published body can be verified in full; a withheld one cannot."
    ),
    "verify": "Walk prev from head to genesis_prev; every id must be present exactly once. For each body_published:true, fetch card_url and check sha256(canonical(body)) == id per /signed/HOW-TO-VERIFY.md",
    "links": links,
}
OUT.write_text(json.dumps(doc, indent=2, sort_keys=False) + "\n")
print(f"✓ chain.json: {len(links)} positions, head {head[:12]}…, "
      f"{len(links)-withheld} bodies published, {withheld} withheld")
