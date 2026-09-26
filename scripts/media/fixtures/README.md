# Fixtures (read-only copies of published records)

Fetched 2026-09-25 from the public Hugging Face datasets, pinned by commit. Data licence CC-BY-4.0
(Council of AI, CSOAI). They are test inputs, never edited: tests copy them to a temp dir before tampering.

| dir | dataset | HF commit |
|---|---|---|
| a2a/ | csoai/a2a-card-census | c6331de14886d72bf3e0ac7026055d80431cce82 |
| mcp-remote/ | csoai/mcp-remote-census | 7a125cf1d5c8309cf9d7fb80569479d102995108 |

did.json is a snapshot of https://csoai.org/.well-known/did.json (public keys only), fetched 2026-09-25,
so the real board signatures verify offline. The live document stays the authority: compile.py uses
it by default and labels any other DID document a test key.

`a2a/record.json.upgraded.ots` is the published pending proof after calendar upgrade on 2026-09-25 (three Bitcoin
attestations, heights 968527, 968533, 968537); compile.py wrote it, tests use it offline for the explorer check.
