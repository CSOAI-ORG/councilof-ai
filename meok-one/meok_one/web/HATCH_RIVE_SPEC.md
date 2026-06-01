# hatch.riv — the asset spec (drop-in, zero code change)

The cinematic hatch (`/hatch`) ships TODAY on a pure-canvas fallback. The moment a file named
**`hatch.riv`** exists at the web root (served at `/hatch.riv`), the page auto-upgrades to it —
no code change. (`hatch.html` HEAD-checks `/hatch.riv`; if present + the @rive-app/canvas runtime
loads, Rive replaces the canvas; else canvas stays. Verified: no errors when absent.)

## What the .riv needs (author in the free Rive editor → File ▸ Export ▸ .riv)
- **Artboard:** any name, fit Cover.
- **State Machine named exactly `Emergence`** with one **Number input named `stage`** (0–4):
  - 0 = Pulse (translucent orb, 4 brand colours swirling: purple #a855f7 wisdom · blue #38bdf8
    creativity · green #34d399 growth · gold #f5c542 mastery)
  - 1 = Koi awakens
  - 2 = Ascent (koi swims up the waterfall — 鯉躍龍門 Dragon Gate)
  - 3 = Gate (golden light burst / fracture)
  - 4 = Dragon hatchling (pearlescent, iridescent, horns, big innocent eyes, floating shell)
- The page sets `stage` on the input as the user advances; design transitions between those values.

## How to get the .riv (pick one)
1. **Designer** authors it in Rive (rive.app — free editor). Highest quality.
2. **Generate the art** via the ComfyUI+FLUX→TRELLIS pipeline (meok-3d-characters spec), import
   frames/vectors into Rive, wire the `Emergence`/`stage` state machine.
3. Buy a koi/dragon Rive template from the Rive community marketplace and rebrand colours.

Drop the exported file at `meok-one/meok_one/web/hatch.riv`. Done — it goes live instantly.
