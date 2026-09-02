# `/interop` — live / unsigned banks (index)

Machine-readable coverage leaves under `public/interop/`. **Verify free.** RAS
(risk assessment) lives at [`/assess`](https://councilof.ai/assess) — not here.
**Never certify.** Council of AI is **not** a Transparency Service
(`/.well-known/scitt-keys` stays absent on purpose).

Doctrine: denser root = more honest unsigned leaves on the **same** living
root-as-index. Not a second board, second scorer, or TS.

## Live / unsigned banks (this tree)

| Bank | Path | Surface | Role |
| --- | --- | --- | --- |
| OpenAI↔HF Jul 2026 incident | [`incident-openai-hf-2026-07/`](./incident-openai-hf-2026-07/) | `public.notice` | Hashed public reports only — DISCOVERED; **not** recomputed; unsigned |
| XRPL toml gap (strict_two_way_toml) | [`xrpl-toml-gap-2026-09/`](./xrpl-toml-gap-2026-09/) | `public.notice` | 12/16 issuers still listing failed check — DISCOVERED; **not** bidirectional; unsigned |
| x402 challenge | [`x402-challenge/`](./x402-challenge/) | `cedulon.recon` | Live HTTP 402 probe; `settlement` stays **UNCHECKABLE** |
| Cedulon / Abak | [`cedulon-recon/`](./cedulon-recon/) | `cedulon.recon` | Peer conservation fixtures as unsigned bank input |
| SCRAPI / CCF | [`scrapi-ccf/`](./scrapi-ccf/) | `eval.delta` | Public MS + ASG receipt fixtures — consumer only, not a TS |
| Emilia EP | [`emilia-ep/`](./emilia-ep/) | `eval.delta` | Digest-only EP receipt ore; **EP ≠ SCITT inclusion** |
| Joel freeze discipline | [`joel-freeze-discipline/`](./joel-freeze-discipline/) | (vocab) | UNCHECKABLE+reason; freeze→hash→confirm→deposit mirrors card→root→witness — method cite, not affiliation |
| auto-eat leaf list | [`auto-eat-root-leaf-list.json`](./auto-eat-root-leaf-list.json) | (index) | Living unsigned leaf list of staged auto-eat surfaces — does **not** mutate signed root |
| transparency anchor retry | [`transparency-anchor-retry/`](./transparency-anchor-retry/) | `public.notice` | Rekor v1/v2 + OTS attempt log for `root.json` hash — no fake seal |
| cross-border SCAFFOLD | [`cross-border-scaffold/`](./cross-border-scaffold/) | (domain leaves) | Six unsigned domain stubs `status=SCAFFOLD` — **not** board slots |
| printer public_count | [`printer-public-count.example.json`](./printer-public-count.example.json) | (printer) | Example totals from live GET — printers re-fetch `totals.public_count` |
| EAS Base root scaffold | [`eas-base-root-2026-09/`](./eas-base-root-2026-09/) | `public.notice` | UNCHECKABLE — no estate Base signer; gas-only path documented; attestation_uid=null |
| BENJI per-chain on-chain supply | [`benji-onchain-supply-2026-09/`](./benji-onchain-supply-2026-09/) | `benji.onchain.supply` | 8/9 chains public totalSupply; BNB UNCHECKABLE (iBENJI≠BENJI); primary_register unmeasured; unsigned |
| Financial measure runs | `financial-measure-run*.json` (this directory) | (run cards) | Signed / unsigned financial measure runs + compact cards |

## Hard stops (every bank)

- `sig_ed25519` on unsigned examples is always `null`.
- Do **not** invent MEASURED / SIGNED without n≥30 + 4way + keystone.
- Do **not** touch `/api/gspc`, wrangler, or mint SCITT receipts in-tree.
- Do **not** publish `/.well-known/scitt-keys`.
- Do **not** endorse peers we cite (Emilia, Cedulon, Microsoft, ASG, …).
- Verify free; product RAS is `/assess`; we measure, we never certify.

## Atom path (shared)

```
probe / pin / digest → unsigned card-v0 → (later n≥30 + 4way + keystone) → root → witness root only
```

Schema: [`/schema/card-v0.json`](../schema/card-v0.json).
