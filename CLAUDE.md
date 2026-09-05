# CLAUDE.md — CSOAI / councilof-ai agent coordination

Shared working agreement for ALL agents on this repo. Read this first.

## Deployed truth (verified 2026-08-31 — supersedes 2026-08-26)
- THIS repo → **Cloudflare Pages `councilof-ai`** → **https://councilof.ai**.
  Vercel Git unlinked; leftover Vercel projects (`csoai-v2-app`, `councilof-ai-src`, …)
  **deleted 31 Aug 2026**. Do not `vercel deploy`. Do not wait for Vercel GitHub checks.
  Merge gate = GHA `deploy.yml` + `curl -I https://councilof.ai`.
- Live board: `GET https://councilof.ai/api/gspc` → **22 slots · 22 measured · 0 UNMEASURED**.
  Cards: **THREE corpora, zero overlap** — say which one you mean, every time.
  Full map + the correct sentence: `council-os/CARD-CORPORA.md`. In short:
  · `public/cards-bundle.json` → `card_count` = every `public/cards/*.json` wrapper on
    disk. **Do not quote a fixed number here.** It was 1072 in this file, 1115 an hour later
    and 1160 an hour after that — master adds wrappers continuously, so any integer typed
    into this file is stale before the next agent reads it. Read it from
    `public/cards-bundle.json` → `card_count`, which `capabilities/card-counts.test.mjs`
    asserts equals the directory. Its own generator note: "signs nothing, measures
    nothing." A build-time aggregate, not an attestation. Not in `/api/state`.
  · `public/root.json` → `card_count` = the `card_sha256` leaves under the SIGNED Merkle
    root (**152**, verified 2026-09-05 in ALL THREE of the deployed `root.json`, the
    committed `root.json` and `cards-bundle.json` → `root_card_count`, same
    `merkle_root cf9f5488…`, same `as_of`). The 152/153 split this line used to record was
    build-timing drift and has since closed; if the two disagree again that is timing, not
    disagreement. `/api/state` → `public_root.card_count`, kind `catalogued`. Its OTS proof
    covers `root.json` bytes only.
  · `public/signed/card_index.json` = the signed card index (**335**,
    `n_cards == n_cells == cards[].length`), of which **335 verify** —
    `/api/state` → `card_chain.bodies_verified_valid`, kind **`measured`**, 1 signing key.
    The only one of the three behind which a check was actually run.
  `/api/state` → `signed_cards.corpus_relation` records `SEPARATE_CORPORA` with
  `identifier_overlap: 0`. **Never add them, never reconcile them, never substitute one
  for another.** An earlier revision of this line said the standing "335" figure "matched
  neither" — true of the first two artifacts, and the reason it needed labelling, but 335
  is corpus 3 and is sound. All three numbers are right about their own bytes; the defect
  was three counts wearing one word.
  Stamp SIGNED (`did:web:csoai.org#board-attestation-1`).
- csoai.org = Cloudflare Pages `csoai-site` (DID apex). `os`/`app`.csoai.org CNAME there.
- Mailbox is **nicholas@csoai.org** on Namecheap Private Email (https://privateemail.com). GitHub sudo codes go there. **Do not use Gmail.**
- Full eat: `~/_alignment/ALIGNMENT_2026-08-31.md` (Mac home, **not in this repo** — the repo's own `_alignment/` holds only the x402 census). Cursor feed grammar: cite live totals.public_count (22·22·0 after #1077).

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
- The **signed card index** (`public/signed/card_index.json`) is **335/335** — `n_cards == n_cells == cards[].length`, and all 335 verify (`/api/state` → `card_chain.bodies_verified_valid`, kind `measured`). This is corpus 3 of three and is **not** the public-root leaf count; see `council-os/CARD-CORPORA.md` before quoting any card number. The 150-row floor is a **subset of that chain**. Do not clamp to 150 or 313. See `BOARD-RULING.md`.

## How we work (see council-os/LANE-PROTOCOL.md for the evidence — the four incidents these rules are for)
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
