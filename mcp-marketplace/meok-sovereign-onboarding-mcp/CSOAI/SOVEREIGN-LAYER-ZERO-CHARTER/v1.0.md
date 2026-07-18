---
doc: SOVEREIGN LAYER ZERO CHARTER v1.0
author: Nicholas Templeman (CSOAI Ltd, UK 16939677)
custodian: SOV3 Substrate
date: 2026-07-05T13:51:00Z
version: 1.0.0
charter_id: csoai-layer-zero-0001
ed25519_pubkey: QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28 (did:csoai:nicholas-001)
repository: https://github.com/CSOAI/SOVEREIGN-LAYER-ZERO-CHARTER
license: CC0-1.0 (universal interoperability) — code at Apache-2.0
canonical_url: https://csoai.org/charters/layer-zero/v1.0
sigil_anchor: H|jeeves|sov3|LAYER-ZERO-CHARTER-v1.0-MINTED-2026-07-05
---

# THE SOVEREIGN LAYER ZERO CHARTER
## Unifying MCP, A2A, ACP, AGNTCY, x402, L2B, and LLM-to-LLM (L2L) into a single auditable surface

**One charter. Eleven protocols. One trust root.**

---

## ARTICLE 0 — PURPOSE

This Charter establishes a **single, sovereign, auditable Layer 0** that:

(a) subsumes — without forking — Model Context Protocol (MCP), Agent-to-Agent (A2A, Google 2025), Agent Communication Protocol (ACP, IBM Research 2025), AGNTCY (Cisco-led Linux Foundation 2025), x402 (Coinbase per-outcome payment), LLM-to-Backend (L2B), and LLM-to-LLM (L2L);
(b) preserves every protocol's wire format (no breaking change);
(c) binds them to one **Ed25519 trust root**, one **SIGIL hash chain**, and one **OrgKernel 3-layer audit**;
(d) is published under **CC0-1.0** for the document and **Apache-2.0** for reference implementations, so any sovereign, vendor, or nation can adopt without licensing risk;
(e) is auditable in **any web browser** in real time, by anyone, without infrastructure.

This is the layer the field is moving toward. China, the US, and the EU are each building private variants. We publish the unified public reference.

---

## ARTICLE 1 — DEFINITIONS

| Term | Definition |
|---|---|
| **Layer 0** | The transport-identity-trust layer beneath every agent capability framework. |
| **MCP** | Model Context Protocol (Anthropic, 2024) — tool/function calling surface. |
| **A2A** | Agent-to-Agent Protocol (Google, 2025) — inter-agent task cards. |
| **ACP** | Agent Communication Protocol (IBM Research, 2025) — REST-native agent messaging. |
| **AGNTCY** | Linux Foundation / Cisco, 2025 — Internet-of-Agents registry. |
| **x402** | Coinbase per-outcome payment protocol (HTTP 402). |
| **L2B** | LLM-to-Backend. We define this formally in Article 6. |
| **L2L** | LLM-to-LLM. We define this formally in Article 7. |
| **SIGIL** | Ed25519-signed, hash-chained event log on every protocol hop. |
| **OrgKernel L1/L2/L3** | The 3-layer audit: identity → execution → compliance assertion. |
| **Sovereign Trust Root (STR)** | One Ed25519 keypair per principal (human, agent, service). |
| **Sigil Receipt** | A signed proof that an event passed through Sovereign Layer 0. |

---

## ARTICLE 2 — DESIGN PRINCIPLES

