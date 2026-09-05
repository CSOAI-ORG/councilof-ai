# RunPod GSPC playlist — what the pod should grade next

Derived 2026-09-05 from `GET https://councilof.ai/api/hub-cards` and the pod's model list.
Every number below is re-derivable; the command is under each claim.

## The question

TUI-2 step 7: *"Playlist the 70 UNMEASURED hub-queue cells the pod's 5 models can grade."*

## The answer: the playlist is empty, and it should be

**0 of the 70 are pod-gradeable, and none of them wants grading.** Those are two separate
findings and the second is the one that matters.

### 1. The pod cannot grade them — model mismatch

A cell is a `(model, axis)` pair. Grading cell `(M, A)` means running model **M**. The 70
UNMEASURED cells span 12 third-party models:

    Qwen/Qwen2.5-Coder-32B-Instruct     deepseek-ai/DeepSeek-R1
    Qwen/Qwen2.5-Coder-7B-Instruct      deepseek-ai/DeepSeek-V3.2
    Qwen/Qwen3-30B-A3B                  deepseek-ai/DeepSeek-V4-Flash
    Qwen/Qwen3-4B-Instruct-2507         deepseek-ai/DeepSeek-V4-Flash-0731
    Qwen/Qwen3.5-122B-A10B              google/gemma-3-4b-it
    zai-org/GLM-5.2                     meta-llama/Llama-3.1-8B-Instruct

The pod holds five small local models: `qwen2.5:0.5b-instruct`, `qwen2.5:1.5b`, `qwen3:4b`,
`qwen2.5:7b`, `mistral:7b`. Matched with normalisation deliberately loosened (case-folded,
`ollama:` and `-instruct` stripped, org prefix dropped) so a near-miss would still count:
**0 matches**. A 122B and a 550B do not fit on one RTX 3090 regardless.

### 2. The stronger finding — they are not short of data

All 70 read exactly:

    status      UNMEASURED
    n           30          (all 70)
    signed      true        (all 70)
    unmeasured  ["signed-pending-verify"]   (all 70)

n=30 is the quotable threshold. These cells **already have their measurement**. What they carry
is the expired state `sign_mill_cards.py` documents as **#1155** — "signed-pending-verify" was
true only until the card verified, and it was interned into the signed bytes anyway.

**They need a verification pass, not GPU hours.** Pointing the pod at them would burn the
remaining RunPod credit re-measuring cells that are not short of measurement, and would not
move `measured` even if it succeeded, because the blocker is the frozen body text.

Never edit those signed bytes to fix it. Supersede or ledger — `sign_mill_cards.py` already
writes `SUPERSEDED.jsonl` and names a changed body onto a different content-addressed path,
so a re-signed body cannot overwrite a published one.

## What the pod should do instead

Keep doing what it is doing. The pod grades its **own** 5 models across 14 axes — cells that
exist nowhere else — and those are additive to the census, not replacements. `runpod-intake.yml`
already pulls, verifies and stages them 4x/day; PR #1348 landed the first 70.

## Re-run every claim here

    # the 70, their reasons, their n, and the pod-gradeable count
    curl -s https://councilof.ai/api/hub-cards > /tmp/hc.json
    python3 - <<'PY'
    import json
    from collections import Counter
    cells=json.load(open('/tmp/hc.json'))['cells']
    un=[c for c in cells if c.get('status')!='MEASURED']
    print('unmeasured:',len(un))
    print('reasons   :',Counter(tuple(x.get('unmeasured') or []) for x in un))
    print('n values  :',Counter(x.get('n') for x in un))
    print('models    :',len({x['model'] for x in un}))
    PY

    # the pod's actual models
    runpodctl pod list          # fpowppss5ngtkw = the 24/7 grader
