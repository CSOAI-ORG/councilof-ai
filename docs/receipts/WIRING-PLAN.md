# Wiring plan — emitting delegation receipts from `commission_card`

Status: **PLAN ONLY.** Nothing under `functions/` is changed by this lane, and the agent card's
`signed-receipts/v1` extension stays "A DRAFT WE PUBLISH AND DO NOT YET EMIT". Line numbers are
against master `ccc76c25c` (2026-09-24). Spec: `public/spec/delegation-receipt/README.md`.

## 0. Three blockers to settle before any code

1. **Size.** A v0.1 receipt preimage is ~5.0–5.6 KB (vector 01: 5,025 bytes; the commission
   example: 5,593). `functions/_lib/cardSign.ts:16` sets `PAYLOAD_CAP_BYTES = 3072` and
   `signPayload()` (`:80-96`) **throws** above it. So receipts cannot be signed through
   `signPayload` as it stands. Options: a separate `signReceipt()` with its own cap (receipts
   are not card-v0 leaves and never enter the public root), or a slimmer v0.2 body. Owner call.
2. **Canonical form.** `cardSign.ts:45-57` `canonicalBytes()` is sorted-keys `JSON.stringify`,
   i.e. `ensure_ascii=false`. The receipt rule is `ensure_ascii=True` (README §5). They agree only
   on pure-ASCII bodies. The emitter MUST either escape non-ASCII as `\uXXXX` or refuse a body
   containing non-ASCII (recommended: refuse — every field we would fill is ASCII). Subject
   strings are already restricted to `[A-Za-z0-9._:/@+-]` by `SUBJECT_RE`
   (`functions/api/request-attestation.ts:62`).
3. **Which key.** The paid path signs with `BOARD_SIGN_KEY_PKCS8_B64`, i.e.
   `did:web:csoai.org#board-attestation-1`. Receipts would then set `recorder.did =
   "did:web:csoai.org"` and `kid = "did:web:csoai.org#board-attestation-1"`. Whether a
   commercial-flow record should share the board key is an owner decision (the DID doc's
   `_boardAttestationNote` scopes that key to the public board snapshot).

## 1. Where the receipt is built — `functions/api/request-attestation.ts`

Paid path, lines **347-446**. Insert after `cardV0(...)` (`:385-396`) and before the KV writes (`:398`):

| Receipt field | Source at issue time | State at issue |
|---|---|---|
| `job.ref` | `"request-attestation receipt_sha " + leaf.sha256` (`:381`) | — |
| `job.summary` | `subject`, `axis` | — |
| `principal` | nothing in the request carries a mandate / proof-of-human / KYA reference today | `ABSENT`, kind `UNSTATED` |
| `agent.a2a_agent_card_url/sha256` | fetch `/.well-known/agent-card.json` from `env.ASSETS` and hash the bytes | `SELF_ASSERTED` (party `AGENT`) |
| `payment.network`, `tx_hash` | `payment.settlement.network`, `.transaction` (`:370`) | `SELF_ASSERTED` at issue (facilitator said so); becomes third-party only when a chain read is recorded (see §3) |
| `payment.asset`, `amount_units`, `pay_to` | the `accepts[]` entry that `verifyX402Payment` (`functions/api/_x402.ts:482`) matched, from `x402Accepts` (`_x402.ts:218`) | same |
| `payment.payer_class` | `commissionOrigin()` (`functions/api/commissions.ts:169-181`): `OUTSIDE`/`SELF_TEST`/`ZERO_VALUE` map 1:1, `UNCHECKABLE` → `UNKNOWN` + `ABSENT` | `SELF_ASSERTED` |
| `payment.payer` | **not copied.** `payment.settlement.payer` exists at `:370`; the schema has no payer field and rejects one | — |
| `delivery` | nothing is published at issue time; the commission card-v0 leaf is returned in the HTTP body, not at a URL | `ABSENT`, binding `NONE` |
| `outcome_check` | nobody checks | `UNCHECKED` / `ABSENT` |
| `timestamps.paid` | `as_of` (`:349`) as `asserted_at`, `asserted_by: RECORDER` | `SELF_ASSERTED` |

