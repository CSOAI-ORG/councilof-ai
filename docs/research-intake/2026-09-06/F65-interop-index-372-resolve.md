# F65 — the interop index's 372 entries all resolve, and nothing keeps them resolving

**Lane:** TUI-5 · **Date:** 2026-09-06 · **Status:** measured, zero probes

## Result

`public/interop/index.json` declares `total_formats: 372` and carries **372** entries.
All 372 point at `https://councilof.ai/…`, and **372/372 resolve to a file that exists in
`public/`**. Zero missing. Measured offline against the tree at `origin/master` — no network,
no sample, complete coverage, and none of the ≤20/hour probe budget.

The declared total and the actual entry count agree (372 == 372), which is the check that
matters most here: a census that disagrees with its own declared total is the failure mode this
estate has already published once.

## Why the existing link gate does not cover this

`scripts/link-gate.mjs` walks published JSON and resolves references against the built tree. It
does not catch these, because **every one of the 372 is an absolute URL** —
`https://councilof.ai/interop/HARNESS.md`, not `/interop/HARNESS.md`. The gate resolves paths;
these are URLs that happen to point at ourselves.

So F65 is real: nothing checks them. The good news is that checking them costs **nothing** —
strip the `https://councilof.ai/` prefix and ask the filesystem. 372 checks, no requests.

## The wrong turn, recorded because it is the actual lesson

The obvious generalisation is "gate every absolute self-URL in every published JSON". I measured
that first and got:

```
absolute https://councilof.ai/ refs across public/  : 7838
  no matching file in public/                       : 3852
```

**That 3852 is nearly all false positives, and publishing it would have been badly wrong.**
The examples were `/api/gspc` and `/api/swift` — Cloudflare Pages **Functions**, which serve
perfectly well and will never be files in `public/`. Re-measured against the 356 Function routes
in `functions/`, plus the `[[path]]` catch-alls:

| Where an absolute self-URL points | Count |
|---|---:|
| a static file in `public/` | 3986 |
| a Pages Function route | 1335 |
| neither — SPA route or genuinely dead | 2517 |
| **total** | **7838** |

The remaining 2517 are dominated by client routes like `/gspc-verify` and `/cobolbridge`, which
the React app serves and which are not files either. Separating those from real dead links needs
the app's route table — which is precisely what `lane/link-gate-routes` (#1556) is building.

**Conclusion: do not build the general gate here.** It would duplicate #1556 and, done naively,
would ship a gate that is wrong about 3852 links — a gate that cries wolf gets disabled, and then
the surface is unprotected while looking protected.

## Recommendation

Two separate things, and only the first is small:

1. **A narrow interop-index gate** — 372 entries, static files only, zero probes, complete. The
   entries are all `/interop/*` static artefacts, so no route knowledge is needed and the false-
   positive class above cannot arise.
2. **The general absolute-self-URL case** belongs to #1556, once the route table lands. Worth
   handing that lane the numbers above: 1335 of the refs it will see are Function routes and
   ~2517 need the route table, so a naive existence check is not the shape.

Filed rather than implemented: `scripts/` beyond `verify-estate.mjs` is not TUI-5's file area,
and #1556 is actively writing the file this would touch.

## Provenance

Every number above is from one offline pass over `origin/master`: 6882 JSON files under
`public/`, 356 route files under `functions/`. Reproduce with the two scripts recorded in this
lane's session log. No network was used, so nothing here depends on the live site being up.
