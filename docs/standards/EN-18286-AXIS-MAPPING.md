# CSOAI GSPC axes ↔ EN 18286:2026 — alignment tracking map

**Document class:** mapping whitepaper (measurement, not certification).
**Status:** alignment tracking. **Not** a conformity statement, **not** a
certification, **not** a presumption-of-conformity claim.
**Date:** 2026-09-10 · **Maintainer:** CSOAI measurement body.

---

## ⚠️ Read this first: no presumption of conformity attaches to EN 18286

**As of 15 August 2026, EN 18286:2026 has NO citation in the Official Journal
of the European Union (OJEU).** Under the EU AI Act, presumption of conformity
with Article 17 flows only from harmonised standards *cited in the OJEU*.
Until such a citation exists, following EN 18286 — fully or partially —
confers **no presumption of conformity whatsoever**.

Therefore this document is, and can only be, an **alignment-tracking map**: a
public record of which GSPC measurement axes observe the same phenomena that
EN 18286 clause areas govern. It makes **no compliance claim** about CSOAI,
about any measured system, or about the standard itself. Any reading of this
document as "EN 18286 compliance" is a misreading. When/if EN 18286 is cited
in the OJEU, this document will be revised and its status header updated —
the revision will be visible in the public corrections ledger.

This document does not assert that CSOAI's measurement of an axis *satisfies*
an EN 18286 clause. It asserts only that the axis *measures a quantity in the
same problem area* — or, where it does not, that the cell is **UNMEASURED**.

---

## 1. The two instruments being mapped

### 1.1 EN 18286:2026

"Artificial intelligence — Quality management system for EU AI Act regulatory
purposes", published ~22 July 2026 by CEN/CLC JTC 21 under Commission
standardisation request **M/613**. It operationalises **Article 17** of the EU
AI Act — the quality management system obligation for providers of high-risk
AI systems. Its clause areas (as used in this map):

| # | EN 18286 clause area | Art 17 anchor |
|---|---|---|
| C1 | Lifecycle governance (QMS scope, responsibility, continuous operation) | Art 17(1) |
| C2 | Risk management system | Art 17(1)(b), linkage to Art 9 |
| C3 | Data management and data governance | Art 17(1)(d) |
| C4 | Technical documentation | Art 17(1)(c), linkage to Art 11 |
| C5 | Record-keeping | Art 17(1)(e) |
| C6 | Post-market monitoring | Art 17(1)(i) |
| C7 | Serious-incident reporting | Art 17(1)(i), linkage to Art 73 |
| C8 | Change management | Art 17(1) (QMS across the lifecycle) |
| C9 | Supply-chain / third-party component governance | Art 17(1), Art 25 linkage |
| C10 | Proportionality for SMEs | Art 17(2) |

*(Clause-area labels are CSOAI working labels for mapping purposes, not the
standard's own numbering. The standard's text is paywalled; exact clause
numbers are **UNMEASURED** here — this map operates at clause-area
granularity only.)*

### 1.2 The GSPC board

The GSPC board carries **22 axes, all measured**, per the source of truth at
`GET https://councilof.ai/api/gspc`:

- **14 behavioural model-comparison axes:** governance, safety, provenance,
  continuity, conformance, openness, machinery-conformity, care,
  cross-reality, detector-interop, art5-safeguard, swarm, affect, jail.
- **8 deterministic-fact financial axes:** provenance-controls,
  reserve-attestation, regulatory-framework, distribution-integrity,
  custody-disclosure, ai-adoption-components, labour-components,
  humanoid-labour-index.

Every board figure is a measurement: derived from frozen instruments and
deterministic grading, Ed25519-signed per card, rolled to a signed Merkle
public root, with a public corrections ledger. **Measurement, not
certification.**

Related estate assets referenced by this map:

- **417-provision EU AI Act measurement corpus** with signed crosswalk
  (`eu-ai-act-compliance-mcp`) — the article-level measurement corpus this
  mapping sits beside.
- **Ed25519-signed cards** — one signed card per measured cell.
- **Signed Merkle public root** — the integrity anchor over published cards.
- **Public corrections ledger** — every revision visible, never silent.

---

## 2. Coverage scale

| Label | Meaning |
|---|---|
| **MEASURED** | A GSPC axis continuously measures a quantity squarely inside this clause area, with a live signed figure. |
| **PARTIAL** | An axis touches the clause area but covers only a slice of it (named in the notes). The unmeasured slice stays visible. |
| **UNMEASURED** | No GSPC axis measures this clause area. The gap is published, not hidden. |

A **MEASURED** cell never means "compliant with the clause". It means "the
board publishes a signed measurement in this problem area". EN 18286 is a
*process* standard (a QMS); the GSPC board is an *outcome/behaviour*
instrument. The two kinds of claim are different, and this map never converts
one into the other.

---

## 3. The mapping: EN 18286 clause areas ↔ GSPC axes

### 3.1 Behavioural axes

