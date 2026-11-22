# Americas slice — global AI regulatory registry and frozen provision corpus v2 (track `americas`)

Built 2026-11-20 (UTC). Registry: 90 instruments. Frozen: 34 instruments, 746 provisions. Track root (corpus_root over all 746 Americas provisions; informational only, since the merged v2 root is computed at merge): `942efc5a36a4beee5acc8939eef56798a0bab8f4cefedcde46f8f946cf97bab8`.

A registry row is a routing record. It does not imply any relationship with the named authority, and nothing in this slice is measured or certified as compliant.

## 1. What was searched

- **Legal Data Hunter (LDH):** `discover_sources` was called for US, CA, BR, MX, CL and AR. The free quota (20 calls per 24 h, shared with parallel tracks) then ran out; it resets about 02:49 UTC on 21 Nov 2026. No primary text in this slice came from LDH (`source.method` is `http` throughout).
- **Official sources, fetched over HTTP after network approval:** federalregister.gov API (EO index and revocation notes), ecfr.gov API, govinfo.gov, nvlpubs.nist.gov, whitehouse.gov (OMB memoranda index and PDFs), capitol.texas.gov, leg.colorado.gov, le.utah.gov (section XML), cppa.ca.gov, laws-lois.justice.gc.ca (XML), bcn.cl, gob.pe / cdn.www.gob.pe.
- **Status verification:** current status was checked by web search against official pages where possible, otherwise against two or more secondary legal sources. Every row cites its sources with `checked_at` 2026-11-20.

## 2. Split rules and text extraction

- **Executive orders** (Federal Register raw text): one provision per `Section/Sec. N.`, plus a `preamble` (title and enacting clause). Removed before splitting: `[[Page]]` markers, NUL bytes, `<...>` markup, `[FR Doc.]` trailer and the signature placeholder.
- **eCFR:** one provision per `DIV8` section (heading line + body). 45 CFR 170.315 is frozen for paragraph (b)(11) only; 12 CFR 1002 for §1002.9 only.
- **US Code** (GPO 2023 edition HTML): the section text including its source credit; editorial and statutory notes are excluded. **Public Law 119-12:** one provision per `SEC.`; `<<NOTE>>` and page markers removed.
- **NIST AI 100-1:** the 72 Core subcategories from Tables 1-4, cropped to the right column and to the table rules. The category text is used as the heading. Line-break hyphens are re-joined when the next line starts lowercase. **NIST AI 600-1:** Section 2 risks (12), plus each suggested-action table row (211) as `<ID> <action> GAI Risks: <tags>`. The document text contains 212 distinct action-ID strings, but `GV-1.1-002` occurs only once, inside the explanatory example in the 'Action ID' bullet; the GOVERN 1.1 table holds only GV-1.1-001. So 211 is the complete table count, checked 2026-11-20.
- **OMB memos** (PDF): split at top-level `N. UPPERCASE HEADING` sections, plus a preamble. Footnotes on the same page may be interleaved; the source PDFs carry OCR-like artefacts (e.g. `11.` for `ii.`).
- **Texas HB 149** (enrolled HTML): struck-through `<s>` text removed (4 elements). Bill SECTIONs 1-3 and 5-10 are whole provisions; SECTION 4 is split into codified Sec. 551.001-554.103 plus an intro.
- **Colorado SB 26-189:** the 'Final Act' PDF, because the 'Signed Act' PDF is a scanned image with OCR errors. SECTION 1 is split into C.R.S. 6-1-1701 to -1709; SECTIONs 2-6 are whole. Page headers and footers removed. No strike-through line objects were detected.
- **Utah:** one provision per section, from the latest version XML linked on le.utah.gov (history notes included as published).
- **CCPA regulations:** OAL-approved text PDF, Articles 10-11 (§§7150-7157, 7200-7222) only, because these are all-new text. Amended Articles 1-9 are not frozen, since underline/strikeout format would contaminate the text.
- **PIPEDA** (Justice Laws XML): top-level sections (repealed or amending-section placeholders kept as published) plus Schedule 1 principles 4.1-4.10. Schedules 2-4 and 'Amendments not in force' excluded.
- **Chile Ley 21.719** (BCN page): Artículo primero is split by numeral, and numerals that insert several articles of Ley 19.628 are split per inserted article (e.g. `art1-num7-art8bis`). Artículos segundo and tercero and the transitional articles are kept separate.
- **Peru DS 115-2025-PCM:** two-column El Peruano PDF, cropped by halves. Provisions are the decree, 36 Reglamento articles and 6 DCF, matching the official count on gob.pe.
- **Hashing:** frozen normaliser `normaliser_v1.py` (v1.0.0, unmodified). `provision_sha256 = provision_hash(text)`; `instrument_root = corpus_root({provision_id: sha})` over each instrument's rows. **746/746 hashes recompute** from the stored text (checked again after writing). `document_sha256` is the SHA-256 of the full fetched bytes.

