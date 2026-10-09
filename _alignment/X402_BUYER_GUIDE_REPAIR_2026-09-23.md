# x402 buyer guide: served defect and isolated repair

Observed 2026-09-23 06:33–06:36 UTC as an anonymous visitor. This is a release candidate, not a deployed page or a sale.

## Reproduction

| Served surface | Observation |
| --- | --- |
| `https://councilof.ai/x402-buyer-guide` | HTTP 200; says 10 resources, free door “no 402”, shows `X-Payment-Address` and other headers that the service does not return, and recommends `/api/wrapper/parity` and `/api/card?subject=USDC`. |
| `https://councilof.ai/.well-known/x402.json` | HTTP 200; 21 resource entries. |
| `https://councilof.ai/api/free-door` | HTTP 402, `Payment-Required` header; offer amount `0`. |
| `https://councilof.ai/api/request-attestation?subject=chainlink` | HTTP 402, `Payment-Required` header; current price and signer state in response. No payment made. |
| `https://councilof.ai/api/wrapper/parity` and `/api/card?subject=USDC` | HTTP 404. |
| `https://councilof.ai/api/wrapper?id=usdc.e:arbitrum` | HTTP 402 and present in live manifest. |

## Candidate

- Isolated branch: `codex/x402-buyer-guide-live-20260923`, based on `pod/master` `101e1bad141e8627186b4019dd602175e1aa1497`.
- Commit: `86cdc77cdd558d6b62066457d190d8e553a36b66`.
- File: `/Users/nicholas/clawd/wt-x402-buyer-guide-live-20260923/public/x402-buyer-guide.html`.
- Candidate SHA-256: `7e1dc3bd2a6178d2056c39bac17320a3ad51ca661d8eb5dc46d593f573c18291`.
- Distribution to existing non-GitHub source lane: pushed the isolated branch to RunPod bare remote `pod` as `refs/heads/codex/x402-buyer-guide-live-20260923`. Remote ref readback returned commit `86cdc77cdd558d6b62066457d190d8e553a36b66`; remote file readback returned the same SHA-256 `7e1dc3bd2a6178d2056c39bac17320a3ad51ca661d8eb5dc46d593f573c18291`. This is source availability, not a merge or public deployment.
- Served page SHA-256 at observation: `151db11a5fc7bcb1412a03f1e515cac396183119f6c9f50dd450777e75222145`.
- Scope: one static HTML file, 32 insertions and 34 deletions; no price, route, signing, payment, or deployment code changed.

The candidate describes the actual zero-amount 402 exchange, points people who do not use a wallet to the free board/root/card index, removes false response headers and stale counts, replaces 404 examples, and links the live catalog. All ten table examples match resource URLs in the served manifest and independently return HTTP 402. The free board, root, signed card index, verifier and payment page return HTTP 200. HTML parse and `git diff --check` passed.

## Release gate

`origin/master` is behind the served `pod/master` API and lacks ten currently served paid population handlers. Do not deploy an output built from `origin/master`: it could remove working doors. A direct Wrangler Pages upload of one file is not a proven one-file patch because a Pages deployment is a bundle. Promote this commit only through a release build based on the current served source, inspect its full route manifest, then read back the buyer-guide bytes and the 21 payment resources anonymously. This work did not deploy or merge.

## Separate claim-copy conflict

The anonymous 402 at `/api/pop/stablecoins` identifies a **frozen 425-asset discovery universe as of 2026-09-16T12:06:54Z**. A newer 427-row upstream capture is a different, unmeasured population and does not replace the frozen measured slice. The same 402 still contains the stale typed `csoai.lid` phrase “22 axes measured”; the live `/api/gspc` totals say 23 axes and 23 measured axes. This is a copy correction for the population-door producer, not a reason to claim 427 stablecoins measured or to change a payment term.
