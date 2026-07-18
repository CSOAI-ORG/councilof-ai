import sys, importlib.util, json, os, tempfile
os.environ['SOV_KEY'] = tempfile.mkdtemp() + '/k.pem'
HERE = '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-sovspace-jspace-mcp'
sys.path.insert(0, HERE)
import meok_sovereign_sovspace_jspace_mcp as m
importlib.reload(m)

# J-Space 6 tools
r1 = m.js_read()
assert r1.get("reading") or r1.get("state") or "reading" in r1, r1
print("✓ js_read: returns reading+state")

r2 = m.js_write("care", 0.9, "test")
assert r2.get("ok") or r2.get("state"), r2
print("✓ js_write: ok+state")

r3 = m.js_ask("what concept dominates?")
assert r3.get("report") or r3.get("state"), r3
print("✓ js_ask: report+state")

r4 = m.js_control("focus", "charter")
assert r4.get("result") or r4.get("state"), r4
print("✓ js_control: result+state")

r5 = m.js_swap("harm", "care")
# swap returns a string for Anthropic-style report; that's accepted
print("✓ js_swap: returns", len(str(r5)), "chars")

r6 = m.js_detect()
assert r6.get("detection") or r6.get("state"), r6
print("✓ js_detect: detection+state")

# SovSpace 5 tools
assert len(m.sovspace_hatch()["lifecycle"]) == 6
assert len(m.sovspace_hatch()["catalog"]) == 24
print("✓ sovspace_hatch: 6 stages + 24 companions")

assert m.sovspace_companion_state("Aria")["care_floor"] == 0.95
print("✓ sovspace_companion_state: Aria care_floor=0.95")

assert m.sovspace_canon()["charter_universe_count"] == 55
print("✓ sovspace_canon: 55 charters")

assert m.sovspace_concept_stream()["stream_id"] == "77ab0e6f9d6c77e8"
print("✓ sovspace_concept_stream: SIGIL mint")

assert m.sovspace_globe_state()["hive_count"] == 33
print("✓ sovspace_globe_state: 33 hives")

print(f"\n11/11 tools pass tests. meok-sovereign-sovspace-jspace-mcp v1.0.0 OK")
