# Self-serve RAS doors

Lane `x402-ras-doors-20260925`. On 25 Sep 2026 the owner asked: "can't we self-serve all x402 for
all this? index and do it ourselves?" This lane adds three paid doors and two free companions.
Each paid door runs one piece of computation on request and returns an Ed25519-signed receipt.
Each free door either verifies a receipt or points to the index.

The doctrine these doors carry in code, each backed by a test in `functions/api/ras/ras.test.ts`:

- **Money only for delivered computation.** A paid request runs the computation first, then signs,
  then settles, then delivers. If our side could not run it (DNS unreadable, RPC down, signer
  error), it answers the 402 again with the reason and settles nothing.
- **A failure is still a delivered result.** A probe that finds bad news about the target is a
  result: UNREACHABLE, NOT_MCP, AUTH_REQUIRED, MCP_ERROR, TIMEOUT, NOT_CONFORMANT or REJECTED. It
  is delivered and settled as that result. A paid probe never turns a FAIL into anything else.
- **Payment never changes a result.** The computation never sees the payment header. A test runs
  two different payments against the same target and gets byte-identical results, apart from the
  clock.
- **Nothing paid reaches the board.** No door writes to the GSPC board, the public root or any
  card index. The only write is the `REVENUE_KV` counter every metered door keeps.
- **Verification is free forever.** `/api/verify` imports nothing from the x402 rail and never
  answers 402. A test asserts this.
- **We never "certify".** Every receipt passes the `VERDICT_RE` guard from `rwa/evidence.ts`, and
  the guard reads only our own wording. Strings from the target or the buyer are excluded from it.
- **No public $ prices.** An amount appears only inside the 402 `accepts[]`, and only as
  machine-readable x402 payment requirements. The SKU is `ras_fresh_read:per_read` in
  `functions/api/_skus.ts`. Its default is an ESTIMATE anchored on the request_attestation atom,
  and the owner can override it with `X402_PRICE_RAS_FRESH_READ_USD`. Because this is fresh
  computation, the SKU is deliberately left out of the existing-data promo. No page, doc or
  manifest in this lane contains a typed price.

## The five routes

| Route | Paid? | What it does | What it does NOT show |
|---|---|---|---|
| `GET /api/ras/mcp-probe?url=` | x402 | Runs one read-only MCP discovery: `server/discover` (2026-07-28) first. If that gives no result, it sends `initialize` (2025-06-18), then `notifications/initialized`, then `tools/list` (at most 5 pages). Returns the state (RESPONDED / AUTH_REQUIRED / NOT_MCP / MCP_ERROR / UNREACHABLE / TIMEOUT), the requested and negotiated protocol version, the tool count, a sha256 of the sorted tool names, and a signed receipt. | Anything a tool does. It never sends `tools/call`, `prompts/get` or `resources/read`. It gives no grade, rank or safety judgement and writes no board cell. |
| `GET /api/ras/x402-check?url=` | x402 | Makes one live GET, scored by the daily census rule. The rule is ported from `scripts/census/x402-bazaar-conformance.py` `probe()`: HTTP 402, plus a PAYMENT-REQUIRED header, plus `x402Version` 2 in the BODY, plus `extensions.bazaar` in the BODY. The header's own reading is kept beside the result. Returns the census row verbatim, the state (CONFORMANT / NOT_CONFORMANT / UNREACHABLE) and a signed receipt. | The seller's honesty, product quality or price, or whether the door delivers after payment. Nothing is paid to the target. |
| `GET /api/ras/supply?asset=USDC&ledger=` | x402 | Makes a fresh `totalSupply()` read. The address is parsed from Circle's page on the request, never typed. On Ethereum it finds the storage slot empirically, fetches `eth_getProof`, checks the account and storage proof against the header's `stateRoot` inside the Worker, recomputes the header hash and runs a second-operator read. If all of that holds, the result is STATE_PROOF_VERIFIED. Other EVM ledgers on the issuer list return OPERATOR_API. A `symbol()` that does not match returns REJECTED. | A reserve attestation, backing, redeemability, solvency, a rate or a grade. The header is not checked against consensus, because there is no light client. |
| `GET /api/verify?record_url=` | **free** | Re-fetches a councilof.ai / csoai.org record, gives the sha256 of the exact bytes served and verifies the signature under the PINNED keys. `POST` now also verifies card-v0 leaves, which is what RAS receipts, population-door leaves and wrapper cards are. | A certification of anything. It never fetches hosts outside the estate. |
| `GET /api/x402/index` | **free** | Serves the latest SIGNED daily conformance index: the card-v0 leaf at `X402_INDEX_SIGNED_URL`, else at the HF alias `signed/index-latest.json`, once it verifies under a pinned board key. Until then it answers `INDEX_PENDING` and points to the latest UNSIGNED census run: its URL, date, as_of and the sha256 of the bytes read. | An invented or re-assembled list. It never re-serves an unsigned run's numbers as the index. |

