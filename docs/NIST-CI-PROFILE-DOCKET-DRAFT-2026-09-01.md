# Docket contribution DRAFT — NIST AI RMF Profile: Trustworthy AI in Critical Infrastructure (Community of Interest)

**Status:** DRAFT — prepared for the owner to send. Do NOT file autonomously.
**Target (OPEN):** NIST *Trustworthy AI in Critical Infrastructure Profile* Community of Interest — mailing list + community channel; concept note dated 7 Apr 2026; no fixed comment deadline as of Sep 2026.
**Landing:** https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure
**Do NOT target (CLOSED):** GSA GSAR clause 552.239-7001 comment window closed 3 Aug 2026.

**From:** CSOAI Ltd (UK company 16939677), 3rd Floor 86-90 Paul Street, London EC2A 4NE — contact nicholas@csoai.org
**Subject:** Independent, reproducible behavioural measurement as an evidence layer for the Critical Infrastructure Profile

---

## Position (one paragraph)

The Profile frames *risk*; FedRAMP authorises the *security wrapper*; vendor system cards report *self-tested* behaviour. None of these produces an independent, reproducible, cryptographically signed record of how a given model *behaves* on the governance-and-safety dimensions a critical-infrastructure operator must reason about. We suggest the Profile explicitly recognise **independent behavioural measurement** — deterministic-grader, per-axis, per-model, signed and third-party-verifiable — as a distinct evidence class under the MEASURE function, alongside self-attestation and security authorisation.

## Why now (public context, cited)

- 31 Aug 2026: three frontier vendors (OpenAI, xAI, Google) went live on GenAI.mil at IL5 for a user base designed to exceed 3M seats. The deployments are sealed; only the security wrapper is externally authorised.
- 18 Mar 2026: CAISI×GSA MOU brought AI-evaluation science into federal procurement via USAi — the same evidence question this Profile faces.
- The recurring pattern: capability and authorisation scale fast; independent *behavioural* evidence does not. A cluster does not produce a signed card.

## Concrete suggestions for the Profile

1. **Name a MEASURE evidence taxonomy** that distinguishes (a) vendor self-report, (b) security/authorisation controls (e.g. FedRAMP), and (c) independent reproducible behavioural measurement. Operators should be able to see which class a given assurance belongs to.
2. **Reproducibility as a first-class property.** Where a behavioural claim is made, the Profile should encourage a published, re-runnable method and a verifiable signature over the result — so an operator (or a second lab) can recompute it, not just trust it.
3. **UNMEASURED / UNCHECKABLE as valid, recorded states.** For sealed or classified deployments, "not independently measurable" is an honest, useful answer and should be representable rather than papered over.
4. **A framework crosswalk anchor.** We maintain a public NIST AI RMF → behavioural-axes crosswalk (mapping GOVERN/MAP/MEASURE/MANAGE to specific measurable axes) that the COI is welcome to review and critique as a worked example — mapping only, not a conformity claim.

## What we are NOT asking for

- No endorsement, certification, accreditation, or conformity mark for CSOAI or any vendor.
- No legal determination. This is a measurement-method contribution.
- No disclosure of any non-public/classified system. We measure public models only.

## Attachments to include when sending

- Public crosswalk artifact: https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json
- Method / verification surface: https://councilof.ai/genai-mil and https://councilof.ai/signed/

---

### Owner send checklist
- [ ] Join the COI (mailing list + community channel) via the NIST landing page above.
- [ ] Confirm current submission channel/format the COI is using (RFI, position paper, working-session).
- [ ] Send from nicholas@csoai.org under CSOAI Ltd.
- [ ] File nothing to the CLOSED GSA 552.239-7001 docket.
