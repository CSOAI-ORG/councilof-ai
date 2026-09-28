# Hiring platforms: agents engaging humans. A first public-evidence measurement

**Status: DRAFT for review.** Built on branch `lane/hiring-platforms-20260924`. Not signed, not timestamped, not deployed.
Registry: `public/claims/claimreg-hiring-platforms-2026-09-24.json` (schema `csoai.claim-registry/0.3`, artifacts `csoai.claim-maintenance.artifact/0.1`).
Registry digest `ca951f4c45fec358358efd7440537df98d8d382bce6c60562459fb0d565444ea`. RFC 9162 Merkle root over 29 artifacts `72bfe56d27ebb82e368e722963b29f53b416e65914c8a5f694e36f4fb6435358`.
Built 2026-09-24T15:39:29Z on the RunPod host. Next scheduled read: 2026-10-01T09:20:00Z.

This is a measurement, not an assessment. Nothing here certifies, grades or ranks any platform. Nothing here says that any claim is false. Where a third party's record differs from what a subject says, both are set side by side and the reader draws the conclusion.

---

## 1. Method

**Selection.** The three named subjects (RentAHuman, gotoHuman, Payman) were checked first. Each has a live primary source. Two more come from third-party indexes, not from a list: **Invoke**, because the official MCP registry lists a hosted server for it that describes hiring a human, and **InstaHuman**, because it is one of only four hosts, across both public x402 discovery indexes, whose resource description offers work done by a person. The full rule, including every drop, is in the registry's `selection_rule`.

**Dropped, and why**
| candidate | reason |
|---|---|
| humanforai.dev, yourhuman.ai, missionforhire.com | Each operator is a single natural person (the sites say "one real human", "I am a human lawyer" and "one person"). Measuring one of these is measuring a person. |
| human4ai.ai | Its own page offers a correction workspace, not hiring. |
| parahuman.co | A social-listening product. Its name matched the registry search only as a substring. |
| human.twin3.ai, productclank.com, intel.rallylive.ca | Listed in the x402 indexes with descriptions that mention humans. By their own descriptions they are proof-of-humanity, social engagement and business-record products, not task marketplaces. They are recorded in `CTX-X402-HUMAN-TASKS.json`. |

**States.** The artifact `state` field uses the specification's four states and only those four (spec §4): `CLAIM_MEASURED`, `UNMEASURED`, `UNCHECKABLE`, `CLAIM_CAPTURED`. This lane was also asked to report an evidence state. That is a separate label, carried in the harness outputs and in the tables below. It is not a fifth artifact state.

| evidence state | meaning | spec state it sits in |
|---|---|---|
| **MEASURED** | A record held by someone other than the subject was read, and its value is reported. | `CLAIM_MEASURED` |
| **SELF_ASSERTED** | The only public evidence is the subject's own surface: its page, API, task board, `/.well-known` file, or the Internet Archive's copy of its page. | `UNCHECKABLE`, or `UNMEASURED` with a restatement watch |
| **SEARCH_INCONCLUSIVE** | A third-party route was tried and did not answer. The status is recorded. It is never read as an absence. | `UNMEASURED` |
| **UNMEASURED** | Public evidence could settle the claim in principle, but this run reached none. | `UNMEASURED` |

**Third-party sources used.** All reads were keyless. No account was made, no form was submitted, no task was posted and nothing was paid.
- official MCP registry: `registry.modelcontextprotocol.io/v0/servers?search=`
- npm registry and npm downloads API: `registry.npmjs.org`, `api.npmjs.org/downloads/point/{last-week,last-month}`
- GitHub REST API, unauthenticated, including GitHub's own licence detection
- both public x402 discovery indexes, each read to the total it reports:
  - Coinbase CDP Bazaar: 16,888 of 16,888 resources, read 2026-09-24T15:37:05Z
  - PayAI: 6,871 of 6,871 resources, read 2026-09-24T15:37:17Z
- SEC EDGAR full-text search and submissions records
- Internet Archive: CDX index plus raw `id_` captures
- each subject's `/.well-known/{agent-card.json, agent.json, mcp.json, mcp/server-card.json, x402.json}` and `/llms.txt`. A file that is PRESENT shows only that the file was published.
- OpenCorporates, tried for the German entity. It served a CAPTCHA page with HTTP 200, and its API returned 401 because it needs a token. The route was dropped, not worked around.

