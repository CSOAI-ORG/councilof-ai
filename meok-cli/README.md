# meok — the MEOK AI Labs CLI

Thin, **stdlib-only** command line over the live MEOK substrate.

```
pip install meok-cli

meok verify <cert_id>    # verify a signed attestation at proofof.ai (LIVE)
meok mcp list            # browse MEOK's published compliance MCP servers
meok mcp search bias     # search the catalogue
meok version
```

`meok verify` hits the real attestation API at `https://proofof.ai/api/verify` — the same endpoint auditors use. No mock, no key needed.

© CSOAI LTD (trading as MEOK AI Labs) · MIT
