# CSOAI IndexNow receipt — 21 September 2026

Observed at: 2026-09-21T11:26:46Z

## Submitted batch

The existing `scripts/monitoring/indexnow-submit.sh` submitted these seven public URLs:

- `https://councilof.ai/`
- `https://councilof.ai/api/gspc`
- `https://councilof.ai/llms.txt`
- `https://councilof.ai/feed.xml`
- `https://councilof.ai/sitemap.xml`
- `https://councilof.ai/gspc-verify`
- `https://councilof.ai/root.json`

Key file readback before/after the request: `https://councilof.ai/97a1aa3163534fae954108d8941eb361.txt` returned HTTP 200 and exact key text.

## Endpoint outcome

- `https://api.indexnow.org/indexnow`: request completed successfully at the transport layer; the legacy shell script did not capture HTTP status or response body, so it is not counted as an accepted submission.
- `https://yandex.com/indexnow`: returned `{"success":true}`.

This records crawler notification only. It does not establish indexed pages, rankings, traffic, citation, use, adoption, or revenue.

## Follow-up verification

A non-mutating production sweep of `https://councilof.ai/sitemap.xml` then found 552 unique URLs and 552 direct HTTP 200 responses. The IndexNow key was served correctly. The sweep was dry-run only and did not submit the 552 URLs; do not re-ping without a material public URL change.
