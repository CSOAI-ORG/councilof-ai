# How to verify the public root — yourself, offline, without trusting us

The board publishes ONE root: `https://councilof.ai/root.json` (`kind: csoai.public-root/v1`). Its 154 `card_sha256[]` leaves hash into `merkle_root`; the envelope is Ed25519-signed by `did:web:csoai.org#board-attestation-1`. These leaves are a separate corpus from the 335 cards in `signed/card_index.json`: their identifiers have zero overlap. The root's witnesses cover the exact `root.json` bytes only; they do not anchor the signed-card index. Witnesses attest the *existence and time* of those bytes. None of this is certification, endorsement, or a rank. Verification is free, forever.

## 1. Recompute the signature (no network needed beyond two GETs)
```bash
curl -s https://councilof.ai/root.json -o root.json
curl -s https://csoai.org/.well-known/did.json -o did.json
python3 - <<'PY'
import json, base64
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
r = json.load(open("root.json")); did = json.load(open("did.json"))
x = next(v for v in did["verificationMethod"] if v["id"].endswith("#board-attestation-1"))["publicKeyJwk"]["x"]
pub = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
pre = json.dumps({k: r[k] for k in ["kind","schema","as_of","merkle_root","card_count","did_intended"]},
                 sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
pub.verify(bytes.fromhex(r["sig_ed25519"]), pre); print("signature OK over", len(pre), "preimage bytes")
PY
```
The preimage is the canonical JSON (sorted keys, compact separators, UTF-8, `ensure_ascii=false`) of exactly six fields. `card_sha256[]` is bound by `merkle_root`.

## 2b. Recompute `merkle_root` from the leaves

Until 2026-09-04 this document published the **leaf** rule and not the **node** rule, so
the sentence above was not actually checkable by a stranger — the tree shape had to be
guessed. It is:

> `parent = sha256(left || right)` over **raw 32-byte digests**, pairwise, bottom-up.
> An odd node at any level is paired **with itself**, not promoted. No domain-separation prefix.

```python
import hashlib, json
r = json.load(open("root.json"))
def merkle(leaf_hexes):
    lvl = [bytes.fromhex(h) for h in leaf_hexes]
    while len(lvl) > 1:
        lvl = [hashlib.sha256(lvl[i] + (lvl[i+1] if i+1 < len(lvl) else lvl[i])).digest()
               for i in range(0, len(lvl), 2)]
    return lvl[0].hex()
assert merkle(r["card_sha256"]) == r["merkle_root"]
```

**You must also check `len(r["card_sha256"]) == r["card_count"]`, and reject any inclusion
proof whose `index >= card_count`.** Pairing an odd node with itself makes this tree shape
collidable in the sense of CVE-2012-2459: appending duplicates of the tail produces a
*different* leaf set with an *identical* `merkle_root`. That is not hypothetical here — the
live 140-leaf root and a 144-leaf forgery of it hash to the same value, and the board's real
signature verifies over both, because the signature covers `merkle_root` and not the leaf
array. `card_count` is inside the signed preimage and is the only field that tells them
apart. A verifier that recomputes the root and stops has not finished.

A future `csoai.public-root/v2` should adopt RFC 6962 domain separation (`0x00` before a
leaf, `0x01` before a node), which removes the collision by construction. That changes every
root, so it will be a declared version bump and never a silent one; roots already published
under v0/v1 stay checkable under the rule above.

## 2. Rekor (Sigstore transparency log)
The sidecar `https://councilof.ai/interop/root-witness-latest.json` names the `logIndex`. The entry is type `rekord` (pki format x509): it carries the preimage bytes, the raw Ed25519 signature and the board's PEM public key. Pure Ed25519 is rejected by `hashedrekord`, which is why `rekord` is used.
```bash
LOGINDEX=$(curl -s https://councilof.ai/interop/root-witness-latest.json | python3 -c 'import sys,json;print(json.load(sys.stdin)["witnesses"]["rekor"]["logIndex"])')
curl -s "https://rekor.sigstore.dev/api/v1/log/entries?logIndex=$LOGINDEX" | python3 -c '
import sys,json,base64; e=next(iter(json.load(sys.stdin).values())); b=json.loads(base64.b64decode(e["body"]))
print("kind", b["kind"], "integratedTime", e["integratedTime"]); print(base64.b64decode(b["spec"]["data"]["content"]).decode())'
```
Compare the printed preimage with the one you rebuilt in step 1. With `rekor-cli`: `rekor-cli get --log-index $LOGINDEX`.

