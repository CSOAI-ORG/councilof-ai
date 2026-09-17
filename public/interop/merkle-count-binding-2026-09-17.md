# The leaf count is load-bearing: odd-node duplication in the CSOAI public root

**CSOAI — Council for Secure and Open AI. 17 September 2026.**
Scope: a property of our own Merkle construction, and what a verifier must do about it.
Not an incident report. Nothing here is novel; the underlying property was published in 2012.

---

## Summary

`https://councilof.ai/api/root` publishes a Merkle root over 305 leaf digests. The tree
pairs an odd node **with itself** — the Bitcoin construction. That construction has a
known consequence, catalogued as **CVE-2012-2459**: a leaf set of a *different size* can
produce an *identical* root.

We reproduced this against our own live root. A leaf set of 306 leaves, built by appending
a copy of the last leaf to our published 305, hashes to byte-identical
`07dd5eb3…0122e2`. Every per-leaf digest check passes. Every inclusion proof — all 306,
including one for the injected leaf — verifies against that root.

The only thing that separates the honest set from the padded one is the **leaf count**, and
it only works because `card_count` sits inside the Ed25519-signed preimage rather than
alongside it.

**The point of this note is a verification practice, not a defect.** A verifier that checks
`merkle_root` and stops will accept a leaf set that is not the one that was signed. A
verifier that also binds the count will not.

## What this does not show

Stated plainly, because these are the things a reader might otherwise infer:

- **No CSOAI measurement card is wrong.** This is about tree shape, not card content.
- **No signature fails.** The signature over our published root verifies; see step 4 below.
- **No forgery has been observed.** We constructed one in a scratch directory to test our
  own verifier. We have no evidence of anyone doing this to anything.
- **Our published roots are defended.** `card_count` is inside our signed preimage, and
  `public/root.json` has carried a `tree_caveat` describing this property in its own bytes.
  We are documenting a construction we already knew we had, so that third parties writing
  verifiers against it know what their verifier must do.
- **This is not a vulnerability disclosure.** CVE-2012-2459 was assigned in 2012 and fixed
  in Bitcoin Core the same year. Restating a fourteen-year-old published result about one's
  own data structure is housekeeping.

---

## Reproduction

Everything below runs against public bytes. No fixture, no credential, no CSOAI code.
Python 3, standard library only.

### 1. Fetch the live root

```bash
curl -sS https://councilof.ai/api/root -o root.json
python3 -c "import json;d=json.load(open('root.json'));print(d['card_count'], len(d['card_sha256']), d['merkle_root'])"
# 305 305 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
```

If you use `urllib` rather than `curl`, set an explicit `User-Agent`; the edge answers
`403` to the default one.

### 2. Confirm the declared tree shape reproduces the root

`root.json` states its own rule in `node_definition`:

> `parent = sha256(left || right)` over RAW 32-byte digests, pairwise, bottom-up. An odd
> node at any level is paired WITH ITSELF (Bitcoin-style duplication), not promoted. No
> domain-separation prefix.

```bash
python3 - <<'PY'
import json, hashlib
d = json.load(open('root.json'))
leaves = [bytes.fromhex(h) for h in d['card_sha256']]

def root(lv, duplicate):
    lv = list(lv)
    while len(lv) > 1:
        if duplicate:
            if len(lv) % 2: lv.append(lv[-1])              # pair the odd node with itself
            lv = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv), 2)]
        else:
            nxt = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv)-1, 2)]
            if len(lv) % 2: nxt.append(lv[-1])             # carry the odd node up unchanged
            lv = nxt
    return lv[0].hex()

print("declared    :", d['merkle_root'])
print("duplication :", root(leaves, True))
print("promote-odd :", root(leaves, False))
PY
```

Output:

```
declared    : 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
duplication : 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
promote-odd : e9f86358d403dd922432a7af4bdc9e2d325df385301617b0d6feb92d67a29a71
```

Duplication reproduces the published root exactly. Promotion does not. The tree is the
Bitcoin shape, as declared.

### 3. Construct the forgery

The construction is one line, and that is the whole point of it. Append a copy of the last
leaf:

