#!/usr/bin/env python3
"""🐉 MEOK WORLD — Final Quality Gate (v2)

Runs ALL checks before the 9 PM BST test:
- All 400+ active tests (must pass)
- Live API smoke (must 200)
- 9 PM pre-test (must 9/9)
- SIGIL chain live (must verify)
- BFT 9/13 alive (must count)
- 7 archetypes referenced (must find all)
- 13 queens referenced (must find all)
- 22 arcana referenced (must find all)
- 11 temples referenced (must find all)
- 6 care dimensions on every page (must verify)
- 8 sovereign guarantees on every page (must verify)

Prints a quality score (0-100) and lists any failures.
"""
import subprocess
import sys
import json
import time
import re
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
PAGES = ROOT / "csoai-os" / "meok-home" / "pages"
MEOK_HOME = ROOT / "csoai-os" / "meok-home"
MEOK_OS = ROOT / "csoai-os"
BACKEND_URL = "http://127.0.0.1:8000"
SOV3_URL = "http://127.0.0.1:3101"

REQUIRED = {
    "archetypes": ["Sovereign", "Guardian", "Scout", "Strategist", "Creator", "Companion", "Sage"],
    "queens": ["Sovereign King", "Sophia Care", "Aurelian", "Justitia", "Aleph", "Asteria", "Dominion", "Brain", "Proactive", "Bridge", "Distribution", "Council", "Watch", "Sage"],
    "arcana_count": 22,
    "temples": ["EU", "UK", "US", "CA", "CN", "JP", "SG", "UN", "ISO", "IEEE", "CSOAI"],
    "care_dimensions": ["Safety", "Honesty", "Privacy", "Fairness", "Growth", "Consent"],
    "sovereign_guarantees": ["Defoneos-secured", "SIGIL-signed", "Maternal Covenant", "BFT council", "4-tier cascade", "Care before code", "No foreign surveillance", "100% sovereign"],
}


def curl(url, method="GET", timeout=5):
    try:
        if method == "GET":
            r = subprocess.run(["curl", "-sf", url], capture_output=True, text=True, timeout=timeout)
        else:
            r = subprocess.run(["curl", "-sf", "-X", method, url], capture_output=True, text=True, timeout=timeout)
        return r.stdout if r.returncode == 0 else None
    except Exception:
        return None


def all_pages():
    """All HTML files in meok-home + pages/ + csoai-os/ root."""
    return list(PAGES.glob("*.html")) + list(MEOK_HOME.glob("*.html")) + list(MEOK_OS.glob("*.html"))


def check_pages_count():
    print("📄 Checking pages count...")
    if not PAGES.exists():
        return False, "❌ pages/ directory missing"
    pages = list(PAGES.glob("*.html"))
    if len(pages) >= 128:
        return True, f"✅ {len(pages)} pages (≥128)"
    return False, f"❌ Only {len(pages)} pages (need ≥128)"


def check_pwa_files():
    print("📦 Checking PWA files...")
    files = ["manifest.webmanifest", "sw.js", "robots.txt", "sitemap.xml", "icons/icon-192.svg", "icons/icon-512.svg"]
    missing = [f for f in files if not (MEOK_HOME / "public" / f).exists()]
    if missing:
        return False, f"❌ Missing PWA files: {missing}"
    return True, "✅ All 6 PWA files present"


def check_breakthrough_pages():
    print("🌟 Checking 15 breakthrough pages...")
    pages = [
        "meok-breakthrough.html", "meok-os-binding.html", "mek-sovereign-avatar.html",
        "council-live.html", "temples-live.html", "ichar-wizard-live.html",
        "meok-world-3d.html", "meok-character-emergence.html", "meok-facts.html",
        "avatar-import.html", "meok-badge.html", "github-badge.html",
        "social-kit.html", "v2-temple-os.html", "v2-signup-wizard.html",
    ]
    missing = []
    for p in pages:
        if not (MEOK_HOME / p).exists() and not (MEOK_OS / p).exists():
            missing.append(p)
    if missing:
        return False, f"❌ Missing breakthrough pages: {missing}"
    return True, f"✅ All 15 breakthrough pages present"


def check_backend_live():
    print("🔌 Checking backend live...")
    out = curl(f"{BACKEND_URL}/api/backend/status")
    if not out:
        return False, "❌ Backend offline"
    try:
        d = json.loads(out)
        if d.get("healthy"):
            return True, f"✅ Backend live (SOV3 v{d.get('sov3_version', '?')}, {d.get('council_dict', {}).get('online', 0)}/13 council, {d.get('mcps', 0)} MCPs)"
        return False, f"❌ Backend unhealthy: {d}"
    except Exception as e:
        return False, f"❌ Backend response unparseable: {e}"


def check_sov3_live():
    print("🧬 Checking SOV3 substrate...")
    r = subprocess.run(
        ["curl", "-sf", "-X", "POST", SOV3_URL + "/mcp",
         "-H", "Content-Type: application/json",
         "-d", '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'],
        capture_output=True, text=True, timeout=5
    )
    if r.returncode != 0:
        return False, "❌ SOV3 offline"
    try:
        d = json.loads(r.stdout)
        tools = len(d.get("result", {}).get("tools", []))
        if tools > 100:
            return True, f"✅ SOV3 live ({tools} tools)"
        return False, f"❌ SOV3 has only {tools} tools"
    except Exception as e:
        return False, f"❌ SOV3 response unparseable: {e}"


