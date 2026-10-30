# @csoai/layer0

[![npm version](https://img.shields.io/npm/v/%40csoai%2Flayer0)](https://www.npmjs.com/package/@csoai/layer0)
[![npm downloads](https://img.shields.io/npm/dm/%40csoai%2Flayer0)](https://www.npmjs.com/package/@csoai/layer0)
[![license](https://img.shields.io/npm/l/%40csoai%2Flayer0)](https://councilof.ai/layer0/)


Make any tool, MCP server, package or plugin **Layer‑0‑governed + A2A‑ready** in ~15 lines.
Every governed action passes the CSOAI **Sovereign Gate** (policy/identity/human‑in‑loop), then
emits an **Ed25519‑signed attestation** you (or any auditor) can verify offline — and a signed
**A2A envelope** other governed agents can trust.

> **THE GATEWAY IS SERVED AT `https://councilof.ai`.** The default `CSOAI_API_BASE` points
> there. The three paths this client calls — `/api/gate`, `/api/a2a/route`, `/api/a2a/verify` —
> are Cloudflare Pages Functions in the source repository, and the publish workflow refuses to
> release this package until all three answer, so an install line that cannot work is never
> published.
>
> `/api/a2a/route` signs its envelopes with the deployment's Layer-0 key, whose public half is
> published at `GET /api/a2a/key` and pinned in the estate's DID document as
> `did:web:csoai.org#layer0-attestation-1`. If that key is ever absent the route answers **503**
> and says so: an unsigned artefact is honest and a fabricated signature is not. The gate and the
> verify path work regardless.
>
> ```
> curl -s -o /dev/null -w '%{http_code}\n' -X POST https://councilof.ai/api/gate -d '{}'   # 200
> curl -s https://councilof.ai/api/a2a/key                                                   # the public key, if published
> ```

```bash
npm i @csoai/layer0
export CSOAI_API_BASE=https://your-gateway     # optional; defaults to https://councilof.ai
```

```js
import { Layer0 } from "@csoai/layer0";

const l0 = new Layer0({ identity: "did:csoai:acme", endpoint: "mcp://soc2-compliance-ai" });

// wrap any action — denied actions throw, high‑risk actions escalate (control G)
const { result, attestation } = await l0.governed(
  "evidence.collect",
  { repo: "acme/app" },
  async () => doTheWork()
);
// `attestation` is a signed A2A envelope → drop it into another tool / your audit log
```

Conformance levels (see `CSOAI_Layer0_A2A_Protocol.md`): wrapping with `governed()` puts you at
**L0‑3 (attested)**; consuming/emitting envelopes via `verify()` / the gateway reaches **L0‑5 (A2A)**.

| Method | Does |
|---|---|
| `gate(action, inputs)` | Sovereign Gate decision: allow / allow‑with‑conditions / deny / escalate |
| `governed(action, inputs, run)` | gate → run → signed attestation (the common path) |
| `verify(envelope, peerKey?)` | verify an inbound A2A envelope |

Backend: the public gateway is `functions/api/gate.ts` + `functions/api/a2a/{route,verify,key}.ts` (Cloudflare Pages Functions) in the source repository, with the policy rule in `functions/_lib/layer0.ts` — checked against the canonical product's rule by `scripts/review/layer0-parity.mjs`. Home: https://councilof.ai/layer0/

## Licence

Apache-2.0 from 0.2.0 (see `LICENSE` and `NOTICE`). Earlier versions remain MIT.
