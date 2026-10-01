#!/usr/bin/env python3
"""revenue_loop.py — the estate's money-loop producer (governor spec 06 Sep 2026 13:00Z).

Deterministic, stdlib-only. Reads live endpoints + committed files, emits
docs/growth/<date>/loop.json + loop.md and appends ONE EVOLVE section.

Truth rules (cannot lie or drift):
  · every number in loop.md comes from loop.json; loop.json from endpoints/files
  · --check fails if a past run's file drifted (D45 discipline)
  · self-settlements shown as "self", never in growth lines; one_number printed as-is
  · no prices/tiers/processor names; new-door proposals name the measurement only
  · no outbound sends; owner-gated moves become OWNER-ASKS lines

Usage:
  python3 scripts/growth/revenue_loop.py            # emit today's run
  python3 scripts/growth/revenue_loop.py --check    # verify emitted files match the current run byte-for-byte
"""
from __future__ import annotations

import argparse, base64, hashlib, json, pathlib, re, sys, time, urllib.error, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "growth"
SIGNAL_SEMANTICS = {
    "product_funnel": {
        "window": "lifetime aggregates plus separately reported rolling 30-day cohort",
        "source": "GET /api/revenue one_number.product_funnel; server-issued product IDs and aggregate counts",
        "does_not_prove": ["delivery", "buyer acceptance", "repeat use", "search inclusion", "causal attribution"],
    },
}

def getjson(url: str, timeout: int = 20):
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-loop/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())

def getjson_with_digest(url: str, timeout: int = 20):
    """Bind exact public response bytes into the local evidence receipt."""
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-loop/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read()
        return json.loads(raw), {
            "url": url, "http_status": getattr(r, "status", None),
            "content_type": r.headers.get("content-type"), "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
        }

def normalize_product_funnel(payload: object) -> dict:
    """Validate privacy-minimal product aggregates; missing data is never treated as zero."""
    empty = {
        "state": "UNAVAILABLE", "paid_settlements_by_product": None,
        "distinct_nonself_payers_by_product": None, "self_settlements_by_product": None,
        "paid_settlements_by_product_last_30d": None,
        "distinct_nonself_payers_by_product_last_30d": None,
        "repeat_nonself_payers_by_product_last_30d": None,
        "self_settlements_by_product_last_30d": None,
        "unclassified_external_paid_settlements": None, "window_days": None,
        "recent_window_state": "NOT_PUBLISHED",
        "does_not_prove": SIGNAL_SEMANTICS["product_funnel"]["does_not_prove"],
    }
    if not isinstance(payload, dict): return empty
    if payload.get("status") in {"UNMEASURED", "INCOMPLETE"}:
        return {**empty, "state": payload["status"]}
    if payload.get("status") != "MEASURED": return {**empty, "state": "UNRECOGNIZED_STATE"}
    id_pattern = re.compile(r"[A-Za-z0-9][A-Za-z0-9._:-]{0,99}")
    def count_map(value):
        if not isinstance(value, dict) or any(
            not isinstance(k, str) or not id_pattern.fullmatch(k)
            or not isinstance(v, int) or isinstance(v, bool) or v < 0
            for k, v in value.items()
        ): return None
        return dict(sorted(value.items()))
    base_fields = ("paid_settlements_by_product", "distinct_nonself_payers_by_product", "self_settlements_by_product")
    result = {name: count_map(payload.get(name)) for name in base_fields}
    unclassified = payload.get("unclassified_external_paid_settlements")
    if any(value is None for value in result.values()) or not isinstance(unclassified, int) or isinstance(unclassified, bool) or unclassified < 0:
        return {**empty, "state": "INVALID_SUMMARY"}
    recent_fields = (
        "paid_settlements_by_product_last_30d", "distinct_nonself_payers_by_product_last_30d",
        "repeat_nonself_payers_by_product_last_30d", "self_settlements_by_product_last_30d",
    )
    recent = [count_map(payload.get(name)) if name in payload else None for name in recent_fields]
    if any(value is not None for value in recent):
        if any(value is None for value in recent) or payload.get("window_days") != 30:
            return {**empty, "state": "INVALID_SUMMARY"}
        result.update(dict(zip(recent_fields, recent)))
        result.update(window_days=30, recent_window_state="MEASURED")
    else:
        result.update({name: None for name in recent_fields})
        result.update(window_days=None, recent_window_state="NOT_PUBLISHED")
    return {**empty, **result, "state": "MEASURED", "unclassified_external_paid_settlements": unclassified}

def normalize_latest_receipts(payload: object) -> dict:
    """Read the privacy-minimal aggregate feed without inventing zero or buyer counts."""
    empty = {
        "state": "UNAVAILABLE", "count": None, "demand_eligible_count": None,
        "internal_count": None, "zero_value_count": None,
        "window_limit": 50,
    }
    if not isinstance(payload, dict): return empty
    status = payload.get("status")
    if status == "UNRECORDED": return {**empty, "state": "UNRECORDED"}
    if status != "PUBLISHED": return {**empty, "state": "UNRECOGNIZED_STATE"}
    fields = ("count", "demand_eligible_count", "internal_count", "zero_value_count")
    values = [payload.get(name) for name in fields]
    if any(not isinstance(v, int) or isinstance(v, bool) or v < 0 for v in values):
        return {**empty, "state": "INVALID_SUMMARY"}
    return {**dict(zip(fields, values)), "state": "PUBLISHED", "window_limit": 50}

