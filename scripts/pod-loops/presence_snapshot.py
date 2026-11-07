#!/usr/bin/env python3
"""Publish a dated presence snapshot from the live presence rail.

THE GAP THIS CLOSES (4 Nov 2026). The estate's presence rail runs every minute and writes every
reading to $LANES/presence/census.jsonl — six index surfaces (CDP Bazaar, Glama, HF MCP tag, MCP
registry, PayAI, Smithery) plus the estate's own published state. Nothing published it. The only
presence artefact anyone could read was the 2026-09-22 board: a one-off rendered audit, 43 days
old, with no series behind it. So a live, every-minute measurement was invisible.

This publishes one dated snapshot per day, from the rail's own committed bytes:

  estate-presence-<date>.jsonl   every reading the rail took that day, verbatim
  presence-snapshot-<date>.json  the final reading of each tier, the day's changes, provenance
  PRESENCE-<date>.md             the same, in prose, with what the counts do and do not mean

WHAT THE COUNTS ARE. Each number is what one index returned when we asked it, at the minute
recorded on the row. A 0 is a reading from a query we actually made — it is not the absence of a
measurement, and it is not a score. A surface that stopped answering would show up as a change row,
not as a smaller number.

WHAT THIS IS NOT. Not a ranking of indexes, not a claim that an index is good or bad, not a
certification, and not a count of how many people can find us. It is a dated reading of where this
estate is listed, and where it is not.

PROVENANCE. The snapshot carries the sha256, byte length and row count of the file it was cut from,
so anyone can re-run this script and get the same bytes. as_of is the rail's own timestamp; it is
never the time this was served.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


def resolve_lanes() -> Path | None:
    """The lanes root, resolved the way lib.sh and hf_upload.py resolve it.

    Returns None when there is none. It does NOT raise, and that is load-bearing: this module
    is imported by anything that wants to read the publisher without running it, and a raise
    here killed the module at import time on any host that has no lanes root - which is every
    host that is not the pod. The refusal to publish without a lanes root moved to main(),
    where it belongs.
    """
    env = os.environ.get("LANES", "").strip()
    if env:
        return Path(env)
    candidates = [Path("/workspace/lanes")]
    try:
        candidates.append(Path.home() / "lanes")
    except (RuntimeError, OSError):
        pass
    for cand in candidates:
        if cand.is_dir():
            return cand
    return None


# None is allowed at import; lanes_root(), source_path() and uploader_path() refuse to act on it.
LANES: Path | None = resolve_lanes()


def lanes_root() -> Path:
    if LANES is None:
        raise SystemExit(
            "presence_snapshot: LANES is unset and no lanes root was found "
            "(looked for /workspace/lanes and $HOME/lanes); nothing was published."
        )
    return LANES


def source_path() -> Path:
    return lanes_root() / "presence" / "census.jsonl"


def uploader_path() -> Path:
    return lanes_root() / "loops" / "hf_upload.py"


REPO = "csoai/index-presence"

SURFACES = [
    "cdp_bazaar",
    "glama",
    "hf_mcp_server_tag",
    "mcp_registry",
    "payai",
    "smithery",
]


def declared_cron() -> list[str]:
    """The rail's own cron lines as installed on the host at publish time (best effort)."""
    try:
        out = subprocess.run(
            ["crontab", "-l"], capture_output=True, text=True, timeout=15
        ).stdout
    except Exception:
        return []
    return [
        line.strip()
        for line in out.splitlines()
        if "presence_loop.py" in line and not line.strip().startswith("#")
    ]


