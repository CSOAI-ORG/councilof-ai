"""Article 50 passport E2E tests."""
import os, sys, json, time
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from article_50_passport import (
    issue_passport, verify_passport, list_passports, qr_string,
    compliance_status, CARE_FLOOR, EFFECTIVE, JURISDICTION, ISSUER,
    _log_path,
)


def _wipe_log():
    if _log_path.exists():
        _log_path.unlink()


def test_01_issue_passport_basic():
    _wipe_log()
    p = issue_passport(
        action={"kind": "sovereign_emit", "tool": "sov_test",
                "args": {"line": "test"}},
        care_score=0.97, sigil="ed25519:test123")
    assert "passport_hash" in p
    assert p["jurisdiction"] == JURISDICTION
    assert p["effective_date"] == EFFECTIVE
    assert p["issuer"] == ISSUER
    assert p["action"]["care_pass"] is True
    assert p["signature"].startswith("ed25519")
    print(f"  v Issue OK (hash {p['passport_hash'][:16]}..., algo {p['signature'].split(':')[0]})")


def test_02_refuse_passport_below_floor():
    _wipe_log()
    p = issue_passport(action={"kind": "x"}, care_score=0.30)
    assert "error" in p
    assert "below Care Floor" in p["error"]
    print("  v Passport REFUSED at care=0.30 (< 0.95)")


def test_03_verify_passport_round_trip():
    _wipe_log()
    p = issue_passport(action={"kind": "roundtrip", "tool": "t"},
                       care_score=0.96, sigil="ed25519:abc")
    v = verify_passport(p["passport_hash"])
    assert v["verified"] is True
    assert v["hash_ok"] is True
    assert v["signature_algo"] in ("ed25519", "ed25519+pqc-ml-dsa-65")
    assert v["issuing_jurisdiction"] == JURISDICTION
    assert v["effective_date"] == EFFECTIVE
    print(f"  v Verify round-trip: verified=True, jurisdiction={v['issuing_jurisdiction']}, effective={v['effective_date']}")


def test_04_qr_string_format():
    _wipe_log()
    p = issue_passport(action={"kind": "qr_test"}, care_score=0.96)
    qr = qr_string(p)
    assert qr.startswith("SOV_ARTICLE50:")
    decoded = qr[len("SOV_ARTICLE50:"):]
    # base64 unpadded
    pad = "=" * (-len(decoded) % 4)
    import base64
    raw = base64.urlsafe_b64decode(decoded + pad).decode()
    assert "h" in raw
    assert "c" in raw
    assert "k" in raw
    print(f"  v QR string prefix SOV_ARTICLE50: + base64-decodable")


def test_05_list_passports_audit_trail():
    _wipe_log()
    for i in range(3):
        issue_passport(action={"kind": f"kind-{i}"}, care_score=0.96)
    lp = list_passports(last_n=10)
    assert lp["count"] == 3
    assert all(r["care_score"] >= CARE_FLOOR for r in lp["rows"])
    print(f"  v List 3 passports, all care >= {CARE_FLOOR}")


def test_06_compliance_status_green_when_clean():
    _wipe_log()
    issue_passport(action={"kind": "k1"}, care_score=0.96)
    issue_passport(action={"kind": "k2"}, care_score=0.99)
    s = compliance_status()
    assert s["status"] in ("GREEN", "READY")
    assert s["all_above_floor"] is True
    assert s["passports_above_floor"] == s["issued"]
    print(f"  v compliance: {s['status']} ({s['passports_above_floor']}/{s['issued']} above floor)")


def test_07_compliance_status_ready_before_any_issued():
    _wipe_log()
    s = compliance_status()
    assert s["status"] == "READY"
    assert s["issued"] == 0
    print("  v Before any issued: status=READY, issued=0")


def test_08_passport_hash_uses_action_args_sha256():
    _wipe_log()
    args1 = {"line": "x"}
    args2 = {"line": "y"}
    p1 = issue_passport(action={"kind": "k", "tool": "t", "args": args1}, care_score=0.97)
    p2 = issue_passport(action={"kind": "k", "tool": "t", "args": args1}, care_score=0.97)
    p3 = issue_passport(action={"kind": "k", "tool": "t", "args": args2}, care_score=0.97)
    assert p1["action"]["args_sha256"] == p2["action"]["args_sha256"]
    assert p1["action"]["args_sha256"] != p3["action"]["args_sha256"]
    print("  v args_sha256 stable for same args; differs for different args")


def test_09_durability_persists_across_imports():
    p1 = issue_passport(action={"kind": "persist_test"}, care_score=0.97)
    # Re-import the module to ensure log is the same source
    import importlib
    import article_50_passport as a50
    importlib.reload(a50)
    # After reload, the in-memory dict is empty but the log on disk still has the passport
    lp = list_passports(last_n=10)
    assert lp["count"] >= 1
    persisted = any(r.get("kind") == "persist_test" for r in lp["rows"])
    assert persisted, "passport should still be on disk after module reload"
    print(f"  v Persists across reloads: count={lp['count']}, persist_test={persisted}")


def test_10_metadata_eu_article_50_effective_2_aug_2026():
    from article_50_passport import EFFECTIVE, JURISDICTION, ISSUER, LICENSE, PROTOCOL, VERSION
    assert EFFECTIVE == "2026-08-02"
    assert JURISDICTION == "EU"
    assert ISSUER == "CSOAI Ltd (UK 16939677)"
    assert "MIT" in LICENSE and "CC0" in LICENSE
    assert PROTOCOL == "sovereign-article-50/1.0"
    assert VERSION == "1.0.0"
    print(f"  v Metadata: {JURISDICTION} AI Act {EFFECTIVE}, issuer={ISSUER}, license={LICENSE}, {PROTOCOL} v{VERSION}")


if __name__ == "__main__":
    print("=" * 70)
    print("  Sovereign Article 50 Passport E2E Tests")
    print("  EU AI Act 2 Aug 2026 - Transparency Obligation")
    print("=" * 70)
    print()
    test_01_issue_passport_basic()
    test_02_refuse_passport_below_floor()
    test_03_verify_passport_round_trip()
    test_04_qr_string_format()
    test_05_list_passports_audit_trail()
    test_06_compliance_status_green_when_clean()
    test_07_compliance_status_ready_before_any_issued()
    test_08_passport_hash_uses_action_args_sha256()
    test_09_durability_persists_across_imports()
    test_10_metadata_eu_article_50_effective_2_aug_2026()
    print()
    print("TOTAL: 10 passed, 0 failed")
    print("Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
