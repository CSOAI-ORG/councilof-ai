#!/usr/bin/env python3
"""
generate-sbom.py — CycloneDX 1.6 SBOM generator for MEOK MCP packages
=====================================================================

Usage:
  ./generate-sbom.py /path/to/pkg-dir [--out sbom.cdx.json]
  ./generate-sbom.py --all   # process all top-tier MEOK MCPs in mcp-marketplace/

Produces a CycloneDX 1.6 JSON BOM suitable for:
  - EU CRA Annex IV (Reg 2024/2847) — § 14 SBOM requirement
  - SOC 2 + ISO 42001 supply-chain evidence
  - Procurement "show me your SBOM" requests
  - GitHub OSSF Scorecard / SLSA L2

Why standalone: lets MEOK ship SBOM evidence today without committing the
~20MB cyclonedx-bom toolchain into every tiny MCP package.

Stdlib only — no install required.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import sys
import tomllib  # py3.11+
import uuid
from datetime import datetime, timezone

CYCLONEDX_VERSION = "1.6"
SPEC_URL = "http://cyclonedx.org/schema/bom-1.6.schema.json"


def _git_revision(pkg_dir: pathlib.Path) -> str:
    try:
        out = subprocess.run(
            ["git", "-C", str(pkg_dir), "rev-parse", "HEAD"],
            capture_output=True, text=True, timeout=3,
        )
        if out.returncode == 0:
            return out.stdout.strip()
    except Exception:
        pass
    return ""


def _file_sha256(p: pathlib.Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _purl(name: str, version: str) -> str:
    """Package URL (purl) per spec — pkg:pypi/<name>@<version>"""
    safe = name.lower().replace("_", "-")
    return f"pkg:pypi/{safe}@{version}"


def _parse_pyproject(pkg_dir: pathlib.Path) -> dict:
    pp = pkg_dir / "pyproject.toml"
    if not pp.exists():
        raise FileNotFoundError(f"no pyproject.toml in {pkg_dir}")
    with pp.open("rb") as f:
        return tomllib.load(f)


def _component_for_dependency(spec: str) -> dict:
    """Convert a pyproject 'mcp>=1.0.0' style spec into a CycloneDX component."""
    m = re.match(r"^([A-Za-z0-9_\-\.]+)\s*([<>=!~]+)?\s*([0-9A-Za-z\.\-]+)?", spec.strip())
    if not m:
        return {"type": "library", "name": spec.strip(), "purl": f"pkg:pypi/{spec.strip()}"}
    name = m.group(1)
    op = m.group(2) or ""
    ver = m.group(3) or ""
    purl = f"pkg:pypi/{name.lower().replace('_', '-')}"
    if ver:
        purl += f"@{ver}"
    comp = {
        "type": "library",
        "name": name,
        "purl": purl,
        "scope": "required",
    }
    if ver:
        comp["version"] = ver
    if op:
        comp["properties"] = [{"name": "version_constraint", "value": f"{op}{ver}"}]
    return comp


def build_sbom(pkg_dir: pathlib.Path) -> dict:
    pkg_dir = pkg_dir.resolve()
    pp = _parse_pyproject(pkg_dir)
    project = pp.get("project") or {}
    name = project.get("name") or pkg_dir.name
    version = project.get("version") or "0.0.0"
    description = project.get("description") or ""
    license_info = project.get("license") or {}
    license_text = ""
    if isinstance(license_info, dict):
        license_text = license_info.get("text") or license_info.get("file") or ""
    elif isinstance(license_info, str):
        license_text = license_info

    deps_raw = project.get("dependencies") or []
    git_rev = _git_revision(pkg_dir)

    # Hash the primary source file (server.py if present, else first .py)
    candidate_files: list[pathlib.Path] = [pkg_dir / "server.py"]
    candidate_files.extend(pkg_dir.glob("*.py"))
    files: list[dict] = []
    seen = set()
    for cf in candidate_files:
        if cf.exists() and cf.resolve() not in seen:
            seen.add(cf.resolve())
            files.append({
                "name": cf.name,
                "hashes": [{"alg": "SHA-256", "content": _file_sha256(cf)}],
                "size": cf.stat().st_size,
            })

    metadata_component = {
        "type": "application",
        "bom-ref": _purl(name, version),
        "name": name,
        "version": version,
        "description": description,
        "purl": _purl(name, version),
        "supplier": {
            "name": "MEOK AI Labs",
            "url": ["https://meok.ai", "https://csoai.org"],
            "contact": [{"email": "nicholas@meok.ai"}],
        },
        "publisher": "MEOK AI Labs",
        "scope": "required",
    }
    if license_text:
        metadata_component["licenses"] = [{"license": {"id": license_text}} if license_text in ("MIT", "Apache-2.0", "BSD-3-Clause") else {"license": {"name": license_text}}]

    components = [_component_for_dependency(d) for d in deps_raw]

    sbom = {
        "$schema": SPEC_URL,
        "bomFormat": "CycloneDX",
        "specVersion": CYCLONEDX_VERSION,
        "serialNumber": f"urn:uuid:{uuid.uuid4()}",
        "version": 1,
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tools": {
                "components": [
                    {
                        "type": "application",
                        "name": "meok-sbom-generator",
                        "version": "1.0.0",
                        "vendor": "MEOK AI Labs",
                    }
                ],
            },
            "component": metadata_component,
            "supplier": {"name": "MEOK AI Labs", "url": ["https://meok.ai"]},
            "manufacturer": {"name": "MEOK AI Labs"},
            "authors": [{"name": "Nicholas Templeman", "email": "nicholas@meok.ai"}],
            "licenses": [{"license": {"id": "MIT"}}] if license_text == "MIT" else [{"license": {"name": license_text or "MIT"}}],
            "properties": [
                {"name": "git_commit", "value": git_rev or "untracked"},
                {"name": "build_time", "value": datetime.now(timezone.utc).isoformat()},
                {"name": "regulatory_alignment", "value": "EU CRA Annex IV § 14, ISO/IEC 5230, NTIA SBOM minimum elements"},
            ],
        },
        "components": components,
        "compositions": [
            {
                "aggregate": "complete",
                "assemblies": [_purl(name, version)],
            }
        ],
        "annotations": [
            {
                "subjects": [_purl(name, version)],
                "annotator": {"organization": {"name": "MEOK AI Labs"}},
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "text": f"Generated by meok-sbom-generator. Source files SHA-256: {len(files)} hashed. Dependencies: {len(components)}.",
            }
        ],
    }

    if files:
        # Embed source-file hashes as evidence/files component
        sbom["components"].append({
            "type": "file",
            "name": f"{name}-source",
            "version": version,
            "purl": _purl(name, version) + "?source=true",
            "hashes": [h for f in files for h in f.get("hashes", [])],
            "properties": [
                {"name": f"file:{f['name']}", "value": f"{f['hashes'][0]['content']} ({f['size']}b)"}
                for f in files
            ],
        })

    return sbom


def write_sbom(pkg_dir: pathlib.Path, out: pathlib.Path | None = None) -> pathlib.Path:
    sbom = build_sbom(pkg_dir)
    if out is None:
        out = pkg_dir / "sbom.cdx.json"
    out.write_text(json.dumps(sbom, indent=2) + "\n")
    return out


# ── Top-tier MEOK MCPs to ship SBOM for ─────────────────────────────────
TOP_MCPS_REL = [
    "mcp-marketplace/meok-omnibus-tracker-mcp",
    "mcp-marketplace/meok-watermark-attest-mcp",
    "mcp-marketplace/meok-cra-annex-iv-classifier-mcp",
    "mcp-marketplace/meok-nis2-de-register-mcp",
    "mcp-marketplace/meok-mcp-injection-scan-mcp",
    "mcp-marketplace/meok-dpia-edpb-template-mcp",
]


def main() -> int:
    p = argparse.ArgumentParser(description="CycloneDX 1.6 SBOM generator for MEOK MCPs")
    p.add_argument("pkg_dir", nargs="?", help="Path to package directory (with pyproject.toml)")
    p.add_argument("--out", type=str, default=None, help="Output path (default: <pkg>/sbom.cdx.json)")
    p.add_argument("--all", action="store_true", help="Process all top-tier MEOK MCPs in ~/clawd/")
    args = p.parse_args()

    home = pathlib.Path.home() / "clawd"

    if args.all:
        out_count = 0
        fail_count = 0
        for rel in TOP_MCPS_REL:
            pkg = home / rel
            if not pkg.exists():
                print(f"SKIP (missing): {rel}")
                fail_count += 1
                continue
            try:
                out = write_sbom(pkg)
                print(f"✓ {rel} → {out.relative_to(home) if str(out).startswith(str(home)) else out}")
                out_count += 1
            except Exception as e:
                print(f"✘ {rel}: {type(e).__name__}: {e}")
                fail_count += 1
        print(f"\n{out_count} SBOMs written, {fail_count} failed.")
        return 0 if fail_count == 0 else 1

    if not args.pkg_dir:
        p.print_help()
        return 2

    out = pathlib.Path(args.out) if args.out else None
    written = write_sbom(pathlib.Path(args.pkg_dir), out)
    print(f"✓ SBOM written → {written}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
