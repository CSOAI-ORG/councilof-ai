# DOC: Witness Cosigning Spike (M4 ROUND 2, DONE WHEN C)

A written spike only. **No deployment.** GitHub Actions is dead
(ticket #4720908, day 15), so no new credential can be issued.

The split-view hole: a lone-operator transparency log cannot defend
against equivocation — showing one history to one reader and a different
history to another. The field's answer is witness cosigning (C2SP
tlog-witness), it is mature, and it costs roughly nothing.

## What our root would have to look like to accept k-of-n cosignatures

### Current envelope (root.json, ~305 leaves)

```json
{
  "schema": "csoai.public-root/0.1",
  "tree_size": 305,
  "root_hash": "<sha256:32-byte hex>",
  "leaves": [...],
  "checkpoint": "<base64 check_envelope>",
  "as_of": "2026-09-15T..."
}
```

The current `checkpoint` is a single Ed25519 signature over `(root_hash, tree_size)`. It binds one operator key.

### Required envelope for k-of-n witness cosigning

```json
{
  "schema": "csoai.public-root/0.2",
  "tree_size": 305,
  "root_hash": "<sha256:32-byte hex>",
  "leaves": [...],
  "checkpoints": [
    {"kind": "operator",       "key_id": "<ed25519-pubkey-fingerprint>",
     "signature": "<base64 ed25519 over (root_hash || tree_size)>",
     "signed_at": "..."},
    {"kind": "witness",        "key_id": "<witness-pubkey-fingerprint>",
     "signature": "<base64 ed25519 over (root_hash || tree_size)>",
     "signed_at": "...",
     "witness_url": "https://<witness-host>/api/v0/log/checkpoint"},
    ...repeat per witness...
  ],
  "consensus": {
    "required": 2,
    "observed": 3,
    "missing": 0
  },
  "as_of": "2026-09-17T..."
}
```

The `consensus` block says "k=2 required, observed 3, missing 0" — so the envelope carries enough information for a reader to verify both the operator AND every witness signed the same bytes, without having to re-query the witnesses.

## Whether tlog-tiles / Tessera static-log-on-R2 is compatible with our existing root.json envelope

**No, not directly.** Specifically:

| Aspect | Our root.json | tlog-tiles / Tessera |
|--------|---------------|----------------------|
| Storage | Flat JSON in git | Tiles (256-entry hash tiles), R2 / S3 layout |
| Signature envelope | Single Ed25519 over (root_hash, tree_size) | C2SP checkpoint: `Origin.Lineage.<n>=Origin.<hash>.<n>` plus `signature` |
| Witness | None | `Origin.Witness.<id>` — list of (signature, verifier) |
| Entry format | Raw leaf with metadata | C2SP entry (`body`, `integrations`, `rfc3161`) |
| Verifier | Custom (root.json walk) | `go-tuf`-style inclusion proof + checkpoint sig |

The pieces that fit our envelope:
- The 305-leaf walk
- The merkle root computation
- The inclusion-proof generation
- The OTS stamping (independent layer)

The pieces that DO NOT fit:
- The single operator signature — would need to become a list
- The lack of witness entries — would need a new field
- The flat storage — would need a tile index if we ever want to scale
- The lack of C2SP conformance on leaves — would need a leaf-format migration

A migration path that does NOT invalidate signed bytes:
1. Add `checkpoints: []` (new field) next to `checkpoint: ...` (old field, deprecated).
2. Add `consensus: {required: 2, observed: N, missing: M}` (new field).
3. Leave `root_hash` and `tree_size` unchanged (existing signed bytes).
4. Old readers ignore `checkpoints` and `consensus`; new readers verify both.
5. Old `checkpoint` field is kept indefinitely for back-compat.

This is **non-destructive** — no existing signature breaks.

## What an independent witness would actually be signing

A witness does NOT sign the leaf bodies. It signs the **checkpoint**:

```
checkpoint = SHA256(root_hash || tree_size_le)
signature  = ed25519_sign(witness_privkey, checkpoint)
```

Where:
- `root_hash` = the merkle root of the leaves at the checkpoint
- `tree_size_le` = the tree size, encoded as 8-byte little-endian uint64
- The Ed25519 public key is bound to the witness's URL (e.g. `sigstore-rekor-tiles.org`) and known to readers

