#!/usr/bin/env python3
"""x402 Bazaar conformance census — the producer behind csoai/x402-bazaar-conformance.

The 2026-09-05 snapshot on the Hub was produced from a laptop by a script that lived in no repository
(searched: this repo, every worktree under ~/clawd, the pod). This file re-implements the method the
dataset's own README states, row-for-row compatible with snapshots/conformance-2026-09-05.jsonl, so
scripts/grants/x402-settlement-census.py can take a daily snapshot as its --census.

Method (verbatim from the dataset): one GET per DISTINCT HOST listed in either public x402 Bazaar
(Coinbase CDP, PayAI), using the first resource that index advertises for that host. Conformant =
HTTP 402 AND a PAYMENT-REQUIRED response header AND x402Version 2 in the body AND an extensions.bazaar
block. Identifiable UA, 12 s timeout, 24 concurrent. Nothing signed, nothing paid, no door settled.
Both indexes answer keyless: CDP paginates limit=100&offset=N, PayAI limit=1000&offset=N.
Each index is walked to an EMPTY page (ENUMERATION_RULE); its reported total is recorded, not used to stop.

Two readings the 2026-09-05 snapshot forces, established by re-probing its own rows on 6 Sep:
  * "x402Version 2 in the body" is literal. Most doors carry a v2 challenge WITH the bazaar block in the
    PAYMENT-REQUIRED header and a v1 (or empty) body; the snapshot scores those NON-conformant
    (394 of 3,520). Reading the header first scored 1,310 of 2,800 — a rule change, not an overnight
    change. So `x402_version` / `has_bazaar_extension` / `accepts` come from the BODY here, and the header's
    own reading is kept beside them as header_x402_version / header_has_bazaar_extension.
  * A listing without a scheme (2,817 PayAI rows on 6 Sep) is still a listed host: the snapshot kept 761
    such probe_urls. They are probed as https:// and flagged listed_without_scheme.

    x402-bazaar-conformance.py --out-dir /workspace/lanes/out/x402-bazaar-conformance [--date 2026-09-06]
                               [--previous <jsonl>]   # diff basis; default = newest earlier snapshot in out-dir,
                                                      # else the 2026-09-05 snapshot on the Hub
                               [--max-hosts N]        # smoke runs only; the summary then says partial=true

Writes  snapshots/conformance-<date>.jsonl, summary-<date>.json, diff-<date>.json (hosts added/dropped,
conformant delta, price drift per host). Re-running for a date whose .done marker exists is a no-op.
A host is `state: "PAYABLE"` only in the older single-file export; here the row carries the same
booleans the snapshot carries and `conformant` is derived from them, never typed.
"""
import argparse, base64, concurrent.futures as cf, json, os, sys, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path

UA = "csoai-x402-bazaar-conformance/0.2 (+https://councilof.ai/interop/x402-challenge/)"
CDP = "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"
PAYAI = "https://facilitator.payai.network/discovery/resources"
HUB_PREV = ("https://huggingface.co/datasets/csoai/x402-bazaar-conformance/resolve/main/"
            "snapshots/conformance-2026-09-05.jsonl")
TIMEOUT, CONCURRENCY = 12, 24


def get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, dict(r.headers), r.read()


PAGE_RETRIES = 3        # attempts per page before the walk is recorded as failed
PAGE_SLEEP_S = 0.4
SERVED_VS_REPORTED_TOL = 0.01   # the index's count may run ahead of the list it serves by at most 1%
ENUMERATION_RULE = (
    "Each index is walked page by page, the offset advancing by the page size (never by the number of items a page "
    "returned: CDP treats offset as page-aligned and re-serves the aligned page for an unaligned offset), until the index "
    "serves an EMPTY page, which is requested twice. complete = the walk stopped on an empty page that was empty both "
    "times, every page answered (up to 3 attempts each) at the offset requested, and the number of listings served is at "
    "least 99% of the largest total the index reported during the walk. The reported total is recorded beside the count "
    "served and is not the stop rule: on 2026-09-28 CDP reported 17,722 while serving 17,721 (01:09Z), 18,996 while "
    "serving 19,004 (14:0xZ) and 19,085 while serving 19,004 (14:08Z; its count ran ahead of an unchanged served list), "
    "so a count-equality rule marks a fully read index partial, or a short read complete by chance.")


