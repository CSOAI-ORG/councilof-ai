# 26 — AIUC-1 contributor community Typeform (FORM, not email)

segment: E — crosswalk review; the auditors are the feed buyers afterwards
status: DRAFT — nothing submitted (no endpoint dependency — the crosswalk page must be 200: `curl -s -o /dev/null -w '%{http_code}' https://councilof.ai/crosswalk/`)

**Door:** https://aiuc.typeform.com/contributors (linked from https://www.aiuc-1.com/research/contributor-community, read 2026-09-02). Contributors "peer-review standard updates and cross-walks, suggesting specific requirements, and adapting the standard to new modalities, like voice"; commitment = quarterly calls, optional workshops, surveys, newsletter. Typeform questions not read — UNVERIFIED; assume name / email / organisation / role / which of the three groups / why / what you can contribute.

## Form answers (drafted)

- **Name / email / organisation / role:** Nicholas Templeman · nicholas@csoai.org · CSOAI LTD (Council of AI), UK 16939677 · Founder
- **Which group:** Security professional / independent evaluator (not an agent builder, not a buyer)
- **Why join:** We publish a 22-axis measurement board over open models with a crosswalk from each axis to the regulation text it touches, and a corpus of signed, recomputable cards. AIUC-1's third-party-testing requirements are the kind of thing our axes are built to evidence; a cross-walk review in both directions (AIUC-1 requirement → our axis, our axis → AIUC-1 requirement) is concrete work we can contribute this quarter.
- **What you can contribute:** (1) a written crosswalk review of AIUC-1's testing/evidence requirements against the 22 axes, with the gaps named; (2) frozen, published banks (jailbreak n=71, safety n=36, instrument-honesty) with a deterministic grader — proposed as an observation source auditors can recompute; (3) a voice-modality note: what is and is not detectable from outside a voice product (marks, C2PA, keyed watermarks) by named method.
- **What we will not do:** issue any pass/fail, grade or conformance view — AIUC issues the certification; we supply observations.
- **Links:** https://councilof.ai/api/gspc · https://councilof.ai/crosswalk/ · https://councilof.ai/gspc-verify
