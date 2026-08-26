# LANE PROTOCOL

One page. Read it before you write a line of code in this repo.

**One lane = one writer = one branch = one worktree. Never a shared checkout.**

CLAUDE.md has said that for weeks. It was ignored, because a sentence cannot
refuse. `scripts/lane.mjs` and `scripts/lane-guard.mjs` can, and now do.

---

## What went wrong, so you know what the rules are for

Four incidents, all on 2026-08-26, all the same root cause — lanes sharing one
git checkout:

1. **The branch flip.** A lane watched the shared working tree change branch six
   times in minutes (`feat` → `master` → `os-aeo` → `plays-white-label` →
   `plays-deadline-products` → `master`). Its commit `3e5116ac` was rewound and
   survived only because someone thought to check `git reflog`.
2. **The port collision.** Two lanes ran `prerender.mjs` against a hardcoded
   port 4400. The second lane silently rendered every route against the *first*
   lane's server — a different build. It surfaced as an intermittent
   "/world timeout". It was never a timeout. (Fixed: the port is OS-assigned.)
3. **The symlink.** A worktree merge committed a self-referential `node_modules`
   symlink. Checking it out replaced the real directory with a link to itself.
   The build died and nothing in CI had an opinion, because nothing looked at
   file modes.
4. **The silent loss.** `/api/fines` and `/api/specialists` were built,
   committed, and lost. They are 404 in production right now.

The repo's history records 19+ waves and 898 commits in a single day. It shipped
no product. Counter-pushing is not throughput.

---

## 1. Claim

From the main checkout, on master:

```sh
node scripts/lane.mjs claim <lane-name> --desc "what this lane is doing"
```

This creates `lane/<lane-name>` from the current local master, makes a worktree
for it as a **sibling of the repo** (never inside it), and writes the claim into
[`LANES.md`](LANES.md).

It **refuses** — with a non-zero exit and a reason — when:

- a live worktree already holds that lane (two writers, one branch);
- the branch exists with no live worktree (it holds commits nobody is watching —
  reattach a worktree, do not start a new branch over it);
- the destination directory is already occupied.

Once per machine, wire the local guard:

```sh
node scripts/lane.mjs install-hooks
```

See what every lane is doing, and what holds unrescued work:

```sh
node scripts/lane.mjs list
```

## 2. Work

**Only inside your worktree directory.**

- Never `git switch` / `git checkout <branch>` in the main checkout. That is
  incident #1, exactly.
- The main checkout stays on **master**, clean. `lane-guard` fails your commit if
  it is off master with uncommitted work.
- Never hardcode a port, a temp path, or a fixed output directory. Two lanes will
  run your script at once. That is incident #2, exactly.
- `node_modules` belongs to your worktree. Do not link it to another worktree's.
  That is incident #3, exactly.

## 3. Land

**One gated merge. Never a stream of `fix:` commits pushed at master.**

```sh
# in your worktree
git fetch origin
git rebase origin/master          # you reconcile, on your branch, where it is safe
npm run build && node scripts/facts-gate.mjs dist/client
node scripts/lane-guard.mjs --selftest && node scripts/lane-guard.mjs
git push -u origin lane/<lane-name>
gh pr create --fill
```

Land it as a PR that CI has gated. One merge commit, one reviewable diff, one
thing that either shipped or did not.

A `fix:` commit pushed straight at master to repair the previous `fix:` commit is
how 898 commits produced nothing. If the gate fails, fix it **on your branch**
and push the branch again.

## 4. On a push rejection

`! [rejected] ... (fetch first)` means somebody else landed work. It is not an
obstacle. It is information.

```sh
git pull --rebase origin master     # or: git fetch && git rebase origin/master
# resolve, re-run the gates, push again
```

**NEVER counter-push.** No `--force`, no `--force-with-lease` at master, no
"push again and hope", no reverting their commit to make room for yours. Every
one of those is how commits get rewound. If a rebase looks genuinely
irreconcilable, stop and ask the owner — a rejected push has cost you thirty
seconds; a force-push has cost this repo entire days.

## 5. Release

```sh
node scripts/lane.mjs release <lane-name>
```

Release **reports** work rather than discarding it. It refuses while the worktree
has uncommitted paths (and prints them), and refuses while the branch is ahead of
master and unlanded (and prints the commits). The branch is always kept; only the
worktree registration is removed.

To clear registrations whose directory is already gone — and only those:

```sh
node scripts/lane.mjs prune
```

`prune` never touches a worktree that exists, and never touches a branch.

---

## The guard

`scripts/lane-guard.mjs` is the enforcement, and it proves itself:

```sh
node scripts/lane-guard.mjs --selftest   # 9 cases: catches AND passes negations
node scripts/lane-guard.mjs --staged     # pre-commit: checks the index
node scripts/lane-guard.mjs              # CI/local: checks the HEAD tree
```

It blocks:

| rule | what it catches |
|---|---|
| `symlink-replaces-directory` | mode `120000` on a name that is a directory in every healthy checkout (`node_modules`, `dist`, `client`, `functions`, …), or on a path HEAD records as a tree |
| `self-referential-symlink` | a link whose target resolves to itself or to one of its own ancestors |
| `main-checkout-off-master` | the shared main checkout on a non-master branch with uncommitted work — names the lane that claimed the branch |

It is wired **twice**, because hooks are not shared by clone:

- `.githooks/pre-commit`, enabled by `node scripts/lane.mjs install-hooks`
- `.github/workflows/lane-guard.yml`, which nobody can skip

The CI job runs `--selftest` before the real check, so a guard that has quietly
stopped working fails loudly instead of passing everything.

`main-checkout-off-master` is skipped when `CI` is set: a runner has one checkout
and no sibling lanes to collide with. That rule is a local rule, and the hook is
where it bites.
