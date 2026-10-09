# CSOAI public-core publication and SAFE reply receipt

Date: 21 September 2026

## Public repositories

Two clean repositories on the new `CouncilofAI-CSOAI` account were checked through GitHub's anonymous API and raw-content host.

| Repository | Visibility | Current commit | Root files | Readback |
|---|---|---|---|---|
| https://github.com/CouncilofAI-CSOAI/CouncilofAI-CSOAI | Public | `a765281d435f606a13cfd31e83e204906230ab4c` | `README.md`, `PUBLIC_ENDPOINTS.json` | Both raw files returned HTTP 200. |
| https://github.com/CouncilofAI-CSOAI/csoai-public-evidence | Public | `00e513dc82ed8c2a7cb5b7300459a325391bc51c` | `LICENSE`, `README.md`, `PUBLIC_ENDPOINTS.json`, `STATUS.md` | All raw files returned HTTP 200. |

The repositories contain only the approved public entry-point material and retain the measurement-not-certification boundary. The public API reports `private: false` for both repositories.

The endpoint manifest contains seven independently checked live routes:

1. https://councilof.ai/
2. https://councilof.ai/dashboard/?tab=board
3. https://councilof.ai/api/gspc
4. https://councilof.ai/gspc-verify
5. https://councilof.ai/mcp
6. https://councilof.ai/.well-known/agent-card.json
7. https://councilof.ai/claims-register/

The live GSPC API reported 23 axes, with 22 carrying a measurement and one declared but unmeasured slot. The pinned SAFE note is public at the referenced Hugging Face commit and its raw SHA-256 remains `2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4`; it is explicitly unsigned.

## SAFE reply

A nonblank reply was sent from `nicholas@csoai.org` to Mike Woster, with Candy Tan and Stephano Cetola copied:

- Subject: `Re: Open Secure AI Alliance — membership agreement and RFC review`
- Sent-folder readback time: 21 September 2026, 5:46 PM local time
- The sent copy was opened and checked for its complete body, recipient fields, and working pinned Hugging Face link.

This establishes successful submission to the outgoing mail system and a readable Sent copy. It does not establish delivery, reading, working-group routing, acceptance, or adoption.

## RFC duplicate decision

No duplicate GitHub comment was posted. During the final live check, the SAFE issue received an updated author comment at https://github.com/OpenSecureAIAlliance/RFCs/issues/6#issuecomment-5764077638, linking to the public execution-coverage vectors commit https://github.com/AgentAvow/AgentAvow/commit/f42f937c736c595944b1bcea0c5c3132c776b1e1. Its execution/coverage separation overlaps the planned narrow comment. Sending a duplicate would have added noise. The email therefore provides CSOAI's narrow, version-pinned discussion contribution without claiming it is accepted or submitted through the issue tracker.
