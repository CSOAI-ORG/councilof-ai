#!/usr/bin/env python3
"""Silent-change watch: baseline / compare / calibrate / sign (protocol 1).

    watch.py run     --target open:<name>|paid:<key> ...   one batch, then baseline or comparison
    watch.py trial   --condition C0..C4 ...                 one calibration batch compared to the baseline
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


def cmd_trial(a) -> int:
    """One calibration batch under a condition, compared with the one baseline batch."""
    proto = detector.load_protocol()
    k = proto["repeats_k"]
    pins = json.loads(Path(a.pins).read_text(encoding="utf-8"))
    cond = pins["conditions"][a.condition]
    cfg = {"model": cond["model"], "temperature": cond.get("temperature", 0), "max_tokens": 32,
           "system": cond.get("system")}
    send = collect.openai_compat_send(cond["base_url"])
    items, shas, labels = collect.load_public_items(proto)
    ids = [i[0] for i in items]
    seed = detector.seed_for(proto["protocol_id"], a.condition + a.trial_id + "order")
    out = collect.run_batch(items, labels, send, cfg, k, seed)
    batch = make_batch_record("open:calibration", cfg, ids, shas, k, out, condition=a.condition,
                              model_revision=cond.get("revision", ""))
    d = Path(a.dir)
    d.mkdir(parents=True, exist_ok=True)
    (d / ("batch-%s-%s.json" % (a.condition, a.trial_id))).write_text(json.dumps(batch, sort_keys=True), encoding="utf-8")
    print("batch written", a.condition, a.trial_id, batch["state"])
    return 0


def cmd_report(a) -> int:
    d = Path(a.dir)
    base_file = sorted(d.glob("batch-BASE-*.json"))[0]
    base = json.loads(base_file.read_text(encoding="utf-8"))
    results = {}
    for f in sorted(d.glob("batch-*.json")):
        if f == base_file:
            continue
        b = json.loads(f.read_text(encoding="utf-8"))
        if b["state"] == "UNCHECKABLE":
            results.setdefault(b["condition"], []).append({"state": "INCOMPARABLE"})
            continue
        results.setdefault(b["condition"], []).append(
            detector.compare(base["answers"], b["answers"], f.stem))
    rates = detector.calibration_rates(results)
    report = {"schema": "csoai.silent-change-calibration/1", "protocol": detector.protocol_sha256(),
              "baseline_sha256": hashlib.sha256(base_file.read_bytes()).hexdigest(), "rates": rates}
    print(json.dumps(report, indent=1, sort_keys=True))
    if a.payload_out:
        compact = {c: {k: v[k] for k in ("trials", "flags", "rate", "wilson95", "mean_T", "incomparable", "role")}
                   for c, v in rates.items()}
        Path(a.payload_out).write_text(json.dumps({
            "schema": "csoai.silent-change-calibration/1", "protocol_sha256": report["protocol"]["protocol_json"],
            "baseline_sha256": report["baseline_sha256"], "rates": compact, "unmeasured": UNMEASURED,
            "statement": STATEMENT, "n_semantics": "trials = comparable batches per condition; each trial is one full batch against the one baseline batch"},
            sort_keys=True), encoding="utf-8")
    return 0


def cmd_sign(a) -> int:
    if not (os.environ.get("ACTIONS_ID_TOKEN_REQUEST_URL") and os.environ.get("GITHUB_ACTIONS") == "true"):
        raise SystemExit("REFUSE: signing happens only in GitHub Actions")
    sys.path.insert(0, str(HERE.parent))
    from sign_financial_runs import DID, SCHEMA, sign_via_oidc_attested  # noqa: E402
    from verify_card import canonical_js_body_bytes  # noqa: E402
    payload = json.loads(Path(a.payload).read_text(encoding="utf-8"))
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
    t.add_argument("--condition", required=True, choices=["C0", "C1", "C2", "C3", "C4", "BASE"])
    t.add_argument("--trial-id", required=True)
    t.add_argument("--pins", default=str(detector.PROTOCOL_DIR / "calibration-pins.json"))
    t.add_argument("--dir", default="calibration")
    p = sub.add_parser("report")
    p.add_argument("--dir", required=True)
    p.add_argument("--payload-out", default="")
    s = sub.add_parser("sign")
    s.add_argument("--payload", required=True)
    s.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    return {"run": cmd_run, "trial": cmd_trial, "report": cmd_report, "sign": cmd_sign}[a.cmd](a)


if __name__ == "__main__":
    raise SystemExit(main())