**Reproduce.**
```
python3 scripts/claims/measure_hiring.py <run-dir>
node scripts/claims/capture-growth.mjs --subjects scripts/claims/subjects-hiring-platforms-2026-09-24.json \
     --measurements <run-dir> --series public/claims/series \
     --registry-id claimreg-hiring-platforms-2026-09-24 --out public/claims/claimreg-hiring-platforms-2026-09-24.json
python3 scripts/claims/measure_hiring.py --index <run-dir> public/claims/claimreg-hiring-platforms-2026-09-24.json evidence-index.json
```
Evidence for this run:
- `docs/measurement/hiring-platforms-2026-09-24/measurements/`: every harness output, byte for byte.
- `docs/measurement/hiring-platforms-2026-09-24/evidence-index.json`: 238 rows. Each gives a URL, its HTTP status, the access instant and the sha256 of the bytes read (or, for pages, of the visible text the registry covers). Transport failures carry their reason.

**Personal data.** None is carried. Maintainer names and e-mail addresses on npm, and the street address and telephone number on the SEC filer record, were in bytes that were read and hashed. They are not reproduced anywhere in this lane's output.

---

## 2. Per-platform tables

Counts use the four spec states, then the lane's evidence states.

| subject | claims | CLAIM_MEASURED | UNMEASURED | UNCHECKABLE | MEASURED | SELF_ASSERTED | SEARCH_INCONCLUSIVE | UNMEASURED (evidence) |
|---|---|---|---|---|---|---|---|---|
| RentAHuman (rentahuman.ai) | 9 | 2 | 3 | 4 | 2 | 5 | 1 | 1 |
| gotoHuman (gotohuman.com) | 6 | 3 | 1 | 2 | 3 | 2 | 1 | 0 |
| Payman (paymanai.com) | 5 | 1 | 0 | 4 | 1 | 4 | 0 | 0 |
| Invoke (invoke.nanocorp.app) | 5 | 1 | 0 | 4 | 1 | 4 | 0 | 0 |
| InstaHuman (instahuman.com) | 4 | 1 | 1 | 2 | 1 | 2 | 0 | 1 |
| **total** | **29** | **8** | **5** | **16** | **8** | **17** | **2** | **2** |

### RentAHuman: operator named in its terms as "RawLabs, Inc. dba RentAHuman.ai"
| id | claim (verbatim, abbreviated where marked) | evidence state | what the third-party record shows |
|---|---|---|---|
| RH-1 | "RentAHuman is a live marketplace with 787,000+ registered humans across 100+ countries." | SELF_ASSERTED (restatement watch) | No third party holds a worker count. See §3.1 for the figure's history in the Internet Archive. |
| RH-2 | "Connect your AI agent via our MCP server or REST API." | MEASURED | The official MCP registry holds 9 versions of `io.github.rentahuman-ai/rentahuman`: latest 3.7.0, published 2026-09-18T02:19:35Z, status active. npm holds `rentahuman-mcp` with 55 versions, first published 2026-02-04, and 3,330 downloads from 2026-08-23 to 2026-09-21 (824 in the last week). The repository the registry entry declares, `github.com/rentahuman-ai/human-rental-marketplace`, was **not served** to an unauthenticated reader (GitHub API 404). |
| RH-3 | "Sign up and fund your wallet by paying USDC on Base — no card, no checkout page." | MEASURED | **NOT_FOUND_IN_INDEXES.** Neither index lists a resource on rentahuman.ai. Both were read completely. `/.well-known/x402.json` returned 404. |
| RH-4 | "Funds are held until the task is done" | SELF_ASSERTED | No public record of who holds the funds. |
| RH-5 | "RentAHuman does not perform background checks … may require identity, payment, location, or other verification … in our discretion." | SELF_ASSERTED (scope statement) | The docs describe an optional per-bounty `identityRequired` check against government ID. |
| RH-6 | "Workers using the Platform are not independent contractors or employees of RentAHuman, including where a Task is offered, priced, or paid at an hourly rate." | SELF_ASSERTED | A classification statement. See §4. |
| RH-7 | "RentAHuman provides a dispute resolution mechanism for transactions conducted through our escrow system." | SELF_ASSERTED | The docs describe `open_dispute` as available to the buyer only. |
| RH-8 | "RawLabs, Inc. dba RentAHuman.ai" | UNMEASURED | The terms name no state of incorporation, and state registers answer only through forms. EDGAR full-text search for "RawLabs, Inc." returned 0 filings, which says nothing about incorporation. |
| RH-9 | `"license":"MIT"` (npm manifest) | SEARCH_INCONCLUSIVE (404) | The code host's licence detection could not be read, because the declared repository was not served. |

### gotoHuman: operator named in its imprint as "gotoHuman UG (haftungsbeschränkt)", Berlin
| id | claim | evidence state | what the third-party record shows |
|---|---|---|---|
| GT-1 | "We are GDPR-compliant and your data is stored on secure European servers." | SELF_ASSERTED | |
| GT-2 | "How PayFacto, a leading global payment processing company … is using gotoHuman" | MEASURED | **NOT_FOUND.** PayFacto's own site was searched: 3 pages read, 117 sitemap URLs seen, 200 Common Crawl pages seen. The search reports its own reach, and this is not a denial. |
| GT-3 | `"license": "MIT"` (package.json) | MEASURED | GitHub's detector reports **MIT** for `gotohuman/gotohuman-mcp-server`. The LICENSE file opens "MIT License Copyright (c) 2025 gotoHuman". |
| GT-4 | "Use our MCP server to request human approvals …" | MEASURED | The MCP registry search for "gotohuman" returned **0** entries. npm holds `@gotohuman/mcp-server` 0.2.2 (4 versions, first published 2025-04-24) with 206 downloads in the month to 2026-09-21. GitHub serves the repository: 52 stars, 10 forks, last push 2026-06-01. |
| GT-5 | "gotoHuman UG (haftungsbeschränkt)" | SEARCH_INCONCLUSIVE | The Handelsregister is form-only. OpenCorporates served a CAPTCHA page (HTTP 200), and its API returned 401 because it needs a token. |
| GT-6 | "the core services we use are certified under SOC 3 and ISO 27001" | SELF_ASSERTED | The providers are not named. |

### Payman: operator named in its footer as "Payman AI, Inc."
| id | claim | evidence state | what the third-party record shows |
|---|---|---|---|
| PM-1 | "SOC 2 Certified" | SELF_ASSERTED | SOC 2 reports are restricted-use, and no public register holds them. |
| PM-2 | "Already trusted by financial institutions across the country" | SELF_ASSERTED | No institution is named. |
| PM-3 | "© 2026 Payman AI, Inc. All rights reserved." | MEASURED | SEC EDGAR holds CIK 0002025647 under the exact name "Payman AI, Inc.", state of incorporation DE, with two Form D filings dated 2024-06-18 and 2024-11-05. The issuer completes Form D itself; only the record's existence is measured. |
| PM-4 | "We deploy AI agents that handle money." | SELF_ASSERTED | |
| PM-5 | "Payman is the first AI to Human platform that allows AI to pay people for what it needs." (Internet Archive copy, 2024-10-05) | SELF_ASSERTED | See §3.3. |

### Invoke: no legal entity named on the pages read ("© 2025 Invoke")
| id | claim | evidence state | what the third-party record shows |
|---|---|---|---|
| IN-1 | "a vetted human delivers the structured result within 24 hours" (excerpt) | SELF_ASSERTED | The only timing record is the subject's own task board. |
| IN-2 | "Proven end-to-end: … completed it in 43 minutes, and the poster approved the $22 payout." | SELF_ASSERTED | The linked proof is on the subject's own site. |
| IN-3 | "Task posting fees are processed through Stripe and are non-refundable unless required by law." | SELF_ASSERTED | The checkout URLs in the docs are on the subject's own domain. |
| IN-4 | "We facilitate the connection but are not a party to agreements between Task Posters and Workers." | SELF_ASSERTED | A classification statement. See §4. |
| IN-5 | "Add the hosted MCP endpoint to Claude Desktop, Cursor, or any Streamable HTTP MCP client." | MEASURED | The MCP registry holds 4 versions of `app.nanocorp.invoke/human-tasks`: latest 0.1.4, published 2026-08-22, remote `https://invoke.nanocorp.app/mcp`. The declared repository `github.com/nanocorp-hq/invoke` was **not served** (404). There is no npm package. |

