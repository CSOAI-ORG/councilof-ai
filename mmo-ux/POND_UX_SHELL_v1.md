# 🐉 MMO-UX SHELL DESIGN — THE POND — v1.0

**Date:** 2026-06-25
**Owner:** JEEVES (strategic commander)
**Lane:** MMO-UX (The Pond desktop, HUD, quest cards)

## 1. CONCEPT
The Pond is Nick's CSOAI MMO-UX — a desktop experience that
gamifies AI compliance. Like World of Warcraft's quest log + 
Stardew Valley's farm + Vanta's dashboard. The Pond = your farm.
The fish = your AI agents. The quests = EU AI Act articles.

## 2. LAYOUT
```
+--------------------------------------------------------+
| HUD: Top bar (HP/MP/XP/Streak)                         |
+--------------------------------------------------------+
|  Sidebar        | Main Canvas                          |
|  - Quests       | - The Pond (koi farm)                |
|  - Skills       | - 47 Agents in town                  |
|  - Inventory    | - BFT Council chamber               |
|  - Guild        | - Watchdog Cert Garden              |
|  - Shop         | - Dose-Response Lab                 |
+--------------------------------------------------------+
|  Bottom: Chat + SIGIL feed                            |
+--------------------------------------------------------+
```

## 3. CORE MECHANICS
- **HP = Watchdog Cert streak** (1 cert = 1 HP, max 100)
- **MP = BFT votes cast** (1 vote = 1 MP)
- **XP = Articles audited** (Article 50 = 50 XP)
- **Streak = Days of continuous compliance**
- **Quests = EU AI Act Article tasks**
  - Article 5 (prohibited) = "Bane the Forbidden"
  - Article 6 (high-risk) = "Classify the Risky"
  - Article 9 (risk mgmt) = "Build the Wall"
  - Article 10 (data) = "Tend the Pond"
  - Article 13 (transparency) = "Write the Tome"
  - Article 14 (oversight) = "Convene the Council"
  - Article 50 (transparency) = "Light the Beacon"

## 4. POND (the farm)
- 4 waterfalls (real — at Nick's farm in Yorkshire)
- 9 sensors (water quality, fish behavior)
- 6.5 acres (the actual farm)
- 19,000 sqft (the MEOK Labs building)
- Koi fish = real AI agents
- Harvest = real Watchdog Certs

## 5. STACK
- Frontend: React + Vite + Tailwind
- Backend: SOV3 (port 3101)
- Storage: SQLite (local) + Postgres (prod)
- Game loop: server.js (Node) at port 3001
- Auth: Clerk (already in stack)

## 6. DELIVERABLES
- /mmo-ux/index.html (shell)
- /mmo-ux/hud.tsx (top bar)
- /mmo-ux/quest-cards.tsx (sidebar)
- /mmo-ux/pond-canvas.tsx (main)
- /mmo-ux/sigil-feed.tsx (bottom)
