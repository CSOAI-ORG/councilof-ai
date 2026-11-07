#!/usr/bin/env python3
"""Inventory potentially over-broad public claims for operator review.

This is a local, read-only Claim Maintenance instrument. It does not decide that
a statement is false, illegal, non-compliant, or misleading. It records exact
file bytes, line locations and context for phrases whose authority boundary
deserves review.

No network, inference, rewrite, publication or automatic correction.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SCAN = ROOT / "public"
DEFAULT_OUT = ROOT / "data" / "claim-maintenance" / "dogfood-latest.json"
MAX_FILE_BYTES = 2 * 1024 * 1024
ALLOWED_SUFFIXES = {".md", ".txt", ".html", ".htm", ".json", ".jsonl"}

RULES = [
    ("CERTIFICATION", re.compile(r"\b(certified|certification|certifies)\b", re.I)),
    ("COMPLIANCE", re.compile(r"\b(compliant|compliance|conformity)\b", re.I)),
    ("ENDORSEMENT", re.compile(r"\b(approved by|endorsed by|officially approved|regulator[- ]approved)\b", re.I)),
    ("ACCREDITATION", re.compile(r"\b(accredited|accreditation)\b", re.I)),
    ("PRIORITY_CLAIM", re.compile(r"\b(first[- ]to[- ]market|world['’]?s first|first ever|only company|only platform)\b", re.I)),
    ("PRODUCTION_ASSURANCE", re.compile(r"\b(production[- ]ready|guaranteed|guarantees|zero risk|fully safe)\b", re.I)),
    ("STANDARDS_STATUS", re.compile(r"\b(IETF member|W3C member|standard approved|working group adopted)\b", re.I)),
    ("REGULATORY_STATUS", re.compile(r"\b(SEC approved|FCA approved|regulatory approval|regulator endorsement)\b", re.I)),
]
NEGATION = re.compile(
    r"\b(no|not|never|without|does not|do not|isn't|is not|aren't|are not|"
    r"cannot|can't|doesn't|does not)\b",
    re.I,
)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def stamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def atomic_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix=".dogfood-", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(value, stream, indent=2, sort_keys=True, ensure_ascii=False)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def iter_files(root: Path):
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.is_symlink():
            continue
        if path.suffix.lower() not in ALLOWED_SUFFIXES:
            continue
        try:
            size = path.stat().st_size
        except OSError:
            continue
        if size > MAX_FILE_BYTES:
            continue
        yield path


def context(lines: list[str], index: int) -> str:
    start = max(0, index - 1)
    end = min(len(lines), index + 2)
    return " ".join(part.strip() for part in lines[start:end] if part.strip())[:900]


def scan_file(path: Path) -> tuple[dict, list[dict]]:
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return (
            {
                "path": str(path.relative_to(ROOT)),
                "sha256": digest(raw),
                "bytes": len(raw),
                "state": "SKIPPED_NON_UTF8",
            },
            [],
        )
    lines = text.splitlines()
    hits = []
    for idx, line in enumerate(lines):
        if not line.strip():
            continue
        for rule_id, pattern in RULES:
            for match in pattern.finditer(line):
                ctx = context(lines, idx)
                window = line[max(0, match.start() - 100): min(len(line), match.end() + 100)]
                hits.append(
                    {
                        "finding_id": digest(
                            f"{path.relative_to(ROOT)}|{idx+1}|{rule_id}|{match.group(0)}".encode()
                        )[:24],
                        "rule": rule_id,
                        "path": str(path.relative_to(ROOT)),
                        "line": idx + 1,
                        "matched_text": match.group(0),
                        "context": ctx,
                        "negation_nearby": bool(NEGATION.search(window)),
                        "state": "REVIEW_CANDIDATE",
                        "claim_boundary": (
                            "Lexical match only. It does not establish that the statement "
                            "is false, misleading, non-compliant, or improperly scoped."
                        ),
                    }
                )
    return (
        {
            "path": str(path.relative_to(ROOT)),
            "sha256": digest(raw),
            "bytes": len(raw),
            "state": "SCANNED",
            "findings": len(hits),
        },
        hits,
    )


def run(root: Path = DEFAULT_SCAN) -> dict:
    files = []
    findings = []
    skipped_errors = []
    for path in iter_files(root):
        try:
            row, hits = scan_file(path)
        except OSError as exc:
            skipped_errors.append(
                {
                    "path": str(path.relative_to(ROOT)),
                    "state": "INCONCLUSIVE",
                    "error_type": type(exc).__name__,
                }
            )
            continue
        files.append(row)
        findings.extend(hits)

    by_rule = {}
    for row in findings:
        by_rule[row["rule"]] = by_rule.get(row["rule"], 0) + 1

    report = {
        "schema": "csoai.claim-maintenance-dogfood/0.1",
        "observed_at": stamp(),
        "scan_root": str(root.relative_to(ROOT)),
        "execution": "disabled",
        "publication": "disabled",
        "automatic_correction": "disabled",
        "files_scanned": sum(row["state"] == "SCANNED" for row in files),
        "files_skipped_non_utf8": sum(row["state"] == "SKIPPED_NON_UTF8" for row in files),
        "files_inconclusive": len(skipped_errors),
        "review_candidates": len(findings),
        "review_candidates_with_negation_nearby": sum(row["negation_nearby"] for row in findings),
        "by_rule": dict(sorted(by_rule.items())),
        "findings": findings,
        "inconclusive_files": skipped_errors,
        "instrument": {
            "method": "BOUNDED_LEXICAL_AUTHORITY_BOUNDARY_SCAN",
            "negative_control": (
                "A phrase such as 'not certified' remains a candidate but is explicitly "
                "marked negation_nearby=true; the instrument never upgrades lexical "
                "presence into a finding of wrongdoing."
            ),
            "max_file_bytes": MAX_FILE_BYTES,
            "allowed_suffixes": sorted(ALLOWED_SUFFIXES),
        },
        "claim_boundary": [
            "This is an internal review inventory, not a verdict.",
            "No external source is contacted.",
            "No public text is rewritten automatically.",
            "Absence of a lexical match does not prove that every public claim is correctly scoped.",
        ],
    }
    report["content_hash"] = digest(
        json.dumps(report, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    )
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=DEFAULT_SCAN)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    root = args.root.resolve()
    if not str(root).startswith(str(ROOT.resolve()) + os.sep):
        raise SystemExit("scan root must stay inside the repository")
    report = run(root)
    atomic_json(args.output, report)
    print(
        json.dumps(
            {
                "observed_at": report["observed_at"],
                "files_scanned": report["files_scanned"],
                "review_candidates": report["review_candidates"],
                "negation_nearby": report["review_candidates_with_negation_nearby"],
                "content_hash": report["content_hash"],
            }
        )
    )


if __name__ == "__main__":
    main()

