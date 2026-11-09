# Inspect a retained evidence bundle offline

`functions/_lib/evidenceBundleCheck.ts` exports `checkEvidenceBundle`. It is a pure check over saved inputs. It does not fetch, pay, sign, write a record or decide whether a customer should use the evidence.

```ts
import { checkEvidenceBundle } from "../../functions/_lib/evidenceBundleCheck";

const checks = await checkEvidenceBundle({
  responseBytes: savedResponseBytes,
  originalCards: savedOriginalCardTextsByFullSha256,
  expected: {
    obligation: "article-50",
    subject: "the subject you selected", // null for an obligation-wide selection
    cardIds: fullCardIdsSelectedBeforeInspectingTheDelivery,
    resourceUrl: exactRetainedBundleResourceUrl, // needed only for delivery-record comparison
  },
  expectedResponseSha256: independentlyRetainedResponseDigest, // optional
  timestampPolicy: { now: "2026-10-29T12:00:00Z", maxAgeSeconds: 86_400 }, // optional caller policy
  deliveryRecord: retainedUnsignedDeliveryRecord, // optional, not a payment receipt
});
```

Select the obligation, subject and **full 64-character lowercase card IDs independently of the delivered response**. Copying its claims into `expected` establishes self-consistency only. An empty expected list is allowed and remains an explicit empty selection, not evidence that no measurements exist.

Keep the response bytes exactly as received after HTTP content decoding. Pretty-printing changes the response digest. Each original card input is the exact saved JSON text of a leaf or its `{card, proof}` wrapper. Missing originals remain `UNCHECKABLE`; the checker never reconstructs them from the delivered response. For originals that are present, the checker compares all parsed card fields using the existing serializer and reports the original text's separate byte digest. It does not claim that reserialized card objects are the original HTTP bytes.

The optional delivery input is the existing `csoai.x402.delivery-record/0.1` shape, with `signed:false`, `resource`, `transaction`, `response_sha256` and `response_bytes`. A saved public receipt projection instead places the digest fields inside `delivery`, the resource outside it and the transaction in `txHash`; explicitly map those fields to the record shape before calling. That adaptation does not authenticate the unsigned fields. No payment-receipt verifier is added: signed x402 receipt URLs omit query parameters and cannot establish the selected subject or obligation.

Read the independent scopes:

- `input`: bounded parsing and an explicit caller selection.
- `response.retained_pin`: exact response bytes against an optional caller-retained digest.
- `inventory`: delivered full IDs against the caller's full-ID list.
- `scope`: response and manifest values against caller selection; authentication applies only when the existing manifest signature verifies.
- `manifest.binding`: count, empty/nonempty status, the producer's first 30 shortened identifiers, OSCAL full-ID inventory and observation-only/no-findings contract agree. The shortened list is **not** a full-ID or full-response cryptographic commitment.
- `cards`: saved original signature and delivered/original object comparison separately. `outer_metadata_authenticated` requires both a matching delivered object and a valid whole-card signature.
- `timestamp`: a retained card timestamp and optional age-policy comparison. Payload-only signatures do not authenticate outer `subject` or `as_of`. Even a signed timestamp may describe issuance, publication or a planned recheck, not an observation. Measurement freshness and applicability remain `NOT_ESTABLISHED`.
- `delivery_record`: an unsigned byte/resource/transaction comparison, not proof of receipt or customer acceptance.

There is no global pass, acceptance or suitability verdict. `customer_acceptance` is always `NOT_RECORDED`; payment, root inclusion, current revocation and source truth are not established. Unknown keys, missing originals and unreadable inputs stay unknown. A signature over payload-only content cannot authenticate its outer wrapper.

The existing `cardV0Verify.ts`, `cardVerify.ts` and `cardSign.ts` own the signature and canonicalization rules. Default keys are their source-pinned anchors. An optional second argument `{anchors}` is an explicit caller trust policy, labelled `CALLER_SUPPLIED`; never populate it from the delivered document. Tests use temporary keys and leave production pins unchanged.

Limits: 10,000,000 response bytes, 131,072 bytes per original, 10,000,000 combined original bytes, 256 cards, JSON depth 40 and 100,000 value nodes per parsed document. Duplicate object keys, prototype keys, invalid UTF-8, non-finite numbers and integers outside JavaScript’s safe-integer range are refused. Other numbers remain in the existing JavaScript canonicalization domain; parsed-object equality is not lexical-number or raw-wire equality. Timestamp policy accepts UTC ISO strings with seconds and optional three-digit milliseconds; invalid or unsupported date text remains uncheckable. No default age policy or wall-clock read is applied.

Run the existing test workflow:

```sh
npx vitest run functions/_lib/evidenceBundleCheck.test.ts
```

Local preparation executed the same test bodies through a Node VM adapter because Vitest was unavailable in that environment. Actual Vitest collection, full repository checks and integration remain separate acceptance steps. Synthetic fixtures prove checker behavior; the live 14-card inspection was incomplete and is not presented as verified.
