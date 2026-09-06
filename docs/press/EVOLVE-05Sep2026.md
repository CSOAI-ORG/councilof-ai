# EVOLVE — rules this lane earned, with the failure that taught each one

A rule earns its place by naming the mistake that produced it and the command that would have
caught it. Nothing here is a principle someone liked the sound of.

---

## E-T6-01 — A gate must run where the thing it checks exists

**Taught by:** `structured-data-gate` was wired into `pr-gates.yml`, which does not prerender.
It therefore checked markup that is only produced by the prerender step, on a tree that never
ran it. Moved to `deploy.yml`. **Then the same defect was repeated with `link-gate`** — the rule
was written and violated inside the same lane.

**Broken a third time, 2026-09-06.** Shrinking the dead-link baseline needed a built tree and
the machine was out of disk, so I stood one up by hand: `public/` plus a fabricated `index.html`
and `library/index.html`, then the alias placer. It resolved three targets the real `dist/client`
does not, I removed them, and CI rejected all three:

```
✖ link-gate: 3 NEW same-origin URL(s) …
    https://councilof.ai/cards/{sha16}.json
    https://councilof.ai/verify?card=ox-alpha
    https://councilof.ai/library/company/
```

A proxy that is MORE permissive than the thing it stands in for does not fail safe — it produces
confident removals. Baseline went 27 (claimed) → 30 (measured).

**The rule:** before adding a step, name the artefact it reads and the step that creates it. If
that step is not in the same job, the gate is decoration. And when you cannot run a gate against
the real tree, say the number is unverified — do not verify it against a tree you invented.

**Corollary, same day:** the same PR called `/cards/{sha16}.json` uncited on a `grep` of `public/`
alone. It is cited, by `functions/mcp/gspc-tools.json`. Name the corpus a claim was measured over,
because "nothing cites this" is a claim about a corpus, not about the world.

---

## E-T6-02 — A test file is not a test until the runner's path list names it

**Taught by:** `pr-gates.yml` ran `npx vitest run client/src functions`. Eight test files under
`scripts/` — **1007 assertions**, including the provable-archive vocabulary gate over
`docs/PROVABLE-ARCHIVE-METHOD.md` and the drafts, the EAS attestation fallback, the payer-key
shadow test and the card evidence-trust test — had **never run in CI**. They all pass. They were
simply never invoked.

**Proof:**

```
grep -n 'vitest run' .github/workflows/pr-gates.yml     # client/src functions
npx vitest run scripts                                   # 9 files, 1007 tests, all passing
```

**The rule:** a gate's path filter is part of the gate. When you add a test directory, add it to
the runner in the same commit, and check the CI log for the file name — not for a green tick.

---

## E-T6-03 — Two workflows that post the same required check name will race

**Taught by:** `pr-gates.yml` (the real suite) and `pr-gates-skip.yml` (an unconditional `echo`)
both publish a check named `gates`. `paths-ignore` skips a workflow only when EVERY changed file
matches it, so a PR touching both a gated path and a docs path runs **both**. Measured on #1635,
which changed `scripts/`, `public/` and `docs/`:

```
pr-gates-skip  run 34022928201  08:49:27 -> 08:49:28   2s, unconditional pass
pr-gates       run 34022928307  08:49:24 -> 08:51:09   the real suite
```

For **1 minute 41 seconds** the required `gates` context was green on the strength of an `echo`
while the suite that checks anything was still running. Auto-merge reads that context.

The file's own header said "keep the paths-ignore list byte-identical to pr-gates.yml's paths
list" — the two lists were identical, and identical lists do not make the workflows exclusive.

**And keeping them identical is itself a standing hazard.** While this was being written, master
gained a note on the same file recording the other half: when the two lists *drift*, a PR touching
a path that is gated but not ignored fires both workflows, and the two-second pass can be the one
a reader sees while the real suite is red. Two lists that must be edited together, in two files,
forever, is a maintenance obligation with no mechanism behind it. One workflow removes the
obligation instead of documenting it.

**And the obvious repair is worse.** The first attempt made the cheap workflow FAIL when it ran
out of scope, on the theory that a red a later green corrects is recoverable. It is not: both
results then sit in the PR's rollup and GitHub blocks on the failure. Measured on #1648, which
changed `.github/workflows/pr-gates.yml` and `docs/`:

```
gates  FAILURE  09:04:51   the guard, firing correctly
gates  SUCCESS  09:06:32   the real suite, all 17 steps green
mergeStateStatus: BLOCKED
```

Two check runs sharing a required context name have **no safe behaviour** — one order gives a
premature green, the other a permanent red.

**The rule:** express a gate's exclusion **inside one workflow** that always runs and decides its
own scope in its first step. Never across two path filters assumed to partition, and never by
two workflows publishing one required context. `pr-gates-skip.yml` is deleted; `pr-gates.yml`
lost its `paths:` filter and gained a scope step that every later step reads.

---

## E-T6-04 — A selftest driven by live state can pass under the very bug it exists to catch

**Taught by:** `producers-check.mjs` parsed `git status --porcelain` with `.trim()`, which eats
the leading space of the FIRST line only, so `.slice(3)` returned `ublic/interop/…` for exactly
one file per run. The first selftest written for it tampered with a real file and read a real
`git status` — and **passed with the bug restored**, because in that worktree the tampered file
was not first. Rewritten over a literal fixture, it fails immediately:

```
✖ selftest: parsePorcelain lost "public/interop/agent-card-jws-input.json"
  — got: ublic/interop/agent-card-jws-input.json, public/llms.txt, …
```

**The rule:** mutation-test every selftest — restore the bug and watch it go red. If it stays
green, the assertion is decoration. Assert parsers over fixtures; keep live state for the
end-to-end half, and never let the live half be the only half.

---

## E-T6-05 — A display gate must cover every format that renders text to a human

**Taught by:** `brand-gate.mjs` walked `\.(html|txt)$`. An SVG's `<title>` **is** its accessible
name and its `<text>` **is** rendered copy; 29 SVGs ship. A banned display string inside one
would have reached production unchallenged.

```
# planted 'CSOAI certifies this model' in an SVG <text>
before   ✓ brand-gate: no forbidden display strings   exit 0
after    ✖ [certify_claim] "CSOAI certif"             exit 1
```

Precedent within the same gate: the DISPLAY rules previously never reached JSON bodies either,
and a live internal codename was found the day that was fixed. Twice is a pattern.

**The rule:** enumerate the formats a stranger can READ, not the formats we think of as pages.
When the answer changes, scan the existing corpus **before** landing the widened walk — 21 of the
29 SVGs turned out to sit behind an unrelated `badges` exclusion, which is now logged (B-22)
rather than quietly widened away.

---

## Rules this file obeys

- A rule with no failure attached is deleted.
- Every proof line is a command that can be re-run, not a recollection.
- A rule this lane broke after writing it says so, in the rule.
