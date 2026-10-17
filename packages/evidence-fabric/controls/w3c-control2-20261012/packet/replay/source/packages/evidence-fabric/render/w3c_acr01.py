#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""csoai.evidence-event/0.1 and GSPC board/card states -> W3C Agent Conformance Reporting Format v0.1.

    python3 render/w3c_acr01.py EVENTS.jsonl [--causes CAUSES.json] [--prior-fail-ref REF] > report.json
    python3 render/w3c_acr01.py --validate report.json        rows 1-14 + run level + 5.4; exit 1 on any rejection

Source text: v0.1 of 30 September 2026, public-agent-conformance@w3.org, message 0087
(https://lists.w3.org/Archives/Public/public-agent-conformance/2026Sep/0087.html). Community Group text, not a W3C
Standard. The serialisation below (JSON key names) is ours: v0.1 fixes fields and values, not a wire format.

What this renderer will not do (tests/test_w3c_acr01.py proves each):
  * turn UNMEASURED or UNCHECKABLE into pass or fail. They become not-exercised / inconclusive with a cause;
  * write a cause on pass or fail, or leave one off a non-verdict state (rows 1, 7);
  * assert other-verdict or discrimination without an evidence object it built from two observations it ran
    (rows 9, 11, 12, 13, 14). Our events' negative_control {id, expected, got} is a declaration, not a
    delta-related pair, so on its own it earns "possible-not-demonstrated" and never "demonstrated";
  * answer 5.4 with silence. It says shown-by-run, control, prior-run or nothing, and a control counts only when
    this module RAN it and observed state fail under the same checker revision and configuration digest.
"""
import argparse, base64, hashlib, inspect, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from render import E, guard  # noqa: E402

FORMAT = "w3c-agent-conformance-reporting/0.1"
SPEC = "https://lists.w3.org/Archives/Public/public-agent-conformance/2026Sep/0087.html"
STATES = ("pass", "fail", "not-exercised", "inconclusive", "void")
VERDICTS = frozenset({"pass", "fail"})
# 1.2: the eight closed CAP-1 dispositions, plus the list's four values. Availability failure is CAP-1 `unavailable`.
CAP1 = ("not_applicable", "disabled_by_policy", "unsupported_input", "resource_exhausted", "failed", "unavailable",
        "out_of_scope", "withheld")
CAUSES = CAP1 + ("evidence-does-not-hold", "integrity-failure", "precondition-unsatisfiable",
                 "confinement-failed-during-check")

# evidence-event state -> (v0.1 state, cause). None = verdict (no cause). "DECLARE" = our record carries only free text
# (limits[], observed.result.reason), which v0.1 refuses as a cause, so the caller declares one; else the default is used
# and the record says so in x-csoai.cause_basis.
EVENT_STATE = {
    "CONSISTENT": ("pass", None),
    "DIVERGENT": ("fail", None),
    "PARTIAL": ("inconclusive", "DECLARE"),
    "UNCHECKABLE": ("inconclusive", "DECLARE"),
    "UNMEASURED": ("not-exercised", "DECLARE"),
    "NOT_DISCRIMINATING": ("void", "evidence-does-not-hold"),
}
DEFAULT_CAUSE = "unavailable"


def sha256_hex(b):
    return hashlib.sha256(b).hexdigest()


def _record(check_id, state, cause=None, other="unknown", disc="unknown", evidence=None, x=None):
    r = {"check_id": check_id, "state": state, "other_verdict": other, "discrimination": disc}
    if cause is not None:
        r["cause"] = cause
    if evidence is not None:
        r["evidence"] = evidence
    if x:
        r["x-csoai"] = x
    return r


# ---------------------------------------------------------------- evidence events

def event_record(ev, cause=None):
    """One csoai.evidence-event/0.1 -> one v0.1 per-check record. Runs the doctrine guard first."""
    guard(ev)
    state, c = EVENT_STATE[ev["state"]]
    basis = None
    if isinstance(cause, dict):
        cause = cause.get("cause")
    if c == "DECLARE":
        if cause is not None:
            c, basis = cause, "declared by the producer (sidecar), classified from the record's own reason text"
        else:
            c, basis = DEFAULT_CAUSE, "state default: the event carries only free text, which v0.1 refuses (lossy)"
    elif c is not None:
        basis = "fixed by state mapping"
    if c is not None and c not in CAUSES:
        raise E.DoctrineError(f"cause {c!r} is not in the v0.1 vocabulary")
    other = "unknown"
    nc = ev["negative_control"]
    if state == "pass" and nc.get("got") not in (None, "NOT_RUN") and nc.get("got") == nc.get("expected") == "DIVERGENT":
        # A control returned the other verdict, but the event holds no delta-related pair (section 2): possible, not shown.
        other = "possible-not-demonstrated"
    x = {"event_state": ev["state"], "event_id": ev["event_id"], "subject": ev["subject"],
         "method": {k: ev["method"][k] for k in ("id", "version", "holder") if k in ev["method"]},
         "negative_control": nc, "limits": ev["limits"]}
    if basis:
        x["cause_basis"] = basis
    if ev["state"] not in E.NO_NUMBER_STATES and ev.get("value") is not None:
        x["value"] = ev["value"]  # a measured number rides as an extension; v0.1 has no slot for it
    cid = f"{ev['method']['id']}@{ev['method']['version']}#{ev['subject']['locator']}~{ev['event_id'][7:19]}"
    return _record(cid, state, c, other,
                   "unknown", {"ref": f"urn:csoai:evidence-event:{ev['event_id']}", "sha256": ev["event_id"][7:]}, x)


# ---------------------------------------------------------------- board axes and signed cards

def axis_records(axis):
    """One /api/gspc axis -> its declared checks. UNMEASURED never yields a verdict on either check.

    measurement: MEASURED -> pass ("a run under the declared bench exists"; it says nothing about any model),
                 UNMEASURED -> not-exercised, UNCHECKABLE -> inconclusive.
    separation (model-comparison axes only; not declared on deterministic-facts axes): SEPARATED -> pass,
                 TIE -> fail (the test ran and did not separate the top row), UNTESTED -> not-exercised.
    """
    name, status, sep = axis.get("axis"), axis.get("status"), axis.get("separation")
    x = {"axis_status": status, "separation": sep, "kind": axis.get("kind"), "n": axis.get("n")}
    out = []
    if status == "MEASURED":
        out.append(_record(f"gspc/{name}/measurement", "pass", x=x))
    elif status == "UNCHECKABLE":
        out.append(_record(f"gspc/{name}/measurement", "inconclusive", DEFAULT_CAUSE, x=x))
    else:  # UNMEASURED or anything unknown: never a verdict
        out.append(_record(f"gspc/{name}/measurement", "not-exercised", DEFAULT_CAUSE, x=x))
    if axis.get("kind") == "model-comparison":
        cid = f"gspc/{name}/separation-of-top-row"
        if status != "MEASURED":
            out.append(_record(cid, "not-exercised", DEFAULT_CAUSE, x=x))
        elif sep == "SEPARATED":
            out.append(_record(cid, "pass", x=x))
        elif sep == "TIE":
            out.append(_record(cid, "fail", x=dict(x, note="fail of the separation claim, not of any model")))
        else:  # UNTESTED or absent
            out.append(_record(cid, "not-exercised", DEFAULT_CAUSE, x=x))
    return out


CARD_STATE = {"MEASURED": ("pass", None), "UNMEASURED": ("not-exercised", DEFAULT_CAUSE),
              "UNCHECKABLE": ("inconclusive", DEFAULT_CAUSE)}


def card_record(card_id, card_state, body_verifies=None):
    """A signed card's state -> the check "a measurement exists and its signed body verifies".
    body_verifies False is an integrity failure: the card ran, its evidence does not hold -> void."""
    if body_verifies is False:
        return _record(f"card/{card_id}", "void", "evidence-does-not-hold", x={"card_state": card_state})
    state, cause = CARD_STATE.get(card_state, ("not-exercised", DEFAULT_CAUSE))
    return _record(f"card/{card_id}", state, cause, x={"card_state": card_state})


# ---------------------------------------------------------------- a real control: the board signature check

def check_signed_artifact(artifact, signed, did_doc, relax=frozenset()):
    """The declared check "the board signature covers these artifact bytes", as the SAFE pack's verify.py check 5.
    Returns (state, rule). rule names what refused; relax skips named rules (the 5.5 isolation sweep only)."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    try:
        s = json.loads(signed)
        pay, sg = s["payload"], s["signature"]
    except Exception:
        return "fail", "signed-record-unparseable"
    if "payload-digest" not in relax and sha256_hex(canon(pay)) != sg.get("payload_sha256"):
        return "fail", "payload-digest"
    if "artifact-digest" not in relax and pay.get("artifact", {}).get("sha256") != sha256_hex(artifact):
        return "fail", "artifact-digest"
    frag = str(sg.get("did", "")).split("#")[-1]
    m = next((m for m in did_doc.get("verificationMethod", []) if m.get("id", "").endswith("#" + frag)), None)
    if m is None:
        return "inconclusive", "key-not-in-did-document"
    if "ed25519-signature" not in relax:
        x = m["publicKeyJwk"]["x"]
        try:
            Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))).verify(
                bytes.fromhex(sg["sig_ed25519"]), canon(pay))
        except Exception:
            return "fail", "ed25519-signature"
    return "pass", None


