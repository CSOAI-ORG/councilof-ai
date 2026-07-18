# SOVEREIGN CHARTER API — COMPLETE ENDPOINT REFERENCE
## CSOAI Ltd · UK Companies House 16939677

> **All charter operations exposed via JSON-RPC at `http://localhost:3101/mcp`.** Every call is authenticated, Ed25519-signed, and recorded in the SIGIL audit chain. Public verification at `https://proofof.ai/verify/{charter_id}`.

---

## 1. SOV3 MCP TOOLS (the substrate)

### 1.1 Charter Operations

| Tool | Endpoint | Auth | Description |
|---|---|---|---|
| `sov_charter_query` | `/mcp tools/call` | public | Look up a charter by article, industry, or hive slug |
| `sov_crosswalk_get` | `/mcp tools/call` | public | Get cross-walk mapping between two frameworks/hives |
| `sov_charter_list_all` | `/mcp tools/call` | public | List all 35 sovereign charters with metadata |

### 1.2 BFT Council Operations

| Tool | Endpoint | Auth | Description |
|---|---|---|---|
| `submit_council_proposal` | `/mcp tools/call` | pre-registered agent | Submit a new proposal for ratification |
| `vote_on_proposal` | `/mcp tools/call` | pre-registered agent | Cast a vote (for/against/abstain) on an open proposal |
| `get_council_proposals` | `/mcp tools/call` | public | List open/voted/closed proposals |
| `get_council_proposal` | `/mcp tools/call` | public | Get full proposal details + vote breakdown |
| `sov_bft_vote` | `/mcp tools/call` | left-brain agent | Left-brain BFT vote with care-membrane check |
| `sov_protocol_bft_gate` | `/mcp tools/call` | pre-registered agent | Gate sensitive actions through BFT council |

### 1.3 SIGIL Chain Operations

| Tool | Endpoint | Auth | Description |
|---|---|---|---|
| `sov_sigil_emit` | `/mcp tools/call` | any | Emit signed SIGIL record to the audit chain |
| `sov_sigil_verify` | `/mcp tools/call` | public | Verify a SIGIL digest against the chain |
| `sigil_transcript` | `/mcp tools/call` | public | Read recent signed SIGIL exchanges |

### 1.4 Sovereign Identity

| Tool | Endpoint | Auth | Description |
|---|---|---|---|
| `sov_did_create` | `/mcp tools/call` | keypair holder | Create a new W3C DID with Ed25519 keypair |
| `sov_did_resolve` | `/mcp tools/call` | public | Resolve a W3C DID to its DID document |
| `sov_jwt_sign` | `/mcp tools/call` | keypair holder | Sign a JWT with Ed25519 |
| `sov_jwt_verify` | `/mcp tools/call` | public | Verify a JWT signature + expiry |

### 1.5 Hive Operations

| Tool | Endpoint | Auth | Description |
|---|---|---|---|
| `mcp_meok_king_list_hives` | `/mcp tools/call` | public | List all 34 sovereign hives |
| `mcp_meok_king_king_ask` | `/mcp tools/call` | public | Ask the King hive a question, get domain-routed answer |
| `mcp_meok_king_queen` | `/mcp tools/call` | public | Ask a specific hive's queen directly (MoE+BFT scoped) |

---

## 2. CHARTER-SPECIFIC MCP TOOLS

### 2.1 Tier 1 — AI Governance (12 hives)

| Hive | MCP Tools |
|---|---|
| **csoai** | `csoai-governance-crosswalk-mcp`, `a2a-governance-bridge-mcp`, `csrd-compliance-mcp`, `dora-compliance-mcp`, `eu-ai-act-compliance-mcp` |
| **meok** | `meok-attestation-api`, `meok-compliance-gateway` |
| **proofof** | `meok-attestation-api` |
| **safetyof** | `care-membrane-mcp`, `ai-incident-reporting-mcp`, `deepfake-detector-mcp`, `a2a-governance-bridge-mcp` |
| **accountabilityof** | `ai-incident-reporting-mcp`, `ai-self-audit-mcp`, `a2a-governance-bridge-mcp` |
| **ethicalgovernanceof** | `meok-governance-engine-mcp`, `care-membrane-mcp`, `ai-bom-mcp`, `explainability-report-mcp`, `a2a-governance-bridge-mcp`, `csrd-compliance-mcp` |
| **transparencyof** | `explainability-report-mcp`, `ai-bom-mcp`, `watermarking-authenticity-mcp`, `a2a-governance-bridge-mcp` |
| **biasdetectionof** | `bias-detection-mcp` |
| **dataprivacyof** | `dataprivacy-ai-mcp`, `gdpr-compliance-ai-mcp`, `hipaa-compliance-mcp`, `a2a-governance-bridge-mcp` |
| **asisecurity** | `cybersecurity-ai-mcp`, `owasp-agentic-mcp`, `security-scanner-ai-mcp` |
| **agisafe** | `care-membrane-mcp`, `ai-self-audit-mcp`, `deepfake-detector-mcp` |
| **defoneos** | 15 defence MCPs (TAK/CoT, Sensor Fusion, ISR Pipeline, Counter-Drone, Cyber, JSP 936, MEDEVAC, Edge, Neural OOWM, BFT, SIGIL, Protocols, PQC, Sovereign, Globe) |

