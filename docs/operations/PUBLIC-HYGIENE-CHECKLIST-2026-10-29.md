# Public wording, evidence and quality checklist

Prepared 29 October 2026 for CSOAI / Council of AI and MEOK. This is a scoped audit and working completion register, not a security certification or a declaration that all public surfaces are fixed.

## Approved direction

Council of AI is the public AI measurement service operated by CSOAI Ltd. It publishes measurements, methods, limitations and corrections, with free verification of supported signed records. Lead with the work people can inspect. Do not imply statutory appointment, accreditation, guaranteed legal compliance or a favourable result for payment.

MEOK is a CSOAI product with a public evidence workspace. Describe only capabilities available in the current deployed product. Product demonstrations, future capabilities and measurement evidence must remain distinct.

Use descriptive language: public verification, published coverage, measurement tools, evidence services and defined delivery scope. Replace promotional uses of permissionless, black swan, crown jewels, goldmine, internal codenames, cash register and planted SDKs. Preserve exact historical quotations, frozen test inputs, signed records and compatibility identifiers where rewriting would change evidence or break clients. Explain historical terminology at its current entry point.

## Coverage and limits

- Metadata inventory: all 767 public repositories returned by the account API at collection time. This is not a content/security review of all 767 repositories.
- Web sample: 36 requested public URLs across Council, CSOAI and MEOK. 34 returned successfully in the initial sample; one guessed MEOK status route returned 404 and is not classified as a broken link. The actual homepage link is /docs#status; an initial HTTP probe returned 403, but a later TinyFish retrieval read the stale overlay documentation. www.csoai.org returned 503 on two probes.
- Source snapshot: councilof-ai at 98c0732580a0dbaea609fb817126b4fbed4b79ba. 1,378 of 1,402 selected downloads succeeded; 24 timed out. Additional targeted files brought the bounded pattern scan to 1,384 files. This does not cover all 40,646 blobs, history, private repositories or runtime secrets.
- Static secret check: selected high-confidence GitHub token, AWS access-key, Stripe live-key and private-key markers; no matches in that limited downloaded set. No authenticated penetration test, dependency resolution or exhaustive secret scanning was performed.
- Master advanced to 7da5e1538086924a8fdc9bb4b7b29066c34ff3b4 while work was in progress. Existing edited files were compared against that head and were unchanged.
- The branch API reports protected master with required checks gates, build, stamped-bytes and hold-guard. The full branch-protection endpoint was denied to this integration; the complete admin policy is unverified.
- Google result wording and rankings are not directly controlled by editing a site. Recrawl, canonical selection and third-party corrections need observed follow-up.

## Work prepared in this change

Public website wording is revised at source. A stable account profile is generated with --account-profile, keeping changing counts at live evidence URLs. The rendered-copy brand gate catches black-swan singular/hyphen variants and singular goldmine. No scoring logic, signed evidence, API identifiers, commercial prices or availability states are changed.

The source patch needs the repository's normal review, required checks and release owner. Production is governed by DEPLOY-LOCK.md. The account-profile replacement was rejected by the connected GitHub integration with HTTP 403 and is supplied as docs/github/ACCOUNT-PROFILE.md; it must not be described as published on the account.

## Findings to carry forward

1. The account profile contains stale static measurement totals; the prepared replacement links current results and distinguishes coverage from ranking.
2. sovereign-wiki metadata was changed to a descriptive public catalogue summary and read back from the page. Its README and catalogue content still require producer-aware cleanup.
3. csoai-org-v2 repository metadata was corrected from certificate-authority language to website source and current measurement links. Its README and legacy pages still require correction; the old wording is not proof of any legal status.
4. Third-party search results include certification/compliance descriptions at https://mcpmarket.com/server/csoai-1 and https://metatext.io/tools/mcps/io.github.csoai-org-meok-enterprise-compliance-checker. Correct owned upstream material and track external corrections separately.
5. The sampled live Council /security/ and /constitutional-harness/ HTML lacked canonical links; this PR adds the latter at its maintained static source, pending release. The security page does have a description; do not report it missing.
6. Sampled Council security-page headers differ from the main site. Sampled MEOK headers include a broad CSP but no observed HSTS or frame-ancestors directive. Review serving sources and feature compatibility before tightening policy. These observations do not demonstrate an exploitable vulnerability.
7. MEOK's terms/privacy vocabulary still includes earlier character/playground concepts. Align with tested current storage and product behaviour after locating the deployed source and owner. No MEOK production change is claimed.

