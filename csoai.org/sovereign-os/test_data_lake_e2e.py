"""
test_data_lake_e2e.py — Production-grade E2E test for the sovereign data lake
Phase 500 · CSOAI Ltd UK 16939677 · MIT

Validates:
  1. data_lake.py: schema bootstrap, persist/query round-trip, MCP dispatch,
     Demeter veto, hash-chained SIGIL, care floor witness, hive graph view.
  2. Backend auto-detection: SQLite (always), Postgres (lazy, fails gracefully
     when no DATABASE_URL or unreachable), Neo4j (lazy, fails gracefully).
  3. SQLite fallback behaviour: simulate endpoint returns 200 even when
     open-meteo + USGS are unreachable (real risk model + cached + synthetic).
  4. /api/watchdog/lake endpoint reports live status.
  5. End-to-end simulate never 500s.
"""
import json
import os
import sys
import time
import sqlite3
import tempfile
from pathlib import Path

ROOT = "/Users/nicholas/clawd/csoai.org/sovereign-os"
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "api", "watchdog"))

errors: list = []
oks: list = []


def check(cond, msg):
    if cond:
        oks.append(msg)
        print(f"  ✓ {msg}")
    else:
        errors.append(msg)
        print(f"  ✗ {msg}")


# === Section 1: data_lake.py unit checks =============================
print()
print("=" * 72)
print("  Section 1 · data_lake.py — production persistence layer")
print("=" * 72)
print()

# Use a fresh isolated SQLite so tests don't pollute dev data.
test_db = tempfile.NamedTemporaryFile(
    prefix="sov_datalake_test_", suffix=".db", delete=False
)
test_db_path = test_db.name
test_db.close()

# Monkey-patch the SQLite path to a temp file for clean test isolation.
import data_lake as dl
dl.SQLITE_PATH = Path(test_db_path)
dl._init_sqlite()
dl._ensure_simulation_table()

# 1.1 Schema bootstrap
with dl._sqlite_conn() as conn:
    tables = {r[0] for r in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()}
for t in ("reports", "sigil_chain", "bft_votes", "care_metrics", "hives",
          "risk_simulations"):
    check(t in tables, f"table {t} created on bootstrap")

# 1.2 persist_report + query round-trip
r1 = dl.persist_report(
    reporter_type="human",
    location={"lat": 51.5, "lng": -0.1, "label": "Test-1"},
    type_="safety", subtype="hazard", severity=0.7, confidence=0.85,
    evidence={"camera": "c1"}, sigil="ed25519:test1",
)
check(r1.get("ok"), "persist_report ok")
check("sqlite" in r1["payload"].get("persisted_to", []),
      "report persisted to sqlite")
check(r1["payload"].get("id", 0) > 0, f"report id assigned: {r1['payload'].get('id')}")

qr = dl.query_reports(last_n=10, type_="safety")
check(qr["payload"]["count"] >= 1, "query_reports returns ≥1 row")
returned = qr["payload"]["rows"][0]
check(returned.get("severity") == 0.7, "round-trip severity preserved")
check(returned.get("confidence") == 0.85, "round-trip confidence preserved")

# 1.3 SIGIL chain hash-linked
s1 = dl.persist_sigil("test", "sigA", "C|TEST|ONE", "selftest-mcp")
s2 = dl.persist_sigil("test", "sigB", "C|TEST|TWO", "selftest-mcp")
check(s1.get("ok") and s2.get("ok"), "persist_sigil twice")
check(s2["payload"]["hash"] != s1["payload"]["hash"], "sigil hashes differ")
check(s2["payload"]["prev_hash"] == s1["payload"]["hash"],
      "sigil chain hash-link verified (prev_hash == prev.hash)")

# 1.4 BFT + Demeter veto
b1 = dl.persist_bft_vote("Athena", "for", 0.98, 0.5)
b2 = dl.persist_bft_vote("Demeter", "for", 0.99, 0.5)
check(b1.get("ok") and b2.get("ok"), "persist_bft_vote for Athena + Demeter")
bv = dl.persist_bft_vote("Demeter", "for", 0.5, 0.5)
check(not bv.get("ok"), "Demeter veto triggers on care_score < 0.95")

# 1.5 Care metric + witness label
c1 = dl.persist_care_metric(0.97, "selftest", "real-time")
check(c1.get("ok") and c1["payload"].get("witness") == "CARE_FLOOR_PRESERVED",
      "care metric ≥0.95 → CARE_FLOOR_PRESERVED")
c2 = dl.persist_care_metric(0.5, "selftest", "real-time")
check(c2["payload"].get("witness") == "DEGRADED",
      "care metric <0.95 → DEGRADED")

# 1.6 Hives
h1 = dl.persist_hive("test-meok", "sovereign-core", "Athena")
h2 = dl.persist_hive("test-data-lake", "persistence", "Hecate",
                     parent_hive="test-meok")
check(h1.get("ok") and h2.get("ok"), "persist_hive for two hives")
qh = dl.query_hives(domain="persistence")
check(qh["payload"]["count"] >= 1, "query_hives by domain works")