```bash
python3 - <<'PY'
import json, hashlib
d = json.load(open('root.json'))
leaves = [bytes.fromhex(h) for h in d['card_sha256']]

def root(lv):
    lv = list(lv)
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])
        lv = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv), 2)]
    return lv[0]

def proof(lv, idx):
    lv, path = list(lv), []
    while len(lv) > 1:
        if len(lv) % 2: lv.append(lv[-1])
        path.append((lv[idx ^ 1], 'R' if idx % 2 == 0 else 'L'))
        lv = [hashlib.sha256(lv[i]+lv[i+1]).digest() for i in range(0, len(lv), 2)]
        idx //= 2
    return path

def replay(leaf, path):
    h = leaf
    for sib, side in path:
        h = hashlib.sha256(h+sib).digest() if side == 'R' else hashlib.sha256(sib+h).digest()
    return h

forged = leaves + [leaves[-1]]
r = root(leaves)
print("honest leaves :", len(leaves), root(leaves).hex())
print("forged leaves :", len(forged), root(forged).hex())
print("identical root, different leaf set:", root(leaves) == root(forged))
print("all", len(forged), "inclusion proofs verify:",
      all(replay(forged[i], proof(forged, i)) == r for i in range(len(forged))))
print("proof for the injected leaf (index 305) verifies:",
      replay(forged[305], proof(forged, 305)) == r)
PY
```

Output:

```
honest leaves : 305 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
forged leaves : 306 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
identical root, different leaf set: True
all 306 inclusion proofs verify: True
proof for the injected leaf (index 305) verifies: True
```

**Why it works.** With 305 leaves, level 0 is odd, so the tree duplicates leaf 304 and hashes
`sha256(L304 || L304)` as the 153rd parent. With 306 leaves, where leaf 305 *is* a copy of
leaf 304, level 0 is even and the 153rd parent is `sha256(L304 || L305)` — the same bytes.
Every level above is therefore identical, and so is the root. The duplication the honest
tree performs internally is indistinguishable from a duplicate supplied from outside.

The construction generalises: any level at which the node count is odd offers the same
substitution, so the number of distinct leaf sets sharing one root grows with the number of
odd levels in the tree. 305 leaves has odd levels at 305, 153, 77, 39, 5 and 3.

### 4. Confirm the count is inside the signature

```bash
curl -sS https://csoai.org/.well-known/did.json -o did.json
python3 - <<'PY'
import json, base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
d, did = json.load(open('root.json')), json.load(open('did.json'))
x = next(v for v in did['verificationMethod']
         if v['id'] == d['did_intended'])['publicKeyJwk']['x']
pk = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + '=='))
fields = ['as_of', 'card_count', 'did_intended', 'kind', 'merkle_root', 'schema']
pre = json.dumps({k: d[k] for k in fields}, separators=(',', ':'), sort_keys=True).encode()
pk.verify(bytes.fromhex(d['sig_ed25519']), pre)
print("signature verifies; preimage fields:", fields)
PY
# signature verifies; preimage fields: ['as_of', 'card_count', 'did_intended', 'kind', 'merkle_root', 'schema']
```

`card_count` is one of the six signed fields. `card_sha256[]` is not — it is bound only
through `merkle_root`, which step 3 showed is ambiguous. The count is what disambiguates,
and it disambiguates only because it is signed. A count carried beside the signature rather
than inside it would be as forgeable as the leaf list.

### 5. Run the verifier

`scripts/verify_public_root.py` in the `councilof-ai` repository does all four steps and
carries the forgery as a control, so that a run proves the verifier can say no:

```
$ python3 scripts/verify_public_root.py --control
```

Live bundle:

```
  [PASS] merkle_root recomputes under the declared duplication rule
  [PASS] count binding: len(card_sha256) == card_count == 305
  [PASS] Ed25519 signature verifies under did:web:csoai.org#board-attestation-1
VERDICT: ACCEPTED
```

Forged bundle (tail duplicated, `card_count` left at its signed value):

```
  [PASS] merkle_root recomputes under the declared duplication rule
  [FAIL] count binding: 306 leaves presented, card_count says 305.
VERDICT: REJECTED — 1 check(s) failed
CONTROL OK: expected reject, got reject — and on the count binding,
with the root check passing.
```

One of thirty-odd checks catches it, and it is not the root check. That is the finding.

---

## The consequence, stated narrowly

