# ROOT CEREMONY CHECKLIST — 2026-09-12

**Purpose:** establish the estate's root-of-trust tier in one 90-minute offline
session:

- **ROOT-α** — offline root key. Seed from physical dice, custody via Shamir
  2-of-3 on three separate media. Signs card #0 and future ROOT-β rotation
  attestations. Nothing else. Ever.
- **ROOT-β** — operational signing key. Attested by ROOT-α inside genesis
  **card #0** (`card0-genesis.template.json`, schema `csoai.root-genesis/0.1`).

This tier anchors and attests keys only. **Measurement, never certification.**
Measurement cards under the public root remain the only measured surface.
Nothing in this ceremony touches the board key
(`did:web:csoai.org#board-attestation-1` stays in GHA/Pages).

Scripts (all in `scripts/ceremony/`): `entropy_from_dice.py` ·
`shamir_2of3.py` · `ed25519_from_seed.py` · `genesis_card.py` ·
`ceremony_selftest.py` · `verify_offline_bundle.py`.
Use only the pre-built wheelhouse pinned by
`requirements-macos-arm64-py39.lock` and
`wheelhouse-macos-arm64-py39.SHA256`. Network-resolved `uv --with` or
unpinned `pip install` is not a ceremony environment.

---

## ABORT CONDITIONS (any one → stop, keep no material, reschedule)

- The ceremony machine has been network-connected at any point after Phase 0 begins.
- `shamir_2of3.py selftest` or `ceremony_selftest.py` fails even once in the
  three pre-run passes.
- Any interruption between dice rolls and Shamir distribution long enough that
  the seed could have been observed or copied.
- Fewer than 100 usable dice rolls after 25 minutes (keep rolling next time;
  do not lower the floor on the day).
- The independent Shamir implementation, its pinned binary/source hash, or a
  matching `csoai.shamir-independent-crosscheck/1` PASS record is unavailable.
- Any secret file would be written to the internal APFS/SSD volume, a synced
  directory, or flash media that will not be physically destroyed.
- Anyone present who is not named in the ceremony plan.

## NEVER LIST

- **NEVER** let a networked machine touch the seed, the private keys, or any
  share after Phase 0 starts.
- **NEVER** photograph the rolls, seed, shares, private keys, or the screen
  while any of them are visible.
- **NEVER** let cloud sync, backups, screen sharing, terminal-logging, or
  shell history capture secret material (work in a shell with history
  disabled: `unset HISTFILE` / `set +o history`).
- **NEVER** re-use a test seed, a WEAK seed, or any seed that has ever been
  printed or shown on screen.
- **NEVER** print a seed, private key, or share value. Fingerprints only.
- **NEVER** treat `rm`, `rm -P`, `srm`, APFS deletion, TRIM, or SSD/USB file
  overwrite as proof that a secret is gone. Copy-on-write and wear levelling
  break that assumption.
- **NEVER** retain any physical roll sheet or `rolls.txt`: both are
  seed-equivalent and either one bypasses 2-of-3 custody.

## VERIFICATION (gate BEFORE the real run)

On the ceremony machine, while still online (Phase 0):

1. Build the venv from the exact offline wheelhouse using
   `pip --no-index --find-links ... --require-hashes`, then run
   `verify_offline_bundle.py --wheelhouse <path>` — it must print VERIFIED.
2. `python3 scripts/ceremony/shamir_2of3.py selftest`
   — **must pass 3 consecutive times.**
3. `python3 scripts/ceremony/ceremony_selftest.py`
   — full dry run on SIMULATED material; **must exit 0 three times.**
4. Disconnect every network and re-run the bundle verifier and one complete
   selftest. Any resolver or package-manager network attempt aborts the run.

During the real run, before any custody material leaves the room:

5. `genesis_card.py verify --card card0-genesis.json` must print `VALID` from
   the public key embedded in the card.
6. Independently reconstruct ROOT-α from a **different pair** of shares than
   the native sanity check. Run `shamir_2of3.py crosscheck` with the separately
   implemented checker output and pinned checker file. The resulting PASS
   record must bind the Phase 2 `secret_sha256`. Destroy both reconstruction
   files immediately by destroying the disposable medium at Phase 6.

---

## TIMED PHASES (90 minutes total)

### Phase 0 — Setup & airgap (0:00–0:10)

- [ ] Ceremony machine: freshly booted, charged, and dedicated to this run.
- [ ] Mount the approved **disposable encrypted ceremony medium**. Confirm the
      shell, temp directory, venv, repo copy, rolls, seeds, keys, shares, and
      reconstructions all live there. Set `TMPDIR` there. Nothing secret may
      touch the internal APFS/SSD. The medium will be physically destroyed.
- [ ] Alternative only after written review: a RAM-backed environment with
      swap disabled and verified absent, no crash dumps/hibernation, and a full
      power-off after the run. File deletion alone is never the erasure claim.
- [ ] From a reviewed, clean repository checkout, record the exact Git commit
      and SHA-256 of every ceremony script/template on the public paper record;
      copy that pinned checkout to the disposable medium. Abort on a dirty
      checkout or checksum drift.
- [ ] Install from the pinned offline wheelhouse and run VERIFICATION items
      1–4 above (bundle gate, 3x selftests, offline rerun).
- [ ] `unset HISTFILE; set +o history`
- [ ] **Disconnect:** Wi-Fi off, ethernet unplugged, Bluetooth off. Confirm
      with `ping` failing AND `ifconfig` showing no live interface.
- [ ] From this point the machine is airgapped until Phase 6 erase completes.
- [ ] Materials on the table: dice (a cup of d6), roll sheet, pen, three USB
      sticks (share media), the filled custody record forms.

