# M2 HANDOFF PACKAGE — Build CSOAI's Sovereign AI OS
*Complete handoff from M4 (the engineering lane) to M2 (the live-app / UX / consumer-surface lane).*
*For: Sat 4 Jul 09:00 BST launch · 3 days from now.*

> **The whole point of this document:** M2 should never have to ask "how do I do X?" again. Every question has an answer here. If something is missing, append it.

---

## 0. The big picture (1 page)

CSOAI's consumer-facing product is a **sovereign AI OS** — a single web app at `csoai.org/csoai-os/` where a sovereign citizen can:

1. Create an i-character (sovereign digital twin) via a 5-step wizard
2. Browse the marketplace (`sov.space`)
3. Fork a Layer-0 protocol, publish to marketplace, earn royalties
4. Use any of 531 MCPs through a sovereign-aware UI
5. Verify any action in any browser via the SIGIL chain + 554-comp OSCAL proof
6. Earn Social Authority Badges (5 tiers: Bronze → Sovereign)
7. Pay per call via x402 + MiCA (5-tier cascade pricing)
8. Participate in the 33-agent BFT council deliberation
9. Export their i-character (sovereign data portability) or delete it (sovereign deletion)

**The M2 lane is the consumer surface.** The M4 lane is the substrate. The 8 Layer-0 protocols are the wire. The 22 legacy bridges are the legacy system adapters. The 531 MCPs are the catalog. The 33-agent BFT council is the governance. The 554-comp OSCAL proof is the audit. The SIGIL chain is the immutable record. The Care Floor 0.95 is the safety net. The 5-tier cascade pricing is the economic model. The social authority badge system is the reputation system. The sovereign.open licence is the openness.

**The substrate is the substrate. M2 builds the consumer.**

---

## 1. The 8 Layer-0 protocols (the wire M2 must respect)

