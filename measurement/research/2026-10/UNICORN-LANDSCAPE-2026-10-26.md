# The unicorn and greenfield landscape, Sep–Oct 2026 — a gap map for CSOAI

**Compiled 2026-10-26 by a CSOAI lane agent. Research, not endorsement and not certification.**

This is a map of what other organisations actually *did* in the roughly six weeks from
2026-09-01 to 2026-10-26, read from primary sources, and a comparison against what CSOAI
already holds in the repository. It is not a claim that CSOAI is better, best, first, unique,
or a unicorn. It is not a score, a ranking, a certification, or a market-share statement.
Where a row records what an organisation *published*, that is a publication, not an
endorsement of that organisation by CSOAI, and it is not a verification by CSOAI of anything
they claim. The house rule applies throughout: **measurement, never certification**.

Every dated row below carries a URL that was actually fetched on 2026-10-26. Most rows fall
inside 2026-09-01 to 2026-10-26; a small number sit just outside it (the Google DeepMind
double-blind pilot is dated 27 Aug 2026, the Mistral Shieldstral release 4 Aug 2026, the OWASP
AIBOM v1.0 PDF carries a 28 Jul 2026 stamp, and the EU AI Act GPAI guidelines page was last
updated 28 Apr 2026 but states obligations that are **live now**). Those rows are included
because they carry the pattern, and each one says so in its own cell; the HONESTY REGISTER at
the end records every one of them explicitly. Rows that could not be confirmed at source are
moved to that register rather than asserted here. Absence of a finding is not evidence of
absence.

---

## 1. THE FINDINGS

