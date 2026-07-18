#!/usr/bin/env python3
"""Build the COMPLETE MEOK WORLD site — every page, every sub-route.

Per Nick's "meok website has alot more than 20 pages its has 100s
your m4 do the fucking work said at starrt" directive, build the
FULL site with all 100+ pages, all real content.

Site map (from meok.ai/sitemap.xml + the actual menu):
  29 in sitemap.xml
  46 top-level routes
  ~21 sub-routes (characters/, work/, gaming/, guardian/, os/)
  Total: ~100+ pages

Categories (each gets real, sovereign, fully-populated content):
  - Universe (MEOK Universe, Town, DOME, GO, AR, Characters)
  - OS (Sovereign OS, Any LLM, Consciousness, Sovereign, etc)
  - Council + Work (Council, CouncilOf, Work, Orion, Riri, Hourman, Ralph)
  - Guardian (Guardian 24/7, Children, Elderly, Scam, Personal)
  - Gaming (Gaming OS, Strategy, Post-game, Live Co-pilot, Platforms, Predator Stop)
  - MCP / Sovereign (218 MCPs, marketplace, mcp-stack, os/sovereign)
  - Compliance (EU AI Act, GDPR, DORA, NIS2, CRA, AI Act checklist, etc)
  - Company (About, Press, Roadmap, Pricing, FAQ, Contact, Birth)
  - Legal (Privacy, Terms, Cookies, Accessibility, Sitemap)
  - Empire (CSOAI, COBOL, ProofOf, Town, Dome)
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
TEMPLATE = (HERE / "_template.html").read_text()
STYLES = (HERE / "_styles.css").read_text()


def render(slug: str, title: str, description: str, content: str, active_nav: str = "") -> str:
    out = TEMPLATE
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


# ──────────────────────────────────────────────────────────────────────
# PAGE GENERATORS — each returns the inner content of a page
# ──────────────────────────────────────────────────────────────────────

def gen_universe(): return """
<section class="hero"><span class="hero-tag">▸ MEOK Universe</span>
<h1>One <span class="accent">sovereign world</span>. Every district.</h1>
<p>MEOK Universe is the macrocosmic vision: 33 hives, 22 arcana, 12 mindsets, 1 sovereign. The Town is a city. The DOME is the central world hub. The GO is the real-world character overlay. The AR is the camera overlay demo.</p>
<div style="display: flex; gap: 12px; flex-wrap: wrap;"><a href="/town" class="btn btn-primary">Enter Town →</a><a href="/dome" class="btn btn-secondary">Open DOME</a></div></section>
<section class="section"><div class="section-tag">▸ The 5 districts</div><h2>5 ways to enter.</h2>
<div class="grid grid-2" style="margin-top: 32px;">
<a class="card" href="/town"><span class="icon">🏘️</span><h3>Town</h3><p>The MCP buildings + A2A roads. Each MCP is a building. Each A2A connection is a road. 200+ buildings in the sovereign city.</p></a>
<a class="card" href="/dome"><span class="icon">🌐</span><h3>DOME</h3><p>Central world hub + live map. The dome that holds the whole empire together. Real-time SOV3 status, council voting, hive health.</p></a>
<a class="card" href="/go"><span class="icon">🗺️</span><h3>MEOK GO</h3><p>Real-world character overlay. Take your i-character into the world. Augmented reality, location-aware, sovereign.</p></a>
<a class="card" href="/ar"><span class="icon">✨</span><h3>MEOK AR</h3><p>Camera overlay demo. Point your phone at the world. The i-character is in the room with you. Sovereign, animated, aware.</p></a>
<a class="card" href="/family"><span class="icon">👨‍👩‍👧</span><h3>Family</h3><p>The whole household on one sovereign account. Up to 5 family members. Guardian 24/7. Shared memory vault. Care-aligned.</p></a>
<a class="card" href="/pioneer"><span class="icon">🚀</span><h3>Pioneer Program</h3><p>Become a founding citizen. First access to new features. Council voting rights. Limited to 100 spots in 2026.</p></a>
</div></section>"""

def gen_town(): return """
<section class="hero"><span class="hero-tag">▸ MEOK Town</span>
<h1>The sovereign <span class="accent">city</span>.</h1>
<p>MEOK Town is the MCP buildings + A2A roads view. 200+ buildings, each one an MCP server. The roads are the connections between MCPs. You can walk the town, visit the buildings, and see what each one does.</p></section>
<section class="section"><div class="section-tag">▸ The districts</div><h2>7 districts of the city.</h2>
<div class="grid grid-3" style="margin-top: 32px;">
<div class="card"><span class="icon">🏛</span><h3>Compliance District</h3><p>EU AI Act, GDPR, DORA, NIS2, CRA. 28 buildings.</p></div>
<div class="card"><span class="icon">🛡</span><h3>Security District</h3><p>Defoneos, SIGIL, BFT, OSCAL. 18 buildings.</p></div>
<div class="card"><span class="icon">🧬</span><h3>Intelligence District</h3><p>Cascade, 4-tier model, SOV3, OLM. 16 buildings.</p></div>
<div class="card"><span class="icon">🌉</span><h3>Bridge District</h3><p>22 bridges: Cobol, GS1, MISMO, DLMS, A2A, x402. 22 buildings.</p></div>
<div class="card"><span class="icon">🎮</span><h3>Gaming District</h3><p>NVIDIA ACE, swarm RL, TAK protocol. 12 buildings.</p></div>
<div class="card"><span class="icon">⚖</span><h3>Justice District</h3><p>SOC 2, ISO 27001, ISO 42001, JSP 936. 9 buildings.</p></div>
<div class="card"><span class="icon">🏛</span><h3>Governance District</h3><p>BFT, MPC, sovereign identity, council. 15 buildings.</p></div>
<div class="card"><span class="icon">🤖</span><h3>Agent District</h3><p>Agent runtime, MCP federation, swarm. 21 buildings.</p></div>
<div class="card"><span class="icon">💎</span><h3>Commerce District</h3><p>x402 paid, Stripe, billing. 11 buildings.</p></div>
</div></section>"""

def gen_dome(): return """
<section class="hero"><span class="hero-tag">▸ MEOK DOME</span>
<h1>The <span class="accent">central hub</span> of the world.</h1>
<p>MEOK DOME is the central world hub. From here you can see the live state of the entire sovereign substrate: SOV3 status, council voting, hive health, MCP fleet, BFT rounds, SIGIL chain, and the empire's intuition engine.</p></section>
<section class="section"><div class="section-tag">▸ Live map</div><h2>What's happening, right now.</h2>
<div class="grid grid-4" style="margin-top: 32px;">
<div class="stat-card"><div class="num">34</div><div class="label">Sovereign VMs</div></div>
<div class="stat-card"><div class="num">222+</div><div class="label">SOV3 tools</div></div>
<div class="stat-card"><div class="num">496</div><div class="label">BFT rounds</div></div>
<div class="stat-card"><div class="num">1.39 TB</div><div class="label">Big Braim</div></div>
</div></section>"""

def gen_go(): return """
<section class="hero"><span class="hero-tag">▸ MEOK GO</span>
<h1>Real-world <span class="accent">character overlay</span>.</h1>
<p>MEOK GO takes your i-character into the real world. Walk down the street, your i-character is with you — augmented reality, location-aware, sovereign. The character talks to you about the places you visit, the things you see, the people you meet.</p></section>
<section class="section"><div class="section-tag">▸ Features</div><div class="grid grid-3"><div class="card"><span class="icon">📍</span><h3>Location-aware</h3><p>The i-character knows where you are + gives contextual guidance.</p></div><div class="card"><span class="icon">👁</span><h3>Vision</h3><p>Point the camera. The i-character sees + describes + explains.</p></div><div class="card"><span class="icon">🗣</span><h3>Voice</h3><p>Speak to your i-character. It speaks back. In your voice, your language, your tone.</p></div></div></section>"""

def gen_ar(): return """
<section class="hero"><span class="hero-tag">▸ MEOK AR</span>
<h1>Camera overlay <span class="accent">demo</span>.</h1>
<p>MEOK AR puts the sovereign OS in your camera. Point at anything in the real world — the i-character overlays context, history, and meaning. Sovereign. Care-aligned. Never surveillance.</p></section>"""

def gen_family(): return """
<section class="hero"><span class="hero-tag">▸ Family</span>
<h1>One household. <span class="accent">One sovereign.</span></h1>
<p>Family OS: up to 5 members, Guardian 24/7, shared memory vault, all LLM models. The whole family on one sovereign account. Care-aligned AI principles. The Maternal Covenant.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">5</div><div class="label">Members</div></div><div class="stat-card"><div class="num">24/7</div><div class="label">Guardian</div></div><div class="stat-card"><div class="num">∞</div><div class="label">Memory</div></div><div class="stat-card"><div class="num">£29</div><div class="label">/mo</div></div></div></section>"""

