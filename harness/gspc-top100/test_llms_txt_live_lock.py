"""Shipped public/llms.txt must not freeze a board pair or 13-of-14."""
from pathlib import Path

LLMS = Path(__file__).resolve().parents[2] / "public" / "llms.txt"


def test_llms_txt_does_not_freeze_board_pair() -> None:
    text = LLMS.read_text(encoding="utf-8")
    assert "stays 22·15·7" not in text
    assert "13 of 14" not in text
    assert "totals.public_count" in text
    assert "measurement, not certification" in text.lower()
    assert "https://councilof.ai/gspc-verify" in text
    assert "https://councilof.ai/api/gspc" in text


if __name__ == "__main__":
    test_llms_txt_does_not_freeze_board_pair()
    print("PASS llms.txt live-lock")
