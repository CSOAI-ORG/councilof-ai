# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""meok: csoai.meok-snapshot/0.1 daily records -> capsules for the meok Busabase base, the MEOK gateway code and its fixtures.

Source: --src = a snapshot root (e.g. /evac-bulk/meok-snap) or one dated dir; written read-only on the build pod and pulled
to the index host before capsule-daily. observed = record count of the meok base, per-file sha256 trees of the MEOK
gateway code and fixtures; differential = which files changed against the previous day. Absent -> PENDING_SOURCE.
"""
import venturi_capsule as v
from adapters.busabase import pick, previous

NAME = "meok"
KIND = "measurement.meok_state"
SCHEMA = "csoai.meok-snapshot/0.1"
LIMITS = ["a file and record read on the build pod at one instant; it says what is there, not that it runs or passes"]


def changed(cur, old):
    o = {f["path"]: f["sha256"] for f in (old or {}).get("files") or []}
    c = {f["path"]: f["sha256"] for f in cur.get("files") or []}
    return {"added": sorted(set(c) - set(o)), "removed": sorted(set(o) - set(c)),
            "modified": sorted(p for p in c if p in o and o[p] != c[p])}


def capsules(src, stats, aux=None):
    d, rp, rec = pick(src, SCHEMA)
    prev, prev_sha = previous(d, SCHEMA)
    rsha = v.file_sha(rp)
    srcs = {"daily_record_sha256": rsha, "busabase_snapshot_sha256": rec.get("busabase_snapshot_sha256"),
            "previous_record_sha256": prev_sha}
    mb = rec.get("meok_base")
    yield v.make_capsule(
        kind=KIND, subject_id="meok/busabase-base",
        claim={"statement": "the meok Busabase base held this many live records on this day"},
        declared={"base_id": (mb or {}).get("id"), "n_fields": (mb or {}).get("n_fields")},
        observed={"n_records": (mb or {}).get("n_records"), "records_sha256": (mb or {}).get("records_sha256"),
                  "head": rec.get("meok_base_head")},
        differential={"previous_day": None if prev is None else {
            "n_records_delta": ((mb or {}).get("n_records") or 0) - (((prev.get("meok_base") or {}).get("n_records")) or 0)}},
        sources=srcs, measurement_state="MEASURED" if mb else "UNCHECKABLE", limitations=LIMITS, observed_at=rec["as_of"])
    for part in ("gateway", "fixtures"):
        t = rec[part]
        yield v.make_capsule(
            kind=KIND, subject_id=f"meok/{part}",
            claim={"statement": f"the MEOK {part} files on the build pod had these sha256 values on this day"},
            declared={"n_files": len(t["files"])},
            observed={"tree_sha256": t["tree_sha256"], "bytes": sum(f["bytes"] for f in t["files"]),
                      "files_sha256": v.sha(v.canon(t["files"]))},
            differential={"previous_day": None if prev is None else changed(t, prev.get(part))},
            sources=srcs, measurement_state="MEASURED" if t["files"] else "UNCHECKABLE", limitations=LIMITS,
            observed_at=rec["as_of"])
    stats["source"] = {"record": str(rp), "record_sha256": rsha, "date": rec["date"], "schema": SCHEMA,
                       "gateway_tree_sha256": rec["gateway"]["tree_sha256"], "fixtures_tree_sha256": rec["fixtures"]["tree_sha256"],
                       "meok_base_records": (mb or {}).get("n_records"), "previous_record_sha256": prev_sha}


def meta(src, stats):
    return {"what_this_is": "MEOK state: the meok Busabase base, the MEOK gateway code and its fixtures on the build pod, by sha256.",
            "what_this_is_not": "Not a test result and not a claim the gateway is deployed or healthy.",
            "source": stats.get("source")}
