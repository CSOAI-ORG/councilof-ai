# CSOAI IndexNow receipt — 23 September 2026

Observed at: 2026-09-23T05:25:28Z.

One changed, public page was submitted: <https://councilof.ai/gspc-verify/>. Its sitemap entry has `lastmod=2026-09-23`; anonymous readback returned HTTP 200 at that exact URL, with `23 axis` and `23 measured` in the served HTML. The live board API independently returned `axes=23`, `measured_axes=23`, `unmeasured_axes=0` after submission.

The public RSS feed at <https://councilof.ai/api/feed.xml> has a live item titled `GSPC board: 23 axis · 23 measured — live` linking to `/api/gspc`; it does not link to `/gspc-verify/`. Its served Atom self-link still says `/feed.xml` even when fetched at `/api/feed.xml`. That self-link is a separate site correction, not proof that the submitted verifier page was indexed.

The established IndexNow ownership key file at `https://councilof.ai/97a1aa3163534fae954108d8941eb361.txt` returned the exact key text before submission. Only the one URL above was sent; the `/gspc` URL was excluded because it redirects to a 404.

| Endpoint | Response | Meaning |
| --- | --- | --- |
| `https://api.indexnow.org/indexnow` | HTTP 200, empty body | Submission received |
| `https://yandex.com/indexnow` | HTTP 200, `{"success":true}` | Submission received |

This records crawler notification, not confirmed indexing, ranking, impressions, clicks, independent use or revenue. No site deploy, listing claim, payment, or email occurred in this action.

Other discovery readback at this time: `https://x402-list.com/api/v1/services/council-of-ai` and `/council-of-ai-gspc` already list Council services, both online and payment-ready, with five and two probed endpoints respectively; both report `verified=false`. No duplicate listing was submitted. Line 25 of the Hugging Face `csoai/gspc-board` Space README still says “The first is the canonical 22-axis board.” The available Hugging Face token failed account validation (`hf auth whoami` returned `Invalid user token`), so that external text was not edited. It needs a valid token with write access to the `csoai` Space, followed by an exact-line edit and anonymous readback; the 23/23 figure should remain live-derived, not hardcoded into that README.