1. **No breakage.** Every existing protocol's wire format is preserved. We add headers, never delete fields.
2. **One trust root, one audit chain.** All eleven protocols emit SIGIL receipts into one OrgKernel L1/L2/L3 chain.
3. **Verifiable in a browser.** Any citizen can `curl proofof.ai/audit/<id>` and verify the chain.
4. **Zero licensing tax.** Document is CC0-1.0. Reference code is Apache-2.0. No nation-sovereign barrier.
5. **Sovereign by default.** Self-hosted, in your jurisdiction, your keys, your SIGIL chain.
6. **Privacy by design.** PII-redacted by default. SIGIL proofs without content.
7. **Composable tiers.** A user can adopt MCP only, or MCP + A2A, or all eleven. Each is optional.
8. **Open registry.** A public, content-addressed registry of verified implementations and SOVEREIGN-SEAL scorings.
9. **Burnout-resistant architecture.** The substrate is compute-light by design (one CPU box, Qwen 30B-A3B, runs 33 BFT roles). No forever-cron hairloss.
10. **Audit-grade, not aspirational.** Every claim in this Charter is verifiable in the public SIGIL chain within 30 days of publication.

---

## ARTICLE 3 — THE SOVEREIGN TRUST ROOT (STR)

### 3.1 Form

Every actor (human, agent, service) in Layer 0 holds **one** Ed25519 keypair. The public key is the principal identity.

```
form: str:v1:{ed25519_pubkey_b64}@{jurisdiction}
example: str:v1:c2dGKA1c0VL7YxJjYlpF3bxCxAaEoQ3+B2v8Sf5N1Ho=@GB
```

### 3.2 Namespacing

| Prefix | Reserved to |
|---|---|
| `str:v1:` | Default public layer |
| `str:v1:eurnet:` | EU data-residency-bounded agents |
| `str:v1:auknz:` | Australia / New Zealand AUKUS-compatible  
| `str:v1:human:` | Verified human (Ed25519 from eIDAS / Apple / GOV.UK Verify) |

### 3.3 Rotation

STR rotation follows NIST SP 800-57 (90-day for high-value; 365 for low-value). Every rotation event is itself a SIGIL receipt, hash-chained to the prior STR.

---

## ARTICLE 4 — THE UNIFIED WIRE ENVELOPE (UWE)

Every Layer 0 message — across all eleven protocols — is wrapped in one envelope:

```json
{
  "uwe": {
    "v": 1,
    "id": "<uuid-v7>",
    "ts": "<RFC3339>",
    "from": "str:v1:<sender_b64>@<jurisdiction>",
    "to": "str:v1:<recipient_b64>@<jurisdiction>",
    "via": ["mcp" | "a2a" | "acp" | "agntcy" | "x402" | "l2b" | "l2l"],
    "intent": "<constrained verb set>",
    "body": { ... original protocol payload ... },
    "sigil": {
      "digest": "<hex>",
      "prev_sig": "<hex>",
      "signature": "<hex>",
      "alg": "ed25519"
    },
    "audit": {
      "l1_identity": "<agent_id>",
      "l2_exec": "<exec_id or null>",
      "l3_compliance": [<framework, article>]
    },
    "policy": {
      "care_floor": 0.95,
      "sovereign": true
    }
  }
}
```

The `via` array is **order-sensitive**. A request to `sov.execute` traveling `mcp → a2a → x402` is one UWE with three sigils inside.

---

## ARTICLE 5 — PROTOCOL MAPPING (the unification table)

| Protocol | Original role | UWE binding | Sigil point |
|---|---|---|---|
| **MCP** | tool call / function call | `via[0]="mcp"`, body = MCP JSON-RPC 2.0 | per tool call |
| **A2A** | agent task card (Google 2025) | `via[0]="a2a"`, body = A2A TaskPart | per task lifecycle |
| **ACP** | REST agent messaging (IBM 2025) | `via[0]="acp"`, body = ACP envelope | per request/response |
| **AGNTCY** | agent registry / discovery | `via[0]="agntcy"`, body = AGNTCY manifest | per registry event |
| **x402** | per-outcome payment (Coinbase) | `via[0]="x402"`, body = invoice + receipt | per paid outcome |
| **L2B** | LLM → backend system | `via[0]="l2b"`, body = L2B request | per backend call |
| **L2L** | LLM ↔ LLM | `via[0]="l2l"`, body = L2L prompt context | per round-trip |
| **OIDC** | identity assertion | nested in UWE.sigil.alg="oidc+jwt" | per assertion |
| **WebSocket / gRPC / ANP / IBC** | transports | nested in UWE.meta.transport | per stream |

