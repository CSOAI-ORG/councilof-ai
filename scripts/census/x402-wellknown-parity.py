#!/usr/bin/env python3
"""x402 domain-discovery parity: do the discovery documents a host publishes agree with the 402 it serves?

MEASURES only. Population: the distinct hosts in one published, signed x402 Bazaar conformance snapshot
(csoai/x402-bazaar-conformance snapshots/conformance-<date>.jsonl). Per host it sends at most:
  GET https://<host>/.well-known/x402         (draft-hawkins-x402-dns-discovery-03)
  GET https://<host>/.well-known/x402.json    (x402-foundation/wg-domain-discovery PR #4)
  one DNS-over-HTTPS TXT query for _x402.<host>  (draft-hawkins-x402-dns-discovery-03)
  GET <probe_url> from the snapshot, only when a well-known answered with a JSON document
No POST, no credential, no payment, no redirect followed. >= 1 s between requests to one host.

Per path the fetch state is PRESENT_JSON | NOT_JSON (200 with a body that is not a JSON object, e.g. an SPA
page) | ABSENT (404/410) | REDIRECT | OTHER_STATUS | ERROR. Where a JSON document and a live 402 with
payment requirements both exist, two dimensions are compared and never merged:
  X402_VERSION  document x402Version vs the live x402Version (body, else PAYMENT-REQUIRED header)
  PAY_TO        recipient values named in the document vs the live accepts[].payTo
  CONSISTENT (both speak, agree) | INCONSISTENT (both speak, disagree; both quoted) |
  SINGLE_SURFACE (only one speaks) | UNCHECKABLE (reason).
It never says which side is right, and it says nothing about a seller's honesty or a door's delivery.

    python3 x402-wellknown-parity.py SNAPSHOT.jsonl OUTDIR [--limit N] [--workers N]
"""
import base64, json, os, re, sys, time, threading, hashlib, datetime
from concurrent.futures import ThreadPoolExecutor

UA = "CSOAI-x402-discovery-probe/0.1 (+https://councilof.ai; nicholas@csoai.org)"
PATHS = ("/.well-known/x402", "/.well-known/x402.json")
PAYTO_KEY = re.compile(r"^(pay_?to|payee|recipient|recipient_?address|receiver|pay_?to_?address)$", re.I)
TIMEOUT = 10


def classify_fetch(status, body, ctype=""):
    """Fetch state for one well-known path. Pure: the unit tests call it directly."""
    if status is None:
        return "ERROR", None
    if status in (404, 410):
        return "ABSENT", None
    if 300 <= status < 400:
        return "REDIRECT", None
    if status != 200:
        return "OTHER_STATUS", None
    try:
        doc = json.loads(body)
    except Exception:
        return "NOT_JSON", None
    if not isinstance(doc, dict):
        return "NOT_JSON", None
    return "PRESENT_JSON", doc


def doc_payto(doc):
    """Every string value under a recipient-named key, anywhere in the document (EVM hex lower-cased)."""
    out = set()
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if isinstance(v, str) and PAYTO_KEY.match(str(k)) and v.strip():
                    out.add(norm_addr(v))
                walk(v)
        elif isinstance(o, list):
            for v in o[:500]:
                walk(v)
    walk(doc)
    return out


def norm_addr(a):
    a = a.strip()
    return a.lower() if re.fullmatch(r"0x[0-9a-fA-F]{40}", a) else a


def doc_version(doc):
    v = doc.get("x402Version") if isinstance(doc, dict) else None
    return v if isinstance(v, int) and not isinstance(v, bool) else None


def live_reading(status, headers, body):
    """(x402Version, set(payTo)) from a live answer; (None, set()) when it is not a 402 with requirements."""
    if status != 402:
        return None, set(), "LIVE_NOT_402"
    reqs = None
    try:
        reqs = json.loads(body)
    except Exception:
        reqs = None
    hdr = None
    for k, v in (headers or {}).items():
        if k.lower() == "payment-required":
            try:
                hdr = json.loads(base64.b64decode(v + "=" * (-len(v) % 4)))
            except Exception:
                hdr = None
    src = reqs if isinstance(reqs, dict) and reqs.get("accepts") else hdr
    if not isinstance(src, dict):
        return None, set(), "LIVE_NO_REQUIREMENTS"
    ver = src.get("x402Version") if isinstance(src.get("x402Version"), int) else None
    pay = {norm_addr(a["payTo"]) for a in (src.get("accepts") or []) if isinstance(a, dict) and isinstance(a.get("payTo"), str)}
    return ver, pay, None


def compare(doc, live_ver, live_pay, live_reason):
    out = {}
    dv = doc_version(doc)
    if live_reason:
        out["X402_VERSION"] = {"state": "UNCHECKABLE", "reason": live_reason, "document": dv}
        out["PAY_TO"] = {"state": "UNCHECKABLE", "reason": live_reason}
        return out
    if dv is None and live_ver is None:
        out["X402_VERSION"] = {"state": "UNCHECKABLE", "reason": "NEITHER_STATES_VERSION"}
    elif dv is None or live_ver is None:
        out["X402_VERSION"] = {"state": "SINGLE_SURFACE", "document": dv, "live": live_ver}
    else:
        out["X402_VERSION"] = {"state": "CONSISTENT" if dv == live_ver else "INCONSISTENT", "document": dv, "live": live_ver}
    dp = doc_payto(doc)
    if not dp and not live_pay:
        out["PAY_TO"] = {"state": "UNCHECKABLE", "reason": "NEITHER_NAMES_RECIPIENT"}
    elif not dp or not live_pay:
        out["PAY_TO"] = {"state": "SINGLE_SURFACE", "document": sorted(dp)[:5], "live": sorted(live_pay)[:5]}
    else:
        out["PAY_TO"] = {"state": "CONSISTENT" if dp & live_pay else "INCONSISTENT",
                         "document": sorted(dp)[:5], "live": sorted(live_pay)[:5]}
    return out


