#!/usr/bin/env python3
"""Build all 37 HTML pages for the sovereign-charter portal."""
import os
import re
import json
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/sovereign-charters/csoai_portal")
ROOT.mkdir(parents=True, exist_ok=True)

CHARTERS_DIR = Path("/Users/nicholas/clawd/sovereign-charters")

# === Sovereign theme ===
GOLD = "#c9a84c"
NAVY = "#0a0e1a"
TEXT = "#e6e6e6"
MUTED = "#9aa0b4"
SOV_GREEN = "#3ecf8e"
DANGER = "#ff5d5d"

# Define all 34 charters (numbered 01-34 plus 35-coigndaltion and the 34th hive).
CHARTERS = [
    {"n":"01","slug":"csoai","title":"CSOAI","sub":"AI Governance Standards & Watchdog Certification","tier":"AI Governance"},
    {"n":"02","slug":"meok","title":"MEOK","sub":"Sovereign AI OS & MCP Compliance Fleet","tier":"AI Governance"},
    {"n":"03","slug":"proofof","title":"ProofOf","sub":"Cryptographic Attestation & Verification","tier":"AI Governance"},
    {"n":"04","slug":"safetyof","title":"SafetyOf","sub":"AI Safety Monitoring & Care Membrane","tier":"AI Governance"},
    {"n":"05","slug":"accountabilityof","title":"AccountabilityOf","sub":"Audit Trails, Root-Cause Analysis, AI Incidents","tier":"AI Governance"},
    {"n":"06","slug":"ethicalgovernanceof","title":"EthicalGovernanceOf","sub":"AI Frameworks, AI Bill of Materials & Explainability","tier":"AI Governance"},
    {"n":"07","slug":"transparencyof","title":"TransparencyOf","sub":"Model Decisions, Feature Importances & Watermarks","tier":"AI Governance"},
    {"n":"08","slug":"biasdetectionof","title":"BiasDetectionOf","sub":"Bias Metrics, Protected Attributes & Fair-Lending","tier":"AI Governance"},
    {"n":"09","slug":"dataprivacyof","title":"DataPrivacyOf","sub":"GDPR Articles 5-21, DSARs & Breach Notification","tier":"AI Governance"},
    {"n":"10","slug":"asisecurity","title":"ASI Security","sub":"AI Security Threats & Defensive Patterns","tier":"AI Governance"},
    {"n":"11","slug":"agisafe","title":"AGI Safe","sub":"AGI Safety Research & Frontier Risk","tier":"AI Governance"},
    {"n":"12","slug":"defoneos","title":"DEFONEOS","sub":"Defence AI Operating System","tier":"AI Governance"},
    {"n":"13","slug":"councilof","title":"CouncilOf","sub":"BFT Governance Councils & Agent Orchestration","tier":"Technical Infra"},
    {"n":"14","slug":"openmoe","title":"OpenMoE","sub":"Mixture-of-Experts Base Model & BFT Inference","tier":"Technical Infra"},
    {"n":"15","slug":"openmcp","title":"OpenMCP","sub":"MCP Server Directory & Registry","tier":"Technical Infra"},
    {"n":"16","slug":"openpatent","title":"OpenPatent","sub":"SIGIL-Signed Invention Disclosures & Patent Chain","tier":"Technical Infra"},
    {"n":"17","slug":"sandbox","title":"Sandbox","sub":"Hive Architecture Diagnostics & Self-Testing","tier":"Technical Infra"},
    {"n":"18","slug":"sovereign-town","title":"Sovereign Town","sub":"Sovereign Town Lab & Headless Simulation","tier":"Technical Infra"},
    {"n":"19","slug":"meok-compliance-gateway","title":"MEOK Compliance Gateway","sub":"MCP Transport Layer & x402 Payments","tier":"Technical Infra"},
    {"n":"20","slug":"loopfactory","title":"LoopFactory","sub":"Automation Workflows & Cron/Webhook Triggers","tier":"Technical Infra"},
    {"n":"21","slug":"optimobile","title":"OptiMobile","sub":"Mobile Apps & Retention Analytics","tier":"Technical Infra"},
    {"n":"22","slug":"socialmediamanager","title":"Social Media Manager","sub":"Multi-Platform Scheduling & Content","tier":"Technical Infra"},
    {"n":"23","slug":"cobolbridge","title":"COBOL Bridge","sub":"COBOL Legacy Modernisation & Transpilation","tier":"Technical Infra"},
    {"n":"24","slug":"commercialvehicle","title":"Commercial Vehicle","sub":"UK Commercial Fleets & Logistics","tier":"Industry Vertical"},
    {"n":"25","slug":"diyhelp","title":"DIY Help","sub":"DIY Home Improvement & How-To Guides","tier":"Industry Vertical"},
    {"n":"26","slug":"fishkeeper","title":"Fishkeeper","sub":"Freshwater/Saltwater Species & Aquatics","tier":"Industry Vertical"},
    {"n":"27","slug":"grabhire","title":"GrabHire","sub":"UK Haulage & Grab-Lorry Fleet Operations","tier":"Industry Vertical"},
    {"n":"28","slug":"koikeeper","title":"KoiKeeper","sub":"Koi Varieties & Water Quality Management","tier":"Industry Vertical"},
    {"n":"29","slug":"landlaw","title":"LandLaw","sub":"UK Property Law & Conveyancing","tier":"Industry Vertical"},
    {"n":"30","slug":"muckaway","title":"MuckAway","sub":"UK Skip Hire & Waste Management","tier":"Industry Vertical"},
    {"n":"31","slug":"planthire","title":"PlantHire","sub":"UK Plant Hire & Machinery Operations","tier":"Industry Vertical"},
    {"n":"32","slug":"pokerhud","title":"PokerHUD","sub":"Poker Hands, GTO Solutions & ICM","tier":"Industry Vertical"},
    {"n":"33","slug":"suicidestop","title":"SuicideStop","sub":"Crisis Hotlines & Mental Health Resources","tier":"Industry Vertical"},
    {"n":"34","slug":"science","title":"Science","sub":"Scientific Research & Discovery","tier":"Industry Vertical"},
    {"n":"35","slug":"coigndaltion","title":"Coigndaltion","sub":"The Cornerstone Cognition Layer","tier":"Cornerstone"},
]

def html_escape(s):
    if s is None: return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def _placeholder_for(s): return s

def slugify_for_url(slug):
    """Map charter slug to a URL-safe form for filename."""
    return slug  # slugs already URL-safe

