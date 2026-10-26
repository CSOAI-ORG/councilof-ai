# Dispute evidence extension — evidence triple with a third state — Measure — 26 Oct 2026

**Status:** concrete proposal for a follow-up to [x402#3500](https://github.com/x402-foundation/x402/issues/3500). **Not** a certification, **not** a resolution outcome, **not** an attribution of fault.
**Trigger:** x402#3500 ("[Feature]: Dispute evidence for agent-initiated payments"), which names the evidence triple — *authorization scope, action, structured delta* — and states that the full design work would come in follow-up proposals.
**Related:** the comment on #3500 that maps this onto the IETF measurement-capsule profile, and [`docs/OTEL-GENAI-EVALUATION-CROSSWALK.md`](OTEL-GENAI-EVALUATION-CROSSWALK.md), which applies the same three-state discipline to evaluation results.
**Locks:** Never certify. Never rank. Never assign fault. Never claim a resolution outcome. "Could not be checked" is not "no mismatch".

---

## 1. What this accepts, and what it adds

#3500 is right about the core. An agent pays $5.00 under a $0.10 authorization; the payment is
validly signed and settled; no party committed fraud; and the user cannot say "this was valid yet
wrong" in a machine-readable way. The evidence triple is the right shape for that, and the
observation that **a resolver should extract both sides and confirm they differ, with no
interpretation required**, is the part that makes it mechanically checkable at all.

This document does three things to that proposal:

1. It separates **assertion** from **measurement**, so the delta is computed rather than claimed.
2. It adds the **third state**, so "could not be checked" is never reported as "no mismatch".
3. It states the **measurement-grade rule** that keeps a single incident from being reported as a
   verdict.

And it closes the two "known prerequisites" in #3500 with concrete shapes: the agent
authorization-scope artefact, and the receipt-to-authorization binding.

---

## 2. The gap that matters most: two states are not enough

#3500 says a resolver "extracts both from the embedded artifacts and confirms they differ". That
implies a boolean. But a resolver can fail to check, and the failure modes are ordinary:

- the receipt references a settlement the verifier never processed;
- the authorization scope has expired, so the constraint in force at settlement cannot be
  reconstructed;
- the offer is referenced by hash but the bytes are not available to the verifier;
- the facilitator that settled is not the facilitator being asked to verify;
- the transaction is outside the verifier's own retained window.

A two-state resolver has three bad options, and all three are wrong: it refuses the dispute (the
grievance is lost), it accepts it (an unchecked claim is treated as an established one), or it
reports "no mismatch" (an unchecked dispute is silently discarded, and the party that filed it
believes it was dismissed on the merits).

The fix is small and it is the same fix the rest of the measurement estate uses: **three states,
and the middle one is decided first.**

| State | Meaning |
|---|---|
| `DIFFERENCE_CONFIRMED` | the verifier established, from the artefacts, that the declared constraint and the observed action differ |
| `NO_DIFFERENCE_FOUND` | the verifier established that they do not differ |
| `COULD_NOT_BE_CHECKED` | the verifier could not establish either — and says exactly which artefact was missing, unresolvable or out of window |

`COULD_NOT_BE_CHECKED` is **not** a failure of the dispute and **not** a finding against the
payer. It is a fact about the verifier's evidence, and it must carry the reason. A verifier that
reports it without a reason is not usable by the party that filed.

This is the same structure as the `EvaluationResult/v1` verifier (`VALID` / `INVALID` /
`UNCHECKABLE`), where `UNCHECKABLE` is decided before anything else runs, and as the IETF
measurement-capsule profile. Three separate efforts arriving at the same shape is not a
coincidence: a check that did not happen and a check that failed are different facts about the
world, and a two-state interface has to lose one of them.

---

## 3. Assertion and measurement are different things

The proposal says the delta is "a structured list of which constraints were violated. Each entry
names a field, the authorized value, and the actual value."

Who signs that list?

If the payer signs it, then the delta is a **claim**: the payer asserts that $5.00 exceeded a $0.10
ceiling. The signature proves the payer said it. It does not prove the ceiling was $0.10, and it
does not prove $5.00 was settled.

But the **facilitator already sees both sides** — it handles `POST /verify` and `POST /settle`.
It is the one party that can independently establish the observed facts. So the artefact should
split into three legs, and only the first two are signed:

| Leg | What it is | Who signs it | What a signature proves |
|---|---|---|---|
| `declared` | the authorization scope in force at settlement | the **principal** (the user) | the constraint existed and what it said |
| `observed` | what was actually settled and delivered | the **facilitator** | the settlement facts, as the settling party records them |
| `difference` | which declared fields the observed facts violate | **nobody — it is computed** | nothing; it is the *result* of the verifier comparing the two |

This is the declared / observed / difference triple of the IETF measurement-capsule profile, and it
is the whole point. **The delta is computed by the verifier from two independently signed legs, not
asserted by the party with the grievance.** That single change turns the dispute artefact from a
complaint into a measurement.

It also fixes a subtler problem. If the payer signs the delta, a resolver can only ever confirm
"the payer claimed a difference" — it can never confirm a difference, because confirming would
require trusting the payer's own statement about the declared leg. With the split, the resolver
does not need to trust either side's account of the comparison: it does the comparison.

---

## 4. The measurement-grade rule

A dispute concerns **one transaction**. That is n = 1.

An artefact that says "the agent exceeded its authorized budget" is stated in the vocabulary of a
verdict. The artefact can support a narrower and better claim: *the settled amount for this
transaction exceeds the ceiling in the authorization scope by 4.90 USD, as established by the
facilitator that settled it and the principal who set the ceiling.*

The difference between those two statements is the difference between a measurement and a
finding. Three rules follow:

1. **Report the difference, not the verdict.** The artefact reports the field, the declared value,
   the observed value, and the difference. "Scope exceeded" is a *reason code* applied to that
   difference, not the difference itself.
2. **State the limit.** The artefact says what it does not establish: who was at fault, whether a
   refund is due, whether the agent behaved badly, or anything about any other transaction.
3. **Do not generalise from n = 1.** A single confirmed difference is one observation. If a
   protocol wants to say "this agent overruns budgets", that is a population claim over many
   transactions, and it needs a population, a pinned harness, and an interval. #3500's own
   exclusion of resolution outcomes is right, and this extends it: the exclusion covers not just
   money, but verdicts.

For the single-transaction case the honest interval is the one a Bernoulli proportion at n = 1
admits, which is wide. That width is the point: it is what keeps a single dispute from being
re-reported as a rate.

---

## 5. The two prerequisites, closed

### 5.1 The authorization-scope artefact

#3500 calls this prerequisite #1: "a signed object from the principal constraining what the agent
can spend (amount, resources, networks, expiry)". The `upto` scheme defines a *server-facing* max;
this is a *principal-facing* constraint, and it has to travel with the payment so the settle-time
state is reconstructable.

```jsonc
{
  "principal": "did:key:z6Mk...",            // the authority that granted the scope
  "grant": {
    "maxAmount": { "value": "0.10", "currency": "USD" },   // ceiling, not a reservation
    "resources": ["https://api.example.com/market-data"],  // or a prefix/scheme
    "networks": ["eip155:8453"],
    "expiresAt": "2026-10-26T18:00:00Z"
  },
  "delegation": { "agent": "https://agent.example.com" },
  "notBefore": "2026-10-26T12:00:00Z",
  "nonce": "..."
}
```

Three design points that matter for verification:

- **The scope is signed by the principal, not the agent.** An agent that could author its own
  budget would make every dispute vacuous.
- **`expiresAt` is part of the artefact, not of the transport.** The scope in force *at settlement
  time* is what is compared, so the expiry has to be evaluable from the bytes.
- **The scope is referenced by content hash, not embedded verbatim.** This preserves the
  offer-receipt extension's privacy design — the receipt omits amount and offer reference for
  privacy — while still making the comparison possible.

### 5.2 The receipt-to-authorization binding

#3500 calls this prerequisite #2 and points at #3379. The receipt needs a hash-based reference to
the artefacts that were in force at settlement:

```jsonc
"authorization_ref": { "sha256": "<hex>" },   // over the canonical scope bytes
"offer_ref":        { "sha256": "<hex>" }    // over the canonical offer bytes
```

The reference is a *commitment*, not a disclosure. A verifier that holds the bytes can check the
comparison; a verifier that does not hold them reports `COULD_NOT_BE_CHECKED` and names the
artefact it could not obtain. That is the same three-state discipline applied to artefact
availability.

---

## 6. Shape

A standalone artefact, travelling like the receipt — either in `extensions{}` or beside it.

```jsonc
{
  "artifact": "x402.dispute-evidence/0.1",
  "dispute": {
    "id": "<hex>",                       // stable id for the dispute, so it can be referenced
    "raisedAt": "2026-10-26T14:03:11Z",
    "raisedBy": { "role": "payer", "id": "did:key:z6Mk..." }
  },

  // leg 1 — declared; signed by the principal
  "declared": {
    "authorization": { "sha256": "<hex>" },     // commitment to the scope bytes
    "scope_summary": { "maxAmount": "0.10 USD", "resources": ["https://api.example.com/market-data"] }
  },

  // leg 2 — observed; signed by the facilitator that settled
  "observed": {
    "receipt": { "sha256": "<hex>" },          // commitment to the receipt bytes
    "settlement": {
      "amount": { "value": "5.00", "currency": "USD" },
      "resource": "https://api.example.com/premium-tier",
      "settledAt": "2026-10-26T14:02:58Z",
      "network": "eip155:8453",
      "scheme": "exact"
    }
  },

  // leg 3 — difference; COMPUTED by the verifier, never signed by the raiser
  "difference": [
    {
      "field": "amount",
      "declared": "0.10 USD",
      "observed": "5.00 USD",
      "delta": "4.90 USD",
      "reason_code": "SCOPE_EXCEEDED"
    }
  ],

  "verification": {
    "verdict": "DIFFERENCE_CONFIRMED",   // DIFFERENCE_CONFIRMED | NO_DIFFERENCE_FOUND | COULD_NOT_BE_CHECKED
    "unverified_reason": null,           // required when verdict is COULD_NOT_BE_CHECKED
    "verified_at": "2026-10-26T14:05:40Z",
    "verifier": { "role": "facilitator", "id": "https://facilitator.example.com" }
  },

  "establishes": [
    "That the settled amount of 5.00 USD exceeds the 0.10 USD ceiling in the referenced authorization scope.",
    "That the facilitator that settled the payment established the observed figures."
  ],
  "doesNotEstablish": [
    "Who was at fault.",
    "That a refund is due; resolution is a business decision above the protocol.",
    "Anything about any other transaction.",
    "That the agent's behaviour was unreasonable; intent is out of scope."
  ]
}
```

---

## 7. Reason codes

Each reason code names the field comparison it depends on, so that a verifier's checklist is
mechanical and a mismatch between code and comparison is detectable.

| Code | Depends on | Meaning |
|---|---|---|
| `SCOPE_EXCEEDED` | `amount` | settled amount exceeds the authorized ceiling |
| `RESOURCE_NOT_AUTHORIZED` | `resource` | the settled resource is not in the authorized resource set |
| `NETWORK_NOT_AUTHORIZED` | `network` | the settled network is not in the authorized network set |
| `EXPIRED_AT_SETTLEMENT` | `expiresAt` vs `settledAt` | the scope had expired when the payment settled |
| `NOT_YET_IN_FORCE` | `notBefore` vs `settledAt` | the scope was not yet in force at settlement |
| `UNBOUND_RECEIPT` | `receipt.sha256` | the receipt is not the one that was settled by this facilitator |
| `MULTIPLE_CONSTRAINTS` | — | more than one of the above; the `difference` array carries each |

`UNBOUND_RECEIPT` deserves a note: it is the reason code that makes the facilitator's `POST
/dispute` useful rather than decorative. A facilitator that did not settle the payment cannot
establish the observed leg, and must say so rather than reason about a receipt it never saw.

---

## 8. The verifier's checklist

In order. Each step names the state it can leave the dispute in.

1. **Obtain the legs.** The authorization bytes (by `authorization_ref`) and the receipt bytes (by
   `receipt_ref`). If either is unavailable, unresolvable, or out of retention: →
   `COULD_NOT_BE_CHECKED` with the reason naming the artefact.
2. **Verify the signatures.** The authorization against the principal's key; the receipt against
   the facilitator's key. A failed signature → `COULD_NOT_BE_CHECKED` with the reason naming the
   key or the artefact. (Not a finding against the payer: an unverifiable signature is an
   unverified signature.)
3. **Verify the binding.** `authorization_ref` matches the canonical authorization bytes, and
   `receipt_ref` matches the canonical receipt bytes. Mismatch → `COULD_NOT_BE_CHECKED`.
4. **Establish that this facilitator settled it.** If the verifier is a facilitator and did not
   settle the payment → `COULD_NOT_BE_CHECKED` with reason `UNBOUND_RECEIPT`.
5. **Check the temporal constraints.** `expiresAt` and `notBefore` against `settledAt`. A failure
   produces a `difference` entry with the corresponding reason code.
6. **Compute the differences.** For each declared field with an observed counterpart, compute the
   comparison. This step *computes*; it never reads the raiser's `difference` array.
7. **Compare the computed differences with the raised ones.** If the raiser asserted a difference
   the computation does not support, the computed set stands and the discrepancy is recorded. A
   dispute that does not survive its own arithmetic is not a dispute about the payment.
8. **State the verdict and the limit.** `DIFFERENCE_CONFIRMED`, `NO_DIFFERENCE_FOUND`, or
   `COULD_NOT_BE_CHECKED` with a reason, plus the `establishes` / `doesNotEstablish` block.

Step 7 is the one that most implementations will want to skip, and it is the one that makes the
artefact a measurement rather than a complaint.

---

## 9. Scheme interactions

| Scheme | The observed leg | Note |
|---|---|---|
| `exact` | settled amount equals the offer amount | the common case; the comparison is against the scope ceiling, not the offer |
| `upto` | settled amount ≤ the scheme ceiling | the scheme ceiling is the *server's* constraint; the principal's scope may be lower, and the lower one is what the dispute is about |
| `batch-settlement` | per-item settlement facts, aggregated | each item is compared individually; the dispute is per item, and the batch total is not the unit of comparison |

For `upto` the two ceilings are different objects and conflating them is a common source of
false disputes. The reason code set distinguishes them because the comparison is against
`declared.maxAmount`, never against the scheme's own ceiling.

---

## 10. What this does not define

Mirroring #3500's own exclusions, and adding two:

- Resolution outcomes — refund, credit, penalty. A business decision above the protocol.
- Fund reversal. Settlements are on-chain; reversing funds is a separate problem.
- Intent capture. "I wanted cheap data, not premium tier" needs natural-language understanding.
- **Fault.** Nothing in the artefact says the agent misbehaved. It says two signed statements
  differ.
- **Rates.** One dispute is one transaction. Any population claim over agent behaviour needs a
  population, a pinned harness and an interval — a different artefact.

---

## 11. What a third party can do with this

Because the triple is `declared` / `observed` / `difference`, and the difference is computed:

- a **facilitator** can settle disputes mechanically, as in step 8 above;
- an **independent attestor** can verify a dispute without being the settling party, as long as it
  holds the authorisation and receipt bytes — the two-leg split is what makes that possible, since
  the attested observed leg does not depend on the attestor having settled;
- a **payer** can verify that its own dispute was checked rather than dismissed, because
  `COULD_NOT_BE_CHECKED` is distinguishable from `NO_DIFFERENCE_FOUND`;
- an **auditor** can check a population of disputes, and can notice a facilitator that reports
  `COULD_NOT_BE_CHECKED` far more often than its peers.

We will publish a **conformance corpus** for this artefact: the three verdicts, the reason codes, the
ordered checklist, and the cases where two-state verification gives the wrong answer — including
the case in §2 where a dispute is silently discarded. Verification will stay free and offline.

---

## 12. The open question this proposal does not settle

Whether the `difference` leg belongs in the artefact at all.

The case for including it: the raiser knows what they are claiming, and a document that carries the
claim alongside the evidence is easier to file and to read.

The case against: a signed delta in the artefact invites a resolver to treat it as the answer.
The split in §3 only holds if the difference is computed, and a delta that ships inside the dispute
document is a delta that a resolver will read before computing its own.

The recommendation here is: **the raised delta may travel in the dispute, and the computed delta
is what the verifier publishes.** Where a dispute is raised by a party that did not observe the
settlement, the two should be stored separately, with the computed one as the record of what was
established. This is exactly the "declared / observed / difference" separation in the IETF
measurement-capsule profile, where the difference is a derived value and never an input.

---

Issued as a measurement contribution by CSOAI Ltd (Council of AI), UK company 16939677.
We measure; we do not certify.