def checker_revision():
    return "sha256:" + sha256_hex(inspect.getsource(check_signed_artifact).encode())


def config_digest(did_bytes):
    """The configuration and constraints the check runs under: the DID document bytes and the canonicalisation."""
    return sha256_hex(E.jcs({"did_document_sha256": sha256_hex(did_bytes), "alg": "Ed25519",
                             "canonical": "JSON, keys sorted, no whitespace, UTF-8, non-ASCII unescaped"}))


def _flip_sig(signed):
    s = json.loads(signed)
    h = s["signature"]["sig_ed25519"]
    s["signature"]["sig_ed25519"] = ("0" if h[0] != "0" else "1") + h[1:]
    return json.dumps(s, indent=1, ensure_ascii=False).encode()


def _alter_artifact_digest(signed):
    s = json.loads(signed)
    a = s["payload"]["artifact"]["sha256"]
    s["payload"]["artifact"]["sha256"] = ("0" if a[0] != "0" else "1") + a[1:]
    return json.dumps(s, indent=1, ensure_ascii=False).encode()


# The three altered-preimage controls FREEZE.signed.json records as run at signing (local_verification), re-run here.
CONTROLS = (
    ("trailing-byte-appended", "the artifact bytes gain one trailing newline, so they are no longer the signed bytes",
     "artifact-digest", lambda a, s: (a + b"\n", s)),
    ("artifact-digest-altered", "the payload's artifact sha256 is changed, so the payload is no longer the signed payload",
     "payload-digest", lambda a, s: (a, _alter_artifact_digest(s))),
    ("signature-bit-flipped", "one hex digit of the Ed25519 signature is changed, so it cannot verify",
     "ed25519-signature", lambda a, s: (a, _flip_sig(s))),
)


