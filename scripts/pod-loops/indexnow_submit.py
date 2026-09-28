#!/usr/bin/env python3
"""Submit councilof.ai URLs to IndexNow -- derived from the sitemap, only if LIVE,
and only if CHANGED.

Replaces a shell script that submitted a hardcoded list of seven URLs. Three rules
it did not have:

  1. WHAT to submit is DERIVED from the sitemap, not typed. A hand-kept list
     indexes the pages someone remembered in 2026, not the site.

  2. NOTHING DEAD IS EVER SUBMITTED. Every candidate is fetched anonymously
     first and only 200s go to the endpoint. On 2026-09-17 three freshly
     published artifacts answered 404 on councilof.ai because no deploy had run
     since 15 September -- pushing those into Bing and Yandex would have asked
     two search engines to index our own missing pages. The estate has been here
     before: 68 of 413 sitemap URLs once answered 308 or 410 while the sitemap
     listed them as content.

  3. NOTHING UNCHANGED IS EVER RESUBMITTED (--changed-only). IndexNow's own
     guidance is to notify search engines of *meaningful* changes; resubmitting
     URLs that did not change is what the protocol asks publishers not to do.
     On 2026-09-21 this script submitted seven URLs and a later sweep found 552
     live ones -- pushing all 552 on every deploy would be exactly that.
     --changed-only fetches each live URL, fingerprints it, and submits only the
     URLs that are new or whose fingerprint moved since the last ACCEPTED
     submission.

     The fingerprint is sha256 over the response body with one normalisation:
     Cloudflare's email-obfuscation tokens (email-protection#<hex> and
     data-cfemail="<hex>") are replaced, because Cloudflare rotates that XOR key
     on every single response. Measured 2026-09-22 from the pod: two fetches of
     https://councilof.ai/ three seconds apart were byte-identical except for
     exactly those bytes. Without the normalisation every page looks changed on
     every run and the diff is worthless.

Dead URLs are not a failure of this script, they are its output: they are
reported so the sitemap can be fixed.

FOUR STATES, NEVER CONFLATED. SUBMITTED (we sent it), ACCEPTED (the endpoint
answered 200 or 202), APPEARING (a search engine shows the URL) and PRESENT (it
still does). This script can only ever observe the first two. HTTP 200 from
api.indexnow.org means the notification was received, not that anything was
crawled, indexed or ranked. Nothing here claims the last two states and nothing
reading its receipt should either.
"""
import argparse, hashlib, json, os, re, sys, time
import urllib.request, urllib.error, xml.etree.ElementTree as ET
import concurrent.futures as cf
from html.parser import HTMLParser

HOST = "councilof.ai"
# Three key files are committed under public/ and all three answer 200 live.
# This is the current one: it is the only one any script references, it is the
# one the 2026-09-21 receipt verified, and it is the newest (committed
# 2026-09-12, ab8a035a4). The other two (1ab9ec14..., 529017b8..., both
# 2026-08-19) remain served so that any submission made under them stays
# verifiable. IndexNow accepts any key whose file is served at the host root,
# so nothing needs revoking and no fourth key should ever be minted.
KEY = "97a1aa3163534fae954108d8941eb361"
KEY_URL = f"https://{HOST}/{KEY}.txt"
SITEMAP = f"https://{HOST}/sitemap.xml"
ENDPOINTS = ["https://api.indexnow.org/indexnow", "https://yandex.com/indexnow"]
UA = "Mozilla/5.0 (compatible; csoai-indexnow/3; +https://councilof.ai)"
DEFAULT_STATE = os.environ.get(
    "INDEXNOW_STATE", "/workspace/lanes/state/indexnow-councilof-ai.json")

# Byte ranges that move between two fetches of an UNCHANGED response. Each one was
# measured from the pod on 2026-09-22 by fetching the same URL twice seconds apart
# and diffing; nothing is masked on suspicion. Masking anything else would hide real
# change, so this list grows only with a new measurement behind it.
VOLATILE = [
    # Cloudflare Email Obfuscation rotates this XOR key on every single response.
    # Measured: two fetches of https://councilof.ai/ three seconds apart were
    # byte-identical except here.
    (re.compile(rb'(email-protection#|data-cfemail="|data-cfemail=)[0-9a-fA-F]+'), b"CFEMAIL"),
    # Response generation time. Measured: /api/feed.xml, /api/regulator-findings and
    # /api/reported differ between consecutive fetches ONLY in a request-time stamp
    # ("ts", "as_of", <pubDate>, and the guid fragment derived from it). A response
    # that says only "I was generated a moment later" is not a change a search engine
    # asked to be told about; when the substance moves, the hash moves with it.
    (re.compile(rb'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})'), b"TS"),
    (re.compile(rb'[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT'), b"TS"),
    (re.compile(rb'#\d{8,14}(?=["<\s])'), b"#TS"),
]


