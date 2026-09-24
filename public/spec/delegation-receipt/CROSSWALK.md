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
| form-mode request for a sensitive field | not a receipt field; measured separately by an elicitation-decline probe (in development, not yet published) |
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
