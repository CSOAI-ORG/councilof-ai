"""
M4 MCP bridge tests — proves Hermes/JEEVES's sovereign-os can call M4's MCPs
over the same CLI surface. Real tests, no stubs.
"""
import sys, subprocess, json
from pathlib import Path

TESTS = [
    {
        "name": "bridgethink_mcp.py --tools",
        "cmd": ["python3", "csoai-os/mcp/bridgethink_mcp.py", "--tools"],
        "expect": ["server", "bridgethink", "arcanas", "queens", "care_floor", "0.95"],
    },
    {
        "name": "bridgethink_mcp.py --demo",
        "cmd": ["python3", "csoai-os/mcp/bridgethink_mcp.py", "--demo"],
        "expect": ["oowm_evolve", "sigil", "bridgethink-1.0"],
    },
    {
        "name": "sovereign-tools-mcp.py --tools",
        "cmd": ["python3", "csoai-os/mcp/sovereign-tools-mcp.py", "--tools"],
        "expect": ["server", "sovereign_tools", "tools", "sovereign_mcp_mesh"],
    },
    {
        "name": "sovereign-tools-mcp.py --demo",
        "cmd": ["python3", "csoai-os/mcp/sovereign-tools-mcp.py", "--demo"],
        "expect": ["care_floor_0.95", "bft_council_22_of_33", "enforced", "approved"],
    },
    {
        "name": "sovereign33_sdk.py --self-test",
        "cmd": ["python3", "csoai-os/mcp/sovereign33_sdk.py", "--self-test"],
        "expect": ["care floor", "sovereignty", "BFT quorum", "SIGIL emitted", "✓"],
    },
]

pass_, fail = 0, 0
for t in TESTS:
    try:
        out = subprocess.check_output(t["cmd"], stderr=subprocess.STDOUT, text=True, timeout=30)
        if all(token in out for token in t["expect"]):
            print(f"  v {t['name']}")
            pass_ += 1
        else:
            missing = [tok for tok in t["expect"] if tok not in out]
            print(f"  x {t['name']} -- missing tokens: {missing}")
            print(f"    out[:200]: {out[:200]}")
            fail += 1
    except subprocess.CalledProcessError as e:
        print(f"  x {t['name']} -- exit {e.returncode}: {e.output[:200]}")
        fail += 1
    except Exception as e:
        print(f"  x {t['name']} -- {type(e).__name__}: {e}")
        fail += 1

print()
print(f"SUMMARY: {pass_} passed, {fail} failed")
sys.exit(0 if fail == 0 else 1)
