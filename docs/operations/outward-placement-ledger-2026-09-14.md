# CSOAI no-duplicate outward ledger — 14 September 2026

> **Canonical ledger rule:** This is the only authoritative outward-placement ledger. Every lane must reconcile against this file before making a submission and append exact proof here afterward. Do not create or maintain parallel outward-placement ledgers.

This ledger reconciles public listings, GitHub history and open submissions. A draft is not a submission; a directory page is not an endorsement; download or directory activity is not a customer count.

| Surface | State | Proof checked | Action |
|---|---|---|---|
| CSOAI website, board, verifier, sitemap, RSS, `llms.txt`, press JSON | LIVE | Each URL returned HTTP 200 on 14 September. | Do not resubmit as a new launch. |
| Bing and Yandex IndexNow | DONE TODAY | Both accepted the seven-URL batch with HTTP 200; Yandex returned `success: true`. | Do not ping again without a material URL change. |
| Official MCP Registry | LIVE/CURRENT | `io.github.CSOAI-ORG/gspc` 1.4.2 points to the flagship repository and remote MCP endpoint. | No submission. |
| npm | LIVE/CURRENT | `csoai-gspc-mcp` latest is 0.2.2. | No submission. |
| Glama | LIVE; OWNERSHIP UNVERIFIED | `https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc` is Healthy, exposes 12 tools, and was tested today. Its payload reports `isVerified=false`. | Do not create another listing. Ownership fix waits for the exact account-issued claim token. |
| Smithery | LIVE, INCLUDING DUPLICATE | `llms.txt` records the correct `csoai/gspc-mcp` listing and a stale `csoai/gspc` duplicate. | Correct or retire the duplicate; do not submit a third listing. |
| MCP.so | LIVE/DONE | Merged flagship PRs #1931, #1964 and #2310 explicitly record and correct the live MCP.so proof. | Do not submit again or open another support ticket. |
| PulseMCP | LIVE/DONE | Merged PR #1452 records PulseMCP as listed after sitemap verification. | No submission. |
| Awesome MCP Servers | LIVE, WITH DUPLICATE PRS PENDING | PR #13360 merged the CSOAI GSPC entry. PRs #13346 and #14316 remain open. | Close or reconcile duplicate open PRs; do not submit again. |
| a2aregistry.org | LIVE/DONE | Registration returned `409 already registered`; the public record is healthy, reports 100% uptime, seven skills and was refreshed today. | No submission. |
| x402scan | LIVE/DONE; OWNERSHIP SEPARATE | The live CSOAI Traction page links to the public x402scan server record. | Do not register again. Treat ownership verification as a separate pending account/wallet action. |
| PayAPI Market | LIVE/DONE | The public Council of AI GSPC EU evidence-feed page returned HTTP 200. | No submission. |
| Hugging Face | LIVE/DONE | Hub API returned 102 datasets, 39 Spaces and 2 models. | No duplicate publication. Refresh mirrors only through the existing producer. |
| Kaggle | LIVE/DONE | The canonical living-board mirror is version 26 and updated today. | No new parallel dataset. |
| GitHub profile pins | DONE | GitHub GraphQL shows `councilof-ai` and `gspc-board` as the first two pinned repositories. | No pin change needed. |
| GitHub releases | DONE | Two public releases were published on 12 September. | Do not create a nominal “first release.” |
| Sitemap fix | PENDING REVIEW | PR #2344 is open with commit `104a58305a01f43ae2257f4ed226fe360784e75b`; generated-route truth checks pass. | Let CI and review finish; do not open another PR. |
| AI Agents Listing | SUBMITTED / REVIEW PENDING | Submission completed at `https://aiagentslisting.com/submit/council-of-ai-measurement-agent/success`; the intended detail URL is `https://aiagentslisting.com/agent/council-of-ai-measurement-agent`. | CSOAI logo uploaded; contact address supplied; promotional updates off. Do not call live until the public detail URL resolves without authentication. |

## Single highest-impact net-new public action — submitted

