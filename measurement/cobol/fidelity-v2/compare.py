#!/usr/bin/env python3
"""Compare every (decoder, record, field) against the golden expected value.
Writes results.jsonl (sorted, byte-stable) and work/summary.json. Usage: compare.py <lane_dir>
v2: COMP-1/COMP-2 binary64 round-trip rule, FLAGGED verdict (U+FFFD for ill-formed UTF-16), RDW files
(one harness line per file, records mapped by position), SYNC declarations. Rows keep the v1 schema."""
import json, os, re, sys
from collections import defaultdict, Counter
from decimal import Decimal, InvalidOperation

LANE = sys.argv[1]
EXP = json.load(open(os.path.join(LANE, "corpus/expected.json")))
DEC = json.load(open(os.path.join(LANE, "decoders.json")))

UNSUP_MSG = re.compile(r"not supported|unsupported", re.I)


def norm_err(s):
    s = re.sub(r"@[0-9a-f]{5,}", "@<id>", s or "")
    s = s.replace(LANE, "<lane>")
    return s[:300]


# ---------------------------------------------------------------- name canonicalisation
def canon(style, name):
    if style == "jrecord":
        m = re.match(r"^(.*?) \((\d+(?:, ?\d+)*)\)$", name)
        if m: return m.group(1) + "(" + ",".join(str(int(i) + 1) for i in m.group(2).split(",")) + ")"
        return name
    if style == "underscore":
        return name.replace("_", "-")
    if style == "cobolio":   # NAME_i_j with the innermost subscript first
        n = name.replace("_", "-"); idx = []
        while True:
            m = re.match(r"^(.*?)-(\d+)$", n)
            if not m or not re.search(r"[A-Z]", m.group(1)): break
            n, idx = m.group(1), [m.group(2)] + idx
        return n + ("(" + ",".join(reversed(idx)) + ")" if idx else "")
    return name


def index_positional(fields, expected_keys):
    """decoders that repeat a bare name per occurrence: k-th repeat -> k-th expected subscript (row-major)."""
    out = {}; counts = Counter(f["name"] for f in fields); seen = Counter()
    for f in fields:
        n = f["name"]
        if counts[n] == 1:
            out.setdefault(n, f); continue
        seen[n] += 1
        subs = sorted([k for k in expected_keys if k.split("(")[0] == n],
                      key=lambda k: tuple(int(x) for x in k[k.index("(") + 1:-1].split(",")))
        key = subs[seen[n] - 1] if seen[n] <= len(subs) else "%s#%d" % (n, seen[n])
        out.setdefault(key, f)
    return out


def field_map(dec, raw, expected_keys):
    style = dec["names"]
    if style == "positional":   # layouts: base first, then alternates (name@transfN)
        groups = defaultdict(list)
        for f in raw["fields"]:
            base, _, lay = f["name"].partition("@")
            groups[lay].append(dict(f, name=base))
        merged = {}
        for lay in sorted(groups, key=lambda l: (l != "", int(l[6:]) if l[6:].isdigit() else 0)):
            for k, v in index_positional(groups[lay], expected_keys).items():
                merged.setdefault(k.upper(), v)
        return merged
    m = {}
    for f in raw["fields"]:
        m.setdefault(canon(style, f["name"]).upper(), f)
    return m


# ---------------------------------------------------------------- declarations
def declared(dec, fmeta, rec):
    for d in dec.get("declared", []):
        kind, arg = d["when"], d.get("arg")
        if kind == "odo_dependent" and fmeta.get("odo_dependent"): return d["quote"]
        if kind == "elementary_redefines" and fmeta.get("elementary_redefines"): return d["quote"]
        if kind == "usage" and fmeta["usage"] in arg: return d["quote"]
        if kind == "codepage_only" and fmeta["usage"] == "TEXT" and rec["declared_codepage"] not in arg: return d["quote"]
        if kind == "sync_dependent" and fmeta.get("sync_dependent"): return d["quote"]
    return None


def as_decimal(s):
    try:
        d = Decimal(s.strip())
        return d if d.is_finite() else None
    except (InvalidOperation, AttributeError, ValueError):
        return None


def binary64_equal(s, value):
    """True when the rendered digits name the IEEE-754 binary64 value that equals `value` exactly."""
    try:
        f = float(s.strip())
    except (ValueError, AttributeError):
        return False
    return f == f and f not in (float("inf"), float("-inf")) and Decimal(f) == Decimal(value)


FLOAT_USAGES = ("COMP-1", "COMP-2")


