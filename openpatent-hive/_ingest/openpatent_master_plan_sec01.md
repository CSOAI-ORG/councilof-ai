## 1. The OpenPatent GitHub Project — Full Analysis

### 1.1 Repository Deep Dive

#### 1.1.1 Project Identity and Scale

The `erdalbektas/OpenPatent` repository represents one of the few open-source attempts to build a comprehensive, local-first AI system for patent practitioners. Hosted on GitHub and developed by Tech Tank, a Turkey-based technology consultancy, the project carries 25 stars, 3 forks, and a codebase of 348MB as of early 2026[^1^]. Created in January 2026 under the MIT license, the repository is written primarily in TypeScript and built atop the OpenCode framework — an extensible local AI agent platform also maintained by the AnomalyCo collective[^2^].

The project's modest star count (25) and fork activity (3) place it firmly in the "early traction" phase of open-source adoption. For context, comparable legal-tech open-source projects such as `openlegal` and `patentminer` typically require 18–24 months to cross the 100-star threshold[^3^]. The 348MB repository size signals a substantial asset footprint — likely encompassing embedded model weights, template libraries, and the OpenCode runtime — suggesting that contributors have prioritized feature breadth over distribution optimization.

The project is developed and maintained by Tech Tank (techtank.com.tr), a Turkish technology consulting entity. The associated website, `openpatent.techtank.com.tr`, serves as the primary distribution and documentation hub[^4^]. At present, the domain generates negligible organic search visibility in English-language markets, indicating limited international marketing investment and an opportunity for a well-capitalized fork to capture SEO positioning.

#### 1.1.2 Architecture: A Local-First Agent System

OpenPatent's architecture departs meaningfully from the dominant cloud-centric paradigm in legal AI. Rather than routing sensitive patent data to third-party APIs by default, the system operates as a local AI agent framework where models, skills, and execution contexts run entirely on the host machine. This design choice directly addresses the confidentiality concerns that deter large patent firms from adopting AI tools — a 2024 survey by the International Association for the Protection of Intellectual Property (AIPPI) found that 67% of patent attorneys cite "data leakage risk" as the primary barrier to AI adoption[^5^].

The system defines six primary workflow agents, each mapped to a distinct phase of patent practice:

| Agent | Function | Patent Lifecycle Phase | PatentMCP Complement |
|---|---|---|---|
| **draft** | Generates applications, claims, specifications, abstracts, drawing descriptions from natural language input | Pre-filing disclosure → Application preparation | PatentMCP provides tamper-proof disclosure *before* drafting begins; OpenPatent consumes that disclosure as input |
| **prosecute** | Drafts office action responses, amendments, arguments | USPTO/EPO prosecution | None — PatentMCP does not handle prosecution |
| **consult** | Patentability, FTO, landscape, and validity-style analysis | Pre-filing assessment | PatentMCP's defensive publication data can feed into FTO analysis |
| **litigate** | Claim construction, infringement and invalidity-oriented outputs | Litigation / opposition | None — distinct domain |
| **manage** | Docket-style tracking, deadlines, status summaries | Portfolio administration | PatentMCP registry queries could populate portfolio metadata |
| **strategy** | Landscape and claim strategy support | Long-term portfolio planning | PatentMCP's prior art registry informs claim differentiation strategy |

*Table 1: OpenPatent primary agent architecture and PatentMCP integration mapping. Data sourced from repository README[^2^] and PatentMCP technical specification.*

Supplementing the primary agents, three specialist subagents handle narrow technical functions: **prior-art** (prior art search coordination), **analyst** (technical and legal analysis synthesis), and **claims-analyst** (claim scope and dependency analysis)[^2^]. This nine-agent structure (six primary + three specialist) provides granular decomposition of patent workflow tasks, enabling users to invoke specific capabilities without loading the entire system context. The agent model mirrors the design philosophy of emerging legal AI platforms such as Harvey and CoCounsel, though those systems operate exclusively via cloud APIs at substantially higher per-query cost[^6^].

#### 1.1.3 Tool Suite: The Patent-Primitive Layer

Beneath the agent orchestration layer, OpenPatent exposes seven patent-specific tools that function as the system's primitive operations: `patent-search` (structured prior art queries), `claim-parser` (claim text analysis and dependency mapping), `mpep-lookup` (Manual of Patent Examining Procedure retrieval), `docket-query` (deadline and status retrieval), `document-template` (structured document generation), `compliance-check` (formal requirements verification), and `citation-format` (reference formatting across patent jurisdictions)[^2^].

This tool suite reveals the project's explicit targeting of the U.S. patent system — the MPEP is a USPTO-specific document, and compliance-checking logic is typically jurisdiction-dependent. The absence of equivalent tools for EPO (European Patent Office), CNIPA (China National Intellectual Property Administration), or JPO (Japan Patent Office) frameworks suggests that a production deployment would require substantial localization investment for non-U.S. markets. The `patent-search` tool's integration with external patent databases (presumably USPTO PAIR, Google Patents, or Espacenet) is not fully documented in the public README, creating an integration risk that any fork would need to resolve.

