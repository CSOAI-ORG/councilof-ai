# W2 — server-signed offers and receipts on the x402 rail

**Spec pinned:** `x402-foundation/x402` @ `69652a69798f0b08f95bef33318896e36e210f7e`,
`specs/extensions/extension-offer-and-receipt.md` — extension version **0.6** (2026-02-04), commit
dated 2026-07-23 and, checked 2026-09-06, **HEAD for that file**. `coinbase/x402` redirects to the
same object; the repository moved under the Linux Foundation's x402 Foundation on 14 Jul 2026 and
`coinbase/x402` is now an alias, so cite the foundation path.

Read it here:
<https://github.com/x402-foundation/x402/blob/69652a69798f0b08f95bef33318896e36e210f7e/specs/extensions/extension-offer-and-receipt.md>

---

## 1. The key decision, and why it is not the one the brief expected

**The brief asked what to do "if the extension mandates EIP-712 secp256k1". It does not.**

§3.1.1 defines two formats, `eip712` and `jws`, as equal alternatives. §3.3 requires a JWS header to
carry `alg` and `kid` and gives **`EdDSA` as an example algorithm by name**. §4.5.1 lists, as one of
four named signer-authorization mechanisms, "**DID document (`did:web`)**: the service publishes the
signing key in a DID document at `/.well-known/did.json` associated with the `resourceUrl` domain.
Verifiers resolve the DID URL in `kid` and confirm the key is listed in `verificationMethod`."

That is exactly what this estate already had. So:

> **Ed25519/JWS under `did:web:csoai.org#board-attestation-1` is SPEC CONFORMANCE, not a CSOAI
> dialect.** No named extension was needed for the signing, and inventing one would have understated
> what we ship.

### Which key the edge actually holds — measured, not assumed

| question | answer | how it was established |
|---|---|---|
| Does the **edge** hold a signing key at request time? | **Yes.** Cloudflare Pages secret `BOARD_SIGN_KEY_PKCS8_B64` | `functions/api/board-sign.ts`, `_lib/cardSign.ts`, `functions/api/fines.ts`, `methodology.ts` all read it from `env` |
| Is it set in **production**, not just declared? | **Yes** — probed 2026-09-06 | `curl -s https://councilof.ai/api/methodology` → `site_attestation.alg = "Ed25519"`, a real `sig`, and `public_key_x = k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA` |
| Does its `kid` resolve in `did.json`? | **Yes** | that same `public_key_x` is byte-identical to `verificationMethod[2].publicKeyJwk.x` for `did:web:csoai.org#board-attestation-1` in `public/.well-known/did.json` |
| Curve | **Ed25519** (OKP). `did.json`: "Born and held in Cloudflare; the private half never leaves." |
| Is this the OIDC signer? | **No, and the two must not be confused.** `BOARD_SIGN_KEY` in GitHub Actions is absent by design — that path signs by OIDC. This is a different, edge-held secret. A receipt must be signed by a key the edge has **at request time**, and this one is. |

### secp256k1 / EIP-712: what provisioning it would take

We hold **no** secp256k1 signer at the edge. `payTo`
(`0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31`) is a MetaMask receive address; the edge never touches
its private half, and §4.5.1 warns against reusing a `payTo` key for signing anyway. To emit
`eip712` offers and receipts an owner would have to, in this order:

1. **Mint** a fresh secp256k1 keypair off-machine (never in this repo, never in CI logs).
2. **Set** it as a Cloudflare Pages secret on the `councilof-ai` **production** environment
   (Settings → Environment variables → Production), e.g. `X402_EIP712_SIGNER_PRIVKEY`.
3. **Publish the public half** in `public/.well-known/did.json` as a new `verificationMethod` —
   `EcdsaSecp256k1VerificationKey2019` or a `did:pkh` — with a new fragment such as
   `#x402-eip712-1`, add it to `assertionMethod`, and mirror the same fragment to the
   **csoai.org** copy (DID resolution reads `https://csoai.org/.well-known/did.json`, per the
   `_gspcBoardKeyNote` already in that file).
4. **Record it in `KEY-CONTINUITY.md`** — the estate's rule is two signing identities with stated
   scope; a third arrives by ruling, not by drift.

