import glob, json, urllib.request, concurrent.futures, re, ssl
# SSL fix: system python lacks CA bundle -> CERTIFICATE_VERIFY_FAILED -> false PUBLISHED=0.
# Verify against certifi's bundle; fall back to default context if certifi missing.
try:
    import certifi
    _SSL_CTX = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL_CTX = ssl.create_default_context()
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
        with urllib.request.urlopen(req, timeout=12, context=_SSL_CTX) as r: return (n, r.status==200)
    except Exception: return (n, False)
pub=[]; miss=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
    for n,ok in ex.map(check, sorted(names)): (pub if ok else miss).append(n)
print(f"RESULT names_on_disk={len(names)} PUBLISHED={len(pub)} not_published={len(miss)}")
print("missing_sample:", miss[:15])