def signature_run(artifact, signed, did_bytes, artifact_ref, domain_id="dom:safe-pack-freeze"):
    """Run the declared check on the real bytes and on each control; return (record, evidence_objects, fixtures, run).
    Every state below is observed by calling the checker, never declared."""
    did_doc = json.loads(did_bytes)
    rev, cfg = checker_revision(), config_digest(did_bytes)
    cid = "csoai/board-signature-covers-artifact"
    real_state, real_rule = check_signed_artifact(artifact, signed, did_doc)
    base_in = {"artifact_sha256": sha256_hex(artifact), "signed_sha256": sha256_hex(signed)}
    evidence, fixtures, runs = [], [], []
    for fid, why, rule, mutate in CONTROLS:
        a2, s2 = mutate(artifact, signed)
        st, got_rule = check_signed_artifact(a2, s2, did_doc)
        obs = [{"input": base_in, "verdict": real_state, "rule": real_rule},
               {"input": {"artifact_sha256": sha256_hex(a2), "signed_sha256": sha256_hex(s2)}, "verdict": st, "rule": got_rule}]
        evidence.append({"id": f"evo:{fid}", "changed": "input artifact",
                         "fixed": {"checker": {"check_id": cid, "checker_revision": rev}, "constraint_set": cfg,
                                   "domain": domain_id},
                         "compared": ["verdict", "rule"], "observations": obs,
                         "moved": recompute_moved(obs, ["verdict", "rule"]), "delta": why})
        isolation = {}
        for relaxed in ("payload-digest", "artifact-digest", "ed25519-signature"):
            isolation[relaxed] = check_signed_artifact(a2, s2, did_doc, relax=frozenset({relaxed}))[0]
        fixtures.append({"fixture_id": f"csoai-safe-freeze-{fid}",
                         "target_check": {"check_id": cid, "checker_revision": rev, "config_digest": cfg},
                         "input": {"carry": base64.b64encode(a2).decode()} if a2 != artifact
                         else {"carry": base64.b64encode(s2).decode()},
                         "derived_from": {"ref": artifact_ref, "sha256": sha256_hex(artifact) if a2 != artifact
                                          else sha256_hex(signed), "change": why},
                         "expected": {"state": "fail", "rule": rule},
                         "why_must_fail": why[0].upper() + why[1:] + ".",
                         "x-csoai-input-role": "artifact" if a2 != artifact else "signed-record",
                         "observed": {"state": st, "rule": got_rule, "runner": "render/w3c_acr01.py signature_run"},
                         "x-csoai-isolation-observed": isolation,
                         "provenance": {"author": "CSOAI", "source": "FREEZE.signed.json local_verification.altered_preimage_controls",
                                        "license": "CC0-1.0"}})
        runs.append({"fixture_id": f"csoai-safe-freeze-{fid}", "check_id": cid, "checker_revision": rev,
                     "config_digest": cfg, "observed_state": st, "rule": got_rule, "expected_rule": rule})
    demo = next((e for e in evidence if "verdict" in e["moved"]), None)
    other = {"demonstrated": demo["id"]} if demo else "unknown"
    rec = _record(cid, real_state, None if real_state in VERDICTS else "unavailable", other,
                  {"demonstrated": demo["id"]} if demo else "unknown", {"carried": [e["id"] for e in evidence]},
                  {"artifact_ref": artifact_ref, "rule": real_rule})
    return rec, evidence, fixtures, runs


