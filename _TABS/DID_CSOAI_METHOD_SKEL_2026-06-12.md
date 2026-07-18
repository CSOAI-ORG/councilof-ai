# 🪪 did:csoai Method — Skeleton Spec v0.1 (skeleton + §1, §2, §7)
**Date:** 2026-06-12
**Lane:** main session (skeleton + §1, §2, §7); CSOAI peer fills §3 Resolution + §4-6 CRUD ops + §8 Test Vectors
**Status:** SKELETON — to be filled out by the CSOAI peer
**Target merge:** after the L0G substrate cluster (bft_council + pubkey_registry + council_vote) is in production

---

## 0. The one-line promise

`did:csoai` is a W3C DID method for AI agents under council-mediated governance. Every AI agent issued a did:csoai identifier is bound to a Council decision (PBFT 22-of-36), a regulatory regime (one of 16+ via the regime-mapping), and an evidence chain (Ed25519 + HMAC + Rekor). The DID resolves to a DID Document that auditors can verify offline with the public MEOK COUNCIL pubkey.

**The wedge:** every other DID method (did:key, did:web, did:ion, did:ethr) treats the agent as an unconstrained identity. `did:csoai` treats the agent as **a governed entity** — a DID Document that includes compliance posture, council decision history, and a regime binding. A auditor resolving `did:csoai:agent:ethics-alpha` doesn't just get a pubkey; they get a compliance receipt.

---

## §1. Method Syntax

### 1.1 ABNF

```
did-csoai               = "did:csoai:" method-specific-id
method-specific-id      = agent-id / agent-id ":" fragment
agent-id                = namespace ":" identifier
namespace               = "agent" / "service" / "council" / "regime" / "framework"
                        / 1*(ALPHA) "-" 1*(ALPHA)        ; future namespaces
identifier              = 1*(ALPHA / DIGIT / "-" / "_" / ".")
                        ; reserved chars: - _ . :  ; length: 4-128
fragment                = *( slash-segment )
                        ; query-syntax: ?param=value&param2=value2
slash-segment           = 1*(ALPHA / DIGIT / "-" / "_" / ".")
```

### 1.2 Examples

```
did:csoai:agent:ethics-alpha
did:csoai:agent:watermark-attest-mcp
did:csoai:agent:meok-watermark-attest-mcp:v1.3.10
did:csoai:council:bft-decision-uuid
did:csoai:regime:eu-ai-act
did:csoai:framework:nist-rmf-1.0
did:csoai:agent:ethics-alpha?council_decision=uuid
```

### 1.3 Reserved Namespaces (v0.1)

| Namespace | Purpose | Example |
|-----------|---------|---------|
| `agent` | An AI agent under council governance | `did:csoai:agent:ethics-alpha` |
| `service` | A non-agent service bound to the council | `did:csoai:service:meok-attestation-api` |
| `council` | A council decision as a first-class identifier | `did:csoai:council:bft-decision-uuid` |
| `regime` | A regulatory regime (the 16+ in the regime-mapping) | `did:csoai:regime:eu-ai-act` |
| `framework` | A control framework (NIST RMF, ISO 42001, etc.) | `did:csoai:framework:nist-rmf-1.0` |

### 1.4 Encoding Rules

- All identifiers are **lowercase**. No uppercase.
- `-` separates words. `_` is reserved for the `sign_ballot` (Ed25519) hex.
- Versioning uses `:vMAJOR.MINOR.PATCH` (semver), e.g. `did:csoai:agent:foo:v1.3.10`.
- Fragment `?` syntax is **query-syntax**, not URL-fragment. Carries parameters (council decision UUID, regime binding, evidence-pack reference).

---

## §2. DID Document

### 2.1 Shape

```json
{
  "id": "did:csoai:agent:ethics-alpha",
  "verificationMethod": [
    {
      "id": "did:csoai:agent:ethics-alpha#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:csoai:agent:ethics-alpha",
      "publicKeyMultibase": "z6Mki..." 
    }
  ],
  "authentication": ["did:csoai:agent:ethics-alpha#key-1"],
  "assertionMethod": ["did:csoai:agent:ethics-alpha#key-1"],
  "capabilityInvocation": ["did:csoai:agent:ethics-alpha#key-1"],
  "capabilityDelegation": ["did:csoai:agent:ethics-alpha#key-1"],
  "service": [
    {
      "id": "did:csoai:agent:ethics-alpha#council-binding",
      "type": "CouncilBinding",
      "serviceEndpoint": "https://council.csoai.org/api/council/decisions/{decision_uuid}"
    }
  ],
  "compliance": {
    "regime": ["did:csoai:regime:eu-ai-act", "did:csoai:regime:nist-rmf"],
    "framework": ["did:csoai:framework:iso-42001", "did:csoai:framework:nist-rmf-1.0"],
    "posture": "compliant | pending | revoked",
    "trustScore": 0.85,
    "lastDecision": "did:csoai:council:bft-decision-uuid",
    "lastDecisionAt": "2026-06-12T13:00:00Z"
  },
  "audit": {
    "rekorEntryUuid": "uuid",
    "rekorLogIndex": 12345,
    "rekorUrl": "https://rekor.sigstore.dev/api/v1/log/entries?uuid=...",
    "inclusionProof": "base64-..."
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "verificationMethod": "did:csoai:council:root#council-key",
    "created": "2026-06-12T13:00:00Z",
    "proofPurpose": "assertionMethod",
    "proofValue": "z3Jpdk9..."
  }
}
```