Until all four happen, `eip712` is **declared absent** on every discovery surface rather than
faked. A format we cannot produce is better published as missing.

**What is a NAMED CSOAI extension** (ours, versioned, never claimed as spec):

| artefact | schema | what it is |
|---|---|---|
| the storage envelope beside `settled:tx:*` | `csoai.x402.receipt-record/0.1` | wraps the spec receipt and adds `amount_atomic`, `asset`, `self`, `zero_value` — things the spec deliberately omits. Nothing in it is signed except the receipt it wraps. |
| `GET /api/receipts?payer=` | `csoai.receipts.by-payer/0.1` | our read door |
| `POST /api/receipts/verify` | `csoai.x402.receipt-verdict/0.1` | our convenience verifier |
| the public-root leaf | `csoai.x402.receipt/0.1` on surface `receipts.v1` | our Merkle commitment |
| the 402 sidecar | `csoai.offer_receipt` (top-level `csoai`, never inside `extensions`) | says whether this 402 was signed and why not, if not |

---

## 2. Spec ↔ implementation, field by field

### 2.1 Common object shape (§3.1, §3.1.1)

| spec field | required | our value | where |
|---|---|---|---|
| `format` | yes | `"jws"` always | `_x402_offer.ts` `signOffer`, `_x402_receipt.ts` `signReceipt` |
| `payload` | **eip712 only — MUST be omitted for jws** | omitted | asserted: "omits `payload` beside the JWS (§3.1.1 — MUST for format jws)" |
| `signature` | yes | JWS Compact Serialization | `_x402_jws.ts` `signJws` |
| `acceptIndex` | no, offers only | present, unsigned | `SignedOffer.acceptIndex` |

### 2.2 JWS header (§3.3)

| field | spec | ours |
|---|---|---|
| `alg` | required; `ES256K`, `EdDSA` named as examples | `"EdDSA"` |
| `kid` | required; key identifier (DID URL) | `"did:web:csoai.org#board-attestation-1"` |
| anything else | — | **nothing else.** Header is exactly `{alg, kid}`, JCS-canonicalised. |

### 2.3 Offer payload (§4.2)

| field | type | req | ours | note |
|---|---|---|---|---|
| `version` | number | ✔ | `1` | rejected if not 1 |
| `resourceUrl` | string | ✔ | door URL, **query stripped** | an offer commits to the resource, not to one call's arguments |
| `scheme` | string | ✔ | `"exact"` | from `accepts[].scheme` |
| `network` | string CAIP-2 | ✔ | `eip155:8453` | §4.2 note is a MUST: `toCaip2Network()` converts `base` → `eip155:8453`, `base-sepolia` → `eip155:84532` |
| `asset` | string | ✔ | USDC on Base | from `accepts[].asset` |
| `payTo` | string | ✔ | `X402_PAY_TO` or estate default | **null ⇒ no offer emitted.** No address means no terms to commit to |
| `amount` | string | ✔ | atomic units | §4.2 note: `maxAmountRequired` copied to `amount` for a v1 entry. Non-integer ⇒ no offer |
| `validUntil` | number | optional | `now + 900` | §4.6; a verifier MUST treat `0` as absence (§4.3) — `verifyOffer` does |

### 2.4 Offer placement (§4.1, §4.1.1)

| requirement | ours |
|---|---|
| `extensions["offer-receipt"].info.offers[]` | exact |
| schema block beside it | reproduces §6.3 **verbatim**, asserted by `toEqual` |
| ordering SHOULD match `accepts[]` | it does, and `acceptIndex` records the index |
| `acceptIndex` MUST NOT be relied on for integrity | it is outside the signed payload; a test asserts `payload.acceptIndex === undefined` |
| clients MUST match by payload fields | our verifier never reads `acceptIndex` |

### 2.5 Receipt payload (§5.2) and placement (§5.1)