class _Substance(HTMLParser):
    """What a search engine indexes on an HTML page: title, description, canonical, robots,
    JSON-LD, and the visible text outside the site chrome. Measured 2026-09-24 by diffing
    /about/, /faq/ and /blog/ across production deployments a35ca8f1 and 1fba94ac: every
    difference was build-level (hashed /assets/ names, the shared inline shell script) or a
    site-wide header restyle, and it made ~400 of 559 pages "change" on every build. None of
    that is a change to the page, so none of it is announced."""
    SKIP = {"script", "style", "noscript", "svg", "template", "header", "nav", "footer"}
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts, self.skip, self.ld = [], 0, False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and (a.get("type") or "").lower() == "application/ld+json":
            self.ld = True; return
        if tag in self.SKIP: self.skip += 1; return
        if tag == "meta" and (a.get("name") or "").lower() in ("description", "robots"):
            self.parts.append(f"meta:{a.get('name')}={a.get('content')}")
        if tag == "link" and (a.get("rel") or "").lower() == "canonical":
            self.parts.append(f"canonical={a.get('href')}")
    def handle_endtag(self, tag):
        if self.ld and tag == "script": self.ld = False; return
        if tag in self.SKIP and self.skip: self.skip -= 1
    def handle_data(self, data):
        if self.ld: self.parts.append("ld:" + " ".join(data.split())); return
        if not self.skip:
            t = " ".join(data.split())
            if t: self.parts.append(t)


def fingerprint(body, content_type=""):
    """sha256 of what the response says, not of how it was built.

    This is a SUBSTANCE fingerprint, and the distinction matters: a page whose only
    difference is the moment it was rendered, or the build that rendered it, has not
    changed, and announcing it would be the resubmission the protocol asks publishers
    not to make. HTML pages hash their indexable substance (_Substance); everything
    else hashes its bytes with the measured volatile ranges masked."""
    for rx, repl in VOLATILE:
        body = rx.sub(repl, body)
    if "html" in content_type.lower() or body.lstrip()[:15].lower().startswith((b"<!doctype html", b"<html")):
        p = _Substance()
        p.feed(body.decode("utf-8", errors="replace")); p.close()
        return "s1:" + hashlib.sha256("\n".join(p.parts).encode()).hexdigest()
    return hashlib.sha256(body).hexdigest()


def now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


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
    """Return (url, status, fingerprint-or-None). A redirect is NOT a live page for
    indexing purposes: we submit the destination or nothing, never a URL that only
    forwards. The body is read here so the change diff costs no second request."""
    try:
        r = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(r, timeout=30) as resp:
            final = resp.geturl()
            body = resp.read()
            if final.rstrip("/") != url.rstrip("/"):
                return url, f"REDIRECT->{final}", None
            return url, resp.status, fingerprint(body, resp.headers.get("Content-Type", ""))
    except urllib.error.HTTPError as e:
        return url, e.code, None
    except Exception as e:
        return url, type(e).__name__, None


def load_state(path):
    """{url: {"fingerprint": hex, "first_seen": iso, "last_submitted": iso}}.

    A missing state file means "nothing has ever been submitted through this
    state", which is honest rather than convenient: the next run then submits
    every live URL once and records them. An unreadable one is reported, never
    silently treated as empty agreement."""
    try:
        with open(path) as f:
            d = json.load(f)
        return d if isinstance(d, dict) else {}
    except FileNotFoundError:
        print(f"[state] {path} absent -- first run through this state file")
        return {}
    except Exception as e:
        print(f"[state] UNREADABLE {path}: {type(e).__name__}: {e}")
        return {}


