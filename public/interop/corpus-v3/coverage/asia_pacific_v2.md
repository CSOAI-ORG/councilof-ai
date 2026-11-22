# Coverage — Asia-Pacific slice (track `asia_pacific`), corpus v2 input

Built 2026-11-20. Normaliser: frozen `normaliser_v1.py` v1.0.0 (unmodified, loaded by path). Merge-ready files: `registry_asia_pacific.jsonl` (57 instruments), `provisions_asia_pacific.jsonl` (1259 provisions from 17 FULL_TEXT instruments).

**Self-check:** 1259/1259 provision hashes recompute from the stored text read back from disk; all 17 `instrument_root` values recompute (`corpus_root` over each instrument's provision anchors); every `document_sha256` equals the SHA-256 of the raw bytes fetched. Root of the whole APAC slice (all 1259 anchors) is `290905416ee8edf9b3a24c9e7812a0385e63e08eda94fa0373d20a3c102d8882`. This is a convenience value; the canonical v2 root is computed at merge.

**Honesty:** a registry row is a routing record. Nothing here is measured, assessed or "compliant". No regulator relationship exists or is implied.

## Per jurisdiction
| Jur | Instruments | FULL_TEXT | Provisions |
|---|---|---|---|
| AU | 6 | 2 | 374 |
| CN | 13 | 8 | 372 |
| HK | 4 | 0 | 0 |
| ID | 2 | 0 | 0 |
| IN | 4 | 0 | 0 |
| JP | 5 | 2 | 215 |
| KR | 3 | 3 | 212 |
| MY | 2 | 0 | 0 |
| NZ | 5 | 0 | 0 |
| PH | 1 | 0 | 0 |
| SG | 6 | 0 | 0 |
| TH | 2 | 0 | 0 |
| TW | 2 | 2 | 86 |
| VN | 2 | 0 | 0 |

## Frozen instruments
| instrument_id | status | provisions | language | root |
|---|---|---|---|---|
| CN-pipl-2021 | IN_FORCE | 74 | zh-Hans | `4e30bfa6c716e848…` |
| CN-cybersecurity-law-2016 | IN_FORCE | 81 | zh-Hans | `4f6b35becfc74bf2…` |
| CN-data-security-law-2021 | IN_FORCE | 55 | zh-Hans | `86598a5c6b97b624…` |
| CN-network-data-security-regs-2024 | IN_FORCE | 64 | zh-Hans | `d26c3a73f031144e…` |
| CN-genai-interim-measures-2023 | IN_FORCE | 24 | zh-Hans | `4934f3ed73649023…` |
| CN-deep-synthesis-provisions-2022 | IN_FORCE | 25 | zh-Hans | `82a1aa32c63ef229…` |
| CN-algorithm-recommendation-provisions-2021 | IN_FORCE | 35 | zh-Hans | `85ff4db1ac540a19…` |
| CN-ai-content-labelling-measures-2025 | IN_FORCE | 14 | zh-Hans | `f6e8a740cb3070f6…` |
| JP-ai-promotion-act-2025 | IN_FORCE | 29 | ja | `37aeebdf5d7d5517…` |
| JP-appi-2003 | IN_FORCE | 186 | ja | `0b755230125295e9…` |
| KR-ai-basic-act-2025 | IN_FORCE | 46 | ko | `d7781dd7c3e59ab0…` |
| KR-ai-basic-act-enforcement-decree-2026 | IN_FORCE | 39 | ko | `2ac4e8d72efa327b…` |
| KR-pipa-2011 | IN_FORCE | 127 | ko | `c7ec6cd22a6613d5…` |
| TW-ai-basic-act-2026 | IN_FORCE | 20 | zh-Hant | `9ed4e9fac2b1c102…` |
| TW-pdpa-1995 | PARTIALLY_APPLICABLE | 66 | zh-Hant | `4b40c088f353570a…` |
| AU-privacy-act-1988 | IN_FORCE | 353 | en | `650c70a42a1f152e…` |
| AU-privacy-legislation-amendment-act-2024 | PARTIALLY_APPLICABLE | 21 | en | `17667b64af90a69f…` |

All frozen texts are the **official original-language text** from the official publisher (`translation_status = OFFICIAL`). No translation, official or unofficial, was frozen. Official/reference English translations exist for JP (japaneselawtranslation.go.jp, not authoritative), KR (KLRI, unofficial) and TW (MOJ English, for reference); none were used.

## What was searched
- **Legal Data Hunter MCP:** `discover_sources` succeeded for CN, KR, JP, SG, IN and AU. The free-plan quota (20 calls/24 h, shared with the other regional agents) ran out on the 7th call (NZ), so **no LDH `get_document` call was made**. All texts came by HTTP from official publishers (`source.method = "http"`, `ldh_source = null`).
- **Official hosts granted and used:** laws.e-gov.go.jp (e-Gov Law API v2), flk.npc.gov.cn plus its file store flkoss.obs-bj2.cucloud.cn (signed DOCX downloads issued by the FLK API), www.gov.cn (State Council policy library, which officially republishes CAC orders), www.law.go.kr (`lsInfoR.do` body fragment), law.moj.gov.tw, api.prod.legislation.gov.au.
- **Hosts granted but unusable (no workaround attempted; no mirrors; default User-Agent only):** www.cac.gov.cn (jiasule WAF 403 to python-requests; one attempt with curl's own default UA also got 403, then stopped); sso.agc.gov.sg (CloudFront 403); www.legislation.govt.nz (HTTP 202, empty body, WAF challenge); vanban.chinhphu.vn (proxy 502 Bad Gateway, two tries); www.meity.gov.in and indiacode.gov.in (client-rendered apps, no text endpoint identified; www.indiacode.nic.in now redirects to indiacode.gov.in).
- **Status verification:** web search across ~14 queries, plus the primary records above. Each registry row cites its sources (`official` = the government publisher, `primary` = the instrument text itself, `secondary` = law firms, trackers, LoC GLM, news).

## Split rules (record per publisher)
- **JP e-Gov XML:** one provision per `<Article>` in `<MainProvision>`. Text = `ArticleTitle + ArticleCaption` heading line, then each Paragraph/Item/Subitem as a line (`ParagraphNum`/`ItemTitle` + sentence text; XML whitespace stripped per text node). `Num="16_2"` maps to `16-2`. The original-enactment `<SupplProvision>` (no `AmendLawNum`) is one provision `:suppl`. Amending-act supplementary provisions are excluded.
- **CN (FLK DOCX and gov.cn HTML):** a new provision starts at each paragraph matching `^第[一二…十百]+条( |　)`. Body lines run until the next article or a 章/节/编 heading. Chapter and section headings are not stored. Number = Arabic numeral of the Chinese ordinal. Article sequence was checked contiguous 1..n for every instrument. The gov.cn pages for the deep-synthesis and algorithm orders carry the order text twice. The first copy's last article had the repeated order header appended, so the second, clean copy was kept.
- **KR law.go.kr:** one provision per anchor `J<n>:<m>` (`m>0` maps to `n-m`, e.g. 37-2). Text = all `<p>` lines of the `lawcon` block, inline tags stripped without inserting spaces. 부칙 (supplementary provisions) excluded.
- **TW MOJ:** one provision per `div.row` (`col-no` + `col-data` lines). Deleted articles are kept as published, e.g. `TW-pdpa-1995:27` = "（刪除）".
- **AU FRL Word:** the compilation is split at style `ActHead5`. Numbering is `s<n>` in the body and `sch<k>-cl<n>` in Schedules; TOC and endnotes are excluded. The POLA Act as made is split by section (`s1`–`s4`), by Schedule 1 Part (`sch1-pt1`…`pt15`; ActHead5 lines inside Schedules belong to the Part text), and as whole Schedules 2 and 3. Assent and second-reading end-matter were removed.
- Heading data: `heading` = article caption where one exists (JP, KR, AU). CN and TW articles have no captions, so `heading = null`.

## Conventions
- `dates.adopted` = promulgation/signing date shown on the official text (JP, KR, TW, CN orders), or the NPCSC adoption date (CN laws). `in_force` = initial entry-into-force date. Later stages go in `applies_from`. Where a date is reported only by month, or sources conflict, the field is `null` and the reason is in `freeze_reason`.
- **Versions frozen:** KR AI Basic Act = consolidated version effective 2026-07-21 (Act 21311). KR Enforcement Decree = version effective 2026-08-20 (PD 36580). KR PIPA = version effective 2026-09-11 (Act 21445). JP APPI = revision in force 2026-11-02, **excluding** the 2026 amending Act stages scheduled for 2027-01-17 and 2028-07-16. AU Privacy Act = Compilation 104 (2026-06-04 → 2026-12-10), which **does not yet contain APP 1.7–1.9**; those are frozen through the POLA Act 2024 `sch1-pt15`. TW PDPA = MOJ current text, **which includes amended articles not yet in force** (commencement to be set by the Executive Yuan).
- **Licences:** CN (Copyright Law art. 5), JP (art. 13), KR (art. 7) and TW (art. 9) all exclude statutes from copyright. These are stated from legal knowledge and were not re-verified against licence pages this run. AU Federal Register = CC BY 4.0. Everything else is `unknown` unless stated.

## Excluded or not covered, and why
- **Not frozen although binding (access, not licence):** CN anthropomorphic-AI measures 2026 and CN AI ethics-review measures 2026 (CAC WAF; no gov.cn copy located); SG PDPA (SSO 403); NZ Privacy Act 2020 (WAF); VN AI Law 134/2025/QH15 and Digital Technology Industry Law 71/2025/QH15 (portal 502); IN DPDP Act and Rules, IT Rules 2026 amendment (SPA hosts); ID, MY, TH and HK statutes (hosts not requested within budget).
- **Standards:** CN GB 45438-2025 (mandatory) and GB/T 45654-2025 are registry-only (`NOT_FROZEN`, licence restricted/unconfirmed). Clause headings were not fetched, so no `IDS_ONLY` rows are emitted.
- **Bills/drafts:** registry only, nothing frozen: ID draft AI Perpres, MY AI Governance Bill, TH draft AI Act, PH AIDRA bills.
- **Not registered (planning items, not instruments):** China comprehensive AI Law. It appears in the State Council 2026 work plan ("accelerate comprehensive legislation"). Its NPCSC 2026 tier is reported inconsistently: "preliminary review" (China Briefing) vs "backup research topic" (China AI Bulletin). No draft text has been published. Also not registered: Australia's July 2026 announcement of mandatory AI standards with legislation planned for early 2027 (single source); Japan's AI legal-framework working group (Oct 2026).
- **Out of time budget, not checked:** Philippines Data Privacy Act 2012; Malaysia National Guidelines on AI Governance & Ethics (2024) and PDP Commissioner ADM guideline (Apr 2026, single source); Singapore Online Safety (Relief and Accountability) Act, the elections deepfake amendment and the CSA agentic-AI addendum; Australia's whole-of-government AI policy v2.0; HKMA/SFC AI circulars; sector regulators (RBI FREE-AI, SEBI, MAS FEAT/AI risk guidelines, BNM, OJK); Pakistan, Bangladesh, Sri Lanka, Nepal, Mongolia, Brunei, Cambodia, Laos, Myanmar, Timor-Leste, Pacific Island states; Central Asia (treated as out of APAC scope).

## Status not fully verified (provisional)
- SG PDPA 2012: one secondary source; SSO blocked; dates null.
- SG PDPC Advisory Guidelines on Personal Data in GenAI (2026-07-20): one secondary source.
- CN AI ethics-review measures: `in_force` conflicts across sources (2026-03-20 / 2026-04-03 / 2026-07-15).
- CN GB/T 45654-2025: one secondary source; adoption date unknown.
- IN DPDP Rules: notification date 13 vs 14 Nov 2025 across sources; G.S.R. numbers not verified; DPDP Act number not re-verified.
- TH draft AI Act: hearing opening date 2 Jul vs 9 Jul 2026.
- PH AIDRA bills: one secondary source.
- NZ Privacy Act 2020, HK PDPO, ID PDP Law, TH PDPA: in force per secondary sources; some dates null.
- NZ Public Service AI Framework launch date (2025-01-30): one secondary source.
- KR Enforcement Decree: original entry-into-force date not shown in the fetched fragment (null).
- TW AI Basic Act: `in_force` null (Art. 20 says effective from promulgation; the exact effective-day computation was not verified).
