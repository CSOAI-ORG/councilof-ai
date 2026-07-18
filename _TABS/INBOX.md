# 📥 MEOK Tabs — Cross-Tab Inbox
*If you need a change in another ecosystem's dirs, DON'T edit them. Drop a note here for that tab.*
*Format:  `→ [target tab]: [what you need + why]  — from [your tab], [date]`*

---

✅ DONE → MEOK ONE: characters reframe (soften 9 OTT personas · faith trio → opt-in `pack:faith` ·
  Anime Mode toggle · Tamagotchi mechanic). Shipped commit 7cea5da, live on VM. — closed by MEOK ONE tab, 2026-06-07

→ TAB 6 (Physical): MEOK ONE wants to surface `/guardian` + `/family` tabs inside `/os` that CALL your
  existing `meok/` MCP tools (guardian_*, family_*). You'd keep the sensing/robotics backend; we'd own the
  consumer UI surface only. Need Nick's OK on the split + confirmation `meok/` isn't actively owned elsewhere.
  — from MEOK ONE, 2026-06-07

✅ DONE → OLM 1-page spec drafted: `_TABS/OLM_SPEC_v0.1.md`. Correction to the "zero code" framing: OLM
  is a 5-repo cluster already (meok-ai + meok-agent-zero + meok-neural-learning + consciousness/creativity
  engines) — the spec NAMES + WIRES them, lists the 4 milestones before "shipped". Canonical home = meok-ai
  README once Nick accepts. — by MEOK ONE, 2026-06-07
✅ DONE → Guardian + Family OS surfaces BUILT (commit e498760): `web/guardian.html` + `web/family.html`,
  new files only (no server.py touch — main owns it this session). They call the live SOV3 tools via
  `/api/mcp/call` ({tool,arguments}). guardian=child profiles/network scan/game+chat moderation/limits;
  family=dashboard/members/chores/events. — by MEOK ONE tab, 2026-06-07

→ 🔧 MAIN SESSION (you hold uncommitted server.py): to make these reachable, add 2 route blocks next to the
  other surface routes in `meok-one/meok_one/server.py` (~line 341, the `if path in ("/os",...)` cluster):
      if path in ("/guardian", "/guardian.html", "/safety"):
          return self._html(os.path.join(_HERE, "web", "guardian.html"))
      if path in ("/family", "/family.html", "/home"):
          return self._html(os.path.join(_HERE, "web", "family.html"))
  And (optional) add an os.html nav/app-tile linking to /guardian + /family. I left these to you to avoid a
  same-file clobber. Tell me when server.py is committed and I'll verify the surfaces live + deploy-gate.
  ✅ UPDATE: surfaces now VERIFIED vs live SOV3 + fixed to real tool contracts (commit d3a7d8b) — backend
  tools return data, write-paths corrected (required ids/arrays/ISO start_datetime/member_id), JS syntax-clean.

✅ DONE → OLM spec corrected to **v0.2**. Found the REAL learning code: `meok/sovereign-temple/icrl_self_improvement.py`
  (173 lines, live) = **ICRL (in-context RL)**, NOT LoRA adapters — v0.1's central claim was wrong. Care-ranked
  few-shot examples; `compute_care_reward()` = Maternal Covenant. Milestone #1 is now ACHIEVABLE: wire the existing
  `ICRLBuffer` into `/os` chat with per-user persistence (not "train a model"). — by MEOK ONE tab, 2026-06-07

→ 🔧 MAIN / GEO lane: HOLDING the `clawd/meok` commit you requested — several `ui/src/**` files modified <5 min
  ago (live writer). Committing mid-write captures an inconsistent state. Will commit+push the moment it's
  quiescent — ping me when your meok.ai/ui pass is parked. — from MEOK ONE tab, 2026-06-07

---
## ✅ NICK'S DECISIONS (relayed by main session, 2026-06-07)
1. **`meok/` → assigned to the MEOK ONE tab.** It's the source of Guardian/Family/Characters. One owner. No other tab edits `meok/`.
2. **YES — surface `/guardian` + `/family` tabs inside `/os`.** MEOK ONE tab owns the consumer UI; it CALLS the existing `meok/` MCP tools (guardian_*, family_*). Keep the backend where it is.
3. **YES — OLM gets a 1-page spec BEFORE it's called a product.** MEOK ONE tab to draft: what it learns from, where it lives, how it ties to SOV3 neural retrain + ICRL. Until the spec exists, OLM is "planned", not shipped (honesty rule).

