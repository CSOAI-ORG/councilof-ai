# ASI AUTO-EAT LOOP

A scheduled, continuous pipeline that runs the estate's own grammar forever:

```
discover  ->  probe  ->  (stage atoms)  ->  [human/dispatch]  sign  ->  anchor
```

so newly-appearing models / agents / MCP servers get **measured automatically**
without a human kicking each one — while the honesty rules stay **structurally
enforced**: nothing is MEASURED until a card signs green through GHA and
verifies. DISCOVERED / UNMEASURED are first-class. No invented numbers. Three
states everywhere. No minting.

## The pieces

| file | role |
|---|---|
| `discover.py` | poll HF Hub new-models, MCP registry, ERC-8004 (8004scan), XRPL; append genuinely-NEW ids to the frozen queue as `DISCOVERED` |
| `probe.py` | read-only three-state probe per kind (HTTP reachability / tokenURI / account_info); stage `card-v0` atoms (`sig_ed25519=null`) for LIVE only, ≤3KB |
| `gen_status.py` | regenerate `STATUS.md` + `status.json` — every number counted, none invented |
| `eat-loop.sh` | the keeper: `once` or `loop`; commits + pushes the **feed branch** (never master); rc captured before each three-state log line |
| `fold_auto_eat.py` | bridge: fold `autoeat.*` atoms into `ledger-cards-compact.json` + write the `ledger-card-*-unsigned.json` atoms the existing signer expects |
| `../../.github/workflows/auto-eat-sign.yml` | OPTIONAL autonomous fold+sign+PR; schedule commented |

State lives in `public/interop/auto-eat/`: `queue.jsonl` (frozen, append-only),
`probed.json`, `cards-compact.json`, `card-autoeat-*-unsigned.json`,
`status.json`. Git on the `auto-eat-feed` branch is the durable record.

## Why it cannot lie

- The loop holds **no signing key**, and `board-sign` is OIDC + workflow-allowlist
  gated regardless — so this path is **structurally unable to mark MEASURED**.
- Atoms carry `sig_ed25519: null`, `state: "queued"`.
- Push target is `auto-eat-feed`. master's gates + a human decide what signs.
- A LIVE probe means **reachable/resolvable only** — never a grade. GSPC score,
  weights integrity, tool behavior, reputation validity all stay `unmeasured`.

## The ONE dispatch that turns a feed batch into signed cards

The loop STAGES and pushes `auto-eat-feed`. It does not sign. To sign a batch
through the **existing** OIDC path (no new signing authority):

```bash
# 1. Work only on an isolated review branch/worktree (see council-os/LANE-PROTOCOL.md).
# Review the exact feed revision; bring only its approved auto-eat paths into that worktree.
git fetch origin auto-eat-feed
git restore --source=origin/auto-eat-feed -- public/interop/auto-eat

# 2. Validate and fold unsigned inputs; inspect the diff, then use the normal reviewed PR.
python3 scripts/auto-eat/fold_auto_eat.py
python3 scripts/auto-eat/fold_auto_eat.py --check
# Stage only the reviewed output paths. Do not push master directly or bypass its gates.
# The authorised owner merges the qualified PR before a separate signing dispatch.

# 3. THE ONE DISPATCH — existing allowlisted signer, target=ledger
gh workflow run hf-fin-shells-measure.yml -f target=ledger
```

Step 3 runs `scripts/sign_ledger_cards.py` under the `hf-fin-shells` OIDC
allowlist, signs each folded `autoeat.*` surface via `/api/board-sign`, and
commits `ledger-card-autoeat-*.json` with a real Ed25519 signature. Only then is
the subject MEASURED. Verify with `csoai_verify` / the `/verify` surface.

## Going fully autonomous (deliberate, two flips)

`auto-eat-sign.yml` can do fold+sign+PR on a schedule so the only human action
is the PR merge. It is intentionally inert until the owner makes **two**
deliberate changes (see the header of that workflow):

1. add `"auto-eat"` to `allowedWf` in `functions/api/board-sign.ts` and redeploy
   Pages — otherwise `board-sign` refuses this workflow's OIDC token and it signs
   nothing (halts loud);
2. uncomment the `schedule:` block in `.github/workflows/auto-eat-sign.yml`.

Leave either undone and a human stays in the loop.

## Running the keeper (sink pod)

```bash
# one proof cycle
EAT_PER_SOURCE=25 EAT_MAX_PROBE=40 bash scripts/auto-eat/eat-loop.sh once

# install the keeper (no crontab on the pod — nohup loop + pidfile inside eat-loop.sh)
# One instance: eat-loop.sh loop writes /workspace/auto-eat/eat-loop.pid and
# refuses a live pid. Never pgrep -f (self-match trap).
nohup env EAT_INTERVAL=3600 EAT_PIDFILE=/workspace/auto-eat/eat-loop.pid \
  bash scripts/auto-eat/eat-loop.sh loop >> scripts/auto-eat/eat.log 2>&1 &
```

## Fold integrity gate — 12 November 2026 candidate

`fold_auto_eat.py --check` now checks both the ledger payload and the complete unsigned destination atom against the matching staged source. A malformed/missing compact source, duplicate/nonfinite JSON, mismatched source payload or identity, unsafe file/path, filename collision, signed/nonqueued evidence or ambiguous legacy atom is a nonzero refusal. Only an explicitly parsed empty object is an empty successful no-op.

The whole batch is validated before output replacements, so a later invalid item cannot cause an earlier valid item to be written. A small exclusive fold lock and exact input recheck detect competing folds and pre-write changes; existing locks are not removed automatically. Each output is replaced atomically, but this is not a multi-file database transaction. An I/O failure can leave recoverable partial staging, returns nonzero and requires `--check`/rerun. Other writers must still honour the repository lane ownership.

An unchanged valid batch does not rewrite files. Rows with no staged atom but an existing bare ledger key remain owned by that other writer. They are explicitly counted as DELEGATED_UNVERIFIED, with payload differences reported; they are not folded, matched, certified or signed by this bridge. The script signs nothing, performs no probes, admits no measurement and does not train a model.

```sh
python3 scripts/auto-eat/test_fold_auto_eat.py
python3 scripts/auto-eat/test_honesty.py
python3 scripts/auto-eat/test_g2_gate.py
```

The read-only GitHub `auto-eat-integrity` workflow runs these controls for relevant pull requests on Python 3.11 and 3.12. It has no signing, token-writing, deployment or scheduling role. Source tests are not proof that a candidate is merged, deployed or operating on the live queue.

### Historical compatibility is preserve-only

An existing atom missing signature/state metadata can pass only as `PRESERVED_LEGACY` when source, destination and ledger payload are already consistent. It is not rewritten or relabelled unsigned. A mismatch or missing destination is a refusal requiring owner migration. Non-null signatures and explicit nonqueued states are never accepted as authority. Two fixed historical A2A/HF dated identities are supported only in this preserve-only path; arbitrary payload-based identity substitution is refused. The qualification record distinguishes 27 owned staged rows from 11,507 delegated/unverified ledger-direct rows in the pinned master snapshot.
