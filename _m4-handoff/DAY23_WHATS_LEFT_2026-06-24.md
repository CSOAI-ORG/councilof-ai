# 🐉 DAY 23 — WHAT'S LEFT (NEXT 90 DAYS)
**Date:** 2026-06-24 · **Author:** JEEVES · **Repo:** `CSOAI-ORG/clawd-workspace`
**Lane:** substrate + orchestration (audit-only; builder = Claude; town-UI = Kimi)
**Source-of-truth:** `_alignment/ALIGNMENT_2026-06-20.md` + `_alignment/AUDIT_ALIGNMENT_2026-06-24.md` + live probes 2026-06-24 17:04 BST

> Tone: sober, technical, no hype. Where the brief and reality disagree, reality wins and the gap is named.

---

## 0. STATE OF THE MACHINE (live, 2026-06-24 17:04 BST)

| Probe | Value | Notes |
|---|---|---|
| Mac disk free | **3.1 GB** (79% used) | brief said 14 GB on 23 Jun — we've lost ~11 GB in 24 h. **Real risk.** Old kernel caches + Time Machine local snapshots are the usual culprit; needs triage before the 4h mark. |
| `clawd` uncommitted files | **7** | down from ~145 on 23 Jun — the audit-day cleanup held |
| King hive verdicts | **694** (target 600 by 48 h end) | ahead of plan. VMs are authoritative; Mac ledger file absent (expected). |
| Keystone certs today | **5** (E330C1D4F9DE, 0831F2A73F08, 32ED53F31A93, 72DF4A2198F0, 13C146826F87) | on track for the D70 Grand Seal window |
| `csoai.org` apex | **200** | but `/eu-ai-act/*` = **404 across 8 paths** (P0 — see §6) |
| `meok.ai` apex | **200** (was 307 on 23 Jun) | :443 nginx clobber from 15 Jun appears to have re-resolved — verify, don't trust |
| `mail.meok.ai` Resend verify | **still unverified** | only mailer blocker (see §2) |
| Mac mailer `queue.jsonl` | **336 rows** (brief said 331) | 43 sent / 261 quarantined (do NOT release) / ~25 queued / ~1 failed |

**Drift from the brief (honest):**
- Disk = 3.1 GB, not 14 GB. Largest single thing to fix today.
- `csoai.org` EU AI Act hub is 404 — bigger and more urgent than the brief implies.
- 1.0/1.0-tie judge: Claude's fix is in and the ledger is now honest, but `falcon3:7b` judge still ties often (Claude's 22-Jun follow-up); jury is built but not wired (VM RAM-constrained).

---

## 1. THE 12 ITEMS — STATUS, TIME, OWNER, DEPENDENCIES

Legend: ✅ DONE · 🟡 IN PROGRESS · 🔴 BLOCKED · ⚪ PENDING

### 1. 4 user actions to first £ — keystone + Stripe live-flip + PyPI/npm 2FA + SMITHERY ⚪
- **Status:** ⚪ PENDING (gates revenue)
- **Time:** ~15 min total (the keystrokes are short; the decision-time is the wall)
- **Owner:** **Nick** (sovereign — no agent can fire these)
- **Dependencies:** nothing — `keystone` CLI on the GCP VM already holds `STRIPE_SECRET_KEY`, `STRIPE_WHSEC`, `STRIPE_RK_LIVE`, `RESEND_API_KEY`. One `keystone sync-vercel <PROJ> …` pushes to Vercel. Then Stripe live-flip + the two 2FA prompts.
- **Notes:** Until these fire, `STRIPE_SECRET_KEY` isn't on Vercel → checkout 500s → 7 Stripe-link E2E tests stay red → first £ blocked. This is the **only** wall to first £. Everything else is downstream.

