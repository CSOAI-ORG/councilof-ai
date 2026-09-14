# Citation kit — citing a Council of AI measurement

For a model card, README, paper, procurement file or agent that wants to point at a Council of
AI measurement and let the reader check it. Companion to `docs/HOW_TO_CITE_MEASUREMENT_STANDARD.md`
(the reference form) and `docs/VERIFY_BADGE_SPEC_2026-08-24.md` (the badge contract).

**The wording rule.** Say *measured against*. Never "certified", "compliant", "approved",
"passed" or "endorsed by" — Council of AI issues no certificate, and a signature says who wrote
bytes down, not that the result is good. Quote numbers only from the signed artifact or the live
endpoint, never from memory; when a slot is UNMEASURED, say so.

---

## 1. Badge snippet

Both SVGs are served live and redraw from the board; neither hosts a grade you can buy.

Markdown:

```markdown
[![Measured against the GSPC board — Council of AI. Not a certification.](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/signed/HOW-TO-VERIFY.md)
```

One axis (replace `governance` with an axis id from `GET https://councilof.ai/api/gspc` → `axes[].axis`):

```markdown
[![Measured against GSPC governance axis — Council of AI. Not a certification.](https://councilof.ai/api/badge?axis=governance)](https://councilof.ai/api/gspc)
```

HTML:

```html
<a href="https://councilof.ai/signed/HOW-TO-VERIFY.md">
  <img src="https://councilof.ai/badge/gspc.svg"
       alt="Measured against the GSPC board — Council of AI. Not a certification.">
</a>
```

Caption to put next to it:

> Measured against the GSPC method by Council of AI (CSOAI Ltd, UK 16939677). This is a
> signed measurement, not a certification. Verify: see below.

For a site-wide script badge with partner colours, use the existing kit at `/badge` → `/embed`.

## 2. Verify command

Offline, Node, no install (the published single-file verifier, key pinned from your saved DID
document):

```sh
BASE=https://councilof.ai
curl -sSfO "$BASE/verifier/gspc-verify.mjs"
curl -sSf https://csoai.org/.well-known/did.json -o did.json
curl -sSf "$BASE/signed/cards/<card-id>.json" -o card.json
node gspc-verify.mjs card.json --did-document did.json      # exit 0 = VALID
```

Online, Python, one command — signature under the DID key, root inclusion, OTS proof presence
(`tools/verify/README.md`):

```sh
python3 tools/verify/csoai_verify.py "https://councilof.ai/signed/cards/<card-id>.json" --tamper-control
```

In CI (pin a reviewed commit): `actions/verify-card` (offline) or `actions/csoai-verify`
(online); a copyable workflow is `actions/csoai-verify/example-workflow.yml`.

## 3. Canonical JSON snippet

What a citation should carry — enough for a stranger to re-fetch and re-check, nothing that
has to be trusted:

```json
{
  "measured_against": "GSPC measurement method (Council of AI)",
  "issuer": "CSOAI Ltd (UK 16939677)",
  "card_id": "<64-hex sha256 of the card preimage>",
  "card_url": "https://councilof.ai/signed/cards/<card-id>.json",
  "axis": "<axis id as on the card body>",
  "signing_key": "did:web:csoai.org#card-attestation-1",
  "did_document": "https://csoai.org/.well-known/did.json",
  "preimage_rule": "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
  "verify": "python3 tools/verify/csoai_verify.py <card_url>",
  "retrieved_at": "<UTC ISO-8601 when you fetched it>",
  "not_a_certification": true
}
```

The id is recomputed, never copied on trust:

```python
import hashlib, json
card = json.load(open("card.json"))
pre = json.dumps(card["body"], sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")
assert hashlib.sha256(pre).hexdigest() == card["id"]      # then verify card["signature"] (Ed25519) over pre
```

If the card declares `"preimage_rule": "sha256(canonical body)"`, the preimage is sorted compact
JSON with UTF-8 literal strings and integral floats written as integers — use
`tools/verify/card_v01_validate.py`, which stops on any rule it does not implement.

## 4. AGENTS.md section template

Paste into a repository's `AGENTS.md` (or `CLAUDE.md`) so coding agents cite and check the
measurement the same way humans do:

```markdown
## External measurement (Council of AI)

- This project cites measurements from Council of AI. Wording: "measured against the GSPC
  method". Never write "certified", "compliant", "approved" or "endorsed" about them.
- Source of truth: the signed card at <card_url> (card id <card_id>) and the live board
  https://councilof.ai/api/gspc. Do not copy numbers from prose, from this file, or from memory;
  re-read the artifact. An UNMEASURED slot stays UNMEASURED.
- Before changing any text that quotes a measurement, verify the card:
  `python3 tools/verify/csoai_verify.py <card_url> --tamper-control` (exit 0 = signature VALID;
  1 = INVALID; 2 = could not check; 3 = required inclusion/OTS not shown).
  A card that does not verify must not be cited.
- A valid signature proves who signed the bytes. It does not prove the measurement is correct,
  current or complete. Say so where it matters.
```

---

*Measurement, not certification. Verification is free.*
