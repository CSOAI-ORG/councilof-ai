#!/usr/bin/env python3
"""Generate/validate server.json for every *-mcp in the local mirror.

The MCP official registry requires each package to have a server.json with
{ name, packages[].registryType='pypi', name.startswith('io.github.CSOAI-ORG/') }.

If the file already exists, we just validate it. If it doesn't, we generate
a minimal valid one from the pyproject.toml.

Re-runnable. Outputs a per-MCP validation report.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

MARKETPLACE = Path.home() / "clawd" / "mcp-marketplace"
OUT = Path.home() / "clawd" / "SERVER_JSON_REPORT_2026-06-27.json"
ORG = "CSOAI-ORG"


def parse_pyproject(path: Path) -> dict:
    """Read name + version from pyproject.toml (no toml lib needed, regex)."""
    if not path.is_file():
        return {}
    text = path.read_text()
    name_m = re.search(r'^name\s*=\s*["\']([^"\']+)["\']', text, re.MULTILINE)
    ver_m = re.search(r'^version\s*=\s*["\']([^"\']+)["\']', text, re.MULTILINE)
    desc_m = re.search(r'^description\s*=\s*["\']([^"\']+)["\']', text, re.MULTILINE)
    return {
        "name": name_m.group(1) if name_m else "",
        "version": ver_m.group(1) if ver_m else "0.1.0",
        "description": desc_m.group(1) if desc_m else "",
    }


def generate_server_json(slug: str, pyproject: dict) -> dict:
    pkg_name = pyproject.get("name", slug.replace("-bridge-mcp", "-bridge").replace("-mcp", ""))
    return {
        "$schema": "https://static.modelcontextprotocol.io/schemas/server.schema.json",
        "name": f"io.github.{ORG}/{slug}",
        "description": pyproject.get("description") or f"{slug} — MEOK AI Labs / CSOAI-ORG",
        "version": pyproject.get("version", "0.1.0"),
        "packages": [
            {
                "registryType": "pypi",
                "identifier": pkg_name,
                "version": pyproject.get("version", "0.1.0"),
                "transport": {"type": "stdio"},
            }
        ],
        "repository": {
            "url": f"https://github.com/{ORG}/{slug}",
            "source": "github",
        },
    }


def validate_server_json(path: Path) -> tuple[bool, str]:
    if not path.is_file():
        return False, "missing"
    try:
        j = json.loads(path.read_text())
    except json.JSONDecodeError as e:
        return False, f"invalid-json: {e}"
    if "packages" not in j or not j["packages"]:
        return False, "no-packages"
    if "name" not in j or not j["name"].startswith(f"io.github.{ORG}/"):
        return False, f"bad-name: {j.get('name', '?')}"
    for pkg in j["packages"]:
        if pkg.get("registryType") != "pypi":
            return False, f"non-pypi: {pkg.get('registryType', '?')}"
    return True, "valid"


def main():
    all_slugs = sorted(d.name for d in MARKETPLACE.iterdir() if d.is_dir() and d.name.endswith("-mcp"))
    print(f"server.json generation: {len(all_slugs)} MCPs", flush=True)

    results = []
    for i, slug in enumerate(all_slugs, 1):
        path = MARKETPLACE / slug
        sj = path / "server.json"
        valid, why = validate_server_json(sj)
        if valid:
            results.append({"slug": slug, "status": "valid", "action": "none"})
        else:
            # Generate
            pyproject = parse_pyproject(path / "pyproject.toml")
            sj.write_text(json.dumps(generate_server_json(slug, pyproject), indent=2) + "\n")
            # Re-validate
            v2, w2 = validate_server_json(sj)
            results.append({"slug": slug, "status": w2 if v2 else f"still-{why}", "action": "generated"})
        if i % 50 == 0 or i == len(all_slugs):
            valid_count = sum(1 for r in results if r["status"] == "valid")
            print(f"  ... {i}/{len(all_slugs)}  valid={valid_count}", flush=True)

    by_status = {}
    for r in results:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    OUT.write_text(json.dumps({"aggregate": by_status, "results": results}, indent=2))
    print()
    print("=== AGGREGATE ===")
    for k, v in by_status.items():
        print(f"  {k}: {v}")
    print(f"\nWrote: {OUT}")


if __name__ == "__main__":
    main()