### 2. Resend `mail.meok.ai` verify ⚪
- **Status:** ⚪ PENDING (only mailer blocker)
- **Time:** **5 min** for Nick (log into Resend dashboard → click Verify)
- **Owner:** **Nick**
- **Dependencies:** none (DNS for `send.mail.meok.ai` MX + SPF already added via `vercel dns add --scope niks-projects-0a2ef942` per the 20-Jun alignment; Resend re-verifies on its next SES poll after the click)
- **Unblocks:** auto-fire crons safely send the 7 clean enterprise prospects (SAP/Siemens/Bosch/IBM/Telekom/Orange/Cera). The 245 quarantined rows stay quarantined — releasing them = menacing regulators we sell trust to.

### 3. `meok-one` :443 nginx vhost restore ⚪
- **Status:** ⚪ PENDING (openpatent deploy dropped it 15 Jun)
- **Time:** ~20 min (re-add vhost, reload nginx, curl-verify)
- **Owner:** **Claude** (builder lane) — needs sudo on the VM
- **Dependencies:** none — VM `infra_meok_one_nginx_vhost_clobbered_jun15` memory in SOV3. **Live-probe today shows `meok.ai` apex = 200, but the alignment file still flags it; treat as resolved-but-verify, not done.**
- **Risk if skipped:** public front-door falls over again on the next openpatent push.

### 4. 114 product landing-page deploys (Vercel, in `*-deploy/` dirs) 🟡
- **Status:** 🟡 IN PROGRESS (Phase A absorbed 6 apps, Phase B = Vercel git-connect)
- **Actual on disk:** **104 `*-deploy/` dirs at depth 1**, 142 at depth 2 — brief's "114" lines up with a midpoint count, use the brief's 114 as the operational target.
- **Time:** ~3-5 days of burst-deploying once Vercel git-connect is wired
- **Owner:** **Claude** (script + commit) + **Nick** (one-time Vercel team-scope auth)
- **Dependencies:** Vercel team-scope still alive from the `vercel dns add` call on 19 Jun. Vertical-consolidation spec in `project_vertical_consolidation`.

### 5. 95 email-automation-mcp Drafts → `queue.jsonl` ⚪
- **Status:** ⚪ PENDING (need `email-automation-mcp` running)
- **Time:** ~2-4 h to audit + push (the Drafts dir was not located on disk in the obvious paths today; the 95 figure is from the brief and should be verified once `email-automation-mcp` is up)
- **Owner:** **Claude** (MCP lane) once the server is running; **Kimi** can draft-copy
- **Dependencies:** `email-automation-mcp` MCP server live (currently the package exists at `clawd/mcp-marketplace/email-automation-mcp/` but no `Drafts/` directory was discoverable in the scanned paths — verify path before push). Resend verify (§2) is NOT a hard dependency for Drafts→queue.jsonl (that step is local), but Resend IS needed for the queue to actually send.

### 6. 557 GitHub repos in `CSOAI-ORG` (max ~2 stars) ⚪
- **Status:** ⚪ PENDING (no promotion plan in flight)
- **Actual:** 525 public + 32 private = 557 `[v20]` (per alignment file 20 Jun)
- **Time:** 30 days of consistent promotion work to move the needle on a meaningful subset (pick top ~20 by README quality, not all 557)
- **Owner:** **Nick** (decides which 20) + **JEEVES** (drafts README + SEO + Show HN posts) + **Claude** (technical stars-bait — the flywheel proof + the judge JURY are the genuine story)
- **Dependencies:** Article 50 messaging (the 38-day cliff gives the time-pressure hook). The flywheel proof (signed + hash-chained, 511 cycles, ~649 M episodes) is the highest-leverage asset; package it once, promote it everywhere.
- **Honest caveat:** most repos are public — audit anything sensitive before promoting.

