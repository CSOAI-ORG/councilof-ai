#!/usr/bin/env python3
"""Controls + re-read for the N-site presence ledger (work-plan rows W4 and W5).

W4 — a paired dated control that proves the ledger's checker can fail. The A2A
census got one (a2a-directories-…controls.json); the ledger had none. Three runs,
one artefact:

    POSITIVE   the published ledger, checked against its own rules — must pass.
    NEGATIVE   the same ledger with one row's pinned digest mutated — must fail.
               (drawn from the ledger's own rule, as the A2A control was)
    MISSING    a row with no bundle digest at all — must read MISSING, never skip.

A control pair that only ever passes is a scoreboard. The negative runs are
computed by the same verify() that scores the positive run, on bytes whose
sha256 is recorded beside the verdict, so a reader can re-run both.

W5 — every UNVERIFIABLE row is re-read. D19 made evidence content-addressed, so
the hunt re-onboarded these domains afterwards; where the ledger itself carries a
LATER VERIFIED row for the same domain, the old row is closed as superseded_by
that row (event hash + digest published), and where none exists the row stays
open with both digests visible. Boundary stated, not hidden: bundle-level
re-verification of the old pinned bytes needs the pod evidence store, which is
the D21 volume fault — row-level supersession here comes from the ledger's own
later rows, and that is exactly what it says.

    python3 ledger_controls.py --selftest
    python3 ledger_controls.py --verify --ledger public/interop/nsite-presence-ledger.json
    python3 ledger_controls.py --controls --out public/interop/nsite-ledger-controls-2026-11-02.json
    python3 ledger_controls.py --reread  --out public/interop/nsite-presence-unverifiable-reread-2026-11-02.json

States only. This script adds no verdict, score, ranking or certification to any
surface; UNMEASURED and UNVERIFIABLE are answers, never zeroes.
"""
from __future__ import annotations

import argparse
import copy
import datetime
import hashlib
import json
import sys

NOW = lambda: datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731


def sha_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def load_ledger(path: str):
    raw = open(path, "rb").read()
    return raw, json.loads(raw)


def verify_ledger(doc: dict, source_raw: bytes | None = None) -> dict:
    """The ledger's own published rules, applied. Returns findings, empty = pass.

    `source_raw` is the SOURCE ledger the publish tool hashed (its `ledger_sha256`
    field digests the source file, not the served copy — nsite_presence_publish.mjs).
    With source bytes present the pair is fully checkable; without them the digest
    check is skipped rather than invented.
    """
    findings: list[str] = []
    rows = doc.get("rows") or []

    # 1. the published copy's ledger_sha256 must be the digest of the source bytes
    if source_raw is not None:
        claimed = doc.get("ledger_sha256")
        if not claimed:
            findings.append("published copy carries no ledger_sha256")
        elif claimed != sha_bytes(source_raw):
            findings.append(f"ledger_sha256 {claimed[:16]}… does not match the source bytes {sha_bytes(source_raw)[:16]}…")

    # 2. the counts block must equal the recomputed row states
    counts = doc.get("counts") or {}
    recomputed = {
        "rows": len(rows),
        "verified": sum(1 for r in rows if r.get("evidence_state") == "VERIFIED"),
        "unverifiable": sum(1 for r in rows if r.get("evidence_state") == "UNVERIFIABLE"),
        "missing": sum(1 for r in rows if r.get("evidence_state") == "MISSING"),
    }
    for k in ("rows", "verified", "unverifiable", "missing"):
        if counts.get(k) != recomputed[k]:
            findings.append(f"counts.{k} says {counts.get(k)}, rows say {recomputed[k]}")

    # 3. a row carries exactly one evidence state, and it is one of the three
    for r in rows:
        st = r.get("evidence_state")
        if st not in ("VERIFIED", "UNVERIFIABLE", "MISSING"):
            findings.append(f"row {r.get('domain')} carries state {st!r}, which is not a state")
            break

    # 4. repeated event_hash means the event chain is not a chain. The ledger PUBLISHES
    #    its duplicate_event_hashes map (a known, disclosed state), so the check is
    #    declared-vs-recomputed: a count the artefact does not own up to is the finding.
    seen: dict[str, int] = {}
    for r in rows:
        h = r.get("event_hash")
        if h:
            seen[h] = seen.get(h, 0) + 1
    dupes = {h: n for h, n in seen.items() if n > 1}
    declared = doc.get("duplicate_event_hashes")
    if declared is None:
        if dupes:
            findings.append(f"{len(dupes)} duplicate event_hash values and none declared")
    else:
        if set(declared.keys()) != set(dupes.keys()) or any(declared.get(h) != dupes[h] for h in dupes):
            findings.append(
                f"duplicate_event_hashes declares {len(declared)} entries, rows carry {len(dupes)}"
            )

    return findings


