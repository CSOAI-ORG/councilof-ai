# Changelog

## 0.2.0 (unreleased)

- Licence changed from MIT to Apache-2.0 from this version; earlier versions remain MIT.
- Ships LICENSE, NOTICE and this CHANGELOG in the npm tarball.
- `homepage` is https://councilof.ai/layer0/ (was https://csoai.org, which now redirects there) and
  `bugs` is https://councilof.ai/contact/. The `repository` field is dropped while the source host
  answers 404 to the public; it comes back when a public source URL does.
- The description no longer says the package makes anything governed on its own. It is a client.
- The default `CSOAI_API_BASE` is now `https://councilof.ai`, where the public Layer 0 gateway is
  served. It was `https://api.csoai.org`, which has no DNS record.
- The publish workflow refuses to release the package until `/api/gate`, `/api/a2a/route` and
  `/api/a2a/verify` all answer, so an install line that cannot work is never published.

## 0.1.0

- MIT. Present in this repository only: the npm registry answered 404 for `@csoai/layer0`
  on 2026-09-25, so 0.1.0 was never published there.
