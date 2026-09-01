# card-v0 evidence grammar — 2026-09-01

**Status:** leftover honesty land. Grammar + additive schema only.  
**Locks:** Board stays **22 · 15 · 7**. Never MEASURED from this doc. Never certify. No wrangler. No Cloud Agents. No `BOARD_SIGN_KEY` in Workers. No new products. No SaaS seats. One root. No second board.

This document unifies product evidence behind one **card-v0** atom and one publish path. It does **not** ship OTel exporters, TRACE upstream wiring, x402 rails, or mill instrumentation.

---

## Thesis

OTel spans / TRACE records / GSPC / SWIFT / XRPL / BENJI / RWA / Dorado / ERC-8004 / COBOL Bridge (`cobol.legacy`, ours) / XDC document-state (six arms + Layer-0 + AG-UI presentation) all emit the **same outer card-v0 envelope**. Root indexes cards. External chains witness the **root hash only**.

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

Live also carries optional `did` / `tags` — keep; do not invent a thinner fork.

- **Six arms + AG-UI:** AG-UI presents cards/root; it is not a second evidence atom.
- **`gspc.behavioural`:** GSPC measure fields nest **inside `payload`** (axis, model, accuracy/status, bank cites, …). Never lift them to the outer envelope. Historical shape-A `gspc.measurement-card` under `public/signed/cards/` stays frozen and separate.
- Other surfaces keep their facts in `payload` the same way.
- **Cobalt:** leave alone this leftover (no Cobalt schema/product edits).
- **COBOL Bridge:** OURS (`CSOAI-ORG/cobol-bridge-mcp`) — Layer-0; `cobol.legacy`; same root as GSPC. Not a CSGA competitor.


Machine schema (path is singular): [`public/schema/card-v0.json`](../public/schema/card-v0.json).

---

## Canonicalisation (hard cap)

```text
json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
```

- Sorted keys. `ensure_ascii=false`.  
- **3072-byte hard cap** on the canonical **payload** (not the full card envelope).  
- Writer: `scripts/publish_public_root.py` (`PAYLOAD_CAP = 3072`).  
- Do **not** mix with historical GSPC shape-A measurement cards (`public/signed/cards/*`, `ensure_ascii=True`, body+id envelope). Those stay frozen; card-v0 is the public-root unify atom.

Live probe (2026-09-01): ~78 leaves under `public/cards/`; payload sizes well under 3KB; `sha256` recomputes from payload with `ensure_ascii=False`.

---

## Surfaces

### Grammar (target allow-list)

- `gspc.behavioural`
- `trace.runtime`
- `otel.span`
- `xrpl.asset.state`
- `swift.notice`
- `benji.supply`
- `rwa.reserve`
- `dorado.gate`
- `erc8004.callable`
- `cobol.legacy`
- `xdc.document.state`

### Live (shipped — align, do not fork)

| Live surface | Notes |
|---|---|
| `xrpl.asset.state` | active leaves |
| `xrpl.basket.root` | schema + writer allow-list |
| `public.notice` | SWIFT + BENJI press / staff letters today |
| `benji.onchain.supply` | BENJI supply leaf today |

**Naming honesty (do not mass-rename):**

- Grammar `benji.supply` ↔ live `benji.onchain.supply` — keep live string until a deliberate adapter migrate.  
- Grammar `swift.notice` ↔ live notices use `public.notice` — keep live string; new SWIFT leaves may use `swift.notice` once the writer allow-list expands.  
- Cite-only `hub.census.digest` / `gspc.board.cite` stay **off** card-v0 (publisher-health sidecar only).

Schema enum is **additive**: live names retained; grammar names reserved so future emitters share one schema without a second atom.

---

## One publish path

```text
adapters → make_card → merkle(leaf sha256s) → public/root.json (+ proofs) → twin apex
```

- One writer. One merkle root. Chain / Rekor / OTS / Bitcoin witness **root hash**, not a parallel board.  
- `root.json` envelope may be unsigned until keystone; leaf signatures are separate.  
- Halt-on-split / missing-key / unsigned-NEW remain. Laptop never signs with estate key.

Board authority remains living GET [`/api/gspc`](https://councilof.ai/api/gspc) — **22 · 15 · 7**. Empty stays empty.

---


## COBOL Bridge — Layer-0 note (correction)

**COBOL Bridge is OURS.** Repo: [`CSOAI-ORG/cobol-bridge-mcp`](https://github.com/CSOAI-ORG/cobol-bridge-mcp). It is the Layer-0 mainframe arm and shares the **same public root as GSPC**. It is **not** a CSGA competitor. Kill any leftover competitor framing.

- Grammar surface: `cobol.legacy` (copybook / CICS / JCL / VSAM evidence leaf).  
- Outer card-v0 envelope unchanged; payload nests artifacts + PII flags + GDPR/PCI/SOX/Art.12 crosswalk + `source_hash`.  
- Read-only sidecar contract in upstream `SPEC.md` — never writes bank core / ledger / CICS / VSAM / JCL submit.  
- `cobolbridge.ai` HTTP 522 sits — this leftover does not attach the domain.  
- Commercial (owner, out of band from parse tools): Free **10/day**; Pro **£79/mo** + signed root inclusion. Paid inclusion does not stamp MEASURED on the board.  
- Cobalt Bridge remains untouched (different product).

Also reserved additively: `xdc.document.state` (XDC document-state leaf; same outer envelope; no live writer from this leftover).

## Out of scope (this leftover)

- TRACE-spec clone / upstream issue  
- x402 `/proof` wiring  
- OTel mill instrumentation  
- MEASURED stamps, certification, seats, second board  
- Wrangler / Workers `BOARD_SIGN_KEY` / Cloud Agents  
- Cobalt schema or product changes  

*End. CEO leftover honesty. Europe/London. 1 Sep 2026.*