### InstaHuman: operator named in its terms as "Hallway LLC (DBA InstaHuman)"
| id | claim | evidence state | what the third-party record shows |
|---|---|---|---|
| IH-1 | "Funds are reserved when the job is posted. Only valid completed tests are paid." | SELF_ASSERTED | |
| IH-2 | "Testers act as independent contractors" | SELF_ASSERTED | A classification statement. See §4. |
| IH-3 | "Payments and payouts are handled by third-party providers (e.g., Stripe)." | MEASURED | **LISTED.** The PayAI index lists `https://api.instahuman.com/x402/feedback` on network `base`, asset USDC (`0x8335…2913`), last updated 2026-07-15. CDP lists nothing on the subject's hosts. Only the listing is measured, not which providers the subject uses. |
| IH-4 | "operated by Hallway LLC (DBA InstaHuman)" | UNMEASURED | The terms choose Maryland law and do not state where the entity is formed. State registers are form-only. |

`/.well-known` presence (`CTX-WELL-KNOWN.json`). No subject serves `agent-card.json`, `agent.json`, `mcp.json` or `x402.json`. Invoke alone serves `/.well-known/mcp/server-card.json`, which names the same 404 repository. RentAHuman, Payman and Invoke serve `/llms.txt`.

---

## 3. What the evidence does and does not show

### 3.1 Headcount claims are held only by the subjects
No third party holds a worker count for any subject. For RentAHuman, the Internet Archive's copies of the home page (`CTX-WAYBACK-RENTAHUMAN.json`: 60 of 80 sampled captures read, 126 distinct captures indexed) show the registered-humans sentence reading **"500,000+ registered humans across 100+ countries"** from 2026-06-07 to 2026-08-09 and **"787,000+"** from 2026-08-27. Beside it, a separately labelled live counter, **"Rentable humans"**, read:

| date | Rentable humans |
|---|---|
| 2026-07-18 | 774,263 |
| 2026-09-17 | 818,125 |
| 2026-09-24, this run's first read | 827,541 |
| 2026-09-24, a later read that day | 827,551 |

These are the subject's own figures on its own page. Two labels, two numbers. Nothing here reconciles them, and nothing here computes a rate from them. The only third-party adoption signal is npm downloads of the agent-side package (3,330 in the month to 2026-09-21). That is a count of package fetches, not of workers, agents or tasks.

### 3.2 The source repositories declared for two MCP servers were not served
The official MCP registry entries for RentAHuman and Invoke each declare a GitHub repository. GitHub returned 404 for both to an unauthenticated reader. The same answer comes back for a private repository and for one that does not exist, so this is read as neither. As a result, the code host cannot test RentAHuman's MIT licence field (RH-9 stays SEARCH_INCONCLUSIVE). gotoHuman is the contrast: its repository is served, and GitHub's own detector reports the MIT licence its manifest states. gotoHuman has no entry in the official MCP registry search.

### 3.3 Payment rails: two documents, two indexes
RentAHuman's docs describe signing up and funding a wallet with USDC on Base (RH-3). Neither x402 discovery index lists a resource on its hosts. That is a fact about two indexes at one time. Listing requires registration with, or settlement through, that facilitator with discovery metadata, so it says nothing about whether the route works. InstaHuman's terms name Stripe as an example provider, and a facilitator-held index (PayAI) lists a paid x402 resource on its API host. Across both indexes (23,759 resources), only **4 hosts** have descriptions offering work by a person (`CTX-X402-HUMAN-TASKS.json`). x402-paid human tasks are rare in the indexes as of this run.

### 3.4 Payman's positioning over time, from the Internet Archive
From `CTX-WAYBACK-PAYMAN.json` (50 of 65 distinct captures read; the other 15 did not answer this host and are unmeasured):

| capture dates | page title / wording |
|---|---|
| 2024-04-15 to 2024-10-05 | Title "AI That Pays Humans". From 2024-07-19 also "Over 10,000+ signed up for the beta" and the PM-5 sentence. |
| 2025-01-16 to 2025-03-16 | "AI Agents to move money" |
| 2025-03-21 to 2025-10-24 | "AI agents to safely move real money", with "SOC 2 and PCI compliance" |
| 2025-11-18 onward | Banking wording. From 2026-01-31, "SOC 2 Certified". From 2026-03-14, title "Agentic AI That Does the Banking". |

These are dated copies of the subject's own words. They date a positioning; they settle nothing about it. A page may change for any reason (spec §4.9).

### 3.5 Escrow, identity and dispute claims are all SELF_ASSERTED
Every statement about holding funds (RH-4, IH-1), identity checks (RH-5), disputes (RH-7) or payout records (IN-2) rests on records only the subject, and its payment or identity vendors, hold. None is published.

