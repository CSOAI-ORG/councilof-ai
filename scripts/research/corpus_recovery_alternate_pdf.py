#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Bounded recovery of alternate sources; never substitute for original publisher bytes."""
import datetime, hashlib, json, subprocess, urllib.request, concurrent.futures
ROWS=[
("ID-pdp-law-2022","https://peraturan.bpk.go.id/Download/224884/UU%20Nomor%2027%20Tahun%202022.pdf","GOVERNMENT_LEGAL_REPOSITORY",["nomor 27 tahun 2022","pelindungan data pribadi"]),
("ZM-national-ai-strategy-2024","https://api.oecd.ai/storage//policy-initiatives/Apr2026/117ojpi25umobje3ol-Zambia-Ai-Strategy-Book-option-2.pdf","INTERGOVERNMENTAL_REPOSITORY_COPY",["zambia","national artificial intelligence strategy"])
]
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
def probe(row):
 iid,url,role,markers=row
 result=dict(instrument_id=iid,url=url,source_role=role,original_bytes_equivalence="NOT_VERIFIED",rights_admission=False,text_admitted=False,status_verified=False)
 try:
  with urllib.request.build_opener(NoRedirect()).open(urllib.request.Request(url,headers={"Accept":"application/pdf","User-Agent":"CSOAI-source-verification/0.1"}),timeout=15) as r:
   if r.status!=200 or r.geturl()!=url or r.headers.get_content_type()!="application/pdf":raise ValueError("response")
   b=r.read(15_000_001)
  if len(b)>15_000_000 or not b.startswith(b"%PDF-"):raise ValueError("PDF bytes")
  t=subprocess.run(["pdftotext","-f","1","-l","3","-","-"],input=b,capture_output=True,check=True,timeout=10).stdout.decode("utf-8","replace")
  t=" ".join(t.lower().split())
  n=sum(m in t for m in markers)
  result.update(bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),identity_marker_matches=n,identity_markers_expected=len(markers),state="STAGED_ALTERNATE_COPY" if n==len(markers) else "IDENTITY_REVIEW_REQUIRED")
  if iid.startswith("ZM"):
   result["date_range_discrepancy_detected"]=("2024-2026" in t or "2024–2026" in t) and ("2025 - 2027" in t or "2025-2027" in t or "2025–2027" in t)
 except Exception as e:
  result.update(state="UNAVAILABLE",error=type(e).__name__,http_status=getattr(e,"code",None))
 return result
if __name__=="__main__":
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: rows=list(pool.map(probe,ROWS))
 print(json.dumps(dict(schema="csoai.corpus-recovery-alternate-copy/0.1",captured_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),results=rows,source_text_redistributed=False,canonical_provisions_added=0,authorises_execution=False),indent=2,sort_keys=True))
