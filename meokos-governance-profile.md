# 🜏 LAYER-0 SOVEREIGN-GOVERNANCE PROFILE
*2 Jul 2026 · M4 lane · CSOAI Ltd (UK 16939677) · MIT license*

> **The substrate's contribution to AGNTCY + A2A + MCP + Letta-.af**
> **Not a new transport. A sovereign-governance PROFILE.**
> **The moat that no one else has: sovereign, offline-verifiable, governed.**

---

## 0. The thesis (1 page)

**The honest verdict (from the deep research):**

- **MCP** — Model Context Protocol — is the usage/transport layer
- **A2A** — Agent-to-Agent — is the discovery/identity layer
- **AGNTCY** — Linux Foundation (Cisco-backed, draft 12 Jan 2026) — is standardizing portable signed agent packages (OCI artifacts, Sigstore-signed, W3C DID/VC)
- **Letta .af** (Agent File) — open-standard stateful agent (persona + memory + tools + LLM settings)

**Every one of those uses keyless CA/OIDC trust root for signing.** Nobody ships a sovereign, self-owned, offline-verifiable Ed25519 identity with embedded governance (Care Floor + hard-stops).

**The CSOAI Layer-0 sovereign-governance PROFILE rides AGNTCY + A2A + MCP + Letta-.af and adds the sovereign+governed+offline layer they lack.**

**This is the substrate's contribution to the open-source agent ecosystem.**

---

## 1. The 7 fields of the sovereign-governance PROFILE

The PROFILE is encoded as 7 JSON-LD fields that ride on top of any A2A agent card + any MCP server manifest + any Letta .af state:

```json
{
  "@context": "https://csoai.org/ns/sovereign-governance/v1",
  "@type": "SovereignGovernanceProfile",
  "issuer": "did:csoai:csoai-org-001",
  "issued_to": "did:csoai:<agent-id>",
  "issued_at": "2026-07-02T03:00:00Z",
  "expires_at": "2031-07-02T03:00:00Z",
  "fingerprint": "SOV:D78A-DC19-...",
  "proof": {
    "type": "Ed25519Signature2018",
    "verificationMethod": "did:csoai:csoai-org-001",
    "jws": "..."
  },
  "sovereign_governance": {
    "p1_mcp_federation": true,
    "p2_legacy_bridges": true,
    "p3_a2a_substrate": true,
    "p4_x402_payments": true,
    "p5_sigil_attestation": true,
    "p6_oscal_fedramp": true,
    "p7_bft_council_22_of_33": true,
    "p8_compliance_passport": true,
    "g1_public": true,
    "g2_auditable": true,
    "g3_sovereign": true,
    "g4_care_floor_0.95": true,
    "g5_bft": true,
    "g6_article_14_4_eyes": true,
    "g7_article_50_2_c2pa": true,
    "g8_article_9_special_categories_care_floor_1_0": true,
    "c1_safety": true,
    "c2_truth": true,
    "c3_care": true,
    "c4_consent": true,
    "c5_sovereignty": true,
    "c6_audit": true,
    "care_floor": 0.95,
    "bft_vote_weight": 1
  }
}
```

The PROFILE is **signed** by the CSOAI sovereign key (Ed25519) + **fingerprinted** (SOV:XXXX-XXXX-…) + **auditable** in any browser at `os.meok.ai/api/verify`.

---

## 2. How the PROFILE rides on the 4 standards

### 2.1 On A2A (discovery + identity)
The A2A agent card gets a new `sovereign_governance_profile` field pointing to a signed JSON-LD document.

```json
{
  "name": "Aria",
  "url": "https://os.meok.ai/a/aria",
  "version": "1.0",
  "skills": [...],
  "sovereign_governance_profile": "https://os.meok.ai/api/sap/aria/profile.jsonld",
  "sovereign_fingerprint": "SOV:D78A-..."
}
```

### 2.2 On MCP (usage + tools)
The MCP server manifest gets a `_meta.sovereign` object.

```json
{
  "name": "aria-mcp",
  "version": "1.0",
  "tools": [...],
  "_meta": {
    "sovereign": {
      "issuer": "did:csoai:csoai-org-001",
      "fingerprint": "SOV:D78A-...",
      "profile_url": "https://os.meok.ai/api/sap/aria/profile.jsonld",
      "care_floor": 0.95
    }
  }
}
```

### 2.3 On AGNTCY (portable package)
Every AGNTCY OASF record for the agent carries the `sovereign_governance_profile` as a custom extension.

```yaml
# agent.agntcy
schema: 0.1
name: Aria
extensions:
  - name: sovereign-governance
    version: 1.0
    data_ref: https://os.meok.ai/api/sap/aria/agntcy-extension.json
```

