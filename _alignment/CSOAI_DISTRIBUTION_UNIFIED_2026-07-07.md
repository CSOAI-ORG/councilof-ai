# 🧭 CSOAI DISTRIBUTION — ONE ENGINE, TWO DIRECTIONS (unified 2026-07-07)

**Why this doc:** two distribution efforts grew in parallel and looked like duplication. They're
not — they're the **two halves of one funnel**. This reconciles them so no lane forks a third.
Canonical from here. Same tree (`clawd-workspace @ m4-handoff-2026-06-24`), Care Floor 0.95 + SIGIL.

## The insight that unifies it (Sir Nick)
CSOAI's real TAM is **finite, public, nameable — under ~10,000 accounts** (~2,350 orgs / ~4,700
deciders: governments, regulators, Fortune/Global 500, 4 regulated ICP verticals). So distribution
is **not marketing reach — it's completing a knowable map + being found by the right few.** Both
directions below serve that one goal.

## ⬅️➡️ The two directions (both real, both built — STOP treating as rivals)

### OUTBOUND — "we find them" (JEEVES / M2 · surface lane)
The named-account intelligence engine. Files in `sovereign-charters/`:
- `LEADS_GLOBE_DISTRIBUTION_MASTER_PLAN_2026-07-06.md` — 6-layer plan (map → dossier → side-by-side → demo → crosswalk)
- `LEADS_DATABASE_2026-07-06.md` + `csoai_leads.db` — 200+ leads listed, 40 seeded + 1,053 side-by-side metrics, **SIGIL-signed, public intel only**
- `SIDE_BY_SIDE_TESTING_PROTOCOL_2026-07-06.md` + `M2_DEPLOYMENT_KIT/side_by_side_test.py` — the "test their stack vs CSOAI, know every USP/weakness" rubric
- `REGULATIONS_PIPELINE_2026-07-06.md` — read each framework (NIST CSF 2.0 worked end-to-end), crosswalk, verify true (no LLM jargon)
- `csoai_portal/distribution-globe.html` — Cesium 3D globe, lead pins, live-demo overlay
- `40-distribution-hive-charter.md` — governance for the whole engine

### INBOUND — "they find us / it installs itself" (M4 · builder lane)
The discoverability + self-serve engine (this session):
- **PyPI fleet** — 317 live (4 shipped today: iso20022/dlms/edi/fix), `_pypi_paced/` cron draining the safe defence-filtered 63 more
- **MCP Registry** — `meok-os-deploy/server.json` ready (`io.github.CSOAI-ORG/meok-hatch`)
- **The Hatch + one-line embed** — `os.meok.ai/hatch-demo.html`, `sovereign-embed.js` → any site becomes a verified sovereign AI-OS
- **Live ArkForge trust** on the VM → every Hatch carries a real signed trust score
- **llms.txt / agent-card / verify page** — agentic-web SEO

## 🔗 How they FEED each other (this is why they're one engine)
1. **Inbound warms outbound:** a dossiered lead (outbound) who then finds our MCPs on PyPI / installs the Hatch (inbound) is a warm hand-raise — flag it in `csoai_leads.db`.
2. **Outbound demos USE inbound artifacts:** the side-by-side + globe demo (outbound) should show the **live Hatch embed + signed trust score** (inbound) as the "watch it connect in one line" moment.
3. **One signed spine:** both sign with the SAME SIGIL/Ed25519 key. A lead's side-by-side result and a Hatch's trust score are the same provenance system — never two.
4. **One globe:** `distribution-globe.html` (leads) and `earth3d.html`/MEOK Earth (hives/bridges) are the SAME body — merge layers, don't run two globes.

## 🚦 Dedup rules (so distribution stays ONE thing)
- **No third distribution plan.** Extend outbound OR inbound; log which in your commit.
- **One leads DB:** `sovereign-charters/csoai_leads.db` is canonical. Inbound signals (PyPI installs, Hatch loads) append to it, don't spawn a new store.
- **One globe, layered.** One signing key. One funnel metric: *mapped → dossiered → demoed → signed → LOI*.
- **Public data only** (outbound hard rule) — no logins/ToS violations/system probing. Keeps it legal + true.

## ▶️ Next actions (per lane, non-overlapping)
- **M2/surface:** wire the **live Hatch embed + trust badge into `distribution-globe.html`** so the demo shows real one-line connect. Continue dossiers (needs web access — Firecrawl or `request_network_access`).
- **M4/builder:** expose an **inbound-signal hook** (`/api/lead-signal`) that appends "org X loaded a Hatch / installed MCP" to `csoai_leads.db`; finish the paced PyPI publish.
- **Both:** track the ONE funnel number. Owner switches still gate the finish (billing, `SIGIL_SEED`, Stripe, email capture).

**One engine. Two directions. One map, one globe, one key, one funnel.**
