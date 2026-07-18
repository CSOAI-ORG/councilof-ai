#!/usr/bin/env python3
"""
OUTREACH CONTROLLER — Fully Automated Care Home Outreach System
Learns from OutsideClinic & Specsavers to auto-generate, track, and optimize outreach
"""
import sqlite3, json, smtplib, os, sys, random
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from pathlib import Path

DB = "/Users/nicholas/care-homes-essex.db"
CONFIG = Path.home() / ".outreach" / "config.json"

# ─── TEMPLATES (inspired by OutsideClinic + Specsavers) ───
TEMPLATES = {
    "initial": {
        "subject": "NHS Eye Care for {name} — Same Optometrist Every Visit | Templeman Opticians Essex",
        "body": """Hi {contact_first},

I'm Nick from Templeman Opticians in Essex. We provide professional domiciliary eye care to care homes — and I wanted to introduce our service to {name}.

Unlike national providers who send different optometrists each time, here's what makes us different:

✅ Same optometrist on every visit — residents build genuine relationships, we learn their needs
✅ Direct mobile number — no call centres, no ticket numbers, no hold music
✅ 48-hour emergency repairs — not the 2-4 weeks national providers quote
✅ Zero admin for your staff — we handle 100% of NHS claims, scheduling, and CQC documentation
✅ Dementia specialists — adapted techniques for residents with cognitive conditions

Our block contracts cover all resident eye care for a fixed annual fee, saving your staff 10+ hours per month on eye care administration.

I'd love to visit {name}, meet your team, and provide a free no-obligation consultation. We can assess your residents' needs and give you a clear quote — same day.

Would you be open to a 15-minute call this week?

Best regards,
Nick
Templeman Opticians — Domiciliary Eye Care Essex
📞 01268 777729
📧 templemansopticians@live.co.uk
🌐 templeman-opticians.com

P.S. We're the only Essex domiciliary optician offering a dedicated mobile number — no call centres, ever."""
    },
    "follow_up_7days": {
        "subject": "Re: Eye Care for {name} — Quick Follow-Up | Templeman Opticians",
        "body": """Hi {contact_first},

I wanted to follow up on my email last week about providing domiciliary eye care for {name}.

I know how busy care home managers are, so just a quick reminder of what we offer:

• All resident eye tests covered for a fixed annual fee
• 100% NHS claims handled by us — zero admin for your staff
• Emergency glasses repair within 48 hours
• CQC documentation provided automatically

If you'd like, I can pop by for 15 minutes to introduce myself and answer any questions. No commitment whatsoever.

Best,
Nick
📞 01268 777729"""
    }
}

