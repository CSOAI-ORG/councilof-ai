# Signed-card claim and manifest correction — 23 September 2026

## Public readback before correction

- `https://councilof.ai/claims-register.json`: HTTP 200, 13,507 bytes, SHA-256 `f98758f43de8971cb30241a1d9053c712f9d1ae41b6d1461b768d5bc68cd15cc`. CR-001 says every card is Ed25519-signed **over a SHA-256 hash chain**. The published verification rule instead signs the canonical body preimage with Ed25519 and hashes that preimage to form the card ID. The signed body carries `prev`.
- `https://councilof.ai/api/state`: HTTP 200, 40,879 bytes, SHA-256 `8da14199167abe09974bc6fba6eccc368017a87977044951b05b67f590ffd753`. `signed_cards.how_to_verify` instructs an index-based chain walk without naming or verifying the separate signed `/signed/chain.json` manifest.
- `https://councilof.ai/signed/card_index.json`: 335 entries, SHA-256 `4ff54c78dba0b15b56dc3fdeec62f11f98fa7bf5d4efffc9e54c6839247242a7`.
- `https://councilof.ai/signed/chain.json`: 335 unique continuous links, head and genesis match, index/link ID sets match, SHA-256 `67116c92c20073df91293a0228e191d4abebe0a5121f71a752a421c20822fc4c`. Its signed declaration is 313 bodies published and 22 withheld at signing; `/api/state` separately records that those 22 bodies are now on disk, so the two counts are not contradictory.
- The existing live verifier `node scripts/verify-estate.mjs` independently fetched the public corpus and DID key: **335/335 IDs, index agreement and Ed25519 signatures valid**. One key signs the set; this does not establish independent measurement or time anchoring.
- The pasted Claude assertion that the cards have no predecessor links was not true of this scoped live 335-card corpus. A fetched card body and the published manifest both contain `prev`. It may describe another corpus, which was not adjudicated here.

## Source-only candidate

- Parent: RunPod `pod/master` `c51c791656db01ec444e5442c8c33beecece827b`.
- Isolated branch: `codex/card-chain-claim-20260923`.
- Commit: `608d0043a5f1d032b28fd180cb7b1768c1bb04c0`. RunPod remote `git ls-remote` read back that exact ref.
- Only two files changed: `public/claims-register.json` and `functions/api/state.ts`. The claim is now scoped to the indexed corpus and distinguishes Ed25519 over canonical body bytes, SHA-256 card IDs, signed `prev` links and the separately signed manifest. The API's verification steps now require manifest and body checks plus index reconciliation.
- Candidate SHA-256: claims register `86cee466905fe6b2bafc682c226f1a0021180e1937def9731f81f252b08929c2`; API source `8ae9bd774fb9b00a0c7294593416f6452ed6334c42b1eab68791dcaec6c6068b`.
- JSON syntax passed. No TypeScript package is installed in this checkout, so a TS transpile test was unavailable; the API edit changed only five string literals.

**Release state:** Source branch only. No GitHub push, merge, signing, payment or site deployment. Both public endpoints still served their old bytes on final readback. A full production release must use the current served source and preserve its live route set; do not deploy a stale GitHub master or one-file Pages bundle.

## Integration audit against newer RunPod master

Read-only remote ref: `pod/master` = `9e3dc11acfce04769664e0bd02c133241dfae8ec`. Its merge base with the candidate is `c51c791656db01ec444e5442c8c33beecece827b`, and master changed neither touched file since that base. `git merge-tree --write-tree 9e3dc11acfce04769664e0bd02c133241dfae8ec 608d0043a5f1d032b28fd180cb7b1768c1bb04c0` exited 0 with result tree `e6308e43f1e38e013bccfcc6ecb07fc3d30563c5`. The resulting diff has exactly the same two files; `git diff --check` and JSON parse passed. This predicts a conflict-free cherry-pick on a **clean** checkout at that exact master commit. The shared Mac checkout is very dirty and should not be used for integration.

```sh
git switch -c codex/card-chain-claim-integration-20260923 9e3dc11acfce04769664e0bd02c133241dfae8ec
git cherry-pick 608d0043a5f1d032b28fd180cb7b1768c1bb04c0
git rev-parse HEAD^{tree}  # expect e6308e43f1e38e013bccfcc6ecb07fc3d30563c5
git diff --check 9e3dc11acfce04769664e0bd02c133241dfae8ec HEAD
```

The existing static register `generated_at` remains `2026-09-04`; that is an audit-chronology caveat before publication, not a cherry-pick conflict. No cherry-pick, merge, push, or deployment was performed during this integration audit.

## Chronology addendum — local branch only

`generated_at` is used by `functions/api/state.ts` as the claims register's `as_of` date. The source file had been changed on 14 September while retaining `2026-09-04`; leaving that date on newly corrected bytes would continue the stale-as-of problem. A targeted repository search found no pinned SHA-256 or signed manifest reference to `public/claims-register.json`; `public/root.json` did not name it. This does not imply the revised file is signed or anchored.

A one-line follow-up commit `39cdcbba11cf8381d0a7a543e774b34056afca9f` changes only `generated_at` to `2026-09-23` on the isolated local branch. The revised file's SHA-256 is `1b27b9648756f1cc42adffc25306e7ea5baf9990dcd0b5c84bb69a10fa70f7c3`. JSON parsing and `git diff --check` pass. A read-only merge-tree against RunPod master `9e3dc11acfce04769664e0bd02c133241dfae8ec` is conflict-free with expected result tree `5561e2ce30977cc28cc0ac9d48ff58f23ce4735f`; it changes only the original two files.

The earlier integration instruction's expected tree `e6308e43...` applies to the first commit alone. To include the chronology correction, cherry-pick both commits in order on a **clean** checkout at master `9e3dc11...`:

```sh
git switch -c codex/card-chain-claim-integration-20260923 9e3dc11acfce04769664e0bd02c133241dfae8ec
git cherry-pick 608d0043a5f1d032b28fd180cb7b1768c1bb04c0 39cdcbba11cf8381d0a7a543e774b34056afca9f
git rev-parse HEAD^{tree}  # expect 5561e2ce30977cc28cc0ac9d48ff58f23ce4735f
```

The second commit has **not** been pushed to RunPod. No merge or deployment occurred; the served site still carries the old wording and date.
