# 05 — Market

The "is the market real and is the timing right?" folder. Every market claim must carry a source. TAM is presented top-down **and** bottom-up, with estimates marked as estimates.

| # | Document | Why an investor needs it | Status | Source / how to verify |
|---|---|---|---|---|
| 05.1 | 2026 research dossiers | The primary research behind the market thesis — live web + journal sourced, SURE/GUESS marked. | **HAVE** | `_alignment/RESEARCH_AQUACULTURE_2026-06-02.md`, `_alignment/RESEARCH_ROBOTICS_2026-06-02.md`. |
| 05.2 | TAM / SAM / SOM with sources | Sizes the opportunity honestly; separates the big top-down number from the reachable bottom-up one. | **IN-PROGRESS** | Build `tam_model.md` (skeleton below). Cite every input. |
| 05.3 | Regulatory deadline calendar | The why-now: the fixed dates that force demand. The strongest market signal we have. | **HAVE** | From RESEARCH_AQUACULTURE §5: ASC Farm Standard v1.0.1 effective 1 Aug 2025, **mandatory 1 May 2027**; RSPCA Assured trout 177 new standards in force 23 Jul 2025; RSPCA salmon 300+ standards since 19 May 2024; EU AI Act penalties up to €35M/7% turnover. |
| 05.4 | Competitive landscape | Who else is here (Vanta/Drata/OneTrust in compliance; the aquaculture vacuum). Shows we know the field. | **IN-PROGRESS** | Compliance incumbents are SOC2/ISO-focused, closed-source, not AI-Act-native. Aquaculture compliance SaaS: **none identified** (farms pay £800–£2,500/yr to human consultants). Vertical-farm capital cycle collapsed (~$1.37bn torched) = vacuum. Write `competition.md` citing these. |
| 05.5 | Beachhead rationale | Why aquaculture first, then compliance core. | **HAVE** | The wedge has a hard deadline (ASC 2027), no incumbent SaaS, and the founder owns a fish farm (domain credibility). See deck slide 9. |

## TAM model skeleton (fill 05.2 against this — mark every estimate)

- **Top-down (context, not the bet):** the global AI-governance/compliance-software market is large and growing on the back of the EU AI Act. *Cite a specific named analyst figure with year before using any number — do not invent one.* Status: **NEED a sourced figure.**
- **Bottom-up beachhead (the honest, reachable number):**
  - UK trout farms ≈ **290** (RESEARCH_AQUACULTURE / ALIGNMENT §2a) [SURE].
  - ASC-certified UK sites ≈ **83** [SURE].
  - Each currently pays **£800–£2,500/yr** to human compliance consultants [SURE].
  - → Beachhead SAM (trout + ornamental/koi retail under LAIA) is a **low-£-millions/yr** services-replacement pool — small, but real, deadline-driven, and uncontested. *This is the number to lead with: a modest, defensible, sourced SOM beats an inflated TAM.*
  - Adjacent expansion: salmon (larger sites, higher ACV), then the broader EU AI Act compliance core (the €35M-fine driver) once the wedge proves the motion.

**Honesty flags:**
- Lead with the **bottom-up, sourced** beachhead number. A giant top-down TAM with £0 revenue behind it is the fake move.
- Every figure carries SURE/GUESS provenance from the dossiers. Do not strip the provenance when it moves into the deck.
