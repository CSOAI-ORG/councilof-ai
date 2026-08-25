# HANDOFF-CURSOR.md — K3/JEEVES lane → Cursor (Council OS push)
*2026-08-25 · Aligned with Claude lane (council-os spine, LANE_COORDINATION) · everything below is merged to `master` or staged on `os-production`*

## 1. STATE AS OF THIS HANDOFF (verified, not claimed)

### Measurement board — the big one: JAIL TIE → 14-of-14
- **Jail (slot 14) now carries a completed separation determination: TIE** (was UNTESTED).
  Leader `qwen2.5:0.5b-instruct` acc 0.5915 (n=71), Wilson 95% `[0.475, 0.698]` contains
  fleet mean 0.5455 → *point-estimate lead is not a measured advantage* (canonical
  `stat_suite.separated_leaders`, Wilson-overlap check).
- **7 quotable models, all n≥30 usable (68–71)** on the frozen 71-cell gold bank — per-model
  n + quotable flag in `gspc-measurement.json`.
- `functions/api/gspc.ts` totals logic is **already dynamic** (`measured of quotable` derived),
  so the served board renders **14 measured of 14 quotable** once the pending build lands.
- Merged: **PR #598** (`01e7cd6`) — board_living.json (RE-SIGNED: the live file's signature
  was stale, repaired under the one-signer key + verified), gspc-measurement.json, gspc.ts
  limitations strings.

### Signed signal artifacts (all pod-signed, city key)
- **PR #601** (`c0bc2a3`):
  - `sov-signal.signed.json` — NEW. SOV SIGNAL index: **15 measured rows**, cid `e09a68e2…`
  - `memory-poisoning.signed.json` — EXP 061/064 frozen-bank **hash-pin**: repo_hash
    `6fb617f5…` (32 files, 24,825 B) + files/bytes/pin date/note; re-signed (cid `1d30d0b6…`)
  - `oversight-measurement.signed.json` — hash-pin repo_hash `00aec36b…` (32 files, 28,457 B);
    re-signed (cid `2464dfb4…`)

### Claude-lane alignment (read, not overwritten)
- `council-os` repo (CSOAI-ORG/council-os, main, `spine: council-os v0.1`) — spine.json
  (14 axes × 5 organs, statuses LIVE/LANE-REAL/…; only `ops/live_status_check.py` mints LIVE;
  56 organs LIVE as of 2026-08-25 06:40).
- `LANE_COORDINATION.md` adjudication: card_index edit war — the "ATOMIC restore 335"
  commits were a 41-byte filename-pointer stub that briefly deployed; **structural fix
  (signed-json-guard.mjs in deploy.yml) is in; live is now a real 335-card assemble
  (hash-gated, no stub markers) pending deploy** — guard + bytes now agree.
- dorado.dev does NOT reproduce; dorado→**ELDORADO** rename done; cobolbridge.ai revived
  (custom-domain DNS = owner step at Namecheap).
- **Claude lane's jail ask is now satisfied** — the board with ≥2 quotable models (7) and a
  completed separation block (TIE) is in master. Claude can wire the homepage 22-grammar to
  "14 measured of 14" immediately.

## 2. WHAT CURSOR MUST DO
1. **Grammar flip (after build lands):** homepage + brand cards "13 measured of 14" →
   **"14 measured of 14"** (jail no longer UNTESTED). One scripted sweep of the string;
   the API (`/api/gspc` totals + `public_count`) already self-derives.
2. **Render the cursor-feed** (staged on `os-production`, pushed to origin at `06c694b4`):
   `cursor-feed/insights/*` → `/intelligence` cards; first-fine + unfixed watch desks;
   value ledger (`/ledger`); compliance-training world (`/training`); revenue surfaces
   (`/revenue` — **pricing stays DRAFT-tagged**, owner ruling).
   See `cursor-feed/HANDOFF.md` + `MASTER-FRONTEND-PUBLISHING.md` (JEEVES content lane).
3. **Brand system (binding):** Emerald #10B981 + Stark White + `#065F46` shadows; no
   gold/gray/MEOK leftovers anywhere; Avenir Next headers (Demi Bold) / Regular body.
4. **Surface the spine:** council-os README + spine.json statuses (56 organs LIVE) as a
   `/status` or `/spine` card — only LIVE with evidence, grammar `LIVE · LANE-REAL ·
   LANE-REPORTED · THEORY · GATED`.
5. **Keep codenames out of the public strings** (banned-string checker incl. dorado).

## 3. OWNER-GATED (do NOT fabricate; rendered honestly as pending)
- Stripe **price IDs** needed to finish `/payg` (checkout currently: "unknown product_id")
- Pricing RULING (Move 211) — render DRAFT until then; license page exists (live data
  license + corpus pricing at 10,226 records)
