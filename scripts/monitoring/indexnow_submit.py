#!/usr/bin/env python3
"""Submit councilof.ai URLs to IndexNow -- derived from the sitemap, and only if LIVE.

Replaces a shell script that submitted a hardcoded list of seven URLs. Two rules
it did not have:

  1. WHAT to submit is DERIVED from the sitemap, not typed. A hand-kept list
     indexes the pages someone remembered in 2026, not the site.

  2. NOTHING DEAD IS EVER SUBMITTED. Every candidate is fetched anonymously
     first and only 200s go to the endpoint. On 2026-09-17 three freshly
     published artifacts answered 404 on councilof.ai because no deploy has run
     since 15 September -- pushing those into Bing and Yandex would have asked
     two search engines to index our own missing pages. The estate has been here
     before: 68 of 413 sitemap URLs once answered 308 or 410 while the sitemap
     listed them as content.

Dead URLs are not a failure of this script, they are its output: they are
reported so the sitemap can be fixed.
"""
import argparse, json, sys, urllib.request, urllib.error, xml.etree.ElementTree as ET
import concurrent.futures as cf

HOST = "councilof.ai"
KEY = "97a1aa3163534fae954108d8941eb361"
KEY_URL = f"https://{HOST}/{KEY}.txt"
SITEMAP = f"https://{HOST}/sitemap.xml"
ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://yandex.com/indexnow"]
UA = "Mozilla/5.0 (compatible; csoai-indexnow/2; +https://councilof.ai)"


def get(url, timeout=30):
    r = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(r, timeout=timeout) as resp:
        return resp.status, resp.read()


def sitemap_urls(sitemap=SITEMAP):
    """Every <loc>, following nested sitemap indexes one level."""
    out, seen = [], set()
    todo = [sitemap]
    while todo:
        sm = todo.pop()
        if sm in seen:
            continue
        seen.add(sm)
        try:
            _, body = get(sm)
        except Exception as e:
            print(f"  sitemap unreadable {sm}: {e}", file=sys.stderr)
            continue
        root = ET.fromstring(body)
        tag = root.tag.split("}")[-1]
        for loc in root.iter():
            if loc.tag.split("}")[-1] != "loc" or not (loc.text or "").strip():
                continue
            u = loc.text.strip()
            (todo if tag == "sitemapindex" else out).append(u)
    return sorted(set(out))


def probe(url):
    """Return (url, status). A redirect is NOT a live page for indexing purposes:
    we submit the destination or nothing, never a URL that only forwards."""
    try:
        r = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(r, timeout=30) as resp:
            final = resp.geturl()
            if final.rstrip("/") != url.rstrip("/"):
                return url, f"REDIRECT->{final}"
            return url, resp.status
    except urllib.error.HTTPError as e:
        return url, e.code
    except Exception as e:
        return url, type(e).__name__


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="probe and report, submit nothing")
    ap.add_argument("--extra", action="append", default=[], help="additional URL to consider")
    ap.add_argument("--only-extra", action="store_true", help="consider only --extra URLs; do not expand the sitemap")
    a = ap.parse_args()
    if a.only_extra and not a.extra:
        ap.error("--only-extra requires at least one --extra URL")

    # the key file must itself be reachable or every submission is rejected
    try:
        ks, kb = get(KEY_URL)
        key_ok = ks == 200 and KEY in kb.decode("utf-8", "replace")
    except Exception as e:
        ks, key_ok = type(e).__name__, False
    print(f"[key] {KEY_URL} -> {ks} valid={key_ok}")
    if not key_ok:
        print("REFUSING: the IndexNow key file is not served correctly. Every submission "
              "would be rejected, and a 'submitted N URLs' line would be a false success.")
        return 2

    cands = sorted(set(a.extra if a.only_extra else sitemap_urls() + a.extra))
    source = "extra-only" if a.only_extra else "sitemap+extra"
    print(f"[candidates] source={source} count={len(cands)}")

    live, dead = [], []
    with cf.ThreadPoolExecutor(12) as ex:
        for url, st in ex.map(probe, cands):
            (live if st == 200 else dead).append((url, st))
    print(f"[probe] live={len(live)} not-live={len(dead)}")
    for url, st in dead[:25]:
        print(f"    NOT SUBMITTED  {st}  {url}")
    if len(dead) > 25:
        print(f"    ... and {len(dead)-25} more")

    urls = [u for u, _ in live]
    if a.dry_run:
        print(f"[dry-run] would submit {len(urls)} live URLs")
        return 0
    if not urls:
        print("nothing live to submit")
        return 1

    for ep in ENDPOINTS:
        body = json.dumps({"host": HOST, "key": KEY, "keyLocation": KEY_URL,
                           "urlList": urls}).encode()
        req = urllib.request.Request(ep, data=body, method="POST",
                                     headers={"Content-Type": "application/json", "User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                print(f"[submit] {ep} -> HTTP {resp.status} for {len(urls)} URLs")
        except urllib.error.HTTPError as e:
            print(f"[submit] {ep} -> HTTP {e.code} {e.read()[:200]!r}")
        except Exception as e:
            print(f"[submit] {ep} -> {type(e).__name__}: {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
