# Proof of completion — 26 October 2026

**A ledger of checks, not a claim of completeness.** Every line here is something a reader can run
and get a value. Where a domain is not finished, that is said here, in the same place, rather than
left for you to discover. Nothing on this page is a certification, a score, a rank, or a
conformity determination, and we do not certify.

Two vocabularies, used consistently:

- A **slot** is a declared position on a board. A **measurement** is a run behind it. The two are
  never summed and never swapped, and both are quoted where they appear.
- **UNMEASURED** is an answer. It is never 0, and it is never a failure.

CSOAI Ltd (Council of AI) · 3rd Floor, 86-90 Paul Street, London EC2A 4NE ·
26 October 2026 · nicholas@csoai.org · https://councilof.ai

---

## 1. The one-minute check

Five requests. Every value below was read on 26 October 2026.

| # | Request | Expected now | What it is |
|---|---|---|---|
| 1 | `GET https://councilof.ai/api/gspc` | `33 axes · 23 measured` (10 unmeasured); separation `0 of 14` separated a leader, `7 TIE`, `7 UNTESTED` | The living measurement board |
| 2 | `GET https://councilof.ai/root.json` | `317` leaves, `merkle_root` `ff8570aa7bed…`, `as_of` `2026-10-13T03:31:42Z`, signature present | The signed public root |
| 3 | `GET https://councilof.ai/api/corrections` | `93` corrections, `signature_state` = `VALID` | The public corrections ledger |
| 4 | `GET https://councilof.ai/signed/card_index.json` | `n_cards` = `n_cells` = `len(cards)` = `335` | The signed-card index (a **different population** from #2, by design) |
| 5 | `GET https://councilof.ai/api/revenue` | `distinct_nonself_payers` = 2 all-time, `3` settlements, status `MEASURED` | Payments, read as a publisher metric |

A TIE is not a win and UNTESTED is not a tie. #1 separates nobody, and does not claim to.

## 2. The part that is a person, not a signature

Every machine-verifiable thing on this page is a signature, a hash, or a root. None of them decides
anything. The decisions are made by a named human, and each one leaves a record.

- **Approval is a gate, not an attestation.** A recorded human decision is what authorises a
  consequential action; a valid signature proves bytes, not permission. The schema that separates
  the two is `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json`, and
  the profile that explains it is
  `docs/standards/osaia-safe-reverification/HITL-AUTHORITY-EFFECT-PROFILE.md`.
- **The negative control is the point.** An approval that does not actually gate the dependent
  action must be **rejected**. `test_hitl_authority_effect.py` and
  `test_approval_dependency_binding.py` exist to prove the gate can fail: the same reasoning that
  caught our own 44 withdrawn results on 14 September 2026 — every check passed, and nothing could
  have failed.
- **A maintained claim is not authority.** A claim that is current for its observed baseline is
  evidence state; whether an accountable principal presently permits an action is authority state.
  Neither extends the other. See
  `docs/standards/osaia-safe-reverification/SAFE-HITL-CLAIM-MAINTENANCE-BINDING.md`.
- **A claim that goes out of currency is recorded on the artefact.** Our signed board freeze states
  23 axes / 23 measured; the living board states 33 / 23. The freeze's own pointer carries
  `relying_party_status.state = "SUPERSEDED_KNOWN_CLAIM_DEFECT"` and names the living board as the
  current authority, so a reader does not have to work it out. The designed-to-fail control for
  that comparison — the same extraction against a document that is not the board — **was executed**,
  not asserted.
- **Delegation receipts map to recorded decisions.** `public/spec/delegation-receipt/CROSSWALK.md`.

## 3. The ledger by domain

Each domain lists what to run, and where it has a **negative control**, that control is named —
because a domain whose instrument has never failed has not been shown to work.

| Domain | The check | Its negative control |
|---|---|---|
| Evaluation | `GET /api/gspc` → schema `csoai.gspc-axes/0.5`, 33 slots / 23 measured, separation line | The board's own limits are published in `limitations[]` |
| Public evidence | `GET /root.json` → `card_count` = `len(card_sha256)` = 317; `GET /interop/root-witness-pointer.json` → Rekor `WITNESSED`, OpenTimestamps `CONFIRMED_BITCOIN`, `conflict.status` = `NONE` | A presentation whose leaf list length ≠ `card_count` must be rejected |
| Card verification | `GET /signed/card_index.json` → 335 rows; recompute one card's id from the stated preimage rule | `packages/gspc-card-verifier/test/fixtures/02-tampered-body.json` must verify as `INVALID` — not `VALID`, not `UNCHECKABLE` |
| Agent identity | `GET https://csoai.org/.well-known/did.json` → 7 verification methods; the `#board-attestation-1` key must equal the `public_key_x` in `/api/gspc` | A key that does not match must not verify |
| Agentic payments | `GET /.well-known/x402.json` → 31 resources, `mode` = `live`, `network` = `eip155:8453`; a metered endpoint without payment returns **402** with amount, network and payTo | The free endpoints must **not** return 402 — the free/paid boundary is the instrument's own boundary test |
| On-ledger state | `GET /root.json` → `sources` includes the XRPL metrics source; the signature preimage states the six fields | Leaf-list length ≠ `card_count` must be rejected |
| Corrections | `GET /api/corrections` → 93 entries, `signature_state` = `VALID` | A tampered correction body must not verify |
| Claim maintenance | `GET /interop/gspc-board-freeze-pointer.json` → the supersession is machine-readable on the artefact | The freeze's `NOT_IMPLEMENTED` quarantine notice is published rather than hidden |
| Filings | `measurement/filings/2026-10/INDEX.md` → the October set; every draft is marked DRAFT and states that no submission has occurred | The honesty register carries UNVERIFIED claims with the source opened, rather than dropping them |
| Human-in-the-loop | `docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.1.schema.json` validates its example; both test modules pass | An approval that does not gate the dependent action is rejected |

## 4. What is not done, stated here rather than discovered later

**Closable by engineering, no owner input** — the derived figures are regenerated from the URLs
they cite, so a reader sees what the API returns; the profile generator no longer prints the
company registration number our correspondence does not carry, and the drafts it produces agree
with it; a published portfolio of dated contributions, a dated research map of what other bodies
published between September and October 2026, and a dated gap register, all in the repository.

**Owner-gated** — a working outbound mail credential, so the NIST NCCoE and Artificial Analysis
notes can actually be sent rather than only filed; an npm token for the reader package; a
`SNAPSHOT_PR_TOKEN` repository secret; a DNS A record for `www.csoai.org`; a signing ceremony for
the second attestation key; an IETF submission slot; and a co-author with a normal GitHub account,
without which the Alliance pull request cannot be opened.

**Structural** — we cannot independently evaluate a proprietary model without a consortium and an
enclave, and no amount of our own engineering changes that. The White House Accord on Super
Intelligence asks signatories to "partner with an independent external auditor or evaluator" and
defines neither independence nor a register of auditors; until someone publishes that criterion,
our "independent measurement body" claim rests on our own signing. We would rather say that than
imply a standard that does not exist.

## 5. How these numbers are dated

Every figure on this page carries the date it was read. The derived documents are regenerated from
the endpoints they cite, so a stale figure is a bug in the generator rather than a stale sentence in
a document. Where a figure can only be read live — the corrections ledger, the board, the root —
the URL is given instead of the number, because the number moves and the URL does not.

Corrections to this page are made visible, not silent. The published 17 September contribution
carries a dated note recording that its company registration number was removed at our request,
that a garbled supersession count was replaced with the 93 corrections the signed ledger actually
holds, and that 26 of the 44 withdrawn results were **signed** MEASURED while **none of the 44
carried a public URL**. The 17 September figures stand as read on that date.

## Honesty register

**REAL** — every value in §1 and §3 was read from the live endpoints on 26 October 2026, in this
session, and the signatures verified on the request.

**NOT VERIFIED** — that any domain is complete. §4 lists what is missing, and it is not short.

**KILLED** — any reading of this page as a certification, a rank, a completeness claim, or a
statement that a signature grants permission. A signature proves bytes at a time. A person decides,
and the record says who.

The underlying gap register, with the engineering-closable and owner-gated split in full and the
sources for every claim, is in the repository at
`measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md`. The research map behind the
structural paragraph is at
`measurement/research/2026-10/UNICORN-LANDSCAPE-2026-10-26.md`.
