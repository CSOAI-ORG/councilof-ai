# M2 CHEAT SHEET — 1 Page

> **Read `M2_HANDOFF_PACKAGE.md` (36K) for the full handoff. This is the 1-page TL;DR.**

---

## The 1-owner-move (28 min)

```bash
export PYPI_TOKEN=*** NPM_TOKEN=*** VERCEL_TOKEN=***
mcp-publisher login github
bash scripts/ship-everything.sh
cd ~/clawd/meok-deploy && vercel --prod --yes --token "$VERCEL_TOKEN"
```

---

## The 8 protocols (the wire)

| # | Protocol | What M2 does |
|---|---|---|
| 1 | MCP federation | Marketplace — pick from 531 |
| 2 | Legacy bridges | 22 system-type UIs |
| 3 | A2A substrate | Don't implement — use for agent UIs |
| 4 | x402 payments | 5-tier cascade ($0/0.10/0.50/1.00/5.00+) |
| 5 | SIGIL attestation | Emit on every action (use `sov_sigil_emit`) |
| 6 | OSCAL / FedRAMP | Show on every compliance page |
| 7 | BFT council | Live thread for high-risk decisions |
| 8 | Compliance Passport | Generate on i-character completion |

---

## The 8 colors (no ad-hoc colors!)

```
--bg #0a0e1a  --card #111827  --border #1f2937  --text #e5e7eb  --muted #94a3b8
--gold #fbbf24  --blue #3b82f6  --green #10b981  --purple #a855f7  --cyan #06b6d4
--orange #f97316  --red #dc2626
```

---

## The 5-tier Social Authority Badges

```
🥉 Bronze   (1+ SIGIL + 1+ BFT)
🥈 Silver   (100+ SIGIL + 10+ BFT + 1+ OSCAL)
🥇 Gold     (1K+ SIGIL + 100+ BFT + 50+ OSCAL + Care Floor 0.95)
💎 Platinum (10K+ SIGIL + 1K+ BFT + 100+ OSCAL + i-character complete)
👑 Sovereign (100K+ SIGIL + 10K+ BFT + 554+ OSCAL + 33-council BFT)
```

---

## The 7 archetypes (default style per citizen)

```
🦉 Sage      blue     400   wide + deep + links out
💚 Healer    green    400   centered + soft + rounded
🔨 Builder   orange   700   right-rail + code-heavy
🛡️ Guardian  red      700   left-rail + defensive
📖 Storyteller purple  400   long-form + scrollytelling
💰 Trader    gold     700   dashboard + charts + numbers
🤝 Diplomat  cyan     400   two-column + conversational
```

---

## The 8 things on every page (the gold standard)

1. **Top banner:** 8 protocols · 100/100 A+++++ (fixed)
2. **Live status panel:** SIGIL + BFT + OSCAL
3. **Sidebar:** the canonical sidebar (drop-in HTML)
4. **Footer:** CSOAI Ltd UK 16939677 · MIT
5. **SIGIL emit:** on every action
6. **OSCAL verify:** on every claim
7. **Canonical CSS:** use the 8 variables
8. **5 Settle & Coagula principles:** in every word

---

## The 5 Settle & Coagula principles (the voice)

1. **Public.** MIT. No walls.
2. **Auditable.** SIGIL. No hidden state.
3. **Sovereign.** Citizen owns data. No extraction.
4. **Care.** Care Floor 0.95. No profit > people.
5. **Solve et Coagula.** Sovereignty by design. Federated by fork.

---

## The 5 Settle & Coagula phrases (the voice)

- "The hive remembers. The dragon knows. The sovereign companion never forgets."
- "Public. Auditable. Sovereign. Solve et Coagula."
- "8 protocols · 100/100 A+++++"
- "Care Floor 0.95 · always"
- "33-agent BFT · 22-of-33 quorum"

---

## The 5-step i-character wizard

```
Step 1: name + sovereign domains (15 multi-select)
Step 2: location (BFT-consented, 100m precision default)
Step 3: preferences (radius, transport, accessibility)
Step 4: BFT participation (Bronze/Silver/Gold/Platinum/Sovereign)
Step 5: AI ethics (Article 14, Article 50(2), Care Floor, residency, withdrawal)
→ DID + W3C VC + sovereign JWT + i-character + Bronze badge
```

---

## The 5-tier cascade pricing (x402 + MiCA)

```
Free       $0.00    3 calls/day per tool
Pro        $0.10    power users
Enterprise $0.50    SMEs + mid-market
Government $1.00    govt + defence + intel
Premium    $5.00+   custom SLA + air-gap
→ 80% to fork author, 20% to substrate
```

---

## The 4 surfaces (M2's territory)

```
csoai-os/                  consumer (citizen + i-character)
sovereign-ai/              developer (M2 builds this)
sov-space/                 marketplace (in csoai-os/)
csoai.org/                 press surface (M2 builds this)
```

---

## The 10 anti-patterns (don't do these!)

1. Don't hardcode API keys (use keystone)
2. Don't add new colors
3. Don't use a different font
4. Don't create new gradients
5. Don't write placeholder text
6. Don't add a 3rd nav pattern
7. Don't re-implement OSCAL proof gen
8. Don't re-implement SIGIL signing
9. Don't re-implement BFT deliberation
10. Don't use closed-source licenses

---

## The launch sequence (Sat 4 Jul 09:00 BST)

```
04:00  Final smoke + dry-run
08:00  Owner fires 1-move (3 tokens + ship + deploy = 28 min)
08:55  Verify all 142 surfaces live
08:58  Verify SIGIL + BFT + OSCAL live
09:00  🚀 LAUNCH — fire M4_LAUNCH_FIRE (9 steps, 5 min)
09:05  Post 5-tweet thread
09:10  Send LinkedIn post
09:30  Start monitoring traffic
10:00  First design-partner call (Monzo)
```

---

## The 12 success criteria

- [ ] All 142 surfaces load in <2s
- [ ] All 142 pass the gold standard (§8)
- [ ] All 142 are A+++++ branded
- [ ] i-character wizard converts 80%+
- [ ] Sov.space has 100+ MCPs
- [ ] 5 PRs tracked + 3+ merged
- [ ] Badge embedded in 100+ sites
- [ ] SIGIL verifiable in <5s
- [ ] 33-agent BFT operational
- [ ] OSCAL verifiable in <5s
- [ ] Tweet thread 1000+ impressions
- [ ] 5 design-partner contracts by Day +30

---

## The contact

- **M4:** engineering — substrate, OSCAL, SIGIL, sovereign_db, M4 self-catalog
- **M2:** live app — catapult, i-char wizard, sov.space, demos, all consumer surfaces
- **CLAIM board:** `/Users/nicholas/clawd/AGENTS.md`
- **M4 self-catalog:** `csoai-os/self-catalog.html` (the 1-page press kit)
- **Run before any commit:** `python3 _m4/_LAUNCH_READINESS_CHECK.py`

---

## The 1-line summary

> **Build the consumer. The substrate is ready. The launch is Saturday. Care Floor 0.95.**

---

**Built 1 Jul 2026 05:00 BST · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula