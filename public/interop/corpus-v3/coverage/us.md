# US wave: AI regulatory registry and frozen provisions (track `us`)

Built 2026-11-21. Registry: **200 instruments** (28 are updated rows for existing v2 instrument_ids, 172 are new). Frozen (FULL_TEXT): **127 instruments, 1378 provisions** (this includes 297 rows carried forward unchanged from v2; see §6). Track root, corpus_root over all 1378 provisions (informational only; the merged v3 root is computed at merge): `2cd7770915b5bd239e1dd7cbcdedc9c5b1bf692192657dc5297eaa5604a98069`.

Normaliser: frozen `normaliser_v1.py` v1.0.0, unmodified. `provision_sha256 = provision_hash(text)`. `instrument_root = corpus_root({provision_id: sha})` over each instrument's rows. **1378/1378 hashes recompute** from the JSONL as written, all instrument roots and counts recompute, and there are no duplicate ids.

A registry row is a routing record. It is not a relationship with the named authority, and nothing here is measured or certified as compliant.

## 1. What was searched

- **Legal Data Hunter:** called once at 02:30 UTC (free quota exhausted; reset 02:49 UTC). After reset, one `discover_sources(US)` call showed no New York or Illinois legislation source, so LDH was not used for text. No provision comes from LDH.
- **Official machine endpoints used (network approved this session):**
  - California `downloads.leginfo.legislature.ca.gov`: pubinfo bulk zips for the 2019, 2021, 2023 and 2025 sessions, read with HTTP range requests (no full 1.2 GB download). BILL_TBL, BILL_VERSION_TBL, BILL_HISTORY_TBL and LAW_SECTION_TBL (current codes) were used. All 6,752 chaptered AB/SB bills in the four sessions were scanned in full text for AI terms. 164 had keyword hits; 63 AI instruments were selected by hand (budget acts, code-maintenance bills and false positives such as "neurodegenerative" were removed).
  - Texas `capitol.texas.gov`: bill history pages (governor action, effective date) and enrolled HTML.
  - Colorado `leg.colorado.gov`: bill pages (sent with `Accept: text/html`; a request without it gets HTTP 406) and Final Act PDFs.
  - Washington `wslwebservices.leg.wa.gov` (GetLegislation, GetLegislativeStatusChangesByBillNumber) and `lawfilesext.leg.wa.gov` certified session laws.
  - Utah `le.utah.gov`: enrolled-copy PDFs.
  - NYC `rules.cityofnewyork.us`: DCWP Notice of Adoption PDF.
  - Federal: `ecfr.gov` versioner API (titles 12, 24, 29, 42, 45 as of 2026-11-19); `federalregister.gov` API (EO search; FR document status and effective dates); `govinfo.gov` US Code 2024 edition HTML; `api.congress.gov` (DEMO_KEY, rate-limited after 7 bills); `api.govinfo.gov` search (BILLS, 119th Congress); `nvlpubs.nist.gov`; `whitehouse.gov`; `fda.gov`. FDA returns 404 to python-requests and serves the PDF to curl's default client, so curl was used. The user agent was never changed.
- **Status verification:** official records wherever they could be fetched (pubinfo status and history, TLO history, WA web service, CO bill page, FR API, Congress.gov API, eCFR). Elsewhere, web search with two secondary legal sources where available. Every citation has `checked_at` 2026-11-21.

## 2. Split rules

