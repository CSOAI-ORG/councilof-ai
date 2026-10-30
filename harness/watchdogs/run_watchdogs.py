#!/usr/bin/env python3
"""run_watchdogs.py — read every public watchdog source the corpus declares, and say which
ones we are actually measuring.

WHY. The question "are we measuring all the public watchdogs and incident databases?" has to
be answered with bytes. This runner is the answer's numerator: it reads each source's feed,
records what came back, and grades it deterministically. The corpus (harness/watchdogs/
sources.json) is the denominator. The gap between them is the honest answer, and it is
published rather than asserted.

NO JUDGE. Every grade comes from the HTTP answer and the shape of the bytes:
  2xx + the declared field present   -> INGESTED
  2xx + the declared field missing    -> REACHABLE_UNSHAPED
  401 / 403                           -> CREDENTIAL_REQUIRED
  404 / 410                           -> NO_SUCH_SOURCE
  anything else                       -> UNREACHABLE
No model judges another model, and no judgement call is smuggled in as a grade.

ABSENCE IS NOT ZERO. A source that did not answer leaves the denominator. It is never counted
as zero records and never counted as an empty result.

  python3 harness/watchdogs/run_watchdogs.py --out out/watchdogs.json
  python3 harness/watchdogs/run_watchdogs.py --answers answers.jsonl --out out/watchdogs.json
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[2]
CORPUS_PATH = ROOT / "harness" / "watchdogs" / "sources.json"
USER_AGENT = "csoai-gspc-watchdog-corpus/1.0 (+https://councilof.ai)"

GRADES = ("INGESTED", "REACHABLE_UNSHAPED", "CREDENTIAL_REQUIRED", "NO_SUCH_SOURCE", "UNREACHABLE")


# ────────────────────────────────────────────────────────────── corpus

def load_corpus() -> dict:
    return json.loads(CORPUS_PATH.read_text(encoding="utf-8"))


def corpus_digest() -> str:
    return hashlib.sha256(CORPUS_PATH.read_bytes()).hexdigest()


# ────────────────────────────────────────────────────────────── resolver

_TOKEN = re.compile(r"([^.$\[\]]+)|\[(\d+)\]")


def resolve(value, path: str):
    """Resolve a declared path such as 'catalog[0].dateReleased' against the parsed body.

    '$' means the root itself. A missing step returns None rather than raising: a source that
    does not carry the field it promised is UNSHAPED, and that is a finding, not a crash.
    """
    if path in ("", "$"):
        return value
    current = value
    for key, index in _TOKEN.findall(path):
        if current is None:
            return None
        if index:
            if not isinstance(current, list) or int(index) >= len(current):
                return None
            current = current[int(index)]
        else:
            if not isinstance(current, dict) or key not in current:
                return None
            current = current[key]
    return current


# ────────────────────────────────────────────────────────────── grading

def grade_for(status: int, body, raw: bytes, source: dict) -> tuple[str, int | None]:
    """Return (grade, records) from the HTTP answer and the bytes. No judgement."""
    if status in (401, 403):
        return "CREDENTIAL_REQUIRED", None
    if status in (404, 410):
        return "NO_SUCH_SOURCE", None
    if not (200 <= status < 300):
        return "UNREACHABLE", None

    kind = source.get("records_kind")
    path = source.get("records_path")

    if kind == "marker":
        # The OWASP page is HTML: the declared 'field' is a marker string in the text.
        if isinstance(path, str) and path and path.encode("utf-8") in raw:
            return "INGESTED", 1
        return "REACHABLE_UNSHAPED", None

    if kind == "xml":
        value = xml_resolve(raw, path)
        if isinstance(value, list) and value:
            return "INGESTED", len(value)
        # An empty match is a path that did not resolve, not a feed that published nothing.
        return "REACHABLE_UNSHAPED", None

    value = resolve(body, path)
    if value is None:
        return "REACHABLE_UNSHAPED", None
    if kind == "array":
        if isinstance(value, list):
            return "INGESTED", len(value)
        return "REACHABLE_UNSHAPED", None
    if kind == "number":
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return "INGESTED", int(value)
        return "REACHABLE_UNSHAPED", None
    if kind == "object":
        if isinstance(value, dict):
            return "INGESTED", 1
        return "REACHABLE_UNSHAPED", None
    return "REACHABLE_UNSHAPED", None


def xml_elements(raw: bytes, path: str):
    """Resolve a dotted TAG path such as 'rss.channel.item' inside an XML feed.

    The corpus declares RSS feeds as XML, because they are XML: reading them as JSON would
    report every advisory feed as UNSHAPED and hide a working source behind a parsing
    mistake of ours. The first step may name the ROOT's own tag ('rss'), which is not a
    child of itself.
    """
    if not path:
        return []
    try:
        root = ElementTree.fromstring(raw)
    except ElementTree.ParseError:
        return []
    steps = path.split(".")
    current = root
    for index, step in enumerate(steps):
        name, _, tail = step.partition("[")
        position = int(tail[:-1]) if tail else None
        if index == 0 and current.tag.split("}")[-1] == name:
            # The root's own tag is the first step; it is not a child of itself.
            match = [current]
        else:
            children = list(current) if current is not None else []
            match = [child for child in children if child.tag.split("}")[-1] == name]
        if position is not None:
            if position >= len(match):
                return []
            current = match[position]
            continue
        if not match:
            return []
        if index == len(steps) - 1:
            return match
        current = match[0]
    return []


def xml_resolve(raw: bytes, path: str):
    """The count for a declared XML path: how many elements the last step matched."""
    return xml_elements(raw, path)


# ────────────────────────────────────────────────────────────── fetch

def fetch(source: dict, timeout: int) -> dict:
    """Read one feed. Returns an observation; it never raises."""
    method = source.get("method", "GET")
    data = None
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json, */*"}
    if method == "POST":
        data = json.dumps(source.get("body", {})).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(source["url"], data=data, headers=headers, method=method)
    status, raw, hops = None, b"", 0
    url = source["url"]
    while True:
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                raw = response.read()
                status = response.status
                break
        except urllib.error.HTTPError as error:
            # urllib follows 301/302/303/307 but NOT 308, and some of these feeds move.
            # Following the redirect ourselves is the difference between a source that moved
            # and a source that is gone.
            if error.code in (301, 302, 303, 307, 308) and error.headers.get("Location") and hops < 5:
                url = urllib.parse.urljoin(url, error.headers["Location"])
                hops += 1
                continue
            raw, status = b"", error.code
            break
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
            return {
                "source_id": source["id"],
                "status": None,
                "grade": "UNREACHABLE",
                "records": None,
                "error": str(error)[:200],
                "content_sha256": None,
                "bytes": 0,
                "observed_at": _now(),
            }
    body = None
    try:
        body = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        body = None
    grade, records = grade_for(status, body, raw, source)
    return {
        "source_id": source["id"],
        "status": status,
        "grade": grade,
        "records": records,
        "error": None,
        "content_sha256": hashlib.sha256(raw).hexdigest(),
        "bytes": len(raw),
        "observed_at": _now(),
        "_body": body,
        "_raw": raw,
    }


def _now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def published_date(source: dict, body, raw: bytes) -> str | None:
    """The source's OWN date field, if it has one. Never invented, never today's date."""
    path = source.get("date_path") or ""
    if not path:
        return None
    value = resolve(body, path)
    if isinstance(value, str) and value:
        return value
    # An XML feed carries its date as element text, not as a JSON key.
    for element in xml_elements(raw, path):
        text = (element.text or "").strip()
        if text:
            return text
    return None


# ────────────────────────────────────────────────────────────── main

def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Read the public watchdog corpus and say what we actually measure.")
    parser.add_argument("--out", default="-", help="output path, or - for stdout")
    parser.add_argument("--answers", help="JSONL of {source_id, status, grade, records, content_sha256, bytes} to score instead of fetching")
    parser.add_argument("--timeout", type=int, default=60)
    args = parser.parse_args(argv)

    corpus = load_corpus()
    sources = corpus["sources"]

    observations: list[dict] = []
    if args.answers:
        for line in Path(args.answers).read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            record.setdefault("observed_at", _now())
            record["_body"] = None
            record["_raw"] = b""
            observations.append(record)
    else:
        for source in sources:
            observations.append(fetch(source, args.timeout))

    by_id = {observation["source_id"]: observation for observation in observations}
    rows = []
    for source in sources:
        observation = by_id.get(source["id"], {
            "source_id": source["id"], "status": None, "grade": "UNREACHABLE", "records": None,
            "error": "not observed", "content_sha256": None, "bytes": 0, "observed_at": None,
            "_body": None, "_raw": b"",
        })
        rows.append({
            "source_id": source["id"],
            "name": source["name"],
            "kind": source["kind"],
            "url": source["url"],
            "grade": observation["grade"],
            "http_status": observation["status"],
            "records": observation["records"],
            "published_at": published_date(source, observation.get("_body"), observation.get("_raw") or b""),
            "content_sha256": observation["content_sha256"],
            "bytes": observation["bytes"],
            "observed_at": observation["observed_at"],
            "error": observation.get("error"),
            "signal": source["signal"],
        })

    ingested = [row for row in rows if row["grade"] == "INGESTED"]
    by_grade = {grade: sum(1 for row in rows if row["grade"] == grade) for grade in GRADES}
    total_records = sum(row["records"] for row in rows if row["records"] is not None)

    result = {
        "schema": "csoai.gspc-watchdog-run/0.1",
        "what_this_is": "One read of every public watchdog, advisory, incident and registry source the corpus declares, with the coverage matrix that says which ones we are actually measuring.",
        "what_this_does_not_establish": (
            "Not a certification, not a score, not a rank, and not a statement that any source is "
            "complete or correct. A source that answered is REACHED, not trusted. A source that did "
            "not answer is UNREACHABLE, not absent from the world."
        ),
        "corpus": {
            "schema": corpus["schema"],
            "path": "harness/watchdogs/sources.json",
            "sha256": corpus_digest(),
            "sources": len(sources),
        },
        "grader": "deterministic, from the HTTP answer and the shape of the bytes; no model judges another model",
        "absence_rule": corpus["absence_rule"],
        "grades": {grade: corpus["grades"][grade] for grade in GRADES},
        "coverage": {
            "corpus_sources": len(sources),
            "ingested": len(ingested),
            "not_ingested": len(sources) - len(ingested),
            "by_grade": by_grade,
            "records_counted": total_records,
            "ingested_ids": [row["source_id"] for row in ingested],
            "gaps": [
                {"source_id": row["source_id"], "name": row["name"], "kind": row["kind"],
                 "grade": row["grade"], "http_status": row["http_status"], "url": row["url"]}
                for row in rows if row["grade"] != "INGESTED"
            ],
        },
        "observed_at": _now(),
        "per_source": rows,
    }

    text = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.out == "-":
        sys.stdout.write(text)
    else:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"wrote {args.out}: {len(ingested)}/{len(sources)} sources ingested, "
              f"{total_records} records counted; grades {by_grade}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