def normalize_settled_usdc(payload: object) -> dict:
    """Validate the actual non-self USDC amount; keep it distinct from payer counts."""
    empty = {"state": "UNAVAILABLE", "amount_atomic": None, "amount_usdc": None,
             "unit": "USDC atomic (6dp) on Base", "excludes_self": None}
    if not isinstance(payload, dict): return empty
    if payload.get("status") != "MEASURED": return {**empty, "state": str(payload.get("status", "UNRECOGNIZED_STATE"))}
    amount = payload.get("count")
    if not isinstance(amount, int) or isinstance(amount, bool) or amount < 0:
        return {**empty, "state": "INVALID_SUMMARY"}
    if payload.get("unit") != empty["unit"] or payload.get("excludes_self") is not True:
        return {**empty, "state": "INVALID_SUMMARY"}
    whole, fraction = divmod(amount, 1_000_000)
    decimal = f"{whole}.{fraction:06d}".rstrip("0").rstrip(".")
    return {"state": "MEASURED", "amount_atomic": amount,
            "amount_usdc": decimal or "0", "unit": empty["unit"], "excludes_self": True}

def normalize_x402_catalog(payload: object, catalog: str) -> dict:
    """Summarize index-owned rows without promoting a listing to demand or settlement."""
    empty = {
        "state": "UNAVAILABLE", "catalog": catalog, "as_of": None,
        "declared_total": None, "scanned": None, "pages": None,
        "absence_determinate": None, "listed_resources": None,
        "distinct_routes": None, "route_keys": None, "x402_version_counts": None,
        "health_status_counts": None, "probe_status_counts": None,
        "domain_verified_counts": None, "last_updated_min": None,
        "last_updated_max": None,
        "does_not_prove": ["settlement", "revenue", "independent demand", "delivery", "buyer acceptance"],
    }
    if not isinstance(payload, dict):
        return empty
    kind = payload.get("kind")
    if kind not in {"MEASURED", "UNCHECKABLE"}:
        return {**empty, "state": "UNRECOGNIZED_STATE"}
    rows = payload.get("rows")
    integer_fields = ("declared_total", "scanned", "pages")
    if not isinstance(rows, list) or any(
        not isinstance(payload.get(k), int) or isinstance(payload.get(k), bool) or payload[k] < 0
        for k in integer_fields
    ) or not isinstance(payload.get("absence_determinate"), bool):
        return {**empty, "state": "INVALID_SUMMARY"}
    if kind == "MEASURED" and (
        payload["scanned"] != payload["declared_total"]
        or payload["absence_determinate"] is not True
        or (payload["scanned"] > 0 and payload["pages"] == 0)
    ):
        return {**empty, "state": "INCONSISTENT_SUMMARY"}
    count_fields = {}
    if catalog == "PayAI":
        count_fields["x402_version_counts"] = "x402_version"
        update_field = "last_updated"
    elif catalog == "402 Index":
        count_fields["health_status_counts"] = "health_status"
        count_fields["probe_status_counts"] = "probe_status"
        count_fields["domain_verified_counts"] = "domain_verified"
        update_field = None
    else:
        return {**empty, "state": "UNSUPPORTED_CATALOG"}
    if any(not isinstance(row, dict) for row in rows):
        return {**empty, "state": "INVALID_SUMMARY"}
    routes = [row.get("route_key") for row in rows]
    if any(not isinstance(route, str) or not route for route in routes):
        return {**empty, "state": "INVALID_SUMMARY"}
    result = {
        **empty, "state": kind, "as_of": payload.get("as_of"),
        "declared_total": payload["declared_total"], "scanned": payload["scanned"],
        "pages": payload["pages"], "absence_determinate": payload["absence_determinate"],
        "listed_resources": len(rows), "distinct_routes": len(set(routes)),
        "route_keys": sorted(set(routes)),
    }
    for output_field, source_field in count_fields.items():
        counts = {}
        for row in rows:
            value = row.get(source_field)
            if source_field == "domain_verified":
                value = "true" if value is True else "false" if value is False else "unknown"
            elif isinstance(value, bool):
                value = str(value).lower()
            elif value is None:
                value = "unknown"
            else:
                value = str(value)
            counts[value] = counts.get(value, 0) + 1
        result[output_field] = dict(sorted(counts.items()))
    if update_field:
        updates = sorted(row[update_field] for row in rows if isinstance(row.get(update_field), str))
        result["last_updated_min"] = updates[0] if updates else None
        result["last_updated_max"] = updates[-1] if updates else None
    return result

def read_x402_catalogues(source_reads: dict) -> dict:
    """Read public full-scan catalogue monitors and retain exact source digests."""
    endpoints = {
        "payai": ("PayAI", "https://councilof.ai/api/x402-listing"),
        "index402": ("402 Index", "https://councilof.ai/api/x402-listing-402index"),
    }
    def read_one(item):
        key, (catalog, url) = item
        try:
            payload, digest = getjson_with_digest(url, timeout=25)
            return key, normalize_x402_catalog(payload, catalog), digest
        except Exception as exc:
            return key, normalize_x402_catalog(None, catalog), {"state": "UNAVAILABLE", "error": str(exc)[:120]}
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(read_one, endpoints.items()))
    result = {}
    for key, summary, digest in results:
        source_reads["x402_catalog:" + key] = digest
        result[key] = summary
    payai = set(result["payai"].get("route_keys") or [])
    index402 = set(result["index402"].get("route_keys") or [])
    complete = result["payai"]["state"] == "MEASURED" and result["index402"]["state"] == "MEASURED"
    result["cross_catalogue"] = {
        "state": "MEASURED" if complete else "INCOMPLETE",
        "overlap_route_count": len(payai & index402),
        "payai_only_route_keys": sorted(payai - index402),
        "index402_only_route_keys": sorted(index402 - payai),
        "note": "Cross-catalogue differences are discovery leads only. A directory row does not prove a conformant current challenge, settlement, demand, or endorsement.",
    }
    return result