def judge(dec, rec, fname, fmeta, raw, fmap):
    exp = fmeta["expect"]; must_fail_rec = rec["must_fail"]
    row = {"expected": fmeta.get("value", "REJECT_OR_FLAG") if exp != "REJECT" else "REJECT_OR_FLAG", "observed": None, "detail": ""}
    decl = declared(dec, fmeta, rec)
    stage = raw.get("stage")
    if fmeta.get("record_level"):                    # RDW must-fail: the unit is the record, not a field
        if stage in ("parse", "decode"):
            row.update(verdict="REJECTED", outcome_ok=True, detail=("file stage: " if raw.get("file_level") else "record stage: ")
                       + norm_err(raw.get("error")))
        elif stage == "absent":
            row.update(verdict="MISMATCH", outcome_ok=False, observed="<no record>",
                       detail="record silently absent: the reader emitted %d records and no error" % raw["n_emitted"])
        else:
            row.update(verdict="MISMATCH", outcome_ok=False, observed="<record emitted, %d fields>" % len(raw.get("fields", [])),
                       detail="invalid RDW framing decoded without rejection or flag; reader emitted %d records for %d framed"
                       % (raw["n_emitted"], raw["n_expected"]))
        return row
    if stage == "absent":
        row.update(verdict="MISMATCH", outcome_ok=False, observed="<no record>",
                   detail="record absent: the reader emitted %d records and no error" % raw["n_emitted"])
        return row
    if stage in ("parse", "decode"):
        msg = norm_err(raw.get("error"))
        row["detail"] = ("copybook stage: " if stage == "parse" else "file stage: " if raw.get("file_level") else "record stage: ") + msg
        if decl or UNSUP_MSG.search(msg):
            row["verdict"] = "UNSUPPORTED"
            if decl: row["detail"] = "declared: " + decl + " | " + row["detail"]
        elif stage == "parse":
            row["verdict"] = "ERROR"
        else:
            row["verdict"] = "REJECTED"
        row["outcome_ok"] = row["verdict"] == "REJECTED" and (exp == "REJECT" or must_fail_rec or fmeta.get("reject_acceptable", False)
                                                             or (fmeta.get("file_must_fail", False) and raw.get("file_level", False)))
        return row
    f = fmap.get(fname.upper())
    if f is not None:
        row["observed"] = f.get("value")
        if "error" in f: row["detail"] = "field error: " + norm_err(f["error"])
    if decl:
        row["verdict"] = "UNSUPPORTED"; row["outcome_ok"] = False
        row["detail"] = ("declared: " + decl + " | " + row["detail"]).rstrip(" |")
        return row
    if f is None:
        row.update(verdict="MISMATCH", outcome_ok=False, detail="field absent from decoder output"); return row
    if "error" in f or f.get("value") is None:
        if "error" in f and UNSUP_MSG.search(f["error"]):
            row.update(verdict="UNSUPPORTED", outcome_ok=False); return row
        row["verdict"] = "REJECTED"
        if "error" not in f: row["detail"] = "decoder returned null"
        row["outcome_ok"] = exp == "REJECT" or fmeta.get("reject_acceptable", False)
        if fmeta.get("reject_acceptable") and exp != "REJECT":
            row["detail"] += " (rejection acceptable: sign code outside NUMCLS(PRIM))"
        return row
    obs = f["value"]
    if exp == "REJECT":
        if fmeta["hazard"] == "mustfail_national_text" and isinstance(obs, str) and "\ufffd" in obs:
            row.update(verdict="FLAGGED", outcome_ok=True, detail="U+FFFD emitted in place of the ill-formed UTF-16 unit"); return row
        row.update(verdict="MISMATCH", outcome_ok=False, detail="must-fail control decoded without rejection or flag"); return row
    if exp == "NUMBER":
        d = as_decimal(obs)
        if d is not None and d == Decimal(fmeta["value"]):
            row.update(verdict="MATCH", outcome_ok=True)
            if d == 0 and obs.strip().startswith("-"): row["detail"] = "zero rendered with a minus sign"
            elif "E" in obs.upper(): row["detail"] = "rendered in exponent notation"
        elif fmeta["usage"] in FLOAT_USAGES and binary64_equal(obs, fmeta["value"]):
            row.update(verdict="MATCH", outcome_ok=True, detail="equal after IEEE-754 binary64 round-trip of the rendered digits")
        else:
            row.update(verdict="MISMATCH", outcome_ok=False)
            if d is None: row["detail"] = "observed value is not a number"
            elif fmeta["usage"] in FLOAT_USAGES and not fmeta.get("ieee_binary64_exact", True):
                try:
                    near = Decimal(float(Decimal(fmeta["value"])))
                except OverflowError:
                    near = None
                if near is not None and (d == near or binary64_equal(obs, near)):
                    row["detail"] = "observed is the nearest IEEE-754 binary64 value; the field holds more precision than binary64"
        return row
    ok = obs.rstrip(" ") == fmeta["value"].rstrip(" ")
    row.update(verdict="MATCH" if ok else "MISMATCH", outcome_ok=ok)
    return row


