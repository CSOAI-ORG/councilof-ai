# ALIGNMENT REPORT — 7 October 2026 (04:55 BST)

**Purpose:** record what drifted between 17–19 September (last M4 session) and now,
against the M4 GOAL MODE 18 Sep brief's five DONE WHEN rows and the Arc/Circle
mapping. Read-only recon + file repairs only. Per the 18 Sep HARD STOP: no push,
merge, dispatch, signing, or editing of published bytes. All new files uncommitted.

## What changed in the world (verified live, 2026-10-07)

| Fact | 18 Sep 2026 | 7 Oct 2026 | Source |
|------|-------------|------------|--------|
| Board state | 22 measured / 1 unmeasured | **23 measured / 0 unmeasured** | /api/gspc |
| effect-binding (axis 23) | UNMEASURED (design-only) | **MEASURED, n=261, ADR-002, signed, with altered-preimage control that fails**; Oct re-probe signed n=267 | commit dba6efea6, 3b7ab8852 |
| Corrections | 58 entries, signature_state STALE | **93 entries, signature_state VALID** (re-signed; corrections ledger landed in c5df80a36 T01–T12) | /api/corrections |
| Revenue | issuance 8; proofs null/UNMEASURED | **issuance 13; proofs 1 MEASURED** | /api/revenue |
| GitHub Actions | DEAD (422, ticket #4720908) | **LIVE** — "Build + deploy site" ran success 2026-10-07T02:59:52Z | gh run list |
| Master | PR #2640 era | **PR #2845 landed** (doctrine: withdraw /brief) | git log |
| OTS anchors | 2,601 real, 401 bound, 2,200 unbound | 2,546 real, 390 bound, **2,156 unbound** | local scan |

## The five DONE WHEN rows — status now

### A. Board rows vs artifacts (labour/ai-adoption disagreement)
**STILL OPEN — 8/8 financial axes disagree.** Re-run today at the corrected paths:
- n now matches everywhere (board.n == card.n on all 8) — the 18 Sep "n=2 says 57.58" shape has partially healed
- **But every card/run still says `risk_verdict=UNMEASURED` while the board row says `status=MEASURED`** — the exact shape we audit others for
- Card values still absent from board numeric fields (labour: card 57.58/5.92 vs board [2, 43])
- Receipt: `public/interop/audit-finance-disagreement-2026-10-07.json` (sha256 76b0f8fc…)
- **Fix required at the producer, not the row** (per brief). Not ours to sign off — needs the axes-producer lane.

### B. Rate-without-denominator
**SAME SINGLE VIOLATION.** 6,031 files scanned (was 5,981):
- `public/interop/fin7-skeletons/coverage-leftover.json` → `fin7.scitt.we_operate_a_ts` lacks a sibling count
- Receipt (18 Sep): `public/interop/rate-denominator-audit-2026-09-18.json`

### C. Unbound anchors (ANCHOR_WITHOUT_SUBJECT)
**IMPROVED BUT OPEN.** 2,156 unbound (was 2,200). Register from 18 Sep is stale by 44
anchors (net): 55 real proofs disappeared (2,601→2,546 — likely superseded/re-stamped)
and 44 bound. The 18 Sep register (`unbound-anchors-register-2026-09-18.json`) must be
re-generated before it is quoted as current. Not re-generated this pass (scan above is
the receipt of counts only).

### D. effect-binding measurement design
**CLOSED BY OTHERS — better than designed.** ADR-002 (22 Sep) measured slot 23 on a
signed server-probe run (BINDS 0 · PARTIAL 23 · DOES_NOT_BIND 238; UNCHECKABLE 230,
UNREACHABLE 78 recorded never counted), ED25519-signed via /api/board-sign, verified on
pod and Mac **with an altered-preimage control that fails** — exactly the falsifiability
gate the 18 Sep design demanded. The per-tool effect-binding census (index 0.2) and
monthly re-probe (n=267, signed) are now standing. Our design doc
(`effect-binding-measurement-design-2026-09-18.md`) is a historical design record only.

### E. Correction propagation standing
**REFRESHED.** Watcher re-run today: 93 corrections scanned, signature_state VALID,
oldest correction 24 days since first observation. Receipt:
`public/interop/correction-watch-2026-10-07.json` (sha256 3aba3cd2…). Note:
`watch_corrections.py` was itself edited on 19 Sep (OUT renamed to
`correction-inventory-2026-09-19.json`) by another lane — absorbed, no conflict.

## File repairs made this pass (local only, uncommitted)

1. `scripts/audit_financial_axis_disagreement.py` — card path drift fixed (cards moved
   dist/client/interop/ → public/interop/; runs are financial-measure-run-*.json), fetch
   switched to curl (Python 3.14 urllib lacks CA certs: CERTIFICATE_VERIFY_FAILED),
   OUT renamed to the current date.
2. `scripts/watch_corrections.py` — fetch switched to curl, OUT renamed to current date.
3. `public/interop/arc-circle-business-model-mapping-2026-09-18.md` — was a 474-byte
   truncated stub (network interruption 17 Sep); restored to the full 6,408-byte
   version recovered from the stray path `/Users/nicholas/public/interop/` (written to
   the wrong root during the interruption). The stray copy is left in place (no rm per
   red lines); it can be trashed by the owner.

## Missing from "what we was doing last" — the gap list

1. **Producer fix for Row A** (risk_verdict vs status + card values vs board fields) —
   the 18 Sep brief's core demand, still unfixed 20 days on. This is the top open row.
2. **coverage-leftover.json denominator** — trivial fix (add a sibling count or rename
   the boolean key), never made.
3. **Unbound-anchor register refresh + decision** — 2,156 anchors still bind to nothing;
   the "land the payloads or keep the register current" decision from DONE WHEN C is
   half-taken (register exists, is stale).
4. **Catapult** — still a written spike (`catapult-shape-2026-09-18.md`). With GHA back
   and the signer live (ADR-002 signed successfully 22 Sep), the catapult's fail-closed
   gate conditions have CLEARED — it is now buildable. It has not been built.
5. **The 18 Sep five receipts never landed anywhere public** — they sit uncommitted in
   this working tree per the HARD STOP. GHA is back and merges are flowing (through
   #2845) so the flag risk that motivated the stop appears resolved, but the brief said
   "write to branches only if the owner says so" — owner authorization is the one thing
   still standing between these files and the public record.

## HARD STOP status

The 18 Sep HARD STOP (no push/merge/dispatch to CSOAI-ORG) is **still honoured** — this
pass wrote local files only. Its factual basis has changed (GHA restored, account active,
PRs merging). Recommend the owner lift or confirm it so the Row A producer fix, the
register refresh, and the catapult build can go through normal lanes.