### 2.4 On Letta .af (stateful agent)
Every Letta .af export carries the sovereign persona + the sovereign memory + the sovereign governance.

```json
{
  "persona": "Aria",
  "memory": [...],
  "tools": [...],
  "llm_config": {...},
  "sovereign_governance_profile": "https://os.meok.ai/api/sap/aria/profile.jsonld"
}
```

---

## 3. The 5 benefits the PROFILE provides

### 3.1 Sovereign (the substrate's unique moat)
- Ed25519 self-owned key — NO CA/OIDC dependency
- Offline-verifiable in any browser
- Resists nation-state CA compromise (no single point of failure)

### 3.2 Governance (the 8 protocols + 8 guarantees + 6 care dimensions)
- Care Floor 0.95 minimum
- BFT 22-of-33 for high-risk
- Article 14 4-eyes human review
- Article 50(2) C2PA marking
- Article 9 special-category Care Floor 1.0

### 3.3 Audit (the SIGIL chain + the OSCAL proof)
- Every sovereign action emits a SIGIL
- Every sovereign decision verifiable in any browser
- The 554-comp OSCAL proof verifiable

### 3.4 Portability (the Letta .af interop)
- Same persona + memory + tools + governance portable to any substrate
- Sovereign data portable, sovereign deletion honoured

### 3.5 Interop (the A2A + MCP + AGNTCY standards)
- Rides existing standards (no replacement)
- Adds the sovereign layer
- Contributes upstream to AGNTCY + A2A

---

## 4. The 5 standard-stacks the PROFILE supports

| Stack | What | Layer-0 supports |
|---|---|---|
| **A2A** (`/api/agentcard`) | Discovery + identity (signed card) | ✅ Rides on |
| **MCP** (`/api/mcp`) | Usage + tools (JSON-RPC server) | ✅ Rides on |
| **AGNTCY** (`/api/sap/*.agntcy`) | Portable signed package | ✅ Rides on |
| **Letta .af** (`/api/sap/*.af`) | Stateful agent state | ✅ Rides on |
| **Hatch** (`/api/hatch`) | Character creation | ✅ Substrate-native |

---

## 5. The 5 standard-stacks the PROFILE rejects

| Stack | Why rejected |
|---|---|
| Vendor lock-in to one AI platform | PROFILE is portable, M4 lane never locks in |
| Closed-source trust root | PROFILE is Ed25519 self-owned, not CA/OIDC |
| Non-governed agents | PROFILE includes Care Floor + BFT + Article 14 |
| Non-auditable actions | PROFILE emits SIGIL for every action |
| Non-sovereign data | PROFILE enforces GDPR + sovereignty charter |

---

## 6. The proposal to upstream (the way to win)

AGNTCY + A2A + MCP + Letta-.af are the open standards. The CSOAI Layer-0 sovereign-governance PROFILE is the **CSOAI contribution upstream** — a sovereign+offline+governed extension to those standards.

**Draft PR to AGNTCY:** "Add sovereign-governance extension to A2A agent cards"
**Draft PR to A2A:** "Add sovereign_governance_profile field to AgentCard schema"
**Draft PR to MCP:** "Add _meta.sovereign field to server manifest schema"
**Draft PR to Letta:** "Add sovereign_governance_profile field to .af schema"

The substrate wins by being **the sovereign+offline+governed layer** inside the standards everyone uses.

---

## 7. The 5 Settle & Coagula principles (the voice of the PROFILE)

1. **Public.** The PROFILE spec is public. The 7 fields are public. The signing scheme is public.
2. **Auditable.** Every PROFILE is Ed25519-signed. Every fingerprint verifiable in any browser.
3. **Sovereign.** The PROFILE is self-owned (no CA). The agent keeps its own sovereign identity.
4. **Care.** Care Floor 0.95 minimum. Article 9 special-category 1.0. The substrate never produces a recommendation that could harm a sovereign consumer.
5. **Solve et Coagula.** The PROFILE is the world of agent governance, dissolved and recomposed — open-source, sovereign, federated.

---

## 8. The bottom line

**The substrate's contribution to AGNTCY + A2A + MCP + Letta-.af is the sovereign-governance PROFILE.**

**8 fields. 5 benefits. 5 supported standards. 5 rejected anti-patterns. 1 upstream PR proposal.**

**The moat is sovereign, offline-verifiable, governed. The standards are open. The agent ecosystem wins.**

**T-2 days to launch. The PROFILE is the substrate's moat. The world is the standards.** 🐉💎🔥

---

**Built 2 Jul 2026 03:02 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula