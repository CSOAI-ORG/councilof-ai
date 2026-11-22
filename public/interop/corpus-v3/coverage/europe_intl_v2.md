# Coverage note: Europe-Intl track (registry + frozen provisions)

Run date 2026-11-20. Normaliser `normaliser_v1.py` v1.0.0 (artifact 4be06c60, file sha256 prefix 1984329de0cf), not modified.

## Totals
- Registry rows: 90 instruments across 17 jurisdiction codes.
- FULL_TEXT instruments: 31; frozen provisions: 2388. IDS_ONLY instruments: 10 (19 identifier rows with text=null). NOT_FROZEN: 49.
- Self-check: all 2388 hashes recomputed from the stored text after a JSON round-trip (0 mismatches); every instrument_root recomputed with corpus_root().
- None of these instruments overlaps the 417-provision v1 corpus (EU AI Act, EU GDPR, CRA, DORA, NIS2, CSRD). UK GDPR is a separate instrument (GB-uk-gdpr-2016).

## Sources and method
- **EU acts**: Cellar content negotiation `http://publications.europa.eu/resource/celex/<CELEX>` with `Accept: application/xhtml+xml`, `Accept-Language: eng` → OJ XHTML manifestation (URL recorded per row; document_sha256 = sha256 of the bytes received). Status and dates come from Cellar SPARQL (`cdm:resource_legal_in-force`, `resource_legal_date_entry-into-force`, `work_date_document`), plus each act's own final article. The texts are **original OJ texts, not consolidated versions**. For MDR and IVDR, later transitional amendments are therefore not reflected.
- **CETS 225**: the Treaty Office page (coe.int) returned a Cloudflare challenge (403). The treaty text was taken from its OJ publication (CELEX 22026A01081). Cellar's in-force flag is 0. Status rests on that flag plus 3 secondary sources (EU only Party, deposited 15 May 2026; 21 signatories; not in force). Note that 2 secondary sites wrongly claim it has been in force since Nov 2025.
- **UK**: legislation.gov.uk CLML `data.xml` (revised versions; the dct:valid date is recorded in freeze_reason). Commencement comes from the Act's own commentary annotations (e.g. DUAA s.80 in force 5.2.2026 by S.I. 2026/82). Crime and Policing Act 2026 is a **partial freeze** of its AI sections only (ss.72-74, 99, 248, 249).
- **C2PA 2.5** (Oct 2026, CC BY 4.0), fetched from spec.c2pa.org.
- **Status of non-EU / international instruments**: verified by web search against official pages where reachable and otherwise ≥2 secondary sources. These are cited in status_citations, with source_type marked honestly (most national rows are `secondary`).
- **Legal Data Hunter was not used.** Its free-plan quota (20 searches/day) was exhausted at the start of the run (resets ~02:49 UTC 21 Nov), so no `ldh:get_document` rows exist.

## Split rules (record for the merger)
- EU OJ XHTML: one provision per top-level `div id="art_N"` (Article) and `div id="anx_*"` (Annex). For articles, the `oj-ti-art` label line ("Article N") is dropped and the heading (`oj-sti-art`) is kept as the first line, then the body. This matches the v1 convention "heading + body". Annex text keeps its "ANNEX X" line and title. The "ANNEXES" table of contents in MDR is skipped. Amending acts (eIDAS 2, Digital Omnibus) are split only at their own top-level articles; the quoted inserted text stays inside Art 1. Text = block elements joined by "\n".
- OJ C guidance (Art 50 guidelines): split at top-level numbered sections 1-9 (`oj-ti-grseq-1` headings matching `^\d+\.`). Footnotes (`oj-note`) and the ELI/ISSN trailer are removed.
- UK CLML: one provision per top-level `P1 id="section-N"` (`article-N` for UK GDPR), plus one per `Schedule`. P1groups inside BlockAmendment (quoted text) are skipped. Heading = P1group Title, kept as the first line. The section number is dropped. P2+ numbers are rendered with default brackets, e.g. "(1)", "(a)". Commentaries/annotations are excluded. Repealed text is kept as fetched (dots).
- C2PA HTML: one provision per `div.sect1` (sections 1-17, Appendices A-H). Heading line kept.
- provision_id: `<instrument_id>:<n>` where n = article number (EU), `annex-I`/`annex`, `section-N`, `sN`/`schN` (UK), `22A` (UK GDPR), `section-N`/`appendix-X` (C2PA), `ASI01` / `document` for IDS_ONLY.

