#!/usr/bin/env python3
"""Write normaliser-v1.tables.json: the Unicode tables that let normaliser-v1.mjs reproduce
normaliser_v1.py without depending on the JavaScript engine's own Unicode data.

Python's str.casefold(), regex \\s and regex \\d differ from String.prototype.toLowerCase(), JS \\s
and JS \\d on a few hundred code points, and both sides move with their Unicode version. The JS
port therefore reads these three tables, generated once from the Python that reproduced the frozen
hashes, and never calls toLowerCase. Regenerate only together with a new normaliser version.

  python3 scripts/mechanism/normaliser-v1-tables.py
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

OUT = Path(__file__).with_name("normaliser-v1.tables.json")


def main():
    casefold, whitespace, digits = {}, [], []
    for cp in range(0x110000):
        if 0xD800 <= cp <= 0xDFFF:
            continue
        c = chr(cp)
        if c.casefold() != c:
            casefold[format(cp, "x")] = c.casefold()
        if re.fullmatch(r"\s", c):
            whitespace.append(cp)
        if re.fullmatch(r"\d", c):
            if digits and digits[-1][1] == cp - 1:
                digits[-1][1] = cp
            else:
                digits.append([cp, cp])
    doc = {
        "schema": "csoai.normaliser-tables/1",
        "normaliser_version": "1.0.0",
        "generated_by": "scripts/mechanism/normaliser-v1-tables.py",
        "python": sys.version.split()[0],
        "unicode_version": unicodedata.unidata_version,
        "casefold": casefold,
        "whitespace": whitespace,
        "digit_ranges": digits,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"{OUT.name}: {len(casefold)} casefold entries, {len(whitespace)} whitespace, {len(digits)} digit ranges, Unicode {doc['unicode_version']}")


if __name__ == "__main__":
    main()
