#!/usr/bin/env python3
"""Care Home Outreach Engine — Generates personalised emails, tracks responses, manages pipeline"""
import sqlite3
import json
from datetime import datetime, timedelta

DB = "/Users/nicholas/care-homes-essex.db"

def get_uncontacted(limit=10):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT * FROM care_homes WHERE contacted=0 ORDER BY residents DESC LIMIT ?", (limit,))
    cols = [d[0] for d in c.description]
    return [dict(zip(cols, r)) for r in c.fetchall()]

def generate_email(home):
    tier_price = 6000
    if home['residents'] > 45: tier_price = 15000
    if home['residents'] > 55: tier_price = 25000
    
    return {
        "to": home['email'],
        "subject": f"NHS-Compliant Eye Care for {home['name']} — Save Your Staff 10+ Hours/Month",
        "body": f"""Hi {home['contact'].replace('Ms ','').replace('Mr ','').replace('Mrs ','').replace('Dr ','')},

I'm Nick from Templeman Opticians. We provide professional domiciliary eye care to care homes across Essex, and I wanted to introduce our service to {home['name']}.

Unlike national providers who send different optometrists each visit, our model is deliberately different:

✓ Same optometrist on every visit — residents build genuine relationships
✓ Direct mobile number — no call centres, no ticket numbers
✓ 48-hour emergency repairs — not the 2-4 weeks national providers quote
✓ Zero admin for your staff — we handle all NHS claims, scheduling, and CQC documentation
✓ Dementia specialists — adapted techniques for residents with cognitive conditions

We're currently offering care homes in {home['location']} a free, no-obligation consultation. I'd love to visit {home['name']}, meet your team, and show you how we can reduce your staff's eye care admin while improving resident outcomes.

Block contracts start from £{tier_price:,}/year for {home['residents']} residents, with all NHS claims, documentation, and emergency repairs included.

Would you be open to a 15-minute chat this week?

Best regards,
Nick
Templeman Opticians
📞 01268 777729
📧 templemansopticians@live.co.uk
🌐 templeman-opticians.com""",
        "care_home": home['name'],
        "location": home['location'],
        "residents": home['residents'],
        "tier_price": tier_price
    }

def mark_contacted(home_id, method="email"):
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("UPDATE care_homes SET contacted=1, last_contact=? WHERE id=?", 
              (datetime.now().isoformat(), home_id))
    conn.commit()

def pipeline_report():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT contract_status, COUNT(*), SUM(contract_value) FROM care_homes GROUP BY contract_status")
    return [{"status": r[0], "homes": r[1], "value": r[2] or 0} for r in c.fetchall()]

def total_pipeline():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("SELECT SUM(contract_value), COUNT(*) FROM care_homes WHERE contract_status != 'lost'")
    val, count = c.fetchone()
    return {"total_value": val or 0, "active_homes": count}

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Commands: prospects [limit], email [home_id], report")
    elif sys.argv[1] == "prospects":
        homes = get_uncontacted(int(sys.argv[2]) if len(sys.argv) > 2 else 10)
        for h in homes:
            print(f"  {h['id']} | {h['name']} | {h['location']} | {h['residents']} beds | {h['email']}")
    elif sys.argv[1] == "email":
        homes = get_uncontacted(1)
        if homes:
            email = generate_email(homes[0])
            print(f"TO: {email['to']}")
            print(f"SUBJECT: {email['subject']}")
            print(email['body'])
    elif sys.argv[1] == "report":
        report = pipeline_report()
        total = total_pipeline()
        print(f"Pipeline: {total['active_homes']} homes | £{total['total_value']:,}")
        for r in report:
            print(f"  {r['status']}: {r['homes']} homes | £{r['value']:,}")
