#!/bin/bash
# The two CONTENT gates, run before a push instead of 12 minutes into a deploy.
#
# WHY. On 2026-09-03 four consecutive deploys failed, every one on content, none
# on infrastructure:
#
#   08:12  brand-gate  "crown jewels" — an internal codename in a public grant page
#   08:21  facts-gate  present-tense OTS anchoring claim
#   08:30  facts-gate  same
#   08:40  facts-gate  anchor-count claims ("THE 4 ANCHORS")
#
# Each cost ~12 minutes of build to discover, and three lanes spent the morning
# negotiating silence over a queue that was never actually starved — a run
# completed every ~9 minutes throughout. The queue was fine. The feedback loop
# was the problem: these same two gates take ONE SECOND here.
#
#   brand-gate over public/   1s
#   facts-gate over public/   0s
#   facts-gate --selftest     0s
#
# Install as a pre-push hook:
#     ln -sf ../../scripts/pre-push-gates.sh .git/hooks/pre-push
# Bypass for a genuine emergency:
#     git push --no-verify
set -uo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || exit 1

# THE PRERENDER'S BROWSER LIVES OUTSIDE THE RECLAIMABLE CACHE.
#
# Playwright's default browser directory is ~/Library/Caches/ms-playwright, and a disk reclaim
# on this machine has deleted it THREE times in one morning — once mid-push, while this very
# gate was running. Every time, the gate reported "Chromium for Playwright is not installed",
# which reads like a missing dependency but is a reclaim having taken a regenerable cache that
# the gate genuinely needs. The browsers are therefore installed at a stable path, and the
# environment points Playwright at it.
#
# THIS SUITE SETS THE PATH ITSELF. The reasoning used to live only in .githooks/pre-push, so
# the suite only found the browser when it was invoked THROUGH that hook. MEASURED
# 2026-11-07: this desk's global hook (core.hooksPath is absolute, so it is a wrapper that
# delegates to THIS suite) did not export the path, and every push failed with "Chromium for
# Playwright is not installed" — on a machine where the browser was installed, at the stable
# path, all along. The suite is the thing that runs the check, so the suite is where the path
# belongs: the claim lives in the artefact and in the generator that uses it.
#
# An operator who sets PLAYWRIGHT_BROWSERS_PATH to something else keeps their choice.
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/csoai-logs/ms-playwright}"

fail=0
echo "pre-push: content gates (the ones that fail deploys) …"

# Keep the gate's own words. With its output discarded, a gate that CRASHED
# (ENOENT in a sparse worktree, 2026-09-05) was announced here as "wallet
# credential material is tracked" — a finding it never made. A crash and a
# finding are different verdicts; print what the gate actually said.
wallet_out=$(node scripts/wallet-credential-gate.mjs --selftest 2>&1 \
  && node scripts/wallet-credential-gate.mjs 2>&1) \
  || { echo "  ✖ wallet-credential-gate failed — its verdict:"; printf '%s\n' "$wallet_out" | tail -8 | sed 's/^/      /'; fail=1; }

# ADDED 2026-11-02. The RUNTIME FLOOR was declared (package.json engines.node >= 20.0.0) and
# enforced by nothing. A door-contract test was rewritten to use Set.prototype.intersection,
# which shipped in Node 22: green on this desk (Node 22), red in CI (Node 20) with
# "intersection is not a function". A green local run is not evidence when the desk and the gate
# are different programs. The gate reads each package's OWN engines.node, so raising a floor is
# growth and the rules above it go inert without anyone editing a list.
node_out=$(node scripts/node-engine-floor-gate.mjs --selftest 2>&1 \
  && node scripts/node-engine-floor-gate.mjs 2>&1) \
  || { echo "  ✖ node-engine-floor-gate — its verdict:"; printf '%s\n' "$node_out" | tail -8 | sed 's/^/      /'; fail=1; }

