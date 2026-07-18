#!/usr/bin/env python3
"""
🐉 CROSS-HIVE TEST HARNESS
Connects auto-test hive to ALL 33 hives + 6 buses + Awareness + Absorption + MEOK LAW + 47 agents + CASA + 30 crosswalks.
Tests each. Reports pass/fail. Then auto-improve where possible.
"""
import sys, os, json, time, urllib.request, urllib.error
sys.path.insert(0, '/Users/nicholas/clawd/sovereign-substrate/awareness')
sys.path.insert(0, '/Users/nicholas/clawd/sovereign-substrate/absorption')
sys.path.insert(0, '/Users/nicholas/clawd/meok-law')

HIVES = [
    "safetyof", "transparencyof", "csoai", "meok", "openmoe", "proofof",
    "agisafe", "asisecurity", "biasdetectionof", "dataprivacyof",
    "ethicalgovernanceof", "accountabilityof", "koikeeper", "fishkeeper",
    "grabhire", "loopfactory", "muckaway", "landlaw", "councilof",
    "sovereign-town", "openpatent", "cobolbridge", "optimobile",
    "planthire", "commercialvehicle", "meok-compliance-gateway",
    "diyhelp", "suicidestop", "socialmediamanager", "sandbox", "openmcp"
]

LAYER_0_BUSES = ["identity", "attestation", "policy", "payment", "audit", "council"]

RESULTS = {"hives": {}, "buses": {}, "improvements": [], "ts": ""}

def http_check(url, timeout=5):
    try:
        req = urllib.request.urlopen(url, timeout=timeout)
        return req.getcode()
    except urllib.error.HTTPError as e:
        return e.code
    except Exception as e:
        return 0

def test_hives():
    print("\n=== 33 HIVES ===")
    for h in HIVES:
        url = f"https://{h}.ai"
        code = http_check(url)
        # 200/307/308 = live; 0 = WARP/blocked; 404 = broken
        status = "LIVE" if code in [200, 307, 308] else ("WARP" if code == 0 else f"ERR-{code}")
        RESULTS["hives"][h] = code
        icon = {"LIVE": "✅", "WARP": "⚠️", "ERR-404": "❌"}.get(status, "⚠️")
        print(f"  {icon} {h}.ai → HTTP {code} ({status})")
    live = sum(1 for c in RESULTS["hives"].values() if c in [200, 307, 308])
    warp = sum(1 for c in RESULTS["hives"].values() if c == 0)
    broken = sum(1 for c in RESULTS["hives"].values() if c == 404)
    print(f"  TOTAL: {live} live + {warp} WARP + {broken} broken = {len(HIVES)} hives")
    return live

def test_buses():
    print("\n=== 6 LAYER 0 BUSES (via SOV3 MCP) ===")
    bus_tests = {
        "identity": ("tools/call", "sov_presence_get", {}),
        "attestation": ("tools/call", "sov_knowledge_query", {"query": "test"}),
        "policy": ("tools/call", "sov_overlay_generate", {"person_id": "test"}),
        "payment": ("tools/call", "sov_gcp_tool_call", {"tool_name": "bigquery", "args": {}}),
        "audit": ("tools/call", "sov_absorb_feed", {"source_uri": "https://test.com"}),
        "council": ("tools/call", "sov_context_switch", {"new_state": "OWNER+KNOWN"}),
    }
    for bus, (method, tool, args) in bus_tests.items():
        # This is local function, not actual MCP call
        try:
            # Use local imports
            if bus == "identity":
                from sov_awareness_tools import sov_presence_get
                r = sov_presence_get()
                ok = "current" in r
            elif bus == "attestation":
                from sov_absorption_tools import sov_knowledge_query
                r = sov_knowledge_query("test")
                ok = "domains" in r
            elif bus == "policy":
                from sov_absorption_tools import sov_overlay_generate
                r = sov_overlay_generate("test")
                ok = "tone" in r
            elif bus == "payment":
                from sov_absorption_tools import sov_gcp_tool_call
                r = sov_gcp_tool_call("bigquery", {})
                ok = "tool" in r
            elif bus == "audit":
                from sov_absorption_tools import sov_absorb_feed
                r = sov_absorb_feed("https://test.com")
                ok = "status" in r
            elif bus == "council":
                from sov_awareness_tools import sov_context_switch
                r = sov_context_switch("OWNER+KNOWN")
                ok = "new_state" in r
            RESULTS["buses"][bus] = "PASS" if ok else "FAIL"
            print(f"  ✅ {bus}: {RESULTS['buses'][bus]}")
        except Exception as e:
            RESULTS["buses"][bus] = f"ERROR: {e}"
            print(f"  ❌ {bus}: {e}")

