# card-v0 evidence grammar — 2026-09-01 (AX leftover revise)

**Status:** leftover honesty land. Grammar + additive schema only.  
**Locks:** Board stays **22 · 15 · 7**. Never MEASURED from this doc. Never certify. No wrangler. No Cloud Agents. No `BOARD_SIGN_KEY` on laptop / 3090 / MetaMask / Workers. No second root writer. No paywall `/root.json`. No 23/22. No endorsement claims. No new products. No SaaS seats. One root. No second board.

This document unifies product evidence behind one **card-v0** atom and one publish path. It does **not** ship OTel exporters, TRACE upstream wiring, live x402 `/proof`, or mill instrumentation.

---

## Owner AX (runtime / plugin / harness)

| Lock | Value |
|---|---|
| Microsoft Agent Framework + Channels | Supported **runtime/client** via MCP |
| Harness | **Authority** stays ours — clients do not mint MEASURED |
| Master plugin | **One** grammar: card-v0 — tools: board · axis · verify · list · check_drift · request_attestation (x402) |
| Surfaces add | `cobol.legacy` · `owasp.control` · `xdc.document.state` |

See also: `docs/OWNER_AX_MS_AGENT_FRAMEWORK_2026-09-01.md`, `docs/owasp-agentic-crosswalk.md`.

---

## Thesis

OTel spans / TRACE records / GSPC / SWIFT / XRPL / BENJI / RWA / Dorado / ERC-8004 / COBOL / OWASP / XDC all emit the **same outer card-v0 envelope**. Root indexes cards. External chains witness the **root hash only**. AG-UI is presentation only — not a 7th evidence atom.

---

## Exact fields

| Field | Required | Notes |
|---|---|---|
| `schema` | yes | `https://councilof.ai/schema/card-v0.json` |
| `surface` | yes | see Surfaces |
| `subject` | yes | human-readable subject |
| `as_of` | yes | ISO-8601 datetime |
| `source_urls` | yes | array of URIs, min 1 |
| `payload` | yes | surface-specific object; **hashed and signed** |
| `sha256` | yes | hex SHA-256 of canonical **payload** |
| `unmeasured` | yes | string[]; name gaps — never invent values |
| `sig_ed25519` | optional | hex Ed25519 over canonical payload; may be `null` |

**Already live (keep):** optional `did`, `tags` on the envelope. Do not strip them to invent a second shape.

## Outer envelope vs nested measure

**card-v0 = outer surface envelope** (same for every product arm):

`schema · surface · subject · as_of · source_urls · payload · sha256 · unmeasured[] · (sig_ed25519 optional)`

- **`gspc.behavioural`:** GSPC measure fields nest **inside `payload`**. Never lift them to the outer envelope. Historical shape-A stays frozen.
- **Cobalt:** leave alone (no Cobalt schema/product edits).

Machine schema: [`public/schema/card-v0.json`](../public/schema/card-v0.json).

---

## Canonicalisation (hard cap)

```text
json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
```

- Sorted keys. `ensure_ascii=false`.  
- **3072-byte hard cap** on the canonical **payload**.  
- Writer: `scripts/publish_public_root.py` (`PAYLOAD_CAP = 3072`).

---

## Surfaces (grammar allow-list)

| Surface | Role |
|---|---|
| `gspc.behavioural` | GSPC behavioural leaf — does not stamp MEASURED |
| `trace.runtime` | TRACE-class runtime record (map only; no membership claim) |
| `otel.span` | OpenTelemetry span / fragment as evidence |
| `xrpl.asset.state` | XRPL asset state (**LIVE**) |
| `swift.notice` | SWIFT / market-infra public notice (grammar) |
| `benji.supply` | BENJI / FOBXX supply coverage (grammar) |
| `rwa.reserve` | RWA / reserve attestation coverage |
| `dorado.gate` | Dorado trust-gate leaf (card + drift; not a rank SKU) |
| `erc8004.callable` | ERC-8004 registered-vs-callable coverage |
| `cobol.legacy` | **COBOL Bridge (ours)** — `CSOAI-ORG/cobol-bridge-mcp`; same root |
| `owasp.control` | OWASP control / ASI coverage leaf — evidence only, never a cert |
| `xdc.document.state` | XDC document-state leaf — same outer envelope |

### Live (shipped — align, do not fork)

| Live surface | Notes |
|---|---|
| `xrpl.asset.state` | active leaves |
| `xrpl.basket.root` | schema + writer allow-list |
| `public.notice` | SWIFT + BENJI press / staff letters today |
| `benji.onchain.supply` | BENJI supply leaf today |

**Naming honesty (do not mass-rename):** grammar `benji.supply` ↔ live `benji.onchain.supply`; grammar `swift.notice` ↔ live `public.notice`. Cite-only sidecars stay off card-v0.

---

## One publish path + root/chain

```text
adapters → make_card → merkle(leaf sha256s) → public/root.json (+ proofs) → twin apex
```

```text
unsigned card-v0 leaf → GHA signs → ONE writer advances root → chain witnesses ROOT HASH ONLY
```

- One writer. One merkle root.  
- Halts: `halt-on-split` · `halt-on-missing-key` · `halt-on-unsigned-leaf`.  
- See `docs/ROOT_CHAIN_UNSIGNED_GHA_2026-09-01.md`.

Board authority: living GET [`/api/gspc`](https://councilof.ai/api/gspc) — **22 · 15 · 7**. Empty stays empty.

---

## Out of scope (this leftover)

- TRACE-spec clone / upstream issue · live x402 `/proof` claim · OTel mill instrument  
- MEASURED stamps, certification, seats, second board, 23/22  
- Wrangler / Workers or laptop `BOARD_SIGN_KEY` / Cloud Agents / paywall `/root.json`  
- Cobalt schema or product changes · OWASP/Microsoft endorsement claims  

*End. CEO leftover honesty. Europe/London. 1 Sep 2026.*