# ADDED 2026-11-06. The three never-exempt live surfaces quote the board's own sentence, and the
# producer that rewrites them (scripts/surface/rebind-board-cites.mjs) had NO TRIGGER — a script
# with no trigger is not a loop, it is a file. Measured 2026-11-06: those three cites published
# "34 axes · 23 measured" against a live 34 axes · 34 measured, and the gate was green throughout,
# because COUNT_RE reads only the slot count out of the middle form and MEASURED_RE does not
# match "M measured" at all.
#
# facts-gate's ruleLiveBoardSentence now CATCHES the stale cite at build time. This check is the
# other half: it says whether the committed cites are still what the producer would write, so the
# repair is one command and the drift cannot be committed.
#
# It compares against THIS COMMIT's own board (commitBoard computes it offline from
# functions/api/gspc.ts, no network), so it is not a live read and it does not depend on which
# deploy happens to be live.
#
# THREE STATES, kept apart:
#   exit 0  the cites ARE what the producer would write          -> pass
#   exit 1  a cite would change: it no longer quotes this board  -> BLOCK (a real finding)
#   exit 2  the check could not run                              -> report; NOT a finding
# An UNCHECKABLE check is an absence of evidence, and UNCHECKABLE IS NEVER FAIL.
node scripts/surface/rebind-board-cites.mjs --selftest >/dev/null 2>&1 \
  || { echo "  ✖ board cites: the producer's own selftest failed — the check is broken"; fail=1; }
cite_rc=0
cite_out=$(node scripts/surface/rebind-board-cites.mjs --check 2>&1) || cite_rc=$?
if [ "$cite_rc" -eq 1 ]; then
  echo "  ✖ board cites: a never-exempt live surface no longer quotes this commit's board — its verdict:"
  printf '%s\n' "$cite_out" | tail -8 | sed 's/^/      /'
  echo "      Fix: node scripts/surface/rebind-board-cites.mjs   (then commit the three files)"
  fail=1
elif [ "$cite_rc" -eq 2 ]; then
  echo "  · board cites: UNCHECKABLE — the check could not run. Not a finding, and not a reason to refuse the push:"
  printf '%s\n' "$cite_out" | tail -3 | sed 's/^/      /'
elif [ "$cite_rc" -ne 0 ]; then
  echo "  ✖ board cites: the check failed unexpectedly (exit $cite_rc) — its verdict:"
  printf '%s\n' "$cite_out" | tail -8 | sed 's/^/      /'; fail=1
fi

# Check COMMITTED derived evidence before the build can regenerate it. The mirror contract
# reads the two source artifacts directly; the OTS gate reads existing detached proof bytes.
# These are the same offline checks used by hosted CI/release, with no stamping or publication.
reviewed_out=$(PYTHONPATH=scripts/connectors python3 scripts/connectors/build_reviewed_stream.py --check 2>&1) \
  || { echo "  ✖ reviewed-stream: committed envelopes could not be qualified — its verdict:"; \
       printf '%s\n' "$reviewed_out" | tail -8 | sed 's/^/      /'; fail=1; }
manifest_out=$(python3 scripts/pod-loops/root_ots_manifest_gate.py --public-dir public 2>&1) \
  || { echo "  ✖ OTS manifest: committed proof inventory could not be qualified — its verdict:"; \
       printf '%s\n' "$manifest_out" | tail -8 | sed 's/^/      /'; fail=1; }

# The published-surface audit's RULES, offline. The audit itself is an OPERATOR tool —
# it touches the network — but its rules are code, and code can be checked without one.
#
# ADDED 2026-11-07. The canonical rule compared a page's canonical link with the url that
# was ASKED for, while urllib follows redirects and hands it the FINAL page's body. So
# /pricing/ — which answers 308 to /dashboard/?tab=measured&task=pricing-overview and
# carries the canonical /dashboard/, which is CORRECT — was reported as a MEDIUM
# "canonical points at a different path" against a page that is not defective. A checker
# that cries wolf on a correct page teaches its reader to ignore it. The same tool's
# Content-Security-Policy rule was a branch whose body was `pass`, so the machine surface
# (/api/gspc, /api/state, /api/cards answered with five security headers and NO policy at
# all) went unreported.
#
# This check is RED against the unfixed rules and green against the fixed ones. That is the
# whole point of it: a gate that has never gone red proves nothing about the tree it passed.
audit_rules_rc=0
audit_rules_out=$(python3 -m unittest discover -s scripts -p test_published_surface_audit.py 2>&1) || audit_rules_rc=$?
if [ "$audit_rules_rc" -ne 0 ]; then
  echo "  ✖ published-surface audit rules: the rules themselves are wrong (exit $audit_rules_rc) — their verdict:"
  printf '%s\n' "$audit_rules_out" | tail -12 | sed 's/^/      /'
  fail=1