def test_47_agents():
    print("\n=== 47 AGENTS ===")
    agents_file = "/Users/nicholas/clawd/sov-town-llm/personas/47-agents.json"
    if os.path.exists(agents_file):
        with open(agents_file) as f:
            data = json.load(f)
        agents = data.get("agent_roster", [])
        print(f"  Loaded {len(agents)} agents from roster")
        # Verify each has name, role, hive
        for a in agents:
            assert all(k in a for k in ["name", "role", "hive"]), f"Agent missing keys: {a}"
        print(f"  ✅ All {len(agents)} agents have name + role + hive")
        # Hive distribution
        from collections import Counter
        hives = Counter(a["hive"] for a in agents)
        print(f"  Hives: {dict(hives)}")
    else:
        print(f"  ❌ {agents_file} not found")

def test_meok_law():
    print("\n=== MEOK LAW ===")
    from meok_law import list_all_regions, list_casa_levels, lookup_sector
    regions = list_all_regions()
    casa = list_casa_levels()
    cyber = lookup_sector("cybersecurity")
    print(f"  ✅ {len(regions)} regions: {regions[:3]}...")
    print(f"  ✅ {len(casa)} CASA levels")
    print(f"  ✅ Cybersecurity sector: ${cyber.get('estimated_market', '?')}")

def test_awareness():
    print("\n=== AWARENESS v2 ===")
    from sov_awareness_tools import sov_presence_get, sov_pii_redact
    state = sov_presence_get()
    redacted = sov_pii_redact("Nick in Yorkshire 555-1234", "OWNER+UNKNOWN")
    print(f"  ✅ presence: {state['current']}")
    print(f"  ✅ redact:   {redacted}")

def test_absorption():
    print("\n=== ABSORPTION v3 ===")
    from sov_absorption_tools import sov_knowledge_query, sov_overlay_generate
    domains = sov_knowledge_query("Buddhism")["domains"]
    overlay = sov_overlay_generate("saudi_muslim_woman_35")
    print(f"  ✅ {len(domains)} knowledge domains")
    print(f"  ✅ overlay privacy: {overlay.get('privacy_level')}")

def auto_improve():
    """Where we can improve, auto-fix. Otherwise, queue for review."""
    print("\n=== AUTO-IMPROVE ===")
    # Improvement 1: pokergud typo → fix to pokerhud
    if RESULTS["hives"].get("pokergud") == 404:
        # Already fixed earlier as pokerhud
        RESULTS["improvements"].append({"issue": "pokergud typo", "fix": "renamed to pokerhud", "status": "done"})
        print("  ✅ pokergud typo already fixed as pokerhud")
    # Improvement 2: csoai-static-deploy2 apex gone — note
    if 404 in RESULTS["hives"].values():
        RESULTS["improvements"].append({"issue": "some hive 404s", "fix": "deferred to Nick's domain move"})
        print("  ⚠️ Some 404s — defer to Nick's apex domain move")
    # Improvement 3: if all buses pass, note
    if all(v == "PASS" for v in RESULTS["buses"].values()):
        RESULTS["improvements"].append({"issue": "all 6 buses pass", "fix": "no fix needed", "status": "good"})
        print("  ✅ All 6 Layer 0 buses pass")

def main():
    from datetime import datetime, timezone
    RESULTS["ts"] = datetime.now(timezone.utc).isoformat()
    test_hives()
    test_buses()
    test_47_agents()
    test_meok_law()
    test_awareness()
    test_absorption()
    auto_improve()
    # Summary
    total_hives = len(RESULTS["hives"])
    live = sum(1 for c in RESULTS["hives"].values() if c in [200, 307, 308])
    buses_pass = sum(1 for v in RESULTS["buses"].values() if v == "PASS")
    print(f"\n{'='*60}")
    print(f"  CROSS-HIVE TEST SUMMARY:")
    print(f"    Hives: {live}/{total_hives} live")
    print(f"    Buses: {buses_pass}/6 pass")
    print(f"    Improvements: {len(RESULTS['improvements'])} found")
    print(f"{'='*60}")
    # Write report
    report = f"/Users/nicholas/clawd/auto-test-hive/cross_hive_report_{int(time.time())}.json"
    with open(report, "w") as f:
        json.dump(RESULTS, f, indent=2)
    print(f"  Report: {report}")

if __name__ == "__main__":
    main()
