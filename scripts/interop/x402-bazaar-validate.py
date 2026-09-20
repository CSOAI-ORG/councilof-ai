#!/usr/bin/env python3
"""Validate every declared CSOAI x402 door with Coinbase CDP's read-only validator.

No payment is signed or settled and this does not create a Bazaar listing.  The output
separates protocol validity, simulation acceptance, and observed index state.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Callable

MANIFEST_URL = "https://councilof.ai/.well-known/x402.json"
VALIDATOR_URL = "https://api.cdp.coinbase.com/platform/v2/x402/validate"
OUT = Path("docs/product/X402-BAZAAR-VALIDATION.json")
UA = "csoai-bazaar-validation/0.1 (+https://councilof.ai/interop/)"
JsonRequest = Callable[[str, str, dict[str, Any] | None, int], Any]


def request_json(url: str, method: str, body: dict[str, Any] | None, timeout: int) -> Any:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"accept": "application/json", "content-type": "application/json", "user-agent": UA},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.load(response)


def declared_resources(manifest: dict[str, Any]) -> list[str]:
    rows = manifest.get("resources")
    if not isinstance(rows, list):
        raise ValueError("manifest has no resources[]")
    urls = [row.get("url") for row in rows if isinstance(row, dict)]
    if not urls or not all(isinstance(url, str) and url.startswith("https://") for url in urls):
        raise ValueError("manifest contains no complete https resource URLs")
    if len(urls) != len(set(urls)):
        raise ValueError("manifest contains duplicate resource URLs")
    return urls


def validate_all(
    manifest_url: str = MANIFEST_URL,
    validator_url: str = VALIDATOR_URL,
    *,
    requester: JsonRequest = request_json,
    timeout: int = 30,
) -> dict[str, Any]:
    manifest = requester(manifest_url, "GET", None, timeout)
    resources = declared_resources(manifest)
    results = []
    for resource in resources:
        try:
            response = requester(
                validator_url,
                "POST",
                {"resource": resource, "method": "GET"},
                timeout,
            )
            if not isinstance(response, dict):
                raise ValueError("validator response is not an object")
            preflight = response.get("preflight")
            failed = []
            if isinstance(preflight, list):
                failed = [
                    check.get("check")
                    for check in preflight
                    if isinstance(check, dict) and check.get("severity") == "required" and check.get("passed") is not True
                ]
            simulation = response.get("simulation") if isinstance(response.get("simulation"), dict) else {}
            requirements = response.get("paymentRequirements")
            accepts = requirements.get("accepts") if isinstance(requirements, dict) else None
            first_accept = accepts[0] if isinstance(accepts, list) and accepts and isinstance(accepts[0], dict) else {}
            results.append(
                {
                    "resource": resource,
                    "valid": response.get("valid") is True,
                    "simulation_outcome": simulation.get("outcome"),
                    "index": response.get("index"),
                    "network": first_accept.get("network"),
                    "asset": first_accept.get("asset"),
                    "amount_atomic": first_accept.get("amount"),
                    "pay_to": first_accept.get("payTo"),
                    "required_checks": sum(
                        1 for check in preflight or []
                        if isinstance(check, dict) and check.get("severity") == "required"
                    ),
                    "failed_required_checks": failed,
                }
            )
        except (urllib.error.URLError, ValueError, json.JSONDecodeError) as exc:
            results.append(
                {
                    "resource": resource,
                    "valid": None,
                    "simulation_outcome": "UNCHECKABLE",
                    "index": None,
                    "required_checks": None,
                    "failed_required_checks": [],
                    "error": f"{type(exc).__name__}: {exc}",
                }
            )
    totals: dict[str, int] = {}
    for row in results:
        amount = row.get("amount_atomic")
        asset = row.get("asset")
        network = row.get("network")
        if isinstance(amount, str) and amount.isdigit() and isinstance(asset, str) and isinstance(network, str):
            key = f"{network}:{asset}"
            totals[key] = totals.get(key, 0) + int(amount)
    return {
        "schema": "csoai.x402-bazaar-validation/0.1",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "manifest": manifest_url,
        "validator": validator_url,
        "declared": len(resources),
        "valid": sum(row["valid"] is True for row in results),
        "accepted": sum(row["simulation_outcome"] == "accepted" for row in results),
        "indexed": sum(row["index"] not in (None, False, "") for row in results),
        "one_validation_payment_each_atomic_by_network_asset": totals,
        "results": results,
        "not_proof_of": ["listing creation", "settlement", "revenue", "demand"],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default=MANIFEST_URL)
    parser.add_argument("--validator", default=VALIDATOR_URL)
    parser.add_argument("--json", action="store_true", help="print only; do not write the report")
    args = parser.parse_args()
    report = validate_all(args.manifest, args.validator)
    rendered = json.dumps(report, indent=2) + "\n"
    if args.json:
        print(rendered, end="")
    else:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(rendered)
        print(
            f"wrote {OUT}: {report['valid']}/{report['declared']} valid, "
            f"{report['accepted']} accepted, {report['indexed']} indexed"
        )
    return 0 if report["valid"] == report["declared"] else 2


if __name__ == "__main__":
    sys.exit(main())
