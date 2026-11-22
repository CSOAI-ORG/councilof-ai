# Coverage note: Europe-national track (registry + frozen provisions)

Run date 2026-11-21. Normaliser `normaliser_v1.py` v1.0.0 (file sha256 prefix 1984329de0cf), not modified. Track `europe_national`.

## Totals
- Registry rows: 65 (25 FULL_TEXT, 40 NOT_FROZEN, 0 IDS_ONLY) across 25 jurisdiction codes.
- Frozen provisions: 696 from 25 instruments. Self-check after JSON round-trip: 0/696 hash mismatches, 0/25 instrument_root mismatches, no duplicate provision_ids.
- Full replacement rows for existing v2 ids: CH-fadp-2020 (now FULL_TEXT), EU-gpai-code-of-practice-2025, EU-transparency-code-of-practice-2026 (new citations and blocked route), NO-ki-loven-draft-2025 (status re-verified). All other ids are new.

## Sweep: AI Act national implementation, EU-27 + EEA + CH (verified 2026-11-21)
| State | Finding | Registry row(s) | Freeze |
|---|---|---|---|
| AT | No designation law; KI-Servicestelle at RTR (KOG § 20c, secondary) | AT-kog-ki-servicestelle | no |
| BE | None; BIPT intended; FPS Economy preliminary draft not public | none | none |
| BG | None verified (one tracker reports a draft bill) | none | none |
| HR | None verified (trackers conflict) | none | none |
| CY | CoM decision 22 Jan 2025; draft AI Law 2026 consulted Aug–Sep 2026 | CY-ai-law-draft-2026 | no |
| CZ | Government bill sent to the Chamber (Nov 2026) | CZ-ai-act-adaptation-bill-2026 | no |
| DK | Act 467/2025 in force; L 111 lapsed; L 3 per one secondary source | DK-ai-supplementary-act-2025, DK-ai-loven-bill-2026 | 467 yes |
| EE | None (TTJA named in planning, secondary) | none | none |
| FI | Act 1377/2025, in force 1 Jan 2026 | FI-ai-supervision-act-2025 | yes |
| FR | DDADUE bill (Senate n°118) adopted by Senate 18 Feb 2026, pending at the Assemblée nationale | FR-ddadue-ai-designation-bill-2025 | no |
| DE | KI-MIG (BGBl. 2026 I Nr. 223), in force 29 Jul 2026 | DE-ki-mig-2026, DE-bdsg-2018 | yes |
| GR | Law 5321/2026 (ΦΕΚ Α' 114/20.7.2026) | GR-law-5321-2026 | not attempted |
| HU | Act LXXV/2025 + Decree 344/2025, in force 1 Dec 2025 | HU-ai-act-implementation-act-2025, HU-ai-act-government-decree-2025 | yes |
| IE | Act No. 31 of 2026, commenced 31 Jul 2026 (S.I. 403/2026) except s.78 (a),(e); S.I. 366/2025 | IE-regulation-of-ai-act-2026, IE-ai-designation-regulations-2025 | yes |
| IT | L.132/2025; D.Lgs. 160/2026; D.Lgs. 179/2026 | IT-legge-132-2025, IT-dlgs-160-2026, IT-dlgs-179-2026 | yes |
| LV | AI Centre Law (2025, amended 14 May 2026) | LV-ai-centre-law-2025 | yes |
| LT | XV-105 / XV-106 (14 Jan 2025) | LT-ai-act-amendments-xv-105-2025, LT-ai-act-amendments-xv-106-2025 | blocked |
| LU | Bill 8476 pending | LU-bill-8476-ai-act-2024 | no |
| MT | L.N. 226/2025 (S.L. 591.05) | MT-ai-regulations-2025 | yes (PDF) |
| NL | Uitvoeringswet consultation draft; tabling planned Q2 2027 | NL-ai-act-implementation-bill-2026 | no |
| PL | Dz.U. 2026 poz. 1003, in force 11 Aug 2026 | PL-ai-systems-act-2026 | blocked |
| PT | No designation diploma; ANACOM announced 19 Sep 2025; RCM 2/2026 | PT-national-ai-agenda-2026 | no |
| RO | Government memorandum 12 Mar 2026 (political act); no law | none | none |
| SK | Draft reported; trackers conflict on the authority | none | none |
| SI | ZIUDHPUI (UL RS 85/2025), in force 21 Nov 2025 | SI-ziudhpui-2025 | blocked |
| ES | RD 729/2023 (AESIA statute); RD 817/2023 sandbox (LAPSED by own terms); organic-law bill 121/000096 | ES-aesia-statute-2023, ES-ai-sandbox-rd-817-2023, ES-ai-governance-organic-law-bill-2026 | 2 yes |
| SE | SOU 2025:101; interim decision Fi2026/01365 (until 31 Dec 2026) | SE-sou-2025-101-ai-act-adaptations, SE-ai-act-interim-designation-2026 | no |
| NO | KI-loven still draft; AI Act not in the EEA Agreement | NO-ki-loven-draft-2025 | no |
| IS, LI | No measure: AI Act not yet incorporated into the EEA Agreement | none | none |
| CH | FADP frozen; CETS 225 bill not yet published (consultation spring 2027); BAKOM AI-code toolkit | CH-fadp-2020, CH-cets225-implementation-bill, CH-ai-code-handreichung-2026 | FADP yes |

EU level: Commission AI Act guidelines (prohibited practices, AI system definition, GPAI), training-content template, draft Art. 6 guidelines, both Codes of Practice, the Art. 112 report, ECB CON/2026/10, ESRB/2026/3, Council Decision 2024/2218, EDPB Opinion 28/2024, ESAs JC 2026 25, ESMA AI statement, EIOPA opinion and EBA factsheet. A Cellar SPARQL sweep of acts based on CELEX 32024R1689 found no AI Act implementing or delegated act beyond those already in v2. UK sector: ICO, MHRA x2, DSIT x2, CMA x2, FCA, Ofcom x2.

## Split rules
- DE: gii-norm XML; one provision per `enbez` (§); heading = `titel`; consolidated text (builddate recorded).
- IT: Normattiva AKN export at vigenza 2026-11-21 (needs a session cookie from the act page); top-level `article` only; `authorialNote` removed.
- DK: Retsinformation ELI XML; one per `Paragraf`; Bilag 1 (copy of the AI Act) excluded.
- FI: Finlex AKN original statute (consolidated version differs only in line breaks; no amending acts).
- ES: BOE consolidated API (latest version per bloque) for RD 729/2023; BOE diario XML for RD 817/2023; disposition ids are ASCII slugs.
- IE: eISB XML; top-level `sect` + `schedule`; `fn` removed. S.I. 366/2025 is split from the print HTML by regulation.
- LV: likumi.lv `div.TV213` (articles and transitional points). HU: NJT HTML `div.szakasz`; spent sections (Act § 15; Decree §§ 8-9) not frozen.
- MT: consolidated PDF (pypdf), sequential regulation split; marginal notes interleaved (known limitation).
- CH: Fedlex AKN, consolidation 2025-07-07 (de).
- EU OJ: Cellar XHTML; OJ L split on `art_N`; OJ C split on `oj-ti-grseq-1` headings, recitals and notes excluded.
- EDPB: PDF split at executive summary and sections 1.1–4; footnotes inline.
- GOV.UK: Content API html_publication body split at h2. ICO: one provision per chapter page.

## Status conventions
Drafts, consultation texts and inquiry proposals map to BILL_PENDING. Current non-binding guidance maps to IN_FORCE ("current"). RD 817/2023 is LAPSED under its own 36-month / AI-Act-applicability clause even though BOE does not flag it repealed. The IE Act is PARTIALLY_APPLICABLE because s.78 (a),(e) are not commenced. A web result (contextjs.info) claiming that the EU had rejected the AI Act and that Norway had enacted KI-loven contradicts official sources and was disregarded.

## Status not verified / weak evidence
- SE-ai-act-interim-designation-2026
- DK-ai-loven-bill-2026
- DK-ai-supplementary-act-2025 (EndDate metadata)
- CZ-ai-act-adaptation-bill-2026
- CY-ai-law-draft-2026
- PT-national-ai-agenda-2026
- IT-agid-ai-pa-guidelines-2026
- AT-kog-ki-servicestelle
- EU-eiopa-ai-governance-opinion-2025
- EU-eba-ai-act-banking-factsheet-2025
- LT-ai-act-amendments-xv-105-2025
- LT-ai-act-amendments-xv-106-2025
- SI-ziudhpui-2025
- GR-law-5321-2026

## Blocked hosts and routes
- **PL-ai-systems-act-2026**: api.sejm.gov.pl and eli.gov.pl: requests SSLError CERTIFICATE_VERIFY_FAILED (self-signed certificate in chain) via sandbox proxy, also 502 tunnel error. Suggested route: owner downloads https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU20261003/O/D20261003.pdf into ~/meok-him (or allowlist isap.sejm.gov.pl) and it is frozen from file with sha256
- **SI-ziudhpui-2025**: pisrs.si / www.uradni-list.si: pisrs.si HTTP 407 Proxy Authentication Required; uradni-list.si SSLError CERTIFICATE_VERIFY_FAILED. Suggested route: owner downloads the Uradni list RS 85/2025-3035 PDF/HTML into ~/meok-him
- **LT-ai-act-amendments-xv-106-2025**: e-seimas.lrs.lt: HTTP 403 Cloudflare "Sorry, you have been blocked". Suggested route: owner downloads the official consolidated texts of XV-105/XV-106 into ~/meok-him
- **LT-ai-act-amendments-xv-105-2025**: e-seimas.lrs.lt: HTTP 403 Cloudflare block. Suggested route: owner downloads official texts into ~/meok-him
- **GR-law-5321-2026**: search.et.gr: not attempted (JS-only search application; not allowlisted). Suggested route: owner downloads ΦΕΚ Α' 114/2026 PDF from www.et.gr into ~/meok-him
- **FR-ddadue-ai-designation-bill-2025**: api.piste.gouv.fr (Légifrance API): not reachable without OAuth client credentials (PISTE registration). Suggested route: owner registers a free PISTE application and adds the key in Customize → Credentials
- **EU-aiact-prohibited-practices-guidelines-2025**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-aiact-ai-system-definition-guidelines-2025**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-aiact-gpai-guidelines-2025**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-gpai-training-content-summary-template-2025**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-aiact-high-risk-classification-guidelines-draft-2026**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-gpai-code-of-practice-2025**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-transparency-code-of-practice-2026**: ec.europa.eu (newsroom/dae/redirection/document/<id>): requests SSLError CERTIFICATE_VERIFY_FAILED (unable to get local issuer certificate) after allowlisting. Suggested route: owner downloads the English PDF into ~/meok-him and it is frozen from file with sha256; or retry from a network where ec.europa.eu verifies
- **EU-commission-art112-report-2026**: publications.europa.eu: no XHTML (404). Suggested route: freeze from the Cellar PDF manifestation (Accept: application/pdf) with a PDF splitter
- **EU-esas-frontier-ai-ict-risk-statement-2026**: www.esma.europa.eu: not requested this run. Suggested route: request network access for the ESA host and freeze the PDF with a section splitter
- **EU-esma-ai-retail-investment-statement-2024**: www.esma.europa.eu: not requested this run. Suggested route: request network access for the ESA host and freeze the PDF with a section splitter
- **EU-eiopa-ai-governance-opinion-2025**: www.eiopa.europa.eu: not requested this run. Suggested route: request network access for the ESA host and freeze the PDF with a section splitter
- **EU-eba-ai-act-banking-factsheet-2025**: www.eba.europa.eu: not requested this run. Suggested route: request network access for the ESA host and freeze the PDF with a section splitter
- **FR-cnil-ai-development-recommendations-2025**: www.cnil.fr: not requested this run. Suggested route: request access to www.cnil.fr and freeze each fiche page (verify Licence Ouverte)
- **FR-has-cnil-ai-care-guide-2026**: www.cnil.fr: not requested this run. Suggested route: request access and freeze PDF by section
- **DE-dsk-orientierungshilfe-ki-2024**: www.datenschutzkonferenz-online.de: not requested this run. Suggested route: request access and freeze PDF by numbered section
- **GB-ofcom-illegal-content-codes-2025**: www.ofcom.org.uk: reachable (200). Route: verify Ofcom reuse terms, then freeze the code PDFs by measure
- **GB-ofcom-protection-of-children-codes-2025**: www.ofcom.org.uk: reachable (200). Route: verify Ofcom reuse terms, then freeze the code PDFs by measure
- **GB-cma-ai-foundation-models-update-2024**: assets.publishing.service.gov.uk: not requested this run. Suggested route: request access and freeze the PDF by chapter (OGL v3)
- **GB-cma-ai-foundation-models-initial-report-2023**: assets.publishing.service.gov.uk: not requested this run. Suggested route: request access and freeze the PDF by chapter (OGL v3)
- **GB-fca-ai-approach-2025**: www.fca.org.uk: reachable (200). Route: confirm FCA reuse terms, then freeze page sections
- **AT-kog-ki-servicestelle**: data.bka.gv.at (RIS OGD API): connection refused by sandbox allowlist (not requested). Suggested route: request access to data.bka.gv.at and freeze KOG § 20c and DSG via the RIS API
- Legal Data Hunter: tried once at the start; the free quota was exhausted (reset 02:49 UTC) and it was not used again. It may carry the PL/SI/LT/GR texts, but its licence must be checked first.

## Exclusions
Owner exclusion rule applied. National DP acts other than BDSG and FADP were not frozen: FR Loi 78-17, NL UAVG, AT DSG, ES LOPDGDD, IT Codice privacy, NO personopplysningsloven, IS Act 90/2018, LI DSG.

## Remaining work
1. Official texts for PL (isap WDU20261003), SI (UL RS 85/2025-3035), LT (XV-105/106) and GR (ΦΕΚ Α' 114/2026), plus the Commission guidance PDFs (ec.europa.eu doc ids 112367, 112455, 118343, 118480, 118578, 128559-61, 118120, 118115, 118119, 129555). Route: owner download into ~/meok-him, or a network where TLS verifies.
2. Hosts not requested: cnil.fr, datenschutzkonferenz-online.de, esma/eba/eiopa.europa.eu, enisa.europa.eu, ecb.europa.eu, edps.europa.eu, garanteprivacy.it, aepd.es, autoriteitpersoonsgegevens.nl, data.bka.gv.at, assets.publishing.service.gov.uk, api.lovdata.no, wetten.overheid.nl, Légifrance (PISTE key).
3. Not registered (no verified source): BE, BG, HR, EE, RO and SK instruments; Garante, AEPD and AP AI guidance; ENISA AI frameworks; EDPS genAI orientations; Commission draft serious-incident guidance; draft AI Office fining-procedure implementing regulation.
4. Ofcom codes and the FCA page are reachable but not frozen (reuse terms not verified). The Art. 112 report is available as a Cellar PDF (no XHTML).

## FULL_TEXT instruments and roots
| instrument_id | jur | status | provisions | instrument_root |
|---|---|---|---|---|
| DE-ki-mig-2026 | DE | IN_FORCE | 20 | `7fba549f49823b53…` |
| IT-legge-132-2025 | IT | IN_FORCE | 28 | `b5e23c16cd8d7be0…` |
| IT-dlgs-160-2026 | IT | IN_FORCE | 22 | `1ab322d3b1c55f71…` |
| IT-dlgs-179-2026 | IT | IN_FORCE | 54 | `d154e8b1cef07be9…` |
| DK-ai-supplementary-act-2025 | DK | IN_FORCE | 13 | `2ca51bf4f5c11377…` |
| FI-ai-supervision-act-2025 | FI | IN_FORCE | 29 | `da521d751c2e16f0…` |
| ES-aesia-statute-2023 | ES | IN_FORCE | 61 | `d9242a4e55c62d81…` |
| ES-ai-sandbox-rd-817-2023 | ES | LAPSED | 41 | `b4dd8140a975d1a2…` |
| IE-regulation-of-ai-act-2026 | IE | PARTIALLY_APPLICABLE | 143 | `2ee5326b41e042b9…` |
| IE-ai-designation-regulations-2025 | IE | IN_FORCE | 7 | `897a219656379b73…` |
| LV-ai-centre-law-2025 | LV | IN_FORCE | 12 | `d26c14fad7a5e185…` |
| HU-ai-act-implementation-act-2025 | HU | IN_FORCE | 14 | `e7d2b91e98f4f415…` |
| HU-ai-act-government-decree-2025 | HU | IN_FORCE | 8 | `8d775c34b6867069…` |
| MT-ai-regulations-2025 | MT | IN_FORCE | 11 | `dcc9c005e7707487…` |
| CH-fadp-2020 | CH | IN_FORCE | 77 | `25d5134b29d4ee26…` |
| EU-edpb-opinion-28-2024 | EU | IN_FORCE | 10 | `198391beeff80764…` |
| EU-ecb-opinion-con-2026-10 | EU | IN_FORCE | 5 | `dc34e1f3f1e1c3ec…` |
| EU-esrb-warning-2026-3 | EU | IN_FORCE | 4 | `9b09bdd2436bf227…` |
| EU-coe-ai-convention-signing-2024 | EU | IN_FORCE | 3 | `31be980a02453f0c…` |
| GB-mhra-software-ai-medical-device-guidance | GB | IN_FORCE | 10 | `7d30a6f73a1f3f75…` |
| GB-mhra-samd-change-programme-roadmap | GB | IN_FORCE | 11 | `67b315b71893188e…` |
| GB-dsit-ai-regulatory-principles-guidance-2024 | GB | IN_FORCE | 6 | `27e28074517112dc…` |
| GB-dsit-ai-cyber-security-cop-2025 | GB | IN_FORCE | 7 | `485246764c107d2a…` |
| GB-ico-ai-data-protection-guidance | GB | IN_FORCE | 14 | `08000ee5be14f0b9…` |
| DE-bdsg-2018 | DE | IN_FORCE | 86 | `ce295e4306d102d1…` |