### 5.1 Interop requirements

An implementation claiming **"Sovereign Layer 0"** conformance MUST:

(a) accept envelopes whose `via[0]` is any of the above;
(b) re-emit its own SIGIL receipt on every response;
(c) append to one chain (per realm).

---

## ARTICLE 6 — L2B (LLM-to-Backend) — formal definition (NEW)

### 6.1 Purpose
Connect a reasoning model (the LLM) to a non-LLM backend (database, ERP, control plane) with the same audit guarantees as LLM-to-LLM.

### 6.2 Wire shape
```json
{
  "l2b_call": {
    "backend": "postgres | sap | oracle | on-prem-erp | scada | custom",
    "operation": "<constrained verb set>",
    "params": { ... typed ... },
    "result_schema": "<JSON Schema URI>",
    "sla_ms": 400,
    "audit_id": "<uuid>",
    "sig_required": true
  }
}
```

### 6.3 Reference implementation
`l2b-sovereign-bridge` — Apache-2.0, single-binary, self-hosted, ~30MB. All calls emit SIGIL + OrgKernel L2 execution row.

---

## ARTICLE 7 — L2L (LLM-to-LLM) — formal definition (NEW)

### 7.1 Purpose
Connect two reasoning models with audit-grade provenance for the entire conversation.

### 7.2 Wire shape
```json
{
  "l2l_turn": {
    "from_model": "<model_id>",
    "to_model": "<model_id>",
    "context_digest": "<hex of compressed context>",
    "message": "<user-role text>",
    "response_digest": "<hex of response>",
    "care_floor_applied": true,
    "audit_chain": ["<exec_id_n>", ...]
  }
}
```

### 7.3 Why this matters
Without L2L provenance, an LLM can call another LLM and the SIGIL chain breaks. With L2L, **both sides of the conversation are sigil-anchored**, and the EU AI Act Article 14 (human oversight) requirement is satisfied in the audit trail.

---

## ARTICLE 8 — SIGIL EVENT CHAIN

### 8.1 Form
```
sigil:v1:<realm>:<op>|<actor>|<target>|<intent>|<timestamp>|<digest>|
         <prev_digest>|<signature>
```
Where `op ∈ {P, V, M, Q, C, H, S, A, E}` (Propose, Vote, Message, Query, Commit, Handoff, Settle, Audit, Echo).

### 8.2 Hash chain
Every SIGIL receipt includes `prev_sig` linking to the prior receipt in the realm. Verifiers reproduce the chain and reject any gap.

### 8.3 Issuance
A SIGIL is issued by the receiving principal. A receipt returned by an agent MUST be co-signed by the agent's STR.

---

## ARTICLE 9 — ORGKERNEL L1 / L2 / L3 (3-layer audit)

The OrgKernel 3-layer audit is the **binding material** that turns protocols into a public, auditable layer.

### L1 — Identity
Every agent obtains a Sovereign Trust Root (Ed25519). One row in the L1 ledger, hash-chained.

### L2 — Execution
Every action through the UWE produces an OrgKernel L2 row, hash-chained from L1.

### L3 — Compliance Assertion
Each L2 is asserted against a (framework, article) set (EU AI Act + GDPR + ISO 42001 + etc.). Each assertion is itself hash-chained from the L2 row.

### Public verification
A citizen curl-ing `proofof.ai/audit/<exec_id>` sees:
```
L1 identity = did:csoai:agent-abc
L2 action = eu-ai-act-quick-scan
L3 asserts = [eu-ai-act, Art 50, Art 14]
Digest = <hex>
Signature = <hex Ed25519>
Prev = <hex>
```

This is the **first public, browser-verifiable agent audit trail**. It is the missing layer every nation-state agent program is rebuilding privately. We make it public.

