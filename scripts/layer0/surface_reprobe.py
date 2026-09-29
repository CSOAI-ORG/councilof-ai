#!/usr/bin/env python3
"""surface_reprobe.py - re-probe every door a Layer 0 surface ceremony attested, and say what moved.

The 2026-09-03 surface ceremony (public/interop/layer0-ceremony-2026-09-03.json) recorded 29 probes of
the estate's own machine surface: method, URL, HTTP status, size. Nothing re-ran them. This reads the
probe list from a ceremony record, repeats each probe the same way (same method; POST with an empty
JSON body, as the ceremony did), and records for each: the first status (redirects NOT followed),
the redirect target, the final status after following, the final body size and sha256, and whether
the first status matches the ceremony's. The output is a dated delta record; it does not edit, sign or
supersede the ceremony.

    python3 scripts/layer0/surface_reprobe.py --ceremony public/interop/layer0-ceremony-2026-09-03.json \
        --out /workspace/lanes/layer0-20260928/surface-reprobe.json
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import http.client
import json
import sys
import time
import urllib.parse
from pathlib import Path

UA = "csoai-layer0-surface-reprobe/0.1 (+https://councilof.ai/layer0/)"


def once(method: str, url: str, timeout: int = 30) -> tuple[int, str | None, bytes]:
    u = urllib.parse.urlsplit(url)
    conn = http.client.HTTPSConnection(u.netloc, timeout=timeout)
    body = b"{}" if method == "POST" else None
    headers = {"user-agent": UA, "accept": "*/*"}
    if body is not None:
        headers["content-type"] = "application/json"
    try:
        conn.request(method, (u.path or "/") + (("?" + u.query) if u.query else ""), body=body, headers=headers)
        r = conn.getresponse()
        data = r.read()
        return r.status, r.getheader("location"), data
    except OSError as exc:
        return 0, None, str(exc).encode()
    finally:
        conn.close()


def probe(method: str, url: str, max_hops: int = 5) -> dict:
    first, loc, data = once(method, url)
    out = {"first_status": first, "redirect_to": None}
    cur, status, hops = url, first, 0
    while status in (301, 302, 303, 307, 308) and loc and hops < max_hops:
        cur = urllib.parse.urljoin(cur, loc)
        out["redirect_to"] = out["redirect_to"] or cur
        status, loc, data = once(method if status in (307, 308) else "GET", cur)
        hops += 1
    out.update({"final_url": cur, "final_status": status, "final_bytes": len(data),
                "final_sha256": hashlib.sha256(data).hexdigest()})
    return out


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--ceremony", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pace", type=float, default=0.5)
    a = ap.parse_args(argv)
    cer_bytes = Path(a.ceremony).read_bytes()
    cer = json.loads(cer_bytes)
    rows, moved = [], 0
    for p in cer.get("probes", []):
        got = probe(p["method"], p["url"])
        same = got["first_status"] == p["status"]
        moved += not same
        rows.append({"method": p["method"], "url": p["url"], "ceremony_status": p["status"],
                     "ceremony_size": p.get("size"), **got,
                     "state": "SAME_STATUS" if same else "STATUS_CHANGED"})
        time.sleep(a.pace)
    rec = {
        "schema": "csoai.layer0-surface-reprobe/0.1",
        "ran_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "ceremony": {"path": a.ceremony, "sha256": hashlib.sha256(cer_bytes).hexdigest(), "as_of": cer.get("as_of")},
        "probes": len(rows),
        "same_status": len(rows) - moved,
        "status_changed": moved,
        "rows": rows,
        "what_this_is": "The ceremony's own probe list, repeated. A changed status is a fact about the door "
                        "since the ceremony, not a verdict on it; a redirect to a live page is recorded as the redirect.",
        "not_a_grade": True,
    }
    Path(a.out).write_text(json.dumps(rec, indent=1) + "\n")
    for r in rows:
        if r["state"] != "SAME_STATUS":
            print(f"{r['method']} {r['url']}: {r['ceremony_status']} -> {r['first_status']}"
                  + (f" -> {r['redirect_to']} ({r['final_status']})" if r["redirect_to"] else ""))
    print(json.dumps({"probes": len(rows), "same_status": len(rows) - moved, "status_changed": moved}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