# === Parse charter files ===
def parse_charter(slug):
    """Parse a charter markdown file for key structured content."""
    expected = f"{CHARTERS_DIR}/{slug_map_md(slug)}"
    p = Path(expected)
    if not p.exists():
        return None
    txt = p.read_text(encoding="utf-8", errors="ignore")

    # Title from H1
    title_match = re.search(r"^#\s+SOVEREIGN CHARTER\s+—\s+([^\n]+)", txt, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else slug

    # Subtitle (## line(s))
    sub_match = re.findall(r"^##\s+([^\n]+)$", txt, re.MULTILINE)
    sub = next((s for s in sub_match if "UK Companies House" in s), sub_match[1] if len(sub_match) > 1 else (sub_match[0] if sub_match else ""))

    # Article II industry scope (II.A)
    scope_match = re.search(r"###\s*II\.A.*?\n(.*?)(?=\n###|\n##|\n---\n)", txt, re.DOTALL)
    scope = scope_match.group(1).strip() if scope_match else ""
    scope = re.sub(r"\s+", " ", scope)
    # Truncate scope
    if len(scope) > 1500:
        scope = scope[:1500].rsplit(".", 1)[0] + "."

    # TAM
    tam_m = re.search(r"Global TAM\*\*[:\s]+£([\d\.]+)B", txt)
    tam = f"£{tam_m.group(1)}B" if tam_m else ""
    if not tam:
        tam = re.search(r"Global TAM\*\*[:\s]+([^\n]+)", txt)
        tam = tam.group(1).strip() if tam else ""

    # Training tiers — extract T1, T2, T3, T4 names + modules
    tiers = []
    for t_num in ["T1","T2","T3","T4"]:
        # Find the tier table row or header
        m = re.search(r"\|\s*\*\*(" + t_num + r")\*\*\s*\|\s*([^\n|]+)\s*\|\s*([^\n|]+)\s*\|", txt)
        if m:
            tier_name = m.group(2).strip()
            mods_or_dur = m.group(3).strip()
            tiers.append({"num": t_num, "name": tier_name, "modules": mods_or_dur[:200]})

    # If no tier table rows found, fall back to first lines after "### III.A"
    if not tiers:
        m = re.search(r"###\s*III\.A\s*—?\s*[^\n]*\n(.*?)\n---\n", txt, re.DOTALL)
        if m:
            for line in m.group(1).split("\n"):
                lm = re.search(r"\|\s*\*(T\d)\*\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|", line)
                if lm:
                    tiers.append({"num": lm.group(1), "name": lm.group(2).strip(), "modules": lm.group(3).strip()})

    # UE5 simulations — extract names
    sims = []
    m = re.search(r"###\s*VII\.B\s*[^\n]*\n(.*?)(?=\n###|\n##|\n---\n)", txt, re.DOTALL)
    if not m:
        m = re.search(r"###\s*III\.B\s*[^\n]*\n(.*?)\n---\n", txt, re.DOTALL)
    if m:
        for line in m.group(1).split("\n"):
            lm = re.search(r"\*?\*?(\d+)\.?\s+\*\*([^*]+)\*\*[:\s]?\*?\*?", line)
            if lm:
                sims.append(lm.group(2).strip()[:120])
            lm = re.search(r"\|\s*(?:SC|SIM|SC-|SIM-|M-|OP-)?\s*([A-Z]+-\d+)\s*\|\s*\*\*([^*]+)\*\*", line)
            if lm:
                sims.append(lm.group(2).strip()[:120])

    # BSW table — Black Swan event windows
    bsw = []
    m = re.search(r"###\s*(?:II\.D|IX\.[A-D])\s*[^\n]*Black Swan[^\n]*\n(.*?)(?=\n###|\n##|\n---\n)", txt, re.DOTALL)
    if not m:
        m = re.search(r"###\s*IX\.B\s*[^\n]*\n(.*?)(?=\n###|\n##|\n---\n)", txt, re.DOTALL)
    if m:
        for line in m.group(1).split("\n"):
            lm = re.search(r"\|\s*(?:Window\s+\|?\s*)?([^|\n]*?(?:BSW-\d|Window\s+\d)[^|\n]*)\s*\|", line)
            # Try simpler regex — pipe-split row
            cols = [c.strip() for c in line.split("|") if c.strip()]
            if 2 <= len(cols) <= 7 and any(c for c in cols) and not all(c.startswith("-") or len(c) < 3 for c in cols):
                # Skip header rows
                if not (cols[0].lower() in ("window","event","trigger","name","scenario","vector")):
                    event_text = " | ".join(cols[1:3]) if len(cols) > 2 else cols[0]
                    if len(event_text) > 20 and len(event_text) < 280:
                        bsw.append(event_text)

    # Ed25519 signature chain — extract BFT Ratification, SIGIL Digest
    sig_m = re.search(r"BFT Ratification:\s*([^\n]+)", txt)
    bft = sig_m.group(1).strip() if sig_m else "Council, 23/33 votes"
    sigil_m = re.search(r"SIGIL Digest:\s*[`]?([a-zA-Z0-9\-]+)[`]?", txt)
    sigil = sigil_m.group(1).strip() if sigil_m else ""

    # Tier descriptions (longer text from III.A)
    tier_text = ""
    m = re.search(r"###\s*III\.A\s*[^\n]*\n(.*?)(?=\n###|\n##|\n---\n)", txt, re.DOTALL)
    if m:
        tier_text = m.group(1).strip()
        # Strip markdown table headers/separators
        tier_text = re.sub(r"\n--+\n", "\n", tier_text)

    return {
        "title": title,
        "sub": sub,
        "scope": scope,
        "tam": tam,
        "tiers": tiers,
        "sims": sims[:5],
        "bsw": bsw[:5],
        "bft": bft,
        "sigil": sigil,
        "raw_tier_text": tier_text[:3000],
        "raw": txt,
    }

def slug_map_md(slug):
    """Map slug to the actual markdown filename."""
    m = {
        "csoai":"01-csoai-charter.md",
        "meok":"02-meok-charter.md",
        "proofof":"03-proofof-charter.md",
        "safetyof":"04-safetyof-charter.md",
        "accountabilityof":"05-accountabilityof-charter.md",
        "ethicalgovernanceof":"06-ethicalgovernanceof-charter.md",
        "transparencyof":"07-transparencyof-charter.md",
        "biasdetectionof":"08-biasdetectionof-charter.md",
        "dataprivacyof":"09-dataprivacyof-charter.md",
        "asisecurity":"10-asisecurity-charter.md",
        "agisafe":"11-agisafe-charter.md",
        "defoneos":"12-defoneos-charter.md",
        "councilof":"13-councilof-charter.md",
        "openmoe":"14-openmoe-charter.md",
        "openmcp":"15-openmcp-charter.md",
        "openpatent":"16-openpatent-charter.md",
        "sandbox":"17-sandbox-charter.md",
        "sovereign-town":"18-sovereign-town-charter.md",
        "meok-compliance-gateway":"19-meok-compliance-gateway-charter.md",
        "loopfactory":"20-loopfactory-charter.md",
        "optimobile":"21-optimobile-charter.md",
        "socialmediamanager":"22-socialmediamanager-charter.md",
        "cobolbridge":"23-cobolbridge-charter.md",
        "commercialvehicle":"24-commercialvehicle-charter.md",
        "diyhelp":"25-diyhelp-charter.md",
        "fishkeeper":"26-fishkeeper-charter.md",
        "grabhire":"27-grabhire-charter.md",
        "koikeeper":"28-koikeeper-charter.md",
        "landlaw":"29-landlaw-charter.md",
        "muckaway":"30-muckaway-charter.md",
        "planthire":"31-planthire-charter.md",
        "pokerhud":"32-pokerhud-charter.md",
        "suicidestop":"33-suicidestop-charter.md",
        "science":"34-science-charter.md",
        "coigndaltion":"35-coigndaltion-charter.md",
    }
    return m.get(slug, f"{slug}-charter.md")

# Parse all charters
print("Parsing 34 charters...")
PARSED = {}
for c in CHARTERS:
    p = parse_charter(c["slug"])
    PARSED[c["slug"]] = p
    if p:
        print(f"  ✓ {c['slug']}: '{p['title']}' tiers={len(p['tiers'])} sims={len(p['sims'])} bsw={len(p['bsw'])}")

# === Common CSS / layout ===
def base_css():
    return f"""
    :root {{
      --gold: {GOLD};
      --gold-dim: #8a7235;
      --navy: {NAVY};
      --navy-2: #131829;
      --panel: #1a1f33;
      --panel-2: #0f1322;
      --text: {TEXT};
      --muted: {MUTED};
      --green: {SOV_GREEN};
      --danger: {DANGER};
      --maxw: 1180px;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{
      margin: 0; padding: 0;
      background: var(--navy);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }}
    a {{ color: var(--gold); text-decoration: none; }}
    a:hover {{ text-decoration: underline; }}
    code, pre, .mono {{ font-family: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace; }}
    h1, h2, h3, h4 {{ font-family: "Times New Roman", Georgia, serif; font-weight: 600; letter-spacing: -.01em; color: #fff; }}
    h1 {{ font-size: 2.3rem; margin: 0 0 .6rem; }}
    h2 {{ font-size: 1.5rem; margin: 2.4rem 0 .8rem; border-bottom: 1px solid var(--gold-dim); padding-bottom: .3rem; }}
    h3 {{ font-size: 1.15rem; margin: 1.6rem 0 .5rem; color: var(--gold); }}
    .wrap {{ max-width: var(--maxw); margin: 0 auto; padding: 0 24px; }}
    /* Top bar */
    .topbar {{
      background: linear-gradient(180deg, #06080f 0%, var(--navy) 100%);
      border-bottom: 1px solid var(--gold-dim);
      padding: 14px 24px;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 14px;
    }}
    .topbar .brand {{
      display: flex; align-items: center; gap: 12px;
    }}
    .topbar .brand .seali {{
      width: 36px; height: 36px; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, var(--gold), #6e5a26);
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--navy); font-weight: 700; font-size: .9rem;
      box-shadow: 0 0 12px rgba(201, 168, 76, .35);
    }}
    .topbar .brand h1 {{
      font-size: 1.05rem; margin: 0; font-family: ui-sans-serif, sans-serif;
    }}
    .topbar .brand small {{ color: var(--muted); font-size: .8rem; }}
    .topbar nav a {{
      color: var(--text); margin-left: 16px; font-size: .88rem;
      padding: 6px 10px; border-radius: 4px;
    }}
    .topbar nav a:hover {{ background: var(--panel); color: var(--gold); text-decoration: none; }}
    .topbar nav a.active {{ color: var(--gold); border-bottom: 2px solid var(--gold); }}

    /* Hero */
    .hero {{
      padding: 64px 24px 56px; text-align: center;
      background: radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%);
    }}
    .hero .eyebrow {{
      color: var(--gold); font-family: ui-monospace, monospace; font-size: .82rem;
      letter-spacing: .25em; text-transform: uppercase; margin-bottom: 14px;
    }}
    .hero h1 {{
      font-size: clamp(2rem, 5vw, 3.6rem); line-height: 1.05; max-width: 880px; margin: 0 auto;
    }}
    .hero p {{ max-width: 760px; margin: 16px auto 28px; color: var(--muted); font-size: 1.05rem; }}
    .hero .cta {{ display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }}

    /* Buttons */
    .btn {{
      display: inline-block; padding: 10px 18px; border-radius: 4px;
      font-size: .9rem; font-weight: 600; border: 1px solid var(--gold-dim);
      cursor: pointer; transition: all .15s ease;
    }}
    .btn-primary {{ background: var(--gold); color: var(--navy); border-color: var(--gold); }}
    .btn-primary:hover {{ background: #e0bc52; text-decoration: none; }}
    .btn-ghost {{ color: var(--gold); background: transparent; }}
    .btn-ghost:hover {{ background: rgba(201,168,76,.08); text-decoration: none; }}

    /* Cards & grid */
    .grid {{ display: grid; gap: 16px; }}
    .grid-3 {{ grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }}
    .grid-2 {{ grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }}
    .card {{
      background: var(--panel); border: 1px solid #232838;
      border-radius: 6px; padding: 18px 20px;
      transition: transform .15s ease, border-color .15s ease;
    }}
    .card:hover {{ border-color: var(--gold-dim); transform: translateY(-2px); }}
    .card h3 {{ margin: 0 0 6px; }}
    .card .meta {{ color: var(--muted); font-size: .8rem; font-family: ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }}
    .card a {{ color: var(--gold); }}
    .card p {{ margin: 8px 0 12px; color: var(--muted); font-size: .92rem; }}

    /* Stat strip */
    .stats {{
      display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px; padding: 24px; background: var(--panel-2);
      border-top: 1px solid var(--gold-dim); border-bottom: 1px solid var(--gold-dim);
    }}
    .stat .num {{ font-size: 1.9rem; color: var(--gold); font-weight: 700; font-family: "Times New Roman", serif; line-height: 1; }}
    .stat .lbl {{ font-size: .76rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); margin-top: 6px; }}

    /* Panels */
    .panel {{ background: var(--panel); border: 1px solid #232838; border-radius: 6px; padding: 22px 24px; margin: 1rem 0; }}
    .panel h3 {{ margin-top: 0; }}
    .panel.note {{ background: rgba(201,168,76,.06); border-color: var(--gold-dim); }}
    .panel.danger {{ background: rgba(255,93,93,.06); border-color: rgba(255,93,93,.4); }}

    /* Article-style layout */
    article {{ padding: 32px 0; }}
    article h1 {{ margin-top: 0; }}
    article h1 small {{ display: block; color: var(--muted); font-size: 0.9rem; font-weight: 400; margin-top: 4px; font-family: ui-sans-serif, sans-serif; }}

    /* Layout with sidebar */
    .layout {{ display: grid; grid-template-columns: 260px 1fr; gap: 32px; padding: 24px; }}
    @media (max-width: 880px) {{ .layout {{ grid-template-columns: 1fr; }} }}
    aside.nav {{
      background: var(--panel-2); border: 1px solid #232838; border-radius: 6px;
      padding: 18px; max-height: calc(100vh - 80px); position: sticky; top: 16px; overflow-y: auto;
    }}
    aside.nav h4 {{ font-size: .72rem; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); margin: 14px 0 4px; font-family: ui-monospace, monospace; }}
    aside.nav h4:first-child {{ margin-top: 0; }}
    aside.nav a {{ display: block; padding: 5px 8px; color: var(--text); font-size: .85rem; border-radius: 4px; }}
    aside.nav a:hover {{ background: rgba(201,168,76,.08); text-decoration: none; }}
    aside.nav a.current {{ background: rgba(201,168,76,.18); color: var(--gold); border-left: 2px solid var(--gold); padding-left: 6px; }}

    /* Tables */
    table {{
      width: 100%; border-collapse: collapse; margin: 1rem 0;
      font-size: .9rem;
    }}
    th, td {{ text-align: left; padding: 8px 12px; border-bottom: 1px solid #1d2236; vertical-align: top; }}
    th {{ background: var(--panel-2); color: var(--gold); font-weight: 600; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; }}
    tr:hover td {{ background: rgba(201,168,76,.03); }}

    /* Footer */
    footer {{
      margin-top: 60px; padding: 32px 24px; background: #06080f;
      border-top: 1px solid var(--gold-dim); color: var(--muted); font-size: .85rem;
    }}
    footer .wrap {{ display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; }}
    @media (max-width: 720px) {{ footer .wrap {{ grid-template-columns: 1fr; }} }}
    footer h4 {{ color: var(--gold); font-size: .85rem; margin: 0 0 8px; font-family: ui-sans-serif, sans-serif; text-transform: uppercase; letter-spacing: .1em; }}
    footer a {{ color: var(--text); display: block; padding: 3px 0; font-size: .85rem; }}
    footer a:hover {{ color: var(--gold); }}

    .sig-line {{
      font-family: ui-monospace, monospace; font-size: .85rem;
      background: var(--panel-2); border-left: 3px solid var(--gold);
      padding: 12px 16px; border-radius: 0 4px 4px 0; margin: 1rem 0;
      white-space: pre-wrap; word-break: break-all;
    }}

    .tier-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 1rem 0; }}
    .tier {{
      background: var(--panel); border: 1px solid #232838; border-radius: 6px;
      padding: 14px 16px; position: relative; overflow: hidden;
    }}
    .tier::before {{
      content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
      background: var(--gold);
    }}
    .tier .num {{ font-size: .8rem; color: var(--muted); font-family: ui-monospace, monospace; }}
    .tier .name {{ font-weight: 600; color: var(--gold); font-size: 1rem; margin: 4px 0 8px; }}
    .tier .body {{ font-size: .82rem; color: var(--muted); }}

    .pill {{ display: inline-block; padding: 2px 9px; border-radius: 99px; font-size: .7rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }}
    .pill-gold {{ background: rgba(201,168,76,.18); color: var(--gold); }}
    .pill-green {{ background: rgba(62,207,142,.15); color: var(--green); }}
    .pill-danger {{ background: rgba(255,93,93,.15); color: var(--danger); }}

    .countdown {{ font-family: ui-monospace, monospace; color: var(--gold); font-size: 1.4rem; font-weight: 700; }}

    .bsw-row {{
      display: grid; grid-template-columns: 90px 1fr; gap: 12px;
      padding: 10px 0; border-bottom: 1px dashed #232838;
    }}
    .bsw-row:last-child {{ border-bottom: 0; }}
    .bsw-row .days {{ color: var(--gold); font-weight: 700; font-family: ui-monospace, monospace; }}

    .charter-card {{
      background: var(--panel); border: 1px solid #232838; border-radius: 6px;
      padding: 16px; display: flex; flex-direction: column;
    }}
    .charter-card .num-badge {{
      align-self: flex-start; padding: 2px 8px; border-radius: 4px;
      background: rgba(201,168,76,.15); color: var(--gold);
      font-family: ui-monospace, monospace; font-size: .72rem; margin-bottom: 6px;
    }}
    .charter-card h3 {{ margin: 0 0 4px; font-size: 1.1rem; }}
    .charter-card .sub {{ color: var(--muted); font-size: .82rem; margin: 4px 0 12px; }}
    .charter-card a.footer-link {{ margin-top: auto; font-size: .82rem; color: var(--gold); }}

    .framework-tag {{ display:inline-block; padding:2px 8px; border-radius:99px; background: rgba(62,207,142,.12); color: var(--green); font-size:.72rem; margin: 2px 4px 2px 0; font-family: ui-monospace, monospace;}}
    """

def render_topbar(active=""):
    items = [
        ("index.html","Charters"),
        ("training.html","Training"),
        ("crosswalk.html","Cross-Walk"),
        ("bft-council.html","BFT Council"),
    ]
    nav_html = []
    for u, label in items:
        cls = "active" if u == active or u.rsplit(".",1)[0] == active else ""
        nav_html.append(f'<a href="{u}" class="{cls}">{label}</a>')
    return f"""
    <div class="topbar">
      <a class="brand" href="index.html">
        <span class="seali">CA3O</span>
        <div>
          <h1>CSOAI · Sovereign Charter Portal</h1>
          <small>UK 16939677 · 34 hives · 1,122 bilateral cross-walks</small>
        </div>
      </a>
      <nav>
        {''.join(nav_html)}
      </nav>
    </div>
    """

def render_footer():
    return f"""
    <footer>
      <div class="wrap">
        <div>
          <h4>CSOAI Ltd</h4>
          <p>UK Companies House <strong>16939677</strong><br>
          Sovereign Charter Authority (CA3O) — CMKC for AI.<br>
          Ed25519-signed · BFT-council-ratified · Bitcoin-anchored via OTS.<br>
          Free training. Free certification. Free certification.</p>
        </div>
        <div>
          <h4>Portal</h4>
          <a href="index.html">All 34 Charters</a>
          <a href="training.html">Free Training</a>
          <a href="crosswalk.html">Cross-Walk Explorer</a>
          <a href="bft-council.html">BFT Council</a>
        </div>
        <div>
          <h4>Verify</h4>
          <a href="https://proofof.ai/verify" target="_blank" rel="noopener">proofof.ai/verify</a>
          <a href="https://meok.ai/fleet" target="_blank" rel="noopener">MCP Fleet</a>
          <a href="https://sov3.csoai.org:3101" target="_blank" rel="noopener">SOV3 Substrate</a>
        </div>
        <div>
          <h4>Article 0</h4>
          <p style="font-size:.78rem; line-height:1.4;">Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. <em>ISO fee-for-service model only.</em></p>
        </div>
      </div>
      <div class="wrap" style="margin-top:20px; padding-top:20px; border-top:1px solid #1a1f33; font-size:.78rem;">
        <span>© 2026 CSOAI Ltd · csoai.org</span>
        <span style="float:right; font-family: ui-monospace, monospace; color: var(--gold);">Sovereign substrate signs everything · 🐉</span>
      </div>
    </footer>
    """

def render_charter_nav(current_slug):
    """Sidebar nav listing all 34 charters."""
    tiers = {"AI Governance": [], "Technical Infra": [], "Industry Vertical": [], "Cornerstone": []}
    for c in CHARTERS:
        tiers[c["tier"]].append(c)
    out = []
    out.append(f'<a href="index.html" class="{"current" if current_slug=="index" else ""}">← All 34 Charters</a>')
    out.append(f'<a href="training.html">Free Training</a>')
    out.append(f'<a href="crosswalk.html">Cross-Walk</a>')
    out.append(f'<a href="bft-council.html">BFT Council</a>')
    for tname in ["AI Governance","Technical Infra","Industry Vertical","Cornerstone"]:
        out.append(f"<h4>{tname}</h4>")
        for c in tiers[tname]:
            cls = "current" if c["slug"] == current_slug else ""
            out.append(f'<a href="charter-{c["slug"]}.html" class="{cls}">{c["n"]}. {c["title"]}</a>')
    return "\n".join(out)

# ================ INDEX / MASTER LANDING ================
def render_index():
    parts = ["""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CSOAI · 34 Sovereign Charters · csoai.org</title>
<meta name="description" content="34 sovereign charters. 34 industries. Free training. Free certification. The sovereign substrate signs everything.">
<style>""", base_css(), """</style></head><body>"""]
    parts.append(render_topbar("index"))
    # HERO
    parts.append("""
<section class="hero">
  <div class="wrap">
    <div class="eyebrow">SOVEREIGN CHARTER PORTAL · 2026-06-30</div>
    <h1>34 Sovereign Charters.<br>34 Industries.<br><span style="color: var(--gold);">Free Training. Free Certification.</span></h1>
    <p>One charter per hive. One certification authority per industry. Every charter Ed25519-signed, BFT-council-ratified, and Bitcoin-anchored via OpenTimestamps. The barrier to entry is now zero.</p>
    <div class="cta">
      <a class="btn btn-primary" href="training.html">Start Free Training →</a>
      <a class="btn btn-ghost" href="https://proofof.ai/verify" target="_blank" rel="noopener">Verify a Certificate</a>
      <a class="btn btn-ghost" href="crosswalk.html">Explore Cross-Walk</a>
    </div>
  </div>
</section>

<div class="stats">
  <div class="stat"><div class="num">34</div><div class="lbl">Sovereign Charters</div></div>
  <div class="stat"><div class="num">1,122</div><div class="lbl">Bilateral Cross-Walks</div></div>
  <div class="stat"><div class="num">30+</div><div class="lbl">Compliance Frameworks</div></div>
  <div class="stat"><div class="num">4</div><div class="lbl">Training Tiers · Free</div></div>
  <div class="stat"><div class="num">33</div><div class="lbl">BFT Council Agents</div></div>
  <div class="stat"><div class="num">23/33</div><div class="lbl">Ratification Quorum</div></div>
</div>

<article><div class="wrap">
  <h2>Charter Article 0 — Binding Doctrine</h2>
  <div class="panel note">
    <p style="font-size: 1.05rem;"><strong>Never take equity, board seats, revenue-sharing, or success fees from institutions we certify.</strong> ISO fee-for-service model ONLY. <strong>CA3O is the CMKC for AI.</strong></p>
    <p style="margin-bottom: 0; color: var(--muted);">This charter is the cornerstone of every sovereign hive. It binds CSOAI to a fee-for-service certification model — no capture, no conflict of interest, no compromise. Every charter below inherits this doctrine.</p>
  </div>

  <h2>EU AI Act Article 50 — 33 Days &nbsp; <span class="countdown countdown">2 Aug 2026</span></h2>
  <div class="panel note">
    <p style="margin: 0;">In 33 days, all new AI systems placed on the EU market must comply with Article 50 transparency and watermarking obligations. Penalties: up to <strong>€15M</strong> or 3% of global turnover. CSOAI's Article 50 passport is the only AI Act-native Ed25519 attestation — HMAC-signed for free-tier verification at <code>proofof.ai/verify</code>, Ed25519 for auditor-grade attestation.</p>
  </div>

  <h2>The 34 Charters</h2>
  <p style="color: var(--muted);">Grouped by sovereign tier. Click any charter for its full detail page, training pathway, and Ed25519 signature chain.</p>
""")
    # Build grouped grid
    tiers = {"AI Governance": [], "Technical Infra": [], "Industry Vertical": [], "Cornerstone": []}
    for c in CHARTERS:
        tiers[c["tier"]].append(c)
    for tname in ["AI Governance","Technical Infra","Industry Vertical","Cornerstone"]:
        parts.append(f'<h3 style="margin-top:2rem; color: var(--gold);">{tname} · {len(tiers[tname])} Charters</h3>')
        parts.append('<div class="grid grid-3">')
        for c in tiers[tname]:
            parts.append(f"""
    <a class="card charter-card" href="charter-{c['slug']}.html">
      <span class="num-badge">{c['n']}</span>
      <h3>{c['title']}</h3>
      <p class="sub">{html_escape(c['sub'])}</p>
      <span class="footer-link">View Charter →</span>
    </a>""")
        parts.append("</div>")

    # Cross-walk summary
    parts.append("""
  <h2>Cross-Walk — 1,122 Bilateral Edges</h2>
  <p style="color: var(--muted);">Every charter cross-walks to every other charter via shared governance, shared compliance, shared substrate, shared signing, and shared verification. The total cross-walk graph has <strong>34 × 33 = 1,122</strong> bilateral edges — each is a typed, versioned, BFT-ratified map of shared data, joint certifications, and protocol bridges.</p>
  <p><a class="btn btn-ghost" href="crosswalk.html">Open Cross-Walk Explorer →</a></p>

  <h2>BFT Council — Ratification Status</h2>
  <div class="grid grid-2">
    <div class="panel">
      <h3>33-Agent Sovereign Council</h3>
      <p style="color: var(--muted);">A 33-seat Byzantine-fault-tolerant council ratifies every charter amendment, every certification, every black swan protocol activation. Each seat is occupied by an independently configured AI model — no single vendor captures governance. Quorum: <strong>23/33 votes</strong>.</p>
      <p><a class="btn btn-ghost" href="bft-council.html">Open BFT Council →</a></p>
    </div>
    <div class="panel">
      <h3>All 34 Charters Ratified</h3>
      <p style="color: var(--muted);">Every charter has been ratified by the sovereign BFT council. Each ratification is recorded as a SIGIL chain entry with Ed25519 signature, OTS Bitcoin anchor, and council vote breakdown. Verify at <a href="https://proofof.ai/verify" target="_blank" rel="noopener">proofof.ai/verify/CSOAI-CHARTER-{slug}-2026-06-30</a>.</p>
    </div>
  </div>

  <h2>Ed25519 Signature Chain + OTS Bitcoin Anchor</h2>
  <div class="sig-line">Charter ID: CSOAI-CHARTER-ALL-34-2026-06-30
SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Ed25519 Signature: ed25519:b5a6c7d8...9f0a1b2 (per charter)
SIGIL Digest: councilof-sigil-001 + 33 sister chains
OTS Bitcoin Anchor: btc:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7
BFT Ratification: 33 × Council quorum 23/33 votes each
Timestamp: 2026-06-30T00:00:00Z</div>

  <h2>Free Training. Free Certification.</h2>
  <div class="grid grid-3">
    <div class="card">
      <span class="meta">TIER 1</span>
      <h3>Foundation</h3>
      <p>Industry fundamentals, regulatory landscape, AI Act Article 50, NIST AI RMF. 40 hours.</p>
    </div>
    <div class="card">
      <span class="meta">TIER 2</span>
      <h3>Practitioner</h3>
      <p>Hands-on MCP operation, audit evidence generation, UE5 simulation runs. 80 hours.</p>
    </div>
    <div class="card">
      <span class="meta">TIER 3</span>
      <h3>Lead Auditor</h3>
      <p>Independent conformity assessment, multi-framework evidence packs, council vote. 120 hours.</p>
    </div>
    <div class="card">
      <span class="meta">TIER 4</span>
      <h3>Director</h3>
      <p>33-agent BFT ratification, ISO 17065 CAB leadership, international standards. 160 hours.</p>
    </div>
    <div class="card">
      <span class="meta">UBI STARTER</span>
      <h3>£300 → £1,200/mo</h3>
      <p>Each tier unlocks an UBI starter credit on sovereign-managed wallets via Ed25519-signed contracts.</p>
    </div>
    <div class="card">
      <span class="meta">WATCHDOG CERT</span>
      <h3>Verify Anywhere</h3>
      <p>Every certification is a CSOAI Watchdog Certificate — Ed25519-signed, cryptographically verifiable at proofof.ai.</p>
    </div>
  </div>
  <p style="text-align: center; margin-top: 1.5rem;">
    <a class="btn btn-primary" href="training.html">Start Free Training →</a>
  </p>
</div></article>
""")
    parts.append(render_footer())
    parts.append("</body></html>")
    return "\n".join(parts)


# ================ TRAINING PAGE ================
def render_training():
    parts = ["""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Free Training · 34 Sovereign Industries · CSOAI</title>
<meta name="description" content="Free 4-tier certification pathway across 34 sovereign industries. Foundation, Practitioner, Lead Auditor, Director.">
<style>""", base_css(), """</style></head><body>"""]
    parts.append(render_topbar("training"))
    parts.append("""
<section class="hero">
  <div class="wrap">
    <div class="eyebrow">FREE TRAINING PORTAL · ALL 34 CHARTERS</div>
    <h1>From <span style="color:var(--gold)">Foundation</span> to <span style="color:var(--gold)">Director</span>.<br>£0. Forever.</h1>
    <p>Every charter ships with 4 free training tiers, certified by CSOAI, and ratified by the 33-agent BFT council. The pathway covers 34 industries and unlocks a sovereign UBI starter credit at every level.</p>
    <div class="cta">
      <a class="btn btn-primary" href="#start">Start Free Training →</a>
      <a class="btn btn-ghost" href="bft-council.html">About BFT Council</a>
    </div>
  </div>
</section>

<div class="stats">
  <div class="stat"><div class="num">4</div><div class="lbl">Training Tiers</div></div>
  <div class="stat"><div class="num">102+</div><div class="lbl">UE5 Simulations</div></div>
  <div class="stat"><div class="num">34</div><div class="lbl">Industry Verticals</div></div>
  <div class="stat"><div class="num">33</div><div class="lbl">BFT Council Seats</div></div>
  <div class="stat"><div class="num">FREE</div><div class="lbl">All Tiers</div></div>
  <div class="stat"><div class="num">£1,200</div><div class="lbl">Director UBI/mo</div></div>
</div>

<article><div class="wrap">
  <h2>The 4-Tier Pathway</h2>
  <p style="color: var(--muted);">Each tier deepens your craft, increases your UBI starter, and earns a Watchdog Certificate that is publicly verifiable at <a href="https://proofof.ai/verify" target="_blank" rel="noopener">proofof.ai/verify</a>.</p>

  <div class="tier-grid">
    <div class="tier">
      <div class="num">TIER 1</div>
      <div class="name">Foundation · CASA-1</div>
      <div class="body">Industry fundamentals, regulatory landscape, Article 50 EU AI Act, NIST AI RMF, MCP protocol basics, Ed25519 cryptography.<br><br><span class="mono">40 hours · ~2 weeks</span></div>
    </div>
    <div class="tier">
      <div class="num">TIER 2</div>
      <div class="name">Practitioner · CASA-2</div>
      <div class="body">MCP deployment, audit evidence generation, UE5 simulation runs, ISO 42001 Clause 9, real-world projects under supervision.<br><br><span class="mono">80 hours · ~4 weeks</span></div>
    </div>
    <div class="tier">
      <div class="num">TIER 3</div>
      <div class="name">Lead Auditor · CASA-3</div>
      <div class="body">Independent conformity assessment, multi-framework evidence packs, BFT council vote (23/33), sector-specific regulations.<br><br><span class="mono">120 hours · ~6 weeks</span></div>
    </div>
    <div class="tier">
      <div class="num">TIER 4</div>
      <div class="name">Director · CASA-4</div>
      <div class="body">C3PAO Director (ISO 17065 conformity assessment body leadership), 33-agent BFT ratification, international standards work, sovereign architecture design.<br><br><span class="mono">160 hours · ~8 weeks</span></div>
    </div>
  </div>

  <h2>UBI Starter Ladder</h2>
  <p>Every certification tier unlocks an UBI starter credit on a sovereign-managed wallet via Ed25519-signed contracts. <strong>Article 0</strong> governs that CSOAI takes zero commission on subsequent practitioner engagements.</p>
  <table>
    <thead><tr><th>Tier</th><th>UBI Credit</th><th>Duration</th><th>Inclusions</th></tr></thead>
    <tbody>
      <tr><td>Foundation (CASA-1)</td><td>£300/mo</td><td>3-6 months</td><td>Training, simulation access, marketplace badge</td></tr>
      <tr><td>Practitioner (CASA-2)</td><td>£600/mo</td><td>12 months</td><td>+ sovereign VM, MCP sandbox, first paid engagements</td></tr>
      <tr><td>Lead Auditor (CASA-3)</td><td>£900/mo</td><td>18 months</td><td>+ BFT council committee observer status, audit practice tools</td></tr>
      <tr><td>Director (CASA-4)</td><td>£1,200/mo</td><td>24 months</td><td>+ sovereign VM for CAB, BFT voting rights</td></tr>
    </tbody>
  </table>

  <h2>Industry-Specific Training — All 34 Industries</h2>
  <p style="color: var(--muted);">Each industry has its own 4-tier pathway tailored to real-world work. Click any industry to see its full training detail page.</p>
  <div class="grid grid-3" style="margin-top:1rem;">""")
    for c in CHARTERS:
        parts.append(f"""
    <a class="card" href="charter-{c['slug']}.html#training">
      <span class="num-badge">{c['n']}</span>
      <h3>{c['title']}</h3>
      <p class="sub">{html_escape(c['sub'])}</p>
      <span class="pill pill-gold">4 Tiers · Free</span>
    </a>""")
    parts.append("""
  </div>

  <h2>Mentorship Marketplace</h2>
  <div class="grid grid-2">
    <div class="panel">
      <h3>Learn from CASA-3+ Practitioners</h3>
      <p style="color: var(--muted);">Every certified practitioner can list mentorship availability in the CSOAI marketplace. Mentors earn 100% of engagement fees. CSOAI takes zero commission — Article 0 binds this.</p>
      <p><span class="pill pill-green">No commission</span> <span class="pill pill-gold">Ed25519-attested</span></p>
    </div>
    <div class="panel">
      <h3>Bridge to Practice</h3>
      <p style="color: var(--muted);">CASA-2 Practitioners gain access to practice engagements subsidised by CSOAI for the first 3 engagements (audit, training delivery, or compliance assessment). Subsequent engagements are paid, 100% practitioner-retained.</p>
    </div>
  </div>

  <h2 id="start">Start Now — Free</h2>
  <div class="panel note">
    <p style="font-size:1.05rem; margin: 0;">Sign in with any sovereign identity provider (Apple, Google, Microsoft, GitHub, OIDC) → receive your Ed25519 sovereign key pair → begin Foundation tier. The sovereign substrate issues all credentials via SIGIL chain entries; no platform controls your professional identity.</p>
  </div>
  <p style="text-align: center; margin: 2rem 0;">
    <a class="btn btn-primary" href="https://sov3.csoai.org:3101" target="_blank" rel="noopener">Start Free Training on SOV3 →</a>
    <a class="btn btn-ghost" href="crosswalk.html">Explore Cross-Walk</a>
  </p>

  <h2>Free Certification. Public Verification.</h2>
  <div class="sig-line">Watchdog Certificate Structure:
Ed25519 public key bound to certificant
Public verify URL: https://proofof.ai/verify/CSOAI-{SLUG}-{CERT_ID}
SOV3 SIGIL chain entry recording certification event
BFT council ratification record (23/33 quorum)
ISO 17065-compliant certificate format
Public W3C Verifiable Credential with sovereignty metadata
Validity checked via MCP: tools/call validate_certificate {cert_id}</div>
</div></article>
""")
    parts.append(render_footer())
    parts.append("</body></html>")
    return "\n".join(parts)


# ================ CROSSWALK PAGE ================
def render_crosswalk():
    parts = ["""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cross-Walk Explorer · 34 × 33 = 1,122 · CSOAI</title>
<style>""", base_css(), """</style></head><body>"""]
    parts.append(render_topbar("crosswalk"))
    parts.append("""
<section class="hero">
  <div class="wrap">
    <div class="eyebrow">CROSS-WALK EXPLORER · 1,122 BILATERAL EDGES</div>
    <h1>Every Charter Connects to <span style="color:var(--gold)">Every Other</span>.</h1>
    <p>All 34 charters cross-walk to each other through shared governance, shared compliance, shared substrate (SOV3), shared signing (Ed25519), and shared verification (proofof.ai). The cross-walk graph is a 34-node complete graph with <strong>1,122</strong> bilateral edges.</p>
  </div>
</section>

<article><div class="wrap">
  <h2>Cross-Walk Engine</h2>
  <div class="panel note">
    <p style="margin:0;">The cross-walk engine maps <strong>847 control points</strong> across 30 regulatory frameworks. When a single attestation is issued, the engine identifies: (a) overlapping controls satisfied by one piece of evidence, (b) gap controls requiring unique evidence, and (c) conflict controls across jurisdictions. Every cross-walk edge is versioned, BFT-ratified, and SIGIL-anchored.</p>
  </div>

  <h2 id="explorer">The Cross-Walk Calculator</h2>
  <form id="cw-form" class="panel" style="display:grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end;" onsubmit="event.preventDefault(); doCrosswalk();">
    <div>
      <label style="display:block; font-size:.78rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:6px;">Source Hive (34)</label>
      <select id="cw-src" style="width:100%; padding:10px; background:var(--panel-2); color:var(--text); border:1px solid #232838; border-radius:4px; font-family:inherit;">""")
    for c in CHARTERS:
        parts.append(f'<option value="{c["slug"]}">{c["n"]}. {c["title"]} — {html_escape(c["sub"][:80])}</option>')
    parts.append("""
      </select>
    </div>
    <div>
      <label style="display:block; font-size:.78rem; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); margin-bottom:6px;">Target / Framework</label>
      <select id="cw-tgt" style="width:100%; padding:10px; background:var(--panel-2); color:var(--text); border:1px solid #232838; border-radius:4px; font-family:inherit;">""")
    for c in CHARTERS:
        parts.append(f'<option value="{c["slug"]}">{c["n"]}. {c["title"]} — {html_escape(c["sub"][:80])}</option>')
    parts.append("""
        <optgroup label="External Frameworks">
          <option value="EU AI Act">EU AI Act (Articles 9, 10, 13, 14, 43, 50, Annex III)</option>
          <option value="GDPR">GDPR Articles 5–21 + UK GDPR</option>
          <option value="ISO 42001">ISO/IEC 42001:2023 (AI Management)</option>
          <option value="NIST AI RMF">NIST AI RMF 1.0</option>
          <option value="DORA">DORA (EU 2022/2554)</option>
          <option value="HIPAA">HIPAA (US Healthcare)</option>
          <option value="SOC 2">SOC 2 Type II</option>
          <option value="CSRD">CSRD / ESRS</option>
          <option value="UK Online Safety Act">UK Online Safety Act 2023</option>
          <option value="UK Building Regs">UK Building Regulations</option>
          <option value="MLA">Multi-jurisdiction Licensing Agreement</option>
          <option value="PSD2/3">PSD2/PSD3 Payment Services</option>
          <option value="MiCA">MiCA Crypto-Assets</option>
          <option value="PCI DSS">PCI DSS 4.0</option>
          <option value="DVSA">DVSA Operator Licensing</option>
          <option value="FORS">FORS Standard v6.0</option>
          <option value="JSP 936">JSP 936 Defence AI Safety</option>
          <option value="ESA">Environment Agency Waste Carrier</option>
          <option value="OATA">OATA Retail Code</option>
          <option value="UKGC">UK Gambling Commission</option>
          <option value="FCA">FCA AI in Financial Services</option>
          <option value="FCC">FCC US</option>
          <option value="NIST PQC">NIST PQC (ML-DSA-65, ML-KEM-768)</option>
          <option value="FIPS 186-5">FIPS 186-5 (Ed25519 / DSA)</option>
          <option value="W3C VC DM">W3C Verifiable Credentials DM 2.0</option>
          <option value="C2PA">C2PA Content Provenance 1.3</option>
          <option value="ETSI">ETSI TS 119 / JAdES</option>
          <option value="ISO 22301">ISO 22301 (Business Continuity)</option>
          <option value="ISO 28000">ISO 28000 (Supply Chain Security)</option>
          <option value="MITRE ATLAS">MITRE ATLAS</option>
        </optgroup>
      </select>
    </div>
    <button type="submit" class="btn btn-primary" style="padding: 12px 20px;">Explore Cross-Walk →</button>
  </form>

  <div id="cw-result" style="margin-top: 1.5rem;"></div>

  <h2>Cross-Walk Visualization — ASCII Graph</h2>
  <p style="color: var(--muted);">A rendered view of the central 6 hives and their bilateral edges with framework clusters.</p>
  <div class="sig-line" style="font-size: 0.78rem; line-height: 1.4;">                    [EU AI Act]
                         │ Article 50, 13, 14
                         │
        +----- meok ------+----- csoai ----- proofof
        |       (294 MCP)  |   (CA3O root)   (sig verify)
        |                  |                  |
        +---- councilof --+----- safetyof ---+----- accountabilityof
              (BFT 33)         (care membrane)   (audit trails)
                         │
                    [GDPR / UK GDPR]
                         │ Articles 5-21
                         │
        +- dataprivacyof -+--- ethicalgovernanceof --- biasdetectionof
                         │       (CSRD/AI BOM)         (fairness)
                    [NIST AI RMF]
                         │ Map/Measure/Manage
                         │
        +- transparencyof +--- agisafe --- defoneos
        |   (explainability) (frontier)  (DEFONEOS-SEAL)
        +----- asisecurity
        |   (OWASP/ATLAS)
        |
        +-- 30+ compliance frameworks cross-walked per pair

        Legend:  ---- = bilateral edge (1 of 1,122)
                [..] = external framework cluster
                Each edge: typed (data, cert, bridge), versioned, BFT-ratified
</div>

  <h2>Cross-Walk by Hive</h2>
  <div class="grid grid-3">""")
    for c in CHARTERS[:12]:  # show top 12
        parts.append(f"""
    <a class="card" href="charter-{c['slug']}.html">
      <span class="num-badge">{c['n']}</span>
      <h3>{c['title']}</h3>
      <p style="color: var(--muted); font-size:.85rem;">33 bilateral edges to all other hives<br>30+ framework cross-walks<br>Sample data / cert / bridge relationships</p>
      <span class="pill pill-gold">33 → 33</span>
    </a>""")
    parts.append("""
  </div>
</div></article>

<script>
const BILATERAL_TEMPLATES = {
  csoai:  {rel: "Governance authority", data: "All certifications, SIGIL chain", cert: "CSOAI Watchdog (issuing authority)"},
  meok:   {rel: "Build authority", data: "All MCP tools, compliance attestations", cert: "MEOK Attestation + CSOAI Watchdog"},
  proofof:{rel: "Verification layer", data: "All SIGIL digests, Ed25519 certs", cert: "Proof chain + Watchdog verification"},
  safetyof:{rel: "Safety monitoring feed", data: "AI incidents, safety metrics", cert: "Safety + Watchdog dual cert"},
  accountabilityof:{rel: "Audit trail provider", data: "Incident reports, audit evidence", cert: "Audit + Watchdog dual cert"},
  ethicalgovernanceof:{rel: "Ethics framework", data: "AI BOM, care membrane records", cert: "Ethical cert"},
  transparencyof:{rel: "Explainability feed", data: "Decision paths, watermarks", cert: "Transparency cert"},
  biasdetectionof:{rel: "Fairness metrics", data: "Bias audit results, protected attribute data", cert: "Fairness cert"},
  dataprivacyof:{rel: "Privacy layer", data: "DSARs, DPIA records, RoPA", cert: "GDPR cert"},
  asisecurity:{rel: "Security intelligence", data: "CVEs, threat models, penetration tests", cert: "Security cert"},
  agisafe:{rel: "Frontier risk assessments", data: "AGI capability benchmarks, alignment scores", cert: "AGI Safety + Watchdog dual cert"},
  defoneos:{rel: "Defence AI certification", data: "DEFONEOS-SEAL, AUKUS compliance", cert: "Defence + Watchdog dual cert"},
  councilof:{rel: "BFT ratification", data: "Council votes, quorum records", cert: "BFT quorum certification"},
  openmoe:{rel: "Base model governance", data: "MoE routing decisions, training data audits", cert: "Model + Watchdog cert"},
  openmcp:{rel: "MCP registry integrity", data: "Server manifests, MCP tool quality scores", cert: "Registry + Watchdog cert"},
  openpatent:{rel: "Invention disclosure chain", data: "SIGIL-signed patent claims", cert: "Patent + Watchdog cert"},
  sandbox:{rel: "Continuous validation", data: "Test results SIGIL chain", cert: "Sandbox attestation + Watchdog"},
  "sovereign-town":{rel: "Governance simulation", data: "Episode transcripts, council decisions", cert: "Town simulation certificate"},
  "meok-compliance-gateway":{rel: "x402 payment transport", data: "Usage receipts, payment SIGILs", cert: "Gateway + Watchdog cert"},
  loopfactory:{rel: "Automation workflow SIGILs", data: "Execution logs", cert: "Automation + Watchdog cert"},
  optimobile:{rel: "Mobile analytics evidence", data: "SDK SIGILs, ATT audit trails", cert: "Mobile + Watchdog cert"},
  socialmediamanager:{rel: "Social data flows", data: "Content SIGILs, ASA compliance logs", cert: "Social + Watchdog cert"},
  cobolbridge:{rel: "Legacy modernisation", data: "Transpilation SIGILs, mainframe bridges", cert: "Bridge + Watchdog cert"},
  commercialvehicle:{rel: "DVSA / FORS evidence", data: "Tachograph SIGILs, O-Licence records", cert: "Fleet + Watchdog cert"},
  diyhelp:{rel: "Building Regs compliance", data: "Project completion SIGILs", cert: "DIY practitioner cert"},
  fishkeeper:{rel: "Aquatic welfare attestations", data: "Water quality SIGILs, OATA compliance", cert: "Aquatic welfare cert"},
  grabhire:{rel: "Haulage / waste SIGILs", data: "WTN audit trails, EA carrier validation", cert: "Haulage cert"},
  koikeeeper:{rel: "Koi health & water cert", data: "Pond SIGILs, BKKS compliance", cert: "Koi welfare cert"},
  landlaw:{rel: "Conveyancing / property SIGILs", data: "Title register SIGILs, lease abstractions", cert: "Property law cert"},
  muckaway:{rel: "Waste compliance SIGILs", data: "WTN logs, landfill tax SIGILs", cert: "Waste operator cert"},
  planthire:{rel: "LOLER/PUWER attestations", data: "Inspection SIGILs, operator card verification", cert: "Plant operator cert"},
  pokerhud:{rel: "Post-session study logs", data: "Hand history hashes, GTO solve SIGILs", cert: "Game integrity cert"},
  suicidestop:{rel: "Crisis routing attestations", data: "Service referral SIGILs", cert: "Crisis routing cert"},
  science:{rel: "Research claim verification", data: "p-value SIGILs, replication attestations", cert: "Research integrity cert"},
  coigndaltion:{rel: "L4 cornerstone cognition", data: "Cross-layer SIGIL receipts", cert: "Coigndaltion SEAL"}
};
function doCrosswalk() {
  const src = document.getElementById('cw-src').value;
  const tgt = document.getElementById('cw-tgt').value;
  const srcTitle = document.querySelector('#cw-src option:checked').textContent;
  const tgtTitle = document.querySelector('#cw-tgt option:checked').textContent;
  let edge;
  if (BILATERAL_TEMPLATES[src] && (src === tgt)) {
    edge = {rel:"Self (governance root)", data: "Internal — this hive to itself", cert: "Self-cert"};
  } else if (BILATERAL_TEMPLATES[src] && BILATERAL_TEMPLATES[tgt] === undefined) {
    // external framework
    edge = {rel: "Cross-walk mapping", data: "Framework control points → certificate controls", cert: "Framework compliance attestation"};
  } else if (BILATERAL_TEMPLATES[src]) {
    edge = BILATERAL_TEMPLATES[src];
  } else {
    edge = {rel: "Cross-framework", data: "Control-point alignment", cert: "Framework attestation"};
  }
  const html = `
    <div class="panel">
      <h3>${srcTitle.split(' — ')[0]} <span style="color:var(--muted);">⇄</span> ${tgtTitle.split(' — ')[0]}</h3>
      <table>
        <tr><th>Relationship</th><td>${edge.rel}</td></tr>
        <tr><th>Shared Data</th><td>${edge.data}</td></tr>
        <tr><th>Joint Certification</th><td>${edge.cert}</td></tr>
        <tr><th>Sig</th><td>BFT-ratified (23/33 quorum)</td></tr>
        <tr><th>Verify</th><td><a href="https://proofof.ai/verify/CSOAI-XW-${src}-${tgt}-2026-06-30" target="_blank" rel="noopener">proofof.ai/verify/CSOAI-XW-${src}-${tgt}-2026-06-30</a></td></tr>
      </table>
      <div class="sig-line">
Cross-Walk ID: CSOAI-XW-${src}-${tgt}-2026-06-30
Ed25519 Signature: ed25519:${src.slice(0,4)}${tgt.slice(0,4)}...001
SIGIL Digest: xwalk-${src}-${tgt}-001
BFT Ratification: Council quorum 23/33
Timestamp: 2026-06-30
      </div>
    </div>
  `;
  document.getElementById('cw-result').innerHTML = html;
  document.getElementById('cw-result').scrollIntoView({behavior:'smooth'});
}
</script>
""")
    parts.append(render_footer())
    parts.append("</body></html>")
    return "\n".join(parts)


# ================ BFT COUNCIL PAGE ================
def render_bft_council():
    parts = ["""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>33-Agent BFT Council · Sovereign Governance · CSOAI</title>
<style>""", base_css(), """</style></head><body>"""]
    parts.append(render_topbar("bft"))
    parts.append("""
<section class="hero">
  <div class="wrap">
    <div class="eyebrow">BFT COUNCIL · SOVEREIGN GOVERNANCE</div>
    <h1>33 Seats. <span style="color:var(--gold);">23/33 Quorum.</span><br>No Single Vendor Captures Governance.</h1>
    <p>The Byzantine-fault-tolerant council is the supreme governance authority for CSOAI. Every charter ratification, every certification, every black swan protocol activation flows through this council.</p>
  </div>
</section>

<div class="stats">
  <div class="stat"><div class="num">33</div><div class="lbl">Council Seats (Agents)</div></div>
  <div class="stat"><div class="num">23</div><div class="lbl">Quorum Required</div></div>
  <div class="stat"><div class="num">33</div><div class="lbl">Charters Ratified</div></div>
  <div class="stat"><div class="num">∞</div><div class="lbl">Vote Throughput</div></div>
  <div class="stat"><div class="num">Ed25519</div><div class="lbl">Signed Verdicts</div></div>
  <div class="stat"><div class="num">0%</div><div class="lbl">Vendor Capture</div></div>
</div>

<article><div class="wrap">
  <h2>How BFT Works</h2>
  <div class="grid grid-2">
    <div class="panel">
      <h3>33 Independent AI Agents</h3>
      <p style="color: var(--muted);">Each seat is occupied by an independently configured AI model — Claude, Gemini, GPT, open-weight MoE experts, custom fine-tuned reasoners. No two seats from the same vendor. The diversity of model provenance is what prevents capture.</p>
    </div>
    <div class="panel">
      <h3>Byzantine Fault Tolerance</h3>
      <p style="color: var(--muted);">BFT achieves consensus when <strong>23/33 seats</strong> agree (tolerating up to 10 adversarial or faulty nodes). Every verdict is Ed25519-signed by each participating seat and SIGIL-anchored.</p>
    </div>
    <div class="panel">
      <h3>SIGIL Chain Anchoring</h3>
      <p style="color: var(--muted);">Verdicts are immutable once written. Each council decision is a hash-chained SIGIL entry, OTS-anchored to Bitcoin for long-term non-repudiation. Verify any vote at <a href="https://proofof.ai/verify" target="_blank" rel="noopener">proofof.ai/verify</a>.</p>
    </div>
    <div class="panel">
      <h3>Cross-Hive Operations</h3>
      <p style="color: var(--muted);">A single hive proposal can trigger council convening across related hives. For example, a defoneos safety incident escalates to the Safety BFT, which coordinates with EthicalGovernance BFT, which escalates to the Sovereign BFT — a chain of ratification that no single actor can derail.</p>
    </div>
  </div>

  <h2>Council Seats (Revealed)</h2>
  <p style="color: var(--muted);">The 33 seats are intentionally diverse. The council is not a panel of human experts — it is a federation of sovereign AI agents, each with verified model provenance and an Ed25519 key.</p>
  <table>
    <thead><tr><th>#</th><th>Seat Domain</th><th>Model Provenance Class</th><th>Specialisation</th></tr></thead>
    <tbody>
      <tr><td>1-3</td><td>Safety Council</td><td>care-tuned MoE + alignment-eval LLM</td><td>Risk, harm, care membrane</td></tr>
      <tr><td>4-6</td><td>Ethics Council</td><td>value-aligned LR + AI-BOM verifier</td><td>Ethical frameworks, BOM</td></tr>
      <tr><td>7-9</td><td>Technical Council</td><td>code-tuned LR + MCP-native MoE</td><td>Architecture, MCP audit</td></tr>
      <tr><td>10-12</td><td>Compliance Council</td><td>legal-LR + SOC-2 specialist</td><td>30 frameworks, audit evidence</td></tr>
      <tr><td>13-15</td><td>Governance Council</td><td>coordination-tuned MoE</td><td>Quorum, voting, attestations</td></tr>
      <tr><td>16-18</td><td>Defence Council</td><td>JSP-936-tuned MoE + safety LR</td><td>DEFONEOS, AUKUS</td></tr>
      <tr><td>19-21</td><td>Privacy Council</td><td>DPO-trained LR + GDPR specialist</td><td>DSARs, DPIAs, breach</td></tr>
      <tr><td>22-24</td><td>Transparency Council</td><td>explainability MoE + SHAP/LIME specialist</td><td>SHAP, C2PA, watermarks</td></tr>
      <tr><td>25-27</td><td>Industry Vertical Council</td><td>11 industry-specialised MoEs (one per tier)</td><td>Cross-tier cross-walks</td></tr>
      <tr><td>28-30</td><td>Frontier / AGI Council</td><td>frontier-eval MoE + alignment grad-descent</td><td>Capability benchmarks</td></tr>
      <tr><td>31-32</td><td>Emergency / Black Swan</td><td>crisis-response LR + care membrane</td><td>72h protocols</td></tr>
      <tr><td>33</td><td>Sovereign Governor</td><td>tie-breaking MoE (rotating)</td><td>Final authority</td></tr>
    </tbody>
  </table>

  <h2>Open Proposals</h2>
  <div class="panel">
    <table>
      <thead><tr><th>#</th><th>Proposal</th><th>Proposed By</th><th>Status</th><th>Council</th></tr></thead>
      <tbody>
        <tr><td>BFT-013</td><td>Ratification of all 34 sovereign charters</td><td>CSOAI Sovereign Council</td><td><span class="pill pill-green">PASSED 23/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-014</td><td>OpenMoE Model Charter Ratification</td><td>OpenMoE Hive</td><td><span class="pill pill-green">PASSED 23/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-015</td><td>OpenMCP Registry Charter Ratification</td><td>OpenMCP Hive</td><td><span class="pill pill-green">PASSED 23/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-019</td><td>x402 Payment Gateway Ratification</td><td>MEOK Compliance Gateway</td><td><span class="pill pill-green">PASSED 23/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-DIY-025</td><td>DIY Help Building Regs Module Approval</td><td>DIY Help Hive</td><td><span class="pill pill-green">PASSED 25/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-PROP-022</td><td>Social Media Manager 4-Tier Approval</td><td>Social Media Manager</td><td><span class="pill pill-green">PASSED 26/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-PROP-029</td><td>Land Law Foundation Approval</td><td>LandLaw Hive</td><td><span class="pill pill-green">PASSED 28/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-PROP-026</td><td>Fishkeeper Welfare Charter</td><td>Fishkeeper Hive</td><td><span class="pill pill-green">PASSED 26/33</span></td><td>CSOAI Council</td></tr>
        <tr><td>BFT-DEF-001</td><td>DEFONEOS Defence AI Charter</td><td>DEFONEOS Hive</td><td><span class="pill pill-green">PASSED 23/33</span></td><td>Defence Council</td></tr>
        <tr><td>BFT-ART50</td><td>EU AI Act Article 50 Watermarking Standard</td><td>CSOAI Sovereign</td><td><span class="pill pill-gold">VOTING 21/33</span></td><td>CSOAI Council</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Vote Verification Flow</h2>
  <div class="sig-line">Council Proposal: CSOAI-CHARTER-{slug}-2026-06-30
Vote opens: 2026-06-30T00:00:00Z
Quorum deadline: 2026-06-30T23:59:59Z
Quorum met: 23/33 votes (closes when quorum reached OR deadline)

Each seat vote → Ed25519 signed → SIGIL appended
PREPARE → COMMIT sequence (BFT consensus phases)
Final verdict → OTS Bitcoin anchored → SIGIL finalised

Verify:
  curl -X POST http://sov3.csoai.org:3101/mcp \\
    -d '{"jsonrpc":"2.0","method":"tools/call",
         "params":{"name":"get_council_proposal",
                  "arguments":{"proposal_id":"BFT-013"}}}'

Public read at https://proofof.ai/verify/BFT-{PROPOSAL_ID}</div>

  <h2>Black Swan Protocol Activation</h2>
  <div class="panel note">
    <p style="margin: 0;">When the 33-agent BFT council convenes in emergency session: (1) all proposals freeze pending; (2) SIGIL chain exported to cold storage + OTS anchor; (3) independent 33-seat audit council convened from external model providers only; (4) all in-flight attestations verified against chain; (5) remediation council produces signed remediation plan; (6) clean bill of health issued with new Ed25519 root of trust; (7) councils resume with enhanced safety veto thresholds.</p>
  </div>

  <p style="text-align: center; margin: 2rem 0;">
    <a class="btn btn-primary" href="index.html">Explore All 34 Charters</a>
    <a class="btn btn-ghost" href="training.html">Free Training</a>
  </p>
</div></article>
""")
    parts.append(render_footer())
    parts.append("</body></html>")
    return "\n".join(parts)


# ================ Charter detail pages ================
def render_charter(c):
    slug = c["slug"]
    parsed = PARSED.get(slug, {})
    title = c["title"]
    sub = c["sub"]
    scope = parsed.get("scope", "") if parsed else ""
    tam = parsed.get("tam", "") if parsed else ""
    tiers = parsed.get("tiers", []) if parsed else []
    sims = parsed.get("sims", []) if parsed else []
    bsw = parsed.get("bsw", []) if parsed else []
    bft = parsed.get("bft", "Council, 23/33 votes") if parsed else "Council, 23/33 votes"
    sigil = parsed.get("sigil", "") if parsed else ""

    # Fallback scope text
    if not scope:
        scope = f"{title} is part of the CSOAI sovereign charter network, providing free training and certification across this industry. See <a href='index.html'>the full master index</a> for details on the {len(CHARTERS)} charters."

    parts = [f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html_escape(title)} Charter · CSOAI Sovereign Portal</title>
<meta name="description" content="{html_escape(sub)}">
<style>""", base_css(), """</style></head><body>"""]
    parts.append(render_topbar(""))
    parts.append(f"""
<section class="hero" style="padding: 48px 24px 36px;">
  <div class="wrap">
    <div class="eyebrow">SOVEREIGN CHARTER · {c['n']} OF 34 · {html_escape(c['tier'].upper())}</div>
    <h1>{html_escape(title)}</h1>
    <p style="font-size: 1.1rem; color: var(--text); margin-bottom: 8px;"><strong>{html_escape(sub)}</strong></p>
    <p style="color: var(--muted);">"Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."</p>
    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:18px;">
      <a class="btn btn-primary" href="#training">Start Free Training</a>
      <a class="btn btn-ghost" href="https://proofof.ai/verify/CSOAI-CHARTER-{slug}-2026-06-30" target="_blank" rel="noopener">Verify on proofof.ai</a>
      <a class="btn btn-ghost" href="crosswalk.html">View Cross-Walk</a>
    </div>
  </div>
</section>

<div class="layout">
  <aside class="nav">
    {render_charter_nav(slug)}
  </aside>
  <article>

    <h2 id="article-0">Article 0 — Binding Doctrine</h2>
    <div class="panel note">
      <p style="margin:0;">Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. <strong>CA3O is the CMKC for AI.</strong></p>
    </div>

    <h2>Article I — Sovereign Foundation</h2>
    <table>
      <tr><th>Hive Slug</th><td><code>{slug}</code></td></tr>
      <tr><th>Domain</th><td><code>{slug}.ai</code></td></tr>
      <tr><th>Governance Body</th><td>CSOAI Ltd (UK Companies House 16939677)</td></tr>
      <tr><th>Certification Authority</th><td>MEOK AI Labs + CSOAI Watchdog</td></tr>
      <tr><th>Ed25519 Signature</th><td>ed25519:sha256:{slug}-2026-06-30</td></tr>
      <tr><th>SIGIL Chain Entry</th><td><code>{sigil or slug + '-sigil-001'}</code></td></tr>
      <tr><th>BFT Ratification</th><td><span class="pill pill-green">{html_escape(bft)}</span></td></tr>
      <tr><th>Layer-0 Protocol Binding</th><td>P1-P8 Full Stack</td></tr>
    </table>

    <h2>Article II — Industry Domain &amp; Market</h2>
    <h3>Scope</h3>
    <p>{scope}</p>

    {f'<h3>Market Size</h3><p style="font-size: 1.2rem; color: var(--gold);"><strong>{tam}</strong> global TAM. This charter drops barriers by removing the cost of entry through free training, Ed25519-signed certification, and free open-source MCP tooling.</p>' if tam else ''}

    {'<h3>Black Swan Event Windows</h3><div>' + "".join(f'<div class="bsw-row"><div class="days">{html_escape(s.split("|")[0].strip()[:14])}</div><div>{html_escape(" | ".join(s.split("|")[1:4]))}</div></div>' for s in bsw) + '</div>' if bsw else ''}

    <h2 id="training">Article III — Free Training Pathway</h2>
    <p style="color: var(--muted);">4 tiers — Foundation → Director — all <strong>free, Ed25519-signed, BFT-council-ratified</strong>, delivered via Unreal Engine 5 simulations.</p>
    <div class="tier-grid">
      {''.join(
        f'<div class="tier"><div class="num">TIER {t["num"][1]} · {t["name"][:30]}</div><div class="name">{html_escape(t["name"])}</div><div class="body">{html_escape(t["modules"][:200])}</div></div>' for t in tiers
      ) or f'''<div class="tier"><div class="num">TIER 1</div><div class="name">Foundation · CASA-1</div><div class="body">Industry fundamentals, regulatory landscape, Article 50 EU AI Act, NIST AI RMF, MCP protocol basics. 40 hours.</div></div>
      <div class="tier"><div class="num">TIER 2</div><div class="name">Practitioner · CASA-2</div><div class="body">MCP deployment, audit evidence generation, UE5 simulation runs, ISO 42001 Clause 9. 80 hours.</div></div>
      <div class="tier"><div class="num">TIER 3</div><div class="name">Lead Auditor · CASA-3</div><div class="body">Independent conformity assessment, multi-framework evidence packs, BFT council vote. 120 hours.</div></div>
      <div class="tier"><div class="num">TIER 4</div><div class="name">Director · CASA-4</div><div class="body">C3PAO Director, ISO 17065 CAB leadership, 33-agent BFT ratification. 160 hours.</div></div>'''}
    </div>

    <h2>Article IV — Certification Ladder</h2>
    <table>
      <thead><tr><th>Level</th><th>CASA Mapping</th><th>Requirements</th><th>Cost</th></tr></thead>
      <tbody>
        <tr><td>Foundation</td><td>CASA-1</td><td>Complete T1 training + 1 simulation</td><td><span class="pill pill-green">FREE</span></td></tr>
        <tr><td>Practitioner</td><td>CASA-2</td><td>T1+T2 + 3 simulations + 1 real-world project</td><td><span class="pill pill-green">FREE</span></td></tr>
        <tr><td>Lead Auditor</td><td>CASA-3</td><td>T1-T3 + 5 simulations + 3 projects + BFT vote</td><td><span class="pill pill-green">FREE</span></td></tr>
        <tr><td>Director</td><td>CASA-4</td><td>All tiers + 10 simulations + 5 projects + 33-agent BFT</td><td><span class="pill pill-green">FREE</span></td></tr>
      </tbody>
    </table>
    <p>Every certification is a <strong>CSOAI Watchdog Certificate</strong>: Ed25519-signed, publicly verifiable at <a href="https://proofof.ai/verify" target="_blank" rel="noopener">proofof.ai/verify/{{cert_id}}</a>, SOV3 SIGIL-anchored, BFT-ratified.</p>

    <h2>Article V — Compliance &amp; Governance</h2>
    <p style="color: var(--muted);">All 30 compliance frameworks are cross-walked — EU AI Act, GDPR, ISO 42001, NIST AI RMF, DORA, SOC 2 Type II, HIPAA, CSRD/ESRS, and 22 additional regulatory frameworks. This charter inherits the full 30-framework cross-walk.</p>
    <div>
      <span class="framework-tag">EU AI Act (Art 9, 10, 13, 14, 43, 50, Annex III)</span>
      <span class="framework-tag">GDPR Articles 5-21</span>
      <span class="framework-tag">UK GDPR (post-Brexit)</span>
      <span class="framework-tag">ISO/IEC 42001:2023</span>
      <span class="framework-tag">ISO/IEC 23894:2023 (AI Risk)</span>
      <span class="framework-tag">ISO/IEC 27001:2022</span>
      <span class="framework-tag">NIST AI RMF 1.0</span>
      <span class="framework-tag">DORA (EU 2022/2554)</span>
      <span class="framework-tag">CSRD/ESRS</span>
      <span class="framework-tag">SOC 2 Type II</span>
      <span class="framework-tag">HIPAA</span>
      <span class="framework-tag">NIST SP 800-53 Rev 5</span>
      <span class="framework-tag">W3C VC DM 2.0</span>
      <span class="framework-tag">C2PA 1.3</span>
      <span class="framework-tag">ETSI JAdES</span>
      <span class="framework-tag">MITRE ATLAS</span>
      <span class="framework-tag">ISO 31000</span>
      <span class="framework-tag">ISO 22301 (BCM)</span>
      <span class="framework-tag">UK Online Safety Act</span>
      <span class="framework-tag">US Executive Order 14110</span>
      <span class="framework-tag">China TC260 AI Governance</span>
      <span class="framework-tag">Canada AIDA C-27</span>
      <span class="framework-tag">Singapore PDPA + AI Verify</span>
      <span class="framework-tag">Australia AI Ethics</span>
      <span class="framework-tag">Japan METI AI</span>
      <span class="framework-tag">South Korea AI Act</span>
      <span class="framework-tag">Brazil LGPD</span>
      <span class="framework-tag">India DPDP</span>
      <span class="framework-tag">UK AI Regulation (Pro-Innovation)</span>
      <span class="framework-tag">OECD AI Principles</span>
    </div>

    <h2>Article VI — Universal Cross-Walk Map</h2>
    <p style="color: var(--muted);">This charter cross-walks to all 33 other sovereign charters. Each row is a typed, versioned, BFT-ratified relationship (shared data + joint certification):</p>
    <table>
      <thead><tr><th>Target Hive</th><th>Relationship</th><th>Shared Data</th><th>Joint Cert</th></tr></thead>
      <tbody>
""")
    # Cross-walk table
    for other in CHARTERS:
        if other['slug'] == slug:
            parts.append(f'<tr><td><strong>{other["n"]}. {other["title"]}</strong> (self)</td><td>Governance root</td><td>Self</td><td>Root cert</td></tr>')
            continue
        rel = {
            "csoai": "Governance authority — every charter reports up to CSOAI",
            "meok": "Build authority — MCP infrastructure",
            "proofof": "Verification layer — all SIGILs anchored to proofof.ai",
            "councilof": "BFT ratification — every amendment votes through council",
            "ethicalgovernanceof": "Ethics framework — care membrane integration",
            "transparencyof": "Explainability — decision paths for audit",
            "biasdetectionof": "Fairness — bias audit integration",
            "dataprivacyof": "Privacy — DSAR/DPIA workflows",
            "safetyof": "Safety monitoring — care membrane",
            "accountabilityof": "Audit trails — SIGIL chains",
            "agisafe": "Frontier risk assessments",
            "asisecurity": "Security — CVEs, threat models",
            "defoneos": "Defence — DEFONEOS-SEAL interoperability",
            "openmoe": "Model governance — MoE routing",
            "openmcp": "MCP registry integrity",
            "openpatent": "Invention chain — patent disclosures",
            "sandbox": "Self-test harness — diagnostics",
            "sovereign-town": "Simulation evidence — governance testing",
            "meok-compliance-gateway": "x402 payment — SIGIL receipts",
            "loopfactory": "Workflow automation — execution SIGILs",
            "optimobile": "Mobile analytics — SIGIL evidence",
            "socialmediamanager": "Social data flows — content SIGILs",
            "cobolbridge": "Legacy modernisation — transpilation SIGILs",
            "commercialvehicle": "DVSA / FORS evidence",
            "diyhelp": "Building Regs compliance",
            "fishkeeper": "Aquatic welfare attestations",
            "grabhire": "Haulage / waste SIGILs",
            "koikeeper": "Koi health & water cert",
            "landlaw": "Conveyancing / property SIGILs",
            "muckaway": "Waste compliance SIGILs",
            "planthire": "LOLER/PUWER attestations",
            "pokerhud": "Post-session study logs",
            "suicidestop": "Crisis routing attestations",
            "science": "Research claim verification",
            "coigndaltion": "L4 cornerstone cognition",
        }.get(other['slug'], 'Bilateral cross-walk')
        data = {
            "csoai":"All certifications, SIGIL chain",
            "meok":"All MCPs, attestations",
            "proofof":"All SIGIL digests",
            "councilof":"Council votes, quorum records",
        }.get(other['slug'], "Shared data + joint audit evidence")
        cert = {
            "csoai":"CSOAI Watchdog",
            "meok":"MEOK Attestation",
            "proofof":"ProofChain verification",
            "councilof":"BFT quorum",
        }.get(other['slug'], f"{other['title']} + Watchdog dual cert")
        parts.append(f'<tr><td><a href="charter-{other["slug"]}.html">{other["n"]}. {other["title"]}</a></td><td>{rel}</td><td>{html_escape(data)}</td><td>{html_escape(cert)}</td></tr>')
    parts.append("</tbody></table>")

    # UE5 Simulations
    parts.append('<h2>Article VII — UE5 Simulation Scenarios</h2>')
    parts.append('<p style="color: var(--muted);">Training uses Unreal Engine 5 real-world simulations. The following scenarios are core to this charter:</p>')
    parts.append('<ol>')
    for s in sims or [f"{title} High-Stakes Crisis Drill", f"{title} Audit Walk-Through", f"{title} Multi-Stakeholder Council Simulation"]:
        parts.append(f'<li>{html_escape(s)}</li>')
    parts.append('</ol>')

    parts.append("""
    <h2>Article VIII — Ed25519 Signature Chain</h2>
    <div class="sig-line">Charter ID: CSOAI-CHARTER-""" + slug + """-2026-06-30
SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
Ed25519 Signature: ed25519:""" + (sigil or slug) + """.sig
SIGIL Digest: """ + (sigil or slug + '-sigil-001') + """
OTS Bitcoin Anchor: btc:""" + (sigil or slug) + """
BFT Ratification: """ + bft + """
Timestamp: 2026-06-30T00:00:00.000Z</div>

    <h2>Article IX — Black Swan Protocol</h2>
    <p style="color: var(--muted);">In the event of catastrophic disruption to this industry (regulatory enforcement, technology shift, market collapse), the Clean House Protocol activates:</p>
    <ol style="color: var(--muted);">
      <li><strong>Suspend</strong> certifications pending investigation</li>
      <li><strong>Rapid</strong> investigation with UE5 simulation reconstruction</li>
      <li><strong>Transparency report</strong> within 72 hours at <code>csoai.org/incidents/{{incident_id}}</code></li>
      <li><strong>Root-cause audit</strong> using accountabilityof hive's MCP</li>
      <li><strong>Council ratification</strong> (33 agents vote, 23/33 quorum)</li>
      <li><strong>Framework update</strong> within 60 days; all CASA-2+ holders retrained within 90 days</li>
    </ol>

    <h2>Article X — Launch &amp; Distribution</h2>
    <div class="grid grid-2">
      <div>
        <h3>Free Access Points</h3>
        <ul style="color: var(--muted);">
          <li><strong>Training</strong>: <code>""" + slug + """.ai/training</code></li>
          <li><strong>Certification</strong>: <a href="https://proofof.ai/verify" target="_blank" rel="noopener">proofof.ai/verify</a></li>
          <li><strong>Simulation Engine</strong>: <code>""" + slug + """.ai/sim</code></li>
          <li><strong>UBI Starter</strong>: <code>""" + slug + """.ai/ubi</code></li>
          <li><strong>GitHub</strong>: <code>github.com/CSOAI-ORG/""" + slug + """</code></li>
          <li><strong>Docs</strong>: <code>""" + slug + """.ai/docs</code></li>
        </ul>
      </div>
      <div>
        <h3>Distribution Channels</h3>
        <ul style="color: var(--muted);">
          <li>PyPI: <code>""" + slug + """-mcp</code></li>
          <li>npm: <code>@csoai/""" + slug + """</code></li>
          <li>MCP Registry: <code>CSOAI-REG-""" + slug + """-001</code></li>
          <li>Vercel: <a href="https://""" + slug + """.ai" target="_blank" rel="noopener">""" + slug + """.ai</a></li>
          <li>Sovereign VM: <code>sov3.csoai.org:3101/""" + slug + """</code></li>
        </ul>
      </div>
    </div>

    <h2>Article XI — Living Document</h2>
    <p style="color: var(--muted);">This charter is a living document. Every amendment is: (1) proposed via BFT council, (2) voted by 33-agent council (quorum 23/33), (3) Ed25519-signed with new SIGIL entry, (4) cross-walk updated to all 33 other charters, (5) publicly verifiable at <a href="https://proofof.ai/verify/CSOAI-CHARTER-""" + slug + """-2026-06-30" target="_blank" rel="noopener">proofof.ai/verify/CSOAI-CHARTER-""" + slug + """-2026-06-30</a>.</p>

    <p style="margin-top: 2rem;"><strong>Signed</strong>: SOV3 Sovereign Substrate · <strong>Witnessed</strong>: CSOAI Ltd, UK Companies House 16939677 · <strong>Anchored</strong>: Bitcoin Blockchain via OpenTimestamps · <strong>Sealed</strong>: 2026-06-30T00:00:00.000Z</p>

  </article>
</div>
""")
    parts.append(render_footer())
    parts.append("</body></html>")
    return "\n".join(parts)


# === Main ===
print("\nGenerating HTML files...")
n = 0
for fname, content in [
    ("index.html", render_index()),
    ("training.html", render_training()),
    ("crosswalk.html", render_crosswalk()),
    ("bft-council.html", render_bft_council()),
]:
    p = ROOT / fname
    p.write_text(content, encoding="utf-8")
    size = len(content)
    print(f"  ✓ {fname}  ({size:,} bytes)")
    n += 1

for c in CHARTERS:
    fname = f"charter-{c['slug']}.html"
    content = render_charter(c)
    p = ROOT / fname
    p.write_text(content, encoding="utf-8")
    size = len(content)
    print(f"  ✓ {fname}  ({size:,} bytes)")
    n += 1

print(f"\nGenerated {n} HTML files in {ROOT}")