- **eCFR** (reproduces v2 hashes exactly, checked on §1002.9 and §92.210): one provision per DIV8 section. Text = heading + '\n' + space-joined text nodes of every child element, CITA included. Appendices (DIV9) are separate rows. Reg B Supplement I is split by its HD1/HD2 section headings (`supp1-1002.N`).
- **US Code** (govinfo 2024 edition chapter HTML): one provision per section. Text = head + statute + sourcecredit fields; notes excluded. This differs from the v2 2023-edition extraction, so v2 row `US-15USC1691-ECOA-1974:s1691` is carried forward unchanged and not re-extracted.
- **Executive orders:** the v2 rule (FR raw text; preamble + Sec. N).
- **NIST AI 100-1:** Executive Summary, sections 1–6 and appendices A–D as narrative rows. The 5.x rows stop before each Core table, because the 72 Core subcategories are already rows from v2. **NIST AI 600-1:** section 1, section 2 intro, section 3 intro, Appendix A (A and A.1.1–A.1.8) and Appendix B (references, one row) are added to the 223 v2 rows. Ligatures are expanded in the new rows.
- **FDA guidance:** main-body sections and appendices by PDF outline; cover, preface and table of contents excluded. **AI Action Plan:** by PDF outline (Introduction, pillars, subsections). **National Policy Framework (Mar 2026):** one row, because the multi-column text order defeated heading splits.
- **California:** chaptered bill XML (pubinfo lob). One provision per bill SECTION. Where a SECTION adds or amends 2 or more code sections, there is an amending-clause row plus one row per code section (`SEC-n:<section>`). Text is as enacted, not consolidated with later amendments. A strike/deletion span filter is in place but found none (chaptered XML carries none).
- **Texas:** enrolled HTML, `<s>` removed, one row per SECTION plus caption/enacting clause.
- **Colorado:** Final Act PDF. Strike-through words are removed by matching horizontal line drawings to word boxes (SB25-288: 726 struck words, checked by eye as genuine deletions). One row per SECTION, with C.R.S. sections split out where a SECTION adds several.
- **Washington:** certified session-law HTML, one row per Sec.
- **Utah:** enrolled PDF with line numbers removed and struck words removed. One row per bill Section plus the long title.
- **NYC DCWP rules:** §§ 5-300 to 5-304 from the Notice of Adoption PDF; statement of basis and purpose excluded.

## 3. Coverage by jurisdiction (this wave's rows)

| Subdivision | Instruments | FULL_TEXT | Provisions | Status mix |
|---|---|---|---|---|
| US (federal/national) | 31 | 21 | 631 | IN_FORCE:20, BILL_PENDING:9, PARTIALLY_APPLICABLE:1, ENACTED_NOT_YET_APPLICABLE:1 |
| US-AK | 1 | 0 | 0 | IN_FORCE:1 |
| US-AL | 1 | 0 | 0 | IN_FORCE:1 |
| US-AR | 1 | 0 | 0 | IN_FORCE:1 |
| US-CA | 63 | 63 | 366 | IN_FORCE:30, ENACTED_NOT_YET_APPLICABLE:25, PARTIALLY_APPLICABLE:6, LAPSED:2 |
| US-CO | 11 | 10 | 99 | IN_FORCE:5, PARTIALLY_APPLICABLE:4, BILL_PENDING:1, SUPERSEDED:1 |
| US-CT | 2 | 0 | 0 | IN_FORCE:1, ENACTED_NOT_YET_APPLICABLE:1 |
| US-DC | 1 | 0 | 0 | IN_FORCE:1 |
| US-DE | 1 | 0 | 0 | IN_FORCE:1 |
| US-GA | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US-HI | 2 | 0 | 0 | IN_FORCE:2 |
| US-IA | 3 | 0 | 0 | IN_FORCE:2, ENACTED_NOT_YET_APPLICABLE:1 |
| US-ID | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US-IL | 7 | 0 | 0 | IN_FORCE:5, ENACTED_NOT_YET_APPLICABLE:2 |
| US-KY | 2 | 0 | 0 | IN_FORCE:2 |
| US-LA | 2 | 0 | 0 | IN_FORCE:2 |
| US-MA | 1 | 0 | 0 | IN_FORCE:1 |
| US-MD | 2 | 0 | 0 | IN_FORCE:2 |
| US-ME | 2 | 0 | 0 | IN_FORCE:2 |
| US-MI | 3 | 0 | 0 | IN_FORCE:3 |
| US-MS | 1 | 0 | 0 | IN_FORCE:1 |
| US-ND | 1 | 0 | 0 | IN_FORCE:1 |
| US-NE | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US-NH | 1 | 0 | 0 | IN_FORCE:1 |
| US-NV | 2 | 0 | 0 | IN_FORCE:2 |
| US-NY | 10 | 1 | 5 | IN_FORCE:7, ENACTED_NOT_YET_APPLICABLE:3 |
| US-OR | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| US-PR | 1 | 0 | 0 | IN_FORCE:1 |
| US-RI | 2 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1, IN_FORCE:1 |
| US-SC | 1 | 0 | 0 | IN_FORCE:1 |
| US-TN | 2 | 0 | 0 | IN_FORCE:2 |
| US-TX | 15 | 14 | 96 | IN_FORCE:14, LAPSED:1 |
| US-UT | 10 | 9 | 99 | IN_FORCE:7, ENACTED_NOT_YET_APPLICABLE:2, LAPSED:1 |
| US-VA | 1 | 0 | 0 | IN_FORCE:1 |
| US-VT | 1 | 0 | 0 | IN_FORCE:1 |
| US-WA | 10 | 9 | 82 | IN_FORCE:8, ENACTED_NOT_YET_APPLICABLE:2 |
| US-WI | 1 | 0 | 0 | IN_FORCE:1 |
| US-WY | 1 | 0 | 0 | IN_FORCE:1 |

