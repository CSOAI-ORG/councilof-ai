# @csoai/layer0 — design prototype

This directory describes a proposed client for policy decisions and action receipts.
It is not an installation-ready gateway or evidence that an arbitrary tool is governed.
The examples below describe the intended API; they are not a verified deployment recipe.

For published evidence available through the current service, start at
[Connect](https://councilof.ai/connect/) or the
[embeddable evidence panel](https://councilof.ai/panel/).
The [workflow integration guide](../../public/interop/workflow-evidence-integration-2026-10-29.md)
separates evidence, human review and host enforcement.

> **Recorded availability check: 2026-09-28** (first probed 2026-09-05).
> `@csoai/layer0` returned **HTTP 404** on the npm registry; `api.csoai.org` (the default
> `CSOAI_API_BASE`) had **no DNS record**; and `https://councilof.ai` answered **404** on all three
> paths this client calls (`/api/gate`, `/api/a2a/route`, `/api/a2a/verify`). The install line
> below did not work in that check, and every method requires a compatible gateway.
> This is a dated observation, not a new availability probe. No later successful install
> and gateway acceptance result is recorded in this README.
>
> ```
> curl -s -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/@csoai%2flayer0   # 404
> host api.csoai.org                                                                    # no record
> curl -s -o /dev/null -w '%{http_code}\n' -X POST https://councilof.ai/api/gate       # 404
> ```

```bash
npm i @csoai/layer0                            # design example; 404 in the recorded check
export CSOAI_API_BASE=https://your-gateway     # requires a compatible gateway you operate
```

```js
import { Layer0 } from "@csoai/layer0";

const l0 = new Layer0({ identity: "did:csoai:acme", endpoint: "mcp://soc2-compliance-ai" });

// Intended API: a compatible gateway and tested host enforcement are prerequisites.
const { result, attestation } = await l0.governed(
  "evidence.collect",
  { repo: "acme/app" },
  async () => doTheWork()
);
// Intended result: verify the signer, exact subject, scope and covered bytes before use.
```

The conformance levels in `CSOAI_Layer0_A2A_Protocol.md` are design targets.
Calling `governed()` or `verify()` does not establish conformance without evidence from
the exact deployed gateway and host. A signature does not establish that an action
was authorised, that its claimed effect occurred, or that another agent should trust it.

| Method | Intended contract |
|---|---|
| `gate(action, inputs)` | Sovereign Gate decision: allow / allow‑with‑conditions / deny / escalate |
| `governed(action, inputs, run)` | gate → run → signed attestation (the common path) |
| `verify(envelope, peerKey?)` | verify an inbound A2A envelope |

Backend: `api-server/` (Express) + `api-server/a2a.js` in the source repository; it is not served publicly. Home: https://councilof.ai/layer0/

## Licence

Apache-2.0 from 0.2.0 (see `LICENSE` and `NOTICE`). Earlier versions remain MIT.