fi

# The gate must be provably working before its verdict means anything — a gate
# that has never gone red proves nothing about the tree it just passed.
node scripts/facts-gate.mjs --selftest >/dev/null 2>&1 \
  || { echo "  ✖ facts-gate SELFTEST failed — the gate itself is broken"; fail=1; }

# CHANGED 2026-10-16 (Measure ruling on #3266). facts-gate used to read public/ against the
# LIVE board, so any PR that changes the board (e.g. 23 -> 33 axes) could never be pushed. It now
# runs exactly as pr-gates.yml does: the same build, the same prerender (which writes and binds
# prerender-board-reference.json), the same facts-gate and board-production-anchor invocations.
# Same scripts, not copies. Fails closed: no Chromium, a failed build/prerender, or an unreachable
# production /api/gspc (board-production-anchor has no fallback) all block the push.
# ADDED 2026-10-16. build:client + prerender:dashboard regenerate tracked files (route manifest,
# _redirects, sitemap, signed index, axis pages, ...). On exit, restore every tracked file that was
# clean before the hook ran and is modified now, so the push leaves the working tree as it was.
# A developer's own uncommitted edits are never touched. Gates are unchanged: they read the
# regenerated bytes first, and the restore runs only after every verdict (EXIT trap; exit code kept).
regen_dirty_before=$(git diff --name-only HEAD 2>/dev/null | sort)
restore_regen() {
  changed=$(git diff --name-only HEAD 2>/dev/null | sort | comm -23 - <(printf '%s\n' "$regen_dirty_before"))
  [ -n "$changed" ] && printf '%s\n' "$changed" | git checkout HEAD --pathspec-from-file=- 2>/dev/null
  return 0
}
trap restore_regen EXIT

board_ok=1
if ! node -e "require('playwright').chromium.launch().then(b=>b.close()).then(()=>process.exit(0),()=>process.exit(1))" >/dev/null 2>&1; then
  echo "  ✖ Chromium for Playwright is not installed at $PLAYWRIGHT_BROWSERS_PATH — prerender cannot run"; fail=1; board_ok=0
  echo "      install it there with:"; echo "        PLAYWRIGHT_BROWSERS_PATH=$PLAYWRIGHT_BROWSERS_PATH node node_modules/playwright/cli.js install chromium"
fi
if [ "$board_ok" -eq 1 ]; then
  build_out=$(npm run build:client 2>&1) \
    || { echo "  ✖ npm run build:client failed:"; printf '%s\n' "$build_out" | tail -12 | sed 's/^/      /'; fail=1; board_ok=0; }
fi
if [ "$board_ok" -eq 1 ]; then
  pre_out=$(npm run prerender:dashboard 2>&1) \
    || { echo "  ✖ npm run prerender:dashboard failed:"; printf '%s\n' "$pre_out" | tail -12 | sed 's/^/      /'; fail=1; board_ok=0; }
