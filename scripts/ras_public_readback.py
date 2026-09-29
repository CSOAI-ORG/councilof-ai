#!/usr/bin/env python3
import argparse, hashlib, json, sys, urllib.request, urllib.error, xml.etree.ElementTree as ET

UA = "CSOAI-RAS-public-readback/1 (+https://councilof.ai/evidence/ras-opportunity-watch/)"

def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Cache-Control": "no-cache", "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.geturl(), dict(r.headers.items()), r.read()

def sha256(b): return hashlib.sha256(b).hexdigest()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--origin", default="https://councilof.ai")
    a=ap.parse_args()
    origin=a.origin.rstrip("/")
    base=origin+"/evidence/ras-opportunity-watch/"
    errors=[]; rows=[]

    def get(path, expect_ct=None):
        url=base+path if path else base
        try:
            st, final, hdr, body=fetch(url)
        except Exception as e:
            errors.append(f"{path or '/'}:fetch:{type(e).__name__}:{e}")
            return None
        ct=hdr.get("Content-Type","")
        if st!=200: errors.append(f"{path or '/'}:http:{st}")
        if final.rstrip("/")!=url.rstrip("/"): errors.append(f"{path or '/'}:redirect:{final}")
        if expect_ct and expect_ct not in ct: errors.append(f"{path or '/'}:content-type:{ct}")
        rows.append({"path":path or "/","status":st,"bytes":len(body),"sha256":sha256(body),"content_type":ct})
        return body

    html=get("", "text/html")
    ledger=get("ledger.json", "application/json")
    feed=get("feed.atom")
    manifest_bytes=get("manifest.json", "application/json")
    if html:
        text=html.decode("utf-8","replace")
        for token in (
            '<link rel="canonical" href="https://councilof.ai/evidence/ras-opportunity-watch/">',
            '"@type":"Dataset"',
            '"isAccessibleForFree":true',
            "Service provider / seller",
            "Procurement / compliance / risk",
            "Press / analyst / standards maintainer",
        ):
            if token not in text: errors.append(f"html:missing:{token}")
    if feed:
        try: ET.fromstring(feed)
        except Exception as e: errors.append(f"feed:parse:{type(e).__name__}")
    if ledger:
        try:
            d=json.loads(ledger)
            if not d.get("events"): errors.append("ledger:no-events")
        except Exception as e: errors.append(f"ledger:parse:{type(e).__name__}")

    if manifest_bytes:
        try:
            manifest=json.loads(manifest_bytes)
            for row in manifest.get("files",[]):
                name=row.get("path")
                if not name: errors.append("manifest:path-missing"); continue
                body=get(name)
                if body is None: continue
                if sha256(body)!=row.get("sha256"): errors.append(f"manifest:sha256:{name}")
                if len(body)!=row.get("bytes"): errors.append(f"manifest:bytes:{name}")
        except Exception as e: errors.append(f"manifest:parse:{type(e).__name__}")

    for path, token in (("/sitemap.xml", "https://councilof.ai/evidence/ras-opportunity-watch/"),("/llms.txt", "https://councilof.ai/evidence/ras-opportunity-watch/")):
        try:
            st, final, hdr, body=fetch(origin+path)
            rows.append({"path":path,"status":st,"bytes":len(body),"sha256":sha256(body),"content_type":hdr.get("Content-Type","")})
            if st!=200: errors.append(f"{path}:http:{st}")
            if token.encode() not in body: errors.append(f"{path}:missing-ras-url")
        except Exception as e: errors.append(f"{path}:fetch:{type(e).__name__}:{e}")

    out={"schema":"csoai.ras-public-readback/1.0","origin":origin,"state":"PASS" if not errors else "HOLD","checks":rows,"errors":errors}
    print(json.dumps(out,indent=2,sort_keys=True))
    return 0 if not errors else 1

if __name__=="__main__":
    sys.exit(main())
