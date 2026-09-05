# docs/github — the GitHub face of the estate

Everything in this directory is **derived**, not typed. Regenerate with:

```bash
python3 scripts/github/org-readme.py --profile > docs/github/PROFILE-README.md      # account / org profile
python3 scripts/github/org-readme.py --councilof README.md                          # top block of this repo's README
python3 scripts/github/org-readme.py --inventory docs/github/ORG-INVENTORY-$(date -u +%F).md
python3 scripts/github/social-preview.py docs/github/social-preview.png            # 1280×640, white + green, the live lid
python3 scripts/github/repo-metadata.py --plan plan.json && python3 scripts/github/repo-metadata.py --diff plan.json
```

## A fact that changes what renders where

`CSOAI-ORG` is a **user account** (`GET /users/CSOAI-ORG` → `"type": "User"`), not a GitHub
organisation. Consequences, all checked 2026-09-05:

| thing | organisation | user account (`CSOAI-ORG`) |
|---|---|---|
| profile README source | `.github/profile/README.md` | `CSOAI-ORG/csoai-org/README.md` (repo named after the login) |
| `CSOAI-ORG/.github/profile/README.md` | renders on the org page | **does not render anywhere** — kept regenerated daily so it is ready to copy |
| pinned repositories | GraphQL mutation exists for org admins | **no API**: the schema exposes only `pinIssue`/`pinEnvironment`; pins are set in the browser |
| `gh api orgs/CSOAI-ORG` | 200 | 404 |

So the generated profile is written to **two** places — `CSOAI-ORG/.github/profile/README.md`
(pushed, regenerated daily by `org-readme.yml` in that repo) and
[`PROFILE-README.md`](PROFILE-README.md) here — and the **owner** decides whether it replaces
`csoai-org/README.md`, which this lane did not touch.

## OWNER-ASKS (need the browser or a decision; nothing here needs a password we hold or a payment)

1. **Profile:** copy [`docs/github/PROFILE-README.md`](PROFILE-README.md) into
   `CSOAI-ORG/csoai-org/README.md` (or say the word and a lane pushes it). Its current copy
   says "22 slots · 15 measured" in the repo description — stale against the live 22 · 22 · 0.
2. **Pins (browser only — github.com/CSOAI-ORG → Customize your pins):** replace the six
   MEOK MCP repos currently pinned (`dora-compliance-mcp`, `eu-ai-act-compliance-mcp`,
   `csoai-cra-annex-iv-classifier-mcp`, `csoai-governance-engine-mcp`,
   `csoai-mcp-injection-scan-mcp`, `csoai-watermark-attest-mcp` — their READMEs carry a
   monthly subscription price, Stripe badges and "EU AI Act Compliant" badges, all against doctrine) with:
   `councilof-ai` · `gspc-board` · `a2a-signed-receipts` · `inspect-receipts` · `corpus-watch` · `carder`.
3. **Social preview (browser only — repo → Settings → Social preview → Upload):** upload
   [`social-preview.png`](social-preview.png) (1280×640, white + green, the live lid, stamped
   `derived …`) to `councilof-ai`, `.github` and `csoai-org`. Regenerate it whenever the lid changes.
4. **Six pinned READMEs:** the MEOK MCP READMEs above still carry prices and "Compliant"
   badges; this lane changed only their one-line descriptions. Rewriting those READMEs is a
   separate, owner-scoped lane (they are MEOK-branded products, see `csoai-vs-meok-boundary`).