fi
if [ "$board_ok" -eq 1 ]; then
  facts_out=$(node scripts/facts-gate.mjs dist/client --board-reference prerender-board-reference.json 2>&1) \
    || { echo "  ✖ facts-gate: a claim in dist/client contradicts facts.json / this commit's board"; \
         printf '%s\n' "$facts_out" | grep -E "FILE|TEXT|WHY|✗|FAIL" | head -12 | sed 's/^/      /'; fail=1; }
  anchor_out=$(node scripts/board-production-anchor.mjs --selftest 2>&1 \
    && node scripts/board-production-anchor.mjs dist/client --board-reference prerender-board-reference.json 2>&1) \
    || { echo "  ✖ board-production-anchor — its verdict:"; printf '%s\n' "$anchor_out" | tail -12 | sed 's/^/      /'; fail=1; }
  # ADDED 2026-11-07. The published interop index is a machine-readable promise to every reader:
  # "sha256 is the digest of the file's bytes as published ... a match means you hold what the
  # estate published". Measured 2026-11-07: the index labelled all 1,904 retired .invalid paths
  # "hf-mirror — served by a 302 redirect ... the path is real and fetchable", and NONE of them
  # is 302'd: the estate's own Function (functions/interop/[[path]].ts) intercepts every .invalid
  # path and serves it from the retired-bytes archive, or 404s by design. 1,898 of them 404'd.
  # The producer now models that state, and this check proves the COMMITTED index is what the
  # producer would write — so the promise cannot drift without a push naming it.
  # It runs after the build, because the digests of pages-served HTML are over the BUILT file
  # (the build injects a launcher script, so the tree's bytes are not what a reader fetches).
  python3 scripts/build-interop-file-index.py --selftest >/dev/null 2>&1 \
    || { echo "  ✖ interop index: the producer's own selftest failed — the check is broken"; fail=1; }
  index_rc=0
  index_out=$(python3 scripts/build-interop-file-index.py public/interop public/interop/file-index.json \
    scripts/deploy-exclusions.json --served-root dist/client --check 2>&1) || index_rc=$?
  if [ "$index_rc" -eq 1 ]; then
    echo "  ✖ interop index: the published index is STALE — it no longer describes this tree — its verdict:"
    printf '%s\n' "$index_out" | tail -6 | sed 's/^/      /'; fail=1
  elif [ "$index_rc" -eq 2 ]; then
    echo "  · interop index: UNCHECKABLE — the check could not run. Not a finding, and not a reason to refuse the push:"
    printf '%s\n' "$index_out" | tail -4 | sed 's/^/      /'
  elif [ "$index_rc" -ne 0 ]; then
    echo "  ✖ interop index: the check failed unexpectedly (exit $index_rc) — its verdict:"
    printf '%s\n' "$index_out" | tail -6 | sed 's/^/      /'; fail=1
  fi
fi

# ADDED 2026-09-26. Private canaries (harness/instrument-guard) must never reach a public
# surface; the repo is public too, so the source dirs are scanned, not just public/.
# Exit 2 (no commitments record) blocks as well: an unread list is not a clean scan.
canary_out=$(node scripts/canary-leak-gate.mjs --selftest 2>&1 \
  && node scripts/canary-leak-gate.mjs public docs harness measurement 2>&1) \
  || { echo "  ✖ canary-leak-gate — its verdict:"; printf '%s\n' "$canary_out" | tail -8 | sed 's/^/      /'; fail=1; }

node scripts/brand-gate.mjs public >/dev/null 2>&1 \
  || { echo "  ✖ brand-gate: a forbidden display string is in public/"; \
       node scripts/brand-gate.mjs public 2>&1 | tail -8; fail=1; }

# ADDED 2026-11-06. The link gate reads a link in a MACHINE surface — it walks
# .json files only — so an href in an HTML page is invisible to it. The
# homepage's nine dead axis links survived every green build that way. This
# gate reads the axis route map and checks every axis link in every published
# page. It is fast (no network, no build) and its selftest reproduces the
# historical defect before its verdict is trusted.
axis_route_out=$(node scripts/surface/axis-route-gate.mjs --selftest 2>&1 \
  && node scripts/surface/axis-route-gate.mjs public 2>&1) \
  || { echo "  ✖ axis-route-gate — its verdict:"; printf '%s\n' "$axis_route_out" | tail -10 | sed 's/^/      /'; fail=1; }

