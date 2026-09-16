#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# deploy-site.selftest.sh — prove deploy-site.sh's tree-check predicates discriminate.
#
# A guard that cannot fail is decoration. This builds a throwaway git repo with a local bare
# "origin", copies deploy-site.sh into it (the script cd's to its own repo root, so the copy
# is judged against the throwaway tree, never this one), stubs `npx` on PATH so nothing can
# reach wrangler, and runs `--tree-check` against each state:
#
#   a. a foreign untracked file            -> exit 3, names the file
#   b. HEAD not pushed to origin/master    -> exit 3, names the predicate
#   c. clean tree, HEAD on origin/master   -> exit 0
#   d. a hand-modified tracked file        -> exit 3
#   e. a modified generator-owned file     -> exit 0 (the build's own output is allowed)
#   f. (a) with --i-know-tree-is-dirty     -> exit 0, says OVERRIDDEN
#   g. (b) with --i-know-tree-is-dirty     -> exit 3 (an unpushed HEAD is never overridable)
#
# No bats, no network, no wrangler. Exit 0 = every case behaved.
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$HERE/deploy-site.sh"
[ -f "$SCRIPT" ] || { echo "FATAL: $SCRIPT missing"; exit 2; }

WORK="$(mktemp -d "${TMPDIR:-/tmp}/deploy-site-selftest.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_NOSYSTEM=1 HOME="$WORK/home"
mkdir -p "$HOME"

# npx stub: if the tree check ever tries to run wrangler, that is itself a failure.
mkdir -p "$WORK/bin"
cat >"$WORK/bin/npx" <<'EOF'
#!/usr/bin/env bash
echo "STUB npx invoked with: $*" >&2
exit 99
EOF
chmod +x "$WORK/bin/npx"
export PATH="$WORK/bin:$PATH"
unset CLOUDFLARE_API_TOKEN

# origin + working clone
git init -q --bare "$WORK/origin.git"
git -C "$WORK/origin.git" symbolic-ref HEAD refs/heads/master
git clone -q "$WORK/origin.git" "$WORK/repo" 2>/dev/null
REPO="$WORK/repo"
git -C "$REPO" config user.email "selftest@example.invalid"
git -C "$REPO" config user.name "selftest"
git -C "$REPO" checkout -q -b master 2>/dev/null || true

mkdir -p "$REPO/scripts" "$REPO/public" "$REPO/client/src"
cp "$SCRIPT" "$REPO/scripts/deploy-site.sh"
echo "/old  /new  301" > "$REPO/public/_redirects"        # generator-owned (generate-redirects.mjs)
echo "export const x = 1;" > "$REPO/client/src/App.tsx"   # hand-owned
git -C "$REPO" add -A
git -C "$REPO" commit -q -m "base"
git -C "$REPO" push -q origin master

PASS=0; FAIL=0
run_case() {
  # run_case <name> <expected-exit> <must-match-regex> [extra args...]
  local name="$1" want="$2" pat="$3"; shift 3
  local out rc
  out="$(cd "$REPO" && bash scripts/deploy-site.sh --tree-check "$@" 2>&1)"; rc=$?
  if [ "$rc" -eq "$want" ] && grep -qE "$pat" <<<"$out"; then
    printf '  PASS  %-44s exit %s, output matched /%s/\n' "$name" "$rc" "$pat"; PASS=$((PASS + 1))
  else
    printf '  FAIL  %-44s wanted exit %s + /%s/, got exit %s\n' "$name" "$want" "$pat" "$rc"; FAIL=$((FAIL + 1))
    sed 's/^/        | /' <<<"$out"
  fi
  if grep -q "STUB npx invoked" <<<"$out"; then
    printf '  FAIL  %-44s tree-check reached npx/wrangler\n' "$name"; FAIL=$((FAIL + 1))
  fi
}

echo "deploy-site.selftest — tree-check predicates (throwaway repo: $REPO)"

# c. clean + pushed
run_case "c. clean tree, HEAD on origin/master" 0 "tree-check ok"

# a. foreign untracked file
echo "not mine" > "$REPO/other-lanes-file.txt"
run_case "a. foreign untracked file" 3 "untracked file the build does not produce: other-lanes-file.txt"
run_case "a'. names the predicate" 3 "predicate: every 'git status --porcelain' row"
# f. same, with the override
run_case "f. (a) + --i-know-tree-is-dirty" 0 "OVERRIDDEN by --i-know-tree-is-dirty" --i-know-tree-is-dirty
rm "$REPO/other-lanes-file.txt"

# a2. a build output the build is known to create -> allowed
mkdir -p "$REPO/public/interop"
echo '{}' > "$REPO/public/interop/hub-cards-index.json"
run_case "a2. build-produced untracked file allowed" 0 "tree-check ok"
rm -r "$REPO/public/interop"

# d. hand-modified tracked file
echo "export const x = 2;" > "$REPO/client/src/App.tsx"
run_case "d. modified tracked file outside generator set" 3 "modified tracked file outside the generator-owned set: \[ M\] client/src/App.tsx"
git -C "$REPO" checkout -q -- client/src/App.tsx

# e. modified generator-owned file
echo "/old  /newer  301" > "$REPO/public/_redirects"
run_case "e. modified generator-owned file allowed" 0 "tree-check ok"
git -C "$REPO" checkout -q -- public/_redirects

# b. unpushed HEAD
echo "export const x = 3;" > "$REPO/client/src/App.tsx"
git -C "$REPO" commit -q -am "local only"
run_case "b. HEAD not an ancestor of origin/master" 3 "NOT an ancestor of origin/master"
run_case "b'. names the predicate" 3 "predicate: 'git merge-base --is-ancestor HEAD FETCH_HEAD'"
# g. override does not reach the unpushed predicate
run_case "g. (b) + --i-know-tree-is-dirty still refuses" 3 "NOT an ancestor of origin/master" --i-know-tree-is-dirty
# b2. push it -> passes again
git -C "$REPO" push -q origin master
run_case "b2. after push, HEAD on origin/master" 0 "tree-check ok"

# h. origin unreachable -> refuse, never assume
git -C "$REPO" remote set-url origin "$WORK/does-not-exist.git"
run_case "h. origin unreachable" 3 "git fetch origin master failed"

echo ""
echo "deploy-site.selftest: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
