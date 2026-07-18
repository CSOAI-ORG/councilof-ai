---
name: rundown
description: Morning rundown — full system status, overnight changes, priorities
---

Run a complete morning rundown covering:

1. **System Health** — Check SOV3 (curl localhost:3101/health), NATS (curl localhost:8222/varz), Hindsight (curl localhost:8765/v1/default/banks/meok-empire/stats), Hermes (curl localhost:3000/health), Ollama (curl localhost:11434/api/tags). Report status of all services.

2. **Overnight Changes** — Find all files modified since yesterday in ~/clawd/ (find ~/clawd -type f -mtime -1 -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | wc -l). Summarize what changed.

3. **SOV3 Memory Stats** — Get memory stats and any overnight digest from SOV3.

4. **Git Status** — Check uncommitted changes across meok, sovereign-temple, csoai-org, mcp-marketplace repos.

5. **Domain Health** — Quick HTTP check on meok.ai, councilof.ai, cobolbridge.ai, proofof.ai, fishkeeper.ai, agisafe.ai, dataprivacyof.ai.

6. **Ensemble Loop** — Check if ensemble_engine loop is running, latest Hindsight stats.

7. **Revenue Status** — Check Stripe for any new payments or subscriptions.

8. **Priority Actions** — Based on all of the above, list top 3 things to do today.

Present as a concise dashboard. Be direct — no padding.
