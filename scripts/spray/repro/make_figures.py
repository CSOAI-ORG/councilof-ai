#!/usr/bin/env python3
"""Draw every figure in this dataset from the dataset's own files. No dependencies.

    python3 make_figures.py --bundle . --out figures

Each SVG carries, in the image, the source file it was drawn from and that file's
as_of. A figure with no producer is a picture; a figure with its producer beside it
is a reading you can redo. Nothing here is hand-placed: if a bar is not in the data,
it is not in the figure.
"""
from __future__ import annotations

import argparse
import html
import json
import pathlib
from collections import Counter, defaultdict

# One palette, colour-blind safe, legible on white. State colours are FIXED so the
# same state is the same colour in every figure.
INK, MUTE, RULE, BG = "#16181d", "#5c6470", "#d8dce3", "#ffffff"
STATE = {
    "MEASURED": "#1f6f4a", "UNMEASURED": "#8a8f98", "UNCHECKABLE": "#b45309",
    "SEPARATED": "#1d4ed8", "TIE": "#7c3aed", "UNTESTED": "#9ca3af",
    "BITCOIN_ATTESTED": "#1f6f4a", "SUBMITTED_PENDING": "#b45309", "NOT_A_PROOF": "#b91c1c",
}
FAMILY = {"gspc": "#1f6f4a", "financial": "#0e7490"}


def esc(s) -> str:
    return html.escape(str(s), quote=True)


class Svg:
    def __init__(self, w: int, h: int, title: str, subtitle: str, source: str, as_of: str):
        self.w, self.h = w, h
        self.p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" '
                  f'height="{h}" font-family="ui-sans-serif,-apple-system,Segoe UI,Helvetica,Arial,sans-serif">',
                  f'<rect width="{w}" height="{h}" fill="{BG}"/>',
                  f'<text x="28" y="40" font-size="20" font-weight="650" fill="{INK}">{esc(title)}</text>',
                  f'<text x="28" y="62" font-size="12.5" fill="{MUTE}">{esc(subtitle)}</text>']
        self.footer = f"source: {source}   ·   as_of: {as_of}   ·   Council of AI · councilof.ai · CC-BY-4.0"

    def line(self, x1, y1, x2, y2, c=RULE, w=1):
        self.p.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"/>')

    def rect(self, x, y, w, h, c, r=2, o=1.0):
        self.p.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(w,0):.1f}" height="{h:.1f}" rx="{r}" fill="{c}" opacity="{o}"/>')

    def text(self, x, y, s, size=11.5, c=INK, anchor="start", weight="400"):
        self.p.append(f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{c}" '
                      f'text-anchor="{anchor}" font-weight="{weight}">{esc(s)}</text>')

    def save(self, path: pathlib.Path):
        self.line(28, self.h - 34, self.w - 28, self.h - 34)
        self.text(28, self.h - 15, self.footer, 10, MUTE)
        self.p.append("</svg>")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("\n".join(self.p), encoding="utf-8")
        print(f"  wrote {path}")
        return path


def legend(s: Svg, x, y, pairs):
    for label, colour in pairs:
        s.rect(x, y - 9, 11, 11, colour, r=2)
        s.text(x + 16, y, label, 11, MUTE)
        x += 34 + 6.6 * len(label)


def wrap(text: str, width: int) -> list:
    """Break on word boundaries, never mid-word. A chart that hyphenates a URL is lying
    about what the string is."""
    out, line = [], ""
    for word in str(text).split():
        if line and len(line) + 1 + len(word) > width:
            out.append(line)
            line = word
        else:
            line = f"{line} {word}".strip()
    if line:
        out.append(line)
    return out


def jsonl(p: pathlib.Path):
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


