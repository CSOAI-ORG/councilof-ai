"""GSPC Governance Leaderboard — fetches live signed board from councilof.ai."""
import json
import urllib.request

import gradio as gr

BOARD_URL = "https://councilof.ai/api/gspc"
EAST_WEST_URL = "https://councilof.ai/api/east-west"


def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=20) as resp:
        return json.loads(resp.read().decode())


def load_board() -> tuple[str, str]:
    try:
        board = fetch_json(BOARD_URL)
    except Exception as e:
        return f"Board unreachable: {e}", ""
    rows = []
    for axis in board.get("axes", board.get("board", [])):
        if not isinstance(axis, dict):
            continue
        name = axis.get("axis") or axis.get("name") or axis.get("id") or "?"
        leader = axis.get("leader") or axis.get("top") or "—"
        n = axis.get("n", "—")
        sep = axis.get("separation") or axis.get("mcnemar") or "—"
        rows.append(f"| {name} | {leader} | {n} | {sep} |")
    md = (
        "## Live GSPC board (from councilof.ai/api/gspc)\n\n"
        "| Axis | Leader | n | Separation |\n|------|--------|---|------------|\n"
        + "\n".join(rows)
        + "\n\n*Measurement, not certification. Refresh to re-fetch.*"
    )
    try:
        ew = fetch_json(EAST_WEST_URL)
        ew_note = f"\n\n**East-West:** {ew.get('pitch', '')} Signature: {ew.get('signatureStatus', 'UNKNOWN')}."
    except Exception:
        ew_note = ""
    return md, ew_note


with gr.Blocks(title="GSPC Governance Leaderboard") as demo:
    gr.Markdown(
        "# GSPC Governance Leaderboard\n"
        "13 measured of 14 · signed measurement credential · [councilof.ai](https://councilof.ai/gspc-scoreboard)"
    )
    board_md = gr.Markdown()
    ew_md = gr.Markdown()
    refresh = gr.Button("Refresh live board")
    refresh.click(load_board, outputs=[board_md, ew_md])
    demo.load(load_board, outputs=[board_md, ew_md])

if __name__ == "__main__":
    demo.launch()
