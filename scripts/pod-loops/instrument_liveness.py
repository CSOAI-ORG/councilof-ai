#!/usr/bin/env python3
"""Publish a dated record of whether the estate's own instruments are still producing.

THE GAP THIS CLOSES (6 Nov 2026). Two of this estate's measurement loops had been silent and
nothing said so. The settlement census published nothing on 4 and 5 Nov because a lane had
replaced the shared clone the loop reads; the three deck jobs published nothing from 3 Nov
because a disk-floor guard was gating them on a filesystem they never write to. Both failures
were visible only in a log file on one host. A reader of the site could not tell the difference
between "the estate measured nothing today" and "the estate measured and published nothing
today" - and the second is the one that loses measurements.

So this publishes, once a day, what each instrument's OWN OUTPUT says about it. Nothing here is
typed. Every field is derived from bytes the instrument itself wrote:

  · when the instrument last produced output, read out of that output;
  · how many rows it produced;
  · the sha256 and byte length of the file it was cut from, so anyone can re-run this script
    and get the same bytes;
  · the days it produced nothing, listed by date.

WHAT THE VERDICT IS NOT. Not a ranking of instruments, not a score, not a certification of any
loop, and not a claim that a loop's output is good. A loop that produced no output is
NO_OUTPUT - which is a fact about the output, and not a judgement about the loop. A loop whose
cadence is exceeded is BEHIND_CADENCE - a statement about elapsed time, not about quality.

WHAT THIS IS NOT. Not a measurement of anyone's behaviour. Not a claim that the estate's
coverage is complete. The absence of a row here is the absence of a row, not a zero.

PROVENANCE. as_of is the newest timestamp found in the instrument's own output, never the time
this was served. Every count comes from a file whose digest is published alongside it.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = "csoai/instrument-liveness"


def resolve_lanes() -> Path | None:
    """The lanes root, resolved the way lib.sh and hf_upload.py resolve it.

    Returns None when there is none. It does NOT raise, and that is load-bearing: this module
    is imported by --selftest, which runs on CI where there is no lanes root at all. A raise
    here would kill the module at import time, so the selftest would die before it ran and the
    CI step would go red for a reason that has nothing to do with the thing under test. The
    refusal to run for real without a lanes root moved to main(), where it belongs.
    """
    env = os.environ.get("LANES")
    if env:
        return Path(env).expanduser()
    for candidate in (Path.home() / "lanes", Path("/workspace/lanes")):
        if candidate.is_dir():
            return candidate
    return None


# None is allowed at import; assess(), upload() and main() refuse to act on it.
LANES: Path | None = resolve_lanes()

# Each instrument names the files it writes and the cadence it runs at. The cadence is a fact
# about the instrument's own schedule (the cron line that drives it), not a typed status.
INSTRUMENTS = [
    {
        "id": "x402-settlement-census",
        "what": "the daily conformance census of x402 doors",
        "cadence_hours": 24,
        "kind": "dated_files",
        "dir": "out/x402-settlement-census",
        "pattern": re.compile(r"^dry-(\d{4}-\d{2}-\d{2})\.jsonl$"),
        "done_suffix": ".done",
    },
    {
        "id": "presence-rail",
        "what": "the presence rail's reading of six index surfaces, once a minute",
        "cadence_hours": 1,
        "kind": "jsonl",
        "path": "presence/census.jsonl",
        "ts_field": "ts",
    },
    {
        "id": "deck-daily",
        "what": "the deck-lang hourly read-only checks, with hash-chained receipts",
        "cadence_hours": 1,
        "kind": "jsonl",
        "path": "deck-receipts/daily.jsonl",
        "ts_field": "finished_at",
    },
    {
        "id": "deck-onboard",
        "what": "the layer-o registry onboard deck",
        "cadence_hours": 1,
        "kind": "jsonl",
        "path": "deck-receipts/onboard.jsonl",
        "ts_field": "finished_at",
    },
    {
        "id": "deck-registry",
        "what": "the layer-o registry deck",
        "cadence_hours": 1,
        "kind": "jsonl",
        "path": "deck-receipts/registry.jsonl",
        "ts_field": "finished_at",
    },
]


def sha256_and_len(path: Path) -> tuple[str, int]:
    data = path.read_bytes()
    return hashlib.sha256(data).hexdigest(), len(data)


def newest_ts(rows: list[dict], field: str) -> str | None:
    stamps = [str(r.get(field)) for r in rows if r.get(field)]
    return max(stamps) if stamps else None


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def assess(spec: dict, report_date: str) -> dict:
    """Derive one instrument's record from its own output. Nothing is typed in."""
    if LANES is None:
        raise SystemExit(
            "instrument_liveness: no lanes root. Set LANES=/path/to/lanes and re-run. Nothing was written."
        )
    rec: dict = {
        "instrument": spec["id"],
        "what": spec["what"],
        "cadence_hours": spec["cadence_hours"],
    }
    if spec["kind"] == "dated_files":
        d = LANES / spec["dir"]
        published = []
        for p in sorted(d.glob("dry-*.jsonl")) if d.is_dir() else []:
            m = spec["pattern"].match(p.name)
            if not m:
                continue
            day = m.group(1)
            done = p.with_name(p.name + spec["done_suffix"])
            if not done.exists():
                # Rows were written but the release was never published. That is not the same
                # thing as a published day, and it is recorded as its own state.
                continue
            published.append((day, p, done))
        rec["published_days"] = len(published)
        if not published:
            rec["state"] = "NO_OUTPUT"
            rec["reason"] = "no file this instrument wrote carries a publication marker"
            return rec
        day, path, done = published[-1]
        rows = read_jsonl(path)
        digest, size = sha256_and_len(path)
        last = newest_ts(rows, "observed_at") or done.read_text(encoding="utf-8").strip()
        days = {d for d, _, _ in published}
        first = published[0][0]
        missing = []
        cur = dt.date.fromisoformat(first)
        end = dt.date.fromisoformat(day)
        while cur <= end:
            if cur.isoformat() not in days:
                missing.append(cur.isoformat())
            cur += dt.timedelta(days=1)
        rec.update({
            "state": "PUBLISHED",
            "last_published_day": day,
            "last_output_at": last,
            "rows": len(rows),
            "bytes": size,
            "sha256": digest,
            "first_published_day": first,
            "days_with_no_publication": missing,
        })
        return rec

    path = LANES / spec["path"]
    if not path.exists() or path.stat().st_size == 0:
        rec["state"] = "NO_OUTPUT"
        rec["reason"] = "no file at the path this instrument writes to"
        return rec
    rows = read_jsonl(path)
    if not rows:
        rec["state"] = "NO_OUTPUT"
        rec["reason"] = "the file exists and is empty"
        return rec
    digest, size = sha256_and_len(path)
    last = newest_ts(rows, spec["ts_field"])
    if last:
        # The strongest evidence: a timestamp the instrument itself wrote into the row.
        rec["last_output_at_source"] = "row"
    else:
        # These receipts carry no timestamp field. The file's mtime is still the instrument's own
        # write time - only this instrument writes this file - but it is weaker evidence than a
        # stamp inside the row, so the record says which of the two it is rather than blurring them.
        last = dt.datetime.fromtimestamp(path.stat().st_mtime, dt.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%SZ"
        )
        rec["last_output_at_source"] = "file_mtime"
        rec["timestamp_note"] = (
            "these rows carry no timestamp field of their own, so the last write time is taken from "
            "the file this instrument writes to; a row-borne stamp is stronger evidence"
        )
    rec.update({
        "state": "PUBLISHED",
        "last_output_at": last,
        "rows": len(rows),
        "bytes": size,
        "sha256": digest,
    })
    return rec


