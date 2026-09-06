# F60 — the harness is already public. The gap is packaging, not licensing.

The row read: *"Vals open-sources the evaluation harness (Valkyrie), not only a verifier. Ours is
not public."* **The second half is wrong.**

`harness/` holds **156 files** on `origin/master`, and `CSOAI-ORG/councilof-ai` is
`private: false`, `license: MIT`. The harness has been public the whole time.

| Layer (per `harness/README.md`) | File |
|---|---|
| measurement-card | `harness/arena/canon.py` |
| sov-instrument (deterministic transform) | `harness/arena/*.py` |
| arena-math | `harness/arena/elo.py` |
| engine (measure → sign → publish) | `harness/arena/axis_arena.py` |
| registry | `harness/regulator/*.py` |

Ninth self-correction of the day, same shape as the rest: the claim was inherited, not probed.

## The real gap

Valkyrie is a **named, standalone, findable project**. Ours is 156 files in a subdirectory of a
582 MB monorepo. Same licence, same openness, **incomparable discoverability**. A reviewer
comparing "do they open-source their harness" finds Valkyrie in one search and finds nothing for us.

That is a packaging problem, and packaging is cheap: a `harness/` README that names the thing, a
repo topic, and a line in `llms.txt` and the data room would close most of it. **No relicensing, no
new code.**

## Two things found inside the harness that matter more than the row did

### 1. `canon.py` already documents the trap I hit in JavaScript — and resolves it the *other* way

Its docstring, verbatim:

> *"Integer-valued floats emit as integers (Python `json.dumps(0.0)=="0.0"` but JS
> `JSON.stringify(0.0)=="0"`). We normalize int-valued floats to ints."*

and the code does it: `if o.is_integer(): return int(o)`.

So the estate had already identified the exact Python/JavaScript float incompatibility that cost me
half a day on `verify-estate.mjs` — **and canon.py resolves it by normalising `0.0` → `0`, which is
the opposite of what the 335 published cards did.** Those were signed under
`json.dumps(..., ensure_ascii=True)`, which emits `0.0`. `canon.py` also uses `ensure_ascii=False`
where the cards use `True`.

**This is flagged, not asserted as a defect.** `canon.py` computes a `content_id`; the published
cards carry an `id`. The most likely reading is that `canon.py` is a *later* card generation and the
two were never meant to interoperate. But if anything ever verifies a v0 card with `canon.py`, it
will fail every card carrying an integral float — 117 of 335 — for the same reason my first JS
attempt did. **Whoever owns the card schema should confirm which canonicalisation applies to which
generation, and say so in `HOW-TO-VERIFY.md`.**

### 2. `harness/README.md` mis-attributes Wilson CI

The README says `harness/arena/elo.py` is *"preference Elo + **Wilson CI** + McNemar"*.

`elo.py` contains **zero** occurrences of "wilson". It implements `bootstrap_ci` — a bootstrap
confidence interval, not a Wilson score interval. Wilson does exist in the estate, in 11 other
harness files including `harness/mcp/security-scorecard/stat_suite.py`. **The capability is real;
the README points at the wrong file.**

This matters slightly more than a typo because the Inngot IP profile lists *"Wilson-interval
issuance statistics for quotable scores"* as an intellectual asset. The asset exists — just not
where the README says.

## Consequence for F59

F59 asked whether the estate can compute confidence intervals for cards. **It can, and the code is
public and MIT.** Bootstrap CI in `elo.py`, Wilson in `stat_suite.py`. So F59's option 2 — bind an
interval into new cards — is not a build-from-scratch; it is wiring an existing public function into
the card producer.

## Rows

| id | Row | PROOF |
|---|---|---|
| F61 | Package the harness so it is findable: name it, README at `harness/`, repo topics, a line in `llms.txt` and the data room. No relicensing. | a search for the name returns it |
| F62 | Confirm which canonicalisation applies to which card generation (`canon.py` int-normalising vs the v0 `ensure_ascii=True` rule) and record it in `HOW-TO-VERIFY.md` | the file states both, and which cards each governs |
| F63 | Fix `harness/README.md`: `elo.py` is bootstrap CI, not Wilson; Wilson is in `stat_suite.py` | `git grep -c wilson harness/arena/elo.py` → 0 |