#### 1.1.4 Technology Stack and Deployment Model

The system requires Bun 1.3+ as its JavaScript runtime, a choice that prioritizes performance — Bun's startup latency averages 3–5× lower than Node.js for CLI-driven applications[^7^] — but introduces a less common dependency that may complicate enterprise deployment pipelines. Model inference is abstracted behind an OpenAI-compatible API layer, enabling the system to consume local models via Ollama, LM Studio, or vLLM, or optionally route to cloud providers (OpenAI, Anthropic, Google)[^2^].

This dual-mode architecture — local by default, cloud-optional — represents a pragmatic compromise. Local execution via Ollama or vLLM eliminates per-query API costs and data exposure risks, but requires capable hardware: a 7B-parameter model consumes approximately 4–6GB of VRAM, while a 70B-parameter model suitable for complex claim drafting requires 40–80GB[^8^]. For patent firms without dedicated GPU infrastructure, the cloud fallback becomes operationally necessary, reintroducing the cost and confidentiality concerns the local-first design was intended to solve. A 2025 survey of Am Law 200 firms found that 78% maintain on-premises infrastructure for IP-related AI tools, suggesting the local-first approach aligns with market infrastructure[^9^].

### 1.2 Capabilities & Limitations

#### 1.2.1 What OpenPatent Delivers

OpenPatent's functional coverage spans the post-disclosure phases of the patent lifecycle. The **draft** agent handles the full spectrum of application documents — claims (independent and dependent), specifications (including detailed description and abstract), and drawing descriptions — from plain-language inventor input[^2^]. The **prosecute** agent generates office action responses, claim amendments, and legal arguments, which, if quality-controlled, could reduce attorney drafting time by 30–50% based on benchmarks from commercial AI legal drafting tools[^10^].

The **consult** and **strategy** agents address analytical tasks: freedom-to-operate (FTO) studies, patent landscape mapping, and validity assessments. These functions are typically billed at $15,000–$50,000 per engagement by traditional IP analytics firms[^11^]. Democratizing access through an open-source tool — even one requiring technical sophistication to deploy — could materially reduce barriers for solo practitioners and startups. The **litigate** agent's claim construction and infringement analysis capabilities extend into the enforcement phase, though the README does not disclose training data provenance or validation benchmarks that would support evidentiary use in proceedings.

Portfolio management through the **manage** agent covers docket-style deadline tracking and status summaries. This feature competes with established docketing systems ( Anaqua, CPA Global, Patrix) that charge $500–$2,000 per user annually[^12^]. OpenPatent's inclusion of this function within a unified agent framework, rather than as a standalone product, reflects an architectural bet that practitioners prefer integrated workflows over specialized point solutions.

#### 1.2.2 Critical Gaps: The Protection Layer

OpenPatent's architecture contains a fundamental omission: it contains no cryptographic disclosure mechanism, no blockchain anchoring, no tamper-proof prior art registry, and no defensive publication workflow[^2^]. The system begins its lifecycle at the *application drafting* phase — after an invention has already been conceived, documented, and potentially disclosed. This leaves a critical gap in the pre-filing "invention protection" phase, where establishing priority dates, proving conception, and creating defensible prior art records are paramount.

Specifically, OpenPatent does not:

- Cryptographically timestamp invention disclosures to establish legally defensible priority dates
- Anchor disclosure hashes to public blockchains (Bitcoin, Ethereum, or specialized registries) for immutable proof of existence
- Maintain a tamper-verifiable audit trail of claim evolution from first conception to filed application
- Publish defensive disclosures that would prevent competitors from patenting the same invention
- Verify the integrity of prior art citations through cryptographic means

These omissions are not design flaws — they reflect the project's scope boundary. OpenPatent is architected as a *drafting and prosecution* tool, not a *disclosure and protection* system. However, the absence means that any practitioner using OpenPatent alone lacks cryptographic evidentiary support if their priority date is challenged in interference proceedings, derivation proceedings, or post-grant review. The Leahy-Smith America Invents Act (AIA) switched the U.S. to a first-inventor-to-file system in 2013, making provable priority dates more consequential than under the previous first-to-invent regime[^13^].

#### 1.2.3 Complementary Architecture: Two Halves of a Whole

The capability gap between OpenPatent and PatentMCP is not competitive — it is complementary. PatentMCP's 6-layer cryptographic stack (SHA-3/512, HMAC-SHA256, Ed25519, Bitcoin OTS, C2PA, hash-chain audit) addresses precisely the "protection" phase that OpenPatent omits[^14^]. The 2,400-line Python codebase with 14 passing tests implements the `disclose`, `verify`, `search`, and `stats` tools that anchor invention disclosures to cryptographic registries, creating tamper-proof records of prior existence[^14^].

The functional division maps cleanly onto the patent lifecycle: PatentMCP handles the "invention protection" side (cryptographic disclosure, defensive publication, prior art registry, integrity verification), while OpenPatent handles the "patent application" side (drafting, prosecution, litigation support, portfolio management). Together, they cover the full lifecycle from conception through enforcement — a coverage breadth that no single open-source project currently achieves.

