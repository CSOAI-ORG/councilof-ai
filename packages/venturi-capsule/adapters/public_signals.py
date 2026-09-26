# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""public_signals: csoai.public-signals/0.1 daily records -> one capsule per signal.

declared = what the source says it counts (its URL, unit, window, definition); observed = the value read today, the HTTP
status and the digest of the names behind it; differential = the change against the previous day's record, by name.
States are the record's own: MEASURED / PARTIAL / UNCHECKABLE (an UNCHECKABLE capsule carries a null value, never 0).
self_or_external rides in the claim so a reader can never total SELF activity as traction.
Source: --src = the public-signals out root (/evac-bulk/public-signals) or one dated dir; the latest dated dir holding a
record.json whose pinned files still match is used. Absent -> PENDING_SOURCE (nothing built, nothing invented).
"""
import collections, json, pathlib
import venturi_capsule as v
from adapters import PendingSource

NAME = "public_signals"
KIND = "measurement.public_signal"
LIMITS = ["a public counter read once on this day; download and like counters cannot separate our own pulls, mirrors and bots",
          "UNCHECKABLE is a state, not a zero"]


def pick(src):
    root = pathlib.Path(src)
    cands = [root] if (root / "record.json").exists() else sorted((p for p in root.glob("20??-??-??") if p.is_dir()), reverse=True)
    for d in cands:
        rp = d / "record.json"
        if rp.exists():
            rec = json.loads(rp.read_bytes())
            if rec.get("schema") != "csoai.public-signals/0.1":
                continue
            for n, m in (rec.get("files") or {}).items():
                if n.endswith("/"):
                    continue
                if not (d / n).exists() or v.file_sha(d / n) != m["sha256"]:
                    raise SystemExit(f"FILE_NOT_PINNED {d / n}")
            return d, rp, rec
    raise PendingSource(f"no public-signals record under {root}")


def names_digest(names):
    return v.sha(v.canon(sorted(names))) if names is not None else None


def capsule_for_signal(s, prev, ctx):
    p = prev.get(s["id"])
    diff = {"flags": s.get("flags") or [], "previous_day": None}
    if p is not None:
        pn, nn = set(p.get("names") or []), set(s.get("names") or [])
        diff["previous_day"] = {"date": ctx["prev_date"], "value": p.get("value"), "state": p.get("state"),
                                "value_changed": p.get("value") != s.get("value"),
                                "names_added": sorted(nn - pn), "names_removed": sorted(pn - nn)}
    return v.make_capsule(
        kind=KIND, subject_id=s["id"],
        claim={"statement": "this public signal reads this value on this day, from this source",
               "signal": s["id"], "group": s["group"], "label": s["label"], "self_or_external": s["self_or_external"]},
        declared={"source_url": s.get("source_url"), "unit": s.get("unit"), "window": s.get("window"), "definition": s.get("note")},
        observed={"value": s.get("value"), "http_status": s.get("http_status"), "fetched_at": s.get("fetched_at"),
                  "n_names": len(s["names"]) if s.get("names") is not None else None, "names_sha256": names_digest(s.get("names"))},
        differential=diff,
        sources={"daily_record_sha256": ctx["record_sha256"], "response_sha256": s.get("response_sha256"),
                 "fetch_log_sha256": ctx["fetch_log_sha256"], "local_inputs_sha256": ctx["local_inputs_sha256"],
                 "previous_record_sha256": ctx["prev_sha256"]},
        measurement_state=s["state"], limitations=[s.get("reason")] + LIMITS, observed_at=s.get("fetched_at") or ctx["as_of"])


def capsules_from_record(rec, prev_rec, ctx, stats):
    prev = {s["id"]: s for s in (prev_rec or {}).get("signals") or []}
    out = [capsule_for_signal(s, prev, ctx) for s in rec.get("signals") or []]
    stats["by_state"] = dict(collections.Counter(c["measurement_state"] for c in out))
    stats["by_self_or_external"] = dict(collections.Counter(c["claim"]["self_or_external"] for c in out))
    return out


def capsules(src, stats, aux=None):
    d, rp, rec = pick(src)
    files = rec.get("files") or {}
    prev_rec, prev_sha = None, None
    sib = sorted(p for p in d.parent.glob("20??-??-??") if p.is_dir() and p.name < d.name and (p / "record.json").exists())
    if sib:
        prev_rec, prev_sha = json.loads((sib[-1] / "record.json").read_bytes()), v.file_sha(sib[-1] / "record.json")
    ctx = {"record_sha256": v.file_sha(rp), "as_of": rec.get("as_of"),
           "fetch_log_sha256": (files.get("fetch-log.jsonl") or {}).get("sha256"),
           "local_inputs_sha256": (files.get("local-inputs.json") or {}).get("sha256"),
           "prev_sha256": prev_sha, "prev_date": (prev_rec or {}).get("date")}
    stats["source"] = {"record": str(rp), "record_sha256": ctx["record_sha256"], "date": rec.get("date"), "schema": rec.get("schema"),
                       "n_signals": len(rec.get("signals") or []), "previous_record_sha256": prev_sha,
                       "changes_sha256": v.file_sha(d / "CHANGES.json") if (d / "CHANGES.json").exists() else None}
    yield from capsules_from_record(rec, prev_rec, ctx, stats)


def meta(src, stats):
    return {"what_this_is": "Public signals and traction: one capsule per outside signal about CSOAI (package downloads, Hugging Face, "
                            "index listings, x402 non-self payers, data generated, search presence, citations), each with its source URL, "
                            "response sha256, state and self_or_external class.",
            "what_this_is_not": "Not a traction claim. SELF and MIXED_UNSEPARABLE capsules are never traction; UNCHECKABLE is never 0.",
            "source": stats.get("source"), "capsules_by_state": stats.get("by_state"),
            "capsules_by_self_or_external": stats.get("by_self_or_external")}