# ADDED 2026-09-05. price-gate joined the deploy as a blocking step and immediately
# stopped one: 60 published_price findings, every one of them a NUMBER in a public
# JSON file (.well-known/*, interop/x402-*), none in HTML. That is the machine
# surface an agent reads without a human ever seeing the page, which is why the
# doctrine treats it as the worse place to print a price, not the safer one.
# --json-only is the half that needs no dist, so it runs here in a second.
node scripts/price-gate.mjs --selftest >/dev/null 2>&1 \
  || { echo "  ✖ price-gate SELFTEST failed — the gate itself is broken"; fail=1; }

node scripts/price-gate.mjs --json-only >/dev/null 2>&1 \
  || { echo "  ✖ price-gate: a published price is in public/ JSON (no public $ prices)"; \
       node scripts/price-gate.mjs --json-only 2>&1 | grep -E "^\s+\S+\.json:" | head -12; fail=1; }

# ADDED 2026-10-30. The SBOM's recorded generation commit must be REACHABLE from HEAD.
#
# WHY. scripts/gen_sbom.py --check proves the SBOM by reading its own recorded commit back:
#     git show <recorded>:package.json
# A branch that was REWRITTEN after its SBOM was minted pins a commit that is in NO ref. In CI
# (pr-gates checks out the PR's merge ref) that read exits 128 and the producer gate reports,
# without naming the cause, "sbom FAILED — SBOM held; previous output preserved". A census of
# every open PR on 2026-10-30 found 40 of 132 carrying such a pin, and 29 of them were
# MERGEABLE and blocked by nothing else. Each cost a full CI round trip to learn that a pin
# pointed at nothing.
#
# The check below is the same one CI performs, so a green push is a green CI on this axis —
# and the sbom-pin-gate adds the one property CI cannot see: a lane that fetched the branch
# BEFORE it was force-pushed still holds the orphaned commit as an object, so "can I read it?"
# is green locally while the merge ref CI checks out does not contain it. Object presence is
# not reachability.
#
# ADDED 2026-11-03. The local gate and CI disagreed about ONE fact, and the disagreement was
# costing the whole estate at once: a pinned generation commit that this store cannot read.
# CI runs scripts/sbom-pin-gate.mjs and accepts its exit 2 (UNPROVABLE) as non-blocking,
# because an unreadable pin is an ABSENCE OF EVIDENCE, not a finding about the SBOM. This
# gate ran `gen_sbom.py --check` FIRST and blocked on it, so a push was refused for a commit
# that a fresh clone simply does not have — while CI, the gate that actually decides the
# merge, called the same state fine. A gate that blocks where CI does not is not stricter, it
# is broken: it refuses work the estate has already accepted.
#
# THREE STATES, kept apart:
#   gen_sbom --check exit 0  the SBOM matches the tree          -> pass
#                       2    the SBOM does not match the tree     -> BLOCK (a real finding)
#                       3    the pinned history is unreadable     -> report it; not a finding
#   sbom-pin-gate        0    reachable                           -> pass
#                       1    orphaned                            -> BLOCK
#                       2    unprovable                          -> report it; not a finding
sbom_rc=0
sbom_out=$(python3 scripts/gen_sbom.py --check 2>&1) || sbom_rc=$?
if [ "$sbom_rc" -eq 2 ]; then
  echo "  ✖ sbom: the SBOM does not match the tree — its verdict:"
  printf '%s\n' "$sbom_out" | tail -14 | sed 's/^/      /'; fail=1
elif [ "$sbom_rc" -eq 3 ]; then
  echo "  · sbom: UNCHECKABLE — the pinned generation commit is not readable in this store."
  echo "      Not a finding about the SBOM, and not a reason to refuse the push. CI accepts it:"
  printf '%s\n' "$sbom_out" | tail -3 | sed 's/^/      /'
elif [ "$sbom_rc" -ne 0 ]; then
  echo "  ✖ sbom: the check could not run (exit $sbom_rc) — its verdict:"
  printf '%s\n' "$sbom_out" | tail -14 | sed 's/^/      /'; fail=1
