# Council of AI — synthetic approval-to-effect replay evidence

These are the five original self-run output files from GitHub Actions run 44854144079, executed at permanent master commit ad3d28621addbb7ce58f8764871a7a96a9961c68 on 21 November 2026.

Within 14 owned synthetic local-file fixtures, 13 invalid action requests were denied without a file effect. One permitted synthetic action produced a bounded local-file effect, with a separate-process readback.

Not established: real human approval, customer protection, production authority, model attack defence, independent institutional review, certification, or GSPC admission. The card and event are UNSIGNED and UNANCHORED. The SHA-256 listing checks bytes relative to this unsigned manifest; it is not independent factual attestation.

Check these five files on macOS with: shasum -a 256 -c SHA256SUMS
On Linux: sha256sum -c SHA256SUMS

The canonical event also binds the raw replay with observed.raw_receipt_sha256. Reproduce after checking out ad3d28621addbb7ce58f8764871a7a96a9961c68:
  node --test harness/hitl/approval-effect-demo.test.mjs
  node scripts/pilot/approval-effect-replay.mjs --out pilot-demo-result.json

Fresh runs generate new timestamps and fixture identities, so historical byte hashes need not match. Compare scoped outcomes and negative controls. Source: https://github.com/CSOAI-ORG/councilof-ai/tree/ad3d28621addbb7ce58f8764871a7a96a9961c68
Original CI run: https://github.com/CSOAI-ORG/councilof-ai/actions/runs/44854144079

This is part of still-draft PR 4575. Its presence in GitHub does not mean a live deployment. Check public HTTP and actual bytes after approved release.
