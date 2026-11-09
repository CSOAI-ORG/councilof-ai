# Public-surface standards — what every public surface of CSOAI must hold (2026-11-03)

One source of truth; every public surface is a mirror, a distribution point, or an
evidence store of the monorepo (`CSOAI-ORG/councilof-ai`). These standards exist because
the 2026-11-03 cross-surface audit found each one violated somewhere real: a stale axis
count in a repo description, a banned codename baked into two published package names, a
business site public while its siblings are private, experiment models with single-digit
lifetime downloads sitting next to the evidence estate. The rules are short on purpose —
each one is checkable, and most are already machine-checked somewhere; where a check
exists it is named.

## 1. Names and words

- **S1 — Banned codenames never appear in any new public name or string.** The banned set
  (enforced on the site by `machine-contract-guard.mjs` and on pages by `brand-gate.mjs`)
  covers the retired project names. Audited addition: **`defoneos` is published as a PyPI
  package name twice (`csoai-defoneos-mcp`, `csoai-defoneos-isr-mcp`) — the names predate
  the ban; yank + supersede with a renamed package; never create a new public name from
  the set.** Check: registry-name lint at publish time (package.json / pyproject names run
  through the same list before `npm publish` / `twine upload`).
- **S2 — One brand per surface.** A surface says who runs it: "CSOAI — Council of AI",
  links `councilof.ai`, and (where a product line is named) names that product line
  consistently. It does not mix three brand names in one README, and it never implies a
  certification: "measurement, never certification" is the standing line.
- **S3 — No stale counts in evergreen fields.** A repo/package/space description that
  quotes a live number (axis counts, tool counts, measured counts) must either carry the
  number from the live board **at update time** or quote no number at all. Counts rot
  (the board went 33→34 while a repo description said "33 · 23"); evergreen wording
  ("live board totals at councilof.ai/api/gspc") cannot rot. Fixed 2026-11-03:
  `gspc-board` now carries the live count; same rule for all fleet descriptions at their
  next touch.

## 2. Visibility

- **S4 — Signed evidence is always public.** Measurement cards, receipts, root proofs, the
  GSPC datasets/spaces: public forever; verification is free and stays free. Never
  privatize anything a verifier needs.
- **S5 — Business and personal sites are private.** The org's public face is CSOAI. Client
  and family business repos are private (most already are); the audit found exactly one
  public outlier (`aksteelservices`, no description, sibling sites private) — bring it in
  line.
- **S6 — Superseded sources go private or archived, never silently stale-public.** When a
  newer canonical source exists (the monorepo), an old full-site source is either archived
  with a README line pointing at the canonical one, or private. Candidates from the audit:
  `csoai-org-v2` (says so in its own README), the 2026-09-05 "awesome-*" mirror forks
  (keep only the ones backing live listing PRs).
- **S7 — A mirror that has stopped mirroring is not a mirror.** Distribution surfaces
  (the MCP tool fleet) are legitimate public infrastructure while they are listed in
  registries and/or used; each must then hold to S2/S3 and have a README that states what
  it is. A fleet repo with zero stars, zero forks, no registry listing, and no commits
  since its creation is not distribution — it is clutter, and goes private.

## 3. Content minimums (README/card contract)

Every public repo, model, dataset, space, and package carries, in its README/card:
- **S8** what it IS in one sentence (subject, format, provenance);
- **S9** its provenance link: which monorepo path or live surface produces it
  (`councilof.ai` / `CSOAI-ORG/councilof-ai`);
- **S10** its state: live, mirror, archive, or superseded-by-<thing>;
- **S11** for anything measurement-adjacent: the line that it is **measurement, not
  certification**, and that verification is free at `councilof.ai/gspc-verify/`.
Model cards additionally state training provenance plainly (what was trained, on what,
by whom) — no "unified" claims without the base-model list.

## 4. Packaging

- **S12 — Package metadata is maintained like code.** `description`, `repository`,
  `license`, and README ship with every release; a package whose metadata disagrees with
  the monorepo is a bug. Check: publish workflows lint the metadata block before upload.
- **S13 — Renames yank, never abandon.** A package carrying a name that violates S1 is
  yanked (with a deprecation note naming the successor) and republished under a clean
  name; the old name is never silently left current.
- **S14 — Freshness honesty.** A package that no longer tracks the monorepo says so in its
  README ("superseded by X / archived 2026-11") rather than looking maintained while
  rotting.

## 5. Enforcement (what actually runs)

| Rule | Check today | Gap to close |
|---|---|---|
| S1 | `machine-contract-guard` + `brand-gate` (site) | publish-time name lint (npm/PyPI workflows) |
| S2/S8–S11 | manual; `persona-gauntlet` samples the site | org-wide README linter (queued as a follow-up workflow) |
| S3 | none (found by audit) | description lint in the org README re-derivation job |
| S4–S7 | manual | quarterly visibility audit (this document + the 2026-11-03 reports are the baseline) |
| S12–S14 | publish workflows exist | metadata lint step |

## 6. Baseline

The 2026-11-03 audit reports (GitHub fleet, Hugging Face, npm/PyPI, live site + Kaggle)
are the baseline this document is measured against; their findings land as PRs referencing
this file. Changes to this file go through a PR like everything else.