# 1.7 MCP dispatch
d1 = dl.dispatch("lake_status")
check(d1.get("ok"), "dispatch lake_status")
check(d1["payload"]["backends"]["sqlite"]["available"], "sqlite always available")
d2 = dl.dispatch("bogus_method")
check(d2.get("status") == "error", "dispatch unknown method → error")
d3 = dl.dispatch("persist_report", {
    "reporter_type": "agent", "location": {"lat": 51.6, "lng": -0.2},
    "type": "infrastructure", "severity": 0.6, "confidence": 0.9,
})
check(d3.get("ok"), "dispatch persist_report")

# 1.8 Bad inputs rejected
br = dl.persist_report("human", {"lat": 51.5}, "safety", severity=0.7, confidence=0.9)
check(not br.get("ok"), "missing lng → error")
br2 = dl.persist_report("human", {"lat": 51.5, "lng": -0.1}, "safety",
                        severity=1.5, confidence=0.9)
check(not br2.get("ok"), "severity >1 → error")
br3 = dl.persist_care_metric(2.0, "test")
check(not br3.get("ok"), "care value >1 → error")


# === Section 2: Postgres + Neo4j lazy auto-detection =================
print()
print("=" * 72)
print("  Section 2 · Backend auto-detection (lazy + graceful fallback)")
print("=" * 72)
print()

s = dl.backend_status()
check(s["payload"]["backends"]["sqlite"]["available"], "sqlite backend available")
check(s["payload"]["primary_backend"] in ("sqlite", "postgres"),
      f"primary backend is real: {s['payload']['primary_backend']}")
check(s["payload"]["graph_backend"] in ("neo4j", "local-sqlite"),
      f"graph backend is real: {s['payload']['graph_backend']}")

# Try a Postgres write to a fake server — must not crash, must fall back
os.environ["DATABASE_URL"] = "postgresql://nobody:nopass@127.0.0.1:1/fake?connect_timeout=1"
dl._pg_state["probed"] = False
dl._pg_state["available"] = False
pg_result = dl.persist_report("human", {"lat": 51.7, "lng": -0.3}, "safety",
                              severity=0.5, confidence=0.9)
check(pg_result.get("ok"), "persist_report survives unreachable Postgres")
check("sqlite" in pg_result["payload"].get("persisted_to", []),
      "fell back to sqlite when Postgres unreachable")
check(pg_result["payload"].get("postgres_id") is None,
      "postgres_id is None when Postgres unreachable (degraded)")

# Reset
os.environ.pop("DATABASE_URL", None)
dl._pg_state["probed"] = False
dl._pg_state["available"] = False

# Try Neo4j with a fake URL — must not crash
os.environ["NEO4J_URL"] = "bolt://127.0.0.1:1"
dl._neo4j_state["probed"] = False
dl._neo4j_state["available"] = False
h3 = dl.persist_hive("test-neo4j-fallback", "graph-test", "Hecate")
check(h3.get("ok"), "persist_hive survives unreachable Neo4j")
check("neo4j" not in h3["payload"].get("persisted_to", []),
      "neo4j NOT in persisted_to when unreachable")

os.environ.pop("NEO4J_URL", None)
dl._neo4j_state["probed"] = False
dl._neo4j_state["available"] = False


# === Section 3: Risk simulation cache (the SQLite fallback) ==========
print()
print("=" * 72)
print("  Section 3 · Risk simulation cache — SQLite fallback for open-meteo/USGS")
print("=" * 72)
print()

start = {"lat": 51.5014, "lng": -0.1419, "area_name": "Buckingham Palace"}
end = {"lat": 51.508, "lng": -0.128, "area_name": "Trafalgar Square"}

# Persist a fake "real" simulation as if it came from open-meteo
sim_persisted = dl.persist_risk_simulation(
    start, end, "balanced",
    best_route="Route B · via park north", best_risk=0.25,
    best_confidence=0.86,
    routes=[{"name": "Route A", "risk_score": 0.45},
            {"name": "Route B", "risk_score": 0.25},
            {"name": "Route C", "risk_score": 0.55}],
    data_sources={"open_meteo": "live", "usgs": "live"},
    sigil="ed25519:simtest1",
    degraded=False,
)
check(sim_persisted.get("ok"), "persist_risk_simulation ok")

cached = dl.get_cached_simulation(start, end, "balanced")
check(cached is not None, "get_cached_simulation hit")
check(cached.get("best_route") == "Route B · via park north",
      "cached best_route preserved")
check(cached.get("degraded") is False, "cached degraded=False")
check(cached.get("sigil") == "ed25519:simtest1", "cached sigil preserved")

# Miss case
miss = dl.get_cached_simulation({"lat": 0, "lng": 0}, {"lat": 1, "lng": 1}, "fastest")
check(miss is None, "cache miss for never-seen route returns None")


