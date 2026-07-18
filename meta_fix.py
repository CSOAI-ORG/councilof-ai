#!/usr/bin/env python3
import os, re, glob, html, random

DIR = "/Users/nicholas/clawd/csoai-static-deploy2"
BASE = "https://csoai-static-deploy2.vercel.app/"
files = sorted(glob.glob(os.path.join(DIR, "SOV3*.html")))

def strip_tags(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def derive_desc(content):
    h1 = ""
    m = re.search(r"<h1[^>]*>(.*?)</h1>", content, re.S | re.I)
    if m:
        h1 = strip_tags(m.group(1))
    para = ""
    # first <p> after </h1> if possible, else first <p>
    for pm in re.finditer(r"<p[^>]*>(.*?)</p>", content, re.S | re.I):
        txt = strip_tags(pm.group(1))
        if len(txt) > 20:
            para = txt
            break
    combined = h1
    if para:
        combined = (h1 + " — " + para) if h1 else para
    combined = combined.strip()
    if not combined:
        combined = "SOV3/SOV33 sovereign substrate — CSOAI governed sovereign AI."
    if len(combined) > 160:
        combined = combined[:157].rstrip() + "..."
    return combined

log_rows = []
patched = 0
total_added = 0

for path in files:
    fname = os.path.basename(path)
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    before = len(content.encode("utf-8"))

    has_desc = re.search(r'<meta\s+name=["\']description["\']', content, re.I) is not None
    has_canon = re.search(r'<link\s+rel=["\']canonical["\']', content, re.I) is not None

    inserts = []
    if has_desc:
        m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']\s*/?>', content, re.I | re.S)
        desc = strip_tags(m.group(1)) if m else "(existing)"
    else:
        desc = derive_desc(content)
        esc = html.escape(desc, quote=True)
        inserts.append(f'<meta name="description" content="{esc}">')

    if not has_canon:
        inserts.append(f'<link rel="canonical" href="{BASE}{fname}">')

    if not inserts:
        after = before
        log_rows.append((fname, before, after, desc, "skip (both present)"))
        continue

    block = "\n".join(inserts) + "\n"
    # insert before </head>
    if re.search(r"</head>", content, re.I):
        new_content = re.sub(r"(</head>)", block + r"\1", content, count=1, flags=re.I)
    else:
        # fallback: after <head...>
        new_content = re.sub(r"(<head[^>]*>)", r"\1\n" + block, content, count=1, flags=re.I)

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    after = len(new_content.encode("utf-8"))
    patched += 1
    total_added += (after - before)
    action = ("+canonical" if has_desc else "+desc") + ("" if has_canon else ("+canonical" if not has_desc else ""))
    log_rows.append((fname, before, after, desc, action))

# write log
with open(os.path.join(DIR, "META_FIX_LOG.md"), "w", encoding="utf-8") as f:
    f.write("# META FIX LOG — SOV3/SOV33 AEO Meta Injection\n\n")
    f.write(f"Total files: {len(files)} | Patched: {patched} | Total bytes added: {total_added}\n\n")
    f.write("| # | Filename | Before (B) | After (B) | Delta | Action | Description |\n")
    f.write("|---|----------|-----------|-----------|-------|--------|-------------|\n")
    for i,(fn,b,a,d,act) in enumerate(log_rows,1):
        dd = d.replace("|","\\|")
        f.write(f"| {i} | {fn} | {b} | {a} | +{a-b} | {act} | {dd} |\n")

print(f"FILES={len(files)} PATCHED={patched} BYTES_ADDED={total_added}")
for fn,b,a,d,act in log_rows:
    print(f"{fn}\t{b}->{a}\t{act}\t{d[:70]}")
