#!/usr/bin/env python3
"""Measure this estate's distribution, one package at a time, on the pod.

Installed on the pod as /workspace/lanes/loops/distribution-measure.py. It lives in the repo too
so the producer of the number is reviewable beside the number.

Why it is not in the Cloudflare request: /api/footprint used to fan out to its five-name package
list inside the request and publish the sum. On 2026-09-22 four of the five answered `http 429`
and the endpoint served `gross_distribution: PARTIAL, 69307` — a lower bound over one package,
presented as the estate's distribution. The confirmed list is 397 PyPI + 324 npm + 111 Hugging
Face rows. Seven hundred-odd paced fetches cannot happen inside one request, so they happen here,
once, and the request reads the artifact out.

Sources, and what each one can actually answer:

  PyPI   https://pepy.tech/api/v2/projects/<name>  (free, unauthenticated)
         `total_downloads` is the cumulative count; `downloads` is a daily-by-version map whose
         span varies by package (29, 40 and 90 days were observed on 2026-09-22), so the 30-day
         figure is computed here by slicing that map to the last 30 complete UTC days rather than
         trusting the map's length. api.pepy.tech/api/v2 answers 401 without a key; this host does not.
         pypistats.org/api/packages/<name>/recent answers last_month directly but was returning
         `429 Too Many Requests` on 2026-09-22, which is what broke the endpoint; it is used only
         as a small cross-check sample, and a 429 there costs nothing.

  npm    https://api.npmjs.org/downloads/point/last-month/<a,b,c>   (bulk, unscoped)
         and .../range/<start>:<end>/<name> for the cumulative figure. The range endpoint clamps
         to the most recent 18 months whatever start is asked for, so the sum over that window is
         the all-time total ONLY when the package's first non-zero day falls strictly inside it.
         That is checked per package: proven -> READ, otherwise the row says PARTIAL and the value
         is a lower bound. Scoped names (@scope/pkg) are read one at a time; bulk rejects them.

  HF     https://huggingface.co/api/{models,datasets}?author=<a>&expand[]=downloads&expand[]=downloadsAllTime
         The Hub publishes both windows itself. One request per repo type.

Doctrine this file is written to:
  · A count with no state is a lie. Every figure carries {state, value, unit, window, covered,
    attempted, as_of, source_url}.
  · A partial read is never totalled as a population. Sums are taken over what answered and carry
    covered/attempted on their face.
  · 30-day and cumulative are different windows and are never added to each other.
  · Nothing is invented. A source that did not answer leaves value null, never 0.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

SCHEMA = "csoai.distribution/0.1"
UA = "councilof.ai distribution-measure (nicholas@csoai.org)"
# How old this artifact may be before a reader should treat it as stale. The loop runs daily;
# two days gives one missed run of slack before /api/footprint starts saying STALE.
MAX_AGE_HOURS = 48
WINDOW_DAYS = 30

PEPY = "https://pepy.tech/api/v2/projects/{name}"
PYPISTATS = "https://pypistats.org/api/packages/{name}/recent"
NPM_POINT = "https://api.npmjs.org/downloads/point/last-month/{names}"
NPM_RANGE = "https://api.npmjs.org/downloads/range/{start}:{end}/{name}"
HF_LIST = "https://huggingface.co/api/{kind}?author={author}&expand[]=downloads&expand[]=downloadsAllTime&limit=1000"

THIRD_PARTY = "third-party counter (includes mirror and automated traffic)"


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso(t: dt.datetime) -> str:
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


class Http:
    """One GET, its own timeout, exponential backoff on 429/5xx. Never raises to the caller."""

    def __init__(self, pace: float = 0.4, retries: int = 5, timeout: int = 45, verbose: bool = False):
        self.pace = pace
        self.retries = retries
        self.timeout = timeout
        self.verbose = verbose
        self.calls = 0
        self.retried = 0
        self.last = 0.0

    def get(self, url: str):
        """-> (body, None) on success, (None, reason) on failure."""
        delay = 2.0
        for attempt in range(self.retries + 1):
            gap = self.pace - (time.monotonic() - self.last)
            if gap > 0:
                time.sleep(gap)
            req = urllib.request.Request(url, headers={"user-agent": UA, "accept": "application/json"})
            try:
                self.calls += 1
                with urllib.request.urlopen(req, timeout=self.timeout) as r:
                    body = json.load(r)
                self.last = time.monotonic()
                return body, None
            except urllib.error.HTTPError as e:
                self.last = time.monotonic()
                if e.code in (429, 500, 502, 503, 504) and attempt < self.retries:
                    self.retried += 1
                    wait = delay + random.uniform(0, delay / 2)
                    ra = e.headers.get("retry-after") if e.headers else None
                    if ra and str(ra).isdigit():
                        wait = max(wait, min(float(ra), 120.0))
                    if self.verbose:
                        print(f"    http {e.code} on {url} — waiting {wait:.1f}s", file=sys.stderr)
                    time.sleep(wait)
                    delay = min(delay * 2, 60.0)
                    continue
                return None, f"http {e.code}"
            except Exception as e:  # noqa: BLE001
                self.last = time.monotonic()
                if attempt < self.retries:
                    self.retried += 1
                    time.sleep(delay)
                    delay = min(delay * 2, 60.0)
                    continue
                return None, f"fetch failed: {type(e).__name__}: {str(e)[:120]}"
        return None, "retries exhausted"


def is_num(v) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def row(state: str, value, unit: str, window: str, covered: int, attempted: int, as_of, source_url, **extra) -> dict:
    out = {
        "state": state,
        "value": value,
        "unit": unit,
        "window": window,
        "covered": covered,
        "attempted": attempted,
        "as_of": as_of,
        "source_url": source_url,
        "kind": THIRD_PARTY,
    }
    out.update(extra)
    return out


def fan_row(values: list, unit: str, window: str, attempted: int, as_of: str, source_url, label: str, **extra) -> dict:
    """Sum over what answered, never over what did not. covered/attempted on the face of it."""
    covered = len(values)
    if attempted == 0:
        return row("UNMEASURED", None, unit, window, 0, 0, None, source_url,
                   reason=f"{label}: the confirmed list carries no names for this registry", **extra)
    if covered == 0:
        return row("UNCHECKABLE", None, unit, window, 0, attempted, None, source_url,
                   reason=f"{label}: none of {attempted} counters answered", **extra)
    state = "READ" if covered == attempted else "PARTIAL"
    r = row(state, sum(values), unit, window, covered, attempted, as_of, source_url, **extra)
    if state == "PARTIAL":
        r["reason"] = (f"{label}: {covered} of {attempted} counters answered; the value is a lower "
                       f"bound over those {covered}, not a total over {attempted}")
    return r


# ── PyPI ──────────────────────────────────────────────────────────────────────
def window_bounds(now: dt.datetime) -> tuple[dt.date, dt.date]:
    """The last WINDOW_DAYS complete UTC days, ending yesterday. Today is partial and is excluded."""
    end = now.date() - dt.timedelta(days=1)
    return end - dt.timedelta(days=WINDOW_DAYS - 1), end


def pypi_package(http: Http, name: str, start: dt.date, end: dt.date) -> dict:
    url = PEPY.format(name=urllib.parse.quote(name))
    body, reason = http.get(url)
    out = {"registry": "pypi", "name": name, "source_url": url,
           "downloads_30d": None, "downloads_all_time": None}
    if body is None:
        out["reason"] = reason
        return out
    total = body.get("total_downloads")
    if is_num(total):
        out["downloads_all_time"] = int(total)
    else:
        out["all_time_reason"] = "total_downloads absent"
    daily = body.get("downloads")
    if isinstance(daily, dict):
        days = [d for d in daily if start.isoformat() <= d <= end.isoformat()]
        out["downloads_30d"] = sum(
            v for d in days for v in (daily[d].values() if isinstance(daily[d], dict) else [daily[d]]) if is_num(v)
        )
        out["days_in_window"] = len(days)
        first = min(daily) if daily else None
        out["series_starts"] = first
        # pepy's series does not always reach back 30 days. When it starts inside the window the
        # 30-day figure is still every download pepy holds for those dates, but say so.
        if first and first > start.isoformat():
            out["window_note"] = f"pepy's daily series for this package starts {first}, inside the window"
    else:
        out["thirty_day_reason"] = "downloads map absent"
    return out


def measure_pypi(http: Http, names: list[dict], now: dt.datetime, cross_check_n: int) -> dict:
    start, end = window_bounds(now)
    window = f"{start.isoformat()}..{end.isoformat()} (30 complete UTC days)"
    packages = []
    for i, entry in enumerate(names):
        p = pypi_package(http, entry["name"], start, end)
        p["entity"] = entry.get("entity", "unattributed")
        packages.append(p)
        if i and i % 50 == 0:
            print(f"  pypi {i}/{len(names)} (retries so far {http.retried})", file=sys.stderr)
    as_of = iso(utcnow())
    src = PEPY.format(name="<name>")
    d30 = fan_row([p["downloads_30d"] for p in packages if is_num(p["downloads_30d"])],
                  "downloads", window, len(names), as_of, src, "pypi 30-day",
                  method="sum of pepy.tech's daily-by-version series over the 30 complete UTC days")
    dall = fan_row([p["downloads_all_time"] for p in packages if is_num(p["downloads_all_time"])],
                   "downloads", "cumulative, all time", len(names), as_of, src, "pypi cumulative",
                   method="sum of pepy.tech total_downloads")
    out = {"downloads_30d": d30, "downloads_all_time": dall, "packages": packages}

    # Cross-check a sample against the other counter. A 429 here is expected and costs nothing.
    sample = [p["name"] for p in packages if is_num(p["downloads_30d"]) and p["downloads_30d"] > 0][:cross_check_n]
    checks = []
    for name in sample:
        body, reason = http.get(PYPISTATS.format(name=urllib.parse.quote(name)))
        mine = next(p["downloads_30d"] for p in packages if p["name"] == name)
        if body is None:
            checks.append({"name": name, "state": "UNCHECKABLE", "reason": reason, "pepy_30d": mine})
            continue
        theirs = (body.get("data") or {}).get("last_month")
        checks.append({
            "name": name,
            "state": "READ" if is_num(theirs) else "UNCHECKABLE",
            "pepy_30d": mine,
            "pypistats_last_month": theirs if is_num(theirs) else None,
            "delta": (mine - theirs) if is_num(theirs) else None,
        })
    ratios = sorted(
        c["pepy_30d"] / c["pypistats_last_month"]
        for c in checks
        if is_num(c.get("pypistats_last_month")) and c["pypistats_last_month"]
    )
    median = ratios[len(ratios) // 2] if ratios else None
    out["cross_check"] = {
        "source_url": PYPISTATS.format(name="<name>"),
        "samples_compared": len(ratios),
        "pepy_over_pypistats_median": round(median, 2) if median is not None else None,
        "note": ("Two third-party counters over the same registry, and they do not agree. On "
                 "2026-09-22 pepy.tech's daily series ran about "
                 f"{('%.1f' % median) if median is not None else '?'}x pypistats' last_month on "
                 "every package sampled. The likeliest reason is that they treat mirror and "
                 "automated traffic differently, but neither publishes enough to settle it here, "
                 "so this is recorded as an open divergence and not resolved by picking one. The "
                 "figure published above is pepy's, the larger of the two, and it is labelled "
                 "gross precisely because a number that includes mirrors is not a number of people. "
                 "Anyone quoting it should quote this ratio beside it."),
        "state": "READ" if ratios else "UNCHECKABLE",
        **({} if ratios else {"reason": "no sample answered on the second counter (pypistats was rate-limiting)"}),
        "samples": checks,
    }
    return out


# ── npm ───────────────────────────────────────────────────────────────────────
def measure_npm(http: Http, names: list[dict], now: dt.datetime) -> dict:
    plain = [e["name"] for e in names if not e["name"].startswith("@")]
    scoped = [e["name"] for e in names if e["name"].startswith("@")]
    got: dict[str, int] = {}
    failed: dict[str, str] = {}
    point_window = None

    for i in range(0, len(plain), 100):
        chunk = plain[i:i + 100]
        body, reason = http.get(NPM_POINT.format(names=",".join(chunk)))
        if body is None:
            for n in chunk:
                failed[n] = reason
            continue
        # A single-name request answers with the record itself, not a map.
        records = body if len(chunk) > 1 else {chunk[0]: body}
        for n in chunk:
            rec = records.get(n) if isinstance(records, dict) else None
            if isinstance(rec, dict) and is_num(rec.get("downloads")):
                got[n] = int(rec["downloads"])
                point_window = point_window or f'{rec.get("start")}..{rec.get("end")}'
            else:
                failed[n] = "downloads absent from the bulk answer"
    for n in scoped:
        body, reason = http.get(NPM_POINT.format(names=urllib.parse.quote(n, safe="")))
        if body is None or not is_num((body or {}).get("downloads")):
            failed[n] = reason or "downloads absent"
        else:
            got[n] = int(body["downloads"])
            point_window = point_window or f'{body.get("start")}..{body.get("end")}'

    # Cumulative: the range endpoint clamps to 18 months. The sum is the all-time total only when
    # the first non-zero day is strictly inside the window; otherwise it is a proven lower bound.
    end = (now.date() - dt.timedelta(days=1)).isoformat()
    start_ask = (now.date() - dt.timedelta(days=365 * 11)).isoformat()
    all_time: dict[str, dict] = {}
    for i, e in enumerate(names):
        n = e["name"]
        body, reason = http.get(NPM_RANGE.format(start=start_ask, end=end, name=urllib.parse.quote(n, safe="@/")))
        if body is None or not isinstance(body.get("downloads"), list):
            all_time[n] = {"value": None, "reason": reason or "no range series"}
            continue
        series = body["downloads"]
        total = sum(d.get("downloads", 0) for d in series if is_num(d.get("downloads")))
        nz = [d["day"] for d in series if is_num(d.get("downloads")) and d["downloads"]]
        covers = bool(nz) and nz[0] > (body.get("start") or "")
        all_time[n] = {
            "value": total,
            "window_start": body.get("start"),
            "window_end": body.get("end"),
            "first_non_zero_day": nz[0] if nz else None,
            "covers_all_time": covers,
            **({} if covers else {"reason": "the 18-month range window starts on or before this package's "
                                            "first counted download; the value is a proven lower bound"}),
        }
        if i and i % 100 == 0:
            print(f"  npm range {i}/{len(names)}", file=sys.stderr)

    as_of = iso(utcnow())
    packages = []
    for e in names:
        n = e["name"]
        at = all_time.get(n, {})
        packages.append({
            "registry": "npm",
            "name": n,
            "entity": e.get("entity", "unattributed"),
            "downloads_30d": got.get(n),
            "downloads_all_time": at.get("value"),
            "all_time_covers_all_time": at.get("covers_all_time"),
            "source_url": NPM_POINT.format(names=n),
            **({"reason": failed[n]} if n in failed else {}),
            **({"all_time_reason": at["reason"]} if at.get("reason") else {}),
        })

    d30 = fan_row([p["downloads_30d"] for p in packages if is_num(p["downloads_30d"])],
                  "downloads", point_window or "last month (npm point/last-month)",
                  len(names), as_of, NPM_POINT.format(names="<names>"), "npm 30-day",
                  method="api.npmjs.org point/last-month, bulk where the registry allows it")
    at_vals = [p["downloads_all_time"] for p in packages if is_num(p["downloads_all_time"])]
    proven = sum(1 for p in packages if p.get("all_time_covers_all_time"))
    all_proven = bool(at_vals) and proven == len(at_vals)
    window_all = ("cumulative, all time (every package answered inside npm's 18-month range window, "
                  "so the window provably covers its whole life)"
                  if all_proven else "cumulative, bounded by npm's 18-month range window")
    dall = fan_row(at_vals, "downloads",
                   window_all, len(names), as_of,
                   NPM_RANGE.format(start="<start>", end="<end>", name="<name>"), "npm cumulative",
                   method="sum of the daily range series",
                   packages_proven_to_cover_all_time=proven,
                   proven_note=("npm's range endpoint serves at most the last 18 months. For the "
                                f"{proven} packages whose first counted download falls strictly inside "
                                "that window the sum IS the all-time total; for the rest it is a lower bound."))
    if proven < len(at_vals) and dall["state"] == "READ":
        dall["state"] = "PARTIAL"
        dall["reason"] = ("every counter answered, but only "
                          f"{proven} of {len(at_vals)} are proven to cover the package's whole life; "
                          "the value is a lower bound")
    return {"downloads_30d": d30, "downloads_all_time": dall, "packages": packages}


# ── Hugging Face ──────────────────────────────────────────────────────────────
def measure_hf(http: Http, authors: list[str], now: dt.datetime) -> dict:
    packages = []
    attempted_listings = 0
    failed_listings = []
    for kind in ("models", "datasets"):
        for author in authors:
            attempted_listings += 1
            url = HF_LIST.format(kind=kind, author=author)
            body, reason = http.get(url)
            if not isinstance(body, list):
                failed_listings.append({"listing": f"{kind}/{author}", "reason": reason or "listing is not a json array"})
                continue
            for item in body:
                rid = item.get("id") or item.get("modelId")
                if not rid:
                    continue
                packages.append({
                    "registry": "huggingface",
                    "repo_type": kind[:-1],
                    "name": rid,
                    "entity": "csoai",
                    "downloads_30d": item.get("downloads") if is_num(item.get("downloads")) else None,
                    "downloads_all_time": item.get("downloadsAllTime") if is_num(item.get("downloadsAllTime")) else None,
                    "source_url": url,
                })
    as_of = iso(utcnow())
    src = HF_LIST.format(kind="{models,datasets}", author=",".join(authors))
    attempted = len(packages)
    d30 = fan_row([p["downloads_30d"] for p in packages if is_num(p["downloads_30d"])],
                  "downloads", "last 30 days (Hub `downloads`)", attempted, as_of, src, "huggingface 30-day",
                  listings_attempted=attempted_listings, listings_failed=failed_listings)
    dall = fan_row([p["downloads_all_time"] for p in packages if is_num(p["downloads_all_time"])],
                   "downloads", "cumulative, all time (Hub `downloadsAllTime`)", attempted, as_of, src,
                   "huggingface cumulative", listings_attempted=attempted_listings, listings_failed=failed_listings)
    if failed_listings:
        for r in (d30, dall):
            if r["state"] == "READ":
                r["state"] = "PARTIAL"
                r["reason"] = f"{len(failed_listings)} of {attempted_listings} listings did not answer; repos behind them are not in this count"
    return {"downloads_30d": d30, "downloads_all_time": dall, "packages": packages}


# ── roll-up ───────────────────────────────────────────────────────────────────
def roll_up(registries: dict, field: str, unit_window: str, as_of: str) -> dict:
    rows = {k: v[field] for k, v in registries.items()}
    answered = {k: r for k, r in rows.items() if is_num(r.get("value"))}
    covered = sum(r["covered"] for r in rows.values())
    attempted = sum(r["attempted"] for r in rows.values())
    if not answered:
        return row("UNCHECKABLE", None, "downloads", unit_window, covered, attempted, None,
                   [r.get("source_url") for r in rows.values()],
                   reason="no registry counter answered",
                   registries_covered=[], registries_missing=sorted(rows))
    complete = len(answered) == len(rows) and all(r["state"] == "READ" for r in rows.values())
    missing = sorted(set(rows) - set(answered))
    partial_regs = sorted(k for k, r in rows.items() if r["state"] == "PARTIAL")
    out = row("READ" if complete else "PARTIAL", sum(r["value"] for r in answered.values()),
              "downloads", unit_window, covered, attempted, as_of,
              [r.get("source_url") for r in rows.values()],
              registries_covered=sorted(answered),
              **({"registries_missing": missing} if missing else {}),
              **({"registries_partial": partial_regs} if partial_regs else {}))
    if not complete:
        out["reason"] = ("not every counter answered in full; the value is a lower bound over "
                         f"{covered} of {attempted} packages")
    return out


def by_entity(all_packages: list[dict], field: str, as_of: str) -> dict:
    out = {}
    for p in all_packages:
        e = p.get("entity", "unattributed")
        b = out.setdefault(e, {"value": 0, "covered": 0, "attempted": 0})
        b["attempted"] += 1
        if is_num(p.get(field)):
            b["value"] += p[field]
            b["covered"] += 1
    for e, b in out.items():
        b["state"] = "READ" if b["covered"] == b["attempted"] else ("UNCHECKABLE" if b["covered"] == 0 else "PARTIAL")
        if b["covered"] == 0:
            b["value"] = None
        b["as_of"] = as_of if b["covered"] else None
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--now", action="store_true", help="run regardless of the scheduler stamp (the scheduler stamps, not this script)")
    ap.add_argument("--list", default="/workspace/lanes/councilof-ai/public/interop/footprint-packages.json")
    ap.add_argument("--out-dir", default="/workspace/lanes/out/distribution")
    ap.add_argument("--pace", type=float, default=0.35, help="minimum seconds between requests")
    ap.add_argument("--retries", type=int, default=5)
    ap.add_argument("--cross-check", type=int, default=5)
    ap.add_argument("--limit", type=int, default=0, help="only the first N names per registry (smoke runs)")
    ap.add_argument("--registries", default="pypi,npm,huggingface")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    started = utcnow()
    listing = json.loads(Path(args.list).read_text())
    want = [r.strip() for r in args.registries.split(",") if r.strip()]

    def names(key):
        rows = listing.get(key, {}).get("packages", [])
        return rows[: args.limit] if args.limit else rows

    http = Http(pace=args.pace, retries=args.retries, verbose=args.verbose)
    registries: dict[str, dict] = {}
    if "pypi" in want:
        print(f"pypi: {len(names('pypi'))} packages …", file=sys.stderr)
        registries["pypi"] = measure_pypi(http, names("pypi"), started, args.cross_check)
    if "npm" in want:
        print(f"npm: {len(names('npm'))} packages …", file=sys.stderr)
        registries["npm"] = measure_npm(http, names("npm"), started)
    if "huggingface" in want:
        hf_authors = listing.get("huggingface", {}).get("accounts", ["csoai"])
        print(f"huggingface: authors {hf_authors} …", file=sys.stderr)
        registries["huggingface"] = measure_hf(http, hf_authors, started)

    as_of = iso(utcnow())
    all_packages = [p for r in registries.values() for p in r["packages"]]
    doc = {
        "schema": SCHEMA,
        "as_of": as_of,
        "measurement_started": iso(started),
        "max_age_hours": MAX_AGE_HOURS,
        "stale_after": iso(utcnow() + dt.timedelta(hours=MAX_AGE_HOURS)),
        "generator": "scripts/distribution-measure.py (runs as /workspace/lanes/loops/distribution-measure.py)",
        "host": "rp-3090-now",
        "package_list": {
            "path": "/interop/footprint-packages.json",
            "schema": listing.get("schema"),
            "as_of": listing.get("as_of"),
            "totals": listing.get("totals"),
        },
        "window_rule": ("30-day and cumulative are different windows over the same packages. They are "
                        "carried as separate fields and are never added to each other. Neither is a "
                        "count of people: mirrors, CI and crawlers are inside both."),
        "state_rule": ("READ: every counter in the fan-out answered. PARTIAL: some answered and the "
                       "value is a lower bound over those, with covered/attempted on the row. "
                       "UNCHECKABLE: a source exists and none of it answered; value null, never 0. "
                       "UNMEASURED: no source exists."),
        "requests": {"made": http.calls, "retried_after_429_or_5xx": http.retried, "pace_seconds": args.pace},
        "registries": {k: {"downloads_30d": v["downloads_30d"], "downloads_all_time": v["downloads_all_time"],
                           **({"cross_check": v["cross_check"]} if "cross_check" in v else {})}
                       for k, v in registries.items()},
        "totals": {
            "downloads_30d": roll_up(registries, "downloads_30d", "last 30 days, each registry over its own 30-day window", as_of),
            "downloads_all_time": roll_up(registries, "downloads_all_time", "cumulative, all time", as_of),
        },
        "by_entity": {
            "rule": ("CSOAI Ltd and MEOK AI Labs publish from one account and are labelled, never "
                     "filtered. The estate total is every row; each entity's share is printed beside it."),
            "downloads_30d": by_entity(all_packages, "downloads_30d", as_of),
            "downloads_all_time": by_entity(all_packages, "downloads_all_time", as_of),
        },
        "packages": sorted(all_packages, key=lambda p: (p["registry"], p["name"])),
    }

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    dated = out_dir / f"distribution-{started.strftime('%Y-%m-%d')}.json"
    latest = out_dir / "distribution-latest.json"
    text = json.dumps(doc, indent=2) + "\n"
    dated.write_text(text)
    latest.write_text(text)
    t30 = doc["totals"]["downloads_30d"]
    tall = doc["totals"]["downloads_all_time"]
    print(f"WROTE {dated}")
    print(f"WROTE {latest}")
    print(f"RESULT 30d={t30['state']}:{t30['value']} ({t30['covered']}/{t30['attempted']}) "
          f"all_time={tall['state']}:{tall['value']} ({tall['covered']}/{tall['attempted']}) "
          f"requests={http.calls} retried={http.retried}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
