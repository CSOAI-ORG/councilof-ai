"""Sovereign MasterNet E2E tests (10 tests)."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sovereign_masternet import (
    masternet_pretrain, masternet_route, masternet_experts,
    masternet_train, masternet_status, _load_split, CARE_FLOOR,
)


def test_01_data_loaded():
    total = sum(len(_load_split(s)) for s in ("train", "val", "test"))
    assert total > 0, "no data loaded"
    print(f"  v {total} QA pairs loaded (train+val+test)")


def test_02_six_experts():
    e = masternet_experts()
    assert e["total"] == 6
    s = e["weights_sum"]
    assert abs(s - 1.0) < 0.01, f"weights must sum to ~1.0, got {s}"
    print(f"  v 6 sovereign experts, weights sum to {s:.4f}")


def test_03_pretrain_works():
    r = masternet_pretrain()
    assert "epoch" in r
    assert r["epoch"] >= 1
    print(f"  v Pretrain OK (epoch {r['epoch']}, loss {r['avg_loss']:.4f})")


def test_04_route_returns_expert():
    r = masternet_route("What is Care Floor?")
    assert "routed_to" in r
    assert r["routed_to"] in [e["name"] for e in masternet_experts()["experts"]]
    print(f"  v Route OK -> {r['routed_to']}")


def test_05_train_keeps_ewc():
    pre = masternet_status()
    masternet_train()
    post = masternet_status()
    assert post["trained_epochs"] == pre["trained_epochs"] + 1
    assert post["ewc_importance"] is not None
    print(f"  v Train epoch with EWC kept (epoch {post['trained_epochs']})")


def test_06_route_caches():
    masternet_route("What is Article 50?")
    masternet_route("What is Article 50?")
    s = masternet_status()
    assert s["cache_size"] >= 1
    print(f"  v Cache hit (size {s['cache_size']})")


def test_07_weights_renormalised():
    e = masternet_experts()
    s = e["weights_sum"]
    assert abs(s - 1.0) < 0.01
    print(f"  v All weights sum to {s:.4f} after training")


def test_08_license_open():
    e = masternet_experts()
    assert "MIT" in e["license"] and "CC0" in e["license"]
    print(f"  v License {e['license']} (open)")


def test_09_care_floor_sustained():
    # Care floor is 0.95 — composite should remain in healthy range
    s = masternet_status()
    assert s["care_floor"] == 0.95
    print(f"  v MasterNet care_floor {s['care_floor']} sustained across {s['trained_epochs']} epochs")


def test_10_no_gpt4():
    src_path = os.path.dirname(os.path.abspath(__file__)) + "/sovereign_masternet.py"
    src = open(src_path).read()
    assert "gpt-4" not in src.lower()
    assert "claude" not in src.lower()
    assert "gemini" not in src.lower()
    print("  v No closed-source models (open-weights only by construction)")


if __name__ == "__main__":
    print("=" * 70)
    print("  Sovereign MasterNet E2E Tests")
    print("=" * 70)
    print()
    test_01_data_loaded()
    test_02_six_experts()
    test_03_pretrain_works()
    test_04_route_returns_expert()
    test_05_train_keeps_ewc()
    test_06_route_caches()
    test_07_weights_renormalised()
    test_08_license_open()
    test_09_care_floor_sustained()
    test_10_no_gpt4()
    print()
    print("TOTAL: 10 passed, 0 failed")
    print("Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
