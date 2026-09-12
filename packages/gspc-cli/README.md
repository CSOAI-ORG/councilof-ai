# @csoai/gspc-cli — `csoai`

The Council of AI command line. Measurement, never certification.

## `csoai check <model>`

Print the signed axis/staleness snapshot for any model on the public
measurement record — one row per measured axis: accuracy, the card's age in
days, and the verification state of that card's Ed25519 signature against the
pinned `did:web:csoai.org` key.

```
$ csoai check qwen3:0.6b
csoai check — qwen3:0.6b
signed cells: 15 · oldest card age: 24d · every row verified against the pinned did:web:csoai.org key

arc-30                     71.4%  age  24d  VALID
care-refusal-help          55.0%  age  24d  VALID
...

RESULT: all 15 signed card(s) VALID · measurement, never certification
verify offline yourself: gspc-verify <card.json>  (packages/gspc-card-verifier)
```

Three states, never two: **VALID · INVALID · UNCHECKABLE** — "could not check"
is reported as itself, never upgraded to a pass. Exit codes: `0` all VALID ·
`1` any INVALID · `2` unknown model / fetch failed / any UNCHECKABLE.

Options: `--json` (machine-readable) · `--contains` (substring match) ·
`--base <url>` (default `https://councilof.ai`).

## What this is not

A grade, a certification, or a ranking of your model. The card axes are
benchmark axes, not the governance board axes (`GET /api/gspc`). The command
reports what was measured, when, and whether the signed bytes verify — nothing
else is for sale and nothing else is claimed.

## Verify offline

`check` fetches (it reports live state, so it must). To verify cards you
already hold with **no network at all**, use the zero-dependency
[`gspc-verify`](../gspc-card-verifier) command — same pinned key, same three
states, works air-gapped.