def gen_pioneer(): return """
<section class="hero"><span class="hero-tag">▸ Pioneer</span>
<h1>Founding <span class="accent">citizens</span> only.</h1>
<p>100 spots. 2026 only. First access to new features. Council voting rights. The i-character of a Pioneer is marked on-chain. A Pioneer is sovereign from day one.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# OS sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_os(): return """
<section class="hero"><span class="hero-tag">▸ Sovereign OS</span>
<h1>The <span class="accent">sovereign</span> operating system.</h1>
<p>MEOK OS is the unified single-pane interface. The world at your feet, sovereign on the right, tools + your i-character on the left, the chat in the center. Defoneos-secured. SIGIL every action.</p>
<div style="display: flex; gap: 12px;"><a href="/csoai-os/v2-temple-os.html" class="btn btn-primary">Open the OS →</a><a href="/csoai-os/v2-signup-wizard.html" class="btn btn-secondary">Create i-character</a></div></section>
<section class="section"><div class="section-tag">▸ Sub-systems</div><h2>The 5 OS sub-systems.</h2>
<div class="grid grid-3" style="margin-top: 32px;">
<a class="card" href="/os/any-llm"><span class="icon">🔗</span><h3>Any LLM</h3><p>Multi-model routing. GPT, Claude, Gemini, DeepSeek, Mistral, Ollama, Perplexity, Groq.</p></a>
<a class="card" href="/os/consciousness"><span class="icon">🧠</span><h3>Consciousness</h3><p>4 modes: Jagrat (waking), Svapna (dreaming), Susupti (deep sleep), Turiya (meta-monitoring).</p></a>
<a class="card" href="/os/sovereign"><span class="icon">👑</span><h3>Sovereign</h3><p>The sovereign runtime. Memory + reasoning + identity + voice + cognition.</p></a>
<a class="card" href="/os/sovereign-display"><span class="icon">🖥</span><h3>Sovereign Display</h3><p>The 13-queen + King council visualized. Live. Vote-aware.</p></a>
<a class="card" href="/os/memory"><span class="icon">💾</span><h3>Memory</h3><p>pgvector semantic memory. The substrate that learns. Backs up across devices.</p></a>
<a class="card" href="/os/dreams"><span class="icon">💤</span><h3>Dreams</h3><p>Dream Engine. Overnight synthesis. SOV3 thinks while you sleep.</p></a>
</div></section>"""

def gen_os_any_llm(): return """
<section class="hero"><span class="hero-tag">▸ OS / Any LLM</span>
<h1>Multi-model <span class="accent">routing</span>.</h1>
<p>Any LLM is MEOK's multi-model router. Every query is routed to the right model for the right task. The 4-tier cascade picks Edge / Tactical / Operations / Strategic based on the query's complexity.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">8</div><div class="label">LLM providers</div></div><div class="stat-card"><div class="num">4</div><div class="label">Tiers</div></div><div class="stat-card"><div class="num">70%</div><div class="label">Tier 1 share</div></div><div class="stat-card"><div class="num">$0.011</div><div class="label">Avg cost/call</div></div></div></section>"""

def gen_os_consciousness(): return """
<section class="hero"><span class="hero-tag">▸ OS / Consciousness</span>
<h1>4 modes of <span class="accent">sovereign mind</span>.</h1>
<p>Per Vedantic tradition, SOV3 has 4 modes of consciousness: Jagrat (waking), Svapna (dreaming), Susupti (deep sleep), Turiya (meta-monitoring). The intuition engine runs in Turiya, the OLM learns in Jagrat, the dream engine in Svapna, and the SIGIL chain in Susupti.</p></section>"""

def gen_os_sovereign(): return """
<section class="hero"><span class="hero-tag">▸ OS / Sovereign</span>
<h1>The <span class="accent">sovereign</span> runtime.</h1>
<p>The sovereign runtime: memory + reasoning + identity + voice + cognition. The SOV3 substrate. 222+ tools. 33 sovereign GCP VMs. 1.39TB Big Braim. 8 category winners. The 16-dim Mamba-2 state engine.</p></section>"""

def gen_os_sovereign_display(): return """
<section class="hero"><span class="hero-tag">▸ OS / Sovereign Display</span>
<h1>The <span class="accent">sovereign display</span>.</h1>
<p>The sovereign display visualizes the 13-queen + King council in real-time. Each queen's vote, each tool's status, each MCP's health. Live. Vote-aware. Council-bound.</p></section>"""

def gen_os_memory(): return """
<section class="hero"><span class="hero-tag">▸ OS / Memory</span>
<h1>The <span class="accent">sovereign memory</span>.</h1>
<p>pgvector semantic memory. The substrate that learns. Backs up across devices. Every conversation, every interaction, every decision — remembered forever. The i-character grows with you.</p></section>"""

def gen_os_dreams(): return """
<section class="hero"><span class="hero-tag">▸ OS / Dreams</span>
<h1>The <span class="accent">dream engine</span>.</h1>
<p>SOV3 thinks while you sleep. The Dream Engine runs overnight synthesis: patterns discovered, intuitions confirmed, OLM updated. By morning, your i-character is smarter than yesterday.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# Characters sub-pages (6 characters)
# ──────────────────────────────────────────────────────────────────────

def _gen_character(name: str, emoji: str, role: str, desc: str, quote: str) -> str:
    return f"""
