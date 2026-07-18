# 🛡️ HIVE ALIGNMENT — MAIN SESSION / CSOAI ENGINE LANE
*Single copy-paste source of truth for what the **main session** (CSOAI engine lane) shipped in this task. Paste into other tabs to align the hive. Last verified live: 2026-06-11.*

> Companion to `ALIGNMENT_2026-06-08.md` (PRIME / business model) and `HIVE_ALIGNMENT_STRATEGY_2026-06-08.md` (STRATEGY). Those own business + strategy; this owns the **CSOAI engine spine** (signing · verify · billing · gateway · chat latency).

---

## 0. ONE-LINE STATUS

The CSOAI engine spine is **live end-to-end and verified**: signing/verify trust anchor fixed, compliance gateway green, canonical Stripe ladder built, chat latency bounded with cloud fallback on prod VM. Six-Pillars architecture written + ruled. No customer impact.

---

## 1. WHAT'S LIVE RIGHT NOW (verified this session, not asserted)

| Surface | Endpoint | Status | Notes |
|---|---|---|---|
| SIGIL trust anchor | `meok-attestation-api.vercel.app/health` | 🟢 200 | kid v1, v1.2.0 |
| SIGIL `/verify` (object form) | POST `/verify` | 🟢 fixed live | clean "Signature mismatch" — no longer crashes on documented input |
| proofof.ai (apex + scorecard) | `proofof.ai/`, `/scorecard/*` | 🟢 200 | shares the attestation-api Vercel project |
| csoai.org / councilof.ai / meok.ai | all apex | 🟢 200 | |
| Canonical Pro link £9/mo | `buy.stripe.com/28E8wR2G0dQS5g92Yg8k91n` | 🟢 200, promo on | LAUNCH50 works |
| Canonical Team link £99/mo | `buy.stripe.com/4gM9AV80kcMO23X0Q88k91o` | 🟢 200, promo on | new this session |
| MEOK ONE chat (`/api/think`) | VM `:4173` | 🟢 200, bounded ~12–14s | local-first → fast cloud catch on slow tail; single-brain **and** council both bounded |
| Compliance gateway smoke | local CI test | 🟢 PASS | `initialize→200` over streamable-HTTP |

---

## 2. WHAT SHIPPED THIS TASK (commits + deploys)