The canonical Council of AI Measurement Agent was submitted to **AI Agents Listing** once, using its existing A2A card and MCP endpoint:

- A2A card: `https://councilof.ai/.well-known/agent-card.json`
- A2A endpoint: `https://councilof.ai/api/a2a`
- MCP endpoint: `https://councilof.ai/mcp`
- Repository: `https://github.com/CSOAI-ORG/councilof-ai`
- Public verifier: `https://councilof.ai/gspc-verify`

Why this was the next action: every larger protocol-native directory checked was already live, duplicated or pending. AI Agents Listing spans both A2A agents and MCP servers and had no verified CSOAI presence before submission. One canonical entry adds a new discovery graph instead of another copy in an existing graph.

Proof threshold after action: `https://aiagentslisting.com/agent/council-of-ai-measurement-agent` must resolve without login and name Council of AI. The success URL proves submission only, so the state remains `SUBMITTED / REVIEW PENDING`.

Safe one-line description:

> Council of AI publishes a living AI measurement board and independently checkable signed evidence over A2A and MCP. Verification is free; measurement, not certification.

## Net-new placements — 14 September 2026, 12:35–12:38 BST

These placements were reconciled against the ledger and each target's current default branch before submission. They are **open editorial pull requests**, not live listings or endorsements.

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Awesome AI Agents 2026 | SUBMITTED / REVIEW PENDING | [PR #579](https://github.com/caramaschiHG/awesome-ai-agents-2026/pull/579) | Adds one factual entry under AI Governance and Compliance. |
| Awesome AI Agents Security | SUBMITTED / REVIEW PENDING | [PR #121](https://github.com/ProjectRecon/awesome-ai-agents-security/pull/121) | Adds the open-source GSPC under Guardrails and Compliance; explicitly says measurement, not certification. |
| Awesome AI Governance | SUBMITTED / REVIEW PENDING | [PR #10](https://github.com/EthanXiang777/awesome-ai-governance/pull/10) | Adds the repository under Audit and supply-chain integrity, describing signed cards, public roots and the offline verifier. |
| Awesome AI Agent Governance | ALREADY LIVE / RECONCILED | [existing default-branch entry](https://github.com/agentrust-io/awesome-ai-governance) | Already lists Council of AI — GSPC. Do not submit again. |

Do not count any open pull request as a live placement until the upstream repository merges it. Do not open duplicate pull requests while these remain open.

### Further verified submissions from parallel outward lanes

| Surface | Listing | State | Proof | Date | Note |
|---|---|---|---|---|---|
| OSS AI Hub | `CSOAI-ORG/councilof-ai` | SUBMITTED / RECEIVED | https://ossaihub.com/submit/ | 2026-09-14 | Form confirmed: “Received — it goes into the next review pass.” |
| MyFreeAISource | Council of AI GSPC | SUBMITTED / DRAFT SAVED | https://myfreeaisource.com/submit-ai-tool/ | 2026-09-14 | Form confirmed: “Thanks — your tool was saved as a draft for review.” |
| OSAI Ecosystem Components | Council of AI GSPC | SUBMITTED / OPEN ISSUE | [Issue #40](https://github.com/BioComputingUP/OSAI_ecosystem/issues/40) | 2026-09-14 | Structured Benchmarking submission; formal OSAI mapping left to curators. |

### Second GitHub editorial wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| E2B Awesome AI Agents | SUBMITTED / REVIEW PENDING | [PR #1571](https://github.com/e2b-dev/awesome-ai-agents/pull/1571) | Adds the live open-source measurement agent with links to its repository, verifier and A2A card. |
| Awesome AI Governance for regulated environments | SUBMITTED / REVIEW PENDING | [PR #10](https://github.com/Aperintelligence/awesome-ai-governance/pull/10) | Adds GSPC under open-source primitives; maintainer relationship disclosed. |
| Mindful CTO Awesome AI Governance | SUBMITTED / REVIEW PENDING | [PR #4](https://github.com/mindfulcto-labs/awesome-ai-governance/pull/4) | Adds GSPC under audit, observability and traceability; maintainer relationship disclosed. |

### Third GitHub editorial wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Awesome Responsible AI | SUBMITTED / REVIEW PENDING | [PR #82](https://github.com/AthenaCore/AwesomeResponsibleAI/pull/82) | Adds GSPC to Agent/AI Governance Frameworks with measurement-versus-certification wording. |
| Awesome GenAI Security | SUBMITTED / REVIEW PENDING | [PR #21](https://github.com/jassics/awesome-genai-security/pull/21) | Adds GSPC to Defensive/Scanning with signed evidence and offline verification described. |
| Awesome LLMOps | SUBMITTED / REVIEW PENDING | [PR #824](https://github.com/tensorchord/Awesome-LLMOps/pull/824) | Adds GSPC to Observability with the repository star badge and no certification claim. |
| Awesome MLOps | SUBMITTED / REVIEW PENDING | [PR #259](https://github.com/kelvins/awesome-mlops/pull/259) | Adds GSPC under Model Testing & Validation; maintainer relationship disclosed. |

### Protocol and open-source registry wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| OpenForK | SUBMITTED / ADMIN REVIEW | Submission accepted through the free `Save all (1)` flow after zero CSOAI search results | Canonical repository under Evaluation & Benchmarking. |
| Kiprio MCP Registry | SUBMITTED / WEEKLY VERIFICATION | Public catalogue count changed from 948 to 949 after accepting the canonical repository | Do not call live until a public CSOAI result is visible. |
| MCPub | REGISTERED / INDEX PENDING | MCPub returned `status: registered` for `https://councilof.ai/mcp` | Public search cache had not refreshed; do not count as live yet. |
| MCPizy | SUBMITTED / REVIEW PENDING | Free Standard queue reference `web_mu16ahuw_3dqac6` | Zero prior CSOAI results; no payment made. |
| MCPCMD | SUBMITTED / REVIEW PENDING | Submission confirmation stated 1–3 business-day review | Zero prior CSOAI results; canonical npm and documentation links supplied. |
| Collective AI Tools | NOT SUBMITTED / AUTH REQUIRED | Public submission redirected to login after a zero-result check | Candidate only; do not call pending. |
| A2A Registry | ALREADY REGISTERED / REFRESHED | The canonical agent card scan succeeded and `submit-and-claim` returned package `ai.councilof.council_of_ai__measurement_agent`, id `c8a9c98d-c4f7-409c-ba73-ca701229724c`, status `updated`, `refreshed: true` | Existing record refreshed; this is not a new placement. Do not resubmit. |

### Fourth GitHub editorial wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Awesome A2A Agents | SUBMITTED / REVIEW PENDING | [PR #24](https://github.com/isekOS/awesome-a2a-agents/pull/24) | Adds one factual Council of AI entry to the alphabetized Unclassified section. The description names the A2A-compatible measurement agent, 22-axis board, signed evidence, verifiable roots and free verifier; it says measurement, not certification, and discloses the maintainer relationship. |
| Awesome A2A Hub | SUBMITTED / REVIEW PENDING | [PR #14](https://github.com/questflowai/awesome-a2a-hub/pull/14) | Adds the live public A2A agent card and its declared version `1.1.0`; the description is limited to signed evidence, verifiable roots and the free verifier, with measurement-not-certification wording and maintainer disclosure. |
| Inference Gateway Awesome A2A | SUBMITTED / REVIEW PENDING | [PR #11](https://github.com/inference-gateway/awesome-a2a/pull/11) | Adds the live MIT-licensed agent under Development & Utilities, including its public A2A card. The entry uses restrained measurement-not-certification wording and discloses the maintainer relationship. |

The proof threshold remains strict: `SUBMITTED`, `REGISTERED`, `INDEX PENDING`, and an open pull request are not public placements. Only a stable public detail page or an upstream merge changes a row to `LIVE`.

### Fifth GitHub editorial wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Awesome AI Evaluations Tools | SUBMITTED / REVIEW PENDING | [PR #29](https://github.com/danielrosehill/Awesome-AI-Evaluations-Tools/pull/29) | Adds GSPC once under evaluation platforms, describing public model and agent measurements, signed cards, content-addressed roots and offline verification. The pull request is open and mergeable. |
| Awesome LLM Security | SUBMITTED / REVIEW PENDING | [PR #339](https://github.com/corca-ai/awesome-llm-security/pull/339) | Adds GSPC once under Tools with restrained signed-evidence and offline-verifier wording, explicitly saying measurement, not certification. The pull request is open and mergeable. |
| Awesome Agent Cortex | SUBMITTED / REVIEW PENDING | [PR #87](https://github.com/0xNyk/awesome-agent-cortex/pull/87) | Adds GSPC once under Agent Harnessing and Evaluation. The entry follows the repository's one-entry and alphabetical-order rules; the maintainer relationship and rubric score are disclosed in the pull request. The pull request is open and mergeable. |

### Sixth GitHub editorial wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Awesome AI Eval | SUBMITTED / REVIEW PENDING | [PR #34](https://github.com/Vvkmnn/awesome-ai-eval/pull/34) | Adds one badge-formatted GSPC entry under Application and Agent Harnesses. The description stays below the catalogue's length limit and names signed measurements, public roots and offline verification. The pull request is open and mergeable. |
| Awesome LLM Eval | SUBMITTED / REVIEW PENDING | [PR #93](https://github.com/onejune2018/Awesome-LLM-Eval/pull/93) | Adds one GSPC row to the evaluation Tools table, limited to public model and agent measurement, signed cards, content-addressed roots and offline verification. The pull request is open and mergeable. |
| Awesome AgentOps Landscape | SUBMITTED / REVIEW PENDING | [PR #29](https://github.com/dyronrh/awesome-agentops-landscape/pull/29) | Adds one open-source record to the catalogue's structured `data/tools.json` source. JSON validation and whitespace checks pass; the pull request is open and mergeable. |

### Historical submissions found during reconciliation

| Surface | State | Proof | Action |
|---|---|---|---|
| Awesome ML Model Governance | ALREADY SUBMITTED / REVIEW PENDING | [PR #13](https://github.com/visenger/Awesome-ML-Model-Governance/pull/13), opened 26 August 2026 | Do not submit again. Review or refresh the existing wording only if the upstream maintainer requests it. |
| Awesome AI Safety | ALREADY SUBMITTED / REVIEW PENDING | [PR #10](https://github.com/AbdelStark/awesome-ai-safety/pull/10), opened 7 September 2026 | Do not submit again. The existing pull request is open and mergeable. |

### Seventh GitHub editorial wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Awesome AI Testing | SUBMITTED / REVIEW PENDING | [PR #138](https://github.com/tugkanboz/awesome-ai-testing/pull/138) | Adds one free, open-source GSPC entry under LLM and AI System Testing. The catalogue's requested star action was completed; the pull request discloses the maintainer relationship and is open and mergeable. |
| Awesome MLSecOps | SUBMITTED / REVIEW PENDING | [PR #85](https://github.com/RiccardoBiosas/awesome-MLSecOps/pull/85) | Adds one GSPC row under Model Testing, Monitoring, and Evaluation, limited to signed model and agent safety measurements, public roots and offline verification. The required affiliation disclosure is present; the pull request is open and mergeable. |
| Awesome AI + GRC | SUBMITTED / REVIEW PENDING | [PR #21](https://github.com/ethanolivertroy/awesome-grc-ai/pull/21) | Adds one objective GSPC entry under Model Governance, pointing to the canonical MIT-licensed repository and its signed evidence, public roots and offline verification. The pull request is open and mergeable; automated review is pending. |

### Closed historical submissions found during reconciliation

| Surface | State | Proof | Action |
|---|---|---|---|
| GenAI Gurus Awesome EU AI Act | PREVIOUS SUBMISSIONS CLOSED | [PR #7](https://github.com/GenAI-Gurus/awesome-eu-ai-act/pull/7), [#33](https://github.com/GenAI-Gurus/awesome-eu-ai-act/pull/33), [#43](https://github.com/GenAI-Gurus/awesome-eu-ai-act/pull/43), [#45](https://github.com/GenAI-Gurus/awesome-eu-ai-act/pull/45) | Do not resubmit without an explicit invitation or a materially different, curator-requested resource. |
| Morgan RCU Awesome EU AI Act | PREVIOUS SUBMISSIONS CLOSED | [PR #19](https://github.com/morganrcu/awesome-eu-ai-act/pull/19), [#20](https://github.com/morganrcu/awesome-eu-ai-act/pull/20), [#43](https://github.com/morganrcu/awesome-eu-ai-act/pull/43) | Do not resubmit without an explicit invitation or a materially different, curator-requested resource. |

### Eighth open-source and evaluation wave

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| Open Source Observer OSS Directory | SUBMITTED / ADMIN VALIDATION PENDING | [PR #1251](https://github.com/opensource-observer/oss-directory/pull/1251) | Adds only the flagship `CSOAI-ORG/councilof-ai` repository and its canonical npm package. The upstream schema-v7 validation passed across 7,176 projects; the remaining `ACTION_REQUIRED` check explicitly requires an OSO administrator to run `/validate 6854dfe21`. |
| Awesome AI Benchmarks & Evaluation | SUBMITTED / REVIEW PENDING | [PR #38](https://github.com/brandonhimpfen/awesome-ai-benchmarks-evaluation/pull/38) | Adds one GSPC entry under Evaluation Frameworks with a factual description of public model and agent measurements, signed evidence cards, verifiable roots and offline verification. The pull request is open and mergeable. |
| Awesome Harness Engineering | SUBMITTED / REVIEW PENDING | [PR #257](https://github.com/ai-boost/awesome-harness-engineering/pull/257) | Adds GSPC once under Evals & Verification as a reference pattern for independently checkable evaluation outputs. The pull request is open and mergeable, and the maintainer relationship is disclosed. |

Eligibility checks prevented low-quality submissions in this wave: Awesome LLM Observability requires at least 250 GitHub stars for open-source projects, which the flagship does not currently meet; Awesome Agentic Commerce requires an end-to-end ACP, UCP or AP2 implementation or a foundational rail/tooling dependency, so a measurement service entry was not submitted. These remain `NOT SUBMITTED`, not pending placements.

### Owned GitHub evidence and citation wave

These first-party surfaces were created only after reconciling the canonical ledger, the repository settings, the default branch and the live endpoints. No copied board, card, tool or user counts appear in the new prose.

| Surface | State | Proof | Exact scope |
|---|---|---|---|
| GitHub Discussions | LIVE / ENABLED | Repository API returned `has_discussions: true` after the reversible setting change. | Enables a durable first-party venue for evidence verification and corrections without claiming endorsement. |
| Verification discussion | LIVE | [Discussion #2397](https://github.com/CSOAI-ORG/councilof-ai/discussions/2397) | Points to the live signed card index, signed public root, verification instructions and public verifier; tells readers to use live artifacts for current counts. |
| Integration discussion | LIVE | [Discussion #2398](https://github.com/CSOAI-ORG/councilof-ai/discussions/2398) | Records the canonical A2A card, A2A endpoint and MCP endpoint without freezing a tool count. |
| Discrepancy-reporting discussion | LIVE | [Discussion #2399](https://github.com/CSOAI-ORG/councilof-ai/discussions/2399) | Gives a public, reproducible correction intake template and explicitly excludes secrets and compliance conclusions. |
| Repository citation metadata | ALREADY LIVE / RECONCILED | [`CITATION.cff`](https://github.com/CSOAI-ORG/councilof-ai/blob/master/CITATION.cff) appeared on the default branch during this lane and declares DOI `10.5281/zenodo.21991104`. | Concurrent work already filled this gap. This lane did not overwrite it or create a duplicate citation file. Verify the DOI target separately before describing its contents. |

Do not create a nominal release solely to populate citation metadata.