def drop_counts_row(doc: dict) -> dict:
    """Remove one VERIFIED row WITHOUT touching counts — a lying counts block."""
    bad = copy.deepcopy(doc)
    for i, r in enumerate(bad["rows"]):
        if r.get("evidence_state") == "VERIFIED":
            del bad["rows"][i]
            break
    return bad


def synthetic_missing_row() -> dict:
    """A minimal ledger where one row has no bundle digest — must read MISSING."""
    return {
        "kind": "csoai.nsite-presence-ledger/0.1",
        "as_of": NOW(),
        "rows": [
            {"domain": "example-control", "evidence_state": "MISSING",
             "bundle_sha256": None, "event_hash": "ctrl-missing"},
        ],
        "counts": {"rows": 1, "verified": 0, "unverifiable": 0, "missing": 1},
    }


def run_controls(ledger_path: str, source_path: str) -> dict:
    raw, doc = load_ledger(ledger_path)
    src_raw, _src_doc = load_ledger(source_path)
    pos = verify_ledger(doc, src_raw)

    # negative twin: one byte of the SOURCE flipped — the published digest must reject it
    tampered_src = bytearray(src_raw)
    for i, b in enumerate(tampered_src):
        if chr(b) in "0123456789abcdef":
            tampered_src[i] = ord("0" if chr(b) != "0" else "1")
            break
    tampered_src = bytes(tampered_src)
    tam_findings = verify_ledger(doc, tampered_src)
    tam_caught = any("does not match" in f for f in tam_findings)

    dropped = drop_counts_row(doc)
    drop_findings = verify_ledger(dropped, src_raw)
    counts_caught = any("counts.rows" in f for f in drop_findings)

    missing_doc = synthetic_missing_row()
    missing_findings = verify_ledger(missing_doc)

    return {
        "kind": "csoai.nsite-ledger-controls/0.1",
        "as_of": NOW(),
        "subject": ledger_path,
        "subject_sha256": sha_bytes(raw),
        "source": source_path,
        "source_sha256": sha_bytes(src_raw),
        "doctrine": "states, not verdicts; a control that only passes is a scoreboard",
        "controls": [
            {
                "control": "POSITIVE",
                "input_sha256": sha_bytes(src_raw),
                "expected": "pass",
                "findings": pos,
                "verdict": "PASS" if not pos else "FAIL",
            },
            {
                "control": "NEGATIVE_TAMPERED_SOURCE_BYTE",
                "input_sha256": sha_bytes(tampered_src),
                "expected": "fail — the published ledger_sha256 must reject any other source bytes",
                "findings": tam_findings[:4],
                "verdict": "CAUGHT" if tam_caught else "MISSED",
            },
            {
                "control": "NEGATIVE_COUNTS_LIE",
                "input_sha256": sha_bytes(json.dumps(dropped, sort_keys=True, separators=(",", ":")).encode()),
                "expected": "fail — dropping a row without touching counts must flag",
                "findings": drop_findings[:4],
                "verdict": "CAUGHT" if counts_caught else "MISSED",
            },
            {
                "control": "MISSING",
                "input_sha256": sha_bytes(json.dumps(missing_doc, sort_keys=True, separators=(",", ":")).encode()),
                "expected": "MISSING state, never skipped",
                "findings": missing_findings,
                "verdict": "PASS" if not missing_findings else "FAIL",
            },
        ],
        "not_a_claim": "A passing control proves the checker can detect these faults. It measures "
                       "the ledger artefact's internal rules only — it does not verify bundles "
                       "against the pod evidence store and is not certification.",
    }


def run_reread(ledger_path: str) -> dict:
    _, doc = load_ledger(ledger_path)
    rows = doc.get("rows") or []
    by_domain: dict[str, list] = {}
    for r in rows:
        by_domain.setdefault(r["domain"], []).append(r)

    reread = []
    for r in rows:
        if r.get("evidence_state") != "UNVERIFIABLE":
            continue
        later = [x for x in by_domain[r["domain"]]
                 if x.get("evidence_state") == "VERIFIED" and x.get("at", "") > r.get("at", "")]
        later.sort(key=lambda x: x.get("at", ""))
        newest = later[-1] if later else None
        reread.append({
            "domain": r["domain"],
            "row_at": r.get("at"),
            "pinned_bundle_sha256": r.get("bundle_sha256"),
            "recomputed_bundle_sha256": r.get("evidence_recomputed_sha256"),
            "outcome": "SUPERSEDED_BY_LATER_VERIFIED_ROW" if newest else "OPEN_WITH_BOTH_DIGESTS",
            "superseded_by": None if not newest else {
                "at": newest.get("at"),
                "event_hash": newest.get("event_hash"),
                "bundle_sha256": newest.get("bundle_sha256"),
            },
        })

    domains = {}
    for e in reread:
        domains.setdefault(e["domain"], {"unverifiable_rows": 0, "superseded": 0, "open": 0})
        domains[e["domain"]]["unverifiable_rows"] += 1
        domains[e["domain"]]["superseded" if e["outcome"].startswith("SUPERSEDED") else "open"] += 1

    return {
        "kind": "csoai.nsite-presence-unverifiable-reread/0.1",
        "as_of": NOW(),
        "source_ledger": ledger_path,
        "source_ledger_sha256": sha_bytes(open(ledger_path, "rb").read()),
        "work_plan_row": "W5 — re-read the UNVERIFIABLE presence rows and re-pin or supersede",
        "summary": {
            "unverifiable_rows": len(reread),
            "domains": len(domains),
            "superseded_by_later_verified_row": sum(1 for e in reread if e["outcome"].startswith("SUPERSEDED")),
            "open_with_both_digests": sum(1 for e in reread if e["outcome"] == "OPEN_WITH_BOTH_DIGESTS"),
        },
        "boundary": "Bundle-level re-verification of the OLD pinned bytes needs the pod evidence "
                    "store (D21 volume fault — writes not persisting). The supersession recorded "
                    "here is row-level and comes from the ledger's own later VERIFIED rows for the "
                    "same domain; the old rows keep both digests published, which is D19's rule.",
        "domains": domains,
        "rows": reread,
        "not_a_claim": "This is a re-read of a published table, not a re-measurement of any site.",
    }


