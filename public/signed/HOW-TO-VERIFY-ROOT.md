# How to verify the public root — yourself, offline, without trusting us

The board publishes ONE root: `https://councilof.ai/root.json` (`kind: csoai.public-root/v0`). Every signed card hashes into `merkle_root`; the envelope is Ed25519-signed by `did:web:csoai.org#board-attestation-1`. Witnesses attest the *existence and time* of those bytes. None of this is certification, endorsement, or a rank. Verification is free, forever.

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
When the sidecar's `witnesses.ots.status` is `STAMPED_PENDING_BITCOIN` or better, fetch the named `.ots` file and run:
```bash
pip install opentimestamps-client
ots upgrade root-<sha8>.json.ots   # once a Bitcoin block includes the calendar commitment
ots verify root-<sha8>.json.ots    # prints the block that attests the bytes existed
```
`PENDING` means the calendars had not answered when the sidecar was written — it is not a witness yet, and the sidecar says so.

## 4. EAS on Base and XRPL memo
Both are `NOT_YET` in the sidecar until a funded wallet exists. When they land, the sidecar will carry the attestation UID (resolvable on base.easscan.org) and the XRPL transaction hash whose memo decodes to `sha256(root.json)`.

## Drift
`https://councilof.ai/interop/root-witness-pointer.json` states whether the witnessed bytes are the live bytes (`drift.status: MATCH`). A witness for older bytes is still a true witness of those bytes; it is never presented as a witness of the current root.

## What a verifying signature does not establish (revocation)

Verifying a signature establishes that the key named under `alg` / the DID key reference produced the signed bytes and that the bytes have not changed since. It says nothing about the state of that key now. Offline verification is a computation over the verification parameters you hold (the published key, the card bytes); revocation is a property of the present, and this rule defines no revocation mechanism and places no freshness requirement on key material. **A consumer must not treat a signature that verifies as evidence that the signing key is still valid.** Where a decision depends on revocation state, the key-resolution path and the staleness you accept are operational parameters of your deployment and must be stated by it; the card does not carry them. (Stated after the IETF agentproto thread of 31 Aug–2 Sep 2026; recorded as correction C-2026-0902-09.)