> A verifier that checks only `merkle_root` will accept a forged leaf set of a different
> size. The defence is binding the leaf **count** — and ideally the full tree shape —
> inside whatever is signed.

Two corollaries for anyone implementing against such a root:

1. **Reject any presentation where `len(leaves) != declared_count`**, where `declared_count`
   comes from the signed material and not from the presentation.
2. **Reject any inclusion proof with `index >= declared_count`.** An index past the signed
   count addresses a node that the signer never committed to, even though its proof replays
   correctly.

## Who this affects

Any transparency log, evidence bundle, or attestation format that:

- builds a Merkle tree with **Bitcoin-style odd-node duplication**, and
- signs or publishes **only the root**, without binding the leaf count or tree size.

**RFC 6962 (Certificate Transparency) is not affected**, and the reason is worth naming
because it is the general fix. CT prefixes every leaf hash with `0x00` and every interior
node hash with `0x01` before hashing (RFC 6962 §2.1). A leaf digest can therefore never
equal an interior digest, the padding substitution above has no interior node to imitate,
and CT additionally signs `tree_size` in every Signed Tree Head. **This is a property of
the construction, not of Merkle trees.** Merkle trees are not the problem; unprefixed
trees with duplicated odd nodes and unbound sizes are.

Carrying an odd node up unchanged instead of duplicating it — the other shape we run,
below — is not vulnerable to this particular padding construction: under promotion our
306-leaf forgery yields `6c9af103…`, not `e9f86358…`. It is still not domain-separated, so
it does not get CT's leaf/interior guarantee. Domain separation is the fix; odd-node
handling is a workaround.

---

## Second finding: there are two CSOAI tree shapes, not one

The estate builds Merkle roots two different ways, and they are not interchangeable.

| | `public/root.json` (public root) | `scripts/measurement_root.py` |
|---|---|---|
| Leaf order | as presented in `card_sha256[]` | leaves **sorted by their own hash** |
| Odd node | **paired with itself** (duplication) | **carried up unchanged** (promotion) |
| Domain separation | none | none |
| Signed? | yes, Ed25519 over a 6-field preimage | no — explicitly `UNSIGNED` |
| Size bound in signed bytes? | yes, `card_count` | n/a, nothing is signed |

Both record their rule in their own output, which is what made this comparison possible at
all. But the two rules give different roots over the same leaves — step 2 above shows
`07dd5eb3…` against `e9f86358…` for the shape difference alone, before the sort is even
applied.

**Consequence: "the CSOAI Merkle root" is not a single object.** Any specification,
interop profile, or third-party integration that cites a CSOAI Merkle root must name which
construction it means — the signed public root or an unsigned measurement root — and, for
the public root, must state that verification requires the count binding and not the root
alone. We will treat an unqualified citation as underspecified.

---

## What we are not proposing to change today

Moving the public root to RFC 6962 domain separation would close this by construction. It
also changes every root we have ever published, which breaks every existing inclusion proof
and every anchored timestamp over the old bytes. That is a versioned migration with its own
disclosure, not a silent patch, and it is not what this note does. Until then the count
binding is the defence, the signature carries it, and this document plus
`scripts/verify_public_root.py` are how a stranger checks that for themselves.

---

## References

- **CVE-2012-2459** — <https://nvd.nist.gov/vuln/detail/CVE-2012-2459>. Assigned 2012;
  duplicate transactions producing an identical Merkle root in Bitcoin blocks.
- **RFC 6962**, *Certificate Transparency*, §2.1 (Merkle Hash Trees) — the `0x00`/`0x01`
  domain-separation prefixes. <https://www.rfc-editor.org/rfc/rfc6962#section-2.1>
- **Live root** — <https://councilof.ai/api/root>
- **DID document** — <https://csoai.org/.well-known/did.json>
- **Verifier** — `scripts/verify_public_root.py` in the `councilof-ai` repository, and
  `corrections/verify_public_root.py` in the `csoai/councilof-ai-mirror` dataset on
  Hugging Face.

Figures in this document were produced on 2026-09-17 against the root with
`as_of: 2026-09-15T07:13:43Z` and `card_count: 305`. The root is republished on a schedule;
the count and the digests will move, the construction will not.

CSOAI measures. This document measures one of our own data structures. It is not a
certification, and it grades nothing.
