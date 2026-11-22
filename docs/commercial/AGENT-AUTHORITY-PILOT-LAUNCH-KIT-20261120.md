# Agent Authority & Evidence Pilot — operational launch kit

**Version:** 2026-11-20 draft candidate. **Status:** NOT LAUNCHED, NOT YET STAFFED OR AVAILABLE FOR AUTOMATIC BOOKING. Owner acceptance, customer terms and separate release gates are required.

**Source of the truth:** [approval-effect pilot specification](APPROVAL-EFFECT-PILOT.md); existing canonical HITL authority-effect schema and evidence-event schema. This kit coordinates sales/delivery; it does not create an alternative policy, signing authority, production case store, GSPC axis or customer acceptance.

## 1. One narrow offer, not three unfinished products

**Buyer:** teams operating AI agents or MCP integrations with a *specific* write-capable tool (internal file, ticket, build or sandbox workflow), an identifiable authorization owner and a separately observable effect.

**Problem:** "approved" in a chat or framework log is not proof the authorized action was correct, actually happened once, or was prevented after revocation.

**Proposed paid deliverable:** a bounded, buyer-authorized sandbox *approval → execution → independently readable effect* test and evidence report. Include one approved action and pre-registered denial/alteration/replay controls. All results are honestly classified; a blocked action is not a universal model-safety guarantee.

**Non-offer:** GSPC certification, AI Act legal determination, live incident response, blanket prompt-injection protection, unrestricted model monitoring, penetration testing of targets without consent, or on-demand sign-off by an unstaffed Human Council. MEOK Sovereign enforcement and continual GSPC monitoring are distinct future service qualifications.

## 2. Exact product boundary

| Included only after written SOW acceptance | Excluded until separately qualified |
| --- | --- |
| One named agent/executor and one buyer-owned *sandbox* action | Customer production changes, live writes or private account access |
| One signed/pinned authority source and one observer-accessible destination | Human approval based only on a UI click or a model summary |
| A defined test matrix, positive and negative controls, repeatability check | Unlimited agents, permanent monitoring, incident response or model certification |
| Result JSON, failing cases, source/version pins, evidence digest, limitations | Automatic GSPC board admission, external endorsement or guaranteed results |
| Buyer-directed reproduction and written acceptance record | Claims that a generated hash proves underlying facts |

Candidate security scope must include authentication, authorization and expiry semantics, revocation, idempotent effect application, no unobserved side effects, isolation, evidence handling and rollback. If these cannot be safely provided, offer a design/assessment-only scope without executing the tool.

## 3. Owner-approved quote framework — not a public price list

A *proposed* starting quote for a single-action, customer-provided sandbox pilot is **£2,950 + applicable VAT**, subject to owner approval and a signed written scope. This is a commercial planning anchor, not an advertised purchase price, a 402 amount or an offer capable of automatic acceptance. A multi-runtime pilot, a real durable human-authority gateway, or a regulated-domain engagement needs a separate quote after technical/legal scoping.

The quote should list assumptions: one action, one tenant, pre-approved test fixture, supplied observation endpoint, no live production execution, agreed revisions, privacy review, report and handover. Price must cover actual staff review, compute, insurance/contract costs, payment fees and contingency. Do not promise a delivery date before the technical operator and an independent reviewer accept capacity. Set any deposit, refund and invoice terms in the customer's signed SOW; do not invent a settled payment.

**Business thesis to test:** paid pilot first → repeatable integration/signed-evidence renewal second → controlled monthly monitoring only when staffing, alerts, costs, revocation and independent review work. Pricing, demand and gross margin are *hypotheses* until outside customers accept and pay.

## 4. Lead → quote → delivery → acceptance → money

