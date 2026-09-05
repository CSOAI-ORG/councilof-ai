# CLAUDE.md — CSOAI / councilof-ai agent coordination

Shared working agreement for ALL agents on this repo. Read this first.

## Deployed truth (verified 2026-08-31 — supersedes 2026-08-26)
- THIS repo → **Cloudflare Pages `councilof-ai`** → **https://councilof.ai**.
  Vercel Git unlinked; leftover Vercel projects (`csoai-v2-app`, `councilof-ai-src`, …)
  **deleted 31 Aug 2026**. Do not `vercel deploy`. Do not wait for Vercel GitHub checks.
  Merge gate = GHA `deploy.yml` + `curl -I https://councilof.ai`.
- Live board: `GET https://councilof.ai/api/gspc` → **22 slots · 22 measured · 0 UNMEASURED**.
  Cards: **two numbers, and they measure different things** — quote the one you mean.
  `cards-bundle.json` emits both, and `scripts/generate-cards-bundle.mjs` says why:
  · `card_count` = every `public/cards/*.json` wrapper on disk (**1072**). The generator's
    own note: "Copies bytes that already exist under /cards/ and /proofs/; **signs nothing,
    measures nothing**." It is a build-time aggregate, not an attestation.
  · `root_card_count` = the `card_sha256` hashes committed to the SIGNED Merkle root
    (**152**, verified 2026-09-05 in BOTH the committed bundle and the deployed `root.json`,
    over `merkle_root` cf9f5488…). This is the attested set. The 152/153 split this line used
    to record was build-timing drift and has since closed; if the two disagree again that is
    timing, not disagreement.
  This line previously read "Cards 335/335", which matches neither and was handed to every
  agent that loaded this file. Naming both is not clamping the index — the index is
  untouched; only the description of what it counts is corrected.
  Stamp SIGNED (`did:web:csoai.org#board-attestation-1`).
- csoai.org = Cloudflare Pages `csoai-site` (DID apex). `os`/`app`.csoai.org CNAME there.
- Mailbox is **nicholas@csoai.org** on Namecheap Private Email (https://privateemail.com). GitHub sudo codes go there. **Do not use Gmail.**
- Full eat: `_alignment/ALIGNMENT_2026-09-05.md` (in THIS repo). The pointer here previously
  named `ALIGNMENT_2026-08-31.md` "(Mac)" — that file existed nowhere: not in this repo's
  `_alignment/`, not in `~/clawd/_alignment/`, not anywhere under `~/clawd`. Every agent that
  loaded this file was sent to eat a document that was not there. Keep this pointer resolvable.
- Cursor feed grammar: cite live totals.public_count (verified 22·22·0 on 2026-09-05).

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
  **This is `public/signed/card_index.json` and NOTHING ELSE.** It is not the 1072 or the 152
  in Deployed-truth above: three artifacts, three different objects. 335 = the mine chain
  (verified live == disk 2026-09-05); 1072 = every `public/cards/*.json` wrapper on disk;
  152 = the hashes inside the signed Merkle root. An audit lane read these as a contradiction
  on 2026-09-05 and came within one commit of clamping an index the owner ruled must never be
  clamped. Before you "reconcile" any card number, establish WHICH file it belongs to.

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

_Last updated: Claude (audit lane) 2026-09-05 — full eat at `_alignment/ALIGNMENT_2026-09-05.md`.
Re-verified live this date: board 22·22·0; card_index 335/335; root.json card_count 152 over
merkle_root cf9f5488…; cards-bundle 1072/152; csoai.org DID apex 200. Fixed here: the eat
pointer resolved to nothing, the 152/153 drift note had closed, and the 335 line carried no
statement of which file it counts. Cloudflare only. Never reopen 15/7 leftover PRs._
