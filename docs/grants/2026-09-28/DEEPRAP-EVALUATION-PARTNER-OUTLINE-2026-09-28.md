# EIC Pathfinder Challenge DeepRAP: evaluation-partner outline. DRAFT, NOT SUBMITTED

Status: HELD. Owner asks: (1) make the go/no-go call by 2026-10-07; (2) share this outline only with a coordinator who has approached CSOAI or whom you already know (no cold outreach, and nothing posted to the Partner Search board without your decision); (3) if the answer is go, create the EU Login and register CSOAI Ltd for a PIC on the Funding & Tenders Portal yourself.

Role: **evaluation partner only.** CSOAI Ltd would not coordinate, would not apply alone, and would not build the cognitive AI system. See section 2 for why.

Lane: grants-20260928. Call facts were read from the EU Funding & Tenders Portal topic data, the EIC Work Programme 2026 and the DeepRAP Challenge Guide (last update 22-09-2026) on 2026-09-28. CSOAI figures were read from live endpoints the same day.

---

## 1. Call facts (quoted from primary text)

- **Topic:** HORIZON-EIC-2026-PATHFINDERCHALLENGES-01-03, "DeepRAP: Deep Reasoning, Abstraction & Planning towards trustworthy Cognitive AI Systems". Status "Open" on the portal.
- **Deadline:** "Call deadline date: 28 October 2026 at 17h00 Brussels local time" (Challenge Guide). The Work Programme says the same: "The call deadline for submitting your proposal is 28 October 2026 at 17h00 Brussels local time."
- **Size:** portal budget data, per action: minimum contribution EUR 500,000, maximum EUR 4,000,000, 8 expected grants, lump-sum grant (HORIZON-AG-LS).
- **Who may apply:** "The EIC Pathfinder Challenges can support projects from consortia or from single legal entities." "Consortia of two entities must be comprised of independent legal entities from two different Member States or Associated Countries."
- **UK status:** the Work Programme lists the United Kingdom among "countries associated to Horizon Europe", and its footnote says "The United Kingdom is associated to the entire Horizon Europe Programme, with the only exception of the investment component of the EIC Accelerator". The EIC FAQ: "As from 1 January 2024, UK entities may apply to calls of the EIC for grant funding implementing budget for the year 2024 onwards including the EIC Pathfinder scheme".
- **Portfolio activities:** "The selected projects will also be assigned to lead and/or engage in portfolio activities centred on the following priorities", including "Benchmark Development: Co-creating a DeepRAP benchmark with shared tasks and an open evaluation platform for transparent assessment". The Challenge Guide's synergy category reads: "Benchmark Development (Ben): Proposals contributing to the portfolio-wide creation of shared benchmarks for reasoning, abstraction, and planning, including data, shared tasks, and open evaluation protocols."
- **Portfolio work package:** "it is proposed to foresee in your proposal a dedicated work package for portfolio activities and to allocate at least 10 person-months" (Challenge Guide section 4.1).
- **Expected outcome relevant to evaluation:** proposals will propose new methods and metrics for evaluating reasoning and trustworthiness in AI, and will "Follow the FAIR principles ensuring all data, models, and results are Findable, Accessible, Interoperable, and Reusable".
- **Page limit:** Part B sections 1 to 3, maximum 30 pages. The portal notice of 2026-08-27 corrected an earlier 25-page message.

## 2. Why partner, and why not a single application

The Challenge asks for new approaches to reasoning, abstraction and planning, "reaching TRL4" in an integrated cognitive AI system. CSOAI builds measurement, not cognitive AI systems. A single application from CSOAI would propose no such system and would not meet the objective. The honest fit is the part of the Challenge that every funded project must take part in and that CSOAI already does: shared benchmarks, open evaluation protocols, and results that others can recompute.

A two-entity consortium is the minimum shape: a coordinator in an EU Member State building a DeepRAP system, plus CSOAI Ltd (UK, Associated Country) as evaluation partner.

## 3. What CSOAI would bring (checkable today)

Each item below was read from a live endpoint on 2026-09-28:

