# Superseded, never published: evidence index v1 (2026-09-25T11:50Z)

`index.json` sha256 `3350549ed52356aebf62c1df32812dd62223170d5d813a2e068eb90ec7f13692`, signed by
`did:web:csoai.org#board-attestation-1` at 2026-09-25T11:50:16.775Z, OTS stamped 11:50:41Z (pending).
Kept byte-for-byte so the signature and the proof stay checkable. It was never uploaded to Hugging Face
and never served by councilof.ai.

Superseded because its package items were selected by NAME (`csoai`/`gspc` substring). It indexed
`npm @meok-labs/csoai` (the MEOK npm organisation), `npm @csgaglobal/csoai-governance` (CSGA Global),
`pypi csoai-defoneos-isr-mcp` and `pypi csoai-governance-crosswalk-mcp` (declared publisher MEOK AI Labs),
and two PyPI projects that declare no publisher (`csoai-affective-safety`, `inspect-gspc-scitt`).
CSOAI and MEOK are separate; MEOK artifacts do not belong in the CSOAI evidence index. v2 decides by an
explicit ownership rule (index.json `enumeration.package_ownership`). Do not quote any v1 count.
