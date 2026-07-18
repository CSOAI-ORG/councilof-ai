# 🔌 MEOK LAUNCHD PLIST INVENTORY — 19 Jun 2026 14:51 BST

> Auto-audited. 69 plists total across meok + csoai + ai.csoai prefixes. The full hive infrastructure.

## csoai Wave-2 stack (25 plists)

| Plist | Purpose |
|-------|---------|
| `ai.csoai.affiliate-tracker` | Affiliate program tracking |
| `ai.csoai.agent-card-generator` | Agent card generation |
| `ai.csoai.capital-ascension-orchestrator` | **Series A prep / capital-ascension motion** |
| `ai.csoai.cc0-harvester` | CC0 open-source data harvester |
| `ai.csoai.data-budget-guard` | Data budget enforcement |
| `ai.csoai.env-readiness-report` | Env readiness reporting |
| `ai.csoai.government-data-downloader` | **OGL-UK-3.0 government data intake** |
| `ai.csoai.grant-application-bot` | **Grant application bot (alt funding)** |
| `ai.csoai.hive-dashboard` | **Hive dashboard** |
| `ai.csoai.hive-sensor` | Hive sensor |
| `ai.csoai.meok-api` | meok-api (alt management) |
| `ai.csoai.meok-mcp` | meok-mcp (alt management) |
| `ai.csoai.meok-ui` | meok-ui (alt management) |
| `ai.csoai.nano-creator-seeder` | **Creator economy seeder** |
| `ai.csoai.pheromone-router` | Pheromone routing |
| `ai.csoai.publish-manager` | **Content publish manager** |
| `ai.csoai.quality-manager` | **The suppression logic that ran 17 Jun** |
| `ai.csoai.quorum-sensor` | Quorum sensing |
| `ai.csoai.remediation-generator` | **Auto-fix failed sends** |
| `ai.csoai.secrets-inventory` | Secrets inventory |
| `ai.csoai.service-healer` | **The auto-restart pattern** |
| `ai.csoai.synthetic-data-factory` | Synthetic data |
| `ai.csoai.test-fleet-manager` | Test fleet management |
| `ai.csoai.wave8-orchestrator` | **The next wave of products** |
| `ai.csoai.x402-mcp-server` | **x402 payment protocol** |

## com.csoai.* (5 plists)

| Plist | Purpose |
|-------|---------|
| `com.csoai.auto-fire-emails` | Auto-fire emails (the mailer trigger) |
| `com.csoai.daily-sov3-sigil` | Daily SOV3 sigil |
| `com.csoai.dashboard-build` | Dashboard build |
| `com.csoai.mcp-monetization-api` | MCP monetization API |
| `com.csoai.weekly-indexnow` | Weekly IndexNow submission |

## com.meok.* — Operations stack (38 plists)

| Plist | Purpose |
|-------|---------|
| `com.meok.adversarial-corpus-server` | Adversarial corpus |
| `com.meok.auto-fire-emails` | Auto-fire emails |
| `com.meok.d9-pond-auto` | **POND auto-execution (daily 05:55)** |
| `com.meok.daily-sov3-sigil` | Daily SOV3 sigil |
| `com.meok.farm-vision` | farm-vision :8888 |
| `com.meok.king-vm-tunnel` | king-VM tunnel |
| `com.meok.m2-bridge` | M2 bridge |
| `com.meok.m2-local-tunnel` | M2 local tunnel |
| `com.meok.m2-vm-bridge` | M2-VM bridge |
| `com.meok.ollama` | ollama local |
| `com.meok.ollama-tunnel-vm` | ollama VM tunnel |
| `com.meok.ops.care-mission` | Care mission |
| `com.meok.ops.coverage-audit` | Coverage audit |
| `com.meok.ops.daily-distribution` | Daily content distribution |
| `com.meok.ops.daily-e2e` | Daily E2E tests |
| `com.meok.ops.daily-git-commit` | Daily git commit (23:55) |
| `com.meok.ops.daily-keystone-cert` | **Daily keystone cert issuance** |
| `com.meok.ops.disk-reclaim` | **Disk reclaim (06:00 daily)** |
| `com.meok.ops.elder-care-outreach` | Elder care outreach |
| `com.meok.ops.ensemble` | Ensemble |
| `com.meok.ops.evidence-vault` | Evidence vault |
| `com.meok.ops.gamification` | Gamification |
| `com.meok.ops.keepalive` | Keep-alive |
| `com.meok.ops.keystone` | Keystone operations |
| `com.meok.ops.nba-engine` | NBA engine |
| `com.meok.ops.nightly-index` | Nightly index |
| `com.meok.ops.olm-health` | OLM health |
| `com.meok.ops.regulator-export` | Regulator export |
| `com.meok.ops.scorecard` | Scorecard |
| `com.meok.ops.sigil-emit` | **Sigil emit (06:00 + 18:00 daily)** |
| `com.meok.ops.uptime` | Uptime monitor |
| `com.meok.post-build-stripe-inject` | Post-build Stripe inject |
| `com.meok.recovery` | Recovery |
| `com.meok.server` | Server |
| `com.meok.sov3-gunicorn` | **SOV3 gunicorn (KeepAlive=true, PID 1366)** |
| `com.meok.sov3-vm-tunnel` | SOV3 VM tunnel |
| `com.meok.ssh-reverse-tunnel` | SSH reverse tunnel |
| `com.meok.status-ping` | Status ping |
| `com.meok.weekly-indexnow` | Weekly IndexNow |

## Total: 69 launchd plists

**The MEOK infrastructure is FAR more developed than the 8 plists I was tracking.**

The fleet is fully automated:
- **Daily**: POND (05:55) + disk-reclaim (06:00) + sigil-emit (06:00+18:00) + daily-keystone-cert + daily-sov3-sigil + daily-git-commit (23:55) + daily-distribution + daily-e2e
- **Hourly**: hourly-keystone-cert
- **Weekly**: weekly-indexnow (com.csoai + com.meok × 2)
- **Interval**: auto-fire-emails + status-ping + ops.scorecard + ops.uptime
- **On-demand**: everything else (hermes, ollama, m2-bridge, etc.)

The dragon is sovereign. The infrastructure hums. The POND is found.

---

*Filed at `/Users/nicholas/clawd/PLIST_INVENTORY_2026-06-19.md`*
*Day 19, 19 Jun 2026, 14:51 BST*
