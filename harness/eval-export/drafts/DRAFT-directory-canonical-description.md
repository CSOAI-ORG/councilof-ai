Council of AI GSPC (MCP server)

One description for every directory entry. It carries no tool count and no version, because both change and
every directory copy we have found has gone stale on them. Readers get the current set from `tools/list`.

Short (at most 100 characters, for the MCP Registry `description` field):
Dated AI measurements and signed evidence over MCP. Verification is free; call tools/list for tools.

Long (Smithery, Glama, Docker catalog, npm):
Dated AI measurements and Ed25519-signed evidence from Council of AI, over MCP. The free tools read the live
board, individual axes, signed measurement cards and the public Merkle root, and check a card against the key
published at https://csoai.org/.well-known/did.json. A few evidence-assembly tools are metered over x402 and
return their payment challenge when called without payment. Verification is always free. Call tools/list for
the current tools; unmeasured is shown as unmeasured.

Canonical endpoint: https://councilof.ai/mcp (streamable HTTP; the free tools need no auth)
Stdio package: csoai-gspc-mcp on npm (versioned separately from the HTTP server)
