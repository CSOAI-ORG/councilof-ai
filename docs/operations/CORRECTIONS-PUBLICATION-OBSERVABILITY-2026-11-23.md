# Correction publication timestamps: deploy readback and independent time evidence
*23 November 2026 — source-quality fix, not legal certification or a public-root mutation.*

## Root cause

The corrections source already has \`detected_at\`, \`published_at\`, optional \`detected_window\`, and
\`timing_evidence\`. **90 of 97 correction entries still say \`published_at: UNRECORDED\`**, and
51 say detection was not recorded. Some correction statuses are prose, and the list is not guaranteed
sorted newest-first (five observed date-order inversions). The old
\`scripts/corrections_latency.py\` had an obsolete "only one date" description and returned
UNMEASURED for every entry despite the expanded schema.

The 23 Nov live reader independently verified against \`did:web:csoai.org#board-attestation-1\`:
\`VALID; 97 correction rows; source body content_id
cabc99524da2b43ead7b1eca23d2ac40b9e2fb8d6533a609e998596a8fe6ae36\`.
The first public-observation time was **2026-11-23T01:02:28Z**; readback receipt SHA-256
\`63161ff111247b281e929a7a974e56a239436b6f9c0673e2a22540c8b4f20838\`.
This does **not** mean all 97 corrections were first published on that date.

## Independent timing facts

The live source declares **2 exact intervals**, **5 date/window upper bounds**, and **90 unmeasured**.
Our independent arithmetic reproduces those counts. The two exact intervals are 4,600 seconds
and 294,635 seconds. The mathematically conventional median is **149,617.5 seconds**.
The old API chose \`exact[floor(n/2)]\` (294,635 seconds, the upper of two observations)
rather than the midpoint. \`functions/api/corrections.ts\` is corrected to use the midpoint for
even \`n\`; explicit tests prohibit regression.

The exact durations are *source-declared detection-to-publication*, not independently established
defect-introduction-to-fix latency or external evidence of remedial effects.

## Signature, root, witnesses, OTel and times are different

| Observation | Evidence needed | Can fill source \`published_at\`? |
| --- | --- | --- |
| Git commit recorded | Git object, parent, author/committer signature/time | No, deployment can be later |
| Source signature | Existing DID-verified Ed25519 on the correction ledger body | No, proves bytes/key consistency |
| Merkle-root inclusion | Independently checked leaf-to-root inclusion path, exact digest and root scope | Not alone |
| OTS/Bitcoin or Sigstore/Rekor | Independently verified anchor for **that included root**, log inclusion and time bound | Only a bounded *existence-before* time, not an exact deployment time |
| OTel log record | Clocked service-side observed event; its transport and source authenticated | No, unless separately bound to actual publication |
| Cloudflare deployment + public readback | Protected-master deployment run, candidate source/digest, publicly served exact bytes and independent observer | Can establish a defensible publication *window*; exact \`published_at\` only with credible first-hand proof |

The origin owner already has OTS/Sigstore/root infrastructure, but none of that may be silently
promoted into per-row public-serving timestamps. A cryptographic stamp of a historical artifact can
establish existence before the stamp while offering no assurance it was publicly visible.

## Implemented safe release pipeline

\`.github/workflows/corrections-public-observer.yml\` triggers after **successful protected-master
site deploys** (or explicit manual dispatch) and never receives a write credential:

1. Fetch public \`/api/corrections\` with no-cache request headers.
2. Run the **existing** \`scripts/verify_corrections_signature.py\` on that exact captured
   response against \`csoai.org/.well-known/did.json\`; fail closed unless DID key/content digest/
   Ed25519 all agree.
3. Run \`scripts/corrections_publication_observer.py\` to emit aggregate per-correction
   digests, the actual observer clock time, stable correction list digest, and deployment workflow
   *candidate* SHA, with \`deployed_bytes_mapped_to_trigger_commit: false\` until that binding
   has separate proof.
4. Emit an OpenTelemetry-compatible OTLP JSON log as a **local artifact**, not a transmitted
   collector event or signed grade.
5. Run the monorepo publication/privacy gate on **exactly** the two outgoing files and retain
   those files as a GitHub Actions artifact for 90 days.

Neither observer nor script overwrites source \`published_at\` fields or claims that the first
observation is the first publication. Missing dates remain \`UNRECORDED\`. It does not publish
personal data, contact external parties, call AI models, sign roots or execute payment flows.

The before/after public-receipt series is a prerequisite for a future per-correction inclusion
proof. To build that next: capture a source commit and deployment event, record the exact published
body digest under a signed/rooted manifest, capture an independently verified public GET, then
compute a conservative publication interval rather than treating an anchor timestamp as a deploy.

## Acceptance / reproduction

\`\`\`sh
python3 -m unittest -v scripts/test_corrections_publication_observer.py
python3 -m unittest -v scripts/test_corrections_latency.py
# Against a previously saved public response:
python3 scripts/verify_corrections_signature.py --file saved.json --out verified.json
python3 scripts/corrections_publication_observer.py \
  --response saved.json --signature-check verified.json \
  --out public-readback.json --otlp-out public-otlp.json
python3 scripts/corrections_latency.py --file saved.json
\`\`\`

Run the full repo tests and protected PR gates before merge. After the protected master deploy,
verify the **actual public endpoint** and completed post-deploy observer run, and compare any
future source median with the corrected conventional median. A green workflow is not a declaration
that any earlier missing timestamp was recovered.
