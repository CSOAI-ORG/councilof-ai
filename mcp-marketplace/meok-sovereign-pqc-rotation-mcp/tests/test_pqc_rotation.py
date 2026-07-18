import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-pqc-rotation-mcp')
if "meok_sovereign_pqc_rotation_mcp" in sys.modules: del sys.modules["meok_sovereign_pqc_rotation_mcp"]
m = importlib.import_module("meok_sovereign_pqc_rotation_mcp"); importlib.reload(m)
r = m.rotation_status()
assert "kid" in r and "sig" in r
print("pqc-rotation OK")
