import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-prm-mcp')
if "meok_sovereign_prm_mcp" in sys.modules: del sys.modules["meok_sovereign_prm_mcp"]
m = importlib.import_module("meok_sovereign_prm_mcp"); importlib.reload(m)
r = m.prm_status()
assert "kid" in r and "sig" in r
print("prm OK")
