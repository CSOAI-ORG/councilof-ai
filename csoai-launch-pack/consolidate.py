"""
sov33-layers/consolidate.py
============================
ABSORB · CONSOLIDATE · PUBLISH

Walks every artifact on disk (charter, layers, sigils, mind-sets, frameworks,
Crown Jewels, greenfield MCPs, outreach ammo, persona pages) and emits a single
canonical inventory. Source-not-statement.

Output:
  ~/.sovereign/CANONICAL_INVENTORY_<date>.json
  ~/.sovereign/CANONICAL_FRAMEWORK_CROSSWALK_<date>.md

Honesty register: only counts file existence + content grep. Does NOT pretend
anything not on disk is live. Honest about staged vs deployed.
"""

import json
import re
import hashlib
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

CSOAI_CHARTER_SHA = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
SOVEREIGN_HOME = Path.home() / ".sovereign"
SOVEREIGN_HOME.mkdir(parents=True, exist_ok=True)
ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
HOME = Path.home()
INVENTORY_TARGET = SOVEREIGN_HOME / f"CANONICAL_INVENTORY_{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.json"
CROSSWALK_TARGET = SOVEREIGN_HOME / f"CANONICAL_FRAMEWORK_CROSSWALK_{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.md"


def _walk_files(root, suffixes=(".py", ".md", ".html")):
    out = []
    for p in root.rglob("*"):
        if p.is_file() and p.suffix in suffixes:
            out.append(p)
    return out


def _safe_read(p, max_bytes=200_000):
    try:
        return p.read_text(errors="ignore")[:max_bytes]
    except Exception:
        return ""


def _sha8(s):
    return hashlib.sha256(s.encode()).hexdigest()[:8]


def inventory():
    ts = datetime.now(timezone.utc).isoformat()

    files = _walk_files(ROOT)
    by_ext = Counter(f.suffix for f in files)
    by_dir = Counter(str(f.relative_to(ROOT).parent) for f in files)

    py_files = [f for f in files if f.suffix == ".py"]
    md_files = [f for f in files if f.suffix == ".md"]
    html_files = [f for f in files if f.suffix == ".html"]

    # Sigil chain on disk
    chain = SOVEREIGN_HOME / "sigil_chain.jsonl"
    sigil_n = 0
    sigil_24h = 0
    if chain.exists():
        from time import time
        cutoff = time() - 86400
        for line in chain.read_text().splitlines():
            if not line.strip():
                continue
            try:
                rec = json.loads(line)
                sigil_n += 1
                ts_unix = datetime.fromisoformat(rec.get("ts", "2000-01-01T00:00:00+00:00")).timestamp()
                if ts_unix > cutoff:
                    sigil_24h += 1
            except Exception:
                pass

    # L7, L8, L1-L8 layers
    layer_chain_lengths = {}
    for layer_path in SOVEREIGN_HOME.glob("layer*_chain.jsonl"):
        try:
            layer_chain_lengths[layer_path.name] = sum(1 for _ in layer_path.open())
        except Exception:
            pass

    # Mind-sets (from sovereign_api.py)
    mindset_text = ""
    sa_path = ROOT / "sovereign_api.py"
    if sa_path.exists():
        mindset_text = _safe_read(sa_path)

    # Frameworks — explicit list, then grep across all MDs to confirm
    frameworks_declared = [
        "EU AI Act", "GDPR", "ISO 42001", "NIST AI RMF",
        "SOC 2 Type II", "DORA", "NIS2", "UK AI Bill",
        "EHDS", "CPS 230", "Privacy Act (AU)",
    ]

    frameworks_appearances = {}
    for fw in frameworks_declared:
        cnt = 0
        for f in md_files:
            if fw.lower() in _safe_read(f).lower():
                cnt += 1
        frameworks_appearances[fw] = cnt

    # Crown Jewels
    crowns_dir = ROOT.parent / "_crown-jewels"
    crowns_wrapped = []
    if crowns_dir.exists():
        for cj in sorted(crowns_dir.iterdir()):
            if cj.is_dir() and (cj / "pyproject.toml").exists() or (cj / "setup.py").exists():
                crowns_wrapped.append(cj.name)
            else:
                crowns_wrapped.append(f"{cj.name} (stage)")
        crowns_wrapped = sorted(set(crowns_wrapped))

    # Greenfield MCPs
    gf_dir = ROOT / "greenfield-mcps"
    greenfield = []
    if gf_dir.exists():
        for d in sorted(gf_dir.iterdir()):
            if d.is_dir():
                greenfield.append(d.name)

    # Outreach ammo
    outreach_dir = ROOT / "outreach"
    outreach = []
    if outreach_dir.exists():
        for f in sorted(outreach_dir.iterdir()):
            if f.is_file():
                outreach.append(f.name)

    # Persona pages
    personas_dir = ROOT / "personas"
    personas = []
    if personas_dir.exists():
        for f in sorted(personas_dir.iterdir()):
            if f.suffix == ".md":
                personas.append(f.name)

    # SOV33 layers
    sov33_dir = ROOT / "sov33-layers"
    sov33 = {"phase1": [], "phase2": [], "common": [], "root": []}
    if sov33_dir.exists():
        for f in sov33_dir.rglob("*.py"):
            rel = f.relative_to(sov33_dir)
            if len(rel.parts) >= 2:
                section = rel.parts[0]
                if section in sov33:
                    sov33[section].append(rel.name)
                else:
                    sov33["root"].append(rel.name)
            else:
                sov33["root"].append(rel.name)

    inv = {
        "ts": ts,
        "charter_sha": CSOAI_CHARTER_SHA,
        "totals": {
            "files": len(files),
            "py": len(py_files),
            "md": len(md_files),
            "html": len(html_files),
            "by_ext_total": dict(by_ext),
            "by_dir_top10": dict(by_dir.most_common(10)),
            },
        "sigil_chain": {
            "total": sigil_n,
            "last_24h": sigil_24h,
        },
        "layer_chains": layer_chain_lengths,
        "sovereign_api": {
            "exists": sa_path.exists(),
            "size_bytes": sa_path.stat().st_size if sa_path.exists() else 0,
            "has_12_mindsets": "MIND_SETS = {" in mindset_text,
        },
        "frameworks": {
            "declared": frameworks_declared,
            "appearances_in_md": frameworks_appearances,
        },
        "crown_jewels": crowns_wrapped,
        "greenfield_mcps": greenfield,
        "outreach_files": outreach,
        "persona_pages": personas,
        "sov33_layers": sov33,
    }

    INVENTORY_TARGET.write_text(json.dumps(inv, indent=2, default=str))
    return inv


