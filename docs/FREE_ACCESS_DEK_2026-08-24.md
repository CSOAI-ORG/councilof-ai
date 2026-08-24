# Free Access — Article 50 detection + verified measurement data

**To:** Researchers, journalists, fact-checkers
**From:** Council of AI (CSOAI Ltd, UK 16939677) — neutral measurement body
**Date:** 2026-08-24
**The whole point:** measurement, free access, never a paid rank.

---

## What is free, right now (no login, no key, no charge)

1. **Verify any signed measurement** — recompute the canonical body, check the Ed25519 signature
   against the published `did:web:csoai.org` key, in your browser:
   `https://councilof.ai/gspc-verify` — free, no records leave your machine.

2. **The live board** — every axis with n, Wilson 95% CI, and honest SEPARATED/TIE/UNTESTED chips:
   `GET https://councilof.ai/api/gspc` (live counts; never a stale quote).

3. **The signed per-axis arena leaderboard** — per-domain Elo, every score carries n + CI,
   content_id + Ed25519, and a `?verify=1` recompute:
   `GET https://councilof.ai/api/arena/scoreboard`

4. **ClaimGuard** — audit any natural-language claim against a signed board (deterministic, never
   a model opinion): `https://councilof.ai/claimguard` (repo: github.com/CSOAI-ORG/claimguard).

5. **The signed longitudinal dataset** — per-axis probe responses across generations (the
   drift/consistency signal), content-addressed + signed:
   `https://councilof.ai/datasets/gspc-axis-v0.1.0/dataset.json` (manifest + detached `dataset.sig`).

## The honest boundaries (so you can trust the "free")

- **We never hide an unmeasured cell.** `UNMEASURED` is reported, never omitted.
- **We never claim certification.** Measurement evidence only — the verify path IS the proof.
- **No ranked party pays us.** The free tier is genuinely free; license legs are data-license +
  researcher-access + regulator-evidence (buyer is not the ranked party).
- **Corrections are appended, never edited.** Our own errors are in the public ledger:
  `https://councilof.ai/api/corrections`.

## Why we're offering this to you

The EU AI Act **Article 50** (machine-readable marking + free detection, with guaranteed free
access to researchers, journalists, and fact-checkers) is live now. We built the verification
engine so the marking is *checkable* — not just declared. If you are citing, auditing, or
fact-checking an AI-content claim, the signed verify path is the independent evidence.

## Questions / access

- Article 50 detection + C2PA marking questions: `contact` — see `https://councilof.ai/contact`.
- Dataset + methodology citation: the canonical methodology record is a DOI
  (`10.5281/zenodo.21991104`); per-axis cards are being DOI-registered.

**This offer is unconditional and permanent.** Free access is not a gate to a paid tier; it is
the product's proof. Measurement is the public good; the paid legs (data license for enterprises,
researcher access for institutions) never touch the rank.
