# Council OS dashboard tool cards — review handoff, 25 September 2026

## State

Source-only, **not deployed**. The guarded production publisher's RunPod pod `fpowppss5ngtkw` was read back as `EXITED / stopped_by_runpod` after release #3. A source commit or a passing local check is not a served page.

Reviewed changes are committed at `05051e1fe2a71fafb5780935ecfad08426c80fad` on `codex/tool-ux-pod-snapshot-20260925`, based on the latest inspectable local pod snapshot `6112df273` (24 September 13:50 UTC). The focused patch is `CSOAI_DASHBOARD_TOOL_UX_20260925.patch`, SHA-256 `b370ec6eb2dc4fc86fa91b9dd815ce8451865ace6237e5827adea432248caf4c`.

## End-user finding and repair

The current public tool runner exposes 13 tools, but the friendly-label table still held five older MEOK names. All 13 therefore appeared under raw code identifiers. Live `board_totals` was called through the dashboard at 23:04:54 UTC on 24 September and completed; this verifies the free tool path, not the other 12. The live page also keeps the full 14,855-character machine reply behind an expand control.

The patch gives each of the 13 currently declared tools a readable name and a short **use / result / limit** explanation. It keeps the full endpoint description available, keeps the actual `tools/list` and JSON Schema as the runtime authority, and changes the summary card's wording from “current runtime” to “published build” for manifest-derived counts. Free and metered summary cards show readable names. It does not change the MCP endpoint, a measurement, payment, signature, or witness state.

## Checks and release gate

- Compared guidance keys against both MCP manifest files: **13/13 covered**.
- `git diff --check` and TypeScript syntax diagnostics: pass. Full typecheck, Vitest, client build, and browser test were **not run** on M4 because dependencies are absent and the disk has under 0.5 GiB free.
- Integrate the four-file patch onto the **current guarded publisher source**, then run its same-ref build gates and existing Cloudflare deploy lock. Do not deploy the older local snapshot or dashboard branch as a whole: newer public root, correction, OTS and sitemap files must remain intact.
- Anonymous served readback after release: `/dashboard?tab=tools&tool=board_totals` shows “Board totals” and the three guidance fields; all 13 tool names map; `board_totals` still completes; paid calls are challenged but no wallet is signed during smoke checks.

Related unreleased dashboard navigation/City/Play branch: `2b9e08f7566836e92077ca9ebe08dd11c1abb575` and its handoff `CSOAI_DASHBOARD_UX_RELEASE_HANDOFF_20260924.md`. Release both as focused changes onto the current source, with build and served readback.

## Live visitor readback of City and games

- `/dashboard/?tab=city` currently says “No tool is named city.” This is a missing dashboard route, not evidence that the City observatory is absent.
- The live Coliseum card in `/dashboard/?tab=play` opens All tools instead of its intended Council Space view. The reviewed branch corrects its in-dashboard route.
- GSPC Quests is interactive inside the dashboard: a visitor selected one answer and advanced to item two. This proves an in-browser exercise, not a signed GSPC measurement.
- `/world/observatory/?embed=1` opens inside a dashboard frame. Its “Check public source bytes” control returned `MATCH` for the dated 1,201-row source. Upstream event signatures were not independently verified by that readback; the page is a read-only observatory, not a live multiplayer city.
- `/city` and `/world/` lead to Council Space; `/games` returned 404. Do not promote these as separate working game doors.

The reviewed branch already includes a direct City tab, City and Coliseum gallery links, and embedded-view chrome changes. Port only those focused UI files onto the current publisher source; do not rebuild a competing City. Repeat these exact visitor checks on apex and the immutable deployment alias after release.

## Additional visitor-copy repair

Review commit `afaa34438` on `codex/evidence-index-scope-20260924` corrects two residual defects in the dashboard branch. Live `/assess` and `/assess/` both land on `/dashboard?tab=measured`, which commissions a card-v0 receipt from existing evidence and explicitly says it does not start a fresh measurement. The previous sidebar blurb and evidence/board calls to action promised a new scoped run. They now describe existing-card proof and availability. The Attestations “How to verify yourself” list no longer links to `/api/proof?sha=`, an empty-query URL that returned 400; a populated raw-proof link remains available after a hash lookup in the same pane. Focused diff check passed; TypeScript syntax had no TS1xxx errors. Full typecheck and browser release validation remain open.

## Fresh publisher state

Read-only `runpodctl 2.12.0-51ca7f0` check at 23:13 UTC on 24 September: pod `fpowppss5ngtkw` remained `desiredStatus=EXITED`, `runtimeStatus=stopped`, `runtimeStatusReason=stopped_by_runpod`, last change 19:08:01 UTC. The account balance reported `-0.0803373565`. No pod start, payment, or deploy was attempted. Release #3 remains the last evidenced completed release; release #4 has no deployment receipt.

## Consolidated release candidate

The focused tool, City/play, copy/link, master-navigation, Watchdog and Learning fixes have since been integrated into one isolated branch, `codex/tool-ux-pod-snapshot-20260925`, at commit `73fe6231bdbfb6fe5b48cf69dea4020f5a339875` (base `6112df273`). Export: `CSOAI_DASHBOARD_CONSOLIDATED_20260925.patch`, 60,487 bytes, SHA-256 `829334343e6905104ce7dc5b6532ecfc20fd77831ea91cc03ab080fb06a48ece`. It groups 29 existing working destinations by task, makes the sidebar searchable, starts All Tools with the full catalogue, and keeps City and Play inside the workspace. The home mode switcher also links to dated City records. Watchdog becomes a native read-only evidence pane, and Learning discloses its dated 22-path snapshot against the current board-axis count. No current root, correction, OTS, sitemap, API or payment file is changed. The prior snapshot already had truthful board/evidence copy, so the integration kept that newer wording and applied only the remaining sidebar label and dead-link repair.

Integrated checks passed: `git diff --check`, changed TypeScript/TSX syntax parse, 13/13 manifest-to-guidance coverage, City and Coliseum route assertions, absence of the empty-query proof link, and the 3/3 focused Learning coverage tests. The navigation test was updated for the 29 unique destination IDs and its stale Cards/State exclusion removed. The homepage OS tile now counts those 29 destinations rather than all catalogue tabs. The catalogue excludes `/watchdog-hub` because that legacy page redirects to the native Watchdog pane; a test protects against nesting another dashboard inside the embedded catalogue. Full Vitest, typecheck and build are still open until dependencies and disk space are available. This is still **source-only**. The separate broader dashboard branch includes further evidence-scope and verifier changes not present in this focused snapshot patch; port those by hunk review rather than replacing the current publisher tree.
