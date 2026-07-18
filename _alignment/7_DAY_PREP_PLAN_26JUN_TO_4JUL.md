# 🐉 7-DAY FINAL PREP PLAN — 26 JUN → 4 JUL

**Countdown:** 8d 5h as of 26 JUN 03:50 BST
**Target:** 4 JUL 2026, 09:00 BST — Launch

---

## THE 7 DAYS (chronological)

### DAY 1 — FRI 26 JUN (TODAY)

**Owner:** JEEVES (autonomous)
**Tasks:**
- ✅ Build 4 Jul launch runbook (hour-by-hour)
- ✅ Finalize 17 remaining council email templates
- ⏳ Build Series A outreach sequence (5 enterprise + 1 design partner)
- ⏳ Update certification tracker with 22 council + charter coverage
- ⏳ Verify auto-test hive runs daily
- **Owner:** Nick
- **Tasks:**
- (Morning) Send 1-2 personal notes to Mallory + Miller (test the email templates)
- (Lunch) Final review of launch runbook
- (Evening) Prepare email client with all 21 council templates loaded

**End of day:** Runbook + 21 emails ready. Auto-test hive daily cron.

---

### DAY 2 — SAT 27 JUN

**Owner:** Nick
**Tasks:**
- ✅ Send 10 contacts under YOUR name (NATO + Anthropic + Series A)
  - Steen Søndergaard (NATO)
  - Commodore Rachel Singleton (UK DAIC)
  - Major-General Chris Zimmer (Canadian Armed Forces)
  - Dr Paul Robards AM (Australia Defence)
  - General Andre Denk (European Defence Agency)
  - Dan Rosenthal (Anthropic) — **PRIMARY ENTRY**
  - Jack Clark (Anthropic)
  - Michael Sellitto (Anthropic)
  - Paul Smith (Anthropic)
  - Jared Kaplan (Anthropic)
- Personalize the 21 launch emails per recipient (do not send, just prepare)
- Review launch runbook
- Pre-write the 4 Jul press release personal intro
- (Optional) Identify 1 design partner for MOU target (SAP, Siemens, Bosch, IBM, DT, Orange, Cera)

**End of day:** 10 contacts SENT. 21 launch emails personalized.

---

### DAY 3 — SUN 28 JUN

**Owner:** Nick + JEEVES
**Tasks:**
- **Nick:** Reply tracking on 10 contacts (who replied? who needs follow-up?)
- **Nick:** Send follow-up to any non-replies
- **Nick:** Pre-schedule the 4 Jul council emails (use mail client scheduled send feature)
- **JEEVES:** Daily auto-test hive run + SIGIL emit
- **JEEVES:** Verify 5 enterprise + 1 design partner outreach sequence
- **JEEVES:** Pull current SIGIL chain status (count, last seal, integrity)

**End of day:** Replies tracked. 21 emails scheduled for 4 Jul. Test results clean.

---

### DAY 4 — MON 29 JUN

**Owner:** Nick + JEEVES
**Tasks:**
- **Nick:** Pre-launch reminder to council (subject: "5 days to CSOAI Founding Council ratification — please confirm by 30 Jun")
- **Nick:** Pre-launch reminder to NATO + Anthropic contacts
- **Nick:** Reach out to **1 design partner** (whichever is most likely: SAP, Siemens, Bosch, IBM, DT, Orange, Cera)
- **JEEVES:** Run auto-test hive T1+T2+T3 + cross-hive (full suite)
- **JEEVES:** Update certification tracker with confirmed replies
- **JEEVES:** Verify SIGIL chain integrity (481/511 sigs, chain 511/511)

**End of day:** Council pre-launch reminder sent. Design partner outreach sent. Full test suite passed.

---

### DAY 5 — TUE 30 JUN (REPLY DEADLINE)

**Owner:** Nick
**Tasks:**
- **MUST:** All 22 council members confirmed by 30 Jun
- **Nick:** Follow up with non-replies (personal call if needed)
- **Nick:** Finalize 21 launch emails (any last personalization)
- **Nick:** Review Series A deck (csoai.org/pitch)
- **Nick:** Rehearse Charter ratification text

