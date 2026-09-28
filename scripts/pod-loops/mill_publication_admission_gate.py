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
        if receipt.get("state") != "ADMITTED" or (receipt.get("authority") or {}).get("admitted") is not True:
            errors.append(f"{path}: intake authority is {receipt.get('state')}/admitted="
                          f"{(receipt.get('authority') or {}).get('admitted')}; HOLD publication")
    return errors


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
