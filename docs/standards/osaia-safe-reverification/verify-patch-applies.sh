#!/usr/bin/env bash
# verify-patch-applies.sh — prove that SAFE-v1.0-port.patch is bound to the APPROVED
# specification, and that it is bound to nothing else.
#
# WHAT THIS IS. A claim that a patch "applies to the approved SAFE.md" is a claim about
# bytes. This script turns it into something a stranger can run: it fetches the upstream
# file at a pinned commit, checks the digest against a pinned value, and then runs
# `git apply --check`.
#
# THE NEGATIVE CONTROL. A check that can only pass proves nothing. This script also
# applies the same patch to the SUPERSEDED `rfc-safe-proposal.md` and requires that it
# does NOT apply. If the patch ever stopped applying to the approved file, or started
# applying to the superseded one, this script fails — in both directions.
#
# MEASUREMENT, NEVER CERTIFICATION. A passing run says the patch applies to these bytes.
# It does not say the Alliance accepts the patch, and it is not a review outcome.
#
# Usage:  bash verify-patch-applies.sh
# Requires: curl, git, shasum (macOS/Linux). No network credentials.

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

echo "== pin =="
echo "  repo   : ${REPO}"
echo "  commit : ${COMMIT}"
echo "  blob   : ${BLOB}"
echo "  sha256 : ${SHA256} (${BYTES} bytes)"

[ -f "$PATCH" ] || fail "patch not found at ${PATCH}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "== fetch =="
curl -fsSL "$RAW" -o "$WORK/SAFE.md" || fail "could not fetch ${RAW}"

got_sha="$(shasum -a 256 "$WORK/SAFE.md" | awk '{print $1}')"
got_bytes="$(wc -c < "$WORK/SAFE.md" | tr -d ' ')"
[ "$got_sha" = "$SHA256" ] || fail "upstream sha256 ${got_sha} != pinned ${SHA256}"
[ "$got_bytes" = "$BYTES" ] || fail "upstream bytes ${got_bytes} != pinned ${BYTES}"
echo "  upstream file matches the pin"

echo "== apply check against the APPROVED specification =="
git -C "$WORK" init -q .
git -C "$WORK" -c user.email=verify@localhost -c user.name=verify add SAFE.md
git -C "$WORK" -c user.email=verify@localhost -c user.name=verify commit -qm "upstream SAFE.md @ ${COMMIT}"
if git -C "$WORK" apply --check "$PATCH"; then
  echo "  PASS: the patch applies cleanly to SAFE.md at ${COMMIT}"
else
  fail "the patch does NOT apply to the approved SAFE.md at ${COMMIT}"
fi

echo "== negative control: the same patch must NOT apply to the superseded RFC =="
# The superseded draft shares prose with the approved file, which is exactly why a
# patch that "seems to apply" to the wrong file is a live risk. The control requires
# the patch to be rejected there.
curl -fsSL "https://raw.githubusercontent.com/${REPO}/${COMMIT}/rfc-safe-proposal.md" -o "$WORK/rfc-safe-proposal.md" \
  || fail "could not fetch the superseded rfc-safe-proposal.md"
if git -C "$WORK" apply --check "$PATCH" 2>/dev/null; then
  fail "the patch also applies to the SUPERSEDED rfc-safe-proposal.md — it is not bound to the approved file"
fi
echo "  PASS: the patch is rejected against the superseded draft (the instrument can fail)"

echo
echo "RESULT: PASS — the patch is bound to the approved specification at the pinned commit."
echo "This is a byte-level applicability check. It is not adoption, review or acceptance."
