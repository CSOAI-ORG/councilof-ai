#!/usr/bin/env python3
"""x402 buyer canary — does every door we advertise answer a stranger's first GET, fast?

Reads https://councilof.ai/.well-known/x402.json and GETs every resources[].url EXACTLY as
published (no payment header, the buyer's first move), PROBES times per door, and records per probe:
HTTP status, wall time, whether a PAYMENT-REQUIRED header came back, and the body's x402Version.

Classes (never collapsed):
  CHALLENGE_402_FAST    402 with a PAYMENT-REQUIRED header in < FAST_S seconds
  CHALLENGE_402_SLOW    the same, at or over FAST_S
  PREVIEW_ONLY_200      200 whose body says preview_only:true and state UNMEASURED — a door
                        declining to sell an unreadable read (plan item #19); correct, not a miss
  NO_PAYMENT_HEADER     402 without the PAYMENT-REQUIRED header
  UNEXPECTED_STATUS     any other status
  TIMEOUT               no answer within TIMEOUT_S
  ERROR                 connection-level failure

A door "answers in time" when EVERY probe is CHALLENGE_402_FAST or PREVIEW_ONLY_200.
The run pays nothing, signs nothing and publishes nothing: it writes one JSONL row per probe and one
summary JSON under --out, and prints one summary line. Stdlib only; light enough for the 1 GB host.

  python3 scripts/x402-buyer-canary.py --out /evac-bulk/x402-buyer-canary [--probes 3] [--manifest URL]
Exit 0 when every door answered in time, 1 when any did not, 2 when the manifest could not be read
(then the run is UNMEASURED, never "all fine").
"""
import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.error
import urllib.request

MANIFEST = "https://councilof.ai/.well-known/x402.json"
FAST_S = 5.0
TIMEOUT_S = 20.0
UA = "csoai-x402-buyer-canary/0.1 (+https://councilof.ai; own-door probe, pays nothing)"
IN_TIME = {"CHALLENGE_402_FAST", "PREVIEW_ONLY_200"}


def classify(status, seconds, has_pr_header, body):
    """Pure: one probe's observation -> its class."""
    if status is None:
        return "TIMEOUT" if seconds >= TIMEOUT_S - 0.5 else "ERROR"
    if status == 402:
        if not has_pr_header:
            return "NO_PAYMENT_HEADER"
        return "CHALLENGE_402_FAST" if seconds < FAST_S else "CHALLENGE_402_SLOW"
    if status == 200 and isinstance(body, dict) and body.get("preview_only") is True and body.get("state") == "UNMEASURED":
        return "PREVIEW_ONLY_200"
    return "UNEXPECTED_STATUS"


def probe(url, opener=urllib.request.urlopen):
    req = urllib.request.Request(url, headers={"user-agent": UA, "accept": "application/json"})
    t0 = time.monotonic()
    status, headers, raw = None, {}, b""
    try:
        with opener(req, timeout=TIMEOUT_S) as r:
            status, headers, raw = r.status, dict(r.headers), r.read(262144)
    except urllib.error.HTTPError as e:
        status, headers = e.code, dict(e.headers or {})
        try:
            raw = e.read(262144)
        except Exception:
            raw = b""
    except Exception as e:  # timeout or connection failure
        secs = time.monotonic() - t0
        return {"status": None, "seconds": round(secs, 3), "payment_required_header": False, "x402Version": None, "error": str(e)[:200]}
    secs = time.monotonic() - t0
    try:
        body = json.loads(raw.decode("utf-8") or "null")
    except Exception:
        body = None
    lower = {k.lower(): v for k, v in headers.items()}
    return {
        "status": status,
        "seconds": round(secs, 3),
        "payment_required_header": "payment-required" in lower,
        "x402Version": body.get("x402Version") if isinstance(body, dict) else None,
        "preview_only": bool(isinstance(body, dict) and body.get("preview_only")),
        "state": body.get("state") if isinstance(body, dict) else None,
        "_body": body,
    }


def summarize(rows):
    doors = {}
    for r in rows:
        doors.setdefault(r["url"], []).append(r["class"])
    per_door = {u: {"classes": cs, "in_time": all(c in IN_TIME for c in cs)} for u, cs in doors.items()}
    return {
        "doors": len(per_door),
        "doors_in_time": sum(1 for d in per_door.values() if d["in_time"]),
        "doors_not_in_time": sorted(u for u, d in per_door.items() if not d["in_time"]),
        "per_door": per_door,
    }


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--probes", type=int, default=3)
    ap.add_argument("--manifest", default=MANIFEST)
    ap.add_argument("--pause", type=float, default=1.0, help="seconds between probes (be gentle with our own edge)")
    a = ap.parse_args(argv)
    now = dt.datetime.now(dt.timezone.utc)
    day = now.strftime("%Y-%m-%d")
    os.makedirs(a.out, exist_ok=True)
    try:
        with urllib.request.urlopen(urllib.request.Request(a.manifest, headers={"user-agent": UA}), timeout=TIMEOUT_S) as r:
            manifest = json.loads(r.read())
        urls = [x["url"] for x in manifest.get("resources", []) if isinstance(x, dict) and x.get("url")]
    except Exception as e:
        summary = {"schema": "csoai.x402-buyer-canary/0.1", "date": day, "state": "UNMEASURED", "reason": f"manifest unreadable: {str(e)[:200]}"}
        json.dump(summary, open(os.path.join(a.out, f"summary-{day}.json"), "w"), indent=2)
        print(f"x402-buyer-canary {day} UNMEASURED manifest unreadable")
        return 2
    if not urls:
        print(f"x402-buyer-canary {day} UNMEASURED manifest lists no resources")
        return 2
    rows = []
    for i in range(a.probes):
        for u in urls:
            p = probe(u)
            body = p.pop("_body", None)
            p.update({"url": u, "probe": i + 1, "at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")})
            p["class"] = classify(p["status"], p["seconds"], p["payment_required_header"], body)
            rows.append(p)
            time.sleep(a.pause)
    with open(os.path.join(a.out, f"probes-{day}.jsonl"), "a") as f:
        for r in rows:
            f.write(json.dumps(r, sort_keys=True) + "\n")
    s = summarize(rows)
    summary = {
        "schema": "csoai.x402-buyer-canary/0.1",
        "date": day,
        "as_of": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "manifest": a.manifest,
        "rule": f"GET each resources[].url exactly as published, no payment, {a.probes} probes; in time = every probe is a 402 with PAYMENT-REQUIRED in < {FAST_S}s, or a 200 preview-only UNMEASURED answer",
        "state": "READ",
        **s,
    }
    json.dump(summary, open(os.path.join(a.out, f"summary-{day}.json"), "w"), indent=2, sort_keys=True)
    print(f"x402-buyer-canary {day} doors={s['doors']} in_time={s['doors_in_time']} not_in_time={len(s['doors_not_in_time'])} " + " ".join(s["doors_not_in_time"])[:600])
    return 0 if not s["doors_not_in_time"] else 1


if __name__ == "__main__":
    sys.exit(main())