def rdw_raw(raw_file, rec, n_expected):
    """the harness emits one line per RDW file; pick this record's slice by position"""
    if raw_file.get("stage") in ("parse", "decode"):
        return dict(raw_file, file_level=True)
    recs = raw_file.get("records", [])
    k = rec["index"]
    base = {"n_emitted": len(recs), "n_expected": n_expected}
    if k <= len(recs):
        e = recs[k - 1]
        if "error" in e: return dict(base, stage="decode", error=e["error"])
        return dict(base, stage="ok", fields=e["fields"])
    if raw_file.get("error_after"):
        return dict(base, stage="decode", error="reader stopped before this record: " + raw_file["error_after"], file_level=True)
    return dict(base, stage="absent")


def main():
    rows = []; rdw_files = {}
    for dec in DEC["measured"]:
        rawp = os.path.join(LANE, "work/raw", dec["id"] + ".jsonl")
        raws = {}
        for ln in open(rawp):
            r = json.loads(ln); raws[r["record"]] = r
        for cb in EXP["copybooks"]:
            if cb.get("framing") == "rdw":
                if "entry" not in dec.get("rdw", {}): continue          # no RDW entry point: UNMEASURED, no rows
                for fl in cb["files"]:
                    rf = raws.get(fl["id"], {})
                    rdw_files.setdefault(dec["id"], {})[fl["id"]] = {
                        "framed": fl["n_records"], "emitted": len(rf.get("records", [])),
                        "error": norm_err(rf.get("error") or rf.get("error_after") or "") or None}
            for rec in cb["records"]:
                if cb.get("framing") == "rdw":
                    rf = raws.get(rec["file_id"], {"stage": "parse", "error": "harness produced no line for this file"})
                    fl = [f for f in cb["files"] if f["id"] == rec["file_id"]][0]
                    raw = rdw_raw(rf, rec, fl["n_records"])
                else:
                    raw = raws.get(rec["id"], {"stage": "parse", "error": "harness produced no line for this record"})
                fmap = field_map(dec, raw, list(rec["fields"])) if raw.get("stage") == "ok" else {}
                for fname, fmeta in sorted(rec["fields"].items()):
                    j = judge(dec, rec, fname, fmeta, raw, fmap)
                    rows.append({"decoder": dec["id"], "self": dec.get("self", False), "copybook": cb["id"], "record": rec["id"],
                                 "field": fname, "hazard": fmeta["hazard"], "usage": fmeta["usage"], "expect": fmeta["expect"],
                                 "must_fail_record": rec["must_fail"], **j})
    rows.sort(key=lambda r: (r["decoder"], r["record"], r["field"]))
    with open(os.path.join(LANE, "results.jsonl"), "w") as fh:
        for r in rows: fh.write(json.dumps(r, sort_keys=True, ensure_ascii=True) + "\n")

    # ---- summary: per decoder x hazard verdict counts; cross-decoder disagreements
    summ = {"per_decoder_hazard": {}, "per_decoder_total": {}, "disagreements": [], "rdw_files": rdw_files}
    for r in rows:
        k = summ["per_decoder_hazard"].setdefault(r["decoder"], {}).setdefault(r["hazard"], Counter())
        k[r["verdict"]] += 1; k["outcome_ok"] += int(r["outcome_ok"]); k["n"] += 1
        t = summ["per_decoder_total"].setdefault(r["decoder"], Counter())
        t[r["verdict"]] += 1; t["outcome_ok"] += int(r["outcome_ok"]); t["n"] += 1

    def outcome_class(r):
        if r["verdict"] in ("REJECTED", "ERROR", "UNSUPPORTED", "FLAGGED"): return "<%s>" % r["verdict"].lower()
        if r["observed"] is None: return "<absent>"
        if r["expect"] == "NUMBER" or (r["expect"] == "REJECT" and as_decimal(r["observed"]) is not None):
            d = as_decimal(r["observed"])
            if d is not None: return format(d.normalize(), "f") if d != 0 else "0"
        return r["observed"].rstrip(" ")
    byfield = defaultdict(list)
    for r in rows:
        if not r["self"]: byfield[(r["record"], r["field"])].append(r)
    for (rid, fname), rs in sorted(byfield.items()):
        classes = defaultdict(list)
        for r in rs: classes[outcome_class(r)].append(r["decoder"])
        produced = {c: d for c, d in classes.items() if not c.startswith("<unsupported") and not c.startswith("<error")}
        values = {c for c in produced if not c.startswith("<")}
        if len(produced) > 1:
            summ["disagreements"].append({"record": rid, "field": fname, "hazard": rs[0]["hazard"], "expected": rs[0]["expected"],
                                          "value_disagreement": len(values) > 1,
                                          "outcomes": {c: sorted(d) for c, d in sorted(classes.items())}})
    summ["counts"] = {"rows": len(rows), "decoders_measured": len(DEC["measured"]), **EXP["counts"]}
    summ["rows_per_decoder"] = dict(sorted(Counter(r["decoder"] for r in rows).items()))
    json.dump(summ, open(os.path.join(LANE, "work/summary.json"), "w"), indent=1, sort_keys=True, ensure_ascii=True)
    print(json.dumps(summ["counts"]))


if __name__ == "__main__":
    main()
