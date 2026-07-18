# 🔍💎 Crown-Jewels Hunt — OSS to absorb + new competitors in our lane (2026-06-27)

Deep-research sweep across the board: open-source code, latest 2026 news, CCO/buyer developments — hunting for diamonds we can absorb **and** mapping who just landed in our Article-12 / legacy-compliance lane. Honest read: the hunt found **both gold to absorb and real new competitors** — and the competitors *sharpen* where our moat actually is.

---

## 💎 TIER 1 — ABSORB THESE (highest value, low risk, strengthens the moat)

### 1. `oscal-compass/compliance-trestle` — the OSCAL platform we should stand on, not rebuild
- **What:** IBM-origin (now a CNCF-adjacent community, `oscal-compass`), opinionated **compliance-as-code** tooling over NIST OSCAL. Runs as a **CI/CD pipeline on compliance artifacts in git** — create/validate/govern OSCAL SSPs, component-defs, assessment results, with transparency across stakeholders. Apache-2.0.
- **Why it's a jewel:** This is *exactly* the layer our `oscal-generator-mcp` is hand-rolling — but mature, tested, multi-format (XML/JSON/YAML), with a real community. **We should wrap trestle as the engine behind oscal-generator-mcp** instead of maintaining our own canonicaliser/validator. Our differentiator stays the **Ed25519 signing + SIGIL chain + the 55-component Layer-0 package**; trestle does the heavy OSCAL plumbing underneath.
- **Move:** add `compliance-trestle` as a dependency in oscal-generator; keep our sign/verify/RFC-0024 tools on top. Validate our `layer0_protocol.oscal.json` *through trestle* → instant external-tool credibility ("our package validates under the standard community toolchain").
- 🔗 https://github.com/oscal-compass/compliance-trestle

### 2. `usnistgov/oscal-cli` + `usnistgov/OSCAL` — the official NIST validator
- **What:** NIST's own CLI + schemas for OSCAL operations (validate, convert XML↔JSON↔YAML).
- **Why:** Free, authoritative validation oracle. Run our signed package through `oscal-cli validate` in CI → "NIST-tool-validated" is a real trust claim for the FedRAMP RFC-0024 wedge (machine-readable mandate, 30 Sep 2026).
- **Move:** add `oscal-cli validate` to the oscal-generator CI workflow.
- 🔗 https://github.com/usnistgov/oscal-cli · https://github.com/usnistgov/OSCAL

### 3. `Azure-Samples/Legacy-Modernization-Agents` — the COBOL-understanding front-end to our bridges
- **What:** Microsoft's open AI-agent framework that **reverse-engineers COBOL** (BusinessLogicExtractorAgent → human-readable docs) before converting to Java Quarkus / C# .NET. Multi-provider (Azure OpenAI / Copilot / OpenAI).
- **Why it's a jewel AND not a threat:** It does **modernization (migration)**; CSOAI does **governance (compliance attestation)**. They're complementary — their "understand the COBOL first" agent is the perfect *input* to our `cobol-bridge-mcp` (parse → **then govern + sign**). A bank modernizing COBOL with this still needs our signed EU-AI-Act/DORA attestation on the result. **Position: "we govern what Azure modernizes."**
- **Move:** reference it in the cobol-bridge demo as the upstream; explore calling its extractor to enrich our `parse_cobol_program` output.
- 🔗 https://github.com/Azure-Samples/Legacy-Modernization-Agents

### 4. The "awesome" jewel-maps — mine these for the next 20 absorb candidates
- `morganrcu/awesome-eu-ai-act` — tools that **generate the evidence the law requires** (our exact niche). 🔗 https://github.com/morganrcu/awesome-eu-ai-act
- `GenAI-Gurus/awesome-eu-ai-act` — OSS + templates + guides. 🔗 https://github.com/GenAI-Gurus/awesome-eu-ai-act
- `theopenlane/awesome-compliance` — broad compliance libraries/tooling. 🔗 https://github.com/theopenlane/awesome-compliance
- `Vaquill-AI/awesome-legaltech` — **MCP servers, models, datasets for the legal ecosystem** (legaltech distribution surface — where are *our* reg-MCPs listed? answer: nowhere yet). 🔗 https://github.com/Vaquill-AI/awesome-legaltech
- **Move:** submit CSOAI's reg-MCP fleet + bridges as PRs to these awesome-lists = free, durable GEO/distribution (the GRC giants aren't on them either).

