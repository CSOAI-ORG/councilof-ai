# Defensive Publication — Cryptographically-Signed Assurance Sensing Node

**Disclosure title:** A method and architecture for a low-cost presence-sensing radar node that
cryptographically signs every detection event at the edge and emits machine-verifiable governance
assurance artifacts.

| Field | Value |
|---|---|
| Publisher | MEOK AI Labs / CSOAI Ltd (Companies House 16939677) |
| Inventor | Nick Templeman |
| Publication venue | openpatent.ai (defensive prior-art disclosure) |
| Disclosure date | 2026-07-07 |
| Legal purpose | **Defensive publication.** Placed in the public domain to establish prior art and prevent third parties from patenting the disclosed architecture. This is NOT a patent application. |
| Integrity | SIGIL Ed25519 signature + BFT timestamp receipt (see §7); verify at os.meok.ai `/api/verify` |
| License of the disclosure | CC0 / public domain (defensive intent) |

> **Status note (honesty):** the disclosure describes an architecture and a working design; the
> physical node is at design stage (enclosure STLs complete, firmware parser specified, not yet
> assembled). Simulation and BOM are complete. Nothing herein claims a deployed or certified product.

---

## 1. Field of the disclosure

Edge sensing devices (mmWave presence/tracking radar) and the trustworthy attestation of their
outputs. Specifically: binding each sensor reading to a verifiable cryptographic signature and to
machine-readable governance assurance documents at the point of capture.

## 2. Problem addressed

Commodity mmWave radar modules (24 GHz / 60 GHz) are now extremely cheap and output processed
human-presence/tracking data over a serial link. **None of them attest to the integrity or
provenance of that data.** A downstream consumer cannot tell whether a detection frame is genuine,
was produced by the claimed device, or was tampered with in transit. For assurance, safety, and
regulated-governance use (e.g. EU AI Act placement-on-market evidence, safety-of-the-intended-function
records), an unsigned sensor stream is not admissible evidence.

## 3. Prior art acknowledged (what is NOT claimed as novel)

- The radar sensors themselves — Hi-Link HLK-LD2450 / LD2410, Ai-Thinker RD-03D, Seeed MR60BHA1,
  TI IWR6843 — are existing commercial products. **No claim to the sensor hardware.**
- FMCW mmWave signal processing (e.g. open frameworks such as OpenRadar) is prior art. **No claim.**
- Ed25519 signatures, BFT consensus timestamping, OSCAL, and AI System Cards are individually prior
  art. **No claim to the primitives.**

## 4. What IS disclosed as the novel combination

A **signed assurance sensing node**: the specific architecture that binds edge radar detections to
verifiable governance artifacts at capture time. The novel combination is:

1. **Edge-signed detection frames.** A microcontroller with hardware secure boot (e.g. ESP32-S3)
   parses the sensor's native serial frame into a normalized detection record `{t, targets[{x,y,v}],
   device_id}`, then **signs each record (or each batched window) with a device-held Ed25519 key**
   before it leaves the device. The private key never leaves the secure element.
2. **Verifiable telemetry chain.** Signed records are published to a verifier endpoint
   (os.meok.ai `/api/verify`) that returns `{valid: true/false}` against the device public key —
   giving any consumer independent, offline-checkable proof of origin and integrity.
3. **Governance artifact emission.** The node emits, per device and per firmware build, a
   machine-readable **AI System Card (YAML)** and an **OSCAL assessment** describing its capability,
   limits, and assurance posture — the same evidence format used for software, now emitted by
   hardware.
4. **Tamper-evident physical enclosure** whose antenna aperture is deliberately fabricated in an
   RF-transparent material (plain polymer radome) while the structural body may use conductive
   carbon-fibre-filled polymer, with a tamper-evident cap over the wiring egress.
5. **Care/assurance-floor policy binding (optional).** Detection semantics can be gated by an
   externally-enforced policy (a "care floor" / partnership-charter rule set) that the device
   attests it is running, so a downstream verifier confirms both *what* was sensed and *under which
   governing policy*.

The inventive step is the **binding of low-cost commodity sensing to edge-signed, independently
verifiable governance evidence** — turning an untrusted £5 sensor stream into admissible,
provenance-carrying assurance data.

## 5. Feasibility basis (sensor selection)

The architecture is sensor-agnostic. A feasibility analysis across the commodity ladder (weighted on
software support, integration ease, capability, cost) identifies the two most feasible base sensors —
**HLK-LD2450** (24 GHz, X/Y tracking of 3 targets, ~£4–7, mature community firmware) and
**HLK-LD2410** (24 GHz presence + micro-motion, ~£2–5) — with the **Seeed MR60BHA1** (60 GHz,
breathing + heart-rate) as a premium vitals-sensing variant.

![Sensor feasibility]({{artifact:eb581998-cd70-4f77-915d-44f329259d5c}})

## 6. Reference implementation (disclosed for completeness)

- **Sensor:** HLK-LD2450 (base) or Seeed MR60BHA1 (vitals variant).
- **Compute:** ESP32-S3 with secure boot + flash encryption; device Ed25519 keypair generated in
  secure storage on first boot; public key registered to the verifier.
- **Firmware:** native serial-frame parser → normalized JSON detection record → Ed25519 sign →
  publish. (For the RD-03D, a custom parser of its proprietary binary frame; for LD2450/LD2410,
  existing community parsers apply.)
- **Enclosure:** carbon-fibre-nylon (PA12-CF) structural body; plain-PLA RF-transparent radome over
  the antenna aperture; TPU tamper cap over the cable egress. (Enclosure STLs published alongside.)
- **Assurance outputs:** per-build System Card YAML + OSCAL assessment; per-frame signature verifiable
  at os.meok.ai `/api/verify`.

## 7. Integrity / timestamp block

```
disclosure_sha256: <filled at publication>
sigil_signature:   <Ed25519 signature over the SHA-256, os.meok.ai /api/sign>
bft_receipt:       <consensus timestamp receipt id>
verify:            https://os.meok.ai/api/verify
```
*To finalize: compute SHA-256 of this file, sign via `/api/sign`, record the returned signature and
BFT receipt id here, then publish to openpatent.ai. That act fixes the public prior-art date.*

## 8. Defensive intent statement

This architecture is disclosed publicly and irrevocably to establish prior art as of the disclosure
date. MEOK AI Labs / CSOAI Ltd places the disclosed combination in the public domain to ensure it
remains freely practicable and cannot be exclusively patented by any third party. Trademark, domain
ownership (openpatent.ai), and any registered-rights strategy are handled separately and are not
affected by this defensive publication.
