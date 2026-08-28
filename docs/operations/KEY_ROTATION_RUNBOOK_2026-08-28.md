# KEY ROTATION RUNBOOK — did:web + FROST-Ed25519 (2026-08-28)
*Required artifact BEFORE any compromise (roadmap #3, signing).*

## 1. The key posture
- One pinned identity key: `did:web:csoai.org#card-attestation-1` (cards) + board key
  `#gspc-board-22axis-2026` + `#board-attestation-1` (4 published keys on the DID).
- Roadmap: migrate signing to **FROST-Ed25519 (taurushq-io)** with shares in DISTINCT
  trust domains (current 3-of-3 = three shares on ONE machine = single failure domain).
  FROST emits a STANDARD Ed25519 signature — the pinned DID key and every verifier
  stay unchanged. Migration gate: FROST CLI/lib cross-verified against the legacy
  signer on 10 fixtures, then shares split (pod / Oracle / Mac keychain).

## 2. Rotation procedure (pre-compromise, rehearsed quarterly)
1. **Generate** new keypair (FROST or legacy) → `kid = sha256(pub)[:10]`.
2. **Publish** the new pubkey in `did:web` (`public/.well-known/did.json`) WITH the old —
   never delete keys in a rotation; add and deprecate.
3. **Overlap window: 30 days minimum** — old key keeps validating; new key starts
   signing new cards; every new card's `signer`/`kid` names its key.
4. **Record** the rotation in the append-only corrections ledger (`corrections.jsonl`):
   `{event: "key-rotation", old_kid, new_kid, ts, did_doc_sha256}`.
5. **Re-anchor**: past attestations remain provable via multi-rail anchors
   (OpenTimestamps/Bitcoin proof survives even a current-key compromise per the OTS
   documentation; EAS receipts independent).

## 3. Compromise drill (execute in public, never conceal)
1. **Immediate**: append `key-compromise` entry to the ledger (honest, dated, with the
   affected kid + first suspicious ts if known).
2. **Revoke**: mark the kid revoked in did.json (publish alongside, never remove the key).
3. **Rotate** per §2 within 24h; quarantine verification of anything signed after the
   suspect ts.
4. **Kill-switch drill**: verifiers fail closed on revoked kids (client-side list from
   did.json) — rehearsed cold-restore <4h (OWNERSHIP-100 #78).
5. **After-action**: ledger entry; this runbook updated if the drill found a gap.

## 4. Audit notes
- The 4 did keys: keep a public inventory (`kid | purpose | added | status`) in this
  runbook's companion file (`public/.well-known/did.json` is authoritative for bytes).
- Never rotate the ORIGINAL identity silently: rotation without a ledger entry is the
  estate's definition of a compromise response failure.
