# Financial axes — recomputability, declared per axis

Verified live 2026-09-05. Every row below was re-derived at run time, not copied from a previous
document.

## Result: all 8 recompute

| axis | n | how n is derivable | `content_id` verifies | preimage rule | attestation |
|---|---|---|---|---|---|
| provenance-controls | 6 | **`len(measured)`** — no top-level `n` | yes | **`sha256(canonical body − content_id − signature)`** | ED25519_SIGNED |
| reserve-attestation | 16 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |
| regulatory-framework | 16 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |
| distribution-integrity | 16 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |
| custody-disclosure | 16 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |
| ai-adoption-components | 2 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |
| labour-components | 2 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |
| humanoid-labour-index | 8 | top-level `n` | yes | `sha256(canonical body − content_id)` | CONTENT_ADDRESSED_UNSIGNED |

Canonical form throughout: `json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`.

## Why this document exists rather than a field in each file

**None of the eight states its own preimage rule.** A content address whose rule is undeclared is
verifiable only by someone who guesses it — finding the first took four wrong candidates, and the
signed axis needed a fifth. Signed mill cards already carry
`preimage_rule: "sha256(canonical body)"`; these do not.

The obvious fix — add a `preimage_rule` field — **cannot be applied to these files**. `content_id` is
computed over the body, so adding any field changes the digest of all eight, and for
`provenance-controls` it would invalidate an Ed25519 signature under
`did:web:csoai.org#card-attestation-1`. Signed bytes are never edited; they are superseded or
ledgered. So the rule is declared here, beside the artefacts, until a supersede pass is warranted.

## Two rules, and why the difference is correct

`provenance-controls` excludes `signature` as well as `content_id`, and that is not an inconsistency:
**a signature cannot cover itself**, and a content address computed after signing cannot include the
signature it is meant to accompany. The seven unsigned runs have no signature to exclude. Both are
right; neither is written down anywhere but here.

## Two n-derivations

Seven carry a top-level `n`. `provenance-controls` does not — its count is `len(measured)`. A checker
that reads `n` and finds it absent must not record zero: **the count is present, in a different
place**. That is the concrete instance of "absent ≠ zero" in this family.

## Re-run everything above

```
python3 - <<'PY'
import json, hashlib, urllib.request
from urllib.parse import urljoin
UA = {"User-Agent": "Mozilla/5.0 csoai-recompute"}          # a bare urllib UA gets 403 from the edge
get = lambda u: json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40).read())
canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
for a in [x for x in get("https://councilof.ai/api/gspc")["axes"] if x.get("separation") is None]:
    j = get(urljoin("https://councilof.ai", a["evidence_url"]))
    cid = j.get("content_id")
    r1 = hashlib.sha256(canon({k: v for k, v in j.items() if k != "content_id"})).hexdigest()
    r2 = hashlib.sha256(canon({k: v for k, v in j.items() if k not in ("content_id", "signature")})).hexdigest()
    n_ev = j.get("n", len(j.get("measured") or []))
    print(a["axis"], a["n"] == n_ev, cid in (r1, r2))
PY
```

Expected: every line `True True`.

## A note on the 403

A bare `urllib` request to `/api/gspc` returns **403** from the edge; the same URL with a normal
User-Agent returns 200. A recomputability checker that treats that 403 as "the axis is unavailable"
would report an outage that does not exist. It is a User-Agent condition, not an access one.
