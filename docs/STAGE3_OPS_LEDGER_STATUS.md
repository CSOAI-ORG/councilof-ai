# Stage 3 ops ledger status (NEXT_300 #313–314, #318)

**As of:** 2026-08-26 · tip after catalog stubs #303–308

Honest pre-refresh posture — no invented ledger rows to tick boxes.

## #313 RWA corrections ledger

**Status:** ✅ N/A pre-refresh — no bad-card rows to append.

Stage 3 signed mainnet cards (#295–310) have not run; no published RWA attestation cards have been re-issued from the refresh queue. When a wrong card appears after counsel-cleared publish, append per `docs/RWA_BAD_CARD_CORRECTIONS.md` → `functions/api/corrections.ts` (append-only, never silent-edit).

## #314 Refutation ledger

**Status:** ✅ N/A pre-refresh — no new `index-claim` rows required.

All three labour/economy indices remain **UNMEASURED** on `/indices` and `GET /api/indices`. No external index-claim refutations have been filed since catalog stub ship. Append to refutation ledger only when a dated, sourced claim needs rebuttal (`kind: index-claim`).

## #318 Contact registry schema

**Status:** ✅ N/A — no contact-registry row changes since schema ship (#281).

`public/.well-known/schemas/contact-registry.schema.json` unchanged. Bump only when ecosystem contact imports add required fields; Stage 3 catalog clusters use `csoai.evm-catalog-cluster/0.1` manifests, not the contact registry schema.

Crosswalk: `docs/STAGE3_CLEAN_PLAY_REFRESHES.md` · `docs/RWA_BAD_CARD_CORRECTIONS.md`
