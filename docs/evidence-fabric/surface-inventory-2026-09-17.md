# Every surface, and which ones to stop maintaining

**17 September 2026 · M4 lane · nothing was built.** This is a list. The valuable rows are the KILLs.

## The count

| family | count | source |
|---|---|---|
| API routes (`functions/api`, excluding `_helpers` and tests) | **125** | `scripts/surface_inventory.py` |
| `.well-known/*.json` documents | **305** | `ls public/.well-known/*.json` |
| x402 doors advertised | **11** | live `/.well-known/x402.json` → `resources[]` |
| card corpora | **3** | root.json · signed card index · mill card-root |

305 standards-mapping documents is the shape the owner's instruction describes: **we have been
mapping to everybody.** The bridge that reverses it is DONE WHEN D, not another file here.

## How "is anything reading this?" was answered

`git grep` for the literal path across `client/ public/ scripts/ docs/ functions/ src/ .github/`,
excluding the route's own implementation and its own test.

**A zero is evidence, not a verdict.** A route can be called by an external agent, a partner or a
crawler that leaves no trace in this repository; a path can be built dynamically; a discovery
document can point at a route without the literal string appearing anywhere else. So every KILL
below names **what would change its mind**.

Result: **124 of 125 routes have at least one in-repo reference.** The one that does not is the
catch-all `/api/[[path]]`, which is a router and is supposed to be unreferenced. As a dead-surface
detector this signal found nothing — which is itself worth recording, because the sprawl here is
**not** dead routes. It is **live routes with overlapping names**.

## One concept, more than one spelling — the actual defect

| the concept | the surfaces | verdict | reason |
|---|---|---|---|
| EU AI Act Article 50 | `/api/article50` (passport, POST+GET) · `/api/art50/marking-evidence` (paid door) | **MERGE the spelling** | Two different functions, one concept, two top-level spellings of the same article number. Namespace both under `article50/`. Neither function is redundant; the vocabulary is. |
| coverage | `/api/coverage` ("one machine-readable lifecycle view") · `/api/coverage-truth` ("distinguish indexed, runnable, measured, signed") | **MERGE** | Both distinguish lifecycle states over the same estate. A surface named `-truth` implies the other one is not, which is a naming decision nobody would defend out loud. |
| evidence | `/api/evidence` · `/api/evidence-bundle` · `/api/evidence-intake` · `/api/evidence-pack` | **KEEP all, MERGE the vocabulary** | Genuinely four jobs (read, OSCAL bundle, ingest, underwriter pack). But four surfaces whose names differ by a suffix force a reader to guess. Each should declare which job it does in one field, and `scripts/express_as_evidence.py` is the one vocabulary they should all speak. |
| verify | `/api/verify` · `/api/verify-card` · `/api/verify-batch` · `/api/verify-tally` | **KEEP, document as a family** | Distinct verbs on distinct inputs. The defect is that nothing says so; a reader meets four verbs and no map. |
| "cards" | `/api/cards` (336) · `/signed/card_index.json` (335) · `/root.json` (305) | **KEEP ALL THREE, NEVER MERGE** | Three genuinely separate corpora, identifier overlap 0. Merging them would be the worst possible fix. What must merge is the WORD: each must say which corpus it is, in the artifact, every time. |

## KILL candidates

| row | evidence | what would change my mind |
|---|---|---|
| **32 `.well-known/*.json` documents with no reference anywhere outside `.well-known/`** — the `bank-*` set (BNP Paribas, BNY Mellon, Deutsche, HSBC, SG Forge, StanChart, UBS, UOB), the `xrpl-*` asset set (eurcv, europ, eurq, love, ousg, psc, usd-bs, usd-gh, usdb), vendor API mirrors (anthropic-batch, anthropic-prompt-caching, deepseek-api, fireworks-api, together-api, openai-structured-outputs), and regulator mirrors (esma-mica-register, ico-ai-guidance, sec-ai-guidance, us-registries-edgar-ofac, swift-mt202, swift-mt760, oscal-crosswalk, glama, transparency-checklist) | no in-repo reader; each is a mapping TO someone else's vocabulary, which is the direction this lane exists to reverse | an external consumer fetching them. **Check the edge logs before deleting** — this repo cannot see who reads a static file. If any are load-bearing for a partner, they stay and get an owner in the file. |
| `/api/coverage-truth` | duplicates `/api/coverage`'s job under a name that disparages it | a consumer that depends on the specific shape of one and not the other |

**Nothing was deleted by this lane.** Deleting another lane's bytes unilaterally is forbidden, and
a static file's readers are invisible from inside the repository. The deliverable is the list plus
the falsifier.

## What this inventory does NOT establish

- **Not that the 32 are dead.** Only that this repository does not reference them.
- **Not that 125 routes is too many.** No per-route traffic was measured; the edge has that data and
  this lane did not read it.
- **Not that any surface is wrong.** Overlapping *names* are the finding, not broken behaviour.

## Proving command

```bash
python3 scripts/surface_inventory.py --out /tmp/inventory.json
```

Machine artifact: `docs/evidence-fabric/surface-inventory-2026-09-17.json` — every route with its
in-repo reference count and the files that reference it.
