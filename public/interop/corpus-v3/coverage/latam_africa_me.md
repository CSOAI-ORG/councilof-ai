# LatAm-Africa-ME wave — global AI regulatory registry and frozen provision corpus (track `latam_africa_me`)

Built 2026-11-21 (UTC). Registry: **137 instruments** across **80 jurisdiction codes**. Frozen: **12 instruments, 552 provisions** (all hashed with the frozen normaliser v1.0.0, unmodified). Track root (informational; merged root computed at integration): `ba7ee4347aa2e0c28d144dc959d0aff70c9f061054225b025040320eefe317c4`.

A registry row is a routing record. It does not imply any relationship with the named authority, and nothing here is measured or certified as compliant.

## 1. Relationship to corpus v2
- The v2 registry holds 44 national rows in this wave's jurisdictions (42 NOT_FROZEN; FULL_TEXT: CL-Ley21719-datos-2024, PE-DS115-2025-PCM-AIreg-2025) plus the regional row INTL-au-continental-ai-strategy-2024.
- **Six v2 instruments were frozen in this wave and are re-emitted as full updated rows with their v2 ids:** AR-Ley25326-datos-2000, BR-PL2338-2023, INTL-au-continental-ai-strategy-2024, NG-ndpc-gaid-2025, RW-dp-law-058-2021, SA-pdpl-2021. All other rows are new ids (none collide with v2).
- v2 rows not re-emitted but with new status evidence are listed in §6 for the integration step.

## 2. What was searched
- **Legal Data Hunter:** 3 calls total (discover_sources BR → quota message; resolve_reference BR LGPD → not_found; MX LFPDPPP → not_found; AR → quota refused). No text from LDH.
- **Official hosts approved this wave (47 domains)** — reachable and used: www.impo.com.uy (JSON), www.argentina.gob.ar, www.camara.leg.br, legis.senado.leg.br (metadata API), www.bacn.gov.py, au.int, dgp.sdaia.gov.sa, dataprotection.govmu.org, dpo.gov.rw, ndpc.gov.ng (WordPress REST media API), www.mtcit.gov.om, www.citra.gov.kw, oic.gov.jm, inforegulator.org.za, www.gov.br, normas.leg.br, africanlii.org (search API only). Failures in §5.
- **Status verification:** ~25 web searches (regional trackers, law-firm guides, official pages surfaced by search) plus the official pages fetched above; every row cites its sources with `checked_at` 2026-11-21. Rows supported by a single secondary source, or with conflicting sources, are listed in §7.

## 3. Split rules and text extraction
- **IMPO (UY):** one provision per `articulos[]` element of the `?json=true` response (`Artículo N. ` + body; `<br>` → newline, tags stripped). JSON decoded as ISO-8859-1 with `strict=False` (raw control chars in source). Ley 20.212: only arts. 74-75 (per-article JSON).
- **Argentina Ley 25.326:** `infoleg-norma-body` div of the 'texto actualizado' page; split at line-initial `ARTICULO N`; preamble kept. 48 articles (art. 47 vetoed, note retained in art. 48 tail as published).
- **PL 2338/2023 (BR):** Câmara PDF (codteor 2868197). Removed per-page lines: `*CD…*` barcode, `PL n.2338/2023`, `Autenticado Eletronicamente…`, `Apresentação: …`, lone page numbers. Split at line-initial `Art. Nº`. **Art. 31 is absent from the published text** (pages 16→17 continuous); 79 articles + preamble. Frozen as bill text, not law.
- **Paraguay Ley 7593/2025:** BACN HTML; body from `LEY Nº 7593` to before `Tags:`; split at line-initial `Artículo N.°`; heading = rest of first line.
- **Saudi PDPL:** SDAIA Arabic PDF via `?MOD=AJPERES` URL; only Arabic presentation-form code points (U+FB50-FDFF, U+FE70-FEFF) mapped with NFKC to base letters; page-margin numeric blocks dropped; split at `المادة …:`, numbered sequentially art1-art43 (Arabic ordinal kept in `label`). Cover page dropped (reversed RTL extraction). Implementing and Transfer Regulations not frozen (reversed RTL text).
- **Mauritius DPA 2017:** DPO PDF; body from `An Act` before `ENACTED`; sequential section split `N.` + heading line (1-58, monotonic filter excludes TOC/list numbers); Schedule separate.
- **Rwanda Law 058/2021:** 9 DPO chapter pages (English); split at `Art. N`; site sidebar/footer trimmed at `Chapter X (Art. a-b)` / `Address` markers; hashes recomputed after trimming.
- **NDPC GAID 2025:** PDF; first/last-line page numbers stripped; split at second `Article 1:` (after TOC), sequential 1-52; Schedules 1-10 split at `SCHEDULE N`.
- **AU Continental AI Strategy:** PDF; front matter + numbered sections 1, 1.1-1.4, 2, 2.1-2.4, 3, 3.1, 3.2 (footnote lines that look like headings filtered); footnotes remain inline.
- **Hashing:** `provision_sha256 = provision_hash(text)`; `instrument_root = corpus_root({provision_id: sha})`; **552/552 hashes and 12/12 roots recompute from the written JSONL**; every `document_sha256` matches a file in `sources_latam_africa_me.tar.gz`.