| Capability | OpenPatent | PatentMCP | Combined Value |
|---|---|---|---|
| Patent application drafting | **Full** — claims, specs, abstracts, drawings | None | End-to-end drafting with crypto-protected source disclosures |
| Office action prosecution | **Full** — responses, amendments, arguments | None | Prosecution backed by verifiable invention timelines |
| FTO / landscape analysis | **Full** — consult and strategy agents | None | Analysis enriched with defensive publication registry data |
| Cryptographic disclosure | None | **Full** — 6-layer crypto stack[^14^] | Legally defensible priority dates for all drafted applications |
| Blockchain anchoring | None | **Full** — Bitcoin OTS, hash-chain audit[^14^] | Immutable proof of invention existence pre-filing |
| Prior art registry | None | **Full** — full-text searchable registry[^14^] | Registered prior art feeds directly into consult agent analysis |
| Defensive publication | None | **Full** — $10/$50/$100 tiered fees[^14^] | Strategic publication to block competitor filings |
| Tamper-proof verification | None | **Full** — Ed25519 signatures, C2PA[^14^] | Document integrity verification throughout prosecution |
| Portfolio docketing | **Full** — manage agent | `stats` tool provides registry metrics | Unified portfolio view spanning applications and disclosures |
| Claim integrity audit | None | Hash-chain audit[^14^] | Full provenance tracking from disclosure through granted claim |

*Table 2: Capability matrix comparing OpenPatent and PatentMCP functional coverage. Gaps in each project are filled by the other, yielding complementary full-lifecycle coverage.*

The combined architecture creates a defensible moat: competitors offering drafting-only or protection-only solutions would need to replicate both codebases to match the integrated offering. Given OpenPatent's MIT license (see §1.3.1), this integration can proceed without legal encumbrance — a structural advantage unavailable with copyleft-licensed alternatives.

### 1.3 Fork/Extend Strategy

#### 1.3.1 License and Legal Risk Assessment

The MIT license governing OpenPatent permits unrestricted use, modification, distribution, and sublicensing — including commercial use — provided that the original copyright notice and license terms are included in all copies[^1^]. For the OpenPatent.ai platform, this translates to zero legal risk for forking the repository, modifying the codebase, integrating PatentMCP as a backend service, and distributing the combined system under a commercial SaaS model. The only obligation is attribution to the original authors (Erdal Bektaş and Tech Tank), a requirement that imposes negligible business friction.

This permissive licensing stands in contrast to the AGPL and GPL licenses that govern several competing open-source legal AI projects. The `Legal-LLM` project, for instance, carries an AGPL-3.0 license that would require SaaS providers to release their entire application source code[^15^]. OpenPatent's MIT licensing eliminates this viral clause risk, enabling proprietary extension without contamination concerns.

#### 1.3.2 Proposed Integration Architecture

The recommended integration model positions PatentMCP as the cryptographic disclosure and verification backend, with OpenPatent serving as the frontend drafting and workflow UI. In this architecture:

1. An inventor submits a disclosure through PatentMCP's `disclose` tool, receiving back a SHA-3/512 hash and blockchain anchor transaction ID
2. The verified disclosure — now cryptographically timestamped and tamper-proof — is passed as structured input to OpenPatent's **draft** agent
3. The **draft** agent generates claims, specifications, and abstracts with full provenance linkage to the original disclosure hash
4. Throughout prosecution, PatentMCP's `verify` tool can validate that drafted documents have not been altered from their cryptographically signed originals
5. Defensive publications registered through PatentMCP populate a prior art corpus that the **consult** and **strategy** agents query during FTO and landscape analysis

This integration preserves the modular boundaries of both projects while creating data flows that enhance each system's utility. The OpenCode framework's agent architecture should accommodate custom tool integrations — adding PatentMCP's four tools (`disclose`, `verify`, `search`, `stats`) as additional patent-primitive operations alongside the existing seven-tool suite.

#### 1.3.3 Competitive Position and Market Entry Timing

The current OpenPatent website (`openpatent.techtank.com.tr`) generates minimal competitive SEO presence in English-language patent tool searches. Domain authority metrics for Turkish `.com.tr` subdomains targeting English keywords are typically suppressed in Google U.S. and European search rankings[^16^]. This SEO vacuum creates a first-mover opportunity for a properly capitalized fork targeting English-speaking patent practitioners — the largest addressable market for patent tools, representing approximately 45% of global patent filings[^17^].

The Tech Tank team's Turkey-based operation likely imposes timezone and language constraints on support and community engagement. A fork operated by a U.S.- or EU-based entity with native English documentation, responsive support channels, and targeted content marketing could capture the market segment that the original project structurally cannot reach. The 25-star repository, while early-stage, has validated product-market fit within a niche technical audience — the strategic imperative is now scaling that validation to a global practitioner base through the PatentMCP integration and professionalized distribution.
