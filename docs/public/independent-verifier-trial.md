# Independent verifier trial

Try the existing free verifier on one public historical measurement card and return the actual result. The task is to check a signed record before relying on it in an evidence-review workflow. A failed attempt, an unclear result, or a useful result can all help improve the workflow.

CSOAI's own reproduction is recorded below. Independent outside use remains unestablished by that reproduction. No payment or positive endorsement is requested.

## One small task

1. Open [this exact public card JSON](https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json) and copy its complete JSON.
2. Open [the free verifier](https://councilof.ai/gspc-verify/), paste the complete JSON into the **Record JSON or card id** field, and choose **Verify this record**. The field accepts JSON or a 64-character card id; do not paste a URL into it.
3. Record the displayed verdict and reasons, or the exact error if the card cannot be loaded or checked. Report what you actually see; do not substitute the expected result below.

The card was created on **19 August 2026 at 09:24:39.152331 UTC**. It is a historical verification example. Its signed measurement and framing are dated content; verification today does not make them fresh measurements. Use the [live board](https://councilof.ai/api/gspc) for current board data.

No account, wallet or paid request is needed for this trial. The scope is a supported `gspc.measurement-card`: its canonical body, signature and published signing-key pin. A valid signature does not certify model quality or establish the truth of every underlying measurement claim.

## Exact example and result return

| Field | Value |
| --- | --- |
| Public card | [Historical signed card](https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json) |
| Exact served JSON size in the recorded check | 821 bytes |
| Exact served-file SHA256 | `83780b8fdce486ce84e863f1e7dde1dbe64ac2c5cc45ac6a99bba17f7543449a` |
| Canonical signed-body card id | `82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c` |
| Pin returned by the recorded MCP check | `did:web:csoai.org#card-attestation-1` |

The served-file SHA256 identifies the original downloaded JSON file, not text whose whitespace may have changed when copied into the browser. The card id identifies the canonical signed body; these are different hashes with different purposes.

Return your result in the discussion where you received this trial, [open a public verifier trial report](https://github.com/CSOAI-ORG/councilof-ai/issues/new?title=%5BVerifier%20trial%5D%20Public%20card%20result&body=Task%20attempted%3A%20%0APublic%20sample%20card%20URL%3A%20https%3A%2F%2Fcouncilof.ai%2Fsigned%2Fcards%2F82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json%0AAttempted%20at%20(UTC)%3A%20%0AVerifier%20route%20and%20version%20actually%20observed%3A%20%0ADisplayed%20verdict%20and%20reasons%2C%20or%20error%20(remove%20secrets)%3A%20%0ADid%20the%20result%20help%3F%20Where%20did%20you%20get%20stuck%3F%20%0ARelationship%20to%20CSOAI%20%2F%20how%20this%20trial%20was%20independent%3A%20%0AMay%20CSOAI%20quote%20this%20report%3F%20%0A%0AInclude%20public%20sample%20details%20only.%20Do%20not%20include%20confidential%20inputs%2C%20personal%20data%2C%20credentials%2C%20wallet%20secrets%20or%20payment%2Fauthentication%20headers.%20This%20is%20a%20trial%20result%2C%20not%20certification%2C%20paid%20delivery%20or%20adoption.), or email [nicholas@csoai.org](mailto:nicholas@csoai.org). The optional public report requires GitHub sign-in; trying the free verifier does not. Do not post confidential inputs, personal data, credentials, wallet secrets or payment/authentication headers. Include:

- the task you attempted;
- the example URL and served-file SHA256 above;
- when you tried it, which verifier route you used, and the displayed verdict/reasons or exact error;
- whether the result helped, and any point where you got stuck;
- whether the trial was independent of CSOAI, and whether we may quote your report.

For the optional Python client, include its printed result or error. Include any source/version you actually used; do not infer the running server's version from this document's reference pin. Exclude confidential inputs. An unsuccessful trial is useful evidence too.

A returned report can establish a particular independent attempt and its outcome. It does not by itself establish production adoption, a sale, certification or acceptance by a directory maintainer.

## Keep the result and scope any separate request

Before closing or reloading, manually retain the original published card JSON and copy the verdict, reasons and check details, or error, with the checked time (UTC). The browser verifier does not save pasted records or results. A public-record link fetches current published bytes for a new check; it does not restore an earlier verdict.

For a separate fresh-check or claim-maintenance need, review the [existing services](https://councilof.ai/services/) and use the enquiry path there. Name the subject, public source, required output, freshness and delivery date. Check the service's scope: a receipt for existing evidence is not a fresh measurement. This trial remains free; an enquiry is not an order, and returning your result requires no purchase.

## Recorded CSOAI reproduction

On **11 October 2026**, CSOAI ran the original card and three modified copies through the free canonical MCP `verify_card` and web API. All four asserted outcomes passed on both interfaces. The web-API run completed at **01:49:38 UTC**.

| Case | Change | Observed state | Observed reasons |
| --- | --- | --- | --- |
| Published | Original card | VALID | None |
| Tampered body | Set `body.accuracy` to `0.5`; retain original id and signature | INVALID | `preimage_mismatch`, `signature_invalid` |
| Unknown named key | Remove `pubkey`; set `did` to `did:web:csoai.org#not-a-published-card-key` | UNCHECKABLE | `key_not_pinned` |
| Unknown inline key | Replace `pubkey` with 32 zero bytes; retain original signature | INVALID | `untrusted_signer`, `signature_invalid` |

The inline-key case tests an altered envelope with the original signature. It does not demonstrate a separately generated, cryptographically valid self-signed card.

The MCP result identified `did:web:csoai.org#card-attestation-1`, verified the original signature and reported agreement with the live DID document. That live lookup was advisory; the verifier's published pin decided the trust check. The web API did not expose a top-level `pinned_key` field in these responses.

These are dated CSOAI test results, not results from an independent user. The source references below are pinned for reproducibility; they do not assert that a later deployment is unchanged.

## Optional Python reproduction

Python 3's standard library is sufficient. Run the client below with `python3 -B` using standard input or a Python session. It downloads the public sample, checks the exact served-file digest, and submits four in-memory inputs to the free API. It creates no files and makes no paid requests.

The four request/assertion cases below passed in the recorded run. This retained client is 2,244 UTF-8 bytes with SHA256 `dd9a5fc9de1b0762f7f0bd8eeb8151941186143f0d4b741f276e5c9ac9ca1ab6` (LF, one final newline). The source reference in this document is documentary metadata, not a server-reported version.

```python
import copy, datetime, hashlib, json, urllib.request
CARD_URL = "https://councilof.ai/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json"
FILE_SHA256 = "83780b8fdce486ce84e863f1e7dde1dbe64ac2c5cc45ac6a99bba17f7543449a"
VERIFY_URL = "https://councilof.ai/api/verify"
sample_request = urllib.request.Request(CARD_URL, headers={"User-Agent": "CSOAI-Verifier-Reproduction/1.0", "Accept": "application/json"})
with urllib.request.urlopen(sample_request, timeout=20) as response:
    raw = response.read()
assert hashlib.sha256(raw).hexdigest() == FILE_SHA256, "Served sample bytes changed; review before continuing."
card = json.loads(raw)
tampered = copy.deepcopy(card)
tampered["body"]["accuracy"] = 0.5
unknown_did = copy.deepcopy(card)
del unknown_did["pubkey"]
unknown_did["did"] = "did:web:csoai.org#not-a-published-card-key"
unknown_inline = copy.deepcopy(card)
unknown_inline["pubkey"] = "00" * 32
cases = [
    ("published", card, "VALID", set()),
    ("tampered_body", tampered, "INVALID", {"preimage_mismatch", "signature_invalid"}),
    ("unknown_did", unknown_did, "UNCHECKABLE", {"key_not_pinned"}),
    ("unknown_inline", unknown_inline, "INVALID", {"untrusted_signer", "signature_invalid"}),
]
results = []
for name, sample, expected_state, required_reasons in cases:
    request = urllib.request.Request(VERIFY_URL, data=json.dumps({"card": sample}).encode(), headers={"Content-Type": "application/json", "Accept": "application/json", "User-Agent": "CSOAI-Verifier-Reproduction/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        verdict = json.load(response)
    assert verdict["state"] == expected_state, (name, verdict)
    assert required_reasons.issubset(set(verdict.get("reasons", []))), (name, verdict)
    assert verdict.get("not_a_certification") is True, (name, verdict)
    results.append({"case": name, "state": verdict["state"], "reasons": verdict.get("reasons", [])})
print(json.dumps({"checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source": CARD_URL, "sample_created": card["body"]["created"], "file_sha256": FILE_SHA256, "card_id": card["id"], "verifier": VERIFY_URL, "results": results, "not_a_certification": True}, indent=2))
```

If the file digest changes, the client stops for review. If an assertion, network request or JSON parse fails, return the exact error. A client error is an error report, not an automatically inferred INVALID or UNCHECKABLE signature verdict. A default `urllib` request initially received HTTP 403 during preparation; the explicit descriptive User-Agent shown above allowed the recorded run to complete.

## Source and verification rule

Reference source commit: `589815e3b0cf6ab74e0f0d6dc3937a6f377be110`.

- [Browser record form at the candidate base](https://github.com/CSOAI-ORG/councilof-ai/blob/f51733eb6d44cb0fca6e146bf846a184c97dd0e3/client/src/components/gspc/RecordVerifyForm.tsx)
- [Shared pinned verifier](https://github.com/CSOAI-ORG/councilof-ai/blob/589815e3b0cf6ab74e0f0d6dc3937a6f377be110/functions/_lib/cardVerify.ts)
- [Free API handler](https://github.com/CSOAI-ORG/councilof-ai/blob/589815e3b0cf6ab74e0f0d6dc3937a6f377be110/functions/api/verify.ts)
- [Published verification rule](https://councilof.ai/signed/HOW-TO-VERIFY.md)
- [Repository license at the reference commit](https://github.com/CSOAI-ORG/councilof-ai/blob/589815e3b0cf6ab74e0f0d6dc3937a6f377be110/LICENSE)

The client delegates canonicalization and signature checks to the existing verifier. It does not introduce another signature rule. Retain the published copyright and permission notice when redistributing the referenced implementation under its license.
