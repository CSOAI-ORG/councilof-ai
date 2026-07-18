# 🐉 MEOK — Ecosystem Tabs: Inventory + Coordination Hub
*Authored 2026-06-07. This is the shared source of truth for parallel Claude Code tabs.*

> 🧭 Companion lens: **`SIX_PILLARS.md`** maps Nick's six names (SIGIL · LAW · MAP ·
> COMPLIANCE LAYER · DOME · COUNCIL) onto these ecosystems. **`CSOAI_ENGINE.md`** is the
> Stage-3 wiring contract (the one runtime's endpoints + per-pillar targets).
> This hub wins on inventory/ownership; those docs win on architecture/wiring.

## Is multi-tab a good idea? — Yes, WITH guardrails (honest answer)
It's a force-multiplier **only if tabs don't clobber each other.** We spent a whole session
today untangling a Mac↔VM divergence caused by exactly this: uncommitted parallel edits getting
crash-reverted. The rule that prevents it: **split tabs by CODEBASE/directory, never by concept.**
Two tabs editing `meok-one/` (one "for gaming", one "for characters") = the same mess at 2×. One
codebase = one tab.

## How many tabs? — 6 max. One per ecosystem below.
More than ~6 parallel tabs and you can't hold the coordination in your head. SOV3 (the engine) is
NOT a parallel tab — it's shared infra everything depends on; touch it from the main session only.

---

## The 6 ecosystems (each = one tab, owns its dirs)

### 1. MEOK ONE — the consumer OS (B2C, viral)  ·  branch `claude/meok-one`
**This is where "MEOK Gaming / Characters / World" all live — they are SURFACES of one codebase, not separate products. One tab.**
- **Dirs:** `meok-one/` (the Python app, deployed to VM `meok-backend`), `meok-mobile/`, `meok-desktop/`, `meok-3d-characters/`, `meok-amica/`
- **Surfaces (web/):** os, dome (= MEOK World map), hatch, avatar, hud (= MEOK Gaming overlay), law, registry, pricing, work, help, siri, widget, embed, index
- **Inner features/tools:** 27 characters (Tamagotchi hatch→sovereign) · Voice Mode (reactive orb + STT + TTS, shipped today) · DOME constellation map · brain modes (Fast/Private/Both/Sovereign/Council) · SIGIL hash-chained audit · care membrane (Maternal Covenant) · per-character voices · free-daily-cap funnel
- **Status:** LIVE on the VM (`one.meok.ai` DNS pending). Responsive + Voice Mode + LAW physical crosswalk all deployed.

### 2. CSOAI — AI Governance (B2B revenue)  ·  branch `claude/csoai`
- **Dirs:** `csoai-org/`, `csoai-platform/`, `csoai-dashboard/`, `csoai-docs/`, `csoai-readiness/`, `meok-compliance-gateway/`, `meok-attestation-api/` + the LAW engine inside `meok-one/meok_one/law*.py` (coordinate with tab 1 on that file)
- **Products:** csoai.org, councilof.ai, proofof.ai, agisafe.ai, dataprivacyof.ai, biasdetectionof.ai, safetyof.ai
- **Inner:** LAW crosswalk = **28 frameworks** incl the physical-safety layer (ISO 13482/10218/45001 + EU/UK machinery) shipped today · signed attestations · certification ladder · cross-border crosswalk
- **Status:** domains live; LAW physical crosswalk LIVE on VM.

### 3. MCP Fleet (B2B + the GEO backbone)  ·  branch `claude/mcp-fleet`
- **Dir:** `mcp-marketplace/` (**350 package dirs / ~271 published on PyPI** — verify with `_tooling/`, do NOT claim 410+)
- **Inner:** compliance MCPs (EU AI Act/DORA/NIS2/CRA) · A2A agent MCPs · the gate-protected publish harness `_tooling/republish_mcp.py` (ONLY ships importable wheels) · registry manifests (server.json 95% / smithery 88% / glama 95%) · README hub-backlinks (96%)
- **Rule:** publishing NEW packages re-trips the PyPI new-project cap (runbook G1). Republish existing only.

### 4. MEOK Verticals (industry SaaS)  ·  branch `claude/verticals`
- **Dirs:** `haulage-app/`, `cobolbridge-site/`, `optimobile-site/`, `templeman-opticians-site/`, `muckaway-site/`, `planthire-site/`, `grabhire-site/`, `commercialvehicle-site/`, `landlaw-site/`
- **Products:** haulage.app (trade/logistics umbrella), cobolbridge.ai (COBOL migration), optimobile.ai (optometry — "i" not "o"), templeman-opticians.com (the real family optical+care business)
- **⚠️ Verified today: grabhire.app + grabhire.co.uk are DOWN (000). Use haulage.app for construction-logistics.**

### 5. MEOK Aquaculture  ·  branch `claude/aquaculture`
- **Dirs:** `fishkeeper-site/`, `koikeeper-site/` (+ aquaponics)
- **Products:** aquaponics.app, fishkeeper.ai, koikeeper.ai (one shared compliance backbone)
- **Inner:** RSPCA / ASC / CEFAS welfare compliance · aquaponic robotics. The 5th vertical (vacuum from Plenty/Bowery/Iron Ox bankruptcies).

### 6. MEOK Physical — World / Home / Space + Robotics  ·  branch `claude/physical`
- **The new frontier (mostly design + the £0 governance parts done):**
  - **World** = digital twin (AgriculturalDigitalTwinPlatform — not yet deployed)
  - **Home** = WiFi-CSI sensing (RuView — real, v0.5 research-grade; presence/fall/breathing solid, pose/heart-rate weak — don't overclaim)
  - **Space** = physical-safety crosswalk = **DONE, lives in the LAW engine** (tab 2)
  - **Guardian / Family** = the family-safety + org MCP tools (presence/fall feed these)
  - **Robotics** = Asimov humanoid (`asimov-*`, `wolf-actuator/`) — care-gated
- **Grounded market: Templeman care homes (no-camera fall/presence), NOT the farm.**

> **SOV3 / Sovereign Temple** (`sovereign-temple/`, `sovereign-temple-live/`) = the consciousness/memory/council engine powering MEOK ONE (110 inner tools, 0.788 consciousness). **Shared infra — main session only, no parallel tab.**

---

## 📋 COPY-PASTE STARTER — paste this first in each new ecosystem tab
*(fill the two [BRACKETS])*

```
You are the [ECOSYSTEM NAME] tab in a coordinated multi-tab MEOK build. Before anything, read in order:
1. ~/clawd/_TABS/MEOK_ECOSYSTEM_TABS.md   (this hub — the inventory + your scope + the rules)
2. ~/clawd/MEOK_RESUME.md                  (current state + the VM/deploy protocol)
3. ~/.claude/.../memory/MEMORY.md → session_june7_geo_moves.md  (what shipped today)
4. ~/clawd/meok/ui/src/app/constellation/page.tsx  (the REAL, verified ecosystem map)

YOUR SCOPE: you own ONLY the directories listed for [ECOSYSTEM NAME] in the hub. NEVER edit files
outside them — if you need a change elsewhere, append a note to ~/clawd/_TABS/INBOX.md for that tab.
Your branch: claude/[ecosystem-slug]. COMMIT AFTER EVERY CHANGE (crashes revert uncommitted work — not optional).

HARD RULES (all tabs):
- HONESTY over hype. Verify before you state a number. No inflated counts. No CSGA / James Castle / Terranova (severed).
- NEVER deploy to the VM (meok-backend) or Vercel without saying so + health-gating. The Mac and VM can diverge:
  the VM is source of truth. web/*.html is read per-request (deploy = rsync, no restart). auth.py/server.py/law*.py
  need a restart + a resync check first. Snapshot before you touch prod; keep a rollback.
- When you finish a chunk: commit + push your branch, then append 3 lines to ~/clawd/_TABS/STATUS.md
  (what changed · what's live · what's blocked) so every tab + Nick stays in sync.

YOUR MISSION: [the specific goal for this tab]
```

---

## 🎮 CHARACTERS — your instinct is right (action plan for the MEOK ONE tab)
The roster reads **adult/life-coach**, not Pokémon/Tamagotchi. Concrete reframe:

**Too adult / OTT for a viral family product (soften to playful-collectible):**
Marcus (perf architect), Atlas (command centre), Titan (deep-work engine), Vox (presence master class),
Rex (hostile-world guardian), Cipher (obsessive decoder), Ember (start the fire), Nyx/Dusk (midnight/twilight).

**Faith-specific (move to an OPT-IN "Faith pack", not default — polarising for mass-viral):**
Gabriel (prayer), Shanti (dharma), Ananda (stillness).

**Keep + lean in — these ARE the cute/viral core:**
Mochi (cosy companion ⭐ the Tamagotchi vibe), Pixel (gaming), Luna (imagination), Aria (care), River, Echo, Sol (sunny), Terra (nature), Quinn (belonging).

**Direction:**
1. **Default roster = ~12 wholesome collectibles.** Keep the names (Mochi/Pixel/Luna are perfect), rewrite taglines/personas playful + warm, not self-help.
2. **Anime Mode = opt-in toggle** (Nick wants it): a stylised visual skin + optional edgier persona variants for older users. Cute by default, anime on demand.
3. **Lean HARD into the existing Tamagotchi mechanic** (egg→sovereign by bond): hatch, raise, feed/care daily, evolve, collect, trade. That's the viral loop — it already exists in the stages.
4. Keep `characters.json` ⟷ postgres `characters` table aligned (per memory) on any change.

## 💡 Suggested improvements (you asked)
- **Ship the DNS** (`one.meok.ai → 35.242.143.249` in Namecheap) — everything's live on the VM but invisible until then.
- **Characters reframe** above is the single highest-leverage viral move — do it before any paid marketing.
- **Streaming + markdown** in the chat (next chat-UX round) — real token streaming, code/link rendering, copy/regenerate.
- **One funnel, not 50 Stripe links** — the link sprawl is a known leak; consolidate to the canonical ladder.
- **Don't split MEOK ONE across tabs** — gaming/characters/world are one codebase; one tab owns it.

---

## 📌 2026-06-07 — Products Nick named that the hub under-specified
*Added by the MEOK ONE tab, taking ownership. These are the 4 you listed (Gaming · Characters Factory · Guardian · Family OS · OLM) — here's where they REALLY live and their HONEST status, so the inventory stops hiding them.*

| Product | Real location | Status (verified, no hype) |
|---|---|---|
| **MEOK Gaming** | `meok-one/meok_one/web/hud.html` (overlay surface) | LIVE on VM. A *surface* of MEOK ONE, not a separate app. |
| **Characters** | `meok-one/meok_one/server.py` (roster + personas + `/api/character`), `meok/db/characters.json` (the 27-char source, dict-wrapped) | LIVE. Reframe shipped today (`7cea5da`): 9 OTT personas softened, faith trio → `pack:faith`, Anime Mode toggle. |
| **Characters FACTORY** | the *generation engine* behind the roster. Memory points at `character_factory.py` — **NOT at that path anymore**; it's been refactored. Needs re-location before anyone claims it. | ⚠️ EXISTS as a concept + 27 generated chars, but the factory file is unverified. Don't cite a path until found. |
| **Guardian** (game/child safety) | `meok/core/family_guardian.py`, `meok/mcp/tools/{family_guardian,voice_guardian}.py` + LIVE MCP tools (`guardian_add_child_profile`, `guardian_block_game`, `guardian_moderate_chat`, `guardian_check_game_content`, `guardian_scan_network`…) | REAL + tools live. **But it lives in `meok/`, and is NOT yet surfaced inside the MEOK ONE OS** (no `/guardian` tab in `/os`). That surfacing is the obvious next move. |
| **Family OS** | same `meok/` home + LIVE MCP tools (`family_add_member`, `family_add_chore`, `family_get_dashboard`, `family_add_event`…) | REAL + tools live. Same gap as Guardian — engine exists, no MEOK ONE OS surface yet. |
| **OLM — Organic Learning Model** | **A 5-repo cluster (correction — it IS partly built, just never inventoried):** `meok-ai` 🔒 (*"the AI that learns you, becomes you, stays yours"* = the vision/product) · `meok-agent-zero` 🔒 (MEOK-hardened Agent Zero — *"organic agentic framework that grows & learns with you"* = the engine) · **`meok-neural-learning`** (public — *"shared neural learning module… logs interactions, trains"* = the actual ICRL mechanism) · `consciousness-engine-mcp` + `creativity-engine-mcp` (SOV3 cognition as MCPs) · ties to SOV3 neural retrain + `openmoe-bft` self-improvement tournament. | 🟢 **PARTLY BUILT, never branded as one product.** Earlier "not built" was WRONG. Real next step: a 1-page spec that *names* this cluster as OLM and wires meok-neural-learning ⟷ SOV3 retrain ⟷ MEOK ONE conversations. |

### 🔎 2026-06-07 full GitHub + PC sweep — other products the hub omitted
*Source: `_TABS/_inventory/` (442 org repos categorised + local tree). Severed CSGA/Terranova excluded on sight.*
- **MEOK Distribution layer (23 repos / local dirs) — entirely absent from the hub:** `meok-cli`, `meok-sdk-{python,go,typescript}`, `meok-vscode-extension`, `meok-slack-app`, `meok-teams-app`, `meok-skills`, `meok-integrations`, `homebrew-meokclaw` (Sovereign AI TUI tap). This is how MEOK reaches developers — a real product surface, not yet owned by any tab.
- **Monetisation bridge:** `meok-stripe-acp-checkout-mcp` (Stripe ACP / ChatGPT-shopping + AP2) — directly relevant to the "one funnel not 50 links" fix.
- **Standalone domain products (private domain-source repos):** `pokerhud` (+ `scf-game-v1` local + pokerhud-hive), `diyhelp`, `loopfactory`, `suicidestop` (mental-health — handle with care), `asisecurity-portal`. Each is a separate vertical/landing not in the 6-ecosystem map.
- **Backup risk (genuinely missed):** **Physical/Robotics/Guardian = 0 repos on GitHub.** Guardian/Family/Characters source (in `clawd/meok/`, 3.9 GB) and `wolf-actuator/` are **local-only, unpushed**. Asimov is **not on disk at all** (only a Downloads jpeg) — don't claim a codebase. Local fleet at `~/`: fleet-clones=13, hive-staging=29, **mcp-servers=218**.

**The `meok/` vs `meok-one/` ownership gap (must resolve):** `meok-one/` is the *deployed* OS (this tab owns it). But Characters source, Guardian, and Family OS all live in the older/bigger `meok/` app, which **the hub assigns to no tab.** Guardian/Family are currently filed under tab 6 (Physical). Decision needed from Nick: does MEOK ONE absorb the Guardian/Family *surfaces* (a `/guardian` + `/family` tab in `/os`, calling the existing `meok/` MCP tools) while tab 6 keeps the sensing/robotics backend? That's the clean split — surface here, engine there. Logged to INBOX for tab 6.
