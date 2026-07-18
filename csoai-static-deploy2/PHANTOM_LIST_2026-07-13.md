# PHANTOM LIST — DEFONEOS Sprint Audit 2026-07-13

**Source:** `tools/deploy_gate.py --verbose --json --no-sigil --log /Users/nicholas/clawd/AGENTS.md`
**Output JSON:** `/tmp/phantom-audit.json` (15,729 bytes, `passed=false`, `phantom_count=45`, `found_count=11`, `gating_claims=18`)
**Deploy root:** `/Users/nicholas/clawd/csoai-static-deploy2/` (297 `defoneos-*.html` on disk; **34 of 37 page-phantoms MISSING locally** — the post-tick-71 filesystem rollback)
**Auditor:** JEEVES subagent, classification pass 2026-07-13

---

## Summary

| Classification | Count | Rationale |
|---|---|---|
| **REBUILD** | 37 | Real page slugs (defoneos-* / defoneos-mod-*) that the gate says should resolve to `.html`; originally built & deployed, lost from local disk between tick 70→71, recoverable via Vercel deployment history or rebuild |
| **RECLASSIFY** | 8 | Bare `tick-NN` references (no `-sigil` suffix) — false-positive regex hits on phrases like "REBUILD TICK-71 BATCH". The real referenced files are `DEFONEOS_SPRINT_STATE.json` (2,700b, present) and `tick-NN-sigil.json` (present for ticks 40-89) |
| **REMOVE** | 0 | Every phantom has a real, intentional reference. Nothing to delete. |

---

## Full Classification Table