Note: `US-45CFR170-315b11-2024` keeps its v2 FULL_TEXT freeze (1 provision, v2 root) and is re-emitted only for the status update. Its provision is not in this file.

## 4. Blocked hosts and routes (never bypassed)

| Host | Failure (2026-11-21) | Instruments | Route |
|---|---|---|---|
| www.nysenate.gov | Cloudflare JS challenge, HTTP 403 "Just a moment" | NY RAISE, GBL 47, S9051-B, A10008-C, S8420-A, S8391, GOL 5-302, Fashion Workers Act, LOADinG | Free API key for legislation.nysenate.gov (Open Legislation API answers 401 without a key), then re-run; or manual download into ~/meok-him |
| www.ilga.gov | proxy CONNECT 502 (upstream unreachable) | IL HB 3773, SB 315, AIVIA, HB 1806, HB 4875, SB 3114 (+ v2 BIPA) | Manual download of Public Act texts into ~/meok-him |
| www.cga.ct.gov | TLS chain verify failure (unable to get local issuer certificate) | CT SB 5 / PA 26-15 | Manual download, or retry after the server chain is fixed; verification was not disabled |
| api.oregonlegislature.gov | proxy CONNECT 502 | OR SB 1546 | Retry the official OData API, or manual download |
| content.naic.org | HTTP 403 Cloudflare page (an earlier curl probe returned 200) | NAIC model bulletin, adoption map | Manual download; NAIC asserts copyright on model text, so IDS_ONLY at most |
| www.legisquebec.gouv.qc.ca, servicios.infoleg.gob.ar | HTTP 403 | (Americas re-attempt) QC P-39.1, AR Ley 25.326 | Manual download |
| www.tbs-sct.canada.ca | WAF "Request Rejected" | (Americas re-attempt) TBS Directive on ADM | Manual download |
| www.diputados.gob.mx, www.planalto.gov.br, www.calcivilrights.ca.gov | sandbox: not on allowlist (curl 000; not requested this session) | MX LFPDPPP, BR LGPD, CA CRC ADS regs | request_network_access, then retry; Planalto/diputados failed last time (502/closed) |
| www.ontario.ca/laws | 404 to the probe URL; JS app | ON EDSTA / ESA | Manual download |

The Americas re-attempt freed: **CA SB 53, AB 2013, SB 942, SB 243** (via pubinfo bulk, now FULL_TEXT) and the **NYC DCWP AEDT rules** (new row `US-NYC-DCWP-AEDT-rules-2023`). Still blocked: NY ×2, IL ×4, MX, QC, TBS, AR, BR, ON ×2. The non-US rows were probed only and are not re-emitted.

## 5. Exclusions and what remains (precise)

