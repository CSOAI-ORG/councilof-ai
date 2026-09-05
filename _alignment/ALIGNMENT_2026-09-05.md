# ALIGNMENT — 2026-09-05 (full eat)

Supersedes the pointer in `CLAUDE.md` to `_alignment/ALIGNMENT_2026-08-31.md`.
**That file never existed.** It is not in this repo's `_alignment/`, not in
`~/clawd/_alignment/` (which holds logs and one benchmark note), and not anywhere
under `~/clawd`. Canon told every agent that loaded `CLAUDE.md` to go and eat a
file that was not there, which is the same defect class as a card index pointing
at a card that was never signed. This document is the thing that pointer meant.

Method: every number below was read from a live URL or from bytes on disk during
this session. Nothing is carried over from a previous note. Where a claim could
not be verified, it says so rather than repeating the claim.

---

## 1. The card counts verify. Do not "simplify" them.

Three artifacts count three different things, and reading any one of them as
"the number of cards" is how this gets broken. All three were checked today:

| Artifact | Field | Value | What it counts |
|---|---|---|---|
| `public/signed/card_index.json` | `n_cards` == `n_cells` == `cards[].length` | **335** | The mine chain. OWNER RULING 2026-08-28 (`BOARD-RULING.md`). Live == disk. |
| `public/cards-bundle.json` | `card_count` | **1072** | Every `public/cards/*.json` wrapper on disk. Its own generator note: "signs nothing, measures nothing". |
| `public/root.json` | `card_count` | **152** | The `card_sha256` hashes inside the SIGNED Merkle root. |

Verified live: `/signed/card_index.json` returns 335/335/335; `/root.json`
returns `card_count` 152 with `merkle_root` `cf9f5488…`; `/cards-bundle.json`
returns 1072 / 152. `signed-json-guard` passes: 16 signed JSON files valid, every
indexed card bound to signature bytes.

**A correction to this document's own first draft.** The audit that produced this
note initially read `CLAUDE.md` as self-contradictory — the Deployed-truth section
naming 1072/152 while Standing-doctrine says "Board card index live is 335/335".
It is not a contradiction. They are different artifacts. Acting on that misreading
would have clamped an index the owner explicitly ruled must never be clamped
("No agent may clamp the index to 150, 313, or any other constant"). Verify which
object a number belongs to before touching it.

**One stale line found.** Deployed-truth says root_card_count is "**152** in the
committed bundle, **153** in the deployed `root.json` — the two drift by build
timing". Both are **152** as of today. The drift closed; the note describing it
had not.

## 2. The board verifies.

`GET https://councilof.ai/api/gspc` → `axes: 22`, `measured_axes: 22`,
`unmeasured_axes: 0`, `public_count: "22 axis · 22 measured"`. The Cursor feed
grammar in `CLAUDE.md` ("cite live totals.public_count") is correct and current.

## 3. Hosting verifies.

