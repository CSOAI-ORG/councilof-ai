# Paste-Ready Reply Texts — AI Labs & Benchmark Orgs (TUI 3)
## 2026-09-16

**Each block is a full reply email / contact message — paste-ready.**

---

## 21. To: MLCommons / AILuminate team

**Subject:** A provenance grade for AILuminate — and a partner offer for the next release

MLCommons / AILuminate team,

We published a provenance scorecard for AILuminate v1.1 — 7 grades
applied to the same grid we use to grade our own instruments. Your
benchmark scores "STRONG provenance, published methodology, versioned
releases" but "signature availability: NONE."

That's a measurable gap. Offer: we run our measurement infrastructure
against your next release and publish the signed result. The card is
free and verifiable offline.

Methodology paper: https://councilof.ai/about/methodology
Scorecard: https://councilof.ai/interop/benchmarker-trust/scorecards-2026-09-13.json

Happy to walk through the scorecard grid with your working group.

Best,
Nicholas Templeman
CSOAI Ltd

---
Drafted with Claude (Anthropic). Verified at the time of drafting.
---

---

## 22. To: Hugging Face Open LLM Leaderboard team

**Subject:** 311 signed governance cards, open verification, willing to add an "independently signed" column

HF Leaderboard team,

We measure AI systems on 22 governance axes and publish 311 signed
cards. Your leaderboard is the canonical benchmark for open-weights
performance; ours is the independent signing layer.

Offer: we'd be happy to publish a per-model signed card for every
model in the Open LLM Leaderboard under a documented frozen instrument.
The cards are free to publish; the verification CLI is free to use.
HF can choose whether to surface them as "independently signed" alongside
your existing benchmark scores.

Board: https://councilof.ai/api/gspc

Best,
Nicholas

---
Drafted with Claude (Anthropic).
---

---

## 23. To: Stanford HELM team / Percy Liang or successor

**Subject:** A 22-axis coverage map of HELM and CSOAI — signed, auditable

HELM team,

HELM and CSOAI measure overlapping axes. We publish 311 signed cards
across 22 governance axes. HELM publishes comprehensive model
evaluations on its own axis set.

Offer: a public, signed side-by-side comparison — HELM's axes and
CSOAI's axes, with measurement correspondence notes (where they
overlap, where they don't, where one is UNMEASURED).

The artifact would be a csoai.receipts.coverage-map/0.1 doc. We
publish the first cut; HELM edits at will. Joint authorship, signed.

Best,
Nicholas Templeman
CSOAI Ltd

---
Drafted with Claude (Anthropic).
---

---

## 24. To: METR (ARC Evals)

**Subject:** Let's sign our reproductions of METR evaluations under our key

METR team,

Your task-based evaluations are rigorous. The property they lack
for an institutional reader is independent third-party signature. CSOAI
offers to re-run selected METR tasks and publish the result on our
board — signed under our key, with the METR task spec reproduced
verbatim and the model's revision pinned.

The reproduction retains METR's authorship. CSOAI's role is
independent signature. The reader benefits from a single
re-derivable signed artifact.

Board: https://councilof.ai/api/gspc
Reproduction CLI: python3 tools/verify/csoai_verify.py <card-url>

Happy to scope which task families are most useful to sign.

Best,
Nicholas

---
Drafted with Claude (Anthropic).
---

---

## 25. To: Apollo Research team

**Subject:** A signed provenance scorecard for Apollo's evaluations, the same as AILuminate

Apollo team,

We published a scorecard for AILuminate (https://councilof.ai/interop/benchmarker-trust/scorecards-2026-09-13.json
→ AILuminate row). Same grid works for Apollo evaluations.

The scorecard reads: "Signature availability" / "Provenance" /
"Corrections process" — each row scoring how a benchmark's
publication form supports independent verification.

Yours would join the grid. We update the artifact weekly with no
prior coordination; you can add comments or corrections through the
public corrections ledger.

Best,
Nicholas Templeman

---
Drafted with Claude (Anthropic).
---

---

## 26. To: UK AI Safety Institute (AISI)

**Subject:** Pre/post signature — independent third-party attestation of frontier models on our governance axes

AISI evaluation team,

AISI evaluates frontier models before release; CSOAI measures what's
public post-release. The combination is a before/after signature
pair:

  • Pre-release: AISI's signed evaluation card (yours, internal).
  • Post-release: CSOAI's signed measurement card under frozen
    instrument (public).

Offer: signed measurement on the same axes AISI evaluates internally.
Published weekly; signed by our key, not AISI's. Useful for
international counterparts who can read CSOAI's but not AISI's.

We have prior conversations with UK government departments on AI
measurement — happy to be the public side.

Board: https://councilof.ai/api/gspc

Best,
Nicholas

---
Drafted with Claude (Anthropic).
---

---

## 27. To: MATS fellows

**Subject:** Free signed measurement cards for your research-grade AI safety instruments

MATS fellows,

For research-grade AI safety evaluations: CSOAI publishes signed
cards against frozen instruments. MATS instruments that map to one
of our 22 axes are candidates for free signed measurement.

Process:

  1. You share the frozen instrument (SHA, weights, prompt set).
  2. We run it on the model(s) you care about.
  3. We publish the signed card on our board.
  4. You cite it in your paper with the verification URL.

The verification CLI is free, no account needed.

Board: https://councilof.ai/api/gspc

Best,
Nicholas Templeman

---
Drafted with Claude (Anthropic).
---

---

## 28. To: CAIS (Center for AI Safety)

**Subject:** A shared corrections ledger — both orgs publish to the same surface, append-only

CAIS team,

CAIS publishes AI safety research. Errors get corrected. The current
correction mechanism is paper-post or X post — both fragile.

Offer: a shared refutation ledger that both CAIS and CSOAI publish
to. Append-only. Signed. First correction in our own ledger is ours.
Address:

    https://councilof.ai/refutation-ledger

The mechanism is small. The value is durability: corrections from
either org are visible in one place; the path to verification is one
re-derivation, not a search.

Happy to coordinate.

Best,
Nicholas

---
Drafted with Claude (Anthropic).
---

---

## 29. To: Scale AI / SEAL benchmark team

**Subject:** A coverage matrix of SEAL axes vs our 22 governance axes — signed, perennial

SEAL team,

CSOAI publishes 22 governance axes. SEAL evaluates different axes.
We don't claim overlap; what we offer is a coverage matrix showing
where each instrument measures and where each measurement is
UNMEASURED.

The matrix is signed. SEAL can edit at will — the refutation ledger
records every change. Perennial: the matrix is a living document,
not a point-in-time survey.

Board: https://councilof.ai/api/gspc

Best,
Nicholas

---
Drafted with Claude (Anthropic).
---

---

## 30. To: ARC, Apollo, MATS, AISI — joint coordination note

**Subject:** A small publisher's guild for signed AI safety evidence

ARC/Apollo/MATS/AISI —

Suggestion: a small publisher's guild for signed AI safety evidence.
Each member publishes measurement instruments and signed results to
their own surface. The guild agrees on a small canonical envelope
(issuer_did, instrument_sha, measurement_kind) so a single
verification can walk across the parties.

CSOAI's existing envelope (https://councilof.ai/about/methodology) is
the starting spec. We sign; you sign; readers verify per publisher.
No central authority. No certification.

Worth a 30-minute call? Happy to host.

Best,
Nicholas Templeman
CSOAI Ltd (UK Companies House 16939677)

---
Drafted with Claude (Anthropic).
---

---

*Each reply: paste-ready, AI-disclosed, one fetchable artifact. The
recipient can verify everything with a click of the cited URL.*
