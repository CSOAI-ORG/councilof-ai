# Superseded, never published: evidence index v2a (2026-09-25T14:01Z)

`index.json` sha256 `99d48d11023c44b6638ac8ad2db6bc63517399fa08fef6a4c11defaedf3f4124`, signed by
`did:web:csoai.org#board-attestation-1` at 2026-09-25T14:01:24.323Z (two altered-preimage controls
rejected), OTS pending calendar commitment. verify.py at build: pass=212 fail=0 of 212.

Content-correct under the v2 package ownership rule, but `scripts/brand-gate.mjs` rejected it before
publication: the rationale string in `enumeration.package_ownership.why` carried an internal codename.
The string was changed in the builder and the index rebuilt from primary sources; nothing else differs
in intent. Kept byte-for-byte because it was signed. Never uploaded, never served.