| field | req | ours |
|---|---|---|
| `version` | ✔ | `1` |
| `network` | ✔ | CAIP-2 (MUST convert — we do) |
| `resourceUrl` | ✔ | door URL, query stripped |
| `payer` | ✔ | as the facilitator reported it. **No payer ⇒ no receipt**, and `receiptGap` says so — there is nothing honest to put in a required field |
| `issuedAt` | ✔ | unix seconds at signing |
| `transaction` | optional | **included** when the facilitator returned one. §5.2 allows it "when stronger verifiability is preferred over privacy"; a rail whose whole claim is that a stranger can check it should take the check |
| placement | | `extensions["offer-receipt"].info.receipt` inside the SettlementResponse — for us, the base64 JSON of `X-PAYMENT-RESPONSE` |
| "returned **only on success**" | | issued inside the `success === true` branch of `verifyX402Payment`, after `/settle` |
| schema block | | reproduces §6.7 **verbatim** |

Note on empty-string optionals: §5.3's "set unused fields to `""`" is explicitly **EIP-712 only**
("This rule applies only to EIP-712 signing, where fixed schemas require all fields to be
present"). For JWS we **omit** `transaction` entirely rather than sign an empty string.

### 2.6 Verification (§4.5, §5.5) and signer authorization (§4.5.1)

| spec step | ours |
|---|---|
| parse compact JWS | `parseJws` — every failure returns a reason a verifier can echo |
| extract `kid`, base64url-decode payload | ✔ |
| check payload `version` | ✔ |
| resolve `kid` to a public key | injected `resolveKey(kid, resourceUrl)` — the caller owns the trust decision |
| verify signature over the complete payload | Ed25519 over `b64url(header).b64url(payload)` |
| confirm the key is **authorized** for `resourceUrl` | `resolveKidFromDid` — the key must be in `verificationMethod` of the DID doc, **and** the host must be one this document speaks for |
| `issuedAt` within verifier policy (§5.5.7) | future beyond 300 s ⇒ INVALID; **old ⇒ VALID.** Age is the reader's policy, never a validity fault |
| `transaction` MAY be checked on-chain (§5.5.8) | `scripts/verify_receipt.py --check-chain`; reports `UNCHECKED`, never guesses |

**The distinction the spec insists on**, and the test that proves we honour it: a receipt signed by
a freshly minted key for our `resourceUrl` verifies cryptographically and is worthless. Our verdict
for that case says `signer_authorised: false` and `"…is not listed in verificationMethod"`, and a
test asserts it does **not** say "signature does not verify".

### 2.7 Canonicalisation (§10)

"Implementations MUST ensure canonicalization rules are applied consistently (JCS for JWS payloads…)"
— `_x402_jws.ts` `jcs()`: keys sorted by UTF-16 code unit, compact separators, `undefined` dropped
(never emitted as `null`). Also §10: "Servers MUST NOT include the `signature` field in the payload
being signed" — asserted directly.

### 2.8 What we do **not** implement, said plainly

| §  | thing | why not |
|---|---|---|
| 3.1.1, 3.2, 4.3, 5.3 | the whole `eip712` branch | no secp256k1 signer at the edge (see §1) |
| 4.5.1 | DNS TXT `_controllers.<domain>`, on-chain key registries | `did:web` is one of the four named mechanisms and is the one we already publish |
| 4.5.1 (last ¶) | temporally-immutable authorization evidence at `issuedAt` | **a real gap.** `did.json` is mutable; a receipt verified after a key rotation is checked against today's document. The public root and its Rekor/OTS witness are the raw material for fixing this and are not yet wired to it. Not claimed as done. |

---

## 3. The 60-second buyer recipe

Nothing below needs an account, a key, or our permission.

```bash
# 1. Read a signed offer straight out of a live 402 (the free door costs zero).
curl -s https://councilof.ai/api/free-door \
  | jq -r '.extensions["offer-receipt"].info.offers[0].signature'

# 2. Check it yourself. This reads https://csoai.org/.well-known/did.json and contacts nobody else.
curl -sO https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/master/scripts/verify_receipt.py
python3 verify_receipt.py --url https://councilof.ai/api/free-door

# 3. Or have us check it, and compare the two answers. If they differ, believe step 2.
curl -sX POST https://councilof.ai/api/receipts/verify \
  -H 'content-type: application/json' \
  -d "{\"offer\":\"$(curl -s https://councilof.ai/api/free-door | jq -r '.extensions["offer-receipt"].info.offers[0].signature')\"}" | jq

# 4. After paying any door, your receipt is in the response header:
#    X-PAYMENT-RESPONSE -> base64 JSON -> extensions["offer-receipt"].info.receipt.signature
python3 verify_receipt.py --jws "<that string>" --check-chain

# 5. Your receipts, later:
curl -s "https://councilof.ai/api/receipts?payer=0xYOURWALLET" | jq '.status, .count'
```

Read `status` before `count`. `UNRECORDED` means that deployment has no receipt store bound — never
that you did not pay.

---

## 4. 48-hour runbook

Times are from merge. Every row has a PROOF command whose output decides pass/fail. Rows marked
**OWNER** need keystrokes nobody else can make.

### T+0 — merge and deploy

| # | step | who | PROOF |
|---|---|---|---|
| 1 | Merge PR `gov/w2-signed-offers-receipts` | **OWNER** (governor) | `gh pr view <n> --json state -q .state` → `MERGED` |
| 2 | GHA `deploy.yml` ships master | automatic | `gh run list --workflow=deploy.yml -L1 --json conclusion -q '.[0].conclusion'` → `success` |
| 3 | Apex serves the new build | automatic | `curl -sI https://councilof.ai \| head -1` → `HTTP/2 200` |

### T+1h — the offers are live

| # | step | PROOF (expect) |
|---|---|---|
| 4 | Every door signs its offer | `for d in free-door request-attestation evidence-bundle eunomia-data proof rwa/evidence art50/marking-evidence feeds/provider-diff receipts/batch; do printf '%-28s ' "$d"; curl -s "https://councilof.ai/api/$d" \| jq -r '.csoai.offer_receipt.signed // "no sidecar"'; done` → **nine `true`** |
| 5 | If any says `false`, read the reason, do not guess | the sidecar's `reason` names the cause. `no BOARD_SIGN_KEY_PKCS8_B64 is set…` ⇒ the Pages secret is not on that environment. `no accepts entry could be committed to` ⇒ `payTo` or amount |
| 6 | The header carries them too | `curl -si https://councilof.ai/api/free-door \| grep -i '^payment-required:' \| cut -d' ' -f2 \| base64 -d \| jq '.extensions["offer-receipt"].info.offers \| length'` → `1` |
| 7 | A stranger's check agrees | `python3 scripts/verify_receipt.py --url https://councilof.ai/api/free-door` → `VALID`, exit `0` |
| 8 | Our door agrees with the stranger | `POST /api/receipts/verify` with the same string → `"verdict":"VALID"` |
| 9 | Tamper goes red | flip the last character of the signature and re-run 7 → `INVALID`, exit `1`, reason `signature does not verify` |

### T+2h — discovery says it

| # | step | PROOF |
|---|---|---|
| 10 | `/.well-known/x402.json` declares the extension | `curl -s https://councilof.ai/.well-known/x402.json \| jq '.extensions["offer-receipt"] \| {supported, format, kid, spec_commit}'` → `true`, `jws`, the kid, `69652a69…` |
| 11 | `/api/x402` carries it | `curl -s https://councilof.ai/api/x402 \| jq '.rail.offer_receipt.kid'` |
| 12 | The A2A card carries it | `curl -s https://councilof.ai/.well-known/agent-card.json \| jq '.capabilities.extensions[] \| select(.uri \| contains("offer-and-receipt")) \| .uri'` |
| 13 | **Refresh the openapi fixtures against the LIVE site** — they were captured before this change and still describe unsigned 402s | `python3 scripts/build_openapi.py --fetch-challenges && python3 scripts/build_openapi.py && node scripts/producers-check.mjs` → all green, then commit `public/openapi.json` + `scripts/fixtures/x402scan/` |
| 14 | `llms.txt` says it | `curl -s https://councilof.ai/llms.txt \| grep -c 'offer-receipt'` → `≥1` |

### T+4h — a receipt actually exists

| # | step | who | PROOF |
|---|---|---|---|
| 15 | Confirm `REVENUE_KV` is bound on production | | `curl -s https://councilof.ai/api/revenue \| jq '.kv_bound'` → `true` |
| 16 | Settle once through a DOOR (not direct to the facilitator — the direct path writes no edge record, per SETTLED-DOORS-2026-09-06.md) | **OWNER** | `X402_MAINNET=1 SETTLE=1 X402_RESOURCE=https://councilof.ai/api/free-door X402_PAYER_KEY=<throwaway> bash scripts/grants/x402-testnet-loop.sh` |
| 17 | The response carried a signed receipt | | decode `X-PAYMENT-RESPONSE` → `.extensions["offer-receipt"].info.receipt.signature` is present |
| 18 | It verifies without us | | `python3 scripts/verify_receipt.py --jws "<it>" --check-chain` → `VALID` and chain `YES` |
| 19 | The ledger has it | | `curl -s "https://councilof.ai/api/receipts?payer=<throwaway>" \| jq '.status, .count'` → `"OK"`, `1` |
| 20 | **The One Number did not move** | | `curl -s https://councilof.ai/api/revenue \| jq '.one_number'` → unchanged. A zero-value or self settle is **not** a buyer. If this moved, stop and read the `zero_value` note in `_x402.ts` |
| 21 | Add the throwaway to `X402_SELF_WALLETS` | **OWNER** | Pages env; then re-check 20 |

### T+24h — it reaches the root

| # | step | who | PROOF |
|---|---|---|---|
| 22 | Set `REVENUE_KV_NAMESPACE_ID` as a GitHub Actions **variable** so the adapter can read KV | **OWNER** | `gh variable list \| grep REVENUE_KV_NAMESPACE_ID` |
| 23 | The hourly `public-root.yml` folds the leaf | automatic | `python3 scripts/adapters/x402_receipts.py` → `n_leaves ≥ 1`, `kv: read` |
| 24 | The leaf is signed and in the root | | `curl -s https://councilof.ai/root.json \| jq '[.leaves[] \| select(.surface=="receipts.v1")] \| length'` → `≥1` |
| 25 | **The privacy invariant held** | | `curl -s https://councilof.ai/root.json \| grep -ci '<the payer address>'` → **`0`**. If this is not zero, the root has published a buyer's wallet — revert the adapter before anything else |
| 26 | Mirror it so the leaf keeps landing | | `python3 scripts/adapters/x402_receipts.py --mirror` and commit `public/interop/x402-receipts/` |

### T+48h — the outward move

| # | step | who | PROOF |
|---|---|---|---|
| 27 | Census v2 gains the `signed_offer` column and re-runs the 316 hosts | | `scripts/grants/x402-settlement-census.py` records `yes/no/unparseable` per host; we are the `yes` |
| 28 | Decide on the upstream issue | **OWNER** | doctrine forbids pushing to others' repos. `docs/upstream/X402-OFFER-RECEIPT-ISSUE-DRAFT.md` is text only. Owner posts it or does not |
| 29 | Disclose to anyone the filing touches, in the same message | **OWNER** | — |

### Rollback

One revert of the merge commit restores the previous behaviour: `paymentRequiredResponseSigned`
falls back to an unsigned 402 on its own when the key is missing, so there is no half-state where a
door 500s. Receipts already written stay readable; nothing is deleted.

---

## 5. Known limits — stated here so nobody has to discover them

1. **A receipt proves a signature, not a payment.** It proves this server signed those bytes. The
   `transaction` field is a claim about Base; `--check-chain` is the only thing that tests it.
2. **Authorization is checked against today's `did.json`.** §4.5.1's last paragraph asks for
   temporally-immutable evidence at `issuedAt`. We do not have it wired. Named, not claimed.
3. **`root.json` alone cannot verify a receipt's signature** — only that we committed to bytes with
   that digest. That is the deliberate price of not publishing every payer (§2 of the adapter).
4. **`witness` is a tenth door** that also emits offers but is quarantined pre-release and absent
   from `/.well-known/x402.json`; the catalogue's count of **9** is the one to quote.
5. **openapi fixtures are captured, not synthesised.** Until runbook row 13 runs against the live
   site, `public/openapi.json` documents 402s that predate this change.
