#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
from pathlib import Path

SCRIPT = Path(__file__).parent / "interop" / "x402-bazaar-validate.py"
SPEC = importlib.util.spec_from_file_location("x402_bazaar_validate", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_declared_resources_rejects_duplicates():
    try:
        MODULE.declared_resources({"resources": [{"url": "https://e/a"}, {"url": "https://e/a"}]})
    except ValueError as exc:
        assert "duplicate" in str(exc)
    else:
        raise AssertionError("duplicate resource was accepted")


def test_validate_all_keeps_valid_accepted_and_indexed_separate():
    manifest = {"resources": [{"url": "https://councilof.ai/api/a"}, {"url": "https://councilof.ai/api/b"}]}

    def requester(url, method, body, _timeout):
        if method == "GET":
            return manifest
        if body["resource"].endswith("/a"):
            return {
                "valid": True,
                "simulation": {"outcome": "accepted"},
                "index": None,
                "paymentRequirements": {"accepts": [{"network": "eip155:8453", "asset": "0xUSDC", "amount": "1000", "payTo": "0xSeller"}]},
                "preflight": [{"check": "returns_402", "severity": "required", "passed": True}],
            }
        return {
            "valid": False,
            "simulation": {"outcome": "rejected"},
            "index": {"name": "example"},
            "paymentRequirements": {"accepts": [{"network": "eip155:8453", "asset": "0xUSDC", "amount": "2000", "payTo": "0xSeller"}]},
            "preflight": [{"check": "has_bazaar_extension", "severity": "required", "passed": False}],
        }

    report = MODULE.validate_all(requester=requester)
    assert report["declared"] == 2
    assert report["valid"] == 1
    assert report["accepted"] == 1
    assert report["indexed"] == 1
    assert report["one_validation_payment_each_atomic_by_network_asset"] == {"eip155:8453:0xUSDC": 3000}
    assert report["results"][0]["index"] is None
    assert report["results"][1]["failed_required_checks"] == ["has_bazaar_extension"]


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
    print(f"PASS x402 Bazaar validator: {len(tests)}/{len(tests)}")
