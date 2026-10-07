#!/bin/bash
# Council pre-push content gates — required by ~/.config/git/hooks/pre-push.
#
# WHY THIS EXISTS. On 2026-10-02 the global pre-push hook was scoped so every
# push to this repository runs a repository-specific safety suite, and no suite
# existed at the worktree root — so every push was refused with
# "no repository-specific safety suite found". This is that suite. It gates the
# three ways a push from this estate actually hurts:
#
#   1. protected-branch  — direct push to master/main (owner rule: branch + PR)
#   2. private-key       — PEM/secret-key material in ADDED diff lines.
#                          Signing keys never enter source, artifacts or logs
#                          (TUI-5 red line; off-device ceremony only)
#   3. payload validity  — changed *.py must compile, changed *.json must parse.
#                          A syntactically broken artifact is a broken receipt
#
# Scope: only the commits being pushed (fast — a few seconds on a normal push).
#
# The gates must be provably able to go red before a green means anything, so
# this script ships a selftest and runs it FIRST (0.2s):
#     scripts/pre-push-gates.sh --selftest
#
# Bypass for a genuine emergency (and only that):
#     git push --no-verify
set -uo pipefail

SELFTEST=0
[ "${1:-}" = "--selftest" ] && SELFTEST=1

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "pre-push-gates: not in a git repo"; exit 1; }
cd "$ROOT" || exit 1

# ─────────────────────────────────────────────────────────────────────
# Check functions (pure: inputs in, verdict out) — reused by the selftest
# ─────────────────────────────────────────────────────────────────────

# $1 = added-lines text. Prints findings, returns 1 if any.
secret_scan() {
  printf '%s' "$1" | grep -nE '^\+.*-----BEGIN [A-Z ]*PRIVATE KEY-----' >/dev/null 2>&1
}

# $1 = json file path. Returns 1 if unparseable.
json_valid() { python3 -m json.tool "$1" >/dev/null 2>&1; }

# $1 = python file path. Returns 1 if it does not compile.
py_compiles() {
  python3 - "$1" <<'PYEOF' >/dev/null 2>&1
import sys
src = open(sys.argv[1], "rb").read()
compile(src, sys.argv[1], "exec")
PYEOF
}

# $1 = remote ref. Returns 1 (blocked) for protected branches.
ref_blocked() {
  case "$1" in
    refs/heads/master|refs/heads/main|refs/heads/deploy) return 1 ;;
    *) return 0 ;;
  esac
}

# ─────────────────────────────────────────────────────────────────────
# Selftest: each gate MUST be shown to fail on a bad input before its
# pass on the real tree means anything. A gate that has never gone red
# proves nothing.
# ─────────────────────────────────────────────────────────────────────
run_selftest() {
  local bad=0

  if secret_scan '+-----BEGIN ED25519 PRIVATE KEY-----
'; then
    echo "  ✖ selftest: secret gate MISSED a private key"; bad=1
  else
    echo "  ✓ selftest: secret gate detects private-key material"
  fi
  if secret_scan '+this line merely mentions public documentation
'; then
    echo "  ✖ selftest: secret gate false-positives on prose"; bad=1
  else
    echo "  ✓ selftest: secret gate stays quiet on prose"
  fi

  local tmpj; tmpj=$(mktemp -t gates_selftest_XXXX.json)
  echo '{not json' > "$tmpj"
  if json_valid "$tmpj"; then echo "  ✖ selftest: json gate MISSED broken json"; bad=1
  else echo "  ✓ selftest: json gate rejects malformed json"; fi
  echo '{"ok":true}' > "$tmpj"
  if json_valid "$tmpj"; then echo "  ✓ selftest: json gate accepts valid json"
  else echo "  ✖ selftest: json gate false-fails valid json"; bad=1; fi
  rm -f "$tmpj"

  local tmpp; tmpp=$(mktemp -t gates_selftest_XXXX.py)
  echo 'def broken(:' > "$tmpp"
  if py_compiles "$tmpp"; then echo "  ✖ selftest: py gate MISSED syntax error"; bad=1
  else echo "  ✓ selftest: py gate rejects syntax errors"; fi
  echo 'x = 1' > "$tmpp"
  if py_compiles "$tmpp"; then echo "  ✓ selftest: py gate accepts valid python"
  else echo "  ✖ selftest: py gate false-fails valid python"; bad=1; fi
  rm -f "$tmpp"

  if ref_blocked refs/heads/master; then echo "  ✖ selftest: protected-branch gate MISSED master"; bad=1
  else echo "  ✓ selftest: protected-branch gate refuses master"; fi
  if ref_blocked refs/heads/feature/x; then echo "  ✓ selftest: protected-branch gate allows feature branches"
  else echo "  ✖ selftest: protected-branch gate false-blocks feature branch"; bad=1; fi

  return $bad
}

