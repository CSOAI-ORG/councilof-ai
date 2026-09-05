# docs/github — the GitHub face of the estate

Everything in this directory is **derived**, not typed. Regenerate with:

```bash
python3 scripts/github/org-readme.py --profile > docs/github/PROFILE-README.md       # account / org profile (also pushed to CSOAI-ORG/.github/profile)
python3 scripts/github/org-readme.py --personal docs/github/PERSONAL-PROFILE-DRAFT.md  # draft for the repo named after the login — never pushed by a lane
python3 scripts/github/org-readme.py --councilof README.md                           # top block of this repo's README (between the org-readme markers)
python3 scripts/github/org-readme.py --inventory docs/github/ORG-INVENTORY-$(date -u +%F).md   # every public repo, with probes
python3 scripts/github/social-preview.py docs/github/social-preview.png             # 1280×640, white + #16a34a, the lid wordmark, the live lid
python3 scripts/github/repo-metadata.py --plan plan.json && python3 scripts/github/repo-metadata.py --diff plan.json
```

Brand, in the owner's words (2026-09-05): *branded CSOAI, not tacky*. White ground, one green `#16a34a`, the lid wordmark
`CS<strong>O</strong>AI`, one badge row that links only to things that exist, tables derived from live endpoints, plain sentences.
No animated anything, no trophies, no gradients, no emoji storms. The generator refuses to emit a page that carries
"certified", "BFT", "sovereign" or a price.

## A fact that changes what renders where

`CSOAI-ORG` is a **user account** (`GET /users/CSOAI-ORG` → `"type": "User"`), not a GitHub
organisation. Consequences, all checked 2026-09-05:

| thing | organisation | user account (`CSOAI-ORG`) |
|---|---|---|
| profile README source | `.github/profile/README.md` | `CSOAI-ORG/csoai-org/README.md` (the repo named after the login — GitHub matches the name case-insensitively) |
| `CSOAI-ORG/.github/profile/README.md` | renders on the org page | **does not render anywhere** — kept regenerated daily so it is ready the day the account becomes an org, and ready to copy |
| pinned repositories | set in the browser by an org admin | **no API**: the GraphQL schema exposes only `pinIssue`/`pinEnvironment`; pins are set in the browser |
| `gh api orgs/CSOAI-ORG` | 200 | 404 |

So the generated profile is written to **three** places — `CSOAI-ORG/.github/profile/README.md`
(pushed, regenerated daily by `org-readme.yml` in that repo), [`PROFILE-README.md`](PROFILE-README.md) here,
and [`PERSONAL-PROFILE-DRAFT.md`](PERSONAL-PROFILE-DRAFT.md) — the draft for `csoai-org/README.md`, which
is the owner's personal profile and which no lane touches.

## The daily job

`CSOAI-ORG/.github/.github/workflows/org-readme.yml` (06:17 UTC + `workflow_dispatch`) checks out
`scripts/github` + `docs/product` from this repo, runs `org-readme.py --profile`, and commits
`profile/README.md` with that repo's own `GITHUB_TOKEN` (`contents: write` on `.github` only).
**No secret is needed** — every source is a public GET — so the question of whether
`GSPC_BOARD_TOKEN` reaches `.github` does not arise; it is not used. Until PR #1413 is merged the
job reads the generator from the `ghorg-profile-05sep` branch (it tries `master` first, then falls back).

The inventory is **not** regenerated daily: it is a dated snapshot (`ORG-INVENTORY-YYYY-MM-DD.md`)
because a daily commit of a 600-row table into this repo would be noise. Re-run it when the estate changes.

## What the inventory flags

`claim:` — a description that still carries a retracted, unmeasurable or priced term (100/100, A+++++,
world-leading, a price, Stripe-tier, certified, "EU AI Act Compliant", BFT/Byzantine, sovereign-as-brand,
production-ready). `stale-count:` — a board count in a description that `GET /api/gspc` does not say
(compared, not eyeballed). `homepage-<code>` — the repo's homepage URL did not answer 200 on GET.
Plus the plain ones: no-description, no-topics, no-licence, stale-<days>d, no-readme, archived, fork.

## OWNER-ASKS (need the browser or a decision; nothing here needs a password we hold or a payment)

1. **Profile:** copy [`PERSONAL-PROFILE-DRAFT.md`](PERSONAL-PROFILE-DRAFT.md) into
   `CSOAI-ORG/csoai-org/README.md` (strip the HTML comment at the top), or say the word and a lane pushes it.
   What renders today is the hand-written "Nicholas Templeman — Founder" page.
2. **Pins (browser only — github.com/CSOAI-ORG → Customize your pins):** replace the six MEOK MCP repos
   currently pinned (`dora-compliance-mcp`, `eu-ai-act-compliance-mcp`, `csoai-cra-annex-iv-classifier-mcp`,
   `csoai-governance-engine-mcp`, `csoai-mcp-injection-scan-mcp`, `csoai-watermark-attest-mcp` — their READMEs
   still carry "Pro (£199/mo)", Stripe badges and "EU AI Act Compliant" badges) with:
   `councilof-ai` · `gspc-board` · `a2a-signed-receipts` · `inspect-receipts` · `corpus-watch` · `carder`.
   Why not the brief's exact six: the `csoai-gspc-mcp` source and the `csoai-gspc` (PyPI) source are both
   *inside* `councilof-ai` (`mcp/gspc-server/`, `scripts/spray/pypi/csoai-gspc/`), so they collapse into one
   pin; and the MCP governance server (`csoai-governance`) has a README with "$99/mo", "Production-ready" and
   "sovereign" — pinning it would put a priced page on the profile until that README is rewritten.
3. **Social preview (browser only — repo → Settings → Social preview → Upload):** upload
   [`social-preview.png`](social-preview.png) (1280×640, white + `#16a34a`, the lid wordmark, the live lid,
   stamped `derived …`) to `councilof-ai`, `.github` and `csoai-org`. Regenerate it whenever the lid changes.
4. **Six pinned READMEs:** the MEOK MCP READMEs above still carry prices and "Compliant" badges; this lane
   changed only their one-line descriptions. Rewriting those READMEs is a separate, owner-scoped lane
   (they are MEOK-branded products, see `csoai-vs-meok-boundary`).
5. **The one `claim:` left after the sweep:** `consciousness-engine-mcp` — "Based on Sovereign Temple
   architecture" is a product name, not a brand adjective; decide whether the name stays.
6. **20 homepage URLs that do not answer 200** (list in the inventory): mostly `*-hive` repos pointing at
   `.ai` domains that are parked, 402, 404 or unreachable. Either clear the homepage field or bring the site up.
