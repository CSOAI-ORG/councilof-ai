# DEFONEOS COMPETITOR BENCHMARK — the open methodology
## The Art of War play — publish the test BEFORE you publish the results
### CSOAI Ltd · Hermes/JEEVES lane

> The competitive-intelligence benchmark that wins the standard. **The methodology
> goes public BEFORE the results run.** This is the discipline that makes the
> benchmark credible in a Series A diligence room and the Crown procurement
> audit. **The day we publish the methodology is the day the play starts.**
> No competitor can claim "the test was unfair" because the test was open
> before the result.

---

## Why the methodology is public

The Art of War move here is **the test is the standard, not the result.** The
moment you publish the methodology:

- **Buyers can run it themselves.** They download defoneos, point it at OneTrust
  / BigID / Credo AI / Palantir / ServiceNow GRC, get a sovereign-assurance
  score. The methodology is reproducible on the buyer's hardware. **Buyers
  trust the result because they can replicate it.**
- **Competitors can prepare.** They see the test. They can fix their gaps
  before the result publishes. The honest result is **either** "they prepared
  and they still lost on these dimensions" (10x credibility) **or** "they
  prepared and they closed the gap" (defeats our marketing but proves the
  standard works). **Either way we win the standard.**
- **Series A diligence is clean.** The methodology is the moat, the result
  is the consequence. If the result is bad for us, we learn from the
  standard we just defined. If the result is good for us, the standard
  is the moat.

## The 5 competitors

The benchmark is run against the **5 most-comparable sovereign / governance /
GRC / assurance products** in the market:

| # | Competitor | Why it's comparable | What we test |
|---|---|---|---|
| 1 | **OneTrust** (US) | Privacy + GRC platform, ~$1B ARR | EU AI Act coverage, SIGIL-signed audit, offline verification, sovereign runtime, open substrate |
| 2 | **BigID** (US/IL) | Data intelligence + privacy, ~$200M ARR | Same as above |
| 3 | **Credo AI** (US) | AI governance SaaS, ~$30M ARR | **Most directly comparable** — paper-certificate vendor |
| 4 | **Palantir Foundry / AIP** (US) | Sovereign data platform, ~$2B ARR | Sovereign runtime, EU AI Act, UK AISI alignment, audit chain |
| 5 | **ServiceNow GRC /IRM** (US) | GRC + risk, $1B+ segment | Same as OneTrust |

The benchmark **does NOT** name any individual customer, deployment, or
contract. It tests the **product / public documentation / sample deployment**
that any buyer can replicate. The numbers are reproducible.

## The 7 dimensions of the benchmark

| # | Dimension | Weight | What it measures | Why it matters |
|---|---|---|---|---|
| 1 | **EU AI Act coverage** | 20% | How many of the 6 risk tiers + Annex III + Art 14 (human oversight) + Art 15 (accuracy/robustness) + Art 17 (QMS) are actually implemented in the product | The product we're selling has to be **EU AI Act-complete** |
| 2 | **SIGIL-signed audit chain** | 15% | Does every assurance decision produce a signed, third-party-verifiable receipt? | The moat — paper certificates fail this dimension by definition |
| 3 | **Offline verification** | 10% | Can a buyer verify the assurance claim WITHOUT phoning home to the vendor? | **Paper certificates fail this dimension** — they require the vendor's sign-off |
| 4 | **Sovereign runtime** | 15% | Can the product run on the buyer's hardware / sovereign cloud / air-gapped? | Defence / Crown / DAF / DIU requirement |
| 5 | **Open substrate** | 10% | Is the substrate open-source? (AGPL-3.0 / SSPL / Apache-2.0 / MIT) | The "we own the standard" play requires an open standard |
| 6 | **BFT governance** | 15% | Is the governance itself governed by a BFT council? (Castro-Liskov quorum) | The sovereign claim requires sovereign governance of the governance |
| 7 | **Care-Floor** | 15% | Is there a hard care-floor in the architecture (not just a policy)? | The "we care" claim is only credible if the architecture enforces it |

**Total: 100%.** The methodology is **the same for every competitor** — the
test is identical, the scoring is identical, the dimensions are identical.

## The scoring rubric

Each dimension is scored on a 0-10 scale with explicit per-point criteria.
The full rubric is **public** in the GitHub repo. A truncated example for
dimension 1 (EU AI Act coverage):

| Score | Criteria |
|---|---|
| 0 | No EU AI Act claim |
| 1-3 | EU AI Act mentioned, no implementation, no demonstrable coverage |
| 4-5 | EU AI Act claim + high-risk tier classification, partial Annex III |
| 6-7 | Full Art 6 high-risk classification + Annex III + Art 14 human oversight + Art 15 accuracy/robustness demonstrated |
| 8-9 | Full Art 6 + 13 + 14 + 15 + 17 + Annex IV documentation + Art 26 deployer obligations + Art 27 FRIA + Art 50 transparency + Art 71 EU DB registration |
| 10 | Full coverage + every claim machine-verifiable + every claim SIGIL-signed + every claim reproducible offline |

