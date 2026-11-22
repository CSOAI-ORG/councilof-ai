#!/usr/bin/env python3
"""Validate the receipt Oracle wrote for the hourly root-check and hand it back to root-check.sh.

Prints ONE line: "<ran_on> <age_seconds> <http> <line>" -- and prints NOTHING at all when the
receipt is missing, malformed, or older than max_age. Printing nothing is the signal that makes
root-check.sh fall back to probing from the pod, so every failure mode here fails open.

This never trusts the receipt's own word for its freshness beyond ran_at: a receipt that claims
to be fresh but parses to a future timestamp is rejected too.
"""
import datetime
import json
import sys


def main() -> int:
    try:
        max_age = int(sys.argv[1])
    except (IndexError, ValueError):
        return 1

    raw = sys.stdin.read()
    if not raw.strip():
        return 1

    try:
        rec = json.loads(raw)
    except (ValueError, TypeError):
        return 1

    if not isinstance(rec, dict) or rec.get("loop") != "root-check":
        return 1

    ran_at = rec.get("ran_at")
    line = rec.get("line")
    ran_on = rec.get("ran_on")
    http = rec.get("http")
    if not (ran_at and line and ran_on and http):
        return 1

    try:
        then = datetime.datetime.strptime(ran_at, "%Y-%m-%dT%H:%M:%SZ").replace(
            tzinfo=datetime.timezone.utc
        )
    except ValueError:
        return 1

    age = (datetime.datetime.now(datetime.timezone.utc) - then).total_seconds()
    # A negative age means Oracle's clock is ahead of ours; treat it as unusable, not as fresh.
    if age < -300 or age > max_age:
        return 1

    # Keep the fields whitespace-clean so the caller's awk/cut split stays honest.
    for field in (ran_on, http):
        if len(field.split()) != 1:
            return 1

    print(f"{ran_on} {int(age)} {http} {' '.join(str(line).split())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
