# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""busabase: csoai.busabase-snapshot/0.1 daily records -> one capsule for the store + one per base.

Source: --src = a snapshot root (e.g. /evac-bulk/busabase-snap) or one dated dir. The record is written read-only on the
build pod from the Busabase dump export and pulled to the index host before capsule-daily. The dump itself stays on the
pod; the capsule commits to its sha256. declared = what the store is; observed = base/record counts, commit and audit
heads; differential = change against the previous day's record. Absent -> PENDING_SOURCE (nothing invented).
"""
import json, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "busabase"
KIND = "measurement.busabase_state"
SCHEMA = "csoai.busabase-snapshot/0.1"
LIMITS = ["a read of the store's dump export at one instant; counts are of live (not deleted) records",
          "the snapshot bytes stay on the build pod; the capsule carries their sha256 only"]


def pick(src, schema=SCHEMA):
    root = pathlib.Path(src)
    cands = [root] if (root / "record.json").exists() else sorted((p for p in root.glob("20??-??-??") if p.is_dir()), reverse=True)
    for d in cands:
        rp = d / "record.json"
        if rp.exists():
            rec = json.loads(rp.read_bytes())
            if rec.get("schema") != schema:
                continue
            side = d / "record.json.sha256"
            if side.exists() and side.read_text().split()[0] != v.file_sha(rp):
                raise SystemExit(f"FILE_NOT_PINNED {rp}")
            return d, rp, rec
    raise PendingSource(f"no {schema} record under {root}")


def previous(d, schema=SCHEMA):
    sib = sorted(p for p in d.parent.glob("20??-??-??") if p.is_dir() and p.name < d.name and (p / "record.json").exists())
    return (json.loads((sib[-1] / "record.json").read_bytes()), v.file_sha(sib[-1] / "record.json")) if sib else (None, None)


def capsules(src, stats, aux=None):
    d, rp, rec = pick(src)
    prev, prev_sha = previous(d)
    rsha = v.file_sha(rp)
    pb = {b["slug"]: b for b in (prev or {}).get("bases") or []}
    srcs = {"daily_record_sha256": rsha, "snapshot_sha256": rec["snapshot"]["sha256"], "previous_record_sha256": prev_sha}
    yield v.make_capsule(
        kind=KIND, subject_id="busabase/store",
        claim={"statement": "the Busabase single-source store read these counts and heads on this day"},
        declared={"origin": rec["origin"], "runtime": rec.get("runtime"), "role": "single writer for every fact (15 Oct 2026 plan)"},
        observed={"n_bases": rec["n_bases"], "n_records": rec["n_records"], "table_counts": rec["table_counts"],
                  "commit_head": rec["commit_head"], "audit_head": rec["audit_head"],
                  "change_requests_open": rec.get("change_requests_open"), "snapshot_bytes": rec["snapshot"]["bytes"]},
        differential={"previous_day": None if prev is None else {
            "date": prev["date"], "n_records_delta": rec["n_records"] - prev["n_records"],
            "n_bases_delta": rec["n_bases"] - prev["n_bases"],
            "commit_head_changed": (prev.get("commit_head") or {}).get("id") != (rec["commit_head"] or {}).get("id")}},
        sources=srcs, measurement_state="MEASURED", limitations=LIMITS, observed_at=rec["as_of"])
    for b in rec["bases"]:
        p = pb.get(b["slug"])
        yield v.make_capsule(
            kind=KIND, subject_id=f"busabase/base/{b['slug']}",
            claim={"statement": "this Busabase base held this many live records on this day", "base": b["slug"]},
            declared={"base_id": b["id"], "n_fields": b["n_fields"]},
            observed={"n_records": b["n_records"], "records_sha256": b["records_sha256"]},
            differential={"previous_day": None if p is None else {"n_records_delta": b["n_records"] - p["n_records"],
                                                                  "record_set_changed": p["records_sha256"] != b["records_sha256"]},
                          "new_base": prev is not None and p is None},
            sources=srcs, measurement_state="MEASURED", limitations=LIMITS, observed_at=rec["as_of"])
    stats["source"] = {"record": str(rp), "record_sha256": rsha, "date": rec["date"], "schema": SCHEMA,
                       "snapshot_sha256": rec["snapshot"]["sha256"], "n_bases": rec["n_bases"], "n_records": rec["n_records"],
                       "commit_head": rec["commit_head"], "audit_head": rec["audit_head"], "previous_record_sha256": prev_sha}


def meta(src, stats):
    return {"what_this_is": "Busabase state: one capsule for the store (bases, records, commit and audit heads, dump sha256) and one "
                            "per base (live record count and record-set digest), read daily from the build pod.",
            "what_this_is_not": "Not the records themselves and not a review of their content; the dump stays on the pod.",
            "source": stats.get("source")}
