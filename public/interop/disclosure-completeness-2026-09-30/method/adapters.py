"""Per-source adapters and the deterministic measurements built on consumed bytes.

Every adapter FAILS CLOSED: if the bytes do not have the shape the measurement relies on, it
raises SchemaDrift naming what is missing, and no number is produced for that input. A
measurement that cannot be made is written as UNMEASURED with its reason; it is never
filled in, estimated, or carried over from an earlier run.

Output: signed-CANDIDATE JSON records under candidates/<measure>/, each pinning every input
by sha256 (and the sha256 of this file, so the method is pinned too). Nothing here signs,
publishes, ranks, or names a leader. Signing goes through the existing board-sign + land
path in a later gated step.
"""
import collections
import csv
import datetime as _dt
import hashlib
import io
import json
import math
import os
import urllib.parse
import zipfile

SCHEMA_CANDIDATE = "csoai.consumer-candidate/0.1"
DOCTRINE = ("Deterministic facts recomputable from the pinned input bytes. No ranking, no leader, "
            "not a certification. UNMEASURED stays UNMEASURED. A listing is never adoption.")
LMARENA_REPO = "lmarena-ai/leaderboard-dataset"
LMARENA_REQUIRED_COLUMNS = ("model_name", "category", "leaderboard_publish_date")
# The sample-size column differs by config (arena configs: vote_count; agent configs:
# observation_count / session_count). The first one present is used and named in the record.
LMARENA_N_COLUMNS = ("vote_count", "observation_count", "session_count")
EPOCH_LICENCE_MARK = "creativecommons.org/licenses/by/4.0"
# Epoch result-date columns: the date the RESULT was produced or recorded. "Release date" is the
# MODEL's release date, so it is deliberately not a result date.
EPOCH_DATE_COLUMNS = ("Started at", "Date", "date", "Run date", "Evaluation date",
                      "Date of evaluation", "Graded at", "Date added", "Created", "Last updated")
# Epoch sample-size columns: a count of items / runs / votes behind the result.
EPOCH_N_COLUMNS = ("Total tasks", "Runs", "Episodes", "Overall number of predictions",
                   "Dataset number of predictions", "Market number of predictions", "Votes",
                   "Checks Run")
HF_CONTEXT_FIELDS = ("max_position_embeddings", "n_positions", "max_sequence_length",
                     "seq_length", "model_max_length")
MAX_HF_MODELS = 400


class SchemaDrift(Exception):
    pass


def _sha(b):
    return hashlib.sha256(b).hexdigest()


