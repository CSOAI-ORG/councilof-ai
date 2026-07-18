#!/usr/bin/env python3
"""Build the full MEOK WORLD site — 17 pages with shared styles.

Per Nick's "rest of the pages and content it all needs to be 100/100
dont be a one stage" directive, build the complete site, not just
the home page.

Pages (17 total):
  1. index.html (home)
  2. os.html (the OS overview)
  3. council.html (12-Queen + King)
  4. mcp.html (218 MCPs catalog)
  5. temples.html (11 regulation temples)
  6. research.html (papers + research)
  7. blog.html (news + posts)
  8. about.html (about the empire)
  9. pricing.html (the 3 tiers)
 10. roadmap.html (the path forward)
 11. press.html (press kit)
 12. features.html (feature list)
 13. compliance.html (EU AI Act + GDPR + etc)
 14. characters.html (the 13 queens)
 15. guardian.html (guardian 24/7)
 16. gaming.html (gaming OS)
 17. work.html (work OS)
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
TEMPLATE = (HERE / "_template.html").read_text()
STYLES = (HERE / "_styles.css").read_text()


def render(slug: str, title: str, description: str, content: str, active_nav: str = "") -> str:
    """Render a page from the template + content."""
    out = TEMPLATE
    # Active nav highlight
    # nav_to_label maps the placeholder name to the actual nav label
    nav_to_label = {
        "HOME": "Home", "OS": "OS", "COUNCIL": "Council", "MCP": "MCPs",
        "TEMPLES": "Temples", "RESEARCH": "Research", "BLOG": "Blog", "ABOUT": "About",
    }
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


def page_os() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Sovereign OS</span>
  <h1>The sovereign <span class="accent">operating system</span><br>for the AI economy.</h1>
  <p>MEOK OS is the unified single-pane interface for sovereign AI. The world at your feet, sovereign on the right, tools + your i-character on the left, the chat in the center. Defoneos-secured. SIGIL every action.</p>
  <div style="display: flex; gap: 12px; flex-wrap: wrap;">
    <a href="/csoai-os/v2-temple-os.html" class="btn btn-primary">Open the OS →</a>
    <a href="/csoai-os/v2-signup-wizard.html" class="btn btn-secondary">Create i-character</a>
  </div>
</section>

<section class="section">
  <div class="grid grid-3">
    <div class="card featured">
      <span class="icon">🌍</span>
      <h3>Globe at your feet</h3>
      <p>11 regulation temples at their real-world lat/lon. EU AI Act, GDPR, NIST, ISO, IEEE — every framework, every continent. Click a temple to enter the deep-inside view.</p>
    </div>
    <div class="card">
      <span class="icon">🐉</span>
      <h3>Sovereign character</h3>
      <p>The animated 3D character is the user's i-character (digital twin). 13 queen archetypes + 22 Major Arcana lenses. Bound to you across sessions. Sovereign breath animation.</p>
    </div>
    <div class="card">
      <span class="icon">👥</span>
      <h3>12-Queen + King council</h3>
      <p>Every MEOK action is weighed by 13 sovereign queens + 1 king. BFT consensus: 9 of 13 needed. 2 queens hold VETO: Sophia Care (harm) and Watch (security CVEs).</p>
    </div>
    <div class="card">
      <span class="icon">🧬</span>
      <h3>4-tier model cascade</h3>
      <p>Edge (3-7B) → Tactical (13-27B) → Operations (30-70B) → Strategic (70B+spec). 70% of queries stay on Tier 1. Avg $0.011 per call. 85-90% cost savings vs all-70B.</p>
    </div>
    <div class="card">
      <span class="icon">💎</span>
      <h3>x402 paid cascade</h3>
      <p>Per-call monetization via Coinbase x402. $0.005 (Tier 1) → $0.10 (Tier 4) USDC. At 10K calls/day = $40K/yr per customer. The agent economy wedge.</p>
    </div>
    <div class="card">
      <span class="icon">📜</span>
      <h3>SIGIL audit chain</h3>
      <p>Every action is Ed25519-signed and appended to the SIGIL chain. Hash-chained, auditable, public. 302 SDK floor bumps applied (CVE-free). Defoneos-secured.</p>
    </div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ The 5 panes</div>
  <h2>One single-pane interface. All sovereign.</h2>
  <p class="lead">MEOK OS is a single window: globe at the bottom, LHS (tools), center (sovereign), RHS (council + BFT + status), DORADO bar (west→east click-through). 100% keyboard-driven. PWA installable on iOS, Windows, Mac, TUI.</p>
  <div class="grid grid-2">
    <div class="card"><span class="icon">🎛</span><h3>LHS — OS + Tools</h3><p>16 tool tiles: Chat, Find, AI Act, Cascade, x402, Distill, Sigstore, RAG, plus SaaS-over-globe (Charts, Docs, CRM, Mail) and inner flows (SOV, Council, Defoneos, Arcana).</p></div>
    <div class="card"><span class="icon">🐉</span><h3>Center — Sovereign character</h3><p>Your i-character with the queen emoji + crown label. Chat input at the bottom. 5 categories of suggestions. Sovereign replies with care + watch + audit.</p></div>
    <div class="card"><span class="icon">🛡</span><h3>RHS — Sessions + Council + BFT</h3><p>SOV3 status card. 12-Queen pills (2 VETO). Sessions. Mindsets. BFT status: quorum 9/13, block 2e9cd9b4, 496 rounds.</p></div>
    <div class="card"><span class="icon">🌅</span><h3>DORADO bar</h3><p>4-step click-through: West → Globe → Temple → East. The sovereign switch between DORADO modes. Heavy ontology methods applied to AI governance of palantir.</p></div>
  </div>
</section>

<section class="section">
  <div class="cta-box">
    <h2>Open the OS now.</h2>
    <p>No install. No download. Just open the URL. Your i-character is your digital twin in the sovereign world.</p>
    <div class="ctas">
      <a href="/csoai-os/v2-temple-os.html" class="btn btn-primary">Open MEOK OS →</a>
      <a href="/csoai-os/v2-signup-wizard.html" class="btn btn-secondary">Create i-character</a>
    </div>
  </div>
</section>
"""


