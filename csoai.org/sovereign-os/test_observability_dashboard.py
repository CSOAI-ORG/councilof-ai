"""End-to-end test for observability_dashboard.py
Validates: import, record APIs, snapshot, prometheus_text, sparkline SVG,
BFT feed subscription, HTTP /metrics, /dashboard, /bft/recent, /metrics/json.
"""
import json
import sys
import time
import threading
import socket
import urllib.request
import urllib.error
from http.server import ThreadingHTTPServer

sys.path.insert(0, "/Users/nicholas/clawd/csoai.org/sovereign-os")
from observability_dashboard import (
    ObservabilityDashboard,
    QUEENS,
    CARE_FLOOR,
    BFT_MAJORITY,
    SIGIL_ALGO,
    render_sparkline_svg,
    render_bft_vote_svg,
    make_handler,
    dashboard,
    PHASE_TAG,
    _vote_from_dict,
)

errors = []
def check(cond, msg):
    if not cond:
        errors.append(msg)
        print(f"  FAIL: {msg}")
    else:
        print(f"  PASS: {msg}")

# ---- 1. Constants ----
print("\n[1] Constants")
check(CARE_FLOOR == 0.95, "CARE_FLOOR == 0.95")
check(abs(BFT_MAJORITY - 2/3) < 1e-9, "BFT_MAJORITY == 2/3")
check(SIGIL_ALGO == "ed25519+pqc-ml-dsa-65", "SIGIL_ALGO")
check(len(QUEENS) == 12, f"12 queens (got {len(QUEENS)})")
check(abs(sum(q["weight"] for q in QUEENS) - 1.0) < 1e-9, "queen weights sum to 1")

# ---- 2. Instance + record APIs ----
print("\n[2] Record APIs")
d = ObservabilityDashboard()
d.record_call("mcp.observe", 12.3, 200)
d.record_call("mcp.observe", 18.0, 200)
d.record_call("mcp.utter", 35.2, 200)
d.record_call("mcp.utter", 22.1, 500)  # error
d.record_sigil("test", "alpha")
d.record_bft("hello-world", 0.97, trigger="utter")
d.record_bft("care-breach", 0.83, trigger="refusal_test")
d.record_refusal("bad-input", 0.80, reason="below_floor")
d.record_cage_floor_witness()
d.record_report_submitted()

snap = d.snapshot()
check(snap["endpoint_calls_total"]["mcp.observe"] == 2, "endpoint_calls_total for mcp.observe")
check(snap["endpoint_calls_total"]["mcp.utter"] == 2, "endpoint_calls_total for mcp.utter")
check(snap["errors_total"] >= 1, f"errors_total recorded (got {snap['errors_total']})")
check(snap["bft_votes_pass_total"] == 1, f"bft pass=1 (got {snap['bft_votes_pass_total']})")
check(snap["bft_votes_fail_total"] == 1, f"bft fail=1 (got {snap['bft_votes_fail_total']})")
check(snap["care_breaches_total"] >= 2, f"care breaches >=2 (got {snap['care_breaches_total']})")
check(snap["sigils_emitted_total"] >= 3, f"sigils emitted >=3 (got {snap['sigils_emitted_total']})")
check(snap["cage_floor_witness_count"] == 1, "cage_floor_witness_count")
check(snap["reports_submitted_total"] == 1, "reports_submitted_total")
check(snap["qps_per_endpoint"]["mcp.observe"] == 2, "qps_per_endpoint counts mcp.observe")

# ---- 3. Latency percentiles ----
print("\n[3] Latency percentiles")
d2 = ObservabilityDashboard()
for v in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 100]:
    d2.record_call("ep1", v, 200)
snap2 = d2.snapshot()
check(snap2["latency_p50_ms"] >= 9 and snap2["latency_p50_ms"] <= 12,
      f"p50 reasonable (got {snap2['latency_p50_ms']})")
