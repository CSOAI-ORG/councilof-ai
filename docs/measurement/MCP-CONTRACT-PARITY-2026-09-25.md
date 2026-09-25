# MCP contract parity + HOLD watcher — 2026-09-25

Lane `contract-parity-20260925`. Record `csoai.mcp-contract-parity/0.1`, published as
https://huggingface.co/datasets/csoai/mcp-contract-parity (CC-BY-4.0). Figures below are copied by script from
`record.json` (sha256 `45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730cc323`); the record is the authority.

**Question.** Does one remote MCP service tell a relying agent one current contract across its public surfaces
(registry entry, `/.well-known/mcp.json`, server card, agent card, x402 manifest, live discovery answers)?
Measured, not certified; an INCONSISTENT row quotes two public statements that disagree, never which is right.

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