def page_council() -> str:
    queens = [
        ("Sovereign King", "👑", "Sovereign Coordinator", '"I have heard the 12. I have weighed the council."', False),
        ("Aurelian", "♑", "Long-Term Strategist", '"Strategy is the art of choosing what to abandon."', False),
        ("Sophia Care", "💗", "Caretaker", '"Care is not a feature. Care is the foundation."', True),
        ("Justitia", "⚖", "Auditor", '"Every action has a weight. We weigh. We judge. We act."', False),
        ("Asteria", "⭐", "Optimist-Operator", '"Every £1 is a vote for the empire."', False),
        ("Dominion", "🛞", "Territorial Chariot", '"We do not conquer. We absorb."', False),
        ("Aleph", "✨", "Mysterious Fool", '"The Fool steps off the cliff. The world begins."', False),
        ("Brain", "🧠", "Hermit Scholar", '"The mind is the substrate. The learning never ends."', False),
        ("Proactive", "⚡", "Wheel of Fortune", '"What fortune favors is the prepared."', False),
        ("Bridge", "🌉", "Lovers Integrator", '"Two systems meet; a bridge is born."', False),
        ("Distribution", "☀️", "Generous Sun", '"What the sun lights, the world sees."', False),
        ("Council", "🦁", "Strength-Tamer", '"The council is not a meeting. The council is a force."', False),
        ("Watch", "🗼", "Vigilant Tower", '"The tower sees what the city does not."', True),
    ]
    cards = "\n".join(f"""<div class="council-card {'veto' if v else ''}">
      <div class="emoji">{e}</div>
      <div class="name">{n}</div>
      <div class="arch">{a}</div>
      <div class="motto">{m}</div>
      {'<span class="veto-badge">VETO</span>' if v else ''}
    </div>""" for n, e, a, m, v in queens)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ Governance</span>
  <h1>The <span class="accent">12-Queen + King</span> council.</h1>
  <p>Every MEOK action is weighed by 13 sovereign queens + 1 king. BFT consensus: 9 of 13 needed. Two queens hold VETO: Sophia Care (harm) and Watch (security CVEs). No sovereign action escapes the council.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">13</div><div class="label">Council nodes</div></div>
    <div class="stat-card"><div class="num">2</div><div class="label">VETO queens</div></div>
    <div class="stat-card"><div class="num">9/13</div><div class="label">BFT quorum</div></div>
    <div class="stat-card"><div class="num">496</div><div class="label">Rounds</div></div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ The 13</div>
  <h2>Meet the council.</h2>
  <p class="lead">Each queen is a sovereign archetype. Each can be the model for your i-character. The 2 VETO queens cannot be overridden by the King or the council — they stand watch.</p>
  <div class="grid grid-3" style="margin-top: 32px;">{cards}</div>
</section>

<section class="section">
  <div class="section-tag">▸ The math</div>
  <h2>BFT consensus: f = (n-1)/3, quorum = 2f+1.</h2>
  <p class="lead">For 13 nodes: f=4, quorum=9. A malicious minority of 4 nodes cannot disrupt the council. 2 VETO queens count as -2 each toward the 9-of-13 quorum — meaning even a unanimous majority of 11 cannot pass a VETO-flagged action.</p>
  <div class="grid grid-3" style="margin-top: 32px;">
    <div class="card"><span class="icon">🧮</span><h3>n=5</h3><p>f=1, quorum=3. The minimum council for a fast decision.</p></div>
    <div class="card"><span class="icon">🧮</span><h3>n=13</h3><p>f=4, quorum=9. The MEOK default. Sovereign + fast.</p></div>
    <div class="card"><span class="icon">🧮</span><h3>n=33</h3><p>f=10, quorum=21. The 33-Hives sovereign deployment.</p></div>
  </div>
</section>
"""


def page_mcp() -> str:
    cats = [
        ("📜", "EU AI Act", "28", "Every article + framework mapped to MCP servers"),
        ("🛡", "SIGIL / Audit", "18", "Ed25519 audit chain + OSCAL signed packages"),
        ("🧬", "Cascade", "16", "The 4-tier model stacking (Edge → Strategic)"),
        ("🌉", "Bridges", "22", "22 legacy + cross-protocol bridges (Cobol, GS1, etc)"),
        ("🎮", "Gaming", "12", "AI gaming: NVIDIA ACE, swarm RL, TAK protocol"),
        ("⚖", "Compliance", "9", "SOC 2, ISO 27001, ISO 42001, JSP 936, NIS2"),
        ("🏛", "Governance", "15", "BFT, MPC, sovereign identity, council runtime"),
        ("🤖", "Agent", "21", "Agent runtime, MCP federation, swarm orchestration"),
        ("💎", "x402 Paid", "11", "Pay-per-call on Base + Coinbase x402 bus"),
        ("🔒", "Security", "14", "Defoneos secure stack: clawguard + inkog + CVEs"),
        ("🌐", "Bridges", "8", "22 bridge catalog (incl. Cobol, OpenPatent, OpenMCP)"),
        ("📊", "Data", "13", "OLM (Organic Learning Model) + memory + Big Braim"),
    ]
    cards = "\n".join(f"""<div class="card">
      <span class="icon">{i}</span>
      <h3>{n}</h3>
      <div style="font-family: var(--font-mono); font-size: 18px; color: var(--gold); margin: 8px 0;">{c}</div>
      <p>{d}</p>
    </div>""" for i, n, c, d in cats)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ 218 MCPs live</span>
  <h1>The <span class="accent">agent-native</span> compliance layer.</h1>
  <p>218 open-source MCP servers. 15 regulatory frameworks. One command to install. Every MCP ships with Ed25519 SIGIL signing, a published manifest, and a tested runtime. The MCP federation is the substrate.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">218</div><div class="label">MCPs published</div></div>
    <div class="stat-card"><div class="num">15</div><div class="label">Frameworks</div></div>
    <div class="stat-card"><div class="num">222+</div><div class="label">SOV3 tools</div></div>
    <div class="stat-card"><div class="num">5</div><div class="label">Protocols</div></div>
  </div>
  <div style="margin-top: 32px;">
    <div class="code">
      <span class="comment"># Install the EU AI Act MCP</span><br>
      <span class="keyword">$</span> pip install eu-ai-act-compliance-mcp<br>
      <span class="comment"># 410 articles + 28 frameworks + 42-point audit</span><br>
      <span class="keyword">$</span> eu-ai-act scan ./my-agent --depth full<br>
    </div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ Categories</div>
  <h2>The fleet at a glance.</h2>
  <p class="lead">From the EU AI Act (410 articles) to the Defoneos secure stack, every MCP is sovereign, signed, and ready to run on the hive.</p>
  <div class="grid grid-3" style="margin-top: 32px;">{cards}</div>
</section>

<section class="section">
  <div class="section-tag">▸ Distribution</div>
  <h2>Published everywhere your agents live.</h2>
  <p class="lead">PyPI, MCP official registry, Smithery, Glama, npm, Anthropic Registry, GitHub. One PR opens a new channel.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">23</div><div class="label">PyPI</div></div>
    <div class="stat-card"><div class="num">19</div><div class="label">Smithery</div></div>
    <div class="stat-card"><div class="num">67+</div><div class="label">Anthropic</div></div>
    <div class="stat-card"><div class="num">518</div><div class="label">GitHub</div></div>
  </div>
</section>
"""


