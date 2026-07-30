# THE PRODUCTION PLAN — full absorb, 2026-07-30

One site (`councilof-ai` → csoai.org via Cloudflare Pages), one instrument repo
(`csoai-static-deploy2`), one training product (dashboard, not public). Everything below is
phased, owned, and carries its gate. **A phase is done when its gate passes, not when its code
exists** — the build map that marked five unbuilt watchers "✅ LIVE" is why that sentence is here.

## Where we actually are (verified today, not remembered)

| Surface | State | Proof |
|---|---|---|
| www.csoai.org | LIVE on Cloudflare Pages, cert active | curl 200; console verdict clicked live |
| csoai.org apex | ALIAS saved → CF; cert `pending` | authoritative dig = 172.66.x; watcher running |
| Homepage | Tool-first (arena structure): console → actions → headline | read_page tree |
| /instrument /benchmarks | Real routes, in the OS launcher and globe bar | bundles served |
| /ai-transparency | 138 surfaces, 0 AI systems, guard COMPLIANT | article50_guard exit 0 |
| Positioning | 739 surfaces, 0 prohibited claims | positioning_guard exit 0 |
| ProvBench | PUBLIC (repo + HF); figure everywhere = 0 of 20, CP 13.9% n=20 | provbench.json n_assets_marked=20 |
| Mail | Untouched: MX privateemail, DKIM intact. SPF still broken (3 records) | dig backup 20260730-0502 |

**Cross-lane discrepancy to resolve before any announcement:** the science lane's alignment doc
says "canonical bound n=12, 22.1%". The published artefact is n=20 → 13.9%. Both arithmetics are
right; one cites a superseded run. Needs a decision record, then one number everywhere.

## PHASE 1 — Finish the cutover (this week)
1. Apex cert → csoai.org 200 (watcher running; no action unless stuck >30 min).
2. **SPF merge — Nick's go**: replace 3 TXT with
   `v=spf1 include:spf.privateemail.com include:spf.resend.com include:amazonses.com ~all`.
   Mail is broken-by-PermError today; this is independent of hosting.
3. Retire the Worker deploy (csoai.nicholastempleman.workers.dev) once apex is 200 — one
   deploy path, not two. Update wrangler.jsonc comment.
4. Kill stale `app`/`os` CNAMEs → vercel-dns (dead 402 targets) or repoint to Pages.
5. Gate: every public route 200 on csoai.org; guards clean; deploy from `master` only.

## PHASE 2 — End-user pass, per demographic (next)
Test as the person, not as the builder. One session each, fixing what breaks the persona's path:
- **Compliance officer**: home → console chip → /instrument → /assess → signed report → /verify.
  Known gap: /assess posts to `/api/assess` which has NO backend on Pages (server/ never
  deployed). Either ship the deterministic engine client-side (it is a rules table — portable)
  or label the surface "requires API — coming". No silent dead button. **This is the top gap.**
- **Regulator/journalist**: /provenance-finding → /refutation-ledger → /ai-transparency →
  /benchmarks. Content verified current today; keep reconciler in CI.
- **Trainee**: Start free → training funnel. Training product lives in the dashboard — the CTA
  must not promise what the public site can't serve. Decide: link out or hold.
- **Developer**: /mcp registry → /layer0 → github. mcpbench.py ships here (Phase 4).
- **Buyer**: /pricing → /checkout. Stripe wiring untested on Pages — same API-server question.
- Gate: each persona completes or hits an HONEST "not yet" — zero dead ends.

## PHASE 3 — The demo, the tour, the globe, "AI connected"
- /demo (DemoOS) narrates the OS. It predates the instrument wing: script must include
  console → instrument → benchmarks. Checked today: no stale claims, but no instrument either.
- Globe ↔ OS ↔ instrument now visually linked (bar + tiles, shipped today). Extend: globe
  "governance layer" pins link to /instrument verdicts per jurisdiction (render_at later).
- **"AI connected needs to be actual our best SOV, tested"**: the sovereign chat surfaces
  (SovereignDock, /try council) currently simulate. The honest sequence: wire to the deployed
  SOV endpoint (oracle-micro / Modal / NIM once #24 lands) **behind the Article 50 registry** —
  the moment a real model answers, that surface flips to `ai_system` and mounts the notice; the
  guard enforces this mechanically. Do NOT wire a model into the Sovereign Console verdict path
  — its no-model property is the product. Chat ≠ verdict.
- Gate: demo shows the real flow; any live-model surface registered `ai_system` + notice; guard
  COMPLIANT.

## PHASE 4 — Greenfields (the measured wedge, in order)
1. **OSS obligation scanner** (Axis 3, confirmed whitespace): ossbench.py exists, 6 models
   measured. Ship /oss-ledger page reading its JSON. CRA clock: 11 Sep 2026.
2. **mcpbench.py** (#28): 3 deterministic predicates (desc-hash stability, signed release,
   declared-vs-observed). Publish signed profile + /mcp-conformance page. Cites 2606.31498 as
   prior art: they read specs, we measure conduct.
3. **ProvBench announcement**: resolve n=12/n=20 first; C2PA disclosure before publication;
   Zenodo DOI + HF; arXiv when endorsed. SSL.com thread: pre-launch tier chosen, ask whether
   conformance record gates account setup.
4. **Layer-0 watchers**: fix C2PASpec 404 + EUR-Lex extractor (both honest UNKNOWNs today);
   wire `anchors/health.py` into daily cron (Cloudflare cron, not GitHub 60-day trap);
   add /anchors live-status page.
5. **Equivalence/legacy** (Axis 2) and node registry (Axis 4): after 1–3.

## PHASE 5 — Hold-backs and debts (do not lose)
- 4 accreditation pages (/regulatory/*) held out of the port — review or delete, never ship as-is.
- 3 dependabot vulns (1 high) on councilof-ai.
- The `assess`/`checkout`/`subscribe`/`contact` API routes need a backend decision:
  Pages Functions (same repo) is the natural home — port the deterministic engines there.
- csoai-org-v2 and the Worker become archives once apex is live; note in their READMEs.
- Task list: #13 #17 #18 #22 #24 #26(dashboard copy of trust strip) #29(remaining routes) #30(NS move — now optional: ALIAS covers apex; full zone move only if we want Workers routes/WAF).

## The standing rule
Every claim on a public surface must trace to an artefact a reader can open, every guard runs in
CI not in memory, and a component reports success only on paths it completed. The three failures
today — a deploy that "succeeded" after a failed build, a guard that never scanned the live site,
a demo chip returning a false negative — were all caught by re-checking, not by trusting.
