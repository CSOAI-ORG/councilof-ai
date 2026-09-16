# AI Labs & Benchmark Organisations — Ten Design-Partner Candidates
## 2026-09-16

**Lane:** AI labs and benchmark organisations (TUI 3 allocation)
**Prepared by:** Claude (cross-lane execution)
**Rule:** each candidate tied to one measurable artifact. No certification
claims, no pricing in the outreach.

---

## 1. MLCommons (AILuminate v1.1)

**Candidate:** Stanford / MLCommons joint team
**Benchmark:** AILuminate v1.1 — chat-hazard benchmark
**Artifact:** `GET https://councilof.ai/interop/benchmarker-trust/scorecards-2026-09-13.json`
→ the AILuminate row carries provenance, contamination disclosure, and
signature availability ratings.
**Value proposition:** AILuminate is rated "STRONG provenance, published
methodology, versioned releases" — but "signature availability: NONE."
We offer to run our measurement infrastructure against the next AILuminate
release and publish a signed provenance card. The scorecard is the proof.

---

## 2. Hugging Face (Open LLM Leaderboard)

**Candidate:** Hugging Face ML team
**Benchmark:** Open LLM Leaderboard
**Artifact:** `GET https://councilof.ai/api/gspc` → `measured_axes: 22`
**Value proposition:** We measure AI systems against 22 governance axes
drawn from statute, including axes relevant to open-weights licensing
and provenance. Offer: sign each leaderboard result with our Ed25519 key,
produce a verifiable trail for which axes were measured, which were not,
and which yielded UNCHECKABLE.

---

## 3. Stanford CRFM (HELM)

**Candidate:** Stanford Center for Research on Foundation Models
**Benchmark:** HELM — holistic evaluation
**Artifact:** `GET https://councilof.ai/root.json` → `card_count: 311`
**Value proposition:** 311 signed cards in our public corpus. The point
isn't to compete with HELM — it's to add an independent, signed
verification layer that consumers can re-derive themselves. Offer:
publish a side-by-side comparison of HELM and CSOAI's coverage on 22
governance axes, signed and perpetually verifiable.

---

## 4. Scale AI (SEAL benchmark)

**Candidate:** Scale AI research team
**Benchmark:** SEAL (Safety Evaluation and Alignment Lab)
**Artifact:** `GET https://councilof.ai/interop/mcp-trust/latest.json`
→ 500 servers probed weekly, including Scale's infrastructure if applicable
**Value proposition:** Probing what SEAL does not measure is a measurable
property. Offer: publish a coverage matrix of SEAL axes against our 22
governance axes. Where SEAL has a measurement and we don't, we publish
UNMEASURED — openly. Where we both measure, the comparison is signed.

---

## 5. METR (Model Evaluation & Threat Research)

**Candidate:** METR (formerly ARC Evals)
**Benchmark:** Task-based capability evaluations
**Artifact:** `GET https://councilof.ai/api/state` → full state
**Value proposition:** METR's evaluation tasks are reproducible but
currently unverified by an independent party. Offer: sign our reproduction
of METR's evaluations under our Ed25519 key, publish the result on our
board, point to it from our root. The signature makes our result
independently verifiable; METR retains authorship.

---

## 6. Apollo Research (model evaluations)

**Candidate:** Apollo Research team
**Benchmark:** Apollo's safety evaluations
**Artifact:** `GET https://councilof.ai/interop/benchmarker-trust/scorecards-2026-09-13.json`
**Value proposition:** Their evaluations are rigorous; the publication
form lacks signable artifacts. Offer: same provenance scorecard we
already published for AILuminate — Apollo enters our grid, gets a grade,
and the grade is verifiable offline.

---

## 7. METR + Apollo joint coordination

**Candidate:** (cross-org collaboration)
**Benchmark:** Coordinated evaluation methodology
**Artifact:** `GET https://councilof.ai/refutation-ledger`
**Value proposition:** A shared refutation ledger. Both orgs publish
corrections to the same surface, append-only. This makes the AI safety
literature self-correcting by design, with signed provenance.

---

## 8. UK AI Safety Institute (AISI)

**Candidate:** AISI evaluation team
**Benchmark:** AISI's pre-deployment evaluations
**Artifact:** `GET https://councilof.ai/api/gspc`
**Value proposition:** AISI evaluates frontier models before release;
we measure what's public post-release. The signed card from AISI's
evaluation paired with our post-release measurement gives a
**before/after picture** that's independently verifiable.

---

## 9. MATS (ML Alignment Theory Scholars)

**Candidate:** MATS fellows
**Benchmark:** Research-grade AI safety evaluations
**Artifact:** `GET https://councilof.ai/api/gspc` → axis scores
**Value proposition:** Fellows conducting research want verifiable
instruments. Offer: ship signed measurement cards for any MATS-published
instrument that maps to our 22 governance axes. The card carries the
instrument SHA, the model revision, and a recalculation path.

---

## 10. CAIS (Center for AI Safety)

**Candidate:** CAIS program leads
**Benchmark:** CAIS evaluations and AI safety research
**Artifact:** `GET https://councilof.ai/refutation-ledger`
**Value proposition:** A shared corrections surface for the AI safety
community — append-only, signed, first correction was ours. Offer:
CAIS staff submit corrections through the same ledger; we co-publish
the verification path.

---

*Ten candidates. Each tied to one measurable artifact. Each offer
named, bounded, and reversible. No certification claimed.*
