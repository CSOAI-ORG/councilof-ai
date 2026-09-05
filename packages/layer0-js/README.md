# @csoai/layer0

Make any tool, MCP server, package or plugin **Layer‑0‑governed + A2A‑ready** in ~15 lines.
Every governed action passes the CSOAI **Sovereign Gate** (policy/identity/human‑in‑loop), then
emits an **Ed25519‑signed attestation** you (or any auditor) can verify offline — and a signed
**A2A envelope** other governed agents can trust.

> **NOT PUBLISHED, AND THE DEFAULT HOST DOES NOT RESOLVE.** Probed 2026-09-05:
> `@csoai/layer0` returns **HTTP 404** on the npm registry, and `api.csoai.org` is **NXDOMAIN** —
> no DNS record at all. The install line below cannot work today and the default `CSOAI_API_BASE`
> points at nothing. The design below is real and unchanged; what is not real is that you can run
> it. Set `CSOAI_API_BASE` to a gateway that exists, and expect the install to fail until this
> package is published.
>
> ```
> curl -s -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/@csoai%2flayer0   # 404
> host api.csoai.org                                                                    # NXDOMAIN
> ```

```bash
npm i @csoai/layer0                            # 404 today — see the note above
export CSOAI_API_BASE=https://your-gateway     # api.csoai.org does not resolve
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

Backend: `api-server/` (Express) + `api-server/a2a.js`. MIT. https://csoai.org
