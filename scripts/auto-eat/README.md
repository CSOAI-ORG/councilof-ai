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
# 1. review the feed branch, then bring its auto-eat files onto master
git fetch origin auto-eat-feed
git checkout master
git checkout origin/auto-eat-feed -- public/interop/auto-eat

# 2. fold the LIVE atoms into the ledger signer's inputs
python3 scripts/auto-eat/fold_auto_eat.py
git add public/interop/ledger-cards-compact.json public/interop/ledger-card-autoeat-*.json public/interop/auto-eat
git commit -m "auto-eat: fold feed batch for signing"
git push origin master

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

# install the keeper (no crontab on the pod — nohup loop + pidfile)
nohup env EAT_INTERVAL=3600 bash scripts/auto-eat/eat-loop.sh loop \
  >> scripts/auto-eat/eat.log 2>&1 &
echo $! > /workspace/auto-eat/eat-loop.pid
```
