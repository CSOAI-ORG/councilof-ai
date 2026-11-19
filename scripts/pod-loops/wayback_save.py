#!/usr/bin/env python3
"""Ask the Wayback Machine to capture our claim URLs, then VERIFY each one in the CDX
index and record only what the index confirms.

The verification is not politeness, it is the whole point. Measured 2026-09-22 from the
pod, the anonymous Save Page Now surface lies about its own outcome in both directions:

  * GET https://web.archive.org/save/<url> answers HTTP 500 with the ordinary Internet
    Archive error chrome, and captures anyway. https://councilof.ai/memberships/ had
    ZERO captures in CDX, was requested at 16:07:01Z, and appeared as capture
    20260922160829.
  * POST https://web.archive.org/save answers 401 {"message":"You need to be logged in
    to use Save Page Now."} for the same URL that the GET route then captured.
  * and the request does not always take: a GET /save for /root.json at 15:34Z produced
    no new capture at all.

So the HTTP status of a save request is worthless as evidence, and so is its absence. A
capture is real when, and only when, it is in CDX and the archived bytes read back.

Redirects: SPN archives the destination, not the hop. https://councilof.ai/gspc is a 308
to /dashboard/?tab=board and has zero captures of its own while the destination has
three. Every target here is resolved before it is submitted, so we archive pages rather
than forwarding rules.
"""
import argparse, json, os, time, urllib.request, urllib.error, urllib.parse

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
OUT = os.environ.get("WAYBACK_OUT", "/workspace/lanes/out/index-presence")
LEDGER = os.path.join(OUT, "wayback-ledger.json")

TARGETS = [
    "https://councilof.ai/",
    "https://councilof.ai/gspc",
    "https://councilof.ai/api/gspc",
    "https://councilof.ai/root.json",
    "https://councilof.ai/.well-known/did.json",
    "https://councilof.ai/.well-known/x402.json",
    "https://councilof.ai/api/corrections",
    "https://councilof.ai/memberships",
    "https://councilof.ai/pay",
    "https://councilof.ai/signed/card_index.json",
    "https://councilof.ai/api/cards",
]


def g(u, t=200, data=None, hdrs=None):
    h = {"User-Agent": UA}
    h.update(hdrs or {})
    try:
        r = urllib.request.urlopen(urllib.request.Request(u, data=data, headers=h), timeout=t)
        return r.status, r.geturl(), r.read()
    except urllib.error.HTTPError as e:
        return e.code, u, e.read()
    except Exception as e:
        return 0, u, str(e).encode()


def resolve(u):
    """The URL a crawler would actually archive: the end of the redirect chain."""
    st, fin, _ = g(u, 60)
    return fin if st == 200 else u, st


def cdx(u, tries=4):
    q = ("http://web.archive.org/cdx/search/cdx?url="
         + urllib.parse.quote(u, safe="") + "&output=json")
    for i in range(tries):
        st, _, b = g(q, 90)
        if st == 200:
            try:
                d = json.loads(b or b"[]")
                return sorted(r[1] for r in (d[1:] if d else []))
            except Exception:
                pass
        time.sleep(5 + 5 * i)
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=int, default=4,
                    help="save requests per run; SPN throttles anonymous callers hard")
    ap.add_argument("--max-age-days", type=int, default=7)
    ap.add_argument("--settle-seconds", type=int, default=150)
    a = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)
    try:
        ledger = json.load(open(LEDGER))
    except Exception:
        ledger = {}

    cutoff = time.time() - a.max_age_days * 86400
    due, resolved = [], {}
    for t in TARGETS:
        r, st = resolve(t)
        resolved[t] = {"resolved": r, "live_http": st}
        prev = ledger.get(r) or {}
        if prev.get("verified_timestamp") and prev.get("epoch", 0) > cutoff:
            continue
        due.append((t, r))

    if not due:
        print("[result] targets=%d due=0 requested=0 verified=0; every target has a CDX "
              "capture newer than %d days -- nothing to do" % (len(TARGETS), a.max_age_days))
        return 0

    before, requested = {}, []
    for t, r in due[:a.budget]:
        before[r] = set(cdx(r) or [])
        st, fin, _ = g("https://web.archive.org/save/" + r, 240)
        requested.append((t, r))
        print("[save] requested %s (SPN answered HTTP %s -- not evidence either way)" % (r, st))
        time.sleep(4)

    print("[wait] %ds for the index to settle" % a.settle_seconds, flush=True)
    time.sleep(a.settle_seconds)

    verified = 0
    for t, r in requested:
        after = set(cdx(r) or [])
        new = sorted(after - before[r])
        if new:
            ts = new[-1]
            arch = "https://web.archive.org/web/%s/%s" % (ts, r)
            st, _, b = g("https://web.archive.org/web/%sid_/%s" % (ts, r), 150)
            ledger[r] = {"target": t, "verified_timestamp": ts, "archived_url": arch,
                         "readback_http": st, "readback_bytes": len(b),
                         "epoch": time.time(),
                         "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
            verified += 1
            print("  VERIFIED %s -> %s (%d bytes read back)" % (r, arch, len(b)))
        else:
            print("  NOT CAPTURED %s -- the request produced no new CDX entry" % r)

    tmp = LEDGER + ".tmp"
    json.dump(ledger, open(tmp, "w"), indent=1, sort_keys=True)
    os.replace(tmp, LEDGER)
    print("[result] targets=%d due=%d requested=%d verified=%d; ledger holds %d "
          "CDX-confirmed captures" % (len(TARGETS), len(due), len(requested), verified,
                                      len(ledger)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
