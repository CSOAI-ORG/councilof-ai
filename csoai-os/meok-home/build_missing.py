"""Build the 2 missing pages (characters + mcp) directly.

Bypasses the broken build_full_site.py to ensure characters.html
and mcp.html get built.
"""
from pathlib import Path

HERE = Path(__file__).parent
TEMPLATE = (HERE / "_template.html").read_text()
STYLES = (HERE / "_styles.css").read_text()


def render(slug: str, title: str, description: str, content: str, active_nav: str = "") -> str:
    out = TEMPLATE
    nav_to_label = {"HOME": "Home", "OS": "OS", "COUNCIL": "Council", "MCP": "MCPs",
                    "TEMPLES": "Temples", "RESEARCH": "Research", "BLOG": "Blog", "ABOUT": "About"}
    for nav in nav_to_label:
        marker = f"__{nav}_ACTIVE__"
        active = ' class="active"' if active_nav == nav_to_label[nav] else ""
        out = out.replace(marker, active)
    out = out.replace("__TITLE__", title)
    out = out.replace("__DESCRIPTION__", description)
    out = out.replace("__SLUG__", slug)
    out = out.replace("__STYLES__", STYLES)
    out = out.replace("__CONTENT__", content)
    return out


characters_content = """
<section class="hero"><span class="hero-tag">▸ Characters</span>
<h1>13 archetypes. <span class="accent">Pick your queen.</span></h1>
<p>Each i-character is modeled on one of the 12-Queen + King council. The 7 sovereign characters: Aria, Gabriel, Luna, Marcus, Sage, Scout, Shanti. The 2 VETO queens (Care, Watch) have final say.</p></section>
<section class="section"><div class="section-tag">▸ The 7 sovereign</div><h2>Pick your queen.</h2><p class="lead">The 7 sovereign characters. Each is a unique persona. Each can be the model for your i-character.</p><div class="grid grid-3">
<a class="council-card" href="/characters/aria"><div class="emoji">🌸</div><div class="name">Aria</div><div class="arch">The Storyteller</div></a>
<a class="council-card" href="/characters/gabriel"><div class="emoji">✨</div><div class="name">Gabriel</div><div class="arch">The Guardian Angel</div></a>
<a class="council-card" href="/characters/luna"><div class="emoji">🌙</div><div class="name">Luna</div><div class="arch">The Dreamer</div></a>
<a class="council-card" href="/characters/marcus"><div class="emoji">⚔</div><div class="name">Marcus</div><div class="arch">The Strategist</div></a>
<a class="council-card" href="/characters/sage"><div class="emoji">🧘</div><div class="name">Sage</div><div class="arch">The Wise One</div></a>
<a class="council-card" href="/characters/scout"><div class="emoji">🏹</div><div class="name">Scout</div><div class="arch">The Hunter</div></a>
<a class="council-card" href="/characters/shanti"><div class="emoji">🕊</div><div class="name">Shanti</div><div class="arch">The Peacemaker</div></a>
</div></section>
<section class="section"><div class="section-tag">▸ The 12 queens + King</div><h2>The full council.</h2><p class="lead">Each archetype is a sovereign model. Each can be bound to your i-character. The 2 VETO queens (Care, Watch) have special powers: their vote is final.</p><div class="grid grid-3">
<a class="council-card veto" href="/queens/care"><div class="emoji">💗</div><div class="name">Sophia Care</div><div class="arch">The Caretaker</div><span class="veto-badge">VETO</span></a>
<a class="council-card" href="/queens/strategy"><div class="emoji">♑</div><div class="name">Aurelian</div><div class="arch">Long-Term Strategist</div></a>
<a class="council-card" href="/queens/compliance"><div class="emoji">⚖</div><div class="name">Justitia</div><div class="arch">The Auditor</div></a>
<a class="council-card" href="/queens/finance"><div class="emoji">⭐</div><div class="name">Asteria</div><div class="arch">Optimist-Operator</div></a>
<a class="council-card" href="/queens/domain"><div class="emoji">🛞</div><div class="name">Dominion</div><div class="arch">Territorial Chariot</div></a>
<a class="council-card" href="/queens/arcana"><div class="emoji">✨</div><div class="name">Aleph</div><div class="arch">Mysterious Fool</div></a>
<a class="council-card" href="/queens/brain"><div class="emoji">🧠</div><div class="name">Brain</div><div class="arch">Hermit Scholar</div></a>
<a class="council-card" href="/queens/proactive"><div class="emoji">⚡</div><div class="name">Proactive</div><div class="arch">Wheel of Fortune</div></a>
<a class="council-card" href="/queens/bridge"><div class="emoji">🌉</div><div class="name">Bridge</div><div class="arch">Lovers Integrator</div></a>
<a class="council-card" href="/queens/distribution"><div class="emoji">☀️</div><div class="name">Distribution</div><div class="arch">Generous Sun</div></a>
<a class="council-card" href="/queens/council"><div class="emoji">🦁</div><div class="name">Council</div><div class="arch">Strength-Tamer</div></a>
<a class="council-card veto" href="/queens/watch"><div class="emoji">🗼</div><div class="name">Watch</div><div class="arch">Vigilant Tower</div><span class="veto-badge">VETO</span></a>
</div></section>"""

