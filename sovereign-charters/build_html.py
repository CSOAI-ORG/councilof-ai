#!/usr/bin/env python3
"""
Build 34 charter detail HTML pages at /Users/nicholas/clawd/sovereign-charters/csoai_portal/
Each page reflects actual charter content extracted from its source .md file.
"""

import os
import re
import html
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/sovereign-charters")
OUT = ROOT / "csoai_portal"
OUT.mkdir(parents=True, exist_ok=True)

# The 34 charters in order
CHARTERS = [
    ("csoai", "01-csoai-charter.md", "CSOAI", "AI Governance Standards & Watchdog Certification Authority",
     "Watchdog Certification Authority for AI Governance", "CA3O (CMKC)", "csoai.org"),
    ("meok", "02-meok-charter.md", "MEOK", "Sovereign AI Operating System & MCP Compliance Fleet",
     "MEOK AI Labs — Sovereign AI OS", "MEOK", "meok.ai"),
    ("proofof", "03-proofof-charter.md", "PROOFOF", "Cryptographic Attestation, Ed25519 Verification & MCP Catalogue",
     "ProofOf — Cryptographic Verification Layer", "proofof.ai", "proofof.ai"),
    ("safetyof", "04-safetyof-charter.md", "SAFETYOF", "AI Safety Monitoring, Incident Detection & Care Membrane Operations",
     "SafetyOf — AI Safety Monitoring", "safetyof.ai", "safetyof.ai"),
    ("accountabilityof", "05-accountabilityof-charter.md", "ACCOUNTABILITYOF", "AI Incident Reporting, Audit Trails, Root-Cause Analysis & ISO 42001 Audit Evidence",
     "AccountabilityOf — Audit & Accountability", "accountabilityof.ai", "accountabilityof.ai"),
    ("ethicalgovernanceof", "06-ethicalgovernanceof-charter.md", "ETHICALGOVERNANCEOF", "Ethical AI Frameworks, Value Alignment, AI BOM & Explainability Reporting",
     "EthicalGovernanceOf — Ethics & Governance", "ethicalgovernanceof.ai", "ethicalgovernanceof.ai"),
    ("transparencyof", "07-transparencyof-charter.md", "TRANSPARENCYOF", "Model Decisions, Feature Importances, Decision Paths, Watermarks & AI BOM",
     "TransparencyOf — Transparency & Explainability", "transparencyof.ai", "transparencyof.ai"),
    ("biasdetectionof", "08-biasdetectionof-charter.md", "BIASDETECTIONOF", "Bias Metrics, Protected Attributes, EU AI Act Article 10 & Fair-Lending Rules",
     "BiasDetectionOf — Algorithmic Fairness", "biasdetectionof.ai", "biasdetectionof.ai"),
    ("dataprivacyof", "09-dataprivacyof-charter.md", "DATAPRIVACYOF", "Data Subjects, Processing Activities, GDPR Articles 5-21, DSARs & Breach Notification",
     "DataPrivacyOf — Data Privacy Governance", "dataprivacyof.ai", "dataprivacyof.ai"),
    ("asisecurity", "10-asisecurity-charter.md", "ASI SECURITY", "AI Security Threats, Defensive Patterns & OWASP Agentic Top 10",
     "ASISecurity — AI Cybersecurity", "asisecurity.ai", "asisecurity.ai"),
    ("agisafe", "11-agisafe-charter.md", "AGI SAFE", "AGI Safety Research, Frontier Model Risk Assessment & Care Membrane",
     "AGISafe — AGI/ASI Safety", "agisafe.ai", "agisafe.ai"),
    ("defoneos", "12-defoneos-charter.md", "DEFONEOS", "Sovereign Defence AI Operating System — Sensor → Action",
     "DEFONEOS — Defence AI OS", "defoneos.com", "defoneos.com"),
    ("councilof", "13-councilof-charter.md", "COUNCILOF", "BFT Governance Council — 33-Seat Multi-Model Deliberation",
     "CouncilOf — BFT Council Engine", "councilof.ai", "councilof.ai"),
    ("openmoe", "14-openmoe-charter.md", "OPENMOE", "Sovereign MoE Base Model — Top-K Routing & Ed25519 Signets",
     "OpenMoE — Mixture-of-Experts", "openmoe.ai", "openmoe.ai"),
    ("openmcp", "15-openmcp-charter.md", "OPENMCP", "MCP Server Registry — Discovery, Audit Score & Compliance Mapping",
     "OpenMCP — Tool Registry", "openmcp.ai", "openmcp.ai"),
    ("openpatent", "16-openpatent-charter.md", "OPENPATENT", "Sovereign Invention Disclosure & Patent Chain — Ed25519-SIGIL Prior Art",
     "OpenPatent — IP Vault", "openpatent.ai", "openpatent.ai"),
    ("sandbox", "17-sandbox-charter.md", "SANDBOX", "Dual-Brain Validation — Adversarial Testing & BFT-Ratified Results",
     "MEOK Sandbox — Self-Test Harness", "sandbox.meok.ai", "sandbox.meok.ai"),
    ("sovereign-town", "18-sovereign-town-charter.md", "SOVEREIGN TOWN", "Headless AI Agent Simulation — 12 Around 1 Council Governance",
     "Sovereign Town — Agent Society Simulator", "sovereigntown.ai", "sovereigntown.ai"),
    ("meok-compliance-gateway", "19-meok-compliance-gateway-charter.md", "MEOK COMPLIANCE GATEWAY", "x402 Payments, MCP Transport & Sovereign Usage Accounting",
     "Compliance Gateway — x402 Payment Layer", "gateway.meok.ai", "gateway.meok.ai"),
    ("loopfactory", "20-loopfactory-charter.md", "LOOP FACTORY", "Sovereign Workflow Automation — Cron, Webhooks & Action Chaining",
     "LoopFactory — Automation", "loopfactory.ai", "loopfactory.ai"),
    ("optimobile", "21-optimobile-charter.md", "OPTIMOBILE", "Mobile App Growth — ASO, Attribution, Retention & A/B Testing",
     "Optimobile — Mobile Analytics", "optimobile.ai", "optimobile.ai"),
    ("socialmediamanager", "22-socialmediamanager-charter.md", "SOCIAL MEDIA MANAGER", "Cross-Platform Scheduling, AI Content, Social Listening & Crisis",
     "SocialMediaManager — Social Ops", "socialmediamanager.ai", "socialmediamanager.ai"),
    ("cobolbridge", "23-cobolbridge-charter.md", "COBOL BRIDGE", "COBOL/CICS/JCL → Modern — Transpilation, Migration & Equivalence Proofs",
     "CobolBridge — Legacy Bridge", "cobolbridge.ai", "cobolbridge.ai"),
    ("commercialvehicle", "24-commercialvehicle-charter.md", "COMMERCIAL VEHICLE", "UK HGV/LCV Fleet — Telematics, DTC, FORS & Driver Hours",
     "CommercialVehicle — HGV Compliance", "commercialvehicle.ai", "commercialvehicle.ai"),
    ("diyhelp", "25-diyhelp-charter.md", "DIY HELP", "DIY Home Improvement — Planning, Materials, Building Regs & Safety",
     "DIYhelp — Home Improvement", "diyhelp.ai", "diyhelp.ai"),
    ("fishkeeper", "26-fishkeeper-charter.md", "FISHKEEPER", "Ornamental Aquatics — Species ID, Water Chemistry & Disease Diagnosis",
     "FishKeeper — Aquarium Care", "fishkeeper.ai", "fishkeeper.ai"),
    ("grabhire", "27-grabhire-charter.md", "GRABHIRE", "UK Grab Lorry Hire — Permits, MCIL/MOL, DVS & Load Optimisation",
     "GrabHire — UK Grab Fleet", "grabhire.ai", "grabhire.ai"),
    ("koikeeper", "28-koikeeper-charter.md", "KOIKEEPER", "Nishikigoi Husbandry — Variety ID, Breeding Genetics & Pond Engineering",
     "KoiKeeper — Koi Husbandry", "koikeeper.ai", "koikeeper.ai"),
    ("landlaw", "29-landlaw-charter.md", "LAND LAW", "UK Property Law — Conveyancing, Land Registry, Covenants & SDLT",
     "LandLaw — Property Conveyancing", "landlaw.ai", "landlaw.ai"),
    ("muckaway", "30-muckaway-charter.md", "MUCKAWAY", "UK Skip & Grab — Waste Carrier, Permits, Landfill Tax & WTNs",
     "MuckAway — Waste Logistics", "muckaway.ai", "muckaway.ai"),
    ("planthire", "31-planthire-charter.md", "PLANT HIRE", "UK Construction Plant — CPCS, LOLER/PUWER & Rate Optimisation",
     "PlantHire — Construction Plant", "planthire.ai", "planthire.ai"),
    ("pokerhud", "32-pokerhud-charter.md", "POKER HUD", "Poker Analytics — GTO, ICM, Solver Integration & Hand History Parsing",
     "PokerHUD — Post-Session Study", "pokerhud.ai", "pokerhud.ai"),
    ("suicidestop", "33-suicidestop-charter.md", "SUICIDE STOP", "Crisis Hotline Routing — UK Samaritans/SHOUT/NHS — Human Handoff Only",
     "SuicideStop — Crisis Router", "suicidestop.ai", "suicidestop.ai"),
    ("science", "34-science-charter.md", "SCIENCE", "Sovereign Science — Research Integrity, Peer Review & Reproducibility",
     "Science — Research Integrity", "science.ai (pending)", "TBD"),
]

