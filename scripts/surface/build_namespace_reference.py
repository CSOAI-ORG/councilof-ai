#!/usr/bin/env python3
"""Document the namespace already referenced by the retained OSCAL pack.
No assessment is repeated or endorsed. The pack and signed artifacts are never modified.
"""
from pathlib import Path
import argparse,hashlib,html,json
NAMESPACE='https://councilof.ai/ns/gspc'
SOURCE='packs/eu-article-50/article50_oscal.json'
def build(raw:bytes):
 doc=json.loads(raw);names={}
 def walk(v):
  if isinstance(v,dict):
   if v.get('ns')==NAMESPACE:
    key=v.get('name')
    if not isinstance(key,str) or not key or len(key)>160:raise ValueError('Invalid property name')
    names[key]=names.get(key,0)+1
   for value in v.values():walk(value)
  elif isinstance(v,list):
   for value in v:walk(value)
 walk(doc)
 if not names:raise ValueError('No namespace references in source')
 digest=hashlib.sha256(raw).hexdigest()
 data={'schema':'csoai.namespace-reference/1','namespace':NAMESPACE,'source':'/'+SOURCE,'source_sha256':digest,'definition_scope':'Names and occurrence counts observed in this exact retained pack. Not an assessment result, signature validation, current key registry or legal applicability decision.','properties':[{'name':name,'occurrences_in_retained_pack':n} for name,n in sorted(names.items())],'source_values_republished':False}
 rows=''.join('<tr><td><code>'+html.escape(name)+'</code></td><td>'+str(n)+'</td></tr>' for name,n in sorted(names.items()))
 page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="GSPC namespace names observed in a retained evidence pack, with exact source digest and scope limitations."><link rel="canonical" href="https://councilof.ai/ns/gspc/"><title>GSPC evidence namespace | Council of AI</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:900px;margin:36px auto;padding:0 24px;color:#17313a}h1{line-height:1.2}a{color:#075b49}code{overflow-wrap:anywhere}td,th{padding:10px;text-align:left;border-bottom:1px solid #d4dddd}table{border-collapse:collapse;width:100%}.scope{background:#fff8e6;padding:16px;border-left:4px solid #946400}footer{margin-top:30px;border-top:1px solid #d4dddd;padding-top:16px}</style></head><body><main><p>COUNCIL OF AI · EVIDENCE REFERENCE</p><h1>GSPC namespace reference</h1><p><code>https://councilof.ai/ns/gspc</code></p><p>This identifier appears in the retained evidence pack linked below. The table documents property names and their occurrence counts in that exact file; it does not publish the property values as fresh findings.</p><p class="scope">This is a reference document, not a new evaluation or certification. A property called “not-satisfied” or “signing-pubkey-ed25519” is not, by its presence, proof of a present legal finding or a currently trusted signing key.</p><h2>Inspect the source</h2><p><a href="/'''+SOURCE+'''">Read the exact retained pack</a> · <a href="/ns/gspc/index.json">Read machine-readable reference</a> · <a href="/gspc-verify">Open the verifier</a></p><p>Source SHA-256: <code>'''+digest+'''</code></p><h2>Names observed</h2><table><thead><tr><th>Property name</th><th>Occurrences in retained pack</th></tr></thead><tbody>'''+rows+'''</tbody></table><footer>Resolve individual claims against their original subject, date, context and evidence. This page does not authenticate the pack, make a legal determination or execute a model.</footer></main></body></html>'''
 return {'index.json':(json.dumps(data,indent=2,ensure_ascii=False)+'\n').encode(),'index.html':page.encode()}
def verify_built(public):
 files=build((public/SOURCE).read_bytes());target=public/'ns/gspc'
 # The existing build injects precisely this launcher tag; no arbitrary HTML differences pass.
 expected=files['index.html'];launcher=b'  <script src="/council-workspace-launcher.js" defer></script>\n</body>'
 allowed=(expected,expected.replace(b'</body>',launcher))
 if (target/'index.json').read_bytes()!=files['index.json'] or (target/'index.html').read_bytes() not in allowed:raise ValueError('Built namespace source or content differs')
 return True

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--public',type=Path,default=Path('public'));p.add_argument('--check',action='store_true');p.add_argument('--check-built',action='store_true');a=p.parse_args();files=build((a.public/SOURCE).read_bytes());target=a.public/'ns/gspc'
 if a.check_built:
  verify_built(a.public)
 elif a.check:
  if any(not (target/n).is_file() or (target/n).read_bytes()!=b for n,b in files.items()):raise SystemExit('Namespace reference differs from source')
 else:
  target.mkdir(parents=True,exist_ok=True)
  for n,b in files.items():
   if (target/n).exists() and (target/n).read_bytes()!=b:raise SystemExit('Existing reference differs; review a superseding version rather than overwrite')
   if not (target/n).exists():(target/n).write_bytes(b)
 print('PASS: namespace reference matches exact retained pack; no source values promoted')
