# Claim Maintenance reference CLI symlink repair — 24 September 2026

The unmodified `scripts/claim-capture.mjs` was copied to a macOS `/tmp` path (whose filesystem realpath is `/private/tmp`) and invoked with `--verify missing.json`. It printed nothing and exited **0**. The main-module check compared `import.meta.url` to a hand-built `file://${process.argv[1]}` string, so Node's resolved module path disagreed with the caller's symlinked path. Verification code never ran. This is a false success, not an artifact verification.

## Source-only correction

- Branch: `codex/claim-cli-symlink-20260924`.
- Commit: `dab65821a7091d6d39fadec3ceeec674fd395dd8`.
- RunPod bare review ref: `refs/heads/codex/claim-cli-symlink-20260924` at the same commit; master and deployment untouched.
- Bundle SHA-256: `3e81a735a14d8881920379bc86657ea1616d758bc90f2296a9f8ef0ac03aa210`.
- Three changed files: maintained source CLI, byte-identical public reference CLI, and `scripts/claim-capture.cli.node-test.mjs`.

The entrypoint now compares `realpathSync(fileURLToPath(import.meta.url))` with `realpathSync(process.argv[1])`. It keeps imported-module use inert and lets the same CLI run through symlinked paths on macOS and Linux.

## Validation

- M4: three Node regression checks pass; both CLI files parse; source and public copies are byte-identical; staged diff whitespace check passes.
- RunPod Linux: the exact commit was extracted to `/tmp` without a full checkout; the same three Node checks pass using `/workspace/tools/node/bin/node`.
- The symlink regression asserts `--verify missing.json` prints `REJECTED` and exits **1** for both copies. The old code was observed to exit **0** silently.

The repair is not deployed or served. A guarded source promotion, site deployment and anonymous readback of the public reference URL remain separate steps.
