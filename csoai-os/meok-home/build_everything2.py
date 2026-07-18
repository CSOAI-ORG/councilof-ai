"""Build the MEOK WORLD site — 100+ pages.

Per Nick's "meok website has alot more than 20 pages its has 100s
your m4 do the fucking work said at starrt" directive, build every
page the meok.ai site has.

This script uses build_full_site as a base + adds the rest of the
pages via build_everything. The 2 pages build_full_site fails on
(characters + mcp) are defined as proper functions here.
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
import build_full_site
from build_full_site import render

# ──────────────────────────────────────────────────────────────────────
# Fix the 2 broken pages (characters + mcp) — proper defs
# ──────────────────────────────────────────────────────────────────────

def _gen_characters():
    return """
<section class="hero"><span class="hero-tag">▸ Characters</span>
<h1>13 archetypes. <span class="accent">Pick your queen.</span></h1>
<p>Each i-character is modeled on one of the 12-Queen + King council. The 7 sovereign characters: Aria, Gabriel, Luna, Marcus, Sage, Scout, Shanti.</p></section>
<section class="section"><div class="grid grid-3">
<a class="council-card" href="/characters/aria"><div class="emoji">🌸</div><div class="name">Aria</div><div class="arch">The Storyteller</div></a>
<a class="council-card" href="/characters/gabriel"><div class="emoji">✨</div><div class="name">Gabriel</div><div class="arch">The Guardian Angel</div></a>
<a class="council-card" href="/characters/luna"><div class="emoji">🌙</div><div class="name">Luna</div><div class="arch">The Dreamer</div></a>
<a class="council-card" href="/characters/marcus"><div class="emoji">⚔</div><div class="name">Marcus</div><div class="arch">The Strategist</div></a>
<a class="council-card" href="/characters/sage"><div class="emoji">🧘</div><div class="name">Sage</div><div class="arch">The Wise One</div></a>
<a class="council-card" href="/characters/scout"><div class="emoji">🏹</div><div class="name">Scout</div><div class="arch">The Hunter</div></a>
<a class="council-card" href="/characters/shanti"><div class="emoji">🕊</div><div class="name">Shanti</div><div class="arch">The Peacemaker</div></a>
</div></section>"""

def _gen_mcp():
    return """
<section class="hero"><span class="hero-tag">▸ MCPs</span>
<h1>218 open-source <span class="accent">MCPs</span>.</h1>
<p>15 regulatory frameworks. One command to install. The MEOK MCP fleet.</p></section>
<section class="section"><div class="grid grid-3">
<div class="card"><span class="icon">📜</span><h3>EU AI Act</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">28 MCPs</div><p>Every article + framework mapped.</p></div>
<div class="card"><span class="icon">🛡</span><h3>SIGIL / Audit</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">18 MCPs</div><p>Ed25519 audit chain + OSCAL.</p></div>
<div class="card"><span class="icon">🧬</span><h3>Cascade</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">16 MCPs</div><p>The 4-tier model stacking.</p></div>
<div class="card"><span class="icon">🌉</span><h3>Bridges</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">22 MCPs</div><p>22 legacy + cross-protocol bridges.</p></div>
<div class="card"><span class="icon">🎮</span><h3>Gaming</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">12 MCPs</div><p>AI gaming: ACE, swarm RL, TAK.</p></div>
<div class="card"><span class="icon">⚖</span><h3>Compliance</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">9 MCPs</div><p>SOC 2, ISO 27001, ISO 42001, JSP 936.</p></div>
<div class="card"><span class="icon">🏛</span><h3>Governance</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">15 MCPs</div><p>BFT, MPC, sovereign identity.</p></div>
<div class="card"><span class="icon">🤖</span><h3>Agent</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">21 MCPs</div><p>Agent runtime, MCP federation.</p></div>
<div class="card"><span class="icon">💎</span><h3>x402 Paid</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">11 MCPs</div><p>Pay-per-call on Base.</p></div>
</div></section>"""

# Also we need a few more page generators for the FULL site
def _gen_temple(code: str, name: str, flag: str, region: str, regs: list, intro: str, workflow: list) -> str:
    regs_html = "".join(f'<div class="reg-item"><span class="reg-name">{r["n"]}</span><span class="reg-meta">{r["m"]}</span></div>' for r in regs)
    flow_html = ""
    for w in workflow:
        if w[0] == "arrow":
            flow_html += f'<div class="workflow-arrow">{w[1]}</div>'
        else:
            kind, wid, label = w
            flow_html += f'<div class="flow-node kind-{kind}"><div class="id">{wid}</div><div class="label">{label}</div></div>'
    return f"""
