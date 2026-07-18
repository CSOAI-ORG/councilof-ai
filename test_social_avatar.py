#!/usr/bin/env python3
"""
test_social_avatar.py
=====================
25 tests covering the 3 social avatar features for MEOK OS v2
(Tasks 1-3 of the social avatar sprint, Sat 4 Jul launch).

7 archetypes (5) + 8 import sources (10) + 8 social platforms (10) = 25

Static analysis of the 3 HTML pages — verifying:
  • Files exist with the right path
  • Required DOM hooks present
  • Required JS module shape (window.MEOKAvatar / MEOKImport / MEOKSocial)
  • Static invariants (8750 combos, 8 sources, 8 platforms, SIGIL, OCEAN, etc.)

Run:  python3 test_social_avatar.py -v
Exit: 0 on all pass, 1 on any fail.
"""
from __future__ import annotations
import re
import sys
import time
from pathlib import Path
from typing import List, Tuple, Callable


# ---------- ANSI / I/O ----------
USE_COLOR = sys.stdout.isatty()
def C(code: str, s: str) -> str:
    return f"\033[{code}m{s}\033[0m" if USE_COLOR else s
def GREEN(s): return C("32", s)
def RED(s):   return C("31", s)
def DIM(s):   return C("2", s)
def BOLD(s):  return C("1", s)
def CYAN(s):  return C("36", s)


# ---------- Paths ----------
ROOT         = Path(__file__).resolve().parent
AVATAR_HTML  = ROOT / "csoai-os" / "meok-home" / "public" / "avatars" / "meok-avatar-style.html"
IMPORT_HTML  = ROOT / "csoai-os" / "meok-home" / "public" / "avatars" / "avatar-import.html"
SOCIAL_HTML  = ROOT / "csoai-os" / "meok-home" / "public" / "avatars" / "social-connect.html"


# ---------- Test registry ----------
TESTS: List[Tuple[str, Callable]] = []

def test(name: str):
    def wrap(fn):
        TESTS.append((name, fn))
        return fn
    return wrap


# ---------- Helpers ----------
def must_exist(p: Path, label: str):
    if not p.exists():
        raise AssertionError(f"{label} missing: {p}")
    if p.stat().st_size < 1000:
        raise AssertionError(f"{label} too small ({p.stat().st_size}B): {p}")

def must_contain(p: Path, needle: str, label: str, n: int = 1):
    txt = p.read_text(encoding="utf-8", errors="ignore")
    count = txt.count(needle)
    if count < n:
        raise AssertionError(f"{label} expected >={n} of {needle!r}, found {count}")


# ============================================================================
#                          TEST CASES (25 total)
# ============================================================================

# ---------- Group 1: Files exist + line counts ----------
@test("S1: all 3 avatar HTML files exist with target sizes")
def _():
    must_exist(AVATAR_HTML, "meok-avatar-style.html")
    must_exist(IMPORT_HTML, "avatar-import.html")
    must_exist(SOCIAL_HTML, "social-connect.html")
    assert AVATAR_HTML.stat().st_size >= 30_000, "Task 1 too small"
    assert IMPORT_HTML.stat().st_size >= 20_000, "Task 2 too small"
    assert SOCIAL_HTML.stat().st_size >= 15_000, "Task 3 too small"


# ---------- Group 2: Apple-style Memoji (TASK 1 — 5 tests) ----------
@test("A1: archetype library has all 7 archetypes")
def _():
    txt = AVATAR_HTML.read_text(encoding="utf-8", errors="ignore")
    for arch in ["sovereign", "guardian", "scout", "strategist",
                 "creator", "companion", "sage"]:
        assert 'id:"' + arch + '"' in txt, f"missing archetype: {arch}"

@test("A2: combination math — 7 * 5^4 = 8750 present in UI + comment")
def _():
    txt = AVATAR_HTML.read_text(encoding="utf-8", errors="ignore")
    assert "8,750" in txt or "8750" in txt, "8,750 not displayed"
    assert "7 × 5 × 5 × 5 × 5" in txt or "7 * 5 * 5 * 5 * 5" in txt, "combo formula missing"