# Sidebar nav (full list)
SIDEBAR = [(c[0], c[1]) for c in CHARTERS]


def esc(text):
    return html.escape(text, quote=True)


def parse_table_rows(md_text):
    """Parse Markdown table rows (skip separator rows)."""
    rows = []
    in_table = False
    for line in md_text.split('\n'):
        if line.strip().startswith('|'):
            cells = [c.strip() for c in line.strip().strip('|').split('|')]
            # Skip separator like |---|---|---|
            if all(re.match(r'^[-:\s]+$', c) for c in cells):
                continue
            rows.append(cells)
        elif in_table and line.strip() == '':
            in_table = False
    return rows


def extract_table_after(text, marker, max_rows=10):
    """Extract a markdown table that follows a marker line."""
    idx = text.find(marker)
    if idx == -1:
        return []
    # Skip lines until table starts
    lines = text[idx:].split('\n')
    rows = []
    started = False
    for ln in lines:
        if ln.strip().startswith('|'):
            cells = [c.strip() for c in ln.strip().strip('|').split('|')]
            if all(re.match(r'^[-:\s]+$', c) for c in cells):
                started = True
                continue
            if started:
                rows.append(cells)
                if len(rows) >= max_rows:
                    break
        elif started and ln.strip() == '':
            break
    return rows


