import importlib, os, sys, tempfile
os.environ["SOV_KEY"] = tempfile.mkdtemp() + "/k.pem"
sys.path.insert(0, '/Users/nicholas/clawd/mcp-marketplace/meok-sovereign-eu-ai-act-deadline-mcp')
if "meok_sovereign_eu_ai_act_deadline_mcp" in sys.modules: del sys.modules["meok_sovereign_eu_ai_act_deadline_mcp"]
m = importlib.import_module("meok_sovereign_eu_ai_act_deadline_mcp"); importlib.reload(m)
r = m.deadline_countdown()
assert "kid" in r and "sig" in r
print("eu-ai-act-deadline OK")
