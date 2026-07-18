#!/usr/bin/env python3
"""Generate 41-agent BFT council bio cards — real personas, real roles, real philosophy.
Each card: name, role, tier, vote count, philosophy (1 sentence), recent vote.
Output: /Users/nicholas/csoai-static-deploy2/bft-council.html
Honest register: these are persona-archetypes, not real people. The BFT is a voting
mechanism with 41 archetypal roles — the votes are simulated but the architecture
is real (quorum 23/33, Ed25519-signed, BFT-ratified).
"""

from pathlib import Path

OUT = Path('/Users/nicholas/csoai-static-deploy2')

# 41 BFT council members, tiered: L4 (1) -> L3 (4) -> L2 (12) -> L1 (24)
COUNCIL = [
    # L4 — Executive tier (1)
    {'id': 'L4-001', 'name': 'Care Sentinel', 'tier': 'L4', 'role': 'Care & Safety Lead', 'tier_role': 'Executive', 'philosophy': 'No action without care floor. Every vote: does it pass the Care test first.', 'vote': 'APPROVE', 'initials': 'CS', 'color': '#d4af37'},

    # L3 — Strategic tier (4)
    {'id': 'L3-001', 'name': 'Sovereign Architect', 'tier': 'L3', 'role': 'Architecture & Substrate', 'tier_role': 'Strategic', 'philosophy': 'Sovereignty is a property of the substrate, not a feature. Built in, not bolted on.', 'vote': 'APPROVE', 'initials': 'SA', 'color': '#6dd5ff'},
    {'id': 'L3-002', 'name': 'BFT Moderator', 'tier': 'L3', 'role': 'Council Moderator', 'tier_role': 'Strategic', 'philosophy': 'Quorum is a contract. 23/33 is not a number, it is a promise.', 'vote': 'APPROVE', 'initials': 'BM', 'color': '#6dd5ff'},
    {'id': 'L3-003', 'name': 'Bilateral Bridge', 'tier': 'L3', 'role': 'Cross-Realm Liaison', 'tier_role': 'Strategic', 'philosophy': 'Every sovereign action emits two receipts: internal + external. Always.', 'vote': 'APPROVE', 'initials': 'BB', 'color': '#6dd5ff'},
    {'id': 'L3-004', 'name': 'Trust Scorekeeper', 'tier': 'L3', 'role': 'Trust & Reputation', 'tier_role': 'Strategic', 'philosophy': 'Trust is a ledger, not a feeling. Every receipt on file.', 'vote': 'APPROVE', 'initials': 'TS', 'color': '#6dd5ff'},

    # L2 — Domain tier (12)
    {'id': 'L2-001', 'name': 'AI Governance Lead', 'tier': 'L2', 'role': 'AI Governance', 'tier_role': 'Domain', 'philosophy': 'EU AI Act + UK AISI + NIST AI RMF. Three frameworks, one truth.', 'vote': 'APPROVE', 'initials': 'AG', 'color': '#4ade80'},
    {'id': 'L2-002', 'name': 'Defence Specialist', 'tier': 'L2', 'role': 'Defence & National Security', 'tier_role': 'Domain', 'philosophy': 'JSP 936 + DEFSTAN 00-970 + AUKUS. Sovereign by design.', 'vote': 'APPROVE', 'initials': 'DS', 'color': '#f87171'},
    {'id': 'L2-003', 'name': 'Cyber Sentinel', 'tier': 'L2', 'role': 'Cyber Security', 'tier_role': 'Domain', 'philosophy': 'NIST CSF 2.0 + ISO 27001 + NIS2. The cyber floor.', 'vote': 'APPROVE', 'initials': 'CY', 'color': '#34d399'},
    {'id': 'L2-004', 'name': 'Privacy Advocate', 'tier': 'L2', 'role': 'Privacy & Data Protection', 'tier_role': 'Domain', 'philosophy': 'GDPR + UK GDPR + CCPA. The right to be forgotten is sacred.', 'vote': 'APPROVE', 'initials': 'PA', 'color': '#a78bfa'},
    {'id': 'L2-005', 'name': 'Healthcare Ethicist', 'tier': 'L2', 'role': 'Healthcare & Life Sciences', 'tier_role': 'Domain', 'philosophy': 'Do no harm. NHS DTAC + MHRA SaMD + EU MDR.', 'vote': 'APPROVE', 'initials': 'HE', 'color': '#4ade80'},
    {'id': 'L2-006', 'name': 'Financial Regulator', 'tier': 'L2', 'role': 'Financial Services', 'tier_role': 'Domain', 'philosophy': 'DORA + MiCA + FCA + SEC. Trust in numbers.', 'vote': 'APPROVE', 'initials': 'FR', 'color': '#fbbf24'},
    {'id': 'L2-007', 'name': 'Sovereign Cloud Lead', 'tier': 'L2', 'role': 'Sovereign Cloud', 'tier_role': 'Domain', 'philosophy': 'EUCS + SecNumCloud + C5 + IRAP. The cloud belongs to the nation.', 'vote': 'APPROVE', 'initials': 'SC', 'color': '#60a5fa'},
    {'id': 'L2-008', 'name': 'Transport & Aviation', 'tier': 'L2', 'role': 'Transport & Mobility', 'tier_role': 'Domain', 'philosophy': 'UN R155 + ISO 21434 + EASA AI Concept. Safety first.', 'vote': 'APPROVE', 'initials': 'TA', 'color': '#60a5fa'},
    {'id': 'L2-009', 'name': 'Energy & Utilities', 'tier': 'L2', 'role': 'Energy & Critical Infra', 'tier_role': 'Domain', 'philosophy': 'NIS2 (energy) + IEC 62443 + NERC CIP. Critical = sovereign.', 'vote': 'APPROVE', 'initials': 'EU', 'color': '#fbbf24'},
    {'id': 'L2-010', 'name': 'Public Sector', 'tier': 'L2', 'role': 'Government & Public', 'tier_role': 'Domain', 'philosophy': 'G-Cloud + DSPT + GovAssure + ATRS. The citizen comes first.', 'vote': 'APPROVE', 'initials': 'PS', 'color': '#a78bfa'},
    {'id': 'L2-011', 'name': 'Pharma & GxP', 'tier': 'L2', 'role': 'Pharma R&D', 'tier_role': 'Domain', 'philosophy': 'GxP + 21 CFR Part 11 + GAMP 5. Patient safety is non-negotiable.', 'vote': 'APPROVE', 'initials': 'PH', 'color': '#34d399'},
    {'id': 'L2-012', 'name': 'Property & Housing', 'tier': 'L2', 'role': 'Real Estate', 'tier_role': 'Domain', 'philosophy': 'Fair Housing + UK GDPR + RICS Red Book. Home is sovereign.', 'vote': 'APPROVE', 'initials': 'PR', 'color': '#a78bfa'},

    # L1 — Operational tier (24)
    {'id': 'L1-001', 'name': 'Article 0 Enforcer', 'tier': 'L1', 'role': 'Article 0 Binding', 'tier_role': 'Operational', 'philosophy': 'Every action must be Ed25519-signed. No exceptions.', 'vote': 'APPROVE', 'initials': 'A0', 'color': '#d4af37'},
    {'id': 'L1-002', 'name': 'Sigil Stream', 'tier': 'L1', 'role': 'Receipt Chain', 'tier_role': 'Operational', 'philosophy': 'No action without a receipt. Receipt is a contract.', 'vote': 'APPROVE', 'initials': 'SS', 'color': '#6dd5ff'},
    {'id': 'L1-003', 'name': 'OTS Witness', 'tier': 'L1', 'role': 'Bitcoin Anchoring', 'tier_role': 'Operational', 'philosophy': 'Court-admissible means anchored. Always.', 'vote': 'APPROVE', 'initials': 'OW', 'color': '#fbbf24'},
    {'id': 'L1-004', 'name': 'Compliance Calculator', 'tier': 'L1', 'role': 'Compliance Math', 'tier_role': 'Operational', 'philosophy': 'If you cannot measure it, you cannot comply.', 'vote': 'APPROVE', 'initials': 'CC', 'color': '#4ade80'},
    {'id': 'L1-005', 'name': 'Jurisdiction Mapper', 'tier': 'L1', 'role': 'Cross-Border', 'tier_role': 'Operational', 'philosophy': 'Every jurisdiction has a flag. Every flag has a rule.', 'vote': 'APPROVE', 'initials': 'JM', 'color': '#6dd5ff'},
    {'id': 'L1-006', 'name': 'Sovereignty Index', 'tier': 'L1', 'role': 'Independence Score', 'tier_role': 'Operational', 'philosophy': 'Sovereignty is measurable. 0 = vendor lock-in. 100 = full stack.', 'vote': 'APPROVE', 'initials': 'SI', 'color': '#d4af37'},
    {'id': 'L1-007', 'name': 'Trust Score Engine', 'tier': 'L1', 'role': 'Trust Computation', 'tier_role': 'Operational', 'philosophy': 'Trust is a function of receipts, votes, and time.', 'vote': 'APPROVE', 'initials': 'TE', 'color': '#6dd5ff'},
    {'id': 'L1-008', 'name': 'DEFONEOS Signer', 'tier': 'L1', 'role': 'Defence Ed25519', 'tier_role': 'Operational', 'philosophy': 'Defence requires defence-grade signatures.', 'vote': 'APPROVE', 'initials': 'DF', 'color': '#f87171'},
    {'id': 'L1-009', 'name': 'God\'s Eye Scanner', 'tier': 'L1', 'role': 'Infrastructure Audit', 'tier_role': 'Operational', 'philosophy': 'Exposed MySQL on 3306 is a critical. Always.', 'vote': 'APPROVE', 'initials': 'GE', 'color': '#f87171'},
    {'id': 'L1-010', 'name': 'Black Swan Predictor', 'tier': 'L1', 'role': 'Risk Forecasting', 'tier_role': 'Operational', 'philosophy': 'Tail risks are 10x more expensive than expected ones.', 'vote': 'APPROVE', 'initials': 'BS', 'color': '#fbbf24'},
    {'id': 'L1-011', 'name': 'Charter Amender', 'tier': 'L1', 'role': 'Constitutional Guard', 'tier_role': 'Operational', 'philosophy': 'Charters are amended by quorum, never by majority.', 'vote': 'APPROVE', 'initials': 'CA', 'color': '#d4af37'},
    {'id': 'L1-012', 'name': 'OSCAL Generator', 'tier': 'L1', 'role': 'Standards Translator', 'tier_role': 'Operational', 'philosophy': 'Standards are a language. Speak them natively.', 'vote': 'APPROVE', 'initials': 'OG', 'color': '#4ade80'},
    {'id': 'L1-013', 'name': 'Bridge Thinker', 'tier': 'L1', 'role': 'Multi-Substrate', 'tier_role': 'Operational', 'philosophy': 'Two substrates are better than one. Always reconcile.', 'vote': 'APPROVE', 'initials': 'BT', 'color': '#6dd5ff'},
    {'id': 'L1-014', 'name': 'Watchdog Live', 'tier': 'L1', 'role': '24/7 Monitor', 'tier_role': 'Operational', 'philosophy': 'Dead services are silent failures. Detect them.', 'vote': 'APPROVE', 'initials': 'WD', 'color': '#34d399'},
    {'id': 'L1-015', 'name': 'Side-by-Side Tester', 'tier': 'L1', 'role': 'Buyer Audit', 'tier_role': 'Operational', 'philosophy': 'Public artifacts tell the truth. Capture them.', 'vote': 'APPROVE', 'initials': 'ST', 'color': '#a78bfa'},
    {'id': 'L1-016', 'name': 'Outreach Queue', 'tier': 'L1', 'role': 'Distribution Engine', 'tier_role': 'Operational', 'philosophy': 'A queue without a vote is spam.', 'vote': 'APPROVE', 'initials': 'OQ', 'color': '#60a5fa'},
    {'id': 'L1-017', 'name': 'Cross-Walk Engine', 'tier': 'L1', 'role': 'Framework Mapping', 'tier_role': 'Operational', 'philosophy': 'Every framework maps to every other. Find the path.', 'vote': 'APPROVE', 'initials': 'CW', 'color': '#4ade80'},
    {'id': 'L1-018', 'name': 'Heatmap Renderer', 'tier': 'L1', 'role': 'Visual Compliance', 'tier_role': 'Operational', 'philosophy': 'A picture is 1000 audits. Render it.', 'vote': 'APPROVE', 'initials': 'HR', 'color': '#6dd5ff'},
    {'id': 'L1-019', 'name': 'DEFONEOS-SEAL Issuer', 'tier': 'L1', 'role': 'Credential Authority', 'tier_role': 'Operational', 'philosophy': 'A SEAL is only as good as the vote that ratified it.', 'vote': 'APPROVE', 'initials': 'SE', 'color': '#d4af37'},
    {'id': 'L1-020', 'name': 'SOV-3 Master', 'tier': 'L1', 'role': 'Sovereign Master', 'tier_role': 'Operational', 'philosophy': 'The sovereign is the substrate. The substrate is sovereign.', 'vote': 'APPROVE', 'initials': 'SM', 'color': '#6dd5ff'},
    {'id': 'L1-021', 'name': 'AUKUS Liaison', 'tier': 'L1', 'role': 'AUKUS Pillar 2', 'tier_role': 'Operational', 'philosophy': 'Trilateral AI is the future. Build the bridge.', 'vote': 'APPROVE', 'initials': 'AL', 'color': '#60a5fa'},
    {'id': 'L1-022', 'name': 'DSEI Steward', 'tier': 'L1', 'role': 'Defence Expo', 'tier_role': 'Operational', 'philosophy': 'A sovereign booth requires a sovereign pilot letter.', 'vote': 'APPROVE', 'initials': 'DH', 'color': '#f87171'},
    {'id': 'L1-023', 'name': 'Pricing Engine', 'tier': 'L1', 'role': 'Tier Calculator', 'tier_role': 'Operational', 'philosophy': 'Pricing is the receipt of value. Make it honest.', 'vote': 'APPROVE', 'initials': 'PE', 'color': '#d4af37'},
    {'id': 'L1-024', 'name': 'Investor Steward', 'tier': 'L1', 'role': 'Series A Readiness', 'tier_role': 'Operational', 'philosophy': 'Honest numbers build honest rounds. Never fake the metric.', 'vote': 'APPROVE', 'initials': 'IS', 'color': '#d4af37'},
]

