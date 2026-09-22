#!/usr/bin/env python3
"""Assemble the superseding claim registry from a run directory. Never edits the prior bytes.

The first registry (claimreg-ondo-chainlink-2026-09-22.json) is OTS-submitted. Its bytes are
left exactly as they are and stay served at their own URL. This writes a NEW file that names it
by sha256 and supersedes it by reference, which is the estate's standing rule: supersede or
ledger, never edit signed or anchored bytes.

Each claim record carries its state before and after, the measurement if one was made, the
method, the window, the denominator, the source URLs with access dates, and an explicit
does_not_prove list. The records are committed to an RFC 9162 Merkle root (0x00 leaf / 0x01
node, largest-power-of-two split, no odd-leaf duplication) so any one record can be proved to
have been in this registry without republishing the rest.

Usage: build_rev2.py <run-dir> <out-path> [--prior <path>]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import common as c  # noqa: E402
import merkle_rfc9162 as mk  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
PRIOR = REPO / "public" / "claims" / "claimreg-ondo-chainlink-2026-09-22.json"

STATE_RULES = {
    "CLAIM_CAPTURED": "captured verbatim, hashed and source-cited; no measurement is claimed",
    "CLAIM_MEASURED": "an instrument ran, over a stated window, against a stated denominator, and the reading is published with it",
    "UNMEASURED": "first-class: the measurement has not been made, or the series is not yet long enough to be one, and no number is invented in its place",
    "UNCHECKABLE": "no public data can settle it; the reason is stated and the claim is not scored",
}


def _load(run: Path, cid: str) -> dict:
    p = run / f"{cid}.json"
    if not p.exists():
        return {"state": "UNMEASURED", "reason": f"no harness output at {p.name}"}
    return json.loads(p.read_text(encoding="utf-8"))


def _sources(*blocks) -> list:
    out, seen = [], set()
    for b in blocks:
        for s in (b or []):
            k = (s.get("url"), s.get("accessed_utc"))
            if k not in seen:
                seen.add(k)
                out.append(s)
    return out[:24]


def build_records(run: Path, prior: dict) -> list[dict]:
    prior_by_id = {cl["id"]: (subj, cl) for subj, s in prior["subjects"].items() for cl in s["claims"]}
    recs: list[dict] = []

    def rec(cid: str, state: str, measurement, method: str, window, denominator,
            sources: list, does_not_prove: list, settles=None, note: str | None = None) -> None:
        subj, orig = prior_by_id[cid]
        r = {
            "id": cid, "subject": subj, "text": orig["text"], "type": orig["type"],
            "state_before": orig["state"], "state": state, "state_rule": STATE_RULES[state],
            "measurement_plan_from_rev1": orig["measurement_plan"],
            "method": method, "window": window, "denominator": denominator,
            "measurement": measurement, "sources": sources, "does_not_prove": does_not_prove,
        }
        if settles:
            r["settles"] = settles
        if note:
            r["note"] = note
        recs.append(r)

    # ---- CL-1 restatement watch
    m = _load(run, "CL-1")
    rec("CL-1", m.get("state", "UNMEASURED"),
        {k: m.get(k) for k in ("observations", "distinct_utc_dates", "first_observed_at", "last_observed_at",
                               "first_value", "last_value", "changes", "downward_revisions",
                               "observed_change_requiring_review", "latest", "series_file", "reason")},
        m.get("method", ""), m.get("window"), m.get("denominator"), _sources(m.get("sources")),
        m.get("does_not_prove", []) + [
            "the figure is not recomputed and cannot be: the watch is over how it is published, never over whether it is right"],
        note=("UNMEASURED by design at rev2: the series holds today's reading and no other date. One capture is "
              "not a measurement, so this claim does not move until the weekly loop has added a second dated "
              "point. The series is published so anyone can check ours against theirs."))

    # ---- CL-2 exclusivity counterexamples
    m = _load(run, "CL-2")
    rec("CL-2", m.get("state", "UNMEASURED"),
        {k: m.get(k) for k in ("categories_declared", "counterexample_counts", "counterexamples_per_category")},
        m.get("method", ""), m.get("window"), m.get("denominator"), _sources(),
        m.get("does_not_prove", []),
        note=("a counterexample bears on exclusivity in one declared category and nothing else. No finding of "
              "falsity is made or implied about anyone, and 'all-in-one' is not a defined term."))

    # ---- CL-3 oracle share
    m = _load(run, "CL-3")
    rec("CL-3", m.get("state", "UNMEASURED"),
        {k: m.get(k) for k in ("result", "subject", "paid_sources_dropped", "reason")},
        m.get("method", ""), m.get("window"), m.get("denominator"), _sources(m.get("sources")),
        m.get("does_not_prove", m.get("does_not_settle", [])), settles=m.get("settles"),
        note=("the claim's own denominator is 'the majority of decentralized finance'. The free public "
              "breakdown does not cover that denominator, and the artifact says by how much rather than "
              "publishing a share that would read as an answer to a question it cannot reach."))

    # ---- CL-4 adopters
    m = _load(run, "CL-4")
    corr, base = m.get("corroboration", {}), m.get("adopter_list_baseline", {})
    rec("CL-4", corr.get("state", "UNMEASURED"),
        {"per_organisation": [{k: o.get(k) for k in ("organisation", "status", "meaning", "reach",
                                                     "corroborations")}
                              for o in corr.get("organisations", [])],
         "adopter_list_baseline": {k: base.get(k) for k in ("url", "page_sha256", "present", "absent",
                                                            "measured_at", "denominator")}},
        corr.get("method", ""), corr.get("window"), corr.get("denominator"),
        _sources(base.get("sources")), corr.get("does_not_prove", []),
        note=("NOT_FOUND means this search did not find it. SEARCH_INCONCLUSIVE means we could not look — "
              "several of these organisations answer an automated reader with a block, and that is recorded "
              "as its own state rather than collapsed into an absence. Neither is a statement about anyone."))

    # ---- CL-5 feed health
    m = _load(run, "CL-5")
    rec("CL-5", m.get("state", "UNMEASURED"),
        {"totals": m.get("totals"), "feeds": [{k: f.get(k) for k in (
            "network", "chain_id", "feed", "proxy", "state", "reason", "rounds_read", "intervals",
            "window_start_utc", "window_end_utc", "window_s", "declared_heartbeat_s",
            "declared_deviation_threshold_pct", "grace_s", "gap_min_s", "gap_max_s", "gap_mean_s",
            "excess_max_s", "excess_over_grace_count", "intervals_over_declared_heartbeat_zero_tolerance",
            "interval_excess_buckets", "pct_of_intervals_within_declared_heartbeat_plus_grace",
            "intervals_at_or_over_declared_deviation_threshold", "deviation_max_pct",
            "intervals_exceeding_heartbeat_beyond_grace")} for f in m.get("feeds", [])]},
        m.get("method", ""),
        "per feed: the rounds this run could read back through the feed's current phase; each feed's own "
        "window_start_utc / window_end_utc is recorded with it",
        m.get("denominator"), _sources(m.get("sources")), m.get("does_not_prove", []),
        note=("measured against each feed's OWN published heartbeat and deviation threshold, not against a "
              "standard we chose. This is the harness that repeats: it can be re-run by anyone on a public "
              "RPC with no key."))

    # ---- ON-1 proof-point tracker
    m = _load(run, "ON-1")
    rec("ON-1", "CLAIM_CAPTURED",
        {"proof_point_baseline": {k: m.get(k) for k in ("url", "page_sha256", "page_bytes", "present",
                                                        "absent", "measured_at", "denominator")}},
        m.get("method", ""), m.get("window"), m.get("denominator"), _sources(m.get("sources")),
        (m.get("does_not_prove", []) + [
            "'institutional-grade' has no public definition to measure against, so nothing here scores it"]),
        note=("stays CLAIM_CAPTURED: the sentence is not quantitative and there is no denominator to measure "
              "it against. What is recorded is a baseline of the proof-points attached to it, so a later "
              "change is visible."))

    # ---- ON-2 testimonial
    m = _load(run, "ON-2")
    corr, base = m.get("corroboration", {}), m.get("testimonial_persistence", {})
    org = (corr.get("organisations") or [{}])[0]
    rec("ON-2", corr.get("state", "UNMEASURED"),
        {"corroboration": {k: org.get(k) for k in ("organisation", "status", "meaning", "reach",
                                                   "corroborations")},
         "testimonial_persistence_baseline": {k: base.get(k) for k in ("url", "page_sha256", "present",
                                                                       "absent", "measured_at")}},
        corr.get("method", ""), corr.get("window"), corr.get("denominator"),
        _sources(base.get("sources")), corr.get("does_not_prove", []),
        note="the persistence baseline makes a later removal visible; it says nothing about the testimonial itself.")

    # ---- ON-3 issuer publications
    m = _load(run, "ON-3")
    rec("ON-3", m.get("state", "UNMEASURED"),
        {k: m.get(k) for k in ("attribution", "issuer_documents", "issuer_wording_per_assertion",
                               "linked_reporting_artifacts", "reason")},
        m.get("method", ""), m.get("window"), m.get("denominator"), _sources(m.get("sources")),
        m.get("does_not_prove", []),
        note=("what is measured is which publisher's sentence this is, what the issuer's own current wording "
              "says, and whether the reporting the issuer points to is reachable without an account. No view "
              "on solvency, adequacy or risk is expressed, and none should be read into it."))
    return recs


def main() -> int:
    run = Path(sys.argv[1])
    out = Path(sys.argv[2])
    prior_path = Path(sys.argv[sys.argv.index("--prior") + 1]) if "--prior" in sys.argv else PRIOR
    prior_bytes = prior_path.read_bytes()
    prior = json.loads(prior_bytes)

    records = build_records(run, prior)
    leaves = [c.canonical_bytes(r) for r in records]
    root = mk.root_hex(leaves)
    leaf_index = [{"index": i, "id": r["id"], "state": r["state"],
                   "leaf_sha256": mk.leaf_hash(leaves[i]).hex(),
                   "record_sha256": c.sha256_hex(leaves[i]),
                   "inclusion_proof": [h.hex() for h in mk.inclusion_proof(leaves, i)]}
                  for i, r in enumerate(records)]

    subjects: dict[str, dict] = {}
    for r in records:
        subjects.setdefault(r["subject"], {"source": prior["subjects"][r["subject"]]["source"], "claims": []})
        subjects[r["subject"]]["claims"].append({k: v for k, v in r.items() if k != "subject"})

    tally: dict[str, int] = {}
    for r in records:
        tally[r["state"]] = tally.get(r["state"], 0) + 1

    doc = {
        "schema": "csoai.claim-registry/0.2",
        "registry_id": out.stem,
        "created_utc": c.today(),
        "built_at_utc": c.now_iso(),
        "maintainer": "CSOAI Ltd — claim maintenance (measurement, not certification)",
        "supersedes": {
            "registry_id": prior["registry_id"],
            "file": "/claims/" + prior_path.name,
            "sha256": c.sha256_hex(prior_bytes),
            "rule": ("supersede by reference, never edit: the prior file's bytes are unchanged, still served "
                     "at their own URL and still covered by their own OpenTimestamps submission"),
        },
        "what_moved": {
            "claims": len(records),
            "states": tally,
            "moved_from_claim_captured": sorted(r["id"] for r in records if r["state"] != r["state_before"]),
            "still_claim_captured": sorted(r["id"] for r in records if r["state"] == "CLAIM_CAPTURED"),
        },
        "subjects": subjects,
        "merkle": {
            "algorithm": "RFC 9162 §2.1.1 Merkle Tree Hash",
            "leaf_hash": "SHA-256(0x00 || record_bytes)",
            "node_hash": "SHA-256(0x01 || left || right)",
            "split": "largest power of two below n",
            "odd_leaf_handling": "none — no duplication and no carry-up; the split rule handles every n",
            "record_bytes": "JSON of the claim record with sort_keys=True, separators=(',',':'), ensure_ascii=False, UTF-8",
            "n_leaves": len(leaves),
            "root": root,
            "leaves": leaf_index,
            "not_the_other_two": ("this is NOT public/root.json's shape (which duplicates an odd node) and NOT "
                                  "scripts/measurement_root.py's (which carries one up). Never substitute one "
                                  "for another."),
        },
        "boundaries": [
            "No claim of falsity is made about any party. This registry publishes what each party's own public "
            "record says and what our harness measured, with the window and the method.",
            "NOT_FOUND is a fact about our search. SEARCH_INCONCLUSIVE is a fact about our reach. Neither is a "
            "statement about the organisation named.",
            "Every source was read without a key, an account or a payment. One source required payment and was "
            "recorded as such and dropped, not worked around.",
            "No financial advice, no valuation, no solvency or adequacy opinion, about any product named here.",
            "Nothing in this registry was sent to any party named in it.",
            "We measure. We never certify.",
        ],
        "how_to_rerun": {
            "harnesses": "scripts/claims/ — one module per measurable claim type",
            "run": "python3 scripts/claims/run_all.py <run-dir> && python3 scripts/claims/build_rev2.py <run-dir> <out>",
            "tests": "python3 scripts/claims/test_claim_harness.py   (and --controls to print the planted-input rejections)",
            "requirements": "python3 standard library only; a public RPC and public HTTP; no key, no account, no payment",
        },
        "signature_state": "UNSIGNED — see the .signed.json sidecar beside this file once the signer has run",
        "notes": ("Second pass of claim maintenance on named subjects: every claim the public record allows was "
                  "measured, each one states its window, denominator, method and sources, and each one states "
                  "what it does not prove. Claims that could not be moved say why."),
    }
    body = {k: v for k, v in doc.items()}
    digest = c.sha256_hex(json.dumps(body, sort_keys=True, indent=1).encode("utf-8"))
    doc["registry_digest"] = digest
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"WROTE {out}")
    print(f"  claims={len(records)} states={tally}")
    print(f"  merkle_root={root}")
    print(f"  registry_digest={digest}")
    print(f"  file_sha256={c.sha256_hex(out.read_bytes())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
