# Learn-loop placeholder incident — 2026-09-04

The retired `csoai-learn-loop.py` ran four times and generated demonstration
interactions presented as signed, externally anchored, unanimously approved
evidence. It did not perform Ed25519 signing, submit or verify external receipts,
or collect independent council votes.

The 20 queue files and the public atom root/proof are retained byte-for-byte in
this directory for incident analysis. They are not admissible measurement,
training, vote, signature, or anchor evidence and must not be republished.

The adjacent atom-root OTS file is a parseable pending stamp over the exact root
bytes, but those root bytes commit **471 inadmissible or derived leaves**: 240
from this learn-loop incident and 231 from seven fabricated
`bft-council/vote-chain-*` batches created by the related deep-mining/BFT wave.
Timestamp coverage does not make any of those records true or admissible.

Recovery boundary: the original paths and deterministic inventory digest are in
`manifest.json`; Git history preserves the move. A new root must use the
default-deny source policy, pass the evidence-integrity gate, and undergo the
reviewed publication/signing/OTS ceremony.
