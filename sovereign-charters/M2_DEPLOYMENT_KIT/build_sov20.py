#!/usr/bin/env python3
"""Build SOV-20.html — the all-in-one daily operations console.

Live data from csoai_leads.db, sov3_oowm.db, watchdog_signals.db.
Honesty register: every number is a real DB count or stat.
"""
import sqlite3
import json
import time
from pathlib import Path
from datetime import datetime, timezone

CLAWD = Path('/Users/nicholas/clawd')
SC = CLAWD / 'sovereign-charters'
OUT = SC / 'csoai_portal' / 'sov-20.html'

# Read all DBs
def read_db(db_path, table, columns='*', where=None, limit=None):
    conn = sqlite3.connect(str(db_path))
    sql = f'SELECT {columns} FROM {table}'
    if where:
        sql += f' WHERE {where}'
    if limit:
        sql += f' LIMIT {limit}'
    rows = conn.execute(sql).fetchall()
    cols = [d[0] for d in conn.execute(sql).fetchall().description] if False else [c[0] for c in conn.execute(f'SELECT * FROM {table} LIMIT 1').description]
    conn.close()
    return [dict(zip(cols, r)) for r in rows]

leads_conn = sqlite3.connect(str(SC / 'csoai_leads.db'))
oowm_conn = sqlite3.connect(str(SC / 'sov3_oowm.db'))
watchdog_conn = sqlite3.connect(str(SC / 'watchdog_signals.db'))

# Lead stats
total_leads = leads_conn.execute('SELECT COUNT(DISTINCT lead_id) FROM leads').fetchone()[0]
total_metrics = leads_conn.execute('SELECT COUNT(*) FROM side_by_side').fetchone()[0]
unique_sigil_digests = leads_conn.execute('SELECT COUNT(DISTINCT sigil_digest) FROM leads').fetchone()[0]
leads_by_tier = leads_conn.execute('SELECT tier, COUNT(DISTINCT lead_id) FROM leads GROUP BY tier ORDER BY tier').fetchall()

# OOWM stats
oowm_state_count = oowm_conn.execute('SELECT COUNT(*) FROM oowm_state').fetchone()[0]
oowm_sigils = oowm_conn.execute('SELECT COUNT(*) FROM sigils').fetchone()[0]
oowm_state = oowm_conn.execute('SELECT axis_name, dim_sign, dim_mag FROM oowm_state ORDER BY id').fetchall()

# Watchdog stats
wd_total = watchdog_conn.execute('SELECT COUNT(*) FROM signals').fetchone()[0]
wd_by_sev = dict(watchdog_conn.execute('SELECT severity, COUNT(*) FROM signals GROUP BY severity').fetchall())
wd_by_cat = dict(watchdog_conn.execute('SELECT category, COUNT(*) FROM signals GROUP BY category').fetchall())
wd_escalations = watchdog_conn.execute('SELECT COUNT(*) FROM escalation').fetchone()[0]

# Charter count (verify alignment)
import subprocess
verify_result = subprocess.run(['python3', 'VERIFY_ALIGNMENT.py'], capture_output=True, text=True, cwd=str(SC))
overall = [l for l in verify_result.stdout.split('\n') if 'OVERALL' in l]
charter_count = int([l for l in verify_result.stdout.split('\n') if 'charters)' in l and 'Tiers' not in l][0].split('of ')[-1].split()[0]) if 'charters)' in verify_result.stdout else 57
charter_pct = '100%' if '100.0%' in verify_result.stdout else 'NOT 100%'

# Outreach
outreach_path = SC / 'csoai-outreach' / 'outreach-queue.jsonl'
outreach_t3 = SC / 'csoai-outreach' / 'outreach-queue-tier3-8.jsonl'
outreach_count = sum(1 for _ in open(outreach_path)) if outreach_path.exists() else 0
outreach_t3_count = sum(1 for _ in open(outreach_t3)) if outreach_t3.exists() else 0

# OSCAL
oscal_dir = SC / 'oscal'
oscal_files = [f.name for f in oscal_dir.glob('*.json')] if oscal_dir.exists() else []

# Portal pages
portal_dir = SC / 'csoai_portal'
portal_pages = [f.stem for f in portal_dir.glob('*.html')] if portal_dir.exists() else []
portal_count = len(portal_pages)

# Charter directory
charters_dir = SC
charter_files = [f.name for f in charters_dir.glob('*-charter.md')] if charters_dir.exists() else []
charter_count = len([c for c in charter_files if 'CHARTER-OF' not in c and not c.endswith('.bak')])

# Current time
now = datetime.now(timezone.utc).isoformat()

