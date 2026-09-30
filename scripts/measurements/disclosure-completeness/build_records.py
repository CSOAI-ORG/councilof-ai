#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build a dated disclosure-completeness record set from the consumer loop's candidates (lane L2, 2026-09-30).

    python3 build_records.py --candidates DIR --adapters adapters.py --date YYYY-MM-DD --out public/interop

DIR holds one candidate JSON per measure (csoai.consumer-candidate/0.1, written by adapters.py on the lanes pod).
Writes, under OUT/disclosure-completeness-DATE/:
    <slug>/record.json        one record per measure; the candidate is carried whole (inputs pinned by sha256,
                              method code pinned by sha256, result, unmeasured), plus the question it answers,
                              the source, its licence, and a headline derived from the result (never typed)
    <slug>/sign-extra.json    the small fields that go into the signed payload beside the record's sha256
                              (read by sign_record.py; removed from the published tree after signing)
    method/adapters.py        the measurement code, byte-identical to the sha256 each record pins
    verify.py                 checks every signature and, given the input bytes, recomputes every result
    set.json                  the list of records in this set with their sha256 (the set is not itself signed)

Deterministic: the same candidates, adapters.py and DATE give the same bytes. It never ranks, never names a leader,
never grades, and keeps UNMEASURED as UNMEASURED. Fails closed on any candidate that is not the expected shape.
"""
import argparse, hashlib, json, os, re, shutil, sys

SCHEMA = "csoai.disclosure-completeness-record/0.1"
SET_SCHEMA = "csoai.disclosure-completeness-set/0.1"
DOCTRINE = ("A disclosure-completeness or lag measurement of a public artifact. It counts what the artifact states about "
            "itself. It does not rank, grade or compare the models or platforms listed inside it, and it is not a "
            "certification. UNMEASURED stays UNMEASURED.")

MEASURES = {
    "swebench.logs_pointer_share": {
        "slug": "swebench-logs-pointer",
        "kind": "measurement.disclosure_completeness",
        "title": "SWE-bench leaderboard entries: how many state a logs pointer",
        "question": "Of the entries in SWE-bench's published leaderboards.json, how many state a pointer to their evaluation logs?",
        "source": {"name": "SWE-bench leaderboards (leaderboards.json)", "publisher": "SWE-bench",
                   "urls": ["https://raw.githubusercontent.com/SWE-bench/swe-bench.github.io/master/data/leaderboards.json",
                            "https://www.swebench.com/"]},
        "republished": "Counts, and the entry folder names that state no logs pointer. None of the upstream rows, scores or resolved rates are republished.",
    },
    "epoch.date_and_n_stated": {
        "slug": "epoch-date-and-n",
        "kind": "measurement.disclosure_completeness",
        "title": "Epoch AI benchmark data: how many result rows state a date and a sample size",
        "question": "Of the result rows in Epoch AI's benchmark_data.zip, how many state the date the result was produced, and how many state a sample size (n)?",
        "source": {"name": "Epoch AI, Capabilities & benchmarking (benchmark_data.zip)", "publisher": "Epoch AI",
                   "urls": ["https://epoch.ai/data/benchmark_data.zip", "https://epoch.ai/benchmarks"]},
        "republished": "Per-file row counts and column names. No scores are republished.",
    },
    "lmarena.publish_lag_and_n": {
        "slug": "lmarena-publish-lag",
        "kind": "measurement.publication_lag",
        "title": "LMArena leaderboard dataset: publication lag and stated sample size",
        "question": "For each config of the LMArena dataset on Hugging Face, how long after the stated as-of date was the latest file pushed, and how many rows state a sample size (n)?",
        "source": {"name": "LMArena, Hugging Face dataset lmarena-ai/leaderboard-dataset", "publisher": "LMArena",
                   "urls": ["https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"]},
        "republished": "Per-config row counts, stated as-of dates, push times and lag bounds. Ratings and ranks are not read into the record.",
    },
    "openrouter_hf.declared_field_agreement": {
        "slug": "openrouter-hf-declared-fields",
        "kind": "measurement.declared_field_agreement",
        "title": "OpenRouter and Hugging Face: do the two catalogues declare the same context length?",
        "question": "For each OpenRouter model that names a Hugging Face repository, does OpenRouter's declared context_length equal the context field declared in that repository's config.json, and can their licences be compared?",
        "source": {"name": "OpenRouter /api/v1/models, and each named Hugging Face repository's config.json and model info",
                   "publisher": "OpenRouter; the Hugging Face repository owners",
                   "urls": ["https://openrouter.ai/api/v1/models", "https://huggingface.co/api/models/{repo}",
                            "https://huggingface.co/{repo}/resolve/main/config.json"]},
        "republished": "Two declared numbers per model (both named, with the config field they came from) and the repository ids. No prices or other catalogue fields are republished.",
    },
}


def dumps(o):
    return json.dumps(o, indent=1, sort_keys=True, ensure_ascii=False) + "\n"


def sha(b):
    return hashlib.sha256(b).hexdigest()


def frac(f):
    return {"numerator": f["numerator"], "denominator": f["denominator"], "value": f["value"]}


def headline(measure, c):
    """Numbers derived from the candidate's result only. Returns (headline, sentence, unmeasured list)."""
    r, um = c["result"], list(c.get("unmeasured") or [])
    if measure == "swebench.logs_pointer_share":
        a = r["all_entries"]
        per = {b["leaderboard"]: {"entries": b["entries"], "logs_pointer_stated": b["logs_pointer_stated"]} for b in r["per_leaderboard"]}
        h = {"entries": a["entries"], "logs_pointer_stated": a["logs_pointer_stated"], "share_logs_stated": frac(a["share_logs_stated"]),
             "per_leaderboard": per, "logs_pointer_resolves": "UNMEASURED"}
        s = ("%d of %d entries state a logs pointer. Whether those pointers resolve is UNMEASURED: no pointer was requested."
             % (a["logs_pointer_stated"], a["entries"]))
        return h, s, um
    if measure == "epoch.date_and_n_stated":
        a = r["all_files"]
        h = {"files": a["files"], "rows": a["rows"], "rows_stating_date": frac(a["rows_stating_date"]),
             "rows_stating_n": frac(a["rows_stating_n"]), "rows_stating_both": frac(a["rows_stating_both"]),
             "files_with_no_date_column": len(a["files_with_no_date_column"]), "files_with_no_n_column": len(a["files_with_no_n_column"])}
        s = ("Of %d result rows in %d files, %d state a result date and %d state a sample size (n); %d state both."
             % (a["rows"], a["files"], a["rows_stating_date"]["numerator"], a["rows_stating_n"]["numerator"], a["rows_stating_both"]["numerator"]))
        return h, s, um
    if measure == "lmarena.publish_lag_and_n":
        cfgs = r["per_config"]
        lag = [x["lag"] for x in cfgs if "lag_hours_upper" in x["lag"]]
        rows = sum(x["rows"] for x in cfgs); rows_n = sum(x["rows_stating_n"]["numerator"] for x in cfgs)
        h = {"configs": len(cfgs), "configs_with_lag_measured": len(lag), "rows": rows, "rows_stating_n": rows_n,
             "lag_hours_lower_min": min(x["lag_hours_lower"] for x in lag) if lag else None,
             "lag_hours_upper_max": max(x["lag_hours_upper"] for x in lag) if lag else None,
             "dataset_revision": r["dataset_revision"]}
        um = um + [x for x in cfgs if "lag_hours_upper" not in x["lag"]]
        h["lag_hours_upper_min"] = min(x["lag_hours_upper"] for x in lag) if lag else None
        h["lag_hours_lower_max"] = max(x["lag_hours_lower"] for x in lag) if lag else None
        if lag:
            s = ("%d configs; %d of %d rows state n. Lag from the stated as-of date to the push of each config's latest file: "
                 "between %.2f and %.2f hours. The as-of is a calendar date, so each lag is a 24-hour band, not a point; "
                 "lag is measured on %d of %d configs." % (len(cfgs), rows_n, rows, h["lag_hours_lower_min"],
                                                           h["lag_hours_upper_max"], len(lag), len(cfgs)))
        else:
            s = "%d configs; %d of %d rows state n. Lag is UNMEASURED on every config." % (len(cfgs), rows_n, rows)
        return h, s, um
    if measure == "openrouter_hf.declared_field_agreement":
        k = r["counts"]
        h = {"models_naming_a_hf_repo": k.get("models_with_hf_id", 0),
             "context_length": {"AGREE": k.get("context_AGREE", 0), "MISMATCH": k.get("context_MISMATCH", 0),
                                "UNMEASURED": k.get("context_UNMEASURED", 0)},
             "licence": {"AGREE": k.get("licence_AGREE", 0), "MISMATCH": k.get("licence_MISMATCH", 0),
                         "UNMEASURED": k.get("licence_UNMEASURED", 0)}}
        s = ("Of %d OpenRouter models naming a Hugging Face repository, the declared context length agrees on %d, differs on %d "
             "(both values named) and is UNMEASURED on %d. Licence agreement is UNMEASURED on %d: OpenRouter's model list "
             "declares no licence field." % (h["models_naming_a_hf_repo"], h["context_length"]["AGREE"], h["context_length"]["MISMATCH"],
                                              h["context_length"]["UNMEASURED"], h["licence"]["UNMEASURED"]))
        return h, s, um
    raise SystemExit("unknown measure %s" % measure)


