import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-pricing-engine-mcp")
if "meok_sovereign_pricing_engine_mcp" in sys.modules: del sys.modules["meok_sovereign_pricing_engine_mcp"]
m = importlib.import_module("meok_sovereign_pricing_engine_mcp"); importlib.reload(m)
r = m.pricing_status()
assert "kid" in r and "sig" in r
print("pricing-engine OK")
