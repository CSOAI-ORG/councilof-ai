# Permissionless denser-roots wedge — cite only — 1 Sep 2026

**Status:** leftover honesty fold onto PR **#994**. Docs + additive schema enum only.  
**Locks:** Board **22 · 15 · 7**. Never certify. No MEASURED fill. No second root writer. No new products. COBOL Bridge **ours**. MS Agent Framework = **MCP client** (harness authority). Denser roots **not** new products. Sit **NAMED**.

Companion: [`W3C_AGENT_CONFORMANCE_CG_CITE_2026-09-01.md`](./W3C_AGENT_CONFORMANCE_CG_CITE_2026-09-01.md) (HOLD Nick).  
Grammar: [`CARD_V0_EVIDENCE_GRAMMAR_2026-09-01.md`](./CARD_V0_EVIDENCE_GRAMMAR_2026-09-01.md).  
Schema: [`../public/schema/card-v0.json`](../public/schema/card-v0.json).

---

## Thesis

Permissionless rails densify the **same** living root-as-index (`GET /root.json`). They do **not** open a second board, second scorer, or second writer of `root.json`. Cite → `source_urls` / `unmeasured[]` / optional evidence leaves. Never stamp MEASURED from a cite.

```
adapters → card-v0 leaf → merkle → GET /root.json  (one writer)
chain / Rekor / OTS        → witness root hash only
Buzz / Nostr               → announce N→N+1 root deltas only
```

---

## 1. W3C Agent Conformance CG — draft HOLD Nick

- Cite CG home only. Crosswalk draft OK on paper.
- **Join HOLD Nick.** No membership claim. No endorsement. No “we conform.”
- See companion W3C cite note.

---

## 2. Pyth / Commerce — pane/input cite only

| Series class | Role | Board rule |
|---|---|---|
| GDP / PCE / Treasury-class public prints | Macro / Commerce cite inputs | Label source + `as_of`; `writes_board: false` |
| Pyth public series | Oracle cite | Cite-only — not MEASURED; not a board pane |

**Hard stops:** No Pyth endorsement. No Commerce endorsement. Cite ≠ partnership. Do not stamp empty cells from a macro print.

---

## 3. XDC — `xdc.document.state`

Aligns with grammar + schema enum `xdc.document.state` (additive reserve).

| Lock | Value |
|---|---|
| Surface | `xdc.document.state` |
| Envelope | Same outer card-v0 |
| Payload | document id / hash / venue / state cites + `unmeasured[]` |
| Writer | **No live XDC writer from this leftover** |
| Board | Document-state evidence ≠ fill of the 7 empty |

Example shape (unsigned — **not a mint**):

```json
{
  "schema": "https://councilof.ai/schema/card-v0.json",
  "surface": "xdc.document.state",
  "subject": "XDC document-state — example unsigned (not a mint)",
  "as_of": "2026-09-01T00:00:00Z",
  "source_urls": ["https://councilof.ai/schema/card-v0.json"],
  "payload": {
    "document_id": null,
    "document_hash": null,
    "venue": "xdc",
    "state": "declared",
    "note": "Document-state evidence leaf. Not MEASURED board fill."
  },
  "sha256": "<hex of canonical payload>",
  "unmeasured": ["document_id", "document_hash", "sig_ed25519"],
  "sig_ed25519": null
}
```

---

## 4. Buzz / Nostr — root deltas only

| Rail | Intent | Sit |
|---|---|---|
| Buzz | Attention surface for **root delta** notices (N → N+1) | **Do NOT join Buzz** this land |
| Nostr | Permissionless note relay for root-hash / card-sha deltas | Draft cite only; no bot spray; no laptop keys |

Social relays **announce** root deltas. They do **not** write `root.json`. Not a second scoreboard.

---

## 5. CloudFront × x402 — document/cite only

| Piece | Intent | Sit |
|---|---|---|
| CloudFront + WAF | Edge gate in front of pay-to-recompute / attestation challenge | **Design/cite only** — do not wire billing live |
| x402 | Agent payment rail; challenge header | Header **≠ settlement** until facilitator receipt |
| `/proof-on-x402` | Claim path | **Sit** until owner cut-off paste |

**Hard stop:** No CloudFront billing deploy, no WAF paywall, no live x402 cashier, no `/proof` claim from this fold. Existing `?x402=1` → 402 challenge remains header-only honesty.

---

## 6. ERC-8004 — passport to card + root only

| Lock | Value |
|---|---|
| Role | On-chain agent **identity** passport toward GSPC **card + root** |
| Surface | Existing `erc8004.callable` |
| Never | Tokenize model weights; sell agent rank; stamp MEASURED from registration counts |
| Cite | Pane/input only; `writes_board: false` |

Registered ≠ signed-and-callable. Passport discipline: card + living root only.

---

## 7. Root anchors — denser living root-as-index

| Lock | Value |
|---|---|
| Index | Living **GET `/root.json`** — same path, denser leaves over time |
| Writer | **One** — `publish_public_root.py` (no second writer) |
| Envelope | May be unsigned until keystone — no fake `sig_ed25519` on the envelope |
| Anchors | **Root-hash only** (Rekor / OTS→Bitcoin / chain memo) — never anchor invented leaf grades |
| Drift | N→N+1 without published time series = **UNCHECKABLE** — do not invent |
| Board | GET `/api/gspc` remains authority — **22 · 15 · 7** |

Denser roots = more stranger-checkable leaves under the **same** merkle index. **Not** new products. **Not** a second board.

---

## Hard no (reprint)

1. Never certify / never MEASURED fill of the 7 empty.  
2. No second root writer / no second scoreboard via Buzz/Nostr.  
3. No leaf-grade anchors — root-hash only.  
4. No W3C CG membership claim until Nick joins.  
5. No CloudFront billing / no `/proof-on-x402` claim.  
6. No ERC-8004 model tokens.  
7. COBOL Bridge = ours (`cobol.legacy`); Cobalt leave alone.  
8. MS AF = MCP client; harness stays authority.

*End. Cite-only denser roots. Europe/London. 1 Sep 2026.*