### Frozen instruments
| instrument_id | provisions | language | instrument_root |
|---|---|---|---|
| `AR-Ley25326-datos-2000` | 49 | es | `75c3cde4b874d1b4…` |
| `BR-PL2338-2023` | 80 | pt | `d56b7ef49dae5a7b…` |
| `INTL-au-continental-ai-strategy-2024` | 14 | en | `db098642f53c0215…` |
| `MU-dpa-2017` | 60 | en | `5d49ac0536e9f6a4…` |
| `NG-ndpc-gaid-2025` | 62 | en | `e3c448fea3752a14…` |
| `PY-Ley7593-datos-2025` | 62 | es | `05a710101b4fdfaf…` |
| `RW-dp-law-058-2021` | 70 | en | `bcbce12a7c6b6238…` |
| `SA-pdpl-2021` | 43 | ar | `7451cd067d9926f5…` |
| `UY-Dec276-2025-sandboxIA-2025` | 18 | es | `d5f72dfafe7d8939…` |
| `UY-Dec414-2009-datos-2009` | 41 | es | `6d14207f0d33a08f…` |
| `UY-Ley18331-datos-2008` | 51 | es | `16d3c10f6c69fd2d…` |
| `UY-Ley20212-art74-75-IA-2023` | 2 | es | `3c287a839e51c798…` |