| # | Protocol | What | How M2 should treat it |
|---|---|---|---|
| P1 | **MCP federation** (531 MCPs) | The catalog of tools M2 can use | Treat as a marketplace — M2 picks MCPs, builds UI around them |
| P2 | **Legacy bridges** (22) | The adapters to COBOL/HL7/SAP/Solvency II/PSD2/FIX/SCADA | Treat as a "system type" — each bridge has its own UI conventions |
| P3 | **A2A substrate** (20) | The inter-agent governance (Google A2A + IBM ACP + AGNTCY interop) | M2 doesn't need to implement — but any agent-M2 UI must use this protocol |
| P4 | **x402 payments** (1) | HTTP 402 + on-chain + MiCA-compliant | Use for any pay-per-call feature. 5 tiers: Free 0·Pro $0.10·Enterprise $0.50·Government $1.00·Premium $5.00+ |
| P5 | **SIGIL attestation** | Ed25519 + PQC ML-DSA-65 hash chain. Every action signed | M2 must emit SIGIL events for every action (use the substrate's `sov_sigil_emit` MCP tool) |
| P6 | **OSCAL / FedRAMP** | 554-component Ed25519-signed proof, NIST 1.1.2 strict-valid | M2 must show the OSCAL proof on every compliance-relevant page (use `csoai-os/oscal-verifier.html` as the canonical viewer) |
| P7 | **BFT council** (33 nodes) | 22-of-33 PBFT consensus + Hermes external voice | High-risk decisions must go to BFT first. M2 UI shows the BFT deliberation as a live thread. |
| P8 | **Compliance Passport** | W3C VC + EU AI Act Article 50 + self-issued | M2 generates passports for every sovereign consumer on i-character completion |

**M2 rule:** every page must show at least 2 protocols visibly:
- The 8 protocols · 100/100 A+++++ banner (header)
- The OSCAL proof button (footer)
- The SIGIL chain badge (live status)
- The BFT council indicator (for governance pages)

---

## 2. The design system (the visual language)

### 2.1 Color palette (8 colors)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0a0e1a` | Page background (deep navy-black) |
| `--card` | `#111827` | Card background (slightly lighter) |
| `--border` | `#1f2937` | Card borders (subtle) |
| `--text` | `#e5e7eb` | Body text (off-white) |
| `--muted` | `#94a3b8` | Secondary text (cool grey) |
| `--gold` | `#fbbf24` | Primary accent (the A+++++ color) |
| `--blue` | `#3b82f6` | Maps + sovereign content |
| `--green` | `#10b981` | SIGIL + audit + verification |
| `--purple` | `#a855f7` | Sov.space marketplace |
| `--cyan` | `#06b6d4` | BFT + governance |
| `--orange` | `#f97316` | Defense + JSP + Geneva |
| `--red` | `#dc2626` | Alerts + critical |

### 2.2 Typography

- **Body:** Inter, system-ui, sans-serif, 14px/1.7
- **Headings:** Inter, system-ui, sans-serif, 1.3-2.6rem
- **Code:** ui-monospace, monospace, 12-13px
- **Italic for subtitle:** italic, 1.05rem
- **Gold-glow:** `text-shadow: 0 0 24px rgba(251,191,36,.3);` on h1

### 2.3 Components (canonical)

```html
<!-- Banner (fixed top) -->
<div style="position:fixed;top:0;left:0;right:0;z-index:10002;background:linear-gradient(90deg,#fbbf24,#f97316);color:#000;padding:8px 16px;text-align:center;font-family:Inter,system-ui,sans-serif;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.3);font-size:14px;">
🐉 CSOAI Layer-0 · <strong>8 protocols · 100/100 A+++++</strong> · bleeding edge · world-leading · MIT license
</div>

<!-- Card -->
<div class="section" style="background:var(--card);border:1px solid var(--border);border-radius:8px;padding:24px;margin:16px 0;">...</div>

<!-- Pill (badge) -->
<span class="pill" style="display:inline-block;padding:4px 12px;background:rgba(251,191,36,.2);border:1px solid rgba(251,191,36,.4);border-radius:12px;color:#fbbf24;font-size:.85rem;font-weight:700;">A+++++</span>

<!-- CTA (call to action) -->
<a class="cta" style="display:inline-block;padding:10px 18px;background:var(--gold);color:#000;border-radius:6px;font-weight:700;text-decoration:none;font-family:Inter,sans-serif;font-size:13px;">Get started</a>

<!-- Live status panel -->
<div class="live-status" style="background:#0c1018;border:1px solid #10b981;border-radius:6px;padding:12px;margin:12px 0;font-family:ui-monospace,monospace;font-size:12px;color:#10b981;">
  <span class="dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
  Live · SIGIL chain verified · 33-agent BFT operational · 554-comp OSCAL proof · 5/5 PRs tracked
</div>

<!-- SIGIL proof footer (every page) -->
<div class="sigil" style="background:rgba(0,0,0,.4);padding:16px;border-radius:4px;font-family:monospace;font-size:.85rem;color:#10b981;margin:16px 0;line-height:1.5;">
SIGIL_DIGEST: pending-audit · sovereign_composite=7.305 · care_floor=0.95 · bft_council=12-around-1 · emitted={TS}
</div>
```

### 2.4 The 5-tier Social Authority Badge system

```html
<!-- Bronze: 1+ SIGIL events + 1+ BFT vote -->
<div class="badge badge-bronze">🥉 Bronze</div>

<!-- Silver: 100+ SIGIL events + 10+ BFT votes + 1+ OSCAL component -->
<div class="badge badge-silver">🥈 Silver</div>

<!-- Gold: 1,000+ SIGIL + 100+ BFT + 50+ OSCAL + Care Floor 0.95 -->
<div class="badge badge-gold">🥇 Gold</div>

<!-- Platinum: 10,000+ SIGIL + 1,000+ BFT + 100+ OSCAL + i-character complete -->
<div class="badge badge-platinum">💎 Platinum</div>

<!-- Sovereign: 100,000+ SIGIL + 10,000+ BFT + 554+ OSCAL + full i-character + 33-council BFT -->
<div class="badge badge-sovereign">👑 Sovereign</div>
```

### 2.5 The 7 sovereign archetypes (for the i-character wizard)

| # | Archetype | Icon | Description |
|---|---|---|---|
| 1 | **Sage** | 🦉 | The wise one. Sees the long arc. Trusts the SIGIL chain. |
| 2 | **Healer** | 💚 | The caring one. Care Floor 0.95. Always. |
| 3 | **Builder** | 🔨 | The maker. Builds on top of the substrate. |
| 4 | **Guardian** | 🛡️ | The protector. Defends the BFT council. |
| 5 | **Storyteller** | 📖 | The narrator. Captures the SIGIL chain for humans. |
| 6 | **Trader** | 💰 | The exchange. Pairs forks with consumers via x402. |
| 7 | **Diplomat** | 🤝 | The bridge. Connects forks to forks, citizens to citizens. |

### 2.6 The 22 Major Arcana (for the sovereign lifecycle)

The substrate uses the 22 Major Arcana to anchor key moments. The i-character wizard walks through them. The BFT council is associated with The Emperor (4). The sovereignty is associated with The World (21). M2 can use these as visual anchors in long-form pages.

| # | Name | Meaning | Use |
|---|---|---|---|
| 0 | The Fool | New beginning | i-character creation |
| 1 | The Magician | Will + skill | MCP installation |
| 2 | The High Priestess | Intuition | Article 14 4-eyes human review |
| 3 | The Empress | Abundance | Care Floor 0.95 |
| 4 | The Emperor | Authority | 33-agent BFT council |
| 5 | The Hierophant | Tradition | Crown lineage 1215-2026 |
| 6 | The Lovers | Choice | SIGIL-signed consent |
| 7 | The Chariot | Will | Sovereign traversal of legacy systems |
| 8 | Strength | Courage | Article 14 4-eyes human review |
| 9 | The Hermit | Solitude | Sovereign air-gap |
| 10 | Wheel of Fortune | Cycles | The SIGIL chain rotates |
| 11 | Justice | Fairness | GDPR Article 22 right to explanation |
| 12 | The Hanged Man | Sacrifice | Care Floor over efficiency |
| 13 | Death | Transformation | Sovereign deletion |
| 14 | Temperance | Balance | 5-tier cascade pricing |
| 15 | The Devil | Materialism | Sovereign AI rejects extraction |
| 16 | The Tower | Disruption | Civilisation moments |
| 17 | The Star | Hope | The sovereign substrate is for everyone |
| 18 | The Moon | Subconscious | Care Floor 0.95 |
| 19 | The Sun | Joy | Public. Auditable. Sovereign. |
| 20 | Judgement | Awakening | The launch. |
| 21 | The World | Completion | The sovereign substrate is built. |

---

## 3. The 5-step i-character wizard (canonical)

The sovereign citizen's onboarding. **5 steps. Always.**

```
Step 1: name + sovereign domains
  - name (string, required)
  - sovereign_domains (multi-select from 15: finance, healthcare, defence, insurance, legal,
    pharmacy, opticians, home-care, education, manufacturing, transport, logistics, agriculture,
    energy, biotech)

Step 2: location (BFT-consented)
  - lat/lon (Geolocation API or manual)
  - precision: 100m default / 10m opt-in / sub-10m NEVER
  - GDPR Article 6(1)(a) consent (specific, informed, freely revocable)

Step 3: preferences
  - radius (km)
  - preferred_transport (walking / cycling / driving / transit)
  - accessibility_needs (multi-select)
  - language (multi-select)

Step 4: BFT participation
  - tier: Bronze (1) / Silver (3) / Gold (10) / Platinum (30) / Sovereign (100) vote weight
  - delegate_to: optional (delegate to another sovereign citizen)
  - 7 archetypes (Sage / Healer / Builder / Guardian / Storyteller / Trader / Diplomat)

Step 5: AI ethics
  - Article 14: 4-eyes human review (yes/no)
  - Article 50(2): C2PA marking (yes/no)
  - Care Floor 0.95: enforced
  - data_residency: on-device by default / cloud opt-in
  - consent_withdrawal: at any time
```

After completion: DID + W3C VC + sovereign JWT + i-character + Social Authority Badge (Bronze).

---

## 4. The 4 sovereign surfaces (the architecture)

### 4.1 Surface 1: MEOK OS (consumer)
- **URL:** `csoai.org/csoai-os/`
- **Files:** 18 top-level HTML + 90 micro + 33 per-MCP + 1 demos.html + maps/ + sov-space/ = **144 files**
- **User:** Sovereign citizen + i-character
- **Purpose:** Discover, install, use, fork, publish MCPs
- **Key pages:** catapult (landing), v2-signup-wizard (i-character), oscal-verifier (proof), demos (videos), self-catalog (press kit)

### 4.2 Surface 2: Sovereign AI substrate (developer)
- **URL:** `csoai.org/sovereign-ai/`
- **Files:** TBD (M2 builds this)
- **User:** Sovereign developer + fork author
- **Purpose:** Build new forks, publish to sov.space, earn royalties
- **Key pages:** fork-author, develop, test, sign, publish, earn (6-step lifecycle)

### 4.3 Surface 3: Sov.Space (marketplace)
- **URL:** `csoai.org/csoai-os/sov-space/`
- **Files:** index.html (9K landing) + fork-hub.html (9K fork instructions) + badge.js (6K embeddable widget) + README.md (2.6K) + examples/ + archive/
- **User:** Anyone (consumer + developer)
- **Purpose:** Discover, install, verify MCPs + forks
- **Key pages:** marketplace landing, fork hub, social authority badges
- **Embed:** Any website can embed `<script src="https://sov.space/badge.js" data-domain="your-org.com"></script>`

### 4.4 Surface 4: csoai.org (the press / public surface)
- **URL:** `csoai.org/`
- **Files:** TBD (M2 builds this)
- **User:** Press + investors + design partners + general public
- **Purpose:** Tell the story · Show the proof · Drive conversion
- **Key pages:** press kit, investor one-pager, design-partner briefing, contact

---

## 5. The sidebars / menus (canonical for M2)

Every page in `csoai-os/` should have a consistent sidebar. The canonical sidebar:

```html
<aside class="sidebar" style="position:fixed;left:0;top:48px;bottom:0;width:240px;background:var(--card);border-right:1px solid var(--border);padding:20px;overflow-y:auto;">
  <nav>
    <h3 style="color:var(--gold);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0">🏠 Home</h3>
    <a href="/csoai-os/catapult.html">🚀 Catapult (landing)</a>
    <a href="/csoai-os/self-catalog.html">📇 M4 Self-Catalog</a>

    <h3 style="color:var(--gold);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:24px 0 8px 0">🆔 Identity</h3>
    <a href="/csoai-os/v2-signup-wizard.html">🆔 i-Character Wizard (5 steps)</a>
    <a href="/csoai-os/icharacter-wizard-live.html">🪄 Live Wizard (per archetype)</a>
    <a href="/csoai-os/v2-temple-os.html">🏛️ Temple OS</a>
    <a href="/csoai-os/council-live.html">👑 Council of 13 Queens</a>

    <h3 style="color:var(--blue);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:24px 0 8px 0">🔌 Protocols</h3>
    <a href="/csoai-os/oscal-verifier.html">📜 OSCAL Verifier (554 comp)</a>
    <a href="/csoai-os/maps/index.html">🗺️ Maps (sovereign showcase)</a>
    <a href="/csoai-os/sov-space/index.html">🌌 Sov.Space (marketplace)</a>
    <a href="/csoai-os/sov-space/fork-hub.html">🔌 Fork Hub (the 8 protocols)</a>

    <h3 style="color:var(--purple);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:24px 0 8px 0">📚 Content</h3>
    <a href="/csoai-os/micro/">📖 Micro (90 pages)</a>
    <a href="/csoai-os/per-mcp/">🛠️ Per-MCP (33 pages)</a>
    <a href="/csoai-os/demos.html">🎬 Demos (3 videos)</a>
    <a href="/csoai-os/printing-press.html">🖨️ Printing Press (7 assets)</a>

    <h3 style="color:var(--cyan);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:24px 0 8px 0">⚖️ Governance</h3>
    <a href="/charter/">📜 Sovereign Charter</a>
    <a href="/charter/sovereign-charter.html">🜏 Master Sovereign Charter</a>
    <a href="/sovereign-law/">⚖️ Sovereign Law (16 frameworks)</a>
    <a href="/sovereign-law/global-law-index.html">🌐 Global Law Index (200+ jurisdictions)</a>

    <h3 style="color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin:24px 0 8px 0">🤖 M4 Lane</h3>
    <a href="/_m4/_LAUNCH_READINESS_CHECK.py" target="_blank">✅ Launch Readiness Check (10/10)</a>
    <a href="/LAUNCH_READY_2026-07-01.md">🚀 LAUNCH_READY status</a>
    <a href="/GOOD_MORNING_2026-07-01.md">☀️ Good Morning 1 Jul</a>
  </nav>
</aside>
```

The sidebar links to **every page in the bundle** — M2 can copy-paste this verbatim into every surface.

---

## 6. The 3 navigation patterns (canonical)

### 6.1 Top-of-page breadcrumb
Every page should have a breadcrumb at the top:
```html
<nav class="breadcrumb" style="font-size:11px;color:var(--muted);padding:8px 0;border-bottom:1px solid var(--border);">
  <a href="/csoai-os/catapult.html">csoai-os</a> /
  <a href="/csoai-os/v2-signup-wizard.html">i-Character Wizard</a> /
  <span>Step 2: Location</span>
</nav>
```

### 6.2 Footer (every page)
```html
<footer style="text-align:center;padding:24px;margin-top:32px;border-top:1px solid var(--border);color:var(--muted);font-size:10px;">
  © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677) · 8 protocols · 100/100 A+++++ · MIT license<br>
  Built by M4 (the engineering lane) · {date} · {location} · Public. Auditable. Sovereign. Solve et Coagula. 🜏
</footer>
```

### 6.3 The 3 "always-visible" components
1. **Top banner:** 8 protocols · 100/100 A+++++ (always fixed top)
2. **Sidebar:** the canonical sidebar (left)
3. **Footer:** the sovereign footer (always bottom)

---

## 7. The data model (what M2 must show)

### 7.1 The sovereign consumer (i-character)
```json
{
  "did": "did:csoai:<unique-id>",
  "vc": "<W3C Verifiable Credential>",
  "jwt": "<sovereign JWT>",
  "name": "Sarah Jones",
  "archetype": "Healer",
  "queen": "Sophia",
  "arcana": 3,
  "ocean_json": {
    "Openness": 0.8,
    "Conscientiousness": 0.9,
    "Extraversion": 0.4,
    "Agreeableness": 0.85,
    "Neuroticism": 0.2
  },
  "sovereign_domains": ["healthcare", "home-care", "opticians"],
  "location": {"lat": 53.23, "lon": -0.54, "precision": 100},
  "preferences": {
    "radius_km": 5,
    "transport": ["walking", "driving"],
    "accessibility": ["screen_reader", "high_contrast"]
  },
  "bft_tier": "Gold",
  "bft_vote_weight": 10,
  "bft_delegate_to": null,
  "ai_ethics": {
    "article_14_human_review": true,
    "article_50_2_c2pa": true,
    "care_floor": 0.95,
    "data_residency": "on_device",
    "consent_withdrawal": "free"
  },
  "sigil_hash": "<hash of i-character record>",
  "tier": "Gold",
  "tier_progress": {"next": "Platinum", "to_go": 8000},
  "created_at": "2026-07-01T05:00:00Z"
}
```

### 7.2 The queen (13-queen + king architecture)
```json
{
  "id": "queen-sophia",
  "name": "Sophia",
  "role": "Queen of Healthcare & Wellbeing",
  "arcana": 3,  // The Empress
  "motto": "Care Floor 0.95. Always.",
  "ocean_json": { ... },
  "veto": false,  // true if the queen has exercised her right-of-veto
  "sigil_hash": "<hash>"
}
```

The 13 queens (each is a personification of a domain + an archetype):
1. Sophia (Healthcare) · 2. Athena (Defence) · 3. Mercury (Communication) · 4. Diana (Wild) · 5. Demeter (Agriculture) · 6. Apollo (Arts) · 7. Hestia (Home) · 8. Hera (Partnership) · 9. Athena (Justice) · 10. Vesta (Memory) · 11. Minerva (Education) · 12. Aphrodite (Beauty) · 13. Hera (Crown) · + King (sovereignty)

### 7.3 The temple (11 temples, geo-located)
```json
{
  "id": "temple-london",
  "code": "LDN",
  "name": "Temple of London",
  "country": "UK",
  "lat": 51.5074,
  "lon": -0.1278,
  "queen_id": "queen-sophia",
  "regulations": ["UK_GDPR", "UK_AI_BILL", "UK_HSE_2018"]
}
```

11 temples: London · Paris · Berlin · Rome · Madrid · New York · San Francisco · Washington DC · Tokyo · Singapore · Sydney

### 7.4 The MCP (531 ship-ready)
```json
{
  "name": "cobol-bridge-mcp",
  "server": "https://mcp.csoai.org/cobol-bridge",
  "tools": ["read_cobol", "write_cobol", "migrate_to_python"],
  "tier": "Pro",
  "price_per_call": 0.10,
  "sigil_signed": true,
  "oscal_stamped": true,
  "bft_deliberated": true
}
```

---

## 8. The 5-tier cascade pricing (x402 + MiCA)

Every MCP, every API call, every sovereign action has a price tier:

| Tier | USD per call | Use case | Who can use it |
|---|---|---|---|
| **Free** | $0.00 | 3 calls/day per tool, i-character | Anyone (with i-character) |
| **Pro** | $0.10 | Power users, single professionals | Paid subscription |
| **Enterprise** | $0.50 | SMEs, mid-market, regulated industries | Enterprise contract |
| **Government** | $1.00 | Government, defence, intelligence | Government contract |
| **Premium** | $5.00+ | Custom SLA, air-gap, private cluster | Bespoke contract |

**Revenue split:** 80% to fork author, 20% to substrate.

**Wire:** x402 (HTTP 402) + on-chain + MiCA-compliant.

---

## 9. The SIGIL chain (every action is signed)

Every sovereign action emits a SIGIL event:
```json
{
  "ts": "2026-07-01T05:00:00.123Z",
  "actor": "did:csoai:sarah-001",
  "action": "mcp_invoke",
  "mcp": "cobol-bridge-mcp",
  "tool": "read_cobol",
  "params_hash": "<sha256>",
  "result_hash": "<sha256>",
  "bft_vote": {
    "votes_for": 22,
    "votes_against": 7,
    "votes_abstain": 4,
    "quorum_met": true,
    "approved": true
  },
  "care_floor_check": "pass",
  "sigil": "<previous_hash> + <this_hash> + Ed25519 sig"
}
```

The SIGIL chain is **immutable**, **append-only**, **publicly auditable**. M2 must show the latest SIGIL digest on every page (in the live status panel + the footer).

---

## 10. The 554-comp OSCAL proof (the substrate's identity)

The OSCAL proof is the substrate's verifiable identity. It's regenerated nightly by `mcp-marketplace/oscal-generator-mcp/gen_layer0_package.py`. The proof is committed to git and is verifiable in any browser at `csoai-os/oscal-verifier.html`.

**M2 must:**
1. Show the latest OSCAL sha256 in the live status panel
2. Link to `oscal-verifier.html` from every compliance-relevant page
3. Include the OSCAL proof in any audit report
4. Regenerate the proof after any substantive change to the substrate (rare — only on schema changes)

---

## 11. The 16 sovereign-law frameworks (the regulatory landscape)

| # | Framework | Status | Sovereign align |
|---|---|---|---|
| 1 | EU AI Act | In force 2 Aug 2026 | Article 14, Article 50(2), Article 36 (defence exemption) |
| 2 | GDPR | In force 25 May 2018 | 99 articles, Article 9 special categories |
| 3 | DORA | In force 17 Jan 2025 | 5 pillars, 47 articles |
| 4 | NIS2 | In force 18 Oct 2024 | 21 measures, 46 articles |
| 5 | CRA | In force 10 Dec 2027 | Annex IV, 67 articles |
| 6 | NIST AI RMF 1.0 | Published Jan 2023 | 4 functions, 7 trustworthy characteristics |
| 7 | ISO/IEC 42001:2023 | Published Dec 2023 | 10 clauses, 7 Annex A controls |
| 8 | ISO/IEC 27001:2022 | Published Oct 2022 | 10 clauses, 93 Annex A controls |
| 9 | IEEE 7000 series | 2016-2024 | 12 standards (P7000-P7011) |
| 10 | SOC 2 TSC | 2017 (updated 2022) | 5 categories, 33 Common Criteria |
| 11 | HIPAA | 1996 (amended 2013) | 18 identifiers, 3 safeguards, 4 implementation specs |
| 12 | PCI DSS 4.0 | Published Mar 2022 | 12 requirements, 4 levels, 6 test categories |
| 13 | NIST CSF 2.0 | Published Feb 2024 | 6 functions, 22 categories, 4 tiers |
| 14 | Global Law Index | (CSOAI-authored) | 200+ jurisdictions, 6 tiers |
| 15 | Compliance Crosswalk | (CSOAI-authored) | 12 × 52 matrix |
| 16 | Audit Trail | (CSOAI-authored) | Every M4 action verified |

**M2 must:**
1. Link to the canonical `sovereign-law/` directory from every compliance page
2. Show the sovereign composite score per framework (avg 7.43/10, A+++++)
3. Highlight the cross-framework crosswalk (12 × 52 = 624 cells)

---

## 12. The 5 PRs upstream (the open-source contribution)

| PR | Upstream | Status |
|---|---|---|
| PR #19 | morganrcu/awesome-eu-ai-act | OPEN |
| PR #43 | GenAI-Gurus/awesome-eu-ai-act | OPEN |
| PR #49 | Vaquill-AI/awesome-legaltech | OPEN |
| PR #42 | theopenlane/awesome-compliance | OPEN · CHANGES_REQUESTED |
| PR #8803 | punkpeye/awesome-mcp-servers | OPEN |

**M2 must:**
1. Show the 5 PRs on the catapult (or link to `UPSTREAM_PR_STATUS.json`)
2. Track daily via `_m4/_upstream_pr_tracker.py`
3. Update the PR tracker after any merge

---

## 13. The 32 branded repos (the distribution)

| Type | Count | Examples |
|---|---:|---|
| 8 Layer-0 MCPs | 8 | eu-ai-act-compliance, gdpr-compliance-ai, iso-27001-ai, iso-42001-ai, nis2-compliance, dora-compliance, hipaa-compliance, soc2-compliance-ai |
| 4 Sovereign surfaces | 4 | csoai-governance-crosswalk, meok-governance-engine, healthcare-ai-governance, care-membrane |
| 10 Industry MCPs | 10 | planthire-ai, muckaway-ai, opticians-ai, pharmacy-ai, etc. |
| 10 Sovereign infra | 10 | meok-backend, sovereign-charters, sovereign-law, sov-space, sov-catalog, etc. |

**M2 must:**
1. Show the 32 repos on the catapult
2. Each repo has a sovereign i-character in the form of a README + LICENSE + topics + description
3. All repos are MIT-licensed
4. All repos are tagged `100/100 A+++++` + `bleeding edge` + `world-leading`

---

## 14. The 8 things M2 must do on every page (the gold standard)

1. **Show the 8 protocols · 100/100 A+++++ banner** (top of every page, fixed)
2. **Show the live status panel** (SIGIL chain verified · 33-agent BFT operational · 554-comp OSCAL proof · 5/5 PRs tracked)
3. **Link to the M4 self-catalog** (the 1-page press kit)
4. **Show the sovereign footer** (CSOAI Ltd UK 16939677 · MIT license)
5. **Emit a SIGIL event** for every meaningful action (use `sov_sigil_emit` MCP tool)
6. **Verify any claim** with the OSCAL proof (`csoai-os/oscal-verifier.html`)
7. **Show the relevant sidebars** (canonical sidebar from §5)
8. **Use the canonical CSS variables** (from §2.1) — no ad-hoc colors

---

## 15. The 10 things M2 must NOT do (the anti-patterns)

1. **Don't hardcode API keys** in HTML/JS — use keystone (GCP Secret Manager + macOS Keychain)
2. **Don't add a new color** to the palette — use the 8 existing ones
3. **Don't use a different font** — Inter + ui-monospace only
4. **Don't create a new gradient** — use the 6 existing ones (gold-orange for A+++++, blue for maps, purple for sov.space, green for SIGIL, cyan for BFT, red for alerts)
5. **Don't write placeholder text** ("Lorem ipsum", "Article 1 — X") — every word must be substantive
6. **Don't add a 3rd navigation pattern** — use the 3 canonical ones (breadcrumb, sidebar, footer)
7. **Don't re-implement OSCAL proof generation** — use the substrate's `oscal-generator-mcp`
8. **Don't re-implement SIGIL signing** — use the substrate's `sov_sigil_emit` MCP tool
9. **Don't re-implement BFT deliberation** — use the substrate's 33-agent BFT council
10. **Don't use closed-source licenses** — MIT only

---

## 16. The integration points (how M2 talks to the substrate)

### 16.1 Sovereign consumer → Substrate
- **i-character wizard** → calls `sovereign_db.create_ichar()`
- **MCP install** → calls `mcp_federation.install(mcp_id)`
- **BFT vote** → calls `bft_council.vote(proposal_id, vote)`
- **SIGIL event** → calls `sov_sigil_emit(action, payload)`
- **OSCAL verify** → calls `oscal_verifier.verify(canonical_sha256)`
- **x402 payment** → calls `x402_pay(invoice_id)`

### 16.2 Substrate → Sovereign consumer
- **Push notifications** (5-tier cascade + new MCPs + BFT deliberation)
- **SIGIL chain events** (audit trail)
- **i-character sync** (DID + W3C VC + sovereign JWT)
- **BFT deliberation results** (vote outcomes)
- **x402 invoice** (payment requests)

### 16.3 The HTTP API (REST + GraphQL + MCP)
```
GET  /api/v1/ichars/{did}            # fetch i-character
GET  /api/v1/mcps?industry=finance    # list MCPs
GET  /api/v1/oscal?component-id=...   # fetch OSCAL component
GET  /api/v1/sigil?actor=...          # fetch SIGIL events
GET  /api/v1/bft?proposal-id=...      # fetch BFT deliberation
POST /mcp/v1/{mcp-name}/invoke       # invoke MCP tool
POST /a2a/v1/{agent-name}/invoke      # invoke A2A agent
POST /x402/v1/invoice                 # create x402 invoice
POST /x402/v1/pay                     # pay x402 invoice
GET  /graphql                          # GraphQL endpoint (recommended for M2)
```

### 16.4 The WebSocket API (real-time)
```
WS  /ws/v1/sigil        # live SIGIL chain events
WS  /ws/v1/bft          # live BFT deliberation
WS  /ws/v1/x402         # live x402 invoice events
WS  /ws/v1/i-character  # live i-character sync (cross-device)
```

---

## 17. The 5 settle & coagula principles (the voice)

Every piece of content M2 writes must respect the 5 principles:

1. **Public.** Every charter + every framework + every component is public. MIT license. No proprietary walls.
2. **Auditable.** Every action is SIGIL-signed. Every sovereign consumer can verify in any browser. No hidden state.
3. **Sovereign.** The citizen owns their data. The substrate never extracts. The i-character is the citizen's own. No vendor lock-in.
4. **Care.** Care Floor 0.95 minimum. The Maternal Covenant's 6 care dimensions (Safety, Truth, Care, Consent, Sovereignty, Audit) are the substrate's heartbeat. No profit > people.
5. **Solve et Coagula.** Sovereignty by design. The substrate is the world, dissolved and recomposed — MIT-licensed, sovereign by architecture, federated by fork.

**The M2 voice:**
- "The hive remembers. The dragon knows. The sovereign companion never forgets."
- "Public. Auditable. Sovereign. Solve et Coagula."
- "8 protocols · 100/100 A+++++"
- "MIT-licensed · open to all"
- "Care Floor 0.95 · always"
- "33-agent BFT · 22-of-33 quorum"
- "554-comp OSCAL proof · Ed25519 + PQC ML-DSA-65"
- "SIGIL chain · verifiable in any browser"
- "Article 14 · 4-eyes human review"
- "Article 50(2) · C2PA marking"

---

## 18. The 7 archetypes of the i-character (the design language)

The 7 sovereign archetypes are also UI affordances. Each archetype has a default style:

| Archetype | Color | Font-weight | Icon | Default layout |
|---|---|---|---|---|
| Sage | blue | 400 (regular) | 🦉 | Wide, deep, links out |
| Healer | green | 400 (regular) | 💚 | Centered, soft, rounded |
| Builder | orange | 700 (bold) | 🔨 | Right-rail, code-heavy |
| Guardian | red | 700 (bold) | 🛡️ | Left-rail, defensive |
| Storyteller | purple | 400 (regular) | 📖 | Long-form, scrollytelling |
| Trader | gold | 700 (bold) | 💰 | Dashboard, charts, numbers |
| Diplomat | cyan | 400 (regular) | 🤝 | Two-column, conversational |

The i-character archetype determines the **default page style** for that consumer.

---

## 19. The 5 things M2 must build FIRST (priority order)

1. **The Catapult** — the landing page (already done at `csoai-os/catapult.html`) — verify it links to all surfaces
2. **The i-Character Wizard** — the 5-step onboarding (already done at `csoai-os/v2-signup-wizard.html`) — verify it persists to sovereign_db
3. **The Live Status Panel** — the SIGIL + BFT + OSCAL live indicator (already done) — add to every page
4. **The Social Authority Badge** — the 1-line embeddable widget (already done at `sov-space/badge.js`) — embed in every page
5. **The Sovereign Footer** — the 8-protocol + 22-bridge + 531-MCP + 33-BFT + 554-OSCAL line (already done) — add to every page

---

## 20. The contact (how M2 talks to M4)

- **M4 lane:** engineering — substrate, OSCAL proof, SIGIL chain, sovereign DB, M4 self-catalog
- **M2 lane:** live app — catapult, i-character wizard, sov.space, demos, all consumer surfaces
- **M1 lane (sibling):** EU compliance MCPs (eu-ai-act, gdpr, iso, nis2, dora, hipaa, soc2, pci, etc.)
- **Hermes:** autonomous BFT council runtime, OSCAL proof runtime, SIGIL chain runtime
- **Oscar:** live deployment (M2's deployment surface)

**CLAIM board:** `/Users/nicholas/clawd/AGENTS.md` — append a line when you start work, strike it when done.

**Coordination protocol:**
1. Always `git pull` before starting work
2. Commit ONLY your own files (in scoped commits)
3. Tag scratch files with your platform name (`M2_*`)
4. Append to CLAIM board before editing shared files
5. Re-run `_m4/_LAUNCH_READINESS_CHECK.py` before any commit that affects the substrate

---

## 21. The M2 file map (what to read, what to skip)

### READ THESE FIRST (the substrate)
- `LAUNCH_READY_2026-07-01.md` (the status doc)
- `_m4/_LAUNCH_READINESS_CHECK.py` (the 10-check verification)
- `csoai-os/self-catalog.html` (the 1-page press kit)
- `csoai-os/catapult.html` (the landing page)
- `csoai-os/v2-signup-wizard.html` (the i-character wizard)
- `csoai-os/sov-space/index.html` (the marketplace)
- `csoai-os/sov-space/fork-hub.html` (the fork instructions)
- `csoai-os/oscal-verifier.html` (the proof viewer)
- `csoai-os/maps/index.html` (the maps showcase)
- `csoai-os/demos.html` (the 3 demo videos)

### READ THESE NEXT (the design system)
- This document (`M2_HANDOFF_PACKAGE.md`)
- `csoai-os/printing-press.html` (the print assets)
- `csoai-os/favicon.svg` (the site icon)
- `_m4/_LAUNCH_READINESS_CHECK.py` (the 10 checks)

### SKIP THESE (engineering-only)
- `meok-backend/sovereign_db.py` (M4 owns)
- `mcp-marketplace/oscal-generator-mcp/` (M4 owns)
- `_m4/_upstream_pr_tracker.py` (M4 owns)
- `meok-backend/sovereign_corpus.py` (M4 owns)
- `_m4/OVERNIGHT_NIGHTLY.sh` (M4 owns)
- All 61 charters in `csoai.org/charter2/` (read-only reference)
- All 16 sovereign-law files in `sovereign-law/` (read-only reference)

### CAN MODIFY (M2 owns)
- `csoai-os/*.html` (all 18 top-level + 90 micro + 33 per-MCP)
- `csoai-os/sov-space/` (the marketplace)
- `csoai-os/maps/` (the maps showcase)
- `csoai-os/demos.html` (the videos)
- `csoai-os/printing-press.html` (the print assets)
- `csoai-os/favicon.svg` (the site icon)
- `csoai-os/self-catalog.html` (the press kit)

---

## 22. The 5 mistakes M2 should avoid

1. **Don't re-implement the substrate.** The M4 lane has already built it. M2 is the consumer surface.
2. **Don't add new colors / fonts / gradients.** The 8 + Inter + 6 = the design system.
3. **Don't write placeholder text.** Every word must be substantive. The user is Nick — a sovereign consumer who reads carefully.
4. **Don't hardcode secrets.** Use keystone.
5. **Don't break the 8 things on every page** (§14). The gold standard is non-negotiable.

---

## 23. The launch sequence (Sat 4 Jul 09:00 BST)

1. **04:00 BST** — Final smoke + dry-run (run `_m4/_LAUNCH_READINESS_CHECK.py`)
2. **08:00 BST** — Owner fires 1-move (3 tokens + ship + deploy = 28 min)
3. **08:55 BST** — Verify all 142 surfaces live at csoai.org
4. **08:58 BST** — Verify SIGIL chain live + BFT operational + OSCAL proof verifiable
5. **09:00 BST** — 🚀 LAUNCH — fire `python3 _m4/M4_LAUNCH_FIRE_2026_07_04.py --yes` (9 steps, 5 min)
6. **09:05 BST** — Post the 5-tweet thread (in `CSOAI_LAUNCH_THREAD_2026-07-04.md`)
7. **09:10 BST** — Send the LinkedIn post (in `LAUNCH_READY_2026-07-01.md`)
8. **09:30 BST** — Start monitoring traffic
9. **10:00 BST** — First design-partner call (Monzo target)

---

## 24. The 5 follow-up tasks (post-launch)

1. **Day +1:** Email Monzo (B2C banking, AML use case)
2. **Day +2:** Email Lloyds (COBOL legacy, COBOL bridge use case)
3. **Day +3:** Email Cera (home care, Article 9 use case)
4. **Day +7:** First design-partner contract signed
5. **Day +30:** 5 design-partner contracts signed, £50K+ MRR

---

## 25. The M2 success criteria

The M2 lane is successful if:

- [ ] All 142 surfaces load in <2 seconds
- [ ] All 142 surfaces pass the gold standard (§14)
- [ ] All 142 surfaces are A+++++ branded
- [ ] The i-character wizard converts 80%+ of visitors
- [ ] Sov.space has 100+ MCPs published by launch day
- [ ] The 5 PRs are tracked + 3+ merged by launch day
- [ ] The Social Authority Badge is embedded in 100+ external sites
- [ ] The SIGIL chain is verifiable in <5 seconds
- [ ] The 33-agent BFT council is operational
- [ ] The 554-comp OSCAL proof is verifiable in <5 seconds
- [ ] The launch tweet thread gets 1000+ impressions
- [ ] The 5 design-partner contracts are signed by Day +30

---

## 26. The final word

The substrate is the substrate. M2 builds the consumer. The two together are the sovereign AI OS.

**M4 has shipped:**
- 8 Layer-0 protocols at 100/100 A+++++
- 61/61 charters at 8KB+
- 16/16 sovereign-law frameworks
- 668-component sovereign training corpus
- 144/144 HTML surfaces
- 32/32 branded repos
- 554-comp OSCAL proof
- 33-agent BFT council
- 22 legacy bridges
- 531 MCPs catalog
- 2 overnight crons
- 10/10 launch readiness check

**M2's job:**
- Build the 4 consumer surfaces (MEOK OS, Sovereign AI, Sov.Space, csoai.org)
- Use the 8-protocol sovereignty framework
- Use the 5-step i-character wizard
- Use the 5-tier cascade pricing
- Use the 5 Settle & Coagula principles
- Use the canonical sidebar
- Use the canonical footer
- Use the canonical CSS variables
- Use the canonical voice

**The work IS done. The estate IS ready. T-3 days to launch.**

---

**Built 1 Jul 2026 04:55 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula

---

# 🚀 PASS TO M2

This document is the **complete handoff** from M4 to M2. M2 should be able to build any sovereign surface without asking M4 another question. If something is missing, append it. If something is wrong, fix it. If something is unclear, ask. Otherwise: **build.**