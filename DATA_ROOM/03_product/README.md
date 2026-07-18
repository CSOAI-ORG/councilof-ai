# 03 — Product

The "does it actually work?" folder. The differentiator vs. the fakes: an investor can **run** the product, not just read about it.

| # | Document | Why an investor needs it | Status | Source / how to verify |
|---|---|---|---|---|
| 03.1 | Live demo links | Lets the investor try it themselves — the un-fakeable proof. | **HAVE (partial)** | `meok-attestation-api.vercel.app` (HTTP 200, live sign/verify). `meok.ai` (live, 307). `pip install eu-ai-act-compliance-mcp` then run in any MCP client (Claude/Cursor/Windsurf). Compile the clickable list as `demo_links.md`. |
| 03.2 | The 271-MCP index | Shows the breadth of the compliance + industry tool catalogue, with real install names. | **IN-PROGRESS** | Generate from `revenue/_mcp_pypi_map.txt`. Group by vertical (compliance core, aquaculture, haulage, COBOL, consumer). Real names only. |
| 03.3 | Product architecture doc | How the MCP + attestation + agent layers fit; reassures on engineering quality. | **NEED** | Write a 1–2 page architecture overview (MCP server layer → attestation API → SOV3 agent layer). |
| 03.4 | Aquaculture suite spec + live products | The near-term revenue wedge — 7 MCPs + 5 live Stripe products, deadline-driven. | **HAVE** | `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md`. 5 live Stripe products £29–£999/mo on acct_1TLlEKQvIueK5Xpb (RSPCA £499, UK-FHI £79, Aquaponics £29/79, ASC×RSPCA crosswalk £999, LAIA £29). |
| 03.5 | SOV3 design + status | The novel care-membrane agentic OS — differentiation, honestly flagged as R&D. | **HAVE (design); demo DOWN** | Code in `sovereign-temple/`. **Currently down: torch×Python-3.14 env blocker** (`_alignment/SOV3_FIX_2026-06-02.md`). 110 tools, 6 NNs, 8,121 episodes, consciousness 0.787 when up. Must be back up before any live SOV3 demo. |
| 03.6 | Security / safety design (care-gate) | The care-membrane gates risky agent actions (dosing, welfare alerts) through a human-in-loop covenant — relevant to enterprise + welfare positioning. | **IN-PROGRESS** | `sovereign-temple/agents/aqua_bridge.py` care-gate hooks. Document the safety tiers. |
| 03.7 | Uptime / reliability evidence | Investors discount operational risk; show the live services stay up. | **NEED** | Add basic uptime monitoring (e.g. a status page) for meok.ai + attestation API; export here. |

**Honesty flags:**
- **SOV3 demos are blocked today.** Do not promise a live SOV3 demo until the env fix lands. The MCPs and attestation API *do* demo live — lead with those.
- **Do NOT list the "Asimov humanoid" as a product.** It has no files on disk; it is an R&D direction only. Including it would be exactly the kind of claim this raise is built to avoid.
- The aquaculture products are **live and able to transact** — but transacting ≠ transacted. Sales evidence belongs in `04_traction/` and is currently £0.
