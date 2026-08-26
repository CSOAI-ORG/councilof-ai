# Publishers — Stage 2+ only

XRPL Memo / provisional Credential and EAS attestation scripts live here.

**Do not run mainnet** until key custody + legal attestation-language review are signed off.

## Fail-closed gates (#168 · #291 · #292)

| Gate | Rule | Enforced by |
|------|------|-------------|
| Custody | `--publish` requires `CSOAI_KEY_CUSTODY` (KMS / Turnkey / HSM) | `publishers/custody-gate.mjs` · `scripts/demo-play-refuse-lint.mjs` |
| Custody miss | **Fail closed** — no silent unsigned publish | `assertCustodyForPublish()` |
| Demo play | Targets with `play: "demo"` (e.g. JMWH) **never** production MEASURED mainnet | `refuseDemoPlay()` · `scripts/jmwh-demo-only-lint.mjs` |
| Demo miss | **Fail closed on demo play** without explicit demo label | `guardPublish()` |

```js
import { guardPublish } from "./custody-gate.mjs";
// Before any --publish:
guardPublish(target); // CSOAI_KEY_CUSTODY + refuse demo-play
```

- Prefer Memo (hash pointer) before Credentials.
- Credentials: provisional until subject `CredentialAccept`.
- EAS: off-chain first; on-chain for marquee.
- Attestation ≠ tokenization ≠ ownership.
- Every published card must surface in Council OS **and** DSH (same evidence).
- Wilson intervals: **frozen banks only** — see `docs/WILSON_FROZEN_BANKS.md` · not live RWA churn.

See `docs/COUNCIL_OS_BUILD_PLAN.md` · matrix: `docs/RWA_CONTACT_MATRIX.md`.
