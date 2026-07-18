#!/usr/bin/env python3
"""Build a per-server submission manifest for mcpize.com from the canonical catalog.

Outputs three artifacts in ~/clawd/_findings/MCPIZE_MANIFEST_<date>/:
  - mcpize_servers.csv      — one row per server, columns mcpize asks for
  - mcpize_servers.json     — same data, JSON for programmatic use
  - mcpize_batch.sh         — looped `npx mcpize` driver (post-auth)
  - MCPIZE_RUNBOOK.md       — manual submission runbook for Nick

Notes:
- mcpize does NOT have a documented batch REST API as of 2026-06-19
- mcpize hosts servers itself (you can't just link a PyPI package)
- Two viable paths:
  A) Manual paste in dashboard at /developer/servers/new (slow, ~271 forms)
  B) npx mcpize CLI loop (fast, after `npx mcpize login`)
- Generated manifest covers both
"""
from __future__ import annotations
import argparse, csv, json, sys
from pathlib import Path

CLAWD = Path.home() / "clawd"
CANON = CLAWD / "csoai-org" / "public" / ".well-known" / "mcp.json"
OUT_BASE = CLAWD / "_findings"
TIER_PRICE = {"lvp": 9, "mvp": 29, "hvp": 99}
TIER_DESC = {"lvp": "Low-Value Pack", "mvp": "Mid-Value Pack", "hvp": "High-Value Pack"}


def make_description(name: str, sectors: list[str], tier: str) -> str:
    pretty = name.replace("-mcp", "").replace("-", " ").title()
    sector_str = ", ".join(sectors) if sectors else "general"
    return (
        f"{pretty} — CSOAI / MEOK AI Labs Layer 0 compliance MCP server. "
        f"Tier: {TIER_DESC.get(tier, tier)} (£{TIER_PRICE.get(tier, 9)}/mo). "
        f"Sectors: {sector_str}. EU AI Act / NIST AI RMF / ISO 42001 cross-framework support. "
        f"HMAC-signed attestations via proofof.ai."
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--published-only", action="store_true", help="Only servers with PyPI registry URL")
    args = ap.parse_args()

    cat = json.loads(CANON.read_text())
    servers = cat.get("servers", [])
    rows: list[dict] = []
    for s in servers:
        pkg = s.get("package") or s.get("name")
        if args.published_only and not (s.get("registry", "").startswith("https://pypi.org")):
            continue
        rows.append({
            "name": s.get("name"),
            "package": pkg,
            "description": make_description(s.get("name", ""), s.get("sectors", []), s.get("tier", "lvp")),
            "tier": s.get("tier", "lvp"),
            "price_gbp_monthly": s.get("price_gbp", TIER_PRICE.get(s.get("tier", "lvp"), 9)),
            "sectors": ",".join(s.get("sectors", [])),
            "registry_url": s.get("registry", ""),
            "endpoint": s.get("endpoint", ""),
            "github_url": f"https://github.com/CSOAI-ORG/{pkg}",
            "install_command": f"pip install {pkg}",
            "mcp_run_command": f"python -m {pkg.replace('-', '_')}",
        })

    out_dir = OUT_BASE / "MCPIZE_MANIFEST_2026-06-19"
    out_dir.mkdir(parents=True, exist_ok=True)

    (out_dir / "mcpize_servers.json").write_text(json.dumps(rows, indent=2) + "\n")

    csv_path = out_dir / "mcpize_servers.csv"
    with csv_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    sh_path = out_dir / "mcpize_batch.sh"
    sh_lines = [
        "#!/usr/bin/env bash",
        "# Driver for mcpize.com batch submission.",
        "# PREREQ:  npx mcpize login    (interactive Nick-only step)",
        "# Then:    bash mcpize_batch.sh 2>&1 | tee mcpize_batch.log",
        "#",
        "# Per server we:",
        "#   1) scaffold a thin wrapper that re-exports the PyPI MCP",
        "#   2) deploy via `npx mcpize deploy --name <pkg>`",
        "# If mcpize adds a JSON-based create endpoint later, prefer that.",
        "set -euo pipefail",
        "OUT=~/clawd/.local-tools/mcpize_wrappers && mkdir -p \"$OUT\" && cd \"$OUT\"",
        "",
    ]
    for r in rows:
        sh_lines.extend([
            f"# === {r['name']} ({r['tier']}, £{r['price_gbp_monthly']}/mo) ===",
            f"if [ ! -d \"{r['package']}\" ]; then",
            f"  npx -y mcpize init \"{r['package']}\" --description \"{r['description'][:120].replace('\"', '')}\" || echo SKIP_INIT_{r['package']}",
            f"fi",
            f"(cd \"{r['package']}\" && npx -y mcpize deploy --price-gbp {r['price_gbp_monthly']} 2>&1 | tee -a ../{r['package']}.deploy.log) || echo FAIL_{r['package']}",
            "",
        ])
    sh_path.write_text("\n".join(sh_lines))
    sh_path.chmod(0o755)

    runbook = out_dir / "MCPIZE_RUNBOOK.md"
    runbook.write_text(f"""# 📦 MCPize Submission Runbook — 2026-06-19

Catalog source: `~/clawd/csoai-org/public/.well-known/mcp.json` (348 entries; manifest filtered to {len(rows)})

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
bash ~/clawd/_findings/MCPIZE_MANIFEST_2026-06-19/mcpize_batch.sh \\
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
""")
    print(f"Manifest at {out_dir}/")
    print(f"  servers in manifest: {len(rows)}")
    print(f"  files: mcpize_servers.csv, mcpize_servers.json, mcpize_batch.sh, MCPIZE_RUNBOOK.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
