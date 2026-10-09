# Council footer link correction — review receipt (24 September 2026)

Status: **source-only review commit; not deployed**.

The existing `csoai/councilof-ai-source` link is publicly reachable (HTTP 200). It is a dated source snapshot, so the old “Public source mirror” label made it easy to mistake it for the current evidence publication. The current evidence mirror is separately reachable at <https://huggingface.co/datasets/csoai/councilof-ai-mirror> (HTTP 200). At readback, its `public/root.json` and <https://councilof.ai/root.json> were byte-identical: 24,505 bytes, SHA-256 `ae8bbfcedf7cc30172498110e7df66a4f6c98c4aae69c9f47cdcba2abc1d334e`.

The focused correction preserves the source-snapshot link with an accurate label in the footer, verification strip and API documentation, and adds a separate “Current evidence mirror” link in the footer Evidence column. It does not claim the source snapshot is unavailable or imply that either Hugging Face dataset proves deployment by itself.

- Local branch: `codex/footer-mirror-links-20260924`
- Commit: `3b033f28475f1c45dad7c86339cd67619708329e`
- RunPod bare review ref: `refs/heads/codex/footer-mirror-links-20260924` at the same commit; protected `master` was not changed by this transfer.
- Transfer bundle SHA-256: `bbe908a29476d82113e764a0936659040411eacab5d743b328db6d753157f70b`
- Changed paths only: `client/src/components/Footer.tsx`, `client/src/components/FooterVerifyStrip.tsx`, `client/src/pages/ApiDocs.tsx`.
- Checks: five focused source assertions passed; `git diff --check` passed; both linked HF pages returned 200; mirror/live root exact bytes matched; RunPod bare ref hash and changed paths were read back.
- Remaining gate: include this commit in a reviewed site build/release, then verify the served page shows both distinct links. No build or production deploy was performed in this lane.
