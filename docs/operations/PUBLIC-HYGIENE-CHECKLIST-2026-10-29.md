# Public wording, evidence and quality checklist

Prepared 29 October 2026 for CSOAI / Council of AI and MEOK. This is a scoped audit and working completion register, not a security certification or a declaration that all public surfaces are fixed.

## Approved direction

Council of AI is the public AI measurement service operated by CSOAI Ltd. It publishes measurements, methods, limitations and corrections, with free verification of supported signed records. Lead with the work people can inspect. Do not imply statutory appointment, accreditation, guaranteed legal compliance or a favourable result for payment.

MEOK is a CSOAI product with a public evidence workspace. Describe only capabilities available in the current deployed product. Product demonstrations, future capabilities and measurement evidence must remain distinct.

Use descriptive language: public verification, published coverage, measurement tools, evidence services and defined delivery scope. Replace promotional uses of permissionless, black swan, crown jewels, goldmine, internal codenames, cash register and planted SDKs. Preserve exact historical quotations, frozen test inputs, signed records and compatibility identifiers where rewriting would change evidence or break clients. Explain historical terminology at its current entry point.

## Coverage and limits

- Metadata inventory: all 767 public repositories returned by the account API at collection time. This is not a content/security review of all 767 repositories.
- Web sample: 36 requested public URLs across Council, CSOAI and MEOK. 34 returned successfully in the initial sample; one guessed MEOK status route returned 404 and is not classified as a broken link. The actual homepage link is /docs#status; a follow-up HTTP probe of that route returned 403 and needs browser confirmation. www.csoai.org returned 503 on two probes.
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
5. Sampled Council /security/ and /constitutional-harness/ HTML lacks canonical links. The security page does have a description; do not report it missing.
6. Sampled Council security-page headers differ from the main site. Sampled MEOK headers include a broad CSP but no observed HSTS or frame-ancestors directive. Review serving sources and feature compatibility before tightening policy. These observations do not demonstrate an exploitable vulnerability.
7. MEOK's terms/privacy vocabulary still includes earlier character/playground concepts. Align with tested current storage and product behaviour after locating the deployed source and owner. No MEOK production change is claimed.

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
| H014 | Claims | P0 | Open | Classify every capability by availability | Live, experimental, planned and unavailable features have evidence and clear labels | Product |
| H015 | Claims | P0 | Open | Check independence and commercial boundaries | Payment and ownership disclosures are accurate; favourable results cannot be bought | Measurement |
| H016 | Claims | P0 | Open | Preserve evidence and correction history | Frozen banks, signatures and historical quotes remain byte-correct or are superseded transparently | Measurement |
| H017 | Claims | P1 | Prepared | Keep mutable profile counts at the authoritative source | Stable profile links current board data instead of copying a changing total | Engineering |
| H018 | Claims | P1 | Open | Link public assertions to their evidence | Each major claim has a method, date, sample scope and limitations | Measurement |
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
| H043 | SEO | P1 | Open | Add canonical metadata to exceptional standalone pages | Security and constitutional-harness pages identify the intended canonical URL | Web |
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
| H056 | MEOK | P0 | Open | Identify the deployed MEOK source and release owner | Serving commit, repository, project and deployment workflow agree | Engineering |
| H057 | MEOK | P0 | Open | Align privacy wording with the current product | Storage, export, network processing, retention and deletion match tested behaviour | Product |
| H058 | MEOK | P0 | Open | Align terms and product vocabulary | Legacy character and playground terms match the actual current service or are scoped historically | Product |
| H059 | MEOK | P1 | Open | Test Ask and transcript export end to end | A public evidence query produces traceable sources and a recoverable export | QA |
| H060 | MEOK | P1 | Open | Verify the real status destination | Homepage points to /docs#status; the destination clearly explains availability | Product |
| H061 | MEOK | P1 | Open | Check request-job completion | Form validation, consent, acknowledgement and delivery expectations work without a test purchase | QA |
| H062 | MEOK | P1 | Open | Check unavailable integrations | Connect and product pages consistently explain availability without implying live features | Product |
| H063 | MEOK | P1 | Open | Review local data and session handling | Users can understand and control local transcripts; keys and sensitive content are not exposed | Security |
| H064 | MEOK | P1 | Open | Check mobile and low-bandwidth usability | Core workspace, evidence links and export remain usable on constrained devices | QA |
| H065 | Security | P0 | Bounded scan | Scan downloaded source for high-confidence secret patterns | 1,384 downloaded files checked for selected token and private-key markers; no matches in this limited scan | Security |
| H066 | Security | P0 | Open | Run complete repository and history secret scanning | All active repos, history, release assets and builds are scanned; confirmed secrets are revoked | Security |
| H067 | Security | P0 | Open | Inspect secret-scanning and push-protection settings | Admin evidence confirms effective settings; unavailable access is not a pass | Security |
| H068 | Security | P0 | Open | Review production secret custody | CI, hosting, keys and signing roles are separated and rotation is documented privately | Security |
| H069 | Security | P0 | Open | Review authentication and authorisation | Cross-account access, admin boundaries and server-side permission checks pass tests | Security |
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
| H082 | Commercial | P1 | Open | Define buyer-specific service pages | Each offer names audience, input, deliverable, turnaround boundaries and next step | Commercial |
| H083 | Commercial | P1 | Open | Show representative deliverables | Samples demonstrate real outputs and label redaction, dates and limitations | Commercial |
| H084 | Commercial | P1 | Open | Verify pricing and availability | Only currently approved terms appear; taxes, scope and exclusions are clear where applicable | Commercial |
| H085 | Commercial | P1 | Open | Test enquiry and booking routes | Links and forms work; consent, routing and acknowledgement are verified | QA |
| H086 | Commercial | P1 | Open | Review purchase and fulfilment flows | No live test charge without authorisation; order states, refunds and delivery are tested safely | QA |
| H087 | Commercial | P1 | Open | Substantiate testimonials and customer logos | Consent and evidence support every endorsement; usage is not presented as a customer | Commercial |
| H088 | Commercial | P1 | Open | Create a procurement evidence pack | Legal identity, methods, security contacts, service scope and contract route are easy to find | Commercial |
| H089 | Commercial | P2 | Open | Establish a traffic and conversion baseline | Organic visits, qualified enquiries and completed deliveries have definitions and privacy controls | Growth |
| H090 | Commercial | P2 | Open | Prioritise experiments by evidence | One clear hypothesis per change; report observed results without promised ranking gains | Growth |
| H091 | Distribution | P0 | Open | Map every public publishing destination to its producer | GitHub, npm, PyPI, MCP, Hugging Face, Zenodo, Kaggle and directory listings have owners | Engineering |
| H092 | Distribution | P0 | Open | Regenerate MCP tool descriptions at their source | Public-root and other summaries use clear wording; derived mirrors remain reproducible | Engineering |
| H093 | Distribution | P1 | Open | Review package READMEs and registry descriptions | Install instructions, supported versions, limits and canonical links match released code | Maintainers |
| H094 | Distribution | P1 | Open | Review research dataset and model cards | Methods, licence, provenance, limits and current status are explicit | Measurement |
| H095 | Distribution | P1 | Open | Review social and professional public profiles | Biographies, links and claims follow the same approved evidence-led positioning | Communications |
| H096 | Release | P0 | Prepared | Publish source changes through the governed PR route | Reviewable diff, tests and source commit precede release-owner deployment | Engineering |
| H097 | Release | P0 | Open | Run required build and release checks | gates, build, stamped-bytes and hold-guard must pass on the exact release head | Release owner |
| H098 | Release | P0 | Open | Verify production after deployment | Apex and production alias agree; delayed anti-clobber check preserves the same release | Release owner |
| H099 | Release | P1 | Open | Maintain a public completion ledger | Every completed task has a URL, commit or test receipt, date and observed outcome | Operations |
| H100 | Release | P1 | Open | Recheck drift and search visibility | Scheduled review has an owner; Google changes are confirmed by observation, not promised | Operations |