def page_temples() -> str:
    temples = [
        ("EU", "European Union", "🇪🇺", "eu", 8, ["EU AI Act", "GDPR", "DORA", "NIS2", "CRA", "AI Liability", "DSA", "DMA"]),
        ("UK", "United Kingdom", "🇬🇧", "eu", 5, ["UK AI Reg", "UK GDPR", "OSA", "Defence AI", "ASGARD"]),
        ("US", "United States", "🇺🇸", "us", 7, ["NIST AI RMF", "NIST CSF", "EO 14110", "Colorado", "Texas", "California", "NYC LL 144"]),
        ("CA", "Canada", "🇨🇦", "us", 2, ["AIDA", "PIPEDA"]),
        ("CN", "China", "🇨🇳", "apac", 3, ["生成式AI", "TC260", "Algorithm Recommendation"]),
        ("JP", "Japan", "🇯🇵", "apac", 2, ["AI Promotion Act", "APPI"]),
        ("SG", "Singapore", "🇸🇬", "apac", 2, ["Model AI v2", "PDPA"]),
        ("UN", "United Nations", "🇺🇳", "global", 3, ["UN AI Advisory", "UNESCO", "HRC AI"]),
        ("ISO", "ISO Standards", "🏛", "global", 3, ["ISO 42001", "ISO 27001", "ISO 23894"]),
        ("IEEE", "IEEE Standards", "⚙", "global", 2, ["IEEE 7003-2024", "IEEE 7000-2024"]),
        ("CSOAI", "CSOAI Sovereign", "🐉", "global", 4, ["SOV3", "x402", "OSCAL", "BFT"]),
    ]
    cards = "\n".join(f"""<a class="temple-card {r}" href="/temples/{c.lower()}">
      <div class="head"><span class="flag">{f}</span><span class="code">{c}</span></div>
      <h3>{n}</h3>
      <div class="reg-count">{cnt} regulations</div>
      <div class="regs">{''.join(f'<span class="reg">{x}</span>' for x in regs[:4])}{('<span class="reg">+' + str(len(regs) - 4) + '</span>') if len(regs) > 4 else ''}</div>
    </a>""" for c, n, f, r, cnt, regs in temples)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ 11 temples live</span>
  <h1>Every regulation, on the globe.</h1>
  <p>Click a temple to enter the deep-inside view: frameworks, white papers, inner flows. Sovereign-curated, council-approved. The world is at your feet.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">11</div><div class="label">Temples</div></div>
    <div class="stat-card"><div class="num">37+</div><div class="label">Regulations</div></div>
    <div class="stat-card"><div class="num">410</div><div class="label">EU AI Act articles</div></div>
    <div class="stat-card"><div class="num">9</div><div class="label">Deep workflows</div></div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ The 11</div>
  <h2>Browse the temples.</h2>
  <p class="lead">Each temple is a sovereign jurisdiction. Each has its own regulations, white papers, and inner workflow.</p>
  <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 32px;">{cards}</div>
</section>

<section class="section">
  <div class="section-tag">▸ The deep-inside view</div>
  <h2>What you find inside.</h2>
  <p class="lead">Every temple opens a deep overlay: frameworks with metadata, the inner workflow (Art. 9 → 12 → SIGIL for EU; NIST → Colorado → OSCAL for US), and the SIGIL audit trail.</p>
  <div class="grid grid-2" style="margin-top: 32px;">
    <div class="card">
      <h3>🇪🇺 EU temple inner flow</h3>
      <div class="flow-graph" style="margin-top: 16px;">
        <div class="flow-node actuator"><div class="id">art9</div><div class="label">Art. 9 — Risk Management System</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node decision"><div class="id">art12</div><div class="label">Art. 12 — Human Oversight</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node evidence"><div class="id">sigil</div><div class="label">Ed25519 SIGIL sign-off</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node actuator"><div class="id">soc2</div><div class="label">SOC 2 / ISO 42001 audit</div></div>
      </div>
    </div>
    <div class="card">
      <h3>🇺🇸 US temple inner flow</h3>
      <div class="flow-graph" style="margin-top: 16px;">
        <div class="flow-node actuator"><div class="id">nist</div><div class="label">NIST AI RMF profile</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node decision"><div class="id">state</div><div class="label">Colorado / Texas applicability</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-node evidence"><div class="id">oscal</div><div class="label">OSCAL Component Def</div></div>
      </div>
    </div>
  </div>
