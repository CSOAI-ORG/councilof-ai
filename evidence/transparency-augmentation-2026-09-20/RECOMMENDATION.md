# Recommendation — Sigstore / OpenTimestamps augmentation — 2026-09-20

Verdict-first: **the augmentation question is answered YES with gates.** Existing
CSOAI artifacts can gain independently checkable publication evidence from both
systems without touching the Ed25519 layer. One system (OTS) is already proven
end-to-end in this session; the other (Sigstore keyless bundle) is blocked on
identity policy, not on technology, and stays UNCHECKABLE until its gate is met.

## R1 — OpenTimestamps: ADOPT (already on production rails; confirmed in this session)

Evidence: fresh fixture stamp accepted by 3/3 calendars, proof parses and binds to
the file digest, state honestly recorded as `PENDING_CALENDAR_COMMITMENT`
(`ots/ots-stamp-batch-2026-09-17.json`, `ots/ots-verify-pending.txt`). The production
root's confirmed proof was re-checked: `ots info` binds `dedb49d0…` and carries
`BitcoinBlockHeaderAttestation` at blocks 967093/967098/967150; block 967093's
80-byte header is byte-identical to the sidecar under independent readback
(`ots/ots-blockheader-readback.txt`).

Adoption gates (all must hold for any new artifact class):
- **O1.** Every fresh stamp ships with a sidecar stating `PENDING_CALENDAR_COMMITMENT`
  and its meaning (the existing `csoai.ots-stamp-batch/0.1` schema does this). Pending
  is never called anchored.
- **O2.** Upgrade path (`scripts/ots-upgrade.py` + loop) runs before any CONFIRMED
  claim; confirmation is derived from proof bytes, never from filenames.
- **O3.** Verification instructions must state that reference `ots verify` needs a
  Bitcoin node, and document the two-explorer header byte-comparison as the
  node-free alternative (F3).
- **O4.** OTS stamps the digest of the *served bytes* — keep that scope distinct from
  Rekor's preimage coverage (F1) in all prose.

## R2 — Sigstore keyless bundle (Fulcio identity): CONDITIONAL — GHA-OIDC path only

What keyless would add over the existing `rekord` uploads: a **bound identity**
(which issuer + which account/workflow produced the signature) inside a single
offline-verifiable bundle. The existing rekord layer already provides
existence-in-log and was re-verified offline in this session
(`sigstore/rekor-entry-verify-offline.txt`, all four checks VALID).

The identity leg is **UNCHECKABLE** today by explicit operator decision
(`sigstore/keyless-blocker.txt`): no ambient OIDC credential on this machine, and
the interactive OAuth fallback would permanently publish a *personal* identity in
public Rekor — disproportionate for a test, and the wrong identity for an estate
artifact anyway.

Adoption gates (all required before the first identity-bound bundle on any real
artifact):
- **S1.** Identity must come from **GitHub Actions OIDC** (`id-token: write`,
  repository-workflow identity `repo:…:ref:…`), never a personal OAuth login and
  never a production signing key. Requires Actions enabled and an explicit owner
  action — DEPLOY-LOCK applies; this session changed no workflows.
- **S2.** Published verification must pin the issuer allowlist and the expected
  identity pattern (repo + ref), and state what the identity does and does not
  establish (authentication, not authorization; §1 table).
- **S3.** The bundle is **additive**: Ed25519 cards, the Merkle root, and the
  existing rekord witness remain the canonical layers; the bundle never replaces
  them and never carries certification language.
- **S4.** Offline-verification limits must be documented with the artifact: bundle
  verification needs the Sigstore TUF trust root (network on first fetch; cached
  copies go stale) and Rekor inclusion material; certificate validity is evaluated
  against Rekor `integratedTime`, not wall-clock-now.
- **S5.** Reversibility: bundles are sidecar files next to unchanged artifacts;
  dropping the experiment = deleting sidecars. No schema migration of signed bytes.

## R3 — Rekor `rekord` layer (existing): KEEP, with two documentation fixes

- Carry **both** indices in sidecars: the API/virtual `logIndex` (SET-signed) and the
  inclusion-proof `logIndex` (tree position) — F2 shows they legitimately differ for
  canonicalized duplicates, and only the proof index is a tree coordinate.
- State explicitly that the entry covers the **signed preimage**, not the served
  `root.json` bytes (F1); keep `--verify-root` INVALID semantics explained in the
  HOW-TO so a reader does not read it as a failure.

## Explicitly NOT recommended

- Personal-identity OAuth signing into public Rekor (wrong identity, irreversible).
- Replacing or wrapping the estate Ed25519 signature in a Sigstore bundle (breaks
  the pinned verification rule; violates "augment, never replace").
- Any claim that a log entry or timestamp proves semantic truth, authorship beyond
  the bound identity, regulatory compliance, or current validity.
- Publishing the fixture's pending OTS proof as "timestamped" before upgrade + chain
  verification (O1/O2).

## Highest-value next action

Run `scripts/ots-upgrade.py` on
`ots/card-00a52180-measurement-card.json.ots` after the calendars aggregate
(hours), then `ots verify` against a Bitcoin node (or the two-explorer gate), and
record the transition transcript next to `ots-verify-pending.txt` — that completes
the pending→confirmed lifecycle evidence for a test artifact at zero risk.
