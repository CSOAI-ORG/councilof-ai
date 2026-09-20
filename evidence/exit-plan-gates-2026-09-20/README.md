# Exit & Super-Hybrid Plan — evidence-gate bundle (2026-09-20)

Audit decision: **no migration executed.** The seven "safe work" items were run as
evidence gates. Nothing here changed production, identity, secrets, DNS, public history,
or external accounts. Measurement, never certification.

| # | Item | State | Artifact |
|---|---|---|---|
| 1 | Resolve GSPC attestation defect via existing path | FIX MERGED (PR #2657) + correction filed (PR #2658); **deploy BLOCKED: "Actions has been disabled for this user" (HTTP 422)**; live still INVALID pre-deploy (expected) | `item1-attestation-resolution-outcome.md` |
| 2 | Verify copy shows VALID/INVALID/UNCHECKABLE from real results | DONE, merged (PR #2659); was binary at 3 surfaces, now three-state from the shared derivation; 141+ tests green | code on master `2454de57` |
| 3 | Read-only repository recovery inventory | DONE — clone/remotes/refs/fsck receipt; mirrors reachable (HF/PyPI/npm/Zenodo 200); GitHub anonymous 404 with authenticated 200 recorded | `recovery-inventory.json` / `.md` |
| 4 | Signed-release manifest schema | DONE — JSON Schema, three-state enums, exact-byte binding, readback-before-publication rule | `signed-release-manifest.schema.json` |
| 5 | MCP Registry DNS-namespace official docs | DONE — DNS namespace verification EXISTS (apex TXT `v=MCPv1; k=ed25519; p=…`); **namespace migration route: NO** (versions immutable, metadata never removed; only deprecation/status) | `mcp-registry-dns-evidence.md` |
| 6 | No-secret fixture-only ceremony rehearsal | DONE — 9/9 fail-closed PASS (signer/mirror/transparency outages all refuse honestly; pending stays pending); caught its own preimage-ordering bug first run | `ceremony-rehearsal/` |
| 7 | Factual incident/correction draft | DRAFT ONLY, not published; each sentence mapped to evidence; rejected words absent | `incident-draft-NOT-PUBLISHED.md` |

Plus: `github-account-state-2026-09-20.md` — direct evidence that anonymous 404 coexists
with authenticated 200 + `private: false` (the "org is deleted" premise is refuted;
cause of the restriction is UNKNOWN — GitHub Support / owner diagnosis required).

## Claims this bundle supports, and their limits

- The attestation defect, its root cause, its fix, and its correction record: SUPPORTED.
- GitHub account impairment (Actions disabled, anonymous invisibility): SUPPORTED as
  observation; cause UNSUPPORTED (unknown).
- Any migration, deletion, uninterrupted-anchor, or completed-move claim: UNSUPPORTED —
  deliberately absent.

## Single highest-value next action

Owner resolves the GitHub account-level Actions disablement (or uses the owner-only
deploy path per DEPLOY-LOCK.md), deploys master, then re-verifies live `site_attestation`
from served bytes and updates C-2026-0920-01 with the readback.
