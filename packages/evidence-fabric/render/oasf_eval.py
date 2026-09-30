#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""csoai.evidence-event/0.1 -> OASF 1.1.0 evaluation module (`core/evaluation`, id 102).

    python3 render/oasf_eval.py EVENTS.jsonl --events-url URL [--created-at UTC] > module.json
    python3 render/oasf_eval.py EVENTS.jsonl --events-url URL --record BASE.oasf.json > record.json

Schemas (official, served by schema.oasf.outshift.com, pinned here and read offline by the tests):
  vendor/oasf-1.1.0-module-evaluation.schema.json  <- /schema/1.1.0/modules/evaluation   (read 30 Sep 2026)
  oasf/oasf-record-1.1.0.schema.json               <- /schema/1.1.0/objects/record       (read 30 Sep 2026)

Mapping (one referred_evaluation per method id + version + holder):
  every event            -> datasets[]: {name, url = <events-url>#<event_id>, version = read time, metadata =
                            event_id, state, subject, method, holder, declared/observed sha256, negative control,
                            limits, signature, ots}
  a MEASURED number only -> evaluation_report.metrics[]: {name = method id, type "gauge", unit_of_measurement
                            (the event's unit, else UCUM "1"), data_points = value, state, event_id, subject}
  publisher              -> CSOAI Ltd (Council of AI), evidence-fabric <version>: who rendered and published the
                            record. The method holder (csoai or third_party:...) is carried per dataset.

What it will not do (tests/test_oasf_eval.py): write overall_rating or overall_scores (a grade); emit a metric
for UNMEASURED or UNCHECKABLE, or a "value" for them anywhere; render an event whose id does not match its bytes.
"""
import argparse, copy, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, anchors, guard, iso, measured_value, sig_summary, when  # noqa: E402

MODULE_NAME, MODULE_ID = "core/evaluation", 102
PUBLISHER = {"name": "CSOAI Ltd (Council of AI)", "version": "evidence-fabric " + E.FABRIC_VERSION, "url": "https://councilof.ai"}
GRADE_KEYS = ("overall_rating", "overall_scores")
ANNOTATIONS = {
    "event_schema": "csoai.evidence-event/0.1",
    "states": "CONSISTENT DIVERGENT PARTIAL UNMEASURED UNCHECKABLE NOT_DISCRIMINATING",
    "unmeasured_rule": "UNMEASURED and UNCHECKABLE carry no number: no metric and no value data point",
    "not_a_grade": "No overall_rating or overall_scores: evidence of declared vs observed, not a verdict or a certification",
    "attribution": "Council of AI (councilof.ai), did:web:csoai.org",
}


def _kv(name, value):
    return {"name": name, "value": str(value)[:2000]}


def _num(v):
    return repr(v) if isinstance(v, float) else str(v)


def dataset(ev, events_url):
    guard(ev)
    sig, anc = sig_summary(ev), anchors(ev)
    m = ev["method"]
    md = [_kv("event_id", ev["event_id"]), _kv("state", ev["state"]),
          _kv("subject_kind", ev["subject"]["kind"]), _kv("subject_locator", ev["subject"]["locator"]),
          _kv("method", "%s@%s" % (m["id"], m["version"])), _kv("method_holder", m["holder"]),
          _kv("declared_sha256", E.side_sha256(ev["declared"])), _kv("observed_sha256", E.side_sha256(ev["observed"])),
          _kv("negative_control", (ev.get("negative_control") or {}).get("got", "NOT_RUN")),
          _kv("limits", "; ".join(ev["limits"])),
          _kv("signature", sig.get("kid") or sig.get("state", "UNSIGNED")),
          _kv("ots", anc.get("ots") or "none")]
    v = measured_value(ev)
    if v is not None:
        md.append(_kv("value", _num(v)))
    return {"name": ("%s %s: %s" % (m["id"], ev["state"], ev["subject"]["locator"]))[:2000],
            "url": "%s#%s" % (events_url, ev["event_id"]), "version": iso(when(ev)), "metadata": md}


def metric(ev, events_url):
    """The OASF metric for ONE measured number, or None. Never produced for a no-number state."""
    guard(ev)
    v = measured_value(ev)
    if v is None:
        return None
    return {"name": ev["method"]["id"], "type": "gauge", "unit_of_measurement": str(ev.get("unit") or "1"),
            "url": "%s#%s" % (events_url, ev["event_id"]),
            "data_points": [_kv("value", _num(v)), _kv("state", ev["state"]),
                            _kv("event_id", ev["event_id"]), _kv("subject_locator", ev["subject"]["locator"])]}


def check(mod):
    """Doctrine gate on a finished module (also usable on a module someone else wrote). Raises E.DoctrineError."""
    d = mod.get("data") or {}
    if any(k in d for k in GRADE_KEYS):
        raise E.DoctrineError("OASF evaluation carries a grade (overall_rating/overall_scores)")
    for r in d.get("referred_evaluations", []):
        rep = r.get("evaluation_report") or {}
        if "overall_scores" in rep:
            raise E.DoctrineError("OASF evaluation_report carries overall_scores")
        by_id = {}
        for ds in r.get("datasets", []):
            kv = {x["name"]: x["value"] for x in ds.get("metadata", [])}
            by_id[kv.get("event_id")] = kv
            if kv.get("state") in E.NO_NUMBER_STATES and "value" in kv:
                raise E.DoctrineError("a %s dataset carries a value" % kv["state"])
        for m in rep.get("metrics", []):
            dp = {x["name"]: x["value"] for x in m["data_points"]}
            st = dp.get("state") or by_id.get(dp.get("event_id"), {}).get("state")
            if st is None or st in E.NO_NUMBER_STATES or by_id.get(dp.get("event_id"), {}).get("state") in E.NO_NUMBER_STATES:
                raise E.DoctrineError("a metric was written for a no-number (or unstated) state")
    return mod


def module(events, events_url, created_at=None):
    groups = {}
    for ev in events:
        m = ev["method"]
        groups.setdefault((m["id"], str(m["version"]), m["holder"]), []).append(ev)
    refs = []
    for key in sorted(groups):
        evs = groups[key]
        ds = [dataset(ev, events_url) for ev in evs]
        ms = [x for x in (metric(ev, events_url) for ev in evs) if x is not None]
        ref = {"created_at": created_at or iso(max(when(ev) for ev in evs)), "publisher": dict(PUBLISHER), "datasets": ds}
        if ms:
            ref["evaluation_report"] = {"metrics": ms}
        refs.append(ref)
    if not refs:
        raise E.DoctrineError("no events: an evaluation module needs at least one referred evaluation")
    return check({"name": MODULE_NAME, "id": MODULE_ID, "annotations": dict(ANNOTATIONS), "data": {"referred_evaluations": refs}})


def record(base, events, events_url, created_at=None):
    """A copy of an OASF record with its core/evaluation module replaced by the rendered one. `base` is not edited."""
    r = copy.deepcopy(base)
    mods = [m for m in r.get("modules", []) if m.get("name") != MODULE_NAME]
    mods.append(module(events, events_url, created_at=created_at))
    r["modules"] = mods
    return r


def single(ev):
    return module([ev], "https://fixture.example.org/evidence/events.jsonl", created_at="2026-09-30T12:00:00Z")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("events")
    ap.add_argument("--events-url", required=True)
    ap.add_argument("--created-at")
    ap.add_argument("--record")
    a = ap.parse_args(argv)
    evs = E.read_jsonl(a.events)
    out = record(json.load(open(a.record)), evs, a.events_url, a.created_at) if a.record else module(evs, a.events_url, a.created_at)
    sys.stdout.write(json.dumps(out, ensure_ascii=False, sort_keys=True, indent=1) + "\n")


if __name__ == "__main__":
    main()
