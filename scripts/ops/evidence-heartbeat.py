#!/usr/bin/env python3
"""Read-only Council evidence heartbeat.

This is a *consistency and freshness observer*, not an independent proof of
measurements, model superiority, payments, approvals or delivery. It never
signs, publishes, pays, dispatches agents or mutates production state.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import pathlib
import sys
import urllib.error
import urllib.request

SOURCES = {
    "board": "https://councilof.ai/api/gspc",
    "root": "https://councilof.ai/root.json",
    "distribution": "https://councilof.ai/interop/distribution-latest.json",
    "revenue": "https://councilof.ai/api/revenue",
}
UA = "CSOAI-evidence-heartbeat/0.1 (+https://councilof.ai/methodology/)"
UTC = dt.timezone.utc


def parse_utc(value):
    if not isinstance(value, str):
        return None
    try:
        parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(UTC) if parsed.tzinfo else None
    except ValueError:
        return None


def read_source(name, *, fixture_dir=None):
    url = SOURCES[name]
    try:
        if fixture_dir is not None:
            raw = (pathlib.Path(fixture_dir) / (name + ".json")).read_bytes()
            status = 200
        else:
            request = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(request, timeout=12) as response:
                status = response.status
                raw = response.read(8_000_001)
                if len(raw) > 8_000_000:
                    raise ValueError("response exceeds 8 MB")
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("expected a JSON object")
        return {"state": "READ", "http_status": status,
                "url": url, "sha256": hashlib.sha256(raw).hexdigest(),
                "payload": payload}
    except (OSError, urllib.error.URLError, ValueError, json.JSONDecodeError) as exc:
        status = exc.code if isinstance(exc, urllib.error.HTTPError) else None
        return {"state": "UNCHECKABLE", "http_status": status,
                "url": url, "reason": str(exc)[:240]}


def assess(observations, *, now=None):
    now = now or dt.datetime.now(UTC)
    checks = {}
    metrics = {}
    failures = []
    unknown = []
    stale = []

    def record(key, state, detail, *, failure=False):
        checks[key] = {"state": state, "detail": detail}
        if failure:
            failures.append(key)
        elif state == "STALE":
            stale.append(key)
        elif state in ("UNCHECKABLE", "NOT_EVALUATED"):
            unknown.append(key)

    def payload(name):
        observation = observations.get(name, {})
        if observation.get("state") != "READ":
            record(name + "_source", "UNCHECKABLE",
                   observation.get("reason", "source did not return validated JSON"))
            return None
        return observation["payload"]

    board = payload("board")
    if board is not None:
        axes = board.get("axes")
        totals = board.get("totals")
        if not isinstance(axes, list) or not isinstance(totals, dict):
            record("board_consistency", "FAIL", "missing axis roster or totals", failure=True)
        else:
            measured = sum(row.get("status") == "MEASURED" for row in axes if isinstance(row, dict))
            comparisons = [row for row in axes if isinstance(row, dict) and row.get("kind") == "model-comparison"]
            states = {s: sum(row.get("separation") == s for row in comparisons)
                      for s in ("TIE", "UNTESTED", "SEPARATED")}
            expected = (len(axes) == totals.get("axes")
                        and measured == totals.get("measured_axes")
                        and len(axes) - measured == totals.get("unmeasured_axes")
                        and len(comparisons) == totals.get("comparison_axes")
                        and states["TIE"] == totals.get("ties")
                        and states["UNTESTED"] == totals.get("untested_separations")
                        and states["SEPARATED"] == totals.get("separated_leads"))
            metrics["board"] = {
                "declared_axes": len(axes), "measured_axes": measured,
                "comparison_axes": len(comparisons), "separation": states,
                "limitation": "A published historical run is not a continuous production remeasurement."
            }
            record("board_consistency", "OBSERVED_CONSISTENT" if expected else "FAIL",
                   "counts independently recomputed from the published axis roster",
                   failure=not expected)

    root = payload("root")
    if root is not None:
        hashes = root.get("card_sha256")
        count = root.get("card_count")
        merkle = root.get("merkle_root")
        valid = (isinstance(hashes, list) and isinstance(count, int)
                 and count == len(hashes)
                 and isinstance(merkle, str) and len(merkle) == 64
                 and all(isinstance(h, str) and len(h) == 64 for h in hashes))
        metrics["root"] = {"as_of": root.get("as_of"),
                           "leaf_count": count,
                           "signature_present": bool(root.get("sig_ed25519")),
                           "signature_verified": False,
                           "inclusion_proofs_verified": False}
        record("root_internal_consistency", "OBSERVED_CONSISTENT" if valid else "FAIL",
               "structural check only; signatures, inclusion and Bitcoin witness NOT verified",
               failure=not valid)
        record("root_crypto_verification", "NOT_EVALUATED",
               "use pinned DID, exact-byte signature, inclusion path and independent witness verifier")

    distribution = payload("distribution")
    if distribution is not None:
        deadline = parse_utc(distribution.get("stale_after"))
        all_time = distribution.get("by_entity", {}).get("downloads_all_time", {})
        metrics["distribution"] = {
            "as_of": distribution.get("as_of"),
            "stale_after": distribution.get("stale_after"),
            "by_entity_all_time": {
                entity: {k: row.get(k) for k in ("value", "state", "covered", "attempted")}
                for entity in ("csoai", "meok")
                for row in [all_time.get(entity, {})] if isinstance(row, dict)
            },
            "limitation": "Gross registry download events; not unique users, execution or adoption. Entities must not be added."
        }
        if not all(isinstance(all_time.get(entity), dict) and isinstance(all_time[entity].get("value"), int) and all_time[entity].get("state") in ("READ", "PARTIAL") for entity in ("csoai", "meok")):
            record("distribution_entity_scope", "UNCHECKABLE", "missing separate labelled CSOAI/MEOK populations or source states")
        else:
            record("distribution_entity_scope", "OBSERVED", "two entity populations retained separately, with READ/PARTIAL states")
        if deadline is None:
            record("distribution_freshness", "UNCHECKABLE", "missing/invalid UTC stale_after")
        elif now >= deadline:
            record("distribution_freshness", "STALE", "census exceeded publisher's stale_after")
        else:
            record("distribution_freshness", "CURRENT_AS_PUBLISHED", "within publisher's stated freshness window")

    revenue = payload("revenue")
    if revenue is not None:
        receipt = revenue.get("settled_usdc")
        if isinstance(receipt, dict) and isinstance(receipt.get("count"), int):
            metrics["revenue"] = {
                "settled_usdc_atomic": receipt["count"],
                "state": receipt.get("status"),
                "limitation": "Not evidence of named customers, delivered artifacts, buyer acceptance or repeat use."
            }
            record("revenue_scope", "OBSERVED", "self-described non-self settlement aggregate; chain independently unverified")
        else:
            record("revenue_scope", "UNCHECKABLE", "no counted settled_usdc measure")

    for name, detail in {
        "real_human_authority": "Requires authenticated newly authorised human approval, not a WG listing.",
        "qualified_executor": "Requires current capability and bound policy receipt.",
        "independent_effect_witness": "Requires independently observed permitted side effect.",
        "receiving_party_acceptance": "Requires receiving-party acknowledgement tied to artifact digest.",
        "continuous_34_axis_production": "Requires dated repeat runs per axis after deployed changes.",
        "meok_private_health": "Private fleet not queried by this public-only observer.",
    }.items():
        record(name, "NOT_EVALUATED", detail)

    if failures:
        rollup = "FAILED_INVARIANTS"
    elif any(k.endswith("_source") for k in unknown):
        rollup = "UNCHECKABLE_SOURCES"
    elif stale:
        rollup = "STALE_SOURCES"
    else:
        rollup = "OBSERVATIONS_ONLY_WITH_OPEN_GATES"
    return {"schema": "csoai.operational-heartbeat/0.1",
            "generated_at": now.isoformat().replace("+00:00", "Z"),
            "rollup": rollup,
            "observations": {name: {k: v for k, v in item.items() if k != "payload"}
                             for name, item in observations.items()},
            "metrics": metrics, "checks": checks,
            "failed_invariants": failures, "stale_sources": stale,
            "open_or_uncheckable_gates": unknown,
            "disclaimer": "No runtime execution, external acceptance, legal conformity, signature or source accuracy is certified by this report."}


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="out/operational-heartbeat.json")
    parser.add_argument("--fixture-dir", help="offline JSON fixtures; no network access")
    parser.add_argument("--fail-on-invariant", action="store_true")
    args = parser.parse_args(argv)
    observations = {name: read_source(name, fixture_dir=args.fixture_dir)
                    for name in SOURCES}
    report = assess(observations)
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"rollup": report["rollup"],
                      "failed_invariants": report["failed_invariants"],
                      "open_or_uncheckable_gates": report["open_or_uncheckable_gates"],
                      "artifact": str(out)}))
    return 2 if args.fail_on_invariant and (report["failed_invariants"] or report["stale_sources"]) else 0


if __name__ == "__main__":
    sys.exit(main())
