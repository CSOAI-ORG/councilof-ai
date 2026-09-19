#!/usr/bin/env python3
"""Bounded keyless refresh of frozen cohorts. No signing, publication, or inference.

Collector candidate derived from the private 2026-09-19 instrument whose SHA256
was 71feab9488e02ff36f88c0a8b868466f1417bd7c36dc4acbe7c8859412237fac.
This CLI adds source-pin verification and configurable staging; it is not the
exact instrument used for that retained observation and has not been run live.
Extraction results remain review candidates. Fetch success proves byte retrieval
only. A pre-existing output directory is refused to preserve prior evidence.
"""
import argparse, concurrent.futures, hashlib, importlib.util, json, shutil, subprocess, sys, time
import urllib.error, urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SOURCE = None
ROOT = None
REVISION = None
TOP_N = 25
START = time.monotonic()
TIMEOUT = 15
DEADLINE = 600
MAX_BYTES = 3 * 1024 * 1024
ENDPOINTS = ["https://xrplcluster.com/", "https://s1.ripple.com:51234/", "https://s2.ripple.com:51234/"]
INPUTS = ["scripts/build_stablecoin_deep.py", "scripts/xrpl_supply_measure.py",
          "scripts/adapters/xrpl_state_matrix.py", "scripts/adapters/swift_census_atoms.py",
          "public/interop/stablecoin-universe-2026-09/index.json",
          "public/interop/stablecoin-deep-2026-09/sources.json",
          "public/interop/xrpl-16.json", "public/interop/swift-census.json"]
def now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
def sha(raw):
    return hashlib.sha256(raw).hexdigest()
