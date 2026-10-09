# USDC Ethereum second observation — isolated candidate receipt

**24 September 2026, prepared only.** The existing RunPod candidate branch `codex/stablecoin-usdc-evidence-20260924` now contains two dated Ethereum USDC `totalSupply()` observations. The second is commit `1c3080a1278f3b76e90d5c73586af4abb76ebe83`, added after the earlier candidate commit `4170e6cb4ea63a7afdac2cafb457ae3472566f08`.

- Packet: `/workspace/lanes/wt-stablecoin-usdc-20260924/evidence-recovery/stablecoin-usdc-ethereum-20260924/20260924T152636Z/`
- Packet manifest SHA-256: `f951860ef0ed6cd14432e0d21d4d4165600242d60b6b6de6332a935bcc7d25a5`
- Candidate observation SHA-256: `17e814f3c82303efa91bf78385007cef90006542cc845caddd312cd5fff13146`
- Pinned Ethereum block: `26048134`, hash `0x9ba1da4292e4be840aa1cbcc82b8b03af62b21c6606d2aa6c1ecf03eaae86dba`, block time `2026-09-24T15:13:23Z`
- Ethereum contract `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`; reported `totalSupply()` `50095800422.708444` USDC. Two public RPC providers returned matching chain ID, block hash, symbol, decimals, and raw supply.
- Exact 12 request/response pairs are bundled and SHA-256 checked. `python3 .../20260924T152636Z/validate.py` returned `RAW_RPC_ENVELOPES_MATCH` on macOS and RunPod Linux. The earlier candidate's `validate.py` still passes 13 checks.

The issuer page was locally captured and its digest recorded, but its full third-party HTML is not duplicated in the new packet. The packet therefore labels the issuer-page check `NOT_BUNDLED_NOT_INDEPENDENTLY_REPLAYED`. It is **OBSERVED_UNADMITTED**, unsigned, not in a public root, not Bitcoin anchored, and not deployed. It measures one chain contract at one block, not cross-chain circulating supply or reserves. The public readiness view remains **1 measured / 424 unmeasured**. No master commit, Cloudflare deploy, Hugging Face upload, wallet action, or signature was made in this lane.
