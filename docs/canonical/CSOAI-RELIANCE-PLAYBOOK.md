<!-- Canonical plan. Source: csoai_reliance_playbook.md v1.0 (20 Nov 2026). Committed 21 Nov 2026 in the backlog triage approved by the owner. -->
<!-- v1.1: amended 24 Nov 2026 on the owner's instruction; see section 12. -->
> **Canonical plan.** This file supersedes the earlier plan documents listed in [`docs/plans/INDEX.md`](../plans/INDEX.md). Companion specifications: [`RAS-SPEC.md`](RAS-SPEC.md), [`AXIS-REPORT-CONTRACT.md`](AXIS-REPORT-CONTRACT.md), [`axis-report.schema.json`](axis-report.schema.json).
>
> Repo copy notes: links to private working files are shown as plain filenames (those files are not in this repo). Edits made for public copy only: (1) a named credit-rating agency is replaced by a generic term in §1 and §5.5 (owner rule on public naming); (2) one excluded-organisation mention is removed from §3 (owner rule); (3) host file-permission findings are removed from §10 item 10. Figures are as read on 20 Nov 2026 and are not refreshed here.

# CSOAI reliance playbook: from measurement publisher to relied-upon evidence institution
**Version 1.1 · 24 November 2026 (v1.0: 20 November 2026) · CSOAI Ltd (UK 16939677) · for owner review**

*Version 1.1 adds twelve amendments, listed in §12, on the owner's instruction of 24 Nov 2026. Amended passages are marked "v1.1". Figures in them were read on 24 Nov 2026; all other figures remain as read on 20 Nov.*

This document is meant to become the **single canonical plan**. The consolidation track found more than 20 earlier plans that were never finished (Aug–Nov 2026; `prior_work_consolidation.md`). Adopting this one should retire the others. Every number below was read live on 20 Nov 2026 or comes from a linked artifact. Provisional items are marked.

---
## 0. One page

**The goal:** make independent verification, institutional participation and paid acceptance *repeatable*, so that other organisations rely on CSOAI's evidence.

**Position (v1.1):** CSOAI publishes signed, outside-in measurement records and keeps claims current. Certifiers, auditors, insurers and hosts consume them. CSOAI certifies nothing, and the measured party never pays for its result.

| | The measured party pays | A relying party or a funder pays |
|---|---|---|
| **A verdict or certificate is issued** | Vendor-paid certificates and insurance-linked audits | Subscriber-paid ratings; funder-paid indices of lab practice |
| **A measurement record is issued** | Evaluations paid for by the organisations evaluated | Enterprise-paid or grant-funded independent measurement: **CSOAI's cell** |

The grid is drawn from public pages read on 24 Nov 2026 (field study, a private working file). A page shows what an organisation says, not what it does.

**Where you stand (20 Nov, live):**

- **Revenue:** $0.06 settled all-time; 4 distinct outside payers, 1 repeat; 22 of your own test settlements.
- **Doors:** 32 x402 doors are live, and 3 of them have ever had an outside payer.
- **GSPC:** all 34 axes are labelled MEASURED, but 0 of 14 model-comparison axes separate a leader. Those axes are a median 100 days old, and 11 axes carry `legacy` method status.
- **Root of trust:** still **simulated**. OTS has been PENDING since 5 Sep and the Rekor entry was never logged.
- **Review capacity:** 137 open PRs on councilof-ai and 1,054 account-wide. The binding constraint is review throughput.
- **Real credibility assets:**
  - Correctover's independent reproduction (18/18, 14 Oct)
  - the CMA-published response (8 Oct)
  - the SEC File 4-927 comment (18 Sep)
  - 417 frozen provision hashes that reproduce exactly from EU CELLAR
  - signed cards that verify under did:web:csoai.org

**The five moves that change the equation:**

1. **Finish what's open before starting anything new.** Run the PR triage (about 41 closures and 9 one-review merges), and declare this playbook canonical.
2. **Make the root real.** Hold a witnessed ceremony with three independent custodians, then re-anchor (OTS and Rekor) and reconcile #4056.
3. **Productise RAS around the one live predicate.** Art 50 marking evidence goes to EU-facing deployers; the transparency grace period for systems already on the market ends 2 Dec 2026.
4. **Take the free institutional doors now:**
   - the NIST Consortium webform resubmission
   - the OCC/FDIC/Fed/NCUA third-party-risk comment (due 16 Dec), which would be your first FDIC-addressed filing
   - the OECD.AI Catalogue entry (already pre-filled)
   - the AI Verify sandbox and accredited-tester track
   - BSI ART/1 and the prEN 18283 enquiry
   - BridgeAI, only if a UK deployer partner signs by 1 Dec
5. **Turn GSPC into 34 honest per-axis reports**, and define DORADO as an *evidence index paid for by relying parties* (a grade per axis plus coverage and confidence; v1.1: v1.0 said "subscriber-paid", see §5.5 and §10 item 13). Never sum over UNMEASURED or STALE axes.

