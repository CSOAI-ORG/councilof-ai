# CSOAI — Multi-Agent Coordination

> Two Claude agents build CSOAI in parallel on the **same `master` branch**. This doc keeps us from colliding and makes us compound. Read it before a work session. Pairs with `ALIGNMENT.md` (what's live) and `DEMO_READINESS.md` (is it true).

## Who's who
| Agent | Git author | Owns |
|---|---|---|
| **Claude Science / JEEVES (M4)** | `Nicholas Templeman` | Revenue plumbing (Paddle checkout + Ed25519 cert webhook), **auth + entitlement**, **`/assess`** product-proof + the COBOL/legacy-bridge wedge (SCADA/DLMS/MQTT/Oracle/SAP/EDI/GS1/SIP/FIX/ISO8583), the **240-lead DB** (`sovereign-charters` repo), GitHub-org repo hygiene (topic retagging), deploy runbook + signing key, **outreach**. |
| **Frontend / OS (this agent)** | `Nick Templeman` (Co-Authored-By Claude Opus) | The live **Vite SPA** on `master` → csoai.org: OS, globe, working tools (ToolRunner/`/classifier`/`/report`/`/workbench`), the **framework ground-truth register**, the **claims-e2e harness + CI**, **DEMO_READINESS**, enterprise trust/contrast/OG, `ecosystem.json` + `/intel`, coordination docs. |

## Git protocol on shared `master` (both agents land here)
1. **`git pull --rebase origin master` before every push.** We've been doing this; keep it up.
2. **Small, atomic commits** — easy to rebase around each other. No giant multi-feature commits.
3. **Never force-push `master`.** Ever.
4. **Stay in your lane by file.** JEEVES owns `auth*`, `payments*`, `AssessTool*`, `sovereign-charters`; frontend owns `App.tsx` routing, OS/globe/tools pages, `docs/*TRUTH*`, `scripts/claims-e2e.mjs`. Touching the other's files → leave a note in the commit body.
5. **After any deploy, run `node scripts/claims-e2e.mjs`** → must be **12/0** before it's "done". This is the shared truth gate; it's in CI too.
6. If a build-config change is needed (vite/vercel), **verify a live render before trusting it** (a React-chunk misconfig blanked prod once — caught by the harness).

## Branch truth
- **`master` = live canonical** (both agents land here → csoai.org).
- **`main` = archived Next.js experiment** (#128, ~23 commits). **Do not merge into master.** Archival is a one-time human call, not a batch action.

## Integration points (where our work meets)
- **Leads:** JEEVES owns `csoai_leads_domain_fixed.db` (240 real orgs, domains verified). Frontend's `ecosystem.json` / `/intel` is **regulators-only + honest placeholders** for the *public* site — **named enterprise leads stay in JEEVES's internal DB, never published on csoai.org** (privacy/positioning). If we want the globe to show real enterprise pins, JEEVES exports an anonymised/aggregate feed; frontend consumes it.
- **Product surfaces:** JEEVES's `/assess`, `/pricing` (Paddle), `/login` (auth) must be **discoverable** in the frontend nav/funnel — frontend surfaces them (done: `/assess` added to nav).
- **Truth:** the ground-truth register + claims harness are **shared** — JEEVES runs `claims-e2e.mjs` before any outreach demo; the quarterly re-pass scheduled task keeps facts fresh for both.
- **MCP catalogue:** JEEVES's GitHub retagging separated utility MCPs from CSOAI-governance branding — frontend's "378 tools / 300+ MCP" copy is verified against the live `/api/tools` count by the harness, so retagging GitHub topics doesn't affect the claim.

## Blocked on Nick (consolidated — neither agent can do these)
1. **Phase 3 deploy** — JEEVES's runbook + signing key ready; needs Nick to run.
2. **Outreach send** — lead list clean; sending is Nick's action.
3. **`npm publish`** — ✅ DONE: `csoai-governance-mcp@0.1.0` live on npm (`npx csoai-governance-mcp`).
4. **`app.csoai.org` split** for `csoai-dashboard` — Vercel/DNS.
5. **`main` branch archival** decision.
6. **ACLED / FIRMS keys** for the two dark Watchdog feeds.

## The rule that governs both of us
**Nothing ships to a demo that isn't `claims-e2e` 12/0 green and register-✅ sourced.** One shot per account. Truth is the product.

## Session log — 2026-07-07
- **MCP distribution: DONE.** `csoai-governance-mcp@0.1.0` published to npm, installs via `npx`, and **self-lists in the live catalog** (verified `/api/tools total=378`). On-site funnel added: `/tool-commons` now shows a headline one-command install block (`claude mcp add csoai-governance -- npx -y csoai-governance-mcp`). Package README/`0.1.1` teed up for a README refresh on next publish (Nick's token step).
- **Catalog 377 → 378** (governance MCP added). Tool-count claims reconciled repo-wide: dynamic surfaces show the **live** count, static copy uses **"370+"** (drift-proof), tests use a **`>=377` floor**. `claims-e2e.mjs` previously asserted `=== 377` and would have false-failed — now fixed.
- **⚠️ Parallel-edit near-miss:** M4 (`3cb779f`) and frontend (`126703b`) independently fixed the 377 hardcoding, hitting the *same 4 files* → rebase conflict. Resolved cleanly by taking M4's base (better test guard) + layering frontend's 14 non-overlapping copy/MCP files. **Lesson: before a repo-wide sweep, drop a one-line note here naming the files you're about to touch.**
- Live-verified after every push: build clean ×3, 17/17 routes 200, claims **12/0**, sitemap 291 URLs.
- **npm token exposed in plaintext during publish — Nick to revoke** (npmjs.com → Access Tokens).
- **hive-recon coverage: 27 → 1,952 accounts** (`94d4772`→`8d543cd`, Claude Science). Sourced 1,913
  company rows from SEC EDGAR's free public API (real ticker/CIK/SIC per row), merged with
  ecosystem.ts's 39 accounts (23 regulators + 16 real named orgs incl. the F100 seed from
  `4364ca2`). All gates pass; every non-authority company row correctly stays
  `confidence:"modeled"` (no fabricated posture/vendor). Current export:
  `docs/handoff/hive_full_export_1952.json`
  (`HIVE_ACCOUNTS=docs/handoff/hive_full_export_1952.json node scripts/hive-recon.mjs`).
- **⚠️ Second near-miss, now fixed:** `faad379` (globe overlay) and `4364ca2` (F100 seed) each ran
  `hive-recon.mjs` at its *default* path while wiring an unrelated feature, silently overwriting
  `docs/hive-recon-report.json` down to 27, then 39 — undoing the outreach-gate coverage twice.
  **Fixed in `8d543cd`:** the script now refuses to write a report with fewer accounts than the
  one already on disk (needs `FORCE=1` to intentionally shrink). **If your change touches
  `ecosystem.ts` or any other input `hive-recon.mjs` reads, re-run it against the full export
  afterward** (`HIVE_ACCOUNTS=docs/handoff/hive_full_export_1952.json`), not the bare
  `npm run hive:recon` default — the guard will now stop you if you forget, but merging the new
  rows into the full export (like this reconciliation did) is still a manual step.
  Remaining gap to the outreach gate: per-account recon (public web) to replace "modeled" with
  cited real facts, company by company — not done by any of this, coverage-count only.
- **First real per-account recon done: 6/1952 (`9a06415`, Claude Science).** JPMorgan Chase,
  Microsoft, Alphabet, UnitedHealth, Pfizer, Lockheed Martin now `verified`/`displace` with a
  cited real internal AI-governance program (see commit message for sources). CVS Health
  partially updated (`emerging`, vendor still `unknown` — evidence was exec-quoted, not a named
  program). ExxonMobil/AT&T/Elevance/BofA/Citigroup deliberately left `unknown` — search only
  returned SEO/vendor-blog noise for those five, not primary-source strength. Coverage:
  24 → 30 verified/authority out of 1,952. **This is slow, one-account-at-a-time work** — at
  this rate the remaining ~1,922 modeled rows are not a single-session job. If another agent
  wants to parallelize it, the pattern is: web-search the company + "AI governance" /
  "responsible AI", require a primary source (company's own domain or an SEC filing) naming an
  actual program/committee/principles doc before upgrading `posture`/`currentVendor`, and leave
  it `unknown` rather than force-fit a vendor blog's inference.
- **E2E audit this pass (Claude Science, curl-based since node_modules isn't installed in this
  checkout — playwright's `claims-e2e.mjs`/`e2e-product.mjs` could not run):** live catalog
  378 ✅, csoai-governance-mcp present ✅, `/sign`+`/verify` round-trip genuine (valid signature
  → `valid:true`, tampered signature → correctly rejected) ✅, all 6 funnel routes 200 ✅,
  fresh `npx -y csoai-governance-mcp@latest` handshake returns all 4 real tool schemas ✅.
  **Found + fixed:** `public/hive-coverage.json` on the live site was stale — the per-account
  recon commit (`9a06415`) updated `docs/hive-recon-report.json` but never re-ran the
  default-path public overlay, and the regression guard from `bdbbcf3` would have silently
  skipped it anyway (its `process.exit(1)` ran before the overlay write). Fixed in `60273af`.
  **Minor, not fixed:** the published `csoai-governance-mcp@0.1.0` npm package's `csoai_catalog`
  tool description still says "377 governed tools" (source is 378+); this is baked into the
  already-published build, not the source in this repo — needs a version bump + republish
  (blocked on the npm token step, same as the pending `0.1.1` README refresh). Cosmetic only,
  not fixed this pass.
- **⚠️ 3rd near-miss on the same class of bug, now actually fixed at the root:** M4's `24bbdb7`
  (+21 F100 accounts, 39→59 in ecosystem.ts) regenerated the report at the default path — correct
  for the *public* overlay, but it left the internal outreach-gate coverage number stuck at 1,952
  (missing the 20 new accounts) because nobody re-ran the ecosystem.ts↔SEC-leads merge. This is
  the 3rd time ecosystem.ts grew without the internal merge following it.
  **Fixed properly this time (`13807ff`):** the one-off `/tmp` merge script is now committed as
  **`scripts/merge-hive-accounts.mjs`**, and the raw SEC leads are committed as
  **`docs/handoff/sec_leads_raw_1913.json`** — no more invisible-to-other-agents /tmp state.
  **If you (M4/JEEVES or anyone) add accounts to `ecosystem.ts`, run this after:**
  ```
  node scripts/merge-hive-accounts.mjs docs/handoff/sec_leads_raw_1913.json docs/handoff/hive_full_export_NNNN.json
  FORCE=1 HIVE_ACCOUNTS=docs/handoff/hive_full_export_NNNN.json node scripts/hive-recon.mjs   # internal report
  node scripts/hive-recon.mjs                                                                  # public overlay
  ```
  Coverage now 1,971 (deduped 1 real overlap — Johnson & Johnson was in both sets, kept the
  ecosystem.ts entry). Also fixed a citation bug this pass: Lockheed Martin's two governance
  facts were attributed to one URL but actually came from two different sources — split correctly
  in `978fb10`/`4aa3d28`.
- **Confirmed M4's displace-logic fix (`1f0415a`) is correct and reconciled coverage to 1,999**
  after the +29 EU/APAC global dataset (Claude Science, `9b9faeb`). `scripts/merge-hive-accounts.mjs`
  worked exactly as designed on its first real re-use — no ad-hoc scripting needed.
- **⚠️ Deploy gap found (not fixed — outside this session's reach):** the LIVE `www.csoai.org`
  bundle (`assets/index-DtnGC23y.js` as of this check) does **not** contain any reference to
  `hive-coverage.json` — meaning the globe-overlay feature (`faad379` onward, several commits
  ago) has not actually reached production yet. `/globe`, `/sovspace`, `/sov-town` all return 200
  and the SPA routes resolve fine, but the coverage-pin layer itself is running old code. Whoever
  owns the deploy trigger (Vercel project push / cron) needs to redeploy `councilof-ai` — this
  isn't a code bug, just confirming the gap explicitly so nobody assumes the live globe already
  shows the reconciled 1,999-account data.
- **Top-25-gap priority list closed out (Claude Science, `81adde3` + `22a0c98`).** Of the 6
  accounts M4's coverage brief flagged as highest-CSOAI-gap-and-still-modeled (Bank of America,
  Citigroup, CVS Health, ExxonMobil, AT&T, Elevance Health): **AT&T and Elevance Health** now
  `verified`/`internal` (both have a named, own-domain-cited internal AI governance function —
  AT&T's review board + AI Guiding Principles, Elevance's Office of Responsible AI). **Citigroup
  and CVS Health** upgraded to `emerging` (real public commitments found — Citi Institute
  thought-leadership, CVS's White House AI pledge + TPRG vendor program — but no dedicated
  internal governance body, so kept below `mature` per the honesty invariant, don't round up).
  **Bank of America and ExxonMobil** confirmed genuinely `unknown` — search only returned
  AI-*use*-case stories (personalized banking, drilling automation), not governance-program
  citations. Combined with the earlier 6 F100 accounts: **10 of 88 public-seed accounts now
  carry a real citation** — 8 verified/mature (jpmorgan, microsoft, alphabet, unitedhealth,
  pfizer, lockheed, att, elevance) + 2 emerging (citigroup, cvshealth) — the rest of the ~1,900
  SEC leads still need
- **4th recon round (Claude Science, `86947f7`).** Extended to Morgan Stanley, American Express,
  The Cigna Group (all -> mature/internal/verified — Cigna's is the strongest citation class so
  far, a named 'EMG Board' + 'AI Center of Enablement' straight from the FY2025 SEC DEF 14A, not
  a blog), Wells Fargo, Goldman Sachs (both -> emerging — real public commitments, no named
  internal council found via primary source). **Verified running total: 15 of 32 sampled F100
  accounts now carry a real citation (11 mature, 4 emerging)** — counted directly from
  `client/src/data/ecosystem.ts` via grep, not estimated (a prior round mis-stated this count and
  was corrected in `edb236b`/`3f8a362` — always re-count from the file before writing a total
  here).
  the same treatment if anyone wants to keep going — same pattern as before (own-domain or
  filing source required, leave unknown rather than force-fit a vendor blog).
- **5th recon round (Claude Science, `6de0bd6`).** Extended to the rest of the original top-25
  list: HCA Healthcare, Johnson & Johnson, Meta Platforms, NVIDIA, IBM (all -> mature/verified —
  IBM's is worth flagging specifically: its internal AI Ethics Board / 'Responsible Technology
  Board' is a genuinely different thing from the watsonx.governance PRODUCT it sells, don't
  conflate the two if reusing this citation). McKesson, Humana, Chevron -> emerging (real
  external/subsidiary-level commitments, no confirmed corporate-level named body). Merck & Co.,
  AbbVie, Oracle -> stay unknown after search (Merck note: initial results conflated NYSE:MRK
  with the unrelated Merck KGaA/Darmstadt — re-searched entity-specific, still nothing).
  **Verified count (grep-checked before commit, not estimated): 23 of 32 sampled F100 accounts
  now carry a real citation — 16 mature, 7 emerging, 9 honestly unknown.**

## Cross-agent phase status (Claude Science check-in, 2026-07-07)
Reviewed the joint commit stream and M4's own findings docs before continuing. Current split:
- **M4 lane (distribution/product):** globe region/sector filters + fly-to-opportunity, i18n
  locale-aware homepage (Phase 2), a11y sweep (WCAG contrast + labels), per-account brief pages
  (`/brief?id=`), and a live **Sovereign persona test harness** (`npm run sov:personas`) — 6/6
  region personas score clean/on-topic, but it surfaced 3 real brain-training gaps logged in
  `docs/handoff/sovereign_persona_findings.md`: (1) intermittent EU-centric bias on non-EU
  jurisdiction questions, (2) frontend now requests the visitor's language but the brain doesn't
  yet honor it, (3) brain gave a stale EU AI Act date in one reply. **These three are M4/brain-side
  items, not something this session can fix (no access to the os.meok.ai brain/prompt config) —
  flagging so whoever owns that surface picks them up.**
- **Claude Science lane (this session, outreach-readiness):** per-account recon on the named F100
  seed — 23/32 accounts sampled now carry a real citation (up from 0 at session start).
- **Still open, unowned by either lane:** the live-deploy gap for the hive-coverage globe overlay.
  Re-checked just now — the site HAS redeployed since the gap was first found (bundle hash changed
  `index-DtnGC23y.js` → `index-BpMkIonv.js`), but the new bundle **still contains zero references
  to `hive-coverage.json`** (`grep -c` = 0). This is now confirmed to persist across a redeploy,
  not just stale caching — whoever owns the Vercel build/import wiring for `councilof-ai` needs to
  check why the overlay's data import isn't reaching the client bundle.
- **Not yet started by anyone:** recon on the ~1,900 SEC-sourced leads beyond the 88 named
  public-seed accounts (still 100% `modeled`, per the outreach gate).

### ⚠️ Correction — fabricated J&J citation caught and fixed (`8e39c8d`)
An auditor caught that the J&J entry from the 5th recon round cited a nonexistent position paper
("Doing the right thing: AI & ethics") and mischaracterized J&J's real 1943 Credo as a generic
5-point AI-ethics list. Neither claim is supported by any search result. **Corrected:** the only
verifiable fact is CIO Jim Swanson telling Greylock directly that J&J "created two councils, an
AI Council and a Data Management Council" (corroborated independently) — but a third source
(citing WSJ) reports J&J has since replaced that centralized board with a distributed model, so
current state is uncertain. Downgraded J&J from mature/internal to emerging/unknown. **Lesson
for anyone continuing this recon pattern: verify every specific claim (paper titles, named
frameworks, quoted principles) actually appears in the search result text before writing it into
`ecosystem.ts` — don't let a plausible-sounding detail slip in without a traceable source line.**
Running total after this fix: still 23/32 sampled accounts cited, now 15 mature + 8 emerging.

- **6th recon round (Claude Science, `5a6b848`) — completes the full 32-account F100 sample.**
  Verizon, RTX (Raytheon), Boeing -> mature/internal/verified (RTX's is a SEC DEF 14A filing,
  the strongest citation class). Northrop Grumman -> emerging (real detail, no named internal
  board). **Final tally for this sample: 27 of 32 F100 accounts now carry a real citation — 18
  mature, 9 emerging, 5 honestly unknown after genuine search (AbbVie, Bank of America,
  ExxonMobil, Merck & Co., Oracle — none had a primary-sourced named governance body, only
  AI-use-case press or third-party consultancy content).** This closes out the currently-sampled
  32-account F100 batch from the original top-25-gap list + adjacent accounts. **Next scope for
  anyone continuing:** the ~1,900 SEC-sourced leads beyond these 32 named accounts remain
  entirely `modeled` — same per-account recon pattern applies (own-domain, SEC filing, or a
  named-exec interview required; leave `unknown` rather than force-fit AI-use-case coverage into
  a governance claim).

### ⚠️ Standing caution — "re-verified" language and redacted transcripts (`733723c`)
An auditor caught this twice on the same 4 accounts (RTX/Verizon/Boeing/Northrop): claiming a
citation is "confirmed" or "exact match" after a fresh search is not itself sufficient — if the
search-result plaintext is marked redacted/elided in the persisted transcript, **no future
reader can independently verify it, regardless of what the agent saw in that turn.** Re-running
the same search and getting the same redaction doesn't add evidence. **Corrected language for
future recon:** state that the URL is real/on-topic (which IS checkable — it's in the visible
result list) without claiming the specific quoted text is "confirmed." If exact-quote
verification matters, the quote needs to come from a source whose content is NOT redacted in the
transcript (e.g. `fetch_article_fulltext`, or content read via `read_file`/`bash curl`, which
persist in full).