## Excluded or not frozen, and why
- **GPAI Code of Practice** and **Transparency (marking/labelling) Code of Practice**: registered, NOT_FROZEN. They are PDFs on digital-strategy.ec.europa.eu, which is not allowlisted, and their reuse licence was not verified.
- **OECD AI Recommendation**: IDS_ONLY. The OECD licence was not verified and the site is not allowlisted. **UNESCO Recommendation**: IDS_ONLY because its licence is **CC BY-NC-SA 3.0 IGO**. NonCommercial conflicts with paid endpoints, so this is an owner decision.
- **ISO/IEC, IEEE, EN 18286**: IDS_ONLY (copyright). The IEEE 7000-series row has no verified numbers, titles or status (status null, no citation).
- **OWASP LLM Top 10 2026 / Agentic Top 10 2026**: CC BY-SA 4.0 permits full text, but genai.owasp.org was not fetched. The Agentic list is IDS_ONLY (ASI01-ASI09 headings from secondary listings; ASI10 heading null).
- **UN resolutions, G7 Hiroshima Code, AU strategy, national laws (CH, NO, TR, IL, AE, SA, ZA, NG, KE, RW, EG)**: registry only. The official portals are not allowlisted and their licences were not verified.
- **CEN-CENELEC JTC 21**: only EN 18286:2026 is cited in the OJ (Implementing Decision 2026/2274). Other prENs (e.g. prEN 18282 cybersecurity) were not verified and are not registered.
- **Not registered (out of time / no verified source this run)**: Commission AI Act guidelines on prohibited practices, AI-system definition and GPAI obligations; the GPAI training-data summary template; the ICO "AI and data protection" guidance; Ofcom OSA codes; the UK DUAA copyright/AI report (18 Mar 2026); the Turkish AI Action Plan 2026-2030; the UAE CBUAE AI guidance note; DIFC/ADGM beyond Regulation 10; Saudi deepfake and generative-AI guidelines; Nigeria's other AI bills (HB 2567, SB 731); the Kenyan sector guidelines.

## Status mapping conventions
- Draft guidance and planned or draft bills not yet formally tabled → `BILL_PENDING` (the schema has no DRAFT value), stated in freeze_reason.
- A signed treaty that is not yet in force → `ENACTED_NOT_YET_APPLICABLE`.
- Policies, strategies and UN/UNESCO/OECD instruments that are adopted and current → `IN_FORCE`. This means "current", not "binding".
- Instruments whose status could not be verified → `status: null`: GB-regulating-for-growth-bill-2026, IL-ppa-ai-guidance-draft-2025, EG-ai-law-draft, INTL-iso-iec-23894-2023, INTL-iso-iec-22989-2022, INTL-ieee-7000-series.

## Status not verified / weak evidence
- GB-regulating-for-growth-bill-2026
- IL-ppa-ai-guidance-draft-2025
- EG-ai-law-draft
- INTL-iso-iec-23894-2023
- INTL-iso-iec-22989-2022
- INTL-ieee-7000-series
- EU-mdr-ivdr-simplification-2025: pending status inferred only from Cellar (proposal plus EESC opinion; no adopted act found). A broad SPARQL check timed out.
- AE-pdpl-45-2021: sources conflict on whether the Executive Regulations were issued (majority: not issued).
- GB-dsit-ai-regulation-principles-2023: dates null; secondary evidence only.
- National rows NG/KE/RW/EG/TR/SA/IL/CH/NO: secondary sources only (official portals not reachable).
- CCD2 (EU-ccd2-2023): the Member State application date is today (2026-11-20); national transposition was not checked.