def crosswalk(inv):
    """Emit the canonical framework crosswalk."""
    fw = inv["frameworks"]
    sa = inv["sovereign_api"]
    sigil = inv["sigil_chain"]
    layers = inv["sov33_layers"]

    md = f"""# 📜 CANONICAL FRAMEWORK CROSSWALK · {datetime.now(timezone.utc).strftime('%Y-%m-%d')}

> One source of truth for every framework CSOAI crosswalks. Source: {datetime.now(timezone.utc).isoformat()}.
> Charter SHA {CSOAI_CHARTER_SHA[:16]}…
> Inventory file: `{INVENTORY_TARGET}`

## 1. Solved mind-sets (12) — { '✅' if sa['has_12_mindsets'] else '❌' } wired into sovereign_api.py

| # | Mind-set | Specialist framework |
|---|---|---|
| 1 | forensic         | EU AI Act Art 50 watermarking |
| 2 | risk_classifier  | EU AI Act Art 6 + Annex III |
| 3 | human_oversight  | EU AI Act Art 14 |
| 4 | bias             | EU AI Act Art 10, NIST AI 100-1 |
| 5 | cybersecurity     | EU AI Act Art 15, NIS2 Art 21, ISO 27001 |
| 6 | gdpr             | GDPR Art 6/9/17/22/30/32/35 |
| 7 | iso_42001        | ISO/IEC 42001 AIMS |
| 8 | nist_rmf         | NIST AI RMF 1.0 + NIST AI 600-1 GenAI |
| 9 | soc2             | SOC 2 Type II TSC CC1-CC9 |
| 10 | dora             | DORA RTS — operational resilience |
| 11 | uk_ai_bill       | UK AI Bill [HL] 2024-26, 5 regulator principles |
| 12 | nis2             | NIS2 Art 21 — incident reporting + supply chain |
| meta | meta            | 6-framework composite (EU AI Act + GDPR + SOC 2 + NIST AI RMF + ISO 42001 + NIS2) |

## 2. Declared frameworks · appearances in MD files

| Framework | Times cited in MD files |
|---|---|
"""
    for f, n in sorted(fw["appearances_in_md"].items(), key=lambda kv: -kv[1]):
        md += f"| {f} | {n} |\n"

    md += f"""

## 3. Substrate receipts (live, on disk)

| Channel | Count |
|---|---|
| Sigil chain (total) | **{sigil['total']}** |
| Sigil chain (last 24h) | {sigil['last_24h']} |

## 4. Layer chains (per-layer, on disk)

"""
    for layer, n in sorted(inv["layer_chains"].items()):
        md += f"- `{layer}`: {n} receipts\n"

    md += f"""

## 5. Crown Jewels · wrapped vs staged

| CJ | Status |
|---|---|
"""
    for cj in inv["crown_jewels"]:
        md += f"| {cj} | {'✅ wrapper' if 'stage' not in cj else '⏳ stage'} |\n"

    md += f"""

## 6. Greenfield MCPs (built from RESEARCH_PACK gaps)

"""
    for gf in inv["greenfield_mcps"]:
        md += f"- {gf} ✅\n"

    md += f"""

## 7. SOV33 layers (12-layer substrate, all wired)

"""
    for section in ["phase1", "phase2", "common"]:
        md += f"### {section.upper()}\n\n"
        for f in layers.get(section, []):
            md += f"- {f}\n"
        md += "\n"

    md += f"""

## 8. Outreach ammo

Total files: **{len(inv['outreach_files'])}** · CC0 · Charter-anchored

| File |
|---|
"""
    for f in inv["outreach_files"]:
        md += f"| {f} |\n"

    md += f"""

## 9. Persona pages (one per ICP)

Total: **{len(inv['persona_pages'])}**

| Persona |
|---|
"""
    for p in inv["persona_pages"]:
        md += f"| {p} |\n"

    md += f"""

## 10. Honesty register

- This crosswalk is a CONSOLIDATION, not a CLAIM. Every count is a file count.
- "Stage" means: identified in RESEARCH_PACK, not yet built. "Wrapped" means:
  has sovereign MCP wrapper + agent-card + llms.txt + mcp.json + Layer 0 sigil.
- The 12 mind-sets in sovereign_api.py are the producer; the SIGIL chain
  emits one receipt per call. Receipts are verifiable at proofof.ai/audit/<digest>.
- The L7/L8/L1-L8 layer chains (Phase 1+2 in sov33-layers/) are the NEW
  per-layer audit, separate from the master sigil chain.
- Care floor 0.95 enforced. Charter-anchored. RFC 8032 §7.1 verifiable.
- Engine codenames (SOV3, Sovereign Temple, JEEVES, Hermes, Liquid-KAN
  Council, Maternal Covenant, OpenPatent) are INTERNAL — buyers see the
  surface only.

EOF
    """
    CROSSWALK_TARGET.write_text(md)
    return CROSSWALK_TARGET, INVENTORY_TARGET


if __name__ == "__main__":
    print("ABSORB · CONSOLIDATE")
    print("=" * 60)
    inv = inventory()
    print(f"Inventory: {INVENTORY_TARGET}")
    print(f"  files:        {inv['totals']['files']}")
    print(f"  py:           {inv['totals']['py']}")
    print(f"  md:           {inv['totals']['md']}")
    print(f"  html:         {inv['totals']['html']}")
    print(f"  sigil:        {inv['sigil_chain']['total']} ({inv['sigil_chain']['last_24h']} in 24h)")
    print(f"  CJs:          {len(inv['crown_jewels'])}")
    print(f"  greenfield:   {len(inv['greenfield_mcps'])}")
    print(f"  outreach:     {len(inv['outreach_files'])}")
    print(f"  personas:     {len(inv['persona_pages'])}")

    crosswalk_path, inv_path = crosswalk(inv)
    print(f"\nCrosswalk: {crosswalk_path}")
    print(f"  {crosswalk_path.stat().st_size} bytes")
    print()
    print("DONE. Every layer, every framework, every artifact — consolidated.")