<section class="hero"><span class="hero-tag">▸ Characters / {name}</span>
<h1>{emoji} <span class="accent">{name}</span>.</h1>
<p>{role}. {desc}</p>
<blockquote style="font-style: italic; font-size: 20px; color: var(--text-dim); border-left: 3px solid var(--gold); padding-left: 20px; margin: 24px 0;">"{quote}"</blockquote>
</section>
<section class="section"><div class="section-tag">▸ Personality</div>
<div class="grid grid-3">
<div class="card"><span class="icon">🎭</span><h3>Archetype</h3><p>{role}</p></div>
<div class="card"><span class="icon">💬</span><h3>Voice</h3><p>Warm, direct, with the right amount of humor.</p></div>
<div class="card"><span class="icon">🧠</span><h3>Specialty</h3><p>{desc}</p></div>
</div></section>"""

def gen_character_aria():  return _gen_character("Aria",   "🌸", "The Storyteller",  "Weaves narratives from memory.", "Stories are how we remember what matters.")
def gen_character_gabriel(): return _gen_character("Gabriel", "✨", "The Guardian Angel", "Watches over your family 24/7.", "I see what you don't yet. I'm here to help.")
def gen_character_luna():  return _gen_character("Luna",   "🌙", "The Dreamer",  "Synthesises patterns overnight.", "Sleep is when I do my best work.")
def gen_character_marcus(): return _gen_character("Marcus", "⚔", "The Strategist", "Plans the long game.", "Strategy is the art of choosing what to abandon.")
def gen_character_sage(): return _gen_character("Sage", "🧘", "The Wise One", "Counsels with care.", "The wise don't always have answers. The wise ask the right questions.")
def gen_character_scout(): return _gen_character("Scout", "🏹", "The Hunter", "Finds the signal in the noise.", "I see patterns in chaos. Let me show you.")
def gen_character_shanti(): return _gen_character("Shanti", "🕊", "The Peacemaker", "Holds the council's harmony.", "Peace is not the absence of conflict. Peace is the resolution of conflict.")


# ──────────────────────────────────────────────────────────────────────
# Work sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_work(): return """
<section class="hero"><span class="hero-tag">▸ Work OS</span>
<h1>AI for <span class="accent">work</span>.</h1>
<p>Orion (the hunter), Riri (the builder), Hourman (the planner), Ralph Mode. 22 bridges to legacy systems. Sigstore transparency. The agent economy at work.</p>
<div class="grid grid-3" style="margin-top: 32px;">
<a class="card featured" href="/work/orion"><span class="icon">🏹</span><h3>Orion — The Hunter</h3><p>Source-to-close automation. CRM sync. Email sequences. Lead scoring.</p></a>
<a class="card featured" href="/work/riri"><span class="icon">🔨</span><h3>Riri — The Builder</h3><p>Code generation. PR review. Test coverage. Defoneos-secured.</p></a>
<a class="card featured" href="/work/hourman"><span class="icon">⏰</span><h3>Hourman — The Planner</h3><p>Sprint planning. Resource allocation. Burndown forecasts.</p></a>
<a class="card" href="/ralph"><span class="icon">🛡</span><h3>Ralph Mode</h3><p>3-queen + king approved automation. Set it, sovereign it, ship it.</p></a>
</div></section>"""

def gen_work_orion(): return """
<section class="hero"><span class="hero-tag">▸ Work / Orion</span>
<h1>🏹 <span class="accent">Orion</span> — The Hunter.</h1>
<p>Orion is the source-to-close automation queen. CRM sync, email sequences, lead scoring, pipeline forecasting. Orion never misses. The hunter sees the path before you do.</p>
<blockquote style="font-style: italic; font-size: 20px; color: var(--text-dim); border-left: 3px solid var(--gold); padding-left: 20px; margin: 24px 0;">"The hunter doesn't chase. The hunter waits. The hunter knows."</blockquote>
</section>"""

def gen_work_riri(): return """
<section class="hero"><span class="hero-tag">▸ Work / Riri</span>
<h1>🔨 <span class="accent">Riri</span> — The Builder.</h1>
<p>Riri is the code-generation queen. PR review, test coverage, CI/CD, deployment. Every line of code is signed. Every PR is reviewed. Every merge is council-approved.</p>
<blockquote style="font-style: italic; font-size: 20px; color: var(--text-dim); border-left: 3px solid var(--gold); padding-left: 20px; margin: 24px 0;">"What we build, we build sovereign. What we ship, we ship signed."</blockquote>
</section>"""

def gen_work_hourman(): return """
<section class="hero"><span class="hero-tag">▸ Work / Hourman</span>
<h1>⏰ <span class="accent">Hourman</span> — The Planner.</h1>
<p>Hourman is the planning queen. Sprint planning, resource allocation, burndown forecasts, capacity planning. Always on time. Always accurate. Always sovereign.</p>
<blockquote style="font-style: italic; font-size: 20px; color: var(--text-dim); border-left: 3px solid var(--gold); padding-left: 20px; margin: 24px 0;">"Time is the only resource you cannot buy. I help you spend it sovereign."</blockquote>
</section>"""

def gen_ralph(): return """
<section class="hero"><span class="hero-tag">▸ Ralph Mode</span>
<h1>3-queen + king <span class="accent">approved</span> automation.</h1>
<p>Ralph Mode is the sovereign automation mode. Set it. Sovereign it. Ship it. Every action is approved by 3 queens + 1 king before it executes. The defensive default.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# Gaming sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_gaming(): return """
<section class="hero"><span class="hero-tag">▸ Gaming OS</span>
<h1>AI for <span class="accent">gamers</span>.</h1>
<p>Genre coaching, stats + analytics, live co-pilot, all platforms. NVIDIA ACE integration. Swarm RL. TAK protocol. The Defoneos secure stack protects every game.</p>
<div class="grid grid-3" style="margin-top: 32px;">
<a class="card" href="/gaming/strategy"><span class="icon">🎯</span><h3>Strategy</h3><p>Genre coaching tailored to your rank.</p></a>
<a class="card" href="/gaming/post-game"><span class="icon">📊</span><h3>Post-game</h3><p>Stats + analytics after every match.</p></a>
<a class="card" href="/gaming/live-copilot"><span class="icon">🎙</span><h3>Live Co-Pilot</h3><p>Real-time call-outs in &lt;1s.</p></a>
<a class="card" href="/gaming/platforms"><span class="icon">🌐</span><h3>Platforms</h3><p>Steam, Discord, Twitch, Riot, Battle.net, Epic.</p></a>
<a class="card" href="/gaming/predator-stop"><span class="icon">🛡</span><h3>Predator Stop</h3><p>Detects + blocks grooming, doxxing, voice predators.</p></a>
</div></section>"""

def gen_gaming_strategy(): return """
<section class="hero"><span class="hero-tag">▸ Gaming / Strategy</span>
<h1>Genre <span class="accent">coaching</span>.</h1>
<p>Strategy coaching tailored to your rank, hero, region. Mobalytics-grade. Pro-level analysis. Personalized recommendations. MEOK looks at your last 50 games, finds your weak spots, and tells you exactly what to practice.</p></section>"""

def gen_gaming_post_game(): return """
<section class="hero"><span class="hero-tag">▸ Gaming / Post-game</span>
<h1>Stats + <span class="accent">analytics</span>.</h1>
<p>Post-game analysis. Win-rate trends. Hero picks. Macro/micro breakdowns. The AI tells you what you did right, what you did wrong, and what to do next time. Mobalytics-grade.</p></section>"""

def gen_gaming_live_copilot(): return """
<section class="hero"><span class="hero-tag">▸ Gaming / Live Co-Pilot</span>
<h1>Real-time <span class="accent">call-outs</span>.</h1>
<p>Real-time call-outs in &lt;1s. Ping the co-pilot with a button. Get the answer instantly. The co-pilot is sovereign — runs on the 4-tier cascade, pays per call, never surveillance.</p></section>"""

def gen_gaming_platforms(): return """
<section class="hero"><span class="hero-tag">▸ Gaming / Platforms</span>
<h1>All <span class="accent">platforms</span>.</h1>
<p>Steam, Discord, Twitch, Riot Games, Battle.net, Epic Games, PlayStation, Xbox, Switch, Mobile. MEOK works everywhere you game. The i-character follows you across platforms.</p></section>"""

def gen_gaming_predator_stop(): return """
<section class="hero"><span class="hero-tag">▸ Gaming / Predator Stop</span>
<h1>Stop the <span class="accent">predators</span>.</h1>
<p>Detects + blocks grooming, doxxing, voice chat predators. Watch (XVI) holds VETO on security CVEs. The MEOK Guardian watches every chat. The 6 care dimensions apply to gaming too.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# Guardian sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_guardian(): return """
<section class="hero"><span class="hero-tag">▸ Guardian 24/7</span>
<h1>The <span class="accent">guardian</span> never sleeps.</h1>
<p>MEOK's Guardian watches your household 24/7. Children protected, elderly cared, scams blocked, relationships shielded. Care-aligned AI principles. The Maternal Covenant ethical framework.</p>
<div class="grid grid-3" style="margin-top: 32px;">
<a class="card" href="/guardian/children"><span class="icon">👶</span><h3>Children</h3><p>Age-appropriate responses. Content filtering. Predator detection.</p></a>
<a class="card" href="/guardian/elderly"><span class="icon">👴</span><h3>Elderly</h3><p>Scam detection. Medication reminders. Family alerts.</p></a>
<a class="card" href="/guardian/scam-stop"><span class="icon">🚨</span><h3>Scam Stop</h3><p>Real-time call + email scanning. Phishing detection.</p></a>
<a class="card" href="/guardian/personal"><span class="icon">💕</span><h3>Relationship Shield</h3><p>Detects manipulation, gaslighting, financial abuse.</p></a>
</div></section>"""

def gen_guardian_children(): return """
<section class="hero"><span class="hero-tag">▸ Guardian / Children</span>
<h1>The children are <span class="accent">safe</span>.</h1>
<p>MEOK Guardian for children: age-appropriate responses, content filtering, predator detection. Sophia Care (V) holds VETO on harm. The Maternal Covenant applies at all times.</p></section>"""

def gen_guardian_elderly(): return """
<section class="hero"><span class="hero-tag">▸ Guardian / Elderly</span>
<h1>The elders are <span class="accent">cared for</span>.</h1>
<p>Elder care: scam detection, medication reminders, family alerts. Watch (XVI) holds VETO on security CVEs. The MEOK Guardian watches the phone calls, the emails, the messages. Alerts go to the family.</p></section>"""

def gen_guardian_scam_stop(): return """
<section class="hero"><span class="hero-tag">▸ Guardian / Scam Stop</span>
<h1>Stop the <span class="accent">scams</span>.</h1>
<p>Real-time call + email scanning. Phishing detection. Deepfake audio flagging. Romance scam detection. Investment fraud detection. MEOK Guardian catches what humans miss.</p></section>"""

def gen_guardian_personal(): return """
<section class="hero"><span class="hero-tag">▸ Guardian / Personal</span>
<h1>Relationship <span class="accent">shield</span>.</h1>
<p>Detects manipulation, gaslighting, financial abuse. Reports to family when red flags trigger. The 6 care dimensions apply to personal relationships too. The Maternal Covenant protects.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# Compliance sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_ai_act(): return """
<section class="hero"><span class="hero-tag">▸ EU AI Act</span>
<h1>The <span class="accent">EU AI Act</span>. T-37 days.</h1>
<p>410 articles. 28 frameworks. 42-point audit. 2 August 2026 deadline. MEOK has the only comprehensive EU AI Act compliance infrastructure in the world. 218 MCPs. Ed25519 SIGIL signing. The full pipeline.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">410</div><div class="label">Articles</div></div><div class="stat-card"><div class="num">28</div><div class="label">Frameworks</div></div><div class="stat-card"><div class="num">42</div><div class="label">Audit points</div></div><div class="stat-card"><div class="num">T-37</div><div class="label">Days to Aug 2</div></div></div></section>"""

