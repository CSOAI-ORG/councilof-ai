#!/usr/bin/env python3
"""Generate per-video production packs from SOVOS_VIDEO_BIBLE.md.

For each of the 12 videos emits:
  video-XX-<slug>/script.md         — full original script block (shot cues intact)
  video-XX-<slug>/narration.txt     — clean TTS-ready narration (cues stripped)
  video-XX-<slug>/image-prompts.txt — one Stable Diffusion prompt per line
  video-XX-<slug>/video-XX.ipynb    — Colab-ready notebook (gTTS + SD, prefilled)

Idempotent: re-run after editing the bible. Register note: scripts are pitch
material — keep the bible's health warning in mind before public use.
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
BIBLE = HERE / "SOVOS_VIDEO_BIBLE.md"

VIDEO_RE = re.compile(r"^## 🎬 VIDEO (\d+): (.+?)$", re.M)


def slugify(title: str) -> str:
    t = title.split("—")[-1] if "—" in title else title
    t = re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
    return t[:48]


def parse_videos(text: str):
    matches = list(VIDEO_RE.finditer(text))
    for idx, m in enumerate(matches):
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        section = text[m.start():end]
        num = int(m.group(1))
        title = m.group(2).strip()

        sm = re.search(r"Script \([^)]*\):\*{0,2}\s*```\n(.*?)```", section, re.S)
        script = sm.group(1).strip() if sm else ""

        prompts = []
        pm = re.search(r"\*\*Image Prompts[^:]*:\*\*\s*\n(.*?)(?:\n---|\Z)", section, re.S)
        if pm:
            for line in pm.group(1).splitlines():
                lm = re.match(r"\s*\d+\.\s*`(.+?)`", line)
                if lm:
                    prompts.append(lm.group(1))
        yield num, title, script, prompts, section.strip()


def narration_from_script(script: str) -> str:
    """Strip shot cues / stage directions → pure narration for TTS."""
    out = []
    for raw in script.splitlines():
        line = raw.strip()
        if not line or line.startswith("[") or line == "NARRATOR:":
            continue
        out.append(line)
    return "\n".join(out)


def notebook_json(num: int, title: str, narration: str, prompts: list[str]) -> dict:
    slug_title = f"Video {num}: {title}"

    def md_cell(src: str) -> dict:
        return {"cell_type": "markdown", "metadata": {},
                "source": src.splitlines(keepends=True)}

    def code_cell(src: str) -> dict:
        return {"cell_type": "code", "metadata": {}, "execution_count": None,
                "outputs": [], "source": src.splitlines(keepends=True)}

    tts_code = f'''# {slug_title} — narration (gTTS draft; re-record on phone for final)
!pip install -q gTTS

from gtts import gTTS
import IPython.display as ipd

script = """
{narration}
"""

tts = gTTS(text=script, lang="en", slow=False)
tts.save("video{num:02d}_narration.mp3")
ipd.Audio("video{num:02d}_narration.mp3")
'''

    prompts_py = ",\n    ".join(json.dumps(p) for p in prompts)
    img_code = f'''# {slug_title} — keyframe images (Stable Diffusion, free Colab T4)
!pip install -q diffusers transformers accelerate

from diffusers import StableDiffusionPipeline
import torch

pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5", torch_dtype=torch.float16
).to("cuda")

prompts = [
    {prompts_py}
]

for i, prompt in enumerate(prompts, 1):
    image = pipe(prompt).images[0]
    image.save(f"video{num:02d}_image{{i}}.png")
    print(f"saved video{num:02d}_image{{i}}.png — {{prompt}}")
'''

    return {
        "nbformat": 4, "nbformat_minor": 5,
        "metadata": {
            "colab": {"provenance": []},
            "kernelspec": {"name": "python3", "display_name": "Python 3"},
            "accelerator": "GPU",
        },
        "cells": [
            md_cell(f"# 🎬 {slug_title}\n\nGenerated from `SOVOS_VIDEO_BIBLE.md` "
                    f"(councilof-ai/docs/video-bible). Run top-to-bottom on a free Colab T4.\n\n"
                    f"**Register check before publishing:** measured claims only — see the bible's health warning."),
            md_cell("## 1. Narration track"),
            code_cell(tts_code),
            md_cell("## 2. Keyframe images"),
            code_cell(img_code),
            md_cell("## 3. Assemble\n\nDrop the MP3 + PNGs into CapCut/iMovie, "
                    "or `ffmpeg -framerate 1/8 -i video%02d_image%d.png -i narration.mp3 -c:v libx264 -pix_fmt yuv420p out.mp4`."),
        ],
    }


def main() -> None:
    text = BIBLE.read_text()
    count = 0
    for num, title, script, prompts, section in parse_videos(text):
        slug = slugify(title)
        vdir = HERE / f"video-{num:02d}-{slug}"
        vdir.mkdir(exist_ok=True)

        (vdir / "script.md").write_text(section + "\n")
        narration = narration_from_script(script)
        (vdir / "narration.txt").write_text(narration + "\n")
        (vdir / "image-prompts.txt").write_text("\n".join(prompts) + "\n")
        nb = notebook_json(num, title, narration, prompts)
        (vdir / f"video-{num:02d}.ipynb").write_text(json.dumps(nb, indent=1))
        count += 1
        print(f"video-{num:02d}-{slug}: script={len(script)}ch prompts={len(prompts)} narration={len(narration)}ch")
    print(f"\n{count} video packs generated in {HERE}")


if __name__ == "__main__":
    main()
