# 🎨 MEOK asset pipeline — stop hand-coding graphics, use connected MCP generators (2026-06-25)
Nick: "for the world design/dev we need more — connect to better MCP tools so we aren't creating baseline visual graphics." **We already have them connected.** Here's the real pipeline + the one gate to flip.

## ✅ CONNECTED right now — HuggingFace MCP (`dynamic_space`)
Verified live (`operation:discover` returned these). These replace hand-coded SVG with production art:
| Space | Use for MEOK |
|---|---|
| `mcp-tools/FLUX.1-Krea-dev` | hero art, concept art, product shots — **the translucent egg, character renders, world keyframes** |
| `mcp-tools/Qwen-Image` / `-Fast` | high-quality gen, excels at **text-in-image** (deck slides, UI mockups) |
| `evalstate/flux1_schnell` | fast drafts/ideation |
| `mcp-tools/FLUX.1-Kontext-Dev` · `Qwen-Image-Edit-*` | **edit** existing art with a prompt (iterate the egg/characters) |
| `prithivMLmods/Photo-Mate-i2i` · `fffiloni/InstantIR` | upscale / restore / watermark+object removal |
| `not-lain/background-removal` · `SAM3-Image-Segmentation` | cut characters out → drop into the 3D scene / AR |
| `fffiloni/diffusers-image-outpaint` | extend backgrounds → world panoramas |
| `zerogpu-aoti/wan2-2` · `mcp-tools/wan-2-2-first-last-frame` | **image→video** — the egg→dragon emergence as real video, not SVG |
| `ResembleAI/Chatterbox` | **TTS** — the sovereign character's voice (pairs with the dock) |
| `mcp-tools/DeepSeek-OCR` | read screenshots/scans (feeds "learn my files / understand my world") |

**⚠️ One gate:** `invoke` is currently disabled (`gradio=none` in the MCP headers). `discover` + `view_parameters` work; **generation needs that flag enabled (owner-side, quick).** Then we generate FLUX/Qwen assets directly from here.

## Other connected design MCPs (verify auth)
- **Canva MCP** (`generate-design`, `create-design-from-brand-template`, `export-design`, `autofill`) — real branded decks/graphics + export to PNG/SVG/PDF. Needs Canva auth.
- **`mcp__visualize__show_widget`** — SVG/HTML widgets/diagrams/mockups inline (already used; good for quick UI + charts, not photoreal).
- **figma** plugin — auth-gated.

## The pipeline (how it plugs into the build)
1. **Generate** the brand assets with FLUX/Qwen (egg, the 9 archetype characters, world keyframes, hive/industry icons) — matching the deck palette via prompt.
2. **Edit/upscale** with Kontext + InstantIR; **cut out** with background-removal/SAM3.
3. **Drop into** meok-town-view (textures/sprites/skybox) + MEOK_OS (replace hand-coded SVG hero/boot with generated art) + the character chooser (real renders, not sample VRMs until VRoid).
4. **Video**: wan2.2 turns the egg→dragon emergence into a real cinematic clip for the load screen / marketing.
5. **Voice**: Chatterbox gives the sovereign dock a real voice (replaces browser TTS).

## Cross-validation — ONE_OS_COMPLETE_PACKAGE.zip (absorbed)
Research docs (overlay/AR/voice/humanoid) that **confirm the Step-3.5 scan**, with small additions:
- Overlay: **Tauri v2** (desktop, primary) + **Flutter** (mobile, via `flutter_rust_bridge`) + **PWA** (web fallback) + Rust screen-capture engine. (adds Flutter for mobile vs my "companion app".)
- Voice: **faster-whisper / whisper.cpp** (streaming STT) + **Porcupine** (wake-word) + ElevenLabs/Realtime API. (adds Porcupine.)
- AR/home: ARKit + **RoomPlan** + ROS2 (humanoid nav) — matches my home-mapping pick.
→ No contradictions; fold Flutter + Porcupine into `MEOK_STEP3.5_OSS_STACK`.

## Honest status
- The HF generator MCP is **connected and reachable** (discover/params verified); generation is **one config flag** from working — I could not invoke it this session (`gradio=none`).
- Canva/figma need auth. The visualize tool works now but is SVG/HTML (not photoreal).
- This means: **we genuinely don't have to hand-code baseline graphics** — the moment invoke is enabled (or we run the FLUX/Qwen spaces directly), the OS/world get real generated art. That's the upgrade path for every visual built so far (egg, characters, hives, world).

## 🚀 READY-TO-FIRE manifest (run the instant `invoke` is enabled)
Each = one `dynamic_space invoke` on `mcp-tools/FLUX.1-Krea-dev` (1024×768, guidance 4.5, steps 26). Prompts pre-written to the deck palette (cream bg, copper/champagne-gold, spectrum aura, gold ripples):
1. **Egg hero** — "translucent iridescent egg, swirling purple/teal/emerald nebula within, cradled in an open hexagonal copper-and-gold mechanical shell engraved with archetype glyphs, spectrum aura, gold particle ripples, cream studio bg, 100mm macro, softbox lighting, premium tech branding."
2. **9 archetype characters** (one each) — Guardian (armored sentinel, periwinkle), Sage (robed scholar w/ holographic scrolls, sage-green), Creator (artist of light & paint, coral), Explorer (compass/voyager, cyan), Nurturer (verdant growth being, green), Strategist (chess-mind tactician, indigo), Seeker (telescope/cosmic, violet), Challenger (warrior, crimson), Trickster (fox-spirit, gold) — "stylised 3D character, full body, neutral pose, cream bg, champagne-gold accents, game hero render."
3. **12 hive/industry icons** — minimal copper-gold emblem per industry (finance, healthcare/MDR, GDPR, NIS2/defence, certification, media-disclosure, manufacturing, HR-fairness, frontier-AI, public-sector, ethics, all-sector) for the MEOK Earth markers + CSOAI.
4. **Emergence video** — `wan2-2-first-last-frame`: start = egg image, end = dragon image → the boot clip.
5. **Voice** — `ResembleAI/Chatterbox` TTS for the sovereign dock (replaces browser SpeechSynthesis).
→ Output: drop generated PNGs into `meok-town-view/public/characters` + `MEOK_OS` (replace hand-coded SVG hero/boot) + hive markers. Blocked only by `gradio=none`.
