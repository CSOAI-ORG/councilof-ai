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

Reconnect and confirm that Cline's server panel discovers the tool names declared in the catalog below
(`tools/list` at the protocol level) before relying on the integration. The remote
is the canonical service; it is also suitable for MCP clients that support remote
Streamable HTTP configuration. This is not a claim of support for every AI platform
or client.

## NeMo Agent Toolkit example

For an existing NeMo Agent Toolkit workflow, this proposed function group uses the
canonical remote. It follows NVIDIA's 1.8 documentation and has not been run in
NeMo. Confirm your installed schema and the server's exact tool names before use.

```yaml
function_groups:
  council_free:
    _type: mcp_client
    server:
      transport: streamable-http
      url: https://councilof.ai/mcp
    include:
      - board_totals
      - get_axis
      - list_cards
      - verify_card
    tool_call_timeout: 60
    max_sessions: 1
    session_idle_timeout: 60
    reconnect_enabled: false
```

This is a function-group fragment, not a complete runnable workflow. Add
`council_free` to your existing `workflow.tool_names`, or reference individual
functions as `council_free__board_totals`, `council_free__get_axis`,
`council_free__list_cards`, and `council_free__verify_card`. The include list
selects workflow tools; it is not an authorization boundary for arbitrary
programmatic access.

For a useful first task, read the board, inspect the governance axis, select one
existing card returned by `list_cards`, and verify that exact card. Save the
result bytes, card identifier, and original observation date. Keep the reported
verdict distinct from independent signature replay, and preserve any correction
or supersession links for a later return.

The one-session and 60-second idle settings are proposed resource bounds, not
measured memory savings. Native validation must confirm the four free tools work
and metered tools are absent from the workflow's tool list.

See NVIDIA's [MCP client configuration](https://docs.nvidia.com/nemo/agent-toolkit/latest/build-workflows/mcp-client.html)
and [function-group workflow references](https://docs.nvidia.com/nemo/agent-toolkit/latest/build-workflows/functions-and-function-groups/function-groups.html).

## Historical local stdio package

For new connections, use the canonical remote configuration above.

The npm package `csoai-gspc-mcp@0.2.2` was publicly available when checked on
2026-10-03, but npm marks it **deprecated**. The publisher directs users to the
measurement-only successor at `councilof.ai`. See the
[exact version metadata](https://registry.npmjs.org/csoai-gspc-mcp/0.2.2).

The published package describes eight free readers and four metered tools.
That historical stdio package is a separate implementation from the reviewed
remote catalog below. Publication and matching package integrity records do not
establish catalog parity, current runtime support, or native-client compatibility.

The earlier `0.2.1` installation examples were last publicly verified here on
2026-09-09 and remain historical. This guide's current setup uses the canonical
remote rather than installing a deprecated package.

## Exact reviewed tool catalog

This list describes the reviewed source contract at this commit. Confirm that the
deployed remote returns the catalog's declared names before treating it as the live contract.
Listing the catalog and using every free read/verification tool is free. In
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
    "x402_trust",
    "mcp_trust",
    "measurement_index",
    "verify_capsule",
    "server_evidence",
    "evidence_bundle_preview",
    "route"
  ],
  "x402_metered": [
    "commission_card",
    "art50_marking_evidence",
    "rwa_evidence",
    "receipts_batch",
    "evidence_bundle"
  ]
}
```
<!-- mcp-tool-catalog:end -->

## Metered-call states

The x402-metered tools use explicit x402 semantics:

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