---
## 1. Answers to the owner's questions

| Question | Answer (evidence) |
|---|---|
| "We are getting millions of downloads" | HF csoai has 506,556 dataset downloads but only **16 likes**, and 0 likes across 34 Spaces. 11 of the 24 datasets above 5k downloads are read by CSOAI's own Spaces. Treat downloads as distribution, not adoption. The metrics that matter are outside reproductions, outside paid repeats and institutional acceptances. |
| Root ceremony vs human in the loop | The ceremony **is** the human root of HITL. Every later human approval or fix is a threshold signature that chains back to keys born in a witnessed ceremony. The kit is complete; the only run used simulated dice and throwaway keys. See §5.6. |
| "We did SEC and FDIC as well as NIST?" | **SEC: yes.** File 4-927, published 18 Sep 2026. **NIST: partial.** Three comments were recorded as sent 16–21 Sep, but delivery is unconfirmed because of msmtp 535 failures. The Consortium LOI was emailed 27 Sep, and NIST asked on 5 Oct for a **webform resubmission that is still outstanding**. **FDIC: none found.** The repo's own filing headers still say "DRAFT — not submitted" and need correcting. `openings_brief.md` |
| What are DORADO / DORADO STOP / EBOLA? | **DORADO** is your measurement-card engine codename: the cibola README reads "a measurement body (never a certifier)", and CIBOLA is the public protocol name. `/api/dorado` now redirects to `/api/east-west-bench`. **DORADO stops** are the absolute refusal hard-stops in `sov33_dorado.py` (CBRN, kinetic targeting, surveillance), applied before care-scoring. **EBOLA** appears only as a bioweapon refusal-test item inside those stops (M4 content search incomplete, so provisional). `estate_intel.md` |
| "22 product revenue loops" | No registry lists 22. The 22s in the bytes are your 22 self-settlements and 22 Stripe test products from April 2026. What is live is **32 x402 doors** (5 families), consolidated here into **7 reliance loops** (§6). |
| Data moat East + West: "they'll never catch up" | Volume is not a moat; anyone can scrape public data. What compounds is **signed, time-anchored, third-party-reproduced measurements plus buyer-reliance records**. Neither can be back-filled. Use **business, regulatory and GSPC data only, not personal data**. Run one CSOAI method on Western and Chinese open-weight models, and cite Eastern results (OpenCompass, CAICT) as comparators without ingesting them. Keep NC- and ODbL-licensed sources (C-Eval, CMMLU, OpenCorporates) out of paid products. `eval_economics.md` `source_rights_register.csv` |
| "DORADO as the world's AI rating agency" | No AI equivalent of an SEC-recognised rating agency (NRSRO) exists. Credit-rating-agency reliance came from regulatory recognition plus decades of track record. Your own 21 Aug issuer-pays memo already rejected issuer-pays. The recognised path is staged (§7): UKAS ISO/IEC 17025 for 1–3 methods, AI Verify AI TAP, evidence supplier to Illinois SB 315 auditors (2028), and an EU notified body only via an EU entity. Do not use rating-agency brand comparisons in public copy. |
| Palantir, Cisco, Red Hat, CrowdStrike, NVIDIA, LFX tools | **Open (Apache-2.0):** garak, NeMo Guardrails/Evaluator, OpenShell and NemoClaw; Cisco MCP and A2A scanners and Foundation-sec-8B; TrustyAI; llm-d; sigstore model-signing. **Archived:** InstructLab, so drop it. **Commercial-only:** Palantir (palantir-mcp is a wrapper over a private package) and CrowdStrike (falcon-mcp in maintenance mode). A2A now sits in the LF Agentic AI Foundation, whose working groups (governance-risk, identity-trust, observability) are relevant venues. `open_tooling_register.csv` |
| Can we produce reports without GSPC services? | **Yes.** A report built only from Inspect `.eval` logs plus the manifest, with the network disabled, gave 5/5 VALID, and a one-byte tamper gave INVALID. Gap: Inspect logs don't record the HF dataset revision, so pin it in task metadata. `inspect_evidence_report.md` |
| All 34 axes through Inspect? | No, and that is the right answer. **20 of 34 axes are site- or subject-measured**, so they belong to GSPC/Layer 0 and not to a model eval. Of the 14 model-comparison axes: 2 strong matches, 4 partial, 5 weak, 3 GSPC-native. `axis_eval_map.csv` |
| Light Society | It is an academic 1B-agent simulation preprint (arXiv 2506.12078), not a body to bind to. The useful lesson is cheap surrogate agents with expensive cognition only where needed. AgentSociety (Apache-2.0) is the reusable framework for one bounded SovSpace experiment. |

---
## 2. What already exists (do not rebuild)
From `prior_work_register.csv` (1,001 rows) and `prior_work_consolidation.md`:

- **Inspect bridge:** `harness/bench/inspect_task.py`, `council-os/inspect_sigil_bridge.py` (Inspect → signed card/SCITT, 15 Aug), `inspect-adoption-gate.yml`. Today's draft PR #4556 should be **folded into the existing HF workflows** rather than merged as a 21st push workflow.
- **20 HF/Kaggle publishing workflows**: extend `hf-evidence-sync` and `hf-frontdoors`.
- **RAS doors:** `/api/request-attestation` plus 3 `/api/ras/*` doors are live at $0.02 with 0 payers, and there are RaaS procedures.
- **Layer 0:** the ceremony kit, runbooks and key-governance docs are complete; only the witnessed ceremony is missing.
- **Openings radar:** the N-01…N-30 audit, the deadline radar, the funding calendar and the outward ledger (14 Sep).
- **Do not reuse** the legacy sovos-harness pitch decks or the "Certification Authority" charter. They contain unverified figures that conflict with Companies House.

---
## 3. Institutional pathways (separate US, UK, EU and international tracks)
Full register: `openings_register.csv` (61 rows; 38 confirmed on primary pages). Ranked brief: `openings_brief.md`.

| When | Opening | Channel | Gate |
|---|---|---|---|
| **20 Nov (today)** | ICO agentic-AI call for evidence | ICO Citizen Space | Owner submits (draft in preparation) |
| 24 Nov | BSI prEN 18283 (bias, Art 10) enquiry *(provisional date)* | BSI SDP | Free account |
| 25 Nov | ISO/IEC DIS 23282 | BSI SDP | Free account |
| 30 Nov | NIST SP 800-82r4 (OT security) | email | None |
| 1 Dec | **BridgeAI go/no-go** | partner sign-up | UK medium/large deployer |
| 7 Dec | SEC S7-2026-35 crypto custody | SEC form | None |
| 8 Dec 11:00 | Innovate UK BridgeAI comp 2597 (£100k–£200k) | IFS | Partner + TRL 5–6 |
| 16 Dec | **OCC/Fed/FDIC/NCUA third-party-risk guidance** | regulations.gov | None (first FDIC filing) |
| 18 Dec | NIST SP 2400-102e2026 (agentic adversarial-ML taxonomy) | email | None |
| ~17 Dec / 31 Dec | Sovereign AI R&D Procurement Batch 2 EOI (dates conflict) | sovereignai.gov.uk | Supplier EOI |
| 15 Jan 2027 | EU AI Office fundamental-rights impact assessment (FRIA) template feedback | EC survey | None |
| 14/22 Jan 2027 | ICML 2027 (Datasets, Evaluations & Benchmarks track), which also yields the arXiv URL the Inspect registry needs | OpenReview | Paper |
| Rolling | **NIST AI Consortium webform** (91 FR 32007), OECD.AI Catalogue, AI Verify sandbox/AI TAP, MLCommons AIRR WG, CoSAI (CLA), SEC Petition 4-882, BSI ART/1, AAIF working groups | various | Owner-only steps (CAPTCHA, signatory) |

Decline: paid tiers (AAIF Gold at about $220k, CoSAI sponsorship), because free routes exist. Also decline the Anthropic model-safety bounty, whose non-disclosure terms conflict with publishing everything.

---
## 5. Operating design

### 5.1 Principle
Use Inspect, garak and other established runners to **execute** evaluations. Use GSPC and Layer 0 to **preserve, measure, classify and verify** the resulting evidence. Use humans to **authorise**. CSOAI's differentiation is the evidence lifecycle: provenance, authority-to-effect, claim maintenance and corrections. It is not the harness.

### 5.2 RAS: Request Attestation Service (human in the loop)
RAS is the product spine, and it replaces "more doors". `/api/request-attestation` (door D06) and the three `/api/ras/*` doors already exist as x402 doors. RAS formalises them into one flow.

