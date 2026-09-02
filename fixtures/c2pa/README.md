# fixtures/c2pa — real samples for the Article 50 marking-evidence tests

Both files are copied byte-for-byte from the C2PA reference implementation's public test
fixtures (contentauth/c2pa-rs, `sdk/tests/fixtures/`, Apache-2.0 / MIT dual licence):

| File | Source URL | Bytes | SHA-256 | What it is |
| --- | --- | --- | --- | --- |
| `c2pa-rs-C.jpg` | https://raw.githubusercontent.com/contentauth/c2pa-rs/main/sdk/tests/fixtures/C.jpg | 132518 | a2d14755db55de67a47c04090340d8266e892367be4104a45626d7a6fa6e9ffd | JPEG with ONE C2PA manifest in an APP11 JUMBF segment: claim generator `make_test_images/0.33.1 c2pa-rs/0.33.1`, four assertions, `c2pa.hash.data` hard binding, COSE_Sign1 PS256, x5chain of 2 certs. The signing cert is the c2pa-rs test cert (`CN=C2PA Signer, OU=FOR TESTING_ONLY`) — its signature is cryptographically VALID; it is NOT on any trust list, which is exactly the distinction the pack records. |
| `c2pa-rs-libpng-test.png` | https://raw.githubusercontent.com/contentauth/c2pa-rs/main/sdk/tests/fixtures/libpng-test.png | 3700 | c5c635a1dbbec9a768c3bb4527dbaea62a1be05efcee17d66799cc07b673b29b | Plain PNG, no `caBX` chunk, no JUMBF — the non-C2PA sample. |

The `c2pa-org/public-testfiles` paths cited in older notes 404 as of 2026-09-02 (both
`raw.githubusercontent.com/c2pa-org/public-testfiles/{main,master}/image/jpeg/...` and
`c2pa.org/public-testfiles/...`), so the reference implementation's own fixtures are used.
The tests pin the SHA-256 of each file so a silent swap fails loudly.
