import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-sd-jwt-mcp')
if "meok_sovereign_sd_jwt_mcp" in sys.modules: del sys.modules["meok_sovereign_sd_jwt_mcp"]
m = importlib.import_module("meok_sovereign_sd_jwt_mcp"); importlib.reload(m)
r = m.sdjwt_status()
assert "kid" in r and "sig" in r
print("sd-jwt OK")
