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

Reconnect and confirm that Cline's server panel discovers the reviewed tool names below
(`tools/list` at the protocol level) before relying on the integration. The remote
is the canonical service; it is also suitable for MCP clients that support remote
Streamable HTTP configuration. This is not a claim of support for every AI platform
or client.

## Optional local stdio package: check the published archive

The package identity is `csoai-gspc-mcp`. This guide keeps the canonical remote
configuration above as the simplest starting point. The free read-only door is
https://councilof.ai/mcp/free. Source, published-package and deployed-remote versions
are separate facts; none is inferred from another.

**Published-archive observation (30 October 2026):** `0.2.4` was published at
2026-10-28T16:48:34.768Z. Its immutable npm archive contains 52 tool definitions
(47 free + 5 metered), and its registry SHA-512 integrity value was checked against
the downloaded bytes. Archive SHA-256:
`cea24d2bcef3657b7b35a98d8b658c1b387a45b5c17772bb27b47a901cb0101d`.
This is a dated archive observation, not a claim about every future latest release.
A matching tool list is not proof of matching response behaviour: source version
0.2.5 repairs summary/full board responses and preserves separated-leader and
original-date semantics.

**Historical mismatch: `0.2.3`** was published at 2026-10-26T07:21:23.715Z with
19 tools (14 free + 5 metered), as observed from its published archive on
28 October. Preserve that incident as history, not as the current latest version.
An empty `npm view csoai-gspc-mcp@latest deprecated` response does not prove parity;
inspect the actual archive and exercise the documented behaviour.

The repository currently prepares `0.2.5`, but that source version is **not a
published npm release** until `npm view csoai-gspc-mcp@0.2.5 version` confirms that
exact version AND the published archive's definitions and tested responses agree
with the declared contract. A local candidate passing tests does not establish
registry publication. Keep any eventual release receipt separate from this guide.

## Exact reviewed tool catalog

This list describes the reviewed source contract at this commit. Confirm that the
deployed remote returns the same 52 names before treating it as the live contract.
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
    "route",
    "axis_governance",
    "axis_safety",
    "axis_provenance",
    "axis_continuity",
    "axis_conformance",
    "axis_openness",
    "axis_machinery-conformity",
    "axis_care",
    "axis_cross-reality",
    "axis_detector-interop",
    "axis_art5-safeguard",
    "axis_swarm",
    "axis_affect",
    "axis_jail",
    "axis_effect-binding",
    "axis_provenance-controls",
    "axis_reserve-attestation",
    "axis_regulatory-framework",
    "axis_distribution-integrity",
    "axis_custody-disclosure",
    "axis_ai-adoption-components",
    "axis_labour-components",
    "axis_humanoid-labour-index",
    "axis_lab-practice",
    "axis_company-practice",
    "axis_measurer-integrity",
    "axis_harness-fidelity",
    "axis_interop-conformance",
    "axis_humanoid-deployment",
    "axis_regulator-transparency",
    "axis_interpretability-reproducibility",
    "axis_claim-maintenance",
    "axis_serving-fidelity"
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
