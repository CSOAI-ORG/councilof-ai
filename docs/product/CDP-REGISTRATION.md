# CDP facilitator — what is built, and the one thing it waits for

The Coinbase Developer Platform is the **second** x402 index. We are in PayAI and absent from CDP:
a full enumeration of `/platform/v2/x402/discovery/resources` on 2026-09-06 read `pagination.total`
16540 and found **0** rows matching `csoai` or `councilof`.

Absence there is mechanical, not neglect. **A resource is catalogued off a CONFIRMED SETTLE through
that facilitator.** Our settles go through PayAI, so PayAI lists us and CDP does not. There is no
registration endpoint on either index to call instead — you cannot ask to be listed, you settle and
the index notices.

## What is already wired

`functions/api/_cdp_jwt.ts` mints a CDP bearer and `functions/api/_x402.ts` calls it on every
facilitator request:

```
const jwt = await maybeMintCdpJwt(env, facilitator, method, path);
if (jwt) h.authorization = `Bearer ${jwt}`;
else if (env.X402_FACILITATOR_TOKEN) h.authorization = `Bearer ${env.X402_FACILITATOR_TOKEN}`;
```

The gate is credential presence, and it is deliberately quiet:

- not a CDP host → `null`, the rail is unchanged
- CDP host but no `CDP_API_KEY_ID` / `CDP_API_KEY_SECRET` → `null`, the rail is unchanged
- a malformed secret → `null`, never a throw. A credential problem degrades to "no auth header",
  which the facilitator answers with a 401 that the caller already reports as a settle failure.
  Fail-closed beats a 500 in the middle of someone's payment.

Nine unit cases in `functions/api/_cdp_jwt.test.ts` cover the 64-byte and bare 32-byte secret
exports, a wrong-length key refused loudly rather than minting a token that 401s later, a signature
that verifies under the key's public half, `/verify` and `/settle` binding to different tokens, and a
malformed secret swallowed instead of throwing mid-settlement.

## The one thing it waits for — OWNER ASK 3

Two values, created in the signed-in browser, installed by the owner. **The agent never types them.**

1. portal.cdp.coinbase.com → API keys → Create API key, name `csoai-x402-bazaar`
2. put the id and secret into Cloudflare Pages env for `councilof-ai` as `CDP_API_KEY_ID` and
   `CDP_API_KEY_SECRET`
3. and into the repo: `gh secret set CDP_API_KEY_ID`, `gh secret set CDP_API_KEY_SECRET`
4. set `X402_FACILITATOR_URL` to the CDP facilitator to route settles through it

Nothing else changes. The moment those exist, the next settle mints a CDP JWT, CDP sees a confirmed
settle, and the resource enters the second index. Until then every code path above returns `null` and
the rail behaves exactly as it does today.

## Why the second index is worth the two clicks

Measured on 2026-09-06 over our own 3,520-host census: CDP hosts are **343 of 1856 conformant
(18.5%)** against PayAI's **82 of 1774 (4.6%)**, and only **110 of 3520 (3.12%)** hosts appear in
both. It is the larger index and the better-behaved one, and we are in neither position on it.

## Proof

```
curl -s 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources?limit=100&offset=0' \
  | jq '.pagination.total'                      # 16540
# paginate all 166 pages, grep -ci 'councilof\|csoai'   -> 0
grep -n 'maybeMintCdpJwt' functions/api/_x402.ts        # the call site on the settle path
npx vitest run functions/api/_cdp_jwt.test.ts           # 9 cases
```