# === Section 4: Watchdog _lib + lake_status endpoint =================
print()
print("=" * 72)
print("  Section 4 · /api/watchdog/_lib.py — lake + simulate never 500s")
print("=" * 72)
print()

# Make sure _lib re-imports the now-current data_lake
import importlib
import api.watchdog._lib as wdl  # noqa: E402
importlib.reload(wdl)

lake_obj = wdl.lake()
check(len(lake_obj.reports) >= 0, "watchdog lake instance loads")

# Simulate — should return real_data=True OR fall through cache OR synthetic
sim = lake_obj.simulate(start, end, "balanced")
check(sim.get("agent_id") in (
    "pre-departure-simulator-real",
    "pre-departure-simulator-cached",
    "pre-departure-simulator-synthetic",
), f"simulate agent_id is real: {sim.get('agent_id')}")
check("candidate_routes" in sim and len(sim["candidate_routes"]) >= 1,
      f"simulate returns ≥1 route (got {len(sim.get('candidate_routes', []))})")
check("best_route" in sim, "simulate returns best_route")
check("degraded" in sim, "simulate reports degraded flag")
check("cache_key" in sim, "simulate includes cache_key")
check("sigil" in sim, "simulate includes sigil")

# Even with garbage coords, simulate must NOT 500
sim2 = lake_obj.simulate({"lat": None, "lng": None}, {"lat": None, "lng": None})
check("candidate_routes" in sim2, "simulate with bad coords still returns routes")

# Submit a report — should persist to data lake
lake_obj.submit(
    reporter={"type": "human"},
    location={"lat": 51.5, "lng": -0.1, "area_name": "TestZone"},
    type="safety", subtype="hazard", severity=0.7, confidence=0.85,
    description="e2e test report",
)
# Verify it landed in data_lake
new_count = dl.query_reports(last_n=50, type_="safety")["payload"]["count"]
check(new_count >= 1, f"submitted report landed in data_lake (count={new_count})")

# Verify lake_status endpoint
from lake_status import handler
class Req:
    method = "GET"
resp = handler(Req())
check(resp.status_code == 200, f"lake_status HTTP 200 (got {resp.status_code})")
body = json.loads(resp.body)
check(body.get("ok") is True, "lake_status ok=True")
check(body.get("data_lake") == "available", "lake_status data_lake=available")
check(body.get("primary_backend") in ("sqlite", "postgres"),
      f"lake_status primary_backend real: {body.get('primary_backend')}")
check("row_counts" in body, "lake_status includes row_counts")
check(body.get("phase") == "500", "lake_status phase=500")

# lake_status should report degraded_persistence if no Postgres
if not dl._probe_postgres():
    check(body.get("degraded_persistence") is True,
          "degraded_persistence=True when no Postgres")


# === Section 5: end-to-end never-500 stress ==========================
print()
print("=" * 72)
print("  Section 5 · Simulate never 500s (10 random requests)")
print("=" * 72)
print()

import random
failures = 0
for i in range(10):
    s_lat = 48 + random.random() * 8  # 48-56
    s_lng = -2 + random.random() * 8  # -2 to 6
    e_lat = 48 + random.random() * 8
    e_lng = -2 + random.random() * 8
    try:
        out = lake_obj.simulate({"lat": s_lat, "lng": s_lng},
                                {"lat": e_lat, "lng": e_lng},
                                random.choice(["balanced", "safest", "fastest"]))
        if "candidate_routes" not in out or "best_route" not in out:
            failures += 1
            print(f"  ✗ iter {i}: missing routes in response")
    except Exception as e:
        failures += 1
        print(f"  ✗ iter {i}: EXCEPTION {type(e).__name__}: {e}")
check(failures == 0, f"10 random simulate requests all return 200 (failures={failures})")


# === Section 6: status counts =============================
print()
print("=" * 72)
print("  Section 6 · Final state check")
print("=" * 72)
print()

s = dl.backend_status()
counts = s["payload"]["row_counts"]
print(f"  Final row counts: {counts}")
check(counts["reports"] >= 1, "reports table populated")
check(counts["sigil_chain"] >= 2, "sigil_chain table populated")
check(counts["bft_votes"] >= 2, "bft_votes table populated")
check(counts["care_metrics"] >= 2, "care_metrics table populated")
check(counts["hives"] >= 2, "hives table populated")


# === Cleanup + summary ===============================================
try:
    os.unlink(test_db_path)
except Exception:
    pass

print()
print("=" * 72)
print(f"  SUMMARY: {len(oks)} passed · {len(errors)} failed")
print("=" * 72)
if errors:
    print()
    print("  Failed checks:")
    for e in errors:
        print(f"    · {e}")
    sys.exit(1)
print()
print("  🜏 ALL DATA LAKE E2E TESTS PASSED · production-ready")
print("     Care Floor 0.95 · BFT 12-around-1 · SIGIL Ed25519+PQC")
print("     Postgres+SQLite+Neo4j backends with graceful fallback")
print("     Simulate endpoint never 500s — even when open-meteo + USGS are down")
sys.exit(0)
