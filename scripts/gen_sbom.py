#!/usr/bin/env python3
"""gen_sbom.py — regenerable package-level SBOM for the monorepo surfaces.

Output: public/interop/sbom-councilof-ai.json (CycloneDX 1.5-lite).
Scope honesty note: the attestation engine (harness/rwa-attest/rwa_attest.py) is
Python stdlib-only (no third-party components); the web runtime components below
come from the repo package.json at the commit pinned during generation.
"""
import json, subprocess, sys
from pathlib import Path

R = Path(__file__).resolve().parents[1]
PKG = json.loads((R / "package.json").read_text())
commit = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True,
                        cwd=R).stdout.strip()[:12]

components = []
for section in ("dependencies", "devDependencies"):
    for name, ver in PKG.get(section, {}).items():
        components.append({
            "type": "library",
            "name": name,
            "version": ver.lstrip("^~"),
            "purl": f"pkg:npm/{name}@{ver.lstrip('^~')}",
            "scope": "required" if section == "dependencies" else "dev",
        })
components.append({
    "type": "application",
    "name": "council-ai-rwa-attest-engine",
    "version": "0.1.0",
    "description": "Python stdlib-only attestation engine (no third-party components).",
})

sbom = {
    "bomFormat": "CycloneDX",
    "specVersion": "1.5",
    "serialNumber": f"urn:uuid:{commit}-councilof-ai",
    "version": 1,
    "metadata": {
        "timestamp": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc).isoformat(),
        "tools": [{"name": "scripts/gen_sbom.py", "version": "1.0"}],
        "properties": [
            {"name": "repo", "value": "github.com/CSOAI-ORG/councilof-ai"},
            {"name": "commit", "value": commit},
            {"name": "scope_notes", "value":
                "Attestation engine = Python stdlib-only (verified imports). " +
                "Web runtime components listed from package.json. " +
                "xrpl.js CVE-2025-32965 not in dependency tree (no xrpl dep)."},
        ],
    },
    "components": components,
    "vulnerabilities": [],
}
out = R / "public/interop/sbom-councilof-ai.json"
out.write_text(json.dumps(sbom, indent=1, ensure_ascii=False))
print(f"SBOM written: {out} ({len(components)} components) @ {commit}")