## 3. OpenTimestamps (Bitcoin)
The current sidecar derives `CONFIRMED_BITCOIN` from the proof bytes: the detached digest is the SHA-256 of `root.json`, and its Bitcoin attestation names block **965487**. Fetch both exact files and run:
```bash
pip install opentimestamps-client
curl -s https://councilof.ai/root.json -o root.json
curl -s https://councilof.ai/interop/root-a44af078.json.ots -o root-a44af078.json.ots
ots verify root-a44af078.json.ots -f root.json
```
The published sidecar also records the 80-byte header checked byte-for-byte against Blockstream and mempool.space. The gate recomputes its block hash, timestamp and Merkle binding to the OTS attestation. The Bitcoin timestamp proves these exact bytes existed no later than that block; it does not prove their correctness, completeness, compliance or certification.

## 4. EAS on Base and XRPL memo
Both are `NOT_YET` in the sidecar until a funded wallet exists. When they land, the sidecar will carry the attestation UID (resolvable on base.easscan.org) and the XRPL transaction hash whose memo decodes to `sha256(root.json)`.

## Drift
`https://councilof.ai/interop/root-witness-pointer.json` states whether the witnessed bytes are the live bytes (`drift.status: MATCH`). A witness for older bytes is still a true witness of those bytes; it is never presented as a witness of the current root.

## What a verifying signature does not establish (revocation)

Verifying a signature establishes that the key named under `alg` / the DID key reference produced the signed bytes and that the bytes have not changed since. It says nothing about the state of that key now. Offline verification is a computation over the verification parameters you hold (the published key, the card bytes); revocation is a property of the present, and this rule defines no revocation mechanism and places no freshness requirement on key material. **A consumer must not treat a signature that verifies as evidence that the signing key is still valid.** Where a decision depends on revocation state, the key-resolution path and the staleness you accept are operational parameters of your deployment and must be stated by it; the card does not carry them. (Stated after the IETF agentproto thread of 31 Aug–2 Sep 2026; recorded as correction C-2026-0902-09.)

## What a card's `sha256` covers — read this before trusting an inclusion proof

**card-v1** (`https://councilof.ai/schema/card-v1.json`, from 2026-09-03):

```
sha256 = SHA-256( canonical JSON of the whole card, minus `sha256` and `sig_ed25519` )
```

Every field a relying party reads is bound: `subject`, `source_urls`, `as_of`,
`did`, `surface`, `tags`, `unmeasured`, `payload`. The card states this itself in
`digest_covers`. A field cannot be inside its own hash, so the digest and the
signature are the only exclusions.

**card-v0** (cards already inside a published root) hashed the **payload only**.
On those cards `subject` and `source_urls` are **outside** the merkle tree: the
claim text and its evidence URL could be rewritten and the leaf, the root and the
inclusion proof would all still verify. Demonstrated against the real code:

```
subject honest   : Qwen/Qwen3-30B governance run
subject tampered : TOTALLY DIFFERENT CLAIM
source  tampered : https://evil.example/fake
leaf digest      : e52f814957f02a0aef7de67ca93250f9…    IDENTICAL
```

This is stated rather than quietly repaired. v0 cards are **superseded by a newer
root, never edited** — editing signed bytes breaks the signature and the history.

**So: check `schema` before you rely on an inclusion proof.** A v0 proof tells you
the payload was in the tree. It does **not** tell you the subject or the source URL
was in the tree.