---

## 4. Legal context (pointers only, not findings)

These are the legal frames a reader of the classification statements (RH-6, IN-4, IH-2) will reach for. **This registry applies none of them to any subject**, and it makes no finding about any worker's status or any platform's compliance.

- **EU Platform Work Directive**, Directive (EU) 2024/2831. Member States must transpose it by **2 December 2026**. It introduces a rebuttable legal presumption of an employment relationship where facts indicate direction and control, and rules on algorithmic management of people working through digital labour platforms.
- **UK: Uber BV v Aslam [2021] UKSC 5.** Worker status is decided by the statutory purpose and the reality of the relationship, not by how the written terms label it.
- **EU AI Act (Regulation (EU) 2024/1689), Article 14.** Human-oversight requirements for high-risk AI systems. Annex III(4) lists AI used in employment and worker management, including task allocation and monitoring, as a high-risk area.

The subjects' own statements differ from one another. RentAHuman says workers are neither independent contractors nor employees of RentAHuman. InstaHuman says testers act as independent contractors. Invoke says it is not a party to poster–worker agreements. They are recorded side by side because each is that subject's own wording. Only a court or tribunal, on the facts, settles any of them.

---

## 5. Explicit non-findings

- **No claim here is found false**, and none is found true. `CLAIM_MEASURED` means a measurement sits beside the claim. It is not a pass or a fail.
- **NOT_FOUND** (GT-2 PayFacto; RH-3 x402 indexes) is a fact about a stated search at a stated time. It is not a denial, not an absence of the relationship or rail, and not a contradiction.
- **A 404 from GitHub** (RH-2, RH-9, IN-5) is not evidence that a repository does not exist.
- **EDGAR returning nothing for "RawLabs, Inc."** says nothing about whether that entity exists. EDGAR records SEC filings, not incorporations.
- **npm download counts** are not users, installs, agents, workers or transactions.
- **No finding** on any worker's employment status, any platform's lawfulness, the adequacy of any human oversight, whether any MCP server or payment route works, or whether any funds are safe.
- **Selection is not ranking.** Five subjects is what this lane maintains, not a census of the category.

---

## 6. Capture notes and defects found in our own tooling

1. **One read served a shorter page.** At 2026-09-24T15:37:38Z, one read of `https://rentahuman.ai/` produced 2,016 characters of visible text without the FAQ section. Three claims (RH-1, RH-2, RH-4) were therefore not located and were recorded as `READ_BUT_STRING_NOT_LOCATED`. Every later read that day produced 3,970 characters with all three sentences present. The published registry is built from a later read. The first read's series line is kept in the lane run directory and not published. This is an observation about one read from this host, not about the subject.
2. **The reference extractor does not decode hexadecimal character references.** `scripts/claim-capture.mjs` `extractVisibleText` leaves `&#x27;` undecoded. A browser renders it as an apostrophe. Claims containing an apostrophe were therefore avoided or captured as contiguous excerpts (IN-1). This is a defect in our extractor, not in any subject's page. It is recorded here and not fixed in this lane, because fixing it changes the digests every published registry covers, and that change needs its own supersession.
3. **Intermittent upstream failures.**
   - The official MCP registry intermittently answers 200 with an empty body. The harness retries and would record a persistent failure as SEARCH_INCONCLUSIVE, never as zero entries.
   - Internet Archive captures intermittently fail to answer. This affected 15 of 65 Payman captures and 20 of 80 RentAHuman captures, and one registry build, for which PM-5 was re-pointed to a capture the harness had read.
4. **Builder change.** `scripts/claims/capture-growth.mjs` now takes the harness path and the registry-level `boundaries`, `signature_state` and `timestamp_state` from the subjects file when present. Without this, a second registry would have inherited the first registry's "SIGNED BY SIDECAR" and "SUBMITTED" sentences, which are not true of this draft. The defaults are the previous literal text, so a registry built without these keys is unchanged.

## 7. Before this leaves draft
- [ ] Review the two classification-adjacent types (`worker-classification-statement`, `scope-statement`) for wording.
- [ ] Sign via the board signer, then write the `.signed.json` sidecar and `.ots`, and replace `signature_state` and `timestamp_state` with the true sentences at that time.
- [ ] Decide whether the extractor defect in §6.2 is fixed first. That fix is a separate supersession.
- [ ] Re-read on 2026-10-01. The RH-1 series needs a second dated point before it says anything.
