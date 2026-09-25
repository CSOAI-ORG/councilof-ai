# Evidence to media compiler (`scripts/media/compile.py`)

**Rule.** Generated media may only re-render a signed, verified record. It never originates a claim.

```
python3 scripts/media/compile.py https://huggingface.co/datasets/csoai/a2a-card-census/resolve/main/record.json --out out/a2a
python3 -m unittest scripts/media/test_compile.py -v              # offline (fixtures + DID snapshot)
CSOAI_ONLINE=1 python3 -m unittest scripts/media/test_compile.py  # adds live DID + live HF
```

## What it refuses (exit 2, writes nothing)

| Condition | Why |
|---|---|
| no `<stem>.signed.json` | unsigned records are never rendered |
| canonical payload sha256 != `signature.payload_sha256` | the envelope was altered |
| `payload.artifact.sha256` != sha256(record bytes) | the record was altered, or it is the wrong file |
| Ed25519 fails under `did:web:csoai.org#board-attestation-1` (from the live DID document) | not signed by the board key |
| an altered preimage verifies | the verifier itself is broken |
| the OTS proof is over other bytes, or its sidecar names another sha256 | the timestamp is for something else |
| a verified sibling record's `supersedes.sha256` is this record | corrections supersede; `--allow-superseded` renders it labelled SUPERSEDED |
| a sibling claims to supersede it but does not verify | fail closed until resolved |
| no spec for the record's schema, or a spec path is absent | the compiler never improvises or fills a gap |
| any number token in any output is not verbatim in `record.json` | numbers are copied, never recomputed or re-rounded |
| X post over 280 characters, or card overflow | shorten the spec; never drop the limits or provenance |

The number check reads the visible text of every output (SVG text nodes, X, LinkedIn, the script's
on-screen and voice lines). A number must appear as a whole number token in `record.json`, not
inside a hash. Provenance numbers (dates, `signed_at`, the sha256 prefix) may instead come from the
verified signed envelope. Two things are excluded and are listed as excluded in `manifest.json`:
SVG layout attributes and the script's `t_s` shot timings, which are production metadata, not claims.

## What it emits (per record)

`card.svg` (1200x675), `x.txt`, `linkedin.txt`, `video-script.txt` + `video-script.json` (30 s,
four shots), and `manifest.json`: the pinned source (HF commit), the signature checks, the OTS state,
the supersession result, every rendered figure and its JSON path, and the number-provenance result.
Each output carries the record id, the date, the sha256 prefix, the signature state, the OTS state, the
verify URL and the record's own limits.

**OTS.** It reports what the proof says. It asks the known calendars to upgrade a pending proof
(in memory). If Bitcoin block attestations come back, it fetches each block header from one public
explorer (blockstream.info) and checks the committed digest equals that block's merkle root:
all match -> `BITCOIN_BLOCK_ATTESTED_EXPLORER_CHECKED` (explorer, not a local node); any mismatch ->
refusal; explorer unreachable -> `BITCOIN_ATTESTATION_FROM_CALENDAR`, stated as unchecked. The upgraded
proof is written beside the drafts as `<record>.upgraded.ots`; the published pending proof is not touched.

**PNG.** `compile.py` does not rasterise (the Oracle host has no SVG rasteriser and none is installed).
A PNG may be made afterwards from `card.svg` by any renderer; record the renderer and both sha256s.

**Posting.** Nothing is posted. Drafts only; posting to any channel is owner-gated.

Adding a record type means adding a spec to `SPECS`: templates whose every figure is a JSON path.
Free text in a template may contain a number only if the record contains it verbatim.
