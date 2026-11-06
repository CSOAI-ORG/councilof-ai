#!/usr/bin/env python3
"""register-402index.py — keep every door in https://councilof.ai/.well-known/x402.json listed on the 402 Index.

Authless rail (https://402index.io/api-docs): POST /api/v1/register {url,name,protocol,...} -> 201 registered pending
review; 422 protocol verification failed; 429 rate limit (10/hour/IP). Domain already claimed
(.well-known/402index-verify.txt on councilof.ai). Idempotent: reads the index's own listing for the domain first
and registers only what is absent. Receipts: /workspace/lanes/out/402index/REGISTER.jsonl. Absence of a line = did not run.
Never types a price: price fields are left to the probe (the 402 challenge carries the amount).
"""
import json, time, pathlib, urllib.request, urllib.parse, sys

MANIFEST = "https://councilof.ai/.well-known/x402.json"
INDEX = "https://402index.io/api/v1"
OUT = pathlib.Path("/workspace/lanes/out/402index"); OUT.mkdir(parents=True, exist_ok=True)
UA = {"user-agent": "Mozilla/5.0 csoai-402index-register", "accept": "application/json"}

def call(url, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers={**UA, **({"content-type": "application/json"} if data else {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return r.status, r.read()
    except urllib.error.HTTPError as e: return e.code, e.read()

def listed():
    urls, off = set(), 0
    while True:
        st, b = call(f"{INDEX}/services?q=councilof.ai&limit=100&offset={off}")
        if st != 200: raise SystemExit(f"index query {st}: {b[:200]!r}")
        d = json.loads(b); rows = d.get("services", [])
        urls |= {s["url"] for s in rows if "councilof.ai" in (s.get("url") or "")}
        off += len(rows)
        if not rows or off >= int(d.get("total") or 0): break
    return urls

def main():
    st, b = call(MANIFEST); man = json.loads(b)
    doors = man["resources"]; have = listed()
    missing = [r for r in doors if r["url"] not in have]
    print(f"manifest {len(doors)} doors; index lists {len(have)} councilof.ai urls; missing {len(missing)}")
    n = 0
    for r in missing[:10]:  # 10/hour/IP rate limit — the daily tick catches the rest
        body = {"url": r["url"], "name": (r.get("name") or r.get("description") or r["url"].split("/api/")[-1])[:80],
                "protocol": "x402", "http_method": "GET", "description": (r.get("description") or "")[:500],
                "payment_asset": "USDC", "payment_network": "base", "provider": "Council of AI", "category": "data"}
        st, b = call(f"{INDEX}/register", body)
        rec = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "url": r["url"], "status": st, "response": b[:300].decode("utf-8", "replace")}
        (OUT / "REGISTER.jsonl").open("a").write(json.dumps(rec) + "\n"); print(rec); n += st == 201
        if st == 429: break
        time.sleep(2)
    (OUT / "LAST.json").write_text(json.dumps({"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "manifest": len(doors), "listed": len(have), "missing": [r["url"] for r in missing], "registered_now": n}, indent=1))
    return 0
if __name__ == "__main__": sys.exit(main())
