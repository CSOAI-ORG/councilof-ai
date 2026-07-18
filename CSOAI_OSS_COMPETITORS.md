# 🛰️ CSOAI — OSS Competitor & Adjacency Watch (living file)

Tracks the open-source projects landing in CSOAI's lanes (Article-12 signed audit, OSCAL/machine-readable compliance, agent/MCP governance) so we see roadmaps before they surprise us. **Updated 2026-06-27.** Re-check monthly. Legend: 🔴 direct overlap · 🟡 adjacent/partial · 🟢 absorb/ally (we use it).

> **The through-line:** every entrant governs **modern** agent frameworks (LangChain/CrewAI/AutoGen) or generic LLMs. **None bridge COBOL/SAP/SCADA/HL7/ISO-20022.** The Article-12 *signed-audit* layer is now OSS-contested → it's no longer our headline. **The legacy bridges are the cleanest uncontested moat.** Lead there.

---

## 🔴 Direct overlap — Article-12 signed/tamper-evident audit (now contested)
| Project | Repo | What it ships | Overlaps us on | What it LACKS (our edge) | Watch |
|---|---|---|---|---|---|
| **AIR Blackbox** | `airblackbox/gateway` | EU AI Act scanner, 39–51 checks Art.9-15, **HMAC-SHA256 tamper chains**, PII + prompt-injection block, **local-first** | tamper-evident audit + local-first (our SIGIL + sovereign claim) | legacy bridges · BFT council · article-level reg *content* · Ed25519/OSCAL signed package | 🔺 fast-moving; mirrors our A2A audit-logger |
| **Sentinel Kernel** | `sebastianweiss83/sentinel-kernel` | "Trace/Policy/Evidence under EU jurisdiction", **Apache-2.0, on-prem**, automatic Art-12 logging | on-prem EU-jurisdiction Art-12 evidence | legacy · signed OSCAL breadth · 22-bridge category | watch licence/traction |
| **Vaara** | (PyPI/GitHub — confirm exact) | Python runtime oversight, intercepts tool calls, **hash-chained audit** for Art-12 + Art-14 | hash-chained audit (SIGIL) | legacy · OSCAL · bridges · BFT | confirm repo |
| **ark-forge / mcp-eu-ai-act** | `ark-forge/mcp-eu-ai-act` | MCP scanner + **"ArkForge Trust Layer" → tamper-proof proof_id + public verify URL** | MCP-native + verifiable proof (our exact pattern) | breadth (single EU-AI-Act MCP) · legacy · BFT | 🔺 our `verify.html` answers their public-proof UX (and is offline, no vendor callback) |

## 🔴 Direct overlap — agent / MCP runtime governance (Layer A, commoditizing)
| Project | Repo | What it ships | Overlaps us on | What it LACKS | Watch |
|---|---|---|---|---|---|
| **Microsoft Agent Governance Toolkit** | `microsoft/agent-governance-toolkit` | 7-pkg MIT, OWASP Agentic Top-10, **EU AI Act + NIST + HIPAA + SOC2 mappings**, Ed25519 DIDs + MCP gateway + audit, <0.1ms p99, 8+ frameworks | identity/gateway/audit + framework mappings (Layer-A plumbing) | legacy · signed OSCAL package · article-level *depth* · BFT council | the plumbing is now free — sit ON it, don't fight it |
| **Runlayer** ($30M Series A, Felicis+Khosla) | closed (SaaS) | MCP governance: approval workflows, audit trails, human authz | MCP gateway/approval | legacy · signed artifacts · sovereign | funded — validates the market, not on legacy |
| **ServiceNow AI Control Tower** | closed | agent kill-switch + Action Fabric per-action identity/audit | kill-switch + audit | legacy · OSCAL · sovereign | incumbent |

## 🟡 Adjacent — GRC platforms / model-compliance eval
| Project | Repo | What it ships | Overlaps us on | Note |
|---|---|---|---|---|
| **VerifyWise** | `bluewave-labs/verifywise` | open AI-governance platform, **24+ frameworks**, immutable audit, on-prem (BSL 1.1) | governance dashboard + multi-framework + audit | closest to a CSOAI *dashboard*; **no legacy bridges, no signed OSCAL package.** Reference architecture (study, don't fork — BSL). |
| **COMPL-AI** | ETH Zurich/INSAIT/LatticeFlow (compl-ai.org) | first EU-AI-Act technical interpretation, **27 benchmarks** scoring LLMs for compliance | model-compliance scoring | **Complementary/absorb:** COMPL-AI scores the model → CSOAI signs the result. Not a competitor — an input. |
| **Systima Comply** | (confirm repo) | AST scanner, 37+ frameworks, call-chain tracing, Art.5-50, CLI+GH-Action+TS-API | breadth + CI distribution | scanner only — no signed artifacts, no legacy |
| **GRC incumbents** (OneTrust/Credo/Vanta/Drata/Holistic) | closed SaaS | assessment/questionnaire GRC | compliance content | **Not on the MCP registry at all** — our distribution moat vs them holds. 2–15× price gap. |

## 🟢 Absorb / ally (we use these — see CSOAI_CROWN_JEWELS_HUNT)
| Project | Repo | Role for CSOAI |
|---|---|---|
| **compliance-trestle** | `oscal-compass/compliance-trestle` | ✅ **Now wrapped** under oscal-generator (`validate_oscal_strict`) — our Layer-0 package validates under it. Stand on it. |
| **usnistgov/oscal-cli** | `usnistgov/oscal-cli` | ✅ Best-effort NIST validator in CI. Authority claim. |
| **Venturalitica SDK** | PyPI `venturalitica` (Apache-2.0) | Generates OSCAL Assessment Results + CycloneDX ML-BOM + Annex-IV from training; **extends OSCAL w/ 16 AI-lifecycle props** → align our OSCAL extension to it. Closest OSS to our moat. |
| **Giskard** | `Giskard-AI/giskard-oss` (Apache-2.0) | Red-team our own MCP fleet (publish-gate vs the MCP-security crisis) + a SafetyOf.AI SKU. |
| **Azure Legacy-Modernization-Agents** | `Azure-Samples/Legacy-Modernization-Agents` | COBOL reverse-eng = upstream to cobol-bridge ("we govern what Azure modernizes"). |

## 🚨 Environment watch — the MCP security crisis (our opening)
Systemic by-design RCE in the MCP SDK: ~200k vulnerable instances, **30 CVEs/60 days** (CVE-2025-6514 CVSS 9.6), 82% of file-handling MCPs path-traversal-vuln, 38-41% no auth. **Implication for this watch:** the whole agent-governance field above exists to remediate this. CSOAI's **20-MCP A2A substrate IS the remediation** (policy-enforcement/injection-firewall/audit-logger/certified-handoff/router) — reframe it as "the governed-MCP answer to the MCP security crisis." Also a publish-gate: security-audit our 369 with Giskard before shipping.

---
## How to use this file
- Before any investor/partner convo: skim the "what they LACK" column — that's the differentiation script.
- Monthly: re-check each repo's releases; move anything that ships a legacy bridge to 🔴-URGENT (it would be the first real moat threat).
- New entrant? Add a row; classify 🔴/🟡/🟢; always fill "what they LACK".

*Sources: CSOAI_CROWN_JEWELS_HUNT_2026-06-27.md · CSOAI_COMPETITIVE_MATRIX_2026-06-26.md · CSOAI_RESEARCH_SYNTHESIS_2026-06-26.md.*