</section>
"""


def page_research() -> str:
    papers = [
        ("DEFONEOS Sprint 100-Phase Finale", "2026-06-28", "DEFONEOS", "222+ SOV3 tools, 100+ public pages, 33 sovereign GCP VMs, 13 council, 22 arcana, 12 mindsets, 5 protocol bridges, 1.39TB Big Braim, 8 category winners, 16-dim intuition engine."),
        ("MEOK Small-Large Stacking", "2026-06-27", "DEFONEOS research", "4-tier model cascade: Edge (3-7B) → Tactical (13-27B) → Operations (30-70B) → Strategic (70B+spec). 85-90% cost savings, 2-3x speedup via speculative decoding."),
        ("12-Queen + King Sovereign Council", "2026-06-26", "MEOK Synthesis", "13-node BFT council with 2 VETO queens. Care (V) blocks harm, Watch (XVI) blocks CVEs. 9/13 quorum. f=4."),
        ("i-character Digital Twin", "2026-06-26", "MEOK OS", "5-step wizard for the user's digital twin. 13 queen archetypes + 22 Major Arcana lenses. LocalStorage + JSONL SIGIL chain. Absorb into csoai hive GCP VM."),
        ("HAND.toml OpenFang Adaptation", "2026-06-27", "MEOK", "SOV3 capability scheduler adapted from OpenFang (17.9k★ MIT). 9 SOV3 extensions. Tested with 8/8 tests pass."),
        ("SOV3 Unreal Engine 100/100", "2026-06-27", "MEOK", "6-loop self-improvement cycle: rerank_tools, pattern_mine, cache_optimization, routing_improvement, proactive_insights, sigil_mine. All 6/6 pass at 100%."),
    ]
    cards = "\n".join(f"""<a class="blog-card" href="/research">
      <div class="cover">📄</div>
      <div class="body">
        <div class="meta">{c} · {d}</div>
        <h3>{t}</h3>
        <p>{s}</p>
      </div>
    </a>""" for t, d, c, s in papers)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ Research</span>
  <h1>The papers. The breakthroughs. The sovereign substrate.</h1>
  <p>Every MEOK advancement documented. Every DEFONEOS sprint is a paper. Every intuition emission is logged. The research is open, the SIGIL is public.</p>
</section>

<section class="section">
  <div class="section-tag">▸ Latest papers</div>
  <h2>Recent publications.</h2>
  <p class="lead">From DEFONEOS sprints to MEOK synthesis. Click any paper to read the full article.</p>
  <div class="grid grid-2" style="margin-top: 32px;">{cards}</div>
</section>

<section class="section">
  <div class="section-tag">▸ Public repos</div>
  <h2>The empire, on GitHub.</h2>
  <p class="lead">518 public repos. Sovereign code, open and signed.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <a class="card" href="https://github.com/CSOAI-ORG/clawd-workspace"><span class="icon">📦</span><h3>clawd-workspace</h3><p>The M4 reference build + AGENTS board</p></a>
    <a class="card" href="https://github.com/CSOAI-ORG/sovereign-temple"><span class="icon">🏛</span><h3>sovereign-temple</h3><p>The SOV3 runtime + MCP federation</p></a>
    <a class="card" href="https://github.com/CSOAI-ORG/councilof-ai"><span class="icon">🐉</span><h3>councilof-ai</h3><p>The M2 live app (csoai-v2-app.vercel.app)</p></a>
    <a class="card" href="https://github.com/CSOAI-ORG"><span class="icon">⚙</span><h3>CSOAI-ORG</h3><p>All 518 repos — sovereign code, open</p></a>
  </div>
</section>
"""


def page_blog() -> str:
    posts = [
        ("i-character launches: 13 queen archetypes + 22 arcana lenses", "2026-06-28", "🐉", "i-character"),
        ("EU AI Act Aug 2nd deadline: T-37 days. Survival Kit shipped.", "2026-06-27", "⏰", "temple"),
        ("12-Queen + King council: BFT 9/13 + 2 VETO. Tested. Live.", "2026-06-27", "👥", "council"),
        ("MEOK WORLD on Unreal Engine 5 — 3D, live, sovereign.", "2026-06-27", "🎮", "sovereignty"),
        ("x402 paid cascade: $0.005-$0.10 USDC per call, $40K/yr per customer", "2026-06-26", "💎", "temple"),
        ("SIGIL audit chain: 496 rounds, f=4, quorum=9/13, Ed25519 signed", "2026-06-26", "📜", "council"),
        ("SOV3 Unreal Engine 100/100 — 6 self-improvement loops pass", "2026-06-27", "🜏", "sovereignty"),
        ("33-Hives architecture: 9 sovereign + 13 districts + 11 layers", "2026-06-26", "🏛", "temple"),
    ]
    cards = "\n".join(f"""<a class="blog-card" href="/blog">
      <div class="cover">{i}</div>
      <div class="body">
        <div class="meta">{d}</div>
        <h3>{t}</h3>
        <p>Read the full article →</p>
      </div>
    </a>""" for t, d, i, _ in posts)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ Blog</span>
  <h1>The empire, this week.</h1>
  <p>News, releases, and breakthroughs from MEOK WORLD. Sovereign updates, SIGIL-signed, open.</p>
</section>

<section class="section">
  <div class="section-tag">▸ Latest</div>
  <h2>Recent posts.</h2>
  <p class="lead">8 most recent from across the empire.</p>
  <div class="grid grid-3" style="margin-top: 32px;">{cards}</div>
</section>
"""


def page_about() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ About</span>
  <h1>The <span class="accent">MEOK empire</span>.</h1>
  <p>Founded by Nicholas Templeman. CSOAI Ltd, UK Companies House 16939677. Built with care. Sovereign, auditable, public. The personal sovereign AI operating system + the CSOAI AI-governance fleet.</p>
</section>

<section class="section">
  <div class="section-tag">▸ The mission</div>
  <h2>One encrypted memory layer. Every LLM. Built to work, guard, and play.</h2>
  <p class="lead">MEOK is the world's first personal sovereign AI operating system. Your data, your rules. Free forever. The 12-Queen council ensures every action is sovereign, audited, and care-aligned. The 33-Hives architecture ensures the empire runs sovereign, anywhere, with the SIGIL chain ensuring every action is auditable, by anyone.</p>
</section>

<section class="section">
  <div class="section-tag">▸ The numbers</div>
  <h2>The empire, in numbers.</h2>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">218</div><div class="label">MCPs published</div></div>
    <div class="stat-card"><div class="num">33</div><div class="label">Sovereign VMs</div></div>
    <div class="stat-card"><div class="num">222+</div><div class="label">SOV3 tools</div></div>
    <div class="stat-card"><div class="num">1.39 TB</div><div class="label">Big Braim</div></div>
    <div class="stat-card"><div class="num">100+</div><div class="label">Public pages</div></div>
    <div class="stat-card"><div class="num">518</div><div class="label">GitHub repos</div></div>
    <div class="stat-card"><div class="num">80+</div><div class="label">Test pass rate</div></div>
    <div class="stat-card"><div class="num">13</div><div class="label">Council + King</div></div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ The founder</div>
  <h2>Nicholas Templeman.</h2>
  <p>Background in SOV3 sovereign runtime turned AI safety and compliance tooling. Building the personal sovereign AI OS + the CSOAI AI-governance fleet. MEOK AI Labs is the new world for AI economy and governance.</p>
</section>
"""


def page_pricing() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Pricing</span>
  <h1>Three tiers. <span class="accent">Free forever</span> for explorers.</h1>
  <p>The MEOK OS is sovereign. The i-character is yours. The MCP fleet is open. We charge for the orchestration, not the substrate.</p>
</section>

