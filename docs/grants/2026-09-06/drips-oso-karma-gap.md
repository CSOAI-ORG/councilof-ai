# Enablers: Drips · Open Source Observer · Karma GAP · Giveth — 06 Sep 2026

None of these pays by itself; each is a registration other rails read. Money type: none directly.

## Drips (https://www.drips.network)
- Our project page already exists on MAINNET, **unclaimed**: `/app/projects/github/CSOAI-ORG/councilof-ai`
  → `UnClaimedProjectData`, RepoDriver accountId `80907536076136564502780732476729843181200132672668347181333351497728`,
  `support: []`, `withdrawableBalances: []` (E14). Nobody has dripped to it; there is nothing to withdraw.
- Claiming = GitHub ownership verification (a `FUNDING.json` commit is the usual path) + a mainnet
  transaction from the receiving wallet (gas). Owner. Value: Drip Lists (EF, Octant, others) can only
  fund claimed projects; also the `FUNDING.json` is what Deep Funding / Drips tooling read for the
  dependency graph — but with 0 dependents (E9) the graph does not reach us yet.

## Open Source Observer (https://www.oso.xyz)
- `opensource-observer/oss-directory` code search for `csoai` and `councilof`: **0 and 0** — not indexed.
- Entry is a YAML under `data/projects/` by pull request; CI validates the schema; Claude-Code skills
  exist in their repo (`/ossd-add-project`). Draft: `oso-directory.draft.yaml` (unvalidated — run their
  `pnpm run validate` before any PR).
- **Ruling needed**: doctrine says never push to others' repos without an owner ruling. OSO metrics feed
  Retro Funding evaluators and Deep Funding; being absent means being invisible to both.

## Karma GAP (https://gap.karmahq.xyz)
- `gapapi.karmahq.xyz/search?q=council of ai` → `{"communities":[],"projects":[]}` (E13). No profile.
- Free; wallet sign-in; project + milestones stored as EAS attestations. GG24's tooling round required
  it; Octant and Celo rounds read it. Milestones to enter are the M1–M5 already in
  `docs/grants/2026-09-05/gitcoin.md`.

## Giveth (https://giveth.io)
- No CSOAI project (E15). Creating one is wallet sign-in; GIVbacks eligibility needs verification against
  "Action and Impact", "Reputation", "Public Good … not personal gain" (docs.giveth.io/projectverification).
  A Ltd is not excluded; the public-good test is on the project. QF rounds are announced ad hoc.

## What we will NOT do without the owner
Sign anything with the estate wallet, commit to another org's repository, or create accounts.
