# Council AUTO-EAT: daily open research commons and RAS qualification protocol

**Engineering proposal — 24 November 2026. This is metadata discovery, not imported intellectual property, independently verified science or a vendor partnership.**

## Why extend AUTO-EAT instead of rebuilding everyone else's SaaS

Council already has a keyless, hourly source-discovery and read-only probing service for Hugging Face models/Spaces, MCP, A2A, npm, ERC-8004 and XRPL. The existing worker writes only to the isolated auto-eat-feed branch; discovery is not a GSPC result and cannot sign a board card. This research-commons extension uses that **same** worker and data branch, but refreshes at most once every 20 hours rather than adding a competing scheduler.

The new input catalogue is an explicit, reviewable allowlist of 25 GitHub public code repositories and seven Crossref academic-paper metadata searches. Each GitHub row records a source-observed exact HEAD SHA, repo ID and source-declared SPDX license label, plus canonical digests of the metadata responses. Each paper row includes a DOI, short title and separately labelled publication/indexing dates, not an abstract or copyrighted PDF. Newly indexed does not mean newly published.

The output is a source metadata report on the discovery branch, not an automatic public GSPC certificate. The isolated feed is a **free information commons** from which Council can select falsifiable, rights-cleared experiments. Every external-source observation must remain distinguishable from a Council self-run experiment, genuinely outside replication, and actual human/receiver acceptance.

## RAS: Request Attention Service

The commercial interface is not an obligatory seat-based subscription. H.I.M. helps people locate and understand existing public source references free of charge. A machine or organisation can then request **specific new work** through the existing RAS/A2A/x402 route: pin a model revision, reproduce a negative control, check a source, perform a permitted experiment or inspect an actual receiving-party effect with explicit authority.

- A paid RAS request is **scoped computation and evidence delivery**, never payment for a passing score. Payment is not transferred into GSPC truth.
- Existing receipt verification remains free. The new research-commons collector performs **zero** x402 transactions, real executor effects, model training or fresh model measurement.
- A new or changed external library becomes a **review candidate**, not an auto-installed component. Source declared license is not proof that every file, model weight, dataset, logo or enterprise extension is freely reusable.
- Human reviewers must be real, currently delegated, competent and accepted, with a conflict-of-interest policy. A synthetic twelve-role Council or multiple agents under one owner do not establish organisational independence.
- An outside verifier must be independently controlled and must be able to re-run a public measurement from exact source and method pins. Real effects require independently owned receiving-party before/after observations. A provider can run an internal check, but the same provider must not label its own check as independent verification.
- Candidate outcomes: REPRODUCED_BY_COUNCIL, INDEPENDENTLY_REPRODUCED_BY_NAMED_THIRD_PARTY, CONFLICTED, HELD, UNCHECKABLE and NOT_MEASURED. These are proposed data-contract states, not live claims of staffing or credentials.

## Source rights

| Source | We may index | Remains held for explicit licence and authority review |
| --- | --- | --- |
| GitHub API for named public repos | Repo metadata, Git HEAD SHA, source-declared licence, source canonical digest and URL | Copying entire source trees, importing dependencies, vendor SDK paid service access, customer data, model weights and brand artwork |
| Crossref polite REST API | A few DOI/title/indexing-date metadata rows | Abstract, author email, publisher PDF, full text, training or redistributing copyrighted articles |
| OpenAlex | Optional useful free metadata index, not part of this collector | Automated daily full-data sync may depend on subscription/plan; no assumed premium rights |
| Public incident sources | The estate's existing availability index and source rights review | Bulk AIID/OECD/AIAAIC narratives, reporter data or underlying media without a compatible licence |
| Palantir/Cisco/CrowdStrike/Red Hat/NVIDIA | Independently documented public specifications and explicitly licensed open components | Assuming a vendor relationship, production tenant credentials or independent acceptance |

Only predeclared api.github.com repository URLs and api.crossref.org works queries are contacted. Request timeouts, payload sizes, worker counts and repo counts are bounded; redirects are refused. No user-submitted endpoint is fetched. Public metadata is not auto-trained into a foundation model and no private or enterprise content is copied.

## Operational flow and evidence boundaries

1. Discover source HEAD and paper DOI. Preserve source-origin timestamp, declared license, canonical input metadata digest and prior daily snapshot digest. Refuse malformed or oversized source responses.
2. If a revision changed, mark it as **a new revision candidate**, not a vulnerability, safety failure or benchmark improvement.
3. Human/owner licence and method review selects one candidate for a separate pinned, bounded CI experiment. Don't automatically run vendor services or accept externally supplied tool arguments.
4. Reproduce in sandbox with known reference conditions and adversarial controls. Report all tested denominators, lack of coverage, uncertainty and actual measured cost.
5. Independent reviewer/receiver, when legally delegated, adds a separately credentialed verification. Council self-run remains Council self-run until then.
6. Offer a request-time RAS job through the existing paid doors only if a real scope of work was requested and authorised. Never invent customers, trigger a charge for a failed undelivered service or sign a held GSPC release.
7. Present source-qualified observations, exact experiment evidence and visually labelled **hypothetical** event consequences in CouncilOS/H.I.M. No fake geolocation and no resurrection of the retired /sov-space HTTP 410 route.

## Testing and trust

Run the offline negative controls with:

    python3 scripts/auto-eat/test_research_commons.py

Run one actual bounded, read-only public-source fetch (not a full-code download) with:

    python3 scripts/auto-eat/research_commons.py --force --out /tmp/csoai-research-commons.json

The hourly worker invokes the collector **at most once per 20 hours**, updating public/interop/auto-eat/research-commons.json on its existing isolated branch, only after this proposal's CI and protected merge. The code has 27 offline test cases for wrong identity, altered commit SHA, missing licences, malformed provider metadata, missing/future clocks, script-injected paper metadata, redirect/SSRF prevention, source rate limits and non-claims of authority, grading and payment. Actual source reachability and subsequent daily run success must be separately verified and dated.

No organisation has endorsed this project merely because its public API is indexed.

## Independent measurement partners worth approaching

[NPL Centre for AI Measurement](https://www.npl.co.uk/research/data-science-and-ai/centre-for-ai-measurement) is a particularly relevant UK metrology initiative; it develops rigorous comparable measurement science and supports independent assurance providers. [UK AISI's Inspect AI](https://inspect.aisi.org.uk/) offers open reproducible evaluation frameworks. [UKAS ISO/IEC 17025 overview](https://www.ukas.com/resources/resources/soas-17025/) provides useful competence/impartiality principles; no claim is made that Council is an accredited laboratory. [OpenLineage](https://openlineage.io/docs/spec/facets/) can express experiment/run/dataset relationships, [OpenSSF GUAC](https://docs.guac.sh/guac/) can express supply-chain relationships, [OCSF](https://github.com/ocsf/ocsf-schema) can express security events, and [OpenTelemetry](https://opentelemetry.io/docs/specs/) can express observed runtime events. Each needs a bounded integration test rather than blind deployment.

This whole design is **free discovery, paid authorised work when requested, independent verification when genuinely independent, and explicit UNKNOWN otherwise**.

## Bounded expanded coverage

The 25-source collector and all three readers support the expanded catalogue without changing the unsigned discovery schema or granting authority. During rollout the API accepts legacy three-topic and expanded seven-topic snapshots; the maximum repository count is 25. Visibility must be explicitly public. The extra nine repositories and four search topics are source metadata only, not evidence of capability or licensing permission. Deploy compatible readers before the collector switches the public feed; no prospective prediction ledger is published by this change.
