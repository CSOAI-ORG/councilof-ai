# DRAFT correction — claim-capture-census, 2026-09-22: eight OpenTimestamps proofs commit to an earlier run's root

Status: **DRAFT — not published.** Nothing on Hugging Face or councilof.ai has been changed by this draft.
Prepared 2026-09-25 by the integrity lane from primary bytes (Hugging Face API commit history of
`datasets/csoai/claim-capture-census`, every version of every affected file downloaded and hashed).
Machine-readable evidence: `DRAFT-2026-09-25-claim-capture-stale-ots.evidence.json` (same directory).

## Classification

**(b)+(c): a tooling bug that shipped a stale proof.** Not (a): no root.txt was silently edited after
it was stamped. Every root.txt rewrite is a whole-record re-run by the pod loop (commit author
`Nicholastempleman`, titles `pod loop: artifacts/<source>/…`), each re-run also rewrote and re-signed the
artifact with an incremented `revision`, and every current root.txt equals the `merkle_root` inside its
current, verifying signed payload. What went wrong is the proof: it was not renewed, and the record said
it was.

## What happened (from the bytes)

1. On 2026-09-22 the census loop ran six times for the same date (runs starting ≈15:48, 16:01, 16:26,
   16:47, 17:30, 17:45 UTC; defillama-hacks also 17:38). The first four runs wrote into a fresh output
   directory and uploaded a fresh `<source>-2026-09-22.root.txt.ots` each time. Every one of those
   proofs commits to exactly the root.txt uploaded in the same run (checked for all 36 proof versions).
2. The 17:30 and 17:45 runs produced new roots (revision 2 and 3). `ots stamp` refused to write the
   proof because the previous run's `.ots` was still on disk:
   `Failed to create timestamp '/workspace/lanes/out/census/artifacts/<source>-2026-09-22.root.txt.ots':
   [Errno 17] File exists` — this text is inside the published artifact JSON (`evidence.ots.stderr_tail`,
   revisions 2 and 3).
3. `ots_stamp()` in `scripts/pod-loops/census-capture.py` accepted any non-empty `.ots` on disk and
   returned `status: SUBMITTED_PENDING`, `covers: "the bytes of <source>-2026-09-22.root.txt"`. The
   uploader re-sent the unchanged old proof (a no-op on Hugging Face, so no `.ots` commit exists for
   runs 5–6) and uploaded the new root.txt beside it.
4. Result: for eight sources the published proof commits to the revision-1 (≈16:48) root.txt, while the
   published root.txt and signed record are revision 3. The artifact JSON of revision 3 — whose sha256
   the signed payload pins — states the proof covers the current root.txt. That sentence is false and
   is inside signed bytes, so it must be superseded, not edited.
5. defillama-hacks-2026-09-22 is unaffected: its root did not change after 16:02, so the old proof still
   binds. All ten 2026-09-23 proofs bind (single run that day).

## The eight records

Repo `datasets/csoai/claim-capture-census`, paths `artifacts/<source>/<source>-2026-09-22.*`. Digests
are sha256 of the complete root.txt file bytes (hex root + `\n`), which is what the proof commits to.

| source | current root.txt (commit, sha256) | proof `.ots` (commit) commits to | = root.txt at commit (revision 1) | Bitcoin block of the other lane's upgrade of that proof |
|---|---|---|---|---|
| 402index-services | db011cf91a1e `af69ed97816a8dc7…` | f6006e06b85e `65ead90580be6755…` | 052acc6cdfcf (16:49:07) | 968170 |
| a2a-registry | 329f11d1b719 `4e5d927eabc43f04…` | 2ca08070e7b0 `4e269bfc899f40b4…` | 31d8df8bde83 (16:49:27) | 968170 |
| defillama-chains | d358f47baa99 `754a5c5aa519d742…` | 8e492b6e135e `e43addd90263319e…` | 70359000d0d2 (16:47:48) | 968188 |
| defillama-protocols | 1c446f86d1d6 `2c7d5e665dbbbba3…` | c9827a65f448 `44f52209c5fcced6…` | dc54fdbebcbe (16:47:37) | 968184 |
| defillama-stablecoins | b96d72ea347b `4624148cd8b9081b…` | 6668b0c07fa9 `77ecaa4f32424392…` | 26584430cb94 (16:48:01) | 968188 |
| defillama-yields | b56927f7eb1a `6358c0b180a602f7…` | fc35e4cf4855 `bd49ef1df08b1803…` | 7645a3343707 (16:48:15) | 968184 |
| mcp-registry | ecce79efb9d1 `ea2dab0735ec6e28…` | fb7dcde60427 `1cec96104add48a2…` | a8de0efcd326 (16:48:52) | 968170 |
| openrouter-models | 1ae0e76fd393 `debac08e9b839295…` | e315094ccf5d `5fecdd35cef2d8cb…` | c9545c885109 (16:48:42) | 968170 |

