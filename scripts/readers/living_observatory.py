#!/usr/bin/env python3
"""Bounded public-source observer. Content drift is NOT a measured finding.
No credentials, inference, signing, publication or arbitrary URL input.
"""
from __future__ import annotations
import argparse
import datetime as dt
import fcntl
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import socket
import ssl
import time
from html.parser import HTMLParser
import urllib.error
import urllib.parse
import urllib.request

VERSION = "2026-09-18.3"
INTERVAL_SECONDS = 21600
MAX_BODY = 1_000_000
MAX_STATE_BYTES = 128_000_000
SOURCES = (
    ("nist-rmf", "https://airc.nist.gov/", None),
    ("eu-gpai-code", "https://digital-strategy.ec.europa.eu/en/policies/contents-code-gpai", None),
    ("gspc-board", "https://councilof.ai/api/gspc", "axes"),
    ("xrpl-register", "https://councilof.ai/api/xrpl", "assets"),
    ("swift-register", "https://councilof.ai/api/swift", "rows"),
    ("gpai-notices", "https://councilof.ai/interop/gpai-signatory-2026-09/index.json", "cards"),
    ("humanoid-deployments", "https://councilof.ai/interop/humanoid-registry-unsigned.json", "rows"),
    ("stablecoin-index", "https://councilof.ai/interop/stablecoin-universe-2026-09/index.json", "assets"),
    ("stablecoin-supply", "https://councilof.ai/interop/stablecoin-universe-supply-2026-09-16.json", "rows"),
    ("lab-artifacts", "https://councilof.ai/interop/lab-card-census-2026-09-17.json", "rows"),
    ("mcp-registry", "https://councilof.ai/api/mcp", "servers"),
    ("x402-disclosures", "https://councilof.ai/interop/x402-trust/latest.json", None),
    ("layer0-witness", "https://councilof.ai/interop/root-witness-latest.json", None),
    ("api-description", "https://councilof.ai/openapi.json", None),
    ("regulatory-adapters", "https://councilof.ai/interop/regulatory-inventory.json", "authority_adapters"),
)
ALLOWED_URLS = frozenset(row[1] for row in SOURCES)

def utcnow() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()

def digest(body: bytes) -> str:
    return hashlib.sha256(body).hexdigest()

def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False).encode()

def read_json(path: Path) -> dict:
    if path.stat().st_size > MAX_BODY:
        raise ValueError("Report too large")
    result = json.loads(path.read_bytes())
    if not isinstance(result, dict):
        raise ValueError("Report must be an object")
    return result

def atom(path: Path, body: bytes) -> None:
    temp = path.with_name(path.name + f".{os.getpid()}.tmp")
    with temp.open("xb") as file:
        os.chmod(temp, 0o600)
        file.write(body)
        file.flush()
        os.fsync(file.fileno())
    os.replace(temp, path)

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def check_url(url: str) -> None:
    if url not in ALLOWED_URLS:
        raise ValueError("URL not in exact reviewed allowlist")
    host = urllib.parse.urlsplit(url).hostname
    # Refuse private, loopback, link-local and otherwise non-global resolutions.
    for info in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM):
        if not ipaddress.ip_address(info[4][0]).is_global:
            raise ValueError("Non-public source resolution")

def fetch_source(url: str) -> tuple[bytes, str]:
    check_url(url)
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect(), urllib.request.HTTPSHandler(context=ssl.create_default_context()))
    request = urllib.request.Request(url, headers={"User-Agent": "CSOAI-SourceObserver/0.1 (+https://councilof.ai)", "Accept": "application/json,text/html;q=0.8", "Accept-Encoding": "identity"})
    with opener.open(request, timeout=10) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        if "application/json" not in content_type and "text/html" not in content_type:
            raise ValueError("Unsupported response type")
        body = response.read(MAX_BODY + 1)
        if not body or len(body) > MAX_BODY:
            raise ValueError("Empty or oversized body")
        return body, content_type

def describe_body(body: bytes, content_type: str, collection: str | None) -> dict:
    if collection is None:
        data = json.loads(body) if "application/json" in content_type else {}
        if not isinstance(data, dict):
            raise ValueError("Document source must be an object")
        return {"observed_collection_count": None, "collection_unit": None, "source_as_of": data.get("as_of") or data.get("observed_at") or data.get("fetched_at")}
    if "application/json" not in content_type:
        raise ValueError("JSON collection returned non-JSON")
    data = json.loads(body)
    if not isinstance(data, dict) or not isinstance(data.get(collection), list):
        raise ValueError("Missing expected collection")
    return {"observed_collection_count": len(data[collection]), "collection_unit": collection,
            "source_as_of": data.get("as_of") or data.get("fetched_at") or data.get("published_at") or data.get("measured_on") or data.get("observed_at") or data.get("probe_finished"),
            "count_is": "Rows observed in a source, NOT independently measured, signed or unique organisations."}

