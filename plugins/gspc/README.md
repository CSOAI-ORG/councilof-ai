# GSPC — reuse the existing evidence service in your MCP client

This folder is a plugin pointer, not a second measurement engine. `.mcp.json` points to `https://councilof.ai/mcp`. The source repository also carries the stdio implementation in `mcp/gspc-server/`.

## Discover, do not freeze counts

Use the connected server's `tools/list` response for the available tool catalogue. The canonical definitions are `functions/mcp/gspc-tools.json` and `functions/mcp/paid-tools.json`; the stdio package copies them at pack time. Published packages and endpoints may be different revisions. Neither this README nor the plugin description is a live availability check.

Obtain axis names, declared slots and measured counts from one scoped `/api/gspc` response. A declared slot is not a measured result. Proposed research dimensions in an older harness definition must not replace the operational axis registry merely because slot numbers coincide.

## Capabilities and consent

Public readers and verification remain free. Separately metered tools require explicit caller authorisation and must preserve the service's payment, admission, execution and delivery states. This pointer does not select a read-only tool subset or enforce a spending cap. Configure capability restrictions in a host that supports them; do not describe a prompt or tool annotation as an enforced permission boundary.

Review the target endpoint and requested permissions before enabling the existing MCP configuration. Never auto-accept trust prompts. Do not supply wallet keys, reusable upstream tokens or payment authorisations merely to inspect metadata.

An HTTP 202 response is non-final, not completed work. The stdio adapter reports `ACCEPTED_NONFINAL`, preserves the route body and returns `retry_payment: false`; a receipt-shaped header is not independently verified. Unknown or lost outcomes require reconciliation, not automatic repayment. Other response states retain their documented scope.

Verification is specific to the supplied profile, key and evidence. Retrieval, signature validity, membership of a named root, freshness, truth and customer acceptance are different claims. An unavailable source must not be described as a forged record.

## Release scope

Use the monorepo's existing tests and packaging. This local pointer change does not publish npm, install a plugin, migrate a hosted service or establish current deployment. The required release owner must bind the package and public endpoint to their tested revisions.

Measurement and evidence inspection, never certification. Human users can inspect public evidence without installing this plugin.
