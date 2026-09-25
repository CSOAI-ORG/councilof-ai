# Supersession record: the visible-text extractor fix (spec v0.2)

**Approved by the owner 2026-09-25.** Approval was given in chat with the single word "YES", in
reply to: "approve the plan in docs/claims/DRAFT-extractor-supersession-2026-09-25.md? — a dated
v0.2 reference extractor that re-baselines the 27 fingerprints, with v0.1 kept byte-for-byte as
published". This file is that plan, renamed from `DRAFT-…` once it was executed. The plan's text
is kept below unchanged. This section records what was executed and what was measured.

Branch `claims/extractor-decode-once-20260925`, on master `ac8b63617`. Executed on Oracle
(`~/lanes/claim-entity-decode`, Node v20.20.2). Nothing was pushed, deployed, signed, timestamped
or deposited.

## Decisions taken

- **A, the schema route.** The content of route (a), the recommended one, numbered **0.2**. The
  schema adds an optional `source_content_hash.extractor` (and an optional `extractor` on an
  observed change). §6.3 is unchanged, and an erratum names the four departures. It is numbered
  0.2 and not 0.1.1 for three reasons. The owner approved "a dated v0.2 reference extractor". The
  spec's own §12 names versions `vN.M`. And `scripts/claim-maintenance-spec.mjs` only recognises
  `vN.M` directories. Nothing else was queued for v0.2, so route (b) would have added nothing
  beyond this.
- **B.** Recommended option taken: the hiring-platforms registry is superseded, not withdrawn.
- **C.** Re-captured 2026-09-25, from 05:30Z, by one live read per URL. The read time of every
  digest is recorded per row in each rev2 registry under `extractor_rebaseline.digests`.

## A defect found on the way, and fixed in its own commit

The served v0.1 reference copy had already been **edited in place** on 2026-09-24 (`d8d3c5af8`,
which added a symlink-safe `isMain`). After that edit it hashed `29c524a1…` (20236 bytes), while
its own manifest pins `a634515b…` (19949 bytes). This was measured live: https://councilof.ai
served `29c524a1…` beside a manifest saying `a634515b…`. The Zenodo deposit's
`reference-implementation-claim-capture.mjs` was downloaded and hashed at `a634515b…`, so the
deposit and the manifest agree and the served file was the one that had drifted. As a result
`client/src/pages/ClaimMaintenance.test.ts` ("pins its bytes") has been red on master since
24 Sep. Commit `d63fc8e08` restores the v0.1 copy to the pinned bytes, taken exactly from
`5759a207e`. The extractor is the same in both files, so no digest is affected. The symlink fix
ships in the v0.2 reference. That commit is kept separate so the owner can drop it. If it is
dropped, the v0.1 manifest gate stays red.

## What was executed (plan §3, step by step)

1. **Rule 1 frozen.** The v0.1 spec, schema, manifest and deposit sidecar are byte-unchanged, and
   the v0.1 reference copy is restored to `a634515b…` (above). `csoai-visible-text/1` is defined
   by those bytes. The maintained source carries it unchanged as `extractVisibleTextRule1`. A
   test holds its source text to the v0.1 file's `extractVisibleText`, character for character,
   and checks both on fixtures.
2. **Rule recordable.** `public/spec/claim-maintenance/v0.2/` is new and holds
   `claim-maintenance-v0.2.md` (sha256 `d649ba0f…`), with new §5.6.1, §6.3.1 and §16, and
   §3, §11, §12, §13 and §15 updated. It also holds `schema/claim-artifact-v0.2.schema.json`
   and the derived `index.html` and `spec.json`. The version index now lists v0.1 as
   `superseded` and v0.2 as `current`, with `doi: null` until the owner deposits it.