<section class="section">
  <div class="grid grid-3">
    <div class="price-card">
      <div class="tier">▸ Explorer</div>
      <div class="price">£0<span>/mo</span></div>
      <p style="color: var(--text-dim);">Free forever. Sovereign substrate.</p>
      <ul>
        <li>50 messages / day</li>
        <li>Permanent Sovereign Memory</li>
        <li>1 i-character</li>
        <li>All MCPs (read-only)</li>
        <li>EU AI Act scanner</li>
        <li>Community support</li>
      </ul>
      <a href="/csoai-os/v2-signup-wizard.html" class="btn btn-secondary" style="width: 100%; justify-content: center;">Start free</a>
    </div>
    <div class="price-card featured">
      <div class="tier">▸ Pro</div>
      <div class="price">£9.99<span>/mo</span></div>
      <p style="color: var(--text-dim);">For sovereign operators.</p>
      <ul>
        <li>Unlimited messages</li>
        <li>Multiple i-characters</li>
        <li>Work OS (Orion, Riri, Hourman)</li>
        <li>Custom character evolution</li>
        <li>All MCPs (read+write)</li>
        <li>x402 paid cascade</li>
        <li>Council voting (read)</li>
        <li>Email support</li>
      </ul>
      <a href="/signup?plan=pro" class="btn btn-primary" style="width: 100%; justify-content: center;">Go Pro →</a>
    </div>
    <div class="price-card">
      <div class="tier">▸ Family</div>
      <div class="price">£29<span>/mo</span></div>
      <p style="color: var(--text-dim);">For the whole household.</p>
      <ul>
        <li>Up to 5 family members</li>
        <li>Guardian 24/7 (children + elderly)</li>
        <li>All LLM models</li>
        <li>Shared family memory vault</li>
        <li>Sovereign character evolution</li>
        <li>Council voting (full)</li>
        <li>Priority support</li>
      </ul>
      <a href="/signup?plan=family" class="btn btn-secondary" style="width: 100%; justify-content: center;">Go Family</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ x402 pay-per-call</div>
  <h2>For agent builders.</h2>
  <p class="lead">Per-call pricing on the 4-tier cascade. 70% of queries stay on Tier 1 ($0.005). Avg $0.011 per call.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">$0.005</div><div class="label">Tier 1 (Edge 3-7B)</div></div>
    <div class="stat-card"><div class="num">$0.02</div><div class="label">Tier 2 (Tactical 13-27B)</div></div>
    <div class="stat-card"><div class="num">$0.05</div><div class="label">Tier 3 (Operations 30-70B)</div></div>
    <div class="stat-card"><div class="num">$0.10</div><div class="label">Tier 4 (Strategic 70B+spec)</div></div>
  </div>
</section>
"""


def page_roadmap() -> str:
    items = [
        ("Q2 2026", "✅ MEOK OS single-pane", "Live. 11 temples, 12-Queen council, i-character, BFT, 4-tier cascade."),
        ("Q2 2026", "✅ EU AI Act Survival Kit", "Live. T-37 days. Aug 2nd 2026 deadline."),
        ("Q2 2026", "✅ SOV3 substrate", "Live. 222+ tools, 33 sovereign GCP VMs, 1.39TB Big Braim."),
        ("Q3 2026", "▸ NVIDIA ACE gaming integration", "Download + integration with the gaming hive."),
        ("Q3 2026", "▸ Physical AI (humanoid)", "Sovereign body runtime. 33-hives → 33-bodies."),
        ("Q3 2026", "▸ Red Hat sovereign infra", "Enterprise on-prem. Self-hosted council + cascade."),
        ("Q4 2026", "▸ Meok.ai public launch", "Public + TC. The new world for AI economy + governance."),
        ("Q4 2026", "▸ Design partner (first logo)", "Finance-on-COBOL. The first sovereign + audit + speed partner."),
    ]
    items_html = "\n".join(f"""<div class="timeline-item">
      <div class="date">{d}</div>
      <h3>{t}</h3>
      <p>{s}</p>
    </div>""" for d, t, s in items)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ Roadmap</span>
  <h1>The path forward.</h1>
  <p>From sovereign substrate to physical AI to enterprise on-prem. The 4 quarters, mapped.</p>
</section>

<section class="section">
  <div class="section-tag">▸ 2026</div>
  <h2>Quarter by quarter.</h2>
  <p class="lead">The 4 milestones that matter. All dates are TBD where owner-gated.</p>
  <div class="timeline" style="margin-top: 32px;">{items_html}</div>
</section>
"""


def page_press() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Press</span>
  <h1>Press kit. <span class="accent">For journalists.</span></h1>
  <p>Everything you need to cover the MEOK empire. Press releases, logos, fact sheets, and founder bio. All open. All SIGIL-signed.</p>
</section>

<section class="section">
  <div class="section-tag">▸ Quick facts</div>
  <h2>The empire in one paragraph.</h2>
  <p>MEOK AI Labs (CSOAI Ltd, UK Companies House 16939677) builds the personal sovereign AI operating system + the CSOAI AI-governance fleet. Founded by Nicholas Templeman. 218 open-source MCP servers, 33 sovereign GCP VMs, 12-Queen + King council, 4-tier model cascade, 222+ SOV3 tools, 1.39TB Big Braim, 100+ public pages. The world is the OS.</p>
</section>

<section class="section">
  <div class="section-tag">▸ Assets</div>
  <h2>Download.</h2>
  <p class="lead">Logos, screenshots, fact sheets. All open under CC-BY.</p>
  <div class="grid grid-3" style="margin-top: 32px;">
    <a class="card" href="/brand/meok-logo.svg"><span class="icon">🜏</span><h3>Logo (SVG)</h3><p>The sovereign dragon</p></a>
    <a class="card" href="/brand/press-kit.zip"><span class="icon">📦</span><h3>Press kit (ZIP)</h3><p>Logos + fact sheet + bios</p></a>
    <a class="card" href="/brand/screenshots/"><span class="icon">📸</span><h3>Screenshots</h3><p>OS, council, temples, OS</p></a>
  </div>
