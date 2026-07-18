#!/usr/bin/env python3
"""
🐉 AUTO-TEST HIVE — Sovereign Substrate Full-Stack Tests
Runs T1 (smoke), T2 (unit), T3 (integration) tiers.
Returns JSON + emits SIGIL.
"""
import sys, os, json, time, subprocess
from datetime import datetime, timezone
sys.path.insert(0, '/Users/nicholas/clawd/sovereign-substrate/awareness')
sys.path.insert(0, '/Users/nicholas/clawd/sovereign-substrate/absorption')

RESULTS = {"passed": 0, "failed": 0, "tests": [], "tier": "", "ts": ""}

def test(name, fn):
    """Run a test, record pass/fail."""
    start = time.time()
    try:
        result = fn()
        elapsed = (time.time() - start) * 1000
        if result is True or result is None:
            RESULTS["passed"] += 1
            RESULTS["tests"].append({"name": name, "status": "PASS", "ms": round(elapsed, 2)})
            print(f"  ✅ {name} ({elapsed:.1f}ms)")
        else:
            RESULTS["failed"] += 1
            RESULTS["tests"].append({"name": name, "status": "FAIL", "error": str(result)[:100], "ms": round(elapsed, 2)})
            print(f"  ❌ {name} → {str(result)[:100]}")
    except Exception as e:
        RESULTS["failed"] += 1
        RESULTS["tests"].append({"name": name, "status": "ERROR", "error": str(e)[:100], "ms": round((time.time()-start)*1000, 2)})
        print(f"  ⚠️  {name} → {str(e)[:100]}")

def tier_smoke():
    """T1: Smoke tests — port checks + process health."""
    RESULTS["tier"] = "T1-SMOKE"
    print("\n=== T1 SMOKE ===")
    # SOV3 :3101
    import urllib.request
    try:
        req = urllib.request.urlopen("http://localhost:3101/health", timeout=3)
        test("sov3:3101 health", lambda: req.getcode() == 200)
    except Exception as e:
        test("sov3:3101 health", lambda: f"SOV3 down: {e}")
    # SOV3 :3102
    try:
        req = urllib.request.urlopen("http://localhost:3102/", timeout=3)
        test("sov3:3102 alive", lambda: req.getcode() == 200)
    except Exception as e:
        test("sov3:3102 alive", lambda: f":3102 down: {e}")
    # csoai-static-deploy2
    try:
        req = urllib.request.urlopen("https://csoai-static-deploy2.vercel.app/", timeout=5)
        test("csoai-static-deploy2", lambda: req.getcode() == 200)
    except Exception as e:
        test("csoai-static-deploy2", lambda: f"deploy down: {e}")
    # Filesystem
    test("clawd exists", lambda: os.path.isdir("/Users/nicholas/clawd"))
    test("sov-town-llm", lambda: os.path.isdir("/Users/nicholas/clawd/sov-town-llm"))

def tier_unit():
    """T2: Unit tests for SOV3 tools."""
    RESULTS["tier"] = "T2-UNIT"
    print("\n=== T2 UNIT ===")
    from sov_awareness_tools import sov_presence_get, sov_pii_redact, sov_gesture_decode, sov_context_switch, sov_world_query
    from sov_absorption_tools import sov_overlay_generate, sov_overlay_apply, sov_gcp_tool_call, sov_knowledge_query, sov_absorb_feed
    # Awareness
    test("presence_get", lambda: sov_presence_get().get("current") in ["SOLO", "OWNER+KNOWN", "OWNER+UNKNOWN", "MULTI", "EMPTY"])
    test("pii_redact", lambda: sov_pii_redact("Nick in Yorkshire", "OWNER+UNKNOWN") != "Nick in Yorkshire")
    test("pii_no_redact_solo", lambda: sov_pii_redact("Nick in Yorkshire", "SOLO") == "Nick in Yorkshire")
    test("gesture_decode", lambda: sov_gesture_decode().get("gesture") == "UNKNOWN")
    test("context_switch", lambda: sov_context_switch("MULTI").get("new_state") == "MULTI")
    test("world_query", lambda: "answer" in sov_world_query("test"))
    # Absorption
    test("overlay_generate", lambda: sov_overlay_generate("test").get("tone") == "warm")
    test("overlay_apply", lambda: "adapted" in sov_overlay_apply("hello", {}))
    test("gcp_bigquery", lambda: sov_gcp_tool_call("bigquery", {})["tool"] == "bigquery")
    test("gcp_unknown", lambda: "error" in sov_gcp_tool_call("fake_tool", {}))
    test("knowledge_query", lambda: len(sov_knowledge_query("test")["domains"]) >= 13)
    test("absorb_feed", lambda: sov_absorb_feed("https://test.com")["status"] == "queued")
    # MEOK LAW
    sys.path.insert(0, '/Users/nicholas/clawd/meok-law')
    from meok_law import list_all_regions, list_casa_levels
    test("meok_law_regions", lambda: len(list_all_regions()) >= 9)
    test("meok_law_casa", lambda: len(list_casa_levels()) == 4)

def tier_integration():
    """T3: Integration tests for 6 buses."""
    RESULTS["tier"] = "T3-INTEGRATION"
    print("\n=== T3 INTEGRATION ===")
    from sov_awareness_tools import sov_presence_get, sov_pii_redact
    from sov_absorption_tools import sov_overlay_generate, sov_gcp_tool_call
    # Presence → PII: SOLO has no redact, MULTI does
    state = sov_context_switch_full("OWNER+UNKNOWN")
    redacted = sov_pii_redact("Nick Templeman", "OWNER+UNKNOWN")
    test("state_then_redact", lambda: redacted != "Nick Templeman")
    # Overlay + GCP bridge
    overlay = sov_overlay_generate("user_001")
    bridge = sov_gcp_tool_call("translate", {"text": "hi", "to": overlay.get("language", "en")})
    test("overlay_to_gcp", lambda: bridge.get("sovereign") == True)

def sov_context_switch_full(state):
    from sov_awareness_tools import sov_context_switch
    return sov_context_switch(state)

def main():
    RESULTS["ts"] = datetime.now(timezone.utc).isoformat()
    if len(sys.argv) < 2 or sys.argv[1] == "all":
        tier_smoke()
        tier_unit()
        tier_integration()
    elif sys.argv[1] == "smoke":
        tier_smoke()
    elif sys.argv[1] == "unit":
        tier_unit()
    elif sys.argv[1] == "integration":
        tier_integration()
    print(f"\n{'='*50}")
    print(f"  TOTAL: {RESULTS['passed']} passed, {RESULTS['failed']} failed")
    print(f"  TIER:  {RESULTS['tier']}")
    print(f"{'='*50}")
    # Write report
    report_path = f"/Users/nicholas/clawd/auto-test-hive/last_run_{int(time.time())}.json"
    with open(report_path, "w") as f:
        json.dump(RESULTS, f, indent=2)
    print(f"  Report: {report_path}")
    sys.exit(0 if RESULTS["failed"] == 0 else 1)

if __name__ == "__main__":
    main()