check(snap2["latency_p95_ms"] >= 15, f"p95 reasonable (got {snap2['latency_p95_ms']})")
check(snap2["latency_p99_ms"] >= 19, f"p99 reasonable (got {snap2['latency_p99_ms']})")

# ---- 4. Prometheus text ----
print("\n[4] Prometheus exposition")
text = d.prometheus_text()
required_metrics = [
    "sovereign_info",
    "sovereign_uptime_seconds",
    "care_floor_value",
    "care_floor_minutes_60s",
    "care_floor_breaches_total",
    "bft_pass_rate_minutes_60s",
    'bft_votes_total{decision="pass"}',
    'bft_votes_total{decision="fail"}',
    "bft_votes_minutes_60s",
    "sigil_chain_rate_per_minute",
    "sigils_emitted_total",
    'qps_per_endpoint{endpoint="mcp.observe"}',
    'endpoint_calls_total{endpoint="mcp.observe"}',
    'latency_milliseconds{quantile="0.5"}',
    'latency_milliseconds{quantile="0.95"}',
    'latency_milliseconds{quantile="0.99"}',
    "error_rate_minutes_60s",
    "errors_total",
    "cage_floor_witness_count",
    "reports_submitted_total",
]
for m in required_metrics:
    check(m in text, f"Prometheus has {m}")
check(text.endswith("\n"), "Prometheus ends with newline")
check("# HELP sovereign_info" in text, "has HELP comments")
check("# TYPE sovereign_info gauge" in text, "has TYPE comments")

# ---- 5. Sparkline rendering ----
print("\n[5] Sparkline SVG")
svg = render_sparkline_svg([0.1, 0.5, 0.9, 0.7, 0.3, 0.8], 240, 50, "#fbbf24", label="care")
check(svg.startswith("<svg "), "sparkline starts with <svg")
check("</svg>" in svg, "sparkline ends with </svg>")
check('stroke="#fbbf24"' in svg, "sparkline uses given stroke")
check("polyline" in svg, "sparkline has polyline")
check("polygon" in svg, "sparkline has filled polygon")
empty_svg = render_sparkline_svg([], 100, 30)
check(empty_svg.startswith("<svg "), "empty sparkline still emits svg")

care_series = d.care_series(60)
check(len(care_series) == 60, f"care_series returns 60 points (got {len(care_series)})")
sigil_series = d.sigil_series(60)
check(len(sigil_series) == 60, f"sigil_series returns 60 points (got {len(sigil_series)})")
bft_series = d.bft_pass_series(60)
check(len(bft_series) == 60, f"bft_pass_series returns 60 points (got {len(bft_series)})")
lat_series = d.latency_series(60)
check(len(lat_series) == 60, f"latency_series returns 60 points (got {len(lat_series)})")

votes = d.bft_recent(2)
check(len(votes) >= 1, "have BFT votes")
if votes:
    vote = _vote_from_dict(votes[0])
    vote_svg = render_bft_vote_svg(vote, 600, 50)
    check(vote_svg.startswith("<svg "), "BFT vote SVG starts with <svg")
    check("PASS" in vote_svg or "FAIL" in vote_svg, "BFT vote SVG shows decision")
    check(vote_svg.count("<rect") == 12, f"12 queen rects (got {vote_svg.count('<rect')})")

# ---- 6. BFT feed subscription ----
print("\n[6] BFT live feed")
d3 = ObservabilityDashboard()
feed = d3.bft_subscribe()
t = threading.Thread(target=lambda: (time.sleep(0.1), d3.record_bft("test-feed", 0.98)))
t.start()
events = feed.wait_for(timeout=2.0)
check(len(events) == 1, f"subscriber received 1 event (got {len(events)})")
if events:
    check(events[0]["subject"] == "test-feed", "event has correct subject")
    check(events[0]["decision"] == "PASS", "event decision is PASS")
    check(len(events[0]["votes"]) == 12, f"event has 12 votes (got {len(events[0]['votes'])})")
    demeter = [v for v in events[0]["votes"] if v["queen"] == "Demeter"][0]
    check(demeter["vote"] == "for", "Demeter votes for at 0.98")
