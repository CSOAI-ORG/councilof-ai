# Supersessions

A published correction is never edited. When one is itself wrong, a dated note is placed
beside it under the original name plus `-SUPERSEDES`, and this index points both ways. The
superseded file keeps its bytes so anyone who read it can see what was published.

| Superseded (unchanged) | Superseding note | Register id | What changed |
|---|---|---|---|
| `merkle-count-binding-2026-09-17.md` | `merkle-count-binding-2026-09-18-SUPERSEDES.md` | C-2026-0922-01 | Domain-separation prefixes alone do not remove the odd-node padding collision; the tree shape plus a signed size does. One paragraph; the count-binding guidance stands. |
| `living-stamp-unverifiable.json` | `public-corrections-living-stamp-unverifiable-json-2026-09-22-SUPERSEDES.md` | C-2026-0924-01 | public/corrections/living-stamp-unverifiable.json lists 7 slots as UNMEASURED; the live board carries 0 UNMEASURED axes |
| `living-stamp-unverifiable.json` | `public-corrections-living-stamp-unverifiable-json-2026-09-22-C-2026-0924-02-SUPERSEDES.md` | C-2026-0924-02 | public/corrections/living-stamp-unverifiable.json: attestations_that_do_verify (measurement cards) 150 -> 335 |
| `/claims/claimreg-ai-assurance-and-settlement-2026-09-23.json` (sha256 `0fb10e73e325…`, signed, timestamp receipt present) | `/claims/claimreg-ai-assurance-and-settlement-2026-09-23-rev2.json` | claimreg-ai-assurance-and-settlement-2026-09-23-rev2 | Extractor re-baseline, 2026-09-25 (spec v0.2 §5.6.1, §6.3.1, §16). All 40 visible-text digests re-read live and re-baselined from csoai-visible-text/1 to /2. On 16 of them the page was unchanged under rule 1 and only the reader changed, so none is an observed change. On 20, rule 1 compared with itself differs from the capture, and each is recorded as a neutral observed change. The 22 raw-bytes digests are carried unchanged. |
| `/claims/claimreg-hiring-platforms-2026-09-24.json` (sha256 `b36639e64146…`, unsigned) | `/claims/claimreg-hiring-platforms-2026-09-24-rev2.json` | claimreg-hiring-platforms-2026-09-24-rev2 | Extractor re-baseline, 2026-09-25, same method. 26 visible-text digests re-baselined. On 11 only the extractor differs, so no change is recorded. On 7, rule 1 compared with itself differs from the capture, and each is recorded as a neutral observed change. The 3 raw-bytes digests are carried unchanged. |
| `docs/corrections/2026-09-25-board-snapshot-refreeze.md` | `docs/corrections/2026-09-25-board-snapshot-refreeze-SUPERSEDES.md` | GAP-REGISTER-2026-10-26#A19 | The board frame the 25 September note quotes ("23 axes · 23 measured · 0 unmeasured") is superseded: the live board reads 33 axes · 23 measured, with 10 declared slots and no run behind them. The note's own finding — the signed snapshot was stale — stands. |
| `docs/tui4/gap-register-2026-10-07-probe-1108Z.json` | `docs/tui4/gap-register-2026-10-07-probe-1108Z-SUPERSEDES.md` | GAP-REGISTER-2026-10-26#A19 | The `public_count` the 2026-10-07 probe recorded is superseded: the live door reads 33 axes · 23 measured. The probe was VERIFIED and correct on its capture date; the run artefact is not edited. |
| `measurement/ietf-audit-live-readback-2026-10-01.json` | `measurement/ietf-audit-live-readback-2026-10-01-SUPERSEDES.md` | GAP-REGISTER-2026-10-26#A19 | The `observed` block of the 2026-10-01 readback is superseded: the live estate reads 33 axes, 325 cards, a different root, merkle root, Rekor logIndex and Bitcoin block. `gspc_measured_axes` (23) and `corrections_signature_state` (VALID) did not move. The `endpoints` block stands. |

The last three rows supersede **repository** artefacts, not published surfaces: the three
superseded files live under `docs/` and `measurement/` and are not served by this site, so
their notes stand beside them in the same repository rather than beside a published URL. The
register id is the gap-register row (`measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md`,
gap A19) rather than a corrections-ledger id, because the ledger's own signature covers the
bytes of its entries and is re-issued by a separate owner-gated step; no entry was added here
and no signed ledger byte was moved.
