# Public wording, evidence and quality checklist

Prepared 29 October; reconciled 30 October 2026 for Council of AI and MEOK. This is a scoped audit and working completion register, not a security certification or a declaration that all public surfaces are fixed.

## Approved direction

Council of AI – Council for the Safety of Artificial Intelligence – is an AI measurement body operated by CSOAI Ltd. It publishes measurements, methods, limitations and corrections, with free verification of supported signed records. Lead with the work people can inspect. Do not imply statutory appointment, accreditation, guaranteed legal compliance or a favourable result for payment.

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

## Consolidation update — 30 October 2026

The current direction is **Council of AI** first, with **Council of AI – Council for the Safety of Artificial Intelligence** for full introductions and **CSOAI Ltd** as legal operator. The compact profile producers and three description candidates follow that direction. Stable repositories, package IDs, domains, frozen evidence and legal rights are not renamed by this copy change.

This update keeps the existing work owners and completion register. Related results below are attributed to their source PR unless a fresh check is explicitly stated. It does not add a second product architecture or claim all public surfaces are complete.

### Existing source ownership

| Contribution | Existing scope | Current evidence boundary |
| --- | --- | --- |
| [#2975](https://github.com/CSOAI-ORG/councilof-ai/pull/2975) | Public pages, rights, metadata and accessibility | Open at 7d3b4afb. Retain this broader page owner; its reported render/build checks do not establish production release. |
| [#3596](https://github.com/CSOAI-ORG/councilof-ai/pull/3596) | Buyer journey and connection guidance | Open at adf85147. Keep prototype and integration status explicit; release and visitor acceptance remain open. |
| [#3598](https://github.com/CSOAI-ORG/councilof-ai/pull/3598) | Charter authority and unknown effects | Open draft at 9b5f538c. Retain approval-order and UNKNOWN-effect ownership; synthetic examples are not deployed human authority. |
| [#3599](https://github.com/CSOAI-ORG/councilof-ai/pull/3599) | Three framework adapters and evidence handoff | Open at 248eda48. Reports 88 actual SDK checks plus two broken-authorization controls. Local synthetic qualification excludes hosted tools, remote MCP and arbitrary execution. |
| [#3602](https://github.com/CSOAI-ORG/councilof-ai/pull/3602) | Evidence retention and decision history | Open at a449a9af. UI recovery and receipt interpretation must compose with 3606; a retained decision is not proof of execution. |
| [#3606](https://github.com/CSOAI-ORG/councilof-ai/pull/3606) | Decision-store and queue-boundary correction | Open at 183e807c. Reports 59 backend tests and one fixture-signature/history/reopen composition case. Current-head CI and real-person acceptance remain separate. |
| [#3604](https://github.com/CSOAI-ORG/councilof-ai/pull/3604) | Growth evidence and custody wording | Open at 395be564. Repeat-wallet bookkeeping is not repeat-customer proof; custody documentation is not a separated-custody ceremony. |
| [#3605](https://github.com/CSOAI-ORG/councilof-ai/pull/3605) | Availability before payment | Open at 18529165. Unknown corpus availability must stop settlement; reported offline cases use mocked payment/signing. |
| [#3610](https://github.com/CSOAI-ORG/councilof-ai/pull/3610) | Offline recipient evidence check | Open at 2007fccb. Reports 43 tests via its bounded collector, not actual Vitest/typecheck. Keeps scope, signatures, timestamps and unsigned delivery records separate. |
| [#3630](https://github.com/CSOAI-ORG/councilof-ai/pull/3630) | Recovered specialist evidence correction | cfaf1939 restores the earlier 38-file correction onto master. Fresh 59-test pass; uncorrected master fails 10/15 generator cases; all 35 artifacts regenerate. Replaces closed 3607, whose deleted base prevents reopening. No release claimed. |
| [#3595](https://github.com/CSOAI-ORG/councilof-ai/pull/3595) | Axis parity and held local adapter | 81a3162a remains open. Preserve frozen board bytes; resolve the recorded parity failure. Child 3609 at ce38e724 retains a protective local-executor hold. |
| [#3603](https://github.com/CSOAI-ORG/councilof-ai/pull/3603) | This wording, metadata and completion register | Council-first generated introductions, scoped metadata writes and root-description mirrors. Two earlier description edits are live; profile bodies and production source release remain outstanding. |

### Completion route

These six gates order the existing work; they are not six new projects. Human acceptance and independent use cannot be manufactured by more internal tests. The release owner composes branches and records the final source/deployment receipts.

| Gate | Existing owner route | Next concrete work | Completion evidence |
| --- | --- | --- | --- |
| 1. Compose the accepted source | Release owner with the existing PR owners | Resolve 3595’s frozen-evidence conflict; retain 3598’s authority changes and 3609’s local hold; compose 3602 with 3606; integrate the recovered 3630 correction and preserve 3603’s independent registry wording. | One reviewed final commit, relevant tests and all protected checks on that exact head; no lost owner changes or rewritten signed history. |
| 2. Release a coherent public identity | Existing website and profile publishing owners | Use Council of AI first, the full name on introductions and CSOAI Ltd for legal identity. Apply the prepared profile/legacy READMEs through a permitted route. Release canonical MEOK docs through its existing owner. Align home-page entity data and metadata at their producers. | Production receipt plus immediate and delayed Council apex/alias readback; working MEOK /docs#status; exact profile readback; meaningful mobile and keyboard checks. Google result wording still needs observation. |
| 3. Accept one complete user journey | Product, human-authority and runtime owners | Use one defined task and qualified connector: discover evidence → inspect scope → retain/reopen → obtain exact-action authority where available → observe effect → recover or stop. Test rejection, timeout, tamper, revocation and replay at the real boundary. | A genuine authenticated participant and independently observed result tied to the approved input. Fixture identities, shared service tokens and passed unit tests do not close this gate. |
| 4. Deliver one useful evidence service | Measurement and commercial owners | Package an existing measurement/evidence output with its task, method/version, observation date, limits, reuse rights and correction route. Compose 3605 and 3610; keep verification free. Record delivery and recipient acceptance separately. | A scoped deliverable the intended recipient retrieves and can check, recorded acceptance or defect feedback, and a separate later repeat-use observation. Downloads, wallets and signatures do not substitute for these facts. |
| 5. Establish rights and institutional readiness | Founder, legal/finance and governance owners | Reconcile the existing asset register with authorship, licences, transfers, restrictions, source records and actual cost evidence. Assign accountable decisions, conflicts, review and correction handling. Keep asset rights separate from a public brand rename. | Asset-by-asset supported rights and cost records, an agreed commercial perimeter and documented decision responsibilities. A hash does not establish ownership or valuation. |
| 6. Learn and grow from observed use | Research, product and growth owners | Use the existing research and corrections records: question → primary source → bounded experiment → review → release → remeasure. Track search impressions/clicks, qualified enquiries, successful verification, delivery, acceptance and repeat use as distinct measures. | Dated baseline with population and window, independently reproducible evidence where available, reviewed changes linked to outcomes, and a next action derived from an observed gap. No invented adoption or guaranteed traffic increase. |

### Public naming and search alignment

Use the same public name in visible homepage text, existing WebSite data and social metadata. Keep the registered operator distinct in Organization data through legalName where applicable; include only genuine profile links. Update existing nodes instead of creating competing entities. Google’s [site-name guidance](https://developers.google.com/search/docs/appearance/site-names) describes consistent homepage naming and automated selection; its [organization guidance](https://developers.google.com/search/docs/appearance/structured-data/organization) distinguishes name and legalName. Both were read on 30 October. This is implementation guidance, not proof of a deployed schema change or a Google result change.

The source work already clarifies retrieval versus verification, preserves the charter’s 22 articles and adds its canonical URL, and protects description-only writes with stale-plan checks. The newer compact profiles are generated from their producer. Three README publications remain blocked by integration 403. The prior two description updates remain valid public work; the newer Council-first description candidates have not been applied live.

The standalone MEOK HTML is now a historical review reference. The existing execution record reports canonical website documentation work, so the adoption note directs review to that owner rather than deploying this file. Private-source access remains unavailable here; release, privacy/terms verification and production readback are open.

Close each control with the evidence named in its row. Keep source-tested, released, observed in production, independently reproduced and accepted by a recipient as separate states. An incomplete record stays incomplete rather than becoming a fabricated zero or a blanket pass.


## Acceptance register

“Prepared” means a source edit or replacement is ready, not live. “Verified sample” applies only to the stated sample. “Inventoried” means enumerated, not audited. “Open” is not completed. Owners are recommended roles, not assigned people. Close a control only with a dated URL, commit, test receipt or administrative evidence.

| ID | Area | Priority | Status | Control | Acceptance evidence | Owner role |
| --- | --- | --- | --- | --- | --- | --- |
| H001 | Identity | P0 | Access blocked | Publish a stable account profile | Count-free account replacement regenerated with Council of AI first and CSOAI Ltd as legal operator. The earlier integration write returned 403; no live account README update is claimed. | Communications |
| H002 | Identity | P1 | Verified sample | State who operates Council of AI | Homepage and about page identify CSOAI Ltd and link the work | Communications |
| H003 | Identity | P1 | Verified sample | Verify corporate identifiers at the official register | Official Companies House overview read 29 Oct: CSOAI LTD, company 16939677, active private limited company, incorporated 2 Jan 2026; identity agrees with Council About. This is a register match, not accreditation. | Operations |
| H004 | Identity | P1 | Prepared | Describe an operating measurement body in plain language | Generated introductions describe an AI measurement body through published tests, methods, records and verification. No statutory appointment, accreditation or paid favourable ranking is implied. | Communications |
| H005 | Identity | P1 | Partial | Unify brand architecture | 30 Oct source candidates lead with Council of AI; full form Council of AI – Council for the Safety of Artificial Intelligence; legal operator CSOAI Ltd. Wider site, social, registry and logo rollout remains open; stable identifiers and historical evidence are preserved. | Communications |
| H006 | Identity | P1 | Open | Review logos, wordmarks and social avatars | Owned profiles use approved assets with readable mobile and small-size variants | Design |
| H007 | Identity | P1 | Open | Check author and reviewer identities | Public names and roles have consent and verifiable supporting pages | Operations |
| H008 | Identity | P2 | Open | Create a dated media kit | Approved descriptions, logo assets, founder biography and evidence links have an owner | Communications |
| H009 | Claims | P0 | Prepared | Replace permissionless institutional slogans | Current descriptive copy explains published coverage and public verification | Editorial |
| H010 | Claims | P0 | Prepared | Block black-swan and goldmine variants in rendered copy | Guard self-tests catch singular, plural and hyphenated variants | Engineering |
| H011 | Claims | P0 | Open | Replace crown-jewel and internal-code marketing | Current titles, snippets, navigation and package summaries use descriptive names | Editorial |
| H012 | Claims | P0 | Related PR | Audit positive certification and accreditation claims | Existing PR 2975 corrects unsupported institutional, framework, ROI and protection claims across public pages. Its candidate tests do not establish production adoption. | Editorial |
| H013 | Claims | P0 | Prepared | Separate coverage, measurement and ranking | Every count names its population; ties, untested rows and fact runs remain distinct | Measurement |
| H014 | Claims | P0 | Partial | Classify every capability by availability | Existing human-operations review retained 312 declarations and 172 safe GET observations. Availability is endpoint-specific; declared capability is not tested execution. | Product |
| H015 | Claims | P0 | Open | Check independence and commercial boundaries | Payment and ownership disclosures are accurate; favourable results cannot be bought | Measurement |
| H016 | Claims | P0 | Open | Preserve evidence and correction history | Frozen banks, signatures and historical quotes remain byte-correct or are superseded transparently | Measurement |
| H017 | Claims | P1 | Prepared | Keep mutable profile counts at the authoritative source | Stable profile links current board data instead of copying a changing total | Engineering |
| H018 | Claims | P1 | Partial | Link public assertions to their evidence | PR 3603 separates root retrieval from verification. Recovery PR 3630 restores the omitted specialist DECLARED/FINDING correction: 59 focused tests pass; uncorrected master fails 10 of 15 regression cases. Source correction is not release or independent evidence verification. | Measurement |
| H019 | Claims | P1 | Open | Review quantified scale and performance claims | Totals are reproducible and benchmarks state population, hardware and evaluation method | Measurement |
| H020 | Claims | P1 | Open | Check research and membership language | Publication, listing or membership does not imply endorsement or accreditation | Editorial |
| H021 | GitHub | P1 | Inventoried | Inventory the public account repositories | 767 public repository metadata records captured with URLs, descriptions and flags | Engineering |
| H022 | GitHub | P0 | Partial | Triage the flagged repository descriptions | Two live descriptions were corrected on 29 Oct. Three newer Council-first descriptions are prepared at the canonical producer; they have not been applied live. The remaining flagged repositories need individual review. | Editorial |
| H023 | GitHub | P1 | Changed live | Clean sovereign-wiki repository description | Public readback uses catalogue, tools and methods language without inflated counts | Engineering |
| H024 | GitHub | P0 | Partial | Correct the csoai-org-v2 certificate-authority wording | Repository description corrected; README and legacy page content still require review | Editorial |
| H025 | GitHub | P1 | Access blocked | Review every active repository README | Three generated introductions now follow the current naming direction. Earlier legacy-repository checks and 10 successful URL probes are retained as 29 Oct evidence. Integration 403 blocks the account and two legacy README replacements; live bodies remain uncorrected by this lane. | Maintainers |
| H026 | GitHub | P1 | Open | Categorise legacy and experimental repositories | Current entry points explain status without deleting history or breaking consumers | Maintainers |
| H027 | GitHub | P1 | Open | Curate pinned repositories and account bio | Pins lead to maintained evidence, verifier, methods and useful tools | Communications |
| H028 | GitHub | P1 | Partial | Review homepage URLs and topics | Description-only writer added with explicit repository scope, stale-plan checks and readback; topics/homepage fields untouched. No new bulk metadata application performed. | Maintainers |
| H029 | GitHub | P0 | Partial | Verify default-branch protection | Branch response reports protected master and required checks; full admin policy still needs access | Security |
| H030 | GitHub | P0 | Open | Verify account access and recovery | MFA, least privilege, recovery ownership and inactive collaborators are reviewed privately | Security |
| H031 | GitHub | P0 | Open | Review application and deploy-key access | Each integration has a documented purpose, owner and minimum permissions | Security |
| H032 | GitHub | P1 | Verified sample | Inspect sampled Scorecard workflow action pins | The inspected workflow uses SHA pins and checkout disables persisted credentials | Engineering |
| H033 | GitHub | P0 | Open | Audit all GitHub Actions trust boundaries | Untrusted PR input cannot reach privileged tokens, writes or production deployment | Security |
| H034 | GitHub | P1 | Open | Check dependency alerts and update ownership | Open alerts, lockfiles and supported versions have an accountable remediation queue | Security |
| H035 | GitHub | P1 | Open | Check package and release provenance | Published artifacts map to source commits, immutable versions and attestations where supported | Engineering |
| H036 | GitHub | P1 | Open | Verify community-health files per active repo | Security policy, contribution guidance, licence and issue templates resolve correctly | Maintainers |
| H037 | SEO | P1 | Verified sample | Inspect raw homepage and key-page metadata | Sampled Council pages expose descriptive titles, descriptions and canonicals in returned HTML | Web |
| H038 | SEO | P1 | Related audit | Audit all sitemap URLs | PR 2975 reports 738 HTTP observations from a 472-entry sitemap and discovered links. Failures and release readbacks remain scoped to that audit; not all routes are closed. | Web |
| H039 | SEO | P1 | Open | Check sitemap freshness and lastmod accuracy | Only substantive changes update lastmod; canonical routes are complete | Web |
| H040 | SEO | P1 | Open | Review robots directives across hostnames | Search crawlers can reach intended public pages; restricted content uses access control | Web |
| H041 | SEO | P1 | Open | Resolve canonical and alias consistency | Apex, www, trailing slash, mirrors and old routes converge intentionally | Web |
| H042 | SEO | P1 | Open | Investigate www.csoai.org availability | Repeat independent public probes and repair routing if the observed error persists | Web |
| H043 | SEO | P1 | Partial | Add canonical metadata to exceptional standalone pages | Canonical URL added to maintained constitutional-harness HTML in PR 3603; body and 22 articles unchanged. Production readback and security-page producer remain open. | Web |
| H044 | SEO | P1 | Open | Validate structured data semantically | Reconcile the existing home-page WebSite name and Organization name/legalName with visible Council of AI / CSOAI Ltd copy. Validate one consistent entity and genuine profiles; current Google guidance read 30 Oct. No schema deployment or search appearance change claimed. | Web |
| H045 | SEO | P1 | Open | Verify social share cards | Open Graph images, titles and descriptions render correctly on key entry points | Design |
| H046 | SEO | P1 | Open | Check internal link equity and navigation | Important evidence and service pages are reachable with descriptive HTML links | Web |
| H047 | SEO | P1 | Open | Obtain Search Console index coverage evidence | Owned-property inspection identifies indexed, excluded and canonical-selected URLs | Growth |
| H048 | SEO | P1 | Open | Submit refreshed sitemap after the governed release | Submission receipt and inspected representative URLs are retained | Growth |
| H049 | SEO | P1 | Open | Review branded search-result snippets | Dated query, engine, locale and result URL are captured; snippets are not presumed controllable | Growth |
| H050 | SEO | P1 | Open | Correct third-party directory summaries | Owned upstream metadata is fixed and directory correction requests are tracked | Communications |
| H051 | SEO | P1 | Open | Measure field performance on priority routes | Mobile field data where available and repeatable lab results establish a baseline | Web |
| H052 | SEO | P1 | Related PR | Review accessible page structure | PR 2975 reports 908 restricted renders across 454 first-party entries and 96 targeted candidate renders, including named form controls. Broader manual assistive-technology acceptance remains open. | Design |
| H053 | SEO | P2 | Open | Build evidence-led content clusters | Methods, use cases, examples and limitations answer real search intent with original evidence | Growth |
| H054 | SEO | P2 | Open | Check multilingual and regional declarations | Language tags and hreflang only describe actual maintained equivalents | Web |
| H055 | MEOK | P0 | Verified sample | Record current public product boundaries | Homepage distinguishes public evidence workspace from unavailable private staff and voice | Product |
| H056 | MEOK | P0 | Partial | Identify the deployed MEOK source and release owner | The existing execution record now identifies canonical MEOK website documentation work. Its private source still returns integration 404 here. Serving commit, release and production documentation readback remain unverified by this lane. | Engineering |
| H057 | MEOK | P0 | Open | Align privacy wording with the current product | Storage, export, network processing, retention and deletion match tested behaviour | Product |
| H058 | MEOK | P0 | Open | Align terms and product vocabulary | Legacy character and playground terms match the actual current service or are scoped historically | Product |
| H059 | MEOK | P1 | Verified sample | Test Ask and transcript export end to end | Retained 29 Oct human-operations review: public Ask, save and reopen preserved the answer without an extra Ask request; tampered digest rejected. PR 3602 records the earlier live journey. Not rerun by this consolidation. | QA |
| H060 | MEOK | P1 | Related source | Verify the real status destination | Existing MEOK website work supersedes this PR’s standalone docs adoption route. The reference is marked historical and noindex; use the canonical contribution, preserve /docs#status and require live readback. | Product |
| H061 | MEOK | P1 | Open | Check request-job completion | Form validation, consent, acknowledgement and delivery expectations work without a test purchase | QA |
| H062 | MEOK | P1 | Open | Check unavailable integrations | Connect and product pages consistently explain availability without implying live features | Product |
| H063 | MEOK | P1 | Partial | Review local data and session handling | Retained public journey checked export/reopen and digest rejection. Transcripts unsigned; new-session/cross-device recovery and complete privacy/storage audit remain unverified. | Security |
| H064 | MEOK | P1 | Partial | Check mobile and low-bandwidth usability | Retained 390 × 844 public-workspace check reported no overflow. Low-bandwidth, accessibility and all-device acceptance remain open. | QA |
| H065 | Security | P0 | Bounded scan | Scan downloaded source for high-confidence secret patterns | 1,384 downloaded files checked for selected token and private-key markers; no matches in this limited scan | Security |
| H066 | Security | P0 | Open | Run complete repository and history secret scanning | All active repos, history, release assets and builds are scanned; confirmed secrets are revoked | Security |
| H067 | Security | P0 | Open | Inspect secret-scanning and push-protection settings | Admin evidence confirms effective settings; unavailable access is not a pass | Security |
| H068 | Security | P0 | Related PR | Review production secret custody | PR 3604 corrects public custody claims and distinguishes historical same-host shares from planned separation. No production custody implementation or key rotation claimed. | Security |
| H069 | Security | P0 | Related PR | Review authentication and authorisation | PR 3598 owns authority ordering and unknown outcomes; current PR 3599 reports 88 pinned SDK tests across LangChain, Strands and OpenAI local function-tool adapters. Real identity, revocation, durable consumption and deployed effects need separate acceptance. | Security |
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
| H080 | Security | P1 | Partial | Review software supply chain and licences | Metadata planner no longer infers MIT from absent or compound licence declarations. Description-only mode writes no licences. Existing dependency, SBOM, rights and legacy licence audits remain open. | Security |
| H081 | Commercial | P1 | Prepared | Replace internal revenue slogans with service scope | Public wording explains evidence assembly, licensing and delivery without selling outcomes | Product |
| H082 | Commercial | P1 | Related PR | Define buyer-specific service pages | PR 3596 owns task-based buyer navigation and connection guidance; PR 3603 retains service wording. Production visitor acceptance remains open. | Commercial |
| H083 | Commercial | P1 | Related PR | Show representative deliverables | PR 3602 owns retention/history; PR 3610 adds an offline recipient bundle check. Original bytes, scope and signature checks stay separate from delivery, freshness and customer acceptance. Reuse these existing outputs as the buyer example. | Commercial |
| H084 | Commercial | P1 | Open | Verify pricing and availability | Only currently approved terms appear; taxes, scope and exclusions are clear where applicable | Commercial |
| H085 | Commercial | P1 | Open | Test enquiry and booking routes | Links and forms work; consent, routing and acknowledgement are verified | QA |
| H086 | Commercial | P1 | Related PR | Review purchase and fulfilment flows | PR 3605 refuses payment when corpus readability is unknown; PR 3610 checks retained delivery evidence. Candidate offline tests do not establish live settlement, fulfilment or recipient acceptance. No live charge was performed. | QA |
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
| H097 | Release | P0 | Pending final heads | Run required build and release checks | All latest substantive hosted checks passed on 3603 head 980f2c4; two optional reviewers were neutral. The Council-first follow-up and recovered 3630 source each need their own hosted results. Composition and production release remain separate gates. | Release owner |
| H098 | Release | P0 | Open | Verify production after deployment | Apex and production alias agree; delayed anti-clobber check preserves the same release | Release owner |
| H099 | Release | P1 | Partial | Maintain a public completion ledger | The same 100-control register now links the recovered 3630 correction, current public source contributions and six dependency-ordered completion gates. No aggregate all-complete percentage or duplicated product plan. | Operations |
| H100 | Release | P1 | Open | Recheck drift and search visibility | Scheduled review has an owner; Google changes are confirmed by observation, not promised | Operations |
