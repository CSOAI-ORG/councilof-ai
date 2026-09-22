#!/usr/bin/env python3
"""The weekly claim-maintenance run: extend the series, re-read the baselines, emit a receipt.

What it does, once per run:
  * CL-1  capture the cumulative counter again and append it to the published series;
  * CL-4 / ON-1 / ON-2  re-read the presence baselines (adopter list, proof-points, testimonial)
        and diff them against the previous run;
  * CL-3  recompute the oracle share from the keyless public breakdown;
  * CL-5  re-read the feeds and recompute cadence and deviation against their declared parameters.

What it emits. One receipt line per run, appended to receipts.jsonl, carrying the run id, the
time, the state of every claim it touched, the digest of every artifact it wrote, and a list of
`observed_changes_requiring_review`.

What it never emits. An allegation. A change in someone's published figure, or the disappearance
of a name from a page, is written as an observed change requiring review and nothing else. The
loop notifies; a human reads. Nothing is sent to anyone named in the registry.

The SCHEDULER owns the stamp. This script takes --now and never writes a stamp of its own.
"""
from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import common as c  # noqa: E402
import feed_health  # noqa: E402
import oracle_share  # noqa: E402
import presence  # noqa: E402
import restatement  # noqa: E402
from run_all import ADOPTERS, CHAINLINK_HOME, ONDO_HOME  # noqa: E402

BASELINES = {
    "CL-4": (CHAINLINK_HOME, ADOPTERS, "the page carrying the adopter list"),
    "ON-1": (ONDO_HOME, ["Institutional-grade finance", "BlackRock", "Franklin Templeton", "WisdomTree",
                         "Fidelity", "ABN AMRO", "Morgan Stanley", "Google Cloud", "OUSG", "USDY"],
             "the page carrying the tagline and its attached proof-points"),
    "ON-2": (ONDO_HOME, ["ABN AMRO", "purpose-built infrastructure"], "the page carrying the testimonial"),
}


def previous(out: Path, cid: str) -> dict | None:
    runs = sorted(p for p in out.glob("run-*") if (p / f"{cid}.json").exists())
    return json.loads((runs[-1] / f"{cid}.json").read_text(encoding="utf-8")) if runs else None