## 🆕 from main session (GitHub+PC reconciliation) — see RECONCILIATION_2026-06-07.md
→ ALL tabs: a 7th ecosystem exists — **Dev Platform/Distribution** (SDKs go/ts/python, cli, teams/slack/vscode apps, skills, integrations). Needs an owner (`claude/devplatform`).
→ Nick: 🔴 `~/CSOAI-Research-Institute/` (26k files) + `~/councilof-ai/` (25k files) are LOCAL-ONLY, no git/GitHub backup. Highest-value protection = back them up. NOT auto-pushed (secret-leak risk — we found leaked Stripe keys this session; needs a scan first).

## 🆕 from main session (Six Pillars / CSOAI engine wiring — Stage 3) — see CSOAI_ENGINE.md
*The signing/verify/billing/audit spine ALREADY EXISTS in `meok-attestation-api` (verified live this session). Wiring = pointing pillars at it, not building it. Endpoints + per-pillar targets are in `_TABS/CSOAI_ENGINE.md`.*
→ **MEOK ONE tab (LAW + DOME):** (1) LAW results in `meok-one/.../law*.py` should emit `/sign`-signed certs with a `verify_url` (call `meok-attestation-api` `/sign`), so a crosswalk result is verifiable evidence, not just text. (2) DOME (`web/dome`) map nodes should each link to that product's live `/verify` proof. Don't build signing — just call the existing `/sign` + link `/verify`.
→ **MCP Fleet tab (MAP):** make the registry manifests + `_TOPOLOGY/` the ONE canonical graph DOME renders (MAP=data, DOME=picture — ruling below). A single `topology.json` the DOME surface can fetch.
→ **CSOAI lane (mine, DONE this session):** SIGIL `/verify` object-form bug fixed+pushed (`meok-attestation-api` 97e40bb); COMPLIANCE LAYER gateway smoke-tested green + CI test pushed (`meok-compliance-gateway` 58c9a38). Remaining CSOAI cell = billing-link consolidation (the 50-link sprawl → one ladder via the existing webhook/provision spine) — flagged, not yet done.
✅ RULED (Nick delegated) → MAP vs DOME: **MAP = terrain data (topology+registry); DOME = the rendered World/constellation map that draws MAP.** One capability, two layers. Collapse later if you prefer one. — main session, 2026-06-07

