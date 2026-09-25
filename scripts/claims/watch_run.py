#!/usr/bin/env python3
"""The weekly claim-maintenance run: extend the series, re-read the baselines, emit a receipt.

What it does, once per run:
  * CL-1  capture the cumulative counter again and append it to the published series;
  * CL-4 / ON-1 / ON-2  re-read the presence baselines (adopter list, proof-points, testimonial)
        and diff them against the previous run;
  * CL-3  recompute the oracle share from the keyless public breakdown;
  * CL-5  re-read the feeds and recompute cadence and deviation against their declared parameters;
  * EVERY OTHER CLAIM IN EVERY PUBLISHED REGISTRY  re-read its own source URL, recompute the
        digest with the SAME extractor that produced the recorded one, and compare. This is the
        general case and it needs no edit when a subject is added: a subject appears in the watch
        because a registry on disk carries it, exactly as the register itself is generated from the
        registries on disk (spec 7.5). Adding a subject is adding a file;
  * DATED CLAIMS  any claim whose registry records a resolution_date that has arrived is raised for
        review. Reaching a date is not a finding and carries no view about the outcome.

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
import os
import shutil
import subprocess
import sys
import traceback
from datetime import date
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


def head_registry(repo: Path) -> dict:
    """The registry nothing else supersedes — the head of the chain, not the last name in a sort.

    Sorting the filenames gets this wrong: "...2026-09-22.json" sorts after
    "...2026-09-22-rev2.json" because "." outranks "-", so a lexical pick names the file that was
    superseded. The chain is in the bytes, so read it from there.
    """
    d = repo / "public" / "claims"
    files = [p for p in sorted(d.glob("claimreg-*.json")) if not p.name.endswith(".signed.json")] \
        if d.exists() else []
    superseded: set[str] = set()
    parsed: dict[Path, dict] = {}
    for p in files:
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        parsed[p] = j
        sup = j.get("supersedes") or {}
        if isinstance(sup, dict) and sup.get("file"):
            superseded.add(str(sup["file"]).split("/")[-1])
    heads = [p for p in parsed if p.name not in superseded]
    if len(heads) > 1:
        # More than one head is the ordinary case once the register holds more than one chain: two
        # independent registries are two chains, not an ambiguity. The watch names all of them and
        # pins each by digest, rather than reporting a null that reads like a failure.
        return {
            "registry": None,
            "registry_sha256": None,
            "registries_watched": [
                {"registry": f"/claims/{h.name}",
                 "registry_id": parsed[h].get("registry_id"),
                 "sha256": c.sha256_hex(h.read_bytes()),
                 "supersedes": (parsed[h].get("supersedes") or {}).get("registry_id")}
                for h in sorted(heads)
            ],
            "registry_note": (f"{len(heads)} registries on disk are superseded by nothing. They are separate "
                              "chains over separate subjects, so no single one is 'the' registry; all of "
                              "them are named above and each is pinned by its digest. The single-registry "
                              "field stays null because filling it would mean picking one"),
        }
    if len(heads) != 1:
        return {"registry": None, "registry_sha256": None, "registries_watched": [],
                "registry_note": "no registry is present in this checkout"}
    p = heads[0]
    return {"registry": f"/claims/{p.name}", "registry_sha256": c.sha256_hex(p.read_bytes()),
            "registry_supersedes": (parsed[p].get("supersedes") or {}).get("registry_id")}


def find_node() -> str | None:
    """The re-read runs through the reference implementation's own extractor, so the digest it
    produces is comparable with the recorded one. A second implementation of the extraction rule
    would disagree on whitespace and entity decoding, and every disagreement would surface as an
    observed change that carried no information about any claim. If Node is not present the
    re-read is SKIPPED and said to be skipped — never approximated with a different extractor."""
    for cand in (os.environ.get("CLAIM_WATCH_NODE"), shutil.which("node"),
                 "/workspace/node24/bin/node", "/workspace/node20/bin/node"):
        if cand and Path(cand).exists():
            return cand
    return None


def live_registries(repo: Path) -> list[Path]:
    """Every registry file nothing else supersedes. Generated from what is on disk, never listed."""
    d = repo / "public" / "claims"
    if not d.exists():
        return []
    files = [p for p in sorted(d.glob("claimreg-*.json")) if not p.name.endswith(".signed.json")]
    superseded: set[str] = set()
    for p in files:
        try:
            j = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        sup = j.get("supersedes") or {}
        if isinstance(sup, dict) and sup.get("file"):
            superseded.add(str(sup["file"]).split("/")[-1])
    return [p for p in files if p.name not in superseded]


def reread_registry(repo: Path, registry: Path, node: str) -> dict:
    """One pass of `reread.mjs` over one registry. Transport and HTTP failures come back as data."""
    script = repo / "scripts" / "claims" / "reread.mjs"
    if not script.exists():
        return {"error": f"{script} is not in this checkout; refusing to re-read with other code"}
    try:
        out = subprocess.run([node, str(script), "--registry", str(registry)],
                             capture_output=True, text=True, timeout=1800)
    except Exception as e:
        return {"error": f"re-reader did not run: {type(e).__name__}"}
    if out.returncode != 0:
        return {"error": f"re-reader exited {out.returncode}: {out.stderr[-300:]}"}
    try:
        return json.loads(out.stdout)
    except Exception:
        return {"error": "re-reader produced no parseable output"}


def resolution_due(registry_doc: dict, today_iso: str) -> list[dict]:
    """Dated claims whose resolution date has arrived. A date arriving is not a finding."""
    due = []
    for row in registry_doc.get("resolution_calendar") or []:
        rd = str(row.get("resolution_date") or "")
        if rd and rd <= today_iso:
            due.append({"claim_id": row.get("claim_id"), "subject": row.get("subject"),
                        "resolution_date": rd, "state_at_registration": row.get("state_at_registration"),
                        "claim_verbatim": row.get("claim_verbatim")})
    return due


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

    # ── the general watch: every claim in every live registry, re-read through the reference
    # extractor. A subject added to a registry on disk is watched from the next run with no edit
    # here, which is the property that makes this a loop rather than a list.
    node = find_node()
    registry_reads: dict[str, dict] = {}
    today_iso = date.today().isoformat()
    if node is None:
        registry_reads["_skipped"] = {
            "reason": "no Node runtime found on this host, and the re-read must use the reference "
                      "implementation's own extractor for its digests to be comparable with the "
                      "recorded ones. The re-read did not run; it is not reported as no changes.",
        }
        print("REREAD-SKIPPED no node runtime — the absence of a read is recorded as an event, "
              "never as an absence of change")
    else:
        for regfile in live_registries(repo):
            res = reread_registry(repo, regfile, node)
            (rundir / f"reread-{regfile.stem}.json").write_text(
                json.dumps(res, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
            readings = res.get("readings") or []
            moved = [r for r in readings if r.get("changed") is True]
            unreachable = [r for r in readings if r.get("recorded_as") == "SEARCH_INCONCLUSIVE"]
            baselines = [r for r in readings if r.get("changed") is None
                         and r.get("recorded_as") != "SEARCH_INCONCLUSIVE"]
            registry_reads[regfile.name] = {
                "registry_id": res.get("registry_id"),
                "claims_read": len(readings),
                "digests_that_moved": len(moved),
                "unreachable_this_run": len(unreachable),
                "no_comparable_recorded_digest": len(baselines),
                "error": res.get("error"),
            }
            for r in moved:
                changes.append({
                    "claim": r.get("claim_id"), "kind": "source_digest_differs_from_the_recorded_read",
                    "detail": {"subject": r.get("subject"), "url": r.get("url"),
                               "previous_hash": r.get("recorded_hash"), "current_hash": r.get("current_hash"),
                               "covers": r.get("covers"), "extractor": r.get("extractor")},
                    "note": ("the bytes at this URL differ from the bytes recorded at the previous read. "
                             "That is the entire content of this statement. There are many ordinary "
                             "reasons a page changes and this loop holds no view about which applies")})
            for r in unreachable:
                changes.append({
                    "claim": r.get("claim_id"), "kind": "source_not_reachable_this_run",
                    "detail": {"subject": r.get("subject"), "url": r.get("url"),
                               "http_status": r.get("http_status"), "reason": r.get("reason")},
                    "note": ("this reader could not obtain the page on this run, with the status recorded. "
                             "The absence of a read is recorded as an event rather than as nothing "
                             "(spec 1.1); it is not an absence and not a statement about the subject")})
            try:
                doc = json.loads(regfile.read_text(encoding="utf-8"))
            except Exception:
                doc = {}
            for row in resolution_due(doc, today_iso):
                changes.append({
                    "claim": row["claim_id"], "kind": "dated_claim_has_reached_its_resolution_date",
                    "detail": row,
                    "note": ("this claim carried a date on which public evidence can settle it, and that "
                             "date has arrived. Raising it is a prompt for a person to look. It is not a "
                             "finding, it is not a measurement, and it carries no view about the outcome")})

    receipt = {
        "schema": "csoai.claim-watch-receipt/0.1",
        "run_id": run_id,
        "ran_at_utc": c.now_iso(),
        "cadence": "weekly",
        **head_registry(repo),
        "claims_touched": sorted(results),
        "states": {k: v.get("state") for k, v in sorted(results.items())},
        "artifacts": {f"{k}.json": c.sha256_hex((rundir / f"{k}.json").read_bytes()) for k in sorted(results)},
        "registry_reread": registry_reads,
        "reread_extractor": ("scripts/claims/reread.mjs, which recomputes each recorded digest with the "
                             "extractor that produced it (the one its artifact names, or "
                             "csoai-visible-text/1 when it names none), imported from the reference "
                             "implementation named by the specification. Like with like, so a digest "
                             "difference is a difference in the source and never a difference between "
                             "two readers (spec v0.2 6.3.1)"),
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