@test("A3: 5 skin tones x 5 hair x 5 face x 5 outfit each defined")
def _():
    txt = AVATAR_HTML.read_text(encoding="utf-8", errors="ignore")
    for arr in ["SKIN_TONES", "HAIR_STYLES", "FACE_SHAPES", "OUTFITS"]:
        assert "const " + arr in txt, f"missing array {arr}"
    skin_ids = ["porcelain", "ivory", "sand", "terracotta", "obsidian"]
    hair_ids = ["swept", "curly", "long", "fade", "crown"]
    for s in skin_ids:
        assert 'id:"' + s + '"' in txt, f"missing skin tone: {s}"
    for h in hair_ids:
        assert 'id:"' + h + '"' in txt, f"missing hair: {h}"

@test("A4: live preview, customize, download — all 3 functions present")
def _():
    txt = AVATAR_HTML.read_text(encoding="utf-8", errors="ignore")
    for fn in ["function renderAvatar", "function setArchetype", "function setSkin",
               "function setHair", "function setOutfit", "function downloadSVG",
               "function shareAvatar", "window.MEOKAvatar"]:
        assert fn in txt, f"missing: {fn}"

@test("A5: SVG generator + sovereign stats (OCEAN, BFT, sigil) wired")
def _():
    txt = AVATAR_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["function getAvatarSVG", "renderOceanRadar", "BFT", "SIGIL",
                   'viewBox="0 0 400 440"', "skin-layer", "outfit-layer"]:
        assert needed in txt, f"missing: {needed}"


# ---------- Group 3: Avatar import (TASK 2 — 10 tests) ----------
@test("I1: 8 import sources defined (Memoji, Persona, Bitmoji, RPM, Meta, VRChat, Roblox, Rec Room)")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for src in ["apple-memoji", "vision-pro", "bitmoji", "ready-player-me",
                "meta", "vrchat", "roblox", "rec-room"]:
        assert 'id:"' + src + '"' in txt, f"missing source: {src}"
    assert "const SOURCES" in txt

@test("I2: Memoji parser — accepts zip + sticker pack expressions")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseMemojiZIP", "MEMOJI_STICKER_PACK", "expressions"]:
        assert needed in txt, f"memoji missing: {needed}"

@test("I3: Vision Pro Persona parser — USDZ + blendshapes")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseUSDZ", "USDZ (Persona)", "blendShapes"]:
        assert needed in txt, f"persona missing: {needed}"

@test("I4: Bitmoji parser — Snap OAuth + templateId")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseBitmoji", "kit.snapchat.com", "templateId"]:
        assert needed in txt, f"bitmoji missing: {needed}"

@test("I5: Ready Player Me parser — RPM API URL")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseRPM", "readyplayer.me", "morphTargets"]:
        assert needed in txt, f"rpm missing: {needed}"

@test("I6: Meta Avatars parser — Horizon Worlds GLB + Meta graph")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseMeta", "Meta Avatar SDK", "graph.meta.com"]:
        assert needed in txt, f"meta missing: {needed}"

@test("I7: VRChat parser — VRM/GLB/FBX + Avatar 3.0 components")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    assert "parseVRChat" in txt and "VRChat Avatar 3.0" in txt
    assert "visemes" in txt and "animParams" in txt
    m = re.search(r'id:"vrchat".+?accepts:\[([^\]]+)\]', txt, re.S)
    assert m, "vrchat accepts missing"
    accepts = m.group(1)
    for ext in ["vrm", "glb", "fbx"]:
        assert '"' + ext + '"' in accepts, f"vrchat missing accept .{ext}"

@test("I8: Roblox parser — JSON + accessories + scale")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseRoblox", "Roblox Avatar JSON", "bodyColors", "accessories"]:
        assert needed in txt, f"roblox missing: {needed}"

@test("I9: Rec Room parser — JSON outfit + meshRefs")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["parseRecRoom", "Rec Room Outfit", "meshRefs"]:
        assert needed in txt, f"rec room missing: {needed}"

@test("I10: SIGIL signing + OCEAN binding + queen wrapper on import")
def _():
    txt = IMPORT_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["wrapAsMEOK", "fakeSigilHash", "Ed25519", "did:csoai",
                   "randomArchetypeOcean", "q13", "Care VETO",
                   "window.MEOKImport", "dropzone"]:
        assert needed in txt, f"wrapper missing: {needed}"


# ---------- Group 4: Social connect (TASK 3 — 10 tests) ----------
@test("C1: 8 social platforms — Apple, Meta, X, LinkedIn, Snapchat, TikTok, Discord, Telegram")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for plat in ["apple", "meta", "x", "linkedin", "snapchat", "tiktok", "discord", "telegram"]:
        assert 'id:"' + plat + '"' in txt, f"missing platform: {plat}"
    assert "const PLATFORMS" in txt

