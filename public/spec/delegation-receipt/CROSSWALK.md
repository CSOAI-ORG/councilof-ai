# Delegation receipt v0.1 — crosswalk to the protocols it records

CC0 1.0. Read 2026-09-24 from the primary sources linked in each table. A crosswalk states where a
value comes FROM; it never says the other protocol endorses this format. Where a source did not
answer, the row says so.

## MCP — elicitation (spec 2025-11-25)

Source: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation ; schema
`ElicitResult.action: "accept" | "decline" | "cancel"` (schema/2025-11-25/schema.ts).

| MCP | Receipt |
|---|---|
| `ElicitResult.action = "accept"` | `principal` evidence item, `kind: PROTOCOL_MESSAGE`, `party: PRINCIPAL`; the approval is recorded, it is **not** proof the action was then enforced |
| `action = "decline"` / `"cancel"` | the job did not proceed: `delivery.state` must not be EVIDENCED for an effect the decline covered; a delivery that exists anyway is itself the finding |
| form-mode request for a sensitive field | not a receipt field; measured separately by the elicitation-decline probe (`docs/measurement/HITL-PROBE.md`, pilot) |
| field values the human entered | **never recorded** — names of requested fields at most |

## A2A — task lifecycle (a2a.proto, `TaskState`)

Source: https://github.com/a2aproject/A2A/blob/main/specification/a2a.proto

| A2A | Receipt |
|---|---|
| Agent Card URL + bytes | `agent.a2a_agent_card_url`, `agent.a2a_agent_card_sha256`, `agent.card_observed_at` (the bytes read, when read — not the card as it may be now) |
| `TASK_STATE_SUBMITTED` time | `timestamps.requested` |
| `TASK_STATE_INPUT_REQUIRED` / `TASK_STATE_AUTH_REQUIRED` then resumed | a principal interaction: an evidence item on `principal` (`PROTOCOL_MESSAGE`); the resume message is the evidence, not the state name |
| `TASK_STATE_COMPLETED` + artifacts | `delivery.artifacts[]` (url + sha256 of bytes read) and `timestamps.delivered` |
| `TASK_STATE_REJECTED` / `TASK_STATE_CANCELED` / `TASK_STATE_FAILED` | no delivery: `delivery.state: ABSENT`; the terminal state goes in `notes` with its evidence |
| task id | `job.ref` |

## x402 — payment and the offer-and-receipt extension

Sources: https://docs.x402.org/ ; https://github.com/x402-foundation/x402/blob/main/specs/extensions/extension-offer-and-receipt.md

| x402 | Receipt |
|---|---|
| `PaymentRequirements.network` (CAIP-2, e.g. `eip155:8453`) / Offer `network` | `payment.network` |
| `asset` | `payment.asset` |
| `amount` (v2; `maxAmountRequired` in v1), a decimal string of base units | `payment.amount_units` (string, base units, no currency symbol) |
| `payTo` | `payment.pay_to` |
| settlement `transaction` / Receipt `transaction` | `payment.tx_hash`; the chain record is the `EVIDENCED_BY_THIRD_PARTY` item (`kind: CHAIN_RECORD`) |
| Receipt `issuedAt` | `timestamps.paid.asserted_at` (the server asserts it); block time goes in `observed_at` |
| Receipt `payer` | input to `payment.payer_class` — the EIP-3009 signer, never the relayer (a relayer is not a buyer) |
| Offer / Receipt signature (EIP-712 or JWS) | an evidence item `kind: SIGNED_DOCUMENT`, `party: AGENT` (the server signed it: self-asserted, not third-party) |

## AP2 — mandates

Source: https://ap2-protocol.org/ap2/specification/ (current spec names a **Checkout Mandate** and a
**Payment Mandate**; the earlier specification used Intent / Cart / Payment mandates — the GitHub
file that held it returned 404 on 2026-09-24).

| AP2 | Receipt |
|---|---|
| mandate id, or sha256 of the mandate bytes | `principal.kind: AP2_MANDATE`, `principal.ref` / `principal.ref_sha256` |
| mandate signature | `principal` evidence item, `kind: SIGNED_DOCUMENT`, `party: PRINCIPAL` |
| whether the human was present | not a v0.1 field — recorded in `notes` with its evidence until a later version adds it |

## ERC-8004 — agent identity registry

Source: https://eips.ethereum.org/EIPS/eip-8004

| ERC-8004 | Receipt |
|---|---|
| `agentRegistry` = `{namespace}:{chainId}:{identityRegistry}` | `agent.erc8004.chain` + `agent.erc8004.identity_registry` |
| `agentId` (the ERC-721 tokenId) | `agent.erc8004.agent_id` |
| ownership of the token | **not** evidence of who authorised a job; it binds an agent to an address, not to a person or organisation |

