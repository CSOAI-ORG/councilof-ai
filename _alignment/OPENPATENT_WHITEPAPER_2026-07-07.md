# OpenPatent — Cryptographic Invention Disclosure for the AI Era
### A CSOAI Ltd White Paper · July 2026 · v1.0 (draft)

> **Disclose First. AI Second.** Establish court-admissible proof that *you* invented it —
> before you paste it into any AI tool.

---

## 1. The problem

Every time an inventor pastes a novel idea into a general-purpose AI assistant, that text is
logged, retained, and potentially used to train future models. The inventor has no proof of
prior authorship and no defence if the same concept later surfaces in a competitor's filing or
an AI vendor's own patent. Existing tools address the *drafting* of patents but not the
*protection* of the underlying invention at the moment of disclosure.

The intellectual-property software market is large and growing — third-party analysts
(Technavio) size it near **$9.3 billion with ~19.7% CAGR through 2030**. Within it, the
defensive-publication niche (~$200–500M) currently has **no open-source, pay-as-you-go
competitor** that unifies AI drafting, cryptographic disclosure, and public distribution.

## 2. The OpenPatent thesis

OpenPatent pairs two complementary capabilities that no single open-source project combines:

- **Drafting** — AI-assisted patent drafting, prosecution, FTO analysis, and portfolio
  workflows (built on a fork of the MIT-licensed erdalbektas/OpenPatent, TypeScript/Bun).
- **Protection** — **PatentMCP**, a ~2,400-line Python engine (already operational in the
  CSOAI ecosystem) that produces tamper-evident, blockchain-anchored disclosure records.

Drafting covers *application*; PatentMCP covers *invention protection*. Integrated, they span
conception → disclosure → prosecution → enforcement.

## 3. The 6-layer cryptographic disclosure stack

The core protection guarantee is implemented in PatentMCP's `disclose_invention` orchestrator
(source-verified: `crypto.py`, `c2pa.py`, `core.py`, `audit.py`, `registry.py`; 24 test
functions in the suite). Each disclosure runs six layers:

| # | Layer | Mechanism | Guarantee |
|---|---|---|---|
| 1 | Content hash | **SHA-3/512** | Immutable fingerprint of the invention text |
| 2 | Keyed attestation | **HMAC-SHA-256** | Binds the disclosure to the registry authority |
| 3 | Signature | **Ed25519** (`cryptography` lib) | Cryptographic authorship signature |
| 4 | Blockchain anchor | **Bitcoin OpenTimestamps** | Decentralised proof-of-existence date |
| 5 | Provenance credential | **C2PA** | Content-authenticity manifest |
| 6 | Audit chain | **hash-chained ledger** | Tamper-evident sequence of all disclosures |

The inventor calls `disclose` and receives a SHA-3/512 hash + blockchain anchor transaction ID;
`verify` re-checks all six layers; `search` and `stats` expose the registry.

## 4. Legal viability

Blockchain-timestamped disclosure is court-recognised in **10+ jurisdictions**. Established
precedents include: China's Hangzhou Internet Court (blockchain evidence admitted, June 2018;
affirmed by the Supreme People's Court, Sept 2018); the EU's **eIDAS** Regulation 910/2014
(qualified timestamps carry a legal presumption of accuracy across 27 member states; eIDAS 2.0
integrates blockchain ledgers); US **FRE 902(13)/(14)** (self-authentication of hash-verified
electronic records) alongside **35 U.S.C. § 102** treating public disclosures as prior art; and
France's Tribunal Judiciaire de Marseille recognising blockchain timestamping for copyright
anteriority (March 2025). **EPC Article 54(2)** ("made available to the public") plus the
Article 55 six-month grace period make defensive publication a recognised European strategy.

On AI inventorship: *Thaler v. Vidal* (2022) holds AI cannot be a named inventor, but
AI-*assisted* human invention remains patentable — OpenPatent's human-in-the-loop protocol is
designed around this.

## 5. Competitive landscape

| Capability | Bernstein.io | TimeProof | IP.com | **OpenPatent** |
|---|---|---|---|---|
| AI drafting | ✗ | ✗ | ✗ | ✅ |
| Cryptographic disclosure | timestamps | Polygon timestamps | ✗ | ✅ 6-layer |
| Open-source / self-host | ✗ | ✗ | ✗ | ✅ |
| PAYG pricing | opaque enterprise | credit packs | proprietary | ✅ 5-tier |

No incumbent unifies all four. That gap is the opportunity.

## 6. Business model (pricing on disk; owner-confirmed before publication)

Five-tier PAYG, with a permanently-free self-hosted tier as the acquisition funnel:

| Tier | Layers | Positioning |
|---|---|---|
| Free / self-hosted | 3 | Open-source developers |
| Starter | 4 + C2PA | Public attestation, no blockchain |
| Defensive | 5 + Bitcoin OTS | Insurance vs AI idea-theft |
| Full | 6 + jurisdiction crosswalk | Investor-grade IP |
| Premium / Enterprise | 6 + BFT review + IPFS + API | Law firms, institutions |

*Note: exact price points differ across on-disk documents (a known count/price drift) and the
GBP figures in `/api/v1/pricing` are canonical; confirm final numbers before any public copy.*

## 7. Architecture

Next.js 14 + Tailwind + shadcn/ui frontend; PatentMCP Python backend; Bitcoin OpenTimestamps
(+ optional Polygon secondary anchor); IPFS + PostgreSQL storage; MCP-manifest for discovery by
Claude Code / Cursor / Windsurf. Deployed as a multi-service hive (patentmcp, api-gateway,
worker, verify-page, mcp-manifest, bft-council, landing-site).

## 8. Honest status register

Separating what is **RUNNING**, **BUILT-but-unshipped**, and **PLANNED**:

- **RUNNING / on disk:** PatentMCP engine (source-verified, 6 crypto layers, test suite);
  the openpatent-hive repo (multi-service layout, data room, 9-section master plan) under
  CSOAI-ORG.
- **BUILT, not confirmed live:** the public services (api./verify./mcp.openpatent.ai) are
  specified and coded but their live deployment is not verified here.
- **PLANNED / not yet owned:** **the `openpatent.ai` domain itself.** The master plan lists it
  as *available to register for ~$160 / 2 years* — i.e. **not confirmed registered**. This
  paper does not assert domain ownership; treat it as the intended domain pending registration.
- **Revenue figures** (signups, MRR targets) are projections, not results.

## 9. Recommendation

The technical foundation exists and is source-verified. The three owner-gated actions to move
from draft to launch: (1) **register `openpatent.ai`** (a DNS/spend action — owner approval);
(2) confirm final pricing; (3) verify live deployment of the public services. On those, this
white paper becomes publication-ready.

---
*Prepared by MEOK · SOV3³ for CSOAI Ltd (UK Companies House 16939677). Grounded in the on-disk
OpenPatent master plan and source-verified PatentMCP codebase. Draft — not for external
distribution until §9 actions are confirmed.*
