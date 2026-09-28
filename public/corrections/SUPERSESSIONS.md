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
