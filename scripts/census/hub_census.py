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
HUB_MODELS = "https://huggingface.co/api/models"
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
)
LISTING_STATE = "DISCOVERED"
GSPC_STATE = "UNMEASURED"
USER_AGENT = "csoai-hub-census/0.1 (+https://councilof.ai)"
LINK_NEXT = re.compile(r'<([^>]+)>\s*;\s*rel="next"', re.I)


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


def listing_record(raw: dict[str, Any], source: str = "huggingface") -> dict[str, Any]:
    return {
        "id": raw.get("id"),
        "source": source,
        "source_revision": raw.get("sha"),
        "last_modified": raw.get("lastModified") or raw.get("last_modified"),
        "listing_state": LISTING_STATE,
        "gspc_state": GSPC_STATE,
        "downloads": raw.get("downloads"),
        "likes": raw.get("likes"),
        "pipeline_tag": raw.get("pipeline_tag") or raw.get("pipelineTag"),
        "tags": raw.get("tags") or [],
        "gated": raw.get("gated"),
        "private": raw.get("private"),
        "library_name": raw.get("library_name") or raw.get("libraryName"),
        "artefact_manifest_digest": None,
        "lineage": None,
        "runtime_variant": None,
    }


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
    return {
        "id": f"census-test/model-{index:07d}",
        "sha": f"{index:040x}"[:40],
        "lastModified": "2026-08-31T00:00:00.000Z",
        "downloads": index,
        "likes": 0,
        "pipeline_tag": "text-generation",
        "tags": ["test"],
        "gated": False,
        "private": False,
        "library_name": "transformers",
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
    atomic_json(cursor_path, state)
    return {"state": state, "summary": summary, "jsonl": str(jsonl_path)}


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

    sub.add_parser("digest", parents=[common])

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
        )
        json.dump(result["summary"], sys.stdout, indent=2)
        sys.stdout.write("\n")
        return 0
    if args.cmd == "digest":
        state = load_json(args.out_dir / "cursor.json", empty_state(args.out_dir, mode="baseline", page_size=1000, limit=None))
        summary = write_summary(args.out_dir, state, args.out_dir / "listings.jsonl")
        json.dump(summary, sys.stdout, indent=2)
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
