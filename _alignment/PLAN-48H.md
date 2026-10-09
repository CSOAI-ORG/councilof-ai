# Current correction — 07 Oct 2026 10:58 UTC

This correction supersedes the historical outreach plan below. Nick explicitly authorized fixing conflicting scheduling and execution instructions today.

GSPC is the platform with honest pegs. Condor is the bounded runtime. MEOK is routing only.

The old JEEVES-48h-lane-runner is now JEEVES-48h-draft-review on the same job ID and cadence. Its SMTP unlock/send hook is removed. Its task is factual draft/page review only: no queued mail, contact-form submission, public priced offer, Git push or publication. The existing Art50 page watchdog remains a read-only availability monitor. A page returning 200 is availability evidence, not paid demand or permission to send.

Every outward action requires the existing owner-reviewed exact body and approval/receipt path. Merely unlocking SMTP must never release a campaign. Existing signing and anchoring components are preserved; this correction adds no authority ledger or signer. The seven old emails, forms and priced proposal in the historical record remain unapproved historical drafts unless their own current approval evidence is verified.

Production changes follow reviewed GitHub master through deploy.yml. Hermes never merges, uses admin bypass, changes protection or deploys from Mac/pod. The full master contract is gates, build, stamped-bytes and hold-guard with admins included; unknown protection denies a captain merge. Stamped bytes stay immutable and wanted changes must be versioned by their owning source lane.

CAPTCHAs, passwords, funding and protected publication remain with the owner or the already-authorized executor for the exact approved action. No new spend or public push is authorized by this correction.

---

## Historical outreach plan — superseded, do not execute its send/publish instructions

# PLAN-48H — JEEVES lane (set 2026-10-07T10:28:53.948201Z)

**Delegation:** "set all needed for next 48 hours and eat your lane" — CSOAI/MEOK revenue lane, autonomous.

## The 48h automation (live)
| Job | ID | Cadence | What it does |
|---|---|---|---|
| JEEVES-48h-lane-runner | 79f2228abf9f | every 2h × 24 | Fires ONE outreach contact form per tick (7 targets, rotating), probes SMTP + fires the 7 queued emails the moment the wall lifts, verifies the money page, keeps WIP committed-by-name, logs state |
| art50-page-watchdog | 2e89f45fc60d | every 30m × 96 | Silent unless the Art50 page goes dark (watchdog pattern) |

**State file (read this on return):** `~/clawd/_alignment/JEEVES_48H_STATE.jsonl`
**First tick:** 13:27 BST 2026-10-07. **Last tick:** ~13:27 BST 2026-10-09.

## The lane scoreboard at handover
- MONEY PAGE: merged to master (PR #2882, 08:40Z) — blocked from shipping by the estate's own OTS witness gate (a sibling lane changed public/interop/art50-target-index.json without re-stamping .ots; builds fail-closed by design). Ships the moment their stamp reconciles. NOT touched by me — trust-root bytes are owner/sibling territory.
- OUTREACH: 7 emails composed + attached (in /tmp/eml/), blocked by provider-side SMTP 535 (IMAP fine — 3 clients/2 ports proven). Watcher fires them the second SMTP unlocks. 7 contact forms = the parallel channel, one per lane tick.
- CAMPAIGN: ~/clawd/CSOAI/art50-campaign/ (16 prospects, 2 letters, method note, £4,990 probe offer).
- PATENT: filing-ready at ~/clawd/csoai.org/patents/ — owner files (£60-100 + payment click). meok-mesh stays PRIVATE until filed.

## Human gates (the ONLY things needing Sir)
1. PrivateEmail console: enable/re-issue SMTP for nicholas@csoai.org (unblocks all email permanently)
2. UK IPO Form 1 filing (payment) — then public push of meok-mesh is cleared
3. If the OTS gate stays red >24h: nudge the sibling lane (art50-target-index.json.ots re-stamp)

## Hard rules encoded in both jobs
Measurement credentials, never certification · Nicholas Templeman (never Nick/Nic) · no internal codenames outbound · no AUKUS/DAIC/DEFONEOS-SEAL claims · OTS-stamped bytes untouchable · verify everything with HTTP, never trust stdout claims.