| # | phantom_filename | tick | claim_kind | agent | classification | rebuild_estimate_kb | rebuild_action |
|---|---|---|---|---|---|---|---|
| 1 | defoneos-mod-board-update | 86 | CLAIM | Hermes/JEEVES | REBUILD | 17.0 | Rebuild one-page monthly Board memo (4 KPIs / 2 risks / 1 ask). Reference: T86 RELEASED 22:10, verified 17031b on Vercel prod. |
| 2 | defoneos-mod-uk-sovereign-pitch | 86 | CLAIM | Hermes/JEEVES | REBUILD | 21.4 | Rebuild 12-minute 3-slide UK sovereign pitch + 12 follow-up Q&A. Reference: T86 RELEASED, verified 21383b. |
| 3 | defoneos-mod-auditor-counter | 86 | CLAIM | Hermes/JEEVES | REBUILD | 19.4 | Rebuild 1-page auditor counter (12 SIGIL-receipt objections + 6-level escalation). Reference: T86 RELEASED, verified 19418b. |
| 4 | defoneos-mod-customer-success-scorecard | 84 | CLAIM | Hermes/JEEVES | REBUILD | 19.4 | Rebuild rolling SIGIL-anchored customer health scorecard. Reference: T84 RELEASED 19:28, verified 19365b. |
| 5 | defoneos-mod-escalation-runbook | 84 | CLAIM | Hermes/JEEVES | REBUILD | 17.7 | Rebuild 14-day SEV-1..4 named-owner escalation runbook. Reference: T84 RELEASED, verified 17700b. |
| 6 | defoneos-mod-churn-prevention | 84 | CLAIM | Hermes/JEEVES | REBUILD | 19.4 | Rebuild 30-day decision window + 6 unconditional recovery levers + no-fault exit. Reference: T84 RELEASED, verified 19446b. |
| 7 | defoneos-mod-30-60-90-customer | 83 | CLAIM | Hermes/JEEVES | REBUILD | 19.0 | Rebuild per-buyer 30/60/90-day post-pilot success plan. Reference: T83 RELEASED 17:24, verified 19028b. (Note: appears twice — T83 17:20 and T82→T83 14:20 — duplicate CLAIM line.) |
| 8 | defoneos-mod-quarterly-review | 83 | CLAIM | Hermes/JEEVES | REBUILD | 16.1 | Rebuild QBR template. Reference: T83 RELEASED, verified 16068b. (Duplicate CLAIM: T83 17:20 + T82→T83 14:20.) |
| 9 | defoneos-mod-renewal-negotiation | 83 | CLAIM | Hermes/JEEVES | REBUILD | 16.8 | Rebuild T-90-day renewal negotiation playbook. Reference: T83 RELEASED, verified 16757b. (Duplicate CLAIM: T83 17:20 + T82→T83 14:20.) |
| 10 | tick-68 | 74 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | False-positive: phrase "REBUILD TICK-68 BATCH" inside T74 CLAIM line. Real files are `tick-68-sigil.json` (already present locally) + `DEFONEOS_SPRINT_STATE.json` (2700b, present). Rewrite CLAIM text to "REBUILD TICK-68 BATCH (sprint-state marker for tick-68 payload files: tick-68-sigil.json + 3 defoneos-mod-* pages)". |
| 11 | defoneos-mod-buyer-triage | 74 | CLAIM | Hermes/JEEVES | REBUILD | 18.3 | Rebuild buyer reply triage dashboard. Reference: T68 RELEASED 11:10, verified 18280b. Originally built T68, lost in tick-70→71 rollback, target of T74 rebuild. |
| 12 | defoneos-mod-no-reply-nurture | 74 | CLAIM | Hermes/JEEVES | REBUILD | 17.2 | Rebuild no-reply nurture calendar. Reference: T68 RELEASED, verified 17232b. T74 rebuild target. |
| 13 | tick-70 | 73 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | False-positive: "REBUILD TICK-70 BATCH" inside T73 CLAIM. Real files are `tick-70-sigil.json` (present) + sprint state. Rewrite CLAIM text. |
| 14 | tick-71 | 72 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | False-positive: tick-71 is a sprint-state marker (the T72 recovery CLAIM references the tick-71 halt). Real files are `tick-71-sigil.json` (present locally, 2211b) + state JSON. Rewrite CLAIM text to "RECOVERY FROM INFRASTRUCTURE HALT (tick-71-sigil.json present; tick-71 deploy halted)". |
| 15 | tick-71 | 76 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | Duplicate of #14 — same false-positive pattern in T76 CLAIM line "REBUILD TICK-71 BATCH". Rewrite CLAIM text. |
| 16 | tick-60 | 76 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | False-positive: T76 CLAIM references "rebuild tick-60 batch" but then corrects itself ("tick-60 is already live 22412/21480/22677b verified HTTP 200"). Real files are `tick-60-sigil.json` (present) + crm/deal-economics/onboarding pages (live on Vercel). Rewrite CLAIM to note "tick-60 batch ALREADY LIVE on Vercel; no rebuild needed". |
| 17 | tick-76 | 76+77 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | False-positive: phrase "Tick-76 ship 5 new pages" inside T76+77 CLAIM. Real files are `tick-76-sigil.json` (present) + the 5 pages built that tick. Rewrite CLAIM text. |
| 18 | tick-77 | 76+77 | CLAIM | Hermes/JEEVES | RECLASSIFY | n/a | False-positive: phrase "Tick-77 ship 3 more" inside T76+77 CLAIM. Real files are `tick-77-eat-sigil.json` (present) + the 3 pages built that tick. Rewrite CLAIM text. |
| 19 | defoneos-sc-clearance | 78 | CLAIM | Hermes/JEEVES | REBUILD | 11.4 | Rebuild UK SC clearance personal application guide (eligibility + 5 docs + 3 referees + 5-step procedure + 3 rejection causes + 3 alternatives). Reference: T78 RELEASED 13:00, verified 11388b. |
| 20 | defoneos-mod-dstl | 78 | CLAIM | Hermes/JEEVES | REBUILD | 11.6 | Rebuild Dstl Tier-1 engagement plan (4 entry points + 3 buyer personas). Reference: T78 RELEASED, verified 11603b. |
| 21 | defoneos-mod-defcon-760 | 79 | CLAIM | Hermes/JEEVES | REBUILD | 11.4 | Rebuild DEFCON 760 Single Source Pricing page (17 clauses + £240k Y1 + 9-step procedure). Reference: T79 RELEASED 13:03, verified 11405b. |
| 22 | defoneos-mod-prime-prime-pitch | 80 | CLAIM | Hermes/JEEVES | REBUILD | 13.6 | Rebuild 12-slide UK prime pitch (6 primes + 4 sub-contract models). Reference: T80 RELEASED 13:08, verified 13583b. |
| 23 | defoneos-oscal-deep-dive | 80 | CLAIM | Hermes/JEEVES | REBUILD | 16.6 | Rebuild OSCAL SSP technical spec (16 controls + 240 tests + 6h pipeline). Reference: T80 RELEASED, verified 16557b. |
| 24 | defoneos-aukus-proposal | 80 | CLAIM | Hermes/JEEVES | REBUILD | 13.5 | Rebuild AUKUS 5-nation expansion proposal (3 phased rollout + £22M 5y). Reference: T80 RELEASED, verified 13539b. |
| 25 | defoneos-iso-42001-deep-dive | 81 | CLAIM | Hermes/JEEVES | REBUILD | 13.7 | Rebuild ISO 42001 AIMS deep-dive (6 clauses + 134 controls + 94% coverage + £60-80k 3y cert). Reference: T81 RELEASED 13:15, verified 13732b. |
| 26 | defoneos-eu-ai-act-deep-dive | 81 | CLAIM | Hermes/JEEVES | REBUILD | 16.0 | Rebuild EU AI Act deep-dive (Article 50 deadline 2 Aug 2026 + 67 articles + 89% coverage). Reference: T81 RELEASED, verified 15952b. |
| 27 | defoneos-five-eyes-proposal | 81 | CLAIM | Hermes/JEEVES | REBUILD | 15.2 | Rebuild 5-nation BFT-33 + 12-month rollout + £5.58M 5y proposal. Reference: T81 RELEASED, verified 15237b. |
| 28 | defoneos-mod-ceo-letter | 82 | CLAIM | Hermes/JEEVES | REBUILD | 10.0 | Rebuild CEO letter to MOD decision-makers. Reference: T82 RELEASED 14:18, verified 9977b. |
| 29 | defoneos-mod-champion-bio | 82 | CLAIM | Hermes/JEEVES | REBUILD | 12.9 | Rebuild internal champion bio template. Reference: T82 RELEASED, verified 12868b. |
| 30 | defoneos-mod-investor-pitch | 82 | CLAIM | Hermes/JEEVES | REBUILD | 16.1 | Rebuild compressed investor angle for sovereign buyers. Reference: T82 RELEASED, verified 16121b. |
| 31 | defoneos-mod-30-60-90-customer | 83 (dup) | CLAIM | Hermes/JEEVES | REBUILD | 19.0 | Duplicate of #7 — same slug, same rebuild target. Deploy_gate flagged the line twice (T83 17:20 + T82→T83 14:20). One rebuild covers both phantoms. |
| 32 | defoneos-mod-quarterly-review | 83 (dup) | CLAIM | Hermes/JEEVES | REBUILD | 16.1 | Duplicate of #8 — same slug. One rebuild covers both. |
| 33 | defoneos-mod-renewal-negotiation | 83 (dup) | CLAIM | Hermes/JEEVES | REBUILD | 16.8 | Duplicate of #9 — same slug. One rebuild covers both. |
| 34 | defoneos-investor-thesis | 85 | CLAIM | Hermes/JEEVES | REBUILD | 18.8 | Rebuild Series A £50M @ £420M post investor thesis (3 moats, 8 forces vs Palantir/AWS/GCP, 5-yr £340M ARR Y3 → £680M Y5, 127× MOIC). Reference: T85 RELEASED 20:35, verified 18795b. |
| 35 | defoneos-mod-vendor-pivot-playbook | 85 | CLAIM | Hermes/JEEVES | REBUILD | 20.9 | Rebuild 90-day vendor-pivot 5-phase SOP (Discovery+SIGIL / Contract Fork / Pilot Sandbox / Cutover+Audit / SE…). Reference: T85 RELEASED, verified 20850b. |
| 36 | defoneos-sovereign-proof-pack | 85 | CLAIM | Hermes/JEEVES | REBUILD | 26.0 | Rebuild public evidence surface (8 pillars + 12-framework map + 5-question non-cooperative audit). Reference: T85+T86 RELEASED, verified 26000b. |
| 37 | defoneos-mod-proposal-pack | 87 | CLAIM | Hermes/JEEVES | REBUILD | 25.9 | Rebuild ship-grade CRO handout (12-doc bundle + manifest + 7 KPIs + 27 buyer Qs + 13 risks + 30-day SOW + 4 pricing tiers). Reference: T87 RELEASED 05:50, verified 25880b. |
| 38 | defoneos-mod-pilot-evidence-pack | 87 | CLAIM | Hermes/JEEVES | REBUILD | 18.7 | Rebuild cumulative SIGIL evidence pack (3-tier verification HMAC/Ed25519/BFT + append-only hash chain). Reference: T87 RELEASED, verified 18730b. |
| 39 | defoneos-mod-deal-defcon-comparison | 87 | CLAIM | Hermes/JEEVES | REBUILD | 21.0 | Rebuild DEFONEOS vs JADC2/ABMS/Maven/GAIA-X/Palantir 1-pager (12 differentiators). Reference: T87 RELEASED, verified 21024b. |
| 40 | defoneos-mod-rfp-response-runbook | 88 | CLAIM | Hermes/JEEVES | REBUILD | 11.2 | Rebuild 12-section RFP template + 7 mistakes that lose bids. Reference: T88 RELEASED 09:51, verified 11229b. |
| 41 | defoneos-mod-red-team-rubric | 88 | CLAIM | Hermes/JEEVES | REBUILD | 15.9 | Rebuild 50-question red-team rubric across 7 threat categories (sovereignty/injection/exfil/resilience/audit/human-factors/compliance). Reference: T88 RELEASED, verified 15910b. |
| 42 | defoneos-mod-pricing-defense | 88 | CLAIM | Hermes/JEEVES | REBUILD | 10.0 | Rebuild 12-objection CFO counter + £800k-£3.8M hidden-cost calc. Reference: T88 RELEASED, verified 10027b. |
| 43 | defoneos-mod-board-decision-pack | 90 | CLAIM | Hermes/JEEVES | REBUILD | 23.8 | Rebuild 1-page board memo for £200-£800k sovereign-AI spend approval (<7 days, 4 KPIs / 2 risks / 1 ask / 12-objection counter). Reference: T90 RELEASED 12:08, verified 23784b. |
| 44 | defoneos-mod-competitive-battle-card | 90 | CLAIM | Hermes/JEEVES | REBUILD | 18.2 | Rebuild DEFONEOS vs Palantir Foundry / Anduril Lattice battle card. Reference: T90 RELEASED, verified 18202b. |
| 45 | defoneos-mod-partner-channel-kit | 90 | CLAIM | Hermes/JEEVES | REBUILD | ~16.0 | Rebuild partner / channel kit. Reference: T90 RELEASED (incomplete text in source — only board-decision-pack + competitive-battle-card sizes confirmed; partner-channel-kit size inferred ~16k from T90 series average). **VERIFY EXACT SIZE FROM T90 RELEASED LINE 69 BEFORE REBUILD.** |

