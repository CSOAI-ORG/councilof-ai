# Smithery Rebase Driver — Day 5 (15 Jun 2026)

**3 repos in scope** (per `SMITHERY_REBASE_MANIFEST_2026-06-15.json`). All are ahead of `origin/main`. The driver below is **read-only verification** + per-repo commands Nick fires manually (account-gated, per `meok-compliance-gateway/AGENTS.md`).

## Sovereign-temple (branch: `fix/silent-noop-metrics-comparison`, 35 ahead, dirty)

```bash
cd ~/clawd/sovereign-temple
git fetch origin
git status  # should show 35+ files changed
# If dirty, decide: stash or commit WIP
git add -A && git commit -m "WIP: pre-smithery-rebase" || true
git checkout main
git merge --no-ff fix/silent-noop-metrics-comparison
git push origin main
# Then check if there's a release tag pattern:
# git tag -a v1.0.X -m "bump" && git push --tags
```

## meok (branch: `meok-e2e-polish-jun15`, 8 ahead, dirty)

```bash
cd ~/clawd/meok
git fetch origin
git status  # 8+ files changed
git add -A && git commit -m "WIP: pre-smithery-rebase" || true
git checkout main
git merge --no-ff meok-e2e-polish-jun15
git push origin main
```

## meok-agent-zero (branch: `meok-main`, 1 ahead, clean)

```bash
cd ~/clawd/meok-agent-zero
git fetch origin
git status  # clean or 1 ahead
git checkout main
git merge --no-ff meok-main
git push origin main
```

## After each merge: trigger Smithery publish

For each repo that has a `.github/workflows/mcp-smithery-publish.yml`:
1. Create a GitHub release with tag matching the bumped version
2. The workflow auto-publishes to Smithery on `release: published`
3. Verify the deployment in the Smithery dashboard

For the 75 claimed-stuck repos in the morning rundown: **the actual scope is 3**, not 75. The rest are either:
- Already on `main` (no rebase needed)
- In the `meok-ai` GitHub org (different machine)
- Per-server branches in `feat/*` that the agent can't safely rebase from outside the developer's local checkout

**Time estimate:** 10-15 min total for the 3 repos (35 + 8 + 1 commits to merge).

## Verification after rebase

For each repo, run:
```bash
# from inside the repo
git log --oneline -10  # should show merged branch in history
git status  # should be clean
gh workflow list  # confirm the smithery workflow is registered
```

## Hard rules

- **DO NOT** push if `git status` shows unresolved conflicts
- **DO NOT** force-push to `main`
- **DO NOT** merge PRs from `feat/*` branches without reading the diff first
- **DO NOT** trigger a Smithery publish without a corresponding `v1.0.X` tag
- Per `meok-compliance-gateway/AGENTS.md`: account-gated = Nick only for PyPI publish, GHCR flip, Smithery publish
