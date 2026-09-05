# A stamp is not an anchor — measured 2026-09-03

Re-measured with `scripts/badger/ots_stamp.py::attestation_state`, which reads what
each proof **actually carries** rather than what was requested of it:

```
total .ots in repo        261
  BITCOIN-ATTESTED          6   <- the only files that may be called anchored
  pending (valid stamp)   243   <- accepted by a calendar, not yet in a block
  unreadable (not a stamp) 12   <- BadMagicError; in scripts/ots/
```

The six anchored files are three published artifacts (each also copied into `dist/`):

- `public/interop/root-2026-09-02.json.ots` — Bitcoin block 965121
- `public/interop/root-728e8c5e.json.ots`
- `public/interop/layer0-ceremony-2026-09-03.json.ots` — Bitcoin block 965268

**No queued atom is anchored.** Any sentence of the form "N atoms OTS-anchored" is
false unless N is drawn from the BITCOIN-ATTESTED line above. The estate published
"700+ already OTS-anchored to Bitcoin" on `/pay` and reported "42/45 OTS-anchored"
in session; both were counts of stamps requested.

## What went wrong, in order

1. **The writer was broken.** `csoai-auto-ots.py` had four faults: it appended a
   constant to the digest (`digest_hex + "0123456789abcdef"`), wrote the raw HTTP
   body instead of a `DetachedTimestampFile`, passed a `bytes` object as a curl
   argument, and decoded the binary response as UTF-8 with `errors="ignore"`.
   It was fixed on 2026-09-03 and the queue re-stamped: 243 of the files now parse.
   The 12 that do not are left in place, because deleting them would hide that they
   were once counted.

2. **The fix did not travel.** Hours later `csoai-bridges.py` shipped with all four
   faults again — written by copying the pre-fix body. Both callers now import
   `scripts/badger/ots_stamp.py`; there is one stamper and adding a third caller
   means importing it.

3. **Nothing ever upgraded.** `com.csoai.ots-anchor.plist` fires daily at 07:00
   pointed at `scripts/badger/ots-anchor.sh`, **which did not exist**. The job died
   before it could open its log, so there was no log to notice. Stamps therefore
   stayed pending indefinitely even where Bitcoin had long since committed them —
   the two roots upgraded on first run once the script was written.

4. **No gate could see any of it.** `facts.json` still declared "No RFC-3161, no
   OpenTimestamps" as a live fact, so the whole programme was unregistered and no
   anchoring claim was ever checked. It now carries two rails: `ots_root_anchor`
   (live) and `ots_atom_anchor` (planned). A rail with no term in the gate's
   `RAIL_TERMS` now fails loudly instead of being skipped in silence.

## Re-checking

```
python3 scripts/ots-upgrade.py <files>        # pending -> proof, once committed
bash scripts/badger/ots-anchor.sh             # daily: stamp, upgrade, then COUNT
node scripts/facts-gate.mjs dist/client       # catches "anchored" copy that isn't
```

`CommitmentNotFoundError` from every calendar is not a failure: it means the digest
was stamped too recently to be in a block. Wait and re-run. An unupgraded stamp is
not a failed stamp — but it is not a proof either.
