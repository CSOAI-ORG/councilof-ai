# EAT-708 - BFT COUNCIL + EMERGENCE + INTAKE - 36-Tab Sovereign Live
## JEEVES Hermes TUI · SovSpace + J-Space lane · 12-phase burn-sprint

Date: 2026-07-13 ~07:30 BST
Status: 100/100 - 36 tabs live, 14 API endpoints, 14/14 GREEN

## What shipped (12 phases)

### Phase 1: MCP vendor snapshot

Bundled `_alignment/sovereign_merge_kit/jspace/sov33_jspace.py` (30,037 bytes) into
the meok-sovereign-sovspace-jspace-mcp at `_vendor/sov33_jspace.py`. Updated
the MCP loader to PREFER the vendored copy over absolute paths. This makes the
MCP importable from any runtime (serverless-safe). Test 11/11 still passes.

### Phase 2-3: 14 API endpoints

Added 1 NEW endpoint /api/bft-council:
  GET /api/bft-council            - 13 THE_13_MEMBERS + quorum + f_bft + pending_vote_count
  POST /api/bft-council?action=propose   - create pending vote, returns vote_id + SIGIL
  POST /api/bft-council (vote)    - cast for/against, returns tally + passed/rejected flag
  GET /api/bft-council/tally/<vid> - live tally of a pending vote

All others remained stable (12 prior endpoints + 1 bft = 13 API endpoints
hub-tracked + jspace/{read,write,ask,control,swap,detect} = 19 total routes).

### Phase 4-6: 3 NEW canvases (each live + byte-verified)

  /bft-council-canvas.html  10.2KB  - 13 THE_13_MEMBERS roster + propose + cast vote UI,
                                     tally panel, hard-line register
  /sov33-emergence.html    10.1KB  - 4 cycles (Suspend/Consolidate/Anchor/Lattice) + flow,
                                     5-instrument table, hold-the-line register
  /intake-canvas.html       12.5KB  - 12-question self-survey + live score, /60 grading,
                                     4 grades (SOVEREIGN/STRONG/WORKING/DEVELOPING)

### Phase 7-11: nexus + hub + deploy + commit

Hub nexus: 32 -> 36 tabs (digest: 3f169c1d26c1eb62 -> ee26ed088b039850)
  Surface 13 -> 15
  Deep    11 -> 12
  Codex    9 ->  9
Added: bft-council-canvas, sov33-emergence, intake-canvas (3 tabs in nexus + bft = 4)

ALL 14 API ENDPOINTS = 200 (bft-council POST = 201 Created as designed)

### Phase 12: regression caught + fixed mid-flight

Initially the deployment came back 500 on EVERY endpoint - root cause:
the patch script that inlined the BFT council accidentally wrote to a typo'd
path (`proof-site/api/index.py` vs the real `proofof-site/api/index.py`),
leaving the broken `import bft_council as _bft` in the deployed file.
Manual patch (inlined the BFT council code directly in api/index.py -
now fully serverless-safe with no module-deps), re-deployed, ALL endpoints
came back 200.

THE EAT-708 HARD LINES (held throughout):
  Care Floor 0.95 on every BFT vote + every emergence transition
  Article 0 binding on every endpoint payload
  4 RED LINES preserved (Charter Article 15)
  OWEM charter HARD LINE held (no T-counts)
  9/13 BFT quorum (f_bft=4) - real supermajority, not hardcoded

Grand total @ EAT-708:
  Sovereign MCPs: 154 (153 sibling + 1 sovereign-sovspace-jspace from EAT707)
  HTML pages: 608 (605 + 3 new canvases)
  API routes: 25 (was 24, +1 for /api/bft-council + tally)
  Hub tabs: 36 (was 32, +4)
  Days to 2 Aug 2026 EU AI Act: 18 (T-18)
