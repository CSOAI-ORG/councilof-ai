# Amplitude-driven Lip-Sync Spec
**CSOAI Ltd UK 16939677 · MIT License · 1 July 2026**

The Sovereign speaks in the HUD. The equalizer must pulse to the **real audio waveform** (Piper on-device TTS), not a fixed CSS animation. This spec defines how.

## 1. Topology

```
[Piper AudioBufferSource] ─► [AudioContext] ─► [AnalyserNode] ─► [frequencyData Uint8Array]
                                                                        │
                                                                        ▼
                              requestAnimationFrame()  ──►  [renderEqualizer(bands)]
                                                                        │
                                                                        ▼
                                          [16 .eq-bar divs scaleY = magnitude]
```

When Piper TTS is unavailable, gracefully fall back to the `.eq-bar` CSS animation (`@keyframes equalize`).

## 2. The AnalyserNode setup

```js
const ac = new AudioContext();
const source = ac.createBufferSource();
source.buffer = audioBuffer;  // decoded from /v1/audio/speech
const analyser = ac.createAnalyser();
analyser.fftSize = 64;  // 32 frequency bands
analyser.smoothingTimeConstant = 0.65;

source.connect(analyser);
analyser.connect(ac.destination);
source.start();

const N = analyser.frequencyBinCount;  // 32
const data = new Uint8Array(N);
```

## 3. The render loop

```js
function renderEqualizer() {
  if (!analyser) {
    // fallback: CSS @keyframes equalize
    document.querySelector('.equalizer').classList.add('css-driven');
    return;
  }
  analyser.getByteFrequencyData(data);

  const bars = document.querySelectorAll('.eq-bar');
  const step = Math.floor(N / bars.length);
  for (let i = 0; i < bars.length; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += data[i * step + j];
    const avg = sum / step;
    const norm = avg / 255;
    bars[i].style.transform = `scaleY(${0.15 + norm * 0.85})`;
  }

  // Resume CSS animation if Piper output stops
  if (!playing) {
    document.querySelector('.equalizer').classList.add('css-driven');
  } else {
    requestAnimationFrame(renderEqualizer);
  }
}
```

## 4. CSS fallback (`.css-driven .eq-bar`)

```css
.equalizer.css-driven .eq-bar {
  animation: equalize 1.4s ease-in-out infinite;
}
.equalizer.css-driven .eq-bar:nth-child(odd) {
  animation-delay: -0.7s;
}
@keyframes equalize {
  0%, 100% { transform: scaleY(0.18); }
  50%      { transform: scaleY(0.95); }
}
```

## 5. Performance targets

| Metric | Target | Notes |
|---|---|---|
| Frame rate | 60 fps | `requestAnimationFrame` |
| Per-frame work | < 0.5 ms | ~32 buckets × 16 bars = 512 reads |
| GC pause | 0 ms | Reuse the Uint8Array |
| Latency voice→visual | < 30 ms | AudioWorklet fetches → render |
| Memory | < 100 KB | One persistent typed array |

## 6. Methods (the API the Sovereign HUD exposes)

```ts
window.sovereignLipSync = {
  attach(audioBuffer: AudioBuffer): void
  detach(): void
  avgAmplitude(): number    // 0..1
  peak(): number             // 0..1 over 1 sec window
  bands(freqRanges: [min, max][]): number[]  // bucket averages
  fallbackToCss(): void
}
```

## 7. Integration with the HUD

The Sovereign HUD already has:
- `.equalizer` container
- 16 `.eq-bar` children (5px wide, 24px tall, with `transition: transform 60ms`)

Drop-in JS:
```js
import { SovereignLipSync } from '/sovereign-os/frontend/sovereign-lipsync.js';
const lipsync = new SovereignLipSync(document.querySelector('.equalizer'));
// At TTS start:
const audioBuf = await ac.decodeAudioData(ttsResponse);
lipsync.attach(audioBuf);
// On TTS end:
lipsync.detach();  // falls back to CSS
```

## 8. The audio pipeline

```
[POST /v1/audio/speech] → [streaming PCM/WAV]
       ↓
[MediaSource.attachPCM] or [ArrayBuffer.decodeAudioData]
       ↓
[AudioBufferSource] ─► [AnalyserNode] ─► [frequencyData] ─► [renderEqualizer]
```

Piper TTS on Apple:
- Request: `POST /v1/audio/speech { model: "piper-voice-en-GB", input: ..., voice: "sovereign" }`
- Response: `audio/wav` streaming
- Sample rate: 22050 Hz (Piper default)

## 9. Edge cases

- **iOS silence policy**: AudioContext starts in "suspended" state until user gesture. Call `ac.resume()` on first click.
- **Piper TTS down**: Pure CSS animation (already wired, `.css-driven` class).
- **Audio buffer not loaded**: 16 bars at 0.18 scale (minimum).
- **Dispose**: Cancel RAF + disconnect + null references.

## 10. State diagram

```
[IDLE]
   │  attach(buf)
   ▼
[DETACHED]
   │  connect()
   ▼
[RUNNING]  ── requestAnimationFrame ──► reads frequencyData ──► updates bars
   │
   │  detach() OR piper TTS ends
   ▼
[CSS-FALLBACK]  ── @keyframes equalize ──► opacity oscillation

` # Sovereign. By design. Care Floor 0.95. BFT 12-around-1. MIT + CC0.
```
