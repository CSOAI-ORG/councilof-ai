#!/usr/bin/env python3
from pathlib import Path
import json,re,urllib.request,yaml
HERE=Path(__file__).resolve().parent
meta=json.loads((HERE/"toolset.json").read_text())
FREE=set(meta["free_read_only_tools"]); PAID=set(meta["paid_tools_denied_by_default"])
policy=yaml.safe_load((HERE/"policy.yaml").read_text())
assert policy["version"]==1
assert policy["landlock"]["compatibility"]=="hard_requirement"
rule=policy["network_policies"]["council_gspc_mcp"]; ep=rule["endpoints"][0]
assert (ep["host"],ep["port"],ep["path"],ep["protocol"],ep["enforcement"])==("councilof.ai",443,"/mcp","mcp","enforce")
any_rules=[x["allow"]["tool"]["any"] for x in ep["rules"] if x["allow"].get("method")=="tools/call" and isinstance(x["allow"].get("tool"),dict)]
assert len(any_rules)==1 and set(any_rules[0])==FREE
denied={x["tool"] for x in ep["deny_rules"] if x.get("method")=="tools/call"}
assert denied==PAID and FREE.isdisjoint(PAID)
assert all(re.fullmatch(r"[A-Za-z0-9_.-]{1,128}",x) for x in FREE|PAID)
dockerfile=(HERE/"Dockerfile").read_text()
copied={line.split()[1] for line in dockerfile.splitlines() if line.startswith("COPY ") and len(line.split())==3}
assert {"probe.mjs","toolset.json"} <= copied, "Docker image omits a runtime input"
assert "USER node" in dockerfile, "container must run as non-root"
payload=json.dumps({"jsonrpc":"2.0","id":"verify-package","method":"tools/list"}).encode()
req=urllib.request.Request("https://councilof.ai/mcp",data=payload,method="POST",headers={"content-type":"application/json","accept":"application/json, text/event-stream","user-agent":"GSPC-OpenShell-Package/0.1"})
with urllib.request.urlopen(req,timeout=15) as res: raw=res.read(1000000).decode()
objs=[json.loads(line[6:]) for line in raw.splitlines() if line.startswith("data: ")]
if not objs: objs=[json.loads(raw)]
live={x["name"] for x in objs[0]["result"]["tools"]}
missing=(FREE|PAID)-live
if missing: raise SystemExit("live tool drift: "+repr(sorted(missing)))
print(json.dumps({"state":"PASS","live_tools":len(live),"free_allowed":len(FREE),"paid_denied":len(PAID)},indent=2))
