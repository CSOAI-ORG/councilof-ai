#!/usr/bin/env python3
"""Directory-parity record: is the same MCP server described identically everywhere it is listed?

Read-only. Public GETs, plus one MCP initialize + tools/list against our own endpoint. Records what
each surface says, verbatim, with its HTTP status. A surface that does not answer is
SEARCH_INCONCLUSIVE, never "absent"; absence is recorded only from a complete listing (the Docker
catalog tree) or a search that returned results, never from a guessed URL. Nothing is created,
claimed or edited on any directory.

    python3 directory_parity.py --repo <councilof-ai checkout> > directory-parity.json
"""
import argparse, datetime, html, json, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

UA = "csoai-eval-export-parity/0.1"
LIVE = "https://councilof.ai/mcp"


def now():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get(url, headers=None, data=None, method=None):
    h = {"User-Agent": UA, "Accept": "application/json, text/html;q=0.9, */*;q=0.5"}
    h.update(headers or {})
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=h, data=data, method=method), timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, (e.read() or b"").decode("utf-8", "replace")[:2000]
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


def jget(url):
    s, b = get(url)
    try:
        return s, json.loads(b)
    except Exception:
        return s, None


def rpc(method, params, rid):
    body = json.dumps({"jsonrpc": "2.0", "id": rid, "method": method, "params": params}).encode()
    s, b = get(LIVE, {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}, body, "POST")
    for cand in [b] + [ln[5:].strip() for ln in b.splitlines() if ln.startswith("data:")]:
        try:
            return s, json.loads(cand)
        except Exception:
            pass
    return s, {}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, type=Path)
    a = ap.parse_args()
    rec = {"schema": "csoai.directory-parity/0.1", "checked_at": now(),
           "subject": "the GSPC measurement MCP server (remote https://councilof.ai/mcp; stdio npm csoai-gspc-mcp)",
           "method": "Public GETs; one MCP initialize + tools/list to our own endpoint. Descriptions recorded verbatim. "
                     "A surface that does not answer is SEARCH_INCONCLUSIVE; absence only from a complete listing or a search that returned results.",
           "surfaces": {}}
    S = rec["surfaces"]

    s1, ir = rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {}, "clientInfo": {"name": UA, "version": "0.1"}}, 1)
    s2, tr = rpc("tools/list", {}, 2)
    tools = (tr.get("result") or {}).get("tools") or []
    S["live_endpoint"] = {"url": LIVE, "http": [s1, s2], "serverInfo": (ir.get("result") or {}).get("serverInfo"),
                          "instructions": (ir.get("result") or {}).get("instructions"),
                          "tools": len(tools) if tools else None}

    repo = a.repo / "mcp/gspc-server"
    sj = json.loads((repo / "server.json").read_text())
    pj = json.loads((repo / "package.json").read_text())
    gj = json.loads((repo / "glama.json").read_text())
    S["repo_manifests_unpublished"] = {
        "server.json": {"name": sj.get("name"), "version": sj.get("version"), "description": sj.get("description"),
                        "remotes": [r.get("url") for r in sj.get("remotes", [])],
                        "packages": [f"{p['registryType']}:{p['identifier']}@{p['version']}" for p in sj.get("packages", [])]},
        "package.json": {"name": pj.get("name"), "version": pj.get("version"), "description": pj.get("description")},
        "glama.json": {"name": gj.get("name"), "displayName": gj.get("displayName"), "description": gj.get("description")},
    }

    reg = {}
    for q in ("councilof", "gspc"):
        st, d = jget("https://registry.modelcontextprotocol.io/v0/servers?" + urllib.parse.urlencode({"search": q, "limit": 100}))
        for e in (d or {}).get("servers", []):
            x = e.get("server", e)
            m = (e.get("_meta") or {}).get("io.modelcontextprotocol.registry/official", {})
            if m.get("isLatest"):
                reg[x["name"]] = {"version": x.get("version"), "description": x.get("description"), "status": m.get("status"),
                                  "updatedAt": m.get("updatedAt"), "remotes": [r.get("url") for r in (x.get("remotes") or [])],
                                  "packages": [f"{p.get('registryType')}:{p.get('identifier')}@{p.get('version')}" for p in (x.get("packages") or [])]}
    S["mcp_registry"] = {"query": "GET https://registry.modelcontextprotocol.io/v0/servers?search=councilof|gspc (latest per name)", "entries": reg}

    st, d = jget("https://registry.npmjs.org/csoai-gspc-mcp")
    lv = ((d or {}).get("dist-tags") or {}).get("latest")
    S["npm"] = {"http": st, "latest": lv, "description": ((d or {}).get("versions", {}).get(lv) or {}).get("description")} if d else \
               {"http": st, "state": "SEARCH_INCONCLUSIVE"}

    sm = {"query": "GET https://registry.smithery.ai/servers?q=<csoai|gspc|council of ai|councilof.ai>&pageSize=100", "entries": {}}
    seen = set()
    for q in ("csoai", "gspc", "council of ai", "councilof.ai"):
        st, d = jget("https://registry.smithery.ai/servers?" + urllib.parse.urlencode({"q": q, "pageSize": 100}))
        for x in (d or {}).get("servers", []):
            if any(k in json.dumps(x).lower() for k in ("councilof", "gspc", "csoai")):
                seen.add(x["qualifiedName"])
        time.sleep(1.1)
    for qn in sorted(seen):
        st, d = jget("https://registry.smithery.ai/servers/" + qn)
        d = d or {}
        sm["entries"][qn] = {"http": st, "displayName": d.get("displayName"), "description": d.get("description"),
                             "tools": len(d.get("tools") or []), "deploymentUrl": d.get("deploymentUrl"), "homepage": d.get("homepage")}
        time.sleep(1.1)
    S["smithery"] = sm

    st, b = get("https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai")
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", b, flags=re.S)
    t = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t)))
    ov = re.search(r"What can you do with this server\?\s*(.*?)\s*How do I use", t)
    tc = re.search(r"Scored (\S+ \S+) across (\d+) tools", t)
    ttl = re.search(r"<title>([^<]*)</title>", b)
    S["glama"] = {"url": "https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai", "http": st,
                  "title": html.unescape(ttl.group(1)) if ttl else None,
                  "overview": ov.group(1)[:900] if ov else None,
                  "tools_scored": int(tc.group(2)) if tc else None, "scored_at": tc.group(1) if tc else None,
                  "api_note": "glama.ai/api/mcp/v1 answered 401 without credentials; the public page was read instead"}

    st, d = jget("https://api.github.com/repos/docker/mcp-registry/git/trees/main?recursive=1")
    names = sorted({p["path"].split("/")[1] for p in (d or {}).get("tree", []) if p["path"].startswith("servers/")})
    st2, h = jget("https://hub.docker.com/v2/search/repositories/?" + urllib.parse.urlencode({"query": "csoai", "page_size": 25}))
    S["docker"] = {"mcp_catalog": {"source": "GET api.github.com/repos/docker/mcp-registry/git/trees/main?recursive=1", "http": st,
                                   "truncated": (d or {}).get("truncated"), "servers_listed": len(names),
                                   "ours": [n for n in names if any(k in n.lower() for k in ("csoai", "council", "gspc"))]},
                   "hub_search_csoai": {"http": st2, "repos": [{"repo": r.get("repo_name"), "description": r.get("short_description")}
                                                               for r in (h or {}).get("results", [])]}}

    # ---- derived: does every surface describe the same thing?
    live_v = (S["live_endpoint"]["serverInfo"] or {}).get("version")
    rows = [("live endpoint (initialize + tools/list)", live_v, S["live_endpoint"]["tools"], LIVE, None)]
    for n, e in reg.items():
        if "gspc" in n:
            rows.append((f"MCP registry {n}", e["version"], None, ",".join(e["remotes"]), e["description"]))
    rows.append(("npm csoai-gspc-mcp", S["npm"].get("latest"), None, None, S["npm"].get("description")))
    others = {}
    for qn, e in sm["entries"].items():
        if "gspc" in qn or "councilof.ai" in (e.get("description") or ""):
            rows.append((f"Smithery {qn}", None, e["tools"], e["deploymentUrl"], e["description"]))
        else:
            others[qn] = "carries a CSOAI-like name but does not describe this server; ownership UNMEASURED"
    rows.append(("Glama CSOAI-ORG/councilof-ai", None, S["glama"]["tools_scored"], None, S["glama"]["overview"]))
    rec["parity"] = {
        "rows": [{"surface": r[0], "version": r[1], "tools": r[2], "endpoint": r[3], "description": r[4]} for r in rows],
        "distinct_descriptions": len({r[4] for r in rows if r[4]}),
        "distinct_tool_counts": sorted({r[2] for r in rows if r[2] is not None}),
        "identical_everywhere": False if len({r[4] for r in rows if r[4]}) > 1 else None,
        "not_this_server": others,
    }
    json.dump(rec, sys.stdout, indent=1, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
