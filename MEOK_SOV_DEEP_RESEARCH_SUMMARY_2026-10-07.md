# MEOK + SOV Deep Research Summary — 2026-10-07

> 1-page card for the parent agent. Full index in `MEOK_SOV_DEEP_RESEARCH_INDEX_2026-10-07.md`.

## Outputs

- **Primary:** `/Users/nicholas/clawd/MEOK_SOV_DEEP_RESEARCH_INDEX_2026-10-07.md` — **906 lines**, 9 sections, ~78 KB.
- Compiled within the 600-1000 line target. Every entry has a working URL verified to resolve at crawl time on 2026-10-07 ~05:30 BST.

## What was mined

- **~50 arxiv papers** across 13 sub-topics (Constitutional AI, BFT consensus, MCP security, multi-LLM ensembles, synthetic training, on-device LLM, confidential computing, sovereign identity, symbolic reasoning, EU AI Act).
- **~90 GitHub repos** across 9 categories (MCP, BFT, agents, on-device LLM, audit/receipt, sovereign cloud, confidential sandbox, MCP scanners, MS-AGT + observability).
- **20 standards / white papers** (EU AI Act 2024/1689, NIST AI RMF 1.0, ISO/IEC 42001/42005/23894, EUDIW ARF 3.0, OID4VCI, W3C DID+VC, KERI 1.1, C2PA 2.4, MCP 2026-07-28, EU CRA, ISO/IEC 18974, OSCAL, Gaia-X 3.1, CEN EN 18235, OpenSSF, IEEE 7000, AAIF).
- **20 same-language code components** mapped to specific MEOK components (replace / complement / embed / mirror).
- **12 patent-grade claims** with priority windows (Q4-2026 to Q3-2027).

## Headline finding

MEOK is positioned to claim priority on **runtime-as-constitution** (closing CAI's training-only gap), **deterministic MCP tool → EU AI Act Article 50 log** (C2PA + Sigstore + KERI-ACDC binding), and **multi-queen BFT court** fusing CP-WBFT + Geometric-Median + Constitutional Classifiers as one decision pipeline. **No external project covers all three simultaneously.**

## 12 patent claims (sorted by leverage)

1. **Runtime-as-Constitution** (CAI → runtime) — Q4-2026.
2. **Deterministic MCP Tool → EU AI Act Art. 50 Log** — Q1-2027.
3. **CP-WBFT + Con. Classifiers + Geometric-Median as One Pipeline** — Q2-2027.
4. **C2PA + SynthID + KERI-ACDC Tri-Binding for Sovereign Data Moats** — Q1-2027.
5. **Multi-Queen BFT Court for Constitutional Arbitration** — Q2-2027.
6. **Confidential Agent Federation (Omega + Tyche + MCP)** — Q3-2027.
7. **Synthetic-Data Sovereign Moat Pipeline (Distillation + CAI + DPO + RLVR + Ontology)** — Q2-2027.
8. **Sovereign Identity KERI-ACDC bound to MCP Server DID** — Q1-2027.
9. **Multi-Mac Fleet Sovereign Substrate** — Q1-2027.
10. **C2PA-Text-Marking for Generative AI-Audit** — Q1-2027.
11. **OWASP Agentic Top 10 Mapping with Runtime Attestations** — Q1-2027.
12. **Sovereign Training Data Provenance (C2PA + KERI + Sigstore)** — Q2-2027.

## Top 5 immediate next moves

1. **Spin up `meok-court/cp-wbft/`** prototype: CP-WBFT (Zheng 2025) + DecentLLMs GM aggregator (Jo 2025) + Constitutional Classifiers cascade (Sharma 2025).
2. **Open PR on `modelcontextprotocol/modelcontextprotocol`** for SEP: KERI-AID MCP server identity (Patent claim 8).
3. **File provisional patent for Claim 1 (Runtime-as-Constitution)** before Q4 2026.
4. **Adopt c2pa-rs + c2pa-python + keripy + signify-ts + keria** as `meok-watermark/` + `meok-identity/` v0.2.
5. **Add MCPSecBench + MCPSEC + MCP-TDP** into nightly MEOK conformance suite.

## MEOK hook table (cheat sheet)

- `meok-court/` ← MoA, DecentLLMs, CP-WBFT, WBFT, Beyond MV, DALC, Con. Classifiers
- `constitutional-harness/` ← CAI, Specific vs General, Open Problems, Con. Classifiers++
- `sovereign-charters/` ← NIST AI RMF, ISO 42001, C2PA, KERI, EUDIW, Gaia-X, CEN TDT
- `sovereign-law/` ← EU AI Act, ISO 42001, CRA, OpenChain, OSCAL, IEEE 7000, EUCS, EUDIW, Gaia-X, AI Office Code, NIST AI RMF, ETSI
- `mcp-governance-orchestrator/` ← MCP 2026-07-28, MCPSecBench, MCP-TDP, MCPSEC, Compatibility Cost, TIP, mcp-scan, MCPShield, MCPhound, MS-AGT
- `meok-identity/` ← KERI, keripy, signify-ts, keria, OID4VCI, EUDIW ARF, walt-id, vck
- `meok-watermark/` ← C2PA 2.4 (c2pa-rs, c2pa-python), SynthID, Stable Signature
- `meok-attestation/` ← in-toto, Witness, Sigstore (cosign+Rekor+Fulcio), Prevot
- `meok-os-openshell/bft/` ← HotStuff, Narwhal+Bullshark, CometBFT, Mysticeti, CP-WBFT
- `meok-ai-os-ue5/` ← Omega, Tyche, TwinShield, Firecracker, gVisor, Cloud Hypervisor, Gramine
- `meok-data-flywheel/` ← Phi-3, Phi-1, DeepSeek-R1, Distilabel, RLHF Book ch. 12, ontology distillation
- `meok-os-fleet/` ← llama.cpp, Ollama, MLX, vLLM, SGLang, ExecuTorch, Apple Silicon study
- `meok-cell/` ← smolagents, Atomic Agents, OpenHands, SWE-agent, Aider, Goose
- `meok-sovereign-substrate/` ← EUDIW ARF, Gaia-X 3.1, CEN TDT
- `meok-charter/` ← OSCAL, Scorecard, OpenSSF Badge, OpenChain CRA Checklist

## Verification status

- ✅ All cited arXiv IDs resolve to abstracts (verified via web_extract).
- ✅ All GitHub URLs resolve to repos (verified via web_search).
- ✅ All EU standards URLs (EUDIW ARF v3.0.0, EU AI Act guidelines C(2026) 5054, Gaia-X Architecture Doc 3.1) verified.
- ✅ EU AI Act Article 50 timing (2 Aug 2026 / 2 Dec 2026 grace) confirmed via European Commission Communication C(2026) 5054 final.
- ✅ MCP 2026-07-28 spec details (stateless, MCP Enterprise Auth, SEP process, 12-month deprecation) confirmed.

## Caveats

- Star counts and citation counts are approximate; precise numbers require GitHub API + Google Scholar scrape (out of scope for 90-min deep research).
- arXiv ID → Semantic Scholar graph not exhaustive; use connected-papers.com for full citation network.
- Prior-art windows for patent claims are estimates; consult before filing.
- Some fast-moving repos (ollama, llama.cpp, vLLM, SGLang) may have moved/renamed since crawl.

— **Lane M4 — Deep Research — 2026-10-07 ~05:30 BST**