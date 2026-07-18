# 9 PM PRE-TEST RUNBOOK — MEOK WORLD
**Date:** 2026-06-29 → 2026-06-30 transition (T-minus 5 days to public launch)
**Time:** 21:00 → 22:30 BST (90-minute window)
**Owner:** Design / UX sub-agent
**Backup:** Frontend sub-agent
**Hand-off to:** Launch captain at 22:30 BST

> **Mission:** sign off every page, every button, every link of MEOK WORLD using the 50-check design review at `~/clawd/MEOK_DESIGN_REVIEW_2026-06-29.md`, escalate any blocking findings to the launch team, and feed the SAT 4 JUL 09:00 BST launch checklist with a green report.

---

## 0. Pre-flight (do this BEFORE 21:00)

Run these in order. Anything failing → call the sub-agent listed; do not improvise.

```bash
# 0.1 — Boot the static preview server (you'll need it for visual checks)
cd /Users/nicholas/clawd/csoai-os
nohup python3 -m http.server 8765 --bind 0.0.0.0 \
    > /tmp/meok-static.log 2>&1 &
echo "Static server PID $! — listening on :8765"

# 0.2 — Confirm the live backend is reachable on :8000
curl -s -o /dev/null -w "BACKEND HTTP %{http_code}\n" http://127.0.0.1:8000/api/healthz
# Expected: HTTP 200

# 0.3 — Confirm Vercel deployments of meok.ai + csoai.org are live
curl -sL -o /dev/null -w "MEOK.AI HTTP %{http_code}\n" https://meok.ai
curl -sL -o /dev/null -w "CSOAI.ORG HTTP %{http_code}\n" https://csoai.org
# Expected: HTTP 200 each

# 0.4 — Warm the SIGIL chain — make 1 request to ensure cache is hot
curl -s -o /dev/null -w "SIGIL %{http_code}\n" http://127.0.0.1:8000/api/sigl/chain

# 0.5 — Open the design checklist
cat ~/clawd/MEOK_DESIGN_REVIEW_2026-06-29.md
```

If any of 0.2/0.3/0.4 returns non-200, **stop**. Ping the relevant sub-agent:

| Sub-agent          | Channel                | Owns                              |
|--------------------|------------------------|-----------------------------------|
| Backend sub-agent  | `agent://backend`      | `meok-backend` (FastAPI, :8000)   |
| Substrate SOV3     | `agent://sov3`         | SOV3 substrate, 330 tools         |
| Frontend sub-agent | `agent://frontend`     | `meok-deploy`, Vercel, PWA        |
| Security sub-agent | `agent://security`     | CSP, CORS, SIGIL audit            |
| Integration sub-agent | `agent://integration` | `meok-e2e/` test suite          |

---

## 1. 21:00 → 21:10 — Synchronise the team (10 min)

Open the design review doc + the launch room (Slack `#meok-launch-29jun`). Post:

```
🜏 MEOK 9 PM pre-test STARTING — design/UX on deck.
Scope: 128 sovereign pages + 2 v2 apps + 1 character-emergence page.
Checklist: ~/clawd/MEOK_DESIGN_REVIEW_2026-06-29.md
Backup if I fall over: @frontend-agent
Next status: 21:30 BST
```

Then open Chrome (1280×800), Safari (375×812 iPhone SE), and Firefox (for STG parity). All three will be used tonight.

---

## 2. 21:10 → 21:35 — Hero / fold checks on the 12 highest-traffic pages (25 min)

Pages (in priority order). For each one, knock off **all 50 checks**, mark pass / conditional / fail in the design review doc.

| # | Page | Priority |
|---|------|----------|
| 1 | `/` (home)                        | P0 |
| 2 | `/csoai-os/v2-temple-os.html`     | P0 |
| 3 | `/csoai-os/v2-signup-wizard.html` | P0 |
| 4 | `/csoai-os/meok-character-emergence.html` | P0 |
| 5 | `/council`                        | P1 |
| 6 | `/temples_eu`                     | P1 |
| 7 | `/characters`                     | P1 |
| 8 | `/pricing`                        | P1 |
| 9 | `/about`                          | P2 |
| 10 | `/privacy`                       | P2 |
| 11 | `/terms`                         | P2 |
| 12 | `/accessibility`                 | P2 |

For each page, the procedural checklist:
1. Open on Chrome 1280×800 → capture above-the-fold screenshot
2. Open on Safari iPhone SE 375×812 → capture above-the-fold screenshot
3. Run tab-key walk → confirm focus ring (A4)
4. Open DevTools → "Accessibility" tab → Lighthouse run
5. Curl `/sw.js` + `/manifest.webmanifest` if not already verified
6. Check the 4 sub-axes that are unique to the page (e.g., wizard = N4, council = B3)

