# proofof.ai/scorecard — restore (when Vercel deploy limit resets, ~24h)

## What happened
Built + deployed the GEO scorecard (341 pages) to proofof.ai via the `meok-attestation-api`
Vercel project (proofof.ai's domain follows that project's latest **production** deploy).
Then hit Vercel's **free-plan limit: 100 deployments/day** ("api-deployments-free-per-day").
The limit-blocked deploys left a broken production build as "latest", so proofof.ai/scorecard
+ /llms-full.txt + /sitemap.xml now 404. Homepage (/) and API (/payg) still 200 — only the
`public/` static pages are missing from the current prod build.

Could not `promote`/`rollback`/`alias` a known-good deployment because **proofof.ai's domain
is on a different Vercel scope** ("You don't have access to the domain proofof.ai under
niks-projects-0a2ef942") and 3 good deployments report "belongs to a different team".

## The content is SAFE
- Local: `meok-attestation-api/public/scorecard/` (341 html) + `public/llms-full.txt` + `public/sitemap.xml` + `public/robots.txt`
- Generators: `mcp-marketplace/_tooling/generate_scorecard_site.py`, `gen_protocol_cards.py`
- Also live (separate project, public, 200): https://proofof-site.vercel.app/scorecard/

## RESTORE (one command, after the 24h limit resets)
```bash
cd ~/clawd/meok-attestation-api
vercel deploy --prod --yes        # proofof.ai follows this project's latest prod
# verify:
curl -sI https://proofof.ai/scorecard/ | head -1   # expect 200
```
Known-good prod deployments that DID serve /scorecard (for promote if scope is fixed):
`meok-attestation-23dbmixzq` · `meok-attestation-pbc4i2pf0` · `meok-attestation-8nv57lzhn`.

## Better long-term
proofof.ai's domain lives in a different Vercel scope than the project deploying it →
consolidate (move the domain into niks-projects-0a2ef942, or deploy from the owning scope)
so promote/rollback work and a bad deploy can be reverted instantly.

## Regenerate after any score change
```bash
python3 ~/clawd/mcp-marketplace/_tooling/generate_scorecard_site.py /tmp/sb_mon.json ~/clawd/proofof-site
cp -r ~/clawd/proofof-site/scorecard ~/clawd/meok-attestation-api/public/scorecard
```
