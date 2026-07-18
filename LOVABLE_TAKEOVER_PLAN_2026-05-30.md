# Lovable Takeover + Site Ownership Plan — 2026-05-30

The real problem (verified): **you own COMPILED OUTPUT for 11 sites but SOURCE for none.** The editable source lives only on Lovable + a Supabase project (`dpntsawxffnluxvtmsry.supabase.co`). That's why it feels easier to rebuild than edit — you can't see what you have. This plan gets the source onto your GPU and stops the rebuild loop.

## What's verified
- 11 `-site/` dirs in clawd: ALL build-only (no `src/`), no own git repos.
- NO fishkeeper/koikeeper/aqua source repos on GitHub (CSOAI-ORG or personal).
- fishkeeper.ai + koikeeper.ai domains NOT attached to their Vercel projects → they fall through to a catch-all that 308-redirects to meok.ai. **That's why "fishkeeper.ai loads meok.ai."**
- Local `fishkeeper-site/index.html` IS the correct FishKeeper site — content exists, just not wired to the domain.
- Vercel API returns 403 on these domains = they live in a scope my token can't write → **domain reattach is a Nick-in-UI job.**

## DONE today (Claude, via Vercel API)
- ✅ Disabled Deployment Protection on fishkeeper-site, koikeeper-site, fishkeeper-ai, koikeeper-ai, koikeeper-fresh (option A — un-walled, reversible).

## NEEDS NICK — 2 jobs (the parts I can't reach)

### Job 1 — Export Lovable source to GitHub (5 min, the key one)
This is how to get real source onto your GPU — the *right* way, not fragile scraping:
1. Open each Lovable project (fishkeeper, koikeeper, any others).
2. Top-right → **GitHub** → **Connect to GitHub** / **Export to GitHub** → push to `CSOAI-ORG/fishkeeper` etc.
3. Tell me the repo names. Then I run `gh repo clone` → full editable source on your GPU, version-controlled, yours forever.
> Lovable ↔ GitHub is a native 2-way sync — once connected, your GPU edits can push back. This permanently ends the "source only on Lovable" risk.

### Job 2 — Reattach the apex domains (Vercel UI, 3 min)
fishkeeper.ai + koikeeper.ai aren't attached to their projects:
1. Vercel → `fishkeeper-site` → Settings → Domains → Add `fishkeeper.ai` (+ `www`).
2. Same for `koikeeper-site` ← `koikeeper.ai`.
3. If "already in use by another project," remove from the catch-all first.
(Can't be done by API token — these domains are in a different scope.)

## Then Claude can (once Job 1 done)
- Clone the repos, run them locally on your GPU (Vite dev server), edit real source.
- Build the **canonical site index** so we never rebuild a site that exists.
- Wire the B2B aquaculture welfare layer (RSPCA/ASC/CEFAS) as a SEPARATE surface — NOT bolted onto the consumer koi apps (per your steer: consumer + B2B are different audiences).

## The "stop rebuilding" rule (going forward)
Before building ANY new site, check this list of what already exists:
cobolbridge · commercialvehicle · fishkeeper · grabhire · koikeeper · landlaw · muckaway · optimobile · planthire · proofof · templeman-opticians (11 sites) + the of.ai suite (csoai-org/public) + aquaponics.app.
**If it's on this list, edit the source — don't rebuild.**