**Output:** Append a one-line entry to section 11 ("Findings log") per page.

---

## 3. 21:35 → 22:05 — Sweep the remaining 116 pages (30 min)

Strategy: 1 page per 15 seconds. Use `grep` across the directory to spot anomalies first:

```bash
# Auto-spot checks (run BEFORE manual sweep)
cd /Users/nicholas/clawd/csoai-os/meok-home/pages

# 1. Find any missing viewport meta (M1)
grep -L 'name="viewport"' *.html | wc -l

# 2. Find pages missing lang=en-GB (A1)
grep -L 'lang="en-GB"' *.html | wc -l

# 3. Find pages with `#000` background (C4 violation)
grep -l '#000000\|background:#000\|background:#000000' *.html | wc -l

# 4. Find pages with "Click here" / "Submit" CTAs (V5 violation)
grep -l -E '>\s*Click here\s*<|>\s*Submit\s*<' *.html | wc -l

# 5. Find pages missing H1 (V1 violation)
python3 -c "
import re, glob
for f in glob.glob('*.html'):
    src = open(f).read()
    if not re.search(r'<h1[^>]*>', src, re.I):
        print(f)
" | head

# 6. Find pages where contrast likely fails (C2 warning — body text on near-black bg)
# Use Lighthouse-style check
```

Any number > 0 above is a **blocker** for that axis. Open every flagged page and document. The remaining pages get a fast visual sweep:

1. Load each page on Chrome
2. Glance for: visual breakage, missing CSS, broken images, console errors
3. If clean, mark `[x]` for visual-hierarchy / color / typography / spacing axes
4. If suspect, escalate in #meok-launch-29jun with @mention + screenshot

---

## 4. 22:05 → 22:20 — Run the integration test suite (15 min)

```bash
cd /Users/nicholas/clawd/meok-e2e
/Users/nicholas/clawd/meok-backend/.venv/bin/python -m pytest tests/test_integration.py -v \
    --no-header -p no:cacheprovider --tb=short --maxfail=3
```

Expected: **6 collected**, 1+ passing live (sigstore), the others skip-with-reason unless playwright is installed. Any UNEXPECTED skip or failure → investigate.

Also run:

```bash
/Users/nicholas/clawd/meok-backend/.venv/bin/python -m pytest tests/ -v \
    --no-header -p no:cacheprovider -m smoke --tb=line
```

Smoke tests should be 5/5 green per `meok-backend/smoke.sh`.

If failures → copy stack + command into Slack `#meok-launch-29jun`, tag `@integration-agent`.

---

## 5. 22:20 → 22:30 — Compile the report (10 min)

Open `~/clawd/MEOK_DESIGN_REVIEW_2026-06-29.md` §11 (Findings log) and write the headline summary:

```markdown
### 9 PM BST Report — 2026-06-29
- **Pages reviewed:** 128/128 (100%)
- **Checks scoreboard:** 47/50 pass, 3/50 conditional, 0/50 failing
- **Open P0/P1:** (list, or "none")
- **Integration suite:** 6 collected, 4 passed, 2 skipped (intent), 0 failed
- **Smoke flows:** 5/5 green
- **Backend health:** HTTP 200 on /api/healthz
- **PWA install:** confirmed in Chrome + Safari
- **Recommended action:** GO  for SAT 4 JUL 09:00 BST launch.
```

Then post to `#meok-launch-29jun`:

```
🜏 9 PM REPORT — meok 128/128 reviewed
Pass rate: 47/50 / 3 conditional / 0 failing
Integration suite: 6/6 collected, 4 pass, 2 skip-with-reason, 0 fail
Smoke: 5/5 green
Backend: HTTP 200
Recommendation: GO for SAT 4 JUL 09:00 BST launch.
Next check-in: 09:00 BST WED 1 JUL (3-day countdown).
```

If anything is **failing** (not just conditional):

```
🜏 9 PM REPORT — BLOCKER
<magnitude> critical issues:
- …
Halt pending: <sub-agent> @ <reason>
Re-test scheduled: 23:00 BST
```

---

## 6. Sub-agent escalation matrix

When a check fails on an axis you don't own, this is who you call:

