# xrpl-attest-poc — verify path (07 Sep 2026)

Stranger `verify.py` talks to public XRPL **devnet** + `https://councilof.ai/signed/card_index.json`.
It does **not** invent an Ed25519 signature.

**VALID (exit 0)** after a live memo re-attach:

- memo tx `BC89F5163B1C398816104C8E05B60EAD63904EE2DE2EA6AB9371F9EABBF157A1`
- credential tx `958BA25801A068AEA1507FC1649A862C33D59A1D715924794D98D2C66254DC4B` (tecDUPLICATE on re-run; reused, not faked)
- signer `cose-interop-1` (`~/.csoai-keys/cose-interop-1.pem` present)
- `attest.py` now treats CredentialCreate tecDUPLICATE as reuse of the recorded hash

Risk verdict stays UNMEASURED. TESTNET only. Not a rating.
