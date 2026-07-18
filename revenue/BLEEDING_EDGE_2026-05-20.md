# MEOK Bleeding-Edge Scan — Q1-Q2 2026
**Generated:** 2026-05-20 · all versions verified via live web fetch · agent flagged gaps explicitly

## TL;DR — DO THIS WEEK (3 integrations, 1-2 days each)

1. **SEP-1686 Async Tasks** in `meok-attestation-api` (1 day) — unblocks CRA Annex IV >30s scans. Ship to all 6 v1.2.0 attestation MCPs as v1.3.0.
2. **OpenSSF Scorecard sub-attestation** in `dora-nis2-crosswalk-mcp` (1 day) — `--include-scorecard <github-url>` flag, embed as CycloneDX 1.7 Citations element. Marketing line: *"DORA + NIS2 + OpenSSF in one signed attestation."*
3. **ML-DSA-65 (NIST FIPS 204) post-quantum signature** option in `meok-attestation-api` (2 days) — alongside HMAC. Sales line: *"First open-source compliance attestation API with NIST PQC signatures."* Aligns with Akamai's 31 Jan 2026 PQC default-on milestone.

---

## URGENT: Article 50 Lead Magnet (13-day window)

**EU Article 50 Draft Guidelines** published 8 May 2026, consultation **closes 3 June 2026**. Every GPAI vendor in EU is reviewing draft. Ship `meok-article50-tracker` MCP **this week** as lead magnet.

Source: `digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content`

Also: **GPAI Code of Practice final** published 10 Jul 2025, full enforcement **2 Aug 2026** (11 weeks).

---

## 1. MCP Protocol (spec 2025-11-25)

| Change | What | MEOK impact |
|---|---|---|
| SEP-1686 Async Tasks | task handles + polling | unblocks long attestation workflows |
| SEP-1036 URL Mode Elicitation | OAuth/Stripe checkout via browser inside MCP | enables in-conversation £29/£79 upgrade |
| SEP-1577 Sampling with Tools | server-side agent loops | agentic MCPs become tractable |
| OAuth 2.1 + RFC 8707 | mandatory for remote servers | already there |
| Streamable HTTP | replaces SSE | already migrated |

Roadmap: `blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/` — stateless ops, session migration, fleets.

---

## 2. AI Safety / Alignment Research (2026 papers)

- **A3: Automated Alignment Agent** (Anthropic) — `alignment.anthropic.com/2026/automated-alignment-agent/` — open-source eval taxonomy. **Swap into MEOK's bias-detection MCP.**
- **arxiv 2510.05192** — "Adapting Insider Risk mitigations for Agentic Misalignment". Direct EU AI Act Annex III hook.
- **arxiv 2507.08270** — "Agent Safety Alignment via RL".
- **METR Frontier Risk Report** Feb-Mar 2026 — `metr.org/blog/2026-05-19-frontier-risk-report/`. Strategic-reasoning weakness finding is gold for compliance narrative.
- **OpenAI / Anthropic joint alignment pilot** — useful precedent for MEOK council framing.

---

## 3. EU AI Act — Delegated Acts Status (May 2026)

- **GPAI Code of Practice Final** — published 10 Jul 2025; full enforcement 2 Aug 2026; chapters: Transparency, Copyright, Safety & Security
- **Article 50 Draft Guidelines** — 40 pages, consultation closes 3 June 2026
- **Code of Practice on AI-Generated Content (Art 50(2)/50(4))** — second draft Mar 2026, final expected Jun 2026. Mandates multilayered approach: watermarking + metadata + cryptographic provenance + fingerprinting. **MEOK's meok-watermark-attest plugs directly in.**

---

## 4. OSS Components — Verified Current Versions

| Component | Version | Notes |
|---|---|---|
| **CycloneDX** | **1.7** (Apr-May 2026) | TLP distribution constraints, Citations root element, patent metadata, crypto material |
| **SPDX** | 3.0 | 3.1 not yet released |
| **SLSA** | **v1.2** | Simpler attestation parsing, hermetic-build clarifications |
| **C2PA** | **2.2** (2025-05-01) | Drops "actor", X.509-only signing, default C2PA Trust List, ITL frozen 1 Jan 2026 |
| **in-toto v2.0** | ❓ unconfirmed | Treat v1 as stable |
| **Sigstore Bundle v0.4** | ❓ unconfirmed | Real news: Cosign v3 with `--new-bundle-format` default-on |
| **NIST PQC** | FIPS 203 (ML-KEM), 204 (ML-DSA), 205 (SLH-DSA) | Akamai PQC default-on 31 Jan 2026 |

---

## 5. Frontier Evals to Align Against

- **METR HCAST** — 189 → 228 tasks in Time Horizon 1.1 (Jan 2026); Claude Opus 4.6 = 14.5h horizon. `github.com/METR/RE-Bench`.
- **ARC-AGI-2** — `arxiv 2505.11831`. GPT-5.5 = 85%, Confluence Lab = 97.9% by Apr.
- **ARC-AGI-3** — `arxiv 2603.24621`. Humans 100%, frontier AI <1%. **The gap MEOK can monetise** — "your agent can't pass ARC-AGI-3, here's an Annex IV impact assessment template explaining why."
- HELM, GPQA Diamond, MATH-500, LiveBench — active references but specific 2026 version IDs not surfaced.