def _x402_route_result(url: str, status: int, headers, body: bytes) -> dict:
    """Keep route telemetry to status, hashes, and challenge-shape bits; never retain offers."""
    payment = headers.get("payment-required") if headers else None
    version, bazaar, parse_state = None, None, "NOT_APPLICABLE"
    if payment:
        try:
            padding = "=" * (-len(payment) % 4)
            challenge = json.loads(base64.urlsafe_b64decode(payment + padding))
            version = challenge.get("x402Version")
            bazaar = isinstance((challenge.get("extensions") or {}).get("bazaar"), dict)
            parse_state = "PARSED"
        except Exception:
            parse_state = "INVALID"
    redirect = headers.get("location") if headers else None
    redirect_url = urllib.parse.urljoin(url, redirect) if redirect else None
    redirect_parsed = urllib.parse.urlsplit(redirect_url) if redirect_url else None
    try:
        redirect_port = redirect_parsed.port if redirect_parsed else None
    except ValueError:
        redirect_port = -1
    redirect_allowed = bool(redirect_parsed and redirect_parsed.scheme == "https"
                            and redirect_parsed.hostname in {"councilof.ai", "www.councilof.ai", "csoai.org", "www.csoai.org"}
                            and redirect_port in (None, 443)
                            and not redirect_parsed.username and not redirect_parsed.password
                            and not redirect_parsed.query and not redirect_parsed.fragment)
    if status == 402:
        state = "VALID_X402_V2_BAZAAR_CHALLENGE" if version == 2 and bazaar and parse_state == "PARSED" else "INVALID_OR_UNCHECKABLE_CHALLENGE"
    elif status == 200:
        state = "PUBLIC_RESPONSE"
    elif status in {301, 302, 303, 307, 308}:
        state = "REDIRECT_REVIEW_REQUIRED"
    elif status in {400, 422}:
        state = "INPUT_REQUIRED_OR_REJECTED"
    else:
        state = f"HTTP_{status}"
    return {
        "url": url, "http_status": status, "state": state,
        "payment_required_present": bool(payment), "x402_version": version,
        "bazaar_extension_present": bazaar, "challenge_parse_state": parse_state,
        "sampled_body_bytes": len(body),
        "sampled_body_sha256": hashlib.sha256(body).hexdigest(),
        "redirect_target_state": "SAME_OWNED_HOST_NO_QUERY" if redirect_allowed else "WITHHELD_OR_MISSING" if redirect else "NONE",
        "redirect_target": urllib.parse.urlunsplit((redirect_parsed.scheme, redirect_parsed.netloc, redirect_parsed.path, "", "")) if redirect_allowed else None,
    }

class _NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Keep route probes on the exact catalogue URL until redirects are reviewed."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def probe_x402_route(url: str, timeout: int = 8) -> dict:
    """Issue one anonymous GET only to an explicitly allowlisted CSOAI host."""
    allowed_hosts = {"councilof.ai", "www.councilof.ai", "csoai.org", "www.csoai.org"}
    try:
        parsed = urllib.parse.urlsplit(url)
        port = parsed.port
    except ValueError:
        parsed, port = None, -1
    display_url = (urllib.parse.urlunsplit((parsed.scheme, parsed.hostname or "", parsed.path, "", ""))
                   if parsed else "[invalid-url]")
    if (not parsed or parsed.scheme != "https" or parsed.hostname not in allowed_hosts
            or port not in (None, 443) or parsed.username or parsed.password
            or parsed.query or parsed.fragment):
        return {"url": display_url, "state": "NOT_PROBED_UNTRUSTED_OR_UNSUPPORTED_URL",
                "reason": "host, port, userinfo, query, fragment or URL syntax failed the anonymous-read policy"}
    req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-loop/1.0", "Accept": "application/json"}, method="GET")
    try:
        # urllib's default opener follows cross-host redirects. Do not let an
        # untrusted catalogue endpoint turn a first-party probe into an outbound fetch.
        opener = urllib.request.build_opener(_NoRedirectHandler)
        with opener.open(req, timeout=timeout) as response:
            return _x402_route_result(display_url, response.status, response.headers, response.read(32768))
    except urllib.error.HTTPError as error:
        try:
            return _x402_route_result(display_url, error.code, error.headers, error.read(32768))
        finally:
            error.close()
    except Exception as error:
        return {"url": display_url, "state": "UNAVAILABLE", "error": type(error).__name__}

def read_x402_route_probes(catalogues: dict) -> dict:
    """Recheck current first-party route behavior; never pay, POST, or store challenge tokens."""
    cross = catalogues.get("cross_catalogue", {})
    if cross.get("state") != "MEASURED":
        return {"state": "UNCHECKABLE", "route_count": None, "routes": [],
                "reason": "both catalogue scans must be complete before route-level comparison"}
    routes = sorted(set((catalogues.get("payai") or {}).get("route_keys") or [])
                    | set((catalogues.get("index402") or {}).get("route_keys") or []))
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(probe_x402_route, routes))
    states = {}
    for result in results:
        state = result.get("state", "UNAVAILABLE")
        states[state] = states.get(state, 0) + 1
    checked = all(result.get("state") not in {"UNAVAILABLE", "NOT_PROBED_UNTRUSTED_OR_UNSUPPORTED_URL"}
                  for result in results)
    return {"state": "MEASURED" if checked else "PARTIAL", "route_count": len(routes),
            "route_states": dict(sorted(states.items())), "routes": results,
            "limits": ["anonymous GET only", "no payment or mutation", "response hash covers at most 32768 bytes",
                       "payment-required values and offer signatures are not retained"]}