## 4. Coverage by jurisdiction (this file only)
| Jurisdiction | Instruments | FULL_TEXT | Provisions | Status mix |
|---|---|---|---|---|
| AE | 4 | 0 | 0 | IN_FORCE:4 |
| AG | 1 | 0 | 0 | IN_FORCE:1 |
| AO | 1 | 0 | 0 | IN_FORCE:1 |
| AR | 1 | 1 | 49 | IN_FORCE:1 |
| AU-union | 3 | 0 | 0 | IN_FORCE:3 |
| BB | 1 | 0 | 0 | IN_FORCE:1 |
| BF | 1 | 0 | 0 | IN_FORCE:1 |
| BH | 3 | 0 | 0 | BILL_PENDING:1, IN_FORCE:2 |
| BI | 1 | 0 | 0 | None:1 |
| BJ | 2 | 0 | 0 | IN_FORCE:2 |
| BR | 1 | 1 | 80 | BILL_PENDING:1 |
| BS | 1 | 0 | 0 | IN_FORCE:1 |
| BW | 1 | 0 | 0 | IN_FORCE:1 |
| BZ | 1 | 0 | 0 | IN_FORCE:1 |
| CF | 1 | 0 | 0 | None:1 |
| CG | 1 | 0 | 0 | IN_FORCE:1 |
| CI | 2 | 0 | 0 | IN_FORCE:2 |
| CM | 1 | 0 | 0 | None:1 |
| CR | 4 | 0 | 0 | IN_FORCE:2, BILL_PENDING:2 |
| CU | 1 | 0 | 0 | IN_FORCE:1 |
| DJ | 1 | 0 | 0 | IN_FORCE:1 |
| DO | 1 | 0 | 0 | IN_FORCE:1 |
| DZ | 2 | 0 | 0 | IN_FORCE:2 |
| EC | 3 | 0 | 0 | IN_FORCE:3 |
| EG | 2 | 0 | 0 | IN_FORCE:2 |
| ET | 2 | 0 | 0 | IN_FORCE:2 |
| GA | 1 | 0 | 0 | IN_FORCE:1 |
| GD | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| GH | 4 | 0 | 0 | BILL_PENDING:2, IN_FORCE:2 |
| GM | 1 | 0 | 0 | IN_FORCE:1 |
| GN | 1 | 0 | 0 | IN_FORCE:1 |
| GQ | 1 | 0 | 0 | IN_FORCE:1 |
| GT | 1 | 0 | 0 | BILL_PENDING:1 |
| GY | 1 | 0 | 0 | ENACTED_NOT_YET_APPLICABLE:1 |
| HN | 1 | 0 | 0 | BILL_PENDING:1 |
| INTL | 4 | 1 | 14 | IN_FORCE:4 |
| JM | 2 | 0 | 0 | IN_FORCE:2 |
| JO | 1 | 0 | 0 | IN_FORCE:1 |
| KN | 1 | 0 | 0 | IN_FORCE:1 |
| KW | 2 | 0 | 0 | None:1, IN_FORCE:1 |
| LB | 1 | 0 | 0 | IN_FORCE:1 |
| LC | 1 | 0 | 0 | None:1 |
| LR | 1 | 0 | 0 | BILL_PENDING:1 |
| LS | 2 | 0 | 0 | None:1, IN_FORCE:1 |
| LY | 1 | 0 | 0 | IN_FORCE:1 |
| MA | 3 | 0 | 0 | BILL_PENDING:2, IN_FORCE:1 |
| MG | 1 | 0 | 0 | None:1 |
| ML | 1 | 0 | 0 | IN_FORCE:1 |
| MR | 2 | 0 | 0 | IN_FORCE:2 |
| MU | 3 | 1 | 60 | IN_FORCE:2, SUPERSEDED:1 |
| MW | 1 | 0 | 0 | IN_FORCE:1 |
| MZ | 1 | 0 | 0 | BILL_PENDING:1 |
| NA | 1 | 0 | 0 | BILL_PENDING:1 |
| NE | 1 | 0 | 0 | IN_FORCE:1 |
| NG | 2 | 1 | 62 | BILL_PENDING:1, IN_FORCE:1 |
| NI | 1 | 0 | 0 | IN_FORCE:1 |
| OM | 3 | 0 | 0 | IN_FORCE:3 |
| PA | 3 | 0 | 0 | BILL_PENDING:1, IN_FORCE:2 |
| PE | 2 | 0 | 0 | IN_FORCE:2 |
| PY | 1 | 1 | 62 | ENACTED_NOT_YET_APPLICABLE:1 |
| QA | 4 | 0 | 0 | IN_FORCE:4 |
| RW | 1 | 1 | 70 | IN_FORCE:1 |
| SA | 7 | 1 | 43 | IN_FORCE:7 |
| SC | 1 | 0 | 0 | IN_FORCE:1 |
| SL | 1 | 0 | 0 | BILL_PENDING:1 |
| SN | 2 | 0 | 0 | IN_FORCE:2 |
| SO | 1 | 0 | 0 | IN_FORCE:1 |
| ST | 1 | 0 | 0 | IN_FORCE:1 |
| SV | 2 | 0 | 0 | None:1, IN_FORCE:1 |
| SZ | 1 | 0 | 0 | IN_FORCE:1 |
| TD | 1 | 0 | 0 | IN_FORCE:1 |
| TG | 1 | 0 | 0 | IN_FORCE:1 |
| TN | 3 | 0 | 0 | BILL_PENDING:1, IN_FORCE:2 |
| TR | 3 | 0 | 0 | IN_FORCE:2, BILL_PENDING:1 |
| TT | 1 | 0 | 0 | PARTIALLY_APPLICABLE:1 |
| TZ | 1 | 0 | 0 | IN_FORCE:1 |
| UG | 1 | 0 | 0 | IN_FORCE:1 |
| UY | 4 | 4 | 112 | IN_FORCE:4 |
| ZM | 2 | 0 | 0 | IN_FORCE:2 |
| ZW | 2 | 0 | 0 | IN_FORCE:2 |

