# MCP contract parity + HOLD watcher — 2026-09-25

Lane `contract-parity-20260925`. Record `csoai.mcp-contract-parity/0.1`, published as
https://huggingface.co/datasets/csoai/mcp-contract-parity (CC-BY-4.0). Figures below are copied by script from
`record.json` (sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`); the record is the authority.

**Question.** Does one remote MCP service tell a relying agent one current contract across its public surfaces
(registry entry, `/.well-known/mcp.json`, server card, agent card, x402 manifest, live discovery answers)?
Measured, not certified; an INCONSISTENT row quotes two public statements that disagree, never which is right.

## Correction 0.1.1 (2026-09-26) — this section supersedes the 0.1 figures below where they differ

Record `csoai.mcp-contract-parity/0.1.1` (`record.v0.1.1.json`, sha256 `9cd02be424bf608d41f40522e48188f5a9ef4d13c8de6e28023b20a941fd4ef8`) supersedes 0.1 (`record.json`, sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`), which stays published byte for byte. Signed: `record.v0.1.1.signed.json` (sha256 `87e624558cd5b45df9357c6893e2f5dccdff1ea95b859375f03ae98465564e71`, did:web:csoai.org#board-attestation-1). OTS: `record.v0.1.1.json.ots` (sha256 `8b8190b7fa2cb07a777a6d77f631d6b2ad47bbc27f1e0279bfa16bf0cd747a51`). HF dataset commit `0f4c4bae9e5f243bb37b4dc58075882a87737eb3`.

**What was wrong.**

- **D1** (TOOLS): 0.1 every declared tool list was compared exactly with the live tools/list. Why wrong: the live tools/list is read WITHOUT credentials. A service that names the tools usable without credentials (public_tools, anonymousTools, ...) declares that its unscoped list is its full, partly authenticated surface; an unauthenticated listing may show the public subset or everything. The full list is not a claim about what unauthenticated discovery lists.. 0.1.1: with a public-scoped list present, unscoped lists / counts are compared as supersets (every live tool must be in them); the public list is recorded, not compared (it scopes use, not listing).
- **D2a** (attribution (all)): 0.1 an origin's documents were credited to an endpoint whenever the census frame knew one server on that origin. Why wrong: the document itself can say it describes another endpoint mount on the same origin; the origin then serves more than one MCP endpoint and the instrument's own shared-origin rule applies. 0.1.1: an MCP document naming another endpoint mount on this origin (and not this endpoint) is not credited; another host (www/apex, a custom domain) or another transport/version path of the same mount is not read as a second endpoint.
- **D2b** (attribution (all)): 0.1 facts were read from every nested block of a credited document. Why wrong: a nested block with its own url and its own tools/transport describes another endpoint (a docs MCP, an apps MCP, a hosted demo). 0.1.1: such a block is removed before facts are read: always when its endpoint is on this origin; on another host only when the document also describes an endpoint of its own outside the block.
- **D3** (AUTH): 0.1 a registry remote header with isRequired false and a card's authentication.required true were paired as a contradiction. Why wrong: isRequired false (the registry omits false; the schema default is false) says the client may CONNECT without the header; the card's 'required' does not say whether it applies to discovery or to tools/call. Two claims of different scope; tools/call is never sent, so which scope the card means is not observed.. 0.1.1: UNCHECKABLE (DECLARED_SCOPES_DIFFER); still INCONSISTENT when discovery itself was refused without credentials.
- **D4** (TOOLS): 0.1 a bare declared tool count was compared with the live tool count. Why wrong: when the live list holds a dispatcher (run_tool, call_tool, ...), a count above the live count may count tools reached through it; the count does not say which it counts. 0.1.1: not compared; UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) when it is the only declared figure; a count BELOW the live count is still INCONSISTENT.

**Fix.** Producer `scripts/census/contract-parity.py` commit `4037f6bb2b7162b1679301846287b95934a85ad6` (instrument 0.1.1); tests: scripts/census/test_contract_parity.py class Correction011: one fixture per reported case, shapes copied from the stored bytes; five must-fail controls, each restoring one 0.1 rule, fail the suite.

**Reproduction.** the 0.1 producer (commit d9e0f80) re-run over the same inputs reproduces all 5828 published 0.1 rows byte-identically, so every difference below is the producer change and nothing else.