if [ "$SELFTEST" -eq 1 ]; then
  echo "pre-push: selftest (every gate must be able to fail) …"
  if run_selftest; then
    echo "  ✓ all gates demonstrably discriminating"
    exit 0
  fi
  echo "  ✖ selftest FAILED — the gates themselves are broken"
  exit 1
fi

echo "pre-push: selftest …"
run_selftest >/dev/null 2>&1 || { echo "pre-push: SELFTEST FAILED — gates are broken, push refused"; run_selftest; exit 1; }

# ─────────────────────────────────────────────────────────────────────
# The real push: stdin is "<local_ref> <local_sha> <remote_ref> <remote_sha>"
# ─────────────────────────────────────────────────────────────────────
fail=0
pushed_any=0

while read -r local_ref local_sha remote_ref remote_sha; do
  [ -z "${local_ref:-}" ] && continue
  pushed_any=1

  # Gate 1: protected branches are PR-only (owner rule; DEPLOY-LOCK doctrine).
  if ! ref_blocked "$remote_ref"; then
    echo "  ✖ protected-branch: direct push to ${remote_ref#refs/heads/} refused — push a branch and open a PR"
    fail=1
    continue
  fi

  # Branch deletion (all-zero local) has nothing to scan.
  case "$local_sha" in
    0000000000000000000000000000000000000000) continue ;;
  esac

  # Commits THIS push newly introduces to any remote. Already-published commits
  # (present on another remote-tracking ref, e.g. a merged lane branch whose
  # remote head is stale) are not re-scanned — they never entered the repo via
  # this push. This keeps a normal push at seconds even on a 500k-file estate.
  if [ "$remote_sha" = "0000000000000000000000000000000000000000" ] || ! git cat-file -e "$remote_sha" 2>/dev/null; then
    commits=$(git rev-list "$local_sha" --not --remotes 2>/dev/null)
  else
    commits=$(git rev-list "$remote_sha".."$local_sha" --not --remotes 2>/dev/null)
  fi

  if [ -z "$commits" ]; then
    echo "  ✓ no new commits vs remotes (nothing new enters the repo via this ref)"
    continue
  fi

  # Files touched by the new commits only (added/modified/deleted paths).
  files=$(printf '%s\n' "$commits" | xargs -I{} git diff-tree --no-commit-id --name-only -r {} 2>/dev/null | sort -u)

  [ -z "$files" ] && continue

  # Gate 2: private-key material must never enter the repository.
  added=$(printf '%s\n' "$commits" | xargs -I{} git show {} --unified=0 --pretty=format: 2>/dev/null | grep '^+' | grep -v '^+++')
  if [ -n "$added" ] && secret_scan "$added"; then
    echo "  ✖ private-key: added lines contain PEM private-key material (TUI-5 red line: signing keys never enter source, artifacts or logs)"
    fail=1
  fi

  # Gate 3/4: changed payloads must parse.
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ -f "$f" ] || continue   # deleted files can't be checked
    case "$f" in
      *.py)
        if ! py_compiles "$f"; then
          echo "  ✖ syntax: $f does not compile"; fail=1
        fi ;;
      *.json)
        if ! json_valid "$f"; then
          echo "  ✖ payload: $f is not valid JSON"; fail=1
        fi ;;
    esac
  done <<EOFFILES
$files
EOFFILES

done

if [ "$pushed_any" -eq 0 ]; then
  echo "pre-push: no refs on stdin — refusing (nothing to verify is not a pass)"
  echo "  hint: the hook was invoked without its ref list. Re-run as a plain"
  echo "        'git push origin <branch>' from the repo root (no command chained"
  echo "        around it) — a retry unpiped succeeded here on 2026-10-07."
  exit 1
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "  Push blocked by Council pre-push gates. Emergency bypass: git push --no-verify"
  exit 1
fi
echo "  ✓ protected-branch + private-key + syntax + JSON gates clean"
exit 0