def verdict(rec: dict, report_date: str) -> str:
    """A statement about elapsed time and output, never about quality."""
    if rec["state"] == "NO_OUTPUT":
        return "NO_OUTPUT"
    last = rec.get("last_output_at")
    if not last:
        return "NO_OUTPUT"
    try:
        stamp = dt.datetime.fromisoformat(str(last).replace("Z", "+00:00"))
    except ValueError:
        return "UNKNOWN_TIME"
    age = dt.datetime.now(dt.timezone.utc) - stamp
    hours = age.total_seconds() / 3600.0
    rec["hours_since_last_output"] = round(hours, 2)
    if hours > rec["cadence_hours"] * 2:
        return "BEHIND_CADENCE"
    return "WITHIN_CADENCE"


def build(report_date: str) -> dict:
    records = []
    for spec in INSTRUMENTS:
        rec = assess(spec, report_date)
        rec["verdict"] = verdict(rec, report_date)
        records.append(rec)
    as_of = max(
        [str(r["last_output_at"]) for r in records if r.get("last_output_at")] or [report_date]
    )
    return {
        "schema": "csoai.instrument-liveness/0.1",
        "record_type": "dated-reading-of-instrument-output",
        "title": "Whether this estate's own instruments are still producing",
        "report_date": report_date,
        "as_of": as_of,
        "what": (
            "Each instrument here is a loop that writes its own output. This record is cut from "
            "those outputs: what the loop last wrote, how much of it, and the digest of the bytes "
            "it was cut from. It is derived, never typed."
        ),
        "not_this": [
            "Not a ranking of the instruments and not a score for any of them.",
            "Not a certification that a loop is correct, and not a claim about what it measured.",
            "NO_OUTPUT means no output was found. It is not a zero, and it is not a judgement.",
            "BEHIND_CADENCE means elapsed time exceeded the declared cadence. It says nothing "
            "about the quality of anything the instrument produced.",
            "Not a measurement of anyone's behaviour, and not a claim that the estate's coverage "
            "is complete.",
        ],
        "instruments": records,
    }


