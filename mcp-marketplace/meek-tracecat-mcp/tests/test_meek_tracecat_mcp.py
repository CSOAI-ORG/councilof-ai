#!/usr/bin/env python3
"""Tests for meek-tracecat-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_tracecat_mcp.server import tracecat_workflow, soc_alert_severity


def test_tracecat_workflow():
    r = tracecat_workflow(workflow_name="incident_response", trigger="high_severity_alert")
    assert r["num_connectors"] >= 20
    assert len(r["mitre_attack_tactics"]) == 12
    print(f"✅ test_tracecat_workflow: {r['num_connectors']} connectors, 12 ATT&CK tactics")


def test_soc_alert_severity():
    r = soc_alert_severity(num_alerts_per_day=10000, false_positive_rate=0.95)
    assert r["cost_per_year_gbp"] > 0
    assert r["ai_soar_savings_per_year_gbp"] > 0
    print(f"✅ test_soc_alert_severity: £{r['cost_per_year_gbp']:,.0f}/yr, save £{r['ai_soar_savings_per_year_gbp']:,.0f}/yr")


if __name__ == "__main__":
    test_tracecat_workflow()
    test_soc_alert_severity()
    print("\n🎉 ALL 2 TESTS PASSED — meek-tracecat-mcp v1.0.0 is sovereign.")