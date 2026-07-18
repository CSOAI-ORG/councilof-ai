#!/usr/bin/env python3
"""Add the 9 new crown-jewel MCPs (since 2026-06-20) to the catalog + OSCAL package."""
import json
import re
import subprocess
from pathlib import Path

CLAWD = Path.home() / "clawd"
MP = CLAWD / "mcp-marketplace"
CATALOG = CLAWD / "csoai-mcp-catalog.json"
GEN = MP / "oscal-generator-mcp" / "gen_layer0_package.py"

# 9 new MCPs (from the Crown Jewels Hunt v2 + the GitHub API today)
NEW_MCPS = [
    {"name": "mica-crypto-mcp", "cluster": "framework-regulation", "tools": 5,
     "purpose": "EU MiCA (Reg 2023/1114) compliance MCP for crypto-asset issuers, exchanges, CASPs. MIT"},
    {"name": "meok-omnibus-tracker-mcp", "cluster": "framework-regulation", "tools": 6,
     "purpose": "EU AI Act + GDPR + DORA Digital Omnibus tracker — 8 cliff dates, 14 article changes."},
    {"name": "watermarking-authenticity-mcp", "cluster": "framework-regulation", "tools": 4,
     "purpose": "EU AI Act Article 50 watermarking + C2PA 2.1 MCP. 2 Dec 2026 deadline."},
    {"name": "regulatory-webhook-mcp", "cluster": "framework-regulation", "tools": 5,
     "purpose": "Regulatory change monitoring MCP — subscribe to EU AI Act, NIS2, DORA updates."},
    {"name": "uk-ai-bill-compliance-mcp", "cluster": "framework-regulation", "tools": 6,
     "purpose": "UK AI Bill 2026 compliance MCP. 5 principles framework."},
    {"name": "cra-compliance-mcp", "cluster": "framework-regulation", "tools": 9,
     "purpose": "EU Cyber Resilience Act (Reg 2024/2847) — products with digital elements, CE marking, SBOM."},
    {"name": "slsa-supply-chain-mcp", "cluster": "crypto-attestation", "tools": 5,
     "purpose": "SLSA v1.0 supply chain levels MCP. Provenance attestation. MIT"},
    {"name": "sigstore-cosign-mcp", "cluster": "crypto-attestation", "tools": 4,
     "purpose": "Sigstore cosign + Rekor transparency log verification MCP. MIT"},
    {"name": "sbom-cyclonedx-mcp", "cluster": "crypto-attestation", "tools": 6,
     "purpose": "SBOM generation in CycloneDX 1.6 + SPDX 2.3. Required by EO 14028, NIS2, CRA."},
]

# 1. Update catalog
catalog = json.loads(CATALOG.read_text())
existing_names = {c["name"] for c in catalog}
added = 0
for m in NEW_MCPS:
    if m["name"] not in existing_names:
        catalog.append(m)
        added += 1
CATALOG.write_text(json.dumps(catalog, indent=2))
print(f"Catalog: +{added} new MCPs, total now {len(catalog)}")
from collections import Counter
counts = Counter(c["cluster"] for c in catalog)
for k, v in counts.most_common():
    print(f"  {k:24s} {v}")

# 2. Update OSCAL LAYER0 list — append the 9 new
NEW_LAYER0 = [
    {"name": "mica-crypto-mcp", "frameworks": ["EU MiCA Reg 2023/1114"]},
    {"name": "meok-omnibus-tracker-mcp", "frameworks": ["EU AI Act Omnibus", "GDPR Omnibus", "DORA Omnibus"]},
    {"name": "watermarking-authenticity-mcp", "frameworks": ["EU AI Act Art.50 (watermark)", "C2PA 2.1"]},
    {"name": "regulatory-webhook-mcp", "frameworks": ["EU AI Act", "NIS2", "DORA"]},
    {"name": "uk-ai-bill-compliance-mcp", "frameworks": ["UK AI Bill 2026"]},
    {"name": "cra-compliance-mcp", "frameworks": ["EU CRA Reg 2024/2847", "NIS2", "EO 14028"]},
    {"name": "slsa-supply-chain-mcp", "frameworks": ["SLSA v1.0", "EU CRA"]},
    {"name": "sigstore-cosign-mcp", "frameworks": ["Sigstore cosign", "Rekor", "SLSA v1.0"]},
    {"name": "sbom-cyclonedx-mcp", "frameworks": ["CycloneDX 1.6", "SPDX 2.3", "EO 14028", "EU CRA", "NIS2"]},
]

gen_text = GEN.read_text()
# Find the end of the LAYER0 list (last "},  # article-level...")
# We add new entries just before the closing ]
# Simpler: append a new section after the existing list closes
insertion_marker = '{"name": "consciousness-engine-mcp", "frameworks": ["EU AI Act"]},\n]'
new_section = '{"name": "consciousness-engine-mcp", "frameworks": ["EU AI Act"]},\n'
for entry in NEW_LAYER0:
    new_section += f'    {json.dumps(entry)},\n'
new_section += ']\n'

if insertion_marker in gen_text:
    gen_text = gen_text.replace(insertion_marker, new_section)
    GEN.write_text(gen_text)
    print(f"OSCAL LAYER0: +{len(NEW_LAYER0)} new entries")
else:
    print("ERROR: insertion marker not found in gen_layer0_package.py")
    raise SystemExit(1)

# 3. Regenerate the OSCAL package
result = subprocess.run(
    ["python3", "gen_layer0_package.py"],
    cwd=str(MP / "oscal-generator-mcp"),
    capture_output=True, text=True, timeout=30
)
print()
print("=== OSCAL regen output ===")
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[-500:])