# ------------------------------------------------------------------ 1. board at a glance
def fig_board(b: pathlib.Path, out: pathlib.Path):
    axes = jsonl(b / "board" / "board-axes.jsonl")
    board = json.loads((b / "board" / "board-snapshot.json").read_bytes())
    t = board["totals"]
    as_of = board["measured_on"]["date"]
    row, top = 26, 112
    s = Svg(1120, top + row * len(axes) + 86, "The GSPC board, every axis",
            f'{t["public_count"]} — {t["by_family"]["gspc"]["axes"]} gspc-family, '
            f'{t["by_family"]["financial"]["axes"]} financial/domain. n is rows behind the axis, '
            f'not one comparable sample.', "board/board-axes.jsonl", as_of)
    legend(s, 28, 90, [("gspc family", FAMILY["gspc"]), ("financial/domain family", FAMILY["financial"]),
                       ("SEPARATED", STATE["SEPARATED"]), ("TIE", STATE["TIE"]), ("UNTESTED", STATE["UNTESTED"])])
    mx = max(a.get("n") or 0 for a in axes) or 1
    x0, bw = 400, 420
    s.text(x0, top - 6, "n (rows behind the axis)", 10, MUTE)
    s.text(950, top - 6, "separation", 10, MUTE)
    s.text(1092, top - 6, "leader accuracy", 10, MUTE, anchor="end")
    for i, a in enumerate(sorted(axes, key=lambda a: -(a.get("n") or 0))):
        y = top + row * i + 18
        s.text(28, y, a["axis"], 12, INK, weight="500")
        s.text(228, y, a.get("kind", ""), 10, MUTE)
        n = a.get("n") or 0
        s.rect(x0, y - 11, bw * n / mx, 14, FAMILY.get(a.get("family"), MUTE), o=0.9)
        s.text(x0 + bw * n / mx + 8, y, f"n={n}", 11, MUTE)
        sep = a.get("separation")
        s.text(950, y, sep or "—", 11,
               STATE.get(sep, MUTE), weight="600" if sep in ("SEPARATED", "TIE") else "400")
        acc = a.get("accuracy")
        s.text(1092, y, f"{acc:.3f}" if isinstance(acc, (int, float)) else "no accuracy", 11,
               INK if isinstance(acc, (int, float)) else MUTE, anchor="end")
        s.line(28, y + 8, 1092, y + 8, "#eef0f4")
    y = top + row * len(axes) + 40
    s.text(28, y, f'{t["comparison_axes"]} model-comparison axes · {t["separated_leads"]} separated · '
                  f'{t["ties"]} TIE · {t["untested_separations"]} untested. '
                  f'Separation does not apply to the fact axes: they have no fleet and no leader.', 11, MUTE)
    s.text(28, y + 18, t["lid"], 11, INK, weight="500")
    return s.save(out / "01-board-at-a-glance.svg")


# ------------------------------------------------- 2. per-axis n, and what separation says
def fig_separation(b: pathlib.Path, out: pathlib.Path):
    axes = jsonl(b / "board" / "board-axes.jsonl")
    board = json.loads((b / "board" / "board-snapshot.json").read_bytes())
    comp = [a for a in axes if a.get("kind") == "model-comparison"]
    as_of = board["measured_on"]["date"]
    s = Svg(1120, 150 + 30 * len(comp) + 96, "Sample size and separation, model-comparison axes only",
            "A TIE is a result: the lead was tested and is not statistically real. UNTESTED means "
            "no separation test has been run — it is not a tie and not a lead.",
            "board/board-axes.jsonl", as_of)
    legend(s, 28, 92, [("SEPARATED", STATE["SEPARATED"]), ("TIE", STATE["TIE"]), ("UNTESTED", STATE["UNTESTED"])])
    s.text(28, 116, "n = 30 is the quotability floor; below it a cell is published UNMEASURED, never rounded up.", 11, MUTE)
    mx = max(a.get("n") or 0 for a in comp) or 1
    x0, bw = 250, 600
    s.line(x0 + bw * 30 / mx, 138, x0 + bw * 30 / mx, 150 + 30 * len(comp), "#b45309", 1)
    s.text(x0 + bw * 30 / mx + 4, 134, "n=30", 10, "#b45309")
    for i, a in enumerate(sorted(comp, key=lambda a: -(a.get("n") or 0))):
        y = 150 + 30 * i + 18
        n = a.get("n") or 0
        sep = a.get("separation") or "UNTESTED"
        s.text(28, y, a["axis"], 12, INK, weight="500")
        s.rect(x0, y - 12, bw * n / mx, 16, STATE.get(sep, MUTE), o=0.88)
        s.text(x0 + bw * n / mx + 8, y, f"n={n}", 11, INK)
        s.text(1092, y, sep, 11, STATE.get(sep, MUTE), anchor="end", weight="600")
    c = Counter(a.get("separation") or "UNTESTED" for a in comp)
    s.text(28, 150 + 30 * len(comp) + 42,
           " · ".join(f"{k} {v}" for k, v in sorted(c.items())) +
           f"   (of {len(comp)} model-comparison axes)", 11.5, INK, weight="500")
    return s.save(out / "02-per-axis-n-and-separation.svg")


