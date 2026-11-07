# FINES-REFRESH-RESEARCH-2026-11-07

**Research date:** 2026-11-07
**Subject:** refresh of the Council of AI enforcement corpus (`GET https://councilof.ai/api/fines`, corpus `as_of: 2026-08-24`)
**Method:** primary sources only (regulator decision / order / press release / statute text). Every claim carries a URL that was opened and read.

## Corpus under review (as published 2026-08-24)

Source: https://councilof.ai/api/fines (fetched 2026-11-07)

| Field | Corpus value |
|---|---|
| `as_of` | 2026-08-24 |
| `first_fine_watch.eu_ai_act_fines_collected_eur` | 0 |
| `first_fine_watch.enforcement_powers_live_since` | 2026-08-02 |
| `first_fine_watch.maximal_exposure` | "Art 101 GPAI — EUR 35M or 7% of worldwide turnover, whichever is higher" |
| Clearview AI | ">EUR 100M", GDPR, REPORTED, cumulative (multi-MSA) |
| FTC | "~USD 85M", FTC Act / ECOA, REPORTED, "order (partly suspended)" |
| UK ICO | "~GBP 17M", UK GDPR, REPORTED, "AI-adjacent" |
| OpenAI (IT) | EUR 15M, GDPR, REPORTED, "annulled — not a collected fine", `annulment_date: UNVERIFIED` |
| EU AI Act Art 101 GPAI | EUR 0, MEASURED, FIRST-FINE WATCH |

The corpus's own `reviewed_against` field states: "public secondary sources; no row re-verified against a primary regulator filing on this date".

---

## Item 1 — EU AI Act Art 101 GPAI fines (FIRST-FINE WATCH)

### 1a. Statutory penalty figures — CORRECTED

