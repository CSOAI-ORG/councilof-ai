# CONTENT STUDIO — the "marketing genius" engine
Turn the estate into a content factory: demos, explainers, auto-clips, AI news
channels, and social publishing — all open-source, all brand-safe, all sovereign.

## Pillar 1 — AUTO-CLIPPER (BUILT ✅)
`clip.py <video_base> [--n 3] [--min 8]`
- faster-whisper transcript → candidate clauses
- local Ollama (sov33-unified) scores "hook-worthiness" 0-10
- top hooks → 9:16 vertical blur-fill shorts (word-synced captions baked in)
- Feed it any of the 21 videos → shorts. Tested: Science of Verifiable Trust → 3 shorts (10s/9s/9s).
OSS refs: [AI-Youtube-Shorts-Generator](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator) (OpusClip alt),
[sparkreel](https://github.com/mimimaomao1117/sparkreel) (live-stream highlights).

## Pillar 2 — REAL PRODUCT DEMO / EXPLAINER CAPTURE
Produce real-time walkthroughs of the AG-UI and csoai.org for end-users.
- **Playwright + [argo](https://github.com/shreyaskarnik/argo)** — script a browser
  walkthrough → record → AI voiceover → cinematic explainer. (Install: `pip install playwright && playwright install chromium`)
- **OBS Studio** for manual screen capture of live demos.
- Then push through my pipeline (edge-tts narration → caption → render → poster).
OSS refs: [argo](https://github.com/shreyaskarnik/argo), [video-recorder-mcp](https://www.npmjs.com/package/@alaarab/video-recorder-mcp).

## Pillar 3 — AI NEWS CHANNELS (per-axis specialists + flagship)
`news.py <topic>` — generate a news video from any topic.
- Local LLM (sov33-unified / council-oowm-hardened) writes a ~60s news script
- edge-tts (British RyanNeural) narrates
- My cinematic render + posters/b-roll → news video
- **Channels:** one per GSPC axis (Jailbreak, Prompt Leak, Content Provenance,
  Swarm Agency, Governance, Metrology, Censorship-Resistance...) + a flagship
  **"Council of AI — The Daily Verdict"** news channel.
OSS refs: [szponciciel](https://github.com/BoatGuysDev/szponciciel) (news→TikTok multi-agent),
[ai-news-anchor](https://github.com/anaitik/ai-news-anchor).

## Pillar 4 — SOCIAL PUBLISHING
- [posteverywhere/sdk](https://github.com/posteverywhere/sdk) — schedule/publish to
  Instagram, X, TikTok, LinkedIn, YouTube, Facebook, Threads, Pinterest from code/agents
- [trypost](https://github.com/trypostit/trypost) — OSS social scheduling
- Post videos, shorts, posters; per-platform (YouTube Long, Shorts, LinkedIn, X).

## The vision
Me (JEEVES) becomes the marketing genius by running this factory:
- clips from everything (reuse content → channels)
- demos of the real product (end-user explainers)
- fresh AI news daily (per-axis + flagship)
- auto-published to owned channels
All open-source, no SaaS lock-in, no API credits, sovereign.

## Next builds (in order)
1. Pillar 2: Playwright demo walkthrough (needs `pip install playwright`, ~150MB)
2. Pillar 3: news.py generator (uses local LLM + edge-tts + my render pipeline)
3. Pillar 4: posteverywhere wiring + channel setup
