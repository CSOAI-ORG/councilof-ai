"""Tests for meek-defoneos-cold-email-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_cold_email_mcp.server import cold_emails_list, cold_email_get, cold_email_send, cold_email_metrics, cold_emails_status

def test_cold_emails_list():
    r = cold_emails_list()
    assert r["count"] == 12
    assert r["total_addresses"] == 12
    print(f"✅ test_list: {r['count']} cold emails ready")

def test_cold_email_get():
    r = cold_email_get()
    assert r["length_words"] >= 150
    assert "DEFONEOS" in r["subject"]
    assert "DEFONEOS-SEAL" in r["body"]
    print(f"✅ test_get: {r['target']} ({r['length_words']} words)")

def test_cold_email_send():
    r = cold_email_send()
    assert r["approval_required"] is True
    print(f"✅ test_send: {r['send_status']} (approval_required={r['approval_required']})")

def test_cold_email_metrics():
    r = cold_email_metrics()
    assert r["total_emails"] == 12
    assert r["year_3_arr_potential_gbp"] == 12000000
    print(f"✅ test_metrics: £{r['year_3_arr_potential_gbp']} Year 3 ARR potential")

def test_cold_emails_status():
    r = cold_emails_status()
    assert r["ready_to_send"] == 12
    print(f"✅ test_status: {r['ready_to_send']} ready, blocked on user approval")

if __name__ == "__main__":
    test_cold_emails_list()
    test_cold_email_get()
    test_cold_email_send()
    test_cold_email_metrics()
    test_cold_emails_status()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-cold-email-mcp v1.0.0 is sovereign. 12 cold emails ready.")