# ------------------------------------------------------- 3. Elo reference with its CIs
def fig_elo(b: pathlib.Path, out: pathlib.Path):
    elo = json.loads((b / "arena" / "elo_reference.json").read_bytes())
    lb = sorted(elo["leaderboard"], key=lambda r: -r["elo"])
    per = elo["per_axis"]
    # The honest per-axis tally, recomputed here from rank_rule — never copied.
    led = tie = unmeasured = 0
    for axis, rows in per.items():
        ranked = sorted(rows, key=lambda r: -r["winrate"])
        if not ranked:
            unmeasured += 1
        elif len(ranked) >= 2 and ranked[0]["ci"][0] > ranked[1]["ci"][1]:
            led += 1
        else:
            tie += 1
    s = Svg(1120, 214 + 34 * len(lb) + 140, "Arena Elo reference, with the interval that decides it",
            f'{elo["n_rounds"]} rounds · {elo["rounds"]["decided"]} decided · '
            f'{elo["rounds"]["ties"]} ties. Wilson 95% CI on win-rate; a leader is named only '
            f'when the top CI clears the runner-up\'s.', "arena/elo_reference.json", elo["as_of"])
    yy = 90
    for ln in wrap(elo["method"], 140) + wrap(elo["rank_rule"], 140):
        s.text(28, yy, ln, 10.5, MUTE)
        yy += 15
    x0, bw = 360, 500
    s.text(x0, 168, "win-rate with 95% Wilson CI", 10.5, MUTE)
    for g in (0, 0.25, 0.5, 0.75, 1.0):
        s.line(x0 + bw * g, 176, x0 + bw * g, 214 + 34 * len(lb) - 16, "#eef0f4")
        s.text(x0 + bw * g, 190, f"{g:.0%}", 10, MUTE, anchor="middle")
    for i, r in enumerate(lb):
        y = 214 + 34 * i
        s.text(28, y, r["model"], 12, INK, weight="500")
        s.text(330, y, f'Elo {r["elo"]:.0f}', 11, MUTE, anchor="end")
        lo, hi = r["ci"]
        s.rect(x0 + bw * lo, y - 8, bw * (hi - lo), 9, "#1d4ed8", r=4, o=0.22)
        s.line(x0 + bw * lo, y - 11, x0 + bw * lo, y + 4, "#1d4ed8", 1.5)
        s.line(x0 + bw * hi, y - 11, x0 + bw * hi, y + 4, "#1d4ed8", 1.5)
        s.rect(x0 + bw * r["winrate"] - 1.5, y - 12, 3, 17, "#1d4ed8", r=1)
        s.text(x0 + bw + 14, y, f'{r["winrate"]:.1%}  ({r["games"]} games)', 11, INK)
    y = 214 + 34 * len(lb) + 46
    s.text(28, y, f'Per-axis outcome over {len(per)} arena axes, recomputed from rank_rule: '
                  f'{led} separated leader · {tie} TIE · {unmeasured} UNMEASURED (no ranked row).',
           12, INK, weight="600")
    s.text(28, y + 22, "An overall Elo is a reading of these rounds, not a general ability score. "
                       "Ties outnumber decided rounds; that is the finding, not a defect in the chart.", 11, MUTE)
    yy = y + 42
    for ln in wrap(elo["register"], 140):
        s.text(28, yy, ln, 10.5, MUTE)
        yy += 15
    return s.save(out / "03-elo-reference-with-intervals.svg")


