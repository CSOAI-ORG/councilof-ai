# ERC-8004 filter — erc8004.callable — Measure — 1 Sep 2026

**Status:** design leftover for PR **#997**.  
**Locks:** Board **22 · 15 · 7**. **No fill-7.** Never MEASURED from this filter. Never certify. Passport = **card + root only** — **never tokenize models**.

Owner filter: permissionless **public-endpoint probe** → `erc8004.callable` cards; placeholders stay **UNMEASURED**. Weekly registered-vs-callable = **labelled fact**, not board MEASURED.

---

## Thesis

ERC-8004 registrations are plentiful; live callable MCP/A2A endpoints are a thin fraction. Measure only what a stranger can probe:

```
public registry / agent card URL
        → permissionless endpoint probe
        → card-v0 leaf (surface=erc8004.callable)
        → same public root
```

No second board. No model token. Weekly aggregate is a **labelled fact** (cite), not a MEASURED axis cell.

---

## Outer envelope

Unchanged owner fields. `surface` = `erc8004.callable`.

---

## Payload profile — `erc8004.callable`

Hard cap 3072 bytes canonical payload.

| Key | Required | Notes |
|---|---|---|
| `agent_id` | yes | registry / 8004 id as published |
| `registration_uri` | yes | public URI |
| `endpoint` | no | probed URL if any |
| `probe` | yes | `{ "as_of", "method", "result": "CALLABLE \| UNREACHABLE \| UNCHECKABLE \| PLACEHOLDER" }` |
| `protocols_cited` | no | `["mcp","a2a",…]` as declared — not graded |
| `passport` | yes | `{ "binds": "card+root", "model_token": false }` |
| `note` | yes | honesty: labelled probe fact; not board MEASURED |

**Placeholders:** if registration has no public endpoint, `probe.result` = `PLACEHOLDER` and outer `unmeasured[]` includes `"endpoint"`. Status path = **UNMEASURED** for any grade-like field. Never invent CALLABLE.

**Weekly registered-vs-callable:** publish as labelled fact (e.g. cite counts / fraction with method + as_of) under docs or a cite-only sidecar — **not** a `/api/gspc` MEASURED cell, **not** fill-7. Prior cite band (531k / 24ch, 3–15% live) stays cite-only until re-probed.

---

## Passport discipline

- ERC-8004 passport points at **card sha256 + root hash** only.
- **Do not** mint or sell model tokens.
- Dorado / escrow may gate on card + drift delta — still not a model NFT.

---

## Hard no

- No MEASURED fill of the 7 empty from 8004 probes.
- No treating weekly callable % as an axis score.
- No model tokenization.
- No Cloud Agents required — CEO folds onto #997.