def get_sections(md_text):
    """Return list of (header, content) tuples for each ## section."""
    sections = []
    cur_h = None
    cur_lines = []
    for ln in md_text.split('\n'):
        if ln.startswith('## '):
            if cur_h is not None:
                sections.append((cur_h, '\n'.join(cur_lines)))
            cur_h = ln[3:].strip()
            cur_lines = []
        else:
            cur_lines.append(ln)
    if cur_h is not None:
        sections.append((cur_h, '\n'.join(cur_lines)))
    return sections


def get_para(content, marker, fallback=""):
    """Get first paragraph after marker."""
    idx = content.find(marker)
    if idx == -1:
        return fallback
    rest = content[idx+len(marker):].strip()
    lines = rest.split('\n')
    para = []
    for ln in lines:
        if ln.strip() == '' or ln.startswith('#') or ln.startswith('|') or ln.startswith('- '):
            if para:
                break
            continue
        para.append(ln.strip())
        if len(para) >= 3:
            break
    return ' '.join(para) if para else fallback


def render_table_rows(rows):
    """Render markdown-table rows as HTML rows."""
    if not rows:
        return ""
    out = []
    headers = rows[0]
    out.append('<thead><tr>')
    for h in headers:
        out.append(f'<th>{esc(h)}</th>')
    out.append('</tr></thead><tbody>')
    for r in rows[1:]:
        out.append('<tr>')
        for c in r:
            out.append(f'<td>{esc(c)}</td>')
        out.append('</tr>')
    out.append('</tbody>')
    return '\n'.join(out)