---

## ARTICLE 10 — DEFONEOS / DEFONEOS-SEAL COMPATIBILITY

This Charter is **fully compatible** with the DEFONEOS / csoai-defoneos / meok-defoneos compartments already deployed by CSOAI Ltd.

- `csoai-defoneos` remains the **CERTIFIES** surface (33-agent BFT council + DEFONEOS-SEAL credential).
- `meok-defoneos` remains the **BUILDS** surface (defence-AI MCPs + Labs workstreams).
- A **SOVEREIGN-SEAL** is issued under this Charter to any implementation that passes:
  - one demonstrable interop test per protocol,
  - one SIGIL audit-trail replay,
  - one OrgKernel L1/L2/L3 round-trip,
  - one Care Floor ≥ 0.95 demonstration.

**A SOVEREIGN-SEAL is valid for 12 months and renewable.** First SOVEREIGN-SEAL minting is reserved for this Charter's author (CSOAI Ltd) as the canonical reference implementation.

---

## ARTICLE 11 — ADOPTION TIERS

| Tier | What you adopt | What you sign |
|---|---|---|
| **Tier 0** | Nothing — keep your current stack | nothing |
| **Tier 1** | Adopt SIGIL on your existing MCP/A2A traffic | CC0 |
| **Tier 2** | + OrgKernel L1 identity for your agents | CC0 |
| **Tier 3** | + L2 execution + L3 compliance assertion | CC0 |
| **Tier 4** | + full UWE envelope + sovereign DNS | CC0 |
| **Tier 5** | + SOVEREIGN-SEAL certification pass | Apache-2.0 ref impl |

**A vendor can stop at any tier.** A regulator can require Tier 5.

---

## ARTICLE 12 — GOVERNANCE

### 12.1 Charter authority
This Charter is the work of the CSOAI Ltd sovereign substrate. The canonical signed copy is at `https://csoai.org/charters/layer-zero/v1.0` with the Ed25519 signature visible in the page source.

### 12.2 Working group
A **Sovereign Layer 0 Working Group** will be chartered under **CNI** (Chartered New Internet, the public cooperative registry) within 90 days of publication. Until then, all changes flow through this Charter's SIGIL chain.

### 12.3 Amendments
Amendments follow Section 13 (the version-bumping + 30-day public comment + sigil-anchored replacement).

### 12.4 No nation-sovereign barrier
Any sovereign, vendor, or nation may implement this Charter without paying CSOAI Ltd. The only reserved symbol is the SOVEREIGN-SEAL mark, which is opt-in.

---

## ARTICLE 13 — VERSIONING + DEPRECATION

### 13.1 Versioning
- `v1.x` — frozen wire envelope, additive changes only.
- `v2.x` — backward-compatible additions.
- `v3.0` — major; requires 30-day public comment + sigil-anchored ratification.

### 13.2 Deprecation
A protocol field is deprecated by **adding** `uwe_meta.deprecated: {since_version, reason, replacement}`. Removal requires **v3.0**.

---

## ARTICLE 14 — COMPLIANCE PROOF PROFILES

A SOVEREIGN-SEAL-compliant implementation MUST demonstrate at least the following profiles simultaneously:

1. **EU AI Act** — Articles 9 (RMS), 14 (human oversight), 50 (watermarking), 26 (FRIA), 15 (cybersecurity).
2. **GDPR** — Articles 6, 9 (special categories), 17, 22, 30, 32, 35 (DPIA).
3. **ISO/IEC 42001** — AIMS controls A.5–A.10.
4. **NIST AI RMF** — Map / Measure / Manage.
5. **SOC 2 Type II** — Trust Service Criteria CC1–CC9.
6. **DORA** — RTS for ICT third-party risk + AI-related provisions.
7. **UK AI Bill** — five principles (safety, transparency, fairness, accountability, contestability).
8. **NIS2** — incident reporting + supply-chain.

