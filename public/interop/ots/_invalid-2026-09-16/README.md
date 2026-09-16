# Invalid OTS proofs, quarantined 2026-09-16 (correction C-2026-0916-02)

These three files were published as OpenTimestamps proofs. They are not.
The producer (scripts/ots/ots-stamp.py, pre-2026-09-16) wrote the calendar's raw HTTP
response fragment to disk. A detached .ots file must be: magic header + version +
file-hash-op + file digest + serialized timestamp. These carry no magic header, and
python-opentimestamps rejects each with BadMagicError. The manifest digests published
beside them matched neither these files nor the artifacts they named.

They are kept, unedited, so anyone who read them can see exactly what was published.
Valid replacements: ../swift-measure.json.ots, ../cobol-measure.json.ots,
../stablecoins-extended.json.ots (created 2026-09-16, four calendars, PENDING).
