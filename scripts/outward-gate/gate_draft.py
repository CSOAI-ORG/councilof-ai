#!/usr/bin/env python3
"""Gate an outward draft FILE the way outward_gate.py gates a queued notice, before anyone sends it.

For each file: NOTICE_BANNED over the raw text (the notice gate's word list, no negation escape), and every
doctrine check over md_text(text) with prices=True (certify language, public prices, LF membership label,
statutory-verifier claim, brand-gate.mjs rules). A file is at 100% only when NOTICE_BANNED finds nothing AND
every doctrine check is PASS. Measures only: reads local files, sends and publishes nothing.

    python3 gate_draft.py FILE [FILE ...]     # one JSON line per file; exit 1 if any file is below 100%
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import outward_gate as og  # noqa: E402

N_DOCTRINE = 5  # certify, prices, LF label, statutory verifier, brand gate


def gate_text(text, path="/notice"):
    banned = [og.clip(text[max(0, m.start() - 30): m.end() + 30], 80) for m in og.NOTICE_BANNED.finditer(text)]
    checks = og.doctrine_checks(og.md_text(text), path, og.OWN_NOTICES, prices=True)
    doctrine = {c["check"]: c["status"] for c in checks}
    fails = [c for c in checks if c["status"] != og.PASS]
    ok = not banned and not fails and len(checks) >= N_DOCTRINE
    return {"notice_banned": banned, "doctrine": doctrine,
            "doctrine_evidence": [c["evidence"] for c in fails], "at_100": ok}


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    worst = 0
    for p in argv:
        with open(p, encoding="utf-8") as f:
            r = gate_text(f.read())
        r["file"] = os.path.basename(p)
        print(json.dumps(r, ensure_ascii=False))
        if not r["at_100"]:
            worst = 1
    return worst


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