_host_last = {}
_lock = threading.Lock()


def polite_get(sess, host, url):
    with _lock:
        wait = _host_last.get(host, 0) + 1.0 - time.time()
    if wait > 0:
        time.sleep(wait)
    try:
        r = sess.get(url, timeout=TIMEOUT, allow_redirects=False, headers={"User-Agent": UA, "Accept": "application/json"})
        body = r.content[:262144].decode("utf-8", "replace")
        return r.status_code, dict(r.headers), body
    except Exception as e:
        return None, {}, type(e).__name__
    finally:
        with _lock:
            _host_last[host] = time.time()


def txt(sess, host):
    try:
        r = sess.get("https://cloudflare-dns.com/dns-query", params={"name": "_x402." + host, "type": "TXT"},
                     headers={"accept": "application/dns-json", "User-Agent": UA}, timeout=TIMEOUT)
        j = r.json()
        ans = [a.get("data", "") for a in j.get("Answer", []) if a.get("type") == 16]
        rec = [a for a in ans if "v=x402" in a.replace('" "', "").replace('"', "")]
        if rec:
            return "PRESENT", rec[:2]
        return ("ABSENT", None) if j.get("Status") in (0, 3) else ("ERROR", None)
    except Exception as e:
        return "ERROR", None


def probe(row):
    import requests
    s = requests.Session()
    host = row["host"]
    out = {"host": host, "indexes": row.get("indexes"), "snapshot_status": row.get("status")}
    docs = {}
    for p in PATHS:
        st, hd, body = polite_get(s, host, "https://" + host + p)
        state, doc = classify_fetch(st, body)
        out[p] = {"state": state, "http_status": st}
        if doc is not None:
            out[p]["sha256"] = hashlib.sha256(body.encode()).hexdigest()
            docs[p] = doc
    out["dns_txt"], rec = txt(s, host)
    if rec:
        out["dns_txt_record"] = rec
    if docs and row.get("probe_url"):
        st, hd, body = polite_get(s, host, row["probe_url"])
        lv, lp, why = live_reading(st, hd, body)
        out["live"] = {"http_status": st, "x402Version": lv, "payTo": sorted(lp)[:5], "reason": why}
        out["parity"] = {p: compare(d, lv, lp, why) for p, d in docs.items()}
    return out


def main(argv):
    if len(argv) < 2:
        print(__doc__); return 2
    snap, outdir = argv[0], argv[1]
    limit = int(argv[argv.index("--limit") + 1]) if "--limit" in argv else None
    workers = int(argv[argv.index("--workers") + 1]) if "--workers" in argv else 16
    rows = [json.loads(l) for l in open(snap)]
    if limit:
        rows = rows[:limit]
    os.makedirs(outdir, exist_ok=True)
    started = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with ThreadPoolExecutor(workers) as ex:
        res = list(ex.map(probe, rows))
    finished = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rp = os.path.join(outdir, "results.jsonl")
    with open(rp, "w") as f:
        for r in sorted(res, key=lambda r: r["host"]):
            f.write(json.dumps(r, sort_keys=True, ensure_ascii=False) + "\n")
    from collections import Counter
    summ = {"schema": "csoai.x402-wellknown-parity/0.1", "started": started, "finished": finished,
            "population": {"snapshot": os.path.basename(snap), "snapshot_sha256": hashlib.sha256(open(snap, "rb").read()).hexdigest(),
                           "hosts": len(rows)},
            "fetch_states": {p: dict(Counter(r[p]["state"] for r in res)) for p in PATHS},
            "dns_txt": dict(Counter(r["dns_txt"] for r in res)),
            "any_json_document": sum(1 for r in res if any(r[p]["state"] == "PRESENT_JSON" for p in PATHS)),
            "both_paths_json": sum(1 for r in res if all(r[p]["state"] == "PRESENT_JSON" for p in PATHS)),
            "parity": {}, "results_sha256": hashlib.sha256(open(rp, "rb").read()).hexdigest(),
            "never_sent": ["POST", "any credential", "any payment", "a followed redirect"],
            "not": "a seller's honesty, a door's delivery, or which of two disagreeing statements is right. Measurement, not certification."}
    for p in PATHS:
        for dim in ("X402_VERSION", "PAY_TO"):
            summ["parity"][p + " " + dim] = dict(Counter(r["parity"][p][dim]["state"] for r in res if "parity" in r and p in r["parity"]))
    summ["hosts_with_any_inconsistent"] = sum(1 for r in res if "parity" in r and any(
        d["state"] == "INCONSISTENT" for pp in r["parity"].values() for d in pp.values()))
    json.dump(summ, open(os.path.join(outdir, "summary.json"), "w"), indent=1, sort_keys=True)
    print(json.dumps(summ, indent=1, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