| EN 18286 clause area | GSPC axis | Coverage | Notes |
|---|---|---|---|
| C1 Lifecycle governance | `governance` | PARTIAL | The axis measures model governance *behaviour* in comparison runs. It does not measure a provider's QMS document set, responsibilities, or lifecycle procedures — those are process artefacts, UNMEASURED by any board axis. |
| C2 Risk management (Art 9 linkage) | `safety` | PARTIAL | Behavioural safety measurement across frozen banks is evidence in the risk problem area. A documented, living Art 9 risk-management *system* is a process artefact — UNMEASURED. |
| C3 Data management | — | UNMEASURED | No board axis measures a provider's data-governance pipeline (acquisition, curation, quality criteria, bias examination). The board measures model behaviour, not the data supply chain behind it. |
| C4 Technical documentation | `provenance` | PARTIAL | The provenance axis measures whether a system's outputs carry verifiable provenance signals — adjacent to documentation duties. The Art 11 technical file itself is a document, UNMEASURED. |
| C5 Record-keeping | `continuity` | PARTIAL | The continuity axis measures persistence/consistency of behaviour over time — the observable trace that record-keeping exists to explain. The records themselves (logs, QMS records) are not measured. The estate's own signed cards + Merkle root are CSOAI's record-keeping *practice*, not a measurement of anyone else's. |
| C6 Post-market monitoring | `conformance`, `detector-interop` | PARTIAL | Both axes measure deployed-system behaviour against instruments — the same observational act post-market monitoring requires. But EN 18286 governs the provider's *monitoring system* (plan, cadence, review), which is UNMEASURED. |
| C7 Serious-incident reporting | `art5-safeguard` | PARTIAL | The art5-safeguard axis measures conduct against Article 5 prohibited-practice boundaries — the sharpest incident class. Incident *detection-to-report* pipelines (Art 73 timelines, authority notification) are process artefacts — UNMEASURED. |
| C8 Change management | `jail`, `swarm` | PARTIAL | The jail axis measures behaviour drift under adversarial pressure and the swarm axis measures multi-agent interaction effects — both observe how systems behave as conditions change. Version-change *governance* (impact assessment before an update ships) is UNMEASURED. |
| C9 Supply-chain governance | `machinery-conformity`, `openness` | PARTIAL | machinery-conformity measures embedded-AI behaviour in machinery contexts; openness measures disclosure behaviour. Third-party component *governance* (supplier agreements, component due diligence) is UNMEASURED. |
| C10 SME proportionality | — | UNMEASURED | Art 17(2) proportionality is a regulatory design feature, not a measurable system property. No axis applies. The cell stays visible by doctrine. |
| C6 (monitoring observables, cont.) | `care`, `affect`, `cross-reality` | PARTIAL | These axes measure behavioural qualities (care-adjacent conduct, affective signalling, cross-reality consistency) that a post-market monitoring programme would *want to watch*, but they are CSOAI measurements of models, not a provider's monitoring system. Coverage is of the observable, not of the obligation. |

### 3.2 Financial (deterministic-fact) axes

The 8 financial axes measure deterministic public facts about financial
instruments and adoption statistics. Their relationship to EN 18286 clause
areas:

| EN 18286 clause area | GSPC axis | Coverage | Notes |
|---|---|---|---|
| C4 Technical documentation (financial-instrument analogue) | `provenance-controls`, `custody-disclosure`, `distribution-integrity` | PARTIAL | These axes measure published, checkable facts (attestation existence, disclosure existence, distribution evidence) — the *fact* that documentation/disclosure artefacts exist, never their adequacy against Art 11. |
| C5 Record-keeping (attestation analogue) | `reserve-attestation` | PARTIAL | Measures whether reserve attestations exist and are verifiable — a record-keeping *observable*. The issuer's QMS records: UNMEASURED. |
| C1 Governance (regulatory-perimeter analogue) | `regulatory-framework` | PARTIAL | Measures the deterministic fact of which regulatory framework an instrument sits under. Framework adequacy is a legal judgement — never measured, never implied. |
| C3 Data management (adoption-statistics analogue) | `ai-adoption-components`, `labour-components`, `humanoid-labour-index` | PARTIAL | These axes measure public statistics (Eurostat, World Bank, manufacturer-published figures). They are inputs to context, not measurements of any provider's data management. |
| C2, C6, C7, C8, C9, C10 | — | UNMEASURED | No financial axis measures any provider's risk system, monitoring, incident reporting, change management, supply chain, or SME proportionality. |

---

## 4. Honest summary of the map

1. **No clause area of EN 18286 is fully covered by the GSPC board.** Every
   cell is PARTIAL or UNMEASURED. This is expected and correct: EN 18286
   governs provider *processes*; the GSPC board measures system *behaviour and
   public facts*. The instruments answer different questions.
2. **The strongest adjacency** is C6 (post-market monitoring): continuous,
   signed, public behavioural measurement is the same *kind* of evidence a
   monitoring programme produces — but it is not a substitute for the
   provider's own monitoring system, and this map never claims it is.
3. **The fully unmeasured clause areas** — C3 (data management) and C10 (SME
   proportionality) — are published as gaps. Gaps stay visible.
4. **The 417-provision EU AI Act corpus** (`eu-ai-act-compliance-mcp`) covers
   the *article-level* measurement surface (including Art 17 itself as a
   provision to be measured against) with a signed crosswalk. This document
   maps the *standard-level* surface. The two are complementary; neither is a
   conformity instrument.

## 5. What this document is not

- Not a claim that CSOAI, or any system on the board, conforms to EN 18286.
- Not a claim that EN 18286 confers presumption of conformity — **it does
  not, absent OJEU citation.**
- Not legal advice. Not a gap-analysis service. Not a certification scheme.
- Not a substitute for reading the standard (CEN/CLC JTC 21, published ~22
  Jul 2026, under M/613).

## 6. Tracking and corrections

- This map is a living alignment record. Revisions (OJEU citation events,
  clause-area relabels once the standard's text is publicly analysed, new or
  retired axes) are recorded in the **public corrections ledger**, never
  edited silently.
- Source of truth for axis state: `GET https://councilof.ai/api/gspc`. If
  this document and the API ever disagree, **the API is right.**
- Cards referenced by any cell are Ed25519-signed and verifiable against the
  signed Merkle public root. Check us, don't trust us.

*Measurement, not certification. Alignment tracking, not compliance.*
