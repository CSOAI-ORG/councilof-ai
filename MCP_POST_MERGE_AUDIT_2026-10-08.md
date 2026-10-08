# MCP Post-Merge Audit — 8 Oct 2026

**Scope:** Code-verified audit of merged wave-1 migration PRs against the actual merged default-branch files.
**Method:** For each merged PR, fetch the default-branch tree at the merge commit via `raw.githubusercontent.com`, reconstruct locally, run `PYTHONPATH= /opt/homebrew/bin/python3.11 mcp_wire_audit.py audit --local <dir>`.
**Rule:** Only the code-verified post-merge row is the adopted protocol support claim. Pre-merge notes are not.

## Results

| repo | PR | merge commit SHA | audit era | audit migration class | timestamp |
|---|---|---|---|---|---|
| csoai-mcp-dist | #1 | c8d8af42203b05a441f4e6a647e83e6e0e0b8d35 | pre-2025-06 | full | 2026-10-08T06:25:38Z |
| mcp-spec-compliance-mcp | #1 | 429976b71d7677bee5f013fd0c73eeabba8b1acb | 2026-07 | handshake-removal | 2026-10-08T06:25:38Z |
| blizzard-wow-mcp | #1 | 9732930fbb6b6cff20fdaa4a67af6dde8514c885 | unknown | header-add | 2026-10-08T06:25:38Z |
| mmoagent-mcp | #1 | 4ea1d08509fcab2f5ac56163e81931b9bac91ef3 | unknown | header-add | 2026-10-08T06:25:38Z |
| gdpr-compliance-ai-mcp | #22 | 55c55f15645980faaaddf4211241ef6902abb4fc | 2026-07 | handshake-removal | 2026-10-08T06:25:38Z |
| acord-bridge-mcp | #7 | b0510c5af1619774361896f6f4dd42923d4cf669 | 2026-07 | handshake-removal | 2026-10-08T06:25:38Z |
| as400-bridge-mcp | #7 | 5068a960a20a45f3ffd43ee01d5304edcfe48002 | 2026-07 | handshake-removal | 2026-10-08T06:25:38Z |

## Analysis

**Code-verified `2026-07` / `handshake-removal` (5 repos):** mcp-spec-compliance-mcp, gdpr-compliance-ai-mcp, acord-bridge-mcp, as400-bridge-mcp — these are the repos where the `mcp>=2.0.0` pin + vendored shim produced code-level evidence of 2026-07-28 headers and Mcp-Method/Mcp-Name signals on the merged default branch.

**`unknown` / `header-add` (2 repos):** blizzard-wow-mcp, mmoagent-mcp — JS repos with no `@modelcontextprotocol/sdk` release speaking 2026-07-28. The shim is vendored but no SDK pin was invented. Honest: these cannot claim 2026-07 until the JS SDK ships a matching release.

**`pre-2025-06` / `full` (1 repo):** csoai-mcp-dist — census class `full` with raw `initialize` answering `2024-11-05`. The PR added shim + note but the handshake-removal half is separate work.

## Signals (per repo)

- csoai-mcp-dist: `initialize-handshake`, `protocol-2024-11-05`
- mcp-spec-compliance-mcp: `mcp-method-header`, `mcp-name-header`, `protocol-2025-06-18`, `protocol-2026-07-28`, `sdk-fastmcp`, `sdk-mcp-import`, `session-id`
- blizzard-wow-mcp: `sdk-mcp-import`
- mmoagent-mcp: `sdk-mcp-import`
- gdpr-compliance-ai-mcp: `mcp-method-header`, `mcp-name-header`, `protocol-2025-11-25`, `protocol-2026-07-28`, `sdk-fastmcp`, `sdk-mcp-import`, `server-discover`, `session-id`
- acord-bridge-mcp: `mcp-method-header`, `mcp-name-header`, `protocol-2026-07-28`, `sdk-fastmcp`, `sdk-mcp-import`, `session-id`
- as400-bridge-mcp: `mcp-method-header`, `mcp-name-header`, `protocol-2026-07-28`, `sdk-fastmcp`, `sdk-mcp-import`, `session-id`

## Still OPEN (not merged)

- csoai-defoneos-mcp PR#1
- dora-compliance-mcp PR#20
- eu-ai-act-compliance-mcp PR#28

## Upstream #15904

State: OPEN, 2 comments. No change from baseline.

## Glama

HTTP 404 (not listed yet). No change from baseline.

---
*M4 migration-watch · 8 Oct 2026 · CSOAI Ltd (UK 16939677)*