# ─── DATABASE ───
def init_db():
    conn = sqlite3.connect(DB)
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS outreach_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        care_home_id TEXT, template TEXT, stage TEXT,
        sent_at TEXT, opened BOOLEAN DEFAULT 0,
        replied BOOLEAN DEFAULT 0, notes TEXT
    )""")
    c.execute("""CREATE TABLE IF NOT EXISTS pipeline (
        care_home_id TEXT PRIMARY KEY,
        stage TEXT DEFAULT 'prospect',
        value INTEGER DEFAULT 0,
        probability INTEGER DEFAULT 20,
        next_action TEXT,
        next_date TEXT,
        notes TEXT
    )""")
    conn.commit()
    return conn

def get_homes(stage='prospect', limit=None):
    conn = init_db()
    c = conn.cursor()
    query = """SELECT ch.*, COALESCE(p.stage,'prospect') as pipeline_stage,
        COALESCE(p.value,0) as pipe_value, COALESCE(p.probability,20) as pipe_prob
        FROM care_homes ch LEFT JOIN pipeline p ON ch.id = p.care_home_id
        WHERE COALESCE(p.stage,'prospect') = ? ORDER BY ch.residents DESC"""
    if limit: query += f" LIMIT {limit}"
    c.execute(query, (stage,))
    cols = [d[0] for d in c.description]
    return [dict(zip(cols, r)) for r in c.fetchall()]

def format_email(home, template_name):
    tmpl = TEMPLATES[template_name]
    ctx = {
        'name': home['name'],
        'location': home['location'],
        'residents': home['residents'],
        'contact_first': home['contact'].replace('Ms ','').replace('Mr ','').replace('Mrs ','').replace('Dr ','').split()[0],
        'contact': home['contact'],
        'email': home['email'],
        'phone': home['phone']
    }
    return {
        'to': home['email'],
        'subject': tmpl['subject'].format(**ctx),
        'body': tmpl['body'].format(**ctx),
        'home_id': home['id'],
        'template': template_name
    }

def log_send(conn, home_id, template, stage='sent'):
    conn.cursor().execute("INSERT INTO outreach_log (care_home_id,template,stage,sent_at) VALUES (?,?,?,?)",
        (home_id, template, stage, datetime.now().isoformat()))
    conn.cursor().execute("UPDATE care_homes SET contacted=1, last_contact=? WHERE id=?",
        (datetime.now().isoformat(), home_id))
    conn.cursor().execute("""INSERT OR REPLACE INTO pipeline 
        (care_home_id,stage,next_action,next_date) VALUES (?,?,?,?)""",
        (home_id, 'contacted', 'Follow up in 7 days', (datetime.now()+timedelta(days=7)).isoformat()))
    conn.commit()

def pipeline_report():
    conn = init_db()
    c = conn.cursor()
    c.execute("""SELECT stage, COUNT(*), SUM(value) FROM pipeline GROUP BY stage""")
    return [{'stage': r[0], 'count': r[1], 'value': r[2] or 0} for r in c.fetchall()]

# ─── BATCH GENERATOR ───
def batch_generate(homes, template='initial', output_dir=None):
    """Generate all emails for batch sending"""
    emails = []
    for home in homes:
        if not home.get('email'): continue
        email = format_email(home, template)
        emails.append(email)
    
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        for i, email in enumerate(emails):
            fname = f"{output_dir}/{i+1:02d}_{email['home_id']}_{template}.txt"
            with open(fname, 'w') as f:
                f.write(f"TO: {email['to']}\n")
                f.write(f"SUBJECT: {email['subject']}\n")
                f.write("="*60 + "\n\n")
                f.write(email['body'])
    return emails

# ─── DASHBOARD ───
def dashboard():
    report = pipeline_report()
    homes = get_homes()
    total_residents = sum(h.get('residents',0) for h in homes)
    contacted = [h for h in homes if h.get('contacted')]
    
    print("""
╔══════════════════════════════════════════════╗
║   TEMPLEMAN OPTICIANS — OUTREACH DASHBOARD  ║
╠══════════════════════════════════════════════╣
║  Care Homes: {total_homes:>3}  |  Residents: {total_res:>5}  ║
║  Contacted:  {contacted_homes:>3}  |  To Contact: {uncontacted:>3} ║
╠══════════════════════════════════════════════╣""".format(
        total_homes=len(homes), total_res=total_residents,
        contacted_homes=len(contacted), uncontacted=len(homes)-len(contacted)))
    
    for r in report:
        print("║  {stage:12}  {count:>3} homes  £{value:>8,}     ║".format(**r))
    print("╚══════════════════════════════════════════════╝")

if __name__ == "__main__":
    init_db()
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'dashboard'
    
    if cmd == 'dashboard':
        dashboard()
    elif cmd == 'generate':
        template = sys.argv[2] if len(sys.argv) > 2 else 'initial'
        homes = get_homes('prospect', int(sys.argv[3]) if len(sys.argv) > 3 else None)
        emails = batch_generate(homes, template, '/Users/nicholas/clawd/outreach-system/emails')
        print(f"✅ Generated {len(emails)} emails → /Users/nicholas/clawd/outreach-system/emails/")
        for e in emails[:3]:
            print(f"  → {e['to']}: {e['subject'][:60]}...")
    elif cmd == 'log':
        conn = init_db()
        log_send(conn, sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'initial')
        print(f"✅ Logged {sys.argv[2]} as contacted")
    elif cmd == 'followup':
        homes = get_homes('contacted')
        emails = batch_generate(homes, 'follow_up_7days', '/Users/nicholas/clawd/outreach-system/emails/followups')
        print(f"✅ Generated {len(emails)} follow-up emails")
    else:
        print("Commands: dashboard | generate [template] [limit] | log [home_id] | followup")
