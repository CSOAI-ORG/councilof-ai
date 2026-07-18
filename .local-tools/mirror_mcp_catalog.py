#!/usr/bin/env python3
"""Mirror the canonical CSOAI MCP catalog to EVERY hive *-deploy and *-site dir.

Strategy:
  - Canonical source: ~/clawd/csoai-org/public/.well-known/mcp.json (348 servers)
  - Canonical mcp-server: ~/clawd/csoai-org/.well-known/mcp-server
  - For each *-deploy / *-site:
      - If .well-known/mcp.json exists and isn't the canonical full catalog,
        preserve it as .well-known/mcp-local.json (vertical-specific listing)
      - Write the canonical full catalog as .well-known/mcp.json
      - Write the canonical mcp-server file as .well-known/mcp-server
      - Write agent.json (root + .well-known) pointing at the gateway

Default: --dry-run. Use --apply to write.
Coord: substrate lane. Does NOT deploy.
"""
from __future__ import annotations
import argparse, json, shutil, sys
from pathlib import Path

CLAWD = Path.home() / "clawd"
CANON_MCP_JSON = CLAWD / "csoai-org" / "public" / ".well-known" / "mcp.json"
CANON_MCP_SERVER = CLAWD / "csoai-org" / ".well-known" / "mcp-server"


def discover_sites() -> list[Path]:
    return sorted(
        d for p in ("*-deploy", "*-site")
        for d in CLAWD.glob(p)
        if d.is_dir() and not d.name.startswith(".")
    )


def is_full_catalog(p: Path) -> bool:
    try:
        data = json.loads(p.read_text())
        return len(data.get("servers", [])) >= 200
    except Exception:
        return False


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    if not CANON_MCP_JSON.exists():
        print(f"ERROR: canonical catalog not at {CANON_MCP_JSON}", file=sys.stderr)
        return 1
    canon_mcp = CANON_MCP_JSON.read_text()
    canon_server = CANON_MCP_SERVER.read_text() if CANON_MCP_SERVER.exists() else None
    sites = discover_sites()
    wrote_mcp = wrote_server = preserved_local = wrote_agent = 0
    for site in sites:
        wk = site / ".well-known"
        if args.apply:
            wk.mkdir(parents=True, exist_ok=True)
        target_mcp = wk / "mcp.json"
        if target_mcp.exists() and not is_full_catalog(target_mcp):
            local_target = wk / "mcp-local.json"
            if args.apply and not local_target.exists():
                shutil.copy2(target_mcp, local_target)
                preserved_local += 1
        if args.apply:
            target_mcp.write_text(canon_mcp)
        wrote_mcp += 1
        if canon_server is not None:
            target_server = wk / "mcp-server"
            if args.apply:
                target_server.write_text(canon_server)
            wrote_server += 1
        # Minimal agent.json so AI agents discover the gateway from any apex
        agent_card = {
            "name": f"{site.name.replace('-deploy', '').replace('-site', '')} (CSOAI hive)",
            "description": "CSOAI / MEOK AI Labs — Layer 0 compliance trust infrastructure. 271 MCP servers published to PyPI, full catalog at /.well-known/mcp.json.",
            "url": "https://csoai.org",
            "mcp_catalog": "/.well-known/mcp.json",
            "mcp_server": "/.well-known/mcp-server",
            "publisher": {"name": "CSOAI LTD", "trading_name": "MEOK AI Labs", "company_number": "16939677"},
            "contact": "nicholas@meok.ai",
        }
        agent_paths = [wk / "agent.json", site / "agent.json"]
        for ap_ in agent_paths:
            if args.apply:
                if ap_.name == "agent.json" and ap_.parent == site and ap_.exists():
                    continue
                ap_.write_text(json.dumps(agent_card, indent=2) + "\n")
        wrote_agent += 1
    print(f"{'APPLIED' if args.apply else 'DRY-RUN'}: {len(sites)} sites scanned")
    print(f"  mcp.json full-catalog writes: {wrote_mcp}")
    print(f"  mcp-server file writes:       {wrote_server}")
    print(f"  agent.json writes (per site): {wrote_agent}")
    print(f"  vertical-specific catalogs preserved as mcp-local.json: {preserved_local}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
