# CSOAI Hive — Autonomic Nervous System

The Hive is Phase 1 of the Living Ecosystem Blueprint: a self-organizing,
self-healing automation layer for the CSOAI/SOV3/MEOK ONE empire.

## What it does

| Agent | Responsibility | Cadence |
|---|---|---|
| **Sensor** (`hive_sensor.py`) | Scans TODO, blocker, quality, and ready-to-post files across the empire, classifies tasks by router and priority, and emits a living task queue. | Every 15 min |
| **Healer** (`service_healer.py`) | Probes critical service endpoints and restarts anything that is down, with strike/cooldown logic to avoid fighting launchd. | Every 5 min |
| **Quality Manager** (`quality_manager.py`) | Grades repo health per tree (dirty files, tests, placeholders/secrets) and writes a JSON report. | Hourly |
| **Publish Manager** (`publish_manager.py`) | Stages social posts from READY_TO_POST and SOCIAL_BLITZ, queues them, and publishes via Buffer API or Kimi WebBridge when enabled. | Every 30 min |
| **Notifier** (`hive_notify.py`) | Shared notification dispatcher used by all agents: email (SMTP), Discord, Slack, generic webhook, macOS alerts. | On demand |
| **Remediation Generator** (`remediation_generator.py`) | Converts quality, E2E, and domain audit findings into `.hive/tasks/TODO_remediation.md`. | Every 6 h |
| **Test Fleet Manager** (`test_fleet_manager.py`) | Runs configured test suites (E2E, pytest) and aggregates pass/fail into a JSON report. | Daily |
| **Secrets Inventory** (`secrets_inventory.py`) | Scans `.env*` files for placeholders and missing required secrets. | Every 6 h |
| **Pheromone Router** (`pheromone_router.py`) | HTTP broker for swarm signals across 8 channels; used by quorum sensor and dashboard. | Always on port 3900 |
| **Quorum Sensor** (`quorum_sensor.py`) | Reads pheromone density and decides hive mode: construction / war / migration / regicide. | Every 5 min |
| **x402 MCP Server** (`x402_mcp_server.py`) | MCP-style HTTP server that charges per tool call via HTTP 402 + payment proof. | Always on port 3950 |
| **Agent Card Generator** (`agent_card_generator.py`) | Generates Ed25519-signed A2A Agent Cards for CSOAI domains. | Daily |
| **Nano-Creator Seeder** (`nano_creator_seeder.py`) | Generates outreach targets and DM templates for nano-creator seeding. | Daily |
| **Synthetic Data Factory** (`synthetic_data_factory.py`) | Produces labelled synthetic training corpora for construction, aquaculture, logistics. | Daily |
| **CC0 Harvester** (`cc0_harvester.py`) | Downloads public-domain / CC0 datasets for training and enrichment. | Weekly |
| **Government Data Downloader** (`government_data_downloader.py`) | Harvests UK open-government datasets (Land Registry, Companies House, DfT, OS). | Weekly |
| **Grant Application Bot** (`grant_application_bot.py`) | Drafts and tracks grant applications against live opportunities. | Weekly |
| **Affiliate Tracker** (`affiliate_tracker.py`) | Seeds and tracks referral codes across CSOAI domains. | Daily |
| **Data Budget Guard** (`data_budget_guard.py`) | Enforces disk budget and retention for harvested datasets. | Daily |
| **Day Orchestrator** (`day_orchestrator.py`) | Runs the full-day auto-mode sequence in order with logging. | Manual / daily sprint |
| **Placeholder Cleanup** (`placeholder_cleanup.py`) | Replaces placeholder tokens in tracked files with safe defaults. | On demand |
| **Capital Ascension Orchestrator** (`capital_ascension/capital_ascension_orchestrator.py`) | Regenerates Series A investor materials weekly. | Weekly |
| **Data Moat Dossier** (`capital_ascension/data_moat_dossier.py`) | Catalogues datasets and scores the data moat. | Weekly |
| **Provisional Patent Drafter** (`capital_ascension/provisional_patent_drafter.py`) | Renders provisional patent applications from patent JSONs. | Weekly |
| **LOI Generator** (`capital_ascension/loi_generator.py`) | Generates enterprise pilot LOI templates. | Weekly |
| **Investor Warmup Tracker** (`capital_ascension/investor_warmup_tracker.py`) | Tracks strategic program applications and warm-intro templates. | Weekly |
| **Pitch Deck Generator** (`capital_ascension/pitch_deck_generator.py`) | Generates Series A pitch deck markdown. | Weekly |
| **Investor CRM** (`capital_ascension/investor_crm.py`) | Seeds investor blitz target list CSV. | Weekly |
| **Wave 8 Orchestrator** (`wave8/wave8_orchestrator.py`) | Offensive intelligence: Horus, Mamba-3, DAO, RobotMCP, gaming compliance. | Weekly |
| **Horus OSINT** (`wave8/horus_osint.py`) | Parallel competitor monitoring and intel reports. | Weekly |
| **Mamba-3 Readiness** (`wave8/mamba3_readiness.py`) | Model manifest and migration plan for swarm brain upgrade. | Weekly |
| **DAO Scaffold** (`wave8/dao_scaffold.py`) | DAO constitution, TreasuryGPT, Proposal Evaluation specs. | Weekly |
| **RobotMCP Bridge** (`wave8/robotmcp_bridge.py`) | ROS 2 / Omniverse MCP bridge spec and client skeleton. | Weekly |
| **Meok Gaming Compliance** (`wave8/meok_gaming_compliance.py`) | India OGRAI gaming compliance MCP server spec. | Weekly |
| **Dashboard** (`dashboard/index.html`) | Static web UI for service health, quality grades, task queue, test fleet, secrets, and publish queue. | http://localhost:3800/.hive/dashboard/ |