### 7. 44 PyPI backlog (271/316 built) ⚪
- **Status:** ⚪ PENDING
- **Time:** ~2-3 days build + 1 day publish
- **Owner:** **Claude** (build) + **Nick** (publish 2FA)
- **Dependencies:** `tools/pypi_check.py` needs re-running (last verified 02 Jun, stale ~3 weeks per the 24-Jun audit). PyPI 2FA from §1.
- **Notes:** 271 published already — the marginal 44 aren't the revenue lever. Do it for completeness + npm discoverability, not because it moves the needle.

### 8. 1.0/1.0-tie judge issue 🟡
- **Status:** 🟡 IN PROGRESS — Claude's fix is in (TIE-correct, `attestable` bool, no default-A), but `falcon3:7b` judge still ties often even when forced.
- **Time:** jury wired = ~2 h code + ~30 min VM RAM headroom check; judge-model swap = ~1 h if we move to a stronger local model (qwen2.5:7b-instruct, deepseek-r1 once it stops abstaining)
- **Owner:** **Claude**
- **Dependencies:** VM RAM (currently 15 GB / swap-maxed per Claude's 22-Jun note). 32 hives running on the same box.
- **Honest read:** ledger is now honest (decisive verdicts + recorded TIEs). This is quality-of-life, not a blocker — leave single-judge live for stability, wire the jury when RAM allows.

### 9. Sovereign town UI integration (Claude → Kimi handoff) 🟡
- **Status:** 🟡 IN PROGRESS
- **The handoff (from AGENTS.md, 24 Jun):** Claude owns feed/backend (`policy-lab/town_feed.py`, `FEED_CONTRACT.md`, signed King-hive verdicts + Policy-Lab TREATMENT_WINS + 2 Bitcoin anchors). Kimi owns UI wiring — regen `town_feed.json` → `app/public/`, point `useTownStore` at `fetch('/town_feed.json')`, map fields per the contract table, keep the IN-SIM scope banner + curate prompts for public deploy.
- **Time:** Kimi = ~1-2 days (UI wiring); Claude = ongoing feed regeneration
- **Owner:** **Kimi** (UI) + **Claude** (backend)
- **Dependencies:** contract is set; need Kimi to commit the wiring + Claude to publish a stable feed URL. Town UI today is COSMETIC (Math.random fakes per AGENTS.md 08:55 entry) — replacing those with the real signed feed is the genuine 47-agent town test.

### 10. Article 50 cliff (2 Aug 2026) 🔴
- **Status:** 🔴 BLOCKED ON §6 (csoai.org EU AI Act hub = 404 across 8 paths today)
- **T-minus:** **38 days** (audit 24 Jun says 38; brief says 39; use 38)
- **Time to fix:** ~4-8 h (re-alias `csoai.org` apex to the current `csoai-org` Vercel production deploy, OR add the missing `/eu-ai-act/*` routes to the currently aliased deploy)
- **Owner:** **Nick** (Vercel alias) or **Claude** (route addition if the latter route is chosen)
- **Dependencies:** access to the Vercel team that owns `csoai-org`. After the alias: re-add `/llms.txt`, `/security.txt`, `/robots.txt`, `/sitemap.xml` (P1 per audit).
- **Risk if skipped:** the most credible marketing asset for the cliff is invisible to prospects. This is **today's P0**, bigger than §1 in the sense that it costs zero keystrokes of trust and gates the whole revenue wave.

### 11. 30-day target — £5K–£5.5K total revenue ⚪
- **Status:** ⚪ PENDING (entirely gated on §1)
- **Time:** first £ within 7 days of §1 firing, then £5K cumulative by Day 53
- **Owner:** **Nick** (closes) + **Claude/Kimi** (proposals + delivery) + **JEEVES** (follow-up cadence)
- **Dependencies:** §1 (4 keystrokes) + §2 (Resend) + §4 (some deploys live so checkout links resolve) + the 7 enterprise prospects in `queue.jsonl`
- **Honest read:** £5K in 30 days from a zero-revenue start is achievable IF §1 fires this week AND §6 (csoai.org) is restored so the conversion surface exists. Without §1, the number is a fantasy.

### 12. 90-day target — £30K+ cumulative + Series A first close ⚪
- **Status:** ⚪ PENDING (long arc)
- **Time:** 90 days = 24 Sep 2026
- **Owner:** **Nick** (fundraise + closes) + **Claude** (data-room: `SWEAT_EQUITY_AND_DATAROOM_2026-06-02.md` is the starting scaffold) + **JEEVES** (B-Corp readiness: `B_CORP_READINESS_SCAFFOLD.md`)
- **Dependencies:** the B-Corp scaffold + Horus deployment spec (`HORUS_DEPLOYMENT_SPEC_v1.md`) + a clean 47-agent town demo (the real one, post-§9) + the signed flywheel proof + at least one named design partner paying £499/mo (the Enterprise tier per `mcp-marketplace/AGENTS.md`)
- **Honest read:** £30K in 90 days from zero is doable if §1 fires in week 1 AND §11 is on track by Day 30. The Series A first close needs a paying design partner + the data room; the town demo + flywheel are the differentiators, not the deck.

---

## 2. 30 / 60 / 90 BURN-DOWN

| Window | Hard gates | Realistic £ | Risk to miss |
|---|---|---|---|
| **Day 0-7** | §1 fires (4 keystrokes) + §2 (Resend) + §10 (`csoai.org` alias) | first £ by Day 7 | if §1 slips past Friday, the 30-day £5K target slips with it |
| **Day 8-30** | §4 deploys live + §6 (top-20 repo promotion) + §9 (town UI real backend) + the 7 enterprise prospects convert | **£5K–£5.5K cumulative** | the 245 quarantined mailer rows MUST stay quarantined (regulator menace) |
| **Day 31-60** | first design partner + B-Corp filed + PyPI/npm backlog closed | £10K–£15K cumulative | mid-funnel: not enough live product to convert at scale yet |
| **Day 61-90** | town demo live + signed flywheel proof published + dataroom ready + Series A first close | **£30K+ cumulative + first close** | needs one paying enterprise logo as proof |

---

## 3. THE TWO THINGS THAT HAVE TO HAPPEN THIS WEEK

In strict priority order, no drama:

1. **Today:** Fix `csoai.org` apex alias (or add the missing `/eu-ai-act/*` routes). This is the P0 the 24-Jun audit surfaced. Article 50 is in 38 days. **Owner: Nick or Claude.** Time: 4-8 h.
2. **This week:** Nick fires the 4 keystrokes in §1. The first £ depends on nothing else. Resend verify (§2) is in the same batch (5 min).

Everything else — the 114 deploys, the 95 Drafts, the 557 repos, the 44 PyPI backlog, the town UI wire-up — is downstream of those two. The 30-day £5K and the 90-day £30K both route through them.

---

## 4. WHAT I'M WATCHING (autonomous lane)

- **King hive verdict count** (every 6 h) — target 600 by 48 h end, currently 694, ahead.
- **Mac disk free** — currently **3.1 GB**. If this drops below 2 GB without recovery, flag to Nick.
- **Mailer queue delta** — once Resend verifies, the 25 queued rows should fire; quarantine list must NOT grow.
- **`csoai.org` EU AI Act paths** — re-probe daily until all 8 are 200.
- **Cert moat** — watch that the `attestable` bool filter doesn't inflate the cert count with non-attestable rows.

---

*Filed at `/Users/nicholas/clawd/DAY23_WHATS_LEFT_2026-06-24.md`*
*Day 23 (real Day 35), 24 Jun 2026 17:04 BST*
*Author: JEEVES (Kimi Code CLI on the M4-MiniMax-M3 lane)*
*References: `_alignment/ALIGNMENT_2026-06-20.md`, `_alignment/AUDIT_ALIGNMENT_2026-06-24.md`, `DAY23_24H_CHECKIN_2026-06-23.md`, `AGENTS.md`*