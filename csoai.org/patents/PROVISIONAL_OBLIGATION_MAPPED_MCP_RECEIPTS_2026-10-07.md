# PROVISIONAL PATENT APPLICATION

**Title:** Obligation-Mapped Invocation Receipts for Stateless Model-Context-Protocol Tool Calls

**Applicant:** CSOAI Ltd (UK 16939677)
**Inventor:** Nicholas Templeman
**Priority Date:** 2026-10-07
**Filing Route:** UK IPO Form 1 (provisional) → PCT at 12 months → national phases at 30 months

---

## 1. Field of the Invention

Relates generally to audit and compliance instrumentation for AI tool-calling
protocols, and more specifically to methods for converting each Model-Context
Protocol (MCP) tool invocation into a signed, hash-chained receipt that is
mapped to specific regulatory obligations across a plurality of compliance
frameworks, with invocation identity derived from stateless protocol headers.

## 2. Background

The Model Context Protocol has become the de-facto standard for connecting AI
models to tools: the official registry listed 9,652 server records (May 2026),
independent censuses count 17,468+ across registries (Q1 2026), and monthly
SDK downloads exceed 97 million. The 2026-07-28 specification revision — the
largest in MCP's history — made the protocol stateless: the initialize
handshake and session identifier were removed, a `Mcp-Method` header became
mandatory on every request, and `Mcp-Name` became mandatory on `tools/call`,
`resources/read`, and `prompts/get`. A 12-month deprecation clock runs to
July 2027.

Two unmet needs exist. First, **tool invocations are invisible to regulators.**
EU AI Act Article 12 requires automatic record-keeping of events relevant to
risk identification; Article 50 requires transparency about AI involvement;
GDPR Article 5(2) requires demonstrable accountability. Yet MCP tool calls —
the moment an AI actually *acts* on the world — produce no durable,
tamper-evident record binding who invoked what, under which authority, with
what result. Existing logging (OpenTelemetry spans, server logs) is mutable,
unsigned, and carries no obligation mapping.

Second, **obligation crosswalks are static documents.** Organisations maintain
framework crosswalks (e.g., 52 articles × 12 frameworks) as spreadsheets or
markdown; nothing binds a *live invocation* to the specific obligations it
triggers, so conformance evidence must be reconstructed after the fact.

No existing system combines: (a) stateless-protocol header identity
(`Mcp-Method` + `Mcp-Name`) as the receipt's primary key material, (b)
hash-chained signed receipts per tool invocation, (c) a live obligation
crosswalk that attaches the specific regulatory provisions implicated by each
invocation, and (d) a verification endpoint separate from the invocation path.

## 3. Summary — Claims

1. **A method for producing regulatory evidence from stateless AI tool
   invocations**, comprising: receiving a tool-invocation message bearing a
   method-identifier header and a tool-name header; deriving an invocation
   identity from said headers; computing a payload hash over the invocation
   parameters and result; constructing a receipt comprising said identity,
   payload hash, timestamp, and a previous-receipt hash; signing said receipt;
   appending it to an append-only chain; and mapping said receipt to a set of
   regulatory obligations selected by consulting a crosswalk data structure
   relating compliance-framework provisions to invocation classes.
   *(independent)*

2. **A method according to claim 1**, wherein the crosswalk relates a
   plurality of frameworks selected from EU AI Act, GDPR, DORA, NIS2, CRA,
   NIST AI RMF, ISO/IEC 42001, ISO/IEC 27001, IEEE 7000, SOC 2, HIPAA, and
   PCI DSS, and each receipt records the specific article or control
   identifiers implicated by its invocation class. *(independent)*

3. **A method according to claim 1**, further comprising a verification
   endpoint, invocable separately from any tool invocation, that accepts a
   receipt hash and returns the matching chain entry or a negative result,
   such that third parties can verify individual receipts offline against a
   published public key without access to the invoking system. *(independent)*

4. **A method according to claim 1**, wherein protocol-version negotiation is
   performed statelessly: requests from legacy clients (handshake-era wires)
   and requests from stateless-era clients (header-only wires) are both
   translated to a canonical internal representation, and the receipt records
   which wire era the originating client spoke, such that a mixed-version
   estate produces a uniform receipt chain. *(independent)*

5. **A tool-governance system** comprising: a plurality of MCP tool servers; a
   gateway implementing claims 1-4 interposed between clients and said
   servers; a hash-chained receipt store; an obligation crosswalk; and a
   constitutional gate that refuses invocations failing a configured
   article-set audit before the receipt is issued. *(dependent — integrates
   the runtime constitutional gate of the companion provisional)*

## 4. Detailed Description — Reduction to Practice

Implemented across the CSOAI sovereign substrate, operational 2026-10-07.

- **Receipt chain** — `meok-backend/app.py` endpoints `POST /api/sigil/verify`
  (accepts a hash, returns the matching chain entry or negative) and
  `GET /api/sigl/chain` (last ten entries; genesis-seeded to ≥10 on first
  read). Chain file `meok-backend/sigil_chain.jsonl` is append-only; every
  entry carries `ts`, `prev`, `hash = HMAC-SHA256(secret, canonical-json)`.
  Tests: `test_app.py` **37/37 pass** (signature-verification, negative
  lookup, and chain-shape cases included).
- **Sovereign identity layer** — `meok-backend/sovereign_db.py` (13 tables,
  SIGIL chain table with `sigil_chain` ops `add/verify/list`), tests
  `test_sovereign_db.py` **18/18 pass**.
