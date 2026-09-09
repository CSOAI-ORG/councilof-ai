# Verify a signed GSPC measurement card

This composite GitHub Action verifies one **local** GSPC measurement card with
the repository's zero-dependency `gspc-card-verifier`. It recomputes the card id,
checks Ed25519 under the pinned Council of AI profile, and returns exactly one of:

- `VALID` — the complete path verified under the pinned key;
- `INVALID` — the complete check established a mismatch;
- `UNCHECKABLE` — the check could not complete or the schema is outside the profile.

This proves integrity and issuer-key binding. It does not prove the measurement
is correct, certify a model, or turn an unmeasured field into a result.

## Usage

```yaml
steps:
  - uses: actions/checkout@v4
  - id: card
    uses: CSOAI-ORG/councilof-ai/actions/verify-card@<reviewed-commit>
    with:
      artifact: evidence/model-card.json
  - run: printf '%s %s\n' "$VERDICT" "$CARD_ID"
    env:
      VERDICT: ${{ steps.card.outputs.verdict }}
      CARD_ID: ${{ steps.card.outputs.id }}
```

Pin a reviewed commit or release tag rather than `main` in a relying workflow.
The runner must provide Node.js; Node 22 is recommended. The Action deliberately
does not install or download a runtime or verifier dependency.

## Inputs

| Input | Required | Default | Meaning |
|---|---:|---:|---|
| `artifact` | yes | — | Local regular JSON file, at most 1 MiB, relative to the caller workspace or absolute. |
| `fail_on_mismatch` | no | `true` | Fail for both `INVALID` and `UNCHECKABLE`. `false` exposes the same non-VALID verdict without gating. |

Remote URL input was removed. Verification is intentionally offline: download
and retain the evidence first, then pass its local path. This avoids a mutable
network response being substituted during the verification step.

## Outputs and exits

| Output | Meaning |
|---|---|
| `verdict` | `VALID`, `INVALID`, or `UNCHECKABLE` |
| `id` | Verified id for `VALID`; otherwise a stated id only when it is exactly 64 hexadecimal characters |
| `code` | Stable verifier code such as `OK`, `ID_MISMATCH`, or `OUT_OF_PROFILE_DOMAIN` |
| `reason` | One-line explanation |
| `content_id` | Compatibility value: `verified` only for `VALID`, otherwise `unverified` |

With the default gate, exit `0` means `VALID`, exit `1` means `INVALID`, and
exit `2` means `UNCHECKABLE` or an unreadable/configuration path. Setting
`fail_on_mismatch: false` changes only the exit status; it never changes the
verdict or reports `content_id=verified` for a failed or incomplete check.

The verifier and pinned profile are loaded from this Action's checked-out source
path, not from the consumer repository and not from the network.

## Reusable workflow migration

The matching `.github/workflows/verify-card.yml` wrapper uses this same runner.
Its `artifact` is relative to the caller checkout; it does not inherit files from
earlier jobs. Retain the card in that checkout or use the composite in the job
where the card was downloaded. Both interfaces now verify supported measurement
cards only, not arbitrary signals or leaderboard envelopes. Read `id` for the
card identifier; `content_id` is the compatibility `verified`/`unverified` flag.

The wrapper checks out the called workflow's exact repository and commit using
[GitHub's job workflow identity](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#example-usage-of-job-context-workflow-identity),
separately from caller data. It requests read-only repository access and does not
run caller code. Missing or unexpected workflow identity stops the job before
verification. Those identity properties are unavailable on GitHub Enterprise
Server; use a reviewed SHA-pinned composite on that platform instead. Neither
interface treats unavailable verification as valid.

From a checkout containing the source and package fixtures, run the offline tests:

```sh
node --test actions/verify-card/*.test.mjs
```

These local tests do not establish a successful GitHub-hosted workflow run. That
runtime check remains a release requirement for this revision.