ROW_KEYS = {"gspc-board": "axis", "xrpl-register": "sha256", "swift-register": "id", "gpai-notices": "id", "humanoid-deployments": "id", "stablecoin-index": "id", "stablecoin-supply": "asset_id", "lab-artifacts": "org", "mcp-registry": "id", "regulatory-adapters": "id"}
JSON_SOURCE_IDS = frozenset(ROW_KEYS) | {"x402-disclosures", "layer0-witness", "api-description"}

class VisibleText(HTMLParser):
    """Conservative document-text projection. Not legal interpretation or a DOM renderer."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.suppressed = []
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav", "noscript", "template"):
            self.suppressed.append(tag)
    def handle_endtag(self, tag):
        if tag in self.suppressed:
            at = len(self.suppressed) - 1 - self.suppressed[::-1].index(tag)
            del self.suppressed[at:]
    def handle_data(self, data):
        if not self.suppressed:
            self.parts.append(data)

def normalized_content(body: bytes, content_type: str) -> bytes:
    if "application/json" in content_type:
        return canonical(json.loads(body))
    parser = VisibleText()
    parser.feed(body.decode("utf-8", errors="strict"))
    return " ".join(" ".join(parser.parts).split()).encode()

def row_inventory(body: bytes, source_id: str, collection: str | None) -> dict:
    if not collection or source_id not in ROW_KEYS:
        return {}
    data = json.loads(body)
    rows = data[collection]
    result = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Non-object record")
        identity = row.get(ROW_KEYS[source_id])
        if not isinstance(identity, (str, int)) or isinstance(identity, bool) or not str(identity):
            raise ValueError("Record identity missing")
        key = str(identity)
        if key in result:
            raise ValueError("Duplicate record identity")
        result[key] = row
    return result

def change_projection(body: bytes, content_type: str, source_id: str, collection: str | None, old_body: bytes | None, old_type: str | None) -> dict:
    if source_id in JSON_SOURCE_IDS and "application/json" not in content_type:
        raise ValueError("Declared JSON source returned non-JSON")
    current = normalized_content(body, content_type)
    new = row_inventory(body, source_id, collection)
    result = {"normalized_content_sha256": digest(current), "normalization": "json-canonical-or-visible-text/v1", "identity_field": ROW_KEYS.get(source_id), "identity_note": "XRPL identities here are receipt digests; replaced receipts are not proven asset entries or exits." if source_id == "xrpl-register" else "Source-defined record identity.", "content_change": "BASELINE", "record_changes": {"added": [], "removed": [], "changed": [], "baseline_count": len(new)}, "review_required": False}
    if old_body is None:
        return result
    previous = normalized_content(old_body, old_type or content_type)
    old = row_inventory(old_body, source_id, collection)
    identical = current == previous
    changes = {"added": sorted(set(new) - set(old)), "removed": sorted(set(old) - set(new)), "changed": sorted(k for k in set(new) & set(old) if canonical(new[k]) != canonical(old[k])), "baseline_count": len(old)}
    result.update(content_change="UNCHANGED_NORMALIZED_CONTENT" if identical else "CONTENT_CHANGED_REVIEW_REQUIRED", record_changes=changes, review_required=not identical)
    return result

def source_coverage(results: list[dict]) -> dict:
    """Counts only validated source rows. A fresh fetch does not freshen underlying measurements."""
    return {r["id"]: {"observation_state": r["state"], "records": r.get("observed_collection_count"), "source_as_of": r.get("source_as_of"), "fetched_at": r["observed_at"], "content_change": r.get("content_change"), "new_measurements": 0} for r in results}

def status(state: Path) -> dict:
    path = state / "latest.json"
    if not path.exists():
        return {"state": "NOT_OBSERVED", "checked_here": False}
    try:
        pointer = read_json(path)
        name = pointer.get("receipt", "")
        if not isinstance(name, str) or Path(name).name != name:
            raise ValueError("Invalid receipt name")
        receipt = state / "receipts" / name
        raw = receipt.read_bytes()
        if digest(raw) != pointer.get("sha256"):
            raise ValueError("Receipt digest mismatch")
        report = json.loads(raw)
        then = dt.datetime.fromisoformat(report["finished_at"])
        age = (dt.datetime.now(dt.timezone.utc) - then).total_seconds()
        return {**report, "checked_here": False, "retained_report_sha256": pointer["sha256"],
                "freshness": "FUTURE_DATE" if age < 0 else "STALE" if age > INTERVAL_SECONDS + 3600 else "CURRENT_WINDOW",
                "stop_present": (state / "STOP").exists(), "read_note": "Retained observation; reading this view performs no network requests."}
    except (OSError, KeyError, TypeError, ValueError):
        return {"state": "INVALID_RETAINED_REPORT", "checked_here": False}

def observe(state: Path, due: bool = False, fetcher=fetch_source) -> dict:
    state.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (state / "observer.lock").open("a") as lease:
        try:
            fcntl.flock(lease, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return {"state": "ALREADY_RUNNING"}
        if (state / "STOP").exists():
            return {"state": "STOPPED"}
        source_hash = digest(Path(__file__).read_bytes())
        reviewed = state / "reviewed-source.sha256"
        if not reviewed.exists() or reviewed.read_text().strip() != source_hash:
            return {"state": "SOURCE_REVIEW_REQUIRED"}
        retained = status(state)
        if due and retained.get("finished_at"):
            elapsed = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(retained["finished_at"])).total_seconds()
            if 0 <= elapsed < INTERVAL_SECONDS:
                return {"state": "NOT_DUE", "next_check_after_seconds": int(INTERVAL_SECONDS - elapsed)}
        used = sum(p.stat().st_size for p in state.rglob("*") if p.is_file())
        if used > MAX_STATE_BYTES - len(SOURCES) * MAX_BODY:
            return {"state": "RETENTION_LIMIT", "bytes": used, "note": "No data deleted; owner retention review required."}
        (state / "blobs").mkdir(exist_ok=True, mode=0o700)
        (state / "receipts").mkdir(exist_ok=True, mode=0o700)
        started = utcnow()
        previous = {r["id"]: r for r in retained.get("sources", [])}
        results = []
        for source_id, url, collection in SOURCES:
            row = {"id": source_id, "url": url, "observed_at": utcnow(), "signed": False, "measured": False}
            old = previous.get(source_id, {})
            prior = old.get("body_sha256") or old.get("last_success_body_sha256")
            try:
                if (state / "STOP").exists():
                    raise InterruptedError("STOP requested")
                body, content_type = fetcher(url)
                summary = describe_body(body, content_type, collection)
                old_body = None
                if prior:
                    old_path = state / "blobs" / (prior + ".body")
                    if old_path.exists():
                        old_body = old_path.read_bytes()
                        if digest(old_body) != prior:
                            raise ValueError("Previous body digest mismatch")
                change = change_projection(body, content_type, source_id, collection, old_body, old.get("content_type"))
                row.update(change)
                hashed = digest(body)
                blob = state / "blobs" / (hashed + ".body")
                if blob.exists() and digest(blob.read_bytes()) != hashed:
                    raise ValueError("Stored blob digest mismatch")
                if not blob.exists():
                    with blob.open("xb") as file:
                        os.chmod(blob, 0o600)
                        file.write(body)
                row.update(summary)
                row.update({"state": "FIRST_OBSERVATION" if not prior else "UNCHANGED_BYTES" if prior == hashed else "BYTES_CHANGED_REVIEW_REQUIRED",
                            "body_sha256": hashed, "previous_body_sha256": prior, "bytes": len(body), "content_type": content_type,
                            "last_success_at": row["observed_at"], "last_success_body_sha256": hashed})
            except Exception as exc:
                row.update({"state": "UNAVAILABLE", "error_class": type(exc).__name__,
                            "http_status": exc.code if isinstance(exc, urllib.error.HTTPError) else None,
                            "last_success_at": old.get("last_success_at"), "last_success_body_sha256": prior})
            results.append(row)
            if fetcher is fetch_source:
                time.sleep(0.25)
        success = sum(r["state"] != "UNAVAILABLE" for r in results)
        review_queue = [{"source_id": r["id"], "reason": r["content_change"], "before_sha256": r.get("previous_body_sha256"), "after_sha256": r.get("body_sha256"), "record_changes": r.get("record_changes"), "state": "REVIEW_REQUIRED", "dispatch": "NOT_DISPATCHED"} for r in results if r.get("review_required")]
        report = {"schema": "csoai.living-source-observation/0.1", "version": VERSION, "started_at": started, "finished_at": utcnow(),
                  "state": "OBSERVED" if success == len(SOURCES) else "PARTIAL" if success else "UNAVAILABLE",
                  "source_sha256": source_hash, "previous_receipt_sha256": retained.get("retained_report_sha256"),
                  "counts": {"sources_requested": len(SOURCES), "sources_read": success, "unavailable": len(SOURCES) - success,
                             "semantic_changes_reviewed": 0, "new_measurements": 0, "new_signatures": 0},
                  "sources": results, "coverage": source_coverage(results), "review_queue": review_queue, "review_queue_count": len(review_queue), "limits": {"interval_seconds": INTERVAL_SECONDS, "requests_per_run": len(SOURCES), "body_bytes": MAX_BODY, "state_bytes": MAX_STATE_BYTES},
                  "note": "Byte changes may be formatting, navigation or dynamic content. They are review triggers, not legal/regulatory changes or verified organisational findings.",
                  "publication": "PRIVATE_UNSIGNED", "authority": "No inference, signing, publication, money movement, human profiling or robot actuation."}
        raw = canonical(report)
        name = digest(raw) + ".json"
        with (state / "receipts" / name).open("xb") as file:
            os.chmod(file.name, 0o600)
            file.write(raw)
        atom(state / "latest.json", canonical({"receipt": name, "sha256": digest(raw)}))
        return report

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("once", "due", "status"))
    parser.add_argument("--state", required=True, type=Path)
    args = parser.parse_args()
    result = status(args.state) if args.action == "status" else observe(args.state, args.action == "due")
    print(json.dumps(result, indent=2, allow_nan=False))
    return 0 if result["state"] in ("OBSERVED", "NOT_DUE", "STOPPED", "ALREADY_RUNNING") else 2

if __name__ == "__main__":
    raise SystemExit(main())
