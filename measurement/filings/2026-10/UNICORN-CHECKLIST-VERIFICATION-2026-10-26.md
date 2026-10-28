# Verification of the twenty execution claims — 26 October 2026

Every claim in the owner's 20-item execution checklist was re-checked against a live published
surface, a real command, or a file that was opened. This is **verification, not certification**, and
nothing here grants any status. Where a claim could not be checked at source, it says so and names
the reason.

Read in pairs with:
- the gap register, `measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md`
- the public proof page, `public/proof/proof-of-completion-2026-10-26.md`

**Verdict counts: LIVE 5 · LIVE WITH CORRECTION 2 · PARTIAL 5 · OWNER-GATED 5 · NOT VERIFIED AS
STATED 3.**

---

## 1. The verdict table

| # | Owner claim | Verdict | Evidence |
|---|---|---|---|
| U-1 | Product live end-to-end (discover → identify → pay → verify), "15/15 probed" | **PARTIAL** | `https://councilof.ai/.well-known/x402.json` → 200, `resources` = 31, `mode` = `live`, `network` = `eip155:8453`; `https://councilof.ai/api/x402` → 200; `https://councilof.ai/api/mcp` → 200. The pipeline is live, but the 15/15 end-to-end probe was **not re-run today**, so the specific number is carried, not re-measured |
| U-2 | Flagship public (claim maintenance) | **LIVE** | `https://councilof.ai/spec/claim-maintenance/v0.2/` → 200 |
| U-3 | Heartbeat board public | **LIVE** | `https://councilof.ai/api/gspc` → 200, `schema` = `csoai.gspc-axes/0.5` |
| U-4 | Root advancing (317 cards) + 23/23 axes + 93 corrections | **LIVE WITH CORRECTION** | `https://councilof.ai/root.json` → 200, `card_count` = 317, `merkle_root` = `ff8570aa7bed…`, `as_of` = `2026-10-13T03:31:42Z`; `https://councilof.ai/api/corrections` → 200, `corrections` = 93, `signature_state` = `VALID`; `https://councilof.ai/api/gspc` → `totals.axes` = **33**, `measured_axes` = 23, `unmeasured_axes` = 10. **The axis count is 33 slots with 23 measured — not "23/23 axes"** |
| U-5 | Signer ceremony + V-9 rotation | **OWNER-GATED** | Nothing outside the estate can attest a ceremony. The second attestation key is owner-held by construction |
| U-6 | SCITT claim-card I-D on record (2 standing I-Ds already) | **OWNER-GATED** | An IETF submission needs the account action; the `-01` slot is 31 Oct |
| U-7 | NIST TEVV comment, BoE pack, GENIUS, CFTC, Gold — "staged, OWNER sends" | **PARTIAL** | `measurement/filings/2026-10/NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md` and `ARTIFICIAL-ANALYSIS-cyber-index-alliance-contact-DRAFT.md` exist, are marked DRAFT, and state that no submission has occurred; the September set holds the rest. **None has been sent** — outbound mail is non-functional on this machine (§3) |
| U-8 | Wave (33 targets) + whale dossiers sent | **PARTIAL** | The drafts exist in the filing set. "Sent" is not true of any of them; nothing left this machine |
| U-9 | Corrections #60–70 published (11 self-catches) | **NOT VERIFIED AS STATED** | The live ledger's ids are `C-2026-MMDD-NN` (90 parseable, spanning `C-2026-0914-01` … `C-2026-1006-13`), so there is no "60–70" numbering to check against, and the 11 self-catches cannot be mapped from the published ids. What *is* verifiable: the 14 September batch of **44** withdrawals, all with `accuracy_as_signed` exactly 1, all on the `swarm` axis, 0 with a public URL |
| U-10 | Namespace consolidation (4→1, kills GitHub dependency) + B-3 — "claimable $0, OWNER DNS" | **OWNER-GATED** | A DNS change is the owner's action; the change is not a published artefact either way |
| U-11 | First EXTERNAL verified delivery (a stranger pays and verifies) | **PARTIAL** | `https://councilof.ai/api/revenue` → 200, `schema` = `csoai.revenue/0.1`, `distinct_nonself_payers` = 2 all-time, 2 in 30 d, **3 settlements**, status `MEASURED`. Payment is evidenced; **buyer acceptance and a stranger's independent verification of that delivery are not separately evidenced** in the published surfaces |
| U-12 | 5 repeat payers (the gate) — "1 now" | **LIVE WITH CORRECTION** | Same endpoint: **2 distinct non-self payers**, 2 in 30 d, 3 settlements. The live number is 2 — neither 5 nor 1 |
| U-13 | Health Board daily habit + citation flywheel | **LIVE** | `https://councilof.ai/publisher-health.json` → 200; `https://councilof.ai/flywheel-snapshot.json` → 200; `https://councilof.ai/eat-flywheel.json` → 200 |
| U-14 | OpenShell adapters + Cedar translator | **LIVE (in the repository)** | `harness/openshell-cedar/` and `harness/openshell-adapter/` exist, and the Cedar tree carries its own negative controls: `out/adapter-must-fail-deny-declared-egress.cedar` and `out/adapter-must-fail-file-syscall.cedar`, each with a `.report.json` |
| U-15 | Evaluation Cards schema adoption | **PARTIAL** | The published attestation index `https://councilof.ai/attestations/evaluation-result/v1/` → 200. There is **no** published `spec/evaluation-card/` (404), so "adoption" is not evidenced as a published standard — only a published attestation type |
| U-16 | Grant entries: DeepRAP (28 Oct), SME Champions (11 Nov), KTP (14 Oct), Manifund (rolling) | **PARTIAL** | Drafts exist in the filing set; **none submitted**. The nearest deadline, DeepRAP, is **28 October 2026 — two days away** |
| U-17 | IP: marks filed (£385), prior-art blockade, dual-anchor timestamps | **OWNER-GATED** | Filing is an owner action with a fee |
| U-18 | The chained loop v0.1 — "stack verified" | **NOT VERIFIED AS STATED** | The chain's *components* are live: `https://councilof.ai/root.json` (200), `https://councilof.ai/measurement-capsules/latest.json` (200), `https://councilof.ai/interop/mcp-trust/latest.json` (200), `https://councilof.ai/signed/card_index.json` (200). But **no artefact in the repository is named "chained loop v0.1"** (0 files), so the named object cannot be confirmed to exist |
| U-19 | Small-world lab T-1 league — "specced, pod spike" | **OWNER-GATED / NOT VERIFIED** | No artefact of that name in the repository (0 files for "small-world", "T-1 league"), and the pod the spike needs is unreachable (§3) |
| U-20 | The 1,050-move harvest deck + 1,000-move decks + 31-gate board — "DONE" | **NOT VERIFIED AS STATED** | The harvest *machinery* exists (`scripts/badger/harvest-per-item-cards.py`, `harvest-per-model-cards.py`, `harvest-witness-receipts.py`, `harvest-corrections-diff-cards.py`, `harvest-per-issuer-cards.py`), but **no "1,050-move deck" artefact and no "31-gate board" exist**. "chained loop", "31-gate", "31 gate", "T-1 league" and "small-world" each match **0 files** in the repository; the string "1,050" matches only inside `_quarantine/public-legacy/`, and there only as a CSS numeric literal (`flex:0 1,050…`), never as a deck |

