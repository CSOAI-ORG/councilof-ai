#!/usr/bin/env python3
"""Post-deploy IndexNow: announce only councilof.ai sitemap URLs whose VISIBLE TEXT changed (or are new).
Run by /workspace/ci/auto-land.sh after a DEPLOYED line. Rules (from the 2026-09-21 receipt and the old loop):
key file must be live; only live 200s are submitted; unchanged URLs are never re-pinged; first run seeds only.
Submitted/accepted are the only states observed here -- never 'indexed'."""
import hashlib, html, json, re, sys, time, urllib.request, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
HOST = "councilof.ai"; KEY = "97a1aa3163534fae954108d8941eb361"
# v2 (2026-09-28): the fingerprint changed (VOLATILE/AGO below), so v1 hashes are not comparable. v2 was seeded from
# the live deploy d06d09837 without submitting; v1 (indexnow-visible-text.json) is kept as the old baseline.
STATE = "/workspace/ci/state/indexnow-visible-text.v2.json"; LOG = "/workspace/staging/logs/indexnow.log"
UA = "Mozilla/5.0 (compatible; csoai-indexnow/3; +https://councilof.ai)"
def get(u, t=30):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=t) as r:
        return r.status, r.read()
# Build-time reads of /api/momentum, baked into prerendered HTML on every deploy (proven 2026-09-28 by diffing the
# same URLs across deploys 57dfceff -> 44340409, where they alone made 300 of 440 sitemap URLs "change"):
#  - footer "Live figures" block, on every page (data-testid="footer-stats"): "76 public corrections ... updated
#    28 Sept 2026, 01:39 UTC" -> "73 ... snapshot 28 Sept 2026, 03:21 UTC";
#  - in-page momentum panels/strips: their read-time line (data-testid="momentum-origin": "Live · read ..." ->
#    "Snapshot · taken ...") and each figure (data-testid="momentum-figure-*": "+16 this week" -> "+13 this week").
# Strip exactly those elements; the page's own text around them still counts.
VOLATILE = re.compile(r'(?is)<section\b[^>]*\bdata-testid="footer-stats"[^>]*>.*?</section>'
                      r'|<p\b[^>]*\bdata-testid="momentum-origin"[^>]*>.*?</p>'
                      r'|<li\b[^>]*\bdata-testid="momentum-figure-[\w-]+"[^>]*>.*?</li>')
# Relative ages are recomputed at every prerender ("599.2 hours ago" -> "600.6 hours ago", "116.5 h ago").
AGO = re.compile(r"\b\d+(?:\.\d+)?\s*(?:h|hours?)\s+ago\b")
def visible(b):
    s = b.decode("utf-8", "replace")
    s = re.sub(r"(?is)<(script|style|noscript|template)\b.*?</\1>", " ", s)
    s = VOLATILE.sub(" ", s)  # live /api/momentum figures re-read at every prerender: not page content
    s = re.sub(r"(?s)<[^>]+>", " ", s)
    s = html.unescape(s)
    s = AGO.sub("", s)
    s = re.sub(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?Z?", "", s)  # build/as-of stamps are not content change
    return re.sub(r"\s+", " ", s).strip()
def fp(u):
    try:
        st, b = get(u); return u, st, hashlib.sha256(visible(b).encode()).hexdigest()
    except Exception as e:
        return u, getattr(e, "code", 0), None
def log(m):
    line = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()) + " " + m
    print(line); open(LOG, "a").write(line + "\n")
ENTITY_STATE = "/workspace/ci/state/indexnow-entity-lastmod.json"
BATCH = 10000  # IndexNow accepts at most 10,000 URLs per POST
def entity_urls():
    # Entity pages (/mcp-servers/, /agent-cards/, /x402/, /stablecoins/<a>/<c>/, /notes/daily/) are rendered by
    # Pages Functions and listed only in the Function-generated sitemaps named by /sitemaps/index.xml. Their change
    # signal is the sitemap <lastmod> (the date of the signed observation behind the page), not a re-fetch of every
    # page's text: thousands of pages must not cost thousands of Function invocations per deploy.
    out = {}
    try:
        _, ix = get(f"https://{HOST}/sitemaps/index.xml", 60)
        kids = [l.text.strip() for l in ET.fromstring(ix).iter() if l.tag.endswith("loc") and l.text and "/sitemaps/" in l.text]
    except Exception as e:
        log(f"entity: sitemap index unreadable ({e}); entity submitted=0"); return None
    for k in kids:
        try:
            _, b = get(k, 90)
            root = ET.fromstring(b)
        except Exception as e:
            log(f"entity: {k} unreadable ({getattr(e, 'code', e)}); skipped this run"); continue
        for u in root:
            loc = next((c.text.strip() for c in u if c.tag.endswith("loc") and c.text), None)
            lm = next((c.text.strip() for c in u if c.tag.endswith("lastmod") and c.text), "")
            if loc: out[loc] = lm
    return out