`csoai.org/.well-known/did.json` 200 (DID apex intact). `os.csoai.org` and
`app.csoai.org` 308 (CNAME'd as documented). `councilof.ai` served from
Cloudflare Pages `councilof-ai` via GHA `deploy.yml`. No Vercel involvement found.

## 4. What was actually broken, and is now fixed

**The pre-push gate was silently dead for ~3.5 hours.** `core.hooksPath` was set
to `.githooks` at 03:10 today so lanes could share `pre-commit`/`post-*`.
`core.hooksPath` REPLACES `.git/hooks` rather than adding to it, so the content
gate installed the documented way — `ln -sf ../../scripts/pre-push-gates.sh
.git/hooks/pre-push`, symlink still present — stopped running with no warning.

Measured, not guessed. In the 2h35m after 03:54Z the deploy workflow ran 60 times:
**2 success, 27 failure, 29 cancelled.** Five of the last eight failures were
brand-gate — the exact gate that hook runs in one second. Production stood ~18h
stale on content faults that never needed a build to find.

The cancellations were NOT a second problem, and an earlier draft of this analysis
wrongly said they were. Cancelled runs have a **median lifetime of 0.5 min** —
they never started, and the run superseding each one builds from a newer commit
carrying its changes. Failures had a median of 2.6 min, dying fast at content
gates. The failures were the whole story.

Fixed by `.githooks/pre-push` delegating to `scripts/pre-push-gates.sh`, plus
`price-gate --json-only` added to that runner. **Result since: 3 successes, 0
failures.**

## 5. Overclaims found on public surfaces and corrected

Each of these shipped MEASURED-shaped copy over a rail that is `planned` in
`client/src/data/facts.json`:

- **9 game/civic pages** read "Anchored to OTS + Sigstore Rekor + EAS on Base."
  `facts.json` holds **3** live anchors (HuggingFace Hub, Sigstore Rekor, public
  corrections ledger) and names OTS in its `excluded` field — *stamped, not
  anchored*. EAS is a `planned` rail whose code refuses to mint. Rekor was the
  only true one of the three.
- **`csoai-eas-anchored`** HF badge shipped `status: "active"` with
  `qualifying_models: 104` on that non-issuing rail.
- **`csoai-bft-23`** HF badge shipped "CSOAI 23/33 BFT attested" / "Attested by
  23 of 33 sovereign council agents" — the claim RETRACTED 2026-07-29
  (n_eff≈1.21/3) — on a public marketplace surface, plus a de-branded word.
- **`/api/eu-ai-act/art50`** was advertised on two public interop manifests and
  404s. It has never existed. One was a Custom GPT **action** with `method: POST`,
  so every invocation failed; the other led `endpoints_to_test` for the
  "Regulator (EU AI Office)" persona whose stated outcome is "verify EU AI Act
  Art 50 compliance in 1 minute". The live door is `/api/article50` (200).

## 6. A gate gap, measured but deliberately NOT closed

`brand-gate`'s page walk scans `.html`/`.txt` only. Its JSON sweep checks
`PATH_BANNED` (internal codenames on served paths), **not** the `RULES` list that
carries the retracted-claim and de-branding patterns. So a retracted claim ships
in machine-readable form and the gate reports clean.

Raw pattern counts over `public/**.json`: 38 hits in 13 files. **The naive fix is
wrong.** 22 of those sit in one field of `interop/axes-v2-web3.json`:

> `"claim_boundary": "Design proposal only. No deployment, signature, chain
> inclusion, BFT independence, universal coverage, legal compliance, or
> certification is established by this record."`

That is the claim being **denied**. Widening the gate without teaching it that
shape would force someone to delete 22 protective disclaimers to go green — the
failure this repo already recorded when "Recommended" was flagged as social proof
on a page where it described a framework's stance. The same applies to
"sovereign": of 9 hits, several are third-party HuggingFace model ids
(`trendmicro-ailab/sovereign-v1`), a real deploy hostname, a keystore path, and
"Sovereign wealth fund (Norwegian Oil Fund)" — a kind of institution.

After discounting, **11 real assertions**, all corrected. Closing the gap properly
needs carve-outs for disclaimer shapes, third-party model ids, hostnames and
filesystem paths. That is a change to a blocking gate and deserves its own review.

## 7. Retired ≠ broken

`/api/synthesis`, `/api/growth-loops`, `/api/prod-readiness` return **503 with
`code: RETIRED`** and the reason *"Synthesis mappings are not published without
verified source records."* That is doctrine holding. An earlier audit in this
session called them a regression; that was wrong. `/api/bank-complete` and
`/api/eu-ai-act` have no route in `functions/api` and never did — 404 is correct.

## 8. Distribution: measured, and the headline number is not adoption

- **330** latest-version CSOAI servers in the official MCP registry (1272 version
  entries). 329 PyPI, 1 npm. **678** repos in the `CSOAI-ORG` org.
- **39** of those registry entries advertise a remote at `https://api.meok.ai/…`.
  **`api.meok.ai` has no DNS record** (the `meok.ai` apex resolves via Cloudflare;
  the `api` subdomain does not). All 39 carry a PyPI stdio fallback, so they are
  degraded rather than dead — but the advertised remote door is broken.
- `io.github.CSOAI-ORG/gspc` **v1.2.0** correctly points at `https://councilof.ai/mcp`
  (200). The dead `workers.dev` worker survives only on superseded v1.0.0.
- **PyPI download totals are mirror traffic, not adoption.** 72 sampled packages
  summed to 35,476/month, but `crane-hire-cpcs-mcp` and `eu-ai-act-compliance-mcp`
  have the *same daily curve* (13,13,15,12,20,13,13,8,23,9 vs
  11,16,19,13,35,20,13,6,33,8) — same spikes, same troughs. Unrelated demand does
  not move in lockstep. PyPI's own split for the top package: 23,147 with_mirrors
  vs 7,818 without.
- npm `csoai-gspc-mcp`: **138 downloads total, all on its two publish days, 0 for
  the seven days since.** GitHub `councilof-ai`: 0 stars, 0 forks, 38 views/14d,
  referrers github.com (7) and Google (2).

**Do not report PyPI totals as adoption.** The one honest funnel to instrument is
`/mcp` tool calls.

## 9. Unverified claims carried in workspace canon

`~/clawd/CLAUDE.md` opens with "8 protocols · 100/100 A+++++ · bleeding edge ·
world-leading … the world's only OSS Layer-0 … 531 MCPs, 479 ship-ready". Against
live sources: 330 servers are published to the official MCP registry and 678 repos
exist in the org. **No definition was found under which 531/479 can be checked**,
and "100/100 A+++++", "world's only" and "world-leading" are not measurable at all.
That file is loaded into every agent's context, which is exactly the mechanism
`CLAUDE.md` itself records for how "Cards 335/335" reached every agent. Flagged for
the owner; not edited from this lane.

## 10. Revenue: the one lever that moved

**Cloudflare Monetization Gateway** (announced 2026-07-01) charges for web pages,
datasets, APIs **and MCP tools** behind Cloudflare via x402, USDC, settling
peer-to-peer to the seller's own wallet, managed by dashboard/API/Terraform. This
estate is already entirely on Cloudflare Pages with a live MCP server behind it.
It is **waitlist-only**. Waitlist submitted 2026-09-05 as `nicholas@csoai.org`.

Market context, so nobody prices off the headline: x402 reached ~165M transactions
and ~$50M cumulative across ~69k agents by April 2026, but **settlement volume is
down 93% in 2026**, real-commerce volume is **~$28K/day** and roughly half of
activity is gamified. Solana carries ~65% of agent-to-agent volume; this estate
settles on Base.

## 11. Open

1. `brand-gate` JSON widening (§6) — needs carve-out design first.
2. 39 registry entries advertising the unresolvable `api.meok.ai` (§8) — needs a
   re-publish to repoint or drop the remote.
3. `qualifying_models: 104` is identical on every badge in
   `interop/hf-badges-index.json` — per the generating commit that is the count of
   models **probed**, not the count meeting each criterion. The EAS one was set to
   0 because that rail provably cannot mint; the others were left alone because no
   evidence either way was found. HF lane's call.
4. Dependabot: 29 open (1 critical, 8 high). The critical is `vitest`'s UI server,
   dev-only. The four runtime-tagged packages (`drizzle-orm`, `xlsx`, `image-size`,
   `nodemailer`) are declared nowhere in `package.json` — transitive only — and are
   imported nowhere in `functions/` or `client/src`, so they do not reach the edge
   artifact.

---

_Eat by Claude (audit lane), 2026-09-05. Every figure above was read from a live
URL or from bytes on disk during the session that produced it. Where a number
could not be verified, this document says so instead of repeating it._