def _iso(t=None):
    return (t or _dt.datetime.now(_dt.timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")


def _code_sha():
    with open(os.path.abspath(__file__), "rb") as f:
        return _sha(f.read())


# ------------------------------------------------------------------ inputs from the store

def _state(paths):
    try:
        with open(paths.state) as f:
            return json.load(f)
    except (IOError, OSError, ValueError):
        return {}


def latest_input(paths, state, sid):
    """(bytes, pin) for the most recent successful fetch of a source, or (None, reason)."""
    s = state.get("sources", {}).get(sid)
    if not s or not s.get("last_sha256"):
        return None, "never fetched successfully"
    p = os.path.join(paths.store, s["last_sha256"][:2], s["last_sha256"])
    try:
        with open(p, "rb") as f:
            b = f.read()
    except (IOError, OSError):
        return None, "blob missing from store"
    if _sha(b) != s["last_sha256"]:
        return None, "blob sha256 mismatch (store corrupt)"
    return b, {"source_id": sid, "sha256": s["last_sha256"], "bytes": len(b),
               "fetched_at": s.get("last_ok_at")}


# ------------------------------------------------------------------ derived sources

def derived_sources(paths, state):
    """Sources whose URLs come from other sources' stored bytes (one per upstream record)."""
    out = []
    # LMArena: one 'latest' parquet per config listed in the dataset's own API document.
    b, pin = latest_input(paths, state, "lmarena-dataset-api")
    if b is not None:
        try:
            d = json.loads(b)
            for s in d.get("siblings", []):
                fn = s.get("rfilename", "")
                if fn.endswith(".parquet") and "/latest-" in fn:
                    cfgname = fn.split("/")[0]
                    out.append({
                        "id": "lmarena-tree:" + cfgname,
                        "url": "https://huggingface.co/api/datasets/%s/tree/main/%s?expand=true" % (LMARENA_REPO, cfgname),
                        "heavy": True, "parent": "lmarena-dataset-api",
                        "licence": {"id": "CC-BY-4.0", "basis": "file listing of the same dataset",
                                    "attribution": "LMArena, lmarena-ai/leaderboard-dataset (CC BY 4.0)"}})
                    out.append({
                        "id": "lmarena-latest:" + cfgname,
                        "url": "https://huggingface.co/datasets/%s/resolve/main/%s" % (LMARENA_REPO, fn),
                        "heavy": True, "parent": "lmarena-dataset-api",
                        "licence": {"id": "CC-BY-4.0", "basis": "dataset cardData.license",
                                    "attribution": "LMArena, lmarena-ai/leaderboard-dataset (CC BY 4.0)"}})
        except ValueError:
            pass
    # OpenRouter -> Hugging Face: one model-info and one config.json per declared hugging_face_id.
    b, pin = latest_input(paths, state, "openrouter-ai--compute")
    if b is not None:
        try:
            ids = sorted({m.get("hugging_face_id") for m in json.loads(b).get("data", [])
                          if m.get("hugging_face_id")})
        except (ValueError, AttributeError):
            ids = []
        for hid in ids[:MAX_HF_MODELS]:
            q = urllib.parse.quote(hid, safe="/")
            lic = {"id": "per-model", "basis": "the model card's own declared licence",
                   "attribution": "Hugging Face model repository %s" % hid}
            out.append({"id": "hf-model:" + hid, "url": "https://huggingface.co/api/models/" + q,
                        "heavy": True, "parent": "openrouter-ai--compute", "licence": lic})
            out.append({"id": "hf-config:" + hid,
                        "url": "https://huggingface.co/%s/resolve/main/config.json" % q,
                        "heavy": True, "parent": "openrouter-ai--compute", "licence": lic})
    return out


# ------------------------------------------------------------------ adapters (fail closed)

def swebench_parse(b):
    try:
        d = json.loads(b)
    except ValueError as e:
        raise SchemaDrift("leaderboards.json is not JSON: %s" % e)
    if not isinstance(d, dict) or not isinstance(d.get("leaderboards"), list) or not d["leaderboards"]:
        raise SchemaDrift("missing non-empty top-level list 'leaderboards'")
    boards = []
    for lb in d["leaderboards"]:
        if not isinstance(lb, dict) or "name" not in lb or not isinstance(lb.get("results"), list):
            raise SchemaDrift("a leaderboard lacks 'name' or list 'results'")
        rows = lb["results"]
        if rows and not any(isinstance(r, dict) and "logs" in r for r in rows):
            raise SchemaDrift("no entry in leaderboard %r carries a 'logs' field" % lb["name"])
        for r in rows:
            if not isinstance(r, dict) or "folder" not in r:
                raise SchemaDrift("an entry in %r lacks 'folder' (its stable id)" % lb["name"])
        boards.append((lb["name"], rows))
    return boards


def swebench_measure(b):
    boards = swebench_parse(b)
    out, tot = [], collections.Counter()
    for name, rows in boards:
        c = collections.Counter()
        without = []
        for r in rows:
            if "logs" not in r:
                c["logs_field_absent"] += 1
                without.append(r["folder"])
            elif isinstance(r["logs"], str) and r["logs"].strip():
                c["logs_pointer_stated"] += 1
            else:
                c["logs_pointer_empty"] += 1
                without.append(r["folder"])
            if isinstance(r.get("trajs"), str) and r["trajs"].strip():
                c["trajs_pointer_stated"] += 1
        n = len(rows)
        assert c["logs_field_absent"] + c["logs_pointer_stated"] + c["logs_pointer_empty"] == n
        tot.update(c)
        tot["entries"] += n
        out.append({"leaderboard": name, "entries": n,
                    "logs_pointer_stated": c["logs_pointer_stated"],
                    "logs_pointer_empty": c["logs_pointer_empty"],
                    "logs_field_absent": c["logs_field_absent"],
                    "share_logs_stated": _frac(c["logs_pointer_stated"], n),
                    "trajs_pointer_stated": c["trajs_pointer_stated"],
                    "entries_without_logs_pointer": sorted(without)})
    return {"per_leaderboard": sorted(out, key=lambda x: x["leaderboard"]),
            "all_entries": {"entries": tot["entries"],
                            "logs_pointer_stated": tot["logs_pointer_stated"],
                            "share_logs_stated": _frac(tot["logs_pointer_stated"], tot["entries"])},
            "unmeasured": ["whether each stated logs pointer (s3://...) actually resolves: not requested "
                           "(retrievability UNMEASURED; this measures the declared pointer only)"]}


def _frac(k, n):
    return {"numerator": k, "denominator": n,
            "value": round(k / n, 6) if n else None}


def epoch_parse(b):
    try:
        z = zipfile.ZipFile(io.BytesIO(b))
    except zipfile.BadZipFile as e:
        raise SchemaDrift("benchmark_data.zip is not a zip: %s" % e)
    names = z.namelist()
    if "README.md" not in names:
        raise SchemaDrift("README.md (licence statement) missing from the zip")
    readme = z.read("README.md").decode("utf-8", "replace")
    if EPOCH_LICENCE_MARK not in readme:
        raise SchemaDrift("README.md no longer names %s; licence changed or moved" % EPOCH_LICENCE_MARK)
    csvs = sorted(n for n in names if n.endswith(".csv"))
    if not csvs:
        raise SchemaDrift("no CSV files in the zip")
    files = []
    for n in csvs:
        rows = list(csv.reader(io.TextIOWrapper(z.open(n), encoding="utf-8", newline="")))
        if not rows or not rows[0]:
            raise SchemaDrift("%s has no header row" % n)
        files.append((n, rows[0], rows[1:]))
    return readme, files


def epoch_measure(b):
    readme, files = epoch_parse(b)
    per, tot = [], collections.Counter()
    for n, header, rows in files:
        di = [i for i, h in enumerate(header) if h in EPOCH_DATE_COLUMNS]
        ni = [i for i, h in enumerate(header) if h in EPOCH_N_COLUMNS]
        c = collections.Counter()
        for r in rows:
            if not any(x.strip() for x in r):
                continue
            c["rows"] += 1
            hd = any(i < len(r) and r[i].strip() for i in di)
            hn = any(i < len(r) and r[i].strip() for i in ni)
            c["with_date"] += hd
            c["with_n"] += hn
            c["with_both"] += hd and hn
        tot.update(c)
        per.append({"file": n, "rows": c["rows"],
                    "date_columns": [header[i] for i in di], "n_columns": [header[i] for i in ni],
                    "rows_stating_date": c["with_date"], "rows_stating_n": c["with_n"],
                    "rows_stating_both": c["with_both"]})
    return {"per_file": per,
            "all_files": {"files": len(per), "rows": tot["rows"],
                          "rows_stating_date": _frac(tot["with_date"], tot["rows"]),
                          "rows_stating_n": _frac(tot["with_n"], tot["rows"]),
                          "rows_stating_both": _frac(tot["with_both"], tot["rows"]),
                          "files_with_no_date_column": sorted(p["file"] for p in per if not p["date_columns"]),
                          "files_with_no_n_column": sorted(p["file"] for p in per if not p["n_columns"])},
            "column_rule": {"date_columns": list(EPOCH_DATE_COLUMNS), "n_columns": list(EPOCH_N_COLUMNS),
                            "excluded": {"Release date": "model release date, not the result's date",
                                         "stderr / CI columns": "uncertainty, not a sample size"}},
            "licence_statement_sha256": _sha(readme.encode())}


def lmarena_parquet_rows(b):
    try:
        import pyarrow.parquet as pq
    except ImportError:
        raise SchemaDrift("parquet reader (pyarrow) unavailable in this interpreter")
    try:
        t = pq.read_table(io.BytesIO(b))
    except Exception as e:
        raise SchemaDrift("not a readable parquet file: %s" % e)
    missing = [c for c in LMARENA_REQUIRED_COLUMNS if c not in t.column_names]
    if missing:
        raise SchemaDrift("parquet lacks required columns %s" % missing)
    ncol = next((c for c in LMARENA_N_COLUMNS if c in t.column_names), None)
    if ncol is None:
        raise SchemaDrift("parquet has none of the sample-size columns %s" % list(LMARENA_N_COLUMNS))
    names = list(LMARENA_REQUIRED_COLUMNS) + [ncol]
    cols = [t.column(c).to_pylist() for c in names]
    rows = [dict(zip(LMARENA_REQUIRED_COLUMNS + ("n",), v)) for v in zip(*cols)]
    return rows, ncol


def lmarena_file_commit(tree_bytes, cfgname):
    """lastCommit.date of <config>/latest-*.parquet from the Hub's own file listing, or None."""
    if not tree_bytes:
        return None
    try:
        for e in json.loads(tree_bytes):
            if e.get("path", "").startswith(cfgname + "/latest-") and e.get("path", "").endswith(".parquet"):
                return (e.get("lastCommit") or {}).get("date")
    except (ValueError, AttributeError, TypeError):
        return None
    return None


def lmarena_measure(api_bytes, per_config, trees=None):
    """per_config: {config: parquet bytes}; trees: {config: Hub tree listing bytes}.
    Lag = the push time of that config's latest file minus the newest as_of stated in its rows."""
    trees = trees or {}
    try:
        api = json.loads(api_bytes)
    except ValueError as e:
        raise SchemaDrift("dataset API document is not JSON: %s" % e)
    for k in ("lastModified", "sha", "siblings"):
        if k not in api:
            raise SchemaDrift("dataset API document lacks %r" % k)
    lic = (api.get("cardData") or {}).get("license")
    if lic != "cc-by-4.0":
        raise SchemaDrift("dataset licence is %r, not 'cc-by-4.0'; stop and re-read terms" % lic)
    out, drift = [], []
    for cfgname in sorted(per_config):
        try:
            rows, ncol = lmarena_parquet_rows(per_config[cfgname])
        except SchemaDrift as e:
            drift.append({"config": cfgname, "state": "UNMEASURED", "reason": "schema drift: %s" % e})
            continue
        dates = sorted({r["leaderboard_publish_date"] for r in rows if r["leaderboard_publish_date"]})
        as_of = None
        if dates:
            try:
                as_of = _dt.datetime.strptime(dates[-1], "%Y-%m-%d").replace(tzinfo=_dt.timezone.utc)
            except ValueError:
                drift.append({"config": cfgname, "state": "UNMEASURED",
                              "reason": "leaderboard_publish_date %r is not YYYY-MM-DD" % dates[-1]})
                continue
        def states_n(v):
            return isinstance(v, (int, float)) and not (isinstance(v, float) and math.isnan(v)) and v > 0
        no_n = sorted({"%s|%s" % (r["model_name"], r["category"]) for r in rows if not states_n(r["n"])})
        rec = {"config": cfgname, "rows": len(rows), "n_column": ncol,
               "stated_as_of_values": dates,
               "rows_stating_n": _frac(len(rows) - sum(1 for r in rows if not states_n(r["n"])), len(rows)),
               "rows_not_stating_n": no_n[:100], "rows_not_stating_n_capped_at": 100}
        if as_of is None:
            rec["lag"] = {"state": "UNMEASURED", "reason": "no leaderboard_publish_date stated in any row"}
        else:
            fc = lmarena_file_commit(trees.get(cfgname), cfgname)
            if fc is None:
                rec["lag"] = {"state": "UNMEASURED", "stated_as_of": dates[-1],
                              "reason": "no per-file lastCommit for %s/latest-*.parquet in the Hub listing "
                                        "(the repository-wide lastModified is not this file's push time)" % cfgname}
            else:
                pushed_f = _dt.datetime.strptime(fc[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=_dt.timezone.utc)
                hours = (pushed_f - as_of).total_seconds() / 3600.0
                rec["lag"] = {"file_pushed_at": fc, "stated_as_of": dates[-1],
                              "lag_hours_upper": round(hours, 2), "lag_hours_lower": round(hours - 24, 2),
                              "resolution": "as_of is a calendar date (UTC day), so the true lag lies in "
                                            "[upper - 24h, upper]; push time is the lastCommit of that "
                                            "config's latest parquet in the Hub's file listing"}
        out.append(rec)
    return {"dataset_revision": api["sha"], "dataset_pushed_at": api["lastModified"],
            "per_config": out, "unmeasured": drift,
            "not_reported": "ratings and ranks are deliberately not read into this record (no ranking)"}


def hf_context(cfgobj):
    for scope, obj in (("", cfgobj), ("text_config.", cfgobj.get("text_config") or {}),
                       ("llm_config.", cfgobj.get("llm_config") or {})):
        for f in HF_CONTEXT_FIELDS:
            v = obj.get(f)
            if isinstance(v, int) and not isinstance(v, bool) and v > 0:
                return v, scope + f
    return None, None


def openrouter_hf_measure(or_bytes, hf_inputs):
    """hf_inputs: {hf_id: {"model": (bytes|None, status), "config": (bytes|None, status)}}."""
    try:
        d = json.loads(or_bytes)
    except ValueError as e:
        raise SchemaDrift("OpenRouter models document is not JSON: %s" % e)
    if not isinstance(d.get("data"), list) or not d["data"]:
        raise SchemaDrift("OpenRouter document lacks non-empty 'data' list")
    for k in ("id", "hugging_face_id", "context_length"):
        if not any(k in m for m in d["data"]):
            raise SchemaDrift("no OpenRouter model carries %r" % k)
    keys = sorted({k for m in d["data"] for k in m})
    or_has_licence = any(k in keys for k in ("license", "licence"))
    rows = []
    c = collections.Counter()
    for m in sorted(d["data"], key=lambda m: m.get("id", "")):
        hid = m.get("hugging_face_id")
        if not hid:
            continue
        c["models_with_hf_id"] += 1
        hi = hf_inputs.get(hid, {})
        row = {"openrouter_id": m.get("id"), "hf_id": hid}
        mb, mstat = hi.get("model", (None, "not fetched"))
        cb, cstat = hi.get("config", (None, "not fetched"))
        # context length
        orc = m.get("context_length")
        if cb is None:
            row["context_length"] = {"state": "UNMEASURED", "reason": "HF config.json: %s" % cstat,
                                     "openrouter": orc}
        else:
            try:
                hv, hf_field = hf_context(json.loads(cb))
            except (ValueError, AttributeError):
                hv, hf_field = None, None
            if hv is None or not isinstance(orc, int):
                row["context_length"] = {"state": "UNMEASURED",
                                         "reason": "no declared context field (%s) in config.json" % "/".join(HF_CONTEXT_FIELDS)
                                         if hv is None else "OpenRouter context_length not an integer",
                                         "openrouter": orc}
            else:
                st = "AGREE" if hv == orc else "MISMATCH"
                row["context_length"] = {"state": st, "openrouter": orc, "hf": hv, "hf_field": hf_field}
        c["context_" + row["context_length"]["state"]] += 1
        # licence
        hf_lic = None
        if mb is not None:
            try:
                mj = json.loads(mb)
                hf_lic = (mj.get("cardData") or {}).get("license")
                if hf_lic is None:
                    hf_lic = next((t.split(":", 1)[1] for t in mj.get("tags", []) if t.startswith("license:")), None)
            except (ValueError, AttributeError):
                pass
        if not or_has_licence:
            row["licence"] = {"state": "UNMEASURED",
                              "reason": "OpenRouter /api/v1/models declares no licence field on any model",
                              "hf_declared": hf_lic if mb is not None else None,
                              "hf_model_info": "ok" if mb is not None else mstat}
        else:
            orl = m.get("license", m.get("licence"))
            if orl is None or hf_lic is None:
                row["licence"] = {"state": "UNMEASURED", "reason": "a side declares none",
                                  "openrouter": orl, "hf_declared": hf_lic}
            else:
                row["licence"] = {"state": "AGREE" if str(orl).lower() == str(hf_lic).lower() else "MISMATCH",
                                  "openrouter": orl, "hf_declared": hf_lic}
        c["licence_" + row["licence"]["state"]] += 1
        rows.append(row)
    return {"counts": dict(sorted(c.items())),
            "context_length_mismatches": [r for r in rows if r["context_length"]["state"] == "MISMATCH"],
            "per_model": rows,
            "openrouter_model_keys": keys,
            "reading": ("A MISMATCH is two declared values that differ, named with both values. It is not "
                        "an error finding: a provider may serve a shorter or longer window than the "
                        "checkpoint's config declares.")}


# ------------------------------------------------------------------ candidates

def write_candidate(paths, measure, inputs, licence, method, result, unmeasured=None):
    os.makedirs(os.path.join(paths.candidates, measure), exist_ok=True)
    pins = sorted(inputs, key=lambda p: p["source_id"])
    inputs_digest = _sha(json.dumps([[p["source_id"], p["sha256"]] for p in pins]).encode())
    code = _code_sha()
    key = _sha((inputs_digest + code).encode())[:16]
    existing = [f for f in os.listdir(os.path.join(paths.candidates, measure)) if key in f]
    if existing:
        return {"measure": measure, "written": False, "file": existing[0], "reason": "same inputs + code"}
    rec = {"schema": SCHEMA_CANDIDATE, "measure": measure, "candidate_id": "%s-%s" % (measure, key),
           "status": "CANDIDATE_UNSIGNED", "kind": "deterministic_fact",
           "generated_at": _iso(), "inputs": pins, "inputs_digest_sha256": inputs_digest,
           "method": dict(method, code="adapters.py", code_sha256=code),
           "licence": licence, "result": result, "unmeasured": unmeasured or [],
           "doctrine": DOCTRINE,
           "publication": "NOT PUBLISHED. Signing and publication only via the gated board-sign + land step."}
    fn = "%s-%s.json" % (rec["generated_at"].replace(":", "").replace("-", ""), key)
    p = os.path.join(paths.candidates, measure, fn)
    with open(p + ".tmp", "w") as f:
        json.dump(rec, f, indent=1, sort_keys=True)
        f.write("\n")
    os.replace(p + ".tmp", p)
    return {"measure": measure, "written": True, "file": fn}


def write_unmeasured(paths, measure, reason, inputs):
    return write_candidate(paths, measure, inputs, None, {"description": "adapter failed closed"},
                           {"state": "UNMEASURED"}, [{"state": "UNMEASURED", "reason": reason}])


def measure_all(paths):
    st = _state(paths)
    out = []

    # SWE-bench: share of entries stating a logs pointer
    b, pin = latest_input(paths, st, "swebench-com--benchmark-platform")
    lic_b, lic_pin = latest_input(paths, st, "github-repo:SWE-bench/swe-bench.github.io")
    swe_lic = {"id": "CC-BY-NC-4.0 (claimed)", "basis": "catalog claim; GitHub licence field below",
               "note": "NC: only our measurement and a pointer are published, never their rows"}
    if lic_b is not None:
        try:
            swe_lic["github_license_field"] = (json.loads(lic_b).get("license") or {}).get("spdx_id")
        except ValueError:
            pass
    if b is None:
        out.append({"measure": "swebench.logs_pointer_share", "state": "UNMEASURED", "reason": pin})
    else:
        pins = [pin] + ([lic_pin] if lic_b is not None else [])
        try:
            res = swebench_measure(b)
            out.append(write_candidate(paths, "swebench.logs_pointer_share", pins, swe_lic,
                                       {"description": "Per leaderboard in leaderboards.json: entries whose "
                                                       "'logs' field is a non-empty string, over all entries. "
                                                       "Absent field and empty string are counted separately."},
                                       res, res.pop("unmeasured")))
        except SchemaDrift as e:
            out.append(write_unmeasured(paths, "swebench.logs_pointer_share", str(e), pins))

    # Epoch: does each result row state a date and an n?
    b, pin = latest_input(paths, st, "epoch-ai--leaderboard")
    if b is None:
        out.append({"measure": "epoch.date_and_n_stated", "state": "UNMEASURED", "reason": pin})
    else:
        lic = {"id": "CC-BY-4.0", "basis": "README.md inside the zip",
               "attribution": "Epoch AI, 'Capabilities & benchmarking'. Published online at epoch.ai. "
                              "Retrieved from https://epoch.ai/benchmarks"}
        try:
            res = epoch_measure(b)
            out.append(write_candidate(paths, "epoch.date_and_n_stated", [pin], lic,
                                       {"description": "Per CSV in benchmark_data.zip: rows with a non-empty "
                                                       "value in any listed result-date column, and in any "
                                                       "listed sample-size column. Column lists are fixed "
                                                       "and published in result.column_rule."}, res))
        except SchemaDrift as e:
            out.append(write_unmeasured(paths, "epoch.date_and_n_stated", str(e), [pin]))

    # LMArena: push lag vs stated as_of, and n per row
    ab, apin = latest_input(paths, st, "lmarena-dataset-api")
    if ab is None:
        out.append({"measure": "lmarena.publish_lag_and_n", "state": "UNMEASURED", "reason": apin})
    else:
        per, pins, missing, trees = {}, [apin], [], {}
        for sid in sorted(st.get("sources", {})):
            if sid.startswith("lmarena-tree:"):
                tb, tpin = latest_input(paths, st, sid)
                if tb is not None:
                    trees[sid.split(":", 1)[1]] = tb
                    pins.append(tpin)
            if sid.startswith("lmarena-latest:"):
                pb, ppin = latest_input(paths, st, sid)
                if pb is None:
                    missing.append({"config": sid.split(":", 1)[1], "state": "UNMEASURED", "reason": ppin})
                else:
                    per[sid.split(":", 1)[1]] = pb
                    pins.append(ppin)
        lic = {"id": "CC-BY-4.0", "basis": "dataset cardData.license (checked each run; drift fails closed)",
               "attribution": "LMArena, Hugging Face dataset lmarena-ai/leaderboard-dataset, CC BY 4.0"}
        if not per:
            out.append({"measure": "lmarena.publish_lag_and_n", "state": "UNMEASURED",
                        "reason": "no 'latest' parquet fetched yet"})
        else:
            try:
                res = lmarena_measure(ab, per, trees)
                um = res.pop("unmeasured") + missing
                out.append(write_candidate(paths, "lmarena.publish_lag_and_n", pins, lic,
                                           {"description": "Per config 'latest' split: lag between the push "
                                                           "(Hub lastCommit) of that config's latest parquet and "
                                                           "the newest "
                                                           "leaderboard_publish_date stated in its rows; rows "
                                                           "whose sample-size column (first of %s) is a positive "
                                                           "number (n stated)." % "/".join(LMARENA_N_COLUMNS)},
                                           res, um))
            except SchemaDrift as e:
                out.append(write_unmeasured(paths, "lmarena.publish_lag_and_n", str(e), pins))

    # OpenRouter vs Hugging Face declared fields
    ob, opin = latest_input(paths, st, "openrouter-ai--compute")
    if ob is None:
        out.append({"measure": "openrouter_hf.declared_field_agreement", "state": "UNMEASURED", "reason": opin})
    else:
        hf, pins = {}, [opin]
        srcs = st.get("sources", {})
        for sid in sorted(srcs):
            for kind in ("model", "config"):
                pre = "hf-%s:" % kind
                if sid.startswith(pre):
                    hid = sid[len(pre):]
                    hb, hpin = latest_input(paths, st, sid)
                    if hb is None:
                        hf.setdefault(hid, {})[kind] = (None, "HTTP %s" % srcs[sid].get("last_status"))
                    else:
                        hf.setdefault(hid, {})[kind] = (hb, "ok")
                        pins.append(hpin)
        lic = {"id": "mixed", "openrouter": "API terms (not a data licence; not re-read by this lane)",
               "huggingface": "per-model licence as declared on each card"}
        try:
            res = openrouter_hf_measure(ob, hf)
            out.append(write_candidate(paths, "openrouter_hf.declared_field_agreement", pins, lic,
                                       {"description": "For each OpenRouter model declaring a hugging_face_id: "
                                                       "OpenRouter context_length vs the first declared context "
                                                       "field in the HF config.json (%s, top level then "
                                                       "text_config/llm_config); licence compared only if both "
                                                       "sides declare one." % "/".join(HF_CONTEXT_FIELDS)},
                                       res))
        except SchemaDrift as e:
            out.append(write_unmeasured(paths, "openrouter_hf.declared_field_agreement", str(e), pins))
    return out