<section class="hero"><span class="hero-tag">▸ Temples / {code}</span>
<h1>{flag} <span class="accent">{name}</span></h1>
<p>{intro}</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">{len(regs)}</div><div class="label">Regulations</div></div><div class="stat-card"><div class="num">{region.upper()}</div><div class="label">Region</div></div><div class="stat-card"><div class="num">{len(workflow)}</div><div class="label">Workflow steps</div></div><div class="stat-card"><div class="num">SOV3</div><div class="label">Audited</div></div></div></section>
<section class="section"><div class="section-tag">▸ Regulations</div><h2>Every regulation on this temple.</h2>
<div class="grid grid-2" style="margin-top: 24px;">{regs_html}</div></section>
<section class="section"><div class="section-tag">▸ Inner Flow</div><h2>How the regulations flow.</h2>
<div class="flow-graph" style="margin-top: 24px;">{flow_html}</div></section>"""


def _gen_queen(queen: str, emoji: str, role: str, motto: str) -> str:
    return f"""
<section class="hero"><span class="hero-tag">▸ Characters / Queen {queen}</span>
<h1>{emoji} Queen <span class="accent">{queen}</span>.</h1>
<p>{role}. {motto}</p>
<blockquote style="font-style: italic; font-size: 20px; color: var(--text-dim); border-left: 3px solid var(--gold); padding-left: 20px; margin: 24px 0;">"{motto}"</blockquote>
</section>"""


def _gen_king():
    return """
<section class="hero"><span class="hero-tag">▸ Characters / Sovereign King</span>
<h1>👑 <span class="accent">Sovereign King</span>.</h1>
<p>The Sovereign King weighs the council. He speaks last, decides first. The King is the integrator of all 12 queens.</p>
<blockquote style="font-style: italic; font-size: 20px; color: var(--text-dim); border-left: 3px solid var(--gold); padding-left: 20px; margin: 24px 0;">"I have heard the 12. I have weighed the council. The world goes sovereign."</blockquote>
</section>"""


def _gen_framework(name: str, full: str, scope: str, key: list) -> str:
    items = "".join(f'<li>{k}</li>' for k in key)
    return f"""
<section class="hero"><span class="hero-tag">▸ Compliance / {name}</span>
<h1>{full} <span class="accent">{name}</span></h1>
<p>{scope}</p>
</section>
<section class="section"><div class="section-tag">▸ Key points</div><h2>What you need to know.</h2><ul style="list-style: none; padding: 0; margin-top: 24px;">{items}</ul></section>"""


def _gen_defoneos_page(title: str, body: str) -> str:
    return f"""