## 3. Coverage by jurisdiction

| Jurisdiction | Instruments | Frozen (FULL_TEXT) | Provisions | Status mix |
|---|---|---|---|---|
| AR | 2 | 0 | 0 | IN_FORCE:1, BILL_PENDING:1 |
| BR | 2 | 0 | 0 | IN_FORCE:1, BILL_PENDING:1 |
| CA | 5 | 1 | 81 | IN_FORCE:3, LAPSED:1, BILL_PENDING:1 |
| CA / CA-MB | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| CA / CA-ON | 3 | 0 | 0 | PARTIALLY_APPLICABLE:1, IN_FORCE:2 |
| CA / CA-QC | 1 | 0 | 0 | IN_FORCE:1 |
| CL | 2 | 1 | 102 | ENACTED_NOT_YET_APPLICABLE:1, BILL_PENDING:1 |
| CO | 6 | 0 | 0 | LAPSED:1, BILL_PENDING:1, IN_FORCE:4 |
| MX | 2 | 0 | 0 | IN_FORCE:1, BILL_PENDING:1 |
| PE | 2 | 1 | 43 | IN_FORCE:1, PARTIALLY_APPLICABLE:1 |
| US | 37 | 25 | 431 | IN_FORCE:28, REPEALED:6, BILL_PENDING:3 |
| US / US-CA | 6 | 1 | 12 | IN_FORCE:4, PARTIALLY_APPLICABLE:2 |
| US / US-CO | 3 | 1 | 15 | PARTIALLY_APPLICABLE:1, IN_FORCE:1, ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-CT | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-GA | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-IA | 1 | 0 | 0 | None:1 |
| US / US-ID | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-IL | 4 | 0 | 0 | IN_FORCE:3, ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-NE | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-NY | 3 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1, IN_FORCE:2 |
| US / US-OR | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US / US-TX | 1 | 1 | 44 | IN_FORCE:1 |
| US / US-UT | 3 | 3 | 18 | IN_FORCE:3 |
| US / US-WA | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |

## 4. Instruments not frozen because of access failures (registry only; text is reusable)

| Instrument(s) | Host | Failure |
|---|---|---|
| CA SB 53, AB 2013, SB 942/AB 853/SB 1000, SB 243 | leginfo.legislature.ca.gov | Cloudflare JS challenge (HTTP 403) to a non-browser client; not bypassed |
| NY RAISE Act, GBL Art. 47 | www.nysenate.gov | Cloudflare JS challenge (403) |
| IL HB 3773, SB 315, AIVIA, BIPA | www.ilga.gov | proxy 502 Bad Gateway (upstream unreachable) |
| MX LFPDPPP 2025 | www.diputados.gob.mx | proxy 502 Bad Gateway |
| QC P-39.1 s.12.1 | www.legisquebec.gouv.qc.ca | HTTP 403 (server-side) |
| TBS Directive on ADM | www.tbs-sct.canada.ca | WAF 'Request Rejected' |
| AR Ley 25.326 | servicios.infoleg.gob.ar | HTTP 403 |
| BR LGPD | www.planalto.gov.br | connection closed / timeout |
| ON EDSTA, ESA AI-disclosure | www.ontario.ca/laws | JavaScript application; no documented text endpoint |
| NYC LL144 rules | rules.cityofnewyork.us | 200 on first probe, then 403 on fetch |

Each of these is recorded as `NOT_FROZEN` with the reason. **Follow-up:** retry through LDH after the quota resets (US/CA-Legislation, BR/Planalto, CA/LegisQuebec, CA/OntarioLaws, MX sources, AR/InfoLEG). Separately, FDA guidance PDFs, the AI Action Plan, CT PA 26-15 and the state chatbot laws were not fetched because of the time budget.

## 5. Exclusions (scope decisions)

