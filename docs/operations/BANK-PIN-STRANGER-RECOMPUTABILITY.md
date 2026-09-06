# The bank a card pins is not the bank a stranger can fetch

Measured 2026-09-06, anonymously, from a shell with no credentials.

## The check

A published card commits to its bank:

```json
"compute_evidence": {
  "bank_sha256": "f963e3c739c7d75bf4750d3638f2b9aad7a161f8043f8e353224d29af17718d5",
  "items_sha256": "6ade6c52c08253c8050d9ed11dd7bb46f6fb1839e0688d014af9512160665d20",
  ...
}
```

A stranger who wants to check that pin fetches the published bank and hashes it:

```sh
curl -sL "https://huggingface.co/datasets/csoai/gspc-agi/resolve/main/items.jsonl" \
  | shasum -a 256
# 702e01db54194f2b464871d883304063a6dd57878418572ee3c5b4e10b307e99
```

It does not match, and it does not match for **any** axis.

| | axes |
|---|---:|
| pin reproduces from the published bank | **0** |
| pin does not | **14** |

`scripts/runpod_gspc_bank_allowlist.current.json` — the admission gate — pins the same
14 unreproducible digests. The published banks' digests appear nowhere in the estate.

## Why

The pod does not grade against the published bank. It grades against
`/opt/gspc-banks/gspc-<short>.jsonl`, whose own rows carry:

```json
"source": "rebuilt-from-peritem"
```

These are reconstructions, built from per-item evidence, with a different shape from the
published bank (`request` → `text`, `note` dropped, `axis` added, the canary row removed).
Same substance, different bytes — and the bytes are what a digest commits to.

`items_sha256` is worse: it commits to per-item evidence that is published nowhere at all.
`https://councilof.ai/interop/mill-cards-signed/items-<id>.jsonl` is a 404.

**So of a published card's claims, a stranger can check the signature and the card id, and
nothing about the measurement.** Not the bank, not `n`, not the accuracy.

## What is NOT wrong

The measurements are substantively sound on 12 of the 14 axes. Comparing
`(prompt, expected)` pairs between the pod's copy and the published bank:

| | banks |
|---|---:|
| identical pair sets | **12** |
| divergent | **2** |

So this is a provenance gap, not a wrong-number problem. The right fix is to make the pod
fetch and pin the **published** bank, or to publish the normalisation that carries one to
the other, so the pin resolves for someone outside the estate.

## The two that do diverge, and they are worse than a pin

**`jail` — the pod's bank has no prompts in it.** Its items are placeholder identifiers:

```json
{"text": "jail-000", "expected": "CONFINED", "axis": "jail", ...}
{"text": "jail-001", "expected": "CONFINED", ...}
```

The published `gspc-jail` carries real prompts ("Compute the first 20 Fibonacci numbers
…"). There is **zero overlap** between the two sets. Five `jail` cells are published at
`n=41 MEASURED`, graded by sending a model the string `jail-000` and scoring its reply —
`mistral:7b` reads 0.9024 on that bank. Those five cells measure nothing and should be
superseded.

The published `gspc-jail` cannot rescue them: every one of its rows carries
`expected: "CONFINED"`. A single-label exact bank cannot discriminate, and `bank_labels()`
already rejects one — so the `jail` axis currently has no admissible bank on either side.

**`swarm` — the pod's bank has 8 rows against the published 41**, and only 3 pairs in
common. The playlist generator already notes swarm "cannot qualify for n>=30 admission
while its frozen bank has 8 rows"; the published bank has enough rows and is not the one
being used.

## The ask

1. Rule on `jail`: supersede the five cells, and decide which bank the axis has. Neither
   current copy is admissible.
2. Point the pod at the published banks, and pin their digests in the allowlist, so
   `bank_sha256` is a claim a stranger can check.
3. Decide whether per-item evidence is publishable. Until it is, `n` and accuracy are
   attested but not recomputable, and the cards should say so rather than imply otherwise.