---

## ⚔️ TIER 2 — NEW COMPETITORS IN OUR ARTICLE-12 LANE (the honest threat read)

The big change since the June audit: **open-source Article-12 / tamper-evident-logging tools are now shipping** — including **local-first / on-prem** ones (the sovereign angle we claimed as differentiated). This contests the "signed Art.12 audit on agents" wedge. **But every one of them governs MODERN agent frameworks (LangChain/CrewAI/AutoGen) — none bridge COBOL/SAP/SCADA/HL7.** The legacy moat *holds* and is now the *cleanest* differentiator.

| OSS competitor | What it ships | Overlaps us on | Does NOT have (our edge) |
|---|---|---|---|
| **AIR Blackbox** (`airblackbox/gateway`) | EU AI Act scanner, **39–51 checks Art.9-15**, **HMAC-SHA256 tamper-evident chains**, PII + prompt-injection block, **local-first** | Art.12 hash-chain + local-first (our SIGIL + sovereign claim) | Legacy bridges · BFT council · article-level reg *content* · Ed25519/OSCAL |
| **Sentinel Kernel** (`sebastianweiss83/sentinel-kernel`) | "Trace/Policy/Evidence under EU jurisdiction", **Apache-2.0, on-premise**, automatic tamper-resistant Art.12 logging | On-prem EU-jurisdiction Art.12 evidence | Legacy · signed OSCAL package breadth · the 22-bridge category |
| **Vaara** | Python runtime oversight, intercepts tool calls, **hash-chained audit logs** for Art.12 + Art.14 | Hash-chained audit (our SIGIL) | Legacy · OSCAL · bridges · BFT |
| **Systima Comply** | **AST-based** scanner, 37+ frameworks, call-chain tracing, Art.5-50 obligation checks, CLI + GH Action + TS API | Breadth of article coverage + CI distribution | Legacy bridges · signed artifacts · sovereign runtime |
| **ark-forge/mcp-eu-ai-act** | MCP scanner, now with **"ArkForge Trust Layer" → tamper-proof proof_id + public verification URL** | MCP-native + verifiable proof (our exact pattern) | Breadth (single EU-AI-Act MCP) · legacy · BFT |
| **Microsoft Agent Governance Toolkit** | 7-pkg MIT, OWASP Agentic Top-10, **EU AI Act + NIST + HIPAA + SOC2 mappings**, <0.1ms p99, 8+ agent frameworks | Layer-A plumbing + framework mappings | Legacy · signed OSCAL · article-level *depth* · BFT council |

### What this means (corrected, honest)
1. **The "signed Art.12 audit on modern agents" wedge is now OSS-contested.** AIR Blackbox + Sentinel Kernel + Vaara are *credible, local-first, hash-chained* — the same shape as our A2A `agent-audit-logger` + SIGIL. We should **stop pitching "we sign agent audit logs" as the differentiator** — it's becoming table-stakes, same as MS commoditized the plumbing.
2. **The legacy bridges are now the ONLY uncontested ground — even cleaner than before.** Five of six new competitors explicitly govern LangChain/CrewAI/AutoGen. **Zero touch COBOL/SAP/SCADA/HL7/ISO-20022.** This *confirms and sharpens* the `CSOAI_COMPETITIVE_MATRIX` Layer-A/Layer-B read: lead with legacy, exclusively.
3. **"Verifiable proof_id + public URL" (ark-forge) is a pattern we should match or beat.** Our offline-verifiable Ed25519 is *stronger* (no callback to a vendor), but we lack their *public verification UX*. **Build a public "verify this CSOAI attestation" page** (drop a sig → verifies offline-in-browser, like the OS already does on-device). That turns our cryptography into a sales-visible proof.
4. **The local-first / sovereign claim is no longer unique on its own** — Sentinel Kernel is Apache-2.0 on-prem EU-jurisdiction. Our sovereign differentiation has to be **legacy + on-device + BFT council + the 369-MCP breadth as a packaged whole**, not "on-prem" alone.

---

## 🏦 TIER 3 — THE BUYER (CCO) IS NOW SPENDING (the demand is real + dated)

