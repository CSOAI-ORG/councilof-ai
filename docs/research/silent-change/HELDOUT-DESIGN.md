# Silent-change detector: a private, rotating item set (design, 22 Nov 2026)

Status: **the mechanism can be built today; the items do not exist, and where they live is the owner's decision.** Nothing private is committed by this change.

## Why
Every bank behind a board axis is public (`docs/operations/INSTRUMENT-GUARD-POLICY.md`: `HELDOUT_INELIGIBLE`). Repeating a public item 30 times measures memory 30 times, and a provider can recognise a fixed public probe. A private set, rotated, removes both.

## What exists to hang it on
`harness/instrument-guard/` (epoch key, `sha256(epoch_key)` published, HMAC membership, retirement on rotation, public sha256 commitments, leak scan), the private dataset `hf:csoai/private-calibration` (I cannot read it: whether any slice exists there is unverified), and `scripts/canary-leak-gate.mjs` in `pr-gates.yml`.

## Where the items could live (pick one)
1. **Private Hugging Face dataset, read by the workflow with the existing `HF_TOKEN` secret.** Items never enter git. Costs nothing new. Needs the owner to confirm the dataset is private and that the HF billing state allows private storage (unverified; billing failed 2 to 4 Nov).
2. **An encrypted file in the repository, key in one Actions secret** (for example `SILENT_CHANGE_HELDOUT_KEY`, which does not exist yet). The ciphertext is public; the plaintext is not. Anyone who ever obtains the key reads every epoch, so the key must be rotated with the items.
3. **A single Actions secret holding the items** (limit about 48 KB). Simple, but rotating means the owner edits a secret by hand.

Recommendation: option 1. Decision: owner.

## How it would work, whichever store
- Authoring: items are written by us and reviewed by the axis's working group (they are new work; none exist). One epoch is about 20 items, written fresh. No real person's text.
- Before use, `sha256` of the epoch's canonical item list is committed publicly (the commitment). After the epoch is retired the items may be revealed and checked against it; an item that was ever public can never become held-out again.
- The runner reads items from a path given by `--items-file`, held in memory only. For a private epoch it writes **answers by item commitment only**: no item text, no raw model output, no prompt. Raw responses are not uploaded as artifacts (a public repository's artifacts and logs are public). The signed record carries counts and digests.
- The workflow masks the loaded content and prints no item. A flag on a private epoch is computed against a baseline taken on the same epoch; rotation means a new baseline, announced in the record.
- A model that is watched on a private epoch and on the public set gives two series; a movement on the public set only is a hint of memorisation or probe recognition, not a finding.

## What is not built yet
The `--items-file` loader and the output redaction for private epochs. Without an authored epoch and the owner's choice of store they would be untestable against real use, so this change stops at the design. The public-only path is built, tested and is what the workflow runs.