Primary source opened and read: Regulation (EU) 2024/1689, OJ L 2024/1689, 12.7.2024 —
https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202401689 (ELI: http://data.europa.eu/eli/reg/2024/1689/oj)

**Article 101 "Fines for providers of general-purpose AI models", para 1 (verbatim):**

> "1. The Commission may impose on providers of general-purpose AI models fines not exceeding 3 % of their annual total worldwide turnover in the preceding financial year or EUR 15 000 000, whichever is higher, when the Commission finds that the provider intentionally or negligently:
> (a) infringed the relevant provisions of this Regulation;
> (b) failed to comply with a request for a document or for information pursuant to Article 91, or supplied incorrect, incomplete or misleading information;
> (c) failed to comply with a measure requested under Article 93;
> (d) failed to make available to the Commission access to the general-purpose AI model or general-purpose AI model with systemic risk with a view to conducting an evaluation pursuant to Article 92."

**Article 99 tiers (verbatim excerpts), same source:**

| Tier | Article | Figure | Scope |
|---|---|---|---|
| 3 | Art 99(3) | up to **EUR 35 000 000** or **7 %** of total worldwide annual turnover, whichever higher | Non-compliance with the prohibition of the AI practices referred to in Article 5 |
| 4 | Art 99(4) | up to **EUR 15 000 000** or **3 %**, whichever higher | Obligations of providers (Art 16), authorised representatives (Art 22), importers (23), distributors (24), deployers (26), notified bodies (31/33/34), and **transparency obligations pursuant to Article 50** |
| 5 | Art 99(5) | up to **EUR 7 500 000** or **1 %**, whichever higher | Supply of incorrect, incomplete or misleading information to notified bodies / national competent authorities in reply to a request |

**Verdict on corpus claim "Art 101 GPAI — EUR 35M or 7% of worldwide turnover, whichever is higher": CORRECTED.**
Art 101 GPAI exposure is **EUR 15 000 000 or 3 %**, whichever is higher. The "EUR 35M / 7 %" pair in the corpus is the **Article 99(3)** tier (prohibited practices under Article 5) and does **not** apply to GPAI providers under Article 101. The corpus conflated the two tiers. The Art 99(4) tier coincidentally carries the same EUR 15M / 3 % numbers as Art 101, but applies to Member-State-enforced operator obligations (including Art 50 transparency) — a different route and a different authority from the Commission's Art 101 power.

### 1b. Enforcement-powers date — CONFIRMED (2026-08-02), with a nuance

**Article 113 "Entry into force and application" (verbatim):**

> "This Regulation shall enter into force on the twentieth day following that of its publication in the Official Journal of the European Union.
> It shall apply from 2 August 2026.
> However:
> (a) Chapters I and II shall apply from 2 February 2025;
> (b) Chapter III Section 4, Chapter V, Chapter VII and Chapter XII and Article 78 shall apply from 2 August 2025, with the exception of Article 101;
> (c) Article 6(1) and the corresponding obligations in this Regulation shall apply from 2 August 2027."

**Article 111(3) (verbatim):**

> "3. Providers of general-purpose AI models that have been placed on the market before 2 August 2025 shall take the necessary steps in order to comply with the obligations laid down in this Regulation by 2 August 2027."

Reading: Chapter XII (Penalties) applied from **2025-08-02**, but **Article 101 was carved out** of that early application by Art 113(b). Article 101 therefore falls to the general rule and **applies from 2026-08-02**. The corpus's `enforcement_powers_live_since: 2026-08-02` is **CONFIRMED** for Article 101 specifically. It should be described as "Art 101 applies from 2026-08-02" rather than a general "enforcement powers" date, because Art 99(1)–(11) (Member-State penalties for operators) has been applicable since 2025-08-02.

### 1c. Has any Art 101 fine been issued or announced between 2026-08-24 and 2026-11-07?

**Verdict: NO Art 101 fine found. `eu_ai_act_fines_collected_eur: 0` remains MEASURED as of 2026-11-07, but the corpus's characterisation of the enforcement state is now materially stale — the first Art 101 *process* steps have occurred and they are requests for information, not fines.**

Sources checked and what each returned:

| Source | URL | Result |
|---|---|---|
| European Commission, "The enforcement framework of the AI Act" (digital-strategy.ec.europa.eu) | https://digital-strategy.ec.europa.eu/en/policies/enforcement-ai-act | Describes the enforcement architecture and penalty tiers. States "The enforcement powers of the AI Office and the national competent authorities of the Member States apply from 2 August 2026". States expressly: "Other breaches, including of the **obligations for GPAI models**, may result in **fines of up to €15 million or 3% of total worldwide annual turnover**, whichever is higher." No fine announced on the page. |
| European Commission, "AI Act" policy page | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai | "From 2 August 2026, the AI Office and authorities of the Member States are responsible for implementing, supervising and enforcing the AI Act. The AI Office holds enforcement powers over GPAI models. It can request technical documentation, evaluate models, require corrective measures and issue fines for non-compliance." No fine announced. |
| European Commission AI Act Service Desk FAQ | https://ai-act-service-desk.ec.europa.eu/en/faq?faq_category_id=69 | "The AI Office may use these powers in cases where technical compliance dialogues are not sufficient." Describes issuing fines "of up to 3% of global annual turnover" as a *latent* power. No fine announced. |
| EUR-Lex, Regulation (EU) 2024/1689 (OJ L 2024/1689, 12.7.2024) | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202401689 | Statute text. Contains the Art 101 fine power but no fine decision (Art 101(6) requires implementing acts on procedure before fine decisions; no such implementing act was located). |
| Web search: "AI Act" first fine 2026 European Commission fine AI Office GPAI | — | No source reported an imposed AI Act fine. Multiple sources reported requests for information instead. |

**What did happen (REPORTED — secondary sources; the Commission's own primary confirmation is quoted):**

- The AI Office began using its Art 91 powers by sending **requests for information (RFIs)** to GPAI model providers on **security, external evaluation, and post-market monitoring** of models. Reported as the Commission's first use of AI Act enforcement powers over Chapter V. Sources: https://cisonews.ai/regulation/eu-ai-act-first-enforcement-actions-gpai-providers and https://ccsp.substack.com/p/the-ai-acts-first-enforcement-wasnt
- The disclosure was made on **14 October 2026** at the International AI Summit in Dublin by **Henna Virkkunen**, European Commission Executive Vice-President for Tech Sovereignty, Security and Democracy, who said the Commission's enforcement powers had applied since 2 August 2026 and that the AI Office "has started enforcing these rules". Sources: https://cisonews.ai/regulation/eu-ai-act-first-enforcement-actions-gpai-providers and https://ccsp.substack.com/p/the-ai-acts-first-enforcement-wasnt
- In the same week the Commission published the AI Act's first harmonised standard, an **Implementing Decision issued 14 October 2026**. Source: https://cisonews.ai/regulation/eu-ai-act-first-enforcement-actions-gpai-providers
- Euronews, quoted in the same source, reported that the AI Office sent requests for information to **two named companies** after judging their voluntarily disclosed documentation insufficient. Source: https://ccsp.substack.com/p/the-ai-acts-first-enforcement-wasnt (secondary reporting of Euronews; the Euronews article itself was not opened).

**Explicit statement of what was NOT found:** No Commission decision imposing a fine under Article 101 was located on EUR-Lex, on digital-strategy.ec.europa.eu, on the AI Act Service Desk FAQ, or in web search for "AI Act fine" / "first AI Act fine" / "GPAI fine" as of 2026-11-07. This is an observed absence in those sources, **not** a claim that no fine exists.

**Corpus implication:** `eu_ai_act_fines_collected_eur: 0` stands (MEASURED, 2026-11-07), but the corpus's `sentence` — "EU AI Act enforcement powers switched ON 2026-08-02" as though nothing had happened since — needs updating to record that the first Art 91 RFIs were issued and disclosed on 2026-10-14, i.e. that enforcement has begun procedurally without a monetary outcome. Also `maximal_exposure` must be corrected to EUR 15M / 3% (see 1a).

---

## Item 2 — OpenAI / Italy Garante EUR 15M: the annulment trail

**Verdict on the estate's `annulment_date: UNVERIFIED`: CORRECTED. The annulment is 18 March 2026. The prior pass's reading is confirmed.**

### Primary source — the Garante's own website

https://www.garanteprivacy.it/home/docweb/-/docweb-display/print/10085432 (fetched 2026-11-07), the Garante's press release "ChatGPT, il Garante privacy chiude l'istruttoria. OpenAI dovrà realizzare una campagna informativa di sei mesi e pagare una sanzione di 15 milioni di euro."

Verbatim from that page (the starred note the Garante added to its own release):

> "*Il provvedimento n. 755 del 2 novembre 2024 è stato temporaneamente rimosso dal sito web del Garante per la protezione dei dati personali a seguito della sentenza del Tribunale di Roma n. 4153/2026, pubbl. il 18/03/2026, con la quale è stata accolta l'opposizione proposta avverso il provvedimento del Garante*"

> "*Decision No. 755 of 2 November 2024 has been temporarily removed from the website of the Italian Data Protection Authority following judgment No. 4153/2026 of the Court of Rome. The judgment, published on 18 March 2026, upheld the appeal lodged against the Authority's decision*"

Also from the same page: the Garante opened the investigation in **March 2023**; the fine was EUR 15 million, calculated also taking into account the company's cooperative attitude; the Authority had additionally ordered a **six-month institutional communication campaign** under Art 166(7) of the Italian Privacy Code; and the Garante transferred the file to the Irish DPC as lead authority under the one-stop-shop rule, because OpenAI had established its European headquarters in Ireland.

### The decision text (full text of the judgment)

Court decision PDF, "REPUBBLICA ITALIANA IN NOME DEL POPOLO ITALIANO — TRIBUNALE [DI ROMA]", case **R.G. n. 4785/2025**, Giudice dott.ssa **Damiana Colla**, Section for human rights and immigration:
https://dei.web.uniroma1.it/sites/default/files/allegati/2026-05/Trib_Roma_OpenAI_Garante_2026.pdf

Verbatim extracts from the decision text:

> "OGGETTO: azione di annullamento di ordinanza-ingiunzione del Garante per la protezione dei dati personali n. 755 del 2.11.2024."

> "Con provvedimento del 12.2.2025 il giudice ha fissato l'udienza del 19.3.2025 per la trattazione nel contraddittorio delle parti della sola istanza cautelare di sospensione dell'efficacia esecutiva del provvedimento impugnato, al termine della quale con provvedimento del **21.3.2025** ha dichiarato la sospensione automatica della sanzione accessoria per effetto del deposito del ricorso ed è stata **sospesa l'efficacia della sanzione pecuniaria di euro 15.000.000,00** ingiunta nel provvedimento impugnato, subordinatamente alla prestazione, da parte della ricorrente, di una cauzione sotto forma di garanzia a prima richiesta per l'intero importo ingiunto, da stipularsi con primario istituto bancario o assicurativo entro 60 giorni dalla comunicazione del provvedimento cautelare (come da deposito del **22.5.2025**)."

> "Fissata per la decisione l'udienza del 17.12.2025, con termini alle parti sino a trenta giorni prima per il deposito di note e sino a dieci giorni prima per repliche, la causa è stata rinviata per la discussione orale all'udienza del **18.3.2026**, cui sono seguiti la lettura del dispositivo ed il suo deposito telematico."

> "P.Q.M. — Il Tribunale di Roma, in composizione monocratica, definitivamente pronunciando, così dispone:
> - in accoglimento del ricorso, **annulla il provvedimento n. 755 emesso dal Garante per la protezione dei dati personali in data 2 novembre 2024**;
> - dichiara inefficace la polizza fideiussoria n. 536/00022701 del 22.5.2025 prestata dalla società ricorrente a titolo di garanzia a prima richiesta in adempimento del provvedimento cautelare 21.3.2025;
> - compensa le spese di lite.
> Così deciso in Roma, in data **18.3.2026**."

### Pinned trail

| Step | Date | Body | Reference | Status |
|---|---|---|---|---|
| Investigation opened | March 2023 | Garante | — | Garante press release |
| Original fine + communication-campaign order | **2 November 2024** (provvedimento n. 755) | Garante per la protezione dei dati personali | n. 755/2024 | ANNULLED |
| Interim suspension of enforceability of the EUR 15M fine (against a first-demand surety bond) | **21 March 2025** | Tribunale di Roma | R.G. 4785/2025 | This is the "Mar 2025" in the estate's site data — it is the **precautionary suspension**, NOT the annulment |
| Surety policy lodged | 22 May 2025 | Tribunale di Roma | polizza fideiussoria n. 536/00022701 | — |
| Merits hearing | 18 March 2026 | Tribunale di Roma (Sezione per i diritti umani e l'immigrazione), Giudice Damiana Colla | sentenza n. 4153/2026 | — |
| **Annulment** | **18 March 2026** | **Tribunale di Roma** (Rome Civil Court, first instance) | **sentenza n. 4153/2026**, R.G. 4785/2025 | In force unless appealed |

### The estate's two sources are now reconciled

- **Site data "Mar 2025"** = the **21 March 2025** precautionary suspension order (Tribunale di Roma). The estate's site data was correct about the month but was describing an intermediate step, not the annulment.
- **"Mar 2026"** (recovery draft) = **18 March 2026**, the annulment. The recovery draft was right.
- The annulment month is therefore **March 2026**, specifically **2026-03-18**.

### Grounds and what remains open (REPORTED)

The court did not examine the merits of the GDPR infringements; it accepted OpenAI's preliminary ground on **allocation of competence for cross-border processing**. Because OpenAI established its single establishment in Ireland (from 15 February 2024) before the Garante's final decision was adopted (November 2024), the one-stop-shop mechanism transferred competence to the Irish DPC as lead authority, and the national proceeding had to be transferred and continued under Arts 60–61 GDPR. The court held that competence crystallises at the moment the final decision is adopted.
Sources: https://ntplusdiritto.ilsole24ore.com/art/AI88UIRD (Il Sole 24 Ore, 20 March 2026); https://www.wsgr.com/en/insights/openai-prevails-in-landmark-italian-ai-and-gdpr-enforcement-case.html
**Open point (not verified as at 2026-11-07):** whether the Garante has appealed the judgment to the **Corte di Cassazione** was not confirmed by any primary source located. Il Sole 24 Ore notes "Il Garante potrebbe impugnare la sentenza in Cassazione" (could appeal) — a statement of possibility, not of a filed appeal. No Cassazione docket entry was found.

### Corpus correction for this row

`annulment_date` should read **2026-03-18**; `deciding_body` "Tribunale di Roma (first-instance civil court), not the Garante, not TAR del Lazio, not Cassazione"; `case_reference` "sentenza n. 4153/2026, R.G. 4785/2025"; `status` "annulled — not a collected fine"; `verified` can be raised from REPORTED to **MEASURED** because the Garante's own site and the judgment text were read directly. The 15M was never collected; the interim bond was declared ineffective by the same judgment.

---

## Item 3 — Clearview AI GDPR: is ">EUR 100M cumulative" still accurate?

**Verdict: CONFIRMED as a safe upper bound, but the number is NOT a collection total, and the components have moved. It should be restated as "EUR 90.5M of EU monetary penalties imposed (EUR 95.7M including the CNIL penalty payment), plus a disputed UK penalty of GBP 7.55M under appeal — nothing collected."**

### Each authority's action, with a source that was opened

| Authority | Amount | Date | Source opened |
|---|---|---|---|
| **Garante (Italy)** | EUR 20,000,000 + order to delete data of people in Italy and a prohibition on further collection | Decision adopted **10 Feb 2022**, announced **9 Mar 2022** | EDPB news entry "Facial recognition: Italian SA fines Clearview AI EUR 20 million", 10 March 2022 — https://www.edpb.europa.eu/search_fi?search=clearview (EDPB national-case register) |
| **Hellenic DPA (Greece)** | EUR 20,000,000 | Decision **13 July 2022** | EDPB news entry "Hellenic DPA fines Clearview AI 20 million euros", 20 July 2022 — https://www.edpb.europa.eu/search_fi?search=clearview |
| **CNIL (France)** | EUR 20,000,000 + injunction to cease collection and delete data, backed by a daily coercive penalty | Decision adopted **17 Oct 2022**, announced 20 Oct 2022 | CNIL's own sanctions register: https://cnil-d10.cnil.fr/en/investigation-powers-cnil/sanctions-issued-cnil — row "10/17/2022 … FINE OF 20,000,000 EUROS AND INJUNCTION"; CNIL 2022 annual report https://www.cnil.fr/sites/default/files/2023-05/cnil_-_43e_rapport_annuel_-_2022.pdf ("20/10 … sanction de 20 millions d'euros à l'encontre de CLEARVIEW AI") |
| **CNIL penalty payment** | EUR 5,200,000 (liquidated daily penalty for continued non-compliance with the order) | **11 May 2023** | EDPB news entry "Facial recognition: the French SA imposes a penalty payment on CLEARVIEW AI", 11 May 2023 — https://www.edpb.europa.eu/search_fi?search=clearview |
| **Autoriteit Persoonsgegevens (Netherlands)** | **EUR 30,500,000** + order to stop the violations, subject to a non-compliance penalty of up to **EUR 5,100,000** | Decision **16 May 2024**, published **3 Sep 2024** | Dutch DPA's own page (opened): https://autoriteitpersoonsgegevens.nl/en/current/dutch-dpa-imposes-a-fine-on-clearview-because-of-illegal-data-collection-for-facial-recognition — "The Dutch Data Protection Authority (Dutch DPA) imposes a fine of 30.5 million euro and orders subject to a penalty for non-compliance up to more than 5 million euro on Clearview AI." Confirmed independently in EDPB Annual Report 2024 (https://www.edpb.europa.eu/system/files/documents/2025-04/edpb-annual-report-2024_en.pdf): "The Dutch DPA imposed a fine of €30.5 million and orders to end the still ongoing violations subject to a non-compliance penalty of a maximum of €5.1 million." |
| **Austrian DSB (Austria)** | No fine found in the sources opened — an order/erasure direction and an EU-representative requirement (REPORTED) | 12 May 2023 (EDPB entry) | EDPB register entry "Decision by the Austrian SA against…" dated 12 May 2023 — https://www.edpb.europa.eu/search_fi?search=clearview |
| **ICO (UK)** | **GBP 7,552,800** monetary penalty notice (stated by the ICO as "equivalent to €9 million, using the rate of exchange as at 25 April 2022") + enforcement notice to delete UK residents' data | Notice dated **18 May 2022**, announced 23 May 2022 | ICO's own Monetary Penalty Notice PDF (opened): https://ico.org.uk/media2/migrated/4020436/clearview-ai-inc-mpn-20220518.pdf |
| **AEPD (Spain)** | **No AEPD fine against Clearview AI was found.** No AEPD monetary-penalty decision against Clearview AI appears in any source opened for this item. | — | Searched EDPB national-case register (https://www.edpb.europa.eu/search_fi?search=clearview) — entries listed are France, Greece, Italy, Netherlands, Austria, plus the ICO case. AEPD does not appear. |

**Cumulative arithmetic (from the above):**

| Component | EUR |
|---|---|
| Italy (Garante) | 20,000,000 |
| Greece (HDPA) | 20,000,000 |
| France (CNIL) fine | 20,000,000 |
| France (CNIL) penalty payment | 5,200,000 |
| Netherlands (Dutch DPA) | 30,500,000 |
| **EU subtotal (monetary penalties imposed)** | **95,700,000** |
| Netherlands maximum additional non-compliance penalty (up to, conditional on non-compliance) | 5,100,000 |
| **EU maximum if the Dutch non-compliance penalty crystallises in full** | **100,800,000** |
| UK ICO (disputed, under appeal) | GBP 7,552,800 (stated by the ICO as ≈ EUR 9,000,000) |
| Austria | no fine found |

**Verdict on ">EUR 100M":** As a *lower bound on the maximum exposure* it is defensible only if you (a) count the Dutch DPA's EUR 5.1M conditional penalty in full and (b) add the UK ICO's GBP 7.55M. As a *statement of imposed penalties* it is **too high**: the EU monetary penalties actually imposed sum to **EUR 95.7M**, and the ICO's GBP 7.55M is under appeal and not final. As a *statement of collected money* it is **wrong**: no source opened reports any payment collected from Clearview AI.

### The UK element has moved since the corpus was written — this is the material change

Primary source opened: the Upper Tribunal (Administrative Appeals Chamber) judgment, **[2025] UKUT 319 (AAC)**, appeal no. UA-2024-001563-GIA, ICO v. Clearview AI Incorporated, published on the ICO's own site:
https://ico.org.uk/media2/mc5bjzsg/ua-2024-001563-gia.pdf

Verbatim from the judgment:

> "The decision of the Upper Tribunal is to allow the appeal. The decision of the First-tier Tribunal made on 17 October 2023 was materially in error of law."

> "8. The ICO decided that Clearview had infringed Articles 5, 6, 9, 14, 15 to 17, 21 and 22 of the two GDPRs, and had failed to carry out a Data Protection Impact Assessment under Article 35. The ICO imposed a monetary penalty administrative fine on Clearview of £7,552,800 (equivalent to €9 million, using the exchange rate applicable at 25 April 2022)."

> "364. The appeal against the FTT's decision that the ICO lacked jurisdiction to issue the Notices is allowed. That decision was materially in error of law and we set it aside. On a proper construction of the GDPRs the ICO had jurisdiction to issue the Notices."

Reading: the ICO **won** the jurisdictional appeal at the Upper Tribunal on **6 October 2025** ([2025] UKUT 319 (AAC)) — the FTT's 2023 jurisdictional ruling was set aside — but the **merits** (the GBP 7.55M penalty) were **remitted** and have not been decided by any court. **Clearview has permission to appeal the jurisdiction ruling to the Court of Appeal, and as at 6 September 2026 no Court of Appeal judgment had been published** (REPORTED — https://gdpr-law.eu/enforcement-cases/clearview-ai-gdpr-fines-how-mass-face-scraping-violated-gdpr-article-5/). The ICO's own FOIA response confirms the penalty was stayed pending appeal: "Payment of the penalty is stayed pending the outcome of the appeal" (https://ico.org.uk/media2/migrated/4026612/ic-237191-g0t9.pdf).

**Corpus correction for this row:** `amount` should read **"EUR 95.7M imposed (EU/EEA) + GBP 7.55M (UK, under appeal)"** rather than ">EUR 100M"; add `collected: false` / `status: "imposed, uncollected; UK element under appeal"`. Note the estate's own client-side file `client/src/data/enforcement.ts` carries the same ">€100M" string and the same "annulled (Mar 2025)" string for OpenAI, so both rows need the same correction in the client and the signed feed.

---

## Item 5 — UK ICO "~GBP 17M": what the figure actually is

**Verdict: CORRECTED. The "~GBP 17M" is a 2021 provisional *notice of intent* to fine (a view-to-fine), not an imposed fine and not a collected fine. The prior pass's suspicion is CONFIRMED.**

### What the GBP 17M was

The ICO's own Annual Report 2021-22 (opened): https://ico.org.uk/media2/migrated/4021039/ico-annual-report-2021-22.pdf

> "Discussions at the Global Privacy Assembly's International Enforcement Cooperation Group led to a joint investigation with the Office of the Australian Information Commissioner (OAIC) into Clearview AI Inc's use of images, data scraped from the internet and the use of biometrics for facial recognition.
> In **November 2021**, following this investigation, we announced our **provisional intent to impose a potential fine of just over £17 million**."

The ICO's own description of the mechanism (from an ICO document opened, which cites the release by name): "ICO issues provisional view to fine Clearview AI Inc over £17 million" — https://cy.ico.org.uk/media2/migrated/4023237/hoc-science-tech-consultation-response-20221202.pdf (footnote 11).

Secondary corroboration of the date and character: Clifford Chance, 3 December 2021 — "the UK's information regulator … announced on 29 November 2021 that it had issued a **provisional notice of intent to fine** Clearview AI just over £17 million" (https://www.cliffordchance.com/insights/resources/blogs/talking-tech/en/articles/2021/12/ico-to-fine-clearview-ai-p17-million.html).

### What the ICO actually imposed

The ICO's own Monetary Penalty Notice, dated **18 May 2022** (opened): https://ico.org.uk/media2/migrated/4020436/clearview-ai-inc-mpn-20220518.pdf

> "The amount of the penalty is £7,552,800 (equivalent to €9 million, using the rate of exchange as at 25 April 2022)."

The same PDF confirms the £17M was never imposed — it recites the ceiling, not the penalty:

> "Infringements of the following provisions shall, in accordance with paragraph 2, be subject to administrative fines up to £17,500,000, or in the case of an undertaking, up to 4 % of the total worldwide annual turnover of the preceding financial year, whichever is higher:"

(That £17.5M / 4% figure is the **UK GDPR Article 83(5) maximum** for infringements of the principles, not a penalty levied on anyone.)

### Pinned trail for the ICO row

| Step | Date | Body |
|---|---|---|
| Joint investigation opened with OAIC | July 2020 | ICO / OAIC |
| Investigation concluded; provisional **notice of intent** to fine, "just over £17 million" | **29 November 2021** (announced) | ICO (Information Commissioner Elizabeth Denham) |
| **Final monetary penalty notice imposed: GBP 7,552,800** + enforcement notice to delete UK residents' data | **18 May 2022** | ICO (Information Commissioner John Edwards) |
| FTT jurisdiction appeal | FTT decision 17 October 2023 (ICO lost on jurisdiction) | First-tier Tribunal (Information Rights) |
| ICO appeal to Upper Tribunal | Decision **6 October 2025**, [2025] UKUT 319 (AAC) — **ICO won on jurisdiction**, merits remitted | Upper Tribunal (AAC) |
| Clearview permission to appeal to Court of Appeal | reported; no Court of Appeal judgment published as at 6 September 2026 | Court of Appeal (pending) |

### Confirmation that this is not an AI-Act fine

Confirmed from the sources opened: the ICO action is a **UK GDPR / Data Protection Act 2018** action (the MPN is issued under "Article 83 of the GDPR and the UK GDPR, and s. 155 DPA 2018"), decided under the **UK GDPR**, which predates and is legally distinct from the EU AI Act. There is no AI Act involvement.

### Corpus correction for this row

The "~GBP 17M" should be replaced by **"GBP 7.55M (2022, under appeal)"**, with the GBP 17M explicitly labelled as a **2021 notice of intent / view-to-fine that was never imposed**. Two further corrections follow:
1. The ICO row and the Clearview row **overlap**: they are the same actor. The GBP 7.55M is part of the Clearview cumulative line, so counting it separately in the ICO row double-counts it against the total. The corpus should say so.
2. `status: "AI-adjacent"` is defensible on the facts (Clearview is facial-recognition AI, and the ICO's own AI-and-biometrics strategy page lists "action against Clearview AI and Serco Leisure for unlawful use of facial recognition" — https://cy.ico.org.uk/about-the-ico/our-information/our-strategies-and-plans/artificial-intelligence-and-biometrics-strategy/what-we-have-achieved-so-far-on-ai-and-biometrics/), but it must not be read as a collected fine. Nothing in the sources opened reports any payment.

---

## Item 4 — FTC: "~USD 85M … order (partly suspended)"

**Verdict: UNVERIFIED as a single action; CORRECTED as a composite.** No FTC action was found that matches the corpus row on all three of its attributes (≈USD 85M + partly suspended + FTC Act/ECOA). The row appears to splice a headline judgment figure from one 2017-18 debt-relief matter onto an ECOA regime tag that belongs to a different 2022-26 auto-dealer line. Neither component is an AI action, and the ~USD 85M figure is not money the FTC collected.

### The corpus row, verbatim

`functions/api/fines.ts:61` — `{ jurisdiction: "US", actor: "FTC", regime: "FTC Act / ECOA", amount: "~USD 85M", note: "headline order figure; partly suspended", verified: "REPORTED", status: "order (partly suspended)" }`

The client-side copy `client/src/data/enforcement.ts:27` is identical: `{ actor: "FTC (US)", jurisdiction: "US", regime: "FTC Act / ECOA", amount: "~$85M", status: "order (partly suspended)" }`.

### Candidate A — the only ~USD 85M action with a partial suspension: FTC v. Jeremy Lee Marcus et al. (Helping America Group)

Case: **FTC and State of Florida v. Jeremy Lee Marcus et al.**, No. **17-60907-CIV-Moreno** (S.D. Fla.), FTC Matter/File No. **162 3125**. Judgment document: "Case 0:17-cv-60907-FAM Document 293 Entered on FLSD Docket 09/07/2018".

**The April 2018 orders (partly suspended).** FTC press release, 12 April 2018, opened:
https://www.ftc.gov/news-events/news/press-releases/2018/04/debt-relief-scammers-settle-ftc-florida-will-submit-35-million-assets-consumer-redress

> "The proposed orders impose a **$85,326,648.45 judgment against each of the settling defendants, jointly and severally**. The order against Marcus, the scheme's alleged ringleader, **is not suspended** and requires him to surrender all of his material assets… These assets are estimated to be worth approximately **$34 million**. **The judgment against Smith and Segrea will be suspended in part** once they have surrendered all of their material assets… These assets are estimated to be worth approximately **$1 million**."

The same release: the defendants "have agreed to… **turn over assets worth approximately $35 million dollars**"; "The Commission vote approving the proposed stipulated final orders against Marcus, and Smith and Segrea, was **2-0**."

**The September 2018 default judgment against the corporate defendants.** Default Final Judgment and Order for Permanent Injunctive Relief and Monetary Judgment Against the Corporate Defendants, opened:
https://www.ftc.gov/system/files/documents/cases/162_3125_jl_marcus_-_default_final_jmt._against_corporate_defs.pdf

> "A. Judgment is entered in favor of Plaintiffs and against Corporate Defendants, **jointly and severally**, as equitable monetary relief, in the amount of **eighty-five million, six hundred sixty-three thousand, five hundred fifty-six dollars, and sixty-one cents ($85,663,556.61)**, with post-judgment interest at the legal rate.
> B. The monetary judgment set forth in this Section VII shall be reduced by any amounts paid to the Plaintiffs pursuant to judgments in this action relating to other Defendants or Relief Defendants.
> C. In partial satisfaction of the judgment against Corporate Defendants, any financial or brokerage institution, escrow agent… that holds, controls, or maintains accounts or assets… shall turn over such account or asset to the FTC or its designated agent…"

**Statutes charged — and ECOA is NOT among them.** From the same judgment:

> "…violating Section 5(a) of the FTC Act, the **TSR** [16 C.F.R. Part 310], and the **Florida Deceptive and Unfair Trade Practices Act**…"
> "…have violated Section 310.3(a)(2)(x) of the TSR, 16 C.F.R. § 310.3(a)(2)(x)"
> "…have violated Section 310.4(a)(5)(i) of the TSR, 16 C.F.R. § 310.4(a)(5)(i)…"

The FTC's complaint in the same matter states the action is brought "under Section 13(b) of the Federal Trade Commission Act… and the Telemarketing and Consumer Fraud and Abuse Prevention Act ('Telemarketing Act')" (https://search.ftc.gov/system/files/documents/cases/1623125helpingamericacomplaint.pdf). **No ECOA count.**

**What was actually collected — redress, not a penalty.** FTC's own refund-programme page (opened): https://www.ftc.gov/enforcement/refunds/helping-america-group-refunds

> "August 2026 … The FTC is sending another round of payments to people who lost money to a debt relief scam… The FTC **first sent payments for this matter in July 2020 and the second round of payments in December 2021, which resulted in more than $20 million in refunds**. Because the agency recovered additional funds from the defendants, the FTC is sending **9,522 payments totaling more than $463,000**…"

**Assessment of Candidate A:** it matches "~USD 85M" and "partly suspended" and "headline order figure" exactly, and the "~$35M" that was actually recovered and paid back to consumers is the tell. But it fails the corpus's `regime: "FTC Act / ECOA"` on ECOA, and it is a **2017-18 debt-relief/telemarketing** case with no AI nexus.

### Candidate B — FTC actions that genuinely carry AI adjacency *and* a partly-suspended figure

If the corpus row was intended to be an AI-adjacent FTC action, these are the primary-sourced matches (none is ~USD 85M):

| Action | Date | Judgment | Suspended? | Statutes | Primary source opened |
|---|---|---|---|---|---|
| **FTC v. Air AI Technologies et al.**, No. 2:25-cv-03068-SMB (D. Ariz.), FTC Matter "Airai" | 24 Mar 2026 | **USD 18,000,000** (joint and several) + **USD 50,000** payable | **Yes — "MONETARY JUDGMENT AND PARTIAL SUSPENSION"** (Sec. IV): "Upon such payment, the remainder of the judgment is suspended" | FTC Act §5(a); TSR; Business Opportunity Rule | Order: https://www.ftc.gov/system/files/ftc_gov/pdf/AirAi-Order_1.pdf ("Document 43-1, Filed 03/24/26"); press release: https://www.ftc.gov/news-events/news/press-releases/2026/03/air-ai-its-owners-will-be-banned-marketing-business-opportunities-settle-ftc-charges-company-misled — "a monetary judgment of $18 million, which will be **largely suspended** based on the company's and operators' inability to pay the full amount"; Commission vote **2-0**; case page tags it "Artificial Intelligence" |
| **FTC v. F9 Advertising LLC et al.**, No. 3:19-cv-01174-DRD (D.P.R.) | announced 11 Oct 2023 (order filed 10/10/23) | **USD 34,081,073.00** | **Yes** — "III. MONETARY JUDGMENT, SURRENDER OF ASSETS AND PARTIAL SUSPENSION"; "all but **$169,903.20** of the remaining balance shall be suspended" | FTC Act §19; ROSCA §4 | https://www.ftc.gov/system/files/ftc_gov/pdf/f9_advertising_proposed_settlement_order.pdf ; case page: https://www.ftc.gov/legal-library/browse/cases-proceedings/1723164-x190015-f9-advertising-llc |
| **FTC v. Click Profit, LLC et al.**, No. 1:25-cv-20973 (S.D. Fla.) | announced 25 Aug 2025 (order entered 26 Aug 2025) | **USD 13.6M** (Emslie, McGeoghean, Holton + entities) **+ USD 7.3M** (Masri + entities) | **Yes** — "The judgments have been **partially suspended** based on the defendants' inability to pay the full amount"; section headed "Monetary Judgment and Partial Suspension" | FTC Act §5(a); Business Opportunity Rule; CRFA; Impersonation Rule | Press release: https://www.ftc.gov/news-events/news/press-releases/2025/08/ftc-case-against-e-commerce-business-opportunity-scheme-its-operators-results-permanent-ban-industry ; order: https://www.ftc.gov/system/files/ftc_gov/pdf/ClickProfit-StipulatedFinalOrder-Emslie-et-al.pdf ; Commission vote **3-0**. AI-adjacent on the facts: defendants "falsely claimed to use advanced artificial intelligence" |

### Candidate C — the genuine ECOA actions, and what happened to them on 7 August 2026

The corpus's "ECOA" tag maps to the FTC's auto-dealer fair-lending line. The amounts there are **USD 15.93M in total**, not USD 85M:

| Action | Amount | Statutes | Primary source opened |
|---|---|---|---|
| **FTC et al. v. North American Automotive Services, Inc. (Napleton) et al.**, No. 1:22-cv-01690 (N.D. Ill.), filed 31 Mar 2022 | **USD 9,950,000 — paid** | FTC Act §§13(b),19; TILA + Reg Z; **ECOA**; Illinois Consumer Fraud Act; Illinois Motor Vehicle Advertising Regulations | https://www.ftc.gov/system/files/ftc_gov/pdf/napleton-modifiedorder.pdf |
| **FTC v. Passport Automotive Group, Inc.**, FTC Matter 2023199 | **USD 3,380,000 — paid** | FTC Act §5(a); **ECOA** + Reg B | https://www.ftc.gov/system/files/ftc_gov/pdf/passportauto-modifiedorder.pdf |
| **FTC and State of Arizona v. Coulter Motor Company, LLC and Gregory DePaola**, FTC Matter 222 3033 (D. Ariz.), 15 Aug 2024 | **USD 2,600,000** (of which USD 2,350,000 for refunds) | FTC Act; **ECOA**; Arizona Consumer Fraud Act | https://www.ftc.gov/news-events/news/press-releases/2024/08/ftc-state-arizona-take-action-against-coulter-motor-company-deceptive-pricing-discriminatory ; case page: https://search.ftc.gov/legal-library/browse/cases-proceedings/222-3033-coulter-motor-company-gregory-depaola-ftc-state-arizona-v |

**The 7 August 2026 policy statement and the three modified settlements.** FTC press release, opened:
https://www.ftc.gov/news-events/news/press-releases/2026/08/ftc-ditches-disparate-impact

> "The Federal Trade Commission today announced a policy statement clarifying that the Commission will not pursue claims based on disparate-impact or 'unfair discrimination' theories. 'Disparate-impact claims are nearly impossible to square with our colorblind Constitution,' said Chairman Andrew N. Ferguson…"
> "…it will **continue to assert disparate-treatment claims under the Equal Credit and Opportunity Act**, but it will treat Section 5 of the FTC Act as the consumer-protection statute it has always been. Under the new policy, the Commission reviewed past decisions that were based on statistical analyses designed to show disparate-impact liability and **entered into agreements to modify certain compliance-related obligations for Napleton Inc., Passport Auto Group and an individual previously associated with Coulter Motor Company LLC**. The Commission vote authorizing the policy statement and approving the agreements was **2-0**."

Policy statement itself (opened): https://www.ftc.gov/system/files/ftc_gov/pdf/disparate%20Impact-policy-statement.pdf

> "The FTC has previously pursued disparate-impact claims in two contexts: under Section 5 of the FTC Act (where they have been styled as 'unfair discrimination' claims), and under the Equal Credit Opportunity Act ('ECOA'). In both instances, **the FTC acted ultra vires**… Accordingly… **the FTC will no longer pursue disparate-impact claims in any context**."

**Which part was suspended or modified, and by whom:**

| Matter | What was suspended / modified | Instrument | Who |
|---|---|---|---|
| Helping America Group (Smith, Segrea) | Judgment suspended **in part** on surrender of assets (~$1M) | Stipulated orders | **S.D. Fla.**, on the FTC's proposal (vote 2-0) |
| Helping America Group (Marcus) | **Not** suspended; full assets surrendered (~$34M) | Stipulated order | S.D. Fla. |
| Helping America Group (corporate defendants) | No suspension; **USD 85,663,556.61** judgment, reduced by amounts paid, plus asset turnover | Default final judgment, Doc. 293 (7 Sep 2018) | S.D. Fla. |
| Air AI | Judgment suspended **in full except USD 50,000** | Stipulated order, Sec. IV "Partial Suspension" | D. Ariz. |
| F9 Advertising | Suspended except USD 169,903.20 | Stipulated order, Sec. III | D.P.R. |
| Click Profit | Judgments **partially** suspended | Stipulated order, "Monetary Judgment and Partial Suspension" | S.D. Fla. |
| Napleton | **ECOA / Reg B disparate-impact injunctive relief (Final Order §§VI–VII) no longer monitored, investigated or enforced**; the USD 9,950,000 already paid is undisturbed and not contestable | "Agreement Regarding Final Order", **Effective Date 26 November 2025** | **The FTC** |
| Passport Automotive | **FTC Act §5 (Count III) and ECOA/Reg B (Count IV) disparate-impact injunctive relief no longer enforced**; the USD 3,380,000 already paid stands | "Agreement Regarding Final Order", **Effective Date 26 November 2025** | **The FTC** |

Verbatim from the Napleton modified order: "the FTC has determined that continued enforcement of Section VI and Section VII is inconsistent with Section 5 of the FTC Act, ECOA, Regulation B, the Executive Order, and the public interest"; and "The FTC shall no longer monitor, investigate, or attempt to enforce Defendants' compliance with Section VI and Section VII…"; and "Defendants shall not challenge, contest, or otherwise seek relief from the monetary judgment ($9,950,000) paid to the FTC pursuant to Section VIII.A of the Final Order." The Passport order is parallel ("…$3,380,000) paid to the FTC pursuant to Section V.B of the Final Order").

**Context — the FTC's "suspended judgment" is a recurring mechanic, not a one-off.** The FTC's *Protecting Older Consumers 2025-2026* report (opened: https://www.ftc.gov/system/files/documents/reports/protecting-older-consumers-2025-2026-report-federal-trade-commission/2026-older-adults-report-10192026.pdf) records two current examples: a "**suspended judgment of $77.7 million** reflecting the total amount taken from consumers" in a debt-relief/tax-debt scheme, and a "**$74.5 million suspended judgment**" in *Nuvei*. A large headline number with most of it suspended is therefore normal FTC practice, and it must never be recorded as a collected fine.

### What was searched, and what was not found

Searched and opened: the FTC's 2017-18 and 2025-26 *Protecting Older Consumers* reports; the FTC case pages for F9, Air AI, Click Profit, Progress Residential, Passport, Napleton, Coulter; the FTC's press-release and policy-statement archives for 2026; and web search on "FTC ~$85 million suspended judgment", "FTC ECOA enforcement 2026", "FTC AI fine 2026", "FTC August 7 2026 disparate impact".

**Not found:** any FTC action combining (a) an ≈USD 85M figure, (b) the FTC Act **and ECOA**, and (c) a partly-suspended order. Also not found: any FTC action against an AI model provider resembling an AI Act fine. The FTC has no EU-AI-Act-style fining power, so no FTC row can ever be an AI Act fine.

### Corpus correction for this row

The row as written is not verifiable. Two defensible rewrites:

1. **If the row is meant to be the 2018 headline judgment:** `{ actor: "FTC / Helping America Group", jurisdiction: "US", regime: "FTC Act + TSR + Florida FDUTPA", amount: "USD 85.66M judgment (partly suspended)", note: "2017-18 debt-relief scheme, FTC + Florida AG; ~USD 35M of assets collected and paid to consumers as redress; not AI; not a penalty paid to Treasury", verified: "MEASURED", status: "imposed, largely uncollected; redress distributed" }` — and drop ECOA.
2. **If the row is meant to be the current AI-adjacent FTC exposure:** `{ actor: "FTC / Air AI", jurisdiction: "US", regime: "FTC Act + TSR + Business Opportunity Rule", amount: "USD 18M judgment (largely suspended); USD 50,000 paid", note: "AI business-opportunity earnings claims; 24 Mar 2026; D. Ariz.; not an AI Act fine", verified: "MEASURED", status: "imposed, largely suspended" }`.

Either way: **remove "ECOA"**, and if the ECOA auto-dealer line is wanted, add it as its own row (USD 9.95M + USD 3.38M + USD 2.6M = **USD 15.93M, all paid**) noting that its ECOA disparate-impact injunctive relief was vacated by the FTC on 7 Aug 2026 and 26 Nov 2025.


---

## Item 6 — the deadlines calendar: four of five rows are misdescribed, and one is a date nobody published

Corpus rows, verbatim, from `functions/api/fines.ts` (`deadlines_calendar`):

| event | date | note |
|---|---|---|
| Texas AI systems registration portal | 2026-09-01 | state AI disclosure |
| DRCF (UK) AI disclosure | 2026-09-02 | Digital Regulation Cooperation Forum |
| EU AI Act Art 50(2) transparency grace ends | 2026-12-02 | GPAI transparency marking |
| Korea AI Act grace period ends | 2027-01-22 | Korea AI Basic Act |
| Illinois AI audits (265 ILCS) | 2028-01-01 | state AI audit |

### 6a. EU AI Act Art 50(2) — the date is right, and it now has a primary source

The corpus's `2026-12-02` survives, and it is now pinned rather than inherited. The **Digital Omnibus on AI — Regulation (EU) 2026/1744 of 8 July 2026**, in force **27 July 2026**, amended Article 111 and inserted a new paragraph 4:

> "4. Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, that have been placed on the market before 2 August 2026 shall take the necessary steps in order to comply with Article 50(2) by 2 December 2026."

Source: https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng (amendment (40) to Article 113 and (39) to Article 111); the inserted text is also visible in the structured amendment record at https://huggingface.co/datasets/safelegalaidata/eu-ai-act-structured/blob/main/data/amendments.jsonl (article 111, `amending_act_celex` 32026R1744, `in_force` 2026-07-27).

**Correction to the note, not the date.** "transparency grace ends" reads as a general grace period. It is not: the deadline is scoped to **systems placed on the market before 2 August 2026**, and the obligation is Article 50(2) compliance. Suggested note: "Art 111(4) as inserted by Reg (EU) 2026/1744: systems placed on the market before 2 Aug 2026 must comply with Art 50(2) by 2 Dec 2026".

### 6b. The Omnibus did NOT move Article 101 — Item 1's enforcement-powers date stands

This was the open risk when the Omnibus was found, so it is recorded explicitly. Consolidated Article 113 (as at 27 July 2026, per the Commission's own AI Act Service Desk, https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-113) now reads:

> "This Regulation shall enter into force on the twentieth day following that of its publication in the Official Journal of the European Union. **It shall apply from 2 August 2026.** However: (a) Chapters I and II shall apply from 2 February 2025, with the exception of Article 5(1), first subparagraph, points (ba) and (bb), and Article 5(1a) and (1b) which shall apply from 2 December 2026; (b) Chapter III Section 4, Chapter V, Chapter VII and Chapter XII and Article 78 shall apply from 2 August 2025, **with the exception of Article 101**; … (d) Articles 102 to 110 shall apply from 27 July 2026."

Article 101 is expressly carved out of the 2 August 2025 batch, and the general date of application remains 2 August 2026. **The estate's `enforcement_powers_live_since: 2026-08-02` is unaffected by the Omnibus.** What the Omnibus did change is the high-risk Chapter III dates (Annex III high-risk now 2 December 2027, Annex I high-risk 2 August 2028) and it moved Art 5(1)(ba)/(bb) and 5(1a)/(1b) to 2 December 2026 — none of which touches Art 101.

### 6c. Texas — the date is right, the description is wrong

From the Texas Legislature's own bill analysis (https://capitol.texas.gov/tlodocs/89R/analysis/html/HB00149S.htm), TRAIGA = HB 149, 89th Legislature:

> "SECTION 8. Requires the attorney general, **not later than September 1, 2026**, to post on the attorney general's Internet website the information and **online mechanism** required by Section 552.102, Business & Commerce Code, as added by this Act."
> "SECTION 9. **Effective date: January 1, 2026.**"

The corpus calls 2026-09-01 an "**AI systems registration portal**". It is not. It is the **attorney general's complaint portal** — the online mechanism for reporting violations under §552.102. **TRAIGA creates no registration requirement for AI systems.** The corpus therefore tells a reader that a registration duty exists where the statute provides a complaints channel. That is a false statement about a legal obligation, and it is the most consequential kind of error in this corpus.

The Attorney General's own site confirms the shape (https://www.texasattorneygeneral.gov/): "Starting January 1, 2026, the Texas Responsible Artificial Intelligence Governance Act (TRAIGA) sets rules to help protect Texans from harmful or misleading uses of AI."

Suggested row: `{ event: "Texas AG AI complaints portal goes live (TRAIGA §552.102)", date: "2026-09-01", note: "attorney general's online reporting mechanism — NOT an AI systems registration; TRAIGA effective 1 Jan 2026" }`.

### 6d. DRCF (UK) — the date is right, the description is wrong

2026-09-02 is confirmed as the DRCF's **Phase 2 call-for-input closing date**, under the DRCF's "Consumer interest and AI" project:

> "**Tools for managing AI risks** — The DRCF is seeking insight into consumers' approaches to the risks of generative and agentic AI adoption… The deadline for responses is **2 September 2026**." (https://www.osborneclarke.com/insights/regulatory-outlook-june-2026-artificial-intelligence)

Phase 1 closed 3 July 2026. The DRCF is the CMA, FCA, ICO and Ofcom (https://www.legal500.com/intelligence/global/finance-and-banking/fintech-global-fs-regulatory-round-up-we-3-july-2026).

This is a **regulator's consultation**, not an "AI disclosure" obligation, and it has already closed. The corpus's label implies a compliance duty that does not exist. Suggested row: `{ event: "DRCF (UK) 'Consumer interest and AI' phase 2 call for input closes", date: "2026-09-02", note: "CMA/FCA/ICO/Ofcom consultation on tools for managing AI risks — a consultation, not a disclosure obligation" }`.

### 6e. Korea — 2027-01-22 is a date MSIT never published, and the obligation already applied

From the Ministry of Science and ICT's own announcement (https://www.msit.go.kr/eng/bbs/view.do?bbsSeqNo=42&nttSeqNo=1191):

> "A **grace period of at least one year** will be implemented before imposing administrative fines, providing companies with sufficient preparation time… **Efforts are currently underway to gather opinions to finalize the detailed operation plan and duration of this grace period.**"

And: the AI Basic Act (Act No. 20676) and its Enforcement Decree (Presidential Decree No. 36053) **took effect 22 January 2026**; the grace period **defers fact-finding investigations and administrative fines**, not the obligations (https://www.loc.gov/item/global-legal-monitor/2026-02-20/south-korea-comprehensive-ai-legal-framework-takes-effect/; https://www.trade.gov/market-intelligence/south-korea-ai-basic-act).

Two errors in one row. First, the grace period is **ministry policy, not a statutory date** — the statute fixes no end date. Second, MSIT explicitly left the **duration unfinalised**, so "at least one year" is a floor with no published end. `2027-01-22` is the estate's own arithmetic (one year after the commencement date) presented as a deadline the ministry never set. And the row implies compliance is pending until then, when the obligations applied from 22 January 2026.

Suggested row: `{ event: "Korea AI Basic Act: MSIT grace period on administrative fines", date: "2026-01-22", note: "obligations applied 22 Jan 2026; MSIT policy defers fact-finding and fines for at least one year — duration not published, no statutory end date" }`.

### 6f. Illinois — wrong citation, wrong subject, wrong date, wrong by eight years

Three separate errors in one row.

**The citation.** The Illinois General Assembly's own ILCS database, Chapter EMPLOYMENT (https://witnessslips.ilga.gov/Legislation/ILCS/Acts?ChapterID=68&Chapter=EMPLOYMENT&MajorTopic=BUSINESS%20AND%20EMPLOYMENT) lists:

> "**820 ILCS 42/ Artificial Intelligence Video Interview Act.**"
> "820 ILCS 185/ Employee Classification Act."

So the correct citation is **820 ILCS 42**. The corpus's "265 ILCS" is a different chapter entirely. (A prior draft of this research held the citation to be 430 ILCS 185 — that is the **Employee Classification Act**, and it is wrong; the ILCS database above is the authority. The `430`/`265` confusion is worth naming because it is exactly the kind of error a plausible-looking citation invites.)

**The subject.** The Act is the **Artificial Intelligence Video Interview Act** — Public Act 101-0260 (https://ilga.gov/ftp/Public%20Acts/101/101-0260.htm):

> "Section 1. Short title. This Act may be cited as the **Artificial Intelligence Video Interview Act**."
> "Section 5. Disclosure of the use of artificial intelligence analysis. An employer that asks applicants to record video interviews and uses an artificial intelligence analysis of the applicant-submitted videos shall do all of the following … (1) Notify each applicant before the interview that artificial intelligence may be used … (2) Provide each applicant with information before the interview explaining how the artificial intelligence works … (3) Obtain, before the interview, consent from the applicant to be evaluated by the artificial intelligence program …"
> "Section 10. Sharing videos limited. …"
> "Section 15. Destruction of videos. Upon request from the applicant, employers, within 30 days after receipt of the request, must delete an applicant's interviews …"

It is an **employment disclosure, consent and data-deletion** regime for AI-analysed video interviews. It is **not an audit regime**. The corpus's "Illinois AI audits" / note "state AI audit" names a legal instrument that does not exist.

**The date.** The Act went into effect **1 January 2020**, not 2028-01-01 — it was signed 8 August 2019 and "Beginning Jan. 1, 2020, the Artificial Intelligence Video Interview Act will impose transparency, consent, and data destruction duties" (https://news.bloomberglaw.com/class-action/law-on-hiring-robots-could-trigger-litigation-for-employers). The corpus lists a deadline **eight years in the future for a duty that has been in force for six**.

Suggested row: `{ event: "Illinois AI Video Interview Act (820 ILCS 42) in force", date: "2020-01-01", note: "employment notice, explanation and consent for AI-analysed video interviews; sharing limited; destruction on request within 30 days — NOT an audit duty" }`.

### 6g. Summary of the corrections to `deadlines_calendar`

| row | date | what changes |
|---|---|---|
| Texas | 2026-09-01 | date holds; **"registration portal" → attorney general's complaints portal** under TRAIGA §552.102 |
| DRCF (UK) | 2026-09-02 | date holds; **"AI disclosure" → a consultation response deadline** (Phase 2, "Tools for managing AI risks") |
| EU AI Act Art 50(2) | 2026-12-02 | date holds; now **pinned to Art 111(4)** as inserted by Reg (EU) 2026/1744, scoped to systems placed on the market before 2 Aug 2026 |
| Korea | 2027-01-22 → 2026-01-22 | **date replaced**: no statutory end date exists; MSIT's policy floor is "at least one year" with duration unpublished; obligations applied 22 Jan 2026 |
| Illinois | 2028-01-01 → 2020-01-01 | **date, citation and subject all wrong**: 820 ILCS 42, the AI Video Interview Act, in force since 1 Jan 2020 — not an audit duty |

Four of five rows change. Two of them (Texas, DRCF) keep the date and change the meaning; two (Korea, Illinois) change the date. Every one of these is a published statement about a legal obligation, so each correction is a correction to a claim a reader could have relied on.

**Not done here.** This file is the research record. It does not itself change the corpus. The corpus change belongs in `functions/api/fines.ts` with a new `as_of`, and the corpus's own `reviewed_against` field must then be updated from "public secondary sources; no row re-verified against a primary regulator filing on this date" to state that these rows **were** re-verified against primary regulator filings on 2026-11-07. Leaving that field as-is after a primary-source refresh would be a false statement about the corpus's own provenance.