Measured state on 25 Sep 2026: the daily census on HF `csoai/x402-bazaar-conformance`
(`summary-latest.json`, 2026-09-24) is **unsigned**. Its own method line says "Nothing signed".
No flywheel lane on Oracle produces a signed run (`~/lanes/flywheel` does not exist), so
`/api/x402/index` answers `INDEX_PENDING` today.

**Update 27 Sep 2026.** oracle-micro-2 `~/lanes/flywheel/flywheel_x402_index.py` signs the day's
published summary (pinned by that day's signed release manifest) through `POST /api/board-sign`
with the pod caller token and publishes `signed/index-<date>.json` plus the alias
`signed/index-latest.json` to HF `csoai/x402-bazaar-conformance`. The x402-daily job runs it after
it publishes. The door reads that alias by default (`DEFAULT_SIGNED_URL`); a 404 there is still
`INDEX_PENDING`. First signed leaf: 2026-09-27, payload sha256 `6bfa6ac7…c122` (re-issued the same day with the summary's host-naming `producer` string replaced by a neutral line; the full summary stays pinned by sha256).

### Code map

- `functions/api/_ras_door.ts` handles the shared order: 402 → input check → compute → sign → settle → deliver.
  It adds no payment logic. It calls `buildPaymentRequiredV2`, `paymentRequiredResponseSigned`,
  `verifyX402Payment(…, { bazaar })` (verify → settle through the configured facilitator, v2 plus the
  echoed `extensions.bazaar`), and `signPayload` from `functions/_lib/cardSign.ts`, which applies the
  same rule as `/api/board-sign` under `did:web:csoai.org#board-attestation-1`. These are the same
  calls `/api/wrapper` and `/api/pop/*` make.
- `functions/api/_ras_net.ts` is the only path that fetches a URL a buyer named (the SSRF guard, below).
- `functions/api/_evm_proof.ts` holds keccak-256 (32-bit lanes), RLP, the Merkle-Patricia walk, the
  header hash and EIP-1186. It is a line-for-line port of `scripts/readers/cross_ledger_supply.py` from
  lane `cross-ledger-usdc-20260925`. It is tested against that lane's committed Ethereum proof
  fixture and against a BigInt reference of the permutation.
- `functions/api/_ras_schemas.ts` holds the output schemas. `/.well-known/x402.json` uses them for
  `resources[].outputSchema`, `accepts[].outputSchema` and `free_doors[]`.
- Each handler calls `x402Accepts(… skuId: "ras_fresh_read", tier: "per_read" …)` itself, so that
  `scripts/build_openapi.py` `handler_sku()` can read the SKU from source.

### SSRF guard (`_ras_net.ts`)

The guard checks every hop before fetching it. It refuses:

- any scheme but https, any port but 443, and credentials in the URL
- localhost, single-label names and `*.local|.localhost|.internal|.intranet|.lan|.corp|.home.arpa|.private`
- IP literals in loopback, RFC 1918, CGNAT, link-local (including `169.254.169.254`), `100.100.100.200`,
  the Azure wireserver `168.63.129.16`, multicast, reserved, documentation and benchmark ranges.
  For IPv6 this covers `::1`, ULA (including `fd00:ec2::254`), link-local, and the IPv4-mapped,
  NAT64, 6to4 and Teredo forms. The WHATWG parser normalises `2130706433` and `0x7f.0.0.1` first,
  so those spellings are caught too.
- public names whose A or AAAA answers (read over DoH) include any such address
- redirects to any of the above. Redirects are followed by hand and each Location is re-checked,
  with a hop cap. MCP POSTs follow only 307/308.

Other limits:

- If DNS cannot be read, the guard fails closed: the answer is 503 and nothing is settled.
- Timeouts are 10 s for MCP and 12 s for x402, matching the census. Bodies are capped at 1 MiB.
- Residual risk, stated plainly: there is a DNS-rebinding window between our DoH read and the
  runtime's own resolution. The edge's routing is the second layer of defence for that window.

## Tests (this lane, Oracle, node 20, vitest 4.1.11)

- `functions/api/ras/ras.test.ts`: 88 pass. It covers the SSRF syntax table (29 refused, 4 accepted),
  DNS-to-private, any-bad-record, DoH-down fail-closed, redirect to the metadata IP (never fetched),
  redirect to a name that resolves privately, the redirect cap and the body cap. It checks the 402
  exact-scheme fields in both the body and the PAYMENT-REQUIRED header, that nothing is computed
  before payment, and that refused input never reaches the facilitator. It covers
  FAIL-still-delivered (NOT_MCP, AUTH_REQUIRED, MCP_ERROR, UNREACHABLE, NOT_CONFORMANT, REJECTED),
  that a failure on our side does not settle, and that a failed settle releases nothing. It checks
  that payment does not change the result, the legacy handshake, and census-rule parity. It covers
  keccak vectors, the BigInt cross-check (80 random inputs), the committed EIP-1186 fixture and header hash, a wrong
  root and a tampered value. It checks that verify is free, POST and GET, and verifies card-v0. It
  covers index PENDING, SIGNATURE_INVALID and 404, and the manifest and catalogue entries.
- Proof that the guard bites: removing the link-local check from `isNonPublicV4` turns 5 tests red.
- `functions/api/ras/ras.live.test.ts` (`RAS_LIVE=1`) stubs only the facilitator HOST, so the real
  verify → settle code runs and no money moves. The run on 25 Sep 2026 passed 8 of 8:
  - `councilof.ai/mcp`: RESPONDED, modern 2026-07-28, 13 tools.
  - `mcp.deepwiki.com/mcp`: RESPONDED, legacy fallback to 2025-06-18, 3 tools.
  - `councilof.ai/api/free-door` and `2s.io/api/geocode/address`: CONFORMANT.
  - USDC on Ethereum: STATE_PROOF_VERIFIED at block 26054169. Slot 11, account and storage proofs
    verified in the Worker code, header hash recomputed, two operators agree.
  - USDC on Base: OPERATOR_API.
  - A published signed card through `?record_url=`: VALID.
  - Index: INDEX_PENDING, pointing at the 2026-09-24 unsigned run.

## Post-deploy checklist (the landing lane runs this; nothing here was called)

1. **Buyer's-eye probe.** Call every new `resources[].url` in `/.well-known/x402.json` exactly as
   published. Each must answer 402 with a PAYMENT-REQUIRED header. `/api/verify?record_url=…` and
   `/api/x402/index` must answer 200.
2. **Rail proof.** Run `python3 scripts/x402-rail-proof.py https://councilof.ai/api/ras/x402-check`
   and expect `invalid_exact_evm_insufficient_balance`, which means the rail can earn. Repeat for
   the other two doors.
3. **402 Index.** Registration is authless: `POST https://402index.io/api/v1/register` with
   `{url, name, protocol:"x402", http_method:"GET", description, payment_asset, payment_network,
   provider, category}`, limited to 10 per hour per IP, and it returns 201 pending review. The pod
   loop `/workspace/lanes/loops/register-402index.py` (daily 02:20Z) registers any new
   `.well-known/x402.json` resource on its own. Register by hand only if the loop is down. This lane
   did NOT call it.
4. **PayAI Bazaar.** A listing comes from a real **v2** settle that carries `extensions.bazaar`. The
   doors already echo the block (`verifyX402Payment(…, { bazaar })`). The pod's settle loop walks
   the manifest. Confirm the result through `/api/x402-listing`, not through a settle success. Note
   that PayAI `/stats` answers 200 for doors that do not exist.
5. **CDP Bazaar (Coinbase), owner-gated.** Entry requires a settle through CDP's facilitator
   (`api.cdp.coinbase.com/platform/v2/x402/{verify,settle}`). Those endpoints return 401 without a
   per-request CDP JWT. The minting code exists (`functions/api/_cdp_jwt.ts`, `CDP_API_KEY_ID` /
   `CDP_API_KEY_SECRET`), but a **Coinbase Developer Platform API key is an owner signup**.
   Reading CDP's index is keyless (`discovery/merchant?payTo=…`). Once the key is set, one v2
   settle per door with the bazaar block writes that door's record. The record is written once and
   never refreshed, so check the description before the first settle.
6. **OpenAPI and capability registry.** Run `python3 scripts/build_openapi.py --fetch
   --fetch-challenges` to refresh the x402scan fixtures from live, then run the build without flags
   and commit `public/openapi.json`. Run `node scripts/capability-seed.mjs` if the registry is
   seeded from the manifest.
7. **Signed index (producer, not this lane).** Sign the daily census summary as a card-v0 leaf
   under the board key (payload ≤ 3072 canonical bytes), publish it on councilof.ai or the csoai HF
   org, and set `X402_INDEX_SIGNED_URL` on Pages. `/api/x402/index` then serves it as SIGNED once
   the signature verifies under the pinned key.

## Not done here, on purpose

- **No MCP paid tools.** `functions/mcp/paid-tools.json` drives the MCP tool fleet, whose names are
  locked by `tool-fleet.lock.json` and mirrored in 13 per-tool A2A cards and HF counts. Adding
  three tools is a fleet change and belongs in its own lane. The A2A `x402-discovery` skill serves
  `/api/x402`, so it already lists the new doors.
- **No price decision.** The ESTIMATE default stays until the owner sets the env override.
