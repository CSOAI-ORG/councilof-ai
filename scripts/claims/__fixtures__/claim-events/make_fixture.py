#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""A synthetic claim-watch store for scripts/claims/claim-events.test.mjs. Invented subjects, invented digests.

  make_fixture.py --out DIR --days 1|2

Writes DIR/store/<sealed_id>/{history/events.jsonl, atom/atoms.jsonl}, DIR/subjects/<name>/subject.json and
DIR/register.json. The event log is written exactly as claim_watch.py's Log writes it (json.dumps sort_keys,
default separators; prev_sha256 = sha256 of the previous line's bytes), so the exporter reads a faithful shape.
Day 2 appends to day 1; it never rewrites a line.
"""
import argparse, hashlib, json, pathlib

SUBJECTS = [
    {"subject": "fixture-sealed-subject", "sealed_id": "5eed000000000001", "registry_id": "claimreg-fixture-DRAFT",
     "claims": [("FX-1", "CLAIM_MEASURED"), ("FX-2", "UNMEASURED")]},
    {"subject": "fixture-disclosed-subject", "sealed_id": "d15c000000000002", "registry_id": "claimreg-fixture-live",
     "claims": [("DX-1", "CLAIM_MEASURED"), ("DX-2", "CLAIM_MEASURED")]},
]


def h(s):
    return hashlib.sha256(s.encode()).hexdigest()


class Log:
    def __init__(self, p):
        self.p = p; p.parent.mkdir(parents=True, exist_ok=True)
        lines = p.read_bytes().rstrip(b"\n").split(b"\n") if p.exists() and p.stat().st_size else []
        self.prev = hashlib.sha256(lines[-1]).hexdigest() if lines else None
        self.seq = json.loads(lines[-1])["seq"] + 1 if lines else 0

    def ev(self, base, **kw):
        e = dict(base, schema="csoai.claim-watch-event/0.1", seq=self.seq, prev_sha256=self.prev, **kw)
        with open(self.p, "a") as f:
            f.write(json.dumps(e, sort_keys=True) + "\n")
        self.prev = hashlib.sha256(json.dumps(e, sort_keys=True).encode()).hexdigest(); self.seq += 1


def atoms(s, day):
    a = {f"claim_text_present.{c}": True for c, _ in s["claims"]}
    a["doc.bytes_sha256"] = h(f"{s['sealed_id']}-doc-day{day}")  # bytes move every day (a derived pointer)
    changed = day >= 2 and s["sealed_id"].startswith("d15c")
    a["doc.key_material"] = h(f"{s['sealed_id']}-key-{'rotated' if changed else 'original'}")
    return a


def run_day(root, s, day):
    store = root / "store" / s["sealed_id"]
    run_id = f"2026092{day}T075000Z"; date = f"2026-09-2{day}"
    base = {"run_id": run_id, "subject": s["subject"], "subject_sealed_id": s["sealed_id"], "date": date}
    t = lambda sec: f"{date}T07:50:{sec:02d}Z"
    log = Log(store / "history" / "events.jsonl")
    if day == 1:
        log.ev(base, at=t(0), claim_id="*", object_state="OBSERVED", change_state=None, reason="pin created from baseline",
               pin_atoms_sha256=h("pin"))
    log.ev(base, at=t(1), claim_id="*", object_state="OBSERVED", change_state=None, reason="fetched doc.json",
           observations={"doc.json": [200, h(f"{s['sealed_id']}-{day}")]})
    changed = day >= 2 and s["sealed_id"].startswith("d15c")
    checks = {c: not (changed and c.endswith("-2")) for c, _ in s["claims"]}
    log.ev(base, at=t(2), claim_id="*", object_state="MEASURED", change_state=None, all_pass=all(checks.values()),
           checks=checks, verify_result_sha256=h(f"v{day}"))
    ap = store / "atom" / "atoms.jsonl"; ap.parent.mkdir(parents=True, exist_ok=True)
    with open(ap, "a") as f:
        f.write(json.dumps({"at": t(2), "atoms": atoms(s, day), "phase": "primary", "run_id": run_id}, sort_keys=True) + "\n")
    for c, rec in s["claims"]:
        q = changed and c.endswith("-2")
        log.ev(base, at=t(2), claim_id=c, object_state="MEASURED" if q else "REPRODUCED",
               change_state="QUARANTINED" if q else "CONFIRMED", recorded_state=rec, fix=None,
               reason="substantive atom changed; correction candidate written" if q else "no change against the pin")
    log.ev(base, at=t(5), claim_id="*", object_state="SIGNED", change_state="QUARANTINED" if changed else "CONFIRMED",
           receipt="proof/x/receipt.json", receipt_sha256=h(f"receipt-{s['sealed_id']}-{day}"),
           reason="receipt signed via the internal signer path (fixture)")


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--out", required=True); ap.add_argument("--days", type=int, default=1)
    ap.add_argument("--from-day", type=int, default=1)
    a = ap.parse_args(); root = pathlib.Path(a.out)
    for s in SUBJECTS:
        sd = root / "subjects" / s["subject"]; sd.mkdir(parents=True, exist_ok=True)
        (sd / "subject.json").write_text(json.dumps({"subject": s["subject"], "sealed_id": s["sealed_id"],
                                                     "registry_id": s["registry_id"]}, indent=1))
        for day in range(a.from_day, a.days + 1):
            run_day(root, s, day)
    (root / "register.json").write_text(json.dumps({"registries": [
        {"registry_id": "claimreg-fixture-live", "status": "LIVE"},
        {"registry_id": "claimreg-fixture-old", "status": "SUPERSEDED"}]}, indent=1))


if __name__ == "__main__":
    main()