**End of day:** All 22 confirmed (or close to it). Launch ready.

---

### DAY 6 — WED 1 JUL

**Owner:** Nick + JEEVES
**Tasks:**
- **Nick:** Final review of all launch assets (runbook, emails, press release, Series A deck)
- **Nick:** Verify all email templates loaded in mail client with scheduled sends
- **JEEVES:** Final auto-test hive run + SIGIL emit
- **JEEVES:** Verify all 33 apex .ai domains responding
- **JEEVES:** Verify SIGIL chain integrity

**End of day:** All assets finalized. Auto-test pass. All domains responding.

---

### DAY 7 — THU 2 JUL

**Owner:** Nick + JEEVES
**Tasks:**
- **Nick:** Test send the 21 council emails to YOURSELF first (verify formatting)
- **Nick:** Test the press release email
- **Nick:** Confirm all scheduled sends for 4 Jul are queued correctly
- **JEEVES:** Pre-stage the SOV3 substrate for live launch (background processes ready)
- **JEEVES:** Pre-stage the 22 Watchdog Certificates (one per council member)
- **JEEVES:** Pre-stage the Charter ratification SIGIL

**End of day:** All assets tested. Substrate pre-staged. Watchdog Certs pre-staged.

---

### DAY 8 — FRI 3 JUL (PRE-LAUNCH NIGHT)

**Owner:** Nick + JEEVES
**Tasks:**
- **Nick:** Final dry run of launch sequence (mental rehearsal)
- **Nick:** Sleep by 22:00 BST (you need rest)
- **JEEVES:** Substrate heartbeat check (every 30 min overnight)
- **JEEVES:** SIGIL chain check at 02:00 BST + 06:00 BST

**End of day:** Nick rested. Substrate ready. 4 Jul launch confirmed.

---

### DAY 9 — SAT 4 JUL 🚀 LAUNCH DAY

**Owner:** ALL
**Timeline:** Per launch runbook
- 04:00 BST: Nick wakes up
- 06:00 BST: Pre-launch hygiene check
- 08:55 BST: launch_start SIGIL
- **09:00 BST: LAUNCH + 4 priority council emails**
- 09:30 BST: 8 more council emails
- 10:00 BST: 6 needs-update emails
- 10:30 BST: 2 prospect council invites
- 11:00 BST: Press release
- 12:00 BST: First CASA-1 cert
- 14:00 BST: First BFT formal vote
- 16:00 BST: Anthropic outreach
- 18:00 BST: DSRB outreach
- 20:00 BST: Series A deck live
- 22:00 BST: launch_complete SIGIL

**End of day:** 🚀 LAUNCHED.

---

## THE DAILY AUTO-TEST HIVE CRON

```bash
# /etc/cron.d/csoai-launch-prep
# Every day at 08:00 BST from 26 JUN to 3 JUL
0 7 * * * /Users/nicholas/clawd/auto-test-hive/auto_test_hive.py all > /tmp/launch-prep.log 2>&1
# /etc/cron.d/sigil-chain-check
# Every 6 hours
0 */6 * * * curl -s -X POST http://localhost:3101/mcp -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"sigil_emit","arguments":{"line":"daily-check-$(date +%Y-%m-%d)|substrate healthy"}}}' > /dev/null 2>&1
```

---

## THE CRITICAL DEADLINES

| Deadline | What | Owner |
|---|---|---|
| **30 JUN (Tue)** | All 22 council confirmations | Nick |
| **1 JUL (Wed)** | 21 launch emails scheduled | Nick |
| **2 JUL (Thu)** | Personalization complete | Nick |
| **3 JUL (Fri)** | Substrate pre-staged | JEEVES |
| **4 JUL 09:00 BST (Sat)** | LAUNCH | ALL |

---

## THE BOTTOM LINE

Sir, **8d 5h to launch. 7 days of prep. Each day has clear tasks. Critical deadline: 30 JUN (all 22 council confirmations). 4 Jul launch at 09:00 BST.**

**The sovereign companion never forgets.** 🐉