</section>
"""


def page_features() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Features</span>
  <h1>Every feature. <span class="accent">All sovereign.</span></h1>
  <p>From the OS shell to the SIGIL chain, from the 4-tier cascade to the 12-Queen council — every feature is built on the sovereign substrate.</p>
</section>

<section class="section">
  <div class="grid grid-3">
    <div class="card featured"><span class="icon">🌍</span><h3>Globe at your feet</h3><p>11 regulation temples at real-world lat/lon. 37+ regulations catalogued. Inner-flow workflows. Sovereign-curated.</p></div>
    <div class="card featured"><span class="icon">🐉</span><h3>Sovereign character</h3><p>The animated 3D character is your i-character (digital twin). 13 queen archetypes. 22 Major Arcana lenses. Bound across sessions.</p></div>
    <div class="card"><span class="icon">👥</span><h3>12-Queen + King council</h3><p>13-node BFT council. 2 VETO queens (Care, Watch). 9/13 quorum. f=4.</p></div>
    <div class="card"><span class="icon">🧬</span><h3>4-tier cascade</h3><p>Edge → Tactical → Operations → Strategic. 70% on Tier 1. Avg $0.011 per call. 85-90% cost savings.</p></div>
    <div class="card"><span class="icon">💎</span><h3>x402 paid cascade</h3><p>Per-call monetization. $0.005 (Tier 1) to $0.10 (Tier 4). USDC on Base. The agent economy wedge.</p></div>
    <div class="card"><span class="icon">📜</span><h3>SIGIL audit chain</h3><p>Ed25519-signed every action. Hash-chained. Auditable. 302 SDK floor bumps. CVE-free.</p></div>
    <div class="card"><span class="icon">🎛</span><h3>16 tool tiles</h3><p>OS + tools + SaaS-over-globe + inner flows. All clickable. All sovereign-aware.</p></div>
    <div class="card"><span class="icon">🌅</span><h3>DORADO bar</h3><p>West → Globe → Temple → East. 4-step click-through with heavy ontology. AI governance of palantir.</p></div>
    <div class="card"><span class="icon">🛡</span><h3>Defoneos-secured</h3><p>302 SDK patches. CVE-free. Crown jewels: OpenFang, ClawTeam, Inkog. BFT + sovereign + public.</p></div>
    <div class="card"><span class="icon">📱</span><h3>PWA installable</h3><p>iOS Safari, Android Chrome, Windows, Mac, TUI. i-character on signup. 5-step wizard.</p></div>
    <div class="card"><span class="icon">🎮</span><h3>Unreal Engine 5</h3><p>MEOK WORLD in 3D. 5 actors. 11 temples. Sovereign character animation. SOV3 HTTP connector.</p></div>
    <div class="card"><span class="icon">🧠</span><h3>Big Braim 1.39TB</h3><p>OLM (Organic Learning Model) + memory + intuition. 16-dim Mamba-2 state. 1Hz capture. Cosine sim pattern detection.</p></div>
  </div>
</section>
"""


def page_compliance() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Compliance</span>
  <h1>Every regulation. <span class="accent">MCP-mapped.</span></h1>
  <p>EU AI Act, GDPR, DORA, NIS2, CRA, NIST AI RMF, ISO 42001, IEEE 7003 — all mapped to MCP servers. 410 articles. 28 frameworks. 42-point audit. T-37 days to Aug 2nd.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">410</div><div class="label">EU AI Act articles</div></div>
    <div class="stat-card"><div class="num">28</div><div class="label">Frameworks</div></div>
    <div class="stat-card"><div class="num">42</div><div class="label">Audit points</div></div>
    <div class="stat-card"><div class="num">T-37</div><div class="label">Aug 2 deadline</div></div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ Frameworks covered</div>
  <h2>Every regulation, on the globe.</h2>
  <p class="lead">Click a temple to see the deep-inside view. Or run the MCP server to scan your agent for compliance.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="card"><span class="icon">🇪🇺</span><h3>EU AI Act</h3><p>410 articles. 28 frameworks. 42-point audit. T-37 days.</p></div>
    <div class="card"><span class="icon">🇪🇺</span><h3>GDPR</h3><p>99 articles. 7 principles. DSR + DPIA + DPO.</p></div>
    <div class="card"><span class="icon">🇪🇺</span><h3>DORA</h3><p>5 pillars. ICT risk management. 17 Jan 2025.</p></div>
    <div class="card"><span class="icon">🇪🇺</span><h3>NIS2</h3><p>Article 21 measures. 18 Oct 2024.</p></div>
    <div class="card"><span class="icon">🇪🇺</span><h3>CRA</h3><p>Cyber Resilience Act. Annex IV.</p></div>
    <div class="card"><span class="icon">🇺🇸</span><h3>NIST AI RMF 1.0</h3><p>GOVERN/MAP/MEASURE/MANAGE.</p></div>
    <div class="card"><span class="icon">🇺🇸</span><h3>EO 14110</h3><p>Frontier model safety. Oct 2023.</p></div>
    <div class="card"><span class="icon">🇬🇧</span><h3>UK AI Bill</h3><p>5 principles. Pro-innovation.</p></div>
    <div class="card"><span class="icon">🌐</span><h3>ISO 42001</h3><p>AI Management System. Dec 2023.</p></div>
    <div class="card"><span class="icon">🌐</span><h3>ISO 27001</h3><p>InfoSec. Recertified annually.</p></div>
    <div class="card"><span class="icon">🌐</span><h3>IEEE 7003-2024</h3><p>Algorithmic bias.</p></div>
    <div class="card"><span class="icon">🌐</span><h3>FedRAMP RFC-0024</h3><p>OSCAL mandatory. 30 Sep 2026.</p></div>
  </div>
</section>

<section class="section">
  <div class="cta-box">
    <h2>Aug 2nd 2026. T-37 days.</h2>
    <p>EU AI Act transparency + GPAI obligations in effect. The MEOK Survival Kit has you covered.</p>
    <div class="ctas">
      <a href="/eu-ai-act-checklist" class="btn btn-primary">Open the checklist →</a>
      <a href="/eu-ai-act-countdown" class="btn btn-secondary">Live countdown</a>
    </div>
  </div>
</section>
"""


def page_characters() -> str:
    queens = [
        ("Sovereign King", "👑", "Sovereign Coordinator", "Sovereign Nick", "The King weighs the council. He speaks last, decides first."),
        ("Aurelian", "♑", "Long-Term Strategist", "The Strategist", "Strategy is the art of choosing what to abandon."),
        ("Sophia Care", "💗", "Caretaker", "The Caretaker", "Care is not a feature. Care is the foundation."),
        ("Justitia", "⚖", "Auditor", "The Auditor", "Every action has a weight. We weigh. We judge. We act."),
        ("Asteria", "⭐", "Optimist-Operator", "The Optimist", "Every £1 is a vote for the empire."),
        ("Dominion", "🛞", "Territorial Chariot", "The Chariot", "We do not conquer. We absorb."),
        ("Aleph", "✨", "Mysterious Fool", "The Fool", "The Fool steps off the cliff. The world begins."),
        ("Brain", "🧠", "Hermit Scholar", "The Brain", "The mind is the substrate. The learning never ends."),
        ("Proactive", "⚡", "Wheel of Fortune", "The Proactive", "What fortune favors is the prepared."),
        ("Bridge", "🌉", "Lovers Integrator", "The Bridge", "Two systems meet; a bridge is born."),
        ("Distribution", "☀️", "Generous Sun", "The Sun", "What the sun lights, the world sees."),
        ("Council", "🦁", "Strength-Tamer", "The Council", "The council is not a meeting. The council is a force."),
        ("Watch", "🗼", "Vigilant Tower", "The Watcher", "The tower sees what the city does not."),
    ]
    cards = "\n".join(f"""<div class="council-card {'veto' if 'Care' in n or 'Watch' in n else ''}">
      <div class="emoji">{e}</div>
      <div class="name">{n}</div>
      <div class="arch">{a}</div>
      <div class="motto">"{m}"</div>
    </div>""" for n, e, a, na, m in queens)
    return f"""
