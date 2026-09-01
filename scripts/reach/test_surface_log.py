#!/usr/bin/env python3
"""Coverage + honesty floors on the shipped reach-surfaces log and playbook.

Loads public/interop/reach-surfaces.json (not a reimplementation of classification).
OBJECTIVE names are the coverage oracle.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOG = ROOT / "public" / "interop" / "reach-surfaces.json"
PLAYBOOK = ROOT / "BROWSER-PLAYBOOK.md"
X402 = ROOT / "public" / "interop" / "x402-discovery-fact.json"
TWOWAY = ROOT / "public" / "interop" / "xrpl-two-way-check.json"

# Exact tokens from OBJECTIVE TIER S / A / B / FREE-MONEY.
OBJECTIVE_NAMES = [
    "HF", "npm", "MCP registry", "Smithery gateway", "GitHub topics",
    "awesome-mcp PR", "Zenodo", "Communities", "Glama", "PulseMCP",
    "VS Code MCP gallery", "Cursor dir", "Product Hunt",
    "OpenVC", "Signal", "Dealroom", "Wellfound", "Crunchbase",
    "TechCrunch", "FT", "Politico", "404",
    "W3C CG", "SCITT", "C2PA", "NIST", "OpenSSF Best-Practices",
    "OpenML", "W&B", "Kaggle", "mcp.directory", "Cline", "Zed", "Windsurf",
    "HN Show-HN", "r/LocalLLaMA", "dev.to", "Medium", "Hashnode", "LinkedIn", "X",
    "Ars", "IEEE", "MIT-TR", "VentureBeat", "Register",
    "G2", "Capterra", "AlternativeTo",
    "F6S", "Gust", "EU-Startups", "Failory", "Indie Hackers",
    "niche AI dirs", "UK tech media",
    "NVIDIA Inception", "Microsoft Founders Hub", "Google for Startups", "AWS Activate", "OCI",
    "Cloudflare", "Innovate UK", "EIC",
]


def test_coverage() -> None:
    d = json.loads(LOG.read_text(encoding="utf-8"))
    rows = d["surfaces"]
    by = {r["name"]: r for r in rows}
    missing = [n for n in OBJECTIVE_NAMES if n not in by]
    assert not missing, f"missing OBJECTIVE names: {missing}"
    for r in rows:
        assert r["openness"] in ("OPEN", "GATED"), r
        assert r["status"] in ("DONE", "QUEUED"), r
        assert r["name"], r
    print(f"coverage OK: {len(OBJECTIVE_NAMES)} OBJECTIVE names, {len(rows)} rows")


def test_gated_click_paths() -> None:
    """Every GATED TIER S and TIER A evidence URL is an Open: click-path in the playbook.

    TIER B may stay a shorter batch, but S+A cannot be a name dump: the log
    evidence URL must appear as `Open: <url>` so the owner can paste.
    """
    d = json.loads(LOG.read_text(encoding="utf-8"))
    play = PLAYBOOK.read_text(encoding="utf-8")
    missing = []
    counted = 0
    for r in d["surfaces"]:
        if r.get("openness") != "GATED" or r.get("tier") not in ("S", "A"):
            continue
        counted += 1
        url = (r.get("evidence") or "").strip()
        if not url:
            missing.append(r["name"] + " (empty evidence)")
            continue
        needle = f"Open: {url}"
        if needle not in play:
            missing.append(f"{r['name']} {url}")
    assert not missing, f"GATED TIER S/A Open: click-paths missing from playbook: {missing}"
    print(f"click-paths OK: {counted} TIER S+A GATED Open: URLs in playbook")


def test_free_money_click_paths() -> None:
    d = json.loads(LOG.read_text(encoding="utf-8"))
    play = PLAYBOOK.read_text(encoding="utf-8")
    missing = []
    for r in d["surfaces"]:
        if r.get("tier") != "FREE-MONEY":
            continue
        url = (r.get("evidence") or "").strip()
        if not url or url not in play:
            missing.append(f"{r['name']} {url}")
    assert not missing, f"FREE MONEY click-paths missing from playbook: {missing}"
    print(f"free-money paths OK: {sum(1 for r in d['surfaces'] if r.get('tier')=='FREE-MONEY')} URLs in playbook")


def test_honesty_floors() -> None:
    blob = LOG.read_text(encoding="utf-8") + PLAYBOOK.read_text(encoding="utf-8")
    blob += X402.read_text(encoding="utf-8") if X402.exists() else ""
    tw = json.loads(TWOWAY.read_text(encoding="utf-8"))
    assert tw.get("honest_two_way_count") == "4/16", tw.get("honest_two_way_count")
    assert "4/16" in blob
    low = blob.lower()
    assert "16/16 two-way" not in low
    assert "never 16/16" in low
    assert "press list" in low
    assert "not clients" in low or "not a client" in low
    assert "certification" in low
    assert "measurement not certification" in low or "we measure, never certify" in low or "not a certificate" in low
    assert "saas" in low
    assert "raas not saas" in low or "raas, not saas" in low or "not saas" in low
    assert "rfc 9942" in low or "rfc 9942/9943" in low
    print("honesty floors OK: 4/16, no 16/16 two-way, SWIFT not clients, not cert, RaaS not SaaS")


def main() -> int:
    test_coverage()
    test_honesty_floors()
    test_gated_click_paths()
    test_free_money_click_paths()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