def recompute_moved(observations, compared):
    """Section 2: moved is recomputed over what the observations contain, never declared."""
    a, b = observations
    return [k for k in compared if a.get(k) != b.get(k)]


# ---------------------------------------------------------------- the report and its roll-up

def rollup(records, controls=(), prior_fail_ref=None):
    by = {s: 0 for s in STATES}
    for r in records:
        by[r["state"]] += 1
    declared = len(records)
    exercised = declared - by["not-exercised"]
    verdicts = by["pass"] + by["fail"]
    carried = sum(1 for r in records if r["state"] in VERDICTS and "carried" in r.get("evidence", {}))
    referenced = sum(1 for r in records if r["state"] in VERDICTS and "ref" in r.get("evidence", {}))

    def claim(pop, ok):
        return {"population": pop, "state": "not-claimable" if pop == 0 else ("satisfied" if ok else "not-satisfied")}
    good = [c for c in controls if c.get("observed_state") == "fail" and c.get("rule") == c.get("expected_rule")]
    if by["fail"] > 0:
        dp = {"basis": "shown-by-run", "fail_count": by["fail"]}
    elif good:
        dp = {"basis": "control", "controls": good}
    elif prior_fail_ref:
        dp = {"basis": "prior-run", "ref": prior_fail_ref}
    else:
        dp = {"basis": "nothing"}
    return {
        "declared": declared, "by_state": by,
        "aggregate": {"over": "declared, exercised checks", "pass": by["pass"], "denominator": exercised,
                      "note": "inconclusive and void are in the denominator and cannot improve it (5.1)"},
        "completeness": {"accounting": claim(declared, True),
                         "execution": claim(declared, by["not-exercised"] == 0),
                         "evidence": claim(verdicts, carried + referenced == verdicts),
                         "no_declared_check_void": claim(declared, by["void"] == 0)},
        "evidence_counter": {"carried": carried, "referenced": referenced},
        "discriminating_power": dp,
    }


