# DRAFT, needs owner approval: supersession plan for the visible-text extractor fix

Status: **DRAFT. Nothing below is executed.** No published registry, reference copy, manifest,
schema or deposit was edited. Branch `claims/extractor-decode-once-20260925`, based on master
`ac8b63617`. It is not landable until this plan is approved, because the reference byte-identity
gate fails, which is correct.

## 1. The defect, stated exactly

`extractVisibleText` in `scripts/claim-capture.mjs` (published byte-for-byte as
`/spec/claim-maintenance/v0.1/reference/claim-capture.mjs`, manifest sha256 `a634515b…`,
Zenodo 10.5281/zenodo.22901908) departs from spec §6.3 step 2 ("the text of the nodes") in
four ways:

| Input | Rule 1 (published) | Spec §6.3 / rule 2 (this branch) |
|---|---|---|
| `it&#x27;s` | `it&#x27;s` (hex never decoded) | `it's` |
| `&rsquo;` `&mdash;` `&euro;` `&rarr;` … | left as written (5 names only) | decoded from a published table |
| `it&amp;#39;s`, `&amp;quot;`, `&amp;lt;` | `it's`, `"`, `<` (decoded **twice**) | `it&#39;s`, `&quot;`, `&lt;` (decoded once, as a reader sees them) |
| `&#99999999;` | throws RangeError, so the capture fails | U+FFFD |

The report that arrived as "double-encoded `&amp;#x27;` is not decoded" was a paraphrase. The
lane's own note (docs/measurement/HIRING-PLATFORMS-2026-09-24.md, capture note 2) says
single-encoded `&#x27;`. Rule 1 already renders `&amp;#x27;` as `&#x27;`, which is correct, but
only by accident. Making it an apostrophe would move the extractor further from the spec.

## 2. What changes digest (measured 2026-09-25, on Oracle, with a live read of every source URL)

Published registry **bytes**: none change. Registries store `source_content_hash` computed at
capture time and not the HTML, and neither check script calls the extractor:

- `node scripts/claim-maintenance-register.mjs --check`: `[register] OK — 28 subject(s), 99 claim(s), 3 live registry file(s) (1 superseded)`, exit 0
- `node scripts/claim-maintenance-spec.mjs --check`: `[spec] OK — 4 derived file(s) match the document of record`, exit 0

What changes is what those digests **recompute to**. Each recorded visible-text URL was read
live and extracted under both rules:

| Registry (live, bytes = repo) | visible-text digests | pages where rule 1 ≠ rule 2 | recorded digest still reproduces under rule 1 today | of those, rule 2 gives a different digest |
|---|---|---|---|---|
| `claimreg-ai-assurance-and-settlement-2026-09-23.json` | 40 (14 URLs) | 32 digests / 11 URLs | 20 | **16** |
| `claimreg-hiring-platforms-2026-09-24.json` | 26 (12 URLs) | 18 digests / 9 URLs | 19 | **11** |
| `claimreg-ondo-chainlink-2026-09-22.json` | 0 | none | none | none |
| `claimreg-ondo-chainlink-2026-09-22-rev2.json` | 0 | none | none | none |

The last column counts pages that have not changed since capture but would appear to change if
the watcher switched rules silently: **27 false `observed_changes`**. `&#x27;` accounts for 17
of the 20 sensitive URLs. The other three are `&euro;` (ECB x2), `&rarr;`/`&raquo;`/`&copy;`
(arize, the Wayback copy of paymanai). This is a snapshot of pages as served today, not at
capture time.

Also rule-dependent: the reference copy and its manifest, the Zenodo deposit's
`reference-implementation-claim-capture.mjs`, `public/verifier/receipt-toolkit.json` (links to
the reference by URL, not by digest), and `public/claims/series/*.jsonl` (`page_sha256` per read;
12 files, append-only).

## 3. Proposed supersession (in landing order, one gated merge)

1. **Freeze rule 1.** Leave the v0.1 reference copy, its manifest, the schema and the deposit
   byte-for-byte unchanged. Rule 1 is then defined as "the extractor in the v0.1 reference,
   sha256 a634515b…".
2. **Make the rule recordable. OWNER DECISION A.** The v0.1 artifact schema sets
   `additionalProperties: false` on `source_content_hash`, so an artifact cannot say which rule
   made its digest. Options:
   - (a) **spec v0.1.1**: schema adds optional `source_content_hash.extractor` (e.g.
     `"csoai-visible-text/2"`; absent = rule 1). §6.3 text is unchanged, and an erratum paragraph
     names the four departures above. New Zenodo version under the concept DOI. *Recommended*:
     smallest change that makes the rule visible inside the digest (§6.5).
   - (b) spec v0.2 carrying the same change plus anything else queued for v0.2.
   - (c) no schema change; record the rule only at registry level. This is weaker, because a
     single artifact taken out of its registry no longer says how to reproduce its digest.
3. **Publish rule 2 as a new reference version** at a new path (e.g.
   `/spec/claim-maintenance/v0.1.1/reference/claim-capture.mjs`) with its own manifest whose
   `supersedes` names the v0.1 reference path and sha256. Point
   `scripts/claim-capture.cli.node-test.mjs` and `client/src/pages/ClaimMaintenance.test.ts:152`
   at the new path, so the byte-identity gate goes green for the right reason. Update the
   `IMPL` link in `ClaimMaintenance.tsx`, the llms templates and `receipt-toolkit`.
4. **New dated registries, supersede by reference** (the `-rev2` pattern already used for
   ondo-chainlink, with `supersedes: {registry_id, file, sha256, rule}`):
   - `claimreg-ai-assurance-and-settlement-<date>-rev2.json` supersedes
     `…-2026-09-23.json` (sha256 `0fb10e73e325…`)
   - `claimreg-hiring-platforms-<date>-rev2.json` supersedes `…-2026-09-24.json`
     (sha256 `b36639e64146…`)

   Each re-captures every visible-text digest live under rule 2, with `extractor` set and a new
   `access_date`. This must be a live re-capture, because the HTML behind rule-1 digests was
   never stored. The two ondo-chainlink registries have no visible-text digests and are **not**
   superseded. Claims avoided or shortened because of the apostrophe (IN-1, per the capture note)
   may be recaptured verbatim in rev2, listed as new artifacts and not as changes.
5. **Watcher (`scripts/claims/reread.mjs`, `watch_run.py`): compare like with like.** If a
   recorded digest carries no `extractor`, recompute under rule 1 for the comparison. A rule-1
   versus rule-2 difference on the same bytes is an extractor change and is never written as an
   `observed_change`. Without this, the next watch run records the 27 false changes above.
6. **Series files** stay append-only: reads after the switch carry `extractor`, and earlier lines
   are not rewritten.
7. **Index**: add rows for both registries to `public/corrections/SUPERSESSIONS.md`, regenerate
   `register.json` (`--check` then shows 3 superseded), OTS-stamp the new files, and re-sign
   through the usual signer path.

## 4. Owner decisions

- **A.** Schema route (a), (b) or (c) above.
- **B.** Whether the hiring-platforms registry (unsigned, not timestamped, live since 24 Sep)
  gets the full supersession, or is withdrawn and reissued. Recommend supersession: it is served,
  so readers may hold its bytes.
- **C.** When to re-capture. The rev2 registries carry a new `access_date`, so any claim that has
  changed at source since capture shows up as an ordinary observed change, reported neutrally.

## 5. What this does not do

It does not make rule 2 a full HTML5 decoder. Named references outside the published table, and
references without a closing `;`, are left as written, and that limit is part of the published
rule. It does not re-derive any rule-1 digest, and nothing in it says a subject's page changed.
