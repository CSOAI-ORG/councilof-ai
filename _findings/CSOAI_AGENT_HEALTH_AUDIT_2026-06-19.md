# CSOAI Hive Agent Health Audit — 2026-06-19

**Generated:** 2026-06-19T09:16:52.286099

## Executive summary

Core autonomous agents are operational. Synthetic-data, grant-bot, and hive-sensor are all producing output. The main concerns are `meok-api`/`meok-ui`/`farm-vision` persistent services exiting with SIGTERM and a large `meok-api` stderr log.

## Agent status

| Agent | Schedule | Status | Evidence |
|-------|----------|--------|----------|
| ai.csoai.synthetic-data-factory | daily | ✅ healthy | Generates 1,000 synthetic records/day (last output 2026-06-18 02:34); 4 recent 1k-record corpora |
| ai.csoai.grant-application-bot | weekly | ✅ healthy | Drafts UK grant applications (last output 2026-06-18 02:34); £455K pipeline drafted |
| ai.csoai.cc0-harvester | daily | ✅ healthy | Downloads CC0/public-domain datasets (last output 2026-06-18 02:35) |
| ai.csoai.government-data-downloader | daily | ✅ healthy | Harvests UK open government data (last output 2026-06-18 04:41) |
| ai.csoai.affiliate-tracker | daily | ✅ healthy | Tracks referrals and revenue (last output 2026-06-18 02:34) |
| ai.csoai.nano-creator-seeder | daily | ✅ healthy | Builds nano-creator outreach targets (last output 2026-06-18 02:34) |
| ai.csoai.hive-sensor | persistent | ✅ healthy | Scans codebase for tasks (2,771 tasks, 17 P0) (last output 2026-06-19 09:03); 2,771 tasks tracked |
| ai.csoai.pheromone-router | persistent | ✅ healthy | Routes tasks across hive (last output 2026-06-16 10:24) |
| ai.csoai.service-healer | interval | ✅ healthy | Self-healing for services (last output 2026-06-19 09:11) |
| ai.csoai.agent-card-generator | interval | ✅ healthy | Generates agent-card.json files (last output 2026-06-18 02:34) [stderr 956 bytes] |

## Persistent services with issues

| Service | PID state | Note |
|---------|-----------|------|
| ai.csoai.meok-api | exit -15 (SIGTERM) | stderr log 363 KB — investigate |
| ai.csoai.meok-ui | exit -15 (SIGTERM) | may be crashing or manually stopped |
| ai.csoai.farm-vision | exit -15 (SIGTERM) | expected: no Hive restart command |

## Recommendations

1. Inspect `meok-api` stderr log for repeated crash cause.
2. Verify `meok-ui` and `meok-api` plists have correct working directories and env.
3. Consider reducing `hive-sensor` scan frequency if CPU pressure persists.
4. Archive old agent stdout/stderr logs after 30 days to control disk growth.