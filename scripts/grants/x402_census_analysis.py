#!/usr/bin/env python3
"""Analysis artefacts for the x402 settlement census (Move B).

Reads the SETTLE and DRY census jsonl already on master and emits
  docs/product/x402-settlement-census-<date>.analysis.json
  docs/product/x402-settlement-census-<date>.analysis.md   (rendered from the json, never typed)

Every number in the .md is produced here. Nothing re-probes a host: the analysis is a pure
function of the committed jsonl rows, so `--check` can recompute it and fail if the committed
artefacts drift from the rows they claim to describe.

  python3 scripts/grants/x402_census_analysis.py            # (re)write both artefacts
  python3 scripts/grants/x402_census_analysis.py --check    # recompute; exit 1 if committed artefacts differ

Doctrine carried by the output (see CAVEATS): REFUSED is not proof of bad faith; one purchase per
host at one moment; self excluded; measurement, not certification. stdlib only, deterministic.
"""
import argparse
import hashlib
import json
import os
import sys
from collections import Counter, OrderedDict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCHEMA = "csoai.x402-settlement-census-analysis/0.1"
UNITS_PER_USDC = 1_000_000

# Verbatim from the census summary's what_this_is_not. Carried into the .md unchanged.
CAVEAT_REFUSED = ("REFUSED is not proof of bad faith: a host may rate-limit, require an account, "
                  "or have changed terms between the challenge and the retry.")
CAVEAT_ONE_MOMENT = ("One purchase per host, one moment. A single refusal is not a pattern; "
                     "the second round next week is what makes it one.")
CAVEATS = [CAVEAT_REFUSED, CAVEAT_ONE_MOMENT]

OUTCOMES = ["DELIVERED", "REFUSED", "MISMATCH", "NO_CHALLENGE"]


# ----------------------------------------------------------------------------- helpers
def read_jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def pct(part, whole, nd=1):
    return round(100.0 * part / whole, nd) if whole else None


def usdc(units):
    return round(units / UNITS_PER_USDC, 6)


def percentile(values, p):
    """Linear interpolation between closest ranks (the numpy default). None when empty."""
    xs = sorted(v for v in values if v is not None)
    if not xs:
        return None
    if len(xs) == 1:
        return round(xs[0], 3)
    pos = (len(xs) - 1) * p
    lo = int(pos)
    hi = min(lo + 1, len(xs) - 1)
    return round(xs[lo] + (xs[hi] - xs[lo]) * (pos - lo), 3)


def latency_block(values):
    xs = [v for v in values if v is not None]
    return OrderedDict(n=len(xs), median=percentile(xs, 0.5), p90=percentile(xs, 0.9), p95=percentile(xs, 0.95),
                       max=(round(max(xs), 3) if xs else None))


def gini(counts):
    """Gini of a list of positive counts (0 = every payee collects equally, 1 = one payee collects all)."""
    xs = sorted(counts)
    n = len(xs)
    total = sum(xs)
    if n == 0 or total == 0:
        return None
    weighted = sum((i + 1) * x for i, x in enumerate(xs))
    return round((2.0 * weighted) / (n * total) - (n + 1.0) / n, 4)


def hhi(counts):
    """Herfindahl-Hirschman index on shares, 0..10000."""
    total = sum(counts)
    if not total:
        return None
    return round(sum((c / total) ** 2 for c in counts) * 10000, 1)


def norm_addr(a):
    return a.lower() if isinstance(a, str) else a


def has_settle_hash(r):
    tx = r.get("settle_tx")
    return isinstance(tx, str) and tx.startswith("0x") and len(tx) == 66


def settle_receipt_kind(r):
    tx = r.get("settle_tx")
    if has_settle_hash(r):
        return "tx_hash"
    if tx:
        return "unparseable"
    return "none"


def response_shape(r):
    if not r.get("bytes"):
        return "empty_body"
    if r.get("body_json"):
        return "json_error"
    if "html" in (r.get("content_type") or "").lower():
        return "html"
    return "other"


