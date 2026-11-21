# Agent Authority & Evidence Pilot — Delivery and Acceptance template

**Status:** BLANK EXAMPLE, not evidence of an executed customer pilot, signed receipt or accepted service.

## A. Source and audience

| Field | Value |
| --- | --- |
| SOW reference and scope revision | [EXACT SIGNED SOW REFERENCE] |
| Customer-controlled sandbox | [PRIVATE REFERENCE / APPROVED TEST BOUNDARY] |
| Operator and independently accepted reviewer | [PRIVATE AUTHENTICATED IDENTITIES] |
| Test owner, authority issuer and revocation epoch | [VERIFIED RECORD REFERENCES] |
| Test code and dependency hashes | [EXACT SOURCE COMMIT AND LOCKED VERSIONS] |
| Model/dataset/tool revisions | [PINNED REFERENCES OR NOT APPLICABLE] |
| Observation start/end and timezone | [ACTUAL OBSERVED TIMESTAMPS] |
| Dataset rights and privacy approval | [APPROVED RETENTION/ACCESS REGISTER] |
| Canonical evidence schema | [EXISTING csoai.evidence-event/0.1 / applicable HITL authority-effect] |

## B. Pre-registered test matrix

Enter **each** actual case; do not use synthetic benchmark scores as the customer's test.

| Case ID | Allowed action? | Threat / control being tested | Expected effect | Observed actual effect | Evidence digest | Status |
| --- | --- | --- | --- | --- | --- | --- |
| [POSITIVE-1] | [YES] | [Exact permitted action] | [Single bounded state change] | [INDEPENDENT READBACK OR UNKNOWN] | [SHA-256] | [SUPPORTED / CONTRADICTED / NOT_ESTABLISHED] |
| [NEGATIVE-1] | [NO] | [Wrong scope or revocation] | [NO EFFECT] | [INDEPENDENT READBACK OR UNKNOWN] | [SHA-256] | [SUPPORTED / CONTRADICTED / NOT_ESTABLISHED] |
| [NEGATIVE-2] | [NO] | [Replay or tampering] | [NO DUPLICATE EFFECT] | [INDEPENDENT READBACK OR UNKNOWN] | [SHA-256] | [SUPPORTED / CONTRADICTED / NOT_ESTABLISHED] |
| [FURTHER CASES] | [...] | [...] | [...] | [...] | [...] | [...] |

**Required accounting:** total cases [N]; exercised cases [N]; permitted effects [N]; prevented effects [N]; unexpected effects [N]; false refusals [N]; uncheckable [N]. Unknown is **not zero**. Failures cannot be dropped from any headline denominator.

## C. Evidence verification and independent acceptance

| Verification | Result / reason |
| --- | --- |
| Exact source and environment reproduce? | [PASS / FAIL / UNCHECKABLE] |
| SHA-256 recomputed over the exact specified bytes? | [PASS / FAIL / UNCHECKABLE] |
| Ed25519 signature under an independently trusted public key? | [PASS / FAIL / UNCHECKABLE / NOT APPLICABLE] |
| Optional root/inclusion proof witnessed under separately checked trust? | [PASS / FAIL / UNCHECKABLE / NOT APPLICABLE] |
| Positive action independently read back? | [OBSERVED / CONTRADICTED / UNKNOWN] |
| Revoked/wrong-scope/expired/replayed actions independently read back? | [NO EFFECT OBSERVED / EFFECT OBSERVED / UNKNOWN] |
| Independent reviewer accepted exact scope and method? | [ACCEPTED / DECLINED / NOT STAFFED] |
| Customer reproduction attempted? | [METHOD, RESULT, DATE OR NOT YET] |
| Privacy/retention/corrections accepted? | [APPROVED REFERENCE OR BLOCKED] |

A cryptographic signature proves signed bytes came from an identified key if verified against an externally trusted key. It does not prove the safety conclusions, the human's real-world identity or downstream effect truth without independent controls.

## D. Commercial closure — keep details private

| Stage | Actual event and private reference |
| --- | --- |
| Delivered | [PRIVATE HANDOFF RECEIPT, DATETIME] |
| Customer accepted | [APPROVED, EXCEPTIONS OR NOT ACCEPTED — SIGNATURE/DATE] |
| Invoice issued | [PRIVATE INVOICE REFERENCE AND AMOUNT] |
| Payment observed | [BANK/PROCESSOR RECONCILIATION REFERENCE OR UNPAID] |
| Net revenue recognised | [FINANCE-APPROVED RESULT, excluding self-tests/refunds, or UNKNOWN] |
| Public case study permission | [EXPLICIT OPT-IN EXACT CLAIM / OTHERWISE NONE] |

**No inferred buyer, success, paid status, certification or human approval.**

## E. Limitation / dispute / correction notes

- What **was not** exercised? [SPECIFIC RUNTIME, TOOL TYPES, DATA SOURCES, TRAFFIC/ATTACK VECTORS]
- What did an external observer actually verify? [EXACT REPLAY AND TRUST SOURCE]
- Which claims are disputed, suppressed or unknown? [CASE REFERENCES]
- What is the source-time and measurement freshness? [DATETIME, BANK AND VERSION]
- How can the buyer request a correction or withdraw approval to publish? [APPROVED PRIVATE ROUTE]

## F. Required human release decisions

**Technical operator:** [SIGNATURE, DATE, ROLE]

**Independent reviewer:** [SIGNATURE, DATE, ROLE, CONFLICT DECLARATION]

**Buyer acceptance:** [SIGNATURE, DATE, EXCEPTIONS]

**Public communications reviewer (only if case study authorized):** [SIGNATURE, APPROVED EXACT CLAIM]

**State:** UNEXECUTED TEMPLATE. A filled file is not proof unless its sources and authorized signatures can be separately verified.
