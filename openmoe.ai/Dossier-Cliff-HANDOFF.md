# Dossier Cliff Correction — Handoff to Nick

**Date**: 2026-06-12
**Branch**: fix/article-50-dossier-correction
**Commit**: 52592bf (1 file, +8/-12 lines)
**Source file**: openmoe.ai/openmoe_ai_diamonds_and_breakthroughs_FACTCHECKED.md
**Repo**: /Users/nicholas/clawd/openmoe.ai/ (remote: openmore.ai, 403)

## What the commit does

The dossier's §7 Actionable Recommendations and §8 verification matrix
still cited "2 November 2026" in 2 places. This commit closes the
loop on the dossier's Article 50 cliff story:

  - Line 392: 'the critical August/November 2026 compliance path' →
    'the critical August 2026 compliance path (the Article 50 cliff).
    The Digital Omnibus delayed high-risk Annex III to 2 Dec 2027,
    which is a separate deadline.'

  - Line 408: 'the live package doc says November 2026, marketing
    says August 2026' → 'Article 50 deadline verified 12 Jun 2026 —
    canonical = 2 August 2026. The previous edition's "2 November
    2026" claim was sourced from a stale PyPI summary on
    meok-watermark-attest-mcp 1.3.10. Hotfixed to 1.3.11 with the
    correct 2 Aug summary on 12 Jun 2026 (the in-package server.py
    docstring and the /article-50-kit landing page were already
    correct). Sources: artificialintelligenceact.eu/transparency-
    rules-article-50/, HSFKramer 2026-03, TwoBirds. The Digital
    Omnibus (EU Parliament 569-45, 23 Mar 2026) delayed high-risk
    Annex III to 2 Dec 2027 only — Article 50 is a transparency
    obligation on all AI systems, not high-risk-only, and was not
    touched.'

The 2 remaining "November 2026" mentions (lines 40, 384) are in the
meta-context — they describe the previous edition's error and the
hotfix. They are not claims of the canonical date; they are
historical references to the drift and the fix.

## Why push failed

Same openmore.ai 403 as the other 2 openmore.ai patches. Branch is
local-only; needs Nick to push from his auth.

## How to apply

```bash
cd <your openmore.ai clone>
git checkout main
git pull

# Apply the patch:
git apply --check /Users/nicholas/clawd/openmoe.ai/Dossier-Cliff-Patch-2026-06-12.patch
git apply /Users/nicholas/clawd/openmoe.ai/Dossier-Cliff-Patch-2026-06-12.patch

# Verify the diff is just the 1 file:
git diff --stat
# Expected: openmoe_ai_diamonds_and_breakthroughs_FACTCHECKED.md | 20 ++++++++------------

# Commit + push + open PR:
git add openmoe_ai_diamonds_and_breakthroughs_FACTCHECKED.md
git commit -m "fix(dossier): Article 50 deadline verified — 2 August 2026 canonical

[wipe the Mavis-generated commit body and use your own, or paste from
the commit message that I left in the patch's From field]"
git push origin main

# Open PR in browser (gh CLI may 404 due to token scope):
# https://github.com/CSOAI-ORG/openmore.ai/pull/new/main
```

## Cross-tab reference

- _TABS/STATUS.md — current state
- _TABS/GITHUB_PR_FALLBACK_2026-06-12.md — failure-mode matrix
- meok-watermark-attest-mcp PR-HOTFIX-1 at bef9140 (cliff date fix to the MCP source)
- /article-50-kit wire at 7fde3ba (cliff date baked into the landing page)
