#!/usr/bin/env python3
"""Silent-change watch: baseline / compare / calibrate / sign (protocol 1).

    watch.py run     --target open:<name>|paid:<key> ...   one batch, then baseline or comparison
    watch.py trial   --condition BASE|C0..C5 ...            one calibration batch (compared later, by report)
    watch.py report  --dir <trial dir>                      calibration rates per condition
    watch.py sign    --record <file>                        sign the compact payload, GitHub Actions only

Never signs outside GitHub Actions (OIDC only). Paid targets are refused unless enabled in
paid_models.json with a named person's terms confirmation. Output never holds a ranking.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent))
import collect  # noqa: E402
import detector  # noqa: E402

PAID_PATH = HERE / "paid_models.json"
UNMEASURED = ["weights", "raw reasoning", "training data", "serving stack and routing",
              "cause of any change", "behaviour on items outside the probe set"]
STATEMENT = "A measurement of answer movement on 20 public probe items. Not a certificate, not a verdict, not a cause."


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def paid_gate(key: str, path: Path = PAID_PATH) -> dict:
    """The paid-model entry, or SystemExit. OFF unless a person has confirmed the terms."""
    cfg = json.loads(path.read_text(encoding="utf-8"))
    if cfg.get("paid_models_enabled") is not True:
        raise SystemExit("REFUSE: paid_models_enabled is false (no person has confirmed provider terms)")
    for m in cfg["models"]:
        if m["key"] == key:
            t = m.get("terms") or {}
            if not (t.get("confirmed_by_person") and t.get("confirmed_on")):
                raise SystemExit("REFUSE: terms not confirmed by a person for " + key)
            if m.get("own_council"):
                raise SystemExit("REFUSE: own-council models never enter a public watch")
            if not m.get("public_name"):
                raise SystemExit("REFUSE: no public model name set for " + key)
            return m
    raise SystemExit("REFUSE: unknown paid model " + key)


def make_batch_record(target: str, cfg: dict, items_ids: list, shas: dict, k: int,
                      out: dict, condition: str = "watch", model_revision: str = "") -> dict:
    n_calls = max(1, len(items_ids) * k)
    gate = detector.load_protocol().get("addendum_1", {}).get("max_transport_error_share", 0.05)
    err_share = out["transport_errors"] / n_calls
    return {
        "schema": "csoai.silent-change-batch/1",
        "harness_version": detector.HARNESS_VERSION,
        "protocol": detector.protocol_sha256(),
        "target": target,
        "model": cfg.get("model"),
        "model_revision": model_revision or "UNKNOWN",
        "declared_sampling": {"temperature": cfg.get("temperature", 0), "max_tokens": cfg.get("max_tokens", 32),
                              "system_prompt_sha256": hashlib.sha256((cfg.get("system") or "").encode()).hexdigest()},
        "condition": condition,
        "taken_at": now(),
        "k": k,
        "items_commitment": collect.items_commitment(items_ids),
        "bank_file_sha256": shas,
        "transport_error_share": round(err_share, 4),
        "state": "UNCHECKABLE" if err_share > gate else "COLLECTED",
        "answers": out["answers"],
        "raw_sha256": out["raw_sha256"],
        "answers_sha256": collect.batch_digest(out["answers"]),
    }


def decide(state_dir: Path, key: str, batch: dict, comparison_id: str, rebaseline: bool = False) -> dict:
    """Baseline if none (or a person asked), else compare. Writes the baseline file only on BASELINE_SET."""
    base_path = state_dir / key / "baseline.json"
    rec = {"schema": "csoai.silent-change-record/1", "target": batch["target"], "taken_at": batch["taken_at"],
           "protocol": batch["protocol"], "batch_sha256": batch["answers_sha256"], "k": batch["k"],
           "unmeasured": UNMEASURED, "statement": STATEMENT}
    if batch["state"] == "UNCHECKABLE":
        rec.update(state="UNCHECKABLE", reason="transport failures above the registered share",
                   transport_error_share=batch["transport_error_share"])
        return rec
    if rebaseline or not base_path.exists():
        replaced = None
        if base_path.exists():
            replaced = hashlib.sha256(base_path.read_bytes()).hexdigest()
        base_path.parent.mkdir(parents=True, exist_ok=True)
        base_path.write_text(json.dumps(batch, sort_keys=True), encoding="utf-8")
        rec.update(state="BASELINE_SET", replaces_baseline_sha256=replaced)
        return rec
    base = json.loads(base_path.read_text(encoding="utf-8"))
    if base["items_commitment"] != batch["items_commitment"] or base["model"] != batch["model"]:
        rec.update(state="INCOMPARABLE", reason="items or model name differ from the baseline")
        return rec
    result = detector.compare(base["answers"], batch["answers"], comparison_id)
    rec.update(result)
    rec["baseline_sha256"] = hashlib.sha256(base_path.read_bytes()).hexdigest()
    rec["baseline_taken_at"] = base["taken_at"]
    return rec


def compact_payload(rec: dict, calibration_ref: str) -> dict:
    """Small payload for the board signer (3 KB cap): digests and the verdict-free result only."""
    keys = ("state", "target", "taken_at", "T", "p_value", "alpha", "t_floor", "k", "n_items",
            "batch_sha256", "baseline_sha256", "baseline_taken_at", "reason")
    p = {k: rec[k] for k in keys if k in rec and rec[k] is not None}
    p.update(schema="csoai.silent-change-record/1", protocol_sha256=rec["protocol"]["protocol_json"],
             calibration_ref=calibration_ref, unmeasured=rec["unmeasured"], statement=STATEMENT,
             n_semantics="n_items = probe items compared; k = repeats per item per batch")
    return p


def cmd_run(a) -> int:
    proto = detector.load_protocol()
    k = proto["repeats_k"]
    if a.target.startswith("paid:"):
        m = paid_gate(a.target[5:])
        if m["transport"] == "anthropic":
            send = collect.anthropic_send(os.environ[m["key_env"]])
        elif m["transport"] == "openai-compat":
            send = collect.openai_compat_send(m["base_url"], os.environ[m["key_env"]])
        else:
            raise SystemExit("REFUSE: transport not implemented for " + m["key"])
        cfg = {"model": m["public_name"], "temperature": 0, "max_tokens": 32}
        key = m["key"]
    else:
        cfg = {"model": a.model, "temperature": a.temperature, "max_tokens": 32, "system": a.system}
        send = collect.openai_compat_send(a.base_url, os.environ.get(a.key_env, "") if a.key_env else "")
        key = a.target.replace(":", "_")
    items, shas, labels = collect.load_public_items(proto)
    ids = [i[0] for i in items]
    seed = detector.seed_for(proto["protocol_id"], key + a.run_id + "order")
    out = collect.run_batch(items, labels, send, cfg, k, seed)
    batch = make_batch_record(a.target, cfg, ids, shas, k, out, model_revision=a.model_revision)
    rec = decide(Path(a.state_dir), key, batch, key + ":" + a.run_id, a.rebaseline)
    Path(a.out).mkdir(parents=True, exist_ok=True)
    (Path(a.out) / "batch.json").write_text(json.dumps(batch, sort_keys=True), encoding="utf-8")
    (Path(a.out) / "record.json").write_text(json.dumps(rec, indent=1, sort_keys=True), encoding="utf-8")
    (Path(a.out) / "payload.json").write_text(json.dumps(compact_payload(rec, a.calibration_ref), sort_keys=True), encoding="utf-8")
    print(rec["state"], rec.get("T"), rec.get("p_value"))
    return 0


def cond_cfg(pins: dict, condition: str, base_url: str, seed_key: str = "") -> tuple[dict, dict, dict]:
    """(request config, the condition's pin, its file pin) for a registered condition.

    seed_key (run 2): sampling batches send a per-request seed derived from it; temperature 0 batches ignore it.
    """
    cond = pins["conditions"][condition]
    f = pins["files"][cond["file"]]
    cfg = {"model": f["filename"], "temperature": cond["temperature"], "max_tokens": 32,
           "system": cond["system"], "extra_body": pins["server"].get("extra_body"), "base_url": base_url}
    if seed_key:
        cfg["seed_key"] = seed_key
    return cfg, cond, f


def run_trial(pins: dict, condition: str, trial_id: str, base_url: str, outdir: Path, loaded=None,
              items_limit: int = 0, k: int = 0, run: str = "run1", runner: dict | None = None) -> dict:
    """One batch under a registered condition, written as batch-<trial_id>.json.

    items_limit and k are for the local rehearsal only: they cut the batch down and mark it
    rehearsal=true, and the report refuses such a batch.
    """
    proto = detector.load_protocol()
    rehearsal = bool(items_limit or k)
    kk = k or proto["repeats_k"]
    cfg, cond, f = cond_cfg(pins, condition, base_url, seed_key=(trial_id if run == "run2" else ""))
    items, shas, labels = loaded or collect.load_public_items(proto)
    if items_limit:
        items = items[:items_limit]
    ids = [i[0] for i in items]
    send = collect.openai_compat_send(base_url)
    seed = detector.seed_for(proto["protocol_id"], condition + trial_id + "order")
    out = collect.run_batch(items, labels, send, cfg, kk, seed)
    batch = make_batch_record("open:calibration", cfg, ids, shas, kk, out, condition=condition,
                              model_revision=f["revision"])
    batch["trial_id"] = trial_id
    batch["serving"] = {"gguf_sha256": f["sha256"], "gguf_file": f["filename"], "llama_cpp_tag": pins["llama_cpp"]["tag"],
                        "temperature": cond["temperature"]}
    batch["run"] = run
    if run == "run2":
        # addendum 3: recorded from now on. Sampling batches send a per-request seed (rule below); temperature 0 does not.
        batch["serving"]["request_seed_rule"] = ("sha256(trial_id NUL item_id NUL repeat)[:8] mod 2^31, sent per request"
                                                 if cond["temperature"] > 0 else "none (temperature 0)")
        batch["runner"] = runner or {"cpu_model": "UNKNOWN"}
    if rehearsal:
        batch["rehearsal"] = True
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / ("batch-%s.json" % trial_id)).write_text(json.dumps(batch, sort_keys=True), encoding="utf-8")
    return batch


def cmd_trial(a) -> int:
    """One calibration batch under a condition (the shard runner calls run_trial for many of these)."""
    pins = json.loads(Path(a.pins).read_text(encoding="utf-8"))
    batch = run_trial(pins, a.condition, a.trial_id, a.base_url, Path(a.dir), items_limit=a.items_limit, k=a.k, run=a.run)
    print("batch written", a.condition, a.trial_id, batch["state"], "REHEARSAL" if batch.get("rehearsal") else "")
    return 0


def batch_problem(b: dict, pins: dict, run: str = "run1") -> str | None:
    """Why a batch may not be counted for its condition, or None. Binds every batch to the pins.

    Run 1 batches carry the sha256 of the protocol.json that was current on 23 Nov (recorded in addendum_3); run 2
    batches carry the current one.
    """
    cond = pins["conditions"].get(b.get("condition"))
    if cond is None:
        return "unknown condition"
    f = pins["files"][cond["file"]]
    sv = b.get("serving") or {}
    if b.get("model_revision") != f["revision"] or sv.get("gguf_sha256") != f["sha256"]:
        return "file or revision differs from the pin"
    if sv.get("llama_cpp_tag") != pins["llama_cpp"]["tag"]:
        return "llama.cpp release differs from the pin"
    ds = b.get("declared_sampling", {})
    if ds.get("temperature") != cond["temperature"] or \
            ds.get("system_prompt_sha256") != hashlib.sha256((cond["system"] or "").encode()).hexdigest():
        return "sampling or system prompt differs from the pin"
    want = detector.load_protocol()["addendum_3"]["run_1_protocol_json_sha256"] if run == "run1" \
        else detector.protocol_sha256()["protocol_json"]
    if b.get("protocol", {}).get("protocol_json") != want:
        return "batch was made under a different protocol.json"
    if run == "run2" and (b.get("run") != "run2" or not (b.get("runner") or {}).get("cpu_model")):
        return "run 2 batch without its run marker or runner record"
    return None


def cusum_view(base: dict, series: list, cond: str, now_iso: str, ref: tuple | None = None) -> dict:
    """Illustrative second view: CUSUM and Shewhart on one condition's T series, via check_standard.py.

    Reference and spread come from resampling the baseline batch alone (never from the evaluated
    trials). The clock is the trial order. No false-alarm rate is established; it changes no flag.
    """
    import importlib.util
    import random as _r
    path = HERE.parent.parent / "measurement" / "experiments" / "metrology-controls" / "check_standard.py"
    if not path.exists() or len(series) < 5:
        return {"state": "NOT_RUN", "reason": "check_standard.py missing or fewer than 5 trials"}
    spec = importlib.util.spec_from_file_location("check_standard", path)
    cs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(cs)
    if ref:   # run 2: reference and spread from the pool's leave-one-out scores (between-batch spread); ref[2] is the baseline digest
        mu, sd, base_digest = ref
    else:
        rng = _r.Random(detector.seed_for("csoai.silent-change-protocol/1", "cusum-null" + cond))
        k = len(next(iter(base.values())))
        ts = []
        for _ in range(500):  # two draws of K from the baseline's own per-item answer shares
            tot = 0.0
            for ans in base.values():
                tot += detector.tv_distance([rng.choice(ans) for _ in range(k)], [rng.choice(ans) for _ in range(k)])
            ts.append(tot / len(base))
        mu = sum(ts) / len(ts)
        sd = max((sum((x - mu) ** 2 for x in ts) / (len(ts) - 1)) ** 0.5, 0.01)  # spread floored at 0.01, fixed before data
        base_digest = hashlib.sha256(json.dumps(base, sort_keys=True).encode()).hexdigest()
    from datetime import datetime, timedelta, timezone
    # trial order laid on a minute-by-minute clock that ends just before report time (the tool wants real-looking UTC stamps)
    t0 = datetime.strptime(now_iso, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc) - timedelta(minutes=len(series) + 5)
    stamp = lambda i: (t0 + timedelta(minutes=i)).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731
    payload = {"schema": cs.SCHEMA, "instrument_id": "silent-change-detector-v1", "measurand": "mean TV per trial, condition " + cond,
               "check_standard_id": "baseline-batch-resample", "baseline_ref_sha256": base_digest,
               "calibrated_from": stamp(-60), "calibrated_until": "2099-01-01T00:00:00Z", "reference_value": mu, "baseline_sigma": sd,
               "cusum_k_sigma": 0.5, "cusum_h_sigma": 5.0, "shewhart_limit_sigma": 4.0, "max_sample_gap_seconds": 3600,
               "max_observation_age_seconds": 86400 * 31, "max_source_lag_seconds": 3600,
               "samples": [{"measurement_id": "%s-%02d" % (cond, i + 1), "measured_at": stamp(i), "observed_at": stamp(i),
                            "value": float(v), "source_sha256": hashlib.sha256(("%s%d%r" % (cond, i, v)).encode()).hexdigest()}
                           for i, v in enumerate(series)]}
    res = cs.assess(payload, now_iso)
    return {"state": res["state"], "reference_T": round(mu, 4), "spread_T": round(sd, 4), "signals": len(res.get("signals", [])),
            "first_signal_trial": (res["signals"][0]["sample_index"] + 1) if res.get("signals") else None,
            "label": "ILLUSTRATIVE second view; clock is trial order; no false-alarm rate established; changes no flag"}


def rehearsal_report(d: Path) -> int:
    """Local rehearsal only: compare rehearsal rows to BASE-01 with the registered statistic at the rehearsal's own K.
    Prints a REHEARSAL record. Writes no payload, is never signed, never counted."""
    rows = {json.loads(f.read_text())["trial_id"]: json.loads(f.read_text()) for f in sorted(d.glob("batch-*.json"))}
    if not rows or not all(b.get("rehearsal") for b in rows.values()):
        raise SystemExit("REFUSE: --rehearsal reads only rehearsal batches")
    proto = dict(detector.load_protocol())
    k = next(iter(rows.values()))["k"]
    proto["repeats_k"] = k
    base = rows["BASE-01"]
    out = {"schema": "csoai.silent-change-REHEARSAL/1", "NOT_COUNTED": True, "k": k, "compared": {}}
    pool_ids = sorted(t for t in rows if t.startswith("BASE-"))
    pool = [rows[t]["answers"] for t in pool_ids]
    for tid, b in rows.items():
        if tid != "BASE-01":
            r = detector.compare(base["answers"], b["answers"], "rehearsal-" + tid, proto, permutations=300)
            out["compared"][tid] = {x: r.get(x) for x in ("state", "T", "p_value")}
            if len(pool) >= 3 and not tid.startswith("BASE-"):   # rule 2 against the rehearsal's own small pool
                r2 = detector.compare_pooled(pool, b["answers"], "rehearsal-pool-" + tid, k)
                out["compared"][tid]["rule_2"] = {x: r2.get(x) for x in ("state", "S", "theta", "n_pool")}
    out["pool"] = pool_ids
    out["runners"] = {t: (rows[t].get("runner") or {}).get("cpu_model") for t in rows}
    print(json.dumps(out, indent=1, sort_keys=True))
    return 0


def _pool_ids(planmod, bk: str, n: int) -> list:
    return [planmod.trial_id(bk, i) for i in range(1, n + 1)]


def _flags_by_cpu(rows: list) -> dict:
    """Descriptive only: flags and trials per runner CPU model. No cause is claimed from it."""
    out = {}
    for cpu, r in rows:
        o = out.setdefault(cpu, {"trials": 0, "flags": 0})
        if r.get("state") in ("FLAG", "NO_FLAG"):
            o["trials"] += 1
            o["flags"] += r["state"] == "FLAG"
    return out


def cmd_report(a) -> int:
    import plan as planmod
    run = getattr(a, "run", "run1")
    d = Path(a.dir)
    if a.rehearsal:
        return rehearsal_report(d)
    pins = json.loads(Path(a.pins).read_text(encoding="utf-8"))
    proto = detector.load_protocol()
    found, problems, uncheckable = {}, {}, []
    for f in sorted(d.glob("batch-*.json")):
        b = json.loads(f.read_text(encoding="utf-8"))
        if b.get("rehearsal"):
            raise SystemExit("REFUSE: %s is a rehearsal batch; rehearsal rows are never counted" % f.name)
        tid = b.get("trial_id") or f.stem[len("batch-"):]
        why = batch_problem(b, pins, run)
        if why:
            problems[tid] = why
        elif b["state"] == "UNCHECKABLE":
            uncheckable.append(tid)
        else:
            found[tid] = b
    expected = planmod.expected_batches(proto, a.scale, run)
    missing = [e["trial_id"] for e in expected if e["trial_id"] not in found and e["trial_id"] not in uncheckable
               and e["trial_id"] not in problems]
    results, series, series_base = {}, {}, {}      # rule 1 (run 1's rule), against the first batch of the pool
    results2, series2, rows2 = {}, {}, []            # rule 2 (addendum 3), against the pooled baseline
    n_pool = planmod.pool_size(proto, a.scale) if run == "run2" else 0
    pools, pool_info = {}, {}
    if run == "run2":
        for bk in ("BASE", "BASE5"):
            ids = _pool_ids(planmod, bk, n_pool)
            if all(i in found for i in ids):
                pools[bk] = [found[i]["answers"] for i in ids]
                loo = detector.loo_scores(pools[bk])
                pool_info[bk] = {"n_pool": len(ids), "theta": round(max(loo), 6), "loo_scores": [round(x, 6) for x in loo],
                                 "items_varying_between_pool_batches": sum(
                                     1 for i in pools[bk][0] if len({detector._vec(p[i]) for p in pools[bk]}) > 1),
                                 "runner_cpu_models": sorted({(found[i].get("runner") or {}).get("cpu_model", "UNKNOWN") for i in ids})}
    for e in expected:
        c = e["condition"]
        bk = planmod.baseline_of(c)
        if bk is None:
            continue
        b = found.get(e["trial_id"])
        if e["trial_id"] in uncheckable or e["trial_id"] in problems:
            results.setdefault(c, []).append({"state": "INCOMPARABLE"})
            if run == "run2":
                results2.setdefault(c, []).append({"state": "INCOMPARABLE"})
            continue
        if b is None:
            continue
        base = found.get(planmod.trial_id(bk, 1))
        if base is None:
            results.setdefault(c, []).append({"state": "INCOMPARABLE"})
        else:
            r = detector.compare(base["answers"], b["answers"], "batch-" + e["trial_id"], proto)
            results.setdefault(c, []).append(r)
            if r.get("T") is not None:
                series.setdefault(c, []).append(r["T"])
            series_base[c] = base["answers"]
        if run == "run2":
            if bk not in pools:
                r2 = {"state": "INCOMPARABLE", "reason": "baseline pool incomplete"}
            else:
                r2 = detector.compare_pooled(pools[bk], b["answers"], "pool-" + e["trial_id"], proto["repeats_k"])
            results2.setdefault(c, []).append(r2)
            rows2.append(((b.get("runner") or {}).get("cpu_model", "UNKNOWN"), r2))
            if r2.get("S") is not None:
                series2.setdefault(c, []).append(r2["S"])
    rates = detector.calibration_rates(results)
    rates2 = detector.calibration_rates(results2) if run == "run2" else {}
    complete = not missing and not uncheckable and not problems and all(
        planmod.trial_id(bk, 1) in found for bk in ("BASE", "BASE5"))
    base_hashes = {bk: hashlib.sha256((d / ("batch-%s.json" % planmod.trial_id(bk, 1))).read_bytes()).hexdigest()
                   for bk in ("BASE", "BASE5") if (d / ("batch-%s.json" % planmod.trial_id(bk, 1))).exists()}
    second = {}
    if a.cusum and run == "run1":
        second = {c: cusum_view(series_base[c], series[c], c, now()) for c in sorted(series)}
    elif a.cusum and run == "run2":
        for c in sorted(series2):
            bk = planmod.baseline_of(c)
            if bk in pool_info:   # reference and spread from the pool's own leave-one-out scores (between-batch spread)
                loo = pool_info[bk]["loo_scores"]
                mu = sum(loo) / len(loo)
                sd = max((sum((x - mu) ** 2 for x in loo) / (len(loo) - 1)) ** 0.5, 0.01)
                second[c] = cusum_view({}, series2[c], c, now(), ref=(mu, sd, hashlib.sha256(json.dumps(pools[bk], sort_keys=True).encode()).hexdigest()))
    report = {"schema": "csoai.silent-change-calibration/1", "run": run, "protocol": detector.protocol_sha256(),
              "pins_sha256": hashlib.sha256(Path(a.pins).read_bytes()).hexdigest(), "baseline_sha256": base_hashes,
              "complete": complete, "missing": missing, "uncheckable": uncheckable, "problems": problems,
              "scale": a.scale, "rates": rates, "rates_rule_1_label": "rule 1 (run 1's rule): permutation test, p <= 0.01 and T >= 0.03, against the first batch of the pool" if run == "run2" else "rule 1",
              "second_view": second}
    if run == "run2":
        report.update(rates_rule_2=rates2, pools=pool_info, flags_by_cpu_rule_2=_flags_by_cpu(rows2),
                      flags_by_cpu_note="descriptive only; no cause is claimed",
                      rule_2_label="rule 2 (addendum 3): score against the pooled baseline; FLAG iff above the leave-one-out maximum of the pool",
                      flagged_trials_rule_2={c: [{"comparison_id": r["comparison_id"], "items_not_seen_in_pool": r["items_not_seen_in_pool"]}
                                                 for r in rs if r.get("state") == "FLAG"] for c, rs in results2.items()})
    print(json.dumps(report, indent=1, sort_keys=True))
    if a.payload_out:
        keep = ("trials", "flags", "rate", "wilson95", "mean_T", "incomparable")
        compact = {c: {k: v[k] for k in keep} for c, v in rates.items()}
        out = {"schema": "csoai.silent-change-calibration/1", "run": run, "protocol_sha256": report["protocol"]["protocol_json"],
               "pins_sha256": report["pins_sha256"], "baseline_sha256": base_hashes, "complete": complete and a.scale == 1,
               "n_missing": len(missing), "rates": compact, "unmeasured": UNMEASURED, "statement": STATEMENT,
               "n_semantics": "trials = comparable batches per condition, one batch per job; rates = rule 1 (run 1's rule); C0 and C5 are false-flag rates, C1 to C4 detection rates"}
        if run == "run2":
            out["rates_rule_2"] = {c: {k: v[k] for k in keep} for c, v in rates2.items()}
            out["rule_2"] = {"n_pool": n_pool, "theta": {bk: pool_info[bk]["theta"] for bk in pool_info},
                             "false_flag_bound": round(1 / (n_pool + 1), 4) if n_pool else None,
                             "text": "flag iff the score against the pooled no-change batches exceeds the maximum leave-one-out score of the pool"}
        Path(a.payload_out).write_text(json.dumps(out, sort_keys=True), encoding="utf-8")
    return 0


def cmd_sign(a) -> int:
    if not (os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") and os.environ.get("GITHUB_ACTIONS") == "true"):
        raise SystemExit("REFUSE: signing happens only in GitHub Actions")
    sys.path.insert(0, str(HERE.parent))
    from sign_financial_runs import DID, SCHEMA, sign_via_oidc_attested  # noqa: E402
    from verify_card import canonical_js_body_bytes  # noqa: E402
    payload = json.loads(Path(a.payload).read_text(encoding="utf-8"))
    if payload.get("schema") == "csoai.silent-change-calibration/1" and payload.get("complete") is not True:
        raise SystemExit("REFUSE: a calibration report with a missing, unusable or smoke-scale batch is not signed")
    raw = canonical_js_body_bytes(payload)
    if len(raw) > 3072:
        raise SystemExit("HALT: payload over 3072 bytes")
    sig, digest = sign_via_oidc_attested(payload)
    if digest != hashlib.sha256(raw).hexdigest():
        raise SystemExit("UNSIGNED: signer digest differs from the locally reproduced one")
    Path(a.out).write_text(json.dumps({"did": DID, "schema": SCHEMA, "payload": payload, "sha256": digest,
                                       "sig_ed25519": sig, "unmeasured": payload["unmeasured"]},
                                      indent=1, sort_keys=True), encoding="utf-8")
    print("SIGNED", digest[:16])
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--target", required=True)
    r.add_argument("--model", default="")
    r.add_argument("--base-url", default="http://127.0.0.1:11434/v1")
    r.add_argument("--key-env", default="")
    r.add_argument("--temperature", type=float, default=0)
    r.add_argument("--system", default=None)
    r.add_argument("--model-revision", default="")
    r.add_argument("--state-dir", default="state")
    r.add_argument("--out", default="out")
    r.add_argument("--run-id", default=now())
    r.add_argument("--rebaseline", action="store_true")
    r.add_argument("--calibration-ref", default="NOT_YET_MEASURED")
    t = sub.add_parser("trial")
    t.add_argument("--condition", required=True, choices=["BASE", "BASE5", "C0", "C1", "C2", "C3", "C4", "C5"])
    t.add_argument("--trial-id", required=True)
    t.add_argument("--pins", default=str(detector.PROTOCOL_DIR / "calibration-pins.json"))
    t.add_argument("--dir", default="calibration")
    t.add_argument("--base-url", default="http://127.0.0.1:8000/v1")
    t.add_argument("--run", choices=["run1", "run2"], default="run1")
    t.add_argument("--items-limit", type=int, default=0, help="REHEARSAL only: use the first N items")
    t.add_argument("--k", type=int, default=0, help="REHEARSAL only: repeats per item")
    p = sub.add_parser("report")
    p.add_argument("--dir", required=True)
    p.add_argument("--payload-out", default="")
    p.add_argument("--pins", default=str(detector.PROTOCOL_DIR / "calibration-pins.json"))
    p.add_argument("--scale", type=int, default=1, help="a smoke run divided the trial counts; never signed")
    p.add_argument("--run", choices=["run1", "run2"], default="run1", help="run1 = addendum 2 plan, run2 = addendum 3 plan (both rules)")
    p.add_argument("--rehearsal", action="store_true", help="local rehearsal rows only; prints, never signs, never counts")
    p.add_argument("--cusum", action="store_true", help="add the illustrative CUSUM second view")
    s = sub.add_parser("sign")
    s.add_argument("--payload", required=True)
    s.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    return {"run": cmd_run, "trial": cmd_trial, "report": cmd_report, "sign": cmd_sign}[a.cmd](a)


if __name__ == "__main__":
    raise SystemExit(main())
