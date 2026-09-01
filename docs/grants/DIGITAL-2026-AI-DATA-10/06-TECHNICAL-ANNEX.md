# Technical annex (two pages, draft)

Named repos and live URLs only. No invented features. Measurement, not certification.

## 1. GSPC architecture

Council of AI (CSOAI Ltd) publishes a **signed measurement board**.

- Live: `GET https://councilof.ai/api/gspc` — schema `csoai.gspc-axes/0.5`. **22 slots · 15 MEASURED · 7 UNMEASURED.** Stamp `did:web:csoai.org#board-attestation-1`.
- Cards: `https://councilof.ai/signed/cards/<id>.json`. Kind `gspc.measurement-card`. Verify: `https://councilof.ai/gspc-verify`.
- Preimage (**not RFC 8785**): `json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)` — `public/signed/HOW-TO-VERIFY.md`. Floats render `0.0`.
- Repo: `CSOAI-ORG/councilof-ai` (`client/`, `public/signed/`, `tools/verify_any_card.py`).
- Index: `CSOAI-ORG/council-os` `registry/spine.json` (binds organs; **stale** on jail vs live TIE — quote the API).

Empty financial cells stay empty on the card. A grant pilot does not fill them.

## 2. Ed25519 verification

- Card key: `did:web:csoai.org#card-attestation-1` in `https://csoai.org/.well-known/did.json`.
- Board key: `#board-attestation-1`. **Different canonicalisation** (ensure_ascii=False, ES6 Number::toString). Mixing rules → false INVALID.
- CI path: `CSOAI-ORG/action-verify-attestation`.
- MCP: four tools only — `board_totals`, `get_axis`, `verify_card`, `list_cards` at `https://councilof.ai/mcp` (`csoai-gspc-mcp`). Fail closed if stamp missing.

HMAC MEOK “attestations” are a **different product**. Not this annex.

## 3. MCP / router

- Live instrument: `/mcp` (four tools).
- Catalogue (not cloned into the grant): `CSOAI-ORG/agent-mcp-router-mcp`, `CSOAI-ORG/eu-ai-act-compliance-mcp` (**corpus**; ignore PAYG/HMAC sales copy), `CSOAI-ORG/csoai-c2pa-durable-mcp` (one Art 50 path).
- Do not bid six watermark forks.

## 4. Front door (AG-UI / OS)

- `client/src/pages/OsLauncher.tsx`, `AgUiBridge.tsx`, `/os`. Named panes: board, verify, cards, embed.
- Spray: `/embed`, `/badge`, `/licensing-agreement`. Partners host **our** 3kb glass; optional attachments call **their** verifier.
- Isolation **cage**: no product named OpenShell in `councilof-ai` or `council-os`. Do not write it into Part B until a repo SHA exists.

## 5. TRACE / SCITT alignment (honest)

- SCITT: RFC 9943 architecture. We have **pyscitt pin**, no TS. Future work: `POST /entries` over **existing card bytes**.
- TRACE (if meaning ETSI continuous audit): **not implemented**. Name as Fraunhofer/ETSI **target**, not a CSOAI deliverable today.
- Time: OpenTimestamps client pin; **no** stranger-verifiable `.ots` yet (`tsa.status: err`). Tiago’s rail is the intended fix — OTS on `content_id`, not XRPL.

## 6. Article 50 tooling

- Pages: `/article-50`, `/packs/eu-article-50`.
- Canonical MCP: `csoai-c2pa-durable-mcp`. Bindings: `c2pa-python==0.37.8` (Apache-2.0/MIT). HMAC watermark MCPs archived from the story.
- A card of **our scanner run** is measurement of **our** instrument, not “the bank is Art 50 certified.”

## 7. Pilot shape (if coordinator accepts sector fit)

Public chatbot → Art 50 disclosure pack (one C2PA path) → signed card of the **run** → board still shows UNMEASURED finance. Prefer healthcare/energy chatbot to match the fiche sector list.