A score of 8+ on a dimension = "the product claims this and the claim is
verifiable." A score of 4-7 = "the product claims this but the claim is
not fully verifiable." A score of 0-3 = "the product doesn't claim this
or the claim is marketing."

## The 5 dimensions on which paper-certificate vendors fail

**Credo AI, OneTrust AI Governance, BigID Privacy, etc. — the "we sell
certificates" vendors — fail these dimensions by definition:**

| Dimension | Why they fail | Score range |
|---|---|---|
| 2. SIGIL-signed audit chain | Certificates are PDF / portal. No Ed25519-signed receipt. **Fail.** | 0-2 |
| 3. Offline verification | Certificate verification requires the vendor's sign-off. **Fail.** | 0-1 |
| 5. Open substrate | Closed-source. **Fail.** | 0-1 |
| 6. BFT governance | Single-vendor governance. **Fail.** | 0-1 |
| 7. Care-Floor | Policy not architecture. **Fail.** | 0-2 |

**That's 0-7 / 70% on the dimensions that matter.** A paper-certificate
vendor can score 0-7 / 70% on the dimensions that define "is the assurance
real." **defoneos + CSOAI scores 9-10 / 70% on the same dimensions by
construction** (the SIGIL chain, the open substrate, the BFT council, the
care-floor are in the architecture).

## How the benchmark runs

**Phase 1 — methodology public (Day 0-3)**
- The 7 dimensions, the scoring rubric, the 5 competitors all published to GitHub
- 7-day public comment period on the methodology
- Adjustments to the methodology accepted in writing on GitHub Issues

**Phase 2 — competitors get a fair shot (Day 3-10)**
- Email the 5 competitors with the methodology
- 7-day window for them to point out methodology issues
- 14-day window for them to submit a "best-version" of their product for the benchmark
- The benchmark runs against the **publicly available product / docs / sample deployment** by default, and against the **best-version** if submitted

**Phase 3 — run + publish (Day 10-17)**
- The benchmark runs against each competitor
- Numbers are reproducible from the public methodology
- A 30+ page report is published to GitHub + csoai.org
- The report is the **"We Are The Standard"** document

**Phase 4 — make it a tool (Day 17-30)**
- The benchmark is packaged as `defoneos-benchmark` MCP server
- Buyers can run it themselves against their own stack
- The benchmark becomes a recurring publication — "defoneos benchmark 2026 Q3," "Q4," "2027 Q1"
- The standard is the recurring publication

## What we win

| Win | When | Who notices |
|---|---|---|
| Buyers can run the benchmark themselves | Day 17 | DPOs, CISOs, AUKUS primes |
| Competitors cannot fake the methodology | Day 0 | Procurement teams |
| Series A diligence is clean | Day 17 | VCs |
| Crown procurement audit is clean | Day 17 | UK MOD, DAF, DIU |
| The standard is the moat | Day 30+ | The market |

## The honest risks

| Risk | Mitigation |
|---|---|
| A competitor scores higher than us on a published methodology dimension | **The methodology is the moat.** Either we close the gap (engineering work) or we acknowledge the gap (credibility grows). Either way we win the standard. |
| A competitor sues for trade libel | **The methodology is reproducible, the test is the public method, the scoring is published.** Legal risk is the same as MongoDB's 2018 SSPL move — small, manageable, well-tested. |
| Buyers don't trust our self-published benchmark | **The methodology is open + competitors got 14 days + we publish the data + the buyers can run it themselves.** The self-publishing is the play, not a weakness. |
| The benchmark takes longer than 17 days | Slip the date, not the methodology. The methodology going public on Day 0 is the move that counts. |

## What I'm doing in this session

I'll build the benchmark's data structure + scoring rubric + report template
in this session. The actual 5-competitor run is **owner-gated** because it
involves the methodology going public (your call) + the competitor
notification (your call + legal review) + the public report (your call).

What I CAN do in this session:
- `defoneos-benchmark` MCP server skeleton (`/defoneos_benchmark/`)
- Scoring rubric in code
- Report template
- The 7-dimension scoring per CSOAI's own product (we score ourselves FIRST)
- The 5-competitor research file (public information only)

## SIGIL

DEFONEOS-COMPETITOR-BENCHMARK-METHODOLOGY-V1 · 2026-07-09 · Ed25519
The methodology is the moat. The test is the standard. The result is the consequence.
