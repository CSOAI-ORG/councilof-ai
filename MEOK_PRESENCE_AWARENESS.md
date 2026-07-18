# MEOK Presence & Awareness — biometrics · attention · gesture · world-model (research + architecture, 2026-06-25)

Your sovereign **knows you're there**, recognises **you vs someone else**, reads **gesture + attention**, and — only if you allow it — **socialises, joins in, and learns**. All on-device, all governed by Guardian + Council + Law, every recognition signed (SIGIL). The interaction data is the moat.

## 1. The real enabling stack (grounded — these exist, on-device, in-browser)
| Sense | Tech (real, OSS / browser) | Gives |
|---|---|---|
| **Presence + identity** | `face-api.js` (TF.js) — detect + 128-d face **descriptor** → owner vs stranger; getUserMedia | "someone's here", "it's you" vs "it's not you" |
| **Expression / mood** | MediaPipe **Face Landmarker** (blendshapes: smile, brow, blink) | emotional read |
| **Gesture** | MediaPipe **Gesture Recognizer** (named: Open_Palm, Closed_Fist, Thumb_Up…) + Hands (21 landmarks) | gesture commands, sign |
| **Attention / gaze** | **WebGazer.js** (webcam eye-tracking, self-calibrating, on-device) | "looking at screen" / "looked away" |
| **Body / multi-person** | MediaPipe **Holistic / Pose** (540+ keypoints) | how many people, posture, meeting context |
| **Voice presence** | Web Speech API + on-device diarization | who's speaking |

**All run locally — no video leaves the device.** That's the privacy posture and the whole point.

## 2. The world model (the awareness state machine)
A small on-device state: `{ people: n, owner_present: bool, identities: [...], attention: 0–1, gesture, mood, mode }`.
- **Owner alone, attentive** → full access; the dock is proactive.
- **Owner looked away** → pause sensitive displays, lower the voice.
- **Stranger appears (unrecognised face)** → **Guardian locks sensitive surfaces** (revenue, family, data) — privacy by default.
- **Owner + known others** → **meeting / social mode**: the AI characters may greet + join in.
- **Owner away, stranger only** → lock + log.

## 3. Why it MUST be governed (this is law, not a feature)
- **Biometric data = GDPR Art. 9 special category + US BIPA** → requires **explicit consent**, purpose limit, and (strongly) **on-device processing**. (Sources below.)
- So MEOK ties it to the estate that's already built:
  - **MEOK Law** → flags Art. 9 / BIPA / state biometric law for the user's jurisdiction (the law stack already knows where they are).
  - **Guardian** → the gate: stranger → no sensitive data; child present → stricter; consent enforced.
  - **Council (BFT)** → ratifies the consent + any "socialise/learn" opt-in before it's active.
  - **SIGIL** → every recognition/learn event is a signed, hash-chained hop → a verifiable audit ("who was seen, when, what was shown, did they consent").

## 4. Socialise / learn / join in (consent-gated) — and the moat
- **If the user opts in**, in meeting/social mode the sovereign characters can greet, converse, take notes, join the meeting — like a participant.
- **The moat** = the consented interaction/awareness dataset (presence patterns, gestures, meeting dynamics, who-engages-how) — fuels the per-feature queens + the track-record hive. **Consent-first, on-device, signed** — the data stays the user's; the *learned model* is the sovereign asset.
- Nothing learns or socialises without an explicit, Council-ratified opt-in. Off by default.

## 5. Honest real-vs-aspirational
- **Real now (v1, browser):** presence, owner-vs-stranger (face descriptor match), gesture, gaze, expression, multi-person count — all on-device. Guardian lock-on-stranger is buildable today.
- **Aspirational / harder:** robust identity at scale (lighting, spoofing → liveness needed), a rich "world model" beyond the state machine, true meeting-grade diarization, and the humanoid/AR extension. Don't oversell.
- **Owner-gated:** camera/mic permission (the user grants it), the consent opt-in, and the runtime to persist/learn (GCP VM).

## Sources
- MediaPipe Tasks (face/gesture/pose, on-device): https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js · https://research.google/blog/mediapipe-holistic-simultaneous-face-hand-and-pose-prediction-on-device/
- face-api.js (detect + recognise, in-browser, TF.js): https://github.com/justadudewhohacks/face-api.js
- WebGazer.js (on-device webcam eye-tracking): https://webgazer.cs.brown.edu/
- Biometric privacy (GDPR Art. 9 / BIPA, gaze tracking): https://perkinscoie.com/insights/blog/intricacies-gaze-tracking-balancing-personalization-and-privacy