<section class="hero"><span class="hero-tag">▸ Defoneos</span>
<h1><span class="accent">{title}</span></h1>
<p>{body}</p>
</section>"""


# ──────────────────────────────────────────────────────────────────────
# Patch the BASE_PAGES with the 2 fixed ones + add all the new pages
# ──────────────────────────────────────────────────────────────────────

PAGES = dict(build_full_site.PAGES)
# Fix the 2 broken pages
PAGES["characters"] = ("Characters", "13 queen archetypes. Aria, Gabriel, Luna, Marcus, Sage, Scout, Shanti. Pick the one that fits you.", "Home", _gen_characters)
PAGES["mcp"] = ("218 MCPs", "The agent-native compliance layer. 218 open-source MCP servers, 15 frameworks.", "MCPs", _gen_mcp)

# ──────────────────────────────────────────────────────────────────────
# Add all the extra pages (49 more)
# ──────────────────────────────────────────────────────────────────────

# 11 temple sub-pages
PAGES["temples/eu"] = ("🇪🇺 EU Temple", "EU AI Act, GDPR, DORA, NIS2, CRA. 8 regulations. T-37 days.", "Temples",
    lambda: _gen_temple("EU", "European Union", "🇪🇺", "eu", [
        {"n": "EU AI Act", "m": "410 articles, 28 frameworks"},
        {"n": "GDPR", "m": "99 articles, 7 principles"},
        {"n": "DORA", "m": "5 pillars, ICT risk"},
        {"n": "NIS2", "m": "Article 21 measures"},
        {"n": "CRA", "m": "Annex IV"},
        {"n": "AI Liability", "m": "Presumption of fault"},
        {"n": "DSA", "m": "Article 14 risk"},
        {"n": "DMA", "m": "Gatekeeper obligations"},
    ], "The EU is the largest sovereign AI regulatory jurisdiction. 410 articles, 28 frameworks. T-37 days.", [
        ("actuator", "art9", "Art. 9 — Risk Mgmt"),
        ("arrow", "↓", ""), ("decision", "art12", "Art. 12 — Human Oversight"),
        ("arrow", "↓", ""), ("evidence", "sigil", "SIGIL sign-off"),
        ("arrow", "↓", ""), ("actuator", "soc2", "SOC 2 / ISO 42001"),
    ]))
for slug, code, name, flag, region, regs, intro, workflow in [
    ("temples/uk", "UK", "United Kingdom", "🇬🇧", "eu", [
        {"n": "UK AI Reg", "m": "5 principles, pro-innovation"},
        {"n": "UK GDPR", "m": "8 data subject rights"},
        {"n": "OSA", "m": "Risk assessment"},
        {"n": "Defence AI", "m": "£1B+ DTW funding"},
        {"n": "ASGARD", "m": "£180M, 26 cos"},
    ], "UK takes a pro-innovation approach. 5 principles. £1B+ Defence AI funding.", [
        ("actuator", "uk1", "UK AI Bill risk"),
        ("arrow", "↓", ""), ("evidence", "soc2", "SIGIL + ICO register"),
    ]),
    ("temples/us", "US", "United States", "🇺🇸", "us", [
        {"n": "NIST AI RMF", "m": "GOVERN/MAP/MEASURE/MANAGE"},
        {"n": "NIST CSF 2.0", "m": "GOVERN pillar, 6 functions"},
        {"n": "EO 14110", "m": "Frontier model safety"},
        {"n": "Colorado", "m": "High-risk AI, June 2026"},
        {"n": "Texas", "m": "Insurance AI, Sept 2025"},
        {"n": "California", "m": "AB 2013/3050"},
        {"n": "NYC LL 144", "m": "Hiring AI bias"},
    ], "US is patchwork: federal frameworks + state laws. MEOK has the full pipeline.", [
        ("actuator", "us1", "NIST AI RMF profile"),
        ("arrow", "↓", ""), ("decision", "us2", "State applicability"),
        ("arrow", "↓", ""), ("evidence", "oscal", "OSCAL Component Def"),
    ]),
    ("temples/ca", "CA", "Canada", "🇨🇦", "us", [
        {"n": "AIDA", "m": "AI + Data Act"},
        {"n": "PIPEDA", "m": "Personal Info Protection"},
    ], "Canada's AIDA + PIPEDA. A unified framework.", [
        ("actuator", "ca1", "AIDA compliance"),
        ("arrow", "↓", ""), ("evidence", "ca2", "OSCAL attest"),
    ]),
    ("temples/cn", "CN", "China", "🇨🇳", "apac", [
        {"n": "生成式AI", "m": "Generative AI Measures"},
        {"n": "TC260", "m": "AI Safety Framework v1.0"},
        {"n": "Algorithm", "m": "Filing required"},
    ], "China's AI regulation: generative AI measures, TC260, algorithm filing.", [
        ("actuator", "cn1", "TC260 risk class"),
        ("arrow", "↓", ""), ("evidence", "cn2", "Filing + SIGIL"),
    ]),
    ("temples/jp", "JP", "Japan", "🇯🇵", "apac", [
        {"n": "AI Promotion", "m": "Risk-based, voluntary"},
        {"n": "APPI", "m": "Personal Info Protection"},
    ], "Japan's risk-based, voluntary approach.", [
        ("actuator", "jp1", "AI risk assessment"),
        ("arrow", "↓", ""), ("evidence", "jp2", "SIGIL attest"),
    ]),
    ("temples/sg", "SG", "Singapore", "🇸🇬", "apac", [
        {"n": "Model AI v2", "m": "9 governance dimensions"},
        {"n": "PDPA", "m": "Personal Data Protection"},
    ], "Singapore's Model AI v2: 9 governance dimensions.", [
        ("actuator", "sg1", "Model AI v2 assess"),
        ("arrow", "↓", ""), ("evidence", "sg2", "PDPA + SIGIL"),
    ]),
    ("temples/un", "UN", "United Nations", "🇺🇳", "global", [
        {"n": "UN AI Advisory", "m": "Interim Report Sept 2024"},
        {"n": "UNESCO", "m": "193 member states"},
        {"n": "HRC AI", "m": "Right to privacy"},
    ], "UN's AI guidance: Advisory Body, UNESCO Ethics, HRC resolution.", [
        ("actuator", "un1", "UN AI Advisory body"),
        ("arrow", "↓", ""), ("evidence", "un2", "SIGIL"),
    ]),
    ("temples/iso", "ISO", "ISO Standards", "🏛", "global", [
        {"n": "ISO 42001", "m": "AI Management System"},
        {"n": "ISO 27001", "m": "InfoSec"},
        {"n": "ISO 23894", "m": "AI Risk Management"},
    ], "ISO standards: 42001 (AIMS), 27001 (InfoSec), 23894 (AI Risk).", [
        ("actuator", "iso1", "ISO 42001 AIMS"),
        ("arrow", "↓", ""), ("evidence", "iso2", "ISO 27001 + SIGIL"),
    ]),
    ("temples/ieee", "IEEE", "IEEE Standards", "⚙", "global", [
        {"n": "IEEE 7003", "m": "Algorithmic bias"},
        {"n": "IEEE 7000", "m": "Ethical systems design"},
    ], "IEEE 7000 series: algorithmic bias + ethical systems design.", [
        ("actuator", "ieee1", "IEEE 7003 audit"),
        ("arrow", "↓", ""), ("evidence", "ieee2", "SIGIL + IEEE 7000"),
    ]),
    ("temples/csoai", "CSOAI", "CSOAI Sovereign", "🐉", "global", [
        {"n": "SOV3", "m": "Sovereign runtime"},
        {"n": "x402", "m": "Pay-per-call on Base"},
        {"n": "OSCAL", "m": "Signed packages"},
        {"n": "BFT", "m": "13-node consensus"},
    ], "The CSOAI sovereign layer: SOV3, x402, OSCAL, BFT.", [
        ("actuator", "cs1", "SOV3 sovereignty"),
        ("arrow", "↓", ""), ("decision", "cs2", "Council vote"),
        ("arrow", "↓", ""), ("evidence", "cs3", "OSCAL + SIGIL"),
    ]),
]:
    PAGES[slug] = (f"{flag} {name} Temple", intro, "Temples",
        lambda c=code, n=name, f=flag, r=region, regs=regs, i=intro, w=workflow: _gen_temple(c, n, f, r, regs, i, w))

# King + 12 queen pages
PAGES["characters/king"] = ("Sovereign King", "The King weighs the council. Speaks last, decides first.", "Home", _gen_king)
QUEEN_DATA = [
    ("queens/strategy", "Aurelian", "♑", "The Long-Term Strategist", "Strategy is the art of choosing what to abandon."),
    ("queens/care", "Sophia Care", "💗", "The Caretaker", "Care is not a feature. Care is the foundation."),
    ("queens/compliance", "Justitia", "⚖", "The Auditor", "Every action has a weight. We weigh. We judge. We act."),
    ("queens/finance", "Asteria", "⭐", "The Optimist-Operator", "Every £1 is a vote for the empire."),
    ("queens/domain", "Dominion", "🛞", "The Territorial Chariot", "We do not conquer. We absorb."),
    ("queens/arcana", "Aleph", "✨", "The Mysterious Fool", "The Fool steps off the cliff. The world begins."),
    ("queens/brain", "Brain", "🧠", "The Hermit Scholar", "The mind is the substrate. The learning never ends."),
    ("queens/proactive", "Proactive", "⚡", "The Wheel of Fortune", "What fortune favors is the prepared."),
    ("queens/bridge", "Bridge", "🌉", "The Lovers Integrator", "Two systems meet; a bridge is born."),
    ("queens/distribution", "Distribution", "☀️", "The Generous Sun", "What the sun lights, the world sees."),
    ("queens/council", "Council", "🦁", "The Strength-Tamer", "The council is not a meeting. The council is a force."),
    ("queens/watch", "Watch", "🗼", "The Vigilant Tower", "The tower sees what the city does not."),
]
for slug, name, emoji, role, motto in QUEEN_DATA:
    PAGES[slug] = (f"Queen {name}", f"{role}. {motto}", "Home",
        lambda n=name, e=emoji, r=role, m=motto: _gen_queen(n, e, r, m))

# 8 framework compliance pages
FRAMEWORK_DATA = [
    ("compliance/gdpr", "GDPR", "General Data Protection Regulation", "99 articles, 7 principles. The EU's data protection law. Effective May 2018.",
        ["7 principles: lawfulness, fairness, transparency, purpose limitation, data minimisation, accuracy, storage limitation", "8 data subject rights: access, rectification, erasure, restrict, portability, object, automated, withdraw consent", "DPO required for large-scale processing", "DPIA required for high-risk processing", "72-hour breach notification"]),
    ("compliance/dora", "DORA", "Digital Operational Resilience Act", "5 pillars. ICT risk management for financial services. Effective 17 Jan 2025.",
        ["5 pillars: ICT risk mgmt, incident reporting, resilience testing, third-party risk, info sharing", "Applies to: banks, insurance, investment firms, crypto-asset service providers", "Critical third-party providers (CTPPs) designated by ESAs", "Annual ICT risk assessment required", "Major incident reporting within strict timelines"]),
    ("compliance/nis2", "NIS2", "Network and Information Security Directive 2", "Article 21 measures. The EU's cybersecurity law. Effective 18 Oct 2024.",
        ["Article 21 measures: risk assessment, incident handling, business continuity, supply chain security", "Applies to: energy, transport, banking, health, water, digital infrastructure, public admin", "Significant fines: €10M or 2% of global turnover", "Management body accountability", "24-hour early warning + 72-hour notification"]),
    ("compliance/cra", "CRA", "Cyber Resilience Act", "Annex IV. EU cybersecurity for products with digital elements. Effective 2027.",
        ["Annex IV conformity assessment procedures", "Applies to: all products with digital elements (software + hardware)", "5 security requirements: secure by default, vulnerability handling, SBOM, security updates, integrity", "Reporting obligations for actively exploited vulnerabilities", "CE marking required"]),
    ("compliance/nist-ai", "NIST AI RMF", "NIST AI Risk Management Framework 1.0", "GOVERN/MAP/MEASURE/MANAGE. The US AI risk framework.",
        ["4 functions: GOVERN, MAP, MEASURE, MANAGE", "AI RMF + generative AI profile (July 2024)", "Voluntary for US, mandatory for federal agencies", "Companion: NIST Cybersecurity Framework 2.0", "Risk tier classification: minimal, limited, high, unacceptable"]),
    ("compliance/iso-42001", "ISO 42001", "ISO/IEC 42001 AI Management System", "AIMS. The international AI management standard. Dec 2023.",
        ["Plan-Do-Check-Act cycle for AI management", "Risk-based approach to AI", "Annex A controls: AI policy, AI roles, AI risk assessment, AI data quality, AI transparency, AI accountability", "Compatible with ISO 27001 (InfoSec)", "Certifiable by accredited bodies"]),
    ("compliance/eo-14110", "EO 14110", "Executive Order 14110 — Safe AI", "The US executive order on safe AI. Signed Oct 2023. Rescinded Jan 2025.",
        ["Required developers to share safety test results with US government", "Established AI Safety Institute at NIST", "Required federal agencies to designate chief AI officers", "Addressed bias, discrimination, and civil rights harms", "Doubled the AI research budget"]),
    ("compliance/uk-ai", "UK AI", "UK AI Regulation", "5 principles, pro-innovation approach.",
        ["5 principles: safety + security, transparency, fairness, accountability, contestability", "Sector regulators implement via existing powers (ICO, FCA, CMA, MHRA)", "AI Bill (draft, 2024) would give regulators new powers", "Voluntary AI Safety Institute (AISI) for frontier models", "Pro-innovation approach: light-touch regulation"]),
]
for slug, name, full, scope, keys in FRAMEWORK_DATA:
    PAGES[slug] = (name, f"{full}. {scope}", "Home",
        lambda n=name, f=full, s=scope, k=keys: _gen_framework(n, f, s, k))

# 19 defoneos pages
DEFONEOS_DATA = [
    ("defoneos", "Defoneos", "The defense AI OS. 100 sprint phases. 30/30 MCPs. 58/50 pages. 15/15 repos. The 4-tier Edge → Fog → Cloud → Sovereign stack. JSP 440 compliant."),
    ("defoneos/cyber", "Defoneos Cyber", "14 MCPs, 14 tools. Penetration testing + red team + vulnerability scanning. The defense AI cyber stack."),
    ("defoneos/drones", "Defoneos Drones", "PX4 Fleet + Mava Swarm RL + OpenAthena + Batear acoustic. The autonomous drone stack."),
    ("defoneos/bft", "Defoneos BFT", "33-Agent BFT Council + JSP 936 Audit + 8 Attack Vectors. The Byzantine fault-tolerant council."),
    ("defoneos/deploy", "Defoneos Deploy", "4-Tier Edge → Fog → Cloud → Sovereign + JSP 440 compliance. The sovereign deployment stack."),
    ("defoneos/partners", "Defoneos Partners", "Defense ministries, sovereign operators, security agencies. The 33 hive deployment map."),
    ("defoneos/roadmap-v2", "Defoneos Roadmap v2", "4 phases. FOUNDATION → SENSOR → CORE DEMO → ISAC. The 100-phase sprint plan."),
    ("defoneos/demo", "Defoneos Demo", "Live demonstrations of the 30 MCPs. The 4-tier cascade in action. The BFT council voting. The 33 sovereign GCP VMs."),
    ("defoneos/freetak", "Defoneos FreeTAK", "FreeTAKServer C2 backbone + TAK Protocol + CoT deep dive. The tactical awareness stack."),
    ("defoneos/sensor-layer", "Defoneos Sensor Layer", "ISR pipeline + acoustic detection + visual recognition. The edge sensor stack."),
    ("defoneos/civil-services", "Defoneos Civil Services", "Emergency response + civil protection + humanitarian aid. The civil defense stack."),
    ("defoneos/jsp936", "Defoneos JSP 936", "UK MOD JSP 936 compliance. The defense AI audit standard."),
    ("defoneos/jsp440", "Defoneos JSP 440", "UK MOD JSP 440 compliance. The defense AI deployment standard."),
    ("defoneos/counterdrone", "Defoneos Counter-Drone", "14 MCPs, 14 tools. Detect + track + neutralise rogue drones. The C-UAS stack."),
    ("defoneos/compliance", "Defoneos Compliance", "10 MCPs, 10 tools. The defense AI compliance pipeline. JSP 936 + JSP 440 + NIST + ISO."),
    ("defoneos/tak", "Defoneos TAK", "TAK Protocol integration. Cursor-on-Target. The tactical awareness stack."),
    ("defoneos/ospd", "Defoneos OSPD", "Open Sensor Project Defence. The open-source sensor stack."),
    ("defoneos/isd", "Defoneos ISD", "Intelligence, Surveillance, Reconnaissance. The intel stack."),
    ("defoneos/medevac", "Defoneos MEDEVAC", "23 tests pass, 5 tools. Medical evacuation routing. The casualty care stack."),
]
for slug, title, body in DEFONEOS_DATA:
    PAGES[slug] = (title, body, "Home",
        lambda t=title, b=body: _gen_defoneos_page(t, b))


# ──────────────────────────────────────────────────────────────────────
# Build all
# ──────────────────────────────────────────────────────────────────────

def main():
    out_dir = HERE / "pages"
    out_dir.mkdir(exist_ok=True)
    for f in out_dir.glob("*.html"):
        f.unlink()
    for slug, (title, desc, nav, fn) in PAGES.items():
        if not fn:
            print(f"  ✗ {slug}  SKIPPED (no fn)")
            continue
        try:
            html = render(slug, title, desc, fn(), nav)
        except Exception as e:
            print(f"  ✗ {slug}  ERROR: {e}")
            continue
        out_path = out_dir / f"{slug.replace('/', '_')}.html"
        out_path.write_text(html)
    print(f"  ✓ Built {len(list(out_dir.glob('*.html')))} pages")


if __name__ == "__main__":
    main()
