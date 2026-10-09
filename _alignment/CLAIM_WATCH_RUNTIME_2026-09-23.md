# Claim-watch runtime receipt — 23 September 2026

## Outcome and limits

**Current installed state:** the existing RunPod weekly Claim Maintenance job discovers all **three active registries and 94 claims** (62 + eight Chainlink/Ondo + 24 OSAIA). Two full RunPod runs exited 0 and named all three registries in their receipts. The eight legacy Chainlink/Ondo claims also compare with the prior successful read of the **same claim, URL, content scope and extractor** when one exists. The current wrapper is `/workspace/lanes/loops/claim-watch-measure.sh`, SHA-256 `31a2ce28ba991a1a56e4de5caf1b4c367674346b5682180b719eaa72a42f60dc`; it loads the versioned schema-discovery release under an exact source-hash guard. The scheduler, signed registries, site and public register were not edited. The public register still correctly says `UNSCHEDULED` for Chainlink and Ondo because their signed registry has no per-claim `next_read_utc`. Source-code integration into the pod's master branch remains outstanding.

## First phase: prior-read continuity (historical installation)

- Pod SSH target: `rp-3090-now`; pod Git master at the first installation was `6c56d65d3221451692149196069a4e2ab46b1b47`.
- Isolated tested source commit: `38297628e2671d0d4926ebe67dc5ab2e4e50f445` on `codex/claim-watch-previous-read-20260923`. The focused tests reported 28 passed. GitHub PR [#2674](https://github.com/CSOAI-ORG/councilof-ai/pull/2674) was **closed**, because GitHub master has diverged and the PR showed about 289,000 added lines; it must not be merged as presented.
- Installation receipt: `/workspace/lanes/releases/claim-watch-prior-read-20260923/INSTALL.json`, installed `2026-09-23T06:27:26.677412+00:00`.
- Wrapper **after phase one and before the current OSAIA repair**: SHA-256 `6688e5e8007d9cea689f812f303b8c124f5fe08de41d301cecc976aacddeda96`. Original backup: `/workspace/lanes/loops/claim-watch-measure.sh.bak-20260923-prior-read`, SHA-256 `b13b6387b3099cc224d0c1ade5338456f1a57d9e411d544824f19fe4ea6add31`.
- Phase-one patched runner, now superseded by the schema-discovery release: `/workspace/lanes/releases/claim-watch-prior-read-20260923/watch_run.py`, SHA-256 `e505455fa1529c6aab7888aee15ede20a600f5800573ef81af5c74edd8af56ec`. The current wrapper still requires the fetched master runner hash to be exactly `df04a84cf406f02ea204d6432241dfdf5b16230653323d50da41295133867393`. A mismatch aborts the job, so future source drift is visible instead of silently overwritten.
- Scheduler entry: `/workspace/lanes/loops/scheduler.sh` lines 103–104, Monday 09:20 UTC. The scheduler was not edited. Manual runs used `bash /workspace/lanes/loops/claim-watch-measure.sh --now` and did not consume the scheduler's weekly stamp.

## Real readback

Two phase-one manual runs through the earlier RunPod wrapper both exited 0:

| Run | Time UTC | Chainlink/Ondo old-registry result | SHA-256 |
| --- | --- | --- | --- |
| `20260923T062735Z` | 06:29:14 | Seven HTTP 200 first comparable baselines; CL-3 HTTP 402 | `3e6cad963f60569d0296e2c905b7e482864161ffa76d3f0edd3877402e13c0c9` |
| `20260923T062938Z` | 06:32:17 | Seven HTTP 200 matched prior successful same-URL/same-extractor reads, `changed=false`; CL-3 HTTP 402, `SEARCH_INCONCLUSIVE`, `changed=null` | `ea1ca2f4884977a1a523530d0a9cfc1acda08425e61cfd7b2231e5dde4234166` |

The phase-one second receipt is `/workspace/lanes/out/claim-watch/run-20260923T062938Z/receipt.json`; the old-registry readback is `/workspace/lanes/out/claim-watch/run-20260923T062938Z/reread-claimreg-ondo-chainlink-2026-09-22-rev2.json`. That historical receipt recorded 70 claims read across two registries (62 current plus eight legacy) and 12 review prompts. Nine current-registry source digests changed, CL-5 exceeded its own heartbeat in some intervals, EC-1 reached its date, and CL-3's source returned HTTP 402. These are review prompts, not findings about a subject. No external notices were sent.

## Readback and original-wrapper rollback

Read back status without changing anything:

```sh
ssh rp-3090-now 'cat /workspace/lanes/releases/claim-watch-schema-discovery-20260923/INSTALL.json; cat /workspace/lanes/out/claim-watch/latest-receipt.json'
```

To remove **both** runtime overlays and restore the original wrapper, restore the byte-identical phase-one backup atomically, then check syntax and hash. No scheduler restart or registry rewrite is needed:

```sh
ssh rp-3090-now 'cp /workspace/lanes/loops/claim-watch-measure.sh.bak-20260923-prior-read /workspace/lanes/loops/claim-watch-measure.sh.rollback-tmp && mv /workspace/lanes/loops/claim-watch-measure.sh.rollback-tmp /workspace/lanes/loops/claim-watch-measure.sh && bash -n /workspace/lanes/loops/claim-watch-measure.sh && sha256sum /workspace/lanes/loops/claim-watch-measure.sh'
```

Expected restored hash: `b13b6387b3099cc224d0c1ade5338456f1a57d9e411d544824f19fe4ea6add31`.

The next durable step is to reconcile the source patch with the diverged source masters, run the same tests, and remove the runtime overlay after a verified source deployment. Do not mark the eight public claims as scheduled until their signed registry explicitly carries next-read dates or the public register accurately represents the verified scheduler separately.

## Same-day OSAIA discovery repair — added 06:55 UTC

The public register at `https://councilof.ai/api/claims/register` reports `as_of: 2026-09-23T06:07:15Z`, **47 subjects, 94 claims, three active registries, 45 subjects with a scheduled next read**. The prior watcher read only 70 claims because both `head_registry()` and `live_registries()` filtered for filenames beginning `claimreg-`. The third signed registry is named `osaia-membership-2026-09-23.json` and contains 24 claims with 24 source URLs. Its public bytes and the pod's master copy match SHA-256 `cdc6921aab318d0295df43759b29d9d5d1a3013f96a5476a374891b0c489c0ac`; the served sidecar pins that same artifact digest. This is a registry-discovery defect, not an absence of OSAIA claims.

The source patch discovers JSON documents declaring `csoai.claim-registry/*` and a registry ID, then applies the existing supersession rule. It excludes signed envelopes and unrelated JSON. Tests include a non-`claimreg-` registry, a sidecar decoy, and a superseded revision: **29 passed**. Isolated local source commit: `08a41ef47` on `codex/claim-watch-schema-discovery-20260923`; no PR, merge, registry edit or external notice.

The existing RunPod wrapper was updated atomically to use `/workspace/lanes/releases/claim-watch-schema-discovery-20260923/watch_run.py` (SHA-256 `d4af92d1b53dbda31f9b064545694b0fbd5093fe8bcf2b47efe51419b14daa79`) under the unchanged pod-master source hash guard `df04a84cf406f02ea204d6432241dfdf5b16230653323d50da41295133867393`. The new wrapper SHA-256 is `31a2ce28ba991a1a56e4de5caf1b4c367674346b5682180b719eaa72a42f60dc`. Exact prior-wrapper backup: `/workspace/lanes/loops/claim-watch-measure.sh.bak-20260923-schema-discovery`, SHA-256 `6688e5e8007d9cea689f812f303b8c124f5fe08de41d301cecc976aacddeda96`. Installation record: `/workspace/lanes/releases/claim-watch-schema-discovery-20260923/INSTALL.json`. Scheduler and signed registries remain untouched.

Two real `bash /workspace/lanes/loops/claim-watch-measure.sh --now` passes exited 0. The first, run `20260923T064839Z` at `06:51:40Z`, used pod master `fe03651fe`; the second, run `20260923T065155Z` at `06:54:42Z`, used newer master `c51c79165`, whose watcher base hash still matched the guard. Both receipts list the same three active registries and re-read **62 + 8 + 24 = 94** claims. The second receipt is `/workspace/lanes/out/claim-watch/latest-receipt.json`; its OSAIA readback is `/workspace/lanes/out/claim-watch/run-20260923T065155Z/reread-osaia-membership-2026-09-23.json`, SHA-256 `f706a51f8a3c892390099d601fdd0ff79ce1307ca6bacc2819cddbd1ea24b662`. The first OSAIA readback SHA-256 was `ef5963520b9c847ce016a0b51f4385ceb12d0c4978e3fa3ba994d5805a6e25a7`.

| Claim | Source and compared content | Recorded digest | First run | Second run | State |
| --- | --- | --- | --- | --- | --- |
| `OSAIA-20` | [Veeam blog](https://www.veeam.com/blog/veeam-open-secure-ai-alliance.html), extracted visible text | `289c3c5ef6afb1921e5df20ca02c8cbeb9f2af692f26ddbfc467ac1c61fa980c` | HTTP 200; `4e324d3424c7c38516a58a2a988f00c17c1d465e76709e9ef6ee4699cd5013fb` | HTTP 200; same digest | Recorded-vs-returned digest differs; cause unestablished. |
| `OSAIA-SELF` | [CSOAI alliance map](https://councilof.ai/alliance-map), raw response bytes | `22eb85739cd07df321d40a1843d8e931831215764283fc85c2402152707ea322` | HTTP 200; `73cc68e25176177cfea4e2013de6a6ead1a2d585d30eda2d8a6d5ca333d1509d` | HTTP 200; `c684a0a8ec01bc687bec888fe70d9f69e68b17aee48381dc24c21fe10a9ff457` | Returned bytes vary between runs; do not infer a stable source change. |
| `OSAIA-16` | [Netskope release](https://investors.netskope.com/news-releases/news-release-details/netskope-announces-strong-second-quarter-fiscal-2027-financial), extracted visible text | `b9c9d257a539964fcc53fb678765f6985ea5955284ea49789a41b721d4958a7a` | Transport failure; HTTP null; digest null | Same | `SEARCH_INCONCLUSIVE`; no absence or change inferred. |

Those are **review prompts only**, not findings about membership, alliance participation, or any organisation. The remaining 21 OSAIA claims did not trigger a digest or reachability review prompt in either run. No notification was sent to subjects.

The existing scheduler process (PID `2496566` at 06:56 UTC) is running `/workspace/lanes/loops/scheduler.sh`. Its lines 103–104 call the **same guarded** `/workspace/lanes/loops/claim-watch-measure.sh --now` on Mondays at or after **09:20 UTC** if that day's stamp is not yet set; the next eligible Monday is **28 September 2026, 09:20 UTC**. The independently scheduled OSAIA map job at 09:40 UTC is separate; this receipt concerns the general claim watcher. The installed wrapper hash and rollback hash were read back again at 06:56 UTC and match the installation record.

`OSAIA-SELF` has a specific hash-stability defect for review. Three immediate anonymous fetches of `https://councilof.ai/alliance-map` from the pod followed the redirect to `/alliance-map/`, all returned HTTP 200 and **353,816 bytes**, but had three different raw SHA-256 digests (`df1cc7b3e32b0ab9d08d50d6f31cb4a97e1219ff0f913967853a5ea6ab29eda0`, `efc1fa5fbc4993dba05a7ac20f5e1bb16e3ae3d4aa54895c82ccedce059d6f0a`, `05827b4e1aed5a9b4fe15f933fb3153ad425f3553ea297a47723900188d1f4d`). The **visible-text digest stayed identical** in all three: `0c0a27aa3078eb805cde7ffb5c4ee38a46a406de38231ba278291733b466dcd8`. A byte comparison of two more responses located the first difference in Cloudflare's `data-cfemail` email-obfuscation attribute; 92 byte positions varied. This establishes that raw response bytes are a poor stable comparator for that page under the present serving configuration. It does **not** invalidate or silently replace the signed recorded digest. A future versioned registry revision should choose and document a stable content scope or normalization rule, then sign that new artifact separately. Until then, `OSAIA-SELF` remains a review prompt, not a source-change or membership conclusion.

To restore the immediately prior, 70-claim watcher wrapper without touching the scheduler or registries:

```sh
ssh rp-3090-now 'cp /workspace/lanes/loops/claim-watch-measure.sh.bak-20260923-schema-discovery /workspace/lanes/loops/claim-watch-measure.sh.rollback-tmp && mv /workspace/lanes/loops/claim-watch-measure.sh.rollback-tmp /workspace/lanes/loops/claim-watch-measure.sh && bash -n /workspace/lanes/loops/claim-watch-measure.sh && sha256sum /workspace/lanes/loops/claim-watch-measure.sh'
```

Expected restored SHA-256: `6688e5e8007d9cea689f812f303b8c124f5fe08de41d301cecc976aacddeda96`. This restores the earlier continuity overlay, which still omits OSAIA; the rollback is for a runtime regression only. Source integration must preserve the new schema-based discovery and repeat its tests before the temporary overlay can be retired.
