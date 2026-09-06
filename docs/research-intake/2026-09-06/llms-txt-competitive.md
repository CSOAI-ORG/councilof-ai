# F56 — is our `llms.txt` competitive in content, or only present?

Probed 2026-09-06, control-first. `llms.txt` is the emerging convention for telling an AI agent
what a site is and where its machine surfaces are — the agent-facing equivalent of `robots.txt`.

## It is a norm here, not a novelty

**Six of seven probeable peers serve a real one.** Two more could not be probed at all.

| Host | control | bytes | lines | headings | links | numbers | verdict |
|---|---|---|---|---|---|---|---|
| **Council of AI** | 404 | **11,711** | **151** | **13** | 48 | **43** | real |
| ModelOp | 404 | 7,863 | 66 | 7 | 48 | 9 | real |
| Holistic AI | 404 | 6,131 | 62 | — | — | — | real |
| Credo AI | 404 | 5,633 | 34 | 0 | 31 | 14 | real |
| Saidot | 404 | 4,846 | 63 | — | — | — | real |
| LatticeFlow | 404 | 3,325 | 54 | — | — | — | real |
| Vals AI | 404 | 985 | 31 | 5 | 13 | 0 | real |
| LMArena, Trismik | **200** | — | — | — | — | — | **catch-all → UNMEASURED** |

The control matters here exactly as it did for the DID probe: LMArena and Trismik return 200 for a
path that cannot exist, so their `llms.txt` 200s mean nothing and they are **not** counted either way.

## Ours is the longest — which is not automatically good

11,711 bytes against a 4,964-byte median for the probeable peers, and **43 numbers against
ModelOp's 9 and Vals AI's 0**. Embedded counts are a stale-risk surface: a number in a static file
is wrong the moment the thing it counts moves, and this estate has had a count go stale in a grant
answer within 24 hours (the "70 of 761 unmeasured" line, now 796/796/0).

**So the length is a liability unless the numbers are derived. They are.**

`scripts/llms-txt.mjs` builds both files from templated placeholders —
`{{LID}} {{PUBLIC_COUNT}} {{AXES}} {{MEASURED}} {{UNMEASURED}} {{MODEL_FLEETS}} {{FACT_RUNS}} {{DOI}}`
— resolved against **live `GET /api/gspc`**, and `pr-gates.yml` runs
`node scripts/llms-txt.mjs --check`, which **fails the PR when the committed file does not equal
what the script derives**. The script's own header records why: a number was hard-coded as
"22·22·0" once and drifted.

## The finding

Presence is not a differentiator — **6 of 7 peers have one**. What is checkable and, on this probe,
unmatched is that **ours is the most detailed and its numbers are derived from the live board with
a CI gate enforcing it**. Every peer file examined carries hand-written numbers with no visible
mechanism keeping them true; Vals AI sidesteps the problem by carrying none at all, which is also a
legitimate answer.

Stated the way it should be quoted: *our `llms.txt` is generated from the live board and a CI check
fails the build if the published file disagrees with it.* That is a claim about mechanism, it is
verifiable by running the checker, and it does not require anyone else to be worse.

## What this does not establish

- **Nothing about quality of content.** More bytes and more headings is not more useful to an agent.
  A 985-byte file that answers the question fast may serve a crawler better than an 11 KB one.
- **Nothing about the two catch-all hosts.** UNMEASURED, not absent.
- **Nothing about whether agents read any of these files.** Presence and derivation are measurable;
  consumption is not, from outside.

```bash
# reproduce — control first, or the 200s lie
for h in councilof.ai modelop.com credo.ai vals.ai lmarena.ai; do
  printf "%-16s control=%s llms=%s\n" "$h" \
    "$(curl -s -o /dev/null -w '%{http_code}' -m 12 https://$h/csoai-control-path-that-cannot-exist-9f3a2b)" \
    "$(curl -s -o /dev/null -w '%{http_code}' -m 12 https://$h/llms.txt)"
done
node scripts/llms-txt.mjs --check     # ours: derived, gated
```
