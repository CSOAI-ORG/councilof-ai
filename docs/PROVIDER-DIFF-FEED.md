# Provider Document Diff Feed — method, claims, offer

**Status (2 Sep 2026):** built, tested on fixtures, no state committed. GitHub Actions are limited on the account (support ticket #4720908); the first capture happens on the first scheduled run after reinstatement. Nothing is backfilled — a capture is a fact about a time, and we were not watching before then. A local `--dry-run` on 2 Sep 2026 (writes nothing) returned 49 OK, 1 UNCHECKABLE (`openai/terms`: HTTP 403 anti-bot challenge, not bypassed) and 1 UNKNOWN (an OpenAI safety URL that returned 404, since replaced) across the 51 targets; a second pass minutes later from the same address got a 403 challenge on every `openai.com` URL and recorded all six UNCHECKABLE, exiting fail-closed — the intended behaviour, and a fact about that host's bot management, not about the documents. Whether a GitHub-hosted runner is challenged the same way is unknown until the first run.

**Surfaces**

| what | where | cost |
| --- | --- | --- |
| latest state per target + recent diffs | `GET /api/feeds/provider-diff` (filter `?provider=` `?surface=`) and `/feeds/provider-diff/index.json` | free |
| append-only history | `/feeds/provider-diff/state.json` | free |
| every diff leaf and daily summary leaf, unsigned as staged | `/feeds/provider-diff/leaves/` | free |
| the same leaves signed, with inclusion proofs | `/cards/<sha256>.json` → `/root.json` (hourly `public-root.yml`) | free |
| signed historical batch, assembled | `GET /api/feeds/provider-diff?history=1` → 402 (x402; the amount is in the 402 and nowhere else) | metered |
| bespoke per-partner feed (your URLs, same method) | `GET /api/feeds/provider-diff?invoice=gbp&commissioned_by=<org>` → invoice reference; CSOAI LTD invoices in GBP | invoiced |

Verification is free forever. A grade is never sold. There is no grade.

## What is watched

`scripts/watch/targets.json` — 51 public URLs across ten providers (OpenAI, Anthropic, Google, Meta, Mistral AI, xAI, Cohere, DeepSeek, Alibaba Cloud/Qwen, Amazon), each tagged with one of six surfaces: `terms`, `usage_policy`, `model_cards`, `pricing`, `safety_policy`, `art50_marking` (the EU AI Act Article 50 marking / watermark statement — the three located statements are the ones `public/interop/art50-marking-posture-2026-09` already cites). Not every provider has every surface: a surface we could not locate a public page for is simply not listed, which is different from claiming it does not exist. The list is curated, not verified: the first run records each URL's HTTP status, redirect and robots decision, and that record is what says whether a URL was a good choice. Changing a URL is a target-list change and lands by PR; the old target's history stays in the state file (`in_target_list: false`).

## Method

Daily, `.github/workflows/provider-watch.yml` runs `scripts/watch/provider_watch.py`. For each target:

1. **robots.txt** for the host is fetched with our user agent (`csoai-provider-watch/0.1 (+https://councilof.ai/feeds/provider-diff; hash-only change watcher; nicholas@csoai.org)`) and parsed. `disallow` for our agent → the URL is not fetched. Unreadable robots (anything but 200 or 404) → not fetched (fail closed). 404 → allow, by convention. The decision is recorded on every capture.
2. **One GET** with that user agent. No retries, no cookies, no JavaScript, no login, no paywall, no CAPTCHA. Redirects are followed and the final URL recorded. An anti-bot interstitial (`cf-mitigated`, a 403/429/503 from a CDN edge, or the usual challenge phrases in the body) is recorded and left alone.
3. **Stored:** `sha256` of the response bytes, `sha256` of the normalised text, byte length, HTTP status, `etag`, `last-modified`, `content-type`, final URL, `fetched_at`, robots decision, state, reason. **Not stored:** the content. Not one line, not a snippet, not a title. The test suite asserts that fixture text never appears in the state file or any leaf.
4. **Diff** = the normalised sha256 of this capture differs from that of the previous `OK` capture of the same target. A change in raw bytes alone (scripts, nonces, whitespace) is recorded as `BYTES_ONLY` and is not a diff.
5. **Leaves.** One `csoai.diff.provider-terms/0.1` card-v0 `public.notice` leaf per diff, and one `csoai.diff.provider-terms.daily/0.1` summary leaf per run, staged unsigned in `public/feeds/provider-diff/leaves/`. `scripts/adapters/provider_diff.py` hands them to `scripts/publish_public_root.py` under the same validator as every other staged leaf (card-v0, ≤3072-byte canonical payload, `sha256 == sha256(canonical payload)`, no signature, no verdict word). The GHA public-root writer signs under `did:web:csoai.org#board-attestation-1`, or halts. Nothing in the watcher signs.

### Three states (from `CSOAI-ORG/corpus-watch`, where the lesson was learned)

| state | meaning |
| --- | --- |
| `OK` | 200 with a body. Hashed. Diffable. |
| `UNCHECKABLE` | We chose not to fetch or not to trust the bytes: robots disallow, robots unreadable, or an anti-bot challenge. Never bypassed. |
| `UNKNOWN` | We tried and got no usable document: non-200, network error, timeout, empty body. Never reported as unchanged. |

A run where no target is `OK` exits 2 and the workflow fails visibly; the state is still committed so the record shows the outage rather than an all-clear.

### The normaliser — `csoai-norm-v1`, frozen

Input bytes → UTF-8 (replacement on error). If the content type says HTML or the document starts with `<!doctype`/`<html`: drop HTML comments; drop `script`, `style`, `noscript`, `svg`, `template`, `iframe` blocks (build hashes, nonces, analytics ids live there); drop every remaining tag (hidden inputs, `meta`, `link` — CSRF and asset-hash carriers); unescape entities. Any other content type is left as-is. Then NBSP → space, all whitespace collapsed to single spaces, trimmed. **Case is kept** — a case edit in a policy is an edit. The hash is `sha256("csoai-norm-v1" + NUL + text)`: the version string is inside the hash, so a normaliser change is itself a visible change on every target and gets a new version string, never a silent edit of v1.

Known limits, stated: a page whose *visible* text carries a per-request token (a timestamp in the footer, a session id in text) will diff every day. The index flags a target with three or more changes in its last seven recorded events as `churn_suspect`; that flag is a fact about our captures, not about the provider. A JavaScript-rendered page hashes as the server-sent bytes; if the policy text only exists after script execution we see the shell, and the state's `byte_length` will make that obvious.

### What a leaf attests

> the bytes at this URL changed between the two times shown — nothing about what changed or why

Leaf payload fields: `provider`, `surface`, `url`, `prev_sha256`, `new_sha256` (normalised), `prev_bytes_sha256`, `new_bytes_sha256`, `prev_fetched_at`, `fetched_at`, `http_status`, `robots`, `normaliser`, byte lengths, `etag`/`last_modified` pairs, `attests`, `not_a_grade: true`, `writes_board: false`, `content_stored: false`, `state: "PROBED"`. `unmeasured[]` on the card names what is not claimed: what changed, why, whether it matters to anyone. The daily leaf lists which targets were unchanged, changed, uncheckable and unknown, and attests only that two captures compared equal or not.

## What is and is not claimed

- Claimed: at `fetched_at`, a GET of `url` with the stated agent, honouring robots, returned bytes with these hashes. Between two such captures the normalised hash did or did not differ.
- Not claimed: what the document says, what changed, why, whether the change is material, whether any party is bound by it, anything about compliance with anything. No grade, no verdict, no rating. Not a certificate.
- Not claimed: that the URL is the provider's authoritative document. It is the URL we chose to watch; the choice is public and revisable by PR.
- Not claimed: completeness. A provider can publish a change on a page we do not watch.
- Not reproducible retrospectively: nobody, including us, can produce a capture for a date we were not watching. That is the point of the feed and the reason the first run is not backdated.

## The design-partner offer

For one governance or procurement team, insurer or law firm: you name the URLs that matter to you (your vendors' terms, usage policies, model cards, pricing, safety policies and Article 50 marking statements — ours or yours), and we capture them daily on exactly this method — robots honoured, hash-only, three honest states, no content stored — and hand you a signed, timestamped, Merkle-anchored leaf for every change plus a daily summary, delivered to your cadence, with the historical batch assembled on request; everything you receive is independently recomputable from the public leaves, so you pay for the work of watching and the durable independent signature, never for a conclusion, and the fee is a CSOAI LTD invoice in GBP with the amount on the invoice and nowhere on this site.

## Questions for the solicitor (from the 90-day brief, the ones that touch this feed)

1. **Computer Misuse Act 1990.** A single daily GET with a declared user agent, robots.txt honoured, no login, paywall or anti-bot ever bypassed: what residual exposure remains, and does the hash-only design (no content retained or republished) materially reduce it as we believe? Is treating robots.txt as evidence of (non-)authorisation the right posture, and should `UNCHECKABLE` on a challenge page be the end of the matter?
2. **Copyright and the sui generis database right.** We retain no content and republish none — only hashes, lengths, headers and times. Does a daily hash of a page constitute "extraction" or "re-utilisation" of a substantial part? Does the pattern (systematic, repeated, across many pages of one provider) change the answer even when nothing is retained?
3. **Contract / terms of service.** We never sign in, never accept click-through terms; we read pages any browser can read. Where a provider's browsewrap terms purport to forbid automated access, what is our exposure for an unauthenticated GET, and does robots.txt allow/disallow bear on it?
4. **UK GDPR / DPA 2018.** For the public feed we store no third-party payload; a hash of a page that happened to contain personal data is not itself personal data on our reading — please confirm. For a bespoke partner feed where the partner names the URLs, are we controller or processor, and what changes if the partner supplies the content and we attest the hash they show us ("attest what you're shown")?
5. **Description of the artefact.** Can a self-signed Ed25519 leaf with a Merkle inclusion proof, OpenTimestamps and Rekor witness be described as "a timestamped record that bytes at a URL changed" without implying evidential weight we cannot claim (ECA 2000 s.7B vs Civil Evidence Act 1995 s.4), and what wording should the leaf and this page avoid?

## Files

- `scripts/watch/provider_watch.py` — the watcher (stdlib only). `--dry-run`, `--limit N`, `--only <substr>`.
- `scripts/watch/targets.json` — the target list.
- `scripts/watch/test_provider_watch.py` + `fixtures/` — normaliser stability, real-edit detection, robots allow/disallow/unreadable, challenge, non-200, three-run state/leaf/index round trip, cap fitting, adapter skip reasons, no-content invariant. `python3 scripts/watch/test_provider_watch.py`.
- `scripts/adapters/provider_diff.py` — file-reader adapter into the public-root writer (wired in `scripts/publish_public_root.py`).
- `public/feeds/provider-diff/{state.json,index.json,leaves/}` — committed by the workflow.
- `functions/api/feeds/provider-diff.ts` + `.test.ts` — the free API and the two paid doors.
- `functions/api/_skus.ts` — SKU `provider_diff_feed` (`rail: x402-or-invoice`; price atoms are estimates, owner-overridable, never public).
- `.github/workflows/provider-watch.yml` — daily 05:20 UTC + dispatch.
