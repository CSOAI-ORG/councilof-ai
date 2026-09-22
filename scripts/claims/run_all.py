#!/usr/bin/env python3
"""Run every claim harness and write one JSON per claim into a run directory.

Separated from build_rev2.py because the measurements are slow and the assembly is not: a run
can be inspected, re-read and rebuilt without re-measuring. Each file is exactly what the
harness returned; the assembler adds nothing to it but the claim's identity.

Usage:  run_all.py <run-dir> [CL-1 CL-3 ...]     (default: every claim)
"""
from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import attestation  # noqa: E402
import common as c  # noqa: E402
import corroborate  # noqa: E402
import exclusivity  # noqa: E402
import feed_health  # noqa: E402
import oracle_share  # noqa: E402
import presence  # noqa: E402
import restatement  # noqa: E402

CHAINLINK_HOME = "https://chain.link/"
ONDO_HOME = "https://ondo.finance/"
ADOPTERS = ["Swift", "Euroclear", "Mastercard", "Fidelity International", "UBS", "ANZ", "Aave", "GMX", "Lido"]


def jobs(series_dir: Path) -> dict:
    return {
        "CL-1": lambda: restatement.capture(CHAINLINK_HOME, "transaction value enabled", "CL-1", series_dir),
        "CL-2": lambda: exclusivity.run(),
        "CL-3": lambda: oracle_share.run("Chainlink"),
        "CL-4": lambda: {"corroboration": corroborate.run("Chainlink", ADOPTERS),
                         "adopter_list_baseline": presence.capture(
                             CHAINLINK_HOME, ADOPTERS, "the page carrying the adopter list")},
        "CL-5": lambda: feed_health.run(rounds=40),
        "ON-1": lambda: presence.capture(
            ONDO_HOME,
            ["Institutional-grade finance", "BlackRock", "Franklin Templeton", "WisdomTree", "Fidelity",
             "ABN AMRO", "Morgan Stanley", "Google Cloud", "OUSG", "USDY"],
            "the page carrying the tagline and its attached proof-points"),
        "ON-2": lambda: {"corroboration": corroborate.run("Ondo", ["ABN AMRO"]),
                         "testimonial_persistence": presence.capture(
                             ONDO_HOME, ["ABN AMRO", "purpose-built infrastructure"],
                             "the page carrying the testimonial")},
        "ON-3": lambda: attestation.run(),
    }


def main() -> int:
    out = Path(sys.argv[1])
    out.mkdir(parents=True, exist_ok=True)
    series = out.parent / "series" if out.name == "run" else Path(__file__).resolve().parents[2] / "public" / "claims" / "series"
    wanted = sys.argv[2:] or list(jobs(series))
    rc = 0
    for cid in wanted:
        fn = jobs(series).get(cid)
        if not fn:
            print(f"SKIP {cid}: no harness")
            continue
        try:
            res = fn()
        except Exception:
            res = {"state": "UNMEASURED", "reason": "harness raised",
                   "traceback": traceback.format_exc()[-1200:], "measured_at": c.now_iso()}
            rc = 1
        (out / f"{cid}.json").write_text(json.dumps(res, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"WROTE {cid}.json state={res.get('state') if isinstance(res, dict) else 'composite'}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
