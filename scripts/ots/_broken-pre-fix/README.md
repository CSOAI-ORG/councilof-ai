# Not proofs — kept as evidence of a miscount, 2026-09-03

These 12 files were written by `csoai-auto-ots.py` before it was fixed. Every one
fails `DetachedTimestampFile.deserialize` with `BadMagicError`: they are raw HTTP
calendar fragments, not detached timestamps. Four faults produced them —

1. a constant appended to the digest (`digest_hex + "0123456789abcdef"`), so the
   calendar was asked to stamp `sha256(file)||constant`, never the file's digest;
2. the raw response body written straight to disk, with no magic header and no
   digest binding;
3. a Python `bytes` object passed as a curl argument, coerced to `str`;
4. the binary response decoded as UTF-8 with `errors="ignore"`.

They are kept rather than deleted because they were once counted as anchors, and
deleting them would erase the evidence of that. They must never be counted again:
`ots_stamp.attestation_state()` reports them as `unreadable`, which is neither a
stamp nor a proof.

The live files one directory up were re-stamped from their sources with the fixed
writer on 2026-09-03 and now parse. They are `pending` until a calendar commits
them to a Bitcoin block and `scripts/ots-upgrade.py` completes the proof.