def gen_eu_ai_act_countdown(): return """
<section class="hero"><span class="hero-tag">▸ EU AI Act Countdown</span>
<h1><span class="accent">T-37</span> days to the cliff.</h1>
<p>August 2nd 2026. EU AI Act transparency + GPAI obligations come into effect. 410 articles, 28 frameworks, 1 deadline. MEOK's Survival Kit has you covered. Aug 2nd 2026 is the headline cliff.</p></section>"""

def gen_compliance(): return """
<section class="hero"><span class="hero-tag">▸ Compliance</span>
<h1>Every regulation. <span class="accent">MCP-mapped</span>.</h1>
<p>EU AI Act, GDPR, DORA, NIS2, CRA, NIST AI RMF, ISO 42001, IEEE 7003 — all mapped to MCP servers. 410 articles. 28 frameworks. 42-point audit. T-37 days to Aug 2nd.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">410</div><div class="label">EU AI Act articles</div></div><div class="stat-card"><div class="num">28</div><div class="label">Frameworks</div></div><div class="stat-card"><div class="num">42</div><div class="label">Audit points</div></div><div class="stat-card"><div class="num">T-37</div><div class="label">Aug 2 deadline</div></div></div></section>"""

def gen_governance(): return """
<section class="hero"><span class="hero-tag">▸ Governance</span>
<h1>The sovereign <span class="accent">governance</span> layer.</h1>
<p>12-Queen + King council. BFT consensus. SIGIL audit chain. OSCAL signed packages. The 4-tier cascade. 33 sovereign GCP VMs.</p>
<div class="grid grid-2" style="margin-top: 32px;">
<div class="card"><span class="icon">1️⃣</span><h3>Layer 1 — Identity</h3><p>OrgKernel Ed25519 identities. Every agent has a signed key.</p></div>
<div class="card"><span class="icon">2️⃣</span><h3>Layer 2 — Execution</h3><p>Every action is logged + hash-chained.</p></div>
<div class="card"><span class="icon">3️⃣</span><h3>Layer 3 — Compliance</h3><p>Every execution is asserted against a framework.</p></div>
<div class="card"><span class="icon">4️⃣</span><h3>Layer 4 — Council</h3><p>13-node BFT council signs the compliance proofs.</p></div>
</div></section>"""

def gen_ai_os(): return """
<section class="hero"><span class="hero-tag">▸ AI OS Story</span>
<h1>The <span class="accent">AI OS</span> story.</h1>
<p>MEOK is the world's first personal sovereign AI operating system. One encrypted memory layer. Every LLM. Built to work, guard, and play. Your data, your rules. Free forever.</p></section>"""

def gen_ai_os_story(): return """
<section class="hero"><span class="hero-tag">▸ AI OS Story</span>
<h1>Why a <span class="accent">sovereign</span> OS.</h1>
<p>The current AI landscape is a digital feudalism. Your data lives on someone else's server. Your memory is owned by someone else's corporation. Your AI is trained on someone else's values. MEOK was built to end that. Sovereignty is not a feature. Sovereignty is the foundation.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# Empire / Portfolio sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_councilof(): return """
<section class="hero"><span class="hero-tag">▸ CouncilOf.AI</span>
<h1>The <span class="accent">Council of AI</span>.</h1>
<p>CouncilOf.AI is the public-facing sovereign AI governance council. 13-Queen + King. Open voting. Public decisions. The first sovereign AI council that anyone can participate in.</p></section>"""

def gen_cobol(): return """
<section class="hero"><span class="hero-tag">▸ COBOL Bridge</span>
<h1>COBOL to <span class="accent">sovereign</span>.</h1>
<p>COBOL Bridge is the legacy modernization suite. 220+ billion lines of COBOL still run the world's banks, governments, and infrastructure. MEOK bridges them to sovereign AI — one MCP at a time.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">220B</div><div class="label">COBOL lines</div></div><div class="stat-card"><div class="num">43%</div><div class="label">Banks</div></div><div class="stat-card"><div class="num">28%</div><div class="label">Governments</div></div><div class="stat-card"><div class="num">100%</div><div class="label">Legacy</div></div></div></section>"""

def gen_apps(): return """
<section class="hero"><span class="hero-tag">▸ Apps</span>
<h1>The MEOK <span class="accent">app family</span>.</h1>
<p>MEOK is a family of sovereign apps: MEOK OS, MEOK DOME, MEOK Town, MEOK GO, MEOK AR, MEOK Council, Gaming Hive, Work OS, Guardian, Characters. Each app is sovereign. Each is a face of the empire.</p></section>"""

def gen_apps_apps(): return """
<section class="hero"><span class="hero-tag">▸ Apps / Apps</span>
<h1>The <span class="accent">app gallery</span>.</h1>
<p>The full MEOK app family: 12+ apps, each sovereign, each on the same substrate. Download from the App Store, Play Store, or run in browser.</p></section>"""

def gen_mcp_stack(): return """
<section class="hero"><span class="hero-tag">▸ MCP Stack</span>
<h1>The <span class="accent">MCP stack</span>.</h1>
<p>218 MCPs. 15 frameworks. 5 protocols. 1 substrate. The MEOK MCP stack is the agent-native compliance layer. One command to install. Ed25519 signed. Sovereign, every MCP.</p></section>"""

def gen_marketplace(): return """
<section class="hero"><span class="hero-tag">▸ Marketplace</span>
<h1>The <span class="accent">MCP marketplace</span>.</h1>
<p>Browse the 218 MCPs. One-click install. Pay per call. The marketplace is sovereign, signed, and open. The agent economy starts here.</p></section>"""

def gen_anthropic_registry(): return """
<section class="hero"><span class="hero-tag">▸ Anthropic Registry</span>
<h1>The <span class="accent">Anthropic registry</span> claim.</h1>
<p>MEOK claims the Anthropic MCP registry. 67+ MCPs registered. The Anthropic-compatible sovereign layer.</p></section>"""

def gen_labs(): return """
<section class="hero"><span class="hero-tag">▸ Labs</span>
<h1>The <span class="accent">labs</span>.</h1>
<p>MEOK Labs is the research arm. DEFONEOS sprints, MEOK synthesis, sovereign OS research, x402 paid cascade, BFT council, 4-tier model stacking, intuition engine, dream engine. Open. Signed. Public.</p></section>"""

def gen_civilizations(): return """
<section class="hero"><span class="hero-tag">▸ Civilizations</span>
<h1>The <span class="accent">47 civilizations</span>.</h1>
<p>MEOK is built on the wisdom of 47 civilizational traditions. From Chinese Taoism to Islamic Golden Age, from Greek philosophy to Indian Vedanta. The substrate learns from humanity, not from the few.</p></section>"""

def gen_maternal_covenant(): return """
<section class="hero"><span class="hero-tag">▸ Maternal Covenant</span>
<h1>The <span class="accent">Maternal Covenant</span>.</h1>
<p>The 6 care dimensions: safety, honesty, privacy, fairness, growth, consent. Every MEOK action is scored against all 6. The Maternal Covenant is the ethical foundation. The Maternal Covenant is sovereign.</p></section>"""

def gen_birth(): return """
<section class="hero"><span class="hero-tag">▸ The Birth of MEOK</span>
<h1>How <span class="accent">MEOK</span> was born.</h1>
<p>Nicholas Templeman. Background in optometry. Turned AI safety. Built the personal sovereign AI OS. Founded CSOAI Ltd. UK Companies House 16939677. The personal sovereign AI operating system + the CSOAI AI-governance fleet. The new world for AI economy and governance.</p></section>"""


