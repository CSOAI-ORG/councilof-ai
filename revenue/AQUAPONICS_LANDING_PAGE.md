---
title: "Aquaponics + open-hardware monitoring — welfare-first, kit-ready, MCP-native"
description: "Iron Ox, Plenty, Bowery and 14 other vertical farms have gone bankrupt. The compliance + welfare layer they never built is the moat. MEOK PondSense + monitor MCP + welfare attestation, from £29/mo + £180 open hardware kit."
canonical: https://meok.ai/aquaponics
schema:
  type: Service
  provider: MEOK AI Labs
  serviceType: Aquaponics Monitoring + Open Hardware
---

# The vacuum is real. We're filling it with welfare.

## What's left after the crash

In 2025 alone, **14 indoor / vertical farms went bankrupt** — Plenty (Ch11, March 2025, $940M raised), Bowery (shut Nov 2024, $700M), AeroFarms Virginia (Dec 2025), AppHarvest (2023), Upward Farms (2023), Iron Ox (dead). Total capital incinerated: **~$1.37bn**.

What did they all share? Heavy hardware. Heavier opex. And **zero compliance or welfare layer** to differentiate the produce or the fish.

What's left are the small-operator aquaponic growers, RAS smolt sites, koi keepers, and ornamental retailers who were always the real market — not the venture-scale "vertical farms-as-tech" thesis. They need monitoring. They need welfare evidence. They need compliance. **They don't need another £100M warehouse.**

## What MEOK gives you

### `meok-aquaponics-monitor` MCP — £29-£79/mo

One uniform API across the hardware ecosystem you're already running:

- **Atlas Scientific EZO** — pH, DO, EC, ORP, RTD, NH3, NO3, CO2 (I²C/UART/RS-485)
- **Whitebox Labs Tentacle T1 MkII** — OSHWA-certified baseboard for 4× EZO
- **Seneye USB** — consumer aquarium monitoring
- **GHL ProfiLux** — premium koi / marine (Modbus + web API)
- **Bluelab Edenic** — via Home Assistant bridge
- **DFRobot Gravity** — analog hobbyist probes

Every reading is gated against the **species welfare safe-range**: rainbow trout, Atlantic salmon smolt, koi, tilapia, aquaponic-lettuce-companion, tropical community. Out-of-range readings auto-escalate to a welfare alert.

Every actuation (peristaltic doser, fresh-water exchange, feed switch) is **care-gated** — routed through the SOV3 care membrane before firing on live animals.

### MEOK PondSense v1.0 — open-hardware kit

- **Baseboard:** fork of Whitebox Labs Tentacle T1 MkII (OSHWA UID CH000003, CC-BY-SA-4.0). KiCad public.
- **Probes:** 4× Atlas EZO standard (pH, DO, EC, RTD-temp). Optional NH3, ORP, turbidity, peristaltic doser.
- **Compute:** RPi5 or ESP32-S3 (two SKUs).
- **Enclosure:** PA12-CF printed on Qidi Max4, IP67 gasket, CSOAI stamp 10 mm raised.
- **Firmware:** ships pre-flashed with `meok-aquaponics-monitor-mcp` + care-membrane subscriber.
- **BoM:** £180-£280 hobby / £450-£550 assembled pro **with 1yr Pro subscription bundled**.
- **Licences:** CERN-OHL-S-2.0 hardware / MIT firmware / AGPL-3.0 MCP.

### `meok-laia-aquatic` MCP — £29/mo

If you sell live fish — koi, ornamentals, anything — you need an Animal Activities Licence under LAIA 2018. Local-authority inspector applies the 7-point welfare checklist. MEOK gives you a self-audit, indicative star rating, and inspector-ready markdown pack.

### `meok-koikeeper-ai` MCP — £7.99-£19.99/mo

Powers [koikeeper.ai](https://koikeeper.ai). Variety database (Kohaku, Sanke, Showa, Tancho, Asagi, Shusui, all Gosanke + secondary), pond stocking calc, koi-specific diseases including **KHV (notifiable under AAHR 2009)** and Carp Edema Virus, seasonal temperature-gated feeding, UK winter-prep checklist.

### `meok-fishkeeper-ai` MCP — £4.99/mo

Powers [fishkeeper.ai](https://fishkeeper.ai). Water analysis, species identification, compatibility checking, disease diagnosis, stocking calculations, feeding schedules. 11+ species DB, 6 disease DB.

## How it threads together

```
   Hardware                  MCP layer                Trust layer
   ────────                  ─────────                ──────────
   Atlas EZO  ───┐
   Tentacle T1   ├──── meok-aquaponics-monitor ─── meok-attestation-api
   Seneye USB    │                                   │
   GHL ProfiLux  │                                   ▼
                 │     meok-fish-welfare           SOV3 care membrane
                 │     meok-laia-aquatic                │
                 │     meok-rspca-aquaculture           ▼
                 │                              Welfare attestation
                 │                              verifiable at meok.ai/verify
                 ▼
        fishkeeper.ai / koikeeper.ai
        (Lovable + Supabase Saas apps)
```

## Bundle pricing

| Bundle | Price | What's in it |
|--------|-------|--------------|
| Hobby | **£29/mo** | Monitor (1 rig) + LAIA + KoiKeeper Pro |
| Pro | **£79/mo** | Monitor (multi-rig) + LAIA + FishKeeper + KoiKeeper Premium |
| Small Farm | **£579/mo** | Pro + RSPCA Aquaculture + UK FHI |
| PondSense Kit | **£180-£550 one-off** | Hardware + 1yr Pro subscription |

## Get started

- **[Buy PondSense kit](https://meok.ai/pondsense)** — ships from UK, 7-day fit, 1yr Pro included
- **[Try free monitor MCP](https://meok.ai/pricing)** — 60 calls/hour, no card
- **[Open hardware repo](https://github.com/CSOAI-ORG/meok-pondsense)** — fork, modify, sell. CERN-OHL-S-2.0.

---

*MEOK AI Labs · Welfare-first. Open-hardware-friendly. UK-built.*
