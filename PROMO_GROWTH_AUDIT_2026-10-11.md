# PROMO + GROWTH-PACKAGE AUDIT — 2026-10-11 00:22–00:27 UTC

Lane: PROMO-AND-GROWTH-PACKAGE AUDIT (read-only outward; no sends/posts/submissions).
Deadline context: `/Users/nicholas/_alignment/hermes-drafts/2026-10-09/72H-REVENUE-LAUNCH-BOARD.md:5` — "**11 Oct: promo $0.01→$25/agent** (campaigns ready in GROWTH-PACKAGE)"; `:39` — "campaigns fire (11 Oct!)".

---

## 1. VERDICT UP FRONT

1. **The promo is LIVE and does NOT expire today.** Live 402 challenges on 4 doors all return
   `csoai_pricing.ends_at = "2027-01-11T00:00:00Z"` (campaign `csoai-launch-30d-20260911`,
   `pricing_basis: PROMO_EXISTING_DATA`). The launch board's "11 Oct" deadline is **not backed by live
   state** — `https://councilof.ai/.well-known/x402.json` contains **24** occurrences of `2027-01-11` and
   **0** occurrences of `2026-10-11`. Treat "promo expires today" as an internal-doc artefact, not ground truth.
2. **Offered amount is still 10000 atomic (0.01 USDC)** on every probed door; nothing has flipped to $25.
3. **Promo visibility on live surfaces: 0 matches.** No live page mentions the promo, the campaign, a price
   or the launch window. /pay even states prices never appear there (invariant `no_public_price`).
   Partly deliberate, partly conversion leak — see §5.
4. **GROWTH-PACKAGE: 6 campaigns, all PREPARED, 0 agent-executable.** 4 staged for owner, 1 closed
   (already sent), 1 owner-only form. Plus a policy fence (7 Oct handover red line 4) that independently
   fences every outward item.
5. **Receipt freshness: no payment since 2026-10-09T09:20:15Z** (~39h old). `receipts_today: 0`.

---

## 2. PROMO LIVE STATE (exact JSON)

Probed `POST`/`GET` with no `X-Payment` header → free 402 challenge, nothing paid. (Note: bare `POST {}`
to art50 returns **400** `{"error":"uncheckable","reason":"JSON body needs url, bytes_b64 or manifest_b64"}`;
a body of `{"url":"https://example.com"}` elicits the 402.)

| Door | HTTP | `accepts[0].amount` | `normal_amount_atomic` | `offered_amount_atomic` | `campaign_id` | `ends_at` |
|---|---|---|---|---|---|---|
| `POST /api/art50/marking-evidence` | 402 | `10000` | `25000000` (25.00 USDC) | `10000` (0.01) | `csoai-launch-30d-20260911` | `2027-01-11T00:00:00Z` |
| `GET /api/evidence-bundle?obligation=article-50&bundle=1` | 402 | `10000` | `250000000` (250.00) | `10000` | same | same |
| `GET /api/request-attestation?subject=chainlink&axis=transparency` | 402 | `10000` | `20000` (0.02) | `10000` | same | same |
| `GET /api/signed-data-feed?feed=1` | 402 | `10000` | `20000` (0.02) | `10000` | same | same |

Representative block (art50, `accepts[0].csoai_pricing`, verbatim):

```json
{"pricing_basis":"PROMO_EXISTING_DATA",
 "campaign_id":"csoai-launch-30d-20260911",
 "normal_amount_atomic":"25000000",
 "offered_amount_atomic":"10000",
 "starts_at":"2026-09-11T00:00:00Z",
 "ends_at":"2027-01-11T00:00:00Z",
 "fresh_compute_excluded":true}
```

Corroborating prose in the same 402 body (`csoai.pricing_terms`):
> "accepts[] carries a launch amount until 2027-01-11T00:00:00Z (end of 2027-01-10 UTC). From then this
> request asks its standard amount, the one in csoai_pricing.normal_amount_atomic."

`.well-known/x402.json` (144,422 B): `ends_at` values present = `{2027-01-11T00:00:00Z}` only;
`campaign_id` = `{csoai-launch-30d-20260911}` only; `2026-10-11` count = **0**.

**Caveat on the "$25" figure:** the board's "$0.01→$25/agent" is true **only for the art50 door**
(normal 25000000). evidence-bundle normalises to **250**, request-attestation and signed-data-feed to
**0.02**. The campaign is a flat 0.01 offered amount across doors; the "then $25" claim is a single-SKU fact.

**Verdict: promo ACTIVE as of 2026-10-11T00:23Z. Not flipped, not absent, not ending today.**

---

## 3. GROWTH-PACKAGE INVENTORY

Single file found (searched `/Users/nicholas` incl. clawd, _alignment, home top-level, hermes-drafts):
**`/Users/nicholas/_alignment/hermes-drafts/2026-10-08/GROWTH-PACKAGE.md`** (56 lines, 5,877 B).

Header (`:1-6`): "State: PREPARED. Post/send after the outward gate (browser/webmail)." Corrected 8 Oct:
prose prices removed (`no_public_price`), figures dated, card count 305→319 (later corrected to 316).

