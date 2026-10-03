# OTS target-drift quarantine — 2026-10-03

Seven valid historical OpenTimestamps proofs were still served beside JSON files whose bytes had
changed after the proofs were made. A detached timestamp proves exact bytes; it does not follow a
filename across later edits. Serving these proofs at the old adjacent URLs therefore made the
release fail closed.

The proof bytes are preserved here and in Git history. The quarantine manifest records each proof
digest, the digest it actually commits to, and the SHA-256 of the current adjacent subject that no
longer matches. These files must not return to public unless the exact historical subject bytes are
restored under an unambiguous versioned path and the proof is paired with those bytes.

This is a quarantine of stale bindings, not deletion of evidence and not a claim that the original
timestamps were invalid.
