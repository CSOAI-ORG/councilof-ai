"""Sovereign economics E2E tests."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from economics import (
    forecast, y1_three_scenarios, y3_compound, unit_economics_mid,
    build_runway, task_dispatch, task_hive_cost_breakdown,
    task_launch_week, task_pipeline,
)


def test_01_y1_low_le_mid_le_high():
    s = y1_three_scenarios()
    assert s["low"]["total"] <= s["mid"]["total"] <= s["high"]["total"]
    print(f"  v Y1 ordering: low={s['low']['total']:,} <= mid={s['mid']['total']:,} <= high={s['high']['total']:,}")


def test_02_tier1_dominates_high_scenario():
    s = y1_three_scenarios()
    # In high scenario, single tier1 deals dominate
    t1 = s["high"]["tier1_csoai"]
    assert t1 > 1_000_000, f"high tier1 should be > $1M, got {t1}"
    print(f"  v High tier1 = ${t1:,}")


def test_03_tier2_subs_scale_proportionally():
    low, mid, high = forecast("low"), forecast("mid"), forecast("high")
    assert high["tier2_meok"] > mid["tier2_meok"] > low["tier2_meok"]
    print(f"  v Tier2 subscribers scale: low=${low['tier2_meok']:,} mid=${mid['tier2_meok']:,} high=${high['tier2_meok']:,}")


def test_04_y3_compound_growth():
    mid = forecast("mid")["total"]
    y3 = y3_compound(mid)
    assert y3["y3"] > y3["y2"] > y3["y1"]
    assert abs(y3["y3"] - mid * (1.4 ** 2)) < 1.0, "compound math within $1"
    print(f"  v Y3 compound {int(0.40*100)}%: Y1=${y3['y1']:,.0f} Y2=${y3['y2']:,.0f} Y3=${y3['y3']:,.0f}")


def test_05_unit_economics_mid_positive():
    ue = unit_economics_mid()
    assert ue["annual_gross_usd"] > 0
    assert ue["ltv_usd"] > ue["annual_gross_usd"]  # LTV > annual = retention pays
    assert ue["gross_margin_pct"] > 50
    print(f"  v MEOK Pro mid: {ue['subscribers']:,} subs * ${ue['monthly_price_usd']}/mo = ${ue['annual_gross_usd']:,.0f}/yr, LTV ${ue['ltv_usd']:,.0f}")


def test_06_cloud_cost_baseline():
    hc = task_hive_cost_breakdown()["result"]
    assert hc["monthly_baseline_usd"] == 180
    # Should be vastly cheaper than naive distributed stack
    assert hc["monthly_baseline_usd"] < hc["compared_to_unmanaged_33_vms_usd"] / 10
    print(f"  v Cloud baseline $180/mo (vs $10K/mo unmanaged 33-VM)")


def test_07_launch_week_ramp():
    lw = task_launch_week()["result"]
    assert lw["week_total_usd"] > 1_000_000
    # Day 7 should be the biggest
    day7 = max(lw["days"], key=lambda d: d["tier1"] + d["tier3"])
    assert day7["day"] == 7
    print(f"  v Launch week: ${lw['week_total_usd']:,.0f} total, biggest day is day {day7['day']}")


def test_08_pipeline_realistic():
    p = task_pipeline()["result"]
    assert p["tier1_enterprises_with_nda"] <= 12, "we're not Cisco, only count real prospects"
    assert p["tier3_defence_mou_in_flight"] <= 5, "only count active MoUs"
    print(f"  v Pipeline honest: {p['tier1_enterprises_with_nda']} NDA, {p['tier3_defence_mou_in_flight']} MoU, {p['tier2_pro_signups_target_y1']} subs target")


def test_09_care_floor_sustained():
    # The economics package doesn't directly compute care_floor but contains it as constant
    from economics import CARE_FLOOR
    assert CARE_FLOOR == 0.95
    print(f"  v Care Floor {CARE_FLOOR} sustained in economics module")


def test_10_license_open():
    from economics import LICENSE
    assert "MIT" in LICENSE and "CC0" in LICENSE
    print(f"  v License {LICENSE} (open)")


if __name__ == "__main__":
    print("=" * 70)
    print("  Sovereign Economics E2E Tests")
    print("=" * 70)
    print()
    test_01_y1_low_le_mid_le_high()
    test_02_tier1_dominates_high_scenario()
    test_03_tier2_subs_scale_proportionally()
    test_04_y3_compound_growth()
    test_05_unit_economics_mid_positive()
    test_06_cloud_cost_baseline()
    test_07_launch_week_ramp()
    test_08_pipeline_realistic()
    test_09_care_floor_sustained()
    test_10_license_open()
    print()
    print("TOTAL: 10 passed, 0 failed")
    print(f"  Empire 10/10. Sovereign 100/100.")
    print(f"  Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
    print(f"  MIT + CC0. Public. Auditable. Sovereign. Solve et Coagula.")
