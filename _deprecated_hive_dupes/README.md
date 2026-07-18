# Deprecated hive duplicate deploy dirs (archived 2026-06-15)

These were superseded by the consolidation to the single master generator
(`build_hive_conversion_pages.py`, see `HIVE_MASTER.md`):

- `agisafe-conversion-deploy`, `asisecurity-conversion-deploy` — JEEVES dupes of
  the master's `agisafe-deploy` / `asisecurity-deploy` (now deployed as canonical).
- `meok-governance-deploy`, `proofof-conversion-deploy`, `councilof-conversion-deploy`,
  `csoai-conversion-deploy` — static copies of the HUB sites. The hubs are real
  apps (meok.ai = Next.js `meok/ui`; proofof/councilof/csoai = their real deploys).

NOTE: the corresponding Vercel *projects* (`*-conversion-deploy.vercel.app` etc.)
may still be live — delete them in the Vercel dashboard if not wanted. Archiving
the local source does not take down a deployed project.
