# Goal mode — TUI 2: N-site, industry and source distribution

Paste everything below into TUI 2.

```text
GOAL MODE: N-SITE + INDUSTRY/SOURCE PACKS + DISTRIBUTION GROWTH.

You own lawful discovery, source provenance, frozen coverage and distribution adapters. Do not change RAS/payment/evidence internals or redesign Council OS. Do not publish, create external repositories, enable schedules, sign, anchor, merge, push or deploy. Codex/root is the sole release coordinator.

Work continuously within your owned branch: inspect, edit, test and document without asking for routine permission. Stop only for an external write, account/token/OAuth change, paid compute, restricted-data access, unclear licence/terms, autonomous schedule activation, destructive action, or a requested scope expansion that changes the frozen denominator.

Read first:
- operator/MASTER-RELEASE-LEDGER-2026-09-05.md
- docs/handoff/COUNCIL_OS_GSPC_MASTER_BLUEPRINT_2026-09-04.md
- scripts/auto-eat/** and both deliberate schedule/signing locks
- the current Hugging Face asset inventory before proposing anything new

CURRENT PLATFORM RULES — VERIFY AGAIN BEFORE IMPLEMENTATION

- Hugging Face separates Hub API, resolver and web-page request buckets, uses five-minute windows, returns 429 plus RateLimit headers, and recommends its maintained Hub client for retry handling: https://huggingface.co/docs/hub/main/en/rate-limits
- A repository card's licence metadata is a discovery hint, not blanket permission; respect the service terms, actual project licence and gated-access terms: https://huggingface.co/terms-of-service, https://huggingface.co/docs/hub/repositories-licenses and https://huggingface.co/docs/hub/en/datasets-gated
- Use documented APIs and immutable revisions. Do not browser-scrape, bypass a gate, copy private data or interpret “open” as unrestricted reuse.

OBJECTIVE

Turn the existing Hugging Face work into one repeatable N-site adapter and a small frozen pilot whose denominator, revisions, rights, failures and costs can be replayed. Then define reusable industry/source packs and rank later N-sites. Do not claim 100% of Hugging Face, “badge every model,” adoption, endorsement or full reproducibility.

CURRENT VERIFIED BOUNDARY — RECHECK IT

- scripts/auto-eat already performs discovery/probing/staging; schedule and signing/OIDC are deliberately locked.
- The RunPod 3090 has a bounded local inference result only: 5 models × 14 model-comparison axes, 70/70 jobs, returning unsigned UNMEASURED candidates. It is not an HF crawler, signer, admission authority or publisher.
- The frozen HF example at commit 500e71ce02fa8f92d1a63dd6e3e50f31d5e14b61 reports six configs and 733 raw rows, but its manifest/timestamp and replay inputs are incomplete. Treat it as a narrow pilot to repair, not the template for a full census.
- GSPC has 22 axes, not 22 industries: 14 model-comparison axes plus 8 deterministic-fact axes. Applicability is per subject/instrument.

WORK PACKAGE A — THE N-SITE CONTRACT

Use one explicit state ladder, preserving failure and inapplicability:

DISCOVERED → CATALOGUED → RIGHTS_CHECKED → ACCESSIBLE → ELIGIBLE → RUNNABLE → PROBED → CANDIDATE_FINDING → REPRODUCED → ADMITTED → MEASURED → SIGNED → ROOT_INCLUDED → OTS_CONFIRMED → PUBLISHED → MONITORED/SUPERSEDED.

No discovery or GPU worker may advance beyond CANDIDATE_FINDING. An independent reproducer may establish REPRODUCED; only the separate adjudication/reduction contract may establish ADMITTED or MEASURED. Emit candidates and evidence packages for TUI 1/admission.

Each record must include:
- site, resource kind, namespace/name, immutable site ID and revision;
- source URL/API query, retrieval time and response digest;
- author/owner metadata as reported by the site, never inferred endorsement;
- licence identifier, licence-text digest/location, gated/restricted status, attribution and redistribution/training decision;
- subject type, model/dataset/Space/harness identity and dependency digests;
- applicable axes/instruments, explicit exclusions and why;
- state, attempts, HTTP/rate-limit facts, failure class, tombstone/supersession link;
- estimated and observed CPU/GPU/network/storage cost.

WORK PACKAGE B — FROZEN HUGGING FACE PILOT

1. Freeze a bounded, stratified pilot before fetching: exact API query, timestamp, sort/filter, returned IDs, revision IDs, inclusion/exclusion rules and N. Keep it small enough for complete replay under the £0 external-spend default.
2. Include representative models, datasets, Spaces, gated/restricted items, missing/other licences, revision drift and deleted/unreachable fixtures. A failed item remains in the denominator.
3. Separate metadata-only, static-testable and runnable subjects. Never run all 22 axes against every subject.
4. Use separate API and resolver clients/budgets. Send the least-privilege HF token only where required; never log it. Parse RateLimit/RateLimit-Policy, honour 429/reset, add jittered bounded retries, concurrency caps, checkpoint/resume and cancellation.
5. Pin downloads to immutable revisions and content hashes. Do not download an item until rights state permits the exact use. Do not train on it merely because evaluation is permitted.
6. Test deduplication, partial pages, retries, resume after crash, rate limiting, changed revision, tombstone, access revocation, gated denial, unknown licence and corrupt/incomplete download.
7. Repair the existing HF example's manifest, raw/normalised distinction and recomputation path locally. Do not update HF in this lane.

WORK PACKAGE C — INDUSTRY AND SOURCE PACKS

Build modular packs, not 22 cloned industries or pages. The query model is:

22 axes × industry pack × jurisdiction pack × accountable role × subject adapter × instrument version.

Prioritise five guided journey packs because they exercise distinct evidence:

1. AI/GPAI provider and model/harness builder — model, harness, dataset and deployment lineage; benchmark applicability; reproducibility and change monitoring.
2. Financial services, bonds and tokenized assets — issuer/legal-instrument sources, reserve/custody disclosures, ERC-3643/T-REX and XRPL/EVM public controls, contract/version identity and explicit legal unknowns.
3. Insurance and procurement — control/evidence freshness, loss/incident sources, supply-chain provenance and decision-owner boundaries.
4. Regulator, policymaker and public sector — authoritative legislation/guidance, effective dates, roles, evidence requirements, appeals/revocation and counterfactual simulation inputs.
5. COBOL and legacy estates — public specifications, copybook/job/message formats, change/replay fixtures and system-of-record boundaries; no proprietary customer material in shared packs.

For every pack provide authoritative sources, licence/quotation rules, retrieval/update method, jurisdiction, roles, applicable axes, instruments, exclusions, reviewer authority, supersession/reopening rules and deterministic fixtures. Top-ten competitor lists are research inputs only: record source/date and translate only lawful, independently implemented capabilities—never clone branding, proprietary data or unverified claims.

WORK PACKAGE D — DISTRIBUTION, NOT DUPLICATION

1. Inventory all current HF models/datasets/Spaces/cards first. Map duplicates to one canonical subject/revision identity; recommend retain, merge, supersede or quarantine without external mutation.
2. Define one HF Space as a thin read/demo projection over Council APIs. It cannot independently measure, sign, root, witness or publish board state.
3. Prepare canonical model/dataset-card language: point-in-time measurement, subject/revision, method, limits, evidence link, not certification/endorsement, correction and supersession route.
4. Rank later N-sites—such as Kaggle, OpenML and GitHub/model registries—by documented API access, licence clarity, immutable revision support, runnable value, rate limits, replayability, removal handling, compute cost and adapter reuse. Do not implement the next site until the HF exit gates pass.
5. Keep discover/probe workloads on CPU/GitHub/Oracle where appropriate. Submit only allowlisted inference work packages to RunPod; enforce image/model/harness digests, cost ceiling and shutdown. The GPU returns unsigned candidates only.

GROWTH METRICS

- frozen denominator N and counts at every ladder state;
- rights-known %, immutable-revision %, metadata-only/static/runnable split;
- successful replay %, failure-retention %, drift/tombstone detection latency;
- evidence candidates delivered, independently reproduced and admitted—three separate counts;
- API calls, 429s, retries, bytes and cost per eligible subject;
- canonical assets vs duplicates/superseded assets;
- Council API referrals and scoped requests attributable to a distribution surface; reach is not adoption or revenue.

DELIVER

1. docs/nsites/NSITE-ADAPTER-CONTRACT-2026-09-05.md
2. machine-readable frozen HF pilot manifest and replay report
3. local repair plan/fixture for the six-config HF example
4. five industry/source-pack manifests and coverage/gap matrix
5. canonical HF asset identity/duplication register
6. next-site ranking with evidence, cost and rights columns
7. exact changed-file manifest, commands, pass/fail output and blockers

ACCEPTANCE GATES

- every pilot item retains a state, revision, source, rights decision and failure outcome;
- frozen N is unchanged by failures; no “100%” without a named denominator and date;
- no gated/unlicensed material is downloaded, republished or trained on;
- retry, resume, rate-limit, drift, deletion and rights-revocation tests pass;
- the Space/design cannot write GSPC or claim independent measurement;
- no GPU or discovery worker holds signing/admission/release credentials;
- no external mutation or publication occurs;
- hand off one bounded reviewed change set to Codex/root; do not integrate it yourself.
```