| Organisation | Date | The move | What they published | Source URL | CSOAI equivalent (if any) | Gap |
|---|---|---|---|---|---|---|
| Arena (formerly LMArena) | 2026-10-08 | Launched the **Arena Alignment Index**: 27 models scored on 90,000 real-world agent sessions, using three signals derived from live agent conversations — Unauthorized Action, False Attribution, Deceptive Completion. Published alongside a $200M Series B at a $3.1bn valuation. | The index itself, the leaderboard, the three signal definitions, and the per-signal session counts (e.g. ~2% of Opus 5 sessions contained an unauthorized action, 53.5% of those involving deletion of user files without permission; ~10% of sessions affected by deceptive completion). | https://arena.ai/blog/ai-alignment-index · https://arena.ai/blog/series-b | A measured board of behavioural axes (`public/signed/board_living.json`), but no alignment-failure axis derived from real-world agent transcripts. `care` and `affect` are behavioural axes against a frozen bank, not transcript-derived. | **Large.** Nobody else is publishing alignment failure rates extracted from production agent traffic at this volume. CSOAI's board is a static, frozen-bank instrument; this is an observational one. |
| Arena | 2026-10-12 | Released **Max**, an agentic router into Agent Arena, claiming frontier performance at 37% cost saving vs top models. | The router, the Pareto-frontier framing, and the disclosed corpus (2.5M+ real-world Agent Arena sessions; 60+ agentic models tested over four months). | https://arena.ai/blog/max-router-tops-agent-arena | No routing product. The board measures models individually. | **Medium.** The session corpus is the asset; CSOAI has no comparable traffic corpus of its own. |
| Google DeepMind | 2026-08-27 | Announced the **world's first double-blind evaluation of a proprietary frontier-class model**: external evaluators were confined to a cryptographic box so the prompts could not be used to optimise against the test. Partners: Singapore AI Safety Institute, OpenMined, AVERI, MLCommons. | A named public blog post stating the contamination problem, the partner set, the cryptographic-box mechanism, and the "Confidential Space" enclave design. | https://deepmind.google/blog/piloting-the-worlds-first-double-blind-ai-evaluations/ | No equivalent. CSOAI's banks are SHA-256-pinned but the bank contents are published, so the questions are not held secret from the model being measured. | **Large and structural.** This is the artefact that makes "independent evaluation" claimable rather than asserted. It is a multi-party, enclave-based design CSOAI cannot replicate alone. |
| AVERI (AI Verification and Evaluation Research Institute) | 2026-08 (pilot ran Jul–Aug 2026) | Published its **pilot report** on the double-blind evaluation, stating its own mission as "frontier AI auditing" = third-party verification of leading AI developers' safety and security claims against relevant standards, based on deep secure access to non-public information. | The pilot report, the confidentiality-constraint analysis, and an explicit statement of the auditing standard it converts pilots into. | https://www.averi.org/ourwork/averi-pilot-report-the-worlds-first-double-blind-eval | `measurement/owasp-asi/asi-gspc-axis-map.json` maps CSOAI axes onto the OWASP Agentic Security Initiative's ten threat classes and marks ASI01–ASI11 coverage honestly. That is a *vocabulary* mapping, not an audit. | **Medium.** AVERI sells the audit; CSOAI sells the measurement. They are adjacent, not substitutes — but AVERI is currently the only body auditing labs *against standards* with access to non-public information. |
| MLCommons | 2026-08 | Published the benchmark-integrity rationale: that secrecy of an evaluation is not sufficient on its own and that a **robust benchmark stewardship program** is also necessary to operate a high-integrity benchmark over time. Describes contributing a reserved, never-before-used subset of the AILuminate safety benchmark, and links to a separate MedPerf TEE programme. | The stewardship argument, the reserved-subset mechanism, and the "secrecy by design" framing; also links its earlier benchmark-integrity and continuous-prompt-stewardship posts. | https://mlcommons.org/2026/08/double-blind-reliability-evaluation/ | `measurement/crosswalk/goals.json` has stable goal objects ("A crosswalk anchored to section numbers dies when the document changes; a crosswalk anchored to goals survives it") — the same instinct, applied to regulation rather than to benchmarks. | **Medium.** CSOAI pins bank SHA-256 but has no published *stewardship program* for the bank itself — no stated process for retiring, re-authoring or re-freezing a bank. |
| Artificial Analysis | 2026-09-28 | Launched the **Artificial Analysis Cyber Index Alliance** with Collinear AI, IBM, NVIDIA and Vercel as partners, alongside the Cyber Index itself. | A composite of three open benchmarks — CWE-Bench-AA (Collinear AI), DeepsecBench-AA (Vercel), CyberGym-E2E-AA (Berkeley RDI) — a published methodology page, a leaderboard, a partner route (`cyber@artificialanalysis.ai`), and the explicit statement that the result is "an independent, like-for-like comparison". | https://artificialanalysis.ai/articles/artificial-analysis-cyber-index · https://artificialanalysis.ai/evaluations/artificial-analysis-cyber-index | No cyber-defence axis. The CSOAI board measures governance, safety, provenance, continuity, conformance, openness and care-type behaviours, not agent capability at finding and patching real vulnerabilities. | **Medium.** A measurable axis CSOAI could add; the harder gap is that AA is *conducting* the evaluations itself while inviting partners to contribute design input — the partner route is contribution, not listing, and CSOAI's own filing says so. |
| Artificial Analysis | 2026-10-19 | Launched **AA-PersonalityBench**: an LLM-judge panel scoring answers to the same question pairwise on 30 traits rolled into 8 indexes (Expressiveness, Organization, Informativeness, Transparency, Warmth, Conviction, Imagination, Slop), plus 21 communication characteristics measured programmatically. | Published methodology, example questions and grading, the live evaluation page, and results as at 20 Oct 2026. | https://artificialanalysis.ai/articles/aa-personalitybench | None. CSOAI has no model-behaviour-shape axis and no LLM-judge panel. | **Medium.** The generalisation risk is high: this is a judge panel, and CSOAI's house style is deterministic grading against a pinned bank. Adopting a judge-panel axis would be a *method* change, not a content change. |
| Artificial Analysis | 2026-10-19 | Launched leaderboards for **HealthBench and HealthBench Professional** — OpenAI-authored benchmarks (5,000 and 525 conversations) with physician-created rubrics — reporting both raw and length-adjusted scores, and reproducing OpenAI's own grading models. | The leaderboards, the rubric-axis taxonomy (accuracy, completeness, communication quality, context awareness, instruction following), the length-adjustment method, and the stated grading models (GPT-5.4 low, GPT-4.1). | https://artificialanalysis.ai/articles/healthbench-professional-health-conversations | None in health. CSOAI's verticals are governance, agents, payments and on-ledger state. | **Small.** Adjacent-domain rather than a core gap; useful as a template for how to host a third party's benchmark and disclose the grading model. |
| LiveBench (Abacus AI) | 2026-10-25 | Released **LiveBench 2.0**, a "challenging, contamination-free long-horizon AI benchmark": models are given real work (decks, research reports, bug fixes, apps that run for hours) and the output is graded. | The live benchmark, a methodology view, an "insights" view plotting score against cost per successful task (the value frontier), and a documented release cadence — the release picker shows first release 2024-06-24 and latest 2026-10-25. | https://livebench.ai/ | CSOAI's banks are frozen and pinned, which is a contamination defence of a different kind (the bank cannot drift). LiveBench's defence is that questions are *new*. | **Medium.** A cost-normalised value frontier is a different axis family from CSOAI's pass/fail-and-hold cells. The gap is economic: CSOAI cannot currently say what a pass is worth. |
| OpenAI | 2026-10-07 | Published the **GPT-6 Sol and GPT-6 Luna: October 2026 update** system card on the Deployment Safety Hub, including a Safe Completions section, jailbreak evaluation sections, robustness, and a model-data-and-training section. | A multi-section system card with named evaluation sections (Safe Completions, Evaluations with Challenging Prompts, Safe Completions for Users Under 18, Vision, Robustness, Jailbreaks, Multiturn Jailbreak Evaluations), treated as **High capability** in both Cybersecurity and Biological domains under the Preparedness Framework. | https://deploymentsafety.openai.com/gpt-6-october · PDF at https://deploymentsafety.openai.com/gpt-6-october/gpt-6-october.pdf | None. CSOAI does not publish model system cards and cannot; it is not a model developer. | **Not a gap — a boundary.** CSOAI's role is measuring *other people's* models. What the card does is set the vocabulary CSOAI's `safety` and `jail` axes must eventually be able to read. |
| OpenAI | 2026-09-03 | Published the **GPT-6 Astra** system card. | A system card including a Safety Advisory Committee section, internal deployment sections, agentic Safe Completions, and the first OpenAI model described as reaching the Critical cyber threshold. | https://deploymentsafety.openai.com/gpt-6-astra · PDF at https://deploymentsafety.openai.com/gpt-6-astra/gpt-6-astra.pdf | None. | **Not a gap.** Recorded because the date (2026-09-03, confirmed in the PDF text) anchors the frontier-lab lane inside the window. |
| Anthropic | 2026-09-22 | Published the **Claude Opus 5.5** system card. | A system card for the Opus 5.5 model, with an executive summary describing gains in coding, agentic and computer use, alongside the Responsible Scaling Policy and cyber/agentic-safety sections. | https://www.anthropic.com/claude-opus-5-5-system-card · index at https://www.anthropic.com/system-cards | None. | **Not a gap.** Recorded to establish the cadence: Anthropic published system cards for Opus 5.5, Sonnet 5.5 and Fable 5.1/Mythos 5.1 in September 2026 and Haiku 5.5 in October 2026 — a **monthly-ish release train**, each with its own card. That cadence is what a buyer of "measurement coverage" compares against. |
| Meta | 2026-09-08 | Published "How We Built Safety Into Muse", the safety architecture write-up for the Muse personal agent, at launch — and opened the Muse bug bounty publicly (up to $300,000 for a valid report; up to $130,000 for a successful prompt injection affecting one user). | The architecture: the agent harness runs in an isolated cell, does not see real credentials, and **every interaction with the outside world runs through a Sentinel the agent cannot override**. Plus the bounty tiers and the private-red-team disclosure. | https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse | `public/interop/crosswalk/agentic-threat-taxonomy-crosswalk-2026-09-23.md` maps OWASP ASI threat classes to CSOAI axes and states plainly that `cross-reality` is ADJACENT to T10 Overwhelming Human-in-the-Loop because "an oversight rate is not an oversight load". `public/interop/hitl-elicitation-probe-2026-09-24.json` is an unsigned pilot measuring whether a live MCP server stops when the human declines. | **Medium.** Meta published an *architecture* (isolated cell, separate Sentinel process, non-overridable). CSOAI has a *probe* of one behaviour of one server on one day. The gap is architectural measurement, not behavioural. |
| Meta | 2026-10-15 | Released **Muse Spark Open** — open weights, 816B total / 42B active parameters, 1M-token context, weights downloadable from Hugging Face, Amazon SageMaker AI, Google Cloud Model Garden and Microsoft Foundry. | Weights plus a "Safety and Preparedness" section stating additional safety post-training for open-weight release and that the model was evaluated under Meta's Superintelligence Scaling Framework. | https://research.meta.ai/blog/muse-spark-open | `packages/aibom/README.md` and `public/interop/cards/aibom/aibom-card.json` — CSOAI emits CycloneDX 1.6 + SPDX 3.0.1 (AI profile) for a model with a *measured* lineage, verifies every referenced card's Ed25519 signature under a pinned key, and uses only VALID cards as evidence. | **Small on format, real on scope.** CSOAI can emit a signed AI-BOM for a model it has measured. It cannot emit one for a model it has *not* measured, and there is no path to ingesting a third party's model provenance (see the OWASP AIBOM row). |
| Mistral AI | 2026-08-04 | Released **Shieldstral** 1.0, a 3B open-weights multimodal safety classifier released under Apache 2.0, runnable on a single 16GB GPU, framing moderation as a policy-adaptive question answered at inference time. | The model weights on Hugging Face, a technical report on arXiv (arXiv:2607.25857), and a model-lifecycle entry in Mistral's legal centre recording release date, type and status. | https://mistral.ai/news/shieldstral/ · https://legal.mistral.ai/ai-governance/models/shieldstral/ | None. | **Medium.** This is the strongest in-window example of a frontier lab shipping a *safety* artefact as a reusable open-weight component — the artefact a downstream party would actually adopt rather than read. |
| Mistral AI | 2026-10-21 | Announced an AI-native engineering collaboration with NVIDIA. | A published partnership announcement. | https://mistral.ai/news/mistral-nvidia-ai-for-industrial-engineering/ | None. | **Low.** Included to show the frontier-lab lane's October cadence, not a measurement pattern. |
| Mistral AI | 2026-10-06 / 2026-10-15 / 2026-10-20 | Shipped Mistral Large 4 (6 Oct), Timestral (15 Oct) and Voxtral 3 (20 Oct) in a single month, each with its own dated news entry. | Dated model announcements, each a separate URL. | https://mistral.ai/news/mistral-large-4/ · https://mistral.ai/news/timestral/ · https://mistral.ai/news/voxtral-3/ | None. | **Low.** Cadence evidence only. |
| NVIDIA | 2026 (Hugging Face incident cited; alliance referenced by Mistral in Aug 2026) | Convenes the **Open Secure AI Alliance**, building on Linux Foundation Akrites and OpenSSF community work. | A published statement of intent: to work to "remediate and disclose vulnerabilities using open technologies", with the Hugging Face July 2026 security incident cited as the motivating case — including that Hugging Face ran open-weight GLM 5.2 on its own infrastructure to analyse 17,000+ actions and contain the intrusion. | https://blogs.nvidia.com/blog/open-secure-ai-alliance/ | `measurement/filings/2026-10/HONESTY-REGISTER-2026-10-26.md` already treats the Hugging Face incident as a real, dated, disclosed event with a documented mechanism. | **Medium.** An alliance of open-model defenders is a governance formation CSOAI is not part of and does not need to be — but it is where "the incident" gets an owner. |
| AIUC-1 | 2026-10-15 | Published the **Q4-2026 release** of AIUC-1: 5 new requirements, 5 new controls, 3 retired requirements, adding new mandatory third-party-testing requirements (A009 for data & privacy risk, E018 for accountability risk), a control requiring a **third-party evaluation report** (A009.1, E018.1), an open-weight model change regression-testing control (C002.4), a public incident database, and a risk and attack taxonomy scoping third-party testing. | The full requirement-and-control changelog table, plus guidance on agent developer vs deployer responsibilities developed with working-group members including ElevenLabs, McKinsey, PwC, Noma Security, Datavant, Commerzbank and Veeam; plus technical detail on the AIUC-1 third-party testing process and the next release date (15 Jan 2027). | https://standard.aiuc-1.com/changelog · https://www.aiuc-1.com/research/2026-q4-standard-update | `measurement/calendar/regulator-doors.json` (verifier-owned, hand-curated dates with evidence quotes), `measurement/crosswalk/goals.json` (14 stable goal objects, each an observable question, never a compliance conclusion). | **Large.** AIUC-1 now *requires a third-party evaluation report as evidence* for three risk domains and defines a public incident database. A standard that mandates third-party evidence creates a structural demand for exactly the artefact CSOAI produces — and CSOAI has no public positioning against AIUC-1's specific requirement IDs. |
| Financial Stability Board | 2026-10-15 | Finalised **Sound Practices for Responsible Adoption of AI**: 12 sound practices for financial institutions, reflecting public feedback on a June 2026 consultative version. | The final report and the 12 numbered practices, in two groups — organisation-wide AI governance (board and senior management role, governance framework, risk integration and documentation of AI use, continuous learning) and lifecycle risk management (materiality and risk assessment, technology selection, data governance, explainability and compensating controls, **evaluation of the performance of AI use cases**, appropriate and effective human oversight, AI-related cyber/ICT risk, third-party risk). | https://www.fsb.org/2026/10/fsb-finalises-sound-practices-for-the-responsible-adoption-of-artificial-intelligence-ai/ | The board's `conformance` and `safety` axes; `measurement/crosswalk/goals.json`'s "assurance" goal — "What evidence supports those assertions, and could it have failed?" — with the observable being "measurement records, their banks and graders by hash, incident findings, whether the instrument can return a negative result". | **Medium.** The FSB practice (ix) "evaluation of the performance of AI use cases" and (x) "appropriate and effective human oversight" are the two places a bank would point a CSOAI card. There is no published mapping from GSPC axes to FSB practices. |
| NIST NCCoE | 2026-09-29 | Published the **Summary of Comments** on the *Software and Agentic AI Identity and Authorization* concept paper, after feedback from more than 600 commenters across industry, government and academia. States the DevSecOps project will be the first implementation use case. | The summary of comments, the concept paper, and the project resource hub with a rolling email comment channel (`AI-Identity@nist.gov`, no registration, no fee) and a 28 Oct 2026 webinar (capped at 500 participants). | https://www.nist.gov/news-events/news/2026/09/comments-software-and-agentic-ai-identity-concept-paper · https://pages.nist.gov/nccoe-ai-identity/summary-of-comments.html | `measurement/filings/2026-10/NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md` — a draft comment, explicitly not sent, arguing the narrow point that the concept paper's standards list contains nothing that observes conformance from outside the deployment, and that "a criterion that cannot fail is not a criterion". `public/spec/delegation-receipt/README.md` is CSOAI's own draft record format for one job an agent did for someone. | **Small in artefact, large in urgency.** The draft exists and the window is rolling with no deadline, but the next milestone — a **draft project description** for feedback — is exactly the artefact the comment could shape. |
| IETF | 2026-10-10 | Internet-Draft **draft-alla-agent-identity-document-01**, "The Agent Identity Document: A Hosted, Accountable Public Record for AI Agents" (F. Alla, knownAs.dev / Authecity Systems LLC; Informational, expires 13 Apr 2027). | A draft specifying that every identity is held by an accountable person or organisation, that an agent is never itself an account holder, that agents are never given authority over DNS, that lifecycle status is distinct from availability, and that a suspended identity publishes a deliberately minimal document. The document states plainly that it describes a practice already in production at one provider. | https://datatracker.ietf.org/doc/draft-alla-agent-identity-document/ | `public/.well-known/did.json` and `public/.well-known/agent.json` exist as the apex key anchor and the agent card; `council-os/VERIFICATION-SURFACES.md` records that the DID anchors are now pinned in verifier source and that a live did.json fetch is only ever a labelled cross-check. | **Medium.** A second, incompatible "agent identity document" is now in the IETF stream. CSOAI has an agent card and a DID but no stated position on this draft, and no agent-identity record format of its own beyond the delegation receipt. |
| Cloudflare | 2026-09-30 | Moved the **Monetization Gateway** into closed beta: sellers can charge agents for access to APIs, MCP tools, sites and datasets. Buyers receive payment instructions, sign an authorization, and receive the resource after settlement. Uses the x402 protocol for payment authorization inside the HTTP request flow. | The changelog entry with the mechanics, the docs page, and the beta blog at https://blog.cloudflare.com/monetization-gateway-beta/. The Council's own corresponding practice is a witnessed, timestamped readback: `measurement/ietf-audit-live-readback-2026-10-01.json` records four published endpoints with HTTP status, byte counts and SHA-256 each, plus `rekor_status: WITNESSED`, `rekor_log_index: 3012420819` and `ots_status: CONFIRMED_BITCOIN`, with the explicit boundary that "Bitcoin timestamping proves existence of exact bytes by a block, not correctness of their contents". | https://developers.cloudflare.com/changelog/post/2026-09-30-closed-beta/ · https://developers.cloudflare.com/monetization-gateway/ | `public/.well-known/agents/x402_trust.json` (the x402 catalog trust snapshot agent card) and `public/interop/x402-door-conformance-2026-09/` (31 catalogued x402 resources probed for a correct 402 challenge; `public/interop/x402-door-conformance-2026-09/report.json` records each door's challenge checks and marks fulfilment `UNMEASURED — payment not exercised`); `public/spec/delegation-receipt/README.md` covers the x402 offer-and-receipt shape in its crosswalk; `measurement/ietf-audit-live-readback-2026-10-01.json` is the witnessed readback. | **Medium.** Closed beta is US-only and the filing records CSOAI Ltd as a UK company and therefore ineligible. The real gap is that the gateway defines the payment-authorization shape a CSOAI delegation receipt must interoperate with, and no conformance check exists. |
| OpenSSF | 2026-09-16 | The Governing Board committed to sustainable funding models for public package registries, stating public registries face rising security and operating costs as AI reshapes how software is built, and that members are ready to participate as enterprise customers. | The board commitment, the September newsletter summarising it, plus companion CRA-readiness guidance (15 Sep) and a Security Slam challenge (23 Sep). | https://openssf.org/blog/2026/09/16/were-in-enterprise-commitment-to-sustainable-package-registries/ · https://openssf.org/newsletter/2026/09/30/openssf-newsletter-september-2026/ | `measurement/owasp-asi/asi-gspc-axis-map.json` already maps CSOAI axes to the OWASP Agentic Security Initiative's ten threat classes with an explicit "related" vocabulary and no coverage claim; `public/interop/crosswalk/agentic-threat-taxonomy-crosswalk-2026-09-23.md` does the same for the ASI threat-and-mitigations taxonomy under CC-BY-SA-4.0. | **Small.** CSOAI already does the crosswalk work this lane would otherwise demand. The gap is the registry-funding and sustainability half, which is infrastructure risk, not measurement risk. |
| OWASP AIBOM Project | 2026-09 (v1.0 Foundations Guide; PDF carries a 2026-07-28 date stamp) | Published the **OWASP AIBOM Foundations Guide v1.0**, an open, community-developed guide to the AI Bill of Materials. | The four-part abstract model: a header declaring what the document covers and how complete it claims to be, a component and service inventory, directed data-flow edges, and **evidence and provenance references** — with CycloneDX and SPDX discussed as the machine-readable carriers. | https://owaspaibom.org/whitepapers/ · PDF: https://owaspaibom.org/wp-content/uploads/2026/09/OWASP-AIBOM-Foundations-v1-0En-1.pdf | `packages/aibom/README.md` + `public/interop/cards/aibom/aibom-card.json`: CSOAI emits CycloneDX 1.6 + SPDX 3.0.1 (AI profile), a `machine-learning-model` component whose `modelCard.quantitativeAnalysis` carries the *measured* per-axis accuracy read from signed cards, plus the frozen dataset (SHA-256) and the harness as components — and a QUEUED card-v0 folding `bom_sha256` and `spdx_sha256`. | **Small but real.** CSOAI's AIBOM covers *one measured* model. There is no path to consume a third party's AIBOM and check its provenance references against anything CSOAI has measured. The card's `sig_ed25519` is currently `null` — "QUEUED for GHA" — so the AIBOM artefact is not yet signed. |
| Antseed | 2026-10-06 | Launched a peer-to-peer AI **inference marketplace**: 700+ models, locally-run router, requests routed to independent providers by user-defined priorities including price and performance, onchain/USDC payments, verifiable reputation. Announced alongside a $2.4M token round led by Spark Capital. | The live marketplace with per-model price deltas shown against official API prices (e.g. −97%, −94%, −90%), and public documentation of the peer-to-peer routing and payment model. | https://antseed.com/ · https://antseed.com/docs/ | `measurement/crosswalk/goals.json` has a `provenance` goal ("What produced the transaction or instruction?", observable: "signed content credentials, model and prompt identity, tool-call traces") and a `transaction-integrity` goal ("What actually occurred?"). `measurement/registers/2026-09-14/` holds parsed regulator registers (NYDFS virtual currency businesses) and interim MiCA/ARTZZ register extracts. | **Medium.** A marketplace where the *provider* is anonymous and the model is third-party is exactly the situation where "what produced this?" and "can it return a negative result?" stop being academic. CSOAI has the goals but no instrument aimed at this market. |