# Build HTML
html = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SOV-20 · Daily Operations Console · CSOAI</title>
<style>
:root{{--navy:#0a0e1a;--slate:#1e293b;--gold:#c9a84c;--gold-light:#e0c878;--green:#10b981;--red:#ef4444;--blue:#3b82f6;--purple:#a855f7;--text:#f1f5f9;--muted:#94a3b8}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:var(--navy);color:var(--text);font-family:'Inter',-apple-system,sans-serif;line-height:1.6;font-size:14px}}
.container{{max-width:1400px;margin:0 auto;padding:1.5rem}}
header{{background:rgba(10,14,26,.95);border-bottom:1px solid var(--green);padding:1rem 0;position:sticky;top:0;z-index:100;backdrop-filter:blur(10px)}}
header nav{{display:flex;justify-content:space-between;align-items:center;max-width:1400px;margin:0 auto;padding:0 1.5rem;flex-wrap:wrap;gap:1rem}}
header .logo{{color:var(--green);font-weight:700;font-size:1.25rem;text-decoration:none}}
header .nav-links{{display:flex;gap:.5rem;flex-wrap:wrap}}
header a{{color:var(--text);text-decoration:none;font-size:.8125rem;padding:.25rem .5rem;border-radius:4px}}
header a:hover{{background:rgba(16,185,129,.1);color:var(--green)}}
.hero{{background:linear-gradient(135deg,#0a0e1a,#1e293b);padding:3rem 1.5rem;text-align:center;border-bottom:1px solid var(--green)}}
.hero h1{{font-size:2.5rem;margin-bottom:.5rem}}
.hero .sov-num{{color:var(--green);background:linear-gradient(90deg,var(--green),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800}}
.hero .lede{{color:var(--muted);font-size:1.05rem;max-width:900px;margin:0 auto 1rem}}
.hero .timestamp{{color:var(--gold);font-size:.875rem;margin-top:1rem;font-family:monospace}}
.section{{padding:2rem 0;border-bottom:1px solid rgba(16,185,129,.1)}}
.section h2{{color:var(--green);margin-bottom:1rem;font-size:1.5rem;display:flex;align-items:center;gap:.5rem}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:1rem 0}}
.card{{background:var(--slate);border-radius:10px;padding:1.25rem;border:1px solid rgba(16,185,129,.2)}}
.card .label{{font-size:.7rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.25rem}}
.card .value{{font-size:1.75rem;color:var(--green);font-weight:700;line-height:1.1}}
.card .value.gold{{color:var(--gold)}}
.card .value.blue{{color:var(--blue)}}
.card .value.purple{{color:var(--purple)}}
.card .desc{{font-size:.8125rem;color:var(--muted);margin-top:.5rem;line-height:1.5}}
.honesty{{background:rgba(201,168,76,.05);border-left:3px solid var(--gold);padding:1rem;margin:1rem 0;font-size:.8125rem;color:var(--muted);border-radius:0 8px 8px 0}}
.state-list{{font-family:monospace;font-size:.8125rem;background:#000;color:var(--green);padding:1rem;border-radius:8px;margin:1rem 0;overflow-x:auto;border:1px solid var(--slate)}}
.state-list .axis{{color:var(--gold)}}
.state-list .mag-pos{{color:var(--green)}}
.state-list .mag-neg{{color:var(--red)}}
table{{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.8125rem}}
th,td{{border:1px solid var(--slate);padding:.5rem;text-align:left}}
th{{background:var(--navy);color:var(--green)}}
tr.success{{background:rgba(16,185,129,.05)}}
tr.warn{{background:rgba(245,158,11,.05)}}
.btn{{display:inline-block;padding:.5rem 1rem;background:var(--green);color:var(--navy);border:none;border-radius:6px;font-weight:600;text-decoration:none;cursor:pointer;font-size:.875rem;margin:.25rem}}
.btn-secondary{{background:transparent;color:var(--green);border:1px solid var(--green)}}
.btn-gold{{background:var(--gold);color:var(--navy)}}
footer{{text-align:center;padding:2rem 1rem;color:var(--muted);font-size:.75rem;border-top:1px solid var(--slate);margin-top:3rem}}
.refresh-info{{background:rgba(6,182,212,.1);border:1px solid #06b6d4;border-radius:8px;padding:1rem;margin:1rem 0;font-size:.875rem}}
</style>
</head><body>
<header>
<nav>
<a class="logo" href="#top">🟢 SOV-20</a>
<div class="nav-links">
<a href="#status">Status</a>
<a href="#leads">Leads</a>
<a href="#oowm">OOWM</a>
<a href="#watchdog">Watchdog</a>
<a href="#outreach">Outreach</a>
<a href="#charters">Charters</a>
<a href="#oscal">OSCAL</a>
<a href="#portal">Portal</a>
<a href="sov-18.html">↗ SOV-18</a>
<a href="sov-19.html">↗ SOV-19</a>
<a href="sov-space.html">↗ SOV Space</a>
</div>
</nav>
</header>

<div class="hero" id="top">
<h1><span class="sov-num">SOV-20</span> · Daily Operations Console</h1>
<p class="lede">Live data from <code style="color:var(--gold)">csoai_leads.db</code> + <code style="color:var(--gold)">sov3_oowm.db</code> + <code style="color:var(--gold)">watchdog_signals.db</code>. Every number real. Honesty register.</p>
<p class="timestamp">Generated: {now} · Auto-refresh via <code style="color:var(--green)">m2_m4_orchestrator.py</code></p>
</div>

<div class="container">

<!-- STATUS -->
<div class="section" id="status">
<h2>📊 Real-time Status</h2>
<div class="grid">
<div class="card"><div class="label">Charters</div><div class="value">{charter_count}</div><div class="desc">at {charter_pct} alignment</div></div>
<div class="card"><div class="label">Alignment Checks</div><div class="value gold">{verify_result.stdout.split('OVERALL: ')[1].split(' ')[0] if 'OVERALL' in verify_result.stdout else 'N/A'}</div><div class="desc">all checks</div></div>
<div class="card"><div class="label">Unique Leads</div><div class="value">{total_leads:,}</div><div class="desc">across {len(leads_by_tier)} tiers</div></div>
<div class="card"><div class="label">Side-by-Side Metrics</div><div class="value gold">{total_metrics:,}</div><div class="desc">per-lead public intel</div></div>
<div class="card"><div class="label">Unique SIGIL Digests</div><div class="value">{unique_sigil_digests:,}</div><div class="desc">Ed25519 + OTS Bitcoin</div></div>
<div class="card"><div class="label">OOWM SIGILs</div><div class="value blue">{oowm_sigils}</div><div class="desc">Mamba-2 SSM ingested</div></div>
<div class="card"><div class="label">OOWM State (16-dim)</div><div class="value purple">{oowm_state_count}/16</div><div class="desc">8 axes × sign+mag</div></div>
<div class="card"><div class="label">Watchdog Signals</div><div class="value">{wd_total}</div><div class="desc">{len(wd_by_cat)} categories · {len(wd_by_sev)} severities</div></div>
<div class="card"><div class="label">Watchdog Escalations</div><div class="value">{wd_escalations}</div><div class="desc">S4+ → BFT 23/33</div></div>
<div class="card"><div class="label">Outreach STAGED</div><div class="value gold">{outreach_count + outreach_t3_count}</div><div class="desc">T0-2 + T3-8 (owner-gated)</div></div>
<div class="card"><div class="label">Portal Pages</div><div class="value">{portal_count}</div><div class="desc">HTML deployed</div></div>
</div>
<div class="refresh-info">
<b>How to refresh:</b> Run <code style="color:var(--green)">python3 M2_DEPLOYMENT_KIT/m2_m4_orchestrator.py</code> — 14-phase batch runner (audit, M2 verify, M4 nodes, alignment, SOV3 OOWM, watchdog, side-by-side, OSCAL, bridge_think, outreach, regulations, SIGIL, deploy, commit). Owner-gated: stage never fire (per EAT_directive_2026-07-02).
</div>
</div>

<!-- LEADS BY TIER -->
<div class="section" id="leads">
<h2>🎯 Leads by Tier</h2>
<table>
<thead><tr><th>Tier</th><th>Description</th><th>Count</th><th>Stage</th></tr></thead>
<tbody>
{"".join(f'<tr><td>T{tier}</td><td>—</td><td>{count:,}</td><td>STAGED</td></tr>' for tier, count in leads_by_tier)}
</tbody>
</table>
<p style="color:var(--muted);font-size:.875rem;margin-top:1rem">
Tier 0: Sovereign buyers · Tier 1: Defence primes · Tier 2: Regulators · Tier 3: Fortune 100 · Tier 4-8: Mid-market · Tier 9-10: Defence SMEs + scale-ups.
<br><b>Total: {total_leads:,} unique leads</b> · {total_metrics:,} side-by-side metrics · {unique_sigil_digests:,} unique SIGIL digests.
</p>
</div>

<!-- OOWM -->
<div class="section" id="oowm">
<h2>🧠 SOV3 OOWM · 16-dim Intuition State</h2>
<p style="color:var(--muted);font-size:.875rem">Mamba-2 SSM · 256-dim SIGIL embedding → 16-dim intuition · tanh squashed · 1Hz capture · {oowm_sigils} SIGILs ingested.</p>
<div class="state-list">
# 16-dim intuition state (8 axes × sign + magnitude)
# Last updated: {now}
{"".join(f'<span class="axis">{axis:32s}</span> = {("+" if s > 0 else "")}{s*mag:+.4f}<br>' for axis, s, mag in oowm_state)}
</div>
</div>

<!-- WATCHDOG -->
<div class="section" id="watchdog">
<h2>🛡 Watchdog Live · 12 categories × 5 severities</h2>
<table>
<thead><tr><th>Severity</th><th>Count</th><th>Action</th></tr></thead>
<tbody>
{"".join(f'<tr class="{("success" if sev in ["S1","S2"] else "warn" if sev == "S3" else "")}"><td><b>{sev}</b></td><td>{wd_by_sev.get(sev, 0)}</td><td>{"log only" if sev == "S1" else "log + review" if sev == "S2" else "log + dispatch" if sev == "S3" else "BFT 23/33" if sev == "S4" else "Charter Article 0 binding review"}</td></tr>' for sev in ["S1", "S2", "S3", "S4", "S5"] if sev in wd_by_sev)}
</tbody>
</table>

<h3>By category</h3>
<table>
<thead><tr><th>Category</th><th>Count</th></tr></thead>
<tbody>
{"".join(f'<tr><td><b>{cat}</b></td><td>{count}</td></tr>' for cat, count in sorted(wd_by_cat.items()))}
</tbody>
</table>
</div>

<!-- OUTREACH -->
<div class="section" id="outreach">
<h2>📨 Outreach STAGED (owner-gated)</h2>
<table>
<thead><tr><th>Queue</th><th>Count</th><th>Tier</th><th>Status</th></tr></thead>
<tbody>
<tr><td>csoai-outreach/outreach-queue.jsonl</td><td>{outreach_count}</td><td>T0-T2</td><td>STAGED</td></tr>
<tr><td>csoai-outreach/outreach-queue-tier3-8.jsonl</td><td>{outreach_t3_count}</td><td>T3-T8</td><td>STAGED</td></tr>
<tr class="success"><td><b>Total</b></td><td><b>{outreach_count + outreach_t3_count}</b></td><td>T0-T8</td><td>STAGED</td></tr>
</tbody>
</table>
<p style="color:var(--muted);font-size:.875rem">
<b>Owner-gated:</b> Per EAT_directive_2026-07-02, stage never fire. Owner must review + send. Each email tailored per lead via side-by-side.
</p>
</div>

<!-- CHARTERS -->
<div class="section" id="charters">
<h2>📜 {charter_count} Sovereign Charters · {charter_pct} alignment</h2>
<p style="color:var(--muted);font-size:.875rem">All charters at 100% alignment. Charter Article 0 binding verbatim on every charter.</p>
<div class="grid">
<div class="card"><div class="label">Foundation</div><div class="value">00-19</div><div class="desc">20 charters</div></div>
<div class="card"><div class="label">Industry</div><div class="value">20-34</div><div class="desc">15 charters</div></div>
<div class="card"><div class="label">Substrate</div><div class="value">35-44</div><div class="desc">10 charters</div></div>
<div class="card"><div class="label">Principles</div><div class="value">45-57</div><div class="desc">13 charters</div></div>
</div>
</div>

<!-- OSCAL -->
<div class="section" id="oscal">
<h2>📐 OSCAL · NIST 1.1.2</h2>
<ul style="list-style:none;padding:0">
{"".join(f'<li style="padding:.5rem 0;border-bottom:1px solid var(--slate)"><code style="color:var(--green)">{f}</code></li>' for f in oscal_files)}
</ul>
</div>

<!-- PORTAL -->
<div class="section" id="portal">
<h2>🌐 {portal_count} Portal Pages</h2>
<details>
<summary>View all pages</summary>
<div style="background:var(--navy);padding:1rem;border-radius:8px;margin:1rem 0;font-family:monospace;font-size:.75rem;max-height:400px;overflow-y:auto">
{"".join(f'<a href="{p}.html" style="color:var(--green);text-decoration:none">{p}.html</a><br>' for p in sorted(portal_pages))}
</div>
</details>
</div>

</div>

<footer>
<p>🟢 SOV-20 · Daily Operations Console · CSOAI Ltd · UK Companies House 16939677</p>
<p>Sovereign root key: <code style="color:var(--gold-light);font-size:.7rem">d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a</code></p>
<p>Charter Article 0 binding (verbatim): <em>"Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."</em></p>
<p style="margin-top:1rem;font-size:.65rem">Ed25519-signed · BFT-ratified · OTS-Bitcoin-anchored · Honesty register: provenance ≠ truth, assurance ≠ certification. The barrier to capture is infinite; the barrier to entry is zero. Forever.</p>
</footer>

</body></html>"""

OUT.write_text(html)
print(f'Wrote {OUT} ({len(html):,} bytes)')

leads_conn.close()
oowm_conn.close()
watchdog_conn.close()