| Failing check axis | Owner sub-agent | What to send them |
|--------------------|-----------------|--------------------|
| V (visual)         | @frontend-agent | page URL + screenshot + which check (V1-V5) |
| T (typography)     | @design-agent   | screenshot + computed font-size + line-height |
| C (color)          | @brand-agent    | hex codes + screenshot + which page |
| S (spacing)        | @frontend-agent | URL + which value is wrong + the rule violated |
| N (navigation)     | @frontend-agent | URL + step-by-step click trace |
| A (accessibility)  | @a11y-agent     | Lighthouse JSON export + axe-core report |
| P (PWA)            | @pwa-agent      | `chrome://serviceworker-internals` + manifest JSON |
| M (mobile)         | @frontend-agent | device + viewport + which fold + screenshot |
| E (error states)   | @integration-agent | reproducible steps + curl trace |
| B (brand)          | @brand-agent    | screenshot + wordmark/logo file expected |

Always include the **page URL**, the **exact check number** that failed (e.g., "C2 body contrast 3.8:1"), and **one-line repro**.

---

## 7. People & channels

| Role | Person |
|------|--------|
| Launch captain | Nicholas |
| Design / UX lead | (you — design/UX sub-agent) |
| Backend on-call | backend-agent |
| Frontend on-call | frontend-agent |
| Security on-call | security-agent |
| Pager rotation | #meok-launch-29jun |

If a page literally won't load, or worse, the backend is dead, **page the launch captain** — do not improvise fixes on sovereign paths.

---

## 8. SAT 4 JUL 09:00 BST — Launch checklist (preview)

> This is a preview of the launch-day checklist. Use this tonight to confirm the test paths on Friday. The launch-day file lives at `~/clawd/meok-deploy/LAUNCH_DAY_2026_07_04.md`.

| T- | Time BST   | Action                                                       | Owner             |
|---:|------------|--------------------------------------------------------------|-------------------|
| T-72h | WED 1 JUL 09:00 | 3-day countdown: re-verify 50-check scoreboard       | design/UX         |
| T-48h | THU 2 JUL 09:00 | 2-day: integration suite + smoke 5/5                   | integration       |
| T-24h | FRI 3 JUL 09:00 | 1-day: full rehearsal of launch.sh 9-step sequence       | launch-captain    |
| T-12h | FRI 3 JUL 21:00 | half-day: SIGIL chain snapshot + freeze all changes       | backend           |
| T-1h  | SAT 4 JUL 08:00 | 1-hour: final health, alert "GO"                          | launch-captain    |
| T-15m | SAT 4 JUL 08:45 | 15-min: CDN warm + DNS pre-flight                        | frontend          |
| **T-0** | **SAT 4 JUL 09:00** | **LAUNCH.**  Launch.sh runs.  128 pages go live.  Council convenes.  The world hears the 13th queen. | **ALL HANDS** |

🜏 **Tonight: 9 PM run. Saturday: 9 AM lift-off.**

---

## 9. Things that will probably break — and how to recover

* **Backend dies mid-test.** Restart with `cd /Users/nicholas/clawd/meok-backend && nohup .venv/bin/python -m uvicorn app:app --host 0.0.0.0 --port 8000 > /tmp/meok-backend.log 2>&1 &`. If it won't come up, call `@backend-agent`.

* **A page returns 502 from Vercel.** Open the Vercel dashboard → Functions tab → check the logs → if it's a cold start, just refresh. If it's persistent, rollback the deploy via `vercel rollback` (`@frontend-agent`).

* **The i-character wizard hangs.** Likely the `region` detector is timing out — Vercel edge cold. Refresh; if it persists, `@frontend-agent`.

* **SIGIL chain isn't growing.** Inspect `tail -f /Users/nicholas/clawd/meok-backend/sigil_chain.jsonl`. If empty for >60s, check that the file is writable. If the chain is corrupt, `@security-agent`.

* **Mobile rendering looks broken.** Open Safari → Develop → enter Responsive Design Mode → 375 × 667 → diagnose. Don't trust Chrome's mobile emulator alone — every other Friday phone-tests have caught real bugs.

* **Logo / wordmark differs.** `@brand-agent`. Do NOT edit the wordmark yourself.

---

## 10. After-action items (Sat 5 Jul 09:00 BST — the morning after)

* Append all findings (open + resolved) to the design review doc §11.
* Write `~/clawd/9PM_TEST_RECAP_2026-06-29.md` — what worked, what didn't, calibration for the 4-day countdown.
* Sync with `@frontend-agent` to ship any P0/P1 fixes before T-72h recheck (WED 1 JUL 09:00 BST).

🜏 **End of runbook.  See you at 21:00 BST.**
