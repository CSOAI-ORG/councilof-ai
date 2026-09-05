#!/usr/bin/env python3
"""social-preview.py — 1280x640 PNG for the GitHub social preview.

White ground, one green (#16a34a), the lid wordmark CS·O·AI with the O in green, the live lid
sentence, and a derived stamp. Reads totals.lid from https://councilof.ai/api/gspc at run time;
nothing is typed. Refuses to draw if the board does not answer.

Usage: social-preview.py docs/github/social-preview.png
"""
import datetime as dt
import json
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 640
GREEN = (0x16, 0xA3, 0x4A)   # #16a34a — the owner's word, 2026-09-05
INK = (17, 24, 39)
MUTED = (107, 114, 128)
RULE = (229, 231, 235)


def font(size, bold=False):
    for p in ("/System/Library/Fonts/SFNS.ttf", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(p, size, index=1 if (bold and p.endswith(".ttc")) else 0)
        except Exception:  # noqa: BLE001
            continue
    return ImageFont.load_default()


def wrap(d, text, f, max_w, sep=" · "):
    parts = [p.strip() for p in text.split("·")]
    lines, line = [], ""
    for p in parts:
        cand = (line + sep + p) if line else p
        if d.textlength(cand, font=f) > max_w and line:
            lines.append(line)
            line = p
        else:
            line = cand
    if line:
        lines.append(line)
    return lines


def main(out):
    req = urllib.request.Request("https://councilof.ai/api/gspc", headers={"User-Agent": "csoai-social-preview/1.1"})
    with urllib.request.urlopen(req, timeout=40) as r:
        g = json.load(r)
    lid = g["totals"]["lid"]

    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    x0 = 80

    # the lid wordmark: CS O AI, the O in green
    fw = font(120, True)
    y = 72
    x = x0
    for chunk, colour in (("CS", INK), ("O", GREEN), ("AI", INK)):
        d.text((x, y), chunk, font=fw, fill=colour)
        x += d.textlength(chunk, font=fw)
    d.text((x + 28, y + 62), "Council of AI", font=font(40), fill=MUTED)

    d.line([(x0, 236), (W - x0, 236)], fill=GREEN, width=4)

    # the lid, verbatim
    fl = font(44, True)
    y = 268
    for line in wrap(d, lid, fl, W - 2 * x0):
        d.text((x0, y), line, font=fl, fill=INK)
        y += 58

    fm = font(26)
    y += 18
    for line in wrap(d, "Measurement, not certification · Ed25519-signed cards · signed Merkle root · witnessed in a public log · corrections ledger · verify free, no login",
                     fm, W - 2 * x0, sep="  ·  "):
        d.text((x0, y), line, font=fm, fill=MUTED)
        y += 36

    d.line([(x0, H - 92), (W - x0, H - 92)], fill=RULE, width=2)
    stamp = "derived " + dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z") + "  ·  GET councilof.ai/api/gspc"
    d.text((x0, H - 68), stamp, font=font(22), fill=MUTED)
    tag = "github.com/CSOAI-ORG"
    d.text((W - x0 - d.textlength(tag, font=font(22, True)), H - 68), tag, font=font(22, True), fill=GREEN)
    img.save(out, "PNG", optimize=True)
    print(out, img.size)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "social-preview.png")