## 5. Blocked hosts and routes (never bypassed: no UA spoofing, mirrors, proxies or TLS-verification changes)
| Host | Error | Suggested human route |
|---|---|---|
| new.kenyalaw.org | HTTP 202, empty body (bot challenge) | Laws.Africa Content API token (api.laws.africa) or owner download |
| ulii.org, www.lawlibrary.org.za, africanlii.org (document pages) | HTTP 403 Cloudflare 'Just a moment' (search API on africanlii.org answers, intermittently 502) | Laws.Africa Content API token (designed for automated use) — covers KE, UG, ZA, TZ, ZM, ZW, MW, NA, LS, SZ, SL, GM, NG, GH LIIs |
| uaelegislation.gov.ae | HTTP 403 Cloudflare 'Sorry, you have been blocked' | Owner download of PDPL / AI law PDFs into ~/meok-him |
| www.difc.com | HTTP 429 Vercel Security Checkpoint | Owner download of DIFC DP Law 5/2020 and DP Regulations (Reg 10) |
| laws.boe.gov.sa | proxy 'Tunnel connection failed: 502 Bad Gateway' | Owner download (Arabic HTML/PDF) of PDPL Implementing and Transfer Regulations |
| knesset.gov.il (OData) | proxy 502 Bad Gateway | Owner download or retry from another network the owner controls; not attempted further |
| www.dof.gob.mx | TLS hostname mismatch (verification not disabled) | Owner download of DOF 20/03/2025 LFPDPPP |
| www.kvkk.gov.tr | TLS chain incomplete (unable to get local issuer certificate) | Owner download, or host fixes its certificate chain |
| www.mevzuat.gov.tr | Read timeout (20-30 s) | Retry later; else owner download of Law 6698 PDF |
| www.planalto.gov.br | Read timeout (again; also failed in the Americas wave) | Owner download of LGPD compilado; normas.leg.br is an Angular SPA (/api/public/ requires undocumented params); Senate API gives only 2018 original DOCX ids |
| leyes.congreso.gob.pe | HTTP 403 | Owner download of Ley 31814 |
| www.gob.pe | HTTP 418 'Acceso restringido' | Retry via cdn.www.gob.pe document links (worked in Americas wave) or owner download |
| www.senado.cl, www.camara.cl | HTTP 403 Cloudflare | Owner download of AI bill (boletín 16821-19) texts |
| www.modee.gov.jo | HTTP 451 'Restricted Access - MoDEE Hosting' | Owner download of Law 24/2023 |
| www.pdp.gov.bh | HTTP 403 | Owner download of Law 30/2018 |
| www.odpc.go.ke, www.cndp.ma, sdaia.gov.sa, www.in.gov.br | proxy connection failure (no response body) | Retry later; else owner download |
| www.secretariasenado.gov.co | HTTP 502 | Retry later (Colombia Ley 1581, Ley 2502) |
| www.dataprotection.org.gh | redirects to dpc.gov.gh (not allowlisted; not requested in this wave) | request_network_access(dpc.gov.gh) next wave |
| almeezan.qa | React SPA, no text in HTML | Owner download of Law 13/2016 print view |
| sinalevi.go.cr (pgrweb redirect) | Kendo UI SPA, templated HTML only | Owner download of Ley 8968 SCIJ export |
| www.gacetaoficial.gob.pa | 212-byte HTML shell | Owner download of Ley 81/2019 gazette PDF |
| au.int (Malabo PDFs) | All four language PDFs image-only | Text-layer edition from AU OLC or human-verified transcription |
| www.mtcit.gov.om (PDPL, RD 68/2026, AI policy) | Legacy Arabic font encoding (mojibake) / image-only PDF | Unicode PDF from qanoon.om or Official Gazette |
| dgp.sdaia.gov.sa (Implementing + Transfer Regs) | Text layer has reversed RTL word order | BOE Arabic HTML or SDAIA official English translation |
| Legal Data Hunter MCP | Free quota (20/day, shared) exhausted: 2 calls made (BR, MX resolve_reference → not_found), third refused | Paid tier only if the owner approves; coverage of these laws unproven |

