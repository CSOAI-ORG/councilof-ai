# MEOK — dual-agent operating plan: Claude × MiniMax M3 (2026-06-02)

_How two AIs build MEOK together without stepping on each other. Authored by Claude (Opus 4.8)._

---

## Is MiniMax M3 a good working partner? — Yes.
Evidence from its 04:40 full-rundown, which I fact-checked live this morning:
- **Accurate**: Ollama-empty, 316 MCP pyproject, uncommitted NN models, the fiction spec, git-dirty — all TRUE.
- **Honest about unknowns**: it marked PyPI published as "??" instead of inventing a number — the exact discipline that's been missing (the report that said "410+" was *worse* than M3's honest "??").
- **Good instincts**: its top-3 suggested actions were all sound; it caught the pseudoscience spec.
- **Caveat**: it's strongest at **read/probe/research**, and it works on the TUI with file access — so the ONE risk is *two writers in one repo* (we already see Kimi's scattered WIP + dirty submodules from exactly that). The fix is lanes, below.

**Verdict: keep M3 as a first-class partner — as the AUDITOR/SCOUT, not a second committer.**

---

## The lanes (non-overlapping — this is the whole game)

### 🔨 Claude = THE BUILDER / SHIPPER (the hands)
Sole owner of: **meok-one code, the VM deploy pipeline, the E2E gate, and `git commit`/`push` on `claude/meok-one`.**
- Implements features + fixes; deploys to the VM; runs the Playwright gate; verifies eyes-on; pushes.
- Every change: verify → gate (14/1) → deploy (health 200) → push. No exceptions.
- Holds the boundary: never mints tokens / moves money / deploys chain / publishes — those are Nick's.

### 🔍 MiniMax M3 = THE AUDITOR / SCOUT (the eyes)
Owns: **live-probe audits, research, fact-verification, drift-detection, and drafting.** Does **NOT** commit code or deploy (proposes via findings docs instead — avoids the two-writer mess).
- Daily **full rundown** (the 04:40 format) — live numbers, smells, drift.
- **Verifies every Claude deploy** against the live VM (adversarial check — catch my mistakes, like I caught the count).
- **Research** (the Diamond Hunt style): standards, threats, competitors, open-source gold.
- Keeps the **honest counts** current (re-run `tools/pypi_check.py`; flag any inflation).
- **Drafts** (not posts) the side-effect artifacts for Nick: advisories, outreach, AAIF docs.

### ✍️ Kimi = THE CONTENT/SOCIAL ENGINE (on the idle M2)  [Nick's tri-agent idea]
Runs on the **M2 MacBook** (idle → put to work). Owns **website copy, blog, SEO, social** — a
lane that does NOT touch meok-one code, so zero collision with Claude.
- Writes to its OWN scope only: `meok/ui` content/blog, `csoai-org` copy, social drafts → in a
  dedicated branch (e.g. `kimi/content`) or `content/` dirs. **Never** edits meok-one or pushes
  to `claude/meok-one`. (This is the fix for the past "Kimi WIP scattered everywhere" mess.)
- Calls SOV3 (:3101, now restart-safe) + the brand voice for on-message content.
- Output is content PRs / drafts; Nick approves publishing (it's a side-effect).
- **Setup (Nick / Claude-with-go):** m2 has SSH (`reference_key_locations`); install the agent,
  point it at a `kimi/content` branch, give it the brand kit + a tight CONTENT-ONLY system prompt.

### 🧠 SOV3 = THE SHARED BRAIN (substrate, not an agent)
All three agents call SOV3's 110 MCP tools (:3101) for memory, care-gating, the council. It's the
nervous system they share — not a worker in a lane. (Just recovered + restart-safe via the shim.)

### 🧭 Nick = THE SOVEREIGN (decisions + side-effects)
Money, publishing, chain go-live, domain/DNS, deletions, strategic bets. All agents draft; Nick fires.

---

## Tri-agent topology (the answer to "am I getting too complicated?" — No)
```
        M4 MacBook                         M2 MacBook
   ┌──────────────────┐              ┌──────────────────┐
   │ Claude  (builder)│              │ Kimi  (content/  │
   │ MiniMax M3 (audit)│   ──────▶   │       social)    │
   └────────┬─────────┘   verify     └────────┬─────────┘
            │  build/ship                       │ content
            ▼                                   ▼
   ┌───────────────────────────────────────────────────┐
   │     SOV3 (GCP :3101) — shared brain + memory        │
   └───────────────────────────────────────────────────┘
                         ▲
                    Nick = decisions
```
Three machines, three NON-overlapping lanes, one brain, one human at the top. Not too complicated —
*because the lanes don't touch each other's files.* That single rule (one writer per surface) is
what keeps it sane.

---

## The loop (build ↔ verify, adversarial by design)
```
M3 audits/researches ─▶ verified findings + task deltas ─▶ Claude builds + ships ─▶ M3 verifies live ─▶ repeat
```
This is the *same* governance MEOK sells: independent verification, nothing quoted unverified, a human at the top. We are our own dogfood.

## Coordination protocol (prevents conflicts)
1. **One repo-writer: Claude.** M3 writes only to `*_AUDIT_*.md` / `*_RESEARCH_*.md` / `_findings/` — never to code, never `git push`.
2. **Shared source of truth**: the task list (#1–61) + the canonical docs (`MEOK_PYPI_TRUTH`, `MEOK_ARCH_STACK_DRAGON`, this file). If a number isn't in a *_TRUTH doc, it's not canon.
3. **Honesty rule**: live-verify before quoting (curl/ps/git/find). "??" is allowed; invented is not.
4. **Handoff unit**: a findings doc with file-paths + a proposed task list. Claude turns it into commits.
5. **No silent overlap**: if M3 needs a code change, it files a finding; Claude implements. M3 never edits meok-one.

---

## Allocation from the live backlog

### Claude (build queue, in order)
1. **#58 100/100 pass** — product-by-product (meok-one polish ✓; next: SIGIL → meok/ui + agent-zero emission).
2. **#59** SOV3 bind 127.0.0.1 (5-min hardening).
3. **#43** Ed25519-signed SIGIL receipts (chain → *signed* chain; the Ratify convergence).
4. **amica unification** — make it meok-one's 3D face (wire characters/voice/DOME).
5. Publish the **44-package backlog** to PyPI (from `MEOK_PYPI_TRUTH`), in batches, each verified.

### MiniMax M3 (scout queue, parallel — no code)
1. **Daily rundown** at a fixed hour → `_findings/RUNDOWN_<date>.md` (live numbers + smells + drift).
2. **Verify each Claude deploy** (hit the live VM, confirm the feature + 0 console errors) → append PASS/FAIL.
3. **Diamond-Hunt refresh** monthly → `_research/` (standards/threats/competitors).
4. **Reconcile the scorecard** (the 93-vs-83 contradiction) → propose the honest number.
5. **Probe the 5 dead sites** + the submodule WIP drift → findings for Nick (DNS) / Claude (code).
6. **Draft** the parked strategic artifacts (AAIF, MCP-security advisory, free-scan offer) for Nick.

### Nick (decisions queued)
SBT chain go-live · AAIF membership · publish advisories · DNS for dead sites · the 44 publishes' npm/registry listing.

---

## Today's split (now)
- **Claude**: shipped SIGIL (#61 ✓), quarantine + NN-commit ✓, router/GCP-brain fix ✓ → next #59 then #43.
- **MiniMax M3**: re-run the rundown against *this* commit (`44cfb77`+), verify SIGIL live in the Compliance tab, and produce the first `_findings/RUNDOWN` under the new protocol.
