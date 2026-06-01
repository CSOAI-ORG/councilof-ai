"""
MEOK ONE — PUBLISHED MCP BRIDGE (tunnel 2 of 3).

Discovers the ~316 standalone published MEOK MCP packages on disk and registers them
into the tool_gateway, so the character/SOV3 can see + (safely) request them — instead
of them sitting as disconnected PyPI products no character can reach.

Design choice (honest): we DON'T spawn 316 servers (that would melt the Mac). We build a
LAZY registry: discover every package + its declared tools from pyproject/source, register
them into the gateway (so they appear in catalog() and route through the SAME safety tiers),
and only actually start a package's server on-demand when a tool from it is invoked AND
approved. Most of these are read-only compliance tools (eu-ai-act, dora, nis2) → low risk.

    discover()      -> scan mcp-marketplace/, return {pkg: {dir, tools[], domain}}
    bridge_all()    -> register every discovered pkg's tools into tool_gateway (lazy)
    summary()       -> counts by safety tier + domain
"""

import os
import re
import glob

from . import tool_gateway as gw

_ROOT = "/Users/nicholas/clawd/mcp-marketplace"

# crude domain tags from the package name (for the lens->tools mapping later)
_DOMAIN = [
    (re.compile(r"eu-ai-act|dora|nis2|iso-?42001|cra|nist|gdpr|compliance|regulatory|gos|nhs|rspca|asc", re.I), "compliance"),
    (re.compile(r"inject|firewall|security|cyber|credential|jwt|trust|watermark|attest", re.I), "security"),
    (re.compile(r"stripe|billing|payment|commerce|rate-limit|price", re.I), "economics"),
    (re.compile(r"care|health|fitness|aqua|laia|agri|robot", re.I), "care"),
    (re.compile(r"git|docker|cli|api-docs|pdf|grammar|lorem|content|image|rag|router|handoff", re.I), "code_health"),
]


def _domain_of(name: str) -> str:
    for rx, tag in _DOMAIN:
        if rx.search(name):
            return tag
    return "governance"


def _extract_tools(pkg_dir: str) -> list:
    """Best-effort: pull declared tool names from the package source. We look for the
    common MCP patterns: @mcp.tool / Tool(name= / "name": "..." in a tools list."""
    names = set()
    pats = [re.compile(r'@(?:mcp|server)\.tool\(\s*(?:name\s*=\s*)?["\']([a-z0-9_]+)["\']', re.I),
            re.compile(r'Tool\(\s*name\s*=\s*["\']([a-z0-9_]+)["\']', re.I),
            re.compile(r'def\s+(tool_[a-z0-9_]+)\s*\(', re.I)]
    for py in glob.glob(os.path.join(pkg_dir, "**", "*.py"), recursive=True)[:30]:
        if "test" in py or "node_modules" in py:
            continue
        try:
            src = open(py, errors="ignore").read()
        except Exception:
            continue
        for p in pats:
            names.update(p.findall(src))
        if len(names) > 40:
            break
    return sorted(names)


def discover() -> dict:
    """Scan the marketplace; return {pkg_name: {dir, tools, domain}}."""
    out = {}
    for pp in glob.glob(os.path.join(_ROOT, "*", "pyproject.toml")):
        d = os.path.dirname(pp)
        name = os.path.basename(d)
        out[name] = {"dir": d, "domain": _domain_of(name), "tools": _extract_tools(d)}
    return out


def bridge_all(verbose=False) -> dict:
    """Register every discovered package's tools into the gateway (lazy — endpoint=None
    means 'start on demand'). Returns a summary."""
    disc = discover()
    n_pkg = n_tool = 0
    for pkg, meta in disc.items():
        n_pkg += 1
        # register the package itself as a callable namespace even if no tools parsed
        tools = meta["tools"] or [f"{pkg.replace('-', '_')}_run"]
        for t in tools:
            gw.register("published_mcp", f"{pkg}::{t}", endpoint=None, auth=True)
            n_tool += 1
    return {"packages": n_pkg, "tools": n_tool, "domains": _domain_counts(disc)}


def _domain_counts(disc: dict) -> dict:
    c = {}
    for meta in disc.values():
        c[meta["domain"]] = c.get(meta["domain"], 0) + 1
    return c


def summary() -> dict:
    disc = discover()
    res = bridge_all()
    # tier breakdown across all bridged tools
    cat = gw.catalog().get("published_mcp", {})
    return {"packages": res["packages"], "tools": res["tools"],
            "by_domain": res["domains"],
            "by_tier": {k: len(v) for k, v in cat.items()}}


if __name__ == "__main__":
    import json
    s = summary()
    print("=== PUBLISHED MCP BRIDGE ===")
    print(f"discovered packages: {s['packages']}")
    print(f"bridged tools:       {s['tools']}")
    print(f"by domain: {json.dumps(s['by_domain'])}")
    print(f"by safety tier (all route through gateway): {json.dumps(s['by_tier'])}")
    print("\nThese now appear in tool_gateway.catalog()['published_mcp'] and obey the same"
          "\nread/write/prohibited policy. Servers start on-demand when a tool is approved.")
