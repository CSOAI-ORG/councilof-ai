import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-content-registry-mcp")
if "meok_sovereign_content_registry_mcp" in sys.modules: del sys.modules["meok_sovereign_content_registry_mcp"]
m = importlib.import_module("meok_sovereign_content_registry_mcp"); importlib.reload(m)
r = m.registry_status()
assert "kid" in r and "sig" in r
print("content-registry OK")
