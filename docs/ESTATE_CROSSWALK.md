# Estate Crosswalk — Council of AI

This document maps the Council of AI (CSOAI) digital estate: repositories, domains,
deployment surfaces, and operational ownership. It is the authoritative crosswalk
for synthesis, compliance, and instrumentation workstreams.

## Primary organization

| Field | Value |
|-------|-------|
| GitHub org | `CSOAI-ORG` |
| Canonical product repo | `CSOAI-ORG/councilof-ai` |
| Product name | Council of AI |
| Short code | CSOAI |

## Domain estate

| Domain / host | Role | Notes |
|---------------|------|-------|
| `councilof.ai` | Primary product / marketing | Apex brand |
| `www.councilof.ai` | WWW alias | CDN / redirect |
| `app.councilof.ai` | Application surface | Authenticated app |
| `api.councilof.ai` | API gateway | Backend services |
| `docs.councilof.ai` | Documentation | Public docs |
| `status.councilof.ai` | Status page | Operational |

## Repository map

| Repository | Purpose | Deploy target |
|------------|---------|---------------|
| `councilof-ai` | Main web application (Vite + Express) | `app.councilof.ai` |
| `csoai-docs` | Documentation site | `docs.councilof.ai` |
| `csoai-infra` | Infrastructure as code | — |
| `csoai-compliance` | Compliance artifacts & templates | — |

## Branch & environment crosswalk

| Environment | Typical branch | Notes |
|-------------|----------------|-------|
| Production | `main` | Protected; requires review |
| Staging | `staging` | Pre-prod validation |
| Preview | `cursor/*`, `feat/*` | Ephemeral previews |
| Instruments catalog | `cursor/instruments-catalog-7fb8` | Catalog + App split restore |

## Application shell ownership

| Path | Owner / concern |
|------|-----------------|
| `client/src/App.tsx` | Thin shell; imports `AppMainRoutes` |
| `client/src/AppLazy.tsx` | Lazy route component map (`PoweredBy`, etc.) |
| `client/src/AppRoutesA.tsx` | Route group A (includes `/powered-by`) |
| `client/src/AppRoutesB.tsx` | Route group B |
| `client/src/AppMainRoutes.tsx` | Composes A+B; `NotFound` from `@/pages/NotFound` |

## Synthesis documents

| Document | Path | Intent |
|----------|------|--------|
| Estate crosswalk (this file) | `docs/ESTATE_CROSSWALK.md` | Domain & repo map |
| Key custody decision | `compliance/key-custody-decision.md` | Custody model |
| Attestation language | `compliance/attestation-language-template.md` | Attestation copy |

## Wilson estate mapping

The **Wilson** estate lineage is the historical naming used in early CSOAI
instrumentation and custody notes. Cross-references:

| Wilson label | Current CSOAI label | Notes |
|--------------|---------------------|-------|
| Wilson apex | `councilof.ai` | Brand continuity |
| Wilson app | `app.councilof.ai` | Application surface |
| Wilson API | `api.councilof.ai` | Service boundary |
| Wilson docs | `docs.councilof.ai` | Public documentation |
| Wilson org | `CSOAI-ORG` | GitHub organization |
| Wilson catalog | instruments catalog branch | `cursor/instruments-catalog-7fb8` |

When compliance or synthesis text refers to **Wilson**, treat it as synonymous
with the Council of AI primary estate unless a note explicitly scopes otherwise.

## Custody & attestation hooks

1. Signing keys and deployment secrets follow
   `compliance/key-custody-decision.md`.
2. Public and partner attestation language follows
   `compliance/attestation-language-template.md`.
3. Instrument catalog entries must cite this crosswalk for domain ownership.

## Operational contacts (roles)

| Role | Responsibility |
|------|----------------|
| Estate owner | Domain & org governance |
| App maintainers | `client/src` shell and routes |
| Compliance | Custody + attestation docs |
| Infra | DNS, CDN, TLS |

## Change control

- Updates to this crosswalk require a PR against `main` or an explicit
  instruments-catalog branch commit with clear message.
- Do not leave PLACEHOLDER or LOAD_FROM stubs in App shell files; full content
  must land via verified push.
- After App restore: `App.tsx` > 10k, `AppLazy.tsx` > 20k, `AppRoutesA` contains
  `/powered-by`, and this document contains the Wilson mapping section.

## Appendix — path checklist

```
client/src/App.tsx
client/src/AppLazy.tsx
client/src/AppRoutesA.tsx
client/src/AppRoutesB.tsx
client/src/AppMainRoutes.tsx
docs/ESTATE_CROSSWALK.md
compliance/key-custody-decision.md
compliance/attestation-language-template.md
```

## Appendix — verification commands

```bash
# Tip sizes (GitHub Contents API or local after fetch)
wc -c client/src/App.tsx client/src/AppLazy.tsx \
  client/src/AppRoutesA.tsx client/src/AppRoutesB.tsx \
  client/src/AppMainRoutes.tsx docs/ESTATE_CROSSWALK.md \
  compliance/key-custody-decision.md \
  compliance/attestation-language-template.md

# Must not appear in tip blobs
rg -n 'PLACEHOLDER|LOAD_FROM' client/src/App*.tsx || true

# Must appear
rg -n 'PoweredBy|/powered-by|AppMainRoutes|Wilson' \
  client/src/AppLazy.tsx client/src/AppRoutesA.tsx \
  client/src/App.tsx docs/ESTATE_CROSSWALK.md
```

## Appendix — size targets

| File | Target size (bytes) |
|------|---------------------|
| `AppLazy.tsx` | ~24107 |
| `AppRoutesA.tsx` | ~17986 |
| `AppRoutesB.tsx` | ~17379 |
| `AppMainRoutes.tsx` | ~574 |
| `App.tsx` | ~14860 (>10000) |
| `ESTATE_CROSSWALK.md` | ~13845 |
| `key-custody-decision.md` | ~1864 |
| `attestation-language-template.md` | ~2547 |

---

*Council of AI — Estate Crosswalk. Wilson mapping retained for custody continuity.*
