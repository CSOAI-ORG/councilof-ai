# 🐝 HIVE CONVERSION SITES — SINGLE MASTER (do not fork)

**Established 2026-06-15.** There is now ONE generator for all `.ai` hive conversion sites. Stop making parallel ones.

## The master
`/Users/nicholas/clawd/build_hive_conversion_pages.py` + cluster configs:
- `hive_extra_compliance.py`, `hive_extra_governance.py`, `hive_extra_verticals.py` — domain configs merged in at import.
- `HIVE_DEMOS` (in the master) — rich per-domain interactive MCP demo samples.

Run: `python3 build_hive_conversion_pages.py` → writes `<slug>-deploy/` for all 18 domains, each with index + pricing + signup + partner + enterprise + industry/* + llms.txt + sitemap.xml + robots.txt + vercel.json + an interactive MCP demo.

## To add / edit a hive site
1. Add/edit the domain entry in the matching `hive_extra_*.py` (schema: domain, name, sector, hero, sub, features[4], tiers[3], partner, enterprise, mcps).
2. (Optional) add rich demo samples to `HIVE_DEMOS` in the master.
3. `python3 build_hive_conversion_pages.py` → regenerates.
4. Deploy: `cd <slug>-deploy && vercel deploy --prod --yes`.

## Deprecated (do NOT run — exit-guarded, kept for reference)
- `scripts/generate-governance-conversion-sites.py`
- `scripts/generate-compliance-deploys.py`
Their unique value was absorbed: standalone domains already in master; compliance's rich demos → `HIVE_DEMOS`.

## Hub sites are NOT in this generator
`meok.ai` (Next.js app at `meok/ui`), `proofof.ai`, `councilof.ai`, `csoai.org` are real apps — their *strong* versions. The static `*-governance-deploy` / `*-conversion-deploy` copies are superseded; don't regenerate or redeploy them over the real apps.

## Coverage (18)
construction: grabhire, muckaway, planthire · agriculture: fishkeeper, koikeeper · compliance: safetyof, transparencyof, accountabilityof, biasdetectionof, dataprivacyof, ethicalgovernanceof · governance: agisafe, asisecurity · developer: cobolbridge, openmoe · verticals: landlaw, commercialvehicle, optimobile

## Hive rule
Claim conversion-site work in the SOV3 coord hub + acquire file locks before editing the master, so parallel agents (jeeves-cli, WAVE, Mavis) don't re-fork. See memory: project_hive_conversion_pages.
