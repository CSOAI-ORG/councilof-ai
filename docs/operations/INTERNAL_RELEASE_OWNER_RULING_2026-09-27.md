# Internal production writer ruling — 27 September 2026

Owner decision: GitHub is not the Council of AI production delivery route. One internal writer owns production. Other lanes deliver immutable bundles and evidence.

The sanctioned production command is `bash scripts/deploy-site.sh --internal-owner` after all repository release gates pass, or `--skip-build --internal-owner` when the exact gated `dist/client` is transferred to the authenticated writer.

The writer deploys the same tree to the Cloudflare Pages aliases `master`, `main`, and `production`, verifies `https://councilof.ai`, runs deep-link/prerender checks, and rechecks after propagation for the historical trailing-clobber failure mode.

Raw Wrangler commands remain prohibited. A failed gate, mismatched byte readback, missing authority, or unavailable writer leaves the release on HOLD. No lane may reinterpret a prepared bundle, preview URL, index submission, crawler hit, self-payment, or test traffic as production acceptance, user adoption, or revenue.

This ruling changes deployment transport, not measurement, signing, payment, privacy, correction, or evidence authority.
