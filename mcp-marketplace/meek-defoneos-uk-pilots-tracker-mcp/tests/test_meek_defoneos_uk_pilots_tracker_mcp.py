"""Tests for meek-defoneos-uk-pilots-tracker-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_defoneos_uk_pilots_tracker_mcp.server import pilots_list, pilot_get, pilot_metrics, pilot_status_update, pilots_overview

def test_pilots_list():
    r = pilots_list()
    assert r["count"] == 7
    assert r["total_potential_arr_gbp"] >= 12000000
    print(f"✅ test_list: {r['count']} UK pilots, £{r['total_potential_arr_gbp']} potential ARR")

def test_pilot_get():
    r = pilot_get(pilot_id="pilot_001")
    assert r["id"] == "pilot_001"
    assert r["status"] == "COLD_EMAIL_READY"
    print(f"✅ test_get: {r['prime']} ({r['sector']})")

def test_pilot_metrics():
    r = pilot_metrics()
    assert r["total_pilots"] == 7
    assert r["cold_email_ready"] == 7
    print(f"✅ test_metrics: {r['cold_email_ready']}/7 cold emails ready")

def test_pilot_status_update():
    r = pilot_status_update(pilot_id="pilot_001", new_status="MEETING_BOOKED")
    assert r["new_status"] == "MEETING_BOOKED"
    print(f"✅ test_update: {r['pilot_id']} -> {r['new_status']}")

def test_pilots_overview():
    r = pilots_overview()
    assert r["total_pilots"] == 7
    print(f"✅ test_overview: {r['name']} (£{r['year_3_arr_forecast_gbp']} Year 3 forecast)")

if __name__ == "__main__":
    test_pilots_list()
    test_pilot_get()
    test_pilot_metrics()
    test_pilot_status_update()
    test_pilots_overview()
    print("\n🎉 ALL 5 TESTS PASSED — meek-defoneos-uk-pilots-tracker-mcp v1.0.0 is sovereign. 7 UK pilots tracked.")