- **US state comprehensive privacy laws with profiling opt-outs** (e.g. Colorado Privacy Act, CTDPA, VCDPA, TDPSA and similar): not enumerated. They are adjacent and AI-relevant but numerous; recommended for a follow-up pass.
- **Election-deepfake, sexual-deepfake/CSAM and right-of-publicity/digital-replica statutes** (dozens of states; e.g. TN ELVIS Act, CA AB 2655/2839): not enumerated, except the federal TAKE IT DOWN Act.
- **2026 state output:** secondary sources report about 150 AI laws enacted in 36 states in 2026 (ailawsbystate.com). Only the comprehensive, frontier, ADMT and employment laws and the companion-chatbot cluster (CO, WA, OR, NE, GA, ID, IA; CT SB 5) are registered. **Coverage of 2026 state laws is therefore partial and provisional.**
- **Not searched:** Uruguay, Ecuador, Costa Rica, Panama, Paraguay, Bolivia, Venezuela, Central America and the Caribbean, OAS instruments, and sector rules beyond those listed (SEC, FCC TCPA AI-voice ruling, insurance bulletins, banking model-risk guidance SR 11-7, Treasury FS AI RMF).
- **Standards:** no copyright-restricted standards are in this track, so there are no IDS_ONLY rows.

## 6. Status caveats per instrument (moved out of the JSONL to keep the schema exact)

- `US-NIST-AIRMF-1.0-2023`: Revision in progress (AI Action Plan); expect a superseding version.
- `US-NIST-AI600-1-GenAI-2024`: Published July 2024 (per PDF cover); exact day not cited.
- `US-15USC45-FTCAct-1914`: Frozen from US Code 2023 edition; later amendments (if any) not checked against OLRC current release.
- `US-FTC-AIaccuracy-policy-2026`: status enum has no 'proposed guidance' value; BILL_PENDING used to mean pending/proposed.
- `US-16CFR461-impersonation-2024`: in_force date not verified (FR publication date given as adopted).
- `US-16CFR465-reviews-2024`: in_force date not verified.
- `US-12CFR1002-RegB-1977`: instrument_id year reflects original Reg B (1977) per convention; not separately cited.
- `US-CFPB-Circ-2022-03`: Withdrawal described by CFPB as not necessarily final; enum has no WITHDRAWN value, REPEALED used.
- `US-CFPB-Circ-2023-03`: adopted date from secondary source (bankingnewsai). REPEALED = withdrawn.
- `US-EEOC-TA-ADA-AI-2022`: REPEALED = withdrawn/removed; official_url null (document removed from eeoc.gov).
- `US-EEOC-TA-TitleVII-AI-2023`: REPEALED = withdrawn/removed; official_url null (document removed from eeoc.gov).
- `US-45CFR170-315b11-2024`: Possible pending/forthcoming HTI-5 removal of predictive-DSI source attributes not verified; eCFR text frozen as current.
- `US-PL119-12-TAKEITDOWN-2025`: 2026-05-19 applicability computed from s3 text ('not later than 1 year after the date of enactment').
- `US-FDA-AI-DSF-lifecycle-draft-2025`: BILL_PENDING used for draft guidance.
- `US-HR5388-AI-Uniformity-2025`: 'adopted' holds introduction date for bills. Further actions on H.R. 5388 not checked.
- `US-CO-SB24-205-AIAct-2024`: CONTESTED: secondary sources conflict on whether SB 24-205 became operative on 2026-06-30; SB 26-189 SECTION 5 (primary) defers repeal to 2027-01-01. AG enforcement stayed by stipulated order.
- `US-CO-HB26-1263-chatbot-2026`: Effective date conflicts between secondary sources (2026-08-12 vs 2027-01-01).
- `US-TX-HB149-TRAIGA-2025`: Signing date not verified (adopted null).
- `US-CA-SB942-AITA-2024`: SB 1000 content (incl. any change to coverage thresholds) not verified against official text.
- `US-CA-SB243-companionchatbots-2025`: Code section range and chapter number from secondary sources.
- `US-CA-CRC-ADS-employment-2025`: Effective date not verified (secondary sources give no date in retrieved snippets).
- `US-IL-AIVIA-2019`: Enactment/effective dates not verified this session.
- `US-IL-BIPA-2008`: Dates not verified this session.
- `US-NY-RAISE-2025`: adopted = chapter-amendment signing date; original Chapter 699 signed 2025-12-19.
- `US-CT-SB5-PA26-15-2026`: NOT VERIFIED: effective/applicability dates of PA 26-15 not found; status ENACTED_NOT_YET_APPLICABLE is provisional.
- `US-OR-SB1546-AIcompanion-2026`: Signing date conflicts (Mar 31 vs Apr 1 2026).
- `US-GA-SB540-chatbots-2026`: Signing date conflicts (May 11 vs May 15 2026).
- `US-IA-SF2417-chatbots-2026`: Effective date conflicts (2026-07-01 vs 2027-07-01); status set to null.
- `CA-PIPEDA-2000`: Assent date not cited (null); English and French versions both official.
- `CA-C36-PPCDA-2026`: introduced (first reading) 2026-06-15.
- `CA-QC-P39.1-s12.1-2021`: Law 25 assent date not cited (null); A-2.1 s.65.2 status not separately verified.
- `CA-ON-EDSTA-2024`: CONTESTED whether AI Part provisions are proclaimed; operative AI duties require regulations, none made.
- `CA-MB-PSAICyber-2026`: Single secondary source; official bill number not retrieved.
- `BR-LGPD-2018`: adopted = law date in its official title; in_force date not cited.
- `MX-AI-federal-bills-2026`: Aggregated row for multiple initiatives; the Apr 2026 labour/copyright reform's final enactment not verified.
- `CL-Ley21719-datos-2024`: Pending postponement bill (Boletín 18.623-07) could move applicability to 2027; check before 2026-12-01.
- `CL-PL-IA-16821-19-2024`: introduced 2024-05-07 (mensaje).
- `PE-Ley31814-IA-2023`: Exact publication date not cited (null).
- `PE-DS115-2025-PCM-AIreg-2025`: Sector-deadline dates computed as publication+1 day+N years per DCF text (secondary).
- `CO-PL025-2026C-IA-2026`: introduced 2026-07-21.
- `CO-Ley2502-suplantacionIA-2025`: Single secondary source.
- `AR-Ley25326-datos-2000`: Automated-decision provisions not verified from fetched text.
- `AR-AI-bills-2026`: Aggregated row for several bills.