mcp_content = """
<section class="hero"><span class="hero-tag">▸ MCPs</span>
<h1>218 open-source <span class="accent">MCPs</span>.</h1>
<p>15 regulatory frameworks. One command to install. The MEOK MCP fleet. The agent-native compliance layer. Every MCP is Ed25519-signed and published to the MCP official registry.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">218</div><div class="label">MCPs</div></div><div class="stat-card"><div class="num">15</div><div class="label">Frameworks</div></div><div class="stat-card"><div class="num">23</div><div class="label">PyPI</div></div><div class="stat-card"><div class="num">19</div><div class="label">Smithery</div></div></div></section>
<section class="section"><div class="section-tag">▸ Categories</div><h2>The 9 categories.</h2><p class="lead">218 MCPs. 9 categories. Every framework mapped. One command to install.</p><div class="grid grid-3" style="margin-top: 32px;">
<div class="card"><span class="icon">📜</span><h3>EU AI Act</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">28 MCPs</div><p>Every article + framework mapped.</p></div>
<div class="card"><span class="icon">🛡</span><h3>SIGIL / Audit</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">18 MCPs</div><p>Ed25519 audit chain + OSCAL.</p></div>
<div class="card"><span class="icon">🧬</span><h3>Cascade</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">16 MCPs</div><p>The 4-tier model stacking.</p></div>
<div class="card"><span class="icon">🌉</span><h3>Bridges</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">22 MCPs</div><p>22 legacy + cross-protocol bridges.</p></div>
<div class="card"><span class="icon">🎮</span><h3>Gaming</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">12 MCPs</div><p>AI gaming: ACE, swarm RL, TAK.</p></div>
<div class="card"><span class="icon">⚖</span><h3>Compliance</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">9 MCPs</div><p>SOC 2, ISO 27001, ISO 42001, JSP 936.</p></div>
<div class="card"><span class="icon">🏛</span><h3>Governance</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">15 MCPs</div><p>BFT, MPC, sovereign identity.</p></div>
<div class="card"><span class="icon">🤖</span><h3>Agent</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">21 MCPs</div><p>Agent runtime, MCP federation.</p></div>
<div class="card"><span class="icon">💎</span><h3>x402 Paid</h3><div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">11 MCPs</div><p>Pay-per-call on Base.</p></div>
</div></section>
<section class="section"><div class="cta-box">
<h2>Install in one command.</h2>
<p>Every MEOK MCP ships with Ed25519 signing + a published manifest. One command to install. Sovereign from the start.</p>
<div class="ctas"><a href="https://github.com/CSOAI-ORG/mcp-marketplace" class="btn btn-primary">Browse the marketplace →</a><a href="/csoai-os/v2-temple-os.html" class="btn btn-secondary">Open the OS</a></div>
</div></section>"""

# Build both
chars = render("characters", "Characters", "13 queen archetypes. Aria, Gabriel, Luna, Marcus, Sage, Scout, Shanti. Pick the one that fits you.", characters_content, "Home")
(H
