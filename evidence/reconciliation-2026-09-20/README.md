# Reconciliation 2026-09-20 — signed cards, Merkle roots, live board

Goal-3 session: re-fetch live GSPC board + card/ledger surfaces, reconcile, recompute,
verify. Machine-readable detail: `reconciliation-report.json` (same directory).
Measurement, never certification. Nothing here is a conformity or compliance statement.

## Headline

- **Denominator RECONCILED**: 23 axis slots · 22 measured · 1 declared UNMEASURED slot
  (effect-binding) — live `/api/gspc`, `canon.json` (ADR-002 ruling), and drift-guard all agree.
- **All 335 signed measurement cards verify** (id recompute 335/335, Ed25519 335/335,
  one pinned key `#card-attestation-1`) — live-fetched bytes, keys taken from the
  independent host `csoai.org/.well-known/did.json`.
- **public root VALID**: 305 leaves == signed `card_count`, root recomputes MATCH under
  the declared construction, envelope signature VALID, live inclusion proofs VALID.
- **chain.json VALID**: id + signature verify; length 335 and head match the index.
- **ONE NEW DEFECT FOUND**: the live `/api/gspc` `site_attestation` does **not** verify
  under its own published preimage rule (0/11 variants × 2 independent implementations),
  while the same payload's embedded `living_stamp` verifies VALID under the same key.
  Recorded as `RECON-2026-0920-01`; correction candidate. Per estate doctrine an
  unverifiable attestation must not be read as validating the payload — the payload's
  other attestation and the 335 cards verify independently.

## Checks run (exact commands, all rerunnable)

| Check | Command | Result |
|---|---|---|
| Full estate verify (335 cards + root + DID drift) | `node scripts/verify-estate.mjs --did-drift public/.well-known/did.json` | exit 0 — 335/335 VALID, root VALID, DID copy matches csoai.org |
| Denominator vs canon | `node scripts/drift-guard.mjs` | PASS (9/9) |
| Root recompute (declared construction) | `publish_public_root.merkle_root` over `root.json.card_sha256` | MATCH `07dd5eb3…`; count bound 305==305; 5/5 positional proofs |
| Live inclusion spot-check | `GET /api/proof?sha=<leaf>` ×2 (+ root-as-leaf negative control) | 2× VALID; root correctly INVALID("not a leaf") |
| Frozen MPC board | `node scripts/gspc-board-verify.mjs public/signed/gspc-board.signed.json` | exit 0 (22·22 — superseded 2026-08 snapshot, consistent with its dates) |
| Card-root integrity | `python3 scripts/card_root.py --verify --root <both 2026-09-14 roots>` | MATCH, leaf drift 0, OTS UNCHECKABLE (no local ots client) |
| chain.json | Rule-A id recompute + Ed25519 (pinned key) | VALID; length/head == index |
| living_stamp | Node: canonical(preimage) per published rule | VALID under `#board-attestation-1` |
| site_attestation | Node (verbatim edge `canonical()`) + Python (ensure_ascii both), 11 preimage variants | **INVALID (0/11)** |
| Withdrawn-card doctrine | `python3 scripts/verify_signed.py <withdrawn card> --did-doc …` | VALID — bytes verify post-withdrawal, by design |
| Served bytes == repo bytes | sha256 of live GET vs `public/` for card_index, root.json, did.json | 3/3 byte-identical |

## Count reconciliation

| Surface | Number | Status |
|---|---|---|
| `/signed/card_index.json` declared / rows | 335 / 335 | reconciled |
| `/api/cards` count / signed | 336 / 336 | EXPLAINED — 335 index + 1 cross-border card, disclosed verbatim in the endpoint's own note |
| `root.json` leaves | 305 | separate corpus (not measurement cards); reconciled internally |
| mill-card active set | 1424 | separate corpus; **no current commitment** (see below) |

Corpora are disjoint by design (`council-os/CARD-CORPORA.md`, identifier_overlap 0) —
never summed.

## Discrepancies / open items

