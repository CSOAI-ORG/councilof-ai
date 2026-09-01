# AX — agent-native CouncilOS — 1 Sep 2026

**Status:** leftover honesty land. Doctrine + living-GET lock.  
**Board:** stays **22 · 15 · 7** from living `GET /api/gspc`. Empty stays empty. No fill. No new products. No certify.

## Thesis

CouncilOS is **agent-native**. Agents are first-class clients of the **same living GETs** humans use:

| Living GET | Role |
|---|---|
| `GET /api/gspc` | Board authority — 22 axis · 15 MEASURED · 7 empty |
| `GET /root.json` | Living root-as-index (card-v0 leaves) |
| `GET /api/xrpl` | Reader of that root (`writes_board: false`) |

Human UI is a **thin presentation** over those GETs — never a second source of truth, never a second board, never a fixture that pretends to be live.

## Six arms only

`board · verify · cards · space · assess · harness`  
(see `client/src/components/os/doors.ts`). **Do not invent a 7th arm.**

**AG-UI** is presentation of the same envelope / same living GETs. It is **not** a seventh evidence atom.

Live GSPC inside AG-UI streams:

- Client helper: `client/src/lib/aguiGspcStream.ts`
- Local SSE: `GET /api/agui/gspc-state` → `STATE_DELTA` + `TEXT_MESSAGE_CONTENT` from living `/api/gspc`
- Empty axes listed. Accuracy stays `null` when the wire publishes none. No invented scores.

## COBOL Bridge is ours

Canonical sidecar: [`CSOAI-ORG/cobol-bridge-mcp`](https://github.com/CSOAI-ORG/cobol-bridge-mcp).  
Pointer: `docs/COBOL-BRIDGE-SPEC.md`. Surface `cobol.legacy` shares the **same** public root — it does **not** fill empty GSPC axes or stamp MEASURED.  
**Kill** any CSGA / competitor framing. Cobalt stays leave-alone (different product).

## W3C Agent Conformance Community Group

**Draft opening only.** Nick joins the CG; this repo may cite the draft work as a **crosswalk / measurement-credential** frame.

| Do | Do not |
|---|---|
| Cite W3C Agent Conformance CG as draft / informative | Claim endorsement, affiliation, or "we conform" |
| Treat outputs as **measurement credentials** | Claim certification, notified-body status, or CG approval |
| Hold membership click for Nick | Invent partnership language |

## Locks

1. Board **22 · 15 · 7** — no fill empty.  
2. Six arms only — AG-UI ≠ 7th.  
3. Same living GETs for agents and humans.  
4. COBOL Bridge = ours (`cobol-bridge-mcp`).  
5. Measurement credential, never certification.  
6. No wrangler / Cloud Agents / `BOARD_SIGN_KEY` from this leftover.

*CEO leftover honesty. Europe/London. 1 Sep 2026. Sit NAMED — CEO merges.*
