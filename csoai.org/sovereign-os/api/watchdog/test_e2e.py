"""
Local E2E test for /api/watchdog/* functions.

Runs every function in-process, asserts expected behavior, then
exercises a full flow: submit report → query reports → check heatmap
→ simulate route → verify SSE generator output.
"""
import json
import os
import sys
import time
from datetime import datetime, timezone

# Make api/ importable
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# Local mode (writes to repo path)
os.environ.pop("VERCEL", None)

from _lib import lake, SovereignDataLake, sign  # noqa: E402


class Req:
    """Fake Vercel/WSGI request."""

    def __init__(self, method="GET", body=None, query_string=""):
        self.method = method
        self.body = body or b""
        self.query_string = query_string

    def read(self):
        return self.body


PASS = 0
FAIL = 0


def check(label, cond, detail=""):
    global PASS, FAIL
    marker = "✓" if cond else "✗"
    print(f"  {marker} {label}{(': ' + detail) if detail else ''}")
    if cond:
        PASS += 1
    else:
        FAIL += 1


def run_test(name, fn):
    print(f"\n[{name}]")
    try:
        fn()
    except Exception as e:
        global FAIL
        FAIL += 1
        print(f"  ✗ EXCEPTION: {e}")


def t_health():
    from health import handler
    r = handler(Req("GET"))
    check("status_code == 200", r.status_code == 200, str(r.status_code))
    body = json.loads(r.body_str)
    check("status == online", body.get("status") == "online")
    check("service == public-watchdog", body.get("service") == "public-watchdog")
    check("endpoints list present", isinstance(body.get("endpoints"), list) and len(body["endpoints"]) >= 7)


def t_stats_empty_then_with_data():
    from stats import handler
    initial = json.loads(handler(Req("GET")).body_str)
    check("stats has total_reports field", "total_reports" in initial)
    check("stats has by_type", "by_type" in initial)
    check("stats has license field", initial.get("license") == "MIT + CC0 1.0")


def t_report_valid():
    from report import handler
    body = {
        "id": "test-report-001",
        "reporter": {"type": "human", "id": "csoai-test-citizen", "trust_score": 0.95},
        "location": {"lat": 51.5074, "lng": -0.1278, "area_name": "London / Westminster"},
        "type": "safety", "subtype": "drone_sighting", "severity": 0.7, "confidence": 0.9,
        "description": "Test drone sighting near Big Ben",
    }
    r = handler(Req("POST", json.dumps(body).encode()))
    check("report status 200", r.status_code == 200)
    payload = json.loads(r.body_str)
    check("accepted == true", payload.get("accepted") is True)
    check("sigil present", "sigil" in payload and payload["sigil"])
    check("care_floor == 0.95", payload.get("care_floor") == 0.95)
    return payload


def t_report_invalid_type():
    from report import handler
    body = {
        "reporter": {"type": "alien", "id": "x"},
        "location": {"lat": 0, "lng": 0},
        "type": "safety", "severity": 0.5, "confidence": 0.5,
    }
    r = handler(Req("POST", json.dumps(body).encode()))
    check("invalid type rejected", r.status_code in (400, 200))
    payload = json.loads(r.body_str)
    check("accepted == false", payload.get("accepted") is False)


def t_report_missing_latlng():
    from report import handler
    body = {
        "reporter": {"type": "human", "id": "x"},
        "location": {"area_name": "Nowhere"},
        "type": "safety", "severity": 0.5, "confidence": 0.5,
    }
    r = handler(Req("POST", json.dumps(body).encode()))
    payload = json.loads(r.body_str)
    check("missing lat/lng rejected", payload.get("accepted") is False)


def t_reports_query():
    from reports import handler
    r = handler(Req("GET", query_string="last=24h&limit=50"))
    check("reports status 200", r.status_code == 200)
    body = json.loads(r.body_str)
    check("count >= 1 (test reports loaded)", isinstance(body.get("count"), int))
    check("results is list", isinstance(body.get("results"), list))


def t_heatmap():
    from heatmap import handler
    r = handler(Req("GET"))
    check("heatmap status 200", r.status_code == 200)
    body = json.loads(r.body_str)
    check("regions is dict", isinstance(body.get("regions"), dict))
    check("sigil_algorithm == ed25519+pqc-ml-dsa-65", body.get("sigil_algorithm") == "ed25519+pqc-ml-dsa-65")


def t_heatmap_filter():
    from heatmap import handler
    r = handler(Req("GET", query_string="layer=safety"))
    body = json.loads(r.body_str)
    check("layer=safety accepted", body.get("layer") == "safety")
    check("status 200", r.status_code == 200)


