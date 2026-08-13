---
name: coai-frontend
description: Subject-matter expert for the Council of AI (councilof.ai) front end — its architecture, the EU-gov-style library IA, the 8 content sectors, the naming canon, the deploy path, and the align-not-delete cleanup process. Load for any councilof.ai front-end work: cleanup, alignment, new pages, deploys.
---

# Council of AI — Front-End SME

## What COAI is (the source of truth all copy aligns to)
An **independent measurement instrument**. We measure AI systems against the rules that govern them, sign the result (Ed25519), and publish what we cannot yet measure. **Not a certifier, not an enforcer, no accreditation chain.** Method: deterministic gold labels · no model judges another · unparsed counts incorrect · nothing quoted below n≥30 · every number recomputable from its rows · corrections published never silently edited.

## The site at a glance
- **Stack:** Vite + React + wouter + Tailwind in `client/`. Root `src/` is dead — ignore it.
- **Scale:** ~417 routes, ~276 page files. This is 10× too many for the primary experience.
- **Deploy:** CF Pages project `councilof-ai`. Build+deploy from the Mac:
  `npx vite build --config client/vite.config.ts` then
  `CLOUDFLARE_API_TOKEN=<pages-edit-token> wrangler pages deploy dist/client --project-name=councilof-ai --branch=main --commit-dirty=true`
  (token is account-level Pages:Edit, installed on the pod at `/root/.sovos/cf.env`; also usable from Mac.)
- **Lazy chunks:** SovOS/axis data lives in `SovOS.r2-*.js`, not the HTML shell — grep the chunk, not just index.html, when verifying live.

## The 8 content sectors (library taxonomy + KB domains)
1. **EU AI Act / Regulation** (~33) — Art 5, Art 50, Annex III, DORA, NIS2, CRA, GDPR crosswalks. Biggest sector.
2. **GSPC Axes / Benchmarks** (~9 core) — the 13 axes; the flagship.
3. **Governance / Frameworks** — NIST AI RMF, ISO 42001, OSCAL, readiness.
4. **Certification / Academy** (~22–94 touch) — MUST reframe: COAI does NOT certify. Fold to "Council Academy / course completion attests training, not conformity."
5. **Regions / Countries** — jurisdiction pages (TC260, UK, EU, US).
6. **Layer-0 / MCP / Tech** — compliance MCPs, C2PA/Art 50 watermarking, signature verification.
7. **OS / Product / Demo** — Council OS (never "Sovereign OS"), arena, city, globe.
8. **Company / About / Legal** — charter, pricing, privacy, contact.

## The canonical 13 axes (align every axis reference to this)
gov, prv, agi(safety), asi(continuity), mcp(conformance), oss(openness), mach, care, xr(cross-reality), det(detector-interop), art5, swarm, affect
Source of truth: `csoai-static-deploy2/SOVOS/GSPC_AXIS_REGISTRY.json`. Banks 13/13 public on HF+Kaggle. Boards: `csoai/gspc-boards` (honest MEASURED/UNMEASURED).

## Naming canon (BINDING — scrub on sight)
- Datasets: `csoai/gspc-<axis>`. Product: **Council of AI / Council OS**.
- NEVER on any public surface: `SOVOS`, `SOV OS`, `Sovereign OS`, `SOV<n>` (sov3/sov34), `sov-*`, or "sovereign" as product/weights language. Sovereign-class names are INTERNAL only.
- No certification/certify/certified language — COAI issues no conformity marks.
- No unverified counters (`200+ organisations`, `billion`, `signed episodes`) — every number needs a source endpoint + verified date, or it goes.

## THE CLEANUP DOCTRINE — align, don't delete (EU-gov pattern)
Old pages are NOT deleted — they are **libraried** like a government publications archive (gov.uk / europa.eu):
- **Primary nav** = the lean current experience: Measurement (13 axes + board), Method, EU AI Act, Academy, About. ~15-25 pages.
- **Footer "Library"** = a secondary-nav archive of everything else, organized by the 8 sectors above, dated, searchable. Nothing lost, SEO retained, main experience clean.
- Each archived page gets an "Archived / historical" banner + canonical link to its current replacement if one exists.

## The align process (per session)
1. **Triage** every route → KEEP (primary) / LIBRARY (archive under a sector) / FIX (rewrite copy) / REDIRECT (dead). Nothing touched before its verdict.
2. **Build the Library IA** — footer menu by sector, archive route prefix (e.g. `/library/<sector>/<page>`), archived banner component.
3. **Align survivors** — apply the naming canon + 13-axis truth + kill counters. Grep clusters: CEASAI (~94 files), sovereign (~18), counters (~10).
4. **Verify + deploy** from Mac; grep the live lazy chunk, not just the shell.
5. **Guardrail** — a content-linter (killed terms, non-canon dates, unverified counters) in CI so drift can't return.

## Verified pitfalls (learned the hard way)
- Kaggle ignores API **title** edits — visibility/title are UI-only (owner login).
- `grep -c MEASURED` matches "UN­MEASURED" — count exact status, never substring.
- `pkill -f wire_x` over SSH kills its own shell if the cmdline contains the pattern — use `[w]ire_x` bracket trick.
- Ephemeral pod paths (`/workspace`, `/root`, `/usr/local`) wipe on reboot; only `/runpod` volume + HF + git survive. Never claim "durable" for anything living only on an ephemeral pod path.

## Who the front end serves — DUAL AUDIENCE (design for both)
COAI is set up as **A2A + human paygo, an RAS delivered as SaaS**:
- **A2A (agents)** — machine-readable everything: `/api/gspc`, signed JSON, MCP endpoints, well-structured schema.org markup. Agents consume the measurement; the site must be queryable, not just viewable.
- **Humans (paygo SaaS)** — clean human UX: run a signed assessment, read a board, buy a report. Pay-as-you-go, not enterprise-gated.
- **RAS** = the measurement/risk-assessment service is the product; SaaS is the delivery.

## AEO / GEO — why "library, don't delete" is a GROWTH strategy, not just tidiness
Answer-Engine Optimization / Generative-Engine Optimization: AI answer engines (ChatGPT, Perplexity, Claude, Google AIO) cite well-structured, factual, deep-coverage sites. Therefore:
- **Every libraried page is citation surface.** Deleting 250 pages = deleting 250 chances to be the cited source on an EU-AI-Act / governance query. Keep them, clean them, archive them — the AEO value compounds.
- **Structure for citation:** each page = one clear factual claim, dated, sourced, with schema.org (Dataset, Article, FAQPage, GovernmentOrganization). The 410-verbatim-EU-AI-Act pages and per-axis pages are AEO gold — the answer engine's preferred primary source.
- **The honest-measurement method IS the AEO moat:** answer engines increasingly prefer sources that cite evidence and disclose uncertainty. "UNMEASURED where n<30, every number recomputable" is exactly what a citation-ranking model rewards.
- **A2A + AEO converge:** the same structured, signed, machine-readable output serves both the agent calling the API and the answer engine indexing the page.

## Practical consequence for cleanup
Reframe the whole job: it is **not** "delete clutter" — it is "convert 276 pages from a messy pile into a clean, dated, schema-marked, sector-organized LIBRARY that ranks in answer engines and serves agents." Primary nav stays lean for humans; the library is the AEO/A2A engine underneath.