def save_state(path, state):
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=1, sort_keys=True)
    os.replace(tmp, path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="probe and report, submit nothing")
    ap.add_argument("--extra", action="append", default=[], help="additional URL to consider")
    ap.add_argument("--changed-only", action="store_true",
                    help="submit only URLs that are new or whose content fingerprint moved")
    ap.add_argument("--state", default=DEFAULT_STATE,
                    help=f"per-URL fingerprint record (default {DEFAULT_STATE})")
    ap.add_argument("--max-urls", type=int, default=10000,
                    help="refuse to send more than this many URLs in one request")
    ap.add_argument("--seed-only", action="store_true",
                    help="with --changed-only and no existing state: record today's "
                         "fingerprints and submit nothing, so later runs announce only "
                         "genuine changes. A no-op once the state exists.")
    a = ap.parse_args()

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

    # A URL may already be in the sitemap when supplied with --extra. Probe,
    # diff and submit each canonical URL once.
    cands = sorted(set(sitemap_urls()).union(a.extra))
    print(f"[sitemap] {len(cands)} candidate URLs")

    live, dead = [], []
    with cf.ThreadPoolExecutor(12) as ex:
        for url, st, fp in ex.map(probe, cands):
            (live if st == 200 else dead).append((url, st, fp))
    print(f"[probe] live={len(live)} not-live={len(dead)}")
    for url, st, _ in dead[:25]:
        print(f"    NOT SUBMITTED  {st}  {url}")
    if len(dead) > 25:
        print(f"    ... and {len(dead)-25} more")

    state = load_state(a.state) if a.changed_only else {}
    if a.changed_only:
        new, moved, same, unfingerprinted = [], [], [], []
        for url, _, fp in live:
            if fp is None:
                unfingerprinted.append(url)
                continue
            prev = state.get(url)
            if not prev:
                new.append(url)
            elif prev.get("fingerprint") != fp:
                moved.append(url)
            else:
                same.append(url)
        urls = new + moved
        print(f"[diff] live={len(live)} new={len(new)} changed={len(moved)} "
              f"unchanged={len(same)} no-fingerprint={len(unfingerprinted)} "
              f"-> to submit {len(urls)}")
        for u in (new + moved)[:25]:
            print(f"    CHANGED  {u}")
        # First run through a fresh state: announcing all 553 at once would
        # contradict the 2026-09-21 receipt ("do not re-ping without a material
        # public URL change") on a judgement no script is entitled to make. Seed
        # instead, and say plainly what was NOT done and how to do it.
        if a.seed_only and not state and not a.dry_run:
            ts = now()
            save_state(a.state, {u: {"fingerprint": fp, "first_seen": ts,
                                     "last_submitted": None}
                                 for u, _, fp in live if fp is not None})
            print(f"[seed] recorded {len(live)} fingerprints in {a.state}; "
                  f"SUBMITTED 0. Later runs will announce only genuine changes.")
            print(f"[result] seeded={len(live)} submitted=0 accepted=0; "
                  f"indexing NOT_VERIFIED. To announce the whole live corpus once, "
                  f"an owner runs this without --seed-only.")
            return 0
    else:
        urls = [u for u, _, _ in live]
        print(f"[diff] --changed-only not set: every live URL is a candidate ({len(urls)}). "
              f"IndexNow asks publishers not to resubmit unchanged URLs.")

    if a.dry_run:
        print(f"[dry-run] would submit {len(urls)} URLs; state not written")
        return 0
    if not urls:
        # The receipt for a run with nothing to do still has to exist, or an
        # absent log line reads like an absent run.
        print(f"[result] nothing to do: {len(live)} live URLs, 0 new, 0 changed; "
              f"submitted=0 accepted=0; indexing NOT_VERIFIED")
        return 0
    if len(urls) > a.max_urls:
        print(f"REFUSING: {len(urls)} URLs exceeds --max-urls {a.max_urls}")
        return 2

    accepted = 0
    for ep in ENDPOINTS:
        body = json.dumps({"host": HOST, "key": KEY, "keyLocation": KEY_URL,
                           "urlList": urls}).encode()
        req = urllib.request.Request(ep, data=body, method="POST",
                                     headers={"Content-Type": "application/json", "User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                # 200 = received. 202 = received, key validation still pending.
                # Neither is crawling and neither is indexing.
                ok = resp.status in (200, 202)
                accepted += int(ok)
                print(f"[submit] {ep} -> HTTP {resp.status} for {len(urls)} URLs "
                      f"state={'ACCEPTED' if ok else 'REJECTED'}")
        except urllib.error.HTTPError as e:
            print(f"[submit] {ep} -> HTTP {e.code} {e.read()[:200]!r} state=REJECTED")
        except Exception as e:
            print(f"[submit] {ep} -> {type(e).__name__}: {e} state=REJECTED")

    # The fingerprint is recorded only for URLs that were actually accepted
    # somewhere. If every endpoint rejected, the next run must try again, so the
    # state must not move.
    if accepted and a.changed_only:
        fps = {u: fp for u, _, fp in live if fp is not None}
        ts = now()
        for u in urls:
            rec = state.get(u) or {"first_seen": ts}
            rec["fingerprint"] = fps[u]
            rec["last_submitted"] = ts
            state[u] = rec
        save_state(a.state, state)
        print(f"[state] {a.state} updated for {len(urls)} URLs")
    elif a.changed_only:
        print("[state] no endpoint accepted; state deliberately NOT advanced so the "
              "next run retries these URLs")

    print(f"[result] submitted={len(urls)} endpoints={len(ENDPOINTS)} accepted={accepted}; "
          f"indexing NOT_VERIFIED")
    return 0 if accepted else 1


if __name__ == "__main__":
    sys.exit(main())