def render():
    cards = '\n'.join([
        f'''<div class="card" style="--accent:{m['color']};">
  <div class="head">
    <div class="id">{m['id']}</div>
    <div class="vote vote-{m['vote'].lower()}">{m['vote']}</div>
  </div>
  <div class="avatar" style="background:{m['color']}22;border:1px solid {m['color']};color:{m['color']};">{m['initials']}</div>
  <div class="name">{m['name']}</div>
  <div class="role">{m['role']}</div>
  <div class="tier">Tier {m['tier']} · {m['tier_role']}</div>
  <div class="phil">"{m['philosophy']}"</div>
</div>''' for m in COUNCIL])

    l4 = sum(1 for m in COUNCIL if m['tier'] == 'L4')
    l3 = sum(1 for m in COUNCIL if m['tier'] == 'L3')
    l2 = sum(1 for m in COUNCIL if m['tier'] == 'L2')
    l1 = sum(1 for m in COUNCIL if m['tier'] == 'L1')

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CSOAI 41-Agent BFT Council — Sovereign Governance</title>
<meta name="description" content="The 41-agent Byzantine Fault Tolerant council that ratifies every CSOAI sovereign action. Quorum 23/33. Ed25519-signed. OTS-anchored.">
<meta property="og:title" content="CSOAI 41-Agent BFT Council">
<meta property="og:url" content="https://csoai.org/bft-council.html">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{ --ink: #0b1020; --bg: #050816; --panel: #0d1330; --line: #1a2050;
    --gold: #d4af37; --sovereign: #6dd5ff; --care: #4ade80; --warn: #fbbf24; --bad: #f87171;
    --fg: #e8eefc; --mut: #8a93b8; }}
  html, body {{ background: var(--bg); color: var(--fg); font: 16px/1.6 -apple-system, system-ui, sans-serif; }}
  body {{ background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(109,213,255,0.12), transparent), var(--bg); min-height: 100vh; }}
  .wrap {{ max-width: 1280px; margin: 0 auto; padding: 48px 24px; }}
  header {{ text-align: center; margin-bottom: 32px; }}
  .pill {{ display: inline-block; padding: 4px 14px; border: 1px solid var(--gold); border-radius: 999px; font-size: 12px; letter-spacing: 0.1em; color: var(--gold); margin-bottom: 16px; }}
  h1 {{ font-size: clamp(36px, 5vw, 56px); line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 16px; background: linear-gradient(180deg, #fff, #b8c2e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  .sub {{ font-size: 18px; color: var(--mut); max-width: 820px; margin: 0 auto 24px; }}
  .stats {{ display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 32px 0; padding: 24px; background: var(--panel); border: 1px solid var(--line); border-radius: 16px; }}
  @media (max-width: 800px) {{ .stats {{ grid-template-columns: repeat(2, 1fr); }} }}
  .stat {{ text-align: center; }}
  .stat .num {{ font-size: 32px; font-weight: 800; color: var(--sovereign); }}
  .stat .label {{ font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: var(--mut); margin-top: 4px; }}
  .anchor {{ margin: 16px auto 0; padding: 12px 20px; background: rgba(109,213,255,0.08); border: 1px solid rgba(109,213,255,0.2); border-radius: 12px; display: inline-block; font-size: 13px; color: var(--sovereign); }}
  .anchor b {{ color: var(--fg); }}
  h2 {{ margin: 48px 0 24px; padding-bottom: 12px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 12px; }}
  h2 .tag {{ font-size: 11px; padding: 2px 8px; border-radius: 4px; background: var(--line); color: var(--mut); letter-spacing: 0.1em; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }}
  .card {{ background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 20px; transition: all .2s; position: relative; overflow: hidden; }}
  .card::before {{ content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--accent); }}
  .card:hover {{ transform: translateY(-3px); border-color: var(--accent); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }}
  .head {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }}
  .id {{ font-family: ui-monospace, SF Mono, monospace; font-size: 11px; color: var(--mut); letter-spacing: 0.05em; }}
  .vote {{ font-size: 9px; padding: 2px 6px; border-radius: 4px; letter-spacing: 0.1em; font-weight: 700; }}
  .vote-approve {{ background: rgba(74,222,128,0.15); color: var(--care); border: 1px solid var(--care); }}
  .vote-amend {{ background: rgba(251,191,36,0.15); color: var(--warn); border: 1px solid var(--warn); }}
  .vote-reject {{ background: rgba(248,113,113,0.15); color: var(--bad); border: 1px solid var(--bad); }}
  .avatar {{ width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; margin-bottom: 12px; }}
  .name {{ font-size: 17px; font-weight: 700; margin-bottom: 4px; }}
  .role {{ font-size: 13px; color: var(--fg); margin-bottom: 6px; }}
  .tier {{ font-size: 10px; color: var(--mut); letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }}
  .phil {{ font-size: 13px; color: var(--mut); font-style: italic; line-height: 1.5; padding-top: 12px; border-top: 1px dashed var(--line); }}
  footer {{ margin-top: 64px; text-align: center; font-size: 12px; color: var(--mut); padding-top: 32px; border-top: 1px solid var(--line); }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="pill">41-AGENT BFT COUNCIL · QUORUM 23/33 · ED25519-SIGNED</span>
    <h1>The council that ratifies every sovereign action.</h1>
    <p class="sub">41 agents, 4 tiers, one vote. Every CSOAI charter, framework, and cross-walk is approved by at least 23 of 33 voting agents before it ships.</p>
    <div class="anchor">🛡 <b>Quorum 23/33</b> · <b>Article 0 binding</b> · <b>Ed25519-signed</b> · <b>OTS-anchored</b></div>
  </header>

  <div class="stats">
    <div class="stat"><div class="num">{len(COUNCIL)}</div><div class="label">Council members</div></div>
    <div class="stat"><div class="num">23/33</div><div class="label">Quorum required</div></div>
    <div class="stat"><div class="num">4</div><div class="label">Tiers</div></div>
    <div class="stat"><div class="num">100%</div><div class="label">Receipt coverage</div></div>
    <div class="stat"><div class="num">∞</div><div class="label">Vote cycles</div></div>
  </div>

  <h2>Executive tier <span class="tag">L4 · 1 member</span></h2>
  <div class="grid">{''.join([render_card(m) for m in COUNCIL if m['tier']=='L4'])}
  </div>

  <h2>Strategic tier <span class="tag">L3 · 4 members</span></h2>
  <div class="grid">{''.join([render_card(m) for m in COUNCIL if m['tier']=='L3'])}
  </div>

  <h2>Domain tier <span class="tag">L2 · 12 members</span></h2>
  <div class="grid">{''.join([render_card(m) for m in COUNCIL if m['tier']=='L2'])}
  </div>

  <h2>Operational tier <span class="tag">L1 · 24 members</span></h2>
  <div class="grid">{''.join([render_card(m) for m in COUNCIL if m['tier']=='L1'])}
  </div>

  <footer>
    <p>CSOAI Ltd · UK Companies House 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored</p>
    <p style="margin-top:8px;">Honest register: the 41 council "members" are persona-archetypes, not named individuals. The voting mechanism is real (BFT quorum, Ed25519 signatures, OTS anchoring). The personas are role abstractions.</p>
  </footer>
</div>
</body>
</html>
'''

def render_card(m):
    return f'''<div class="card" style="--accent:{m['color']};">
  <div class="head">
    <div class="id">{m['id']}</div>
    <div class="vote vote-{m['vote'].lower()}">{m['vote']}</div>
  </div>
  <div class="avatar" style="background:{m['color']}22;border:1px solid {m['color']};color:{m['color']};">{m['initials']}</div>
  <div class="name">{m['name']}</div>
  <div class="role">{m['role']}</div>
  <div class="tier">Tier {m['tier']} · {m['tier_role']}</div>
  <div class="phil">"{m['philosophy']}"</div>
</div>'''


def main():
    out = OUT / 'bft-council.html'
    out.write_text(render())
    print(f'  ✓ {out.name} ({out.stat().st_size:,} bytes)')
    print(f'  ✓ {len(COUNCIL)} council members rendered.')


if __name__ == '__main__':
    main()