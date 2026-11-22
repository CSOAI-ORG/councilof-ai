# Coverage — APAC gaps and frameworks layer (track `apac_standards`), corpus v3 input

Built 2026-11-21. Normaliser: frozen `normaliser_v1.py` v1.0.0 (file sha256 prefix 1984329de0cf), loaded by path, unmodified. Files: `registry_apac_standards.jsonl` (97 instruments), `provisions_apac_standards.jsonl` (1195 rows: 1042 hashed FULL_TEXT provisions + 153 IDS_ONLY identifier rows).

**Self-check (from the files on disk after JSON round-trip):** every provision hash recomputes with `provision_hash(text)` (0 mismatches); every `instrument_root` recomputes with `corpus_root` over that instrument's FULL_TEXT rows; every `source.document_sha256` equals the SHA-256 of bytes in `sources_apac_standards.tar.gz` (see `sources/SOURCES_MANIFEST.csv`). Convenience root over all hashed rows of this slice: `d8e78fff9d37356b568bf15755ee47d9d613d9a6af3723d3b8fe7dd3bebf2ab0` (canonical v3 root is computed at merge).

**Honesty:** a registry row is a routing record. Nothing here is measured, assessed or "compliant"; no regulator relationship exists or is implied. `IN_FORCE` on guidance, standards, UN/OECD/G7 texts means "published and current", not "binding". Exclusion rule applied: no CSGA / csga-global material or person was listed, credited or contacted.

Registry rows that reuse a v2 `instrument_id` (full updated rows; integrator should replace the v2 row): 26 — CN-anthropomorphic-ai-interaction-measures-2026, HK-pdpo-cap486, ID-pdp-law-2022, IN-dpdp-act-2023, IN-dpdp-rules-2025, IN-it-rules-sgi-amendment-2026, INTL-g7-hiroshima-code-2023, INTL-ieee-7000-series, INTL-iso-iec-22989-2022, INTL-iso-iec-23894-2023, INTL-iso-iec-42001-2023, INTL-iso-iec-42005-2025, INTL-iso-iec-42006-2025, INTL-owasp-agentic-top10-2026, INTL-owasp-llm-top10-2026, MY-pdpa-2010, NZ-privacy-act-2020, OECD-ai-recommendation-2019, SG-pdpa-2012, TH-pdpa-2019, UN-ares-78-265-2024, UN-ares-78-311-2024, UN-ares-79-325-2025, UN-global-digital-compact-2024, VN-ai-law-2025, VN-digital-technology-industry-law-2025.

## Per jurisdiction
| Jur | Instruments | FULL_TEXT | IDS_ONLY | Hashed provisions |
|---|---|---|---|---|
| CN | 1 | 1 | 0 | 32 |
| CoE | 1 | 0 | 0 | 0 |
| HK | 3 | 1 | 0 | 130 |
| ID | 2 | 0 | 1 | 0 |
| IN | 6 | 0 | 1 | 0 |
| INTL | 43 | 6 | 36 | 274 |
| KG | 1 | 0 | 0 | 0 |
| KZ | 1 | 0 | 0 | 0 |
| LK | 1 | 0 | 0 | 0 |
| MY | 3 | 0 | 0 | 0 |
| NZ | 1 | 0 | 0 | 0 |
| OECD | 1 | 1 | 0 | 24 |
| PH | 2 | 0 | 0 | 0 |
| PK | 2 | 0 | 0 | 0 |
| SG | 3 | 0 | 0 | 0 |
| TH | 1 | 0 | 0 | 0 |
| UN | 7 | 7 | 0 | 214 |
| US | 15 | 9 | 0 | 368 |
| UZ | 1 | 0 | 0 | 0 |
| VN | 2 | 0 | 0 | 0 |