@test("C2: Apple ID — Sign in with Apple + Private Relay")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["Apple ID", "Sign in with Apple", "Private Relay"]:
        assert needed in txt, f"apple missing: {needed}"

@test("C3: Meta — Facebook/Instagram/WhatsApp + Graph API")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["Meta", "Instagram", "WhatsApp", "1877F2"]:
        assert needed in txt, f"meta missing: {needed}"

@test("C4: X / Twitter — OAuth 2.0 + PKCE")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["X / Twitter", "OAuth 2.0", "PKCE"]:
        assert needed in txt, f"x missing: {needed}"

@test("C5: LinkedIn — Professional identity + headline sigil")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["LinkedIn", "Professional identity", "0A66C2"]:
        assert needed in txt, f"linkedin missing: {needed}"

@test("C6: Snapchat — Bitmoji + Creative Kit")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["Snapchat", "Bitmoji", "Creative Kit"]:
        assert needed in txt, f"snapchat missing: {needed}"

@test("C7: TikTok — Display + Content Posting APIs")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["TikTok", "Display API", "Content Posting"]:
        assert needed in txt, f"tiktok missing: {needed}"

@test("C8: Discord — Bot + Rich Presence")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["Discord", "Rich Presence", "5865F2"]:
        assert needed in txt, f"discord missing: {needed}"

@test("C9: Telegram — Login Widget + MTProto")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["Telegram", "Login Widget", "MTProto"]:
        assert needed in txt, f"telegram missing: {needed}"

@test("C10: Mock OAuth flow + sovereign bundle + privacy")
def _():
    txt = SOCIAL_HTML.read_text(encoding="utf-8", errors="ignore")
    for needed in ["function connect", "function publish", "function buildBundle",
                   "function copyBundle", "function downloadSVG", "function schedule",
                   "window.MEOKSocial", "Publish all", "did-display", "did:csoai",
                   "privacy-row", "Care VETO", "SIGIL", "BFT"]:
        assert needed in txt, f"flow missing: {needed}"
    # ensure 7 privacy rows
    assert txt.count("privacy-row") >= 7, f"only {txt.count('privacy-row')} privacy rows (need 7+)"


# ============================================================================
#                                  RUN
# ============================================================================
PASSED: List[str] = []
FAILED: List[Tuple[str, str]] = []

def run():
    START = time.time()
    print(BOLD(CYAN("\n[dragon] MEOK SOCIAL AVATAR — TEST SUITE\n")))
    print(DIM(f"   {AVATAR_HTML.parent}\n"))

    current_section = ""
    for name, fn in TESTS:
        section_name = {
            "S": "Group 1 — Files & line counts",
            "A": "Group 2 — Apple-style Memoji avatar (Task 1)",
            "I": "Group 3 — Avatar import from 8 sim worlds (Task 2)",
            "C": "Group 4 — Social media connection (Task 3)",
        }.get(name[0], "Other")
        if section_name != current_section:
            print()
            print(CYAN(BOLD(">")) + " " + BOLD(section_name))
            current_section = section_name
        try:
            fn()
            PASSED.append(name)
            print(f"  {GREEN('[ok]')} {name}")
        except AssertionError as e:
            FAILED.append((name, str(e)))
            print(f"  {RED('[fail]')} {name} — {e}")
        except Exception as e:
            FAILED.append((name, f"{type(e).__name__}: {e}"))
            print(f"  {RED('[fail]')} {name} — {type(e).__name__}: {e}")

    total = len(PASSED) + len(FAILED)
    pct = (len(PASSED) / max(total, 1)) * 100
    print(BOLD(CYAN("\n-----------------------------------------------")))
    if FAILED:
        print(f"  {RED(BOLD(str(len(PASSED))) + '/' + str(total) + ' PASSED')} · {RED(str(len(FAILED)) + ' FAIL')}  •  time {time.time()-START:.2f}s")
        print(RED(BOLD("\n[fail] FAILED tests:")))
        for n, e in FAILED:
            print(f"  {RED('[fail]')} {n}: {e}")
    else:
        print(f"  {GREEN(BOLD(str(len(PASSED)) + '/' + str(total) + ' PASSED'))} ({pct:.0f}%)  •  time {time.time()-START:.2f}s")
    print()
    return 0 if not FAILED else 1


if __name__ == "__main__":
    sys.exit(run())