def report(records, *, domain, source, evidence_objects=(), fixtures=(), controls=(), prior_fail_ref=None):
    return {"format": FORMAT, "spec": SPEC,
            "note": "Measurement records re-expressed in the v0.1 per-check shape. Not a certification, grade or ranking. "
                    "pass on a gspc measurement check means a run exists; it says nothing about any model.",
            "producer": {"name": "GSPC evidence fabric", "version": E.FABRIC_VERSION, "renderer": "render/w3c_acr01.py"},
            "source": source, "domain": domain, "checks": list(records),
            "evidence_objects": list(evidence_objects), "control_fixtures": list(fixtures),
            "rollup": rollup(records, controls, prior_fail_ref)}


def events_report(events, events_bytes, causes=None, controls=(), prior_fail_ref=None, source_ref=None):
    causes = causes or {}
    recs = [event_record(ev, causes.get(ev["event_id"])) for ev in events]
    dom = {"id": "dom:evidence-events", "population": len(events),
           "description": "every event in the source file; the count is bound with the file digest"}
    src = {"ref": source_ref, "sha256": sha256_hex(events_bytes), "count": len(events), "tree_shape": "flat",
           "tree_note": "sha256 over the JSONL bytes; the signed batch or freeze record binds this count (3.1)"}
    return report(recs, domain=dom, source=src, controls=controls, prior_fail_ref=prior_fail_ref)


def signature_report(artifact, signed, did_bytes, artifact_ref):
    rec, evo, fx, runs = signature_run(artifact, signed, did_bytes, artifact_ref)
    dom = {"id": "dom:safe-pack-freeze", "population": 1, "description": "one signed artifact and its signature record"}
    src = {"ref": artifact_ref, "sha256": sha256_hex(artifact), "count": 1, "tree_shape": "flat"}
    return report([rec], domain=dom, source=src, evidence_objects=evo, fixtures=fx, controls=runs)


# ---------------------------------------------------------------- the rejection table, as we read it