def derive_x402_route_actions(route_probes: dict) -> list[dict]:
    """Create review work for route states outside the measured public/challenge/input set."""
    if route_probes.get("state") != "MEASURED":
        return [{"state": "X402_ROUTE_MONITOR_UNCHECKABLE",
                 "action": "restore complete first-party route readbacks before making x402 distribution claims",
                 "evidence": f"route_probe_state={route_probes.get('state')}; route_count={route_probes.get('route_count')}"}]
    expected = {"VALID_X402_V2_BAZAAR_CHALLENGE", "PUBLIC_RESPONSE", "INPUT_REQUIRED_OR_REJECTED"}
    states = route_probes.get("route_states") or {}
    unexpected = {state: count for state, count in states.items() if state not in expected and count}
    if not unexpected:
        return []
    routes = [row.get("url") for row in route_probes.get("routes", [])
              if row.get("state") in unexpected]
    return [{"state": "X402_ROUTE_REVIEW_REQUIRED",
             "action": "inspect non-challenge route responses and correct the endpoint or catalogue metadata before widening distribution",
             "evidence": f"unexpected_route_states={json.dumps(unexpected, sort_keys=True)}; affected_routes={routes[:5]}"}]

def load_growth_baseline(path: pathlib.Path | None) -> dict:
    """Load only a receipt-verified prior run and preserve source/metric provenance."""
    empty = {"state": "BASELINE_MISSING", "as_of": None, "payer_count": None,
             "settled_usdc_atomic": None, "source_url": None, "source_sha256": None,
             "definition": None, "settled_usdc_unit": None,
             "loop_sha256": None, "receipt_sha256": None}
    if path is None: return empty
    day_out = path if path.is_dir() else path.parent
    ok, reason = check_receipt(day_out)
    if not ok: return {**empty, "state": "BASELINE_REJECTED", "reason": reason}
    try:
        loop = json.loads((day_out / "loop.json").read_text())
        one = loop.get("one_number") or {}
        source = (loop.get("source_reads") or {}).get("revenue") or {}
        payer_count = one.get("value")
        settled_atomic = one.get("settled_usdc_atomic")
        if settled_atomic is None:
            settled_atomic = ((loop.get("settled_usdc") or {}).get("amount_atomic"))
        if (one.get("status") != "MEASURED" or not isinstance(payer_count, int)
                or isinstance(payer_count, bool) or not isinstance(settled_atomic, int)
                or isinstance(settled_atomic, bool) or not isinstance(source.get("sha256"), str)
                or not isinstance(source.get("url"), str)):
            return {**empty, "state": "BASELINE_REJECTED", "reason": "prior run lacks measured payer and settled-USDC values with source binding"}
        return {"state": "MEASURED", "as_of": loop.get("as_of"), "payer_count": payer_count,
                "settled_usdc_atomic": settled_atomic, "source_url": source["url"],
                "source_sha256": source["sha256"], "definition": one.get("definition"),
                "settled_usdc_unit": (loop.get("settled_usdc") or {}).get("unit"),
                "loop_sha256": hashlib.sha256((day_out / "loop.json").read_bytes()).hexdigest(),
                "receipt_sha256": hashlib.sha256((day_out / "loop.receipt.json").read_bytes()).hexdigest()}
    except Exception as exc:
        return {**empty, "state": "BASELINE_REJECTED", "reason": type(exc).__name__}

def compare_growth_metrics(current_one: dict, current_settled: dict, current_source: dict, baseline: dict) -> dict:
    """Compare payer count and settled amount only when their measured sources align."""
    if baseline.get("state") != "MEASURED": return {"state": baseline.get("state", "BASELINE_MISSING"), "payer_count_delta": None, "settled_usdc_atomic_delta": None}
    if current_one.get("status") != "MEASURED" or current_settled.get("state") != "MEASURED":
        return {"state": "CURRENT_MEASUREMENT_UNAVAILABLE", "payer_count_delta": None, "settled_usdc_atomic_delta": None}
    if current_source.get("url") != baseline.get("source_url"):
        return {"state": "SOURCE_MISMATCH", "payer_count_delta": None, "settled_usdc_atomic_delta": None}
    same_definition = (
        isinstance(baseline.get("definition"), str)
        and baseline.get("definition") == current_one.get("definition")
        and baseline.get("settled_usdc_unit") == current_settled.get("unit")
    )
    identical_source = current_source.get("sha256") == baseline.get("source_sha256")
    if not same_definition and not identical_source:
        return {"state": "SOURCE_DEFINITION_CHANGED_OR_MISSING", "payer_count_delta": None, "settled_usdc_atomic_delta": None,
                "baseline_source_sha256": baseline.get("source_sha256"), "current_source_sha256": current_source.get("sha256")}
    payer_delta = current_one.get("all_time") - baseline["payer_count"]
    amount_delta = current_settled["amount_atomic"] - baseline["settled_usdc_atomic"]
    return {"state": "COMPARABLE_SAME_DEFINITION" if same_definition else "COMPARABLE_IDENTICAL_SOURCE",
            "comparison_basis": "same_measurement_definition_and_unit" if same_definition else "identical_source_bytes",
            "baseline_as_of": baseline.get("as_of"),
            "baseline_loop_sha256": baseline.get("loop_sha256"),
            "baseline_receipt_sha256": baseline.get("receipt_sha256"),
            "baseline_source_sha256": baseline.get("source_sha256"),
            "current_source_sha256": current_source.get("sha256"),
            "payer_count_delta": payer_delta, "settled_usdc_atomic_delta": amount_delta,
            "payer_count_state": "UP" if payer_delta > 0 else "DOWN" if payer_delta < 0 else "UNCHANGED",
            "settled_usdc_state": "UP" if amount_delta > 0 else "DOWN" if amount_delta < 0 else "UNCHANGED"}

