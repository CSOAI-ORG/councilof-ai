#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import urllib.parse
from pathlib import Path

SCRIPT = Path(__file__).parent / "interop" / "x402-bazaar-audit.py"
SPEC = importlib.util.spec_from_file_location("x402_bazaar_audit", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def paged_fetch(pages):
    def fetch(url: str, _timeout: int):
        offset = int(dict(urllib.parse.parse_qsl(urllib.parse.urlsplit(url).query))["offset"])
        value = pages[offset]
        if isinstance(value, Exception):
            raise value
        return value
    return fetch


def page(offset, total, items):
    return {"items": items, "pagination": {"limit": 2, "offset": offset, "total": total}, "x402Version": 2}


def test_complete_walk_uses_actual_page_length():
    fetch = paged_fetch({
        0: page(0, 3, [{"resource": "https://other.example/a"}, {"resource": "https://councilof.ai/api/a"}]),
        2: page(2, 3, [{"resource": "https://other.example/b"}]),
    })
    rows, total = MODULE.scan("https://index.example/resources", fetcher=fetch, page_size=2)
    assert total == 3
    assert len(rows) == 3


def test_exact_hostname_rejects_lookalikes():
    rows = [
        {"resource": "https://councilof.ai/api/a"},
        {"resource": "https://csoai.org/api/b"},
        {"resource": "https://councilof.ai.evil.example/api/c"},
        {"resource": "https://other.example/?next=https://councilof.ai/api/d"},
    ]
    assert [item["resource"] for item in MODULE.ours(rows)] == [
        "https://councilof.ai/api/a",
        "https://csoai.org/api/b",
    ]


def test_partial_read_refuses_absence():
    fetch = paged_fetch({
        0: page(0, 3, [{"resource": "https://other.example/a"}, {"resource": "https://other.example/b"}]),
        2: RuntimeError("offline"),
    })
    try:
        MODULE.scan("https://index.example/resources", fetcher=fetch, page_size=2, retries=0)
    except RuntimeError as exc:
        assert "offline" in str(exc)
    else:
        raise AssertionError("partial index read was accepted")


def test_malformed_total_fails_closed():
    try:
        MODULE.scan(
            "https://index.example/resources",
            fetcher=lambda _url, _timeout: {"items": [], "pagination": {"offset": 0, "total": "1"}},
            retries=0,
        )
    except ValueError as exc:
        assert "pagination.total" in str(exc)
    else:
        raise AssertionError("string total was accepted")


def test_manifest_coverage_separates_current_stale_and_missing():
    result = {
        "ours": [
            {"resource": "https://councilof.ai/api/a?x=1", "listing_disagrees_with_door": False},
            {"resource": "https://councilof.ai/api/b", "listing_disagrees_with_door": True},
        ]
    }
    MODULE.add_manifest_coverage(
        result,
        ["https://councilof.ai/api/a", "https://councilof.ai/api/b", "https://councilof.ai/api/c"],
    )
    assert result["manifest_indexed"] == 2
    assert result["manifest_current"] == ["https://councilof.ai/api/a"]
    assert result["manifest_stale"] == ["https://councilof.ai/api/b"]
    assert result["manifest_missing"] == ["https://councilof.ai/api/c"]


if __name__ == "__main__":
    tests = [value for name, value in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
    print(f"PASS x402 Bazaar audit: {len(tests)}/{len(tests)}")
