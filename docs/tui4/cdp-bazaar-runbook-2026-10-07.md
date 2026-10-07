# CDP Bazaar Indexing — Owner Runbook (staged 2026-10-07)

**Goal:** get `https://councilof.ai` resources into the Coinbase CDP Bazaar
(23,000+ resources, feeds CDP APIs, Bazaar MCP server, Amazon Bedrock AgentCore,
agentic.market).

**Status: STAGED. Everything that needs no credentials or money is already verified.**
This runbook starts at the first thing that needs your hands. Nothing here changes the
live rail: the edge stays on the PayAI facilitator, no env var, no deploy, no code change.

---

## What was verified for free (2026-10-07 ~04:45 UTC, anonymous)

| Check | Result |
|---|---|
| `GET .../v2/x402/discovery/merchant?payTo=0x2126864…` | `total: 0` — absent today |
| `POST .../v2/x402/validate` on `/api/proof?bundle=1` | **`valid: true`, `simulation.outcome: "accepted"`**, our `extensions.bazaar` block extracted intact (input schema + output example) |
| Free door via same validator | `valid: false` — Coinbase does not catalogue $0 discovery-only flows (their docs, by design) |
| Registration mechanism | **No form.** Indexing fires on the **first successful settle through the CDP facilitator** with `paymentPayload.resource` set (settle, not verify) |
| Facilitator endpoint | `https://api.cdp.coinbase.com/platform/v2/x402` — **"Requires CDP API keys"** (their Network Support page) |
| Facilitator pricing | 1,000 tx/month free, then $0.001/tx; gas paid on-chain separately |

## Why there is no env-flip

Two ways to produce that first CDP settle:

- **Option A (chosen — no production touch):** call CDP `/verify` + `/settle` **directly**
  ourselves with `paymentPayload.resource = "https://councilof.ai/api/proof?bundle=1"`.
  The facilitator never calls the resource server back; indexing is a side effect of settle.
  The edge keeps serving PayAI. One self-settled $0.01 transfer, payTo = ourselves.
- Option B (deferred — owner routing decision): flip the Pages env to CDP so *clients*
  settle through CDP. **No code change is needed** — the edge is already CDP-code-complete:
  `functions/api/_cdp_jwt.ts` mints the per-request Ed25519 JWT CDP v2 requires
  (header `{alg:EdDSA, typ:JWT, kid, nonce}`, claims `{sub, iss:"cdp", aud:["cdp_service"],
  nbf, exp: now+120, uri: "METHOD host/path"}`), fail-closed when credentials are absent.
  Three Pages env entries flip it: `X402_FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402`,
  `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET` (base64 Ed25519 64B seed‖pubkey). Documented in the
  module itself: *setting only the URL would produce facilitator /verify HTTP 401 on every
  paid request*. It is deferred because it changes where EVERY live settlement routes —
  a live-rail decision, disproportionate to an indexing goal. (Note: `X402_FACILITATOR_TOKEN`
  static bearer CANNOT auth to CDP — per-request JWT only.)

Option A's settlement is `INTERNAL_SELF_FUNDED` — it buys an index row, **never revenue**.

## Your steps (in order)

1. **Create CDP API credentials** — <https://portal.cdp.coinbase.com> → API keys → create.
   Export (names only, values never in chat/logs):
   ```bash
   export CDP_API_KEY_ID="…"
   export CDP_API_KEY_SECRET="…"   # EC key PEM the SDK/JWT auth uses
   ```
   Auth scheme is already known from our own shipped `_cdp_jwt.ts`: **`Authorization: Bearer <JWT>`**,
   EdDSA, per-request (2 min TTL, `uri` claim binds method+host+path). `CDP_API_KEY_SECRET`
   is the base64 Ed25519 64-byte secret (seed ‖ pubkey).

2. **Fund/provide the signer** — the 11 Sep self-test burner wallet (or any wallet you
   control) holding ≥ $0.05 USDC + a little Base ETH for gas:
   ```bash
   export CDP_INDEX_SIGNER_KEY="…"   # the EIP-3009 authorizer's private key
   ```

3. **Run the settle** (script below, or equivalent via `@x402/evm`):
   ```bash
   python3 scripts/x402/cdp_index_settle.py --dry-run   # no creds needed; prints the plan
   python3 scripts/x402/cdp_index_settle.py             # verify → settle → index check
   ```
   Script status: **staged, E2E-untested** (no credentials on the operator machine — by design).
   With creds absent it exits 2 with an honest BLOCKED message and attempts nothing. Its JWT
   contract is copied from `functions/api/_cdp_jwt.ts`; its EIP-3009 payload mirrors what
   clients send our edge. First real run may surface a dialect detail — fail-closed paths
   exit before any money moves (verify comes before settle).

4. **Verify indexing** (free, no key):
   ```bash
   curl -s "https://api.cdp.coinbase.com/platform/v2/x402/discovery/merchant?payTo=0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31" | jq '.pagination.total'
   # expect >= 1 within ~10 minutes (their cache)
   ```

## Cost

| Item | Cost |
|---|---|
| CDP API key | $0 (free tier) |
| Facilitator fee | $0 (within 1,000 tx/month free tier) |
| The settlement itself | **$0.01 USDC → to our own payTo** (self-transfer) |
| Base gas | ≈ $0.001 (negligible) |
| **Total** | **≈ $0.01, self-funded, classified INTERNAL_SELF_FUNDED — never revenue** |

## After indexing (optional, owner's call)

- Ranking: new endpoints rank conservatively; 30-day rolling activity window applies —
  a real client settlement through CDP later keeps it warm (that would be Option B).
- Curation ("hand-selected featured tier") requires live payments, ≥99% availability,
  complete schemas — our validate result already passes the metadata bar.

## Honesty notes

- A self-settled index row is **not** a customer, **not** revenue, **not a purchase**.
- Absence before this run was proven (merchant `total: 0`); presence after must be
  read back the same way before anyone claims it.
- `bazaar.x402.org` (the old PayAI/CDP bazaar host cited in older notes) **no longer
  resolves**; `api.x402scan.com` 404s. The live surfaces are the CDP endpoints above
  plus the permissionless Agent Bazaar (`bazaar.saylorinnovations.com`, attempted
  2026-10-07, service returning CF 1101 — retry pending).
