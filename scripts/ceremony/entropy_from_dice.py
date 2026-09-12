#!/usr/bin/env python3
"""entropy_from_dice.py — manual d6 rolls -> 32-byte seed for the ROOT ceremony.

G4.1 CEREMONY PREP (TUI-4 ROOTS & IDENTITY V3). This converts Nick's physical
dice rolls into the seed that feeds scripts/ceremony/ed25519_from_seed.py.
It is a measurement-adjacent key tool, not a certificate and not a service.

Canonicalisation (exact — a second implementation must reproduce this):

  1. Read the roll string: a positional argument, or --file, or stdin.
  2. Strip ALL whitespace (spaces, tabs, newlines, CR). Reject any character
     that is not one of "123456". Reject a digit outside 1..6 (a d6 never
     shows 0 or 7-9; accepting one would silently canonise a typo).
  3. The canonical roll string is the remaining digits, concatenated, nothing
     else. Example: rolls "3 1 4\n1 5 9" canonicalise to "314159".
  4. seed = SHA-256( UTF-8( canonical roll string ) ). No salt, no domain
     separator, no length prefix. Stated here so an independent verifier can
     recompute the fingerprint from the written roll sheet.

Entropy accounting (honest arithmetic, not marketing):

  Each fair d6 roll carries log2(6) = 2.5849625007 bits. The ceremony policy
  floor is 100 rolls: ceil(256 / log2(6)). The production CLI has no option
  that lowers this floor and no weak-output escape hatch. Tests construct
  simulated seeds in memory instead of asking this command to emit a weak
  seed file.

Secret discipline:

  The seed is NEVER printed, logged, or echoed. It is written once to --out
  with chmod 0600. Stdout carries only: roll count, entropy bits, the
  policy verdict, and the SHA-256 fingerprint of the seed (the fingerprint
  lets two operators confirm "same seed" without either seeing the seed).
  The canonical roll transcript is seed-equivalent material. It must remain
  on the disposable ceremony medium and the physical roll sheet must be
  destroyed after the independent Shamir cross-check. Neither is a custody
  record and neither may leave with a single share holder.

Usage:
  entropy_from_dice.py "3141592653..." --out root-alpha.seed
  entropy_from_dice.py --file rolls.txt --out root-alpha.seed
  cat rolls.txt | entropy_from_dice.py --out root-alpha.seed

Exit codes: 0 seed written; 1 bad input; 2 below entropy floor (fail closed).
"""
from __future__ import annotations

import argparse
import hashlib
import math
import os
import stat
import sys
from pathlib import Path

BITS_PER_ROLL = math.log2(6)  # 2.584962500721156...
# Strict 256-bit floor: ceil(256/log2(6)) = 100 rolls. This constant is not
# configurable from the production CLI.
MIN_ROLLS = math.ceil(256 / BITS_PER_ROLL)


def canonical_rolls(raw: str) -> str:
    """Strip whitespace; reject anything that is not a d6 face (1-6)."""
    digits = "".join(ch for ch in raw if not ch.isspace())
    bad = [ch for ch in digits if ch not in "123456"]
    if bad:
        raise ValueError(
            f"invalid roll characters {sorted(set(bad))}: a d6 shows only 1..6; "
            "fix the sheet, never silently canonise a typo"
        )
    if not digits:
        raise ValueError("no rolls given")
    return digits


def read_input(args: argparse.Namespace) -> str:
    if args.rolls is not None:
        return args.rolls
    if args.file is not None:
        return Path(args.file).read_text(encoding="utf-8")
    if not sys.stdin.isatty():
        return sys.stdin.read()
    raise ValueError("give rolls as an argument, --file, or stdin")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("rolls", nargs="?", default=None, help="roll string, e.g. '314159...'")
    ap.add_argument("--file", help="file containing the rolls")
    ap.add_argument("--out", required=True, help="seed output file (chmod 0600)")
    args = ap.parse_args()

    try:
        rolls = canonical_rolls(read_input(args))
    except (ValueError, OSError) as exc:
        print(f"REFUSING: {exc}", file=sys.stderr)
        return 1

    n = len(rolls)
    bits = n * BITS_PER_ROLL
    if n < MIN_ROLLS:
        print(
            f"REFUSING: {n} rolls carry {bits:.2f} bits; the ceremony floor is "
            f"{MIN_ROLLS} rolls ({MIN_ROLLS * BITS_PER_ROLL:.2f} bits). "
            "Keep rolling. Fail closed.", file=sys.stderr,
        )
        return 2

    seed = hashlib.sha256(rolls.encode("utf-8")).digest()
    out = Path(args.out)
    if out.exists():
        print(f"REFUSING: {out} already exists — never overwrite a seed", file=sys.stderr)
        return 1
    fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as fh:
        fh.write(seed)
    os.chmod(out, stat.S_IRUSR | stat.S_IWUSR)  # 0600 even if umask was odd

    # Fingerprint only. The seed itself never touches stdout/stderr/logs.
    print(f"rolls: {n}")
    print(f"entropy_bits: {bits:.2f}  (log2(6)={BITS_PER_ROLL:.4f} bits/roll; "
          f"strict 256 needs {MIN_ROLLS} rolls; fixed ceremony floor {MIN_ROLLS})")
    print("policy: OK")
    print(f"seed_sha256_fingerprint: {hashlib.sha256(seed).hexdigest()}")
    print(f"seed_file: {out}  (mode 0600)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