## Consolidation update — 29 October 2026

This register incorporates the existing human-operations, evidence-operating and charter reviews. Reused review results are explicitly attributed; they were not rerun by this wording pass. Source PRs remain open at the latest readback. Keep one owner per change instead of recreating adjacent work.

| Existing work | Current ownership and evidence boundary |
| --- | --- |
| [#3596](https://github.com/CSOAI-ORG/councilof-ai/pull/3596) | Task-based buyer/navigation and integration guidance. Prototype status remains explicit; production responsive acceptance pending. |
| [#3598](https://github.com/CSOAI-ORG/councilof-ai/pull/3598) | Approval boundaries, stage order and unknown effects; latest PR reports 16 Layer-0, 47 authority/effect and 20 synthetic-example checks. These are source tests, not deployed authority or real-world performance. |
| [#3599](https://github.com/CSOAI-ORG/councilof-ai/pull/3599) | Host-bound LangChain dispatch and evidence import/export. Latest PR reports 43 LangChain and 79 evidence checks. Its overlapping checker/profile edits were removed; #3598 owns that correction. |
| [#3602](https://github.com/CSOAI-ORG/councilof-ai/pull/3602) | Capsule retention and public decision history/recovery; latest PR reports 40 focused tests and eight candidate browser checks. It also retains the earlier live MEOK public journey observations. Recorded approval is not executed work. |
| [#3604](https://github.com/CSOAI-ORG/councilof-ai/pull/3604) | Repeat-demand interpretation, read-only report checking and custody wording; latest PR reports 18 regression tests. Custody documentation is not proof of distributed key custody. |
| [#3603](https://github.com/CSOAI-ORG/councilof-ai/pull/3603) | This wording/metadata/checklist contribution, generated distribution descriptions, charter canonical and proposed MEOK docs replacement. No merge or deployment claimed. |

### Additional source corrections in this contribution

- Public-root tool metadata now says exactly what its handlers do: `VALID` means JSON retrieval, not signature or measurement verification; failed retrieval/parsing is `UNREACHABLE`. No result values or verification algorithms change.
- Regenerate the package copy with `node mcp/gspc-server/pack.mjs`, registry with `node scripts/capability-seed.mjs`, navigation/legacy surfaces with `node scripts/capability-render.mjs nav` and `legacy`, and distribution with `node scripts/harness-x/render.mjs`. The pre-existing `get_root` A2A card is handwritten (as its axis-card producer documents), so its two descriptions are aligned explicitly. No signed A2A card is rewritten.
- Add the canonical URL to the maintained constitutional-harness HTML; preserve its body and all 22 articles. The security-page canonical remains open.
- Add `MEOK-DOCS-CANDIDATE-2026-10-29.html` and its adoption notes as review material. They explain Ask → save → reopen, unsigned transcript limits and the current public/private product boundary. They are not served by Council and have not replaced MEOK production docs.
- The root-retrieval and existing charter suites pass ten tests; the existing doctrine and package/door consistency suites pass another 19. Generator checks compare all 180 distribution outputs across 24 configured targets. That is reproducibility evidence, not 24 independently deployed integrations.

### Composition and next acceptance steps

1. Preserve #3602's two response-expectation corrections in `council-os/capabilities.json` when composing with this PR's independent `get_root` description update; rerun the existing producers after composition.
2. Keep #3598's broader checker correction and #3599's separate integration work. Their latest PR descriptions supersede earlier overlap notes.
3. Required checks must pass on the final composed release head. The designated release owner follows `DEPLOY-LOCK.md`, then records public readbacks; this contribution does not assume that role.
4. Identify MEOK's current serving source from a deployment receipt before applying its candidate. Older matching docs copies are insufficient because their homepage bytes differ from production.
5. After verified release, inspect representative URLs and owned Search Console coverage. Google can derive snippets from visible content or meta descriptions; canonical declarations are signals, not promises of ranking or indexing. See [Google snippet guidance](https://developers.google.com/search/docs/appearance/snippet) and [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

### Learning carried into positioning

Lead with dated published methods, measurements, limits, corrections and verification. Keep declared scope separate from observed operation; retrieved metadata separate from cryptographic checks; synthetic journeys separate from customer acceptance; recorded approval separate from execution; and revenue bookkeeping separate from repeat demand. These distinctions make the institutional and commercial description stronger because a visitor can inspect what each claim means.


## Acceptance register

“Prepared” means a source edit or replacement is ready, not live. “Verified sample” applies only to the stated sample. “Inventoried” means enumerated, not audited. “Open” is not completed. Owners are recommended roles, not assigned people. Close a control only with a dated URL, commit, test receipt or administrative evidence.

| ID | Area | Priority | Status | Control | Acceptance evidence | Owner role |
| --- | --- | --- | --- | --- | --- | --- |
| H001 | Identity | P0 | Prepared | Publish a stable account profile | Founder, legal operator, current evidence and contact links are clear; stale counts removed | Communications |
| H002 | Identity | P1 | Verified sample | State who operates Council of AI | Homepage and about page identify CSOAI Ltd and link the work | Communications |
| H003 | Identity | P1 | Open | Verify corporate identifiers at the official register | Legal name, company number and registered details match current official records | Operations |
| H004 | Identity | P1 | Prepared | Describe an operating measurement body in plain language | Lead with published tests, methods, results and verification; no implied statutory appointment | Communications |
| H005 | Identity | P1 | Open | Unify brand architecture | Council of AI is the measurement service; MEOK is a CSOAI product; legacy names have explicit roles | Communications |
| H006 | Identity | P1 | Open | Review logos, wordmarks and social avatars | Owned profiles use approved assets with readable mobile and small-size variants | Design |
| H007 | Identity | P1 | Open | Check author and reviewer identities | Public names and roles have consent and verifiable supporting pages | Operations |
| H008 | Identity | P2 | Open | Create a dated media kit | Approved descriptions, logo assets, founder biography and evidence links have an owner | Communications |
| H009 | Claims | P0 | Prepared | Replace permissionless institutional slogans | Current descriptive copy explains published coverage and public verification | Editorial |
| H010 | Claims | P0 | Prepared | Block black-swan and goldmine variants in rendered copy | Guard self-tests catch singular, plural and hyphenated variants | Engineering |
| H011 | Claims | P0 | Open | Replace crown-jewel and internal-code marketing | Current titles, snippets, navigation and package summaries use descriptive names | Editorial |
| H012 | Claims | P0 | Open | Audit positive certification and accreditation claims | Every positive claim has applicable evidence; negations and historical quotes retain their meaning | Editorial |
| H013 | Claims | P0 | Prepared | Separate coverage, measurement and ranking | Every count names its population; ties, untested rows and fact runs remain distinct | Measurement |
| H014 | Claims | P0 | Partial | Classify every capability by availability | Existing human-operations review retained 312 declarations and 172 safe GET observations. Availability is endpoint-specific; declared capability is not tested execution. | Product |
| H015 | Claims | P0 | Open | Check independence and commercial boundaries | Payment and ownership disclosures are accurate; favourable results cannot be bought | Measurement |
| H016 | Claims | P0 | Open | Preserve evidence and correction history | Frozen banks, signatures and historical quotes remain byte-correct or are superseded transparently | Measurement |
| H017 | Claims | P1 | Prepared | Keep mutable profile counts at the authoritative source | Stable profile links current board data instead of copying a changing total | Engineering |
| H018 | Claims | P1 | Partial | Link public assertions to their evidence | This PR clarifies public-root retrieval versus signature/measurement verification; related source PRs retain evidence boundaries. Estate-wide assertion review remains open. | Measurement |
| H019 | Claims | P1 | Open | Review quantified scale and performance claims | Totals are reproducible and benchmarks state population, hardware and evaluation method | Measurement |
| H020 | Claims | P1 | Open | Check research and membership language | Publication, listing or membership does not imply endorsement or accreditation | Editorial |
| H021 | GitHub | P1 | Inventoried | Inventory the public account repositories | 767 public repository metadata records captured with URLs, descriptions and flags | Engineering |
| H022 | GitHub | P0 | Open | Triage the flagged repository descriptions | Review the candidate list manually; negations are not false positive claims | Editorial |
| H023 | GitHub | P1 | Changed live | Clean sovereign-wiki repository description | Public readback uses catalogue, tools and methods language without inflated counts | Engineering |
| H024 | GitHub | P0 | Partial | Correct the csoai-org-v2 certificate-authority wording | Repository description corrected; README and legacy page content still require review | Editorial |
| H025 | GitHub | P1 | Open | Review every active repository README | Purpose, status, quickstart, limits, licence, security and canonical links are present | Maintainers |
| H026 | GitHub | P1 | Open | Categorise legacy and experimental repositories | Current entry points explain status without deleting history or breaking consumers | Maintainers |
| H027 | GitHub | P1 | Open | Curate pinned repositories and account bio | Pins lead to maintained evidence, verifier, methods and useful tools | Communications |
| H028 | GitHub | P1 | Open | Review homepage URLs and topics | Links resolve to canonical owned pages; topics accurately describe scope | Maintainers |
| H029 | GitHub | P0 | Partial | Verify default-branch protection | Branch response reports protected master and required checks; full admin policy still needs access | Security |
| H030 | GitHub | P0 | Open | Verify account access and recovery | MFA, least privilege, recovery ownership and inactive collaborators are reviewed privately | Security |
| H031 | GitHub | P0 | Open | Review application and deploy-key access | Each integration has a documented purpose, owner and minimum permissions | Security |
| H032 | GitHub | P1 | Verified sample | Inspect sampled Scorecard workflow action pins | The inspected workflow uses SHA pins and checkout disables persisted credentials | Engineering |
| H033 | GitHub | P0 | Open | Audit all GitHub Actions trust boundaries | Untrusted PR input cannot reach privileged tokens, writes or production deployment | Security |
| H034 | GitHub | P1 | Open | Check dependency alerts and update ownership | Open alerts, lockfiles and supported versions have an accountable remediation queue | Security |
| H035 | GitHub | P1 | Open | Check package and release provenance | Published artifacts map to source commits, immutable versions and attestations where supported | Engineering |
| H036 | GitHub | P1 | Open | Verify community-health files per active repo | Security policy, contribution guidance, licence and issue templates resolve correctly | Maintainers |
| H037 | SEO | P1 | Verified sample | Inspect raw homepage and key-page metadata | Sampled Council pages expose descriptive titles, descriptions and canonicals in returned HTML | Web |
| H038 | SEO | P1 | Open | Audit all sitemap URLs | Every intended canonical URL returns useful indexable content without soft errors | Web |
| H039 | SEO | P1 | Open | Check sitemap freshness and lastmod accuracy | Only substantive changes update lastmod; canonical routes are complete | Web |
| H040 | SEO | P1 | Open | Review robots directives across hostnames | Search crawlers can reach intended public pages; restricted content uses access control | Web |
| H041 | SEO | P1 | Open | Resolve canonical and alias consistency | Apex, www, trailing slash, mirrors and old routes converge intentionally | Web |
| H042 | SEO | P1 | Open | Investigate www.csoai.org availability | Repeat independent public probes and repair routing if the observed error persists | Web |
| H043 | SEO | P1 | Partial | Add canonical metadata to exceptional standalone pages | Canonical URL added to maintained constitutional-harness HTML in PR 3603; body and 22 articles unchanged. Production readback and security-page producer remain open. | Web |
| H044 | SEO | P1 | Open | Validate structured data semantically | Organisation and software data match visible copy; no fabricated reviews or credentials | Web |
| H045 | SEO | P1 | Open | Verify social share cards | Open Graph images, titles and descriptions render correctly on key entry points | Design |
| H046 | SEO | P1 | Open | Check internal link equity and navigation | Important evidence and service pages are reachable with descriptive HTML links | Web |
| H047 | SEO | P1 | Open | Obtain Search Console index coverage evidence | Owned-property inspection identifies indexed, excluded and canonical-selected URLs | Growth |
| H048 | SEO | P1 | Open | Submit refreshed sitemap after the governed release | Submission receipt and inspected representative URLs are retained | Growth |
| H049 | SEO | P1 | Open | Review branded search-result snippets | Dated query, engine, locale and result URL are captured; snippets are not presumed controllable | Growth |
| H050 | SEO | P1 | Open | Correct third-party directory summaries | Owned upstream metadata is fixed and directory correction requests are tracked | Communications |
| H051 | SEO | P1 | Open | Measure field performance on priority routes | Mobile field data where available and repeatable lab results establish a baseline | Web |
| H052 | SEO | P1 | Open | Review accessible page structure | Heading order, keyboard focus, labels, contrast and screen-reader names pass manual checks | Design |
| H053 | SEO | P2 | Open | Build evidence-led content clusters | Methods, use cases, examples and limitations answer real search intent with original evidence | Growth |
| H054 | SEO | P2 | Open | Check multilingual and regional declarations | Language tags and hreflang only describe actual maintained equivalents | Web |
| H055 | MEOK | P0 | Verified sample | Record current public product boundaries | Homepage distinguishes public evidence workspace from unavailable private staff and voice | Product |
| H056 | MEOK | P0 | Partial | Identify the deployed MEOK source and release owner | Two older deployment-artifact copies agree on stale docs but differ from live homepage bytes. Current serving source and release owner are still unconfirmed; no deployment performed. | Engineering |
| H057 | MEOK | P0 | Open | Align privacy wording with the current product | Storage, export, network processing, retention and deletion match tested behaviour | Product |
| H058 | MEOK | P0 | Open | Align terms and product vocabulary | Legacy character and playground terms match the actual current service or are scoped historically | Product |
| H059 | MEOK | P1 | Verified sample | Test Ask and transcript export end to end | Retained 29 Oct human-operations review: public Ask, save and reopen preserved the answer without an extra Ask request; tampered digest rejected. PR 3602 records the earlier live journey. Not rerun by this consolidation. | QA |
| H060 | MEOK | P1 | Prepared | Verify the real status destination | Actual homepage target /docs#status retrieved with stale overlay content. Replacement candidate and adoption checks prepared in PR 3603; current production docs unchanged. | Product |
| H061 | MEOK | P1 | Open | Check request-job completion | Form validation, consent, acknowledgement and delivery expectations work without a test purchase | QA |
| H062 | MEOK | P1 | Open | Check unavailable integrations | Connect and product pages consistently explain availability without implying live features | Product |
| H063 | MEOK | P1 | Partial | Review local data and session handling | Retained public journey checked export/reopen and digest rejection. Transcripts unsigned; new-session/cross-device recovery and complete privacy/storage audit remain unverified. | Security |
| H064 | MEOK | P1 | Partial | Check mobile and low-bandwidth usability | Retained 390 × 844 public-workspace check reported no overflow. Low-bandwidth, accessibility and all-device acceptance remain open. | QA |
| H065 | Security | P0 | Bounded scan | Scan downloaded source for high-confidence secret patterns | 1,384 downloaded files checked for selected token and private-key markers; no matches in this limited scan | Security |
| H066 | Security | P0 | Open | Run complete repository and history secret scanning | All active repos, history, release assets and builds are scanned; confirmed secrets are revoked | Security |
| H067 | Security | P0 | Open | Inspect secret-scanning and push-protection settings | Admin evidence confirms effective settings; unavailable access is not a pass | Security |
| H068 | Security | P0 | Related PR | Review production secret custody | PR 3604 corrects public custody claims and distinguishes historical same-host shares from planned separation. No production custody implementation or key rotation claimed. | Security |
| H069 | Security | P0 | Related PR | Review authentication and authorisation | PR 3598 owns approval-contract/stage-order changes; PR 3599 owns host-authority-bound integration. Focused tests are not authenticated production acceptance. | Security |
| H070 | Security | P0 | Open | Review input handling and output safety | Injection, XSS, SSRF, file upload and command boundaries have targeted tests | Security |
| H071 | Security | P1 | Partial | Compare public security headers | Council main pages and MEOK sampled; exceptional routes and header gaps need serving-source fixes | Security |
| H072 | Security | P1 | Open | Tighten CSP with measured compatibility testing | Required scripts and connections are documented; unsafe sources are removed only after tests | Security |
| H073 | Security | P1 | Open | Verify framing and transport policy on all hosts | HSTS and frame policy cover intended hosts and exceptions without breaking integrations | Security |
| H074 | Security | P1 | Open | Review CORS and API caching | Origins, credentials, cache keys and private response handling reflect endpoint intent | Security |
| H075 | Security | P1 | Open | Review rate limits and abuse controls | Public and paid endpoints resist abuse while returning useful retry and error behaviour | Security |
| H076 | Security | P1 | Verified sample | Check public vulnerability-reporting discovery | Council and MEOK security.txt endpoints responded; contacts and expiry still require review | Security |
| H077 | Security | P1 | Open | Exercise incident and recovery procedures | Named owners, backup restoration and signing-key compromise scenarios have dated results | Operations |
| H078 | Security | P1 | Open | Review personal data collection and consent | Forms, analytics, logs and third parties match current notices and configured consent | Product |
| H079 | Security | P1 | Open | Check production logging and monitoring | Errors and incidents are detectable without logging keys or unnecessary personal data | Operations |
| H080 | Security | P1 | Open | Review software supply chain and licences | Dependencies, downloaded code, SBOM and redistribution obligations are inventoried | Security |
| H081 | Commercial | P1 | Prepared | Replace internal revenue slogans with service scope | Public wording explains evidence assembly, licensing and delivery without selling outcomes | Product |
| H082 | Commercial | P1 | Related PR | Define buyer-specific service pages | PR 3596 owns task-based buyer navigation and connection guidance; PR 3603 retains service wording. Production visitor acceptance remains open. | Commercial |
| H083 | Commercial | P1 | Related PR | Show representative deliverables | PR 3602 adds original capsule/check export and public decision history; PR 3598 extends a clearly synthetic example. Neither proves customer adoption. | Commercial |
| H084 | Commercial | P1 | Open | Verify pricing and availability | Only currently approved terms appear; taxes, scope and exclusions are clear where applicable | Commercial |
| H085 | Commercial | P1 | Open | Test enquiry and booking routes | Links and forms work; consent, routing and acknowledgement are verified | QA |
| H086 | Commercial | P1 | Open | Review purchase and fulfilment flows | No live test charge without authorisation; order states, refunds and delivery are tested safely | QA |
| H087 | Commercial | P1 | Open | Substantiate testimonials and customer logos | Consent and evidence support every endorsement; usage is not presented as a customer | Commercial |
| H088 | Commercial | P1 | Open | Create a procurement evidence pack | Legal identity, methods, security contacts, service scope and contract route are easy to find | Commercial |
| H089 | Commercial | P2 | Related PR | Establish a traffic and conversion baseline | PR 3604 corrects repeat-demand interpretation and read-only consistency checks. A reliable organic-traffic and qualified-conversion baseline remains outstanding. | Growth |
| H090 | Commercial | P2 | Open | Prioritise experiments by evidence | One clear hypothesis per change; report observed results without promised ranking gains | Growth |
| H091 | Distribution | P0 | Partial | Map every public publishing destination to its producer | Root metadata traced through canonical MCP manifest, package prepack, capability registry, distribution renderer and handwritten A2A card. Other publishers/registries remain to map. | Engineering |
| H092 | Distribution | P0 | Prepared | Regenerate MCP tool descriptions at their source | get_root description corrected at canonical source; package/capability/distribution mirrors regenerated and deterministic checks passed. Retrieval does not imply signature or measurement verification. Registry releases not published. | Engineering |
| H093 | Distribution | P1 | Open | Review package READMEs and registry descriptions | Install instructions, supported versions, limits and canonical links match released code | Maintainers |
| H094 | Distribution | P1 | Open | Review research dataset and model cards | Methods, licence, provenance, limits and current status are explicit | Measurement |
| H095 | Distribution | P1 | Open | Review social and professional public profiles | Biographies, links and claims follow the same approved evidence-led positioning | Communications |
| H096 | Release | P0 | Published PR | Publish source changes through the governed PR route | Public PR 3603 contains explicitly selected source and generated assets. Production release remains governed by DEPLOY-LOCK.md. | Engineering |
| H097 | Release | P0 | In progress | Run required build and release checks | Previous head 1c5014a passed the main gate and release checks. Follow-up head must pass independently; previous green checks are not clearance for new changes. | Release owner |
| H098 | Release | P0 | Open | Verify production after deployment | Apex and production alias agree; delayed anti-clobber check preserves the same release | Release owner |
| H099 | Release | P1 | Partial | Maintain a public completion ledger | This master register links live repository metadata changes and source PRs. Check statuses distinguish prepared, bounded validation and deployed work; production acceptance remains open. | Operations |
| H100 | Release | P1 | Open | Recheck drift and search visibility | Scheduled review has an owner; Google changes are confirmed by observation, not promised | Operations |