def licence_block(measure, c):
    lic = c.get("licence") or {}
    if measure == "swebench.logs_pointer_share":
        return {"upstream": lic, "our_record": "CC-BY-4.0 (Council of AI, CSOAI Ltd)",
                "note": "The upstream licence is stated by a catalogue as CC-BY-NC-4.0 and the GitHub licence field reads "
                        "%s. Only our counts and the upstream's own entry identifiers are published here." % lic.get("github_license_field")}
    if measure == "openrouter_hf.declared_field_agreement":
        return {"upstream": lic, "our_record": "CC-BY-4.0 (Council of AI, CSOAI Ltd)",
                "note": "OpenRouter's model list is served under its API terms, not a data licence. Only declared context-length "
                        "numbers and repository ids are published, as facts about what each catalogue states."}
    return {"upstream": lic, "our_record": "CC-BY-4.0 (Council of AI, CSOAI Ltd)", "attribution_required": lic.get("attribution")}


def build(cands, adapters_path, date, out):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
        raise SystemExit("bad date %r" % date)
    code = open(adapters_path, "rb").read()
    code_sha = sha(code)
    set_dir = os.path.join(out, "disclosure-completeness-%s" % date)
    os.makedirs(os.path.join(set_dir, "method"), exist_ok=True)
    rows = []
    for measure in sorted(MEASURES):
        c = cands.get(measure)
        if c is None:
            raise SystemExit("no candidate for %s" % measure)
        if c.get("schema") != "csoai.consumer-candidate/0.1" or c.get("status") != "CANDIDATE_UNSIGNED":
            raise SystemExit("%s: not an unsigned consumer candidate" % measure)
        if c["method"]["code_sha256"] != code_sha:
            raise SystemExit("%s: candidate pins adapters.py %s, file given is %s" % (measure, c["method"]["code_sha256"][:12], code_sha[:12]))
        if c["result"].get("state") == "UNMEASURED":
            raise SystemExit("%s: candidate is UNMEASURED (adapter failed closed); nothing to publish" % measure)
        pins = c["inputs"]
        digest = sha(json.dumps([[p["source_id"], p["sha256"]] for p in sorted(pins, key=lambda p: p["source_id"])]).encode())
        if digest != c["inputs_digest_sha256"]:
            raise SystemExit("%s: inputs_digest_sha256 does not recompute" % measure)
        m = MEASURES[measure]
        h, sentence, um = headline(measure, c)
        as_of = max(p["fetched_at"] for p in pins if p.get("fetched_at"))
        rid = "%s-%s" % (m["slug"], date)
        rec = {"schema": SCHEMA, "record_id": rid, "set": "disclosure-completeness-%s" % date, "kind": m["kind"],
               "title": m["title"], "question": m["question"], "answer": sentence, "headline": h,
               "as_of": as_of, "as_of_meaning": "the newest fetch time among the pinned inputs; the measurement reads those bytes and nothing later",
               "computed_at": c["generated_at"], "source": m["source"], "licence": licence_block(measure, c),
               "republished": m["republished"], "unmeasured": um, "doctrine": DOCTRINE,
               "measurement": {"candidate_id": c["candidate_id"], "measure": measure, "inputs": pins,
                               "inputs_digest_sha256": c["inputs_digest_sha256"], "method": c["method"],
                               "result": c["result"], "unmeasured": c.get("unmeasured") or []},
               "recompute": {"code": "../method/adapters.py", "code_sha256": code_sha, "verify_script": "../verify.py",
                             "rule": ("Fetch or supply the input bytes whose sha256 values are pinned in measurement.inputs; run "
                                      "verify.py --recompute <dir of blobs named by sha256>; it re-runs the named measure in "
                                      "method/adapters.py and compares with measurement.result field for field."),
                             "inputs_availability": ("The input bytes are not republished here (upstream licences differ). The upstream "
                                                     "URLs are named in source.urls; if the upstream has changed since as_of, its bytes "
                                                     "will no longer match the pinned sha256 and the recompute cannot be run from the live URL.")},
               "publication": "PUBLISHED on councilof.ai; signed by did:web:csoai.org#board-attestation-1 (record.signed.json beside this file)"}
        d = os.path.join(set_dir, m["slug"])
        os.makedirs(d, exist_ok=True)
        raw = dumps(rec).encode()
        open(os.path.join(d, "record.json"), "wb").write(raw)
        extra = {"kind": m["kind"], "record_id": rid, "set": rec["set"], "source": m["source"]["name"],
                 "inputs_digest_sha256": c["inputs_digest_sha256"], "method_code_sha256": code_sha,
                 "n_inputs": len(pins), "answer": sentence,
                 "publication": "PUBLISHED on councilof.ai under /interop/%s/%s/" % (rec["set"], m["slug"])}
        open(os.path.join(d, "sign-extra.json"), "w").write(dumps(extra))
        rows.append({"record_id": rid, "measure": measure, "kind": m["kind"], "title": m["title"], "answer": sentence,
                     "path": "%s/record.json" % m["slug"], "sha256": sha(raw), "signed": "%s/record.signed.json" % m["slug"],
                     "as_of": as_of, "headline": h, "unmeasured_count": len(um), "source": m["source"],
                     "licence": rec["licence"]})
    shutil.copyfile(adapters_path, os.path.join(set_dir, "method", "adapters.py"))
    shutil.copyfile(os.path.join(os.path.dirname(os.path.abspath(__file__)), "verify.py"), os.path.join(set_dir, "verify.py"))
    for junk in ("__pycache__", os.path.join("method", "__pycache__")):
        shutil.rmtree(os.path.join(set_dir, junk), ignore_errors=True)
    st = {"schema": SET_SCHEMA, "set": "disclosure-completeness-%s" % date, "date": date, "doctrine": DOCTRINE,
          "records": rows, "method_code_sha256": code_sha,
          "verify": "python3 verify.py (signatures) · python3 verify.py --recompute BLOBDIR (results)",
          "signer": "did:web:csoai.org#board-attestation-1 via POST /api/board-sign",
          "note": "This list is not itself signed; each record is, and each record's sha256 is listed here and inside its signed payload."}
    open(os.path.join(set_dir, "set.json"), "w").write(dumps(st))
    return set_dir


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates", required=True)
    ap.add_argument("--adapters", required=True)
    ap.add_argument("--date", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    cands = {}
    for fn in sorted(os.listdir(a.candidates)):
        if fn.endswith(".json"):
            c = json.load(open(os.path.join(a.candidates, fn)))
            if c.get("measure") in cands:
                raise SystemExit("two candidates for %s" % c["measure"])
            cands[c.get("measure")] = c
    print(build(cands, a.adapters, a.date, a.out))


if __name__ == "__main__":
    main()