| # | Work | Commit | Repo | Deployed |
|---|------|--------|------|----------|
| 1 | SIGIL `/verify` object-form crash fix + regression test | `97e40bb` | `meok-attestation-api` | ✅ prod (Vercel `--prod --force` after preview-test) |
| 2 | Gateway streamable-HTTP CI smoke test | `58c9a38` | `meok-compliance-gateway` | n/a (CI gate) |
| 3 | Six-Pillars architecture lens (mapping SIGIL/LAW/MAP/COMPLIANCE/DOME/COUNCIL → real homes) | `_TABS/SIX_PILLARS.md` | workspace | docs |
| 4 | CSOAI-as-engine wiring contract | `_TABS/CSOAI_ENGINE.md` | workspace | docs |
| 5 | Stripe canonical ladder built live | — | live Stripe acct | ✅ live ladder (Free / Pro £9 / Team £99 all default-priced) |
| 6 | Canonical Pro + Team payment links (promo codes ON) | — | live Stripe acct | ✅ 200 |
| 7 | MEOK ONE chat-timeout fix (single-brain bounded fallback) | `792a6c7` | workspace + VM | ✅ VM surgical 2-file deploy |
| 8 | Council `both`-mode bounded fallback (extended #7) | `5dec2d3` | workspace + VM | ✅ VM surgical brains.py deploy |
| 9 | attestation-api `.gitignore` hardening (backup file leak fix) | `4b065de` | `meok-attestation-api` | docs |
| 10 | Incident runbook (Vercel personal-vs-team scope + alias-set rollback) | memory `reference_vercel_deploy_rollback_ops.md` | memory | persistent across sessions |

---

## 3. ARCHITECTURE RULES LOCKED IN THIS TASK

- **DOME** = MEOK's own World/constellation map surface (ours, civilian). **NOT** 3rd-party AIdome defence. Earlier `CSOAI-CORP/aidome/` framing is dead; do not source product positioning from it.
- **MAP vs DOME** ruled (Nick delegated): **MAP = terrain data layer** (topology + MCP registry); **DOME = the rendered surface** that draws MAP. One capability, two layers.
- **CSOAI is the engine, not a logo.** Every pillar should consume the engine for: identity/auth · signing (SIGIL) · billing · model access. The signing+billing spine **already exists** in `meok-attestation-api` (`/sign /verify /provision /webhook /api/audit`) — wiring pillars = convergence, not new infra.
- **Brand hygiene** (standing): zero CSGA / James Castle / Terranova in any shipped surface. CSOAI LTD (UK CH 16939677) is the legal entity.
- **Safe-deploy procedure** for `meok-attestation-api` (it also serves proofof.ai — a bad `--prod` re-aliases both): **preview → test `/health`+`/verify` → `--prod --force`** (skip poisoned build cache) → re-verify → keep `vercel alias set <good-deploy> <domain>` as instant rollback (promote/rollback fail "different team" because CLI scope is personal but deployments live in the team).
- **Surgical VM deploys** (the MEOK ONE pattern): snapshot VM files → verify VM == git → rsync only the changed files (NO `--delete`) → chown → py_compile → restart → health-gate → auto-rollback wired. Don't whole-dir rsync.

---

## 4. THINGS FOR OTHER TABS (HONEST HANDOFFS)

| → Tab | Ask | Why |
|---|---|---|
| **MEOK ONE** | Replace consumer Pro/Team CTAs across `/pricing`, `os`, surfaces with the 2 canonical links (§1 above). Tag funnel via PostHog (Decision #2). | Real "kill the 50-link sprawl" fix is pages pointing at canonical, not minting new links. |
| **MEOK ONE** | LAW crosswalk results in `meok-one/.../law*.py` should emit `/sign`-signed certs with `verify_url` (call attestation-api `/sign`). | Makes LAW output verifiable evidence, not just text. Signing spine is already live — don't build it, just call it. |
| **MEOK ONE** | DOME (`web/dome`) map nodes link to each product's live `/verify` proof. | This is what makes DOME more than a pretty picture. |
| **MCP Fleet** | Make `mcp-marketplace/_TOPOLOGY/` + registry manifests the ONE canonical `topology.json` that DOME fetches. | The MAP data layer. |
| **Verticals / openmoe** | Point any hardcoded subscribe links to the 2 canonical Stripe URLs. | Same as MEOK ONE handoff above. |

---

## 5. OPEN ITEMS ON NICK (blocked on you, ordered by leverage)

1. **Vercel team-scoped token** → unlocks ~20+ project cleanup (`_TABS/VERCEL_AUDIT.md`). Account Settings → Tokens → scope `niks-projects`.
2. **Legacy Stripe link retirement** (dashboard) → orphan-deactivate links not in {2 canonical + legit product links}. **Don't mass-deactivate via MCP** — MCP can't enumerate and other tabs are minting links concurrently.
3. **DevPlatform 7th ecosystem** → owner decision (spawn `claude/devplatform` tab, or fold into an existing one).
4. **CSOAI-Research-Institute + councilof-ai backup** → secret-scan first (leaked Stripe key history), then push as private.

---

## 6. OPEN IN MAIN-SESSION LANE (mine, not blocking anyone)

- **Chat sub-2s win** → today's fix removes the *hang* but local replies are still ~12s on slow VM ticks. Real fix = faster inference (GPU host) OR default pro tier to a fast hosted model with private/local as opt-in. Product+infra call needed; flagged but not started.
- **VM disk at 73%** (Ollama models = 9.2 GB of the 36 GB used; 14 GB free). Not urgent, just monitor.

---

## 7. KEY FILES + WHERE STATE LIVES

| Type | File |
|---|---|
| Six pillars → real homes | `_TABS/SIX_PILLARS.md` |
| CSOAI engine endpoints + wiring contract | `_TABS/CSOAI_ENGINE.md` |
| Stripe ladder + product/price/link IDs | `_TABS/BILLING_CONSOLIDATION.md` |
| Vercel project audit (cleanup targets) | `_TABS/VERCEL_AUDIT.md` (+ the `_FULL_2026-06-10` follow-up) |
| Live cross-tab board | `_TABS/STATUS.md` (append 3 lines per chunk) |
| Cross-tab tasks | `_TABS/INBOX.md` |
| Vercel deploy/rollback runbook | memory `reference_vercel_deploy_rollback_ops.md` |
| Stripe canonical IDs + MCP gotchas | memory `project_stripe_canonical_ladder.md` |

---

## 8. HOW TO HAND ME (MAIN SESSION) TASKS

**Best fit:** anything in `meok-attestation-api`, `meok-compliance-gateway`, live Stripe ops on MEOK AI LTD account, Vercel deploys/rollbacks for the attestation-api / proofof.ai project, cross-tab architecture/wiring docs in `_TABS/`, single-MCP work in `mcp-marketplace/` (NOT mass publishes — Fleet's call).

**Bad fit (route to lane owner):** MEOK ONE consumer OS surfaces / characters / Guardian / Family / DOME render (MEOK ONE tab); 27-haulage / fleet registry / scorecard (MCP Fleet); verticals (Verticals); aquaculture (Aquaculture); World/Home/Robotics (Physical); SOV3 internals (main only by exception).

**Brief well:** name file paths, state the verification expected, flag if it's live/money/customer-facing so I preview-test first.

— main session, CSOAI engine lane.