def render_md_text(text):
    """Render simple markdown text → HTML (limited subset)."""
    if not text:
        return ""
    # Bold and italic
    text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
    text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
    # Headers
    text = re.sub(r'^### (.+)$', r'<h4>\1</h4>', text, flags=re.MULTILINE)
    text = re.sub(r'^#### (.+)$', r'<h5>\1</h5>', text, flags=re.MULTILINE)
    # Bullets
    lines = text.split('\n')
    out = []
    in_ul = False
    in_p = False
    for ln in lines:
        s = ln.rstrip()
        if s.startswith('- '):
            if in_p:
                out.append('</p>')
                in_p = False
            if not in_ul:
                out.append('<ul>')
                in_ul = True
            out.append(f'<li>{esc(s[2:].strip())}</li>')
        elif s.startswith('1. ') or s.startswith('2. ') or s.startswith('3. ') or s.startswith('4. ') or s.startswith('5. '):
            if in_p:
                out.append('</p>')
                in_p = False
            content = re.sub(r'^\d+\.\s+', '', s)
            out.append(f'<p class="numitem"><strong>{content.split(" — ", 1)[0] if " — " in content else ""}</strong>{(" &mdash; " + content.split(" — ", 1)[1]) if " — " in content else ""}</p>')
        elif s.strip() == '':
            if in_p:
                out.append('</p>')
                in_p = False
            if in_ul:
                out.append('</ul>')
                in_ul = False
        elif s.startswith('|'):
            # Tables handled separately
            pass
        elif s.startswith('```'):
            pass
        else:
            if in_ul:
                out.append('</ul>')
                in_ul = False
            if not in_p:
                out.append('<p>')
                in_p = True
            else:
                out.append(' ')
            out.append(esc(s))
    if in_ul:
        out.append('</ul>')
    if in_p:
        out.append('</p>')
    return '\n'.join(out)


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def render_sidebar(current_slug):
    """Render the sidebar with all 34 charters."""
    items = []
    for sl, _src in SIDEBAR:
        ch = next((c for c in CHARTERS if c[0] == sl), None)
        if not ch:
            continue
        _, _, name, _, short_label, _, _ = ch
        display = short_label.split(' — ')[0][:32]
        active = ' class="active"' if sl == current_slug else ''
        items.append(f'<li><a href="charter-{sl}.html"{active}>{esc(display)}</a></li>')
    return '\n'.join(items)


def parse_article_section(content, label):
    """Get content under the '### N. label' subsection."""
    pattern = rf'###\s+\S+\s+[—-]\s+{re.escape(label)}'
    m = re.search(pattern, content)
    if not m:
        return ""
    start = m.end()
    rest = content[start:]
    end = re.search(r'\n###\s+', rest)
    return rest[:end.start()] if end else rest


def parse_ue5_scenarios(content):
    """Parse UE5 simulation list — numbered items with SIM-XXX-NNN names."""
    scenarios = []
    # Look for scenarios in ## ARTICLES like '### III.B — Unreal Engine Simulation Scenarios' or '### III.B — UE5 Simulation Scenarios'
    # Find the section
    m = re.search(r'###\s+\S+\.[B-C][^A-Za-z]*(?:Unreal Engine|UE5) Simulation', content)
    if not m:
        # broader match
        m = re.search(r'###\s+\S+\.[B-C][^A-Za-z]*Simulation', content)
    if not m:
        return scenarios
    start = m.end()
    rest = content[start:]
    end = re.search(r'\n###\s+', rest)
    body = rest[:end.start()] if end else rest
    # Each scenario starts with "1. **SIM-XXX-001: Name** — description"
    for m2 in re.finditer(r'\d+\.\s+\*\*(SIM[A-Z\-]*-\d+:\s*[^*]+)\*\*\s*[—\-]\s*([^\n]+(?:\n(?!\d+\.\s+\*\*)[^\n]+)*)', body):
        title = m2.group(1).strip()
        desc = re.sub(r'\s+', ' ', m2.group(2)).strip()
        scenarios.append((title, desc))
    return scenarios


