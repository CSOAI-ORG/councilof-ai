# Incident notice pack — OpenAI ↔ Hugging Face Jul 2026

**Surface:** `public.notice` (unsigned card-v0)  
**Status:** DISCOVERED only — **never MEASURED** · **never recomputed** · `writes_board: false`

Honest sentence on every card: **"Public report hashed. Not independently recomputed."**

## Cards (hunt #1–3)

| # | Org | File | Axes cite |
| --- | --- | --- | --- |
| 1 | OpenAI | [`card-openai-public-notice-unsigned.json`](./card-openai-public-notice-unsigned.json) | swarm / jail / conformance |
| 2 | Hugging Face | [`card-huggingface-public-notice-unsigned.json`](./card-huggingface-public-notice-unsigned.json) | conformance |
| 3 | METR / Redwood (+ Axios 1 Sep) | [`card-metr-redwood-public-notice-unsigned.json`](./card-metr-redwood-public-notice-unsigned.json) | swarm |

`sig_ed25519` is `null`. **SIGNED needs keystone.** Do not wait on this PR for keystone.

## Hashed mirrors

PDFs stored as exact bytes under [`mirrors/`](./mirrors/). HTML artefacts are recorded as `*.meta.json` only (`source_url`, `fetched_at`, `sha256`, `bytes`) — stranger re-downloads from the source URL and checks the hash. SPA HTML is volatile; we do not pretend a frozen HTML body is the report.  
Fetched at **2026-09-02T04:31:13Z**. Index: [`artefact-manifest.json`](./artefact-manifest.json).

Canonical OpenAI technical PDF (38 pages):

- URL: `https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf`
- sha256: `dd635cf6e5f39f0e1f646f08c36549090d77156ed89cbd3d733ed496648cae9c`

METR/Redwood investigation PDF:

- URL: `https://metr.org/hugging-face-incident-report-aug-2026.pdf`
- sha256: `5b7d44d07be033d1ec6eb2229b6d1c09f502d5d6b897925f148613ab94b24aba`

## UNCHECKABLE

- **EAS on Base attestation of root/card sha** — estate EAS signer key is owner-gated (`eas-attestation-batch.json`); no new keys / no Nick funding this turn.
- Everything in each card's `unmeasured[]` (transcripts, kill-chain artefacts, agent count independent of OpenAI, etc.).

## Hard stops

- Never claim we recomputed the incident.
- Never stamp a GSPC axis **MEASURED** from these notices.
- Never shrink `card_index`. Never wrangler.
- Measurement, not certification. Zero gatekeeper.
