# How to verify the public root — yourself, offline, without trusting us

The board publishes ONE root: `https://councilof.ai/root.json` (`kind: csoai.public-root/v1`). Its `card_sha256[]` leaves hash into `merkle_root`; the envelope is Ed25519-signed by `did:web:csoai.org#board-attestation-1`. The root leaves and `signed/card_index.json` are separate corpora, but a verifier must derive both counts and their identifier overlap from the files currently served—never copy a number from this guide. The root's witnesses cover the exact `root.json` response bytes only; they do not anchor the signed-card index. Witnesses attest the *existence and time* of those bytes. None of this is certification, endorsement, or a rank. Verification is free, forever.

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

Read the current state and proof path from the sidecar. `STAMPED_PENDING_BITCOIN` means a calendar accepted the digest but there is **not yet a Bitcoin anchor**. `CONFIRMED_BITCOIN` is used only when the proof bytes contain a Bitcoin block-header attestation that the release gate independently checks. Never infer either state from a filename or from this guide.

Fetch the exact current files and run:
```bash
pip install opentimestamps-client
curl -s https://councilof.ai/root.json -o root.json
curl -s https://councilof.ai/interop/root-witness-latest.json -o root-witness-latest.json
python3 - <<'PY'
import json
w = json.load(open("root-witness-latest.json"))
o = w["witnesses"]["ots"]
print("status:", o["status"])
print("proof URL:", o["url"])
print("expected root sha256:", w["artifact"]["sha256"])
PY
PROOF_URL=$(python3 -c 'import json; print(json.load(open("root-witness-latest.json"))["witnesses"]["ots"]["url"])')
curl -s "$PROOF_URL" -o root.json.ots
ots verify root.json.ots -f root.json
```
For a confirmed proof, the sidecar records the 80-byte header checked byte-for-byte against its named independent sources. The gate recomputes its block hash, timestamp and Merkle binding to the OTS attestation. A confirmed Bitcoin timestamp proves these exact bytes existed no later than that block; a pending stamp does not yet prove that. Neither state proves correctness, completeness, compliance or certification.

## 4. EAS on Base and XRPL memo
Both are `NOT_YET` in the sidecar until a funded wallet exists. When they land, the sidecar will carry the attestation UID (resolvable on base.easscan.org) and the XRPL transaction hash whose memo decodes to `sha256(root.json)`.

## Drift
`https://councilof.ai/interop/root-witness-pointer.json` records a timestamped comparison in `drift.checked_at`. It is a historical observation, not a standing all-clear. Re-fetch `root.json`, hash its exact response bytes, check its byte length, `merkle_root`, `card_count` and `as_of`, then compare all of those fields with both the sidecar `artifact` and pointer `live_root`. A witness for older bytes is still a true witness of those bytes; it is never presented as a witness of the current root. A matching Merkle value alone is insufficient because this v1 tree duplicates an odd tail.

## Conflict (two roots, same issuer, same epoch)
Rekor inclusion proves a root existed at a time. It does not prove it was the only root for that epoch, and it does not tell a reader which of two logged roots is the head. The pinned rule, added 2026-09-05 (ledger entry C-2026-0905-01): **two witnessed roots for `did:web:csoai.org` with equal `as_of` and unequal `merkle_root` are a CONFLICT, and a reader must treat neither as current.** The verifier path is `scripts/witness_public_root.py` (`find_root_conflicts`), which scans every dated sidecar in `/interop/root-witness-YYYY-MM-DD*.json` and writes the result to `conflict.status` (`NONE`, `CONFLICT`, `UNCHECKABLE`) in both the sidecar and `root-witness-pointer.json`, with the conflicting files named. Same `merkle_root` with different bytes is listed under `byte_variants`: the same tree re-serialised, not a conflict of content. Not yet observable, stated so a reader is not misled by a missing field: the rule and the code are public, but no published artifact carries a `conflict` block yet. The code landed at 2026-09-05T06:25:32Z and the most recent root run was 04:16:50Z, so `/interop/root-witness-latest.json` and `/interop/root-witness-pointer.json` as served before the next root run have no `conflict` key at all. Absence of the field means the artifact predates the rule, never that the check returned NONE. Stated limit: this check only sees roots this publisher witnessed and kept. A publisher that logged two roots and kept one sidecar would not be caught by its own check; that case is what an independent witness run is for, and it is the negative case we have asked a peer to include.

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