The deep-research on the buyer side strengthens the wedge with hard 2026 numbers:
- **Market:** AI governance & compliance spend → **$2.54B in 2026 → $8.23B by 2034**; legal/compliance GRC-tool investment **+50% by 2026**; consulting demand for AI-risk-governance **+40% in 2026**. *(Note: this is the broader gov-compliance spend; the narrower "AI governance platforms" Gartner figure is $492M→$1B+ — both cited, don't conflate.)*
- **The teeth:** EU AI Act high-risk obligations **fully enforceable Aug 2, 2026**; fines up to **€15M or 3% of global turnover**.
- **The named buyer:** banks' **AML, credit-scoring, fraud** systems are high-risk *by definition* (Annex III Part 5b/5c). **ECB 2025-26 supervisory priorities explicitly list AI governance + model-risk** — engagement letters already reference it. Healthcare AI validation **adds 20-40% compliance cost.**
- **The accountable human:** the **CCO / a designated senior exec must own AI oversight**, and the **board risk committee must formally include AI compliance** in its mandate (per the FluxForce CCO guide + Fortune/Yale framework).
- **Why it matters for the pitch:** the buyer (bank/insurer CCO) now has (a) a budget line that's growing 50%, (b) a hard date, (c) a personal-accountability mandate, and (d) legacy systems (COBOL/SAP) the funded competitors don't touch. **That is the single sharpest sales motion in the whole estate.**

🔗 Sources: [SQ Magazine AI compliance cost stats](https://sqmagazine.co.uk/ai-compliance-cost-statistics/) · [FluxForce CCO guide](https://www.fluxforce.ai/for/cco-ai-act-compliance) · [Modulos financial-services](https://www.modulos.ai/industries/financial-services/) · [Vantedge board playbook](https://www.vantedgesearch.com/resources/blog/board-playbook-eu-ai-act-deadlines-you-cant-miss/) · [Wilson Sonsini 2026 preview](https://www.wsgr.com/en/insights/2026-year-in-preview-ai-regulatory-developments-for-companies-to-watch-out-for.html)

---

## 🎯 THE DIAMONDS — concrete absorb/build moves (ranked, M4-lane)

1. **Wrap `compliance-trestle` under oscal-generator-mcp** — stop hand-rolling OSCAL plumbing; keep Ed25519/SIGIL on top. *(Biggest leverage: credibility + less code to maintain.)*
2. **Add `oscal-cli validate` + trestle-validate to CI** — "NIST-tool + community-tool validated" trust claim for the RFC-0024 wedge.
3. **Build the public "verify a CSOAI attestation" page** — match ark-forge's verifiable-proof UX, but offline/in-browser (we already do on-device verify in the OS — lift that into a standalone page).
4. **Submit the reg-MCP fleet + 22 bridges to the awesome-lists** (eu-ai-act ×2, awesome-compliance, awesome-legaltech) — free durable distribution the GRC giants haven't taken.
5. **Re-point the narrative once more (doc-level, not just claim):** drop "signed agent audit logs" from the headline (now OSS-contested by AIR Blackbox/Sentinel/Vaara) → lead **exclusively** with "govern + sign the legacy economy for Aug-2026, with the article-level reg content + BFT no one else has." Update the investor memo + outreach.
6. **Competitive-watch file:** add AIR Blackbox / Sentinel Kernel / Vaara / Systima / ark-forge to a living `CSOAI_OSS_COMPETITORS.md` so we track their roadmaps (they're moving fast in our lane).

---

## Honest bottom line
The hunt paid off **both ways**: real diamonds to absorb (**compliance-trestle, oscal-cli, the Azure COBOL-understanding agent, four awesome-list distribution surfaces**) *and* a sobering, useful finding — **the Article-12 signed-audit space we thought was ours is now OSS-contested** (local-first, hash-chained, EU-jurisdiction tools shipping). The silver lining is sharp: every new entrant governs *modern* agents, so the **legacy bridges are now the cleanest, most defensible moat in the whole estate** — and the buyer (bank/insurer CCO) has a growing budget, a hard date, and personal accountability. **Lead with legacy. Stand on trestle. Validate with NIST's own tools. Ship a public verify page. Get on the awesome-lists.**

---

# 🔬 KIMI CROSS-CHECK (2026-06-27) — verified Kimi's wall-notes + intel brief

Nick supplied a large Kimi compilation (wall notes + a deep-research "crown jewels" brief). Kimi has a habit of **renaming real tools** (e.g. "OpenClaw"/"ClawTeam"/"OpenFang"/"MiroFish"/"Kimodo"/"Inkog") — so I verified the decision-relevant claims directly before absorbing. **Verdict: the core is real and accurate** (the naming quirks aside). Honest real-vs-unverified split below.

## ✅ VERIFIED REAL — absorb these (I confirmed each via direct search)

| Tool | What it is (verified) | License | Why it matters to CSOAI |
|---|---|---|---|
| **COMPL-AI** (ETH Zurich + INSAIT + LatticeFlow) | First EU-AI-Act technical-interpretation framework: **27 benchmarks** mapping the Act to measurable LLM tests | open-source, compl-ai.org | **Validate models before we attest them.** Pair with our reg-MCPs: COMPL-AI scores the model, CSOAI signs the result. |
| **VerifyWise** (`bluewave-labs/verifywise`) | Open AI-governance platform, **24+ frameworks** (EU AI Act/NIST/ISO 42001/GDPR/SOC2), immutable audit logs, on-prem | BSL 1.1 (source-available) | **Direct architecture reference + competitor** for a governance dashboard. On-prem + audit-log overlaps us — but no legacy bridges. |
| **Giskard** (`Giskard-AI/giskard-oss`) | LLM **red-teaming + vuln scanner**, 40+ probes, OWASP LLM Top-10, prompt-injection | Apache-2.0 | **Red-team our own MCPs + a SKU** for SafetyOf.AI. Feeds the "AI safety/assurance" cluster (8 MCPs). |
| **Venturalitica SDK** (`pip install venturalitica`) | **Generates OSCAL Assessment Results + CycloneDX ML-BOM + Annex-IV docs as a byproduct of training**; extends OSCAL with **16 AI-lifecycle properties**; arXiv "Making AI Compliance Evidence Machine-Readable" (2604.13767) | Apache-2.0 | 🔑 **Closest thing to our exact moat in OSS.** Align our OSCAL extension with its 16 properties for interoperability; absorb its ML-BOM generation under oscal-generator. |
| **NVIDIA ACE Game Agent SDK** | On-device AI-companion framework (Agent/Chat/RAG APIs + UE5 plugins: ASR/SLM/TTS/Audio2Face); ships **C++ + Python source under MIT**; proven in PUBG "Ally" + Total War: PHARAOH; launched **Unreal Fest, 16–18 June 2026** | MIT | **The MEOK gaming / Dragon-Companion infra** — production-ready, white-label-able. Kimi's facts check out exactly. |
| **AIR Blackbox · Sentinel Kernel · Microsoft Agent Gov Toolkit** | (already in Tier-2 above) | — | Confirmed; Kimi independently surfaced the same set → cross-validates my competitor read. |

## 🚨 BIGGEST FINDING — the MCP security crisis is REAL (and it's a CSOAI opening, not just a risk)
Kimi's "OpenClaw CVE-2026-25253" specific is **a confabulation** (no such project/CVE), BUT the underlying threat is **real and worse than Kimi framed**, confirmed across OX Security, The Hacker News, Tom's Hardware, Check Point:
- A **systemic "by-design" RCE weakness in Anthropic's MCP SDK** (Python/TS/Java/Rust) — **7,000+ public servers, 150M+ downloads, up to 200,000 vulnerable instances**.
- **30 CVEs filed in 60 days.** `CVE-2025-6514` (CVSS **9.6**, mcp-remote, 437k downloads). 9 of 11 MCP **registries** poisoned with a test payload in research; 6 live production platforms confirmed exploitable.
- Scan of **2,614 MCPs:** **82%** of file-handling MCPs vulnerable to path traversal, **67%** code-injection risk, **38–41%** of officially-registered servers had **no meaningful auth**. **1,184 malicious agent skills** documented.

### Why this is the sharpest strategic item in the whole hunt
1. **RISK — our 369 MCPs are part of this surface.** Before we publish/deploy, we must **security-audit the fleet** (path traversal, command injection, auth). Use **Giskard scan + Inkog-style SARIF** on every server. This is now a publish-gate, not optional.
2. **OPENING — this crisis is *exactly* what CSOAI's A2A substrate answers.** `agent-policy-enforcement` (per-action IAM), `agent-prompt-injection-firewall` (OWASP LLM01), `agent-audit-logger` (hash-chained), `agent-handoff-certified` (signed), `agent-mcp-router` (one governed gateway) — that 20-MCP substrate is the *remediation* for a 30-CVE headline crisis. **Reframe the A2A substrate from "table-stakes" → "the governed-MCP answer to the MCP security crisis."** That's a sharper, more urgent wedge than I had, and it's *already built*.

## ⚠️ UNVERIFIED — likely Kimi renaming; verify before chasing (don't absorb yet)
- **OpenFang** (Rust agent OS, "137K LOC/16.8K stars") · **ClawTeam** (`HKUDS` — HKUDS is a real lab, but the repo name is unconfirmed) · **MoltBook/Molt Dynamics** (arXiv 2603.03555, "770k agents") · **MiroFish** (swarm sim) · **NVIDIA Kimodo** (human-motion). These *sound* like real things under other names (OpenFang≈an agent-OS; Kimodo≈NVIDIA's real motion model) but I did **not** confirm the exact repos. **Action: treat as leads, not facts — verify the repo before any `git clone`.**
- **Humanoid hardware** (OpenLoong / RoboParty Roboto-Origin / Open-X-Humanoid + RoboMIND): plausible and matches the open-humanoid-hardware trend, but **out of scope for the CSOAI legacy-compliance lane** — park under the MEOK-robotics research thread, don't let it pull focus from the Aug-2026 compliance wedge.
- **Regulus / Inkog / "Watchdog Analyst"**: named compliance/security tools I couldn't confirm by exact name — likely real-under-another-name; check the awesome-eu-ai-act list (where Kimi sourced them) for the true names.

## Net adds to the absorb list (verified only)
7. **Venturalitica SDK** — align our OSCAL extension to its 16 AI-lifecycle properties + absorb ML-BOM generation. *(Highest-relevance new jewel — it's our moat, in OSS.)*
8. **COMPL-AI** — model-compliance scoring upstream of our attestation.
9. **Giskard** — red-team the MCP fleet (publish-gate) + a SafetyOf.AI SKU.
10. **VerifyWise** — reference architecture for a CSOAI governance dashboard (study, don't fork — BSL license).
11. **NVIDIA ACE SDK** — MEOK gaming companion infra (MEOK lane, not CSOAI).
12. **🚨 Security-audit all 369 MCPs** (Giskard + path-traversal/injection/auth checks) **before publish** — and **reframe the A2A substrate as the answer to the MCP security crisis** in the deck + memo.

*Kimi-verified sources: [COMPL-AI / LatticeFlow](https://latticeflow.ai/news/eth-zurich-insait-and-latticeflow-ai-launch-the-first-eu-ai-act-compliance-evaluation-framework-for-generative-ai) · [VerifyWise](https://github.com/bluewave-labs/verifywise) · [Giskard OSS](https://github.com/Giskard-AI/giskard-oss) · [Venturalitica (PyPI)](https://pypi.org/project/venturalitica/) · ["Making AI Compliance Evidence Machine-Readable" (arXiv 2604.13767)](https://arxiv.org/html/2604.13767) · [NVIDIA ACE SDK (NVIDIA blog)](https://developer.nvidia.com/blog/build-on-device-ai-companions-with-the-nvidia-ace-game-agent-sdk-and-unreal-engine-5-plugins/) · [MCP RCE advisory (OX Security)](https://www.ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/) · [MCP RCE (Tom's Hardware)](https://www.tomshardware.com/tech-industry/artificial-intelligence/anthropics-model-context-protocol-has-critical-security-flaw-exposed)*

---

*Sources (code): [Azure Legacy-Modernization-Agents](https://github.com/Azure-Samples/Legacy-Modernization-Agents) · [compliance-trestle](https://github.com/oscal-compass/compliance-trestle) · [oscal-cli](https://github.com/usnistgov/oscal-cli) · [usnistgov/OSCAL](https://github.com/usnistgov/OSCAL) · [airblackbox/gateway](https://github.com/airblackbox/gateway) · [sentinel-kernel](https://github.com/sebastianweiss83/sentinel-kernel) · [ark-forge/mcp-eu-ai-act](https://github.com/ark-forge/mcp-eu-ai-act) · [microsoft/agent-governance-toolkit](https://github.com/microsoft/agent-governance-toolkit) · [awesome-eu-ai-act (morganrcu)](https://github.com/morganrcu/awesome-eu-ai-act) · [awesome-eu-ai-act (GenAI-Gurus)](https://github.com/GenAI-Gurus/awesome-eu-ai-act) · [awesome-compliance](https://github.com/theopenlane/awesome-compliance) · [awesome-legaltech](https://github.com/Vaquill-AI/awesome-legaltech)*
