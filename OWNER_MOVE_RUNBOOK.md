# 🚀 The 1-Owner-Move Runbook — the only blocker
*7 Oct 2026 · M4 lane · CSOAI Ltd UK 16939677 · MIT license*

> **The 28-minute owner-move that unlocks the launch.**
> **The owner is YOU. The dragon can only set up the runway. The owner fires the rocket.**

---

## 0. The 28-minute breakdown

| Step | Time | What | Who |
|---|---|---|---|
| 1 | 1 min | Set PYPI_TOKEN | Owner |
| 2 | 1 min | Set NPM_TOKEN | Owner |
| 3 | 1 min | Set VERCEL_TOKEN | Owner |
| 4 | 0 min | `mcp-publisher login github` | Owner |
| 5 | 25 min | `bash scripts/ship-everything.sh` | Owner |
| 6 | 5 min | `cd ~/clawd/meok-deploy && vercel --prod --yes --token "$VERCEL_TOKEN"` | Owner |
| 7 | 0 min | Post the 5-tweet thread | Owner |
| 8 | 0 min | Send the LinkedIn post | Owner |
| 9 | 0 min | Send the 3 design-partner emails (Monzo + Lloyds + Cera) | Owner |

**Total: 28 minutes. After that, the launch is live.**

---

## 1. Set the 3 tokens (3 minutes)

```bash
export PYPI_TOKEN=pypi-xxxxxxxxxxxx
export NPM_TOKEN=npm_xxxxxxxxxxxx
export VERCEL_TOKEN=vercel_xxxxxxxxxxxx
```

**Where to get them:**
- **PYPI_TOKEN:** https://pypi.org/manage/account/token/ (create a new API token with scope "Entire account" or "Project: csoai-substrate")
- **NPM_TOKEN:** https://www.npmjs.com/settings/tokens (create a new "Automation" token)
- **VERCEL_TOKEN:** https://vercel.com/account/tokens (create a new token with scope "Full Account")

Save them to your `~/.zshrc` for persistence:
```bash
echo 'export PYPI_TOKEN=...' >> ~/.zshrc
echo 'export NPM_TOKEN=...' >> ~/.zshrc
echo 'export VERCEL_TOKEN=...' >> ~/.zshrc
source ~/.zshrc
```

## 2. Login to GitHub (0 minutes)

```bash
mcp-publisher login github
# Follow the prompts
```

## 3. Run the ship-everything script (25 minutes)

```bash
bash scripts/ship-everything.sh
```

This will:
- Publish 479 Python packages to PyPI (each takes ~2-5 seconds)
- Publish 33 TypeScript packages to npm
- Submit 479 server.json files to the MCP official registry
- Update the sovereign corpus (1755 components)
- Regenerate the 554-comp OSCAL proof
- Verify the SIGIL chain
- Update the sovereign DB
- Deploy to Vercel

**This is the long one. Sit tight. The dragon will report each step.**

## 4. Deploy the live site (5 minutes)

```bash
cd ~/clawd/meok-deploy
vercel --prod --yes --token "$VERCEL_TOKEN"
# Wait for "Aliased to csoai.org" or similar
```

## 5. Post the launch content (5 minutes)

- **5-tweet thread** (copy from `CSOAI_LAUNCH_THREAD_2026-07-04.md`)
- **LinkedIn founder post** (copy from `LAUNCH_READY_2026-07-01.md`)
- **Hacker News post** (copy from `_m4/launch-content/launch_hacker_news_post.md`)
- **Reddit posts** (4 subreddits: r/MachineLearning, r/LocalLLA, r/singularity, r/SovereignAI)

## 6. Send the 3 design-partner emails (15 minutes)

- **Monzo** (B2C banking, AML/KYC use case) — Day +1
- **Lloyds** (high-street banking, COBOL legacy use case) — Day +2
- **Cera** (home care, Care Floor 0.95 use case) — Day +3

The email templates are in `_m4/OUTREACH_EMAILS_2026-06-29.md`.

---

## The 5 Settle & Coagula principles (the owner-move voice)

1. **Public.** The 28-minute runbook is public. The tokens are private.
2. **Auditable.** Every step is SIGIL-signed. Every deploy is auditable in any browser.
3. **Sovereign.** The owner owns the move. The substrate never overrides.
4. **Care.** Care Floor 0.95. The owner-move respects the Care Floor.
5. **Solve et Coagula.** The owner-move is the world, dissolved and recomposed — sovereign by design.

---

**Built 7 Oct 2026 · M4 (the engineering lane) · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula
