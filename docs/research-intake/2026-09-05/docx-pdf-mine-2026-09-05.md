# F16 + F17 + F31 — mining the 39 docx and 41 PDFs, and one structural finding

**5 September 2026, eat lane.** Counts are derived by hashing, not by counting filenames.

---

## THE FINDING THIS PASS PRODUCED — the doors index is not derived from the doors

While probing blueprint items I checked whether the doors I shipped earlier today appear in the
index an agent actually reads. They do not.

| | |
|---|---|
| `public/.well-known/*.json` files on `origin/master` | **302** |
| `/.well-known/index.json` → `total_doors` | **292** |
| Drift | **10 doors on disk that the index does not list** |

All nine doors merged by this lane today **serve HTTP 200** and **none of them is in the index**:
`gleif-lei`, `anchor-posture`, `agents`, `oscal-crosswalk`, `eu-ai-act-art71-database`,
`esma-mica-register`, `erc-8004-registries`, `erc-3643-trex`, `us-registries-edgar-ofac`.

**This is not build-timing lag.** The index file was last written by commit `c3b05137b` at
**13:36:45**, well after those doors merged, and it still omits them. The file is a **committed
artefact that is hand- or script-maintained separately from the directory it describes** — so any
door added without a matching index edit is *live but undiscoverable through the canonical
discovery route*. That is precisely the "a door a buyer cannot find" case.

```bash
# reproduce
git ls-tree -r origin/master --name-only -- public/.well-known/ | grep -c '\.json$'   # 302
curl -s https://councilof.ai/.well-known/index.json | python3 -c 'import json,sys;print(json.load(sys.stdin)["total_doors"])'   # 292
curl -s -o /dev/null -w '%{http_code}\n' https://councilof.ai/.well-known/gleif-lei.json          # 200
curl -s https://councilof.ai/.well-known/index.json | grep -c gleif-lei                            # 0
```

**Fix belongs to whoever owns the index generator, not this lane.** The durable fix is to derive
`index.json` from the directory at build time so the two cannot drift, and to add a gate that fails
when `count(public/.well-known/*.json) != total_doors`. Logged as F34/F35.

---

## F31 — the real Zenodo count (the IP register says 3)

| Query | Hits |
|---|---|
| `q=csoai` | **54** |
| `creators.name:"Templeman"` | **44** ← the properly scoped number |
| `q=GSPC` | 147 (too broad — matches unrelated work) |
| `q=Council of AI` | 5,476,183 (meaningless as a query) |

Creators on the first ten `csoai` hits: `Templeman, Nicholas` ×8, `CSOAI Ltd` ×1,
`Council of AI (CSOAI Ltd)` ×1 — so the keyword query is mostly ours, and **44 is the defensible
figure to quote**, not 3 and not 54.

```bash
curl -s 'https://zenodo.org/api/records?q=creators.name%3A%22Templeman%22&size=1' \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["hits"]["total"])'   # 44
```

---

## F16 — the 39 docx are **34 distinct documents**

Hashed, not counted by name. `CSOAI-Frontend-Audit-Checklist` alone accounts for **9 copies**
(`.footnote (1)`…`(8)` plus the original). Other duplicate families: `GSPC_Completion_Review` ×3,
and ×2 each for `SOV-Booklet-Breakthroughs`, `Monorepo Quantum Mapping`, `ByteDance 10T Model Build`.

**381 unfinished-item markers** across 12 documents (`☐`, `[ ]`, `TODO`, `OUTSTANDING`, `NOT DONE`,
`PENDING`, `MISSING`, `BLOCKED`, `❌`, `✗`).

**Most of that 381 is not CSOAI work** and should not enter the backlog: `Free GPU for Large Models`
(103 markers) and `ByteDance 10T Model Build` (90 + 38) are personal/unrelated task lists — *"Download
Trending Music app"*, *"Sign up Salesforce Free CRM"*, Fish Clan Docker builds. Counting them as
estate backlog would inflate the number with someone's shopping list.