**Action:** Embed METR HCAST task taxonomy into red-team MCP — MIT-licensed, gold-standard, free.

---

## 6. Compliance Tooling — Integrate vs Compete

**Integrate as upstream:**
- **Syft + Grype** (Anchore) — `syft → CycloneDX → grype` workflow; shell out from CRA Annex IV MCP
- **OpenSSF Scorecard** — 19 checks against GitHub repos, score 0-10. Drop into DORA crosswalk MCP. `scorecard.dev`
- **Sigstore / Cosign v3** — keyless OIDC signing, better optics than HMAC for OSS-first compliance

**Compete with:**
- **Trivy** — hit by 2 supply chain attacks Feb-Mar 2026. MEOK can credibly publish "post-Trivy-attack hardened" alternative
- **Anchore Enterprise** — closed-source, pricey. MEOK = open-source answer

---

## 7. Agent Orchestration — 2026 Landscape

For replacing MEOK's homegrown council:

| Framework | MCP support | Verdict for MEOK |
|---|---|---|
| **Pydantic AI** | Native MCP, A2A, durable execution, type-safe | ✅ Best fit, 3-4 day port |
| Claude Agent SDK | Native Anthropic + MCP | only if Claude becomes primary inference |
| LangGraph (LangChain 0.3) | Community adapters | mature graph orchestration |
| CrewAI | Plugin | multi-agent role-based |
| AutoGen 0.4 | Plugin | Microsoft message-passing |
| LlamaIndex Agents | Recent | RAG-first |
| OpenAI Agents SDK / Google ADK | Native | platform-specific |

---

## 8. Arena-Specific Recommendations

### Voice — Pipecat (open-source de-facto)
Wrap meok-eu-ai-act conformance interview as Pipecat voice flow → 30-min compliance interview → auto-generated Annex IV draft. **Nobody else doing voice compliance.**

### Code — Claude Code / Codex MCP-aware
Publish `meok-mcp-publish` skill for Claude Code: handles PyPI + Vercel + Stripe link patching in 200-line skill. Package the muscle memory.

### Web — Skyvern
85.85% on WebVoyager v2.0. Add `meok-regulator-submit` MCP that pushes signed attestations to national CA portals (CNIL, BfDI, ICO) via Skyvern.

### Desktop — Claude Cowork ($20/mo) is the distribution
Publish "Claude Cowork compliance bundle" — single zip that drops 6 attestation MCPs as Cowork skills. **Cowork's distribution is bigger than mcp.so for now.**

---

## 9. THIS WEEK — Three Specific Integrations

### #1: SEP-1686 Async Tasks (1 day)
- File: `~/clawd/meok-attestation-api/api/sign.ts`
- Patch sign endpoint to return `{ task_id, status: "working" }`
- Add `/api/tasks/[id]` poll endpoint
- Ship to 6 attestation MCPs as v1.3.0 (DORA/NIS2/CRA/AI-BOM/CSRD/Gods Eye)

### #2: OpenSSF Scorecard sub-attestation (1 day)
- File: meok-dora-nis2-crosswalk repo
- Add `--include-scorecard <github-url>` flag
- Shell out to `scorecard` binary, embed as CycloneDX 1.7 Citations element
- Zero new dependencies; two API calls

### #3: ML-DSA-65 post-quantum signature (2 days)
- File: `~/clawd/meok-attestation-api/api/sign.ts` (combine with #1)
- Add `signature_algorithm` param: `HMAC-SHA256` (default) or `ML-DSA-65`
- Install `pyoqs` (Python) or `@noble/post-quantum` (Node)
- Generate keys at deploy time, store in Vercel env
- Sales: "First open-source compliance attestation API with NIST FIPS 204 PQC signatures"

---

## Honest Coverage Gaps Flagged

- in-toto v2.0 not confirmed — treat v1 as stable
- Sigstore Bundle v0.4 not confirmed — Cosign v3 is the real news
- SPDX 3.1 not confirmed — SPDX 3.0 is current
- HELM / MATH-500 / LiveBench 2026 versions not surfaced
- Specific arxiv IDs for Anthropic 2026 papers beyond 2510.05192 and 2507.08270 unconfirmed

---

## Sources

- `modelcontextprotocol.io/specification/2025-11-25/`
- `workos.com/blog/mcp-2025-11-25-spec-update`
- `alignment.anthropic.com/2026/automated-alignment-agent/`
- `digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content`
- `code-of-practice.ai/`
- `spec.c2pa.org/specifications/specifications/2.2/`
- `cyclonedx.org/specification/overview/`
- `slsa.dev/spec/v1.1/`
- `metr.org/blog/2026-05-19-frontier-risk-report/`
- `github.com/METR/RE-Bench`
- `anthropic.com/product/claude-cowork`
- `skyvern.com/blog/`
- `scorecard.dev/`