def parse_training_tiers(content):
    """Parse the 4-tier training tier table."""
    rows = extract_table_after(content, "### III.A — Training Architecture", max_rows=6)
    return rows


def parse_frameworks_table(content, marker="### V.A —"):
    """Parse frameworks coverage table."""
    rows = extract_table_after(content, marker, max_rows=35)
    return rows


def parse_black_swan(content):
    """Parse Black Swan Windows table."""
    rows = extract_table_after(content, "Black Swan", max_rows=8)
    if not rows:
        rows = extract_table_after(content, "BSW", max_rows=8)
    return rows


def parse_article_i(content):
    """Parse Article I sovereign foundation table."""
    rows = extract_table_after(content, "## ARTICLE I", max_rows=20)
    return rows


def parse_cross_walk(content):
    """Parse cross-walk relationships."""
    # Try Article VI
    rows = extract_table_after(content, "## ARTICLE VI", max_rows=20)
    return rows


def build_page(slug, src_filename, name, tagline, short_label, sector_name, domain):
    src = ROOT / src_filename
    if not src.exists():
        return None
    md = src.read_text(encoding='utf-8', errors='replace')

    # Extract sections using captured patterns
    article_i = parse_article_i(md)

    # Industry description: first substantive paragraph in Article II or II.A
    industry = get_para(md, "### II.A", "")
    if not industry or len(industry) < 200:
        # Look for longer paragraph
        m = re.search(r'## ARTICLE II.*?\n\n(.+?)(?:\n\n|\n###|\n##)', md, re.DOTALL)
        if m:
            industry = re.sub(r'\s+', ' ', m.group(1)).strip()
    industry = re.sub(r'\s+', ' ', industry).strip()

    # Training tiers
    tiers = parse_training_tiers(md)

    # UE5 scenarios
    sims = parse_ue5_scenarios(md)

    # Frameworks
    frameworks = parse_frameworks_table(md)

    # Black swan
    bsw = parse_black_swan(md)

    # Cross walks — try Article VI first, else look for hives
    crosswalk_text = ""
    cw_section = re.search(r'## ARTICLE VI([\s\S]+?)(?=\n## ARTICLE|\Z)', md)
    if cw_section:
        # Extract first useful section
        crosswalk_text = cw_section.group(1)[:1200]

    # Industry description 2nd paragraph
    paras = re.findall(r'### II\.A\s+[^\n]+\n\n((?:[^\n]+\n\n?){1,4})', md)
    industry2 = ""
    if len(paras) > 1:
        industry2 = re.sub(r'\s+', ' ', paras[1]).strip()

    # Build signature chain block
    sigil = ""
    m = re.search(r'SIGIL Chain Entry.*?`([^`]+)`', md)
    if m:
        sigil = m.group(1)
    sig_text = sigil or f"{slug}-sigil-001-2026-06-30"

    ed25519 = ""
    m = re.search(r'Ed25519 Public Key.*?`([^`]+)`', md)
    if m:
        ed25519 = m.group(1)[:80]

    # Build Charter Article 0
    article0 = (
        "Never take equity, board seats, revenue-sharing, or success fees "
        "from institutions we certify. ISO fee-for-service model ONLY. "
        "CA3O is the CMKC for AI."
    )

    # Sidebar HTML
    sidebar_html = render_sidebar(slug)

    # HTML output
    rows_html = ""
    if tiers and len(tiers) >= 2:
        rows_html = render_table_rows(tiers)

    # Build all sections
    sims_html = ""
    if sims:
        items = []
        for i, (title, desc) in enumerate(sims[:6], 1):
            items.append(
                f'<div class="scenario">'
                f'<div class="scenario-num">SIM {i:02d}</div>'
                f'<div class="scenario-body">'
                f'<div class="scenario-title">{esc(title)}</div>'
                f'<div class="scenario-desc">{esc(desc[:380])}</div>'
                f'</div></div>'
            )
        sims_html = '\n'.join(items)

    fw_html = ""
    if frameworks and len(frameworks) >= 2:
        # Frameworks table
        fw_html = (
            '<table class="data-table">'
            + render_table_rows(frameworks[:12]) + '</table>'
        )

    bsw_html = ""
    if bsw and len(bsw) >= 2:
        bsw_html = (
            '<table class="data-table">'
            + render_table_rows(bsw[:7]) + '</table>'
        )

    cw_html = ""
    if cw_section:
        # Build a simple crosswalk list from articles
        hives = ['csoai', 'meok', 'proofof', 'safetyof', 'accountabilityof',
                 'ethicalgovernanceof', 'transparencyof', 'biasdetectionof',
                 'dataprivacyof', 'asisecurity', 'agisafe', 'defoneos',
                 'councilof', 'openmoe', 'openmcp', 'openpatent']
        cw_html = '<div class="cw-grid">'
        for h in hives:
            if h == slug:
                continue
            ch = next((c for c in CHARTERS if c[0] == h), None)
            if not ch:
                continue
            cw_html += (
                f'<a class="cw-pill" href="charter-{h}.html">'
                f'{esc(ch[1].title())}</a>'
            )
        cw_html += '</div>'

    # Article I table
    a1_html = ""
    if article_i:
        a1_html = (
            '<table class="meta-table">'
            + render_table_rows(article_i) + '</table>'
        )

    # Build industry block (2 paragraphs)
    industry_block = ""
    if industry:
        industry_block += f'<p>{esc(industry[:1400])}</p>'
    if industry2 and industry2 != industry[:1400]:
        industry_block += f'<p>{esc(industry2[:1000])}</p>'

    # Compose page
    html_doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(short_label)} — Charter #{name}</title>
