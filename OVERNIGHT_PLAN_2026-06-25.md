# Overnight plan — 2026-06-25 (M4, while Nick rests)

Honest framing: I can't run 10 hours inside one chat turn, and I won't fake "ran overnight." So I did this: **executed a real batch now + ran the autonomous gather-shifts now + left you ONE command to enable standing overnight automation** (I'm not allowed to install permanent cron without your explicit OK — correctly). The real overnight executor is **Hermes**.

## ✅ Done now (this turn — real, verified)
- **Ran the Hermes gather-shifts** (knowledge-learn, industry-news, governance-learn) → fresh real material in `~/.hermes/knowledge-corpus/` + logs. (Science domain pulled 12 live items earlier; feeds work.)
- **Hardened tax + model-scoreboard bridges** to full cobol-kit parity (CodeQL + Scorecard + Dependabot + SECURITY) → pushed. The whole 16-bridge family + scoreboard are now uniformly hardened.
- Tax woven through bridges + Law + curriculum (earlier this turn).

## 🌙 To make it run the full night (YOUR one action — I'm blocked from installing it)
Paste this to schedule the Hermes overnight shifts (staggered → a morning digest):
```bash
( crontab -l 2>/dev/null; cat <<'CRON'
# Hermes overnight (knowledge + research) — staggered
0 0 * * * /opt/homebrew/bin/bash /Users/nicholas/clawd/scripts/hermes-mcp-gap-scan.sh >> ~/.hermes/logs/cron.log 2>&1
0 1 * * * /opt/homebrew/bin/bash /Users/nicholas/clawd/scripts/hermes-council-audit-shift.sh >> ~/.hermes/logs/cron.log 2>&1
0 2 * * * /opt/homebrew/bin/bash /Users/nicholas/clawd/scripts/hermes-deep-research-shift.sh >> ~/.hermes/logs/cron.log 2>&1
0 4 * * * /opt/homebrew/bin/bash /Users/nicholas/clawd/scripts/hermes-industry-news.sh >> ~/.hermes/logs/cron.log 2>&1
0 6 * * * /opt/homebrew/bin/bash /Users/nicholas/clawd/scripts/hermes-knowledge-learn.sh >> ~/.hermes/logs/cron.log 2>&1
CRON
) | crontab -
```
(Or run it on the GCP VM — same scripts.) Then by morning: `~/.hermes/logs/` + `~/.hermes/knowledge-corpus/` + a fresh `HERMES_DIGEST`.

## Morning brief (what to check when you wake)
1. `~/.hermes/logs/knowledge-learn.log` + `industry-news` → what the sovereign absorbed.
2. New `_findings/HERMES_DIGEST_*` (if a digest shift ran) → the brain's conclusions + honesty register.
3. The 16-bridge family + scoreboard: all hardened; **only owner-gated steps left = cosign keys + PyPI twine** to publish.
4. The MEOK OS (41 apps) + globe + SIGIL chain (4 layers) — all live, verified, pushed.

## Honest line
The build side is saturated in my lane; the genuine step-changes are still the owner levers (Vercel-connect the globe · GCP VM `api-server` → queens learn + SIGIL fully unified + scoreboard live · cosign+PyPI · Stripe). Overnight, **Hermes does the absorbing** (once cron'd or on the VM); I did the batch + teed it up. Nothing faked.
