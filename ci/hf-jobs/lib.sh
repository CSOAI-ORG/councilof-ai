#!/usr/bin/env bash
# ci/hf-jobs/lib.sh — shared helpers for the Hugging Face Jobs second runner.
#
# Sourced by deploy.sh and public-root.sh. Doctrine: fail closed, never print a
# secret, never install anything at pipeline time (provisioning is bootstrap.sh).
#
# Step ledger: every named GitHub Actions step is announced with `step '<exact name>'`
# so ci/hf-jobs/steps-drift.test.mjs can assert the two runners never diverge.

set -euo pipefail

STEP_N=0
CURRENT_STEP="(preamble)"

step() {
  STEP_N=$((STEP_N + 1))
  CURRENT_STEP="$1"
  printf '\n=== [%02d] %s ===\n' "$STEP_N" "$1"
}

# Unnamed `uses:` steps in the workflow (checkout, setup-node) — announced but
# deliberately NOT via step(), so the drift test compares only named steps.
prep() { printf '\n--- prep: %s ---\n' "$1"; }

skipped() { printf '    SKIPPED: %s\n' "$1"; }

die() {
  printf '\nFAIL-CLOSED at step [%02d] "%s": %s\n' "$STEP_N" "$CURRENT_STEP" "$1" >&2
  exit "${2:-1}"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 \
    || die "missing tool '$1' — run ci/hf-jobs/bootstrap.sh or use the csoai/ci-runner image"
}

# Print presence + length of a secret. Never the value.
secret_state() {
  local name="$1" v="${!1:-}"
  if [ -n "$v" ]; then printf '    %-28s present (%d chars)\n' "$name" "${#v}"
  else printf '    %-28s ABSENT\n' "$name"; fi
}

# Require an env var unless DRY_RUN=1. Fail closed before spending compute.
require_secret() {
  local name="$1"
  if [ "${DRY_RUN:-0}" = "1" ]; then return 0; fi
  [ -n "${!name:-}" ] || die "secret $name is not set (pass it with: hf jobs run --secrets $name=…)" 3
}

# Portable `timeout` (GNU coreutils on the runner; absent on macOS → run bare).
with_timeout() {
  local secs="$1"; shift
  if command -v timeout >/dev/null 2>&1; then timeout "$secs" "$@"; else "$@"; fi
}

# ---------------------------------------------------------------------------
# Git auth: an HTTPS credential helper fed from $GIT_PUSH_TOKEN at run time.
# The token is never placed in a URL, argv, or `git remote -v` output.
# ---------------------------------------------------------------------------
GIT_CRED=()
if [ -n "${GIT_PUSH_TOKEN:-}" ]; then
  GIT_CRED=(-c "credential.helper=" -c 'credential.helper=!f() { echo username=x-access-token; echo "password=$GIT_PUSH_TOKEN"; }; f')
fi
export GIT_TERMINAL_PROMPT=0

GITHUB_REPO_URL="${GITHUB_REPO_URL:-https://github.com/CSOAI-ORG/councilof-ai.git}"
FALLBACK_SOURCE="${FALLBACK_SOURCE:-hf://datasets/csoai/councilof-ai-mirror}"

newest_bundle_in() {
  # shellcheck disable=SC2012
  ls -1t "$1"/*.bundle 2>/dev/null | head -n 1
}

# Clone from a git bundle into $2, then detach at $3. Bundle refs may be either
# refs/heads/* (bundle made with --all) or refs/remotes/origin/* (bundle made
# from origin/master); both are fetched under refs/bundle/* and resolved.
clone_from_bundle() {
  local bundle="$1" dest="$2" ref="$3"
  [ -f "$bundle" ] || die "bundle not found: $bundle"
  echo "    source: git bundle $bundle ($(wc -c < "$bundle") bytes)"
  git init -q "$dest"
  git -C "$dest" bundle verify "$bundle" >/dev/null 2>&1 || die "git bundle verify failed: $bundle"
  git -C "$dest" fetch -q "$bundle" '+refs/*:refs/bundle/*'
  local cand
  for cand in "$ref" "refs/bundle/heads/$ref" "refs/bundle/remotes/origin/$ref" "refs/bundle/$ref"; do
    if git -C "$dest" rev-parse -q --verify "$cand^{commit}" >/dev/null 2>&1; then
      git -C "$dest" checkout -q --detach "$cand"
      git -C "$dest" remote add origin "$GITHUB_REPO_URL"
      return 0
    fi
  done
  die "ref '$ref' not present in bundle $bundle (bundle heads: $(git -C "$dest" bundle list-heads "$bundle" | awk '{print $2}' | tr '\n' ' '))"
}

clone_from_url() {
  local url="$1" dest="$2" ref="$3"
  echo "    source: git url $url"
  git "${GIT_CRED[@]}" clone -q --no-checkout "$url" "$dest" || return 1
  git -C "$dest" checkout -q --detach "$ref" 2>/dev/null \
    || git -C "$dest" checkout -q --detach "origin/$ref" \
    || { echo "    ref '$ref' not found in $url" >&2; return 1; }
  # A local-path source (e.g. the job's wrapper clone at /w) must never become the push
  # target: origin is always GitHub so public-root.sh pushes to master, not to /w.
  if [ -d "$url" ]; then git -C "$dest" remote set-url origin "$GITHUB_REPO_URL"; fi
}

# resolve_source <source> <ref> <dest>
#   <source> is one of:
#     a git URL (https://…, git@…, or a local path to a repo)
#     /path/to/file.bundle
#     /dir/containing/bundles      (e.g. an `hf jobs run -v hf://datasets/…:/mirror:ro` mount)
#     hf://datasets/<org>/<name>   (downloaded with the hf CLI; needs HF_TOKEN for a private dataset)
# On failure of a git URL, FALLBACK_SOURCE (default: the private HF mirror) is tried once.
resolve_source() {
  local src="$1" ref="$2" dest="$3"
  rm -rf "$dest"
  case "$src" in
    *.bundle)
      clone_from_bundle "$src" "$dest" "$ref" ;;
    hf://datasets/*)
      need_cmd hf
      local ds="${src#hf://datasets/}" mdir
      mdir="$(mktemp -d "${TMPDIR:-/tmp}/coai-mirror.XXXXXX")"
      echo "    source: HF dataset $ds → $mdir"
      hf download "$ds" --repo-type dataset --local-dir "$mdir" --include '*.bundle' >/dev/null \
        || die "hf download of $ds failed (private dataset needs HF_TOKEN with read on org csoai)"
      clone_from_bundle "$(newest_bundle_in "$mdir")" "$dest" "$ref" ;;
    *)
      if [ -d "$src" ] && [ -n "$(newest_bundle_in "$src")" ] && [ ! -e "$src/.git" ]; then
        clone_from_bundle "$(newest_bundle_in "$src")" "$dest" "$ref"
      elif clone_from_url "$src" "$dest" "$ref"; then
        :
      else
        echo "    git clone from $src failed" >&2
        [ -n "$FALLBACK_SOURCE" ] || die "no FALLBACK_SOURCE configured"
        echo "    falling back to $FALLBACK_SOURCE"
        rm -rf "$dest"
        FALLBACK_SOURCE="" resolve_source "$FALLBACK_SOURCE" "$ref" "$dest"
      fi ;;
  esac
  echo "    checked out $(git -C "$dest" rev-parse HEAD) ($(git -C "$dest" log -1 --format=%s | cut -c1-72))"
}
