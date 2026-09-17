# Our own transparency root accepts a leaf set we never published

**17 September 2026.** A Merkle root we publish at `https://councilof.ai/api/root` covers 305
leaf digests. A set of **306** leaves — one of them added by us, in a scratch directory, from
outside — hashes to the **same root, byte for byte**. Every inclusion proof drawn from that
padded set verifies against the published root, including a proof for the leaf that was never
in it.

The reproduction below runs against our live public bytes in well under a minute, on Python's
standard library, with no credential and no code of ours.

This is not a new attack. It is **CVE-2012-2459**, assigned in 2012 and fixed in Bitcoin Core
the same year. What is worth a reader's attention is not the technique — it is that a working
reproduction exists against a live transparency root, published by the people who operate it,
naming the property in their own artifact rather than waiting to be told.

---

## What was actually found

`root.json` declares its own tree rule, in its own bytes:

> `parent = sha256(left || right)` over RAW 32-byte digests, pairwise, bottom-up. An odd node
> at any level is paired **WITH ITSELF** (Bitcoin-style duplication), not promoted. No
> domain-separation prefix.

Two things follow, and we checked both against the live file rather than against the sentence:

1. **The declared rule is the real rule.** Duplication reproduces the published root
   `07dd5eb3…0122e2` exactly. The alternative shape — carrying an odd node up unchanged —
   yields `e9f86358…` and does not match. The documentation is not aspirational.
2. **That rule makes the leaf set ambiguous.** Because the tree duplicates the tail internally,
   a duplicate supplied from outside is indistinguishable from it. 305 leaves and 306 leaves
   collapse to one root.

The only thing separating the honest set from the padded one is the **leaf count** — and it
only works because `card_count` sits *inside* the Ed25519-signed preimage rather than beside
it. Our published roots are therefore defended. A verifier that compares `merkle_root` and
stops is not.

---

## Reproduce it

### 1. Fetch the live root (5 seconds)

```bash
curl -sS https://councilof.ai/api/root -o root.json
python3 -c "import json;d=json.load(open('root.json'));print(d['card_count'],len(d['card_sha256']),d['merkle_root'])"
# 305 305 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
```

If you fetch with `urllib` instead of `curl`, set an explicit `User-Agent`; the edge answers
`403` to the default one.

### 2. Confirm the tree shape, then forge the leaf set

```bash
python3 - <<'PY'
import json, hashlib
d = json.load(open('root.json'))
leaves = [bytes.fromhex(h) for h in d['card_sha256']]

def root(lv, duplicate=True):
    lv = list(lv)
    while len(lv) > 1:
        if duplicate:
            if len(lv) % 2: lv.append(lv[-1])          # pair the odd node with itself
            lv = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv), 2)]
        else:
            nxt = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv)-1, 2)]
            if len(lv) % 2: nxt.append(lv[-1])         # carry the odd node up unchanged
            lv = nxt
    return lv[0]

def proof(lv, idx):
    lv, path = list(lv), []
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])
        path.append((lv[idx ^ 1], idx % 2))
        lv = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv), 2)]
        idx //= 2
    return path

def replay(leaf, path):
    h = leaf
    for sib, right in path:
        h = hashlib.sha256(sib+h).digest() if right else hashlib.sha256(h+sib).digest()
    return h

forged = leaves + [leaves[-1]]          # the entire construction is this line
print("declared    :", d['merkle_root'])
print("duplication :", root(leaves).hex())
print("carry-up    :", root(leaves, False).hex())
print("forged (306):", root(forged).hex())
print("identical root, different leaf set:", root(forged) == root(leaves))
r = root(forged)
print("inclusion proofs over the forged set: %d/%d verify"
      % (sum(replay(forged[i], proof(forged, i)) == r for i in range(len(forged))), len(forged)))
print("proof for the injected leaf (index 305) verifies:",
      replay(forged[305], proof(forged, 305)) == r)
PY
```

Output:

```
declared    : 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
duplication : 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
carry-up    : e9f86358d403dd922432a7af4bdc9e2d325df385301617b0d6feb92d67a29a71
forged (306): 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
identical root, different leaf set: True
inclusion proofs over the forged set: 306/306 verify
proof for the injected leaf (index 305) verifies: True
```

Every per-leaf digest check passes. Every inclusion proof passes. The root comparison passes.
The forged set fails exactly one test: its size.

### 3. Confirm the count is inside the signature

This is the part that decides whether the ambiguity matters for a given log. Ours is signed
over the count; a log that signs the root alone is not.

```bash
curl -sS https://csoai.org/.well-known/did.json -o did.json
python3 - <<'PY'
import json, base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
d, did = json.load(open('root.json')), json.load(open('did.json'))
x = next(v for v in did['verificationMethod'] if v['id'] == d['did_intended'])['publicKeyJwk']['x']
pk = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + '=='))
fields = ['as_of', 'card_count', 'did_intended', 'kind', 'merkle_root', 'schema']
pre = lambda n: json.dumps({**{k: d[k] for k in fields}, 'card_count': n},
                           separators=(',', ':'), sort_keys=True).encode()
sig = bytes.fromhex(d['sig_ed25519'])
pk.verify(sig, pre(305)); print("card_count=305 : signature VALID")
try: pk.verify(sig, pre(306)); print("card_count=306 : ALSO VALID — count not bound")
except Exception: print("card_count=306 : REJECTED — the count is inside the signature")
PY
# card_count=305 : signature VALID
# card_count=306 : REJECTED — the count is inside the signature
```

