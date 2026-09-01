# Concept note (one page, draft)

**Call:** DIGITAL-2026-AI-DATA-10-COMPLIANCE  
**Title (working):** Signed, re-verifiable measurement for automated compliance reporting  
**Legal:** CSOAI Ltd (UK 16939677) — independent measurement body. Not a certifier. Not a notified body. Scores are not sold.  
**Method:** DOI [10.5281/zenodo.21991104](https://doi.org/10.5281/zenodo.21991104).

## Problem

Firms and authorities need compliance artefacts a stranger can recompute. Today they get dashboards, HMAC “badges”, and ratings that fill empty cells. There is no continuous, **signed**, **re-verifiable** measurement layer for AI-related reporting (EU AI Act Art. 50 disclosure is the near-term duty). Empty stays empty or the product is dishonest.

## Solution (what exists)

- **GSPC spine** — 22 published slots, **15 measured, 7 UNMEASURED**, Ed25519 cards, `did:web:csoai.org#card-attestation-1` / `#board-attestation-1`. Anyone verifies in-browser (`/gspc-verify`). Live: `GET https://councilof.ai/api/gspc`.
- **Council OS / AG-UI** — human front door (`/os`, named panes: board, verify, cards, embed). Not a framed sitemap of the marketing site.
- **White-label spray** — `/embed` + `/badge` + licence on *their* origin. Partners verify **our** card bytes.

Not in this monorepo and **not bid as a product:** “OpenShell cage”. Isolation, if needed, is named only after a repo exists.

## Consortium (invited — not signed)

Complementary layers, not a merged company:

| Party | Proposed layer | Country | Funded beneficiary? |
|---|---|---|---|
| CSOAI Ltd | Measurement, cards, MCP, OS | UK | **GAP — DEP association of the UK must be confirmed** |
| Tiago Pinto / donttrustverify.pt | Time-anchor (OTS → Bitcoin) | PT | Eligible if a legal entity in PT |
| Emek Can Doğru / Conarium | Optional second receipt (`conarium-v0.1`) | TR | Associated-country check |
| Joel Hillier / Certisyn | VRO **map** (Art 14/50), not a GSPC grade | US | Associated partner typical — **no DEP funds** |
| Fraunhofer SIT | SCITT / RFC 9943 research body | DE | Eligible |

Minimum three **beneficiaries** in three **eligible** countries. PT + DE need a third eligible beneficiary if UK cannot be one.

## Pilot (honest)

One **public** AI surface (chatbot or similar) under Art. 50: disclose, attach **one C2PA path**, emit a **signed GSPC card of our measurement run** (not “we graded the bank”). Financial cells on the public board stay **UNMEASURED**. Firmographics (e.g. Santander/JPMorgan rows) are public names, not a claim we measured that firm’s models.

Call-sector warning: the fiche lists agri / environment / manufacturing / healthcare / energy. A bank chatbot may fail relevance. Prefer a **healthcare or energy** public chatbot if the coordinator wants fit. A separate **FS measurement pilot** (not this call, not a notified-body bid) is `docs/grants/FS-PILOT-CONCEPT.md`.

## What we will not write in the proposal

Certification · notified body / Annex VII · “Art 50 certified” · VRO implementation · XLS-70 as a grade · token / cut · filling empty cells · 10,000 accounts · RFC 8785 as the living card rule (cards are CPython `json.dumps`).