def concentration(rows, label):
    """Beneficiary concentration among `rows`. Addresses compared case-insensitively (EIP-55 vs lowercase)."""
    with_payee = [r for r in rows if r.get("pay_to")]
    counts = Counter(norm_addr(r["pay_to"]) for r in with_payee)
    display = {}
    for r in with_payee:  # keep the first spelling seen, for display only
        display.setdefault(norm_addr(r["pay_to"]), r["pay_to"])
    ranked = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    n = len(with_payee)
    top3 = [OrderedDict(pay_to=display[a], hosts=c, share_pct=pct(c, n)) for a, c in ranked[:3]]
    return OrderedDict(
        population=label,
        rows=len(rows),
        rows_with_pay_to=n,
        distinct_pay_to=len(counts),
        distinct_pay_to_case_sensitive=len(set(r["pay_to"] for r in with_payee)),
        top3=top3,
        top3_share_pct=pct(sum(c for _, c in ranked[:3]), n),
        top1_share_pct=pct(ranked[0][1], n) if ranked else None,
        single_host_payees=sum(1 for _, c in ranked if c == 1),
        gini=gini(list(counts.values())),
        hhi=hhi(list(counts.values())),
    )


# ----------------------------------------------------------------------------- analysis
def analyse(settle_rows, dry_rows, inputs):
    n = len(settle_rows)
    by_status = Counter(r["status"] for r in settle_rows)
    delivered = [r for r in settle_rows if r["status"] == "DELIVERED"]
    refused = [r for r in settle_rows if r["status"] == "REFUSED"]
    mismatch = [r for r in settle_rows if r["status"] == "MISMATCH"]
    challenged = [r for r in settle_rows if r.get("challenge_units") is not None]

    # (1) outcomes
    outcomes = OrderedDict()
    for s in OUTCOMES:
        outcomes[s] = OrderedDict(hosts=by_status.get(s, 0), share_pct=pct(by_status.get(s, 0), n))
    unknown = sorted(set(by_status) - set(OUTCOMES))
    if unknown:
        outcomes["_unexpected_statuses"] = {s: by_status[s] for s in unknown}

    # (2) REFUSED reasons
    code_hist = OrderedDict()
    for code, c in sorted(Counter(r.get("paid_status") for r in refused).items(), key=lambda kv: (-kv[1], str(kv[0]))):
        code_hist[str(code)] = OrderedDict(hosts=c, share_of_refused_pct=pct(c, len(refused)))
    shape_hist = OrderedDict()
    for shape in ["empty_body", "json_error", "html", "other"]:
        c = sum(1 for r in refused if response_shape(r) == shape)
        shape_hist[shape] = OrderedDict(hosts=c, share_of_refused_pct=pct(c, len(refused)))
    code_x_shape = OrderedDict()
    for (code, shape), c in sorted(Counter((str(r.get("paid_status")), response_shape(r)) for r in refused).items(),
                                   key=lambda kv: (-kv[1], kv[0])):
        code_x_shape["%s/%s" % (code, shape)] = c
    refused_ct = OrderedDict()
    for ct, c in sorted(Counter((r.get("content_type") or "").lower() or "(none)" for r in refused).items(),
                        key=lambda kv: (-kv[1], kv[0])):
        refused_ct[ct] = c
    class_4xx = sum(1 for r in refused if isinstance(r.get("paid_status"), int) and 400 <= r["paid_status"] < 500)
    class_5xx = sum(1 for r in refused if isinstance(r.get("paid_status"), int) and 500 <= r["paid_status"] < 600)
    refused_block = OrderedDict(
        hosts=len(refused),
        by_paid_status=code_hist,
        by_class=OrderedDict(
            again_402=OrderedDict(hosts=sum(1 for r in refused if r.get("paid_status") == 402),
                                  share_of_refused_pct=pct(sum(1 for r in refused if r.get("paid_status") == 402), len(refused))),
            other_4xx=OrderedDict(hosts=class_4xx - sum(1 for r in refused if r.get("paid_status") == 402),
                                  share_of_refused_pct=pct(class_4xx - sum(1 for r in refused if r.get("paid_status") == 402), len(refused))),
            five_xx=OrderedDict(hosts=class_5xx, share_of_refused_pct=pct(class_5xx, len(refused))),
        ),
        by_response_shape=shape_hist,
        paid_status_x_shape=code_x_shape,
        by_content_type=refused_ct,
        refused_bytes=OrderedDict(median=percentile([r.get("bytes") for r in refused], 0.5),
                                  p90=percentile([r.get("bytes") for r in refused], 0.9)),
        error_strings=OrderedDict(
            available=False,
            top10=[],
            reason=("The census tool records body_json as a boolean and does not retain response bodies; "
                    "no error text exists in the jsonl and hosts were not re-probed for it"),
        ),
    )

    # (3) latency
    latency = OrderedDict()
    latency["all"] = OrderedDict(probe_s=latency_block([r.get("probe_s") for r in settle_rows]),
                                 paid_s=latency_block([r.get("paid_s") for r in settle_rows]))
    for s in OUTCOMES:
        sub = [r for r in settle_rows if r["status"] == s]
        latency[s] = OrderedDict(probe_s=latency_block([r.get("probe_s") for r in sub]),
                                 paid_s=latency_block([r.get("paid_s") for r in sub]))
    latency["_method"] = "linear interpolation between closest ranks; seconds; paid_s absent for NO_CHALLENGE (nothing was sent)"

    # (4) concentration
    conc = OrderedDict(
        delivered=concentration(delivered, "DELIVERED hosts"),
        all_probed=concentration(settle_rows, "all probed hosts (NO_CHALLENGE rows carry no payTo)"),
    )

    # (5) take-and-refuse
    tar_rows = sorted((r for r in refused if has_settle_hash(r)), key=lambda r: (r["challenge_units"], r["host"]))
    tar_units = sum(r["challenge_units"] for r in tar_rows)
    claimed_unparseable = sorted((r for r in refused if settle_receipt_kind(r) == "unparseable"),
                                 key=lambda r: (r["challenge_units"], r["host"]))
    receipt_matrix = OrderedDict()
    for s in OUTCOMES:
        sub = [r for r in settle_rows if r["status"] == s]
        receipt_matrix[s] = OrderedDict((k, sum(1 for r in sub if settle_receipt_kind(r) == k))
                                        for k in ["tx_hash", "unparseable", "none"])
    delivered_no_receipt = sorted((r for r in delivered if settle_receipt_kind(r) == "none"),
                                  key=lambda r: (r["challenge_units"], r["host"]))
    take_and_refuse = OrderedDict(
        definition="status REFUSED and settle_tx is a 0x-prefixed 32-byte hash reported in the host's own PAYMENT-RESPONSE",
        hosts=len(tar_rows),
        units_total=tar_units,
        usdc_total=usdc(tar_units),
        share_of_refused_pct=pct(len(tar_rows), len(refused)),
        rows=[OrderedDict(host=r["host"], settle_tx=r["settle_tx"], units=r["challenge_units"], usdc=usdc(r["challenge_units"]),
                          paid_status=r.get("paid_status"), bytes=r.get("bytes"), response_shape=response_shape(r))
              for r in tar_rows],
        claimed_settlement_unparseable=OrderedDict(
            note=("PAYMENT-RESPONSE header present but not decodable, so the settlement claim cannot be checked on "
                  "chain from this row; the census tool still counted the amount as spent"),
            hosts=len(claimed_unparseable),
            units_total=sum(r["challenge_units"] for r in claimed_unparseable),
            usdc_total=usdc(sum(r["challenge_units"] for r in claimed_unparseable)),
            rows=[OrderedDict(host=r["host"], settle_tx=r["settle_tx"], units=r["challenge_units"],
                              paid_status=r.get("paid_status"), bytes=r.get("bytes")) for r in claimed_unparseable],
        ),
        settlement_receipt_by_outcome=receipt_matrix,
        delivered_without_receipt=OrderedDict(
            note="2xx with a body but no PAYMENT-RESPONSE header; delivery observed, settlement not evidenced by the host",
            hosts=len(delivered_no_receipt),
            units_total=sum(r["challenge_units"] for r in delivered_no_receipt),
            usdc_total=usdc(sum(r["challenge_units"] for r in delivered_no_receipt)),
            hosts_list=[r["host"] for r in delivered_no_receipt],
        ),
    )

    # (6) MISMATCH
    mismatch_block = [OrderedDict(host=r["host"], url=r.get("url"), advertised_mime=r.get("mime"),
                                  served_content_type=r.get("content_type"), body_json=r.get("body_json"),
                                  paid_status=r.get("paid_status"), bytes=r.get("bytes"), paid_s=r.get("paid_s"),
                                  units=r.get("challenge_units"), settle_receipt=settle_receipt_kind(r), settle_tx=r.get("settle_tx"))
                      for r in sorted(mismatch, key=lambda r: r["host"])]

    # (7) DRY vs SETTLE drift
    dry_by = {r["host"]: r for r in dry_rows}
    set_by = {r["host"]: r for r in settle_rows}
    common = sorted(set(dry_by) & set(set_by))
    units_changed = []
    field_changed = Counter()
    field_changed_rows = []
    for h in common:
        d, s = dry_by[h], set_by[h]
        if d.get("challenge_units") is not None and s.get("challenge_units") is not None and d["challenge_units"] != s["challenge_units"]:
            units_changed.append(OrderedDict(host=h, advertised_units=s.get("advertised_units"), dry_challenge_units=d["challenge_units"],
                                             settle_challenge_units=s["challenge_units"],
                                             delta_units=s["challenge_units"] - d["challenge_units"], settle_status=s["status"]))
        for fld in ["pay_to", "mime", "x402_version"]:
            dv, sv = d.get(fld), s.get(fld)
            if fld == "pay_to":
                dv, sv = norm_addr(dv), norm_addr(sv)
            if dv != sv:
                field_changed[fld] += 1
                field_changed_rows.append(OrderedDict(host=h, field=fld, dry=d.get(fld), settle=s.get(fld)))
    status_transitions = OrderedDict()
    for (a, b), c in sorted(Counter((dry_by[h]["status"], set_by[h]["status"]) for h in common).items(),
                            key=lambda kv: (-kv[1], kv[0])):
        status_transitions["%s->%s" % (a, b)] = c

    def price_drift(rows):
        return [OrderedDict(host=r["host"], advertised_units=r["advertised_units"], challenge_units=r["challenge_units"],
                            delta_units=r["challenge_units"] - r["advertised_units"])
                for r in sorted(rows, key=lambda r: r["host"])
                if r.get("challenge_units") is not None and r["challenge_units"] != r["advertised_units"]]

    drift = OrderedDict(
        dry_hosts=len(dry_by), settle_hosts=len(set_by), common_hosts=len(common),
        dropped_between_passes=sorted(set(dry_by) - set(set_by)),
        added_between_passes=sorted(set(set_by) - set(dry_by)),
        no_challenge_dry=sorted(h for h, r in dry_by.items() if r["status"] == "NO_CHALLENGE"),
        no_challenge_settle=sorted(h for h, r in set_by.items() if r["status"] == "NO_CHALLENGE"),
        challenge_units_changed=units_changed,
        other_terms_changed=OrderedDict(counts=OrderedDict(sorted(field_changed.items())), rows=field_changed_rows),
        price_drift_vs_advertised=OrderedDict(dry=price_drift(dry_rows), settle=price_drift(settle_rows)),
        status_transitions=status_transitions,
        probe_s_median=OrderedDict(dry=percentile([r.get("probe_s") for r in dry_rows], 0.5),
                                   settle=percentile([r.get("probe_s") for r in settle_rows], 0.5)),
    )

    # (8) x402 version split
    version = OrderedDict()
    for v, c in sorted(Counter(str(r.get("x402_version")) for r in settle_rows).items(), key=lambda kv: (-kv[1], kv[0])):
        version[v] = OrderedDict(hosts=c, share_pct=pct(c, n))
    version_by_outcome = OrderedDict()
    for s in OUTCOMES:
        version_by_outcome[s] = OrderedDict(sorted(Counter(str(r.get("x402_version")) for r in settle_rows if r["status"] == s).items()))

    # (9) delivered bytes
    dbytes = [r.get("bytes") for r in delivered]
    buckets = OrderedDict([("<=100", 0), ("101-1000", 0), ("1001-10000", 0), ("10001-100000", 0), (">100000", 0)])
    for b in dbytes:
        if b <= 100:
            buckets["<=100"] += 1
        elif b <= 1000:
            buckets["101-1000"] += 1
        elif b <= 10000:
            buckets["1001-10000"] += 1
        elif b <= 100000:
            buckets["10001-100000"] += 1
        else:
            buckets[">100000"] += 1
    delivered_ct = OrderedDict()
    for ct, c in sorted(Counter((r.get("content_type") or "").lower() or "(none)" for r in delivered).items(),
                        key=lambda kv: (-kv[1], kv[0])):
        delivered_ct[ct] = c
    delivered_block = OrderedDict(
        hosts=len(delivered),
        bytes=OrderedDict(min=min(dbytes) if dbytes else None, median=percentile(dbytes, 0.5), p90=percentile(dbytes, 0.9),
                          max=max(dbytes) if dbytes else None, total=sum(dbytes)),
        bytes_buckets=buckets,
        body_json_share_pct=pct(sum(1 for r in delivered if r.get("body_json")), len(delivered)),
        by_content_type=delivered_ct,
        advertised_mime=OrderedDict(sorted(Counter(str(r.get("mime")) for r in delivered).items())),
        units=OrderedDict(total=sum(r["challenge_units"] for r in delivered), usdc=usdc(sum(r["challenge_units"] for r in delivered)),
                          median=percentile([r["challenge_units"] for r in delivered], 0.5)),
    )

    # spend reconciliation (from the rows themselves)
    running = max((r.get("spent_units_running") or 0) for r in settle_rows)
    counted = sum(r["challenge_units"] for r in settle_rows
                  if r["status"] in ("DELIVERED", "MISMATCH") or r.get("settle_tx"))
    spend = OrderedDict(
        spent_units_running_final=running, usdc_running_final=usdc(running),
        recomputed_units=counted, usdc_recomputed=usdc(counted), reconciles=(running == counted),
        rule="tool counts a row as spent when status is DELIVERED/MISMATCH or any settle_tx value is present",
        breakdown_units=OrderedDict(
            delivered=sum(r["challenge_units"] for r in delivered),
            mismatch=sum(r["challenge_units"] for r in mismatch),
            refused_with_tx_hash=tar_units,
            refused_with_unparseable_receipt=sum(r["challenge_units"] for r in claimed_unparseable),
        ),
        payers=sorted(set(r.get("payer") for r in settle_rows if r.get("payer"))),
        self_hosts_present=sorted(h for h in set_by if h.endswith("councilof.ai") or h == "csoai.org"),
    )

    return OrderedDict(
        schema=SCHEMA,
        census_date=inputs["date"],
        inputs=OrderedDict((k, OrderedDict(path=v, sha256=sha256_file(os.path.join(ROOT, v)), rows=len(read_jsonl(os.path.join(ROOT, v)))))
                           for k, v in [("settle_jsonl", inputs["settle"]), ("dry_jsonl", inputs["dry"])]),
        population=OrderedDict(probed=n, challenged=len(challenged), distinct_hosts=len(set_by), duplicate_hosts=n - len(set_by)),
        caveats=CAVEATS,
        what_this_is=("Measurement of one buyer's-eye purchase per host at one moment, derived entirely from the committed "
                      "census rows. It is not a certification, ranking or recommendation of any host."),
        outcomes=outcomes,
        refused=refused_block,
        latency=latency,
        concentration=conc,
        take_and_refuse=take_and_refuse,
        mismatch=mismatch_block,
        dry_vs_settle=drift,
        x402_version=OrderedDict(split=version, by_outcome=version_by_outcome),
        delivered=delivered_block,
        spend=spend,
    )


