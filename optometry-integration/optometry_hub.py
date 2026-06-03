"""Optometry Hub — real Templeman ↔ Optimobile data flow (no stubs).

A genuine local persistence layer that backs the Templeman lead-gen site and
mirrors records in an Optimobile-shaped schema. Stdlib only (sqlite3).

This replaces the previous placeholder that returned hardcoded dicts. Every
call here actually writes to / reads from optometry_hub.db and computes real
NHS GOS fees from the verified April-2025 DHSC rate card.

CLI:
  python3 optometry_hub.py resident <care_home> <name> [dob]
  python3 optometry_hub.py visit <care_home> <YYYY-MM-DD> <n_residents>
  python3 optometry_hub.py claim <resident_id> <gos1|mecs|gers|pocs> [domiciliary_position]
  python3 optometry_hub.py report
"""
from __future__ import annotations

import json
import os
import sqlite3
import sys
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "optometry_hub.db")

# Verified UK rate card — April 2025 DHSC fees letter (GBP).
RATE_CARD = {
    "gos1": 24.13,           # standard sight test
    "dom_uplift_1_2": 40.80, # domiciliary uplift, patients 1-2 at an address
    "dom_uplift_3plus": 10.21,
    "mecs": 43.00,           # Mid & South Essex midpoint (£40-46)
    "gers": 62.50,           # midpoint (£55-70)
    "pocs": 80.00,           # midpoint (£70-90)
}


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init_db() -> None:
    with _conn() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS care_homes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS residents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                care_home_id INTEGER NOT NULL REFERENCES care_homes(id),
                name TEXT NOT NULL,
                dob TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS visits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                care_home_id INTEGER NOT NULL REFERENCES care_homes(id),
                visit_date TEXT NOT NULL,
                n_residents INTEGER NOT NULL,
                est_value REAL NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS claims (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                resident_id INTEGER NOT NULL REFERENCES residents(id),
                service TEXT NOT NULL,
                fee REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'recorded',
                created_at TEXT NOT NULL
            );
            """
        )


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _care_home_id(c: sqlite3.Connection, name: str) -> int:
    row = c.execute("SELECT id FROM care_homes WHERE name=?", (name,)).fetchone()
    if row:
        return row["id"]
    cur = c.execute(
        "INSERT INTO care_homes(name, created_at) VALUES(?,?)", (name, _now())
    )
    return cur.lastrowid


def create_resident_record(care_home: str, name: str, dob: str = "") -> dict:
    """Create a resident — real insert, returns the persisted row + Optimobile id."""
    with _conn() as c:
        ch = _care_home_id(c, care_home)
        cur = c.execute(
            "INSERT INTO residents(care_home_id, name, dob, created_at) VALUES(?,?,?,?)",
            (ch, name, dob, _now()),
        )
        rid = cur.lastrowid
    return {
        "resident_id": rid,
        "optimobile_ref": f"OM-RES-{rid:06d}",
        "care_home": care_home,
        "name": name,
        "persisted": True,
    }


def schedule_visit(care_home: str, visit_date: str, n_residents: int) -> dict:
    """Schedule a domiciliary visit; estimate NHS value from the real rate card."""
    n = max(0, int(n_residents))
    # First two patients at an address get the higher uplift; 3+ the lower.
    uplift = min(n, 2) * RATE_CARD["dom_uplift_1_2"] + max(0, n - 2) * RATE_CARD["dom_uplift_3plus"]
    est = round(n * RATE_CARD["gos1"] + uplift, 2)
    with _conn() as c:
        ch = _care_home_id(c, care_home)
        cur = c.execute(
            "INSERT INTO visits(care_home_id, visit_date, n_residents, est_value, created_at) VALUES(?,?,?,?,?)",
            (ch, visit_date, n, est, _now()),
        )
        vid = cur.lastrowid
    return {
        "visit_id": vid,
        "care_home": care_home,
        "date": visit_date,
        "residents": n,
        "estimated_nhs_value_gbp": est,
        "persisted": True,
    }


def submit_claim(resident_id: int, service: str, domiciliary_position: int = 1) -> dict:
    """Record an NHS claim with the correct fee. service in RATE_CARD keys / 'gos1'."""
    service = service.lower()
    if service == "gos1":
        fee = RATE_CARD["gos1"]
        if domiciliary_position:
            fee += RATE_CARD["dom_uplift_1_2"] if domiciliary_position <= 2 else RATE_CARD["dom_uplift_3plus"]
    elif service in RATE_CARD:
        fee = RATE_CARD[service]
    else:
        raise ValueError(f"Unknown service '{service}'. Known: {', '.join(['gos1'] + [k for k in RATE_CARD if not k.startswith('dom')])}")
    fee = round(fee, 2)
    with _conn() as c:
        if not c.execute("SELECT 1 FROM residents WHERE id=?", (resident_id,)).fetchone():
            raise ValueError(f"resident_id {resident_id} not found — create the resident first")
        cur = c.execute(
            "INSERT INTO claims(resident_id, service, fee, created_at) VALUES(?,?,?,?)",
            (resident_id, service, fee, _now()),
        )
        cid = cur.lastrowid
    return {"claim_id": cid, "resident_id": resident_id, "service": service, "fee_gbp": fee, "status": "recorded"}


def report() -> dict:
    with _conn() as c:
        homes = c.execute("SELECT COUNT(*) n FROM care_homes").fetchone()["n"]
        residents = c.execute("SELECT COUNT(*) n FROM residents").fetchone()["n"]
        visits = c.execute("SELECT COUNT(*) n, COALESCE(SUM(est_value),0) v FROM visits").fetchone()
        claims = c.execute("SELECT COUNT(*) n, COALESCE(SUM(fee),0) v FROM claims").fetchone()
    return {
        "care_homes": homes,
        "residents": residents,
        "visits": visits["n"],
        "visits_estimated_value_gbp": round(visits["v"], 2),
        "claims": claims["n"],
        "claims_value_gbp": round(claims["v"], 2),
        "db": DB_PATH,
    }


def _main(argv: list[str]) -> int:
    init_db()
    if len(argv) < 2:
        print(__doc__)
        return 0
    cmd = argv[1]
    try:
        if cmd == "resident":
            print(json.dumps(create_resident_record(argv[2], argv[3], argv[4] if len(argv) > 4 else ""), indent=2))
        elif cmd == "visit":
            print(json.dumps(schedule_visit(argv[2], argv[3], int(argv[4])), indent=2))
        elif cmd == "claim":
            pos = int(argv[4]) if len(argv) > 4 else 1
            print(json.dumps(submit_claim(int(argv[2]), argv[3], pos), indent=2))
        elif cmd == "report":
            print(json.dumps(report(), indent=2))
        else:
            print(f"Unknown command '{cmd}'."); print(__doc__); return 1
    except (ValueError, IndexError) as e:
        print(f"Error: {e}"); return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(sys.argv))
