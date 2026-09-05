# Index integrity audit — 5 September 2026

Two published indexes are the estate's discovery surface. This audit runs both directions:
**does everything indexed resolve**, and **is everything that should be indexed, indexed**.

---

## Direction 1 — everything indexed resolves. Both indexes are clean.

| Index | Entries | HTTP 200 | Non-200 |
|---|---|---|---|
| `/.well-known/index.json` | **292** | **292** | **0** |
| `/interop/index.json` | **372** | **372** | **0** |

**664 URLs probed, zero dead links.** That is a verifiable integrity claim and it is worth stating
plainly: a published index full of 404s is the commonest form of estate rot, and this estate has
none of it.

```bash
python3 - <<'PY'
import json,urllib.request,concurrent.futures as cf
from collections import Counter
for u,key in [("https://councilof.ai/.well-known/index.json","doors"),
              ("https://councilof.ai/interop/index.json","formats")]:
    items=json.load(urllib.request.urlopen(u))[key]
    def probe(x):
        try: return urllib.request.urlopen(x["url"],timeout=20).status
        except Exception as e: return getattr(e,"code",0)
    with cf.ThreadPoolExecutor(max_workers=16) as ex:
        print(key, dict(Counter(ex.map(probe,items))))
PY
```

## Direction 2 — the doors index is **incomplete**

| | |
|---|---|
| `public/.well-known/*.json` on `origin/master` | **302** |
| `/.well-known/index.json` → `total_doors` | **292** |
| **Missing from the index** | **10** |

Nine of the ten are doors merged on 2026-09-05 that **serve HTTP 200 and appear nowhere in the
index**: `gleif-lei`, `anchor-posture`, `agents`, `oscal-crosswalk`, `eu-ai-act-art71-database`,
`esma-mica-register`, `erc-8004-registries`, `erc-3643-trex`, `us-registries-edgar-ofac`.

**Not build-timing.** `index.json` was last written by `c3b05137b` at **13:36:45**, after those
doors merged, and still omits them. It is a committed artefact maintained separately from the
directory it describes, so a door added without a matching index edit is **live but undiscoverable
through the canonical route.**

## Direction 2, continued — the interop index is **correctly curated, not drifted**

A raw file count suggests a catastrophe. It is not one, and reporting it as one would have been
wrong:

| | |
|---|---|
| `public/interop/**` (json/md/txt/yaml/xml) on master | **2,437** |
| `/interop/index.json` → `total_formats` | **372** |
| Apparent "drift" | 2,065 |

Classifying the 2,039 files whose slug is not in the index:

| Shape | Count | Should it be indexed? |
|---|---|---|
| in a nested subdirectory (evidence subtrees) | **1,851** | **No** — these are evidence trees, not interchange formats |
| `card-*` — measurement cards | **170** | **No** — cards are indexed by `card_index.json`, not here |
| dated `…2026-NN` artefacts | **14** | **No** — point-in-time artefacts |
| **plausible top-level candidates** | **4** | **maybe** |

The four: `hf-coverage.json`, `mcp-directories.json`, `rekor-root-8c6a27ea.json`,
`rwa-staged-index.json`.

**So the interop index is doing its job.** It is a curated list of interchange formats, not a
directory listing, and 2,065 of the 2,069 unindexed files are correctly excluded. The honest gap is
**4 files, not 2,065** — and one of those four, `mcp-directories.json`, was shipped by this lane
today, so this audit is partly marking its own homework.

> **Why this correction matters more than the finding.** The raw numbers supported a dramatic claim
> — *"2,065 formats missing from the index"* — that would have been false, would have sent a lane
> chasing a non-problem, and would have burned the credibility of the true finding sitting next to
> it. Classify before you report.

## Net

| Claim | Verdict |
|---|---|
| Every URL in both published indexes resolves | **TRUE** — 664/664 |
| The doors index lists every door on disk | **FALSE** — 10 missing, 9 of them shipped today |
| The interop index lists every interop file | **FALSE, and correctly so** — it is curated; real gap is 4, not 2,065 |

## Backlog rows, corrected

| id | Row | PROOF |
|---|---|---|
| F34 | Derive `/.well-known/index.json` from the directory at build time | file count == `total_doors` |
| F35 | Gate failing the build when door-file count ≠ `total_doors` | one red run proving it fires |
| F36 | Index the 9 doors merged 2026-09-05 | `curl -s /.well-known/index.json \| grep -c gleif-lei` → 1 |
| F40 | **Supersedes an earlier draft of F35.** Do **not** add an equivalent gate for `/interop/index.json` — that index is curated by design and a count-equality gate would fail permanently on 1,851 legitimately excluded evidence files | the classification table above |
| F41 | Decide whether the 4 top-level interop candidates belong in the index | a decision recorded, or 4 new entries |

_Audited 2026-09-05. 664 URLs probed. Where a raw count suggested a problem, the files were
classified before the problem was reported._
