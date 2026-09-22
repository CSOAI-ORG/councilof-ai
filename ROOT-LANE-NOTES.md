# ROOT LANE NOTES — pod-published public root, 2026-09-22

Lane: `/workspace/ci/root-lane` (clone of the bare `/workspace/git/councilof-ai.git`, master f5a576372).
Branch: `root/refresh-2026-09-22`. Nothing here merges or deploys; the coordinator does that.

## What `scripts/publish_public_root.py` does, step by step (read 2026-09-22)

1. Prints signer PRESENCE only (`BOARD_SIGN_KEY_PKCS8_B64` present/absent, OIDC yes/no). Never the value.
2. `load_committed()` reads `public/root.json`; `validate_committed()` re-opens every one of its
   `card_sha256[]` leaves from `public/cards/<sha[:16]>.json`, checks `card.sha256 == leaf`,
   re-derives the leaf (v1 whole-card digest, or v0 payload digest for legacy leaves), enforces the
   3072-byte payload cap, and recomputes `merkle_root` with the repo tree shape (odd node paired with
   itself). Any mismatch -> SystemExit.
3. `halt_on_split()` GETs the LIVE `https://councilof.ai/root.json`; if live merkle != committed AND
   live as_of is newer -> exit 2 (never overwrite a newer published root).
4. Runs 18 adapters (xrpl, swift_notices, benji, fin7_coverage, genai_mil_notices, staged_leaves,
   witness_queue, provider_diff, stablecoin_universe, x402_receipts, evm_permissions,
   evm_permission_events, xrpl_impersonation, xrpl_state_matrix, rwa_reconciliation, stablecoin_deep,
   art50_census; hub_cite is sidecar-only). Each returns leaves + a sidecar. Network-dark adapters
   yield fewer leaves, never a halt. `witness_queue` and `x402_receipts` read Cloudflare KV only when
   `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`/namespace ids are set (they are NOT on the pod), so
   only their on-disk mirrors under `public/interop/witness/` contribute.
5. For every leaf: `make_card()` builds a card-v1 (payload, subject, source_urls, tags, unmeasured,
   product block), THIN/TEMPLATE/specimen firewall, whole-card digest `sha256` computed LAST.
   A leaf is "new" unless its v0 payload digest is in the frozen 22-entry `LAST_UNSIGNED_SET`
   (2026-08-31T07:38:20Z). Every new card is signed via `sign_card()` -> `sign_payload()` over the
   compact envelope `{did, schema, surface, as_of, sha256}` (the sha256 transitively binds the whole
   card). Signature attached after digest; `sha256=id` invariant re-checked.
6. Halts: `xrpl.asset.state` must be exactly 16 (exit 1); any new card left unsigned -> exit 3
   (no signer) or exit 4 (signer present, leaf still unsigned). Halt writes `publisher-health.json`
   only (never the tree) unless `--dry-run`.
7. With a signer, a 17th `xrpl.basket.root` card (merkle over the 16 asset-card ids) is built and
   signed; card order = 16 assets, basket, then everything else in adapter order.
8. `root_body`: as_of=now, card_count=len(shas), card_sha256[], kind `csoai.public-root/v1`,
   leaf_definition, node_definition, tree_caveat (CVE-2012-2459 self-disclosure), merkle_root, notes,
   xrpl basket/sidecar fields. Envelope preimage = canonical JSON of the SIX keys
   `{kind, schema, as_of, merkle_root, card_count, did_intended}`; signed via `sign_payload()`;
   `sig_ed25519` (hex) + `sig_preimage` note attached. If envelope signing fails the root is left
   UNSIGNED (and says so in `note`).
9. Merkle inclusion proofs per leaf. Prints a one-line JSON summary. `--dry-run` stops here.
10. Real run writes: `public/cards/<sha16>.json` ({card, proof}), `public/proofs/<sha16>.json`,
    `public/root.json`, `public/publisher-health.json`, `public/interop/root-kinds.json`,
    EIP-1186 proof blobs under `public/archive/proofs/eip1186/`, and the evm-events cursor.
    Cards of previous roots are NOT deleted: `public/cards/` is a superset (3993 wrappers on disk vs
    305 leaves under the signed root — corpus 1 vs corpus 2 of CARD-CORPORA.md).

