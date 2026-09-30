#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build the frozen bank for the MONTHLY effect-binding server re-probe: the parent run's 600-server frozen slice.

    eb_monthly_bank.py <parent_bank.json> <parent_artifact.json> <parent_signed.json> <out_bank.json>

The 2026-09-22 run (signed, n = 261) drew a seeded shuffle (seed 20260922) of the 20,992 third-party rows of its
registry harvest and took the first 600. This keeps exactly those 600 rows (URL as harvested, no registry re-read,
no reshuffle of the population) plus the 41 SELF rows, and records where they came from. It asserts that the parent
artifact is the signed one, that the bank is the parent's bank (sha256), and that the 600 names are the parent's
chosen_names in the parent's order. Nothing is probed, uploaded or signed here.
"""
import hashlib, json, sys

PB, PA, PS, OUT = sys.argv[1:5]
pb_bytes, pa_bytes = open(PB, "rb").read(), open(PA, "rb").read()
bank, art, signed = json.loads(pb_bytes), json.loads(pa_bytes), json.load(open(PS))
sha = lambda b: hashlib.sha256(b).hexdigest()
assert sha(pa_bytes) == signed["payload"]["artifact"]["sha256"], "parent artifact is not the signed one"
assert sha(pb_bytes) == art["population"]["bank_sha256"], "parent bank sha256 differs from the artifact's bank_sha256"
chosen = art["population"]["frozen_slice"]["chosen_names"]
assert len(chosen) == art["population"]["frozen_slice"]["slice_n"] == 600
by = {r["name"]: r for r in bank["rows"] if not r["self"]}
rows = [by[n] for n in chosen]
selfrows = [r for r in bank["rows"] if r["self"]]
out = {k: bank[k] for k in bank if k not in ("rows", "rows_total", "rows_self", "rows_third_party")}
out.update({
    "kind": "subset of the frozen 2026-09-22 bank: the parent run's 600-server frozen slice (seed 20260922, first 600 of the "
            "seeded shuffle of 20,992 third-party rows), in the parent's slice order, plus the 41 SELF rows",
    "parent_bank_sha256": sha(pb_bytes),
    "parent_artifact_sha256": sha(pa_bytes),
    "selection_rule": "population.frozen_slice.chosen_names of the signed 2026-09-22 artifact (all 600 tried servers, "
                      "whatever their 2026-09-22 outcome) + every SELF row; URLs as harvested on 2026-09-22",
    "rows_total": len(rows) + len(selfrows), "rows_self": len(selfrows), "rows_third_party": len(rows),
    "rows": rows + selfrows,
})
json.dump(out, open(OUT, "w"), indent=1)
print(OUT, out["rows_third_party"], out["rows_self"], sha(open(OUT, "rb").read()))
