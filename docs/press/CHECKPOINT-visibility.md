# CHECKPOINT — visibility / standards lane, 2026-09-06

Every number below has the command that returns it. Nothing is typed from memory.

## KPIs

| KPI | value | derived by |
|---|---|---|
| Backlog rows, total | **25** | `grep -c '^| B-' docs/press/BACKLOG-05Sep2026.md` |
| Rows added this session | **6** (B-20 … B-25) | same, against `origin/master` |
| EVOLVE rules, with the failure that taught each | **5** | `grep -c '^## E-T6-' docs/press/EVOLVE-05Sep2026.md` |
| Assertions unlocked in CI | **1007** across 9 files | `npx vitest run scripts` — previously not on the runner's path list |
| Gated producers still yielding committed bytes | **7 of 12** | `node scripts/producers-check.mjs` |
| Dead-link baseline (may only shrink) | **52** on master | `jq '.targets\|length' scripts/link-gate-baseline.json` |
| Service heroes | **5 files, 9207 bytes total** | `wc -c public/images/services/*.svg` |
| Feeds live | **5 of 5 answer 200**, 5 `rel=alternate` on `/` | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/feeds/…` |
| A2A registry | **LISTED, healthy, conformant** | `curl -s a2aregistry.org/api/agents/48e5bba6-…` |
| Docker MCP registry | **328 servers, 0 ours** | `gh api …/git/trees/main?recursive=1` |
| HF org Spaces carrying the AG-UI + Council OS links | **2 of 2**, verified live | `curl -s huggingface.co/spaces/csoai/README/raw/main/README.md \| grep -c 'agui/gspc-state'` |
| Self-probes against our own origin this hour | under the 20/hour Cloudflare-free budget | counted per call, not estimated |

## What moved

- **#1633** `producers-check` was blind to one file per run — a `.trim()` on the whole
  porcelain block ate the leading space of line 1, so a planted drift in whichever path git
  listed first exited 0. Fixed, and the selftest rewritten over a fixture after the first
  version passed **under the bug**.
- **#1635** Five service heroes that plot live quantities, plus `brand-gate` learning to read
  SVG — it had never scanned one, and 29 ship. Nothing linked; contact sheet with the owner.
- **#1643** Three directories probed. The A2A registry item in the brief was already done
  eighteen days ago; Docker's 328-server registry does not have us and the submission files are
  written; cursor.directory rate-limited us and stays **UNKNOWN**, not NOT_LISTED.
- **#1648** Eight `scripts/` test files had never run in CI — now they do, and the first CI run
  proves it (`scripts/archive-index.test.ts` alone is 701 tests). Also: a 2-second `echo` could
  turn the required `gates` check green for 1m41s while the real suite was still running. Fixed
  by collapsing two workflows into one that decides its own scope; making the cheap one fail
  instead was tried on this very PR and left it BLOCKED, which is the worse failure.
- **HF** Both org Spaces re-derived and pushed; they now carry the AG-UI stream and Council OS
  links. Producer-written, never hand-edited.

## Blocked, one line each

- **B-23 OWNER-ASK** — the services heroes contact sheet needs your eye before anything links
  them: `docs/press/services-heroes-contact-sheet.html`.
- **Docker MCP registry** — the PR is owner-gated (posting under CSOAI's name on Docker's repo).
  Files ready at `docs/press/submissions/docker-mcp-registry/`; confirm the repo licence first.
- **cursor.directory** — one GitHub OAuth sign-in, no password account, then a form. Owner's.
- **Dead-link baseline** — shrinking it further needs `npm run build:client`, and the machine has
  under 400 MiB free. Not attempted rather than half-attempted.
