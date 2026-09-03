# The .ots files in this queue are NOT proofs — 2026-09-03

112 of the 115 `.ots` files under `scripts/badger/_queue/` **cannot be read by
`ots verify`**. Measured, not estimated:

```
total .ots            115
in public/ (published)  3
WITH Bitcoin blocks     2
pending only            1
unparseable           112     <- 100 x BadMagicError
```

They carry no OpenTimestamps magic header. They are raw calendar responses
written straight to disk by `csoai-auto-ots.py`, which had four faults:

1. It appended a hardcoded constant to the digest —
   `payload_hex = digest_hex + "0123456789abcdef"` — so the calendar was asked
   to stamp `sha256(atom)||0123456789abcdef`, never the atom's digest. Even a
   perfectly formatted file would not have attested the atom.
2. It wrote the raw HTTP body as the `.ots`. A calendar returns a timestamp
   *fragment*; the magic header and digest binding were never written.
3. It passed a Python `bytes` object as a curl argument, coercing it to `str`.
4. It decoded the binary response as UTF-8 with `errors="ignore"`.

`csoai-auto-ots.py` is fixed and now emits real `DetachedTimestampFile` bytes,
verified to parse and to bind to the submitted digest.

**The 112 existing files are left in place and are NOT proofs.** They are not
deleted, because deleting them would hide that they were once counted. Any
figure of the form "N atoms OTS-anchored" that includes them is wrong: at the
time of writing the number of published proofs carrying a Bitcoin attestation
is **2** — `public/interop/root-2026-09-02.json.ots` and
`public/interop/root-728e8c5e.json.ots`.

To make the queue real, re-stamp with the fixed writer and upgrade with
`scripts/ots-upgrade.py` once a calendar commits. An unupgraded stamp is not a
proof either.
