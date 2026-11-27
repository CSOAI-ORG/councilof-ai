# Article 50: test the delivered output, not just the original

Public technical note — 27 November 2026. Measurement, not certification or legal advice.

The transition in Regulation (EU) 2026/1744 Article 1(39)(b), adding Article 111(4), concerns Article 50(2) marking/detection for relevant systems placed on the market before 2 August 2026. See the [amending regulation](https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng) and [Commission FAQ](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act). Do not generalise this date to all AI systems or transparency duties.

## Production preview replay

On 27 November the public Council preview inspected the original public c2pa-rs test JPEG, a plain PNG control and three derivatives of the signed JPEG made with Pillow 12.3.0 (JPEG quality 90, 50% resize and PNG conversion). All five requests returned HTTP 200 and exact input hashes matched. This is one marked test asset, not five independent marked assets or a provider-specific finding. The original passed assertion hash, hard-binding and leaf-signature checks; chain trust and watermarks were unmeasured.

| Input | C2PA manifest | SHA-256 |
|---|---|---|
| marked-original | DETECTED | `a2d14755db55de67a47c04090340d8266e892367be4104a45626d7a6fa6e9ffd` |
| unmarked-control | NOT_DETECTED | `c5c635a1dbbec9a768c3bb4527dbaea62a1be05efcee17d66799cc07b673b29b` |
| jpeg-q90 | NOT_DETECTED | `5b8dd58fe2c9ee81135db5da9c7fc7048e1e64bdad49f95d9a5b813fbc4a937b` |
| resize-50pct | NOT_DETECTED | `c7aa5a771de3afdd38ae1ae1b3e1c499b385ee7a072d50bd374514077681cb61` |
| png-conversion | NOT_DETECTED | `792541b617e31138843ec9359d5a9be94a5da7126f6bf1927902c56cba4f418b` |

The original fixture and control are in [fixtures/c2pa at the pinned revision](https://github.com/CSOAI-ORG/councilof-ai/tree/ae46c472352307685d167cf1d85d7ebbe41a2d35/fixtures/c2pa). Existing [ProvBench](https://councilof.ai/packs/eu-article-50/) provides a larger separate study with explicit caveats. A NOT_DETECTED result is not proof of absence of all marking. No conclusion about any provider or legal compliance follows.

## Practical next actions

1. Retain the authorised original bytes and associated provenance.
2. Test the actual delivered bytes after each publication or conversion step.
3. Keep manifest detection, claim signature, asset binding, issuer trust and watermark checks distinct.
4. Record gaps, obtain permission for any non-public input, and route consequential unresolved decisions to a suitably qualified human.
5. Re-test after changing a publication pipeline.

[Free marking preview](https://councilof.ai/dashboard/?tab=art50) · [Public evidence pack](https://councilof.ai/packs/eu-article-50/) · [Verification](https://councilof.ai/gspc-verify) · [Human review information](https://councilof.ai/dashboard/?tab=him) · [Contact](https://councilof.ai/contact/). Optional x402 services have separate scoped terms and current payment challenges; free preview is unsigned. Human availability is not implied. No confidential inputs should be submitted to a public demonstration.

## Reproduction and second-device check

Use the pinned fixtures above, Python and Pillow 12.3.0. Decode the signed JPEG; save its RGB pixels as JPEG quality 90, resize to half the original width and height (Pillow default resampling) and save JPEG quality 90, and save the decoded image as PNG. For each file, compute SHA-256 and POST its bytes with the correct image content type to `https://councilof.ai/api/art50/marking-evidence?preview=1`. Compare `measurement.subject.sha256` and `measurement.checked` with the table; retain the full response and observe `signed=false`. The two original control files were separately replayed from a second device and both produced the expected detection and input hash. This is cross-device replay against the same production service, not independent detector validation. The underlying public data may be reused only according to applicable licences.
