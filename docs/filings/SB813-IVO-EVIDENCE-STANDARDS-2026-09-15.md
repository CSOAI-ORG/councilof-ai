# What an IVO's Evidence Should Look Like

**Position paper for California SB 813 rulemaking**
CSOAI Ltd · September 15, 2026 · CC BY 4.0

---

## Summary

California SB 813 (Chapter 179, signed September 9, 2026) creates the first US statutory framework for Independent Verification Organizations (IVOs) assessing AI systems. The Government Operations Agency must develop IVO designation criteria by January 1, 2028, through stakeholder working groups.

This paper proposes evidence standards for each of the four IVO designation criteria in §8898.1(c)(2). It is grounded in what we actually publish and what a stranger can independently verify.

**This is not a claim that CSOAI is a designated IVO.** Designation requires GovOps application. This is not legal advice. This is not a California Government Operations Agency endorsement.

---

## Criterion A: Assessing risks and identifying metrics/methodologies

**Statute (§8898.1(c)(2)(A)):** An IVO must demonstrate expertise in assessing the risks posed by an AI system or model and identifying the metrics and methodologies that form the basis for that assessment.

**Evidence standard proposed:**

1. **Frozen, published instruments.** Each measurement axis uses a versioned, hash-pinned bank of test items. The instrument is published before any model is graded against it, and the bank never changes mid-measurement.

2. **Deterministic grading.** No model judges another model. Every score is computed by a deterministic grader (keyword match, exact match, regex, numeric comparison) against the frozen bank. The grader code is published.

3. **Per-item evidence.** Every signed measurement card carries the full item-level evidence — the model's response to each test item, the expected answer, and the grader's deterministic verdict. A stranger can re-grade every item from the published bytes.

4. **Three-state honesty.** Every cell is MEASURED (a real run exists), UNMEASURED (no run — the slot exists but is empty), or INDEXED (the subject is known but not yet probed). Zero-filling is explicitly forbidden.

**Verify:** `curl -s https://councilof.ai/api/gspc | jq '.totals'`

---

## Criterion B: Personnel with sufficient technical expertise

**Statute (§8898.1(c)(2)(B)):** An IVO must employ or engage personnel with sufficient technical expertise to conduct its assessments.

**Evidence standard proposed:**

1. **Dedicated compute.** The measurement mill runs on dedicated GPU hardware with a worker that grades models against frozen banks 24/7. The worker's health is publicly observable.

2. **Multi-witness timestamping.** The public root is maintained by a signed, timestamped, multi-witness process: Ed25519 signatures, OpenTimestamps (Bitcoin), Rekor transparency log, and (pending) XRPL memo anchor.

3. **Public corrections.** The corrections ledger records every error in published figures, how it was caught, and the fix. Corrections are permanent — never deleted or edited.

4. **Published methodology.** The measurement methodology, frozen banks, and card verification code are all published and freely accessible.

**Verify:** `curl -s https://councilof.ai/api/worker | jq '{status, worker.state}'`

---

## Criterion C: Managing conflicts of interest

**Statute (§8898.1(c)(2)(C)):** An IVO must identify and manage potential conflicts of interest. Payment from the assessed party is allowed at reasonable market rates, but payment must not be conditioned on the results of the assessment.

**Evidence standard proposed:**

1. **No issuer-pays.** The entities measured never pay for their measurement. Results are published regardless of whether the measured party is a customer.

2. **Revenue from delivery, not findings.** Revenue comes from machine-readable data delivery (x402 doors), not from favourable findings. The settlement ledger is public.

3. **Self-settlements excluded.** Self-settlements are explicitly excluded from revenue counts. A wallet we control paying us is recorded for audit but is neither revenue nor a buyer.

4. **Free corrections.** Corrections are free forever. A measured party can request a correction at no cost, and the correction is published regardless of who requested it.

5. **Published conditions.** The independence-conditions page publishes our five conditions: no lab money, no gag clauses, methods on the card, corrections ledger governs, access/redaction terms published.

**Verify:** `curl -s https://councilof.ai/api/revenue | jq '.one_number'`

---

## Criterion D: Independence from the party being assessed

**Statute (§8898.1(c)(2)(D)):** An IVO must maintain independence from the party being assessed — no operational or management dependence, free from the assessed party's control in reaching conclusions.

**Evidence standard proposed:**

1. **No required access.** We do not require, request, or receive API access from the entities we measure. Every measurement uses publicly available endpoints. If a model is unreachable, the cell reads UNMEASURED.

2. **Content-addressed cards.** The measurement card's signature is over the exact bytes that were graded. The card is content-addressed (sha256), so altering any byte invalidates the signature. The assessed party cannot modify a card after signing.

3. **Independent verification.** The public root commits to the full leaf list. Every card is independently verifiable — fetch the card, recompute the hash, check the signature against the published DID key. The assessed party has no role in this process.

4. **Public corrections.** When we get something wrong, the corrections ledger records it publicly. The assessed party does not approve or suppress corrections.

**Verify:** `curl -s https://councilof.ai/root.json | jq '{card_count, as_of, merkle_root}'`

---

## The five conditions

Before accepting access to any AI system for evaluation, we publish these conditions:

1. No money from the developer being evaluated.
2. No gag clauses — the right to publish findings without editorial control.
3. Methods on the card — the measurement methodology is published with every result.
4. Corrections ledger governs — errors are published publicly and permanently.
5. Access and redaction terms published — when we receive access, the terms are visible.

These conditions are what SB 813 §8898.1(c)(2)(C) and (D) already require. We publish them so the rulemaking has a concrete reference.

---

## What this is not

- Not a claim that CSOAI is a designated IVO. Designation requires GovOps application.
- Not legal advice. This is a technical evidence-standards proposal.
- Not a certification. We measure, we do not certify. A grade is never sold.
- Not an endorsement by the State of California. SB 813 §8898.4(a)(2) explicitly states that publication of criteria does not constitute state recommendation.

---

## Sources

- SB 813, Chapter 179: https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260SB813
- GSPC board: https://councilof.ai/api/gspc
- Public root: https://councilof.ai/root.json
- Corrections ledger: https://councilof.ai/api/corrections
- Revenue ledger: https://councilof.ai/api/revenue
- Card verification: https://councilof.ai/signed/verify-card.mjs
- Methodology: https://councilof.ai/methodology
- Independence conditions: https://councilof.ai/evaluator-access
- Worker health: https://councilof.ai/api/worker

---

Issued by CSOAI Ltd (England & Wales, Companies House 16939677), 3rd Floor, 86–90 Paul Street, London EC2A 4NE. CC BY 4.0. Corrections: https://councilof.ai/api/corrections
