# Plugin descriptor OTS supersession — 30 September 2026

Two public integration descriptors were corrected on 30 September 2026:
- `public/interop/chatgpt-plugin.json`
- `public/interop/ai-platform-plugins.json`

Their adjacent OpenTimestamps proofs were valid proofs of the PREVIOUS exact bytes. After the JSON files changed, leaving those old proofs beside the new bytes would falsely imply that the new bytes were what had been stamped.

The old target bytes and their original proof files are preserved here together. Their target SHA-256 values are:
- chatgpt-plugin.pre-20260930.json: `9e3e5c5b78fd00a2fbd1a033ea42f563ab25ff2e90f9a9aac96fa6b0fc0e7f1a`
- ai-platform-plugins.pre-20260930.json: `11e3d4399179ce151e4633c3d5df2b1e1b9debf1a684e7ed9591e8780deb6b51`

The current public descriptors are intentionally served without those superseded proof files. A historical proof is evidence of the historical bytes, not the replacement bytes.

Measurement, not certification. No anchor state is inferred for the replacement descriptors.