Full 64-hex digests and full commit ids are in the evidence JSON. The Bitcoin column refers to
`ots-upgraded/2026-09-25/…` published by another lane in commit 6845417bcb68 (its receipt already records
`target_digest_matches_proof: false` for these eight). Here, each upgraded proof was re-parsed, its file
digest confirmed equal to the pending proof's, and its attestation commitment (byte-reversed) confirmed
equal to the merkle root of the block header at that height from both blockstream.info and mempool.space
(raw header double-SHA256 equal to the block hash in both). That attestation is real, but it dates the
**revision-1** root, which is still retrievable at the commits in column 4 — not the current root.

## What is and is not affected

- Signatures: unaffected. Every current `.signed.json` verifies under `did:web:csoai.org#board-attestation-1`
  and binds its artifact (index: 32 of 32 MATCH).
- Records/roots: unaffected. Each current root.txt equals the signed `merkle_root`.
- Timestamps: the current (revision-3) roots of these eight records have **no timestamp proof at all**.
  The only proof at each path is over revision 1. Nothing about the time of revision 3 may be claimed
  from it.
- The artifact JSONs of revisions 2 and 3 state `ots.status: SUBMITTED_PENDING` and "covers the bytes of
  root.txt". False for these eight, and inside signed bytes.
- Separate, smaller defect: signed records were overwritten in place at the same path twice in one day
  (revision 1 → 3). Hugging Face history keeps the older revisions, but a reader of `main` sees only the
  last. Recommend revision-qualified filenames for same-day re-runs (not implemented here).

## Proposed superseding correction (for owner approval; nothing below is done yet)

1. Publish `corrections/2026-09-25-stale-ots-2026-09-22.json` in `csoai/claim-capture-census`, signed via
   `/api/board-sign`, listing the eight records with: current root.txt sha256 + commit; the proof's
   committed digest; the commit where that digest's root.txt lives (revision 1); state
   `TIMESTAMP_ABSENT_FOR_CURRENT_ROOT`; and the sentence it supersedes (`evidence.ots.covers` in the
   revision-2/3 artifacts). Do not edit, delete or rename any existing artifact, root or proof.
2. Stamp each current root.txt now, as a NEW file `<source>-2026-09-22.root.txt.rev3.2026-09-25.ots`,
   with the stamp date stated as 2026-09-25 (it proves existence by a 2026-09-25+ block, never by 22 Sep).
3. Keep the existing `.root.txt.ots` and the other lane's `ots-upgraded/2026-09-25/` copies; relabel them in
   the correction as "proof of revision 1 root (commit …), Bitcoin block N". They are honest proofs of
   the earlier bytes.
4. Append a README "Corrections" section pointing to the correction file, and change the README
   sentence on OTS status to name the eight records whose current root has no proof yet.
5. Add to `/api/corrections` feed through the normal promote path (drafts → promoted), not by hand.

## Producer fix (in this lane: `scripts/pod-loops/census-capture.py`)

`ots_stamp()` now (a) reuses an on-disk proof only when the digest in its header equals sha256(root.txt);
(b) otherwise moves it aside (`.superseded-<digest16>`), never stamping over it and never shipping it;
(c) accepts a new proof only if `ots stamp` exits 0 **and** the new proof's header digest equals
sha256(root.txt), else records `NOT_SUBMITTED` with both digests and uploads no proof; (d) writes
`binds_to_sha256` into the artifact. Tested on Oracle against the real `ots` client and live calendars:
changed root → old proof moved aside, new proof binds; unchanged root → proof reused; final proof binds.
The pod copy of the script must be updated from this lane by the pod-loops owner; this lane does not
deploy to the pod.
