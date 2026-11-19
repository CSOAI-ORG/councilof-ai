# Changelog

Notable changes to the verifier, endpoints and records behind councilof.ai, newest first.

This file was started on 2026-11-18 with the entry below. Earlier changes are in the git
history. The corrections record at <https://councilof.ai/corrections/> (JSON:
<https://councilof.ai/api/corrections>) states what we got wrong, how it was caught and the fix.

## 2026-11-06

### Fixed

- **The record verifier no longer returns VALID for a record with no signature.**
  In `functions/_lib/cardVerify.ts`, the shared verifier behind `POST /api/verify`, the
  `/gspc-verify` page and the MCP `verify_card` tool, an empty signature produced a check with
  `ok: null` and no reason, so the verdict could read VALID with nothing signed. VALID now
  requires an Ed25519 check that ran and verified. A record with no signature reads UNCHECKABLE
  with the reason `unsigned`, and a signature that does not verify reads INVALID.
  - Fix: pull request [3957](https://github.com/CSOAI-ORG/councilof-ai/pull/3957), commit
    [`728775004`](https://github.com/CSOAI-ORG/councilof-ai/commit/7287750047546d65c8d02b786363486b9dd5d292),
    merged and deployed on 2026-11-06.
  - Reported by [kta1kri](https://github.com/kta1kri), privately, on 2026-11-02. They found it by
    running our verifier offline on a record with an empty signature.
  - Corrections record: [C-2026-1118-01](https://councilof.ai/corrections/#C-2026-1118-01).
