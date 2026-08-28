# AGENTS.md — Council of AI monorepo

ONE source of truth. All public surfaces (PyPI, npm, HF, Kaggle, GitHub org)
are GENERATED MIRRORS from this monorepo.

- Never reference internal codenames (SOVOS, sov6, OWEM, SOV-*) in public output
- Measurement credentials, never certification
- Package rename: sovos-* → csoai-* (e.g. sovos_core → csoai_core)
- Never git add -A (multi-lane)
- Deploy: **GHA on master only** (push to master triggers `deploy.yml`; direct wrangler is owner-only per DEPLOY-LOCK.md)
