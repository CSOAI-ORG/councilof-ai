# Listing Drift Ledger — CSOAI / Council of AI — 2026-09-12

READ-ONLY audit. No accounts created, no forms submitted, nothing posted.
All observations made 2026-09-12 (~06:00–07:00 BST) via SearchWeb, FetchURL, and direct
read-only GETs (npm registry JSON, PyPI JSON, official MCP registry API, HF API,
councilof.ai public APIs, Zenodo API).

## Ground-truth note (IMPORTANT — adjudication needed)

The audit brief supplied these "correct current facts": **22 axes · 15 measured · 7
UNMEASURED slots · 169 signed cards · 425 stablecoins indexed (1 deeply measured) ·
$0.00 external revenue · "measurement, never certification"**.

Live re-check against the estate's own source of truth on 2026-09-12:

- `GET https://councilof.ai/api/gspc` → `totals.axes=22, measured_axes=22,
  unmeasured_axes=0`, `public_count="22 axis · 22 measured"` (14 model-comparison +
  8 deterministic-facts runs). **This contradicts the brief's "15 measured · 7
  UNMEASURED".** The homepage, /benchmarks, the GitHub README and the board badge all
  agree with the API. Either the brief's numbers are stale, or the live API itself has
  drifted — **this is the single most important item to adjudicate before correcting
  any surface**, because every surface quoting "22 measured" would otherwise be
  mis-flagged.
- `GET https://councilof.ai/root.json` → `card_count=169`, `as_of 2026-09-11T12:45:44Z`
  — matches the brief's 169 signed cards (public-root population).
- "425 stablecoins indexed" matches the GitHub repo short description. ✔
- `GET /api/revenue` reports `distinct_nonself_payers = 1 all-time · 1 settlement`
  (the 0.02 USDC stranger payer) — consistent with "$0.00 material external revenue";
  x402-list.com independently shows $0.00 / 0 buyers in 30d. ✔
- "Measurement, not certification" is the dominant wording on all current surfaces. ✔

Classifications below treat the **live API** as truth where it and the brief disagree,
and flag the disagreement explicitly.

## Ledger

