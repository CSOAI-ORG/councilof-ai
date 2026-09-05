#!/usr/bin/env python3
"""social-preview.py — 1280x640 PNG for the GitHub social preview. White + green, the live lid.
Reads totals.lid from https://councilof.ai/api/gspc at run time; never typed.
Usage: social-preview.py docs/github/social-preview.png
"""
import json, sys, urllib.request, datetime as dt
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 640
GREEN = (16, 185, 129)
INK = (17, 24, 39)
MUTED = (107, 114, 128)

def font(size, bold=False):
    for p in ("/System/Library/Fonts/SFNS.ttf", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf",
              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(p, size, index=1 if (bold and p.endswith(".ttc")) else 0)
        except Exception:
            continue
    return ImageFont.load_default()

def main(out):
    req = urllib.request.Request("https://councilof.ai/api/gspc", headers={"User-Agent": "csoai-social-preview/1.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        g = json.load(r)
    t = g["totals"]
    lid = t["lid"]
    img = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 18, H], fill=GREEN)
    d.text((72, 64), "Council of AI", font=font(64, True), fill=INK)
    d.text((72, 140), "independent AI-measurement body  ·  measurement, not certification", font=font(28), fill=MUTED)
    d.rectangle([72, 200, 1208, 204], fill=GREEN)
    # lid, wrapped on the middle dots
    parts = [p.strip() for p in lid.split("·")]
    y = 236
    f = font(40, True)
    line = ""
    for p in parts:
        cand = (line + "  ·  " + p) if line else p
        if d.textlength(cand, font=f) > 1120 and line:
            d.text((72, y), line, font=f, fill=INK); y += 56; line = p
        else:
            line = cand
    if line:
        d.text((72, y), line, font=f, fill=INK); y += 56
    y += 18
    row = f"{t['axes']} axes on the board  ·  {t['measured_axes']} MEASURED  ·  {t['unmeasured_axes']} UNMEASURED  ·  {t['model_fleets']} model fleets  ·  {t['fact_runs']} fact runs"
    d.text((72, y), row, font=font(28), fill=GREEN)
    y += 60
    d.text((72, y), "Ed25519-signed cards  ·  signed Merkle root  ·  Rekor-witnessed  ·  public corrections ledger  ·  verify free, no login", font=font(24), fill=MUTED)
    stamp = "derived " + dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z") + "  ·  GET councilof.ai/api/gspc"
    d.text((72, H - 64), stamp, font=font(22), fill=MUTED)
    d.text((W - 72 - d.textlength("github.com/CSOAI-ORG", font=font(22, True)), H - 64), "github.com/CSOAI-ORG", font=font(22, True), fill=GREEN)
    img.save(out, "PNG", optimize=True)
    print(out, img.size)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "social-preview.png")