- **Frozen task banks and a deterministic grader**, with per-item rows published. The public board reads "23 axis · 23 measured", with its own caveat "0 of 14 model-comparison axes separated a leader · 8 TIE · 6 UNTESTED" (GET https://councilof.ai/api/gspc). TIE and UNTESTED are kept as separate states, and neither is folded into the other.
- **Signed, offline-verifiable records.** 335 signed cards in the signed card index, all 335 verify (GET https://councilof.ai/api/state, card_chain.bodies_verified_valid, kind "measured"). Verification rule and script: https://councilof.ai/signed/HOW-TO-VERIFY.md and https://councilof.ai/signed/verify-card.mjs.
- **A public Merkle root:** 310 leaves, as_of 2026-09-28T07:32:07Z (https://councilof.ai/root.json). This is a separate corpus from the card index, with zero overlap, and the two are never added.
- **A dated corrections ledger:** 78 entries, signature VALID (GET https://councilof.ai/api/corrections).
- **Open data:** 127 datasets on Hugging Face under https://huggingface.co/csoai. Methodology record DOI 10.5281/zenodo.21991104.
- **Standards work:** individual Internet-Draft draft-templeman-scitt-measurement-capsule, "Declared-versus-Observed Measurement Capsules". It is an individual draft with no IETF standing.

## 4. Research question (falsifiable)

**Question.** Can claims about reasoning, abstraction and planning be written as declared-versus-observed measurement statements that any third party can recompute offline, and how large is the gap between what a system's documentation declares and what frozen, held-out tasks observe?

**H1.** For DeepRAP-class systems at TRL 3 to 4, the declared performance interval in a project's own documentation is not reproduced on frozen held-out tasks for a measurable share of capabilities. The size of that share is UNMEASURED today, and the project would measure it. H1 is rejected if every declared interval is reproduced within its stated uncertainty.

**H2.** A separation test (paired where the design allows) will distinguish reasoning variants on shared DeepRAP tasks more often than point estimates suggest. H2 is rejected if all comparisons return TIE at the pre-registered threshold.

Both hypotheses are pre-registered before any system is run, and results are published whichever way they fall.

## 5. Draft work package (for the coordinator's Part B)

**WP-E: Independent measurement and open evaluation** (lead: CSOAI Ltd). Indicative effort: 20 to 30 person-months over the project. The coordinator sets the lump-sum split.

- **T-E1 Frozen banks with a held-out split.** Tasks for reasoning, abstraction and planning, drawn with the consortium from the chosen application domain. A public development split, and a held-out split with a stated rotation and reveal schedule. Deliverable: bank release with hashes.
- **T-E2 Declared-versus-observed statements.** Each partner states its claim before measurement. CSOAI measures on the held-out split and publishes a signed statement pairing declared and observed values. Deliverable: signed statement set plus verifier.
- **T-E3 Statistical protocol.** Wilson intervals where items are independent, paired tests for separation, and SEPARATED, TIE and UNTESTED reported as distinct states. Deliverable: protocol document, pre-registered.
- **T-E4 Contribution to the portfolio benchmark (Ben).** CSOAI contributes the bank format, statement format and verifier to the portfolio-wide DeepRAP benchmark and open evaluation platform. This counts toward the portfolio work package (at least 10 person-months advised).
- **T-E5 FAIR release.** Data, rows and statements under open licences on Hugging Face and Zenodo, with a DOI per release.

**Independence conditions** (to be written into the consortium agreement): CSOAI publishes every measurement, including those unfavourable to the consortium's own system. The coordinator has no veto over publication. CSOAI issues no marks, labels or pass/fail outcomes about any partner's system.

## 6. Ethics and security (Part A basics)

- No personal data in the task banks. Human-subject work, if the coordinator's use case needs it, sits outside WP-E.
- No dual-use content in the banks. Any safety-relevant items are held out and not published verbatim.
- Signing keys are held by CSOAI. Key rotation is published in the did:web document.

## 7. Go/no-go test for the owner (by 2026-10-07)

Go only if all of the following hold:
1. A coordinator in an EU Member State, already building a DeepRAP system, wants an independent evaluation partner, and the contact came to us or through someone you already know.
2. The coordinator accepts the independence conditions in section 5 in writing.
3. CSOAI Ltd can register on the Funding & Tenders Portal (EU Login, PIC, LEAR) before 2026-10-21, leaving a week for the budget table.
4. The coordinator's Part B carries the novel science. This outline is not the science case for the whole proposal.

Otherwise: no-go, and the outline is kept for the next EIC Challenge that names open evaluation.

## 8. Next owner step, exactly

Decide go/no-go by 2026-10-07 against section 7. If go: create the EU Login, register CSOAI Ltd for a PIC, and send this outline only to the coordinator who approached us. If no-go: nothing to do.
