# MEOK LABS — MASTER ALIGNMENT
**Date:** 2026-06-02 · **Author:** Claude (Opus 4.8, builder lane) · **Repo:** `CSOAI-ORG/clawd-workspace` (private)
**Purpose:** Single source of truth for all live work, verified against disk/git/curl/Stripe/SOV3 this session. Supersedes the scattered root-level `MEOK_*`/`SOV3_*` docs for *current state*. Read this first.

> This doc is honest about what is REAL vs ASPIRATIONAL. Where memory and reality disagree, reality wins and the gap is named.

---

## 0. Operating protocol (how the agents coordinate)

Per `MEOK_DUAL_AGENT_PLAN_2026-06-02.md` + `AGENTS.md`:
- **Claude (me)** = builder lane. Ships code, fixes, memory, commits. Owns `meok-one/`, `sovereign-temple/`, `MEMORY.md`.
- **MiniMax M3** = auditor lane. Writes `_findings/` only (read-only audits, incident reports, drift detection). Proposes; does not edit code/memory.
- **Nick** = sovereign. Fires, decides, holds the keys.
- Git discipline: pull → work → `git add -A && git commit && git push`. Branch in use: `claude/meok-one`.

---

## 1. VERIFIED STATE (2026-06-02)

### Counts (canonical — corrects all prior drift)
| Metric | Value | Source |
|---|---|---|
| MCP marketplace dirs (local) | **345** | `_findings/RUNDOWN_2026-06-02.md` live count |
| …with `pyproject.toml` | 316 | same |
| …with `server.py` | 314 | same |
| **Published on PyPI** | **271** | `MEOK_PYPI_TRUTH_2026-06-02.md` + `tools/pypi_check.py` (live curl) |
| Built-but-unpublished backlog | 44 | same |
| GitHub `CSOAI-ORG` repos | **422** (410 public / 12 private) | `gh repo list` this session |
| GitHub stars (max on any repo) | 2 | audit — effectively zero traction |
| SOV3 inner tools | 110 | RUNDOWN |
| Gateway `MCP_REGISTRY` | 22 slugs / 99 tools | RUNDOWN |
| SOV3 memory episodes | 8,121 | system_status earlier this session |
| SOV3 consciousness level | 0.787 | system_status |
| SOV3 trained neural models | 6 (care_validation, partnership_detection, threat_detection, relationship_evolution, care_pattern, creativity_assessment) | system_status |

**MEMORY.md drift to fix:** index still said 264/323 → corrected to **271/316** this session.

### Infrastructure
- **Machine:** M4 (nicholas@192.168.50.105) runs MEOK + SOV3. M2 (iokfarm@192.168.50.176) runs safety/AI domains + mesh (per AGENTS.md). This checkout = M4.
- **SOV3** `:3101` — was **P0 DOWN** this morning (guardian restart-storm). **Fixed this session** — see §7.
- **Ollama** `:11434` — UP but **0 models loaded** (needs `ollama pull` of the working set).
- **Stripe** `acct_1TLlEKQvIueK5Xpb` (MEOK AI LTD, GBP, livemode) — fully operational, used live this session.
- **gh CLI** — authenticated as CSOAI-ORG with full scopes (`repo`, `admin:org`, `workflow`, `write:packages`). No auth blocker.
- **Disk:** 22 GB free (44% used). Backups rolling 6h in `.backups/`.

---

## 2. THE FIVE INDUSTRY VERTICALS

1. **Compliance/Governance (core revenue)** — EU AI Act, DORA, NIS2, CRA, ISO 42001, AI-BOM, the 12 CSOAI crosswalks ("MEOK LAW", commit `8439b15`). 33 compliance repos, the Stripe catalogue's backbone.
2. **Optometry** — optomobile.ai, templeman-opticians.com (real family business, £2.5–5K/mo). Nick's domain expertise.
3. **Haulage/trade** — haulage.app umbrella + planthire/muckaway/grabhire + 7 trade MCPs. Lead-gen live.
4. **CobolBridge** — legacy modernization MCPs (COBOL→modern). Stripe products live (£999/mo Substrate).
5. **Aquaponics + aquaculture (NEW — launched this session)** — see §2a.