| Surface | Exists | Classification | Drift/Correction needed | Evidence URL | Observed at |
|---|---|---|---|---|---|
| npm `csoai-gspc-mcp` | Yes — v0.2.1 (0.1.0, 0.2.0, 0.2.1), Apache-2.0, maintainer csga_global | LIVE-ACCURATE | None. Desc: "Stdio MCP server for the live GSPC board, signed measurement cards, and public-root merkle…" Current per estate README (published 2026-09-04, hand-published; daily spray can't push — expected). | https://www.npmjs.com/package/csoai-gspc-mcp | 2026-09-12 |
| npm `@csgaglobal/*` suite (13 pkgs: csoai-governance, casa-certification, healthcare-ai, financial-ai, biometrics-ai, employment-ai, law-enforcement-ai, gaming-ai, oneos-education, ai-economy-infrastructure, …) | Yes | LIVE-DRIFT | Certification-era claims live: "@csgaglobal/casa-certification — CASA Certification - CSOAI-Authorised Safety Assessment MCP Server"; "@csgaglobal/csoai-governance — …25 international framework crosswalks, CASA certification…". Wrong org namespace (CSGA vs CSOAI). Retire, deprecate (`npm deprecate`), or re-describe as measurement. Owner-gated (npm login; note AGENTS.md npm-2FA gate). | https://www.npmjs.com/package/@csgaglobal/casa-certification | 2026-09-12 |
| npm `csoai-governance-mcp` 0.1.0 (2026-07-07) | Yes | LIVE-STALE | "CSOAI Sovereign governance MCP — seal any AI artifact to CSOAI Layer 0…" — "Layer 0"/"seal" vocabulary is pre-Council-rename. Deprecate or re-describe. Owner-gated. | https://www.npmjs.com/package/csoai-governance-mcp | 2026-09-12 |
| PyPI `csoai-gspc` | Yes — 0.2.20260911 (daily-versioned) | LIVE-ACCURATE | None. "Read the live GSPC AI-governance board and verify its Ed25519-signed measurement cards. Three states only: VALID, INVALID, UNCHECKABLE." Reader-only, no frozen counts. | https://pypi.org/project/csoai-gspc/ | 2026-09-12 |
| PyPI `csoai` | Yes — 0.2.2 | LIVE-ACCURATE | None. "Council of AI — signed, deterministic AI-governance measurement… measurement, not certification." mcp-name io.github.CSOAI-ORG/gspc. | https://pypi.org/project/csoai/ | 2026-09-12 |
| PyPI `csoai-defoneos-mcp` 1.0.1 (uploaded **2026-09-06**) | Yes | **LIVE-DRIFT (retired claims)** | Summary: "CSOAI DEFONEOS — sovereign UK defence-AI **CERTIFICATION** surface (**33-agent BFT council** + DEFONEOS-SEAL signed credential + MITRE ATLAS + …)". Both the "CERTIFICATION" wording (violates the 1 Aug Register ruling: Living Attestation, never Certification) and the retired "33-agent BFT council" claim are live on PyPI — uploaded 6 days ago. DEFONEOS compartment doctrine also bars public certification framing. Retire/re-describe urgently. Owner-gated (PyPI). | https://pypi.org/project/csoai-defoneos-mcp/ (mirrored at getsafety.com/packages/pypi/csoai-defoneos-mcp) | 2026-09-12 |
| PyPI `eu-ai-act-compliance-mcp` | Yes | **LIVE-DRIFT** | Live description claims: "**CSOAI-ORG is the ONLY compliance vendor** with the Omnibus delay built into the tooling" (forbidden "only" claim); "Pro (£199/mo)… HMAC-signed attestation" (certification-era monetisation); "compliance MCP with 404 verbatim articles" (stale count — corpus is now 417 provisions); "councilof.ai = EU AI Act compliance marketplace" framing elsewhere in repo README. Owner-gated (PyPI/GitHub). | https://pypi.org/project/eu-ai-act-compliance-mcp/ | 2026-09-12 |
| PyPI `dora-compliance-mcp` | Yes | **LIVE-DRIFT** | Same "ONLY compliance vendor" claim + "Pro £199/mo HMAC-signed attestation" block. Owner-gated. | https://pypi.org/project/dora-compliance-mcp/ | 2026-09-12 |
| PyPI `gdpr-compliance-ai-mcp` 1.0.2 | Yes | **LIVE-DRIFT + broken links** | Offers "HMAC-SHA256 signed **compliance certificate**", Pro £199/mo, Enterprise £1,499/mo; attestation API points at `meok-attestation-api.vercel.app` — Vercel projects deleted 31 Aug 2026 → dead links. Owner-gated. | https://pypi.org/project/gdpr-compliance-ai-mcp/1.0.2/ | 2026-09-12 |
| Glama.ai — `CSOAI-ORG/councilof-ai` | Yes | LIVE-ACCURATE | Mirrors current org README (derived 2026-09-09): "Measurement, not certification", 22-axis board, correct never-do list. Numbers one spray cycle behind live (335-card index / 168-leaf root vs live 169 @ 2026-09-11) — self-corrects next crawl. | https://glama.ai/mcp/servers/CSOAI-ORG/councilof-ai | 2026-09-12 |
| Glama.ai — legacy CSOAI-ORG fleet (meok-governance-smithery, health-check-ai-mcp, data-science-ai-mcp, etc.) | Yes (many) | LIVE-DRIFT | Template READMEs still carry "Built by MEOK AI Labs", "councilof.ai = EU AI Act compliance marketplace", "Pro: $99/mo — Full MCP suite", "Enterprise: $499/mo", "EU AI Act compliance built-in ✅" checklist marketing, and stale "16,300 monthly installs"-era ecosystem claims. Source = old GitHub repo READMEs; fixing the repos fixes Glama on recrawl. Owner-gated (GitHub). | https://glama.ai/mcp/servers/CSOAI-ORG/meok-governance-smithery | 2026-09-12 |
| MCP.so | No listing found for csoai/councilof-ai/gspc | MISSING | Estate's own /traction page (2026-08-10) already records "Smithery / mcpmarket: search 'csoai' returned 0 hits — backlog". MCP.so still blank 2026-09-12. Submission is owner-gated. | https://mcp.so/search?q=csoai | 2026-09-12 |
| PulseMCP | Yes — CSOAI-ORG servers indexed (e.g. OTP AI; mcptoplist cross-registry data shows "Council of AI GSPC" listed on PulseMCP, ~9 versions tracked) | LIVE-STALE (minor) | Listings mirror official-registry version rows, so old "13 of 14"/"by MEOK AI Labs" descriptions persist alongside current ones (see official registry row). Content is JS-rendered; individual listing text not fully verifiable read-only. | https://www.pulsemcp.com/servers (CSOAI-ORG entries) | 2026-09-12 |
| Smithery.ai | Yes — only `csgaglobal/csoai-compliance-council` | LIVE-STALE (abandoned shell) | Score 43/100, "No description", "last deployed" (no date), old `csgaglobal` org handle and "compliance-council" certification-era name. Either delete or replace with the real GSPC server. Owner-gated (Smithery login). | https://smithery.ai/servers/csgaglobal/csoai-compliance-council | 2026-09-12 |
| mcpservers.org — "Council Of AI — GSPC" (csoai-org/councilof-ai) | Yes | LIVE-ACCURATE | Full mirror of current org README incl. never-do list. One spray cycle behind live root (168 leaves shown vs 169 live). | https://mcpservers.org/servers/csoai-org/councilof-ai | 2026-09-12 |
| mcpservers.org — category listing "Council of AI GSPC MCP" | Yes (second entry) | LIVE-STALE | Blurb: "11 HTTP tools (7 free + 4 x402). Board 22·22·0 · Hub 885/885/0 … Registry io.github.CSOAI-ORG/gspc **v1.3.0**" — registry latest is v1.4.0 (12 tools, 8 free + 4 x402), Hub cells now 1119/1119/0. Will refresh on recrawl; no owner action possible. | https://mcpservers.org/category/other | 2026-09-12 |
| mcpservers.org — duplicate entry `/servers/councilof-ai-mcp` | Yes | DEAD (empty page) | Renders title + boilerplate only, no content. Duplicate/stale stub of the main listing. Not owner-fixable directly. | https://mcpservers.org/servers/councilof-ai-mcp | 2026-09-12 |
| Official MCP registry — `io.github.CSOAI-ORG/gspc` | Yes — 9 version rows v1.0.0→v1.4.0; latest **v1.4.0** (2026-09-07) | LIVE-ACCURATE (latest) / LIVE-STALE (old rows) | Latest: "12 HTTP tools (8 free, 4 x402). GSPC board + Ed25519 + trust counts. Measure, never certify." ✔. Old immutable rows still say "board (13 of 14)" (v1.0.1/v1.0.2) — stale counts but version-pinned, acceptable; suppressing old rows is owner-gated (registry publish token). | https://registry.modelcontextprotocol.io/v0/servers?search=gspc | 2026-09-12 |
| Official MCP registry — other CSOAI-ORG servers | Yes — 100+ version rows (cap hit; org has ~368 servers per mcptoplist) | LIVE-STALE (old rows) | Older version rows carry "…MCP server by MEOK AI Labs" (org-name drift MEOK vs CSOAI/Council of AI) and certification-era descriptions. Rows are immutable per version; only new publishes fix forward. | https://registry.modelcontextprotocol.io/v0/servers?search=CSOAI | 2026-09-12 |
| GitHub github-mcp-server Discussion #3118 (curation request) | Yes (2026-08-19) | LIVE-STALE | Says "PyPI package `csoai` 0.2.1, source `CSAO-ORG/csoai-static-deploy2`" (org typo **CSAO-ORG**) and "13 measured of 14" (pre-jail-TIE sitting). A comment correcting it is owner-gated (GitHub login); low priority — it's a dated request, not a listing. | https://github.com/github/github-mcp-server/discussions/3118 | 2026-09-12 |
| Hugging Face org `huggingface.co/csoai` | Yes — ~100 datasets + ~37 spaces; several updated **2026-09-12** (gspc-hub-cards, gspc-boards, financial-axis sets) | LIVE-ACCURATE | Org active and current; `csoai/gspc-board` snapshot carries the board byte-for-byte. No certification wording observed in dataset names. Spot-check only (not every dataset card read) — deep card-by-card check is follow-up. | https://huggingface.co/csoai | 2026-09-12 |
| Zenodo DOI 10.5281/zenodo.21991104 | Yes — resolves to record 10.5281/zenodo.21991105 (2026-08-18) | LIVE-ACCURATE | Title: "GSPC Methodology and the 417-Provision Frozen Corpus Anchor — Council of AI (CSOAI)". Description: "deterministic predicates, no LLM-as-judge, Ed25519-signed attestations, hash-chained ledger… Measurement, not certification." Methodology correctly described; also correctly supersedes stale 21755656. | https://zenodo.org/doi/10.5281/zenodo.21991104 | 2026-09-12 |
| GitHub org page github.com/CSOAI-ORG (profile README) | Yes | LIVE-STALE | "Signed cards **335**" and root "merkle d438fb12…" vs live root.json 169 @ 2026-09-11 (README derived earlier; self-declares "if this file and the API disagree, the API is right"). Wording otherwise accurate ("Measurement, not certification. Not a notified body."). It also honestly flags `csoai.org/root.json` as STALE unsigned. Re-derive fixes it (scripts/github/org-readme.py). Owner-gated (GitHub). | https://github.com/CSOAI-ORG | 2026-09-12 |
| GitHub repo `CSOAI-ORG/councilof-ai` short description | Yes | LIVE-STALE | "CSOAI flagship — 425 stablecoins indexed, **371 signed cards**, 22 axes measured…" — 371 matches no live population (signed index 335/336, root 169). Fix repo "About" text. Owner-gated (GitHub). | https://github.com/CSOAI-ORG/councilof-ai | 2026-09-12 |
| Google/Bing indexing of councilof.ai | Yes — homepage (indexed 2026-09-12), /tools, /benchmarks, /blog, /embed, /harness, /industries, /registers, /what-is-new, /traction, /benchmark-index all surfaced | LIVE-ACCURATE | Coverage good and current. `site:councilof.ai` returns the post-rename Council pages; no legacy "certification" pages surfaced in results sampled. /roi page meta still says "CSOAI's AI governance platform" (mild legacy framing, on-site, owner-fixable). | https://councilof.ai/ | 2026-09-12 |
| Kaggle `nicktempleman/csoai-gspc-living-board` (bonus surface, named in README) | Yes | LIVE-STALE (self-acknowledged) | Estate README itself marks it "no — behind" (latest 2026-09-07T15:13:59Z vs live root 2026-09-11). Owner-gated (Kaggle). | https://www.kaggle.com/nicktempleman | 2026-09-12 |
| csoai.org/root.json (bonus) | Yes | LIVE-STALE (self-acknowledged) | Org README flags it: "STALE unsigned merkle 4a9a5036… — do not quote as the envelope". Corrective: re-sign/re-publish or 301 to councilof.ai/root.json. Owner-gated (Wrangler csoai-site deploy). | https://csoai.org/root.json | 2026-09-12 |
| Third-party mirror: mcpserverlist.net "CSOAI GSPC measurement" | Yes | **LIVE-DRIFT (worst wording found)** | Description: "CSOAI Sovereign AI static deploy — **ASI evolution, free GPU fleet, 500+ gov pages, SOV33 substrate**" — leaks internal codename SOV33, irrelevant sovereign-infra claims, no measurement wording at all. Mirrors an old GitHub repo description of `csoai-static-deploy2`; fixing the repo description fixes it on recrawl. Owner-gated (GitHub). | https://mcpserverlist.net/servers/csoai-gspc-measurement | 2026-09-12 |
| Third-party: lobehub.com/mcp/csoai-org-councilof-ai | Yes (updated 2026-09-11) | LIVE-ACCURATE | "Independent AI-governance measurement platform providing a 22-axis GSPC board, signed measurement cards, transparency logs, and verification…" Mirror of current README. | https://lobehub.com/mcp/csoai-org-councilof-ai | 2026-09-12 |
| Third-party: x402-list.com "Council of AI GSPC" | Yes (2026-09-11) | LIVE-ACCURATE | "Independent AI governance MEASUREMENT body… a grade is never sold"; traction $0.00 / 0 buyers 30d — consistent with $0.00 external revenue. | https://x402-list.com/services/council-of-ai-gspc | 2026-09-12 |
| Third-party: robinsaige.com verdict page | Yes (probed 2026-09-06) | LIVE-ACCURATE | Reports operator's own registry description verbatim; verdict "allow — alive & usable"; "no confirmed drift in 4 probes". | https://robinsaige.com/s/io.github.CSOAI-ORG/gspc | 2026-09-12 |
| Third-party: licium.ai endpoint record | Yes (last checked 2026-08-17) | LIVE-STALE (minor) | Tracks old endpoint `csoai-gspc-mcp.nicholastempleman.workers.dev/mcp` v1.0.0 with tools "measure, verify, jail-probe" (jail-probe no longer advertised). Current endpoint is councilof.ai/mcp v1.4.0. Not owner-fixable; ages out. | https://www.licium.ai/directory/csoai-gspc-mcp-nicholastempleman-workers-dev-mcp~aHR0cHM6Ly9jc29haS1nc3BjLW1jcC5uaWNob2xhc3RlbXBsZW1hbi53b3JrZXJzLmRldi9tY3A | 2026-09-12 |

## Impersonation / retired-claim sweep

| Retired claim | Found live? | Where |
|---|---|---|
| "33-seat / 33-agent BFT council" | **YES** | PyPI `csoai-defoneos-mcp` 1.0.1 description (uploaded 2026-09-06) |
| "CSOAI certification / certifies" | **YES** | PyPI `csoai-defoneos-mcp` ("CERTIFICATION surface"), `gdpr-compliance-ai-mcp` ("signed compliance certificate"), npm `@csgaglobal/casa-certification` ("CSOAI-Authorised Safety Assessment"), `@csgaglobal/csoai-governance` ("CASA certification") |
| "GDPR compliant badge" | Not found verbatim | Closest: gdpr-compliance-ai-mcp "compliance certificate" wording (above) |
| "£20M scholarship" | Not found | No public hits |
| Third-party impersonation (unaffiliated party claiming CSOAI certification services) | Not found | All certification-worded listings trace to estate-owned accounts (csgaglobal / CSOAI-ORG / meok-labs) — these are **self-drift**, not impersonation |
| "first/only" superlatives | **YES** | PyPI `eu-ai-act-compliance-mcp` + `dora-compliance-mcp`: "CSOAI-ORG is the ONLY compliance vendor with the Omnibus delay built into the tooling" |

## Corrections to make (prioritised)

1. **P0 — Adjudicate the ground truth first.** Brief says "15 measured · 7 UNMEASURED
   slots"; live `GET /api/gspc` says 22 measured · 0 unmeasured. Everything else keys
   off this. Not owner-gated (internal decision), but blocks item 2's wording.
2. **P0 — PyPI `csoai-defoneos-mcp`**: remove "CERTIFICATION surface" + "33-agent BFT
   council" from the description; align to "Living Attestation, never Certification"
   and DEFONEOS compartment doctrine. Owner-gated (PyPI login; yank 1.0.1 / publish
   1.0.2 with corrected metadata).
3. **P1 — PyPI `eu-ai-act-compliance-mcp` + `dora-compliance-mcp`**: delete the "ONLY
   compliance vendor" claim, the £199/mo attestation block, and fix "404 verbatim
   articles" → 417 provisions. Owner-gated (PyPI/GitHub).
4. **P1 — PyPI `gdpr-compliance-ai-mcp`**: remove "signed compliance certificate" +
   subscription pricing; replace dead `meok-attestation-api.vercel.app` links (Vercel
   deleted 31 Aug). Owner-gated (PyPI).
5. **P1 — npm `@csgaglobal/*` (13 packages)**: `npm deprecate` the certification-named
   packages (casa-certification, csoai-governance at minimum) with a pointer to
   `csoai-gspc`. Owner-gated (npm login — note the standing npm-2FA Nick gate).
6. **P2 — GitHub `CSOAI-ORG/councilof-ai` repo "About" text**: replace "371 signed
   cards" with the live-population wording ("169 signed cards in the public root —
   GET /root.json") or drop the number entirely. Owner-gated (GitHub).
7. **P2 — GitHub org profile README + Glama/mcpservers/lobehub mirrors**: re-run
   `scripts/github/org-readme.py` (numbers are one spray cycle behind: 335/168 vs live
   169 @ 2026-09-11). Owner-gated (GitHub); third-party mirrors self-heal on recrawl.
8. **P2 — GitHub repo description of `csoai-static-deploy2`** (source of the
   mcpserverlist.net drift): replace "ASI evolution, free GPU fleet, 500+ gov pages,
   SOV33 substrate" with measurement-body wording. Owner-gated (GitHub).
9. **P2 — csoai.org/root.json**: re-sign/re-publish or redirect to
   councilof.ai/root.json (already self-flagged STALE). Owner-gated (Wrangler
   csoai-site).
10. **P3 — Smithery `csgaglobal/csoai-compliance-council`**: delete the empty 43/100
    shell or replace with the real GSPC server listing. Owner-gated (Smithery login).
11. **P3 — MCP.so**: submit the GSPC server (blank today; already on the estate's own
    backlog per /traction 2026-08-10). Owner-gated (submission account).
12. **P3 — Kaggle `csoai-gspc-living-board`**: push current snapshot (self-acknowledged
    "behind"). Owner-gated (Kaggle).
13. **P3 — GitHub Discussion #3118**: one corrective comment ("source org is
    CSOAI-ORG; board now reads live via /api/gspc"). Owner-gated (GitHub); low value.
14. **Not owner-fixable / ages out on its own**: mcpservers.org empty duplicate stub
    and v1.3.0 category blurb, licium.ai v1.0.0 endpoint record, PulseMCP/old
    official-registry version rows (immutable per version), getsafety.com mirror of
    the defoneos description (clears when PyPI is fixed).

---
*Audit performed read-only by JEEVES-lane subagent, 2026-09-12. Method: SearchWeb +
FetchURL + public registry APIs (npm, PyPI, MCP registry, HF, Zenodo) + live
councilof.ai endpoints. No authenticated surface touched.*

## Completion pass — 2026-09-12 ~08:20 BST (TUI-5 takeover lane)

1. **P0 adjudication — RESOLVED.** Live `GET /api/gspc` re-fetched: `totals.axes=22,
   measured_axes=22, unmeasured_axes=0`, axis array Counter: 22× MEASURED. The payload's
   own `sweep_note` explains the history: the 8 financial/domain axes were ruled in
   2026-08-24 but absent from the payload until the 2026-08-26 sweep — the brief's
   "15 measured · 7 UNMEASURED" is the pre-sweep state, **stale**. Adjudication: the
   live API, homepage, /benchmarks, README and badge all agree; the API is truth. All
   "22 measured" surfaces are CORRECT; no surface mis-flagged. Item 2+ wording may
   proceed on that basis.
2. **HF card-by-card follow-up — DONE.** All 100 `csoai` org dataset cards swept for
   certification-era wording (certification/certify/33-agent/ONLY compliance/£199/$499/
   ASI evolution/SOV33): 38 hits, every one a doctrine *negation* ("not a certification",
   "measurement, never a certification"). Zero affirmative certification claims.
   **HF org: LIVE-ACCURATE, no drift.** No owner action needed there.
3. **Audit correction shipped:** the one non-gated ledger item — /roi page "AI governance
   platform" legacy framing → "measurement platform" — PR **#2003**.
4. Remaining ledger items 2–13 are all owner-gated (PyPI/npm/GitHub/Kaggle/Smithery
   logins, Wrangler csoai-site) and stand as written.