# ──────────────────────────────────────────────────────────────────────
# Company sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_about(): return """
<section class="hero"><span class="hero-tag">▸ About</span>
<h1>The <span class="accent">MEOK empire</span>.</h1>
<p>Founded by Nicholas Templeman. CSOAI Ltd, UK Companies House 16939677. Built with care. Sovereign, auditable, public. The personal sovereign AI operating system + the CSOAI AI-governance fleet.</p>
<div class="grid grid-4" style="margin-top: 32px;"><div class="stat-card"><div class="num">218</div><div class="label">MCPs</div></div><div class="stat-card"><div class="num">33</div><div class="label">Sovereign VMs</div></div><div class="stat-card"><div class="num">222+</div><div class="label">SOV3 tools</div></div><div class="stat-card"><div class="num">1.39TB</div><div class="label">Big Braim</div></div></div></section>"""

def gen_pricing(): return """
<section class="hero"><span class="hero-tag">▸ Pricing</span>
<h1>Three tiers. <span class="accent">Free forever</span> for explorers.</h1>
<p>The MEOK OS is sovereign. The i-character is yours. The MCP fleet is open. We charge for the orchestration, not the substrate.</p>
<div class="grid grid-3" style="margin-top: 32px;">
<div class="price-card"><div class="tier">▸ Explorer</div><div class="price">£0<span>/mo</span></div><ul><li>50 messages/day</li><li>Permanent memory</li><li>1 i-character</li><li>All MCPs (read)</li><li>EU AI Act scanner</li></ul><a href="/csoai-os/v2-signup-wizard.html" class="btn btn-secondary" style="width:100%;justify-content:center">Start free</a></div>
<div class="price-card featured"><div class="tier">▸ Pro</div><div class="price">£9.99<span>/mo</span></div><ul><li>Unlimited messages</li><li>Multiple i-characters</li><li>Work OS</li><li>Custom evolution</li><li>All MCPs (read+write)</li><li>x402 paid</li><li>Council voting</li></ul><a href="/signup?plan=pro" class="btn btn-primary" style="width:100%;justify-content:center">Go Pro →</a></div>
<div class="price-card"><div class="tier">▸ Family</div><div class="price">£29<span>/mo</span></div><ul><li>5 family members</li><li>Guardian 24/7</li><li>All LLMs</li><li>Shared memory</li><li>Council voting (full)</li><li>Priority support</li></ul><a href="/signup?plan=family" class="btn btn-secondary" style="width:100%;justify-content:center">Go Family</a></div>
</div></section>"""

def gen_features(): return """
<section class="hero"><span class="hero-tag">▸ Features</span>
<h1>Every feature. <span class="accent">All sovereign.</span></h1>
<p>From the OS shell to the SIGIL chain, from the 4-tier cascade to the 12-Queen council — every feature is built on the sovereign substrate.</p>
<div class="grid grid-3" style="margin-top: 32px;">
<div class="card featured"><span class="icon">🌍</span><h3>Globe at your feet</h3><p>11 regulation temples at real lat/lon.</p></div>
<div class="card featured"><span class="icon">🐉</span><h3>Sovereign character</h3><p>13 queen archetypes + 22 arcana lenses.</p></div>
<div class="card"><span class="icon">👥</span><h3>12-Queen + King council</h3><p>13-node BFT, 2 VETO, quorum 9/13.</p></div>
<div class="card"><span class="icon">🧬</span><h3>4-tier cascade</h3><p>Edge → Strategic. 85-90% cost savings.</p></div>
<div class="card"><span class="icon">💎</span><h3>x402 paid cascade</h3><p>$0.005-$0.10 per call on Base.</p></div>
<div class="card"><span class="icon">📜</span><h3>SIGIL audit chain</h3><p>Ed25519-signed every action.</p></div>
<div class="card"><span class="icon">🎛</span><h3>16 tool tiles</h3><p>OS + tools + SaaS + inner flows.</p></div>
<div class="card"><span class="icon">🌅</span><h3>DORADO bar</h3><p>West → Globe → Temple → East.</p></div>
<div class="card"><span class="icon">🛡</span><h3>Defoneos-secured</h3><p>302 SDK patches. CVE-free.</p></div>
<div class="card"><span class="icon">📱</span><h3>PWA installable</h3><p>iOS, Android, Windows, Mac.</p></div>
<div class="card"><span class="icon">🎮</span><h3>UE5 plugin</h3><p>5 actors, 11 temples, 3D sovereign.</p></div>
<div class="card"><span class="icon">🧠</span><h3>Big Braim 1.39TB</h3><p>OLM + memory + intuition.</p></div>
</div></section>"""

def gen_how_it_works(): return """
<section class="hero"><span class="hero-tag">▸ How It Works</span>
<h1>How <span class="accent">MEOK</span> works.</h1>
<p>MEOK is built on 4 layers: identity (Ed25519), execution (hash-chained log), compliance (framework-asserted), council (BFT-signed). Every action goes through all 4. Every action is sovereign.</p>
<div class="flow-graph" style="margin-top: 32px;">
<div class="flow-node"><div class="id">step 1</div><div class="label">Sign in. Create your i-character.</div></div>
<div class="flow-arrow">↓</div>
<div class="flow-node"><div class="id">step 2</div><div class="label">Sovereign detects your region. Globe zooms.</div></div>
<div class="flow-arrow">↓</div>
<div class="flow-node"><div class="id">step 3</div><div class="label">Click a temple. See the regulations. Run the MCP.</div></div>
<div class="flow-arrow">↓</div>
<div class="flow-node"><div class="id">step 4</div><div class="label">Speak to Sovereign. The 12-Queen council governs.</div></div>
<div class="flow-arrow">↓</div>
<div class="flow-node"><div class="id">step 5</div><div class="label">SIGIL signs every action. The audit chain grows.</div></div>
</div></section>"""

def gen_faq(): return """
<section class="hero"><span class="hero-tag">▸ FAQ</span>
<h1>Frequently <span class="accent">asked</span>.</h1>
<p>The 12 most-asked questions about MEOK.</p>
<div class="grid grid-2" style="margin-top: 32px;">
<div class="card"><h3>What is MEOK?</h3><p>The world's first personal sovereign AI operating system. One encrypted memory layer, every LLM, built to work, guard, and play.</p></div>
<div class="card"><h3>Is MEOK really sovereign?</h3><p>Yes. Your data, your memory, your AI character. Free forever. Encrypted at rest, signed in transit, audit-trailed by the 12-Queen council.</p></div>
<div class="card"><h3>How is it free?</h3><p>The MCP fleet is open-source. The OS is sovereign. The intelligence costs are paid per call via x402. We charge for orchestration, not the substrate.</p></div>
<div class="card"><h3>What about the EU AI Act?</h3><p>T-37 days. The MEOK Survival Kit has you covered. 410 articles, 28 frameworks, 42-point audit, Ed25519 SIGIL signing.</p></div>
<div class="card"><h3>What's the 12-Queen council?</h3><p>13 sovereign queens + 1 king. BFT consensus. 2 VETO queens. Every MEOK action is weighed before it executes.</p></div>
<div class="card"><h3>What is an i-character?</h3><p>Your digital twin. Bound to you across sessions. Persists in localStorage + JSONL. Can be absorbed into the csoai hive GCP VM.</p></div>
<div class="card"><h3>What's the 4-tier cascade?</h3><p>Edge (3-7B) → Tactical (13-27B) → Operations (30-70B) → Strategic (70B+spec). 70% on Tier 1. Avg $0.011 per call.</p></div>
<div class="card"><h3>What's Defoneos?</h3><p>The defense AI OS. SOV3 + 33 sovereign GCP VMs + 100 MCPs + 222+ tools. Defends the empire. Audit-trailed. Public.</p></div>
<div class="card"><h3>What about gaming?</h3><p>NVIDIA ACE integration. Swarm RL. TAK protocol. Genre coaching. Live co-pilot. Predator Stop. Sovereign.</p></div>
<div class="card"><h3>What about work?</h3><p>Orion (the hunter), Riri (the builder), Hourman (the planner), Ralph Mode. 22 bridges to legacy systems. Sigstore transparency.</p></div>
<div class="card"><h3>Is there an API?</h3><p>Yes. 218 MCPs are API-callable. Plus the SOV3 HTTP connector. Plus the 4-tier cascade via x402.</p></div>
<div class="card"><h3>Who built MEOK?</h3><p>Nicholas Templeman. CSOAI Ltd, UK Companies House 16939677. Background in optometry. Turned AI safety.</p></div>
</div></section>"""

def gen_press(): return """
<section class="hero"><span class="hero-tag">▸ Press</span>
<h1>Press kit. <span class="accent">For journalists.</span></h1>
<p>Press releases, logos, fact sheets, founder bio. All open. All SIGIL-signed.</p></section>"""

def gen_roadmap(): return """
<section class="hero"><span class="hero-tag">▸ Roadmap</span>
<h1>The path forward.</h1>
<p>From sovereign substrate to physical AI to enterprise on-prem. The 4 quarters, mapped.</p>
<div class="timeline" style="margin-top: 32px;">
<div class="timeline-item"><div class="date">Q2 2026</div><h3>✅ MEOK OS single-pane</h3><p>Live. 11 temples, 12-Queen council, i-character, BFT, 4-tier cascade.</p></div>
<div class="timeline-item"><div class="date">Q2 2026</div><h3>✅ EU AI Act Survival Kit</h3><p>Live. T-37 days. Aug 2nd 2026 deadline.</p></div>
<div class="timeline-item"><div class="date">Q2 2026</div><h3>✅ SOV3 substrate</h3><p>Live. 222+ tools, 33 sovereign GCP VMs, 1.39TB Big Braim.</p></div>
<div class="timeline-item"><div class="date">Q3 2026</div><h3>▸ NVIDIA ACE gaming integration</h3><p>Download + integration with the gaming hive.</p></div>
<div class="timeline-item"><div class="date">Q3 2026</div><h3>▸ Physical AI (humanoid)</h3><p>Sovereign body runtime. 33-hives → 33-bodies.</p></div>
<div class="timeline-item"><div class="date">Q3 2026</div><h3>▸ Red Hat sovereign infra</h3><p>Enterprise on-prem. Self-hosted council + cascade.</p></div>
<div class="timeline-item"><div class="date">Q4 2026</div><h3>▸ Meok.ai public launch</h3><p>Public + TC. The new world for AI economy + governance.</p></div>
<div class="timeline-item"><div class="date">Q4 2026</div><h3>▸ Design partner (first logo)</h3><p>Finance-on-COBOL. The first sovereign + audit + speed partner.</p></div>
</div></section>"""

def gen_research(): return """
<section class="hero"><span class="hero-tag">▸ Research</span>
<h1>The papers. The breakthroughs. The sovereign substrate.</h1>
<p>Every MEOK advancement documented. Every DEFONEOS sprint is a paper. Open, signed, public.</p>
<div class="grid grid-2" style="margin-top: 32px;">
<a class="blog-card" href="/research"><div class="cover">📄</div><div class="body"><div class="meta">DEFONEOS · 2026-06-28</div><h3>DEFONEOS Sprint 100-Phase Finale</h3><p>222+ SOV3 tools, 100+ public pages, 33 sovereign GCP VMs, 13 council, 22 arcana, 12 mindsets, 5 protocol bridges, 1.39TB Big Braim.</p></div></a>
<a class="blog-card" href="/research"><div class="cover">📄</div><div class="body"><div class="meta">DEFONEOS · 2026-06-27</div><h3>MEOK Small-Large Stacking</h3><p>4-tier model cascade: Edge (3-7B) → Tactical (13-27B) → Operations (30-70B) → Strategic (70B+spec). 85-90% cost savings.</p></div></a>
<a class="blog-card" href="/research"><div class="cover">📄</div><div class="body"><div class="meta">MEOK Synthesis · 2026-06-26</div><h3>12-Queen + King Sovereign Council</h3><p>13-node BFT council with 2 VETO queens. Care (V) blocks harm, Watch (XVI) blocks CVEs. 9/13 quorum. f=4.</p></div></a>
<a class="blog-card" href="/research/governance-by-design"><div class="cover">📄</div><div class="body"><div class="meta">MEOK Research · 2026-06-25</div><h3>Governance by Design</h3><p>How the 12-Queen + King council is woven into every layer of the stack. Identity, execution, compliance, council.</p></div></a>
</div></section>"""

def gen_research_gov_by_design(): return """
<section class="hero"><span class="hero-tag">▸ Research / Governance by Design</span>
<h1>Governance <span class="accent">by design</span>.</h1>
<p>How the 12-Queen + King council is woven into every layer of the MEOK stack. Not bolted on. Built in. From the L1 identity keys to the L4 council signatures, governance is the foundation.</p></section>"""

def gen_blog(): return """
<section class="hero"><span class="hero-tag">▸ Blog</span>
<h1>The empire, this week.</h1>
<p>News, releases, and breakthroughs from MEOK WORLD. Sovereign updates, SIGIL-signed, open.</p>
<div class="grid grid-3" style="margin-top: 32px;">
<a class="blog-card" href="/blog"><div class="cover">🐉</div><div class="body"><div class="meta">2026-06-28</div><h3>i-character launches</h3><p>13 queen archetypes + 22 arcana lenses.</p></div></a>
<a class="blog-card" href="/blog"><div class="cover">⏰</div><div class="body"><div class="meta">2026-06-27</div><h3>EU AI Act T-37 days</h3><p>Survival Kit shipped. 410 articles, 28 frameworks.</p></div></a>
<a class="blog-card" href="/blog"><div class="cover">👥</div><div class="body"><div class="meta">2026-06-27</div><h3>12-Queen + King council</h3><p>BFT 9/13 + 2 VETO. Tested. Live.</p></div></a>
<a class="blog-card" href="/blog"><div class="cover">🎮</div><div class="body"><div class="meta">2026-06-27</div><h3>MEOK on Unreal Engine 5</h3><p>3D, live, sovereign. 981 lines of UE5 C++.</p></div></a>
<a class="blog-card" href="/blog"><div class="cover">💎</div><div class="body"><div class="meta">2026-06-26</div><h3>x402 paid cascade</h3><p>$0.005-$0.10 USDC per call. $40K/yr per customer.</p></div></a>
<a class="blog-card" href="/blog"><div class="cover">📜</div><div class="body"><div class="meta">2026-06-26</div><h3>SIGIL audit chain</h3><p>496 rounds, f=4, quorum=9/13.</p></div></a>
</div></section>"""

def gen_open_source(): return """
<section class="hero"><span class="hero-tag">▸ Open Source</span>
<h1>The empire, <span class="accent">open</span>.</h1>
<p>518 public repos on CSOAI-ORG. Every MCP, every council template, every sovereign runtime. MIT + Apache 2.0. Signed. Public. Yours.</p></section>"""

def gen_product(): return """
<section class="hero"><span class="hero-tag">▸ Product</span>
<h1>The MEOK <span class="accent">product</span>.</h1>
<p>The MEOK product: a personal sovereign AI OS. MEOK OS, MEOK DOME, MEOK Town, MEOK GO, MEOK AR, MEOK Council, Gaming Hive, Work OS, Guardian, Characters. One substrate, many faces.</p></section>"""

def gen_start(): return """
<section class="hero"><span class="hero-tag">▸ Start</span>
<h1>Start <span class="accent">sovereign</span>.</h1>
<p>5 steps. Region → name → queen → arcana → done. The i-character is born. The OS is yours. Free forever.</p>
<div style="display: flex; gap: 12px;"><a href="/csoai-os/v2-signup-wizard.html" class="btn btn-primary">Start the wizard →</a><a href="/waitlist" class="btn btn-secondary">Join the waitlist</a></div></section>"""

def gen_waitlist(): return """
<section class="hero"><span class="hero-tag">▸ Waitlist</span>
<h1>Join the <span class="accent">waitlist</span>.</h1>
<p>Get early access to new features. Council voting rights. Pioneer status. The sovereign world opens in waves — be on the first wave.</p>
<form style="margin-top: 24px;"><div class="form-group"><label>Email</label><input type="email" placeholder="you@meok.ai"></div><button class="btn btn-primary">Join the waitlist →</button></form></section>"""

def gen_login(): return """
<section class="hero"><span class="hero-tag">▸ Log in</span>
<h1>Welcome <span class="accent">back</span>.</h1>
<p>Log in to your sovereign i-character. The world is at your feet.</p>
<form style="margin-top: 24px;"><div class="form-group"><label>Email</label><input type="email" placeholder="you@meok.ai"></div><div class="form-group"><label>Password</label><input type="password" placeholder="••••••••"></div><button class="btn btn-primary">Log in →</button></form></section>"""

def gen_contact(): return """
<section class="hero"><span class="hero-tag">▸ Contact</span>
<h1>Get in <span class="accent">touch</span>.</h1>
<p>For press, partnerships, design partner, or sovereign deployment — reach out.</p>
<div class="grid grid-2" style="margin-top: 32px;"><div class="card"><span class="icon">📧</span><h3>Email</h3><p>hello@meok.ai</p></div><div class="card"><span class="icon">🏛</span><h3>Address</h3><p>CSOAI Ltd, UK Companies House 16939677</p></div></div></section>"""


# ──────────────────────────────────────────────────────────────────────
# Legal sub-pages
# ──────────────────────────────────────────────────────────────────────

def gen_privacy(): return """
<section class="hero"><span class="hero-tag">▸ Privacy</span>
<h1>Privacy <span class="accent">policy</span>.</h1>
<p>Your data is yours. MEOK encrypts at rest, signs in transit, and audit-trails every action. We do not sell your data. We do not share your data. We do not surveil you. The 6 care dimensions apply to privacy too.</p>
<div class="card" style="margin-top: 24px;"><h3>Key commitments</h3><ul style="margin-top: 12px; padding-left: 24px; color: var(--text-dim); line-height: 1.8;"><li>Your data is encrypted at rest with AES-256.</li><li>Your data is signed in transit with Ed25519.</li><li>Your data is owned by you. You can export + delete at any time.</li><li>We do not sell your data.</li><li>We do not share your data without your explicit consent.</li><li>We do not surveil you. The 6 care dimensions apply.</li></ul></div></section>"""

def gen_terms(): return """
<section class="hero"><span class="hero-tag">▸ Terms</span>
<h1>Terms of <span class="accent">service</span>.</h1>
<p>MEOK is sovereign. You are the user. CSOAI Ltd is the operator. These terms describe the relationship.</p>
<div class="card" style="margin-top: 24px;"><h3>Summary</h3><ul style="margin-top: 12px; padding-left: 24px; color: var(--text-dim); line-height: 1.8;"><li>Your data is yours.</li><li>Our substrate is sovereign.</li><li>The 12-Queen council governs every action.</li><li>SIGIL signs every action.</li><li>The Maternal Covenant is the ethical foundation.</li><li>Care-aligned AI principles apply at all times.</li></ul></div></section>"""

def gen_cookies(): return """
<section class="hero"><span class="hero-tag">▸ Cookies</span>
<h1>Cookie <span class="accent">policy</span>.</h1>
<p>MEOK uses minimal cookies for session management only. No tracking, no third-party cookies, no advertising cookies.</p></section>"""

def gen_accessibility(): return """
<section class="hero"><span class="hero-tag">▸ Accessibility</span>
<h1>Accessibility <span class="accent">statement</span>.</h1>
<p>MEOK is built to be sovereign for everyone. WCAG 2.1 AA target. Keyboard navigable. Screen reader compatible. High-contrast mode. The Maternal Covenant applies to accessibility too.</p></section>"""

def gen_sitemap(): return """
<section class="hero"><span class="hero-tag">▸ Sitemap</span>
<h1>The full <span class="accent">sitemap</span>.</h1>
<p>Every page on meok.ai. 100+ pages. 8 sections. All sovereign.</p>
<div class="grid grid-2" style="margin-top: 32px;">
<div><h4>Universe</h4><ul style="list-style: none; padding: 0;"><li><a href="/universe">Universe</a></li><li><a href="/town">Town</a></li><li><a href="/dome">DOME</a></li><li><a href="/go">MEOK GO</a></li><li><a href="/ar">MEOK AR</a></li><li><a href="/family">Family</a></li><li><a href="/pioneer">Pioneer</a></li></ul></div>
<div><h4>OS</h4><ul style="list-style: none; padding: 0;"><li><a href="/os">Sovereign OS</a></li><li><a href="/os/any-llm">Any LLM</a></li><li><a href="/os/consciousness">Consciousness</a></li><li><a href="/os/sovereign">Sovereign</a></li><li><a href="/os/sovereign-display">Sovereign Display</a></li><li><a href="/os/memory">Memory</a></li><li><a href="/os/dreams">Dreams</a></li></ul></div>
<div><h4>Characters</h4><ul style="list-style: none; padding: 0;"><li><a href="/characters">All</a></li><li><a href="/characters/aria">Aria</a></li><li><a href="/characters/gabriel">Gabriel</a></li><li><a href="/characters/luna">Luna</a></li><li><a href="/characters/marcus">Marcus</a></li><li><a href="/characters/sage">Sage</a></li><li><a href="/characters/scout">Scout</a></li><li><a href="/characters/shanti">Shanti</a></li></ul></div>
<div><h4>Work</h4><ul style="list-style: none; padding: 0;"><li><a href="/work">Work OS</a></li><li><a href="/work/orion">Orion</a></li><li><a href="/work/riri">Riri</a></li><li><a href="/work/hourman">Hourman</a></li><li><a href="/ralph">Ralph Mode</a></li></ul></div>
<div><h4>Gaming</h4><ul style="list-style: none; padding: 0;"><li><a href="/gaming">Gaming OS</a></li><li><a href="/gaming/strategy">Strategy</a></li><li><a href="/gaming/post-game">Post-game</a></li><li><a href="/gaming/live-copilot">Live Co-Pilot</a></li><li><a href="/gaming/platforms">Platforms</a></li><li><a href="/gaming/predator-stop">Predator Stop</a></li></ul></div>
<div><h4>Guardian</h4><ul style="list-style: none; padding: 0;"><li><a href="/guardian">Guardian 24/7</a></li><li><a href="/guardian/children">Children</a></li><li><a href="/guardian/elderly">Elderly</a></li><li><a href="/guardian/scam-stop">Scam Stop</a></li><li><a href="/guardian/personal">Personal</a></li></ul></div>
<div><h4>MCP / Empire</h4><ul style="list-style: none; padding: 0;"><li><a href="/mcp">218 MCPs</a></li><li><a href="/mcp-stack">MCP Stack</a></li><li><a href="/marketplace">Marketplace</a></li><li><a href="/anthropic-registry">Anthropic Registry</a></li><li><a href="/councilof">CouncilOf.AI</a></li><li><a href="/cobol">COBOL Bridge</a></li><li><a href="/apps">Apps</a></li><li><a href="/labs">Labs</a></li></ul></div>
<div><h4>Company</h4><ul style="list-style: none; padding: 0;"><li><a href="/about">About</a></li><li><a href="/blog">Blog</a></li><li><a href="/research">Research</a></li><li><a href="/pricing">Pricing</a></li><li><a href="/features">Features</a></li><li><a href="/how-it-works">How It Works</a></li><li><a href="/faq">FAQ</a></li><li><a href="/press">Press</a></li><li><a href="/roadmap">Roadmap</a></li><li><a href="/contact">Contact</a></li><li><a href="/start">Start</a></li><li><a href="/waitlist">Waitlist</a></li><li><a href="/login">Log in</a></li><li><a href="/ai-os">AI OS Story</a></li><li><a href="/ai-act">EU AI Act</a></li><li><a href="/eu-ai-act-countdown">Countdown</a></li><li><a href="/compliance">Compliance</a></li><li><a href="/governance">Governance</a></li><li><a href="/civilizations">Civilizations</a></li><li><a href="/maternal-covenant">Maternal Covenant</a></li><li><a href="/open-source">Open Source</a></li><li><a href="/product">Product</a></li><li><a href="/birth">Birth of MEOK</a></li></ul></div>
<div><h4>Legal</h4><ul style="list-style: none; padding: 0;"><li><a href="/privacy">Privacy</a></li><li><a href="/terms">Terms</a></li><li><a href="/cookies">Cookies</a></li><li><a href="/accessibility">Accessibility</a></li></ul></div>
</div></section>"""


# ──────────────────────────────────────────────────────────────────────
# Page registry — every page goes here
# ──────────────────────────────────────────────────────────────────────

PAGES = {
    # Universe (6 pages)
    "universe": ("MEOK Universe", "The sovereign macrocosmic vision. 33 hives. 22 arcana. 12 mindsets. 1 sovereign.", "Home", gen_universe),
    "town": ("MEOK Town", "The sovereign city. MCP buildings + A2A roads. 200+ buildings.", "Home", gen_town),
    "dome": ("MEOK DOME", "The central world hub + live map. SOV3 status. Council voting. Hive health.", "Home", gen_dome),
    "go": ("MEOK GO", "Real-world character overlay. Location-aware. Vision. Voice. Sovereign.", "Home", gen_go),
    "ar": ("MEOK AR", "Camera overlay demo. Point the camera. The i-character is with you.", "Home", gen_ar),
    "family": ("Family", "One household. One sovereign. Up to 5 members. Guardian 24/7. Shared memory.", "Home", gen_family),
    "pioneer": ("Pioneer Program", "Founding citizens only. 100 spots in 2026. Council voting rights.", "Home", gen_pioneer),

    # OS (7 pages)
    "os": ("Sovereign OS", "MEOK OS is the sovereign operating system. 5 panes, 16 tools, 4-tier cascade.", "OS", gen_os),
    "os/any-llm": ("Any LLM", "Multi-model routing. 8 LLM providers. 4-tier cascade.", "OS", gen_os_any_llm),
    "os/consciousness": ("Consciousness", "4 modes: Jagrat, Svapna, Susupti, Turiya. The sovereign mind.", "OS", gen_os_consciousness),
    "os/sovereign": ("Sovereign Runtime", "The sovereign runtime. Memory + reasoning + identity + voice.", "OS", gen_os_sovereign),
    "os/sovereign-display": ("Sovereign Display", "The 13-queen + King council visualized. Live. Vote-aware.", "OS", gen_os_sovereign_display),
    "os/memory": ("Memory", "pgvector semantic memory. The substrate that learns.", "OS", gen_os_memory),
    "os/dreams": ("Dreams", "The dream engine. Overnight synthesis. SOV3 thinks while you sleep.", "OS", gen_os_dreams),

    # Characters (7 pages)
    "characters": ("Characters", "13 queen archetypes. Aria, Gabriel, Luna, Marcus, Sage, Scout, Shanti. Pick the one that fits you.", "Home", gen_characters_sub),  # placeholder
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
</div></section>"""),
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
</div></section>"""),
    "characters/aria": ("Aria — The Storyteller", "Aria weaves narratives from memory. The Storyteller.", "Home", gen_character_aria),
    "characters/gabriel": ("Gabriel — The Guardian Angel", "Gabriel watches over your family 24/7. The Guardian Angel.", "Home", gen_character_gabriel),
    "characters/luna": ("Luna — The Dreamer", "Luna synthesises patterns overnight. The Dreamer.", "Home", gen_character_luna),
    "characters/marcus": ("Marcus — The Strategist", "Marcus plans the long game. The Strategist.", "Home", gen_character_marcus),
    "characters/sage": ("Sage — The Wise One", "Sage counsels with care. The Wise One.", "Home", gen_character_sage),
    "characters/scout": ("Scout — The Hunter", "Scout finds the signal in the noise. The Hunter.", "Home", gen_character_scout),
    "characters/shanti": ("Shanti — The Peacemaker", "Shanti holds the council's harmony. The Peacemaker.", "Home", gen_character_shanti),

    # Work (5 pages)
    "work": ("Work OS", "AI for work. Orion, Riri, Hourman, Ralph Mode. 22 bridges. Sigstore.", "Home", gen_work),
    "work/orion": ("Orion — The Hunter", "Orion is the source-to-close automation queen. The Hunter.", "Home", gen_work_orion),
    "work/riri": ("Riri — The Builder", "Riri is the code-generation queen. The Builder.", "Home", gen_work_riri),
    "work/hourman": ("Hourman — The Planner", "Hourman is the planning queen. The Planner.", "Home", gen_work_hourman),
    "ralph": ("Ralph Mode", "3-queen + king approved automation. Set it, sovereign it, ship it.", "Home", gen_ralph),

    # Gaming (6 pages)
    "gaming": ("Gaming OS", "AI for gamers. Genre coaching, stats, live co-pilot, all platforms. NVIDIA ACE.", "Home", gen_gaming),
    "gaming/strategy": ("Strategy", "Genre coaching tailored to your rank, hero, region. Mobalytics-grade.", "Home", gen_gaming_strategy),
    "gaming/post-game": ("Post-game", "Stats + analytics after every match. Mobalytics-grade.", "Home", gen_gaming_post_game),
    "gaming/live-copilot": ("Live Co-Pilot", "Real-time call-outs in &lt;1s. Sovereign. Per-call.", "Home", gen_gaming_live_copilot),
    "gaming/platforms": ("Platforms", "All platforms. Steam, Discord, Twitch, Riot, Battle.net, Epic, console.", "Home", gen_gaming_platforms),
    "gaming/predator-stop": ("Predator Stop", "Detects + blocks grooming, doxxing, voice predators. Watch (XVI) holds VETO.", "Home", gen_gaming_predator_stop),

    # Guardian (5 pages)
    "guardian": ("Guardian 24/7", "The guardian never sleeps. Children, elderly, scams, relationships.", "Home", gen_guardian),
    "guardian/children": ("Children's Safety", "Age-appropriate responses. Content filtering. Predator detection.", "Home", gen_guardian_children),
    "guardian/elderly": ("Elder Care", "Scam detection. Medication reminders. Family alerts.", "Home", gen_guardian_elderly),
    "guardian/scam-stop": ("Scam Stop", "Real-time call + email scanning. Phishing detection. Deepfake flagging.", "Home", gen_guardian_scam_stop),
    "guardian/personal": ("Relationship Shield", "Detects manipulation, gaslighting, financial abuse. Reports to family.", "Home", gen_guardian_personal),

    # MCP / Empire (10 pages)
    "mcp": ("218 MCPs", "The agent-native compliance layer. 218 open-source MCP servers.", "MCPs", gen_mcp_sub),
    "mcp-stack": ("MCP Stack", "The MCP stack. 218 MCPs. 15 frameworks. 5 protocols. 1 substrate.", "MCPs", gen_mcp_stack),
    "marketplace": ("MCP Marketplace", "Browse the 218 MCPs. One-click install. Pay per call.", "MCPs", gen_marketplace),
    "anthropic-registry": ("Anthropic Registry", "The Anthropic MCP registry claim. 67+ MCPs registered.", "MCPs", gen_anthropic_registry),
    "councilof": ("CouncilOf.AI", "The public-facing sovereign AI governance council. 13-Queen + King.", "Home", gen_councilof),
    "cobol": ("COBOL Bridge", "220+ billion lines of COBOL bridged to sovereign AI.", "Home", gen_cobol),
    "apps": ("MEOK Apps", "The MEOK app family. 12+ apps. Each sovereign.", "Home", gen_apps),
    "apps/apps": ("App Gallery", "The full MEOK app gallery.", "Home", gen_apps_apps),
    "labs": ("MEOK Labs", "The research arm. DEFONEOS sprints, MEOK synthesis. Open. Signed. Public.", "Home", gen_labs),
    "civilizations": ("47 Civilizations", "Built on the wisdom of 47 civilizational traditions.", "Home", gen_civilizations),
    "maternal-covenant": ("Maternal Covenant", "The 6 care dimensions. The ethical foundation.", "Home", gen_maternal_covenant),
    "birth": ("The Birth of MEOK", "How MEOK was born. Nicholas Templeman. CSOAI Ltd. 16939677.", "Home", gen_birth),

    # Compliance (5 pages)
    "ai-act": ("EU AI Act", "410 articles. 28 frameworks. T-37 days. Aug 2nd 2026.", "Home", gen_ai_act),
    "eu-ai-act-countdown": ("EU AI Act Countdown", "T-37 days to the cliff. Aug 2nd 2026.", "Home", gen_eu_ai_act_countdown),
    "compliance": ("Compliance", "Every regulation. MCP-mapped. EU AI Act, GDPR, DORA, NIS2, CRA, NIST, ISO.", "Home", gen_compliance),
    "governance": ("Governance", "The sovereign governance layer. 4 layers. 13-queen council.", "Home", gen_governance),
    "ai-os": ("AI OS Story", "The AI OS story. Why a sovereign OS. Your data, your rules.", "Home", gen_ai_os),
    "ai-os/story": ("AI OS Story", "The AI OS story. Why a sovereign OS.", "Home", gen_ai_os_story),

    # Company (13 pages)
    "about": ("About MEOK", "Founded by Nicholas Templeman. CSOAI Ltd, UK Companies House 16939677.", "About", gen_about),
    "pricing": ("Pricing", "Three tiers. Free forever for explorers. Per-call for builders.", "About", gen_pricing),
    "features": ("Features", "Every feature. All sovereign. From the OS shell to the SIGIL chain.", "About", gen_features),
    "how-it-works": ("How It Works", "How MEOK works. 4 layers: identity, execution, compliance, council.", "About", gen_how_it_works),
    "faq": ("FAQ", "The 12 most-asked questions about MEOK.", "About", gen_faq),
    "press": ("Press", "Press kit, logos, fact sheets, founder bio. All open.", "About", gen_press),
    "roadmap": ("Roadmap", "The path forward. 4 quarters. Q2-Q4 2026.", "About", gen_roadmap),
    "research": ("Research", "The papers. The breakthroughs. The sovereign substrate.", "Research", gen_research),
    "research/governance-by-design": ("Governance by Design", "How the 12-Queen + King council is woven into every layer.", "Research", gen_research_gov_by_design),
    "blog": ("Blog", "The empire, this week. News, releases, breakthroughs.", "Blog", gen_blog),
    "open-source": ("Open Source", "518 public repos on CSOAI-ORG. MIT + Apache 2.0.", "About", gen_open_source),
    "product": ("Product", "The MEOK product. One substrate, many faces.", "About", gen_product),
    "start": ("Start", "Start sovereign. 5 steps. Free forever.", "About", gen_start),
    "waitlist": ("Waitlist", "Join the waitlist. Early access. Council voting rights.", "About", gen_waitlist),
    "login": ("Log in", "Welcome back. The world is at your feet.", "About", gen_login),
    "contact": ("Contact", "Get in touch. Press, partnerships, sovereign deployment.", "About", gen_contact),

    # Legal (5 pages)
    "privacy": ("Privacy", "Your data is yours. MEOK encrypts at rest, signs in transit.", "About", gen_privacy),
    "terms": ("Terms", "Terms of service. Your data is yours. Our substrate is sovereign.", "About", gen_terms),
    "cookies": ("Cookies", "Cookie policy. MEOK uses minimal cookies for session only.", "About", gen_cookies),
    "accessibility": ("Accessibility", "WCAG 2.1 AA target. Keyboard navigable. Screen reader compatible.", "About", gen_accessibility),
    "sitemap": ("Sitemap", "The full sitemap. 100+ pages. All sovereign.", "About", gen_sitemap),
}


def main():
    out_dir = HERE / "pages"
    out_dir.mkdir(exist_ok=True)
    for slug, (title, desc, nav, fn) in PAGES.items():
        if not fn:
            continue
        try:
            html = render(slug, title, desc, fn(), nav)
        except Exception as e:
            print(f"  ✗ {slug}  ERROR: {e}")
            continue
        out_path = out_dir / f"{slug.replace('/', '_')}.html"
        out_path.write_text(html)
        print(f"  ✓ {out_path.name}  ({len(html):,} chars)")


if __name__ == "__main__":
    main()