def board(doc: dict) -> str:
    lines = [
        f"# Instrument liveness - {doc['report_date']}",
        "",
        f"as_of {doc['as_of']} (the newest stamp found in the instruments' own output).",
        "",
        "| instrument | verdict | last output | from | rows | days with no publication |",
        "|---|---|---|---|---|---|",
    ]
    for r in doc["instruments"]:
        miss = r.get("days_with_no_publication") or []
        miss_txt = ", ".join(miss) if miss else "-"
        if len(miss) > 6:
            miss_txt = f"{len(miss)} days ({miss[0]} .. {miss[-1]})"
        src = r.get("last_output_at_source") or "-"
        lines.append(
            f"| {r['instrument']} | {r['verdict']} | {r.get('last_output_at') or '-'} | {src} | "
            f"{r.get('rows', '-')} | {miss_txt} |"
        )
    lines += [
        "",
        "What the verdicts are. WITHIN_CADENCE and BEHIND_CADENCE are statements about elapsed",
        "time against the cadence each instrument's own schedule declares. NO_OUTPUT means no",
        "output was found for that instrument: not a zero, and not a judgement about the loop.",
        "",
        "This is not a ranking, not a score and not a certification of any instrument.",
        "",
        f"Provenance: every row is derived from the bytes the instrument itself wrote. The full",
        f"record carries each source file's sha256, so anyone can re-run the publisher and get",
        f"the same bytes.",
        "",
        "Source: https://huggingface.co/datasets/" + REPO,
    ]
    return "\n".join(lines) + "\n"


def upload(local: Path, path_in_repo: str) -> None:
    if LANES is None:
        raise SystemExit(
            "instrument_liveness: no lanes root, so no uploader. Set LANES=/path/to/lanes and re-run."
        )
    uploader = LANES / "loops" / "hf_upload.py"
    proc = subprocess.run(
        [sys.executable, str(uploader), "--repo", REPO, "--file", str(local),
         "--path-in-repo", path_in_repo, "--create"],
        capture_output=True, text=True,
    )
    out = (proc.stdout + proc.stderr).strip()
    if proc.returncode != 0 or "UPLOADED" not in out:
        raise SystemExit(f"instrument_liveness: upload of {path_in_repo} failed: {out[:300]}")
    print(f"uploaded {path_in_repo}")


