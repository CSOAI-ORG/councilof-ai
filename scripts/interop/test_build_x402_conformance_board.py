import importlib.util
from pathlib import Path
from unittest.mock import patch

MODULE_PATH = Path(__file__).with_name("build_x402_conformance_board.py")
SPEC = importlib.util.spec_from_file_location("x402_board", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def test_snapshot_has_one_row_per_discovered_door_and_no_ranking():
    discovery = {"resources": [{"url": "https://example.test/free"}, {"url": "https://example.test/paid"}]}
    challenges = {
        "https://example.test/free": (402, {"accepts": [{"network": "eip155:8453", "amount": "0", "extra": {"name": "USDC"}}], "extensions": {"bazaar": {}}}),
        "https://example.test/paid": (402, {"accepts": [{"network": "eip155:8453", "amount": "10000", "extra": {"name": "USDC"}}], "extensions": {"bazaar": {}}}),
    }

    def fake_get(url):
        return (200, discovery) if url.endswith("x402.json") else challenges[url]

    with patch.object(MODULE, "get_json", side_effect=fake_get):
        snapshot = MODULE.build("https://example.test/x402.json", "2026-09-14T11:22:00Z")

    assert snapshot["summary"] == {"doors_observed": 2, "doors_conforming": 2}
    assert [row["amount_atomic"] for row in snapshot["doors"]] == ["0", "10000"]
    assert "rankings" not in snapshot
    assert snapshot["observed_at"] == "2026-09-14T11:22:00Z"