| Step | What happens | Who or what | Evidence produced |
|---|---|---|---|
| 1 Request | Requester names the subject (model, agent, MCP server, site, provision set) and the axes or provisions | Requester (lab, deployer, insurer, auditor, agent via x402) | Signed request record with method versions **fixed at acceptance** |
| 2 Execute | Pinned runners run: Inspect / lm-eval (model axes), garak and the Cisco MCP Scanner (security), GSPC-native graders (subject and deterministic axes) | Automation | `.eval` and scan logs, dataset revisions, model IDs |
| 3 Seal | Layer 0 hashes every log, builds a Merkle root, anchors it (OTS / Rekor) | Automation | `evidence_manifest` (the Inspect pilot proved this: root `dc977e1c…`, 5/5 VALID, tamper → INVALID) |
| 4 Review | A human reviewer checks scope, negative controls and anomalies. Above risk tier 2, a 2-of-3 threshold signature is required | Enrolled reviewers, not the owner alone | Reviewer signature(s), review notes |
| 5 Publish | Attestation is published **whatever the outcome**, verifiable in a browser | Automation | Static verifier (draft PR #4556 pattern) |
| 6 Accept / correct | Requester or recipient records acceptance, or files a correction. Corrections are appended, never overwritten | Recipient | Acceptance record. **This is the moat asset that does not exist yet.** |

Pricing tiers (proposals; see eval_economics):

| Tier | Contents | Price |
|---|---|---|
| T0 | Agent-native, x402 | Automated check, no human review, labelled "unreviewed" |
| T1 | Per-system check | One-reviewer attestation (e.g. Art 50 marking), £150–£500 |
| T2 | Monitoring | Re-attestation on a stated cadence, frozen snapshots on the fluid stream. Each re-attestation is a metered request or an engagement invoiced after delivery. v1.0 proposed £200–£600/month; recurring billing is offered only if the owner rules for it (v1.1, §10 item 13) |
| T3 | Threshold-signed | 2-of-3 reviewers, for insurer or auditor reliance. Priced per engagement |

**Conflict-of-interest controls (mandatory before T2/T3 are sold):**

- methods are frozen and published before a request is accepted
- negative results are published
- reviewers have no sales compensation, and rotate
- a public appeals and corrections route exists
- the rating/attestation unit is ring-fenced from MCP compliance-tool sales (AI Act Art 31(5)-type separation)

### 5.3 Frozen to fluid

- **Fluid:** continuous measurement streams (daily runs, watchdog ingest).
- **Frozen:** at each publication, a hashed snapshot is cut (dataset revision, method sha, logs, Merkle root, anchor).
- **Rule:** every RAS answer, report and index value cites a **frozen snapshot ID**, never "the live board".
- The frozen 417-provision corpus is the template: its root `37e2e10d…` reproduces from live CELLAR bytes.

### 5.4 Each axis as its own intelligence report (34 contracts)
One report contract per axis, published per frozen snapshot:

| Field | Meaning |
|---|---|
| `axis_id`, `kind` | model-comparison / deterministic-facts / measured-subject |
| `method_sha`, `bank_sha`, `dataset_revision` | Pinned inputs (closes the gap that Inspect logs do not record HF revision) |
| `population` | Denominator, tested, failures, inaccessible: never implied blanket coverage |
| `result`, `ci` | Result with confidence interval |
| `separation` | SEPARATED / TIE / UNTESTED with test and p-value |
| `status` | MEASURED (fresh) / STALE (> N days) / UNMEASURED / UNCHECKABLE |
| `reproductions` | Independent reruns on record |
| `reliance` | Named acceptances (with consent) |
| `snapshot_id`, `anchor` | Frozen ID plus OTS/Rekor |
| `access_level` (v1.1) | What access the measurer had. For CSOAI: outside-in, no privileged access |
| `funder`, `publication_control` (v1.1) | Who paid for the run, and who decided that it was published |
| `min_detectable_change` (v1.1) | The smallest change this run could have detected at its n |
| `right_of_reply` (v1.1) | Notice given to a named provider before publication, and any reply |

Today's honest starting point (estate_axes.csv, 20 Nov):

- 14 model-comparison axes: 0 separated (7 TIE, 7 UNTESTED), median age 100 days.
- 9 deterministic-facts axes: n between 2 and 261, and all 9 carry `legacy` method status.
- 11 subject axes: their regexes pass benign text; the fix is PR #4484.

Under this contract **most axes would show STALE or legacy today.** That is the correct thing to publish.

### 5.5 DORADO evidence index (the "sov signal")
DORADO is already your measurement-engine codename (cibola README: "a measurement body, never a certifier"). The index keeps that identity.

- **Published as a vector, not a single number:** a grade per axis plus coverage plus confidence plus freshness.
- **No composite over UNMEASURED or STALE axes.** Any headline aggregate covers only MEASURED-fresh axes and states its coverage (e.g. "covers 6/34").
- **Relying parties pay** (insurers, auditors, enterprise buyers) for the time-series and capsules: metered per request over x402, or as a scoped engagement invoiced after delivery. v1.0 said "subscriber-pays"; whether any recurring payment is allowed is an open owner ruling (v1.1, §10 item 13). The free public view drives adoption; the paid product is history plus capsules.
- **East–West:** one CSOAI method run on Western *and* Chinese open-weight models on CSOAI hardware. Eastern published results (OpenCompass, CAICT) are cited as external comparators and never ingested into paid products. NC-licensed sets (C-Eval CC BY-NC-SA, CMMLU CC BY-NC) are excluded from paid SKUs. `/api/east-west-bench` (ex-`/api/dorado`) is the existing rail.
- **Public naming:** do not describe DORADO by comparison with a named credit-rating agency in public copy (CMA/ASA misleading-claims risk; contradicts the "measurement, not certification" contract). Internally, the staged gates in §7 are the path to rating-like reliance.

### 5.6 Root ceremony = the human root of HITL
The ceremony is not separate from human in the loop; it is its **root**. Every later "human approves or fixes" step is a threshold signature that chains back to keys born in a witnessed ceremony.

| Requirement | Done? |
|---|---|
| Kit: Shamir 2-of-3, dice entropy, offline verifier, runbook (`scripts/ceremony`) | ✓ |
| Real entropy (physical dice, recorded on video) | ✗ (simulated so far) |
| Three custodians who are independent of each other (not all the owner; different orgs or roles; at most one per org) | ✗ |
| Air-gapped machine, independent witness, signed minutes | ✗ |
| Recovery rehearsal (2-of-3 reconstruct) and revocation procedure published | ✗ |
| Anchoring: fresh OTS (pending since 5 Sep) and an actual Rekor entry; DRIFTED witness pointer (#4056) reconciled | ✗ |

Candidate custodian profiles: an independent reviewer from a W3C or OSAA working group, a UK solicitor or notary, and the owner. **No agent may claim the ceremony happened. Only humans can perform it.**

### 5.7 Council operating structure (BFT working group of working groups)

| Lane | Accountable owner | Next acceptance evidence |
|---|---|---|
| Source & measurement | Technical lead | One externally reproduced Inspect→GSPC run on a real model |
| Trust & Layer 0 | Key-custody owner | Witnessed ceremony + fresh anchors |
| Human authority & watchdog | Independent reviewer lead | Real authorised sandbox approval-to-effect |
| Release & infrastructure | **One** release/merge owner | Backlog 137 → <40; gates green means something |
| Commercial / RAS | Buyer-delivery owner | ≥1 outside T1 purchase with written acceptance |
| Standards & institutions | Technical liaison | NIST LOI complete; SAFE #81 disposition; one upstream merge |
| Academy & SovSpace | Research lead | One bounded, reproducible simulation experiment |

Council governance:

- **Reviewers:** 3f+1, with at most f from any one org.
- **Chair:** none fixed. A facilitator rotates by lot.
- **Review deadline:** 14 days.
- **Credit:** DCO sign-off.
- **The founder's role:** one vote among many on oversight, while leading as founder and CEO on product.

Advisory: separate an independent chair for oversight (conflicts, appeals) from the founder's executive role.

**A beat, a number and a state per lane (v1.1).** Read on 24 Nov 2026. A lane that no person holds is written UNSTAFFED, not assigned (wording from the operating-model draft in PR #4787; its acceptance ladder is a candidate for the receipts in this table).

| Lane | Beat | The number | State on 24 Nov |
|---|---|---|---|
| Source & measurement | Every 6 hours, and daily | Hosted models that answered this week | 0; the last pulse log shows BLOCKED_CREDENTIAL with n=0. Open-weight models only |
| Trust & Layer 0 | Quarterly | Independent custodians named | 0; ceremony still simulated |
| Human authority & watchdog | Monthly | Complaints and corrections closed within the stated time | UNSTAFFED |
| Release & infrastructure | Daily | Open PRs against the gate of 40 | 184; no single release owner |
| Commercial / RAS | Weekly | Asks sent; outside payers in 30 days; repeats | Unverified; 2; 0. UNSTAFFED: only the owner can send |
| Standards & institutions | Weekly | Filings due within 30 days | See §9 |
| Academy & SovSpace | Quarterly | Outside users on record | None on record (unverified) |

Ten vital signs are read each Friday: hosted models that answered the pulse; comparisons separated, tied and untested; open PRs; distinct outside payers in 30 days; repeat outside payers in 30 days; settled revenue; named outside people; asks sent that week; the detector's flag rate with no change; days to the owner's public date.

### 5.8 Throughput rule (the binding constraint)

- **Work in progress:** no new automated lanes until the open-PR count is below 40.
- **Ownership:** one writer per file or lane.
- **Stale PRs:** rolling-series PRs auto-supersede.
- **Ledger:** measure *externally verified outcomes* (merged + deployed + independently checked), not commits.
- **The first triage pass is ready** (pr_triage.csv): about 41 closures (26 superseded, 12 folded, plus #3100 and other stale PRs), 9 one-review merges, and roughly 830 org-wide bot PRs to group or close.
- **Closing fortnight (v1.1, 24 Nov):** no session starts a new lane until the open-PR count is below 40. Read on 24 Nov: 184 open, 44 of them drafts.
- **One release owner (v1.1):** not yet named by the owner (§10 item 14). On 22 Nov at least seven landing trains were observed at once.


---
## 6. Reliance loops (32 doors become 7 loops)
*estate_loops.csv lists 33 rows. D33 (`/api/eunomia-data`) is retired and now redirects (308) to `/api/signed-data-feed`, so it is excluded from the 32 live doors; its one historical payer is still counted in the payer totals.*
The site's own gates apply: **0 payers in 30 days means add no doors; at least 1 repeat in 30 days opens the next door; at least 5 distinct payers in 30 days makes it a product.** Today: 2 outside payers in 30 days and 0 repeats.

**Order of money for 2027 (v1.1).** 1. Grants and public contracts. 2. RL1, Article 50 checks. 3. RL2, evidence for auditors. 4. RL3, insurers, once anchors are live. 5. RL4, RL5 and RL7 stay as rails with no revenue target. Reason: read on 24 Nov, settled revenue is still $0.06 with 0 repeat payers in 30 days, and real commerce across the whole x402 rail was reported at about $28,000 a day in March 2026 (a second-hand figure).

| loop_id   | loop                                                       | buyer                                                           | acceptance_criterion                                                                                         | price                           | kill_scale_gate                                                                  |
|:----------|:-----------------------------------------------------------|:----------------------------------------------------------------|:-------------------------------------------------------------------------------------------------------------|:--------------------------------|:---------------------------------------------------------------------------------|
| RL1       | Art 50 marking evidence (RAS T1/T2)                        | EU-facing genAI deployers + their counsel                       | Signed per-system marking check bound to AI Act Art 50(2) provision hash; recipient files written acceptance | £150–£500/check; £200–£600/mo   | Scale: ≥3 paid checks + 1 repeat in 60d. Kill: 0 paid by 31 Mar 2027             |
| RL2       | Provision-bound evidence capsules for auditors             | ISO 42001 certification bodies; audit firms accredited under agent-certification standards (seven read on 24 Nov; v1.1); future Illinois SB 315 auditors | Auditor cites capsule IDs in an audit file                                                                   | £5k–£20k per audit engagement (v1.1: v1.0 said per audit-firm seat/yr; seats are barred by the revenue firewall; basis to be confirmed) | Scale: 1 signed pilot with an audit firm. Kill: no pilot after 6 outreach cycles |
| RL3       | Underwriting data licence (DORADO time-series)             | AI insurers (AIUC, Armilla, Munich Re/Mosaic)                   | Insurer uses series in a pricing/claims decision, in writing                                                 | £10k–£50k pilot                 | Gate first: anchors live + witnessed ceremony. Route to test (v1.1): an insurer's published data-partner programme, recorded in the 2 Sep file and unverified on 24 Nov. Scale: 1 pilot                    |
| RL4       | MCP / agent security attestation (RAS)                     | MCP server publishers, agent platforms, registries              | Publisher displays attestation linking to verifier; registry consumes feed                                   | T0 x402 $0.02–$2; T1 £150       | Scale: ≥5 distinct publishers in 30d (site's own gate). Kill: 0 in 30d           |
| RL5       | Stablecoin/RWA wrapper & proof-of-presence feeds           | Stablecoin issuers, GENIUS Act compliance teams                 | Issuer or regulator comment references the feed                                                              | x402 per call; feed licence     | Freeze new doors; keep top 3 by use; retire rest if 0 payers by 28 Feb 2027      |
| RL6       | Institutional evidence (filings, standards, reproductions) | NIST, ICO, OCC/FDIC, BSI, OECD, AI Verify                       | Body publishes, cites, selects (CRADA, sandbox, WG seat)                                                     | Free (reliance, not revenue)    | Target 3 acceptances by 31 Mar 2027; each becomes a reference in RL1–RL4         |
| RL7       | Discover / free doors (funnel)                             | Agents, developers                                              | Converts to a paid call                                                                                      | Free                            | Keep; publish conversion rate                                                    |

---
## 7. Staged path to rating-like reliance (gates, not claims)
| Stage | CSOAI is… | Gate (evidence) | Window |
|---|---|---|---|
| 0 | Measurement publisher (now) | Anchors live; real ceremony; ≥3 independent reproductions; ≥10 distinct outside payers; ≥3 repeat buyers | Q1 2027 |
| 1 | Recognised contributor | Executed NIST CRADA or grant letter; one named deployer pilot with a written outcome | Q2–Q3 2027 |
| 2 | Accredited tester | UKAS ISO/IEC 17025 schedule for 1–3 methods; impartiality policy; ring-fenced attestation unit | 2028 |
| 3 | Relied-on input | ≥2 written reliance agreements (insurer or auditor); ≥24 months of anchored history; back-test against incidents; professional-indemnity cover | 2028–29 |
| 4 | Regulatory recognition | Notified body via an EU entity, SB 315 auditor partnership, or a future AI-rating regime | 2029+ |

**Statutory route (v1.1).** Statute is creating the Stage 4 category on fixed dates: Illinois SB 315 annual independent audits from 1 Jan 2028; a California process for designating independent verification organisations due by 1 Jan 2028 (SB 813); California auditor registration from 1 Jan 2029 (AB 1405); a Connecticut pilot; and a proposed federal licensing bill. These were read from secondary legal summaries on 24 Nov 2026; the primary texts were not opened. The first mandatory audits fall in the Stage 2 year.

---
## 8. Open environment (one stack, open tools)
Design: `open_env_design.md`. The pipeline runs: **runners** (Inspect, lm-eval, garak, Cisco MCP Scanner, TrustyAI) → **Layer 0 seal** (RFC 9162 Merkle root) → **human sign-off** (threshold) → **per-axis reports** → **DORADO index**.

**Host-native outputs (v1.1).** Results should also appear in the formats the hosts read, one result at a time and never in bulk (owner rule 4):

- Hub result files (`.eval_results/`) and a schema-valid `eval.yaml` for one bank. Read on 24 Nov: the `eval.yaml` in `csoai/gspc-gov` carries doctrine notes and none of the host's benchmark fields, so it is not a registered benchmark. Registration is by request to the host, which is the owner's to send.
- Kaggle benchmark task cards, starting from the six in `csoai-provebench`.
- An MCP feed keyed by registry server name, since the registry leaves ratings to downstream aggregators.

Prototype results:

- **Cisco MCP Scanner on CSOAI servers:** 37/38 static and 48/49 remote tools SAFE. Both HIGH hits were false positives, so scanner verdicts need human classification before anyone cites them.
- **garak:** ran only against its built-in test generators (pipeline check). No real model was assessed: torch could not be installed with the disk this full.
- **Seal:** RFC 9162 root `54a84230…`, unsigned and unanchored. `redteam_seal_bundle.zip`

Business-intelligence join (50 companies → LEI → HF org → AI Act provision hashes → GSPC bank rows): `entity_system_join_sample.csv`

- 32/50 exact LEI matches, 47/50 HF orgs resolved.
- The 50 companies and their role assumptions were chosen by hand and are illustrative only, not a legal classification.
- GLEIF's fuzzy name search returns wrong entities, so an exact-name check on our side is mandatory.

**Licence layers:**

- core: CC0/OGL (GLEIF, OpenAlex, Companies House, UK procurement)
- a separate CC BY-SA layer: AI Incident Database
- excluded: ODbL (OpenCorporates)

`source_rights_register.csv`

---
## 9. 90-day execution calendar
| Week of | Actions | Owner-only? |
|---|---|---|
| 20 Nov | Submit ICO; approve PR triage; merge #4533; decide on BridgeAI partner outreach (b2match) | Yes |
| 24 Nov | NIST webform resubmission; OECD.AI form; BSI ART/1 application; prEN 18283 and DIS 23282 comments; review draft PR #4562 (coverage-evidence bare GET 400→402) | Mostly |
| 24 Nov (v1.1) | Closing fortnight begins (§5.8). Silent-change calibration run 2, after run 1 failed its no-change control | No |
| 1 Dec | BridgeAI go/no-go; Art 50 RAS T1 offer to 20 EU deployers (deadline 2 Dec); NIST SP 800-82r4 by 30 Nov | Mixed |
| 7 Dec (v1.1) | UK Sovereign AI Challenge 4, batch 2 opens; closes 22 Jan 17:00 GMT (from the 18 Nov funding file, not re-checked) | Yes |
| 8 Dec | BridgeAI submission (if go); SEC S7-2026-35 (7 Dec); schedule the ceremony (custodians named) | Yes |
| 15 Dec | OCC/FDIC third-party-risk comment (16 Dec); NIST SP 2400-102 comment (18 Dec); Sovereign AI EOI | Yes |
| 1 Jan (v1.1) | Owner's stated date for going public. Conditions: this playbook on master; one comparison axis re-measured on real open models, or UNTESTED stated on the board's first line; the silent-change report leads with its failed run; one outside person named; four asks sent in December | Yes |
| 5 Jan | **Witnessed root ceremony**, then OTS + Rekor re-anchor; reconcile #4056 | Yes (humans) |
| 12 Jan | Re-measure 14 model-comparison axes with a real model (key or local server); publish per-axis report contract v1 (v1.1: bring forward where possible on the open-weight Actions lane proven by the 23 Nov calibration, which needs no credential) | No |
| 19 Jan | ICML DEB paper (benchmark answerability audit), arXiv first, then the Inspect registry submission | Mixed |
| Feb | DORADO index v0 (vector, coverage-honest); auditor pilot (RL2); insurer pilot outreach (RL3) once anchors are live | Mixed |
| 31 Mar 2027 | Stage-0 gate review: kill or scale each loop by its gate | Yes |

---
## 10. Owner decisions (prioritised)

1. Submit the ICO response today, or let it lapse.
2. Adopt this playbook as canonical and retire the earlier plans.
3. Approve the PR triage (`pr_triage.csv`): about 41 closures and 9 one-review merges; group the dependabot PRs and close the MCP wire-migration duplicates (about 830 org-wide).
4. Name three independent ceremony custodians and a date.
5. Complete the NIST webform and name a CRADA signatory; authorise the third-party-risk (FDIC), SEC 4-882 and NIST SP 2400-102 comments.
6. BridgeAI: find a deployer partner by 1 Dec or drop it.
7. DORADO: confirm it is an evidence index, paid for by relying parties, ring-fenced from tool sales (v1.1: "subscriber-pays" removed pending item 13).
8. Provide a model API key (or a reachable local server) so that real re-measurement can run.
9. Repair or retire the Freshness and Drift CI gates (29/30 and 20/30 recent failures).
10. Machine hygiene:
    - Both Macs: the `MEMORY.md` files are stale and contradict current rules.
    - Disk: 4–11 GiB free.
11. Licence rulings: gspc-gov, gspc-mcp and gspc-agi need cc-by-4.0, not cc0; gspc-care's Apache LICENSE file conflicts with its declared licence.
12. Approve the Google Drive card so Drive strategy and grant documents can join the prior-work register.
13. (v1.1) Rule on recurring payment: engagements invoiced after delivery plus metered x402 calls only, or subscriptions for relying parties. Until ruled, nothing recurring is offered.
14. (v1.1) Name one release owner (§5.8).
15. (v1.1) Name one appeals reviewer and the ceremony custodians (§5.6, §5.7).
16. (v1.1) Rule on renaming four public Hugging Face datasets whose names use a word the owner has barred from public pages (list in the field study).
17. (v1.1) State what one year of operation costs, so that grant drafts can carry an amount.

---
## 11. Method, limits and provenance

- Six research tracks ran on 20 Nov 2026: openings, estate, economics, Inspect pilot, consolidation, open tooling. Each declared deviations; those that matter here:
  - The M4 content search for EBOLA did not finish.
  - Google Drive was not read.
  - The company mailbox (nicholas@csoai.org) is not connected, so NIST delivery is unconfirmed.
  - No real-model runs: mockllm and garak's built-in test generators only.
  - 23 of 61 openings rows are repo-reported, secondary or provisional.
  - The proposed prices are calibrated to comparables, not market-tested.
  - Several competitor figures are tagged [secondary].
- One process note: to fetch sec.gov, the openings track sent a single request whose User-Agent named the public address contact@councilof.ai. That address was not sourced from the account settings; it should not have been used without your say-so.
- Nothing was submitted, emailed, merged or deployed. Repo changes exist only as draft PRs.

- **Host concentration (v1.1).** The estate's largest distribution host is reported to be changing owner in the first half of 2027 (a second-hand report, read 24 Nov). Verification stays on `did:web:csoai.org` and must not depend on any host; public records are mirrored off the host.
- **Silent-change calibration (v1.1).** Run 1 of the registered rule flagged 19 of 30 and 12 of 20 no-change batches (signed record sha256 `5de64693acd1ae4dce393c28f8cca9505790746031cafc67386e45104c9ade59`). No detection claim is made until a rule passes its own control.

### 11.1 Executed this session (all drafts or comments; nothing merged)
- **Draft PR #4556** adds an Inspect evidence static Space and a dispatch workflow. Recommendation: fold it into the existing `hf-evidence-sync`/`hf-frontdoors` workflows (§2).
- **Draft PR #4562:** a bare GET on the paid `/api/coverage-evidence` path now returns a 402 challenge instead of a 400. 16 of 17 checks pass; the failing `gates` step 62 also fails on other PRs.
- **Comment on #4544:** cherry-pick the server.json `csoai-gspc-mcp` 0.2.2→0.2.8 hunk.
- **Comment on #4556:** the manifest's govbench revision (`c6ddc5a9…`) differs from the log header's `task_args.revision` (`beecacfc…`). Only the README changed between the two, so scores are unaffected. Read the revision from the header and fail closed on a mismatch.
- **Issue #4565:** the jail axis reason code `NO_PER_ROW_RESULTS` is missing from the `/api/gspc` state_enum.
- **Correction:** `/api/wrapper?id=usdc.e:arbitrum` returning 200 is **by design**. The pair was unreadable (all 4 public RPCs failed), so it answered with a preview and was not offered for sale. It is not a defect.
- **ICO agentic-AI response drafted** for the owner to submit.

---
## 12. Version 1.1 amendments (24 Nov 2026)

Twelve amendments, made on the owner's instruction of 24 Nov 2026 after a field study of comparable organisations (a private working file). The study's developer-platform segment relies on draft PR #4787.

| # | Section | Amendment | State |
|---|---|---|---|
| 1 | 0 | Position statement and who-pays grid | In text |
| 2 | 6 | Order of money for 2027 | In text |
| 3 | 6, RL2 | Price per engagement, not per seat; accredited audit firms added as buyers | In text; price basis to be confirmed |
| 4 | 6, RL3 | Insurer data-partner route | In text; unverified |
| 5 | 0, 5.2, 5.5, 10 | "Subscriber-pays" removed; relying parties pay per request or per engagement | Proposed wording; owner ruling open (§10 item 13) |
| 6 | 7 | Statutory route to Stage 4 | In text; secondary sources |
| 7 | 5.4 | Five report fields: access level, funder, publication control, smallest detectable change, right of reply | In text, contract and schema (optional fields) |
| 8 | 8 | Host-native outputs | In text |
| 9 | 5.7 | A beat, a number and a state per lane; UNSTAFFED where no person holds it | In text |
| 10 | 5.8 | Closing fortnight; one release owner | In text; owner to name (§10 item 14) |
| 11 | 9 | Calendar: re-measurement brought forward; 24 Nov, 7 Dec and 1 Jan rows | In text |
| 12 | 11 | Host concentration named as a risk | In text |

Live reads used, 24 Nov 2026: `GET /api/gspc`, `GET /api/revenue`, `GET /api/worker`, the GitHub pull-request list, and the last log of the six-hourly pulse.
