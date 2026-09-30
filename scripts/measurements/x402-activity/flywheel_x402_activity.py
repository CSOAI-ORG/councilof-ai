#!/usr/bin/env python3
"""Wash-adjusted x402 activity: who actually paid the doors the two public x402 Bazaars list, on one UTC day.

    flywheel_x402_activity.py [--day YYYY-MM-DD] [--out-dir DIR] [--no-sign] [--max-blocks N]

Added 2026-09-26 beside flywheel_x402.py (the x402-daily conformance job); called at the end of that job.
It never changes the conformance run's result, and it publishes nothing: it writes a dated record,
its rows, a board signature and a pending OpenTimestamps proof under /evac-bulk/flywheel/x402-activity/<day>/.

METHOD (csoai.x402-activity/0.1). Every step is public data; nothing is paid, signed by a payer or probed.
  1. Population of payees. Walk both public x402 Bazaar discovery indexes (Coinbase CDP, PayAI) to their
     stated totals with the conformance job's own pinned enumerator. Keep every `accepts[]` entry with
     scheme "exact", network Base mainnet ("base" or "eip155:8453") and asset = native USDC on Base
     (0x8335...2913). Its payTo is a LISTED PAYEE; the smallest amount any listing asks of that payee is its
     SMALLEST LISTED PRICE. Entries on any other network/asset/scheme are counted and reported UNMEASURED.
  2. Window. One complete UTC day: first Base block with timestamp >= day 00:00:00Z to the last block with
     timestamp < next day 00:00:00Z (binary search over eth_getBlockByNumber).
  3. Candidate payments. Every USDC `Transfer(from, to, value)` log in the window whose `to` is a listed payee
     (eth_getLogs, topic filter, 2,000-block chunks, split on any error).
  4. Settlement test. A candidate counts as an x402-style SETTLEMENT only if the same transaction carries a USDC
     `AuthorizationUsed(authorizer, nonce)` log whose authorizer == the transfer's `from` (EIP-3009
     transferWithAuthorization - the path the x402 "exact" scheme uses for USDC on EVM). Other inbound
     transfers are counted as NOT_EIP3009 and excluded.
  5. Classes, first match wins (structural facts about addresses and amounts; none states intent):
        SELF_SAME_ADDRESS        payer == payee
        SELF_SAME_LISTING        payer is another payee listed by a host that also lists this payee
        ESTATE_SELF              payer or payee is a wallet CSOAI declares its own (ESTATE_WALLETS below)
        PAYER_IS_LISTED_PAYEE    payer is itself a listed payee anywhere in either Bazaar
        ZERO_VALUE               value == 0
        BELOW_SMALLEST_PRICE     0 < value < the payee's smallest listed price
        EXTERNAL                 everything else
     Orthogonal flags on every settlement: REPEAT_PAIR (the payer paid this payee >= 2 times in the window) and
     HIGH_FREQUENCY_PAIR (>= 100 times).
  6. Headline. distinct_external_payers = distinct `from` addresses with >= 1 EXTERNAL settlement.
     external_share = EXTERNAL settlements (and USDC) / all settlements (and USDC).

UNCHECKABLE from public chain data (reported as such, never estimated): common control of payer and payee
through different addresses; whether a service was delivered; whether a human, an agent or a script paid;
whether a given EIP-3009 transfer answered an x402 challenge rather than another EIP-3009 flow; payees not
listed in either Bazaar. Not measured in this record: every network other than Base mainnet.
"""
import argparse, collections, datetime as dt, gzip, hashlib, importlib.util, json, os, pathlib, sys, time
import urllib.error, urllib.request

HERE = pathlib.Path(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, str(HERE))

SCHEMA = "csoai.x402-activity/0.1"
UA = "csoai-x402-activity/0.1 (+https://councilof.ai/measurements/x402-activity/)"
RPCS = ["https://mainnet.base.org", "https://base.drpc.org"]
USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
T_TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
T_AUTH_USED = "0x98de503528ee59b575ef0c0a2576a82497bfc029a5685b209e9ec333479b10a5"  # AuthorizationUsed(address,bytes32)
BASE_NETS = {"base", "eip155:8453"}
CHUNK, TOPIC_BATCH = 2000, 1000
HIGH_FREQ = 100
CLASSES = ["SELF_SAME_ADDRESS", "SELF_SAME_LISTING", "ESTATE_SELF", "PAYER_IS_LISTED_PAYEE", "ZERO_VALUE",
           "BELOW_SMALLEST_PRICE", "EXTERNAL"]
# Wallets CSOAI declares its own. Source for each is public: the payTo and the test wallet are in
# functions/api/_x402_config.ts and functions/api/_x402.ts (KNOWN_INTERNAL_X402_WALLETS) on councilof.ai's repo;
# the settle-loop payer is the burner CSOAI generated on 2026-09-22 for its own door settlements.
ESTATE_WALLETS = {
    "0x212686404a7d1e1fd88f35ed6200c3af7a78ae31": "CSOAI x402 payTo (ESTATE_PAY_TO)",
    "0x6ea00613c15f2463bc10c7188215c4fa6f4943c6": "CSOAI self-test payer (KNOWN_INTERNAL_X402_WALLETS)",
    "0x38c13f2642d23fca4a0a1877cea09e9a84d406f0": "CSOAI settle-loop payer (burner, generated 2026-09-22)",
}


def utcnow():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def sha(b):
    return hashlib.sha256(b).hexdigest()


class RPC:
    def __init__(self, urls):
        self.urls, self.calls, self.errors = urls, 0, collections.Counter()

    def call(self, method, params, tries=6):
        last = None
        for i in range(tries):
            url = self.urls[0] if i < tries - 1 else self.urls[-1]
            body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
            req = urllib.request.Request(url, data=body, headers={"content-type": "application/json", "user-agent": UA})
            self.calls += 1
            try:
                r = json.load(urllib.request.urlopen(req, timeout=90))
            except urllib.error.HTTPError as e:
                txt = e.read()[:300].decode("utf-8", "replace")
                r = {"error": {"code": e.code, "message": txt}}
            except Exception as e:
                r = {"error": {"code": -1, "message": f"{type(e).__name__}: {e}"}}
            if "error" not in r:
                return r["result"]
            last = r["error"]; msg = str(last.get("message", ""))
            self.errors[str(last.get("code"))] += 1
            low = msg.lower()
            if ("range" in low or "too many" in low or "limit" in low) and "rate" not in low:
                raise ValueError(msg)  # caller splits the range
            time.sleep(min(30, 1.5 * 2 ** i))
        raise RuntimeError(f"RPC {method} failed after {tries} tries: {last}")

    def block_ts(self, n):
        return int(self.call("eth_getBlockByNumber", [hex(n), False])["timestamp"], 16)

    def first_block_at_or_after(self, ts, lo, hi):
        while lo < hi:
            mid = (lo + hi) // 2
            if self.block_ts(mid) < ts:
                lo = mid + 1
            else:
                hi = mid
        return lo

    def logs(self, topics, a, b, out):
        """All USDC logs for `topics` in [a, b]; splits the range in two on any size/range error."""
        try:
            res = self.call("eth_getLogs", [{"address": USDC, "fromBlock": hex(a), "toBlock": hex(b), "topics": topics}])
        except ValueError:
            if a == b:
                raise
            m = (a + b) // 2
            self.logs(topics, a, m, out); self.logs(topics, m + 1, b, out)
            return
        out.extend(res)


def pad(addr):
    return "0x" + "0" * 24 + addr[2:].lower()


def unpad(topic):
    return "0x" + topic[-40:].lower()


def load_enumerator():
    p = HERE / "bin" / "x402-bazaar-conformance.py"
    spec = importlib.util.spec_from_file_location("x402_bazaar_conformance", p)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m, sha(p.read_bytes())


def payee_population(log):
    m, producer_sha = load_enumerator()
    attempts = []
    for attempt in range(3):  # a live index can shift under offset paging; a short read is retried, never passed off as complete
        cdp, cdp_meta = m.enumerate_index("cdp", m.CDP, 100, log)
        payai, payai_meta = m.enumerate_index("payai", m.PAYAI, 1000, log)
        attempts.append({"cdp": cdp_meta, "payai": payai_meta})
        if cdp_meta.get("complete") is True and payai_meta.get("complete") is True:
            break
        time.sleep(60)
    payees, other = {}, collections.Counter()
    host_payees = collections.defaultdict(set)
    n_resources = 0
    for name, items in (("cdp", cdp), ("payai", payai)):
        for it in items:
            n_resources += 1
            res = str(it.get("resource") or "").strip()
            host = res.split("://", 1)[-1].split("/", 1)[0].lower()
            for a in it.get("accepts") or []:
                if not isinstance(a, dict):
                    continue
                net, asset, scheme = str(a.get("network") or ""), str(a.get("asset") or "").lower(), a.get("scheme")
                pt = str(a.get("payTo") or "").lower()
                if net in BASE_NETS and asset == USDC and scheme == "exact" and len(pt) == 42 and pt.startswith("0x"):
                    try:
                        amt = int(a.get("amount") or a.get("maxAmountRequired") or 0)
                    except (TypeError, ValueError):
                        amt = 0
                    e = payees.setdefault(pt, {"min_listed_atomic": None, "hosts": set(), "indexes": set()})
                    if amt > 0 and (e["min_listed_atomic"] is None or amt < e["min_listed_atomic"]):
                        e["min_listed_atomic"] = amt
                    e["hosts"].add(host); e["indexes"].add(name); host_payees[host].add(pt)
                else:
                    other[f"{net or '?'}|{'usdc-base' if asset == USDC else 'other-asset'}|{scheme}"] += 1
    siblings = collections.defaultdict(set)  # payee -> other payees listed by any host that lists it
    for host, pts in host_payees.items():
        for p in pts:
            siblings[p] |= pts - {p}
    meta = {"cdp": cdp_meta, "payai": payai_meta, "resources_read": n_resources, "read_attempts": len(attempts),
            "complete": cdp_meta.get("complete") is True and payai_meta.get("complete") is True,
            "enumerator": {"file": "bin/x402-bazaar-conformance.py (enumerate_index, pinned)", "sha256": producer_sha}}
    return payees, siblings, other, meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--day", default=(dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=1)).isoformat())
    ap.add_argument("--out-dir", default="/evac-bulk/flywheel/x402-activity")
    ap.add_argument("--no-sign", action="store_true")
    ap.add_argument("--max-blocks", type=int, default=0, help="smoke only: cap the window; the record is then PARTIAL")
    a = ap.parse_args()
    day = dt.date.fromisoformat(a.day)
    out = pathlib.Path(a.out_dir) / day.isoformat(); out.mkdir(parents=True, exist_ok=True)
    rec_p = out / f"x402-activity-{day}.json"
    if rec_p.exists() and (out / f"x402-activity-{day}.signed.json").exists():
        return {"result": "ALREADY_DONE_FOR_DAY", "rc": 0, "day": day.isoformat()}

    def log(msg):
        print(f"{utcnow()} {msg}", file=sys.stderr, flush=True)

    started = utcnow()
    payees, siblings, other, pop_meta = payee_population(log)
    if not pop_meta["complete"]:
        return {"result": "FAILED_PARTIAL_BAZAAR_READ", "rc": 1, "population": pop_meta}
    log(f"{len(payees)} listed Base-USDC payees")

    rpc = RPC(RPCS)
    t0 = int(dt.datetime(day.year, day.month, day.day, tzinfo=dt.timezone.utc).timestamp()); t1 = t0 + 86400
    head = int(rpc.call("eth_blockNumber", []), 16)
    if rpc.block_ts(head) < t1:
        return {"result": "FAILED_DAY_NOT_COMPLETE_ON_CHAIN", "rc": 1, "day": day.isoformat()}
    guess = head - (rpc.block_ts(head) - t0) // 2
    b0 = rpc.first_block_at_or_after(t0, max(0, guess - 3000), guess + 3000)
    b1 = rpc.first_block_at_or_after(t1, b0, min(head, b0 + 43200 + 3000)) - 1
    if rpc.block_ts(b0) < t0 or rpc.block_ts(b0 - 1) >= t0 or rpc.block_ts(b1) >= t1 or rpc.block_ts(b1 + 1) < t1:
        return {"result": "FAILED_WINDOW_BOUNDARY_CHECK", "rc": 1}
    partial = False
    if a.max_blocks and b1 - b0 + 1 > a.max_blocks:
        b1 = b0 + a.max_blocks - 1; partial = True
    log(f"window blocks {b0}..{b1} ({b1 - b0 + 1} blocks)")

    plist = sorted(payees)
    transfers = []
    for i in range(0, len(plist), TOPIC_BATCH):
        topics = [T_TRANSFER, None, [pad(p) for p in plist[i:i + TOPIC_BATCH]]]
        for s in range(b0, b1 + 1, CHUNK):
            rpc.logs(topics, s, min(b1, s + CHUNK - 1), transfers)
        log(f"transfers: payee batch {i // TOPIC_BATCH + 1}, {len(transfers)} logs so far")
    seen, tr = set(), []
    for lg in transfers:
        k = (lg["transactionHash"], lg["logIndex"])
        if k in seen or lg.get("removed"):
            continue
        seen.add(k)
        tr.append({"tx": lg["transactionHash"], "log_index": int(lg["logIndex"], 16), "block": int(lg["blockNumber"], 16),
                   "from": unpad(lg["topics"][1]), "to": unpad(lg["topics"][2]), "value": int(lg["data"], 16)})
    payers = sorted({t["from"] for t in tr})
    auth = set()
    for i in range(0, len(payers), TOPIC_BATCH):
        got = []
        topics = [T_AUTH_USED, [pad(p) for p in payers[i:i + TOPIC_BATCH]]]
        for s in range(b0, b1 + 1, CHUNK):
            rpc.logs(topics, s, min(b1, s + CHUNK - 1), got)
        auth |= {(g["transactionHash"], unpad(g["topics"][1])) for g in got if not g.get("removed")}
    log(f"{len(tr)} inbound transfers to listed payees; {len(auth)} AuthorizationUsed (tx, authorizer) pairs")

    all_payees = set(payees)
    rows, not_3009 = [], {"transfers": 0, "usdc_atomic": 0}
    for t in tr:
        if (t["tx"], t["from"]) not in auth:
            not_3009["transfers"] += 1; not_3009["usdc_atomic"] += t["value"]; continue
        f, to, v = t["from"], t["to"], t["value"]
        mn = payees[to]["min_listed_atomic"]
        if f == to:
            c = "SELF_SAME_ADDRESS"
        elif f in siblings.get(to, ()):
            c = "SELF_SAME_LISTING"
        elif f in ESTATE_WALLETS or to in ESTATE_WALLETS:
            c = "ESTATE_SELF"
        elif f in all_payees:
            c = "PAYER_IS_LISTED_PAYEE"
        elif v == 0:
            c = "ZERO_VALUE"
        elif mn is not None and v < mn:
            c = "BELOW_SMALLEST_PRICE"
        else:
            c = "EXTERNAL"
        rows.append({**t, "class": c})
    pair_n = collections.Counter((r["from"], r["to"]) for r in rows)
    for r in rows:
        n = pair_n[(r["from"], r["to"])]
        r["repeat_pair"] = n >= 2; r["high_frequency_pair"] = n >= HIGH_FREQ
    rows.sort(key=lambda r: (r["block"], r["log_index"]))

    def agg(rs):
        return {"settlements": len(rs), "usdc_atomic": sum(r["value"] for r in rs), "distinct_payers": len({r["from"] for r in rs}),
                "distinct_payees": len({r["to"] for r in rs})}
    by_class = {c: agg([r for r in rows if r["class"] == c]) for c in CLASSES}
    ext = [r for r in rows if r["class"] == "EXTERNAL"]
    tot = agg(rows)

    def share(n, d):
        return None if not d else round(n / d, 6)
    ext_val_by_payer = collections.Counter()
    for r in ext:
        ext_val_by_payer[r["from"]] += r["value"]
    top = [v for _, v in ext_val_by_payer.most_common(10)]
    ev = sum(r["value"] for r in ext)
    headline = {
        "settlements": tot["settlements"], "usdc_atomic": tot["usdc_atomic"], "distinct_payers": tot["distinct_payers"],
        "distinct_payees_paid": tot["distinct_payees"],
        "external_settlements": len(ext), "external_usdc_atomic": ev,
        "distinct_external_payers": len({r["from"] for r in ext}),
        "distinct_payees_with_external_payment": len({r["to"] for r in ext}),
        "external_share_of_settlements": share(len(ext), tot["settlements"]),
        "external_share_of_usdc": share(ev, tot["usdc_atomic"]),
    }
    flags = {
        "repeat_pair": {"all": agg([r for r in rows if r["repeat_pair"]]), "external": agg([r for r in ext if r["repeat_pair"]])},
        "high_frequency_pair": {"threshold": HIGH_FREQ, "all": agg([r for r in rows if r["high_frequency_pair"]]),
                                "external": agg([r for r in ext if r["high_frequency_pair"]])},
        "external_one_settlement_payers": sum(1 for n in collections.Counter(r["from"] for r in ext).values() if n == 1),
    }
    concentration = {"top1_share_of_external_usdc": share(top[0], ev) if top else None,
                     "top10_share_of_external_usdc": share(sum(top), ev) if top else None}
    sensitivity = {f"external_payers_paying_at_least_{k}_usdc": len({r["from"] for r in ext if r["value"] >= thr})
                   for k, thr in (("0.01", 10_000), ("0.10", 100_000), ("1.00", 1_000_000))}

    rows_p = out / f"x402-activity-{day}.rows.jsonl.gz"
    raw_rows = "".join(json.dumps(r, sort_keys=True, separators=(",", ":")) + "\n" for r in rows).encode()
    with open(rows_p, "wb") as fh:
        fh.write(gzip.compress(raw_rows, mtime=0))
    payees_p = out / f"x402-activity-{day}.payees.jsonl.gz"
    raw_payees = "".join(json.dumps({"payee": p, "min_listed_atomic": e["min_listed_atomic"], "hosts": sorted(e["hosts"]),
                                     "indexes": sorted(e["indexes"])}, sort_keys=True, separators=(",", ":")) + "\n"
                         for p, e in sorted(payees.items())).encode()
    with open(payees_p, "wb") as fh:
        fh.write(gzip.compress(raw_payees, mtime=0))

    rec = {
        "schema": SCHEMA, "kind": "measurement.x402_activity", "day": day.isoformat(), "as_of": utcnow(), "started": started,
        "partial": partial,
        "publisher": "Council of AI (CSOAI), councilof.ai",
        "doctrine": "Measurement, not endorsement or accusation. No seller, payer or index is scored or named here. "
                    "Classes are structural facts about addresses and amounts; none states why anyone paid.",
        "question": "Of the USDC payments on Base mainnet that reached payees listed in the public x402 Bazaars on this UTC day, "
                    "how many came from distinct outside wallets, and how many from the payee itself, a sibling payee, "
                    "another listed payee, or an amount below any listed price?",
        "window": {"day_utc": day.isoformat(), "chain": "Base mainnet (chain id 8453)", "first_block": b0, "last_block": b1,
                   "blocks": b1 - b0 + 1, "boundary_check": "block(first-1).ts < day start <= block(first).ts; "
                   "block(last).ts < next day start <= block(last+1).ts"},
        "population": {"listed_base_usdc_payees": len(payees),
                       "listed_hosts_with_base_usdc_payee": len({h for e in payees.values() for h in e["hosts"]}),
                       "bazaar_read": pop_meta,
                       "accepts_entries_not_measured": dict(sorted(other.items(), key=lambda kv: -kv[1])),
                       "payees_file": {"path": payees_p.name, "sha256": sha(payees_p.read_bytes()), "rows": len(payees)}},
        "method": {
            "unit": "one USDC Transfer log to a listed payee, in a transaction that also carries a USDC AuthorizationUsed log "
                    "whose authorizer is the transfer's sender (EIP-3009 transferWithAuthorization)",
            "classes_first_match": {
                "SELF_SAME_ADDRESS": "payer == payee",
                "SELF_SAME_LISTING": "payer is another payee listed by a host that also lists this payee",
                "ESTATE_SELF": "payer or payee is a wallet CSOAI declares its own (estate_wallets)",
                "PAYER_IS_LISTED_PAYEE": "payer is itself a listed payee anywhere in either Bazaar",
                "ZERO_VALUE": "value == 0",
                "BELOW_SMALLEST_PRICE": "0 < value < the smallest price any Bazaar listing asks of this payee",
                "EXTERNAL": "none of the above"},
            "flags": {"repeat_pair": "the payer paid this payee >= 2 times in the window",
                      "high_frequency_pair": f"the payer paid this payee >= {HIGH_FREQ} times in the window"},
            "headline_rule": "distinct_external_payers = distinct senders with >= 1 EXTERNAL settlement",
            "estate_wallets": ESTATE_WALLETS,
            "rpc": {"endpoints": RPCS, "calls": rpc.calls, "errors_by_code": dict(rpc.errors),
                    "chunk_blocks": CHUNK, "topic_batch": TOPIC_BATCH},
            "code": {"file": "flywheel_x402_activity.py", "sha256": sha(pathlib.Path(__file__).read_bytes())},
        },
        "inbound_not_eip3009": not_3009,
        "headline": headline,
        "by_class": by_class,
        "flags": flags,
        "concentration": concentration,
        "sensitivity": sensitivity,
        "uncheckable": [
            "common control of payer and payee through different addresses (only same-address, same-listing and "
            "listed-payee links are observable)",
            "whether any service was delivered after payment",
            "whether a person, an agent or a script initiated a payment",
            "whether an EIP-3009 transfer answered an x402 challenge rather than another EIP-3009 flow",
            "payments to payees that neither Bazaar lists"],
        "not_measured": ["every network other than Base mainnet (see population.accepts_entries_not_measured)",
                         "facilitator identity (transaction sender) - not read",
                         "the x402 schemes other than exact (e.g. batch-settlement escrows)"],
        "rows_file": {"path": rows_p.name, "sha256": sha(rows_p.read_bytes()), "uncompressed_sha256": sha(raw_rows),
                      "rows": len(rows), "note": "one line per settlement: tx, log_index, block, from, to, value, class, flags"},
        "not_evidence_of": ["intent, wrongdoing or honesty of any seller, payer or facilitator",
                            "the quality or worth of any service", "endorsement, ranking or approval"],
        "verify": ("Re-run: read both Bazaars, rebuild the payee set (payees_file pins it), eth_getLogs USDC Transfer and "
                   "AuthorizationUsed over window.first_block..last_block, apply the classes in order; every settlement is a "
                   "line in rows_file (sha256 pinned). Signature: <record>.signed.json, canonical JSON (keys sorted, no "
                   "whitespace, UTF-8), Ed25519 under #board-attestation-1 in https://csoai.org/.well-known/did.json."),
        "objection_route": "https://councilof.ai/census/",
    }
    rec["finished"] = utcnow()
    tmp = rec_p.with_suffix(".tmp"); tmp.write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n"); os.replace(tmp, rec_p)
    res = {"result": "RECORDED_UNSIGNED" if a.no_sign or partial else "RECORDED", "rc": 0, "day": day.isoformat(),
           "record": str(rec_p), "record_sha256": sha(rec_p.read_bytes()), "headline": headline, "partial": partial}
    if a.no_sign or partial:
        return res
    import fwlib
    sig = fwlib.sign_file(rec_p, f"measurements/x402-activity/{day}/{rec_p.name}", SCHEMA, rec["as_of"],
                          {"kind": rec["kind"], "day": rec["day"], "headline": headline,
                           "rows_sha256": rec["rows_file"]["sha256"], "payees_sha256": rec["population"]["payees_file"]["sha256"]},
                          out / f"x402-activity-{day}.signed.json")
    side = fwlib.ots_stamp(rec_p, out / f"x402-activity-{day}.json.ots", out / f"x402-activity-{day}.ots.json")
    res.update(result="SIGNED_AND_STAMPED", signed_at=sig.get("signed_at"), ots_calendars=len(side["calendars_accepted"]))
    try:
        fwlib.status_update("x402-activity", last_run=started, result=res["result"], rc=0, finished_utc=utcnow(),
                            detail={"day": res["day"], "record_sha256": res["record_sha256"]})
        fwlib.log_line("x402-activity", rc=0, result=res["result"], day=res["day"])
    except Exception:
        pass
    return res


if __name__ == "__main__":
    try:
        r = main()
    except SystemExit as e:
        r = {"result": "FAILED_CLOSED", "rc": 1, "error": str(e)[:400]}
    except Exception as e:
        r = {"result": "FAILED_CLOSED", "rc": 1, "error": f"{type(e).__name__}: {str(e)[:400]}"}
    print(json.dumps(r, indent=1, default=str))
    sys.exit(r.get("rc", 1))
