# CSOAI new GitHub connections and backend status

**Checked:** 2026-09-21 UTC  
**Scope:** the new public GitHub identity, continuity repositories, site links, and the GitHub-dependent mill loop.

## Confirmed public identity

| Surface | Verified state | Boundary |
|---|---|---|
| [CouncilofAI-CSOAI profile](https://github.com/CouncilofAI-CSOAI) | Publicly reachable | Public navigation identity; not a source-of-truth deployment channel. |
| [Profile repository](https://github.com/CouncilofAI-CSOAI/CouncilofAI-CSOAI) | Public `main` at `a765281d435f606a13cfd31e83e204906230ab4c`; anonymous raw readback works | Links people to live CSOAI endpoints. |
| [Public evidence repository](https://github.com/CouncilofAI-CSOAI/csoai-public-evidence) | Public `main` at `00e513dc82ed8c2a7cb5b7300459a325391bc51c`; anonymous raw readback works | A continuity/evidence mirror, not the deployed Councilof.ai source. |
| [Councilof.ai GSPC API](https://councilof.ai/api/gspc) | Live public endpoint | Reports 23 axes, 22 measured; it remains canonical for current board state. |

Both new repositories use the correct boundary: **measurement, not certification**. Their public commit signatures are GitHub web-flow signatures; that does not establish CSOAI-controlled signing, external witnessing, or anchoring.

## GitHub hardening completed

- `protect-main-profile` is active on the profile repository.
- `protect-main-evidence` is active on the evidence repository.
- Each ruleset has two branch rules for `main`: deletion and force-push protection.
- GitHub Actions are now disabled in both new repositories. They have no workflows, runners, secrets, webhooks, environments, or packages, so this removes an unused execution path.
- No old GitHub credential was copied into the new account. The local GitHub CLI remains attached to the legacy account; it is **not** an authenticated new-account connection.

## Actual backend repair completed

The hourly mill wrapper previously stopped at an unauthenticated GitHub workflow call and wrote no receipt. It now runs as a local status recorder at:

`/Users/nicholas/clawd/councilof-ai/scripts/permissionless-fire-mill.sh`

It calls `record_mill_signing_status.py` and does not invoke GitHub, SSH, a signer, or a publisher. A live manual run created and read back this receipt:

`/Users/nicholas/clawd/_alignment/runtime/mill-signing-status/20260921T171604Z-2bf1608d299574e88bc016559e749b3361323393853c6ef38a1a0002f0dac479.json`

Its truthful state is:

| Field | Value |
|---|---|
| unsigned queue | 1,620 |
| signed queue | 2,377 |
| dispatch | `UNAVAILABLE_GITHUB_DISPATCH` |
| signing | `NOT_ISSUED` |
| publication | `LOCAL_ONLY` |
| receipt SHA-256 | `2bf1608d299574e88bc016559e749b3361323393853c6ef38a1a0002f0dac479` |

A version-controlled, isolated implementation and tests are committed locally at `7e2d5646a1061f671d95fbc0cb5bf2ff27f7ea39` on `codex/mill-local-receipt-20260921`. It has not been pushed or deployed.

## Site repair prepared, not published

The live site still contains generic links to the retired `CSOAI-ORG` GitHub profile. A focused patch is committed locally at `cbe0bc971758afa12640c704d34d572e32c5a564` on `codex/footer-public-source-mirror-20260921`.

It:

1. Replaces only the shared public profile/footer link with `https://github.com/CouncilofAI-CSOAI`.
2. Adds a separate link to `https://github.com/CouncilofAI-CSOAI/csoai-public-evidence`.
3. Labels those links as a public profile and evidence mirror, never as the exact source.
4. Updates Organization JSON-LD in both app entry points.
5. Preserves historical/pinned repository and MCP Registry IDs.

Targeted tests passed: 3 of 3. This patch is not served yet; no deployment was attempted because the available direct publisher can deploy dirty/non-master bytes while labelling them `master`.

## Additional prepared source repairs

- `a42a5d6a020e7e1afc7d1f5b33936fdf6076b3a5` on `codex/feed-mcp-public-pointer-20260921` makes `/api/feed.xml` self-identify as `/api/feed.xml` and changes MCP discovery from a broken pseudo-link to `{ "public_url": null, "state": "not_separately_published" }`. Static source-contract and whitespace checks pass; the full MCP runtime suite remains blocked by absent local dependencies and is not counted as green.
- `0c3d3b5de8af7ba2104ed37a8e1d7cc985182317` and `685127a0b40e3cb4f5ceb54b793d11b6d402ef9d` are two clean local-only commits prepared against the new public profile and evidence repositories. They add reciprocal links and state the continuity boundary accurately. They are not public until a new-account-authenticated push and anonymous raw-file readback complete.

## Capacity constraint

The local filesystem had **228 MiB free** when this record was updated. No dependencies were installed and no build/deploy was attempted from the new worktrees. Preserve the committed branches; choose a reviewed cleanup or offload plan before large builds, package installs, or another full checkout.

## Identity and privacy decisions still requiring the owner

- The new account is a GitHub **user account**, not a GitHub Organization. Do not call it an organization or transfer repositories until the owner decides the legal/account structure.
- Current public commit metadata contains a non-business personal author address. Email privacy protects future web commits; changing existing public history needs an explicit owner decision because it rewrites published commits.
- A separate new-account credential has not been created. The safe later shape is a short-lived fine-grained token restricted to these two repositories and only the exact content/metadata permissions needed for a reviewed publisher. Do not reuse the legacy account token.

## Outstanding gates

| Priority | Gate | Exact next safe action |
|---|---|---|
| P0 | The above site patch is local only. | Review and publish from a clean, known source checkout with build plus anonymous served-byte readback. |
| P0 | New-account business email and account recovery are not verified. | Add and verify `nicholas@csoai.org`, enable email privacy and 2FA, keep recovery material offline. These steps need the owner because GitHub will require verification/second factor. |
| P1 | The site feeds disagree on their self URL; `/api/feed.xml` is documented canonical but emits `/feed.xml`. | Review and publish the prepared patch, then run the normal runtime test and anonymous served readback. |
| P1 | The MCP endpoint advertises an uninspectable registry path. | Review and publish the prepared explicit unpublished state, or later publish a deliberately redacted versioned projection. |
| P1 | The new public repos are not an automated mirror. | Keep them manual until a least-privilege, new-account-only credential and a signed, version-pinned, anonymous-readback publisher are reviewed. |
| P1 | The historical site has many dead old-repository links. | Triage links by type. Generic identity links can migrate; historical source, registry IDs, correction links and pinned artifact links need durable replacements before alteration. |

## Explicitly not done

- No source deployment, GitHub push, workflow dispatch, token creation, OAuth authorization, signing, anchoring, wallet action, or external message.
- No claim that the local queue receipt is signed, public, witnessed, Bitcoin anchored, or customer-used.