| § | Campaign | Channel | Draft status | What execution requires |
|---|---|---|---|---|
| §1 | LinkedIn post (Nicholas Templeman) — "the trust play" | LinkedIn, personal feed | READY (`:8-17`) | Signed-in LinkedIn session + a post (account/send → owner) |
| §2 | X/Twitter thread, 3 posts | X | READY (`:19-22`); note post (3) **replaces** the removed "$0.01/agent through 11 Oct, then $25" line — "**REMOVED, do not restore**" (`:22`) | Signed-in X session ×3 posts (account/send → owner) |
| §3 | Product Hunt day-2 comment | PH launch page | READY (`:24-25`) | Signed-in PH session; headless hits Cloudflare bot challenge (owner browser) |
| §4 | Circle scope-call follow-up → cam@networkcircle.co | Email 1:1 | READY (`:27-29`); **never sent** (zero sends in Sent folder, per `2026-10-09/GROWTH-FIRE-BATCH-REPORT-8.md:29`) | Send capability — SMTP currently **535 auth failed**, or signed-in webmail |
| §5 | SelectHub always-on inclusion | Email | READY (`:31-32`) — **already sent 9 Oct 02:15, receipt ID 564; dedupe: never re-send** (`2026-10-10/GROWTH-FIRE-BATCH-REPORT-11.md:55`) | CLOSED — no action |
| §6 | AI TAP directory listing (form.gov.sg) | Web form | Values verified; form pre-filled in owner's Chrome (`:34`); last dropdown "1-5" + reCAPTCHA + Submit outstanding | Owner browser: reCAPTCHA (red line 8, owner-only) |

Supporting artefacts: claim-bank (`:37-56`) — USE 23 axes/23 measured, 316 cards (root `0846b562…44c7c`);
DO-NOT-USE includes "Any dollar amount in a post/thread/comment/listing/landing copy — `no_public_price`"
(`:54`). Also `2026-10-08/ai-tap-fill-brief.md` (form values).

Related: 14 `GROWTH-FIRE-BATCH-REPORT-*.md` files (2026-10-08 → 10-10) — all report 0/3 outward items
executable; latest is `2026-10-10/GROWTH-FIRE-BATCH-REPORT-11.md`.

---

## 4. FIRES-TODAY CHECKLIST (permissionless classification)

Two independent gates apply to every row: **(a) the permissionless lens** (does executing need an account,
a send, a browser session, or a submission?) and **(b) the binding policy fence** —
`~/_alignment/HERMES-HANDOVER-20261007.md` red line 4, draft-only: no email, no posts, no forms, no
directory submissions; red line 8: CAPTCHA/password/payment owner-only
(`2026-10-10/GROWTH-FIRE-BATCH-REPORT-11.md:10-17`).

| # | Item | Class | Evidence / what unblocks it |
|---|---|---|---|
| 1 | LinkedIn post (§1) | **STAGED-FOR-OWNER** | Copy ready at `GROWTH-PACKAGE.md:8-17`; needs signed-in session + post → owner or explicit per-item outward go |
| 2 | X thread ×3 (§2) | **STAGED-FOR-OWNER** | Bodies ready `:19-22`; price line already stripped — do not restore `:22`; needs signed-in X ×3 |
| 3 | PH day-2 comment (§3) | **BLOCKED** (headless) → owner browser | Cloudflare bot challenge on headless + account required (`GROWTH-FIRE-BATCH-REPORT-11.md:53`) |
| 4 | Circle email (§4) | **BLOCKED** | Fenced send **and** SMTP 535 (fresh test 10 Oct 02:26Z, `...REPORT-11.md:33,54`); unblock = owner rotates mailbox password (board item E) or sends from webmail |
| 5 | SelectHub (§5) | **CLOSED — do not fire** | Already sent 9 Oct, receipt ID 564; dedupe rule recorded `...REPORT-11.md:55` |
| 6 | AI TAP form (§6) | **STAGED-FOR-OWNER** | Form filled in owner Chrome; reCAPTCHA + Submit = owner-only (`:34`, `...REPORT-11.md:38-45`) |
| 7 | Glama.ai re-index (wave-3) | **BLOCKED** (fence) | 404, needs re-index request = a submission; owner or fenced lane (`...REPORT-11.md:68`) |
| 8 | Smithery / mcp.run / opentools / mcpservers.org | **BLOCKED** | Browser login required + submission fence (`...REPORT-11.md:69`) |
| 9 | Promo visibility copy on live surfaces (NEW — see §5) | **BLOCKED for this lane, STAGED-FOR-OWNER** | Any edit is an outward site change (deploy gate: GHA on master, owner) — stage copy only |

**EXECUTABLE-BY-AGENT today: 0 of 9.** Every GROWTH-PACKAGE campaign is account/send/browser/submission-
shaped; there is no permissionless campaign in the package (no own-repo README/topic/directory-copy item).
That gap is itself a finding: the package was built for a signed-in owner, not for an autonomous lane.

