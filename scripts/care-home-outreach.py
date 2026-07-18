#!/usr/bin/env python3
"""Automated care home outreach for Templeman Opticians"""
import sqlite3
import json
from datetime import datetime

DB = "/Users/nicholas/care-homes-essex.db"

def get_uncontacted_homes(limit=25):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM care_homes WHERE contacted=0 LIMIT ?", (limit,))
    return [{"id": r[0], "name": r[1], "location": r[2]} for r in c.fetchall()]

def log_outreach(home_id, method, result):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("INSERT INTO outreach_log (care_home_id, date, method, result) VALUES (?, ?, ?, ?)",
              (home_id, datetime.now().isoformat(), method, result))
    conn.commit()

def generate_email(home):
    return f"""
Subject: NHS-Compliant Eye Care for {home['name']} Residents

Hi {home['name']} Manager,

I'm Nick from Templeman Opticians. We provide professional domiciliary eye care to care homes across Essex.

Why we're different:
• Same optometrist every visit
• 48-hour emergency repairs (not 2-4 weeks)
• Zero admin burden - we handle all NHS claims
• CQC-aligned documentation included

Block contracts from £6,000/year. Let me know if you'd like a free consultation.

Best,
Nick
01268 777729
"""

if __name__ == "__main__":
    homes = get_uncontacted_homes(25)
    for home in homes:
        email = generate_email(home)
        print(f"Email for {home['name']} ({home['location']})")
        print("-" * 40)
        print(email[:200])
        log_outreach(home['id'], 'email', 'sent')
