# MEOK LABS — MASTER ALIGNMENT
**Date:** 2026-06-20 · **Author:** Claude (Opus 4.8, builder lane) · **Repo:** `CSOAI-ORG/clawd-workspace` (private, origin `main`)
**Purpose:** Single source of truth for current state. Supersedes `ALIGNMENT_2026-06-02.md` (kept for history) and the scattered root-level `MEOK_*`/`SOV3_*` docs. Read this first.

> Honest about REAL vs ASPIRATIONAL. Where memory and reality disagree, reality wins and the gap is named.
> **Verification provenance:** items tagged `[v20]` re-checked live today (2026-06-20); `[v19]` carried from the 2026-06-19 fresh ground-truth sweep (the most recent full cross-machine rundown); `[unv]` not re-verified since the date shown — treat as stale until re-run.

---

## 0. Operating protocol (how the agents coordinate)
- **Claude** = builder lane. Ships code, fixes, memory, commits. Owns `meok-one/`, `sovereign-temple/`, `MEMORY.md`.
- **MiniMax M3** = auditor lane. Writes `_findings/` only (read-only audits, drift detection). Proposes; does not edit code/memory.
- **Nick** = sovereign. Fires, decides, holds the keys.
- Git: `clawd` origin = `CSOAI-ORG/clawd-workspace.git`, branch **`main`**, in sync with origin (the big June-19 reconcile used `git merge -s ours`; do NOT push clawd wholesale on a naive merge — it gives 51 conflicts). Day-seal currently **DAY29** (sigil #65).
- **OFF-LIMITS:** never reference CSGA, James Castle, or Terranova — ties severed (`memory/feedback_no_csga.md`).

---

## 1. VERIFIED STATE

### Counts
| Metric | Value | Tag |
|---|---|---|
| GitHub `CSOAI-ORG` repos | **557** (525 public / 32 private) | `[v20]` `gh repo list` today |
| MCP marketplace dirs (local) | ~352 (all parse-clean per py_compile sweep) | `[v19]` |
| Published on PyPI | **271** / 316 built (44 backlog) | `[unv 06-02]` re-run `tools/pypi_check.py` |
| SOV3 agents / NNs / MCP tools | **152 agents · 6 NNs · 115 tools** | `[v19]` |
| SOV3 consciousness level | ~0.788 | `[v19]` query live `get_consciousness_state`, never the stale postgres mirror |
| Sigil ledger | 1041 (+#65 day-seal) | `[v19]` |

GitHub traction is still ~zero (max ~2 stars on any repo). Most repos are **public** — audit anything sensitive.

### Infrastructure — TWO machines + one VM
- **Mac (M4, this checkout)** = sovereign + orchestration. Runs MEOK UI `:3000` `[v20 200]`, MEOK MCP+auth `:3102` `[v20 200]`, local SOV3 gunicorn `:3101` (down at this curl — Mac SOV3 is not always up; the VM is the authoritative live brain).
- **GCP VM (`meok-backend`, e2-standard-4, NOT preemptible)** = inference + the live autonomous stack. **The King hive lives HERE and is live** (`meok-king/king_hive/runner.py`, watchdog/2min, 173 BFT rounds). Also: full SOV3 `:3101` (gunicorn 1+2, healthy), `sovereign_bft.py`, council substrate `:3200`, OLM autonomous brain (cron/5min), cert-autopilot, synthetic-data factory, Honeycomb postgres `sovereign_memory`. **Data moat = 49 GB** `/data/hive-data`.
- **Ports identity (memorise):** `:3101`=SOV3 · `:3102`=MEOK MCP+auth (`/auth/*` + `/mcp`) · `:3200`=council substrate (no `/auth`; 404 on `/` is normal) · `:3000`=MEOK UI.
- **Ollama** `:11434` — M3 wired free via `minimax-m3:cloud`; Hindsight uses `gemma3:1b`.
- **Stripe** `acct_1TLlEKQvIueK5Xpb` (MEOK AI LTD, GBP, livemode) — live.
- **gh CLI** — CSOAI-ORG, full scopes. The old "gh auth" + "dead page" ghosts on 18-19 Jun were **WARP**, now disconnected. Don't re-diagnose 000s/403s from this env as code failures — curl to external hosts returns `000` here as a network artifact (meok.ai et al are actually live).

---

## 2. REVENUE — THE REAL WALL (corrects the optimistic memory)

**The first £ is gated on 4 human actions, not on more building:**
1. `keystone sync-vercel <PROJ> STRIPE_SECRET_KEY …` — keystone (GCP) **confirmed holds** `STRIPE_SECRET_KEY` + `STRIPE_WHSEC` (mirrored), `STRIPE_RK_LIVE` (cloud-only), `RESEND_API_KEY` (mirrored). One command pushes them to Vercel.
2. Stripe live-flip (human).
3. PyPI / npm 2FA (human-gated).
4. SMITHERY (human-gated).
Until (1)+(2): checkout 500s; 7 Stripe-link E2E tests fail because `STRIPE_SECRET_KEY` isn't in Vercel.

**The "306 queue" myth — DEBUNKED `[v19]`.** `hive-mailer/queue.jsonl` = sent 37 (likely false positives), queued **7**, suppressed_quality **245**, +16, skipped 1. The real pipeline is **7 enterprise prospects** (SAP/Siemens/Bosch/IBM/Telekom/Orange/Cera) with clean professional copy. The **245 are CORRECTLY quarantined — do NOT release** (147 generic press inboxes, 25 gov/regulators, 8 sanctioned states, 34 dupes, and the subjects carry extortion-toned "…or PRA reads the gap" threats). Releasing = menacing the regulators we sell trust to.

**Resend outreach FIXED `[v19]`.** Root cause of all 403s: Resend domain `mail.meok.ai` was `failed` because MX+SPF on `send.mail.meok.ai` were missing from DNS. Added both via `vercel dns add --scope niks-projects-0a2ef942` (meok.ai DNS is on Vercel, team scope — personal scope = denied). Resend re-verifies on its next SES poll; then the auto-fire crons safely send the 7 good prospects. **No human action needed for outreach — it self-completes on verify.** All outbound from `nicholas@csoai.org` (primary) / `nicholas@meok.ai` (product), never Gmail.

---

## 3. THE FIVE VERTICALS (+ consolidation in flight)
1. **Compliance/Governance (core revenue)** — EU AI Act / DORA / NIS2 / CRA / ISO 42001 / AI-BOM + 12 CSOAI crosswalks. Nearest cliffs: Article 50 (2 Aug 2026), Watermarking (2 Dec 2026).
2. **Optometry** — optimobile.ai (the "i" spelling; optomobile.ai is dead), templeman-opticians.com (real family business).
3. **Haulage/trade** — haulage.app umbrella (grabhire.app was down → use haulage.app).
4. **CobolBridge** — legacy COBOL→modern, migrate to meok-ai-labs namespace.
5. **Aquaponics + aquaculture** — fishkeeper.ai / koikeeper.ai / aquaponics.app live; RSPCA+ASC+CEFAS compliance MCPs £29–£999. ASC mandatory May 2027, RSPCA trout (177 clauses) live. Top next: fork AquaPi → MEOK PondSense; publish the open fish-disease model to HF (nobody has one).

**Vertical consolidation (in flight, `[v19]`):** app-first consolidation of ALL duplicate vertical/hive copies into one canonical per brand. csoai.org→v2 is LIVE (domain moved to csoai-v2-app). Phase A absorbed 6 apps (pushed). Phase B = deploy via Vercel git-connect. See `project_vertical_consolidation`.

---

## 4. SOV3 / HIVE — current truth (BIG change from June 2)
- **The torch×Python-3.14 blocker from 2026-06-02 is RESOLVED.** SOV3 `:3101` now boots healthy and serves all 6 NNs on both VM and Mac. A retrain ran 19 Jun (care_validation/partnership/relationship_evolution improved+saved; threat held 1.0; care_pattern auto-rolled-back). The supervisor war is settled: sole owner = `com.meok.sov3-gunicorn` (VM tunnel disabled 06-17). **Health-check via POST /mcp, never GET** (guardian GET-/health false-kills).
- **`:3102` (MEOK MCP) self-healed** 19 Jun: dependency_detection_nn 0.22→1.0, threat_detection_nn 0.45→1.0 via the server's continual-learning heartbeat; generators hardened + `meok/neural/retrain_degraded_models.py` added.
- **Hive sync direction — CRITICAL:** hive `stack.yml` configs — **VM is authoritative; sync VM→Mac, NEVER Mac→VM blind** (jeeves enriches on VM with `l6_queen_sme` + router-keyword fixes; a naive Mac→VM push would wipe 25 hives of autonomous work). Both sides aligned 19 Jun: 32 stack.yml, md5 `e3e60a3f…`. King reads `king_hive/prompts.json`, NOT the queen stack.yml files.
- **E2E suite now 100% (104/104 A+)** `[v19]` after fixing the suite's own bugs (Py3.14 had no CA bundle → added certifi fallback; auth group was pointed at :3200 instead of :3102). Edits uncommitted (62 uncommitted in clawd as of today).
- `record_memory` MCP proxy drops the `content` arg (KeyError on bridge) → log to memory FILES, not the tool, until fixed.

---

## 5. ROBOTICS — honest state (unchanged from June 2, still open)
- **REAL on disk:** `Ironless-QDD-Actuator/` (richest — FEA, BOM, $40–70 open WOLF competitor), `wolf-actuator/`, `modular-bearing/`.
- **ASPIRATIONAL:** the "Asimov V8 humanoid build (18 policies, CadQuery, full brain)" has **NO files on disk** — planning prose only. The Asimov v1 manual itself warns FDM won't meet tolerances (parts are CNC/SLM/MJF). Resolve where Asimov actually lives before citing it as an asset.
- 2026 frontier (dossier `RESEARCH_ROBOTICS_2026-06-02.md`): LeRobot v0.5.0 now ships Nick's CAN-bus motors; SmolVLA edge brain; Genesis fluid-sim bridges humanoid+aquaponic; **no open inland-aquaponic robot exists = whitespace.**

---

## 6. OPEN BLOCKERS / DECISIONS (Nick's hand)
- [ ] **Revenue unlock:** `keystone sync-vercel` Stripe keys → Vercel, then Stripe live-flip (the only wall to first £).
- [ ] **scorecard 0/10 since 15 Jun** — openpatent deploy dropped meok-one's `:443` nginx vhost on the VM; app healthy, public front-door gone. NOT a preemption. Restore the vhost. (`infra_meok_one_nginx_vhost_clobbered_jun15`)
- [ ] **Pricing-mismatch flag** open from the vertical consolidation.
- [ ] **The rebrand script is buggy** — it gutted 4 MCP READMEs (empty `## Tools`, dup badges) on 19 Jun; fix before re-running on any MCP. Damage was local-only; canonical remotes are clean.
- [ ] **Seal counter** had silently stalled at DAY26 (auto-loop ran crons but stopped advancing seals) — manually advanced to DAY28/29; watch it doesn't re-stall + the DAY48 autonomy report (~40% done: certs stalled ~1K, seals had stalled).
- [ ] Resolve the Asimov-on-disk gap; decide AquaPi→PondSense fork + LeRobot v0.5.0 upgrade + Genesis eval.
- [ ] Re-run `tools/pypi_check.py` to refresh the 271/316 count (last verified 06-02).
- [ ] Cleanup: `~/Desktop/CSOAI` ≡ `CSOAI 2` byte-identical dup; god-eye/meok-godeye dup clones.