def normalize_mcp_registry_search(server_name: str, payload: object) -> dict:
    """Keep official MCP Registry reachability distinct from an exact published listing."""
    empty = {"state": "UNAVAILABLE", "server_name": server_name, "versions": [], "latest_active_version": None}
    if not isinstance(payload, dict) or not isinstance(payload.get("servers"), list): return empty
    found = []
    for item in payload["servers"]:
        if not isinstance(item, dict) or not isinstance(item.get("server"), dict): continue
        server = item["server"]
        if server.get("name") != server_name: continue
        official = (item.get("_meta") or {}).get("io.modelcontextprotocol.registry/official", {})
        found.append({"version": server.get("version"), "status": official.get("status", "UNKNOWN")})
    found = [row for row in found if isinstance(row["version"], str)]
    active = [row["version"] for row in found if row["status"] == "active"]
    def version_key(value):
        return tuple((0, int(part)) if part.isdigit() else (1, part.lower()) for part in re.split(r"[.+-]", value))
    latest = max(active, key=version_key) if active else None
    return {"state": "MEASURED" if found else "MEASURED_NOT_LISTED", "server_name": server_name,
            "versions": sorted(found, key=lambda row: version_key(row["version"])), "latest_active_version": latest}

def read_official_mcp_registry(source_reads: dict) -> dict:
    """Read the public official registry for the domain and GitHub namespace entries."""
    names = ("ai.councilof/gspc", "io.github.CSOAI-ORG/gspc")
    def read_one(name):
        url = "https://registry.modelcontextprotocol.io/v0.1/servers?search=" + urllib.parse.quote(name, safe="")
        try:
            payload, digest = getjson_with_digest(url, timeout=15)
            return name, normalize_mcp_registry_search(name, payload), digest
        except Exception as exc:
            return name, {"state": "UNAVAILABLE", "server_name": name, "versions": [], "latest_active_version": None}, {"state": "UNAVAILABLE", "error": str(exc)[:120]}
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(read_one, names))
    for name, _, digest in results:
        source_reads["mcp_registry:" + name] = digest
    results = {name: result for name, result, _ in results}
    return {"state": "MEASURED" if all(v["state"] != "UNAVAILABLE" for v in results.values()) else "INCOMPLETE",
            "entries": results}

def probe_public_indexes(urls: dict) -> dict:
    """Probe independent public distribution surfaces concurrently with bounded workers."""
    names = list(urls)
    with ThreadPoolExecutor(max_workers=min(4, max(1, len(names)))) as pool:
        statuses = list(pool.map(probe, [urls[name] for name in names]))
    return dict(zip(names, statuses))

def derive_product_growth_actions(funnel: dict) -> list[dict]:
    """Translate measured product cohorts into bounded next checks, not customer claims."""
    if funnel.get("state") != "MEASURED" or funnel.get("recent_window_state") != "MEASURED":
        return [{"state": "HOLD", "action": "hold product-level optimization until a complete 30-day product cohort is public", "evidence": f"funnel={funnel.get('state')}; recent_window={funnel.get('recent_window_state')}"}]
    paid = funnel.get("paid_settlements_by_product_last_30d") or {}
    payers = funnel.get("distinct_nonself_payers_by_product_last_30d") or {}
    repeats = funnel.get("repeat_nonself_payers_by_product_last_30d") or {}
    products = sorted(set(paid) | set(payers) | set(repeats))
    if not products:
        return [{"state": "MEASURED_NO_RECENT_EXTERNAL_PAID_SIGNAL", "action": "validate one existing offer-to-delivery path with an opted-in external user before adding more listings", "evidence": "rolling_30_day_product_cohort is empty"}]
    actions = []
    for product in products:
        settlement_count, payer_count, repeat_count = paid.get(product, 0), payers.get(product, 0), repeats.get(product, 0)
        if settlement_count and not payer_count:
            state, action = "PAYER_ATTRIBUTION_GAP", "repair payer attribution before making a demand claim"
        elif repeat_count:
            state, action = "REPEAT_SIGNAL_REQUIRES_DELIVERY_VALIDATION", "verify delivered artifact and buyer acceptance before expanding distribution"
        elif payer_count:
            state, action = "FIRST_USE_REQUIRES_FOLLOW_THROUGH", "validate first-use delivery and acceptance, then observe repeat use before scaling"
        else:
            state, action = "NO_RECENT_PAID_SIGNAL", "inspect offer and discovery path; no paid demand is measured in the window"
        actions.append({"product_id": product, "state": state, "paid_settlements": settlement_count,
                        "distinct_external_payers": payer_count, "repeat_external_payers": repeat_count, "action": action})
    return actions[:10]