Run the second half. A verifier that only ever prints VALID has not been shown to be capable
of printing anything else.

### Why it works

With 305 leaves, level 0 is odd, so the tree duplicates leaf 304 and hashes
`sha256(L304 || L304)` as the 153rd parent. With 306 leaves, where leaf 305 *is* a copy of leaf
304, level 0 is already even and the 153rd parent is `sha256(L304 || L305)` — the same bytes.
Every level above is therefore identical, and so is the root.

It generalises: every level whose node count is odd offers the same substitution. For 305
leaves the level sizes are 305, 153, 77, 39, 20, 10, 5, 3, 2 — six odd levels, six places to do
it.

---

## What this is not

Stated plainly, because a reader could reasonably infer otherwise:

- **No measurement card is wrong.** This concerns tree shape, not card content.
- **No signature fails.** The signature over the live root verifies under
  `did:web:csoai.org#board-attestation-1`, and rejects a substituted count.
- **No forgery has been observed anywhere.** We built one in a scratch directory to test our
  own verifier. We have no evidence of anyone doing this to anything, and we are not
  suggesting anyone has.
- **Our published roots are defended**, because `card_count` is signed. The exposure is to a
  third party whose verifier compares `merkle_root` alone.
- **This is not a vulnerability disclosure**, and there is nothing here to report to anyone.
  Restating a fourteen-year-old published result about one's own data structure is
  housekeeping, not research.
- **Merkle trees are not the problem.** RFC 6962 — Certificate Transparency — uses domain
  separation, hashing leaves as `sha256(0x00 || d)` and nodes as `sha256(0x01 || l || r)`. Run
  the same 305→306 padding against that construction and the roots differ
  (`612882…` versus `14c781…`). This is a property of one construction, not of the idea.

---

## Who should care

Anyone who operates or verifies a transparency log that (a) pairs an odd node with itself and
(b) does not bind the leaf count into whatever it signs. That describes the Bitcoin-derived
tree shape, which is widely copied into audit logs, artifact registries, supply-chain
attestation surfaces and "publish the root" transparency pages, usually by developers who
copied a twelve-line function rather than a specification.

Three questions, answerable in a few minutes against your own bytes:

1. **Does your tree duplicate odd nodes?** Recompute your published root both ways. If
   duplication matches, you have this property.
2. **Is the leaf count inside your signature, or beside it?** A count in a sibling field, an
   HTTP header, or a database row is as substitutable as the leaf list.
3. **Can your verifier reject?** Append a copy of your last leaf and feed the result to it. A
   verifier that accepts has told you what it is worth.

If the answers are duplication, beside, and accepts — the fix is small. Bind the count into the
signed preimage, or add a domain-separation prefix, or both. Neither requires re-signing
history.

---

## The second finding: this root is a snapshot, not a log

While checking the first finding we checked the published history, and found something with
more practical consequence for anyone holding one of our inclusion proofs.

We publish every distinct historical root at
`https://councilof.ai/receipts/root-history.json` — 57 roots, from 2026-08-31T07:38:20Z to
2026-09-15T07:13:43Z, each with its full leaf list. All 57 recompute correctly from their own
leaves under the declared rule. So the artifact is internally sound. What it shows is that the
root does not behave like an append-only log at all:

- **56 transitions between consecutive roots. Zero are append-only.** Every single publish
  drops leaves that the previous root contained.
- The **smallest** loss in any one transition is 6 leaves; the median is 56; the largest is 312.
- Across the window there are **3,566 distinct leaves**, of which **zero** appear in all 57
  roots and **2,943 (83%)** appear in exactly one.
- The declared `card_count` goes **down** across 11 of the 56 transitions.
- Median leaf survival across a transition is **68.1%** — roughly a third of the leaves present
  in one root are absent from the next.

Those last two bullets are different quantities and should not be merged: 68.1% is a
**per-transition** survival rate between adjacent roots; 83% is a **whole-window** figure about
how many leaves were ever seen more than once. Neither implies the other.

**What it means for a third party.** An inclusion proof against one of our roots proves
membership in *that* root, at *that* timestamp, and nothing more. It is not evidence of
membership in any later root, and given the above it is more likely than not that the leaf is
gone from the next one. If you have been handed a CSOAI inclusion proof and are treating it as
a durable statement, re-check it against the current root rather than assuming persistence.
If you are building against this surface, pin the `as_of` and the `merkle_root` you verified
against, and treat a root as a photograph of a working set rather than as a ledger entry.

We are not presenting this as a defect we have fixed. It is a description of what the artifact
currently is, which differs from what its name suggests to most readers, and that gap was ours
to close in public.

---

## Provenance

Every figure above was recomputed today from the live bytes at `councilof.ai` and
`csoai.org`, by three separate implementations, before this page was written. The commands
here are the whole method; there is no private step.

The longer engineering note, including the verifier that carries the forgery as a control so
that a run proves it can reject, is published alongside this page as
`interop/merkle-count-binding-2026-09-17.md`.

CSOAI measures; it does not certify, and verification is free. Corrections to the numbers on
this page are welcome and will be applied to the page itself:
**nicholas@csoai.org**.