**Effect.** Endpoints with any INCONSISTENT dimension: 2778 → 2768. 22 rows, 26 dimension changes. Not changed: VERSION and PAYMENT rules; the plan; the population; every row not listed in rows_changed keeps its 0.1 states.

| dimension | state | 0.1 | 0.1.1 |
|---|---|---|---|
| AUTH | CONSISTENT | 931 | 928 |
| AUTH | INCONSISTENT | 23 | 10 |
| AUTH | SINGLE_SURFACE | 4465 | 4468 |
| AUTH | UNCHECKABLE | 409 | 422 |
| PROTOCOL | SINGLE_SURFACE | 5064 | 5065 |
| PROTOCOL | UNCHECKABLE | 272 | 271 |
| TOOLS | CONSISTENT | 905 | 908 |
| TOOLS | INCONSISTENT | 233 | 226 |
| TOOLS | SINGLE_SURFACE | 4532 | 4535 |
| TOOLS | UNCHECKABLE | 158 | 159 |

Dimension changes, by endpoint name:

| endpoint | dimension | 0.1 → 0.1.1 | cause |
|---|---|---|---|
| https://app.augenix.ai/api/mcp/public | TOOLS | INCONSISTENT → SINGLE_SURFACE | D2a |
| https://www.decisionlog.ai/api/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.myotp.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://toolforte.com/api/mcp | TOOLS | INCONSISTENT → UNCHECKABLE (DECLARED_COUNT_SCOPE_UNSTATED) | D4 |
| https://scholar-sidekick.com/api/mcp | TOOLS | INCONSISTENT → CONSISTENT | D2b |
| https://scholar-sidekick.com/api/mcp | AUTH | CONSISTENT → SINGLE_SURFACE | D2b |
| https://mcp.klarix.ai/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://ai-visibility.rowb.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://auth-posture.rowb.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://stampcard.rowb.app/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://veilpoint.ca/mcp | TOOLS | INCONSISTENT → CONSISTENT | D2b |
| https://dchub.cloud/mcp/registry | TOOLS | INCONSISTENT → CONSISTENT | D2b |
| https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp | TOOLS | CONSISTENT → SINGLE_SURFACE | D2a |
| https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp | AUTH | CONSISTENT → SINGLE_SURFACE | D2a |
| https://carsmultiverse.com/wp-json/cmvmcp/v1/mcp | PROTOCOL | UNCHECKABLE (DECLARED_VERSION_NOT_REQUESTED) → SINGLE_SURFACE | D2a |
| https://hotels.flightpowers.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://flights.flightpowers.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://www.immersivecommons.com/api/mcp | TOOLS | INCONSISTENT → CONSISTENT | D2b,D1 |
| https://itsnum.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.unifically.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.usecarscout.com/mcp | TOOLS | INCONSISTENT → CONSISTENT | D1 |
| https://standoutmcp.io/api/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://mcp.btcdecoded.org/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |
| https://agent-arcade-ai.cursoraikk.chatgpt.site/api/v3/mcp | TOOLS | CONSISTENT → SINGLE_SURFACE | D2a |
| https://agent-arcade-ai.cursoraikk.chatgpt.site/api/v3/mcp | AUTH | CONSISTENT → SINGLE_SURFACE | D2a |
| https://api2.transloadit.com/mcp | AUTH | INCONSISTENT → UNCHECKABLE (DECLARED_SCOPES_DIFFER) | D3 |

## Own endpoint first (https://councilof.ai/mcp)

- AUTH: **CONSISTENT**
- PAYMENT: **CONSISTENT**
- PROTOCOL: **SINGLE_SURFACE**
- TOOLS: **CONSISTENT**
- VERSION: **CONSISTENT**

## Read

EXHAUSTED over the plan: 5828 of 5828 planned endpoints attempted
(auth_required+advertises_x402_or_a2a 20, responded 5807, watch_list 1). The plan is built on PARTIAL probe reads; its counts
are not frame or population totals. Surface fetch: 2026-09-25T11:20:34Z - 2026-09-25T12:11:29Z, GET-only, robots.txt honoured,
1 req/s/host, one connection/host, 26499 requests.

