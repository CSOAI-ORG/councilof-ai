# CSOAI response outline — NPL call for evidence

**Draft for review only. Not entered or submitted.** Prepared 24 September 2026 from NPL's [live form](https://npl.tfaforms.net/103), [question PDF](https://www.npl.co.uk/getmedia/fbf8779e-07ae-4ee9-85a1-932eb68ebcc7/NPL-Call-for-Evidence.pdf), and the public CSOAI artifacts linked below. NPL states a closing time of **11:59 pm, 30 September 2026**, without specifying a timezone. The call informs the Centre for AI Measurement's programme design; it is not itself a grant application.

## Evidence that can be cited

- [Live GSPC board API](https://councilof.ai/api/gspc): read on 24 September. It reports 23 declared axes and 23 measured axes. For the 14 model-comparison axes, it reports 0 separated leaders, 2 ties, and 12 untested separations. The effect-binding row is a deterministic server probe, not a model score.
- [Effect-binding run](https://councilof.ai/interop/effect-binding-server-probe-2026-09-22.json): a 22 September public read-only MCP server probe. A frozen 600-server third-party sample yielded 261 bounded verdicts; the remaining states are recorded separately, including 230 uncheckable and 78 unreachable. Positive/negative controls and an injected grader defect were exercised before public probes. The probe observes the public tool boundary; it cannot establish whether an unknown argument was stripped or used downstream.
- [Signed run envelope](https://councilof.ai/interop/effect-binding-server-probe-2026-09-22.signed.json): Ed25519 signed at 2026-09-22T08:06:53.196Z using `did:web:csoai.org#board-attestation-1`. A 24 September independent readback recomputed the run SHA-256 (`e7083086fedf34d528caecf5771e0019ef34282c24727532e70ede8b1b87fc69`), matched the signed payload digest (`d2196fe478ec37d1833a3b4526a6cd893c366bc44e29a8ec590aa5a1c8d84dac`), and verified the Ed25519 signature against the [public DID document](https://csoai.org/.well-known/did.json). The signature binds bytes; it does not certify a server or prove a Bitcoin anchor. Do not circulate the raw transcript, which is under privacy review.

## Part 1 — organisation fields

Responding on behalf of **CSOAI Ltd** is consistent with the public board's issuer field. Candidate classifications are provider of third-party AI testing/evaluation and software/IT services, with cross-sector work. **Confirm organisation size, category, sector choices, representative name and contact details before entry.** Select the supply-side perspective if the response is on CSOAI's measurement methods; that determines which optional Part 2B questions appear.

## Part 2A — ecosystem gaps (all respondents)

**1. Unmet testing/evaluation needs.** Agentic systems need reproducible checks that distinguish what a tool declares, what the service accepts at its public boundary, what it actually executes, and what evidence is returned. Our public MCP probe illustrates why denominator and uncertainty states matter: 261 of 600 sampled third-party servers received bounded verdicts; authenticated, unreachable or otherwise uncheckable servers were not treated as failures. Our board also separates a measured axis from a statistically separated model leader. These are examples of reporting discipline, not evidence that the method is a sector-wide standard.

**2. Why the gaps persist.** Public endpoint testing cannot see behind a server boundary. In our probe, silently accepted unknown arguments could have been stripped before execution; the available response cannot distinguish that case from downstream use. Authentication, varying schemas, one-tool sampling, limited vantage points and restricted access to representative real deployments also constrain comparison. Shared controls and rules for reporting unknown outcomes remain needed.

**3. Useful public intervention.** Provide consent-based testbeds with known positive, negative and ambiguous reference cases; support independent replication of instruments across implementers; publish common method cards covering sampling, controls, verifier versions, outcome semantics and limitations. This would strengthen comparability without declaring one vendor's scoring system authoritative.

## Part 2B — supplier-specific needs (optional)

**1. Capability to develop/validate over 1–2 years.** We propose validating a versioned, independently reproducible method for agent/tool boundary behaviour and evidence provenance, starting with read-only MCP calls. A useful output would be a public reference corpus, controls, verifier contract and repeatability report that lets buyers understand exactly what a result does and does not establish. This is a proposed extension of the dated public probe, not a currently validated cross-sector product.

**2. Barriers.** The public probe could not inspect backend effects, refused to cross authentication walls, and used one read-only tool and one operating point per server. Independent testbed access, repeat observations, privacy-safe traces and validation by parties other than the method author would be needed before stronger claims.

**3. Support with a practical result.** An NPL methods accelerator paired with a consenting deployment pilot could stress-test the instrument against known server behaviours and record false positives, false negatives, repeatability and inter-operator differences. The deliverable would be a publishable method and limitations report, with confidential operational data excluded or redacted by agreement.

## Part 3 — intervention design

**1. Most valuable option.** The methods accelerator is the best first fit for this technical gap; a matched testing pilot should then test generalisation in a real deployment. This is a proposal, not an award or invitation.

**2. Another approach.** Run a blinded calibration challenge using reference MCP services that deliberately reject, strip or pass through an unexpected argument and vary receipt quality. Publish the harness, expected outcomes, measurement uncertainty and cross-team reproducibility. Distinguish structural schema checks from observed execution.

**3. Participation.** CSOAI could offer the public instrument and signed run as material for critique and, if accepted, participate as a method provider in a bounded pilot. **Confirm willingness and capacity before selecting this option.** No NPL relationship is claimed.

**4. Conditions.** Written permission and a clear test scope for any nonpublic system; privacy-safe records; access to reference behaviours or consenting deployments; and independent review of methods and findings. Costs or resource commitments need a separate factual assessment.

**5. Focus areas.** Agent/tool boundary behaviour, effect binding, provenance of returned evidence, unknown and access-restricted outcomes, and repeat measurements across software versions and operating environments.

**6. Other information.** Link the dated public board, run and signed envelope above. State that 23 measured axes are not 23 validated comparative advantages, that the MCP result is bounded to its 22 September sample, and that the signature proves byte integrity rather than truth of every interpretation.

## Part 4 — publication and contact choices

NPL says it does **not intend to publish individual responses**; it expects an **aggregated, unattributed** summary. The form separately asks whether CSOAI may appear on a public **list of contributors**. That would acknowledge a response only, not an endorsement or accepted method. Leave the contributor-list, clarification-contact and future-updates choices for Nick to set before any submission. No form entry or message has been sent.