# ----------------------------------------------------------- 4. the supersession timeline
def fig_supersession(b: pathlib.Path, out: pathlib.Path):
    rows = jsonl(b / "cards" / "superseded.jsonl")
    cards = sum(1 for _ in (b / "cards" / "mill-cards-signed.jsonl").open())
    by_day = Counter(r["at"][:10] for r in rows if r.get("at"))
    reasons = Counter((r.get("reason") or "unstated").strip() for r in rows)
    days = sorted(by_day)
    as_of = max(r["at"] for r in rows if r.get("at"))
    s = Svg(1120, 620, "Supersession is the record, not an erratum",
            f'{len(rows)} supersessions over {cards} signed mill cards on disk. A signed card is '
            f'never edited: a corrected measurement is a NEW card and the old bytes stay, still '
            f'verifiable.', "cards/superseded.jsonl", as_of)
    x0, x1, y0, hmax = 44, 1080, 330, 190
    mx = max(by_day.values()) or 1
    bw = max(3.0, (x1 - x0) / max(len(days), 1) - 3)
    for i, d in enumerate(days):
        x = x0 + i * ((x1 - x0) / max(len(days), 1))
        h = hmax * by_day[d] / mx
        s.rect(x, y0 - h, bw, h, "#7c3aed", r=2, o=0.85)
        if len(days) <= 24 or i % max(1, len(days) // 12) == 0:
            s.text(x + bw / 2, y0 + 16, d[5:], 9.5, MUTE, anchor="middle")
        s.text(x + bw / 2, y0 - h - 6, str(by_day[d]), 9.5, MUTE, anchor="middle")
    s.line(x0, y0, x1, y0, RULE)
    s.text(28, y0 + 44, f"{len(days)} days carry a supersession; the busiest is "
                        f"{max(by_day, key=by_day.get)} with {max(by_day.values())}.", 11.5, INK)
    y = y0 + 74
    s.text(28, y, "why cards were superseded — every reason is published with the supersession", 11, MUTE, weight="600")
    for k, v in reasons.most_common(4):
        y += 20
        first = True
        for ln in wrap(k, 132):
            s.text(28, y, f"{v:5d}   {ln}" if first else f"        {ln}", 10.5, INK)
            first = False
            y += 14
        y -= 14
    return s.save(out / "04-supersession-timeline.svg")


# ------------------------------------------------------------------- 5. OTS proof states
def fig_ots(b: pathlib.Path, out: pathlib.Path):
    rows = jsonl(b / "chain" / "ots-proof-states.jsonl")
    pub = json.loads((b / "chain" / "ots-manifest-as-published.json").read_bytes())
    c = Counter(r["anchor_state"] for r in rows)
    total = sum(c.values())
    s = Svg(1120, 500, "What the OpenTimestamps proofs actually say today",
            f'{total} .ots files under public/. A calendar-pending proof is a SUBMITTED REQUEST, '
            f'not evidence of a time. Only a Bitcoin attestation is that.',
            "chain/ots-proof-states.jsonl", pub["as_of"])
    x0, y0, bw, h = 28, 150, 1064, 46
    x = x0
    for state in ("BITCOIN_ATTESTED", "SUBMITTED_PENDING", "NOT_A_PROOF"):
        n = c.get(state, 0)
        if not n:
            continue
        w = bw * n / total
        s.rect(x, y0, w, h, STATE[state], r=3)
        # Label inside the segment only when it fits. A caption that runs past its own bar
        # onto the next one reads as if it belonged to the neighbour.
        label = f"{state.replace('_', ' ').lower()}  {n}"
        if w > 8.0 * len(label):
            s.text(x + 12, y0 + 29, label, 12.5, "#ffffff", weight="600")
        elif w > 7.5 * len(str(n)) + 20:
            s.text(x + w / 2, y0 + 29, str(n), 12.5, "#ffffff", anchor="middle", weight="600")
        x += w
    s.text(x0, y0 - 12, "every .ots under public/, by the state in its own bytes", 11, MUTE)
    y = y0 + h + 42
    for state in ("BITCOIN_ATTESTED", "SUBMITTED_PENDING", "NOT_A_PROOF"):
        s.rect(x0, y - 11, 12, 12, STATE[state], r=2)
        s.text(x0 + 20, y, f'{state.replace("_", " ").lower()}: {c.get(state, 0)}'
                           f'  ({c.get(state, 0) / total:.1%})', 12, INK)
        y += 22
    cov = Counter(r["covers_named_file"] for r in rows if r["naming"] == "file-named")
    y += 12
    s.text(x0, y, f'Of the file-named proofs — the ones that assert they cover the file beside them — '
                  f'{cov.get(True, 0)} cover it and {cov.get(False, 0)} do not.', 11.5, INK)
    s.text(x0, y + 20, "A proof that does not cover its own file is an anchor without a subject. "
                       "It is counted here rather than dropped.", 11, MUTE)
    s.text(x0, y + 46, f'The estate\'s own manifest scans {" and ".join(pub["dirs_scanned"])} only and '
                       f'publishes {pub["counts"]["proofs"]} proofs, '
                       f'{pub["counts"]["bitcoin_attested"]} Bitcoin-attested, '
                       f'{pub["counts"]["calendar_pending"]} calendar-pending.', 11, MUTE)
    s.text(x0, y + 64, "This figure scans all of public/. The two totals differ by SCOPE, not by "
                       "disagreement; neither corrects the other.", 11, MUTE)
    return s.save(out / "05-ots-proof-states.svg")


# ------------------------------------------------------- 6. the three (four) card corpora
def fig_corpora(b: pathlib.Path, out: pathlib.Path):
    rows = jsonl(b / "cards" / "card-corpora.jsonl")
    s = Svg(1120, 150 + 70 * len(rows) + 76, "Card counts: separate corpora, never a sum",
            "Each bar is a different set of bytes with its own count and its own meaning. "
            "Identifier overlap between them is zero, so adding them produces a number about nothing.",
            "cards/card-corpora.jsonl", rows[1].get("as_of") or "")
    mx = max(r["value"] or 0 for r in rows) or 1
    x0, bw = 300, 440
    for i, r in enumerate(rows):
        y = 150 + 70 * i
        s.text(28, y, str(r["name"]), 12.5, INK, weight="600")
        s.text(28, y + 17, str(r["artifact"]), 10.5, MUTE)
        v = r["value"] or 0
        s.rect(x0, y - 13, bw * v / mx, 20, STATE["MEASURED"] if r["kind"] == "measured" else "#334155", r=3, o=0.85)
        s.text(x0 + bw * v / mx + 10, y, f'{v}', 13, INK, weight="600")
        s.text(x0 + bw * v / mx + 10 + 12 + 9 * len(str(v)), y, f'kind: {r["kind"]}', 10.5, MUTE)
        yy = y + 26
        for ln in wrap(r["means"] or "", 104)[:3]:
            s.text(x0, yy, ln, 10.5, MUTE)
            yy += 14
    s.text(28, 150 + 70 * len(rows) + 34,
           f'/api/state -> corpus_relation: {rows[0]["relationship"]}, '
           f'identifier_overlap {rows[0]["identifier_overlap_with_other_corpora"]}.', 11.5, INK, weight="500")
    return s.save(out / "06-card-corpora-never-a-sum.svg")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bundle", default=".")
    ap.add_argument("--out", default="figures")
    a = ap.parse_args()
    b, out = pathlib.Path(a.bundle), pathlib.Path(a.out)
    made = [fig_board(b, out), fig_separation(b, out), fig_elo(b, out),
            fig_supersession(b, out), fig_ots(b, out), fig_corpora(b, out)]
    (out / "FIGURES.md").write_text(
        "# Figures\n\nEvery figure in this directory was drawn by `make_figures.py` from the "
        "dataset's own files at publish time. Each SVG prints its source file and that file's "
        "`as_of` along its bottom edge. To redo any of them:\n\n"
        "```\npython3 make_figures.py --bundle . --out figures\n```\n\n"
        + "".join(f"- `{p.name}`\n" for p in made), encoding="utf-8")
    print(f"  wrote {out / 'FIGURES.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