def enumerate_index(name, base, limit, log, sleep=PAGE_SLEEP_S, retries=PAGE_RETRIES):
    """Walk one discovery index to an EMPTY page. A short or failed read is recorded, never passed off as complete.

    Before 2026-09-28 the walk stopped at offset + limit >= reported total and was complete iff items >= total. The
    index's total is not the count it serves (see ENUMERATION_RULE), so that rule failed a run that had read every page
    the index served (2026-09-28, CDP 17,721 served vs 17,722 reported) and would pass a run whose count is inflated by
    a listing served twice. The stop rule is now the index's own end of list; the reported total only bounds where that
    end may fall."""
    items, offset, pages, totals, n_retries = [], 0, 0, [], 0
    stop, failed_page, empty_at = None, None, None
    while True:
        url = f"{base}?limit={limit}&offset={offset}"
        d, err = None, None
        for attempt in range(retries):
            try:
                _, _, body = get(url)
                d = json.loads(body)
                if not isinstance(d, dict):
                    raise ValueError("page is not a JSON object")
                break
            except Exception as e:
                d, err = None, e
                if attempt + 1 < retries:
                    n_retries += 1
                    time.sleep(sleep * (2 ** attempt))
        if d is None:
            stop, failed_page = "PAGE_FAILED", {"offset": offset, "error": type(err).__name__}
            log(f"{name}: page offset={offset} failed {type(err).__name__} after {retries} attempts; stopping with {len(items)}")
            break
        page = d.get("items") or []
        pg = d.get("pagination") or {}
        if isinstance(pg.get("total"), int):
            totals.append(pg["total"])
        served_at = pg.get("offset", offset)
        pages += 1
        if served_at != offset:
            stop, failed_page = "OFFSET_NOT_HONOURED", {"offset": offset, "served_offset": served_at}
            log(f"{name}: asked offset={offset}, index served offset={served_at}; stopping with {len(items)}")
            break
        if not page:
            # confirm the end of list: an empty page that is empty twice
            try:
                _, _, body2 = get(url)
                again = json.loads(body2).get("items") or []
            except Exception as e:
                again, err = None, e
            if again is None:
                stop, failed_page = "PAGE_FAILED", {"offset": offset, "error": type(err).__name__, "at": "end-of-list confirmation"}
            elif again:
                stop, failed_page = "END_NOT_CONFIRMED", {"offset": offset, "second_read_items": len(again)}
            else:
                stop, empty_at = "EMPTY_PAGE", offset
            break
        items.extend(page)
        offset += limit
        if pages >= 10 + 3 * ((max(totals) if totals else 0) // max(1, limit) + 1):
            stop = "PAGE_GUARD"
            log(f"{name}: {pages} pages without an empty page; stopping with {len(items)}")
            break
        time.sleep(sleep)
    reported = totals[-1] if totals else None
    floor = int(max(totals) * (1 - SERVED_VS_REPORTED_TOL)) if totals else None
    complete = stop == "EMPTY_PAGE" and bool(totals) and len(items) >= floor
    distinct = len({str(it.get("resource") or "").strip() for it in items if isinstance(it, dict)})
    meta = {"resources": len(items), "reported_total": reported, "complete": complete,
            "walk": {"stop": stop, "page_limit": limit, "pages": pages, "empty_page_offset": empty_at,
                     "reported_total_first": totals[0] if totals else None,
                     "reported_total_max": max(totals) if totals else None, "reported_total_last": reported,
                     "served_minus_reported": (len(items) - reported) if reported is not None else None,
                     "served_floor": floor, "served_floor_rule": f"served >= (1 - {SERVED_VS_REPORTED_TOL}) x reported_total_max",
                     "distinct_resource_urls": distinct, "page_retries": n_retries, "failed_page": failed_page}}
    log(f"{name}: {len(items)} resources over {pages} pages (stop {stop}), index reports total={reported}, complete={complete}")
    return items, meta


def probe(host, url):
    row = {"host": host, "probe_url": url}
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                status, headers, body = r.status, dict(r.headers), r.read()
        except urllib.error.HTTPError as e:
            status, headers, body = e.code, dict(e.headers), e.read()
    except Exception as e:  # DNS, TLS, timeout, refused
        row.update(status=None, error=type(e).__name__, conformant=False)
        return row
    h = {k.lower(): v for k, v in headers.items()}
    row["status"] = status
    hdr = None
    if h.get("payment-required"):
        try:
            hdr = json.loads(base64.b64decode(h["payment-required"]))
        except Exception:
            hdr = None
    try:
        bod = json.loads(body.decode() or "null")
    except Exception:
        bod = None
    if not isinstance(bod, dict):
        bod = {}
    if not isinstance(hdr, dict):
        hdr = {}
    if not bod and not hdr:
        row["conformant"] = False
        return row
    accepts = bod.get("accepts") or hdr.get("accepts") or []
    row.update(payment_required_header=bool(h.get("payment-required")),
               x402_version=bod.get("x402Version"), has_accepts=bool(accepts),
               has_bazaar_extension=isinstance((bod.get("extensions") or {}).get("bazaar"), dict),
               header_x402_version=hdr.get("x402Version") if hdr else None,
               header_has_bazaar_extension=isinstance((hdr.get("extensions") or {}).get("bazaar"), dict) if hdr else None)
    if accepts and isinstance(accepts[0], dict):
        a = accepts[0]
        row.update(scheme=a.get("scheme"), network=a.get("network"),
                   amount=str(a.get("amount") or a.get("maxAmountRequired") or ""))
    row["conformant"] = bool(status == 402 and row["payment_required_header"] and row["x402_version"] == 2
                             and row["has_bazaar_extension"])
    return row


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--date", default=time.strftime("%Y-%m-%d", time.gmtime()))
    ap.add_argument("--previous")
    ap.add_argument("--max-hosts", type=int, default=0)
    a = ap.parse_args()
    out = Path(a.out_dir); snaps = out / "snapshots"; snaps.mkdir(parents=True, exist_ok=True)
    snap = snaps / f"conformance-{a.date}.jsonl"
    done = snaps / f"conformance-{a.date}.done"
    def log(m): print(f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())} {m}", file=sys.stderr, flush=True)
    if done.exists() and not a.max_hosts:
        log(f"already done for {a.date}: {snap}"); return 0

    t0 = time.time()
    cdp, cdp_meta = enumerate_index("cdp", CDP, 100, log)
    payai, payai_meta = enumerate_index("payai", PAYAI, 1000, log)
    hosts, noscheme = {}, {"cdp": 0, "payai": 0}
    for name, items in (("cdp", cdp), ("payai", payai)):
        for it in items:
            res = str(it.get("resource") or "").strip()
            if not res:
                continue
            flag = not res.startswith("http")
            if flag:  # a listed host without a scheme is still a listed host (the snapshot kept 761 of them)
                noscheme[name] += 1
                res = "https://" + res
            host = urllib.parse.urlparse(res).netloc.lower()
            if not host or " " in host:
                continue
            e = hosts.setdefault(host, {"probe_url": res, "indexes": [], "listed_without_scheme": flag})
            if name not in e["indexes"]:
                e["indexes"].append(name)
    order = sorted(hosts)
    # Failed enumeration cannot establish an absent host or complete daily run.
    partial = not (cdp_meta.get("complete") is True and payai_meta.get("complete") is True)
    if a.max_hosts and len(order) > a.max_hosts:
        order = order[: a.max_hosts]; partial = True
    log(f"{len(hosts)} distinct hosts; probing {len(order)} at {CONCURRENCY} concurrent, {TIMEOUT}s timeout")

    rows = []
    with cf.ThreadPoolExecutor(CONCURRENCY) as ex:
        futs = {ex.submit(probe, h, hosts[h]["probe_url"]): h for h in order}
        for i, f in enumerate(cf.as_completed(futs), 1):
            r = f.result(); r["indexes"] = hosts[r["host"]]["indexes"]
            if hosts[r["host"]]["listed_without_scheme"]:
                r["listed_without_scheme"] = True
            rows.append(r)
            if i % 500 == 0:
                log(f"  probed {i}/{len(order)}")
    rows.sort(key=lambda r: r["host"])
    tmp = snap.with_suffix(".jsonl.tmp")
    with tmp.open("w") as fh:
        for r in rows:
            fh.write(json.dumps(r) + "\n")
    os.replace(tmp, snap)

    conf = [r for r in rows if r["conformant"]]
    by_index = {}
    for key, pred in (("cdp", lambda r: r["indexes"] == ["cdp"]), ("payai", lambda r: r["indexes"] == ["payai"]),
                      ("cdp+payai", lambda r: len(r["indexes"]) == 2)):
        sub = [r for r in rows if pred(r)]
        by_index[key] = {"hosts": len(sub), "conformant": sum(r["conformant"] for r in sub)}
    status_dist = {}
    for r in rows:
        status_dist[str(r.get("status"))] = status_dist.get(str(r.get("status")), 0) + 1
    summary = {
        "schema": "csoai.x402-bazaar-conformance/0.2", "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "date": a.date, "producer": "scripts/census/x402-bazaar-conformance.py (councilof-ai) run on RunPod pod fpowppss5ngtkw",
        "method": ("One GET per DISTINCT HOST listed in either public x402 Bazaar (Coinbase CDP, PayAI), using the first "
                   "resource that index advertises for that host. Conformant = HTTP 402 AND a PAYMENT-REQUIRED response "
                   "header AND x402Version 2 in the body AND an extensions.bazaar block. Identifiable UA, 12s timeout, "
                   "24 concurrent. Nothing signed, nothing paid, no door settled."),
        "indexes": {"cdp": cdp_meta, "payai": payai_meta}, "enumeration_rule": ENUMERATION_RULE,
        "resources_listed_without_scheme": noscheme,
        "hosts_distinct": len(hosts), "hosts_probed": len(rows), "partial": partial,
        "rule_note": ("x402_version and has_bazaar_extension are read from the BODY, as the 2026-09-05 snapshot did; "
                      "header_x402_version / header_has_bazaar_extension carry the PAYMENT-REQUIRED header's own reading. "
                      "header_v2_bazaar_not_body counts doors that pass in the header only."),
        "header_v2_bazaar_not_body": sum(1 for r in rows if r.get("status") == 402 and r.get("header_x402_version") == 2
                                         and r.get("header_has_bazaar_extension") and not r["conformant"]),
        "headline": {"conformant": len(conf), "conformant_pct": round(100 * len(conf) / max(1, len(rows)), 2),
                     "answered_402": sum(1 for r in rows if r.get("status") == 402),
                     "unreachable": sum(1 for r in rows if r.get("status") is None),
                     "carried_payment_required_header": sum(1 for r in rows if r.get("payment_required_header")),
                     "x402_version_2": sum(1 for r in rows if r.get("x402_version") == 2),
                     "carried_bazaar_extension": sum(1 for r in rows if r.get("has_bazaar_extension"))},
        "by_index": by_index, "status_distribution": dict(sorted(status_dist.items(), key=lambda kv: -kv[1])),
        "elapsed_s": round(time.time() - t0, 1),
        "not": "a seller's honesty, product quality, price, or whether a door would deliver after payment. Measurement, not certification.",
    }
    (out / f"summary-{a.date}.json").write_text(json.dumps(summary, indent=2))

    # ---- diff vs the previous snapshot -----------------------------------------------------------------
    prev_path = a.previous
    if not prev_path:
        earlier = sorted(p for p in snaps.glob("conformance-*.jsonl") if p.stem < f"conformance-{a.date}")
        prev_path = str(earlier[-1]) if earlier else HUB_PREV
    try:
        raw = (urllib.request.urlopen(urllib.request.Request(prev_path, headers={"User-Agent": UA}), timeout=60).read().decode()
               if prev_path.startswith("http") else Path(prev_path).read_text())
        prev = {json.loads(l)["host"]: json.loads(l) for l in raw.splitlines() if l.strip()}
    except Exception as e:
        prev = None; log(f"previous snapshot unreadable ({prev_path}): {type(e).__name__}")
    if prev is None:
        diff = {"date": a.date, "previous": prev_path, "status": "UNCHECKABLE", "reason": "previous snapshot unreadable"}
    else:
        cur = {r["host"]: r for r in rows}
        added = sorted(set(cur) - set(prev)); dropped = sorted(set(prev) - set(cur))
        if partial:
            dropped = []  # a partial probe cannot say a host left the indexes
        newly_conf = sorted(h for h in cur if h in prev and cur[h]["conformant"] and not prev[h].get("conformant"))
        lost_conf = sorted(h for h in cur if h in prev and prev[h].get("conformant") and not cur[h]["conformant"])
        price = []
        for h in cur:
            p, c = prev.get(h), cur[h]
            if p and p.get("amount") and c.get("amount") and p["amount"] != c["amount"] and p.get("network") == c.get("network"):
                price.append({"host": h, "network": c.get("network"), "was": p["amount"], "now": c["amount"]})
        diff = {"schema": "csoai.x402-bazaar-conformance.diff/0.1", "date": a.date, "previous": prev_path,
                "previous_hosts": len(prev), "current_hosts": len(cur), "partial": partial,
                "hosts_added": len(added), "hosts_dropped": len(dropped),
                "conformant_previous": sum(1 for r in prev.values() if r.get("conformant")), "conformant_now": len(conf),
                "newly_conformant": len(newly_conf), "lost_conformance": len(lost_conf), "price_drift": len(price),
                "detail": {"hosts_added": added[:500], "hosts_dropped": dropped[:500], "newly_conformant": newly_conf,
                           "lost_conformance": lost_conf, "price_drift": price}}
    (out / f"diff-{a.date}.json").write_text(json.dumps(diff, indent=2))
    if not partial:
        done.write_text(summary["as_of"])
    log(f"done: hosts={len(rows)} conformant={len(conf)} ({summary['headline']['conformant_pct']}%) "
        f"unreachable={summary['headline']['unreachable']} added={diff.get('hosts_added')} dropped={diff.get('hosts_dropped')} "
        f"price_drift={diff.get('price_drift')} elapsed={summary['elapsed_s']}s -> {snap}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