The root is NOT append-only: the leaf set is whatever the adapters emit on this tick. Leaves of the
previous root that an adapter no longer emits (dark network, changed snapshot, KV unreadable) drop out.

## What `.github/workflows/public-root.yml` did around it (GHA, dead since 15 Sep)
preflight (skip if `public-root/pending` PR open) -> layer0 liveness atom staged ->
`publish_public_root.py` -> `witness_public_root.py` (Rekor rekord + OTS) -> EAS (NOT_YET without key)
-> `witness_public_root.py --refresh-eas` -> `build_stablecoin_readiness.py` -> `witness_queue.py --mark`
-> `build_archive_index.py` -> `witness_public_root.py --recheck` (drift vs live, continue-on-error)
-> `root-witness-release-gate.py --selftest` + `--phase candidate` -> commit tree; push to master only
if OTS CONFIRMED_BITCOIN else bank on `public-root/pending` and open a PR.

## Committed root at lane start
as_of 2026-09-15T07:13:43Z, card_count 305 (== len(card_sha256)), merkle 07dd5eb3…0122e2,
sig 132b728b…, kind csoai.public-root/v1. Live apex root identical (checked 2026-09-22).
Witness pointer: rekor WITNESSED logIndex 2841551210, ots STAMPED_PENDING_BITCOIN
(`root-dedb49d0.json.ots` — a calendar fragment, not a proof), eas NOT_YET, xrpl_memo NOT_YET.

## Step 2 — pod-token path (branch root/refresh-2026-09-22)
`scripts/publish_public_root.py`: `_pod_token()` reads `BOARD_SIGN_POD_TOKEN_FILE` (file, mode 600) or
`BOARD_SIGN_POD_TOKEN`; `pod_token_available()`; `signer_available()` now = pkcs8 | oidc | pod-token;
`signer_path()` (presence word for publisher-health.signer_path); `sign_via_pod_token()` POSTs the same
`{"payload": ...}` body to BOARD_SIGN_URL with the pod bearer and REFUSES the answer unless the signer's
`payload_sha256` equals sha256(canonical_bytes(payload)) locally (a signature over other bytes is never
attached). `sign_payload()`: PKCS8 -> OIDC (if its env is set) -> pod token -> RuntimeError. The OIDC
function is untouched. New `--dry-run-out PATH` (requires --dry-run) writes the candidate
{root, cards, proofs, health} OUTSIDE the tree. Text-only changes: halt message names the pod token;
`sig_preimage`/`note` no longer say "GHA"/"(OIDC)" (neither string is inside the signed preimage).
Tests added to `scripts/test_public_root.py`: `test_pod_token_path_signs_and_binds_digest` (mocked
urlopen: bearer + URL + body asserted; wrong-digest control refused) and
`test_pod_token_absent_fails_closed_without_network` (no env / missing file / empty file -> no signer,
RuntimeError, urlopen never called). `python3 -m pytest scripts/test_public_root.py -q` -> 9 passed
(pytest installed on the pod for this). Related importers still green: test_watch_public_root,
test_card_root_automation, test_card_digest_covers, test_product_block, test_thin_firewall,
test_tui2_verify_inclusion (30 passed).