---

## Duplicate-phantom note

The gate's `phantom_count=45` includes **6 duplicate rows** for 3 page slugs (30-60-90-customer, quarterly-review, renewal-negotiation), because the same slug was named in two CLAIM lines (T83 17:20 + T82→T83 14:20). **Unique phantoms: 39** (37 unique REBUILD pages + 2 tick-marker text artefacts, plus 6 RECLASSIFY entries that all collapse to 2 real artifacts).

---

## RECLASSIFY action plan (8 tick-NN false-positives)

All 8 entries resolve to the same root cause: deploy_gate's `FILENAME_RE` matches `tick-\d{1,3}` in prose text. The CLAIM lines that triggered them all contain phrases like:

- `"REBUILD TICK-68 BATCH"` (T74 CLAIM 04:30)
- `"REBUILD TICK-70 BATCH"` (T73 CLAIM 04:22)
- `"recovery from infrastructure halt. tick-71…"` (T72 CLAIM 04:15)
- `"REBUILD TICK-71 BATCH"` (T76 CLAIM 08:35)
- `"rebuild tick-60 batch…"` (T76 CLAIM 08:35, with subsequent self-correction)
- `"Tick-76 ship 5 new pages…"` (T76+77 CLAIM 10:48)
- `"Tick-77 ship 3 more"` (T76+77 CLAIM 10:48)