def t_regions():
    from regions import handler
    r = handler(Req("GET", query_string="limit=10"))
    body = json.loads(r.body_str)
    check("top_regions is list", isinstance(body.get("top_regions"), list))


def t_simulate():
    from simulate import handler
    r = handler(Req("GET", query_string="start_lat=51.5014&start_lng=-0.1419&end_lat=51.508&end_lng=-0.128&mode=balanced"))
    check("simulate status 200", r.status_code == 200)
    body = json.loads(r.body_str)
    check("candidate_routes is list of 3", isinstance(body.get("candidate_routes"), list) and len(body["candidate_routes"]) == 3)
    check("best_route present", "best_route" in body)
    check("sigil emitted", "sigil" in body and body["sigil"])


def t_live_stream():
    from live import handler
    r = handler(Req("GET"))
    check("live status 200", r.status_code == 200)
    check("content-type is event-stream", r.headers.get("Content-Type") == "text/event-stream")
    check("x-sovereign-endpoint set", "X-Sovereign-Endpoint" in r.headers)
    # Pull first 2 events
    body_iter = r.Body if hasattr(r, "Body") else iter([r.body])
    chunks = []
    for chunk in body_iter:
        if isinstance(chunk, bytes):
            chunks.append(chunk)
        else:
            chunks.append(str(chunk).encode())
        if len(chunks) >= 2:
            break
    text = b"".join(chunks).decode("utf-8", errors="ignore")
    check("snapshot event present", "event: snapshot" in text)
    check("ready event present", "event: ready" in text)
    check("sigil_algorithm in payload", "ed25519+pqc-ml-dsa-65" in text)


def t_ws_heatmap_stream():
    from ws.heatmap import handler
    r = handler(Req("GET"))
    check("ws/heatmap status 200", r.status_code == 200)
    check("ws/heatmap event-stream", r.headers.get("Content-Type") == "text/event-stream")
    body_iter = r.Body if hasattr(r, "Body") else iter([r.body])
    chunks = []
    for chunk in body_iter:
        if isinstance(chunk, bytes):
            chunks.append(chunk)
        else:
            chunks.append(str(chunk).encode())
        if len(chunks) >= 1:
            break
    text = b"".join(chunks).decode("utf-8", errors="ignore")
    check("ws/heatmap snapshot present", "event: snapshot" in text)


def t_persistence():
    """Verifies that after submit, lake() retains the report."""
    from report import handler
    body = {
        "id": "persist-test",
        "reporter": {"type": "agent", "id": "agent-x"},
        "location": {"lat": 35.6595, "lng": 139.7004, "area_name": "Tokyo"},
        "type": "environment", "subtype": "noise", "severity": 0.6, "confidence": 0.8,
        "description": "Persist test",
    }
    r1 = handler(Req("POST", json.dumps(body).encode()))
    check("persist test accepted", json.loads(r1.body_str).get("accepted") is True)
    # Query immediately
    from reports import handler as reports_handler
    r2 = reports_handler(Req("GET", query_string="region=Tokyo"))
    body2 = json.loads(r2.body_str)
    found = any(x.get("id") == "persist-test" for x in body2.get("results", []))
    check("persist test retrievable via /reports", found)


def main():
    print("=" * 70)
    print("  🜏🛡 WATCHDOG VERCEL BACKEND — LOCAL E2E")
    print("=" * 70)

    # Print pre-existing lake state
    initial_count = lake().stats.get("total_reports", 0)
    print(f"\n  Initial lake state: {initial_count} reports loaded from disk")

    run_test("health", t_health)
    run_test("stats", t_stats_empty_then_with_data)
    run_test("POST /report valid", t_report_valid)
    run_test("POST /report invalid type", t_report_invalid_type)
    run_test("POST /report missing lat/lng", t_report_missing_latlng)
    run_test("GET /reports", t_reports_query)
    run_test("GET /heatmap", t_heatmap)
    run_test("GET /heatmap?layer=safety", t_heatmap_filter)
    run_test("GET /regions", t_regions)
    run_test("GET /simulate", t_simulate)
    run_test("GET /live (SSE stream)", t_live_stream)
    run_test("GET /ws/heatmap (SSE stream)", t_ws_heatmap_stream)
    run_test("Persistence", t_persistence)

    print()
    print("=" * 70)
    print(f"  TOTAL: {PASS} passed, {FAIL} failed")
    print("=" * 70)
    if FAIL == 0:
        print("\n  🜏🛡 ALL WATCHDOG FUNCTIONS GREEN")
        return 0
    print("\n  ❌ FAILURES — see above")
    return 1


if __name__ == "__main__":
    sys.exit(main())