3. **Rule 2 published as a new reference.**
   `public/spec/claim-maintenance/v0.2/reference/claim-capture.mjs` (sha256 `10432c76…`,
   26742 bytes) and `manifest.json`, whose `supersedes` names the v0.1 path, manifest and
   `a634515b…`. The gates are `scripts/claim-capture.cli.node-test.mjs` and
   `client/src/pages/ClaimMaintenance.test.ts`. They hold the maintained source to the CURRENT
   reference (the version index's `latest`). They hold every published reference to its own
   manifest. They pin v0.1 to the literal `a634515b…` and 19949 bytes, so no edit to a
   manifest can turn them green. The same-site links now point at the v0.2 reference: the `IMPL`
   link and the curl line in `ClaimMaintenance.tsx`, both llms templates and their generated
   outputs, and the receipt-toolkit builder, regenerated with `--check` green. The page's
   specification links, DOI and citation still name v0.1, because v0.2 has no DOI yet.
4. **New dated registries, superseding by reference.** Written by the new
   `scripts/claims/rebaseline-extractor.mjs`. Each read extracts the same response bytes with
   both rules. Rule 1 today is compared with the recorded digest (like with like), and rule 2
   with rule 1 (same bytes, different reader). Every count below is that comparison:

   | Rev2 registry | supersedes (sha256) | visible-text digests | unchanged, rules agree | **unchanged, extractor differs** | changed at source since capture (rule 1 vs rule 1) | not re-read |
   |---|---|---|---|---|---|---|
   | `claimreg-ai-assurance-and-settlement-2026-09-23-rev2.json` | `0fb10e73e325…` | 40 (14 URLs) | 4 | **16** | 20 | 0 |
   | `claimreg-hiring-platforms-2026-09-24-rev2.json` | `b36639e64146…` | 26 (12 URLs) | 8 | **11** | 7 | 0 |

   **66 visible-text digests were re-baselined to `csoai-visible-text/2`. On 27 of them only the
   extractor differs and the page did not change** (16 + 11, the same count the DRAFT measured).
   None of the 27 is recorded as an observed change. The other 27 differ under rule 1 compared
   with itself. Each is recorded in its artifact as one neutral observed change naming
   `csoai-visible-text/1`. In 8 of them the claim string is no longer in the page's rule-1 text,
   and 7 of those 8 are also not located in the rule-2 text. Those 7 are listed in `not_captured`
   as `READ_BUT_STRING_NOT_LOCATED`: HO-3, CS-1, CS-2, CS-3, RH-1, RH-2 and RH-4. The 25 digests
   that are not visible-text are carried unchanged. Every artifact is schema 0.2 and verifies
   under the v0.2 reference (62/62 and 29/29 CONFORMING). Both files are UNSIGNED and NOT
   SUBMITTED. The ondo-chainlink registries carry no visible-text digest and are untouched.
5. **Watcher compares like with like.** `scripts/claims/reread.mjs` recomputes each recorded
   digest with the extractor it names, or rule 1 when it names none. It reports the rule-2 digest
   beside it for re-baselining and never compares the two. `watch_run.py` carries the extractor
   into each change. The new test `scripts/claims/reread-extractor.node-test.mjs` passes 5/5 and
   fails 4/5 against master's `reread.mjs`. Live, 2026-09-25: re-reading the two superseded
   registries reports 20 + 7 = 27 moved digests. A silent switch would have added the 27
   extractor-only differences to those. The rev2 registries report 0 and 2 moved digests: RH-1
   and RH-4, both on rentahuman.ai, whose page carries a live counter.
6. **Series** stay append-only. `capture-growth.mjs` now writes `extractor` on each new
   visible-text line, and earlier lines are not rewritten. The builder also writes
   `artifact_schema` 0.2 and cites the v0.2 URL.
7. **Index.** Two rows were added to `public/corrections/SUPERSESSIONS.md`, and `register.json`
   was regenerated: `--check` reports 3 live registries and 3 superseded, and every
   `supersession_sha256_matches` is true. `claim-maintenance-register.mjs` counts v0.1 and v0.2
   artifacts as conforming (91 of 99, as before). **OTS stamping and signing were not done.**
   Both are external calls, and they are left for the pod.

## Gates run on Oracle, 2026-09-25

- `node scripts/claim-maintenance-register.mjs --check`: `[register] OK — 28 subject(s), 99 claim(s), 3 live registry file(s) (3 superseded)`
- `node scripts/claim-maintenance-spec.mjs --check`: `[spec] OK — 6 derived file(s) match the document of record`
- `node --test scripts/claim-capture.cli.node-test.mjs`: 6/6 pass
- `vitest run scripts/claim-capture.test.mjs scripts/claim-maintenance-producers.test.mjs client/src/pages/ClaimMaintenance.test.ts`: all pass (the page test runs on Oracle after widening the sparse checkout)
- `node --test scripts/claims/reread-extractor.node-test.mjs`: 5/5. `python3 scripts/claims/test_claim_harness.py`: 25/25.
- `node scripts/build-public-receipt-toolkit.mjs --check`: SOURCE_PARITY_VERIFIED.
  `scripts/public-receipt-toolkit.node-test.mjs`: 27/28. The one failure, "source parity gate is
  in existing build", also fails on master: `build:client` no longer starts with that check.
  It is not caused by this branch.
- `functions/api/pop/_population.test.ts`: 21/22. The claim-watch test reads the `.ots` of the
  alphabetically first registry, which is now
  `claimreg-ai-assurance-and-settlement-2026-09-23-rev2.json`, and it has no receipt yet. It goes
  green once the rev2 files are OTS-stamped on the pod (plan step 7). The gate was not edited.

## Left for the owner or the pod

- **Owner: the Zenodo new version.** The metadata is prepared, not submitted, in
  `docs/claims/zenodo-v0.2-metadata.json`. After it is published, write
  `public/spec/claim-maintenance/v0.2/deposit.json` and re-run the spec producer. Then decide
  whether the `/claim-maintenance` page's spec links, DOI and citation move to v0.2.
- **Pod: sign and stamp.** Sign both rev2 registries through the usual signer path and OTS-stamp
  them. Then regenerate `register.json`, and land everything in one gated merge.
- **Not changed, deliberately:** `functions/api/claims/register.ts` (its `describedby` link
  header still names v0.1), `capabilities/registry.json`, `council-os/capabilities.json`,
  `public/sitemap.xml` and the published `public/consumer-kit/v1/README.md`. v0.1 URLs still
  resolve.
- **Optional:** IN-1, a claim avoided because of the apostrophe, may now be captured verbatim as
  a new artifact.

---

## The plan as approved (text of the DRAFT, unchanged)

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