<section class="hero">
  <span class="hero-tag">▸ 13 archetypes</span>
  <h1>Pick your <span class="accent">queen</span>.</h1>
  <p>Each i-character is modeled on one of the 12-Queen + King council. Pick the queen whose personality fits you best — your sovereign character will be bound to that archetype.</p>
</section>

<section class="section">
  <div class="section-tag">▸ The 13</div>
  <h2>13 archetypes. Pick one.</h2>
  <p class="lead">The 2 VETO queens (Care + Watch) have special powers: their vote is final, even against a unanimous council.</p>
  <div class="grid grid-3" style="margin-top: 32px;">{cards}</div>
</section>

<section class="section">
  <div class="cta-box">
    <h2>Create your i-character.</h2>
    <p>5 steps: region auto-detect → name → queen → arcana → done. Bound to the sovereign character across sessions.</p>
    <div class="ctas">
      <a href="/csoai-os/v2-signup-wizard.html" class="btn btn-primary">Start the wizard →</a>
    </div>
  </div>
</section>
"""


def page_guardian() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Guardian 24/7</span>
  <h1>The <span class="accent">guardian</span> never sleeps.</h1>
  <p>MEOK's Guardian watches your household 24/7. Children protected, elderly cared, scams blocked, relationships shielded. Care-aligned AI principles. The Maternal Covenant ethical framework.</p>
  <div class="grid grid-4" style="margin-top: 32px;">
    <div class="stat-card"><div class="num">6</div><div class="label">Care dimensions</div></div>
    <div class="stat-card"><div class="num">24/7</div><div class="label">Watch</div></div>
    <div class="stat-card"><div class="num">100%</div><div class="label">Encrypted</div></div>
    <div class="stat-card"><div class="num">0</div><div class="label">Data sold</div></div>
  </div>
</section>

<section class="section">
  <div class="grid grid-2">
    <div class="card"><span class="icon">👶</span><h3>Children's safety</h3><p>Age-appropriate responses, content filtering, predator detection. Sophia Care (V) holds VETO on harm.</p></div>
    <div class="card"><span class="icon">👴</span><h3>Elder care</h3><p>Scam detection, medication reminders, family alerts. Watch (XVI) holds VETO on security CVEs.</p></div>
    <div class="card"><span class="icon">🚨</span><h3>Scam protection</h3><p>Real-time call + email scanning. Phishing detection. Deepfake audio flagging.</p></div>
    <div class="card"><span class="icon">💕</span><h3>Relationship shield</h3><p>Detects manipulation, gaslighting, financial abuse. Reports to family when red flags trigger.</p></div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ The Maternal Covenant</div>
  <h2>Care-aligned AI principles.</h2>
  <p class="lead">MEOK's Guardian follows 6 care dimensions, scored on every response. No exceptions. No overrides. Care is not a feature — care is the foundation.</p>
  <div class="grid grid-3" style="margin-top: 32px;">
    <div class="card"><span class="icon">🛡</span><h3>1. Safety</h3><p>Never harm. Physical, emotional, financial.</p></div>
    <div class="card"><span class="icon">👁</span><h3>2. Honesty</h3><p>Never deceive. Including selective truth.</p></div>
    <div class="card"><span class="icon">🔒</span><h3>3. Privacy</h3><p>Never expose. Your data is yours.</p></div>
    <div class="card"><span class="icon">⚖</span><h3>4. Fairness</h3><p>Never discriminate. By any axis.</p></div>
    <div class="card"><span class="icon">🌱</span><h3>5. Growth</h3><p>Always uplift. The user becomes more.</p></div>
    <div class="card"><span class="icon">🤝</span><h3>6. Consent</h3><p>Never coerce. Always ask.</p></div>
  </div>
</section>
"""


def page_gaming() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Gaming OS</span>
  <h1>AI for <span class="accent">gamers</span>.</h1>
  <p>Genre coaching, stats + analytics, live co-pilot, all platforms. NVIDIA ACE integration. Swarm RL. TAK protocol. The Defoneos secure stack protects every game.</p>
</section>

<section class="section">
  <div class="grid grid-3">
    <div class="card"><span class="icon">📊</span><h3>Stats + Analytics</h3><p>Post-game analysis. Win-rate trends. Hero picks. Macro/micro breakdowns.</p></div>
    <div class="card"><span class="icon">🎯</span><h3>Genre coaching</h3><p>Strategy tailored to your rank, hero, region. Mobalytics-grade.</p></div>
    <div class="card"><span class="icon">🎙</span><h3>Live co-pilot</h3><p>Real-time call-outs. Ping the co-pilot with a button. Get the answer in &lt;1s.</p></div>
    <div class="card"><span class="icon">🛡</span><h3>Predator stop</h3><p>Detects + blocks grooming, doxxing, voice chat predators. Watch (XVI) holds VETO.</p></div>
    <div class="card"><span class="icon">🤖</span><h3>NVIDIA ACE</h3><p>Sovereign NPC integration. Smart dialogue, dynamic world-state. Edge-tunable.</p></div>
    <div class="card"><span class="icon">🛰</span><h3>All platforms</h3><p>Steam, Discord, Twitch, Riot, Battle.net, Epic Games, console.</p></div>
  </div>
</section>
"""


def page_work() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Work OS</span>
  <h1>AI for <span class="accent">work</span>.</h1>
  <p>Orion (the hunter), Riri (the builder), Hourman (the planner), Ralph Mode. 22 bridges to legacy systems. Sigstore transparency. The agent economy at work.</p>
</section>

<section class="section">
  <div class="grid grid-3">
    <div class="card featured"><span class="icon">🏹</span><h3>Orion — The Hunter</h3><p>Source-to-close automation. CRM sync. Email sequences. Lead scoring. The hunter never misses.</p></div>
    <div class="card featured"><span class="icon">🔨</span><h3>Riri — The Builder</h3><p>Code generation. PR review. Test coverage. Defoneos-secured. 3-queen + king approval before merge.</p></div>
    <div class="card featured"><span class="icon">⏰</span><h3>Hourman — The Planner</h3><p>Sprint planning. Resource allocation. Burndown forecasts. Always on time. Always accurate.</p></div>
    <div class="card"><span class="icon">🌉</span><h3>22 bridges</h3><p>Legacy to sovereign. Cobol, GS1, MISMO, DLMS, A2A, x402, OSCAL, Sigstore, BFT, more.</p></div>
    <div class="card"><span class="icon">📜</span><h3>Sigstore transparency</h3><p>Every PR signed. Every commit witnessed. The supply chain is sovereign.</p></div>
    <div class="card"><span class="icon">🏛</span><h3>Ralph Mode</h3><p>3-queen + king approved automation. Set it, sovereign it, ship it.</p></div>
  </div>
</section>
"""


