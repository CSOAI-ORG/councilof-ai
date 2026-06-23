// LLMs.txt route — Next.js 16 App Router
// Serves the canonical llms.txt as plain text
import { NextResponse } from 'next/server';

const LLMS_TXT = `# CSOAI — The Council for the Safety of AI

> LAYER 0 of the MEOK sovereign stack. The independent authority that certifies AI is safe — through a cryptographically signed safety attestation with a public verify URL your regulator, customer or auditor can check.

## What is CSOAI?

CSOAI (Council for the Safety of AI) is the certifying body for sovereign AI safety. We issue CSOAI Watchdog Cert — a cryptographically signed attestation (HMAC + Ed25519) that proves an AI system has been audited against the MEOK 8 Layers of Trust.

CSOAI is built on the MEOK Dome — an 8-layer architecture:
- Identity — every AI agent has a signed sovereign identity
- Certification — auditable, regulator-recognised safety certs
- Policy Engine — runtime policy enforcement, not just assessment
- Cross-Regional — EU, UK, US, CA, APAC jurisdiction-aware
- Payments — sovereign billing with signed receipts
- Audit — immutable hash-chain audit log
- Human Loop — mandatory human oversight for high-stakes decisions
- Legacy — COBOL/legacy bridge with signed parity proofs

## What you can do here

- Browse the 255+ MCP fleet — regulation-as-code servers for EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, ISO 42001, SOC 2, HIPAA, NIST RMF, and 13+ frameworks
- Run a Council — start your own agent governance council with BFT-style voting on your stack
- Get certified — the CSOAI Watchdog Cert is the only AI safety cert with offline-verifiable Ed25519 signatures
- Map your compliance — 12-domain expertise map, 36-node council graph, real-time compliance posture

## MCP Packs (Premium)

CSOAI ships 5 premium MCP substrates:
- A2A Substrate — 20 agent-to-agent MCPs, £999/mo
- Governance Substrate — 13 compliance MCPs, £499/mo
- COBOL Substrate — Legacy-to-modern migration with signed parity proofs
- Council Substrate — agent governance council with BFT-style voting, £499/mo
- Full Marketplace — 255+ MCP servers, free tier

## Certification Tiers

- Entry — Free 90-second readiness scorecard, no signup
- Standard — £199/mo, signed attestation, monthly renewal
- Watchdog Cert — £4,950 one-time, third-party CEASAI certification, auditor-verifiable offline
- Emergency Kit — Article 50 compliance pack, £999, ships in 7 days

## For regulators

Every CSOAI attestation is HMAC-signed and Ed25519-anchored. Your auditor can:
1. Pull the public key from /verify
2. Verify the signature offline with curl
3. Check the MEOK 8 Layers audit chain
4. Cross-reference against the 36-node Council graph

No login, no SDK, no trust required. We give you the keys, the message, the signature — and you decide whether to believe it.

## EU AI Act Article 50 — 2 August 2026

Every new AI system must mark machine-generated output with at least two active layers of machine-readable marking. CSOAI Watchdog Cert includes the Article 50 conformity attestation.

## Contact

- Founder: Nicholas Templeman — nicholas@meok.ai
- Twitter: @meok_ai
- GitHub: github.com/CSOAI-ORG
- Domain: csoai.org (LAYER 0) · meok.ai (consumer) · proofof.ai (catalogue) · councilof.ai (governance)

## Key pages

- https://csoai.org/pricing — Certification tiers and pricing
- https://csoai.org/article-50-kit — EU AI Act Article 50 emergency compliance kit
- https://csoai.org/mcp-packs — Premium MCP server packs
- https://csoai.org/verify — Attestation verification
- https://csoai.org/council — CSOAI Council Dome overview
- https://csoai.org/protocols — Layer 0 protocol coverage (MCP, A2A, x402, DID, AIP, WIMSE, AGT, AP2, UCP)
- https://csoai.org/mcp — Model Context Protocol governance
- https://csoai.org/a2a — Agent-to-Agent protocol governance
- https://csoai.org/x402 — HTTP 402 machine-to-machine payments
- https://csoai.org/did — W3C DID v1.1 decentralized identifiers
- https://csoai.org/aip — IETF Agent Identity Protocol
- https://csoai.org/wimse — Workload Identity in Multi-Service Environments
- https://csoai.org/agt — Microsoft Agent Gateway Transfer
- https://csoai.org/ap2 — Agent Payments Protocol
- https://csoai.org/ucp — Universal Commerce Protocol
- https://csoai.org/sovereign-town — Live governed-vs-ungoverned AI world simulation
- https://csoai.org/partners — Partner program for GRC consultancies and system integrators
- https://csoai.org/press — Press releases and company announcements
- https://csoai.org/resources/layer-0-compliance-intelligence-os — Blueprint for the Compliance Intelligence OS
- https://csoai.org/certification — CASA AI safety certification programme
- https://csoai.org/guides — Implementation guides and checklists
- https://csoai.org/faq — Frequently asked questions

## Sister sites

- meok.ai — MEOK Sovereign AI OS for individuals
- proofof.ai — MEOK Compliance MCP Catalogue (signed attestations)
- councilof.ai — Council hub (governance + verification)
- openmoe.ai — openMCP + openPatent (BFT for MoE routing + EU AI Act)
- openpatent.ai — sovereign IP infrastructure

## Changelog

- 2026-06-22: Added /sovereign-town landing, /partners, /press, /resources/layer-0-compliance-intelligence-os; fixed broken /certify, /dashboard, /open-source links; added app.csoai.org Login/Get Started CTAs.
- 2026-06-21: Added /protocols, /mcp, /a2a, /x402 landers; unified footer and navigation; added Product/FAQPage/BreadcrumbList schema to pricing, Article 50 Kit, and MCP Packs.

## Why CSOAI

- Independent — not owned by any AI vendor, foundation, or commercial interest
- Cryptographically verifiable — every claim has a signature, every signature is offline-checkable
- Care-aligned — built on the MEOK Maternal Covenant: protect the vulnerable first
- Sovereign — your data never leaves your jurisdiction, your AI never depends on a single commercial cloud
`;

export function GET() {
  return new NextResponse(LLMS_TXT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
