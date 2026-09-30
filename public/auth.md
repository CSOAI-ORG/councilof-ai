# councilof.ai auth.md

How an agent authenticates to Council of AI (councilof.ai). Short answer: it does not need to.

## Audience

AI agents, MCP clients, A2A agents and scripts that read Council of AI measurements, verify signed cards, or buy one
of the paid evidence tools. People use the same doors.

## Registration

None. There is no account, no sign-up, no API key, no client registration and no registration endpoint. Nothing
here issues a credential, so there is nothing to register for and no `register_uri`.

## Public reads: no authentication

Every read and every verification is free and anonymous, forever:

- the board: `GET https://councilof.ai/api/gspc`
- the MCP doors: `POST https://councilof.ai/mcp/free` (free tools only) and `POST https://councilof.ai/mcp`
  (server card: https://councilof.ai/.well-known/mcp/server-card.json)
- the A2A agent: `POST https://councilof.ai/api/a2a` (agent card: https://councilof.ai/.well-known/agent-card.json;
  skills: https://councilof.ai/.well-known/agent-skills/index.json)
- signed-card verification: https://councilof.ai/gspc-verify and https://councilof.ai/signed/HOW-TO-VERIFY.md

No request to these needs an `Authorization` header. A verification is never sold.

## Paid tools: x402, not OAuth

A few evidence tools on `POST https://councilof.ai/mcp` are metered with x402 (HTTP 402 Payment Required). Call the
tool without payment and the answer is the payment challenge; the payment comes from the caller's own wallet and
travels as the `x_payment` tool argument (each implementation sets the `X-PAYMENT` header itself). A 402 challenge
is not settlement, delivery or revenue. Discovery: https://councilof.ai/.well-known/x402.json. Payment buys the work;
it never changes a result.

## Credential use

There is no bearer token, session or cookie to present. The x402 payment payload is the only thing a paid call
carries, and it is per call.

## OAuth

Not used. councilof.ai runs no authorization server and protects no resource with OAuth, so it publishes neither
`/.well-known/oauth-protected-resource` (RFC 9728) nor `/.well-known/oauth-authorization-server` /
`/.well-known/openid-configuration`: either document would describe something that does not exist. x402 payment is
not OAuth and is not described as OAuth anywhere here.

## Our own outbound requests

Our probes identify themselves in `User-Agent` (for example `CSOAI-effect-binding-probe/0.1 (+https://councilof.ai;
nicholas@csoai.org)`). They do not yet sign requests with Web Bot Auth (HTTP Message Signatures); that is planned.

## Contact

nicholas@csoai.org. Corrections: https://councilof.ai/corrections/. Measurement, never certification.
