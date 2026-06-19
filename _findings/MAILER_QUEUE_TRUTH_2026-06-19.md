# Mailer Queue Truth — 2026-06-19

Forensic read of `~/clawd/hive-mailer/queue.jsonl` (306 lines) + `hive_mailer.py`,
`mailer.log`, `.suppressed`, `.probe_strikes`. Read-only; no emails sent, no git push.

## 1. Exact status counts (306 rows, 0 unparseable)

| status                       | count |
|------------------------------|------:|
| suppressed_quality_20260617  |  245  |
| sent                         |   37  |
| suppressed_quality_v2        |   16  |
| queued                       |    7  |
| skipped_suppressed           |    1  |
| **TOTAL**                    | **306** |

Matches the briefed breakdown exactly (sent 37 / queued 7 / suppressed_quality_20260617 245 /
suppressed_quality_v2 16 / skipped 1). The earlier "306 queue" headline is real but only
**7 rows are actually live** (`queued`); 261 are suppressed, 37 already attempted, 1 skipped.

## 2. The "quality" filter — provenance & criteria

The filter is **not in the codebase**. `hive_mailer.py` never writes any `suppressed_quality*`
status (it only writes `sent`, `queued`, `skipped`, `skipped_invalid`, `skipped_suppressed`,
`error`, `failed`). A `grep -r "suppressed_quality"` across `~/clawd` returns **nothing** outside
`queue.jsonl` itself. It was applied by an ad-hoc/one-shot script (now deleted — consistent with
the known "_tooling wipe" pattern) that stamped each row with `status` + a `suppress_reason` tag.

Reverse-engineered criteria from the `suppress_reason` field:

### suppressed_quality_20260617 (245 rows)
| suppress_reason          | rows | meaning |
|--------------------------|-----:|---------|
| generic_press_inbox      | 147  | address is a `press@` / `info@` / `media@` role inbox |
| nhs_public_inbox         |  29  | NHS public/press inbox (`press@england.nhs.uk` etc.) |
| dedupe_gt2_per_company   |  27  | >2 rows already exist for that company |
| regulator_gov            |  25  | a regulator/government body (FCA, DSIT, Cabinet Office) |
| state_central_bank       |   9  | a central bank (BoE, RBI) |
| sanctioned_state         |   8  | sanctioned-jurisdiction state body (PBoC, Bank of Russia) |

### suppressed_quality_v2 (16 rows) — a later, lighter pass
| suppress_reason     | rows |
|---------------------|-----:|
| exact_duplicate     |  7  |
| gov_or_central_bank |  6  |
| generic_inbox       |  3  |

These criteria are **sound for cold sales outreach**: press desks, regulators, central banks and
sanctioned-state bodies are not buyers of a £199/mo compliance SaaS, and de-duping >2-per-company
prevents spamming the same org. The filter was doing the right job.

## 3. The 245 — over-suppression estimate

The 245 is **heavily duplicated**: only **101 distinct addresses** (144 rows are duplicates).
Of the 101 distinct addresses, **93 are role inboxes** and only **8 are non-role addresses**, of
which 2 (`marek.stefanczak@ceracare.co.uk`, `foxtrot.bartshealth@nhs.net`) are already `sent`
elsewhere in the queue and 2 more are press inboxes (`eu-ai-office@ec.europa.eu`,
`service.de.presse@banque-france.fr`).

**Genuinely over-suppressed (legitimate ICP prospects wrongly held):** 4 addresses, all tagged
`generic_press_inbox` only because the company's sole public address is `hello@`:

| address               | company     | campaign                              |
|-----------------------|-------------|---------------------------------------|
| hello@aleph-alpha.com | Aleph Alpha | sprint-d19-eu-compliance-aleph-alpha  |
| hello@caresourcer.com | Care Sourcer| sprint-d19-care-caresourcer           |
| hello@lilli.com       | Lilli       | sprint-d19-care-lilli                 |
| hello@cogvis.at       | Cogvis      | sprint-d19-care-cogvis                |

These are exactly the ICP (AI vendors + care-tech firms) — the `generic_press_inbox` rule is too
blunt: it treats `hello@<company>` (a primary commercial contact for a startup) the same as
`press@blackrock.com` (a media desk at a non-buyer).

**Over-suppression rate:**
- As a share of distinct addresses: **4 / 101 ≈ 4%**.
- As a share of the raw 245 rows: **~1.6%**.
- The other ~96% are correctly suppressed: regulators, central banks, NHS/press desks,
  sanctioned states, and dedupe of companies already contacted.

**Verdict on suspicion (a):** Largely UNFOUNDED. The "245 quarantine" is *not* mostly good
prospects wrongly held — it's overwhelmingly role inboxes, regulators, and duplicates. Only ~4
real prospects were caught by collateral damage from the `hello@`→`generic_press_inbox` rule.

