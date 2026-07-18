# MEOK Assurance-Radar — Firmware Specification v0.1

**Target:** ESP32-S3 (secure boot v2 + flash encryption) driving an HLK-LD2450 (base) or
Seeed MR60BHA1 (vitals tier). Produces **Ed25519-signed detection frames** verifiable at
os.meok.ai `/api/verify`, plus a per-build System Card + OSCAL emission.

> Status: specification. Not yet flashed to hardware. The signing/verify endpoints are live
> (verified 6/6 earlier); the sensor parser + signing loop below are the work to implement.

---

## 1. Architecture (data path)

```
[radar UART] → parse frame → normalize → sign (Ed25519) → publish → /api/verify
   115200 8N1     per-sensor    JSON record   device key    HTTPS/MQTT   {valid:true}
```

Every stage runs on-device. The private key is generated on first boot inside the ESP32-S3
secure element and **never leaves the chip**. Only the public key is registered to the verifier.

## 2. Sensor parsing

### 2.1 HLK-LD2450 (base — TOP sensor by feasibility)
- UART **256000 baud, 8N1** (LD2450 default; note: NOT 115200).
- Frame: header `AA FF 03 00` … footer `55 CC`; payload carries up to **3 targets**, each 8 bytes:
  `int16 x_mm, int16 y_mm, int16 speed_cm_s, uint16 dist_res`.
- Coordinate sign convention is bit-encoded (MSB flag) — decode per datasheet, don't treat as two's-complement.
- **Community parser exists** (ESPHome / Arduino) — port, don't invent. This is the low-risk path.

### 2.2 Seeed MR60BHA1 (HIGH tier — vitals)
- UART **115200 8N1**, Seeed proprietary TLV frames (SEN0623-style).
- Reports: presence flag, **breathing rate (brpm)**, **heart rate (bpm)**, plus distance.
- Use Seeed's published frame IDs; vitals need a 10–20 s settle window (state in the record).

### 2.3 Ai-Thinker RD-03D (fallback only)
- Proprietary binary frame; **no community ESPHome component** → custom parser (~1 day). Only if LD2450 unavailable.

## 3. Normalized detection record (pre-signing)

```json
{
  "schema": "meok.assurance.radar/v1",
  "device_id": "meok-rad-<48-bit-mac>",
  "fw_build": "<git-sha>",
  "t": 1751905200.123,
  "sensor": "LD2450",
  "targets": [{"id":0,"x_mm":312,"y_mm":1840,"v_cm_s":-12}],
  "vitals": null,
  "policy": "care-floor@0.95"
}
```
- `t` = UTC epoch seconds (NTP-synced; record `time_synced:false` until first sync).
- HIGH tier fills `vitals: {brpm, bpm, confidence}`.
- `policy` names the governing rule set the device attests it is enforcing (care-floor attestation).

## 4. Signing (Ed25519)

- Canonicalize the record (RFC 8785 JCS — sorted keys, no whitespace) → `msg_bytes`.
- `sig = Ed25519_sign(sk_device, msg_bytes)`; emit `{ "record": <obj>, "sig": "<base64>", "pub": "<base64>" }`.
- Sign **per frame** at low rate (≤10 Hz), or **per 1 s window** (batch N records, sign the batch hash) at high rate — batching keeps the signing load and bandwidth bounded.
- Key rotation: device can hold a rotation counter; verifier maps `device_id → active pub key(s)`.

## 5. Publish + verify

- Transport: HTTPS POST to `os.meok.ai/api/verify` (demo) or MQTT-over-TLS to a collector that forwards.
- Verifier returns `{ "valid": true|false, "device_id": ..., "checked_at": ... }`.
- On network loss: buffer signed records to flash ring-buffer; flush on reconnect (signatures stay valid — they're time-stamped in-record).

## 6. Governance artifact emission (per build)

- **System Card (YAML):** capability, sensor, FoV/range, false-alarm characteristics, intended use
  (assurance/presence — NOT targeting), limits, contact. Emitted once per firmware build, signed.
- **OSCAL assessment:** maps the device's controls (secure boot, signed telemetry, tamper cap) to
  the assessment schema so it drops into the CSOAI governance stack.

## 7. Security posture

| Control | Mechanism |
|---|---|
| Firmware integrity | ESP32-S3 secure boot v2 (signed bootloader + app) |
| Key confidentiality | Ed25519 private key in encrypted flash / eFuse; never exported |
| Data provenance | per-frame / per-window Ed25519 signature |
| Tamper evidence | TPU cap over cable egress + enclosure open-detect (optional GPIO) |
| Replay resistance | monotonic `t` + optional per-device nonce counter in record |

## 8. Implementation plan (order)

1. Port the LD2450 community parser onto ESP32-S3; print normalized JSON over serial. *(low risk)*
2. Add Ed25519 keygen-on-first-boot + JCS canonicalization + sign. Verify locally with the public key.
3. Wire `/api/verify` round-trip; show `{valid:true}` on a detection. *(the demo moment)*
4. Emit System Card YAML + OSCAL at build; sign and publish once.
5. HIGH tier: swap parser to MR60BHA1, add vitals fields + settle-window logic.

## 9. Open items (must confirm before flashing)

- LD2450 exact baud on your stock units (256000 default, but some clones ship 115200).
- Whether the demo verifier accepts per-window batched signatures or requires per-frame.
- MR60BHA1 frame IDs for the firmware you receive (Seeed has revised them across board revs).
