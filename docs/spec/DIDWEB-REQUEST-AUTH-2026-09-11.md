# RAS — did:web Request-Auth Layer for Council of AI

**Date:** 2026-09-11 · **Status:** SPEC v0.1 — **not yet implemented** ·
**Register:** measurement, never certification.

## 0. Scope and non-goals (read first)

RAS authenticates **requests** to Council of AI agent surfaces. It answers one
question: *which DID signed these bytes, and was the signature fresh?*

Explicit non-goals — breaching any of these is a spec violation:

- **No new capabilities.** RAS authenticates; it does not authorize anything
  that was not already available. The MCP server (`https://councilof.ai/mcp`)
  stays **read-only**; RAS never becomes a write gate into measurement data.
- **Not certification.** A valid RAS signature is evidence of request
  provenance. It is not an assessment, grade, accreditation, or endorsement of
  the requesting agent or its operator.
- **Verification stays free and unauthenticated.** `/gspc-verify`,
  `GET /api/gspc`, `/signed/card_index.json`, receipt verification, and every
  published artifact remain reachable with no signature at all, forever. RAS
  adds an identity layer for callers who want one; it never walls off the
  public measurement surface.
- **No payment coupling.** x402 settlement is orthogonal; a paid caller gains
  no RAS privilege and a RAS-registered agent gains no payment discount.

## 1. Agent identity: did:web resolution

Agent identity is a `did:web` DID controlled by the agent's operator
(e.g. `did:web:agent.example.com`). The estate's own identity is
`did:web:csoai.org` (`https://csoai.org/.well-known/did.json`), which today
publishes five Ed25519 verification methods including
`#board-attestation-1` under an append-only continuity doctrine
(`_keyContinuity`).

**Resolution = fetch-and-pin:**

1. Resolve `did:web:<domain>` to `https://<domain>/.well-known/did.json`
   (path components map per the did:web method spec). HTTPS only; the TLS
   anchor is acknowledged in the threat model (§6).
2. On first sight of a DID, fetch the DID document, validate it, and **pin**
   the document hash plus the set of verification-method ids.
3. **Cache policy:** cache a resolved document for ≤ 300 s. A request arriving
   after cache expiry triggers re-resolution. A DID that fails to re-resolve
   keeps its last pinned document for a grace of 24 h, then the identity
   degrades to UNCHECKABLE — requests under it are treated as anonymous
   (never as authenticated; §5 failure semantics).
4. **Rotation handling (append-only doctrine):** key rotation is expressed by
   ADDING a new verification method and marking the old one superseded in the
   DID document — never by mutating a published key id in place. RAS verifiers
   MUST accept signatures from any currently-listed method and MUST reject
   signatures keyed to a method the document marks superseded after its
   supersession timestamp, except when verifying artifacts dated before
   supersession. A key id that disappears without a superseded record is a
   continuity break: treat the DID as UNCHECKABLE and log it, loudly.

## 2. Request signing — HTTP Message Signatures (RFC 9421)

Every authenticated request carries an RFC 9421 signature:

- **Algorithm:** Ed25519 (`ed25519` per RFC 9421 §3.3.3). No RSA, no ECDSA —
  one curve, matching the estate's existing key estate.
- **`keyid`:** the full DID URL fragment,
  e.g. `did:web:agent.example.com#key-1`. The verifier resolves the DID
  portion and looks the fragment up in the pinned document. A `keyid` whose
  DID does not resolve, or whose fragment is absent, fails closed (401).
- **Covered components** (minimum, all required):
  `"@method"`, `"@authority"`, `"@path"`, `"content-digest"`,
  plus `created` and `expires` signature parameters.
- **Body coverage:** any request with a body MUST carry
  `Content-Digest: sha-256=:<base64>:`, and `content-digest` MUST be in the
  covered components. A signed request whose body hash does not match is
  INVALID (401), never "close enough".
- **`Signature-Input` label:** `ras1`.

Example header shape:

```
Signature-Input: ras1=("@method" "@authority" "@path" "content-digest");created=1789000000;expires=1789000060;keyid="did:web:agent.example.com#key-1";alg="ed25519";nonce="9f3b…"
Signature: ras1=:…base64…:
Content-Digest: sha-256=:…:
```

## 3. Response signing — the estate board key

Responses to authenticated requests are signed by the estate with the same
profile:

- **Signer:** `did:web:csoai.org#board-attestation-1` (Ed25519, resolvable at
  `https://csoai.org/.well-known/did.json`).
- **Profile:** RFC 9421, label `ras1-resp`, covering `"@status"`,
  `"content-digest"`, `created`, `expires`.