- `csoai.org` domain/DNS + Namecheap cobolbridge DNS; UKIPO + domain renewals (JD-D1)
- Enterprise pilot outreach + foundation donation (EXP 211) — owner signature only
- Article 50(2) docs flow: detector endpoints live; deposit step is the owner's legal act

## 4. REMAINING LANE QUEUE (honest, not done)
- Gold bank **dataset publication** to HF (frozen on 3090 pod; board says "pending publication")
- 19-model board-fleet jail run (current is a 7-model gold-bank fleet — notebooked honestly)
- Machine-access pricing ruling (East-West packs) — owner
- MCP registry publish + DOI bump — hub-version gated

*K3/JEEVES lane · 2026-08-25 · all numbers above verified against live bytes or pod-signed artifacts.*

## 5. STRATEGY PASS 2026-08-25 — unsolicited + permissionless attestation (mapped)
Freshness/risk dossier integrated (merged #628, `02ff64f`):
- **Differentiator sharpened (already in code):** "unsolicited + permissionless"
  (no issuer opt-in, no issuer payment) — incumbents all claim "independent"
  (Moody's TIE Canton/Solana issuer-led, S&P+Chainlink, Credora/RedStone,
  Particula mandate-based, Chainlink ACE enforcement). Moat = unsolicited +
  statistically-governed + signed; nobody offers that combination.
- **Clean-play targets refreshed** (as-reported, dated): Aviva (LIVE 2026-07-29,
  first CBI-approved tokenized fund on public chain; BNY underlying; Komainu;
  Ripple stakes ~Aug 3), RLUSD (1.711B cap; EU CASP 2026-08-05; BNY custodian
  monthly attestations), BUIDL (~$2.6-2.7B; Moody's Aaa-mf; ~109 wallets),
  BENJI ($700-830M / 8 chains / '40 Act; Franklin parent one-off footnote),
  OUSG (~$375M TVL; SEC closed Nov 2025; Oasis Pro; ONDO token separate).
- **JMWH = DEMONSTRATION-ONLY** (represented ≠ distributed: 19 holders, ~0 volume,
  minted-not-purchased, Universal Demeter minimal capital, CAMMESA custodian+auditor).
  Render as the negative-signal case, never endorsement.
- **Compliance (own posture):** CRA vulnerability reporting live 2026-09-11
  (24h/72h/14d ENISA; SBOM + generator shipped; engine is stdlib-only Python).
  AI Act GPAI enforcement live 2026-08-02 (€15M/3%): signed verdict path is
  deterministic (no GPAI by construction); fleet local; hosted tooling = two-provider
  portability rule + cost caps on agent rounds.
- **Supply chain:** xrpl.js CVE-2025-32965 (Apr 2025, fixed 4.2.5/2.14.3, current 5.x)
  NOT in our tree; consumers pin ≥4.2.5/5.x + SCA + npm 2FA prep.
- **SEC posture:** pure-attestor (no issuance/custody/synthetic) sits outside the
  2026-01-28 staff taxonomy — keep it that way; no issuer payment ever.

## 6. RWA SCALE 2026-08-25 — data is LIVE, wire it (exact list for Cursor)
**Done (merged + live in repo):** control-facts v2 (`public/interop/financial-measure-run-v2.json`
— 6 XRPL issuers, fresh mainnet flags, coverage rate + **Wilson 95%**, Ed25519-signed cid
`29369542cb537f38`, supersedes v1 with corrections-append note) · corpus 18 entries + intel/flags
(JMWH demo-only) · `financial-axes 0.2` (3 index axes declared UNMEASURED + rubric + bank NONE) ·
HF mirror **csoai/rwa-attest** (7 files) · scripts + methodology committed.

**Cursor wiring (from os-production / master):**
1. `client/src/pages/XrplAttest.tsx` already routed (`/xrpl-attest`, Header item "Attestation on
   the ledger" ✅ exists) → **wire it to the live data:** fetch `financial-measure-run-v2.json` +
   `attestation-corpus.json`; render per-target coverage rate + Wilson interval + raw flags +
   `watch` flags; verdicts stay UNMEASURED badges (never implied safe); JMWH card = demo-only
   negative-signal framing with the represented≠distributed callout.
2. **New menu item + page:** `/financial-axes` — the 8 financial axes; 3 index candidates
   (AI-economy, human-labour, humanoid-labour) rendered as **declared-UNMEASURED cards**
   (rubric + bank_status NONE shown; no live numbers — honest empty state).
3. **Homepage/header grammar sweep:** "14 measured of 14" (live) — replace any "13 measured of 14";
   emerald brand (#10B981) everywhere; no gold/gray leftovers.
4. **Products catalogue:** link the five products (evidence pack / data licence / attestation
   coverage / training world / payg) — pricing stays DRAFT (owner ruling).
5. Data endpoints already public: `/interop/*.json` + `/signals/*.signed.json` + `/api/gspc`.
