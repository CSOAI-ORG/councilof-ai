# Shipping the pod's runs to the durable intake

`scripts/runpod_gspc_push_to_hf.py`. Run it on the pod after each worker cycle.

## Why it exists

`runpod-intake.yml` only **pulls** (`snapshot_download("csoai/runpod-gspc-intake")`). The first
durability copy was a one-off, so every worker cycle after it produced runs that lived on the pod
and nowhere else. One machine is not durability — a previous run was lost with its pod.

Checked on both sides before building it, rather than inferred:

    git grep -l runpod-gspc-intake origin/master     # the workflow and the verifier only
    ssh <pod> 'grep -rl runpod-gspc-intake /workspace'  # nothing

Pod run dirs **112** = HF run cards **112** today, so nothing is stranded yet. The next cycle
(~00:42 UTC, `interval_seconds` 86400) is the one that would be.

## What it will not do

Never deletes. Never rewrites a run already on the Hub — an existing path is left exactly as
published, because re-uploading "the same" run with a different byte is how a measurement quietly
changes after it has been counted. Never touches `/workspace` archives.

A run dir counts only with **all three** of `card-unsigned.json`, `items.jsonl`, `run.json`, each
non-empty. A half-written dir is skipped this pass and picked up next time: uploading a partial run
would put a card on the Hub with no items behind it, which reads as measured and is not.

## Credentials — it proves the token before using it

There is rarely one token. On this estate:

| source | state |
|---|---|
| `HF_TOKEN` on the pod | **exported EMPTY** — every `[ -n "$HF_TOKEN" ]` test says "yes" |
| `HUGGINGFACE_TOKEN` in the local shell | present, **401s** on the private dataset |
| `~/.cache/huggingface/token` | works |

Taking the first non-empty one silently picked a broken credential, and the failure surfaced much
later as HF's own `Invalid username or password`. The script now tries each source, **proves it can
read the repo**, and names the one that worked:

    auth: /Users/nicholas/.cache/huggingface/token can read csoai/runpod-gspc-intake (344 files upstream)

If none can read, it exits **2 UNCHECKABLE** and lists each source with its reason — never token
values. An unreadable listing is never treated as "the Hub is empty": that would re-upload
everything and rewrite published runs.

A token is required even for `--dry-run`, because deciding what is new means reading what is already
there. A dry run that skipped the listing would print every run as WOULD PUSH and look like an empty
Hub.

## Run it

    HF_TOKEN=<a token with write access to the intake dataset> \
      python3 scripts/runpod_gspc_push_to_hf.py --root /workspace/gspc-24x7

    # see what it would do, touch nothing
    ... --dry-run

## Owner action to deploy

**The pod has no usable HF token** (`HF_TOKEN` is exported as an empty string; length 0, and
`whoami` returns 401). Putting a working token on the pod is a credential move and is the owner's,
not this lane's. Once it is there, run the script after each worker cycle — a cron beside the worker,
or a line at the end of the worker loop.

`huggingface_hub` was installed on the pod for this (1.30.0, additive; `/workspace` free space
unchanged at 4.1 GB).
