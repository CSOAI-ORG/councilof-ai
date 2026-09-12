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
`shamir_2of3.py` · `ed25519_from_seed.py` · `ceremony_selftest.py`.
Run everything with the machine's Python; `cryptography` is the only
dependency (`uv run --with cryptography python3 ...` works offline only if
cached — **verify before disconnecting**, see Phase 0).

---

## ABORT CONDITIONS (any one → stop, keep no material, reschedule)

- The ceremony machine has been network-connected at any point after Phase 0 begins.
- `shamir_2of3.py selftest` or `ceremony_selftest.py` fails even once in the
  three pre-run passes.
- Any interruption between dice rolls and Shamir distribution long enough that
  the seed could have been observed or copied.
- Fewer than 99 usable dice rolls after 25 minutes (keep rolling next time;
  do not lower the floor on the day).
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
- **NEVER** leave the reconstructed seed or private keys on disk after
  distribution — secure-erase per Phase 6.

## VERIFICATION (gate BEFORE the real run)

On the ceremony machine, while still online (Phase 0):

1. `uv run --with cryptography python3 scripts/ceremony/shamir_2of3.py selftest`
   — **must pass 3 consecutive times.**
2. `uv run --with cryptography python3 scripts/ceremony/ceremony_selftest.py`
   — full dry run on SIMULATED material; **must exit 0 three times.**
3. Confirm `cryptography` resolves offline: disconnect Wi-Fi, re-run one
   selftest. If `uv` needs the network, install into a local venv first and
   freeze that venv.

After the real run (Phase 6), before any material leaves the room:

4. Verify card #0's signature from the **pubkey alone** (printed during
   Phase 4), on a fresh read of the filled card:
   `ed25519_from_seed.py verify --pubkey <root-alpha pubkey hex> --payload
   card0.minus-sig.canonical.json --sig <sig hex>` → must print `VALID`.
5. Independently reconstruct ROOT-α from a **different pair** of shares than
   the pair used for any sanity check during Phase 3, confirm the
   `secret_sha256` fingerprint matches the Phase 2 fingerprint, then
   secure-erase that reconstruction.

---

## TIMED PHASES (90 minutes total)

### Phase 0 — Setup & airgap (0:00–0:10)

- [ ] Ceremony machine: freshly booted, full-disk-encrypted, charged.
- [ ] Run VERIFICATION gate items 1–3 above (3x selftests).
- [ ] `unset HISTFILE; set +o history`
- [ ] **Disconnect:** Wi-Fi off, ethernet unplugged, Bluetooth off. Confirm
      with `ping` failing AND `ifconfig` showing no live interface.
- [ ] From this point the machine is airgapped until Phase 6 erase completes.
- [ ] Materials on the table: dice (a cup of d6), roll sheet, pen, three USB
      sticks (share media), the filled custody record forms.

### Phase 1 — 99+ dice rolls (0:10–0:35)

- [ ] Roll in batches of 10; two people read each batch aloud.
- [ ] Target **99 rolls minimum** (255.91 bits — the ceremony floor; the
      script prints the exact figure). If time allows, 100+ rolls clears a
      strict 256 bits.
- [ ] Enter rolls into `rolls.txt`. Double-read the file against the sheet.
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
      Secure-erase `recon-test.seed` immediately.

### Phase 4 — ROOT-β derive & attestation prep (0:55–1:05)

- [ ] Fresh entropy for ROOT-β: a second, independent roll set (or split
      the original sheet's spare rolls — the two seeds MUST NOT come from the
      same canonical string). Repeat Phase 1 to `root-beta.seed`.
- [ ] `ed25519_from_seed.py derive --seed root-beta.seed --key-out
      root-beta.der` → record pubkey + thumbprint on the paper record.
- [ ] `root-beta.der` is the operational key: it may later live (encrypted)
      on the signing host. `root-alpha.der` must NOT survive the ceremony on
      disk longer than Phase 5 needs it.

### Phase 5 — Card #0 fill, self-sign, independent verify (1:05–1:15)

- [ ] Copy `card0-genesis.template.json` → `card0-genesis.json`. Fill every
      null: both pubkeys + thumbprints, `created_at`. Strip the `note_*`
      helper fields if publishing (they are documentation, not payload) — or
      keep them; whichever you choose, the preimage is what you sign.
- [ ] Build the preimage: the card with `sig_ed25519` **removed entirely**,
      canonicalised (UTF-8 JSON, sorted keys, separators `(',',':')`,
      `ensure_ascii=False`). `ceremony_selftest.py` shows the exact
      construction in code if a helper is needed on the day.
- [ ] Self-sign: `ed25519_from_seed.py sign-file --key root-alpha.der
      --payload card0.preimage.json` → paste `sig_ed25519_hex` into
      `card0-genesis.json` as `sig_ed25519`.
- [ ] Independent verify from the pubkey alone (Verification item 4). A
      second person re-derives the pubkey from one share pair AFTER
      reconstruction (Phase 6) and confirms it matches the card.

### Phase 6 — Distribution, secure erase, publish handoff (1:15–1:30)

- [ ] Distribute the three share sticks to the three role holders (custody
      record signed by each holder, names on paper, never in the card).
- [ ] Secure-erase on the ceremony machine: `root-alpha.seed`,
      `root-beta.seed`, `root-alpha.der`, `shares/`, `rolls.txt`, any
      `recon-*` file — `rm -P` (macOS) or `srm` if available; then verify
      with `ls` that nothing remains.
- [ ] `root-beta.der` leaves the room only per the operational-key plan
      (encrypted medium, custody record updated).
- [ ] Reconnect ONLY after erase is confirmed.
- [ ] Publish handoff: commit `card0-genesis.json` (public by design — it
      contains only pubkeys, thumbprints, roles, and the signature) via the
      normal review path. Never commit seeds, shares, or private keys.

## Honest limits

- The Shamir implementation is fresh, single-implementation, and unaudited
  (see README.md). The 3x selftest gate plus fingerprint checks are the
  mitigations; ideally cross-check reconstruction with an independent
  implementation before trusting real keys.
- The ceremony's security rests on the physical/airgap procedure above, not
  on these scripts. The scripts' job is to fail closed and never print a
  secret; the room does the rest.
