#!/usr/bin/env python3
"""Reconstruct the flat Manus CSOAI export into a buildable tree.
Reads import statements to learn where each file belongs (tsconfig: @/* -> client/src/*).
Output: clawd/csoai-master/  (the canonical master to absorb into + deploy).
Severed-brand files (csga/terranova/james castle/ceasai) are SKIPPED (logged)."""
import os, re, shutil, json
from pathlib import Path

SRC = Path("/Users/nicholas/clawd/_m2_import/CSOAI_MANUS_MASTER")
OUT = Path("/Users/nicholas/clawd/csoai-master")
SEVERED = re.compile(r'csga|terranova|james.?castle|ceasai', re.I)

# alias segment -> tree dir
ALIAS = {  # @/<seg>  ->  client/src/<seg>
    'components':'client/src/components','lib':'client/src/lib','data':'client/src/data',
    'contexts':'client/src/contexts','types':'client/src/types','hooks':'client/src/hooks',
    'const':'client/src/const','pages':'client/src/pages','_core':'client/src/_core',
}
CONFIG = {'package.json','tsconfig.json','tsconfig.node.json','postcss.config.js','postcss.config.cjs',
    'tailwind.config.ts','tailwind.config.js','drizzle.config.ts','components.json','playwright.config.ts',
    'vitest.config.ts','chromatic.config.json','.env','.env.example','vite.ts'}

def all_files():
    for p in SRC.rglob('*'):
        if p.is_file() and 'node_modules' not in p.parts:
            yield p

# 1) Build basename -> target dir map from import statements
imp_re = re.compile(r"""from\s+['"]([@./][^'"]+)['"]""")
basemap = {}  # 'Button' -> 'client/src/components'
for p in all_files():
    if p.suffix not in ('.ts','.tsx'): continue
    try: txt = p.read_text(encoding='utf-8', errors='ignore')
    except: continue
    for m in imp_re.findall(txt):
        seg = None; name = None
        mm = re.match(r'@/(\w+)/(.+)', m)            # @/components/Button
        if mm: seg, name = mm.group(1), mm.group(2)
        else:
            mm = re.match(r'\./(pages|components|lib|contexts|hooks|data|types|const)/(.+)', m)
            if mm: seg, name = mm.group(1), mm.group(2)
        if seg and seg in ALIAS:
            base = os.path.basename(name)
            basemap.setdefault(base, ALIAS[seg])

placed=0; severed=0; bytype={}
def put(p, rel):
    global placed
    dst = OUT/rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, dst); placed+=1
    bytype[str(Path(rel).parent)] = bytype.get(str(Path(rel).parent),0)+1

for p in all_files():
    name=p.name
    # Only delete files that ARE severed-brand (by NAME). Files that merely
    # reference them (App.tsx, Pricing.tsx) are KEPT and cleaned later.
    if SEVERED.search(name): severed+=1; continue
    stem=p.stem
    # configs -> root
    if name in CONFIG: put(p,name); continue
    if name=='index.html': put(p,'client/index.html'); continue
    if name in ('main.tsx','main.ts'): put(p,'client/src/'+name); continue
    if name=='App.tsx': put(p,'client/src/App.tsx'); continue
    if name.endswith('.spec.ts'): put(p,'e2e/'+name); continue
    if name.endswith('.test.ts') or name.endswith('.test.tsx'): put(p,'client/src/__tests__/'+name); continue
    if p.suffix in ('.png','.jpg','.jpeg','.svg','.webp','.ico'): put(p,'client/public/assets/'+name); continue
    if p.suffix=='.md': put(p,'docs/'+name); continue
    if p.suffix=='.css': put(p,'client/src/'+name); continue
    if p.suffix=='.json' and 'schema' in stem.lower(): put(p,'shared/'+name); continue
    # mapped by imports
    key = name
    if key in basemap: put(p, basemap[key]+'/'+name); continue
    if stem in (b.rsplit('.',1)[0] for b in basemap):
        # match by stem
        for b,d in basemap.items():
            if b.rsplit('.',1)[0]==stem: put(p,d+'/'+name); break
        else: put(p,'server/'+name)
        continue
    # heuristic: server vs client for unmapped .ts
    if p.suffix=='.ts':
        try: t=p.read_text(encoding='utf-8',errors='ignore')[:4000]
        except: t=''
        if re.search(r"express|drizzle-orm|\bws\b|@neondatabase|node:|from ['\"]fs['\"]|createServer|websocket", t, re.I):
            put(p,'server/'+name)
        else:
            put(p,'client/src/lib/'+name)
        continue
    if p.suffix=='.tsx':
        put(p,'client/src/components/'+name); continue
    put(p,'misc/'+name)

print(json.dumps({'placed':placed,'severed_skipped':severed,'import_map_size':len(basemap),
    'by_dir':dict(sorted(bytype.items(), key=lambda x:-x[1])[:20])}, indent=2))