t.join()
t2 = threading.Thread(target=lambda: (time.sleep(0.1), d3.record_bft("bad", 0.80)))
t2.start()
events2 = feed.wait_for(timeout=2.0)
check(len(events2) == 1, f"subscriber received refusal event (got {len(events2)})")
if events2:
    check(events2[0]["decision"] == "FAIL", "0.80 composite -> FAIL")
    demeter = [v for v in events2[0]["votes"] if v["queen"] == "Demeter"][0]
    check(demeter["vote"] == "against", "Demeter vetoes at 0.80")
t2.join()
feed.close()

# ---- 7. HTTP server ----
print("\n[7] HTTP server")
d4 = ObservabilityDashboard()
d4.record_call("mcp.observe", 12.0, 200)
d4.record_bft("seeded", 0.96)
handler = make_handler(d4)
server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
port = server.server_address[1]
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f"http://127.0.0.1:{port}"

def fetch(path, expected_ct=None):
    try:
        with urllib.request.urlopen(f"{base}{path}", timeout=2) as r:
            body = r.read()
            ct = r.headers.get("Content-Type", "")
            return r.status, ct, body
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type", ""), e.read()
    except Exception as e:
        return None, None, str(e).encode()

status, ct, body = fetch("/health")
check(status == 200, f"/health returns 200 (got {status})")
data = json.loads(body)
check(data["status"] == "ok", "/health status=ok")

status, ct, body = fetch("/ready")
check(status == 200, f"/ready returns 200 (got {status})")
data = json.loads(body)
check(data["care_floor_armed"] is True, "/ready care_floor_armed")
check(data["bft_armed"] is True, "/ready bft_armed")
check(data["sigil_armed"] is True, "/ready sigil_armed")

status, ct, body = fetch("/metrics")
check(status == 200, f"/metrics returns 200 (got {status})")
check("text/plain" in ct, f"/metrics content-type is Prometheus (got {ct})")
check(b"sovereign_info" in body, "/metrics has sovereign_info")
check(b"care_floor_value" in body, "/metrics has care_floor_value")

status, ct, body = fetch("/metrics/json")
check(status == 200, f"/metrics/json returns 200 (got {status})")
check("application/json" in ct, "/metrics/json content-type")
data = json.loads(body)
check("care_floor_value" in data, "/metrics/json has care_floor_value")
check("qps_per_endpoint" in data, "/metrics/json has qps_per_endpoint")
check("latency_p50_ms" in data, "/metrics/json has latency_p50_ms")

status, ct, body = fetch("/dashboard")
check(status == 200, f"/dashboard returns 200 (got {status})")
check(b"SOV3 Sovereign Observability Dashboard" in body, "/dashboard has title")
check(b"care_floor_value" in body, "/dashboard has care_floor_value metric")
check(b"<svg" in body, "/dashboard has SVG sparklines")
check(b"12-Queen BFT Vote Feed" in body, "/dashboard has BFT vote feed")

status, ct, body = fetch("/bft/recent")
check(status == 200, f"/bft/recent returns 200 (got {status})")
data = json.loads(body)
check(isinstance(data, list), "/bft/recent returns list")
check(len(data) >= 1, f"/bft/recent has at least 1 vote (got {len(data)})")
if data:
    check(data[0]["decision"] == "PASS", "/bft/recent first vote is PASS")
    check(len(data[0]["votes"]) == 12, "/bft/recent vote has 12 queen votes")

status, ct, body = fetch("/sigil/recent")
check(status == 200, f"/sigil/recent returns 200 (got {status})")

status, ct, body = fetch("/queens")
check(status == 200, f"/queens returns 200 (got {status})")
data = json.loads(body)
check(len(data) == 12, f"/queens returns 12 queens (got {len(data)})")