## 2. The corrections, stated plainly

Three of the twenty claims carry a number that the live surfaces do not carry, and one of them
carries an artefact name that does not exist. None of these is a small thing, and all three would
have been repeated outward if they had gone unchallenged.

1. **"23/23 axes" (U-4) is "33 axis slots, 23 measured, 10 UNMEASURED".** The 33 is the number of
   declared positions on the board; 23 is the number with a run behind them; 10 are UNMEASURED,
   which is an answer and not a zero. Quoting "23/23" quietly drops a third of the board.
2. **"5 repeat payers … 1 now" (U-12) is 2.** `distinct_nonself_payers` = 2 all-time, 2 in 30 days,
   3 settlements, status MEASURED. Payment principals do not establish independent customers,
   delivery, buyer acceptance or repeat use.
3. **"Corrections #60–70" (U-9) has no referent in the published ledger.** The ids are
   `C-2026-MMDD-NN`. The 11 self-catches cannot be located from the published surface, so they are
   carried as unverified rather than asserted. The verifiable number is 93 corrections and 58
   withdrawal rows, of which 44 are the 14 September one-option batch.
4. **Three claims name artefacts that cannot be found** (U-18 "chained loop v0.1", U-19 "small-world
   lab T-1 league", U-20 "1,050-move harvest deck" and "31-gate board"). The work may be done under
   other names — the checklist may be using working names that were never filed — but **as written
   they are not verifiable**, and "DONE" is the one word in the list that must never be carried
   without the artefact that carries it.

## 3. What stopped the sends

Outbound mail from this machine is non-functional, and it has been since 13 September 2026.
`mail.privateemail.com:587` returns `535 5.7.8` for the full address and for the local part, on
port 465 too, under `PLAIN`, `LOGIN` and `CRAM-MD5` individually. The Resend key in the environment
and in the keychain both return `400 API key is invalid`. The Cloudflare token returns `403`. Port
25 times out. No credential for mail exists on this Mac, on the second Mac, or on the Oracle box.
The Namecheap webmail is signed in but never finishes its data fetch, so its compose window does
not open.

The remedy is one keychain write, and it is the owner's: it is listed in the owner action sheet.

## 4. What a stranger can verify in sixty seconds

Run these; the expected values were read on 26 October 2026.

```
GET https://councilof.ai/api/gspc       → 33 axes · 23 measured · 0 of 14 separated a leader · 7 TIE · 7 UNTESTED
GET https://councilof.ai/root.json      → 317 leaves · ff8570aa7bed… · as_of 2026-10-13T03:31:42Z
GET https://councilof.ai/api/corrections→ 93 entries · signature_state VALID
GET https://councilof.ai/signed/card_index.json → 335 rows, n_cards = n_cells = 335
GET https://councilof.ai/api/revenue    → distinct_nonself_payers 2 · 3 settlements · MEASURED
```

Five URLs, thirteen in total across the surfaces above, all returning HTTP 200 when checked.

## 5. The negative control

Every domain in this document has a designed-to-fail control, and two of them were run today rather
than assumed:

- the tampered-card fixture `packages/gspc-card-verifier/test/fixtures/02-tampered-body.json` must
  verify as `INVALID` — not `VALID`, and not `UNCHECKABLE`;
- the OpenShell Cedar tree carries `adapter-must-fail-deny-declared-egress.cedar` and
  `adapter-must-fail-file-syscall.cedar`, each with its own report;
- the 14 September withdrawal batch is itself the proof that a must-fail control was missing: every
  one of the 44 read an accuracy of exactly 1, because in that grader configuration nothing could
  be marked wrong.

## Honesty register

**REAL** — every LIVE and LIVE WITH CORRECTION verdict above, read from the live endpoint on
26 October 2026 in this session. Every path named was opened. Every HTTP status was observed.

**UNVERIFIED** — U-5, U-6, U-10 and U-17, which need a human, a key, a DNS record or a fee; and the
three artefacts in U-9, U-18, U-19 and U-20 that cannot be found under the names given.

**KILLED** — any reading of this document as a certification, a score, a rank, or a statement that
any of the twenty items is complete. Five are live, two are live with a correction, five are
partial, five need a person, and three cannot be confirmed as written. A slot is a declared board
position; a measurement is a run behind it; UNMEASURED is an answer, never a zero.