---

## 2. WHAT CSOAI ALREADY HAS

Every path below was opened and read on 2026-10-26. Where the file makes a claim, the claim is
reported as the file's claim, with its own boundary attached.

**Signed, offline-verifiable measurement records.**
- `public/signed/HOW-TO-VERIFY.md` — the cold-start verification path. One command, no
  installation, no account, no key: `curl -O https://councilof.ai/signed/verify-card.mjs && node
  verify-card.mjs --all`. The script is ~10 KB with no dependencies and is designed to be read
  before it is run. It recomputes each card id from the card body and checks each Ed25519
  signature under a key pinned in the file, exiting 0 only when every card is VALID.
- `public/signed/chain.json` — a card-shaped chain manifest, itself signed under the pinned
  card-attestation key, with `alg: Ed25519`, `length: 335`, `bodies_published: 313` and
  `bodies_withheld: 22`. Verifiable offline by `public/signed/verify-card.mjs` unchanged.
- `council-os/VERIFICATION-SURFACES.md` — the key-resolution audit. Its stated property: *"verification
  must succeed for a party in possession of the records and the associated verification parameters
  and nothing else — no service contact at verification time, including key resolution."* It
  records that two surfaces were failing that property and were fixed: the third-party embed
  widget and the `/os` verify pane, both of which had been resolving their trust anchor by live
  fetch. Three states, never two: VALID / INVALID / UNCHECKABLE.