status, ct, body = fetch("/sparkline/care?w=240&h=40")
check(status == 200, f"/sparkline/care returns 200 (got {status})")
check("image/svg+xml" in ct, "/sparkline/care content-type is SVG")
check(b"<svg" in body, "/sparkline/care has svg")

status, ct, body = fetch("/sparkline/bft")
check(status == 200, f"/sparkline/bft returns 200 (got {status})")
status, ct, body = fetch("/sparkline/sigil")
check(status == 200, f"/sparkline/sigil returns 200 (got {status})")
status, ct, body = fetch("/sparkline/latency")
check(status == 200, f"/sparkline/latency returns 200 (got {status})")

status, ct, body = fetch("/sparkline/unknown")
check(status == 404, f"/sparkline/unknown returns 404 (got {status})")

# SSE feed — verify headers
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(3.0)
s.connect(("127.0.0.1", port))
s.sendall(b"GET /bft/feed HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n")
buf = b""
try:
    while b"\r\n\r\n" not in buf and len(buf) < 4096:
        chunk = s.recv(1024)
        if not chunk:
            break
        buf += chunk
finally:
    s.close()
check(b"200" in buf[:32], f"/bft/feed returns 200 (got first bytes: {buf[:32]!r})")
check(b"text/event-stream" in buf, "/bft/feed content-type is text/event-stream")

# POST /record
def post(path, payload, token=None):
    req = urllib.request.Request(
        f"{base}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **( {"X-Admin-Token": token} if token else {} )},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=2) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

status, body = post("/record", {"kind": "bft", "composite": 0.97, "subject": "test"})
check(status == 201, f"POST /record bft returns 201 (got {status})")
status, body = post("/record", {"kind": "refusal", "composite": 0.5, "subject": "x"})
check(status == 201, f"POST /record refusal returns 201 (got {status})")
status, body = post("/record", {"kind": "call", "endpoint": "test", "latency_ms": 5.0, "status": 200})
check(status == 201, f"POST /record call returns 201 (got {status})")
status, body = post("/record", {"kind": "sigil", "subject": "manual"})
check(status == 201, f"POST /record sigil returns 201 (got {status})")
status, body = post("/record", {"kind": "cage_floor_witness"})
check(status == 201, f"POST /record cage_floor_witness returns 201 (got {status})")
status, body = post("/record", {"kind": "report"})
check(status == 201, f"POST /record report returns 201 (got {status})")
status, body = post("/record", {"kind": "unknown_kind"})
check(status == 400, f"POST /record unknown_kind returns 400 (got {status})")

status, body = post("/reset", {}, token="sov3-sovereign-admin")
check(status == 200, f"POST /reset returns 200 (got {status})")

status, body = post("/reset", {}, token=None)
check(status == 403, f"POST /reset without token returns 403 (got {status})")

status, ct, body = fetch("/not_found")
check(status == 404, f"/not_found returns 404 (got {status})")

server.shutdown()
server.server_close()

# ---- 8. Module-level singleton ----
print("\n[8] Module-level singleton")
from observability_dashboard import dashboard as d_singleton
check(isinstance(d_singleton, ObservabilityDashboard), "module-level dashboard is instance")
d_singleton.record_call("singleton-test", 1.0, 200)
snap = d_singleton.snapshot()
check(snap["endpoint_calls_total"].get("singleton-test", 0) >= 1, "singleton records work")

# ---- Summary ----
print("\n" + "=" * 60)
if errors:
    print(f"FAILED: {len(errors)} check(s) failed:")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)
else:
    print("ALL CHECKS PASSED")
    print(f"  Phase: {PHASE_TAG}")
    print(f"  Constants: CARE_FLOOR={CARE_FLOOR} BFT_MAJORITY={BFT_MAJORITY:.4f}")
    print(f"  Queens: {len(QUEENS)} (sum_weight={sum(q['weight'] for q in QUEENS):.3f})")
    sys.exit(0)