## 6. Proposed status updates to v2 rows (not re-emitted here)
- `KE-ai-bill-2026` (Senate Bill No. 4 of 2026): first reading 2 Apr 2026 (Parliament bill digest, official); Senate ICT Committee recommended the Senate **not proceed** (The Star, 15 Oct 2026; Innovation Village). Keep BILL_PENDING until a Senate vote; flag as likely to lapse.
- `CL-PL-IA-16821-19-2024`: second constitutional stage in the Senate; Comisión de Desafíos del Futuro approved it in general on 26 Oct 2026 and issued its first report on 10 Nov 2026 (Diario Constitucional; advise.ec citing Senado record 2026-11-11). Remains BILL_PENDING.
- `EG-pdpl-151-2020`: Executive Regulations issued by Ministerial Decree 816/2025 (1 Nov 2025); one-year compliance window ended 1 Nov 2026 (see new row `EG-pdpl-exec-regs-816-2025`).
- `AE-pdpl-45-2021`: still IN_FORCE without Executive Regulations as of 19 Nov 2026 (protechnology.ae; trytrustable Oct 2026; orentara Jul 2026); regulator functions moved to the federal AI and Data Authority announced 14 Jun 2026. Note: one blog (itsecnow) claims the regulations were issued in 2026, which conflicts with the official-portal checks quoted by four other sources.
- `ZA-draft-national-ai-policy-2026`: LAPSED is consistent with secondary sources (withdrawn 27 Apr 2026; replacement policy targeted for March 2027 per Innovation Village).
- `TR-ai-bill-2-2234`, `TR-ai-bill-2-3358`: still in committee as of Nov 2026 (corrplus, lexinlegal); TBMM AI research commission recommended a framework law (Feb/Mar 2026).
- `IL-ppa-ai-guidance-draft-2025`: status null in v2; finalisation still unconfirmed (theleveragedyears, Jul 2026). Final PPA consent guidance published 25 Feb 2026 (dpoisrael.com) — not registered here.
- `SA-global-ai-hub-law-draft-2025`: still a consultation draft (CMS Feb 2026; grclens; vision2030.ai Jul 2026).
- `MX-AI-federal-bills-2026`: no general AI law as of mid-2026; at least six initiatives in 2026 (observatorio-ia-mexico tracker; itsitio, academiadeia).
- `BR-LGPD-2018`, `MX-LFPDPPP-2025`, `CO-*`, `PE-Ley31814-IA-2023`: re-attempted hosts still blocked (see §5); no row re-emitted.