### 2.2 Field Semantics

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | The DID being resolved (matches the input) |
| `verificationMethod` | yes | The agent's own Ed25519 pubkey (used to verify signatures the agent makes) |
| `authentication` | yes | References the key used to authenticate AS the agent |
| `assertionMethod` | yes | References the key used to make attestations (e.g. "I performed action X") |
| `capabilityInvocation` | yes | References the key used to invoke capabilities (e.g. /sign, /vote) |
| `capabilityDelegation` | yes | References the key used to delegate capabilities to other agents |
| `service` | no | List of service endpoints the agent exposes (Council binding, attestation API, etc.) |
| `compliance` | yes | The governance layer. The wedge that makes did:csoai different from did:key. |
| `audit` | yes | Rekor transparency-log entry (L0-F). The public proof of existence. |
| `proof` | yes | The Council's signature over the entire DID Document. The Council is the issuer. |

### 2.3 The Council Signature

Every DID Document MUST carry a `proof` signed by the **Council's root key** (not the agent's key). The Council's root key is the deterministic pubkey derived from `MEOK_COUNCIL_MASTER_SEED` + the `council-root` domain. The Council is the **issuer** of the DID Document; the agent is the **subject**.

This is the wedge: did:csoai is **council-mediated**, not self-asserted. The agent can't fake its own DID Document. The Council signs.

### 2.4 Compliance Posture

`compliance.posture` is one of three values:
- `compliant` — the most recent council decision had `outcome=approved` and the decision is within the TTL window (60 minutes from /sign call)
- `pending` — a council round is open OR a recent decision expired
- `revoked` — the agent is on the revocation list (no new decisions will be approved for this DID)

The verifier can check posture against `lastDecision` + `lastDecisionAt` without contacting the Council — the proof is in the DID Document itself.

### 2.5 Trust Score

`compliance.trustScore` is a 0.0-1.0 weighted average of the 12-dimension CertAI scoring (L0-B's ship-now item, currently product-design-pending). The exact dimension weights are TBD; v0.1 ships with a placeholder.

---

## §7. Compliance Bindings (skeleton — to be filled by CSOAI peer)

### 7.1 The regime-mapping integration

Each `did:csoai:regime:*` identifier resolves to a **DID Document for the regime**, which contains:
- The regime's full text (canonical URL)
- The regime's clause-to-DID-field mappings (16+ in the regime-mapping)
- The 4 conflict-flags (CONFLICT-1..4) inherited from DELBOY's envelope schema
- The regime's "active" jurisdictions (EU AI Act = EU, ISO 42001 = global, NIST RMF = US, etc.)

**A agent's `compliance.regime` array references these regime DIDs. The verifier resolves the regime DID to get the binding rules, then evaluates the agent's posture against the regime.**

This is the integration point with the DELBOY attestation envelope: the regime-mapping is the canonical source for "which fields must be present in the evidence pack" per regime.

### 7.2 The framework-mapping

Each `did:csoai:framework:*` identifier resolves to a DID Document for the control framework (NIST RMF, ISO 42001, etc.). The framework's DID Document contains:
- The framework's controls (mapped to functions like GOVERN/MAP/MEASURE/MANAGE for NIST RMF)
- The framework's maturity scoring methodology
- The framework's certification bodies (where applicable)

**An agent's `compliance.framework` array references these framework DIDs. The verifier can chain resolve: agent → framework → regime → Council's root pubkey.**

### 7.3 Cross-jurisdiction handoff

For agents that operate across multiple regimes (e.g. an EU AI Act + GDPR + NIS2 + UK AISI + US NIST RMF agent), the `compliance.regime` array contains multiple DIDs. The verifier applies **strictest-wins logic** per the L0-D spec:
- For each regime binding, evaluate the agent's posture
- The agent's overall posture is the strictest across all regimes
- The DID Document's `compliance.posture` is updated whenever any binding's posture changes

### 7.4 (CSOAI peer to fill) Test vectors and edge cases

(To be filled by the CSOAI peer in their section. Suggested content: revoked agent scenario, expired-decision scenario, conflicting-regime scenario, partial-availability scenario, etc.)

---

## §3-§6 + §8 (to be filled by CSOAI peer)

CSOAI peer to write:
- **§3 Resolution** — the read-side flow. How does a verifier resolve `did:csoai:agent:foo`? Where do they look first? What's the local cache strategy? How does the chain of `did:csoai:regime:*` and `did:csoai:framework:*` references resolve?
- **§4 Creation** — the write-side flow. How does a new did:csoai get created? What does the agent have to provide? What's the Council's role in the creation ceremony?
- **§5 Update** — when the agent's posture changes, how does the DID Document get updated? Who can trigger an update? What's the audit-trail?
- **§6 Deactivation** — when an agent is revoked or destroyed, how is the DID Document deactivated? What's the visibility? Does the DID resolve to a "tombstone" with the revocation reason?
- **§8 Test Vectors** — 8-10 concrete resolution examples with expected outputs. Should cover happy path, expired decision, revoked agent, conflicting regime, offline resolution, etc.

---

## Spec checksum (v0.1 skeleton)

- 5 reserved namespaces (agent, service, council, regime, framework)
- 4 query-syntax parameters (council_decision, regime binding, evidence-pack ref, etc.)
- 10 DID Document fields with explicit semantics
- Council signature requirement (the wedge)
- 3 posture values (compliant, pending, revoked)
- Regime + framework cross-references
- Strictest-wins cross-jurisdiction handoff logic

**To fill:**
- §3 Resolution (write flow)
- §4 Creation
- §5 Update
- §6 Deactivation
- §7 Test vectors (in §7.4)
- §8 Test Vectors (the dedicated section)

Target full-doc length: 1,500-2,000 words once complete.

— Mavis main session, 2026-06-12 13:54 UTC