# ----------------------------------------------------------------------------- markdown
def md_table(headers, rows):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    for row in rows:
        out.append("| " + " | ".join("" if v is None else str(v) for v in row) + " |")
    return "\n".join(out)


def fmt(v):
    return "n/a" if v is None else v


def render_md(a):
    d = a["census_date"]
    n = a["population"]["probed"]
    o = a["outcomes"]
    L = []
    L.append("# x402 settlement census %s: analysis" % d)
    L.append("")
    L.append("Generated by `scripts/grants/x402_census_analysis.py` from the committed census rows. Every figure below "
             "is computed by that script; `--check` recomputes and fails if this file drifts from the rows. "
             "%s" % a["what_this_is"])
    L.append("")
    L.append("Inputs: `%s` (%d rows, sha256 `%s`), `%s` (%d rows, sha256 `%s`)." % (
        a["inputs"]["settle_jsonl"]["path"], a["inputs"]["settle_jsonl"]["rows"], a["inputs"]["settle_jsonl"]["sha256"][:16],
        a["inputs"]["dry_jsonl"]["path"], a["inputs"]["dry_jsonl"]["rows"], a["inputs"]["dry_jsonl"]["sha256"][:16]))
    L.append("")
    L.append("## Caveats")
    L.append("")
    for c in a["caveats"]:
        L.append("- %s" % c)
    L.append("- Self excluded: our own hosts were not in the population (%d self hosts present in the rows)." % len(a["spend"]["self_hosts_present"]))
    L.append("")
    L.append("## 1. Outcomes (%d hosts probed, %d issued a parseable 402)" % (n, a["population"]["challenged"]))
    L.append("")
    L.append(md_table(["outcome", "hosts", "share %"], [(k, v["hosts"], v["share_pct"]) for k, v in o.items() if not k.startswith("_")]))
    L.append("")
    r = a["refused"]
    L.append("## 2. REFUSED: %d hosts" % r["hosts"])
    L.append("")
    L.append("By status code on the paid retry:")
    L.append("")
    L.append(md_table(["paid_status", "hosts", "% of REFUSED"], [(k, v["hosts"], v["share_of_refused_pct"]) for k, v in r["by_paid_status"].items()]))
    L.append("")
    bc = r["by_class"]
    L.append("Grouped: 402 again %d (%s%%), other 4xx %d (%s%%), 5xx %d (%s%%)." % (
        bc["again_402"]["hosts"], bc["again_402"]["share_of_refused_pct"], bc["other_4xx"]["hosts"], bc["other_4xx"]["share_of_refused_pct"],
        bc["five_xx"]["hosts"], bc["five_xx"]["share_of_refused_pct"]))
    L.append("")
    L.append("By response shape:")
    L.append("")
    L.append(md_table(["shape", "hosts", "% of REFUSED"], [(k, v["hosts"], v["share_of_refused_pct"]) for k, v in r["by_response_shape"].items()]))
    L.append("")
    L.append("Status code x shape (top): " + ", ".join("%s %d" % kv for kv in list(r["paid_status_x_shape"].items())[:8]) + ".")
    L.append("")
    L.append("REFUSED body size: median %s bytes, p90 %s bytes." % (fmt(r["refused_bytes"]["median"]), fmt(r["refused_bytes"]["p90"])))
    L.append("")
    L.append("Top error strings: not available. %s." % r["error_strings"]["reason"])
    L.append("")
    lat = a["latency"]
    L.append("## 3. Latency (seconds)")
    L.append("")
    rows = []
    for k in ["all"] + OUTCOMES:
        b = lat[k]
        rows.append((k, b["probe_s"]["n"], fmt(b["probe_s"]["median"]), fmt(b["probe_s"]["p90"]), fmt(b["probe_s"]["p95"]),
                     b["paid_s"]["n"], fmt(b["paid_s"]["median"]), fmt(b["paid_s"]["p90"]), fmt(b["paid_s"]["p95"])))
    L.append(md_table(["outcome", "probe n", "probe median", "probe p90", "probe p95", "paid n", "paid median", "paid p90", "paid p95"], rows))
    L.append("")
    L.append("Method: %s." % lat["_method"])
    L.append("")
    L.append("## 4. Beneficiary concentration (payTo, case-insensitive)")
    L.append("")
    rows = []
    for k in ["delivered", "all_probed"]:
        c = a["concentration"][k]
        rows.append((c["population"], c["rows_with_pay_to"], c["distinct_pay_to"], fmt(c["top1_share_pct"]), fmt(c["top3_share_pct"]),
                     fmt(c["gini"]), fmt(c["hhi"]), c["single_host_payees"]))
    L.append(md_table(["population", "rows with payTo", "distinct payTo", "top1 %", "top3 %", "Gini", "HHI", "payees with 1 host"], rows))
    L.append("")
    for k in ["delivered", "all_probed"]:
        c = a["concentration"][k]
        L.append("Top 3 among %s: %s." % (c["population"], "; ".join("`%s` %d hosts (%s%%)" % (t["pay_to"], t["hosts"], t["share_pct"]) for t in c["top3"])))
    L.append("")
    t = a["take_and_refuse"]
    L.append("## 5. Took a settlement and still refused: %d hosts, %s USDC" % (t["hosts"], "%.4f" % t["usdc_total"]))
    L.append("")
    L.append("Definition: %s. %s%% of REFUSED. Each tx hash is the host's own claim; check it on chain rather than take this table's word." % (
        t["definition"], t["share_of_refused_pct"]))
    L.append("")
    L.append(md_table(["host", "settle_tx", "units", "USDC", "paid_status", "bytes", "shape"],
                      [(x["host"], "`%s`" % x["settle_tx"], x["units"], "%.4f" % x["usdc"], x["paid_status"], x["bytes"], x["response_shape"]) for x in t["rows"]]))
    L.append("")
    cu = t["claimed_settlement_unparseable"]
    L.append("Plus %d REFUSED host(s) whose PAYMENT-RESPONSE could not be decoded (%s USDC): %s. %s." % (
        cu["hosts"], "%.4f" % cu["usdc_total"],
        ", ".join("%s (paid_status %s, %d bytes)" % (x["host"], x["paid_status"], x["bytes"]) for x in cu["rows"]) or "none", cu["note"]))
    L.append("")
    m = t["settlement_receipt_by_outcome"]
    L.append("Settlement receipt by outcome (tx hash / unparseable / none): " + "; ".join(
        "%s %d/%d/%d" % (k, v["tx_hash"], v["unparseable"], v["none"]) for k, v in m.items()) + ".")
    dw = t["delivered_without_receipt"]
    L.append("")
    L.append("Delivered without a receipt: %d hosts (%s USDC). %s." % (dw["hosts"], "%.4f" % dw["usdc_total"], dw["note"]))
    L.append("")
    L.append("## 6. MISMATCH")
    L.append("")
    if a["mismatch"]:
        L.append(md_table(["host", "advertised mime", "served content-type", "body_json", "paid_status", "bytes", "paid_s", "receipt"],
                          [(x["host"], x["advertised_mime"], x["served_content_type"], x["body_json"], x["paid_status"], x["bytes"], x["paid_s"], x["settle_receipt"])
                           for x in a["mismatch"]]))
    else:
        L.append("None.")
    L.append("")
    dv = a["dry_vs_settle"]
    L.append("## 7. DRY vs SETTLE drift")
    L.append("")
    L.append("DRY %d hosts, SETTLE %d hosts, %d in common; dropped between passes: %d; added: %d. NO_CHALLENGE in DRY: %s; in SETTLE: %s." % (
        dv["dry_hosts"], dv["settle_hosts"], dv["common_hosts"], len(dv["dropped_between_passes"]), len(dv["added_between_passes"]),
        ", ".join(dv["no_challenge_dry"]) or "none", ", ".join(dv["no_challenge_settle"]) or "none"))
    L.append("")
    L.append("Challenge units changed between passes: %d host(s)." % len(dv["challenge_units_changed"]))
    if dv["challenge_units_changed"]:
        L.append("")
        L.append(md_table(["host", "advertised", "DRY challenge", "SETTLE challenge", "delta", "SETTLE status"],
                          [(x["host"], x["advertised_units"], x["dry_challenge_units"], x["settle_challenge_units"], x["delta_units"], x["settle_status"])
                           for x in dv["challenge_units_changed"]]))
    L.append("")
    oc = dv["other_terms_changed"]["counts"]
    L.append("Other terms changed (payTo / mime / x402_version): %s." % (", ".join("%s %d" % kv for kv in oc.items()) or "none"))
    L.append("")
    pd_ = dv["price_drift_vs_advertised"]
    L.append("Price drift vs the advertised index amount: DRY %d host(s), SETTLE %d host(s)%s." % (
        len(pd_["dry"]), len(pd_["settle"]),
        ("; SETTLE: " + ", ".join("%s %d -> %d" % (x["host"], x["advertised_units"], x["challenge_units"]) for x in pd_["settle"])) if pd_["settle"] else ""))
    L.append("")
    L.append("Status transitions DRY -> SETTLE: " + ", ".join("%s %d" % kv for kv in dv["status_transitions"].items()) + ".")
    L.append("")
    L.append("Probe latency median: DRY %s s, SETTLE %s s." % (fmt(dv["probe_s_median"]["dry"]), fmt(dv["probe_s_median"]["settle"])))
    L.append("")
    L.append("## 8. x402 version")
    L.append("")
    L.append(md_table(["x402_version", "hosts", "share %"], [(k, v["hosts"], v["share_pct"]) for k, v in a["x402_version"]["split"].items()]))
    L.append("")
    L.append("Version `None` means no parseable challenge (NO_CHALLENGE). By outcome: " + "; ".join(
        "%s %s" % (k, ", ".join("v%s %d" % kv for kv in v.items())) for k, v in a["x402_version"]["by_outcome"].items()) + ".")
    L.append("")
    db = a["delivered"]
    L.append("## 9. Delivered bodies (%d hosts)" % db["hosts"])
    L.append("")
    L.append("Bytes: min %s, median %s, p90 %s, max %s, total %s. JSON-parseable bodies: %s%%." % (
        fmt(db["bytes"]["min"]), fmt(db["bytes"]["median"]), fmt(db["bytes"]["p90"]), fmt(db["bytes"]["max"]), fmt(db["bytes"]["total"]),
        fmt(db["body_json_share_pct"])))
    L.append("")
    L.append(md_table(["bytes bucket", "hosts"], list(db["bytes_buckets"].items())))
    L.append("")
    L.append("Served content-type: " + ", ".join("`%s` %d" % kv for kv in db["by_content_type"].items()) + ".")
    L.append("")
    L.append("Units paid for delivered bodies: %d units (%s USDC), median %s units per host." % (
        db["units"]["total"], "%.4f" % db["units"]["usdc"], fmt(db["units"]["median"])))
    L.append("")
    sp = a["spend"]
    L.append("## Spend reconciliation")
    L.append("")
    L.append("Final running spend in the rows: %d units (%s USDC); recomputed from the rule \"%s\": %d units (%s USDC); reconciles: %s. "
             "Breakdown (units): delivered %d, mismatch %d, refused with tx hash %d, refused with unparseable receipt %d. Payer addresses in rows: %d." % (
                 sp["spent_units_running_final"], "%.4f" % sp["usdc_running_final"], sp["rule"], sp["recomputed_units"], "%.4f" % sp["usdc_recomputed"],
                 sp["reconciles"], sp["breakdown_units"]["delivered"], sp["breakdown_units"]["mismatch"], sp["breakdown_units"]["refused_with_tx_hash"],
                 sp["breakdown_units"]["refused_with_unparseable_receipt"], len(sp["payers"])))
    L.append("")
    L.append("Reproduce: `python3 scripts/grants/x402_census_analysis.py` ; verify: `python3 scripts/grants/x402_census_analysis.py --check`.")
    L.append("")
    return "\n".join(L)


