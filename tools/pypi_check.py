import glob, json, urllib.request, concurrent.futures, re
roots=["/Users/nicholas/clawd/mcp-marketplace/*/pyproject.toml"]
names=set()
for pat in roots:
    for pp in glob.glob(pat):
        try:
            m=re.search(r'^\s*name\s*=\s*["\']([^"\']+)["\']', open(pp).read(), re.M)
            if m: names.add(m.group(1).strip())
        except Exception: pass
def check(n):
    try:
        req=urllib.request.Request(f"https://pypi.org/pypi/{n}/json", headers={"User-Agent":"meok-check"})
        with urllib.request.urlopen(req, timeout=12) as r: return (n, r.status==200)
    except Exception: return (n, False)
pub=[]; miss=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
    for n,ok in ex.map(check, sorted(names)): (pub if ok else miss).append(n)
print(f"RESULT names_on_disk={len(names)} PUBLISHED={len(pub)} not_published={len(miss)}")
print("missing_sample:", miss[:15])
