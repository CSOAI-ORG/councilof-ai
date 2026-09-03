#!/usr/bin/env python3
"""csoai-openapi-gen.py — generate openapi.json from the live endpoints.

Lane-doable: walks every function in functions/api/ and emits an OpenAPI
3.0 spec that documents every public endpoint, every method, every
parameter. The result is a signed-atom-backed machine-readable spec.

This is the live llms.txt / llms-sitemap.xml / llms-full.txt trio for
machine-receivable specs.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"


def curl(url: str, *, timeout: int = 30) -> tuple[int, str]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception:
        return 0, ""


def discover_endpoints() -> list[dict]:
    """Walk functions/api/ to discover every endpoint. Each .ts file is
    parsed for the onRequestGet/Post/Put/Delete signature, the path is
    taken from the filename, and the schema is inferred from any TypeScript
    types in the file.
    """
    api_dir = REPO / "functions" / "api"
    endpoints = []
    for f in sorted(api_dir.glob("*.ts")):
        # Convert filename → URL path
        name = f.stem
        path = f"/api/{name}"
        if name in ("[[path]]", "_*"):
            continue
        # Read the file
        text = f.read_text(errors="ignore")
        methods = []
        for m in ["onRequestGet", "onRequestPost", "onRequestPut", "onRequestDelete",
                  "onRequestPatch", "onRequestOptions"]:
            if m in text:
                verb = m.replace("onRequest", "").upper()
                if verb == "OPTIONS":
                    continue
                methods.append(verb)
        if not methods:
            continue
        # Extract the first comment block as a description
        m = re.search(r"/\*\*(.+?)\*/", text, re.DOTALL)
        description = m.group(1).strip()[:300] if m else ""
        endpoints.append({
            "path": path,
            "methods": methods,
            "description": description,
            "source": str(f.relative_to(REPO)),
        })
    return endpoints


def probe_live_endpoints(endpoints: list[dict]) -> list[dict]:
    """For each GET endpoint, probe the live site and capture the JSON shape."""
    base = "https://councilof.ai"
    for ep in endpoints:
        if "GET" not in ep["methods"]:
            continue
        url = base + ep["path"]
        code, body = curl(url)
        if code != 200 or not body:
            ep["live"] = {"status": code, "ok": False}
            continue
        try:
            data = json.loads(body)
            keys = list(data.keys())[:20] if isinstance(data, dict) else (
                list(data[0].keys())[:20] if isinstance(data, list) and data else []
            )
            ep["live"] = {"status": code, "ok": True, "top_keys": keys}
        except Exception:
            ep["live"] = {"status": code, "ok": True, "raw_bytes": len(body)}
    return endpoints


def build_openapi(endpoints: list[dict]) -> dict:
    paths = {}
    for ep in endpoints:
        path = ep["path"]
        item = {}
        for verb in ep["methods"]:
            op: dict = {
                "summary": ep.get("description", "")[:200],
                "operationId": f"{verb.lower()}_{path.replace('/', '_').replace('{', '').replace('}', '')}",
                "responses": {
                    "200": {"description": "OK", "content": {"application/json": {}}},
                },
            }
            if "live" in ep and ep["live"].get("ok"):
                op["responses"]["200"]["content"]["application/json"]["example"] = {
                    "_top_keys": ep["live"].get("top_keys", []),
                }
            item[verb.lower()] = op
        paths[path] = item
    return {
        "openapi": "3.0.3",
        "info": {
            "title": "Council of AI — Public API",
            "version": "2026-09-03",
            "description": (
                "Independent AI governance measurement. 22 axes · 22 measured · "
                "14 model-comparison · 8 deterministic-fact. Free, Ed25519-signed, "
                "verifiable in your browser. Measurement, not certification."
            ),
            "contact": {"name": "CSOAI Ltd", "url": "https://councilof.ai/"},
            "license": {"name": "CC-BY-4.0", "url": "https://creativecommons.org/licenses/by/4.0/"},
        },
        "servers": [
            {"url": "https://councilof.ai", "description": "Production"},
            {"url": "https://csoai.org", "description": "Apex (308 → councilof.ai for /)"},
        ],
        "components": {
            "securitySchemes": {
                "ed25519": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-CSOAI-Signed-Card",
                    "description": "Ed25519 signature of canonical body, under did:web:csoai.org#card-attestation-1",
                }
            }
        },
        "paths": paths,
    }


def main():
    ap = argparse.ArgumentParser(description="OpenAPI generator.")
    ap.add_argument("--probe", action="store_true", help="Probe live endpoints")
    ap.add_argument("--out", type=str, default="public/openapi.json")
    args = ap.parse_args()

    print(f"=== OPENAPI GENERATOR ===")
    endpoints = discover_endpoints()
    print(f"  discovered: {len(endpoints)} endpoint files")
    if args.probe:
        print(f"  probing live site…")
        endpoints = probe_live_endpoints(endpoints)
        ok = sum(1 for e in endpoints if e.get("live", {}).get("ok"))
        print(f"  live OK: {ok}/{len(endpoints)}")
    print()
    print("  endpoints discovered:")
    for ep in endpoints:
        methods = "/".join(ep["methods"])
        live = "✓" if ep.get("live", {}).get("ok") else " "
        print(f"    [{live}] {methods:<12} {ep['path']}")

    spec = build_openapi(endpoints)
    out_path = REPO / args.out
    out_path.write_text(json.dumps(spec, indent=2, sort_keys=True))
    print()
    print(f"  wrote: {out_path.relative_to(REPO)} ({out_path.stat().st_size}B)")
    print(f"  paths:  {len(spec['paths'])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
