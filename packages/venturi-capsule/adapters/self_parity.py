# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""self_parity: csoai.self-parity/0.1 daily records -> one capsule per (index, offering) cell, plus one per
own-surface check.

declared = what the external index lists about us (its listing fields, "theirs"); observed = our live bytes
("ours", with the catalogue row's sha256). Own-surface checks: declared = our own surface (mcp.json, server card,
x402.json, llms.txt), observed = live. States are the source's: CONSISTENT / INCONSISTENT / NOT_LISTED / UNCHECKABLE.
Source: --src = the self-parity out root (/evac-bulk/self-parity) or one dated dir; the latest dated dir with a
record.json whose signature verifies is used. Absent -> PENDING_SOURCE (nothing built, nothing invented).
"""
import collections, json, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "self_parity"
KIND = "measurement.self_parity"
LIMITS = ["what an index says about us vs what we serve today; says nothing about traffic, payment or ranking in that index",
          "NOT_LISTED only from a COMPLETE read of an OPEN directory; a PARTIAL read yields UNCHECKABLE"]


def pick(src):
    root = pathlib.Path(src)
    cands = [root] if (root / "record.json").exists() else sorted((p for p in root.glob("20??-??-??") if p.is_dir()), reverse=True)
    for d in cands:
        rp, sp = d / "record.json", d / "record.signed.json"
        if rp.exists():
            s = v.verify_sidecar(rp, sp)
            if s["state"] == "VERIFIES":
                return d, rp, s
    raise PendingSource(f"no signed self-parity record under {root}")


def field_split(fields):
    """Listing field verdicts -> (declared, observed, agreement). 'verdict' is renamed 'agreement': it is a comparison, not a ruling."""
    dec, obs, agr = {}, {}, []
    for f in fields or []:
        dec.setdefault(f["field"], []).append(f.get("theirs"))
        obs.setdefault(f["field"], []).append(f.get("ours"))
        agr.append({"field": f["field"], "agreement": f.get("verdict"), **({"note": f["note"]} if f.get("note") else {})})
    return dec, obs, agr


def capsule_for_cell(cell, cat_by_id, ctx):
    off = cat_by_id.get(cell["offering"], {})
    listings = cell.get("listings") or []
    declared = {"index": cell["index"], "listings": []}
    observed = {"offering": cell["offering"], "version": off.get("version"), "live_state": off.get("live_state"), "fields": {}}
    agreement = []
    for l in listings:
        dec, obs, agr = field_split(l.get("fields"))
        declared["listings"].append({"key": l.get("key"), "fields": dec, "text_diffs": l.get("text_diffs")})
        for k, val in obs.items():
            observed["fields"].setdefault(k, val)
        agreement += agr
    if "fields" in cell and not listings:  # manifest cell: stale listings
        dec, obs, agr = field_split(cell["fields"])
        declared["listings"].append({"key": None, "fields": dec})
        observed["fields"] = obs
        agreement += agr
    return v.make_capsule(
        kind=KIND, subject_id=f"{cell['offering']}@{cell['index']}",
        claim={"statement": "the index's listing of this offering says what we actually serve", "index": cell["index"],
               "offering": cell["offering"], "offering_kind": off.get("kind")},
        declared=declared, observed=observed,
        differential={"field_agreement": agreement, "fields_checked": cell.get("fields_checked"), "reason": cell.get("reason")},
        sources={"record_sha256": ctx["record_sha256"], "record_signature_payload_sha256": ctx["sig"],
                 "catalog_sha256": ctx["catalog_sha256"], "fetch_log_sha256": ctx["fetch_log_sha256"],
                 "offering_bytes_sha256": off.get("sha256") if isinstance(off.get("sha256"), str) and len(off.get("sha256")) == 64 else None},
        measurement_state=cell["state"], limitations=LIMITS, observed_at=ctx["as_of"])


def capsule_for_own(chk, ctx):
    return v.make_capsule(
        kind=KIND, subject_id=f"own:{chk['surface']}:{chk['field']}",
        claim={"statement": "our own surface declares what we serve live", "surface": chk["surface"], "field": chk["field"]},
        declared={"surface": chk["surface"], "field": chk["field"], "value": chk.get("declared")},
        observed={"field": chk["field"], "value": chk.get("live")},
        differential={"note": chk.get("note")},
        sources={"record_sha256": ctx["record_sha256"], "record_signature_payload_sha256": ctx["sig"],
                 "catalog_sha256": ctx["catalog_sha256"], "fetch_log_sha256": ctx["fetch_log_sha256"]},
        measurement_state=chk["state"], limitations=["our own declaration vs our own live bytes, read the same day"],
        observed_at=ctx["as_of"])


def capsules_from_record(rec, catalog, ctx, stats):
    cat_by_id = {o["id"]: o for o in (catalog or {}).get("offerings") or []}
    for o in rec.get("catalog_rows") or []:
        cat_by_id.setdefault(o["id"], o)
    out = [capsule_for_cell(c, cat_by_id, ctx) for c in rec.get("cells") or []]
    out += [capsule_for_own(c, ctx) for c in (rec.get("own_surface_parity") or {}).get("checks") or []]
    stats["by_state"] = dict(collections.Counter(c["measurement_state"] for c in out))
    return out


def capsules(src, stats, aux=None):
    d, rp, sig = pick(src)
    rec = json.loads(rp.read_bytes())
    files = rec.get("files") or {}
    for n, meta_ in files.items():
        if (d / n).exists() and v.file_sha(d / n) != meta_["sha256"]:
            raise SystemExit(f"FILE_NOT_PINNED {n}")
    catalog = json.loads((d / "catalog.json").read_bytes()) if (d / "catalog.json").exists() else None
    ctx = {"record_sha256": v.file_sha(rp), "sig": sig["payload_sha256"], "as_of": rec.get("as_of"),
           "catalog_sha256": (files.get("catalog.json") or {}).get("sha256"),
           "fetch_log_sha256": (files.get("fetch-log.json.gz") or {}).get("sha256")}
    stats["source"] = {"record": str(rp), "record_sha256": ctx["record_sha256"], "record_signature": sig["state"],
                       "record_signature_payload_sha256": sig["payload_sha256"], "date": rec.get("date"), "schema": rec.get("schema")}
    yield from capsules_from_record(rec, catalog, ctx, stats)


def meta(src, stats):
    return {"what_this_is": "Self-parity: what external indexes list about CSOAI's own offerings vs our live bytes, one capsule per "
                            "(index, offering) cell and per own-surface check.",
            "what_this_is_not": "Not a ranking of any index. NOT_LISTED is a state, not an error.",
            "source": stats.get("source"), "capsules_by_state": stats.get("by_state")}