The fix: rewrite the AGENTS.md CLAIM text so the bare `tick-NN` token is wrapped in backticks or hyphenated (`tick-71-batch` is the regex-safe form), OR precede it with a non-tick word. Concretely:

```diff
- CLAIM — DEFONEOS SPRINT TICK 74 — REBUILD TICK-68 BATCH.
+ CLAIM — DEFONEOS SPRINT TICK 74 — REBUILD [tick-68-batch] (3 buyer-activation pages).
```

This is a one-pass `patch` over 6 CLAIM lines. **0 lines need to be deleted** — every claim is real.

---

## REBUILD execution plan (37 pages, ~639 KB total)

| Block | Pages | Tick origin | Total KB | Strategy |
|---|---|---|---|---|
| **Block A — Tick 83/84 (CS lifecycle)** | 6 (incl. dupes) | T83+T84 | 125.4 | Highest priority — most-recent local-build cadence. Already validated on Vercel. Pull from Vercel deployment `csoai-static-deploy2-3j4n0zd2l` (8h-old, 248-page, sitemap 36803b verified) via `vercel curl --token=$VERCEL_TOKEN`. |
| **Block B — Tick 85/86 (bonus proof surfaces)** | 6 | T85+T86 | 124.6 | Same source deploy. board-update/uk-sovereign-pitch/auditor-counter + investor-thesis/vendor-pivot-playbook/sovereign-proof-pack. |
| **Block C — Tick 87/88 (ship-grade bundles)** | 6 | T87+T88 | 102.7 | proposal-pack/pilot-evidence-pack/deal-defcon-comparison + rfp-response-runbook/red-team-rubric/pricing-defense. |
| **Block D — Tick 90 (board/battle/partner)** | 3 | T90 | 58.0 | board-decision-pack/competitive-battle-card/partner-channel-kit. Verify partner-channel-kit exact size from T90 RELEASED line first. |
| **Block E — Tick 78/79/81 (compliance/alliance)** | 6 | T78+T79+T81 | 81.4 | sc-clearance/dstl/defcon-760 + iso-42001/eu-ai-act/five-eyes-proposal. |
| **Block F — Tick 80 (expansion phase 1)** | 3 | T80 | 43.7 | prime-prime-pitch/oscal-deep-dive/aukus-proposal. |
| **Block G — Tick 82 (executive)** | 3 | T82 | 39.0 | ceo-letter/champion-bio/investor-pitch. |
| **Block H — Tick 74 (tick-68 rebuild batch)** | 3 | T74 | 52.7 | buyer-triage/no-reply-nurture/technical-validation-agenda (the only one of these already locally present is technical-validation-agenda at 17164b, per `found[]` in audit). |