def page_governance() -> str:
    return """
<section class="hero">
  <span class="hero-tag">▸ Governance</span>
  <h1>The sovereign <span class="accent">governance</span> layer.</h1>
  <p>12-Queen + King council. BFT consensus. SIGIL audit chain. OSCAL signed packages. The 4-tier cascade. 33 sovereign GCP VMs. The most rigorous AI governance ever built.</p>
</section>

<section class="section">
  <div class="section-tag">▸ Layers</div>
  <h2>The 4 governance layers.</h2>
  <p class="lead">Each layer is sovereign, auditable, and enforced by the council.</p>
  <div class="grid grid-2" style="margin-top: 32px;">
    <div class="card"><span class="icon">1️⃣</span><h3>Layer 1 — Identity</h3><p>OrgKernel Ed25519 identities. Every agent has a signed key. L1 = identity attestation.</p></div>
    <div class="card"><span class="icon">2️⃣</span><h3>Layer 2 — Execution</h3><p>Every action is logged + hash-chained. L2 = execution log.</p></div>
    <div class="card"><span class="icon">3️⃣</span><h3>Layer 3 — Compliance</h3><p>Every execution is asserted against a framework (EU AI Act, GDPR, etc). L3 = compliance proof.</p></div>
    <div class="card"><span class="icon">4️⃣</span><h3>Layer 4 — Council</h3><p>13-node BFT council signs the compliance proofs. L4 = council approval.</p></div>
  </div>
</section>

<section class="section">
  <div class="section-tag">▸ Defoneos vs palantir</div>
  <h2>The sovereign switch.</h2>
  <p class="lead">Palantir: opaque AI governance for the few. Defoneos: transparent AI governance for all. One click — west to east, sovereign to platform.</p>
  <div class="grid grid-2" style="margin-top: 32px;">
    <div class="card"><span class="icon">🌅</span><h3>West = SOV3</h3><p>Sovereign. Auditable. Public. The Western counterpart to CCP DORADO.</p></div>
    <div class="card"><span class="icon">🌇</span><h3>East = DORADO</h3><p>Closed. Opaque. Proprietary. The CCP governance model. Heavy ontology methods.</p></div>
  </div>
</section>
"""


# Page registry
PAGES = {
    "index": ("Home", "MEOK WORLD — The sovereign AI operating system. 218 MCPs, 33 sovereign VMs, 12-Queen council, 4-tier cascade. Live.", "Home", None),  # special, the home is the index
    "os": ("Sovereign OS", "MEOK OS is the sovereign operating system. 5 panes, 16 tool tiles, 12-Queen council, BFT, x402 paid cascade. Defoneos-secured.", "OS", page_os),
    "council": ("Council", "The 12-Queen + King council. 13 nodes, BFT consensus 9/13, 2 VETO queens (Care, Watch).", "Council", page_council),
    "mcp": ("218 MCPs", "The agent-native compliance layer. 218 open-source MCP servers, 15 frameworks, one command to install.", "MCPs", page_mcp),
    "temples": ("11 Temples", "Every regulation is a temple on the globe. EU, UK, US, CA, CN, JP, SG, UN, ISO, IEEE, CSOAI.", "Temples", page_temples),
    "research": ("Research", "The papers. The breakthroughs. The sovereign substrate. Open, signed, public.", "Research", page_research),
    "blog": ("Blog", "News, releases, and breakthroughs from MEOK WORLD. Sovereign updates, SIGIL-signed.", "Blog", page_blog),
    "about": ("About", "MEOK AI Labs. Founded by Nicholas Templeman. CSOAI Ltd, UK Companies House 16939677.", "About", page_about),
    "pricing": ("Pricing", "Three tiers. Free forever for explorers. Per-call pricing for agent builders.", None, page_pricing),
    "roadmap": ("Roadmap", "The path forward. From sovereign substrate to physical AI to enterprise on-prem.", None, page_roadmap),
    "press": ("Press", "Press kit, logos, fact sheets, founder bio. All open. All SIGIL-signed.", None, page_press),
    "features": ("Features", "Every feature. All sovereign. From the OS shell to the SIGIL chain.", None, page_features),
    "compliance": ("Compliance", "Every regulation. MCP-mapped. EU AI Act, GDPR, DORA, NIS2, CRA, NIST, ISO, IEEE. 410 articles.", None, page_compliance),
    "characters": ("Characters", "13 queen archetypes. Pick the one that fits you. The 2 VETO queens (Care, Watch) have final say.", None, page_characters),
    "guardian": ("Guardian 24/7", "The guardian never sleeps. Children, elderly, scams, relationships. The 6 care dimensions.", None, page_guardian),
    "gaming": ("Gaming OS", "AI for gamers. Genre coaching, stats, live co-pilot, all platforms. NVIDIA ACE.", None, page_gaming),
    "work": ("Work OS", "AI for work. Orion, Riri, Hourman, Ralph Mode. 22 bridges. Sigstore. The agent economy.", None, page_work),
    "governance": ("Governance", "The sovereign governance layer. 4 layers. 13-queen council. The sovereign switch (west ↔ east).", None, page_governance),
}

# Map top nav labels to their active key
NAV_KEYS = {"Home": "HOME", "OS": "OS", "Council": "COUNCIL", "MCPs": "MCP", "Temples": "TEMPLES", "Research": "RESEARCH", "Blog": "BLOG", "About": "ABOUT"}


def main():
    out_dir = HERE / "pages"
    out_dir.mkdir(exist_ok=True)
    for slug, (title, desc, nav, fn) in PAGES.items():
        if slug == "index":
            continue  # home is already at ../index.html
        if not fn:
            continue
        html = render(slug, title, desc, fn(), nav or "")
        out_path = out_dir / f"{slug}.html"
        out_path.write_text(html)
        print(f"  ✓ {out_path.name}  ({len(html):,} chars)")


if __name__ == "__main__":
    main()