1. **States not swept or partially swept:** 2026 secondary trackers report about 150 AI laws in 36 states. This wave covers CA (systematically, from bulk data), TX, CO, WA and UT (enrolled texts, curated lists) and NY, IL and CT (registry only, blocked). Elsewhere only the chatbot, health-AI, election-deepfake and NAIC-bulletin rows listed in the registry are covered. **Not enumerated:** AZ, AR (except NAIC), FL, IN, KS, MN, MO, MS (except NAIC), MT, NJ, NM, NC, OH, OK, PA, SC (except NAIC), SD, WV and most of ME, NH, VT, WY, MD, VA and KY. Missing categories there: election deepfakes (Public Citizen counts 31 states, of which about 10 are here), intimate/sexual deepfakes (Ballotpedia: 48 states, about 10 here), digital replica/publicity (e.g. TN ELVIS Act 2024 is missing), government AI-use and inventory laws (e.g. CT PA 23-16, VT, MD, NH, MT), and state privacy-law profiling/ADMT rules. **Coverage of state law is therefore partial and provisional.**
2. **Texas, Colorado, Washington and Utah lists are curated**, not a bulk scan (unlike CA). Known omissions: TX HB 4 and 89th special-session bills (not checked); UT SB 131 (2024; enrolled URL 404), UT HB 218/HB 273/SB 38 (2026); CO DOI Regulation 10-1-1; WA RCW-codified (consolidated) text.
3. **Codified (consolidated) state text:** CA chaptered bills are frozen as enacted. Current consolidated code sections are available in LAW_SECTION_TBL (pubinfo) and should become a second, consolidated layer (e.g. BPC 22757.x as amended by AB 853 and SB 1000).
4. **Federal not done:** FCC TCPA AI-voice declaratory ruling (FCC 24-17) and the AI robocall NPRM; SEC predictive-analytics proposal (withdrawn 2025); Treasury, OCC and Fed model-risk guidance (SR 11-7); Copyright Office AI reports; USPTO inventorship guidance; DoD Directive 3000.09; NSPM-11 (named in a secondary source, not verified); NIST AI 100-4, AI 100-2 E2025, SP 800-218A and AI 800-1; FDA drug/biologic AI draft guidance (Jan 2025); the HIPAA Privacy Rule final rule of 2026-11-19 as its own row (noted on the Part 164 row); EEOC (technical assistance withdrawn, v2 rows stand; statutes Title VII and ADA added); HHS 45 CFR 92 beyond 92.210. Pending federal bills found by govinfo search but not registered: H.R. 10719, S. 4407, S. 4855, H.R. 9619, S. 5117, H.R. 10146, S. 5051 (Congress.gov DEMO_KEY rate-limited). Senator Blackburn's "TRUMP AMERICA AI Act" and the June 2026 Obernolte–Trahan draft are discussion drafts, not introduced bills, and are not registered.
5. **Significant 2026 pending state bills:** only CO AG proposed rules and UT HB 286 (died; LAPSED) are registered. NY, MA, NJ, PA, MI and OH carry-over bills are not enumerated.

## 6. Updated v2 rows and carried-forward provisions

Updated rows (same instrument_id, full row re-emitted): US-12CFR1002-RegB-1977, US-15USC1691-ECOA-1974, US-45CFR170-315b11-2024, US-AIActionPlan-2025, US-CA-AB2013-trainingdata-2024, US-CA-SB243-companionchatbots-2025, US-CA-SB53-TFAIA-2025, US-CA-SB942-AITA-2024, US-CO-HB26-1263-chatbot-2026, US-CO-SB24-205-AIAct-2024, US-CT-SB5-PA26-15-2026, US-FDA-AI-DSF-lifecycle-draft-2025, US-FDA-CDS-guidance-2026, US-FDA-PCCP-AI-DSF-2025, US-GA-SB540-chatbots-2026, US-HR5388-AI-Uniformity-2025, US-IA-SF2417-chatbots-2026, US-ID-SB1297-ConvAISafety-2026, US-IL-AIVIA-2019, US-IL-HB3773-IHRA-AI-2024, US-IL-SB315-AISafety-2026, US-NE-LB525-ConvAISafety-2026, US-NIST-AI600-1-GenAI-2024, US-NIST-AIRMF-1.0-2023, US-NY-GBL47-AIcompanion-2025, US-NY-RAISE-2025, US-OR-SB1546-AIcompanion-2026, US-WA-HB2225-AIcompanion-2026.

Carried forward unchanged from v2 (`provisions_americas.jsonl`, hash identical), so that each instrument_root is computable from this file alone: all 72 `US-NIST-AIRMF-1.0-2023` Core rows, all 223 `US-NIST-AI600-1-GenAI-2024` rows, `US-15USC1691-ECOA-1974:s1691` and `US-12CFR1002-RegB-1977:1002.9`. **At merge, dedupe these by provision_id; the hashes match.** The instrument_root values for these 4 instruments change from v2, because new provisions were added.

## 7. Drift warnings found during this sweep