### 2.2 Tier 2 — Technical Infrastructure (11 hives)

| Hive | MCP Tools |
|---|---|
| **councilof** | `agent-orchestrator-mcp`, `agent-negotiation-mcp`, `csoai-governance-crosswalk-mcp` |
| **openmoe** | `openmoe-bft`, `openMCP` |
| **openmcp** | `openMCP` |
| **openpatent** | (BFT configurator on openpatent.ai) |
| **sandbox** | `meok-self-diagnostics-mcp` |
| **sovereign-town** | `sovereign-gate-mcp`, `council-12-around-1-mcp`, `care-validation-mcp`, `koikeeper-ai-mcp`, `episode-writer-mcp` |
| **meok-compliance-gateway** | `meok-compliance-gateway` |
| **loopfactory** | `cron-ai-mcp`, `webhook-ai-mcp` |
| **optimobile** | (mobile analytics MCP — TBD) |
| **socialmediamanager** | (social AI MCP — TBD) |
| **cobolbridge** | `cobol-bridge-mcp` |

### 2.3 Tier 3 — Industry Verticals (11 hives)

| Hive | MCP Tools |
|---|---|
| **commercialvehicle** | `logistics-ai-mcp`, `compliance-checker-ai-mcp` |
| **diyhelp** | `diy-ai-mcp`, `howto-ai-mcp` |
| **fishkeeper** | `fishkeeper-ai-mcp`, `pet-care-ai-mcp` |
| **grabhire** | `recruitment-ai-mcp`, `resume-parser-ai-mcp`, `lead-scoring-ai-mcp`, `muckaway-ai-mcp`, `compliance-checker-ai-mcp`, `logistics-ai-mcp` |
| **koikeeper** | `fishkeeper-ai-mcp`, `k25-vision` |
| **landlaw** | `landlaw-ai-mcp`, `legal-document-ai-mcp`, `contract-review-ai-mcp`, `compliance-checker-ai-mcp` |
| **muckaway** | `muckaway-ai-mcp`, `logistics-ai-mcp`, `compliance-checker-ai-mcp` |
| **planthire** | `planthire-ai-mcp`, `logistics-ai-mcp`, `compliance-checker-ai-mcp` |
| **pokerhud** | `poker-ai-mcp`, `gto-ai-mcp` |
| **suicidestop** | `suicidestop-ai-mcp`, `crisis-line-router-ai-mcp` |
| **science** | (research MCPs — TBD) |

---

## 3. JSON-RPC EXAMPLES

### 3.1 Query a Charter

```bash
POST http://localhost:3101/mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "sov_charter_query",
    "arguments": {
      "slug": "defoneos",
      "article": "III"
    }
  }
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "charter_id": "CSOAI-CHARTER-defoneos-2026-06-30",
    "title": "DEFONEOS — Defence AI OS",
    "article_iii": "Free Training Pathway: 4 tiers (Foundation/Practitioner/Lead Auditor/Director) with detailed modules and 6 UE5 simulation scenarios...",
    "verified": true,
    "sigil_digest": "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7"
  }
}
```

### 3.2 Get Cross-Walk Mapping

```bash
POST http://localhost:3101/mcp

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "sov_crosswalk_get",
    "arguments": {
      "source": "fishkeeper",
      "target": "dataprivacyof"
    }
  }
}
```

### 3.3 Submit BFT Proposal

```bash
POST http://localhost:3101/mcp

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "submit_council_proposal",
    "arguments": {
      "title": "Ratify Charter XYZ",
      "description": "Motion to ratify...",
      "category": "governance",
      "urgency": "high"
    }
  }
}
```

### 3.4 Vote on Proposal

```bash
POST http://localhost:3101/mcp

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "vote_on_proposal",
    "arguments": {
      "proposal_id": "proposal_8742dd7759d3",
      "agent_id": "your-pre-registered-agent-id",
      "vote": "for",
      "reasoning": "Charter Article 0 binds all hives. 1,122 cross-walks enable universal governance."
    }
  }
}
```

### 3.5 Emit SIGIL

```bash
POST http://localhost:3101/mcp

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "sov_sigil_emit",
    "arguments": {
      "line": "H|JEEVES|csoai|some action description"
    }
  }
}
```

### 3.6 Verify SIGIL

