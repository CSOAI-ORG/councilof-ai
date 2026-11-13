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

Reconnect and confirm that Cline's server panel discovers the tool names listed below
(`tools/list` at the protocol level) before relying on the integration. The remote
is the canonical service; it is also suitable for MCP clients that support remote
Streamable HTTP configuration. This is not a claim of support for every AI platform
or client.

## Optional local stdio package (not the contract; use the remote)

<!-- mcp-npm-facts:start -->
The package identity is `csoai-gspc-mcp` (not the stale scoped name previously
shown here). The latest measured release carries the same tool names as the remote.
This guide gives the remote configuration above; alternatively use
the free read-only door https://councilof.ai/mcp/free.

The latest published release is `0.2.8` (published 2026-11-12T03:39:35.351Z). Its published tarball carries
54 tool names — 49 free + 5 metered — measured from the tarball's own manifests
on 2026-11-13, not from this repository. It is **not** marked deprecated on npm, which is why
`npm view csoai-gspc-mcp@latest deprecated` prints nothing: deprecation is not the
signal here, the name comparison is.

That release carries the same 54 tool names as the live door. The live door
served 54 names at the same moment. Re-run the comparison — `npm pack
csoai-gspc-mcp@latest`, extract `gspc-tools.json` and `paid-tools.json`, diff
against the door's `tools/list` — whenever either side moves, and treat the diff,
not npm's deprecation flag, as the signal.

The repository source version `0.2.8` is the published release identified by this dated capture.
Recheck `npm view csoai-gspc-mcp@0.2.8 version` before relying on its availability.
Name parity does not establish runtime or behavioural equivalence with the remote.
<!-- mcp-npm-facts:end -->

## Exact reviewed tool catalog

This list describes the reviewed source contract at this commit. Confirm that the
deployed remote returns the same 54 names before treating it as the live contract.
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
    "axis_serving-fidelity",
    "axis_watchdog-ingest",
    "framework_readiness"
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

## Cite the board from your own agent-card

MEOK's H.I.M. agent-card (`https://meok.ai/.well-known/agent-card.json`) ships
GSPC skills that quote the signed board verbatim and say UNMEASURED where no
measurement exists. Any agent-card can do the same in one paste — the pattern is
free, and every copy distributes verifiable measurement:

```json
{
  "id": "board-totals",
  "name": "Board totals",
  "description": "LIVE board totals — axis slots, measured count, unmeasured count, and the separation state across the model-comparison axes. Quoted verbatim from the signed board.",
  "tags": ["measurement", "gspc", "board"],
  "examples": ["what does the board say", "how many axes are measured"],
  "verify": "https://councilof.ai/gspc-verify/",
  "source": "https://councilof.ai/api/gspc"
}
```

Rules of the pattern: quote the board verbatim or say UNMEASURED — never a
paraphrase, never a score; carry a `verify` link so every claim is checkable in
one click; and never grade your own product with the board you cite (the judge is
never the subject). The free verifier (`/api/verify`, `verify-card.mjs`) is the
check; the Merkle root is the commitment.
