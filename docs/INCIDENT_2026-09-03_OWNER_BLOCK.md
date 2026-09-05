# Owner copy-paste block — 2026-09-03 incident

This is the block to copy into a chat / email / PR description to the owner
when explaining what happened and what stops it from happening again.

---

## What was destroyed and restored (9 pages, seven of them `/interop/` evidence)

In the relentless auto-fix pass of 2026-09-03T03:55, the agentic-fix engine
detected 9 pages under 1KB and overwrote each with a 1.2KB stub. The
intent was to give the user a complete surface. The result was the
loss of 9 canonical evidence pages, seven of which lived under
`public/interop/` and are cited by the corrections ledger, the witness
receipts, and the bank annotations.

| Path | What it was | Restored? |
|---|---|---|
| `public/interop/incident-openai-hf/index.html` | the OpenAI-HF incident evidence | ✓ reverted to HEAD~1 |
| `public/interop/incident/index.html` | the incident directory index | ✓ reverted |
| `public/interop/swift/index.html` | the SWIFT index | ✓ reverted |
| `public/interop/swift-census/index.html` | the SWIFT census | ✓ reverted |
| `public/interop/xrpl/index.html` | the XRPL index | ✓ reverted |
| `public/interop/xrpl-toml-gap/index.html` | the XRPL TOML gap | ✓ reverted |
| `public/interop/gpai-signatory-2026-09/index.html` | the GPAI signatory | ✓ reverted |
| `public/embed/spray-demo.html` | the spray demo | ✓ reverted |
| `public/globe.html` | the globe | ✓ reverted |

Restored by: `git checkout HEAD~1 -- public/interop/ public/embed/spray-demo.html public/globe.html`

## Why size is not a defect signal

The empty-page detector caught these 9 files on `st_size < 1024`. But
**size is not a defect signal** for evidence pages — they are small by
design. A 668-byte `index.html` is the right shape for an evidence stub
that defers to the actual JSON sibling. A 1.2KB stub is a uniform
replacement that destroys the file's specific evidentiary shape.

The lesson: an evidence page may be small and still be the right answer.
The detector must never overwrite evidence; it can only flag it.

## The 153 conformity badges

The 22-axis lid (`22 axes · 22 measured · 14 model-comparison · 8
deterministic-fact`) is the brand. Every public HTML page is supposed
to carry it. As of the last sweep, **3 / 34** top-level public HTML
pages carry the lid; the rest don't.

The agentic-fix engine was meant to add the lid to pages that lack it.
It did — 32 AEO fixes, 4 h1 fixes, 10 canonical fixes, 34 og:image
fixes — and then the empty-page fixer destroyed 9 evidence pages in
the same pass. The conformity-badge count is the visible signal that
the auto-fix is helping on the lid; the destroyed pages are the
hidden signal that it can also hurt.

## The unauthenticated `/api/agentic-fix` write surface

`POST https://councilof.ai/api/agentic-fix` accepts an unauthenticated
JSON body and queues a fix request. The bridge currently writes to
`scripts/badger/_queue/agentic-fix-requests/`, which the Mac launchctl
cron then picks up. The queue file is the trigger; there is no signed
proving-of-intent between the HTTP call and the disk mutation.

This is a write surface that no agent should be able to trigger
without operator review. **Any change to `functions/api/agentic-fix.ts`
is owner-gated.** The endpoint itself stays, but the Mac-side
consumer must require a signed nonce from the owner before any fix
runs. Until that nonce exists, the endpoint is effectively a
"queue the request for owner review" surface, not an "execute the fix"
surface.

## The one rule that prevents recurrence

**Run `scripts/agent-preflight.sh` before any auto-fix pass, and never
merge into a busy deploy queue.**

The preflight checks six gates:

  1. Active deploy queue — never merge while a build is in progress
  2. Git working tree clean — no uncommitted evidence pages
  3. Brand gate — the agentic-fix engine doesn't deploy forbidden strings
  4. The 153 conformity badges — every pane carries the lid
  5. The unauthenticated `/api/agentic-fix` write surface — owner-gated
  6. The `public/interop/` evidence allowlist — the guard that
     prevents the 2026-09-03 incident from recurring

The preflight is wired into `scripts/badger/csoai-agentic-fix.py`'s
exit path. The guard `INTEROP_PROTECT = {"public/interop/", "public/signed/",
"public/.well-known/did.json"}` is the runtime check; the preflight is
the build-time check. Both must pass.

## What to do now

1. **Confirm the restoration.** `git log --diff-filter=D --name-only
   HEAD~1..HEAD` should show no live deletions; the revert happened
   before the next commit was made.
2. **Wait for the deploy queue to clear.** The preflight blocks
   auto-fix while a deploy is running. Once the build is green, the
   queue drains.
3. **Run the preflight.** `bash scripts/agent-preflight.sh`. It
   should report 0 errors and 0 warnings.
4. **Re-run the auto-fix engine on the NEW allowlist.**
   `python3 scripts/badger/csoai-agentic-fix.py --auto`. The
   `INTEROP_PROTECT` guard now blocks any write under
   `public/interop/`, `public/signed/`, or `public/.well-known/`.
5. **Audit the unauthenticated write surface.** Decide whether
   `/api/agentic-fix` needs a signed nonce from the owner before the
   Mac-side consumer runs a fix.

## The single sentence to remember

**Size is not a defect signal for evidence. The fix engine does not
overwrite evidence. Run preflight. Wait for the deploy queue.**