## Step 3a — control: dry run with NO credential (proof the real path fails closed)
`env -u BOARD_SIGN_POD_TOKEN* -u BOARD_SIGN_KEY_PKCS8_B64 -u ACTIONS_* publish_public_root.py --dry-run`
-> "HALT-ON-UNSIGNED-LEAF: 310 NEW cards not in the 2026-08-31T07:38:20Z unsigned set." then
"HALT-ON-MISSING-KEY: no PKCS8, no GHA OIDC and no pod-token board-sign; fail closed." exit 3, nothing
written (dry_run). Note: adapters refresh their own mirrors even in dry-run
(public/interop/xrpl-16-state-matrix/**, layer0 atom) — those are adapter outputs the workflow commits.

## Pre-existing defect found on master (not from this lane)
`root-witness-release-gate.py --selftest` FAILS on the committed tree at line 984: the committed proof
`public/interop/root-dedb49d0.json.ots` already carries Bitcoin attestations in its bytes
(blocks 967093, 967098, 967150 — `ots info` confirms) but `root-witness-latest.json` /
`root-witness-pointer.json` still say `STAMPED_PENDING_BITCOIN`, `bitcoin_blocks: []`. The proof was
upgraded (by the OTS upgrader) without `witness_public_root.py --refresh-ots` republishing the sidecar.
The old root WAS Bitcoin-anchored and the site does not say so. Memory: "Run the OTS upgrade or
anchoring is invisible".

## Step 3b — dry run WITH the pod token (`--dry-run --dry-run-out /workspace/ci/root-lane-candidate.json`)
Signer presence line: `BOARD_SIGN_KEY_PKCS8_B64: absent; oidc: no; pod-token: yes`. Exit 0.
Candidate: as_of 2026-09-22T08:50:00Z, card_count 306, merkle 2beee349…. Verifier
(`/workspace/ci/verify_candidate.py`, calibrated first on the committed 305-root: reproduces
07dd5eb3… and its signature exactly):

| check | result |
|---|---|
| (a) card_count == len(card_sha256) | 306 == 306, no duplicate leaves |
| (b) merkle_root: repo `merkle_root()` and an independent odd-node-duplication implementation | both 2beee349… == published |
| (b) every leaf == sha256(canonical(card minus sha256,sig)) in order | 306/306 |
| (c) envelope sig under did:web:csoai.org#board-attestation-1 (did.json, browser UA) | verifies; altered-preimage control rejected |
| (c) card envelope signatures under the same key | 302 signed, 0 fail; 4 unsigned = all members of the frozen 31-Aug LAST_UNSIGNED_SET (EURCV/EURQ/USDQ/PSC state cards) |
| (d) churn vs 305-root | kept 214, dropped 91, added 92 |
| dropped by reason | 54 same surface+subject re-emitted with new bytes; 36 same subject stem at a newer block (`evm:*:* permission state at block N`); 1 not re-emitted (`csoai.xrpl-identity-delta/0.1` EURØP — the delta adapter emits only on change vs the committed matrix) |

No basket card (`xrpl.basket.root`) in either root: the publisher builds it only with a LOCAL PKCS8 key
(`if key is not None`); under OIDC/pod-token it never existed. Unchanged behaviour, noted.

## Step 4 — REAL run (pod token), same clone
Exit 0. `public/root.json`: **as_of 2026-09-22T08:54:02Z, card_count 305, merkle_root
40ce3833118fab76a98c55429a5b06c7c3051915780893f3ab60a25cb31ac0a4, sig_ed25519 a39f3caf32c51e12…,
root.json sha256 ae8bbfcedf7cc30172498110e7df66a4f6c98c4aae69c9f47cdcba2abc1d334e (24505 bytes),
preimage sha256 c977dc8a51cf4952436d075734cb9d8970f371aab2d4c38b69201f123a79a340.**
`publisher-health.json`: key present, signer_path `pod-token`, envelope signed, halt none.
Verifier on the real root vs the saved old root (`/workspace/ci/root-old-2026-09-15.json`):
(a) 305 == 305; (b) merkle reproduces by both implementations, 305/305 leaves reproduce;
(c) signature verifies under the DID key, control rejected, 301 card signatures verify, 0 fail, 4 unsigned
(legacy set); (d) kept 214 / dropped 91 / added 91 — 55 superseded same subject, 36 superseded at a newer
block, **0 not re-emitted** (the EURØP delta from the dry run was consumed by the dry run's own matrix refresh
on disk; the real run saw 7 deltas, the dry run 8 — that is the 306 vs 305).
The 214 kept card wrappers are "modified" only because their inclusion proofs changed with the tree;
leaf digests and signatures are identical (Ed25519 is deterministic).
Files written: root.json, 91 new + 214 updated card wrappers and proofs, publisher-health.json,
interop/root-kinds.json, 28 EIP-1186 proof blobs, evm-events cursor, adapter mirrors
(xrpl-16-state-matrix, xrpl-impersonation-2026-09), layer0 staged atom.

## Step 5 — witnesses (no key; public bytes only)
- **Rekor**: `witness_public_root.py` re-verified the signature first, then uploaded a `rekord` (x509 PEM
  over the preimage) → **WITNESSED, logIndex 2908818404, integratedTime 1790067376, new entry**;
  entry saved as `public/interop/rekor-root-ae8bbfce.json`.
- **OpenTimestamps**: `ots --no-cache stamp --timeout 90` → `public/interop/root-ae8bbfce.json.ots`,
  4 calendar attestations, 0 Bitcoin attestations → **STAMPED_PENDING_BITCOIN. This is a calendar
  fragment, not a proof.** Upgrade later with `scripts/ots-upgrade.py public/interop/root-ae8bbfce.json.ots`
  then `witness_public_root.py --refresh-ots`, and republish the sidecar with the upgraded bytes.
- EAS on Base: NOT_YET (no attester key; `--refresh-eas` recorded it). XRPL memo: NOT_YET.
- Sidecar `root-witness-latest.json` + dated `root-witness-2026-09-22-ae8bbfce.json` + pointer written;
  corpus_scope 305 root leaves / 335 signed index / 0 overlap. Pointer drift: **DRIFTED** vs live
  (live still dedb49d0 = the 15 Sep root) — correct until the coordinator deploys; conflict NONE (49 sidecars).
- Post-publish steps from the workflow also run: `build_stablecoin_readiness.py` (ok),
  `adapters/witness_queue.py --mark` (no KV credentials on the pod → nothing marked),
  `build_archive_index.py` (52 entries appended; 56 subjects, 80 roots, 58 witnessed),
  `witness_public_root.py --recheck` (DRIFTED as above).
- Old root (15 Sep, dedb49d0): `witness_public_root.py --refresh-ots` run BEFORE the tree moved →
  its dated sidecar now records **CONFIRMED_BITCOIN, blocks [967093, 967098, 967150], block time
  2026-09-15T07:38:52Z**, header verified byte-identical on blockstream + mempool. The signed root bytes were
  not touched (sha256 identical before/after).

## Release gate (`root-witness-release-gate.py`)
`--selftest`: FAIL on master (stale OTS metadata of the old root) → **PASS on this lane** after refresh-ots.
`--phase candidate`: **BLOCKED on master with 21 issues**; on this lane BLOCKED with **17 issues, every one
pre-existing on master and untouched by this lane** (13 public .ots with no recoverable target bytes under
public/interop/ots/, ledger-card-*-unsigned.ots, door-demand-payai-2026-09-17-r2, press .r2.md.ots; 2 digest
mismatches in door-demand-payai-2026-09-22.json.ots and mirror-manifest.json.ots — files this run did not write).
This lane FIXES 4 (the stale old-root OTS metadata) and, after quarantining, ADDS 0.
The 4 it would have added were stamps of files the publisher regenerates every tick (root-kinds.json,
root-witness-latest.json, root-witness-pointer.json, and the 15 Sep dated sidecar rewritten by refresh-ots),
all committed on master at 12cf8f3bb the same morning; moved to
`_quarantine/ots-of-regenerated-files-2026-09-22/` with a README (separate commit, revertable). All four are
pending-only calendar fragments that match master's bytes; none carries a Bitcoin attestation.
The gate therefore cannot go green on this branch alone: the 17 remaining issues need their own lane.

## Not done / owner or coordinator
- Not merged to master, not deployed (by instruction). Live root stays 2026-09-15 until deploy.
- No GitHub write, no email, no payment. Rekor upload and OTS calendar submission are the only outward writes.
- Pod token never printed; read only via BOARD_SIGN_POD_TOKEN_FILE.
- Node_modules symlinked into the clone and excluded via .git/info/exclude (not committed).
