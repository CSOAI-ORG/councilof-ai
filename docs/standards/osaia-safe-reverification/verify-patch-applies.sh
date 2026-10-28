#!/usr/bin/env bash
# verify-patch-applies.sh — prove that SAFE-v1.0-port.patch is bound to the APPROVED
# specification, and that it is bound to nothing else.
#
# WHAT THIS IS. A claim that a patch "applies to the approved SAFE.md" is a claim about
# bytes. This script turns it into something a stranger can run: it fetches the upstream
# file at a pinned commit, checks the digest against a pinned value, and then runs
# `git apply --check`.
#
# THE NEGATIVE CONTROLS — two of them, and both must be able to fail.
#
#   1. THE SUPERSEDED DRAFT. The same patch, applied to the bytes of the superseded
#      `rfc-safe-proposal.md` at the same commit, must be REJECTED. The draft's bytes are
#      placed UNDER THE PATCH'S OWN TARGET FILE NAME, and that detail is the whole
#      control: `git apply` resolves its file from the patch header, so running the check
#      in a directory that still holds the approved `SAFE.md` re-tests the approved file
#      and proves nothing at all. The first version of this script made exactly that
#      mistake — its control was vacuous, and the failure it produced was a finding
#      about the control, not about the patch. The correction is dated in
#      SAFE-v1.0-PORT-20261026.md.
#
#   2. A MUTATED ANCHOR. One context line of the approved file is changed, and the patch
#      must then be REJECTED. This is the sensitivity control: it shows the check reads
#      the bytes at the anchor and not merely the presence of a file with the right name.
#
# MEASUREMENT, NEVER CERTIFICATION. A passing run says the patch applies to these bytes.
# It does not say the Alliance accepts the patch, and it is not a review outcome.
#
# Usage:  bash verify-patch-applies.sh
# Requires: curl, git, shasum (macOS/Linux), awk. No network credentials.

set -euo pipefail

REPO="OpenSecureAIAlliance/wg-safe"
COMMIT="ba76bac74c251926cb3d14bc363e0443b5959007"   # "Add SAFE.md", 2026-10-22T02:04:22Z
BLOB="327805a8178a003a3d5112b612262ffab90627f2"     # git blob sha of SAFE.md at COMMIT
SHA256="4b7c6e69e849d46f5aa990f50db45952f9262d70dd27397ee1315c77c4776c16"
BYTES="20094"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCH="$HERE/SAFE-v1.0-port.patch"
RAW="https://raw.githubusercontent.com/${REPO}/${COMMIT}/SAFE.md"

fail() { echo "FAIL: $*" >&2; exit 1; }

# Commit a file into a throwaway repository. `core.hooksPath=/dev/null` keeps any
# hook configured on the operator's machine out of a check that must be portable.
seed() {  # seed <dir> 
  git -C "$1" init -q .
  git -C "$1" -c core.hooksPath=/dev/null add "$2"
  git -C "$1" -c user.email=verify@localhost -c user.name=verify \
      -c core.hooksPath=/dev/null commit -qm "seed $2"
}

echo "== pin =="
echo "  repo   : ${REPO}"
echo "  commit : ${COMMIT}"
echo "  blob   : ${BLOB}"
echo "  sha256 : ${SHA256} (${BYTES} bytes)"

[ -f "$PATCH" ] || fail "patch not found at ${PATCH}"

# The patch names the file it edits; every control below is performed against that name.
TARGET="$(grep -m1 '^+++ ' "$PATCH" | sed 's|^+++ b/||')"
[ -n "$TARGET" ] || fail "could not read the patch's target file name from ${PATCH}"
echo "  target : ${TARGET} (named by the patch itself)"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "== fetch =="
curl -fsSL "$RAW" -o "$WORK/${TARGET}" || fail "could not fetch ${RAW}"

got_sha="$(shasum -a 256 "$WORK/${TARGET}" | awk '{print $1}')"
got_bytes="$(wc -c < "$WORK/${TARGET}" | tr -d ' ')"
[ "$got_sha" = "$SHA256" ] || fail "upstream sha256 ${got_sha} != pinned ${SHA256}"
[ "$got_bytes" = "$BYTES" ] || fail "upstream bytes ${got_bytes} != pinned ${BYTES}"
echo "  upstream file matches the pin"

echo "== apply check against the APPROVED specification =="
seed "$WORK" "${TARGET}"
if git -C "$WORK" apply --check "$PATCH"; then
  echo "  PASS: the patch applies cleanly to ${TARGET} at ${COMMIT}"
else
  fail "the patch does NOT apply to the approved ${TARGET} at ${COMMIT}"
fi

echo "== negative control 1: the same patch must NOT apply to the superseded draft =="
# The superseded draft is a different document: it has none of the patch's anchors
# (no "## Review Framework", no control-layer table, no "## The Compact"). Its bytes are
# placed under the patch's own target name, because `git apply` resolves the file from the
# patch header — running the check beside the approved file would re-test the approved
# file and pass for the wrong reason.
curl -fsSL "https://raw.githubusercontent.com/${REPO}/${COMMIT}/rfc-safe-proposal.md" \
  -o "$WORK/rfc-safe-proposal.md" || fail "could not fetch the superseded rfc-safe-proposal.md"

mkdir -p "$WORK/control"
cp "$WORK/rfc-safe-proposal.md" "$WORK/control/${TARGET}"
seed "$WORK/control" "${TARGET}"
if git -C "$WORK/control" apply --check "$PATCH" 2>/dev/null; then
  fail "the patch also applies to the SUPERSEDED rfc-safe-proposal.md — it is not bound to the approved file"
fi
echo "  PASS: the patch is rejected against the superseded draft (the control can fail)"

echo "== negative control 2: the patch must NOT apply to the approved file with one anchor changed =="
# Sensitivity control. One context line of the approved file is altered; the check must
# notice. If it does not, the check is reading the file's name rather than its bytes.
ANCHOR="$(grep '^ ' "$PATCH" | tail -1 | sed 's/^ //')"
[ -n "$ANCHOR" ] || fail "could not read a context line from the patch"
mkdir -p "$WORK/mutant"
awk -v a="$ANCHOR" '{ if (!done && $0 == a) { print a " (MUTATED)"; done=1; next } print }' \
    "$WORK/${TARGET}" > "$WORK/mutant/${TARGET}"
if cmp -s "$WORK/${TARGET}" "$WORK/mutant/${TARGET}"; then
  fail "the mutation control could not be constructed (anchor not found as a whole line) — the control would be vacuous"
fi
seed "$WORK/mutant" "${TARGET}"
if git -C "$WORK/mutant" apply --check "$PATCH" 2>/dev/null; then
  fail "the patch still applies after one anchor line was changed — the check is not reading the bytes"
fi
echo "  PASS: the patch is rejected once one anchor line differs (the check reads the bytes)"

echo
echo "RESULT: PASS — the patch is bound to the approved specification at the pinned commit,"
echo "and rejected against the superseded draft and against a mutated anchor."
echo "This is a byte-level applicability check. It is not adoption, review or acceptance."