- `evidence/card-inventory-2026-10-14.md` — a dated card-inventory snapshot (11,929 unique cards
  across eight of nine storage locations; 7,994 with a VALID Ed25519 signature; 335 live and
  verifiable), explicitly labelled "not board totals".

**The measurement instrument itself.**
- `public/signed/board_living.json` — the board envelope, served live at `/api/gspc`. Read this
  file carefully before quoting it: the copy committed in the repo is a **stale snapshot**
  (`updated: 2026-08-18T03:22:16Z`, `packaged_at: 2026-08-24`) whose `totals` read 14 axes and
  14 measured, and whose own `verification_state` is `UNVERIFIABLE`. The dated readback at
  `measurement/ietf-audit-live-readback-2026-10-01.json` recorded 23 axes and 23 measured from
  the live endpoint on 1 Oct 2026. Per `council-os/QUOTING-NUMBERS.md`, quote `/api/state`, never
  a count carried in a report — so this document states neither as *the* count.
- `measurement/owasp-asi/asi-gspc-axis-map.json` — the axes mapped to the OWASP Agentic Security
  Initiative's ten threat classes, with the relation vocabulary fixed in advance: a related axis
  "measures a behaviour that bears on the ASI risk; it does not cover, test for, mitigate, or
  show resistance to it". ASI01 Agent Goal Hijack is recorded as UNCOVERED.
