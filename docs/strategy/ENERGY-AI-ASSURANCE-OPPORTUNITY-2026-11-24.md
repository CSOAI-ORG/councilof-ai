# Energy / industrial AI assurance opportunity — scoped research, 24 November 2026

**Research-only; no regulatory submission, plant integration, company licensing assertion, legal decision, signed GSPC evidence or customer contract.** Ofgem opened its [Approach to AI assurance in the energy sector consultation](https://www.ofgem.gov.uk/consultation/approach-ai-assurance-energy-sector) on **18 November 2026**, status **OPEN**, closing **15 January 2027**. Official page confirms technology developers, AI assurance professionals and energy licensees among intended respondents; participation is not endorsement.

Ofgem's [AI Reg Lab page](https://www.ofgem.gov.uk/guidance/ofgem-ai-reg-lab-call-submissions), last updated 2 October 2026, describes table-top exercises on agentic AI; the **25 November 2026** event was open to licensees (possibly with innovation partners), with a **21 October 2026** submission deadline, now expired. Do not revive that window or claim eligibility. Future Reg Labs may have different eligibility and dates.

## A concrete, bounded technical fit

Borrow well-understood principles from process-control safety and industrial metrology. The product hypothesis is **assurance of an AI-assisted operational decision**, not nuclear safety certification or industrial supervisory control.

A proposed first synthetic demonstration:
1. Construct a lawful, non-plant-connected synthetic “dispatch-recommendation” episode with independently declared allowed/forbidden actions and failure severity.
2. Give the same frozen information to autonomous-only, human-information and human-authority-condition test arms. No real physical command.
3. Use #4763 check-standard/CUSUM-style monitoring to detect a known injected telemetry anomaly; measure sample-based false positive and delayed detection separately from the model's answer.
4. Use #4764 reaction bridge to preserve request, reference method, simulated/observed realm and missing authority/effect stages.
5. Simulate a “wrong plant state”, “stale meter”, “missing human signoff” and “revoked principal” negative control. Each should be refused or report UNKNOWN according to its defined rule; do not report simulated avoided harms as real.
6. Independently blind-check the grader on heldout episodes; report errors, confidence intervals, outcomes and impossibility of extrapolating to industrial safety without real measured systems and a qualified functional-safety process.

Potential external recipient job (NOT OFFERED/APPROVED): a UK energy software vendor reviewing an agent's non-safety-critical workflow receives an exact source-bound replay packet and verifies the outcome in its own sandbox. Human reviewer and privacy rights need separate agreements.

## Standards/method references to investigate, without claiming conformance

- [NIST/SEMATECH e-Handbook — process monitoring and SPC](https://itl.nist.gov/div898/handbook/pmc/section1/pmc12.htm): chart design and calibration, not an AI safety certificate.
- [IAEA instrumentation and control safety resources](https://www.iaea.org/topics/instrumentation-and-control): engineering safety culture, independent channels, defence-in-depth.
- [MIT STPA handbook](https://www.mit.stamp-institute.com/handbooks): unsafe control action analysis and controls/feedback.
- [NIST AI Risk Management Framework Playbook](https://airc.nist.gov/airmf-resources/playbook/): risk govern/map/measure/manage with declared context.
- [W3C PROV-O](https://www.w3.org/TR/prov-o/): represent evidence derivation and actor involvement; a graph edge does not authenticate principal or prove an effect.

## Regulatory/business research questions, not legal assertions

- What “AI assurance” evidence would a licensee actually receive and accept in an agentic workflow? Who is authorized to decide and retain the evidence?
- Which tests remain company-internal and which independent reviewers can reproduce without confidential grid telemetry?
- What lifecycle events (model change, software patch, incident, supplier switch, regulatory review) trigger valuable repeat work?
- What is the direct cost of one reproducible packet (engineering, security review, independent reviewer, hosting and correction handling), and who pays for it?
- What is the scope of any local safety, cyber and data processing obligations for an actual buyer? Needs qualified legal/security review, not an automated crosswalk.

## Immediate action (owner controlled)

Preserve the consultation as a source-bound potential research opportunity in the **existing** legal/regulatory review process. An authorized company owner may ask a subject-matter expert to develop a **reviewed** response before 15 January 2027, or elect not to participate. No contact, form, email, or regulatory submission from this research branch. Do not call Ofgem a CSOAI partner.
