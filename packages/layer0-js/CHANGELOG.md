# Changelog

## 0.2.1

- The same client as 0.2.0. This version exists so that the latest release is published from
  `master` by `.github/workflows/npm-layer0.yml` through npm trusted publishing (GitHub OIDC),
  which attaches a provenance attestation naming the commit and the workflow that produced the
  tarball.
- 0.2.0 was published on 2026-10-30 from `origin/master`'s bytes by the npm CLI, before the
  trusted publisher existed, and carries no provenance. npm versions are immutable and 0.2.0 is
  not withdrawn; 0.2.1 is the same code with the attestation attached.

## 0.2.0 - published 2026-10-30

- Licence changed from MIT to Apache-2.0 from this version; earlier versions remain MIT.
- Ships LICENSE, NOTICE and this CHANGELOG in the npm tarball.
- `homepage` is https://councilof.ai/layer0/ (was https://csoai.org, which now redirects there) and
  `bugs` is https://councilof.ai/contact/.
- The `repository` field points at the public source, https://github.com/CSOAI-ORG/councilof-ai
  under `packages/layer0-js`, which answers 200 to an anonymous reader.
- The description no longer says the package makes anything governed on its own. It is a client.
- The default `CSOAI_API_BASE` is now `https://councilof.ai`, where the public Layer 0 gateway is
  served. It was `https://api.csoai.org`, which has no DNS record.
- The publish workflow refuses to release the package until `/api/gate`, `/api/a2a/route` and
  `/api/a2a/verify` all answer, so an install line that cannot work is never published.

## 0.1.0

- MIT. Present in this repository only: the npm registry answered 404 for `@csoai/layer0`
  on 2026-09-25, so 0.1.0 was never published there.