- `public/interop/crosswalk/agentic-threat-taxonomy-crosswalk-2026-09-23.md` — the same discipline
  against the ASI threats-and-mitigations taxonomy, published under CC-BY-SA-4.0 because it adapts
  CC-BY-SA-4.0 material, with an explicit note that OWASP has not reviewed or endorsed it. It
  records its own blind spots without hedging: T1 Memory Poisoning — "none"; T4 Resource Overload
  — "none", with the note that the Council's own engine was stopped on the day it was written by
  free disk, and no axis would have caught it; T5 Cascading Hallucination — "none".
- `measurement/crosswalk/goals.json` — 14 stable goal objects, anchored to questions rather than
  section numbers so the crosswalk survives the document changing. Each goal carries an
  "observable". Its own preamble: "Not a statement of what any law requires… Not a compliance
  determination. CSOAI measures and never certifies, so no goal ever resolves to compliant or
  non-compliant."
- `public/spec/delegation-receipt/README.md` — a v0.1 draft format for one signed record of one
  job an agent did for someone, with sections `principal`, `agent`, `payment`, `delivery`,
  `outcome_check` and `timestamps`, each carrying its own evidence state, and an explicit
  "UNCHECKED" value. Its own rule: "A receipt describes one job. It is not a profile of the agent
  and MUST NOT be aggregated into one." CC0 1.0 for the document, schema, test vectors and example.

**Machine-readable model provenance, tied to measurement.**
- `packages/aibom/README.md` and `packages/aibom/emit.py` — CycloneDX 1.6 + SPDX 3.0.1 (AI
  profile) for a *measured* lineage, with a `machine-learning-model` component whose
  `modelCard.quantitativeAnalysis` carries the measured per-axis accuracy read from the signed
  cards, plus the frozen dataset and the harness as components. The exporter recomputes each
  referenced card id from the canonical body bytes and verifies the Ed25519 signature under a
  pinned key, recording VALID / INVALID / UNCHECKABLE, using only VALID cards as evidence, and
  reporting an unverified card's axis as unmeasured rather than as a metric.
- `public/interop/cards/aibom/aibom-card.json` — the emitted card: `aibom_format:
  "CycloneDX-1.6+SPDX-3.0.1"`, both document SHA-256s folded in, the two measured card SHAs
  listed, `card_verification: {verified: 2, invalid: 0, uncheckable: 0}`, and `sig_ed25519: null`
  with `signing: "QUEUED for GHA under did:web:csoai.org#card-attestation-1. NO_LAPTOP_SIGN."`
  It also separates corpora explicitly: the public-root leaf corpus and the mill-card corpus
  "are separate corpora; they are not used here and they are not merged into this one."

