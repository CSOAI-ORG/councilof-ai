#!/usr/bin/env python3
"""Fail closed before a mill branch publishes signed cards from quarantine.

This is a release guard, not an admission authority. A signature proves bytes,
not that an intake reviewer admitted the run. It examines every newly added
signed mill card between the last released master and the proposed merge.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


SIGNED_PREFIX = "public/interop/mill-cards-signed/signed-"
RECEIPTS = Path("public/interop/mill-evidence")
DID_DOC = Path("public/.well-known/did.json")


def changed_signed_cards(repo: Path, base: str, head: str) -> list[tuple[str, Path]]:
    result = subprocess.run(
        ["git", "diff", "--name-status", base, head, "--", "public/interop/mill-cards-signed"],
        cwd=repo, text=True, capture_output=True, check=True,
    )
    changed: list[tuple[str, Path]] = []
    for line in result.stdout.splitlines():
        cells = line.split("\t")
        status, name = cells[0], cells[-1]
        if name.startswith(SIGNED_PREFIX) and name.endswith(".json"):
            changed.append((status, Path(name)))
    return changed


def check(repo: Path, base: str, head: str) -> list[str]:
    changes = changed_signed_cards(repo, base, head)
    if not changes:
        return []
    receipts: list[dict] = []
    for path in sorted((repo / RECEIPTS).glob("runpod-verification-*.json")):
        try:
            receipts.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, ValueError) as error:
            return [f"unreadable intake receipt {path.name}: {error}"]
    admissions: list[dict] = []
    for path in sorted((repo / RECEIPTS).glob("runpod-admission-*.json")):
        try:
            admissions.append(json.loads(path.read_text(encoding="utf-8")))
        except (OSError, ValueError) as error:
            return [f"unreadable admission record {path.name}: {error}"]
    errors: list[str] = []
    for status, path in changes:
        if status != "A":
            errors.append(f"{path}: signed card mutation {status} is forbidden; preserve signed bytes")
            continue
        try:
            card = json.loads((repo / path).read_text(encoding="utf-8"))
            body = card["body"]
            evidence = body["compute_evidence"]
            card_id = card["id"]
            run_id = evidence["run_id"]
            axis = body["axis"]
            model = body["model"]
            if not isinstance(card_id, str) or not isinstance(run_id, str):
                raise ValueError("missing card id or run id")
        except (OSError, ValueError, KeyError, TypeError) as error:
            errors.append(f"{path}: unreadable signed card: {error}")
            continue
        matches = [r for r in receipts if r.get("run_id") == run_id
                   and r.get("axis") == axis and r.get("subject") == model]
        if len(matches) != 1:
            errors.append(f"{path}: expected one matching intake receipt, found {len(matches)}")
            continue
        receipt = matches[0]
        hashes = receipt.get("source_hashes") or {}
        if (receipt.get("bank_sha256") != evidence.get("bank_sha256")
                or hashes.get("items_sha256") != evidence.get("items_sha256")
                or receipt.get("model_manifest_digest") != evidence.get("model_manifest_digest")):
            errors.append(f"{path}: intake receipt does not bind card evidence")
            continue
        if receipt.get("state") == "ADMITTED" and (receipt.get("authority") or {}).get("admitted") is True:
            continue
        # Intake receipts are immutable VERIFIED_QUARANTINE bytes; admission is a separate
        # record written by scripts/admit_mill_cards.py. It is revalidated here from the
        # bytes it binds, never taken on trust.
        records = [r for r in admissions if (r.get("card") or {}).get("id") == card_id]
        if len(records) != 1:
            errors.append(f"{path}: intake authority is {receipt.get('state')}/admitted="
                          f"{(receipt.get('authority') or {}).get('admitted')} and {len(records)} admission "
                          f"records bind this card; HOLD publication")
            continue
        try:
            problems = _admit().validate_admission_record(records[0], card, receipt, _did_doc(repo))
        except Exception as error:  # noqa: BLE001 — any failure to revalidate is a HOLD
            problems = [f"admission record cannot be revalidated: {type(error).__name__}: {error}"]
        for problem in problems:
            errors.append(f"{path}: {problem}; HOLD publication")
    return errors


def _admit():
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    import admit_mill_cards  # noqa: PLC0415
    return admit_mill_cards


def _did_doc(repo: Path) -> dict | None:
    try:
        return json.loads((repo / DID_DOC).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None  # validate_admission_record then fails SIGNATURE_INVALID


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base", required=True)
    parser.add_argument("--head", default="HEAD")
    parser.add_argument("--repo", type=Path, default=Path.cwd())
    args = parser.parse_args()
    try:
        errors = check(args.repo, args.base, args.head)
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"HOLD cannot inspect signed-card diff: {error}", file=sys.stderr)
        return 2
    for error in errors:
        print("HOLD", error, file=sys.stderr)
    if errors:
        return 1
    print("PASS no unadmitted newly signed mill cards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
