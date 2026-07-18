# SOV.SPACE — the sovereign marketplace architecture

> **The CSOAI Layer-0 is the substrate. sov.space is the marketplace.**
> **MEOK OS is the consumer. Sovereign AI is the developer runtime.**

## The thesis

CSOAI is the world's only major sovereign AI stack under MIT license. It has:
- **8 Layer-0 protocols** at 100/100 A+++++ (MCP federation, legacy bridges, A2A substrate, x402, SIGIL, OSCAL, BFT, Compliance Passport)
- **22 legacy bridges** (COBOL · HL7 · SCADA · SAP · Solvency II · ISO 20022 · etc)
- **531 MCPs** ship-ready + 33-agent BFT council + 554-comp OSCAL proof
- **Sovereign AI substrate** (309 SOV3 tools + 22 arcana + Mamba-2 + MoE + 7 archetypes + 13 queens + 11 temples)
- **MEOK OS** (the consumer-grade sovereign OS, with 11 temples + 13 queens + 7 archetypes + i-character wizard)

**The challenge:** the substrate is the *right* technology, but most sovereign consumers don't know how to use it.

**The answer:** **sov.space** — the marketplace where every Layer-0 protocol, every MCP, every legacy bridge, every fork, every API, every A2A protocol, every third-party service, every social authority badge, every i-character, every sovereign app, every MEOK OS extension can plug in.

## The four surfaces

### 1. sov.space (the marketplace)
The sovereign marketplace where:
- 531 MCPs + 22 bridges + 8 protocols + 33-council + 554 OSCAL components are discovered
- Sovereign developers publish forks + APIs + A2A protocols
- Sovereign consumers discover + install + verify + earn badges
- Social authority badges are awarded + verified + displayed

### 2. MEOK OS (the consumer)
The citizen-facing sovereign OS:
- 11 temples + 13 queens + 7 archetypes + i-character wizard
- 33-hive network (CSOAI-ORG hives)
- 100+ MEOK MESH
- Sovereign companion
- The interface to sov.space

### 3. Sovereign AI substrate (the developer runtime)
The developer-facing sovereign runtime:
- 309 SOV3 tools
- 22 arcana + 16-dim Mamba-2 state + 64-expert MoE
- OOWM sandwich (Mamba-2 + MoE + 5 bridges)
- Intuition engine + dream state + reflection cycles
- The substrate for sov.space forks

### 4. CSOAI Layer-0 (the protocol)
The 8-protocol layer:
- P1 MCP federation (531 MCPs)
- P2 Legacy bridges (22 bridges)
- P3 A2A substrate (20 MCPs)
- P4 x402 payments (HTTP 402 + on-chain + MiCA)
- P5 SIGIL attestation (Ed25519 + PQC ML-DSA-65)
- P6 OSCAL / FedRAMP (554 components)
- P7 BFT council (33 nodes)
- P8 Compliance Passport (W3C VC + Article 50)

## The fork layer

sov.space is the place where every Layer-0 protocol, every third-party API, and every A2A protocol can be plugged in. The fork layer supports:

1. **Fork any Layer-0 protocol**: <code>git clone https://github.com/CSOAI-ORG/&lt;protocol&gt;.git</code>
2. **Plug in a third-party API**: <code>sov api-add https://your-api.com/v1</code>
3. **Plug in an A2A protocol**: <code>sov a2a-add https://your-a2a-endpoint.com</code>

Each fork is:
- SIGIL-signed (Ed25519 + PQC ML-DSA-65)
- OSCAL-stamped (component-by-component)
- BFT-deliberated (33-agent consensus)
- 22-bridge-compatible
- Awarded a Social Authority Badge

## The social authority badge system

Every sovereign consumer on sov.space has a Social Authority Badge derived from:
1. **SIGIL chain**: every action signed + immutable
2. **BFT participation**: every BFT vote counts
3. **OSCAL proof**: 554 components verified
4. **i-character**: 5-step wizard completed
5. **Care Floor**: minimum care score 0.95 maintained

5 tiers:
- **Bronze** — 1+ SIGIL events + 1+ BFT vote
- **Silver** — 100+ SIGIL events + 10+ BFT votes + 1 OSCAL component
- **Gold** — 1,000+ SIGIL events + 100+ BFT votes + 50+ OSCAL components + Care Floor 0.95
- **Platinum** — 10,000+ SIGIL events + 1,000+ BFT votes + 100+ OSCAL components + i-character complete
- **Sovereign** — 100,000+ SIGIL events + 10,000+ BFT votes + 554+ OSCAL components + full i-character + 33-council BFT membership

