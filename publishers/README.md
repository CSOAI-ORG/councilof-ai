# Publishers — Stage 2+ only

XRPL Memo / provisional Credential and EAS attestation scripts live here.

**Do not run mainnet** until key custody + legal attestation-language review are signed off.

- **Hard refuse demo-play publish** — targets with `play: "demo"` (e.g. JMWH) must never be published as production MEASURED; requires explicit demo label and fails without `CSOAI_KEY_CUSTODY` (`scripts/demo-play-refuse-lint.mjs`).
- Prefer Memo (hash pointer) before Credentials.
- Credentials: provisional until subject `CredentialAccept`.
- EAS: off-chain first; on-chain for marquee.
- Attestation ≠ tokenization ≠ ownership.
- Every published card must surface in Council OS **and** DSH (same evidence).

See `docs/COUNCIL_OS_BUILD_PLAN.md`.