### The one that matters: `CSOAI_Layer0_Full_Todo_Blueprint_31Aug2026.docx` — 88 items

Themed, then **probed against live**:

| Theme | Items | Live state |
|---|---|---|
| card / schema | 25 | `/schema/card-v0.json` **200** — canonical 3 KB card exists |
| signing / root | 19 | `/root.json` **200**, `sig_ed25519` present |
| adapters | 7 | `/api/xrpl` **200** · `/api/swift` **200** · `.well-known/erc-3643-trex.json` **200** (shipped today) |
| x402 / pay | 7 | `/api/x402` **200**, rail `mode: live` |
| mcp / a2a | 3 | `/mcp` **200**; *Smithery one-click install* **NOT DONE** |
| anchor | 2 | SCITT door **200**; **Zenodo anchor 302→ resolves**; but the root is still **unanchored** |
| art12 / reg | 1 | T-REX adapter **200** |
| pqc | 0 items matched | no `pqc`/`quantum` slug in 292 indexed doors |
| other | 24 | not individually probed — **UNMEASURED** |

**Blueprint items still genuinely open, by probe:**
- **PQC** — zero `pqc`/`quantum`/`dilithium` doors anywhere. The blueprint names a `pqc` monorepo package; nothing public.
- **Sigstore keyless path (Fulcio + Rekor)** — no `sigstore` slug; `rekor-*` slugs exist as card names, not as a signing path.
- **MCP one-click install via Smithery** — Smithery is one of the six unlisted directories (`interop/mcp-directories.json`).
- **The root anchor** — the blueprint lists SCITT/RFC 9943 and the Zenodo anchor as done; the *Bitcoin* anchor is not.

## F17 — the 41 PDFs are **39 distinct**

Two exact duplicates, both unrelated to the estate (`Invoice.pdf`, `S Mallett Roofing proposal.pdf`).

| Theme | Count |
|---|---|
| evidence / trust / metrology | 8 |
| valuation / finance | 7 |
| strategy / framework | 6 |
| other / unrelated | 20 |

The valuation/finance seven are already absorbed: the 19 Aug pre-money analysis and the Inngot
profile drive `docs/company/VALUATION-2026-09-05.md` and `ip-claims-probed.md`. The
evidence/trust eight (*The Science of Verifiable Trust*, *The AI Evidence Rail*, *The Living
Ledger*, *Deterministic Legal Metrology*, *The Indestructible Record*, …) are **positioning essays,
not task lists** — they contain no checklist markers and yield no backlog rows. Recorded so nobody
re-mines them expecting items.

> **Honest scope statement:** F17 asked for "every unfinished checklist item" from the 41 PDFs.
> Having indexed and themed all 41, the finding is that **the PDFs are not checklists** — 20 are
> unrelated to CSOAI and the CSOAI ones are argument documents. There are no rows to extract, and
> emitting invented ones to hit a row count would be worse than reporting zero.

---

## New backlog rows

| id | Row | PROOF |
|---|---|---|
| F34 | Derive `/.well-known/index.json` from `public/.well-known/*.json` at build time | `git ls-tree ... \| grep -c '\.json$'` equals `total_doors` |
| F35 | Add a gate failing the build when door-file count ≠ `total_doors` | gate script exists + one red run proving it fires |
| F36 | Index the 9 doors merged today so they are discoverable | `curl -s /.well-known/index.json \| grep -c gleif-lei` → 1 |
| F37 | Correct the Zenodo count in the IP register: 3 → **44** (`creators.name:"Templeman"`) | register quotes 44 with the query |
| F38 | PQC: publish a door stating the posture, or record that no PQC work is live | a `pqc` slug exists, or an explicit UNMEASURED note |
| F39 | Sigstore keyless (Fulcio+Rekor) signing path — blueprint item with no public surface | a `sigstore` door or signing-path doc |

_Mined 2026-09-05. Distinct counts are content hashes. Where a source yields no rows, this file says
zero rather than inventing them._
