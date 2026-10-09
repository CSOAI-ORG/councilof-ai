# Council OS dashboard release handoff — 24 September 2026

## State

Reviewed source is committed on `codex/evidence-index-scope-20260924` at
`2b9e08f7566836e92077ca9ebe08dd11c1abb575` in
`/Users/nicholas/clawd/wt-codex-evidence-index-scope-20260924`.
Base: `ce6b053f756df81ebf84ae7f9b029b87d5a35bd6` (`origin/master`).
The worktree is clean. This dashboard patch is **not deployed**.

Transfer bundle: `/Users/nicholas/clawd/_alignment/CSOAI_DASHBOARD_UX_20260924.bundle`.
SHA-256: `f99e586805efce0136a526a06937113a97f8734d44e08bee16ab8ab4bc4e64b6`.
`git bundle verify` passed. Fetch it into a review branch; do not reset production to its tip.

## Reviewed changes

- Reorganized the dashboard into a searchable sidebar with 29 grouped destinations and an All Tools shortcut; City has its own dashboard tab. Existing live City and GSPC Quests views were independently opened and exercised inside the dashboard before the source change. The City static page now hides duplicate site chrome only in embed mode; local browser readback confirmed embed and standalone views.
- Clarified that board-axis evidence is not a measurement of a user-entered subject. Board, Matrix, Archive, SWIFT, XRPL and x402 cards distinguish indexed, measured, signed, witnessed and dated-source states.
- Pinned signed-card verification to the reviewed public key. A published card checked `VALID`; a tampered body and substituted signer checked `INVALID`.
- Made Watchdog a native, read-only evidence pane and made Learning disclose that its dated 22-path content is not coverage of every current board axis.
- Removed unsupported compliance-game outcomes. The Article 50 practice exercise remains a role exercise, while withdrawn game URLs retain explicit notices. City is a dated observatory, not a live multiplayer game.
- Scoped the Attestations opening to served root bytes and dated witness sidecar; its live signature and byte-match checks do not imply every catalogue root is signed.
- Distinguished legacy content-ID timestamping `ERR` from the dated public-root OpenTimestamps witness shown in Standards Lab. That sidecar reports `CONFIRMED_BITCOIN` for `PUBLIC_ROOT_BYTES_ONLY`, `as_of 2026-09-23T05:23:04Z`; the pane does not transfer that state to every card.
- Removed obsolete `public/pay.html`, which conflicted with the current `/pay/` buyer route, and regenerated guarded redirects.
- Fixed the XRPL instruments chat cue, which had literal backslashes instead of word boundaries and could not route a normal request.

## Verification

- Node tests: 7/7 passing (`learning-coverage`, `sitemap-withdrawal`). Redirect guard passes: 657 static and 14 dynamic rules. `git diff --check` passes.
- Changed TypeScript files passed TS7 syntax parsing. The exact published-card verifier and tampered-card negative path ran locally. The XRPL chat cue matched a normal request and rejected an unrelated one. Article 50 exercise completed 4/4 in a local browser. Existing public City and GSPC Quests opened inside the live dashboard.
- Full client build, full typecheck and Playwright suite were **not run** in this sparse worktree because dependencies are absent and the host has under 0.5 GiB free. Those are release gates, not waived checks.

## Release boundary

The existing M4-owned RunPod-to-Cloudflare guarded publisher is stopped. The existing pod `fpowppss5ngtkw` was reported `EXITED / stopped_by_runpod` after the 19:06 UTC release attempt; the last completed public release remains #3. Release #4 has build gates but no deployment receipt. See `/Users/nicholas/clawd/_alignment/CODEX_RELEASE3_4_HOLD_20260924.md`.

The local base is older than served evidence. A whole-tree Cloudflare upload from this worktree would replace or remove the current card-root pointer, Sep 24 correction notice, newer OTS manifest and sitemap. **Do not deploy this checkout directly.** On restoration of the existing pod, inspect its interrupted log and lock, apply the reviewed dashboard hunks onto the current RunPod bare master, run `/workspace/lanes/loops/build-gates.sh` for that exact ref, then use `/workspace/lanes/loops/deploy-prod.sh` under `/workspace/ci/deploy.lock`. Do not start/resize the pod from this lane.

After deployment, anonymously check apex and alias for the new sidebar, direct City tab, Watchdog, Standards witness scoping, signed-card verifier, `/pay/`, Article 50 correction, City and Quests inside dashboard, and the unchanged current card-root pointer, correction notice, OTS manifest and sitemap. A successful build or deploy command without served readback is not completion.