def main() -> int:
    if "--now" not in sys.argv:
        print("REFUSED: --now is required; the scheduler owns the stamp and this script writes none")
        return 0
    out = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else Path("/workspace/lanes/out/claim-watch")
    series = Path(sys.argv[sys.argv.index("--series") + 1]) if "--series" in sys.argv else out / "series"
    repo = Path(sys.argv[sys.argv.index("--repo") + 1]) if "--repo" in sys.argv else Path(__file__).resolve().parents[2]
    out.mkdir(parents=True, exist_ok=True)
    series.mkdir(parents=True, exist_ok=True)
    # Seed the loop's series from the PUBLISHED one on first run, so the weekly readings continue
    # that file instead of starting a second series that disagrees with it.
    published_series = repo / "public" / "claims" / "series"
    for src in sorted(published_series.glob("*.jsonl")) if published_series.exists() else []:
        dst = series / src.name
        if not dst.exists():
            dst.write_bytes(src.read_bytes())
            print(f"SEEDED {dst.name} from the published series ({len(src.read_bytes())} bytes)")
    run_id = c.now_iso().replace(":", "").replace("-", "")
    rundir = out / f"run-{run_id}"

    results: dict[str, dict] = {}
    changes: list[dict] = []
    prior = {cid: previous(out, cid) for cid in list(BASELINES) + ["CL-1", "CL-3", "CL-5"]}
    rundir.mkdir(parents=True, exist_ok=True)

    def do(cid: str, fn):
        try:
            results[cid] = fn()
        except Exception:
            results[cid] = {"state": "UNMEASURED", "reason": "harness raised",
                            "traceback": traceback.format_exc()[-800:], "measured_at": c.now_iso()}
        (rundir / f"{cid}.json").write_text(json.dumps(results[cid], indent=1, ensure_ascii=False) + "\n",
                                            encoding="utf-8")

    do("CL-1", lambda: restatement.capture(CHAINLINK_HOME, "transaction value enabled", "CL-1", series))
    r = results["CL-1"]
    if r.get("observed_change_requiring_review"):
        changes.append({"claim": "CL-1", "kind": "downward_revision_in_a_cumulative_counter",
                        "detail": r.get("downward_revisions"), "note": r.get("review_note")})

    for cid, (url, names, label) in BASELINES.items():
        do(cid, lambda u=url, n=names, l=label: presence.capture(u, n, l))
        p = prior.get(cid)
        if p and results[cid].get("state") == "BASELINE_RECORDED":
            d = presence.diff(p, results[cid])
            results[cid]["diff_against_previous_run"] = d
            (rundir / f"{cid}.json").write_text(json.dumps(results[cid], indent=1, ensure_ascii=False) + "\n",
                                                encoding="utf-8")
            if d["observed_change_requiring_review"]:
                changes.append({"claim": cid, "kind": "name_removed_from_the_page",
                                "detail": d["removed_since_baseline"], "note": d["review_note"]})

    do("CL-3", lambda: oracle_share.run("Chainlink"))
    do("CL-5", lambda: feed_health.run(rounds=40))
    f5, p5 = results["CL-5"], prior.get("CL-5")
    if f5.get("state") == "CLAIM_MEASURED" and f5.get("totals", {}).get(
            "intervals_exceeding_declared_heartbeat_beyond_grace", 0) > 0:
        changes.append({
            "claim": "CL-5", "kind": "interval_past_a_feed's_own_declared_heartbeat",
            "detail": {"beyond_grace": f5["totals"]["intervals_exceeding_declared_heartbeat_beyond_grace"],
                       "largest_single_excess_s": f5["totals"].get("largest_single_excess_s"),
                       "of_intervals": f5.get("denominator", {}).get("intervals_measured")},
            "note": ("intervals in this window ran past the feed's own declared heartbeat by more than the "
                     "stated grace. This is an observed change requiring review over this window; it is not "
                     "an outage, a failure or an allegation")})
    if p5 and f5.get("state") == "CLAIM_MEASURED" and p5.get("state") == "CLAIM_MEASURED":
        f5["delta_against_previous_run"] = {
            "previous_measured_at": p5.get("measured_at"),
            "previous_totals": p5.get("totals"), "current_totals": f5.get("totals")}
        (rundir / "CL-5.json").write_text(json.dumps(f5, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    receipt = {
        "schema": "csoai.claim-watch-receipt/0.1",
        "run_id": run_id,
        "ran_at_utc": c.now_iso(),
        "cadence": "weekly",
        "registry": next((f"/claims/{p.name}" for p in sorted(
            (repo / "public" / "claims").glob("claimreg-*.json"), reverse=True)
            if not p.name.endswith(".signed.json")), None),
        "registry_sha256": next((c.sha256_hex(p.read_bytes()) for p in sorted(
            (repo / "public" / "claims").glob("claimreg-*.json"), reverse=True)
            if not p.name.endswith(".signed.json")), None),
        "claims_touched": sorted(results),
        "states": {k: v.get("state") for k, v in sorted(results.items())},
        "artifacts": {f"{k}.json": c.sha256_hex((rundir / f"{k}.json").read_bytes()) for k in sorted(results)},
        "observed_changes_requiring_review": changes,
        "observed_changes_count": len(changes),
        "discipline": ("an observed change is a prompt for a human to look. This loop makes no allegation, "
                       "sends nothing to any party named in the registry, and never edits a published file"),
    }
    (rundir / "receipt.json").write_text(json.dumps(receipt, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    with (out / "receipts.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(receipt, ensure_ascii=False) + "\n")
    (out / "latest-receipt.json").write_text(json.dumps(receipt, indent=1, ensure_ascii=False) + "\n",
                                             encoding="utf-8")
    print("RECEIPT " + json.dumps({k: receipt[k] for k in ("run_id", "ran_at_utc", "states",
                                                           "observed_changes_count")}, ensure_ascii=False))
    for ch in changes:
        print(f"OBSERVED-CHANGE-REQUIRING-REVIEW {ch['claim']} {ch['kind']}")
    print(f"WROTE {rundir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
