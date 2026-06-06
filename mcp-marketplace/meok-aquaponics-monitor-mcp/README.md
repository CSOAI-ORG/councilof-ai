<div align="center">

# MEOK Aquaponics Monitor MCP

**Unified sensor + actuator schema for aquaculture, aquaponics, and koi systems**

[![PyPI](https://img.shields.io/pypi/v/meok-aquaponics-monitor-mcp)](https://pypi.org/project/meok-aquaponics-monitor-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MEOK AI Labs](https://img.shields.io/badge/MEOK_AI_Labs-MCP_Server-purple)](https://meok.ai)

</div>

## Why this exists

Every aquaculture monitoring product on the market today picks one hardware family and locks you in: Bluelab cloud-only, Edenic, GHL ProfiLux web API, Atlas Scientific raw I²C, Seneye USB. There is no single SaaS layer that lets a UK trout farm, a hobbyist aquaponic grower, and a high-end koi keeper read their water chemistry through one API — and certainly none that gates every reading against the welfare safe-range for the species in the tank, or routes any actuation through a care membrane before firing a peristaltic pump at live animals.

This MCP is that layer. It is the software side of the **MEOK PondSense** open hardware kit (fork of the OSHWA-certified Whitebox Labs Tentacle T1 MkII baseboard, PA12-CF printed IP67 enclosure on Qidi Max4, optional RPi5 or ESP32-S3 compute, CSOAI stamp).

## Tools

| Tool | Description |
|------|-------------|
| `list_supported_hardware` | Vendor matrix — Atlas Scientific, Whitebox Tentacle, Seneye, GHL ProfiLux, Bluelab, DFRobot. |
| `register_rig` | One-time registration of a sensor rig + species + probes installed. |
| `report_readings` | Push readings; per-parameter status against species safe-range; welfare alerts; signed attestation fingerprint. |
| `safe_range_check` | Stateless: check arbitrary readings against any supported species. |
| `species_catalogue` | List supported species + their welfare safe-range library (RSPCA / WOAH / Stirling OWI derived). |
| `dose_actuator` | Record actuation INTENT (dose pump volume + reason); care-gated by default — routes through SOV3 attestation API before firing. |
| `rig_status` | Last-known state for a registered rig. |

## Installation

```bash
pip install meok-aquaponics-monitor-mcp
```

## Supported species

`rainbow_trout`, `atlantic_salmon_smolt`, `koi`, `tilapia`, `aquaponic_lettuce_companion`, `tropical_community`. Each carries pH / DO / NH3-N / NO2-N / NO3-N / temp / EC / alkalinity safe-ranges sourced from RSPCA Assured, WOAH Aquatic Code, and the Stirling Institute of Aquaculture welfare-indicator toolboxes.

## MEOK PondSense — open-hardware kit

Baseboard fork: [Whitebox Labs Tentacle T1 MkII](https://github.com/whitebox-labs/tentacle) (OSHWA-certified UID CH000003, KiCad public, CC-BY-SA-4.0).

- 4× Atlas Scientific EZO carrier (pH, DO, EC, RTD-temp standard; optional NH3, turbidity, ORP, peristaltic doser)
- Compute: RPi5 or ESP32-S3 (two SKUs)
- Enclosure: PA12-CF printed on Qidi Max4, IP67 gasket, CSOAI stamp 10 mm
- Firmware: ships pre-flashed with this MCP and a care-membrane subscriber
- BoM: £180-£280 hobby / £450-£550 assembled pro with 1yr Pro subscription
- Licence: CERN-OHL-S-2.0 hardware, MIT firmware, AGPL-3.0 MCP

## Pricing

| Tier | Price | What you get |
|------|-------|--------------|
| Hobbyist | £29/mo | 60 calls/hour. 1 rig. Safe-range check + intent attestation. |
| Pro | £79/mo | Unlimited. Multi-rig. Dose actuator hook + welfare-alert webhooks. |
| Enterprise | Custom | Pro + private SOV3 deployment + fleet management. |

[Subscribe — £29/mo Hobby](https://buy.stripe.com/aFa28t80k9ACdMF1Uc8k90D)

## License

MIT © MEOK AI Labs

<!-- meok-moat-footer-v1 -->
---

## Pairs with MEOK Aquaculture Suite

- **meok-rspca-aquaculture-mcp** (£499/mo) — RSPCA Assured trout + salmon welfare moat.
- **meok-uk-fhi-mcp** (£79/mo) — CEFAS + APHA + EA permit stack.
- **meok-asc-rspca-crosswalk-mcp** (£999/mo) — one audit pack for ASC + RSPCA + GlobalG.A.P.
- **meok-laia-aquatic-mcp** (£29/mo) — England Animal Activities Licensing for ornamental/koi retailers.
- **meok-koikeeper-ai-mcp** (consumer) — koi-specific companion for koikeeper.ai users.

→ Full catalogue: [meok.ai/aquaponics](https://meok.ai/aquaponics)

<!-- BUY-LADDER:START -->

## Get started

- **Free** — 60 calls/hour, no card. Safe-range checks + intent attestation.
- **Hobby £29/mo** → **[Subscribe](https://buy.stripe.com/aFa28t80k9ACdMF1Uc8k90D)** · **Pro £79/mo** (multi-rig + care-gated actuation) → **[Subscribe](https://buy.stripe.com/00w28tgwQ6oq9wpcyQ8k90E)**
- **Not ready to subscribe?** 30-min review of your sensor/welfare setup — [book a call](mailto:nicholas@meok.ai?subject=Aquaponics%20monitor%20review)

Verify any signed attestation at <https://meok.ai/verify>.

<!-- BUY-LADDER:END -->