def write(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n")
def load(path):
    return json.loads(path.read_bytes())

def selected_stablecoin_ids(index, limit):
    ids = list(dict.fromkeys(str(x) for x in index.get("deep_measurement_queue", [])))
    for row in sorted(index["assets"], key=lambda r: float(r.get("priority_score") or 0), reverse=True):
        if str(row["id"]) not in ids:
            ids.append(str(row["id"]))
    return ids[:limit]

def setup():
    if ROOT.exists():
        raise RuntimeError("Refuse to overwrite an existing factory run")
    validated = {}
    for relative in INPUTS:
        raw = (SOURCE / relative).read_bytes()
        pinned = subprocess.run(["git", "-C", str(SOURCE), "show", REVISION + ":" + relative],
                                capture_output=True, check=True).stdout
        if raw != pinned:
            raise ValueError("input differs from requested source revision: " + relative)
        validated[relative] = raw
    ROOT.mkdir(parents=True)
    manifest = []
    for relative, raw in validated.items():
        target = ROOT / "inputs" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(raw)
        manifest.append({"path": relative, "sha256": sha(raw), "bytes": len(raw)})
    write(ROOT / "inputs-manifest.json", {"source_checkout": str(SOURCE), "revision": REVISION,
          "observed_at": now(), "files": manifest,
          "note": "Exact copied input bytes. Checkout has unrelated UX edits; these inputs are pinned individually."})

def fetch(lane, key, url, payload=None):
    at = now()
    out = ROOT / "raw" / lane
    out.mkdir(parents=True, exist_ok=True)
    meta = {"source_url": url, "retrieved_at": at, "request": payload,
            "status": "UNCHECKABLE", "http": None, "body_sha256": None, "bytes": None,
            "final_url": None, "error": None}
    body = None
    if time.monotonic() - START > DEADLINE:
        meta["error"] = "LANE_DEADLINE_EXHAUSTED"
    else:
        request = urllib.request.Request(url, data=None if payload is None else json.dumps(payload).encode(),
            headers={"User-Agent": "csoai-evidence-refresh/0.1", **({"Content-Type": "application/json"} if payload else {})})
        try:
            with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
                meta["http"] = response.status
                meta["final_url"] = response.geturl()
                body = response.read(MAX_BYTES + 1)
                meta["content_type"] = response.headers.get("Content-Type")
                meta["status"] = "FETCHED" if response.status == 200 else "UNCHECKABLE"
        except urllib.error.HTTPError as exc:
            meta["http"] = exc.code
            meta["error"] = "HTTP_" + str(exc.code)
            body = exc.read(MAX_BYTES + 1)
        except Exception as exc:
            meta["error"] = type(exc).__name__ + ": " + str(exc)[:240]
    if body is not None:
        if len(body) > MAX_BYTES:
            body = body[:MAX_BYTES]
            meta["status"] = "UNCHECKABLE"
            meta["error"] = "BODY_LIMIT_EXCEEDED_ARCHIVE_IS_PREFIX"
        name = key + ".body"
        (out / name).write_bytes(body)
        meta.update(body_sha256=sha(body), bytes=len(body), body_path=str((out / name).relative_to(ROOT)))
    write(out / (key + ".meta.json"), meta)
    return meta, body

def stablecoins():
    repo = ROOT / "stablecoins"
    for relative in INPUTS:
        if relative.startswith("public/interop/stablecoin"):
            dest = repo / relative
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / "inputs" / relative, dest)
    index_path = repo / "public/interop/stablecoin-universe-2026-09/index.json"
    index = load(index_path)
    selected = selected_stablecoin_ids(index, TOP_N)
    index["deep_measurement_queue"] = selected
    write(index_path, index)
    write(ROOT / "stablecoins/selection.json", {"ids": selected, "method": "frozen queue followed by descending frozen priority_score, deduplicated; first TOP_N",
        "input_index_sha256": sha((ROOT / "inputs/public/interop/stablecoin-universe-2026-09/index.json").read_bytes()),
        "selected_index_sha256": sha(index_path.read_bytes())})
    spec = importlib.util.spec_from_file_location("frozen_deep_builder", ROOT / "inputs/scripts/build_stablecoin_deep.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.TOP_N = TOP_N
    records = []
    def captured(url):
        meta, raw = fetch("stablecoins", "%03d" % (len(records) + 1), url)
        records.append(meta)
        if meta["status"] != "FETCHED":
            return meta["http"], None, meta["error"] or meta["status"]
        return meta["http"], raw, None
    module.fetch = captured
    old_argv = sys.argv
    try:
        sys.argv = ["build_stablecoin_deep.py", "--repo-root", str(repo)]
        module.main()
    finally:
        sys.argv = old_argv
    output = repo / module.DEEP_REL
    original = load(output)
    shutil.copy2(output, repo / "original-builder-output.json")
    original["cost"] = {"runner": "existing Runpod mill; no new infrastructure",
        "network_calls": len(records), "paid_endpoints": 0, "inference_calls": 0,
        "incremental_provider_charge": None, "note": "Existing pod charges not measured by this collector. No free-compute claim."}
    original["provenance"] = {"source_revision": REVISION, "builder_sha256": sha((ROOT / "inputs/scripts/build_stablecoin_deep.py").read_bytes()),
        "run_scope": "private observation; no published admission",
        "review_state": "EXTRACTION_CANDIDATES_REQUIRE_REVIEW",
        "override": "bounded TOP_N; captured fetch; actual runner cost metadata replaces historical GHA metadata",
        "raw_manifest": "../../raw/stablecoins"}
    write(output, original)
    return {"rows": len(original["rows"]), "states": dict(Counter(r["measurement_state"] for r in original["rows"])),
            "summary": original["summary"], "source_dates": [r["latest_report_date"] for r in original["rows"] if r["latest_report_date"]],
            "requests": len(records), "output": str(output.relative_to(ROOT))}

def rpc(method, params, key):
    errors = []
    for n, endpoint in enumerate(ENDPOINTS):
        meta, raw = fetch("xrpl", key + "-" + str(n), endpoint, {"method": method, "params": [params]})
        if meta["status"] == "FETCHED":
            try:
                result = json.loads(raw).get("result", {})
                if isinstance(result, dict) and not result.get("error") and result.get("status") != "error":
                    return result, meta, errors
                errors.append({"endpoint": endpoint, "reason": result.get("error") or result.get("error_message") or "MALFORMED_RESULT"})
            except Exception as exc:
                errors.append({"endpoint": endpoint, "reason": type(exc).__name__})
        else:
            errors.append({"endpoint": endpoint, "reason": meta["error"]})
    return None, None, errors

def valid_ledger(result, pin):
    return isinstance(result, dict) and result.get("validated") is True and result.get("ledger_hash") == pin["hash"] and result.get("ledger_index") == pin["index"]

def xrpl():
    seed = load(ROOT / "inputs/public/interop/xrpl-16.json")
    ledger, meta, errors = rpc("ledger", {"ledger_index": "validated", "transactions": False, "expand": False}, "ledger")
    pin = None
    if ledger and ledger.get("validated") is True:
        content = ledger.get("ledger", {})
        h = ledger.get("ledger_hash") or content.get("ledger_hash") or content.get("hash")
        i = ledger.get("ledger_index") or content.get("ledger_index")
        if isinstance(h, str) and len(h) == 64 and i is not None:
            pin = {"hash": h, "index": int(i)}
    rows = []
    for n, source in enumerate(seed["rows"]):
        row = {"name": source["name"], "issuer_address": source.get("r_address"),
            "identity_state": "REGISTRY_CLAIM_UNVERIFIED", "historical_source_claim": source,
            "account_state": "UNMEASURED", "obligations_state": "UNMEASURED",
            "supply": None, "reserve_state": "UNMEASURED", "attestation_state": "UNMEASURED",
            "publication_state": "UNPUBLISHED"}
        if not row["issuer_address"]:
            row["reason"] = "FROZEN_COHORT_HAS_NO_ISSUER_ADDRESS"
        elif not pin:
            row.update(account_state="UNCHECKABLE", obligations_state="UNCHECKABLE", reason="NO_VALIDATED_LEDGER_PIN")
        else:
            params = {"account": row["issuer_address"], "ledger_hash": pin["hash"], "strict": True}
            acct, ameta, aerrors = rpc("account_info", params, "account-%02d" % n)
            if valid_ledger(acct, pin) and acct.get("account_data", {}).get("Account") == row["issuer_address"]:
                data = acct["account_data"]
                row.update(account_state="OBSERVED", ledger=pin, account_data=data,
                    identity_state="ACCOUNT_OBSERVED_ISSUER_ATTRIBUTION_UNVERIFIED",
                    account_body_sha256=ameta["body_sha256"])
                bal, bmeta, berrors = rpc("gateway_balances", params, "obligations-%02d" % n)
                if valid_ledger(bal, pin) and bal.get("account") == row["issuer_address"]:
                    row.update(obligations_state="OBSERVED", obligations_by_currency=bal.get("obligations", {}),
                        obligations_body_sha256=bmeta["body_sha256"],
                        supply_reason="No asset-to-currency binding proved; account obligations are not an asset supply claim")
                else:
                    row.update(obligations_state="UNCHECKABLE", obligations_errors=berrors,
                        obligations_reason="NO_SUCCESSFUL_SAME_VALIDATED_LEDGER_RESPONSE")
            else:
                row.update(account_state="UNCHECKABLE", obligations_state="UNMEASURED", account_errors=aerrors,
                    reason="NO_SUCCESSFUL_SAME_VALIDATED_LEDGER_ACCOUNT_RESPONSE")
        rows.append(row)
    doc = {"schema": "csoai.factory-xrpl-frozen16-observation/0.1", "observed_at": now(),
        "source_cohort": "public/interop/xrpl-16.json; distinct from /api/xrpl 16", "source_as_of": seed["as_of"],
        "source_sha256": sha((ROOT / "inputs/public/interop/xrpl-16.json").read_bytes()),
        "ledger": pin, "ledger_errors": errors, "rows": rows, "writes_board": False,
        "meaning": "Account observations do not authenticate the issuer label or measure reserves, backing, safety or certification."}
    write(ROOT / "xrpl/observations.json", doc)
    return {"rows": len(rows), "account_states": dict(Counter(r["account_state"] for r in rows)),
        "obligations_states": dict(Counter(r["obligations_state"] for r in rows)), "ledger": pin,
        "output": "xrpl/observations.json"}

def swift():
    seed = load(ROOT / "inputs/public/interop/swift-census.json")
    results = {}
    for key, source in seed["sources"].items():
        meta, raw = fetch("swift", key, source["url"])
        results[key] = meta
    rows = [{"bank_id": row["id"], "name": row["name"], "source_ids": row["source"],
        "historical_source_status": row["status"], "historical_event_date": row.get("event_date"),
        "source_fetch_states": {k: results[k]["status"] for k in row["source"]},
        "status": "UNMEASURED", "content_claim_review": "NOT_PERFORMED",
        "not_a_client": True, "iso20022_state": "UNMEASURED", "settlement_state": "UNMEASURED"}
        for row in seed["rows"]]
    doc = {"schema": "csoai.factory-swift-source-refresh/0.1", "observed_at": now(),
        "source_as_of": seed["as_of"], "source_sha256": sha((ROOT / "inputs/public/interop/swift-census.json").read_bytes()),
        "rows": rows, "sources": results, "writes_board": False, "published": False,
        "meaning": "Fresh body retrieval only. Historical bank/event claims have not been revalidated. No client, partnership, pilot outcome or settlement evidence."}
    write(ROOT / "swift/observations.json", doc)
    return {"rows": len(rows), "states": {"UNMEASURED": len(rows)}, "source_fetch_states": dict(Counter(x["status"] for x in results.values())),
            "requests": len(results), "output": "swift/observations.json"}

def write_dispositions(results):
    """Stable source-key joins plus safe structured observations, never admission."""
    import re
    records = {}
    for lane in ("stablecoins", "xrpl", "swift"):
        records[lane] = []
        for path in sorted((ROOT / "raw" / lane).glob("*.meta.json")):
            meta = load(path)
            records[lane].append({"meta_path": str(path.relative_to(ROOT)),
                "meta_sha256": sha(path.read_bytes()), "body_path": meta.get("body_path"),
                "body_sha256": meta.get("body_sha256"), "source_url": meta["source_url"],
                "retrieved_at": meta["retrieved_at"], "http": meta["http"],
                "fetch_state": meta["status"], "request": meta.get("request"), "error": meta.get("error")})
    at, rows = now(), []
    def evidence(lane):
        relative = results.get(lane, {}).get("output")
        path = ROOT / relative if relative else None
        return (load(path), relative, sha(path.read_bytes())) if path and path.is_file() else ({}, None, None)
    def base(subject_id, key, family, state, refs, reason, ev, source_at):
        return {"subject_id": subject_id, "source_key": key, "family": family,
            "execution_state": state, "observed_at": max((r["retrieved_at"] for r in refs), default=at),
            "source_as_of": source_at, "raw_receipts": refs, "reason": reason,
            "evidence_path": ev[1], "evidence_sha256": ev[2], "evidence_row_key": key,
            "registry_admission": False}
    index = load(ROOT / "inputs/public/interop/stablecoin-universe-2026-09/index.json")
    sources = load(ROOT / "inputs/public/interop/stablecoin-deep-2026-09/sources.json")
    source_map = {str(r["id"]): r for r in sources["sources"]}
    ev = evidence("stablecoins")
    by_id = {str(r["id"]): r for r in ev[0].get("rows", [])}
    for key in selected_stablecoin_ids(index, TOP_N):
        row = by_id.get(key)
        url = source_map.get(key, {}).get("attestation_page")
        refs = [r for r in records["stablecoins"] if r["source_url"] == url]
        state = row["measurement_state"] if row else "UNCHECKABLE"
        reason = ("Served bytes inspected; extracted auditor, cadence, and dates are unreviewed candidates"
                  if state == "DEEP_PROBED" else "Frozen registry has no attestation_page"
                  if not url else "No accepted page response or lane failed")
        item = base("stablecoin:llama:" + key, key, "stablecoin", state, refs, reason, ev, index.get("observed_at"))
        item["observations"] = {"source_url": url, "source_bytes_observed": state == "DEEP_PROBED",
            "source_fetch_states": [r["fetch_state"] for r in refs],
            "extraction_review_state": "REVIEW_PENDING", "extraction_candidates": {
                k: row.get(k) if row else None for k in ("auditor", "cadence_claimed", "latest_report_date")}}
        item["unknowns"] = ["issuer_attribution", "extraction_semantics", "reserve_adequacy", "asset_supply", "certification"]
        rows.append(item)
    seed = load(ROOT / "inputs/public/interop/xrpl-16.json")
    ev = evidence("xrpl")
    by_name = {r["name"]: r for r in ev[0].get("rows", [])}
    for source in seed["rows"]:
        key, address = source["name"], source.get("r_address")
        row = by_name.get(key, {})
        refs = [r for r in records["xrpl"] if r.get("request") and
                (r["request"]["method"] == "ledger" or r["request"]["params"][0].get("account") == address)] if address else []
        state = row.get("account_state", "UNCHECKABLE" if address else "UNMEASURED")
        slug = re.sub("[^a-z0-9]+", "-", key.lower()).strip("-")
        reason = row.get("reason") or ("Account and obligations observed; issuer attribution and asset currency binding remain unverified"
            if state == "OBSERVED" else "No accepted pinned-ledger account response or lane failed")
        item = base("xrpl:catalogue:" + slug, key, "xrpl", state, refs, reason, ev, seed.get("as_of"))
        item["issuer_address"] = address
        item["observations"] = {"account_state": state, "issuer_attribution": "UNVERIFIED", "asset_supply": None,
            "obligations_state": row.get("obligations_state", "UNMEASURED")}
        if state == "OBSERVED":
            data = row["account_data"]
            obligations = row.get("obligations_by_currency")
            item["observations"].update({"account": data["Account"], "ledger": row["ledger"], "validated": True,
                "flags_raw": data.get("Flags"), "domain_hex": data.get("Domain"),
                "obligations_by_currency": dict(sorted(obligations.items())[:50]) if isinstance(obligations, dict) else None,
                "obligations_currency_count": len(obligations) if isinstance(obligations, dict) else None,
                "obligations_projection_limit": 50})
        item["unknowns"] = ["issuer_attribution", "asset_currency_binding", "asset_supply", "reserve_adequacy", "attestation", "certification"]
        rows.append(item)
    seed = load(ROOT / "inputs/public/interop/swift-census.json")
    ev = evidence("swift")
    for row in seed["rows"]:
        key = row["id"]
        urls = {seed["sources"][k]["url"] for k in row["source"]}
        refs = [r for r in records["swift"] if r["source_url"] in urls]
        item = base("institution:swift:" + key, key, "swift", "UNMEASURED", refs,
            "Source retrieval only; historical event, institution identity and settlement claims not revalidated", ev, seed.get("as_of"))
        item.update(name=row["name"], source_fetch_state="FETCHED" if refs and all(r["fetch_state"] == "FETCHED" for r in refs) else "PARTIAL_OR_UNCHECKABLE")
        item["observations"] = {"sources_expected": len(urls), "source_responses_archived": len(refs),
            "sources_fetched": sum(r["fetch_state"] == "FETCHED" for r in refs),
            "source_fetch_states": [{"url": r["source_url"], "state": r["fetch_state"], "http": r["http"], "body_sha256": r["body_sha256"]} for r in refs],
            "source_content_claim_review": "NOT_PERFORMED", "client_relationship": "NOT_CLAIMED",
            "settlement_state": "UNMEASURED"}
        item["unknowns"] = ["institution_identity", "source_claim_semantics", "pilot_outcomes", "settlement_bytes", "iso20022_bytes", "client_relationship"]
        rows.append(item)
    ids = [r["subject_id"] for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate subject identity; no ambiguous join permitted")
    write(ROOT / "run-dispositions.json", {"schema": "csoai.factory-run-dispositions/0.1",
        "generated_at": at, "source_revision": REVISION, "rows": rows,
        "family_counts": dict(Counter(r["family"] for r in rows)), "published": False, "signed": False,
        "identity_join": "source keys only; confirm registry membership; no admission",
        "slug_rule": "ASCII lowercase and runs of non a-z0-9 replaced by hyphen"})

def main(argv=None):
    global SOURCE, ROOT, REVISION, TOP_N, TIMEOUT, DEADLINE, START
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-repo", type=Path, required=True)
    parser.add_argument("--source-revision", required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--top-n", type=int, default=25)
    parser.add_argument("--timeout", type=int, default=15)
    parser.add_argument("--deadline", type=int, default=600)
    args = parser.parse_args(argv)
    if not (1 <= args.top_n <= 25 and 1 <= args.timeout <= 30 and 1 <= args.deadline <= 600):
        parser.error("top-n must be 1..25; timeout 1..30; deadline 1..600 seconds")
    SOURCE, ROOT = args.source_repo.resolve(), args.output_dir.resolve()
    REVISION = subprocess.run(["git", "-C", str(SOURCE), "rev-parse", "--verify", args.source_revision + "^{commit}"],
                              capture_output=True, text=True, check=True).stdout.strip()
    TOP_N, TIMEOUT, DEADLINE, START = args.top_n, args.timeout, args.deadline, time.monotonic()
    setup()
    shutil.copy2(Path(__file__), ROOT / "factory_refresh.py")
    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        jobs = {pool.submit(fn): name for name, fn in [("stablecoins", stablecoins), ("xrpl", xrpl), ("swift", swift)]}
        for job in concurrent.futures.as_completed(jobs):
            name = jobs[job]
            try:
                results[name] = {"status": "COMPLETED", **job.result()}
            except Exception as exc:
                results[name] = {"status": "FAILED", "error": type(exc).__name__ + ": " + str(exc)}
            print(name, json.dumps(results[name]), flush=True)
    try:
        write_dispositions(results)
    except Exception as exc:
        results["dispositions"] = {"status": "FAILED", "error": type(exc).__name__ + ": " + str(exc)}
    receipt = {"schema": "csoai.factory-refresh-receipt/0.1", "finished_at": now(),
        "source_revision": REVISION, "lanes": results, "elapsed_seconds": round(time.monotonic() - START, 2),
        "limits": {"concurrency": 2, "request_timeout_seconds": TIMEOUT, "max_body_bytes": MAX_BYTES, "deadline_seconds": DEADLINE},
        "side_effects": {"signing": False, "publication": False, "paid_calls": False, "inference": False, "new_infrastructure": False}}
    write(ROOT / "receipt.json", receipt)
    files = []
    for p in sorted(ROOT.rglob("*")):
        if p.is_file():
            raw = p.read_bytes()
            files.append({"path": str(p.relative_to(ROOT)), "sha256": sha(raw), "bytes": len(raw)})
    write(ROOT / "artifact-manifest.json", {"files": files})
    print(json.dumps(receipt, indent=2), flush=True)
    return 1 if any(lane["status"] == "FAILED" for lane in results.values()) else 0
if __name__ == "__main__":
    raise SystemExit(main())