## 7. Unverified or provisional statuses (87 rows)
- `PY-Ley7593-datos-2025: applies_from 2027-11-28 computed by secondary sources from art. 57; exact day not confirmed against the Gaceta Oficial`
- `MU-dpa-2017: amendments after the DPO-published consolidated PDF (if any, e.g. 2026 reform effort reported by Techhive) not checked`
- `AU-union-achpr-res473-ai-2021: exact adoption date within 2021 not cited`
- `INTL-ecowas-supplementary-act-data-2010: official ECOWAS publication URL not located`
- `INTL-eac-framework-cyberlaws-2008: sources call it a 'draft' framework; status IN_FORCE means 'adopted policy framework', not binding law`
- `DZ-loi18-07-donnees-2018: claim that Loi 25-11 removed the general automated-decision rule (ailawradar.com) is single-source`
- `AO-lei22-11-dados-2011: single secondary source; current consolidation/2025 amendments not checked`
- `BJ-code-numerique-livre5-2018: single secondary source; Code law number and date not cited`
- `BW-dpa-2024: in_force conflict: Oct 2024 (Bowmans) vs 14 Jan 2025 (ConsentStack, Digital Policy Alert 'came into effect in January')`
- `BF-loi-donnees-2021: law number/year not cited; year in id is provisional`
- `BI-loi-donnees-2026: promulgation/in-force status not verified; status null`
- `CM-loi2024-017-donnees-2024: applicability/transition period not verified; status null`
- `CF-loi24-001-donnees-2024: single source; in-force status unknown`
- `TD-loi-donnees-2015: single source; number/date not cited; year provisional`
- `CG-loi-donnees-2019: law number/year not cited; year provisional`
- `CI-loi2013-450-donnees-2013: day/month of adoption from title convention, not cited`
- `DJ-loi-donnees-2025: law number/year not cited`
- `GQ-ley-datos-2016: single source; number/year not cited`
- `SZ-dpa-2022: single source; year provisional`
- `GA-loi-donnees-2023: single source; number/year not cited`
- `GH-dpa-act843-2012: www.dataprotection.org.gh redirects to dpc.gov.gh (not allowlisted); official text not fetched`
- `LS-dpa-2011: 'passed, not enforced' — commencement/authority not verified; status null`
- `MG-loi2014-038-donnees-2014: enforcement status not verified; status null`
- `ML-loi-donnees-2013: single source; number not cited`
- `MR-loi-donnees-2017: single source; number/year not cited`
- `MA-loi09-08-donnees-2009: www.cndp.ma proxy error; official text not fetched`
- `NE-loi2017-28-donnees-2017: number attribution from a truncated table row`
- `ST-lei-dados-2016: single source; number/year not cited`
- `SN-loi2008-12-donnees-2008: www.cdp.sn returned a 470-byte JS shell; reform bill status (2025-26) not checked`
- `SC-dpa-2023: single source; year provisional; commencement not verified`
- `SO-dpa-2023: single source; year provisional`
- `TG-loi2019-014-donnees-2019: single source; number not cited`
- `TN-loi-org-donnees-2004: number/date not cited`
- `TN-dp-bill-2026: single source`
- `UG-dppa-2019: ulii.org Cloudflare; text not fetched`
- `ZM-dpa-2021: act number from AfricanLII index (/akn/zm/act/2021/3) not confirmed as DPA`
- `ZW-cdpa-2021: single source; act number from AfricanLII index (/akn/zw/act/2021/5)`
- `NA-dp-bill-2025: enactment status as of Nov 2026 not confirmed by an official source`
- `MZ-dp-bill-2025: enactment status as of Nov 2026 not confirmed by an official source`
- `LR-dp-bill-2025: enactment status as of Nov 2026 not confirmed by an official source`
- `SL-dp-bill-2025: enactment status as of Nov 2026 not confirmed by an official source`
- `MU-national-ai-strategy-2018: superseded by the 2026 strategy per GINC/Techhive; exact supersession act not cited`
- `TN-national-ai-strategy-2022: tracker dates the strategy 2025 vs OECD 2022`
- `GH-national-ai-strategy-2025: earlier 2023 strategy (OECD 'Ghana (2023)') relationship not resolved; launch date not cited`
- `ZW-national-ai-strategy-2026: single source; relationship to 2023 instrument unclear`
- `DZ-national-ai-strategy-2024: year conflict 2024 (OECD) vs 2025 (tracker)`
- `MR-national-ai-strategy-2024: single source`
- `LS-national-ai-strategy-2025: OECD lists Lesotho both as adopter and under development`
- `LY-national-ai-strategy-2025: single source`
- `GH-emerging-technologies-bill-2025: draft not yet in Parliament; BILL_PENDING used for pre-parliamentary draft`
- `NG-digital-economy-egov-bill-2024: bill number/introduction year not cited; year in id provisional`
- `EG-pdpl-exec-regs-816-2025: Chambers (ARTICLE 19) cites Decision No. 81 of 2025 vs 816 of 2025 elsewhere; 816 used`
- `EG-charter-responsible-ai-2023: both citations from the same tracker`
- `MA-digital-x0-framework-law-2025: draft status from one tracker; no official text located`
- `MA-ai-agency-bill-2024: single source`
- `AE-adgm-dpr-2021: commencement/transition dates not cited`
- `AE-cbuae-ai-guidance-note-2026: exact title, number and date not cited`
- `AE-ai-data-authority-2026: establishing instrument (decree-law number) not identified; kind/status provisional`
- `SA-sdaia-ai-risk-mgmt-framework-2026: binding character ('requirements apply proportionally') not verified; kind provisional`
- `SA-sdaia-deepfakes-guidelines-2026: single source; date not confirmed`
- `QA-mcit-ai-guidelines-developers: year not cited (id has no year)`
- `QA-qfc-dpr-2021: single source`
- `KW-ai-governance-framework-2026: single source; issuing body and status unknown; status null`
- `OM-rd68-2026-pdpl-amend: in_force date not cited (ConsentStack shows 2026-02-05 for 'Oman PDPL')`
- `OM-ai-ethics-policy: adoption year not cited`
- `JO-pdpl-24-2023: in-force date not cited`
- `LB-law81-2018: single source`
- `TR-kvkk-amendment-ai-content-bill-2026: 'adopted' holds submission date (bill)`
- `TR-ai-action-plan-2026-2030: single secondary source citing the Official Gazette`
- `TR-kvkk-agentic-ai-guidance-2026: single source`
- `EC-reglamento-lopdp-de904-2023: in_force taken as publication date`
- `SV-ley-fomento-ia-2025: LoC cites 'Decree No. 23' vs Decree 234 elsewhere`
- `SV-ley-datos-personales-2024: single source; number/dates/status not verified; status null`
- `PA-anteproyecto014-ia-2023: status as of Nov 2026 not verified (source dated 2025)`
- `PE-ds016-2024-jus-reglamento: in_force conflict: 29/30/31 March 2025 across sources`
- `DO-ley172-13-datos-2013: single source; reform bill status not verified`
- `BB-dpa-2019: CEPAL table listed it as 'not in force' (older)`
- `BS-dp-privacy-act-2003: Siberson cites an Official Gazette 'Data Protection Act, 2025' — possible replacement not verified`
- `TT-dpa-2011: year 2011 vs 2012 across sources`
- `BZ-dpa-2021: caribbeanairisk claims Belize lacks a modern framework (conflict)`
- `AG-dpa-2013: in-force status not explicit in snippet`
- `KN-dpa-2018: in-force status not explicit`
- `LC-dpa-2023: 2011 vs 2023 Act and commencement conflict; status null`
- `GD-dpa-2023: single source`
- `AU-union-achpr-res473-ai-2021: official_url taken from a secondary source's reference list, not fetched`
- `AU-union-data-policy-framework-2022: official_url taken from a secondary source's reference list, not fetched`
- `INTL-sadc-model-law-data-protection-2013: official_url taken from a secondary source's reference list, not fetched`