### 2a. Aquaculture vertical — LIVE LAUNCH STATE
7 MCPs built (`mcp-marketplace/`): rspca-aquaculture (694 LOC), uk-fhi (597), koikeeper-ai (552), aquaponics-monitor (403), asc-rspca-crosswalk (343), laia-aquatic (270), soil-assoc-organic-aqua (intentional stub, ships when SA 2026 standard publishes).

**Stripe — LIVE on `acct_1TLlEKQvIueK5Xpb` (full IDs in `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md`):**
| Product | prod_id | £/mo | Pay link |
|---|---|---|---|
| RSPCA Aquaculture (moat) | prod_UZmYFoVhB69Zvf | 499 | buy.stripe.com/8x28wR0xS7su23X7ew8k90z |
| UK FHI (mass) | prod_UZmYQRGKNev69C | 79 | buy.stripe.com/aFa5kF3K41465g9fL28k90B |
| Aquaponics Monitor | prod_UZmY79z4I0dAqi | 29/79 | buy.stripe.com/aFa28t80k9ACdMF1Uc8k90D |
| ASC×RSPCA×GG.A.P Crosswalk (flagship) | prod_UZmYwqVfTFpl9f | 999 | buy.stripe.com/8x25kF4O85kmfUN42k8k90G |
| LAIA Aquatic | prod_UZmZdqqSsZKu61 | 29 | buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I |

Plus pre-existing consumer: FishKeeper £4.99/mo, KoiKeeper £7.99/£19.99/mo. fishkeeper.ai + koikeeper.ai live (Lovable+Supabase, redirect→meok.ai, embed meok-trust-bar widget).

**Market thesis (validated by 2026 research, §4):** ~290 UK trout farms, ~83 ASC-certified sites, each paying £800–£2,500/yr to human compliance consultants — no SaaS exists. Sainsbury's 100% ASC, Co-op 100% by 2027, RSPCA trout standard (177 new clauses, mandatory slaughter-CCTV) live 23 Jul 2025 = forced-migration selling calendar. Vertical-farm capital cycle is DEAD ($1.37bn torched: Plenty, Bowery, AeroFarms, AppHarvest, Iron Ox, Upward Farms) → vacuum, not competition.