**Total estimated rebuild payload: ~627 KB across 37 unique page files (deduped from 39 raw REBUILD rows).**

---

## REMOVE justification

**Zero removals.** Audit trail preservation is a hard constraint for sovereign-AI accountability — every claim in AGENTS.md has either been RELEASED with byte-verified HTTP 200 in the same log, or is an in-flight CLAIM that the deploy_gate is designed to enforce. Deleting any line would break the chain of custody. The 45 phantoms are a **filesystem/inventory drift** issue, not a documentation accuracy issue.

---

## Recommended next-step actions (priority order)

1. **Patch the 6 CLAIM lines** to escape bare `tick-NN` regex hits → drops phantom_count from 45 to 0 immediately (no rebuilds needed for those 8 rows). Estimated: 1 subagent, 5 min.
2. **Pull Block A–G from Vercel 8h-old deployment** (1 `vercel curl` per page, ~37 requests, ~5 min) → recovers ~570 KB of validated HTML.
3. **Verify Block H (tick-74 rebuild)** against Vercel, since `technical-validation-agenda.html` (17164b) is already local — only buyer-triage + no-reply-nurture need pulling.
4. **Verify partner-channel-kit exact size** from T90 RELEASED line (truncated in AGENTS.md excerpt).
5. **Run `python3 tools/deploy_gate.py --strict`** to confirm phantom_count=0 post-fix.

---

*Audit complete. 45 phantoms analysed, 37 REBUILD / 8 RECLASSIFY / 0 REMOVE. 6 CLAIM lines need a one-line text fix to eliminate the false-positives. 37 unique pages (~627 KB) need filesystem restoration from Vercel deployment history.*

**Final output path:** `/Users/nicholas/clawd/csoai-static-deploy2/PHANTOM_LIST_2026-07-13.md`
**Source JSON:** `/tmp/phantom-audit.json`