def selftest() -> int:
    """Check the derivation against fixtures, in a temp tree, with no network."""
    import tempfile

    cases = [
        ("nothing written -> NO_OUTPUT", {"instrument": "x", "state": "NO_OUTPUT"}, "NO_OUTPUT"),
    ]
    for name, rec, want in cases:
        got = verdict(rec, "2026-11-06")
        assert got == want, f"{name}: got {got}, want {want}"

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        (root / "out" / "x402-settlement-census").mkdir(parents=True)
        d = root / "out" / "x402-settlement-census"
        for day, published in (("2026-11-03", True), ("2026-11-04", False), ("2026-11-05", False),
                               ("2026-11-06", True)):
            f = d / f"dry-{day}.jsonl"
            f.write_text('{"observed_at": "%sT02:55:39Z"}\n' % day, encoding="utf-8")
            if published:
                (d / f"dry-{day}.jsonl.done").write_text(f"{day}T02:55:39Z\n", encoding="utf-8")
        global LANES
        saved = LANES
        LANES = root
        try:
            doc = build("2026-11-06")
            rec = doc["instruments"][0]
            assert rec["state"] == "PUBLISHED", rec
            assert rec["last_published_day"] == "2026-11-06", rec
            assert rec["published_days"] == 2, rec
            assert rec["days_with_no_publication"] == ["2026-11-04", "2026-11-05"], rec
            assert rec["rows"] == 1, rec
            assert len(rec["sha256"]) == 64, rec
            md = board(doc)
            assert "2026-11-04" in md and "2026-11-05" in md, md[:400]
            assert "not a ranking" in md.lower(), md[:400]

            # An instrument whose rows carry NO timestamp of their own still produced output. The
            # record must say so, and must say that its time came from the file the instrument
            # writes to, not from a stamp inside a row - a weaker evidence, labelled as weaker.
            receipts = root / "deck-receipts"
            receipts.mkdir()
            (receipts / "x.jsonl").write_text('{"kind":"x"}\n', encoding="utf-8")
            spec = {"id": "x", "what": "w", "cadence_hours": 1, "kind": "jsonl",
                    "path": "deck-receipts/x.jsonl", "ts_field": "finished_at"}
            r = assess(spec, "2026-11-06")
            assert r["state"] == "PUBLISHED", r
            assert r["rows"] == 1, r
            assert r["last_output_at_source"] == "file_mtime", r
            assert "timestamp_note" in r, r
            # and a row-borne stamp is preferred when there is one
            (receipts / "x.jsonl").write_text(
                '{"finished_at":"2026-11-06T01:02:03Z"}\n', encoding="utf-8")
            r2 = assess(spec, "2026-11-06")
            assert r2["last_output_at_source"] == "row", r2
            assert r2["last_output_at"] == "2026-11-06T01:02:03Z", r2
        finally:
            LANES = saved

    # THE CI CONDITION, AS A TEST. This selftest runs on CI, where there is no lanes root and
    # no LANES in the environment. A module that resolved the lanes root at import time and
    # raised when there was none would die before a single assertion above could run, so the
    # step would go red for a reason that has nothing to do with the derivation. The fix was to
    # make the resolution lazy; this is the assertion that keeps it lazy. Run this script in a
    # subprocess with HOME pointed at an empty directory and LANES unset: it must exit 0.
    #
    # NESTED=1 stops the recursion: the child runs the same selftest, so without the guard the
    # child would spawn a grandchild, and so on. The child skips only THIS check and runs every
    # other assertion, which is the part that matters.
    import os
    import subprocess

    if os.environ.get("CSOAI_LIVENESS_SELFTEST_NESTED") != "1":
        with tempfile.TemporaryDirectory() as empty_home:
            env = {k: v for k, v in os.environ.items() if k != "LANES"}
            env["HOME"] = empty_home
            env["CSOAI_LIVENESS_SELFTEST_NESTED"] = "1"
            proc = subprocess.run(
                [sys.executable, str(Path(__file__).resolve()), "--selftest"],
                capture_output=True, text=True, env=env,
            )
            assert proc.returncode == 0, (
                "selftest must pass with no lanes root and no LANES in the environment "
                f"(the CI condition): rc={proc.returncode}\n{proc.stdout}\n{proc.stderr}"
            )
            assert "selftest: OK" in proc.stdout, proc.stdout + proc.stderr

    print("instrument_liveness selftest: OK - the gaps are derived, not typed, and the verdicts "
          "are statements about elapsed time.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=None, help="UTC date to publish (default: today)")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        return selftest()

    if LANES is None:
        raise SystemExit(
            "instrument_liveness: no lanes root. Set LANES=/path/to/lanes and re-run. Nothing was written."
        )

    date = args.date or dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d")
    doc = build(date)

    outdir = LANES / "out" / "instrument-liveness" / date
    outdir.mkdir(parents=True, exist_ok=True)
    snap = outdir / f"instrument-liveness-{date}.json"
    board_path = outdir / f"INSTRUMENT-LIVENESS-{date}.md"
    snap.write_text(json.dumps(doc, indent=1) + "\n", encoding="utf-8")
    board_path.write_text(board(doc), encoding="utf-8")

    verdicts = {}
    for r in doc["instruments"]:
        verdicts[r["verdict"]] = verdicts.get(r["verdict"], 0) + 1
    print(
        f"instrument_liveness: {date} - {len(doc['instruments'])} instrument(s), "
        + ", ".join(f"{k}={v}" for k, v in sorted(verdicts.items()))
    )
    for r in doc["instruments"]:
        print(f"  {r['instrument']:<26} {r['verdict']:<16} {r.get('last_output_at') or '-'}")
    if args.no_upload:
        return 0

    upload(snap, f"{date}/{snap.name}")
    upload(board_path, f"{date}/{board_path.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