**Distribution blockers (Nick's hand):** PyPI publish of 7 MCPs (gh auth is ready), meok.ai/aquaculture + /aquaponics page deploy, partnership emails (Stirling/OATA/CEFAS drafted in `revenue/AQUACULTURE_PARTNERSHIP_EMAILS.md`), BTA cold-email batch.

---

## 3. ROBOTICS — HONEST STATE + 2026 FRONTIER

### What's REAL on disk (audit-verified)
- `Ironless-QDD-Actuator/` (186M, fork of CKraft11) — **richest**: 17 STEP, FEA (.ans/.fem), BOM.xlsx. $40–70, 29.4 Nm, printable cycloidal + ironless Halbach. **Direct open competitor to WOLF/Encos.**
- `wolf-actuator/` (176M, fork of Anthrobotics) — 14 STL + STEP. Nick's actuator line.
- `modular-bearing/` (12M, fork of Anthrobotics) — SCAD + STL.

### What is ASPIRATIONAL (memory says it exists; disk says no)
- **The "Asimov V8 humanoid build" (18 policies, CadQuery CAD, full brain) has NO files on disk.** Only planning prose in scattered `.md`. `session_april19_robotics.md` describes work that did not materialise as code/CAD/sims here. **This is the single biggest memory↔reality gap.** Either it lives on M2/elsewhere, or it was never built. Resolve before citing Asimov as an asset.

### 2026 frontier — TOP actions (full dossier: `_alignment/RESEARCH_ROBOTICS_2026-06-02.md`)
1. **Clone Ironless-QDD-Actuator** — already done (it's on disk) → benchmark vs WOLF.
2. **Upgrade to LeRobot v0.5.0** (9 Mar 2026) — adds **RobStride + Damiao CAN-bus motors** (Nick's exact stack), Unitree G1 WBC, PEFT/LoRA, Pi0-FAST.
3. **SmolVLA** (450M, runs on RPi5/edge, beats finetuned π0 on SO101) — the realistic on-robot brain.
4. **GR00T N1.7** (Apache-2.0) + **SONIC** behavior model — re-pull GR00T-WholeBodyControl, big 2026 expansion.
5. **Genesis simulator** — only major sim with **fluid + soft-body** → can model **aquaponic/water tasks AND humanoid** in one engine. Bridges both theses.
6. **Berkeley Humanoid Lite v1.1.0** (sub-$5K printed cycloidal, MIT) — closest comparable; cycloidal-vs-Wolfrom decision.
7. **PA6-CF for high-load joints** (~2× stiffer than PA12-CF) — but fix dry-box humidity workflow first.

### The whitespace (both dossiers agree)
**No open-source aquaponic (fish+plant loop) robot exists.** Marine net-cleaning is taken (Remora €13.9M, Aqua Robotics HALO). **Inland aquaponic tank-cleaning/feeding/transplanting robotics = genuine first-mover greenfield.** Build on Genesis (fluid sim) + RoMu4o (ROS2 6-DOF crawler arm) + Open-Weeding-Delta. This is where "aquaponic robotics" becomes real and ownable.

---

## 4. AQUACULTURE SCIENCE — 2026 FRONTIER

Full dossier: `_alignment/RESEARCH_AQUACULTURE_2026-06-02.md`. Top actions:
1. **Fork AquaPi** (github.com/TheRealFalseReality/aquapi — Apache-2.0, v26.2.2 @ 23 Mar 2026, 1,264 commits, ESP32+Atlas EZO, pH/EC/DO/ORP/temp/CO₂, native Home Assistant) as the **MEOK PondSense base controller**. Don't build from scratch — brand a koi/RAS welfare-logging fork. **Highest ROI.**
2. **Publish the open fish-disease/sea-lice dataset+model nobody has** — Fitzgerald 2025 confirms only ONE sea-lice CV study exists; **HuggingFace has ZERO serious aquaculture disease models**. Ship YOLOv11 + dataset to HF under `meok-ai/` → instant first-mover SEO/credibility. Start from SalmonScan (open) + Fish-Sense architecture.
3. **Cite the RAS allostasis/environmental-enrichment paper** (PMC12937366, Feb 2026) as the scientific spine of MEOK's welfare positioning — aligns with the care-membrane narrative.
4. **Own the ASC transition window** (effective Aug 2025 → mandatory **May 2027**) + RSPCA trout 177-new-standards → two hard deadlines = a selling calendar baked into the £29–£999 tiers.
5. **Track WOAH Aquatic Code §7.2–7.4 rewrite** (decided Feb 2026) — pre-build transport/stunning/killing templates to ship day-one.
6. **Koi biosecurity product** — new CEV DNA vaccine (jfd.70119) + shipping-water surveillance (PMC11881292) + LAMP/CPA-LFA field tests → koi-importer SOP/MCP. Koi trade has zero compliance tooling.
7. **Refresh koi-variety classifier** — KRS-Net (97.9%, 13 varieties) is 2022 and nothing newer exists, none on HF → cheap high-visibility content asset for koikeeper.ai.

---

## 5. DOMAINS (live HTTP sweep, this session + M3 05:55)
**LIVE (200/307):** meok.ai, councilof.ai, csoai.org, proofof.ai, safetyof.ai, suicidestop.ai, biasdetectionof.ai, koikeeper.ai, fishkeeper.ai, haulage.app, grabhire.ai, muckaway.ai, planthire.ai, landlaw.ai, optimobile.ai, meok-attestation-api, council-ai-storefront.
**DOWN (DNS 000):** optometry.vc, optometry-patient.ai, loopfactory.ai.
**BROKEN (404):** audit-prep-bundle.vercel.app, meok-backend.vercel.app.

---

## 6. GAP MAP + BACKUP STATUS (audit-verified)

### Now BACKED UP into clawd-workspace this session (were in git NOWHERE)
- ✅ 7 aquaculture MCPs (force-added — `mcp-marketplace/` is otherwise gitignored)
- ✅ `csoai-docs/` (42 grant/strategy docs: Horizon Europe, EuroHPC, Innovate UK, UKRI FLF, DSTL, foundation outline) — 628K, was 0% tracked, highest-value unversioned material
- ✅ This `_alignment/` corpus + both research dossiers

### Still gitignored / not backed up (deliberate — large or has own repo)
- `mcp-marketplace/` (the other ~338 MCPs — most have standalone CSOAI-ORG repos + PyPI)
- `sovereign-temple/` (6.6G — own repo `CSOAI-ORG/sovereign-temple`, 22 uncommitted local changes)
- `_TOPOLOGY/` (73 market-intel files — candidate for next backup)

### Duplicated waste (cleanup candidates — NOT done, flagged for Nick)
- `~/Desktop/CSOAI` ≡ `~/Desktop/CSOAI 2` — byte-identical 45M dup; delete one.
- `god-eye/` + `meok-godeye/` — two clones of same `Vyntral/god-eye` fork.
- `csoai-platform/` — 115 "copy" files + duplicate `files (N)` dirs.
- ~15 overlapping root-level `MEOK_*`/`SOV3_*` strategy docs — this doc supersedes them for current state.

### Stale / contradictions
- `meok/` local repo: 110 uncommitted changes vs `CSOAI-ORG/meok-ai`.
- `project_csga.md` still in memory despite the active "never reference CSGA" severance rule → should be archived.
- AGENTS.md says "50 public/250+ private" — reality is 410 public/12 private. **Most repos are PUBLIC** — audit anything sensitive that shouldn't be.

---

## 7. DECISIONS MADE THIS SESSION

1. **SOV3 P0 fix (#59)** — root cause was a **multi-supervisor port-3101 collision**:
   - `cron */2` ran `meok-guardian.sh` with **no singleton lock** → instances piled up (10+), raced `restart_sov3()` → Errno 48.
   - **AND** launchd `com.meok.sov3` (KeepAlive) launched `sovereign-mcp-server.py` *directly*, competing with the guardian's gunicorn.
   - **Fixes applied & committed:** (a) atomic `mkdir` singleton lock in `meok-guardian.sh`; (b) graceful TERM + wait-for-port + backoff in `restart_sov3()`; (c) safe `HOST` default in `run-production.sh` (note: `.env` currently forces `HOST=0.0.0.0` — bind hardening is a separate Nick-owned `.env` change); (d) `launchctl bootout`+`disable com.meok.sov3` so **gunicorn is the single SOV3 owner** (reversible — plist not deleted).
   - **REMAINING BLOCKER (not infra — app/env):** SOV3 `.venv` is on **Python 3.14.0** and **`torch` won't import** (no 3.14 wheel). App boots → torch crash → no health. Collision/storm/postgres are all FIXED; this is the last wall. Resolution options (Nick/M3 call) in `_alignment/SOV3_FIX_2026-06-02.md` — recommended: rebuild venv on Py 3.11/3.12. SOV3 now rests **cleanly-down, not thrashing**; the fixed guardian will auto-green it the moment torch imports.
   - Watch item: `com.meok.recovery` (`crash-recovery.py --auto-heal`, every 300s) is a third healer; if it re-collides, quiet it next.
2. **Backed up** the 7 aquaculture MCPs + `csoai-docs/` + `_alignment/` into the private repo (above).
3. **MEMORY.md** count corrected to 271/316; date corrected to 2026-06-02.

---

## 8. OPEN BLOCKERS (Nick's hand / next session)
- [ ] **SOV3: resolve torch×Python-3.14** (rebuild venv on 3.11/3.12, or shim torch) — only remaining blocker to SOV3 green. See `_alignment/SOV3_FIX_2026-06-02.md`.
- [ ] `ollama pull` the working model set (0 loaded).
- [ ] Publish 7 aquaculture MCPs to PyPI + MCP Registry (gh auth ready).
- [ ] Deploy meok.ai/aquaculture + /aquaponics pages.
- [ ] Send aquaculture partnership + BTA outreach.
- [ ] Resolve the **Asimov-on-disk gap** (is it on M2? was it built?).
- [ ] Decide: fork AquaPi → MEOK PondSense; upgrade LeRobot v0.5.0; evaluate Genesis.
- [ ] Clean duplicate waste (Desktop/CSOAI 2, god-eye dup).
- [ ] Optional: `.env` HOST→127.0.0.1 for SOV3 LAN-hardening.