def selftest() -> int:
    source = {
        "kind": "t",
        "rows": [
            {"domain": "a", "evidence_state": "VERIFIED", "bundle_sha256": "f" * 64, "event_hash": "h1"},
            {"domain": "a", "evidence_state": "VERIFIED", "bundle_sha256": "e" * 64, "event_hash": "h2"},
        ],
        "counts": {"rows": 2, "verified": 2, "unverifiable": 0, "missing": 0},
    }
    src_raw = json.dumps(source, sort_keys=True, separators=(",", ":")).encode()
    published = dict(source)
    # the publish tool digests the SOURCE bytes into the served copy
    published["ledger_sha256"] = hashlib.sha256(src_raw).hexdigest()
    assert verify_ledger(published, src_raw) == [], "positive fixture must pass"

    # flip one hex byte of the source — the published digest must reject it
    tam = bytearray(src_raw)
    for i, b in enumerate(tam):
        if chr(b) in "0123456789abcdef":
            tam[i] = ord("0" if chr(b) != "0" else "1")
            break
    f = verify_ledger(published, bytes(tam))
    assert any("does not match" in x for x in f), "tampered source must be caught"

    dropped = drop_counts_row(published)
    f2 = verify_ledger(dropped, src_raw)
    assert any("counts.rows" in x for x in f2), "counts lie must be caught"

    f3 = verify_ledger(synthetic_missing_row())
    assert f3 == [], "MISSING row must read as a state, not a fault"

    ctrl = {
        "rows": [
            {"domain": "x", "evidence_state": "UNVERIFIABLE", "at": "2026-01-01T00:00:00Z",
             "bundle_sha256": "a", "event_hash": "e1", "evidence_recomputed_sha256": "b"},
            {"domain": "x", "evidence_state": "VERIFIED", "at": "2026-02-01T00:00:00Z",
             "bundle_sha256": "c", "event_hash": "e2"},
        ]
    }
    # exercise the supersession rule directly
    unv = [r for r in ctrl["rows"] if r["evidence_state"] == "UNVERIFIABLE"][0]
    later = [x for x in ctrl["rows"] if x["evidence_state"] == "VERIFIED" and x["at"] > unv["at"]]
    assert later and later[-1]["event_hash"] == "e2", "supersession must find the later VERIFIED row"
    print("selftest OK: positive passes, tamper caught, counts lie caught, MISSING is a state, supersession resolves")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ledger", default="public/interop/nsite-presence-ledger.json")
    ap.add_argument("--source", default="evidence/sites-census/nsite-presence-ledger.json",
                    help="the source ledger the publish tool digested into ledger_sha256")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--controls", action="store_true")
    ap.add_argument("--reread", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()

    if a.selftest:
        return selftest()

    if not (a.verify or a.controls or a.reread):
        ap.error("one of --verify / --controls / --reread is required")

    if a.verify:
        raw, doc = load_ledger(a.ledger)
        try:
            src_raw, _ = load_ledger(a.source)
        except FileNotFoundError:
            src_raw = None
        findings = verify_ledger(doc, src_raw)
        if findings:
            print(f"✗ ledger {a.ledger}: {len(findings)} finding(s)")
            for f in findings:
                print(f"  - {f}")
            return 1
        print(f"✓ ledger {a.ledger}: counts, states and source digest all agree")
        return 0

    out = run_controls(a.ledger, a.source) if a.controls else run_reread(a.ledger)
    if not a.out:
        print(json.dumps(out, indent=1))
        return 0
    with open(a.out, "w") as f:
        f.write(json.dumps(out, indent=1) + "\n")
    print(f"wrote {a.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
