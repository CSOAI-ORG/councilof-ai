#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Read-only PDF source capture against the frozen 25 Nov queue; no rights or legal admission."""
import argparse, concurrent.futures, datetime, hashlib, json, subprocess, urllib.request, urllib.parse, unicodedata
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--queue',type=Path,required=True)
args=parser.parse_args()
queue_raw=args.queue.read_bytes()
if hashlib.sha256(queue_raw).hexdigest()!='2b9aad8dd393b2c76eface1be55104f3f4834c8e2aa5a00e63f381a70a91a8ca': raise SystemExit('Frozen queue digest mismatch')
queue=json.loads(queue_raw)
rows={r['instrument_id']:r for r in queue['queue']}
targets={
'DE-dsk-orientierungshilfe-ki-2024':('orientierungshilfe','datenschutz'),
'FR-has-cnil-ai-care-guide-2026':('cnil','intelligence artificielle'),
'HK-hkma-genai-consumer-protection-2024':('generative','consumer protection'),
'HK-hkma-responsible-ai-adoption-2026':('responsible','artificial intelligence'),
'ID-pdp-law-2022':('nomor 27','pelindungan data pribadi'),
'INTL-sadc-model-law-data-protection-2013':('data protection','sadc'),
'ZM-national-ai-strategy-2024':('zambia','strategy'),
}
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*a,**kw): return None
opener=urllib.request.build_opener(NoRedirect())
def norm(s):
 return ' '.join(unicodedata.normalize('NFKC',s).lower().split())
def capture(item):
 iid,markers=item; r=rows[iid]; url=r['official_route']
 result={'instrument_id':iid,'url':url,'recorded_kind':r['kind'],'rights_admission':False,'text_admitted':False,'status_verified':False}
 try:
  parsed=urllib.parse.urlsplit(url)
  if parsed.scheme!='https' or parsed.username or parsed.password or parsed.query or parsed.fragment or not parsed.path.lower().endswith('.pdf'): raise ValueError('route not an exact PDF URL')
  with opener.open(urllib.request.Request(url,headers={'Accept':'application/pdf','User-Agent':'CSOAI-source-verification/0.1'}),timeout=12) as response:
   if response.status!=200 or response.geturl()!=url: raise ValueError('unexpected response')
   media=response.headers.get_content_type()
   raw=response.read(12_000_001)
  if len(raw)>12_000_000 or not raw.startswith(b'%PDF-') or media!='application/pdf': raise ValueError('invalid media or bounded size')
  text=subprocess.run(['pdftotext','-f','1','-l','3','-','-'],input=raw,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=10,check=True).stdout.decode('utf-8','replace')
  marker_matches=[m for m in markers if norm(m) in norm(text)]
  result.update(bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),media_type=media,identity_marker_matches=len(marker_matches),identity_markers_expected=len(markers),state='STAGED_PUBLISHER_PDF' if len(marker_matches)==len(markers) else 'IDENTITY_REVIEW_REQUIRED')
 except Exception as e:
  result.update(state='UNAVAILABLE',error=type(e).__name__,http_status=getattr(e,'code',None))
 return result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 results=list(pool.map(capture,targets.items()))
out={'schema':'csoai.corpus-recovery-direct-pdf-probe/0.1','captured_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'queue_sha256':hashlib.sha256(queue_raw).hexdigest(),'source_commit':'e63398fdcdd018113ba9b826cf0c3cf183665a20','results':results,'source_text_redistributed':False,'canonical_provisions_added':0,'authorises_execution':False}
print(json.dumps(out,indent=2))

