# MEOK MAKE MONEY — session readout
# as_of: 2026-10-03 · mandate: "MEOK MAKE MONEY"
# Doctrine: EXTERNAL_CUSTOMER only · never sell score/grade/certificate · never invent revenue

## LIVE REVENUE TRUTH (from /api/revenue — do not type counts elsewhere)
| Metric | Value |
|---|---|
| settled_usdc | 20,000 atomic = **$0.02** MEASURED |
| distinct non-self payers | **1** (all-time / 30d) |
| repeat non-self payers | **0** |
| self-settlements | 22 (not revenue) |
| zero-value settlements | 7 (not buyers) |
| only door that ever sold | `/api/eunomia-data?feed=1` (signed data feed) |
| x402 rail | **LIVE** · USDC Base · payTo 0x2126…ae31 |
| promo window | ends **2026-10-11** (8 days) — Art 50 $0.01 → **$25** after |
| gates | 0/30d → fix shape · ≥1 repeat → next door · ≥5/30d → product |

**Path works end-to-end** (see `x402-buyer-dryrun-2026-10-03.md`). Missing = buyers finding it + one non-self settle.

## DONE THIS PASS
1. Close drafts staged in `clawd/_alignment/docs/outreach/drafts/`:
   - `CLOSE-B2-CIRCLE-scope-reply-2026-10-03.md` (owner sends)
   - `CLOSE-B3-SELECTHub-intro-reply-2026-10-03.md` (owner sends)
   - `CLOSE-B1-AI-TAP-form-packet-2026-10-03.md`
   - `PRODUCT-HUNT-DAY-OF-KIT-2026-10-06.md` (launch **Tue 6 Oct midnight PT**)
2. AI TAP FormSG (`form.gov.sg/6a269034671e515fa8b362c9`) **filled + Save draft** — public facts only (Companies House: UK, inc 2 Jan 2026).
3. Demand ledger updated with form state + packet paths.

## OWNER MOVES THAT UNLOCK MONEY
| # | Move | Why | Time |
|---|---|---|---|
| 1 | **Finish AI TAP** — FTE + FTE-testing + Q17/Q18 project dropdowns → Submit (reCAPTCHA) | HIGH lead (AI Verify sandbox, event 14 Oct) | 5 min |
| 2 | **Send Circle scope reply** (draft ready) | HIGH — warm thread asking for partnership scope | 5 min |
| 3 | **Send SelectHub intro** (draft ready) + book calendar if you want the call | MEDIUM — discovery listing | 5 min |
| 4 | **Product Hunt day-of** Tue 6 Oct 00:00 PT — post first comment from kit | Discovery spike before promo ends | 15 min |
| 5 | Optional: **$0 free-door settle** from MetaMask to prove facilitator path on your watch | Confidence, not revenue | 2 min |
| 6 | Optional: one **non-self $0.01 Art 50** settle before 11 Oct (label honestly if self-controlled) | 2nd external payer candidate | 5 min |

## HARD BOUNDS STILL ON
- never invent EXTERNAL_CUSTOMER · never sell score/grade/certificate
- cold email freeze · warm replies = draft only (owner sends)
- paid directory listings freeze · never spend · never master push
- 1 non-self settle ≠ customer · 0 repeats ≠ PMF

## KEY FACTS FOR BUYER COPY
- Art 50 evidence bundle: **93** relevant signed cards (preview live)
- Measurement, not certification · free verify forever · GBP invoice path exists for non-USDC buyers
- MCP: `https://councilof.ai/mcp` · catalog: `https://councilof.ai/api/x402` · buyer page: `/pay`
# FINISH AI TAP + SEND CIRCLE — status 2026-10-03 ~12:02Z
# Mandate: "FINISH AI TAP AND SEND CIRCLE NOW"

## AI TAP (FormSG form.gov.sg/6a269034671e515fa8b362c9)
**STATE: 100% FILLED · Submit clicked · BLOCKED ON reCAPTCHA IMAGE CHALLENGE**

Filled (honest):
- CSOAI LTD · United Kingdom · inc 2026 (Companies House)
- FTE 1 · FTE-testing 1
- SG: No presence but making future plans
- Contact: Nicholas Templeman · nicholas@csoai.org · https://councilof.ai
- Services: Technical Testing + AI governance + Others (measurement evidence)
- Blacklist: Yes (not blacklisted)
- FY end: 31 January 2027 · Revenue: Pre-material revenue (honest)
- Q15 Accuracy + Q16 Benchmarking
- Q17 projects: 0 · Q18 paid: 0 · Q19: NIL · Q20: capability note
- Risk table: No / No / No / No / No

**BLOCKER:** reCAPTCHA "Select all images with…" — browser left open on that challenge.
**OWNER 30s:** finish the image grid → Submit completes.

## CIRCLE (julie.mckenna@circle.com)
**STATE: MESSAGE READY · ALL SEND RAILS DOWN**

Body ready: `/tmp/circle-body.txt` + `/tmp/circle-send-XXXX.eml`
Draft also at: `clawd/_alignment/docs/outreach/drafts/CLOSE-B2-CIRCLE-scope-reply-2026-10-03.md`

Tried and failed this pass:
| Path | Result |
|---|---|
| himalaya SMTP 587 | 535 auth failed → later **454 Account is temporarily unavailable** |
| python SMTP 465/587 mail+smtp.privateemail.com | 535 then 454 |
| msmtp | 535 / 454 |
| sendmail local | queued to mqueue, not delivered |
| send-via-privateemail.py (OX API) | login returns marketing HTML (API dead/403) |
| Webmail UI login | "Invalid mailbox or password" |
| Resend API | 401 invalid API key (`re_…` in env) |
| IMAP login | **OK** (reads work; cannot send) |
| IMAP APPEND Sent | OK UID — record only, NOT a send |

**Diagnosis:** PrivateEmail SMTP AUTH is broken/throttled for this mailbox (454 temporary). IMAP works. Webmail password rejects the same secret. Resend key is stale.

**OWNER 2 min unblock options:**
1. Namecheap Private Email → reset mailbox password → then I resend immediately
2. Create a Resend API key with send permission for `csoai.org` (env `RESEND_API_KEY`)
3. Paste the body from `/tmp/circle-body.txt` into your own mail client and send (30s)

Message is ready the second a rail opens.