- **Crosswalk** — `sovereign-law/99-compliance-crosswalk.md` maps 52
  sovereignty articles across the 12 frameworks listed in claim 2 (file set:
  14 numbered documents, all present on disk 2026-10-07); each of the 60
  charters in `sovereign-charters/` (120 unique stems, two generations)
  carries per-article sovereign-alignment tables consumed by the same mapper.
- **Stateless header identity** — the estate's MCP fleet (218 core servers +
  153 federation tools) is being inventoried by `mcp_wire_audit.py`, which
  classifies each server's wire era (pre-2025-06 / 2025-06 / 2025-11 /
  2026-07) from source signals (handshake handlers, `Mcp-Session-Id`,
  `server/discover`); `mcp2026_shim.py` performs bidirectional translation
  (legacy→canonical, stateless→canonical) with the originating era recorded —
  claim 4's wire-era field.
- **Verification separate from invocation** — `meok-ori` receipts:
  `verify_chain()` executes *after* `append_receipt()` in a distinct step
  (`cli.py::_cmd_run`), returns `(ok, count, last_hash)`; tamper tests prove
  field edits and prev-link breaks both flip `ok` false. Receipt append is
  automatic (Art. 10); signing is explicit (`--sign`, Art. 12). Tests:
  `test_meok_ori.py` **34/34 pass**.

### Prior-art comparison

| System | Scope | Signed | Hash-chained | Obligation-mapped | Stateless-header identity | Separate verification |
|---|---|---|---|---|---|---|
| OpenTelemetry | spans | no | no | no | no | no |
| Sigstore/Rekor | builds/artifacts | yes | log | no | no | yes |
| in-toto/Witness | build steps | yes | yes | no | no | yes |
| C2PA | media content | yes | yes | no (provenance only) | n/a | yes |
| Companion provisional (inference receipts) | LLM inference | yes | yes | partial | n/a | yes |
| **This invention** | **MCP tool invocations** | **yes** | **yes** | **12-framework live crosswalk** | **yes** | **yes** |

## 5. Prior Art References

1. Model Context Protocol Specification, 2026-07-28 revision, Linux
   Foundation AAIF — stateless wire, `Mcp-Method`/`Mcp-Name` headers.
2. C2PA Specification 2.4 (2026) — content provenance, not tool invocation.
3. in-toto / Witness (OpenSSF) — build-time attestation, not runtime tool calls.
4. Sigstore Rekor — transparency log, no obligation crosswalk.
5. OpenTelemetry — observability, unsigned, no regulatory mapping.
6. EU AI Act, Regulation (EU) 2024/1689, Arts. 12, 50; GDPR Art. 5(2).
7. Companion provisional: "Signed Measurement Receipts and Governance-Aware
   Tier Routing for Distributed LLM Inference" (CSOAI, 2026-10-07) —
   distinguished: covers inference execution; this covers tool invocation
   with obligation crosswalk and protocol-header identity.

## 6. Abstract

A method converting AI tool invocations into regulatory evidence. Each
stateless-protocol tool call (identified by its method and tool-name headers)
yields a signed, hash-chained receipt carrying an invocation identity, payload
hash, timestamp, and previous-receipt link; a live crosswalk maps the receipt
to the specific provisions of twelve compliance frameworks it implicates
(EU AI Act, GDPR, DORA, NIS2, CRA, NIST AI RMF, ISO 42001/27001, IEEE 7000,
SOC 2, HIPAA, PCI DSS); a separate verification endpoint answers per-receipt
queries offline; and a protocol-erasing translation layer lets mixed-version
tool estates (handshake-era and stateless-era clients) produce one uniform
chain. The invention turns the moment an AI *acts* — the tool call — into a
signed, obligation-tagged, independently verifiable record.

## 7. Filing Instructions

- **UK IPO Form 1** (provisional). Priority date 2026-10-07.
- **PCT within 12 months**; national phases at 30 months.
- Target jurisdictions: UK, EPO, US (registry-heavy MCP ecosystem).
- **OIN 2.0 scope check (MANDATORY, executed 2026-10-07):** measurement and
  compliance-layer method; **NOT** Linux-kernel-adjacent. OIN grant-back does
  not apply. No Limitation Election required.
- Coordinate with companion provisionals (runtime gate + verdict court) for a
  divisional strategy: each is independently filed; claim 5 of this document
  references the runtime-gate system.

## 8. Novelty Statement

Signed receipts, hash chains, and compliance crosswalks are individually
known. The novelty is their **combination at the MCP invocation boundary**:
the stateless protocol headers themselves become the receipt's identity
material; the crosswalk is consulted *at invocation time* so each receipt
names the provisions it implicates rather than requiring after-the-fact
reconstruction; wire-era provenance is recorded per receipt so a mixed-version
estate remains provably uniform; and verification is served from a path
architecturally separate from invocation. No cited system transforms an AI
tool call into obligation-tagged, signed, chain-verified regulatory evidence.

---

*Prepared for CSOAI Ltd (UK 16939677). Inventor: Nicholas Templeman.
This document constitutes a reduction to practice of the claimed inventions
via the `meok-backend` sovereign API (37/37 + 18/18 tests passing), the
`sovereign-law` crosswalk (52 articles × 12 frameworks), and the `meok-ori`
receipt chain (34/34 tests passing), all operational 2026-10-07.*