## 7. Status not fully verified

- US-CO-SB24-205-AIAct-2024 (operative 2026-06-30 vs superseded before effect: sources conflict)
- US-CO-HB26-1263-chatbot-2026 (effective 2026-08-12 vs 2027-01-01)
- US-CT-SB5-PA26-15-2026 (effective dates unknown)
- US-IA-SF2417-chatbots-2026 (status null; effective date conflict)
- US-OR-SB1546 / US-GA-SB540 (signing dates conflict)
- CA-ON-EDSTA-2024 (whether AI provisions are proclaimed)
- CA-MB-PSAICyber-2026 (single secondary source)
- US-45CFR170-315b11-2024 (possible HTI-5 removal)
- US-12CFR1002-RegB-1977 (April 2026 amendment scope)
- US-CA-SB942-AITA-2024 (SB 1000 content)
- CO-Ley2502-suplantacionIA-2025 (single source)
- AR-Ley25326-datos-2000 (automated-decision provision content)
- US-IL-AIVIA-2019 / US-IL-BIPA-2008 (dates)
- US-CA-CRC-ADS-employment-2025 (effective date)
- CA-QC-P39.1-s12.1-2021 (companion A-2.1 s.65.2 not separately verified)
- Text licences marked 'unknown' or 'not verified' (CL, PE, QC, ON, MX, AR, CO)

## 8. Licence notes
US federal: 17 U.S.C. 105. US state statutes and regulations: government edicts doctrine (Georgia v. Public.Resource.Org, 2020); applying it to agency regulations is an inference. Canada federal: Reproduction of Federal Law Order SI/97-5. Chile (BCN) and Peru (gob.pe): official legal texts, reuse terms not verified. These are frozen as FULL_TEXT on the basis that official legislative texts are reusable, which is an **owner decision to confirm**.

## 9. Kind and status conventions
EOs are `REGULATION` (they bind executive agencies). OMB memoranda and the TBS and Ontario directives are `IMPLEMENTING_RULE`. Withdrawn guidance is `REPEALED`, because the enum has no WITHDRAWN value. Proposed or draft guidance and bills are `BILL_PENDING`. `dates.adopted` is the signing, approval or publication date; it is null for bills and wherever no citation supported a date.
