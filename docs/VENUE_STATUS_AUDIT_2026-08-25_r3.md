# Venue Status Audit — 2026-08-25 (Ralph round 3)

Round-3 delta on objective #1/#2/#4. Complements `VENUE_STATUS_AUDIT_2026-08-25.md`
(round 2); each change is verified from outside, codename-clean, and tracked here.

## 1. Living-db spine — re-verified accurate (0 change needed)

The authoritative live-status spine (`CSOAI-ORG/council-os`, `~/clawd/council-os`)
uses `ops/live_status_check.py` as the only writer of LIVE. Re-run this round:

```
checked from outside: 56 LIVE, 0 GATED, 0 changed. Evidence recorded.
```

- **56 organs LIVE** (14 axes × {gold_bank, harness, board, public_face}).
- **14 organs LANE-REPORTED** (the per-axis `specialist` organs; the checker refuses
  to upgrade lane claims without public resolution — measured pods host-evicted).
- `registry/spine.json` rewritten byte-identical (`git diff` empty) → no drift.
- `last_check: 2026-08-25` (today).

## 2. Live surfaces — re-probed HTTP 200 (fresh, external)

| Surface | Result |
|---|---|
| `https://councilof.ai/` | **200** (238,827 b) |
| `https://councilof.ai/api/gspc` | **200** (26,241 b) |
| `https://councilof.ai/gspc` (308→/gspc-scoreboard) | **200** (101,169 b) |
| `https://councilof.ai/gspc-scoreboard` | **200** (101,169 b) |
| 14 HF datasets `csoai/gspc-{gov..jail}` | **200** each |
| HF datasets `gspc-board` / `gspc-bench-results` / `gspc-leaderboard-results` (DONE) | **200** each |
| HF space `csoai/gspc-governance-leaderboard-spc` | **200** |

## 3. GitHub org — public repo set resolves; one gap

Repos verified public: `councilof-ai`, `cibola`, `csoai-static-deploy2`,
`csoai-governance`, `council-os`, `csoai-org-v2`.
`gh api orgs/CSOAI-ORG/repos` returns **404** (token lacks org-membership listing;
individual `repos/...` calls resolve fine — org exists).

- **Gap:** `CSOAI-ORG/csoai-gspc-mcp` still **404** (absent/private). Owner verify/restore.
- **Flagged (not edited):** `csoai-static-deploy2` public description contains
  "SOV33 substrate" — an internal codename on a public GitHub org-repo description.
  Sibling-lane public surface; left for its owner/lane to scrub (this round touched no
  public repo description).

## 4. MCP venue — CORRECTED finding (round-2 record was incomplete)

The actual `mcp-servers/csoai-governance` clone (`git@github.com:CSOAI-ORG/csoai-governance.git`,
server.json **v1.0.0**) fails `mcp-publisher validate` for a **description-length** error,
not the repository.url issue round 2 recorded:

```
Error: validation failed: 422 — {"message":"expected length <= 100",
"location":"body.description","value":"CSOAI AI Governance Suite — 25 international
framework crosswalks, CASA certification, Partnership Charter, sector compliance, and
risk assessment"}   # 146 chars
```

**Complete fix (validated PASS this round):**
1. `description` → "CSOAI AI Governance Suite — framework crosswalks, certification, compliance" (75 chars ≤ 100).
2. `repository.source` → `"github"` (hosting-service id per registry schema, not a URL).

Result:
```
Validating against https://registry.modelcontextprotocol.io...
✅ server.json is valid
```

Applied in a temp copy (`/tmp/server_fixed.json`) for evidence only — **not committed** to
the public repo and **not published**. `mcp-publisher login github` is **interactive device
flow** (device code → browser authorize) → **publish is OWNER-GATED**.

## 5. New canon insight (objective #3)

Mined `The_Architecture_of_Living_Law` (330 s transcript) into a branded verdict:
`cursor-feed/insights/architecture-of-living-law_verdict.{md,html}` + 2 cards
(`architecture-of-living-law_{card,square}.png`). Codename-clean (see sweep),
grammar "signed · measured · sovereign", `CONFORM` never `CERTIFIED`.
Consumed by the `/intelligence` verdict-card pipeline (`insights/*_verdict.*` glob).

## 6. Owner-gated items (not auto-committed)

- **MCP publish** — validated-ready (both fixes) but require the interactive device-flow
  login + owner decision; not committed/published this round.
- **HF org profile** — absent (`api/orgs/csoai` 404). Owner if an org page is wanted.
- **`csoai-gspc-mcp`** — repo 404; owner verify/restore.
- **`csoai-static-deploy2` public description codename** — sibling-lane scrub.
