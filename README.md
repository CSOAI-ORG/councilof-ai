# Council of AI

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-Install-3775a9)](https://pypi.org/project/councilof_ai/)

> Independent AI-governance measurement. We measure, we sign, we re-attest — everyone can check.

Council of AI (CSOAI LTD, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems on published, frozen instruments; issue the results as signed, offline-verifiable measurement credentials (Ed25519); and re-measure on a cadence so the evidence stays current. **Measurement, not certification** — we do not certify, sell ratings, or remediate, and we take no money from anything we rank. Verification is free and loginless.

**Live:** [councilof.ai](https://councilof.ai) on **Cloudflare Pages** (`councilof-ai`). Not Vercel.

---

## Quick start

```bash
# Install via pip
pip install councilof_ai

# Or install via Smithery
npx -y @smithery/cli@latest install councilof-ai --client claude
```

## What we measure

Live axis list and scores: **`GET https://councilof.ai/api/gspc`** (schema `csoai.gspc-axes/0.5`).

Snapshot 31 Aug 2026 from that API:

- **22 slots** on the board · **15 measured** · **7 UNMEASURED** (declared empty, not a fail)
- **14 / 14 behavioural GSPC axes measured** — governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail
- **Deterministic grading** on frozen instruments — no LLM-as-judge, no invented scores
- **UNMEASURED is first-class** — gaps are reported with their n and limits
- **335 signed cards** (`n_cards == n_cells`) · living stamp **SIGNED** (`did:web:csoai.org#board-attestation-1`)
- Methodology: [doi:10.5281/zenodo.21991104](https://doi.org/10.5281/zenodo.21991104)

If this file and the API disagree, the API is right.

## Verify

- **https://councilof.ai/gspc-verify/** — free, no login
- **https://csoai.org/verify**
- DID: https://csoai.org/.well-known/did.json

## Hosting and deploy

| Host | Cloudflare Pages project | Deploy |
|---|---|---|
| councilof.ai / www | `councilof-ai` | GitHub Actions `deploy.yml` → `wrangler pages deploy` |
| csoai.org | `csoai-site` | Wrangler (`csoai-site-deploy.yml`) |

Vercel is not the live host. The leftover Vercel Git links (`csoai-v2-app`, `councilof-ai-src`) were disconnected and those Vercel projects deleted on 31 Aug 2026.

Build (this repo):

```bash
npm run build:client
bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350
# GHA deploy.yml ships dist/client to Cloudflare Pages
```

Do **not** run `npx vite build` from the repo root (it picks up a dead `src/`). Do **not** `vercel deploy` this site.

## Documentation

- [Measurement body overview](https://councilof.ai/about/)
- [Methodology](https://councilof.ai/methodology/)
- [GSPC scoreboard](https://councilof.ai/gspc-scoreboard)
- [Published measurements](https://councilof.ai/benchmarks)
- [EU AI Act Article 50](https://councilof.ai/article-50)

## What we never do

- Certify AI systems or issue compliance badges
- Sell ratings, ranking position, or early sight of grades
- Remediate or recommend fixes in exchange for fees
- Take money in either direction from anything we rank

## Surfaces

| Surface | Purpose |
|---------|---------|
| [councilof.ai](https://councilof.ai) | Measurement body — signed credentials, verify, scoreboard |
| [csoai.org](https://csoai.org) | Public site / DID apex |
| [meok.ai](https://meok.ai) | MEOK OS — yours, on your keys |

## License

MIT © [CSOAI-ORG](https://github.com/CSOAI-ORG)

---

<p align="center">
  <sub>Council of AI · CSOAI LTD · UK Companies House 16939677 · We measure. We sign. We re-attest.</sub>
</p>
