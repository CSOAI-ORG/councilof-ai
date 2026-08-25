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
