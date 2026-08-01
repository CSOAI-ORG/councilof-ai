# Corpus-Watch Delta Report

Generated: 2026-08-01 13:27 UTC · normaliser `norm-v2` · watcher last-run `2026-08-01T13:27:21.159740+00:00`

Instruments watched: **5** · provisions under hash: **399** · drift events to date: **0**

Detection is a SHA-256 compare over the normalised consolidated text of each act (act-level — the honest coarse signal; provision-level slicing is a later refinement). A failed fetch records UNKNOWN, never 'unchanged'.

## No drift detected

No instrument's normalised hash has changed since its baseline was seeded. This is a measured statement about the watched window, not a guarantee about the future — the watcher runs daily and this report regenerates on every event.

| Instrument | Jurisdiction | Provisions | Status at last run |
|---|---|---|---|
| EU AI Act (Regulation (EU) 2024/1689) | EU | 113 | baseline_seeded |
| EU Cyber Resilience Act (Regulation (EU) 2024/2847) | EU | 71 | baseline_seeded |
| DORA (Regulation (EU) 2022/2554) | EU | 68 | baseline_seeded |
| NIS2 Directive ((EU) 2022/2555) | EU | 48 | baseline_seeded |
| UK GDPR (retained Regulation (EU) 2016/679) | UK | 99 | baseline_seeded |

---
Signed: Ed25519, corpus-watch key (raw public key hex: `6bb1a649666d7b8bcf976509ed213db4084bebdb7fdf0a45f75068499b5f4e0e`). Verify: `openssl pkeyutl -verify -pubin -inkey keys/corpus-watch-ed25519.pub -rawin -in <this-file> -sigfile <this-file>.sig`