## FULL_TEXT instruments
| instrument_id | status | provisions | licence basis | root |
|---|---|---|---|---|
| CN-anthropomorphic-ai-interaction-measures-2026 | IN_FORCE | 32 | Not subject to copyright (PRC Copyright Law art. 5: laws, re | `70a269aa6a2db19b…` |
| HK-pdpo-cap486 | IN_FORCE | 130 | HKSAR Government copyright (dc:rights); DoJ e-Legislation da | `690bc71f9bafce3c…` |
| INTL-g7-hiroshima-code-2023 | IN_FORCE | 12 | Japan MIC site policy: content under the Public Data Terms o | `93a125bad710094f…` |
| INTL-g7-hiroshima-guiding-principles-2023 | IN_FORCE | 12 | Japan MIC site policy: content under the Public Data Terms o | `5896950362e39890…` |
| INTL-g7-hiroshima-principles-all-actors-2023 | IN_FORCE | 4 | Japan MIC site policy: content under the Public Data Terms o | `d1e275445f60feb9…` |
| INTL-mitre-atlas-2026 | IN_FORCE | 221 | Apache-2.0 (atlas-data LICENSE.txt, Copyright 2021-2026 MITR | `90931185ea3a7416…` |
| INTL-owasp-llm-top10-2025 | SUPERSEDED | 11 | CC-BY-SA-4.0 | `617dccb28380bcc4…` |
| INTL-owasp-llm-top10-2026 | IN_FORCE | 14 | CC-BY-SA-4.0 (repository README; share-alike applies) | `a1be4f6a1da81cba…` |
| OECD-ai-recommendation-2019 | IN_FORCE | 24 | OECD Terms & Conditions, Legal Instruments: may be reproduce | `1e5d91ff96203521…` |
| UN-ares-78-265-2024 | IN_FORCE | 14 | Public domain: UN documents issued with a UN symbol (ST/AI/1 | `cef37e1e7f88130c…` |
| UN-ares-78-311-2024 | IN_FORCE | 16 | Public domain: UN documents issued with a UN symbol (ST/AI/1 | `184d9e2d290aa5b1…` |
| UN-ares-79-239-2024 | IN_FORCE | 10 | Public domain: UN documents issued with a UN symbol (ST/AI/1 | `217e21c5de15295d…` |
| UN-ares-79-325-2025 | IN_FORCE | 13 | Public domain: UN documents issued with a UN symbol (ST/AI/1 | `7bd94d2fd7301753…` |
| UN-ares-80-118-2025 | IN_FORCE | 75 | Public domain: UN documents issued with a UN symbol (ST/AI/1 | `62e0db0328bee2d8…` |
| UN-ares-80-58-2025 | IN_FORCE | 12 | Public domain: UN documents issued with a UN symbol (ST/AI/1 | `99b799dd8142a37a…` |
| UN-global-digital-compact-2024 | IN_FORCE | 74 | Public domain: UN document with UN symbol (ST/AI/189/Add.9/R | `21458073c3aa1a46…` |
| US-NIST-AI100-2E2025-2025 | IN_FORCE | 64 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `32618cdb497f9ebf…` |
| US-NIST-AI100-3-2023 | IN_FORCE | 6 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `d2b88d3d3c4baa60…` |
| US-NIST-AI100-4-2024 | IN_FORCE | 62 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `05258570b472c85f…` |
| US-NIST-AI100-5-2024 | IN_FORCE | 32 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `f90dbc6ed8bb6bb5…` |
| US-NIST-AI200-1-2024 | IN_FORCE | 9 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `6feb660434f78373…` |
| US-NIST-AI700-1-2025 | IN_FORCE | 50 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `b524da3d2d9222de…` |
| US-NIST-AI800-3-2026 | IN_FORCE | 40 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `9252b73d4d6e7658…` |
| US-NIST-AI800-4-2026 | IN_FORCE | 29 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `9a8b67d3615d1cd5…` |
| US-NIST-SP800-218A-2024 | IN_FORCE | 76 | Public domain in the US (17 U.S.C. 105, work of the US Gover | `f9e5e50371b78953…` |

## IDS_ONLY instruments (text and provision_sha256 null)
ID-pdp-law-2022 (76 id rows), IN-rbi-free-ai-2025 (21 id rows), INTL-csa-aicm-2025 (18 id rows), INTL-ieee-7000-2021 (1 id rows), INTL-ieee-7000-series (0 id rows), INTL-ieee-7001-2021 (1 id rows), INTL-ieee-7002-2022 (1 id rows), INTL-ieee-7003-2024 (1 id rows), INTL-ieee-7005-2021 (1 id rows), INTL-ieee-7007-2021 (1 id rows), INTL-ieee-7009-2024 (1 id rows), INTL-ieee-7010-2020 (1 id rows), INTL-ieee-7014-2024 (1 id rows), INTL-iso-iec-12792-2025 (1 id rows), INTL-iso-iec-22989-2022 (0 id rows), INTL-iso-iec-23053-2022 (1 id rows), INTL-iso-iec-23894-2023 (0 id rows), INTL-iso-iec-24029-2-2023 (1 id rows), INTL-iso-iec-25059-2023 (1 id rows), INTL-iso-iec-27090-2026 (1 id rows), INTL-iso-iec-38507-2022 (1 id rows), INTL-iso-iec-42001-2023 (0 id rows), INTL-iso-iec-42005-2025 (0 id rows), INTL-iso-iec-42006-2025 (0 id rows), INTL-iso-iec-5259-1-2024 (1 id rows), INTL-iso-iec-5259-2-2024 (1 id rows), INTL-iso-iec-5259-3-2024 (1 id rows), INTL-iso-iec-5259-4-2024 (1 id rows), INTL-iso-iec-5259-5-2025 (1 id rows), INTL-iso-iec-5338-2023 (1 id rows), INTL-iso-iec-5392-2024 (1 id rows), INTL-iso-iec-8183-2023 (1 id rows), INTL-iso-iec-tr-24027-2021 (1 id rows), INTL-iso-iec-tr-24028-2020 (1 id rows), INTL-iso-iec-tr-24029-1-2021 (1 id rows), INTL-iso-iec-tr-24368-2022 (1 id rows), INTL-iso-iec-tr-5259-6-2026 (1 id rows), INTL-owasp-agentic-top10-2026 (10 id rows).

## What was searched / sources used
- **Legal Data Hunter MCP:** one call (MY PDPA search) returned "used all 20 free searches" (shared quota, resets 02:49 UTC). No LDH documents used; all `source.method` values are HTTP/official.
- **Official machine endpoints used:** nvlpubs.nist.gov (NIST PDFs); data.gov.hk CKAN API + resource.data.one.gov.hk (DoJ e-Legislation open-data bulk XML); raw.githubusercontent.com / api.github.com (OWASP GenAI repo at a pinned commit; MITRE atlas-data at a pinned commit; anonymous API — the owner token was rate-limited); legalinstruments.oecd.org (JSON API `/api/instruments/OECD-LEGAL-0449` + body HTML); documents.un.org (ODS symbol access PDFs); www.soumu.go.jp (Hiroshima AI Process PDFs); www.nmgwx.gov.cn (CAC local-office republication); peraturan.go.id (Indonesian Ministry of Law); isopublicstorageprod.blob.core.windows.net (ISO Open Data deliverables metadata); rbi.org.in (report page TOC); spec.c2pa.org (version check only); cloudsecurityalliance.org (artifact page).
- **Status verification:** official/primary records above, plus ~16 web searches; every row lists its citations with honest `source_type`.
- **No User-Agent spoofing, mirrors, proxies or user machines were used.** Hosts that challenged or refused were recorded, not worked around.

## Split rules (record per publisher)
- **NIST PDFs (PyMuPDF; code in `sources/splitters_apac_standards.py`):** one provision per PDF outline entry, boundaries = outline destination (page, y); number = heading number printed in the document (else slug of heading, or `appendix-X`); running headers/footers (lines repeating on ≥40% of pages) and bare page numbers removed; Acknowledgments, Author Contributions, Trademark, Disclaimer, References/Bibliography excluded; spurious numeric-only outline entries dropped. AI 100-4 and AI 800-4 have no outline: split at bold numbered headings. **SP 800-218A** Table 1 split by column x-position into 20 practice rows (`PO.1` …) and 48 task rows (`PO.1.1` …; task text + priority + R/C/N items + informative references, ordered by column then y). Heading-only parent sections are kept as short rows (e.g. `US-NIST-AI100-2E2025-2025:2`).
- **HK Cap. 486 XML:** one provision per top-level `<section>` and `<schedule>`; num/heading lines then subsection/paragraph lines; `sourceNote`/`editorialNote`/`note` excluded — so repealed/omitted sections (s34, s72, s73) are stored as the bare number line (their repeal notes live in source notes). s33 is in the text but `notYetInOperation`.
- **OWASP:** one provision per Markdown entry file at the pinned commit; text = file content stripped; `references.md` excluded.
- **MITRE ATLAS:** one provision per tactic/technique/mitigation object of `dist/ATLAS.yaml`; text = "ID name", description, then Sub-technique-of / Tactics / Maturity (techniques) or Category / ML lifecycle / Techniques (mitigations). Case studies excluded.
- **OECD/LEGAL/0449:** paragraphs of the official body HTML; groups: `preamble`, `I`, `I.<term>` (one per definition — `I.ai-system` is the OECD AI system definition), `II`–`VIII`, `1.1`–`1.5`, `2.1`–`2.5`. "Section 1/2" captions dropped.
- **UN resolutions:** lines with font ≥ 8.6 pt (footnotes dropped); repeated headers, job numbers, symbols removed; `preamble` = from "The General Assembly," to operative para 1; one row per sequential operative paragraph; closing "Nth plenary meeting / date" removed. GDC = annex I of A/RES/79/1 only (paras 1–74).
- **G7 Hiroshima texts:** intro + one row per sequential numbered item; All-AI-Actors PDF: U+019F→"ti" ligature fix.
- **CN Order No. 21:** per v2 APAC CN rule (new provision at each 第N条, chapter headings dropped; numbers converted; contiguous 1–32).
- **IDS_ONLY:** ID PDP Law `pasal-1`…`pasal-76`; RBI FREE-AI chapter/section TOC; ISO new standards `:document` (heading = official title); IEEE `:document` (source document not fetched, `document_sha256` null); CSA AICM 18 domains; OWASP Agentic ASI01–ASI10.

## Decisions and corrections for the integrator
- **OWASP LLM Top 10:** v2 row `INTL-owasp-llm-top10-2026` is now FULL_TEXT (2026 edition exists: project README "Published, 4 Aug 2026"; official resource page dated 3 Aug 2026). The 2025 edition is added as `INTL-owasp-llm-top10-2025`, `SUPERSEDED`. Note genai.owasp.org/llm-top-10/ still lists 2025 entries.
- **NIST AI RMF 1.0 and AI 600-1:** already FULL_TEXT in v2 (72 and 223 provisions); not re-frozen here, to avoid duplicate provision_ids. Whether v2's 72-row RMF cut covers Part 1 as well as the Core was not checked — check at merge if "in full" means Parts 1+2.
- **NIST AI 800-1:** not final (NIST.AI.800-1.pdf → 404 on 2026-11-21); registered as draft `BILL_PENDING`, NOT_FROZEN. Other drafts likewise (AI 800-2 ipd, AI 300-1 ipd, AI 200-2 ipd, SP 800-239 ipd, IR 8596 iprd); their bytes are in the tar.
- **OECD licence:** terms permit reproduction/excerpts with integrity preserved but say legal instruments **may not be sold** — owner must decide before exposing these rows behind a paid door. UNESCO Recommendation stays IDS_ONLY in v2 (CC BY-NC-SA) — not touched here.
- **ID PDP Law:** deliberately not hashed (OCR text layer of a scan). Re-freeze from a born-digital official text.
- **C2PA:** 2.5 (v2 FULL_TEXT) is still the newest 2.x on spec.c2pa.org (2.6 path 404). No change.
- **ISO rows:** 5 v2 rows updated with official status from ISO Open Data; 19 new ISO/IEC AI deliverables registered (incl. ISO/IEC 27090:2026 and 12792:2025). 25059:2023 and TR 24028:2020 are at stage 90.92 (to be revised). 42001/23894/42005/42006/22989 get no new id rows here (v2 may already hold them).

## Blocked hosts and routes

- **CN-anthropomorphic-ai-interaction-measures-2026**: www.cac.gov.cn -> 403 WAF page to automated clients (2026-11-21). Route used: CAC local-office republication; primary URL kept as official_url.
- **CoE-huderia-methodology-2024**: rm.coe.int -> Cloudflare 403 challenge. Route: human downloads CAI(2024)16rev2 PDF; confirm CoE reuse terms.
- **HK-pdpo-cap486**: www.elegislation.gov.hk serves a JavaScript client-config check page to automated clients; the official open-data bulk (resource.data.one.gov.hk) was used instead.
- **ID-pdp-law-2022**: peraturan.bpk.go.id -> Cloudflare challenge 403; jdih.setkab.go.id -> proxy tunnel 502. Route: born-digital PDF from JDIH BPK fetched by a human, or OCR-corrected text reviewed by a human.
- **IN-dpdp-act-2023**: egazette.gov.in: TLS chain incomplete for the sandbox trust store (missing Let's Encrypt YR1 issuer); an OS-trust-store retry needs user approval and was not run. www.meity.gov.in and indiacode.gov.in are client-rendered apps. Route: approve the OS-trust TLS retry for egazette.gov.in, or human download of the gazette PDFs.
- **IN-dpdp-rules-2025**: egazette.gov.in: TLS chain incomplete for the sandbox trust store (missing Let's Encrypt YR1 issuer); an OS-trust-store retry needs user approval and was not run. www.meity.gov.in and indiacode.gov.in are client-rendered apps. Route: approve the OS-trust TLS retry for egazette.gov.in, or human download of the gazette PDFs.
- **IN-it-rules-sgi-amendment-2026**: egazette.gov.in: TLS chain incomplete for the sandbox trust store (missing Let's Encrypt YR1 issuer); an OS-trust-store retry needs user approval and was not run. www.meity.gov.in and indiacode.gov.in are client-rendered apps. Route: approve the OS-trust TLS retry for egazette.gov.in, or human download of the gazette PDFs.
- **IN-sebi-aiml-guidelines-consultation-2025**: www.sebi.gov.in -> TLS "unable to get local issuer certificate" (Sectigo R46 chain); OS-trust retry needs user approval. Route: approve that retry, or human download.
- **INTL-csa-aicm-2025**: Download gated behind CSA account/form. Route: human downloads AICM v1.1 workbook and confirms licence before control-level IDs are frozen.
- **INTL-g7-hiroshima-code-2023**: www.mofa.go.jp/files/100573473.pdf -> Akamai 403 Access Denied (MIC copy used instead).
- **INTL-g7-hiroshima-guiding-principles-2023**: www.mofa.go.jp/files/100573473.pdf -> Akamai 403 Access Denied (MIC copy used instead).
- **INTL-g7-hiroshima-principles-all-actors-2023**: www.mofa.go.jp/files/100573473.pdf -> Akamai 403 Access Denied (MIC copy used instead).
- **INTL-iso-iec-12792-2025**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-22989-2022**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-23053-2022**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-23894-2023**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-24029-2-2023**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-25059-2023**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-27090-2026**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-38507-2022**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-42001-2023**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-42005-2025**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-42006-2025**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5259-1-2024**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5259-2-2024**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5259-3-2024**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5259-4-2024**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5259-5-2025**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5338-2023**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-5392-2024**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-8183-2023**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-tr-24027-2021**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-tr-24028-2020**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-tr-24029-1-2021**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-tr-24368-2022**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-iso-iec-tr-5259-6-2026**: www.iso.org -> Cloudflare 403 challenge. Route for clause titles: human reads the public ISO OBP preview, or a purchased copy.
- **INTL-owasp-agentic-top10-2026**: genai.owasp.org/download/52117/ -> HTTP 200 HTML "No Access" (gated download). Route: manual download of the PDF by a human after the registration form, then freeze from the bytes.
- **KZ-ai-law-2025**: adilet.zan.kz -> SPA; /api/documents/search returns 401 "Missing credentials. Use Authorization: Bearer <token> or X-API-Key". Route: request an Adilet API key from the RK Ministry of Justice, or human download.
- **MY-pdpa-2010**: lom.agc.gov.my -> proxy "Remote end closed connection" (unreachable from this sandbox). Route: human download of Act 709 reprint PDF from lom.agc.gov.my.
- **MY-pdpa-amendment-act-a1727-2024**: lom.agc.gov.my -> proxy RemoteDisconnected. Route: human download of the Act A1727 PDF.
- **NZ-privacy-act-2020**: www.legislation.govt.nz -> HTTP 202 empty body (CloudFront WAF), re-probed 2026-11-21. Route: NZ PCO legislation API (api.legislation.govt.nz) with an API key, or human download of the XML.
- **PH-dpa-2012**: www.officialgazette.gov.ph and privacy.gov.ph -> Cloudflare 403 challenge. Route: human download of RA 10173 from the Official Gazette.
- **PH-npc-advisory-2024-04-ai**: privacy.gov.ph -> Cloudflare 403 challenge. Route: human download of the signed advisory PDF.
- **SG-mas-airg-2026**: www.mas.gov.sg -> HTTP 200 maintenance/"service unavailable" page with incident ID (bot mitigation). Route: human download of the Guidelines PDF and response-to-feedback paper from mas.gov.sg.
- **SG-mas-feat-principles-2018**: www.mas.gov.sg -> bot "service unavailable" page.
- **SG-pdpa-2012**: sso.agc.gov.sg -> CloudFront 403 (re-probed 2026-11-21). Route: human download from SSO, or SSO bulk/API access arranged with AGC.
- **TH-pdpa-2019**: ratchakitcha.soc.go.th and www.pdpc.or.th -> Cloudflare challenge 403. Route: human download of the Royal Gazette PDF (Vol.136 Part 69 Kor p.52).
- **UZ-ai-amendments-law-zru-1115-2026**: lex.uz -> TLS "unable to get local issuer certificate"; OS-trust retry needs user approval.
- **VN-ai-law-2025**: vanban.chinhphu.vn now reachable (HTTP 200 on 2026-11-21; National Assembly laws listed by docid, PDFs on datafiles.chinhphu.vn - host not yet requested). vbpl.vn and quochoi.vn: TLS trust-store issue; OS-trust retry awaits user approval. Route: request datafiles.chinhphu.vn and page the orggroupid=1 list to the docids of 134/2025/QH15 and 71/2025/QH15.
- **VN-digital-technology-industry-law-2025**: vanban.chinhphu.vn now reachable (HTTP 200 on 2026-11-21; National Assembly laws listed by docid, PDFs on datafiles.chinhphu.vn - host not yet requested). vbpl.vn and quochoi.vn: TLS trust-store issue; OS-trust retry awaits user approval. Route: request datafiles.chinhphu.vn and page the orggroupid=1 list to the docids of 134/2025/QH15 and 71/2025/QH15.
- **TLS step awaiting user approval:** a retry with the OS trust store (`truststore`; verification stays on) for egazette.gov.in, www.sebi.gov.in, lex.uz, quochoi.vn, vbpl.vn was stopped by the platform safety check ("needs the user's approval"). Not attempted any other way.
- **www.rbi.org.in** is not allowlisted; the granted `rbi.org.in` served the same page.

## Status not fully verified (provisional)

- SG-mas-feat-principles-2018 (status null, no citation)
- LK-pdpa-2022 (one encyclopedic source; phase dates unverified)
- PK-national-ai-policy-2025 (approval date 30 vs 31 Jul 2025)
- IN-rbi-model-risk-management-draft-2026 (secondary only; official URL not located)
- KG-digital-code-2025 (secondary only)
- UZ-ai-amendments-law-zru-1115-2026 (secondary only)
- PH-dpa-2012 (secondary only)
- MY-pdpa-amendment-act-a1727-2024 (AGC page read via search snippet; royal assent date one secondary source)
- SG-mas-airg-2026 (secondary only; MAS site blocked)
- HK-hkma-responsible-ai-adoption-2026 (circular ref B1/15C one secondary source)
- INTL-ieee-3119-2025 (one secondary source; official title unverified)
- INTL-g7-hiroshima-* adoption dates (inferred from MIC documents-page listing)
- INTL-owasp-llm-top10-2025 (publication date null)
- KZ-ai-law-2025 amendment by Law 326-VIII (one secondary source)
- IEEE 7000-series approval dates (null except 7000-2021)

## Remaining work (not done in this run — exact list)
1. India: DPDP Act 2023, DPDP Rules 2025, IT Rules SGI amendment 2026 — freeze from egazette.gov.in once the OS-trust TLS retry is approved (or human download).
2. Vietnam: AI Law 134/2025/QH15 and Digital Technology Industry Law 71/2025/QH15 — request datafiles.chinhphu.vn, page vanban.chinhphu.vn `he-thong-van-ban?classid=1&mode=1&orggroupid=1` to the docids, freeze the PDFs (check if born-digital).
3. Singapore PDPA (SSO 403), NZ Privacy Act 2020 (WAF; NZ PCO API key route), Malaysia PDPA 2010 + A1727 (lom.agc.gov.my unreachable), Thailand PDPA (Cloudflare), Philippines DPA + NPC Advisory 2024-04 (Cloudflare) — human download or API keys.
4. Kazakhstan AI Law 230-VIII — Adilet API key; Uzbekistan ZRU-1115 — lex.uz TLS approval; Kyrgyzstan Digital Code — request cbd.minjust.gov.kg.
5. China: CN-ai-ethics-review-measures-2026 and CN-ai-agents-implementation-opinions-2026 (no official republication searched this run); GB 45438-2025 remains NOT_FROZEN.
6. Sector regulators not frozen: MAS AIRG and FEAT (MAS bot page), HKMA circulars (brdr.hkma.gov.hk not requested; licence unknown), OJK banking AI guide (document URL not located), BNM discussion paper, SEBI (TLS), RBI MRM draft. **APRA/ASIC (AU) not searched this run.**
7. Not searched at all (no rows): Bangladesh (beyond a cybersecurity-ordinance mention), Nepal, Bhutan, Maldives, Afghanistan, Mongolia, Brunei, Cambodia, Laos, Myanmar, Timor-Leste, Tajikistan, Turkmenistan, and the Pacific Island states (Fiji, PNG, Samoa, Tonga, Vanuatu, Solomon Is., etc.).
8. Frameworks: OWASP Agentic Top 10 full text (gated PDF); CSA AICM control-level IDs (gated); HUDERIA text (rm.coe.int Cloudflare) and HUDERIA Model (adoption unverified); ISO clause titles (OBP behind Cloudflare); IEEE clause titles and 3119-2025 official record; NIST SP 2400-102e2026 ipd (named in project memory; not located on nvlpubs this run); OECD HAIP reporting framework and OECD AI-system-definition explanatory memorandum not frozen.