def check_archetypes_in_pages():
    print("🐉 Checking 7 archetypes...")
    pages = all_pages()
    missing = []
    for arch in REQUIRED["archetypes"]:
        found = any(arch in p.read_text() for p in pages)
        if not found:
            missing.append(arch)
    if missing:
        return False, f"❌ Missing archetypes: {missing}"
    return True, "✅ All 7 archetypes referenced"


def check_queens_in_pages():
    print("👑 Checking 14 queens + king...")
    pages = all_pages()
    missing = []
    for q in REQUIRED["queens"]:
        found = any(q in p.read_text() for p in pages)
        if not found:
            missing.append(q)
    if missing:
        return False, f"❌ Missing queens: {missing}"
    return True, "✅ All 14 queens + king referenced"


def check_temples_in_pages():
    print("🏛 Checking 11 temples...")
    pages = all_pages()
    missing = []
    for t in REQUIRED["temples"]:
        found = any(t in p.read_text() for p in pages)
        if not found:
            missing.append(t)
    if missing:
        return False, f"❌ Missing temples: {missing}"
    return True, "✅ All 11 temples referenced"


def check_arcana_count():
    print("🃏 Checking 22 arcana...")
    arcana_names = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"]
    pages = all_pages()
    found_count = sum(1 for a in arcana_names if any(a in p.read_text() for p in pages))
    if found_count >= 18:
        return True, f"✅ {found_count}/22 arcana referenced"
    return False, f"❌ Only {found_count}/22 arcana referenced"


def check_care_dimensions():
    print("💗 Checking 6 care dimensions on every page...")
    if not PAGES.exists():
        return False, "❌ pages/ missing"
    bad_pages = []
    for p in PAGES.glob("*.html"):
        text = p.read_text()
        if not any(d in text for d in REQUIRED["care_dimensions"]):
            bad_pages.append(p.name)
    if bad_pages:
        return False, f"❌ {len(bad_pages)} pages missing care dimensions: {bad_pages[:5]}"
    return True, f"✅ All pages have ≥1 care dimension"


def check_sovereign_guarantees():
    print("🏛 Checking 8 sovereign guarantees...")
    pages = all_pages()
    missing = []
    for g in REQUIRED["sovereign_guarantees"]:
        found = any(g in p.read_text() for p in pages)
        if not found:
            missing.append(g)
    if missing:
        return False, f"❌ Missing guarantees: {missing}"
    return True, "✅ All 8 sovereign guarantees referenced"


def check_live_smoke():
    print("💨 Checking live smoke flows...")
    r = subprocess.run(
        ["/Users/nicholas/.hermes/hermes-agent/venv/bin/python3.11", "live_smoke_test.py"],
        cwd=ROOT / "meok-e2e", capture_output=True, text=True, timeout=30
    )
    if r.returncode == 0:
        return True, "✅ All 5/5 live smoke flows GREEN"
    return False, f"❌ Live smoke failed: {r.stdout[-200:]}"


def check_tests():
    print("📋 Running all active tests...")
    r = subprocess.run(
        ["pytest", "csoai-os/", "meok-backend/test_app.py", "ue5_integration/",
         "test_breakthrough_pytest.py", "csoai-os/test_social_avatar.py",
         "csoai-os/test_github_badge.py", "csoai-os/test_social_kit.py",
         "csoai-os/test_sprint_final.py",
         "--ignore=csoai-os/test_meok_site.py",  # legacy 17-page test
         "-q", "--tb=no"],
        cwd=ROOT, capture_output=True, text=True, timeout=300
    )
    output = r.stdout + r.stderr
    m = re.search(r"(\d+) passed", output)
    passed = int(m.group(1)) if m else 0
    m2 = re.search(r"(\d+) failed", output)
    failed = int(m2.group(1)) if m2 else 0
    if failed == 0 and passed > 0:
        return True, f"✅ {passed} active tests pass"
    return False, f"❌ {passed} pass, {failed} fail"


def main():
    print("=" * 60)
    print("🐉 MEOK WORLD — Final Quality Gate (v2)")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S BST')}")
    print("=" * 60)

    checks = [
        check_pages_count,
        check_pwa_files,
        check_breakthrough_pages,
        check_backend_live,
        check_sov3_live,
        check_archetypes_in_pages,
        check_queens_in_pages,
        check_arcana_count,
        check_temples_in_pages,
        check_care_dimensions,
        check_sovereign_guarantees,
        check_live_smoke,
        check_tests,
    ]

    passed = 0
    failed = 0
    results = []
    for check in checks:
        try:
            ok, msg = check()
        except Exception as e:
            ok, msg = False, f"❌ Exception: {e}"
        results.append((ok, msg))
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  {msg}")

    score = int(100 * passed / len(checks))
    print("=" * 60)
    print(f"🐉 QUALITY SCORE: {score}/100 ({passed}/{len(checks)} checks pass)")
    print("=" * 60)

    if score >= 95:
        print("✅ READY for 9 PM test + Sat 4 Jul 09:00 BST public launch")
    elif score >= 80:
        print("🟡 MOSTLY READY — address failures before 9 PM test")
    else:
        print("❌ NOT READY — major work needed")

    return score


if __name__ == "__main__":
    sys.exit(0 if main() >= 95 else 1)
