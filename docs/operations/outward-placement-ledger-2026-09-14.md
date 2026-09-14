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
| AI Agents Listing | NOT LISTED; NOT PENDING | Live homepage exposes 216 listings and a `/submit` route. Its rendered catalogue contained no `CSOAI` or `Council of AI` record. GitHub issue and PR searches found no CSOAI submission, and the only local item is a draft payload. | This is the single net-new public placement. |

## Single highest-impact net-new public action

Submit the canonical Council of AI Measurement Agent to **AI Agents Listing** once, using its existing A2A card and MCP endpoint:

- A2A card: `https://councilof.ai/.well-known/agent-card.json`
- A2A endpoint: `https://councilof.ai/api/a2a`
- MCP endpoint: `https://councilof.ai/mcp`
- Repository: `https://github.com/CSOAI-ORG/councilof-ai`
- Public verifier: `https://councilof.ai/gspc-verify`

Why this is the next action: every larger protocol-native directory checked is already live, duplicated or pending. AI Agents Listing spans both A2A agents and MCP servers, has a live submission route, displays 216 listings, and currently has no verified CSOAI presence. One canonical entry therefore adds a new discovery graph instead of adding another copy to an existing graph.

Proof threshold after action: a public detail URL under `aiagentslisting.com`, reachable without login and naming Council of AI, must exist. A completed form or confirmation screen is not enough.

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