- **Meaning, stated on every use:** the signature proves these bytes came from
  the estate's board key. It is an **integrity claim, not a truth claim** — the
  same register as the signed receipts extension. A signed response about a
  measurement is still only as good as the measurement it names.
- Responses to anonymous requests MAY be signed on the same profile; unsigned
  responses remain valid for every free endpoint.

## 4. Replay prevention

- **Freshness window:** `expires - created ≤ 300 s` at signing time, and
  verifiers enforce **≤ 60 s clock skew** on both parameters. A request
  outside the window is 401 `expired`.
- **Nonce:** every signature MUST carry a unique `nonce` parameter (≥ 128 bits
  random). The verifier keeps a **jti/nonce cache** keyed by
  `(keyid, nonce)` with TTL = max signature lifetime + skew. A repeated pair
  is 401 `replay`.
- **Cache duty is the verifier's.** A deployment without a working nonce cache
  MUST fail closed — reject authenticated requests rather than skip replay
  checks. Fail-open replay windows are worse than no auth layer.

## 5. Rate limits and failure semantics

**Per-agent rate limits, keyed by DID** (resolved DID, not raw keyid, so key
rotation does not reset quota):

| Tier | Identity | Posture |
|---|---|---|
| **anonymous** | no signature | the public baseline; free endpoints stay free; standard edge rate limits |
| **registered-agent** | valid RAS signature from a resolvable did:web | higher request ceilings on authenticated agent surfaces; no new capabilities |
| **authority** | registered-agent whose operator is a recognised regulator/authority (manual, published list) | unrestricted access to verification endpoints — which are free anyway; the tier exists so authority traffic is never throttled, nothing more |

**Failure semantics — never silent downgrade:**

- **401** — signature present but invalid: bad signature, unknown/unresolvable
  `keyid`, expired/outside skew window, replayed nonce, body-digest mismatch.
  The `WWW-Authenticate` header names the reason class. The request is NOT
  processed as anonymous — a failed signature is a loud failure, not a quiet
  tier change. (Silent downgrade would let an attacker strip value from a
  signed request's identity while still getting service.)
- **403** — signature valid, identity resolved, but the tier does not cover
  the surface (e.g. a non-authority DID on an authority-only operations
  endpoint). Authenticated ≠ authorized.
- **429** — rate limit for the DID's tier. `Retry-After` present. Rate
  limiting is never expressed as 401/403.
- **Absent signature on a public endpoint:** processed as anonymous, 200.
  Absent signature on a tier-gated endpoint: 401 `auth-required`.

## 6. Threat model

- **Key compromise → rotation.** Operator rotates per §1.4: new method added,
  compromised method marked superseded with timestamp. Signatures from the
  superseded key dated after supersession are rejected. Because the estate's
  own doctrine is append-only, a verifier that honored silent in-place key
  replacement would accept attacker-swapped keys — hence the continuity-break
  rule. Estate-side compromise of `#board-attestation-1` follows the same
  append-only supersession, and previously signed responses remain verifiable
  against the superseded entry for their validity window.
- **did:web TLS / hosting compromise.** did:web's root of trust is the DID
  domain's TLS and hosting. A compromised host can serve a swapped DID
  document. Mitigations: fetch-and-pin with continuity checks (a document
  that drops or silently replaces a known key id is a loud continuity break,
  not a silent accept); pinning means an attacker must persist the compromise,
  not win a single fetch; the estate's own `_keyContinuity` record gives
  verifiers an out-of-band history to compare. **Limit, stated plainly:** RAS
  inherits did:web's TLS ceiling. It does not pretend to be ledger-anchored
  identity; if a stronger anchor is ever needed it is a new spec, not a quiet
  strengthening of this one.
- **Clock skew.** ≤ 60 s tolerance; signatures with `created` in the future
  beyond skew are rejected. Operators on broken clocks get 401 `expired`,
  never a widened window.
- **Confused deputy.** The covered components bind `@authority` and `@path`,
  so a signature captured against one host/endpoint cannot be replayed against
  another. RAS credentials must never be forwarded by intermediaries; a proxy
  that re-signs is a new principal with its own DID. The estate MUST NOT act
  on a request's *claimed* identity headers — only the verified signature
  identity counts.

## 7. What implementation would require (not done)

- An RFC 9421 verifier at the edge (Workers) with Ed25519 support.
- DID resolution cache with the §1.3 policy.
- Nonce/jti store (fail-closed per §4).
- The authority tier list — a published, owner-signed document; never
  self-asserted by a caller.

Until those exist, every surface behaves exactly as today: free, public,
measurement-only. This spec changes nothing that is live.
