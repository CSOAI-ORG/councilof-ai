# Watchdog and human-review readiness register

**As of:** 31 October 2026
**State:** internal reconciliation; no adoption, staffing appointment, source ingestion or Busabase write is recorded here.

## Cross-device inventory

| Area | Verified state | Consequence |
|---|---|---|
| Desktop Commander | Non-empty filesystem allowlists are active on M4, M2 and `sov33-owem-micro2`. Approved-root listing succeeds; `/etc` is denied on each. Two other devices are offline and unverified. | Recheck offline devices before use. M2 is scoped to its documented `workspace_for_ai` root. |
| M4 | Draft work is isolated in `_alignment/watchdog-source-harness-codex-20261031`. The main Council repo has an active Busabase master-sync and Git operation. | Keep edits in the isolated worktree. No Busabase write was made. |
| M2 | `clawd-workspace` is on `kimi/pixelbuddy-mac` with 374 tracked changes and 346 untracked paths. Its legacy Watchdog service uses mock incidents; database imports are unused. | Leave M2 source files untouched. M2 rules limit work to its single workspace and active gateway scope. |
| Linux | `pubbus`, `x402-ras` and `claim-entity-decode` have byte-identical `public-watchdog.ts` redirects to `/os?lobby=home`. | These are legacy route copies, not incident adapters or case stores. Do not patch each copy separately. |
| Busabase | The saved `company-library` snapshot has 100 records and a continuation cursor. Its first page has no Watchdog, incident, SAFE, GSPC, MEOK or signal matches in title/source-key fields. The live API read timed out. | Snapshot is partial, not a live inventory. Busabase is not verified as the Watchdog case store. Do not write during the active sync or create a second ledger. |

## Current product and governance state

| Area | Verified state | Required gate |
|---|---|---|
| Legal entity | Companies House lists CSOAI LTD (16939677) as active and Nicholas Brian George Templeman as its sole active director. | This supports him as proposed company approver. Record adoption only in an exact signed company decision. |
| Public Watchdog group | PRs #3641 and #3657 are merged. Registry, tracker and read-only MCP resources exist; seven groups are declared, with no accepted chairs/members or staffed incident service in inspected records. | Reuse the existing group and charter. No eighth group or service promise. |
| WG-SAFE charter | The official WG-SAFE charter page says its charter is under development pending Steering Committee approval; the public RFC is a proposal. | Internal controls and the integration delta may be prepared for company adoption; do not claim WG-SAFE charter adoption, membership or endorsement until an approved exact version exists. |
| Daily activity | One daily report-only evidence digest already reads a bounded set of public sources, including AIID, OECD AIM and AIAAIC. A separate M4 source monitor checks seven registered source pages with HEAD; its saved snapshot had six monitored and one not monitored. The local daily-index generator formats that saved metadata as a draft; it collected no incident records. This isolated branch wires it into the existing daily reg-watch review-PR workflow, but the change is not active on main until reviewed and merged. | Preserve the existing digest schedule. Reuse the source monitor; do not create a duplicate automation or call availability checks incident ingestion. |
| Source registers | The M4 runtime availability inventory has seven page entries. The controlled source-permission register revision 0.2-draft has six bounded rows for AIID, OECD AIM, AIAAIC, the EU reporting reference, Council intake and GSPC. There is no reviewed crosswalk. | Keep all record-level adapters disabled. Join by an owner-reviewed source-ID crosswalk and approve each source, field and purpose before enabling one. |
| Intake | Public Watchdog routes redirect. M2's legacy page/service is mock-backed. No durable public intake or case store was verified. | Keep intake disabled pending privacy, security, access, retention, correction and appeal controls. |
| GSPC | Live endpoint reports 33 axes, 23 measured, 10 unmeasured; 0 of 14 model-comparison axes separated a leader, 7 TIE and 7 UNTESTED. | Keep Watchdog link-only. No incident counts in scores and no Axis 34 in this lane. |
| Evidence/MEOK | `csoai.evidence-event/0.1` and `csoai.hitl-authority-effect/0.1` already exist. The M4 `/api/meok-library/cases` route is a private company-case gateway, not a Watchdog staff-review queue; its source comment says the private origin and grant are not installed by that change. No Watchdog reviewer, receiver or enrolled human-operator key was verified for this flow. | Reuse the existing event and authority profile. Do not repurpose the company-case route. A referral is not live until a real receiver and reviewer accept the exact case revision and scope. |
| Active repository lanes | PR #3595 is open for 33-axis parity. PRs #3596, #3598 and #3599 remain open for workflow, authority and SDK work. PRs #3179, #3641 and #3657 are merged. | Do not duplicate active lane scopes. PR #3595 is not a 12-database incident harness. |

## Remaining gates

1. **Adoption:** the authorized director records exact versions of operating controls v0.1 and the Public Watchdog internal integration delta v0.1, or records changes. Neither is adopted yet. The WG-SAFE charter is not approved or published in the official repository, so its adoption and any SAFE affiliation claim must wait for an exact approved version.
2. **Human capacity:** appoint a chair, deputy, privacy/security owner, reviewers and alternates only after each person accepts. Record competence, conflicts, consent, service hours, escalation, funding and appeals. The 33 specialist declarations do not appoint people.
3. **Permissions:** approve source, fields, purpose, commercial use, privacy, retention, correction route and owner for each entry. All record-level adapters remain disabled.
4. **Build:** the local metadata-only generator is built against the existing HEAD snapshot. Still required: an owner-approved source-ID crosswalk, a real revision-bound MEOK staff-review receiver, and an authenticated accepted reviewer. GSPC stays link-only; no second store or Busabase write is authorized here.
5. **Pilot:** run one approved cohort for 30 days with an independent receiver only after the preceding gates. Measure freshness, missingness, duplicates, reviewer disagreement, corrections and latency. No global-completeness claim.
6. **Axis decision:** consider Axis 34 only through a separate GSPC process after the construct, denominator, rights, method, human capacity, uncertainty and independent validation are approved.

## Accurate language

**Current:** “The existing daily evidence digest reads a bounded set of public pages, including AIID, OECD AIM and AIAAIC. The Watchdog can generate a local metadata-only availability draft for seven named source pages. It does not ingest incident cases or provide a staffed Watchdog service.”

**After launch, if evidence supports it:** “The Watchdog index reports coverage only for named sources and authorized reports, with freshness and human-review state as of a stated time.”

Do not claim all global reports, continuous incident collection, 24/7 human review, legal compliance, certification or a 34th live axis.