```bash
POST http://localhost:3101/mcp

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "sov_sigil_verify",
    "arguments": {
      "digest": "c3b2e2ebbe76cbbe"
    }
  }
}
```

### 3.7 Create W3C DID

```bash
POST http://localhost:3101/mcp

{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "sov_did_create",
    "arguments": {
      "name": "CSOAI Ltd",
      "controller": "https://csoai.org"
    }
  }
}
```

---

## 4. PUBLIC VERIFICATION ENDPOINTS

### 4.1 proofof.ai/verify

Any charter's signature can be publicly verified:

```
https://proofof.ai/verify/CSOAI-CHARTER-{hive-slug}-{date}
```

Examples:
- `https://proofof.ai/verify/CSOAI-CHARTER-csoai-2026-06-30`
- `https://proofof.ai/verify/CSOAI-CHARTER-defoneos-2026-06-30`
- `https://proofof.ai/verify/CSOAI-CHARTER-coigndaltion-2026-06-30`

### 4.2 sovereign.wiki

Cross-walk explorer + charter database:
- `https://sovereign.wiki/charter/{hive-slug}`
- `https://sovereign.wiki/crosswalk?from={source}&to={target}`
- `https://sovereign.wiki/verify/{cert-id}`

---

## 5. WEBHOOK SUBSCRIPTIONS

Subscribe to charter events:

```bash
POST https://webhook.csoai.org/subscribe

{
  "url": "https://your-endpoint.com/hook",
  "events": [
    "charter.amended",
    "council.vote.cast",
    "council.proposal.ratified",
    "sigil.emitted",
    "cert.issued",
    "cert.verified"
  ]
}
```

Event payload (example):
```json
{
  "event": "council.vote.cast",
  "timestamp": "2026-07-01T12:34:56Z",
  "proposal_id": "proposal_8742dd7759d3",
  "agent_id": "agent_007",
  "vote": "for",
  "signature": "9a7f...e0f9"
}
```

---

## 6. AUTHENTICATION

### 6.1 Public Endpoints
- Read charter files, query cross-walks, verify SIGILs — no auth needed.

### 6.2 Authenticated Endpoints
- Vote, submit proposals, emit SIGILs, create DIDs — require pre-registered agent identity.

### 6.3 Identity Flow
```
1. Generate Ed25519 keypair locally
2. Call sov_did_create({name, controller, public_key})
3. Receive DID (did:csoai:agent-XXX)
4. Use DID for all authenticated calls
5. SIGIL chain records every action
```

### 6.4 Rate Limits
- Public reads: 100/min/IP
- Authenticated writes: 50/min/agent (SOV3 LLM06)
- BFT council votes: 1/proposal/agent

---

## 7. ERROR CODES

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request — missing/invalid arguments |
| 401 | Unauthenticated — agent ID not pre-registered |
| 403 | Forbidden — action violates Charter Article 0 or red lines |
| 404 | Charter/tool not found |
| 429 | Rate limited — wait 65s |
| 500 | Server error — check SOV3 logs |
| 503 | SOV3 offline — try remote endpoint |

---

## 8. SDKs & CLIENTS

| Language | Install | Repository |
|---|---|---|
| **Python** | `pip install sovereign-charter-sdk` | github.com/CSOAI-ORG/sovereign-charter-python |
| **TypeScript** | `npm install @csoai/charter-sdk` | github.com/CSOAI-ORG/sovereign-charter-ts |
| **Go** | `go get github.com/csoai-org/charter-sdk` | github.com/CSOAI-ORG/sovereign-charter-go |
| **Rust** | `cargo add sovereign-charter` | github.com/CSOAI-ORG/sovereign-charter-rust |
| **Swift** | `swift package add csoai/charter-sdk` | github.com/CSOAI-ORG/sovereign-charter-swift |

---

## 9. CHARTER OF CHARTERS — THE ROOT ENDPOINT

The Charter of Charters is the root document of the sovereign universe:

```
https://proofof.ai/verify/CSOAI-ROOT-CHARTER-2026-06-30
```

It contains:
- 8 Articles (sovereign foundation + industry domain + training + compliance + cross-walk + signature + black swan + living)
- 34 Black Swan Windows
- Clean House Protocol
- 5 Sovereign Principles
- Charter Article 0 (binding on all)

---

## 10. FUTURE ENDPOINTS (Q3 2026)

- `sov_article50_passport` — issue Article 50 watermarking passport
- `sov_audit_export` — export audit trail for regulators
- `sov_bft_configure` — provision custom BFT council on demand
- `sov_ubi_claim` — claim UBI tier upgrade
- `sov_cert_revoke` — revoke a certification (quorum required)

---

> *"Every charter is a tool. Every tool is a query. Every query is signed. Every signature is anchored. The sovereign substrate is queryable, auditable, and sovereign by design."* 🐉