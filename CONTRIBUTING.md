# Contributing to Council of AI / GSPC

Thank you for contributing.

## What this project is

GSPC publishes reproducible AI/agent measurements and evidence. It does **not** certify systems, sell grades, or convert missing evidence into a pass.

## Before changing code

1. Search existing issues and receipts for the same problem.
2. Keep source observations, measurements, signatures, payment, and execution authority separate.
3. Preserve `VALID`, `INVALID`, `UNCHECKABLE`, `UNMEASURED`, and correction history where applicable.
4. Never add credentials, customer data, private prompts, or regulated secrets to fixtures.
5. Do not hand-edit generated public files when a generator owns them.

## Tests

Run the narrow tests for your change and the applicable repository guards before requesting review. Useful commands include:

```bash
npm test
npm run check
npm run mcp:selftest
npm run guard:evidence-integrity
npm run guard:wallet-secrets
```

A large full-site build is not a substitute for a focused regression test.

## Security

Follow [SECURITY.md](SECURITY.md) for vulnerabilities. Do not file sensitive reports publicly.

## AI-assisted contributions

AI-assisted development is permitted. The contributor remains responsible for understanding the change, verifying its behaviour, respecting upstream licences, and having the right to submit the resulting code or content. Do not submit generated code you cannot explain or test.

## Licensing

Unless a path says otherwise, contributions to this repository are accepted under the repository's existing licence. Preserve upstream notices and third-party licences.

## Review boundary

A merged contribution is not a Council endorsement of an AI vendor, model, framework, or regulatory conclusion. Public claims require their own evidence.