### Phase 1 — 100+ dice rolls (0:10–0:35)

- [ ] Roll in batches of 10; two people read each batch aloud.
- [ ] Target **100 rolls minimum** (about 258.50 input bits before SHA-256;
      fixed in the CLI). There is no weak or lower-floor production option.
- [ ] Enter rolls into `rolls.txt`. Double-read the file against the sheet.
- [ ] Treat the sheet and `rolls.txt` as ROOT-α itself. They stay inside the
      controlled room/on the disposable medium and are destroyed in Phase 6.
- [ ] `python3 scripts/ceremony/entropy_from_dice.py --file rolls.txt
      --out root-alpha.seed`
      → record `rolls:`, `entropy_bits:`, and `seed_sha256_fingerprint:` on
      the paper ceremony record. The seed is never displayed.

### Phase 2 — ROOT-α derive & record (0:35–0:45)

- [ ] `python3 scripts/ceremony/ed25519_from_seed.py derive
      --seed root-alpha.seed --key-out root-alpha.der`
- [ ] Write `pubkey_raw_hex` and `jwk_thumbprint_rfc7638_sha256_b64url` onto
      the paper record by hand. These are public.

### Phase 3 — Shamir split to 3 separate media (0:45–0:55)

- [ ] `mkdir shares && python3 scripts/ceremony/shamir_2of3.py split
      --seed root-alpha.seed --out-dir shares`
      (optionally `--entropy-file rolls.txt` to mix the physical entropy in
      — belt and braces; `os.urandom` remains the source).
- [ ] Copy `share-1.json`, `share-2.json`, `share-3.json` to three
      **different** USB sticks. One share per stick. Label by role only.
- [ ] Sanity reconstruction from shares 1+2 in memory of this session:
      `python3 scripts/ceremony/shamir_2of3.py combine --share
      shares/share-1.json --share shares/share-2.json --out recon-test.seed`
      → the printed `secret_sha256` MUST equal the Phase 1 fingerprint.
      Keep it only on the disposable ceremony medium; remove the pathname
      after the check, but do not claim that file deletion erased flash/SSD.
- [ ] A separately sourced, pinned Shamir implementation reconstructs shares
      1+3 to `independent.seed`. Run:
      `shamir_2of3.py crosscheck --share shares/share-1.json --share
      shares/share-3.json --independent-secret independent.seed
      --independent-tool <checker-file> --independent-tool-name <name-version>
      --out-record shamir-crosscheck.json`.
      **No PASS record means no real genesis card.** Remove both reconstructed
      seed pathnames afterward; physical media destruction remains mandatory.

### Phase 4 — ROOT-β derive & attestation prep (0:55–1:05)

- [ ] Fresh entropy for ROOT-β: a second, independent roll set (or split
      the original sheet's spare rolls — the two seeds MUST NOT come from the
      same canonical string). Repeat Phase 1 to `root-beta.seed`.
- [ ] `ed25519_from_seed.py derive --seed root-beta.seed --key-out
      root-beta.der` → record pubkey + thumbprint on the paper record.
- [ ] `root-beta.der` is the operational key: it may later live (encrypted)
      on the signing host. `root-alpha.der` must NOT survive the ceremony on
      disk longer than Phase 5 needs it.

### Phase 5 — Atomic card #0 finalize, sign, verify (1:05–1:15)

- [ ] Do not edit or paste a signature into a destination card. Run one
      atomic command:
      `genesis_card.py finalize --template card0-genesis.template.json
      --root-alpha-key root-alpha.der --root-beta-pubkey <64hex>
      --created-at <UTC-Z> --shamir-crosscheck-record shamir-crosscheck.json
      --out card0-genesis.json`.
      It derives ROOT-α's public identity, checks ROOT-β's thumbprint, requires
      the matching independent Shamir record, strips helper notes, validates
      every field, signs, verifies from the embedded public key, fsyncs, and
      atomically creates the final path. Any failure leaves no destination.
- [ ] Run `genesis_card.py verify --card card0-genesis.json` on a fresh read.

### Phase 6 — Distribution, secure erase, publish handoff (1:15–1:30)

- [ ] Distribute the three share sticks to the three role holders (custody
      record signed by each holder, names on paper, never in the card).
- [ ] Copy only the three share files to their distinct custody media, ROOT-β
      per its encrypted operational-key plan, and the **public** genesis card
      plus public cross-check record to the handoff medium.
- [ ] Confirm every ROOT-α and ROOT-β physical roll sheet is inside the
      destruction set. They must
      never become a retained ceremony record; record only count, entropy,
      fingerprint, participants, and destruction witness on paper.
- [ ] Physically destroy the disposable ceremony medium and roll sheet under
      two-person observation. If the approved RAM-backed alternative was used,
      remove paths, power the machine fully off, and record that RAM/swap
      controls—not file overwrite—are the disposal boundary.
- [ ] `root-beta.der` leaves the room only per the operational-key plan
      (encrypted medium, custody record updated).
- [ ] Reconnect ONLY after media destruction (or reviewed RAM shutdown) is
      witnessed and recorded.
- [ ] Publish handoff: commit `card0-genesis.json` (public by design — it
      contains only pubkeys, thumbprints, roles, and the signature) via the
      normal review path. Never commit seeds, shares, or private keys.

## Honest limits

- The native Shamir implementation is fresh and unaudited. The independent
  reconstruction and bound PASS record are mandatory before finalization.
- The ceremony's security rests on the physical/airgap procedure above, not
  on these scripts. The scripts' job is to fail closed and never print a
  secret; the room does the rest.