## Layout

```
.hive/
├── config.yaml              # Single source of truth for services, sensors, quality gates
├── scripts/
│   ├── generate_launchd.py          # Render launchd plists from config.yaml
│   ├── load_launchd.py              # Install and load agents
│   ├── hive_sensor.py               # Task/signal sensor
│   ├── service_healer.py            # Service health & restart
│   ├── quality_manager.py           # Quality grading
│   ├── pheromone_router.py          # Swarm signal broker
│   ├── quorum_sensor.py             # Hive mode logic
│   ├── x402_mcp_server.py           # Paid tool gateway
│   ├── agent_card_generator.py      # A2A Agent Cards
│   ├── nano_creator_seeder.py       # Creator seeding
│   ├── synthetic_data_factory.py    # Synthetic training data
│   ├── cc0_harvester.py             # CC0 dataset harvester
│   ├── government_data_downloader.py # UK gov open data
│   ├── grant_application_bot.py     # Grant drafts
│   ├── affiliate_tracker.py         # Referral tracking
│   ├── data_budget_guard.py         # Dataset disk guard
│   ├── day_orchestrator.py          # Full-day auto sequence
│   ├── capital_ascension/           # Series A fundraising artifacts
│   │   ├── capital_ascension_orchestrator.py
│   │   ├── data_moat_dossier.py
│   │   ├── provisional_patent_drafter.py
│   │   ├── loi_generator.py
│   │   ├── investor_warmup_tracker.py
│   │   ├── pitch_deck_generator.py
│   │   └── investor_crm.py
│   └── wave8/                       # Offensive intelligence & Mamba-3 ascension
│       ├── wave8_orchestrator.py
│       ├── horus_osint.py
│       ├── mamba3_readiness.py
│       ├── dao_scaffold.py
│       ├── robotmcp_bridge.py
│       └── meok_gaming_compliance.py
├── launchd/
│   └── ai.csoai.*.plist     # launchd agent definitions
├── dashboard/
│   └── index.html           # Static Hive dashboard
├── logs/                    # Runtime logs (gitignored)
├── data/                    # Harvested/synthetic datasets (gitignored)
└── tasks/                   # Runtime task queues (gitignored)
    ├── publish_queue.jsonl  # Staged social posts
    ├── TODO_remediation.md  # Auto-generated remediation tasks
    ├── seeding/             # Creator outreach targets
    ├── grants/              # Grant drafts
    ├── auto_mode_schedule.md # Full-day auto-mode cadence
    ├── capital_ascension/   # Series A artifacts (dossier, pitch deck, LOIs)
    ├── wave8/               # Offensive intelligence, DAO, RobotMCP, gaming compliance
    └── affiliates.jsonl     # Referral ledger
```

