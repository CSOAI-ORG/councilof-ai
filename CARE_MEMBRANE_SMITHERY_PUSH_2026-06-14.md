# care-membrane-mcp → Smithery push report — 2026-06-14

## TL;DR (5 lines)
- `SMITHERY_API_KEY` secret: **PRESENT** (verified via `gh api repos/CSOAI-ORG/care-membrane-mcp/actions/secrets`; created 2026-04-15).
- Release **v1.0.11 CREATED** at <https://github.com/CSOAI-ORG/care-membrane-mcp/releases/tag/v1.0.11>.
- Workflow run **27505241063** (event=`release`): Smithery publish step **succeeded** — deployment `7611e9e3-615e-4298-9fcb-afec8d76cd80` accepted by Smithery.
- Overall workflow conclusion: **failure** — but the only failing step is a *post-publish* `Attest build provenance` step. The Smithery publish itself is live.
- Recommend opening a follow-up issue to fix the `subject-digest` bug in `.github/workflows/mcp-smithery-publish.yml` (line 39).

## Pre-flight checks

| Check | Result |
|---|---|
| `git remote -v` | `git@github.com:CSOAI-ORG/care-membrane-mcp.git` ✅ |
| Branch sync with `origin/main` | 0 ahead, 0 behind ✅ |
| Local uncommitted edits | Yes (3 files: README.md, pyproject.toml, server.json) — committed + pushed as `chore: bump version to 1.0.11` (commit `e0a5c64`) before tagging ✅ |
| Tag `v1.0.11` on origin before release | ❌ No — only `v1.0.0` existed; created annotated tag `v1.0.11` -> `e0a5c64` and pushed ✅ |
| `SMITHERY_API_KEY` repo secret | ✅ Present (created 2026-04-15T04:12:20Z) |
| `gh` auth | ✅ `CSOAI-ORG` (keyring), scopes include `repo` + `workflow` |
| PyPI v1.0.11 live | ✅ confirmed via `pip index versions care-membrane-mcp` |

## Release

- Tag: `v1.0.11` (annotated, signed with existing local user `nicholas@meok.ai`).
- Release title: `care-membrane-mcp v1.0.11`.
- Notes file: `~/clawd/care-membrane-smithery-release-notes.md` (synthesized from CHANGELOG.md head + the diff between v1.0.7 and v1.0.11, since CHANGELOG.md only documented up to v1.0.7).
- Release URL: <https://github.com/CSOAI-ORG/care-membrane-mcp/releases/tag/v1.0.11>

## Workflow run 27505241063

- URL: <https://github.com/CSOAI-ORG/care-membrane-mcp/actions/runs/27505241063>
- Event: `release` (tag v1.0.11, branch v1.0.11)
- Triggered: 2026-06-14T16:35:37Z
- Completed: 2026-06-14T16:35:54Z (17s)
- **Status: failure** (but the Smithery-relevant step is green)

### Step results

| Step | Result |
|---|---|
| Set up job | ✓ |
| Checkout repository | ✓ |
| Setup Node.js | ✓ |
| **Publish to Smithery** | ✓ — `Release 7611e9e3-615e-4298-9fcb-afec8d76cd80 accepted` |
| **Attest build provenance** | ✗ — `Error: subject-digest must be in the format "sha256:<hex-digest>"` |
| Post Checkout repository | ✓ |
| Complete job | ✓ |

### Smithery API response (from step log)
```json
{"deploymentId":"7611e9e3-615e-4298-9fcb-afec8d76cd80",
 "qualifiedName":"nicholastempleman/care-membrane-mcp",
 "status":"PENDING",
 "logFile":"/tmp/smithery-deploy-7611e9e3-615e-4298-9fcb-afec8d76cd80.log",
 "statusUrl":"https://smithery.ai/servers/nicholastempleman/care-membrane-mcp/releases"}
```

## Why the run is red ❌

Pre-existing bug in `.github/workflows/mcp-smithery-publish.yml` line 39:

```yaml
- name: Attest build provenance
  uses: actions/attest-build-provenance@v2
  with:
    subject-name: ${{ github.repository }}
    subject-digest: sha256:${{ github.sha }}     # <-- bug
    push-to-registry: false
```

`actions/attest-build-provenance@v2` requires `subject-digest` to be a real `sha256:<64-hex>` of a blob or artifact. The workflow is prepending `sha256:` to a 40-character git commit SHA (`e0a5c648a5105a12683a796b9d7b3d59623cda8e`), which is neither a valid hex length for a sha256 nor the digest of anything. The action rejects it.

Evidence this is a recurring issue, not new: the v1.0.0 release also failed the same step (run 25478022797, 2026-05-07, conclusion=failure, 39m47s). The Smithery publish step itself was presumably the long part of that earlier 39-minute run; the current run completed the publish in ~8 seconds.

## Follow-ups (not blocking the ship)

1. **Fix the workflow attest step.** Either drop the `attest-build-provenance` step entirely (it's not required for Smithery publication), or have it attest a real artifact. Easiest fix: remove lines 35–40 of `.github/workflows/mcp-smithery-publish.yml` — Smithery is published before that step runs and the publish is already accepted.
2. **Bump CHANGELOG.md.** It still ends at v1.0.7. A v1.0.11 entry would be useful for future releases. (Not blocking — release notes were synthesized from git history.)
3. **Node 20 deprecation warning** — several actions are pinned to Node 20 builds; force `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` or bump action versions before 2026-06-16.

## Files written by this task

- `~/clawd/CARE_MEMBRANE_SMITHERY_PUSH_2026-06-14.md` (this report)
- `~/clawd/care-membrane-smithery-push-result.json` (machine-readable summary)
- `~/clawd/care-membrane-smithery-release-notes.md` (release notes input to `gh release create`)

## Artifacts

- Release: <https://github.com/CSOAI-ORG/care-membrane-mcp/releases/tag/v1.0.11>
- Workflow run: <https://github.com/CSOAI-ORG/care-membrane-mcp/actions/runs/27505241063>
- Smithery server: <https://smithery.ai/servers/nicholastempleman/care-membrane-mcp/releases>
- PyPI: <https://pypi.org/project/care-membrane-mcp/1.0.11/>
