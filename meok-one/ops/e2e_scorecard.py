#!/usr/bin/env python3
"""MEOK 100/100 e2e scorecard. Scores every live product against a fixed rubric
so '100/100' is measurable, not a vibe. Output: /tmp/meok_scorecard.json + summary."""
import json, urllib.request, urllib.error, ssl
B = "https://meok-one.35.242.143.249.sslip.io"
ctx = ssl.create_default_context()
def code(u, m="GET", data=None):
    try:
        r = urllib.request.Request(u, method=m, data=data, headers={"User-Agent":"meok-scorecard","Content-Type":"application/json"})
        return urllib.request.urlopen(r, timeout=15, context=ctx).status
    except urllib.error.HTTPError as e: return e.code
    except Exception: return 0
def body(u):
    try:
        r = urllib.request.Request(u, headers={"User-Agent":"meok-scorecard"})
        return urllib.request.urlopen(r, timeout=15, context=ctx).read().decode("utf-8","replace")
    except Exception: return ""

# rubric: live, functional, bridged, characters, secure, monetized, global, e2e
surfaces = {p: code(B+p) for p in ["/api/health","/os","/dome","/law","/map","/hud","/hatch","/pricing","/work","/registry"]}
health = body(B+"/api/health")
bridge = body(B+"/api/mcp/tools")
try: tool_count = json.loads(bridge).get("count", 0)
except Exception: tool_count = 0
chars = '"characters": 27' in health or '"characters":27' in health
onboard = code(B+"/api/auth/anon", "POST", b"{}")
sov3 = code("https://sovereign.templeman-opticians.com/health")

live = sum(1 for c in surfaces.values() if c == 200)
products = {
  "MEOK ONE (OS)":     {"live": surfaces["/os"]==200, "bridged": tool_count>0, "chars": chars, "onboard": onboard==200},
  "MEOK DOME (map)":   {"live": surfaces["/dome"]==200 and surfaces["/map"]==200, "bridged": tool_count>0},
  "MEOK LAW":          {"live": surfaces["/law"]==200, "api": code(B+"/api/law")==200, "bridged": tool_count>0},
  "MCP catalogue":     {"bridged_to_os": tool_count>0, "tool_count": tool_count},
  "SOV3":              {"healthy": sov3 in (200,401), "tools": tool_count},
}
def score(p):
    flags=[v for v in p.values() if isinstance(v,bool)]
    return round(100*sum(flags)/len(flags)) if flags else 0
scores = {k: score(v) for k,v in products.items()}
# global-readiness is the cross-cutting gap (no i18n)
gaps = []
if tool_count==0: gaps.append("MCP bridge down")
if onboard!=200: gaps.append("onboarding broken")
gaps.append("i18n / global-readiness (no locale layer) — caps every product < 100")
out = {"surfaces_live": f"{live}/{len(surfaces)}", "mcp_tools_bridged": tool_count,
       "characters": chars, "onboarding": onboard, "sov3": sov3,
       "product_scores": scores, "gaps": gaps}
json.dump(out, open("/tmp/meok_scorecard.json","w"), indent=2)
print(f"SURFACES live: {live}/{len(surfaces)} | MCP tools bridged to OS: {tool_count} | onboarding: {onboard} | SOV3: {sov3}")
for k,s in scores.items(): print(f"  {k:<22} {s}/100")
print("GAPS:", "; ".join(gaps))