def check_receipt(day_out: pathlib.Path, expected_date: str | None = None) -> tuple[bool, str]:
    """Read-only exact-byte check; never refreshes or rewrites evidence."""
    paths = {name: day_out / name for name in ("loop.json", "loop.md", "loop.receipt.json")}
    missing = [name for name, path in paths.items() if not path.is_file()]
    if missing: return False, "missing output(s): " + ", ".join(missing)
    try: receipt = json.loads(paths["loop.receipt.json"].read_text())
    except Exception as exc: return False, f"invalid receipt: {type(exc).__name__}"
    if receipt.get("schema") != "csoai.growth-loop-receipt/1.0" or (expected_date and receipt.get("date") != expected_date):
        return False, "receipt schema/date mismatch"
    expected = receipt.get("files")
    if not isinstance(expected, dict): return False, "receipt files map missing"
    drift = [name for name in ("loop.json", "loop.md") if expected.get(name) != hashlib.sha256(paths[name].read_bytes()).hexdigest()]
    return (False, "byte drift: " + ", ".join(drift)) if drift else (True, "exact output hashes match receipt")

def probe(url: str, timeout: int = 12):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-growth-loop/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--out", type=pathlib.Path, help="separate immutable run directory")
    ap.add_argument("--baseline", type=pathlib.Path, help="receipt-verified prior growth run directory or loop.json")
    ap.add_argument("--no-evolve", action="store_true", help="do not append the legacy EVOLVE log")
    args = ap.parse_args()

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    day_out = args.out if args.out is not None else OUT / today
    jp, mp, rp = day_out / "loop.json", day_out / "loop.md", day_out / "loop.receipt.json"

    if args.check:
        ok, message = check_receipt(day_out, today if args.out is None else None)
        print(("check ok: " if ok else "check failed: ") + message)
        return 0 if ok else 2
    if any(path.exists() for path in (jp, mp, rp)):
        print(f"refusing to overwrite existing run {day_out}", file=sys.stderr)
        return 3

    # ── inputs ────────────────────────────────────────────────────────────────
    source_reads = {}
    try: revenue, source_reads["revenue"] = getjson_with_digest("https://councilof.ai/api/revenue")
    except Exception as e:
        revenue, source_reads["revenue"] = {}, {"state": "UNAVAILABLE", "error": str(e)[:120]}
    try:
        receipts_raw, source_reads["receipts"] = getjson_with_digest("https://councilof.ai/api/receipts/latest")
        receipts = normalize_latest_receipts(receipts_raw)
    except Exception as e:
        receipts = normalize_latest_receipts(None)
        source_reads["receipts"] = {"state": "UNAVAILABLE", "error": str(e)[:120]}
    try:
        state = getjson("https://councilof.ai/api/state")
        pub = (state.get("public_count") or {}).get("value")
    except Exception:
        pub = None

    # census: latest analysis files (committed)
    census = {}
    for p in sorted(ROOT.glob("docs/product/x402-settlement-census-*-2026-09-06.summary.json")):
        try:
            census[p.name] = json.loads(p.read_text())
        except Exception:
            pass

    one = revenue.get("one_number", {}) if isinstance(revenue, dict) else {}
    product_funnel = normalize_product_funnel(one.get("product_funnel"))
    product_growth_actions = derive_product_growth_actions(product_funnel)
    settled_usdc = normalize_settled_usdc(revenue.get("settled_usdc") if isinstance(revenue, dict) else None)

    loop = {
        "schema": "csoai.growth-loop/0.1",
        "date": today,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source_reads": source_reads,
        "one_number": {
            "value": one.get("all_time"), "last_30d": one.get("last_30d"),
            "settlements": one.get("settlements"), "self_settlements": one.get("self_settlements"),
            "settled_usdc_atomic": one.get("settled_usdc_atomic"), "definition": one.get("definition"),
            "zero_value_settlements": one.get("zero_value_settlements"),
            "status": one.get("status"),
            "gate": revenue.get("gates") if isinstance(revenue, dict) else None,
        },
        "funnel_per_door": {
            "product_funnel": product_funnel,
            "product_growth_actions": product_growth_actions,
            "latest_receipts": receipts,
            "note": "Aggregate latest feed covers at most 50 receipts; demand-eligible receipts are not distinct buyers, delivery, acceptance, or revenue.",
        },
        "signals": {
            "board_lid": pub,
            "census_files": {k: v.get("usdc_spent") for k, v in census.items()},
            "index_probes": {},
            "hf_downloads": {},
            "pypi_downloads": {},
        },
        "costs": {
            "census_usdc_spent": next((v.get("usdc_spent") for v in census.values() if v.get("usdc_spent")), None),
        },
        "next_moves": [],
        "retro": [],
    }

    loop["signals"]["index_probes"] = probe_public_indexes({
        "mcp_so": "https://mcp.so/",
        "mcpservers": "https://mcpservers.org/",
        "pulsemcp": "https://www.pulsemcp.com/submit",
        "glama": "https://glama.ai/mcp/servers/submit",
        "arcade": "https://arcade.dev/",
        "hf_dataset": "https://huggingface.co/api/datasets/csoai/x402-settlement-census",
    })

    prior_runs = sorted(p for p in OUT.glob("20*/loop.json")) if OUT.exists() else []
    baseline_path = args.baseline if args.baseline is not None else (prior_runs[-1] if prior_runs else None)
    baseline = load_growth_baseline(baseline_path)
    loop["settled_usdc"] = settled_usdc
    loop["growth_comparison"] = compare_growth_metrics(one, settled_usdc, source_reads.get("revenue", {}), baseline)
    loop["baseline"] = baseline

    loop["signals"]["official_mcp_registry"] = read_official_mcp_registry(source_reads)
    # Catalogue presence is a discovery signal, not a money signal. Preserve the
    # exact response hashes and let the crosswalk create only targeted review work.
    loop["signals"]["x402_catalogues"] = read_x402_catalogues(source_reads)
    loop["signals"]["x402_route_probes"] = read_x402_route_probes(loop["signals"]["x402_catalogues"])

    # HF + PyPI downloads (public APIs, 7-day deltas where available)
    try:
        hf = getjson("https://huggingface.co/api/datasets/csoai/x402-settlement-census")
        loop["signals"]["hf_downloads"] = {"x402-settlement-census": hf.get("downloads")}
    except Exception:
        pass
    for pkg in ("meok-watermark-attest-mcp", "csoai-axis-engine"):
        try:
            p = getjson(f"https://pypistats.org/api/packages/{pkg}/recent")
            loop["signals"]["pypi_downloads"][pkg] = p.get("data", {}).get("last_week")
        except Exception:
            loop["signals"]["pypi_downloads"][pkg] = None

    # Compare the current payer count with the last committed run. A non-zero
    # cumulative count is not movement by itself; only a real increase opens
    # the next door.
    # ── next moves: fixed rule set, ranked by signal ÷ cost, each with PROOF ──
    moves = []
    onv = one.get("all_time")
    if onv is None:
        moves.append({"rank": 1, "move": "no REVENUE_KV bound or no settlement recorded — confirm the rail's settlement path is recording (blocked-at-measurement)",
                      "proof": f"one_number.all_time={onv!r}", "owner": False})
    elif onv == 0:
        issued = receipts.get("count")
        moves.append({"rank": 1, "move": "one_number=0 and settles exist → shape-or-price leak; do not add doors; run the index-presence row (402s not discovered)",
                      "proof": f"settles={issued}; one_number={onv}", "owner": False})
        moves.append({"rank": 2, "move": "index listing state probe (mcp_so/pulsemcp/glama/arcade = codes above) → row for any non-200",
                      "proof": json.dumps(loop["signals"]["index_probes"]), "owner": False})
    else:
        comparison = loop["growth_comparison"]
        if comparison.get("state", "").startswith("COMPARABLE_"):
            payer_delta = comparison["payer_count_delta"]
            if payer_delta > 0:
                state, action = "NEW_EXTERNAL_PAYER_SIGNAL", "trace the newly measured payer through verified delivery and explicit acceptance before widening distribution"
            elif payer_delta < 0:
                state, action = "PAYER_COUNT_DECREASE", "inspect source corrections and payer attribution; do not relabel the delta as revenue loss without amount evidence"
            else:
                state, action = "NO_NEW_PAYER_SIGNAL", "hold channel expansion; complete the existing external delivery and acceptance path, then repeat the same source read"
            moves.append({"rank": 1, "state": state, "move": action,
                          "proof": f"payer count delta={payer_delta}; settled USDC atomic delta={comparison['settled_usdc_atomic_delta']}; source={comparison.get('current_source_sha256', comparison.get('source_sha256'))}", "owner": False})
        else:
            moves.append({"rank": 1, "state": comparison.get("state", "BASELINE_MISSING"),
                          "move": "capture a receipt-verified comparable baseline before claiming growth or flat performance",
                          "proof": f"comparison={comparison.get('state')}; current distinct external payers={onv}", "owner": False})
    if one.get("self_settlements"):
        moves.append({"rank": 3, "move": "self-settlements recorded — shown as self, never growth",
                      "proof": f"self={one.get('self_settlements')}", "owner": False})
    registry_entries = loop["signals"]["official_mcp_registry"].get("entries", {})
    domain_version = (registry_entries.get("ai.councilof/gspc") or {}).get("latest_active_version")
    github_version = (registry_entries.get("io.github.CSOAI-ORG/gspc") or {}).get("latest_active_version")
    if domain_version and github_version and domain_version != github_version:
        moves.append({"rank": 4, "move": "review the active MCP Registry namespace version drift; update the GitHub-namespaced mirror or deprecate it so discovery has one current version",
                      "proof": f"ai.councilof/gspc={domain_version}; io.github.CSOAI-ORG/gspc={github_version}", "owner": True})
    catalogues = loop["signals"]["x402_catalogues"]
    cross = catalogues.get("cross_catalogue", {})
    route_probes = loop["signals"]["x402_route_probes"]
    route_states = route_probes.get("route_states") or {}
    for action in derive_x402_route_actions(route_probes):
        moves.append({"rank": 1, "state": action["state"], "move": action["action"],
                      "proof": action["evidence"], "owner": False})
    domain_counts = (catalogues.get("index402") or {}).get("domain_verified_counts") or {}
    if cross.get("state") == "MEASURED":
        gaps = cross.get("index402_only_route_keys") or []
        if gaps:
            moves.append({"rank": 2, "state": "X402_CATALOGUE_CROSSWALK",
                          "move": "inspect 402 Index-only route metadata and live challenge behavior before deciding whether any catalogue correction is warranted",
                          "proof": f"402 Index-only routes={len(gaps)}; PayAI and 402 Index scans are complete; directory differences are leads, not demand", "owner": False})
        bad_challenges = route_states.get("INVALID_OR_UNCHECKABLE_CHALLENGE", 0)
        unavailable_routes = route_states.get("UNAVAILABLE", 0)
        if bad_challenges or unavailable_routes:
            moves.append({"rank": 2, "state": "X402_ROUTE_RECHECK_REQUIRED",
                          "move": "inspect first-party x402 routes whose anonymous challenge could not be validated before widening distribution",
                          "proof": f"invalid_or_uncheckable_challenges={bad_challenges}; unavailable_routes={unavailable_routes}; probes={route_probes.get('route_count')}", "owner": False})
        unverified = domain_counts.get("false", 0)
        if unverified:
            moves.append({"rank": 4, "state": "DOMAIN_VERIFICATION_OWNER_REVIEW",
                          "move": "review the documented 402 Index domain-claim process and decide whether to prove control of an eligible listed host",
                          "proof": f"402 Index rows with domain_verified=false={unverified}; verification needs a domain challenge and owner-controlled site change", "owner": True})
    # grants window (Monetisation map status column)
    mon = ROOT / "docs" / "grants" / "2026-09-06" / "MONETISATION-MAP.md"
    if mon.exists():
        open_now = [l for l in mon.read_text(errors="replace").splitlines() if "open" in l.lower()]
        if open_now:
            moves.append({"rank": 4, "move": "open grant window on the map — TUI-5 pack row",
                          "proof": f"{len(open_now)} line(s) say open", "owner": True})
    if product_growth_actions and product_growth_actions[0].get("state") == "MEASURED_NO_RECENT_EXTERNAL_PAID_SIGNAL":
        moves.append({"rank": 2, "move": product_growth_actions[0]["action"], "proof": product_growth_actions[0]["evidence"], "owner": True})
    loop["next_moves"] = sorted(moves, key=lambda move: (move.get("rank", 99), move.get("state", ""), move.get("move", "")))[:5]

    # ── retro: compare against the previous run's moves (evolve half) ─────────
    if prior_runs:
        prev = json.loads(prior_runs[-1].read_text())
        cur_onv = onv
        prev_onv = (prev.get("one_number") or {}).get("value")
        loop["retro"].append({
            "prior_moves": len(prev.get("next_moves", [])),
            "one_number_before": prev_onv, "one_number_after": cur_onv,
            "moved": prev_onv != cur_onv,
        })

    jp.parent.mkdir(parents=True, exist_ok=True)
    jp.write_text(json.dumps(loop, indent=2))

    # ── loop.md (human section) + EVOLVE append ───────────────────────────────
    md = [f"# Growth loop — {today}", "",
          f"- distinct external payers: {onv} (last_30d {one.get('last_30d')}) · self settlements {one.get('self_settlements')} · zero-value settlements {one.get('zero_value_settlements')}",
          f"- externally settled: {settled_usdc.get('amount_usdc')} USDC · state {settled_usdc.get('state')} · trend {loop['growth_comparison'].get('state')}",
          f"- latest receipt feed: {receipts.get('state')} · records {receipts.get('count')} (max 50) · demand-eligible receipts {receipts.get('demand_eligible_count')} (not distinct buyers)",
          f"- product funnel: {product_funnel.get('state')} · recent window: {product_funnel.get('recent_window_state')} · decisions: {json.dumps(product_growth_actions, sort_keys=True)}",
          f"- official MCP Registry: {loop['signals']['official_mcp_registry']['state']}",
          f"- x402 catalogues: {catalogues.get('cross_catalogue', {}).get('state')} · overlap {cross.get('overlap_route_count')} routes · PayAI rows {(catalogues.get('payai') or {}).get('listed_resources')} · 402 Index rows {(catalogues.get('index402') or {}).get('listed_resources')} · domain verified {(domain_counts.get('true', 0))}/{sum(domain_counts.values()) if domain_counts else 0} (directory state, not sales)",
          f"- x402 route checks: {route_probes.get('state')} · {route_probes.get('route_count')} routes · states {json.dumps(route_states, sort_keys=True)} (anonymous GET; challenge-shape only)",
          f"- board lid: {pub}", "", "## Gates (verbatim)", ""]
    gates = revenue.get("gates") if isinstance(revenue, dict) else None
    if gates:
        for k, v in gates.items():
            md.append(f"- {k}: {v}")
    md += ["", "## Next moves (≤5, ranked)", ""]
    for m in loop["next_moves"]:
        md.append(f"- [{m['rank']}] {m['move']} — PROOF: {m['proof']}" + (" · owner" if m["owner"] else ""))
    md += ["", "## Retro", ""]
    for r in loop["retro"]:
        md.append(f"- one_number {r['one_number_before']} → {r['one_number_after']} · moved={r['moved']}")
    md.append("")
    mp.write_text("\n".join(md))

    receipt = {
        "schema": "csoai.growth-loop-receipt/1.0", "date": today,
        "generated_at": loop["as_of"], "state": "LOCAL_HASH_BOUND",
        "runner_sha256": hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),
        "files": {"loop.json": hashlib.sha256(jp.read_bytes()).hexdigest(), "loop.md": hashlib.sha256(mp.read_bytes()).hexdigest()},
        "limitations": ["hash binding detects byte drift; it is not a signature, public anchor, or independent validation"],
    }
    rp.write_text(json.dumps(receipt, indent=2) + "\n")

    evolve = ROOT / "csoai-reach-pack-01Sep2026" / "EVOLVE-05Sep2026.md"
    if evolve.exists() and not args.no_evolve:
        with evolve.open("a") as f:
            f.write(f"\n## GROWTH LOOP {today} — one_number={onv} · moves={len(loop['next_moves'])} (see docs/growth/{today}/loop.json)\n")
    print(f"emitted {jp} and {mp}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
