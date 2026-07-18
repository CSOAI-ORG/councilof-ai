import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, "/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-feedback-mcp")
if "meok_sovereign_feedback_mcp" in sys.modules: del sys.modules["meok_sovereign_feedback_mcp"]
m = importlib.import_module("meok_sovereign_feedback_mcp"); importlib.reload(m)
r = m.feedback_status()
assert "kid" in r and "sig" in r
print("feedback OK")
