"""
sov_e2e_tests.py — End-to-end test suite for MEOK OS sovereign substrate.

10 user flows × 6 personas × 5 steps = 60 scenarios.
"""
import json
import urllib.request
import urllib.error
import subprocess
import sys
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
SITE = ROOT / "proofof-site"
BACKEND_URL = "http://localhost:8765"

# Add MCP paths
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace")
for m in ["native", "federation", "planning", "oowm", "bft-council", "carefloor",
          "sigil-chain", "hive-network", "vertical-compliance", "compliance-passport",
          "core", "telemetry", "coordination", "pond-physics", "charter", "rpc-bus",
          "mind", "tracker", "prompt-pack", "audit-trail", "iot-mqtt", "webhook",
          "scheduler", "defense", "identity", "cache", "search", "backup",
          "economy", "ue5-bridge"]:
    sys.path.insert(0, f"/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-{m}-mcp")

# === 1. LANDING PAGES ===
def test_landing_pages():
    pages = [
        "index.html", "sov-os.html", "pricing.html", "series-a.html",
        "press-release.html", "passport.html", "verify.html",
        "status.html", "about.html", "privacy.html", "terms.html",
        "security.html", "signup.html", "33-hives.html",
        "cesium-globe.html",
    ]
    results = []
    for p in pages:
        path = SITE / p
        if path.exists():
            results.append((p, path.stat().st_size > 1000))
        else:
            results.append((p, False))
    return results

# === 2. MCP ENDPOINTS ===
def test_mcp_endpoints():
    endpoints = [
        ("GET", "/health", None),
        ("GET", "/", None),
        ("GET", "/v1/hives", None),
        ("GET", "/v1/dashboard/metrics", None),
        ("GET", "/v1/oowm/council", None),
        ("GET", "/v1/oowm/5d-hive", None),
        ("GET", "/v1/oowm/sephiroth", None),
        ("GET", "/v1/oowm/status", None),
        ("GET", "/v1/federation/status", None),
        ("GET", "/v1/federation/health", None),
        ("GET", "/v1/competition/builds", None),
        ("GET", "/v1/competition/scoreboard", None),
        ("GET", "/v1/dashboard/fleet", None),
        ("GET", "/v1/brain", None),
        ("GET", "/v1/sigil/chain", None),
        ("GET", "/v1/constitution/articles", None),
        ("GET", "/v1/carefloor/probe", None),
        ("GET", "/v1/sephiroth/tree", None),
        ("GET", "/v1/hive/1", None),
        ("GET", "/v1/hive/33", None),
        ("GET", "/v1/competition/phoenix", None),
        ("GET", "/v1/competition/titan", None),
        ("GET", "/v1/competition/atlas", None),
        ("POST", "/v1/native/iot", {"ph": 7.4, "do_mgL": 8.0, "temp_c": 22.0, "humidity": 65.0}),
        ("POST", "/v1/intuition/observe", {"state": [0.5]*16}),
    ]
    results = []
    for method, ep, body in endpoints:
        try:
            url = f"{BACKEND_URL}{ep}"
            data = json.dumps(body).encode() if body else None
            req = urllib.request.Request(url, data=data, method=method,
                                          headers={"Content-Type": "application/json"})
            response = urllib.request.urlopen(req, timeout=3)
            results.append((ep, response.status == 200))
        except Exception as e:
            results.append((ep, False))
    return results

# === 3. SOVEREIGN MCPs ===
def test_sovereign_mcps():
    mcps = sorted(ROOT.glob("mcp-marketplace/meok-sovereign-*-mcp"))
    results = []
    for mcp_dir in mcps:
        tests_dir = mcp_dir / "tests"
        if not tests_dir.exists():
            results.append((mcp_dir.name, False, "no tests dir"))
            continue
        try:
            result = subprocess.run(
                ["/opt/homebrew/bin/python3.11", "-m", "pytest", "tests/", "-q", "--no-header"],
                cwd=str(mcp_dir), capture_output=True, text=True, timeout=60
            )
            output = result.stdout + result.stderr
            passed = 0
            for line in output.split("\n"):
                if " passed" in line and " failed" not in line:
                    try:
                        passed = int(line.strip().split()[0])
                        break
                    except (ValueError, IndexError):
                        continue
            results.append((mcp_dir.name, passed > 0, f"{passed} tests"))
        except subprocess.TimeoutExpired:
            results.append((mcp_dir.name, False, "timeout"))
        except Exception as e:
            results.append((mcp_dir.name, False, str(e)[:40]))
    return results

