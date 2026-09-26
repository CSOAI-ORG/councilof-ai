"""Enumerate PyPI projects owned by the estate account and npm packages found by maintainer search;
select those whose name contains csoai or gspc.   python3 owners.py [OUT.json]"""
import xmlrpc.client, json, urllib.request, time, sys
c = xmlrpc.client.ServerProxy("https://pypi.org/pypi")
r = c.user_packages("nicholastempleman")
names = sorted({n for _, n in r})
sel = [n for n in names if "csoai" in n.lower() or "gspc" in n.lower()]
npm = []
frm = 0
while True:
    d = json.load(urllib.request.urlopen("https://registry.npmjs.org/-/v1/search?text=maintainer:csga_global&size=250&from=%d" % frm, timeout=60))
    npm += [o["package"]["name"] for o in d["objects"]]
    frm += 250
    if frm >= d["total"]: break
    time.sleep(1)
npm = sorted(set(npm))
nsel = [n for n in npm if "csoai" in n.lower() or "gspc" in n.lower()]
json.dump({"pypi_owner": "nicholastempleman", "pypi_owned": names, "pypi_selected": sel,
           "npm_maintainer": "csga_global", "npm_maintained": npm, "npm_selected": nsel,
           "fetched_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())},
          open(sys.argv[1] if len(sys.argv) > 1 else "owners.json", "w"), indent=1)
print(len(names), sel); print(len(npm), nsel)