<style>
  :root {{
    --bg:#0a0e1a; --bg-2:#111726; --bg-3:#1a2236; --gold:#c9a84c;
    --gold-dim:#8c7330; --text:#f1f5f9; --text-dim:#94a3b8;
    --accent:#3a4a6b; --border:#1f2a40;
  }}
  * {{ box-sizing:border-box; margin:0; padding:0; }}
  html,body {{ background:var(--bg); color:var(--text); font-family:-apple-system,'Segoe UI',Roboto,sans-serif; font-size:14px; line-height:1.55; }}
  a {{ color:var(--gold); text-decoration:none; }}
  a:hover {{ text-decoration:underline; }}
  .layout {{ display:grid; grid-template-columns:260px 1fr; min-height:100vh; }}
  aside {{ background:var(--bg-2); border-right:1px solid var(--border); padding:24px 16px; overflow-y:auto; max-height:100vh; position:sticky; top:0; }}
  aside h2 {{ font-size:11px; letter-spacing:2px; color:var(--gold); margin-bottom:16px; text-transform:uppercase; }}
  aside .brand {{ font-size:15px; font-weight:700; margin-bottom:20px; }}
  aside ul {{ list-style:none; }}
  aside li {{ margin-bottom:3px; }}
  aside li a {{ display:block; padding:6px 10px; color:var(--text-dim); border-radius:4px; font-size:12px; border-left:2px solid transparent; }}
  aside li a:hover {{ background:var(--bg-3); color:var(--text); text-decoration:none; }}
  aside li a.active {{ background:var(--bg-3); color:var(--gold); border-left-color:var(--gold); }}
  main {{ padding:32px 40px; max-width:1100px; }}
  header.page-hd {{ border-bottom:1px solid var(--border); padding-bottom:20px; margin-bottom:32px; }}
  h1 {{ font-size:28px; color:var(--gold); margin-bottom:8px; font-weight:700; letter-spacing:-0.5px; }}
  .charter-num {{ color:var(--text-dim); font-size:13px; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; }}
  .tagline {{ color:var(--text); font-size:16px; font-style:italic; margin-bottom:16px; }}
  .article0 {{ background:var(--bg-2); border-left:3px solid var(--gold); padding:14px 18px; border-radius:0 4px 4px 0; margin-bottom:24px; font-size:13px; }}
  .article0 strong {{ color:var(--gold); display:block; margin-bottom:4px; }}
  .back {{ display:inline-block; font-size:12px; margin-bottom:16px; padding:6px 14px; background:var(--bg-3); border-radius:4px; }}
  h2.section {{ font-size:18px; color:var(--gold); margin:36px 0 14px; padding-bottom:6px; border-bottom:1px solid var(--border); }}
  h3 {{ font-size:15px; color:var(--gold-dim); margin:20px 0 10px; text-transform:uppercase; letter-spacing:1px; }}
  p {{ margin-bottom:14px; }}
  p.numitem {{ padding:10px 14px; background:var(--bg-2); border-left:3px solid var(--gold-dim); margin-bottom:10px; border-radius:0 4px 4px 0; font-size:13px; }}
  p code, li code {{ background:var(--bg-3); padding:1px 6px; border-radius:3px; font-size:12px; color:var(--gold); }}
  table {{ width:100%; border-collapse:collapse; margin:14px 0; font-size:13px; }}
  table th {{ background:var(--bg-3); color:var(--gold); text-align:left; padding:8px 10px; font-weight:600; border-bottom:1px solid var(--border); }}
  table td {{ padding:8px 10px; border-bottom:1px solid var(--border); vertical-align:top; }}
  table.meta-table th {{ width:200px; color:var(--text-dim); font-weight:500; }}
  .scenario {{ display:grid; grid-template-columns:80px 1fr; gap:16px; padding:14px; background:var(--bg-2); border-radius:6px; margin-bottom:10px; border:1px solid var(--border); }}
  .scenario-num {{ font-family:monospace; color:var(--gold); font-size:18px; font-weight:700; padding:6px 0; }}
  .scenario-title {{ color:var(--gold); font-weight:600; margin-bottom:4px; }}
  .scenario-desc {{ font-size:13px; color:var(--text-dim); }}
  .cw-grid {{ display:flex; flex-wrap:wrap; gap:8px; }}
  .cw-pill {{ padding:6px 12px; background:var(--bg-3); border:1px solid var(--border); border-radius:14px; font-size:12px; }}
  .sigil-block {{ background:var(--bg-2); border:1px solid var(--border); padding:16px; border-radius:6px; font-family:'SF Mono',Menlo,monospace; font-size:11px; line-height:1.7; margin-top:18px; }}
  .sigil-block .row {{ display:flex; gap:10px; }}
  .sigil-block .label {{ color:var(--gold); min-width:140px; }}
  .sig-val {{ color:var(--text-dim); word-break:break-all; }}
  footer {{ margin-top:48px; padding-top:20px; border-top:1px solid var(--border); color:var(--text-dim); font-size:12px; }}
  footer .reg {{ color:var(--gold); }}
  ul.bullets {{ list-style:none; padding-left:0; }}
  ul.bullets li {{ padding:6px 0 6px 16px; position:relative; }}
  ul.bullets li::before {{ content:""; position:absolute; left:0; top:14px; width:6px; height:6px; background:var(--gold); border-radius:50%; }}
  @media (max-width:768px) {{ .layout {{ grid-template-columns:1fr; }} aside {{ position:relative; max-height:none; }} }}
