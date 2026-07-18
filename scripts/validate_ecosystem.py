#!/usr/bin/env python3
"""
CSOAI Ecosystem Validation Script — Phase 3
Checks that all 11 verticals have complete protocol coverage
plus Phase 2 platform and Phase 3 scale components.
"""
import json
from pathlib import Path

BASE = Path("/Users/nicholas")
MEOK = BASE / "meok-ai"
SDK = BASE / "clawd" / "sdk" / "typescript"
UNITY = BASE / "clawd" / "sdk" / "unity"
DOCS = BASE / "clawd" / "docs"

VERTICALS = [
    "safety",
    "pokerhud",
    "suicidestop",
    "diyhelp",
    "fishkeeper",
    "koikeeper",
    "loopfactory",
    "industrial_domains",
    "industrial_hire",
    "councilofai",
    "asisecurity",
]

FRONTEND_DIRS = {
    "safety": "safetyofai",
    "pokerhud": "pokerhud.ai",
    "suicidestop": "suicidestop.ai",
    "diyhelp": "diyhelp.ai",
    "fishkeeper": "fishkeeper-ai",
    "koikeeper": "koikeeper-ai",
    "loopfactory": "loopfactory.ai",
    "industrial_domains": "industrial-domains",
    "industrial_hire": "industrial-hire-ai",
    "councilofai": "councilof-ai",
    "asisecurity": "asisecurity-portal",
}


def check_mcp_tools(vid: str) -> bool:
    tool_file = MEOK / "mcp" / "tools" / f"{vid}.py"
    return tool_file.exists()


def check_a2a_card(vid: str) -> bool:
    gateway = MEOK / "a2a" / "gateway.py"
    content = gateway.read_text()
    a2a_key = vid if vid != "safety" else "safetyofai"
    return f'"{a2a_key}":' in content


def check_frontend_lib(vid: str) -> bool:
    fe_dir = BASE / FRONTEND_DIRS[vid]
    return (fe_dir / "src" / "lib" / "csoai.ts").exists()


def check_protocols_page(vid: str) -> bool:
    fe_dir = BASE / FRONTEND_DIRS[vid]
    return (fe_dir / "src" / "app" / "protocols" / "page.tsx").exists()


def check_phase2() -> dict:
    results = {}
    cm = MEOK / "api" / "compliance_map.py"
    results["compliance_map_50"] = cm.exists() and "AT" in cm.read_text()
    results["mcp_server_card"] = (MEOK / "mcp" / "server_card.py").exists()
    results["trust_layer"] = (MEOK / "api" / "trust_layer.py").exists()
    results["marketplace"] = (MEOK / "api" / "marketplace.py").exists()
    results["unity_sdk"] = (UNITY / "CSOAI" / "CSOAI.cs").exists()
    results["ts_trust_client"] = (SDK / "src" / "trust" / "client.ts").exists()
    results["ts_marketplace_client"] = (SDK / "src" / "marketplace" / "client.ts").exists()
    server = MEOK / "mcp" / "server.py"
    server_txt = server.read_text() if server.exists() else ""
    results["server_wiring"] = "server_card_router" in server_txt and "trust_router" in server_txt
    return results


def check_phase3() -> dict:
    results = {}
    # Enterprise
    results["enterprise_api"] = (MEOK / "api" / "enterprise_characters.py").exists()
    results["government_api"] = (MEOK / "api" / "government.py").exists()
    results["defense_api"] = (MEOK / "api" / "defense.py").exists()
    results["openai_bridge"] = (MEOK / "mcp" / "tools" / "openai_bridge.py").exists()
    results["snowflake_export"] = (BASE / "clawd" / "scripts" / "export_snowflake.py").exists()
    results["gov_pitch"] = (DOCS / "government_pitch.md").exists()
    results["defense_pitch"] = (DOCS / "defense_pitch.md").exists()
    results["ts_enterprise_client"] = (SDK / "src" / "enterprise" / "client.ts").exists()
    results["ts_government_client"] = (SDK / "src" / "government" / "client.ts").exists()
    # Server wiring for Phase 3
    server = MEOK / "mcp" / "server.py"
    server_txt = server.read_text() if server.exists() else ""
    results["p3_server_wiring"] = "enterprise_router" in server_txt and "government_router" in server_txt and "defense_router" in server_txt
    # Tool registry wiring for openai_bridge
    tools_init = MEOK / "mcp" / "tools" / "__init__.py"
    tools_txt = tools_init.read_text() if tools_init.exists() else ""
    results["p3_tool_wiring"] = "OPENAI_BRIDGE_TOOLS" in tools_txt and "handle_openai_bridge_tool" in tools_txt
    return results


def main():
    print("=" * 70)
    print("CSOAI ECOSYSTEM VALIDATION — PHASE 3")
    print("=" * 70)

    total = 0
    passing = 0

    # Global Phase 1 checks
    sigil_ts = (SDK / "src" / "sigil" / "client.ts").exists()
    assti_py = (MEOK / "mcp" / "tools" / "assti.py").exists()

    print("\n📊 PHASE 1 — Foundation (per vertical)")
    print("-" * 70)
    for vid in VERTICALS:
        mcp = check_mcp_tools(vid)
        a2a = check_a2a_card(vid)
        fe_lib = check_frontend_lib(vid)
        fe_page = check_protocols_page(vid)

        score = sum([mcp, a2a, fe_lib, fe_page, sigil_ts, assti_py])
        total += 6
        passing += score

        status = "✅" if score == 6 else "⚠️" if score >= 4 else "❌"
        print(f"{status} {vid:20s}  MCP:{mcp}  A2A:{a2a}  SDK:{fe_lib}  Page:{fe_page}  SIGIL:{sigil_ts}  ASSTI:{assti_py}")

    # Phase 2 checks
    print("\n🚀 PHASE 2 — Platform")
    print("-" * 70)
    p2 = check_phase2()
    for name, ok in p2.items():
        status = "✅" if ok else "❌"
        print(f"{status} {name:30s}")
        total += 1
        passing += ok

    # Phase 3 checks
    print("\n🛡️ PHASE 3 — Scale")
    print("-" * 70)
    p3 = check_phase3()
    for name, ok in p3.items():
        status = "✅" if ok else "❌"
        print(f"{status} {name:30s}")
        total += 1
        passing += ok

    print("\n" + "=" * 70)
    print(f"SCORE: {passing}/{total} ({passing*100//total}%)")
    print("=" * 70)

    if passing == total:
        print("\n🎉 ALL SYSTEMS GO — 100% PROTOCOL COVERAGE ACHIEVED")
        print("🎉 Phase 1 Foundation + Phase 2 Platform + Phase 3 Scale complete")
    else:
        print(f"\n⚠️  {total - passing} items need attention")


if __name__ == "__main__":
    main()