# ----------------------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--date", default="2026-09-06")
    ap.add_argument("--settle", default=None, help="settle jsonl (relative to repo root)")
    ap.add_argument("--dry", default=None, help="dry jsonl (relative to repo root)")
    ap.add_argument("--out-json", default=None)
    ap.add_argument("--out-md", default=None)
    ap.add_argument("--check", action="store_true", help="recompute and exit 1 if committed artefacts differ")
    a = ap.parse_args()
    settle = a.settle or "docs/product/x402-settlement-census-%s.jsonl" % a.date
    dry = a.dry or "docs/product/x402-settlement-census-dry-%s.jsonl" % a.date
    out_json = a.out_json or "docs/product/x402-settlement-census-%s.analysis.json" % a.date
    out_md = a.out_md or "docs/product/x402-settlement-census-%s.analysis.md" % a.date

    settle_rows = read_jsonl(os.path.join(ROOT, settle))
    dry_rows = read_jsonl(os.path.join(ROOT, dry))
    analysis = analyse(settle_rows, dry_rows, {"date": a.date, "settle": settle, "dry": dry})
    js = json.dumps(analysis, indent=2, ensure_ascii=False) + "\n"
    md = render_md(analysis) + "\n"

    if a.check:
        bad = []
        for path, text in [(out_json, js), (out_md, md)]:
            p = os.path.join(ROOT, path)
            if not os.path.exists(p):
                bad.append("%s: missing" % path)
                continue
            with open(p, encoding="utf-8") as f:
                committed = f.read()
            if committed != text:
                bad.append("%s: differs from recomputation (committed sha256 %s, recomputed %s)" % (
                    path, hashlib.sha256(committed.encode()).hexdigest()[:16], hashlib.sha256(text.encode()).hexdigest()[:16]))
        if bad:
            print("CHECK FAILED\n  " + "\n  ".join(bad), file=sys.stderr)
            return 1
        print("CHECK OK: %s and %s match the rows (%d settle rows, %d dry rows)" % (out_json, out_md, len(settle_rows), len(dry_rows)))
        return 0

    for path, text in [(out_json, js), (out_md, md)]:
        with open(os.path.join(ROOT, path), "w", encoding="utf-8") as f:
            f.write(text)
        print("wrote %s" % path)
    o = analysis["outcomes"]
    print("probed %d: DELIVERED %d (%s%%) REFUSED %d (%s%%) MISMATCH %d NO_CHALLENGE %d; take-and-refuse %d hosts %.4f USDC" % (
        analysis["population"]["probed"], o["DELIVERED"]["hosts"], o["DELIVERED"]["share_pct"], o["REFUSED"]["hosts"], o["REFUSED"]["share_pct"],
        o["MISMATCH"]["hosts"], o["NO_CHALLENGE"]["hosts"], analysis["take_and_refuse"]["hosts"], analysis["take_and_refuse"]["usdc_total"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