Use the existing \`/contact/?arm=pilot\` *email-draft* journey for public, non-sensitive enquiries. Opening the form does **not** send, store, book or charge. The KV form in PR #4405 is a draft; it must not replace the email path until abuse controls, access-controlled queue, notification and private readback are proven. The separate commercial handoff work is PR #4525; do not duplicate its files.

| State | Required fact and exit evidence | Owner |
| --- | --- | --- |
| ENQUIRY_RECEIVED | Actual inbound message visible to a staffed mailbox, timestamp and assigned internal reference | Sales owner |
| QUALIFIED | Name of legal buyer, one legitimate use case, sandbox boundary, reviewer and data classes; no secrets in public form | Sales/technical |
| SCOPE_ACCEPTED | Signed SOW/terms including price, rights, acceptance criterion, privacy, limits, data retention and cancellation | Authorised company signatory |
| READY_TO_RUN | Authority source, version pins, written target permission, separate observer and rollback; privacy/security approval | Technical + independent reviewer |
| RUN_RECORDED | Raw outputs, exact tool effects, negative controls, failed and uncheckable cases, method hashes | Test operator |
| EVIDENCE_REVIEWED | Independent reproduction with defined expectation, objections and limitations; signed only under authorised keys | Reviewer |
| DELIVERED | Private handover to buyer, receipt, correction route and deliverable manifest | Service owner |
| CUSTOMER_ACCEPTED | Buyer approval/exception list in writing, not inferred from website traffic or downloads | Buyer |
| INVOICED | Owner-issued invoice with actual reference, VAT treatment and due date | Finance |
| PAID | Provider/bank payment independently reconciled to invoice; self-pay/test payments excluded | Finance |

Do not automatically advance a stage from a blog post, GitHub status, a machine signature, an automated test, a synthetic identity or an API call. Keep client names, contact data, SOWs, financials and full customer evidence in approved private systems, **not this public GitHub repository**.

## 5. Qualification questionnaire (ask privately, not a public upload)

1. Which agent/runtime and exact tool call is in scope? Name the action, resource and intended effect.
2. Who owns and can grant written permission to exercise the sandbox?
3. What counts as a forbidden or revoked action? How would the destination independently show it was not executed?
4. Where will authority, revocation, replay protection and effect-readback state live? Is each readable by an independent reviewer?
5. Which personal/regulated data might be processed? Can tests use controlled synthetic data?
6. Which outcome, evidence format, acceptance reviewer and deadline matter to the buyer?

Never request keys, private cases, customer records or exploit details via the public enquiry. Use an approved private handoff only after a signed confidentiality/data agreement and scoped authorisation.

## 6. Reproducible public proof: what may be claimed today

The original synthetic demonstrator was freshly replayed on the connected Mac on 2026-11-20 from master commit \`6304e43c20cab7687e2d3c8977a66d1e93a40634\`: **20/20 Node tests passed; 13/13 intentionally invalid synthetic cases wrote no effect; 1/1 allowed synthetic case produced a local file effect with separate-process readback.** The test key is synthetic. No production human, third-party endorsement, fresh model-attack result, GSPC board admission or outside buyer acceptance is established.

PR #4572 merged on 21 November. GitHub master CI run 44854144079 on pinned source ad3d28621addbb7ce58f8764871a7a96a9961c68 passed its self-replay and separate consistency check. All five exact unsigned/unanchored outputs, SHA-256 listing and limitations are staged under public/pilots/agent-authority/evidence/2026-11-21/ in this still-draft PR. This is not a live service, independent external assessment or production signature.

**Required before a public headline about stopping attacks:** a registered real attack/control matrix with held-out inputs, fixed model and guard versions, A/B control, actual action observation, precision/recall/false-positive reporting, overhead and reproducible third-party evidence. Negative results stay published. Cloudflare remote-preview 403 and Hugging Face Sandbox 402 are *blocked experiments*, not successful defences.

## 7. Service runbook — minimum reproducible delivery

1. Archive the signed SOW and rights/authority records privately. Record staff consent, review hours, independent challenger and exclusions.
2. Pin repository/harness commit, model/dataset revisions if used, dependency versions, fixture hashes and clock basis.
3. Run the current synthetic test suite as a readiness control, then the **buyer-approved** sandbox test matrix. Synthetic test status must never become the buyer's result.
4. Before each effect, verify an externally pinned issuer/authority root, exact actor, tenant, action, arguments, role, validity, revocation and one-time execution lease. Unknown -> deny.
5. Execute only scoped sandbox actions; have an independently qualified readback inspect the destination. Keep rejected output separate from effect state.
6. Preserve source data, baseline/attack pair, controls, exact environment, missingness, failures, hashes, review and corrections; no re-dating or inferred measurement admission.
7. Deliver the receipt/report, reproduction instructions, disputes route, buyer acceptance record and independent invoice/payment reconciliation.

**No real customer may be run until a genuine operator identity, human acceptance, insurance/contract permissions and secure system boundary are in place.** If unavailable, mark this NOT READY.

## 8. Communications and publishing gates

A legitimate announcement contains a claim, numerator/denominator, scope, observation date, source commit, how to reproduce, independent-readback limit and correction route. Do not tag Cloudflare, Hugging Face, NVIDIA, Red Hat or other vendors as partners without an evidenced partnership. Being in a startup programme and using an API are not an endorsement.

Public page candidate: \`/pilots/agent-authority/\`. The source is in this PR; it is **not live** until the normal GitHub Actions \`master\` deployment and an external readback. Leave the production writer lock intact.

## 9. Production dependencies / exact next owner gates

- **#4572** — claim-bounded proof card: CI, review, merge/production evidence or standalone release decision.
- **#4405** — durable customer enquiry: secure operator-only lead retrieval, abuse controls, visible alerts and browser/receipt acceptance **before** launch as reliable lead capture. Until then, keep email draft and check the real mailbox.
- **#4525** — invoice handoff and frontiers: review and reconcile; no independent second purchase flow.
- **#4415 / #4423** — retired RunPod origin/fresh measurement: replace or honestly retire. Do not claim fresh GSPC GPU results until remeasured and signed.
- **Cloudflare** — authenticated inference route blocked in the attempted remote preview (HTTP 403); troubleshoot on an isolated test project, never overwrite councilof-ai production.
- **Hugging Face** — Sandbox request returned HTTP 402; a Static Space is an alternative publication surface but does not itself execute a safety-model experiment.
- **People and controls** — authorized company adoption, actual security/privacy/reviewer rota, incident handling, customer contract, insurance, invoice and reconciled payment.

**Ready-for-sale definition:** a stranger can find the offer, reproduce a real scoped demo, submit an actual monitored enquiry, receive a human-reviewed written SOW, engage only an authorised sandbox, independently verify the delivery, accept the work, receive a real invoice and have payment accurately reconciled. No item is deemed complete from source code alone.
