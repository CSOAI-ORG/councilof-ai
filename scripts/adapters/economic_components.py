"""Read-only economic source qualification using the existing connector envelope.

The input is a locally retained capture manifest and exact source response bytes.
Offline by default; explicit --capture performs fixed read-only requests.
No signing, board writes, aggregate index, or causal conclusions.
Candidate values are kept outside PROBED envelopes pending source-specific review.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from adapters import connector_envelope as ce

COUNTRIES = ("CAN", "DEU", "FRA", "GBR", "JPN", "USA")
ANTHROPIC_URL = "https://econ-index.mcp.claude.com/mcp"
WB_ROOT = "https://api.worldbank.org/v2/country/GBR;USA;DEU;FRA;JPN;CAN/indicator/"
INDICATORS = {
    "IT.NET.USER.ZS": ("Internet users (% of population)", "digital access; not AI adoption"),
    "SL.UEM.TOTL.ZS": ("Unemployment (% of total labour force, modelled ILO estimate)", "labour context; not AI displacement"),
}
METRICS = {
    "anthropic_usage_index": ("usage index", "observed Claude usage relative to working-age population share"),
    "augmentation_pct": ("%", "share of observed Claude conversations classified as augmentation"),
    "automation_pct": ("%", "share of observed Claude conversations classified as automation"),
}
YEARS = tuple(str(y) for y in range(2020, 2026))
MAX_CAPTURE_BYTES = 1_000_000
ANTHROPIC_REQUEST = {"jsonrpc": "2.0", "id": 3, "method": "tools/call",
    "params": {"name": "econ_index_compare_regions", "arguments": {
        "region_codes": ["GBR", "USA", "DEU", "FRA", "JPN", "CAN"]}}}
PERIOD = re.compile(r"^20[0-9]{2}-(0[1-9]|1[0-2])-01$")


def unique_object(pairs):
    result = {}
    for k, v in pairs:
        if k in result:
            raise ValueError("duplicate JSON key")
        result[k] = v
    return result


def decode(raw):
    def reject_constant(value):
        raise ValueError("nonfinite JSON constant")
    return json.loads(raw, object_pairs_hook=unique_object, parse_constant=reject_constant)


def numeric(value, maximum=None):
    if value is None:
        return None
    if type(value) not in (int, float) or not math.isfinite(value) or value < 0 or (maximum is not None and value > maximum):
        raise ValueError("invalid numeric value")
    return value


def parse_anthropic(raw):
    doc = decode(raw)
    if doc.get("jsonrpc") != "2.0" or type(doc.get("id")) is not int or doc["id"] != ANTHROPIC_REQUEST["id"] or doc.get("error") or doc["result"].get("isError"):
        raise ValueError("MCP error")
    data = doc["result"]["structuredContent"]["result"]
    period = data["period"]
    if not isinstance(period, str) or not PERIOD.fullmatch(period):
        raise ValueError("invalid source period")
    seen = {}
    for row in data["regions"]:
        country = row["region_code"]
        if country not in COUNTRIES or country in seen:
            raise ValueError("unexpected or duplicate country")
        seen[country] = row
    if set(seen) != set(COUNTRIES):
        raise ValueError("country coverage mismatch")
    return [
        {"country": c, "period": period, "metric": k, "unit": unit,
         "definition": definition, "value": numeric(seen[c].get(k), None if k.endswith("_index") else 100)}
        for c in COUNTRIES for k, (unit, definition) in METRICS.items()
    ]


def parse_worldbank(raw, indicator):
    label, boundary = INDICATORS[indicator]
    doc = decode(raw)
    if not isinstance(doc, list) or len(doc) != 2 or not isinstance(doc[0], dict) or not isinstance(doc[1], list):
        raise ValueError("invalid World Bank response")
    meta, rows = doc
    if str(meta.get("pages")) != "1" or str(meta.get("total")) != str(len(rows)):
        raise ValueError("incomplete response")
    seen = {}
    for row in rows:
        country, period = row["countryiso3code"], row["date"]
        if row["indicator"]["id"] != indicator or country not in COUNTRIES or period not in YEARS:
            raise ValueError("unexpected series identity")
        key = country, period
        if key in seen:
            raise ValueError("duplicate series period")
        seen[key] = numeric(row["value"], 100)
    if set(seen) != {(country, year) for country in COUNTRIES for year in YEARS}:
        raise ValueError("incomplete country-period grid")
    return [{"country": c, "period": p, "metric": indicator, "unit": "%",
             "definition": label, "boundary": boundary, "value": v}
            for (c, p), v in sorted(seen.items())]


def qualify(folder):
    folder = Path(folder)
    manifest = decode((folder / "manifest.json").read_bytes())
    envelopes, candidates = [], []
    expected = {"anthropic": ("anthropic.json", ANTHROPIC_URL)}
    for i in INDICATORS:
        expected[i] = (i + ".json", WB_ROOT + i + "?format=json&date=2020:2025&per_page=100")
    seen = set()
    for rec in manifest["sources"]:
        kind = rec["kind"]
        if kind not in ("anthropic", "worldbank"):
            raise ValueError("unknown connector")
        key = "anthropic" if kind == "anthropic" else rec["indicator"]
        if key not in expected or key in seen or (rec["file"], rec["url"]) != expected[key]:
            raise ValueError("unexpected or duplicate source identity")
        if key == "anthropic" and rec.get("request") != ANTHROPIC_REQUEST:
            raise ValueError("MCP request scope mismatch")
        seen.add(key)
        raw = (folder / rec["file"]).read_bytes()
        digest = ce.sha256_hex(raw)
        if not raw or len(raw) > MAX_CAPTURE_BYTES or digest != rec["sha256"]:
            raise ValueError("source byte integrity failed")
        rows = parse_anthropic(raw) if key == "anthropic" else parse_worldbank(raw, key)
        source = {"connector": "anthropic-economic-index" if key == "anthropic" else "world-bank-indicators", "url": rec["url"]}
        subject = {"kind": "economic-series", "id": key + ":six-country-cohort", "revision": None}
        artifact = {"sha256": digest, "bytes": len(raw), "url": rec["url"]}
        env = {"schema": ce.SCHEMA, "source": source, "subject": subject,
               "measurement_kind": "deterministic-facts", "artifact": artifact,
               "observed_at": rec["observed_at"], "license": "CC-BY-4.0" if key == "anthropic" and rec.get("license") == "CC-BY-4.0" else "UNCHECKABLE",
               "provenance": {"producer": "scripts/adapters/economic_components.py", "producer_revision": "sha256:" + ce.sha256_hex(Path(__file__).read_bytes())},
               "lifecycle_state": "PROBED", "measurement": None, "error": None,
               "idempotency_key": ce.idempotency_key(source, subject, "deterministic-facts", digest), "writes_board": False}
        errors = ce.validate(env)
        if errors:
            raise ValueError(str(errors))
        envelopes.append(env)
        candidates.extend(dict(row, source_id=key, source_sha256=digest, state="UNMEASURED") for row in rows)
    if seen != set(expected):
        raise ValueError("capture set incomplete")
    return {"envelopes": envelopes, "component_candidates": candidates, "writes_board": False,
            "index_formula": False, "scope": "Observed usage, digital access and labour statistics are distinct; no job displacement, customer demand or causation inference."}


def source_requests():
    return [("anthropic", "anthropic.json", ANTHROPIC_URL, ANTHROPIC_REQUEST)] + [
        (key, key + ".json", WB_ROOT + key + "?format=json&date=2020:2025&per_page=100", None)
        for key in INDICATORS]


def fetch_capture(url, request=None):
    # Fixed source allowlist from source_requests(); never take an arbitrary URL
    # or headers from the environment/manifest. No credentials or retries.
    if (url, request) not in [(u, r) for _, _, u, r in source_requests()]:
        raise ValueError("source request not allowlisted")
    cmd = ["curl", "--disable", "--silent", "--show-error", "--fail",
           "--max-time", "15", "--max-filesize", str(MAX_CAPTURE_BYTES),
           "--proto", "=https", "--proto-redir", "=https",
           "--header", "Accept: application/json, text/event-stream"]
    if request is not None:
        cmd += ["--header", "Content-Type: application/json", "--data-binary", "@-"]
    else:
        cmd += ["--location", "--max-redirs", "3"]
    result = subprocess.run(cmd + [url], input=ce.canonical_bytes(request) if request else None,
                            capture_output=True, timeout=20, check=False)
    if result.returncode or not result.stdout or len(result.stdout) > MAX_CAPTURE_BYTES:
        raise ValueError("source fetch failed or exceeded budget")
    return result.stdout


def capture(folder, fetch=fetch_capture, clock=lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")):
    # An incomplete capture stays incomplete. Only publish a manifest after all
    # source bytes and expected schemas have passed; never overwrite prior runs.
    folder = Path(folder)
    folder.mkdir(mode=0o700, parents=False, exist_ok=False)
    records = []
    try:
        for key, name, url, request in source_requests():
            raw = fetch(url, request)
            if not isinstance(raw, bytes) or not raw or len(raw) > MAX_CAPTURE_BYTES:
                raise ValueError("invalid source byte count")
            (folder / name).write_bytes(raw)
            if key == "anthropic":
                parse_anthropic(raw)
            else:
                parse_worldbank(raw, key)
            record = {"kind": "anthropic" if key == "anthropic" else "worldbank",
                "file": name, "url": url, "sha256": ce.sha256_hex(raw),
                "observed_at": clock(), "license": "UNCHECKABLE"}
            if request is not None:
                record["request"] = request
            else:
                record["indicator"] = key
            records.append(record)
        manifest = {"sources": records}
        (folder / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    except Exception:
        # Raw responses already obtained are kept only in this private local
        # directory; no qualification manifest or fabricated zero is emitted.
        (folder / "capture-failed.json").write_text(json.dumps({
            "state": "UNCHECKABLE", "completed_sources": len(records)}), encoding="utf-8")
        raise
    return manifest


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("capture_dir", type=Path)
    p.add_argument("--out", required=True, type=Path)
    p.add_argument("--capture", action="store_true", help="fetch the fixed sources into a new private local directory")
    a = p.parse_args()
    if a.capture:
        capture(a.capture_dir)
    result = qualify(a.capture_dir)
    with a.out.open("x", encoding="utf-8") as f:
        json.dump(result, f, indent=2, allow_nan=False)
        f.write("\n")
    print(f"{len(result['envelopes'])} PROBED envelopes; {len(result['component_candidates'])} UNMEASURED component candidates")


if __name__ == "__main__":
    sys.exit(main())