- `US-45CFR170-315b11-2024`: ONC final rule 91 FR 67916 (2026-10-28, effective **2026-12-28**) removes 170.315(b)(11)(iv)–(vi). The v2 frozen text will drift. Re-freeze after 2026-12-28 (row `US-ONC-Dereg-HTI5-2026`).
- `US-45CFR164-HIPAA-2000`: Privacy Rule amendments are effective **2027-01-19** (91 FR 74848). Re-freeze then.
- `US-12CFR1002-RegB-1977`: CFPB final rule 91 FR 21620 (effective 2026-07-21) is reflected in the eCFR text frozen here.
- `US-24CFR100-500-HUD-DiscEffect-2013`: HUD proposed removal (NPRM 2026-01-14; supplemental 2026-08-10).
- CA AB 2655 and AB 2839 are permanently enjoined (Kohls v. Bonta, Aug 2025; on appeal) and marked PARTIALLY_APPLICABLE. AB 2655, AB 2839, AB 730/AB 972 (Elec. 20010) and AB 686 carry sunset dates of 2027-01-01 or 2031-01-01 in their text.

## 8. Status not fully verified

- US-CT-SB5-PA26-15-2026 (effective dates)
- US-GA-SB540-chatbots-2026 (signing/effective dates)
- US-IA-SF2417-chatbots-2026 (effective date conflict 2026-07-01 vs 2027-07-01)
- US-ID-SB1297-ConvAISafety-2026 (dates)
- US-OR-SB1546-AIcompanion-2026 (signing date Mar 31 vs Apr 1)
- US-NY-S9051B-GBL48-companionminors-2026 (effective 2027-01-01 vs 2027-06-01)
- US-NY-LOADinG-Act-2024 (2024 signing and in-force dates)
- US-NY-GOL5-302-digitalreplica-2024, US-NY-FashionWorkersAct-2024 (single secondary source each)
- US-IL-HB4875-publicity-AI-2024 (approval date)
- US-IL-AIVIA-2019 (in-force date 2020-01-01 inferred)
- US-AL-SB63-priorauth-AI-2026, US-KY-SB4-AIgovernance-2025, US-LA-HB459/HB639, US-MD-SB141, US-ME-LD517, US-MI-HB5141/HB5143, US-TN-HB1513-SB1624, US-TN-SB1700, US-VT-S23, US-WY-HB102, US-RI-S2197 (IN_FORCE inferred from "enacted" in secondary trackers; dates unknown)
- US-CO-AG-4CCR904-6-ADMT-chatbot-rules-2026 (single secondary source; filing date)
- US-CO-SB24-205-AIAct-2024 (whether it operated from 2026-06-30 remains contested; row set SUPERSEDED)
- Colorado in-force dates from the 90-day safety clause (HB26-1263, HB26-1139, HB26-1195, SB25-288, SB22-113, SB21-169): taken from the date printed in the act or the commonly reported date, not checked against the Secretary of State
- Utah signing dates for 2026 bills other than HB 276 and HB 320; 2025 bills cited to the Governor’s bill list only
- NAIC adoption rows: the official map was read through a web-search snippet, not fetched (403)
- US-HR9925-FRONTIER-Act-2026 (preemption content not read from bill text); US-HR7757, US-HR8516, US-HR9125 (content not verified)
- California applies_from dates were extracted from act text by pattern ("operative/take effect ... <date>") and may include dates for single subsections

## 9. Enum usage notes

BILL_PENDING is also used for pending proposed rules (HIPAA Security NPRM, CO AG rules) and draft guidance (v2 convention). LAPSED is used for a statute that sunset (CA SB 1216, CA AB 1215, TX HB 2060) and for a bill that died (UT HB 286). SUPERSEDED is used for CO SB 24-205. GUIDANCE is used for executive orders (v2 convention) and NAIC/state bulletins.

## 10. Licence notes

Federal texts: 17 U.S.C. 105. State statutes: government edicts doctrine (Georgia v. Public.Resource.Org, 2020). Applying it to agency rules (NYC DCWP) and to state insurance bulletins is an inference. FULL_TEXT freezing of state texts is an **owner decision to confirm**. The NAIC model bulletin is NAIC-copyrighted and not frozen.

## 11. Files

`registry_us.jsonl`, `provisions_us.jsonl`, `sources_us.tar.gz` (182 files used for provisions or status, plus `src/MANIFEST_us.csv`, which lists sha256 for all 310 fetched files, including large pubinfo tables left out of the tar; those can be re-fetched from pubinfo by name).
