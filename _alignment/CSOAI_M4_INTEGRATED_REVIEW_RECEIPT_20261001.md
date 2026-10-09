# M4 integrated review receipt — 1 October 2026

## Candidate

- Canonical local mirror: `/workspace/staging/mirror/councilof-ai.git` on the build pod.
- Review branch: `review/codex-m4-integrated-20261001` at `ef2bf309ea26648e9175475c3b2da4e08ba92c43`, based on `master` `f4e63746c4a4e7f305ac555179faa8bcd2da759f`.
- Integrates three previously separate review branches: isolated, fail-closed build/deploy scripts and verifier/home copy; human-readable corpus selector; seven-day source findings and an anonymous A2A machine-client probe.
- Work and tests ran in `/root/ci-local/codex-m4-integrated-20261001`. The dirty shared CI writer tree was not checked out, reset, or modified. An earlier network-volume checkout was stopped after an observed NFS wait; the local-disk checkout completed.

## Checks observed

- Shell syntax, Python syntax, and `git diff --check`: pass.
- `npm ci`: 978 packages installed in the isolated checkout.
- Focused Vitest: 79/79 pass (`HomeFront.test.tsx` and `tabs.test.ts`).
- `npm run build:client`: pass at 14:19 UTC. It reported an MCP registry lookup timeout and Zenodo HTTP 410 as omissions; neither was silently promoted into evidence.
- Built-artifact gates: brand gate pass (eight held certificate-term matches remain informational), signed JSON guard pass (20 signed files), canary self-test and scan pass (40,374 files, zero canary leaks).
- Chromium preview: the two `gspc-verify-source.spec.ts` tests pass against a local Vite preview, including switching cards and editing a linked record without retaining its old source label. Home and verifier pages were rendered and inspected locally; this is not public-deployment evidence.
- `npm run check` fails with 218 TypeScript errors in files outside the 12 changed paths, including existing router typing and missing Cloudflare ambient types. No changed file appeared in that error list. The release owner should compare to a clean-master baseline before treating this as a regression or accepting any typecheck waiver.

## Public readback and open gates

- At 14:06 UTC, `GET https://councilof.ai/api/revenue` returned HTTP 200, 5,104 bytes: one distinct non-self payer, one non-zero settlement, 20,000 atomic Base USDC units (0.02 USDC). No repeat-payer evidence was observed in this readback.
- `GET https://councilof.ai/api/gspc` returned HTTP 200, 130,496 bytes. This proves only API reachability and served bytes, not a new admission or end-to-end job.
- The public A2A card still returns Cloudflare 1010 to Python-urllib from both M4 and the build pod. The exact blocking rule was not found in sampled Security Events; the available OAuth session cannot read/change the BIC setting. No Cloudflare security rule was changed.
- The integrated branch is **not landed on master, not deployed, and not anonymously read back as a release**. The installed release path still requires the reviewed clean-checkout fix, the protected-master human merge, build-pod `land:` gate, and exact-byte public verification. Never deploy this from the Mac.
- The one-product `gspcjob:` contract remains local-only. Canon already has a single-writer `functions/api/action-jobs.ts` intent ledger; bridge or reuse it when the human/MCP shared-job owner proceeds, then test API replay and A2A/agent-UI projections. Do not start a competing ledger.