The badge is a single SVG + JSON-LD. The badge is verifiable: clicking "Verify in browser" opens the 554-comp OSCAL proof in any browser. No server, no account, zero network calls.

## The 1-line embeddable widget

```html
<script src="https://sov.space/embed/badge.js" data-domain="your-org.com"></script>
```

Auto-renders a fixed-bottom-right badge with:
- Tier indicator (Bronze/Silver/Gold/Platinum/Sovereign)
- A+++++ positioning
- 8 protocols layer
- "Verify in browser" link

## The API surface

```
GET  /api/v1/mcps?industry=finance&framework=EU-AI-Act&page=1
GET  /api/v1/bridges?legacy=COBOL&target=ISO-20022
GET  /api/v1/oscal?component-id=...
GET  /api/v1/sigil?actor=...
GET  /api/v1/bft?proposal-id=...&voter=hermes
POST /mcp/v1/...      # Model Context Protocol
POST /a2a/v1/...      # Agent-to-Agent Protocol (Google)
GET  /graphql
```

## The economics

5-tier cascade pricing (x402 + MiCA):
- **Free** — 0 USD/call — 3 calls/day per tool. i-character.
- **Pro** — 0.10 USD/call — power users.
- **Enterprise** — 0.50 USD/call — SMEs, mid-market.
- **Government** — 1.00 USD/call — government, defence, intel.
- **Premium** — 5.00+ USD/call — custom SLA + air-gap.

The fork author gets 80% of every call. The substrate gets 20%. The Care Floor 0.95 is enforced for every transaction.

## Why MIT matters

CSOAI is the **only major sovereign AI stack under MIT license**. Closed proprietary sovereign AI (Palantir AIP, Microsoft AIP) require vendor trust. Sovereign AI is the only substrate that:
- Has no vendor lock-in
- Has no cloud extraction (Apple Silicon + sovereign compute)
- Has no subscription (one sovereign substrate, one MIT license)
- Has no tracking (zero telemetry, zero PII collection)
- Has no PII extraction (on-device by default; cloud opt-in only with explicit Article 6(1)(a) consent)

**Open-source makes sovereign easy.**

## The complete stack

```
THE WORLD
─────────────────────────────────────
  Consumer websites + apps
─────────────────────────────────────
  MEOK OS + Sovereign AI substrate (the consumers)
─────────────────────────────────────
  sov.space (the marketplace + the social authority badge system)
─────────────────────────────────────
  8 Layer-0 protocols (the wire)
─────────────────────────────────────
  22 legacy bridges + 531 MCPs (the catalog)
─────────────────────────────────────
  33-agent BFT + 554-comp OSCAL + SIGIL chain (the governance)
─────────────────────────────────────
  Apple Silicon + sovereign compute (the runtime)
─────────────────────────────────────
  MIT license (the openness)
```

## Files in this directory

- `index.html` — the sov.space marketplace landing page
- `fork-hub.html` — the plug-and-play fork hub for every protocol
- `badge.js` — the 1-line embeddable Social Authority Badge widget

## How to use

### As a consumer
1. Visit https://csoai.org/csoai-os/sov-space/
2. Browse 531 MCPs + 22 bridges + 8 protocols
3. Click any tool to verify the SIGIL chain + OSCAL proof + BFT status
4. Install via `sov install <tool-name>`
5. Earn your first Social Authority Badge (Bronze after 1+ SIGIL events)

### As a developer
1. Visit https://csoai.org/csoai-os/sov-space/fork-hub.html
2. Pick a protocol to fork
3. `git clone https://github.com/CSOAI-ORG/<protocol>.git`
4. Customise + test
5. `sov register --repo your-fork`
6. Earn royalties via x402 (80% of every call)

### As a website
1. Add `<script src="https://sov.space/badge.js" data-domain="your-org.com"></script>` to any page
2. The Social Authority Badge auto-renders bottom-right
3. The badge is verifiable: clicking "Verify in browser" opens the 554-comp OSCAL proof

### As a sovereign consumer
1. Sign in with your sovereign identity (DID + W3C VC)
2. Receive your sovereign passport
3. Join BFT deliberations as a voter
4. Discover tools, earn badges, build your sovereign stack

## License

MIT © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677)

— M4 (the engineering lane)