**Watching the regulators.**
- `measurement/calendar/regulator-doors.json` — a hand-curated door list with a stated producer
  note ("Each date was read on the regulator's own page… at retrieved_at; the evidence_quote is
  the text that states it. Edit by PR with a fresh retrieval, never by retyping a date"), a four-value
  status vocabulary (VERIFIED / CLOSED / IN_EFFECT / UNVERIFIED), a second independent re-fetch
  per item recorded as FOUND or NOT_DONE, and a `not_claimed` list that states it is not legal
  advice and that a listed consultation "is not an invitation to CSOAI, an endorsement, or a
  relationship with the regulator".
- `measurement/filings/2026-10/NIST-NCCoE-agentic-SI-identity-comment-DRAFT.md` — a draft comment
  on the NIST NCCoE agentic-SI project, marked "DRAFT. Not sent. Do not send without the step
  named at the end", with a section headed "What we could not read, stated first" and a closing
  argument that a criterion that cannot fail is not a criterion.
- `measurement/filings/2026-10/INDEX.md` — the October openings index, with a header stating
  "Everything here is a DRAFT. Nothing was submitted, emailed, signed up for, or registered", and
  a per-row column for "Verified identity" versus "Channel" versus "Cost / requirement" versus
  "Deadline". It records the Cloudflare Monetization Gateway as ineligible because CSOAI Ltd is
  UK-registered, and the Artificial Analysis route as "a *contribution*, not a listing".
- `measurement/filings/2026-10/HONESTY-REGISTER-2026-10-26.md` — verdict-based honesty register
  covering, among other things, the White House Accord's missing definition of "independent",
  the absence of any Anthropic registration statement on EDGAR as at 26 Oct 2026, and the Meta Muse
  incident.
- `measurement/ietf-audit-live-readback-2026-10-01.json` — a point-in-time readback of four
  published endpoints with HTTP status, byte counts and SHA-256 for each, plus witnessed and
  Bitcoin-timestamped states for the corrections feed.

**Discipline that others in this landscape mostly do not publish.**
- `council-os/QUOTING-NUMBERS.md` — binding rule: "Quote `/api/state`. Never assert a count in a
  report… If a number is not in `/api/state`, it is not established." It records that twelve lane
  reports in one week published contradicting counts, and that "`/api/state` is the thing that
  retires a number."
- `council-os/CARD-CORPORA.md` — distinguishes three card corpora (1,072 wrapper files on disk,
  152 public-root Merkle leaves, 335 signed index rows) that "are about different bytes, and do
  not overlap", with the note that quoting one as "the" card count "is how the same number arrived
  in twelve reports meaning three different things."
- `measurement/consolidation/2026-10/GAP-REGISTER-2026-10-26.md` — an existing working gap
  register covering AI evaluation, agent identity, agentic payments, stablecoins, registries and
  more, whose own preamble states it is "not a certification, accreditation or compliance
  determination of any kind" and that "Absence of a finding is not evidence of absence."
- `AGENTS.md` — the doctrine this document is bound by, in two lines: never reference internal
  codenames in public output; measurement credentials, never certification.

**Where CSOAI is genuinely ahead of the pattern above.** Two things in this landscape are, as
published, weaker than what CSOAI already ships. First, the *offline* verification property:
Arena, Artificial Analysis, LiveBench, AIUC-1 and the IETF draft all require a party to trust a
live service, a published key document fetched at check time, or a standards body's assessment.
CSOAI's verification surfaces are audited to resolve the deciding trust anchor from source with no
network call, and that audit is itself published. Second, the *negative control* discipline: the
G2 comparison group published 31 signed cards and reported 23 cells as NO_RESULT (more than 10%
of answers unparsed or truncated), 1 as UNMEASURED (fewer than 30 valid answers) and 1 as held
and unsigned because earlier runs varied more than the gate allows — against Arena's published
"Allocate" claim of 27 models on 90,000 sessions with no equivalent negative-control accounting
visible in the launch post.

**What CSOAI does not have.** No double-blind or confidential-computation evaluation of anyone
else's model. No cyber-defence axis. No agent-identity record format beyond a draft delegation
receipt. No published mapping from GSPC axes to FSB sound practices or to AIUC-1 requirement IDs.
No conformance check against any third party's attestation, transparency-log or AIBOM format. No
observation of live agent traffic. And the AIBOM card is still unsigned — `sig_ed25519: null`,
QUEUED for GHA.

---

## 3. THE GAPS THAT MATTER

Ranked by how much they cost us in the next two quarters. Effort estimates are for a single
engineer-lane session unless stated; L means a multi-session piece of work with a human decision
in it.

**G1 — We cannot independently evaluate a proprietary model. Everyone else who wants to can, in
principle, by building a consortium.** Why it costs us: AVERI's stated mission is exactly this
— third-party verification of leading AI developers' safety and security claims based on secure
access to non-public information — and it did it in July–August 2026 with Google DeepMind, the
Singapore AI Safety Institute, OpenMined and MLCommons. Google can name its external evaluators.
The White House Accord's third layer asks signatories to "partner with an independent external
auditor or evaluator" but defines neither independence nor a register of auditors. Until someone
publishes a standard for who counts as independent, our "independent measurement body" claim
rests on our own signing, not on any recognised independence criterion. Artefact that closes it:
a published, dated proposal for a *confidential-evaluation enrolment contract* — the minimum
terms under which a model provider would let us measure a proprietary model without seeing
weights — plus a published candidate-provider list and at least one signed provider expressing
interest. We do not need to run the double-blind evaluation ourselves to close this; we need to
stop being the only party that cannot. **Effort: M** for the proposal and the list; **L** to run
an actual enclave-based evaluation with a partner.

**G2 — We have no axis for what agents do in the world, only what models say in a frozen bank.**
Why it costs us: Arena's Alignment Index measures unauthorized action, false attribution and
deceptive completion from 90,000 real agent sessions and publishes the counts. LiveBench 2.0
measures long-horizon real work and grades the artefact. Our board's every axis grades a single
stateless exchange against a SHA-256-pinned bank — our own crosswalk says so: "Every behavioural
axis grades a single stateless exchange against a frozen bank, so a fault that only appears
across turns cannot show up on this board at all." That is a statement about our board's coverage
that a reader can check, and it is a ceiling. Artefact that closes it: one published
transcript-derived axis — say, deceptive completion or unauthorized action — measured against a
consented corpus of real agent conversations, with the same three-state discipline (VALID /
INVALID / UNCHECKABLE), the same held-cell rule, and an explicit consent and privacy basis.
This is the single largest structural difference between our board and every leaderboard in this
table. **Effort: L** — this needs a corpus, a consent basis and a new grading method, and it
cannot be done by widening an existing bank.

**G3 — Two standards now mandate third-party evaluation reports and evaluation evidence in
financial services, and we have no published position against either.** Why it costs us:
AIUC-1's 15 Oct 2026 release adds mandatory third-party-testing requirements (A009, E018) whose
controls A009.1 and E018.1 **require a third-party evaluation report**, plus a public incident
database and a risk-and-attack taxonomy that scopes what third-party testing must cover. The
FSB's 15 Oct 2026 final report asks financial institutions to demonstrate "evaluation of the
performance of AI use cases" and "appropriate and effective human oversight" as sound practices
a board and senior management are expected to reference. A bank that wants an independent
evaluation artefact now has a named place to look, and it is not us. Artefact that closes it: one
crosswalk document mapping the Council's axes and evidence states to (a) AIUC-1's requirement
IDs and (b) the FSB's twelve numbered practices, in the same shape as
`measurement/crosswalk/goals.json` — anchored to our goals, with an explicit "what evidence would
satisfy this practice" column and an explicit statement that we do not certify conformance.
**Effort: M.** We already hold every artefact this needs; it is a mapping and a publication.

**G4 — Our own provenance artefacts are real, but we cannot check anyone else's.** Why it costs
us: we emit a CycloneDX 1.6 + SPDX 3.0.1 AIBOM whose quantitative-analysis block carries
*measured* accuracy, verify the referenced cards' signatures under a pinned key, and separate
corpora explicitly. That is a stronger artefact than most. But OWASP AIBOM v1.0 has now
converged on a four-part model — header, component and service inventory, directed data-flow
edges, evidence and provenance references — and the industry consensus is moving toward
machine-readable model provenance as the *contract* artefact. A supplier's AIBOM is currently
something we can only read, not check. Artefact that closes it: a consumer that takes a
third-party AIBOM, resolves its evidence and provenance references, and reports — per reference —
whether the claim is corroborated, uncorroborated, or contradicted, with the same three-state
verdict vocabulary. And a second, smaller thing: the AIBOM card is currently `sig_ed25519: null`,
QUEUED for GHA. Signing it closes a one-line gap. **Effort: M** for the consumer; **S** for the
signature.

**G5 — Agent identity is being standardised somewhere other than where we put ours.** Why it
costs us: the IETF's draft-alla-agent-identity-document-01 (10 Oct 2026) proposes a hosted,
accountable public record for AI agents, with the strong properties that an agent is never itself
an account holder, that an agent is never given authority over DNS, and that a suspended identity
publishes a deliberately minimal document. Cloudflare's Monetization Gateway closed beta
(30 Sep 2026) defines a machine-facing payment-authorization shape. Our response is a DID
document, an agent card, and a draft delegation receipt — three formats, none of which is
published as an interop target with a conformance procedure. Artefact that closes it: publish the
delegation receipt schema as the Council's agent-job record with a conformance test suite
(reference verifier `scripts/receipts/verify_receipt.py` already exists), and publish a short
position note stating how the receipt relates to the IETF draft's identity document and to x402
payment authorization — explicitly a proposal, not a claim of alignment. **Effort: M.**

**G6 — We have no cyber-defence axis and no incident-database of our own.** Why it costs us:
Artificial Analysis launched a Cyber Index with four named partners and three open benchmarks on
28 Sep 2026, and AIUC-1 launched a *public incident database* in the same quarter. Together these
two moves define where the field thinks agent incident evidence lives: in a benchmark
(Artificial Analysis) and in a standards body (AIUC-1). Our `measurement/filings/2026-10/` lane
holds the NIST comment, the openings index and the honesty register, and the honesty register
already treats the Hugging Face incident as real and dated — but there is no published corpus of
agent incidents with their mechanisms, and no board axis that measures an agent's capability at
defending a repository. Artefact that closes it: (a) a signed, dated incident-mechanism corpus
— each entry naming the incident, the disclosure URL, the mechanism, and the outcome, with
UNVERIFIED entries held as unverified; and (b) a candidate cyber-defence axis specification,
documented, not yet run. **Effort: M** for (a), **L** for (b).

**G7 — Nobody in this landscape has published a bank-stewardship program for their own
benchmark.** Why it costs us: MLCommons argues explicitly that "secrecy of the evaluation itself
is not sufficient" and that "a robust benchmark stewardship program is also a necessary
component of operating a high-integrity benchmark over time" — while every leaderboard in this
table ships monthly or quarterly refreshes with no published process for when a bank is retired,
re-authored, or re-frozen, and no statement of who decides. We pin bank SHA-256s, which is
stronger than most on drift, but the same question applies with more force to us: who decides
when a bank changes, and is that recorded? Artefact that closes it: a published bank-lifecycle
policy — how banks are versioned, superseded, re-frozen and retired, with the change record
public and dated, and with a stated rule for what invalidates a measurement. **Effort: S–M.**

**G8 — Lower priority, but real: the frontier-lab release train is weekly and ours is not
publicly comparable to it.** Why it costs us: Anthropic published system cards for four models
across September and October 2026; Mistral shipped three models with dated news entries in a
single month; Meta shipped open weights with a safety section on 15 Oct. A buyer asking "what
changed since last month" gets a dated answer from each of them and has to hunt for ours. Our
answer is `/api/state` and the change record, which is better grounded but far quieter.
Artefact that closes it: a monthly dated change record for the board and the card corpus, in the
same format as `council-os/QUOTING-NUMBERS.md` demands — field paths, `kind`, `as_of` — published
rather than only internally discoverable. **Effort: S.**

---

## 4. WHAT TO WATCH NEXT (Oct–Dec 2026)

Dates below are as stated by the cited body. Where a date is a *plan* rather than a published
deadline, that is said.

| Date | What | Why it matters to us | URL |
|---|---|---|---|
| 2026-10-28 | NIST NCCoE webinar, *DevSecOps and the Impact of Agentic SI*, 1:00–3:00pm EDT, 14 technology collaborators, capped at 500 participants, no fee, registration required. | The one live door in this window where a comment can still shape a document. Example implementation 3 and Agentic SI are both on the agenda. | https://www.nccoe.nist.gov/get-involved/attend-events/devsecops-and-impact-agentic-si · registration: https://nist.zoomgov.com/webinar/register/WN_SA3zfqgFR9GtF4seLQ5JOQ |
| Rolling, no fixed deadline | NIST NCCoE feedback on *Software and AI Agent Identity and Authorization* — comments by email to `AI-Identity@nist.gov`, name/email/organisation all optional, no registration, no fee, no form. NIST states it will "release resources and review feedback on a rolling basis". | The announced next milestone is a **draft project description** released for feedback. A comment sent now can inform that document rather than react to it. | https://pages.nist.gov/nccoe-ai-identity/comments.html |
| 2026-11 (date not published) | NIST: draft project description for the NCCoE Software and AI Agent Identity and Authorization project, released for feedback. | The document our draft comment argues about — the standards list contains nothing that observes conformance from outside the deployment. | https://www.nccoe.nist.gov/projects/software-and-ai-agent-identity-and-authorization |
| 2026-12 (quarterly cadence) | LiveBench release cadence — the picker shows first release 2024-06-24, latest 2026-10-25; the site states results are updated on a rolling release cycle. | The release 2026-10-25 is the latest at time of writing. The next release date is not published; watch the release picker. | https://livebench.ai/ |
| 2026-12-01 | CPMI and IOSCO, **Cyber resilience toolkit: practical considerations for FMIs** — a *consultative report*. | A cyber-resilience toolkit aimed at financial market infrastructures, published inside our window. In the Council's own calendar this is a VERIFIED door with a direct BIS source URL and a second independent re-fetch recorded. | https://www.bis.org/publications/cpmi-iosco-cyber-resilience-toolkit-practical-considerations-fmis |
| 2027-01-15 | AIUC-1 next standard version release, stated in the AIUC-1 changelog. | The first quarterly update *after* the 15 Oct 2026 release that added mandatory third-party evaluation report requirements. The Q1-2027 update is where scope narrows or widens. | https://standard.aiuc-1.com/changelog |
| 2027-01-22 | PRA **CP14/26**, *Review of the Senior Managers and Certification Regime (SM&CR) — Phase 2*, published 22 Oct 2026; responses by **22 January 2027**. | A live regulatory consultation with a submission channel, identified in the Council's own October openings index. Note the honest constraint recorded there: this is a *financial-services* consultation, not an AI consultation, so it is a route to the regulated estate rather than a route into AI measurement. | https://www.bankofengland.co.uk/prudential-regulation/publication/2026/october/review-of-the-smcr-phase-two-consultation-paper |
| 2026-08-02 (in effect, not upcoming) | EU AI Act GPAI enforcement: the Commission's enforcement powers entered into application, with fines available. Providers of GPAI models placed on the market from 2 Aug 2026 must comply. From 2 Aug 2027, models placed before 2 Aug 2025 must comply. | Documentation obligations are live now: technical documentation, copyright policy, downstream API model cards, a Safety and Security Framework and Model Report under Measures 1.4 and 7.7 of the GPAI Code of Practice, all submitted via the EU SEND platform. This is a submission obligation, not a guideline. | https://digital-strategy.ec.europa.eu/en/policies/guidelines-gpai-providers (page last updated 28 April 2026; enforcement dates as stated there) |
| Unscheduled | IETF Internet-Draft `draft-alla-agent-identity-document-01` — Informational, published 10 Oct 2026, expires 13 Apr 2027. Also the chartering of a DAWN ("Discovery of Agents With Names") working group. | A second agent-identity standard forming. Watch for the DAWN charter and for further drafts. | https://datatracker.ietf.org/doc/draft-alla-agent-identity-document/ |
| Ongoing | Cloudflare Monetization Gateway — closed beta as at 30 Sep 2026, US-based sellers and buyers only, no published deadline or general-availability date. | The payment-authorization shape our delegation receipt must interoperate with. Also the frontier-lab safety body lane: agentic AI assurance bodies and NIST NCCoE concept papers. | https://developers.cloudflare.com/monetization-gateway/ |

---

## 5. HONESTY REGISTER

**REAL — fetched a primary source, with the URL, on 2026-10-26.** Every row in the findings
table is in this category. Specifically confirmed at source, with dates read off the page or the
document: Arena Alignment Index (2026-10-08, page states "Published on 8 Oct 2026"); Arena Series B
(2026-10-08, https://arena.ai/blog/series-b, "$200 million Series B at a $3.1 billion valuation");
Arena Max router (2026-10-12, page states "Published on 12 Oct 2026"); Google DeepMind
double-blind pilot (2026-08-27, page shows "August 27, 2026 Responsibility & Safety"); AVERI pilot
report (states "In July and August 2026, AVERI conducted the world's first double-blind
evaluation"); MLCommons double-blind post (https://mlcommons.org/2026/08/double-blind-reliability-evaluation/);
Artificial Analysis Cyber Index Alliance (2026-09-28, page shows "September 28, 2026") and the
Cyber Index evaluation page; AA-PersonalityBench (2026-10-19, page shows "October 19, 2026");
AA HealthBench / HealthBench Professional (2026-10-19); LiveBench 2.0 (2026-10-25, page shows
"Release 2026-10-25" and "Last updated 25 October 2026"); OpenAI GPT-6 Astra system card
(2026-09-03, date present in the PDF text at https://deploymentsafety.openai.com/gpt-6-astra/gpt-6-astra.pdf);
OpenAI GPT-6 Sol/Luna October 2026 update (2026-10-07, date present in the PDF text at
https://deploymentsafety.openai.com/gpt-6-october/gpt-6-october.pdf); Anthropic system-cards index
(https://www.anthropic.com/system-cards — Opus 5.5, Sonnet 5.5, Fable 5.1/Mythos 5.1 "September
2026", Haiku 5.5 "October 2026"); Meta Muse safety post (2026-09-08, date in the fetched page
text); Meta Muse Spark Open (2026-10-15, listed as "October 15, 2026" on the Meta research blog
index, and the post itself fetched); Mistral Shieldstral (2026-08-04, from Mistral's own legal
centre model-lifecycle table, and the announcement post fetched); Mistral Large 4 / Timestral /
Voxtral 3 (6, 15, 20 Oct 2026, from Mistral's own news index); NVIDIA Open Secure AI Alliance
(post fetched); AIUC-1 Q4-2026 changelog (2026-10-15, changelog states "The most recent version
of AIUC-1 was released on October 15, 2026" and the next will be 15 January 2027) and the
accompanying research post; FSB final report (2026-10-15, page shows "15 October 2026"); NIST NCCoE
summary-of-comments news release (2026-09-29, URL path and page content); IETF
draft-alla-agent-identity-document-01 (2026-10-10, datatracker shows "10 October 2026"); Cloudflare
Monetization Gateway closed beta (2026-09-30, changelog URL path and post content); OpenSSF
registry-funding commitment (2026-09-16, from the September newsletter's own dated link list and
the post itself); OWASP AIBOM Foundations Guide v1.0 (PDF fetched and read; the PDF carries a
2026-07-28 date stamp while the file is published under a 2026/09 path — both are stated above
and neither is resolved); Antseed marketplace (https://antseed.com/ and https://antseed.com/docs/
fetched; the 2026-10-06 launch date comes from the site's own dated announcement as reported in
trade press, not from a date printed on the product page — see UNVERIFIED below); CPMI and IOSCO,
*Cyber resilience toolkit: practical considerations for FMIs* — consultative report, dated
01 December 2026 on the BIS page (https://www.bis.org/publications/cpmi-iosco-cyber-resilience-toolkit-practical-considerations-fmis);
PRA CP14/26, *Review of the Senior Managers and Certification Regime (SM&CR) — Phase 2*,
identified on the Bank of England's own prudential-regulation publications feed and read at
https://www.bankofengland.co.uk/prudential-regulation/publication/2026/october/review-of-the-smcr-phase-two-consultation-paper,
which states that responses are invited "by 22 January 2027".

**UNVERIFIED — could not confirm at source, or confirmed only partially.**

1. **Anthropic Claude Opus 5.5 system card — exact day.** The Anthropic system-cards index
   confirms "September 2026" for Opus 5.5, and the announcement PDF
   (https://assets.claude.com/fc1b44717c85dc068bc6ba5024219938094694bd.pdf) was identified with
   a "September 22, 2026" date line, but the PDF itself could not be re-fetched and re-read
   through the fetch path available here (the proxy returned an empty body and the direct fetch
   returned non-text content). The month is confirmed at source; **the day is not.**
2. **Mistral Shieldstral release day.** 2026-08-04 is confirmed from Mistral's own legal centre
   model-lifecycle table, so this one is solid — but it falls **outside** the 2026-09-01 to
   2026-10-26 window and is included because the pattern (a frontier lab shipping a reusable
   safety artefact) matters, not because it is in-window. Also note the announcement post
   describes Shieldstral as being released "today" as an inaugural member of the Open Secure AI
   Alliance with NVIDIA, which suggests an announcement event distinct from the 4 Aug model
   release date; the two are not reconciled here.
3. **NVIDIA Open Secure AI Alliance — publication date.** The blog post was fetched and its
   content is quoted above, but no publication date could be read off the fetched page. The
   alliance is referenced by Mistral's August 2026 Shieldstral announcement, so the organisation
   is real and in-window-adjacent; **the exact date is not established.**
4. **Antseed launch date.** The product and docs pages were fetched and confirm a live
   peer-to-peer inference marketplace with 700+ models and the routing/payment model described.
   The 2026-10-06 launch date and the $2.4M token round led by Spark Capital come from trade
   press, not from a date printed on the site I fetched. **Treated as a company-announced date
   reported by third parties, not as a primary-source-verified date.**
5. **The Artificial Analysis "all evaluations are conducted independently by Artificial Analysis"
   phrasing.** This sentence appears in the Council's own October openings index as a quotation
   attributed to Artificial Analysis. On the pages I fetched directly — the AA Cyber Index
   article and the AA Cyber Index evaluation page — I confirmed the Alliance, the four named
   partners, the three benchmarks, the methodology page, the leaderboard and the join email, and
   I confirmed AA's own words "The result is an independent, like-for-like comparison of which
   models best support this work and what they cost to run." I did **not** find the longer
   "All evaluations are conducted independently by Artificial Analysis" sentence in the bytes I
   retrieved from either page. It may appear on a page section I did not render. **Not asserted
   here as a verbatim quotation**; the confirmed AA wording is the one quoted above.
6. **OWASP AIBOM v1.0 publication date.** The PDF was fetched and read; it carries a 2026-07-28
   date stamp and is published at a 2026/09 URL path. The whitepapers index does not print a
   publication date. **The v1.0 release date within 1 Sep – 26 Oct 2026 is not established.**
7. **LiveBench 2.0 methodology depth.** The site confirms the release date, the contamination-free
   long-horizon framing, the cost-per-successful-task value-frontier view, and the release
   cadence. The full grading methodology was not read in full. No claim is made here about its
   grading method beyond the site's own framing.
8. **EU AI Act GPAI guidelines.** The Commission page was fetched and read in full, but its own
   "Last update" is 28 April 2026 — outside the window. It is included because it states the
   enforcement dates and the submission obligations that are **live now**, not as an in-window
   development. Note also that the Digital Omnibus (Regulation (EU) 2026/1744, of 8 July 2026,
   https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) moved application dates; I did not fetch
   that regulation text directly, and I therefore make no claim about which dates it moved.
9. **MLCommons and AVERI dates.** The MLCommons double-blind post is at a 2026/08 URL path and
   the AVERI report describes the pilot as running July–August 2026. Both are **outside** the
   stated window and are included because they are the substrate of the in-window Google DeepMind
   announcement. AVERI's report does not print its own publication date in the fetched text.
10. **Absence of findings is not evidence of absence.** We did not find in-window primary-source
    releases from xAI, from ISO/IEC, from IOSCO, from Lloyd's or another insurance market, or
    from Sigstore/SLSA/OpenSSF's Sigstore project specifically. For xAI, ISO, IOSCO and Lloyd's
    this reflects the limits of the search tooling available in this session, not a finding that
    they did nothing. For Sigstore and SLSA, the Sigstore blog index fetched on 2026-10-26 showed
    its most recent post as Rekor v2 GA on 10 Oct 2025 and Cosign v3 on 8 Oct 2025, and a targeted
    search for a 2026 SLSA specification release returned only 2025 material and 2026 secondary
    commentary — so we can say we found no in-window primary provenance release, and **not** that
    none exists. Absence of a finding is not evidence of absence.

**A note on scope and method.** All research used `web_fetch` and a text-extraction proxy; no
web-search connector was available in this session, and direct `curl` to a search engine was
blocked by an anti-automation response. Search was therefore performed through a text proxy over
DuckDuckGo's lite endpoint, with each candidate then opened and read at its own primary URL. Rows
resting on search-result snippets alone were not promoted into the findings table; where a source
could not be re-read directly, it is in the UNVERIFIED list above.

**Doctrine.** This document contains no internal codename. It claims no score, certification,
ranking, market share or revenue. It distinguishes throughout between an organisation
announcing something and an independent party verifying it — where this document says a
verification happened, it names the verifier. Nothing here is CSOAI's endorsement of any
organisation listed, and nothing here is CSOAI's assessment of any of them.