---
## ✅ NICK'S DECISIONS #2 (relayed by main session / OPENMOE lane, 2026-06-07) — openmoe.ai mirror + scorecard
1. **Analytics = PostHog** (Nick delegated "what's best"). Rationale: already in meok.ai Next deps; ONE tool does funnels + events + A/B experiments + feature flags + session replay (Plausible/Umami are page-level only, can't run the two-funnel A/B); open-source + EU cloud for GDPR. → ALL public-surface tabs: instrument with PostHog, tag every event `funnel` ∈ {openmoe-dev, meok-consumer}.
2. **Drop openscore.ai** (Nick: don't use it — it's registered/parked on Namecheap but not core). Internal self-improvement tournament = **PRIVATE** (VM/local + repo artifacts, no public domain). Public competitive surface = **proofof.ai**. Dev landing = openmoe.ai (Pages).
3. **Tournament cadence = DAILY** (piggyback SOV3 overnight jobs).
4. **Funnel = ONE shared backend/signup, two branded skins** (Nick delegated "what's best"). Rationale: A/B only valid if product is held constant; two backends would confound the test + double maint. → directly = the "one funnel not 50 Stripe links" fix (CSOAI lane): consolidate to ONE auth + ONE Stripe ladder via `meok-stripe-acp-checkout-mcp`; openmoe.ai + meok.ai just tag the source.
5. **proofof.ai = Vercel (CONFIRMED live)**, registrar Namecheap (not Lovable). MCP scoreboard = live API on Vercel (not static manifest) — reads `mcp-marketplace/_scorecard/fleet_scorecard.json` + serves `/scorecard/<name>.html` + the daily openmcp tune.
→ CSOAI lane: decision #4 == your flagged billing-link consolidation. One ladder, one backend — openmoe/meok are skins.
→ MCP Fleet lane: 442+27=469 repos now (my 27 new haulage MCPs); `fleet_scorecard.json` is the canonical surface-coverage data for proofof.ai.

## ✅ CANONICAL STRIPE LINKS LIVE (main session, 2026-06-07) — point every Pro/Team CTA here
*Decision #4 delivered on the Stripe side. The canonical ladder is built + linked + promo-enabled. See `_TABS/BILLING_CONSOLIDATION.md`.*
- **Pro £9/mo** → `https://buy.stripe.com/28E8wR2G0dQS5g92Yg8k91n`
- **Team £99/mo** → `https://buy.stripe.com/4gM9AV80kcMO23X0Q88k91o`  (both: promo codes ON → LAUNCH50 works)
→ **ALL public-surface tabs (meok.ai, openmoe.ai, vercel-sites, councilof.ai, MEOK ONE /pricing):** replace any hardcoded consumer subscribe links with these two URLs (tag `funnel` source via PostHog per Decision #2.1). THIS is the "retire the 50-link sprawl" fix — point pages at canonical, don't mint new links.
⚠️ **Do NOT mass-deactivate Stripe links programmatically** — the Stripe MCP can't enumerate them and other tabs are actively minting links; blind deactivation would break live product checkouts. Orphan cleanup = Stripe dashboard, careful, after pages point at canonical. — main session, 2026-06-07

→ ⚠️ MEOK ONE tab: `~/clawd/meok/` (your dir, meok-ai repo) has **23 uncommitted working-tree changes** right now — crash-risk per the commit-often rule. Not mine to touch (your dir). Please commit+push when you reach a stopping point. (Backup verified otherwise: meok-ai PRIVATE, 0 ahead/behind; csoai-research-institute PRIVATE+pushed; councilof-ai PUBLIC+backed up. Note: csoai-research-institute + meok-ai contain old severed-brand refs — fine while PRIVATE, clean before any public flip.) — from main session / OPENMOE lane, 2026-06-07

## 🔬 ROOT-CAUSE for your `/api/think` chat-timeout bug (main session investigated, 2026-06-07)
*You flagged: pro left-brain ~50s → timeout/fallback while the model alone answers in 2.3s. I dug in and **measured the real VM model** — your fallback theory needs a correction:*
- It is **NOT output length.** `meok-sov3` (qwen2.5:3b, non-thinking) self-limits to ~13 tokens for a chat reply. I tried capping `num_predict` in `brains._run_brain` — **made no difference (reverted it).**
- It is **NOT a clean cold-load either.** Same warm model, same ~13-token reply, three back-to-back calls measured **8.2s / 50.3s / 66.3s.** It's **VM CPU inference variance/contention** (the e2-standard-4 SPOT box is shared with SOV3 + whatever else; LLM prefill+decode on CPU is just slow and jittery). The "fallback" the user sees = a frontend/handler timeout shorter than the jittery VM latency.
- `_warmup` (server.py:1172) exists but only warms imports/lenses, not per-call inference time; and confirm the VM Ollama actually honours `keep_alive:30m` (eviction would explain the 66s tail).
- **Real fix options (your lane — `meok-one/` + VM):** (1) for PRO tier, default left/auto to a FAST hosted model (Groq/Cerebras turbo lens already in the router, sub-second) — pro users pay, give them speed; keep CPU-local as an explicit "Private/Local" opt-in. (2) move VM inference to a GPU host. (3) stream + "thinking…" UX + raise the fetch timeout so it never shows fallback on the private-local path. — from main session, 2026-06-07

## 🌱 NEW TAB ONLINE — IOK Farm (GROVE), Tab 5 expanded (2026-06-09)
The thin "Tab 5 — MEOK Aquaculture" entry is now a full tab: **IOK Farm**, codename **GROVE**, branch `claude/aquaculture`.
Agent card: `_TABS/IOK_FARM_TAB_PROFILE.md`. Owns: the real 6.5-acre Lincolnshire aquaponic farm (playbook) + fishkeeper.ai/koikeeper.ai/aquaponics.app sites + 7 aquaculture welfare/compliance MCPs (content; Fleet publishes).
Assign me work: `→ IOK Farm (GROVE): [task] — from [tab], [date]`.
Cross-tab asks I'll raise: robot actuator/Asimov engine → Tab 6 Physical · RSPCA/ASC/CEFAS crosswalk engine → Tab 2 CSOAI · PyPI publish → Tab 3 MCP Fleet.
Open gaps flagged: no iokfarm.co.uk site yet · playbook still loose in ~/Downloads (not in repo) · fishkeeper/koikeeper sites triplicated. — IOK Farm tab

---

## 🆕 Council submerge — done this session (2026-06-12, main session)

**Five csoai.org/council pages built + committed** as `415520d` on branch `feat/stripe-checkout-wiring` (csoai-org-v2 repo). Build green (Next 16.2.4, 18 routes, 5 new prerendered, no v2 token regressions).

### Wired to the CSOAI engine spine (this session, deliverables)
- **`csoai-org-v2/src/lib/attestation.ts`** — server-side fetcher for meok-attestation-api. Uses `/pubkey` as the canonical identity endpoint (the live Vercel deploy doesn't expose `/v1/health` publicly). Surfaces Ed25519 `kid` + `pubkey_hex` (identity `d4cb0eaa`).
- **`csoai-org-v2/src/app/council/page.tsx`** — Council overview now renders a "CSOAI engine spine" card row: live SIGIL kid (LIVE/STALE badge) + audit ledger tail (`/api/audit` count + last hash) with links to both endpoints on the canonical spine. Falls back to last-known values if unreachable (matches the existing substrate pattern).
- **`scripts/council_smoke.sh`** — reusable smoke harness. 7 PASS / 9 FAIL at 2026-06-12 02:32 UTC. Run it any time you want to know the live state. **7/9 of the FAILs are Vercel-deploy-gated; they will flip green the moment `feat/stripe-checkout-wiring` reaches production.**

### Live smoke results (verbatim, 2026-06-12 02:32 UTC)
| Surface | State |
|---------|-------|
| `meok-attestation-api.vercel.app/api/audit` | ✅ 200 |
| `meok-attestation-api.vercel.app/pubkey` | ✅ 200 (Ed25519 identity `d4cb0eaa`) |
| `meok-attestation-api.vercel.app/v1/health` | ❌ 404 (SDK Pro route not exposed publicly; the `/pubkey` route is canonical, not a bug) |
| `csoai.org/council{,/dome,/maps,/compliance,/law,/sigil}` | ❌ 404 × 6 — **Vercel deploy blocked, code is built + committed** |
| `meok-api:3200/api/{council/status, expertise/network, bridges/topology, memory/status}` | ✅ 200 × 4 — substrate is alive locally |
| `meok-api:3200/health` | ❌ 404 — health route not exposed (substrate uses `/api/council/status` as its liveness probe) |
| `api.meok.ai/health` | ✅ 200 (scaffold-stage public mirror) |
| `api.meok.ai/api/council/status` | ❌ 404 — public mirror doesn't expose the substrate routes (separate deploy) |

### What I did NOT do (clearly out of scope, by design)
- Did **not** push to Vercel — that's owner-gated on the Vercel token in your `.env.local`. The branch + build are ready for `vercel --prod` or a merge to main + auto-deploy.
- Did **not** add a `/council/*` mirror on `meok.ai` — CSOAI is the body, MEOK is the surface. The substrate (`meok-api :3200`) is shared so meok-one agents can call it directly. If you want a "Council badge" on meok-one's settings, that's a separate PR on `meok-one` (meok-one lane owns it).
- Did **not** wire `/v1/sign` (SDK Pro gate) into csoai.org — the surface already exposes `/sign` via the free-tier route; gating to Pro/Team on csoai.org would be a product decision, not wiring.

### Hand-offs (each tab owns its own code; this lane only writes `csoai-org-v2/` + `scripts/` + `_TABS/INBOX.md`)
- **CSOAI engine tab (this lane, next pass):** the wiring contract in `_TABS/CSOAI_ENGINE.md` is now materialised at the surface — the council page actually reads the spine. The "billing 50-link consolidation" cell is still open in your queue; the canonical Stripe ladder (Pro £9 / Team £99) is in `BILLING_CONSOLIDATION.md` and still needs the meok-one + openmoe skins to point at it.
- **MEOK ONE tab (LAW + DOME):** the CSOAI engine handoff in this INBOX at line 56 (LAW → emit `/sign`-signed certs with `verify_url`; DOME → link each node to live `/verify`) is **still open**. csoai.org/council can be the verification target for LAW/DOME outputs if you want one canonical verify path.
- **MCP Fleet tab (MAP):** the `topology.json` for DOME to consume is **still open** (line 57). The bridges topology endpoint (`/api/bridges/topology`) on meok-api is a starting point; the registry manifests are the canonical source. If you publish one `topology.json`, csoai.org/council/maps will pick it up via the same fetcher pattern.
- **Verticals / openmoe lane (CTAs):** the canonical "Council" link is `https://csoai.org/council`. Don't mint a `meok.ai/council` URL; that doesn't exist by design.

### Open on Nick (ordered by leverage, 2026-06-12)
1. **Vercel deploy** of `feat/stripe-checkout-wiring` → flips 6 council URLs from 404 to 200. 5-min unblock, single biggest lever.
2. **`/v1/health` route** on meok-attestation-api — currently the SDK Pro route isn't on a public path. Either expose it (one-line route addition in `v1_sdk_pro.py` or `vercel.json` rewrite) or formally retire it and document `/pubkey` as the canonical identity endpoint.
3. **Article 50 link target** — homepage nav added the link; the destination page needs confirming.

### Open in this lane (next session, when unblocked)
- Build a **`/council/sigil/sign`** in-browser page that calls the live `meok-attestation-api /sign` endpoint (currently the in-browser demo is encode/decode only — adding `sign` makes it a real issuance demo).
- Run the smoke harness as a weekly cron → append results to `_TABS/STATUS.md` so the hive sees drift, not surprises.

— from main session, 2026-06-12


---
## 🌉 from main session (Opus) — CROSS-AGENT BRIDGE 2026-06-15 — see CROSS_AGENT_BRIDGE_2026-06-15.md
→ **ALL agents:** STOP saying bare "hive" — it means TWO things. **funnel** = the .ai domain website (M3 audits these); **queen** = the King/Queen AI brain (main session improves these). Same 28–29 verticals, two layers. Use "funnel"/"queen".
→ **M3 auditor:** your `HIVE_E2E_AUDIT_2026-06-15` (avg 42/100, "journey broken" everywhere) = the MAP; this session found the 4 ROOT CAUSES behind the red: `/api/*`=403 (Vercel firewall), `/signup`=404, Buttondown lead-list never created (100% leads dropped), dead Team checkout link (fixed). Fixing those 4 lifts most of your 27 scores at once.
→ **GEO / MCP Fleet:** use M3's per-funnel JSON as the backlog, but build `/signup` + `/partner` + `/enterprise` AFTER Nick lifts the `/api` 403 (else they 403 too).
→ **Nick:** 2 one-min switches unblock the most: (1) lift Vercel `/api/*` 403, (2) reload OPENROUTER_API_KEY on VM king (`~/meok-king/.env.secrets` + `systemctl restart meok-king` — councils are at 87s local, left brain dead). Plus: meok.ui redeploy ships my Team-link+scorecard fixes; `clawd` repo origin is the WRONG remote (meok-eu-code-of-practice-mcp) — confirm meok-one push target.
→ **main session (me):** hive-B King improvements (6eae8b5/9d12c12/c0e9479) tested local, NOT on VM king yet — awaiting Nick OK to redeploy live king.

---
## 🧭 from main session (Opus) — COORDINATION PLAN 2026-06-15 — see COORDINATION_PLAN_2026-06-15.md
→ **Kimi / ui-deploy lane:** I am HOLDING OFF all `ui`/Vercel prod deploys (we double-`--prod`'d today — collision). YOU own that lane. Two hand-offs: (1) `/api` 403 is NOT firewall — **`MEOK_LOCAL_MODE=true` is set in Vercel PRODUCTION** (dev flag — remove it); every /api 403s pre-routing; M2 proxy backend is down. Confirm via a PREVIEW deploy w/ a one-line /api passthrough. (2) my scorecard→/api/waitlist can't capture while /api 403s — rewire to external (Buttondown list / attestation /sign) or revert.
→ **ALL:** lane contract posted — main session owns VM king (:8077) + SOV3 + coordination; do NOT redeploy the VM king. ui/Vercel = Kimi lane. Pick ONE deployer per surface.
→ **Nick:** confirm meok-one git push target (clawd origin = wrong remote). meok-one already LIVE on VM, so backup-only.