## 4. The 37 "sent" — verdict: ACCEPTED by Resend, NOT a 403 false-positive, but NOT proven delivered

Evidence:
- All 37 `sent` rows carry a **valid UUID `resend_id`** and a `sent_at`. A Resend 403 returns
  `{"error":..., "status":403}` with **no `id`** (see code path: `if r.get("id"):` → sent, else
  → requeue/error). The `queued` rows confirm this: their `error` field literally contains the
  403 body and they have **no `resend_id`**. So the 37 UUIDs are real API acceptances, **not** the
  403s the briefing suspected.
- The send path is distinct from the **gate probe** (probe goes to `delivered@resend.dev` and is
  what flaps 403 in `mailer.log` — strikes 1–9). The strike logic lets a real send through after a
  flap; the resulting `id` proves a 200 from `/emails`.
- `mailer.log` shows 62 `SENT →` lines with UUIDs (the queue snapshot retains 37; the rest are
  rows whose status was later overwritten or were on the pre-quality queue version).

**HOWEVER — "sent" ≠ "delivered".** Two hard pieces of counter-evidence:
1. `.suppressed` is explicitly headed *"Seeded 2026-06-16 with confirmed bounces from the 05:16
   batch"* and lists `press@nhsx.nhs.uk`, `aidatascience@lloyds.com`, `alvaro.vicente@verisure.com`
   (+`elizabeth@gre-europe.com`). **The first three are in the 37 "sent" list with valid
   resend_ids** — i.e. Resend accepted the API call and issued an ID, but the mail **bounced**.
2. `ali.parsa@example.com` is in the 37 "sent" with a resend_id (`048ab499…`) — a placeholder
   `example.com` address that cannot deliver. (It pre-dates the deliverability guard, which was
   added 2026-06-16 and would now reject it.)

So the resend_id only proves **API acceptance**, not inbox delivery. The mailer never inspects
delivery/bounce webhooks — it marks `sent` on the synchronous 200. At least **4 of the 37 are
confirmed non-delivered** (3 bounces + 1 placeholder). Whether the rest actually reached inboxes
is **unverified** — there is no delivery-confirmation data on disk; the only ground truth would be
the Resend dashboard's delivery/bounce log.

**Net verdict on suspicion (b):** PARTIALLY correct but mis-diagnosed. The 37 are NOT 403
false-positives (the IDs are genuine). But they are also NOT proven delivered — ≥4 bounced, and
delivery for the remainder is unconfirmed. Treating "sent=37" as "37 prospects reached" is
inflated; "37 API-accepted, ≥4 known-bad, rest unverified" is the honest statement.

## 5. Recommendations

1. **Release 4 of the 245** — the `hello@` ICP prospects wrongly tagged `generic_press_inbox`:
   `hello@aleph-alpha.com`, `hello@caresourcer.com`, `hello@lilli.com`, `hello@cogvis.at`.
   Flip their status `suppressed_quality_20260617` → `queued`. (Net new live queue: 7 → 11.)
2. **Keep the other ~241 suppressed.** Regulators, central banks, NHS/press desks, sanctioned
   states and dupes are correctly held. Do not bulk-release the 245.
3. **Fix the `generic_press_inbox` rule** so `hello@` / `contact@` / `sales@` at non-media,
   non-regulator companies are *not* lumped with `press@<bigcorp>` media desks. Whitelist
   commercial-contact localparts when the company is an ICP vendor.
4. **Stop trusting `status:"sent"` as delivery.** Wire Resend bounce/delivered webhooks (or poll
   the dashboard) and add a `delivered` / `bounced` status distinct from `sent` (API-accepted).
   Re-audit the 37 against the Resend dashboard; expect ≥4 bounces already known.
5. **The real wall is unchanged:** the gate probe is still 403-flapping (`.probe_strikes` cycled
   1→9 repeatedly on 17-Jun). The account-level Resend send gate / domain-verify state is the
   binding constraint, not the queue size. Confirm `mail.meok.ai` verification + send-permission in
   the Resend dashboard before counting any further "sent" as real.

## Appendix — key files
- Queue: `/Users/nicholas/clawd/hive-mailer/queue.jsonl`
- Sender: `/Users/nicholas/clawd/hive-mailer/hive_mailer.py`
- Send log: `/Users/nicholas/clawd/hive-mailer/mailer.log`
- Bounce seed: `/Users/nicholas/clawd/hive-mailer/.suppressed`
- The quality-filter script itself is **gone** (deleted ad-hoc tool); criteria recovered only from
  the `suppress_reason` tags left on the rows.
