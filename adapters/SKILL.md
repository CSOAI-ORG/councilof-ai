# Adapters — agent authoring skill

DeFiLlama-style target adapters for Council measurement.

## Rules

1. One folder per asset: `adapters/xrpl/<slug>/` or `adapters/evm/<slug>/`.
2. Export `async function fetchFacts(ctx): Promise<AdapterFacts>` — **read-only public facts**.
3. Never call the signing engine from an adapter. Signing is `engine` / publishers only.
4. Cite every number with `source` URL + `as_of` ISO date. Prefer explorer primary over aggregators.
5. `signing_state` stays `"unsigned"` until a Stage 2+ publisher attaches a pointer.
6. Attestation ≠ tokenization ≠ ownership — adapters do not mint or imply title.
7. Slugs align with `client/src/data/rwaAttestationTargets.ts` when present.
8. DSH = OS: facts that become MEASURED cards must use the same Layer 0 destinations.

## Local test

```bash
npx tsx adapters/xrpl/ondo-ousg/index.ts
```

## Do not

- Invent AUM or FX conversions as MEASURED
- Echo third-party ratings as ours
- Submit chain txs from adapters