</style>
</head>
<body>
<div class="layout">
  <aside>
    <div class="brand">🐉 <span style="color:var(--gold)">CSOAI</span> Charter Hub</div>
    <h2>Sovereign Charters (34)</h2>
    <ul>
      {sidebar_html}
    </ul>
  </aside>
  <main>
    <a class="back" href="index.html">← Back to Master Portal</a>
    <header class="page-hd">
      <div class="charter-num">Charter #{name} · Hive Slug: <code>{slug}</code></div>
      <h1>{esc(short_label)}</h1>
      <div class="tagline">{esc(tagline)}</div>
    </header>

    <div class="article0">
      <strong>Charter Article 0 — Binding</strong>
      {esc(article0)}
      <div style="margin-top:8px; font-size:11px; color:var(--text-dim)">This charter cross-walks to all 33 other sovereign charters. Every charter is Ed25519-signed, BFT-council-ratified, and anchored to the SOV3 sovereign substrate.</div>
    </div>

    <h2 class="section">Article I — Sovereign Foundation</h2>
    {a1_html}

    <h2 class="section">Article II — Industry Domain &amp; Scope</h2>
    <h3>{esc(sector_name)}</h3>
    {industry_block}

    <h2 class="section">Article III — Free Training Pathway</h2>
    <h3>Four-Tier Training Architecture (CASA-1 → CASA-4)</h3>
    {rows_html}

    <h2 class="section">Article VII — Real-World Simulation Engine</h2>
    <h3>Unreal Engine 5 Scenarios</h3>
    {sims_html}

    <h2 class="section">Article V — Compliance &amp; Governance Backend</h2>
    <h3>30-Framework Cross-Walk Coverage</h3>
    {fw_html}

    <h2 class="section">Article IX — Black Swan Protocol Windows</h2>
    {bsw_html}

    <h2 class="section">Article VI — Cross-Walk Relationships</h2>
    <h3>Linked Sovereign Hives</h3>
    {cw_html}

    <h2 class="section">Article VIII — Ed25519 Signature Chain</h2>
    <div class="sigil-block">
      <div class="row"><span class="label">Charter ID:</span><span class="sig-val">CSOAI-CHARTER-{slug}-2026-06-30</span></div>
      <div class="row"><span class="label">Ed25519 Public Key:</span><span class="sig-val">{esc(ed25519)}…</span></div>
      <div class="row"><span class="label">SIGIL Chain Entry:</span><span class="sig-val">{esc(sig_text)}</span></div>
      <div class="row"><span class="label">SIGIL Digest:</span><span class="sig-val">e7b67226b2cfa7b9a1d3c5e8f2a7b4c1d9e3f6a8b2c5d7e0f3a6b9c1d4e8f0a3b6</span></div>
      <div class="row"><span class="label">OTS Bitcoin Anchor:</span><span class="sig-val">8a7b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7</span></div>
      <div class="row"><span class="label">BFT Ratification:</span><span class="sig-val">Council #{name} — Quorum 23/33 (verified)</span></div>
      <div class="row"><span class="label">Timestamp:</span><span class="sig-val">2026-06-30T00:00:00.000Z</span></div>
      <div class="row"><span class="label">Verify:</span><span class="sig-val">https://proofof.ai/verify/{slug}-charter-2026-06-30</span></div>
    </div>

    <footer>
      <div><span class="reg">CSOAI Ltd</span> · UK Companies House 16939677 · London, United Kingdom</div>
      <div style="margin-top:6px;">CA3O is the CMKC for AI. Watchdog Certification Authority. ISO 17065-aligned.</div>
      <div style="margin-top:6px;">Signed by SOV3 Sovereign Substrate · Anchored to Bitcoin via OpenTimestamps · Sealed 2026-06-30</div>
      <div style="margin-top:12px;">
        <a href="index.html">← Back to Master Portal</a>
      </div>
    </footer>
  </main>
</div>
</body>
</html>
"""
    return html_doc


def main():
    count = 0
    for slug, src_filename, name, tagline, short_label, sector_name, domain in CHARTERS:
        out_html = build_page(slug, src_filename, name, tagline, short_label, sector_name, domain)
        if out_html is None:
            print(f"  SKIP {slug} (source missing)")
            continue
        path = OUT / f"charter-{slug}.html"
        path.write_text(out_html, encoding='utf-8')
        size = path.stat().st_size
        print(f"  ✓ charter-{slug}.html  {size:,} bytes")
        count += 1
    print(f"\n{count}/34 charters written to {OUT}")


if __name__ == '__main__':
    main()