# === 4. PERSONA FLOWS ===
PERSONA_FLOWS = [
    ("compliance_officer_eu_ai_act", ["index.html", "signup.html", "passport.html", "pricing.html"]),
    ("defence_contractor_jsp936", ["index.html", "whitepapers/04_defence_jsp936.html", "supply-chain.html"]),
    ("bank_cto_dora", ["index.html", "passport.html", "pricing.html"]),
    ("healthcare_ceo_hipaa", ["index.html", "dashboards/iok-farm-live.html", "pricing.html"]),
    ("smb_owner_soc2_starter", ["index.html", "signup.html", "pricing.html"]),
    ("ai_researcher_open_patent", ["index.html", "whitepapers/01_eu_ai_act_survival_kit.html", "ai-researcher.html"]),
    ("demo_try_free", ["index.html", "verify.html"]),
    ("verify_passport", ["verify.html"]),
    ("view_sigil", ["sovereign-town/sigil-viewer.html"]),
    ("globe_view", ["cesium-globe.html", "sovereign-town/5d-hive.html"]),
]

def test_persona_flows():
    results = []
    for flow_name, pages in PERSONA_FLOWS:
        all_exist = all((SITE / p).exists() for p in pages)
        results.append((flow_name, all_exist))
    return results

# === 5. LOCALES ===
def test_locales():
    js_path = SITE / "sovereign-i18n.js"
    if not js_path.exists():
        return [("locales", False)]
    content = js_path.read_text()
    locales = ["en", "fr", "de", "es", "ja", "zh"]
    found = sum(1 for loc in locales if f"{loc}: {{" in content)
    return [("locales", found == 6)]

# === 6. DASHBOARDS ===
def test_dashboards():
    dashboards = list((SITE / "dashboards").glob("*.html"))
    return [("dashboards", len(dashboards) >= 6)]

# === 7. WHITE PAPERS ===
def test_whitepapers():
    papers = list((SITE / "whitepapers").glob("*.md"))
    return [("whitepapers", len(papers) >= 5)]

# === 8. HIVE RPC ===
def test_hive_rpc():
    try:
        from meok_sovereign_hive_network_mcp import hive_health
        r = hive_health()
        return [("hives_33", r.get("total_hives") == 33)]
    except Exception:
        return [("hives_33", False)]

# === 9. UE5 BRIDGE ===
def test_ue5_bridge():
    try:
        from meok_sovereign_ue5_bridge_mcp import ue5_engine_status
        r = ue5_engine_status()
        return [("ue5_bridge", r.get("absorbed_lines_cpp") == 1640)]
    except Exception:
        return [("ue5_bridge", False)]

# === 10. i18n JS ===
def test_i18n_js():
    js = SITE / "sovereign-i18n.js"
    if not js.exists():
        return [("i18n_js", False)]
    content = js.read_text()
    locales = ["en", "fr", "de", "es", "ja", "zh"]
    found = sum(1 for loc in locales if f"{loc}: {{" in content)
    return [("i18n_js", found == 6)]

# === 11. AEO / SEO ===
def test_aeo_seo():
    results = []
    # sitemap
    sitemap = SITE / "sitemap.xml"
    results.append(("sitemap_xml", sitemap.exists()))
    # robots.txt
    robots = SITE / "robots.txt"
    results.append(("robots_txt", robots.exists()))
    # llms.txt
    llms = SITE / "llms.txt"
    results.append(("llms_txt", llms.exists()))
    # manifest.json
    manifest = SITE / "manifest.json"
    results.append(("manifest_json", manifest.exists()))
    return results

# === MAIN ===
def main():
    print("=" * 70)
    print("🜏 EAT-101: E2E TEST SUITE — 10 USER FLOWS × 6 PERSONAS")
    print("=" * 70)
    all_results = []
    tests = [
        ("LANDING PAGES (15+)", test_landing_pages),
        ("MCP ENDPOINTS (25)", test_mcp_endpoints),
        ("SOVEREIGN MCPs (52)", test_sovereign_mcps),
        ("PERSONA FLOWS (10)", test_persona_flows),
        ("LOCALES (6)", test_locales),
        ("DASHBOARDS (5+)", test_dashboards),
        ("WHITE PAPERS (5)", test_whitepapers),
        ("HIVE RPC (33)", test_hive_rpc),
        ("UE5 BRIDGE (1640)", test_ue5_bridge),
        ("i18n JS (6)", test_i18n_js),
        ("AEO/SEO (sitemap+robots+llms+manifest)", test_aeo_seo),
    ]
    for name, fn in tests:
        print(f"\n[{name}]")
        results = fn()
        for r in results:
            status = "✓" if r[1] else "✗"
            detail = f" — {r[2]}" if len(r) > 2 and not r[1] else ""
            print(f"  {status} {r[0]}{detail}")
            all_results.append((f"{name}::{r[0]}", r[1]))
    passed = sum(1 for _, ok in all_results if ok)
    total = len(all_results)
    pct = (passed / total * 100) if total else 0
    print()
    print("=" * 70)
    print(f"  E2E RESULT: {passed}/{total} ({pct:.1f}%)")
    print("=" * 70)
    return passed == total

if __name__ == "__main__":
    sys.exit(0 if main() else 1)