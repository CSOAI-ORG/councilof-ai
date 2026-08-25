# Rollback — App / routes truncate or LOAD_ME on tip

If `App.tsx`, route files, or `NewHome-v3.tsx` on the branch tip show **truncation**, tiny byte size, or `LOAD_ME` / `PLACEHOLDER` stubs, treat the tip as **corrupt**.

## Symptoms

- Page component &lt; 2 KB where a full surface is expected
- `LOAD_ME`, `PLACEHOLDER`, or `// restore from` pointer-only files
- `/indices`, `/products`, or `/powered-by` routes missing from manifest while docs claim shipped

## Restore procedure

1. **Stop writes** — single-writer tip policy (`docs/AGENT_COORDINATION.md` §374).
2. **Fetch tip** — `git fetch origin <branch>` and inspect `git show origin/<branch>:client/src/App.tsx` (and affected paths).
3. **Verify NewHome size** — `wc -c client/src/pages/NewHome-v3.tsx` must match a known-good commit (thousands of bytes, not a stub). **Do not rewrite NewHome-v3 or AppMainRoutes in drive-by fixes.**
4. **Restore real bytes** — `git checkout <good-sha> -- <paths>` from last green commit, or parent agent MCP `push_files` with **full file content** (small batches, one concern per push).
5. **Verify routes** — `node scripts/generate-route-manifest.mjs` · smoke `/indices` `/products` `/powered-by`.
6. **Re-run merge gates** — `npm run build:client` (includes refutation, value-ledger, aum, jmwh lints).

## Prevention

- No `LOAD_ME` stubs — ever (`docs/AGENT_COORDINATION.md` §373).
- Prefer local git for large trees; MCP push only for coordinated tip restore.
- `NewHome-v3.tsx` and `AppMainRoutes.tsx` are do-not-corrupt lanes.