## FULL_TEXT instruments and roots
| instrument_id | status | provisions | instrument_root |
|---|---|---|---|
| EU-dsa-2022 | IN_FORCE | 93 | `a82f1708b8183276…` |
| EU-data-act-2023 | PARTIALLY_APPLICABLE | 50 | `b1df041ac0574486…` |
| EU-pld-2024 | ENACTED_NOT_YET_APPLICABLE | 25 | `3818978fcec7af35…` |
| EU-mdr-2017 | IN_FORCE | 140 | `136c23f70d583b38…` |
| EU-ivdr-2017 | IN_FORCE | 128 | `23c54ef58fe05863…` |
| EU-mica-2023 | IN_FORCE | 155 | `0743f33345519671…` |
| EU-eidas2-2024 | IN_FORCE | 9 | `e83fc65df43f3096…` |
| EU-platform-work-2024 | ENACTED_NOT_YET_APPLICABLE | 32 | `9309d429ab5d0438…` |
| EU-machinery-2023 | PARTIALLY_APPLICABLE | 66 | `6e31ed542bbd1117…` |
| EU-gpsr-2023 | IN_FORCE | 53 | `772558c0f199e4b3…` |
| EU-digital-omnibus-ai-2026 | IN_FORCE | 4 | `6f7b8f1404671157…` |
| EU-ccd2-2023 | IN_FORCE | 54 | `ed2df04af7ad61ad…` |
| EU-political-ads-2024 | IN_FORCE | 30 | `55c472ba98abcb34…` |
| EU-dma-2022 | IN_FORCE | 55 | `f2d7998bab8051b2…` |
| EU-ehds-2025 | ENACTED_NOT_YET_APPLICABLE | 109 | `45eef271a062c1c3…` |
| EU-led-2016 | IN_FORCE | 65 | `475251642daa6e5e…` |
| EU-eudpr-2018 | IN_FORCE | 101 | `e73c15ae8fc83b43…` |
| EU-aiact-scientific-panel-2025 | IN_FORCE | 20 | `cb7561c5299ec46e…` |
| EU-aiact-proceedings-2026 | IN_FORCE | 16 | `3384a1db23e010c5…` |
| EU-aiact-harmonised-standards-2026 | IN_FORCE | 3 | `4561643fbc470fd1…` |
| EU-aiact-sandboxes-2026 | ENACTED_NOT_YET_APPLICABLE | 10 | `b6c99b9d200cc3a5…` |
| EU-coe-ai-conclusion-2026 | IN_FORCE | 5 | `8b87f7ea27954e35…` |
| EU-aiact-art50-guidelines-2026 | IN_FORCE | 9 | `840cb8b09d7e91d2…` |
| CoE-cets225-ai-convention-2024 | ENACTED_NOT_YET_APPLICABLE | 36 | `904d40fc0c7da3b5…` |
| GB-duaa-2025 | PARTIALLY_APPLICABLE | 160 | `92e04a6be680486b…` |
| GB-uk-gdpr-2016 | IN_FORCE | 119 | `76791e343adae56b…` |
| GB-dpa-2018 | IN_FORCE | 283 | `7761e5d46055a980…` |
| GB-osa-2023 | PARTIALLY_APPLICABLE | 264 | `5c0717dd2a9ea122…` |
| GB-equality-act-2010 | IN_FORCE | 263 | `485bc1c6130dbd04…` |
| GB-crime-policing-2026 | PARTIALLY_APPLICABLE | 6 | `e661e6ebb2ca8ec4…` |
| INTL-c2pa-spec-2026 | IN_FORCE | 25 | `9e2ac5ba99b20dae…` |

Nothing in these files is labelled measured or compliant. Registry rows are routing records, not regulator relationships.
