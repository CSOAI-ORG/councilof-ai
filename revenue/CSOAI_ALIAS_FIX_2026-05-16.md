# CSOAI.org Alias Fix — 5 min Nick clicks

## What happened

I edited `~/clawd/csoai-org/index.html` to remove all 12 fabricated claims (FAA for AI, 52-Article Charter, Byzantine Consensus 22/33 Threshold, ISO Aligned, Patent Pending, 305 repos, CASA Certification, 2,847 unregulated). The new file shows:
- Hero: "Open-source AI compliance toolkit"
- Subtitle: "38 MIT-licensed MCPs that automate EU AI Act, DORA, NIS2 and CRA audits. Signed HMAC attestations + Sigstore provenance. Built for AI builders by MEOK AI Labs."
- Trust badges: "38 MCPs Published", "MIT Licensed", "HMAC-Signed Attestations", "Sigstore Provenance", "CycloneDX 1.6 + SPDX 3.0", "Free Tier Available"
- CTAs: "Browse 38 MCPs" + "View on GitHub"
- Countdown: 200 days to Article 50 (corrected from 520)
- 38 stat (replaced fabricated 2,847)

I deployed `csoai-org` to Vercel production successfully (2 deploys: csoai-h26l4lky9 + csoai-br3ega8bf, both Ready).

**BUT csoai.org domain isn't picking up the new deploy** — it's still showing the old fabricated content. Common Vercel behaviours that cause this:

1. **Domain alias pinned to a specific deployment SHA** — production deploys land but csoai.org alias stays on the old SHA
2. **Multiple Vercel projects competing** — csoai.org might be aliased to `csoai-v2` (separate Next.js project at `~/clawd/csoai-org-v2`) instead of `csoai-org` (HTML project at `~/clawd/csoai-org`)

## Fix — Nick clicks (5 min)

### Path A: re-alias via CLI (if you're comfortable with terminal)

```bash
cd ~/clawd/csoai-org
# Find the latest production deploy URL
vercel ls 2>&1 | head -3
# Will show e.g. https://csoai-h26l4lky9-niks-projects-0a2ef942.vercel.app

# Alias csoai.org to that deploy
vercel alias <that-url> csoai.org
vercel alias <that-url> www.csoai.org
```

### Path B: Vercel dashboard

1. https://vercel.com/niks-projects-0a2ef942/csoai-org/deployments
2. Find the latest "Ready" production deploy (timestamp ~ now)
3. Three-dot menu → **Promote to Production** (or **Assign Domain**)
4. Assign both `csoai.org` and `www.csoai.org`
5. Wait 1-2 min for CDN propagation

### Path C: figure out if csoai-v2 should serve

If you've been deploying csoai-org-v2 (Next.js, `~/clawd/csoai-org-v2/`) as the future csoai.org, then:
1. Promote the latest csoai-org-v2 deploy to production
2. Move the csoai.org alias from csoai-org → csoai-org-v2
3. Archive the old csoai-org project

This is the cleaner long-term move. The v2 source (~/clawd/csoai-org-v2/src/app/page.tsx) is **already clean** — has the honest "Hire a Compliance Agent for less than an intern" copy, no fabrications.

## Verify after fix

```bash
curl -sL https://csoai.org 2>/dev/null | grep -cE "FAA for art|52.Article Charter|Byzantine Consensus|Patent Pending|CASA Cert|2,847"
# Expect: 0
```

## What I'd do (Claude's recommendation)

**Path C** — switch to csoai-org-v2 as the canonical site. The v2 Next.js source is cleaner, has better email-capture UX, and the messaging ("Hire a Compliance Agent for Less Than an Intern") is sharper than the old HTML. Spend 5 min in Vercel dashboard re-aliasing, archive the old csoai-org project, done.

## Files I edited locally (preserved on disk)

- `~/clawd/csoai-org/index.html` — 13 fabrication patterns removed (verified grep returns 0 local matches)
- Backups in `index.html.bak` were deleted after successful sed runs

## Time budget

- Path B click flow: 5 min
- Verify curl: 1 min
- **Total: 6 min Nick clicks**
