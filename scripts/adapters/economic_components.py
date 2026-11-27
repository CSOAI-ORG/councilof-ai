"""Read-only economic source qualification using the existing connector envelope.

The input is a locally retained capture manifest and exact source response bytes.
No network, signing, board writes, aggregate index, or causal conclusions.
Candidate values are kept outside PROBED envelopes pending source-specific review.
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
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
    if doc.get("error") or doc["result"].get("isError"):
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
        if row["indicator"]["id"] != indicator or country not in COUNTRIES or period not in tuple(str(y) for y in range(2020, 2026)):
            raise ValueError("unexpected series identity")
        key = country, period
        if key in seen:
            raise ValueError("duplicate series period")
        seen[key] = numeric(row["value"], 100)
    if {k[0] for k in seen} != set(COUNTRIES):
        raise ValueError("country coverage mismatch")
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
        seen.add(key)
        raw = (folder / rec["file"]).read_bytes()
        digest = ce.sha256_hex(raw)
        if not raw or len(raw) > 1_000_000 or digest != rec["sha256"]:
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


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("capture_dir", type=Path)
    p.add_argument("--out", required=True, type=Path)
    a = p.parse_args()
    result = qualify(a.capture_dir)
    with a.out.open("x", encoding="utf-8") as f:
        json.dump(result, f, indent=2, allow_nan=False)
        f.write("\n")
    print(f"{len(result['envelopes'])} PROBED envelopes; {len(result['component_candidates'])} UNMEASURED component candidates")


if __name__ == "__main__":
    sys.exit(main())
