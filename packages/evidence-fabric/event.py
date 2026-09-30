#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""csoai.evidence-event/0.1 -- one observation, derived from records that already exist.

This module never mints a measurement. It builds, canonicalises, identifies and checks events; the
renderers in render/ only change their shape.

    python3 event.py validate EVENTS.jsonl            exit 0 when every line is a valid event
    python3 event.py payload MEMBER EVENTS.jsonl --as-of 2026-09-30T12:00:00Z > batch.json
                                                     the unsigned batch record that gets board-signed

Rules the code enforces (and the tests prove can say no):
  * event_id = "sha256:" + sha256(RFC 8785 JCS of the event without event_id, signature, anchors).
    Signature and anchors are attestations ABOUT the event, added later, so they are outside the id.
  * UNMEASURED and UNCHECKABLE never carry a number: value must be null.
  * value, when present, is a JSON number that was measured -- never an estimate, never a grade.
  * limits[] has at least one entry.
  * state is one of six words; there is no PASS, no score band, no "compliant".
"""
import argparse, hashlib, json, math, sys
from decimal import Decimal

SCHEMA = "csoai.evidence-event/0.1"
FABRIC_VERSION = "0.1.0"
STATES = ("CONSISTENT", "DIVERGENT", "PARTIAL", "UNMEASURED", "UNCHECKABLE", "NOT_DISCRIMINATING")
NO_NUMBER_STATES = frozenset({"UNMEASURED", "UNCHECKABLE"})
SUBJECT_KINDS = ("mcp_server", "a2a_card", "oasf_record", "model_card", "package", "policy", "scanner_report",
                 "model_run", "signed_record", "repository", "dataset", "sandbox_run", "web_page")
ID_EXCLUDE = ("event_id", "signature", "anchors")
REQUIRED = ("schema", "subject", "claim", "method", "declared", "observed", "state", "value", "negative_control", "limits")
BANNED_WORDS = ("certified", "certify", "compliant", "compliance status", "pass mark")


class DoctrineError(ValueError):
    """An event that breaks a rule no renderer may carry forward."""


# ---------------------------------------------------------------- RFC 8785 (JCS)

def _num(x):
    if isinstance(x, bool):
        raise TypeError("bool is not a number")
    if isinstance(x, int):
        return str(x)
    if not math.isfinite(x):
        raise DoctrineError("NaN/Infinity cannot be canonicalised (RFC 8785 3.2.2.3)")
    if x == 0:
        return "0"
    if x.is_integer() and abs(x) < 1e21:
        return str(int(x))
    # ECMAScript Number.prototype.toString from Python's shortest round-trip repr.
    t = Decimal(repr(abs(x))).normalize().as_tuple()
    digits = "".join(map(str, t.digits))
    k, n = len(digits), len(digits) + t.exponent  # n = position of the decimal point
    sign = "-" if x < 0 else ""
    if k <= n <= 21:
        s = digits + "0" * (n - k)
    elif 0 < n <= 21:
        s = digits[:n] + "." + digits[n:]
    elif -6 < n <= 0:
        s = "0." + "0" * (-n) + digits
    else:
        ee = n - 1
        s = digits[0] + ("." + digits[1:] if k > 1 else "") + "e" + ("+" if ee > 0 else "-") + str(abs(ee))
    return sign + s


def _str(s):
    return json.dumps(s, ensure_ascii=False)


def jcs(o):
    """RFC 8785 canonical bytes. Keys sort by UTF-16 code units."""
    def enc(v):
        if v is None:
            return "null"
        if v is True:
            return "true"
        if v is False:
            return "false"
        if isinstance(v, (int, float)):
            return _num(v)
        if isinstance(v, str):
            return _str(v)
        if isinstance(v, (list, tuple)):
            return "[" + ",".join(enc(i) for i in v) + "]"
        if isinstance(v, dict):
            keys = sorted(v, key=lambda k: k.encode("utf-16-be"))
            return "{" + ",".join(_str(k) + ":" + enc(v[k]) for k in keys) + "}"
        raise TypeError(f"not JSON: {type(v).__name__}")
    return enc(o).encode("utf-8")


def sha256_hex(b):
    return hashlib.sha256(b).hexdigest()


def compute_event_id(ev):
    return "sha256:" + sha256_hex(jcs({k: v for k, v in ev.items() if k not in ID_EXCLUDE}))


def side_sha256(obj):
    """sha256 of a declared/observed side, for carriers that hold a digest instead of the object."""
    return sha256_hex(jcs(obj))


# ---------------------------------------------------------------- build + check

def build(*, subject, claim, method, declared, observed, state, value=None, negative_control=None, limits,
          supersedes=None, maintenance=None):
    ev = {"schema": SCHEMA, "subject": subject, "claim": claim, "method": method, "declared": declared,
          "observed": observed, "state": state, "value": value,
          "negative_control": negative_control if negative_control is not None else {"id": None, "expected": None, "got": "NOT_RUN"},
          "limits": list(limits), "supersedes": supersedes,
          "signature": None, "anchors": {"ots": "none", "rekor": {"log_index": None, "uuid": None}},
          "maintenance": maintenance}
    ev["event_id"] = compute_event_id(ev)
    errs = validate(ev)
    if errs:
        raise DoctrineError("; ".join(errs))
    return ev


def _is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def validate(ev):
    """Every rule, as a list of human-readable errors. Empty list = valid."""
    e = []
    if not isinstance(ev, dict):
        return ["event is not an object"]
    for k in REQUIRED:
        if k not in ev:
            e.append(f"missing {k}")
    if e:
        return e
    if ev["schema"] != SCHEMA:
        e.append(f"schema must be {SCHEMA}")
    st = ev["state"]
    if st not in STATES:
        e.append(f"state {st!r} is not one of {'/'.join(STATES)}")
    v = ev["value"]
    if v is not None and not _is_num(v):
        e.append("value must be a measured JSON number or null")
    if st in NO_NUMBER_STATES and v is not None:
        e.append(f"{st} carries a number ({v!r}); it must carry none")
    if _is_num(v) and not math.isfinite(v):
        e.append("value is not finite")
    s = ev["subject"]
    if not isinstance(s, dict) or s.get("kind") not in SUBJECT_KINDS or not s.get("locator"):
        e.append("subject needs kind (known) and locator")
    c = ev["claim"]
    if not isinstance(c, dict) or not isinstance(c.get("text"), str) or not c.get("text"):
        e.append("claim.text required")
    elif c.get("source_sha256") is not None and not (isinstance(c["source_sha256"], str) and len(c["source_sha256"]) == 64):
        e.append("claim.source_sha256 must be 64 hex or null")
    m = ev["method"]
    if not isinstance(m, dict) or not m.get("id") or not m.get("version"):
        e.append("method.id and method.version required")
    elif not (m.get("holder") == "csoai" or str(m.get("holder", "")).startswith("third_party:")):
        e.append("method.holder must be csoai or third_party:<name>")
    if not isinstance(ev["limits"], list) or not ev["limits"] or not all(isinstance(x, str) and x for x in ev["limits"]):
        e.append("limits needs at least one non-empty string")
    nc = ev["negative_control"]
    if not isinstance(nc, dict) or "got" not in nc:
        e.append("negative_control needs got")
    elif nc.get("expected") is not None and nc.get("got") not in (nc.get("expected"), "NOT_RUN"):
        e.append(f"negative control expected {nc.get('expected')} but got {nc.get('got')}: the method did not discriminate")
    if st == "CONSISTENT" and isinstance(nc, dict) and nc.get("got") == "NOT_RUN":
        e.append("CONSISTENT with no negative control run; use PARTIAL or run one")
    blob = json.dumps({k: ev[k] for k in ("claim", "limits", "state")}, ensure_ascii=False).lower()
    for w in BANNED_WORDS:
        if w in blob and "never " + w not in blob and "not " + w not in blob:
            e.append(f"doctrine word {w!r} in claim/limits")
    if "event_id" in ev and ev["event_id"] != compute_event_id(ev):
        e.append("event_id does not match the canonical bytes")
    return e


def check_renderable(ev):
    """Called by every renderer before it writes anything. Raises DoctrineError."""
    errs = validate(ev)
    if "event_id" not in ev:
        errs.append("event has no event_id")
    if errs:
        raise DoctrineError("; ".join(errs))
    return ev


def read_jsonl(path):
    with open(path, encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def write_jsonl(path, events):
    with open(path, "w", encoding="utf-8") as f:
        for ev in events:
            f.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


def batch_record(member, events_path, as_of, events=None):
    """The unsigned record that /api/board-sign signs (via its sha256). Integers and strings only."""
    raw = open(events_path, "rb").read()
    events = events if events is not None else read_jsonl(events_path)
    counts = {}
    for ev in events:
        check_renderable(ev)
        counts[ev["state"]] = counts.get(ev["state"], 0) + 1
    return {"schema": "csoai.evidence-batch/0.1", "as_of": as_of, "member_dir": member,
            "events_file": {"name": events_path.rsplit("/", 1)[-1], "sha256": sha256_hex(raw), "bytes": len(raw), "n_events": len(events)},
            "state_counts": dict(sorted(counts.items())),
            "event_ids": [ev["event_id"] for ev in events],
            "event_schema": SCHEMA, "fabric_version": FABRIC_VERSION,
            "note": "Evidence, not a verdict: each event states what was declared, what was observed, and the limits of the read."}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    v = sub.add_parser("validate"); v.add_argument("events")
    p = sub.add_parser("payload"); p.add_argument("member"); p.add_argument("events"); p.add_argument("--as-of", required=True)
    a = ap.parse_args(argv)
    if a.cmd == "validate":
        bad = 0
        for i, ev in enumerate(read_jsonl(a.events), 1):
            errs = validate(ev) or ([] if "event_id" in ev else ["no event_id"])
            if errs:
                bad += 1
                print(f"line {i}: INVALID {'; '.join(errs)}")
        print(f"{'OK' if not bad else 'FAIL'} {a.events}")
        return 1 if bad else 0
    print(json.dumps(batch_record(a.member, a.events, a.as_of), indent=1, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