## 8. Remaining work (precise)
- **No registry row (no instrument verified in this wave):** Cabo Verde (DP law Lei 133/V/2001 not cited by any fetched source), DR Congo (Code du numérique 2023 not cited), Guinea-Bissau, Comoros, Eritrea, Sudan, South Sudan (DP bill only announced for 2026 — Radio Tamazuj), Libya (DP law; only the 2025 AI strategy is registered), Western Sahara/SADR; Iraq, Iran, Syria, Yemen, Palestine (no cross-sector DP statute per kooch.co 2026; Iran national AI document not verified); Venezuela and Bolivia (no DP law per digitalprivacyregs/Data-Pop Alliance); Suriname, Haiti, Dominica, St Vincent; OAS instruments (Updated Principles on Privacy and Personal Data 2021), CARICOM/OECS model bill, RIPD standards — not searched for time.
- **Registered but text not frozen and reachable in principle:** Kenya DPA 2019 + regulations, Nigeria NDPA 2023 (English; only Hausa/Igbo/Yoruba translations found on ndpc.gov.ng), South Africa POPIA (Act PDF not on inforegulator.org.za popia page), Uganda, Tanzania, Zambia, Zimbabwe, Ghana, Botswana, Malawi texts (all via Laws.Africa API route); Ecuador LOPDP + SPDP norms, El Salvador AI law, Jamaica DPA (Parliament PDF host not requested), Barbados, Panama.
- **Brazil:** ANPD resolutions (CD/ANPD 2/2022, 4/2023, 15/2024, 18/2024, 19/2024), ANPD AI sandbox (cycle 1 report 2 Jul 2026; 2nd report 9 Oct 2026, gov.br) and the Plano Brasileiro de IA were not registered (time).
- **Sector rules:** Gulf central-bank AI rules beyond CBUAE/QCB, African central-bank AI guidance, telecom-regulator AI rules — not enumerated.
- **AU Continental AI Strategy §2.4** (84k chars) should be split by sub-section in a later pass.

## 9. Schema notes
- `status: null` is used where enactment/commencement could not be verified (8 rows); `BILL_PENDING` is used for pre-parliamentary drafts.
- Instrument ids with a provisional year are flagged in §7. `AU-union` is used for AU-level instruments; the v2 AU Strategy row keeps `INTL`.
- `official_url` values not fetched in this wave (rows with blocked_route excepted) are routing pointers only; three regional URLs were copied from secondary-source reference lists (see §7).
- `adopted` for bills holds the submission/introduction date where known.
