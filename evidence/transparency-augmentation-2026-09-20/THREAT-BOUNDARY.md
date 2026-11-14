# Threat / boundary table — transparency augmentation experiment 2026-09-20

Scope: whether existing CSOAI artifacts can gain **independently checkable publication
evidence** from Sigstore and OpenTimestamps, **without** replacing the estate Ed25519
signatures and **without** overstating timestamp guarantees. Test subject: a copy of the
smallest real signed measurement card (`fixtures/card-00a52180-measurement-card.json`,
844 bytes, file sha256 `1a621d17…54683`). No production keys used. No personal identity
published. Measurement, never certification.

## 1. Layer comparison — what each layer actually establishes

| Layer | Proves (and only this) | Does NOT prove | Offline-verifiable? | Trust anchor | Status in this experiment |
|---|---|---|---|---|---|
| **Estate Ed25519 signed card** (`gspc.measurement-card`) | The pinned key `did:web:csoai.org#card-attestation-1` produced these exact body bytes; bytes unchanged since | Key still valid (no revocation mechanism — HOW-TO-VERIFY-ROOT.md "revocation" section); truth of the measurement; *when* it was signed | **Yes** — demonstrated (`fixtures/fixture-ed25519-baseline.txt`, VALID) | Pinned 32-byte hex key, resolved via did:web | VALID (pre-existing layer, re-verified) |
| **Merkle public root** (`csoai.public-root/v1`) | A card's `sha256` is in the leaf set under a signed `merkle_root` + signed `card_count` | Append-only history (no consistency proof); subject/source binding for **v0** cards (payload-only hashing, documented); `card_count` must be checked because odd-node duplication is collidable (CVE-2012-2459, documented) | Yes (declared construction, raw-digest pairwise, duplicate-last) | `#board-attestation-1` signed envelope | Not re-run here (existing layer; construction cited) |
| **Rekor `rekord` entry** (current production witness) | These exact **preimage** bytes existed in Rekor's log at `integratedTime`, under a Rekor-signed tree head (SET + RFC 6962 inclusion + note checkpoint all ECDSA-verified) | Content truth; currency; uniqueness (two witnessed roots, same epoch = CONFLICT per pinned rule); which root is head; **the served `root.json` bytes** — the entry binds the 274-byte signed *preimage* (`b6220613…`), not the 24,454-byte served file (`dedb49d0…`) | **Yes** — demonstrated fully offline from committed entry + fetched log pubkey (`sigstore/rekor-entry-verify-offline.txt`: log_identity/SET/inclusion/checkpoint all VALID) | Rekor log key, pinned logID `c0d23d6a…1801d` | VALID (with findings F1, F2 below) |
| **Sigstore keyless bundle** (Fulcio cert + Rekor inclusion, `.sigstore.json`) — *candidate* | Would add: an OIDC **identity** (account@issuer or repo-workflow identity) bound to an ephemeral key by a short-lived Fulcio certificate, plus Rekor inclusion, in one offline-verifiable envelope | Identity = "this account authenticated to this issuer at this time". NOT org membership, NOT authorization, NOT that the content is true, NOT current validity (cert validity is anchored to Rekor `integratedTime`, intentionally not to wall-clock-now) | Designed for offline (inclusion proof + cert chain inside bundle) **but** the trust root comes from a TUF repository — first fetch needs network; a cached trust root goes stale | Fulcio root CA + Rekor log key + TUF trust root | **UNCHECKABLE** — live signing declined (operator decision): no ambient OIDC on this machine; the interactive OAuth fallback would publish a *personal* identity permanently in public Rekor (`sigstore/keyless-blocker.txt`) |
| **OpenTimestamps** (detached proof) | CONFIRMED state only: this **digest** existed no later than the named Bitcoin block (existence-before). PENDING state: a calendar *promised* inclusion — nothing more | Who created the bytes; content truth; completeness; current validity; anything about a file whose hash merely matches (digest binding is to the file bytes, demonstrated by `ots info`) | **Partially**: `ots info` (digest binding, attestation tree) is offline. `ots verify` of a *confirmed* proof requires a **local Bitcoin node** — demonstrated failure (`ots/ots-verify-confirmed-root.txt`). The estate gate method (80-byte header byte-compared against two explorers) needs network | Bitcoin consensus (confirmed); calendar operators (pending) | Fixture proof **PENDING_CALENDAR_COMMITMENT** (3 calendars, `ots/ots-verify-pending.txt`); production root proof **CONFIRMED_BITCOIN** (blocks 967093/967098/967150, header readback byte-identical: `ots/ots-blockheader-readback.txt`) |

