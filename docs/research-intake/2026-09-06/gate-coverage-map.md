# What the gates actually cover — 6 September 2026

Three times today a published artefact turned out to be **real but ungated**: the doors index
(9 live doors listed nowhere), the EMILIA vector pin (enforced by whoever remembered), and the
published verifier bundle (current by diligence). Each was found by asking *does anything enforce
this?* rather than assuming something did. This maps the answer.

## The suite is substantial

~30 blocking steps across `pr-gates.yml` and `deploy.yml`, including brand, facts, price,
signed-json, evidence-integrity, outward-claims, prerender, shell-smoke, size, link, public-root
witness integrity, and `llms.txt` derivation.

**Three of those did not exist this morning** and were added by this lane today:

| Gate | What it stops |
|---|---|
| `wellknown-index-gen.mjs --check` | a door that serves 200 and is absent from the index |
| `node --test` on the card-verifier package | a vector moving on a frozen external boundary |
| `bundle.mjs --check` | the published verifier drifting from its own source |

## A question worth closing: did `link-gate` miss the dead `/api` link?

`scripts/link-gate.mjs` exists precisely for dead links in machine surfaces — its header cites the
`hf-badges-index.json` case where six badge `image` URLs were 404 and *"every gate we run was green:
brand-gate reads display fields, facts-gate reads claims, signed-json-guard reads structure. Nothing
read a link."*

Yesterday I fixed `/api/eu-ai-act/art50` by hand — a 404 advertised in two published manifests. **Did
the gate miss it?**

**No. It did not exist yet.** `link-gate.mjs` landed **2026-09-06 04:43**; the manual fix was
2026-09-05. And exercising its exported `isServed` against a synthetic route table containing an
`/api/[[path]]` catch-all, `/api/eu-ai-act/art50` resolves **not served** — the gate would fail it.

**Stated limit:** that was the *logic* tested against a synthetic route set, not the real one.
`link-gate.mjs dist/client` needs a built tree, and R16 forbids a full checkout for a docs PR, so
the real route table was not exercised here. **UNMEASURED, not verified.**

## The shape of what is still uncovered

Not a list of defects — a list of *questions nobody has a gate for*. Each is cheap to answer and
none has been:

| id | Surface | Question |
|---|---|---|
| F64 | `csoai.org/.well-known/did.json` | Lives in a different repo (`csoai-site`). Does anything check the 5 keys stay consistent with what the cards and root actually use? A key rotation there silently breaks every verifier. |
| F65 | `/interop/index.json` | Curated by design (F40 — a count gate would fail on 1,851 legitimately excluded evidence files). But **nothing** checks that the 372 entries it does list still resolve. The doors index now has that; interop does not. |
| F66 | `/api/x402` `invariants` | The estate's public promises — `no_public_price`, `never_a_grade`, `recomputable_for_free`. `price-gate` enforces the first mechanically. Nothing enforces that the invariants block itself stays present and unweakened. |
| F67 | The three Rule B artefacts | `arena_scoreboard`, `eat_compliance_board`, `gspc-board.signed` carry `content_id` and are signed under a different canonicalisation. `signed-json-guard` covers `/signed/*.json` structurally — does anything verify their **signatures**? `verify-estate.mjs` covers Rule A cards and the root only. |

**F67 is the one I would take next.** Today's stranger-verification proved 335 Rule A cards and the
root. The three Rule B artefacts are published, signed, and — as far as this sweep can tell — never
independently verified by anything. That is the same shape as the three gaps already closed today.

_Mapped 2026-09-06. The gates listed were read from the workflow files; the coverage questions are
questions, not findings._
