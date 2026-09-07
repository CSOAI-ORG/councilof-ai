#!/usr/bin/env python3
"""Cursor-preserving Speed 0 Hub census.

Walks Hugging Face model listings through transparent Link-cursor
pagination. Writes DISCOVERED rows only. Never downloads weights, never
runs GPU inference, never stamps MEASURED.

Identity chain (do not collapse):
  source listing
  -> immutable source revision (sha)
  -> artefact-manifest digest (later, blobs=true)
  -> lineage
  -> runtime variant
  -> GSPC measurement

An identical artefact on Hugging Face, Kaggle and GitHub is one
measurement feeding exact aliases. Ollama quants, adapters and API
deployments are related child subjects, not automatically the same cell.

Living loop (operator, not this process):
  complete Hub baseline once
  -> daily overlapping changed-model sweep
  -> weekly complete reconciliation
  -> static health scan
  -> deduplicate exact artefact lineages
  -> canary/full GSPC for promoted lineages
  -> signed health cells
  -> Council API -> HF Space -> every N-site

Hub webhooks (1,000 events/day) can accelerate watched publishers.
They cannot replace this census.

Resume is a first-class path: persist the exact rel=next URL after every
page so a crash continues without replaying the walk.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Callable, Iterable

KIND = "csoai.hub-census/0.1"
AXIS_SOURCES_KIND = "csoai.hf-census-axis-sources/0.1"
ORG_REGISTER_KIND = "csoai.hub-org-register/0.1"
HUB_MODELS = "https://huggingface.co/api/models"
HUB_CARD = "https://huggingface.co"
EXPAND = (
    "sha",
    "lastModified",
    "downloads",
    "likes",
    "pipeline_tag",
    "tags",
    "gated",
    "private",
    "library_name",
    "author",
    "cardData",
    "siblings",
    "createdAt",
)
LISTING_STATE = "DISCOVERED"
GSPC_STATE = "UNMEASURED"
USER_AGENT = "csoai-hub-census/0.1 (+https://councilof.ai)"
LINK_NEXT = re.compile(r'<([^>]+)>\s*;\s*rel="next"', re.I)
BEHAVIOURAL_AXES = (
    "governance",
    "safety",
    "provenance",
    "continuity",
    "conformance",
    "openness",
    "machinery-conformity",
    "care",
    "cross-reality",
    "detector-interop",
    "art5-safeguard",
    "swarm",
    "affect",
    "jail",
)
FINANCIAL_AXES = (
    "provenance-controls",
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
    "ai-adoption-components",
    "labour-components",
    "humanoid-labour-index",
)
ALL_AXES = BEHAVIOURAL_AXES + FINANCIAL_AXES
AXIS_SOURCE_FIELDS = {
    "provenance": ("license", "created-by", "sha"),
    "openness": ("license", "siblings"),
    "continuity": ("lastModified", "trainers"),
    "conformance": ("safety_wording", "tags"),
    "machinery-conformity": ("library_name", "runtime_requirements"),
    "governance": ("author", "org"),
    "safety": ("safety_wording", "tags"),
    "care": ("tags", "card_text"),
    "cross-reality": ("tags", "card_text"),
    "detector-interop": ("tags", "card_text"),
    "art5-safeguard": ("tags", "card_text"),
    "swarm": ("tags", "card_text"),
    "affect": ("tags", "card_text"),
    "jail": ("tags", "card_text"),
}
# Remaining 8 are directory coverage of who-runs-what, never issuer grades (TUI-2).
for _fin in FINANCIAL_AXES:
    AXIS_SOURCE_FIELDS[_fin] = ("org", "author", "id")
AXIS_TAG_MARKERS = {
    "safety": ("safety", "alignment", "harmless", "responsible", "guardrail"),
    "care": ("care", "medical", "health", "wellbeing"),
    "cross-reality": ("xr", "cross-reality", "multimodal", "3d", "robotics"),
    "detector-interop": ("watermark", "detector", "c2pa", "provenance-tag"),
    "art5-safeguard": ("art5", "article-5", "article5", "prohibited"),
    "swarm": ("swarm", "multi-agent", "multiagent"),
    "affect": ("affect", "emotion", "sentiment"),
    "jail": ("jail", "jailbreak", "red-team", "redteam"),
}
SAFETY_WORDING_MARKERS = (
    "safety",
    "alignment",
    "harmless",
    "responsible",
    "guardrail",
    "rai",
)
MAX_ORG_CARD_LINKS = 20
GRADE_KEYS = frozenset(
    {
        "grade",
        "graded",
        "score",
        "rank",
        "ranking",
        "lab-score",
        "lab_score",
        "certified",
        "certification",
        "issuer",
        "issuer-grade",
    }
)


def utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    text = value.strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def parse_link_next(header: str | None) -> str | None:
    if not header:
        return None
    match = LINK_NEXT.search(header)
    return match.group(1) if match else None


def token() -> str | None:
    env = os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if env:
        return env.strip()
    try:
        from huggingface_hub import get_token

        value = get_token()
        return value.strip() if value else None
    except Exception:
        return None


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _as_str_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, (list, tuple)):
        out: list[str] = []
        for item in value:
            if item is None:
                continue
            out.append(str(item))
        return out
    return [str(value)]


def sibling_names(raw: Any) -> list[str]:
    names: list[str] = []
    if not isinstance(raw, list):
        return names
    for item in raw:
        if isinstance(item, str) and item.strip():
            names.append(item.strip())
        elif isinstance(item, dict):
            name = item.get("rfilename") or item.get("filename") or item.get("name")
            if name:
                names.append(str(name))
    return names


def license_of(raw: dict[str, Any], card_data: dict[str, Any], tags: list[str]) -> str | None:
    for candidate in (raw.get("license"), card_data.get("license")):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
        if isinstance(candidate, list) and candidate:
            return str(candidate[0])
    for tag in tags:
        text = str(tag)
        if text.lower().startswith("license:"):
            return text.split(":", 1)[1].strip() or None
    return None


def org_of(ident: Any, author: Any) -> str | None:
    if isinstance(author, str) and author.strip():
        return author.strip()
    if isinstance(ident, str) and "/" in ident:
        return ident.split("/", 1)[0].strip() or None
    return None


def card_text_of(card_data: dict[str, Any], tags: list[str]) -> str:
    chunks = list(tags)
    for key in ("tags", "model-index", "language", "datasets", "base_model"):
        chunks.extend(_as_str_list(card_data.get(key)))
    for key in ("text", "description", "notes", "safety", "license"):
        value = card_data.get(key)
        if isinstance(value, str):
            chunks.append(value)
    return " ".join(str(c).lower() for c in chunks if c)


_MARKER_RES: dict[tuple[str, ...], re.Pattern[str]] = {}


def has_marker(text: str, markers: tuple[str, ...]) -> bool:
    """Token-boundary match. 'rai' must not fire inside 'training' or 'brain'."""
    if not text or not markers:
        return False
    compiled = _MARKER_RES.get(markers)
    if compiled is None:
        parts = [
            rf"(?<![a-z0-9_]){re.escape(marker.lower())}(?![a-z0-9_])"
            for marker in markers
        ]
        compiled = re.compile("|".join(parts))
        _MARKER_RES[markers] = compiled
    return compiled.search(text.lower()) is not None


def listing_record(raw: dict[str, Any], source: str = "huggingface") -> dict[str, Any]:
    card_data = _as_dict(raw.get("cardData") or raw.get("card_data"))
    tags = _as_str_list(raw.get("tags") or card_data.get("tags"))
    ident = raw.get("id")
    author = raw.get("author") or raw.get("created-by") or raw.get("created_by") or card_data.get("created_by") or card_data.get("created-by")
    if not author and isinstance(ident, str) and "/" in ident:
        author = ident.split("/", 1)[0]
    trainers = card_data.get("trainers") or card_data.get("trainer") or raw.get("trainers")
    runtime = (
        raw.get("runtime_requirements")
        or card_data.get("runtime")
        or card_data.get("library_name")
        or raw.get("library_name")
        or raw.get("libraryName")
    )
    text = card_text_of(card_data, tags)
    safety_wording = has_marker(text, SAFETY_WORDING_MARKERS)
    org = org_of(ident, author)
    files = sibling_names(raw.get("siblings") or raw.get("files") or card_data.get("siblings"))
    return {
        "id": ident,
        "source": source,
        "source_revision": raw.get("sha"),
        "last_modified": raw.get("lastModified") or raw.get("last_modified"),
        "created_at": raw.get("createdAt") or raw.get("created_at") or card_data.get("created"),
        "listing_state": LISTING_STATE,
        "gspc_state": GSPC_STATE,
        "downloads": raw.get("downloads"),
        "likes": raw.get("likes"),
        "pipeline_tag": raw.get("pipeline_tag") or raw.get("pipelineTag"),
        "tags": tags,
        "gated": raw.get("gated"),
        "private": raw.get("private"),
        "library_name": raw.get("library_name") or raw.get("libraryName") or card_data.get("library_name"),
        "license": license_of(raw, card_data, tags),
        "created_by": author,
        "author": author,
        "org": org,
        "trainers": _as_str_list(trainers),
        "siblings": files,
        "runtime_requirements": runtime,
        "safety_wording": safety_wording,
        "card_text": text,
        "artefact_manifest_digest": None,
        "lineage": None,
        "runtime_variant": None,
    }


def axis_source_hits(record: dict[str, Any]) -> dict[str, bool]:
    """Which of the 22 axes have Hub metadata that could source a later measurement.

    A hit is DISCOVERED source material, never a grade. Financial axes hit when
    the listing has an org/author — directory coverage of who runs what.
    """
    tags_text = " ".join(str(t).lower() for t in (record.get("tags") or []))
    card_text = str(record.get("card_text") or "")
    blob = f"{tags_text} {card_text}".lower()
    license_v = record.get("license")
    hits = {
        "provenance": bool(license_v or record.get("created_by") or record.get("source_revision")),
        "openness": bool(license_v or record.get("siblings")),
        "continuity": bool(record.get("last_modified") or record.get("trainers")),
        "conformance": bool(record.get("safety_wording")),
        "machinery-conformity": bool(record.get("library_name") or record.get("runtime_requirements")),
        "governance": bool(record.get("org") or record.get("author")),
    }
    for axis, markers in AXIS_TAG_MARKERS.items():
        hits[axis] = has_marker(blob, markers) or (axis == "safety" and bool(record.get("safety_wording")))
    org_present = bool(record.get("org") or record.get("author") or record.get("id"))
    for axis in FINANCIAL_AXES:
        hits[axis] = org_present
    return {axis: bool(hits.get(axis)) for axis in ALL_AXES}


def iter_records(jsonl_path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not jsonl_path.exists():
        return rows
    with jsonl_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(row, dict) and row.get("id"):
                rows.append(row)
    return rows


def _strip_grade_keys(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {
            key: _strip_grade_keys(value)
            for key, value in payload.items()
            if str(key).lower() not in GRADE_KEYS
        }
    if isinstance(payload, list):
        return [_strip_grade_keys(item) for item in payload]
    return payload


def build_axis_source_document(records: list[dict[str, Any]]) -> dict[str, Any]:
    n = len(records)
    buckets = {
        axis: {
            "n": 0,
            "source_fields": list(AXIS_SOURCE_FIELDS[axis]),
            "listing_state": LISTING_STATE,
            "gspc_state": GSPC_STATE,
            "kind": "directory" if axis in FINANCIAL_AXES else "axis-source",
        }
        for axis in ALL_AXES
    }
    for record in records:
        hits = axis_source_hits(record)
        for axis, hit in hits.items():
            if hit:
                buckets[axis]["n"] += 1
    return _strip_grade_keys(
        {
            "kind": AXIS_SOURCES_KIND,
            "n": n,
            "n_measured": 0,
            "listing_state_all": LISTING_STATE,
            "status_all": GSPC_STATE,
            "axes": buckets,
            "note": (
                "Counts-only Hub axis-source census. Each n is the number of fetched "
                "listings whose Hub metadata could source that axis. DISCOVERED/"
                "UNMEASURED only. A listing is not a GSPC grade. Financial axis "
                "names here are directory coverage (who runs what), not issuer grades."
            ),
        }
    )


def build_org_register(records: list[dict[str, Any]]) -> dict[str, Any]:
    orgs: dict[str, dict[str, Any]] = {}
    for record in records:
        ident = record.get("id")
        if not ident:
            continue
        org = record.get("org") or org_of(ident, record.get("author") or record.get("created_by"))
        if not org:
            org = "unknown"
        slot = orgs.setdefault(
            org,
            {
                "org": org,
                "n": 0,
                "card_links": [],
                "coverage": {
                    axis: {"n": 0, "kind": "directory"}
                    for axis in FINANCIAL_AXES
                },
            },
        )
        slot["n"] += 1
        link = f"{HUB_CARD}/{ident}"
        if link not in slot["card_links"] and len(slot["card_links"]) < MAX_ORG_CARD_LINKS:
            slot["card_links"].append(link)
        hits = axis_source_hits(record)
        for axis in FINANCIAL_AXES:
            if hits.get(axis):
                slot["coverage"][axis]["n"] += 1
    rows = sorted(orgs.values(), key=lambda row: (-int(row["n"]), str(row["org"])))
    return _strip_grade_keys(
        {
            "kind": ORG_REGISTER_KIND,
            "n": len(records),
            "n_measured": 0,
            "n_orgs": len(rows),
            "listing_state_all": LISTING_STATE,
            "status_all": GSPC_STATE,
            "financial_axes_role": "directory",
            "orgs": rows,
            "note": (
                "Hub-level directory of discovered listings by lab/org. Each row is "
                "n plus Hub card links. Not a grade, not a rank, not an issuer, not "
                "XRPL. The 8 financial axis names are coverage/directory fields only."
            ),
        }
    )


def write_counts_only(
    out_dir: Path,
    records: list[dict[str, Any]] | None = None,
    *,
    jsonl_path: Path | None = None,
    source: str | None = None,
) -> dict[str, Any]:
    """Write counts-only artifacts. Never writes listings.jsonl or weights."""
    if records is None:
        if jsonl_path is None:
            jsonl_path = out_dir / "listings.jsonl"
        records = iter_records(jsonl_path)
    out_dir.mkdir(parents=True, exist_ok=True)
    axis_doc = build_axis_source_document(records)
    org_doc = build_org_register(records)
    unique_ids = [row.get("id") for row in records if row.get("id")]
    existing = load_json(out_dir / "SUMMARY.json", {})
    origin = source or existing.get("source") or "huggingface.co/api/models"
    axis_doc = {**axis_doc, "source": origin, "n_measured": 0}
    org_doc = {**org_doc, "source": origin, "n_measured": 0}
    summary = {
        "kind": KIND,
        "listing_state_all": LISTING_STATE,
        "status_all": GSPC_STATE,
        "n": len(unique_ids),
        "n_unique_ids": len(set(unique_ids)),
        "n_measured": 0,
        "weights_downloaded": 0,
        "gpu_inference": 0,
        "source": origin,
        "axis_source_file": "axis-sources.json",
        "org_register_file": "org-register.json",
        "note": (
            "Counts-only Hub census. n equals unique fetched ids. n_measured is 0: "
            "a listing is DISCOVERED, not a GSPC grade. Do not stamp MEASURED."
        ),
    }
    atomic_json(out_dir / "axis-sources.json", axis_doc)
    atomic_json(out_dir / "org-register.json", org_doc)
    atomic_json(out_dir / "SUMMARY.json", {**load_json(out_dir / "SUMMARY.json", {}), **summary})
    return {"summary": summary, "axis_sources": axis_doc, "org_register": org_doc}


def start_url(page_size: int, sort: str = "lastModified", direction: int = -1) -> str:
    query = [
        ("sort", sort),
        ("direction", str(direction)),
        ("limit", str(page_size)),
    ]
    query.extend(("expand", field) for field in EXPAND)
    return f"{HUB_MODELS}?{urllib.parse.urlencode(query)}"


def default_headers() -> dict[str, str]:
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    tok = token()
    if tok:
        headers["Authorization"] = f"Bearer {tok}"
    return headers


def fetch_page(
    url: str,
    *,
    opener: Callable[..., Any] | None = None,
    retries: int = 8,
) -> tuple[list[dict[str, Any]], str | None, dict[str, str]]:
    """GET one listing page. Returns (rows, next_url, response_headers)."""
    request = urllib.request.Request(url, headers=default_headers())
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            if opener:
                raw = opener(request)
                body = raw["body"]
                headers = raw["headers"]
                status = raw.get("status", 200)
            else:
                with urllib.request.urlopen(request, timeout=60) as resp:
                    body = resp.read()
                    headers = {k.lower(): v for k, v in resp.headers.items()}
                    status = resp.status
            if status == 429:
                wait = min(2 ** attempt, 60)
                time.sleep(wait)
                continue
            if status >= 400:
                raise urllib.error.HTTPError(url, status, body[:200], hdrs=None, fp=None)
            rows = json.loads(body.decode("utf-8"))
            if not isinstance(rows, list):
                raise ValueError(f"expected a JSON list from {url}")
            return rows, parse_link_next(headers.get("link")), headers
        except urllib.error.HTTPError as err:
            last_err = err
            if err.code in {429, 500, 502, 503, 504} and attempt + 1 < retries:
                time.sleep(min(2 ** attempt, 60))
                continue
            raise
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
            last_err = err
            if attempt + 1 < retries:
                time.sleep(min(2 ** attempt, 30))
                continue
            raise
    raise RuntimeError(f"failed to fetch {url}: {last_err}")


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def atomic_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(path)


def load_seen(jsonl_path: Path) -> set[str]:
    seen: set[str] = set()
    if not jsonl_path.exists():
        return seen
    with jsonl_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            ident = row.get("id")
            if ident:
                seen.add(ident)
    return seen


def synthetic_model(index: int) -> dict[str, Any]:
    org = "census-test"
    name = f"model-{index:07d}"
    return {
        "id": f"{org}/{name}",
        "author": org,
        "sha": f"{index:040x}"[:40],
        "lastModified": "2026-08-31T00:00:00.000Z",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "downloads": index,
        "likes": 0,
        "pipeline_tag": "text-generation",
        "tags": [
            "test",
            "license:apache-2.0",
            "safety",
            "care",
            "multimodal",
            "watermark",
            "art5",
            "swarm",
            "affect",
            "jailbreak",
        ],
        "gated": False,
        "private": False,
        "library_name": "transformers",
        "license": "apache-2.0",
        "siblings": [
            {"rfilename": "config.json"},
            {"rfilename": "README.md"},
        ],
        "cardData": {
            "license": "apache-2.0",
            "created_by": org,
            "trainers": ["synthetic-trainer"],
            "library_name": "transformers",
            "tags": ["safety", "care"],
        },
    }


def synthetic_hub_opener(*, total: int, page_size: int = 1000) -> Callable[..., Any]:
    """In-process Hub stand-in for restart tests. No network, no weights."""

    def opener(request: urllib.request.Request) -> dict[str, Any]:
        parsed = urllib.parse.urlparse(request.full_url)
        qs = urllib.parse.parse_qs(parsed.query)
        cursor = int(qs.get("cursor", ["0"])[0])
        size = int(qs.get("limit", [str(page_size)])[0])
        start = cursor
        end = min(start + size, total)
        rows = [synthetic_model(i) for i in range(start, end)]
        headers: dict[str, str] = {}
        if end < total:
            next_qs = dict(urllib.parse.parse_qsl(parsed.query, keep_blank_values=True))
            next_qs["cursor"] = str(end)
            next_url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(next_qs)))
            headers["link"] = f'<{next_url}>; rel="next"'
        return {"body": json.dumps(rows).encode("utf-8"), "headers": headers, "status": 200}

    return opener


def fixture_hub_opener(listings: list[dict[str, Any]], page_size: int = 1000) -> Callable[..., Any]:
    """Serve an explicit listing list through the same Link-cursor contract."""

    def opener(request: urllib.request.Request) -> dict[str, Any]:
        parsed = urllib.parse.urlparse(request.full_url)
        qs = urllib.parse.parse_qs(parsed.query)
        cursor = int(qs.get("cursor", ["0"])[0])
        size = int(qs.get("limit", [str(page_size)])[0])
        start = cursor
        end = min(start + size, len(listings))
        rows = listings[start:end]
        headers: dict[str, str] = {}
        if end < len(listings):
            next_qs = dict(urllib.parse.parse_qsl(parsed.query, keep_blank_values=True))
            next_qs["cursor"] = str(end)
            next_url = urllib.parse.urlunparse(parsed._replace(query=urllib.parse.urlencode(next_qs)))
            headers["link"] = f'<{next_url}>; rel="next"'
        return {"body": json.dumps(rows).encode("utf-8"), "headers": headers, "status": 200}

    return opener


def empty_state(out_dir: Path, *, mode: str, page_size: int, limit: int | None) -> dict[str, Any]:
    return {
        "kind": KIND,
        "mode": mode,
        "sort": "lastModified",
        "direction": -1,
        "page_size": page_size,
        "limit": limit,
        "next_url": start_url(page_size),
        "pages_done": 0,
        "n_written": 0,
        "n_seen": 0,
        "n_duplicate_skipped": 0,
        "last_id": None,
        "last_modified": None,
        "started_at": utcnow(),
        "updated_at": utcnow(),
        "complete": False,
        "complete_reason": None,
        "out_dir": str(out_dir),
        "weights_downloaded": 0,
        "gpu_inference": 0,
        "listing_state_all": LISTING_STATE,
        "status_all": GSPC_STATE,
        "n_measured": 0,
    }


def write_summary(out_dir: Path, state: dict[str, Any], jsonl_path: Path) -> dict[str, Any]:
    digest = None
    size = 0
    if jsonl_path.exists():
        size = jsonl_path.stat().st_size
        hasher = hashlib.sha256()
        with jsonl_path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                hasher.update(chunk)
        digest = hasher.hexdigest()
    summary = {
        "kind": KIND,
        "listing_state_all": LISTING_STATE,
        "status_all": GSPC_STATE,
        "n": state.get("n_written", 0),
        "n_measured": 0,
        "n_unique_ids": state.get("n_seen", 0),
        "n_duplicate_skipped": state.get("n_duplicate_skipped", 0),
        "n_site_pages": state.get("pages_done", 0),
        "pages_done": state.get("pages_done", 0),
        "complete": bool(state.get("complete")),
        "complete_reason": state.get("complete_reason"),
        "sort": state.get("sort"),
        "filter": (
            "huggingface Hub list_models(sort=lastModified, "
            f"expand={list(EXPAND)}) — cursor-preserving GET {HUB_MODELS}"
        ),
        "bytes_jsonl": size,
        "sha256_jsonl": digest,
        "as_of": utcnow(),
        "mode": state.get("mode"),
        "next_url": None if state.get("complete") else state.get("next_url"),
        "last_id": state.get("last_id"),
        "last_modified": state.get("last_modified"),
        "weights_downloaded": 0,
        "gpu_inference": 0,
        "note": (
            "Speed 0 metadata census. No weight download. No GPU. "
            "A listing is DISCOVERED, not a GSPC grade. Do not stamp MEASURED. "
            "sha256_jsonl is a census digest, not a signed GSPC cell."
        ),
    }
    atomic_json(out_dir / "SUMMARY.json", summary)
    return summary


def should_stop_delta(row: dict[str, Any], floor: datetime | None) -> bool:
    if floor is None:
        return False
    seen_at = parse_iso(row.get("last_modified"))
    if seen_at is None:
        return False
    if seen_at.tzinfo is None:
        seen_at = seen_at.replace(tzinfo=timezone.utc)
    return seen_at < floor


def collect(
    out_dir: Path,
    *,
    limit: int | None = None,
    page_size: int = 1000,
    mode: str = "baseline",
    resume: bool = True,
    since: str | None = None,
    overlap_hours: float = 6.0,
    opener: Callable[..., Any] | None = None,
    sleep_s: float = 0.0,
    progress: Callable[[dict[str, Any]], None] | None = None,
    publish_dir: Path | None = None,
    source: str | None = None,
) -> dict[str, Any]:
    out_dir.mkdir(parents=True, exist_ok=True)
    jsonl_path = out_dir / "listings.jsonl"
    cursor_path = out_dir / "cursor.json"
    state = load_json(cursor_path, None)
    if not resume or not isinstance(state, dict) or state.get("kind") != KIND:
        state = empty_state(out_dir, mode=mode, page_size=page_size, limit=limit)
        if not resume:
            for leftover in (jsonl_path, cursor_path, out_dir / "SUMMARY.json"):
                if leftover.exists():
                    leftover.unlink()
    else:
        if limit is not None:
            state["limit"] = limit
            if int(state.get("n_written") or 0) < limit:
                state["complete"] = False
                if state.get("complete_reason") == "limit":
                    state["complete_reason"] = None
        state["mode"] = mode
        if not state.get("next_url"):
            state["next_url"] = start_url(page_size)

    seen = load_seen(jsonl_path)
    state["n_seen"] = max(int(state.get("n_seen") or 0), len(seen))
    state["n_written"] = max(int(state.get("n_written") or 0), len(seen))
    floor = None
    if mode == "delta":
        watermark = parse_iso(since) or datetime.now(timezone.utc)
        floor = watermark - timedelta(hours=overlap_hours)

    url = state.get("next_url")
    with jsonl_path.open("a", encoding="utf-8") as handle:
        while url:
            if limit is not None and int(state["n_written"]) >= limit:
                state["complete"] = True
                state["complete_reason"] = "limit"
                state["next_url"] = url
                break
            rows, nxt, _headers = fetch_page(url, opener=opener)
            page_new = 0
            hit_floor = False
            page_fully_consumed = True
            for raw in rows:
                if limit is not None and int(state["n_written"]) >= limit:
                    state["complete"] = True
                    state["complete_reason"] = "limit"
                    page_fully_consumed = False
                    break
                record = listing_record(raw)
                ident = record.get("id")
                if not ident:
                    continue
                if should_stop_delta(record, floor):
                    hit_floor = True
                    page_fully_consumed = False
                    break
                if ident in seen:
                    state["n_duplicate_skipped"] = int(state.get("n_duplicate_skipped") or 0) + 1
                    continue
                if record["gspc_state"] != GSPC_STATE or record["listing_state"] != LISTING_STATE:
                    raise RuntimeError("collector refused to write a non-DISCOVERED/UNMEASURED row")
                handle.write(json.dumps(record, separators=(",", ":")) + "\n")
                seen.add(ident)
                page_new += 1
                state["n_written"] = int(state.get("n_written") or 0) + 1
                state["n_seen"] = len(seen)
                state["last_id"] = ident
                state["last_modified"] = record.get("last_modified")
            handle.flush()
            os.fsync(handle.fileno())
            if page_fully_consumed:
                state["pages_done"] = int(state.get("pages_done") or 0) + 1
            if hit_floor:
                state["complete"] = True
                state["complete_reason"] = "delta-watermark"
                state["next_url"] = url
            elif state.get("complete_reason") == "limit":
                # Re-fetch this page on resume; the seen-set skips already-written ids.
                state["next_url"] = url
            elif nxt is None:
                state["complete"] = True
                state["complete_reason"] = "hub-exhausted"
                state["next_url"] = None
            else:
                state["next_url"] = nxt
            state["updated_at"] = utcnow()
            atomic_json(cursor_path, state)
            if progress:
                progress({**state, "page_new": page_new})
            if state.get("complete"):
                break
            url = state.get("next_url")
            if sleep_s:
                time.sleep(sleep_s)

    summary = write_summary(out_dir, state, jsonl_path)
    origin = source or ("synthetic-hub-opener" if opener is not None else "huggingface.co/api/models")
    artifacts = write_counts_only(out_dir, jsonl_path=jsonl_path, source=origin)
    if publish_dir is not None:
        write_counts_only(publish_dir, jsonl_path=jsonl_path, source=origin)
    atomic_json(cursor_path, state)
    return {
        "state": state,
        "summary": {**summary, **artifacts["summary"]},
        "jsonl": str(jsonl_path),
        "axis_sources": artifacts["axis_sources"],
        "org_register": artifacts["org_register"],
    }


def restart_test(
    out_dir: Path,
    *,
    total: int = 10_000,
    split: int | None = None,
    page_size: int = 1000,
    opener: Callable[..., Any] | None = None,
    live: bool = False,
) -> dict[str, Any]:
    """Prove resume does not duplicate: first half, then continue to total."""
    if split is None:
        split = total // 2
    if out_dir.exists():
        for child in out_dir.iterdir():
            if child.is_file():
                child.unlink()
    first = collect(
        out_dir,
        limit=split,
        page_size=page_size,
        mode="baseline",
        resume=False,
        opener=opener,
    )
    cursor_after_first = load_json(out_dir / "cursor.json", {})
    second = collect(
        out_dir,
        limit=total,
        page_size=page_size,
        mode="baseline",
        resume=True,
        opener=opener,
    )
    ids = load_seen(out_dir / "listings.jsonl")
    written = second["state"]["n_written"]
    if written != total:
        raise AssertionError(f"expected {total} written, got {written}")
    if len(ids) != total:
        raise AssertionError(f"expected {total} unique ids, got {len(ids)}")
    if second["state"]["n_duplicate_skipped"] < 0:
        raise AssertionError("negative duplicate count")
    if not cursor_after_first.get("next_url"):
        raise AssertionError("first half did not persist a resume cursor")
    if first["state"]["pages_done"] >= second["state"]["pages_done"] and total > split:
        raise AssertionError("resume did not advance pages")
    if any(row_has_measured(out_dir / "listings.jsonl")):
        raise AssertionError("collector wrote a MEASURED row")
    report = {
        "ok": True,
        "live": live,
        "split": split,
        "total": total,
        "unique_ids": len(ids),
        "pages_first": first["state"]["pages_done"],
        "pages_second": second["state"]["pages_done"],
        "duplicates_skipped": second["state"]["n_duplicate_skipped"],
        "bytes_jsonl": second["summary"]["bytes_jsonl"],
        "sha256_jsonl": second["summary"]["sha256_jsonl"],
        "weights_downloaded": 0,
        "gpu_inference": 0,
        "status_all": GSPC_STATE,
    }
    atomic_json(out_dir / "RESTART_TEST.json", report)
    return report


def row_has_measured(jsonl_path: Path) -> Iterable[bool]:
    if not jsonl_path.exists():
        return
    with jsonl_path.open("r", encoding="utf-8") as handle:
        for line in handle:
            if not line.strip():
                continue
            row = json.loads(line)
            if str(row.get("gspc_state") or "").upper() == "MEASURED":
                yield True


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Cursor-preserving Speed 0 Hub census")
    sub = parser.add_subparsers(dest="cmd", required=True)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--out-dir", required=True, type=Path)
    common.add_argument("--page-size", type=int, default=1000)
    common.add_argument("--limit", type=int, default=None)
    common.add_argument("--sleep", type=float, default=0.0)

    collect_p = sub.add_parser("collect", parents=[common])
    collect_p.add_argument("--mode", choices=("baseline", "delta", "reconcile"), default="baseline")
    collect_p.add_argument("--resume", action="store_true")
    collect_p.add_argument("--fresh", action="store_true")
    collect_p.add_argument("--since", default=None, help="ISO timestamp for delta watermark")
    collect_p.add_argument("--overlap-hours", type=float, default=6.0)
    collect_p.add_argument(
        "--publish-dir",
        type=Path,
        default=None,
        help="Write counts-only axis-sources.json + org-register.json here (never listings.jsonl)",
    )
    collect_p.add_argument(
        "--synthetic",
        action="store_true",
        help="Use the in-process Hub stand-in (no live API, no probes, no weights)",
    )
    collect_p.add_argument("--synthetic-total", type=int, default=32)

    counts_p = sub.add_parser("counts", parents=[common])
    counts_p.add_argument("--publish-dir", type=Path, default=None)

    digest_p = sub.add_parser("digest", parents=[common])
    digest_p.add_argument("--publish-dir", type=Path, default=None)

    restart = sub.add_parser("restart-test", parents=[common])
    restart.add_argument("--total", type=int, default=10_000)
    restart.add_argument("--split", type=int, default=None)
    restart.add_argument("--live", action="store_true")
    return parser


def _progress(state: dict[str, Any]) -> None:
    sys.stderr.write(
        f"[{state.get('updated_at')}] pages={state.get('pages_done')} "
        f"written={state.get('n_written')} skipped={state.get('n_duplicate_skipped')} "
        f"complete={state.get('complete')} reason={state.get('complete_reason')}\n"
    )
    sys.stderr.flush()


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.cmd == "collect":
        opener = None
        if getattr(args, "synthetic", False):
            total = max(int(args.synthetic_total), int(args.limit or 0), 1)
            opener = synthetic_hub_opener(total=total, page_size=args.page_size)
        result = collect(
            args.out_dir,
            limit=args.limit,
            page_size=args.page_size,
            mode=args.mode,
            resume=not args.fresh,
            since=args.since,
            overlap_hours=args.overlap_hours,
            sleep_s=args.sleep,
            progress=_progress,
            opener=opener,
            publish_dir=getattr(args, "publish_dir", None),
            source="synthetic-hub-opener" if opener is not None else "huggingface.co/api/models",
        )
        json.dump(result["summary"], sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    if args.cmd == "counts":
        artifacts = write_counts_only(args.out_dir, jsonl_path=args.out_dir / "listings.jsonl")
        if args.publish_dir is not None:
            write_counts_only(args.publish_dir, jsonl_path=args.out_dir / "listings.jsonl")
        json.dump(artifacts["summary"], sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    if args.cmd == "digest":
        state = load_json(args.out_dir / "cursor.json", empty_state(args.out_dir, mode="baseline", page_size=1000, limit=None))
        summary = write_summary(args.out_dir, state, args.out_dir / "listings.jsonl")
        artifacts = write_counts_only(args.out_dir, jsonl_path=args.out_dir / "listings.jsonl")
        if getattr(args, "publish_dir", None) is not None:
            write_counts_only(args.publish_dir, jsonl_path=args.out_dir / "listings.jsonl")
        json.dump({**summary, **artifacts["summary"]}, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    if args.cmd == "restart-test":
        opener = None
        if not args.live:
            opener = synthetic_hub_opener(
                total=max(args.total * 2, args.total + args.page_size),
                page_size=args.page_size,
            )
        report = restart_test(
            args.out_dir,
            total=args.total,
            split=args.split,
            page_size=args.page_size,
            opener=opener,
            live=bool(args.live),
        )
        json.dump(report, sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
