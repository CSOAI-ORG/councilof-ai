# MEOK — Print Manifest (QIDI X-Max 4)

All parts verified **watertight**. Printer: QIDI X-Max 4 (confirmed on bench, 2026-07-07). Nozzle
0.4 mm, layer 0.2 mm. Dimensions are the actual saved-mesh bounding boxes.

| Part file | Material | Size (mm) | Vol | Orientation | Support | Notes |
|---|---|---|---|---|---|---|
| `MEOK_capillary_coupon_stage0.stl` | PA12-CF | 60 × 22 × 50 | 26.2 cm³ | flat, grooves up | none | Stage-0 wick test; grooves r=0.5/0.75/1.0/1.5 mm |
| `MEOK_stage1_cell_body.stl` | PA12-CF | 54 × 50 × 45 | 25.8 cm³ | **boss face DOWN** | on boss ledge only | vertical floor bores print support-free; ~53 mm² boss overhang is the only real one |
| `MEOK_stage1_cell_lid.stl` | PA12-CF | 48 × 48 × 3 | 5.3 cm³ | flat | none | wiring gland Ø6 mm + vent |
| `MEOK_stage1_gasket_TPU.stl` | **TPU** | 48 × 48 × 1.5 | 0.6 cm³ | flat | none | compress-seal between body + lid |

## Slicer settings (PA-CF nylons on QIDI X-Max 4)

- **Nozzle temp:** 280–300 °C (PA12-CF); **bed:** 60–70 °C; enclosure/chamber heat ON.
- **Dry the filament** — PA nylons are hygroscopic; wet filament ruins CF prints. 60 °C ≥ 6 h before.
- **Hardened steel nozzle** — CF is abrasive; brass wears out fast.
- **Walls:** ≥ 3 perimeters for watertightness (the cell must hold water). **Infill ≥ 40%** on the body.
- **Layer 0.2 mm**, first layer slow. All features ≥ 2.2 mm (≥ 5.5 extrusion widths) — prints reliably.
- **TPU gasket:** 220–235 °C, slow (20–30 mm/s), no/low retraction, 100% infill for a solid seal.

## Print order

1. `MEOK_capillary_coupon_stage0.stl` (Stage 0 — print FIRST, gate the rest).
2. After wick passes: `MEOK_stage1_cell_body.stl`, `MEOK_stage1_cell_lid.stl` (PA12-CF), `MEOK_stage1_gasket_TPU.stl` (TPU).

## Post-print

- [ ] Leak-test the assembled body with plain water before wiring electronics.
- [ ] Deburr the electrode feed-throughs (Ø2.2 mm) and well (Ø3.2 mm) if the CF leaves whiskers.