## Quick start

```bash
cd ~/clawd

# Regenerate launchd plists after config changes
python3 .hive/scripts/generate_launchd.py

# Install and load all agents
python3 .hive/scripts/load_launchd.py

# Run agents manually
python3 .hive/scripts/hive_sensor.py
python3 .hive/scripts/service_healer.py
python3 .hive/scripts/quality_manager.py
python3 .hive/scripts/publish_manager.py
python3 .hive/scripts/remediation_generator.py
python3 .hive/scripts/test_fleet_manager.py
python3 .hive/scripts/secrets_inventory.py
python3 .hive/scripts/quorum_sensor.py
curl -X POST http://127.0.0.1:3900/emit -H "Content-Type: application/json" -d '{"channel":"mcp.queen.gold","agent_id":"sigil","payload":{}}'
python3 .hive/scripts/x402_mcp_server.py  # port 3950
python3 .hive/scripts/agent_card_generator.py
python3 .hive/scripts/env_readiness_report.py
python3 .hive/scripts/nano_creator_seeder.py
python3 .hive/scripts/synthetic_data_factory.py --count 1000
python3 .hive/scripts/cc0_harvester.py --dry-run
python3 .hive/scripts/government_data_downloader.py --dry-run
python3 .hive/scripts/grant_application_bot.py
python3 .hive/scripts/affiliate_tracker.py
python3 .hive/scripts/data_budget_guard.py
python3 .hive/scripts/day_orchestrator.py
python3 .hive/scripts/hive_notify.py "Test" "Hello from Hive"
```

## Configuration

Edit `.hive/config.yaml` to add services, sensor patterns, quality repos, or
notification channels. All scripts read from this file at runtime.

## Notifications

Edit `.hive/config.yaml` → `notifications:`

- `dry_run: true` logs what would be sent (default).
- Set `dry_run: false` and fill in channel creds to dispatch real alerts.
- Email uses env vars `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL` as fallbacks.

## Publish loop

Edit `.hive/config.yaml` → `publish_loop:`

- `dry_run: true` stages posts without publishing.
- Set `dry_run: false` and provide `BUFFER_ACCESS_TOKEN` or enable WebBridge to go live.
- Sources: `csoai-org/READY_TO_POST.txt`, `csoai-org/SOCIAL_BLITZ.md`.

## Dashboard

Serve the dashboard from the repo root, then open http://localhost:8080/.hive/dashboard/:

```bash
cd ~/clawd
python3 -m http.server 8080
```

## Monitoring

```bash
launchctl list | grep ai.csoai
tail -f .hive/logs/healer.log
tail -f .hive/logs/ai.csoai.service-healer.stderr.log
tail -f .hive/logs/notifier.log
tail -f .hive/logs/publish_manager.log
```

## Design principles

1. **Config-driven.** One YAML file drives Sensor, Healer, and Quality Manager.
2. **launchd-native.** macOS user agents keep the stack alive across reboots.
3. **Conservative healing.** Consecutive-failure strikes and restart cooldowns
   prevent the Healer from flapping against slow-starting services.
4. **No new sovereign AI.** The Hive automates the existing stack; it does not
   become another product.