Return it beside `card` in the JSON response (`:438-442`) as `delegation_receipt`, and store it
at `REVENUE_KV` key `dr:<receipt id>` next to the existing `ras:<sha>` write (`:402-415`). A
failed receipt write must not block the paid deliverable (same rule as `:432-434`).

## 2. Where delivery is added later — `functions/api/commissions.ts`

`joinDelivery()` (`:150-161`) is where cards are matched to a commission — by **subject and
axis**, not by anything the card carries. Receipts are immutable (the id is a hash of the body),
so delivery is recorded as a **second** receipt, not an edit:

- same `job.ref`, `delivery.state SELF_ASSERTED`, `binding JOINED_BY_SUBJECT`, one artifact per
  joined card (`url`, sha256 of the served bytes, `content_id` = card id).
- `scripts/receipts/build_commission_example.py` is the offline prototype of exactly this step.
- Upgrading `binding` to `REFERENCED_IN_JOB` needs the mill to write the commission's
  `receipt_sha` into the card body it produces — a mill change, not an API change.

## 3. Chain evidence (upgrading payment to `EVIDENCED_BY_THIRD_PARTY`)

Do it off the request path: a job that reads `eth_getTransactionReceipt` for `tx_hash`, checks
status `0x1` and exactly one ERC-20 `Transfer` of `amount_units` of `asset` to `pay_to`, then
issues the follow-up receipt with a `THIRD_PARTY` / `CHAIN_RECORD` evidence entry. The same
check already exists in `scripts/verify_receipt.py --check-chain` / `--expect-transfer`.

## 4. MCP `commission_card`

- `functions/mcp/_paid.ts:123-128` only builds the upstream URL; the receipt arrives in the
  upstream JSON with no change here.
- `functions/mcp/paid-tools.json:8` (description) and `:19` (`csoai.deliverable`) must name the
  receipt **only in the same commit that makes the route emit it** — a description ahead of the
  code is the "names promise what code lacks" defect.
- `functions/mcp/paid-tools.test.ts` and `mcp-protocol.test.ts:150-242` exercise the tool; add an
  assertion that a receipt, when present, verifies with `scripts/receipts/verify_receipt.py`.

## 5. The agent card — do NOT flip it from this work

`scripts/agent-card-extensions.mjs:41-44` decides `signed-receipts` EMITTED vs
PUBLISHED-NOT-EMITTED by regex over `functions/api/a2a.ts`
(`/(receipt|signed-receipts)\s*[:=][^\n]*attach|attachReceipt|signedReceipt/i`). Two consequences:

- Receipts emitted from `/api/request-attestation` are **not** A2A task outcomes, so they do not
  make the extension EMITTED, and nothing in this plan touches `a2a.ts`.
- Do not introduce identifiers matching that regex in `a2a.ts` until `a2a.ts` actually attaches
  a receipt at `Task.metadata["signed-receipts/v1"]`; the regex would flip the card on a name.

Generated outputs: `public/.well-known/agent-card.json:26`, `public/.well-known/agent.json:26`.

## 6. Tests and gates to add with the emitter

- A TS unit test that builds a receipt in the paid path with a test key and checks it with
  `python3 scripts/receipts/verify_receipt.py --pubkey <test pub>` (cross-language preimage check).
- `python3 scripts/receipts/test_verify_receipt.py` in `pr-gates` (it also asserts the vectors
  regenerate byte-for-byte).
- A negative control: a paid-path receipt must never contain the settlement payer address.
- Do not count receipts anywhere revenue is counted; `payer_class` is carried so that
  `SELF_TEST` receipts stay visibly separate.
