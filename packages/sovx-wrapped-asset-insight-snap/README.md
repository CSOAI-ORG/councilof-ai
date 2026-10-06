# SovX wrapped-asset measurements — MetaMask transaction insight (staged)

A MetaMask Snap. For the contract a pending transaction calls, it fetches the **free** preview
`https://councilof.ai/api/wrapper/caip19/eip155:<chainId>/erc20:<address>` and shows, for each record
on that contract:

    Measured state: <STATE> as of <as_of>
    Freshness: UNCHECKABLE (NO_DECLARED_MAX_AGE)
    Record <id>   → https://councilof.ai/w/<id>

That is all it shows. No score, no rank, no severity, no advice. A state records what was read on-chain
at a pinned block; it is not a rating, a recommendation or an endorsement. When nothing is on record
it says so; when the fetch fails it says the record could not be fetched.

| State | Meaning |
|---|---|
| `ESCROW_PARITY_READ` | wrapped supply and origin-chain escrow balance both read at pinned blocks |
| `UNCHECKABLE_NATIVE_ISSUANCE` | issued natively on this chain; no escrow exists; supply read, no ratio claimed |
| `INDEXED_CUSTODIAL` | reserve held by a custodian off this chain; not readable here; supply read |
| `UNMEASURED` | a read failed; the error is recorded and nothing is inferred |

Permissions: `endowment:transaction-insight` (without the transaction origin) and
`endowment:network-access` (it only calls councilof.ai, and only shows links back to councilof.ai).
It holds no keys, signs nothing and sends nothing.

## Build and test

    npm ci
    npm run build        # mm-snap build: dist/bundle.js + the shasum in snap.manifest.json
    npm run typecheck
    npm test             # unit tests + the built bundle in the snaps-jest sandbox

`@metamask/snaps-sdk` is pinned to 12.0.1, the highest platform version production MetaMask supports
(mm-snap build warns on 12.1.0).

## Not published

`"private": true` blocks `npm publish`. Publishing to npm and applying to the MetaMask Snaps
allowlist are **HELD for the owner**. Until then it runs only in MetaMask Flask from a local build
(`npm run build`, then `npx mm-snap serve` and install `local:http://localhost:8080`).

Licence: Apache-2.0 (LICENSE).
