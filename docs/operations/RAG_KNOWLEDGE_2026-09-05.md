# RAG KNOWLEDGE — 2026-09-05 (verified + research, for RAG/catalog ingestion)
*(Distilled facts; re-check via the align brief's four commands before quoting.)*

## Verified estate (2026-09-05)
- Board: csoai.gspc-axes/0.5 · 22 slots · 22 MEASURED · 0 unmeasured · "22 axis · 22 measured".
  Observed on 2026-08-12 (behavioural) / 2026-08-18 (jail) / 2026-08-25 (financial-fact) — WEEKS OLD.
- Instrument: 19-model fleet. Jail = 7-model fleet (never conflate with board fleet).
- Hub population (GET `/api/hub-cards` → `.counts`, as_of `2026-09-07T04:16:35.252Z`): **856 cells / 856 MEASURED / 0 UNMEASURED** (third-party models; NOT the board). Do not re-paste the Sep-5 Hub triple (cells 699 · measured 629 · unmeasured 70).
- Journey: ask→scope→inspect→explain WORKS; propose→approve→fix→retest→receipt backends = 404 (no runtime).
- MCP: 11 tools over HTTP (7 free + 4 paid); stdio npm = 12 (extra witness_hash, 503-gated);
  npm SDK csoai-gspc-mcp@0.2.1 = byte-identical to mcp/gspc-server.
- Cards — three populations, never fused: `/api/cards` living registry **336** signed; `/signed/card_index.json` **n_cards=335** (corpus 3 only); `/api/root` / `root.json` **card_count=168**. Disk counts are not live API. **335/335** is valid only when labelled *signed card index* — wrong as root or `/api/cards` headline.
- Deploys: Cloudflare Pages only. Never vercel; never wrangler-pages from a laptop.

## Doctrine (binding)
Measure, never certify (no "certified"/"guaranteed"/"approved") · UNMEASURED first-class ·
bytes adjudicate · five owner gates (never send/publish/spend/sign/schedule/delete) ·
one lane = one writer.

## Banned strings (retracted, block the ESTATE's deploy via brand-gate.mjs)
"BFT" / "Byzantine" / "fault-tolerant" (retracted 2026-07-29, n_eff≈1.21/3). Say
"designed 33-agent council" + "23/33 threshold".

## Research (2026-09-05)
- Vals AI: $40M Series A / a16z ("every market needs an independent scorekeeper").
- AI evaluation firms emerging as industry referees (Chosun, Aug 2026) — market validated.
- MCP Registry OIDC token replay **CVE-2026-44428** (PolicyLayer) — live MCP security
  incident; directly validates our MCP security scorecard wedge.
- EU AI Act AI Omnibus: transparency obligations (Aug 2026 duties) — maps to our Art 50 passport.
- Enterprise MCP Registry 2026 (MintMCP) — distribution channel for the scorecard.

## Traps (scar tissue)
Signed Hub cells can say UNMEASURED — read status before printing accuracy. Live Hub UNMEASURED is **0** of 856 (GET `/api/hub-cards`); do not paste stale 70.
BFT blocks estate deploy. Static page cannot emit a signed card. Served ≠ rendered
(3x today). A 404 you invented proves nothing. master moves ~every 100s — rebase + verify.
