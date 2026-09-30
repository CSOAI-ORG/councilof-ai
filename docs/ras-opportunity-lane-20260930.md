# RAS Opportunity Lane — operating contract (2026-09-30)

This is the execution contract for the sole RAS Opportunity Watch and its outward publication lane. It is evidence-state discipline, not a roadmap promise.

## Phase 1 — Evidence truth

State: **PASS**

- Ledger contains three bounded events with unique canonical event keys.
- CM-BAT-R18: source mapping defect confirmed; bounded 1C causal control produced zero numerical delta in the tested case.
- AgentTools C2PA x402: discovery/source contract observed; third-party behavior, payment, settlement, exact-byte delivery and buyer acceptance remain UNMEASURED/HOLD.
- CSOAI A2A directory freshness dogfood: canonical signed provider card serves 10 skills; a pinned APIs.io public page still describes eight and omits the two newer skill ids. State is SOURCE_OBSERVED_DIRECTORY_PROJECTION_STALE, not a quality or intent judgment.
- `scripts/ras_opportunity_evidence_guard.py` self-tests that causal drift and immutable-byte drift go red while deploy-time human-wrapper transforms remain allowed.

Acceptance: guard passes; every event evidence pointer resolves; feed entry count equals ledger event count; manifest hashes match immutable bytes.

## Phase 2 — Product routing

State: **PASS**

No new scheduler or product family.

- R-2 CLAIM MAINTENANCE: source/dependency drift and correction state.
- R-3 MONITOR: raw public change observation.
- R-4 REPRODUCE: bounded independent reproduction.
- R-5 CONFORMANCE: protocol/fixture conformance.
- R-6 EVIDENCE PACKS: portable bounded evidence assembly.

Acceptance: every material event names an existing execution owner and bounded acceptance criterion.

## Phase 3 — End-party UX

State: **PASS in source; authenticated GitHub continuity available; permissionless public web deploy HOLD**

The human wrapper has explicit start paths for:

- general/nontechnical readers;
- agents/developers;
- buyers/operators;
- service providers/sellers;
- procurement/compliance/risk;
- press/analysts/standards maintainers;
- researchers/reproducers;
- auditors/regulators/reviewers.

All audiences resolve to the same ledger, evidence files and integrity manifest. No audience gets a different fact set.

Acceptance: human page links machine ledger, feed, manifest and every evidence object; summaries retain state boundaries.

## Phase 4 — Machine and search discovery

State: **SOURCE READY; canonical activation HOLD**

- JSON-LD Dataset metadata includes canonical URL, creator/publisher, version, licence, DataDownload distributions, `sameAs`, and `isBasedOn` provenance.
- Atom feed is derived from the ledger.
- `llms.txt` and `llms-full.txt` templates name the RAS human hub, machine ledger, feed and manifest.
- Sitemap generator includes the canonical static evidence path when the source tree is built.

Acceptance: structured-data JSON parses; Atom parses; llms generator check passes; sitemap truth gate passes; canonical URL returns 200 before search submission.

## Phase 5 — Agent ecosystem discovery

State: **PASS for provider surface; dependent-directory freshness under Claim Maintenance**

- Canonical A2A Agent Card: version 1.1.0, JSON-RPC A2A protocol 1.0, one signature, 10 skills at the observed byte hash.
- Third-party directory projections are dependencies, not authorities. A stale projection is maintained as a versioned observation until an independent re-fetch catches up.

Acceptance: provider card remains reachable/signed and protocol-declared; dependent projections are re-read and never silently overwritten.

## Phase 6 — Distribution

State: **AUTHENTICATED CONTINUITY PASS; PERMISSIONLESS PUBLIC HOLD**

Authenticated GitHub source branch:
- `codex/ras-production-release-20260929`

Authenticated GitHub releases:
- `ras-opportunity-evidence-2026-09-29`
- `ras-opportunity-evidence-2026-09-30` (superseding evidence set)

The 30 Sep release was downloaded back through the authenticated GitHub API and all eight assets matched the source/manifest hashes exactly.

Important correction: GitHub reports the repository as PUBLIC to the authenticated account, but anonymous requests to the repository page, release page, release API and raw branch file returned HTTP 404 from a network where unrelated public GitHub repositories returned 200. Therefore this surface is **not counted as permissionless public distribution**.

Acceptance: an anonymous, no-cookie/no-token read of the chosen release or mirror returns HTTP 200 and its downloaded evidence bytes match the manifest. Until then, GitHub is continuity/storage evidence only, not a public reach claim.

## Phase 7 — Canonical councilof.ai publication

State: **HOLD — external writer credential only**

All local production gates passed against the built bundle, including redirects, conflict markers, one-door guard, file-size cap, prerender check, brand gate, signed JSON, canary leak, price gate, facts gate, estate root, OTS guard, SEO-head guard and dist-bundle guard.

Blocking facts:
- GitHub workflow dispatch returns HTTP 422: Actions disabled for this user, while repository Actions permissions report enabled.
- Current primary Mac Wrangler session lacks Cloudflare Pages write permission.
- Alternate Mac is not authenticated to Wrangler.
- No tested host environment currently exposes `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`.

Do not bypass by deploying stale GitHub `master`: it diverges materially from the exact production-truth lineage and would regress live contracts.

Acceptance: an authorized Pages writer deploys the already-gated production-truth branch/build; apex `https://councilof.ai` serves the expected bundle; RAS canonical page and every machine artifact return 200/exact bytes.

## Phase 8 — Search/index activation

State: **HOLD downstream of Phase 7**

IndexNow must not be used to advertise a dead canonical URL. The repository submission path validates the ownership key and probes live URLs before submission.

Acceptance: canonical RAS URL returns 200 and exact readback passes; then submit the changed RAS URL(s) only and record the IndexNow response. HTTP 200/202 means receipt only, not guaranteed indexing.

## Phase 9 — Continuous Claim Maintenance

State: **ACTIVE**

For each maintained claim:
1. freeze canonical source/resource + version/change type;
2. observe public bytes;
3. classify SOURCE_OBSERVED vs MEASURED vs HOLD;
4. traverse dependencies;
5. re-run only bounded predicates affected by change;
6. publish confirmed/superseded/corrected state;
7. preserve correction history;
8. signal changed public URLs only after live readback.

Never infer endorsement, compliance, certification, service quality, payment, settlement, delivery or buyer acceptance from discovery alone.
