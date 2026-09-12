# Council of AI GSPC — MCP install

Council of AI GSPC exposes public AI-governance **measurement evidence** over MCP.
It does not certify a model, determine legal compliance, or act as a regulator or
notified body.

## Cline: use the canonical remote

Open Cline's MCP Servers configuration and add this server. The remote requires no
npm package, API key, or OAuth:

```json
{
  "mcpServers": {
    "csoai-gspc": {
      "type": "streamableHttp",
      "url": "https://councilof.ai/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Reconnect and confirm that Cline's server panel discovers the exact 12 names below
(`tools/list` at the protocol level) before relying on the integration. The remote
is the canonical service; it is also suitable for MCP clients that support remote
Streamable HTTP configuration. This is not a claim of support for every AI platform
or client.

## Optional local stdio package

The package identity is `csoai-gspc-mcp` (not the stale scoped name previously
shown here). The npm release last publicly verified here on 2026-09-09 is
`0.2.1`:

```sh
npx -y csoai-gspc-mcp@0.2.1
```

```json
{
  "mcpServers": {
    "csoai-gspc": {
      "command": "npx",
      "args": ["-y", "csoai-gspc-mcp@0.2.1"]
    }
  }
}
```

The published `0.2.1` package predates the reviewed `0.2.2` conformance repair;
its existence does not prove that the exact reviewed 12-tool runtime has shipped
to npm. The repository currently prepares `0.2.2`, but that source version is
**not a published npm release** until `npm view csoai-gspc-mcp@0.2.2 version`
confirms that exact version. Do not install or advertise `0.2.2` from npm before
that independent check.

## Exact reviewed tool catalog

This list describes the reviewed source contract at this commit. Confirm that the
deployed remote returns the same 12 names before treating it as the live contract.
Listing the catalog and using all eight read/verification tools is free. In
particular, `verify_card` checks a Council-issued signed measurement card without a
payment. Its three possible verdict classes are `VALID`, `INVALID`, and
`UNCHECKABLE`; signature validity is not certification of the subject.

<!-- mcp-tool-catalog:start -->
```json
{
  "free": [
    "board_totals",
    "get_axis",
    "verify_card",
    "list_cards",
    "get_root",
    "get_card",
    "verify_inclusion",
    "x402_trust"
  ],
  "x402_metered": [
    "commission_card",
    "art50_marking_evidence",
    "rwa_evidence",
    "receipts_batch"
  ]
}
```
<!-- mcp-tool-catalog:end -->

## Metered-call states

The four metered tools use explicit x402 semantics:

1. A schema-valid call without `x_payment` requests a structured
   `PAYMENT_REQUIRED` challenge. Its `accepts[]` entries describe how a client may
   pay.
2. A challenge is **not** a payment, settlement, delivery, receipt, or revenue.
3. After a wallet signs the selected challenge, call the same tool again with the
   resulting payload in the `x_payment` **argument**. The server relays that value
   for one request; do not put payment material in discovery or identity headers.
4. Submitting a payment payload does not itself prove settlement. Preserve the
   returned `settlement_state`; an unknown or unconfirmed state must not be promoted
   to paid.
5. Report delivery only when the successful tool result contains the promised
   deliverable. A 402, an error, a timeout, or a settlement attempt alone is not
   delivery.
6. After submitting a payment, do not automatically retry an uncertain result.
   Check the returned receipt, wallet and facilitator state first to avoid paying
   twice. A receipt reported by a route is not independent settlement verification.

Some metered tools also expose a documented free preview. A preview is unsigned
unless that tool's result explicitly says otherwise. Recent public-root leaves and
their inclusion checks remain free.

## Safe first checks

1. Call `board_totals`; keep slot counts and measured counts separately labelled.
2. Call `verify_card` with one published Council card, then mutate signed content
   locally and require `INVALID`.
3. Call `commission_card` with a harmless subject and no `x_payment`; expect a
   challenge, not delivery. Stop there unless you intend to authorize a payment.

Sources: [canonical MCP remote](https://councilof.ai/mcp) ·
[Cline remote-server configuration](https://github.com/cline/cline/blob/main/docs/mcp/mcp-overview.mdx) ·
[monorepo](https://github.com/CSOAI-ORG/councilof-ai) ·
[free verifier method](https://councilof.ai/signed/HOW-TO-VERIFY.md)