## AAIF Observability & Traceability WG — Agent Behavior Trace Model, task 6 (issue #44)

Source: https://github.com/aaif/wg-observability-and-traceability/issues/44 (status "needs owner" when read)

| Trace model relationship | Receipt |
|---|---|
| "'Approve' must refer to proposed action P1" | `principal` evidence names the proposed action it approved (`what_it_shows`) |
| "A denial should not produce a fictional tool execution" | a declined job has `delivery.state: ABSENT`; a delivery after a denial is recorded as found, never smoothed over |
| "the service separately reports creating ticket-42" | `delivery` evidence from the service (`party: THIRD_PARTY`) kept apart from the agent's own report (`party: AGENT`) |
| "Missing confirmation remains unknown" | `outcome_check.result: UNCHECKED`, state `ABSENT` — first-class, never defaulted to a pass |
| "observed approval is not proof of enforcement" | stated in every body's `not_evidence_of` |

## Proof of human / know-your-agent references

| Source | Receipt |
|---|---|
| World AgentKit proof (https://world.org/blog/announcements/now-available-agentkit-proof-of-human-for-the-agentic-web) | `principal.kind: WORLD_ID_PROOF`, a nullifier-style reference only — never an identity |
| Skyfire KYA token (https://docs.skyfire.xyz/docs/kya) | `principal.kind: SKYFIRE_KYA_TOKEN`, `ref_sha256` of the token — never the token |

## IETF RATS — roles (RFC 9334) and attestation results (EAR)

Sources: https://www.rfc-editor.org/rfc/rfc9334 ; https://datatracker.ietf.org/doc/draft-ietf-rats-ear/ (draft-04, 26 May 2026)

| RATS | Receipt |
|---|---|
| Attester (produces Evidence about itself) | the agent; what it says about its own job is `party: AGENT` → `SELF_ASSERTED` |
| Endorser / Reference Value Provider (vouches from outside) | a `party: THIRD_PARTY` evidence item (a chain record, a service's own report) → `EVIDENCED_BY_THIRD_PARTY` |
| Verifier (appraises Evidence) | closest to the recorder, **with one deliberate difference**: a receipt records what could be established and by whom; it never produces an appraisal |
| Relying Party | whoever reads the receipt; it applies its own policy |
| Passport model / background-check model | both work: a receipt can travel with the job, or a relying party can fetch it by `job.ref` |
| EAR `status` (`affirming` / `warning` / `contraindicated` / `none`) and the AR4SI trustworthiness vector | **no mapping, by design** — a receipt emits no trust tier. Where an EAR exists for the job it is referenced as evidence (`kind: SIGNED_DOCUMENT`) with its status quoted in `what_it_shows`, never translated into an evidence state |

## LF TRACE — Trust Records (spec v0.2)

Sources: https://github.com/agentrust-io/trace-spec (spec: Community Specification License 1.0; code: Apache-2.0) ;
https://www.linuxfoundation.org/press/linux-foundation-welcomes-trace-to-advance-verifiable-runtime-evidence-for-ai-workloads

TRACE proves what executed, where and under which policy, from hardware attestation. A receipt records
who authorised the job, what was paid, what was delivered and who checked it. They meet at TRACE's
`references` block, which "is a pointer, not evidence" (spec §3):

| TRACE | Receipt |
|---|---|
| a Trust Record for the job's execution | referenced from `agent` or `delivery` evidence, `kind: SIGNED_DOCUMENT`, with its SCITT anchor if it has one; hardware claims stay `UNCHECKABLE` where no record exists |
| `references[].rel = "approval-outcome"` ("an attributable human approval attached to a step-up or defer decision") | a receipt can be the referenced object: its `principal` section is the approval, with its own evidence state |
| `references[].rel = "condition-appraisal"` ("an independent check's finding … in the checker's own vocabulary") | a receipt's `outcome_check`, or a result from the elicitation-decline probe (`docs/measurement/HITL-PROBE.md`) |
| `references[].resolver` ("names who must retain, not who adjudicates") | the recorder, when it undertakes to keep the receipt resolvable at a stable URL |
| `delegation.parent_record_hash` = `sha256:` + hex(SHA-256(JCS(parent))) | not a receipt field; a receipt for a sub-job names its parent receipt in `notes` until a later version adds a field. Note the canonicalisation differs: TRACE uses JCS (RFC 8785); a receipt uses sorted-keys compact JSON with `ensure_ascii=True` |
| §2.4 scope boundary: TRACE does not protect against "UX-layer attacks against the human in the loop" | that is the ground the elicitation-decline probe measures — adjacent, not overlapping |
