# Council OS human and MCP readback — 1 October 2026

Observed on the anonymous public site at 13:02–13:05 UTC. This is a read-only acceptance check, not a release or a claim of A2A/MEOK routing.

| Journey | Public entry | Observed result |
| --- | --- | --- |
| Human asks “What does the board say?” | `https://councilof.ai/dashboard/?tab=home` | Ask used `board_totals`, cited `/api/gspc`, and returned 23 declared and measured axes, 0 separated of 14 model-comparison axes, 7 ties and 7 untested. The result displayed a tool call, dated source and receipt. |
| Agent calls the same read-only tool | `POST https://councilof.ai/mcp`, JSON-RPC `tools/call` with `name: board_totals` | SSE `structuredContent` reported `LIVE`, `reachable: true`, the same 23/23, 0/14, 7/7 counts and source `/api/gspc`; returned at 13:02:45 UTC. |
| Human verifies a sample card | `https://councilof.ai/gspc-verify/?card=/signed/cards/82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c.json` | The linked 821-byte card loaded unaltered and the in-browser verifier returned `VALID` for its content ID and Ed25519 signature. The page explicitly says this does not certify safety, compliance, current board admission or quotability. |
| Human checks public-root mode | Same verifier, “Public-root catalogue” tab | Loaded `/root.json` dated 2026-09-30T05:05:34Z with 319 leaves; the root-envelope Ed25519 check returned `VALID`. The `/api/xrpl` reader reported 14/16 leaves carrying `sig_ed25519`, with EURQ/USDQ unsigned. This did not test an individual inclusion proof or turn root inclusion into a leaf signature. |
| Agent discovers the A2A card | `GET https://councilof.ai/.well-known/agent-card.json` | `curl` received 200, 18,702 bytes, `application/a2a+json`, agent name “Council of AI — Measurement Agent”, 12 advertised skills and a JSON-RPC 1.0 interface at `/api/a2a`. A Python `urllib` client, and `curl` with `User-Agent: Python-urllib/3.14`, received 403 `error code: 1010` instead. This is a machine-client access defect; the advertised A2A skills were not invoked in this check. |

The historical sample card's own body says “13 measured of 14 quotable” from August. That is part of the signed historical record, not today's board total or an endorsement. Keep its current-admission caveat visible.

UX fix prepared: the dashboard header presents “Corpus 3” even though the source identifies that selection as “Signed card index.” Review branch `review/codex-corpus-label-ready-20261001` at `5d3077af1d6a300616b5587b38a6138d3eb521b4` changes the visible label to the plain-language name and removes the redundant screen-reader copy. It changes one file (1 insertion, 2 deletions) on canonical master `f4e63746c4a4e7f305ac555179faa8bcd2da759f`; `git diff --check` passed. This is a source-only wording fix, not a corpus-count change; build and release gates remain outstanding.

Open access issue: the A2A well-known card is anonymous and readable by `curl`, but Cloudflare's 1010 block catches a default Python client on both `councilof.ai` and `csoai.org`. Scope any exception to `GET /.well-known/agent-card.json` and this specific client class; keep the other protections active, and test anonymous Python and curl readback on both hosts after a gated rule change. A 200 for one user agent is not proof of general agent discovery.

Release state: no new build, preview, land or production deployment was observed as part of this readback. `review/codex-release-unblock-20261001` remains a prepared branch pending the build-pod gate. Keep the dirty shared writer checkout untouched and use the isolated gated release path.
