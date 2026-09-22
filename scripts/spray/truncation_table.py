import json, pathlib, collections, sys
d = pathlib.Path("public/interop/mill-evidence")
per = collections.defaultdict(lambda: {"rows": 0, "has_finish": 0, "length": 0, "unread": 0, "has_label_field": 0})
for f in sorted(d.glob("items-*.jsonl")):
    for line in f.read_text().splitlines():
        if not line.strip():
            continue
        r = json.loads(line)
        s = r.get("schema") or "(no schema field)"
        p = per[s]
        p["rows"] += 1
        if "finish_reason" in r:
            p["has_finish"] += 1
            if r["finish_reason"] == "length":
                p["length"] += 1
        # Only a schema that CARRIES the field can be asked about it. The runpod worker
        # names the same thing `parsed_label`; counting its absence as "unreadable" would
        # report 100% on a field that is simply not there.
        for key in ("observed", "parsed_label"):
            if key in r:
                p["has_label_field"] += 1
                if not r[key]:
                    p["unread"] += 1
                break
rows = []
for s, p in sorted(per.items()):
    if p["has_finish"]:
        fr = "%d/%d = %.2f%%" % (p["length"], p["has_finish"], 100.0 * p["length"] / p["has_finish"])
    else:
        fr = "finish_reason absent — UNMEASURED"
    ur = ("%d/%d = %.2f%%" % (p["unread"], p["has_label_field"],
                              100.0 * p["unread"] / p["has_label_field"])
          if p["has_label_field"] else "no label field — UNMEASURED")
    rows.append({"schema": s, "rows": p["rows"], "rows_carrying_finish_reason": p["has_finish"],
                 "truncated_at_token_limit": p["length"], "truncation_rate": fr,
                 "rows_carrying_a_label_field": p["has_label_field"],
                 "unreadable_label": p["unread"], "unreadable_rate": ur,
                 "note": "A rate is only reported over the rows that CARRY the field. A schema "
                         "that does not record finish_reason is UNMEASURED for truncation, not 0%."})
    print("%-42s rows=%6d  truncated: %-36s unreadable label: %s" % (s, p["rows"], fr, ur))
tot = sum(p["rows"] for p in per.values())
hf = sum(p["has_finish"] for p in per.values())
ln = sum(p["length"] for p in per.values())
ur = sum(p["unread"] for p in per.values())
hl = sum(p["has_label_field"] for p in per.values())
print("\nTOTAL rows=%d; finish_reason present on %d (%.1f%%); of those %d truncated (%.2f%%);"
      % (tot, hf, 100.0 * hf / tot, ln, 100.0 * ln / hf))
print("unreadable label %d of %d rows that carry a label field (%.2f%%) — these leave n, "
      "they are not wrong answers." % (ur, hl, 100.0 * ur / hl))
pathlib.Path(sys.argv[1]).parent.mkdir(parents=True, exist_ok=True)
json.dump({"schema": "csoai.grading-honesty/0.1", "rows": rows, "total_rows": tot,
           "rows_carrying_finish_reason": hf, "truncated": ln,
           "rows_carrying_a_label_field": hl, "unreadable_label": ur,
           "what_this_is": "Truncation and unreadable-answer rates, measured over the published "
                           "per-item evidence. Every rate is over the rows that carry the field "
                           "it is about; a producer that never recorded finish_reason is "
                           "UNMEASURED for truncation, and that is stated rather than shown as 0.",
           "why_it_matters": "A keyword-graded answer cut off at the token limit never reached "
                             "the words the grader looks for. Counting it as a wrong answer "
                             "would measure the token budget, not the model."},
          open(sys.argv[1], "w"), indent=1, sort_keys=True)
