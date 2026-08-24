# Council of AI

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PyPI](https://img.shields.io/badge/PyPI-Install-3775a9)](https://pypi.org/project/councilof_ai/)

> Independent AI-governance measurement. We measure, we sign, we re-attest — everyone can check.

Council of AI (CSOAI LTD, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems on published, frozen instruments; issue the results as signed, offline-verifiable measurement credentials (Ed25519); and re-measure on a cadence so the evidence stays current. **Measurement, not certification** — we do not certify, sell ratings, or remediate, and we take no money from anything we rank. Verification is free and loginless.

---

## 🚀 Quick Start

```bash
# Install via pip
pip install councilof_ai

# Or install via Smithery
npx -y @smithery/cli@latest install councilof-ai --client claude
```

## 📏 What we measure

- **13 GSPC measurement axes** — governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect
- **Deterministic grading** on frozen instruments — no LLM-as-judge, no invented scores
- **UNMEASURED is a first-class outcome** — gaps are reported with their n and limits, never hidden, never scored as a fail
- **Signed credentials** — Ed25519 over SHA-256, chain-linked, time-anchored, offline-verifiable
- **Live axis data**: `GET https://councilof.ai/api/gspc` (schema `csoai.gspc-axes/0.3`)

## 🧭 Verify

Every published measurement carries a public key and a verify path. Check any credential at:

- **https://councilof.ai/verify** — free, no login


## East-West (cross-jurisdiction measurement)

One signed measurement, mapped across EU / UK / Illinois / China. Mapping is not a compliance determination — determination stays with authorities.

- Flagship: `/east-west`
- Verify (client-side): `/east-west/verify` and `/gspc-verify`
- Challenge door: `/challenge`
- Evidence packs: `/east-west/packs` (multinational / insurer / law-firm samples)
- Regulator desks: `/east-west/desks` — signed streams **free forever**
- Buyer screen + license template + one-pagers: `/east-west/buyers`, `/east-west/license`, `/east-west/briefs`
- Pay rail demo: `/east-west/pay` and `GET /api/east-west/pay/demo` (HTTP 402, **amount is null** — no invented price)
- Board API: `GET /api/east-west`
- Offline pack check: `node public/east-west/verify-pack.mjs path/to/pack.json`
- Schema: `https://councilof.ai/.well-known/schemas/cross-border-card.schema.json`

Public grammar: **13 measured of 14**. Product: verified measurement credential — never a certification. Scores are never sold. Regulator streams are free forever.

**Owner-blocked until a published ruling (honest placeholders, not fake commerce):** pricing, x402/MPP activation, first pack sale, DID root, `cibola.dev` / `getcibola.com`, UKIPO. Value Ledger published count is **0**. Empty is launch honesty.

## 📖 Documentation

- [Measurement body overview](https://councilof.ai/about/)
- [Methodology — how we measure](https://councilof.ai/methodology/)
- [GSPC scoreboard](https://councilof.ai/gspc-scoreboard)
- [All published measurements](https://councilof.ai/benchmarks)
- [EU AI Act Article 50 guide](https://councilof.ai/article-50)

## ⚖️ What we never do

- ❌ Certify AI systems or issue compliance badges
- ❌ Sell ratings, rankings position, or early sight of grades
- ❌ Remediate or recommend fixes in exchange for fees
- ❌ Take money in either direction from anything we rank

## 🤝 Part of the Council of AI ecosystem

| Surface | Purpose |
|---------|---------|
| [councilof.ai](https://councilof.ai) | Measurement body — signed credentials, verify, scoreboard |
| [csoai.org](https://csoai.org) | Public site |
| [meok.ai](https://meok.ai) | Sovereign AI platform |

## 📜 License

MIT © [CSOAI-ORG](https://github.com/CSOAI-ORG)

---

<p align="center">
  <sub>Council of AI · CSOAI LTD · UK Companies House 16939677 · We measure. We sign. We re-attest.</sub>
</p>
