# 🐉 SOVOS Video Bible — Production Suite

Canonical source: `SOVOS_VIDEO_BIBLE.md` (the 12-video pitch bible, recovered
from the 2026-08-01 session paste) + `SOV_TV_PORTAL_MANIFESTO.md` (Video 8's
parent manifesto).

## What's here

| Asset | Location | Use |
|---|---|---|
| The bible | `SOVOS_VIDEO_BIBLE.md` | 12 scripts, 66 image prompts, stage plan |
| Per-video script | `video-XX-*/script.md` | Shot cues + narrator lines, as written |
| Clean narration | `video-XX-*/narration.txt` | TTS-ready (cues stripped) |
| Draft audio | `video-XX-*/narration-draft.m4a` | macOS Daniel (en_GB) @175wpm — **pitch-practice drafts**, re-record on phone for final |
| Image prompts | `video-XX-*/image-prompts.txt` | One SD prompt per line, 4–8 per video |
| Colab notebook | `video-XX-*/video-XX.ipynb` | GPU runtime: gTTS narration + Stable Diffusion keyframes, prefilled |
| Generator | `generate_packs.py` | Re-run after editing the bible — idempotent |

## Workflow (Stage 1: Foundation — Aug 2–7)

1. **Practice pitching** against `narration-draft.m4a` (Videos 1+2 first).
2. **Re-record on phone** when the delivery is yours — drafts are timing/tone guides only.
3. **Keyframes:** open `video-XX.ipynb` in Colab (free T4), run top-to-bottom → MP3 + PNGs.
4. **Assemble:** CapCut/iMovie, or the ffmpeg one-liner in each notebook's final cell.
5. **Register check before anything public:** the bible contains pitch hyperbole
   ("Competitors sell courses. We sell civilizations."). External cuts must pass
   the same honesty law as the site — measured claims only (291 tools, 193 GSPC
   items, refutation ledger entry #9 as proof of the claim "we publish failures").

## Stage plan (from the bible)

| Stage | Timeline | Deliverable |
|---|---|---|
| 1: Foundation | Aug 2–7 | Record Videos 1+2 (this suite = the assets) |
| 2: Proof | Aug 8–14 | ProvBench public; Videos 3+4+5 with screen capture |
| 3: Outreach | Aug 15–31 | Videos to 10 regulators, 10 enterprises, 10 VCs |
| 4: Product | Sept | SOV TOWN alpha; Videos 6–8 |
| 5: Scale | Oct–Dec | 1,000 free users; Videos 9–12 |
| 6: Revenue | Jan 2027 | First enterprise deal; full suite on landing pages |

*Regenerated 2026-08-02 by JEEVES lane. 12/12 packs complete: scripts, prompts,
notebooks, 12/12 narration drafts (36–59s each).*
