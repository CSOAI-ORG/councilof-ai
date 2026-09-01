# Pyth + Commerce — cite-only reference inputs — 1 Sep 2026

**Status:** DRAFT HOLD. **Cite-only.** No Pyth endorsement. No Commerce endorsement.  
**Locks:** Board **22 · 15 · 7**. Never MEASURED from listing / oracle print / press. Never certify. `writes_board: false`.

---

## Thesis

Public **GDP / PCE / Treasury**-class series may be hashed and cited as **reference inputs** into unsigned leftover panes or card `source_urls` / payload cite fields. They are **inputs**, not board scores. Cite ≠ partnership. Cite ≠ MEASURED.

---

## Series (label + as_of required)

| Series | Role | Board rule |
|---|---|---|
| GDP | Macro cite | Label primary source + `as_of`; never fill empty axes |
| PCE | Macro cite | same |
| Treasury | Rates / issuance cite | same |

Optional companion cites (same discipline): Commerce-class statistical releases when labelled from primary — **still cite-only**.

---

## Hash discipline (design)

When a pane or leaf wants a stable pointer:

1. Fetch primary public print (URL + retrieval time).  
2. Canonicalise bytes (document the method in `unmeasured[]` if ambiguous).  
3. Record `sha256` of the cited artifact **or** of a small cite object `{series, as_of, source_url, value_label}`.  
4. Put the digest in payload / sidecar — **do not** promote the macro number into a GSPC accuracy field.

Never invent a price. Never stamp `MEASURED` because an oracle moved.

---

## Hard stops

- **No Pyth endorsement claim.**  
- **No Commerce endorsement claim.**  
- **Never MEASURED from listing** (app store, RWA listing, TVL page, oracle ticker).  
- Do not fill the **7** empty.  
- Do not sell a macro "grade".  
- Board authority remains living GET `/api/gspc`.

Companion: fire-playbook `10-x402-cloudfront-pyth-genius-buzz-xdc.md` §B · `06-cite-only-panes.md`.

*End. Cite-only reference inputs. Europe/London. 1 Sep 2026.*
