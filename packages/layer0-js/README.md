# @csoai/layer0

[![npm version](https://img.shields.io/npm/v/%40csoai%2Flayer0)](https://www.npmjs.com/package/@csoai/layer0)
[![npm downloads](https://img.shields.io/npm/dm/%40csoai%2Flayer0)](https://www.npmjs.com/package/@csoai/layer0)
[![license](https://img.shields.io/npm/l/%40csoai%2Flayer0)](https://councilof.ai/layer0/)


Make any tool, MCP server, package or plugin **Layer‑0‑governed + A2A‑ready** in ~15 lines.
Every governed action passes the CSOAI **Sovereign Gate** (policy/identity/human‑in‑loop), then
emits an **Ed25519‑signed attestation** you (or any auditor) can verify offline — and a signed
**A2A envelope** other governed agents can trust.

> **NOT PUBLISHED, AND NO GATEWAY ANSWERS.** Re-probed 2026-09-28 (first probed 2026-09-05):
> `@csoai/layer0` returns **HTTP 404** on the npm registry; `api.csoai.org` (the default
> `CSOAI_API_BASE`) has **no DNS record**; and `https://councilof.ai` answers **404** on all three
> paths this client calls (`/api/gate`, `/api/a2a/route`, `/api/a2a/verify`). The install line
> below cannot work today, and every method needs a gateway that is not publicly served. The
> design below is unchanged; what is not real yet is that you can run it.
>
> ```
> curl -s -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/@csoai%2flayer0   # 404
> host api.csoai.org                                                                    # no record
> curl -s -o /dev/null -w '%{http_code}\n' -X POST https://councilof.ai/api/gate       # 404
> ```

```bash
npm i @csoai/layer0                            # 404 today — see the note above
export CSOAI_API_BASE=https://your-gateway     # api.csoai.org has no DNS record
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

Backend: `api-server/` (Express) + `api-server/a2a.js` in the source repository; it is not served publicly. Home: https://councilof.ai/layer0/

## Licence

Apache-2.0 from 0.2.0 (see `LICENSE` and `NOTICE`). Earlier versions remain MIT.