def rejections(rep):
    """[(row, message)] for one report. Empty = accepted. Rows as numbered in v0.1 section 4."""
    out = []
    evo = {e["id"]: e for e in rep.get("evidence_objects", [])}
    dom_id = (rep.get("domain") or {}).get("id")
    for r in rep.get("checks", []):
        st, cause = r.get("state"), r.get("cause")
        ov, dz = r.get("other_verdict", "unknown"), r.get("discrimination", "unknown")
        tag = r.get("check_id")
        if st not in STATES:
            out.append(("form", f"{tag}: state {st!r} not in v0.1"))
            continue
        if cause is not None and cause not in CAUSES:
            out.append(("1", f"{tag}: cause {cause!r} is free text, not a disposition"))
        if st not in VERDICTS and cause is None:
            out.append(("1", f"{tag}: non-verdict state with no cause"))
        if st == "void" and cause in ("not_applicable", "out_of_scope", "withheld"):
            out.append(("2", f"{tag}: void with {cause}"))
        if st == "not-exercised" and cause == "integrity-failure":
            out.append(("3", f"{tag}: not-exercised with integrity-failure"))
        if cause == "confinement-failed-during-check" and st != "void":
            out.append(("4", f"{tag}: confinement-failed-during-check on {st}"))
        if r.get("declared_exclusion") and st != "not-exercised":
            out.append(("5", f"{tag}: declared exclusion with {st}"))
        if st not in VERDICTS and (ov != "unknown" or dz != "unknown"):
            out.append(("6", f"{tag}: non-verdict state carrying a qualifier"))
        if st in VERDICTS and cause is not None:
            out.append(("7", f"{tag}: verdict state carrying a cause"))
        if isinstance(ov, dict) and "foreclosed" in ov and isinstance(dz, dict) and "demonstrated" in dz:
            out.append(("8", f"{tag}: foreclosed with discrimination demonstrated"))
        if isinstance(dz, dict) and "demonstrated" in dz and ov in ("unknown", "possible-not-demonstrated"):
            out.append(("9", f"{tag}: discrimination demonstrated with other-verdict {ov}"))
        if isinstance(ov, dict) and "foreclosed" in ov:
            f = ov["foreclosed"] or {}
            if not f.get("constraint_set") or not f.get("domain"):
                out.append(("10", f"{tag}: foreclosed without constraint set and domain"))
            elif f.get("domain") != dom_id:
                out.append(("10", f"{tag}: foreclosed over a domain that is not the run's"))
        for field, val in (("other_verdict", ov), ("discrimination", dz)):
            if isinstance(val, dict):
                ref = val.get("demonstrated") if "demonstrated" in val else (val.get("foreclosed") or {}).get("evidence")
                if not ref or ref not in evo:
                    out.append(("11", f"{tag}: {field} asserted without a resolvable evidence reference"))
                    continue
                ob = evo[ref]
                if field == "discrimination" and ob.get("changed") == "checker rule":
                    out.append(("12", f"{tag}: discrimination cites an object whose changed slot is the checker"))
                if field == "other_verdict" and "demonstrated" in val:
                    moved = recompute_moved(ob["observations"], ob["compared"]) if len(ob.get("observations", [])) == 2 else None
                    if moved is None or "verdict" not in moved:
                        out.append(("13", f"{tag}: other-verdict demonstrated, but recomputed moved lacks the verdict"))
    for ob in rep.get("evidence_objects", []):
        if ob.get("moved") and not (len(ob.get("observations", [])) == 2 or ob.get("observation_refs")):
            out.append(("14", f"{ob.get('id')}: moved asserted without carrying or digest-referencing both observations"))
        elif ob.get("observations") and set(ob.get("moved", [])) != set(recompute_moved(ob["observations"], ob["compared"])):
            out.append(("13", f"{ob.get('id')}: declared moved differs from the recomputed moved"))
        if not set(ob.get("moved", [])) <= set(ob.get("compared", [])):
            out.append(("evidence-object", f"{ob.get('id')}: moved not contained in compared"))
    ru = rep.get("rollup") or {}
    for name, c in (ru.get("completeness") or {}).items():
        if "population" not in c:
            out.append(("run", f"completeness claim {name} without its population"))
    dp = ru.get("discriminating_power")
    if not dp or dp.get("basis") not in ("shown-by-run", "control", "prior-run", "nothing"):
        out.append(("5.4", "discriminating power is silent"))
    elif dp["basis"] == "shown-by-run" and not (ru.get("by_state", {}).get("fail", 0) > 0):
        out.append(("5.4", "shown-by-run with no fail record"))
    elif dp["basis"] == "control":
        for c in dp.get("controls", []):
            if c.get("observed_state") != "fail":
                out.append(("5.4", f"control {c.get('fixture_id')} observed {c.get('observed_state')}, not fail"))
            if c.get("rule") != c.get("expected_rule"):
                out.append(("5.4", f"control {c.get('fixture_id')} did not report the rule it was built for"))
            match = [r for r in rep.get("checks", []) if r.get("check_id") == c.get("check_id")]
            if not match:
                out.append(("5.4", f"control {c.get('fixture_id')} is not one of the run's declared checks"))
        fx = {f["fixture_id"]: f["target_check"] for f in rep.get("control_fixtures", [])}
        for c in dp.get("controls", []):
            t = fx.get(c.get("fixture_id"))
            if t and (t["checker_revision"] != c.get("checker_revision") or t["config_digest"] != c.get("config_digest")):
                out.append(("5.4", f"control {c.get('fixture_id')} ran under another checker or configuration"))
    return out


def dump(o):
    return json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("events", nargs="?")
    ap.add_argument("--causes", help="JSON {event_id: cause} declared by the producer for non-verdict events")
    ap.add_argument("--prior-fail-ref", help="reference to a prior run where the same declared checks returned fail")
    ap.add_argument("--validate", metavar="REPORT", help="check a report against the rejection table")
    a = ap.parse_args(argv)
    if a.validate:
        rej = rejections(json.load(open(a.validate, encoding="utf-8")))
        for row, msg in rej:
            print(f"REJECTED row {row}: {msg}")
        print("ACCEPTED" if not rej else f"REJECTED ({len(rej)})")
        return 1 if rej else 0
    raw = open(a.events, "rb").read()
    evs = [json.loads(l) for l in raw.decode("utf-8").splitlines() if l.strip()]
    causes = json.load(open(a.causes, encoding="utf-8"))["causes"] if a.causes else None
    rep = events_report(evs, raw, causes, prior_fail_ref=a.prior_fail_ref, source_ref=os.path.basename(a.events))
    sys.stdout.write(dump(rep))
    return 0


if __name__ == "__main__":
    sys.exit(main())
