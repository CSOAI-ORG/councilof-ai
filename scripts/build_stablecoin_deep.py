#!/usr/bin/env python3
"""Deep-measure the top-20 stablecoins on ATTESTATION dimensions.

Fetches each attestation/transparency page live, archives the raw bytes with
retrieval metadata under mirrors/, extracts only what is honestly present in
the served bytes (auditor name, stated cadence, latest report/reserve date
near attestation keywords), and writes deep.json + artefact-manifest.json.

Doctrine: facts, not grades. Unverifiable -> UNMEASURED. Never the bare state
MEASURED; rows are DEEP_PROBED or UNMEASURED. No on-chain supply here.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import statistics
import urllib.error
import urllib.request
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

INDEX_REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
PACK_REL = Path("public/interop/stablecoin-deep-2026-09")
SOURCES_REL = PACK_REL / "sources.json"
MIRRORS_REL = PACK_REL / "mirrors"
DEEP_REL = PACK_REL / "deep.json"
MANIFEST_REL = PACK_REL / "artefact-manifest.json"

USER_AGENT = "councilof-ai-watch/0.1"
TIMEOUT = 30
TOP_N = 20
MIN_DATE = date(2023, 1, 1)

# Words that must never appear in published measurement payloads/excerpts.
BANNED = re.compile(
    r"\b(oracle|risk|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b|(?<!UN)MEASURED",
    re.IGNORECASE,
)

AUDITORS = [
    "Deloitte", "BDO", "Grant Thornton", "WithumSmithBrown", "Withum",
    "KPMG", "PricewaterhouseCoopers", "PwC", "Ernst & Young", "EY",
    "Mazars", "Armanino", "RSM", "Crowe", "CohnReznick", "Cohen & Company",
    "The Network Firm", "Harris & Trotter", "Kaufman Rossin", "Moore",
    "PKF", "MHA", "Marcum", "Baker Tilly", "CliftonLarsonAllen",
]

CADENCE_TERMS = [
    ("real-time", re.compile(r"\breal[\s-]?time\b", re.IGNORECASE)),
    ("daily", re.compile(r"\bdaily\b", re.IGNORECASE)),
    ("weekly", re.compile(r"\bweekly\b", re.IGNORECASE)),
    ("monthly", re.compile(r"\bmonthly\b|\beach month\b|\bevery month\b", re.IGNORECASE)),
    ("quarterly", re.compile(r"\bquarterly\b|\beach quarter\b", re.IGNORECASE)),
    ("annual", re.compile(r"\bannually\b|\beach year\b", re.IGNORECASE)),
]

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
}
MONTH_RE = "|".join(MONTHS)

DATE_PATTERNS = [
    # ISO 2026-09-11
    (re.compile(r"\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b"), "iso"),
    # September 11, 2026
    (re.compile(rf"\b({MONTH_RE})\s+([0-3]?\d)(?:st|nd|rd|th)?,?\s+(20\d{{2}})\b", re.IGNORECASE), "mdy"),
    # 11 September 2026
    (re.compile(rf"\b([0-3]?\d)(?:st|nd|rd|th)?\s+({MONTH_RE}),?\s+(20\d{{2}})\b", re.IGNORECASE), "dmy"),
]

# A date only counts as a report/reserve date when strong attestation vocabulary is nearby.
CONTEXT_KEYWORDS = re.compile(
    r"attest|reserve|assurance|examination|as of",
    re.IGNORECASE,
)
CONTEXT_WINDOW = 120
# A date introduced by these phrases is a boundary ("reports posted on or after X"),
# not a report date — reject it as latest_report_date.
BOUNDARY_PREFIX = re.compile(r"(on or after|prior to|before|since)\s*$", re.IGNORECASE)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_z(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def strip_to_text(raw: bytes) -> str:
    text = raw.decode("utf-8", errors="replace")
    text = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&#x([0-9a-fA-F]+);", lambda m: chr(int(m.group(1), 16)), text)
    text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))), text)
    return re.sub(r"\s+", " ", text).strip()


def clean_excerpt(text: str, start: int, end: int, limit: int = 200) -> str | None:
    lo = max(0, start - 90)
    hi = min(len(text), end + 90)
    snippet = re.sub(r"\s+", " ", text[lo:hi]).strip(" .,")
    if not snippet:
        return None
    snippet = snippet[:limit]
    if BANNED.search(snippet):
        return None
    return snippet


def parse_date(match: re.Match, kind: str) -> date | None:
    try:
        if kind == "iso":
            return date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        if kind == "mdy":
            return date(int(match.group(3)), MONTHS[match.group(1).lower()], int(match.group(2)))
        if kind == "dmy":
            return date(int(match.group(3)), MONTHS[match.group(2).lower()], int(match.group(1)))
    except ValueError:
        return None
    return None


def extract_auditor(text: str) -> tuple[str | None, str | None]:
    matches: list[tuple[int, str, re.Match]] = []
    for name in AUDITORS:
        for match in re.finditer(rf"\b{re.escape(name)}\b", text, re.IGNORECASE):
            matches.append((match.start(), name, match))
    matches.sort(key=lambda item: item[0])
    # Prefer the current appointment: a mention introduced by "on or after" phrasing.
    for _, name, match in matches:
        window = text[max(0, match.start() - 200):match.end() + 200]
        if re.search(r"on or after", window, re.IGNORECASE) and CONTEXT_KEYWORDS.search(window):
            excerpt = clean_excerpt(text, match.start(), match.end())
            if excerpt:
                return name, excerpt
    for _, name, match in matches:
        excerpt = clean_excerpt(text, match.start(), match.end())
        if excerpt:
            return name, excerpt
    return None, None


CADENCE_CONTEXT_KEYWORDS = re.compile(
    r"attest|reserve|assurance|examination",
    re.IGNORECASE,
)


def extract_cadence(text: str) -> tuple[str | None, str | None]:
    # Only accept cadence words near reserve/attestation vocabulary.
    for label, pattern in CADENCE_TERMS:
        for match in pattern.finditer(text):
            lo = max(0, match.start() - CONTEXT_WINDOW)
            hi = min(len(text), match.end() + CONTEXT_WINDOW)
            if CADENCE_CONTEXT_KEYWORDS.search(text[lo:hi]):
                excerpt = clean_excerpt(text, match.start(), match.end())
                if excerpt:
                    return label, excerpt
    return None, None


def extract_latest_date(text: str, today: date) -> tuple[str | None, str | None]:
    best: tuple[date, str] | None = None
    for pattern, kind in DATE_PATTERNS:
        for match in pattern.finditer(text):
            parsed = parse_date(match, kind)
            if parsed is None or parsed < MIN_DATE or parsed > today:
                continue
            if BOUNDARY_PREFIX.search(text[max(0, match.start() - 40):match.start()]):
                continue
            lo = max(0, match.start() - CONTEXT_WINDOW)
            hi = min(len(text), match.end() + CONTEXT_WINDOW)
            if not CONTEXT_KEYWORDS.search(text[lo:hi]):
                continue
            excerpt = clean_excerpt(text, match.start(), match.end())
            if excerpt is None:
                continue
            if best is None or parsed > best[0]:
                best = (parsed, excerpt)
    if best is None:
        return None, None
    return best[0].isoformat(), best[1]


def fetch(url: str) -> tuple[int | None, bytes | None, str | None]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, resp.read(), None
    except urllib.error.HTTPError as exc:
        return exc.code, None, f"HTTP {exc.code}"
    except Exception as exc:
        return None, None, f"{type(exc).__name__}: {exc}"


def top_ids(index: dict[str, Any]) -> list[str]:
    queue = index.get("deep_measurement_queue") or []
    if queue:
        return [str(item) for item in queue][:TOP_N]
    ranked = sorted(
        index.get("assets") or [],
        key=lambda row: float(row.get("priority_score") or 0),
        reverse=True,
    )
    return [str(row["id"]) for row in ranked[:TOP_N]]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--offline", action="store_true", help="reuse existing mirrors, no network")
    args = parser.parse_args()
    repo = args.repo_root.resolve()

    index = json.loads((repo / INDEX_REL).read_text())
    registry = json.loads((repo / SOURCES_REL).read_text())
    sources = {str(row["id"]): row for row in registry.get("sources") or []}
    assets = {str(row["id"]): row for row in index.get("assets") or []}
    ids = top_ids(index)

    mirrors_dir = repo / MIRRORS_REL
    mirrors_dir.mkdir(parents=True, exist_ok=True)
    fetched_at = iso_z(utc_now())
    today = utc_now().date()

    rows: list[dict[str, Any]] = []
    artefacts: list[dict[str, Any]] = []

    for asset_id in ids:
        asset = assets.get(asset_id) or {}
        source = sources.get(asset_id) or {}
        url = source.get("attestation_page")
        row: dict[str, Any] = {
            "id": asset_id,
            "symbol": asset.get("symbol") or source.get("symbol"),
            "name": asset.get("name") or source.get("name"),
            "attestation_page": None,
            "auditor": None,
            "cadence_claimed": None,
            "latest_report_date": None,
            "staleness_days": None,
            "excerpt": None,
            "mirror": None,
            "mirror_sha256": None,
            "measurement_state": "UNMEASURED",
            "unmeasured": [],
            "findings": [],
        }

        if not url:
            row["unmeasured"] = ["attestation_page", "auditor", "cadence_claimed", "staleness"]
            row["findings"].append("no attestation page archived")
            rows.append(row)
            continue

        meta_path = mirrors_dir / f"{asset_id}.meta.json"
        meta: dict[str, Any] = {
            "id": asset_id,
            "role": "attestation-page",
            "source_url": url,
            "fetched_at": fetched_at,
            "http": None,
            "bytes": None,
            "sha256": None,
        }

        raw: bytes | None = None
        if args.offline:
            existing = sorted(mirrors_dir.glob(f"{asset_id}.*"))
            existing = [p for p in existing if p.suffix not in (".json",)]
            if existing:
                raw = existing[0].read_bytes()
                prior = json.loads(meta_path.read_text()) if meta_path.is_file() else {}
                meta.update({k: prior.get(k, meta[k]) for k in ("http", "bytes", "sha256", "fetched_at")})
                meta["sha256"] = sha256_bytes(raw)
                meta["bytes"] = len(raw)
                meta["http"] = 200
                mirror_name = existing[0].name
            else:
                mirror_name = None
        else:
            status, raw, error = fetch(url)
            meta["http"] = status
            if raw is not None:
                mirror_name = f"{asset_id}.html"
                (mirrors_dir / mirror_name).write_bytes(raw)
                meta["bytes"] = len(raw)
                meta["sha256"] = sha256_bytes(raw)
            else:
                mirror_name = None
                row["findings"].append(f"fetch failed: {error}")
        meta_path.write_text(json.dumps(meta, indent=2) + "\n")

        artefacts.append({
            "id": asset_id,
            "role": "attestation-page",
            "source_url": url,
            "path": f"mirrors/{mirror_name}" if mirror_name else None,
            "meta": f"mirrors/{asset_id}.meta.json",
            "http": meta["http"],
            "bytes": meta["bytes"],
            "sha256": meta["sha256"],
            "fetched_at": meta["fetched_at"],
        })

        if raw is None:
            row["unmeasured"] = ["attestation_page", "auditor", "cadence_claimed", "staleness"]
            rows.append(row)
            continue

        row["attestation_page"] = url
        row["mirror"] = f"mirrors/{mirror_name}"
        row["mirror_sha256"] = meta["sha256"]
        row["measurement_state"] = "DEEP_PROBED"

        text = strip_to_text(raw)
        auditor, auditor_excerpt = extract_auditor(text)
        cadence, cadence_excerpt = extract_cadence(text)
        report_date, date_excerpt = extract_latest_date(text, today)

        row["auditor"] = auditor
        row["cadence_claimed"] = cadence
        row["latest_report_date"] = report_date
        row["excerpt"] = date_excerpt or auditor_excerpt or cadence_excerpt
        if report_date:
            row["staleness_days"] = (today - date.fromisoformat(report_date)).days
        else:
            row["findings"].append("no attestation figure/date in served bytes")

        unmeasured = []
        if auditor is None:
            unmeasured.append("auditor")
        if cadence is None:
            unmeasured.append("cadence_claimed")
        if report_date is None:
            unmeasured.append("staleness")
        row["unmeasured"] = unmeasured
        rows.append(row)

    staleness_values = [r["staleness_days"] for r in rows if r["staleness_days"] is not None]
    summary = {
        "n_with_attestation_page": sum(r["attestation_page"] is not None for r in rows),
        "n_with_auditor": sum(r["auditor"] is not None for r in rows),
        "n_with_staleness": len(staleness_values),
        "median_staleness_days": statistics.median(staleness_values) if staleness_values else None,
    }

    deep = {
        "schema": "csoai.stablecoin-deep/0.1",
        "generated_at": fetched_at,
        "release_id": "stablecoin-deep-2026-09",
        "index_ref": {
            "path": str(INDEX_REL),
            "observed_at": index.get("observed_at"),
        },
        "top_n": TOP_N,
        "rows": rows,
        "summary": summary,
        "truth_rules": [
            "DEEP_PROBED means the issuer page was fetched and its served bytes inspected; it is not a certification.",
            "A date counts only when attestation vocabulary appears near it in the served bytes.",
            "JS-rendered figures not present in served bytes are UNMEASURED, never guessed.",
        ],
    }
    (repo / DEEP_REL).write_text(json.dumps(deep, indent=2) + "\n")

    manifest = {
        "schema": "csoai.artefact-manifest/0.1",
        "pack": "stablecoin-deep-2026-09",
        "as_of": fetched_at,
        "artefacts": artefacts,
    }
    (repo / MANIFEST_REL).write_text(json.dumps(manifest, indent=2) + "\n")

    print(json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