## 2. Findings (discrepancies recorded, not silently repaired)

- **F1 — Rekor covers the preimage, OTS covers the served bytes.** The committed entry
  `public/interop/rekor-root-dedb49d0.json` witnesses the 274-byte signed preimage
  (sha256 `b6220613…`, the six-field envelope), **not** the served `root.json` bytes
  (`dedb49d0…`). `--verify-root public/root.json` therefore returns INVALID
  (`sigstore/rekor-entry-verify-offline.txt`). This matches HOW-TO-VERIFY-ROOT.md §2
  ("it carries the preimage bytes"), so it is by design — but the filename suggests
  root-byte coverage it does not have. Coverage is complementary: Rekor binds what the
  board signature binds; OTS binds the served response bytes. Any future prose that
  says "Rekor anchors root.json" is false; "Rekor anchors the signed preimage of
  root.json" is true.
- **F2 — Rekor API virtual index ≠ tree position (canonicalized duplicates).** The
  sidecar's `logIndex: 2841551210` is the API/virtual index (that is what the SET
  signs). The entry's actual tree position is `inclusionProof.logIndex: 2719646948`.
  A different entry served at `?logIndex=2719646948` itself carries
  `proofIndex: 2597742686` (`sigstore/rekor-canonicalization-test.txt`) — the API's
  top-level index is not a reliable tree coordinate; the inclusion proof is. The
  estate verifier already verifies against the proof index (correct). Recommendation:
  sidecars should carry both indices explicitly. Also observed: Rekor re-signs the
  SET and refreshes the checkpoint on each GET, so a committed entry file and a live
  fetch legitimately differ in `signedEntryTimestamp`/checkpoint bytes.
- **F3 — `ots verify` is not offline for confirmed proofs.** The reference client
  verifies Bitcoin attestations only against a local Bitcoin node RPC
  (cookie/`bitcoin.conf`); no explorer fallback. The estate's release-gate method
  (header byte-comparison vs blockstream + mempool) is the practical substitute and
  was demonstrated byte-identical.
- **F4 — tooling filename quirk.** `scripts/ots_stamp_new.py` wrote the batch manifest
  as `ots-stamp-batch-2026-09-17.json` while its content `as_of` is `2026-09-20T01:57:45Z`.
  Filename/content date mismatch; the content is authoritative; the naming quirk is
  recorded here rather than fixed in this lane.

## 3. Boundary statements (what no layer here establishes)

- A transparency-log entry (Rekor) or a Bitcoin timestamp (OTS) proves **existence and
  time of exact bytes/digests** — never semantic truth, correctness, completeness,
  compliance, or certification.
- A Fulcio identity (if adopted) would prove **authentication of an account to an
  issuer**, not authorization, org standing, or trustworthiness of the measurement.
- A confirmed OTS proof is a **lower bound on age** ("existed no later than block N"
  — and practically "no earlier than the submission window"), not a precise creation
  time, and says nothing about the present.
- **Pending timestamps remain pending.** The fixture proof created in this experiment
  is `PENDING_CALENDAR_COMMITMENT` and must never be described as Bitcoin-anchored
  unless upgraded (`scripts/ots-upgrade.py`) and verified against the chain.
- Anchoring ≠ signing. Signing = who attests. Anchoring = when bytes existed. Neither
  substitutes for the other (statement already enforced by `scripts/ots_stamp_new.py`).