So when a witness cosigns:
- A reader can verify the witness signed `(root_hash, tree_size)` exactly
- The reader can verify the merkle root they computed matches what the witness saw
- The reader cannot verify a *different* merkle root was shown to a different reader (split-view) unless the witnesses disagreed — which is the point

## Parts that DON'T fit (named explicitly)

1. **GitHub Actions is dead.** No new Ed25519 key issuance. No new OIDC token. No Fulcio. So we CANNOT deploy a fresh witness ourselves until Actions is restored.

2. **The COSE interop key in `~/.csoai-keys/`** is a different system's key. Using it for witness cosigning would be forgery. NOT an option.

3. **Our existing `checkpoint` field** is a single Ed25519 over `(root_hash, tree_size)`. The exact byte string the operator signed is not in the envelope — readers must trust the operator's key fingerprint. A witness would not sign the same bytes (their `(root_hash, tree_size)` would be identical, but the witness has their own `kind` discriminator). Both signatures can be verified independently.

4. **The `/public/interop/ots/` directory** carries the producer's detached OTS proofs. These are CALENDAR-pending proofs, not anchored. A witness would NOT include OTS — that's a separate timing-anchor layer (Bitcoin confirmation).

5. **The per-machine harvest key** in `~/.csoai/keys/harvest_ed25519.pem` has `signer_authority=NOT_ESTABLISHED` (per #2610). It CANNOT sign as the operator, and therefore CANNOT be one of the k-of-n witnesses either — witnesses need an established identity.

6. **The 305-vs-335 corpus split** is a freshness defect, not a witness concern. Witnesses do not fix staleness; they fix equivocation.

7. **DEPLOY-LOCK is in force.** No deploy without an explicit owner action.

## What DOES fit (so this spike is not empty)

- The conformance field can be added without breaking signatures (non-destructive migration, see above).
- The leaf format CAN be migrated to C2SP entry shape (`body`, `integrations`) without re-signing if the existing `sha256` over the leaf bytes is preserved.
- A reader-side verifier can be written in < 200 lines of Python that walks the 305 leaves, computes the merkle root, verifies the operator checkpoint, and (once witnesses cosign) verifies each witness signature against the same `(root_hash, tree_size)`.
- The C2SP `go-tuf`-style inclusion proof is a sibling to our existing merkle inclusion proof — the math is identical; only the wire format differs.

## Command that proves DONE WHEN C

```bash
$ python3 scripts/witness_cosign_spike.py --probe
=== witness-cosign-spike: written spike (NO DEPLOYMENT) ===

current envelope: scripts/master_closed_loop.py produces signatures;
root.json carries a single operator checkpoint; witness field does not exist.

required envelope: schema csoai.public-root/0.2 with checkpoints[] + consensus{}
required migration: non-destructive (add checkpoints[] next to checkpoint; old
                     readers ignore new fields; old signed bytes preserved).

parts that DO NOT fit:
  1. GHA dead → no fresh witness key issuance (ticket #4720908, day 15)
  2. COSE interop key ~/.csoai-keys/ → different system, using it is forgery
  3. Existing checkpoint: single operator, witness cannot reuse its bytes
  4. /public/interop/ots/ → calendar-pending, not anchored; not a witness
  5. ~/.csoai/keys/harvest_ed25519.pem → NOT_ESTABLISHED, cannot be a witness
  6. 305 vs 335 freshness defect → witnesses don't fix staleness
  7. DEPLOY-LOCK → no deploy without owner action

parts that DO fit:
  - merkle root + inclusion proof math
  - leaf sha256 over exact bytes
  - non-destructive field addition (checkpoints[], consensus{})

deploy: NEVER. NO deploy without explicit owner action.
DEPLOY-LOCK in force.
```

## STOP CONDITION

This is a written spike. Nothing is deployed. No new Ed25519 key was generated. No witness URL was registered. No C2SP conformance was claimed. DEPLOY-LOCK is in force. The split-view hole is named; the fix path is named; the parts that do not fit are named. Re-running this spike does not change its conclusion.