1. **RECON-2026-0920-01 (HIGH) — ROOT CAUSE FOUND, LOCAL FIX APPLIED (uncommitted)** —
   live `site_attestation` INVALID under published rule. Cause: `excludeOwnLeader()` and
   `dropUncardedLeader()` in `functions/api/gspc.ts` returned `leader: undefined` as an own
   property; the signer's `canonical()` emits it as the literal `"leader":undefined` while
   `JSON.stringify` drops the key — so the signed preimage is unreconstructable from the served
   bytes (11 affected axes). Proven in-repo: handler harness shows served axes carry no `leader`
   key, and `canonical({leader: undefined})` = `{"leader":undefined}` while `JSON.stringify`
   omits it. **Fix (2 hunks, working tree): omit the key instead of setting `undefined`.**
   Served bytes proven byte-equivalent (full-body + element-wise axes comparison modulo
   attestation material). End-to-end proof through the real handler with a THROWAWAY local key:
   `site_attestation` VALID from served bytes, `living_stamp` still VALID, 23 axes, totals
   unchanged. `vitest functions/api/gspc.*` 16/16 PASS; `tsc --noEmit` clean for gspc.ts.
   REMAINING owner-side: commit/merge, redeploy via GHA-on-master, verify live, file
   `/api/corrections` entry.
2. **RECON-2026-0920-02 (MEDIUM) — CLOSED LOCALLY (uncommitted)** — card-root freshness gap:
   `python3 scripts/card_root.py` (create-only) wrote `public/interop/card-root-2026-09-20.json`
   committing the current 1424-leaf active set, root `3490a2751e46…` (matches the independently
   recomputed current-set root). `--verify`: MATCH, leaf drift 0. REMAINING: owner review,
   commit, optional OTS stamp, publish via GHA.
3. **RECON-2026-0920-03 (LOW) — OPEN** — OTS sidecar confirmation state UNCHECKABLE here
   (no ots client installed). Not asserted. No `.ots` created for the 2026-09-20 root.

## Retained states (kept explicit, per doctrine)

- UNMEASURED: effect-binding (slot 23).
- UNVERIFIABLE on the record: `board_living.json` legacy stamp (C-2026-0826-08) — not re-counted as a new failure.
- Superseded: 953 mill cards (bytes unchanged on disk); 22-axis frozen board; 2026-08-18 living stamp.
- Withdrawn: 44 mill cards — bytes still verify.

## Public URLs read back

`https://councilof.ai/api/gspc` · `/api/cards` · `/api/corrections` (58 rows) ·
`/signed/card_index.json` · `/root.json` · `/.well-known/did.json` · `/api/proof?sha=…` ×3 ·
`https://csoai.org/.well-known/did.json`

## Branch / PR / deployment state

- Branch at session start: `live-roster-cycle` (pre-existing unrelated modifications —
  untouched, including a separate lane's 2-line type-only edit inside `functions/api/gspc.ts`
  at lines ~326/~642, which this session did NOT modify and must not sweep into any commit).
- This session's changes, all UNCOMMITTED in the working tree:
  - `functions/api/gspc.ts` — the RECON-2026-0920-01 fix (2 hunks at `excludeOwnLeader` /
    `dropUncardedLeader`, comment-only otherwise)
  - `public/interop/card-root-2026-09-20.json` — new create-only commitment
  - `evidence/reconciliation-2026-09-20/` — this report
- Nothing merged or deployed. Deployment path remains GHA on protected master.

## Single highest-value next action

Commit this session's three changes on a named branch (e.g.
`fix/gspc-site-attestation-2026-09-20`) — staging ONLY the two `leader: undefined` hunks in
`functions/api/gspc.ts` (not the other lane's type-only hunks), plus the card-root file and this
evidence bundle — open a PR to master, let GHA deploy, then re-verify live:
`site_attestation` must verify from served bytes, and `/api/corrections` gains the entry.
Git mutations were deliberately not performed by this session (repo policy: confirmation
required per mutation; multi-lane tree).

*Completion note: this report describes checks actually run with the outputs above; no
claim of measurement, anchoring, or verification beyond them. Not a certification.*