fi
if ! node scripts/sbom-pin-gate.mjs --selftest >/dev/null 2>&1; then
  echo "  ✖ sbom: the pin gate's own selftest failed — the gate is broken"; fail=1
fi
pin_rc=0
pin_out=$(node scripts/sbom-pin-gate.mjs 2>&1) || pin_rc=$?
if [ "$pin_rc" -eq 2 ]; then
  echo "  · sbom: UNPROVABLE — the pinned commit cannot be checked here. Not a finding; CI accepts it:"
  printf '%s\n' "$pin_out" | tail -6 | sed 's/^/      /'
elif [ "$pin_rc" -ne 0 ]; then
  echo "  ✖ sbom: the SBOM does not pin a reachable commit — its verdict:"
  printf '%s\n' "$pin_out" | tail -14 | sed 's/^/      /'; fail=1
fi

# ADDED 2026-09-20. workflow_run couples follow-on workflows to deploy.yml by its
# `name:` STRING. A rename lane changed deploy.yml's name without touching the five
# followers — every one of them would have gone silent on merge with no red anywhere.
#
# CHANGED 2026-11-07. The check below used to be a literal `grep -qF` for deploy.yml's
# raw name. That is WRONG, and it was failing on the estate's own correct tree:
# workflow_run.workflows takes GLOB filters, not literals, so a producer name carrying a
# `+` must be escaped — the five followers correctly carry "Build \\+ deploy site (gated
# production branch)" and a literal grep for "Build + deploy site (gated production
# branch)" cannot find it. MEASURED: on master at 2026-11-07 this check failed for four
# of the five followers while the estate's own proper checker
# (scripts/workflow-trigger-coupling.mjs, which CI runs in deploy.yml and pr-gates.yml)
# reported "trigger-coupling OK: 5 literal workflow filters". So the local gate was
# blocking EVERY push from any desk that has it, over a rename that was done correctly.
#
# So the check now runs the SAME SCRIPT CI RUNS — the estate's own, not a copy of it —
# and its verdict is the authoritative one. Same scripts, not copies.
node scripts/workflow-trigger-coupling.mjs >/dev/null 2>&1 \
  || { echo "  ✖ trigger-coupling: the followers do not carry deploy.yml's name as a literal filter"; \
       echo "      A rename must be applied to all five followers (scripts/workflow-trigger-coupling.mjs says which)."; fail=1; }

# The dependency inventory is timestamped too. Check the same committed-byte predicate as CI,
# before a full hosted run discovers that regenerated bytes still carry the old detached proof.
stamp_base=$(git merge-base HEAD refs/remotes/origin/master 2>/dev/null || true)
if [ -n "$stamp_base" ]; then
  stamp_rc=0
  stamp_out=$(python3 scripts/stamped-bytes-gate.py --base "$stamp_base" 2>&1) || stamp_rc=$?
  if [ "$stamp_rc" -eq 2 ]; then
    echo "  · stamped-bytes: UNCHECKABLE locally; hosted stamped-bytes remains required"
    printf '%s\n' "$stamp_out" | tail -5 | sed 's/^/      /'
  elif [ "$stamp_rc" -ne 0 ]; then
    echo "  ✖ stamped-bytes — its verdict:"
    printf '%s\n' "$stamp_out" | tail -12 | sed 's/^/      /'; fail=1
  fi
else
  echo "  · stamped-bytes: UNCHECKABLE — no readable master merge base; hosted check remains required"
fi

if [ "$fail" -ne 0 ]; then
  echo
  echo "  Push blocked. These are the same gates that will fail the deploy in ~12"
  echo "  minutes; fixing them now costs seconds. Remember the claim usually lives"
  echo "  in TWO places — the artifact and the generator that emits it."
  echo "  Emergency bypass: git push --no-verify"
  exit 1
fi
echo "  ✓ wallet-credential-gate + node-engine-floor-gate + facts-gate + board-production-anchor + brand-gate + canary-leak-gate + price-gate + axis-route-gate + interop-file-index + reviewed-stream + OTS-manifest + trigger-coupling clean"
exit 0