def submit(urls, label):
    res = []
    for i in range(0, len(urls), BATCH):
        chunk = urls[i:i + BATCH]; out = []
        for ep in ("https://api.indexnow.org/indexnow", "https://yandex.com/indexnow"):
            body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"https://{HOST}/{KEY}.txt", "urlList": chunk}).encode()
            req = urllib.request.Request(ep, data=body, headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": UA})
            try:
                with urllib.request.urlopen(req, timeout=60) as r: out.append(f"{ep.split('/')[2]}={r.status}")
            except Exception as e: out.append(f"{ep.split('/')[2]}={getattr(e, 'code', type(e).__name__)}")
        log(f"{label} batch {i // BATCH + 1}: submitted={len(chunk)} (cap {BATCH}) {' '.join(out)} first={chunk[:3]}")
        res.append(out)
    return res
def entity_main():
    try:
        _, k = get(f"https://{HOST}/{KEY}.txt")
        if k.decode().strip() != KEY: raise ValueError("wrong body")
    except Exception as e:
        log(f"entity: SKIP key file not live ({e}); submitted=0"); return
    cur = entity_urls()
    if cur is None: return
    try: prev = json.load(open(ENTITY_STATE))
    except Exception: prev = {}
    # New URLs are new pages, so they are announced even on the first run (unlike the /sitemap.xml seed rule,
    # which exists so an old site is not re-pinged wholesale). A changed <lastmod> means a newer signed observation.
    cand = sorted(u for u, lm in cur.items() if prev.get(u) != lm)[:BATCH]
    with ThreadPoolExecutor(8) as ex: chk = list(ex.map(lambda u: (u, fp(u)[1]), cand))
    live = [u for u, st in chk if st == 200]
    dead = [u for u, st in chk if st != 200]
    import os; os.makedirs(os.path.dirname(ENTITY_STATE), exist_ok=True)
    # Record only what was confirmed live (and submitted), so a URL that failed or was over the cap is retried next run.
    keep = {u: lm for u, lm in prev.items() if u in cur}
    keep.update({u: cur[u] for u in live})
    json.dump(keep, open(ENTITY_STATE, "w"), indent=0, sort_keys=True)
    log(f"entity: listed={len(cur)} new_or_changed={len(cand)} live={len(live)} dead={len(dead)}" + (f" dead_urls={dead[:5]}" if dead else ""))
    if live: submit(live, "entity")
def main():
    dry = "--dry-run" in sys.argv  # report what would be submitted; write no state, submit nothing
    seed = "--seed" in sys.argv; extra = [a for a in sys.argv[1:] if a.startswith("https://")]
    try:
        _, k = get(f"https://{HOST}/{KEY}.txt")
        if k.decode().strip() != KEY: raise ValueError("wrong body")
    except Exception as e:
        log(f"SKIP key file not live ({e}); submitted=0"); return
    _, sm = get(f"https://{HOST}/sitemap.xml")
    urls = sorted({l.text.strip() for l in ET.fromstring(sm).iter() if l.tag.endswith("loc") and l.text})
    with ThreadPoolExecutor(8) as ex: res = list(ex.map(fp, urls))
    try: prev = json.load(open(STATE))
    except Exception: prev = {}
    live = {u: h for u, st, h in res if st == 200 and h}
    dead = [u for u, st, h in res if st != 200 or not h]
    changed = [u for u, h in live.items() if prev.get(u) != h]
    if not prev and not seed:
        seed = True
    todo = sorted(set(([] if seed else changed) + [u for u in extra if u in live]))
    if dry:
        print(f"DRY-RUN sitemap={len(urls)} live={len(live)} dead={len(dead)} changed={len(changed)} seed={seed} would_submit={len(todo)}")
        for u in todo: print("  would submit", u)
        return
    import os; os.makedirs(os.path.dirname(STATE), exist_ok=True)
    json.dump({**prev, **live}, open(STATE, "w"), indent=0, sort_keys=True)
    if not todo:
        log(f"sitemap={len(urls)} live={len(live)} dead={len(dead)} changed={len(changed)} seed={seed} submitted=0" + (f" dead_urls={dead[:5]}" if dead else "")); return
    res = submit(todo, "sitemap")
    log(f"sitemap={len(urls)} live={len(live)} dead={len(dead)} changed={len(changed)} seed={seed} submitted={len(todo)} batches={len(res)} urls={todo[:8]}{'...' if len(todo) > 8 else ''}")
if __name__ == "__main__":
    import fcntl
    _lock = open("/workspace/ci/state/indexnow.lock", "w")
    try: fcntl.flock(_lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError: log("SKIP another indexnow run holds the lock"); sys.exit(0)
    main()
    if "--dry-run" not in sys.argv: entity_main()