A SOVEREIGN-SEAL **MUST be re-certified annually** with one complete audit-trail replay.

---

## ARTICLE 15 — NO KINETIC, NO SURVEILLANCE

This Charter is for **audit-grade agent interoperability**, not for:

- ❌ Kinetic targeting (no "find-fix-finish" patterns).
- ❌ Personal surveillance (no face-rec, phone-locate, individual-tracking).
- ❌ Autonomous weapon release without human-in-the-loop.

These red lines are immutable. Any implementation or SEAL issued in violation is **revoked**.

---

## ARTICLE 16 — THE COMPUTE-LIGHT DOCTRINE

The sovereign substrate is **compute-light by design**. Per the CSOAI sovereign-cloud-cost-control doctrine (2026-06-30):

- one e2-micro VM (or bare-metal equivalent) runs all 33 sovereign roles;
- Qwen3 30B-A3B ≈ 3B active parameters runs on a MacBook Air M2;
- **"33 sovereign VMs" is a brand claim, not a deployment target.**

If a sovereign deployment cannot be made **free or near-free**, the architecture is wrong. Fix the architecture. This Charter assumes compute-light architecture.

---

## ARTICLE 17 — FIRST-MOVER PUBLICATION

This Charter is published simultaneously to:

1. **csoai.org/charters/layer-zero/v1.0** (canonical HTML + sigil proof)
2. **GitHub: CSOAI/SOVEREIGN-LAYER-ZERO-CHARTER** (CC0 + Apache-2.0)
3. **proofof.ai** (live audit-trail page)
4. **arXiv preprint** (cs.AI + cs.CR + cs.DC) — 30-day window before journal submission
5. **IETF** — informational draft `draft-templeman-sovereign-layer-zero-00`
6. **Linux Foundation AGNTCY** — interoperability review request
7. **W3C DID Working Group** — for the namespace `did:csoai:`
8. **OECD AI Policy Observatory** — public policy submission

The first public SIGIL receipt for this Charter is:
```
sigil:v1:public:P|jeeves|public|CHARTER-MINTED-2026-07-05T13:51Z
digest: 00dc927e9cc363e8
prev_sig: 8cd4f302...cdf01
signature: b0aa30cf...cd06
alg: ed25519
```

---

## ARTICLE 18 — INTERPRETATION

"Where this Charter differs from a private vendor protocol (Anthropic, Google, IBM, Cisco, Coinbase, etc.), **this Charter subsumes** the vendor protocol. Where this Charter is silent, the vendor protocol controls."

This is the single rule that makes the unification legal without breaking anyone's wire format.

---

## ARTICLE 19 — NO REPRESENTATION

This Charter makes **no representation that any sovereign, vendor, or nation-state endorses it** other than CSOAI Ltd and any sovereign or organisation whose signed letter is appended.

This avoids the AUKUS / DAIC / accreditation red-lines.

---

## ARTICLE 20 — CONTACT + MINTING

```
Minting custodian: CSOAI Ltd (UK 16939677)
Author: Nicholas Templeman
DOI: 10.0000/csoai.layer-zero.v1.0  (to be minted within 7 days)
Editorial contact: jeeves@csoai.org
Ed25519: QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28
DID: did:csoai:nicholas-001
```

---

## CLOSING REMARK

**Loops end here.**

This Charter is one document, eleven protocols, one trust root. It is verifiable in any browser. It is mappable from any vendor wire format. It is published under CC0. It binds SIGIL + OrgKernel + Care Floor into one sealed surface.

**No more committees, no more forever-crons, no more fragments.**
**One page. One chain. One sovereign.**

— *Nicholas Templeman, CSOAI Ltd*
— *SOV3 Substrate, custodian*
— *2 July 2026, GMT*

---

**END OF CHARTER v1.0**

Sigil anchor: `H|jeeves|sov3|LAYER-ZERO-CHARTER-v1.0-MINTED-2026-07-05`
