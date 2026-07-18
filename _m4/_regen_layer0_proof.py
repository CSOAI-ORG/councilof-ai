#!/usr/bin/env python3
"""Regenerate the LAYER0_PROOF const in csoai-os/index.html from the new 79-component signed OSCAL."""
import json
import re
import sys
from pathlib import Path

OSCAL = Path.home() / "clawd" / "mcp-marketplace" / "oscal-generator-mcp" / "layer0_protocol.oscal.json"
SIG = Path.home() / "clawd" / "mcp-marketplace" / "oscal-generator-mcp" / "layer0_protocol.oscal.sig.json"
INDEX = Path.home() / "clawd" / "csoai-os" / "index.html"

pkg = json.loads(OSCAL.read_text())
sig_data = json.loads(SIG.read_text())

comps = pkg.get("component-definition", {}).get("components", [])
print(f"Loaded {len(comps)} components from signed OSCAL")
print(f"sha256: {sig_data['canonical_sha256'][:16]}…")
print(f"sig: {sig_data['signature'][:16]}…")

# Build the LAYER0_PROOF const (compact JS, one line)
items = []
for c in comps:
    title = c.get("title", "?")
    desc = c.get("description", "")
    items.append({"n": title, "f": desc.replace("Governs: ", "").strip() if "Governs" in desc else desc.strip()})

proof_obj = {
    "protocol": "CSOAI Layer-0 Protocol",
    "alg": sig_data["algorithm"],
    "count": len(comps),
    "sha256": sig_data["canonical_sha256"],
    "sig": sig_data["signature"],
    "pub": sig_data["public_key"],
    "sigil": sig_data.get("sigil", ""),
    "components": items,
}
proof_js = "const LAYER0_PROOF=" + json.dumps(proof_obj, separators=(",", ":")) + ";"

# Find and replace the existing LAYER0_PROOF line
html = INDEX.read_text()
new_html, n = re.subn(r"const LAYER0_PROOF=\{.*?\};", lambda m: proof_js, html, count=1, flags=re.DOTALL)
if n != 1:
    print(f"ERROR: replaced {n} occurrences (expected 1)")
    sys.exit(1)

INDEX.write_text(new_html)
print(f"Updated {INDEX}")
print(f"  components in LAYER0_PROOF: {len(items)}")
print(f"  size: {INDEX.stat().st_size} bytes")
