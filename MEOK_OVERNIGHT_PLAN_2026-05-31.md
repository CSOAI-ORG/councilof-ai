# MEOK — Overnight Autonomous Plan (2026-05-31 → 06-01)

_By Claude (Opus 4.8). Nick: "12 hours overnight, no interruptions, bring MEOK to year-2100
levels." Honest reframe: I can't deliver "year 2100" — that's not a real deliverable. What I
CAN deliver is the **highest-value focused push** toward the July-4 launch, build-only,
budget-capped, verifying every claim. This doc is the contract I hold myself to while you sleep._

## Nick's locked decisions (2026-05-31, before sleep)
- **Spend cap: $10 total** (paid OpenRouter, overnight, ON TOP of the ~$2.26 suite already running). Hard stop, log skips.
- **Focus: ALL phases** (B wire-winner, C tools-as-actions, D IP-pack, E funding, F 3-window UI) — in plan order, value-first.

## Hard guardrails (I will NOT cross these unattended)
- **Branch:** work ONLY on `claude/meok-one`. NEVER commit to `main`. NEVER `git add -A`. NEVER force-push. (COORDINATION rules.)
- **Money:** hard cap on paid API spend = **$10 total** overnight. Stop at the cap, log what was skipped.
- **No irreversible / public actions:** no public deploys, no DNS, no Stripe changes, no emails/posts, no new domains, no deleting. Build + commit + push my own branch only.
- **No identity spoofing:** commit as `Claude (Opus 4.8)` only. Won't touch other agents' folders.
- **Honesty:** verify with real output before writing "done." Save incrementally. If the bash channel stalls (it has ~6× today), I log state and resume, never fabricate a result.
- **The 70abab7 rebase stays PARKED** (needs Nick's force-push OK). Won't rewrite shared history unattended.

## Reliability caveat (honest)
This macOS bash channel has stalled repeatedly today. A true unbroken 12-hour autonomous run
is NOT guaranteed on this setup. Mitigation: every task saves to disk incrementally; I drive
the loop with ScheduleWakeup so a stall just pauses, not loses. Heavy compute runs ON the GCP
VM (always-on), not the Mac. If I can't make progress safely, I stop and leave a clear note
rather than thrash.

## The plan (priority order — value first, so a stall still banks the best work)

### PHASE A — Land the experiment (the thing already running)
1. When the full suite finishes, parse `full_suite.json`, write **MEOK_BFT_VERDICT.md**:
   per-phase winner (architecture/care, capability/truth, Opus×right pairing), with the real
   judge numbers. Pick the **default architecture to ship**.
2. If a phase aborted on budget/stall, re-run only the missing cells (within cap).

### PHASE B — Make the winner REAL (wire it into the character)
3. Wire the winning architecture into `brains.py`/`server.py` so the actual MEOK ONE
   character uses the council (today the council exists but the live character still uses the
   2-node path). Behind a config flag; keep the old path as fallback.
4. End-to-end verify in the browser-served app (real output, not claimed).

### PHASE C — Tools become actions (lens→tools INVOCATION)
5. `lens_tools.py` is data-only today. Make the safety lenses actually CALL their SOV3 tools
   (e.g. care_governor → `analyze_care_patterns`, injection_guard → `detect_threats`) during
   review — gated behind tier + safety. This is the "spread 300 tools across 12" made live.

### PHASE D — Protect the IP (free/cheap, per the strategic memo)
6. Real **prior-art check** on the one plausibly-novel claim (care-gated safety-veto +
   EigenBFT confidence-vector synthesis for character safety).
7. Draft **MEOK_PROVISIONAL_PATENT_DRAFT.md** (you file the ~£60 provisional; I can't file).
8. Draft a **defensive-publication** post for the open parts (£0 freedom-to-operate).

### PHASE E — The honest growth path (not IPO)
9. Write **MEOK_FUNDING_PATH.md**: revenue → pre-seed → seed, with what the research proves,
   and a 1-page research-credibility note (Show HN / preprint outline) from the verdict.

### PHASE F — July-4 product progress (toward the 3-window OS)
10. Advance the 3-window UI (character / chat / TUI) per MEOK_ONE_VISION — assemble what's
    buildable headlessly; leave a screenshot-verify checklist for you in the morning.

### Always-last
11. Write **MEOK_MORNING_RUNDOWN.md**: what got done, real numbers, what's blocked on you,
    exact next steps. Commit + push everything to `claude/meok-one`.

## Morning deliverables you should expect
- MEOK_BFT_VERDICT.md (which architecture won, real numbers)
- Winning council wired into the live character (B) + lens tools firing (C)
- MEOK_PROVISIONAL_PATENT_DRAFT.md + prior-art note + defensive-pub draft (D)
- MEOK_FUNDING_PATH.md (E)
- 3-window UI progress + verify checklist (F)
- MEOK_MORNING_RUNDOWN.md tying it together
