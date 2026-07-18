import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-zk-ml-mcp')
if "meok_sovereign_zk_ml_mcp" in sys.modules: del sys.modules["meok_sovereign_zk_ml_mcp"]
m = importlib.import_module("meok_sovereign_zk_ml_mcp"); importlib.reload(m)
r = m.zkml_status()
assert "kid" in r and "sig" in r
print("zk-ml OK")
