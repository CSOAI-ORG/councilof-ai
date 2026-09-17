#!/usr/bin/env python3
"""Count every surface this estate exposes, and name the ones nothing reads.

The estate's problem is not missing surfaces. It is too many, each with its own
vocabulary. This counts them and asks one mechanical question per row: DOES ANYTHING
REFERENCE IT? A route referenced only by its own file and its own test is a route with
no reader.

That signal is EVIDENCE, NOT A VERDICT, and the difference matters:
  * a route can be referenced by an external agent, a partner, or a crawler that leaves
    no trace in this repository;
  * a route can be referenced dynamically (string-built paths) and look unreferenced;
  * a discovery document (/.well-known/x402.json) can point at it without the literal
    path appearing anywhere else.
So a zero here means INVESTIGATE, and every KILL below says what would change its mind.

Usage: python3 scripts/surface_inventory.py [--out inventory.json]
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
SEARCH_DIRS = ["client", "public", "scripts", "docs", "functions", "src", ".github"]


def routes() -> list[str]:
    api = ROOT / "functions/api"
    out = set()
    for p in api.iterdir():
        if p.name.startswith("_") or ".test." in p.name:
            continue
        if p.is_dir():
            out.add(p.name)
        elif p.suffix in (".ts", ".js"):
            out.add(p.stem)
    return sorted(out)


def refs(name: str) -> dict:
    """Where is /api/<name> mentioned, outside its own implementation and test?"""
    try:
        hits = subprocess.run(
            ["git", "grep", "-l", "--", f"/api/{name}", *SEARCH_DIRS],
            cwd=ROOT, capture_output=True, text=True).stdout.split()
    except Exception:  # noqa: BLE001
        hits = []
    own = {f"functions/api/{name}.ts", f"functions/api/{name}.js",
           f"functions/api/{name}.test.ts"}
    external = [h for h in hits
                if h not in own and not h.startswith(f"functions/api/{name}/")]
    return {"total": len(hits), "external": external[:6],
            "external_count": len(external)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out")
    args = ap.parse_args()

    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rows = []
    for name in routes():
        r = refs(name)
        rows.append({"surface": f"/api/{name}", "kind": "api-route",
                     "referenced_in_repo": r["external_count"],
                     "referenced_by": r["external"]})

    unread = [r for r in rows if r["referenced_in_repo"] == 0]

    # Other surface families, counted from their own manifests rather than guessed.
    families = {}
    x402 = ROOT / "public/.well-known/x402.json"
    if x402.exists():
        d = json.loads(x402.read_text())
        res = d.get("resources") or d.get("items") or []
        families["x402_doors"] = {
            "count": len(res),
            "source": "public/.well-known/x402.json → resources[]",
            "paths": [r.get("resource") or r.get("url") for r in res][:40],
        }
    for manifest, label in (("public/.well-known/mcp.json", "mcp_manifest"),
                            ("public/.well-known/agent.json", "a2a_agent_card"),
                            ("public/sitemap.xml", "sitemap")):
        p = ROOT / manifest
        families[label] = ({"present": True, "bytes": p.stat().st_size}
                           if p.exists() else {"present": False})

    doc = {
        "schema": "csoai.surface-inventory/0.1",
        "built_at": now,
        "method": "git grep for the literal path across " + ", ".join(SEARCH_DIRS),
        "signal_is_evidence_not_verdict": (
            "zero in-repo references means INVESTIGATE, not dead. External agents, "
            "partners and dynamically built paths leave no trace here."
        ),
        "api_routes": {"count": len(rows),
                       "source": "functions/api/ — files and directories, excluding _helpers and tests"},
        "api_routes_with_no_in_repo_reader": {"count": len(unread),
                                              "paths": [r["surface"] for r in unread]},
        "families": families,
        "rows": rows,
    }
    text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
    if args.out:
        pathlib.Path(args.out).write_text(text)
        print(f"wrote {args.out}")
    print(f"api routes: {len(rows)}")
    print(f"with NO in-repo reader: {len(unread)}")
    for r in unread:
        print(f"  {r['surface']}")
    if "x402_doors" in families:
        print(f"x402 doors advertised: {families['x402_doors']['count']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
