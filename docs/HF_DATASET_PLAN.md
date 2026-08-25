# Hugging Face dataset plan — honest publishes

Org target: `huggingface.co/csoai` (or successor). Measurement, not certification. Scores never sold.

Doctrine: ship empty / cited first; MEASURED only after freeze + sign. Never dress TVL, ARR, wage %, or TAM as MEASURED. Canon: `docs/EAT_PLAYBOOK.md` · `docs/SOVOS/INDEX-METHOD-0.1.md`.

## Ship first (UNMEASURED / REPORTED)

1. **`labour-economy-unmeasured`** — manifest for `ai-economy` / `human-labour` / `humanoid-labour` with `measured_score: null`, `fused_into_gspc: false`, firewall note, and next_gate pointers matching `GET /api/indices`.
2. **Dated REPORTED citation tables** — ILO / AEI / WEF FoJ / OECD / Anthropic Economic Index (and peers). Labeled **REPORTED**, cited + dated, never signed as CSOAI MEASURED.
3. **RWA public-artifact corpus** — explorer / issuer URLs and adapter keys from `client/src/data/rwaAttestationTargets.ts` **without** invented AUM or “rated” language.

## Ship when frozen (MEASURED)

1. **GSPC board snapshots** — Ed25519 card hashes, methodology pointer / DOI, bank freeze id, usable `n`.
2. Only after bank freeze + Wilson discipline on frozen banks (`docs/EAT_PLAYBOOK.md`).
3. Labour/economy indices become MEASURED dumps **only** after INDEX-METHOD promotion — never by backfilling GPU or scrapers.

## Never

- TVL / ARR / wage % / TAM / “AI economy size” as MEASURED without a frozen method
- Fusing labour indices into GSPC cells (contextual firewall)
- Silent zeros for empty cells (`null` ≠ 0)
- Mixing REPORTED third-party figures into signed MEASURED averages

## Cross-links

| Surface | Role |
|---------|------|
| `/indices` · `GET /api/indices` · `GET /api/indices/:slug` | Live UNMEASURED register |
| `docs/SOVOS/INDEX-METHOD-0.1.md` | Method before score |
| Kaggle | REPORTED notebooks + offline Ed25519 verify until freeze |
| `docs/NEXT_300_MOVES.md` #139–141, #251–256 | Execution register |

## Naming sketch (subject to HF org)

- `csoai/labour-economy-unmeasured` — manifests first
- `csoai/gspc-measured-snapshots` — only when frozen
- `csoai/rwa-public-artifacts-reported` — citations, no fake scores
