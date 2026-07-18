# 📦 MCPize Submission Runbook — 2026-06-19

Catalog source: `~/clawd/csoai-org/public/.well-known/mcp.json` (348 entries; manifest filtered to 348)

## Status
- mcpize.com marketplace currently shows **2** of our MCPs.
- Goal: list all 271 PyPI-published + 77 unpublished = 348 in catalog.

## Why this is human-gated
- mcpize has **no public batch REST API** (verified 2026-06-19).
- `npx mcpize` CLI requires interactive `mcpize login` — Nick's account only.
- mcpize HOSTS the server (doesn't just link your PyPI URL), so each one needs a thin wrapper deployed on their infra.

## Step 1 — log in (one time)
```bash
cd ~/clawd/.local-tools
npx -y mcpize@latest login
```
This stores creds in `~/.mcpize/`.

## Step 2 — run the batch driver (unattended)
```bash
bash ~/clawd/_findings/MCPIZE_MANIFEST_2026-06-19/mcpize_batch.sh \
     2>&1 | tee ~/clawd/_findings/MCPIZE_MANIFEST_2026-06-19/batch.log
```
The driver scaffolds a thin wrapper per package and calls `mcpize deploy`. Re-runnable; existing wrappers are skipped.

## Step 3 — manual fallback for any failures
Open https://mcpize.com/developer/servers/new — paste fields from `mcpize_servers.csv`:
- name, description, price (£/mo), GitHub URL, install command

## Manifest contents
- `mcpize_servers.csv` — paste-ready
- `mcpize_servers.json` — programmatic
- `mcpize_batch.sh` — CLI driver
- This runbook

## What I (substrate lane) already did
- Mirrored canonical `/.well-known/mcp.json` (348 servers) to every hive `*-deploy/*-site/` so all sites expose the full catalog.
- Mirrored `/.well-known/mcp-server` discovery card to every hive.
- Wrote per-site `agent.json` pointing back to the gateway.
- Tools at `~/clawd/.local-tools/mirror_mcp_catalog.py` (re-runnable).
