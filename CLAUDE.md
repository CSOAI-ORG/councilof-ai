# CLAUDE.md — CSOAI / councilof-ai agent coordination

Shared working agreement for ALL agents on this repo. Read this first.

## Deployed truth (verified 2026-08-31 — supersedes 2026-08-26)
- THIS repo → **Cloudflare Pages `councilof-ai`** → **https://councilof.ai**.
  Vercel Git unlinked; leftover Vercel projects (`csoai-v2-app`, `councilof-ai-src`, …)
  **deleted 31 Aug 2026**. Do not `vercel deploy`. Do not wait for Vercel GitHub checks.
  Merge gate = GHA `deploy.yml` + `curl -I https://councilof.ai`.
- Live board: `GET https://councilof.ai/api/gspc` → **22 slots · 22 measured · 0 UNMEASURED**.
  Cards: **THREE numbers, over three different artifacts** — quote the one you mean, and say
  which file it came from. All three re-fetched live 2026-09-05:
  · `/signed/card_index.json` → `n_cards` == `n_cells` == **335**. This is the BOARD's card
    chain, and it is what `BOARD-RULING.md` and the CARDS-335 lock in
    `_alignment/OUTSTANDING-MOVES-2026-08-31.md` both name ("Do not clamp 150/313").
  · `cards-bundle.json` → `card_count` = **1072**, every `public/cards/*.json` wrapper on
    disk. The generator's own note: "Copies bytes that already exist under /cards/ and
    /proofs/; **signs nothing, measures nothing**." A build-time aggregate, not an attestation.
  · `root.json` → `card_count` = **152**, the `card_sha256` leaves committed to the SIGNED
    Merkle root. This is the attested set. (`cards-bundle.json` also mirrors it as
    `root_card_count`; the two can drift by a build, not by disagreement.)
  CORRECTION 2026-09-05: an earlier version of this line said "Cards 335/335 matches neither
  number". It does match — `card_index.json` returns exactly 335/335 live. That edit compared
  a true statement against two figures from a DIFFERENT artifact and told every agent loading
  this file that a live, locked number was bogus, which is precisely what the CARDS-335 lock
  exists to prevent. Three artifacts, three counts, all correct for what they count.
  Stamp SIGNED (`did:web:csoai.org#board-attestation-1`).
- csoai.org = Cloudflare Pages `csoai-site` (DID apex). `os`/`app`.csoai.org CNAME there.
- Mailbox is **nicholas@csoai.org** on Namecheap Private Email (https://privateemail.com). GitHub sudo codes go there. **Do not use Gmail.**
- Full eat: `_alignment/ALIGNMENT_2026-08-31.md` (Mac). Cursor feed grammar: cite live totals.public_count (22·22·0 after #1077).

## Deployed truth (build — still true)
- Build from `client/` (Vite + React + wouter + Tailwind). Root `src/` is DEAD — ignore it.
- **Deploy pipeline (all four steps, in order):**
  `npm run build:client` → `bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350`
  → `node scripts/brand-gate.mjs dist/client` + `node scripts/signed-json-guard.mjs dist/client`
  → push to master (GHA `deploy.yml` ships it; it also runs on a 3h cron).
- **Never** `npx vite build` bare — it picks up the dead root `src/` and fails.
- **Prerender is lane-safe — never kill browsers or ports machine-wide.**

## Standing doctrine (binding — the gates enforce it)
- We **measure**; we never "certify". No conformity marks. The Academy issues completion records.
- **UNMEASURED is first-class** — never claim MEASURED before it is measured, and never invent a number.
- No public $ prices. Verification is free forever; a grade is never sold.
- Banned public strings are enforced by `scripts/brand-gate.mjs` (incl. internal codenames).
- Board card index **live is 335/335** (`n_cards == n_cells`). The 150-row floor is a **subset of that chain**. Do not clamp to 150 or 313. See `BOARD-RULING.md`.

## How we work (see council-os/PLAYBOOK.md for the evidence)
- **One lane = one writer = one branch/worktree.** Never a shared checkout. Claim in council-os/LANES.md.
- **A push rejection means pull-and-reconcile — never counter-revert.**
- Land work in **one gated merge**, not a stream of `fix:` commits.
- **Bytes adjudicate.**

## Guardrails
- GitHub: `gh` + MCP as `CSOAI-ORG` work for repo writes. No `user` scope (cannot PATCH bio/emails).
- Never break the static csoai.org DID/machine apex without explicit owner OK.
- client/ changes: branch → PR → GHA `deploy.yml` green + live councilof.ai → merge.
- NEVER `wrangler pages deploy` to project `councilof-ai` from a laptop — GHA owns prod.

## Division of work — CLAIM a lane before editing
- Cursor / Claude: councilof-ai content + GHA
- K3: csoai-site machine surface, pods, signing
- Grok / JEEVES: alignment, hosting, profile eat
- Nick: logins, spend, sudo, Namecheap, merges

_Last updated: Grok 2026-09-01 — board LIVE 22·22·0 after #1077; Cloudflare only. Never reopen 15/7 leftover PRs._