| dimension | CONSISTENT | INCONSISTENT | SINGLE_SURFACE | UNCHECKABLE |
|---|---|---|---|---|
| AUTH | 931 | 23 | 4465 | 409 |
| PAYMENT | 112 | 4 | 572 | 5140 |
| PROTOCOL | 459 | 33 | 5064 | 272 |
| TOOLS | 905 | 233 | 4532 | 158 |
| VERSION | 3163 | 2644 | 21 | 0 |

Endpoints with at least one INCONSISTENT dimension: 2778.

Timing caveat: live answers and surface documents were read up to ~5.5 h apart. Where the registry version changed in between (HOLD window W2), the row uses the hold re-probe read inside the surface window. A service that changed without a registry version change in that interval can still show a live-vs-document INCONSISTENT; registry changes after the W2 read (11:25:23Z) are not observed.

## HOLD watcher

`scripts/census/version-hold.py`: registry server.version changed between two reads -> HOLD_UNTIL_REMEASURED;
remote endpoints re-probed read-only with prober 0.2 (bound 300). Held 173 (91 with a remote);
outcomes: HOLD_UNTIL_REMEASURED 85, REMEASURED_CHANGED 6, REMEASURED_NO_BASELINE 14, REMEASURED_SAME 60, REMEASURE_INCONCLUSIVE 8.
Auth boundary is compared only like-for-like (0.2 legacy-era initialize vs 0.1 initialize); protocol only when 0.2 fell
back to legacy requesting 2025-11-25; SAME requires at least one dimension actually compared.

### Cron line for the flywheel lane to adopt (this lane installs no crontab)

```
40 */6 * * *  cd ~/lanes/flywheel/scripts/census && S=~/lanes/flywheel/state/hold && R=$S/$(date -u +\%Y\%m\%dT\%H) && python3 version-hold.py fetch --since-file $S/last-read --out $R && python3 version-hold.py diff --window "cron|$S/snapshot.jsonl.gz|$(cat $S/last-read)|$S/snapshot.jsonl.gz|$(date -u +\%FT\%TZ)|$R/fetched.jsonl.gz" --out $R --write-snapshot $S/snapshot.jsonl.gz && python3 version-hold.py remeasure --hold $R --baseline $S/last-probe --bound 300 && date -u +\%FT\%TZ > $S/last-read
```

Seed `state/hold/snapshot.jsonl.gz` once with `version-hold.py diff --write-snapshot` from a full frame read, and
`state/hold/last-read` with that read's start time; `--baseline` points at the last census probe output dir.

## Signature and timestamp

`record.signed.json`: signed 2026-09-25T12:25:41.808Z under did:web:csoai.org#board-attestation-1, verified locally;
altered-preimage controls: {'trailing byte appended': 'rejected (control holds)', 'record sha256 altered': 'rejected (control holds)'}.
`record.json.ots`: PENDING_CALENDAR_COMMITMENT (3 calendars), not a Bitcoin attestation until upgraded and verified.

## Reproduce (Oracle)

```
python3 scripts/census/contract-parity.py --self-test
python3 scripts/census/version-hold.py --self-test
D=/evac-bulk/contract-parity-2026-09-25
python3 scripts/census/contract-parity.py plan --probe /evac-bulk/census-probe-2026-09-25 --probe /evac-bulk/census-firstparty-2026-09-25 \
  --registry-raw /evac-bulk/census-frame-2026-09-25/raw/mcp-registry --frame /evac-bulk/census-frame-2026-09-25 --out $D
python3 scripts/census/contract-parity.py collect --plan-dir $D --out $D --workers 64 --budget-s 4200
python3 scripts/census/version-hold.py fetch --since 2026-09-25T05:45:50Z --out $D/hold
python3 scripts/census/version-hold.py diff --window "W1|<RAS read jsonl>|..|<frame raw>|.." --window "W2|<frame raw>|..|<frame raw>|..|$D/hold/fetched.jsonl.gz" --out $D/hold
python3 scripts/census/version-hold.py remeasure --hold $D/hold --baseline /evac-bulk/census-probe-2026-09-25 --baseline /evac-bulk/census-firstparty-2026-09-25 --bound 300
python3 scripts/census/contract-parity.py compare --plan-dir $D --collect-dir $D --out $D/compare --hold $D/hold
python3 scripts/census/contract-parity.py build --compare-dir $D/compare --plan-dir $D --collect-dir $D --hold $D/hold --out $D/record --stage $D/stage
```