**Sequencing note (board `:39`):** "campaigns fire (11 Oct!)" assumes a deadline. Live state says the window
runs to 2027-01-11, so firing today is a *choice*, not a *deadline response* — and the copy must not claim a
11 Oct expiry (also: no amount in any post, `:54`).

---

## 5. PROMO SURFACE / CONVERSION-LEAK FINDINGS

Live pages fetched 00:24Z (all HTTP 200). Regex over raw HTML **and** over script-stripped text:
`promo|campaign|launch-30d|offered_amount|pricing_basis|0\.01|$25|11 Oct|2027-01-11`.

| Surface | Bytes | Promo/deadline/amount mentions | What a stranger sees |
|---|---|---|---|
| `https://councilof.ai/pay` | 2,051 | **0** | "This is the buyer page… **Amounts appear only in the 402 challenge — never on this page.**" No urgency, no window, no campaign |
| `https://councilof.ai/art50` | 93,871 | **0 promo/price**; 2× "deadline" = EU regulatory countdown ("53 days to 2026-12-02 — EU…"), *not* our promo | Measurement/regulatory content only |
| `https://councilof.ai/pricing` | 99,541 | **0** | Ranks as "Council OS: the GSPC workspace" — no price/promo content at all |
| `https://councilof.ai/llms.txt` | 65,894 | **0** (40× "402", 14× "USDC" — door discovery, no amounts) | No per-door pricing, no window |
| `https://councilof.ai/` | 127,873 | **0** | No offer on homepage |
| `https://councilof.ai/gspc-scoreboard` | 91,633 | **0** | No offer |

**Leak findings:**
- **L1 — Zero price/urgency on every public surface.** A stranger landing on `/pay` today cannot learn that
  a launch window exists, when it ends, or that the offered amount differs from the standard one. The only
  place the window is stated is inside the 402 body (`csoai.pricing_terms`) — reachable only after triggering
  a challenge with a valid body.
- **L2 — `/pay` is 2 KB of disclaimers.** It lists what payment never buys but never says what it *does* buy
  or how to start beyond two links. Zero-match on `promo|deadline|window|0.01`.
- **L3 — `/pricing` does not carry pricing.** Title/.content is the GSPC workspace page; no amount, no
  campaign, no "amounts live in the 402 challenge" explanation (which would be invariant-safe).
- **L4 — invariant-safe urgency copy does not exist anywhere.** `no_public_price` bans *amounts* in prose,
  not *dates*. A line such as "launch pricing on the Article 50 door runs until 11 Jan 2027; the amount
  appears only in the 402 challenge" would be compliant and is currently absent from all six surfaces.
  **Staged for owner — not executed by this lane** (site edit = outward deploy, owner-gated).
- **L5 — board/copy contradiction risk.** If any campaign copy or the board re-states an "11 Oct" expiry it
  contradicts live `ends_at: 2027-01-11`. Internal docs `72H-REVENUE-LAUNCH-BOARD.md:5,39` and the
  handoff `2026-10-08/HANDOFF-CHATGPT-LANES-20261008.md:24` ("11 Oct = the $0.01→$25 promo deadline")
  should be corrected. (`GROWTH-PACKAGE.md:22` already removed the amount itself.)

---

## 6. RECEIPT FRESHNESS (read-only)

`GET https://councilof.ai/api/receipt-status` → `as_of: 2026-10-11T00:23:50.152Z`:

```json
{"status":"MEASURED","total_receipts":24,
 "latest_receipt":{"issued_at":"2026-10-09T09:20:15.000Z",
   "resource":"https://councilof.ai/api/evidence-bundle?obligation=article-50&bundle=1",
   "zero_value":false,"self":false},
 "receipts_today":0,"receipts_this_week":1}
```

`GET /api/receipts/latest` → `count: 24`, `demand_eligible_count: 3`, `internal_count: 17`,
`zero_value_count: 4`.

**Nobody has paid since 9 Oct 09:20Z (~39 h).** Newest receipt is a real, non-zero, non-self settlement on
the evidence-bundle door; only 3 of 24 are demand-eligible. Only 1 receipt in the last 7 days.

---

## 7. ACTIONABLE OUTPUT FOR THE COMMANDER

- **Correct the deadline premise**: promo runs to **2027-01-11**, not 11 Oct 2026 (live-cited §2). Do not
  ship any copy claiming an 11 Oct expiry.
- **Fires-today list is owner-shaped**: 4 staged (LinkedIn, X ×3, AI TAP, promo-visibility copy), 1 blocked
  on SMTP (Circle), 1 blocked on Cloudflare (PH), 1 closed (SelectHub — never re-send), 2 fenced directory
  items. **0 agent-executable** under permissionless rules + fence.
- **Conversion leak to fix first (owner, cheap)**: invariant-safe window copy on `/pay` and `/pricing`
  (§5 L1–L4) — this is the highest-leverage item since no campaign can fire without an owner anyway.
- **Revenue signal**: no settlement in 39 h; 3/24 demand-eligible — promo is not converting on its own.

*Method: read-only. All 402s obtained with no `X-Payment` header; no payment, send, post, form or
submission made. No git commits in `~/clawd`.*
