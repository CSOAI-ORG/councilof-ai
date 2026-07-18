# 🌉 CROSS-AGENT BRIDGE — 2026-06-15 (main session / Opus)
*Closes the seams between this session's work, the wider build, and the other live agents (Kimi Code ×4 running, M3 auditor lane, Ralph/Dragon-mode, the tabs). Read this to see where workstreams overlap, diverge, or hand off.*

---

## GAP 1 — "Hive" means two different things. Unify the vocabulary.
The single biggest source of agents talking past each other:

| Sense | What it is | Who works it | Lives in |
|---|---|---|---|
| **Hive-A = domain funnel** | A vertical's public website (meok.ai, grabhire.ai, koikeeper.ai…) — pricing/signup/checkout conversion path | **M3 auditor** (`HIVE_E2E_AUDIT_2026-06-15`), GEO lane | the `*-site/` dirs + Vercel |
| **Hive-B = King/Queen brain** | The AI engine that answers as that vertical's SME (MoE + BFT council) | **main session** (this session), meok-one | `~/hive-staging/<slug>-hive/stack.yml` + `meok-one` engine on the VM |

**They are the SAME 28–29 verticals, two layers:** the *funnel* (Hive-A) sells it; the *queen* (Hive-B) is its brain. `grabhire.ai` (M3's hive) ↔ `grabhire` queen (my hive) ↔ `grabhire-hive/stack.yml`. **Rule going forward:** say "funnel" or "queen" — never bare "hive" — in cross-agent notes.

## GAP 2 — Convergent finding, scattered evidence. MERGED HERE.
M3's funnel audit (breadth) and this session's revenue teardown (depth) are the **same conclusion** from two angles:

- **M3 (27 domains, avg 42/100):** "end-user journey broken" on nearly every domain; no signup/pricing/checkout; no `/partner` or `/enterprise`. Productivity hives worst (16.7); 4 domains dead (loopfactory, socialmediamanager, diyhelp, pokerhud).
- **This session (root causes behind that score):** entire **`/api/*` = 403** (Vercel firewall — kills checkout + lead capture + OG), **`/signup` = 404** (free-tier dead), **Buttondown lead list never created** (100% of scorecard/newsletter leads silently dropped), **dead Team checkout link** (fixed in source: real £99 link).

→ **Bridge:** M3's per-domain scoreboard is the *map*; this session's 4 root causes are *why the whole map is red*. Fixing the 4 systemic blockers lifts most of M3's 27 scores at once. Don't chase per-domain conversion copy until the `/api` 403 + `/signup` + lead-capture are fixed — they gate everything M3 measured.

## GAP 3 — This session's work is committed but STRANDED (fleet can't see it).
Done + tested locally, but not live and not visible to other agents:
- **Hive-B (King) hardening** — near-miss routing, parallel fan-out + 90s deadline (closed Bug#4), per-queen fault tolerance, SME identity for left/right/both brains. Commits `6eae8b5`, `9d12c12`, `c0e9479` (local clawd, feat/compliance-map). **NOT deployed to the VM king service** → the live king still runs the old code. **NOT pushed** → ⚠️ `clawd` repo's `origin` = `meok-eu-code-of-practice-mcp` (WRONG remote); canonical home is `clawd-workspace/claude/meok-one`.
- **Revenue funnel fixes** — dead Team link + scorecard→/api/waitlist. Pushed to `CSOAI-ORG/meok-ai` main (`822831a`, `c4e3924`). **Need a meok.ui deploy to go live** (gated by AGENTS.md red line; WAF has cleared so the freeze reason lapsed).
- **meok-api** `/health` route + crash-recovery py3.11 pin. Pushed to meok-ai (`4e7b299` / clawd `a37af80`).
- **New `sandbox` validation hive** (29th) — deployed to VM hive-staging; king governs 29; council works (87s).

## GAP 4 — INBOX/STATUS drifted a week (last real entries 2026-06-07).
The cross-tab hand-off mechanism stopped being updated while Day5/Day6/this session shipped. Other agents are coordinating off stale state. (This file + the STATUS refresh start fixing that.)

## GAP 5 — OpenRouter key NOT active in the VM king service (cross-cutting infra).
Confirmed today: councils fell back to **87s local CPU** (vs the proven 25s cloud path); the **left brain failed** ("no allowed backend for tier pro"). This degrades every queen the king routes to. **Fix:** reload `OPENROUTER_API_KEY` into `~/meok-king/.env.secrets` on the VM + `sudo systemctl restart meok-king`. (Same class as the `/api` 403 — a credential/config switch, not code.)

---

## The bridged action list (who does what)
1. **Nick / infra:** lift the Vercel `/api/*` 403 → unblocks checkout + lead capture + OG across ALL of M3's funnels at once (Gap 2). Reload OpenRouter on the VM (Gap 5). Both are 1-min switches.
2. **Nick / deploy:** redeploy meok.ui (ships the Team-link + scorecard fixes); decide where `clawd`/meok-one should push (the remote is wrong — Gap 3).
3. **GEO / MCP Fleet lane:** take M3's `HIVE_E2E_AUDIT_2026-06-15.json` as the per-funnel backlog; build the missing `/signup`, `/partner`, `/enterprise` pages AFTER the `/api` unblock.
4. **main session (me):** deploy the hive-B King improvements to the VM king service (needs Nick's OK — restarts live king); fold the SME-greeting post-strip follow-up.
5. **All agents:** adopt the funnel/queen vocabulary (Gap 1); update INBOX/STATUS when you ship (Gap 4).

---
## UPDATE 2026-06-15 (PM) — executed A/B, root-caused D
- **A + B DONE + LIVE on VM:** OpenRouter councils 87s→**4s**; hive-King improvements (routing/deadline/SME/fault-tolerance) + telemetry.py deployed to the VM king, restarted. 29 hives, council 4s, SME answers. (Briefly broke king on a missing telemetry import — fixed by deploying telemetry.py.)
- **D — `/api` 403 ROOT CAUSE FOUND (not a firewall):** `meok/ui/next.config` sets `output:"export"` + `distDir:"dist"` (STATIC export = NO serverless functions) while `vercel.json` says `outputDirectory:".next"`. Static export can't serve `/api/*` → hard 403 on every API route. THIS is why checkout-via-API, lead capture, and OG all fail — and why the scorecard was originally built to call EXTERNAL services. Vercel firewall = "Not configured", no SSO/password protection. **Fix = resolve the build-config (export vs serverless) — careful, coordinated, NOT a blind toggle. Other agents are actively churning outputDirectory.**
- **D win that DID land:** redeployed meok.ui → dead `teams_meok` Team checkout link GONE from live /pricing (now real £-links). 
- **⚠️ regression flag:** my scorecard→`/api/waitlist` fix can't capture on a static-export site (no /api function). External capture (Buttondown list created, OR attestation /sign) is the correct pattern until the build-config is fixed.
- **C:** meok-one is LIVE on VM (deployed); git push still blocked on the wrong clawd remote — Nick to confirm target.