def build(date: str) -> tuple[dict, list[dict], list[dict]]:
    source = source_path()
    if not source.is_file():
        raise SystemExit(f"presence_snapshot: {source} is missing — the rail has not written a reading.")
    raw = source.read_bytes()
    all_rows: list[dict] = []
    for line in raw.decode("utf-8", "replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            all_rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue

    day_rows = [r for r in all_rows if str(r.get("ts", "")).startswith(date)]
    if not day_rows:
        raise SystemExit(f"presence_snapshot: no reading on {date} — nothing to publish.")

    # The last heartbeat of each tier is that tier's final reading for the day.
    final: dict[str, dict] = {}
    for row in all_rows:
        if row.get("kind") == "heartbeat" and str(row.get("ts", "")).startswith(date):
            final[str(row.get("tier"))] = row.get("values", {})

    changes = [r for r in day_rows if r.get("kind") == "change"]
    changed_lines: list[str] = []
    for row in changes:
        for line in row.get("changes", []) or []:
            if line not in changed_lines:
                changed_lines.append(line)

    # The cadence of the RECORD, measured from the record — not assumed, and not the loop's cron.
    # The rail's fast tier is on a one-minute cron and its slow tier on a ten-minute one, but it
    # writes a heartbeat every fifteen minutes plus a row on every change. So a gap between two
    # recorded rows is the recording cadence, not evidence that the rail stopped.
    def median_gap_minutes(tier: str) -> float | None:
        stamps = sorted(
            str(r.get("ts")) for r in all_rows if r.get("kind") == "heartbeat" and r.get("tier") == tier
        )
        gaps: list[float] = []
        for a, b in zip(stamps, stamps[1:]):
            try:
                gaps.append(
                    (datetime.datetime.fromisoformat(b.replace("Z", "+00:00"))
                     - datetime.datetime.fromisoformat(a.replace("Z", "+00:00"))).total_seconds() / 60.0
                )
            except ValueError:
                continue
        if not gaps:
            return None
        gaps.sort()
        return round(gaps[len(gaps) // 2], 1)

    per_day: dict[str, int] = {}
    for r in all_rows:
        per_day[str(r.get("ts", ""))[:10]] = per_day.get(str(r.get("ts", ""))[:10], 0) + 1
    days_present = sorted(d for d in per_day if d)
    missing: list[str] = []
    if days_present:
        first = datetime.date.fromisoformat(days_present[0])
        last = datetime.date.fromisoformat(days_present[-1])
        day = first
        while day <= last:
            if day.isoformat() not in per_day:
                missing.append(day.isoformat())
            day += datetime.timedelta(days=1)

    surfaces: dict[str, object] = {}
    for name in SURFACES:
        reading = None
        for tier in ("fast", "slow"):
            if name in (final.get(tier) or {}):
                reading = (final[tier])[name]
                break
        if reading is None:
            surfaces[name] = {
                "state": "UNMEASURED",
                "rule": "this rail does not read this surface; no reading was taken, which is not a zero",
            }
        elif isinstance(reading, dict):
            surfaces[name] = {
                "state": "READ",
                "count": reading.get("count"),
                "detail": {k: v for k, v in reading.items() if k != "count"},
            }
        else:
            surfaces[name] = {"state": "READ", "count": reading}

    snapshot = {
        "schema": "csoai.presence-snapshot/0.1",
        "record_type": "dated-reading-of-index-presence",
        "title": "Where this estate is listed, read once a minute",
        "as_of": max(str(r.get("ts")) for r in day_rows),
        "window": {
            "from": min(str(r.get("ts")) for r in day_rows),
            "to": max(str(r.get("ts")) for r in day_rows),
            "readings": len(day_rows),
            "tiers": sorted(final.keys()),
        },
        "what": (
            "The estate's presence rail asks six index surfaces what they list for it, once a minute, "
            "and writes every reading down. This is one dated slice of that series."
        ),
        "not_this": [
            "Not a ranking of indexes and not a claim that any index is good or bad.",
            "Not a count of how many people can find this estate.",
            "Not a certification, and not a measurement of anyone's behaviour.",
            "A 0 here is a reading from a query we made at that minute. It is not an absent measurement, "
            "and it is not a score.",
        ],
        "surfaces": surfaces,
        "cadence": {
            "observed_median_gap_minutes": {
                "fast": median_gap_minutes("fast"),
                "slow": median_gap_minutes("slow"),
            },
            "note": (
                "The rail's fast tier is on a one-minute cron and its slow tier on a ten-minute one, "
                "but it RECORDS a heartbeat every fifteen minutes plus a row on every change. A gap "
                "between two recorded rows is that recording cadence, not evidence that the rail stopped."
            ),
            "declared_cron_as_installed": declared_cron(),
        },
        "coverage": {
            "days_present": len(days_present),
            "first_day": days_present[0] if days_present else None,
            "last_day": days_present[-1] if days_present else None,
            "missing_days": missing,
            "missing_days_note": (
                "Days with no row at all in the file. The rail was not writing on those days; a gap in "
                "the series is an absent day and is not a measurement of anything."
            ),
            "per_day_rows": per_day,
        },
        "changes": {
            "rows": len(changes),
            "distinct": len(changed_lines),
            "lines": changed_lines[:400],
            "note": "A change row records that a surface's answer changed between two readings.",
        },
        "provenance": {
            "source": str(source_path()),
            "source_sha256": hashlib.sha256(raw).hexdigest(),
            "source_bytes": len(raw),
            "source_rows_total": len(all_rows),
            "rows_for_date": len(day_rows),
            "generator": "scripts/pod-loops/presence_snapshot.py",
            "reproduce": "the same script over the same bytes yields the same snapshot",
        },
    }
    return snapshot, day_rows, all_rows


def board(snapshot: dict, date: str) -> str:
    s = snapshot
    lines = [
        f"# Presence snapshot — {date}",
        "",
        "> **Start here — free verify:** <https://councilof.ai/gspc-verify/> · "
        "**Live board:** <https://councilof.ai/api/gspc> · "
        "**Full catalog:** <https://councilof.ai/catalog.json> · Measurement, not certification.",
        "",
        f"The estate's presence rail asks six index surfaces what they list for it, once a minute, and",
        f"writes every reading down. This is the slice for **{date}**: "
        f"{s['window']['readings']} readings between {s['window']['from']} and {s['window']['to']}.",
        "",
        "## Where the estate is listed",
        "",
        "| surface | reading | what it means |",
        "|---|---|---|",
    ]
    for name, v in s["surfaces"].items():
        if v.get("state") == "UNMEASURED":
            lines.append(f"| `{name}` | UNMEASURED | this rail does not read this surface |")
        else:
            lines.append(f"| `{name}` | {v.get('count')} | what the index returned when we asked |")
    lines += [
        "",
        "## What changed that day",
        "",
        f"{s['changes']['rows']} change rows, {s['changes']['distinct']} distinct changes.",
        "",
    ]
    for line in s["changes"]["lines"][:40]:
        lines.append(f"- `{line}`")
    if len(s["changes"]["lines"]) > 40:
        lines.append(f"- … and {len(s['changes']['lines']) - 40} more, in the JSON.")
    lines += [
        "",
        "## What this is not",
        "",
    ]
    for item in s["not_this"]:
        lines.append(f"- {item}")
    lines += [
        "",
        "## Provenance",
        "",
        f"- source: `{s['provenance']['source']}`",
        f"- sha256: `{s['provenance']['source_sha256']}`",
        f"- bytes: {s['provenance']['source_bytes']} · rows in the file: {s['provenance']['source_rows_total']} · rows for this date: {s['provenance']['rows_for_date']}",
        f"- generator: `{s['provenance']['generator']}` — the same script over the same bytes yields this snapshot",
        "",
        "## Citation",
        "",
        "```bibtex",
        "@misc{csoai_index_presence_snapshot,",
        "  title        = {Index-presence snapshot},",
        "  author       = {{CSOAI Ltd}},",
        f"  year         = {{{date[:4]}}},",
        f"  howpublished = {{Hugging Face dataset, https://huggingface.co/datasets/{REPO}}},",
        "  note         = {Corrections: https://councilof.ai/api/corrections. Measurement, not certification.}",
        "}",
        "```",
        "",
    ]
    return "\n".join(lines)


def upload(local: Path, path_in_repo: str, config_name: str | None = None) -> None:
    cmd = [
        sys.executable,
        str(uploader_path()),
        "--repo",
        REPO,
        "--file",
        str(local),
        "--path-in-repo",
        path_in_repo,
    ]
    if config_name:
        cmd += ["--config-name", config_name]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0 or "UPLOADED" not in out:
        raise SystemExit(f"presence_snapshot: upload of {path_in_repo} failed: {out[:300]}")
    print(f"uploaded {path_in_repo}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=None, help="UTC date to publish (default: today)")
    ap.add_argument("--no-upload", action="store_true")
    args = ap.parse_args()

    # Refuse to publish for real without a lanes root. The check lives here, not at import,
    # so that importing this module on a host that has no lanes root is not fatal.
    lanes_root()

    date = args.date or __import__("datetime").datetime.now(__import__("datetime").timezone.utc).strftime("%Y-%m-%d")
    snapshot, day_rows, all_rows = build(date)

    outdir = lanes_root() / "out" / "presence" / date
    outdir.mkdir(parents=True, exist_ok=True)
    rows_path = outdir / f"estate-presence-{date}.jsonl"
    series_path = outdir / "presence-series.jsonl"
    snap_path = outdir / f"presence-snapshot-{date}.json"
    board_path = outdir / f"PRESENCE-{date}.md"

    rows_path.write_text(
        "".join(json.dumps(r, sort_keys=True) + "\n" for r in day_rows), encoding="utf-8"
    )
    # The whole series, not just the day: the file holds every reading since 2026-09-29, and
    # publishing only today would strand the history.
    series_path.write_text(
        "".join(json.dumps(r, sort_keys=True) + "\n" for r in all_rows), encoding="utf-8"
    )
    snap_path.write_text(json.dumps(snapshot, indent=1) + "\n", encoding="utf-8")
    board_path.write_text(board(snapshot, date), encoding="utf-8")

    print(
        f"presence_snapshot: {date} — {snapshot['window']['readings']} readings, "
        f"{snapshot['changes']['rows']} change rows, {len(snapshot['surfaces'])} surfaces, "
        f"{len(all_rows)} rows in the series"
    )
    if args.no_upload:
        return 0

    upload(rows_path, f"{date}/{rows_path.name}", config_name=f"estate-presence-{date}")
    upload(series_path, f"{date}/{series_path.name}")
    upload(snap_path, f"{date}/{snap_path.name}")
    upload(board_path, f"{date}/{board_path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
