#!/usr/bin/env python3
"""Ask Software Heritage to archive this estate's public git origins, a few per run.

Why this exists. A save that succeeds returns a SWHID: a permanent, third-party,
content-addressed statement that these bytes existed on that date. Nothing else in the
estate buys that. It is not a claim that anybody reads them.

Two measured constraints shape it, and neither is worked around:

  * The anonymous save endpoint allows 10 requests per window (X-Ratelimit-Limit: 10,
    measured 2026-09-22). So this takes a budget per run and leaves the rest for the
    next one, instead of burning the window and logging failures.

  * github.com/CSOAI-ORG/* answers 404 to anonymous visitors while the same
    repositories are public and pushable when authenticated. SWH's loader therefore
    reports visit_status "not_found" (request 2492509, 2026-09-22). Until that account
    flag is lifted, GitHub is not an archivable origin for us and the Hugging Face
    repositories are. The GitHub origin stays in the list so the day it starts working
    is recorded rather than guessed.

The ledger at $OUT/software-heritage-ledger.json is append-only per origin: it keeps the
newest SWHID and the date it was obtained. An origin archived within --max-age-days is
not resubmitted, because asking again for bytes that have not moved wastes the window
that an unarchived origin needs.
"""
import argparse, json, os, time, urllib.request, urllib.error

UA = "csoai-swh-archive/1 (+https://councilof.ai)"
API = "https://archive.softwareheritage.org/api/1/origin/save"
OUT = os.environ.get("SWH_OUT", "/workspace/lanes/out/index-presence")
LEDGER = os.path.join(OUT, "software-heritage-ledger.json")


def call(url, method="GET"):
    r = urllib.request.Request(url, headers={"User-Agent": UA}, method=method)
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            return resp.status, json.loads(resp.read()), dict(resp.headers)
    except urllib.error.HTTPError as e:
        hdrs = dict(e.headers or {})
        try:
            return e.code, json.loads(e.read()), hdrs
        except Exception:
            return e.code, None, hdrs
    except Exception as e:
        return 0, {"error": "%s: %s" % (type(e).__name__, e)}, {}


def origins():
    """Every public csoai Hugging Face dataset, newest-modified first, plus the two
    source mirrors and the GitHub origin. Enumerated live: a typed list archives the
    repositories someone remembered."""
    out = []
    st, d, _ = call("https://huggingface.co/api/datasets?author=csoai&limit=1000")
    if isinstance(d, list):
        for x in sorted(d, key=lambda r: str(r.get("lastModified") or ""), reverse=True):
            out.append("https://huggingface.co/datasets/" + x["id"])
    st, d, _ = call("https://huggingface.co/api/models?author=csoai&limit=1000")
    if isinstance(d, list):
        for x in d:
            out.append("https://huggingface.co/" + x["id"])
    out.append("https://github.com/CSOAI-ORG/councilof-ai")
    seen, uniq = set(), []
    for o in out:
        if o not in seen:
            seen.add(o)
            uniq.append(o)
    return uniq


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--budget", type=int, default=8,
                    help="save requests to spend this run (the anonymous window allows 10)")
    ap.add_argument("--max-age-days", type=int, default=30,
                    help="do not resubmit an origin archived more recently than this")
    ap.add_argument("--poll-seconds", type=int, default=180,
                    help="how long to wait for the submitted saves to reach a terminal state")
    a = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    try:
        ledger = json.load(open(LEDGER))
    except Exception:
        ledger = {}

    now = time.time()
    cutoff = now - a.max_age_days * 86400
    todo = []
    for o in origins():
        prev = ledger.get(o) or {}
        if prev.get("snapshot_swhid") and prev.get("epoch", 0) > cutoff:
            continue
        todo.append(o)

    if not todo:
        print("[result] origins=%d due=0 submitted=0 succeeded=0; every origin has a "
              "SWHID newer than %d days -- nothing to do"
              % (len(origins()), a.max_age_days))
        return 0

    submitted, limited = [], 0
    for o in todo[:a.budget]:
        st, d, h = call("%s/git/url/%s/" % (API, o), method="POST")
        if st == 429:
            limited += 1
            reset = h.get("X-Ratelimit-Reset")
            print("[rate] 429 on %s; window resets at %s" % (o, reset))
            break
        if st == 200 and (d or {}).get("id"):
            submitted.append({"origin": o, "id": d["id"]})
            print("[post] accepted %s (%s)" % (o, d["id"]))
        else:
            print("[post] HTTP %s %s %s" % (st, o, (d or {}).get("error", "")))
        time.sleep(2)

    deadline = time.time() + a.poll_seconds
    pending = {r["id"]: r for r in submitted}
    succeeded = 0
    while pending and time.time() < deadline:
        time.sleep(15)
        for i in list(pending):
            st, d, _ = call("%s/%s/" % (API, i))
            if not d:
                continue
            ts = d.get("save_task_status")
            if ts in ("succeeded", "failed", "not_created"):
                o = pending[i]["origin"]
                swhid = d.get("snapshot_swhid")
                ledger[o] = {"snapshot_swhid": swhid, "save_task_status": ts,
                             "visit_status": d.get("visit_status"),
                             "visit_date": d.get("visit_date"),
                             "request_id": i, "epoch": time.time(),
                             "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                             "browse_url": "https://archive.softwareheritage.org/browse/"
                                           "origin/directory/?origin_url=" + o}
                succeeded += int(ts == "succeeded")
                print("  %-10s %-10s %s %s" % (ts, d.get("visit_status"), o, swhid or "-"))
                del pending[i]
    for i, r in pending.items():
        print("  pending-at-timeout %s (request %s)" % (r["origin"], i))

    tmp = LEDGER + ".tmp"
    json.dump(ledger, open(tmp, "w"), indent=1, sort_keys=True)
    os.replace(tmp, LEDGER)

    archived = sum(1 for v in ledger.values() if v.get("snapshot_swhid"))
    print("[result] due=%d submitted=%d succeeded=%d rate_limited=%d pending=%d; "
          "ledger holds %d origins with a SWHID"
          % (len(todo), len(submitted), succeeded, limited, len(pending), archived))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
