# Security policy

Council of AI publishes measurement and verification software. Security reports stay separate from measurement disputes, requests for a favourable result, and regulatory claims.

## Reporting a vulnerability

Do **not** open a public issue for a suspected vulnerability involving credentials, payment/signing paths, authentication or authorization, private data, or evidence-integrity bypasses.

Send a minimal report to **nicholas@csoai.org** with:
- affected repository/package and exact version or commit;
- reproduction steps;
- expected versus observed security boundary;
- whether public exploitation was observed; and
- the smallest safe evidence needed to reproduce.

Do not include unrelated secrets, customer material, private prompts, or personal data.

## Scope and claims

A security fix, Scorecard result, badge, signature, or GSPC measurement is not certification or regulatory approval. Public corrections are preserved when a published claim changes.

## Supported surfaces

The current public source of truth is the `master` branch and the released package versions linked from https://councilof.ai. Reports about historical versions should name the exact version.

## Coordinated disclosure

Please allow maintainers time to reproduce and coordinate a safe release before public disclosure when doing so reduces risk. This is a request for coordinated disclosure, not a promise to suppress legitimate research.
