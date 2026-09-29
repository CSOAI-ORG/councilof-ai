"""SELF (sister product; not ranked): does cobol-bridge-mcp expose any record-decode path? Static read of the installed wheel."""
import ast, json, re, sys, sysconfig, os
site = sysconfig.get_paths()["purelib"]
src = open(os.path.join(site, "server.py")).read()
tools = []
for n in ast.walk(ast.parse(src)):
    if isinstance(n, ast.FunctionDef) and any("tool" in ast.unparse(d) for d in n.decorator_list):
        tools.append({"tool": n.name, "params": [a.arg for a in n.args.args]})
pat = re.compile(r"ebcdic|comp-?3|packed|copybook|decode|record", re.I)
hits = sorted(set(m.group(0).lower() for m in pat.finditer(src)))
out = {"package": "cobol-bridge-mcp", "module": "server.py", "mcp_tools": tools,
       "decode_terms_found_in_source": hits,
       "has_decode_path": any(re.search(r"decode|ebcdic|record|copybook", t["tool"], re.I) for t in tools)}
json.dump(out, open(sys.argv[1], "w"), indent=1, sort_keys=True)
print(json.dumps({"has_decode_path": out["has_decode_path"], "tools": [t["tool"] for t in tools]}))
